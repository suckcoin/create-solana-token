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
}: {
  destination: string;
  tokenMint: string;
  amount: number;
}) {
  const mint = new PublicKey(tokenMint);
  const sourceATA = await getAssociatedTokenAddress(mint, keypair.publicKey);
  const destinationPublicKey = new PublicKey(destination);
  const destinationATA = await getAssociatedTokenAddress(mint, destinationPublicKey);
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 10000,
  });
  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 3000,
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

const addressesFile = fs.readFileSync(
  "addresses.txt"
);
const addresses = addressesFile.toString().split("\n");

async function batchTransfer() {
  for (var i = 0; i < addresses.length - 1; i++) {
    const address = addresses[i];
    const rawAmountIn = 100 * 1000000 // 1 SUCKCOIN multiplier
    const randDeviation = Math.random() * (0.4 * rawAmountIn);
    const amountIn = rawAmountIn * 0.6 + (randDeviation - (randDeviation % 1000000));
    await transferTokens({
      destination: address,
      tokenMint: "kRuVpT9jvnjfiBoVL8c9bp5ixTPBJRrq19ftdibpump",
      amount: amountIn
    });
  }
}

batchTransfer();
