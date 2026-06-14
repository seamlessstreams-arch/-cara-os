// ═══════════════════════════════════════════════════════════════════════════
// CARA — WRITING TO THE CHILD  ·  engine
//
// Deterministic-first review of a record for child-readability: flags
// institutional/shaming language, checks the four practice dimensions, runs
// record-type intelligence, scores out of 100 (explainably), and offers a
// child-conscious + a professional wording SUGGESTION. Never invents facts;
// names what is missing instead. Optional AI enrichment improves the two
// suggestions when a provider is configured — the deterministic path is the
// default and always present.
// ═══════════════════════════════════════════════════════════════════════════

import { scoreProfessionalLanguage } from "@/lib/recording-quality/recording-quality-engine";
import { detectLanguage, type LanguageBankEntry } from "./language-bank";
import { recordTypeIntelligence } from "./record-type-intelligence";
import { WRITING_NODES, WRITING_DISCLAIMER, WRITING_SYSTEM_PROMPT, nodeByKey } from "./knowledge";
import type {
  WritingToChildInput,
  WritingToChildReview,
  DimensionCheck,
  FlaggedTerm,
  ScoreBreakdown,
} from "./types";

// ── cue lexicons ──────────────────────────────────────────────────────────────
const CHILD_VOICE_CUES = ["said", "told", "stated", "shared", "asked", "wanted", "felt", "showed", "their words", "you said", "explained that they", "let us know"];
const ADULT_ACTION_CUES = ["staff offered", "staff supported", "staff gave", "staff stayed", "staff sat", "reassured", "we offered", "we gave", "we stayed", "supported", "listened", "checked", "offered", "gave space", "stayed with"];
const RISK_CUES = ["risk", "worried", "concern", "safeguarding", "disclosed", "harm", "unsafe", "exploit", "missing", "injur", "suicid", "self-harm", "self harm", "abuse", "weapon", "scared"];
const RISK_DISTINCTION_CUES = ["known", "unknown", "suspect", "evidence", "appears", "may", "might", "not yet clear", "believe", "reported"];
const ACTION_CUES = ["next", "will ", "plan", "agreed", "follow up", "follow-up", "tomorrow", "review", "going to", "referral", "notified", "escalat"];
const EXPLANATION_CUES = ["because", "so that", "to keep", "to help", "in order to", "the reason", "we explained", "explained why", "so you", "to make sure"];
const HUMAN_DETAIL_CUES = ["laughed", "smiled", "enjoyed", "proud", "favourite", "played", "hugged", "joked", "liked", "loved", "interested in", "looking forward"];
const TRAUMA_CONTEXT_CUES = ["before", "after", "earlier", "trigger", "overwhelmed", "frightened", "ashamed", "dysregulat", "tired", "hungry", "what had happened", "leading up", "build up", "build-up"];
const HEDGE_CUES = ["appeared", "seemed", "may have", "might have", "it is not yet clear", "we think", "possibly"];
const SPECIFIC_CUES = ["am", "pm", "o'clock", ":", "\"", "“", "quote"]; // times / direct quotes

function lc(s: string): string { return (s || "").toLowerCase(); }
function hasAny(hay: string, cues: string[]): boolean { return cues.some((c) => hay.includes(c)); }
function countAny(hay: string, cues: string[]): number { return cues.reduce((n, c) => (hay.includes(c) ? n + 1 : n), 0); }
function clamp(n: number, lo = 0, hi = 100): number { return Math.max(lo, Math.min(hi, Math.round(n))); }

// ── dimension checks ──────────────────────────────────────────────────────────

