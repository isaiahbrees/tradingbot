import {
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import type { DailyPerformance, DateRange, PeriodSummary, Trade } from "@/lib/types";

// ── Range filtering ──────────────────────────────────────────────────────────

export function rangeStart(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":
      return subDays(now, 7);
    case "30d":
      return subDays(now, 30);
    case "90d":
      return subMonths(now, 3);
    case "1y":
      return subYears(now, 1);
    case "all":
      return null;
  }
}

export function filterDaily(daily: DailyPerformance[], range: DateRange): DailyPerformance[] {
  const start = rangeStart(range);
  if (!start) return daily;
  const iso = format(start, "yyyy-MM-dd");
  return daily.filter((d) => d.date >= iso);
}

export function filterTrades(trades: Trade[], range: DateRange): Trade[] {
  const start = rangeStart(range);
  if (!start) return trades;
  const t = start.getTime();
  return trades.filter((tr) => new Date(tr.opened_at).getTime() >= t);
}

// ── Period summaries ─────────────────────────────────────────────────────────

function summarize(groups: Map<string, { label: string; rows: DailyPerformance[] }>): PeriodSummary[] {
  return [...groups.entries()]
    .map(([start, { label, rows }]) => {
      const first = rows[0];
      const startBalance = first.balance - first.pnl;
      const pnl = rows.reduce((s, r) => s + r.pnl, 0);
      return {
        label,
        start,
        pnl: Number(pnl.toFixed(2)),
        return_pct: startBalance > 0 ? Number(((pnl / startBalance) * 100).toFixed(2)) : 0,
        trades: rows.reduce((s, r) => s + r.trades, 0),
        wins: rows.reduce((s, r) => s + r.wins, 0),
        losses: rows.reduce((s, r) => s + r.losses, 0),
      };
    })
    .sort((a, b) => (a.start < b.start ? 1 : -1));
}

export function weeklySummaries(daily: DailyPerformance[]): PeriodSummary[] {
  const groups = new Map<string, { label: string; rows: DailyPerformance[] }>();
  for (const d of daily) {
    const ws = startOfWeek(parseISO(d.date), { weekStartsOn: 1 });
    const key = format(ws, "yyyy-MM-dd");
    const entry = groups.get(key) ?? { label: `Week of ${format(ws, "MMM d")}`, rows: [] };
    entry.rows.push(d);
    groups.set(key, entry);
  }
  return summarize(groups);
}

export function monthlySummaries(daily: DailyPerformance[]): PeriodSummary[] {
  const groups = new Map<string, { label: string; rows: DailyPerformance[] }>();
  for (const d of daily) {
    const ms = startOfMonth(parseISO(d.date));
    const key = format(ms, "yyyy-MM-dd");
    const entry = groups.get(key) ?? { label: format(ms, "MMMM yyyy"), rows: [] };
    entry.rows.push(d);
    groups.set(key, entry);
  }
  return summarize(groups);
}

// ── Aggregate statistics ─────────────────────────────────────────────────────

export interface PerformanceStats {
  totalPnl: number;
  todayPnl: number;
  todayReturnPct: number;
  balance: number;
  totalReturnPct: number;
  winRate: number;
  totalTrades: number;
  openTrades: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  maxDrawdownPct: number;
  totalFees: number;
  profitFactor: number;
  bestDay: DailyPerformance | null;
  worstDay: DailyPerformance | null;
}

export function computeStats(
  daily: DailyPerformance[],
  trades: Trade[],
  startingBalance: number
): PerformanceStats {
  const closed = trades.filter((t) => t.status === "closed" && t.pnl !== null);
  const winners = closed.filter((t) => (t.pnl ?? 0) >= 0);
  const losers = closed.filter((t) => (t.pnl ?? 0) < 0);

  const totalPnl = daily.reduce((s, d) => s + d.pnl, 0);
  const balance = daily.length ? daily[daily.length - 1].balance : startingBalance;

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayRow = daily.find((d) => d.date === todayIso);

  // Max drawdown over the equity curve.
  let peak = startingBalance;
  let maxDd = 0;
  for (const d of daily) {
    peak = Math.max(peak, d.balance);
    maxDd = Math.max(maxDd, (peak - d.balance) / peak);
  }

  const grossWins = winners.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLosses = Math.abs(losers.reduce((s, t) => s + (t.pnl ?? 0), 0));

  const tradedDays = daily.filter((d) => d.trades > 0);
  const bestDay = tradedDays.length
    ? tradedDays.reduce((a, b) => (b.pnl > a.pnl ? b : a))
    : null;
  const worstDay = tradedDays.length
    ? tradedDays.reduce((a, b) => (b.pnl < a.pnl ? b : a))
    : null;

  return {
    totalPnl: Number(totalPnl.toFixed(2)),
    todayPnl: todayRow?.pnl ?? 0,
    todayReturnPct: todayRow?.return_pct ?? 0,
    balance,
    totalReturnPct: Number(((totalPnl / startingBalance) * 100).toFixed(2)),
    winRate: closed.length ? Number(((winners.length / closed.length) * 100).toFixed(1)) : 0,
    totalTrades: trades.length,
    openTrades: trades.filter((t) => t.status === "open").length,
    avgWin: winners.length ? Number((grossWins / winners.length).toFixed(2)) : 0,
    avgLoss: losers.length ? Number((-grossLosses / losers.length).toFixed(2)) : 0,
    largestWin: winners.length ? Math.max(...winners.map((t) => t.pnl ?? 0)) : 0,
    largestLoss: losers.length ? Math.min(...losers.map((t) => t.pnl ?? 0)) : 0,
    maxDrawdownPct: Number((maxDd * 100).toFixed(2)),
    totalFees: Number(daily.reduce((s, d) => s + d.fees, 0).toFixed(2)),
    profitFactor: grossLosses > 0 ? Number((grossWins / grossLosses).toFixed(2)) : 0,
    bestDay,
    worstDay,
  };
}
