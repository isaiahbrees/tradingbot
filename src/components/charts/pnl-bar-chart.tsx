"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltipFrame } from "@/components/charts/chart-tooltip";
import { PnlAmount } from "@/components/pnl";
import { formatCompactCurrency } from "@/lib/format";

export interface PnlPoint {
  label: string;
  pnl: number;
}

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: PnlPoint;
}

/** 4px rounded data-end, square at the zero baseline — for both signs. */
function SignedBar({ x = 0, y = 0, width = 0, height = 0, fill, payload }: BarShapeProps) {
  if (!width || !height) return <g />;
  const positive = (payload?.pnl ?? 0) >= 0;
  const r = Math.min(4, width / 2, Math.abs(height));
  const path = positive
    ? `M ${x},${y + height}
       L ${x},${y + r} Q ${x},${y} ${x + r},${y}
       L ${x + width - r},${y} Q ${x + width},${y} ${x + width},${y + r}
       L ${x + width},${y + height} Z`
    : `M ${x},${y}
       L ${x + width},${y}
       L ${x + width},${y + height - r} Q ${x + width},${y + height} ${x + width - r},${y + height}
       L ${x + r},${y + height} Q ${x},${y + height} ${x},${y + height - r} Z`;
  return <path d={path} fill={fill} />;
}

interface TooltipPayload {
  active?: boolean;
  payload?: { payload: PnlPoint }[];
}

function PnlTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <ChartTooltipFrame
      title={row.label}
      rows={[{ label: "P&L", value: <PnlAmount value={row.pnl} className="text-xs" /> }]}
    />
  );
}

/** Profit/loss bars — green above the baseline, red below, nothing else. */
export function PnlBarChart({
  data,
  height = 240,
}: {
  data: PnlPoint[];
  height?: number;
}) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
        style={{ height }}
      >
        No data in this range.
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            dy={6}
          />
          <YAxis
            tickFormatter={(v: number) => formatCompactCurrency(v)}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={58}
          />
          <Tooltip content={<PnlTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Bar dataKey="pnl" maxBarSize={24} shape={<SignedBar />} isAnimationActive={false}>
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.pnl >= 0 ? "var(--chart-positive)" : "var(--chart-negative)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
