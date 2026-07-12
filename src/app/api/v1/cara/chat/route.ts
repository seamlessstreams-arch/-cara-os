import { NextRequest, NextResponse } from "next/server";
import { invokeAiGateway, invokeAiGatewayStream } from "@/lib/cara/ai-gateway";
import { getStore } from "@/lib/db/store";
import { answerQuestion, resolveChild, roleTier } from "@/lib/ask-cara/ask-cara-engine";
import { buildAuditEvent } from "@/lib/ask-cara/audit-logger";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { answerNaturally, buildFreeChatGrounding, type ChatTurn } from "@/lib/cara/ask-cara-natural";
import { readJsonBody } from "@/lib/http/read-json";

/** Sanitise client-sent chat history to typed, clipped turns (max 6). */
function parseHistory(v: unknown): ChatTurn[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const turns = v
    .filter((t): t is { role: string; text: string } => !!t && typeof t === "object" && typeof (t as { text?: unknown }).text === "string")
    .map((t) => ({ role: t.role === "user" ? ("user" as const) : ("cara" as const), text: String(t.text).slice(0, 500) }))
    .slice(-6);
  return turns.length ? turns : undefined;
}

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
  "Be concise, professional, and child-centred — see the child, not the behaviour. " +
  "Never invent facts — only work from the context provided. When a CARA PLATFORM INTELLIGENCE block is present, it is the authoritative record: answer from it, and treat anything not in it as not having happened. " +
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
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
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
      const asOf = new Date().toISOString().slice(0, 10);
      const answer = answerQuestion({
        question: prompt,
        asOf,
        userName: typeof body.userName === "string" ? body.userName : undefined,
        role,
        snapshot,
        context: { pageTitle: typeof body.pageTitle === "string" ? body.pageTitle : undefined, childId },
      });

      // FULL CAPACITY: layer the grounded LLM voice on top of the deterministic
      // answer (default ON; pass natural:false to skip). The model only phrases
      // what the orchestrator + engines established; unavailable/refused/error →
      // the deterministic answer stands unchanged. Refusals/gates never reach it.
      // Conversation continuity: the child the question resolved to is returned so
      // the UI can carry it into follow-ups ("what triggers her?" → same child).
      const resolvedChild = resolveChild(prompt.toLowerCase(), snapshot, childId);
      let finalText = answer.text;
      let llmUsed = false;
      let naturalMethod = "deterministic";
      if (body.natural !== false) {
        const natural = await answerNaturally({
          question: prompt,
          answer,
          snapshot,
          tier: roleTier(role),
          child: resolvedChild,
          asOf,
          history: parseHistory(body.history),
        });
        finalText = natural.text;
        llmUsed = natural.llmUsed;
        naturalMethod = natural.method;
      }

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
            outputText: finalText,
            ruleVersion: answer.engineVersion,
            sources: answer.sources.map((s) => s.label),
            managerReviewRequired: answer.intent === "prohibited",
            prohibitedTriggered: answer.intent === "prohibited",
            deterministicOnly: !llmUsed,
          },
          { id: `ac_evt_${Date.now()}_${store.askCaraAuditEvents.length}`, createdAt: new Date().toISOString() }
        );
        store.askCaraAuditEvents.push(evt);
        if (store.askCaraAuditEvents.length > 1000) store.askCaraAuditEvents.splice(0, store.askCaraAuditEvents.length - 1000);
      } catch (auditErr) {
        console.error("[cara/chat] audit failed", auditErr);
      }

      // The UI renders answer.text unchanged; when the LLM phrased it, sources,
      // suggestions and the audit trail still come from the deterministic engine.
      return NextResponse.json({
        answer: { ...answer, text: finalText },
        llm: { used: llmUsed, method: naturalMethod },
        deterministicText: llmUsed ? answer.text : undefined,
        resolvedChildId: resolvedChild?.id,
      });
    } catch (err) {
      console.error("[cara/chat] ask failed", err);
      return NextResponse.json({ error: "Ask Cara failed" }, { status: 500 });
    }
  }

  // FULL CAPACITY (free chat too): even the open LLM chat answers grounded in the
  // platform's deterministic intelligence — the orchestrator's read of the
  // question plus the tier-scoped twin/engine/home context — never blind. If the
  // grounding can't be built, chat degrades to the ungrounded prompt (never 500s).
  let grounding = "";
  try {
    const store = getStore();
    const snapshot = buildAskSnapshot(store);
    const role = typeof body.role === "string" ? body.role : undefined;
    const childId = typeof body.childId === "string" ? body.childId : undefined;
    const asOf = new Date().toISOString().slice(0, 10);
    const detAnswer = answerQuestion({ question: prompt, asOf, role, snapshot, context: { childId } });
    grounding = buildFreeChatGrounding({
      question: prompt,
      snapshot,
      tier: roleTier(role),
      answer: detAnswer,
      child: resolveChild(prompt.toLowerCase(), snapshot, childId),
      asOf,
    });
  } catch (groundErr) {
    console.error("[cara/chat] grounding failed — continuing ungrounded", groundErr);
  }

  const userMessage = [grounding, context ? `Context: ${context}` : "", prompt].filter(Boolean).join("\n\n");

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
