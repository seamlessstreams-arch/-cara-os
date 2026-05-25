// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LIFE SKILLS & INDEPENDENCE INTELLIGENCE API ROUTE
// GET /api/v1/life-skills-intelligence
// Returns independence readiness analysis: pathway assessments, domain
// averages, per-child readiness profiles, and ARIA intelligence.
// Reg 8, Reg 9, Reg 14, SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeLifeSkillsIntelligence,
  type IndependencePathwayInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/life-skills-intelligence-engine";

export async function GET() {
  const store = getStore();

  const pathways: IndependencePathwayInput[] = (store.independencePathways ?? []).map((p: any) => ({
    id: p.id,
    child_id: p.child_id,
    assessed_by: p.assessed_by,
    assessment_date: typeof p.assessment_date === "string" ? p.assessment_date.slice(0, 10) : p.assessment_date,
    review_date: typeof p.review_date === "string" ? p.review_date.slice(0, 10) : p.review_date,
    overall_readiness: p.overall_readiness,
    domains: (p.domains ?? []).map((d: any) => ({
      name: d.name,
      score: d.score,
      max_score: d.max_score,
    })),
    status: p.status,
    pathway_plan_linked: p.pathway_plan_linked ?? false,
  }));

  const children: ChildRef[] = (store.youngPeople ?? []).map((yp: any) => ({
    id: yp.id,
    name: yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`,
  }));

  const staff: StaffRef[] = (store.staff ?? [])
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  const result = computeLifeSkillsIntelligence({ pathways, children, staff });

  return NextResponse.json({ data: result });
}
