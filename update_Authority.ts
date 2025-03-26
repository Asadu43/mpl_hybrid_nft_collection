import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
// Import the MPL Hybrid program and the release function for swapping assets.
import {
  MPL_HYBRID_PROGRAM_ID,
  mplHybrid,
} from "@metaplex-foundation/mpl-hybrid";
import {
  addCollectionPlugin,
  addPlugin,
  mplCore,
  transferV1,
  updateCollection,
} from "@metaplex-foundation/mpl-core";
import bs58 from "bs58";
import {
  base58,
  string,
  publicKey as publicKeySerializer,
} from "@metaplex-foundation/umi/serializers";
// Import the core Metaplex plugin for foundational functionality.

// Establish a connection to the Solana Devnet cluster.
const connection = new Connection(clusterApiUrl("devnet"));
const umi = createUmi(connection.rpcEndpoint);

// Retrieve the user's keypair from the local file system for signing transactions.
const admin = await getKeypairFromFile("/home/asad/.config/solana/id.json");
const adminKeypair = umi.eddsa.createKeypairFromSecretKey(admin.secretKey);
umi.use(keypairIdentity(adminKeypair));

// Initialize the Umi instance with the Solana connection.

const asset = publicKey("GKwBZoCwmaTmHy5F1v8QSngtXUZnZPS6kFKkeAUdTyPT");

// Convert the user's secret key into a Umi-compatible keypair.
// const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);

// Load necessary Umi plugins for token metadata, core functionality, and MPL Hybrid features.
umi.use(mplTokenMetadata());
umi.use(mplCore());
umi.use(mplHybrid());
const collectionAddress = publicKey(
  "FCjDZR1o7ZGneAyuxv6HcN7ENDYYSyuLcWrubTBiYVkX"
);
const escrowAddress = publicKey("2fefeSmeonaQQch2sMueEqFyzEg9ZEdXhvTtrCxkQNHb");

// ✅ Update Collection Authority to Escrow
const transaction = await addCollectionPlugin(umi, {
  collection: collectionAddress,
  plugin: {
    type: "UpdateDelegate",
    authority: { type: "Address", address: escrowAddress },
    additionalDelegates: [],
  },
});

const txSignatureUint8Array = (await transaction.sendAndConfirm(umi)).signature;
const txSignature = bs58.encode(txSignatureUint8Array);
console.log(`✅ Asset transfer confirmed with signature: ${txSignature}`);

// ✅ Wait for confirmation on-chain
await connection.confirmTransaction(txSignature, "finalized");
console.log("✅ Transaction finalized.");
