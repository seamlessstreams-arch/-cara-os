// ═══════════════════════════════════════════════════════════════════════════
// CARA — CONTEXTUAL SAFEGUARDING  (shared knowledge · pure · deterministic)
//
// Encodes the Contextual Safeguarding model (Prof. Carlene Firmin MBE) AND the
// "Safeguarding Beyond Surveillance" critical-justice lens, so every engine —
// Cara Studio generators, practice-intelligence analysis and drafting, incident
// analysis, the contextual-safeguarding intelligence engine — reasons with the
// SAME model. This is KNOWLEDGE, not UI. It produces:
//   (a) concise system-prompt grounding for the LLM seams, and
//   (b) deterministic reflective-question / sign-spotting sets that work no-key.
//
// Faithful to the source deck (15 slides). Two halves held together:
//   PRACTICE MODEL ............ how harm beyond the front door is understood and
//                               worked with (ecological, extra-familial, Level 1/2,
//                               Context Conference, the statutory threshold gap).
//   ETHICAL GUARDRAIL ......... how a data-driven assistant must NOT become part
//                               of the harm: guardianship-not-surveillance, the
//                               bias ratchet, constrained choices, data firewalls,
//                               children's rights. Cara is itself a data system —
//                               this half disciplines Cara's own flagging.
//
// Hard contract (carried from the rest of Cara): Cara informs guardianship; it
// never surveils, never profiles, never criminalises a child for surviving an
// unsafe context, and never makes a safeguarding decision. Understanding the
// context of behaviour is never the same as excusing harm — children still
// require safety and adults remain responsible for their actions.
//
// No imports — self-contained so any engine can use it without import cycles.
// ═══════════════════════════════════════════════════════════════════════════

export type ContextualSafeguardingKey =
  | "ecological_model"
  | "diagnostic_matrix"
  | "ethical_pillars"
  | "extra_familial_harm"
  | "operational_levels"
  | "context_conference"
  | "statutory_threshold_gap"
  | "guardianship_not_surveillance"
  | "bias_ratchet"
  | "data_ethics"
  | "social_model";

// ── 0. THE PARADIGM SHIFT ─────────────────────────────────────────────────────
// Traditional child protection targets the individual child and their family.
// Contextual Safeguarding targets the social and physical CONTEXTS in which harm
// happens — because for adolescents, most significant harm occurs beyond the
// front door, where parents have limited influence.

export const CONTEXTUAL_SAFEGUARDING_PARADIGM =
  "Contextual Safeguarding (Prof. Carlene Firmin MBE) recognises that as children grow into adolescence, the risks they face increasingly occur BEYOND the front door — in peer groups, schools, neighbourhoods, on public transport and online — spaces parents cannot control. The task shifts from changing the individual child to changing the social and physical context that is facilitating the harm. Behaviour that looks like risk-taking is often an intelligent survival strategy within a dangerous context; the analytical job is to understand the context, not to blame the child or the parent for it.";

// ── 1. THE ECOLOGICAL MODEL — nested contexts beyond the front door ───────────
// The "ecological blindspot": traditional models assume the family home is the
// whole world of risk. In reality the child moves through widening contexts.

export interface EcologicalContext {
  key: string;
  name: string;
  /** What this layer is, and why it matters for adolescent harm. */
  note: string;
}

export const ECOLOGICAL_CONTEXTS: EcologicalContext[] = [
  { key: "family_home", name: "Family / home", note: "The context traditional child protection is built for — intra-familial care and harm. Still vital, but for adolescents it is rarely the whole picture." },
  { key: "peer_groups", name: "Peer groups", note: "Friendships, group affiliations and peer norms shape behaviour and risk more than any single adult during adolescence." },
  { key: "schools_neighbourhoods", name: "Schools & neighbourhoods", note: "Education settings, parks, shops, estates and transport hubs — the physical spaces where harm is enabled or interrupted." },
  { key: "online_spaces", name: "Online spaces", note: "Social media, messaging and gaming — a context that crosses every other, with its own grooming, exploitation and reputational risks." },
];

export const PARENTAL_FALLACY_PRINCIPLE =
  "The parental fallacy: traditional models assume parents have total control over neighbourhood safety, peer norms and online networks. They do not. When harm happens in a public or peer context, treating it as a failure of parental care misreads the problem — in a 2015 review of 145 children harmed in public or peer contexts, services consistently mischaracterised extra-familial abuse as parental neglect.";