function childVoiceCheck(text: string, input: WritingToChildInput): DimensionCheck {
  const hay = lc(text);
  const quotes = input.childDirectQuotes ?? [];
  const feedback: string[] = [];
  let score = 30;
  if (quotes.length > 0) { score += 35; feedback.push("The child's own words are included — this keeps them visible in their own record."); }
  else if (hasAny(hay, ["said", "told", "stated", "shared"])) { score += 20; feedback.push("Some of what the child said is recorded; their exact words would strengthen it further."); }
  else feedback.push("The child's voice is hard to find. What did the child say — and if they did not speak, how did they communicate (silence, body language, avoidance)?");
  if (hasAny(hay, ["showed", "body language", "seemed", "appeared"])) { score += 20; feedback.push("How the child presented is recorded — good."); }
  else feedback.push("Record what the child showed through behaviour or presentation, not only words.");
  const needs = input.childCommunicationNeeds ?? [];
  if (needs.length > 0) {
    feedback.push(`Communication needs noted (${needs.join(", ")}). Record how the child was supported to be understood, and how their voice was captured in a way that fits these needs.`);
    score += 15;
  }
  return { score: clamp(score), feedback };
}

function riskClarityCheck(text: string, input: WritingToChildInput): DimensionCheck {
  const hay = lc(text + " " + (input.practitionerConcern ?? ""));
  const feedback: string[] = [];
  const riskPresent = hasAny(hay, RISK_CUES) || !!input.practitionerConcern || input.recordType === "exploitation" || input.recordType === "missing_episode";
  if (!riskPresent) {
    feedback.push("No safeguarding risk is indicated in this record. If a concern exists, state it plainly.");
    return { score: 90, feedback };
  }
  let score = 40;
  if (hasAny(hay, ["worried", "concern", "risk"])) { score += 15; feedback.push("The concern is named — good."); }
  else feedback.push("State plainly what the actual risk is and who is worried.");
  if (hasAny(hay, RISK_DISTINCTION_CUES)) { score += 20; feedback.push("There is some distinction between what is known and what is suspected — keep this clear."); }
  else feedback.push("Separate what is known, what is unknown and what is suspected.");
  if (hasAny(hay, ACTION_CUES)) { score += 25; feedback.push("Protective action / next steps are recorded."); }
  else feedback.push("Record what action is needed now and who is responsible.");
  if (input.recordType === "exploitation") {
    feedback.push("Record the power imbalance and any coercion clearly — a child cannot consent to their own exploitation. Do not imply consent.");
  }
  return { score: clamp(score), feedback };
}

function adultAccountabilityCheck(text: string): DimensionCheck {
  const hay = lc(text);
  const feedback: string[] = [];
  let score = 30;
  const hits = countAny(hay, ADULT_ACTION_CUES);
  if (hits >= 2) { score += 50; feedback.push("The adult response is visible — what staff did to help is recorded."); }
  else if (hits === 1) { score += 25; feedback.push("Some of the adult response is recorded; add what else staff tried and what worked."); }
  else feedback.push("This record focuses on the child. What did staff do to help — what did they try, what worked, what will they do differently?");
  if (hasAny(hay, ["differently", "next time", "learning", "reflect"])) { score += 20; feedback.push("Adult learning / reflection is included — good practice."); }
  else feedback.push("Add what adults learned or will do differently next time.");
  return { score: clamp(score), feedback };
}

function futureReaderCheck(text: string, flagged: LanguageBankEntry[]): DimensionCheck {
  const hay = lc(text);
  const feedback: string[] = [];
  let score = 30;
  if (hasAny(hay, EXPLANATION_CUES)) { score += 30; feedback.push("The record explains why adults acted — a future reader will understand."); }
  else feedback.push("Explain why adults acted, so the child (or the adult they become) can understand the decisions made about them.");
  if (hasAny(hay, HUMAN_DETAIL_CUES)) { score += 20; feedback.push("Human detail is present — this record is part of the child's life story, not only a risk log."); }
  else feedback.push("Include some human detail and dignity, not only risk and behaviour.");
  if (flagged.length === 0) { score += 20; feedback.push("No shaming or institutional language — the child could read this without being wounded by it."); }
  else feedback.push(`Some wording (${flagged.map((f) => f.label).slice(0, 3).join(", ")}) could feel blaming or institutional if the child read it later.`);
  return { score: clamp(score), feedback };
}

