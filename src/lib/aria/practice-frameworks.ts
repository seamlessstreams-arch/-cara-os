// ═══════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE FRAMEWORKS  (shared knowledge · pure · deterministic)
//
// Encodes the professional social-work practice frameworks Cara reasons with,
// so every engine — Cara Studio generators, practice-intelligence analysis and
// drafting, incident analysis — is grounded in the SAME models. This is
// knowledge, not UI. It produces:
//   (a) concise system-prompt guidance for the LLM seams, and
//   (b) deterministic reflective-question / checklist sets that work with no key.
//
// Frameworks encoded (faithful to the source practice tools):
//   1. R Domain — Relational & Psychological Drivers (the "R" of the LIVERS model)
//   2. Child-Centred Ladder of Inference + the Reverse Ladder Test
//   3. Child-Centred Supervision Analysis (4 tests + warning signs)
//   4. Protective Factors for Children (7 factors)
//   5. Preparation for adulthood — 25 independence skills
//   6. Safety-planning structure (the child's own plan)
//   7. Staff 60-second wellbeing resets
//
// No imports — self-contained so any engine can use it without import cycles.
// ═══════════════════════════════════════════════════════════════════════════

export type FrameworkKey =
  | "behaviour_drivers"
  | "ladder_of_inference"
  | "supervision_analysis"
  | "protective_factors"
  | "independence_skills"
  | "safety_planning"
  | "staff_wellbeing";

// ── 1. R DOMAIN — Relational & Psychological Drivers (LIVERS "R") ──────────────
// "Behaviour is the visible language of invisible experiences." Behaviour is a
// communication about needs, fears, relationships, emotions, beliefs, survival
// strategies and lived experience. The analytical task is the DRIVER, not the
// behaviour: descriptions explain what happens; drivers explain why it continues.

export interface BehaviourDriver {
  key: string;
  name: string;
  /** "What is the behaviour telling us about …" */
  asks: string;
  indicators: string[];
  insight: string;
  reflectiveQuestions: string[];
}

export const BEHAVIOUR_DRIVERS: BehaviourDriver[] = [
  {
    key: "attachment_relationship_needs",
    name: "Attachment & relationship needs",
    asks: "What is the behaviour telling us about relationships?",
    indicators: ["Fear of abandonment", "Insecurity", "Dependency", "Approval-seeking", "Need for connection"],
    insight: "People often tolerate harm to avoid losing attachment.",
    reflectiveQuestions: [
      "What relationship fear may be present?",
      "What relationship need remains unmet?",
      "Who can this person not afford to lose?",
    ],
  },
  {
    key: "trauma_survival_adaptations",
    name: "Trauma & survival adaptations",
    asks: "What is the behaviour telling us about survival?",
    indicators: ["Fight", "Flight", "Freeze", "Appease", "Hypervigilance"],
    insight: "Many behaviours began as intelligent survival strategies.",
    reflectiveQuestions: [
      "What survival strategy is operating?",
      "What danger does this person anticipate?",
      "What is their nervous system responding to?",
    ],
  },
  {
    key: "emotional_regulation_coping",
    name: "Emotional regulation & coping",
    asks: "What is the behaviour telling us about feelings?",
    indicators: ["Anxiety", "Shame", "Grief", "Loneliness", "Anger"],
    insight: "Behaviour often regulates emotions that words cannot express.",
    reflectiveQuestions: [
      "What feeling is the behaviour regulating?",
      "What emotional pain sits beneath the presentation?",
      "What happens if the behaviour stops?",
    ],
  },
  {
    key: "identity_beliefs_self_concept",
    name: "Identity, beliefs & self-concept",
    asks: "What is the behaviour telling us about how the person sees themselves and the world?",
    indicators: ["Self-worth", "Trust", "Belonging", "Values", "Expectations"],
    insight: "People frequently behave in ways that confirm deeply held beliefs about themselves.",
    reflectiveQuestions: [
      "What beliefs drive the behaviour?",
      "What story does this person hold about themselves?",
      "What identity is being protected?",
    ],
  },
  {
    key: "function_adaptive_benefits",
    name: "Function & adaptive benefits",
    asks: "What is the behaviour helping the person achieve, avoid, manage or survive?",
    indicators: ["Safety", "Control", "Belonging", "Predictability", "Emotional relief"],
    insight: "If a behaviour continues, it is usually meeting a need.",
    reflectiveQuestions: [
      "What need might this behaviour be meeting right now?",
      "What is it helping the person avoid or control?",
      "What would have to be in place before it was no longer needed?",
    ],
  },
];

