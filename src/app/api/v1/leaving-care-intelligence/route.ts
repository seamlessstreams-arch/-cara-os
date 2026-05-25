// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEAVING CARE INTELLIGENCE API ROUTE
// GET /api/v1/leaving-care-intelligence
// Returns pathway plan readiness, independence skills analysis, accommodation
// status, EET tracking, and ARIA leaving care intelligence.
// Reg 12 — preparing children to leave care; Reg 14 — assessment of needs.
// Children (Leaving Care) Act 2000 — statutory entitlements.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeLeavingCareIntelligence,
  type PathwayPlanInput,
  type IndependenceSkillInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/leaving-care-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map pathway plans ───────────────────────────────────────────────────────
  const pathwayPlans: PathwayPlanInput[] = store.pathwayPlans.map((p) => ({
    id: p.id,
    child_id: p.child_id,
    status: p.status as string,
    plan_date: p.created_at,
    next_review_date: p.next_review_date,
    accommodation_plan: p.accommodation || "not_started",
    eet_plan: p.education_employment_training || "undecided",
    health_plan_complete: (p.health_needs ?? []).length > 0,
    finance_plan_complete: (p.financial_support ?? []).length > 0,
    support_network_mapped: (p.support_network ?? []).length > 0,
    independence_skills_score: p.independent_living_skills
      ? computeSkillsScore(p.independent_living_skills)
      : 0,
    young_person_involved: true,
  }));

  // ── Map independence skills records ─────────────────────────────────────────
  const independenceSkills: IndependenceSkillInput[] = [];
  for (const record of store.independenceSkillsRecords) {
    for (const skill of record.skills ?? []) {
      independenceSkills.push({
        id: skill.id,
        child_id: record.child_id,
        skill_area: mapSkillCategory(skill.category ?? skill.name),
        competency_level: mapProficiency(skill.proficiency),
        last_assessed: skill.last_assessed || record.review_date,
        notes: skill.evidence || "",
      });
    }
  }

  // ── Map children ────────────────────────────────────────────────────────────
  const children: ChildRef[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: `${yp.first_name} ${yp.last_name}`,
    date_of_birth: yp.date_of_birth,
  }));

  // ── Map staff ───────────────────────────────────────────────────────────────
  const staff: StaffRef[] = store.staff
    .filter((s) => s.is_active)
    .map((s) => ({
      id: s.id,
      name: s.full_name,
    }));

  // ── Run engine ──────────────────────────────────────────────────────────────
  const result = computeLeavingCareIntelligence({
    pathwayPlans,
    independenceSkills,
    children,
    staff,
  });

  return NextResponse.json({ data: result });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeSkillsScore(skills: Record<string, string>): number {
  const entries = Object.values(skills);
  if (entries.length === 0) return 0;
  const scoreMap: Record<string, number> = {
    established: 100,
    developing: 60,
    emerging: 30,
    not_yet: 0,
  };
  const total = entries.reduce((sum, level) => sum + (scoreMap[level] ?? 0), 0);
  return Math.round(total / entries.length);
}

function mapSkillCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    cooking: "cooking",
    meal_preparation: "cooking",
    budgeting: "budgeting",
    finances: "budgeting",
    money_management: "budgeting",
    laundry: "laundry",
    clothing_care: "laundry",
    travel: "travel",
    transport: "travel",
    health_management: "health_management",
    health: "health_management",
    personal_health: "health_management",
    communication: "communication",
    social_skills: "communication",
    job_skills: "job_skills",
    employment: "job_skills",
    work_readiness: "job_skills",
  };
  return categoryMap[category.toLowerCase()] || category.toLowerCase();
}

function mapProficiency(proficiency: string): string {
  const profMap: Record<string, string> = {
    independent: "independent",
    mastered: "independent",
    competent: "competent",
    established: "competent",
    developing: "developing",
    emerging: "developing",
    not_started: "not_started",
    not_yet_started: "not_started",
    not_yet: "not_started",
  };
  return profMap[proficiency] || "not_started";
}
