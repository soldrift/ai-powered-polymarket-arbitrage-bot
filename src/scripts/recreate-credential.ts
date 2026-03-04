/**
 * Regenerate Polymarket CLOB API credentials.
 * Run when you get "401 Unauthorized/Invalid api key".
 *
 * Usage: npm run credential:recreate
 *
 * Requires: PRIVATE_KEY and PROXY_WALLET_ADDRESS in .env
 * PROXY_WALLET_ADDRESS must match your Polymarket profile (polymarket.com/settings)
 *
 * Strategy: deriveApiKey first (retrieve existing); createApiKey only if no key exists.
 * Polymarket rejects createApiKey with 400 when a key already exists for nonce 0.
 */

import { ApiKeyCreds, ClobClient, Chain } from "@polymarket/clob-client";
import { writeFileSync, existsSync, unlinkSync, mkdirSync } from "fs";
import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";
import { Wallet } from "@ethersproject/wallet";

dotenvConfig({ path: resolve(process.cwd(), ".env") });

const CREDENTIAL_PATH = resolve(process.cwd(), "src/data/credential.json");

function toApiKeyCreds(raw: unknown): ApiKeyCreds | null {
  const o = raw as { key?: string; apiKey?: string; secret?: string; passphrase?: string };
  const key = o.key ?? o.apiKey;
  if (!key || !o.secret || !o.passphrase) return null;
  return { key, secret: o.secret, passphrase: o.passphrase };
}

async function main(): Promise<void> {
  const privateKey = process.env.PRIVATE_KEY;
  const proxyWallet = process.env.PROXY_WALLET_ADDRESS;

  if (!privateKey) {
    console.error("Error: PRIVATE_KEY not set in .env");
    process.exit(1);
  }
  if (!proxyWallet) {
    console.error("Error: PROXY_WALLET_ADDRESS not set in .env");
    console.error("  Use the address from polymarket.com/settings (your Polymarket profile)");
    process.exit(1);
  }

  if (existsSync(CREDENTIAL_PATH)) {
    unlinkSync(CREDENTIAL_PATH);
    console.log("Removed old credential.json");
  }

  try {
    const wallet = new Wallet(privateKey);
    const chainId = (parseInt(process.env.CHAIN_ID || "137", 10) || 137) as Chain;
    const host = process.env.CLOB_API_URL || "https://clob.polymarket.com";

    // signatureType 2 = GNOSIS_SAFE, funder = proxy wallet address
    const clobClient = new ClobClient(host, chainId, wallet, undefined, 2, proxyWallet);

    let credential: ApiKeyCreds | null = null;

    // 1. Try derive first (succeeds when key already exists; createApiKey returns 400 in that case)
    try {
      const derived = await clobClient.deriveApiKey();
      credential = toApiKeyCreds(derived);
      if (credential) console.log("Derived existing API key");
    } catch {
      // derive failed, try create
    }

    // 2. If derive failed or returned empty, try create
    if (!credential) {
      try {
        const created = await clobClient.createApiKey();
        credential = toApiKeyCreds(created);
        if (credential) console.log("Created new API key");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Derive and create both failed:", msg);
        throw err;
      }
    }

    if (!credential?.key || !credential.secret || !credential.passphrase) {
      console.error("Invalid credential response - missing key, secret, or passphrase");
      process.exit(1);
    }

    const dir = resolve(process.cwd(), "src/data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(CREDENTIAL_PATH, JSON.stringify(credential, null, 2));

    console.log("Saved CLOB API credentials for", wallet.address);
    console.log("Saved to src/data/credential.json");
    console.log("");
    console.log("Restart the bot. If you still get 401:");
    console.log("  1. Ensure PROXY_WALLET_ADDRESS matches polymarket.com/settings");
    console.log("  2. Ensure PRIVATE_KEY is the key that controls that proxy");
    console.log("  3. You must have logged into Polymarket at least once to deploy the proxy");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Failed:", msg);
    if (msg.includes("Invalid Funder") || msg.includes("funder")) {
      console.error("");
      console.error("Fix: Set PROXY_WALLET_ADDRESS to your Polymarket profile address.");
      console.error("  Find it at: polymarket.com/settings");
    }
    process.exit(1);
  }
}

main();
