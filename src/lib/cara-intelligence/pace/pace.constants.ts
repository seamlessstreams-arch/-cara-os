// ══════════════════════════════════════════════════════════════════════════════
// CARA INTELLIGENCE — PACE practice engine · CONSTANTS
//
// The knowledge base: PACE scripts (Dan Hughes / DDP), the deterministic
// detection lexicons used by the analyzer, the safety disclaimer, and the
// per-element practice prompts. Faithful to DDP: Acceptance is of the child's
// inner experience (never unsafe behaviour); Curiosity is non-judgemental and
// never "why did you do that?"; Empathy says the child is not alone; Playfulness
// only where safe — never during distress, disclosure, restraint or risk.
// ══════════════════════════════════════════════════════════════════════════════

import type { PACEContext, PACEElement } from "./pace.types";

export const PACE_DISCLAIMER =
  "Cara advises, drafts and recognises — you decide. PACE supports relational, trauma-informed practice alongside boundaries, regulation and safeguarding; it never replaces professional judgement or safeguarding escalation. Acceptance is of the child's feelings, never of unsafe behaviour.";

// ── Example staff scripts (per element) ───────────────────────────────────────
export const PACE_SCRIPTS: Record<PACEElement, { use: string[]; avoid?: string[]; note: string }> = {
  PLAYFULNESS: {
    note: "Lightness, warmth and humour — ONLY where safe and never mocking. Never use playfulness during serious distress, disclosure, restraint or immediate risk.",
    use: [
      "A warm, light tone to lower tension once the child is safe and calm.",
      "Gentle shared humour that is with the child, never at their expense.",
      "Playful connection during ordinary moments to build the relationship.",
    ],
    avoid: [
      "Sarcasm, teasing or mocking.",
      "Any lightness during distress, disclosure, restraint or risk.",
    ],
  },
  ACCEPTANCE: {
    note: "Accept the child's inner experience (their feeling), not unsafe behaviour.",
    use: [
      "I can see this feels really big for you.",
      "It makes sense that this felt hard.",
      "Whatever you're feeling right now is okay — we'll keep you safe while we work it out.",
    ],
    avoid: [
      "You shouldn't feel like that.",
      "Accepting or excusing unsafe behaviour (accept the feeling, hold the boundary).",
    ],
  },
  CURIOSITY: {
    note: "Non-judgemental wondering about what's underneath — never an interrogation, never 'why did you do that?'.",
    use: [
      "I wonder if something about that moment felt unfair.",
      "I'm wondering whether you felt ignored or unsafe.",
      "It seemed like something shifted for you just before — I'd love to understand it.",
    ],
    avoid: [
      "Why did you do that?",
      "What were you thinking?",
      "Any question that demands the child justify themselves.",
    ],
  },
  EMPATHY: {
    note: "Communicate that the child does not have to face the distress alone.",
    use: [
      "That sounds really painful.",
      "You don't have to manage that feeling on your own.",
      "I'm staying with you while we work this out.",
    ],
  },
};

export const PACE_ELEMENT_LABELS: Record<PACEElement, string> = {
  PLAYFULNESS: "Playfulness",
  ACCEPTANCE: "Acceptance",
  CURIOSITY: "Curiosity",
  EMPATHY: "Empathy",
};

// ── Detection lexicons (lower-case substring cues; deterministic) ─────────────

/** Evidence of each PACE element actually being present in a record. */
export const ELEMENT_CUES: Record<PACEElement, string[]> = {
  PLAYFULNESS: ["playful", "shared a joke", "lightened the mood", "had a laugh together", "light-hearted", "warm and playful", "gentle humour"],
  ACCEPTANCE: ["it makes sense", "makes sense that", "i can see this", "feels big", "your feelings are okay", "it's okay to feel", "accepted how", "validated", "i understand this feels", "that feeling is okay"],
  CURIOSITY: ["i wonder", "i'm wondering", "wondered if", "seemed like", "may have felt", "might have felt", "it looked like", "curious about", "explored what", "tried to understand what", "what was that like", "what was happening for"],
  EMPATHY: ["that sounds", "you don't have to", "don't have to do this on your own", "i'm staying with you", "i'm here with you", "stayed alongside", "you're not alone", "with you while", "that must have been", "i could see how hard"],
};

/** Shaming language — flags SHAMING_LANGUAGE. */
export const SHAMING_CUES = [
  "naughty", "bad boy", "bad girl", "should be ashamed", "attention seeking", "attention-seeking", "manipulative",
  "playing up", "playing games", "doing it on purpose", "should know better", "acting like a child", "spoilt", "spoiled",
  "drama", "pathetic", "grow up", "stop being", "what's wrong with",
];

