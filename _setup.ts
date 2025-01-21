import { clusterApiUrl, Connection } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { generateSigner, keypairIdentity, Umi } from "@metaplex-foundation/umi";
import {
  createCollection,
  fetchCollection,
  create,
  AssetV1,
  fetchAsset,
} from "@metaplex-foundation/mpl-core";

export async function createCoreCollection(umi: Umi) {
  const BASE_URL =
    "https://rose-leading-cricket-429.mypinata.cloud/ipfs/QmSgEhWcYJE2iMrkas2WNTwZ5GVpVz2HjkDi2XP3VykUFi/";

  const connection = new Connection(clusterApiUrl("devnet"));

  const user = await getKeypairFromFile("/home/asad/.config/solana/id.json");

  const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  umi.use(keypairIdentity(umiUser));

  const collectionAddress = generateSigner(umi);

  const transaction = createCollection(umi, {
    name: "Asad Collection",
    uri: "https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-collection-offchain-data.json",
    collection: collectionAddress,
  });

  await transaction.sendAndConfirm(umi);

  const collection = await fetchCollection(umi, collectionAddress.publicKey);

  console.log(`Collection Address is ${collectionAddress.publicKey}`);

  const assets: AssetV1[] = [];

  for (let i = 0; i < 3; i++) {
    const assetAddress = generateSigner(umi);
    const transaction = create(umi, {
      asset: assetAddress,
      collection: collection,
      owner: umi.identity.publicKey,
      name: `Asad ${i + 1}`,
      uri: `${BASE_URL}/${i + 1}.json`,
    });
    await transaction.sendAndConfirm(umi);

    console.log(`Asset Address ${i + 1} is ${assetAddress.publicKey}`);

    assets.push(await fetchAsset(umi, assetAddress.publicKey));
  }

  return {collection};
}
