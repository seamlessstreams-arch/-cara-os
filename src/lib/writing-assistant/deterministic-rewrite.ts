// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — deterministic rewrite engine
//
// Real, local, rules-based rewriting for the four rewrite modes. NO AI / API /
// network calls — runs entirely on the existing care-recording rule banks, the
// safe auto-fix pass, and the deterministic Writing-to-the-Child engine. Works
// in production with no model key, £0/call, <5ms, 100% reproducible.
//
//   improve_writing       — fix spelling, UK English, punctuation, repetition,
//                           redundant openers; tidy spacing & sentence starts.
//   professionalise_record— the above + reframe blaming language to neutral,
//                           trauma-informed wording + replace informal slang;
//                           flags (never invents) vague phrases to expand.
//   simplify_language     — plain-English word swaps, drop redundant openers,
//                           split on semicolons and the safest long sentences.
//   write_to_child        — delegates to the deterministic Writing-to-Child
//                           engine's child-readable suggestion.
//
// Hard safeguarding contract (enforced by construction + tests):
//   • Never invents events, names, times, risks, actions, or detail.
//   • Only ever applies a closed allow-list of phrase swaps — no safeguarding
//     term is a swap key, so concerns are never softened or removed.
//   • Every output is a SUGGESTION for human review; nothing is auto-committed.
// ══════════════════════════════════════════════════════════════════════════════

import {
  runCareRules,
  VAGUE,
  REDUNDANT_OPENERS,
} from "./care-rules";
import { applyAutoFixes } from "./rewrite-engine";
import { reviewWritingToChild } from "@/lib/writing-to-child/writing-to-child-engine";
import type { WritingRecordType } from "@/lib/writing-to-child/types";

export type RewriteMode =
  | "improve_writing"
  | "professionalise_record"
  | "simplify_language"
  | "write_to_child";

export const REWRITE_MODES: RewriteMode[] = [
  "improve_writing",
  "professionalise_record",
  "simplify_language",
  "write_to_child",
];

export function isRewriteMode(id: string): id is RewriteMode {
  return (REWRITE_MODES as string[]).includes(id);
}

export interface DeterministicRewriteResult {
  mode: RewriteMode;
  /** The rewritten text — clean and ready to apply to the field. */
  text: string;
  /** Whether anything actually changed. */
  changed: boolean;
  /** Human-facing notes (reframes made, detail to add) — shown beside the preview. */
  notes: string[];
}

// ── Phrase matching / applying (word-boundary, case-preserving, offset-safe) ──

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Find every word-boundary, case-insensitive occurrence of a literal phrase. */
function matchPhrase(
  text: string,
  phrase: string,
): Array<{ start: number; end: number; matched: string }> {
  const re = new RegExp(`(^|[^a-z0-9])(${escapeRe(phrase)})([^a-z0-9]|$)`, "gi");
  const out: Array<{ start: number; end: number; matched: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const start = m.index + m[1].length;
    out.push({ start, end: start + m[2].length, matched: m[2] });
    re.lastIndex = m.index + 1; // allow adjacent matches
  }
  return out;
}

/** Preserve the original's leading capitalisation when substituting. */
function preserveCase(original: string, replacement: string): string {
  if (!original || !replacement) return replacement;
  const first = original[0];
  if (first === first.toUpperCase() && first !== first.toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Apply a closed bank of literal phrase → replacement swaps, back-to-front so
 * offsets stay valid, skipping overlaps. Returns the new text + which phrases
 * were actually swapped (for transparency notes).
 */
function applyBank(
  text: string,
  bank: Array<{ phrase: string; replacement: string }>,
): { text: string; applied: string[] } {
  const edits: Array<{ start: number; end: number; matched: string; replacement: string }> = [];
  for (const { phrase, replacement } of bank) {
    for (const m of matchPhrase(text, phrase)) {
      edits.push({
        start: m.start,
        end: m.end,
        matched: m.matched,
        replacement: preserveCase(m.matched, replacement),
      });
    }
  }
  edits.sort((a, b) => b.start - a.start); // back-to-front

  let result = text;
  const applied: string[] = [];
  let lastStart = Infinity;
  for (const e of edits) {
    if (e.end > lastStart) continue; // overlaps an already-applied (rightward) edit
    if (result.slice(e.start, e.end) !== e.matched) continue;
    result = result.slice(0, e.start) + e.replacement + result.slice(e.end);
    applied.push(e.matched);
    lastStart = e.start;
  }
  return { text: result, applied };
}

/** Safe cosmetic tidy: collapse spaces, no space before punctuation, capitalise sentence starts. */
function tidy(text: string): string {
  let t = text.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+([.,;:!?])/g, "$1");
  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_m, p1: string, p2: string) => p1 + p2.toUpperCase());
  return t.trim();
}

