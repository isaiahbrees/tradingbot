"use client";

import { useMemo, useState } from "react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PnlAmount, PnlPercent } from "@/components/pnl";
import { SideBadge, StatusBadge } from "@/components/trades/badges";
import { TradeDetailSheet } from "@/components/trades/trade-detail-sheet";
import { rangeStart } from "@/lib/performance";
import { formatDateTime, formatPrice, formatQuantity } from "@/lib/format";
import { DATE_RANGES, type DateRange, type Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

type ResultFilter = "all" | "winners" | "losers";
type StatusFilter = "all" | "open" | "closed";

const PAGE_SIZE = 50;

export function TradesExplorer({ trades }: { trades: Trade[] }) {
  const [range, setRange] = useState<DateRange>("30d");
  const [symbol, setSymbol] = useState<string>("all");
  const [result, setResult] = useState<ResultFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Trade | null>(null);

  const symbols = useMemo(
    () => [...new Set(trades.map((t) => t.symbol))].sort(),
    [trades]
  );

  const filtered = useMemo(() => {
    const start = rangeStart(range)?.getTime() ?? 0;
    return trades.filter((t) => {
      if (new Date(t.opened_at).getTime() < start) return false;
      if (symbol !== "all" && t.symbol !== symbol) return false;
      if (status !== "all" && t.status !== status) return false;
      if (result === "winners" && !(t.status === "closed" && (t.pnl ?? 0) >= 0)) return false;
      if (result === "losers" && !(t.status === "closed" && (t.pnl ?? 0) < 0)) return false;
      return true;
    });
  }, [trades, range, symbol, result, status]);

  const visible = filtered.slice(0, limit);

  function resetLimit<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setLimit(PAGE_SIZE);
    };
  }

  return (
    <div>
      {/* Filters — one row above the table */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ListFilter className="size-4 text-muted-foreground" aria-hidden="true" />
        <Select value={range} onValueChange={resetLimit((v) => setRange(v as DateRange))}>
          <SelectTrigger className="h-8 w-32 text-xs" aria-label="Date range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={symbol} onValueChange={resetLimit(setSymbol)}>
          <SelectTrigger className="h-8 w-36 text-xs" aria-label="Symbol">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All symbols</SelectItem>
            {symbols.map((s) => (
              <SelectItem key={s} value={s} className="font-mono">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={result} onValueChange={resetLimit((v) => setResult(v as ResultFilter))}>
          <SelectTrigger className="h-8 w-32 text-xs" aria-label="Result">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            <SelectItem value="winners">Winning trades</SelectItem>
            <SelectItem value="losers">Losing trades</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={resetLimit((v) => setStatus(v as StatusFilter))}>
          <SelectTrigger className="h-8 w-32 text-xs" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open trades</SelectItem>
            <SelectItem value="closed">Closed trades</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {filtered.length.toLocaleString("en-US")} trades
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-1 rounded-lg border border-dashed">
          <p className="text-sm font-medium">No trades match these filters</p>
          <p className="text-sm text-muted-foreground">Try widening the date range.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Exit</TableHead>
                <TableHead className="hidden text-right md:table-cell">Size</TableHead>
                <TableHead className="text-right">P&amp;L</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Return</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((trade) => (
                <TableRow
                  key={trade.id}
                  onClick={() => setSelected(trade)}
                  className="cursor-pointer"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(trade);
                    }
                  }}
                >
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {formatDateTime(trade.opened_at)}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] font-medium">{trade.symbol}</TableCell>
                  <TableCell>
                    <SideBadge side={trade.side} />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular text-[13px]">
                    {formatPrice(trade.entry_price)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular text-[13px]">
                    {trade.exit_price !== null ? formatPrice(trade.exit_price) : "—"}
                  </TableCell>
                  <TableCell className="hidden text-right font-mono tabular text-[13px] md:table-cell">
                    {formatQuantity(trade.quantity)}
                  </TableCell>
                  <TableCell className="text-right text-[13px]">
                    {trade.pnl !== null ? <PnlAmount value={trade.pnl} /> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="hidden text-right text-[13px] sm:table-cell">
                    {trade.return_pct !== null ? <PnlPercent value={trade.return_pct} /> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className={cn("text-right")}>
                    <StatusBadge status={trade.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length > limit && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Load more ({(filtered.length - limit).toLocaleString("en-US")} remaining)
          </Button>
        </div>
      )}

      <TradeDetailSheet trade={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
