// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — deterministic care-recording rules
//
// Positioned detectors over record text. Each returns WritingIssue[] with exact
// character offsets so the UI can underline inline. Pure + deterministic (ids
// derived from type+offset, no randomness). Reuses the established US→UK and
// blame-reframe banks so Cara has one voice.
// ══════════════════════════════════════════════════════════════════════════════

import type { WritingIssue, WritingMode, WritingSuggestion } from "./types";
import { scanForBannedPhrases } from "@/lib/oversight/templates/child-addressed-templates";

const id = (type: string, start: number, end: number, tag = "") => `wa-${type}-${start}-${end}${tag ? "-" + tag : ""}`;

function sug(replacementText: string, label: string, rationale: string, preservesMeaning: boolean): WritingSuggestion[] {
  return [{ id: `s-${label.toLowerCase().replace(/\s+/g, "-")}`, replacementText, label, rationale, preservesMeaning }];
}

/** Find every (word-boundary, case-insensitive) match of a literal phrase. */
function matchAll(text: string, phrase: string): Array<{ start: number; end: number; matched: string }> {
  const re = new RegExp(`(^|[^a-z0-9])(${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})([^a-z0-9]|$)`, "gi");
  const out: Array<{ start: number; end: number; matched: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const start = m.index + m[1].length;
    out.push({ start, end: start + m[2].length, matched: m[2] });
    re.lastIndex = m.index + 1; // allow overlapping / adjacent matches
  }
  return out;
}

// ─── Banks ──────────────────────────────────────────────────────────────────

// Vague / non-observable language → prompt for observable detail (author must write it).
const VAGUE: Array<{ phrase: string }> = [
  { phrase: "kicked off" },
  { phrase: "was naughty" },
  { phrase: "was aggressive" },
  { phrase: "played up" },
  { phrase: "refused to listen" },
  { phrase: "was fine" },
  { phrase: "settled eventually" },
  { phrase: "had a meltdown" },
  { phrase: "was being difficult" },
  { phrase: "normal day" },
  { phrase: "nothing to report" },
  { phrase: "challenging behaviour" },
];

// Subjective / blaming → neutral, trauma-informed reframe (offer wording).
const BLAME: Array<{ phrase: string; replacement: string }> = [
  { phrase: "manipulative", replacement: "communicating an unmet need" },
  { phrase: "attention seeking", replacement: "seeking connection or reassurance" },
  { phrase: "attention-seeking", replacement: "seeking connection or reassurance" },
  { phrase: "non-compliant", replacement: "has not been able to follow this expectation" },
  { phrase: "non compliant", replacement: "has not been able to follow this expectation" },
  { phrase: "failed to engage", replacement: "has not been able to engage at this time" },
  { phrase: "refused to engage", replacement: "has not been able to engage at this time" },
];

// American → UK spelling (safe like-for-like).
const US_UK: Array<{ phrase: string; replacement: string }> = [
  { phrase: "behavior", replacement: "behaviour" },
  { phrase: "behaviors", replacement: "behaviours" },
  { phrase: "organization", replacement: "organisation" },
  { phrase: "recognize", replacement: "recognise" },
  { phrase: "recognized", replacement: "recognised" },
  { phrase: "apologize", replacement: "apologise" },
  { phrase: "analyze", replacement: "analyse" },
  { phrase: "color", replacement: "colour" },
  { phrase: "favorite", replacement: "favourite" },
  { phrase: "neighbor", replacement: "neighbour" },
  { phrase: "center", replacement: "centre" },
  { phrase: "pediatric", replacement: "paediatric" },
  { phrase: "defense", replacement: "defence" },
];

// Missing-apostrophe contractions (safe fix).
const CONTRACTIONS: Array<{ phrase: string; replacement: string }> = [
  { phrase: "didnt", replacement: "didn't" },
  { phrase: "cant", replacement: "can't" },
  { phrase: "wont", replacement: "won't" },
  { phrase: "dont", replacement: "don't" },
  { phrase: "isnt", replacement: "isn't" },
  { phrase: "wasnt", replacement: "wasn't" },
  { phrase: "werent", replacement: "weren't" },
  { phrase: "couldnt", replacement: "couldn't" },
  { phrase: "wouldnt", replacement: "wouldn't" },
  { phrase: "shouldnt", replacement: "shouldn't" },
  { phrase: "hasnt", replacement: "hasn't" },
  { phrase: "havent", replacement: "haven't" },
  { phrase: "theyre", replacement: "they're" },
  { phrase: "youre", replacement: "you're" },
];