// ── Plain-English bank (simplify) ─────────────────────────────────────────────
// Longer phrases first so "in order to" wins before any single-word overlap.
const PLAIN_ENGLISH: Array<{ phrase: string; replacement: string }> = [
  { phrase: "at this moment in time", replacement: "now" },
  { phrase: "in the event that", replacement: "if" },
  { phrase: "due to the fact that", replacement: "because" },
  { phrase: "with regard to", replacement: "about" },
  { phrase: "in order to", replacement: "to" },
  { phrase: "a number of", replacement: "several" },
  { phrase: "the majority of", replacement: "most" },
  { phrase: "prior to", replacement: "before" },
  { phrase: "utilise", replacement: "use" },
  { phrase: "utilised", replacement: "used" },
  { phrase: "commence", replacement: "start" },
  { phrase: "commenced", replacement: "started" },
  { phrase: "subsequently", replacement: "then" },
  { phrase: "approximately", replacement: "about" },
  { phrase: "demonstrate", replacement: "show" },
  { phrase: "demonstrated", replacement: "showed" },
  { phrase: "endeavour", replacement: "try" },
  { phrase: "endeavoured", replacement: "tried" },
  { phrase: "facilitate", replacement: "help" },
  { phrase: "facilitated", replacement: "helped" },
  { phrase: "regarding", replacement: "about" },
  { phrase: "additional", replacement: "more" },
  { phrase: "sufficient", replacement: "enough" },
  { phrase: "requested", replacement: "asked for" },
  { phrase: "purchase", replacement: "buy" },
  { phrase: "purchased", replacement: "bought" },
  { phrase: "assist", replacement: "help" },
  { phrase: "assisted", replacement: "helped" },
  { phrase: "obtain", replacement: "get" },
  { phrase: "obtained", replacement: "got" },
  { phrase: "required", replacement: "needed" },
  { phrase: "informed", replacement: "told" },
];

/** Split the safest very-long sentences once, at ", and" / ", but". Conservative. */
function splitLongSentences(text: string): { text: string; remaining: number } {
  let remaining = 0;
  const out = text.replace(/[^.!?\n]+[.!?]?/g, (chunk) => {
    const trimmed = chunk.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (wordCount <= 26) return chunk;
    const leadWs = chunk.slice(0, chunk.length - chunk.trimStart().length);
    const connector = /,\s+(and|but)\s+/i.exec(trimmed);
    if (connector) {
      const left = trimmed.slice(0, connector.index).trim();
      const right = trimmed.slice(connector.index + connector[0].length).trim();
      if (
        left.split(/\s+/).filter(Boolean).length >= 5 &&
        right.split(/\s+/).filter(Boolean).length >= 4
      ) {
        return `${leadWs}${left}. ${right.charAt(0).toUpperCase()}${right.slice(1)}`;
      }
    }
    remaining++;
    return chunk;
  });
  return { text: out, remaining };
}

// ── The four rewrite modes ────────────────────────────────────────────────────

function improveWriting(text: string): DeterministicRewriteResult {
  const issues = runCareRules(text);
  const { text: fixed, applied } = applyAutoFixes(text, issues);
  const out = tidy(fixed);
  const notes: string[] = [];
  if (applied.length > 0) {
    notes.push(
      `Corrected ${applied.length} spelling, punctuation, or repetition issue${applied.length === 1 ? "" : "s"}.`,
    );
  }
  return { mode: "improve_writing", text: out, changed: out !== text.trim(), notes };
}

// Drop-in friendly, trauma-informed reframes of judgemental/blaming wording.
// Phrased to read naturally after "was/is/seemed" so the rewrite stays grammatical.
const PROFESSIONAL_REFRAME: Array<{ phrase: string; replacement: string }> = [
  { phrase: "attention seeking", replacement: "seeking connection or reassurance" },
  { phrase: "attention-seeking", replacement: "seeking connection or reassurance" },
  { phrase: "non-compliant", replacement: "finding it hard to meet this expectation" },
  { phrase: "non compliant", replacement: "finding it hard to meet this expectation" },
  { phrase: "failed to engage", replacement: "not yet able to engage" },
  { phrase: "refused to engage", replacement: "not yet able to engage" },
  { phrase: "manipulative", replacement: "trying to meet a need" },
  { phrase: "defiant", replacement: "saying no clearly" },
  { phrase: "lazy", replacement: "finding it hard to get started" },
];

