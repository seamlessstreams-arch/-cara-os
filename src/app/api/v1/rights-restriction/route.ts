import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { getStore, db } from "@/lib/db/store";
import { getRequestIdentity, assertHomeAccess } from "@/lib/auth-guard";
import { generateId } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";
import {
  analyseRestrictionReview,
  buildRestrictionOverview,
} from "@/lib/rights-restriction/rights-restriction-engine";
import type { RestrictionReview, YesNoUnknown } from "@/lib/rights-restriction/types";

export const dynamic = "force-dynamic";

function childrenList() {
  const store = getStore();
  return (store.youngPeople ?? [])
    .filter((yp: { status?: string }) => yp.status === "current")
    .map((yp: { id: string; preferred_name?: string; first_name?: string }) => ({
      id: yp.id,
      name: yp.preferred_name || yp.first_name || "Child",
    }));
}

/**
 * GET /api/v1/rights-restriction            → whole-home overview + dashboard alerts
 * GET /api/v1/rights-restriction?child_id=… → that child's reviews + per-review analysis
 *
 * Decision SUPPORT + evidence — never legal advice, never the decision itself.
 */
export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity; // 401 in activated mode without a session
    const store = getStore();
    const childId = new URL(req.url).searchParams.get("child_id");
    const now = new Date().toISOString();

    if (childId) {
      // Tenant isolation: a child's restriction reviews may only be read by their own home.
      const child = (store.youngPeople ?? []).find((yp: { id: string }) => yp.id === childId) as { home_id?: string } | undefined;
      const denied = assertHomeAccess(identity, child?.home_id);
      if (denied) return denied;
      const reviews = db.restrictionReviews.findByChild(childId);
      return NextResponse.json({
        data: {
          childId,
          childName: getYPName(childId),
          reviews: reviews
            .map((r) => ({ review: r, analysis: analyseRestrictionReview(r, now) }))
            .sort((a, b) => b.review.review_date.localeCompare(a.review.review_date)),
        },
      });
    }

    const overview = buildRestrictionOverview({
      now,
      reviews: db.restrictionReviews.findAll(),
      children: childrenList(),
      incidents: store.incidents ?? [],
    });
    return NextResponse.json({ data: overview });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const yn = (v: unknown): YesNoUnknown => (v === "yes" || v === "no" ? v : "unknown");
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * POST /api/v1/rights-restriction — record a restriction review through the
 * structured pathway. Mutates only the in-memory store (same class as the other
 * write routes); records the decision, never sends or acts on it externally.
 */
export async function POST(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity; // 401 in activated mode without a session
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    if (!body?.child_id || !str(body.restriction_description).trim() || !str(body.reason).trim()) {
      return NextResponse.json(
        { error: "child_id, restriction_description and reason are required" },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    const store = getStore();
    // Tenant isolation: the child must belong to the caller's home (activated mode).
    const child = (store.youngPeople ?? []).find((yp: { id: string }) => yp.id === String(body.child_id)) as { home_id?: string } | undefined;
    const denied = assertHomeAccess(identity, child?.home_id);
    if (denied) return denied;
    // Identity + home come from the validated session in activated mode (never the
    // client body); demo mode (identity.homeId null) keeps the header/body convention.
    const actor = identity.homeId != null ? identity.userId : String(req.headers.get("x-user-id") ?? body.created_by ?? "staff_unknown");
    const homeId = identity.homeId ?? String(body.home_id ?? child?.home_id ?? "home_oak");

    const review: RestrictionReview = {
      id: generateId("rr"),
      child_id: String(body.child_id),
      home_id: homeId,
      review_date: str(body.review_date) || now.slice(0, 10),
      decision_considered: str(body.decision_considered),
      restriction_kind: body.restriction_kind ?? "other",
      restriction_description: str(body.restriction_description),
      reason: str(body.reason),
      immediate_safety_concern: str(body.immediate_safety_concern),
      risk_being_managed: str(body.risk_being_managed),
      child_understands: yn(body.child_understands),
      child_wishes_feelings: str(body.child_wishes_feelings),
      child_objects: yn(body.child_objects),
      capacity_competence_notes: str(body.capacity_competence_notes),
      parental_social_worker_views: str(body.parental_social_worker_views),
      best_interests_reasoning: str(body.best_interests_reasoning),
      least_restrictive_alternatives: str(body.least_restrictive_alternatives),
      alternatives_outcome: str(body.alternatives_outcome),
      proportionality_reasoning: str(body.proportionality_reasoning),
      duration: str(body.duration),
      next_review_date: body.next_review_date ? String(body.next_review_date) : null,
      legal_advice_required: yn(body.legal_advice_required),
      escalation_notes: str(body.escalation_notes),
      manager_decision: body.manager_decision ?? "pending",
      manager_id: body.manager_id ? String(body.manager_id) : null,
      responsible_person: str(body.responsible_person),
      evidence_relied_upon: str(body.evidence_relied_upon),
      linked_record_ids: Array.isArray(body.linked_record_ids) ? body.linked_record_ids.map(String) : [],
      status: body.status ?? "active",
      created_at: now,
      updated_at: now,
      created_by: actor,
      updated_by: actor,
    };

    db.restrictionReviews.append(review);

    return NextResponse.json(
      { data: { review, analysis: analyseRestrictionReview(review, now) } },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
