"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltipFrame } from "@/components/charts/chart-tooltip";
import { PnlAmount } from "@/components/pnl";
import { formatCompactCurrency, formatCurrency, formatDateShort } from "@/lib/format";
import type { DailyPerformance } from "@/lib/types";

interface TooltipPayload {
  active?: boolean;
  payload?: { payload: DailyPerformance }[];
}

function GrowthTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <ChartTooltipFrame
      title={formatDateShort(row.date)}
      rows={[
        { label: "Balance", value: formatCurrency(row.balance) },
        { label: "Day P&L", value: <PnlAmount value={row.pnl} className="text-xs" /> },
        { label: "Trades", value: row.trades },
      ]}
    />
  );
}

/** Account growth over time — single-series area with a crosshair tooltip. */
export function GrowthChart({
  data,
  height = 300,
}: {
  data: DailyPerformance[];
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
        style={{ height }}
      >
        Not enough data in this range to draw the chart.
      </div>
    );
  }

  const min = Math.min(...data.map((d) => d.balance));
  const max = Math.max(...data.map((d) => d.balance));
  const pad = Math.max((max - min) * 0.08, 1);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={48}
            dy={6}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tickFormatter={(v: number) => formatCompactCurrency(v)}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={58}
          />
          <Tooltip
            content={<GrowthTooltip />}
            cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--chart-accent)"
            strokeWidth={2}
            fill="var(--chart-accent)"
            fillOpacity={0.1}
            dot={false}
            activeDot={{
              r: 4,
              fill: "var(--chart-accent)",
              stroke: "var(--color-background)",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
