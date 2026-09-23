import type { YearSettings } from "@/lib/types";
import { type Entry, isPending } from "./types";

export type Balances = {
  vlCredits: number;
  slCredits: number;
  ilCarryover: number;
  vlUsed: number;
  slUsed: number;
  ilEarned: number; // credited IL from holiday work (proof attached)
  ilPending: number; // IL awaiting proof (excluded from available)
  ilSpent: number;
  ilAvailable: number; // carry + earned − spent
  otDays: number; // credited OT day count
  otPending: number;
  vlLeft: number;
  slLeft: number;
  totalLeft: number; // VL left + SL left + IL available
};

/**
 * Derive all balances from the entries list — the single source of truth.
 * Balances are NEVER stored (DATA_MODEL invariant 1). Pending holiday-work
 * (no proof) is excluded from credited totals (invariant 2).
 */
export function deriveBalances(
  entries: Entry[],
  ys: Pick<YearSettings, "vl_credits" | "sl_credits" | "il_carryover">,
): Balances {
  let vlUsed = 0;
  let slUsed = 0;
  let ilSpent = 0;
  let ilEarned = 0;
  let ilPending = 0;
  let otDays = 0;
  let otPending = 0;

  for (const e of entries) {
    if (e.kind === "vl") vlUsed += -e.amount;
    else if (e.kind === "sl") slUsed += -e.amount;
    else if (e.kind === "il_spend") ilSpent += -e.amount;
    else if (e.kind === "holiday_work") {
      const pending = isPending(e);
      if (e.credit_as === "il") {
        if (pending) ilPending += e.amount;
        else ilEarned += e.amount;
      } else if (e.credit_as === "ot") {
        if (pending) otPending += 1;
        else otDays += 1;
      }
    }
    // "unpaid" affects no credit balance.
  }

  const ilAvailable = ys.il_carryover + ilEarned - ilSpent;
  const vlLeft = ys.vl_credits - vlUsed;
  const slLeft = ys.sl_credits - slUsed;

  return {
    vlCredits: ys.vl_credits,
    slCredits: ys.sl_credits,
    ilCarryover: ys.il_carryover,
    vlUsed,
    slUsed,
    ilEarned,
    ilPending,
    ilSpent,
    ilAvailable,
    otDays,
    otPending,
    vlLeft,
    slLeft,
    totalLeft: vlLeft + slLeft + ilAvailable,
  };
}

/** Available balance for a leave source, used to block over-spending. */
export function availableFor(
  kind: "vl" | "sl" | "il" | "unpaid",
  b: Balances,
): number {
  if (kind === "vl") return b.vlLeft;
  if (kind === "sl") return b.slLeft;
  if (kind === "il") return b.ilAvailable;
  return Infinity; // unpaid is unlimited
}
