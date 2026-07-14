// ══════════════════════════════════════════════════════════════════════════════
// CARA — LAC REVIEW INTELLIGENCE API ROUTE
// GET /api/v1/lac-review-intelligence
// Returns LAC review compliance, action tracking, child participation,
// placement stability, and Cara permanence intelligence.
// Reg 36, Care Planning Regulations 2010, IRO Handbook.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeLACReviewIntelligence,
  type ChildInput,
  type LACReviewInput,
} from "@/lib/engines/lac-review-engine";

export async function GET() {
  const store = getStore();

  // ── Map children ─────────────────────────────────────────────────────────
  const children: ChildInput[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name,
    placement_start_date: yp.placement_start,
  }));

  // ── Map LAC reviews ──────────────────────────────────────────────────────
  const reviews: LACReviewInput[] = store.lacReviews.map((r) => ({
    id: r.id,
    child_id: r.child_id,
    date: r.date,
    review_type: r.review_type,
    iro: r.iro,
    child_participation: r.child_participation,
    has_child_views: Boolean(r.child_views && r.child_views.trim().length > 0),
    outcome: r.outcome,
    actions_agreed: r.actions_agreed,
    next_review_date: r.next_review_date,
    placement_stability: r.placement_stability,
    care_plan_updated: r.care_plan_updated,
  }));

  // ── Run engine ───────────────────────────────────────────────────────────
  const result = computeLACReviewIntelligence({ children, reviews });

  return NextResponse.json({ data: result });
}
