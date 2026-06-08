// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME COMPETENCY LANDSCAPE INTELLIGENCE API ROUTE
// GET /api/v1/home-competency-landscape-intelligence
// Combines competencyProfiles + developmentPlans for workforce capability.
// CHR 2015 Reg 32, Reg 33. SCCIF: "The effectiveness of leaders and managers."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeCompetencyLandscape,
  type CompetencyProfileInput,
  type DevelopmentPlanInput,
} from "@/lib/engines/home-competency-landscape-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Competency Profiles ────────────────────────────────────────────────
  const profiles: CompetencyProfileInput[] = (
    (store.competencyProfiles ?? []) as any[]
  ).map((cp: any) => ({
    id: cp.id ?? "",
    staff_id: cp.staff_id ?? "",
    current_stage: (cp.current_stage ?? "").toString(),
    target_stage: cp.target_stage ? cp.target_stage.toString() : null,
    readiness_score:
      typeof cp.overall_readiness_score === "number"
        ? cp.overall_readiness_score
        : 0,
    strengths_count: Array.isArray(cp.strengths) ? cp.strengths.length : 0,
    development_areas_count: Array.isArray(cp.development_areas)
      ? cp.development_areas.length
      : 0,
    last_assessed_date: (cp.last_assessed_at ?? "").toString().slice(0, 10),
    next_review_date: (cp.next_review_date ?? "").toString().slice(0, 10),
  }));

  // ── Development Plans ──────────────────────────────────────────────────
  const development_plans: DevelopmentPlanInput[] = (
    (store.developmentPlans ?? []) as any[]
  ).map((dp: any) => {
    const actions = Array.isArray(dp.actions) ? dp.actions : [];
    const completedActions = actions.filter((a: any) => !!(a.completed)).length;
    const overdueActions = actions.filter(
      (a: any) =>
        !a.completed &&
        a.target_date &&
        a.target_date.toString().slice(0, 10) < today,
    ).length;

    return {
      id: dp.id ?? "",
      staff_id: dp.staff_id ?? "",
      status: (dp.status ?? "active").toString(),
      total_actions: actions.length,
      completed_actions: completedActions,
      overdue_actions: overdueActions,
    };
  });

  // ── Total staff ────────────────────────────────────────────────────────
  const totalStaff = (store.staff ?? []).filter(
    (s: any) => s.is_active !== false,
  ).length;

  const result = computeHomeCompetencyLandscape({
    today,
    profiles,
    development_plans,
    total_staff: totalStaff,
  });

  return NextResponse.json({ data: result });
}
