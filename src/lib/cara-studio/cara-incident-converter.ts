// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — INCIDENT-TO-LEARNING CONVERTER
//
// Turns an incident into a non-shaming learning opportunity: infers the
// learning theme from the incident text, reframes around the unmet need,
// plans the child conversation, builds a 5-minute micro-session and points
// at the follow-up. Serious incident classes ALWAYS set manager review.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraIncidentLearningOutput } from "./cara-types";
import type { CaraChildContext } from "./cara-context-builder";
import { PACE_OPENINGS, PACE_VALIDATIONS, RECORDING_PROMPTS } from "./cara-prompt-library";
import { computeManagerReview, type ManagerReviewDecision } from "./cara-guardrails";
import { BEHAVIOUR_DRIVERS } from "@/lib/aria/practice-frameworks";

export interface IncidentLearningInput {
  ctx: CaraChildContext;
  incidentSummary: string;
  staffResponse?: string;
  childResponse?: string;
  desiredLearning?: string;
}

interface ThemeRule {
  pattern: RegExp;
  theme: string;
  unmetNeeds: string[];
  reframe: (name: string) => string;
  materials: string[];
  serious?: boolean;
}

const THEME_RULES: ThemeRule[] = [
  {
    pattern: /\b(missing|absconde|didn'?t (come|return)|curfew|left the home)\b/i,
    theme: "Going missing and staying safe",
    unmetNeeds: ["Autonomy and feeling controlled", "Pull factors outside the home (people, belonging)", "Escaping a feeling, not a place"],
    reframe: (n) => `${n} wasn't 'breaking rules for fun' — leaving was meeting a need we don't fully understand yet. Our job is to make coming back easy and to get curious about the pull, not to make returning feel like walking into trouble.`,
    materials: ["safety_plan", "scenario_cards", "decision_tree"],
    serious: true,
  },
  {
    pattern: /\b(exploit|county lines|older (males|men|friends)|grooming|gifts from|unknown (adults|males))\b/i,
    theme: "Understanding exploitation and pressure",
    unmetNeeds: ["Belonging and status", "Money or things", "Feeling chosen and important"],
    reframe: (n) => `${n} is being targeted, not choosing badly. Exploitation works by meeting real needs — the learning is about spotting the hook, never about blaming the fish.`,
    materials: ["exploitation_awareness_activity", "scenario_cards", "safety_plan"],
    serious: true,
  },
  {
    pattern: /\b(self[- ]harm|cutting|overdose|suicid)\b/i,
    theme: "Big feelings and staying safe",
    unmetNeeds: ["Releasing unbearable feelings", "Communicating pain that words can't carry", "Control over something"],
    reframe: (n) => `${n}'s actions are communication of pain, not attention-seeking. The learning sits AFTER safety and clinical input — gentle feelings-literacy that builds other ways to be heard.`,
    materials: ["feelings_cards", "safety_plan", "audio_script"],
    serious: true,
  },
  {
    pattern: /\b(damage|smashed|broke|threw|property|kicked (the|a) (door|wall))\b/i,
    theme: "What happens in my body when I get angry",
    unmetNeeds: ["Discharge of overwhelming energy", "Being heard when words failed", "Predictability that collapsed"],
    reframe: (n) => `The damage is the end of a chain that started much earlier. ${n} needs us curious about the first link — the body signals before the explosion — not focused on the cost of the door.`,
    materials: ["visual_card", "feelings_cards", "comic_strip"],
  },
  {
    pattern: /\b(assault|hit|punched|fight|attacked|violence|aggressi)\b/i,
    theme: "Conflict, repair and living together",
    unmetNeeds: ["Safety (attack as defence)", "Status or face-saving in front of peers", "Old survival responses firing"],
    reframe: (n) => `${n} went into survival mode — fight got there before think. The learning is about noticing the build-up and finding exits that don't cost face, plus genuine repair that isn't a forced apology.`,
    materials: ["restorative_conversation", "scenario_cards", "role_play"],
    serious: true,
  },
  {
    pattern: /\b(peer|other (child|young person)|argument with|name[- ]calling|wound (him|her|them) up)\b/i,
    theme: "Living with other children",
    unmetNeeds: ["Space and sensory relief", "Fairness and being treated equally", "Attention and significance"],
    reframe: (n) => `Group living is genuinely hard — ${n} is managing other children's trauma as well as their own. This is a shared-space skills gap, not a 'bad kid' problem.`,
    materials: ["living_with_others_activity", "scenario_cards", "visual_card"],
  },
  {
    pattern: /\b(refus|wouldn'?t|won'?t|ignored staff|non[- ]?complian)\b/i,
    theme: "Choices, control and trust",
    unmetNeeds: ["Control in a life with little of it", "Avoiding shame or failure", "Testing whether adults stay"],
    reframe: (n) => `Refusal is information: the demand outweighed the relationship in that moment. The learning is for BOTH sides — how we offer choices, and how ${n} can say 'not now' in ways adults can hear.`,
    materials: ["decision_tree", "visual_card", "routine_builder"],
  },
  {
    pattern: /\b(cannabis|vap(e|ing)|alcohol|drugs?|smoking)\b/i,
    theme: "Cannabis, vaping and health choices",
    unmetNeeds: ["Calming an overwhelmed system", "Fitting in with peers", "Sleep or escape"],
    reframe: (n) => `Substances are doing a job for ${n} — usually calming or belonging. Honest health information lands better than fear; the learning is harm-aware, judgement-free and paired with real alternatives.`,
    materials: ["quiz", "scenario_cards", "audio_script"],
  },
];

const DEFAULT_RULE: ThemeRule = {
  pattern: /./,
  theme: "Processing what happened",
  unmetNeeds: ["A need we haven't identified yet — stay curious"],
  reframe: (n) => `Something made sense about this for ${n} in that moment, even if we can't see it yet. The learning starts with understanding, not correcting.`,
  materials: ["visual_card", "feelings_cards"],
};

export function convertIncidentToLearning(input: IncidentLearningInput): { output: CaraIncidentLearningOutput; review: ManagerReviewDecision } {
  const { ctx } = input;
  const name = ctx.name;
  const rule = THEME_RULES.find((r) => r.pattern.test(input.incidentSummary)) ?? DEFAULT_RULE;

  const review = computeManagerReview({
    topicOrTheme: rule.theme,
    fromSeriousIncident: rule.serious ?? false,
    childTriggerMatch: ctx.triggerMatch,
    guardrailSeverity: null,
    outputText: input.incidentSummary,
  });

  const output: CaraIncidentLearningOutput = {
    learningTheme: input.desiredLearning || rule.theme,
    nonShamingReframe: rule.reframe(name),
    possibleUnmetNeed: [
      ...rule.unmetNeeds,
      // Behaviour as communication — weigh which relational/psychological driver may fit.
      `Behaviour is communication: gently weigh which driver may have been loudest for ${name} — ${BEHAVIOUR_DRIVERS.map((d) => d.name.toLowerCase()).join(", ")}.`,
    ],
    staffReflection: `Before the conversation, ask yourself: what was the moment like for ${name}, second by second? What did our response communicate? ${input.staffResponse ? `Looking at what we did (${input.staffResponse.slice(0, 120)}), what would we keep and what would we soften?` : "What would 'connection before correction' have looked like at each step?"}`,
    childConversationPlan: [
      `Wait until ${name} is regulated and the moment is ordinary — never relitigate in the heat.`,
      `Open without the incident: "${PACE_OPENINGS[1]}"`,
      `Validate before exploring: "${PACE_VALIDATIONS[0]}"`,
      `One curious question only: "What was the hardest part of that for you?" — then hold the silence.`,
      `Offer repair as a choice, not a sentence: "Is there anything you'd want to put right — your way?"`,
      `Close warm: the relationship survived. Name it.`,
    ],
    microSession: {
      title: `5 minutes: the moment before the moment`,
      durationMinutes: 5,
      steps: [
        "Side by side, paper between you (no eye-contact pressure).",
        `Draw a simple timeline of the day — ${name} marks where things started to feel off (a dot is enough).`,
        "Ask only: 'what was happening just before that dot?'",
        "Together pick ONE thing that could help at the dot next time (move, drink, music, find staff).",
        "End on something completely ordinary together.",
      ],
    },
    followUpSessionTheme: rule.theme,
    interactiveMaterialSuggestions: rule.materials,
    staffGuidance:
      "The incident is the doorway, not the subject. If the conversation drifts into defending or prosecuting what happened, step back to feelings and needs. Repair is offered, never demanded.",
    adaptationNotes: [
      ctx.profile?.learning_style?.low_literacy ? "Keep everything verbal/visual — no written accounts from the child." : "Offer drawing or talking — never a written 'statement'.",
      "Shame-sensitive by default: externalise (the situation, the build-up) rather than 'your behaviour'.",
    ],
    safeguardingNotes: rule.serious
      ? "This incident class carries safeguarding weight. Complete the formal safeguarding steps FIRST; this learning work follows them and never replaces them. Manager review required before use."
      : "If new information emerges during the learning conversation, record it and follow the safeguarding procedure.",
    signsToPause: ["Re-living rather than reflecting (breathing change, glazing)", "Defensiveness escalating — you've become the prosecutor, reset", "Shame spiral ('I'm just bad') — stop the content, repair the moment"],
    followUpActions: [
      "Link this plan to the incident record",
      review.required ? "Manager review before the conversation happens" : "Share the plan at handover",
      `Book the follow-up session ('${rule.theme}') within the week`,
    ],
    recordingPrompt: RECORDING_PROMPTS.incident_learning,
    managerReviewNeeded: review.required,
  };

  return { output, review };
}
