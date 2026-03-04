import { ApiKeyCreds, ClobClient, Chain } from "@polymarket/clob-client";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { Wallet } from "@ethersproject/wallet";
import { tradingEnv, maskAddress } from "../config/env";
import { logger } from "../logger";
import { CREDENTIAL_PATH } from "../config/paths";

function loadFromFile(): ApiKeyCreds | null {
  if (!existsSync(CREDENTIAL_PATH)) return null;
  try {
    const cred = JSON.parse(readFileSync(CREDENTIAL_PATH, "utf-8")) as ApiKeyCreds;
    return cred?.key ? cred : null;
  } catch {
    return null;
  }
}

function toApiKeyCreds(raw: unknown): ApiKeyCreds | null {
  const o = raw as { key?: string; apiKey?: string; secret?: string; passphrase?: string };
  const key = o.key ?? o.apiKey;
  if (!key || !o.secret || !o.passphrase) return null;
  return { key, secret: o.secret, passphrase: o.passphrase };
}

export async function createCredential(): Promise<ApiKeyCreds | null> {
  const privateKey = tradingEnv.PRIVATE_KEY;
  if (!privateKey) {
    logger.skip("Credential: PRIVATE_KEY not set");
    return null;
  }

  const existing = loadFromFile();
  if (existing) {
    logger.info("Using credential from credential.json");
    return existing;
  }

  try {
    const wallet = new Wallet(privateKey);
    const chainId = tradingEnv.CHAIN_ID as Chain;
    const host = tradingEnv.CLOB_API_URL;
    const funder = tradingEnv.PROXY_WALLET_ADDRESS;
    const clobClient = new ClobClient(host, chainId, wallet, undefined, 2, funder || undefined);

    let credential: ApiKeyCreds | null = null;
    try {
      const derived = await clobClient.deriveApiKey();
      credential = toApiKeyCreds(derived);
    } catch {
      /* derive failed */
    }
    if (!credential) {
      const created = await clobClient.createApiKey();
      credential = toApiKeyCreds(created);
    }
    if (!credential?.key || !credential.secret || !credential.passphrase) {
      logger.error("Credential: invalid response from Polymarket");
      return null;
    }

    const dir = resolve(process.cwd(), "src/data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(CREDENTIAL_PATH, JSON.stringify(credential, null, 2));

    logger.ok(`Credential saved for ${maskAddress(wallet.address)}`);
    return credential;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Credential: ${msg}`);
    return null;
  }
}
