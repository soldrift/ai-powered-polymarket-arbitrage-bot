# PolyTrail

**A Polymarket trading bot** that automates impulse detection, entry, trailing stops, hedging, and redemption for Up/Down binary markets.

---

## Features

PolyTrail is a full-featured Polymarket trading bot with:

| Feature | Description |
|---------|-------------|
| **Impulse detection** | Detects sudden price jumps in Up/Down markets using configurable lookback and min-jump thresholds |
| **Automatic entry** | Buys the rising side (Up or Down) on impulse with market orders (FAK) |
| **Trailing stop** | Tracks highest price since entry; triggers hedge when price drops by configured % |
| **Hedging** | Buys opposite side when trailing stop hits—locks in position (Up+Down ≈ $1 at settlement) |
| **Auto-redeem** | Redeems winning positions automatically when markets resolve |
| **Real-time prices** | Polymarket CLOB WebSocket for live Up/Down prices; dashboard updates in real time |
| **Multi-market support** | Configurable slug prefix for BTC 5m/15m, ETH 5m/15m, or other Up/Down markets |
| **Dashboard & settings** | Next.js UI with live chart, P&L, buy/redeem history, config presets |

---

## Strategy Overview

1. **Market Selection** – Watches Polymarket Up/Down markets by slug prefix (e.g. `btc-updown-5m`). Auto-switches to next market when current window ends.

2. **Impulse Detection** – When Up or Down price **jumps** by at least `minJump` from the minimum in the lookback window, and price ≥ `limitPrice`, the bot treats it as an impulse.

3. **Initial Buy** – Buys **once** on the rising side with a market order at best ask. Never buys both sides on the same impulse.

4. **Trailing Stop** – Tracks highest price since buy. If price drops by `trailingStopPct` (e.g. 5%) from that high, triggers hedge.

5. **Hedge** – Buys the opposite side. Holding Up+Down resolves to ~$1 when the market settles.

6. **Auto-Redeem** – Redeems winning positions when the market resolves.

---

## Supported Markets

| Slug Prefix     | Window (sec) | Example              |
|-----------------|--------------|----------------------|
| `btc-updown-5m` | 300          | Bitcoin 5‑minute     |
| `btc-updown-15m`| 900          | Bitcoin 15‑minute    |
| `eth-updown-5m` | 300          | Ethereum 5‑minute    |

Set `POLYMARKET_SLUG_PREFIX` and `IMPULSE_WINDOW_SECONDS` in `.env`, or use the **Settings** page. Config is stored in Redis and applied on the next poll.

---

## Installation

### Prerequisites

- Node.js 18+
- MongoDB
- Redis

### Steps

1. **Clone** the repo.

2. **Install dependencies**:
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Configure environment** – Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Required: `POLYMARKET_SLUG_PREFIX`, `IMPULSE_WINDOW_SECONDS`, `PRIVATE_KEY`, `PROXY_WALLET_ADDRESS`, `MONGODB_URI`, `REDIS_HOST`

4. **Create Polymarket credential** (one-time). Requires `PRIVATE_KEY` and `PROXY_WALLET_ADDRESS` in `.env`:
   ```bash
   npm run credential:recreate
   ```
   The bot will also auto-create credentials on first run if missing.

5. **Build**:
   ```bash
   npm run build
   cd frontend && npm run build && cd ..
   ```

---

## Usage

### Development

```bash
npm run dev
cd frontend && npm run dev
```

Open **http://localhost:3004** for the dashboard and settings.

### Production (PM2)

```bash
npm run build
cd frontend && npm run build
pm2 start ecosystem.config.cjs
```

Starts:
- `polytrail-bot` – backend (trading loop + services)
- `polytrail-frontend` – Next.js app on port 3004

---

## Configuration

Config via **Settings** in the UI (Redis) or `.env`.

| Parameter         | Default | Description                          |
|-------------------|---------|--------------------------------------|
| Slug Prefix       | btc-updown-5m | Market prefix                      |
| Window (sec)      | 300     | Market window (5m=300, 15m=900)     |
| Limit Price       | 0.6     | Min price to trigger impulse        |
| Min Jump          | 0.2     | Min price rise in lookback window   |
| Lookback (sec)    | 60      | Impulse detection window            |
| Trailing Stop %   | 5       | Hedge when price drops this %       |
| Buy Amount (USD)  | 2       | Order size for initial and hedge    |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| POLYMARKET_SLUG_PREFIX | Market prefix (e.g. btc-updown-5m) |
| IMPULSE_WINDOW_SECONDS | Market window in seconds |
| IMPULSE_LIMIT_PRICE | Min price to trigger impulse |
| IMPULSE_MIN_JUMP | Min rise in lookback window |
| IMPULSE_TRAILING_STOP_PCT | Hedge when price drops this % from high |
| IMPULSE_BUY_AMOUNT_USD | Order size in USD |
| PRIVATE_KEY | Ethereum private key |
| PROXY_WALLET_ADDRESS | Polymarket proxy safe address |
| MONGODB_URI | MongoDB connection string |
| REDIS_HOST | Redis host |

---

## Troubleshooting

### 401 Unauthorized / Invalid api key

The CLOB API credentials in `src/data/credential.json` are invalid or stale. Regenerate them:

```bash
npm run credential:recreate
```

Then restart the bot. Ensure:
- **PRIVATE_KEY** – The Ethereum key that controls your Polymarket account
- **PROXY_WALLET_ADDRESS** – Your Polymarket profile address from [polymarket.com/settings](https://polymarket.com/settings) (not your signer address)
- You must have logged into Polymarket at least once so the proxy wallet is deployed

---

## License

ISC
