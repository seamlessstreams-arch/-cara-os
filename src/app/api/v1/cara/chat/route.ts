import { NextRequest, NextResponse } from "next/server";
import { invokeAiGateway, invokeAiGatewayStream } from "@/lib/cara/ai-gateway";
import { getStore } from "@/lib/db/store";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { buildAuditEvent } from "@/lib/ask-cara/audit-logger";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";

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

// ── Deterministic "Ask Cara" (no LLM) ──────────────────────────────────────────
// The chat surface asks questions that are answered straight from the home's
// records — no model call, so it works with zero AI credit. The store → snapshot
// mapper is shared (buildAskSnapshot) so the Cara workflow assistant can answer
// the same way — see @/lib/ask-cara/build-snapshot.

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

  // Deterministic Ask-Cara path — record-based Q&A, no model, works with no credit.
  if (body.mode === "ask") {
    try {
      const store = getStore();
      const snapshot = buildAskSnapshot(store);
      const role = typeof body.role === "string" ? body.role : undefined;
      const childId = typeof body.childId === "string" ? body.childId : undefined;
      const answer = answerQuestion({
        question: prompt,
        asOf: new Date().toISOString().slice(0, 10),
        userName: typeof body.userName === "string" ? body.userName : undefined,
        role,
        snapshot,
        context: { pageTitle: typeof body.pageTitle === "string" ? body.pageTitle : undefined, childId },
      });

      // §21 audit trail — every Ask CARA interaction is logged (text hashed, never raw).
      try {
        const evt = buildAuditEvent(
          {
            userId: typeof body.userName === "string" ? body.userName : undefined,
            role,
            childId,
            sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
            mode: "ask",
            intent: answer.intent,
            taskCard: typeof body.taskCard === "string" ? body.taskCard : undefined,
            inputText: prompt,
            outputText: answer.text,
            ruleVersion: answer.engineVersion,
            sources: answer.sources.map((s) => s.label),
            managerReviewRequired: answer.intent === "prohibited",
            prohibitedTriggered: answer.intent === "prohibited",
            deterministicOnly: true,
          },
          { id: `ac_evt_${Date.now()}_${store.askCaraAuditEvents.length}`, createdAt: new Date().toISOString() }
        );
        store.askCaraAuditEvents.push(evt);
        if (store.askCaraAuditEvents.length > 1000) store.askCaraAuditEvents.splice(0, store.askCaraAuditEvents.length - 1000);
      } catch (auditErr) {
        console.error("[cara/chat] audit failed", auditErr);
      }

      return NextResponse.json({ answer });
    } catch (err) {
      console.error("[cara/chat] ask failed", err);
      return NextResponse.json({ error: "Ask Cara failed" }, { status: 500 });
    }
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
