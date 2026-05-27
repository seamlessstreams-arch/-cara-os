import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeReturnInterviewQuality,
  type ReturnInterviewRecordInput,
} from "@/lib/engines/home-return-interview-quality-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.children ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Return interviews → ReturnInterviewRecordInput[]
  const rawInterviews = (store.returnInterviews as any[] ?? []);
  const interviews: ReturnInterviewRecordInput[] = rawInterviews.map((i: any) => {
    const actions = (i.actions_agreed ?? []) as any[];
    const actionsCompleted = actions.filter(
      (act: any) => act.status === "completed"
    ).length;

    return {
      id: i.id ?? "",
      child_id: i.child_id ?? "",
      interview_status: i.interview_status ?? "pending",
      independent_of_home: !!(i.independent_of_home),
      has_push_factors: (i.push_factors ?? []).length > 0,
      has_pull_factors: (i.pull_factors ?? []).length > 0,
      risks_identified_count: (i.risks_identified ?? []).length,
      exploitation_concerns: !!(i.exploitation_concerns),
      has_child_voice: !!(i.child_view_on_safety && i.child_view_on_safety.trim().length > 0),
      actions_total: actions.length,
      actions_completed: actionsCompleted,
      shared_with_count: (i.shared_with ?? []).length,
    };
  });

  const result = computeReturnInterviewQuality({
    today,
    total_children: (children as any[]).length,
    interviews,
  });

  return NextResponse.json({ data: result });
}
