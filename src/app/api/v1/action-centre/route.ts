import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { getYPName } from "@/lib/seed-data";
import { buildActionCentre, type AttentionInput } from "@/lib/action-centre/action-centre-engine";
import { buildRestrictionOverview } from "@/lib/rights-restriction/rights-restriction-engine";
import { buildReflectionOverview } from "@/lib/post-incident-reflection/post-incident-reflection-engine";
import { buildStayingSafePlanOverview } from "@/lib/staying-safe-plan/staying-safe-plan-engine";
import { buildRelationshipsOverview } from "@/lib/protective-relationships/protective-relationships-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/action-centre
 *
 * The unified Action Centre — real persisted actions (from post-incident
 * reflections) plus high-priority attention items projected from each practice
 * module (rights/restriction, reflection, staying-safe-plan, relationships),
 * brought into one place so nothing is lost. Pure read aggregation; never writes.
 * Deterministic — works with no AI key.
 */
export async function GET() {
  try {
    const store = getStore();
    const now = new Date().toISOString();
    const children = (store.youngPeople ?? [])
      .filter((yp) => yp.status === "current")
      .map((yp) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Child" }));

    const incidents = store.incidents ?? [];
    const reflections = store.postIncidentReflections ?? [];

    const restriction = buildRestrictionOverview({ now, reviews: store.restrictionReviews ?? [], children, incidents });
    const reflectionOv = buildReflectionOverview({ now, reflections, incidents, children });
    const safePlans = buildStayingSafePlanOverview({ now, plans: store.stayingSafePlans ?? [], children, reflections, incidents });
    const relationships = buildRelationshipsOverview({ now, entries: store.relationshipEntries ?? [], children, reflections, incidents, missing: store.missingEpisodes ?? [] });

    const attention: AttentionInput[] = [
      ...restriction.alerts.map((a) => ({ source: "Rights & Restriction", label: a.label, why: a.why, childNames: a.childNames })),
      ...reflectionOv.alerts.map((a) => ({ source: "Post-incident reflection", label: a.label, why: a.why, childNames: a.items })),
      ...safePlans.alerts.map((a) => ({ source: "Staying Safe Plans", label: a.label, why: a.why, childNames: a.items })),
      ...relationships.alerts.map((a) => ({ source: "Protective Relationships", label: a.label, why: a.why, childNames: a.items })),
    ];

    const data = buildActionCentre({ now, reflections, childNameOf: getYPName, attention });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
