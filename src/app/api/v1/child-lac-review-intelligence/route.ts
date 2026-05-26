// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD LAC REVIEW INTELLIGENCE API ROUTE
// GET /api/v1/child-lac-review-intelligence?childId=yp_alex
// Per-child engine analysing LAC review compliance, participation quality,
// action completion rates, care plan updates, IRO consistency, timeliness.
// CHR 2015 Reg 45 (IRO reviews), Reg 5 (placement plan). IRO Handbook.
// SCCIF: "Impact of leaders."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeChildLACReview,
  type LACReviewInput,
} from "@/lib/engines/child-lac-review-intelligence-engine";

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

  // ── LAC Reviews ────────────────────────────────────────────────────────
  const reviews: LACReviewInput[] = ((store.lacReviews ?? []) as any[])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      id: r.id,
      date: (r.date ?? today).toString().slice(0, 10),
      review_type: r.review_type ?? "subsequent",
      iro_name: r.iro ?? "Unknown IRO",
      child_participation: r.child_participation ?? "did_not_participate",
      child_views_recorded: !!(r.child_views && r.child_views.trim().length > 0),
      outcome: r.outcome ?? "placement_continues",
      actions: (r.actions_agreed ?? []).map((a: any) => ({
        action: a.action ?? "Unnamed action",
        owner: a.owner ?? "Unassigned",
        due_date: a.due_date ?? today,
        completed: !!a.completed,
      })),
      next_review_date: r.next_review_date ?? null,
      placement_stability: r.placement_stability ?? "stable",
      care_plan_updated: !!r.care_plan_updated,
      attendee_count: Array.isArray(r.attendees) ? r.attendees.length : 0,
    }));

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildLACReview({
    today,
    child_id: childId,
    child_name: childName,
    reviews,
  });

  return NextResponse.json({ data: result });
}
