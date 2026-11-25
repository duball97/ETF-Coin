# ETF Coin

Bloomberg-terminal-style site for **$ETF** — a Solana meme coin whose pump.fun creator fees buy “what goes up in a bear market” (USD, gold, silver, …) and airdrop those assets to holders.

```
web/          React (Vite) marketing site
treasury/     Node CLI: claim → buy basket → airdrop holders
```

## Site

```bash
npm run dev
# http://localhost:5173
```

Update buy / social placeholders in [`web/src/App.tsx`](web/src/App.tsx) once the CA is live.

## Treasury CLI

Claims pump.fun + pump AMM creator fees via `@pump-fun/pump-sdk`, swaps SOL into the basket with Jupiter Ultra, then pro-rata airdrops to `$ETF` holders.

### Setup

```bash
cp .env.example .env
# set CREATOR_SECRET_KEY (base58 or JSON byte array)
# set ETF_MINT after launch
# set SOLANA_RPC_URL (Helius recommended) and optional HELIUS_API_KEY / JUPITER_API_KEY

cd treasury && npm install
```

Edit the buy targets in [`treasury/basket.json`](treasury/basket.json). Weights are in BPS and must sum to `10000`.

### Commands

Dry-run is the default (`DRY_RUN=true`).

```bash
# from repo root
npm run treasury -- status
npm run treasury:claim          # claim fees only
npm run treasury:buy            # swap spendable SOL into basket
npm run treasury:airdrop        # distribute treasury token balances
npm run treasury:run            # full cycle

# force dry-run / live
npm run treasury -- run --dry-run
npm run treasury -- run --live
```

Or from `treasury/`:

```bash
npm run status
npm run claim -- --dry-run
npm run buy -- --sol 0.1
npm run airdrop
npm run run:cycle -- --live
```

Receipts land in `treasury/receipts/`.

### Cycle

1. **Claim** — `OnlinePumpSdk.collectCoinCreatorFeeInstructions` sweeps bonding-curve + AMM creator vaults.
2. **Buy** — Spendable wallet SOL (minus `GAS_RESERVE_LAMPORTS`) is split by basket BPS and swapped via Jupiter Ultra.
3. **Airdrop** — Snapshot `$ETF` holders (Helius `getTokenAccounts` if `HELIUS_API_KEY` is set, else RPC), allocate pro-rata, batch SPL transfers (creates ATAs as needed).

Creator wallet, burn addresses, and `EXCLUDE_HOLDERS` are skipped.

## Security

- Never commit `.env` or a real `CREATOR_SECRET_KEY`.
- Always dry-run a cycle before `--live`.
- Prefer a dedicated fee-recipient / treasury key with limited SOL.
