import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  buildReportData,
  DEFAULT_INCLUDES,
} from "@/lib/pdf/report-data";
import { FISCAL_YEAR } from "@/lib/types";
import { ExportView } from "./ExportView";

export default async function ExportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [data, privRes, countRes] = await Promise.all([
    buildReportData(supabase, user.id, FISCAL_YEAR, DEFAULT_INCLUDES),
    supabase.rpc("is_privileged"),
    supabase
      .from("memberships")
      .select("user_id", { count: "exact", head: true }),
  ]);

  const canTeam = privRes.data === true;
  const teamCount = countRes.count ?? 1;

  return <ExportView data={data} canTeam={canTeam} teamCount={teamCount} />;
}
