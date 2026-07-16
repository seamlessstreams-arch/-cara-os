// ─────────────────────────────────────────────────────────────────────────────
// Cara — Language Covenant (Practice Doctrine, machine-readable half)
//
// PHILOSOPHY.md is the prose doctrine; this is the part code can call. It states
// how Cara is allowed to SPEAK in its own generated copy — alerts, prompts,
// notifications, drafted language — and gives a pure checker so the tone can be
// tested rather than hoped for. "The heart is a testable property, not a vibe."
//
// Two things are forbidden in Cara's own voice:
//   1. DEFICIT language about children — reused from the care-language-audit
//      vocabulary so there is ONE list, not two ("manipulative", "naughty",
//      "kicked off"…). That engine coaches staff records; the same words must
//      never appear in Cara's own output either.
//   2. ACCUSATORY / blame framing in Cara's alerts and nudges — this is
//      specific to system copy ("non-compliance detected", "failure to",
//      "violation"). Alerts are invitations to curiosity, not charges.
//
// Pure module: no store, no AI, no UI imports. Safe to use anywhere.
//
// WHY THERE IS NO REPO-WIDE grep GUARD FOR THIS. It was tried and rejected. The
// banned words appear legitimately across the tree in three ways a grep cannot
// tell apart from a breach: as regulatory STATUS ("non-compliant training
// record"), as DETECTION TARGETS (the care-language engine, the write-to-child
// shame-phrase filter), and as TEACHING examples (knowledge-base entries that
// say "don't write 'manipulative'"). A guard that must allowlist every
// legitimate use is worse than none. The covenant is enforced instead by (1)
// this callable checker, which new copy-generating code runs, and (2) the test
// suite, which asserts representative Cara copy honours the property. The test
// is the guard; the property is what's protected, not the substring.
// ─────────────────────────────────────────────────────────────────────────────

import { PATTERNS } from "@/lib/care-language-audit/care-language-audit-engine";

export type CovenantAudience = "about_child" | "to_staff" | "about_incident" | "alert";

export interface CovenantViolation {
  /** The offending phrase, lower-cased. */
  phrase: string;
  kind: "deficit_label" | "accusatory" | "blaming";
  /** Why it breaches the covenant. */
  why: string;
  /** What Cara should say instead. */
  preferred: string;
}

// ── Deficit labels about children — reused from care-language-audit ───────────
// Kept as a derived list so adding a pattern there flows here automatically.
const DEFICIT_TERMS: { phrase: string; preferred: string }[] = PATTERNS.map((p) => ({
  phrase: p.phrase.toLowerCase(),
  preferred: p.therapeuticAlternative,
}));

// ── Accusatory / blame framing in Cara's OWN copy ────────────────────────────
// These are the ways system copy slips into charging language. New here — the
// care-language engine does not cover them because staff records rarely contain
// them; Cara's own alerts are exactly where they creep in.
const ACCUSATORY_TERMS: { phrase: string; preferred: string; kind: "accusatory" | "blaming" }[] = [
  { phrase: "non-compliance", preferred: "worth a closer look", kind: "accusatory" },
  { phrase: "non-compliant", preferred: "not yet done", kind: "accusatory" },
  { phrase: "violation", preferred: "something to review", kind: "accusatory" },
  { phrase: "breach detected", preferred: "worth checking", kind: "accusatory" },
  { phrase: "failure to", preferred: "not yet", kind: "blaming" },
  { phrase: "failed to", preferred: "has not yet", kind: "blaming" },
  { phrase: "you should have", preferred: "next time it may help to", kind: "blaming" },
  { phrase: "you did not", preferred: "it looks like this is still open —", kind: "blaming" },
  { phrase: "you must immediately", preferred: "the next step is to", kind: "accusatory" },
  { phrase: "offender", preferred: "the young person", kind: "accusatory" },
  { phrase: "culprit", preferred: "the young person", kind: "accusatory" },
];

const lower = (s: string) => s.toLowerCase();

/** Word/phrase presence with word boundaries where the phrase is a single token,
 *  substring where it is multi-word (so "failure to" matches inside a sentence).
 *  Avoids the substring false-positives that have bitten this repo before. */
function contains(haystack: string, phrase: string): boolean {
  if (/\s/.test(phrase)) return haystack.includes(phrase);
  return new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(haystack);
}

/**
 * Review a piece of Cara's own copy against the covenant. Returns every
 * violation with the preferred alternative. Empty array = the copy is clean.
 *
 * `audience` scopes which rules apply: deficit labels are forbidden everywhere;
 * accusatory framing matters most in alerts and copy addressed to staff.
 */
export function reviewTone(text: string, audience: CovenantAudience = "alert"): CovenantViolation[] {
  const hay = lower(text);
  const out: CovenantViolation[] = [];

  for (const d of DEFICIT_TERMS) {
    if (contains(hay, d.phrase)) {
      out.push({
        phrase: d.phrase,
        kind: "deficit_label",
        why: "Deficit label about a child — describe the behaviour and the need, not a judgement.",
        preferred: d.preferred,
      });
    }
  }

  // Accusatory framing is a covenant breach in Cara's alerts and staff-facing
  // copy. In a verbatim quote ABOUT an incident it may be unavoidable, so it is
  // not enforced on that audience.
  if (audience !== "about_incident") {
    for (const a of ACCUSATORY_TERMS) {
      if (contains(hay, a.phrase)) {
        out.push({
          phrase: a.phrase,
          kind: a.kind,
          why:
            a.kind === "accusatory"
              ? "Accusatory framing — an alert is an invitation to curiosity, not a charge."
              : "Blaming framing — Cara addresses staff with respect, never 'you should have'.",
          preferred: a.preferred,
        });
      }
    }
  }

  return out;
}

/** Convenience: true when the copy honours the covenant for its audience. */
export function honoursTone(text: string, audience: CovenantAudience = "alert"): boolean {
  return reviewTone(text, audience).length === 0;
}

// ── Warmth & curiosity markers (for the affirmative half of the covenant) ────
// Not enforced (their absence is not a breach), but exposed so tests and copy
// tooling can check that invitational language is present where it should be.
export const CURIOSITY_MARKERS = [
  "worth a closer look",
  "worth checking",
  "consider",
  "might",
  "may help",
  "wonder",
  "what could",
  "what might",
  "why am i seeing this",
  "why cara is showing this",
];

export function readsAsInvitation(text: string): boolean {
  const hay = lower(text);
  return CURIOSITY_MARKERS.some((m) => hay.includes(m));
}
