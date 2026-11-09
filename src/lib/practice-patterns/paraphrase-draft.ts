// ══════════════════════════════════════════════════════════════════════════════
// Cara — Optional AI paraphrase draft (Phase 4e)
//
// Gives the reviewer a first draft of a pattern in Cara's own words. It is a
// DRAFT: saved on the candidate for the reviewer to edit. Nothing is approved
// or published by it; approval stays a named human's decision, made in their
// own final wording (4d).
//
// Every model call goes through the governed AI gateway: sensitivity
// classification, redaction, the provider risk register, cost caps, the
// response safety scan and, because practitioner text is untrusted, the
// prompt-injection guard that wraps it as content rather than instructions.
// Only the submitters' notes and the tags are sent: no link, no author name,
// no submitter identity.
//
// With no AI (no key, the kill-switch on, content too sensitive to send, a
// withheld or unreadable response) the deterministic draft is returned,
// built from the submitter's own note. The feature degrades; it never fails.
// ══════════════════════════════════════════════════════════════════════════════

import {
  invokeAiGateway,
  type AiGatewayDeps,
  type AiGatewayIdentity,
  type AiGatewayMethod,
} from "@/lib/cara/ai-gateway/ai-gateway";
import { primaryNote, type PatternCandidate, type PatternDraft } from "./intake-pipeline";
import { containsDirectQuotation } from "./review-queue";

export const DRAFT_SYSTEM_PROMPT = [
  "You help the registered manager of a children's residential home in England turn one practitioner's published insight, as summarised by managers, into a practice pattern for the home's own library.",
  "Rules:",
  "- Write entirely in your own words. Never quote, and never reproduce sentences from the content.",
  "- This is one practitioner's view. Do not present it as legal advice, as a regulation's requirement, or as Ofsted's position.",
  "- Do not name any person, child, home or organisation. Write role titles in lower case (registered manager, responsible individual).",
  "- Write the name in sentence case: capitalise only its first word.",
  '- Reply with JSON only, in this shape: {"name": string, "summary": string, "key_questions": string[], "evidence_indicators": string[], "failure_modes": string[]}.',
  "- key_questions: 2 to 4. evidence_indicators: up to 4. failure_modes: up to 3.",
].join("\n");

/** What leaves the building: the notes and the tags, nothing that identifies anyone. */
export function buildDraftPrompt(c: PatternCandidate): string {
  return [
    `Practice domains: ${c.domains.length > 0 ? c.domains.join(", ") : "none tagged"}`,
    ...(c.flags.length > 0 ? [`Reviewer flags: ${c.flags.join(", ")}`] : []),
    "Manager notes on the practitioner's insight:",
    ...c.submissions.map((s, i) => `Note ${i + 1}: ${s.note}`),
  ].join("\n");
}

// ── The deterministic draft ───────────────────────────────────────────────────

function truncateWords(text: string, max: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length <= max ? words.join(" ") : `${words.slice(0, max).join(" ")}…`;
}

function truncateChars(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function buildDeterministicDraft(c: PatternCandidate, now: string, flags: readonly string[] = []): PatternDraft {
  const note = primaryNote(c).trim();
  const firstSentence = (note.split(/(?<=[.!?])\s+/)[0] ?? note).replace(/[.!?]+$/, "");
  const name = truncateWords(firstSentence, 10);
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    summary: truncateChars(note, 600),
    key_questions: [],
    evidence_indicators: [],
    failure_modes: [],
    method: "deterministic",
    generated_at: now,
    flags: [...new Set(["reviewer_to_write_in_own_words", ...flags])],
  };
}

// ── Reading and checking an AI draft ──────────────────────────────────────────

interface DraftFields {
  name: string;
  summary: string;
  key_questions: string[];
  evidence_indicators: string[];
  failure_modes: string[];
}

function stringList(value: unknown, max: number): string[] | null {
  if (!Array.isArray(value) || !value.every((s) => typeof s === "string")) return null;
  return (value as string[]).map((s) => s.trim()).filter(Boolean).slice(0, max);
}

