// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 REPORT INTELLIGENCE (types)
//
// The deterministic "brain" that turns the existing Reg 44 evidence pack into a
// per-Quality-Standard assessment and evidence-backed DRAFT statutory-opinion
// positions for the independent visitor. It maps evidence Cara already holds
// against the nine Quality Standards (Regs 6–14), states the source and strength
// of each piece, and flags what is missing.
//
// SAFETY: Cara never decides the statutory opinions and never asserts on its own
// that children are effectively safeguarded. It assembles the evidence, suggests
// conservatively (protection is never auto-"met"), and hands the judgement to the
// visitor. Where the records can't carry a standard it says "insufficient
// evidence" rather than inventing it. Consumes generateReg44Pack — no new
// evidence store, no duplication of the compliance/intelligence engines.
// ══════════════════════════════════════════════════════════════════════════════

export const REG44_REPORT_INTEL_VERSION = "1.0.0";

/** The nine Quality Standards, by regulation. */
export type QualityStandardKey =
  | "qs_quality_purpose" // Reg 6
  | "qs_views_wishes_feelings" // Reg 7
  | "qs_education" // Reg 8
  | "qs_enjoyment_achievement" // Reg 9
  | "qs_health_wellbeing" // Reg 10
  | "qs_positive_relationships" // Reg 11
  | "qs_protection" // Reg 12
  | "qs_leadership_management" // Reg 13
  | "qs_care_planning"; // Reg 14

export type QualityStandardStatus =
  | "met"
  | "partly_met"
  | "not_met"
  | "insufficient_evidence"
  | "not_assessed";

export type EvidenceSourceType =
  | "observed"
  | "told_by_child"
  | "told_by_staff"
  | "told_by_manager"
  | "told_by_professional"
  | "record_review"
  | "system_metric"
  | "external_document";

export type Confidence = "high" | "medium" | "low";

export interface Reg44EvidenceLine {
  summary: string;
  sourceType: EvidenceSourceType;
  recordType: string;
  recordId: string;
  date?: string;
}

export interface QualityStandardAssessment {
  key: QualityStandardKey;
  regulation: string; // "Regulation 6"
  label: string;
  /** Cara's conservative SUGGESTION — always the visitor's to confirm. */
  suggestedStatus: QualityStandardStatus;
  confidence: Confidence;
  evidence: Reg44EvidenceLine[];
  gaps: string[];
  concerns: string[];
  /** Deterministic, evidence-first draft wording (no unsupported claims). */
  suggestedNarrative: string;
  requiresVisitorConfirmation: boolean;
}

export type StatutoryOpinionPosition =
  | "evidence_supports"
  | "evidence_mixed"
  | "concerns_identified"
  | "insufficient_evidence";

export interface StatutoryOpinion {
  question: string;
  /** Cara's read of the EVIDENCE — never the opinion itself. */
  position: StatutoryOpinionPosition;
  basis: string;
  concerns: string[];
  supportingStandards: QualityStandardKey[];
  /** Always true — the statutory opinion is the visitor's, on evidence. */
  requiresVisitorJudgement: true;
}

export type ValidationSeverity = "block" | "warning";

export interface Reg44ValidationFlag {
  id: string;
  severity: ValidationSeverity;
  message: string;
}

export interface Reg44Readiness {
  /** 0–100 coverage/strength score. */
  score: number;
  standardsWithEvidence: number;
  status: "needs_evidence" | "needs_review" | "ready_for_visitor";
  childVoiceCaptured: boolean;
  safeguardingScrutiny: "evidenced" | "gaps" | "insufficient";
}

export interface Reg44QualityStandardsAssessment {
  homeId: string;
  month: string;
  asOf: string;
  standards: QualityStandardAssessment[];
  safeguardingOpinion: StatutoryOpinion;
  wellbeingOpinion: StatutoryOpinion;
  validationFlags: Reg44ValidationFlag[];
  readiness: Reg44Readiness;
  evidenceCount: number;
  regulatoryLinks: string[];
  disclaimer: string;
  engineVersion: string;
}

// ── Input — a focused projection of the Reg 44 evidence pack + a few extras ────

export interface Reg44AssessmentInput {
  homeId: string;
  month: string; // "2026-06"
  asOf: string;
  headline: {
    children_in_residence: number;
    incidents: number;
    incidents_critical: number;
    missing_episodes: number;
    missing_high_risk: number;
    restraints: number;
    restraints_with_injuries: number;
    complaints: number;
    complaints_unresolved: number;
    safeguarding_events: number;
    reg40_notifications: number;
    keywork_sessions: number;
    last_visit_recommendations_outstanding: number;
  };
  /** Restraints with their debrief status (QS7 repair gap). */
  restraints: Array<{ id: string; childDebriefed: boolean; hasDebriefRecord: boolean; date?: string }>;
  /** Missing episodes with return-interview status (QS7). */
  missingEpisodes: Array<{ id: string; hasReturnInterview: boolean; date?: string }>;
  /** Key-work sessions carrying the child's voice (QS2). */
  keywork: Array<{ id: string; childVoice: string; date?: string }>;
  /** Child feedback / wishes and feelings (QS2). */
  childVoice: Array<{ id: string; category: string; sentiment: string; date?: string }>;
  /** Complaints with resolution (QS2/QS7). */
  complaints: Array<{ id: string; resolved: boolean; date?: string }>;
  /** Counts for standards the pack doesn't carry richly (honest gaps when 0). */
  educationRecords: number;
  healthRecords: number;
  achievementRecords: number;
  carePlanRecords: number;
  /** From the visit methodology — how many children the visitor spoke to. */
  childrenSpokenTo: number;
}
