import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { getYPName } from "@/lib/seed-data";
import { buildOutcomeIntelligence } from "@/lib/outcome-intelligence/outcome-intelligence-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/outcome-intelligence?child_id=<id>&window_days=<n>
 *
 * Returns the child's Outcome Intelligence — a pure projection over existing
 * records (incidents, missing episodes, education, key-work mood, achievements,
 * family time, return interviews, LAC reviews) measuring whether life outcomes
 * are getting measurably better across Ofsted's SCCIF domains (safety, education,
 * wellbeing, relationships & belonging, voice & participation). Reads only;
 * never writes. Deterministic — works with no AI key.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id") ?? searchParams.get("childId");

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;
    const windowParam = searchParams.get("window_days") ?? searchParams.get("windowDays");
    const windowDays = windowParam ? Number(windowParam) : undefined;

    if (!childId) {
      return NextResponse.json({ error: "child_id is required" }, { status: 400 });
    }

    const store = getStore();
    const pace = (store.childPaceProfiles ?? []).find((p) => p.childId === childId);

    const outcome = buildOutcomeIntelligence({
      childId,
      childName: getYPName(childId),
      now: new Date().toISOString(),
      windowDays: windowDays && !Number.isNaN(windowDays) ? windowDays : undefined,
      keyWorkingSessions: store.keyWorkingSessions ?? [],
      incidents: store.incidents ?? [],
      missingEpisodes: store.missingEpisodes ?? [],
      educationRecords: store.educationRecords ?? [],
      positiveAchievements: store.positiveAchievements ?? [],
      familyTimeSessions: store.familyTimeSessions ?? [],
      returnInterviews: store.returnInterviews ?? [],
      lacReviews: store.lacReviews ?? [],
      trustedAdults: pace?.trustedAdults ?? [],
    });

    return NextResponse.json({
      data: outcome,
      meta: {
        generatedAt: outcome.generatedAt,
        windowDays: outcome.windowDays,
        overallTrajectory: outcome.overallTrajectory,
        engine: "outcome-intelligence",
        version: "1.0.0",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
