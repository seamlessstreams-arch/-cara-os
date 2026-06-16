// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — AI rewrite endpoint
//
// POST → rewrite the provided text using Claude.
//
// Guards:
//   1. ANTHROPIC_API_KEY must be set — returns {available:false} otherwise.
//   2. Safeguarding-sensitive content is NEVER sent to the model — returns
//      {available:true, blocked:true, reason:"..."} instead.
//   3. Max 5 000 characters — care recordings are short.
//
// The model is instructed to preserve facts, names, concerns, and the author's
// voice. It may only fix spelling, grammar, punctuation, and UK-vs-US spelling.
// Staff must accept the rewrite explicitly — it is never auto-applied.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { getAnthropicClient } from "@/lib/anthropic-client";
import { SAFEGUARDING_SENSITIVE_TERMS, type WritingMode } from "@/lib/writing-assistant/types";

export const dynamic = "force-dynamic";

const REWRITE_MAX_LENGTH = 5_000;

const VALID_MODES: WritingMode[] = ["standard", "safeguarding", "writing-to-child", "management-oversight"];

function buildPrompt(text: string, mode: WritingMode): string {
  const modeNote =
    mode === "writing-to-child"
      ? "The text is written TO a child — keep language simple, warm, and age-appropriate."
      : mode === "management-oversight"
        ? "The text is a management oversight record — keep it professional and analytical."
        : "The text is a professional care record written by a residential care worker.";

  return `You are a care-recording writing assistant for UK children's residential care.

${modeNote}

Your task: improve the grammar, spelling, punctuation, and clarity of the care record below.

STRICT RULES — never break these:
1. Do NOT change any facts, dates, names, specific behaviours, or observations.
2. Do NOT remove, soften, or alter any concerns, concerning behaviours, or safeguarding content.
3. Do NOT alter the author's professional assessment or opinion.
4. Use UK English spelling throughout (behaviour, realise, colour, centre, recognise, etc.).
5. Keep the author's voice — do not add formal, clinical, or flowery language they did not use.
6. Return ONLY the improved text — no explanation, preamble, or commentary.

Text to improve:
${text}`;
}

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.USE_CARA_INTELLIGENCE);
  if (auth instanceof NextResponse) return auth;

  // Gate on API key — return gracefully when not set (prod with no key).
  let anthropicClient: ReturnType<typeof getAnthropicClient>;
  try {
    anthropicClient = getAnthropicClient();
  } catch {
    return NextResponse.json({ data: { available: false } });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });
  if (text.length > REWRITE_MAX_LENGTH) {
    return NextResponse.json({ error: `text exceeds ${REWRITE_MAX_LENGTH} characters` }, { status: 413 });
  }

  const mode: WritingMode = VALID_MODES.includes(body.mode as WritingMode)
    ? (body.mode as WritingMode)
    : "standard";

  // Safeguarding gate — never send sensitive content to the model.
  const lower = text.toLowerCase();
  if (SAFEGUARDING_SENSITIVE_TERMS.some((t) => lower.includes(t))) {
    return NextResponse.json({
      data: {
        available: true,
        blocked: true,
        reason:
          "This text contains safeguarding-sensitive content. Cara cannot rewrite it — the original wording must be preserved exactly by the author.",
      },
    });
  }

  try {
    const message = await anthropicClient.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: buildPrompt(text, mode) }],
    });

    const rewrittenText =
      message.content[0]?.type === "text" ? message.content[0].text.trim() : text;

    return NextResponse.json({ data: { available: true, blocked: false, rewrittenText } });
  } catch (error) {
    const msg = String(error).slice(0, 300);
    console.error("[writing-assistant] rewrite failed", { length: text.length, message: msg });
    // Surface enough detail in non-sensitive error so we can debug without log access.
    return NextResponse.json({ error: "Rewrite failed", detail: msg }, { status: 500 });
  }
}
