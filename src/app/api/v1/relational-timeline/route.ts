import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { buildRelationalTimeline } from "@/lib/relational-timeline/relational-timeline-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/relational-timeline?child_id=<id>
 *
 * Returns the child's Relational Timeline — a pure projection over existing
 * records (key-work, incidents, debriefs, family time, missing episodes, return
 * interviews, achievements) re-told through a relational lens, plus deterministic
 * Relationship Intelligence (trusted adults, connection patterns, repair vs
 * rupture, mood trajectory). Reads only; never writes.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id") ?? searchParams.get("childId");

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;

    if (!childId) {
      return NextResponse.json({ error: "child_id is required" }, { status: 400 });
    }

    const store = getStore();
    const pace = (store.childPaceProfiles ?? []).find((p) => p.childId === childId);

    const timeline = buildRelationalTimeline({
      childId,
      childName: getYPName(childId),
      now: new Date().toISOString(),
      keyWorkingSessions: store.keyWorkingSessions ?? [],
      debriefRecords: store.debriefRecords ?? [],
      incidents: store.incidents ?? [],
      familyTimeSessions: store.familyTimeSessions ?? [],
      missingEpisodes: store.missingEpisodes ?? [],
      returnInterviews: store.returnInterviews ?? [],
      positiveAchievements: store.positiveAchievements ?? [],
      educationRecords: store.educationRecords ?? [],
      lacReviews: store.lacReviews ?? [],
      trustedAdults: pace?.trustedAdults ?? [],
      staffName: getStaffName,
    });

    return NextResponse.json({
      data: timeline,
      meta: {
        generatedAt: timeline.generatedAt,
        momentCount: timeline.moments.length,
        engine: "relational-timeline",
        version: "1.0.0",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