// Informal / text-speak (offer professional wording).
const SLANG: Array<{ phrase: string; replacement: string }> = [
  { phrase: "gonna", replacement: "going to" },
  { phrase: "wanna", replacement: "want to" },
  { phrase: "gotta", replacement: "have to" },
  { phrase: "kinda", replacement: "kind of" },
  { phrase: "cos", replacement: "because" },
  { phrase: "coz", replacement: "because" },
];

const REDUNDANT_OPENERS = [
  "it is important to note that",
  "it should be noted that",
  "it is worth noting that",
];

// ─── Detectors ────────────────────────────────────────────────────────────────

function detectVague(text: string): WritingIssue[] {
  const out: WritingIssue[] = [];
  for (const { phrase } of VAGUE) {
    for (const { start, end, matched } of matchAll(text, phrase)) {
      out.push({
        id: id("safeguarding-quality", start, end),
        type: "safeguarding-quality",
        severity: "medium",
        start,
        end,
        originalText: matched,
        message: "This may read as vague — describe what you observed.",
        explanation:
          "Records evidence care best with observable, factual detail: what happened, what the child said, what staff said and did, and what helped. Replace the general phrase with what you actually saw.",
        suggestions: sug("", "Describe what you observed", "e.g. what triggered it, what was said, what staff did, and how the child was supported.", false),
        source: "rule-engine",
        confidence: 0.7,
        requiresHumanJudgement: true,
      });
    }
  }
  return out;
}

function detectBlame(text: string): WritingIssue[] {
  const out: WritingIssue[] = [];
  for (const { phrase, replacement } of BLAME) {
    for (const { start, end, matched } of matchAll(text, phrase)) {
      out.push({
        id: id("tone", start, end),
        type: "tone",
        severity: "medium",
        start,
        end,
        originalText: matched,
        message: "This may read as subjective or blaming.",
        explanation:
          "Separate the child from the behaviour. Behaviour communicates need — neutral, trauma-informed wording is fairer to the child and reads better professionally.",
        suggestions: sug(replacement, "Use neutral wording", "Reframes the behaviour as communication rather than a judgement. Check it still reflects what you mean.", false),
        source: "rule-engine",
        confidence: 0.72,
        requiresHumanJudgement: true,
      });
    }
  }
  return out;
}

function literalRule(
  text: string,
  bank: Array<{ phrase: string; replacement: string }>,
  type: WritingIssue["type"],
  severity: WritingIssue["severity"],
  message: string,
  explanation: string,
): WritingIssue[] {
  const out: WritingIssue[] = [];
  for (const { phrase, replacement } of bank) {
    for (const { start, end, matched } of matchAll(text, phrase)) {
      // Preserve capitalisation of the original first letter.
      const rep = matched[0] === matched[0].toUpperCase() ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
      out.push({
        id: id(type, start, end),
        type,
        severity,
        start,
        end,
        originalText: matched,
        message,
        explanation,
        suggestions: sug(rep, `Change to "${rep}"`, "A safe, like-for-like correction that does not change the meaning.", true),
        source: "rule-engine",
        confidence: 0.95,
        requiresHumanJudgement: false,
      });
    }
  }
  return out;
}

function detectRepeatedWords(text: string): WritingIssue[] {
  const out: WritingIssue[] = [];
  const re = /\b(\w+)(\s+)(\1)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[1].length < 2) continue; // skip "a a" noise
    const start = m.index;
    const end = start + m[0].length;
    out.push({
      id: id("grammar", start, end),
      type: "grammar",
      severity: "low",
      start,
      end,
      originalText: m[0],
      message: "Repeated word.",
      explanation: "The same word appears twice in a row.",
      suggestions: sug(m[1], `Remove the repeat`, "Keeps a single occurrence.", true),
      source: "rule-engine",
      confidence: 0.9,
      requiresHumanJudgement: false,
    });
  }
  return out;
}

