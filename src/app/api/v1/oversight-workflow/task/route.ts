// ══════════════════════════════════════════════════════════════════════════════
// CARA — Task-level Management Oversight API
//
// POST → per-task oversight (status + suggested comment + any required action)
// for a single task within a workflow. Guarded by ADD_OVERSIGHT. Deterministic.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { generateTaskOversight } from "@/lib/oversight/management-oversight-engine";
import type { TaskOversightInput } from "@/lib/oversight/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.ADD_OVERSIGHT);
  if (auth instanceof NextResponse) return auth;

  let body: Partial<TaskOversightInput>;
  try {
    body = (await req.json()) as Partial<TaskOversightInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body?.taskName) {
    return NextResponse.json({ error: "taskName is required" }, { status: 400 });
  }

  const input: TaskOversightInput = {
    taskName: body.taskName,
    required: body.required ?? true,
    completed: body.completed ?? false,
    completedByRole: body.completedByRole,
    completedAt: body.completedAt,
    completedLate: body.completedLate,
    riskRelevance: body.riskRelevance,
    consistentWithWorkflow: body.consistentWithWorkflow,
    affectsChildSafetyOrDignity: body.affectsChildSafetyOrDignity,
    recordType: body.recordType,
    taskType: body.taskType,
    evidenceSource: body.evidenceSource,
    dueBy: body.dueBy,
  };

  try {
    const result = generateTaskOversight(input);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate task oversight", details: String(error) },
      { status: 500 },
    );
  }
}
