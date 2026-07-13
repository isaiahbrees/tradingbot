import { AccountSwitcher, ModeBadge } from "@/components/shell/account-switcher";
import { BotStatusIndicator } from "@/components/shell/bot-status";
import { MobileNav } from "@/components/shell/mobile-nav";
import { Notifications } from "@/components/shell/notifications";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { UserMenu } from "@/components/shell/user-menu";
import { DemoBadge } from "@/components/demo-badge";
import { demoNotifications } from "@/lib/demo-data";
import type { BotStatus, ConnectedAccount, Profile } from "@/lib/types";

export function TopNav({
  profile,
  isAdmin,
  accounts,
  selected,
  botStatus,
  isDemo,
}: {
  profile: Profile;
  isAdmin: boolean;
  accounts: ConnectedAccount[];
  selected: ConnectedAccount;
  botStatus: BotStatus;
  isDemo: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:gap-3 sm:px-4">
      <MobileNav isAdmin={isAdmin} />
      <AccountSwitcher accounts={accounts} selectedId={selected.id} />
      <ModeBadge mode={selected.mode} />
      <BotStatusIndicator status={botStatus} />
      {isDemo && <DemoBadge className="hidden lg:inline-flex" />}

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <Notifications items={demoNotifications()} />
        <ThemeToggle />
        <div className="ml-1">
          <UserMenu profile={profile} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
