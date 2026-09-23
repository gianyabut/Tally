export type EntryKind = "vl" | "sl" | "il_spend" | "unpaid" | "holiday_work";
export type Portion = "full" | "half";
export type CreditAs = "il" | "ot";
export type HolidayType = "regular" | "special";

export type ProofRef = {
  id: string;
  file_path: string;
  file_name: string;
  size_bytes: number;
};

export type Entry = {
  id: string;
  user_id: string;
  date_start: string; // ISO yyyy-mm-dd
  date_end: string;
  year: number;
  kind: EntryKind;
  portion: Portion | null;
  credit_as: CreditAs | null;
  amount: number; // signed
  note: string | null;
  holiday_id: string | null;
  created_at: string;
  /** Joined: the single proof for this entry, if any. */
  proof: ProofRef | null;
};

export type Holiday = {
  id: string;
  date: string;
  name: string;
  type: HolidayType;
  year: number;
  country: string;
};

/** A holiday_work entry only counts toward balances once it has a proof. */
export function isPending(e: Entry): boolean {
  return e.kind === "holiday_work" && !e.proof;
}