export const CONSTRAINED_CHOICES_PRINCIPLE =
  "Constrained choices: an adolescent's survival strategies inside a dangerous context — carrying a weapon for protection, group affiliation, going along with exploitation — are responses to threat, not evidence of a bad child. Stripped of their context they look like delinquency; in context they are constrained choices. The result of ignoring this is that harm escalates, because the state tries to modify the child in isolation rather than neutralising the environmental risk — and the child is criminalised for surviving.";

// ── 2. DIAGNOSTIC MATRIX — traditional vs contextual ──────────────────────────

export interface DiagnosticDimension {
  key: string;
  dimension: string;
  traditional: string;
  contextual: string;
}

export const DIAGNOSTIC_MATRIX: DiagnosticDimension[] = [
  { key: "locus_of_risk", dimension: "Primary locus of risk", traditional: "Intra-familial (abuse, neglect by parents)", contextual: "Extra-familial (peers, schools, transport, online)" },
  { key: "target", dimension: "Core target of intervention", traditional: "The individual child and their parents", contextual: "The social or physical context facilitating the harm" },
  { key: "parental_role", dimension: "Parental role", traditional: "Assessed on capacity to protect; often blamed", contextual: "Recognised as partners with limited external influence" },
  { key: "partnerships", dimension: "Key partnerships", traditional: "Statutory agencies (social care, police)", contextual: "Non-traditional partners (local businesses, transport staff, schools, residents)" },
  { key: "success_metric", dimension: "Primary metric of success", traditional: "Behavioural change in the child", contextual: "Structural and environmental change making the space safe" },
];

// ── 3. CORE ETHICAL PILLARS / FOUNDATIONAL PRINCIPLES ─────────────────────────

export interface EthicalPillar {
  key: string;
  name: string;
  principle: string;
}

export const CORE_ETHICAL_PILLARS: EthicalPillar[] = [
  { key: "ecological", name: "Ecological", principle: "Spaces are not neutral; inequality drives vulnerability. Assess the context, not only the child." },
  { key: "collaborative", name: "Collaborative", principle: "Co-design safety plans with local residents and non-traditional partners who hold the risk environment." },
  { key: "rights_based", name: "Rights-based", principle: "Uphold adolescents' rights to privacy and association (UNCRC). Safety must not be bought with a child's freedom or dignity." },
  { key: "strengths_based", name: "Strengths-based", principle: "Mobilise existing community and youth networks; build guardianship rather than removing the child from their world." },
  { key: "evidence_informed", name: "Evidence-informed", principle: "Ground decisions in what is actually known about the context and the child's lived experience, not assumption or anxiety." },
  { key: "ethic_of_care", name: "Ethic of care", principle: "Relationships with trusted, invested adults are the mechanism of safety — not monitoring, exclusion or control." },
];

// ── 3b. THE FOUR CONTEXTUAL SAFEGUARDING DOMAINS ──────────────────────────────
// The canonical framework (Durham University Contextual Safeguarding Research
// Programme). A system is contextual when it works across all four domains.

export interface ContextualDomain {
  domain: 1 | 2 | 3 | 4;
  name: string;
  goal: string;
}

export const CONTEXTUAL_SAFEGUARDING_DOMAINS: ContextualDomain[] = [
  { domain: 1, name: "Target", goal: "Prevent, identify, assess and intervene with the social conditions of abuse — the contexts, not only the individual child." },
  { domain: 2, name: "Legislative framework", goal: "Incorporate extra-familial contexts into child-protection frameworks and decision-making." },
  { domain: 3, name: "Partnerships", goal: "Develop partnerships with the individuals and agencies responsible for the extra-familial contexts (schools, transport, businesses, residents)." },
  { domain: 4, name: "Outcomes", goal: "Monitor success against contextual change, not only individual change — is the space safer, not just the child 'compliant'?" },
];

// ── 4. EXTRA-FAMILIAL HARM (EFH) — contexts + sign-spotting cues ───────────────
// Where extra-familial harm shows up, and the cues that should prompt a
// contextual lens. These cues drive deterministic sign-spotting in the engines.

export interface EFHContext {
  key: string;
  name: string;
  /** Lower-cased substrings that, in a record, suggest this context is in play. */
  cues: string[];
  /** A contextual (not child-blaming) reflective prompt for this context. */
  reflection: string;
}

