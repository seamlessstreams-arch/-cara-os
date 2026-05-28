// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INDEPENDENCE & LIFE SKILLS DEVELOPMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-independence-life-skills-development-intelligence
// Cross-domain composite: lifeSkillsAssessmentRecords + cookingProgrammeRecords +
// travelTrainingRecords + personalCareRecords + independenceMilestoneRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeIndependenceLifeSkillsDevelopment,
  type LifeSkillsAssessmentInput,
  type CookingProgrammeInput,
  type TravelTrainingInput,
  type PersonalCareInput,
  type IndependenceMilestoneInput,
} from "@/lib/engines/home-independence-life-skills-development-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawAssessments = ((store as any).lifeSkillsAssessmentRecords || []) as any[];
    const life_skills_assessment_records: LifeSkillsAssessmentInput[] = rawAssessments.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      assessment_date: (a.assessment_date ?? today).toString(),
      assessor_name: a.assessor_name ?? "",
      assessment_type: a.assessment_type ?? "initial",
      cooking_score: a.cooking_score ?? 1,
      cleaning_score: a.cleaning_score ?? 1,
      laundry_score: a.laundry_score ?? 1,
      budgeting_score: a.budgeting_score ?? 1,
      personal_hygiene_score: a.personal_hygiene_score ?? 1,
      travel_score: a.travel_score ?? 1,
      social_skills_score: a.social_skills_score ?? 1,
      overall_independence_score: a.overall_independence_score ?? 1,
      previous_overall_score: a.previous_overall_score ?? null,
      child_involved: !!a.child_involved,
      goals_set: a.goals_set ?? 0,
      goals_achieved: a.goals_achieved ?? 0,
      review_date: a.review_date ?? null,
      review_overdue: !!a.review_overdue,
      key_worker_involved: !!a.key_worker_involved,
      child_feedback_positive: !!a.child_feedback_positive,
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawCooking = ((store as any).cookingProgrammeRecords || []) as any[];
    const cooking_programme_records: CookingProgrammeInput[] = rawCooking.map((c: any) => ({
      id: c.id ?? "",
      child_id: c.child_id ?? "",
      session_date: (c.session_date ?? today).toString(),
      meal_type: c.meal_type ?? "dinner",
      skill_level: c.skill_level ?? "observer",
      recipe_followed: !!c.recipe_followed,
      hygiene_standards_met: !!c.hygiene_standards_met,
      safety_standards_met: !!c.safety_standards_met,
      child_enjoyed: !!c.child_enjoyed,
      staff_member: c.staff_member ?? "",
      new_skill_learned: !!c.new_skill_learned,
      child_chose_recipe: !!c.child_chose_recipe,
      notes_recorded: !!c.notes_recorded,
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawTravel = ((store as any).travelTrainingRecords || []) as any[];
    const travel_training_records: TravelTrainingInput[] = rawTravel.map((t: any) => ({
      id: t.id ?? "",
      child_id: t.child_id ?? "",
      training_date: (t.training_date ?? today).toString(),
      training_type: t.training_type ?? "road_safety",
      competency_level: t.competency_level ?? "not_started",
      route_practised: t.route_practised ?? "",
      accompanied: t.accompanied !== false,
      risk_assessment_completed: !!t.risk_assessment_completed,
      child_confidence_rating: t.child_confidence_rating ?? 3,
      staff_confidence_rating: t.staff_confidence_rating ?? 3,
      milestone_achieved: !!t.milestone_achieved,
      child_feedback_positive: !!t.child_feedback_positive,
      created_at: (t.created_at ?? today).toString(),
    }));

    const rawPersonalCare = ((store as any).personalCareRecords || []) as any[];
    const personal_care_records: PersonalCareInput[] = rawPersonalCare.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      record_date: (p.record_date ?? today).toString(),
      care_area: p.care_area ?? "hygiene_routine",
      independence_level: p.independence_level ?? "full_support",
      improvement_noted: !!p.improvement_noted,
      child_engaged: !!p.child_engaged,
      dignity_respected: p.dignity_respected !== false,
      age_appropriate_support: p.age_appropriate_support !== false,
      key_worker_discussed: !!p.key_worker_discussed,
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawMilestones = ((store as any).independenceMilestoneRecords || []) as any[];
    const independence_milestone_records: IndependenceMilestoneInput[] = rawMilestones.map((m: any) => ({
      id: m.id ?? "",
      child_id: m.child_id ?? "",
      milestone_date: (m.milestone_date ?? today).toString(),
      milestone_category: m.milestone_category ?? "cooking",
      milestone_description: m.milestone_description ?? "",
      achieved: !!m.achieved,
      target_date: m.target_date ?? null,
      overdue: !!m.overdue,
      child_celebrated: !!m.child_celebrated,
      evidenced_in_records: !!m.evidenced_in_records,
      staff_witness: m.staff_witness ?? "",
      child_proud: !!m.child_proud,
      shared_with_social_worker: !!m.shared_with_social_worker,
      created_at: (m.created_at ?? today).toString(),
    }));

    const result = computeIndependenceLifeSkillsDevelopment({
      today,
      total_children,
      life_skills_assessment_records,
      cooking_programme_records,
      travel_training_records,
      personal_care_records,
      independence_milestone_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
