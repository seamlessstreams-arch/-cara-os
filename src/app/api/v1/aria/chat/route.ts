import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/aria/chat
//
// Lightweight chat endpoint for the ARIA drawer.
// Accepts { context, prompt } and returns { response }.
//
// Tries Anthropic first; falls back to OpenAI if only OpenAI is configured.
// If neither is configured returns a clear "not configured" message — never
// a crash or a mock.
//
// This endpoint does NOT persist to the DB. The drawer is a live-assist tool.
// Persisted drafts and approvals go through POST /api/aria/generate.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const MAX_TOKENS = 1024;
const SYSTEM_PROMPT =
  "You are ARIA — the AI assistant built into Cornerstone, the operating system for children's homes. " +
  "You assist residential care professionals with professional writing, analysis, safeguarding checks, and compliance support. " +
  "Be concise, professional, and child-centred. " +
  "Never invent facts — only work from the context provided. " +
  "Label all suggestions as AI-generated drafts that require human review. " +
  "If you identify safeguarding concerns in any content, flag them explicitly.";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const context = typeof body.context === "string" ? body.context.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const userMessage = context
    ? `Context: ${context}\n\n${prompt}`
    : prompt;

  // ── Try Anthropic ──────────────────────────────────────────────────────────

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey.length > 10 && !anthropicKey.includes("placeholder")) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          content?: Array<{ type: string; text?: string }>;
        };
        const text =
          data.content?.find((b) => b.type === "text")?.text ?? "";
        return NextResponse.json({ response: text, provider: "anthropic" });
      }
    } catch {
      // Fall through to OpenAI
    }
  }

  // ── Try OpenAI ─────────────────────────────────────────────────────────────

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.length > 10 && !openaiKey.includes("placeholder")) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: process.env.ARIA_TEXT_MODEL ?? "gpt-4o-mini",
          max_tokens: MAX_TOKENS,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content ?? "";
        return NextResponse.json({ response: text, provider: "openai" });
      }
    } catch {
      // Fall through
    }
  }

  // ── Neither configured ─────────────────────────────────────────────────────

  return NextResponse.json(
    {
      response:
        "ARIA is not yet configured. To enable AI assistance, set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment variables. " +
        "Contact your system administrator to configure AI providers.",
      provider: "none",
    },
    { status: 200 },
  );
}
