import { cn } from "@/lib/utils";

/** Monochrome brand mark — a signal line in a square, no external assets. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-background",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
        <path
          d="M1.5 10.5L5 7l2.5 2.5L11 5l3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-sm font-semibold tracking-tight">Botdeck</span>
    </span>
  );
}
