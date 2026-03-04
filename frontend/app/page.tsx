"use client";

import { useState, useEffect, useCallback } from "react";
import { ImpulseChart } from "@/components/ImpulseChart";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { MarketCountdown } from "@/components/MarketCountdown";
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/Skeleton";
import { useToast } from "@/contexts/ToastContext";

const API_BASE = "/api";
const POLL_MS = 5000;

interface ImpulseEvent {
  ts: number;
  price: number;
  side: string;
  time: string;
}

interface ImpulseState {
  upPrice: number | null;
  downPrice: number | null;
  upTokenId: string | null;
  downTokenId: string | null;
  position: { side: string; highestPrice: number } | null;
  conditionId: string | null;
  currentSlug?: string | null;
  marketStartTime: number | null;
  marketEndTime: number | null;
  priceHistory: {
    up: { ts: number; price: number }[];
    down: { ts: number; price: number }[];
  } | null;
  impulseEvents: ImpulseEvent[];
  walletBalanceUsd: number | null;
  positionValueUsd: number | null;
}

interface ImpulseBuy {
  conditionId: string;
  eventSlug: string;
  side: string;
  type: string;
  price: number;
  amountUsd: number;
  shares: number;
  boughtAt: number;
}

interface RedeemRecord {
  conditionId: string;
  eventSlug: string | null;
  redeemedAt: number;
  tokensRedeemed: number;
  payoutUsd: number;
}

interface Stats {
  totalSpentUsd: number;
  totalRedeemedUsd: number;
  realizedPnl: number;
  totalBuys: number;
  totalRedeems: number;
}

