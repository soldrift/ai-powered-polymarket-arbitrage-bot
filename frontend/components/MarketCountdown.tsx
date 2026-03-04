"use client";

import { useState, useEffect } from "react";

interface MarketCountdownProps {
  marketStartTime: number | null;
  marketEndTime: number | null;
}

export function MarketCountdown({ marketStartTime, marketEndTime }: MarketCountdownProps) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  if (!marketStartTime || !marketEndTime || marketEndTime <= now) {
    return null;
  }

  const total = marketEndTime - marketStartTime;
  const elapsed = now - marketStartTime;
  const remaining = marketEndTime - now;
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="countdown-wrap">
      <div className="countdown-bar-wrap">
        <div
          className="countdown-bar"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="countdown-text">{fmt(remaining)} left</span>
    </div>
  );
}
