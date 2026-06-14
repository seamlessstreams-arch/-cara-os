// ══════════════════════════════════════════════════════════════════════════════
// CARA INTELLIGENCE — PACE practice engine · REFLECTION
//
// Turns a single analysed record into a reflective debrief for the staff member:
// what went well (PACE strengths), what to strengthen, reflective questions, a
// relationship-repair focus, and a compassionate self-regulation note where the
// record suggests the adult's own stress shaped the moment. Developmental, never
// disciplinary. Pure.
// ══════════════════════════════════════════════════════════════════════════════

import { PACE_DISCLAIMER, PACE_ELEMENT_LABELS } from "./pace.constants";
import type { PACEAnalysisResult } from "./pace.types";

export interface PACEReflection {
  whatWentWell: string[];
  whatToStrengthen: string[];
  reflectiveQuestions: string[];
  repairFocus: string | null;
  selfRegulationNote: string | null;
  disclaimer: string;
}

export function buildPACEReflection(analysis: PACEAnalysisResult): PACEReflection {
  const present = analysis.elements.filter((e) => e.present);

  const whatWentWell: string[] = [];
  for (const e of present) whatWentWell.push(`${PACE_ELEMENT_LABELS[e.element]} was evident — "${e.evidence[0]}".`);
  if (analysis.connectBeforeCorrect) whatWentWell.push("You connected before correcting.");
  if (analysis.childVoicePresent) whatWentWell.push("The child's voice is present in the record.");
  if (whatWentWell.length === 0) whatWentWell.push("You showed up and recorded the moment — that's the starting point we build from.");

  const whatToStrengthen: string[] = analysis.recommendations
    .filter((r) => r.area !== "SAFEGUARDING")
    .slice(0, 5)
    .map((r) => r.recommendation);

  const reflectiveQuestions: string[] = [
    ...analysis.prompts.map((p) => p.prompt),
    "What was the moment asking of the child, and of you?",
    "Would the child recognise themselves in this record?",
  ].slice(0, 5);

  const repairFocus = analysis.missing.includes("relationship repair") || analysis.flags.some((f) => f.flag === "NO_REPAIR")
    ? "Plan a relationship-repair moment: return when calm, reassure, and rebuild connection — repair first, learning second."
    : null;

  const selfRegulationNote = analysis.flags.some((f) => f.flag === "ADULT_TRIGGER")
    ? "This is not a criticism: caring for traumatised children can stretch anyone's capacity (blocked care). Notice your own trigger with compassion and plan the support and self-regulation you need."
    : null;

  return { whatWentWell, whatToStrengthen, reflectiveQuestions, repairFocus, selfRegulationNote, disclaimer: PACE_DISCLAIMER };
}
