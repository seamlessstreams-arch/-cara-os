// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INDEPENDENCE SKILLS READINESS INTELLIGENCE API ROUTE
// GET /api/v1/home-independence-skills-readiness-intelligence
// Synthesises independenceSkillsRecords and pathwayPlans to assess how well
// the home is preparing children for independence and leaving care.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeIndependenceSkillsReadiness,
  type IndependenceRecordInput,
  type IndependenceSkillInput,
  type PathwayPlanInput,
} from "@/lib/engines/home-independence-skills-readiness-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.length;

    // Independence skills records
    const rawRecords = (store.independenceSkillsRecords ?? []) as any[];
    const records: IndependenceRecordInput[] = rawRecords.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      review_date: (r.review_date ?? today).toString().slice(0, 10),
      reviewer: r.reviewer ?? "",
      overall_readiness: typeof r.overall_readiness === "number" ? r.overall_readiness : 0,
      skills: Array.isArray(r.skills) ? r.skills.map((s: any): IndependenceSkillInput => ({
        id: s.id ?? "",
        name: s.name ?? "",
        category: s.category ?? "general",
        proficiency: s.proficiency ?? "not_started",
        has_evidence: typeof s.evidence === "string" && s.evidence.trim().length > 0,
        has_next_step: typeof s.next_step === "string" && s.next_step.trim().length > 0,
        has_target_date: s.target_date != null,
        target_date: s.target_date ? s.target_date.toString().slice(0, 10) : null,
        last_assessed: s.last_assessed ? s.last_assessed.toString().slice(0, 10) : null,
      })) : [],
      strengths_count: Array.isArray(r.strengths) ? r.strengths.length : 0,
      areas_for_development_count: Array.isArray(r.areas_for_development) ? r.areas_for_development.length : 0,
      has_child_view: typeof r.child_view === "string" && r.child_view.trim().length > 0,
      has_pathway_notes: typeof r.pathway_notes === "string" && r.pathway_notes.trim().length > 0,
      created_at: (r.created_at ?? today).toString().slice(0, 10),
    }));

    // Pathway plans
    const rawPlans = (store.pathwayPlans ?? []) as any[];
    const pathway_plans: PathwayPlanInput[] = rawPlans.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      status: p.status ?? "draft",
      last_reviewed: p.last_reviewed ? p.last_reviewed.toString().slice(0, 10) : null,
      has_goals: Array.isArray(p.goals) ? p.goals.length > 0 : (p.goals_count ?? 0) > 0,
      goals_count: Array.isArray(p.goals) ? p.goals.length : (p.goals_count ?? 0),
      goals_on_track: Array.isArray(p.goals) ? p.goals.filter((g: any) => g.status === "on_track" || g.on_track).length : (p.goals_on_track ?? 0),
      has_child_voice: typeof p.child_voice === "string" && p.child_voice.trim().length > 0 || !!p.has_child_voice,
      has_accommodation_plan: !!p.has_accommodation_plan || (typeof p.accommodation_plan === "string" && p.accommodation_plan.trim().length > 0),
      has_financial_plan: !!p.has_financial_plan || (typeof p.financial_plan === "string" && p.financial_plan.trim().length > 0),
      has_health_plan: !!p.has_health_plan || (typeof p.health_plan === "string" && p.health_plan.trim().length > 0),
      has_education_employment_plan: !!p.has_education_employment_plan || (typeof p.education_employment_plan === "string" && p.education_employment_plan.trim().length > 0),
      created_at: (p.created_at ?? today).toString().slice(0, 10),
    }));

    const result = computeIndependenceSkillsReadiness({ today, total_children, records, pathway_plans });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
