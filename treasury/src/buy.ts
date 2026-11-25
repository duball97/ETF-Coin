import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import type { AppConfig, BasketAsset } from "./config.js";
import { getConnection } from "./connection.js";

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1";
const SOL_MINT = "So11111111111111111111111111111111111111112";

export type SwapResult = {
  symbol: string;
  mint: string;
  solInLamports: number;
  outAmount: string | null;
  signature: string | null;
  skipped?: string;
};

function jupiterHeaders(apiKey: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (apiKey) headers["x-api-key"] = apiKey;
  return headers;
}

async function swapSolForMint(opts: {
  keypair: Keypair;
  outputMint: string;
  amountLamports: number;
  apiKey: string | null;
  dryRun: boolean;
  rpcUrl: string;
}): Promise<{ outAmount: string; signature: string | null }> {
  const { keypair, outputMint, amountLamports, apiKey, dryRun } = opts;
  const orderUrl =
    `${JUPITER_ULTRA_API}/order?inputMint=${SOL_MINT}` +
    `&outputMint=${outputMint}` +
    `&amount=${amountLamports}` +
    `&taker=${keypair.publicKey.toBase58()}`;

  const orderRes = await fetch(orderUrl, { headers: jupiterHeaders(apiKey) });
  if (!orderRes.ok) {
    throw new Error(`Jupiter order ${orderRes.status}: ${await orderRes.text()}`);
  }
  const order = (await orderRes.json()) as {
    transaction?: string;
    requestId?: string;
    outAmount?: string;
    error?: string;
    errorMessage?: string;
  };

  if (order.error || order.errorMessage) {
    throw new Error(order.errorMessage || order.error || "Jupiter order error");
  }
  if (!order.transaction || !order.requestId) {
    throw new Error("Jupiter order missing transaction/requestId");
  }

  console.log(
    `[buy] quote ${amountLamports} lamports SOL -> ${order.outAmount ?? "?"} (${outputMint.slice(0, 8)}…)`,
  );

  if (dryRun) {
    return { outAmount: order.outAmount ?? "0", signature: null };
  }

  const tx = VersionedTransaction.deserialize(Buffer.from(order.transaction, "base64"));
  tx.sign([keypair]);
  const signedTransaction = Buffer.from(tx.serialize()).toString("base64");

  const execRes = await fetch(`${JUPITER_ULTRA_API}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...jupiterHeaders(apiKey) },
    body: JSON.stringify({ signedTransaction, requestId: order.requestId }),
  });
  if (!execRes.ok) {
    throw new Error(`Jupiter execute ${execRes.status}: ${await execRes.text()}`);
  }
  const exec = (await execRes.json()) as {
    signature?: string;
    status?: string;
    error?: string;
  };
  if (exec.error || (exec.status && exec.status !== "Success")) {
    throw new Error(exec.error || `Jupiter status ${exec.status}`);
  }

  return { outAmount: order.outAmount ?? "0", signature: exec.signature ?? null };
}

export async function buyBasket(config: AppConfig, solBudgetLamports?: number): Promise<SwapResult[]> {
  const connection = getConnection(config);
  const balance = await connection.getBalance(config.creator.publicKey);
  const spendable = Math.max(0, balance - config.gasReserveLamports);
  const budget = solBudgetLamports !== undefined ? Math.min(solBudgetLamports, spendable) : spendable;

  console.log(
    `[buy] wallet ${balance / LAMPORTS_PER_SOL} SOL | spendable ${budget / LAMPORTS_PER_SOL} SOL`,
  );

  if (budget < 1_000_000) {
    console.log("[buy] budget too small; skipping");
    return config.basket.map((asset) => ({
      symbol: asset.symbol,
      mint: asset.mint,
      solInLamports: 0,
      outAmount: null,
      signature: null,
      skipped: "budget too small",
    }));
  }

  const results: SwapResult[] = [];
  let allocated = 0;

  for (let i = 0; i < config.basket.length; i++) {
    const asset = config.basket[i] as BasketAsset;
    const isLast = i === config.basket.length - 1;
    const share = isLast
      ? budget - allocated
      : Math.floor((budget * asset.bps) / 10_000);
    allocated += share;

    if (share < 50_000) {
      results.push({
        symbol: asset.symbol,
        mint: asset.mint,
        solInLamports: share,
        outAmount: null,
        signature: null,
        skipped: "share too small",
      });
      continue;
    }

    // Sanity: mint must parse
    new PublicKey(asset.mint);

    try {
      const { outAmount, signature } = await swapSolForMint({
        keypair: config.creator,
        outputMint: asset.mint,
        amountLamports: share,
        apiKey: config.jupiterApiKey,
        dryRun: config.dryRun,
        rpcUrl: config.rpcUrl,
      });
      results.push({
        symbol: asset.symbol,
        mint: asset.mint,
        solInLamports: share,
        outAmount,
        signature,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[buy] ${asset.symbol} failed: ${message}`);
      results.push({
        symbol: asset.symbol,
        mint: asset.mint,
        solInLamports: share,
        outAmount: null,
        signature: null,
        skipped: message,
      });
    }
  }

  return results;
}
