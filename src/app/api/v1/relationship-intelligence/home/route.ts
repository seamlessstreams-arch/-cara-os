import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
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
    const store = getStore();
    const paceByChild = new Map(
      (store.childPaceProfiles ?? []).map((p) => [p.childId, p]),
    );

    const children = (store.youngPeople ?? []).map((yp) => {
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
      keyWorkingSessions: store.keyWorkingSessions ?? [],
      debriefRecords: store.debriefRecords ?? [],
      incidents: store.incidents ?? [],
      familyTimeSessions: store.familyTimeSessions ?? [],
      missingEpisodes: store.missingEpisodes ?? [],
      returnInterviews: store.returnInterviews ?? [],
      positiveAchievements: store.positiveAchievements ?? [],
      educationRecords: store.educationRecords ?? [],
      lacReviews: store.lacReviews ?? [],
      behaviourLog: store.behaviourLog ?? [],
    });

    return NextResponse.json({
      data: overview,
      meta: { generatedAt: overview.generatedAt, childCount: overview.children.length, engine: "relationship-intelligence-home", version: "1.0.0" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
