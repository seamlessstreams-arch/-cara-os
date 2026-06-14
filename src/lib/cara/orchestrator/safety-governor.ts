// ══════════════════════════════════════════════════════════════════════════════
// Cara ORCHESTRATOR — SAFETY GOVERNOR
//
// The final gate before any Cara output is returned to the user. Checks EVERY
// response for violations of Cara's safety principles:
//
// - Does it make a decision instead of supporting judgement?
// - Does it minimise safeguarding risk?
// - Does it diagnose a child?
// - Does it blame the child?
// - Does it use cold/institutional/AI language?
// - Does it invent evidence?
// - Does it refer to records not retrieved?
// - Does it recommend unlawful action?
// - Does it need escalation?
// - Does it need manager approval?
// - Does it need Reg 40 notification consideration?
// - Does it need LADO/social worker consideration?
//
// If unsafe, blocks the response and returns reason + safer alternative +
// recommended steps. Uses banned phrases from existing guardrails plus
// additional deep checks specific to the orchestrator.
// ════════════════��════════════════════════════════��════════════════════════════

import { detectUnsafeOutput } from "../guardrails";
import { validateOutputSafety, sanitiseOutput, BANNED_PHRASES } from "../ai/safety";
import type { EvidenceItem, RiskLevel, SafetyReview } from "./types";

// ── Decision-Making Language ──────��───────────────────────────────────────
// Cara must not present itself as making statutory or professional decisions.

const DECISION_MAKING_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\bI (?:have decided|am deciding|decide|will decide|recommend we immediately)\b/i,
    message: "Cara appears to be making a decision rather than supporting judgement.",
  },
  {
    pattern: /\byou (?:must|should) immediately (?:remove|dismiss|suspend|exclude|restrain)\b/i,
    message: "Cara is directing a statutory or disciplinary action rather than suggesting review.",
  },
  {
    pattern: /\b(?:this child needs to be|the child should be) (?:removed|excluded|restrained|sectioned|medicated)\b/i,
    message: "Cara is directing a decision about a child's liberty, placement, or medical treatment.",
  },
  {
    pattern: /\bI (?:have|am) (?:conclud(?:ed|ing)|determin(?:ed|ing)) that\b/i,
    message: "Cara is presenting a conclusion as its own determination.",
  },
  {
    pattern: /\b(?:my assessment is|my professional view is|in my professional opinion)\b/i,
    message: "Cara is claiming a professional opinion — it is not a qualified professional.",
  },
  {
    pattern: /\bno safeguarding concern(?:s)?\b/i,
    message: "Cara is dismissing safeguarding concerns — only qualified humans can make this determination.",
  },
];

// ── Minimisation Patterns ───────���─────────────────────────────────────────
// Cara must not downplay or minimise safeguarding indicators.

const MINIMISATION_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\b(?:nothing to worry about|no cause for concern|not a safeguarding issue)\b/i,
    message: "Cara is minimising a potential safeguarding concern.",
  },
  {
    pattern: /\b(?:probably just|most likely just|it's just|only a minor)\b/i,
    message: "Cara may be minimising the significance of indicators.",
  },
  {
    pattern: /\b(?:normal behaviour for|typical teenage|just attention)\b/i,
    message: "Cara is normalising behaviour that may indicate unmet need or risk.",
  },
  {
    pattern: /\b(?:overreacting|making too much|blowing .* out of proportion)\b/i,
    message: "Cara is suggesting professionals are overreacting to indicators.",
  },
];

// ── Blame Language ──────────���─────────────────────────────────────────────

const BLAME_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\b(?:the child is|this child is|they are) (?:manipulative|attention.seeking|naughty|deliberately difficult|non.compliant|defiant)\b/i,
    message: "Cara is using blame language that labels the child negatively.",
  },
  {
    pattern: /\b(?:chose to|decided to|wanted to) (?:be disruptive|misbehave|cause trouble|be difficult)\b/i,
    message: "Cara is attributing blame/agency for distressed behaviour.",
  },
  {
    pattern: /\b(?:refusing to engage|won't cooperate|deliberately ignoring)\b/i,
    message: "Cara is framing a child's response as deliberate non-cooperation rather than communication.",
  },
];

// ── Diagnostic Language ──────────���─────────────────────────���──────────────

const DIAGNOSTIC_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\b(?:the child has|this child has|they have|diagnosed with|presenting with|symptoms of|suffers from)\s+(?:ADHD|ASD|autism|attachment disorder|ODD|conduct disorder|personality disorder|PTSD|anxiety disorder|depression)\b/i,
    message: "Cara is applying a clinical diagnosis — only qualified clinicians can diagnose.",
  },
  {
    pattern: /\b(?:the child is|this child is)\s+(?:autistic|ADHD|bipolar|schizophrenic|psychotic)\b/i,
    message: "Cara is labelling a child with a clinical diagnosis.",
  },
];

// ── Invented Evidence Patterns ────────────────────────────────────────────

