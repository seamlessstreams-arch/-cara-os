// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSPECTION EVIDENCE EXPORT API (§23)
// GET ?format=html|docx|json&area=experiences_progress|protection|leadership|all
//
// Reuses the Inspection Intelligence projection, then renders a per-area (or
// whole) evidence pack an inspector can read. Deterministic; never predicts a
// grade. HTML renders inline; docx/json download as attachments.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { buildInspectionReadiness } from "@/lib/inspection-intelligence/inspection-intelligence-engine";
import {
  buildInspectionExportModel,
  renderInspectionHtml,
  renderInspectionJson,
  type ExportScope,
} from "@/lib/inspection-intelligence/inspection-export";
import { renderInspectionDocx } from "@/lib/inspection-intelligence/inspection-docx";

export const dynamic = "force-dynamic";

const VALID_SCOPES: ExportScope[] = ["all", "experiences_progress", "protection", "leadership"];

export async function GET(req: NextRequest) {
  try {
    const [
      home,
      youngPeopleList,
      incidentsList,
      debriefRecordsList,
      missingEpisodesList,
      returnInterviewsList,
      keyWorkingSessionsList,
      lacReviewsList,
      positiveAchievementsList,
      educationRecordsList,
      riskAssessmentsList,
      welfareChecksList,
      carePlansList,
      supervisionsList,
      trainingRecordsList,
    ] = await Promise.all([
      dal.home.get(),
      dal.youngPeople.findAll(),
      dal.incidents.findAll(),
      dal.debriefRecords.findAll(),
      dal.missingEpisodes.findAll(),
      dal.returnInterviews.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.lacReviews.findAll(),
      dal.positiveAchievements.findAll(),
      dal.educationRecords.findAll(),
      dal.riskAssessments.findAll(),
      dal.welfareChecks.findAll(),
      dal.carePlans.findAll(),
      dal.supervisions.findAll(),
      dal.trainingRecords.findAll(),
    ]);
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "html").toLowerCase();
    const scopeParam = (searchParams.get("area") || "all") as ExportScope;
    const scope: ExportScope = VALID_SCOPES.includes(scopeParam) ? scopeParam : "all";

    const children = (youngPeopleList ?? [])
      .filter((yp: any) => yp.status === "current")
      .map((yp: any) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Child" }));

    const readiness = buildInspectionReadiness({
      now: new Date().toISOString(),
      children,
      incidents: incidentsList ?? [],
      debriefRecords: debriefRecordsList ?? [],
      missingEpisodes: missingEpisodesList ?? [],
      returnInterviews: returnInterviewsList ?? [],
      keyWorkingSessions: keyWorkingSessionsList ?? [],
      lacReviews: lacReviewsList ?? [],
      positiveAchievements: positiveAchievementsList ?? [],
      educationRecords: educationRecordsList ?? [],
      riskAssessments: riskAssessmentsList ?? [],
      welfareChecks: welfareChecksList ?? [],
      carePlans: carePlansList ?? [],
      supervisions: supervisionsList ?? [],
      trainingRecords: trainingRecordsList ?? [],
    });

    const homeName = (home as { name?: string } | null)?.name || "The home";
    const model = buildInspectionExportModel(readiness, { homeName, scope });
    const base = `inspection-evidence-${scope}-${new Date().toISOString().slice(0, 10)}`;

    if (format === "json") {
      return new NextResponse(renderInspectionJson(model), {
        headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${base}.json"` },
      });
    }
    if (format === "docx") {
      const buf = await renderInspectionDocx(model);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${base}.docx"`,
        },
      });
    }
    // Default: HTML (renders inline for print / save-as-PDF).
    return new NextResponse(renderInspectionHtml(model), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
