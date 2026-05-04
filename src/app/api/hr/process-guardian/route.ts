// ══════════════════════════════════════════════════════════════════════════════
// API: /api/hr/process-guardian
//
// POST    /api/hr/process-guardian              — review a draft HR action,
//                                                 persist a draft Guardian
//                                                 review
// GET     /api/hr/process-guardian?id=...       — fetch a single review
// GET     /api/hr/process-guardian?caseId=...   — list reviews for a case
// PATCH   /api/hr/process-guardian              — manager edit / approve /
//                                                 reject / request rewrite
//
// Every state change is audit-logged in hr_process_guardian_audit_log.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  reviewHrAction,
  type GuardianInput,
  type GuardianReview,
  type GuardianActionType,
  ENGINE_VERSION,
} from "@/lib/aria/hrProcessGuardian";
import { checkHrAccess, type HrRole } from "@/lib/hr/permissions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

const VALID_DECISIONS = ["approve", "edit", "reject", "request_rewrite"] as const;
type Decision = (typeof VALID_DECISIONS)[number];

const VALID_ACTION_TYPES: GuardianActionType[] = [
  "investigation_invite",
  "witness_invite",
  "disciplinary_invite",
  "grievance_invite",
  "suspension",
  "suspension_review",
  "written_warning",
  "final_written_warning",
  "dismissal",
  "appeal_outcome",
  "probation_outcome",
  "sickness_meeting",
  "capability_meeting",
  "no_further_action",
  "safeguarding_allegation_response",
  "generic_hr_action",
];

// ─── POST: review and persist ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    caseId,
    staffId,
    homeId,
    draftSubject,
    draftActionType,
    draftBody,
    caseContext,
    enableLlm,
    persist = true,
    actorUserId,
    actorRole,
  } = body as Partial<GuardianInput> & {
    persist?: boolean;
    actorUserId?: string;
    actorRole?: HrRole;
  };

  if (!actorUserId) {
    return NextResponse.json({ error: "actorUserId is required" }, { status: 400 });
  }
  if (!actorRole) {
    return NextResponse.json({ error: "actorRole is required" }, { status: 400 });
  }
  if (!draftSubject || !draftBody) {
    return NextResponse.json({ error: "draftSubject and draftBody are required" }, { status: 400 });
  }
  if (!draftActionType || !VALID_ACTION_TYPES.includes(draftActionType as GuardianActionType)) {
    return NextResponse.json(
      { error: `draftActionType must be one of: ${VALID_ACTION_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  const access = checkHrAccess(
    { role: actorRole, userId: actorUserId, homeId },
    { action: "guardian.run", homeId, staffId },
  );
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  const input: GuardianInput = {
    caseId,
    staffId,
    homeId,
    draftSubject,
    draftActionType: draftActionType as GuardianActionType,
    draftBody,
    caseContext,
    enableLlm,
  };

  let review: GuardianReview;
  try {
    review = await reviewHrAction(input);
  } catch (err) {
    return NextResponse.json(
      { error: "Engine error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  if (!persist || !isSupabaseEnabled()) {
    return NextResponse.json({
      data: { review, persisted: false, ariaLabel: review.ariaLabel },
    });
  }

  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({
      data: { review, persisted: false, ariaLabel: review.ariaLabel },
    });
  }
  const supabase = loose(supabaseRaw);

  const reviewId = `hpg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { error: insertError } = await supabase.from("hr_process_guardian_reviews").insert({
    id: reviewId,
    case_id: caseId ?? null,
    staff_id: staffId ?? null,
    home_id: homeId ?? null,
    draft_subject: draftSubject,
    draft_action_type: draftActionType,
    draft_body: draftBody,
    status: "draft",
    fairness_score: review.fairnessScore,
    fairness_judgement: review.fairnessJudgement,
    acas_alignment: review.acasAlignment,
    safeguarding_alignment: review.safeguardingAlignment,
    discrimination_risk: review.discriminationRisk,
    proportionality: review.proportionality,
    rights_check: review.rightsCheck,
    evidence_quality: review.evidenceQuality,
    wording_risk: review.wordingRisk,
    prejudgment_signals: review.prejudgmentSignals,
    flags: review.flags,
    suggested_safer_wording: review.suggestedSaferWording ?? null,
    suggested_actions: review.suggestedActions,
    regulatory_links: review.regulatoryLinks,
    aria_confidence: review.ariaConfidence,
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

  await supabase.from("hr_process_guardian_audit_log").insert({
    id: `hpg_aud_${reviewId}_create`,
    review_id: reviewId,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    event_type: "draft_generated",
    event_detail: {
      engineVersion: ENGINE_VERSION,
      llmUsed: review.llmUsed,
      fairnessScore: review.fairnessScore,
      fairnessJudgement: review.fairnessJudgement,
      flagsBlocking: review.flags.filter((f) => f.severity === "block").length,
    },
  });

  await supabase.from("hr_audit_log").insert({
    id: `hr_aud_${reviewId}_create`,
    entity_type: "hr_process_guardian_review",
    entity_id: reviewId,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    event_type: "created",
    event_detail: {
      caseId: caseId ?? null,
      staffId: staffId ?? null,
      draftActionType,
      fairnessJudgement: review.fairnessJudgement,
    },
  });

  return NextResponse.json({
    data: { reviewId, review, persisted: true, ariaLabel: review.ariaLabel },
  });
}

// ─── GET: fetch ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ error: "Persistence not configured" }, { status: 501 });
  }
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({ error: "Persistence not configured" }, { status: 501 });
  }
  const supabase = loose(supabaseRaw);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const caseId = searchParams.get("caseId");

  if (id) {
    const { data, error } = await supabase
      .from("hr_process_guardian_reviews")
      .select("*, hr_process_guardian_audit_log(*)")
      .eq("id", id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ data });
  }

  if (caseId) {
    const { data, error } = await supabase
      .from("hr_process_guardian_reviews")
      .select("*")
      .eq("case_id", caseId)
      .order("generated_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Provide ?id or ?caseId" }, { status: 400 });
}

