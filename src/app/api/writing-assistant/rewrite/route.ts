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
import {
  buildRewriteSystemPrompt,
  buildRewriteUserPrompt,
  rewriteMaxOutputTokens,
} from "@/lib/writing-assistant/style/system-prompt";
import { applyCaraPostprocessor } from "@/lib/cara/writingStyleRules";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

// Abuse-safeguard only (broken / oversized payloads) — NOT a recording limit.
// Long professional records, including long dictated entries, must never be capped.
const REWRITE_MAX_LENGTH = 100_000;

const VALID_MODES: WritingMode[] = ["standard", "safeguarding", "writing-to-child", "management-oversight"];

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.USE_CARA_INTELLIGENCE);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Record<string, unknown>;
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
  //
  // Consistency comes from the locked specification, not the model: the system
  // prompt is assembled from reviewable files (style/house-style.md + few-shot
  // examples), temperature is 0, the model is pinned via CARA_MODEL, and the
  // output budget is computed from the input instead of the old flat 1024 that
  // silently truncated long records.
  const gw = await invokeAiGateway({
    purpose: "writing_assistant_rewrite",
    feature: "writing_assistant_rewrite",
    systemPrompt: buildRewriteSystemPrompt(mode),
    userPrompt: buildRewriteUserPrompt(text),
    temperature: 0,
    maxOutputTokens: rewriteMaxOutputTokens(text.length),
    redact: false,
  });

  // No key / refused / cost-capped / provider error → deterministic floor (the
  // same graceful degradation as before, now also covering the budget cap).
  if (!gw.llmUsed || !gw.output?.trim()) return deterministic();

  // Deterministic post-pass: the model restructures; the engine then enforces
  // the non-negotiable substitutions and strips AI tells. What the post-pass
  // had to correct is returned — a long corrections list means the system
  // prompt needs work, and now that is measurable.
  const modelText = gw.output.trim();
  const polished = applyCaraPostprocessor(modelText);
  const post = deterministicRewrite(mode === "writing-to-child" ? "write_to_child" : "improve_writing", polished);
  const corrections = [
    ...(polished !== modelText ? ["Stripped AI-tell phrasing from the model output."] : []),
    ...(post.changed ? post.notes : []),
  ];

  return NextResponse.json({
    data: {
      available: true,
      blocked: false,
      rewrittenText: post.text,
      postPass: { corrected: corrections.length > 0, corrections },
    },
  });
}