export const BEHAVIOUR_AS_COMMUNICATION_PRINCIPLE =
  "Behaviour is the clue, not the answer. Behaviour persists because it serves a purpose — to meet a need, manage a fear, reduce pain or survive. Ask what the behaviour is communicating, not only why it started. Understanding the function of behaviour is never the same as accepting harm: children still require safety and adults remain responsible for their actions.";

// ── 2. CHILD-CENTRED LADDER OF INFERENCE + REVERSE LADDER TEST ────────────────
// We climb from observation to action in milliseconds. Each rung can distort;
// each rung has a child-centred interruption. The Reverse Ladder Test works
// BACKWARDS from the action to test every inference before finalising.

export interface LadderRung {
  step: number;
  name: string;
  question: string;
  /** Inference distortions — what can go wrong at this rung. */
  distortions: string[];
  /** Restorative, child-centred interruption / reflective question. */
  interruption: string;
}

export const LADDER_OF_INFERENCE: LadderRung[] = [
  {
    step: 1,
    name: "Observable information",
    question: "What is directly present before interpretation begins?",
    distortions: [
      "Hypervigilance — scanning for danger and missing nuance",
      "Selective attention — noticing what fits our fears",
      "Confirmation bias — seeing what we expect",
      "Cultural unfamiliarity — misreading difference as risk",
    ],
    interruption: "Describe, don't evaluate. What have I directly observed, and what have I already started interpreting?",
  },
  {
    step: 2,
    name: "Selected information",
    question: "Why have I decided this information matters most?",
    distortions: [
      "Over-valuing incidents and ignoring patterns",
      "Focusing on adult behaviour more than the child's experience",
      "Recent events overshadowing chronic harm",
      "Absence of evidence mistaken for evidence of absence",
    ],
    interruption: "What information have I prioritised, and what may I be leaving outside the frame? Whose voice is present; whose is missing?",
  },
  {
    step: 3,
    name: "Meaning-making",
    question: "What meaning am I attaching to what I observed?",
    distortions: [
      "Trauma behaviours mistaken for defiance or manipulation",
      "Shutdown mistaken for calmness or lack of concern",
      "Neurodivergence mistaken for rudeness, avoidance or hostility",
      "Difference interpreted as dysfunction",
    ],
    interruption: "What alternative meanings could also explain this behaviour?",
  },
  {
    step: 4,
    name: "Assumptions",
    question: "What am I presuming to be true without fully testing?",
    distortions: [
      "“If they cared, they would…”",
      "“This family is just like others I've worked with”",
      "“If they're not engaging, they're hiding something”",
      "Stereotypes about race, culture, class, gender or neurodivergence",
    ],
    interruption: "What am I assuming about this child, parent or family that I have not yet tested?",
  },
  {
    step: 5,
    name: "Conclusions",
    question: "What decision or judgement am I reaching?",
    distortions: [
      "Jumping to conclusions",
      "Equating behaviour with harm without evidence of impact",
      "Anxiety-driven decision-making",
      "Threshold drift — too low or too high",
      "Outcome bias — letting fears or hopes decide",
    ],
    interruption: "Does my conclusion arise from evidence and analysis, or from anxiety, habit, threshold culture or organisational expectation?",
  },
  {
    step: 6,
    name: "Beliefs",
    question: "What underlying belief am I reinforcing or drawing upon?",
    distortions: [
      "Hardened beliefs after repeated exposure to harm",
      "“Parents like this never change”",
      "Pessimism or cynicism masquerading as experience",
    ],
    interruption: "What belief about this family or group might be shaping my interpretation before I encounter the evidence? Every child deserves a fresh consideration.",
  },
  {
    step: 7,
    name: "Action",
    question: "What am I doing, recommending or deciding as a result?",
    distortions: [
      "Action driven by fear rather than evidence",
      "Over-intervention",
      "Under-protecting",
      "Defensive practice",
    ],
    interruption: "Is this proportionate and necessary? Does it promote safety, repair and wellbeing? Will it improve the child's lived experience?",
  },
];

