// ══════════════════════════════════════════════════════════════════════════════
// CARA — ORGANISATIONAL LEARNING LEADERSHIP PACK EXPORT API (§31)
// GET ?period=quarter|month&format=html|docx|json
//
// Renders the organisational-learning synthesis as a pack a leadership team
// (or Reg 45 review) can take away. Deterministic; carries the engine's
// disclaimer and the "not enough data" honesty verbatim. HTML renders inline
// for print / save-as-PDF; docx/json download as attachments.
//
// getStore() is allowlisted here for the same structural reason as the sibling
// org-learning-report route: buildOrgLearningInputFromStore is typed to the
// full Store (the documented compose boundary).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { dal } from "@/lib/db";
import { buildOrgLearningReport } from "@/lib/org-learning-report/report-engine";
import { buildOrgLearningInputFromStore } from "@/lib/org-learning-report/build-input";
import type { ReportPeriod } from "@/lib/org-learning-report/types";
import {
  buildOrgLearningExportModel,
  renderOrgLearningHtml,
  renderOrgLearningJson,
} from "@/lib/org-learning-report/org-learning-export";
import { renderOrgLearningDocx } from "@/lib/org-learning-report/org-learning-docx";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const { searchParams } = new URL(req.url);
    const period: ReportPeriod = searchParams.get("period") === "month" ? "month" : "quarter";
    const format = (searchParams.get("format") || "html").toLowerCase();
    const asOf = todayStr();

    const input = buildOrgLearningInputFromStore(getStore(), asOf, period);
    const report = buildOrgLearningReport(input);

    const home = await dal.home.get();
    const homeName = (home as { name?: string } | null)?.name || "The home";
    const model = buildOrgLearningExportModel(report, { homeName });
    const base = `org-learning-${period}-${asOf}`;

    if (format === "json") {
      return new NextResponse(renderOrgLearningJson(model), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${base}.json"`,
        },
      });
    }
    if (format === "docx") {
      const buf = await renderOrgLearningDocx(model);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${base}.docx"`,
        },
      });
    }
    // Default: HTML (renders inline for print / save-as-PDF).
    return new NextResponse(renderOrgLearningHtml(model), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: unknown) {
    console.error("[api] org-learning-report export error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
