import "server-only";

import type { NormalizedFill } from "@/lib/sync/types";

export interface RoundTrip {
  symbol: string;
  side: "buy" | "sell"; // direction of the opening leg (sell = short)
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  fees: number;
  pnl: number | null; // net of fees; null while open
  return_pct: number | null;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
}

interface Lot {
  quantity: number;
  price: number;
  feePerUnit: number;
  time: string;
}

/**
 * Pairs raw fills into round-trip trades with FIFO lot matching.
 * Handles longs and shorts: an opening fill adds a lot; an opposite-side
 * fill consumes lots oldest-first, emitting one closed trade per lot
 * consumed. Whatever remains unconsumed is an open trade.
 */
export function pairFills(fills: NormalizedFill[]): RoundTrip[] {
  const sorted = [...fills].sort((a, b) => a.executed_at.localeCompare(b.executed_at));
  const longs = new Map<string, Lot[]>();
  const shorts = new Map<string, Lot[]>();
  const trips: RoundTrip[] = [];
  const EPS = 1e-9;

  for (const fill of sorted) {
    const feePerUnit = fill.quantity > 0 ? fill.fees / fill.quantity : 0;
    let remaining = fill.quantity;

    // A buy first covers shorts; a sell first closes longs.
    const closing = fill.side === "buy" ? shorts : longs;
    const opening = fill.side === "buy" ? longs : shorts;
    const queue = closing.get(fill.symbol) ?? [];

    while (remaining > EPS && queue.length > 0) {
      const lot = queue[0];
      const consumed = Math.min(lot.quantity, remaining);
      const direction = fill.side === "buy" ? -1 : 1; // closing shorts: entry was a sell
      const entry = lot.price;
      const exit = fill.price;
      const fees = Number((consumed * (lot.feePerUnit + feePerUnit)).toFixed(4));
      const gross = (exit - entry) * consumed * direction;
      const pnl = Number((gross - fees).toFixed(2));

      trips.push({
        symbol: fill.symbol,
        side: fill.side === "buy" ? "sell" : "buy",
        quantity: Number(consumed.toFixed(6)),
        entry_price: entry,
        exit_price: exit,
        fees,
        pnl,
        return_pct: entry > 0 ? Number(((pnl / (entry * consumed)) * 100).toFixed(2)) : null,
        status: "closed",
        opened_at: lot.time,
        closed_at: fill.executed_at,
      });

      lot.quantity -= consumed;
      remaining -= consumed;
      if (lot.quantity <= EPS) queue.shift();
    }
    if (queue.length === 0) closing.delete(fill.symbol);
    else closing.set(fill.symbol, queue);

    if (remaining > EPS) {
      const lots = opening.get(fill.symbol) ?? [];
      lots.push({
        quantity: remaining,
        price: fill.price,
        feePerUnit,
        time: fill.executed_at,
      });
      opening.set(fill.symbol, lots);
    }
  }

  // Anything left in the books is an open position.
  for (const [book, side] of [
    [longs, "buy"],
    [shorts, "sell"],
  ] as const) {
    for (const [symbol, lots] of book) {
      for (const lot of lots) {
        trips.push({
          symbol,
          side,
          quantity: Number(lot.quantity.toFixed(6)),
          entry_price: lot.price,
          exit_price: null,
          fees: Number((lot.quantity * lot.feePerUnit).toFixed(4)),
          pnl: null,
          return_pct: null,
          status: "open",
          opened_at: lot.time,
          closed_at: null,
        });
      }
    }
  }

  return trips;
}
