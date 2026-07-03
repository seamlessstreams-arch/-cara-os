// ══════════════════════════════════════════════════════════════════════════════
// CARA HEART — LifeSpaceInterventionEngine (pure / deterministic)
//
// Identifies meaningful practice moments in ordinary daily life. Treats the
// "other twenty-three hours" of residential care as the primary therapeutic
// medium. Detects life-space moments and surfaces their practice value.
//
// Based on the principle that in residential care the daily living environment
// is the intervention — mealtimes, bedtimes, car journeys, conversations,
// conflicts and moments of repair are all therapeutic events.
// ══════════════════════════════════════════════════════════════════════════════

import { containsAnyKeyword } from "@/lib/keyword-match";
import type {
  CaraPracticeRecord,
  LifeSpaceContext,
  LifeSpaceMoment,
  PracticeValue,
  IntelligenceAuditEntry,
} from "../types";

const ENGINE = "LifeSpaceInterventionEngine";

let momentCounter = 0;
function momentId(): string {
  momentCounter += 1;
  return `lsm_${momentCounter}`;
}

// ── Context classifier ────────────────────────────────────────────────────────

interface ContextRule {
  context: LifeSpaceContext;
  keywords: string[];
}

const CONTEXT_RULES: ContextRule[] = [
  { context: "morning_routine", keywords: ["morning", "wake up", "woke up", "breakfast", "getting up", "school run", "shower", "getting ready"] },
  { context: "bedtime", keywords: ["bedtime", "bed time", "night time", "sleep", "refused to go to bed", "room", "evening routine", "lights out"] },
  { context: "meal_time", keywords: ["meal", "dinner", "lunch", "tea", "food", "eating", "refused food", "cooking", "kitchen"] },
  { context: "education_transition", keywords: ["school", "college", "education", "lesson", "teacher", "learning", "tutor", "exclusion", "attendance", "homework"] },
  { context: "family_contact", keywords: ["contact", "family", "mum", "dad", "mother", "father", "sibling", "phone call", "visit", "after contact", "phone"] },
  { context: "missing_return", keywords: ["returned", "came back", "returned home", "returned safe", "missing", "absent without leave", "awol", "return home interview"] },
  { context: "health", keywords: ["health", "appointment", "medication", "doctor", "nurse", "camhs", "gp", "therapy", "wellbeing", "medical"] },
  { context: "hygiene", keywords: ["hygiene", "shower", "bath", "cleaning teeth", "personal care", "wash", "refused wash", "hair"] },
  { context: "activity", keywords: ["activity", "trip", "outing", "sports", "gym", "park", "cinema", "game", "art", "music", "walked"] },
  { context: "boundary", keywords: ["boundary", "rule", "refused", "wouldn't", "would not", "curfew", "not allowed", "restriction", "consequence"] },
  { context: "conflict", keywords: ["conflict", "argument", "dispute", "fought", "shouted", "sworn", "aggressive", "distress", "escalat"] },
  { context: "repair", keywords: ["repair", "restorative", "conversation", "apolog", "sorry", "made up", "resolved", "settled", "calmer"] },
  { context: "informal_conversation", keywords: ["chat", "talked", "spoke", "conversation", "opened up", "shared", "told me", "mentioned", "discussion", "sat together"] },
];

function classifyLifeSpaceContext(record: CaraPracticeRecord): LifeSpaceContext {
  const lower = [record.description, record.staffResponse ?? ""].join(" ").toLowerCase();
  for (const rule of CONTEXT_RULES) {
    if (containsAnyKeyword(lower, rule.keywords)) {
      return rule.context;
    }
  }
  return "other";
}

// ── Practice value classifier ─────────────────────────────────────────────────

