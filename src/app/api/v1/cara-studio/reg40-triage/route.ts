// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Reg 40 Triage  (Milestone 15)
//
// GET    ?home_id=&status= → triage queue (optionally filter by status)
// POST   { home_id, action: "scan" } → scan candidates and create pending rows
// POST   { triage_id, action: "notify"|"dismiss"|"escalate", ... } → decide
//
// Permission: cara.view_audit_logs for read; cara.approve_outputs for
// any decision (notify / dismiss / escalate is statutorily-significant).
// All decisions are appended to the live audit tail. Notification to
// Ofsted itself is NEVER auto-sent — the manager records the reference.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { appendCaraAudit } from "@/lib/cara/cara-audit-trail";
import {
  decideReg40Triage,
  loadReg40Queue,
  scanReg40Candidates,
  type Reg40DecisionAction,
} from "@/lib/cara/cara-reg40-triage";
import { db } from "@/lib/db/store";
import type { Reg40TriageStatus } from "@/types/cara-studio";

const DEFAULT_HOME_ID = "home_oak";
const DECISION_ACTIONS: Reg40DecisionAction[] = ["notify", "dismiss", "escalate"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  const status = searchParams.get("status") as Reg40TriageStatus | null;

  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view reg40 triage queue",
  });
  if (!guard.ok) return guard.response;

  return NextResponse.json({ data: loadReg40Queue(homeId, status ?? undefined) });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : null;

  // ── Action: scan ─────────────────────────────────────────────────────────
  if (action === "scan") {
    const homeId = typeof body.home_id === "string" ? body.home_id : DEFAULT_HOME_ID;
    const guard = requireCaraStudioPermission(req, body, {
      permission: "cara.generate_drafts",
      homeId,
      intent: "scan reg40 candidates",
    });
    if (!guard.ok) return guard.response;

    const created = scanReg40Candidates(homeId);
    for (const t of created) {
      await appendCaraAudit({
        homeId,
        actorId: guard.actor.userId,
        actionType: "artifact_generated",
        artifactId: t.id,
        sourceIds: [t.source_event_id],
        summary: `Reg 40 triage drafted: ${t.suggested_category} (${t.source_title})`,
      });
    }
    return NextResponse.json({ data: { created } });
  }

  // ── Action: decide ───────────────────────────────────────────────────────
  if (!DECISION_ACTIONS.includes(action as Reg40DecisionAction)) {
    return NextResponse.json(
      { error: "action must be one of: scan, notify, dismiss, escalate" },
      { status: 400 },
    );
  }

  const triageId = typeof body.triage_id === "string" ? body.triage_id : null;
  if (!triageId) {
    return NextResponse.json({ error: "triage_id is required" }, { status: 400 });
  }
  const existing = db.caraReg40Triages.findById(triageId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.approve_outputs",
    homeId: existing.home_id,
    childId: existing.child_id,
    intent: `reg40_decision:${action}`,
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const note = typeof body.note === "string" ? body.note : null;
  const notificationRef =
    typeof body.notification_ref === "string" ? body.notification_ref : null;

  const result = decideReg40Triage({
    triageId,
    action: action as Reg40DecisionAction,
    actorId: guard.actor.userId,
    note,
    notificationRef,
  });

  if ("code" in result) {
    if (result.code === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (result.code === "not_pending") {
      return NextResponse.json(
        { error: "Only pending triage rows can be decided" },
        { status: 409 },
      );
    }
    if (result.code === "notification_ref_required") {
      return NextResponse.json(
        { error: "notification_ref is required for action=notify" },
        { status: 422 },
      );
    }
    if (result.code === "reason_required") {
      return NextResponse.json(
        { error: "note (reason) is required for action=dismiss" },
        { status: 422 },
      );
    }
  }

  const decided = result as Exclude<typeof result, { code: string }>;
  await appendCaraAudit({
    homeId: existing.home_id,
    actorId: guard.actor.userId,
    actionType:
      action === "notify"
        ? "artifact_committed"
        : action === "dismiss"
          ? "artifact_rejected"
          : "changes_requested",
    artifactId: decided.id,
    sourceIds: [decided.source_event_id],
    summary: `Reg 40 ${decided.status}: ${decided.suggested_category}${
      decided.notification_ref ? ` (ref ${decided.notification_ref})` : ""
    }`,
    after: {
      status: decided.status,
      notification_ref: decided.notification_ref,
      decision_note: decided.decision_note,
    },
  });

  return NextResponse.json({ data: decided });
}
