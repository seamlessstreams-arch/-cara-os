import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { buildOrgRiskDashboard } from "@/lib/org-risk/org-risk-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/org-risk
 *
 * Burnout & Organisational Risk dashboard — a pure projection over existing
 * workforce and safeguarding data (staffing mix, sickness, supervision, training,
 * incidents, missing, complaints). Scores risk, surfaces correlations and trends
 * them over six months. Reads only; never writes; supportive, not blaming.
 * Deterministic — works with no AI key.
 */
export async function GET() {
  try {
    const [complaintsList, incidentsList, leaveRequestsList, missingEpisodesList, staffList, supervisionsList, trainingRecordsList] = await Promise.all([
      dal.complaints.findAll(),
      dal.incidents.findAll(),
      dal.leaveRequests.findAll(),
      dal.missingEpisodes.findAll(),
      dal.staff.findAll(),
      dal.supervisions.findAll(),
      dal.trainingRecords.findAll(),
    ]);
    const dashboard = buildOrgRiskDashboard({
      now: new Date().toISOString(),
      staff: staffList ?? [],
      supervisions: supervisionsList ?? [],
      trainingRecords: trainingRecordsList ?? [],
      incidents: incidentsList ?? [],
      missing: missingEpisodesList ?? [],
      complaints: (complaintsList ?? []) as { date?: string; created_at?: string }[],
      leave: leaveRequestsList ?? [],
    });
    return NextResponse.json({ data: dashboard });
  } catch (error: unknown) {
    console.error("[api] unhandled route error:", error);
    const message = "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
