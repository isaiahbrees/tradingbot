"use server";

import { revalidatePath } from "next/cache";
import { getProfile, isApproved } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { syncAccount, SYNCABLE_PLATFORMS, type SyncableAccount } from "@/lib/sync/engine";
import type { ActionResult } from "@/lib/actions/accounts";

/** Owner-triggered "Sync now" for a single connected account. */
export async function syncAccountNow(
  accountId: string
): Promise<ActionResult & { trades?: number }> {
  const profile = await getProfile();
  if (!profile || !isApproved(profile)) return { ok: false, error: "Not authorized." };
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Connect a Supabase project to sync accounts." };
  }

  const supabase = await createClient();
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("id, user_id, platform, account_ref, mode")
    .eq("id", accountId)
    .eq("user_id", profile.id)
    .single();
  if (!account) return { ok: false, error: "Account not found." };
  if (!SYNCABLE_PLATFORMS.includes(account.platform)) {
    return {
      ok: false,
      error: "Auto-sync isn't available for this platform yet.",
    };
  }

  const result = await syncAccount(account as SyncableAccount);
  revalidatePath("/", "layout");
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, trades: result.trades };
}
