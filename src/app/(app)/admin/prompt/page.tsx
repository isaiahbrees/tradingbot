import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PromptEditor } from "@/components/admin/prompt-editor";
import { getMasterPrompt } from "@/lib/data";

export const metadata: Metadata = { title: "Prompt Editor" };

export default async function AdminPromptPage() {
  const prompt = await getMasterPrompt();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Master Prompt Editor"
        description="Members see the prompt read-only — this is the only place it can be changed."
      />
      <PromptEditor current={prompt} />
    </div>
  );
}
