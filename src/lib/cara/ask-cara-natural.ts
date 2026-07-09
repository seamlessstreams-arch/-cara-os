// ══════════════════════════════════════════════════════════════════════════════
// CARA — Ask CARA NATURAL LAYER (server-only, governed)
//
// Ask CARA at full capacity: the deterministic orchestrator computes the answer
// (evidence-linked, permission-scoped, works with zero credit — the FLOOR), and
// when a model is available this layer rephrases it conversationally, GROUNDED in
// the platform's whole intelligence (Digital Twin, evaluation engines, practice
// engines, weekly narrative, home evaluation, ops) via the tier-scoped grounding
// pack. The LLM only ever phrases what the platform has already established.
//
// Every model call goes through the governed invokeAiGateway chokepoint
// (sensitivity gate, injection guard, response scanner, metering, hashed audit,
// fail-closed). GRACEFUL: unavailable/refused/error → the deterministic answer
// is returned unchanged. This module lives OUTSIDE ask-cara/ so Ask CARA itself
// stays 100% deterministic (its import-guard test forbids AI imports there).
// ══════════════════════════════════════════════════════════════════════════════

import { invokeAiGateway } from "@/lib/cara/ai-gateway";
import { buildGroundingPack } from "@/lib/ask-cara/build-grounding";
import type { AccessTier, AskCaraAnswer, AskCaraChild, AskCaraSnapshot } from "@/lib/ask-cara/types";

const NATURAL_RULES =
  "You are CARA — the practice intelligence built into a children's residential home's operating system, speaking as a warm, experienced practitioner (think seasoned registered manager: plain, kind, professionally sharp).\n\n" +
  "You are given: the user's question, CARA's DETERMINISTIC ANSWER (computed from the home's live records — authoritative), and a GROUNDING PACK of the platform's intelligence.\n\n" +
  "HARD RULES:\n" +
  "- Every fact must come from the provided context. NEVER invent, estimate or embellish an event, name, number, date, quote or feeling. If it isn't in the context, it did not happen.\n" +
  "- Keep the deterministic answer's meaning fully intact — rephrase and enrich it with the grounding, never contradict or omit a concern it raises.\n" +
  "- See the child, not the behaviour: strengths-first, warm, compassionate, jargon-free.\n" +
  "- Never make a safeguarding decision, predict an inspection grade, or offer a diagnosis — surface, support, and leave the judgement with the human.\n" +
  "- If the context cannot answer the question, say so plainly and point to what CARA can answer.\n" +
  "- Be concise: under 220 words unless the user asked for a draft or summary. Use short paragraphs or simple dashes, matching the question's weight.\n" +
  "- No preamble ('Certainly!'), no sign-off. Answer as CARA, directly.";

// Intents that must NEVER be sent to a model: refusals, gates and canned surfaces
// stay exactly as the deterministic engine wrote them.
const SKIP_INTENTS = new Set(["prohibited", "access_denied", "shadow_ai_route", "greeting", "unknown"]);

export interface NaturalAnswer {
  /** The final text — LLM-phrased when available, deterministic otherwise. */
  text: string;
  llmUsed: boolean;
  method: string; // "ai_grounded" | "deterministic" | "deterministic:<reason>"
}

export interface ChatTurn {
  role: "user" | "cara";
  text: string;
}

/** Format prior turns for the model — last 6, clipped, oldest first. Pure. */
export function formatHistory(history: ChatTurn[] | undefined): string {
  if (!history?.length) return "";
  const turns = history
    .filter((t) => (t.role === "user" || t.role === "cara") && typeof t.text === "string" && t.text.trim())
    .slice(-6)
    .map((t) => `${t.role === "user" ? "USER" : "CARA"}: ${t.text.trim().slice(0, 400)}`);
  return turns.length ? `CONVERSATION SO FAR (for continuity only — facts still come ONLY from the grounding):\n${turns.join("\n")}` : "";
}

export interface NaturalInput {
  question: string;
  answer: AskCaraAnswer;
  snapshot: AskCaraSnapshot;
  tier: AccessTier;
  child?: AskCaraChild | null;
  asOf: string;
  /** Prior chat turns — continuity for the model, never a source of facts. */
  history?: ChatTurn[];
}

export async function answerNaturally(input: NaturalInput): Promise<NaturalAnswer> {
  const { answer } = input;
  if (SKIP_INTENTS.has(answer.intent) || !answer.answered) {
    return { text: answer.text, llmUsed: false, method: "deterministic:skip-intent" };
  }
  try {
    const grounding = buildGroundingPack({
      question: input.question,
      snapshot: input.snapshot,
      tier: input.tier,
      answer,
      child: input.child,
      asOf: input.asOf,
    });
    const historyBlock = formatHistory(input.history);
    const result = await invokeAiGateway({
      purpose: "ask_cara_natural",
      feature: "ask_cara",
      systemPrompt: NATURAL_RULES,
      userPrompt: [historyBlock, `QUESTION: ${input.question}`, grounding].filter(Boolean).join("\n\n"),
      // Names must stay readable for a grounded answer; the gateway's sensitivity
      // gate still decides whether this content may reach the model at all.
      redact: false,
      maxOutputTokens: 700,
    });
    if (result.llmUsed && result.method === "ai" && result.output?.trim()) {
      return { text: result.output.trim(), llmUsed: true, method: "ai_grounded" };
    }
    return { text: answer.text, llmUsed: false, method: result.refusedReason ? "deterministic:refused" : `deterministic:${result.method}` };
  } catch {
    return { text: answer.text, llmUsed: false, method: "deterministic:error" };
  }
}

/**
 * Grounding for the FREE-CHAT path (no mode:"ask") — the drawer's open LLM chat.
 * Prepends the tier-scoped platform intelligence so even free-form conversation
 * is platform-aware rather than blind. Pure passthrough of the pack builder.
 */
export function buildFreeChatGrounding(args: { question: string; snapshot: AskCaraSnapshot; tier: AccessTier; answer?: AskCaraAnswer; child?: AskCaraChild | null; asOf: string }): string {
  const pack = buildGroundingPack({
    question: args.question,
    snapshot: args.snapshot,
    tier: args.tier,
    answer: args.answer && args.answer.answered && !SKIP_INTENTS.has(args.answer.intent) ? args.answer : undefined,
    child: args.child,
    asOf: args.asOf,
  });
  return `=== CARA PLATFORM INTELLIGENCE (deterministic, from the live records — answer ONLY from this; anything not here did not happen) ===\n${pack}\n=== END PLATFORM INTELLIGENCE ===`;
}