// ── scoring model (out of 100) ────────────────────────────────────────────────

function scoreFactualClarity(text: string): number {
  const hay = lc(text);
  let s = 50;
  if (hasAny(hay, SPECIFIC_CUES)) s += 25;            // times / quotes / specifics
  if (hasAny(hay, HEDGE_CUES)) s += 25;               // distinguishes appears/seemed from fact
  if (hay.length < 120) s -= 20;                       // very short → likely thin
  return clamp(s);
}

function scoreTraumaInformed(text: string): number {
  const hay = lc(text);
  let s = 35;
  if (hasAny(hay, TRAUMA_CONTEXT_CUES)) s += 35;       // context before behaviour
  if (hasAny(hay, ["calm", "space", "regulate", "reassur", "settle", "lower"])) s += 30; // regulation support
  return clamp(s);
}

function buildScoreBreakdown(args: {
  text: string;
  childVoice: number;
  riskClarity: number;
  adult: number;
  futureReader: number;
  flaggedCount: number;
  nextStepsPresent: boolean;
}): ScoreBreakdown {
  const lang = scoreProfessionalLanguage(args.text); // 0–100, reused primitive
  const dignity = clamp(lang - args.flaggedCount * 8); // penalise each flagged term
  const pct = (n: number, weight: number) => Math.round((n / 100) * weight);
  return {
    childVoice: pct(args.childVoice, 15),
    factualClarity: pct(scoreFactualClarity(args.text), 15),
    safeguardingClarity: pct(args.riskClarity, 15),
    traumaInformed: pct(scoreTraumaInformed(args.text), 15),
    dignityAndLanguage: pct(dignity, 15),
    adultAccountability: pct(args.adult, 10),
    futureReaderValue: pct(args.futureReader, 10),
    nextSteps: args.nextStepsPresent ? 5 : 0,
  };
}

// ── deterministic rewrite suggestions ─────────────────────────────────────────

/** Apply language-bank swaps to the practitioner's own text (first alternative). */
function applySwaps(text: string, entries: LanguageBankEntry[]): string {
  let out = text;
  for (const e of entries) {
    const re = new RegExp(e.match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, `[${e.alternatives[0]}]`);
  }
  return out;
}

function childReadableSuggestion(input: WritingToChildInput, swapped: string, missing: string[]): string {
  const quotes = (input.childDirectQuotes ?? []).filter(Boolean);
  const lines: string[] = [];
  lines.push("Suggested child-conscious wording for practitioner review (write this with, and for, the child):");
  lines.push("");
  if (quotes.length) lines.push(`You told us: ${quotes.map((q) => `"${q.replace(/^"|"$/g, "")}"`).join("; ")}.`);
  lines.push(`This is what happened, in plain words: ${swapped.trim() || "[describe what happened, simply and without blame]"}`);
  if (input.recordType === "incident" || input.recordType === "missing_episode" || input.recordType === "room_search") {
    lines.push("We were worried because we wanted you to be safe, and we did not yet understand everything. We wanted you to know you were not in trouble.");
  }
  lines.push("What adults did to help: [describe what staff did, calmly and kindly].");
  lines.push("What happens next: [describe the next step you agreed].");
  if (missing.length) lines.push(`Still to add for the child: ${missing.slice(0, 4).join("; ")}.`);
  return lines.join("\n");
}

function professionalSuggestion(input: WritingToChildInput, swapped: string, missing: string[]): string {
  const lines: string[] = [];
  lines.push(swapped.trim() || "[Re-record factually what was observed.]");
  lines.push("");
  lines.push("Separate clearly: what was observed (fact), what staff interpreted, any risk, and the next step.");
  if (missing.length) lines.push(`This professional record still needs: ${missing.slice(0, 5).join("; ")}.`);
  return lines.join("\n");
}

// ── main deterministic review ──────────────────────────────────────────────────

