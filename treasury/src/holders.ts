import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import type { AppConfig } from "./config.js";

export type Holder = {
  owner: string;
  amount: bigint;
  ata: string;
};

const BURN_ADDRESSES = new Set([
  "1nc1nerator11111111111111111111111111111111",
  "DeadDeadDeadDeadDeadDeadDeadDeadDeadDeadD",
]);

type TokenAccountRow = {
  pubkey: string;
  owner: string;
  amount: bigint;
};

async function fetchViaHelius(
  mint: PublicKey,
  apiKey: string,
): Promise<TokenAccountRow[]> {
  const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  const rows: TokenAccountRow[] = [];
  let cursor: string | undefined;

  for (;;) {
    const body: Record<string, unknown> = {
      jsonrpc: "2.0",
      id: "etf-holders",
      method: "getTokenAccounts",
      params: {
        mint: mint.toBase58(),
        limit: 1000,
        ...(cursor ? { cursor } : {}),
        options: { showZeroBalance: false },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Helius getTokenAccounts HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      error?: { message?: string };
      result?: {
        token_accounts?: Array<{
          address: string;
          owner: string;
          amount: number | string;
        }>;
        cursor?: string;
      };
    };
    if (json.error) {
      throw new Error(json.error.message || "Helius getTokenAccounts error");
    }

    for (const acct of json.result?.token_accounts ?? []) {
      rows.push({
        pubkey: acct.address,
        owner: acct.owner,
        amount: BigInt(acct.amount),
      });
    }

    cursor = json.result?.cursor;
    if (!cursor) break;
  }

  return rows;
}

async function fetchViaRpc(connection: Connection, mint: PublicKey): Promise<TokenAccountRow[]> {
  const rows: TokenAccountRow[] = [];

  const scans: Array<{ programId: PublicKey; filters: Array<Record<string, unknown>> }> = [
    {
      programId: TOKEN_PROGRAM_ID,
      filters: [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: mint.toBase58() } },
      ],
    },
    {
      programId: TOKEN_2022_PROGRAM_ID,
      filters: [{ memcmp: { offset: 0, bytes: mint.toBase58() } }],
    },
  ];

  for (const scan of scans) {
    const accounts = await connection.getParsedProgramAccounts(scan.programId, {
      filters: scan.filters as never,
    });

    for (const { pubkey, account } of accounts) {
      const parsed = account.data as {
        parsed?: { info?: { owner?: string; tokenAmount?: { amount?: string } } };
      };
      const info = parsed.parsed?.info;
      if (!info?.owner || !info.tokenAmount?.amount) continue;
      const amount = BigInt(info.tokenAmount.amount);
      if (amount <= 0n) continue;
      rows.push({
        pubkey: pubkey.toBase58(),
        owner: info.owner,
        amount,
      });
    }
  }

  return rows;
}

export async function fetchHolders(
  connection: Connection,
  config: AppConfig,
  mint: PublicKey,
): Promise<Holder[]> {
  const raw = config.heliusApiKey
    ? await fetchViaHelius(mint, config.heliusApiKey)
    : await fetchViaRpc(connection, mint);

  const byOwner = new Map<string, Holder>();
  for (const row of raw) {
    if (row.amount < config.minHolderBalance) continue;
    if (BURN_ADDRESSES.has(row.owner)) continue;
    if (config.excludeHolders.has(row.owner)) continue;
    if (row.owner === config.creator.publicKey.toBase58()) continue;

    const existing = byOwner.get(row.owner);
    if (existing) {
      existing.amount += row.amount;
    } else {
      byOwner.set(row.owner, {
        owner: row.owner,
        amount: row.amount,
        ata: row.pubkey,
      });
    }
  }

  const holders = [...byOwner.values()].sort((a, b) =>
    a.amount === b.amount ? a.owner.localeCompare(b.owner) : a.amount > b.amount ? -1 : 1,
  );

  console.log(`[holders] ${holders.length} eligible (min balance ${config.minHolderBalance})`);
  return holders;
}

export function allocateProRata(
  holders: Holder[],
  totalAmount: bigint,
): Array<{ owner: string; amount: bigint }> {
  if (holders.length === 0 || totalAmount <= 0n) return [];

  const supply = holders.reduce((sum, h) => sum + h.amount, 0n);
  if (supply <= 0n) return [];

  const allocations: Array<{ owner: string; amount: bigint }> = [];
  let distributed = 0n;

  for (let i = 0; i < holders.length; i++) {
    const holder = holders[i]!;
    const isLast = i === holders.length - 1;
    const share = isLast
      ? totalAmount - distributed
      : (totalAmount * holder.amount) / supply;
    if (share <= 0n) continue;
    allocations.push({ owner: holder.owner, amount: share });
    distributed += share;
  }

  return allocations;
}
