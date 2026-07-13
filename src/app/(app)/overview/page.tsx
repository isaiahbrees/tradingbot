import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DemoBadge } from "@/components/demo-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { GrowthChart } from "@/components/charts/growth-chart";
import { PerformanceTable } from "@/components/dashboard/performance-table";
import { PnlPercent } from "@/components/pnl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProfile } from "@/lib/auth";
import { getAccountData, getAccounts, getSelectedAccount } from "@/lib/data";
import {
  computeStats,
  filterDaily,
  monthlySummaries,
  weeklySummaries,
} from "@/lib/performance";
import {
  formatCurrency,
  formatDateShort,
  formatPercent,
  formatSignedCurrency,
  formatSignedPercent,
} from "@/lib/format";
import { DATE_RANGES, type DateRange } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

function parseRange(value: string | undefined, fallback: DateRange): DateRange {
  return (DATE_RANGES.find((r) => r.value === value)?.value ?? fallback) as DateRange;
}

const BOT_LABEL = { running: "Running", paused: "Paused", error: "Error" } as const;

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const range = parseRange((await searchParams).range, "30d");
  const accounts = await getAccounts(profile.id);
  const account = await getSelectedAccount(accounts);
  const data = getAccountData(account);

  const stats = computeStats(data.daily, data.trades, data.startingBalance);
  const filtered = filterDaily(data.daily, range);

  const dailyRows = [...filtered]
    .reverse()
    .filter((d) => d.trades > 0)
    .slice(0, 30)
    .map((d) => ({
      key: d.date,
      label: formatDateShort(d.date),
      pnl: d.pnl,
      return_pct: d.return_pct,
      trades: d.trades,
      wins: d.wins,
      losses: d.losses,
    }));

  const weeklyRows = weeklySummaries(filterDaily(data.daily, "90d"))
    .slice(0, 12)
    .map((w) => ({ ...w, key: w.start }));
  const monthlyRows = monthlySummaries(data.daily).map((m) => ({ ...m, key: m.start }));

  return (
    <div>
      <PageHeader title="Overview" description={`${account.label} · performance at a glance`}>
        {data.isDemo && <DemoBadge />}
      </PageHeader>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total P&L"
          value={
            <span className={cn(stats.totalPnl > 0 && "text-positive", stats.totalPnl < 0 && "text-negative")}>
              {formatSignedCurrency(stats.totalPnl)}
            </span>
          }
          sub={<>All time · <PnlPercent value={stats.totalReturnPct} className="text-xs" /></>}
        />
        <StatCard
          label="Today's P&L"
          value={
            <span className={cn(stats.todayPnl > 0 && "text-positive", stats.todayPnl < 0 && "text-negative")}>
              {formatSignedCurrency(stats.todayPnl)}
            </span>
          }
          sub={<PnlPercent value={stats.todayReturnPct} className="text-xs" />}
        />
        <StatCard
          label="Account balance"
          value={formatCurrency(stats.balance)}
          sub={`Started at ${formatCurrency(data.startingBalance)}`}
        />
        <StatCard
          label="Total return"
          value={
            <span className={cn(stats.totalReturnPct > 0 && "text-positive", stats.totalReturnPct < 0 && "text-negative")}>
              {formatSignedPercent(stats.totalReturnPct)}
            </span>
          }
          sub={`Max drawdown ${formatPercent(stats.maxDrawdownPct)}`}
        />
        <StatCard
          label="Win rate"
          value={formatPercent(stats.winRate)}
          sub={`Profit factor ${stats.profitFactor.toFixed(2)}`}
        />
        <StatCard
          label="Total trades"
          value={stats.totalTrades.toLocaleString("en-US")}
          sub={`${stats.openTrades} currently open`}
        />
        <StatCard
          label="Bot status"
          mono={false}
          value={
            <span className="flex items-center gap-2 text-base font-medium">
              <span
                className={cn(
                  "size-2 rounded-full",
                  data.botStatus === "running" && "bg-positive",
                  data.botStatus === "paused" && "bg-muted-foreground",
                  data.botStatus === "error" && "bg-negative"
                )}
              />
              {BOT_LABEL[data.botStatus]}
            </span>
          }
          sub="Executing the master prompt"
        />
        <StatCard
          label="Best day"
          value={
            stats.bestDay ? (
              <span className="text-positive">{formatSignedCurrency(stats.bestDay.pnl)}</span>
            ) : (
              "—"
            )
          }
          sub={stats.bestDay ? formatDateShort(stats.bestDay.date) : undefined}
        />
      </div>

      {/* Account growth */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Account growth</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Balance over time</p>
          </div>
          <RangeSelector value={range} />
        </CardHeader>
        <CardContent>
          <GrowthChart data={filtered} />
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Performance breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily">
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              <PerformanceTable rows={dailyRows} labelHeader="Date" />
            </TabsContent>
            <TabsContent value="weekly">
              <PerformanceTable rows={weeklyRows} labelHeader="Week" />
            </TabsContent>
            <TabsContent value="monthly">
              <PerformanceTable rows={monthlyRows} labelHeader="Month" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
