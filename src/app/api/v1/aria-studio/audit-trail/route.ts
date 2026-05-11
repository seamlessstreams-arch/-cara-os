// ══════════════════════════════════════════════════════════════════════════════
// API — ARIA Audit Trail (Live Tail Viewer) — Milestone 11
//
// GET only. Read-only timeline. Append-only writes happen inside other
// routes via `appendAriaAudit()`. Gated by `aria.view_audit_logs`.
//
// Query params:
//   ?home_id      (default home_oak)
//   ?actor_id     filter by actor
//   ?action_type  filter by AriaAuditAction
//   ?artifact_id  filter by artifact id
//   ?since        ISO timestamp; only entries created at or after
//   ?limit        default 200, capped at 500
//   ?actors=1     instead of entries, return distinct actor ids
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import { loadAuditTrail, loadAuditActors } from "@/lib/aria/aria-audit-trail";
import type { AriaAuditAction } from "@/types/aria-studio";

const DEFAULT_HOME_ID = "home_oak";

const VALID_ACTIONS: ReadonlySet<AriaAuditAction> = new Set<AriaAuditAction>([
  "source_indexed",
  "artifact_generated",
  "artifact_edited",
  "artifact_submitted",
  "artifact_reviewed",
  "changes_requested",
  "artifact_approved",
  "artifact_rejected",
  "artifact_committed",
  "artifact_archived",
  "artifact_deleted",
  "artifact_recovered",
  "task_created",
  "quality_check_completed",
  "safeguarding_alert_created",
  "evidence_gap_detected",
  "contradiction_detected",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;

  const guard = requireAriaStudioPermission(req, null, {
    permission: "aria.view_audit_logs",
    homeId,
    intent: "read aria_audit_trail",
  });
  if (!guard.ok) return guard.response;

  if (searchParams.get("actors") === "1") {
    return NextResponse.json({ data: loadAuditActors(homeId) });
  }

  const actorId = searchParams.get("actor_id") ?? undefined;
  const actionRaw = searchParams.get("action_type");
  const actionType =
    actionRaw && VALID_ACTIONS.has(actionRaw as AriaAuditAction)
      ? (actionRaw as AriaAuditAction)
      : undefined;
  const artifactId = searchParams.get("artifact_id") ?? undefined;
  const sinceIso = searchParams.get("since") ?? undefined;
  const limitRaw = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 200;

  const data = loadAuditTrail(homeId, {
    actorId,
    actionType,
    artifactId,
    sinceIso,
    limit,
  });
  return NextResponse.json({ data });
}
