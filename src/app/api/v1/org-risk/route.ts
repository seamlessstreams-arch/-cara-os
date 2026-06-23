import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
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
    const store = getStore();
    const dashboard = buildOrgRiskDashboard({
      now: new Date().toISOString(),
      staff: store.staff ?? [],
      supervisions: store.supervisions ?? [],
      trainingRecords: store.trainingRecords ?? [],
      incidents: store.incidents ?? [],
      missing: store.missingEpisodes ?? [],
      complaints: (store.complaints ?? []) as { date?: string; created_at?: string }[],
      leave: store.leaveRequests ?? [],
    });
    return NextResponse.json({ data: dashboard });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
