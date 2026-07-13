import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DemoBadge } from "@/components/demo-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { GrowthChart } from "@/components/charts/growth-chart";
import { PnlBarChart } from "@/components/charts/pnl-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile } from "@/lib/auth";
import { getAccountData, getAccounts, getSelectedAccount } from "@/lib/data";
import {
  computeStats,
  filterDaily,
  filterTrades,
  monthlySummaries,
  weeklySummaries,
} from "@/lib/performance";
import {
  formatCurrency,
  formatDateShort,
  formatPercent,
  formatSignedCurrency,
} from "@/lib/format";
import { DATE_RANGES, type DateRange } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Performance" };

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const rangeParam = (await searchParams).range;
  const range = (DATE_RANGES.find((r) => r.value === rangeParam)?.value ?? "90d") as DateRange;

  const accounts = await getAccounts(profile.id);
  const account = await getSelectedAccount(accounts);
  const data = getAccountData(account);

  const filteredDaily = filterDaily(data.daily, range);
  const filteredTrades = filterTrades(data.trades, range);
  const stats = computeStats(filteredDaily, filteredTrades, data.startingBalance);

  const dailyBars = filteredDaily
    .filter((d) => d.trades > 0)
    .slice(-60)
    .map((d) => ({ label: formatDateShort(d.date), pnl: d.pnl }));
  const weeklyBars = weeklySummaries(filteredDaily)
    .slice(0, 16)
    .reverse()
    .map((w) => ({ label: w.label.replace("Week of ", ""), pnl: w.pnl }));
  const monthlyBars = monthlySummaries(filteredDaily)
    .reverse()
    .map((m) => ({ label: m.label.slice(0, 3), pnl: m.pnl }));

  const pnlClass = (v: number) =>
    cn(v > 0 && "text-positive", v < 0 && "text-negative");

  return (
    <div>
      <PageHeader title="Performance" description={`Deep analytics for ${account.label}.`}>
        {data.isDemo && <DemoBadge />}
        <RangeSelector value={range} />
      </PageHeader>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Win rate"
          value={formatPercent(stats.winRate)}
          sub={`Profit factor ${stats.profitFactor.toFixed(2)}`}
        />
        <StatCard
          label="Average winning trade"
          value={<span className="text-positive">{formatSignedCurrency(stats.avgWin)}</span>}
        />
        <StatCard
          label="Average losing trade"
          value={<span className={pnlClass(stats.avgLoss)}>{formatSignedCurrency(stats.avgLoss)}</span>}
        />
        <StatCard
          label="Max drawdown"
          value={<span className={stats.maxDrawdownPct > 0 ? "text-negative" : undefined}>-{formatPercent(stats.maxDrawdownPct)}</span>}
          sub="Peak to trough"
        />
        <StatCard
          label="Largest win"
          value={<span className="text-positive">{formatSignedCurrency(stats.largestWin)}</span>}
        />
        <StatCard
          label="Largest loss"
          value={<span className={pnlClass(stats.largestLoss)}>{formatSignedCurrency(stats.largestLoss)}</span>}
        />
        <StatCard label="Total fees" value={formatCurrency(stats.totalFees)} />
        <StatCard
          label="Trades"
          value={filteredTrades.length.toLocaleString("en-US")}
          sub={`${stats.openTrades} open`}
        />
        <StatCard
          label="Best trading day"
          value={
            stats.bestDay ? (
              <span className="text-positive">{formatSignedCurrency(stats.bestDay.pnl)}</span>
            ) : (
              "—"
            )
          }
          sub={stats.bestDay ? formatDateShort(stats.bestDay.date) : undefined}
        />
        <StatCard
          label="Worst trading day"
          value={
            stats.worstDay ? (
              <span className={pnlClass(stats.worstDay.pnl)}>
                {formatSignedCurrency(stats.worstDay.pnl)}
              </span>
            ) : (
              "—"
            )
          }
          sub={stats.worstDay ? formatDateShort(stats.worstDay.date) : undefined}
        />
        <StatCard
          label="Net P&L"
          value={<span className={pnlClass(stats.totalPnl)}>{formatSignedCurrency(stats.totalPnl)}</span>}
          sub="In selected range"
        />
        <StatCard
          label="Ending balance"
          value={formatCurrency(stats.balance)}
        />
      </div>

      {/* Charts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account growth</CardTitle>
        </CardHeader>
        <CardContent>
          <GrowthChart data={filteredDaily} height={280} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Daily profit &amp; loss</CardTitle>
          <p className="text-sm text-muted-foreground">Last {dailyBars.length} trading days in range</p>
        </CardHeader>
        <CardContent>
          <PnlBarChart data={dailyBars} height={220} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly profit &amp; loss</CardTitle>
          </CardHeader>
          <CardContent>
            <PnlBarChart data={weeklyBars} height={220} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly profit &amp; loss</CardTitle>
          </CardHeader>
          <CardContent>
            <PnlBarChart data={monthlyBars} height={220} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