function professionaliseRecord(text: string): DeterministicRewriteResult {
  // Build on the safe improvements (spelling, UK English, slang), then recast tone.
  const base = improveWriting(text).text;
  const reframed = applyBank(base, PROFESSIONAL_REFRAME);
  const out = tidy(reframed.text);

  const notes: string[] = [];
  for (const phrase of reframed.applied) {
    notes.push(
      `Reframed "${phrase}" to neutral, trauma-informed wording — check it still reflects what you observed.`,
    );
  }
  // Flag vague / non-observable phrasing for the author to expand — never invented.
  const vagueHits = new Set<string>();
  for (const { phrase } of VAGUE) {
    for (const m of matchPhrase(text, phrase)) vagueHits.add(m.matched.toLowerCase());
  }
  for (const v of vagueHits) {
    notes.push(`"${v}" is general — add the observable detail (what you saw, what was said, what staff did).`);
  }
  return { mode: "professionalise_record", text: out, changed: out !== text.trim(), notes };
}

function simplifyLanguage(text: string): DeterministicRewriteResult {
  // Safe corrections first (spelling, UK English, slang, apostrophes) — these
  // also make the text plainer — then the plain-English and structure passes.
  let t = improveWriting(text).text;
  const plain = applyBank(t, PLAIN_ENGLISH);
  t = plain.text;
  const openers = applyBank(t, REDUNDANT_OPENERS.map((phrase) => ({ phrase, replacement: "" })));
  t = openers.text;
  const semicolons = (t.match(/;/g) ?? []).length;
  t = t.replace(/\s*;\s*/g, ". "); // semicolons → sentence breaks
  const split = splitLongSentences(t);
  const out = tidy(split.text);

  const notes: string[] = [];
  if (plain.applied.length > 0) {
    notes.push(`Jargon simplified to plain English (${plain.applied.length} change${plain.applied.length === 1 ? "" : "s"}).`);
  }
  if (openers.applied.length > 0 || semicolons > 0) {
    notes.push("Long sentences shortened — wordy openers removed and semicolons split into separate sentences.");
  }
  if (split.remaining > 0) {
    notes.push(
      `${split.remaining} long sentence${split.remaining === 1 ? "" : "s"} could be split further for clarity.`,
    );
  }
  return { mode: "simplify_language", text: out, changed: out !== text.trim(), notes };
}

const WRITING_RECORD_TYPES: WritingRecordType[] = [
  "daily_log", "incident", "missing_episode", "key_work", "manager_oversight",
  "room_search", "education", "family_time", "health", "medication",
  "exploitation", "risk_assessment", "professional_meeting",
];

/** Coerce a free-form form record-type string to a known Writing record type. */
function coerceRecordType(rt?: string): WritingRecordType {
  return rt && (WRITING_RECORD_TYPES as string[]).includes(rt)
    ? (rt as WritingRecordType)
    : "daily_log";
}

function writeToChild(
  text: string,
  recordType?: string,
): DeterministicRewriteResult {
  const review = reviewWritingToChild({ recordType: coerceRecordType(recordType), rawText: text });
  const notes: string[] = [
    "Rewritten in warm, child-friendly language; jargon and blame removed, safeguarding meaning preserved, and no facts invented.",
  ];
  if (review.flaggedLanguage && review.flaggedLanguage.length > 0) {
    notes.push(
      `Reworded ${review.flaggedLanguage.length} clinical/institutional term${review.flaggedLanguage.length === 1 ? "" : "s"} a child could find cold or confusing.`,
    );
  }
  if (review.missingInformation && review.missingInformation.length > 0) {
    notes.push(...review.missingInformation.slice(0, 3).map((m) => `Still needed: ${m}`));
  }
  return {
    mode: "write_to_child",
    text: review.childReadableSuggestion,
    changed: review.childReadableSuggestion.trim() !== text.trim(),
    notes,
  };
}

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Deterministically rewrite `text` in the requested mode. Pure, synchronous,
 * no network — safe to call in any runtime with or without an AI key.
 */
export function deterministicRewrite(
  mode: RewriteMode,
  text: string,
  opts?: { recordType?: string },
): DeterministicRewriteResult {
  const input = (text ?? "").trim();
  if (input.length === 0) {
    return { mode, text: "", changed: false, notes: ["There is no text to rewrite yet."] };
  }
  switch (mode) {
    case "improve_writing":
      return improveWriting(input);
    case "professionalise_record":
      return professionaliseRecord(input);
    case "simplify_language":
      return simplifyLanguage(input);
    case "write_to_child":
      return writeToChild(input, opts?.recordType);
    default:
      return { mode, text: input, changed: false, notes: [] };
  }
}
