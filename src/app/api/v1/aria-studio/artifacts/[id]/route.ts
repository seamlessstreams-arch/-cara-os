import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import {
  submitArtifactForReview,
  approveArtifact,
  requestChanges,
  rejectArtifact,
  commitArtifact,
  editArtifact,
} from "@/lib/aria/aria-studio-service";
import { runQualityCheck } from "@/lib/aria/aria-studio-quality";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import type { AriaPermission } from "@/lib/aria/aria-permissions";

type Params = { params: Promise<{ id: string }> };

// Maps a PATCH `action` to the permission required to perform it.
function permissionForAction(action: string): AriaPermission {
  switch (action) {
    case "submit":           return "aria.generate_drafts";
    case "approve":          return "aria.approve_outputs";
    case "request_changes":  return "aria.approve_outputs";
    case "reject":           return "aria.reject_outputs";
    case "commit":           return "aria.commit_to_records";
    case "quality_check":    return "aria.approve_outputs";
    case "archive":          return "aria.commit_to_records";
    case "recover":          return "aria.commit_to_records";
    case "edit":             return "aria.rewrite";
    default:                  return "aria.rewrite";
  }
}

// GET /api/v1/aria-studio/artifacts/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const artifact = db.ariaArtifacts.findById(id);
  if (!artifact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const versions = db.ariaArtifactVersions.findByArtifact(id);
  const reviews = db.ariaArtifactReviews.findByArtifact(id);
  const actions = db.ariaArtifactActions.findByArtifact(id);
  const qualityChecks = db.ariaQualityChecks.findByArtifact(id);
  const auditLog = db.ariaStudioAuditLog.findByArtifact(id);
  const sources = db.ariaSources.findByIds(artifact.source_ids);

  return NextResponse.json({
    data: artifact,
    related: { versions, reviews, actions, qualityChecks, auditLog, sources },
  });
}

