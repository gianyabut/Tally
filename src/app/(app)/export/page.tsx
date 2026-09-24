import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { buildReportData, DEFAULT_INCLUDES } from "@/lib/pdf/report-data";
import { FISCAL_YEAR } from "@/lib/types";
import { ExportView } from "./ExportView";

export default async function ExportPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  const { supabase, userId } = auth;

  const [data, privRes, countRes] = await Promise.all([
    buildReportData(supabase, userId, FISCAL_YEAR, DEFAULT_INCLUDES, false),
    supabase.rpc("is_privileged"),
    supabase.from("memberships").select("user_id", { count: "exact", head: true }),
  ]);

  return (
    <ExportView data={data} canTeam={privRes.data === true} teamCount={countRes.count ?? 1} />
  );
}
