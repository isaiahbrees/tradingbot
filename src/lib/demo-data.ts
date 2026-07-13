import type {
  AccountMode,
  ConnectedAccount,
  DailyPerformance,
  Trade,
  TradeSide,
} from "@/lib/types";

/**
 * Deterministic demo trading data.
 *
 * Everything here is seeded from the account id, so the same account always
 * shows the same history, and the series always ends "today" so charts look
 * live. When real platform sync lands, `getAccountData` in lib/data.ts swaps
 * this out per-account without touching any UI.
 */

// ── Seeded PRNG (xmur3 hash → mulberry32) ────────────────────────────────────

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Instrument universe ──────────────────────────────────────────────────────

interface Instrument {
  symbol: string;
  base: number;
  vol: number; // daily price noise factor
  crypto: boolean;
  lot: number; // quantity rounding step
}

const INSTRUMENTS: Instrument[] = [
  { symbol: "AAPL", base: 232, vol: 0.02, crypto: false, lot: 1 },
  { symbol: "NVDA", base: 141, vol: 0.035, crypto: false, lot: 1 },
  { symbol: "TSLA", base: 248, vol: 0.04, crypto: false, lot: 1 },
  { symbol: "MSFT", base: 428, vol: 0.018, crypto: false, lot: 1 },
  { symbol: "META", base: 592, vol: 0.025, crypto: false, lot: 1 },
  { symbol: "AMD", base: 122, vol: 0.035, crypto: false, lot: 1 },
  { symbol: "SPY", base: 596, vol: 0.012, crypto: false, lot: 1 },
  { symbol: "QQQ", base: 522, vol: 0.015, crypto: false, lot: 1 },
  { symbol: "BTC-USD", base: 97400, vol: 0.03, crypto: true, lot: 0.0001 },
  { symbol: "ETH-USD", base: 3420, vol: 0.04, crypto: true, lot: 0.001 },
  { symbol: "SOL-USD", base: 214, vol: 0.05, crypto: true, lot: 0.01 },
];

// ── Generator ────────────────────────────────────────────────────────────────

export interface DemoSeries {
  daily: DailyPerformance[];
  trades: Trade[];
  startingBalance: number;
}

