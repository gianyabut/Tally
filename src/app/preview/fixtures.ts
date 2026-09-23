// Design-QA fixtures: the exact seed state of docs/Tally App.dc.html (Ara Reyes,
// her 9 entries, the Bluefin Studio roster), so /preview screens can be
// pixel-diffed against the prototype without data differences.
import { deriveBalances } from "@/lib/ledger/balances";
import type { Entry, Holiday } from "@/lib/ledger/types";
import type { NotificationItem, TeamMember } from "@/lib/data/team";
import type { ReportData } from "@/lib/pdf/report-data";
import type { AppData } from "@/app/(app)/runtime";

const Y = 2026;
const hol = (id: string, date: string, name: string, type: Holiday["type"] = "regular"): Holiday => ({
  id,
  date,
  name,
  type,
  year: Y,
  country: "PH",
});

export const holidays: Holiday[] = [
  hol("h0409", "2026-04-09", "Araw ng Kagitingan"),
  hol("h0501", "2026-05-01", "Labor Day"),
  hol("h0612", "2026-06-12", "Independence Day"),
  hol("h0821", "2026-08-21", "Ninoy Aquino Day", "special"),
  hol("h0831", "2026-08-31", "National Heroes Day"),
  hol("h1130", "2026-11-30", "Bonifacio Day"),
];

let seq = 0;
function entry(
  p: Partial<Entry> & Pick<Entry, "date_start" | "kind" | "amount">,
): Entry {
  seq += 1;
  return {
    id: `e${seq}`,
    user_id: "ara",
    date_end: p.date_end ?? p.date_start,
    year: Y,
    portion: null,
    credit_as: null,
    note: null,
    holiday_id: null,
    created_at: "2026-09-01T00:00:00Z",
    proof: null,
    ...p,
  };
}
const proof = (file: string, kb = 824) => ({
  id: `p-${file}`,
  file_path: `ara/${file}`,
  file_name: file,
  size_bytes: kb * 1024,
});

// Newest first, as the prototype lists them.
export const entries: Entry[] = [
  entry({ date_start: "2026-08-31", kind: "holiday_work", portion: "full", credit_as: "ot", amount: 1, holiday_id: "h0831", proof: proof("shift_0831.jpg") }),
  entry({ date_start: "2026-08-21", kind: "holiday_work", portion: "full", credit_as: "il", amount: 1, holiday_id: "h0821", proof: proof("ts_0821.png") }),
  entry({ date_start: "2026-07-07", date_end: "2026-07-08", kind: "vl", amount: -2, note: "Palawan · 2 days" }),
  entry({ date_start: "2026-06-12", kind: "holiday_work", portion: "half", credit_as: "il", amount: 0.5, holiday_id: "h0612" }),
  entry({ date_start: "2026-05-01", kind: "holiday_work", portion: "full", credit_as: "il", amount: 1, holiday_id: "h0501", proof: proof("dtr_0501.png") }),
  entry({ date_start: "2026-04-09", kind: "holiday_work", portion: "full", credit_as: "ot", amount: 1, holiday_id: "h0409", proof: proof("dtr_0409.png") }),
  entry({ date_start: "2026-04-01", date_end: "2026-04-02", kind: "sl", amount: -2, note: "flu · 2 days" }),
  entry({ date_start: "2026-02-13", kind: "vl", amount: -1.5, note: "long weekend · half day" }),
  entry({ date_start: "2026-01-20", kind: "sl", amount: -1, note: "migraine" }),
];

const yearSettings = {
  id: "ys",
  user_id: "ara",
  year: Y,
  vl_credits: 15,
  sl_credits: 15,
  il_carryover: 0,
};

export const notifications: NotificationItem[] = [
  {
    id: "n1",
    type: "team_invite",
    payload: { invite_id: "i1", team: "Bluefin Studio", from: "Jopay M.", token: "preview" },
    created_at: new Date().toISOString(),
  },
];

