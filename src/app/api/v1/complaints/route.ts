import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import { generateId } from "@/lib/utils";

// Working-day calculator
function addWorkingDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const open   = req.nextUrl.searchParams.get("open") === "true";

  const records = open
    ? intelligenceDb.complaints.findOpen(homeId)
    : intelligenceDb.complaints.findAll(homeId);

  const today    = new Date().toISOString().split("T")[0];
  const overdue  = records.filter((r) => r.status !== "closed" && r.response_due < today).length;
  const dueToday = records.filter((r) => r.status !== "closed" && r.response_due === today).length;
  const openCount = records.filter((r) => r.status !== "closed").length;

  return NextResponse.json({
    data: records,
    meta: { total: records.length, open: openCount, overdue, due_today: dueToday },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const dateReceived = body.date_received ?? new Date().toISOString().split("T")[0];
  const nextRef = `CMP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

  const record = intelligenceDb.complaints.create({
    home_id:                   body.home_id ?? "home_oak",
    reference:                 nextRef,
    child_id:                  body.child_id ?? null,
    complainant_type:          body.complainant_type ?? "young_person",
    complainant_name:          body.complainant_name ?? "",
    complainant_relationship:  body.complainant_relationship ?? null,
    date_received:             dateReceived,
    category:                  body.category ?? "other",
    stage:                     "stage_1",
    status:                    "received",
    summary:                   body.summary ?? "",
    full_detail:               body.full_detail ?? null,
    outcome:                   null,
    outcome_detail:            null,
    acknowledgement_due:       addWorkingDays(dateReceived, 3),
    response_due:              addWorkingDays(dateReceived, 10),
    acknowledged_at:           null,
    response_sent_at:          null,
    assigned_to:               body.assigned_to ?? null,
    investigation_notes:       null,
    lessons_learned:           null,
    learning_shared:           false,
    escalated_to_stage2_at:    null,
    escalated_reason:          null,
    ombudsman_reference:       null,
    timeline:                  [{
      date:        dateReceived,
      action:      "Complaint received",
      recorded_by: body.created_by ?? "staff_darren",
      note:        body.summary ?? null,
    }],
    includes_safeguarding_element: body.includes_safeguarding_element ?? false,
    linked_incident_id:        body.linked_incident_id ?? null,
    aria_summary:              null,
    created_by:                body.created_by ?? "staff_darren",
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
