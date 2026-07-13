import "server-only";

/** A single execution/fill as reported by a trading platform. */
export interface NormalizedFill {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number; // always positive
  price: number;
  fees: number;
  /** ISO timestamp */
  executed_at: string;
}

export interface ProviderCredentials {
  apiKey: string;
  apiSecret: string;
  accountRef: string | null;
  mode: "paper" | "live";
}

export interface ProviderSnapshot {
  fills: NormalizedFill[];
  /** Current total account equity in USD. */
  equity: number;
}

/**
 * A platform adapter. Implementing this interface (and registering it in
 * engine.ts) is all it takes to add a new integration.
 */
export interface ProviderAdapter {
  id: string;
  /** Fetch fills (oldest allowed window is fine) and current equity. */
  fetch(creds: ProviderCredentials): Promise<ProviderSnapshot>;
}

export class SyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncError";
  }
}
