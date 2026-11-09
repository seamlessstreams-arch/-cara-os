// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDING "WHAT CHANGED" CHECK  (pure · deterministic)
//
// Practice-patterns brief C: a record must show what the child EXPERIENCED and
// what CHANGED — not merely that an action happened. A tick, signature, date or
// upload is not enough.
//
// Distinct from the Reg 45 evidence-vs-evaluation check (1d, which wraps
// analyzePractice's activity-vs-impact prose analysis): THIS targets the
// ADMINISTRATIVE-completion class specifically — "uploaded / signed / dated /
// filed / completed" with no account of experience or change — which the
// activity lexicon does not cover. Per-record, usable on any record's text.
//
// Pure: imports only the word-boundary keyword matcher.
// ══════════════════════════════════════════════════════════════════════════════

import { containsAnyKeyword, matchedKeywords } from "@/lib/keyword-match";

// Administrative completion — an action was done, but says nothing of impact.
const ADMIN_COMPLETION: readonly string[] = [
  "uploaded",
  "signed",
  "dated",
  "ticked",
  "box ticked",
  "filed",
  "actioned",
  "completed",
  "form completed",
  "task completed",
  "logged",
  "saved to file",
  "added to file",
  "scanned",
];

// Language that evidences the child's experience or a change for the child.
const EXPERIENCE_OR_CHANGE: readonly string[] = [
  "experienced",
  "what changed",
  "became",
  "now able",
  "for the first time",
  "difference",
  "felt",
  "feels",
  "said",
  "told",
  "showed",
  "chose to",
  "asked for",
  "settled because",
  "calmer because",
  "no longer",
  "started to",
  "able to",
];

export type RecordChangeIssue =
  | "administrative_completion_only"
  | "no_account_of_experience_or_change";

export interface RecordChangeResult {
  evidencesChange: boolean;
  issue?: RecordChangeIssue;
  adminCues: string[]; // the administrative-completion phrases found
  prompt?: string;
}

/**
 * Does this record evidence what the child experienced / what changed, beyond an
 * administrative action being done?
 */
export function recordEvidencesChange(text: string): RecordChangeResult {
  const clean = (text ?? "").trim();
  const adminCues = matchedKeywords(clean, ADMIN_COMPLETION);

  if (containsAnyKeyword(clean, EXPERIENCE_OR_CHANGE)) {
    return { evidencesChange: true, adminCues };
  }

  if (adminCues.length > 0) {
    return {
      evidencesChange: false,
      issue: "administrative_completion_only",
      adminCues,
      prompt:
        "This records that an action was done (e.g. " +
        adminCues.slice(0, 3).join(", ") +
        ") but not what the child experienced or what changed. A tick, signature, date or upload is not enough — add what was different for the child.",
    };
  }

  return {
    evidencesChange: false,
    issue: "no_account_of_experience_or_change",
    adminCues,
    prompt: "Add what the child experienced and what changed — not only what was done.",
  };
}
