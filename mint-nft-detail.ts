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

export async function createAsset(umi: Umi) {
  const BASE_URL = "https://nft.ikigaionsol.com/media";
  const BASE_URL_2 = "https://nft.ikigaionsol.com/media/IKI_1.json";

  const connection = new Connection(clusterApiUrl("devnet"));

  // Load user's keypair for signing
  const user = await getKeypairFromFile("/home/asad/.config/solana/id.json");
  const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  umi.use(keypairIdentity(umiUser));

  // Convert Umi's public key to Solana PublicKey
  const userPublicKey = new PublicKey(umi.identity.publicKey.toString());

  // Token and admin addresses
  const tokenAddress = new PublicKey(
    "84AYw2XZ5HcyWWmVNR6s4uS3baHrMLpPMnEfBTm6JkdE"
  );
  const adminAddress = new PublicKey(
    "AjZAU3EejSvRRp9T6gFncd6bjNGW6oRbmt2HGTfiUNR5"
  );

  // Get associated token accounts
  const userTokenAccount = await getAssociatedTokenAddress(
    tokenAddress,
    userPublicKey
  );
  const adminTokenAccount = await getAssociatedTokenAddress(
    tokenAddress,
    adminAddress
  );

  // Transfer 5 tokens to admin
  const transferTx = new Transaction().add(
    createTransferCheckedInstruction(
      userTokenAccount, // Source account
      tokenAddress, // Mint address
      adminTokenAccount, // Destination account
      userPublicKey, // Owner
      5 * 10 ** 9, // 5 tokens (assuming token has 9 decimals)
      9 // Decimals
    )
  );

  console.log("Sending transfer transaction...");
  const transferSignature = await connection.sendTransaction(transferTx, [
    user,
  ]);
  await connection.confirmTransaction(transferSignature, "processed");
  console.log(`Token transfer successful: ${transferSignature}`);

  // Existing collection address
  const collectionAddress = publicKey(
    "3SsoHng2czRKa1Prdsihgm95DdKpo9Wi2F6yB8ANN8zi"
  );

  // Fetch the collection details
  const collection = await fetchCollection(umi, collectionAddress);
  console.log(`Fetched Collection Address: ${collection.publicKey}`);

  // Create a single asset
  const assetAddress = generateSigner(umi);
  const transaction = create(umi, {
    asset: assetAddress, // New asset's public key
    collection: collection, // Existing collection
    owner: umi.identity.publicKey, // Owner of the asset
    name: `IKIGAI NFT`, // Asset name
    uri: `${BASE_URL}/IKI_3.json`, // Metadata URI
  });

  // Send and confirm the transaction
  await transaction.sendAndConfirm(umi);
  console.log(`Created Asset Address: ${assetAddress.publicKey}`);

  return assetAddress.publicKey;
}

(async () => {
  try {
    const umi = createUmi(clusterApiUrl("devnet"));
    const asset = await createAsset(umi);
    console.log("Asset successfully created:", asset);
  } catch (error) {
    console.error("Error creating asset:", error);
  }
})();
