import { cn } from "@/lib/utils";

/** Shared tooltip frame so every chart's hover card looks identical. */
export function ChartTooltipFrame({
  title,
  rows,
  className,
}: {
  title: string;
  rows: { label: string; value: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-36 rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md",
        className
      )}
    >
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="space-y-0.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 text-xs">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono tabular font-medium">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
