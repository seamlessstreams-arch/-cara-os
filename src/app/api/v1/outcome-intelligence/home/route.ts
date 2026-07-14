import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildHomeOutcomeOverview } from "@/lib/outcome-intelligence/home-outcome-overview";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/outcome-intelligence/home?window_days=<n>
 *
 * The whole-home / manager view of Outcome Intelligence: runs the per-child
 * Outcome Intelligence Engine across every current child, ranks them by who
 * needs focus, and builds a home-wide domain heatmap. Pure projection over
 * existing records; never writes. Deterministic — works with no AI key.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const windowParam = searchParams.get("window_days") ?? searchParams.get("windowDays");
    const windowDays = windowParam ? Number(windowParam) : undefined;

    const store = getStore();
    const paceByChild = new Map(
      (store.childPaceProfiles ?? []).map((p) => [p.childId, p.trustedAdults ?? []]),
    );

    const children = (store.youngPeople ?? [])
      .filter((yp) => yp.status === "current")
      .map((yp) => ({
        id: yp.id,
        name: yp.preferred_name || yp.first_name || "Child",
        trustedAdults: paceByChild.get(yp.id) ?? [],
      }));

    const overview = buildHomeOutcomeOverview({
      now: new Date().toISOString(),
      windowDays: windowDays && !Number.isNaN(windowDays) ? windowDays : undefined,
      children,
      keyWorkingSessions: store.keyWorkingSessions ?? [],
      incidents: store.incidents ?? [],
      missingEpisodes: store.missingEpisodes ?? [],
      educationRecords: store.educationRecords ?? [],
      positiveAchievements: store.positiveAchievements ?? [],
      familyTimeSessions: store.familyTimeSessions ?? [],
      returnInterviews: store.returnInterviews ?? [],
      lacReviews: store.lacReviews ?? [],
    });

    return NextResponse.json({
      data: overview,
      meta: {
        generatedAt: overview.generatedAt,
        windowDays: overview.windowDays,
        childCount: overview.childCount,
        engine: "home-outcome-overview",
        version: "1.0.0",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
