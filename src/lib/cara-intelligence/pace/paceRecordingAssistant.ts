// ══════════════════════════════════════════════════════════════════════════════
// CARA INTELLIGENCE — PACE practice engine · RECORDING ASSISTANT
//
// When staff write a daily log / incident / debrief, Cara suggests improvements:
// it rewrites judgemental wording the staff ACTUALLY wrote into objective wording,
// and flags missing areas (child presentation, trigger, response, PACE
// intervention, child voice, outcome, repair, manager notification). It NEVER
// fabricates events — it only rewrites provided wording or names a gap to fill.
// ══════════════════════════════════════════════════════════════════════════════

import { analyzePACE } from "./paceAnalyzer";
import { PACE_DISCLAIMER } from "./pace.constants";
import type { PACEAnalysisInput, PACERecordingAssistantResult, PACERecordingImprovement } from "./pace.types";

/** Judgemental phrase → objective rewrite (only applied to wording staff wrote). */
const WORD_SWAPS: { from: string; to: string }[] = [
  { from: "kicked off", to: "became distressed and dysregulated" },
  { from: "non-compliant", to: "found it hard to follow the request" },
  { from: "non compliant", to: "found it hard to follow the request" },
  { from: "refused to comply", to: "was not able to follow the request at that time" },
  { from: "defiant", to: "resisted, which may signal an unmet need" },
  { from: "attention seeking", to: "seeking connection / communicating a need" },
  { from: "attention-seeking", to: "seeking connection / communicating a need" },
  { from: "manipulative", to: "trying to meet a need in the only way available to them" },
  { from: "naughty", to: "found this situation difficult" },
  { from: "deliberately", to: "in a way that may have been communicating something" },
  { from: "for no reason", to: "for reasons not yet understood" },
  { from: "unprovoked", to: "for reasons not yet understood" },
  { from: "without provocation", to: "for reasons not yet understood" },
  { from: "playing up", to: "communicating distress" },
  { from: "as usual", to: "on this occasion" },
  { from: "yet again", to: "on this occasion" },
  { from: "spoilt", to: "finding it hard to manage disappointment" },
  { from: "spoiled", to: "finding it hard to manage disappointment" },
];

const MISSING_PROMPTS: Record<PACERecordingImprovement["area"], { label: string; suggestion: string }> = {
  objective_wording: { label: "Objective wording", suggestion: "Describe what was observed factually; separate fact from interpretation." },
  child_presentation: { label: "Child's presentation", suggestion: "Add how the child presented — body language, affect, what you observed." },
  possible_trigger: { label: "Possible trigger", suggestion: "Note any possible trigger or what was happening just before." },
  staff_response: { label: "Staff response", suggestion: "Record what you did and said in response." },
  pace_intervention: { label: "PACE-informed intervention", suggestion: "Capture the PACE stance used — acceptance of the feeling, curiosity, empathy, and any de-escalation." },
  child_voice: { label: "Child's voice", suggestion: "Add the child's voice — their words, what they showed, how it was for them." },
  outcome: { label: "Outcome", suggestion: "Record the outcome — how things resolved and how the child was afterwards." },
  repair_followup: { label: "Repair / follow-up", suggestion: "Note the relationship repair and any follow-up planned." },
  manager_notification: { label: "Manager notification", suggestion: "Risk is present — confirm and record manager/safeguarding notification." },
};

function norm(t: string): string { return (t ?? "").toLowerCase(); }

export function assistRecording(input: PACEAnalysisInput): PACERecordingAssistantResult {
  const text = input.text ?? "";
  const lower = norm(text);
  const analysis = analyzePACE(input);
  const improvements: PACERecordingImprovement[] = [];

  // 1. Rewrites of judgemental wording the staff actually wrote.
  for (const swap of WORD_SWAPS) {
    if (lower.includes(swap.from)) {
      improvements.push({
        area: "objective_wording",
        label: `Rewrite "${swap.from}"`,
        suggestion: `Consider: "${swap.to}".`,
        rewriteOf: swap.from,
      });
    }
  }

  // 2. Missing-area prompts (names a gap to fill — never fabricates the content).
  const addMissing = (area: PACERecordingImprovement["area"]) =>
    improvements.push({ ...MISSING_PROMPTS[area], area, rewriteOf: null });

  if (!analysis.childVoicePresent) addMissing("child_voice");
  if (!analysis.exploresNeed) addMissing("possible_trigger");
  const pacePresent = analysis.elements.some((e) => e.present);
  if (!pacePresent) addMissing("pace_intervention");
  if (analysis.missing.includes("relationship repair")) addMissing("repair_followup");
  if (analysis.flags.some((f) => f.flag === "SHAMING_LANGUAGE" || f.flag === "BLAME_BASED_RECORDING")) addMissing("objective_wording");
  if (analysis.professionalJudgementRequired && !norm(text).match(/manager|safeguard|notified|escalat/)) addMissing("manager_notification");
  // Always nudge the core structure if the record is thin.
  if (text.trim().length < 200) {
    addMissing("child_presentation");
    addMissing("staff_response");
    addMissing("outcome");
  }

  // 3. Draft skeleton — headings + the staff's OWN text under "what happened".
  // No invented content; placeholders mark what the author still needs to add.
  const draftSkeleton = [
    "What happened (observed, factual):",
    text.trim() || "[describe what you observed]",
    "",
    "Child's presentation: [how the child presented]",
    "Possible trigger / what came before: [if known]",
    "My response (PACE — acceptance of the feeling, curiosity, empathy, de-escalation): [what you said and did]",
    "Boundary / safety action: [the limit held and how everyone was kept safe]",
    "Child's voice: [their words / what they showed]",
    "Outcome: [how it resolved]",
    "Repair / follow-up: [reconnection planned]",
    analysis.professionalJudgementRequired ? "Manager / safeguarding notification: [who was informed and when]" : "",
  ].filter(Boolean).join("\n");

  return {
    improvements,
    draftSkeleton,
    managerNotificationRequired: analysis.managerReviewRequired,
    disclaimer: PACE_DISCLAIMER,
  };
}
