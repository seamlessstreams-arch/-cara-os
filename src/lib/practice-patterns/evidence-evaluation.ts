// ══════════════════════════════════════════════════════════════════════════════
// CARA — EVIDENCE-VS-EVALUATION on Reg 45  (pure · deterministic)
//
// Practice-patterns brief B2 / pattern pp_evidence_to_evaluation:
// "Evidence tells you what happened. Evaluation explains the difference it made."
// A Reg 45 quality-of-care review must explain IMPACT on the child, not list
// activity.
//
// Cara already discriminates activity-language from child-impact-language in
// `cara-practice/cara-practice-engine.ts` (analyzePractice → "activity_over_impact"
// / "vague_recording" flags). This module REUSES that engine (no re-derivation of
// lexicons) and reframes those flags for a Reg 45 section: what only lists
// activity, what to add to show impact, and the action the registered person
// must take before sign-off.
//
// Pure: imports the existing engine; no store, no AI.
// ══════════════════════════════════════════════════════════════════════════════

import { analyzePractice } from "@/lib/cara-practice/cara-practice-engine";
import type { CaraFlag } from "@/lib/cara-practice/types";

export type Reg45EvaluationIssue = "activity_over_impact" | "vague_recording";

export interface Reg45EvaluationFinding {
  section?: string;
  issue: Reg45EvaluationIssue;
  title: string;
  detail: string;
  evidence: string[]; // the activity phrases found
  prompt: string; // what to add to evidence impact
  registeredPersonAction: string; // the action by the registered person
}

export interface Reg45EvaluationReview {
  section?: string;
  flagged: boolean;
  findings: Reg45EvaluationFinding[];
  summary: string;
}

const EVALUATION_ISSUES: ReadonlySet<string> = new Set([
  "activity_over_impact",
  "vague_recording",
]);

const REGISTERED_PERSON_ACTION =
  "The registered person should ensure this section evidences the difference made to the child (impact/outcome), not only the activity undertaken, before the Reg 45 review is signed off.";

/**
 * Review a Reg 45 section (or whole review text) for activity-over-impact.
 * Flags where the text only records what was done, prompts for what changed for
 * the child, and names the registered person's action.
 */
export function reviewReg45Evaluation(
  sectionText: string,
  sectionName?: string,
): Reg45EvaluationReview {
  const text = (sectionText ?? "").trim();
  if (!text) {
    return {
      section: sectionName,
      flagged: false,
      findings: [],
      summary: "No text was provided to review.",
    };
  }

  // Reg 45 is a quality-of-care REVIEW — "audit" is the closest source type.
  const out = analyzePractice({ text, sourceType: "audit" });

  const findings: Reg45EvaluationFinding[] = out.flags
    .filter((f: CaraFlag) => EVALUATION_ISSUES.has(f.flagType))
    .map((f: CaraFlag) => ({
      section: sectionName,
      issue: f.flagType as Reg45EvaluationIssue,
      title: f.title,
      detail: f.description,
      evidence: f.evidence,
      prompt: f.recommendedAction,
      registeredPersonAction: REGISTERED_PERSON_ACTION,
    }));

  const where = sectionName ? `section "${sectionName}"` : "text";
  const flagged = findings.length > 0;
  const summary = flagged
    ? `This Reg 45 ${where} reads as activity rather than evaluation — ${findings.length} point(s) need evidence of the impact on the child.`
    : `This Reg 45 ${where} evidences impact on the child, not only activity.`;

  return { section: sectionName, flagged, findings, summary };
}
