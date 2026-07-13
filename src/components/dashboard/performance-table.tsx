import { PnlAmount, PnlPercent } from "@/components/pnl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface PerformanceRow {
  key: string;
  label: string;
  pnl: number;
  return_pct: number;
  trades: number;
  wins: number;
  losses: number;
}

/** Shared table for daily / weekly / monthly performance breakdowns. */
export function PerformanceTable({
  rows,
  labelHeader,
  emptyMessage = "No trading activity in this range.",
}: {
  rows: PerformanceRow[];
  labelHeader: string;
  emptyMessage?: string;
}) {
  if (!rows.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{labelHeader}</TableHead>
          <TableHead className="text-right">P&amp;L</TableHead>
          <TableHead className="text-right">Return</TableHead>
          <TableHead className="text-right">Trades</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Wins</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Losses</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell className="font-mono text-xs text-muted-foreground">{row.label}</TableCell>
            <TableCell className="text-right text-[13px]">
              <PnlAmount value={row.pnl} />
            </TableCell>
            <TableCell className="text-right text-[13px]">
              <PnlPercent value={row.return_pct} />
            </TableCell>
            <TableCell className="text-right font-mono tabular text-[13px]">{row.trades}</TableCell>
            <TableCell className="hidden text-right font-mono tabular text-[13px] text-muted-foreground sm:table-cell">
              {row.wins}
            </TableCell>
            <TableCell className="hidden text-right font-mono tabular text-[13px] text-muted-foreground sm:table-cell">
              {row.losses}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
