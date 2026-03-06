# PolyTrail

**A Polymarket trading bot** that automates impulse detection, entry, trailing stops, hedging, and redemption for Up/Down binary markets (crypto and sports).

## Demo

[![PolyTrail Demo](https://img.youtube.com/vi/hEL-0NPLiDE/maxresdefault.jpg)](https://youtu.be/hEL-0NPLiDE)


---

## Project Overview

PolyTrail is a full-stack application consisting of:

| Component | Port | Description |
|-----------|------|-------------|
| **Backend** | 3003 | Trading loop, impulse detection, order execution, auto-redeem |
| **Frontend** | 3004 | Dashboard and settings UI (this folder) |
| **Redis** | 6379 | Bot config, impulse state, price history |
| **MongoDB** | 27017 | Buy history, redeem records |

The backend writes to Redis and MongoDB; the frontend reads from them via its own API routes. No direct HTTP calls between frontend and backend.

---

## Features

| Feature | Description |
|---------|-------------|
| **Impulse detection** | Detects sudden price jumps using configurable lookback and min-jump thresholds |
| **Automatic entry** | Buys the rising side (Up or Down) on impulse with market orders |
| **Trailing stop** | Tracks highest price since entry; triggers hedge when price drops by configured % |
| **Hedging** | Buys opposite side when trailing stop hits—locks in position (Up+Down ≈ $1 at settlement) |
| **Auto-redeem** | Redeems winning positions automatically when markets resolve |
| **Real-time prices** | Polymarket CLOB WebSocket for live prices; dashboard updates every 5s |
| **Multi-market** | Crypto (btc-updown-5m, btc-updown-15m) and **sports** (event slugs) |
| **Dashboard** | Live chart, P&L, buy/redeem history, config presets |

---

## Strategy

1. **Market Selection** – Crypto: watches by slug prefix, auto-switches when window ends. Sports: single event slug.
2. **Impulse Detection** – Up or Down price jumps by ≥ `minJump` from min in lookback, and price ≥ `limitPrice`.
3. **Initial Buy** – Buys once on the rising side at best ask.
4. **Trailing Stop** – If price drops by `trailingStopPct` from high, triggers hedge.
5. **Hedge** – Buys opposite side; Up+Down resolves to ~$1.
6. **Auto-Redeem** – Redeems when market resolves.

---

## Supported Markets

| Mode | Example |
|------|---------|
| **Crypto** | `btc-updown-15m`, `eth-updown-5m` |
| **Sports** | Full event slug from polymarket.com/event/... (e.g. `nfl-bills-broncos-week-10`) |

---

# Frontend (this folder)

Dashboard and settings UI for PolyTrail.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **Recharts** – price charts
- **MongoDB** – buy history, redeem records
- **Redis** – bot config, impulse state, price history

## Prerequisites

- Node.js 18+
- MongoDB (same instance as backend)
- Redis (same instance as backend)
- Backend running (optional for full functionality—dashboard shows last state from Redis)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment** – Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and set:
   - `MONGODB_URI` – MongoDB connection string
   - `REDIS_HOST` – Redis host (default: `localhost`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3004 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
frontend/
├── app/
│   ├── api/              # API routes (server-side)
│   │   ├── bot-config/   # Bot config (Redis)
│   │   ├── bot-enabled/  # Bot enable/disable
│   │   ├── bot-toggle/   # Toggle bot
│   │   ├── health/       # Health check
│   │   ├── impulse-buys/ # Buy history (MongoDB)
│   │   ├── impulse-state/# Live state (Redis)
│   │   ├── redeem-history/
│   │   └── stats/
│   ├── layout.tsx
│   ├── page.tsx          # Dashboard
│   ├── settings/         # Settings page
│   └── globals.css
├── components/            # React components
├── contexts/              # React contexts (Toast)
├── hooks/
└── lib/                   # DB clients (MongoDB, Redis)
```

## Pages

- **/** – Dashboard: live prices, chart, P&L, buy/redeem history
- **/settings** – Bot control, config presets, market mode (crypto/sports)

## API Routes

The frontend runs its own API routes that read from Redis and MongoDB. They are server-side Next.js handlers, not proxies to the backend. The backend runs separately and writes to Redis/MongoDB.
