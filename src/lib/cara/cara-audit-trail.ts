// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — AUDIT TRAIL ENGINE (Milestone 11)
//
// Append-only audit log. Every successful Cara Studio action SHOULD call
// `appendCaraAudit` so the live tail viewer can show what happened, who
// did it, and to which record. Denied permission attempts are already
// audited inside `cara-studio-guard.ts`.
//
// Reads return newest-first and support filtering for the live tail UI.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { CaraAuditAction, CaraStudioAuditLog } from "@/types/cara-studio";

export interface AppendCaraAuditInput {
  homeId: string;
  actorId: string;
  actionType: CaraAuditAction;
  artifactId?: string | null;
  sourceIds?: string[];
  summary: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  modelProvider?: string | null;
  modelName?: string | null;
}

/**
 * Append a single audit entry. Best-effort — never throws into a route.
 */
export function appendCaraAudit(input: AppendCaraAuditInput): CaraStudioAuditLog | null {
  try {
    return db.caraStudioAuditLog.create({
      home_id: input.homeId,
      actor_id: input.actorId,
      action_type: input.actionType,
      artifact_id: input.artifactId ?? null,
      source_ids: input.sourceIds ?? [],
      prompt_summary: input.summary,
      model_provider: input.modelProvider ?? null,
      model_name: input.modelName ?? null,
      before_state: input.before ?? null,
      after_state: input.after ?? null,
      ip_address: null,
    });
  } catch {
    return null;
  }
}

export interface LoadAuditTrailOptions {
  actorId?: string;
  actionType?: CaraAuditAction;
  artifactId?: string;
  sinceIso?: string;
  limit?: number;
}

/**
 * Newest-first audit trail for a home with optional filters. Used by
 * the live tail viewer.
 */
export function loadAuditTrail(
  homeId: string,
  opts: LoadAuditTrailOptions = {},
): CaraStudioAuditLog[] {
  let rows = db.caraStudioAuditLog.findAll(homeId);

  if (opts.actorId) rows = rows.filter((r) => r.actor_id === opts.actorId);
  if (opts.actionType) rows = rows.filter((r) => r.action_type === opts.actionType);
  if (opts.artifactId) rows = rows.filter((r) => r.artifact_id === opts.artifactId);
  if (opts.sinceIso) {
    const since = opts.sinceIso;
    rows = rows.filter((r) => r.created_at >= since);
  }

  const sorted = [...rows].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const limit = opts.limit ?? 200;
  return sorted.slice(0, limit);
}

/**
 * Distinct actor ids seen in the home's audit trail. Used by the
 * filter dropdown in the live tail UI.
 */
export function loadAuditActors(homeId: string): string[] {
  const rows = db.caraStudioAuditLog.findAll(homeId);
  return Array.from(new Set(rows.map((r) => r.actor_id))).sort();
}

/**
 * Stable, human-readable label for an audit action type.
 */
export const CARA_AUDIT_ACTION_LABELS: Record<CaraAuditAction, string> = {
  source_indexed: "Source indexed",
  artifact_generated: "Draft generated",
  artifact_edited: "Draft edited",
  artifact_submitted: "Submitted for review",
  artifact_reviewed: "Reviewed",
  changes_requested: "Changes requested",
  artifact_approved: "Approved",
  artifact_rejected: "Rejected",
  artifact_committed: "Committed to record",
  artifact_archived: "Archived",
  artifact_deleted: "Deleted",
  artifact_recovered: "Recovered",
  task_created: "Task created",
  quality_check_completed: "Quality check completed",
  safeguarding_alert_created: "Safeguarding alert created",
  evidence_gap_detected: "Evidence gap detected",
  contradiction_detected: "Contradiction detected",
};
