import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getProfile, isApproved } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Awaiting approval" };

export default async function PendingPage() {
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (isApproved(profile)) redirect("/");

  const removed = profile.status === "removed";

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 items-center border-b px-6">
        <Logo />
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex size-11 items-center justify-center rounded-full border bg-muted/40">
            <Clock className="size-5 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            {removed ? "Access revoked" : "Your account is waiting for approval"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {removed ? (
              <>Your access to this community has been removed. If you believe this is a
              mistake, contact the community admin.</>
            ) : (
              <>
                Thanks for signing in, {profile.full_name?.split(" ")[0] ?? profile.email}.
                An admin needs to approve your account before you can access the master
                prompt and dashboard. You&apos;ll be able to sign in normally once
                you&apos;re approved.
              </>
            )}
          </p>

          <div className="mt-8 flex flex-col gap-2">
            <form action={signOut}>
              <Button type="submit" variant="outline" className="w-full">
                Sign out
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Signed in as <span className="font-mono">{profile.email}</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
