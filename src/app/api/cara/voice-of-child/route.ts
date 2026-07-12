// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/voice-of-child
//
// POST    /api/cara/voice-of-child                 — summarise voice across a
//                                                    batch of records, persist
//                                                    a draft summary
// GET     /api/cara/voice-of-child?id=...          — fetch a single summary
// GET     /api/cara/voice-of-child?childId=...     — list summaries for a child
// PATCH   /api/cara/voice-of-child                 — manager edit / approve /
//                                                    reject / request rewrite
//
// Every state change is audit-logged in voice_summary_audit_log.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  summariseVoice,
  type VoiceSummaryInput,
  type VoiceSummary,
  type SourceRecord,
  ENGINE_VERSION,
} from "@/lib/cara/voiceOfChildSummariser";
import { readJsonBody } from "@/lib/http/read-json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

const VALID_DECISIONS = ["approve", "edit", "reject", "request_rewrite"] as const;
type Decision = (typeof VALID_DECISIONS)[number];

// ─── POST: analyse + persist ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed2 = await readJsonBody(req);
    if (!__parsed2.ok) return __parsed2.response;
    body = __parsed2.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    childId,
    childPseudonym,
    homeId,
    periodStart,
    periodEnd,
    records,
    knownChildContext,
    enableLlm,
    persist = true,
    actorUserId,
  } = body as Partial<VoiceSummaryInput> & {
    persist?: boolean;
    actorUserId?: string;
  };

  if (!childId || typeof childId !== "string") {
    return NextResponse.json({ error: "childId is required" }, { status: 400 });
  }
  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json(
      { error: "records must be a non-empty array of SourceRecord" },
      { status: 400 },
    );
  }

  // Lightweight validation of each record — engine will throw on bad shapes too.
  for (const r of records as SourceRecord[]) {
    if (!r.recordId || !r.recordType || !r.recordDate || !r.recordText) {
      return NextResponse.json(
        {
          error:
            "Each record must include recordId, recordType, recordDate and recordText",
        },
        { status: 400 },
      );
    }
  }

  const input: VoiceSummaryInput = {
    childId,
    childPseudonym,
    homeId,
    periodStart,
    periodEnd,
    records: records as SourceRecord[],
    knownChildContext,
    enableLlm,
  };

  let summary: VoiceSummary;
  try {
    summary = await summariseVoice(input);
  } catch (err) {
    return NextResponse.json(
      { error: "Engine error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  if (!persist || !isSupabaseEnabled()) {
    return NextResponse.json({
      data: { summary, persisted: false, caraLabel: summary.caraLabel },
    });
  }

  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({
      data: { summary, persisted: false, caraLabel: summary.caraLabel },
    });
  }
  const supabase = loose(supabaseRaw);

  const summaryId = `voc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { error: insertError } = await supabase
    .from("voice_summaries")
    .insert({
      id: summaryId,
      child_id: input.childId,
      child_pseudonym: input.childPseudonym ?? null,
      home_id: input.homeId ?? null,
      status: "draft",
      narrative_draft: summary.narrativeDraft,
      ofsted_summary: summary.ofstedSummary,
      themes_present: summary.themesPresent,
      themes_absent: summary.themesAbsent,
      direct_quotes: summary.directQuotes,
      paraphrased_expressions: summary.paraphrasedExpressions,
      what_child_appears_to_want: summary.whatChildAppearsToWant,
      what_child_appears_to_need: summary.whatChildAppearsToNeed,
      what_child_appears_to_fear: summary.whatChildAppearsToFear,
      rights_or_wishes_unmet: summary.rightsOrWishesUnmet,
      per_record_contributions: summary.perRecordContributions,
      overall_voice_capture_quality: summary.overallVoiceCaptureQuality,
      suggested_actions: summary.suggestedActionsToStrengthenVoice,
      regulatory_links: summary.regulatoryLinks,
      records_considered: summary.recordsConsidered,
      period_start: summary.periodStart ?? null,
      period_end: summary.periodEnd ?? null,
      cara_confidence: summary.caraConfidence,
      llm_used: summary.llmUsed,
      engine_version: summary.engineVersion,
      generated_at: summary.generatedAt,
    });

  if (insertError) {
    return NextResponse.json(
      { error: "Persistence error", detail: insertError.message, summary },
      { status: 500 },
    );
  }

  await supabase.from("voice_summary_audit_log").insert({
    id: `vaud_${summaryId}_create`,
    summary_id: summaryId,
    actor_user_id: actorUserId ?? null,
    actor_role: "system",
    event_type: "draft_generated",
    event_detail: {
      engineVersion: ENGINE_VERSION,
      llmUsed: summary.llmUsed,
      recordsConsidered: summary.recordsConsidered,
      overallVoiceCaptureQuality: summary.overallVoiceCaptureQuality,
    },
  });

  return NextResponse.json({
    data: {
      summaryId,
      summary,
      persisted: true,
      caraLabel: summary.caraLabel,
    },
  });
}

// ─── GET: fetch summaries ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ error: "Database persistence is not configured. Enable Supabase to use this feature, or use the in-memory demo mode.", configured: false, supabaseRequired: true }, { status: 503 });
  }
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({ error: "Database persistence is not configured. Enable Supabase to use this feature, or use the in-memory demo mode.", configured: false, supabaseRequired: true }, { status: 503 });
  }
  const supabase = loose(supabaseRaw);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const childId = searchParams.get("childId");

  if (id) {
    const { data, error } = await supabase
      .from("voice_summaries")
      .select("*, voice_summary_audit_log(*)")
      .eq("id", id)
      .single();
    if (error) { console.error("[api] not-found:", error); return NextResponse.json({ error: "Not found." }, { status: 404 }); }
    return NextResponse.json({ data });
  }

  if (childId) {
    const { data, error } = await supabase
      .from("voice_summaries")
      .select("id, status, generated_at, overall_voice_capture_quality, records_considered, period_start, period_end")
      .eq("child_id", childId)
      .order("generated_at", { ascending: false });
    if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Provide ?id or ?childId" }, { status: 400 });
}

// ─── PATCH: manager decision ─────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ error: "Database persistence is not configured. Enable Supabase to use this feature, or use the in-memory demo mode.", configured: false, supabaseRequired: true }, { status: 503 });
  }
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({ error: "Database persistence is not configured. Enable Supabase to use this feature, or use the in-memory demo mode.", configured: false, supabaseRequired: true }, { status: 503 });
  }
  const supabase = loose(supabaseRaw);

  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    summaryId,
    decision,
    editedNarrative,
    editedOfstedSummary,
    rejectionReason,
    rewriteInstructions,
    actorUserId,
    actorRole,
  } = body as {
    summaryId?: string;
    decision?: Decision;
    editedNarrative?: string;
    editedOfstedSummary?: string;
    rejectionReason?: string;
    rewriteInstructions?: string;
    actorUserId?: string;
    actorRole?: string;
  };

  if (!summaryId) {
    return NextResponse.json({ error: "summaryId is required" }, { status: 400 });
  }
  if (!decision || !VALID_DECISIONS.includes(decision)) {
    return NextResponse.json(
      { error: `decision must be one of: ${VALID_DECISIONS.join(", ")}` },
      { status: 400 },
    );
  }
  if (!actorUserId) {
    return NextResponse.json(
      { error: "actorUserId is required — every decision must be auditable" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };
  let eventType = "decision";
  const eventDetail: Record<string, unknown> = { decision };

  switch (decision) {
    case "approve":
      updates.status = "approved";
      updates.approved_at = now;
      updates.approved_by = actorUserId;
      if (editedNarrative) {
        updates.narrative_draft = editedNarrative;
        eventDetail.editedOnApproval = true;
      }
      if (editedOfstedSummary) updates.ofsted_summary = editedOfstedSummary;
      eventType = "approved";
      break;
    case "edit":
      if (!editedNarrative && !editedOfstedSummary) {
        return NextResponse.json(
          { error: "Provide editedNarrative or editedOfstedSummary" },
          { status: 400 },
        );
      }
      updates.status = "draft";
      if (editedNarrative) updates.narrative_draft = editedNarrative;
      if (editedOfstedSummary) updates.ofsted_summary = editedOfstedSummary;
      eventType = "edited";
      eventDetail.editedFields = [
        ...(editedNarrative ? ["narrative_draft"] : []),
        ...(editedOfstedSummary ? ["ofsted_summary"] : []),
      ];
      break;
    case "reject":
      if (!rejectionReason) {
        return NextResponse.json({ error: "rejectionReason is required" }, { status: 400 });
      }
      updates.status = "rejected";
      updates.rejection_reason = rejectionReason;
      updates.rejected_at = now;
      updates.rejected_by = actorUserId;
      eventType = "rejected";
      eventDetail.rejectionReason = rejectionReason;
      break;
    case "request_rewrite":
      if (!rewriteInstructions) {
        return NextResponse.json({ error: "rewriteInstructions is required" }, { status: 400 });
      }
      updates.status = "rewrite_requested";
      updates.rewrite_instructions = rewriteInstructions;
      eventType = "rewrite_requested";
      eventDetail.rewriteInstructions = rewriteInstructions;
      break;
  }

  const { data: updated, error: updateError } = await supabase
    .from("voice_summaries")
    .update(updates)
    .eq("id", summaryId)
    .select()
    .single();

  if (updateError) {
    console.error("[api] server error:", updateError); return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }

  await supabase.from("voice_summary_audit_log").insert({
    id: `vaud_${summaryId}_${eventType}_${Date.now()}`,
    summary_id: summaryId,
    actor_user_id: actorUserId,
    actor_role: actorRole ?? null,
    event_type: eventType,
    event_detail: eventDetail,
  });

  return NextResponse.json({ data: { summary: updated, decision } });
}
