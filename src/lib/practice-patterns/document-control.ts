// ══════════════════════════════════════════════════════════════════════════════
// CARA — DOCUMENT-CONTROL METADATA  (pure · deterministic)
//
// Practice-patterns brief C / pattern pp_controlled_document_anatomy:
// when Cara produces a template or policy it must carry document control — a
// named OWNER, an ADOPTION DATE and a NEXT-REVIEW DATE — so it stays current and
// defensible.
//
// Cara's existing doc-governance tracks owner + review/expiry, but has NO
// distinct adoption/effective date (verified absent). This adds that awareness:
// a metadata type and a check that all three fields are present, plus an overdue
// check. (Wiring the dormant doc-versioning spine onto generated docs is a
// separate integration step.) Pure: no store, no AI; imports only the London date helper.
// ══════════════════════════════════════════════════════════════════════════════

import { todayStr } from "@/lib/utils";

export interface DocumentControl {
  title: string;
  owner?: string | null;
  /** ISO date the document was ADOPTED / became effective — the field that was missing. */
  adoptionDate?: string | null;
  /** ISO date the document is next due for review. */
  nextReviewDate?: string | null;
}

export type DocControlField = "owner" | "adoptionDate" | "nextReviewDate";

export interface DocControlResult {
  ok: boolean;
  missing: DocControlField[];
  reviewOverdue: boolean;
  summary: string;
}

function isNonEmpty(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Check a generated document carries full document control. `today` is injectable
 * for deterministic tests (ISO yyyy-mm-dd); the overdue check compares dates as
 * strings, which is valid for ISO dates.
 */
export function checkDocumentControl(meta: DocumentControl, today?: string): DocControlResult {
  const missing: DocControlField[] = [];
  if (!isNonEmpty(meta.owner)) missing.push("owner");
  if (!isNonEmpty(meta.adoptionDate)) missing.push("adoptionDate");
  if (!isNonEmpty(meta.nextReviewDate)) missing.push("nextReviewDate");

  const now = today ?? todayStr();
  const reviewOverdue = isNonEmpty(meta.nextReviewDate) && (meta.nextReviewDate as string) < now;

  let summary: string;
  if (missing.length > 0) {
    summary = `"${meta.title}" is missing document control: ${missing.join(", ")}.`;
  } else if (reviewOverdue) {
    summary = `"${meta.title}" is past its next-review date (${meta.nextReviewDate}).`;
  } else {
    summary = `"${meta.title}" carries full document control.`;
  }

  return { ok: missing.length === 0 && !reviewOverdue, missing, reviewOverdue, summary };
}
