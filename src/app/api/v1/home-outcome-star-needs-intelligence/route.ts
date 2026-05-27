import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeOutcomeStarNeeds,
  type OutcomeStarInput,
  type NeedsAssessmentInput,
  type KpiInput,
} from "@/lib/engines/home-outcome-star-needs-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.children ?? store.youngPeople ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Outcome Star assessments
  const rawStars = (store.outcomeStarAssessments as any[] ?? []);
  const outcome_stars: OutcomeStarInput[] = rawStars.map((s: any) => {
    const scores = s.scores ?? {};
    const values = Object.values(scores).filter((v: any) => typeof v === "number") as number[];
    const avg = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
    const prevScores = s.previous_scores ?? null;
    let prevAvg: number | null = null;
    if (prevScores) {
      const prevValues = Object.values(prevScores).filter((v: any) => typeof v === "number") as number[];
      prevAvg = prevValues.length > 0 ? prevValues.reduce((a: number, b: number) => a + b, 0) / prevValues.length : null;
    }
    return {
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      date: (s.date ?? today).toString().slice(0, 10),
      average_score: Math.round(avg * 10) / 10,
      previous_average_score: prevAvg != null ? Math.round(prevAvg * 10) / 10 : null,
      has_action_plan: !!(s.action_plan && (s.action_plan as any[]).length > 0),
      child_participated: !!(s.child_views),
    };
  });

  // Needs assessments
  const rawNeeds = (store.needsAssessments as any[] ?? []);
  const needs_assessments: NeedsAssessmentInput[] = rawNeeds.map((n: any) => {
    const domains = (n.domain_assessments ?? []) as any[];
    const identified = domains.length;
    const addressed = domains.filter((d: any) => d.interventions_in_place || d.support_provided).length;
    return {
      id: n.id ?? "",
      child_id: n.child_id ?? "",
      date: (n.assessment_date ?? today).toString().slice(0, 10),
      assessment_complete: !!(n.signed_off_by_rm ?? n.completed_within_deadline),
      needs_identified: identified,
      needs_addressed: addressed,
    };
  });

  // KPI entries
  const rawKpis = (store.kpiEntries as any[] ?? []);
  const kpis: KpiInput[] = rawKpis.map((k: any) => ({
    id: k.id ?? "",
    category: k.category ?? "",
    target: parseFloat(k.target) || 0,
    actual: parseFloat(k.value) || 0,
    met: k.rag === "green" || k.rag === "amber_improving",
  }));

  const result = computeOutcomeStarNeeds({
    today,
    total_children: (children as any[]).length,
    outcome_stars,
    needs_assessments,
    kpis,
  });

  return NextResponse.json({ data: result });
}