/** Punitive / sanction-first responses — flags PUNITIVE_RESPONSE. */
export const PUNITIVE_CUES = [
  "sanction", "sanctioned", "punished", "punishment", "consequence given", "removed privileges", "took away", "banned from",
  "grounded", "early bed", "no phone", "loss of", "withdrew", "made him", "made her", "forced to", "told to do",
];

/** Adult-triggered / emotionally reactive language — flags ADULT_TRIGGER. */
export const ADULT_TRIGGER_CUES = [
  "i was angry", "lost my temper", "i had enough", "fed up", "i snapped", "wound me up", "frustrated me", "i shouted",
  "i raised my voice", "i told them straight", "i wasn't having it", "i refused to", "i'm sick of",
];

/** Blame-based / judgemental recording — flags BLAME_BASED_RECORDING. */
export const BLAME_CUES = [
  "refused to comply", "non-compliant", "non compliant", "defiant", "deliberately", "chose to", "for no reason",
  "without provocation", "unprovoked", "kicked off", "as usual", "yet again", "typical of",
];

/** Child voice present — absence flags MISSING_CHILD_VOICE. */
export const CHILD_VOICE_CUES = [
  "child said", "child told", "said that", "told staff", "told me", "shared that", "explained that", "asked for",
  "wanted to", "said he", "said she", "said they", "in their words", "described", "expressed that", "said it felt",
];

/** De-escalation steps — absence (when risk/incident) flags NO_DEESCALATION. */
export const DEESCALATION_CUES = [
  "offered space", "gave space", "stepped back", "lowered my voice", "lowered voice", "spoke calmly", "calm tone",
  "gave time", "reduced demands", "took the pressure off", "moved others away", "quiet space", "time to calm",
  "de-escalat", "deescalat", "reduced stimulation",
];

/** Co-regulation / regulation support — absence flags NO_REGULATION. */
export const REGULATION_CUES = [
  "stayed calm", "co-regulat", "coregulat", "regulated", "breathing", "grounding", "sensory", "stayed alongside",
  "remained calm", "kept my own", "modelled calm", "soothing", "helped them settle", "settle",
];

/** Relationship repair — absence flags NO_REPAIR. */
export const REPAIR_CUES = [
  "repair", "reconnect", "checked in later", "came back to", "made up", "reassured", "we're okay", "still here for",
  "returned to talk", "followed up with", "rebuilt", "restored", "later that",
];

/** Boundary / safety actions held safely. */
export const BOUNDARY_CUES = [
  "kept safe", "kept everyone safe", "boundary", "safe hold", "removed the risk", "made safe", "ensured safety",
  "held the boundary", "clear limit", "safe distance", "safety plan", "risk reduced",
];

/** Exploring the need beneath behaviour — absence flags BEHAVIOUR_WITHOUT_NEED. */
export const NEED_CUES = [
  "underneath", "may have needed", "unmet need", "trigger", "triggered by", "because", "felt unsafe", "felt unheard",
  "felt rejected", "reminded them of", "what they needed", "communicating", "behaviour was telling", "may be linked to",
];

/** "Why did you do that?" — the classic anti-curiosity pattern. */
export const ANTI_CURIOSITY_CUES = [
  "why did you do that", "why did you", "why would you", "what were you thinking", "what's the matter with you",
  "what is wrong with you", "explain yourself",
];

/** Risk / unsafe-behaviour cues → professional judgement always required. */
export const RISK_CUES = [
  "restraint", "physical intervention", "held him", "held her", "self-harm", "self harm", "ligature", "overdose",
  "missing", "absconded", "weapon", "knife", "assault", "hit staff", "disclosure", "disclosed", "suicidal",
  "threatened to", "unsafe", "ran off", "police", "hospital", "injury", "blood", "strangle", "choke",
];

/** Contexts where unsafe behaviour / risk is inherently likely. */
export const RISKY_CONTEXTS: PACEContext[] = [
  "INCIDENT", "MISSING_FROM_CARE", "PHYSICAL_INTERVENTION", "ROOM_SEARCH", "SANCTION",
];

/** General reflective prompts (used when an element is weak). */
export const PACE_PROMPTS: Record<PACEElement | "GENERAL", string[]> = {
  PLAYFULNESS: ["Was there a safe moment where warmth or lightness could rebuild connection (never during distress)?"],
  ACCEPTANCE: ["Did the child hear that their feeling made sense — separate from any boundary on behaviour?"],
  CURIOSITY: ["What might have been happening underneath, beyond the behaviour itself? Wonder aloud, don't interrogate."],
  EMPATHY: ["Did the child feel they were not facing this alone?"],
  GENERAL: [
    "Connect before correct: was the relationship attended to before the boundary?",
    "Whose voice is in this record — is the child's experience present?",
    "What was the need the behaviour was communicating?",
  ],
};