function classifyPracticeValue(record: CaraPracticeRecord, context: LifeSpaceContext): PracticeValue {
  const lower = [record.description, record.staffResponse ?? ""].join(" ").toLowerCase();

  if (context === "repair") return "repair";
  if (context === "missing_return") return "safety";
  if (context === "family_contact") return "belonging";
  if (context === "informal_conversation") return "trust_building";
  if (context === "activity") return "identity";
  if (context === "morning_routine" || context === "bedtime" || context === "hygiene" || context === "meal_time") return "routine";

  // Word-boundary helper (as line 56 does): raw `.includes("regulat")` also matched
  // "dysregulated" — the OPPOSITE of co-regulation. Leading-\b keeps "regulated"/
  // "co-regulated"/"self-regulation" but excludes "dysregulated". "regulat" already
  // covers the "co-"/"self-" prefixes, so the old bare "co-" cue (which caught
  // "co-produced" etc.) is dropped. See project_keyword_matching_bugs.
  if (containsAnyKeyword(lower, ["calm", "regulat", "breathe"])) return "co_regulation";
  if (lower.includes("feeling") || lower.includes("emotion") || lower.includes("expressed")) return "emotional_literacy";
  if (lower.includes("choice") || /\brights?\b/.test(lower) || /\bvoice\b/.test(lower)) return "rights";
  if (lower.includes("independen") || lower.includes("life skill") || lower.includes("cooked") || lower.includes("managed alone")) return "independence";
  if (lower.includes("belong") || lower.includes("home") || /\bsafe/i.test(lower)) return "belonging";
  if (lower.includes("trust") || lower.includes("confided") || lower.includes("accepted help")) return "trust_building";

  return "routine";
}

// ── Meaning classifier ────────────────────────────────────────────────────────

function derivePossibleMeaning(record: CaraPracticeRecord, context: LifeSpaceContext): string[] {
  const lower = [record.description, record.staffResponse ?? ""].join(" ").toLowerCase();
  const meanings: string[] = [];

  if (context === "boundary" || lower.includes("refused") || lower.includes("wouldn't")) {
    meanings.push(
      "Refusal can communicate anxiety, a need for control, shame, fear of failure, or testing whether adults will remain available.",
    );
  }
  if (context === "family_contact" || lower.includes("contact") || lower.includes("mum") || lower.includes("dad")) {
    meanings.push(
      "The child's presentation around family contact may reflect complex feelings about belonging, loss, loyalty, and identity.",
    );
  }
  if (context === "conflict" || context === "boundary") {
    meanings.push(
      "Conflict and testing boundaries may reflect a need to check whether adults remain safe, consistent, and available under pressure.",
    );
  }
  if (context === "repair" || context === "informal_conversation") {
    meanings.push(
      "A child who accepts a repair conversation or opens up in an informal moment is demonstrating growing trust in the relational environment.",
    );
  }
  if (context === "missing_return") {
    meanings.push(
      "The return from a missing episode is a significant relational moment. How adults receive the child shapes whether the home feels safe to return to.",
    );
  }
  if (lower.includes("refused") && lower.includes("food")) {
    meanings.push(
      "Refusing food can carry emotional meaning — control, anxiety, family association, or sensory sensitivity.",
    );
  }
  if (lower.includes("sleep") || lower.includes("bedtime")) {
    meanings.push(
      "Night-time can be a particularly difficult time for children who have experienced trauma. Bedtime routines carry deep relational significance.",
    );
  }

  if (meanings.length === 0) {
    meanings.push(
      "This ordinary daily moment may carry relational, emotional, or developmental significance. Reflect on what the child's behaviour and response communicate.",
    );
  }

  return meanings;
}

// ── Relational opportunity ─────────────────────────────────────────────────────

