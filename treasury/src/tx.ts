import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export async function sendInstructions(opts: {
  connection: Connection;
  payer: Keypair;
  instructions: TransactionInstruction[];
  dryRun: boolean;
  label: string;
}): Promise<string | null> {
  const { connection, payer, instructions, dryRun, label } = opts;
  if (instructions.length === 0) {
    console.log(`[${label}] no instructions`);
    return null;
  }

  const tx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }),
    ...instructions,
  );
  tx.feePayer = payer.publicKey;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.sign(payer);

  if (dryRun) {
    const sim = await connection.simulateTransaction(tx);
    if (sim.value.err) {
      throw new Error(`[${label}] dry-run simulation failed: ${JSON.stringify(sim.value.err)}`);
    }
    console.log(`[${label}] dry-run ok (units ${sim.value.unitsConsumed ?? "?"})`);
    return null;
  }

  const sig = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
    skipPreflight: false,
  });
  console.log(`[${label}] confirmed ${sig}`);
  return sig;
}
