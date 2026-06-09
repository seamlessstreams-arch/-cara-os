// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REFLECTIVE SUPERVISION · ARIA PROMPTS
// POST /api/v1/reflective-supervision/ai-prompts   body: { staffName?, context? }
//
// Optional AI support (spec §9): suggests reflective PROMPTS to help a manager
// prepare a supervision conversation. It NEVER writes the supervision record or
// its conclusions — prompts only. Graceful when no LLM key is configured.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { generateText } from "@/lib/aria/aria-provider";

const AI_DISCLAIMER = "AI suggests reflective prompts only — it never writes the supervision record or its conclusions. The manager leads the conversation and records it. AI suggestions require professional judgement and manager approval.";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as any;
  const staffName = String(body.staffName ?? "the staff member");
  const context = String(body.context ?? "").slice(0, 600);

  const systemPrompt =
    "You are helping a children's-home manager prepare a reflective, trauma-informed supervision conversation. " +
    "Suggest 5–6 open, reflective PROMPTS (questions the supervisor could ask) covering wellbeing, workload, safeguarding, " +
    "relationships with children, reflective/PACE practice, professional boundaries, confidence and development. " +
    "These are prompts only — do NOT write conclusions, do NOT assess or judge the staff member, do NOT diagnose. " +
    "Return ONLY the prompts, one per line, no numbering, no preamble.";
  const userPrompt = `Staff member: ${staffName}.${context ? `\nContext the manager noted: ${context}` : ""}`;

  const result = await generateText({ systemPrompt, userPrompt, temperature: 0.5, maxOutputTokens: 400 });

  if (!result.llmUsed || !result.text?.trim()) {
    return NextResponse.json({
      data: {
        prompts: [],
        llmUsed: false,
        message: "ARIA isn't configured in this environment, so AI reflective prompts are unavailable. Use the section structure below to guide the conversation. (Add an ANTHROPIC_API_KEY to enable AI prompts.)",
        disclaimer: AI_DISCLAIMER,
      },
    });
  }

  const prompts = result.text
    .split("\n")
    .map((l) => l.replace(/^\s*[-*\d.\)]+\s*/, "").trim())
    .filter((l) => l.length > 8)
    .slice(0, 8);

  return NextResponse.json({ data: { prompts, llmUsed: true, message: null, disclaimer: AI_DISCLAIMER } });
}
