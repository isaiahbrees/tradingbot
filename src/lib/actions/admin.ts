"use server";

import { revalidatePath } from "next/cache";
import { getProfile, isAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserStatus } from "@/lib/types";
import type { ActionResult } from "@/lib/actions/accounts";

const PREVIEW_ERROR =
  "This is the local preview — connect a Supabase project to manage users.";

async function requireAdmin(): Promise<ActionResult & { adminId?: string }> {
  const profile = await getProfile();
  if (!profile || !isAdmin(profile)) return { ok: false, error: "Not authorized." };
  if (!isSupabaseConfigured) return { ok: false, error: PREVIEW_ERROR };
  return { ok: true, adminId: profile.id };
}

export async function setUserStatus(
  userId: string,
  status: UserStatus
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (userId === guard.adminId && status !== "approved") {
    return { ok: false, error: "You can't revoke your own access." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ status }).eq("id", userId);
  if (error) return { ok: false, error: "Could not update the user." };

  revalidatePath("/admin/users");
  revalidatePath("/admin/approvals");
  return { ok: true };
}

export async function setUserRole(
  userId: string,
  role: "user" | "admin"
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (userId === guard.adminId && role !== "admin") {
    return { ok: false, error: "You can't remove your own admin role." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: "Could not update the user." };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function saveMasterPrompt(input: {
  title: string;
  instructions: string;
  content: string;
}): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const title = input.title.trim();
  const content = input.content.replace(/\r\n/g, "\n");
  if (!title) return { ok: false, error: "Give the prompt a title." };
  if (!content.trim()) return { ok: false, error: "The prompt content is empty." };

  const admin = createAdminClient();
  const { data: latest } = await admin
    .from("master_prompts")
    .select("version")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("master_prompts").insert({
    version: (latest?.version ?? 0) + 1,
    title,
    instructions: input.instructions.trim(),
    content,
    updated_by: guard.adminId,
  });
  if (error) return { ok: false, error: "Could not publish the new version." };

  revalidatePath("/prompt");
  revalidatePath("/admin/prompt");
  return { ok: true };
}
