import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { careEventsDb } from "@/lib/db";
import { processCareEvent, retryFailedRoutes } from "@/lib/care-events/processor";
import { buildRoutingPreview } from "@/lib/care-events/routing-engine";
import { generateId, todayStr } from "@/lib/utils";
import { getUserIdFromRequest, requirePermission, requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  SubmitCareEventPayload,
  VerifyCareEventPayload,
  ReturnCareEventPayload,
  AmendCareEventPayload,
  EvidencePrompt,
} from "@/types/care-events";

const HOME_ID = "home_oak";

// ── Notification helper ───────────────────────────────────────────────────────

async function createNotification(recipientId: string, title: string, body: string, link?: string) {
  if (!recipientId) return;
  await careEventsDb.notifications.create({
    home_id: HOME_ID,
    recipient_id: recipientId,
    title,
    body,
    action_url: link ?? null,
    type: "system" as never,
    priority: "normal",
    read: false,
    read_at: null,
    entity_type: "care_event",
    entity_id: null,
  });
}

// ── GET /api/v1/care-events/[id] ─────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await careEventsDb.careEvents.findById(id);

  if (!event) {
    return NextResponse.json({ error: "Care event not found" }, { status: 404 });
  }

  const [routes, auditLog] = await Promise.all([
    careEventsDb.careEventRoutes.findByCareEvent(id),
    careEventsDb.careEventAuditLog.findByCareEvent(id),
  ]);

  // Resolve names (still from in-memory staff/YP for now — will migrate separately)
  const staffMember = event.staff_id ? db.staff.findById(event.staff_id) : null;
  const youngPerson = event.child_id ? db.youngPeople.findById(event.child_id) : null;
  const verifier    = event.verified_by ? db.staff.findById(event.verified_by) : null;

  // Build version history chain (oldest first)
  const versionHistory: Array<{ id: string; version: number; amended_at: string | null; amendment_reason: string | null; amended_by_name: string | null }> = [];
  let cursor: { previous_version_id: string | null; version: number; amended_at: string | null; amendment_reason: string | null; amended_by: string | null } | null = event;
  while (cursor?.previous_version_id) {
    const prev = await careEventsDb.careEvents.findById(cursor.previous_version_id);
    if (!prev) break;
    const amendedByStaff = prev.amended_by ? db.staff.findById(prev.amended_by) : null;
    versionHistory.unshift({
      id: prev.id,
      version: prev.version,
      amended_at: prev.amended_at,
      amendment_reason: prev.amendment_reason,
      amended_by_name: amendedByStaff ? `${amendedByStaff.first_name} ${amendedByStaff.last_name}` : prev.amended_by,
    });
    cursor = prev;
  }

  return NextResponse.json({
    data: {
      ...event,
      routes,
      audit_log: auditLog,
      routing_preview: buildRoutingPreview(routes.map((r) => r.route_type)),
      staff_name:    staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : event.staff_id,
      child_name:    youngPerson ? `${youngPerson.first_name} ${youngPerson.last_name}` : event.child_id ?? null,
      verified_by_name: verifier ? `${verifier.first_name} ${verifier.last_name}` : event.verified_by ?? null,
      version_history: versionHistory,
    },
  });
}

