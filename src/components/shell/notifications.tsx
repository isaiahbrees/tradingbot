"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { formatRelativeTime } from "@/lib/format";
import type { DemoNotification } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function Notifications({ items }: { items: DemoNotification[] }) {
  const [read, setRead] = useState<Set<string>>(new Set());
  const unreadCount = items.filter((n) => n.unread && !read.has(n.id)).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
          <Bell />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-chart-accent" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setRead(new Set(items.map((n) => n.id)))}
            >
              Mark all as read
            </button>
          )}
        </div>
        <Separator />
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((n) => {
              const unread = n.unread && !read.has(n.id);
              return (
                <li
                  key={n.id}
                  className="flex gap-2.5 px-4 py-2.5 transition-colors hover:bg-accent/50"
                >
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      unread ? "bg-chart-accent" : "bg-transparent"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {formatRelativeTime(n.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
