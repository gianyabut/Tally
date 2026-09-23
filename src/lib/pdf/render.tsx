import { renderToBuffer } from "@react-pdf/renderer";
import { Report } from "./Report";
import type { ReportData } from "./report-data";

export function renderReport(data: ReportData): Promise<Buffer> {
  return renderToBuffer(<Report data={data} />);
}
