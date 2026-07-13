import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Profile } from "@/lib/types";

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

/** Stand-in identity for local preview mode (no Supabase configured). */
const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  email: "demo@example.com",
  full_name: "Demo Trader",
  avatar_url: null,
  role: "admin",
  status: "approved",
  onboarding_completed: true,
  disclaimer_accepted_at: new Date(0).toISOString(),
  created_at: new Date(0).toISOString(),
};

/**
 * The signed-in user's profile, or null when signed out. Cached per request.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  if (!isSupabaseConfigured) return DEMO_PROFILE;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, role, status, onboarding_completed, disclaimer_accepted_at, created_at"
    )
    .eq("id", user.id)
    .single();

  if (!data) {
    // Profile row is created by a DB trigger; fall back to auth metadata if
    // the read raced the trigger.
    return {
      id: user.id,
      email: user.email ?? "",
      full_name: (user.user_metadata?.full_name as string) ?? null,
      avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
      role: "user",
      status: "pending",
      onboarding_completed: false,
      disclaimer_accepted_at: null,
      created_at: user.created_at,
    };
  }
  return data as Profile;
});

export function isApproved(profile: Profile | null): boolean {
  return profile?.status === "approved";
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin" && profile.status === "approved";
}
