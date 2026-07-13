import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AccountsManager } from "@/components/accounts/accounts-manager";
import { getProfile } from "@/lib/auth";
import { getAccounts } from "@/lib/data";

export const metadata: Metadata = { title: "Connected Accounts" };

export default async function AccountsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const accounts = await getAccounts(profile.id);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Connected Accounts"
        description="Link the brokerage or exchange accounts your bot trades."
      />
      <AccountsManager accounts={accounts} />
    </div>
  );
}
