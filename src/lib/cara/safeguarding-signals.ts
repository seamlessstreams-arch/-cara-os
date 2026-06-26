// ══════════════════════════════════════════════════════════════════════════════
// CARA — CANONICAL SAFEGUARDING SIGNAL REGISTRY
//
// ONE definition per safeguarding signal: what it is, why it matters, WHO must
// act, the STATUTORY trigger, how urgently, and the detection pattern. Today the
// same signals (exploitation, self-harm, missing, allegation, restraint,
// med-error, …) are re-detected with overlapping regex across several engines
// (cara-safeguarding-guardrails, pattern-detection, cara-heart's override engine,
// rules-engine). This is the single source those should consume.
//
// The patterns are grounded in the proven word-boundary banks already in
// cara-safeguarding-guardrails; the statutory metadata is grounded in cara-heart's
// SafeguardingOverrideEngine. The detector adds clause-level NEGATION awareness
// the scattered scanners lack ("no evidence of self-harm" would otherwise false-
// positive) — but, safeguarding-first, a negated match is still RETURNED with
// `negated: true` rather than dropped, so a concern that was considered is never
// hidden from a human reviewer.
//
// Pure + deterministic. Defines signals; it does NOT decide or notify — humans do.
// ══════════════════════════════════════════════════════════════════════════════

export type SafeguardingSignalId =
  | "physical_abuse"
  | "sexual_harm_exploitation"
  | "self_harm"
  | "missing_from_care"
  | "allegation_against_staff"
  | "neglect"
  | "contextual_exploitation"
  | "radicalisation"
  | "restrictive_practice"
  | "medication_error"
  | "peer_abuse_bullying"
  | "weapon"
  | "fire_setting";

/** How quickly a human must act once the signal is present. */
export type SafeguardingUrgency = "immediate" | "same_day" | "standard";

export interface SafeguardingSignal {
  id: SafeguardingSignalId;
  label: string;
  /** Why this matters for the child — the safeguarding rationale, in one line. */
  whyItMatters: string;
  /** Who must act. Cara never acts; it routes to the accountable human. */
  requiredRole: string;
  /** The statutory / regulatory trigger this signal engages. */
  statutoryTrigger: string;
  urgency: SafeguardingUrgency;
  /** Concise, non-prescriptive action guidance for the accountable human. */
  requiredAction: string;
  /** Word-boundary detection pattern (case-insensitive). */
  pattern: RegExp;
}

