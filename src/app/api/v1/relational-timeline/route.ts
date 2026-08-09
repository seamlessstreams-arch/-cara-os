import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
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

    const [childPaceProfilesList, debriefRecordsList, educationRecordsList, familyTimeSessionsList, incidentsList, keyWorkingSessionsList, lacReviewsList, missingEpisodesList, positiveAchievementsList, returnInterviewsList] = await Promise.all([
      dal.childPaceProfiles.findAll(),
      dal.debriefRecords.findAll(),
      dal.educationRecords.findAll(),
      dal.familyTimeSessions.findAll(),
      dal.incidents.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.lacReviews.findAll(),
      dal.missingEpisodes.findAll(),
      dal.positiveAchievements.findAll(),
      dal.returnInterviews.findAll(),
    ]);
    const pace = (childPaceProfilesList ?? []).find((p) => p.childId === childId);

    const timeline = buildRelationalTimeline({
      childId,
      childName: getYPName(childId),
      now: new Date().toISOString(),
      keyWorkingSessions: keyWorkingSessionsList ?? [],
      debriefRecords: debriefRecordsList ?? [],
      incidents: incidentsList ?? [],
      familyTimeSessions: familyTimeSessionsList ?? [],
      missingEpisodes: missingEpisodesList ?? [],
      returnInterviews: returnInterviewsList ?? [],
      positiveAchievements: positiveAchievementsList ?? [],
      educationRecords: educationRecordsList ?? [],
      lacReviews: lacReviewsList ?? [],
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
    console.error("[api] unhandled route error:", error);
    const message = "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
