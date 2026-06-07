import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeSelfEvaluationImprovement,
  type SelfEvaluationAreaInput,
} from "@/lib/engines/home-self-evaluation-improvement-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = (store.youngPeople ?? []).filter((c: any) => c.status === "current");
  const today = new Date().toISOString().slice(0, 10);

  // Self-evaluation areas → SelfEvaluationAreaInput[]
  const rawAreas = (store.selfEvaluationAreas as any[] ?? []);
  const areas: SelfEvaluationAreaInput[] = rawAreas.map((a: any) => {
    const actions = (a.actions ?? []) as any[];
    const actionsCompleted = actions.filter(
      (act: any) => act.status === "completed"
    ).length;

    return {
      id: a.id ?? "",
      area: a.area ?? "",
      self_grade: a.self_grade ?? "requires_improvement",
      strengths_count: (a.strengths ?? []).length,
      evidence_count: (a.evidence ?? []).length,
      development_areas_count: (a.areas_for_development ?? []).length,
      actions_total: actions.length,
      actions_completed: actionsCompleted,
    };
  });

  const result = computeSelfEvaluationImprovement({
    today,
    total_children: (children as any[]).length,
    areas,
  });

  return NextResponse.json({ data: result });
}
