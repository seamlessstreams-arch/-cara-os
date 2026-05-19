import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// GET /api/v1/management-oversight
// Returns tasks tagged management_oversight, enriched with the source care event
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const child_id = searchParams.get("child_id");

  // Get tasks tagged with management_oversight
  let tasks = db.tasks
    .findAll()
    .filter((t) => Array.isArray(t.tags) && t.tags.includes("management_oversight"));

  if (status) tasks = tasks.filter((t) => t.status === status);
  if (priority) tasks = tasks.filter((t) => t.priority === priority);
  if (child_id) tasks = tasks.filter((t) => t.linked_child_id === child_id);

  // Sort: urgent first, then overdue, then by created_at desc
  const today = new Date().toISOString().slice(0, 10);
  const prioOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  tasks = [...tasks].sort((a, b) => {
    const aOver = a.due_date && a.due_date < today && a.status !== "completed" ? -10 : 0;
    const bOver = b.due_date && b.due_date < today && b.status !== "completed" ? -10 : 0;
    return (aOver + (prioOrder[a.priority] ?? 2)) - (bOver + (prioOrder[b.priority] ?? 2));
  });

  // Enrich with care event data where linked, and resolve names
  const enriched = tasks.map((task) => {
    const careEventId = (task as unknown as Record<string, unknown>).linked_care_event_id as string | undefined;
    const careEvent = careEventId ? db.careEvents.findById(careEventId) : null;
    const assignee = task.assigned_to ? db.staff.findById(task.assigned_to) : null;
    const childPerson = (task as unknown as Record<string, unknown>).linked_child_id
      ? db.youngPeople.findById((task as unknown as Record<string, unknown>).linked_child_id as string)
      : null;
    return {
      ...task,
      care_event: careEvent ?? null,
      assigned_to_name: assignee ? `${assignee.first_name} ${assignee.last_name}` : task.assigned_to ?? null,
      child_name: childPerson ? `${childPerson.first_name} ${childPerson.last_name}` : null,
    };
  });

  const activeCount = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length;
  const urgentCount = tasks.filter((t) => t.priority === "urgent" && t.status !== "completed").length;
  const overdueCount = tasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "completed"
  ).length;

  return NextResponse.json({
    data: enriched,
    meta: {
      total: tasks.length,
      active: activeCount,
      urgent: urgentCount,
      overdue: overdueCount,
    },
  });
}

// PATCH /api/v1/management-oversight
// Body: { task_id, action: "complete"|"assign", completed_by?, assigned_to?, evidence_note? }
export async function PATCH(req: NextRequest) {
  let body: { task_id: string; action: string; completed_by?: string; assigned_to?: string; evidence_note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { task_id, action, completed_by, assigned_to, evidence_note } = body;
  if (!task_id || !action) {
    return NextResponse.json({ error: "task_id and action required" }, { status: 400 });
  }

  if (action === "complete") {
    if (!completed_by) {
      return NextResponse.json({ error: "completed_by required" }, { status: 400 });
    }
    const task = db.tasks.complete(task_id, completed_by, evidence_note);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ data: task });
  }

  if (action === "assign") {
    const tasks = db.tasks.findAll();
    const idx = tasks.findIndex((t) => t.id === task_id);
    if (idx === -1) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    // Directly mutate via store
    const allTasks = db.tasks.findAll();
    const taskIdx = allTasks.findIndex((t) => t.id === task_id);
    if (taskIdx === -1) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    allTasks[taskIdx] = {
      ...allTasks[taskIdx],
      assigned_to: assigned_to ?? null,
      updated_at: new Date().toISOString(),
    };
    return NextResponse.json({ data: allTasks[taskIdx] });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
