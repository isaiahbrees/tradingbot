import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getProfile, isApproved } from "@/lib/auth";

export const metadata: Metadata = { title: "Get started" };

export default async function OnboardingPage() {
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (!isApproved(profile)) redirect("/pending");
  if (profile.onboarding_completed) redirect("/overview");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 items-center border-b px-6">
        <Logo />
      </header>
      <main className="flex flex-1 justify-center px-4 py-10 sm:py-16">
        <OnboardingFlow firstName={profile.full_name?.split(" ")[0] ?? null} />
      </main>
    </div>
  );
}
