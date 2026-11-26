import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const CA = "TBA";
const BUY_URL = "#buy";
const X_URL = "https://x.com/";
const TELEGRAM_URL = "https://t.me/";
const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

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

const STEPS = [
  {
    n: "01",
    title: "Claim",
    body: "Sweep pump bonding-curve and AMM creator fees into the treasury wallet.",
  },
  {
    n: "02",
    title: "Buy",
    body: "Route claimed SOL into the basket — dollars, gold, silver, whatever you wire.",
  },
  {
    n: "03",
    title: "Airdrop",
    body: "Snapshot $ETF holders and send pro-rata cuts of each purchased asset.",
  },
];

const ASSETS = [
  {
    symbol: "USDC",
    name: "Dollar stack",
    weight: "Live",
    thesis: "Cash that holds when risk sells off.",
    image: asset("dollar-desk.jpg"),
  },
  {
    symbol: "XAU",
    name: "Tokenized gold",
    weight: "Soon",
    thesis: "Hard asset bid in risk-off regimes.",
    image: asset("vault-gold.jpg"),
  },
  {
    symbol: "XAG",
    name: "Tokenized silver",
    weight: "Soon",
    thesis: "Industrial metal with monetary heat.",
    image: asset("silver-stack.jpg"),
  },
];

function ChartBackdrop() {
  return (
    <svg className="hero-chart" viewBox="0 0 1200 420" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 340 C140 310 200 240 290 255 C390 275 450 150 560 130 C680 105 740 210 830 175 C940 130 1020 70 1140 45 L1200 30 L1200 420 L0 420 Z"
        fill="url(#fillGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <motion.path
        d="M0 340 C140 310 200 240 290 255 C390 275 450 150 560 130 C680 105 740 210 830 175 C940 130 1020 70 1140 45 L1200 30"
        fill="none"
        stroke="#ff6a00"
        strokeWidth="2.75"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.9, ease: "easeInOut" }}
      />
    </svg>
  );
}

