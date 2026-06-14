// ═══════════════════════════════════════════════════════════════════════════
// CARA — SAFETY PLANNING  (shared knowledge · pure · deterministic)
//
// Encodes safety planning for extra-familial harm (the SaferNow framework, used
// alongside Contextual Safeguarding) so Cara's engines can SUPPORT staff to
// co-create robust, personalised safety plans — deterministically and as advice
// and guidance. This is KNOWLEDGE, not UI; there is no new form. It pairs with
// the child's-own safety plan in practice-frameworks.ts (SAFETY_PLAN_SECTIONS) —
// that is the gentle, in-home regulation plan; THIS adds the extra-familial,
// out-of-home dimension (typologies of safety, trauma lens, refusals/excuses,
// situational awareness, tech-as-a-tool, direct-work activities).
//
// Hard contract: a safety plan is co-created WITH the young person, never done
// TO them. Cara suggests components and prompts; staff and the young person
// decide what goes in. Cara never writes a plan for a child, never replaces the
// relationship, and never turns a safety plan into surveillance of the child.
//
// No imports — self-contained so any engine can use it without import cycles.
// ═══════════════════════════════════════════════════════════════════════════

export type SafetyTypologyKey = "physical" | "emotional" | "financial" | "community";

export const SAFETY_PLANNING_DEFINITION =
  "A safety plan is a proactive, person-centred way of identifying and preparing for risks or crises — anticipating what might go wrong, what triggers or patterns might emerge, and what can reduce harm or help navigate those moments more safely. It is a relational and reflective process, not a form: it must be co-created WITH the young person, not done TO them, to build trust, reduce shame and enhance their agency — especially for those who feel they have little control elsewhere.";

export const WORTHY_OF_SAFETY_PRINCIPLE =
  "A safety plan is only as effective as the young person's belief that they are worthy of safety and that safety is genuinely possible for them. Relational work to build that belief comes first — a plan handed to a child who does not believe they deserve safety will not hold.";

export const CO_DESIGN_PRINCIPLE =
  "Co-design over compliance. The plan is the young person's; the worker's job is to be curious, offer options and hold the structure — not to impose strategies. Plans that are done TO a child create compliance, not safety. Account for professional curiosity and bias, relationship dynamics, the time you have to build trust, learning and communication styles, neurodiversity, cognitive capacity and psychological safety.";

// ── The eight qualities of a good safety plan ─────────────────────────────────
export const SAFETY_PLAN_PRINCIPLES: string[] = [
  "Non-judgemental",
  "Co-designed (with, not done to)",
  "Shared with relevant people",
  "Trauma-informed",
  "Aimed at harm reduction",
  "Empowering",
  "Built on internal and external strengths",
  "Reviewed regularly",
];

// ── Four typologies of safety ─────────────────────────────────────────────────
export interface SafetyTypology {
  key: SafetyTypologyKey;
  name: string;
  definition: string;
  /** A co-design prompt to explore this typology with the young person. */
  prompt: string;
}

export const TYPOLOGIES_OF_SAFETY: SafetyTypology[] = [
  { key: "physical", name: "Physical safety", definition: "Being free from physical harm such as violence, and having basic needs met.", prompt: "Where and when do you feel physically safe — and where don't you? What would help your body feel safer there?" },
  { key: "emotional", name: "Emotional safety", definition: "Being free from psychological harm such as abuse, fear and humiliation.", prompt: "What helps you feel calm and okay, and what leaves you feeling on edge or got at?" },
  { key: "financial", name: "Financial safety", definition: "Regular access to financial resources and being able to maintain that — money pressure is a route into exploitation.", prompt: "Is money ever a worry that puts you in difficult situations? What would ease that pressure?" },
  { key: "community", name: "Community safety", definition: "Being free from harmful practices such as oppression and discrimination, with safe and regulated spaces.", prompt: "Which places and groups feel safe and welcoming, and which feel hostile or unsafe?" },
];

// ── The trauma lens — stress responses (the 5 Fs) ─────────────────────────────
// Safety planning must account for how a young person's body responds under
// threat: the same response that protected them can derail a plan made for a
// calm, rational decision-maker.
export interface StressResponse {
  key: string;
  name: string;
  note: string;
}

export const TRAUMA_STRESS_RESPONSES: StressResponse[] = [
  { key: "fight", name: "Fight", note: "Confrontation, anger, aggression — the body mobilising to defend." },
  { key: "flight", name: "Flight", note: "Escape, avoidance, going missing, leaving the situation." },
  { key: "freeze", name: "Freeze", note: "Unable to move, speak or act; appearing 'stuck' or compliant." },
  { key: "flop", name: "Flop", note: "Collapse, dissociation, shutting down; appearing 'fine' or vacant." },
  { key: "fawn", name: "Fawn / friend", note: "Appeasing, people-pleasing, going along with the harmer to stay safe." },
];