// ─── PATCH: manager decision ─────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ error: "Persistence not configured" }, { status: 501 });
  }
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({ error: "Persistence not configured" }, { status: 501 });
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
    editedSaferWording,
    rejectionReason,
    rewriteInstructions,
    actorUserId,
    actorRole,
  } = body as {
    reviewId?: string;
    decision?: Decision;
    editedSaferWording?: string;
    rejectionReason?: string;
    rewriteInstructions?: string;
    actorUserId?: string;
    actorRole?: HrRole;
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
    return NextResponse.json({ error: "actorUserId is required" }, { status: 400 });
  }
  if (!actorRole) {
    return NextResponse.json({ error: "actorRole is required" }, { status: 400 });
  }

  const access = checkHrAccess(
    { role: actorRole, userId: actorUserId },
    { action: decision === "approve" ? "guardian.approve" : decision === "reject" ? "guardian.reject" : "guardian.run" },
  );
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
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
      if (editedSaferWording) {
        updates.suggested_safer_wording = editedSaferWording;
        eventDetail.editedOnApproval = true;
      }
      eventType = "approved";
      break;
    case "edit":
      if (!editedSaferWording) {
        return NextResponse.json({ error: "editedSaferWording is required" }, { status: 400 });
      }
      updates.status = "draft";
      updates.suggested_safer_wording = editedSaferWording;
      eventType = "edited";
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
    .from("hr_process_guardian_reviews")
    .update(updates)
    .eq("id", reviewId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("hr_process_guardian_audit_log").insert({
    id: `hpg_aud_${reviewId}_${eventType}_${Date.now()}`,
    review_id: reviewId,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    event_type: eventType,
    event_detail: eventDetail,
  });

  await supabase.from("hr_audit_log").insert({
    id: `hr_aud_${reviewId}_${eventType}_${Date.now()}`,
    entity_type: "hr_process_guardian_review",
    entity_id: reviewId,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    event_type: eventType === "approved" ? "approved" : eventType === "rejected" ? "rejected" : "edited",
    event_detail: eventDetail,
  });

  return NextResponse.json({ data: { review: updated, decision } });
}
