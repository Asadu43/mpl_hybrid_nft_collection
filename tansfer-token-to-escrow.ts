import { clusterApiUrl, Connection } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { mplHybrid } from "@metaplex-foundation/mpl-hybrid";
import { mplCore } from "@metaplex-foundation/mpl-core";

import {
  findAssociatedTokenPda,
  createTokenIfMissing,
  transferTokens,
} from "@metaplex-foundation/mpl-toolbox";

const connection = new Connection(clusterApiUrl("devnet"));

const user = await getKeypairFromFile("/home/asad/.config/solana/id.json");
const umi = createUmi(connection.rpcEndpoint);
const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);

umi.use(keypairIdentity(umiUser));
umi.use(mplTokenMetadata());
umi.use(mplCore());
umi.use(mplHybrid());
const escrowAddress = publicKey("8KMySmw7Di4YMLLoYNmKp9g18xXVXhNDtWZd45sAnQZc");
const tokenAddress = publicKey("84AYw2XZ5HcyWWmVNR6s4uS3baHrMLpPMnEfBTm6JkdE");
// Generate the Token Account PDA from the funding wallet.
const sourceTokenAccountPda = findAssociatedTokenPda(umi, {
  owner: umi.identity.publicKey,
  mint: tokenAddress,
});

// Generate the Token Account PDA for the escrow destination.
const escrowTokenAccountPda = findAssociatedTokenPda(umi, {
  owner: escrowAddress,
  mint: tokenAddress,
});

// Execute transfer of tokens while also checking if the
// destination token account exists, if not, create it.
await createTokenIfMissing(umi, {
  mint: tokenAddress,
  owner: escrowAddress,
  token: escrowTokenAccountPda,
  payer: umi.identity,
})
  .add(
    transferTokens(umi, {
      source: sourceTokenAccountPda,
      destination: escrowTokenAccountPda,
      // amount is calculated in lamports and decimals.
      amount: 5000000000,
    })
  )
  .sendAndConfirm(umi);
