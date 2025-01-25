import { createCoreCollection } from "./_setup";

import { clusterApiUrl, Connection } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  initEscrowV1, // Initialize an escrow contract.
  MPL_HYBRID_PROGRAM_ID, // Program ID for the MPL Hybrid program.
  mplHybrid, // Import MPL Hybrid plugin.
} from "@metaplex-foundation/mpl-hybrid";
import { mplCore } from "@metaplex-foundation/mpl-core"; // Import core Metaplex features.
import {
  string, // Serializer for strings.
  publicKey as publicKeySerializer, // Serializer for public keys.
  base58, // Serializer for base58 encoding.
} from "@metaplex-foundation/umi/serializers";

import {
  findAssociatedTokenPda, // Function to find associated token accounts.
  SPL_ASSOCIATED_TOKEN_PROGRAM_ID, // Program ID for associated token accounts.
} from "@metaplex-foundation/mpl-toolbox";

// Establish a connection to the Solana Devnet cluster.
const connection = new Connection(clusterApiUrl("devnet"));

// Retrieve the user's keypair from a local file for signing transactions.
const user = await getKeypairFromFile("/home/asad/.config/solana/id.json");

// Define the base URI for metadata (points to an IPFS directory for assets).

// Initialize the Umi instance with the Solana connection.
const umi = createUmi(connection.rpcEndpoint);

// Convert the retrieved secret key into a Umi-compatible keypair.
const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);

// Attach the identity to Umi using the keypair for signing transactions.
umi.use(keypairIdentity(umiUser));

// Load necessary Umi plugins for handling token metadata, core functionality, and hybrid features.
umi.use(mplTokenMetadata());
umi.use(mplCore());
umi.use(mplHybrid());

// Define the public key of an existing token for escrow-related operations.
const tokenAddress = publicKey("84AYw2XZ5HcyWWmVNR6s4uS3baHrMLpPMnEfBTm6JkdE");

// Create a core collection on the Solana blockchain for managing assets.
const  collection  = publicKey("3SsoHng2czRKa1Prdsihgm95DdKpo9Wi2F6yB8ANN8zi");

// Derive the PDA (Program Derived Address) for the escrow account using its program ID and collection public key.
const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
  string({ size: "variable" }).serialize("escrow"), // Serialize the string "escrow" as part of the seed.
  publicKeySerializer().serialize(collection), // Serialize the collection's public key as part of the seed.
]);

// Find the associated token account for the fee payments.
const feeAta = findAssociatedTokenPda(umi, {
  mint: tokenAddress, // Token address to find its associated account.
  owner: umi.identity.publicKey, // Owner of the associated token account.
});

// Initialize the escrow contract with specific parameters.
const initEscrowTx = await initEscrowV1(umi, {
  escrow: escrow, // Escrow PDA.
  collection: collection, // The collection tied to the escrow.
  token: tokenAddress, // The token to be held in escrow.
  feeLocation: umi.identity.publicKey, // Account where the fees will be sent.
  name: "IKIGAI NFT", // Name of the escrow (metadata).
  uri: "https://nft.ikigaionsol.com/media/collection.json", // URI pointing to metadata for the escrow.
  max: 1000, // Maximum number of assets that can be escrowed.
  min: 1, // Minimum number of assets required to start escrow.
  amount: 5_000_000_000, // Total amount of the token to escrow (in smallest denomination).
  feeAmount: 3_000_000_000, // Fee amount for the escrow (in smallest denomination).
  path: 0, // Escrow path (specific to hybrid program logic).
  solFeeAmount: 0, // Fee amount in SOL (set to 0 for this example).
  feeAta: feeAta, // Associated token account for fee payments.
  associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID, // Program ID for associated token operations.
}).sendAndConfirm(umi); // Send and confirm the transaction.

// Decode the transaction signature from base58 for display.
const signature = base58.deserialize(initEscrowTx.signature)[0];

// Log the transaction details for the initialized escrow.
console.log(
  `Escrow created! https://explorer.solana.com/tx/${signature}?cluster=devnet`
);
