// ═══════════════════════════════════════════════════════════════════════════
// CARA — WRITING TO THE CHILD  ·  anti-oppressive language bank
//
// Institutional / shaming / blaming wording → careful, child-conscious
// alternatives. Detection is case-insensitive substring matching; ambiguous
// everyday words (contact, placement) use more specific phrases to avoid
// false positives. Alternatives preserve risk clarity — they never soften a
// safeguarding concern away (preserveRisk entries make this explicit).
// ═══════════════════════════════════════════════════════════════════════════

export interface LanguageBankEntry {
  /** Lowercased substring/phrase to detect in the record. */
  match: string;
  /** How the term is shown back to the practitioner. */
  label: string;
  reason: string;
  alternatives: string[];
  severity: "high" | "medium" | "low";
  /** Exploitation/risk terms: the alternative must KEEP the risk explicit. */
  preserveRisk?: boolean;
  /** Carries a "use the child's own words" reminder (e.g. contact, sibling). */
  childWordsReminder?: boolean;
}

export const LANGUAGE_BANK: LanguageBankEntry[] = [
  {
    match: "refused to engage",
    label: "refused to engage",
    reason: "Adult-centred and may hide an unmet need; it frames the child as the problem rather than describing what happened.",
    alternatives: [
      "was not ready to talk at that time",
      "did not feel able to talk just then",
      "we have not yet found the best way to connect with them",
      "chose not to speak with staff at that moment",
    ],
    severity: "high",
  },
  {
    match: "refused to",
    label: "refused to…",
    reason: "\"Refused\" can sound defiant and blaming; describe what the child did and what they may have needed.",
    alternatives: [
      "was not able to… at that time",
      "did not want to… just then",
      "found it too hard to… in that moment",
    ],
    severity: "medium",
  },
  {
    match: "non-compliant",
    label: "non-compliant",
    reason: "Clinical and blaming; reduces the child to whether they obeyed.",
    alternatives: [
      "found it difficult to follow the plan",
      "did not agree with the boundary",
      "was not able to accept the boundary at that time",
    ],
    severity: "high",
  },
  {
    match: "noncompliant",
    label: "noncompliant",
    reason: "Clinical and blaming; reduces the child to whether they obeyed.",
    alternatives: ["found it difficult to follow the plan", "was not able to accept the boundary at that time"],
    severity: "high",
  },
  {
    match: "absconded",
    label: "absconded",
    reason: "Carries a criminal-justice tone for a child who went missing and may have been at risk.",
    alternatives: [
      "went missing",
      "left the home without staff agreement",
      "left before staff could confirm they were safe",
    ],
    severity: "high",
  },
  {
    match: "returned safe and well",
    label: "returned safe and well",
    reason: "A summary phrase that hides the welfare check, the child's presentation and what was offered. It can mask risk.",
    alternatives: [
      "returned to the home; staff completed a welfare check; [describe presentation — e.g. appeared quiet and tired]; [describe what was seen/offered — food, reassurance, space]",
    ],
    severity: "high",
  },
  {
    match: "challenging behaviour",
    label: "challenging behaviour",
    reason: "Labels the child rather than describing what happened or what it communicated.",
    alternatives: [
      "behaviour showing distress",
      "became overwhelmed",
      "expressed anger by [describe what happened]",
      "showed distress through [describe what happened]",
    ],
    severity: "high",
  },
  {
    match: "manipulative",
    label: "manipulative",
    reason: "Attributes adult intent and shames the child; trauma behaviours are not manipulation.",
    alternatives: [
      "trying to meet a need in the only way available to them",
      "communicating a need indirectly",
    ],
    severity: "high",
  },
  {
    match: "attention seeking",
    label: "attention seeking",
    reason: "Dismissive; a child seeking attention is usually seeking connection or safety.",
    alternatives: ["seeking connection", "communicating a need for support or reassurance"],
    severity: "high",
  },
  {
    match: "attention-seeking",
    label: "attention-seeking",
    reason: "Dismissive; a child seeking attention is usually seeking connection or safety.",
    alternatives: ["seeking connection", "communicating a need for support or reassurance"],
    severity: "high",
  },
  {
    match: "naughty",
    label: "naughty",
    reason: "Moralising and shaming; describe the behaviour and its context instead.",
    alternatives: ["found it hard to manage [situation]", "showed distress by [describe]"],
    severity: "high",
  },
  {
    match: "defiant",
    label: "defiant",
    reason: "Frames the child as oppositional; describe what they did and what they may have needed.",
    alternatives: ["did not agree with the boundary", "found the boundary hard to accept at that time"],
    severity: "medium",
  },
  {
    match: "aggressive",
    label: "aggressive (undescribed)",
    reason: "A label without description; record specifically what was seen so a future reader understands.",
    alternatives: ["raised their voice", "moved towards/away from staff", "[describe exactly what happened]"],
    severity: "medium",
  },
  {
    match: "hard to place",
    label: "hard to place",
    reason: "Locates the problem in the child rather than in the system around them.",
    alternatives: [
      "adults have not yet found the right home or support plan",
      "the matching process has not yet identified the right environment for them",
    ],
    severity: "high",
  },
  {
    match: "placement breakdown",
    label: "placement breakdown",
    reason: "Implies the child broke something; the support around them ended.",
    alternatives: ["the home was no longer able to meet their needs", "the support plan needed to change"],
    severity: "medium",
  },
  {
    match: "placement",
    label: "placement",
    reason: "Institutional; for the child this is their home. Formal/legal documents may still require the term — use judgement.",
    alternatives: ["home", "where you live", "the home you were living in"],
    severity: "low",
  },
  {
    match: "putting themselves at risk",
    label: "putting themselves at risk",
    reason: "Blames the child for harm done to or around them; it can imply consent to exploitation.",
    alternatives: [
      "is exposed to risk in [context]",
      "is being placed at risk by [context / others]",
    ],
    severity: "high",
    preserveRisk: true,
  },
  {
    match: "risky lifestyle",
    label: "risky lifestyle",
    reason: "Blames the child and implies choice where there may be coercion or unmet need.",
    alternatives: ["is exposed to risk in their current circumstances", "faces risks in the contexts they are moving through"],
    severity: "high",
    preserveRisk: true,
  },
  {
    match: "sexually active",
    label: "sexually active (in a risk/exploitation context)",
    reason: "A child cannot consent to their own exploitation; this phrasing can imply consent and hide grooming or coercion.",
    alternatives: [
      "is being sexually exploited / is at risk of sexual exploitation (a child cannot consent to their own abuse)",
      "[record the power imbalance, coercion or grooming clearly]",
    ],
    severity: "high",
    preserveRisk: true,
  },
  {
    match: "older boyfriend",
    label: "older boyfriend / older partner",
    reason: "Frames an exploitative dynamic as a relationship; record the power imbalance and possible grooming.",
    alternatives: [
      "an older person who may be exploiting them (record age gap and power imbalance)",
      "[name the grooming / control / exploitation clearly rather than 'relationship']",
    ],
    severity: "high",
    preserveRisk: true,
  },
  {
    match: "boyfriend",
    label: "boyfriend (in a possible exploitation context)",
    reason: "If there is a power imbalance or risk, 'boyfriend/relationship' can mask exploitation.",
    alternatives: ["[if exploitation is suspected, record the power imbalance and concern rather than 'relationship']"],
    severity: "low",
    preserveRisk: true,
  },
  {
    match: "lac",
    label: "LAC",
    reason: "An acronym that reduces the child to a status; spell out or use the child's name.",
    alternatives: ["the child / young person we care for", "[child's name]"],
    severity: "medium",
  },
  {
    match: "contact",
    label: "contact",
    reason: "Institutional for what is, for the child, time with people they love.",
    alternatives: ["family time", "time with Mum", "time with Dad", "seeing family"],
    severity: "low",
    childWordsReminder: true,
  },
  {
    match: "sibling",
    label: "sibling",
    reason: "Clinical; use the child's own words for the people they love.",
    alternatives: ["brother", "sister", "[the child's own words]"],
    severity: "low",
    childWordsReminder: true,
  },
  {
    match: "kicked off",
    label: "kicked off",
    reason: "Slang that minimises distress and sounds dismissive.",
    alternatives: ["became distressed and dysregulated", "became overwhelmed"],
    severity: "high",
  },
];

/** Detect bank entries present in the text (deduped by label, first match wins). */
export function detectLanguage(text: string): LanguageBankEntry[] {
  const hay = (text || "").toLowerCase();
  const out: LanguageBankEntry[] = [];
  const seen = new Set<string>();
  for (const e of LANGUAGE_BANK) {
    if (!seen.has(e.label) && hay.includes(e.match)) {
      out.push(e);
      seen.add(e.label);
    }
  }
  return out;
}