export const LADDER_PRINCIPLE =
  "We climb the ladder of inference in milliseconds — from what we observe, to what we select, the meaning we make, the assumptions and conclusions we reach, and the beliefs we act upon. Inference is unavoidable; unexamined inference is unsafe. Let the child's lived experience be the centre of every rung.";

export const REVERSE_LADDER_PRINCIPLE =
  "Before finalising a decision or action, work backwards down the ladder — from the action to the observable information — and test each rung. Could I explain every inference that led to this action in supervision, court, audit, and to the child and family?";

// ── 3. CHILD-CENTRED SUPERVISION ANALYSIS ─────────────────────────────────────
// Four tests of whether professional thinking keeps the child's lived
// experience at the centre, each with a warning sign.

export interface SupervisionTest {
  key: string;
  name: string;
  tests: string;
  reflectiveQuestions: string[];
  warningSign: string;
}

export const SUPERVISION_TESTS: SupervisionTest[] = [
  {
    key: "adult_centred_drift",
    name: "Adult-centred drift",
    tests: "Whether professional thinking has gradually shifted towards adults rather than the child.",
    reflectiveQuestions: [
      "Has adult engagement become more visible than child impact?",
      "Are adult explanations dominating analysis?",
      "Are we discussing what adults are doing more than what the child is experiencing?",
      "Would the child recognise themselves within this discussion?",
    ],
    warningSign: "Most of the discussion is about adults.",
  },
  {
    key: "professional_bias",
    name: "Professional bias",
    tests: "Whether assumptions, optimism, anxiety or presentation are shaping analysis.",
    reflectiveQuestions: [
      "Are professionals being reassured too quickly?",
      "Are we clear about what constitutes good-enough parenting?",
      "Is articulate adult presentation reducing professional curiosity?",
      "What assumptions have become invisible because they are widely shared?",
    ],
    warningSign: "We feel reassured but cannot clearly explain why.",
  },
  {
    key: "multi_agency_alignment",
    name: "Multi-agency alignment",
    tests: "Whether agencies are analysing the same child or different versions of the child.",
    reflectiveQuestions: [
      "Are agencies analysing the child's day-to-day experience consistently?",
      "Is everyone focused on developmental impact?",
      "Are professionals describing behaviours or describing impact?",
      "What is the shared understanding of harm?",
    ],
    warningSign: "Everybody is worried, but for different reasons.",
  },
  {
    key: "reflective_practice",
    name: "Reflective practice",
    tests: "Whether professional thinking remains genuinely child-centred.",
    reflectiveQuestions: [
      "Has the child's lived experience genuinely shaped professional thinking?",
      "Has the child become secondary within the process?",
      "What remains unknown about the child's reality?",
      "What have we not yet asked ourselves?",
    ],
    warningSign: "The process is clear, but the child's daily experience is not.",
  },
];

export const SUPERVISION_REFLECTION_QUESTIONS = [
  "Who currently holds the greatest influence within professional thinking: the child or the adults?",
  "What pressures, narratives or voices are shaping analysis?",
  "Has the child's developmental reality remained central throughout intervention?",
  "If the child read this assessment in adulthood, would they recognise themselves within it?",
  "If all professional labels were removed, what would we say life is currently like for this child?",
];

export const CHILD_LIVED_EXPERIENCE_PRINCIPLE =
  "Every discussion should be capable of explaining what life is currently like for this child and how intervention is changing that experience. Child-centred practice is achieved not when we can describe the adults well, but when we can clearly explain the child's lived experience, the impact of harm, the evidence of change, and what needs to happen next.";

// ── 4. PROTECTIVE FACTORS FOR CHILDREN ────────────────────────────────────────

export interface ProtectiveFactor {
  key: string;
  name: string;
  indicators: string[];
}

