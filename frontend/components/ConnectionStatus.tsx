"use client";

import { useState, useEffect } from "react";

interface Health {
  redis: string;
  mongodb: string;
  ok: boolean;
}

export function ConnectionStatus() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setHealth(data);
      } catch {
        setHealth({ redis: "error", mongodb: "error", ok: false });
      }
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 10000);
    return () => clearInterval(id);
  }, []);

  const StatusDot = ({ ok, label }: { ok: boolean; label: string }) => (
    <span
      className="connection-dot"
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: "0.75rem",
        color: "var(--text-secondary)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: ok ? "var(--success)" : "var(--error)",
          boxShadow: ok ? "0 0 6px var(--success)" : "none",
        }}
      />
      {label}
    </span>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {health && (
        <>
          <StatusDot ok={health.redis === "ok"} label="Redis" />
          <StatusDot ok={health.mongodb === "ok"} label="Mongo" />
        </>
      )}
    </div>
  );
}