function detectRedundantOpeners(text: string): WritingIssue[] {
  const out: WritingIssue[] = [];
  for (const opener of REDUNDANT_OPENERS) {
    for (const { start, end, matched } of matchAll(text, opener)) {
      out.push({
        id: id("clarity", start, end),
        type: "clarity",
        severity: "low",
        start,
        end,
        originalText: matched,
        message: "This opener can usually be removed.",
        explanation: "Phrases like this add length without meaning. The sentence is usually clearer without it.",
        suggestions: sug("", "Remove this phrase", "Tightens the sentence; check it still reads correctly.", true),
        source: "rule-engine",
        confidence: 0.6,
        requiresHumanJudgement: false,
      });
    }
  }
  return out;
}

function detectLongSentences(text: string): WritingIssue[] {
  const out: WritingIssue[] = [];
  const re = /[^.!?\n]+[.!?]?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const sentence = m[0];
    const words = sentence.trim().split(/\s+/).filter(Boolean).length;
    if (words >= 40) {
      const start = m.index + (sentence.length - sentence.trimStart().length);
      const end = m.index + sentence.trimEnd().length;
      out.push({
        id: id("clarity", start, end, "long"),
        type: "clarity",
        severity: "low",
        start,
        end,
        originalText: sentence.trim().slice(0, 60) + (sentence.trim().length > 60 ? "…" : ""),
        message: "This sentence is long — consider splitting it.",
        explanation: `This sentence is about ${words} words. Shorter sentences are clearer and easier for the reader (including the child) to follow.`,
        suggestions: sug("", "Split into shorter sentences", "Improves readability without changing meaning.", false),
        source: "rule-engine",
        confidence: 0.55,
        requiresHumanJudgement: true,
      });
    }
  }
  return out;
}

function detectChildFacing(text: string, mode: WritingMode): WritingIssue[] {
  if (mode !== "writing-to-child") return [];
  const out: WritingIssue[] = [];
  for (const phrase of scanForBannedPhrases(text)) {
    for (const { start, end, matched } of matchAll(text, phrase)) {
      out.push({
        id: id("writing-to-child", start, end),
        type: "writing-to-child",
        severity: "high",
        start,
        end,
        originalText: matched,
        message: "This wording may not be right in a record the child could read.",
        explanation:
          "In a child-facing record, avoid clinical, procedural or blaming language. Write warmly and honestly, as if the child may read this when they are older.",
        suggestions: sug("", "Reword warmly for the child", "Keep it factual and kind; avoid jargon and blame.", false),
        source: "rule-engine",
        confidence: 0.7,
        requiresHumanJudgement: true,
      });
    }
  }
  return out;
}

/** Run all deterministic care rules and return de-duplicated, ordered issues. */
export function runCareRules(text: string, mode: WritingMode = "standard"): WritingIssue[] {
  const all: WritingIssue[] = [
    ...detectVague(text),
    ...detectBlame(text),
    ...literalRule(text, US_UK, "spelling", "low", "This looks like US spelling.", "Cara uses UK English throughout."),
    ...literalRule(text, CONTRACTIONS, "punctuation", "low", "Missing apostrophe.", "This contraction needs an apostrophe."),
    ...literalRule(text, SLANG, "professional-language", "low", "This reads as informal.", "Records read better in plain professional English."),
    ...detectRepeatedWords(text),
    ...detectRedundantOpeners(text),
    ...detectLongSentences(text),
    ...detectChildFacing(text, mode),
  ];

  // De-dupe overlapping issues at the same span, preferring higher severity.
  const sevRank = { high: 0, medium: 1, low: 2 } as const;
  const byKey = new Map<string, WritingIssue>();
  for (const issue of all) {
    const key = `${issue.start}-${issue.end}`;
    const existing = byKey.get(key);
    if (!existing || sevRank[issue.severity] < sevRank[existing.severity]) byKey.set(key, issue);
  }
  return [...byKey.values()].sort((a, b) => a.start - b.start || a.end - b.end);
}