export const appData: AppData = {
  year: Y,
  yearSettings,
  entries,
  holidays,
  balances: deriveBalances(entries, yearSettings),
  nextHoliday: { holiday: holidays[5], daysUntil: 72 },
  role: "admin",
  teamName: "Bluefin Studio",
  notifications,
};

const m = (
  user_id: string,
  name: string,
  role: TeamMember["role"],
  vl: number,
  sl: number,
  il: number,
  ilEarned: number,
  ot: number,
  outType: string | null = null,
): TeamMember => ({
  user_id,
  name,
  role,
  is_self: user_id === "ara",
  out_today: outType !== null,
  out_type: outType,
  vl_left: vl,
  sl_left: sl,
  il_avail: il,
  il_earned: ilEarned,
  ot_days: ot,
});

export const members: TeamMember[] = [
  m("ara", "Ara Reyes", "admin", 11.5, 12, 2, 2, 2),
  m("jopay", "Jopay Mercado", "manager", 4, 10, 1, 1, 3, "VL"),
  m("kim", "Kim Tan", "hr", 11, 8, 0.5, 1, 0, "SL"),
  m("miguel", "Miguel Santos", "staff", 7.5, 15, 3, 3, 1),
  m("bea", "Bea Alonzo", "staff", 13, 14, 0, 0, 0),
  m("paolo", "Paolo Dizon", "staff", 2, 9, 4.5, 4, 2),
  m("cess", "Cess Villanueva", "staff", 8, 11, 1.5, 1, 1),
  m("ramon", "Ramon Cruz", "staff", 10.5, 13, 2, 0, 2),
  m("trish", "Trish Uy", "staff", 6, 7, 0, 0, 0),
  m("noel", "Noel Garcia", "staff", 12.5, 15, 1, 1, 0),
];

export const report: ReportData = {
  employee: "Ara Reyes",
  team: "Engineering",
  ref: "TLY-2026-AR-001",
  year: Y,
  period: "2026-01-01 → 2026-12-31",
  summary: { vlUsed: 3.5, vlTotal: 15, slUsed: 3, slTotal: 15, ilEarned: 2, otDays: 2 },
  leaves: [
    { date: "01-20", title: "Sick", note: "migraine", days: "1" },
    { date: "02-13", title: "Vacation", note: "long weekend · half day", days: "1.5" },
    { date: "04-01–02", title: "Sick", note: "flu · 2 days", days: "2" },
    { date: "07-07–08", title: "Vacation", note: "Palawan · 2 days", days: "2" },
  ],
  holidayWork: [
    { date: "04-09", title: "Araw ng Kagitingan — full day", amt: "OT +1", proofText: "P.3", proofMissing: false },
    { date: "05-01", title: "Labor Day — full day", amt: "IL +1", proofText: "P.4", proofMissing: false },
    { date: "06-12", title: "Independence Day — half day", amt: "IL +0.5", proofText: "NO PROOF", proofMissing: true },
    { date: "08-21", title: "Ninoy Aquino Day — full day", amt: "IL +1", proofText: "P.5", proofMissing: false },
    { date: "08-31", title: "National Heroes Day — full day", amt: "OT +1", proofText: "P.6", proofMissing: false },
  ],
  proofs: [
    { page: "P.3", file: "dtr_0409.png", date: "04-09", title: "Araw", url: null },
    { page: "P.4", file: "dtr_0501.png", date: "05-01", title: "Labor", url: null },
    { page: "P.5", file: "ts_0821.png", date: "08-21", title: "Ninoy", url: null },
    { page: "P.6", file: "shift_0831.jpg", date: "08-31", title: "National", url: null },
  ],
  pageCount: 6,
  proofCount: 4,
};

export const pendingInvite = {
  token: "preview",
  teamName: "Bluefin Studio",
  inviter: "Jopay Mercado",
  memberCount: 10,
};
