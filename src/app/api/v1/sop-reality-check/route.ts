import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
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
    const store = getStore();
    const children = ((store.youngPeople ?? []) as any[])
      .filter((yp) => yp.status === "current")
      .map((yp) => ({
        id: yp.id as string,
        name: yp.preferred_name || yp.first_name || "Child",
      }));

    const data = buildSopRealityCheck({
      now: new Date().toISOString(),
      children,
      carePlans: (store as any).carePlans ?? [],
      dailyLog: (store.dailyLog ?? []) as { child_id: string; date?: string }[],
      keyWorkingSessions: store.keyWorkingSessions ?? [],
      incidents: store.incidents ?? [],
      debriefRecords: store.debriefRecords ?? [],
      riskAssessments: store.riskAssessments ?? [],
      lacReviews: store.lacReviews ?? [],
      positiveAchievements: store.positiveAchievements ?? [],
      educationRecords: store.educationRecords ?? [],
      trainingRecords: store.trainingRecords ?? [],
      supervisions: store.supervisions ?? [],
      audits: (store.audits ?? []) as { id: string; created_at?: string; date?: string }[],
    });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