// PATCH /api/v1/aria-studio/artifacts/[id]
// Handles: edit, submit, approve, changes_requested, reject, commit, archive, quality_check
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const artifact = db.ariaArtifacts.findById(id);
  if (!artifact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action as string;
  const actorId = (body.actor_id as string) ?? "staff_unknown";

  const resolvedAction =
    typeof action === "string" && action.length > 0
      ? action
      : body.generated_content !== undefined
        ? "edit"
        : "patch";

  const guard = requireAriaStudioPermission(req, body, {
    permission: permissionForAction(resolvedAction),
    homeId: artifact.home_id,
    childId: artifact.child_id,
    isSafeguardingSensitive: artifact.safeguarding_level === "high",
    intent: `${resolvedAction} ${id}`,
  });
  if (!guard.ok) return guard.response;

  // ── Workflow actions ────────────────────────────────────────────────────────
  if (action === "submit") {
    const updated = submitArtifactForReview(id, actorId);
    if (!updated) return NextResponse.json({ error: "Cannot submit in current status" }, { status: 422 });
    return NextResponse.json({ data: updated });
  }

  if (action === "approve") {
    const updated = approveArtifact(id, actorId, body.comment as string | undefined);
    if (!updated) return NextResponse.json({ error: "Cannot approve in current status" }, { status: 422 });
    return NextResponse.json({ data: updated });
  }

  if (action === "request_changes") {
    if (!body.changes) return NextResponse.json({ error: "changes field required" }, { status: 400 });
    const updated = requestChanges(id, actorId, body.changes as string);
    if (!updated) return NextResponse.json({ error: "Cannot request changes in current status" }, { status: 422 });
    return NextResponse.json({ data: updated });
  }

  if (action === "reject") {
    if (!body.reason) return NextResponse.json({ error: "reason field required" }, { status: 400 });
    const updated = rejectArtifact(id, actorId, body.reason as string);
    if (!updated) return NextResponse.json({ error: "Cannot reject in current status" }, { status: 422 });
    return NextResponse.json({ data: updated });
  }

  if (action === "commit") {
    // Run quality check first
    const qc = runQualityCheck(artifact);
    if (!qc.overall_passed) {
      return NextResponse.json({
        error: "Quality check failed — resolve issues before committing",
        qualityCheck: qc,
      }, { status: 422 });
    }
    const updated = commitArtifact(id, actorId);
    if (!updated) return NextResponse.json({ error: "Cannot commit in current status" }, { status: 422 });
    return NextResponse.json({ data: updated, qualityCheck: qc });
  }

  if (action === "quality_check") {
    const qc = runQualityCheck(artifact);
    const refreshed = db.ariaArtifacts.findById(id);
    return NextResponse.json({ data: refreshed, qualityCheck: qc });
  }

  if (action === "archive") {
    const updated = db.ariaArtifacts.patch(id, {
      status: "archived",
      archived_at: new Date().toISOString(),
    });
    db.ariaStudioAuditLog.create({
      home_id: artifact.home_id,
      actor_id: actorId,
      action_type: "artifact_archived",
      artifact_id: id,
      source_ids: artifact.source_ids,
      prompt_summary: null,
      model_provider: null,
      model_name: null,
      before_state: { status: artifact.status },
      after_state: { status: "archived" },
      ip_address: null,
    });
    return NextResponse.json({ data: updated });
  }

  if (action === "recover") {
    if (artifact.status !== "deleted_recoverable") {
      return NextResponse.json({ error: "Can only recover deleted artifacts" }, { status: 422 });
    }
    const updated = db.ariaArtifacts.patch(id, { status: "draft" });
    db.ariaStudioAuditLog.create({
      home_id: artifact.home_id,
      actor_id: actorId,
      action_type: "artifact_recovered",
      artifact_id: id,
      source_ids: artifact.source_ids,
      prompt_summary: null,
      model_provider: null,
      model_name: null,
      before_state: { status: "deleted_recoverable" },
      after_state: { status: "draft" },
      ip_address: null,
    });
    return NextResponse.json({ data: updated });
  }

  // ── Edit content ─────────────────────────────────────────────────────────────
  if (action === "edit" || body.generated_content !== undefined) {
    const newContent = body.generated_content as string;
    const changeSummary = (body.change_summary as string) ?? "Content edited";
    const updated = editArtifact(id, actorId, newContent, changeSummary);
    if (!updated) return NextResponse.json({ error: "Cannot edit in current status" }, { status: 422 });
    return NextResponse.json({ data: updated });
  }

  // ── Generic patch (title, framework, tone, etc.) ──────────────────────────
  const allowedFields = ["title", "framework", "tone", "creative_mode", "child_id",
    "linked_record_id", "linked_record_type", "amendment_reason"] as const;
  const patchData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) patchData[field] = body[field];
  }

  if (Object.keys(patchData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = db.ariaArtifacts.patch(id, patchData as never);
  return NextResponse.json({ data: updated });
}

// DELETE /api/v1/aria-studio/artifacts/[id]
// Soft delete — marks as deleted_recoverable
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const artifact = db.ariaArtifacts.findById(id);
  if (!artifact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (artifact.status === "committed") {
    return NextResponse.json({ error: "Committed artifacts cannot be deleted" }, { status: 422 });
  }

  const guard = requireAriaStudioPermission(req, null, {
    permission: "aria.commit_to_records",
    homeId: artifact.home_id,
    childId: artifact.child_id,
    intent: `delete ${id}`,
  });
  if (!guard.ok) return guard.response;

  const updated = db.ariaArtifacts.patch(id, { status: "deleted_recoverable" });
  db.ariaStudioAuditLog.create({
    home_id: artifact.home_id,
    actor_id: guard.actor.userId,
    action_type: "artifact_deleted",
    artifact_id: id,
    source_ids: artifact.source_ids,
    prompt_summary: null,
    model_provider: null,
    model_name: null,
    before_state: { status: artifact.status },
    after_state: { status: "deleted_recoverable" },
    ip_address: null,
  });

  return NextResponse.json({ data: updated });
}
