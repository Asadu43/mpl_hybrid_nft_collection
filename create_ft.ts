import { clusterApiUrl, Connection } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createAndMint,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  // Initialize an escrow contract.
  mplHybrid, // Import MPL Hybrid plugin.
} from "@metaplex-foundation/mpl-hybrid";
import { mplCore } from "@metaplex-foundation/mpl-core"; // Import core Metaplex features.

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

const tokenMint = generateSigner(umi);
// Initialize the escrow contract with specific parameters.
await createAndMint(umi, {
  mint: tokenMint,
  authority: umi.identity,
  name: "Asad Token",
  symbol: "ASD",
  uri: "www.fungible.com",
  sellerFeeBasisPoints: percentAmount(0),
  decimals: 8,
  amount: 100000000000000,
  tokenOwner: umi.identity.publicKey,
  tokenStandard: TokenStandard.Fungible,
}).sendAndConfirm(umi);

// Decode the transaction signature from base58 for display.

// Log the transaction details for the initialized escrow.
console.log(
  `Escrow created! https://explorer.solana.com/tx/${tokenMint.publicKey}?cluster=devnet`
);
