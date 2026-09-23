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
