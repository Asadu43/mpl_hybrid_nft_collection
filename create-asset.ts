import { clusterApiUrl, Connection } from "@solana/web3.js";
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

export async function createAsset(umi: Umi) {
  const BASE_URL = "https://nft.ikigaionsol.com/media";
  const connection = new Connection(clusterApiUrl("devnet"));

  // Load user's keypair for signing
  const user = await getKeypairFromFile("/home/asad/.config/solana/id.json");
  const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  umi.use(keypairIdentity(umiUser));

  // Existing collection address
  const collectionAddress = publicKey(
    "FCjDZR1o7ZGneAyuxv6HcN7ENDYYSyuLcWrubTBiYVkX");

  // Fetch the collection details
  const collection = await fetchCollection(umi, collectionAddress);
  console.log(`Fetched Collection Address: ${collection.publicKey}`);

  // Create a single asset
  const assetAddress = generateSigner(umi);
  const transaction = create(umi, {
    asset: assetAddress, // New asset's public key
    collection: collection, // Existing collection
    owner: umi.identity.publicKey, // Owner of the asset
    name: `Asad Asset`, // Asset name
    uri: `${BASE_URL}/2.json`, // Metadata URI
  });

  // Send and confirm the transaction
  await transaction.sendAndConfirm(umi);
  console.log(`Created Asset Address: ${assetAddress.publicKey}`);

  // Fetch and log the created asset
  const asset = await fetchAsset(umi, assetAddress.publicKey);
  console.log("Fetched Asset Details:", asset);

  return asset;
}

(async () => {
  try {
    const umi = createUmi(clusterApiUrl("devnet"));
    const asset = await createAsset(umi);
    console.log("Asset successfully created:", asset.publicKey);
  } catch (error) {
    console.error("Error creating asset:", error);
  }
})();
