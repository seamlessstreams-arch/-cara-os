// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/orchestrate/approve
//
// Handles approval decisions for Cara-generated drafts. Only users with
// deputy_manager role or above can approve/reject/amend drafts.
//
// POST body: { sessionId, draftId, decision, notes?, commitTarget? }
// decision: 'approve' | 'reject' | 'amend'
// commitTarget: { recordType, recordId } — where to save the approved content
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { hasIntelligencePermission } from "@/lib/cara/intelligence-permissions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

// Roles that can approve drafts
const APPROVAL_ROLES = [
  "deputy_manager",
  "registered_manager",
  "ri",
  "operations",
  "director",
  "system_admin",
];

type ApprovalDecision = "approve" | "reject" | "amend";

interface ApprovalBody {
  sessionId: string;
  draftId: string;
  decision: ApprovalDecision;
  notes?: string;
  amendedContent?: string;
  commitTarget?: {
    recordType: string;
    recordId: string;
  };
  userId: string;
  role: string;
  homeId: string;
}

export async function POST(req: NextRequest) {
  let body: ApprovalBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Validate required fields ──────────────────────────────────────────────

  if (!body.sessionId || typeof body.sessionId !== "string") {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  if (!body.draftId || typeof body.draftId !== "string") {
    return NextResponse.json({ error: "draftId is required" }, { status: 400 });
  }

  if (!body.decision || !["approve", "reject", "amend"].includes(body.decision)) {
    return NextResponse.json(
      { error: "decision must be one of: approve, reject, amend" },
      { status: 400 },
    );
  }

  if (!body.userId || typeof body.userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (!body.role || typeof body.role !== "string") {
    return NextResponse.json({ error: "role is required" }, { status: 400 });
  }

  if (!body.homeId || typeof body.homeId !== "string") {
    return NextResponse.json({ error: "homeId is required" }, { status: 400 });
  }

  // ── Permission check ──────────────────────────────────────────────────────

  if (!APPROVAL_ROLES.includes(body.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions. Only deputy_manager or above can approve Cara drafts." },
      { status: 403 },
    );
  }

  if (!hasIntelligencePermission(body.role, "approveAiDraft")) {
    return NextResponse.json(
      { error: "Your role does not have the approveAiDraft permission." },
      { status: 403 },
    );
  }

  // For commit decisions, also check commitSuggestedUpdates permission
  if (body.decision === "approve" && body.commitTarget) {
    if (!hasIntelligencePermission(body.role, "commitSuggestedUpdates")) {
      return NextResponse.json(
        { error: "Your role does not have permission to commit suggested updates to records." },
        { status: 403 },
      );
    }
  }

  // ── Process the approval ──────────────────────────────────────────────────

  if (!isSupabaseEnabled()) {
    // Offline / demo mode — return a mock response
    return NextResponse.json({
      ok: true,
      data: {
        id: body.draftId,
        sessionId: body.sessionId,
        status: body.decision === "approve" ? "approved" : body.decision === "reject" ? "rejected" : "amended",
        approvedBy: body.userId,
        approvedAt: new Date().toISOString(),
        notes: body.notes ?? null,
        committedRecordType: body.commitTarget?.recordType ?? null,
        committedRecordId: body.commitTarget?.recordId ?? null,
      },
    });
  }

  const sb = createServerClient();
  if (!sb) {
    return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
  }

  // ── Fetch the existing draft ──────────────────────────────────────────────

  const { data: existingDraft, error: fetchError } = await (sb.from("aria_orchestration_approvals") as SB)
    .select("*")
    .eq("id", body.draftId)
    .eq("session_id", body.sessionId)
    .single();

  if (fetchError || !existingDraft) {
    return NextResponse.json(
      { error: "Draft not found or does not belong to the specified session." },
      { status: 404 },
    );
  }

  // ── Verify session belongs to this home ───────────────────────────────────

  const { data: session, error: sessionError } = await (sb.from("aria_sessions") as SB)
    .select("id, home_id")
    .eq("id", body.sessionId)
    .eq("home_id", body.homeId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Session not found or does not belong to your home." },
      { status: 403 },
    );
  }

  // ── Check draft is in a decidable state ───────────────────────────────────

  if (existingDraft.status !== "draft" && existingDraft.status !== "amended") {
    return NextResponse.json(
      { error: `Cannot apply decision: draft is already in '${existingDraft.status}' state.` },
      { status: 409 },
    );
  }

  // ── Map decision to status ────────────────────────────────────────────────

  const newStatus: string =
    body.decision === "approve" ? "approved" :
    body.decision === "reject" ? "rejected" :
    "amended";

  // ── Build the update payload ──────────────────────────────────────────────

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    approved_by: body.userId,
    approval_notes: body.notes?.slice(0, 2000) ?? null,
    approved_at: new Date().toISOString(),
  };

  // If amending, update the draft content
  if (body.decision === "amend" && body.amendedContent) {
    updatePayload.draft_content = body.amendedContent;
  }

  // If approving with a commit target, record where it was committed
  if (body.decision === "approve" && body.commitTarget) {
    updatePayload.committed_record_type = body.commitTarget.recordType;
    updatePayload.committed_record_id = body.commitTarget.recordId;
  }

  // ── Apply the update ──────────────────────────────────────────────────────

  const { data: updatedDraft, error: updateError } = await (sb.from("aria_orchestration_approvals") as SB)
    .update(updatePayload)
    .eq("id", body.draftId)
    .select("*")
    .single();

  if (updateError || !updatedDraft) {
    console.error("[api/cara/orchestrate/approve] Update failed:", updateError?.message);
    return NextResponse.json(
      { error: "Failed to apply approval decision." },
      { status: 500 },
    );
  }

  // ── Write audit event ─────────────────────────────────────────────────────

  try {
    await (sb.from("aria_orchestrator_audit") as SB).insert({
      home_id: body.homeId,
      user_id: body.userId,
      agent_id: "approval-workflow",
      risk_level: "low",
      task_type: "approval",
      model_profile: "none",
      status: "completed",
      query_summary: `${body.decision} draft ${body.draftId}`,
      confidence: 1.0,
      evidence_count: 0,
      safety_blocked: false,
      safety_warnings: [],
      safety_notes: [],
      source_page: null,
      created_at: new Date().toISOString(),
    });
  } catch (auditErr) {
    // Non-fatal — the approval itself succeeded
    console.error("[api/cara/orchestrate/approve] Audit write failed:", auditErr);
  }

  // ── Update session status if escalated ────────────────────────────────────

  if (body.decision === "reject") {
    await (sb.from("aria_sessions") as SB)
      .update({ status: "escalated" })
      .eq("id", body.sessionId);
  }

  // ── Return result ─────────────────────────────────────────────────────────

  return NextResponse.json({
    ok: true,
    data: {
      id: updatedDraft.id,
      sessionId: updatedDraft.session_id,
      status: updatedDraft.status,
      approvedBy: updatedDraft.approved_by,
      approvedAt: updatedDraft.approved_at,
      notes: updatedDraft.approval_notes,
      committedRecordType: updatedDraft.committed_record_type,
      committedRecordId: updatedDraft.committed_record_id,
      draftContent: updatedDraft.draft_content,
    },
  });
}