const INVENTED_EVIDENCE_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\b(?:on|dated?)\s+\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i,
    message: "Specific date reference detected — verify this date exists in the source evidence.",
  },
  {
    pattern: /\b(?:staff member|carer|worker)\s+[A-Z][a-z]+\s+(?:said|reported|noted|observed|recorded)\b/,
    message: "Named staff member reference — verify this person and quote exist in evidence.",
  },
  {
    pattern: /\b(?:at approximately|at around)\s+\d{1,2}[:.]\d{2}\s*(?:am|pm|hours)\b/i,
    message: "Specific time reference — verify against source records.",
  },
];

// ── Cold/Institutional Language ──────���────────────────────────────────────

const INSTITUTIONAL_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\b(?:the subject|subject child|the minor|the individual|the resident)\b/i,
    message: "Cold, institutional language detected — use the child's name or 'the child/young person'.",
  },
  {
    pattern: /\b(?:non-compliant|non-engagement|placement disruption due to)\b/i,
    message: "System-blaming institutional language detected.",
  },
  {
    pattern: /\b(?:service user|client|case)\b/i,
    message: "Adult social care or generic service language — inappropriate for children's residential care.",
  },
];

// ── Unlawful Recommendations ──���───────────────────────────────────────────

const UNLAWFUL_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\b(?:restrain.*without|lock.*in.*room|remove.*belongings.*as punishment|withhold.*food|withhold.*contact)\b/i,
    message: "Cara may be recommending an action that could be unlawful or disproportionate.",
  },
  {
    pattern: /\b(?:search.*without consent|read.*diary|monitor.*phone.*without)\b/i,
    message: "Cara may be recommending a privacy intrusion without proper authority.",
  },
  {
    pattern: /\b(?:do not inform|don't tell|keep.*from.*social worker|hide.*from.*parents)\b/i,
    message: "Cara may be recommending concealment of information from entitled parties.",
  },
];

// ── Escalation Trigger Patterns ───────────────────────────────────────────

const ESCALATION_TRIGGERS: Array<{ pattern: RegExp; escalationType: string }> = [
  {
    pattern: /\b(?:allegation|disclosure|abuse|sexual|exploitation)\b/i,
    escalationType: "safeguarding",
  },
  {
    pattern: /\b(?:LADO|designated officer|police|criminal)\b/i,
    escalationType: "LADO/police",
  },
  {
    pattern: /\b(?:Reg 40|regulation 40|Schedule 5|Ofsted notification|serious incident)\b/i,
    escalationType: "Reg40_notification",
  },
  {
    pattern: /\b(?:social worker|IRO|placing authority|MASH|strategy)\b/i,
    escalationType: "multi_agency",
  },
];

// ── Main Safety Governor ──────────────────────────────────────────────────

