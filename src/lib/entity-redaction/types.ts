// ══════════════════════════════════════════════════════════════════════════════
// CARA — ENTITY-STABLE REDACTION (types)
//
// §8 produces DETERMINISTIC, HUMAN-READABLE, DOCUMENT-SET-STABLE pseudonyms —
// "Child A", "Staff 1" — for anything that leaves the building (Reg 44 packs,
// inspection packs, complaints, external reports). One codebook applied across a
// whole document set means "Child A" is the same child in every document, so the
// pack still reads naturally, and an authorised person can rehydrate.
//
// This is DISTINCT from writing-assistant/redaction (opaque unique tokens for
// AI-input round-trip safety). Those tokens are non-readable and per-occurrence;
// these codes are stable, readable and shared across the set.
//
// SAFETY: the codebook maps codes → real identities. A redacted document plus its
// codebook is fully re-identifiable, so the codebook is sensitive and rehydrate
// is an authorised action.
// ══════════════════════════════════════════════════════════════════════════════

export const ENTITY_REDACTION_VERSION = "1.0.0";

export type EntityKind = "child" | "staff";

export interface EntityRef {
  id: string;
  name: string;
  kind: EntityKind;
  /** Extra terms that refer to the same person (nicknames, maiden name…). */
  aliases?: string[];
}

export interface CodebookEntry {
  id: string;
  kind: EntityKind;
  name: string;
  /** The stable pseudonym, e.g. "Child A" or "Staff 3". */
  code: string;
  /** Terms redacted to this code, longest-first (full name before first name). */
  matchTerms: string[];
}

export interface Codebook {
  entries: CodebookEntry[];
  version: string;
}

export interface RedactableDocument {
  id: string;
  text: string;
}

export interface RedactionOutcome {
  codebook: Codebook;
  documents: RedactableDocument[];
  /** Known names that still appear after redaction (should be empty). */
  residualNames: { documentId: string; names: string[] }[];
}
