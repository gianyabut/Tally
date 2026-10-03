import "server-only";
import { getAuth } from "@/lib/auth";
import type { YearSettings } from "@/lib/types";
import type { Ahead, Entry, Holiday } from "@/lib/ledger/types";
import { addDays, todayIso } from "@/lib/ledger/dates";

export async function getYearSettings(
  year: number,
): Promise<YearSettings | null> {
  const auth = await getAuth();
  if (!auth) return null;
  const { supabase, userId } = auth;

  const { data } = await supabase
    .from("year_settings")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .maybeSingle();

  return (data as YearSettings | null) ?? null;
}

export type NextHoliday = {
  holiday: Holiday;
  daysUntil: number;
} | null;

export type LedgerData = {
  yearSettings: YearSettings | null;
  entries: Entry[];
  holidays: Holiday[];
  nextHoliday: NextHoliday;
  ahead: Ahead;
};

/** Length of the ledger's look-ahead ruler, in days. */
const AHEAD_DAYS = 90;
const LEAVE_KINDS = ["vl", "sl", "il_spend", "unpaid"];


type ProofRow = {
  id: string;
  file_path: string;
  file_name: string;
  size_bytes: number;
};

export async function getLedgerData(year: number): Promise<LedgerData> {
  const today = todayIso();
  const aheadTo = addDays(today, AHEAD_DAYS - 1);
  const auth = await getAuth();
  if (!auth) {
    return {
      yearSettings: null,
      entries: [],
      holidays: [],
      nextHoliday: null,
      ahead: { from: today, days: AHEAD_DAYS, holidays: [], leaves: [] },
    };
  }
  const { supabase, userId } = auth;

  // The ruler's window crosses New Year in Q4, so its holidays and leaves are
  // queried by date, not by `year`.
  const [ysRes, entryRes, holRes, aheadHolRes, aheadLeaveRes] = await Promise.all([
    supabase
      .from("year_settings")
      .select("*")
      .eq("user_id", userId)
      .eq("year", year)
      .maybeSingle(),
    supabase
      .from("entries")
      .select(
        "*, proof:proofs(id,file_path,file_name,size_bytes)",
      )
      .eq("user_id", userId)
      .eq("year", year)
      .order("date_start", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("holidays")
      .select("*")
      .eq("year", year)
      .order("date", { ascending: true }),
    supabase
      .from("holidays")
      .select("*")
      .gte("date", today)
      .lte("date", aheadTo)
      .order("date", { ascending: true }),
    supabase
      .from("entries")
      .select("id,date_start,date_end,kind")
      .eq("user_id", userId)
      .in("kind", LEAVE_KINDS)
      .lte("date_start", aheadTo)
      .gte("date_end", today)
      .order("date_start", { ascending: true }),
  ]);

  const entries: Entry[] = (entryRes.data ?? []).map(
    (row: Record<string, unknown>) => {
      const proofArr = (row.proof as ProofRow[] | null) ?? [];
      const proof = proofArr.length > 0 ? proofArr[0] : null;
      return { ...(row as unknown as Omit<Entry, "proof">), proof };
    },
  );

  const holidays = (holRes.data as Holiday[] | null) ?? [];

  // Next holiday relative to today.
  let nextHoliday: NextHoliday = null;
  const upcoming = holidays.find((h) => h.date >= today);
  if (upcoming) {
    const diffMs =
      new Date(upcoming.date + "T00:00:00Z").getTime() -
      new Date(today + "T00:00:00Z").getTime();
    nextHoliday = {
      holiday: upcoming,
      daysUntil: Math.round(diffMs / 86400000),
    };
  }

  return {
    yearSettings: (ysRes.data as YearSettings | null) ?? null,
    entries,
    holidays,
    nextHoliday,
    ahead: {
      from: today,
      days: AHEAD_DAYS,
      holidays: (aheadHolRes.data as Holiday[] | null) ?? [],
      leaves: (aheadLeaveRes.data as Ahead["leaves"] | null) ?? [],
    },
  };
}
