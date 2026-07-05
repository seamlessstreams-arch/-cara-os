// ══════════════════════════════════════════════════════════════════════════════
// CARA — STRATEGY DISCUSSION REASONING ENGINE (types)
//
// Helps staff and managers articulate WHY a strategy discussion is — or is
// not — required. The draft is assembled from the child's existing records
// and structured into:
//
//   • the eight reasoning sections (Headline Concern → Purpose),
//   • the Seven Threshold Reasoning Questions,
//   • evidence separated by KIND — direct / reported / observed / pattern —
//     kept apart from professional interpretation, unknowns and alternative
//     explanations.
//
// Cara drafts and structures; the threshold judgement and the final request
// belong to a named manager. Every draft is traced to the records it grew
// from ("If Cara cannot trace it, Cara cannot claim it").
// ══════════════════════════════════════════════════════════════════════════════

import type { EthicalSourceRef } from "@/lib/ethical-intelligence/types";

// ── The eight reasoning sections ──────────────────────────────────────────────

export type StrategySectionKey =
  | "headline_concern"
  | "type_of_harm"
  | "evidence"
  | "child_impact"
  | "adult_response"
  | "current_plan"
  | "immediacy"
  | "purpose_of_strategy_discussion";

export const STRATEGY_SECTION_LABELS: Record<StrategySectionKey, string> = {
  headline_concern: "Headline Concern",
  type_of_harm: "Type of Harm",
  evidence: "Evidence",
  child_impact: "Child Impact",
  adult_response: "Adult Response",
  current_plan: "Current Plan",
  immediacy: "Immediacy",
  purpose_of_strategy_discussion: "Purpose of Strategy Discussion",
};

export const STRATEGY_SECTION_ORDER: readonly StrategySectionKey[] = [
  "headline_concern",
  "type_of_harm",
  "evidence",
  "child_impact",
  "adult_response",
  "current_plan",
  "immediacy",
  "purpose_of_strategy_discussion",
] as const;

// ── The Seven Threshold Reasoning Questions (verbatim, per spec) ──────────────

export const SEVEN_THRESHOLD_QUESTIONS: readonly string[] = [
  "What information has brought me here?",
  "What interpretation am I currently making?",
  "What else could explain this information?",
  "Why does significant harm remain a reasonable explanation?",
  "What is life like for this child?",
  "How are power, inequality, culture, disability, trauma, race, gender, sexuality, language, poverty or neurodiversity shaping this picture?",
  "Why is a multi-agency response required now?",
] as const;

// ── Evidence, separated by kind ───────────────────────────────────────────────

export type EvidenceKind = "direct" | "reported" | "observed" | "pattern";

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  direct: "Direct evidence",
  reported: "Reported evidence",
  observed: "Observed evidence",
  pattern: "Pattern evidence",
};

export interface StrategyEvidenceItem {
  kind: EvidenceKind;
  text: string;
  sourceRecords: EthicalSourceRef[];
}

// ── The request record ────────────────────────────────────────────────────────

export interface StrategyQuestionAnswer {
  question: string;
  answer: string;
  answeredBy: string;
  answeredAt: string;
}

export interface StrategyAuditEntry {
  at: string;
  actor: string;
  action: string;
  detail?: string;
}

export type StrategyRequestStatus = "draft" | "manager_approved" | "not_pursued";

export interface StrategyDiscussionRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  childId?: string;
  childName?: string;

  /** The eight reasoning sections — auto-drafted, then edited by humans. */
  sections: Record<StrategySectionKey, string>;

  /** Evidence separated by KIND, each item traced to its records. */
  evidence: StrategyEvidenceItem[];
  /** Professional interpretation — kept apart from the evidence itself. */
  professionalInterpretation: string[];
  /** What is genuinely unknown — recorded, never papered over. */
  unknowns: string[];
  /** Alternative explanations considered. */
  alternativeExplanations: string[];
  /** Urgency, in plain words (assembled from escalation decisions if present). */
  urgency: string;

  /** The Seven Threshold Reasoning Questions — answered by humans. */
  thresholdAnswers: StrategyQuestionAnswer[];

  status: StrategyRequestStatus;
  /** The manager's judgement — mandatory reasoning, named human. */
  managerDecision?: {
    decidedBy: string;
    decidedByRole?: string;
    decidedAt: string;
    /** true = request a strategy discussion; false = threshold not met. */
    requestDiscussion: boolean;
    reasoning: string;
  };

  sourceRecords: EthicalSourceRef[];
  auditTrail: StrategyAuditEntry[];
}

// ── Computed draft status ─────────────────────────────────────────────────────

export interface StrategyDraftStatus {
  requestId: string;
  sectionsComplete: number;
  sectionsTotal: number;
  questionsAnswered: number;
  questionsTotal: number;
  evidenceByKind: Record<EvidenceKind, number>;
  hasUnknownsRecorded: boolean;
  hasAlternativesRecorded: boolean;
  readyForManager: boolean;
  outstanding: string[];
  disclaimer: string;
}

// ── Assembly input (pre-fetched snapshots — the engine stays pure) ────────────

export interface StrategyAssemblyInput {
  childId: string;
  childName?: string;
  /** The concern in the raiser's words. */
  concernSummary: string;
  raisedBy: string;
  /** Snapshots the route reads from the store — the engine never touches it. */
  incidents: Array<{
    id: string;
    date: string;
    type: string;
    severity: string;
    description: string;
    immediateAction?: string;
  }>;
  behaviourEntries: Array<{
    id: string;
    date: string;
    direction: string;
    intensity: string;
    trigger: string;
    behaviour: string;
  }>;
  escalationDecisions: Array<{
    id: string;
    suggestedLevel: string;
    confirmedLevel?: string;
    status: string;
    concernSummary: string;
  }>;
  /** The child's own quoted words, where records hold them. */
  childQuotes: Array<{ recordId: string; recordType: string; quote: string }>;
  /** Current plans in place (titles/summaries). */
  currentPlans: Array<{ id: string; recordType: string; summary: string }>;
}
