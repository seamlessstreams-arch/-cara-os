import { NextRequest, NextResponse } from "next/server";
import { invokeAiGateway, invokeAiGatewayStream } from "@/lib/cara/ai-gateway";
import { getStore } from "@/lib/db/store";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { buildAuditEvent } from "@/lib/ask-cara/audit-logger";
import type { AskCaraSnapshot } from "@/lib/ask-cara/types";

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
// records — no model call, so it works with zero AI credit. The engine is pure;
// this maps the store into its snapshot.

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");
const s = (v: unknown): string => (typeof v === "string" ? v : "");

function buildAskSnapshot(store: ReturnType<typeof getStore>): AskCaraSnapshot {
  const returnInterviews = (store.returnInterviews ?? []) as Array<{ episode_id?: string; missing_episode_id?: string; child_id?: string }>;
  const rec = (c: unknown) => (c ?? []) as Array<Record<string, unknown>>;
  // Earliest upcoming (or most recent) LAC review per child.
  const lacNext = new Map<string, string>();
  for (const r of rec(store.lacReviews)) {
    const cid = r.child_id ? String(r.child_id) : "";
    const d = day(r.next_review_date ?? r.next_review);
    if (cid && d && (!lacNext.has(cid) || d > lacNext.get(cid)!)) lacNext.set(cid, d);
  }
  return {
    children: rec(store.youngPeople).map((c) => ({
      id: String(c.id),
      firstName: s(c.preferred_name) || s(c.first_name) || s(c.full_name) || String(c.id),
      name: s(c.full_name) || [c.first_name, c.last_name].filter(Boolean).join(" ") || String(c.id),
      dob: day(c.date_of_birth),
      status: s(c.status) || "current",
      keyWorkerId: s(c.key_worker_id) || s(c.keyWorkerId) || s(c.key_worker) || undefined,
      legalStatus: s(c.legal_status) || undefined,
      socialWorker: s(c.social_worker_name) || undefined,
      iro: s(c.iro_name) || undefined,
      school: s(c.school_name) || undefined,
      gp: s(c.gp_name) || undefined,
      allergies: Array.isArray(c.allergies) ? (c.allergies as unknown[]).map(String) : undefined,
      dietary: s(c.dietary_requirements) || undefined,
      placementStart: day(c.placement_start),
      nextReviewDate: lacNext.get(String(c.id)) || undefined,
    })),
    staff: rec(store.staff).map((st) => ({ id: String(st.id), name: s(st.full_name) || [st.first_name, st.last_name].filter(Boolean).join(" ") || String(st.id) })),
    incidents: rec(store.incidents).map((i) => ({ id: String(i.id), type: s(i.type) || "other", severity: s(i.severity), childId: i.child_id ? String(i.child_id) : undefined, date: day(i.date), status: s(i.status) || "open", requiresOversight: !!i.requires_oversight, hasOversight: !!(i.oversight_note || i.oversight_by || i.oversight_at) })),
    tasks: rec(store.tasks).map((t) => ({ id: String(t.id), title: s(t.title) || "Action", dueDate: day(t.due_date), status: s(t.status), childId: t.linked_child_id ? String(t.linked_child_id) : undefined })),
    restraints: rec(store.restraints).map((r) => ({ id: String(r.id), date: day(r.date ?? r.created_at), childId: r.child_id ? String(r.child_id) : undefined, childDebriefed: !!r.child_debriefed })),
    missingEpisodes: rec(store.missingEpisodes).map((m) => ({ id: String(m.id), date: day(m.date ?? m.reported_at), childId: m.child_id ? String(m.child_id) : undefined, status: s(m.status) || "active", hasReturnInterview: returnInterviews.some((ri) => ri.episode_id === m.id || ri.missing_episode_id === m.id || (!!m.child_id && ri.child_id === m.child_id)) })),
    dailyLogs: rec(store.dailyLog).map((l) => ({ childId: String(l.child_id), date: day(l.date), content: s(l.content), significant: !!l.is_significant })),
    medications: rec(store.medications).map((m) => ({ id: String(m.id), childId: m.child_id ? String(m.child_id) : undefined, name: s(m.name) })),
    reviews: [
      ...rec(store.riskAssessments).map((r) => ({ id: String(r.id), kind: "Risk assessment", childId: r.child_id ? String(r.child_id) : undefined, nextReviewDate: day(r.next_review_date ?? r.review_date) })),
      ...rec(store.lacReviews).map((r) => ({ id: String(r.id), kind: "LAC review", childId: r.child_id ? String(r.child_id) : undefined, nextReviewDate: day(r.next_review_date ?? r.next_review) })),
    ].filter((r) => r.nextReviewDate),
    shifts: rec((store as Record<string, unknown>).shifts).map((sh) => ({ id: String(sh.id), staffId: String(sh.staff_id), date: day(sh.date), shiftType: s(sh.shift_type) || undefined })),
    keyWork: rec((store as Record<string, unknown>).keyWorkingSessions).map((k) => ({ childId: String(k.child_id), date: day(k.date ?? k.session_date) })),
    home: (() => {
      const h = (store as Record<string, unknown>).home as Record<string, unknown> | undefined;
      return h ? { name: s(h.name) || undefined, maxBeds: typeof h.max_beds === "number" ? h.max_beds : undefined, currentOccupancy: typeof h.current_occupancy === "number" ? h.current_occupancy : undefined } : undefined;
    })(),
    contacts: rec((store as Record<string, unknown>).professionalNetworkContacts).map((c) => ({ childId: String(c.child_id), role: s(c.role), name: s(c.name), organisation: s(c.organisation) || undefined, phone: s(c.phone) || undefined })),
    supervisions: [
      ...rec(store.supervisions).map((sv) => ({ staffId: String(sv.staff_id), date: day(sv.actual_date ?? sv.scheduled_date), nextDate: day(sv.next_date) || undefined, status: s(sv.status) || undefined })),
      ...rec((store as Record<string, unknown>).reflectiveSupervisions).map((sv) => ({ staffId: String(sv.staff_id), date: day(sv.date), nextDate: day(sv.follow_up_date) || undefined, status: "reflective" })),
    ].filter((sv) => sv.staffId && sv.date),
    training: rec(store.trainingRecords).map((t) => ({ staffId: String(t.staff_id), course: s(t.course_name) || "Training", expiryDate: day(t.expiry_date) || undefined, status: s(t.status) || undefined, mandatory: !!t.is_mandatory })),
    policies: rec((store as Record<string, unknown>).homePolicies).map((p) => ({
      id: String(p.id),
      title: s(p.title) || s(p.name) || String(p.id),
      category: s(p.category) || "general",
      description: s(p.description) || undefined,
      keyPoints: Array.isArray(p.key_points) ? (p.key_points as unknown[]).map(String) : undefined,
      statutoryBasis: s(p.statutory_basis) || undefined,
      linkedStandard: s(p.linked_standard) || undefined,
      status: s(p.status) || undefined,
      lastReviewed: day(p.last_reviewed) || undefined,
      nextReviewDate: day(p.next_review_date) || undefined,
    })),
  };
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
