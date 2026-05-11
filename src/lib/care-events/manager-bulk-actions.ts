// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Manager Bulk Actions  (Milestone 29 helper)
//
// Shared helpers used by the bulk Manager Verify Queue endpoint to perform
// verify or return on multiple care events safely. Per-event behaviour mirrors
// the per-event POST in src/app/api/v1/care-events/[id]/route.ts but is
// deliberately scoped to the operations the queue exposes.
//
// Returns per-id success/failure so the caller can render a partial result.
// Each operation is independent — one failure does not block the others.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { appendAriaAudit } from "@/lib/aria/aria-audit-trail";
import { upsertReg45EvidenceForCareEvent } from "@/lib/aria/aria-reg45-evidence";
import type { CareEventStatus } from "@/types/care-events";

const VERIFIABLE: ReadonlySet<CareEventStatus> = new Set<CareEventStatus>([
  "routed", "manager_review_required", "routing_failed",
]);
const RETURNABLE: ReadonlySet<CareEventStatus> = new Set<CareEventStatus>([
  "submitted", "routing", "routed", "manager_review_required",
]);

export interface BulkActionResultItem {
  care_event_id: string;
  ok: boolean;
  status?: CareEventStatus;
  error?: string;
}

export interface BulkActionResult {
  total: number;
  success: number;
  failed: number;
  items: BulkActionResultItem[];
}

function buildResult(items: BulkActionResultItem[]): BulkActionResult {
  const success = items.filter((i) => i.ok).length;
  return { total: items.length, success, failed: items.length - success, items };
}

// ── verify ────────────────────────────────────────────────────────────────────
export function verifyCareEventsBulk(
  homeId: string,
  ids: string[],
  actorId: string,
  opts: { manager_notes?: string | null } = {},
): BulkActionResult {
  const items: BulkActionResultItem[] = [];
  const verifiedAt = new Date().toISOString();

  for (const id of ids) {
    const e = db.careEvents.findById(id);
    if (!e) { items.push({ care_event_id: id, ok: false, error: "not_found" }); continue; }
    if (e.home_id !== homeId) { items.push({ care_event_id: id, ok: false, error: "wrong_home" }); continue; }
    if (!VERIFIABLE.has(e.status)) {
      items.push({ care_event_id: id, ok: false, error: `not_verifiable:${e.status}` });
      continue;
    }

    db.careEvents.patch(id, {
      status: "verified",
      manager_review_completed: true,
      manager_id: actorId,
      manager_signature: true,
      verified_at: verifiedAt,
      verified_by: actorId,
      manager_notes: opts.manager_notes ?? e.manager_notes ?? null,
    });

    // M32: verified care event flagged contributes_to_reg45 → distinct chip.
    // Created here so the post-verify accept-loop below picks it up and flips
    // it from ai_draft to accepted in the same transaction.
    if (e.contributes_to_reg45) {
      upsertReg45EvidenceForCareEvent(homeId, id);
    }

    // Approve pending Reg 45 evidence drafted from this event
    for (const item of db.ariaReg45EvidenceItems
      .findAll(homeId)
      .filter((r) => r.source_id === id && r.status === "ai_draft")) {
      db.ariaReg45EvidenceItems.patch(item.id, {
        status: "accepted",
        decided_by: actorId,
        decided_at: verifiedAt,
      });
    }

    // Approve pending Annex A evidence
    for (const item of db.annexAEvidenceQueue
      .findAll()
      .filter((a) => a.care_event_id === id && a.manager_decision === "pending")) {
      db.annexAEvidenceQueue.patch(item.id, {
        manager_decision: "approved",
        reviewed_by: actorId,
        reviewed_at: verifiedAt,
        manager_approved_text: item.suggested_text,
      });
    }

    // Mark filing items as verified
    for (const fc of db.filingCabinet.findByCareEvent(id).filter((f) => !f.is_verified)) {
      db.filingCabinet.patch(fc.id, {
        is_verified: true,
        verified_at: verifiedAt,
        verified_by: actorId,
      });
    }

    db.careEventAuditLog.append({
      care_event_id: id,
      home_id: homeId,
      action: "care_event_verified",
      actor_staff_id: actorId,
      actor_role: "manager",
      detail: { bulk: true, manager_notes: opts.manager_notes ?? null },
      ip_address: null,
    });

    appendAriaAudit({
      homeId,
      actorId,
      actionType: "artifact_committed",
      artifactId: id,
      sourceIds: [id],
      summary: `Bulk verify: care event "${e.title}"`,
      after: { status: "verified" },
    });

    items.push({ care_event_id: id, ok: true, status: "verified" });
  }

  return buildResult(items);
}

// ── return ────────────────────────────────────────────────────────────────────
export function returnCareEventsBulk(
  homeId: string,
  ids: string[],
  actorId: string,
  opts: { return_reason: string; manager_notes?: string | null },
): BulkActionResult {
  const items: BulkActionResultItem[] = [];
  if (!opts.return_reason?.trim()) {
    return buildResult(ids.map((id) => ({
      care_event_id: id, ok: false, error: "return_reason_required",
    })));
  }
  const returnedAt = new Date().toISOString();

  for (const id of ids) {
    const e = db.careEvents.findById(id);
    if (!e) { items.push({ care_event_id: id, ok: false, error: "not_found" }); continue; }
    if (e.home_id !== homeId) { items.push({ care_event_id: id, ok: false, error: "wrong_home" }); continue; }
    if (!RETURNABLE.has(e.status)) {
      items.push({ care_event_id: id, ok: false, error: `not_returnable:${e.status}` });
      continue;
    }

    db.careEvents.patch(id, {
      status: "returned",
      returned_at: returnedAt,
      returned_by: actorId,
      return_reason: opts.return_reason,
      manager_notes: opts.manager_notes ?? e.manager_notes ?? null,
    });

    db.careEventAuditLog.append({
      care_event_id: id,
      home_id: homeId,
      action: "care_event_returned",
      actor_staff_id: actorId,
      actor_role: "manager",
      detail: { bulk: true, return_reason: opts.return_reason },
      ip_address: null,
    });

    appendAriaAudit({
      homeId,
      actorId,
      actionType: "artifact_rejected",
      artifactId: id,
      sourceIds: [id],
      summary: `Bulk return: care event "${e.title}"`,
      after: { status: "returned", reason: opts.return_reason },
    });

    items.push({ care_event_id: id, ok: true, status: "returned" });
  }

  return buildResult(items);
}
