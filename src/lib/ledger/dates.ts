const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const utc = (iso: string) => new Date(iso + "T00:00:00Z");
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Today's date in the Philippines (Tally is PH-only), as yyyy-mm-dd. */
export const todayIso = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());

export function addDays(dateIso: string, n: number): string {
  const d = utc(dateIso);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

/** "MON" — the design's detail-form weekday. */
export const weekday = (dateIso: string) => DOW[utc(dateIso).getUTCDay()];

/** "Oct 12" */
export const shortDate = (dateIso: string) =>
  `${MONTHS[utc(dateIso).getUTCMonth()]} ${utc(dateIso).getUTCDate()}`;

export function isWorkingDay(dateIso: string, holidays: ReadonlySet<string>): boolean {
  const dow = utc(dateIso).getUTCDay();
  return dow !== 0 && dow !== 6 && !holidays.has(dateIso);
}

export function nextWorkingDay(dateIso: string, holidays: ReadonlySet<string>): string {
  let d = dateIso;
  while (!isWorkingDay(d, holidays)) d = addDays(d, 1);
  return d;
}

/** Last calendar date of a leave covering `days` working days from `start`. */
export function leaveEnd(start: string, days: number, holidays: ReadonlySet<string>): string {
  let remaining = Math.max(1, Math.ceil(days));
  let d = start;
  let end = start;
  for (let guard = 0; remaining > 0 && guard < 366; guard++) {
    if (isWorkingDay(d, holidays)) {
      end = d;
      remaining -= 1;
    }
    if (remaining > 0) d = addDays(d, 1);
  }
  return end;
}

/** "Oct 12", "Oct 12–14" or "Oct 30–Nov 2". */
export function dateRange(start: string, end: string): string {
  if (start === end) return shortDate(start);
  if (start.slice(0, 7) === end.slice(0, 7)) return `${shortDate(start)}–${utc(end).getUTCDate()}`;
  return `${shortDate(start)}–${shortDate(end)}`;
}

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "October 2026" for a yyyy-mm month. */
export const monthTitle = (ym: string) => `${MONTHS_LONG[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;

/** "October 12" — a calendar day's accessible name. */
export const longDate = (dateIso: string) =>
  `${MONTHS_LONG[utc(dateIso).getUTCMonth()]} ${utc(dateIso).getUTCDate()}`;

/** The yyyy-mm month `n` months after `ym`. */
export function addMonths(ym: string, n: number): string {
  const d = utc(`${ym}-01`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return iso(d).slice(0, 7);
}

/** A Sunday-first month grid: leading blanks (null), then each day as yyyy-mm-dd. */
export function monthCells(ym: string): (string | null)[] {
  const first = `${ym}-01`;
  const cells: (string | null)[] = Array(utc(first).getUTCDay()).fill(null);
  for (let d = first; d.startsWith(ym); d = addDays(d, 1)) cells.push(d);
  return cells;
}

/** Working days from `start` to `end` inclusive (weekends + public holidays skipped). */
export function workingDaysBetween(start: string, end: string, holidays: ReadonlySet<string>): number {
  let n = 0;
  for (let d = start, guard = 0; d <= end && guard < 400; d = addDays(d, 1), guard++) {
    if (isWorkingDay(d, holidays)) n += 1;
  }
  return n;
}
