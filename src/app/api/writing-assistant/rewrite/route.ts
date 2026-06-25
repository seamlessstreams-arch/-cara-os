// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — AI rewrite endpoint
//
// POST → rewrite text. Deterministic local engine by default (no AI key needed);
// Claude is used only when a key is configured AND the text is not safeguarding-sensitive.
//
// Guards:
//   1. No ANTHROPIC_API_KEY → the deterministic engine handles it (prod path).
//   2. Safeguarding-sensitive content is NEVER sent to the model.
//   3. Max 100 000 characters — a generous abuse-safeguard ONLY, not a recording
//      limit. Long professional records and dictated multi-page entries are supported.
//
// The model is instructed to preserve facts, names, concerns, and the author's
// voice. It may only fix spelling, grammar, punctuation, and UK-vs-US spelling.
// Staff must accept the rewrite explicitly — it is never auto-applied.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { invokeAiGateway } from "@/lib/cara/ai-gateway";
import { SAFEGUARDING_SENSITIVE_TERMS, type WritingMode } from "@/lib/writing-assistant/types";
import { deterministicRewrite } from "@/lib/writing-assistant/deterministic-rewrite";

export const dynamic = "force-dynamic";

// Abuse-safeguard only (broken / oversized payloads) — NOT a recording limit.
// Long professional records, including long dictated entries, must never be capped.
const REWRITE_MAX_LENGTH = 100_000;

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

  // Deterministic floor — works everywhere, no AI key, no network. "Write to the
  // child" context maps to the child-readable engine; everything else improves
  // grammar/spelling/clarity while preserving meaning. The deterministic engine
  // never softens safeguarding content, so it is safe to run on any text.
  const deterministic = () => {
    const result = deterministicRewrite(mode === "writing-to-child" ? "write_to_child" : "improve_writing", text);
    return NextResponse.json({
      data: { available: true, blocked: false, rewrittenText: result.text, deterministic: true },
    });
  };

  // Safeguarding gate — never send sensitive content to the model. The original
  // wording is preserved; the author keeps full control of safeguarding records.
  const lower = text.toLowerCase();
  if (SAFEGUARDING_SENSITIVE_TERMS.some((t) => lower.includes(t))) {
    return NextResponse.json({
      data: {
        available: true,
        blocked: true,
        reason:
          "This text contains safeguarding-sensitive content. Cara will not send it to the AI model — the original wording must be preserved exactly by the author. You can still use the deterministic 'Improve writing' rewrite from the field toolbar.",
      },
    });
  }

  // Through the AI Gateway: it meters cost, enforces the per-request/daily caps,
  // and audits the call. redact:false because a rewrite must mirror the author's
  // exact text (placeholders would corrupt it) — the safeguarding block above and
  // the gateway's own safeguarding-sensitivity block are what protect the content.
  const gw = await invokeAiGateway({
    purpose: "writing_assistant_rewrite",
    feature: "writing_assistant_rewrite",
    systemPrompt: "",
    userPrompt: buildPrompt(text, mode),
    maxOutputTokens: 1024,
    redact: false,
  });

  // No key / refused / cost-capped / provider error → deterministic floor (the
  // same graceful degradation as before, now also covering the budget cap).
  if (!gw.llmUsed || !gw.output?.trim()) return deterministic();

  return NextResponse.json({ data: { available: true, blocked: false, rewrittenText: gw.output.trim() } });
}
