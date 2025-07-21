import {
  Transaction,
  PublicKey,
  Keypair,
  Connection,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import fs from "fs";
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

let connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

async function createMetadata({
  publicKey,
  tokenMint,
  tokenName,
  tokenSymbol,
  tokenUrl,
}: {
  publicKey: PublicKey;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  tokenUrl: string;
}) {
  const mint = new PublicKey(tokenMint);
  const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
        ],
        PROGRAM_ID,
      )[0],
      mint: mint,
      mintAuthority: publicKey,
      payer: publicKey,
      updateAuthority: publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: tokenName,
          symbol: tokenSymbol,
          uri: tokenUrl,
          creators: null,
          sellerFeeBasisPoints: 0,
          uses: null,
          collection: null,
        },
        isMutable: false,
        collectionDetails: null,
      },
    },
  );
  const updateMetadataTransaction = new Transaction().add(
    createMetadataInstruction
  );
  await sendAndConfirmTransaction(connection, updateMetadataTransaction, [
    keypair,
  ]);
}

const privateKeyFile = fs.readFileSync(
  "my-keypair0.json"
);
let privateKeySeed = JSON.parse(privateKeyFile.toString()).slice(0, 32);
let keypair = Keypair.fromSeed(Uint8Array.from(privateKeySeed));
console.log("Token update authority:", keypair.publicKey.toString());

createMetadata({
  publicKey: keypair.publicKey,
  tokenMint: "kRuVpT9jvnjfiBoVL8c9bp5ixTPBJRrq19ftdibpump",
  tokenName: "Suckcoin",
  tokenSymbol: "Suckcoin",
  tokenUrl: "https://arweave.net/TQpABaCzYmdmnlY0DKYE63xp-qf7-dajevqcl4b3oWo",
});
