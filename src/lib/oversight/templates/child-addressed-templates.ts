// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGEMENT OVERSIGHT ENGINE · child-addressed templates
//
// Warm, simple, non-blaming oversight written directly TO the child. Built from
// an approved sentence bank only. Never discusses staff failures, policy, LADO,
// thresholds, other children, or workflow bureaucracy. Includes a banned-phrase
// scanner (for the UI) and deterministic suppression where a child-facing
// version would be unsafe — in which case nothing is produced.
// ══════════════════════════════════════════════════════════════════════════════

import type { OversightInput, ChildAddressedTone } from "../types";

// Phrases that must never appear in child-addressed oversight.
export const BANNED_CHILD_PHRASES: string[] = [
  "paperwork workflow",
  "associated records",
  "compliance",
  "staff debrief",
  "practice failure",
  "management action tracker",
  "action tracker",
  "policy breach",
  "policy",
  "formal review",
  "notification failure",
  "absconded",
  "non-compliant",
  "challenging behaviour",
  "made staff restrain",
  "refused to engage",
  "alleged",
  "allegation",
  "victim",
  "perpetrator",
  "lado",
  "threshold met",
  "threshold",
  "significant harm",
  "safeguarding",
  "referral",
  "you caused",
  "you failed",
  "restraint",
  "incident",
];

/** Returns any banned phrases found in the supplied child-facing text (case-insensitive, word-aware). */
export function scanForBannedPhrases(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const hits = new Set<string>();
  for (const phrase of BANNED_CHILD_PHRASES) {
    // Word-boundary-ish match so "policy" doesn't trip on unrelated substrings.
    const re = new RegExp(`(^|[^a-z])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i");
    if (re.test(lower)) hits.add(phrase);
  }
  return [...hits];
}

export interface ChildAddressedSuppression {
  suppressed: boolean;
  reason?: string;
}

/** Deterministic safety gate: when a child-facing version would be unsafe, suppress it. */
export function shouldSuppressChildAddressed(input: OversightInput, risk: string): ChildAddressedSuppression {
  const reasons: string[] = [];
  if (input.allegation) reasons.push("an allegation is present");
  if (input.disclosure) reasons.push("a disclosure is present");
  if (input.exploitationConcern) reasons.push("an exploitation concern is present");
  if (input.selfHarmConcern) reasons.push("a self-harm concern is present");
  if (input.emergencyServicesInvolved) reasons.push("emergency services were involved");
  if (risk === "critical") reasons.push("the risk level is critical");
  if (input.contradictoryInformation) reasons.push("the information is contradictory and needs manager-approved wording");
  if (input.recordType === "allegation" || input.recordType === "safeguarding") {
    reasons.push("a sensitive safeguarding matter requires manager-approved child-facing wording");
  }
  if (reasons.length === 0) return { suppressed: false };
  return {
    suppressed: true,
    reason: `A child-addressed version has been withheld for manager approval because ${reasons.join("; ")}. Please craft any child-facing wording sensitively with the child's key worker.`,
  };
}

const recordOpener: Record<string, string> = {
  daily_log: "I have read what was written about your day.",
  incident: "I have read what was written about what happened for you.",
  missing_episode: "I have read what was written about the time you were away.",
  physical_intervention: "I have read what was written about what happened, including when adults had to help keep everyone safe.",
  key_work: "I have read about your key-work time.",
  contact: "I have read about your family time.",
  education: "I have read about how school has been going.",
  health: "I have read about how you have been feeling and your health.",
  sanction_or_consequence: "I have read about what happened and what was decided afterwards.",
  room_search: "I have read about what happened.",
  medication: "I have read about your medicine and how it was looked after.",
  complaint: "I have read what you wanted to tell us.",
};

function opener(input: OversightInput): string {
  return recordOpener[input.recordType] ?? "I have read what was written about what happened for you.";
}

function toneClosing(tone: ChildAddressedTone | undefined): string {
  switch (tone) {
    case "younger_child":
      return "You matter a lot to us, and the grown-ups looking after you want you to feel safe and happy.";
    case "older_child":
      return "Your views really matter, and the adults supporting you want to get this right with you.";
    case "trauma_informed":
    case "highly_sensitive":
      return "However you have been feeling is okay, and the adults around you want to help you feel safe.";
    default:
      return "You matter, and the adults caring for you want you to feel safe and listened to.";
  }
}

/** Build the warm, safe child-addressed oversight from the approved sentence bank. */
export function buildChildAddressedOversight(input: OversightInput): string {
  const lines: string[] = [];
  const name = input.childName ? input.childName : "";

  lines.push(`${name ? name + ", " : ""}${opener(input).charAt(0).toLowerCase() + opener(input).slice(1)}`);
  lines.push("I want you to know this has been looked at carefully, because your safety and your feelings matter.");

  // PACE / curiosity (safe child wording)
  if (input.therapeuticModel === "PACE" || input.therapeuticModel === "trauma_informed" || input.therapeuticModel === "therapeutic_parenting") {
    lines.push("Adults are trying to understand what was happening underneath, not just what happened on the outside.");
    lines.push("You are not in trouble for having big feelings, and adults still need to help everyone stay safe.");
  }

  // Recent context / pattern (only gentle, never clinical)
  if (input.recentContext || input.patternContext) {
    lines.push("Adults have thought about what has been happening for you lately, and whether there are things that make harder days more likely.");
  }

  // Debrief / voice
  const cd = input.workflowCompletionContext?.childDebrief;
  if (cd?.status === "required_not_completed" || cd?.required) {
    lines.push("You should be offered some time to talk about how this felt for you, when you are ready. What you say can help adults understand what helped, what did not help, and what might need to change.");
  } else if (cd?.status === "required_completed") {
    lines.push("Thank you for sharing how you felt. What you said is helping the adults around you make things better.");
  }

  // Plan / what happens next (no bureaucracy)
  lines.push("We will make sure the adults caring for you know what helps you feel safer and calmer.");
  lines.push(toneClosing(input.childAddressedTone));

  let text = lines.join(" ");
  // Final safety net — strip any accidental banned phrase by softening (should never trigger
  // from the bank above; this guards future edits).
  const hits = scanForBannedPhrases(text);
  if (hits.length) {
    // Defensive: if the bank ever drifts, fall back to the safest generic message.
    text =
      `${name ? name + ", " : ""}I have read what was written, and I want you to know it has been looked at carefully because you matter. ` +
      "You should be offered time to talk about how things have felt for you when you are ready, and the adults caring for you will make sure they know what helps you feel safe.";
  }
  return text;
}
