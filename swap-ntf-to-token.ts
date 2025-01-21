import { clusterApiUrl, Connection } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
// Import the MPL Hybrid program and the release function for swapping assets.
import { mplHybrid, releaseV1 } from "@metaplex-foundation/mpl-hybrid";
import { mplCore } from "@metaplex-foundation/mpl-core";
// Import the core Metaplex plugin for foundational functionality.

// Establish a connection to the Solana Devnet cluster.
const connection = new Connection(clusterApiUrl("devnet"));

// Retrieve the user's keypair from the local file system for signing transactions.
const user = await getKeypairFromFile("/home/asad/.config/solana/id.json");

// Initialize the Umi instance with the Solana connection.
const umi = createUmi(connection.rpcEndpoint);

// Convert the user's secret key into a Umi-compatible keypair.
const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);

// Attach the user's identity to Umi for signing and authorization.
umi.use(keypairIdentity(umiUser));

// Load necessary Umi plugins for token metadata, core functionality, and MPL Hybrid features.
umi.use(mplTokenMetadata());
umi.use(mplCore());
umi.use(mplHybrid());

// Define the public key for the escrow account involved in the release process.
const escrowAddress = publicKey("4ov1tbM2nUKUDZeZtGLAKjFmGmGbxUV9Ww72ptDSQfJy");

// Define the public key for the collection associated with the escrow.
const collectionAddress = publicKey(
  "7qYGyrweq9adgZBzEgAdTNtiK5yWBwkY2imstKY5khj"
);

// Define the public key for the token being swapped in the release.
const tokenAddress = publicKey("84AYw2XZ5HcyWWmVNR6s4uS3baHrMLpPMnEfBTm6JkdE");

// Call the `releaseV1` function to swap an asset for SPL tokens.
await releaseV1(umi, {
  owner: umi.identity, // Specify the wallet (identity) owning the asset being swapped.
  escrow: escrowAddress, // Provide the address of the escrow configuration for the swap.
  asset: publicKey("EC6ooiNSgGYAHsN9AmKkGUhQpEowbFsatJU4p5ZrGUa3"),
  // Public key of the asset being swapped.

  collection: collectionAddress, // Collection associated with the escrow configuration.
  feeProjectAccount: umi.identity.publicKey, // Address where fees will be deposited (fee wallet).
  token: tokenAddress, // Public key of the token account used in the swap.
}).sendAndConfirm(umi); // Send the transaction and confirm its execution on the Solana blockchain.
