// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTOMATION ENGINE EVALUATE API ROUTE
// POST /api/v1/automation/evaluate
// Accepts { trigger, triggerData } and returns all actions that would fire.
// Deterministic / side-effect-free — nothing is persisted or dispatched.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { evaluateRules } from "@/lib/automation/automation-engine";
import type { AutomationTrigger } from "@/lib/automation/types";

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { trigger, triggerData } = body as {
      trigger: AutomationTrigger;
      triggerData: Record<string, any>;
    };

    if (!trigger) {
      return NextResponse.json(
        { error: "Missing required field: trigger" },
        { status: 400 },
      );
    }

    if (!triggerData || typeof triggerData !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid required field: triggerData (must be an object)" },
        { status: 400 },
      );
    }

    const runs = evaluateRules(trigger, triggerData);

    const totalActions = runs.reduce((sum, r) => sum + r.actions_executed.length, 0);

    return NextResponse.json({
      data: {
        trigger,
        trigger_data: triggerData,
        rules_evaluated: runs.length,
        total_actions: totalActions,
        runs,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to evaluate automation rules", detail: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
