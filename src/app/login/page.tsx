import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LoginBackdrop } from "@/components/auth/login-backdrop";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

const BACKDROP =
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1920&auto=format&fit=crop";

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
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* ── Visual panel (desktop) ─────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-neutral-950 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Image
          src={BACKDROP}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 0px"
          className="object-cover opacity-40"
        />
        {/* Legibility wash over the photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/55 to-neutral-950/20" />

        <div className="relative z-10 flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-white text-neutral-950">
            <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden="true">
              <path
                d="M1.5 10.5L5 7l2.5 2.5L11 5l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">Botdeck</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            One prompt.
            <br />
            One bot.
            <br />
            Every trade, accounted for.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-300">
            The official master prompt and your bot&apos;s complete performance record —
            daily, weekly, monthly, and every fill in between.
          </p>

          <LoginBackdrop />

          <div className="mt-6 flex flex-wrap gap-2">
            {["Official master prompt", "Live performance", "Every trade logged"].map(
              (chip) => (
                <span
                  key={chip}
                  className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-200"
                >
                  {chip}
                </span>
              )
            )}
          </div>
        </div>

        <p className="relative z-10 text-xs text-neutral-500">
          Private community · access by admin approval
        </p>
      </div>

      {/* ── Sign-in panel ──────────────────────────────────────────────── */}
      <div className="relative flex flex-col">
        <header className="flex h-14 items-center px-6 lg:justify-end">
          <Logo className="lg:hidden" />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Members-only access to the master prompt and your bot&apos;s performance.
            </p>

            {params.error === "auth" && (
              <p
                role="alert"
                className="mt-6 rounded-md border border-negative/25 bg-negative/10 px-3 py-2 text-sm text-negative"
              >
                Sign-in failed. Please try again.
              </p>
            )}

            <div className="mt-8">
              {isSupabaseConfigured ? (
                <>
                  <GoogleSignInButton next={params.next} />
                  <div className="mt-6 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Invite-only
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                    First time here? Sign in with Google and an admin will review your
                    request — you&apos;ll get full access once approved.
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                    Supabase isn&apos;t configured yet, so authentication is disabled. You
                    can explore the app in preview mode with demo data.
                  </div>
                  <Button asChild className="h-10 w-full">
                    <Link href="/overview">Continue in preview mode</Link>
                  </Button>
                </div>
              )}
            </div>

            <p className="mt-12 text-center text-xs leading-relaxed text-muted-foreground">
              Trading involves substantial risk of loss. Past results do not guarantee
              future performance. Nothing here is financial advice.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
