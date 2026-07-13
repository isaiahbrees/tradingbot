import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserActionsMenu } from "@/components/admin/user-actions";
import { getProfile } from "@/lib/auth";
import { getAllProfiles } from "@/lib/admin-data";
import { formatDate } from "@/lib/format";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Users" };

function StatusBadge({ status }: { status: Profile["status"] }) {
  if (status === "approved") return <Badge variant="positive">Approved</Badge>;
  if (status === "pending") return <Badge variant="warning">Pending</Badge>;
  return <Badge variant="negative">Removed</Badge>;
}

export default async function AdminUsersPage() {
  const me = await getProfile();
  if (!me) redirect("/login");
  const users = await getAllProfiles();

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${users.length} member${users.length === 1 ? "" : "s"} · approve, promote, or remove access.`}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Member</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="hidden md:table-cell">Onboarded</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7">
                      {user.avatar_url && (
                        <AvatarImage src={user.avatar_url} alt={user.full_name ?? user.email} />
                      )}
                      <AvatarFallback>
                        {(user.full_name ?? user.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.full_name ?? "—"}
                        {user.id === me.id && (
                          <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                        )}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {user.role === "admin" ? (
                    <Badge variant="secondary">Admin</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Member</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {user.onboarding_completed ? "Yes" : "No"}
                </TableCell>
                <TableCell className="text-right">
                  <UserActionsMenu user={user} selfId={me.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
