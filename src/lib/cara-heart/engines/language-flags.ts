// ══════════════════════════════════════════════════════════════════════════════
// CARA HEART — Blame language detection + reflective alternatives
//
// Flags phrases that reduce a child's behaviour to blame or character rather
// than communication. Does NOT ban these words — prompts reflective rewriting.
// ══════════════════════════════════════════════════════════════════════════════

import type { FlaggedLanguageItem } from "../types";

interface LanguageFlag {
  pattern: string | RegExp;
  concern: string;
  reflectivePrompt: string;
  alternativeLanguageSuggestion: string;
}

export const BLAME_LANGUAGE_FLAGS: LanguageFlag[] = [
  {
    pattern: "attention seeking",
    concern:
      "This phrase may reduce the child's behaviour to a negative character trait rather than a communication of need.",
    reflectivePrompt:
      "What need, feeling, fear or relational signal may the child have been communicating through this behaviour?",
    alternativeLanguageSuggestion:
      "The child appeared to seek adult attention and reassurance. Staff considered whether this may have been linked to anxiety, feeling unsettled, or needing connection.",
  },
  {
    pattern: "manipulative",
    concern:
      "Describing a child as manipulative attributes adult-level intent and can mask genuine need or trauma-driven behaviour.",
    reflectivePrompt:
      "What might the child have needed in this moment? Is there a pattern of unmet need that drives this behaviour?",
    alternativeLanguageSuggestion:
      "The child used strategies to influence the situation. Staff explored what the child may have been trying to achieve and what need this may indicate.",
  },
  {
    pattern: /kicked off/i,
    concern:
      "This informal phrase lacks the professional precision needed to understand or learn from the incident.",
    reflectivePrompt:
      "What did the escalation look like, stage by stage? What was happening for the child before and during this?",
    alternativeLanguageSuggestion:
      "The child became significantly distressed and dysregulated. Staff observed escalating distress before the behaviour reached its peak.",
  },
  {
    pattern: /played up/i,
    concern:
      "This phrase implies deliberate misbehaviour and may not reflect what was actually happening for the child.",
    reflectivePrompt:
      "What triggers, stressors or unmet needs may have contributed to the child's behaviour at this time?",
    alternativeLanguageSuggestion:
      "The child's behaviour became more difficult to manage. Staff considered what may have been contributing to this.",
  },
  {
    pattern: "bad behaviour",
    concern:
      "Labelling behaviour as 'bad' does not help staff understand, predict or respond therapeutically to it.",
    reflectivePrompt:
      "What function might this behaviour serve for the child? What need or distress might it communicate?",
    alternativeLanguageSuggestion:
      "The child displayed behaviour that was challenging and required a supportive response from staff.",
  },
  {
    pattern: /no remorse/i,
    concern:
      "Children who have experienced trauma may not express remorse in expected ways. Noting absence of remorse without context may not be accurate.",
    reflectivePrompt:
      "Is the child developmentally or emotionally able to show remorse in the way adults might expect? What does their presentation tell us?",
    alternativeLanguageSuggestion:
      "Following the incident, the child did not express remorse. Staff considered whether this may be linked to shame, fear, trauma response or developmental stage.",
  },
  {
    pattern: /refused for no reason/i,
    concern:
      "Behaviour rarely has no reason. Noting refusal 'for no reason' closes down professional curiosity.",
    reflectivePrompt:
      "What might have been underlying this refusal? What was happening for the child before and around this moment?",
    alternativeLanguageSuggestion:
      "The child refused. The reason was not immediately clear to staff, who noted this for further exploration in key work.",
  },
  {
    pattern: /non.?compliant/i,
    concern:
      "Non-compliance as a label focuses on adult expectation rather than the child's experience or communication.",
    reflectivePrompt:
      "What might the child's refusal to comply have been communicating? Was the expectation appropriate to the child's current state?",
    alternativeLanguageSuggestion:
      "The child was unable to follow the request at this time. Staff explored what may have been making this difficult.",
  },
  {
    pattern: "deliberately caused trouble",
    concern:
      "Attributing deliberate intent without evidence can lead to punitive rather than therapeutic responses.",
    reflectivePrompt:
      "What evidence is there that this was deliberate? Could distress, anxiety or dysregulation explain this behaviour?",
    alternativeLanguageSuggestion:
      "The child's behaviour caused disruption. It was unclear whether this was intentional, and staff explored possible underlying factors.",
  },
  {
    pattern: "just wanted their own way",
    concern:
      "This dismisses the child's perspective without curiosity about what they may have needed or been communicating.",
    reflectivePrompt:
      "What was the child seeking? Was there a legitimate need, fear or desire that staff could explore and validate?",
    alternativeLanguageSuggestion:
      "The child was strongly insistent about what they wanted. Staff considered whether there was an underlying need or communication behind this.",
  },
  {
    pattern: "aggressive for no reason",
    concern:
      "Aggression rarely emerges without antecedent. Noting 'no reason' closes down learning about triggers and prevention.",
    reflectivePrompt:
      "What was happening for the child in the hours and minutes before this? What environmental, relational or internal triggers may have contributed?",
    alternativeLanguageSuggestion:
      "The child became aggressive. The trigger was not immediately obvious to staff, who recorded their observations for review.",
  },
  {
    pattern: /chose to behave (like this|this way)/i,
    concern:
      "Children who have experienced trauma, adversity or neurodevelopmental differences may have limited capacity to 'choose' their behaviour in the way this phrase implies.",
    reflectivePrompt:
      "What capacity did this child have to regulate their behaviour in this moment? What factors may have reduced their ability to make a different choice?",
    alternativeLanguageSuggestion:
      "The child's behaviour became difficult to manage. Staff considered what may have reduced the child's ability to self-regulate in this situation.",
  },
  {
    pattern: "lied",
    concern:
      "Children may give inaccurate accounts for many reasons including fear, shame, cognitive difficulties or learned self-protection.",
    reflectivePrompt:
      "What might have led the child to give this account? Is there a safer or more curious interpretation?",
    alternativeLanguageSuggestion:
      "The child's account differed from staff observations. Staff considered what might have led to this, including possible fear, shame, misunderstanding or distress.",
  },
  {
    pattern: "kicking off",
    concern:
      "Informal language that lacks the professional precision needed to understand or respond to escalation.",
    reflectivePrompt:
      "Describe the escalation: what was observed, what preceded it, and what the child may have been communicating.",
    alternativeLanguageSuggestion:
      "The child became significantly distressed and their behaviour escalated.",
  },
];