const HISTORY_DAYS = 270;

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function generateSeries(seedKey: string, mode: AccountMode): DemoSeries {
  const rand = mulberry32(xmur3(`${seedKey}:${mode}`)());
  const startingBalance = mode === "live" ? 25_000 : 100_000;

  const daily: DailyPerformance[] = [];
  const trades: Trade[] = [];

  let balance = startingBalance;
  let regime = 0; // slow-moving edge drift → realistic streaks & drawdowns
  let tradeSeq = 0;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - i);
    const dow = day.getUTCDay();
    const isWeekend = dow === 0 || dow === 6;
    const isToday = i === 0;

    // Edge drifts slowly between roughly 46% and 66% win probability.
    regime = Math.max(-0.09, Math.min(0.11, regime + (rand() - 0.5) * 0.02));
    const winProb = 0.55 + regime;

    let tradeCount = 0;
    if (isWeekend) {
      tradeCount = rand() < 0.35 ? 1 + Math.floor(rand() * 2) : 0;
    } else {
      tradeCount = rand() < 0.08 ? 0 : 2 + Math.floor(rand() * 6);
    }

    const dayStartBalance = balance;
    let dayPnl = 0;
    let dayFees = 0;
    let wins = 0;
    let losses = 0;

    for (let t = 0; t < tradeCount; t++) {
      const pool = isWeekend ? INSTRUMENTS.filter((x) => x.crypto) : INSTRUMENTS;
      const inst = pool[Math.floor(rand() * pool.length)];
      const side: TradeSide = rand() < 0.62 ? "buy" : "sell";

      // Risk 0.3%–0.8% of equity per trade; winners run ~0.8–2.6R.
      const risk = balance * (0.003 + rand() * 0.005);
      const won = rand() < winProb;
      const gross = won ? risk * (0.8 + rand() * 1.8) : -risk * (0.7 + rand() * 0.9);
      const fees = Number((1 + rand() * 4).toFixed(2));
      const pnl = Number((gross - fees).toFixed(2));

      const entry = inst.base * (1 + (rand() - 0.5) * inst.vol * 6);
      const notional = balance * (0.15 + rand() * 0.35);
      const rawQty = notional / entry;
      const quantity = Math.max(inst.lot, Math.round(rawQty / inst.lot) * inst.lot);
      const qtyRounded = Number(quantity.toFixed(4));
      const direction = side === "buy" ? 1 : -1;
      const exit = entry + (direction * (pnl + fees)) / qtyRounded;

      // Session window: roughly 13:30–20:00 UTC for equities, anytime for crypto.
      const openMinute = inst.crypto
        ? Math.floor(rand() * 1380)
        : 810 + Math.floor(rand() * 360);
      const openedAt = new Date(day);
      openedAt.setUTCMinutes(openMinute);
      const holdMinutes = 5 + Math.floor(rand() * 175);
      const closedAt = new Date(openedAt.getTime() + holdMinutes * 60_000);

      // A couple of today's trades stay open.
      const isOpen = isToday && t >= tradeCount - 2 && rand() < 0.7;

      tradeSeq += 1;
      trades.push({
        id: `demo-${seedKey.slice(0, 8)}-${tradeSeq}`,
        account_id: seedKey,
        symbol: inst.symbol,
        side,
        quantity: qtyRounded,
        entry_price: Number(entry.toFixed(entry >= 100 ? 2 : 4)),
        exit_price: isOpen ? null : Number(exit.toFixed(exit >= 100 ? 2 : 4)),
        pnl: isOpen ? null : pnl,
        return_pct: isOpen ? null : Number(((pnl / (entry * qtyRounded)) * 100).toFixed(2)),
        fees,
        status: isOpen ? "open" : "closed",
        opened_at: openedAt.toISOString(),
        closed_at: isOpen ? null : closedAt.toISOString(),
      });

      if (!isOpen) {
        dayPnl += pnl;
        dayFees += fees;
        if (pnl >= 0) wins += 1;
        else losses += 1;
      }
    }

    balance = Number((balance + dayPnl).toFixed(2));
    daily.push({
      date: toIsoDate(day),
      pnl: Number(dayPnl.toFixed(2)),
      return_pct: Number(((dayPnl / dayStartBalance) * 100).toFixed(3)),
      trades: wins + losses,
      wins,
      losses,
      balance,
      fees: Number(dayFees.toFixed(2)),
    });
  }

  // Newest first for tables; daily stays chronological for charts.
  trades.sort((a, b) => (a.opened_at < b.opened_at ? 1 : -1));

  return { daily, trades, startingBalance };
}

const cache = new Map<string, DemoSeries>();

export function getDemoSeries(accountId: string, mode: AccountMode): DemoSeries {
  const key = `${accountId}:${mode}:${new Date().toISOString().slice(0, 10)}`;
  let series = cache.get(key);
  if (!series) {
    series = generateSeries(accountId, mode);
    cache.set(key, series);
    if (cache.size > 50) {
      const first = cache.keys().next().value;
      if (first) cache.delete(first);
    }
  }
  return series;
}

/** Built-in account shown until the user connects a real platform. */
export function demoAccount(userId: string): ConnectedAccount {
  return {
    id: `demo-${userId}`,
    user_id: userId,
    platform: "alpaca",
    label: "Demo Account",
    account_ref: "DEMO-0001",
    mode: "paper",
    status: "connected",
    api_key_last4: null,
    last_synced_at: new Date(Date.now() - 4 * 60_000).toISOString(),
    created_at: new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString(),
    is_demo: true,
  };
}

export interface DemoNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  unread: boolean;
}

export function demoNotifications(): DemoNotification[] {
  const now = Date.now();
  return [
    {
      id: "n1",
      title: "Bot run completed",
      body: "Scanned 11 symbols, placed 3 orders, all filled.",
      at: new Date(now - 22 * 60_000).toISOString(),
      unread: true,
    },
    {
      id: "n2",
      title: "Daily summary ready",
      body: "Yesterday closed with 5 trades. View the daily breakdown.",
      at: new Date(now - 9 * 3_600_000).toISOString(),
      unread: true,
    },
    {
      id: "n3",
      title: "Master prompt updated",
      body: "A new version of the master prompt was published.",
      at: new Date(now - 2 * 86_400_000).toISOString(),
      unread: false,
    },
  ];
}