export const TRAUMA_LENS_PRINCIPLE =
  "A young person under threat responds with their body, not a calm cost-benefit calculation — fight, flight, freeze, flop or fawn. A plan must work for the nervous system in the moment, not only for a regulated child in a quiet room. Behaviour that looks like 'choice', defiance or non-engagement is read through prior victimisation and survival, never as the child putting themselves at risk.";

// ── Safety-plan components (what might go on a plan) ───────────────────────────
// Suggestions to co-create from — never a checklist read at a child. Tagged so
// engines can surface the components most relevant to the context of harm.
export interface SafetyPlanComponent {
  key: string;
  area: "communication" | "navigation" | "readiness" | "online" | "regulation" | "network";
  text: string;
}

export const SAFETY_PLAN_COMPONENTS: SafetyPlanComponent[] = [
  { key: "contacts", area: "network", text: "Important contact numbers (family, staff, key workers, helplines) — kept somewhere they can always reach." },
  { key: "code_word", area: "communication", text: "A 'code word' to quietly signal to a trusted adult that something is wrong." },
  { key: "refusals_excuses", area: "communication", text: "Pre-planned refusals and excuses to navigate peer pressure (e.g. \"my mum's tracking me\", \"I've got training early\")." },
  { key: "trusted_adults", area: "network", text: "Trusted adults and where they'll be — especially after school and at weekends." },
  { key: "safe_places", area: "navigation", text: "Safe places to go if something feels wrong — shops, youth centres, friends' homes, 24/7 staffed buildings." },
  { key: "routes", area: "navigation", text: "Varying routes rather than always the same one; knowing alternatives." },
  { key: "exit_plan", area: "navigation", text: "A quick, rehearsed plan for getting out of a place or home safely if needed." },
  { key: "first_aid", area: "readiness", text: "Basic first-aid knowledge and the location of local bleed kits and how to use one." },
  { key: "grounding", area: "regulation", text: "Grounding techniques and soothing strategies for when distress spikes." },
  { key: "spotting_signs", area: "regulation", text: "How to spot when something isn't right — for themselves or for someone else." },
  { key: "phone_lost", area: "readiness", text: "What to do if their phone dies or is taken — memorised numbers, nearest phone, small change." },
  { key: "alert_apps", area: "online", text: "Apps or tools that support quick alerts or location-sharing, where appropriate and agreed (never imposed)." },
  { key: "block_report", area: "online", text: "How to block or report on apps and social media." },
  { key: "online_sharing", area: "online", text: "What to share and not share online — especially with people they don't know; what's private, public and permanent." },
  { key: "help_others", area: "readiness", text: "What to do if they see someone else in trouble." },
];

// ── Strategic refusals / excuses — scripts to navigate pressure ───────────────
export const STRATEGIC_REFUSALS: string[] = [
  "\"My mum / the staff are tracking my phone.\"",
  "\"I've got training / an early start tomorrow.\"",
  "\"I'm skint, I've got no money on me.\"",
  "\"My carer's outside waiting for me.\"",
  "\"I'm not feeling well, I need to head back.\"",
];

// ── Situational-awareness tips (older young people, with consent) ──────────────
// Harm-reduction prompts to explore WITH a young person — relational, never a
// lecture, and never a substitute for changing the context.
export const SITUATIONAL_AWARENESS_TIPS: string[] = [
  "Set up supportive networks and agree who knows where you are.",
  "Plan in advance how you might respond in different situations, including a crisis.",
  "Keep a small amount of money for a phone call or a bus / taxi fare.",
  "Know where the nearest phone and 24/7 staffed buildings are.",
  "Be prepared to leave; know your exits and an emergency place to go.",
  "Vary your routes; if you think you're being followed, change direction and stay in public view.",
  "Consider whether your communications or location could be monitored (e.g. location-sharing on Snapchat).",
  "Think about what your social media reveals — avoid posting where your location is clear.",
  "Scan a space for who is there and notice body language; be aware of anything that could be used as a weapon against you.",
  "Tell as few people as possible your whereabouts or plans.",
];

// ── Tech as a safety tool ─────────────────────────────────────────────────────
export const SAFETY_TECH_TOOLS: { name: string; use: string }[] = [
  { name: "what3words", use: "Share a precise 3-metre location quickly in an emergency." },
  { name: "WalkSafe", use: "Route safety, alerts and check-ins on a journey." },
  { name: "Life360 / location-sharing", use: "Agreed location-sharing with trusted people (with consent)." },
  { name: "Circle of 6", use: "Two-tap alerts to a chosen circle of trusted contacts." },
  { name: "iPhone Emergency SOS", use: "Press the lock button five times to call emergency services." },
  { name: "Google Maps — Share ETA", use: "Share live journey and arrival with a trusted person." },
  { name: "iPhone Safety Check / Samsung Emergency SOS", use: "Built-in safety and tracking / SOS features." },
];

