"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2, MoreHorizontal, ShieldCheck, ShieldOff, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setUserRole, setUserStatus } from "@/lib/actions/admin";
import type { Profile } from "@/lib/types";

/** Approve / reject buttons for the pending queue. */
export function ApprovalActions({ user }: { user: Profile }) {
  const [isPending, startTransition] = useTransition();

  function decide(status: "approved" | "removed") {
    startTransition(async () => {
      const result = await setUserStatus(user.id, status);
      if (result.ok) {
        toast.success(status === "approved" ? "User approved" : "User rejected", {
          description: user.email,
        });
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => decide("removed")}>
        Reject
      </Button>
      <Button size="sm" disabled={isPending} onClick={() => decide("approved")}>
        {isPending ? <Loader2 className="animate-spin" /> : <Check />}
        Approve
      </Button>
    </div>
  );
}

/** Full management menu for the users table. */
export function UserActionsMenu({ user, selfId }: { user: Profile; selfId: string }) {
  const [isPending, startTransition] = useTransition();
  const isSelf = user.id === selfId;

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(success, { description: user.email });
      else toast.error(result.error ?? "Something went wrong.");
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.email}`}>
          {isPending ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user.status !== "approved" && (
          <DropdownMenuItem onClick={() => run(() => setUserStatus(user.id, "approved"), "User approved")}>
            <Check />
            Approve
          </DropdownMenuItem>
        )}
        {user.role === "user" ? (
          <DropdownMenuItem onClick={() => run(() => setUserRole(user.id, "admin"), "Promoted to admin")}>
            <ShieldCheck />
            Make admin
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled={isSelf}
            onClick={() => run(() => setUserRole(user.id, "user"), "Admin role removed")}
          >
            <ShieldOff />
            Remove admin role
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSelf || user.status === "removed"}
          className="text-negative focus:text-negative"
          onClick={() => run(() => setUserStatus(user.id, "removed"), "Access removed")}
        >
          <UserX />
          Remove access
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
