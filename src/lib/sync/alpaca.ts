import "server-only";

import {
  SyncError,
  type NormalizedFill,
  type ProviderAdapter,
  type ProviderCredentials,
  type ProviderSnapshot,
} from "@/lib/sync/types";

/** Alpaca brokerage adapter (paper + live). */

function baseUrl(mode: "paper" | "live"): string {
  return mode === "live" ? "https://api.alpaca.markets" : "https://paper-api.alpaca.markets";
}

async function alpacaGet(creds: ProviderCredentials, path: string): Promise<unknown> {
  if (!creds.apiSecret) throw new SyncError("Alpaca needs both the API key and secret.");
  const res = await fetch(`${baseUrl(creds.mode)}${path}`, {
    headers: {
      "APCA-API-KEY-ID": creds.apiKey,
      "APCA-API-SECRET-KEY": creds.apiSecret,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) {
    throw new SyncError("Alpaca rejected the API key/secret.");
  }
  if (!res.ok) throw new SyncError(`Alpaca API error (${res.status}) on ${path}.`);
  return res.json();
}

interface AlpacaActivity {
  id?: string;
  activity_type?: string;
  transaction_time?: string;
  symbol?: string;
  side?: string; // buy | sell | sell_short
  qty?: string;
  price?: string;
}

export const alpacaAdapter: ProviderAdapter = {
  id: "alpaca",

  async fetch(creds): Promise<ProviderSnapshot> {
    const account = (await alpacaGet(creds, "/v2/account")) as { equity?: string };
    const equity = Number(account.equity ?? 0);

    const fills: NormalizedFill[] = [];
    let pageToken: string | null = null;
    for (let page = 0; page < 25; page++) {
      const params = new URLSearchParams({
        activity_types: "FILL",
        page_size: "100",
        direction: "desc",
      });
      if (pageToken) params.set("page_token", pageToken);
      const activities = (await alpacaGet(
        creds,
        `/v2/account/activities?${params.toString()}`
      )) as AlpacaActivity[];
      if (!Array.isArray(activities) || activities.length === 0) break;

      for (const a of activities) {
        if (a.activity_type !== "FILL" || !a.symbol || !a.id) continue;
        const qty = Number(a.qty ?? 0);
        const price = Number(a.price ?? 0);
        if (!qty || !price) continue;
        fills.push({
          id: `alpaca-${a.id}`,
          symbol: a.symbol,
          side: a.side === "buy" ? "buy" : "sell",
          quantity: Math.abs(qty),
          price,
          fees: 0, // commission-free; regulatory fees not itemized per fill
          executed_at: new Date(a.transaction_time ?? Date.now()).toISOString(),
        });
      }
      pageToken = activities[activities.length - 1]?.id ?? null;
      if (activities.length < 100) break;
    }

    return { fills, equity };
  },
};
