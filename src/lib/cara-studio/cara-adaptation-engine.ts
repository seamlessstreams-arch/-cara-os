// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — SEND & COMMUNICATION ADAPTATION ENGINE
//
// Rule-based transformations that make any content easier for THIS child:
// reduce text, plain language, broken-down steps, choices, visuals, breaks,
// curiosity over confrontation, movement, no forced eye contact. Deterministic
// and explainable — every change is listed in changesMade; the do-not-do list
// is built from the declared needs. The optional LLM pass only re-words the
// already-adapted version.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraAdaptedContentOutput, CaraChildLearningProfile } from "./cara-types";
import { RECORDING_PROMPTS } from "./cara-prompt-library";

export const ADAPTATION_NEEDS = [
  "adhd", "autism", "dyslexia", "speech_and_language", "low_literacy",
  "emotional_dysregulation", "trauma_triggers", "anxiety", "low_trust",
  "short_attention_span", "sensory_overload", "oppositional_presentation",
  "demand_avoidance", "visual_learner", "audio_learner", "practical_learner",
  "eal", "shame_sensitivity", "rejection_sensitivity",
] as const;
export type AdaptationNeed = (typeof ADAPTATION_NEEDS)[number];

// Plain-language swaps (abstract/clinical → concrete/everyday).
const PLAIN_SWAPS: [RegExp, string][] = [
  [/\bdysregulat(ed|ion)\b/gi, "big feelings"],
  [/\bemotional regulation\b/gi, "handling big feelings"],
  [/\bconsequences?\b/gi, "what happens next"],
  [/\bappropriate(ly)?\b/gi, "okay"],
  [/\binappropriate\b/gi, "not okay"],
  [/\bfacilitate\b/gi, "help with"],
  [/\butili[sz]e\b/gi, "use"],
  [/\bsubsequently\b/gi, "after that"],
  [/\bcommunicat(e|ing) effectively\b/gi, "saying what you need"],
  [/\bresilien(ce|t)\b/gi, "bouncing back"],
  [/\breflect (up)?on\b/gi, "think about"],
];

const NEED_RULES: Record<AdaptationNeed, { changes: string[]; doNotDo: string[]; regulation?: string[] }> = {
  adhd: {
    changes: ["Split into very short steps", "Added movement between steps", "One idea per line"],
    doNotDo: ["No long worksheets", "Don't expect sitting still throughout", "Don't remove breaks as a consequence"],
    regulation: ["Movement break every 3–5 minutes", "Let them stand, pace or fiddle while talking"],
  },
  autism: {
    changes: ["Concrete language — removed idioms and abstractions", "Predictable structure stated up front", "Literal, specific examples"],
    doNotDo: ["No surprises or sudden topic changes", "Don't force eye contact", "Avoid vague questions like 'how do you feel?' — offer options instead"],
    regulation: ["Tell them what's happening first, every time", "Offer the same ending ritual each session"],
  },
  dyslexia: {
    changes: ["Reduced reading load", "Replaced writing tasks with talking, pointing or drawing"],
    doNotDo: ["Don't ask them to read aloud", "Don't mark or correct spelling"],
  },
  speech_and_language: {
    changes: ["Short sentences", "One question at a time with wait time", "Choices offered instead of open questions"],
    doNotDo: ["Don't finish their sentences", "Don't rush the silence"],
  },
  low_literacy: {
    changes: ["Stripped text to essentials", "Visual/spoken alternative for every written part"],
    doNotDo: ["Never hand over a dense page of text", "Don't make reading the gateway to taking part"],
  },
  emotional_dysregulation: {
    changes: ["Built in regulation pauses", "Lowered emotional intensity of wording", "Exit ramp at every step"],
    doNotDo: ["Don't push through visible escalation", "Don't do heavy topics late at night unless safety requires it"],
    regulation: ["Agree a stop signal before starting", "Have the calming option ready (drink, blanket, music, outside)"],
  },
  trauma_triggers: {
    changes: ["Softened openings — no cold starts on hard topics", "Child controls pace and depth"],
    doNotDo: ["Never probe for trauma detail", "Don't link the work to punishment or privileges"],
    regulation: ["Watch the body more than the words; pause on freeze, fidget-spike or glazing"],
  },
  anxiety: {
    changes: ["Stated exactly what will happen and for how long", "Normalising language throughout"],
    doNotDo: ["No put-on-the-spot questions", "Don't spring the session on them — give notice"],
  },
  low_trust: {
    changes: ["Side-by-side framing (activity together) rather than face-to-face questioning", "Staff share first where safe"],
    doNotDo: ["Don't promise what you can't deliver", "Never promise secrecy — be honest about what gets shared"],
  },
  short_attention_span: {
    changes: ["Cut to a 5–10 minute core", "Front-loaded the one key message"],
    doNotDo: ["Don't chain multiple worksheets", "Stop while it's still going well"],
    regulation: ["Two-minute burst, then break, then return"],
  },
  sensory_overload: {
    changes: ["Flagged a low-stimulation setting", "Removed busy visuals"],
    doNotDo: ["No noisy shared spaces for this work", "Don't insist on sitting at the table"],
  },
  oppositional_presentation: {
    changes: ["Reframed instructions as choices", "Removed commands and ultimatums"],
    doNotDo: ["Don't turn it into a standoff — opting out is allowed", "Don't mistake refusal for failure; the offer itself builds trust"],
  },
  demand_avoidance: {
    changes: ["Declarative language ('I wonder…', 'Some people…') instead of direct demands", "Invitations, not instructions"],
    doNotDo: ["Avoid 'you need to / you must'", "Don't count compliance as the goal"],
  },
  visual_learner: {
    changes: ["Added a visual for each key idea", "Suggested drawing instead of writing"],
    doNotDo: ["Don't rely on talk alone"],
  },
  audio_learner: {
    changes: ["Added a spoken script and discussion alternative"],
    doNotDo: ["Don't lead with worksheets"],
  },
  practical_learner: {
    changes: ["Turned ideas into a doing-activity (build, sort, walk-and-talk, role-play)"],
    doNotDo: ["Don't keep it abstract — anchor in a real situation"],
  },
  eal: {
    changes: ["Plain English, no idioms", "Key words highlighted with visual back-up"],
    doNotDo: ["Don't equate language level with understanding"],
  },
  shame_sensitivity: {
    changes: ["Removed evaluative language", "Externalised the problem (the situation, not the child)"],
    doNotDo: ["Never compare to other children", "Don't revisit the worst moment in detail"],
  },
  rejection_sensitivity: {
    changes: ["Affirmed the relationship before and after the hard part", "Built in a repair line if it wobbles"],
    doNotDo: ["Don't withdraw warmth as feedback", "Don't end on the difficult bit"],
  },
};

