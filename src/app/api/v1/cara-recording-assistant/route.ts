// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara RECORDING ASSISTANT API (standalone, any record type)
// GET  /api/v1/cara-recording-assistant → record types, children, recent records
// POST /api/v1/cara-recording-assistant
//        { raw_text, record_type, child_id }            → analyse + optional Cara
//                                                         rewrite (drafts only)
//        { accept: true, confirm: true, raw_text,
//          final_text, ai_suggested_text?, ... }        → save audit-safe record
//
// Raw note, AI suggestion and final accepted version are ALL preserved (the
// existing caraRecordingReviews collection from Incident Mode is reused — one
// audit-safe pipeline for every AI-assisted record). Sensitive record types and
// judgemental-language flags force manager review.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { persistRecordingReview } from "@/lib/supabase/incident-persist";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { generateText } from "@/lib/cara/cara-provider";
import { analyseRecordingQuality, RECORD_TYPES, RECORDING_DISCLAIMER } from "@/lib/cara-incident/recording-assistant-engine";
import { CARA_INCIDENT_SYSTEM_PROMPT, type CaraRecordingReview } from "@/lib/cara-incident/cara-incident-engine";
import { currentUserId, logIncidentAudit, childName, staffNameOf } from "@/lib/cara-incident/incident-service";

const SENSITIVE_TYPES = new Set(["incident_report", "physical_intervention", "missing_from_home", "safeguarding_update", "risk_assessment_update"]);

export async function GET() {
  const store = getStore() as any;
  const recent = ((store.caraRecordingReviews ?? []) as CaraRecordingReview[])
    .slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 10)
    .map((r) => ({ ...r, child_name: childName(r.child_id), staff_name: staffNameOf(r.user_id) }));
  const children = ((store.youngPeople ?? []) as any[])
    .filter((c) => c.status === "current")
    .map((c) => ({ id: c.id, name: c.preferred_name || [c.first_name, c.last_name].filter(Boolean).join(" ") }));
  return NextResponse.json({ data: { record_types: RECORD_TYPES, children, recent, disclaimer: RECORDING_DISCLAIMER } });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as any;
  const user_id = currentUserId(req);
  const raw_text = String(body.raw_text ?? "").trim();
  const record_type = RECORD_TYPES.some((t) => t.key === body.record_type) ? String(body.record_type) : "other";
  const child_id = String(body.child_id ?? "").trim();

  if (!raw_text) return NextResponse.json({ ok: false, error: "Write your note first." }, { status: 400 });
  const analysis = analyseRecordingQuality(raw_text);
  const manager_review_required = SENSITIVE_TYPES.has(record_type) || analysis.judgemental_language_detected.length > 0;

  // ── Accept flow ───────────────────────────────────────────────────────────────
  if (body.accept === true) {
    if (body.confirm !== true) return NextResponse.json({ ok: false, error: "Please confirm the record is accurate before accepting." }, { status: 400 });
    if (!child_id) return NextResponse.json({ ok: false, error: "Select the child this record is about." }, { status: 400 });
    const final_text = String(body.final_text ?? "").trim();
    if (!final_text) return NextResponse.json({ ok: false, error: "The final record text is empty." }, { status: 400 });

    const store = getStore() as any;
    const now = new Date().toISOString();
    const review: CaraRecordingReview = {
      id: generateId("arr"),
      home_id: "home_oak",
      child_id,
      user_id,
      incident_session_id: null,
      record_type,
      raw_text,
      ai_suggested_text: body.ai_suggested_text ? String(body.ai_suggested_text) : null,
      final_accepted_text: final_text,
      ai_quality_flags: analysis.flags,
      staff_accepted: true,
      accepted_at: now,
      manager_review_required,
      manager_reviewed_by: null,
      manager_reviewed_at: null,
      created_at: now,
      updated_at: now,
    };
    store.caraRecordingReviews = store.caraRecordingReviews ?? [];
    store.caraRecordingReviews.push(review);
    void persistRecordingReview(review as unknown as Record<string, unknown>);
    logIncidentAudit({ action_type: "ai_suggestion_accepted", user_id, child_id, source_id: review.id, note: `recording-assistant type=${record_type}`, approval_status: manager_review_required ? "pending_manager_review" : "recorded" });
    return NextResponse.json({ ok: true, data: { review_id: review.id, manager_review_required } }, { status: 201 });
  }

  // ── Analyse flow ──────────────────────────────────────────────────────────────
  const result = await generateText({
    systemPrompt: CARA_INCIDENT_SYSTEM_PROMPT,
    userPrompt: `Record type: ${record_type.replace(/_/g, " ")}.\nRaw staff note (the ONLY source of facts):\n${raw_text}`,
    temperature: 0.3,
    maxOutputTokens: 700,
  });
  const llmUsed = result.llmUsed && !!result.text?.trim();
  if (llmUsed) logIncidentAudit({ action_type: "ai_record_rewrite_generated", user_id, child_id: child_id || undefined, note: `recording-assistant type=${record_type}` });

  return NextResponse.json({
    data: {
      analysis,
      manager_review_required,
      ai_draft: llmUsed ? result.text.trim() : null,
      llmUsed,
      llm_message: llmUsed ? null : "Cara's AI rewrite isn't configured in this environment — use the quality checks and guidance below to improve the note yourself.",
      disclaimer: RECORDING_DISCLAIMER,
    },
  });
}
