// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTOMATION EXECUTE API (Phase 2 · Operational Control · Module 1)
// POST /api/v1/automation/execute { trigger, triggerData }
//
// evaluate = simulate-only (unchanged, at /automation/evaluate). THIS route
// executes the SAFE subset of the matched rules' actions (create task / notify /
// audit-log) when the automation_executor flag is on; official-record actions
// always come back as requires_confirmation for a human. Flag off → 200 with
// executed:false and the simulation, so callers degrade gracefully.
// Permission-gated: manage_settings (the demo RM holds it; care staff 403).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { requirePermissionAsync, getRequestIdentity } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { evaluateRules, getApplicableRules } from "@/lib/automation/automation-engine";
import { executeRuns, isExecutorEnabled } from "@/lib/automation/action-executor";
import type { AutomationTrigger } from "@/lib/automation/types";

export async function POST(request: NextRequest) {
  const auth = await requirePermissionAsync(request, PERMISSIONS.MANAGE_SETTINGS);
  if (auth instanceof NextResponse) return auth;
  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;

  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as { trigger?: AutomationTrigger; triggerData?: Record<string, unknown> };

  if (!body.trigger) {
    return NextResponse.json({ error: "Missing required field: trigger" }, { status: 400 });
  }
  const triggerData = body.triggerData;
  if (!triggerData || typeof triggerData !== "object") {
    return NextResponse.json(
      { error: "Missing or invalid required field: triggerData (must be an object)" },
      { status: 400 },
    );
  }

  const runs = evaluateRules(body.trigger, triggerData as Record<string, never>);
  const rules = getApplicableRules(body.trigger);
  const results = executeRuns(runs, rules, triggerData, {
    userId: auth.userId,
    homeId: identity.homeId,
  });

  return NextResponse.json({
    data: {
      trigger: body.trigger,
      executor_enabled: isExecutorEnabled(),
      rules_matched: runs.length,
      results,
    },
  });
}
