import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { buildSopRealityCheck } from "@/lib/sop-reality-check/sop-reality-check-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/sop-reality-check
 *
 * Statement of Purpose Reality Check — can the home prove it lives its Statement
 * of Purpose every day? A pure projection across existing records, organised into
 * the seven SOP assurance areas, with evidence, gaps and an inspection-risk report.
 * Reads only; never writes. Deterministic — works with no AI key.
 */
export async function GET() {
  try {
    const [youngPeopleList, carePlansList, dailyLogList, keyWorkingSessionsList, incidentsList, debriefRecordsList, riskAssessmentsList, lacReviewsList, positiveAchievementsList, educationRecordsList, trainingRecordsList, supervisionsList, auditsList] = await Promise.all([
      dal.youngPeople.findAll(),
      dal.carePlans.findAll(),
      dal.dailyLog.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.incidents.findAll(),
      dal.debriefRecords.findAll(),
      dal.riskAssessments.findAll(),
      dal.lacReviews.findAll(),
      dal.positiveAchievements.findAll(),
      dal.educationRecords.findAll(),
      dal.trainingRecords.findAll(),
      dal.supervisions.findAll(),
      dal.audits.findAll(),
    ]);
    const children = ((youngPeopleList ?? []) as any[])
      .filter((yp) => yp.status === "current")
      .map((yp) => ({
        id: yp.id as string,
        name: yp.preferred_name || yp.first_name || "Child",
      }));

    const data = buildSopRealityCheck({
      now: new Date().toISOString(),
      children,
      carePlans: (carePlansList ?? []) as any[],
      dailyLog: (dailyLogList ?? []) as { child_id: string; date?: string }[],
      keyWorkingSessions: keyWorkingSessionsList ?? [],
      incidents: incidentsList ?? [],
      debriefRecords: debriefRecordsList ?? [],
      riskAssessments: riskAssessmentsList ?? [],
      lacReviews: lacReviewsList ?? [],
      positiveAchievements: positiveAchievementsList ?? [],
      educationRecords: educationRecordsList ?? [],
      trainingRecords: trainingRecordsList ?? [],
      supervisions: supervisionsList ?? [],
      audits: (auditsList ?? []) as { id: string; created_at?: string; date?: string }[],
    });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
