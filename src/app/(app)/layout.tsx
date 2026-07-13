import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/shell/sidebar";
import { TopNav } from "@/components/shell/top-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getProfile, isAdmin, isApproved } from "@/lib/auth";
import { getAccountData, getAccounts, getSelectedAccount } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (!isApproved(profile)) redirect("/pending");
  if (!profile.onboarding_completed) redirect("/onboarding");

  const accounts = await getAccounts(profile.id);
  const selected = await getSelectedAccount(accounts);
  const data = getAccountData(selected);
  const admin = isAdmin(profile);

  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get("tb_sidebar")?.value === "collapsed";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-dvh">
        <AppSidebar isAdmin={admin} defaultCollapsed={defaultCollapsed} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav
            profile={profile}
            isAdmin={admin}
            accounts={accounts}
            selected={selected}
            botStatus={data.botStatus}
            isDemo={data.isDemo}
          />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