export default function Home() {
  const [state, setState] = useState<ImpulseState | null>(null);
  const [buys, setBuys] = useState<ImpulseBuy[]>([]);
  const [redeems, setRedeems] = useState<RedeemRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [config, setConfig] = useState<{ limitPrice?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const [stateRes, buysRes, configRes, redeemRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/impulse-state?includeHistory=1`),
        fetch(`${API_BASE}/impulse-buys`),
        fetch(`${API_BASE}/bot-config`),
        fetch(`${API_BASE}/redeem-history`),
        fetch(`${API_BASE}/stats`),
      ]);
      const stateData = await stateRes.json();
      const buysData = await buysRes.json();
      const configData = await configRes.json();
      const redeemData = await redeemRes.json();
      const statsData = await statsRes.json();

      setState(stateData);
      setBuys(Array.isArray(buysData) ? buysData : []);
      setRedeems(Array.isArray(redeemData) ? redeemData : []);
      setStats(statsData);
      setConfig(configData.config || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const upPrice = state?.upPrice ?? null;
  const downPrice = state?.downPrice ?? null;

  const handleRefresh = () => {
    setLoading(true);
    load().finally(() => {
      setLoading(false);
      toast("Refreshed", "success");
    });
  };

  if (loading && !state) {
    return (
      <div className="bentoDashboard">
        <div className="bentoHeader">
          <Skeleton style={{ width: 200, height: 28 }} />
          <Skeleton style={{ width: 180, height: 24 }} />
        </div>
        <div className="bentoTicker">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} style={{ flex: 1, height: 48 }} />
          ))}
        </div>
        <div className="bentoMain">
          <Skeleton style={{ height: 320, borderRadius: "var(--radius-md)" }} />
          <div className="bentoSide">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
        <p style={{ color: "var(--error)", marginBottom: "var(--space-md)" }}>{error}</p>
        <button type="button" className="btn" onClick={() => { setError(null); load(); }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bentoDashboard">
      {/* Header row: title + actions */}
      <div className="bentoHeader">
        <div>
          <h1 className="sectionTitle" style={{ marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>Real-time market pulse & impulse signals</p>
        </div>
        <div className="bentoHeaderActions">
          <ConnectionStatus />
          <button type="button" className="btn btnSecondary" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>

      {/* Ticker bar: Up | Down | Position | Wallet - horizontal strip */}
      <div className="bentoTicker">
        <div className="tickerItem card card-price-up">
          <span className="tickerLabel">Up</span>
          <span className="tickerValue">
            {upPrice != null ? upPrice.toFixed(3) : "—"}
          </span>
        </div>
        <div className="tickerItem card card-price-down">
          <span className="tickerLabel">Down</span>
          <span className="tickerValue">
            {downPrice != null ? downPrice.toFixed(3) : "—"}
          </span>
        </div>
        <div className={`tickerItem card ${state?.position ? "card-position-active" : ""}`}>
          <span className="tickerLabel">Position</span>
          <span className="tickerValue">
            {state?.position ? `${state.position.side} @ ${state.position.highestPrice.toFixed(2)}` : "None"}
          </span>
        </div>
        <div className="tickerItem card">
          <span className="tickerLabel">Wallet</span>
          <span className="tickerValue">
            {state?.walletBalanceUsd != null ? `$${state.walletBalanceUsd.toFixed(2)}` : "—"}
          </span>
        </div>
      </div>

      {/* Main content: Chart (left) + Side panel (right) */}
      <div className="bentoMain">
        <div className="bentoChart">
          <ImpulseChart
            upHistory={state?.priceHistory?.up ?? []}
            downHistory={state?.priceHistory?.down ?? []}
            limitPrice={config?.limitPrice}
            upPrice={upPrice}
            downPrice={downPrice}
            marketStartTime={state?.marketStartTime ?? null}
            marketEndTime={state?.marketEndTime ?? null}
            impulseEvents={state?.impulseEvents ?? []}
          />
        </div>
        <div className="bentoSide">
          <div className="card">
            <div className="cardTitle">Current Market</div>
            <div className="cardValue" style={{ fontSize: "0.8125rem", wordBreak: "break-all", marginBottom: 8 }}>
              {state?.currentSlug || state?.conditionId || "—"}
            </div>
            {state?.marketStartTime && state?.marketEndTime && (
              <MarketCountdown
                marketStartTime={state.marketStartTime}
                marketEndTime={state.marketEndTime}
              />
            )}
          </div>
          {stats && (stats.totalBuys > 0 || stats.totalRedeems > 0) && (
            <div className="card card-pnl">
              <div className="cardTitle">P&L Summary</div>
              <div className="pnlGrid">
                <div>
                  <span className="pnlLabel">Spent</span>
                  <span className="pnlVal">${stats.totalSpentUsd.toFixed(2)}</span>
                </div>
                <div>
                  <span className="pnlLabel">Redeemed</span>
                  <span className="pnlVal">${stats.totalRedeemedUsd.toFixed(2)}</span>
                </div>
                <div>
                  <span className="pnlLabel">P&L</span>
                  <span className="pnlVal" style={{ color: stats.realizedPnl >= 0 ? "var(--success)" : "var(--error)" }}>
                    {stats.realizedPnl >= 0 ? "+" : ""}${stats.realizedPnl.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="pnlLabel">Trades</span>
                  <span className="pnlVal">{stats.totalBuys} · {stats.totalRedeems}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Buy History + Redeem History - two columns */}
      <div className="bentoBottom">
        <div className="bentoSection">
          <h2 className="sectionTitle">Buy History</h2>
          {buys.length === 0 ? (
            <div className="card card-empty" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8, opacity: 0.4 }}>📊</div>
              <p style={{ color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 }}>No buys yet</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Enable bot in Settings</p>
            </div>
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Side</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Shares</th>
                  </tr>
                </thead>
                <tbody>
                  {buys.map((b, i) => (
                    <tr key={i}>
                      <td>{new Date(b.boughtAt * 1000).toLocaleString()}</td>
                      <td><span style={{ color: b.side === "Up" ? "var(--up-color)" : "var(--down-color)", fontWeight: 500 }}>{b.side}</span></td>
                      <td>{b.type}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{b.price.toFixed(3)}</td>
                      <td>${b.amountUsd.toFixed(2)}</td>
                      <td>{b.shares.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="bentoSection">
          <h2 className="sectionTitle">Redeem History</h2>
          {redeems.length === 0 ? (
            <div className="card card-empty" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8, opacity: 0.4 }}>💸</div>
              <p style={{ color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 }}>No redeems yet</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Resolved positions appear here</p>
            </div>
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {redeems.map((r, i) => (
                    <tr key={i}>
                      <td>{new Date(r.redeemedAt * 1000).toLocaleString()}</td>
                      <td style={{ fontSize: "0.8125rem", wordBreak: "break-all" }}>{r.eventSlug || r.conditionId?.slice(0, 12) + "…"}</td>
                      <td style={{ color: "var(--success)", fontWeight: 500 }}>${r.payoutUsd.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