export function reviewWritingToChild(input: WritingToChildInput): WritingToChildReview {
  const text = input.rawText ?? "";
  const hay = lc(text);
  const flaggedEntries = detectLanguage(text);
  const flaggedLanguage: FlaggedTerm[] = flaggedEntries.map((e) => ({
    term: e.label,
    reason: e.reason + (e.preserveRisk ? " Keep the risk explicit — do not soften the concern away." : "") + (e.childWordsReminder ? " Use the child's own preferred words." : ""),
    suggestedAlternative: e.alternatives[0],
  }));

  const childVoice = childVoiceCheck(text, input);
  const riskClarity = riskClarityCheck(text, input);
  const adult = adultAccountabilityCheck(text);
  const flaggedForFuture = flaggedEntries.filter((e) => e.severity !== "low");
  const future = futureReaderCheck(text, flaggedForFuture);

  // Record-type intelligence → missing information + safeguarding notes.
  const rt = recordTypeIntelligence(input.recordType);
  const missingInformation: string[] = [];
  const safeguardingClarityNotes: string[] = [];
  for (const c of rt.checks) {
    if (!hasAny(hay, c.cues)) missingInformation.push(c.prompt);
  }
  if (riskClarity.score < 80) safeguardingClarityNotes.push(...riskClarity.feedback.filter((f) => !f.includes("good")));
  if (input.recordType === "missing_episode") safeguardingClarityNotes.push("Avoid 'returned safe and well' unless the welfare check, the child's presentation and what was offered are all recorded.");
  if (input.recordType === "exploitation") safeguardingClarityNotes.push("A child cannot consent to their own exploitation — record coercion and power imbalance, not 'relationship' or 'choice'.");

  const nextStepsPresent = hasAny(hay, ACTION_CUES);
  const scoreBreakdown = buildScoreBreakdown({
    text, childVoice: childVoice.score, riskClarity: riskClarity.score,
    adult: adult.score, futureReader: future.score, flaggedCount: flaggedEntries.length, nextStepsPresent,
  });
  const overallScore = clamp(
    Object.values(scoreBreakdown).reduce((a, b) => a + b, 0), 0, 100,
  );

  // Reflective questions — drawn from the most relevant knowledge nodes.
  const reflectiveQuestions: string[] = [];
  if (childVoice.score < 70) reflectiveQuestions.push(...nodeByKey("child_voice").reflectiveQuestions.slice(0, 2));
  if (flaggedLanguage.length) reflectiveQuestions.push(nodeByKey("anti_oppressive").reflectiveQuestions[0]);
  if (adult.score < 70) reflectiveQuestions.push(nodeByKey("adult_accountability").reflectiveQuestions[0]);
  if (future.score < 70) reflectiveQuestions.push(...nodeByKey("future_reader").reflectiveQuestions.slice(0, 2));
  if (!hasAny(hay, TRAUMA_CONTEXT_CUES)) reflectiveQuestions.push(nodeByKey("trauma_informed").reflectiveQuestions[0]);
  if (reflectiveQuestions.length === 0) reflectiveQuestions.push(nodeByKey("memory_identity").reflectiveQuestions[0]);

  // Rewrites (deterministic).
  const swapped = applySwaps(text, flaggedEntries);
  const childReadable = childReadableSuggestion(input, swapped, missingInformation);
  const professional = professionalSuggestion(input, swapped, missingInformation);

  // Strengths / concerns / summary.
  const strengths: string[] = [];
  if (childVoice.score >= 70) strengths.push("The child is visible — their voice or presentation is recorded.");
  if (adult.score >= 70) strengths.push("The adult response is recorded, not only the child's behaviour.");
  if (flaggedLanguage.length === 0) strengths.push("Language is respectful and non-institutional.");
  if (future.score >= 70) strengths.push("A future reader would understand what happened and why.");
  if (strengths.length === 0) strengths.push("There is a record to build on — the points below will make it child-conscious.");

  const concerns: string[] = [];
  if (flaggedLanguage.length) concerns.push(`${flaggedLanguage.length} word(s)/phrase(s) could shame, blame or institutionalise the child.`);
  if (childVoice.score < 70) concerns.push("The child's voice is thin or missing.");
  if (adult.score < 70) concerns.push("The adult response is under-recorded.");
  if (missingInformation.length) concerns.push(`${missingInformation.length} element(s) expected for a ${rt.label.toLowerCase()} record are not yet present.`);

  const summary = overallScore >= 80
    ? `Strong child-conscious record (${overallScore}/100). ${concerns.length ? "A few refinements below." : "Minor polish only."}`
    : overallScore >= 55
    ? `A reasonable record (${overallScore}/100) that would be more child-conscious with the changes below.`
    : `This record (${overallScore}/100) reads as system-led. The suggestions below help it become evidence for professionals and memory for the child.`;

  return {
    overallScore,
    summary,
    strengths,
    concerns,
    flaggedLanguage,
    reflectiveQuestions: [...new Set(reflectiveQuestions)],
    childReadableSuggestion: childReadable,
    professionalRecordingSuggestion: professional,
    safeguardingClarityNotes: [...new Set(safeguardingClarityNotes)],
    missingInformation,
    futureReaderCheck: future,
    adultAccountabilityCheck: adult,
    childVoiceCheck: childVoice,
    riskClarityCheck: riskClarity,
    scoreBreakdown,
    generatedBy: "deterministic",
    disclaimer: WRITING_DISCLAIMER,
  };
}

