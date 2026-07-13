import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Shown wherever generated demo data (not a live sync) is on screen. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={cn("border-dashed text-muted-foreground", className)}>
          <FlaskConical />
          Demo Mode
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Realistic generated data. Live numbers appear once your account syncs.
      </TooltipContent>
    </Tooltip>
  );
}
