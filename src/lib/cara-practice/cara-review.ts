// ══════════════════════════════════════════════════════════════════════════════
// Cara PRACTICE INTELLIGENCE — REVIEW / RESOLUTION (pure logic)
//
// Manager review of Cara output: record decisions + rationale on assessments and
// threshold consultations, and RESOLVE flags. Guardrails:
//   • Flags are never deleted — only resolved, and only WITH a rationale.
//   • Manager decisions require both a decision and a rationale (audit trail).
// The route layers role-gating (cara.approve_outputs) on top of this.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraPracticeFlag, CaraPracticeAssessment, CaraThresholdConsultation } from "./types";

export type ReviewEntity = "flag" | "assessment" | "threshold";

export interface ReviewInput {
  entity: ReviewEntity;
  id: string;
  rationale?: string | null;
  decision?: string | null; // for assessment / threshold
}

export function validateReview(input: ReviewInput): { ok: boolean; error?: string } {
  if (!input || !["flag", "assessment", "threshold"].includes(input.entity)) {
    return { ok: false, error: "entity must be one of: flag, assessment, threshold" };
  }
  if (!input.id) return { ok: false, error: "id is required" };
  const rationale = (input.rationale ?? "").trim();
  if (input.entity === "flag") {
    // A flag may only be resolved WITH a rationale — high/critical safeguarding
    // flags must never be silently closed.
    if (rationale.length === 0) return { ok: false, error: "A rationale is required to resolve a flag." };
  } else {
    if (!(input.decision ?? "").trim()) return { ok: false, error: "A manager decision is required." };
    if (rationale.length === 0) return { ok: false, error: "A manager rationale is required." };
  }
  return { ok: true };
}

export function buildFlagResolution(userId: string, rationale: string, now: string): Partial<CaraPracticeFlag> {
  return { resolved: true, resolved_at: now, resolved_by: userId, resolution_rationale: rationale.trim() };
}

export function buildAssessmentDecision(userId: string, decision: string, rationale: string, now: string): Partial<CaraPracticeAssessment> {
  return { status: "reviewed", manager_decision: decision.trim(), manager_rationale: rationale.trim(), reviewer_id: userId, reviewed_at: now };
}

export function buildThresholdDecision(decision: string, rationale: string): Partial<CaraThresholdConsultation> {
  return { manager_decision: decision.trim(), manager_rationale: rationale.trim() };
}
