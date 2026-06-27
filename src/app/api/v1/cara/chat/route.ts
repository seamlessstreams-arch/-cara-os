import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/cara/chat
//
// Lightweight chat endpoint for the Cara drawer.
// Accepts { context, prompt } and returns { response }.
//
// Provider order is deterministic-first, then ANTHROPIC ONLY — the only AI
// provider. If Anthropic isn't configured or the call fails (e.g. exhausted
// credits), it returns a clear honest message — never a crash, a mock, or a
// fall-through to another provider.
//
// This endpoint does NOT persist to the DB. The drawer is a live-assist tool.
// Persisted drafts and approvals go through POST /api/cara/generate.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

const MAX_TOKENS = 1024;
const SYSTEM_PROMPT =
  "You are Cara — the AI assistant built into Cara, the operating system for children's homes. " +
  "You assist residential care professionals with professional writing, analysis, safeguarding checks, and compliance support. " +
  "Be concise, professional, and child-centred. " +
  "Never invent facts — only work from the context provided. " +
  "Label all suggestions as AI-generated drafts that require human review. " +
  "If you identify safeguarding concerns in any content, flag them explicitly.";

// ── SSE helpers ───────────────────────────────────────────────────────────────

const enc = new TextEncoder();

function sseChunk(text: string): Uint8Array {
  return enc.encode(`data: ${JSON.stringify({ type: "text_delta", text })}\n\n`);
}
const sseDone = enc.encode("data: [DONE]\n\n");

function sseHeaders(): ResponseInit {
  return {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  };
}

// ── Anthropic streaming (the only provider) ───────────────────────────────────

async function streamAnthropic(
  key: string,
  userMessage: string,
): Promise<Response> {
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: MAX_TOKENS,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!upstream.ok || !upstream.body) {
    // Non-OK (e.g. exhausted credits / rate limit) — throw so the handler serves
    // a graceful message. Never return an empty stream (blank drawer) and never
    // fall through to another provider — Anthropic is the only one.
    throw new Error(`cara chat upstream not ok (${upstream.status})`);
  }

  const body = new ReadableStream({
    async start(ctrl) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const evt = JSON.parse(raw) as {
              type: string;
              delta?: { type: string; text?: string };
            };
            if (
              evt.type === "content_block_delta" &&
              evt.delta?.type === "text_delta" &&
              evt.delta.text
            ) {
              ctrl.enqueue(sseChunk(evt.delta.text));
            }
          } catch { /* ignore malformed */ }
        }
      }
      ctrl.enqueue(sseDone);
      ctrl.close();
    },
  });

  return new Response(body, sseHeaders());
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const context = typeof body.context === "string" ? body.context.trim() : "";
  const prompt  = typeof body.prompt  === "string" ? body.prompt.trim()  : "";
  const shouldStream = body.stream === true;

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const userMessage = context ? `Context: ${context}\n\n${prompt}` : prompt;

  // ── Anthropic only — the only AI provider ────────────────────────────────────

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const anthropicConfigured = Boolean(anthropicKey && anthropicKey.length > 10 && !anthropicKey.includes("placeholder"));

  if (anthropicConfigured) {
    if (shouldStream) {
      try {
        return await streamAnthropic(anthropicKey!, userMessage);
      } catch {
        // Fall through to the honest message below — never to another provider.
      }
    } else {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey!,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: process.env.CARA_MODEL ?? "claude-sonnet-4-20250514",
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
          const text = data.content?.find((b) => b.type === "text")?.text ?? "";
          return NextResponse.json({ response: text, provider: "anthropic" });
        }
      } catch {
        // Fall through to the honest message below.
      }
    }
  }

  // ── Anthropic unavailable ────────────────────────────────────────────────────
  //
  // If the key was present we reached here because the call failed (e.g. exhausted
  // credits / rate limit) rather than being unconfigured — be honest about which.
  const notConfigured = anthropicConfigured
    ? "Cara's AI assistant is temporarily unavailable — Anthropic couldn't be reached just now (it may be rate-limited or out of credit). Cara's deterministic features continue to work; please try the AI assistant again shortly."
    : "Cara is not yet configured. To enable AI assistance, set ANTHROPIC_API_KEY in your server environment. Cara uses Anthropic (Claude) only.";

  if (shouldStream) {
    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(sseChunk(notConfigured));
        ctrl.enqueue(sseDone);
        ctrl.close();
      },
    });
    return new Response(stream, sseHeaders());
  }

  return NextResponse.json({ response: notConfigured, provider: "none" }, { status: 200 });
}
