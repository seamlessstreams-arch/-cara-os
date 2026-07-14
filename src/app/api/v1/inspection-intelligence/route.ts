import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildInspectionReadiness } from "@/lib/inspection-intelligence/inspection-intelligence-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/inspection-intelligence
 *
 * Inspection Intelligence Mode — a pure projection mapping the home's existing
 * records to Ofsted's three SCCIF judgement areas, inventorying the EVIDENCE the
 * home can show an inspector and the GAPS an inspector would probe, with an
 * evidence-strength signal per area. Reads only; never writes; never predicts an
 * Ofsted grade. Deterministic — works with no AI key.
 */
export async function GET(_req: NextRequest) {
  try {
    const store = getStore();

    const children = (store.youngPeople ?? [])
      .filter((yp) => yp.status === "current")
      .map((yp) => ({
        id: yp.id,
        name: yp.preferred_name || yp.first_name || "Child",
      }));

    const readiness = buildInspectionReadiness({
      now: new Date().toISOString(),
      children,
      incidents: store.incidents ?? [],
      debriefRecords: store.debriefRecords ?? [],
      missingEpisodes: store.missingEpisodes ?? [],
      returnInterviews: store.returnInterviews ?? [],
      keyWorkingSessions: store.keyWorkingSessions ?? [],
      lacReviews: store.lacReviews ?? [],
      positiveAchievements: store.positiveAchievements ?? [],
      educationRecords: store.educationRecords ?? [],
      riskAssessments: store.riskAssessments ?? [],
      welfareChecks: store.welfareChecks ?? [],
      carePlans: store.carePlans ?? [],
      supervisions: store.supervisions ?? [],
      trainingRecords: store.trainingRecords ?? [],
    });

    return NextResponse.json({
      data: readiness,
      meta: {
        generatedAt: readiness.generatedAt,
        areasStrong: readiness.areasStrong,
        priorityCount: readiness.priorities.length,
        engine: "inspection-intelligence",
        version: "1.0.0",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
