import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { buildReg40Queue, buildReg40NotifiableDraft } from "@/lib/care-events/compliance-queues";

export const dynamic = "force-dynamic";

// GET /api/v1/reg40-triage?status=&child_id=
// → care events requiring Reg 40 triage, presented as triage tasks + meta
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const events = db.careEvents.findForReg40();
  const result = buildReg40Queue(events, events.length, today, {
    status: sp.get("status"),
    child_id: sp.get("child_id"),
  });
  return NextResponse.json(result);
}

// PATCH /api/v1/reg40-triage  → manager records a triage decision.
// IMPORTANT: a "notify_ofsted" decision creates a *pending* notifiable event
// (queued in ofsted_status:"pending") for a human to review and submit — it
// NEVER auto-sends any Ofsted notification. Acting on it stays a human step.
export async function PATCH(req: NextRequest) {
  let body: {
    task_id?: string;
    action?: "complete" | "notify_ofsted" | "no_notification_required";
    completed_by?: string;
    evidence_note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.task_id) return NextResponse.json({ error: "task_id is required" }, { status: 400 });

  const note = [body.action ? `Reg40 triage: ${body.action}` : null, body.evidence_note]
    .filter(Boolean)
    .join(" — ") || null;

  const updated = db.careEvents.patch(body.task_id, {
    requires_reg40_triage: false,
    manager_id: body.completed_by ?? null,
    manager_review_at: new Date().toISOString(),
    manager_review_note: note,
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // A "notify_ofsted" triage decision queues a pending notifiable event for a
  // human to submit. This records intent only — it does not notify Ofsted.
  let notifiable_event_id: string | null = null;
  if (body.action === "notify_ofsted") {
    const draft = buildReg40NotifiableDraft(updated, {
      reportedBy: body.completed_by ?? "",
      note: body.evidence_note,
      today: new Date().toISOString().slice(0, 10),
    });
    notifiable_event_id = db.notifiableEvents.create(draft).id;
  }

  return NextResponse.json({ data: updated, notifiable_event_id });
}
