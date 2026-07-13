import { Skeleton } from "@/components/ui/skeleton";

export default function TradesLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-32" />
        ))}
      </div>
      <div className="rounded-lg border">
        <Skeleton className="h-9 w-full rounded-b-none" />
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border-t px-3 py-3">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