function simplify(text: string): string {
  let out = text;
  for (const [pat, repl] of PLAIN_SWAPS) out = out.replace(pat, repl);
  return out;
}

function shorten(text: string, maxSentences: number): string {
  const sentences = text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, maxSentences).join(" ");
}

export interface AdaptInput {
  originalContent: string;
  adaptationNeeds: AdaptationNeed[] | string[];
  format: "text" | "visual" | "audio" | "low_writing";
  profile?: CaraChildLearningProfile | null;
}

export function adaptCaraContent(input: AdaptInput): CaraAdaptedContentOutput {
  const needs = input.adaptationNeeds
    .map((n) => n.toLowerCase().replace(/[^a-z_]/g, "_") as AdaptationNeed)
    .filter((n): n is AdaptationNeed => (ADAPTATION_NEEDS as readonly string[]).includes(n));

  const changes = new Set<string>(["Plain-language pass (abstract and clinical wording replaced)"]);
  const doNotDo = new Set<string>([
    "Never use this work as a consequence or condition",
    "Never push past the child's stop signal",
  ]);
  const regulation = new Set<string>();

  for (const need of needs) {
    const rule = NEED_RULES[need];
    rule.changes.forEach((c) => changes.add(c));
    rule.doNotDo.forEach((d) => doNotDo.add(d));
    rule.regulation?.forEach((r) => regulation.add(r));
  }

  const shortAttention = needs.includes("short_attention_span") || needs.includes("adhd") || input.profile?.learning_style?.short_bursts;
  const lowLiteracy = needs.includes("low_literacy") || needs.includes("dyslexia") || input.profile?.learning_style?.low_literacy;

  let adapted = simplify(input.originalContent);
  if (shortAttention) {
    adapted = shorten(adapted, 4);
    changes.add("Shortened to the essential core (attention profile)");
  }
  if (lowLiteracy) {
    adapted = shorten(adapted, 3);
  }
  // Break into stepped lines: one sentence per line, numbered.
  const steps = adapted.split(/(?<=[.!?])\s+/).filter(Boolean);
  const stepped = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  changes.add("Broken into numbered micro-steps");

  const simplified = shorten(simplify(input.originalContent), 2);

  const visualSuggestions = [
    "One simple picture per step — photo, emoji scale or quick sketch",
    "A feelings thermometer or 1–5 cards the child can point to",
    needs.includes("autism") ? "A now/next visual so the structure is predictable" : "A choice board: talk / draw / point / pass",
  ];

  const audioScript = `Spoken version — calm, unhurried, pauses marked:\n"${simplified}"\n[pause]\n"No right answers. You can talk, point, draw — or just listen."\n[pause]\n"Want to tell me one thing about it, or shall I go first?"`;

  return {
    adaptedVersion: stepped,
    changesMade: [...changes],
    visualSuggestions,
    audioScript,
    simplifiedLanguageVersion: simplified,
    regulationAdjustments: [...regulation, "Offer a break before the child needs one"],
    doNotDoList: [...doNotDo],
    staffGuidance:
      "Use this as a guide, not a script. Follow the child's pace; the relationship matters more than completing the activity. Curiosity over confrontation throughout.",
    adaptationNotes: needs.length ? needs.map((n) => `Adapted for ${n.replace(/_/g, " ")}`) : ["No specific needs declared — kept the general low-demand format"],
    safeguardingNotes:
      "If the child discloses anything concerning during this work, follow the home's safeguarding procedure immediately — never promise secrecy.",
    signsToPause: [
      "Going quiet or 'glazing over'",
      "Fidgeting sharply increasing or fists clenching",
      "Self-deprecating comments ('I'm thick', 'whatever')",
      "Asking to leave — that's a yes",
    ],
    followUpActions: ["Note which format the child engaged with and reuse it", "Feed what worked back into the child's learning profile"],
    recordingPrompt: RECORDING_PROMPTS.adaptation,
    managerReviewNeeded: false,
  };
}
