"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { setSelectedAccount } from "@/lib/actions/accounts";
import { platformName, type ConnectedAccount } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ModeBadge({ mode, className }: { mode: "paper" | "live"; className?: string }) {
  return (
    <Badge
      variant={mode === "live" ? "warning" : "secondary"}
      className={cn("font-mono uppercase tracking-wide", className)}
    >
      {mode}
    </Badge>
  );
}

export function AccountSwitcher({
  accounts,
  selectedId,
}: {
  accounts: ConnectedAccount[];
  selectedId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const selected = accounts.find((a) => a.id === selectedId) ?? accounts[0];

  function select(id: string) {
    if (id === selected.id) return;
    startTransition(async () => {
      await setSelectedAccount(id);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-8 max-w-56 items-center gap-2 rounded-md border px-2.5 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
        aria-label="Switch trading account"
      >
        {isPending ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              selected.status === "connected" ? "bg-positive" : "bg-negative"
            )}
          />
        )}
        <span className="truncate font-medium">{selected.label}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Trading accounts</DropdownMenuLabel>
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => select(account.id)}
            className="justify-between"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{account.label}</span>
              <span className="truncate text-xs text-muted-foreground">
                {platformName(account.platform)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <ModeBadge mode={account.mode} />
              {account.id === selected.id && <Check className="size-4" />}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/accounts">
            <Plus />
            Connect account
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
