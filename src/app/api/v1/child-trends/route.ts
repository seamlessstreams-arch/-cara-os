// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD TRENDS / "IS OUR INTERVENTION WORKING?" API ROUTE
// GET /api/v1/child-trends?childId=yp_alex
//
// Per-child direction of travel: the drill-down from Home Trends. Reuses the
// generic home-trends engine with the same six signals filtered to one child,
// plus a positive-behaviour metric (per-child the positive/concerning balance
// is the clearest "is this child settling?" signal).
//
// Pure read aggregation — no mutations, notifications, or external calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
import { computeHomeTrends, type TrendMetricInput } from "@/lib/engines/home-trends-engine";
import { todayStr } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const childId = url.searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
    const today = todayStr();

    const [behaviourLogList, incidentsList, missingEpisodesList, restraintsList, sanctionRewardsList, youngPeopleList] = await Promise.all([
      dal.behaviourLog.findAll(),
      dal.incidents.findAll(),
      dal.missingEpisodes.findAll(),
      dal.restraints.findAll(),
      dal.sanctionRewards.findAll(),
      dal.youngPeople.findAll(),
    ]);
    const youngPeople = ((youngPeopleList ?? []));
    const current = youngPeople.filter((c) => c.status === "current");
    const nameOf = (c: any): string =>
      c?.preferred_name || [c?.first_name, c?.last_name].filter(Boolean).join(" ") || c?.id || "";
    const list = (current.length ? current : youngPeople).map((c) => ({ id: c.id, name: nameOf(c) }));

    let trends = null;
    let childName: string | null = null;

    if (childId) {
      const child = youngPeople.find((c) => c.id === childId);
      childName = child ? nameOf(child) : childId;

      const dateOf = (r: any): string => (r?.date ?? r?.created_at ?? r?.reported_at ?? "").toString().slice(0, 10);
      const byChild = (arr: any[] | undefined, extra?: (r: any) => boolean): string[] =>
        (((arr ?? [])))
          .filter((r) => r.child_id === childId && (extra ? extra(r) : true))
          .map(dateOf)
          .filter(Boolean);

      const metrics: TrendMetricInput[] = [
        { key: "incidents", label: "Incidents", unit: "incidents", polarity: "lower_better", description: "Incidents involving this child.", dates: byChild((incidentsList)) },
        { key: "physical_interventions", label: "Physical interventions", unit: "interventions", polarity: "lower_better", description: "Restraints / holds used with this child — minimise over time.", dates: byChild((restraintsList)) },
        { key: "concerning_behaviour", label: "Concerning behaviour", unit: "incidents", polarity: "lower_better", description: "Behaviour-log entries recorded as concerning.", dates: byChild((behaviourLogList), (r) => r.direction === "concerning") },
        { key: "positive_behaviour", label: "Positive behaviour", unit: "entries", polarity: "higher_better", description: "Behaviour-log entries recorded as positive — is this child settling?", dates: byChild((behaviourLogList), (r) => r.direction === "positive") },
        { key: "sanctions", label: "Sanctions & consequences", unit: "sanctions", polarity: "lower_better", description: "Consequences applied to this child.", dates: byChild((sanctionRewardsList), (r) => r.direction === "sanction") },
        { key: "rewards", label: "Rewards & recognition", unit: "rewards", polarity: "higher_better", description: "Positive recognition recorded for this child.", dates: byChild((sanctionRewardsList), (r) => r.direction === "reward") },
        { key: "missing_episodes", label: "Missing-from-home episodes", unit: "episodes", polarity: "lower_better", description: "Episodes of this child being missing or away without agreement.", dates: byChild((missingEpisodesList)) },
      ];

      trends = computeHomeTrends({ today, metrics, weeks: 8 });
    }

    return NextResponse.json({ data: { children: list, childId, childName, trends } });
  } catch (err) {
    console.error("[api] server error:", err); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
