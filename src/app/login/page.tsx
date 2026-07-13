import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-neutral-950 px-4 py-10">
      {/* ── Animated aurora backdrop ─────────────────────────────────── */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute -left-48 top-1/4 size-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(232,64,152,0.42),transparent_62%)] blur-3xl motion-safe:animate-[aurora-1_26s_ease-in-out_infinite]" />
        <div className="absolute -bottom-56 right-[-10%] h-[40rem] w-[46rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,140,50,0.36),transparent_62%)] blur-3xl motion-safe:animate-[aurora-2_32s_ease-in-out_infinite]" />
        <div className="absolute -top-56 right-1/4 size-[32rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.38),transparent_62%)] blur-3xl motion-safe:animate-[aurora-3_38s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/3 left-1/3 size-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.18),transparent_62%)] blur-3xl motion-safe:animate-[aurora-2_44s_ease-in-out_infinite]" />
        {/* Vignette so the card stays the focal point */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,10,10,0.75)_100%)]" />
      </div>

      {/* ── Glass card ───────────────────────────────────────────────── */}
      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 shadow-inner">
              <svg viewBox="0 0 16 16" fill="none" className="size-5 text-white" aria-hidden="true">
                <path
                  d="M1.5 10.5L5 7l2.5 2.5L11 5l3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
              Welcome to Botdeck
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-300">
              The master prompt and your bot&apos;s performance, in one place.
            </p>
          </div>

          {params.error === "auth" && (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-200"
            >
              Sign-in failed. Please try again.
            </p>
          )}

          <div className="mt-8">
            {isSupabaseConfigured ? (
              <GoogleSignInButton
                next={params.next}
                className="h-11 rounded-lg border-0 bg-white text-sm font-medium text-neutral-900 shadow-lg hover:bg-neutral-200"
              />
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-neutral-300">
                  Supabase isn&apos;t configured yet, so authentication is disabled. Explore
                  the app in preview mode with demo data.
                </div>
                <Link
                  href="/overview"
                  className="flex h-11 w-full items-center justify-center rounded-lg bg-white text-sm font-medium text-neutral-900 shadow-lg transition-colors hover:bg-neutral-200"
                >
                  Continue in preview mode
                </Link>
              </div>
            )}
          </div>

          <div className="mt-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
              Invite-only
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-neutral-400">
            New here? Sign in and an admin will review your request — full access once
            you&apos;re approved.
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-neutral-500">
          Trading involves substantial risk of loss. Past results do not guarantee future
          performance. Nothing here is financial advice.
        </p>
      </div>
    </div>
  );
}
