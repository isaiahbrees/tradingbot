import {
  ArrowLeftRight,
  ChartLine,
  FilePen,
  FileText,
  LayoutDashboard,
  Plug,
  Settings,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const MAIN_NAV: NavItem[] = [
  { title: "Overview", href: "/overview", icon: LayoutDashboard },
  { title: "Master Prompt", href: "/prompt", icon: FileText },
  { title: "Trades", href: "/trades", icon: ArrowLeftRight },
  { title: "Performance", href: "/performance", icon: ChartLine },
  { title: "Connected Accounts", href: "/accounts", icon: Plug },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Account Approvals", href: "/admin/approvals", icon: UserCheck },
  { title: "Prompt Editor", href: "/admin/prompt", icon: FilePen },
];
