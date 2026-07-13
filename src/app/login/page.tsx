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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#060606] px-4 py-10">
      {/* ── Animated prism backdrop ──────────────────────────────────── */}
      <div aria-hidden="true" className="absolute inset-0">
        {/* Horizon beam — the bright band of color behind the card */}
        <div className="absolute left-[-25%] top-1/2 h-[30rem] w-[150%] -translate-y-1/2 blur-[90px] bg-[linear-gradient(90deg,transparent,rgba(59,130,246,0.45)_12%,rgba(168,85,247,0.55)_35%,rgba(236,72,153,0.7)_58%,rgba(251,146,60,0.75)_80%,rgba(250,204,21,0.45)_92%,transparent)] motion-safe:animate-[beam-drift_16s_ease-in-out_infinite]" />
        {/* Corner glows */}
        <div className="absolute -bottom-48 -left-48 size-[44rem] rounded-full blur-[80px] bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.6),transparent_65%)] motion-safe:animate-[aurora-1_13s_ease-in-out_infinite]" />
        <div className="absolute -bottom-56 right-[-15%] size-[46rem] rounded-full blur-[80px] bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.65),transparent_65%)] motion-safe:animate-[aurora-2_17s_ease-in-out_infinite]" />
        <div className="absolute -top-44 right-[8%] size-[38rem] rounded-full blur-[80px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.55),transparent_65%)] motion-safe:animate-[aurora-3_21s_ease-in-out_infinite]" />
        {/* Fade top & bottom so the middle band glows like a horizon */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/75" />
      </div>

      {/* ── Glass card ───────────────────────────────────────────────── */}
      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
        {/* Color halo bleeding out from behind the glass */}
        <div
          aria-hidden="true"
          className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-fuchsia-500/30 via-transparent to-orange-400/30 blur-2xl"
        />
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-neutral-900/50 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl backdrop-saturate-150">
          {/* Top sheen — the "glass" highlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.12] to-transparent"
          />
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