export const EXTRA_FAMILIAL_HARM_CONTEXTS: EFHContext[] = [
  {
    key: "peer_networks",
    name: "Peer networks",
    cues: ["older friends", "older associate", "new friends", "peer group", "gang", "group of", "associates", "people he met", "people she met", "older male", "older boys", "older girls"],
    reflection: "Who are the peers and associates around this child, and what norms or pressures does that group carry? Map the network, not just the child.",
  },
  {
    key: "school_environments",
    name: "School / education settings",
    cues: ["school", "college", "exclusion", "excluded", "suspended", "reduced timetable", "not in education", "off rolled", "off-rolled", "truant", "education"],
    reflection: "Is education a protective context or a push factor? School exclusion and reduced timetables are major drivers into exploitation — consult before any exclusion.",
  },
  {
    key: "neighbourhood",
    name: "Neighbourhood / public spaces",
    cues: ["park", "estate", "shop", "shopping centre", "town centre", "the block", "trap house", "address we don't", "unknown address", "out of area", "hotspot", "local area"],
    reflection: "Which physical locations recur in this child's harm? Record locations of harm alongside the home address — a place can be the case.",
  },
  {
    key: "public_transport",
    name: "Public transport",
    cues: ["train", "station", "bus", "coach", "taxi", "uber", "travelling to", "transport hub", "out of area", "another city", "another town", "rail"],
    reflection: "Is the child being moved between areas? Transport hubs and out-of-area travel are classic county-lines markers — involve transport staff as partners.",
  },
  {
    key: "online_spaces",
    name: "Online spaces",
    cues: ["online", "snapchat", "instagram", "tiktok", "social media", "messaging", "discord", "gaming", "phone", "encrypted", "new phone", "second phone", "burner"],
    reflection: "What is happening in the child's online context — grooming, coercion, threats, or sharing of images? Online crosses every other context.",
  },
  {
    key: "exploitation",
    name: "Exploitation markers (CSE / CCE / county lines)",
    cues: ["county lines", "county line", "cuckoo", "drugs", "dealing", "running", "missing", "went missing", "unexplained money", "unexplained gifts", "new clothes", "new trainers", "weapon", "knife", "owe", "debt", "exploit", "groom", "controlled", "coerced", "trafficked", "trafficking"],
    reflection: "Treat exploitation markers as a contextual risk to be screened and disrupted — not as the child's choice or wrongdoing. Consider exploitation screening and whether the manager should make a referral.",
  },
];

export const EFH_DEFINITION =
  "Extra-familial harm (EFH): risks occurring in spaces beyond parental control — peer networks, schools, neighbourhoods, transport hubs and online — including child sexual exploitation, child criminal exploitation, county lines, serious youth violence, peer-on-peer abuse and online harms.";

// ── 5. OPERATIONAL LEVELS ─────────────────────────────────────────────────────

export interface OperationalLevel {
  level: 1 | 2;
  name: string;
  description: string;
  practiceExample: string;
}

export const OPERATIONAL_LEVELS: OperationalLevel[] = [
  {
    level: 1,
    name: "Individual casework",
    description: "Bringing extra-familial contexts into the individual child's assessment.",
    practiceExample: "Recording locations of harm alongside the home address; reframing behavioural issues as contextual risks rather than parental neglect.",
  },
  {
    level: 2,
    name: "Environmental casework",
    description: "Intervening directly with contexts and peer groups in their own right, independent of any single child's social-care record.",
    practiceExample: "Joint environmental safety mapping; location-based case notes to shift harmful cohort dynamics; working with the people who manage the space.",
  },
];

// ── 6. THE CONTEXT CONFERENCE & THE 'PLACE MANAGER' ───────────────────────────

export const PLACE_MANAGER_PRINCIPLE =
  "In a traditional case, parents are central because they manage the home. In a Context Conference, responsibility shifts to the 'Place Manager' — the person who actually controls the risk environment (a head teacher, housing officer, business owner, transport operator). Safety is engineered by working with whoever holds the context.";

export const INFORMATION_GOVERNANCE_PRINCIPLE =
  "Strict data boundaries protect children when contexts are shared. No child-level personal data (names, dates of birth) is shared with non-traditional partners — they receive the contextual picture, not the child's identity — and every partner signs an information-sharing agreement. Sharing a context must never become a back-door route to identifying, listing or profiling a child.";

/** The Signs of Safety operational questions a Context Conference turns on. */
export const CONTEXT_CONFERENCE_QUESTIONS = [
  "What is going well?",
  "What are we worried about?",
  "What needs to happen next?",
];

export const SIGNS_OF_SAFETY_PRINCIPLE =
  "Context meetings avoid punitive language. They turn on three operational questions — what is going well, what are we worried about, what needs to happen next — keeping the focus on changing the context rather than labelling a child.";

// ── 7. THE STATUTORY THRESHOLD GAP ────────────────────────────────────────────

