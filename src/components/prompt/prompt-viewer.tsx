"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PromptActions({
  content,
  version,
}: {
  content: string;
  version: number;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Prompt copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't access the clipboard. Select the text and copy manually.");
    }
  }

  function download() {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `master-prompt-v${version}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check className="text-positive" /> : <Copy />}
        {copied ? "Copied" : "Copy Prompt"}
      </Button>
      <Button variant="outline" size="sm" onClick={download}>
        <Download />
        Download
      </Button>
    </div>
  );
}

/**
 * Read-only, code-style prompt viewer. Deliberately not an editable field —
 * the content renders in a <pre> so formatting and spacing are preserved
 * exactly.
 */
export function PromptViewer({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="overflow-hidden rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full border bg-background" />
          <span className="size-2.5 rounded-full border bg-background" />
          <span className="size-2.5 rounded-full border bg-background" />
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          master-prompt.txt · {lines.length} lines · read-only
        </span>
      </div>
      <div className="max-h-[32rem] overflow-auto">
        <pre className="p-4 font-mono text-[13px] leading-6 text-foreground">
          <code>
            {lines.map((line, i) => (
              <span key={i} className="grid grid-cols-[3rem_1fr]">
                <span className="select-none pr-4 text-right text-muted-foreground/50">
                  {i + 1}
                </span>
                <span className="whitespace-pre">{line || " "}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
