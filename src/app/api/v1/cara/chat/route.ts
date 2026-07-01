import { NextRequest, NextResponse } from "next/server";
import { invokeAiGateway, invokeAiGatewayStream } from "@/lib/cara/ai-gateway";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/cara/chat
//
// Lightweight chat endpoint for the Cara drawer.
// Accepts { context, prompt } and returns { response }.
//
// Through the AI Gateway — the drawer's context is often a child's name plus
// free narrative text pasted in from a record (e.g. the family-contact page
// sends full safeguarding-concern detail text when one is flagged), so this
// endpoint needs the same redaction, sensitivity block, provider-risk check,
// prompt-injection guard and response scanning as every other Cara call.
// redact:false — Cara chat intentionally keeps names/context readable in the
// prompt; the sensitivity gate still blocks safeguarding-sensitive content
// from ever reaching the model.
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

function honestMessage(refusedReason: string | undefined): string {
  // Distinguish "never configured" from "configured but the call failed" (e.g.
  // exhausted credits / rate limit) — mirrors the gateway's own refusal text.
  if (refusedReason?.includes("No AI provider is configured")) {
    return "Cara is not yet configured. To enable AI assistance, set ANTHROPIC_API_KEY in your server environment. Cara uses Anthropic (Claude) only.";
  }
  return "Cara's AI assistant is temporarily unavailable — Anthropic couldn't be reached just now (it may be rate-limited or out of credit). Cara's deterministic features continue to work; please try the AI assistant again shortly.";
}

// ── Streaming (through the gateway) ────────────────────────────────────────────

function streamViaGateway(userMessage: string): Response {
  const body = new ReadableStream({
    async start(ctrl) {
      try {
        const result = await invokeAiGatewayStream(
          {
            purpose: "cara_chat_stream",
            feature: "cara_chat",
            systemPrompt: SYSTEM_PROMPT,
            userPrompt: userMessage,
            redact: false,
            maxOutputTokens: MAX_TOKENS,
          },
          { onTextDelta: (text) => ctrl.enqueue(sseChunk(text)) },
        );
        if (!result.llmUsed) {
          ctrl.enqueue(sseChunk(honestMessage(result.refusedReason)));
        }
      } catch {
        ctrl.enqueue(sseChunk(honestMessage(undefined)));
      } finally {
        ctrl.enqueue(sseDone);
        ctrl.close();
      }
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

  if (shouldStream) {
    return streamViaGateway(userMessage);
  }

  const result = await invokeAiGateway({
    purpose: "cara_chat",
    feature: "cara_chat",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: userMessage,
    redact: false,
    maxOutputTokens: MAX_TOKENS,
  });

  if (result.llmUsed && result.method === "ai") {
    return NextResponse.json({ response: result.output, provider: "anthropic" });
  }

  return NextResponse.json({ response: honestMessage(result.refusedReason), provider: "none" });
}
