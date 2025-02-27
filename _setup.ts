import { clusterApiUrl, Connection } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { generateSigner, keypairIdentity, Umi } from "@metaplex-foundation/umi";
import {
  createCollection,
  fetchCollection,
} from "@metaplex-foundation/mpl-core";

export async function createCoreCollection() {
  // Initialize connection and Umi instance
  const connection = new Connection(clusterApiUrl("devnet"));
  const umi = createUmi(clusterApiUrl("devnet"));

  // Load the user's keypair
  const user = await getKeypairFromFile("/home/asad/.config/solana/id.json");
  const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  umi.use(keypairIdentity(umiUser));

  // Generate a new signer for the collection
  const updateAuthority = generateSigner(umi);


  console.log(updateAuthority);
  const collectionAddress = generateSigner(umi);

  console.log(`Generated Collection Address: ${collectionAddress.publicKey}`);

  try {
    // Create the collection
    const transaction = await createCollection(umi, {
      name: "IKIGAI NFT Collection", // Collection name
      uri: `https://nft.ikigaionsol.com/media/collection.json`, // Metadata URI
      collection: collectionAddress, // Collection public key
      updateAuthority:updateAuthority.publicKey,

    });

    // Send and confirm the transaction
    const transactionSignature = await transaction.sendAndConfirm(umi);
    console.log(
      `Collection created successfully. Transaction Signature: ${transactionSignature}`
    );

    // Fetch and return the collection details
    const collection = await fetchCollection(umi, collectionAddress.publicKey);
    console.log(`Collection fetched successfully: ${collection.publicKey}`);
    return collection;
  } catch (error) {
    console.error(
      "Error creating or fetching the collection. Ensure the account is initialized:",
      error
    );
    throw error;
  }
}

(async () => {
  try {
    const collection = await createCoreCollection();
    console.log("Collection created:", collection);
  } catch (error) {
    console.error("Error during collection creation:", error);
  }
})();
