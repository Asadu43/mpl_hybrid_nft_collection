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
import bs58 from "bs58";
import fs from "fs"; // ✅ Import File System for saving asset IDs

const BASE_URL = "https://nft.ikigaionsol.com/media";
const ASSET_FILE = "./created_assets.json"; // ✅ File to store created asset IDs
const MAX_ASSETS = 1000; // ✅ Max assets (1 to 1000)

// ✅ Load existing assets from file
const loadAssetIds = (): Set<number> => {
  try {
    if (fs.existsSync(ASSET_FILE)) {
      const data = fs.readFileSync(ASSET_FILE, "utf8");
      return new Set(JSON.parse(data).map(Number)); // Convert strings to numbers
    }
  } catch (error) {
    console.error("Error loading asset IDs:", error);
  }
  return new Set();
};

// ✅ Save new asset ID to file
const saveAssetId = (assetId: number) => {
  try {
    const assetIds = loadAssetIds();
    assetIds.add(assetId);
    fs.writeFileSync(ASSET_FILE, JSON.stringify([...assetIds]));
  } catch (error) {
    console.error("Error saving asset ID:", error);
  }
};

// ✅ Find the next available asset ID
const getNextAvailableAssetId = (): number | null => {
  const existingAssets = loadAssetIds();
  for (let id = 1; id <= MAX_ASSETS; id++) {
    if (!existingAssets.has(id)) return id;
  }
  return null; // ❌ No available assets left
};

export async function createAsset(umi: Umi, assets: AssetV1[]) {
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
    const transferSignature = await connection.sendTransaction(transferTx, [
      user,
    ]);
    await connection.confirmTransaction(transferSignature, "finalized");

    console.log(`Token transfer successful: ${transferSignature}`);
  } catch (error) {
    console.error("Error in token transfer:", error);
    return;
  }

  // ✅ Find the next available asset ID
  const nextAssetId = getNextAvailableAssetId();
  if (!nextAssetId) {
    console.error(
      "❌ No available assets left. All 1000 assets have been created."
    );
    return null;
  }

  const assetUri = `${BASE_URL}/IKI_${nextAssetId}.json`;
  console.log(
    `✅ Assigning next available Asset ID: ${nextAssetId} (${assetUri})`
  );

  // Existing collection address
  const collectionAddress = publicKey(
    "3SsoHng2czRKa1Prdsihgm95DdKpo9Wi2F6yB8ANN8zi"
  );

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
      name: `IKIGAI NFT #${nextAssetId}`,
      uri: assetUri, // ✅ Dynamic asset selection
    });

    // ✅ Ensure `txSignature` is Base58 encoded
    const txSignatureUint8Array = (await transaction.sendAndConfirm(umi))
      .signature;
    const txSignature = bs58.encode(txSignatureUint8Array);

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

        // ✅ Save asset ID to prevent duplicate creation
        saveAssetId(nextAssetId);
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