// ── Direct-work activities (with the young person) ────────────────────────────
export interface DirectWorkActivity {
  key: string;
  name: string;
  purpose: string;
  how: string;
}

export const DIRECT_WORK_ACTIVITIES: DirectWorkActivity[] = [
  {
    key: "body_scanning",
    name: "Body scanning",
    purpose: "Help the young person recognise how their body responds to stress, emotion or difficulty — spotting warning signs before a crisis.",
    how: "Recall a recent experience; notice where it was felt in the body (tight chest, shaky hands, racing heart); mark or draw the sensations on a body outline using colours, symbols or words.",
  },
  {
    key: "tfbsb",
    name: "Thoughts–Feelings–Bodily sensations–Behaviours (TFBSB)",
    purpose: "Help the young person see how their inner world connects to what they do, and build self-awareness over time.",
    how: "For a moment, name the Thoughts, the Feelings, the Bodily sensations and the Behaviours — then look for patterns and what might interrupt a tricky cycle (deep breaths, grounding, safe distraction).",
  },
  {
    key: "eco_mapping",
    name: "Eco-mapping",
    purpose: "Map the people, groups and supports around the young person — strengths and pressures alike.",
    how: "Draw the young person at the centre and map their relationships and networks, marking which feel safe and supportive and which feel risky.",
  },
  {
    key: "place_space_mapping",
    name: "Place / space mapping",
    purpose: "Map the physical contexts of safety and risk so intervention can target the context, not only the child.",
    how: "Map the places the young person spends time, marking safe places, risky places, routes and safe havens.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS — prompt-ready guidance + deterministic suggestion sets
// ═══════════════════════════════════════════════════════════════════════════

/** Concise grounding block for LLM system prompts that produce or advise on safety plans. */
export const SAFETY_PLANNING_GUIDANCE_BLOCK = [
  "GROUND SAFETY-PLANNING WORK IN THESE PRINCIPLES (SaferNow / contextual safety planning):",
  `• ${SAFETY_PLANNING_DEFINITION}`,
  `• ${CO_DESIGN_PRINCIPLE}`,
  `• ${TRAUMA_LENS_PRINCIPLE}`,
  `• ${WORTHY_OF_SAFETY_PRINCIPLE}`,
  `• Plan across the four typologies of safety — physical, emotional, financial and community — and review regularly. Suggest components (code words, refusals/excuses, safe places, trusted adults, grounding, online safety); never read a checklist at a child, and never let a safety plan become a way of surveilling the child.`,
].join("\n");

/** The four typologies, by name. */
export function safetyTypologyNames(): string[] {
  return TYPOLOGIES_OF_SAFETY.map((t) => t.name);
}

/** Co-design prompts, one per typology of safety (deterministic, no key). */
export function safetyTypologyPrompts(): string[] {
  return TYPOLOGIES_OF_SAFETY.map((t) => t.prompt);
}

/** Plain-text safety-plan component suggestions (co-create from these). */
export function safetyPlanComponentPrompts(): string[] {
  return SAFETY_PLAN_COMPONENTS.map((c) => c.text);
}

/** Maps each EFH context key (from contextual-safeguarding) to the most relevant safety-plan component areas. */
const CONTEXT_TO_COMPONENT_AREAS: Record<string, SafetyPlanComponent["area"][]> = {
  peer_networks: ["communication", "network", "navigation"],
  school_environments: ["navigation", "communication", "network"],
  neighbourhood: ["navigation", "readiness", "network"],
  public_transport: ["navigation", "readiness", "communication"],
  online_spaces: ["online", "communication", "network"],
  exploitation: ["communication", "navigation", "readiness", "network"],
};

/**
 * Deterministic safety-plan suggestion: given the extra-familial context keys
 * present in a record (as produced by efhSignSpotting), returns the safety-plan
 * components most relevant to co-create. Advice only — staff and the young
 * person decide what goes in. Returns [] when no contexts are supplied.
 */
export function suggestSafetyPlanComponents(contextKeys: string[]): SafetyPlanComponent[] {
  if (!contextKeys || contextKeys.length === 0) return [];
  const areas = new Set<SafetyPlanComponent["area"]>();
  for (const k of contextKeys) (CONTEXT_TO_COMPONENT_AREAS[k] ?? []).forEach((a) => areas.add(a));
  // Regulation is always relevant where there is any extra-familial risk.
  areas.add("regulation");
  return SAFETY_PLAN_COMPONENTS.filter((c) => areas.has(c.area));
}
