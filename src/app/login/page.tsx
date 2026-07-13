import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

// Minimal geometric architecture — cool monochrome, fits the dashboard's vibe.
const BACKDROP =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1800&auto=format&fit=crop";

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
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      {/* ── Left: sign-in ────────────────────────────────────────────── */}
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <div>
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Mobile-only photo banner — desktop gets the full right panel */}
            <div className="relative mb-8 h-40 w-full overflow-hidden rounded-2xl bg-neutral-950 lg:hidden">
              <Image
                src={BACKDROP}
                alt=""
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 0px"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
              <p className="absolute bottom-3 left-4 right-4 text-sm font-medium text-white">
                One prompt. One bot. Every trade, accounted for.
              </p>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Sign in for the official master prompt and your bot&apos;s performance
              dashboard.
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
                <GoogleSignInButton next={params.next} className="h-11" />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                    Supabase isn&apos;t configured yet, so authentication is disabled.
                    Explore the app in preview mode with demo data.
                  </div>
                  <Link
                    href="/overview"
                    className="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Continue in preview mode
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Invite-only
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              New here? Sign in with Google and an admin will review your request —
              you&apos;ll get full access once approved.
            </p>
          </div>
        </main>

        <footer className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Botdeck</span>
          <span>Trading involves substantial risk. Not financial advice.</span>
        </footer>
      </div>

      {/* ── Right: photo panel ───────────────────────────────────────── */}
      <div className="relative hidden p-3 lg:block">
        <div className="relative h-full w-full overflow-hidden rounded-3xl bg-neutral-950">
          <Image
            src={BACKDROP}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover"
          />
          {/* Legibility gradient + caption */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-lg font-medium leading-snug text-white">
              One prompt. One bot.
              <br />
              Every trade, accounted for.
            </p>
            <p className="mt-2 font-mono text-xs text-white/60">
              daily · weekly · monthly · all-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
