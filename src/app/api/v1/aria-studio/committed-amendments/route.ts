// ══════════════════════════════════════════════════════════════════════════════
// API — ARIA Committed Record Amendments  (Milestone 13)
//
// GET    ?record_id=… → return the version history (oldest → newest)
// POST   → amend a committed record (creates a new version)
//
// Permission: aria.commit_to_records. Safeguarding-sensitive record
// types (risk_update, incident_summary, behaviour_note) also require
// the stricter approve_outputs path via isSafeguardingSensitive.
// Every successful amendment is appended to the live audit tail.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { appendAriaAudit } from "@/lib/aria/aria-audit-trail";
import {
  amendCommittedRecord,
  loadCommittedVersionHistory,
} from "@/lib/aria/aria-committed-amendments";
import { isSafeguardingSensitiveRecordType } from "@/lib/aria/aria-suggested-records";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const recordId = searchParams.get("record_id");
  if (!recordId) {
    return NextResponse.json({ error: "record_id is required" }, { status: 400 });
  }
  return NextResponse.json({ data: loadCommittedVersionHistory(recordId) });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const recordId = typeof body.record_id === "string" ? body.record_id : null;
  const reason = typeof body.amendment_reason === "string" ? body.amendment_reason : "";
  if (!recordId) {
    return NextResponse.json({ error: "record_id is required" }, { status: 400 });
  }
  if (!reason.trim()) {
    return NextResponse.json(
      { error: "amendment_reason is required" },
      { status: 422 },
    );
  }

  const existing = db.ariaCommittedRecords.findById(recordId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!existing.is_current_version) {
    return NextResponse.json(
      { error: "Only the current version can be amended" },
      { status: 409 },
    );
  }

  const homeId = existing.home_id ?? DEFAULT_HOME_ID;
  const sensitive = isSafeguardingSensitiveRecordType(existing.record_type);

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.commit_to_records",
    homeId,
    childId: existing.child_id,
    intent: `amend committed_record:${existing.record_type}`,
    isSafeguardingSensitive: sensitive,
  });
  if (!guard.ok) return guard.response;

  const newFields =
    body.new_fields && typeof body.new_fields === "object"
      ? (body.new_fields as Record<string, string | number | boolean | null>)
      : undefined;

  const result = amendCommittedRecord({
    recordId,
    newTitle: typeof body.new_title === "string" ? body.new_title : undefined,
    newBody: typeof body.new_body === "string" ? body.new_body : undefined,
    newFields,
    amendmentReason: reason,
    actorId: guard.actor.userId,
  });

  if ("code" in result) {
    switch (result.code) {
      case "not_found":
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      case "not_current":
        return NextResponse.json(
          { error: "Only the current version can be amended" },
          { status: 409 },
        );
      case "reason_required":
        return NextResponse.json(
          { error: "amendment_reason is required" },
          { status: 422 },
        );
      case "no_changes":
        return NextResponse.json(
          { error: "Amendment must change title, body or at least one field" },
          { status: 422 },
        );
    }
  }

  appendAriaAudit({
    homeId,
    actorId: guard.actor.userId,
    actionType: "artifact_edited",
    artifactId: result.current.id,
    sourceIds: [result.previous.id],
    summary: `Amended ${existing.record_type} v${result.previous.version} → v${result.current.version}: ${reason.trim()}`,
    before: { title: result.previous.title, body: result.previous.body },
    after: {
      version: result.current.version,
      previous_version_id: result.current.previous_version_id,
      requires_manager_review: result.current.amendment_requires_manager_review,
      diff: result.diff,
    },
  });

  return NextResponse.json({ data: result });
}
