import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";
import { pairFills } from "@/lib/sync/fifo";
import { tradierAdapter } from "@/lib/sync/tradier";
import { alpacaAdapter } from "@/lib/sync/alpaca";
import { SyncError, type ProviderAdapter } from "@/lib/sync/types";
import type { AccountMode } from "@/lib/types";

/** Register new platform adapters here — nothing else needs to change. */
const ADAPTERS: Record<string, ProviderAdapter> = {
  tradier: tradierAdapter,
  alpaca: alpacaAdapter,
};

export const SYNCABLE_PLATFORMS = Object.keys(ADAPTERS);

export interface SyncableAccount {
  id: string;
  user_id: string;
  platform: string;
  account_ref: string | null;
  mode: AccountMode;
}

export interface SyncResult {
  ok: boolean;
  accountId: string;
  trades?: number;
  error?: string;
}

/**
 * Full sync for one account: pull fills + equity from the platform, pair
 * fills into round-trip trades, rebuild daily performance, and replace the
 * account's rows atomically enough for a dashboard (delete + insert).
 */
export async function syncAccount(account: SyncableAccount): Promise<SyncResult> {
  const admin = createAdminClient();

  const adapter = ADAPTERS[account.platform];
  if (!adapter) {
    return {
      ok: false,
      accountId: account.id,
      error: `Auto-sync isn't available for ${account.platform} yet.`,
    };
  }

  try {
    const { data: creds } = await admin
      .from("account_credentials")
      .select("api_key_encrypted, api_secret_encrypted")
      .eq("account_id", account.id)
      .single();
    if (!creds) throw new SyncError("No stored credentials for this account.");

    const snapshot = await adapter.fetch({
      apiKey: decryptSecret(creds.api_key_encrypted),
      apiSecret: creds.api_secret_encrypted ? decryptSecret(creds.api_secret_encrypted) : "",
      accountRef: account.account_ref,
      mode: account.mode,
    });

    const trips = pairFills(snapshot.fills);

    // ── Daily aggregates from closed trades ─────────────────────────────
    const byDay = new Map<
      string,
      { pnl: number; trades: number; wins: number; losses: number; fees: number }
    >();
    for (const t of trips) {
      if (t.status !== "closed" || t.pnl === null || !t.closed_at) continue;
      const day = t.closed_at.slice(0, 10);
      const row = byDay.get(day) ?? { pnl: 0, trades: 0, wins: 0, losses: 0, fees: 0 };
      row.pnl += t.pnl;
      row.trades += 1;
      if (t.pnl >= 0) row.wins += 1;
      else row.losses += 1;
      row.fees += t.fees;
      byDay.set(day, row);
    }

    // Walk balances backward from current equity so the growth chart is
    // anchored to the real account value.
    const days = [...byDay.keys()].sort();
    const dailyRows: {
      user_id: string;
      account_id: string;
      date: string;
      pnl: number;
      return_pct: number;
      trades: number;
      wins: number;
      losses: number;
      balance: number;
      fees: number;
    }[] = [];
    let balance = snapshot.equity;
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      const agg = byDay.get(day)!;
      const startOfDay = balance - agg.pnl;
      dailyRows.unshift({
        user_id: account.user_id,
        account_id: account.id,
        date: day,
        pnl: Number(agg.pnl.toFixed(2)),
        return_pct:
          startOfDay > 0 ? Number(((agg.pnl / startOfDay) * 100).toFixed(3)) : 0,
        trades: agg.trades,
        wins: agg.wins,
        losses: agg.losses,
        balance: Number(balance.toFixed(2)),
        fees: Number(agg.fees.toFixed(2)),
      });
      balance = startOfDay;
    }

    const tradeRows = trips.map((t) => ({
      user_id: account.user_id,
      account_id: account.id,
      symbol: t.symbol,
      side: t.side,
      quantity: t.quantity,
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      pnl: t.pnl,
      return_pct: t.return_pct,
      fees: t.fees,
      status: t.status,
      opened_at: t.opened_at,
      closed_at: t.closed_at,
    }));

    // ── Replace rows (full rebuild keeps FIFO pairing idempotent) ───────
    await admin.from("trades").delete().eq("account_id", account.id);
    await admin.from("daily_performance").delete().eq("account_id", account.id);
    for (let i = 0; i < tradeRows.length; i += 500) {
      const { error } = await admin.from("trades").insert(tradeRows.slice(i, i + 500));
      if (error) throw new SyncError(`Could not store trades: ${error.message}`);
    }
    if (dailyRows.length) {
      const { error } = await admin.from("daily_performance").insert(dailyRows);
      if (error) throw new SyncError(`Could not store daily performance: ${error.message}`);
    }

    await admin
      .from("connected_accounts")
      .update({ status: "connected", last_synced_at: new Date().toISOString() })
      .eq("id", account.id);

    return { ok: true, accountId: account.id, trades: tradeRows.length };
  } catch (err) {
    const message =
      err instanceof SyncError ? err.message : "Sync failed — check the credentials.";
    await admin.from("connected_accounts").update({ status: "error" }).eq("id", account.id);
    return { ok: false, accountId: account.id, error: message };
  }
}

/** Sync every connected account that has an adapter. Used by the cron job. */
export async function syncAllAccounts(): Promise<SyncResult[]> {
  const admin = createAdminClient();
  const { data: accounts } = await admin
    .from("connected_accounts")
    .select("id, user_id, platform, account_ref, mode")
    .in("platform", SYNCABLE_PLATFORMS);

  const results: SyncResult[] = [];
  for (const account of (accounts ?? []) as SyncableAccount[]) {
    results.push(await syncAccount(account));
  }
  return results;
}
