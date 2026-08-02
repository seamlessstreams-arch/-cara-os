import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db";
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
    const [carePlansList, debriefRecordsList, educationRecordsList, incidentsList, keyWorkingSessionsList, lacReviewsList, missingEpisodesList, positiveAchievementsList, returnInterviewsList, riskAssessmentsList, supervisionsList, trainingRecordsList, welfareChecksList, youngPeopleList] = await Promise.all([
      dal.carePlans.findAll(),
      dal.debriefRecords.findAll(),
      dal.educationRecords.findAll(),
      dal.incidents.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.lacReviews.findAll(),
      dal.missingEpisodes.findAll(),
      dal.positiveAchievements.findAll(),
      dal.returnInterviews.findAll(),
      dal.riskAssessments.findAll(),
      dal.supervisions.findAll(),
      dal.trainingRecords.findAll(),
      dal.welfareChecks.findAll(),
      dal.youngPeople.findAll(),
    ]);

    const children = (youngPeopleList ?? [])
      .filter((yp) => yp.status === "current")
      .map((yp) => ({
        id: yp.id,
        name: yp.preferred_name || yp.first_name || "Child",
      }));

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
