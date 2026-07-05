// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 REPORT VALIDATION & SIGN-OFF GATE (pure)
//
// A Reg 44 report cannot be signed off with critical requirements missing unless
// a named person records an override reason — the same hard-block-with-override
// pattern Cara uses for safer-recruitment. validateReg44Report(draft) runs the
// statutory hard-blocks and the practice warnings; applySignOffDecision() refuses
// to sign a blocked report unless overridden, and records who decided what.
//
// Deterministic; no store access, no wall-clock (the caller stamps times).
// ══════════════════════════════════════════════════════════════════════════════

export const REG44_VALIDATION_VERSION = "1.0.0";

// ── The report draft this validates (the A–Q form, as completion + key facts) ─

export interface Reg44ReportDraft {
  homeId: string;
  month: string;
  meta: {
    visitDate: string;
    visitorName: string;
    visitorIndependent: boolean;
    visitNumber?: number;
    announced?: boolean;
    ofstedUrn?: string;
  };
  independence: { confirmed: boolean; conflictsDeclared: boolean };
  methodology: {
    peopleSpokenTo: string[];
    areasObserved: string[];
    recordsExamined: string[];
    childrenOnRoll: number;
    childrenPresent: number;
    childrenSpokenTo: number;
  };
  childrenVoice: { captured: boolean; blankReason: string; entries: Array<{ ref: string; summary: string }> };
  /** How many of the nine Quality Standards have been assessed. */
  qualityStandardsAssessed: number;
  opinions: {
    safeguarding: { stated: boolean; hasEvidence: boolean };
    wellbeing: { stated: boolean; hasEvidence: boolean };
  };
  recommendations: Array<{ id: string; text: string; timescale: string; owner: string }>;
  previousRecommendationsReviewed: boolean;
  conflictOfInterestCompleted: boolean;
  distribution: { completed: boolean; recipients: string[] };
  /** true = the Reg 45 section is an evidence-extract; false = written as the review itself (a block). */
  reg45EvidenceExtractOnly: boolean;
  /** true when child NAMES (not initials/codes) appear in the report output. */
  outputContainsChildNames: boolean;
  signOff: { signedBy: string | null; signedAt: string | null; decision: SignOffDecision | null; overrideReason: string | null };
}

export type SignOffDecision =
  | "approved"
  | "approved_with_actions"
  | "returned_for_amendment"
  | "escalated"
  | "senior_review_required";

export type ValidationSeverity = "block" | "warning";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  message: string;
}

export interface Reg44ValidationResult {
  blocks: ValidationIssue[];
  warnings: ValidationIssue[];
  canSubmit: boolean;
  /** True when there are blocks — sign-off then needs an override reason. */
  overrideRequired: boolean;
  engineVersion: string;
}

const isBlank = (s?: string): boolean => !s || s.trim().length === 0;
const empty = (a?: unknown[]): boolean => !a || a.length === 0;

// ── Validation ────────────────────────────────────────────────────────────────

