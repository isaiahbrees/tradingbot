import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
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
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 items-center border-b px-6">
        <Logo />
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Members-only access to the master prompt and your bot&apos;s performance.
            </p>
          </div>

          {params.error === "auth" && (
            <p
              role="alert"
              className="mb-4 rounded-md border border-negative/25 bg-negative/10 px-3 py-2 text-sm text-negative"
            >
              Sign-in failed. Please try again.
            </p>
          )}

          {isSupabaseConfigured ? (
            <GoogleSignInButton next={params.next} />
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                Supabase isn&apos;t configured yet, so authentication is disabled. You can
                explore the app in local preview mode with demo data.
              </div>
              <Button asChild className="w-full">
                <Link href="/overview">Continue in preview mode</Link>
              </Button>
            </div>
          )}

          <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
            New accounts require admin approval before they can access the platform.
            <br />
            Trading involves substantial risk. Nothing here is financial advice.
          </p>
        </div>
      </main>
    </div>
  );
}
