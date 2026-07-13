import "server-only";

import {
  SyncError,
  type NormalizedFill,
  type ProviderAdapter,
  type ProviderCredentials,
  type ProviderSnapshot,
} from "@/lib/sync/types";

/**
 * Tradier brokerage adapter.
 *
 * Auth is a single access token (entered as the "API key" when connecting;
 * the secret field stays empty). Paper accounts use the sandbox host.
 */

function baseUrl(mode: "paper" | "live"): string {
  return mode === "live" ? "https://api.tradier.com/v1" : "https://sandbox.tradier.com/v1";
}

async function tradierGet(
  creds: ProviderCredentials,
  path: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${baseUrl(creds.mode)}${path}`, {
    headers: {
      Authorization: `Bearer ${creds.apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (res.status === 401) throw new SyncError("Tradier rejected the access token.");
  if (!res.ok) throw new SyncError(`Tradier API error (${res.status}) on ${path}.`);
  return (await res.json()) as Record<string, unknown>;
}

/** Tradier returns a bare object instead of an array when there's one item. */
function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

interface TradierTradeEvent {
  date?: string;
  type?: string;
  trade?: {
    symbol?: string;
    quantity?: number;
    price?: number;
    commission?: number;
    trade_type?: string;
  };
}

async function resolveAccountId(creds: ProviderCredentials): Promise<string> {
  if (creds.accountRef) return creds.accountRef;
  const data = await tradierGet(creds, "/user/profile");
  const profile = data.profile as { account?: unknown } | undefined;
  const accounts = asArray(profile?.account) as { account_number?: string }[];
  const id = accounts[0]?.account_number;
  if (!id) {
    throw new SyncError("No Tradier account found for this token — set the Account ID.");
  }
  return id;
}

export const tradierAdapter: ProviderAdapter = {
  id: "tradier",

  async fetch(creds): Promise<ProviderSnapshot> {
    const accountId = await resolveAccountId(creds);

    // Current equity
    const balancesData = await tradierGet(creds, `/accounts/${accountId}/balances`);
    const balances = balancesData.balances as { total_equity?: number } | undefined;
    const equity = Number(balances?.total_equity ?? 0);

    // Trade history, newest pages until empty (capped)
    const fills: NormalizedFill[] = [];
    for (let page = 1; page <= 25; page++) {
      const data = await tradierGet(
        creds,
        `/accounts/${accountId}/history?type=trade&limit=100&page=${page}`
      );
      const history = data.history as { event?: unknown } | null | undefined;
      const events = asArray(history?.event) as TradierTradeEvent[];
      if (events.length === 0) break;

      for (const [i, event] of events.entries()) {
        const trade = event.trade;
        if (event.type !== "trade" || !trade?.symbol) continue;
        const qty = Number(trade.quantity ?? 0);
        const price = Number(trade.price ?? 0);
        if (!qty || !price) continue;
        fills.push({
          id: `tradier-${accountId}-${page}-${i}-${event.date}-${trade.symbol}`,
          symbol: trade.symbol,
          side: qty > 0 ? "buy" : "sell",
          quantity: Math.abs(qty),
          price,
          fees: Math.abs(Number(trade.commission ?? 0)),
          executed_at: new Date(event.date ?? Date.now()).toISOString(),
        });
      }
      if (events.length < 100) break;
    }

    return { fills, equity };
  },
};
