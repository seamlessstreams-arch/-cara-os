// ═══════════════════════════════════════════════════════════════════════════
// CARA — NRM & MODERN SLAVERY  (shared knowledge · pure · deterministic)
//
// Decision-SUPPORT for the National Referral Mechanism (NRM) under the Modern
// Slavery Act 2015: helps staff recognise when a child may have been trafficked
// or held in modern slavery, and advises the manager / DSL to CONSIDER an NRM
// referral. This is KNOWLEDGE and ADVICE, not UI and not a decision.
//
// HARD SAFETY CONTRACT (carried from the rest of Cara, e.g. Reg 40):
//   • Cara ADVISES that the manager / DSL should CONSIDER whether an NRM referral
//     is required. Cara NEVER states a referral is definitely required, NEVER
//     decides, and NEVER makes a referral.
//   • A child who is criminally or sexually exploited is a VICTIM, not an
//     offender — even when they appear willing, are paid, or are found offending.
//     Apparent consent does not exist where a child has been groomed or coerced.
//   • For a child (under 18) NO CONSENT is needed to make an NRM referral, and
//     the 'means' (force/deception) does NOT have to be proven — exploitation
//     of the child is enough.
//   • Guard against adultification bias: a child is treated as a child first.
//
// No imports — self-contained so any engine can use it without import cycles.
// ═══════════════════════════════════════════════════════════════════════════

export const NRM_DEFINITION =
  "The National Referral Mechanism (NRM) is the UK framework for identifying and supporting potential victims of modern slavery and human trafficking, under the Modern Slavery Act 2015. Where staff suspect a child has been trafficked or enslaved, an NRM referral is made IN ADDITION to standard safeguarding referrals — it never replaces a safeguarding response or a 999 call.";

export const MODERN_SLAVERY_DEFINITION =
  "Modern slavery covers human trafficking, slavery, servitude, and forced or compulsory labour. Children may be trafficked or enslaved for sexual exploitation, criminal exploitation (including county lines), domestic servitude or labour exploitation (e.g. car washes, nail bars, cannabis cultivation). Child criminal and sexual exploitation are frequently also modern slavery.";

export const TRAFFICKING_VS_SMUGGLING =
  "Trafficking is not the same as smuggling. Trafficking is the movement or harbouring of a person for the purpose of exploitation for someone else's benefit; the victim is controlled and not free to leave. Smuggling is a paid service to enter a country illegally, after which the person is free to go. A trafficked child is a victim to be safeguarded — and for a child, movement does not have to involve force or deception to count as trafficking.";

export const NRM_CHILD_PRINCIPLE =
  "For a child (under 18): no consent is needed to make an NRM referral, and unlike for adults the 'means' (force, threats, deception) does not have to be present — the recruitment, movement or harbouring of a child for exploitation is itself trafficking. Trafficked children are at high risk of going missing, often soon after arrival.";

/** Standard advisory wording — mirrors REG40_WORDING. Advice, never a decision. */
export const NRM_WORDING =
  "The manager / DSL should consider whether a National Referral Mechanism (NRM) referral for suspected modern slavery or trafficking is required, alongside the usual safeguarding referrals.";

export const SECTION_45_DEFENCE =
  "Section 45 of the Modern Slavery Act 2015 provides a statutory defence where a child has been compelled to commit an offence as a direct result of their exploitation. Where a child has offended because they were exploited, staff ensure the child's status as a VICTIM is recognised and recorded — they are not treated as an offender first.";

export const NRM_FIRST_RESPONDER_NOTE =
  "First responders (including local authority children's services and the police) make NRM referrals; in the home this is led by the Registered Manager / DSL. Independent Child Trafficking Guardians support trafficked children (in the West Midlands, provided by Barnardo's, 0800 043 4303). The Modern Slavery Helpline (08000 121 700) can advise. An immediate threat to life is a 999 matter first.";

// ── Modern-slavery / trafficking indicators (with sign-spotting cues) ─────────
// Faithful to the policy's indicator lists. Cues are lower-cased substrings used
// for deterministic scanning. Recognising indicators PROMPTS consideration of a
// referral; it never confirms exploitation or replaces professional judgement.
export interface NRMIndicatorGroup {
  key: string;
  label: string;
  cues: string[];
}