function DivergenceBoard() {
  const risk = [
    { t: "BTC", v: -24 },
    { t: "ETH", v: -31 },
    { t: "SOL", v: -42 },
    { t: "MEME", v: -58 },
  ];
  const haven = [
    { t: "USD", v: 6 },
    { t: "XAU", v: 18 },
    { t: "XAG", v: 14 },
    { t: "DXY", v: 9 },
  ];

  return (
    <div className="divergence">
      <div className="divergence-col down">
        <p className="divergence-label">Risk book</p>
        {risk.map((row) => (
          <div className="divergence-row" key={row.t}>
            <span>{row.t}</span>
            <div className="bar-track">
              <motion.div
                className="bar fill-down"
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(100, Math.abs(row.v) * 1.4)}%` }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
            <strong>{row.v}%</strong>
          </div>
        ))}
      </div>
      <div className="divergence-col up">
        <p className="divergence-label">Haven book</p>
        {haven.map((row) => (
          <div className="divergence-row" key={row.t}>
            <span>{row.t}</span>
            <div className="bar-track">
              <motion.div
                className="bar fill-up"
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(100, row.v * 4)}%` }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
            <strong>+{row.v}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const tape = [...TICKER, ...TICKER];
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.35]);

  return (
    <>
      <header className="topbar">
        <div className="shell topbar-inner">
          <a className="brand-mark" href="#top">
            ETF
          </a>
          <nav className="nav" aria-label="Primary">
            <a href="#thesis">Thesis</a>
            <a href="#mechanism">Flow</a>
            <a href="#basket">Basket</a>
            <a href="#airdrop">Airdrop</a>
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
        <section className="hero" ref={heroRef}>
          <motion.div className="hero-media" style={{ y: heroY, opacity: heroOpacity }}>
            <img src={asset("vault-gold.jpg")} alt="" />
            <div className="hero-media-shade" />
          </motion.div>
          <div className="hero-grid" />
          <ChartBackdrop />
          <div className="shell hero-content">
            <motion.p
              className="hero-kicker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              Solana · pump.fun · treasury loop
            </motion.p>
            <motion.h1
              className="hero-brand"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              ETF
            </motion.h1>
            <motion.p
              className="hero-headline"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.5 }}
            >
              The bear-market exchange-traded coin
            </motion.p>
            <motion.p
              className="hero-sub"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.5 }}
            >
              Fees buy what goes up when everything else does not — then airdrop it to holders.
            </motion.p>
            <motion.div
              className="cta-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.36, duration: 0.45 }}
            >
              <a className="btn btn-primary" href={BUY_URL}>
                Buy on pump.fun
              </a>
              <a className="btn btn-ghost" href="#mechanism">
                See the loop
              </a>
            </motion.div>
          </div>
        </section>

        <section className="band band-ink" id="thesis">
          <div className="shell split">
            <div className="split-copy">
              <p className="section-label">Thesis</p>
              <h2 className="section-title section-title-lg">
                Risk dumps.
                <br />
                <span className="accent">Havens print.</span>
              </h2>
              <p className="section-copy">
                Most coins only eat upside. $ETF is structured for the other tape — dollars, metals,
                anything that strengthens while the market bleeds.
              </p>
            </div>
            <motion.figure
              className="split-media"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7 }}
            >
              <img src={asset("dollar-desk.jpg")} alt="Dollar desk under amber light" />
              <figcaption>USD exposure · first sleeve of the treasury</figcaption>
            </motion.figure>
          </div>
        </section>

        <section className="band band-slate">
          <div className="shell">
            <p className="section-label">Divergence</p>
            <h2 className="section-title">Same market. Opposite tape.</h2>
            <p className="section-copy">
              Illustrative drawdowns vs haven bids — the reason the treasury exists.
            </p>
            <DivergenceBoard />
          </div>
        </section>

        <section className="band band-flow" id="mechanism">
          <div className="shell">
            <p className="section-label">Mechanism</p>
            <h2 className="section-title">Fees in. Safe-haven out.</h2>
            <div className="flow-rail">
              {STEPS.map((step, i) => (
                <motion.article
                  key={step.n}
                  className="flow-item"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: i * 0.12, duration: 0.55 }}
                >
                  <span className="flow-n">{step.n}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-bleed" id="basket">
          <div className="shell">
            <p className="section-label">Treasury basket</p>
            <h2 className="section-title">What the fees buy</h2>
            <p className="section-copy">
              Weights live in <code>treasury/basket.json</code>. Start in dollars; layer metals when the
              mints are live.
            </p>
          </div>
          <div className="asset-rail">
            {ASSETS.map((asset, i) => (
              <motion.article
                key={asset.symbol}
                className="asset-tile"
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <div className="asset-photo">
                  <img src={asset.image} alt={asset.name} />
                </div>
                <div className="asset-meta">
                  <div className="asset-top">
                    <span className="asset-symbol">{asset.symbol}</span>
                    <span className="asset-weight">{asset.weight}</span>
                  </div>
                  <h3>{asset.name}</h3>
                  <p>{asset.thesis}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="band band-ink" id="airdrop">
          <div className="shell split split-reverse">
            <motion.figure
              className="split-media tall"
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
            >
              <img src={asset("silver-stack.jpg")} alt="Silver stack" />
              <figcaption>Holders receive the bought sleeve — not vibes</figcaption>
            </motion.figure>
            <div className="split-copy">
              <p className="section-label">Airdrop</p>
              <h2 className="section-title">
                Hold $ETF.
                <br />
                Get the tape.
              </h2>
              <p className="section-copy">
                Pro-rata by balance at snapshot. Creator wallet and burns are skipped. Operator CLI
                dry-runs by default.
              </p>
              <div className="terminal-block">
                <pre>
                  {`> etf-treasury run --dry-run
[claim] vault 0.42 SOL
[buy]   USDC quote ok
[airdrop] 128 recipients
`}
                  <span className="hl">cycle complete</span>
                </pre>
              </div>
              <dl className="soft-kv">
                <div>
                  <dt>Contract</dt>
                  <dd>{CA}</dd>
                </div>
                <div>
                  <dt>Chain</dt>
                  <dd>Solana · pump.fun</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="marquee-band" aria-hidden="true">
          <div className="marquee-track">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i}>
                BUY THE DIP IN RISK · AIRDROP THE RALLY IN HAVENS · <em>$ETF</em> ·
              </span>
            ))}
          </div>
        </section>

        <section className="band band-cta" id="links">
          <div className="cta-stage">
            <img src={asset("vault-gold.jpg")} alt="" />
            <div className="cta-stage-shade" />
            <div className="shell cta-stage-copy">
              <p className="section-label">Terminal</p>
              <h2 className="section-title section-title-xl">Enter the book</h2>
              <p className="section-copy on-dark">
                CA and socials lock after launch. Until then — watch the tape and stack the coin.
              </p>
              <div className="cta-row">
                <a className="btn btn-primary" href={BUY_URL}>
                  Buy $ETF
                </a>
                <a className="btn btn-ghost on-media" href={X_URL} target="_blank" rel="noreferrer">
                  X / Twitter
                </a>
                <a
                  className="btn btn-ghost on-media"
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Telegram
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell footer-inner">
          <div>
            <strong className="accent">ETF</strong> · not financial advice · meme market structure
          </div>
          <div className="footer-links">
            <a href="#thesis">Thesis</a>
            <a href="#basket">Basket</a>
            <a href="#airdrop">Airdrop</a>
          </div>
        </div>
      </footer>
    </>
  );
}
