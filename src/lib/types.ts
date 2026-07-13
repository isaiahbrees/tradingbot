export type UserRole = "user" | "admin";
export type UserStatus = "pending" | "approved" | "removed";
export type AccountMode = "paper" | "live";
export type AccountStatus = "connected" | "error" | "disconnected";
export type TradeSide = "buy" | "sell";
export type TradeStatus = "open" | "closed";
export type BotStatus = "running" | "paused" | "error";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  onboarding_completed: boolean;
  disclaimer_accepted_at: string | null;
  created_at: string;
}

export interface MasterPrompt {
  id: string;
  version: number;
  title: string;
  instructions: string;
  content: string;
  updated_by: string | null;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: string;
  label: string;
  account_ref: string | null;
  mode: AccountMode;
  status: AccountStatus;
  api_key_last4: string | null;
  last_synced_at: string | null;
  created_at: string;
  /** True when this is the built-in demo account (no DB row behind it). */
  is_demo?: boolean;
}

export interface Trade {
  id: string;
  account_id: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  return_pct: number | null;
  fees: number;
  status: TradeStatus;
  opened_at: string;
  closed_at: string | null;
}

export interface DailyPerformance {
  /** ISO date, e.g. "2026-07-13" */
  date: string;
  pnl: number;
  return_pct: number;
  trades: number;
  wins: number;
  losses: number;
  balance: number;
  fees: number;
}

export interface PeriodSummary {
  /** Human label, e.g. "Week of Jun 8" or "June 2026" */
  label: string;
  /** ISO date of the period start (sort key) */
  start: string;
  pnl: number;
  return_pct: number;
  trades: number;
  wins: number;
  losses: number;
}

export type DateRange = "today" | "7d" | "30d" | "90d" | "1y" | "all";

export const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "3 months" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
];

export interface Platform {
  id: string;
  name: string;
  kind: "brokerage" | "exchange" | "futures" | "forex";
  description: string;
  /** True when a sync adapter exists and trade history imports automatically. */
  autoSync?: boolean;
}

/**
 * Supported integrations. Adding a platform here makes it selectable in the
 * connect flow; pairing it with an adapter in lib/sync/engine.ts turns on
 * automatic trade-history sync.
 */
export const PLATFORMS: Platform[] = [
  { id: "tradier", name: "Tradier", kind: "brokerage", description: "US stocks & options brokerage", autoSync: true },
  { id: "alpaca", name: "Alpaca", kind: "brokerage", description: "US stocks & crypto API brokerage", autoSync: true },
  { id: "interactive_brokers", name: "Interactive Brokers", kind: "brokerage", description: "Global multi-asset brokerage" },
  { id: "binance", name: "Binance", kind: "exchange", description: "Crypto exchange" },
  { id: "coinbase", name: "Coinbase Advanced", kind: "exchange", description: "Crypto exchange" },
  { id: "kraken", name: "Kraken", kind: "exchange", description: "Crypto exchange" },
  { id: "bybit", name: "Bybit", kind: "exchange", description: "Crypto derivatives exchange" },
  { id: "tradovate", name: "Tradovate", kind: "futures", description: "Futures brokerage" },
  { id: "oanda", name: "OANDA", kind: "forex", description: "Forex & CFD brokerage" },
];

export function platformName(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.name ?? id;
}