// Grounded in cara-safeguarding-guardrails patterns (broadened where they were
// too narrow — e.g. bare "exploitation") + cara-heart override-engine metadata.
export const SAFEGUARDING_SIGNALS: readonly SafeguardingSignal[] = [
  {
    id: "sexual_harm_exploitation",
    label: "Sexual harm or exploitation (CSE)",
    whyItMatters: "Sexual abuse or exploitation is among the gravest harms; evidence can be lost and risk escalates quickly.",
    requiredRole: "Designated safeguarding lead; consider LADO and police",
    statutoryTrigger: "Working Together 2026; Reg 40 notification; NRM/MACE referral",
    urgency: "immediate",
    requiredAction: "Refer to the DSL without delay. Consider LADO, social worker and police. Preserve evidence; do not question the child in a way that may contaminate it. Consider an NRM referral.",
    pattern: /\b(?:sexual\s+(?:abuse|exploitation|harm|assault)|child\s+sexual\s+exploitation|CSE|indecent|grooming|sexuali[sz]ed\s+behaviour|trafficking|sextortion)\b/i,
  },
  {
    id: "physical_abuse",
    label: "Physical abuse / non-accidental injury",
    whyItMatters: "Unexplained or non-accidental injury may indicate a child is being harmed and needs protection now.",
    requiredRole: "Designated safeguarding lead and social worker",
    statutoryTrigger: "Section 47 enquiry / strategy discussion; Reg 40 notification",
    urgency: "immediate",
    requiredAction: "Ensure the child is safe and seek medical attention if needed. Refer to the DSL and social worker. Record factually; preserve evidence.",
    pattern: /\b(?:physical\s+(?:abuse|harm|assault)|unexplained\s+(?:bruis\w+|marks|injur\w+)|non[-\s]?accidental\s+injur\w+|NAI)\b/i,
  },
  {
    id: "weapon",
    label: "Weapon concern",
    whyItMatters: "A weapon presents an immediate risk of serious harm to the child, peers and staff.",
    requiredRole: "Registered manager and police",
    statutoryTrigger: "Police involvement; Reg 40 notification",
    urgency: "immediate",
    requiredAction: "Ensure everyone's safety and follow emergency procedures. Contact police if required. Notify the manager and social worker. Record factually.",
    pattern: /\b(?:weapon|knife|knives|blade|firearm|gun|machete|stabbing)\b/i,
  },
  {
    id: "fire_setting",
    label: "Fire-setting concern",
    whyItMatters: "Deliberate fire-setting risks life and property and may signal acute distress.",
    requiredRole: "Registered manager; emergency services if active",
    statutoryTrigger: "Emergency services; Reg 40 notification",
    urgency: "immediate",
    requiredAction: "Ensure physical safety of all persons. Contact emergency services if required. Notify the manager and social worker. Record factually and preserve evidence.",
    pattern: /\b(?:fire[-\s]?setting|arson|set(?:ting)?\s+(?:a\s+)?fires?|deliberate\s+fire)\b/i,
  },
  {
    id: "allegation_against_staff",
    label: "Allegation against staff",
    whyItMatters: "An allegation against a person in a position of trust must follow a defined, time-bound process.",
    requiredRole: "Registered manager and LADO",
    statutoryTrigger: "LADO referral (within 1 working day); Working Together 2026; Reg 40",
    urgency: "immediate",
    requiredAction: "Refer to the LADO without delay and notify the registered manager. Do not investigate independently. Protect the child and preserve records.",
    pattern: /\b(?:allegation(?:s)?\s+(?:against|involving)\s+(?:a\s+)?(?:staff|worker|adult|carer)|LADO|position\s+of\s+trust|professional\s+boundar\w+)\b/i,
  },
  {
    id: "self_harm",
    label: "Self-harm or suicidal ideation",
    whyItMatters: "Self-harm or suicidal ideation indicates the child may be at risk of serious harm and needs support and review.",
    requiredRole: "Registered manager, social worker, and medical/CAMHS",
    statutoryTrigger: "Risk assessment review; medical advice; Reg 40 if significant",
    urgency: "same_day",
    requiredAction: "Ensure the child's immediate safety and seek medical advice if required. Notify the manager and social worker. Update the risk assessment. Record the child's voice where safe.",
    pattern: /\b(?:self[-\s]?harm(?:ing|ed)?|suicid(?:al|e)|ligature|overdose|cutting|hurting\s+(?:them|him|her)self)\b/i,
  },
  {
    id: "missing_from_care",
    label: "Missing from care",
    whyItMatters: "A child missing from care is at heightened risk of exploitation and harm while away.",
    requiredRole: "Police, social worker and placing authority",
    statutoryTrigger: "Police referral; independent Return Home Interview (Working Together 2026)",
    urgency: "same_day",
    requiredAction: "Ensure a police referral has been made and notify the social worker and placing authority. Arrange an independent return home interview. Update the missing-from-care plan.",
    pattern: /\b(?:missing\s+from\s+(?:care|home|placement)|abscond(?:ed|ing)?|missing\s+episode|went\s+missing|MFC)\b/i,
  },
  {
    id: "contextual_exploitation",
    label: "Contextual / criminal exploitation",
    whyItMatters: "Harm outside the home — county lines, gangs, criminal exploitation — needs a contextual safeguarding response.",
    requiredRole: "Designated safeguarding lead; MACE / contextual safeguarding partners",
    statutoryTrigger: "NRM referral; MACE; contextual safeguarding (Working Together 2026)",
    urgency: "same_day",
    requiredAction: "Notify the DSL and social worker. Consider an NRM referral and MACE. Map the contextual risks (people, places, peers) rather than focusing only on the child's behaviour.",
    pattern: /\b(?:criminal\s+exploitation|CCE|county\s+lines|gang\s+(?:affiliation|involvement|activity)|drug\s+running|cuckoo\w*|exploitation)\b/i,
  },
  {
    id: "radicalisation",
    label: "Radicalisation / extremism",
    whyItMatters: "Signs of radicalisation engage the Prevent duty and a distinct multi-agency safeguarding route.",
    requiredRole: "Designated safeguarding lead; Prevent / Channel",
    statutoryTrigger: "Prevent duty; Channel referral",
    urgency: "same_day",
    requiredAction: "Notify the DSL. Consider a Prevent/Channel referral. Record the specific concerns factually and avoid assumptions.",
    pattern: /\b(?:radicalis\w+|extremis\w+|terroris\w+|prevent\s+duty|channel\s+(?:panel|referral))\b/i,
  },
  {
    id: "neglect",
    label: "Neglect",
    whyItMatters: "Neglect of a child's basic needs causes cumulative harm and may meet the threshold for a Section 47 enquiry.",
    requiredRole: "Designated safeguarding lead and social worker",
    statutoryTrigger: "Section 47 enquiry where threshold met",
    urgency: "same_day",
    requiredAction: "Notify the DSL and social worker. Evidence the specific unmet needs and their impact on the child. Review the care plan.",
    pattern: /\b(?:neglect(?:ed|ful)?|failure\s+to\s+(?:protect|safeguard|supervise|provide)|unmet\s+(?:basic\s+)?needs)\b/i,
  },
  {
    id: "medication_error",
    label: "Medication error",
    whyItMatters: "A medication error can directly harm a child's health and must be reviewed and reported.",
    requiredRole: "Registered manager; GP / pharmacist",
    statutoryTrigger: "Medication incident review; Reg 40 if significant harm",
    urgency: "same_day",
    requiredAction: "Seek medical advice (GP / pharmacist / 111) on the specific error. Notify the manager. Record the error and review the cause to prevent recurrence.",
    pattern: /\b(?:medication\s+(?:error|incident)|wrong\s+(?:dose|medication)|missed\s+(?:dose|medication)|over[-\s]?medicat\w+|covert\s+medication|med(?:ication)?\s+error)\b/i,
  },
  {
    id: "restrictive_practice",
    label: "Restrictive physical intervention",
    whyItMatters: "Restraint restricts a child's liberty and risks harm; it must be necessary, proportionate and reviewed.",
    requiredRole: "Registered manager (oversight of each use)",
    statutoryTrigger: "Restraint recording and review; Reg 40 if injury",
    urgency: "same_day",
    requiredAction: "Ensure each use is recorded with the child's voice and reviewed by the manager. Check for injury. Consider whether it was necessary and proportionate, and what could prevent recurrence.",
    pattern: /\b(?:physical\s+(?:intervention|restraint)|restrictive\s+(?:practice|physical\s+intervention)|RPI|PMVA|prone\s+restraint|seclusion)\b/i,
  },
  {
    id: "peer_abuse_bullying",
    label: "Peer-on-peer abuse / bullying",
    whyItMatters: "Harm between children is abuse and must be safeguarded for both the child harmed and the child causing harm.",
    requiredRole: "Designated safeguarding lead and registered manager",
    statutoryTrigger: "Peer-on-peer (child-on-child) abuse procedures (Working Together 2026)",
    urgency: "same_day",
    requiredAction: "Safeguard both children. Notify the DSL. Record factually and review the dynamics, supervision and plans for each child involved.",
    pattern: /\b(?:bullying|peer[-\s]?(?:on[-\s]?peer|abuse|aggression|violence)|child[-\s]on[-\s]child\s+abuse|intimidat\w+|cyber[-\s]?bull\w+)\b/i,
  },
];

