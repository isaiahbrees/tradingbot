import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Trade } from "@/lib/types";

export function SideBadge({ side }: { side: Trade["side"] }) {
  return (
    <Badge variant={side === "buy" ? "positive" : "negative"} className="font-mono uppercase">
      {side === "buy" ? <ArrowUpRight /> : <ArrowDownRight />}
      {side}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: Trade["status"] }) {
  return status === "open" ? (
    <Badge variant="outline" className="border-chart-accent/30 text-chart-accent">
      <span className="size-1.5 rounded-full bg-chart-accent" />
      Open
    </Badge>
  ) : (
    <Badge variant="secondary">Closed</Badge>
  );
}
