import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/cara/chat
//
// Lightweight chat endpoint for the Cara drawer.
// Accepts { context, prompt } and returns { response }.
//
// Tries Anthropic first; falls back to OpenAI if only OpenAI is configured.
// If neither is configured returns a clear "not configured" message — never
// a crash or a mock.
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

// ── Anthropic streaming ───────────────────────────────────────────────────────

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
    return new Response(sseDone, sseHeaders());
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

// ── OpenAI streaming ──────────────────────────────────────────────────────────

async function streamOpenAI(
  key: string,
  model: string,
  userMessage: string,
): Promise<Response> {
  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(sseDone, sseHeaders());
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
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const text = evt.choices?.[0]?.delta?.content;
            if (text) ctrl.enqueue(sseChunk(text));
          } catch { /* ignore */ }
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

  // ── Try Anthropic ──────────────────────────────────────────────────────────

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey.length > 10 && !anthropicKey.includes("placeholder")) {
    if (shouldStream) {
      try {
        return await streamAnthropic(anthropicKey, userMessage);
      } catch {
        // Fall through to OpenAI
      }
    } else {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: (process.env.CARA_MODEL ?? process.env.CARA_MODEL) ?? "claude-sonnet-4-20250514",
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
        // Fall through to OpenAI
      }
    }
  }

  // ── Try OpenAI ─────────────────────────────────────────────────────────────

  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiModel = (process.env.CARA_TEXT_MODEL ?? process.env.CARA_TEXT_MODEL) ?? "gpt-4o-mini";
  if (openaiKey && openaiKey.length > 10 && !openaiKey.includes("placeholder")) {
    if (shouldStream) {
      try {
        return await streamOpenAI(openaiKey, openaiModel, userMessage);
      } catch {
        // Fall through to not-configured response
      }
    } else {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: openaiModel,
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
  }

  // ── Neither configured ─────────────────────────────────────────────────────

  const notConfigured =
    "Cara is not yet configured. To enable AI assistance, set OPENAI_API_KEY or ANTHROPIC_API_KEY " +
    "in your environment variables. Contact your system administrator to configure AI providers.";

  if (shouldStream) {
    const body = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(sseChunk(notConfigured));
        ctrl.enqueue(sseDone);
        ctrl.close();
      },
    });
    return new Response(body, sseHeaders());
  }

  return NextResponse.json({ response: notConfigured, provider: "none" }, { status: 200 });
}
