// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME BEHAVIOUR MANAGEMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-behaviour-intelligence
// Synthesises behaviour logs, sanctions/rewards, and consequence records to
// produce behaviour management quality, reinforcement, and restorative practice
// intelligence.
// CHR 2015 Reg 19, 20. SCCIF: "Effective", "Safe."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeBehaviour,
  type BehaviourLogInput,
  type SanctionRewardInput,
  type ConsequenceInput,
} from "@/lib/engines/home-behaviour-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;
  const childIds = youngPeople.map((yp: any) => yp.id as string);

  // ── Behaviour Logs ────────────────────────────────────────────────────
  const behaviourLogs: BehaviourLogInput[] = ((store.behaviourLog ?? []) as any[])
    .map((b: any) => ({
      id: b.id,
      date: (b.date ?? today).toString().slice(0, 10),
      child_id: b.child_id ?? "",
      direction: b.direction ?? "concern",
      intensity: b.intensity ?? "low",
      has_antecedent: !!(b.antecedent),
      has_strategy: !!(b.strategy_used),
      has_outcome: !!(b.outcome),
    }));

  // ── Sanctions & Rewards ───────────────────────────────────────────────
  const sanctionsRewards: SanctionRewardInput[] = ((store.sanctionRewards ?? []) as any[])
    .map((sr: any) => ({
      id: sr.id,
      date: (sr.date ?? today).toString().slice(0, 10),
      child_id: sr.child_id ?? "",
      direction: sr.direction ?? "sanction",
      proportionate: !!(sr.proportionate),
      has_child_response: !!(sr.child_response),
      has_outcome: !!(sr.outcome),
    }));

  // ── Consequence Records ───────────────────────────────────────────────
  const consequences: ConsequenceInput[] = ((store.consequenceRecords ?? []) as any[])
    .map((c: any) => {
      const restQuestions = (c.restorative_questions ?? []) as any[];
      return {
        id: c.id,
        date: (c.date ?? today).toString().slice(0, 10),
        child_id: c.child_id ?? "",
        approach: c.approach ?? "natural_consequence",
        has_child_voice: !!(c.child_voice),
        relationship_repaired: !!(c.relationship_repaired),
        linked_behaviour_plan: !!(c.linked_behaviour_plan),
        has_restorative_questions: restQuestions.length > 0,
      };
    });

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeBehaviour({
    today,
    total_children: totalChildren,
    child_ids: childIds,
    behaviour_logs: behaviourLogs,
    sanctions_rewards: sanctionsRewards,
    consequences,
  });

  return NextResponse.json({ data: result });
}
