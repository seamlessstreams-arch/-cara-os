import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// GET /api/v1/reg40-triage
// Returns tasks tagged reg40_triage, enriched with source care event
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const child_id = searchParams.get("child_id");

  let tasks = db.tasks
    .findAll()
    .filter((t) => Array.isArray(t.tags) && t.tags.includes("reg40_triage"));

  if (status) tasks = tasks.filter((t) => t.status === status);
  if (child_id) tasks = tasks.filter((t) => t.linked_child_id === child_id);

  const today = new Date().toISOString().slice(0, 10);
  tasks = [...tasks].sort((a, b) => {
    const aOver = a.due_date && a.due_date < today && a.status !== "completed" ? -10 : 0;
    const bOver = b.due_date && b.due_date < today && b.status !== "completed" ? -10 : 0;
    return (aOver - bOver) || b.created_at.localeCompare(a.created_at);
  });

  // Enrich with source care event
  const enriched = tasks.map((task) => {
    const careEventId = (task as unknown as Record<string, unknown>).linked_care_event_id as string | undefined;
    const careEvent = careEventId ? db.careEvents.findById(careEventId) : null;
    return {
      ...task,
      care_event: careEvent
        ? {
            id: careEvent.id,
            title: careEvent.title,
            category: careEvent.category,
            event_date: careEvent.event_date,
            status: careEvent.status,
            staff_id: careEvent.staff_id,
            child_id: careEvent.child_id,
            content_excerpt: careEvent.content.slice(0, 300),
          }
        : null,
    };
  });

  // Also include care events flagged for reg40 triage that may not have a task yet
  const reg40CareEvents = db.careEvents.findForReg40().filter(
    (ce) =>
      !tasks.some(
        (t) => (t as unknown as Record<string, unknown>).linked_care_event_id === ce.id
      )
  );

  const overdueCount = tasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "completed"
  ).length;

  return NextResponse.json({
    data: enriched,
    meta: {
      total: tasks.length,
      active: tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length,
      overdue: overdueCount,
      care_events_pending_triage: reg40CareEvents.length,
    },
  });
}

// PATCH /api/v1/reg40-triage
// Body: { task_id, action: "complete"|"notify_ofsted"|"no_notification_required", completed_by, evidence_note? }
export async function PATCH(req: NextRequest) {
  let body: {
    task_id: string;
    action: string;
    completed_by: string;
    evidence_note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { task_id, action, completed_by, evidence_note } = body;
  if (!task_id || !action || !completed_by) {
    return NextResponse.json({ error: "task_id, action, and completed_by are required" }, { status: 400 });
  }

  const noteMap: Record<string, string> = {
    notify_ofsted: "Reg 40 notification sent to Ofsted.",
    no_notification_required: "Reviewed: no Reg 40 notification required.",
    complete: evidence_note ?? "Triage completed.",
  };

  const resolvedNote = noteMap[action] ?? evidence_note ?? "Completed.";
  const task = db.tasks.complete(task_id, completed_by, resolvedNote);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json({ data: task });
}
