import { redirect } from "next/navigation";
import { getProfile, isApproved } from "@/lib/auth";

export default async function Home() {
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (!isApproved(profile)) redirect("/pending");
  if (!profile.onboarding_completed) redirect("/onboarding");
  redirect("/overview");
}
