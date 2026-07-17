// ─────────────────────────────────────────────────────────────────────────────
// Ask CARA — Epistemic Labels (Practice Intelligence OS §4, acceptance 13)
//
// "Every answer must distinguish: FACT / ACCOUNT / ANALYSIS / HYPOTHESIS /
// ACTION." This classifies each line of Cara's OWN composed answer text so the
// chat can badge what kind of claim a line is making.
//
// Scope honesty: this is a deterministic classifier over Cara's own
// deterministic output — text the engine itself structured from records — not
// NLP over arbitrary prose. Lines that are headers, greetings or connective
// tissue are "context" and carry NO badge: forcing a label onto a non-claim
// would be exactly the over-claiming §4 forbids. Where cues conflict, the
// precedence is deliberately the cautious one: a hypothesis marker beats an
// analysis marker beats a fact marker — better to under-claim certainty than
// to present a possibility as established truth.
//
// Pure: no store, no AI, no imports beyond types.
// ─────────────────────────────────────────────────────────────────────────────

export type EpistemicLabel = "fact" | "account" | "analysis" | "hypothesis" | "action" | "context";

export interface LabelledLine {
  text: string;
  label: EpistemicLabel;
}

export const EPISTEMIC_META: Record<EpistemicLabel, { badge: string; description: string }> = {
  fact: { badge: "Fact", description: "Directly recorded or verified information" },
  account: { badge: "Account", description: "What a child, staff member, family member or professional reported" },
  analysis: { badge: "Analysis", description: "A reasoned interpretation based on stated evidence" },
  hypothesis: { badge: "Possibility", description: "A possibility that requires further exploration" },
  action: { badge: "Action", description: "Something agreed, required, recommended or overdue" },
  context: { badge: "", description: "Headers and connective text — not a claim" },
};

// Cue sets. Multi-word cues match as substrings; single words at boundaries
// (the repo's standing rule against substring false-positives).
const HYPOTHESIS_CUES = [
  "may ", "might ", "could be", "could this", "possibly", "consider whether",
  "worth exploring", "one possibility", "appears to", "seems to", "may indicate",
  "not a conclusion", "requires further", "worth a closer look", "unclear whether",
];
const ANALYSIS_CUES = [
  "pattern", "trend", "suggests", "compared with", "compared to", "vs the",
  "is a concern", "engine read", "signals point", "reads as",
  "increase", "decrease", "rising", "falling", "converg", "more often than",
  "over the last", "across the last", "on balance", "taken together",
];
const ACCOUNT_CUES = [
  " said", " says", " reported", " told ", " described", " disclosed",
  " raised ", "in their words", "in her words", "in his words", "according to",
  "child's view", "staff view", "asked for", "asked to",
];
const ACTION_CUES = [
  "overdue", "due by", "due on", "next step", "needs to", "should be booked",
  "review is due", "assign", "sign-off", "sign off required", "outstanding",
  "not yet done", "awaiting", "book a", "schedule", "escalate",
];
const FACT_CUES = [
  "recorded", "logged", "no debrief", "incidents", "entries", "placed", "admitted",
  "administered", "completed on", "on file", "last updated", "documented",
];

function hasCue(line: string, cues: string[]): boolean {
  const hay = line.toLowerCase();
  return cues.some((c) => {
    const needle = c.toLowerCase();
    if (/[^a-z]/.test(needle.trim()) || /\s/.test(needle.trim())) return hay.includes(needle);
    return new RegExp(`\\b${needle.trim()}\\b`).test(hay);
  });
}

/** Numbers + dates read as factual content ("3 incidents", "12 May", "7/10"). */
function looksNumericFactual(line: string): boolean {
  return /\b\d+\b/.test(line) && !/\?\s*$/.test(line);
}

function isStructural(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  // Headers ("**Today**", "— Incidents —"), greetings, questions back to the user.
  if (/^\*\*.*\*\*:?$/.test(t) || /^[—–-]{2,}/.test(t)) return true;
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/i.test(t)) return true;
  if (t.endsWith("?")) return true; // suggested questions are prompts, not claims
  if (t.length < 4) return true;
  return false;
}

/**
 * Classify one line. Precedence (cautious first): structural → hypothesis →
 * account → action → analysis → fact-cues/numeric → context.
 *
 * ACCOUNT before ACTION/ANALYSIS: "the child said she wants more contact" is an
 * account even though "wants" could read as a need; whose voice it is matters
 * more than what kind of clause it sits in.
 */
export function classifyLine(line: string): EpistemicLabel {
  if (isStructural(line)) return "context";
  if (hasCue(line, HYPOTHESIS_CUES)) return "hypothesis";
  if (hasCue(line, ACCOUNT_CUES)) return "account";
  if (hasCue(line, ACTION_CUES)) return "action";
  if (hasCue(line, ANALYSIS_CUES)) return "analysis";
  if (hasCue(line, FACT_CUES) || looksNumericFactual(line)) return "fact";
  return "context";
}

/** Label every line of a composed answer. Pure; order preserved. */
export function classifyEpistemics(text: string): LabelledLine[] {
  return text.split("\n").map((line) => ({ text: line, label: classifyLine(line) }));
}

/** True when the answer makes at least one labelled claim — used by the UI to
 *  decide whether showing badges adds anything. */
export function hasClaims(lines: LabelledLine[]): boolean {
  return lines.some((l) => l.label !== "context");
}
