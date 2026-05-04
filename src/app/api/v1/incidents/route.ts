import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { processIncidentCreated } from "@/lib/db/linked-updates";
import { todayStr, generateId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const childId = searchParams.get("child_id");
  const needsOversight = searchParams.get("needs_oversight") === "true";

  let results = db.incidents.findAll();
  if (status) results = results.filter((i) => i.status === status);
  if (childId) results = results.filter((i) => i.child_id === childId);
  if (needsOversight) results = results.filter((i) => i.requires_oversight && !i.oversight_by);

  return NextResponse.json({
    data: results.sort((a, b) => b.date.localeCompare(a.date)),
    meta: {
      total: results.length,
      open: results.filter((i) => i.status === "open").length,
      awaiting_oversight: results.filter((i) => i.requires_oversight && !i.oversight_by).length,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const now = new Date().toISOString();

  const incident = db.incidents.create({
    ...body,
    reference: `INC-2026-${String(db.incidents.findAll().length + 45).padStart(4, "0")}`,
    requires_oversight: true,
    oversight_note: null,
    oversight_by: null,
    oversight_at: null,
    status: "open",
    notifications: body.notifications || [],
    linked_task_ids: [],
    linked_document_ids: [],
    home_id: "home_oak",
    created_by: body.reported_by || "staff_darren",
    updated_by: body.reported_by || "staff_darren",
  });

  // Trigger all linked updates (chronology, task, handover, notification, daily log)
  processIncidentCreated(incident, incident.reported_by || "staff_darren");

  return NextResponse.json({ data: incident, linked_updates: ["chronology", "task", "handover", "daily_log", "notification"] }, { status: 201 });
}
