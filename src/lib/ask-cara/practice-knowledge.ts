// ══════════════════════════════════════════════════════════════════════════════
// Ask CARA — PRACTICE KNOWLEDGE
//
// Records tell CARA what happened. This gives it the practitioner's brain: the
// deterministic practice knowledge already loaded in the platform — the Cara
// Knowledge Base (PACE/DDP/CARE/Sanctuary·TCI/NVR/ACEs, the regs) and the
// framework modules (behaviour drivers, Contextual Safeguarding) — so it can
// answer "how do I…/what does this mean/what would good look like" questions
// the way an experienced worker would: grounded in a named model, never a guess,
// and always to think alongside — the decision and the record stay with the human.
//
// Pure + deterministic: no store, no network, no external AI. Returns null when
// the Knowledge Base has no confident match, so the engine can fall through to
// records rather than fabricate.
// ══════════════════════════════════════════════════════════════════════════════

import { KB_ALL_ENTRIES, KB_HEART, type KBEntry } from "@/lib/cara/knowledge-base";
import { behaviourDriverQuestions } from "@/lib/cara/practice-frameworks";
import { contextualSafeguardingQuestions } from "@/lib/cara/contextual-safeguarding";

const APPROVED = KB_ALL_ENTRIES.filter((e) => e.status === "approved");

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "of", "to", "in", "on", "for", "with", "as", "is", "are", "was", "were",
  "be", "been", "do", "does", "did", "how", "what", "when", "where", "why", "who", "which", "should", "could", "would",
  "can", "i", "we", "you", "they", "he", "she", "it", "my", "our", "your", "their", "me", "us", "them", "this", "that",
  "these", "those", "about", "into", "from", "at", "by", "so", "not", "no", "any", "some", "best", "way", "ways", "help",
  "need", "want", "get", "got", "make", "handle", "deal", "respond", "response", "good", "practice", "mean", "means",
  "understand", "know", "think", "tell", "explain", "advice", "guidance", "approach", "strategy", "one", "child", "young",
  "person", "people", "kid", "kids",
]);

// Practice-question markers — signals the user wants guidance/knowledge, not a
// record lookup. Deliberately distinct from record phrasings ("how many",
// "what's overdue", "list", "show me").
const PRACTICE_MARKERS = [
  "how do i", "how should i", "how can i", "how would you", "how do you", "what should i do", "what do i do",
  "what's the best", "whats the best", "best way", "best practice", "good practice", "what does", "what is", "what are",
  "explain", "help me understand", "help me think", "what would good", "what would you", "advice", "guidance on",
  "approach to", "strategy for", "how to", "trauma-informed", "trauma informed", "de-escalat", "deescalat",
  "co-regulat", "coregulat", "regulate", "attachment", "therapeutic", "restorative", "repair", "restraint reduction",
  "why might", "why does", "why is", "underneath", "what's driving", "whats driving", "make sense of",
];

export function looksLikePracticeQuestion(q: string): boolean {
  return PRACTICE_MARKERS.some((m) => q.includes(m));
}

function tokenize(s: string): string[] {
  return [...new Set(
    s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  )];
}

interface Scored { entry: KBEntry; score: number }

// Whole-word set for a blob — WORD-boundary matching, so "win" never matches
// "window" (the classic substring keyword-match trap).
function wordSet(s: string): Set<string> {
  return new Set(s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2));
}

// Distinctive framework names/phrases derived from the Knowledge Base — signals a
// knowledge question even without a "how do I" marker ("tell me about contextual
// safeguarding"). Multi-word tags/titles + a small set of distinctive acronyms.
const DISTINCTIVE_TERMS = ["pace", "ddp", "nvr", "tci", "aces", "sanctuary", "haltung"];

// Named practice frameworks that are LOADED knowledge but not KB entries — answered
// straight from the framework module. (The KB covers the therapeutic models; these
// cover named frameworks like Contextual Safeguarding.)
interface FrameworkTopic {
  triggers: string[];
  title: string;
  origin: string;
  summary: string;
  principles: string[];
  kind?: "contextual" | "behaviour";
}
const FRAMEWORK_TOPICS: FrameworkTopic[] = [
  {
    triggers: ["contextual safeguarding", "extra-familial", "extrafamilial", "harm outside the home", "beyond the front door", "peer-on-peer", "peer on peer"],
    title: "Contextual Safeguarding",
    origin: "Carlene Firmin",
    kind: "contextual",
    summary: "Young people are harmed in contexts beyond the family — peer groups, schools, neighbourhoods and online. Assessing and changing those contexts matters as much as direct work with the child; the aim is to make the spaces around a child safer, through guardianship rather than surveillance of the young person.",
    principles: ["Assess the contexts, not just the child", "Weigh extra-familial risk alongside familial", "Intervene to change unsafe contexts, not just the child's behaviour", "Guardianship, not surveillance"],
  },
];

