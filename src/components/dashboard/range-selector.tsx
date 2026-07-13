"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DATE_RANGES, type DateRange } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Segmented date-range control backed by the `range` search param. */
export function RangeSelector({ value }: { value: DateRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function select(range: DateRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Date range"
      className={cn(
        "flex w-fit items-center gap-0.5 rounded-md border p-0.5 transition-opacity",
        isPending && "opacity-60"
      )}
    >
      {DATE_RANGES.map((range) => (
        <button
          key={range.value}
          type="button"
          role="radio"
          aria-checked={value === range.value}
          onClick={() => select(range.value)}
          className={cn(
            "rounded-[5px] px-2 py-1 text-xs font-medium transition-colors",
            value === range.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
