"use client";

import { useState, useTransition } from "react";
import { BarChart3, CheckCircle2, FileText, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConnectAccountForm } from "@/components/accounts/connect-account-form";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { cn } from "@/lib/utils";

const STEPS = ["Welcome", "Disclaimer", "Connect account", "Finish"] as const;

export function OnboardingFlow({ firstName }: { firstName: string | null }) {
  const [step, setStep] = useState(0);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isPending, startTransition] = useTransition();

  function finish() {
    startTransition(async () => {
      await completeOnboarding(disclaimerAccepted);
    });
  }

  return (
    <div className="w-full max-w-lg">
      {/* Step indicator */}
      <ol className="mb-8 flex items-center gap-2" aria-label="Onboarding progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={cn(
                "h-1 rounded-full transition-colors",
                i <= step ? "bg-foreground" : "bg-border"
              )}
            />
            <span
              className={cn(
                "hidden text-[11px] font-medium sm:block",
                i <= step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You&apos;re in. Here&apos;s what this platform gives you:
          </p>
          <ul className="mt-6 space-y-4">
            <li className="flex gap-3">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">The official master prompt</p>
                <p className="text-sm text-muted-foreground">
                  Always the latest version, ready to copy or download.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <BarChart3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Your personal trading dashboard</p>
                <p className="text-sm text-muted-foreground">
                  Daily, weekly, monthly and all-time performance for your bot, plus a
                  full trade log.
                </p>
              </div>
            </li>
          </ul>
          <Button className="mt-8 w-full" onClick={() => setStep(1)}>
            Continue
          </Button>
        </section>
      )}

      {step === 1 && (
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">Before you trade</h1>
          <div className="mt-6 flex gap-3 rounded-lg border bg-muted/40 p-4">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Trading involves substantial risk of loss. Past performance of any strategy,
              prompt, or bot does not guarantee future results. Nothing on this platform
              is financial advice — you are solely responsible for your own trading
              decisions and for complying with your local regulations.
            </p>
          </div>
          <label className="mt-6 flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={disclaimerAccepted}
              onCheckedChange={(v) => setDisclaimerAccepted(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed">
              I understand that trading involves risk and that results are not guaranteed.
            </span>
          </label>
          <div className="mt-8 flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button className="flex-1" disabled={!disclaimerAccepted} onClick={() => setStep(2)}>
              I agree — continue
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">Connect a trading account</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Link the account your bot trades so the dashboard can track it. Credentials
            are encrypted at rest and never shown again. You can also do this later.
          </p>
          <div className="mt-6">
            {connected ? (
              <div className="flex items-center gap-3 rounded-lg border border-positive/25 bg-positive/10 p-4">
                <CheckCircle2 className="size-4 shrink-0 text-positive" />
                <p className="text-sm">Account connected. You&apos;re all set.</p>
              </div>
            ) : (
              <ConnectAccountForm onSuccess={() => setConnected(true)} submitLabel="Connect account" />
            )}
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant={connected ? "default" : "ghost"}
              className="flex-1"
              onClick={() => setStep(3)}
            >
              {connected ? "Continue" : "Skip for now"}
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="text-center">
          <div className="mx-auto mb-5 flex size-11 items-center justify-center rounded-full border border-positive/25 bg-positive/10">
            <CheckCircle2 className="size-5 text-positive" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">You&apos;re ready</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Your dashboard is set up{connected ? " and your account is connected" : ""}.
            Until a live sync runs, performance pages show realistic demo data marked
            with a Demo Mode badge.
          </p>
          <Button className="mt-8 w-full" onClick={finish} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Go to dashboard
          </Button>
        </section>
      )}
    </div>
  );
}
