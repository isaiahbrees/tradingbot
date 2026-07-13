import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemePreference } from "@/components/settings/theme-preference";
import { getProfile, isAdmin } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Your profile and app preferences." />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Managed through your Google account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              {profile.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? profile.email} />
              )}
              <AvatarFallback className="text-sm">
                {(profile.full_name ?? profile.email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{profile.full_name ?? "Member"}</p>
                {isAdmin(profile) && <Badge variant="secondary">Admin</Badge>}
              </div>
              <p className="truncate font-mono text-xs text-muted-foreground">{profile.email}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Member since {formatDate(profile.created_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how the dashboard looks.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemePreference />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Risk disclaimer</CardTitle>
          <CardDescription>
            {profile.disclaimer_accepted_at
              ? `Accepted on ${formatDate(profile.disclaimer_accepted_at)}.`
              : "Not accepted yet — you'll be asked during onboarding."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Trading involves substantial risk of loss. Past performance does not guarantee
            future results, and nothing on this platform is financial advice.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