/**
 * Whole-word/phrase match for a literal string pattern. Using word boundaries
 * (not a raw substring) prevents false positives like "lied" firing inside
 * "applied", "bullied", "complied", or "manipulative" inside "manipulatives"
 * (maths). The phrases in this bank are all real words/phrases, never prefixes.
 */
function stringPatternMatches(text: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

/**
 * Scans text for blame-based or professionally imprecise language.
 * Returns only the flags that matched.
 */
export function scanForBlameLanguage(text: string): FlaggedLanguageItem[] {
  if (!text) return [];
  const results: FlaggedLanguageItem[] = [];

  for (const flag of BLAME_LANGUAGE_FLAGS) {
    const matched =
      typeof flag.pattern === "string"
        ? stringPatternMatches(text, flag.pattern)
        : flag.pattern.test(text);

    if (matched) {
      results.push({
        phrase: typeof flag.pattern === "string" ? flag.pattern : flag.pattern.source,
        concern: flag.concern,
        reflectivePrompt: flag.reflectivePrompt,
        alternativeLanguageSuggestion: flag.alternativeLanguageSuggestion,
      });
    }
  }

  return results;
}

/** Returns just the matched phrase strings (for quick checks). */
export function flaggedPhrases(text: string): string[] {
  return scanForBlameLanguage(text).map((f) => f.phrase);
}
