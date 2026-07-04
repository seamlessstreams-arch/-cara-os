// ══════════════════════════════════════════════════════════════════════════════
// CARA — RISK ESCALATION ENGINE (pure, deterministic)
//
// Maps recorded evidence to a SUGGESTED escalation level on the four-level
// scheme. Rules fire only on explicit, structured flags — never on guesswork.
// The suggestion has no effect until a named manager confirms, amends or
// rejects it (decision-service.ts).
//
// Safeguarding-first ordering: immediate indicators are checked before high,
// high before emerging — one immediate flag outranks any number of lower ones.
// No model calls, no store access, no wall clock.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  EscalationEvidenceInput,
  EscalationEvidenceLine,
  EscalationLevel,
  EscalationLevelDefinition,
  EscalationSuggestion,
} from "./types";

export const RISK_ESCALATION_ENGINE_VERSION = "1.0.0";

// ── The four levels — definitions, required actions, timeframes (per spec) ────

export const ESCALATION_LEVEL_DEFINITIONS: Record<EscalationLevel, EscalationLevelDefinition> = {
  low_concern: {
    level: "low_concern",
    label: "Low concern",
    rank: 1,
    description: [
      "Low-level worry or single incident",
      "No immediate risk of harm",
      "Child is safe and engaged",
    ],
    requiredActions: ["Notify the key worker", "Record and monitor"],
    timeframe: "Within 24 hours",
  },
  emerging_concern: {
    level: "emerging_concern",
    label: "Emerging concern",
    rank: 2,
    description: [
      "Pattern developing",
      "Risk factors increasing",
      "Changes in behaviour, mood, engagement or presentation",
      "Potential risk of harm",
    ],
    requiredActions: [
      "Notify the manager",
      "Increase monitoring",
      "Gather information",
      "Update records",
    ],
    timeframe: "Same day",
  },
  high_concern: {
    level: "high_concern",
    label: "High concern",
    rank: 3,
    description: [
      "Significant risk of harm identified",
      "Persistent or escalating concerns",
      "Exploitation, abuse, serious harm or missing risk may be present",
    ],
    requiredActions: [
      "Notify the manager immediately",
      "Notify the social worker",
      "Review the risk assessment",
      "Consider a strategy discussion",
    ],
    timeframe: "Within 2 hours",
  },
  immediate_safeguarding: {
    level: "immediate_safeguarding",
    label: "Immediate safeguarding",
    rank: 4,
    description: [
      "Immediate danger",
      "Child at immediate risk of serious harm",
      "Disclosure of abuse, assault or serious high-risk situation",
      "Missing and whereabouts unknown",
    ],
    requiredActions: [
      "Ensure immediate safety",
      "Notify the manager",
      "Notify the social worker",
      "Contact police/emergency services if required",
      "Emergency review",
    ],
    timeframe: "Immediate",
  },
};

// ── Rule ladder (checked top-down; first tier with a hit wins) ────────────────

interface Rule {
  id: string;
  because: string;
  check: (e: EscalationEvidenceInput) => boolean;
}

const IMMEDIATE_RULES: Rule[] = [
  { id: "disclosure_of_abuse", because: "A disclosure of abuse or assault is recorded.", check: (e) => !!e.disclosureOfAbuse },
  { id: "immediate_danger", because: "The child is recorded as in immediate danger.", check: (e) => !!e.immediateDanger },
  { id: "serious_assault", because: "A serious assault is recorded.", check: (e) => !!e.seriousAssault },
  {
    id: "missing_whereabouts_unknown",
    because: "The child is missing and their whereabouts are unknown.",
    check: (e) => !!e.missingNow && !!e.whereaboutsUnknown,
  },
];

const HIGH_RULES: Rule[] = [
  { id: "significant_harm", because: "Indicators of significant risk of harm are recorded.", check: (e) => !!e.significantHarmIndicators },
  { id: "exploitation", because: "Exploitation indicators are recorded.", check: (e) => !!e.exploitationIndicators },
  { id: "persistent_escalating", because: "Concerns are persistent or escalating.", check: (e) => !!e.persistentOrEscalating },
  { id: "missing_risk", because: "A missing-related risk is present.", check: (e) => !!e.missingRisk || (!!e.missingNow && !e.whereaboutsUnknown) },
];

const EMERGING_RULES: Rule[] = [
  { id: "pattern_developing", because: "A pattern is developing across recent records.", check: (e) => !!e.patternDeveloping },
  { id: "risk_factors_increasing", because: "Risk factors are increasing.", check: (e) => !!e.riskFactorsIncreasing },
  {
    id: "presentation_changes",
    because: "Changes in behaviour, mood, engagement or presentation are recorded.",
    check: (e) => !!e.presentationChanges,
  },
  {
    id: "incident_frequency",
    because: "Three or more incidents in the last 30 days suggest a developing pattern.",
    check: (e) => (e.recentIncidentCount30d ?? 0) >= 3,
  },
];

function hits(rules: Rule[], e: EscalationEvidenceInput): EscalationEvidenceLine[] {
  return rules.filter((r) => r.check(e)).map((r) => ({ rule: r.id, because: r.because }));
}

// ── The suggester ──────────────────────────────────────────────────────────────

/**
 * Suggest an escalation level from recorded evidence. Deterministic; the
 * suggestion is advisory — a named manager confirms, amends or rejects it.
 */
export function suggestEscalationLevel(evidence: EscalationEvidenceInput): EscalationSuggestion {
  const immediate = hits(IMMEDIATE_RULES, evidence);
  if (immediate.length > 0) {
    return suggestion("immediate_safeguarding", immediate);
  }

  const high = hits(HIGH_RULES, evidence);
  if (high.length > 0) {
    return suggestion("high_concern", high);
  }

  const emerging = hits(EMERGING_RULES, evidence);
  if (emerging.length > 0) {
    return suggestion("emerging_concern", emerging);
  }

  const lines: EscalationEvidenceLine[] = [
    {
      rule: "no_elevated_indicators",
      because: evidence.childCurrentlySafe
        ? "No elevated indicators are recorded and the child is recorded as safe and engaged."
        : "No elevated indicators are recorded.",
    },
  ];
  return suggestion("low_concern", lines, "Suggested from the evidence recorded so far — if you know something the records don't yet show, record it and reassess, or amend the level with your reason.");
}

function suggestion(level: EscalationLevel, evidence: EscalationEvidenceLine[], caveat?: string): EscalationSuggestion {
  return {
    level,
    definition: ESCALATION_LEVEL_DEFINITIONS[level],
    evidence,
    caveat,
    engineVersion: RISK_ESCALATION_ENGINE_VERSION,
  };
}

/** Compare two levels — positive when a outranks b. */
export function compareLevels(a: EscalationLevel, b: EscalationLevel): number {
  return ESCALATION_LEVEL_DEFINITIONS[a].rank - ESCALATION_LEVEL_DEFINITIONS[b].rank;
}
