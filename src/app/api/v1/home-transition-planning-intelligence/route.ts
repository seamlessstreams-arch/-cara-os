// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TRANSITION PLANNING INTELLIGENCE API ROUTE
// GET /api/v1/home-transition-planning-intelligence
// Pathway planning, independence preparation, goal achievement, area coverage.
// CHR 2015 Reg 14: "The care and independence planning standard."
// SCCIF: "Children are well prepared for their future."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeTransitionPlanning,
  type TransitionGoalInput,
} from "@/lib/engines/home-transition-planning-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Transition Goals ──────────────────────────────────────────────────
  const transitionGoals: TransitionGoalInput[] = (
    (store.transitionPlanningRecords ?? []) as any[]
  ).map((g: any) => ({
    id: g.id ?? "",
    child_id: g.child_id ?? "",
    area: (g.area ?? "independent_living").toString(),
    goal: (g.goal ?? "").toString(),
    description: (g.description ?? "").toString(),
    status: (g.status ?? "not_started").toString(),
    target_date: (g.target_date ?? "").toString().slice(0, 10),
    start_date: (g.start_date ?? "").toString().slice(0, 10),
    key_worker: (g.key_worker ?? "").toString(),
    actions: Array.isArray(g.actions) ? g.actions : [],
    progress: (g.progress ?? "").toString(),
    percent_complete: typeof g.percent_complete === "number" ? g.percent_complete : 0,
    review_date: g.review_date ? g.review_date.toString().slice(0, 10) : "",
    notes: (g.notes ?? "").toString(),
  }));

  // ── Total children ────────────────────────────────────────────────────
  const totalChildren = (store.youngPeople ?? []).filter(
    (yp: any) => yp.status === "current",
  ).length;

  const result = computeHomeTransitionPlanning({
    today,
    transition_goals: transitionGoals,
    total_children: totalChildren,
  });

  return NextResponse.json({ data: result });
}
