"use client";

import { BotManagement } from "@/components/BotManagement";

export default function SettingsPage() {
  return (
    <>
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <h1 className="sectionTitle">Settings</h1>
        <p style={{ color: "var(--text-muted)", marginTop: -4, fontSize: "0.9375rem" }}>
          Enable/disable the bot and configure impulse detection parameters. Config is stored in Redis
          and applied by the backend on the next poll.
        </p>
      </div>
      <BotManagement />
    </>
  );
}
