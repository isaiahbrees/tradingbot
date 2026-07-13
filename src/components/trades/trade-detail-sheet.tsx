"use client";

import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PnlAmount, PnlPercent } from "@/components/pnl";
import { SideBadge, StatusBadge } from "@/components/trades/badges";
import {
  formatCurrency,
  formatDateTime,
  formatPrice,
  formatQuantity,
} from "@/lib/format";
import type { Trade } from "@/lib/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular font-medium">{value}</span>
    </div>
  );
}

function duration(trade: Trade): string {
  if (!trade.closed_at) return "Still open";
  const ms = new Date(trade.closed_at).getTime() - new Date(trade.opened_at).getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function TradeDetailSheet({
  trade,
  onClose,
}: {
  trade: Trade | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={trade !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-sm">
        {trade && (
          <>
            <SheetHeader className="pb-0">
              <SheetTitle className="flex items-center gap-2 font-mono text-lg">
                {trade.symbol}
                <SideBadge side={trade.side} />
              </SheetTitle>
              <SheetDescription>
                Opened {formatDateTime(trade.opened_at)}
              </SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-6">
              {/* Headline result */}
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                {trade.pnl !== null ? (
                  <>
                    <PnlAmount value={trade.pnl} className="text-2xl font-semibold" />
                    <div className="mt-1">
                      <PnlPercent value={trade.return_pct ?? 0} className="text-sm" />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-semibold text-muted-foreground">Open</p>
                    <p className="mt-1 text-sm text-muted-foreground">Result pending</p>
                  </>
                )}
              </div>

              <div className="mt-4">
                <Row label="Status" value={<StatusBadge status={trade.status} />} />
                <Separator />
                <Row label="Entry price" value={formatPrice(trade.entry_price)} />
                <Row
                  label="Exit price"
                  value={trade.exit_price !== null ? formatPrice(trade.exit_price) : "—"}
                />
                <Row label="Position size" value={formatQuantity(trade.quantity)} />
                <Row
                  label="Notional"
                  value={formatCurrency(trade.entry_price * trade.quantity)}
                />
                <Separator />
                <Row label="Fees" value={formatCurrency(trade.fees)} />
                <Row label="Opened" value={formatDateTime(trade.opened_at)} />
                <Row
                  label="Closed"
                  value={trade.closed_at ? formatDateTime(trade.closed_at) : "—"}
                />
                <Row label="Duration" value={duration(trade)} />
                <Separator />
                <Row
                  label="Trade ID"
                  value={<span className="text-xs text-muted-foreground">{trade.id}</span>}
                />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
