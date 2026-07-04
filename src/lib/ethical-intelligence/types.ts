// ══════════════════════════════════════════════════════════════════════════════
// CARA — ETHICAL INTELLIGENCE SPINE (types)
//
// The persisted, source-linked system of record for the ethical practice cycle:
//
//   Experience → Insight → Decision → Impact → Learning → Integration → (again)
//
// Every significant record is both an operational record AND a learning event.
// These types mirror the spec's named structures (ethical_intelligence_events /
// _insights / _decisions / _learning / _actions / _outcomes / _audit_trail —
// snake_case tables in supabase/migrations/422_ethical_intelligence.sql).
//
// CORE RULE — "If Cara cannot trace it, Cara cannot claim it": every stage
// record MUST cite at least one source record (sourceRecords). The capture
// service REFUSES untraced stages; that rule is enforced in code and tests,
// not just documentation.
//
// Cara never makes the decision. It structures, links and evidences the
// decision a named human made.
// ══════════════════════════════════════════════════════════════════════════════

import type { DefensibleDecision } from "@/lib/cara-reasoning/defensible-decision-engine";

// ── Source traceability ───────────────────────────────────────────────────────

/** A link back to the operational record a claim is grounded in. */
export interface EthicalSourceRef {
  /** Store collection / table the source lives in (e.g. "incidents", "dailyLog"). */
  recordType: string;
  /** The source record's id. */
  recordId: string;
  /** Optional one-line note on what this source evidences. */
  note?: string;
}

export type EthicalCycleStage =
  | "experience"
  | "insight"
  | "decision"
  | "impact"
  | "learning"
  | "integration";

export const ETHICAL_CYCLE_STAGES: readonly EthicalCycleStage[] = [
  "experience",
  "insight",
  "decision",
  "impact",
  "learning",
  "integration",
] as const;

// ── Stage records (the spec's named structures) ───────────────────────────────

/** ethical_intelligence_insights — what was known, and what was made of it. */
export interface EthicalIntelligenceInsight {
  id: string;
  capturedAt: string;
  capturedBy: string;
  /** What information was known at the time? */
  informationKnown: string[];
  /** What was interpreted from that information? */
  interpretation: string;
  /** What alternative explanations were considered? */
  alternativeExplanations: string[];
  sourceRecords: EthicalSourceRef[];
}

/** ethical_intelligence_decisions — the decision a named human made. */
export interface EthicalIntelligenceDecision {
  id: string;
  capturedAt: string;
  /** What decision was made? */
  decisionSummary: string;
  /** Who made the decision (name or role — a human, never Cara). */
  decisionMaker: string;
  decisionMakerRole?: string;
  /** What evidence supported the decision? */
  evidence: string[];
  /** The full 14-point defensible-decision record, when structured. */
  defensibleDecision?: DefensibleDecision;
  sourceRecords: EthicalSourceRef[];
}

/** ethical_intelligence_actions — what was done, and what must follow. */
export interface EthicalIntelligenceAction {
  id: string;
  capturedAt: string;
  capturedBy: string;
  /** What action was taken? */
  actionTaken: string;
  /** What follow-up is required? */
  followUpRequired: string[];
  followUpOwner?: string;
  followUpDue?: string;
  sourceRecords: EthicalSourceRef[];
}

/** ethical_intelligence_outcomes — what changed as a result. */
export interface EthicalIntelligenceOutcome {
  id: string;
  capturedAt: string;
  capturedBy: string;
  /** What changed as a result? */
  whatChanged: string;
  /** Honest direction of travel — never overstated. */
  direction: "improved" | "no_change" | "worsened" | "too_early_to_say";
  reviewedAt?: string;
  reviewedBy?: string;
  sourceRecords: EthicalSourceRef[];
}

/** ethical_intelligence_learning — what this event taught the organisation. */
export interface EthicalIntelligenceLearning {
  id: string;
  capturedAt: string;
  capturedBy: string;
  /** What was learned? */
  whatWasLearned: string;
  /** What needs to be embedded into future practice? */
  toEmbedInPractice: string[];
  /** Where it should be embedded (plan, policy, training, supervision…). */
  embedTargets: string[];
  embedded: boolean;
  embeddedAt?: string;
  sourceRecords: EthicalSourceRef[];
}

/** ethical_intelligence_audit_trail — every mutation, append-only. */
export interface EthicalIntelligenceAuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  stage?: EthicalCycleStage;
  detail?: string;
}

// ── Integration checklist (the cycle's closure questions) ─────────────────────

/**
 * The spec's closure questions, each tri-state — `null` = not yet answered
 * (honest unknown), never silently defaulted to "yes" or "no".
 */
export interface EthicalIntegrationChecklist {
  childVoiceHeard: boolean | null;
  childPlanUpdated: boolean | null;
  riskAssessmentUpdated: boolean | null;
  behaviourSupportPlanUpdated: boolean | null;
  managementOversightCompleted: boolean | null;
  workflowFullyCompleted: boolean | null;
  outcomeReviewed: boolean | null;
}

// ── The event (ethical_intelligence_events) ───────────────────────────────────

/**
 * One learning event on the ethical cycle, anchored to the operational record
 * that triggered it and to a child where applicable.
 */
export interface EthicalIntelligenceEvent {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  homeId?: string;
  childId?: string;
  childName?: string;

  /** The operational record this learning event grew from. */
  trigger: EthicalSourceRef;
  triggerSummary: string;

  // Experience — what happened, in three honest voices.
  /** What happened? */
  whatHappened: string;
  /** What did the child experience? (their words where possible) */
  childExperience?: string;
  /** What did staff observe? */
  staffObserved?: string;

  // The staged cycle records.
  insights: EthicalIntelligenceInsight[];
  decisions: EthicalIntelligenceDecision[];
  actions: EthicalIntelligenceAction[];
  outcomes: EthicalIntelligenceOutcome[];
  learning: EthicalIntelligenceLearning[];

  integration: EthicalIntegrationChecklist;

  auditTrail: EthicalIntelligenceAuditEntry[];
}

// ── Computed cycle status (pure engine output — never persisted) ──────────────

export interface EthicalCycleStageStatus {
  stage: EthicalCycleStage;
  label: string;
  complete: boolean;
  /** What (if anything) this stage still needs — plain, non-judgemental. */
  outstanding: string[];
}

export interface EthicalCycleStatus {
  eventId: string;
  stages: EthicalCycleStageStatus[];
  /** 0–6 stages complete. */
  stagesComplete: number;
  cycleComplete: boolean;
  /** The single next thing that would move the cycle forward. */
  nextStep: string | null;
  /** Integration questions still unanswered or answered "no". */
  openIntegration: string[];
  /** Every claim in this event is traceable to a source record. */
  fullyTraceable: boolean;
  disclaimer: string;
}
