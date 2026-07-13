import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { demoAccount, getDemoSeries, type DemoSeries } from "@/lib/demo-data";
import { DEFAULT_MASTER_PROMPT } from "@/lib/master-prompt";
import type {
  BotStatus,
  ConnectedAccount,
  DailyPerformance,
  MasterPrompt,
  Trade,
} from "@/lib/types";

export const SELECTED_ACCOUNT_COOKIE = "tb_selected_account";

/**
 * All accounts visible in the account switcher. The built-in demo account is
 * always last, so there is data to explore before any platform is connected.
 */
export async function getAccounts(userId: string): Promise<ConnectedAccount[]> {
  const accounts: ConnectedAccount[] = [];

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("connected_accounts")
      .select(
        "id, user_id, platform, label, account_ref, mode, status, api_key_last4, last_synced_at, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (data) accounts.push(...(data as ConnectedAccount[]));
  }

  accounts.push(demoAccount(userId));
  return accounts;
}

export async function getSelectedAccount(
  accounts: ConnectedAccount[]
): Promise<ConnectedAccount> {
  const store = await cookies();
  const selectedId = store.get(SELECTED_ACCOUNT_COOKIE)?.value;
  return accounts.find((a) => a.id === selectedId) ?? accounts[0];
}

export interface AccountData extends DemoSeries {
  /** True while the numbers come from generated demo data, not a live sync. */
  isDemo: boolean;
  botStatus: BotStatus;
}

/**
 * Trading data for one account. If the account has synced rows in the
 * database (written by the sync engine), those are served and the Demo
 * badge disappears; otherwise deterministic demo data fills the screens.
 */
export async function getAccountData(account: ConnectedAccount): Promise<AccountData> {
  if (isSupabaseConfigured && !account.is_demo) {
    const supabase = await createClient();
    const { data: daily } = await supabase
      .from("daily_performance")
      .select("date, pnl, return_pct, trades, wins, losses, balance, fees")
      .eq("account_id", account.id)
      .order("date", { ascending: true });

    if (daily && daily.length > 0) {
      const { data: trades } = await supabase
        .from("trades")
        .select(
          "id, account_id, symbol, side, quantity, entry_price, exit_price, pnl, return_pct, fees, status, opened_at, closed_at"
        )
        .eq("account_id", account.id)
        .order("opened_at", { ascending: false })
        .limit(2000);

      const first = daily[0] as DailyPerformance;
      return {
        daily: daily as DailyPerformance[],
        trades: (trades ?? []) as Trade[],
        startingBalance: Number((first.balance - first.pnl).toFixed(2)),
        isDemo: false,
        botStatus:
          account.status === "connected"
            ? "running"
            : account.status === "error"
              ? "error"
              : "paused",
      };
    }
  }

  const series = getDemoSeries(account.id, account.mode);
  return {
    ...series,
    isDemo: true,
    botStatus: account.status === "connected" ? "running" : "paused",
  };
}

/** Latest master prompt; seeded content until the DB row exists. */
export async function getMasterPrompt(): Promise<MasterPrompt> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("master_prompts")
      .select("id, version, title, instructions, content, updated_by, created_at")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data as MasterPrompt;
  }
  return DEFAULT_MASTER_PROMPT;
}
