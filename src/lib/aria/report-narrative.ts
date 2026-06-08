// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA REPORT NARRATIVE HELPER (server-only)
//
// Generates an optional AI-written executive narrative for the shareable report
// packs, reusing the sanctioned aria-provider. Returns null when no LLM is
// configured (generateText reports llmUsed:false) or on any error — so callers
// always fall back gracefully to their deterministic summary. Never throws.
//
// Grounding/safety: the prompt instructs factual, non-sensational British
// English grounded only in the supplied facts, with no invention. Only fires
// when the operator has configured their own LLM key.
// ══════════════════════════════════════════════════════════════════════════════

import { generateText } from "./aria-provider";

export async function generateReportNarrative(opts: {
  kind: string; // e.g. "home summary report" | "LAC review pack"
  subject: string; // home name or child name
  facts: string; // structured fact lines
}): Promise<string | null> {
  const systemPrompt =
    `You are an experienced Registered Manager of a children's home writing a concise, professional executive summary for a ${opts.kind}. ` +
    `Write 2 to 4 sentences in plain, factual British English suitable to share with the local authority, board or a statutory review. ` +
    `Be balanced and non-sensational, ground every statement strictly in the facts provided, never invent or infer beyond them, and write the narrative only — no headings, no bullet points, no recommendations.`;
  const userPrompt =
    `Subject: ${opts.subject}\n\nFacts:\n${opts.facts}\n\nWrite the executive summary narrative now.`;

  try {
    const r = await generateText({ systemPrompt, userPrompt, temperature: 0.3, maxOutputTokens: 350 });
    return r.llmUsed && r.text && r.text.trim() ? r.text.trim() : null;
  } catch {
    return null;
  }
}