// ── optional AI enrichment of the two suggestions ─────────────────────────────
// Default is deterministic. When a provider is configured, the LLM improves the
// child-readable + professional wording; on any failure we keep the
// deterministic review. Cara never invents facts — the prompt forbids it.

export async function enrichWritingReview(input: WritingToChildInput): Promise<WritingToChildReview> {
  const base = reviewWritingToChild(input);
  try {
    const { generateText } = await import("@/lib/cara/cara-provider");
    const userPrompt = [
      `Record type: ${input.recordType}.`,
      input.childAge != null ? `Child age: ${input.childAge}.` : "",
      (input.childCommunicationNeeds?.length ? `Communication needs: ${input.childCommunicationNeeds.join(", ")}.` : ""),
      (input.knownFacts?.length ? `Known facts (do not go beyond these): ${input.knownFacts.join("; ")}.` : ""),
      (input.childDirectQuotes?.length ? `The child's exact words: ${input.childDirectQuotes.map((q) => `"${q}"`).join("; ")}.` : ""),
      input.practitionerConcern ? `Practitioner concern: ${input.practitionerConcern}.` : "",
      "",
      "The staff member's draft record:",
      input.rawText,
      "",
      "Rewrite this in two ways WITHOUT inventing any fact beyond the draft and known facts. If something is missing, leave a clear [bracketed] prompt rather than filling it.",
      "1) child_readable: warm, second-person ('you'), explains why adults acted, preserves dignity and any risk, suitable to share with the child.",
      "2) professional: relational but professional third-person, separates fact / interpretation / risk / next steps, preserves safeguarding clarity.",
      'Return strict JSON: {"child_readable": "...", "professional": "..."}',
    ].filter(Boolean).join("\n");
    const ai = await generateText({
      systemPrompt: WRITING_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.3,
      maxOutputTokens: 1200,
      expectJson: true,
      feature: "writing_to_child",
    });
    if (ai.llmUsed && ai.text.trim()) {
      const parsed = JSON.parse(ai.text) as { child_readable?: string; professional?: string };
      if (parsed.child_readable || parsed.professional) {
        return {
          ...base,
          childReadableSuggestion: parsed.child_readable
            ? `Suggested child-conscious wording for practitioner review:\n\n${parsed.child_readable.trim()}`
            : base.childReadableSuggestion,
          professionalRecordingSuggestion: parsed.professional?.trim() || base.professionalRecordingSuggestion,
          generatedBy: "ai",
        };
      }
    }
  } catch {
    // keep deterministic review
  }
  return base;
}

export { WRITING_NODES, WRITING_DISCLAIMER };