const SIGNALS_BY_ID: Record<SafeguardingSignalId, SafeguardingSignal> = Object.fromEntries(
  SAFEGUARDING_SIGNALS.map((s) => [s.id, s]),
) as Record<SafeguardingSignalId, SafeguardingSignal>;

export function getSafeguardingSignal(id: SafeguardingSignalId): SafeguardingSignal {
  return SIGNALS_BY_ID[id];
}

// Clause-level negation cues. Kept tight (clear negations only) — safeguarding
// errs toward flagging, so a negated match is annotated, not discarded.
const NEGATION_CUES =
  /\b(?:no|not|never|without|denie[sd]|deny|denying|ruled\s+out|absence\s+of|free\s+from|no\s+evidence\s+of|no\s+concerns?\s+(?:of|about|regarding)?|no\s+(?:sign|indication|suggestion)s?\s+of)\b/i;

// Clause boundaries: sentence punctuation AND contrastive conjunctions, so a
// negation in one clause ("No concerns…, but he disclosed self-harm") does not
// wrongly negate an asserted concern in the next — a dangerous false-negative.
const CLAUSE_BREAK = /[.!?;\n]|\b(?:but|however|although|though|whereas|yet)\b/gi;

export interface DetectedSafeguardingSignal {
  id: SafeguardingSignalId;
  label: string;
  urgency: SafeguardingUrgency;
  requiredRole: string;
  statutoryTrigger: string;
  requiredAction: string;
  whyItMatters: string;
  /** The exact text that matched. */
  matchedText: string;
  /** True if the match appears within a negating clause ("no evidence of …"). */
  negated: boolean;
}

