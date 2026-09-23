import type { Balances } from "./balances";
import { type Entry, type Holiday, isPending } from "./types";

export const fmt = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1));

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

export type TallyRowView = {
  key: string;
  label: string;
  lit: number;
  dim: number;
  pending: number;
  litColor: string;
  val: string;
  sub: string;
  subColor: string;
};

export function buildTallyRows(b: Balances): TallyRowView[] {
  return [
    {
      key: "vl",
      label: "Vacation",
      lit: b.vlLeft,
      dim: b.vlUsed,
      pending: 0,
      litColor: "var(--ink)",
      val: fmt(b.vlLeft),
      sub: "/" + fmt(b.vlCredits),
      subColor: "var(--faint)",
    },
    {
      key: "sl",
      label: "Sick",
      lit: b.slLeft,
      dim: b.slUsed,
      pending: 0,
      litColor: "var(--ring2)",
      val: fmt(b.slLeft),
      sub: "/" + fmt(b.slCredits),
      subColor: "var(--faint)",
    },
    {
      key: "il",
      label: "In-Lieu",
      lit: b.ilAvailable,
      dim: 0,
      pending: b.ilPending,
      litColor: "var(--ink)",
      val: fmt(b.ilAvailable),
      sub: b.ilPending > 0 ? "+" + fmt(b.ilPending) + " pending" : "earned",
      subColor: b.ilPending > 0 ? "var(--sig)" : "var(--faint)",
    },
    {
      key: "ot",
      label: "OT paid",
      lit: b.otDays,
      dim: 0,
      pending: 0,
      litColor: "var(--faint)",
      val: String(b.otDays),
      sub: "days",
      subColor: "var(--faint)",
    },
  ];
}

export type TimelineItem = {
  id: string;
  mon: string;
  monColor: string;
  day: string;
  dateColor: string;
  title: string;
  pending: boolean;
  metaLine: string;
  hasProof: boolean;
  amtText: string;
  amtColor: string;
  nodeBg: string;
  nodeOutline: string;
  nodeRad: string;
  entry: Entry;
};

export type TimelineGroup = { mon: string; items: TimelineItem[] };

function titleFor(e: Entry, holidayName: string | undefined): string {
  if (e.kind === "holiday_work") return holidayName ?? "Holiday work";
  if (e.kind === "vl") return "Vacation";
  if (e.kind === "sl") return "Sick";
  if (e.kind === "il_spend") return "In-Lieu spent";
  return "Unpaid leave";
}

function amtText(e: Entry): string {
  const abs = fmt(Math.abs(e.amount));
  if (e.kind === "holiday_work")
    return (e.credit_as === "ot" ? "OT +" : "IL +") + abs;
  if (e.kind === "il_spend") return "IL −" + abs;
  if (e.kind === "unpaid") return "UNP −" + abs;
  return e.kind.toUpperCase() + " −" + abs; // VL / SL
}

/** Group entries by month (already sorted newest-first) into timeline rows. */
export function buildTimeline(
  entries: Entry[],
  holidays: Holiday[],
): TimelineGroup[] {
  const holidayName = new Map(holidays.map((h) => [h.id, h.name]));
  const groups: TimelineGroup[] = [];

  for (const e of entries) {
    const pos = e.amount > 0;
    const pending = isPending(e);
    const monIdx = parseInt(e.date_start.slice(5, 7), 10) - 1;
    const mon = MONTHS[monIdx] ?? "—";

    const sd = e.date_start.slice(8, 10);
    const ed = e.date_end.slice(8, 10);
    const day = e.date_start === e.date_end ? sd : `${sd}–${ed}`;

    const portionText =
      e.portion === "half" ? "WORKED HALF DAY" : "WORKED FULL DAY";
    const leafMeta = e.note
      ? e.note.toUpperCase()
      : `${fmt(Math.abs(e.amount))} DAY${Math.abs(e.amount) === 1 ? "" : "S"}`;
    const baseMeta = e.kind === "holiday_work" ? portionText : leafMeta;
    const metaLine = baseMeta + (e.proof ? ` · ⎘ ${e.proof.file_name}` : "");

    const item: TimelineItem = {
      id: e.id,
      mon,
      monColor: "var(--faint)",
      day,
      dateColor: pending ? "var(--sig)" : "var(--dim)",
      title: titleFor(e, holidayName.get(e.holiday_id ?? "")),
      pending,
      metaLine,
      hasProof: !!e.proof,
      amtText: amtText(e),
      amtColor: pending
        ? "var(--faint)"
        : pos
          ? e.credit_as === "ot"
            ? "var(--ink)"
            : "var(--mut)"
          : "var(--dim)",
      nodeBg: pending
        ? "var(--sig)"
        : pos
          ? e.credit_as === "ot"
            ? "var(--ink)"
            : "var(--ring2)"
          : "var(--bg)",
      nodeOutline: pending ? "var(--sig)" : "var(--faint)",
      nodeRad: pos || pending ? "0" : "50%",
      entry: e,
    };

    const last = groups[groups.length - 1];
    if (last && last.mon === mon) {
      item.monColor = pending ? "var(--sig)" : "var(--faint)";
      last.items.push(item);
    } else {
      item.monColor = pending ? "var(--sig)" : "var(--mut)";
      groups.push({ mon, items: [item] });
    }
  }
  return groups;
}
