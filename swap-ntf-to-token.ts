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
const escrowAddress = publicKey("8KMySmw7Di4YMLLoYNmKp9g18xXVXhNDtWZd45sAnQZc");

// Define the public key for the collection associated with the escrow.
const collectionAddress = publicKey(
  "58Ck1mWP76detALUKJcUPY5MD9j8bSyq9zZ3ra5dw2NS"
);

// Define the public key for the token being swapped in the release.
const tokenAddress = publicKey("84AYw2XZ5HcyWWmVNR6s4uS3baHrMLpPMnEfBTm6JkdE");

// Call the `releaseV1` function to swap an asset for SPL tokens.
await releaseV1(umi, {
  owner: umi.identity, // Specify the wallet (identity) owning the asset being swapped.
  escrow: escrowAddress, // Provide the address of the escrow configuration for the swap.
  asset: publicKey("Hpa37nNx9eRBj3oRn65e2FnHyx5SMdy8fTZ7UgxYrYRw"),
  // Public key of the asset being swapped.

  collection: collectionAddress, // Collection associated with the escrow configuration.
  feeProjectAccount: umi.identity.publicKey, // Address where fees will be deposited (fee wallet).
  token: tokenAddress, // Public key of the token account used in the swap.
}).sendAndConfirm(umi); // Send the transaction and confirm its execution on the Solana blockchain.
