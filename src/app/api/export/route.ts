import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import {
  buildReportData,
  getExportTargets,
  type Includes,
} from "@/lib/pdf/report-data";
import { renderReport } from "@/lib/pdf/render";
import { FISCAL_YEAR } from "@/lib/types";

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-") || "report";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const year = parseInt(url.searchParams.get("year") ?? "", 10) || FISCAL_YEAR;
  const who = url.searchParams.get("who") === "team" ? "team" : "me";
  const inc = url.searchParams.get("inc") ?? "leave,holiday,proof";
  const includes: Includes = {
    leaveHistory: inc.includes("leave"),
    holidayWork: inc.includes("holiday"),
    proofImages: inc.includes("proof"),
  };

  const targets = await getExportTargets(supabase, who);
  if (targets.length === 0) {
    // team requested by a non-privileged user, or nothing to export
    return new Response("Forbidden", { status: 403 });
  }

  try {
    if (who === "me") {
      const data = await buildReportData(
        supabase,
        targets[0].userId,
        year,
        includes,
      );
      const buffer = await renderReport(data);
      const filename = `tally_${slug(targets[0].name)}_${year}.pdf`;
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Whole team → zip of per-person PDFs
    const zip = new JSZip();
    for (const t of targets) {
      const data = await buildReportData(supabase, t.userId, year, includes);
      const buffer = await renderReport(data);
      zip.file(`tally_${slug(t.name)}_${year}.pdf`, buffer);
    }
    const zipBuf = await zip.generateAsync({ type: "arraybuffer" });
    return new Response(zipBuf, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="tally_team_${year}.zip"`,
      },
    });
  } catch (err) {
    return new Response(
      `Export failed: ${err instanceof Error ? err.message : "unknown error"}`,
      { status: 500 },
    );
  }
}