export const PROTECTIVE_FACTORS: ProtectiveFactor[] = [
  { key: "nurturing_relationships", name: "Nurturing relationships", indicators: ["Consistent, caring adults", "Secure attachments", "Positive teacher–child relationships", "Supportive family connections"] },
  { key: "social_emotional_competence", name: "Social & emotional competence", indicators: ["Recognising emotions", "Self-regulation skills", "Problem-solving abilities", "Healthy peer interactions"] },
  { key: "safe_stable_predictable", name: "Safe, stable & predictable environments", indicators: ["Consistent routines", "Physical and emotional safety", "Clear expectations", "Reliable caregiving"] },
  { key: "learning_and_success", name: "Opportunities for learning & success", indicators: ["Developmentally appropriate challenges", "Play-based learning", "Positive feedback", "Celebrating effort and growth"] },
  { key: "family_support_systems", name: "Strong family support systems", indicators: ["Access to community resources", "Positive parenting support", "Family engagement", "Social connections"] },
  { key: "sense_of_belonging", name: "Sense of belonging", indicators: ["Feeling valued and included", "Cultural identity affirmation", "Acceptance by peers and adults", "Opportunities to contribute"] },
  { key: "resilience_building", name: "Resilience-building experiences", indicators: ["Overcoming manageable challenges", "Developing coping strategies", "Building confidence through success", "Adults who encourage perseverance"] },
];

export const PROTECTIVE_FACTOR_PRINCIPLE =
  "Protective factors are the positive influences and experiences that help children thrive even in the face of challenges. One stable, caring adult relationship can significantly alter a child's developmental trajectory. Protective factors don't eliminate adversity — they build the skills and supports needed to overcome it.";

// ── 5. PREPARATION FOR ADULTHOOD — 25 INDEPENDENCE SKILLS ─────────────────────
// Domains map (as plain strings) to CARA_CURRICULUM_DOMAINS where they align,
// so the curriculum generator can pull relevant skills without an import cycle.

export interface IndependenceSkill {
  n: number;
  skill: string;
  summary: string;
  domains: string[];
}

export const INDEPENDENCE_SKILLS: IndependenceSkill[] = [
  { n: 1, skill: "Self-care & wellness", summary: "Care for body, mind and emotions; sleep, eat well, move, ask for help.", domains: ["Health and wellbeing", "Personal routines"] },
  { n: 2, skill: "Communication skills", summary: "Express yourself clearly, listen well, handle conflict respectfully.", domains: ["Relational literacy", "Conflict and repair"] },
  { n: 3, skill: "Emotional regulation", summary: "Understand feelings, manage stress, bounce back from tough days.", domains: ["Emotional literacy", "Health and wellbeing"] },
  { n: 4, skill: "Goal setting & planning", summary: "Set goals, make a plan, take action, stay focused on what matters.", domains: ["Consequences and decision-making", "Education and aspiration"] },
  { n: 5, skill: "Time management & organisation", summary: "Use time wisely, stay organised and meet deadlines.", domains: ["Personal routines", "Independence skills"] },
  { n: 6, skill: "Financial literacy", summary: "Budget, save, spend wisely; understand credit and banking basics.", domains: ["Independence skills"] },
  { n: 7, skill: "Job readiness & work ethic", summary: "Be reliable, show up on time, hold a positive attitude.", domains: ["Independence skills", "Education and aspiration"] },
  { n: 8, skill: "Resume & interview skills", summary: "Build a CV, practise interviews, know how to show strengths.", domains: ["Education and aspiration", "Self-advocacy"] },
  { n: 9, skill: "Education & study skills", summary: "Be a lifelong learner; take notes, ask questions, seek help.", domains: ["Education and aspiration"] },
  { n: 10, skill: "Digital literacy & online safety", summary: "Use technology wisely, protect privacy, avoid online scams.", domains: ["Digital safety", "Understanding risk"] },
  { n: 11, skill: "Life administration", summary: "Keep ID, health, school and legal documents organised.", domains: ["Independence skills", "Rights and responsibilities"] },
  { n: 12, skill: "Health literacy", summary: "Understand health needs, insurance, medication and when to get help.", domains: ["Health and wellbeing"] },
  { n: 13, skill: "Cooking basics", summary: "Prepare simple, healthy meals and understand kitchen safety.", domains: ["Independence skills", "Personal routines"] },
  { n: 14, skill: "Cleaning & home maintenance", summary: "Keep a space clean, do laundry, ask what is safe.", domains: ["Independence skills", "Personal routines"] },
  { n: 15, skill: "Transportation knowledge", summary: "Get around safely — licence, insurance, fares and basics.", domains: ["Independence skills", "Community safety"] },
  { n: 16, skill: "Safe decision-making", summary: "Think ahead, weigh consequences, choose what keeps you safe.", domains: ["Consequences and decision-making", "Understanding risk"] },
  { n: 17, skill: "Relationships & boundaries", summary: "Build healthy relationships, set boundaries, know your worth.", domains: ["Relational literacy", "Trust and safe adults"] },
  { n: 18, skill: "Legal knowledge & rights", summary: "Know your rights and responsibilities and the laws that affect you.", domains: ["Rights and responsibilities"] },
  { n: 19, skill: "Self-advocacy", summary: "Speak up for your needs, ask questions, use your voice.", domains: ["Self-advocacy"] },
  { n: 20, skill: "Problem solving & critical thinking", summary: "Look at challenges from different angles and find solutions.", domains: ["Consequences and decision-making", "Situational literacy"] },
  { n: 21, skill: "Budgeting for independence", summary: "Plan for housing, food, transport and monthly expenses.", domains: ["Independence skills"] },
  { n: 22, skill: "Housing readiness", summary: "Understand leases, renting, utilities, house rules and tenancy.", domains: ["Independence skills", "Rights and responsibilities"] },
  { n: 23, skill: "Networking & building support", summary: "Build a trusted support system of mentors, peers and positive adults.", domains: ["Trust and safe adults", "Relational literacy"] },
  { n: 24, skill: "Stress management & self-determination", summary: "Use healthy coping and believe in your ability to shape your future.", domains: ["Emotional literacy", "Health and wellbeing"] },
  { n: 25, skill: "Dream big & give back", summary: "Have hope, chase your dreams, and help others along the way.", domains: ["Identity and belonging", "Education and aspiration"] },
];

