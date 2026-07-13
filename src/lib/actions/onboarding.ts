"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile, isApproved } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Marks onboarding complete for the signed-in, approved user. Runs with the
 * service role because regular users have no UPDATE access to profiles —
 * that keeps role/status locked down at the database level.
 */
export async function completeOnboarding(disclaimerAccepted: boolean): Promise<void> {
  const profile = await getProfile();
  if (!profile || !isApproved(profile)) redirect("/login");
  if (!disclaimerAccepted) return;

  if (isSupabaseConfigured) {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        onboarding_completed: true,
        disclaimer_accepted_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
  }

  revalidatePath("/", "layout");
  redirect("/");
}
