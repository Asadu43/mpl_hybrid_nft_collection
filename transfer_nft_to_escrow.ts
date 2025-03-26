import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import {
  MPL_HYBRID_PROGRAM_ID,
  mplHybrid,
} from "@metaplex-foundation/mpl-hybrid";
import { readFileSync } from "fs";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  string,
  publicKey as publicKeySerializer,
} from "@metaplex-foundation/umi/serializers";
import {
  fetchAsset,
  transfer,
  transferV1,
} from "@metaplex-foundation/mpl-core";
import bs58 from "bs58";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { clusterApiUrl, Connection } from "@solana/web3.js";

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"));
  const collection = publicKey("FCjDZR1o7ZGneAyuxv6HcN7ENDYYSyuLcWrubTBiYVkX"); // Collection address
  const asset = publicKey("CPz1dPDnZ67rJPhXR1qcL1T6gKoVZyAXSLRsu8fH4FxT"); // NFT Mint Address

  const umi = createUmi(connection.rpcEndpoint)
    .use(mplHybrid())
    .use(mplTokenMetadata());

  const admin = await getKeypairFromFile("/home/asad/.config/solana/id.json");
  const adminKeypair = umi.eddsa.createKeypairFromSecretKey(admin.secretKey);
  umi.use(keypairIdentity(adminKeypair));

  // Fetch the NFT details
  const nft = await fetchAsset(umi, asset);
  console.log("nft:", nft);

  // Derive the Escrow Address
  const [escrow] = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: "variable" }).serialize("escrow"),
    publicKeySerializer().serialize(collection),
  ]);

  console.log("Escrow Address:", escrow);

  // Transfer Asset to Escrow with Proof
  const transaction = transferV1(umi, {
    asset: asset,
    newOwner: escrow,
    collection: collection,
  });

  const txSignatureUint8Array = (await transaction.sendAndConfirm(umi))
    .signature;
  const txSignature = bs58.encode(txSignatureUint8Array);
  console.log(`✅ Asset transfer confirmed with signature: ${txSignature}`);

  // ✅ Wait for confirmation on-chain
  await connection.confirmTransaction(txSignature, "finalized");
  console.log("✅ Transaction finalized.");
})();