const URGENCY_RANK: Record<SafeguardingUrgency, number> = {
  immediate: 0,
  same_day: 1,
  standard: 2,
};

/** Find the start index of the clause containing position `pos`. */
function clauseStart(text: string, pos: number): number {
  let start = 0;
  CLAUSE_BREAK.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CLAUSE_BREAK.exec(text)) !== null) {
    if (m.index >= pos) break;
    start = m.index + m[0].length;
  }
  return start;
}

/**
 * Scan free text for safeguarding signals using the canonical registry. Returns
 * one entry per matched signal (most urgent first; active before negated), each
 * carrying its statutory metadata so the caller can route to the right human.
 */
export function detectSafeguardingSignals(text: string): DetectedSafeguardingSignal[] {
  if (!text) return [];
  const out: DetectedSafeguardingSignal[] = [];

  for (const sig of SAFEGUARDING_SIGNALS) {
    const re = new RegExp(sig.pattern.source, "gi");
    const m = re.exec(text);
    if (!m) continue;
    const start = m.index;
    const cs = clauseStart(text, start);
    const preceding = text.slice(Math.max(cs, start - 60), start);
    out.push({
      id: sig.id,
      label: sig.label,
      urgency: sig.urgency,
      requiredRole: sig.requiredRole,
      statutoryTrigger: sig.statutoryTrigger,
      requiredAction: sig.requiredAction,
      whyItMatters: sig.whyItMatters,
      matchedText: m[0],
      negated: NEGATION_CUES.test(preceding),
    });
  }

  return out.sort((a, b) => {
    if (a.negated !== b.negated) return a.negated ? 1 : -1;
    return URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
  });
}

/** Active (non-negated) signals only — the ones that warrant action now. */
export function activeSafeguardingSignals(text: string): DetectedSafeguardingSignal[] {
  return detectSafeguardingSignals(text).filter((s) => !s.negated);
}

/** The most urgent active signal's urgency, or null if none. */
export function highestActiveUrgency(text: string): SafeguardingUrgency | null {
  const active = activeSafeguardingSignals(text);
  return active.length > 0 ? active[0].urgency : null;
}
