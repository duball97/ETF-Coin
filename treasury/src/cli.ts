#!/usr/bin/env node
import { Command } from "commander";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { loadConfig } from "./config.js";
import { claimCreatorFees } from "./claim.js";
import { buyBasket } from "./buy.js";
import { airdropBasket, writeReceipt } from "./airdrop.js";
import { getConnection, getOnlineSdk } from "./connection.js";

type GlobalOpts = { live?: boolean; dryRun?: boolean };

const program = new Command();

program
  .name("etf-treasury")
  .description("Claim pump.fun fees, buy basket assets, airdrop to $ETF holders")
  .option("--live", "Broadcast transactions (overrides DRY_RUN=true)", false)
  .option("--dry-run", "Simulate only (default unless DRY_RUN=false)", false);

function resolveConfig(): ReturnType<typeof loadConfig> {
  const opts = program.opts<GlobalOpts>();
  if (opts.live && opts.dryRun) {
    throw new Error("Use either --live or --dry-run, not both");
  }
  if (opts.live) return loadConfig({ dryRun: false });
  if (opts.dryRun) return loadConfig({ dryRun: true });
  return loadConfig();
}

program
  .command("status")
  .description("Show wallet, vault balance, and basket")
  .action(async () => {
    const config = loadConfig();
    const connection = getConnection(config);
    const sdk = getOnlineSdk(config);
    const balance = await connection.getBalance(config.creator.publicKey);
    const vault = await sdk.getCreatorVaultBalanceBothPrograms(config.creator.publicKey);
    console.log(
      JSON.stringify(
        {
          creator: config.creator.publicKey.toBase58(),
          etfMint: config.etfMint?.toBase58() ?? null,
          walletSol: balance / LAMPORTS_PER_SOL,
          claimableSol: vault.toNumber() / LAMPORTS_PER_SOL,
          dryRun: config.dryRun,
          basket: config.basket,
        },
        null,
        2,
      ),
    );
  });

program
  .command("claim")
  .description("Collect pump.fun + pump AMM creator fees into the creator wallet")
  .action(async () => {
    const config = resolveConfig();
    console.log(`[mode] ${config.dryRun ? "DRY-RUN" : "LIVE"}`);
    const result = await claimCreatorFees(config);
    writeReceipt(config, "claim", result);
  });

program
  .command("buy")
  .description("Swap spendable SOL (minus gas reserve) into the configured basket")
  .option("--sol <amount>", "SOL budget to spend (optional)")
  .action(async (opts: { sol?: string }) => {
    const config = resolveConfig();
    console.log(`[mode] ${config.dryRun ? "DRY-RUN" : "LIVE"}`);
    const budget = opts.sol ? Math.floor(Number(opts.sol) * LAMPORTS_PER_SOL) : undefined;
    const result = await buyBasket(config, budget);
    writeReceipt(config, "buy", result);
  });

program
  .command("airdrop")
  .description("Pro-rata airdrop treasury basket balances to $ETF holders")
  .action(async () => {
    const config = resolveConfig();
    console.log(`[mode] ${config.dryRun ? "DRY-RUN" : "LIVE"}`);
    const result = await airdropBasket(config);
    writeReceipt(config, "airdrop", result);
  });

program
  .command("run")
  .description("Full cycle: claim fees → buy basket → airdrop holders")
  .action(async () => {
    const config = resolveConfig();
    console.log(`[mode] ${config.dryRun ? "DRY-RUN" : "LIVE"}`);

    const claim = await claimCreatorFees(config);
    const claimedDelta = Math.max(0, claim.balanceAfter - claim.balanceBefore);

    const buy = await buyBasket(
      config,
      config.dryRun && claim.claimableLamports > 0
        ? claim.claimableLamports
        : claimedDelta > 0
          ? claimedDelta
          : undefined,
    );

    const airdrop = await airdropBasket(config);
    writeReceipt(config, "run", { claim, buy, airdrop });
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