export function validateReg44Report(draft: Reg44ReportDraft): Reg44ValidationResult {
  const blocks: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const block = (id: string, message: string) => blocks.push({ id, severity: "block", message });
  const warn = (id: string, message: string) => warnings.push({ id, severity: "warning", message });

  // ── Hard blocks (statutory / confidentiality) ─────────────────────────────
  if (isBlank(draft.meta.visitDate)) block("visit_date_missing", "The visit date is missing.");
  if (isBlank(draft.meta.visitorName)) block("visitor_missing", "The independent visitor's name is missing.");
  if (!draft.independence.confirmed) block("independence_missing", "The independence statement has not been completed.");
  if (!draft.childrenVoice.captured && isBlank(draft.childrenVoice.blankReason))
    block("child_voice_blank", "The children's voice section is blank with no reason recorded.");
  if (empty(draft.methodology.peopleSpokenTo) && empty(draft.methodology.areasObserved))
    block("methodology_missing", "The visit methodology (who was spoken to, what was observed) is missing.");
  if (empty(draft.methodology.recordsExamined)) block("records_missing", "No records examined are recorded.");
  if (!draft.opinions.safeguarding.stated || !draft.opinions.wellbeing.stated)
    block("opinion_missing", "One or both statutory opinions (safeguarding, well-being) are missing.");
  if (draft.opinions.safeguarding.stated && !draft.opinions.safeguarding.hasEvidence)
    block("safeguarding_opinion_unsupported", "The safeguarding opinion has no supporting evidence.");
  if (draft.opinions.wellbeing.stated && !draft.opinions.wellbeing.hasEvidence)
    block("wellbeing_opinion_unsupported", "The well-being opinion has no supporting evidence.");
  if (draft.qualityStandardsAssessed < 9)
    block("quality_standards_incomplete", `The Quality Standards assessment is incomplete (${draft.qualityStandardsAssessed}/9).`);
  const recsNoTime = draft.recommendations.filter((r) => !isBlank(r.text) && isBlank(r.timescale));
  if (recsNoTime.length > 0) block("recommendation_no_timescale", `${recsNoTime.length} recommendation(s) have no timescale.`);
  if (!draft.conflictOfInterestCompleted) block("conflict_of_interest_missing", "The conflict of interest declaration is incomplete.");
  if (!draft.distribution.completed || empty(draft.distribution.recipients))
    block("distribution_missing", "Report distribution / sign-off is not completed.");
  if (draft.outputContainsChildNames)
    block("child_names_in_output", "Child names appear in the report output — use initials or reference codes only.");
  if (!draft.reg45EvidenceExtractOnly)
    block("reg45_as_review", "The Regulation 45 section reads as the Regulation 45 review itself — it must be evidence only.");

  // ── Warnings (practice quality) ───────────────────────────────────────────
  if (draft.methodology.childrenSpokenTo === 0 && isBlank(draft.childrenVoice.blankReason))
    warn("no_child_spoken", "No child was spoken to and no explanation is given.");
  if (empty(draft.methodology.recordsExamined)) warn("no_records_inspected", "No records were inspected.");
  if (!draft.previousRecommendationsReviewed) warn("previous_recs_not_reviewed", "Previous recommendations have not been reviewed.");
  if (draft.childrenVoice.captured && draft.childrenVoice.entries.length === 0)
    warn("child_voice_thin", "Children's voice is marked captured but no entries are recorded.");

  return {
    blocks,
    warnings,
    canSubmit: blocks.length === 0,
    overrideRequired: blocks.length > 0,
    engineVersion: REG44_VALIDATION_VERSION,
  };
}

// ── Sign-off gate ───────────────────────────────────────────────────────────

export interface SignOffInput {
  decision: SignOffDecision;
  decidedBy: string;
  decidedAt: string; // caller stamps
  overrideReason?: string;
}

export interface SignOffOutcome {
  ok: boolean;
  refusedReason?: string;
  draft?: Reg44ReportDraft;
}

/**
 * Apply a sign-off decision. A report with unresolved blocks can only be
 * "approved"/"approved_with_actions" if a named person records an override
 * reason; returned/escalated/senior-review are always allowed (they don't
 * assert the report is complete). Never mutates the input.
 */
export function applySignOffDecision(draft: Reg44ReportDraft, input: SignOffInput): SignOffOutcome {
  const validation = validateReg44Report(draft);
  if (isBlank(input.decidedBy)) return { ok: false, refusedReason: "A named decision-maker is required." };

  const asserting = input.decision === "approved" || input.decision === "approved_with_actions";
  if (asserting && !validation.canSubmit && isBlank(input.overrideReason)) {
    return {
      ok: false,
      refusedReason: `Cannot sign off (${input.decision.replace(/_/g, " ")}) — ${validation.blocks.length} unresolved block(s). Record an override reason or return the report for amendment.`,
    };
  }

  const next: Reg44ReportDraft = {
    ...draft,
    signOff: {
      signedBy: input.decidedBy,
      signedAt: input.decidedAt,
      decision: input.decision,
      overrideReason: input.overrideReason?.trim() || null,
    },
  };
  return { ok: true, draft: next };
}

export { REG44_VALIDATION_VERSION as _v };
