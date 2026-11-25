import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TREASURY_ROOT = path.resolve(__dirname, "..");
export const REPO_ROOT = path.resolve(TREASURY_ROOT, "..");

dotenv.config({ path: path.join(REPO_ROOT, ".env") });
dotenv.config({ path: path.join(TREASURY_ROOT, ".env") });

export type BasketAsset = {
  symbol: string;
  mint: string;
  bps: number;
  note?: string;
};

export type AppConfig = {
  rpcUrl: string;
  heliusApiKey: string | null;
  creator: Keypair;
  etfMint: PublicKey | null;
  basket: BasketAsset[];
  gasReserveLamports: number;
  minClaimLamports: number;
  jupiterApiKey: string | null;
  dryRun: boolean;
  airdropBatchSize: number;
  minHolderBalance: bigint;
  excludeHolders: Set<string>;
  receiptsDir: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env ${name}`);
  return value;
}

function parseSecretKey(raw: string): Keypair {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    const arr = JSON.parse(trimmed) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }
  return Keypair.fromSecretKey(bs58.decode(trimmed));
}

function loadBasket(): BasketAsset[] {
  const custom = process.env.BASKET_PATH?.trim();
  const basketPath = custom
    ? path.isAbsolute(custom)
      ? custom
      : path.resolve(REPO_ROOT, custom)
    : path.join(TREASURY_ROOT, "basket.json");

  if (!fs.existsSync(basketPath)) {
    throw new Error(`Basket config not found at ${basketPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(basketPath, "utf8")) as BasketAsset[];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Basket must be a non-empty array");
  }

  let totalBps = 0;
  for (const asset of raw) {
    if (!asset.symbol || !asset.mint || !Number.isInteger(asset.bps) || asset.bps <= 0) {
      throw new Error(`Invalid basket asset: ${JSON.stringify(asset)}`);
    }
    new PublicKey(asset.mint);
    totalBps += asset.bps;
  }
  if (totalBps !== 10_000) {
    throw new Error(`Basket bps must sum to 10000, got ${totalBps}`);
  }
  return raw;
}

export function loadConfig(overrides: { dryRun?: boolean } = {}): AppConfig {
  const rpcUrl =
    process.env.SOLANA_RPC_URL?.trim() ||
    process.env.HELIUS_RPC_URL?.trim() ||
    "https://api.mainnet-beta.solana.com";

  const etfMintRaw = process.env.ETF_MINT?.trim();
  const exclude = (process.env.EXCLUDE_HOLDERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const dryRunEnv = process.env.DRY_RUN;
  const dryRun =
    overrides.dryRun ??
    (dryRunEnv === undefined ? true : !["0", "false", "no"].includes(dryRunEnv.toLowerCase()));

  return {
    rpcUrl,
    heliusApiKey: process.env.HELIUS_API_KEY?.trim() || null,
    creator: parseSecretKey(requireEnv("CREATOR_SECRET_KEY")),
    etfMint: etfMintRaw ? new PublicKey(etfMintRaw) : null,
    basket: loadBasket(),
    gasReserveLamports: Number(process.env.GAS_RESERVE_LAMPORTS || 50_000_000),
    minClaimLamports: Number(process.env.MIN_CLAIM_LAMPORTS || 10_000_000),
    jupiterApiKey: process.env.JUPITER_API_KEY?.trim() || null,
    dryRun,
    airdropBatchSize: Math.max(1, Number(process.env.AIRDROP_BATCH_SIZE || 8)),
    minHolderBalance: BigInt(process.env.MIN_HOLDER_BALANCE || "1"),
    excludeHolders: new Set(exclude),
    receiptsDir: path.join(TREASURY_ROOT, "receipts"),
  };
}

export function requireEtfMint(config: AppConfig): PublicKey {
  if (!config.etfMint) {
    throw new Error("ETF_MINT is required for this command");
  }
  return config.etfMint;
}
