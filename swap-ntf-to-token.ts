import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
// Import the MPL Hybrid program and the release function for swapping assets.
import {
  MPL_HYBRID_PROGRAM_ID,
  mplHybrid,
  releaseV1,
} from "@metaplex-foundation/mpl-hybrid";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  base58,
  string,
  publicKey as publicKeySerializer,
} from "@metaplex-foundation/umi/serializers";
import bs58 from "bs58"; // Base58 encoding
// Import the core Metaplex plugin for foundational functionality.

// Establish a connection to the Solana Devnet cluster.
const connection = new Connection(clusterApiUrl("devnet"));
const umi = createUmi(connection.rpcEndpoint);

// // Retrieve the user's keypair from the local file system for signing transactions.
// const admin = await getKeypairFromFile("/home/asad/.config/solana/id.json");
// const adminKeypair = umi.eddsa.createKeypairFromSecretKey(admin.secretKey);

// Initialize the Umi instance with the Solana connection.

// Convert the user's secret key into a Umi-compatible keypair.
// const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);

// ✅ Secret key array (User)
const secretKeyArray = new Uint8Array([
  216, 12, 148, 233, 42, 95, 45, 198, 4, 57, 244, 253, 201, 68, 155, 22, 252,
  139, 95, 220, 85, 82, 221, 111, 167, 122, 238, 54, 42, 149, 219, 56, 228, 191,
  136, 27, 11, 142, 135, 44, 163, 126, 98, 38, 69, 240, 156, 93, 239, 215, 21,
  175, 102, 98, 59, 197, 66, 140, 196, 185, 60, 63, 206, 193,
]);

const userKeypair = Keypair.fromSecretKey(secretKeyArray);
const userPublicKey = publicKey(userKeypair.publicKey.toString());
const privateKeyBase58 = bs58.encode(userKeypair.secretKey);
console.log("Private Key (Base58):", privateKeyBase58);
console.log(`🔹 User PublicKey: ${userPublicKey}`);
// ✅ Convert user keypair to Umi format and set it as identity
const umiUser = umi.eddsa.createKeypairFromSecretKey(userKeypair.secretKey);
umi.use(keypairIdentity(umiUser));
// Load necessary Umi plugins for token metadata, core functionality, and MPL Hybrid features.
umi.use(mplTokenMetadata());
umi.use(mplCore());
umi.use(mplHybrid());

// Define the public key for the collection associated with the escrow.
const collectionAddress = publicKey(
  "BAxqnBkLbcoMJN3v7mHWuYjcB355QgEASSVfba9KTTUe"
);

const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
  string({ size: "variable" }).serialize("escrow"),
  publicKeySerializer().serialize(collectionAddress),
]);

// Define the public key for the token being swapped in the release.
const tokenAddress = publicKey("84AYw2XZ5HcyWWmVNR6s4uS3baHrMLpPMnEfBTm6JkdE");

// Call the `releaseV1` function to swap an asset for SPL tokens.
await releaseV1(umi, {
  owner: umi.identity, // Specify the wallet (identity) owning the asset being swapped.
  escrow: publicKey("JECkvqxFEAxKCLLXq757C7bEFRRqphhsg6adxpgMZgag"), // Provide the address of the escrow configuration for the swap.
  asset: publicKey("6a2LsoPm63uCxHgEjM4Yri56hngKhNGn2eZhKxnffrmE"),
  // Public key of the asset being swapped.
  collection: collectionAddress, // Collection associated with the escrow configuration.
  feeProjectAccount: publicKey("9J4HufMHR5ELvG1scy78gxCo3Hmna8UdHvZ4pnr2c93d"), // Address where fees will be deposited (fee wallet).
  token: tokenAddress, // Public key of the token account used in the swap.
}).sendAndConfirm(umi); // Send the transaction and confirm its execution on the Solana blockchain.
