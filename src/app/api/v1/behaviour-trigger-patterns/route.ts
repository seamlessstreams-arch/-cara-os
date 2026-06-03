// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR TRIGGER & ESCALATION PATTERN API ROUTE
// GET /api/v1/behaviour-trigger-patterns
//
// Per-child behaviour pattern analysis: recurring triggers, intensity trajectory,
// de-escalation strategy coverage, and reinforcement balance — to support
// behaviour planning and reduce restraint.
//
// CHR 2015 Reg 11 (behaviour management), Reg 6, Reg 12. SCCIF: behaviour is
// understood and supported.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeBehaviourTriggerPatterns,
  type BehaviourChildRef,
  type BehaviourEntryInput,
} from "@/lib/behaviour-trigger-patterns/behaviour-trigger-patterns-engine";

const d = (v: unknown, fallback = ""): string => (v == null ? fallback : v.toString().slice(0, 10));

export async function GET() {
  const store = getStore();

  const children: BehaviourChildRef[] = ((store.youngPeople ?? []) as any[])
    .filter((yp: any) => yp.status === "current")
    .map((yp: any) => ({
      id: yp.id,
      name: yp.preferred_name || `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || yp.id,
    }));

  const entries: BehaviourEntryInput[] = ((store.behaviourLog ?? []) as any[])
    .filter((b: any) => b.child_id)
    .map((b: any) => ({
      child_id: b.child_id,
      date: d(b.date ?? b.created_at),
      direction: b.direction ?? "concern",
      intensity: b.intensity ?? "low",
      trigger: b.trigger ?? "",
      antecedent: b.antecedent ?? "",
      strategy_used: b.strategy_used ?? "",
    }));

  const result = computeBehaviourTriggerPatterns({ children, entries });

  return NextResponse.json({ data: result });
}
