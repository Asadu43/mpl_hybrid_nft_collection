import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import {
  mplHybrid,
  MPL_HYBRID_PROGRAM_ID,
} from "@metaplex-foundation/mpl-hybrid";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  fetchAsset,
  fetchCollection,
  updateV2,
} from "@metaplex-foundation/mpl-core";
import bs58 from "bs58";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { clusterApiUrl, Connection } from "@solana/web3.js";

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const collection = publicKey("FCjDZR1o7ZGneAyuxv6HcN7ENDYYSyuLcWrubTBiYVkX"); // Collection address
  const asset = publicKey("2esjtBDPFHkgCH2NnZnpMDiMhiSuWdAndqFwJrydZXWF"); // NFT Mint Address

  // Initialize Umi
  const umi = createUmi(connection.rpcEndpoint)
    .use(mplHybrid())
    .use(mplTokenMetadata());

  // Load admin keypair
  const admin = await getKeypairFromFile("/home/asad/.config/solana/id.json");
  const adminKeypair = umi.eddsa.createKeypairFromSecretKey(admin.secretKey);
  umi.use(keypairIdentity(adminKeypair));

  // Fetch and log NFT details
  const nft = await fetchAsset(umi, asset);
  console.log("NFT Details:", nft);

  // Fetch and log collection details
  const collectionDetails = await fetchCollection(umi, collection);
  console.log("Collection Details:", collectionDetails);

  // Update the asset
  const transaction = await updateV2(umi, {
    asset: asset,
    collection: collection, // Ensure this is a PublicKey or null if not applicable
    authority: umi.identity, // Admin keypair as the current authority
    newUpdateAuthority: publicKey(
      "GPwM7B7FYBnQw9zd3BurHHrhtfDJ71nhyCyA2amqzhTN"
    ), // New update authority
    primarySaleHappened: true,
    isMutable: true,
  }).sendAndConfirm(umi);

  const txSignature = bs58.encode(transaction.signature);
  console.log(`✅ Asset updated with signature: ${txSignature}`);

  // Wait for confirmation
  await connection.confirmTransaction(txSignature, "finalized");
  console.log("✅ Transaction finalized.");
})();
