import { motion } from "framer-motion";

const CA = "TBA";
const BUY_URL = "#buy";
const X_URL = "https://x.com/";
const TELEGRAM_URL = "https://t.me/";

const TICKER = [
  { label: "USD", value: "+0.42%", up: true },
  { label: "XAU", value: "+1.18%", up: true },
  { label: "XAG", value: "+0.91%", up: true },
  { label: "BTC", value: "-2.40%", up: false },
  { label: "ETH", value: "-1.87%", up: false },
  { label: "SOL", value: "-3.12%", up: false },
  { label: "DXY", value: "+0.35%", up: true },
  { label: "ETF TREASURY", value: "ACCUMULATING", up: true },
];

const BASKET = [
  { symbol: "USDC", name: "USD Coin", weight: "100%", thesis: "Cash that strengthens when risk sells off", mint: "EPjF…Dt1v" },
  { symbol: "XAU*", name: "Tokenized gold", weight: "TBA", thesis: "Hard asset bid in risk-off regimes", mint: "Configure in basket.json" },
  { symbol: "XAG*", name: "Tokenized silver", weight: "TBA", thesis: "Industrial + monetary hedge", mint: "Configure in basket.json" },
];

function ChartBackdrop() {
  return (
    <svg className="hero-chart" viewBox="0 0 1200 420" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 320 C120 300 180 250 260 270 C360 295 420 180 520 160 C640 135 700 220 780 190 C880 150 960 80 1080 60 L1200 40 L1200 420 L0 420 Z"
        fill="url(#fillGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <motion.path
        d="M0 320 C120 300 180 250 260 270 C360 295 420 180 520 160 C640 135 700 220 780 190 C880 150 960 80 1080 60 L1200 40"
        fill="none"
        stroke="#ff6a00"
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
      />
      {[260, 520, 780, 1080].map((x, i) => (
        <motion.circle
          key={x}
          cx={x}
          cy={[270, 160, 190, 60][i]}
          r="4"
          fill="#ff6a00"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 + i * 0.18, duration: 0.35 }}
        />
      ))}
    </svg>
  );
}

export default function App() {
  const tape = [...TICKER, ...TICKER];

  return (
    <>
      <header className="topbar">
        <div className="shell topbar-inner">
          <a className="brand-mark" href="#top">
            ETF
          </a>
          <nav className="nav" aria-label="Primary">
            <a href="#mechanism">Mechanism</a>
            <a href="#basket">Basket</a>
            <a href="#airdrop">Airdrop</a>
            <a href="#links">Links</a>
          </nav>
          <a className="btn btn-primary" href={BUY_URL}>
            Buy $ETF
          </a>
        </div>
      </header>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {tape.map((item, i) => (
            <span key={`${item.label}-${i}`}>
              <strong>{item.label}</strong>{" "}
              <span className={item.up ? "up" : "down"}>{item.value}</span>
            </span>
          ))}
        </div>
      </div>

      <main id="top">
        <section className="hero">
          <div className="hero-grid" />
          <ChartBackdrop />
          <div className="shell hero-content">
            <motion.h1
              className="hero-brand"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              ETF
            </motion.h1>
            <motion.p
              className="hero-headline"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              The bear-market exchange-traded coin
            </motion.p>
            <motion.p
              className="hero-sub"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.5 }}
            >
              Trading fees fund a treasury that buys what goes up when everything else does not — then airdrops it to holders.
            </motion.p>
            <motion.div
              className="cta-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.45 }}
            >
              <a className="btn btn-primary" href={BUY_URL}>
                Buy on pump.fun
              </a>
              <a className="btn btn-ghost" href="#mechanism">
                Read the tape
              </a>
            </motion.div>
          </div>
        </section>

        <section className="section" id="mechanism">
          <div className="shell">
            <p className="section-label">01 / Mechanism</p>
            <h2 className="section-title">Fees in. Safe-haven out.</h2>
            <p className="section-copy">
              $ETF is a normal Solana coin. Creator fees accumulate on pump.fun, get claimed by the treasury, swapped into a defined basket, and distributed to holders by balance.
            </p>
            <div className="flow">
              <article className="flow-step">
                <div className="flow-index">STEP 01</div>
                <h3>Claim</h3>
                <p>Sweep pump bonding-curve and AMM creator fees into the treasury wallet.</p>
              </article>
              <article className="flow-step">
                <div className="flow-index">STEP 02</div>
                <h3>Buy</h3>
                <p>Route claimed SOL into basket assets — USD, gold, silver, whatever you wire in.</p>
              </article>
              <article className="flow-step">
                <div className="flow-index">STEP 03</div>
                <h3>Airdrop</h3>
                <p>Snapshot $ETF holders and send pro-rata allocations of each purchased asset.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="basket">
          <div className="shell">
            <p className="section-label">02 / Treasury basket</p>
            <h2 className="section-title">Assets that rise when risk falls</h2>
            <p className="section-copy">
              Weights live in <code>treasury/basket.json</code>. Start with USDC; add tokenized metals when the mints are set.
            </p>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Weight</th>
                    <th>Thesis</th>
                    <th>Mint</th>
                  </tr>
                </thead>
                <tbody>
                  {BASKET.map((row) => (
                    <tr key={row.symbol}>
                      <td className="symbol">{row.symbol}</td>
                      <td>{row.name}</td>
                      <td>{row.weight}</td>
                      <td>{row.thesis}</td>
                      <td>{row.mint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="section" id="airdrop">
          <div className="shell">
            <p className="section-label">03 / Holder distribution</p>
            <h2 className="section-title">Hold $ETF. Get the tape.</h2>
            <div className="meta-grid">
              <div className="terminal-block">
                <pre>
                  {`> etf-treasury run --dry-run
[claim] vault 0.42 SOL
[buy]  USDC  quote ok
[holders] 128 eligible
[airdrop] USDC -> 128 recipients
`}
                  <span className="hl">cycle complete · receipt written</span>
                </pre>
              </div>
              <dl className="kv">
                <div className="kv-row">
                  <dt>Allocation</dt>
                  <dd>Pro-rata by $ETF balance at snapshot</dd>
                </div>
                <div className="kv-row">
                  <dt>Exclusions</dt>
                  <dd>Burn addresses, creator wallet, configured excludes</dd>
                </div>
                <div className="kv-row">
                  <dt>Operator</dt>
                  <dd>CLI dry-run by default; --live to broadcast</dd>
                </div>
                <div className="kv-row">
                  <dt>Contract</dt>
                  <dd>{CA}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="section" id="links">
          <div className="shell">
            <p className="section-label">04 / Terminal links</p>
            <h2 className="section-title">Connect</h2>
            <p className="section-copy">CA and socials ship after launch. Buttons below are placeholders.</p>
            <div className="cta-row">
              <a className="btn btn-primary" href={BUY_URL}>
                Buy $ETF
              </a>
              <a className="btn btn-ghost" href={X_URL} target="_blank" rel="noreferrer">
                X / Twitter
              </a>
              <a className="btn btn-ghost" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
                Telegram
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell footer-inner">
          <div>
            <strong style={{ color: "var(--amber)" }}>ETF</strong> · not financial advice · meme market structure
          </div>
          <div className="footer-links">
            <a href="#mechanism">Mechanism</a>
            <a href="#basket">Basket</a>
            <a href="#airdrop">Airdrop</a>
          </div>
        </div>
      </footer>
    </>
  );
}
