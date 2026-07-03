// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/management-oversight
//
// POST    /api/cara/management-oversight             — analyse a record, persist
//                                                       a draft oversight review
// GET     /api/cara/management-oversight?id=...      — fetch a single review
// GET     /api/cara/management-oversight?recordId=.. — fetch reviews for a record
// PATCH   /api/cara/management-oversight             — manager edit / approve /
//                                                       reject / request rewrite
//
// All approvals, edits, rejections and rewrite requests are written to
// oversight_audit_log.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  analyseRecord,
  type OversightInput,
  type OversightReview,
  type RecordType,
  ENGINE_VERSION,
} from "@/lib/cara/managementOversightEngine";

// Tables in this module are not yet in the generated Database type, so we use
// a loosely-typed client wrapper. The schema is enforced by migration 010 +
// SQL constraints rather than by the TypeScript types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

const VALID_RECORD_TYPES: RecordType[] = [
  "daily_log",
  "shift_debrief",
  "incident_report",
  "missing_from_care",
  "disclosure",
  "safeguarding",
  "medication",
  "key_work",
  "education",
  "health",
  "complaint",
  "consequence_restorative",
  "room_search",
  "family_time",
];

const VALID_DECISIONS = ["approve", "edit", "reject", "request_rewrite"] as const;
type Decision = (typeof VALID_DECISIONS)[number];

