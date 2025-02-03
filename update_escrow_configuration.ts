import { createCoreCollection } from "./_setup";

import { clusterApiUrl, Connection } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  fetchEscrowV1,
  initEscrowV1, // Initialize an escrow contract.
  MPL_HYBRID_PROGRAM_ID, // Program ID for the MPL Hybrid program.
  mplHybrid,
  updateEscrowV1, // Import MPL Hybrid plugin.
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
const collection = publicKey("3SsoHng2czRKa1Prdsihgm95DdKpo9Wi2F6yB8ANN8zi");

const escrowConfigurationAddress = publicKey(
  "J6imms21PcZ3CMTgysfohCeLarbxxBNDnPkc19txKEAi"
);

    const escrowConfigurationData = await fetchEscrowV1(
      umi,
      escrowConfigurationAddress
    );

    // ✅ Convert BigInt values to strings for proper serialization
    const sanitizedEscrowData = JSON.stringify(
      escrowConfigurationData,
      (_, value) => (typeof value === "bigint" ? value.toString() : value), // Convert BigInt to string
      2
    );

    console.log("✅ Escrow Configuration Data:");
    console.log(sanitizedEscrowData);

// // Use the spread operator `...` to spread the `escrowConfigurationData` fields into the object
// and adjust any fields you wish to update.
const res = await updateEscrowV1(umi, {
    ...escrowConfigurationData,
    // your escrow configuration address.
    escrow: escrowConfigurationAddress,
    authority: umi.identity,
    // add any fields below that you wish to change and update.
    feeAmount: 100000000,
    name: "Test Asad 2",
    amount: 4_000_000_000,
}).sendAndConfirm(umi);

// Decode the transaction signature from base58 for display.
const signature = base58.deserialize(res.signature)[0];

// Log the transaction details for the initialized escrow.
console.log(
  `Escrow created! https://explorer.solana.com/tx/${signature}?cluster=devnet`
);

