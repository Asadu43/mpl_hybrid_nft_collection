import { clusterApiUrl, Connection } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchAsset } from "@metaplex-foundation/mpl-core";
import { PublicKey } from "@solana/web3.js";
import { publicKey } from "@metaplex-foundation/umi";

async function verifyAssetCollection() {
  const connection = new Connection(clusterApiUrl("devnet"));
  const umi = createUmi(connection.rpcEndpoint);

  // The Asset and Collection addresses
  const assetAddress = publicKey(
    "EC6ooiNSgGYAHsN9AmKkGUhQpEowbFsatJU4p5ZrGUa3"
  );
  const expectedCollectionAddress = publicKey(
    "7qYGyrweq9adgZBzEgAdTNtiK5yWBwkY2imstKY5khj"
  );

  try {
    // Fetch the Asset details
    const asset = await fetchAsset(umi, assetAddress);

    console.log("Fetched Asset Details:", asset);

    // Verify the update authority matches the expected collection address
    const updateAuthority = new PublicKey(asset.updateAuthority.address);

    if (updateAuthority.equals(expectedCollectionAddress)) {
      console.log(
        "Verification successful: The asset belongs to the specified collection."
      );
    } else {
      console.log(
        "Verification failed: The asset does not belong to the specified collection."
      );
      console.log(`Expected Collection Address: ${expectedCollectionAddress}`);
      console.log(`Asset Update Authority: ${updateAuthority}`);
    }
  } catch (error) {
    console.error("Error verifying asset collection:", error);
  }
}

verifyAssetCollection();
