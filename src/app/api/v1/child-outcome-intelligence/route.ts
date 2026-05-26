// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD OUTCOME INTELLIGENCE API ROUTE
// GET /api/v1/child-outcome-intelligence?childId=yp_alex
// Per-child engine analysing outcome targets across all domains,
// progress tracking, review compliance, YP participation, barriers.
// CHR 2015 Reg 5, 6, 13. SCCIF: "Progress and outcomes."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeChildOutcome,
  type OutcomeTargetInput,
  type OutcomeReviewInput,
} from "@/lib/engines/child-outcome-intelligence-engine";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "childId is required" }, { status: 400 });
  }

  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Child info ─────────────────────────────────────────────────────────
  const child = (store.youngPeople ?? []).find((yp: any) => yp.id === childId) as any;
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }
  const childName = child.name ?? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || childId;

  // ── Outcome Targets ────────────────────────────────────────────────────
  const targets: OutcomeTargetInput[] = ((store.outcomeTargets ?? []) as any[])
    .filter((t: any) => t.child_id === childId)
    .map((t: any) => ({
      id: t.id,
      domain: t.domain ?? "emotional_wellbeing",
      target_description: t.target_description ?? "",
      success_criteria: t.success_criteria ?? "",
      baseline_rating: t.baseline_rating ?? 1,
      current_rating: t.current_rating ?? 1,
      target_rating: t.target_rating ?? 5,
      direction: t.direction ?? "stable",
      status: t.status ?? "active",
      review_date: (t.review_date ?? today).toString().slice(0, 10),
      set_date: (t.set_date ?? today).toString().slice(0, 10),
      yp_voice: t.yp_voice ?? null,
    }));

  // ── Outcome Reviews ────────────────────────────────────────────────────
  const reviews: OutcomeReviewInput[] = ((store.outcomeReviews ?? []) as any[])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      id: r.id,
      target_id: r.target_id ?? "",
      review_date: (r.review_date ?? today).toString().slice(0, 10),
      previous_rating: r.previous_rating ?? 1,
      new_rating: r.new_rating ?? 1,
      direction: r.direction ?? "stable",
      yp_participated: !!r.yp_participated,
      yp_voice: r.yp_voice ?? null,
      barriers: r.barriers ?? null,
      next_steps: r.next_steps ?? null,
    }));

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildOutcome({
    today,
    child_id: childId,
    child_name: childName,
    targets,
    reviews,
  });

  return NextResponse.json({ data: result });
}
