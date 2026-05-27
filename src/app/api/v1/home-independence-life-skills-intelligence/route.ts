// ══════════════════════════════════════════════════════════════════════════════
// API — HOME INDEPENDENCE & LIFE SKILLS INTELLIGENCE
// Maps in-memory store → engine input → JSON response.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeIndependenceLifeSkills,
  type IndependenceAssessmentInput,
  type CookingInput,
  type LaundryInput,
  type MoneyInput,
  type HouseholdTaskInput,
} from "@/lib/engines/home-independence-life-skills-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Independence Living Assessments ───────────────────────────────
  const independence_assessments: IndependenceAssessmentInput[] = (store.independenceLivingAssessments as any[]).map((a: any) => ({
    id: a.id,
    child_id: a.child_id,
    assessment_date: (a.assessment_date ?? "").toString().slice(0, 10),
    next_assessment_due: (a.next_assessment_due ?? "").toString().slice(0, 10),
    overall_readiness: a.overall_readiness ?? "not_ready",
    child_agreed: !!(a.child_agreed),
    domain_assessment_count: a.domain_assessments?.length ?? 0,
    child_aspirations_present: !!(a.child_aspirations),
    child_worries_count: a.child_worries?.length ?? 0,
    priority_skills_count: a.priority_skills_next_six_months?.length ?? 0,
    resources_allocated_count: a.resources_allocated?.length ?? 0,
  }));

  // ── Cooking & Baking Records ──────────────────────────────────────
  const cooking_records: CookingInput[] = (store.cookingBakingRecords as any[]).map((r: any) => ({
    id: r.id,
    child_id: r.child_id,
    recorded_date: (r.recorded_date ?? "").toString().slice(0, 10),
    review_date: (r.review_date ?? "").toString().slice(0, 10),
    competency_level: r.competency_level ?? "observer",
    hygiene_certificate: !!(r.hygiene_certificate),
    led_family_meal: !!(r.led_family_meal),
    child_voice_present: !!(r.child_voice),
    recipes_attempted_count: r.recipes_attempted?.length ?? 0,
    cuisines_explored: r.cuisines_explored ?? [],
  }));

  // ── Laundry & Self-Care Records ───────────────────────────────────
  const laundry_records: LaundryInput[] = (store.laundrySelfCareRecords as any[]).map((r: any) => ({
    id: r.id,
    child_id: r.child_id,
    recorded_date: (r.recorded_date ?? "").toString().slice(0, 10),
    review_date: (r.review_date ?? "").toString().slice(0, 10),
    overall_stage: r.overall_stage ?? "full_support",
    owns_basket: !!(r.owns_basket),
    knows_care_symbols: !!(r.knows_care_symbols),
    iron_competent: !!(r.iron_competent),
    child_voice_present: !!(r.child_voice),
  }));

  // ── Money Records ─────────────────────────────────────────────────
  const money_records: MoneyInput[] = (store.moneyRecords as any[]).map((r: any) => ({
    id: r.id,
    child_id: r.child_id,
    recorded_date: (r.recorded_date ?? "").toString().slice(0, 10),
    review_date: (r.review_date ?? "").toString().slice(0, 10),
    competency: r.competency ?? "not_started",
    real_world_application_count: r.real_world_application?.length ?? 0,
    child_voice_present: !!(r.child_voice),
  }));

  // ── Household Tasks ───────────────────────────────────────────────
  const household_tasks: HouseholdTaskInput[] = (store.householdTasks as any[]).map((t: any) => ({
    id: t.id,
    child_id: t.child_id,
    reviewed_date: (t.reviewed_date ?? "").toString().slice(0, 10),
    support_level: t.support_level ?? "full_support",
    child_chose: !!(t.child_chose),
    completion_recent: t.completion_recent ?? 0,
    child_voice_present: !!(t.child_attitude),
  }));

  const result = computeHomeIndependenceLifeSkills({
    today,
    independence_assessments,
    cooking_records,
    laundry_records,
    money_records,
    household_tasks,
    total_children: store.children?.length ?? 0,
  });

  return NextResponse.json({ data: result });
}
