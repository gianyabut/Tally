import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { YearSettings } from "@/lib/types";
import type { Entry, Holiday } from "@/lib/ledger/types";

export async function getYearSettings(
  year: number,
): Promise<YearSettings | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("year_settings")
    .select("*")
    .eq("user_id", user.id)
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
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

type ProofRow = {
  id: string;
  file_path: string;
  file_name: string;
  size_bytes: number;
};

export async function getLedgerData(year: number): Promise<LedgerData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      yearSettings: null,
      entries: [],
      holidays: [],
      nextHoliday: null,
    };
  }

  const [ysRes, entryRes, holRes] = await Promise.all([
    supabase
      .from("year_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("year", year)
      .maybeSingle(),
    supabase
      .from("entries")
      .select(
        "*, proof:proofs(id,file_path,file_name,size_bytes)",
      )
      .eq("user_id", user.id)
      .eq("year", year)
      .order("date_start", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("holidays")
      .select("*")
      .eq("year", year)
      .order("date", { ascending: true }),
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
  const today = iso(new Date());
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
  };
}
