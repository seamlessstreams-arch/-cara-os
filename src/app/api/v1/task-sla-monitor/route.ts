// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/task-sla-monitor — Task SLA breach monitor
//
// Watches the deadline-bound tasks the Enter Once orchestrators auto-create and
// surfaces SLA breaches (weighted for statutory/safeguarding actions). Closes the
// "action automatically" loop: enter once → tasks created → overdue ones escalate.
//
// Distinct from the existing /api/v1/escalations feature (manual escalations).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { monitorTaskSla, type SlaTask } from "@/lib/escalation/task-sla-monitor";
import type { Task } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get("severity");
  const statutoryOnly = searchParams.get("statutory") === "true";

  const tasks = (await dal.tasks.findAll()) as (Task & {
    linked_record_type?: string | null;
    linked_record_id?: string | null;
    child_id?: string | null;
  })[];

  const slaTasks: SlaTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
    priority: t.priority,
    status: t.status,
    due_date: t.due_date,
    assigned_to: t.assigned_to,
    child_id: t.child_id ?? t.linked_child_id ?? null,
    linked_record_type: t.linked_record_type ?? null,
    linked_record_id: t.linked_record_id ?? t.linked_incident_id ?? null,
  }));

  const result = monitorTaskSla(slaTasks);

  let escalations = result.escalations;
  if (severity) escalations = escalations.filter((e) => e.severity === severity);
  if (statutoryOnly) escalations = escalations.filter((e) => e.is_statutory);

  return NextResponse.json({
    data: escalations,
    summary: result.summary,
    by_category: result.by_category,
    headline: result.headline,
    meta: { generated_at: new Date().toISOString(), returned: escalations.length },
  });
}
