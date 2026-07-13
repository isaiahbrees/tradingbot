import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DemoBadge } from "@/components/demo-badge";
import { TradesExplorer } from "@/components/trades/trades-explorer";
import { getProfile } from "@/lib/auth";
import { getAccountData, getAccounts, getSelectedAccount } from "@/lib/data";

export const metadata: Metadata = { title: "Trades" };

export default async function TradesPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const accounts = await getAccounts(profile.id);
  const account = await getSelectedAccount(accounts);
  const data = getAccountData(account);

  return (
    <div>
      <PageHeader
        title="Trades"
        description={`Every trade the bot has taken on ${account.label}.`}
      >
        {data.isDemo && <DemoBadge />}
      </PageHeader>
      <TradesExplorer trades={data.trades} />
    </div>
  );
}