// ── PATCH /api/v1/care-events/[id] ───────────────────────────────────────────
// body.action: "submit" | "verify" | "return" | "amend" | "lock" | "retry"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await careEventsDb.careEvents.findById(id);

  if (!event) {
    return NextResponse.json({ error: "Care event not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action as string | undefined;
  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  const actorId = getUserIdFromRequest(req);

  // Manager-only actions require APPROVE_FORMS permission
  if (["verify", "return", "lock"].includes(action)) {
    const auth = await requirePermissionAsync(req, PERMISSIONS.APPROVE_FORMS);
    if (auth instanceof NextResponse) return auth;
  }

  switch (action) {

    // ── SUBMIT ────────────────────────────────────────────────────────────────
    case "submit": {
      const submitBody = body as unknown as SubmitCareEventPayload;

      if (event.status !== "draft") {
        return NextResponse.json(
          { error: `Cannot submit an event with status '${event.status}'` },
          { status: 422 }
        );
      }

      // Validate required evidence prompts are answered
      const prompts = (event.evidence_prompts ?? []) as EvidencePrompt[];
      const unanswered = prompts
        .filter((p) => p.required && (!p.completed || !p.answer?.trim()))
        .map((p) => p.question);

      if (unanswered.length > 0) {
        return NextResponse.json(
          { error: "Required evidence prompts must be answered before submitting", unanswered_prompts: unanswered },
          { status: 422 }
        );
      }

      if (!submitBody.staff_signature) {
        return NextResponse.json(
          { error: "Staff signature is required to submit" },
          { status: 422 }
        );
      }

      // Update evidence prompt answers if supplied
      let updatedPrompts = prompts;
      if (submitBody.evidence_answers) {
        updatedPrompts = prompts.map((p) => {
          const answer = submitBody.evidence_answers?.[p.id];
          return answer !== undefined
            ? { ...p, completed: true, answer }
            : p;
        });
      }

      await careEventsDb.careEvents.patch(id, {
        status: "routing",
        evidence_prompts: updatedPrompts,
        staff_signature: true,
        submitted_at: new Date().toISOString(),
        submitted_by: actorId,
      });

      // Run routing processor (uses in-memory db internally — processor will be migrated separately)
      const freshEvent = await careEventsDb.careEvents.findById(id);
      if (!freshEvent) return NextResponse.json({ error: "Event lost during routing" }, { status: 500 });
      const result = processCareEvent(freshEvent);

      // Notify manager if routing failed
      if (result.routes_failed > 0) {
        const mgr = db.staff.findAll().find(
          (s) => s.role === "registered_manager"
        );
        if (mgr) {
          await createNotification(
            mgr.id,
            "Care event routing failed",
            `"${freshEvent.title}" failed to route ${result.routes_failed} area(s). Please retry.`,
            `/care-events/${id}`
          );
        }
      }

      const finalEvent = await careEventsDb.careEvents.findById(id);

      return NextResponse.json({
        data: finalEvent,
        result: {
          ...result,
          routing_summary_text: buildRoutingResultText(result),
          routes: await careEventsDb.careEventRoutes.findByCareEvent(id),
        },
      });
    }

    // ── VERIFY ────────────────────────────────────────────────────────────────
    case "verify": {
      const verifyBody = body as unknown as VerifyCareEventPayload;

      const verifiableStatuses = ["routed", "manager_review_required", "routing_failed"];
      if (!verifiableStatuses.includes(event.status)) {
        return NextResponse.json(
          { error: `Cannot verify an event with status '${event.status}'` },
          { status: 422 }
        );
      }

      if (!verifyBody.manager_signature) {
        return NextResponse.json(
          { error: "Manager signature is required to verify" },
          { status: 422 }
        );
      }

      await careEventsDb.careEvents.patch(id, {
        status: "verified",
        manager_review_completed: true,
        manager_id: actorId,
        manager_signature: true,
        verified_at: new Date().toISOString(),
        verified_by: actorId,
        manager_notes: verifyBody.manager_notes ?? null,
      });

      // Approve pending Reg 45 evidence
      const reg45Items = (await careEventsDb.reg45EvidenceQueue.findAll())
        .filter((item) => item.care_event_id === id && item.manager_decision === "pending");
      await Promise.all(reg45Items.map((item) =>
        careEventsDb.reg45EvidenceQueue.patch(item.id, {
          manager_decision: "approved",
          reviewed_by: actorId,
          reviewed_at: new Date().toISOString(),
          manager_approved_text: item.suggested_text,
        })
      ));

      // Approve pending Annex A evidence
      const annexItems = (await careEventsDb.annexAEvidenceQueue.findAll())
        .filter((item) => item.care_event_id === id && item.manager_decision === "pending");
      await Promise.all(annexItems.map((item) =>
        careEventsDb.annexAEvidenceQueue.patch(item.id, {
          manager_decision: "approved",
          reviewed_by: actorId,
          reviewed_at: new Date().toISOString(),
          manager_approved_text: item.suggested_text,
        })
      ));

      await careEventsDb.careEventAuditLog.append({
        care_event_id: id,
        home_id: HOME_ID,
        action: "care_event_verified",
        actor_staff_id: actorId,
        actor_role: "manager",
        detail: { manager_notes: verifyBody.manager_notes, evidence_approved: reg45Items.length + annexItems.length },
        ip_address: null,
      });

      // Mark all filing cabinet items for this event as verified
      const filingItems = db.filingCabinet.findByCareEvent(id);
      const verifiedAt = new Date().toISOString();
      filingItems
        .filter((item) => !item.is_verified)
        .forEach((item) =>
          db.filingCabinet.patch(item.id, {
            is_verified: true,
            verified_at: verifiedAt,
            verified_by: actorId,
          })
        );

      // Notify the original staff member of verification
      if (event.staff_id && event.staff_id !== actorId) {
        await createNotification(
          event.staff_id,
          "Care entry verified",
          `Your entry "${event.title}" has been verified by the manager.${reg45Items.length + annexItems.length > 0 ? ` ${reg45Items.length + annexItems.length} evidence item(s) approved.` : ""}`,
          `/care-events/${id}`
        );
      }

      return NextResponse.json({ data: await careEventsDb.careEvents.findById(id) });
    }

    // ── RETURN ────────────────────────────────────────────────────────────────
    case "return": {
      const returnBody = body as unknown as ReturnCareEventPayload;

      if (!returnBody.return_reason?.trim()) {
        return NextResponse.json(
          { error: "return_reason is required when returning a record" },
          { status: 422 }
        );
      }

      const returnableStatuses = ["submitted", "routing", "routed", "manager_review_required"];
      if (!returnableStatuses.includes(event.status)) {
        return NextResponse.json(
          { error: `Cannot return an event with status '${event.status}'` },
          { status: 422 }
        );
      }

      await careEventsDb.careEvents.patch(id, {
        status: "returned",
        return_reason: returnBody.return_reason,
        returned_by: actorId,
        returned_at: new Date().toISOString(),
      });

      // Notify the original staff member
      if (event.staff_id && event.staff_id !== actorId) {
        await createNotification(
          event.staff_id,
          "Care entry returned",
          `Your entry "${event.title}" has been returned. Reason: ${returnBody.return_reason}`,
          `/care-events/${id}`
        );
      }

      // Pause evidence suggestions
      const pendingReg45 = (await careEventsDb.reg45EvidenceQueue.findAll())
        .filter((i) => i.care_event_id === id && i.manager_decision === "pending");
      await Promise.all(pendingReg45.map((item) =>
        careEventsDb.reg45EvidenceQueue.patch(item.id, { manager_decision: "deferred" })
      ));

      await careEventsDb.careEventAuditLog.append({
        care_event_id: id,
        home_id: HOME_ID,
        action: "care_event_returned",
        actor_staff_id: actorId,
        actor_role: "manager",
        detail: { reason: returnBody.return_reason },
        ip_address: null,
      });

      return NextResponse.json({ data: await careEventsDb.careEvents.findById(id) });
    }

    // ── AMEND ─────────────────────────────────────────────────────────────────
    case "amend": {
      const amendBody = body as unknown as AmendCareEventPayload;

      if (!amendBody.amendment_reason?.trim()) {
        return NextResponse.json(
          { error: "amendment_reason is required when amending a record" },
          { status: 422 }
        );
      }

      const amendableStatuses = ["verified", "locked", "returned"];
      if (!amendableStatuses.includes(event.status) && event.status !== "routed") {
        return NextResponse.json(
          { error: `Cannot amend an event with status '${event.status}'. Submit returns to manager first.` },
          { status: 422 }
        );
      }

      // Mark old version as superseded
      await careEventsDb.careEvents.patch(id, { is_current_version: false });

      // Create new version
      const newVersion = await careEventsDb.careEvents.create({
        child_id: event.child_id,
        shift_id: event.shift_id,
        staff_id: actorId,
        category: amendBody.category ?? event.category,
        title: amendBody.title ?? event.title,
        content: amendBody.content ?? event.content,
        mood_score: amendBody.mood_score !== undefined ? amendBody.mood_score : event.mood_score,
        is_significant: event.is_significant,
        event_date: event.event_date,
        event_time: event.event_time,
        status: "draft",
        requires_manager_review: true, // amendment always requires review
        requires_reg40_triage: event.requires_reg40_triage,
        contributes_to_reg45: event.contributes_to_reg45,
        contributes_to_annex_a: event.contributes_to_annex_a,
        is_safeguarding: event.is_safeguarding,
        evidence_prompts: event.evidence_prompts ?? [],
        previous_version_id: event.id,
        version: (event.version ?? 1) + 1,
        amendment_reason: amendBody.amendment_reason,
        amended_by: actorId,
        amended_at: new Date().toISOString(),
      });

      await careEventsDb.careEventAuditLog.append({
        care_event_id: id,
        home_id: HOME_ID,
        action: "care_event_amended",
        actor_staff_id: actorId,
        actor_role: null,
        detail: {
          new_version_id: newVersion.id,
          new_version: newVersion.version,
          amendment_reason: amendBody.amendment_reason,
        },
        ip_address: null,
      });

      // Notify manager that amendment requires review
      const manager = db.staff.findAll().find(
        (s) => s.role === "registered_manager"
      );
      if (manager && manager.id !== actorId) {
        await createNotification(
          manager.id,
          "Amendment requires review",
          `"${event.title}" has been amended (version ${newVersion.version}). Reason: ${amendBody.amendment_reason}`,
          `/care-events/${newVersion.id}`
        );
      }

      return NextResponse.json({ data: newVersion, previous_version_id: id }, { status: 201 });
    }

    // ── LOCK ──────────────────────────────────────────────────────────────────
    case "lock": {
      const lockableStatuses = ["verified"];
      if (!lockableStatuses.includes(event.status)) {
        return NextResponse.json(
          { error: `Only verified events can be locked` },
          { status: 422 }
        );
      }

      await careEventsDb.careEvents.patch(id, {
        status: "locked",
        locked_at: new Date().toISOString(),
        locked_by: actorId,
      });

      await careEventsDb.careEventAuditLog.append({
        care_event_id: id,
        home_id: HOME_ID,
        action: "care_event_locked",
        actor_staff_id: actorId,
        actor_role: "manager",
        detail: { locked_at: new Date().toISOString() },
        ip_address: null,
      });

      return NextResponse.json({ data: await careEventsDb.careEvents.findById(id) });
    }

    // ── RETRY FAILED ROUTES ───────────────────────────────────────────────────
    case "retry": {
      if (event.status !== "routing_failed") {
        return NextResponse.json(
          { error: "Only events with status routing_failed can be retried" },
          { status: 422 }
        );
      }

      const result = retryFailedRoutes(id);
      return NextResponse.json({ data: await careEventsDb.careEvents.findById(id), result });
    }

    // ── UPDATE EVIDENCE PROMPTS ───────────────────────────────────────────────
    case "update_prompts": {
      const answers = body.evidence_answers as Record<string, string> | undefined;
      if (!answers) {
        return NextResponse.json({ error: "evidence_answers required" }, { status: 400 });
      }

      const prompts = (event.evidence_prompts ?? []) as EvidencePrompt[];
      const updatedPrompts = prompts.map((p) => {
        const answer = answers[p.id];
        return answer !== undefined ? { ...p, completed: true, answer } : p;
      });

      await careEventsDb.careEvents.patch(id, { evidence_prompts: updatedPrompts });
      return NextResponse.json({ data: await careEventsDb.careEvents.findById(id) });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function buildRoutingResultText(result: {
  routes_completed: number;
  routes_failed: number;
  routes_skipped: number;
  routing_summary: {
    records_updated: number;
    tasks_created: number;
    reg45_count: number;
    annex_a_count: number;
    areas_updated: string[];
  };
}): string {
  const { routing_summary: s, routes_failed } = result;
  const parts: string[] = [];

  if (s.records_updated > 0) {
    parts.push(`updated ${s.records_updated} record${s.records_updated !== 1 ? "s" : ""}`);
  }
  if (s.tasks_created > 0) {
    parts.push(`created ${s.tasks_created} task${s.tasks_created !== 1 ? "s" : ""}`);
  }
  if (s.reg45_count > 0) {
    parts.push(`added ${s.reg45_count} Regulation 45 evidence suggestion${s.reg45_count !== 1 ? "s" : ""}`);
  }
  if (s.annex_a_count > 0) {
    parts.push(`updated Annex A evidence`);
  }
  if (routes_failed > 0) {
    parts.push(`${routes_failed} route${routes_failed !== 1 ? "s" : ""} failed (can be retried)`);
  }

  if (parts.length === 0) return "Entry saved.";

  return `This entry ${joinList(parts)}.`;
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