export const STATUTORY_THRESHOLD_GAP =
  "The statutory threshold gap: in England & Wales, s31(2) of the Children Act 1989 ties significant harm to care given by the parents not being reasonable, or the child being beyond parental control. When a teenager faces severe community exploitation BUT has supportive, capable parents, the harm cannot be neatly attributed to a lack of parental care — so cases are wrongly closed, parents are unfairly labelled neglectful to meet a threshold, or children are sent to costly out-of-area placements just to remove them from a neighbourhood. Name the gap; do not resolve it by blaming a capable parent.";

// ── 8. THE ETHICAL GUARDRAIL — guardianship, NOT surveillance ─────────────────
// The "Beyond Surveillance" half. As contextual safeguarding scales it requires
// data-sharing — which can either build guardianship or feed punitive,
// data-driven policing. Because Cara is itself a data system, this half
// disciplines Cara's OWN behaviour.

export interface GuardianshipDimension {
  key: string;
  dimension: string;
  surveillance: string;
  guardianship: string;
}

export const GUARDIANSHIP_VS_SURVEILLANCE: GuardianshipDimension[] = [
  { key: "focus", dimension: "Focus", surveillance: "Monitoring — increasing the number of eyes watching behaviour", guardianship: "Relational — access to trusted, caring adults invested in wellbeing" },
  { key: "methodology", dimension: "Methodology", surveillance: "Exclusionary control — dispersal orders, hostile architecture, stop & search", guardianship: "Collaborative safety — working with young people to co-create safety in shared spaces" },
  { key: "environmental_goal", dimension: "Environmental goal", surveillance: "Make public spaces hostile to young people to prevent them gathering", guardianship: "Make public spaces highly inclusive of young people, but hostile to abuse" },
];

export const GUARDIANSHIP_NOT_SURVEILLANCE_PRINCIPLE =
  "Guardianship, not surveillance. Safety for young people comes from trusted, invested adults and inclusive spaces — not from monitoring, exclusion or control. The same intelligence can protect a child or be turned against them; the test is always whether it increases a child's access to safe relationships and safe spaces (guardianship) or merely increases the watching, listing and exclusion of that child (surveillance). Cara exists to inform guardianship.";

export const BEHAVIOURAL_VS_ECOLOGICAL_PRINCIPLE =
  "Behavioural vs ecological responses. A 'behavioural' response changes the child (don't go out, carry keys, dress differently, comply) and quietly places responsibility for the harm on them; an 'ecological' response changes the context (safer transport, lighting, safe-space businesses, working with the people who hold the space, educating those who cause harm). Contextual safeguarding leans to the ecological wherever possible — and notices when a plan has drifted into asking the child to absorb a risk that belongs to the environment.";

export const BIAS_RATCHET_PRINCIPLE =
  "The bias ratchet — the myth of neutrality. Data-driven risk tools are trained on historical records of where the system acted (where police patrolled, who was screened), not on where harm actually occurred. Acting on those predictions sends attention back to the same over-watched children and places, generating new records that 'confirm' the model — hardwiring discrimination a little more each cycle. In London 78% of those on the police Gangs Matrix were Black despite Black youth being responsible for 27% of serious youth violence, and 40% of those listed had a violence-risk score of zero. Technology is not neutral: a risk flag records who was looked at, not who is dangerous.";

export const INVERSION_OF_SAFEGUARDING_PRINCIPLE =
  "The inversion of safeguarding: place-based prediction can brand a physical space — or the children in it — as inherently criminal, instead of treating an unsafe environment as a context needing welfare. When that happens, vulnerable young people are recast as threats to be managed rather than children to be safeguarded. Never let a contextual risk picture become a reason to treat a child or a community as the danger.";

export const DATA_ETHICS_GUARDRAILS = [
  "Firewall welfare from enforcement: contextual safeguarding information exists to mobilise protection, not to feed predictive policing, watch-lists or a 'gangs matrix'. Never treat a Cara risk flag as proof a child is dangerous.",
  "Beware the Trojan horse: a peer-group or context map can protect children or can be repurposed to list and profile them. Share the context, not the child's identity, and only for protective purposes.",
  "Protect rights: adolescents hold UNCRC rights to privacy and freedom of association. Information-sharing that leaves a child heavily surveyed but no better protected is a rights breach, not safeguarding.",
  "Constrained choices are not crimes: a survival strategy inside an unsafe context (carrying a weapon for protection, group affiliation) is a safeguarding concern to understand and disrupt, never simply a child to criminalise.",
  "Watch for the bias ratchet: risk that clusters by ethnicity, postcode or poverty is a signal to question the data and the system, not a fact about the child.",
];

// ── 9. THE SOCIAL MODEL SYNTHESIS — root causes ───────────────────────────────

