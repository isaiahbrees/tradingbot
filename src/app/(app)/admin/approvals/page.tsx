import type { Metadata } from "next";
import { UserCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ApprovalActions } from "@/components/admin/user-actions";
import { getAllProfiles } from "@/lib/admin-data";
import { formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Account Approvals" };

export default async function ApprovalsPage() {
  const users = await getAllProfiles();
  const pending = users.filter((u) => u.status === "pending");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Account Approvals"
        description="New sign-ins wait here until you approve them."
      />

      {pending.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
          <UserCheck className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No pending requests</p>
          <p className="text-sm text-muted-foreground">
            New Google sign-ins will appear here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((user) => (
            <Card key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                  {user.avatar_url && (
                    <AvatarImage src={user.avatar_url} alt={user.full_name ?? user.email} />
                  )}
                  <AvatarFallback>
                    {(user.full_name ?? user.email).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.full_name ?? "—"}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{user.email}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Signed up {formatRelativeTime(user.created_at)}
                  </p>
                </div>
              </div>
              <ApprovalActions user={user} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
