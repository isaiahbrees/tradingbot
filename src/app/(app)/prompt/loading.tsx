import { Skeleton } from "@/components/ui/skeleton";

export default function PromptLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-52" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="mb-4 h-16 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