const FRAMEWORK_PHRASES = [...new Set(APPROVED.flatMap((e) => [e.title, ...e.tags]))]
  .map((p) => p.toLowerCase())
  .filter((p) => p.trim().split(/\s+/).length >= 2);

export function mentionsFramework(q: string): boolean {
  const lq = ` ${q.toLowerCase()} `;
  if (FRAMEWORK_TOPICS.some((t) => t.triggers.some((tr) => lq.includes(tr)))) return true;
  if (FRAMEWORK_PHRASES.some((p) => lq.includes(p))) return true;
  return DISTINCTIVE_TERMS.some((t) => new RegExp(`\\b${t}\\b`).test(lq));
}

function scoreEntry(entry: KBEntry, tokens: string[], rawQ: string): number {
  let score = 0;
  // Multi-word tag phrase present verbatim = strongest signal.
  for (const tag of entry.tags) {
    const t = tag.toLowerCase();
    if (t.trim().split(/\s+/).length >= 2 && rawQ.includes(t)) score += 4;
  }
  const tagW = wordSet(entry.tags.join(" "));
  const titleW = wordSet(entry.title);
  const bodyW = wordSet(`${entry.summary} ${entry.principles.join(" ")} ${entry.why_for_cara}`);
  for (const tok of tokens) {
    if (tagW.has(tok)) score += 3;
    else if (titleW.has(tok)) score += 2;
    else if (bodyW.has(tok)) score += 1;
  }
  return score;
}

export interface PracticeGuidance {
  text: string;
  sources: { label: string; count: number }[];
  frameworks: string[];
}

/** Build a practitioner answer from a knowledge source (KB entry or framework module). */
function synth(
  src: { title: string; origin?: string; summary: string; principles: string[]; whyForCara?: string; related: string[]; kind?: "contextual" | "behaviour" },
  opts: { childName?: string } | undefined,
  rawQ: string,
): PracticeGuidance {
  const who = opts?.childName ? ` with ${opts.childName} in mind` : "";
  const lines: string[] = [];
  lines.push(`Here's how I'd think about that${who} — grounded in **${src.title}**${src.origin ? ` (${src.origin})` : ""}.`);
  lines.push("");
  if (src.summary) lines.push(src.summary);
  if (src.principles.length) {
    lines.push("", "In practice, that means holding onto:");
    for (const p of src.principles.slice(0, 6)) lines.push(`- ${p}`);
  }
  if (src.whyForCara) lines.push("", src.whyForCara);

  const blob = `${src.title} ${rawQ}`.toLowerCase();
  let qs: { question: string }[] = [];
  if (src.kind === "contextual" || /contextual|extra-familial|exploitation|cce|cse|county lines|\bpeer\b|community/.test(blob)) {
    qs = contextualSafeguardingQuestions();
  } else if (src.kind === "behaviour" || /behaviour|behavior|driver|dysregulat|trigger|attachment|trauma|pace|ddp|regulat|nvr/.test(blob)) {
    qs = behaviourDriverQuestions();
  }
  if (qs.length) {
    lines.push("", "A few questions to sit with:");
    for (const item of qs.slice(0, 3)) lines.push(`- ${item.question}`);
  }
  if (src.related.length) lines.push("", `Related in CARA's knowledge base: ${src.related.join(", ")}.`);

  const sources = [{ label: src.title, count: 1 }, ...src.related.map((t) => ({ label: t, count: 1 }))];
  return { text: lines.join("\n"), sources, frameworks: [src.title, ...src.related] };
}

/**
 * Answer a practice/knowledge question from the loaded frameworks + Knowledge Base.
 * Named framework modules first (Contextual Safeguarding…), then the KB. Returns
 * null when nothing matches with confidence (→ the engine falls through to records,
 * never invents).
 */
export function answerPracticeQuestion(question: string, opts?: { childName?: string }): PracticeGuidance | null {
  const rawQ = question.toLowerCase();

  const topic = FRAMEWORK_TOPICS.find((t) => t.triggers.some((tr) => rawQ.includes(tr)));
  if (topic) {
    return synth({ title: topic.title, origin: topic.origin, summary: topic.summary, principles: topic.principles, related: [], kind: topic.kind }, opts, rawQ);
  }

  const tokens = tokenize(question);
  if (tokens.length === 0) return null;
  const scored: Scored[] = APPROVED
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens, rawQ) }))
    .filter((s) => s.score >= 3)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) return null;

  const top = scored[0].entry;
  const also = scored.slice(1, 3).map((s) => s.entry).filter((e) => e.id !== top.id);
  return synth(
    { title: top.title, origin: top.origin, summary: top.summary, principles: top.principles, whyForCara: top.why_for_cara, related: also.map((e) => e.title) },
    opts,
    rawQ,
  );
}

/** Cara's core values — used to frame the practitioner stance where relevant. */
export function caraValueNames(): string[] {
  return KB_HEART.values.map((v) => v.name);
}
