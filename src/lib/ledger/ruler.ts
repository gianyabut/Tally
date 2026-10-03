import { addDays, addMonths, daysBetween, isWorkingDay } from "./dates";
import type { Ahead, EntryKind, Holiday } from "./types";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const LEAVE_LABEL: Partial<Record<EntryKind, string>> = {
  vl: "VL",
  sl: "SL",
  il_spend: "IL",
  unpaid: "UNPAID",
};

export type RulerTick = {
  date: string;
  holiday: Holiday | null;
  /** "VL" / "SL" / "IL" / "UNPAID" when a filed leave covers this day. */
  leave: string | null;
  weekend: boolean;
  /** Month label drawn under this tick ("NOV"), if any. */
  month: string | null;
};

export type RulerView = {
  ticks: RulerTick[];
  holidayCount: number;
  leaveCount: number;
};

/**
 * One tick per day of the look-ahead window. Leaves mark only the working
 * days they cover, the same way a leave's length is counted when filed.
 */
export function buildRuler(ahead: Ahead): RulerView {
  const to = addDays(ahead.from, ahead.days - 1);
  const holidayByDate = new Map(ahead.holidays.map((h) => [h.date, h]));
  const holidaySet = new Set(holidayByDate.keys());

  const leaveByDate = new Map<string, string>();
  for (const l of ahead.leaves) {
    const label = LEAVE_LABEL[l.kind];
    if (!label) continue;
    const start = l.date_start > ahead.from ? l.date_start : ahead.from;
    const end = l.date_end < to ? l.date_end : to;
    for (let d = start; d <= end; d = addDays(d, 1)) {
      if (isWorkingDay(d, holidaySet)) leaveByDate.set(d, label);
    }
  }

  // Today's month is labelled under the first tick, unless the next month
  // starts within a week and the two labels would collide.
  const nextFirst = `${addMonths(ahead.from.slice(0, 7), 1)}-01`;
  const labelToday = daysBetween(ahead.from, nextFirst) >= 7;

  const ticks: RulerTick[] = [];
  for (let i = 0; i < ahead.days; i++) {
    const date = addDays(ahead.from, i);
    const dow = new Date(date + "T00:00:00Z").getUTCDay();
    const firstOfMonth = date.endsWith("-01");
    ticks.push({
      date,
      holiday: holidayByDate.get(date) ?? null,
      leave: leaveByDate.get(date) ?? null,
      weekend: dow === 0 || dow === 6,
      month:
        firstOfMonth || (i === 0 && labelToday)
          ? MONTHS[Number(date.slice(5, 7)) - 1]
          : null,
    });
  }

  return {
    ticks,
    holidayCount: ahead.holidays.length,
    leaveCount: ahead.leaves.filter((l) => LEAVE_LABEL[l.kind]).length,
  };
}
