"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  FlaskConical,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeBadge } from "@/components/shell/account-switcher";
import { ConnectAccountForm } from "@/components/accounts/connect-account-form";
import {
  reconnectAccount,
  removeAccount,
  switchAccountMode,
} from "@/lib/actions/accounts";
import { syncAccountNow } from "@/lib/actions/sync";
import { formatRelativeTime } from "@/lib/format";
import { PLATFORMS, platformName, type ConnectedAccount } from "@/lib/types";
import { cn } from "@/lib/utils";

function ConnectionStatus({ status }: { status: ConnectedAccount["status"] }) {
  const config = {
    connected: { label: "Connected", dot: "bg-positive" },
    error: { label: "Connection error", dot: "bg-negative" },
    disconnected: { label: "Disconnected", dot: "bg-muted-foreground" },
  }[status];
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

function ReconnectDialog({
  account,
  open,
  onOpenChange,
}: {
  account: ConnectedAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await reconnectAccount(account.id, apiKey, apiSecret);
      if (result.ok) {
        toast.success("Credentials rotated", {
          description: "The account is connected with the new keys.",
        });
        setApiKey("");
        setApiSecret("");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reconnect {account.label}</DialogTitle>
          <DialogDescription>
            Enter new API credentials for {platformName(account.platform)}. The previous
            keys are replaced and, as always, never shown again.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-api-key">New API key</Label>
            <Input
              id="new-api-key"
              type="password"
              autoComplete="off"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-api-secret">New API secret</Label>
            <Input
              id="new-api-secret"
              type="password"
              autoComplete="off"
              required
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Save new credentials
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AccountCard({ account }: { account: ConnectedAccount }) {
  const [reconnectOpen, setReconnectOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canSync = PLATFORMS.find((p) => p.id === account.platform)?.autoSync === true;

  function syncNow() {
    startTransition(async () => {
      const result = await syncAccountNow(account.id);
      if (result.ok) {
        toast.success("Sync complete", {
          description: `${result.trades ?? 0} trades imported from ${platformName(account.platform)}.`,
        });
      } else {
        toast.error(result.error ?? "Sync failed.");
      }
    });
  }

  function toggleMode() {
    const next = account.mode === "paper" ? "live" : "paper";
    startTransition(async () => {
      const result = await switchAccountMode(account.id, next);
      if (result.ok) toast.success(`Switched to ${next} trading`);
      else toast.error(result.error ?? "Something went wrong.");
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeAccount(account.id);
      if (result.ok) {
        toast.success("Account removed", {
          description: "Its stored credentials were deleted.",
        });
        setRemoveOpen(false);
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{account.label}</p>
            <ModeBadge mode={account.mode} />
            {account.is_demo && (
              <Badge variant="outline" className="border-dashed text-muted-foreground">
                <FlaskConical />
                Demo
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {platformName(account.platform)}
            {account.account_ref && (
              <span className="font-mono"> · {account.account_ref}</span>
            )}
          </p>
        </div>

        {!account.is_demo && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Account actions">
                {isPending ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canSync && (
                <DropdownMenuItem onClick={syncNow}>
                  <RefreshCw />
                  Sync now
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setReconnectOpen(true)}>
                <KeyRound />
                Reconnect
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleMode}>
                <ArrowLeftRight />
                Switch to {account.mode === "paper" ? "live" : "paper"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-negative focus:text-negative"
                onClick={() => setRemoveOpen(true)}
              >
                <Trash2 />
                Remove account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <ConnectionStatus status={account.status} />
        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
          {account.api_key_last4 && <span>API key •••• {account.api_key_last4}</span>}
          <span>
            {account.last_synced_at
              ? `Synced ${formatRelativeTime(account.last_synced_at)}`
              : "Never synced"}
          </span>
        </div>
      </div>

      <ReconnectDialog account={account} open={reconnectOpen} onOpenChange={setReconnectOpen} />

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {account.label}?</DialogTitle>
            <DialogDescription>
              This disconnects the account and permanently deletes its encrypted API
              credentials. Your trade history on the platform itself is not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Remove account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function AccountsManager({ accounts }: { accounts: ConnectedAccount[] }) {
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-end">
        <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              Connect account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Connect a trading account</DialogTitle>
              <DialogDescription>
                Credentials are encrypted with AES-256 before they&apos;re stored and are
                never displayed again.
              </DialogDescription>
            </DialogHeader>
            <ConnectAccountForm onSuccess={() => setConnectOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
}
