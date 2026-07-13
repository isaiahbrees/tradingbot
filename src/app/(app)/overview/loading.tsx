import { Skeleton } from "@/components/ui/skeleton";

export default function OverviewLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2.5 h-6 w-28" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-lg border p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-72" />
        </div>
        <Skeleton className="mt-5 h-72 w-full" />
      </div>
      <div className="mt-6 rounded-lg border p-5">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    </div>
  );
}
