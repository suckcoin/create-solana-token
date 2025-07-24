import {
  Keypair,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  Connection,
  clusterApiUrl,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ACCOUNT_SIZE,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "fs";
import * as bs58 from "bs58";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

async function transferTokens({
  destination,
  tokenMint,
  amount,
  computeUnits,
  microLamports,
}: {
  destination: string;
  tokenMint: string;
  amount: number;
  computeUnits: number;
  microLamports: number;
}) {
  const mint = new PublicKey(tokenMint);
  const sourceATA = await getAssociatedTokenAddress(mint, keypair.publicKey);
  const destinationPublicKey = new PublicKey(destination);
  const destinationATA = await getAssociatedTokenAddress(mint, destinationPublicKey);
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: computeUnits,
  });
  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: microLamports,
  });
  try {
    const destinationTokenAccount = await getAccount(connection, destinationATA);
    const transferTokensTransaction = new Transaction()
    .add(
      createTransferCheckedInstruction(
        sourceATA,
        mint,
        destinationATA,
        keypair.publicKey,
        amount,
        6
      )
    );
    await sendAndConfirmTransaction(connection, transferTokensTransaction, [
      keypair,
    ]);
    console.log("Sent " + amount + " tokens to existing token account:", destinationATA.toString());
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) {
      const transferTokensTransaction = new Transaction()
      .add(
        createAssociatedTokenAccountInstruction(
          keypair.publicKey,
          destinationATA,
          destinationPublicKey,
          mint
        )
      )
      .add(
        createTransferCheckedInstruction(
          sourceATA,
          mint,
          destinationATA,
          keypair.publicKey,
          amount,
          6
        )
      );
      await sendAndConfirmTransaction(connection, transferTokensTransaction, [
        keypair,
      ]);
      console.log("Sent " + amount + " tokens to new token account:", destinationATA.toString());
    }
  }
}

const privateKeyFile = fs.readFileSync(
  "/root/burner1-keypair.json"
);
let privateKeySeed = JSON.parse(privateKeyFile.toString()).slice(0, 32);
let keypair = Keypair.fromSeed(Uint8Array.from(privateKeySeed));
console.log("Token send authority:", keypair.publicKey.toString());

const args = process.argv.slice(2);
const address = args[0];
const amountIn = parseInt(args[1], 10);
const computeUnits = parseInt(args[2], 10);
const microLamports = parseInt(args[3], 10);

transferTokens({
  destination: address,
  tokenMint: "kRuVpT9jvnjfiBoVL8c9bp5ixTPBJRrq19ftdibpump",
  amount: amountIn,
  computeUnits: computeUnits,
  microLamports: microLamports
});
