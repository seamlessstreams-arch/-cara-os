// ══════════════════════════════════════════════════════════════════════════════
// CARA — TAP THINKING & PRACTISING MODE (types)
//
// A structured thinking scaffold for complex meetings, reviews and decision
// points. Five stages, each with its own questions:
//
//   See Clearly → Think Deeply → Work Relationally → Act With Purpose → Sustain Practice
//
// TAP structures the THINKING — it never supplies the answers. Every session is
// anchored to the records it grew from (the Ethical Intelligence traceability
// rule) and to the setting it was used in (care planning, risk review, CP
// conference, strategy prep, placement review, disruption meeting, management
// oversight, safeguarding review, serious incident review).
// ══════════════════════════════════════════════════════════════════════════════

import type { EthicalSourceRef } from "@/lib/ethical-intelligence/types";

// ── Stages ────────────────────────────────────────────────────────────────────

export type TapStage =
  | "see_clearly"
  | "think_deeply"
  | "work_relationally"
  | "act_with_purpose"
  | "sustain_practice";

export const TAP_STAGES: readonly TapStage[] = [
  "see_clearly",
  "think_deeply",
  "work_relationally",
  "act_with_purpose",
  "sustain_practice",
] as const;

export interface TapStageDefinition {
  stage: TapStage;
  label: string;
  intent: string;
  questions: string[];
}

// ── Settings (where TAP is used) ──────────────────────────────────────────────

export type TapContext =
  | "care_planning"
  | "risk_review"
  | "child_protection_conference"
  | "strategy_discussion_preparation"
  | "placement_review"
  | "disruption_meeting"
  | "management_oversight"
  | "safeguarding_review"
  | "serious_incident_review";

export const TAP_CONTEXT_LABELS: Record<TapContext, string> = {
  care_planning: "Care planning",
  risk_review: "Risk review",
  child_protection_conference: "Child protection conference",
  strategy_discussion_preparation: "Strategy discussion preparation",
  placement_review: "Placement review",
  disruption_meeting: "Disruption meeting",
  management_oversight: "Management oversight",
  safeguarding_review: "Safeguarding review",
  serious_incident_review: "Serious incident review",
};

// ── The session record ────────────────────────────────────────────────────────

export interface TapAnswer {
  question: string;
  answer: string;
  answeredBy: string;
  answeredAt: string;
}

export interface TapSessionAuditEntry {
  at: string;
  actor: string;
  action: string;
  detail?: string;
}

export interface TapSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  childId?: string;
  childName?: string;
  context: TapContext;
  /** What this thinking session is for, in plain words. */
  purpose: string;
  /** Answers keyed by stage. Unanswered questions are honestly absent. */
  answers: Record<TapStage, TapAnswer[]>;
  status: "in_progress" | "complete";
  completedAt?: string;
  completedBy?: string;
  /** Recorded honestly when completed with unanswered questions. */
  incompleteReason?: string;
  sourceRecords: EthicalSourceRef[];
  auditTrail: TapSessionAuditEntry[];
}

// ── Computed status (pure engine output) ──────────────────────────────────────

export interface TapStageStatus {
  stage: TapStage;
  label: string;
  answered: number;
  total: number;
  complete: boolean;
  unanswered: string[];
}

export interface TapSessionStatus {
  sessionId: string;
  stages: TapStageStatus[];
  stagesComplete: number;
  allStagesComplete: boolean;
  nextQuestion: string | null;
  disclaimer: string;
}
