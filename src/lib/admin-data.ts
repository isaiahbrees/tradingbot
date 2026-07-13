import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Profile } from "@/lib/types";

/** Sample members so the admin screens are explorable in local preview. */
const PREVIEW_PROFILES: Profile[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    email: "demo@example.com",
    full_name: "Demo Trader",
    avatar_url: null,
    role: "admin",
    status: "approved",
    onboarding_completed: true,
    disclaimer_accepted_at: "2026-01-10T12:00:00.000Z",
    created_at: "2026-01-05T09:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    email: "ava.chen@example.com",
    full_name: "Ava Chen",
    avatar_url: null,
    role: "user",
    status: "approved",
    onboarding_completed: true,
    disclaimer_accepted_at: "2026-02-02T15:30:00.000Z",
    created_at: "2026-02-01T18:20:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    email: "marcus.reid@example.com",
    full_name: "Marcus Reid",
    avatar_url: null,
    role: "user",
    status: "pending",
    onboarding_completed: false,
    disclaimer_accepted_at: null,
    created_at: "2026-07-11T08:45:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    email: "sofia.marino@example.com",
    full_name: "Sofia Marino",
    avatar_url: null,
    role: "user",
    status: "pending",
    onboarding_completed: false,
    disclaimer_accepted_at: null,
    created_at: "2026-07-12T21:10:00.000Z",
  },
];

/**
 * All member profiles, newest first. Reads through the caller's session —
 * the RLS policy only lets approved admins see other profiles.
 */
export async function getAllProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return PREVIEW_PROFILES;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, role, status, onboarding_completed, disclaimer_accepted_at, created_at"
    )
    .order("created_at", { ascending: false });
  return (data as Profile[]) ?? [];
}
