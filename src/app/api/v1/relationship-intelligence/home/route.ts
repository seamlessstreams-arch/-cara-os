import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { buildHomeRelationshipOverview } from "@/lib/relationship-intelligence/home-overview";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/relationship-intelligence/home
 *
 * Home-level relationship overview — every child's relational + emotional-safety
 * status, ranked by who needs us most. A pure projection that runs both
 * deterministic engines per child. Reads only; never writes; no LLM.
 */
export async function GET(_req: NextRequest) {
  try {
    const [behaviourLogList, childPaceProfilesList, debriefRecordsList, educationRecordsList, familyTimeSessionsList, incidentsList, keyWorkingSessionsList, lacReviewsList, missingEpisodesList, positiveAchievementsList, returnInterviewsList, youngPeopleList] = await Promise.all([
      dal.behaviourLog.findAll(),
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
      dal.youngPeople.findAll(),
    ]);
    const paceByChild = new Map(
      (childPaceProfilesList ?? []).map((p) => [p.childId, p]),
    );

    const children = (youngPeopleList ?? []).map((yp) => {
      const pace = paceByChild.get(yp.id);
      return {
        childId: yp.id,
        childName: getYPName(yp.id),
        trustedAdults: pace?.trustedAdults ?? [],
        knownTriggers: pace?.knownTriggers ?? [],
        calmingApproaches: pace?.calmingApproaches ?? [],
      };
    });

    const overview = buildHomeRelationshipOverview({
      children,
      now: new Date().toISOString(),
      staffName: getStaffName,
      keyWorkingSessions: keyWorkingSessionsList ?? [],
      debriefRecords: debriefRecordsList ?? [],
      incidents: incidentsList ?? [],
      familyTimeSessions: familyTimeSessionsList ?? [],
      missingEpisodes: missingEpisodesList ?? [],
      returnInterviews: returnInterviewsList ?? [],
      positiveAchievements: positiveAchievementsList ?? [],
      educationRecords: educationRecordsList ?? [],
      lacReviews: lacReviewsList ?? [],
      behaviourLog: behaviourLogList ?? [],
    });

    return NextResponse.json({
      data: overview,
      meta: { generatedAt: overview.generatedAt, childCount: overview.children.length, engine: "relationship-intelligence-home", version: "1.0.0" },
    });
  } catch (error: unknown) {
    console.error("[api] unhandled route error:", error);
    const message = "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
