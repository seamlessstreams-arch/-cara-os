// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA GOVERNANCE SUMMARY (§24)
//
// Aggregates the Ask CARA audit trail + external-AI declarations into the numbers
// a manager/RI needs: usage by intent, deterministic-only compliance, prohibited
// attempts, declarations awaiting review, and external-AI calls avoided. Pure —
// the route reads the store and passes the arrays in.
// ══════════════════════════════════════════════════════════════════════════════

import type { AskCaraAuditEvent } from "./audit-logger";
import type { ExternalAiDeclaration } from "./external-ai-declaration";

export const GOVERNANCE_SUMMARY_VERSION = "1.0.0";

// Rough per-answer external cost avoided, in GBP. A deterministic answer that
// would otherwise have been an LLM call. Deliberately conservative + labelled as
// an estimate so it's never presented as exact.
const ESTIMATED_COST_PER_EXTERNAL_CALL_GBP = 0.02;

export interface GovernanceSummary {
  usage: { total: number; byIntent: { intent: string; count: number }[] };
  safety: { prohibitedAttempts: number; managerReviewRequired: number };
  declarations: { total: number; pendingReview: number; confidentialDataEntered: number };
  deterministic: { deterministicOnly: number; total: number; compliancePct: number };
  costAvoidance: { externalCallsAvoided: number; estimatedCreditsSavedGbp: number };
  version: string;
}

export function buildGovernanceSummary(events: AskCaraAuditEvent[], declarations: ExternalAiDeclaration[]): GovernanceSummary {
  const total = events.length;
  const byIntentMap = new Map<string, number>();
  for (const e of events) byIntentMap.set(e.intent, (byIntentMap.get(e.intent) ?? 0) + 1);
  const byIntent = [...byIntentMap.entries()].map(([intent, count]) => ({ intent, count })).sort((a, b) => b.count - a.count);

  const deterministicOnly = events.filter((e) => e.deterministicOnly).length;
  const prohibitedAttempts = events.filter((e) => e.prohibitedTriggered).length;
  const managerReviewRequired = events.filter((e) => e.managerReviewRequired).length;

  // Every deterministic answer is an external LLM call that did NOT happen.
  const externalCallsAvoided = deterministicOnly;

  return {
    usage: { total, byIntent },
    safety: { prohibitedAttempts, managerReviewRequired },
    declarations: {
      total: declarations.length,
      pendingReview: declarations.filter((d) => d.managerReviewStatus === "pending").length,
      confidentialDataEntered: declarations.filter((d) => d.confidentialDataEntered).length,
    },
    deterministic: {
      deterministicOnly,
      total,
      compliancePct: total > 0 ? Math.round((deterministicOnly / total) * 100) : 100,
    },
    costAvoidance: {
      externalCallsAvoided,
      estimatedCreditsSavedGbp: Math.round(externalCallsAvoided * ESTIMATED_COST_PER_EXTERNAL_CALL_GBP * 100) / 100,
    },
    version: GOVERNANCE_SUMMARY_VERSION,
  };
}
