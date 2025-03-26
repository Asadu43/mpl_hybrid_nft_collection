import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  captureV1,
  MPL_HYBRID_PROGRAM_ID,
  mplHybrid,
} from "@metaplex-foundation/mpl-hybrid";
import { mplCore } from "@metaplex-foundation/mpl-core";
import bs58 from "bs58";
import {
  string,
  publicKey as publicKeySerializer,
} from "@metaplex-foundation/umi/serializers";

// Create a connection to the Solana Devnet cluster for blockchain interactions.
const connection = new Connection(clusterApiUrl("devnet"));

// Load the user's keypair from a specified file for signing transactions.
// const user = await getKeypairFromFile("/home/asad/.config/solana/id.json");

// Initialize the Umi instance with the RPC endpoint of the Solana connection.
const umi = createUmi(connection.rpcEndpoint);

// Create a Umi-compatible keypair from the user's secret key for identity.
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
// Set the user's wallet identity in Umi for transaction signing and authorization.
umi.use(keypairIdentity(umiUser));

// Load plugins for handling token metadata, core features, and MPL Hybrid operations.
umi.use(mplTokenMetadata());
umi.use(mplCore());
umi.use(mplHybrid());

// Define the public key of the escrow configuration.
const escrowAddress = publicKey("JECkvqxFEAxKCLLXq757C7bEFRRqphhsg6adxpgMZgag");

// Define the public key of the collection associated with the escrow.
const collectionAddress = publicKey(
  "FCjDZR1o7ZGneAyuxv6HcN7ENDYYSyuLcWrubTBiYVkX"
);

const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
  string({ size: "variable" }).serialize("escrow"),
  publicKeySerializer().serialize(collectionAddress),
]);
// Define the public key of the SPL token to be involved in the capture process.
const tokenAddress = publicKey("84AYw2XZ5HcyWWmVNR6s4uS3baHrMLpPMnEfBTm6JkdE");

// Execute the `captureV1` function to capture assets and handle interactions with the escrow.
await captureV1(umi, {
  owner: umi.identity, // Specify the wallet (identity) owning the asset to be swapped.
  escrow: escrow, // Provide the escrow account address for the operation.
  asset: publicKey("CPz1dPDnZ67rJPhXR1qcL1T6gKoVZyAXSLRsu8fH4FxT"),
  // Public key of the asset being swapped for SPL tokens.
  collection: collectionAddress, // Specify the collection tied to the escrow configuration.
  feeProjectAccount: publicKey("9J4HufMHR5ELvG1scy78gxCo3Hmna8UdHvZ4pnr2c93d"), // Fee wallet address (same as identity wallet here).
  token: tokenAddress, // Public key of the token account involved in the operation.
}).sendAndConfirm(umi);
// Send the transaction to the blockchain and confirm its successful execution.
