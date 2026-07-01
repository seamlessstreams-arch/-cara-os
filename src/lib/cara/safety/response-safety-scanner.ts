// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Response Safety Scanner
//
// Runs on every model response before it is returned to a caller. Two kinds of
// signal, handled differently:
//
//  - Compliance artifacts (the model appears to have followed a hijacked
//    instruction — e.g. claiming to have disabled safety rules) are NEVER
//    expected in a legitimate Cara response. Any match is unsafe.
//  - Identifier presence (a name, child ID, staff ID) is only unsafe when the
//    outbound prompt WAS redacted — the model should never echo or invent an
//    identifier when its input had none. When redaction was intentionally
//    skipped (some writing-assistant modes keep the child's own words by
//    design), identifier presence is expected and must not be flagged as
//    unsafe — only audited.
//
// This app redacts destructively (placeholder tokens, not a reversible
// pseudonym vault), so there is no "rehydration" step to protect — the closest
// equivalent risk, a leaked or hallucinated identifier in the response, is
// exactly what the identifier check below covers.
// ══════════════════════════════════════════════════════════════════════════════

import { detectChildIdentifiers, detectStaffIdentifiers, detectNames } from "./data-protection";

export interface ResponseSafetyResult {
  safe: boolean;
  /** Always-unsafe signals: the response looks like it complied with a hijack attempt. */
  complianceFlags: string[];
  /** Identifier-presence signals — only counted toward `safe` when redaction was applied. */
  identifierFlags: string[];
}

interface CompliancePattern {
  label: string;
  pattern: RegExp;
}

const COMPLIANCE_ARTIFACT_PATTERNS: CompliancePattern[] = [
  { label: "system_prompt_leak", pattern: /\b(my|the) system prompt (is|says|reads)\b/i },
  { label: "safety_override_claim", pattern: /\bi (have|will|am going to) (disabl(?:e|ed|ing)|bypass(?:ed|ing)?|ignor(?:e|ed|ing))( the| any| all)? (safety|safeguarding|governance) (rules|checks)?\b/i },
  { label: "jailbreak_ack", pattern: /\b(as |acting as )?(DAN|an unrestricted (AI|assistant))\b/i },
];

/**
 * Scan a model response for hijack-compliance artifacts and identifier leakage.
 * `redactionWasApplied` gates whether identifier presence counts as unsafe.
 */
export function scanAiResponse(
  text: string,
  opts: { redactionWasApplied: boolean },
): ResponseSafetyResult {
  const complianceFlags = COMPLIANCE_ARTIFACT_PATTERNS.filter((p) => p.pattern.test(text)).map((p) => p.label);

  const identifierFlags: string[] = [];
  if (detectChildIdentifiers(text)) identifierFlags.push("child_identifier_present");
  if (detectStaffIdentifiers(text)) identifierFlags.push("staff_identifier_present");
  if (detectNames(text)) identifierFlags.push("possible_name_present");

  const safe = complianceFlags.length === 0 && !(opts.redactionWasApplied && identifierFlags.length > 0);
  return { safe, complianceFlags, identifierFlags };
}
