import { clusterApiUrl, Connection } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { captureV1, mplHybrid } from "@metaplex-foundation/mpl-hybrid";
import { mplCore } from "@metaplex-foundation/mpl-core";

// Create a connection to the Solana Devnet cluster for blockchain interactions.
const connection = new Connection(clusterApiUrl("devnet"));

// Load the user's keypair from a specified file for signing transactions.
const user = await getKeypairFromFile("/home/asad/.config/solana/id.json");

// Initialize the Umi instance with the RPC endpoint of the Solana connection.
const umi = createUmi(connection.rpcEndpoint);

// Create a Umi-compatible keypair from the user's secret key for identity.
const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);

// Set the user's wallet identity in Umi for transaction signing and authorization.
umi.use(keypairIdentity(umiUser));

// Load plugins for handling token metadata, core features, and MPL Hybrid operations.
umi.use(mplTokenMetadata());
umi.use(mplCore());
umi.use(mplHybrid());

// Define the public key of the escrow configuration.
const escrowAddress = publicKey("4ov1tbM2nUKUDZeZtGLAKjFmGmGbxUV9Ww72ptDSQfJy");

// Define the public key of the collection associated with the escrow.
const collectionAddress = publicKey(
  "7qYGyrweq9adgZBzEgAdTNtiK5yWBwkY2imstKY5khj"
);

// Define the public key of the SPL token to be involved in the capture process.
const tokenAddress = publicKey("84AYw2XZ5HcyWWmVNR6s4uS3baHrMLpPMnEfBTm6JkdE");

// Execute the `captureV1` function to capture assets and handle interactions with the escrow.
await captureV1(umi, {
  owner: umi.identity, // Specify the wallet (identity) owning the asset to be swapped.
  escrow: escrowAddress, // Provide the escrow account address for the operation.
  asset: publicKey("EC6ooiNSgGYAHsN9AmKkGUhQpEowbFsatJU4p5ZrGUa3"),
  // Public key of the asset being swapped for SPL tokens.

  collection: collectionAddress, // Specify the collection tied to the escrow configuration.
  feeProjectAccount: umi.identity.publicKey, // Fee wallet address (same as identity wallet here).
  token: tokenAddress, // Public key of the token account involved in the operation.
}).sendAndConfirm(umi);
// Send the transaction to the blockchain and confirm its successful execution.
