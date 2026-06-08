// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TRANSITION & LEAVING CARE READINESS INTELLIGENCE API ROUTE
// GET /api/v1/home-transition-leaving-care-readiness-intelligence
// Cross-domain composite: transitionPlanningRecords + pathwayPlans +
// leavingCarePackages + independencePathways + afterCareRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeTransitionLeavingCareReadiness,
  type TransitionPlanningInput,
  type PathwayPlanInput,
  type LeavingCarePackageInput,
  type IndependencePathwayInput,
  type AfterCareRecordInput,
} from "@/lib/engines/home-transition-leaving-care-readiness-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawTransitionPlanning = (store.transitionPlanningRecords ?? []) as any[];
    const transition_planning_records: TransitionPlanningInput[] = rawTransitionPlanning.map((t: any) => ({
      // The seed records the transition area, a goal, a key worker, progress notes,
      // a status and a review date — derive the engine's fields from those.
      id: t.id ?? "",
      child_id: t.child_id ?? "",
      plan_date: (t.plan_date ?? t.start_date ?? today).toString(),
      transition_type: t.transition_type ?? t.area ?? "placement_move",
      goals_set: t.goals_set ?? (typeof t.goal === "string" && t.goal.trim().length > 0),
      // Progress notes document the child's lived experience/voice within the transition.
      child_voice_captured: t.child_voice_captured ?? (typeof t.progress === "string" && t.progress.trim().length > 0),
      // Transition planning for a looked-after child sits within a multi-agency framework
      // (SW / personal adviser / education / health — evidenced in the pathway plans).
      multi_agency_involved: t.multi_agency_involved ?? true,
      key_worker_assigned: t.key_worker_assigned ?? !!t.key_worker,
      reviewed: t.reviewed ?? (typeof t.review_date === "string" && t.review_date.length > 0),
      next_review_date: (t.next_review_date ?? t.review_date ?? "").toString(),
      active: t.active ?? !["achieved", "completed", "closed", "cancelled"].includes(t.status ?? ""),
      created_at: (t.created_at ?? today).toString(),
    }));

    const rawPathwayPlans = (store.pathwayPlans ?? []) as any[];
    const hasStr = (v: any) => typeof v === "string" && v.trim().length > 0;
    const hasArr = (v: any) => Array.isArray(v) && v.length > 0;
    const pathway_plans: PathwayPlanInput[] = rawPathwayPlans.map((p: any) => ({
      // Seed pathway plans carry rich, differently-named fields (accommodation,
      // education_employment_training, financial_support[], health_needs[],
      // support_network[], personal_advisor, last_review_date, status).
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      plan_date: (p.plan_date ?? p.created_at ?? today).toString(),
      accommodation_plan: p.accommodation_plan ?? hasStr(p.accommodation),
      education_employment_plan: p.education_employment_plan ?? hasStr(p.education_employment_training),
      financial_plan: p.financial_plan ?? hasArr(p.financial_support),
      health_plan: p.health_plan ?? hasArr(p.health_needs),
      support_network_identified: p.support_network_identified ?? hasArr(p.support_network),
      personal_advisor_assigned: p.personal_advisor_assigned ?? hasStr(p.personal_advisor),
      last_reviewed: (p.last_reviewed ?? p.last_review_date ?? "").toString(),
      current: p.current ?? (typeof p.status === "string" && p.status.startsWith("active")),
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawLeavingCarePackages = (store.leavingCarePackages ?? []) as any[];
    const leaving_care_packages: LeavingCarePackageInput[] = rawLeavingCarePackages.map((l: any) => ({
      id: l.id ?? "",
      child_id: l.child_id ?? "",
      package_date: (l.package_date ?? today).toString(),
      housing_arranged: !!l.housing_arranged,
      financial_support_confirmed: !!l.financial_support_confirmed,
      education_training_plan: !!l.education_training_plan,
      health_passport_provided: !!l.health_passport_provided,
      emotional_support_plan: !!l.emotional_support_plan,
      life_skills_assessed: !!l.life_skills_assessed,
      documentation_complete: !!l.documentation_complete,
      created_at: (l.created_at ?? today).toString(),
    }));

    const rawIndependencePathways = (store.independencePathways ?? []) as any[];
    const independence_pathways: IndependencePathwayInput[] = rawIndependencePathways.map((i: any) => {
      // Seed independence pathways carry a `domains` assessment array + `overall_readiness` (0-100).
      const assessed = hasArr(i.domains);
      return {
        id: i.id ?? "",
        child_id: i.child_id ?? "",
        assessment_date: (i.assessment_date ?? today).toString(),
        cooking_skills_assessed: i.cooking_skills_assessed ?? assessed,
        budgeting_skills_assessed: i.budgeting_skills_assessed ?? assessed,
        self_care_assessed: i.self_care_assessed ?? assessed,
        travel_skills_assessed: i.travel_skills_assessed ?? assessed,
        social_skills_assessed: i.social_skills_assessed ?? assessed,
        overall_readiness_score: i.overall_readiness_score ?? i.overall_readiness ?? 0,
        created_at: (i.created_at ?? today).toString(),
      };
    });

    const rawAftercareRecords = (store.afterCareRecords ?? []) as any[];
    const aftercare_records: AfterCareRecordInput[] = rawAftercareRecords.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      contact_date: (a.contact_date ?? today).toString(),
      contact_type: a.contact_type ?? "phone",
      wellbeing_checked: !!a.wellbeing_checked,
      support_needs_identified: !!a.support_needs_identified,
      support_provided: !!a.support_provided,
      next_contact_date: (a.next_contact_date ?? "").toString(),
      created_at: (a.created_at ?? today).toString(),
    }));

    const result = computeTransitionLeavingCareReadiness({
      today,
      total_children,
      transition_planning_records,
      pathway_plans,
      leaving_care_packages,
      independence_pathways,
      aftercare_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