export const INDEPENDENCE_PRINCIPLE =
  "Skills build confidence; confidence changes everything. Independence is learned in small steps over time — you don't have to learn it all at once, and it's always okay to ask for help.";

// ── 6. SAFETY-PLANNING STRUCTURE (the child's own plan) ───────────────────────

export interface SafetyPlanSection {
  key: string;
  title: string;
  prompt: string;
}

export const SAFETY_PLAN_SECTIONS: SafetyPlanSection[] = [
  { key: "calming", title: "What helps me calm down", prompt: "The things that help the child feel better and regulate (e.g. music, movement, drawing, breathing, time alone, talking)." },
  { key: "warning_signs", title: "My warning signs", prompt: "How the child — and staff — can tell they are starting to feel upset, and how the child can let staff know." },
  { key: "safe_adults", title: "My safe adults", prompt: "The people the child trusts, and their role." },
  { key: "staff_should_do", title: "What staff should do", prompt: "What helps when the child is upset or overwhelmed — speak calmly, give space if needed, stay with me, help me use my strategies, give clear choices, keep me safe." },
  { key: "makes_worse", title: "What makes things worse", prompt: "Things that escalate distress, to be avoided." },
  { key: "safe_spaces", title: "Safe spaces", prompt: "The places where the child feels safest." },
  { key: "emergency_supports", title: "Emergency supports", prompt: "Who the child can call, text, tell or go to for urgent help." },
  { key: "emergency_plan", title: "My plan in an emergency", prompt: "The concrete steps the child will take if they feel unsafe or scared." },
  { key: "how_treated", title: "How I want to be treated", prompt: "Be kind, listen, explain things, respect me, keep promises." },
  { key: "goals_strengths", title: "My goals & strengths", prompt: "What the child is working on and what they are proud of." },
];

export const SAFETY_PLAN_PRINCIPLE =
  "A safety plan is the child's own — built with them, in their words, and reviewable any time. Its purpose is keeping the child safe, helping them feel calm, and getting the right support when they need it. The child's voice matters most: you know me, you listen, you believe me, you keep me safe, you help me.";