function deriveRelationalOpportunity(context: LifeSpaceContext, record: CaraPracticeRecord): string[] {
  const lower = [record.description, record.staffResponse ?? ""].join(" ").toLowerCase();

  const opportunities: Record<LifeSpaceContext, string[]> = {
    morning_routine: [
      "The morning routine is a chance to help the child start the day feeling safe, connected, and prepared.",
      "A brief, warm morning interaction can set the tone for the child's whole day.",
    ],
    bedtime: [
      "Bedtime is an important relational moment — staying nearby, offering calm reassurance, and acknowledging the child's day.",
      "A consistent, predictable bedtime routine communicates safety and care.",
    ],
    meal_time: [
      "Mealtimes can build a sense of normality, belonging and family-life experience.",
      "Sitting together at mealtimes, without pressure, can build connection over time.",
    ],
    education_transition: [
      "The transition to and from education is a relational moment — a brief, warm check-in can reduce anxiety.",
      "Supporting the child to attend, engage with and succeed in education is part of the placement's therapeutic purpose.",
    ],
    family_contact: [
      "How staff support the child before, during and after family contact is a critical piece of relational practice.",
      "The child may need space to process complex feelings after contact. A warm, low-demand environment helps.",
    ],
    missing_return: [
      "The return from a missing episode is one of the most significant relational moments in residential care. Receive the child without punishment, judgement or lecture.",
      "A calm, warm, non-judgmental return helps the child feel safe enough to return next time.",
    ],
    health: [
      "Health appointments can be anxiety-provoking. Staff accompanying the child can offer reassurance and advocacy.",
      "Medication routines can be an opportunity for a brief, caring interaction.",
    ],
    hygiene: [
      "Personal care routines may carry associations with shame, control, or past experiences. A non-pressured, matter-of-fact approach maintains dignity.",
    ],
    activity: [
      "Shared activities offer natural opportunities for connection, fun, and a break from the intensity of daily care.",
      "Noticing and affirming what the child enjoys builds their sense of identity and belonging.",
    ],
    boundary: [
      "How adults set and maintain boundaries communicates care, not rejection. Consistent, calm, non-punitive responses maintain the relationship.",
    ],
    conflict: [
      "How adults respond under pressure shows children whether they are truly safe. Remaining calm and regulated models the behaviour we want children to learn.",
    ],
    repair: [
      "A repair conversation after conflict shows the child that relationships can survive difficulty. This is powerful therapeutic learning.",
    ],
    informal_conversation: [
      "Unplanned conversations are often the most significant. A child who chooses to talk is exercising trust.",
      "Active listening, curiosity without pressure, and acceptance create the conditions for a child to open up.",
    ],
    other: [
      "This everyday moment may offer an opportunity to build connection, model regulation, or affirm the child's identity and belonging.",
    ],
  };

  const base = opportunities[context] ?? opportunities.other;

  if (lower.includes("refused") || lower.includes("couldn't")) {
    return [
      ...base,
      "When a child refuses, try offering a smaller step, staying nearby without pressure, and coming back to the moment later.",
    ];
  }

  return base;
}

// ── Recording prompt ──────────────────────────────────────────────────────────

function deriveRecordingPrompt(context: LifeSpaceContext, practiceValue: PracticeValue): string {
  const prompts: Partial<Record<PracticeValue, string>> = {
    trust_building:
      "Record what the child allowed or accepted. Small moments of trust are significant therapeutic progress worth noting.",
    co_regulation:
      "Record what staff did that helped the child regulate, and what the child's response showed about their current capacity.",
    identity:
      "Note how this moment connected to the child's sense of who they are — their interests, strengths, culture, or aspirations.",
    belonging:
      "Record what this moment showed about the child's sense of belonging in the home and in their wider world.",
    repair:
      "Record what was said, how the child responded, and whether the relational rupture has been repaired. Note any follow-up needed.",
    routine:
      "Record how the routine went, any variations from the child's usual pattern, and what staff did to support the child.",
    emotional_literacy:
      "Record the emotion the child expressed or demonstrated, and how staff responded to it. This is evidence of therapeutic progress.",
    rights:
      "Record whether the child exercised choice, had their voice heard, or was supported to understand their rights.",
    safety:
      "Record the safety of the moment and what was done to ensure the child felt secure and cared for.",
    independence:
      "Record what the child managed independently or with support. Independence skills are part of the placement's purpose.",
  };

  return (
    prompts[practiceValue] ??
    "Record what happened, what the child communicated, and what this moment may mean for their development and wellbeing."
  );
}

// ── Main engine function ──────────────────────────────────────────────────────

export interface LifeSpaceEngineResult {
  moments: LifeSpaceMoment[];
  audit: IntelligenceAuditEntry[];
}

export function runLifeSpaceEngine(
  record: CaraPracticeRecord,
  now: string = new Date().toISOString(),
): LifeSpaceEngineResult {
  const audit: IntelligenceAuditEntry[] = [];
  const context = classifyLifeSpaceContext(record);
  const practiceValue = classifyPracticeValue(record, context);
  const possibleMeaning = derivePossibleMeaning(record, context);
  const relationalOpportunity = deriveRelationalOpportunity(context, record);
  const recordingPrompt = deriveRecordingPrompt(context, practiceValue);

  audit.push({
    ruleId: "LS_CONTEXT_CLASSIFIED",
    engine: ENGINE,
    triggered: true,
    reason: `Life space context classified as '${context}', practice value as '${practiceValue}'.`,
    severity: "info",
    timestamp: now,
  });

  const moment: LifeSpaceMoment = {
    id: momentId(),
    childId: record.childId,
    dateTime: record.dateTime,
    context,
    observedBehaviour: record.description,
    possibleMeaning,
    relationalOpportunity,
    practiceValue,
    recordingPrompt,
  };

  return { moments: [moment], audit };
}