export const MODERN_SLAVERY_INDICATORS: NRMIndicatorGroup[] = [
  {
    key: "control_coercion",
    label: "Control, debt or coercion by others",
    cues: ["controlled", "coerced", "coercion", "groom", "debt", "owe", "owes", "in trouble with", "indebted", "threatened", "threats", "forced", "made to", "intimidated", "afraid of", "in fear"],
  },
  {
    key: "trafficking_movement",
    label: "Trafficking / movement & harbouring",
    cues: ["trafficked", "trafficking", "another town", "another city", "out of area", "moved between", "moved around", "transported", "picked up", "dropped off", "went missing soon after", "missing soon after arrival", "harboured"],
  },
  {
    key: "criminal_exploitation",
    label: "Criminal exploitation (incl. county lines, money mule, weapons)",
    cues: ["county lines", "county line", "cuckoo", "cuckooing", "running drugs", "carrying drugs", "plugging", "money mule", "multiple phones", "second phone", "burner", "sim cards", "carrying a weapon", "carrying weapons", "stash", "go cunch", "trap house"],
  },
  {
    key: "sexual_exploitation",
    label: "Sexual exploitation",
    cues: ["sexual exploitation", "cse", "exchange for", "in exchange", "sexual activity in exchange", "older boyfriend", "older partner", "sugar daddy", "sextortion", "sexual images for"],
  },
  {
    key: "labour_servitude",
    label: "Labour exploitation / servitude",
    cues: ["car wash", "nail bar", "cannabis", "grow house", "weed farm", "forced to work", "working long hours", "domestic servitude", "not paid", "unpaid work", "labour exploitation"],
  },
  {
    key: "control_of_identity",
    label: "Documents / possessions controlled by others",
    cues: ["documents controlled", "passport taken", "id taken", "no documents", "few possessions", "vague account", "rehearsed account", "rehearsed story", "won't say where", "reluctant to disclose where", "someone else holds"],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS — prompt-ready guidance + deterministic NRM consideration
// ═══════════════════════════════════════════════════════════════════════════

/** Concise grounding block for LLM seams that consider safeguarding thresholds. */
export const NRM_GUIDANCE_BLOCK = [
  "MODERN SLAVERY / NRM AWARENESS:",
  `• ${MODERN_SLAVERY_DEFINITION}`,
  `• ${NRM_CHILD_PRINCIPLE}`,
  `• Where indicators of trafficking or modern slavery are present, ADVISE that the manager / DSL should consider an NRM referral (alongside the usual safeguarding referrals) — never state that a referral is definitely required, and never decide. A child who is exploited is a victim, not an offender (Section 45 defence may apply); guard against adultification bias.`,
].join("\n");

export interface NRMAssessment {
  /** Indicator groups detected in the text, with the cue that fired. */
  indicators: { key: string; label: string; cue: string }[];
  /** Whether Cara advises the DSL to CONSIDER an NRM referral (advice only). */
  adviseConsiderReferral: boolean;
  /** The advisory wording to surface (always advice, never a decision). */
  advice: string;
  /** Plain-language rationale naming what was spotted. */
  rationale: string;
}

/**
 * Deterministic NRM consideration: scans a free-text record for modern-slavery /
 * trafficking indicators and, if any are present, advises the manager / DSL to
 * CONSIDER an NRM referral. Quotes the cue; never invents; never decides.
 * Dedups by indicator group (first cue wins). Empty/clean text → no advice.
 */
export function assessNRMIndicators(text: string): NRMAssessment {
  const hay = (text || "").toLowerCase();
  const indicators: { key: string; label: string; cue: string }[] = [];
  if (hay.trim()) {
    for (const g of MODERN_SLAVERY_INDICATORS) {
      const hit = g.cues.find((c) => hay.includes(c));
      if (hit) indicators.push({ key: g.key, label: g.label, cue: hit });
    }
  }
  const advise = indicators.length > 0;
  return {
    indicators,
    adviseConsiderReferral: advise,
    advice: advise ? NRM_WORDING : "",
    rationale: advise
      ? `Possible modern-slavery / trafficking indicators detected: ${indicators.map((i) => `${i.label.toLowerCase()} ("${i.cue}")`).join("; ")}. A child who is exploited is a victim, not an offender (Section 45 may apply). No consent is needed to refer a child.`
      : "",
  };
}