export const SOCIAL_MODEL_SYNTHESIS =
  "The social model synthesis: contextual safeguarding fixes the immediate spatial risk, but the deeper drivers sit underneath — poverty, systemic racism and housing instability act as 'push factors' driving young people toward unsafe contexts. Local fixes that ignore these treat symptoms, not causes. Pair context-level work with advocacy on the structural conditions (e.g. a public-space intervention paired with advocacy on the poor housing pushing youth into that space).";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS — prompt-ready guidance + deterministic reflective / sign-spotting sets
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Concise grounding block for LLM system prompts. Names the model and the
 * ethical guardrail so generation reasons WITH contextual safeguarding and never
 * drifts into surveillance/blame. Token-aware — the structured data above powers
 * the deterministic helpers, not this.
 */
export const CONTEXTUAL_SAFEGUARDING_GUIDANCE_BLOCK = [
  "GROUND YOUR THINKING IN CONTEXTUAL SAFEGUARDING (Carlene Firmin) — and its ethical guardrail:",
  `• Beyond the front door: ${CONTEXTUAL_SAFEGUARDING_PARADIGM}`,
  `• ${PARENTAL_FALLACY_PRINCIPLE}`,
  `• ${CONSTRAINED_CHOICES_PRINCIPLE}`,
  `• Locate the risk in the CONTEXT (peer group, school, neighbourhood, transport, online), record where harm happens, and consider the people who hold that context as partners — do not reduce extra-familial harm to a failure of the child or the parents.`,
  `• Guardianship, not surveillance: ${GUARDIANSHIP_NOT_SURVEILLANCE_PRINCIPLE}`,
  `• ${BIAS_RATCHET_PRINCIPLE} Treat any risk language as a prompt to protect, never as proof a child is dangerous; flag for human judgement.`,
].join("\n");

/** Short ethics-only guardrail for seams that already carry a practice block. */
export const GUARDIANSHIP_NOT_SURVEILLANCE_BLOCK = [
  "CONTEXTUAL-SAFEGUARDING ETHICS — guardianship, not surveillance:",
  `• ${GUARDIANSHIP_NOT_SURVEILLANCE_PRINCIPLE}`,
  `• ${INVERSION_OF_SAFEGUARDING_PRINCIPLE}`,
  `• Survival strategies in an unsafe context are constrained choices to understand and disrupt — never grounds to criminalise a child.`,
].join("\n");

/** The five extra-familial-harm contexts, by name. */
export function extraFamilialHarmContexts(): string[] {
  return EXTRA_FAMILIAL_HARM_CONTEXTS.map((c) => c.name);
}

/** One contextual reflective prompt per EFH context (deterministic, no key). */
export function contextualSafeguardingReflections(): string[] {
  return EXTRA_FAMILIAL_HARM_CONTEXTS.map((c) => c.reflection);
}

/** EFH reflections in AriaQuestion-compatible shape ({domain, question}). */
export function contextualSafeguardingQuestions(domain = "contextual_safeguarding"): { domain: string; question: string }[] {
  return EXTRA_FAMILIAL_HARM_CONTEXTS.map((c) => ({ domain, question: `${c.name}: ${c.reflection}` }));
}

/** Core ethical pillar names. */
export function coreEthicalPillarNames(): string[] {
  return CORE_ETHICAL_PILLARS.map((p) => p.name);
}

/** The guardianship-not-surveillance / data-ethics checks (sign-spotting for Cara itself). */
export function guardianshipNotSurveillanceChecks(): string[] {
  return [...DATA_ETHICS_GUARDRAILS];
}

/**
 * Deterministic EFH sign-spotting: scans a free-text record for cues that an
 * extra-familial context is in play, returning the matched context(s) and the
 * cue that fired. Quotes the cue; never invents. Case-insensitive, deduped by
 * context (first cue wins) so a record naming several markers surfaces each
 * relevant context once.
 */
export function efhSignSpotting(text: string): { context: string; key: string; cue: string; reflection: string }[] {
  const hay = (text || "").toLowerCase();
  if (!hay.trim()) return [];
  const out: { context: string; key: string; cue: string; reflection: string }[] = [];
  for (const ctx of EXTRA_FAMILIAL_HARM_CONTEXTS) {
    const hit = ctx.cues.find((cue) => hay.includes(cue));
    if (hit) out.push({ context: ctx.name, key: ctx.key, cue: hit, reflection: ctx.reflection });
  }
  return out;
}

/**
 * Whether a record shows any extra-familial-harm markers — a cheap gate engines
 * can use to decide whether to surface the contextual lens.
 */
export function hasExtraFamilialMarkers(text: string): boolean {
  return efhSignSpotting(text).length > 0;
}
