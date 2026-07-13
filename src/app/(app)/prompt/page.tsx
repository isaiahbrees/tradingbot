import type { Metadata } from "next";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PromptActions, PromptViewer } from "@/components/prompt/prompt-viewer";
import { Badge } from "@/components/ui/badge";
import { getMasterPrompt } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Master Prompt" };

export default async function MasterPromptPage() {
  const prompt = await getMasterPrompt();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={prompt.title} description="The official community trading prompt.">
        <PromptActions content={prompt.content} version={prompt.version} />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-mono">
          v{prompt.version}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Last updated {formatDate(prompt.created_at)}
        </span>
      </div>

      {prompt.instructions && (
        <div className="mb-4 flex gap-3 rounded-lg border bg-muted/40 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm leading-relaxed text-muted-foreground">{prompt.instructions}</p>
        </div>
      )}

      <PromptViewer content={prompt.content} />

      <p className="mt-4 text-xs text-muted-foreground">
        This prompt is maintained by the community admin and is read-only for members.
        You&apos;ll see new versions here automatically as they&apos;re published.
      </p>
    </div>
  );
}
