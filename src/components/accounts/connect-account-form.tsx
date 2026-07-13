"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { connectAccount } from "@/lib/actions/accounts";
import { PLATFORMS, type AccountMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const KINDS: { kind: string; label: string }[] = [
  { kind: "brokerage", label: "Brokerages" },
  { kind: "exchange", label: "Exchanges" },
  { kind: "futures", label: "Futures" },
  { kind: "forex", label: "Forex" },
];

export function ConnectAccountForm({
  onSuccess,
  submitLabel = "Connect account",
}: {
  onSuccess?: () => void;
  submitLabel?: string;
}) {
  const [platform, setPlatform] = useState<string>("");
  const [label, setLabel] = useState("");
  const [accountRef, setAccountRef] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [mode, setMode] = useState<AccountMode>("paper");
  const [isPending, startTransition] = useTransition();

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform);
  const isTradier = platform === "tradier";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!platform) {
      toast.error("Choose a platform first.");
      return;
    }
    startTransition(async () => {
      const result = await connectAccount({
        platform,
        label,
        accountRef,
        apiKey,
        apiSecret,
        mode,
      });
      if (result.ok) {
        toast.success("Account connected", {
          description: "Credentials were encrypted and stored securely.",
        });
        setApiKey("");
        setApiSecret("");
        onSuccess?.();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="platform">Platform</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger id="platform">
            <SelectValue placeholder="Choose a brokerage or exchange" />
          </SelectTrigger>
          <SelectContent>
            {KINDS.map(({ kind, label: kindLabel }) => {
              const items = PLATFORMS.filter((p) => p.kind === kind);
              if (!items.length) return null;
              return (
                <SelectGroup key={kind}>
                  <SelectLabel>{kindLabel}</SelectLabel>
                  {items.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
        {selectedPlatform && (
          <p className="text-xs text-muted-foreground">
            {selectedPlatform.autoSync
              ? "Trade history syncs automatically once connected."
              : "Credentials are stored now; automatic sync for this platform is coming later."}
            {isTradier &&
              " Tradier uses a single access token — paste it as the API key and leave the secret blank."}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="label">Nickname (optional)</Label>
          <Input
            id="label"
            placeholder="Main bot account"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={60}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="account-ref">Account ID (optional)</Label>
          <Input
            id="account-ref"
            placeholder="e.g. PA3X…"
            value={accountRef}
            onChange={(e) => setAccountRef(e.target.value)}
            maxLength={120}
            className="font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="api-key">{isTradier ? "Access token" : "API key"}</Label>
        <Input
          id="api-key"
          type="password"
          autoComplete="off"
          required
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="api-secret">
          API secret{isTradier && <span className="text-muted-foreground"> (not needed)</span>}
        </Label>
        <Input
          id="api-secret"
          type="password"
          autoComplete="off"
          required={!isTradier}
          disabled={isTradier}
          value={isTradier ? "" : apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          className="font-mono"
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" />
          Encrypted at rest. Never displayed again after saving.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Trading mode</Label>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Trading mode">
          {(["paper", "live"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                mode === m
                  ? "border-foreground bg-foreground text-background"
                  : "hover:bg-accent"
              )}
            >
              {m === "paper" ? "Paper trading" : "Live trading"}
            </button>
          ))}
        </div>
        {mode === "live" && (
          <p className="text-xs text-muted-foreground">
            Live mode tracks a real-money account. Use read-only API keys where your
            platform supports them.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
