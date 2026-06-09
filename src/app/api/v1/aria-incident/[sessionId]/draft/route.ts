// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA INCIDENT MODE · DRAFT RECORD API
// POST /api/v1/aria-incident/[sessionId]/draft
//   {}                                   → generate draft (deterministic + optional
//                                          ARIA rewrite when an LLM key is set)
//   { accept: true, confirm: true,
//     final_text, ai_suggested_text? }   → staff-confirmed acceptance: preserves
//                                          raw + AI suggestion + final version
//                                          (audit-safe), flags manager review
//
// AI never auto-submits: acceptance requires the staff member's explicit
// confirmation that the record is accurate. Original notes are never hidden.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { generateText } from "@/lib/aria/aria-provider";
import {
  buildDeterministicDraft, computeIncidentQualityGate, ARIA_INCIDENT_SYSTEM_PROMPT,
  INCIDENT_DISCLAIMER, INCIDENT_TYPES, type AriaRecordingReview,
} from "@/lib/aria-incident/aria-incident-engine";
import { findSession, sessionEntries, childName, currentUserId, logIncidentAudit } from "@/lib/aria-incident/incident-service";

export async function POST(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const session = findSession(sessionId);
  if (!session) return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as any;
  const user_id = currentUserId(req);
  const entries = sessionEntries(session.id);
  const gate = computeIncidentQualityGate({ session, entries });
  const name = childName(session.child_id);

  // ── Accept flow (staff-confirmed; audit-safe; never auto-submitted) ──────────
  if (body.accept === true) {
    if (body.confirm !== true) {
      return NextResponse.json({ ok: false, error: "Please confirm the record is accurate before accepting." }, { status: 400 });
    }
    const final_text = String(body.final_text ?? "").trim();
    if (!final_text) return NextResponse.json({ ok: false, error: "The final record text is empty." }, { status: 400 });

    const store = getStore() as any;
    const now = new Date().toISOString();
    const review: AriaRecordingReview = {
      id: generateId("arr"),
      home_id: session.home_id,
      child_id: session.child_id,
      user_id,
      incident_session_id: session.id,
      record_type: "incident_report",
      raw_text: entries.map((e) => `${String(e.timestamp).slice(11, 16)} [${e.entry_type}] ${e.raw_text}`).join("\n"),
      ai_suggested_text: body.ai_suggested_text ? String(body.ai_suggested_text) : null,
      final_accepted_text: final_text,
      ai_quality_flags: gate.missing,
      staff_accepted: true,
      accepted_at: now,
      manager_review_required: true,
      manager_reviewed_by: null,
      manager_reviewed_at: null,
      created_at: now,
      updated_at: now,
    };
    store.ariaRecordingReviews = store.ariaRecordingReviews ?? [];
    store.ariaRecordingReviews.push(review);
    session.final_record_created = true;
    session.incident_status = "record_created";
    session.updated_at = now;
    logIncidentAudit({ action_type: "ai_suggestion_accepted", user_id, child_id: session.child_id, source_id: session.id, note: `review=${review.id} (raw + AI + final preserved)`, approval_status: "pending_manager_review" });
    return NextResponse.json({ ok: true, data: { review_id: review.id, manager_review_required: true } }, { status: 201 });
  }

  // ── Generate flow ─────────────────────────────────────────────────────────────
  const deterministic = buildDeterministicDraft({ session, entries, child_name: name });
  const label = INCIDENT_TYPES.find((t) => t.key === session.incident_type)?.label ?? session.incident_type;

  const facts = [
    `Incident type: ${label}. Child: ${name}.`,
    `Started ${session.started_at}${session.ended_at ? `, ended ${session.ended_at}` : ""}. Risk recorded: ${session.immediate_risk_level}. Manager notified: ${session.manager_notified ? "yes" : "no"}.`,
    "Timeline (verbatim staff notes — the ONLY source of facts):",
    ...entries.map((e) => `${String(e.timestamp).slice(11, 16)} [${e.entry_type}] ${e.raw_text}`),
  ].join("\n");

  const result = await generateText({
    systemPrompt: ARIA_INCIDENT_SYSTEM_PROMPT,
    userPrompt: facts,
    temperature: 0.3,
    maxOutputTokens: 900,
  });
  const llmUsed = result.llmUsed && !!result.text?.trim();
  if (llmUsed) {
    logIncidentAudit({ action_type: "ai_record_rewrite_generated", user_id, child_id: session.child_id, source_id: session.id, note: "draft rewrite generated (server-side)" });
  }

  return NextResponse.json({
    data: {
      deterministic_draft: deterministic,
      ai_draft: llmUsed ? result.text.trim() : null,
      llmUsed,
      llm_message: llmUsed ? null : "ARIA's AI rewrite isn't configured in this environment — the factual draft below is assembled from your timeline and is complete on its own.",
      gate,
      disclaimer: INCIDENT_DISCLAIMER,
    },
  });
}
