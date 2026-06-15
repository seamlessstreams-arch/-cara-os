// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — types
//
// A Grammarly-style assistant for children's residential care recording. The
// core is a DETERMINISTIC, positioned issue detector: given record text it
// returns issues with character offsets (for inline underlines), a friendly
// quality score, and a summary. No model calls in the core engine; an optional
// AI provider only ever SUGGESTS, never silently rewrites.
//
// Core principle: the assistant may suggest, but must never silently rewrite,
// invent, remove, soften, exaggerate, or materially change a record. Staff
// remain the author; managers retain oversight.
// ══════════════════════════════════════════════════════════════════════════════

export type IssueType =
  | "spelling"
  | "grammar"
  | "punctuation"
  | "clarity"
  | "tone"
  | "professional-language"
  | "safeguarding-quality"
  | "chronology"
  | "writing-to-child"
  | "policy-language";

export type IssueSeverity = "low" | "medium" | "high";

export type IssueSource = "browser" | "languagetool" | "cara-ai" | "rule-engine";

export interface WritingSuggestion {
  id: string;
  /** The literal replacement. Empty when the issue needs the author's own words. */
  replacementText: string;
  label: string;
  rationale: string;
  /** True only for safe, like-for-like fixes (spelling, contractions). */
  preservesMeaning: boolean;
}

export interface WritingIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  /** Character offsets into the checked text (for inline underlines). */
  start: number;
  end: number;
  originalText: string;
  /** Short, supportive message shown on the underline/popover. */
  message: string;
  /** Plain-English explanation of why it improves the record. */
  explanation: string;
  suggestions: WritingSuggestion[];
  source: IssueSource;
  confidence: number;
  /** When true the UI must NOT auto-apply — the author must decide / add detail. */
  requiresHumanJudgement: boolean;
}

export type WritingMode = "standard" | "safeguarding" | "writing-to-child" | "management-oversight";

export interface WritingCheckInput {
  text: string;
  recordType?: string;
  fieldName?: string;
  childId?: string;
  workflowId?: string;
  mode?: WritingMode;
  /** Names known from context, so the redactor can protect them before any external call. */
  knownNames?: string[];
}

export interface WritingScoreArea {
  key: "spelling_grammar" | "clarity" | "professional_tone" | "objective_recording" | "child_centred";
  label: string;
  score: number; // 0–100
}

export type WritingScoreBand = "strong" | "minor_improvements" | "add_detail" | "needs_review";

export interface WritingQualityScore {
  overall: number; // 0–100
  band: WritingScoreBand;
  message: string;
  areas: WritingScoreArea[];
}

export interface WritingCheckResult {
  issues: WritingIssue[];
  score: WritingQualityScore;
  summary: string;
  /** Hash of the checked text, so the client can discard stale results. */
  textHash: string;
  engineVersion: string;
  generatedAt: string;
}

/** Provider abstraction — the engine is the default `rule-engine` provider. */
export interface WritingCheckProvider {
  id: IssueSource;
  checkText(input: WritingCheckInput): Promise<WritingCheckResult> | WritingCheckResult;
}

export const WRITING_ASSISTANT_VERSION = "1.0.0";

/** Below this length the text is too short to check meaningfully. */
export const MIN_CHECK_LENGTH = 20;
/** Hard cap per check to protect the server. */
export const MAX_CHECK_LENGTH = 20000;

/**
 * Record types / phrases that carry safeguarding significance — the assistant
 * may improve CLARITY here but must flag for human review and never alter the
 * substance.
 */
export const SAFEGUARDING_SENSITIVE_TERMS = [
  "allegation",
  "disclosure",
  "disclosed",
  "injury",
  "injuries",
  "bruise",
  "missing",
  "absconded",
  "restraint",
  "physical intervention",
  "police",
  "self-harm",
  "self harm",
  "suicidal",
  "overdose",
  "exploitation",
  "county lines",
  "grooming",
  "sexualised",
  "lado",
  "medication error",
];