// ─── POST: analyse a record ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    recordId,
    recordType,
    recordText,
    recordDate,
    childId,
    childPseudonym,
    homeId,
    authorRole,
    authorName,
    knownChildContext,
    enableLlm,
    persist = true,
    actorUserId,
  } = body as Partial<OversightInput> & {
    persist?: boolean;
    actorUserId?: string;
  };

  if (!recordId || typeof recordId !== "string") {
    return NextResponse.json({ error: "recordId is required" }, { status: 400 });
  }
  if (!recordType || !VALID_RECORD_TYPES.includes(recordType as RecordType)) {
    return NextResponse.json(
      { error: `recordType must be one of: ${VALID_RECORD_TYPES.join(", ")}` },
      { status: 400 },
    );
  }
  if (!recordText || typeof recordText !== "string" || recordText.trim().length === 0) {
    return NextResponse.json(
      { error: "recordText is required and must be non-empty" },
      { status: 400 },
    );
  }

  const input: OversightInput = {
    recordId,
    recordType: recordType as RecordType,
    recordText,
    recordDate,
    childId,
    childPseudonym,
    homeId,
    authorRole,
    authorName,
    knownChildContext,
    enableLlm,
  };

  let review: OversightReview;
  try {
    review = await analyseRecord(input);
  } catch (err) {
    return NextResponse.json(
      { error: "Engine error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  if (!persist || !isSupabaseEnabled()) {
    return NextResponse.json({
      data: { review, persisted: false, caraLabel: review.caraLabel },
    });
  }

  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({
      data: { review, persisted: false, caraLabel: review.caraLabel },
    });
  }
  const supabase = loose(supabaseRaw);

  const reviewId = `mor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { error: insertError } = await supabase
    .from("oversight_reviews")
    .insert({
      id: reviewId,
      record_id: review.recordId,
      record_type: review.recordType,
      child_id: input.childId ?? null,
      home_id: input.homeId ?? null,
      status: "draft",
      oversight_draft: review.oversightDraft,
      ofsted_summary: review.ofstedSummary,
      quality_score: review.qualityScore,
      risk_level: review.riskLevel,
      practice_judgement: review.practiceJudgement,
      child_voice_visible: review.childVoiceVisible,
      plan_links_visible: review.planLinksVisible,
      plan_links: review.planLinks,
      requires_manager_escalation: review.requiresManagerEscalation,
      escalation_reason: review.escalationReason ?? null,
      missing_evidence: review.missingEvidence,
      strengths: review.strengths,
      regulatory_links: review.regulatoryLinks,
      cara_confidence: review.caraConfidence,
      llm_used: review.llmUsed,
      engine_version: review.engineVersion,
      generated_at: review.generatedAt,
    });

  if (insertError) {
    return NextResponse.json(
      { error: "Persistence error", detail: insertError.message, review },
      { status: 500 },
    );
  }

  // Persist suggested actions (manager can later promote them to real tasks).
  if (review.suggestedActions.length > 0) {
    const { error: actionError } = await supabase
      .from("oversight_actions")
      .insert(
        review.suggestedActions.map((a, idx) => ({
          id: `moa_${reviewId}_${idx}`,
          review_id: reviewId,
          title: a.title,
          description: a.description,
          priority: a.priority,
          due_days: a.dueDays,
          assigned_role: a.assignedRole,
          approved: false,
        })),
      );
    if (actionError) {
      console.warn("[management-oversight] action persist warning:", actionError.message);
    }
  }

  // Audit log: record creation event.
  await supabase.from("oversight_audit_log").insert({
    id: `aud_${reviewId}_create`,
    review_id: reviewId,
    actor_user_id: actorUserId ?? null,
    actor_role: "system",
    event_type: "draft_generated",
    event_detail: {
      engineVersion: ENGINE_VERSION,
      llmUsed: review.llmUsed,
      qualityScore: review.qualityScore,
      riskLevel: review.riskLevel,
    },
  });

  return NextResponse.json({
    data: {
      reviewId,
      review,
      persisted: true,
      caraLabel: review.caraLabel,
    },
  });
}

// ─── GET: fetch reviews ──────────────────────────────────────────────────────

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
  const recordId = searchParams.get("recordId");

  if (id) {
    const { data, error } = await supabase
      .from("oversight_reviews")
      .select("*, oversight_actions(*)")
      .eq("id", id)
      .single();
    if (error) { console.error("[api] not-found:", error); return NextResponse.json({ error: "Not found." }, { status: 404 }); }
    return NextResponse.json({ data });
  }

  if (recordId) {
    const { data, error } = await supabase
      .from("oversight_reviews")
      .select("*, oversight_actions(*)")
      .eq("record_id", recordId)
      .order("generated_at", { ascending: false });
    if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Provide ?id or ?recordId" }, { status: 400 });
}

// ─── PATCH: manager decision (approve / edit / reject / request_rewrite) ─────

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
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    reviewId,
    decision,
    editedOversight,
    editedSummary,
    rejectionReason,
    rewriteInstructions,
    actorUserId,
    actorRole,
  } = body as {
    reviewId?: string;
    decision?: Decision;
    editedOversight?: string;
    editedSummary?: string;
    rejectionReason?: string;
    rewriteInstructions?: string;
    actorUserId?: string;
    actorRole?: string;
  };

  if (!reviewId) {
    return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
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
      if (editedOversight) {
        updates.oversight_draft = editedOversight;
        eventDetail.editedOnApproval = true;
      }
      if (editedSummary) updates.ofsted_summary = editedSummary;
      eventType = "approved";
      break;

    case "edit":
      if (!editedOversight && !editedSummary) {
        return NextResponse.json(
          { error: "Provide editedOversight or editedSummary" },
          { status: 400 },
        );
      }
      updates.status = "draft";
      if (editedOversight) updates.oversight_draft = editedOversight;
      if (editedSummary) updates.ofsted_summary = editedSummary;
      eventType = "edited";
      eventDetail.editedFields = [
        ...(editedOversight ? ["oversight_draft"] : []),
        ...(editedSummary ? ["ofsted_summary"] : []),
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
    .from("oversight_reviews")
    .update(updates)
    .eq("id", reviewId)
    .select()
    .single();

  if (updateError) {
    console.error("[api] server error:", updateError); return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }

  await supabase.from("oversight_audit_log").insert({
    id: `aud_${reviewId}_${eventType}_${Date.now()}`,
    review_id: reviewId,
    actor_user_id: actorUserId,
    actor_role: actorRole ?? null,
    event_type: eventType,
    event_detail: eventDetail,
  });

  return NextResponse.json({ data: { review: updated, decision } });
}
