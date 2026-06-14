// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — COMMITTED RECORD AMENDMENTS  (Milestone 13)
//
// Committed records are immutable. The only safe way to change a
// committed record is a formal amendment that:
//
//   1. Creates a NEW version row (version = previous + 1).
//   2. Preserves the old version (is_current_version = false).
//   3. Captures an amendment_reason from the human.
//   4. Flags amendment_requires_manager_review for safeguarding-sensitive
//      record types (risk_update, incident_summary, behaviour_note).
//   5. Updates the parent suggestion's committed_record_id to the new
//      head so consumers always link to the current version.
//
// Spec invariant: Cara drafts. Humans decide. The original verified
// record is never overwritten — every version is preserved.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { CaraCommittedRecord } from "@/types/cara-studio";
import { isSafeguardingSensitiveRecordType } from "@/lib/cara/cara-suggested-records";

export interface AmendCommittedRecordInput {
  recordId: string;
  newTitle?: string;
  newBody?: string;
  newFields?: Record<string, string | number | boolean | null>;
  amendmentReason: string;
  actorId: string;
}

export interface AmendCommittedRecordResult {
  previous: CaraCommittedRecord;
  current: CaraCommittedRecord;
  diff: AmendmentDiff;
}

export interface AmendmentDiff {
  title_changed: boolean;
  body_changed: boolean;
  field_keys_changed: string[];
}

export type AmendCommittedError =
  | { code: "not_found" }
  | { code: "not_current"; record: CaraCommittedRecord }
  | { code: "reason_required" }
  | { code: "no_changes" };

function diffOf(
  previous: CaraCommittedRecord,
  newTitle: string,
  newBody: string,
  newFields: Record<string, string | number | boolean | null>,
): AmendmentDiff {
  const keys = new Set([...Object.keys(previous.fields), ...Object.keys(newFields)]);
  const fieldKeysChanged: string[] = [];
  for (const k of keys) {
    if (previous.fields[k] !== newFields[k]) fieldKeysChanged.push(k);
  }
  return {
    title_changed: previous.title !== newTitle,
    body_changed: previous.body !== newBody,
    field_keys_changed: fieldKeysChanged,
  };
}

/**
 * Amend a committed record. Returns the new current version on success
 * or a typed error code on refusal.
 */
export function amendCommittedRecord(
  input: AmendCommittedRecordInput,
): AmendCommittedRecordResult | AmendCommittedError {
  const previous = db.caraCommittedRecords.findById(input.recordId);
  if (!previous) return { code: "not_found" };
  if (!previous.is_current_version) return { code: "not_current", record: previous };
  if (!input.amendmentReason.trim()) return { code: "reason_required" };

  const newTitle = input.newTitle ?? previous.title;
  const newBody = input.newBody ?? previous.body;
  const newFields = input.newFields ?? previous.fields;
  const diff = diffOf(previous, newTitle, newBody, newFields);
  if (!diff.title_changed && !diff.body_changed && diff.field_keys_changed.length === 0) {
    return { code: "no_changes" };
  }

  // Mark the old row as superseded — accomplished by patching its
  // is_current_version flag via the underlying array.
  const all = db.caraCommittedRecords.findAll();
  const idx = all.indexOf(previous);
  if (idx >= 0) {
    all[idx] = { ...previous, is_current_version: false };
  }
  const supersededPrevious = all[idx] ?? previous;

  const now = new Date().toISOString();
  const current = db.caraCommittedRecords.create({
    suggested_record_id: previous.suggested_record_id,
    home_id: previous.home_id,
    child_id: previous.child_id,
    record_type: previous.record_type,
    target_label: previous.target_label,
    title: newTitle,
    body: newBody,
    fields: newFields,
    committed_by: previous.committed_by,
    committed_at: previous.committed_at,
    commit_note: previous.commit_note,
    version: previous.version + 1,
    previous_version_id: previous.id,
    is_current_version: true,
    amended_by: input.actorId,
    amended_at: now,
    amendment_reason: input.amendmentReason.trim(),
    amendment_requires_manager_review: isSafeguardingSensitiveRecordType(
      previous.record_type,
    ),
    amendment_acknowledged_by: null,
    amendment_acknowledged_at: null,
  });

  // Re-point the parent suggestion to the new head.
  if (previous.suggested_record_id) {
    db.caraSuggestedRecords.patch(previous.suggested_record_id, {
      committed_record_id: current.id,
    });
  }

  return { previous: supersededPrevious, current, diff };
}

/**
 * Full version history for a committed record (oldest → newest).
 * Accepts the id of any version in the chain.
 */
export function loadCommittedVersionHistory(
  recordId: string,
): CaraCommittedRecord[] {
  const seed = db.caraCommittedRecords.findById(recordId);
  if (!seed) return [];

  const all = db.caraCommittedRecords.findAll();
  // Walk forward to find current head from any node with same suggested_record_id
  const chain = all.filter(
    (c) => c.suggested_record_id === seed.suggested_record_id,
  );
  return [...chain].sort((a, b) => a.version - b.version);
}

/**
 * Manager acknowledges a safeguarding-sensitive amendment that was
 * flagged for review. Returns null if the record does not exist or is
 * not awaiting review.
 */
export type AcknowledgeAmendmentError =
  | { code: "not_found" }
  | { code: "not_review_required" }
  | { code: "already_acknowledged"; record: CaraCommittedRecord };

export function acknowledgeAmendment(
  recordId: string,
  actorId: string,
): CaraCommittedRecord | AcknowledgeAmendmentError {
  const record = db.caraCommittedRecords.findById(recordId);
  if (!record) return { code: "not_found" };
  if (!record.amendment_requires_manager_review) {
    return { code: "not_review_required" };
  }
  if (record.amendment_acknowledged_at) {
    return { code: "already_acknowledged", record };
  }
  const all = db.caraCommittedRecords.findAll();
  const idx = all.indexOf(record);
  if (idx >= 0) {
    all[idx] = {
      ...record,
      amendment_acknowledged_by: actorId,
      amendment_acknowledged_at: new Date().toISOString(),
    };
    return all[idx];
  }
  return record;
}
