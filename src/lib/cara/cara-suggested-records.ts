// ══════════════════════════════════════════════════════════════════════════════
// Cara Studio — Suggested Records (Commit Queue)
//
// Cara proposes a record. A human edits if needed. An authorised human
// commits it to the official record (or rejects it). Until commit, the
// suggestion has no statutory weight. On commit, an immutable
// CaraCommittedRecord row is written; in production this writes to the
// appropriate domain table.
//
// Spec invariant: Cara drafts. Humans decide. Only authorised humans
// approve and commit to the official record.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import {
  CARA_SUGGESTED_RECORD_LABELS,
  type CaraCommittedRecord,
  type CaraSuggestedRecord,
  type CaraSuggestedRecordStatus,
  type CaraSuggestedRecordType,
  type CaraSuggestedSourceRef,
} from "@/types/cara-studio";

export interface ProposeSuggestedRecordInput {
  homeId: string;
  childId?: string | null;
  recordType: CaraSuggestedRecordType;
  suggestedTitle: string;
  suggestedBody: string;
  suggestedFields?: Record<string, string | number | boolean | null>;
  sourceEvidence?: CaraSuggestedSourceRef[];
  generatedBy: string;
  targetLabel?: string;
}

export function proposeSuggestedRecord(
  input: ProposeSuggestedRecordInput,
): CaraSuggestedRecord {
  return db.caraSuggestedRecords.create({
    home_id: input.homeId,
    child_id: input.childId ?? null,
    record_type: input.recordType,
    target_label: input.targetLabel ?? CARA_SUGGESTED_RECORD_LABELS[input.recordType],
    suggested_title: input.suggestedTitle,
    suggested_body: input.suggestedBody,
    suggested_fields: input.suggestedFields ?? {},
    source_evidence: input.sourceEvidence ?? [],
    status: "pending",
    generated_at: new Date().toISOString(),
    generated_by: input.generatedBy,
    decided_by: null,
    decided_at: null,
    decision_note: null,
    committed_record_id: null,
    committed_at: null,
    edits_count: 0,
  });
}

export interface SuggestedRecordEdits {
  suggestedTitle?: string;
  suggestedBody?: string;
  suggestedFields?: Record<string, string | number | boolean | null>;
}

export function editSuggestedRecord(
  id: string,
  edits: SuggestedRecordEdits,
): CaraSuggestedRecord | null {
  const existing = db.caraSuggestedRecords.findById(id);
  if (!existing) return null;
  if (existing.status !== "pending") return existing;

  return db.caraSuggestedRecords.patch(id, {
    suggested_title: edits.suggestedTitle ?? existing.suggested_title,
    suggested_body: edits.suggestedBody ?? existing.suggested_body,
    suggested_fields: edits.suggestedFields ?? existing.suggested_fields,
    edits_count: existing.edits_count + 1,
  });
}

export function rejectSuggestedRecord(
  id: string,
  actorId: string,
  note: string | null,
): CaraSuggestedRecord | null {
  const existing = db.caraSuggestedRecords.findById(id);
  if (!existing) return null;
  if (existing.status !== "pending") return existing;

  return db.caraSuggestedRecords.patch(id, {
    status: "rejected",
    decided_by: actorId,
    decided_at: new Date().toISOString(),
    decision_note: note,
  });
}

export interface CommitResult {
  suggestion: CaraSuggestedRecord;
  committed: CaraCommittedRecord;
}

export function commitSuggestedRecord(
  id: string,
  actorId: string,
  note: string | null,
): CommitResult | null {
  const existing = db.caraSuggestedRecords.findById(id);
  if (!existing) return null;
  if (existing.status !== "pending") return null;

  const now = new Date().toISOString();
  const committed = db.caraCommittedRecords.create({
    suggested_record_id: existing.id,
    home_id: existing.home_id,
    child_id: existing.child_id,
    record_type: existing.record_type,
    target_label: existing.target_label,
    title: existing.suggested_title,
    body: existing.suggested_body,
    fields: existing.suggested_fields,
    committed_by: actorId,
    committed_at: now,
    commit_note: note,
    version: 1,
    previous_version_id: null,
    is_current_version: true,
    amended_by: null,
    amended_at: null,
    amendment_reason: null,
    amendment_requires_manager_review: false,
    amendment_acknowledged_by: null,
    amendment_acknowledged_at: null,
  });

  const suggestion = db.caraSuggestedRecords.patch(id, {
    status: "committed",
    decided_by: actorId,
    decided_at: now,
    decision_note: note,
    committed_record_id: committed.id,
    committed_at: now,
  });

  return { suggestion: suggestion!, committed };
}

export function loadSuggestedRecords(
  homeId: string,
  status?: CaraSuggestedRecordStatus,
): CaraSuggestedRecord[] {
  const rows = status
    ? db.caraSuggestedRecords.findByStatus(homeId, status)
    : db.caraSuggestedRecords.findAll(homeId);
  return [...rows].sort((a, b) => b.generated_at.localeCompare(a.generated_at));
}

export function loadCommittedRecords(homeId: string): CaraCommittedRecord[] {
  return [...db.caraCommittedRecords.findAll(homeId)]
    .filter((c) => c.is_current_version)
    .sort((a, b) => b.committed_at.localeCompare(a.committed_at));
}

/**
 * Record types that are safeguarding-sensitive and require the stricter
 * approve_outputs RBAC path on commit. (For non-sensitive types, the
 * commit_to_records permission is sufficient.)
 */
export const SAFEGUARDING_SENSITIVE_RECORD_TYPES: CaraSuggestedRecordType[] = [
  "risk_update",
  "incident_summary",
  "behaviour_note",
];

export function isSafeguardingSensitiveRecordType(
  recordType: CaraSuggestedRecordType,
): boolean {
  return SAFEGUARDING_SENSITIVE_RECORD_TYPES.includes(recordType);
}
