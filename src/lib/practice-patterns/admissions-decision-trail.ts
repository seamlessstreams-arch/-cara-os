// ══════════════════════════════════════════════════════════════════════════════
// CARA — ADMISSIONS DECISION-TRAIL CHECKER  (pure · deterministic)
//
// Practice-patterns brief B4 / pattern pp_placement_stability_from_admission:
// A safe admission records needs, risks, compatibility with the existing group,
// staffing/skills, environment, conditions + WHO VERIFIES each, and a rationale
// — and uses NO blanket exclusions by diagnosis or history.
//
// This is a NEW additive checker. It does not modify the existing
// `home-admissions-matching-assessment-intelligence-engine` (which scores stored
// matching records); it adds the two gaps that engine lacks: a per-condition
// "who verifies" check, and negation-aware blanket-exclusion detection.
//
// Blanket-exclusion detection uses the repo's word-boundary matcher plus a
// clause-negation guard, so disavowals ("we operate no blanket exclusions") are
// NOT flagged. Pure: imports only the keyword matcher.
// ══════════════════════════════════════════════════════════════════════════════

import { matchesKeyword } from "@/lib/keyword-match";

export interface AdmissionCondition {
  description: string;
  verifiedBy?: string | null; // the named person who verifies this condition is met before arrival
}

export interface AdmissionDecisionRecord {
  childRef: string;
  needsAssessed: boolean;
  risksAssessed: boolean;
  compatibilityWithGroupAssessed: boolean;
  staffingSkillsConfirmed: boolean;
  environmentConfirmed: boolean;
  rationaleRecorded: boolean;
  conditions: AdmissionCondition[];
  /** Free-text rationale/decision notes — scanned for blanket-exclusion language. */
  rationaleText?: string;
}

export type DecisionTrailSeverity = "red" | "amber";

export interface DecisionTrailFinding {
  severity: DecisionTrailSeverity;
  code:
    | "needs_not_assessed"
    | "risks_not_assessed"
    | "compatibility_not_assessed"
    | "staffing_not_confirmed"
    | "environment_not_confirmed"
    | "rationale_not_recorded"
    | "condition_without_verifier"
    | "blanket_exclusion";
  message: string;
}

export interface DecisionTrailResult {
  childRef: string;
  ok: boolean;
  findings: DecisionTrailFinding[];
}

// Blanket-exclusion cue phrases (word-boundary matched).
const BLANKET_CUES: readonly string[] = [
  "blanket exclusion",
  "blanket ban",
  "blanket policy",
  "automatic exclusion",
  "automatically exclude",
  "we don't take",
  "we do not take",
  "we don't accept",
  "we do not accept",
  "policy not to accept",
  "never accept anyone",
  "refuse all",
  "exclude anyone with",
  "cannot accept anyone with",
  "will not accept anyone with",
];

// Negators that, appearing just BEFORE a cue, disavow it ("no blanket exclusion").
const NEGATORS: readonly string[] = [
  "no ",
  "not ",
  "without ",
  "avoid ",
  "never use ",
  "do not operate ",
  "don't operate ",
  "is not a ",
  "isn't a ",
  "rather than ",
];

/** True when a blanket-exclusion cue is present AND not disavowed by a preceding negator. */
export function hasBlanketExclusion(text: string): boolean {
  if (!text) return false;
  const hay = text.toLowerCase();
  for (const cue of BLANKET_CUES) {
    if (!matchesKeyword(text, cue)) continue;
    const idx = hay.indexOf(cue.toLowerCase());
    if (idx < 0) continue;
    const before = hay.slice(Math.max(0, idx - 30), idx);
    if (NEGATORS.some((n) => before.includes(n))) continue; // disavowal — not a blanket exclusion
    return true;
  }
  return false;
}

/** Check an admissions decision record for a complete, verifiable, non-blanket decision trail. */
export function checkAdmissionDecisionTrail(record: AdmissionDecisionRecord): DecisionTrailResult {
  const findings: DecisionTrailFinding[] = [];

  if (!record.needsAssessed) findings.push({ severity: "red", code: "needs_not_assessed", message: "Needs were not assessed." });
  if (!record.risksAssessed) findings.push({ severity: "red", code: "risks_not_assessed", message: "Risks were not assessed." });
  if (!record.compatibilityWithGroupAssessed)
    findings.push({ severity: "red", code: "compatibility_not_assessed", message: "Compatibility with the children already living in the home was not assessed." });
  if (!record.staffingSkillsConfirmed)
    findings.push({ severity: "amber", code: "staffing_not_confirmed", message: "Staffing and skills to meet this child's needs were not confirmed from admission." });
  if (!record.environmentConfirmed)
    findings.push({ severity: "amber", code: "environment_not_confirmed", message: "The environment's suitability was not confirmed from admission." });
  if (!record.rationaleRecorded)
    findings.push({ severity: "red", code: "rationale_not_recorded", message: "No decision rationale was recorded." });

  // Every condition on a conditional offer needs a named verifier.
  for (const c of record.conditions) {
    if (!c.verifiedBy || !c.verifiedBy.trim()) {
      findings.push({
        severity: "amber",
        code: "condition_without_verifier",
        message: `Condition "${c.description}" does not name who verifies it before arrival.`,
      });
    }
  }

  // No blanket exclusions by diagnosis or history.
  if (record.rationaleText && hasBlanketExclusion(record.rationaleText)) {
    findings.push({
      severity: "red",
      code: "blanket_exclusion",
      message:
        "The rationale reads as a blanket exclusion (by diagnosis or history). Admissions must be an individual, reasoned decision — not a blanket rule.",
    });
  }

  return { childRef: record.childRef, ok: findings.length === 0, findings };
}
