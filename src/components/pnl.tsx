import { formatSignedCurrency, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

function pnlClass(value: number): string {
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted-foreground";
}

/** Signed dollar amount, green for gains and red for losses, in Geist Mono. */
export function PnlAmount({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("font-mono tabular", pnlClass(value), className)}>
      {formatSignedCurrency(value)}
    </span>
  );
}

/** Signed percentage, green for gains and red for losses, in Geist Mono. */
export function PnlPercent({
  value,
  digits = 2,
  className,
}: {
  value: number;
  digits?: number;
  className?: string;
}) {
  return (
    <span className={cn("font-mono tabular", pnlClass(value), className)}>
      {formatSignedPercent(value, digits)}
    </span>
  );
}
