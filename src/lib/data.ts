import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { demoAccount, getDemoSeries, type DemoSeries } from "@/lib/demo-data";
import { DEFAULT_MASTER_PROMPT } from "@/lib/master-prompt";
import type { BotStatus, ConnectedAccount, MasterPrompt } from "@/lib/types";

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
 * Trading data for one account. Real platform syncs land here later — until
 * an account has synced trades, it is backed by deterministic demo data and
 * flagged so the UI can show the Demo Mode badge.
 */
export function getAccountData(account: ConnectedAccount): AccountData {
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
