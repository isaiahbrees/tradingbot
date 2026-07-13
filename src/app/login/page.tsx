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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black px-4 py-10">
      {/* ── Aurora ribbons on black ──────────────────────────────────── */}
      <div aria-hidden="true" className="absolute inset-0">
        {/* Main iridescent ribbon — thin concentric spectral arcs */}
        <div className="absolute left-[-35%] top-[-6%] h-[110vh] w-[170%] -rotate-6 blur-[12px] saturate-150 bg-[radial-gradient(120%_95%_at_50%_128%,transparent_55.5%,rgba(59,130,246,0.75)_57%,rgba(34,211,238,0.8)_58.5%,rgba(52,211,153,0.7)_60%,rgba(190,242,100,0.55)_61.5%,rgba(250,204,21,0.55)_63%,rgba(249,115,22,0.7)_64.5%,rgba(236,72,153,0.6)_66%,rgba(147,51,234,0.4)_68%,transparent_71%)] motion-safe:animate-[ribbon-1_20s_ease-in-out_infinite]" />
        {/* Secondary fainter ribbon, opposite tilt */}
        <div className="absolute bottom-[-30%] right-[-45%] h-[100vh] w-[160%] rotate-3 opacity-70 blur-[18px] saturate-150 bg-[radial-gradient(115%_90%_at_50%_135%,transparent_58%,rgba(96,165,250,0.5)_60%,rgba(45,212,191,0.55)_62%,rgba(251,146,60,0.6)_64.5%,rgba(244,63,94,0.65)_66.5%,transparent_70%)] motion-safe:animate-[ribbon-2_26s_ease-in-out_infinite]" />
        {/* Red-pink glow low right, like light catching haze */}
        <div className="absolute bottom-[-18%] right-[-8%] size-[38rem] rounded-full blur-[70px] bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.4),transparent_65%)] motion-safe:animate-[aurora-2_17s_ease-in-out_infinite]" />
        {/* Faint indigo wash top-right */}
        <div className="absolute -top-40 right-[6%] size-[30rem] rounded-full blur-[80px] bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.25),transparent_65%)]" />
      </div>

      {/* ── Glass card ───────────────────────────────────────────────── */}
      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
        {/* Warm glow bleeding up from behind the glass */}
        <div
          aria-hidden="true"
          className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-t from-rose-500/25 via-transparent to-transparent blur-2xl"
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
