import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 items-center border-b px-6">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="text-xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
        <Button asChild variant="outline">
          <Link href="/overview">Back to dashboard</Link>
        </Button>
      </main>
    </div>
  );
}
