// ══════════════════════════════════════════════════════════════════════════════
// CARA — KNOWLEDGE EVOLUTION ENGINE (types)
//
// §22 is the meta-layer over the Cara Knowledge Base: it asks whether the KB is
// keeping pace with what practice actually does. For each KB entry it computes a
// lifecycle signal (embedded / emerging / dormant / review_due) by matching the
// entry against the home's live records, and it detects COVERAGE GAPS — recurring
// practice themes that no KB entry addresses.
//
// SAFETY: Cara PROPOSES how the knowledge base should evolve; a practice lead
// decides. Cara never auto-edits practice knowledge — clinical/practice models
// are an expert judgement, not a machine's. (Same posture as §25 self-healing and
// §30 quality gates: detect + propose, never silently change.)
//
// NOT a duplicate of Practice Framework Usage (which measures 5-source engagement
// of a framework subset). §22 covers the WHOLE KB lifecycle + gaps-vs-practice.
// ══════════════════════════════════════════════════════════════════════════════

export const KNOWLEDGE_EVOLUTION_VERSION = "1.0.0";

export type EntryLifecycle = "embedded" | "emerging" | "dormant" | "review_due";

export type ProposalKind =
  | "codify_gap" // a recurring practice theme no KB entry covers → propose new knowledge
  | "review_entry" // a stale / never-reviewed KB entry → propose a review
  | "embed_dormant" // a KB entry never reaching practice → propose embedding (training/supervision)
  | "reinforce"; // a KB entry well-embedded and working → keep/celebrate

export type ProposalSeverity = "high" | "medium" | "low";

export interface KBEntrySignal {
  id: string;
  title: string;
  type: string;
  references: number; // records whose text mentions this entry's keywords
  sources: string[]; // record types the references came from
  ageMonths: number;
  reviewed: boolean;
  lifecycle: EntryLifecycle;
}

export interface EvolutionProposal {
  id: string;
  kind: ProposalKind;
  severity: ProposalSeverity;
  title: string;
  evidence: string;
  recommendation: string;
  relatedEntryId?: string;
  /** Always true — knowledge changes are an expert decision, never automatic. */
  humanDecisionRequired: boolean;
}

export interface KnowledgeEvolutionReport {
  homeId: string;
  asOf: string;
  entrySignals: KBEntrySignal[];
  proposals: EvolutionProposal[];
  summary: {
    entries: number;
    embedded: number;
    emerging: number;
    dormant: number;
    reviewDue: number;
    coverageGaps: number;
  };
  disclaimer: string;
  engineVersion: string;
}

// ── Inputs (pure engine; the route reads the KB + store) ──────────────────────

export interface KBEntryInput {
  id: string;
  title: string;
  type: string;
  keywords: string[]; // tags + any title-derived terms
  ingestedAt: string; // YYYY-MM-DD
  reviewed: boolean;
}

/** One unit of practice text to scan (an incident description, a behaviour-log
 *  note, a daily-log entry, a supervision note …). */
export interface PracticeRecordText {
  recordType: string;
  text: string;
}

export interface KnowledgeEvolutionInput {
  homeId: string;
  asOf: string; // YYYY-MM-DD
  entries: KBEntryInput[];
  corpus: PracticeRecordText[];
  /** Recording-window threshold for "review due" (months). Default 12. */
  reviewDueMonths?: number;
}
