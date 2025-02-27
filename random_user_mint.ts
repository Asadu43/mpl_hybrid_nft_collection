import { clusterApiUrl, Connection, PublicKey, Keypair } from "@solana/web3.js";
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
import bs58 from "bs58"; // Base58 encoding
import { getKeypairFromFile } from "@solana-developers/helpers";

export async function createAsset(umi: Umi, assets: AssetV1[]) {
  const BASE_URL = "https://nft.ikigaionsol.com/media";
  const connection = new Connection(clusterApiUrl("devnet"));

  // ✅ Load the admin keypair
  const admin = await getKeypairFromFile("/home/asad/.config/solana/id.json");
  const adminKeypair = umi.eddsa.createKeypairFromSecretKey(admin.secretKey);

  console.log(`🔹 Admin PublicKey: ${adminKeypair.publicKey}`);

  // ✅ Secret key array (User)
  const secretKeyArray = new Uint8Array([
    216, 12, 148, 233, 42, 95, 45, 198, 4, 57, 244, 253, 201, 68, 155, 22, 252,
    139, 95, 220, 85, 82, 221, 111, 167, 122, 238, 54, 42, 149, 219, 56, 228,
    191, 136, 27, 11, 142, 135, 44, 163, 126, 98, 38, 69, 240, 156, 93, 239,
    215, 21, 175, 102, 98, 59, 197, 66, 140, 196, 185, 60, 63, 206, 193,
  ]);

  const userKeypair = Keypair.fromSecretKey(secretKeyArray);
  const userPublicKey = publicKey(userKeypair.publicKey.toString());
  const privateKeyBase58 = bs58.encode(userKeypair.secretKey);
  console.log("Private Key (Base58):", privateKeyBase58);

  console.log(`🔹 User PublicKey: ${userPublicKey}`);

  // ✅ Convert user keypair to Umi format and set it as identity
  const umiUser = umi.eddsa.createKeypairFromSecretKey(userKeypair.secretKey);
  umi.use(keypairIdentity(umiUser));

  // ✅ Existing collection address
  const collectionAddress = publicKey(
    "7QufyPfmFXqGAqXMRMEHAQeL9sNw1Ajw9xD23WEvtPtL"
  );

  // ✅ Fetch collection details
  let collection;
  try {
    collection = await fetchCollection(umi, collectionAddress);
    console.log(`✅ Fetched Collection: ${collection.publicKey}`);
  } catch (error) {
    console.error("❌ Error: Collection not found", error);
    return;
  }

  // ✅ Generate an asset address
  const assetAddress = generateSigner(umi);
  console.log(`🆕 Creating asset: ${assetAddress.publicKey}`);

  try {
    const transaction = create(umi, {
      asset: assetAddress,
      collection: collection,
      owner: umiUser.publicKey, // ✅ Assigning ownership correctly
      name: `IKIGAI NFT`,
      uri: `${BASE_URL}/IKI_2.json`,
      authority: adminKeypair,
    });
    // ✅ Sign with the required authority
    umi.use(keypairIdentity(adminKeypair));
    // ✅ Send the transaction and get signature
    const txSignatureUint8Array = (await transaction.sendAndConfirm(umi))
      .signature;
    const txSignature = bs58.encode(txSignatureUint8Array);
    console.log(`✅ Asset creation confirmed with signature: ${txSignature}`);

    // ✅ Wait for confirmation on-chain
    await connection.confirmTransaction(txSignature, "finalized");
    console.log("✅ Transaction finalized.");

    // ✅ Fetch asset with retry logic
    let asset;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        asset = await fetchAsset(umi, assetAddress.publicKey);
        console.log(`✅ Fetched Asset: ${asset.publicKey}`);
        assets.push(asset);
        return assetAddress.publicKey;
      } catch (error) {
        console.warn(`🔄 Retrying asset fetch (Attempt ${attempt + 1}/5)...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    console.error("❌ Failed to fetch asset after multiple attempts.");
    return null;
  } catch (error) {
    console.error("❌ Error creating or fetching asset:", error);
    return null;
  }
}

// ✅ Execute the function
(async () => {
  try {
    const assets: AssetV1[] = [];
    const umi = createUmi(clusterApiUrl("devnet"));
    const asset = await createAsset(umi, assets);
    console.log("✅ Asset successfully created:", asset);
  } catch (error) {
    console.error("❌ Error creating asset:", JSON.stringify(error, null, 2));
  }
})();
