"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getProfile, isApproved } from "@/lib/auth";
import { SELECTED_ACCOUNT_COOKIE } from "@/lib/data";
import { encryptSecret, lastFour } from "@/lib/crypto";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLATFORMS, type AccountMode } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const PREVIEW_ERROR =
  "This is the local preview — connect a Supabase project to save accounts.";

export async function setSelectedAccount(accountId: string): Promise<void> {
  const store = await cookies();
  store.set(SELECTED_ACCOUNT_COOKIE, accountId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export interface ConnectAccountInput {
  platform: string;
  label: string;
  accountRef: string;
  apiKey: string;
  apiSecret: string;
  mode: AccountMode;
}

export async function connectAccount(input: ConnectAccountInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !isApproved(profile)) return { ok: false, error: "Not authorized." };
  if (!isSupabaseConfigured) return { ok: false, error: PREVIEW_ERROR };

  const platform = PLATFORMS.find((p) => p.id === input.platform);
  if (!platform) return { ok: false, error: "Unsupported platform." };
  const label = input.label.trim() || platform.name;
  const apiKey = input.apiKey.trim();
  const apiSecret = input.apiSecret.trim();
  if (apiKey.length < 4) return { ok: false, error: "API key looks too short." };
  if (apiSecret.length < 4) return { ok: false, error: "API secret looks too short." };
  if (input.mode !== "paper" && input.mode !== "live") {
    return { ok: false, error: "Invalid account mode." };
  }

  let encryptedKey: string;
  let encryptedSecret: string;
  try {
    encryptedKey = encryptSecret(apiKey);
    encryptedSecret = encryptSecret(apiSecret);
  } catch {
    return { ok: false, error: "Server encryption key is not configured." };
  }

  const supabase = await createClient();
  const { data: account, error: insertError } = await supabase
    .from("connected_accounts")
    .insert({
      user_id: profile.id,
      platform: platform.id,
      label,
      account_ref: input.accountRef.trim() || null,
      mode: input.mode,
      status: "connected",
      api_key_last4: lastFour(apiKey),
      last_synced_at: null,
    })
    .select("id")
    .single();

  if (insertError || !account) {
    return { ok: false, error: "Could not save the account. Please try again." };
  }

  // Credentials live in a service-role-only table (no RLS policies at all).
  const admin = createAdminClient();
  const { error: credError } = await admin.from("account_credentials").insert({
    account_id: account.id,
    api_key_encrypted: encryptedKey,
    api_secret_encrypted: encryptedSecret,
  });

  if (credError) {
    await supabase.from("connected_accounts").delete().eq("id", account.id);
    return { ok: false, error: "Could not store credentials. Please try again." };
  }

  await setSelectedAccount(account.id);
  revalidatePath("/accounts");
  return { ok: true };
}

export async function reconnectAccount(
  accountId: string,
  apiKey: string,
  apiSecret: string
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !isApproved(profile)) return { ok: false, error: "Not authorized." };
  if (!isSupabaseConfigured) return { ok: false, error: PREVIEW_ERROR };

  const key = apiKey.trim();
  const secret = apiSecret.trim();
  if (key.length < 4 || secret.length < 4) {
    return { ok: false, error: "Enter the new API key and secret." };
  }

  const supabase = await createClient();
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", profile.id)
    .single();
  if (!account) return { ok: false, error: "Account not found." };

  let encryptedKey: string;
  let encryptedSecret: string;
  try {
    encryptedKey = encryptSecret(key);
    encryptedSecret = encryptSecret(secret);
  } catch {
    return { ok: false, error: "Server encryption key is not configured." };
  }

  const admin = createAdminClient();
  const { error: credError } = await admin
    .from("account_credentials")
    .upsert({
      account_id: accountId,
      api_key_encrypted: encryptedKey,
      api_secret_encrypted: encryptedSecret,
      rotated_at: new Date().toISOString(),
    });
  if (credError) return { ok: false, error: "Could not update credentials." };

  await supabase
    .from("connected_accounts")
    .update({ status: "connected", api_key_last4: lastFour(key) })
    .eq("id", accountId)
    .eq("user_id", profile.id);

  revalidatePath("/accounts");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAccount(accountId: string): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !isApproved(profile)) return { ok: false, error: "Not authorized." };
  if (!isSupabaseConfigured) return { ok: false, error: PREVIEW_ERROR };

  const supabase = await createClient();
  const { error } = await supabase
    .from("connected_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", profile.id);
  if (error) return { ok: false, error: "Could not remove the account." };

  const store = await cookies();
  if (store.get(SELECTED_ACCOUNT_COOKIE)?.value === accountId) {
    store.delete(SELECTED_ACCOUNT_COOKIE);
  }
  revalidatePath("/accounts");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function switchAccountMode(
  accountId: string,
  mode: AccountMode
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !isApproved(profile)) return { ok: false, error: "Not authorized." };
  if (!isSupabaseConfigured) return { ok: false, error: PREVIEW_ERROR };
  if (mode !== "paper" && mode !== "live") return { ok: false, error: "Invalid mode." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("connected_accounts")
    .update({ mode })
    .eq("id", accountId)
    .eq("user_id", profile.id);
  if (error) return { ok: false, error: "Could not switch the account mode." };

  revalidatePath("/accounts");
  revalidatePath("/", "layout");
  return { ok: true };
}
