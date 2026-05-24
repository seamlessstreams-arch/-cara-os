// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — OUTCOMES PROGRESS INTELLIGENCE API ROUTE
// GET /api/v1/outcomes-progress
// Returns outcome target analysis, domain progress, review compliance,
// velocity metrics, alerts, and ARIA outcomes intelligence.
// Reg 7–14, SCCIF Overall Experiences & Progress.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeOutcomesProgress,
  type ChildInput,
  type OutcomeTargetInput,
  type OutcomeReviewInput,
} from "@/lib/engines/outcomes-progress-engine";

export async function GET() {
  const store = getStore();

  // ── Map children ─────────────────────────────────────────────────────────
  const children: ChildInput[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name,
  }));

  // ── Map outcome targets ──────────────────────────────────────────────────
  const targets: OutcomeTargetInput[] = store.outcomeTargets.map((t) => ({
    id: t.id,
    child_id: t.child_id,
    domain: t.domain,
    target_description: t.target_description,
    baseline_rating: t.baseline_rating,
    current_rating: t.current_rating,
    target_rating: t.target_rating,
    direction: t.direction,
    status: t.status,
    review_date: t.review_date,
    set_date: t.set_date,
    yp_voice: t.yp_voice,
  }));

  // ── Map outcome reviews ──────────────────────────────────────────────────
  const reviews: OutcomeReviewInput[] = store.outcomeReviews.map((r) => ({
    id: r.id,
    target_id: r.target_id,
    child_id: r.child_id,
    review_date: r.review_date,
    previous_rating: r.previous_rating,
    new_rating: r.new_rating,
    direction: r.direction,
    yp_participated: r.yp_participated,
    yp_voice: r.yp_voice,
    progress_notes: r.progress_notes,
    barriers: r.barriers,
  }));

  // ── Run engine ───────────────────────────────────────────────────────────
  const result = computeOutcomesProgress({ children, targets, reviews });

  return NextResponse.json({ data: result });
}
