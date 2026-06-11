// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — STAFF REFLECTION & DEBRIEF BUILDER
//
// Post-incident reflection that supports accountability WITHOUT blame:
// what the child may have been communicating, what worked, what to refine,
// relational repair, staff regulation and supervision questions. Built to
// protect staff wellbeing as much as practice quality.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraStaffDebriefOutput } from "./cara-types";
import { RECORDING_PROMPTS, STAFF_REGULATION_REMINDERS } from "./cara-prompt-library";
import { computeManagerReview, type ManagerReviewDecision } from "./cara-guardrails";

export interface DebriefInput {
  incidentSummary: string;
  staffActions?: string;
  childPresentation?: string;
  outcome?: string;
  staffFeelings?: string;
  whatWorked?: string;
  whatDidNotWork?: string;
}

export function generateStaffDebrief(input: DebriefInput): { output: CaraStaffDebriefOutput; review: ManagerReviewDecision } {
  const review = computeManagerReview({
    topicOrTheme: input.incidentSummary,
    guardrailSeverity: null,
    outputText: input.incidentSummary,
  });

  const feelings = input.staffFeelings?.trim();

  const output: CaraStaffDebriefOutput = {
    reflectiveSummary: `Something hard happened and you stayed in it — that matters before any analysis does. This debrief is about understanding, not judging: what the moment asked of you, what it asked of the child, and what you both needed. ${input.outcome ? `Where it landed: ${input.outcome}.` : ""}`,
    whatTheChildMayHaveBeenCommunicating: [
      "A need that couldn't find words — safety, control, space, significance or connection",
      input.childPresentation ? `Their presentation (${input.childPresentation.slice(0, 100)}) suggests the nervous system was driving, not choice` : "Behaviour that intense is usually a nervous-system response, not a decision",
      "Possibly something about earlier in the day, or earlier in their life, that the moment touched",
    ],
    whatWorkedWell: [
      input.whatWorked?.trim() || "You stayed, and the child experienced an adult who didn't disappear — name that win",
      "Identify one micro-moment of de-escalation that helped, however small, and keep it",
    ],
    whatCouldBeImproved: [
      input.whatDidNotWork?.trim()
        ? `Your own read: ${input.whatDidNotWork.trim()} — turn that into ONE specific change, not a general resolution`
        : "Pick one specific moment you'd replay differently — earlier offer of space, lower voice, fewer words",
      "Consider timing: was the demand load on the child (and on you) higher than the moment could carry?",
    ],
    relationalRepairPlan: [
      "Re-approach the child within 24 hours with something completely ordinary — presence before process",
      "If words were said in heat (either direction), name yours simply: 'I was firmer than I wanted to be. We're okay.'",
      "Plan the learning conversation for later, separately — repair first, learning second",
    ],
    staffRegulationReminder: feelings
      ? `You named feeling: "${feelings}". That's information, not weakness. ${STAFF_REGULATION_REMINDERS[4]} Take the break, debrief with a colleague, and don't carry this shift home alone.`
      : `${STAFF_REGULATION_REMINDERS[0]} You absorb impact in this work — schedule the decompression you'd prescribe a colleague.`,
    supervisionQuestions: [
      "What did this incident touch in you, beyond the practical?",
      "What support would have changed how it went — staffing, information, backup?",
      "Is this part of a pattern (time, trigger, pairing) the team should see?",
      "What do you need before the next similar moment?",
    ],
    recordingImprovements: [
      "Record observable facts and the child's words verbatim — interpretation goes in clearly-marked reflection",
      "Capture the BUILD-UP, not just the peak: the antecedents are where prevention lives",
    ],
    staffGuidance: "Debriefs are developmental, never disciplinary. If reading this feels like being marked, bring that feeling to supervision — the tool has failed its purpose for you and that's worth saying.",
    adaptationNotes: ["Use this solo first, then take the parts you choose into supervision — you own the reflection"],
    safeguardingNotes: "If reflection surfaces anything reportable (new information, practice concerns, allegations), it goes through the proper route the same day — reflection never substitutes for reporting.",
    signsToPause: ["You're rereading the incident on a loop — stop, decompress, return tomorrow", "Shame is louder than learning — do this WITH someone instead"],
    followUpActions: ["Book the supervision slot while it's fresh", review.required ? "Manager review flagged for this incident class" : "Share one practice insight at the next team meeting", "Diary the relational repair moment with the child"],
    recordingPrompt: RECORDING_PROMPTS.debrief,
    managerReviewNeeded: review.required,
  };

  return { output, review };
}
