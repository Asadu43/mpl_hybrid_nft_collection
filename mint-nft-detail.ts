import {
  clusterApiUrl,
  Connection,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  keypairIdentity,
  publicKey,
  Umi,
} from "@metaplex-foundation/umi";
import {
  fetchCollection,
  create,
  fetchAsset,
  AssetV1,
} from "@metaplex-foundation/mpl-core";
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import bs58 from "bs58"; // ✅ Import bs58 for Base58 encoding

export async function createAsset(umi: Umi, assets: AssetV1[]) {
  const BASE_URL = "https://nft.ikigaionsol.com/media";
  const connection = new Connection(clusterApiUrl("devnet"));

  // Load user's keypair for signing
  const user = await getKeypairFromFile("/home/asad/.config/solana/id.json");
  const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  umi.use(keypairIdentity(umiUser));

  // Convert Umi's public key to Solana PublicKey
  const userPublicKey = new PublicKey(umi.identity.publicKey.toString());

  // Token and admin addresses
  const tokenAddress = new PublicKey("84AYw2XZ5HcyWWmVNR6s4uS3baHrMLpPMnEfBTm6JkdE");
  const adminAddress = new PublicKey("AjZAU3EejSvRRp9T6gFncd6bjNGW6oRbmt2HGTfiUNR5");

  // Get associated token accounts
  const userTokenAccount = await getAssociatedTokenAddress(tokenAddress, userPublicKey);
  const adminTokenAccount = await getAssociatedTokenAddress(tokenAddress, adminAddress);

  try {
    const transferTx = new Transaction().add(
      createTransferCheckedInstruction(
        userTokenAccount,
        tokenAddress,
        adminTokenAccount,
        userPublicKey,
        5 * 10 ** 9, // 5 tokens (assuming token has 9 decimals)
        9 // Decimals
      )
    );

    console.log("Sending transfer transaction...");
    const transferSignature = await connection.sendTransaction(transferTx, [user]);

    await connection.confirmTransaction(transferSignature, "finalized");

    console.log(`Token transfer successful: ${transferSignature}`);
  } catch (error) {
    console.error("Error in token transfer:", error);
    return;
  }

  // Existing collection address
  const collectionAddress = publicKey("3SsoHng2czRKa1Prdsihgm95DdKpo9Wi2F6yB8ANN8zi");

  // Fetch the collection details
  let collection;
  try {
    collection = await fetchCollection(umi, collectionAddress);
    console.log(`Fetched Collection Address: ${collection.publicKey}`);
  } catch (error) {
    console.error("Error: Collection not found or invalid", error);
    return;
  }

  // Create an asset
  const assetAddress = generateSigner(umi);
  console.log(`Creating asset: ${assetAddress.publicKey}`);

  try {
    const transaction = create(umi, {
      asset: assetAddress,
      collection: collection,
      owner: umi.identity.publicKey,
      name: `IKIGAI NFT`,
      uri: `${BASE_URL}/IKI_1.json`,
    });

    // ✅ Ensure `txSignature` is Base58 encoded
    const txSignatureUint8Array = (await transaction.sendAndConfirm(umi)).signature;
    const txSignature = bs58.encode(txSignatureUint8Array); // Convert Uint8Array to Base58

    console.log(`Asset creation confirmed with signature: ${txSignature}`);

    // ✅ Ensure finalization before fetching asset
    await connection.confirmTransaction(txSignature, "finalized");
    console.log("Transaction finalized on-chain.");

    // ✅ Retry fetching the asset with a delay
    let asset;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        asset = await fetchAsset(umi, assetAddress.publicKey);
        console.log(`Fetched Asset Details: ${asset.publicKey}`);
        assets.push(asset);
        return assetAddress.publicKey;
      } catch (error) {
        console.warn(`Retrying asset fetch (Attempt ${attempt + 1}/5)...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    console.error("Failed to fetch asset after multiple attempts.");
    return null;
  } catch (error) {
    console.error("Error creating or fetching asset:", error);
    return null;
  }
}

(async () => {
  try {
    const assets: AssetV1[] = [];
    const umi = createUmi(clusterApiUrl("devnet"));
    const asset = await createAsset(umi, assets);
    console.log("Asset successfully created:", asset);
  } catch (error) {
    console.error("Error creating asset:", JSON.stringify(error, null, 2));
  }
})();