// ── 7. STAFF 60-SECOND WELLBEING RESETS ───────────────────────────────────────

export const STAFF_WELLBEING_RESETS: { name: string; how: string }[] = [
  { name: "Deep breathing", how: "Slow breaths to reduce physiological and psychological arousal." },
  { name: "Eye break", how: "Close your eyes for 60 seconds and picture a calm, relaxing place." },
  { name: "Release tension", how: "Notice tension in the body and use progressive muscle relaxation." },
  { name: "Mindful check-in", how: "Name 5 things you can see, 4 you can hear, 3 you can touch, 2 you can smell, 1 you can taste." },
  { name: "Daily wins", how: "Write down three good things you have achieved today." },
  { name: "Get moving", how: "Stand up, stretch, walk around or be active." },
  { name: "Talk it out", how: "Talk with someone about how you are feeling and thinking." },
  { name: "Reach out", how: "Offer a colleague some help or support." },
];

export const STAFF_WELLBEING_PRINCIPLE =
  "Small moments of self-care make a big difference. A regulated adult helps a child regulate — staff wellbeing is part of the child's safety, not separate from it.";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS — prompt-ready guidance + deterministic reflective sets
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Concise grounding block for LLM system prompts. Names the lenses and their
 * operating principle so generation reasons WITH the frameworks. Token-aware —
 * the full structured data above powers the deterministic helpers, not this.
 */
export const FRAMEWORK_GUIDANCE_BLOCK = [
  "GROUND YOUR THINKING IN THESE PRACTICE FRAMEWORKS:",
  `• Behaviour as communication (R Domain of the LIVERS model): ${BEHAVIOUR_AS_COMMUNICATION_PRINCIPLE} Consider which driver may be operating — attachment & relationship needs, trauma & survival adaptations, emotional regulation, identity & beliefs, or the function the behaviour serves — and what it may be communicating.`,
  `• Child-Centred Ladder of Inference: ${LADDER_PRINCIPLE} Separate what was observed from what was selected, the meaning attached, assumptions, conclusions and beliefs; name where interpretation began; watch for distortions — trauma mistaken for defiance, shutdown for calm, neurodivergence for hostility, difference for risk, and confirmation or anxiety bias.`,
  `• Protective factors: ${PROTECTIVE_FACTOR_PRINCIPLE} Name strengths that genuinely reduce harm and how reliable they are under stress.`,
  `• The child's lived experience: ${CHILD_LIVED_EXPERIENCE_PRINCIPLE}`,
].join("\n");

/** One lead reflective question per behaviour driver (deterministic, no key). */
export function behaviourDriverReflections(): string[] {
  return BEHAVIOUR_DRIVERS.map((d) => `${d.name} — ${d.reflectiveQuestions[0]}`);
}

/** Behaviour-driver questions in AriaQuestion-compatible shape ({domain, question}). */
export function behaviourDriverQuestions(domain = "behaviour_driver"): { domain: string; question: string }[] {
  return BEHAVIOUR_DRIVERS.map((d) => ({ domain, question: `${d.name}: ${d.reflectiveQuestions[0]}` }));
}

/** The child-centred interruption for each rung of the ladder. */
export function ladderReflections(): string[] {
  return LADDER_OF_INFERENCE.map((r) => `${r.name}: ${r.interruption}`);
}

/** Flat list of inference distortions to watch for (sign-spotting). */
export function inferenceDistortions(): string[] {
  return LADDER_OF_INFERENCE.flatMap((r) => r.distortions);
}

/** Supervision warning signs — the "drift" cues to test against. */
export function supervisionWarningSigns(): string[] {
  return SUPERVISION_TESTS.map((t) => t.warningSign);
}

/** The seven protective-factor names. */
export function protectiveFactorNames(): string[] {
  return PROTECTIVE_FACTORS.map((f) => f.name);
}

/** Independence skills relevant to a curriculum domain (case-insensitive match). */
export function independenceSkillsForDomain(domain: string): IndependenceSkill[] {
  const d = domain.trim().toLowerCase();
  return INDEPENDENCE_SKILLS.filter((s) => s.domains.some((x) => x.toLowerCase() === d));
}
