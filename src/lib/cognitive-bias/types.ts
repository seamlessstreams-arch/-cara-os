// ══════════════════════════════════════════════════════════════════════════════
// CARA — COGNITIVE BIAS REFLECTION ENGINE (types)
//
// Non-judgemental reflective prompts, fired deterministically when a record's
// OWN FACTS suggest a bias-check is worth doing. Biases are how every human
// mind works under pressure — these prompts support reflective practice; they
// never accuse, score or profile staff.
//
// Rules fire only on explicit structured signals (the same philosophy as the
// risk-escalation suggester): no guesswork, no text-mining accusations. Where
// a context always deserves a check (e.g. hindsight in a serious incident
// review), it fires as a STANDING reflection for that context.
// ══════════════════════════════════════════════════════════════════════════════

// ── The sixteen biases (per spec) ─────────────────────────────────────────────

export type BiasKey =
  | "confirmation"
  | "anchoring"
  | "availability"
  | "recency"
  | "negativity"
  | "halo"
  | "authority"
  | "groupthink"
  | "outcome"
  | "hindsight"
  | "fundamental_attribution"
  | "optimism"
  | "escalation_commitment"
  | "defensive_recording"
  | "professional_drift"
  | "compassion_fatigue";

export const BIAS_KEYS: readonly BiasKey[] = [
  "confirmation",
  "anchoring",
  "availability",
  "recency",
  "negativity",
  "halo",
  "authority",
  "groupthink",
  "outcome",
  "hindsight",
  "fundamental_attribution",
  "optimism",
  "escalation_commitment",
  "defensive_recording",
  "professional_drift",
  "compassion_fatigue",
] as const;

export interface BiasDefinition {
  key: BiasKey;
  label: string;
  /** What this bias looks like in residential practice — plain, kind language. */
  whatItLooksLike: string;
  /** The reflective prompt — a question to the team, never a judgement. */
  prompt: string;
}

// ── Where the prompts appear (per spec) ───────────────────────────────────────

export type BiasContext =
  | "safeguarding_concern"
  | "risk_escalation"
  | "management_oversight"
  | "strategy_discussion"
  | "incident_review"
  | "complaint"
  | "placement_stability_review"
  | "child_protection"
  | "serious_incident_review";

export const BIAS_CONTEXT_LABELS: Record<BiasContext, string> = {
  safeguarding_concern: "Safeguarding concern",
  risk_escalation: "Risk escalation",
  management_oversight: "Management oversight",
  strategy_discussion: "Strategy discussion request",
  incident_review: "Incident review",
  complaint: "Complaint",
  placement_stability_review: "Placement stability review",
  child_protection: "Child protection workflow",
  serious_incident_review: "Serious incident review",
};

// ── The structured signal (the record's own facts) ────────────────────────────

/**
 * Everything here is a FACT the caller can read off the record — counts,
 * booleans, dates. The engine never infers character or intent.
 */
export interface BiasSignalInput {
  context: BiasContext;

  // Reasoning facts.
  alternativesConsideredCount?: number;
  evidenceItemsCited?: number;
  /** The child's own words are quoted (not paraphrased by adults). */
  childVoiceQuoted?: boolean;

  // Time-shape facts.
  /** Days between the triggering incident and this judgement being made. */
  decisionWithinDaysOfIncident?: number;
  /** Concerning entries recorded in the last 7 days. */
  recentIncidentCount7d?: number;
  /** The first recorded risk level has never been revised. */
  initialAssessmentUnchanged?: boolean;

  // Balance facts.
  concernsRecordedCount?: number;
  strengthsRecordedCount?: number;

  // Group/authority facts.
  /** Contributors recorded as agreeing, with no dissent or challenge noted. */
  contributorsAgreeing?: number;
  dissentRecorded?: boolean;
  /** The conclusion matches a senior's stated view with no evidence cited beyond it. */
  seniorViewAdoptedWithoutEvidence?: boolean;

  // Outcome/time-of-review facts.
  /** This judgement is being made AFTER the outcome is already known. */
  outcomeKnownAtReview?: boolean;

  // Plan/risk facts.
  /** Risk was lowered without any new evidence recorded. */
  riskDowngradedWithoutNewEvidence?: boolean;
  /** The plan is unchanged although recorded outcomes are not improving. */
  planUnchangedDespiteNoImprovement?: boolean;

  // Recording-shape facts.
  /** The record centres justification of adult actions; the child's experience is absent. */
  justificationFocusedRecording?: boolean;
  /** Recent recorded deviations from policy/procedure. */
  policyDeviationsRecent?: number;
  /** Incidents this staff group has absorbed in the last 30 days. */
  staffIncidentExposure30d?: number;
  /** A strong positive view of a person/placement is cited against a concern. */
  reputationCitedAgainstConcern?: boolean;
  /** The judgement leans on a remembered similar case rather than this child's records. */
  comparisonCaseCitedWithoutRecords?: boolean;
}

// ── Output ────────────────────────────────────────────────────────────────────

export interface BiasPrompt {
  bias: BiasKey;
  label: string;
  prompt: string;
  /** The record-fact that made this check worth offering — always cited. */
  because: string;
}

export interface StandingReflection {
  prompt: string;
  because: string;
}

export interface BiasReflectionResult {
  context: BiasContext;
  contextLabel: string;
  /** Signal-triggered checks — each cites the fact that fired it. */
  prompts: BiasPrompt[];
  /** Always-appropriate reflections for this context. */
  standing: StandingReflection[];
  disclaimer: string;
  engineVersion: string;
}
