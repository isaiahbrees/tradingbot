import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Compact Vercel-style stat tile. `value` should already be formatted;
 * numbers wear Geist Mono via the value slot.
 */
export function StatCard({
  label,
  value,
  valueClassName,
  sub,
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  sub?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-xl font-semibold leading-tight tracking-tight",
          mono && "font-mono",
          valueClassName
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}