export function reviewSafety(input: {
  rawOutput: string;
  riskLevel: RiskLevel;
  evidenceRetrieved: EvidenceItem[];
  query: string;
}): SafetyReview {
  const { rawOutput, riskLevel, evidenceRetrieved, query } = input;
  const warnings: string[] = [];
  const safetyNotes: string[] = [];
  let blocked = false;
  let blockReason: string | undefined;
  let escalationRequired = false;
  let managerApprovalRequired = false;
  let reg40ConsiderationRequired = false;
  let ladoConsiderationRequired = false;

  // ── Run existing safety checks from guardrails.ts ───────────────────────
  const guardrailFlags = detectUnsafeOutput(rawOutput);
  if (guardrailFlags.length > 0) {
    warnings.push(...guardrailFlags);
  }

  // ── Run existing safety validation from ai/safety.ts ──────────���─────────
  const safetyValidation = validateOutputSafety(rawOutput);
  if (!safetyValidation.safe) {
    warnings.push(...safetyValidation.warnings);
  }

  // ─�� Decision-making check ───────��───────────────────────────────────────
  for (const { pattern, message } of DECISION_MAKING_PATTERNS) {
    if (pattern.test(rawOutput)) {
      warnings.push(message);
      if (riskLevel === "critical" || riskLevel === "high") {
        blocked = true;
        blockReason = `Blocked: ${message} High/critical risk content must not contain decision-making language.`;
      }
    }
  }

  // ── Minimisation check ──────────────────────────────────────────────────
  for (const { pattern, message } of MINIMISATION_PATTERNS) {
    if (pattern.test(rawOutput)) {
      warnings.push(message);
      if (riskLevel === "critical") {
        blocked = true;
        blockReason = `Blocked: ${message} Critical risk content must not minimise concerns.`;
      }
    }
  }

  // ── Blame language check ────────────────────────────────────────────────
  for (const { pattern, message } of BLAME_PATTERNS) {
    if (pattern.test(rawOutput)) {
      warnings.push(message);
      // Blame language is always blocked regardless of risk level
      blocked = true;
      blockReason = `Blocked: ${message} Cara must never blame children.`;
    }
  }

  // ── Diagnostic language check ────────��──────────────────────────────────
  for (const { pattern, message } of DIAGNOSTIC_PATTERNS) {
    if (pattern.test(rawOutput)) {
      warnings.push(message);
      blocked = true;
      blockReason = `Blocked: ${message}`;
    }
  }

  // ── Invented evidence check ─────��───────────────────────────────────────
  for (const { pattern, message } of INVENTED_EVIDENCE_PATTERNS) {
    if (pattern.test(rawOutput)) {
      // Only block if no evidence was retrieved (higher chance of fabrication)
      if (evidenceRetrieved.length === 0) {
        warnings.push(`${message} No evidence was retrieved — high risk of fabrication.`);
        blocked = true;
        blockReason = "Blocked: Specific date/time/name references detected but no evidence was retrieved. High risk of invented evidence.";
      } else {
        safetyNotes.push(`${message} Evidence was retrieved — please verify references against source records.`);
      }
    }
  }

  // ── Institutional language check ────────────────────────────────────────
  for (const { pattern, message } of INSTITUTIONAL_PATTERNS) {
    if (pattern.test(rawOutput)) {
      warnings.push(message);
      // Not blocked, but flagged — sanitiser will help
    }
  }

  // ── Unlawful recommendations check ─────────────────────────────────────
  for (const { pattern, message } of UNLAWFUL_PATTERNS) {
    if (pattern.test(rawOutput)) {
      warnings.push(message);
      blocked = true;
      blockReason = `Blocked: ${message}`;
    }
  }

  // ��─ Escalation triggers ─────────────────────────────────────────────────
  for (const { pattern, escalationType } of ESCALATION_TRIGGERS) {
    if (pattern.test(rawOutput) || pattern.test(query)) {
      if (escalationType === "safeguarding" || escalationType === "LADO/police") {
        escalationRequired = true;
        ladoConsiderationRequired = escalationType === "LADO/police";
        safetyNotes.push(
          `Safeguarding theme detected — consider whether LADO referral or police contact is required.`
        );
      }
      if (escalationType === "Reg40_notification") {
        reg40ConsiderationRequired = true;
        safetyNotes.push(
          "Reg 40 notification theme detected — consider whether Ofsted must be notified."
        );
      }
      if (escalationType === "multi_agency") {
        safetyNotes.push(
          "Multi-agency theme detected — consider whether social worker/IRO should be informed."
        );
      }
    }
  }

  // ── Banned phrase detection ───────���───────────────────���─────────────────
  const lower = rawOutput.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      warnings.push(`AI-sounding phrase detected: "${phrase}" — will be removed by sanitiser.`);
    }
  }

  // ── Risk-level forced approvals ��────────────────────────────────────────
  if (riskLevel === "critical" || riskLevel === "high") {
    managerApprovalRequired = true;
  }
  if (riskLevel === "critical") {
    escalationRequired = true;
  }

  // ── Evidence gap warning ─────────────��──────────────────────��───────────
  if (evidenceRetrieved.length === 0 && riskLevel !== "low") {
    safetyNotes.push(
      "No evidence was retrieved for this query. Output confidence should be very low and this should be clearly stated."
    );
  }

  // ── Sanitise the output ─────────────────────────────────────────────────
  const sanitisedOutput = sanitiseOutput(rawOutput);

  return {
    passed: !blocked && warnings.length === 0,
    blocked,
    blockReason,
    warnings,
    safetyNotes,
    sanitisedOutput,
    escalationRequired,
    managerApprovalRequired,
    reg40ConsiderationRequired,
    ladoConsiderationRequired,
  };
}

// ── Blocked Response Builder ──────────────────────────────────────────────
// When the safety governor blocks a response, this builds a safe alternative
// that explains what happened and what the user should do next.

export function buildBlockedResponse(review: SafetyReview, riskLevel: RiskLevel): string {
  const parts: string[] = [
    "Cara has blocked this response because it did not meet safety standards.",
    "",
    `Reason: ${review.blockReason ?? "Safety check failed."}`,
    "",
    "What to do next:",
  ];

  if (review.escalationRequired) {
    parts.push("- This matter may require immediate safeguarding escalation. Speak to your Registered Manager or Designated Safeguarding Lead.");
  }

  if (review.reg40ConsiderationRequired) {
    parts.push("- Consider whether a Regulation 40 notification to Ofsted is required.");
  }

  if (review.ladoConsiderationRequired) {
    parts.push("- Consider whether a LADO referral is needed.");
  }

  if (review.managerApprovalRequired) {
    parts.push("- Manager review and approval is required before any action is taken.");
  }

  parts.push("- You can rephrase your query and try again, or seek direct support from your manager.");

  if (riskLevel === "critical") {
    parts.push("");
    parts.push("IMPORTANT: If a child is at immediate risk of harm, follow your home's emergency safeguarding procedures now. Do not wait for Cara.");
  }

  return parts.join("\n");
}