/** Parse the model's JSON, tolerating a code fence. Anything off-shape is null. */
export function parseDraftJson(output: string): DraftFields | null {
  const text = output.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (typeof o.name !== "string" || typeof o.summary !== "string") return null;
  const keyQuestions = stringList(o.key_questions, 4);
  const evidence = stringList(o.evidence_indicators ?? [], 4);
  const failures = stringList(o.failure_modes ?? [], 3);
  const name = o.name.trim().slice(0, 140);
  const summary = o.summary.trim().slice(0, 1200);
  if (!keyQuestions || keyQuestions.length === 0 || !evidence || !failures || !name || summary.length < 20) return null;
  return { name, summary, key_questions: keyQuestions, evidence_indicators: evidence, failure_modes: failures };
}

/** A shared run of this many words or more is copying, not paraphrase. */
export const VERBATIM_RUN_WORDS = 8;

function wordList(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Length of the longest run of consecutive words two texts share. */
export function longestSharedRun(a: string, b: string): number {
  const x = wordList(a);
  const y = wordList(b);
  let best = 0;
  let prev = new Array<number>(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i += 1) {
    const cur = new Array<number>(y.length + 1).fill(0);
    for (let j = 1; j <= y.length; j += 1) {
      if (x[i - 1] === y[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}

export function copiesSource(drafts: readonly string[], sources: readonly string[], minWords = VERBATIM_RUN_WORDS): boolean {
  return drafts.some((d) => sources.some((s) => longestSharedRun(d, s) >= minWords));
}

// ── The draft ─────────────────────────────────────────────────────────────────

export interface DraftOutcome {
  draft: PatternDraft;
  ai: {
    method: AiGatewayMethod;
    llmUsed: boolean;
    refusedReason?: string;
    promptInjectionFlagged: boolean;
    responseBlocked: boolean;
  };
}

/**
 * Ask the gateway for a draft; fall back to the deterministic draft whenever
 * a model did not produce a usable, unblocked answer. `overrides` reach the
 * gateway's injectable effects (tests only).
 */
export async function draftParaphrase(
  candidate: PatternCandidate,
  identity: AiGatewayIdentity,
  now: string,
  overrides: Partial<AiGatewayDeps> = {},
): Promise<DraftOutcome> {
  const res = await invokeAiGateway(
    {
      purpose: "Draft a paraphrased practice pattern from a practitioner's insight, for a named manager to review and edit",
      feature: "practice_patterns.paraphrase_draft",
      systemPrompt: DRAFT_SYSTEM_PROMPT,
      userPrompt: buildDraftPrompt(candidate),
      identity,
      taskType: "training_material_generation",
      expectJson: true,
      temperature: 0.2,
      maxOutputTokens: 900,
    },
    overrides,
  );

  const ai: DraftOutcome["ai"] = {
    method: res.method,
    llmUsed: res.llmUsed,
    ...(res.refusedReason ? { refusedReason: res.refusedReason } : {}),
    promptInjectionFlagged: res.promptInjectionFlagged === true,
    responseBlocked: res.responseBlocked === true,
  };
  const injection = ai.promptInjectionFlagged ? ["prompt_injection_text_neutralised"] : [];

  if (!res.llmUsed || res.method !== "ai") {
    return { draft: buildDeterministicDraft(candidate, now, ["ai_unavailable", ...injection]), ai };
  }
  if (ai.responseBlocked) {
    return { draft: buildDeterministicDraft(candidate, now, ["ai_response_withheld", ...injection]), ai };
  }
  const parsed = parseDraftJson(res.output);
  if (!parsed) {
    return { draft: buildDeterministicDraft(candidate, now, ["ai_draft_unreadable", ...injection]), ai };
  }

  const texts = [parsed.name, parsed.summary, ...parsed.key_questions, ...parsed.evidence_indicators, ...parsed.failure_modes];
  const flags = [...injection];
  if (copiesSource(texts, candidate.submissions.map((s) => s.note))) flags.push("possible_verbatim_copy");
  if (containsDirectQuotation(texts)) flags.push("contains_quotation");
  return { draft: { ...parsed, method: "ai", generated_at: now, flags }, ai };
}
