// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara INCIDENT MODE · POST-INCIDENT API (slice B)
// GET  /api/v1/cara-incident/[sessionId]/post-incident
//        → templates + any restorative conversation / reflection for the session
// POST /api/v1/cara-incident/[sessionId]/post-incident
//        { kind: "restorative", ... }  → save the restorative conversation
//        { kind: "reflection",  ... }  → save the post-incident reflection
//
// Manager-review need and follow-up suggestions are DERIVED deterministically by
// the engine. The optional AI summary is a draft attached for staff/manager to
// read — never a conclusion. Saving a restorative conversation also writes a
// restorative_action timeline entry, which satisfies the quality gate's
// follow-up check.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { persistRestorativeConversation, persistPostIncidentReflection } from "@/lib/supabase/incident-persist";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { generateText } from "@/lib/cara/cara-provider";
import {
  RESTORATIVE_QUESTIONS, RESTORATIVE_READINESS_CHECKS, RESTORATIVE_DISCLAIMER,
  REFLECTION_QUESTIONS, REFLECTION_FACTORS, REFLECTION_OUTCOMES, REFLECTION_DISCLAIMER,
  buildRestorativeSummary, restorativeManagerReview,
  buildReflectionSummary, deriveFollowUpActions, reflectionManagerReview,
  POST_INCIDENT_AI_SYSTEM_PROMPT,
  type RestorativeConversationRecord, type PostIncidentReflectionRecord,
} from "@/lib/cara-incident/post-incident-engine";
import { findSession, addTimelineEntry, currentUserId, logIncidentAudit, childName } from "@/lib/cara-incident/incident-service";

function recordsFor(sessionId: string) {
  const store = getStore() as any;
  return {
    restorative: ((store.caraRestorativeConversations ?? []) as RestorativeConversationRecord[]).filter((r) => r.incident_session_id === sessionId),
    reflections: ((store.caraPostIncidentReflections ?? []) as PostIncidentReflectionRecord[]).filter((r) => r.incident_session_id === sessionId),
  };
}

export async function GET(_req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const session = findSession(sessionId);
  if (!session) return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });
  return NextResponse.json({
    data: {
      ...recordsFor(sessionId),
      templates: {
        restorative_questions: RESTORATIVE_QUESTIONS,
        readiness_checks: RESTORATIVE_READINESS_CHECKS,
        reflection_questions: REFLECTION_QUESTIONS,
        reflection_factors: REFLECTION_FACTORS,
        reflection_outcomes: REFLECTION_OUTCOMES,
      },
      disclaimers: { restorative: RESTORATIVE_DISCLAIMER, reflection: REFLECTION_DISCLAIMER },
    },
  });
}

async function aiSummaryFor(kind: string, factualSummary: string): Promise<string | null> {
  if (!factualSummary.trim()) return null;
  const result = await generateText({
    systemPrompt: POST_INCIDENT_AI_SYSTEM_PROMPT,
    userPrompt: `Kind: ${kind}.\nFacts recorded by staff:\n${factualSummary}`,
    temperature: 0.3,
    maxOutputTokens: 300,
  });
  return result.llmUsed && result.text?.trim() ? result.text.trim() : null;
}

export async function POST(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const session = findSession(sessionId);
  if (!session) return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as any;
  const user_id = currentUserId(req);
  const store = getStore() as any;
  const now = new Date().toISOString();
  const kind = String(body.kind ?? "");
  const s = (v: unknown) => String(v ?? "").trim();

  if (kind === "restorative") {
    const ready = body.child_ready_to_engage !== false;
    const rec: RestorativeConversationRecord = {
      id: generateId("arc"),
      home_id: session.home_id,
      child_id: session.child_id,
      incident_session_id: session.id,
      completed_by_user_id: user_id,
      conversation_date: now.slice(0, 10),
      child_ready_to_engage: ready,
      child_voice: s(body.child_voice),
      what_happened: s(body.what_happened),
      who_was_affected: s(body.who_was_affected),
      what_helped: s(body.what_helped),
      what_made_it_worse: s(body.what_made_it_worse),
      repair_actions: s(body.repair_actions),
      follow_up_required: body.follow_up_required === true,
      ai_summary: null,
      manager_review_required: false,
      created_at: now,
      updated_at: now,
    };
    if (ready && !rec.what_happened && !rec.child_voice) {
      return NextResponse.json({ ok: false, error: "Record what happened or the child's voice — or mark the child as not ready yet." }, { status: 400 });
    }
    rec.manager_review_required = restorativeManagerReview(rec);
    const factual = buildRestorativeSummary(rec, childName(session.child_id));
    rec.ai_summary = await aiSummaryFor("restorative conversation", factual);

    store.caraRestorativeConversations = store.caraRestorativeConversations ?? [];
    store.caraRestorativeConversations.push(rec);
    void persistRestorativeConversation(rec as unknown as Record<string, unknown>);
    addTimelineEntry({
      session,
      entry_type: "restorative_action",
      raw_text: ready
        ? "Restorative conversation completed — see restorative record for this incident."
        : "Restorative conversation offered; the child was not ready. Decision respected — staff will revisit.",
      user_id,
    });
    logIncidentAudit({ action_type: "ai_suggestion_accepted", user_id, child_id: session.child_id, source_id: session.id, note: `restorative=${rec.id}`, approval_status: rec.manager_review_required ? "pending_manager_review" : "recorded" });
    return NextResponse.json({ ok: true, data: rec }, { status: 201 });
  }

  if (kind === "reflection") {
    const factors = Array.isArray(body.factors) ? body.factors.map(String) : [];
    const outcomes = Array.isArray(body.outcomes) ? body.outcomes.map(String) : [];
    const rec: PostIncidentReflectionRecord = {
      id: generateId("apr"),
      home_id: session.home_id,
      child_id: session.child_id,
      incident_session_id: session.id,
      completed_by_user_id: user_id,
      antecedents: s(body.antecedents),
      early_warning_signs: s(body.early_warning_signs),
      staff_response: s(body.staff_response),
      what_worked: s(body.what_worked),
      what_did_not_work: s(body.what_did_not_work),
      child_needs_identified: s(body.child_needs_identified),
      environmental_factors: s(body.environmental_factors),
      factors,
      outcomes,
      follow_up_actions: deriveFollowUpActions(factors, outcomes),
      ai_reflective_summary: null,
      manager_review_required: reflectionManagerReview(outcomes),
      created_at: now,
      updated_at: now,
    };
    if (!rec.antecedents && !rec.staff_response && !rec.what_worked) {
      return NextResponse.json({ ok: false, error: "Add at least one reflection before saving." }, { status: 400 });
    }
    rec.ai_reflective_summary = await aiSummaryFor("post-incident reflection", buildReflectionSummary(rec));

    store.caraPostIncidentReflections = store.caraPostIncidentReflections ?? [];
    store.caraPostIncidentReflections.push(rec);
    void persistPostIncidentReflection(rec as unknown as Record<string, unknown>);
    logIncidentAudit({ action_type: "ai_suggestion_accepted", user_id, child_id: session.child_id, source_id: session.id, note: `reflection=${rec.id}`, approval_status: rec.manager_review_required ? "pending_manager_review" : "recorded" });
    return NextResponse.json({ ok: true, data: rec }, { status: 201 });
  }

  return NextResponse.json({ ok: false, error: "Unknown kind." }, { status: 400 });
}
