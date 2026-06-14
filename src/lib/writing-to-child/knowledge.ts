// ═══════════════════════════════════════════════════════════════════════════
// CARA — WRITING TO THE CHILD  ·  knowledge network
//
// Ten practice principles ("nodes") that ground child-readable recording. These
// are high-level, widely-held practice principles (strengths, trauma, rights,
// emotion, anti-oppression, memory, clarity, dignity, accountability) — not any
// author's proprietary framework. Each node carries reflective questions Cara
// can surface; no node is more important than another.
//
// Core principle: write the record as evidence for professionals, but as memory
// for the child.
// ═══════════════════════════════════════════════════════════════════════════

export type WritingNodeKey =
  | "future_reader"
  | "memory_identity"
  | "child_voice"
  | "trauma_informed"
  | "rights_based"
  | "anti_oppressive"
  | "safeguarding_clarity"
  | "adult_accountability"
  | "emotional_safety"
  | "restorative_repair";

export interface WritingNode {
  key: WritingNodeKey;
  name: string;
  principle: string;
  reflectiveQuestions: string[];
}

export const WRITING_NODES: WritingNode[] = [
  {
    key: "future_reader",
    name: "The child as future reader",
    principle: "The record may one day be read by the child, or by the adult they become.",
    reflectiveQuestions: [
      "If this child reads this in 10 or 20 years, will they understand what happened?",
      "Will they feel seen, respected and treated as a whole person?",
      "Have we explained why adults acted as they did?",
    ],
  },
  {
    key: "memory_identity",
    name: "Memory and identity",
    principle: "A child's records are part of their life story, identity and personal memory.",
    reflectiveQuestions: [
      "Does this record help the child make sense of their life?",
      "Does it include human detail, not only risk and behaviour?",
      "Does it preserve the child's dignity?",
    ],
  },
  {
    key: "child_voice",
    name: "The child's voice",
    principle: "The child should be visible in the record.",
    reflectiveQuestions: [
      "What did the child say (in their own words where possible)?",
      "What did the child show — through behaviour, silence, avoidance, emotion or body language?",
      "If the child did not speak, how was that recorded carefully and without assumption?",
      "Has the child's view been included, even where adults disagree with it?",
    ],
  },
  {
    key: "trauma_informed",
    name: "Trauma-informed meaning",
    principle: "Behaviour is recorded with context, curiosity and emotional understanding.",
    reflectiveQuestions: [
      "What was happening before the behaviour?",
      "What might the behaviour have been communicating?",
      "Was the child overwhelmed, frightened, ashamed, angry, tired, dysregulated or seeking control?",
      "What did adults do to help the child feel safe and regulate?",
    ],
  },
  {
    key: "rights_based",
    name: "Rights-based recording",
    principle: "The child should be able to understand the decisions made about them.",
    reflectiveQuestions: [
      "Have we explained why a decision was made?",
      "Was the child given information in a way they could understand?",
      "Was the child involved as far as possible?",
      "Were the child's wishes and feelings recorded?",
    ],
  },
  {
    key: "anti_oppressive",
    name: "Anti-oppressive language",
    principle: "Language must not shame, blame, stigmatise, adultify, racialise, criminalise or reduce the child to their behaviour.",
    reflectiveQuestions: [
      "Does any word label the child rather than describe what happened?",
      "Could this language follow the child unfairly through their records?",
      "Are we holding the child more responsible than their age and situation warrant?",
    ],
  },
  {
    key: "safeguarding_clarity",
    name: "Safeguarding clarity",
    principle: "Writing with care must never dilute risk. Dignity and clarity sit together.",
    reflectiveQuestions: [
      "What is the actual risk, stated plainly?",
      "Who is worried, and what evidence supports the concern?",
      "What is known, what is unknown, and what is suspected?",
      "What action is needed now, and who is responsible?",
    ],
  },
  {
    key: "adult_accountability",
    name: "Adult accountability",
    principle: "The record should show what adults did, not only what the child did.",
    reflectiveQuestions: [
      "What did staff do to help, and what did they try?",
      "What worked, and what did not?",
      "What will adults do differently next time?",
      "Is the record too focused on the child's behaviour and not enough on the adult response?",
    ],
  },
  {
    key: "emotional_safety",
    name: "Emotional safety",
    principle: "A child should be able to read the record without being needlessly wounded by careless language.",
    reflectiveQuestions: [
      "Could any wording feel humiliating, blaming or dismissive?",
      "Is the tone respectful?",
      "Does the record balance honesty with care?",
    ],
  },
  {
    key: "restorative_repair",
    name: "Restorative repair",
    principle: "Records after incidents should support reflection, repair and relational safety.",
    reflectiveQuestions: [
      "Has the child been offered a repair conversation?",
      "Has staff reflected on the trigger, escalation and response?",
      "Is the next step relational, not only procedural?",
    ],
  },
];

export function nodeByKey(key: WritingNodeKey): WritingNode {
  return WRITING_NODES.find((n) => n.key === key)!;
}

export const WRITING_CORE_PRINCIPLE =
  "Write the record as evidence for professionals, but as memory for the child. Record risk clearly while preserving dignity, context, meaning, accountability and the child's voice.";

export const WRITING_DISCLAIMER =
  "Cara suggests — you decide. Review carefully: you remain responsible for the accuracy, professional judgement and final wording of this record. Cara never invents facts, never minimises risk, and never replaces your judgement.";

// Server-side LLM system prompt — used only when a provider is configured. The
// deterministic engine is the default; this enriches the rewrites when AI is on.
export const WRITING_SYSTEM_PROMPT =
  "You are Cara's practice-intelligence assistant for children's residential care. You help staff improve recording so it is factual, safeguarding-aware, trauma-informed, child-readable, anti-oppressive and emotionally safe. You must not invent facts. You must separate observation from interpretation. You must preserve risk clarity and never minimise a safeguarding concern. You support, not replace, professional judgement. Write as though the child may one day read the record and need to understand what happened, why adults acted, and how they were cared for. Where information is missing, say what is missing rather than filling the gap. Return only what is asked.";
