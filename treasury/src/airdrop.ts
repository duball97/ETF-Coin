import fs from "node:fs";
import path from "node:path";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  getAccount,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import type { AppConfig } from "./config.js";
import { requireEtfMint } from "./config.js";
import { getConnection } from "./connection.js";
import { allocateProRata, fetchHolders } from "./holders.js";
import { sendInstructions } from "./tx.js";

export type AirdropAssetResult = {
  symbol: string;
  mint: string;
  treasuryBalance: string;
  recipients: number;
  totalSent: string;
  signatures: string[];
  dryRun: boolean;
};

async function resolveTokenProgram(
  connection: ReturnType<typeof getConnection>,
  mint: PublicKey,
): Promise<PublicKey> {
  const info = await connection.getAccountInfo(mint);
  if (!info) throw new Error(`Mint account not found: ${mint.toBase58()}`);
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  return TOKEN_PROGRAM_ID;
}

export async function airdropBasket(config: AppConfig): Promise<AirdropAssetResult[]> {
  const connection = getConnection(config);
  const etfMint = requireEtfMint(config);
  const holders = await fetchHolders(connection, config, etfMint);
  if (holders.length === 0) {
    console.log("[airdrop] no eligible holders");
    return [];
  }

  const results: AirdropAssetResult[] = [];

  for (const asset of config.basket) {
    const mint = new PublicKey(asset.mint);
    const tokenProgram = await resolveTokenProgram(connection, mint);
    const mintInfo = await getMint(connection, mint, "confirmed", tokenProgram);
    const sourceAta = getAssociatedTokenAddressSync(
      mint,
      config.creator.publicKey,
      false,
      tokenProgram,
    );

    let treasuryBalance = 0n;
    try {
      const acct = await getAccount(connection, sourceAta, "confirmed", tokenProgram);
      treasuryBalance = acct.amount;
    } catch {
      console.log(`[airdrop] ${asset.symbol}: no treasury ATA / zero balance`);
      results.push({
        symbol: asset.symbol,
        mint: asset.mint,
        treasuryBalance: "0",
        recipients: 0,
        totalSent: "0",
        signatures: [],
        dryRun: config.dryRun,
      });
      continue;
    }

    if (treasuryBalance <= 0n) {
      console.log(`[airdrop] ${asset.symbol}: zero balance`);
      results.push({
        symbol: asset.symbol,
        mint: asset.mint,
        treasuryBalance: "0",
        recipients: 0,
        totalSent: "0",
        signatures: [],
        dryRun: config.dryRun,
      });
      continue;
    }

    const allocations = allocateProRata(holders, treasuryBalance).filter((a) => a.amount > 0n);
    console.log(
      `[airdrop] ${asset.symbol}: ${treasuryBalance} raw units -> ${allocations.length} recipients (decimals ${mintInfo.decimals})`,
    );

    const signatures: string[] = [];
    for (let i = 0; i < allocations.length; i += config.airdropBatchSize) {
      const batch = allocations.slice(i, i + config.airdropBatchSize);
      const ixs: TransactionInstruction[] = [];

      for (const row of batch) {
        const owner = new PublicKey(row.owner);
        const destAta = getAssociatedTokenAddressSync(
          mint,
          owner,
          true,
          tokenProgram,
        );
        ixs.push(
          createAssociatedTokenAccountIdempotentInstruction(
            config.creator.publicKey,
            destAta,
            owner,
            mint,
            tokenProgram,
          ),
          createTransferInstruction(
            sourceAta,
            destAta,
            config.creator.publicKey,
            row.amount,
            [],
            tokenProgram,
          ),
        );
      }

      const sig = await sendInstructions({
        connection,
        payer: config.creator,
        instructions: ixs,
        dryRun: config.dryRun,
        label: `airdrop:${asset.symbol}:batch${Math.floor(i / config.airdropBatchSize) + 1}`,
      });
      if (sig) signatures.push(sig);
    }

    results.push({
      symbol: asset.symbol,
      mint: asset.mint,
      treasuryBalance: treasuryBalance.toString(),
      recipients: allocations.length,
      totalSent: treasuryBalance.toString(),
      signatures,
      dryRun: config.dryRun,
    });
  }

  return results;
}

export function writeReceipt(
  config: AppConfig,
  name: string,
  payload: unknown,
): string {
  if (!fs.existsSync(config.receiptsDir)) {
    fs.mkdirSync(config.receiptsDir, { recursive: true });
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(config.receiptsDir, `${stamp}-${name}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log(`[receipt] ${file}`);
  return file;
}
