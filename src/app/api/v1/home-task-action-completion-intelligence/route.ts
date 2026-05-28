// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TASK ACTION COMPLETION INTELLIGENCE API ROUTE
// GET /api/v1/home-task-action-completion-intelligence
// Synthesises tasks, incidents, and notifications to assess action completion
// rates, overdue tasks, priority management, incident-linked follow-through,
// and governance around action tracking.
// CHR 2015 Reg 13, Reg 40. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeTaskActionCompletion,
  type TaskInput,
  type IncidentTaskInput,
} from "@/lib/engines/home-task-action-completion-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.filter((s: any) => s.is_active !== false).length;

    // Tasks
    const rawTasks = (store.tasks ?? []) as any[];
    const tasks: TaskInput[] = rawTasks.map((t: any) => ({
      id: t.id ?? "",
      title: t.title ?? "",
      category: t.category ?? "general",
      priority: t.priority ?? "medium",
      status: t.status ?? "not_started",
      assigned_to: t.assigned_to ?? "",
      due_date: t.due_date ? t.due_date.toString().slice(0, 10) : "",
      completed_at: t.completed_at ? t.completed_at.toString().slice(0, 10) : "",
      created_at: (t.created_at ?? today).toString().slice(0, 10),
      requires_sign_off: t.requires_sign_off ?? false,
      signed_off_by: t.signed_off_by ?? "",
      linked_child_id: t.linked_child_id ?? "",
      linked_incident_id: t.linked_incident_id ?? "",
      recurring: t.recurring ?? false,
      escalated: t.escalated ?? false,
    }));

    // Incidents (for cross-referencing)
    const rawIncidents = (store.incidents ?? []) as any[];
    const incidents: IncidentTaskInput[] = rawIncidents.map((i: any) => ({
      id: i.id ?? "",
      date: (i.date ?? today).toString().slice(0, 10),
      severity: i.severity ?? "low",
      status: i.status ?? "open",
      has_linked_task: rawTasks.some((t: any) => t.linked_incident_id === i.id),
    }));

    const result = computeTaskActionCompletion({ today, total_staff, tasks, incidents });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
