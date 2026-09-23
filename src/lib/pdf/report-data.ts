import "server-only";
import { createClient } from "@/lib/supabase/server";
import { deriveBalances } from "@/lib/ledger/balances";
import { fmt } from "@/lib/ledger/view";
import type { Entry } from "@/lib/ledger/types";
import { isPending } from "@/lib/ledger/types";

export type Includes = {
  leaveHistory: boolean;
  holidayWork: boolean;
  proofImages: boolean;
};

export const DEFAULT_INCLUDES: Includes = {
  leaveHistory: true,
  holidayWork: true,
  proofImages: true,
};

export type ReportData = {
  employee: string;
  /** Line under the employee name (the design shows a department). */
  team: string;
  ref: string;
  year: number;
  period: string;
  summary: {
    vlUsed: number;
    vlTotal: number;
    slUsed: number;
    slTotal: number;
    ilEarned: number;
    otDays: number;
  };
  leaves: { date: string; title: string; note: string; days: string }[];
  holidayWork: {
    date: string;
    title: string;
    amt: string;
    proofText: string;
    proofMissing: boolean;
  }[];
  proofs: {
    page: string;
    file: string;
    date: string;
    title: string;
    url: string | null;
  }[];
  pageCount: number;
  proofCount: number;
};

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "XX";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export async function buildReportData(
  supabase: SupabaseServer,
  userId: string,
  year: number,
  includes: Includes,
): Promise<ReportData> {
  const [
    { data: profile },
    { data: ysRow },
    { data: rows },
    { data: hols },
    { data: mem },
  ] = await Promise.all([
      supabase.from("profiles").select("name,email").eq("id", userId).maybeSingle(),
      supabase
        .from("year_settings")
        .select("*")
        .eq("user_id", userId)
        .eq("year", year)
        .maybeSingle(),
      supabase
        .from("entries")
        .select("*, proof:proofs(id,file_path,file_name,size_bytes)")
        .eq("user_id", userId)
        .eq("year", year)
        .order("date_start", { ascending: true }),
      supabase.from("holidays").select("id,name").eq("year", year),
      supabase.from("memberships").select("teams(name)").eq("user_id", userId).maybeSingle(),
    ]);
  const teamRel = (mem?.teams ?? null) as { name: string } | { name: string }[] | null;
  const team = (Array.isArray(teamRel) ? teamRel[0]?.name : teamRel?.name) ?? "";

  const holidayName = new Map(
    ((hols as { id: string; name: string }[] | null) ?? []).map((h) => [
      h.id,
      h.name,
    ]),
  );

  const entries: Entry[] = ((rows as Record<string, unknown>[] | null) ?? []).map(
    (r) => {
      const arr = (r.proof as Entry["proof"][] | null) ?? [];
      return { ...(r as unknown as Omit<Entry, "proof">), proof: arr[0] ?? null };
    },
  );

  const ys = ysRow ?? { vl_credits: 15, sl_credits: 15, il_carryover: 0 };
  const b = deriveBalances(entries, ys);
  const employee = profile?.name ?? profile?.email ?? "Employee";
  const ref = `TLY-${year}-${initials(employee)}-001`;

  const titleOf = (e: Entry) =>
    e.kind === "holiday_work"
      ? (holidayName.get(e.holiday_id ?? "") ?? "Holiday work")
      : e.kind === "vl"
        ? "Vacation"
        : e.kind === "sl"
          ? "Sick"
          : e.kind === "il_spend"
            ? "In-Lieu spent"
            : "Unpaid";

  // "07-07" or "07-07–08" — the design's MM-DD list form, en-dash ranges.
  const dateLabel = (e: Entry) =>
    e.date_start.slice(5) +
    (e.date_end !== e.date_start ? "–" + e.date_end.slice(8) : "");

  const leaves = includes.leaveHistory
    ? entries
        .filter((e) => e.amount < 0)
        .map((e) => ({
          date: dateLabel(e),
          title: titleOf(e),
          note: e.note ?? "",
          days: fmt(Math.abs(e.amount)),
        }))
    : [];

  const holidayEntries = entries.filter(
    (e) => e.kind === "holiday_work",
  );

  // Page 1 is the report, page 2 the proof index, full-size proofs from page 3.
  const FIRST_PROOF_PAGE = 3;
  let proofPage = FIRST_PROOF_PAGE - 1;
  const holidayWork = includes.holidayWork
    ? holidayEntries.map((e) => {
        const pending = isPending(e);
        return {
          date: dateLabel(e),
          title: `${titleOf(e)} — ${e.portion === "half" ? "half day" : "full day"}`,
          amt: (e.credit_as === "ot" ? "OT +" : "IL +") + fmt(e.amount),
          proofText: pending ? "NO PROOF" : `P.${++proofPage}`,
          proofMissing: pending,
        };
      })
    : [];

  // Proof appendix
  const withProof = holidayEntries.filter((e) => e.proof && !isPending(e));
  const proofs: ReportData["proofs"] = [];
  if (includes.proofImages) {
    let page = FIRST_PROOF_PAGE - 1;
    for (const e of withProof) {
      const path = e.proof!.file_path;
      const { data: signed } = await supabase.storage
        .from("proofs")
        .createSignedUrl(path, 60 * 10);
      proofs.push({
        page: `P.${++page}`,
        file: e.proof!.file_name,
        date: dateLabel(e),
        title: titleOf(e).split(" ")[0],
        url: signed?.signedUrl ?? null,
      });
    }
  }

  const proofCount = proofs.length;
  const pageCount = proofCount > 0 ? FIRST_PROOF_PAGE - 1 + proofCount : 1;

  return {
    employee,
    team,
    ref,
    year,
    period: `${year}-01-01 → ${year}-12-31`,
    summary: {
      vlUsed: b.vlUsed,
      vlTotal: ys.vl_credits,
      slUsed: b.slUsed,
      slTotal: ys.sl_credits,
      ilEarned: b.ilEarned,
      otDays: b.otDays,
    },
    leaves,
    holidayWork,
    proofs,
    pageCount,
    proofCount,
  };
}

/** Resolve who to export: self, or all team members (privileged only). */
export async function getExportTargets(
  supabase: SupabaseServer,
  who: "me" | "team",
): Promise<{ userId: string; name: string }[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  if (who === "me") {
    const { data: p } = await supabase
      .from("profiles")
      .select("name,email")
      .eq("id", user.id)
      .maybeSingle();
    return [{ userId: user.id, name: p?.name ?? p?.email ?? "me" }];
  }

  // Team: privileged only. RLS on memberships returns teammates; entries RLS
  // then enforces that only privileged callers can actually read their data.
  const { data: priv } = await supabase.rpc("is_privileged");
  if (!priv) return [];

  const { data: members } = await supabase
    .from("memberships")
    .select("user_id, profiles(name,email)");
  return ((members as
    | { user_id: string; profiles: { name: string | null; email: string } | { name: string | null; email: string }[] | null }[]
    | null) ?? []
  ).map((m) => {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return { userId: m.user_id, name: prof?.name ?? prof?.email ?? "member" };
  });
}
