import { NextResponse } from "next/server";
import { syncAllAccounts } from "@/lib/sync/engine";
import { isSupabaseConfigured } from "@/lib/env";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Scheduled sync — invoked by Vercel Cron (vercel.json). Vercel sends
 * `Authorization: Bearer ${CRON_SECRET}` automatically when the env var is
 * set; requests without it are rejected.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const results = await syncAllAccounts();
  return NextResponse.json({
    synced: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
