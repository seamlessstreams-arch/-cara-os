import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";
import type { HandoverEntry } from "@/types/extended";

// GET /api/v1/handover
export async function GET() {
  const latest = db.handovers.findLatest();
  const all = db.handovers.findAll();

  // History = all except the latest
  const history = latest
    ? [...all]
        .filter((h) => h.id !== latest.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    : [];

  const today_shifts = db.shifts.findToday();
  const all_tasks = db.tasks.findAll();
  const pending_tasks = all_tasks
    .filter((t) => t.status !== "completed" && t.status !== "cancelled")
    .sort((a, b) => {
      const priority: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priority[a.priority] ?? 4) - (priority[b.priority] ?? 4);
    })
    .slice(0, 5);

  const open_incidents = db.incidents.findOpen();
  const young_people = db.youngPeople.findCurrent();

  return NextResponse.json({
    data: {
      latest,
      history,
      today_shifts,
      pending_tasks,
      open_incidents,
      young_people,
    },
  });
}

// POST /api/v1/handover
// Accepts HandoverEntry fields minus id/created_at
export async function POST(req: NextRequest) {
  let body: Partial<HandoverEntry>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    home_id = "home_oak",
    shift_date = todayStr(),
    shift_from,
    shift_to,
    handover_time = new Date().toTimeString().slice(0, 5),
    completed_at = null,
    outgoing_staff = [],
    incoming_staff = [],
    created_by = "staff_darren",
    signed_off_by = null,
    child_updates = [],
    general_notes = "",
    flags = [],
    linked_incident_ids = [],
  } = body;

  if (!shift_from || !shift_to) {
    return NextResponse.json({ error: "shift_from and shift_to are required" }, { status: 400 });
  }

  const newHandover: Partial<HandoverEntry> = {
    home_id,
    shift_date,
    shift_from,
    shift_to,
    handover_time,
    completed_at,
    outgoing_staff,
    incoming_staff,
    created_by,
    signed_off_by,
    child_updates,
    general_notes,
    flags,
    linked_incident_ids,
  };

  const created = db.handovers.create(newHandover);

  return NextResponse.json({ data: created }, { status: 201 });
}
