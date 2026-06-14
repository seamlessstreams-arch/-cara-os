// ══════════════════════════════════════════════════════════════════════════════
// CARA INTELLIGENCE — PACE practice engine · SUPERVISION
//
// Aggregates a staff member's analysed records into a supervision insight:
// recurring patterns (repeated punitive language, missing child voice, lack of
// repair, adult-triggered responses), strengths, and suggested supervision
// questions, learning goals and reflective exercises. Pure. Developmental, never
// disciplinary — Cara surfaces patterns; the manager and staff member reflect.
// ══════════════════════════════════════════════════════════════════════════════

import type { PACEAnalysisResult, PACEElement, PACERiskFlag, PACESupervisionInsight } from "./pace.types";

const PATTERN_THRESHOLD = 2; // a flag must recur at least this many times to be a "pattern"

const PATTERN_NOTE: Partial<Record<PACERiskFlag, string>> = {
  SHAMING_LANGUAGE: "Records sometimes use language that may shame rather than describe.",
  BLAME_BASED_RECORDING: "Recording sometimes frames behaviour as deliberate fault rather than communication.",
  PUNITIVE_RESPONSE: "Responses sometimes lead with sanction before connection.",
  ADULT_TRIGGER: "Some records suggest the staff member's own stress response shaped the interaction (possible blocked care).",
  MISSING_CHILD_VOICE: "The child's voice is frequently missing from records.",
  NO_REPAIR: "Relationship repair after rupture is frequently not evidenced.",
  NO_DEESCALATION: "De-escalation steps are frequently not recorded in risk contexts.",
  NO_REGULATION: "Co-regulation is frequently not evidenced.",
  UNSAFE_BOUNDARY: "Risk is sometimes described without a recorded safety/boundary action.",
  BEHAVIOUR_WITHOUT_NEED: "Records often describe behaviour without the need beneath it.",
};

const SUPERVISION_QUESTION: Partial<Record<PACERiskFlag, string>> = {
  SHAMING_LANGUAGE: "What shifts for you when you describe behaviour as communication rather than character?",
  BLAME_BASED_RECORDING: "How might we write records the child would recognise themselves in?",
  PUNITIVE_RESPONSE: "When do you reach for a sanction, and what could connection-first look like there?",
  ADULT_TRIGGER: "Which situations tend to trigger your own stress response, and what support helps you stay regulated?",
  MISSING_CHILD_VOICE: "How can we make sure the child's voice and experience are in every record?",
  NO_REPAIR: "What helps you plan and follow through on relationship repair after a difficult moment?",
  NO_DEESCALATION: "What de-escalation approaches work best for you, and how do we capture them?",
  NO_REGULATION: "What helps you stay regulated so you can co-regulate the child?",
  UNSAFE_BOUNDARY: "How do we make sure safety actions are always clear and recorded when risk is present?",
  BEHAVIOUR_WITHOUT_NEED: "What helps you get curious about the need a behaviour is communicating?",
};

const LEARNING_GOAL: Partial<Record<PACERiskFlag, string>> = {
  SHAMING_LANGUAGE: "Strengthen objective, non-shaming recording.",
  BLAME_BASED_RECORDING: "Embed behaviour-as-communication in recording.",
  PUNITIVE_RESPONSE: "Practise connection-before-correction.",
  ADULT_TRIGGER: "Build self-regulation strategies; address blocked care.",
  MISSING_CHILD_VOICE: "Routinely capture the child's voice.",
  NO_REPAIR: "Make relationship repair a consistent step.",
  NO_DEESCALATION: "Strengthen and record de-escalation.",
  NO_REGULATION: "Develop co-regulation skills.",
  UNSAFE_BOUNDARY: "Always evidence the safety/boundary action.",
  BEHAVIOUR_WITHOUT_NEED: "Develop curiosity about underlying need.",
};

export function buildPACESupervisionInsight(staffId: string, analyses: PACEAnalysisResult[]): PACESupervisionInsight {
  const recordsReviewed = analyses.length;
  const averageScore = recordsReviewed ? Math.round(analyses.reduce((s, a) => s + a.score.overall, 0) / recordsReviewed) : 0;

  // Count flag occurrences.
  const counts = new Map<PACERiskFlag, number>();
  for (const a of analyses) for (const f of a.flags) counts.set(f.flag, (counts.get(f.flag) ?? 0) + 1);

  const patterns = [...counts.entries()]
    .filter(([flag, n]) => n >= PATTERN_THRESHOLD && flag !== "PROFESSIONAL_JUDGEMENT_REQUIRED" && PATTERN_NOTE[flag])
    .map(([flag, occurrences]) => ({ flag, occurrences, note: PATTERN_NOTE[flag]! }))
    .sort((a, b) => b.occurrences - a.occurrences);

  // Strengths — elements present in the majority of records, plus connect-before-correct.
  const strengths: string[] = [];
  const total = recordsReviewed || 1;
  const elementPresence = (el: PACEElement) => analyses.filter((a) => a.elements.find((e) => e.element === el)?.present).length;
  for (const el of ["ACCEPTANCE", "EMPATHY", "CURIOSITY", "PLAYFULNESS"] as PACEElement[]) {
    if (elementPresence(el) / total >= 0.5) strengths.push(`Consistent ${el.toLowerCase()} in practice.`);
  }
  if (analyses.filter((a) => a.connectBeforeCorrect).length / total >= 0.5) strengths.push("Connects before correcting.");
  if (analyses.filter((a) => a.childVoicePresent).length / total >= 0.5) strengths.push("Routinely captures the child's voice.");
  if (averageScore >= 70) strengths.push("Strong overall PACE quality across records.");

  const patternFlags = patterns.map((p) => p.flag);
  const supervisionQuestions = patternFlags.map((f) => SUPERVISION_QUESTION[f]).filter((q): q is string => !!q);
  const learningGoals = patternFlags.map((f) => LEARNING_GOAL[f]).filter((g): g is string => !!g);

  const reflectiveExercises: string[] = [];
  if (patternFlags.includes("ADULT_TRIGGER")) reflectiveExercises.push("Map your own triggers and an early-warning + self-regulation plan with your supervisor.");
  if (patternFlags.includes("MISSING_CHILD_VOICE") || patternFlags.includes("BEHAVIOUR_WITHOUT_NEED")) reflectiveExercises.push("Re-write one recent record from the child's perspective: what was it like for them?");
  if (patternFlags.includes("NO_REPAIR")) reflectiveExercises.push("Plan a repair conversation for a recent rupture and reflect on what made it possible.");
  if (reflectiveExercises.length === 0) reflectiveExercises.push("Bring one record you're proud of and one you'd do differently to your next supervision.");

  const managerReviewRecommended = averageScore < 55 || patterns.some((p) => p.occurrences >= 3) || patternFlags.includes("UNSAFE_BOUNDARY");

  return { staffId, recordsReviewed, averageScore, strengths, patterns, supervisionQuestions, learningGoals, reflectiveExercises, managerReviewRecommended };
}
