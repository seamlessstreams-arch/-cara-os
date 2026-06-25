import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { createTaskRecord } from "@/lib/supabase/care-records";
import { resolveCommsUser, auditComms } from "@/lib/comms/comms-service";
import { captureDomainEvent } from "@/lib/event-capture/capture-event-service";
import { ACTION_EVENT_MAP } from "@/lib/comms/comms-governance";
import { persistCommsMessage, persistCommsMessageAction } from "@/lib/supabase/comms";
import type { CommsMessageActionType } from "@/types/comms";

export const dynamic = "force-dynamic";

// POST /api/v1/comms/messages/[id]/convert
//
// Capture-once governance: turn a message into a FORMAL record (validated/deduped
// once on the Cara event spine) or a task, then link it back to the source
// message so the chat shows "recorded as …" — no hidden second record. Purely
// additive: the message is never deleted and external notifications are never sent.
//
// Anyone who can see a message may escalate it into a record (a safeguarding good);
// every conversion is attributed and audited. Frozen (held) messages are blocked.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await resolveCommsUser(req);
  const msg = db.commsMessages.findById(id);
  if (!msg || msg.is_deleted) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  if (msg.investigation_hold) {
    return NextResponse.json(
      { error: "Message is under investigation hold and cannot be converted until released" },
      { status: 423 },
    );
  }

  let body: {
    action_type?: CommsMessageActionType;
    child_id?: string | null;
    summary?: string;
    task_title?: string;
    task_priority?: "low" | "medium" | "high" | "urgent";
    due_date?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const actionType = body.action_type;
  if (!actionType || !(actionType in ACTION_EVENT_MAP)) {
    return NextResponse.json({ error: "Unknown or missing action_type" }, { status: 400 });
  }
  const mapping = ACTION_EVENT_MAP[actionType];

  const childId = body.child_id ?? msg.linked_child_id ?? null;
  if (mapping.requiresChild && !childId) {
    return NextResponse.json({ error: `${mapping.label} must be linked to a child` }, { status: 400 });
  }

  const now = new Date().toISOString();
  const summary = (body.summary?.trim() || msg.body).slice(0, 200);
  const eventType = mapping.eventType;

  let targetRecordId: string | null = null;
  let createdTask: unknown = null;
  let captureOutcome: unknown = null;

  if (eventType === null) {
    // ── Convert to a task ─────────────────────────────────────────────────────
    const task = createTaskRecord({
      title: (body.task_title?.trim() || summary).slice(0, 120),
      description: `Created from a Comms Centre message.\n\n"${msg.body}"`,
      category: mapping.taskCategory,
      priority: body.task_priority ?? "medium",
      status: "not_started",
      due_date: body.due_date ?? null,
      linked_child_id: childId,
      linked_incident_id: msg.linked_incident_id ?? null,
      home_id: user.home_id,
      created_by: user.id,
      updated_by: user.id,
      tags: ["comms_conversion"],
    });
    targetRecordId = task.id;
    createdTask = task;
  } else {
    // ── Convert to a canonical event (validated + deduped once) ───────────────
    // Idempotent by id: re-converting the same message to the same record type
    // upserts the same event rather than creating a duplicate.
    let outcome;
    try {
      outcome = captureDomainEvent(
        {
          eventType,
          summary,
          homeId: user.home_id,
          childId: childId ?? undefined,
          staffId: user.id,
          createdBy: user.id,
          occurredAt: msg.created_at,
          riskLevel: mapping.riskLevel,
          structuredTags: ["comms_conversion", actionType],
        },
        { id: `evt_cap_${msg.id}_${actionType}`, now },
      );
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Could not capture record" },
        { status: 500 },
      );
    }
    captureOutcome = outcome;
    if (outcome.persisted && outcome.event) {
      targetRecordId = outcome.event.id;
    } else {
      // Held (validation issue / suspected duplicate) — don't link a phantom record.
      const issueReason = outcome.validation?.issues
        ?.filter((i) => i.severity === "error")
        .map((i) => i.message)
        .join(" ");
      const reason = outcome.hold_reason || issueReason || "This record could not be captured.";
      return NextResponse.json(
        { data: { converted: false, action_type: actionType, reason, capture: outcome, hold_reason: outcome.hold_reason } },
        { status: 200 },
      );
    }
  }

  // Record the conversion + stamp the link back on the message.
  const action = db.commsMessageActions.create({
    message_id: msg.id,
    action_type: actionType,
    target_record_id: targetRecordId,
    created_by: user.id,
  });
  const updated = db.commsMessages.patch(msg.id, {
    linked_record_type: mapping.linkedRecordType,
    linked_record_id: targetRecordId,
  });

  auditComms("message_converted", user, msg.id, {
    action_type: actionType,
    event_type: eventType,
    target_record_id: targetRecordId,
  });
  void persistCommsMessageAction(action);
  if (updated) void persistCommsMessage(updated);

  return NextResponse.json(
    {
      data: {
        converted: true,
        action_type: actionType,
        action,
        target_record_id: targetRecordId,
        message: updated,
        task: createdTask,
        capture: captureOutcome,
      },
    },
    { status: 201 },
  );
}
