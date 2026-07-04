// ══════════════════════════════════════════════════════════════════════════════
// CARA — RISK ESCALATION DECISION WORKFLOW (types)
//
// The four-level escalation scheme with its required actions and timeframes.
// Cara SUGGESTS a level deterministically from recorded evidence; a named
// manager CONFIRMS, AMENDS or REJECTS it. Every decision is logged with the
// suggested level, confirmed level, decision maker, evidence used, reason,
// actions triggered, timestamps and an append-only audit trail.
//
// Cara never escalates on its own — the suggestion has no effect until a
// human decides. Traceability follows the Ethical Intelligence rule: a
// suggestion must cite the records it grew from.
// ══════════════════════════════════════════════════════════════════════════════

import type { EthicalSourceRef } from "@/lib/ethical-intelligence/types";

// ── The four levels ───────────────────────────────────────────────────────────

export type EscalationLevel =
  | "low_concern"
  | "emerging_concern"
  | "high_concern"
  | "immediate_safeguarding";

export const ESCALATION_LEVELS: readonly EscalationLevel[] = [
  "low_concern",
  "emerging_concern",
  "high_concern",
  "immediate_safeguarding",
] as const;

export interface EscalationLevelDefinition {
  level: EscalationLevel;
  label: string;
  description: string[];
  requiredActions: string[];
  timeframe: string;
  /** Sort/compare rank — higher = more urgent. */
  rank: number;
}

// ── Evidence input (structured, deterministic) ────────────────────────────────

/**
 * The evidence Cara reasons over. Flags are explicit and structured — the
 * engine never guesses from free text alone; free-text context rides along in
 * `summary`/`notes` for the human reading the suggestion.
 */
export interface EscalationEvidenceInput {
  childId?: string;
  childName?: string;
  /** The concern being assessed, in plain words. */
  summary: string;

  // Immediate-safeguarding indicators.
  disclosureOfAbuse?: boolean;
  immediateDanger?: boolean;
  missingNow?: boolean;
  whereaboutsUnknown?: boolean;
  seriousAssault?: boolean;

  // High-concern indicators.
  significantHarmIndicators?: boolean;
  exploitationIndicators?: boolean;
  persistentOrEscalating?: boolean;
  missingRisk?: boolean;

  // Emerging-concern indicators.
  patternDeveloping?: boolean;
  riskFactorsIncreasing?: boolean;
  presentationChanges?: boolean;

  // Grounding context.
  childCurrentlySafe?: boolean;
  recentIncidentCount30d?: number;
  notes?: string[];

  /** The records this assessment grew from — traceability, ≥1 required. */
  sourceRecords: EthicalSourceRef[];
}

// ── Suggestion (Cara's, no effect until a human decides) ──────────────────────

export interface EscalationEvidenceLine {
  rule: string;
  because: string;
}

export interface EscalationSuggestion {
  level: EscalationLevel;
  definition: EscalationLevelDefinition;
  evidence: EscalationEvidenceLine[];
  /** Honest note when nothing elevated was recorded. */
  caveat?: string;
  engineVersion: string;
}

// ── The decision record (the workflow's system of record) ─────────────────────

export type EscalationAgreement = "confirmed" | "amended" | "rejected";

export interface EscalationDecisionAuditEntry {
  at: string;
  actor: string;
  action: string;
  detail?: string;
}

export interface EscalationDecision {
  id: string;
  createdAt: string;
  createdBy: string;
  childId?: string;
  childName?: string;
  concernSummary: string;

  // Cara's suggestion (frozen at suggest time).
  suggestedLevel: EscalationLevel;
  suggestedAt: string;
  suggestionEvidence: EscalationEvidenceLine[];
  engineVersion: string;

  // The human decision.
  status: "awaiting_decision" | "decided";
  agreement?: EscalationAgreement;
  /** The level the manager confirmed or amended to. Absent when rejected. */
  confirmedLevel?: EscalationLevel;
  decisionMaker?: string;
  decisionMakerRole?: string;
  /** Manager's reason — mandatory when amending or rejecting. */
  decisionReason?: string;
  /** The evidence the manager relied on, in their words. */
  evidenceUsed?: string[];
  /** The confirmed level's required actions, frozen at decision time. */
  actionsTriggered: string[];
  decidedAt?: string;

  sourceRecords: EthicalSourceRef[];
  auditTrail: EscalationDecisionAuditEntry[];
}
