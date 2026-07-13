"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveMasterPrompt } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import type { MasterPrompt } from "@/lib/types";

export function PromptEditor({ current }: { current: MasterPrompt }) {
  const [title, setTitle] = useState(current.title);
  const [instructions, setInstructions] = useState(current.instructions);
  const [content, setContent] = useState(current.content);
  const [isPending, startTransition] = useTransition();

  const dirty =
    title !== current.title ||
    instructions !== current.instructions ||
    content !== current.content;

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveMasterPrompt({ title, instructions, content });
      if (result.ok) {
        toast.success(`Version ${current.version + 1} published`, {
          description: "All approved members now see the new prompt.",
        });
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={save}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-mono">
          current v{current.version}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Last updated {formatDate(current.created_at)}
        </span>
        <span className="text-xs text-muted-foreground">
          · Saving publishes <span className="font-mono">v{current.version + 1}</span> to all
          approved members
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="prompt-title">Title</Label>
            <Input
              id="prompt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prompt-instructions">Short instructions (shown above the prompt)</Label>
          <Textarea
            id="prompt-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            maxLength={500}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prompt-content">Prompt content</Label>
          <Textarea
            id="prompt-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            spellCheck={false}
            className="min-h-[28rem] font-mono text-[13px] leading-6"
          />
          <p className="font-mono text-xs text-muted-foreground">
            {content.split("\n").length} lines · {content.length.toLocaleString("en-US")} characters
            · formatting and whitespace are preserved exactly
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-4">
          {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          <Button type="submit" disabled={isPending || !dirty}>
            {isPending ? <Loader2 className="animate-spin" /> : <Save />}
            Save &amp; publish v{current.version + 1}
          </Button>
        </div>
      </div>
    </form>
  );
}
