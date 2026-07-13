import type { BotStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABELS: Record<BotStatus, string> = {
  running: "Bot running",
  paused: "Bot paused",
  error: "Bot error",
};

export function BotStatusIndicator({ status }: { status: BotStatus }) {
  return (
    <span
      className="hidden items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground sm:flex"
      title={LABELS[status]}
    >
      <span className="relative flex size-1.5">
        {status === "running" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex size-1.5 rounded-full",
            status === "running" && "bg-positive",
            status === "paused" && "bg-muted-foreground",
            status === "error" && "bg-negative"
          )}
        />
      </span>
      {LABELS[status]}
    </span>
  );
}
