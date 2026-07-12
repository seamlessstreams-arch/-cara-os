// ══════════════════════════════════════════════════════════════════════════════
// API: /api/hr/letters
//
// POST   /api/hr/letters         — generate a letter from template, run it
//                                  through the HR Process Guardian, and persist
//                                  it as an cara_draft on hr_letters
// GET    /api/hr/letters?id=...  — fetch a letter
// GET    /api/hr/letters?caseId=... — list letters for a case
// PATCH  /api/hr/letters         — manager edit / approve / send / withdraw
//
// Letters are gated by the Process Guardian. The letter cannot be approved
// while the Guardian's fairness_judgement is do_not_approve_yet, unless the
// approver is an RI and supplies a senior_risk_acceptance text.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { renderLetterTemplate, type LetterContext } from "@/lib/hr/letterTemplates";
import {
  reviewHrAction,
  type GuardianActionType,
  type GuardianReview,
  ENGINE_VERSION as GUARDIAN_VERSION,
} from "@/lib/cara/hrProcessGuardian";
import { checkHrAccess, type HrRole } from "@/lib/hr/permissions";
import type { HrLetterType } from "@/lib/hr/types";
import { readJsonBody } from "@/lib/http/read-json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

// Map letter_type → guardian action_type. The Guardian doesn't have a
// 1:1 entry for every HR letter type, so we map to the closest equivalent.
const LETTER_TO_GUARDIAN: Record<HrLetterType, GuardianActionType> = {
  investigation_invite: "investigation_invite",
  witness_invite: "witness_invite",
  disciplinary_invite: "disciplinary_invite",
  grievance_invite: "grievance_invite",
  suspension: "suspension",
  suspension_review: "suspension_review",
  no_further_action: "no_further_action",
  informal_concern: "generic_hr_action",
  written_warning: "written_warning",
  final_written_warning: "final_written_warning",
  dismissal: "dismissal",
  appeal_invite: "generic_hr_action",
  appeal_outcome: "appeal_outcome",
  probation_review: "generic_hr_action",
  probation_extension: "probation_outcome",
  probation_confirmation: "probation_outcome",
  failed_probation: "probation_outcome",
  sickness_meeting: "sickness_meeting",
  welfare_meeting: "sickness_meeting",
  occupational_health_referral: "generic_hr_action",
  return_to_work_outcome: "generic_hr_action",
  capability_meeting: "capability_meeting",
  performance_improvement_plan: "generic_hr_action",
  mediation_invite: "generic_hr_action",
  whistleblowing_acknowledgement: "generic_hr_action",
  safeguarding_allegation_holding: "safeguarding_allegation_response",
};

const VALID_LETTER_TYPES = Object.keys(LETTER_TO_GUARDIAN) as HrLetterType[];

// ─── POST: generate and review ──────────────────────────────────────────────

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
    actorUserId,
    actorRole,
    caseId,
    staffId,
    homeId,
    letterType,
    letterContext,
    runGuardian = true,
  } = body as {
    actorUserId?: string;
    actorRole?: HrRole;
    caseId?: string;
    staffId?: string;
    homeId?: string;
    letterType?: HrLetterType;
    letterContext?: LetterContext;
    runGuardian?: boolean;
  };

  if (!actorUserId || !actorRole) {
    return NextResponse.json({ error: "actorUserId and actorRole are required" }, { status: 400 });
  }
  if (!staffId) {
    return NextResponse.json({ error: "staffId is required" }, { status: 400 });
  }
  if (!letterType || !VALID_LETTER_TYPES.includes(letterType)) {
    return NextResponse.json(
      { error: `letterType must be one of: ${VALID_LETTER_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  const access = checkHrAccess(
    { role: actorRole, userId: actorUserId, homeId },
    { action: "letter.draft", homeId, staffId },
  );
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  const draftBody = renderLetterTemplate(letterType, letterContext ?? { recipientName: "[Recipient name]" });

  let guardianReview: GuardianReview | undefined;
  if (runGuardian) {
    try {
      guardianReview = await reviewHrAction({
        caseId,
        staffId,
        homeId,
        draftSubject: `Letter: ${letterType.replace(/_/g, " ")}`,
        draftActionType: LETTER_TO_GUARDIAN[letterType],
        draftBody,
        enableLlm: true,
      });
    } catch (err) {
      return NextResponse.json(
        { error: "Guardian error", detail: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      );
    }
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({
      data: { letter: { draftBody, status: "cara_draft", letterType }, guardianReview, persisted: false },
    });
  }
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({
      data: { letter: { draftBody, status: "cara_draft", letterType }, guardianReview, persisted: false },
    });
  }
  const supabase = loose(supabaseRaw);

  // Persist the Guardian review first (when present), so we can reference it.
  let guardianReviewId: string | null = null;
  if (guardianReview) {
    guardianReviewId = `hpg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await supabase.from("hr_process_guardian_reviews").insert({
      id: guardianReviewId,
      case_id: caseId ?? null,
      staff_id: staffId ?? null,
      home_id: homeId ?? null,
      draft_subject: `Letter: ${letterType.replace(/_/g, " ")}`,
      draft_action_type: LETTER_TO_GUARDIAN[letterType],
      draft_body: draftBody,
      status: "draft",
      fairness_score: guardianReview.fairnessScore,
      fairness_judgement: guardianReview.fairnessJudgement,
      acas_alignment: guardianReview.acasAlignment,
      safeguarding_alignment: guardianReview.safeguardingAlignment,
      discrimination_risk: guardianReview.discriminationRisk,
      proportionality: guardianReview.proportionality,
      rights_check: guardianReview.rightsCheck,
      evidence_quality: guardianReview.evidenceQuality,
      wording_risk: guardianReview.wordingRisk,
      prejudgment_signals: guardianReview.prejudgmentSignals,
      flags: guardianReview.flags,
      suggested_safer_wording: guardianReview.suggestedSaferWording ?? null,
      suggested_actions: guardianReview.suggestedActions,
      regulatory_links: guardianReview.regulatoryLinks,
      cara_confidence: guardianReview.caraConfidence,
      llm_used: guardianReview.llmUsed,
      engine_version: guardianReview.engineVersion,
      generated_at: guardianReview.generatedAt,
    });
    await supabase.from("hr_process_guardian_audit_log").insert({
      id: `hpg_aud_${guardianReviewId}_create`,
      review_id: guardianReviewId,
      actor_user_id: actorUserId,
      actor_role: actorRole,
      event_type: "draft_generated",
      event_detail: {
        engineVersion: GUARDIAN_VERSION,
        triggeredBy: "letter_generator",
        letterType,
      },
    });
  }

  const letterId = `hrl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { error: insertError } = await supabase.from("hr_letters").insert({
    id: letterId,
    case_id: caseId ?? null,
    staff_id: staffId,
    letter_type: letterType,
    status: "cara_draft",
    draft_body: draftBody,
    guardian_review_id: guardianReviewId,
  });

  if (insertError) {
    return NextResponse.json(
      { error: "Persistence error", detail: insertError.message, draftBody, guardianReview },
      { status: 500 },
    );
  }

  await supabase.from("hr_audit_log").insert({
    id: `hr_aud_${letterId}_create`,
    entity_type: "hr_letter",
    entity_id: letterId,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    event_type: "created",
    event_detail: {
      letterType,
      caseId: caseId ?? null,
      staffId,
      guardianReviewId,
      guardianJudgement: guardianReview?.fairnessJudgement,
    },
  });

  return NextResponse.json({
    data: {
      letterId,
      letter: { id: letterId, draftBody, status: "cara_draft", letterType },
      guardianReviewId,
      guardianReview,
      persisted: true,
      caraLabel: "Cara suggested draft",
    },
  });
}

// ─── GET ─────────────────────────────────────────────────────────────────────

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
  const caseId = searchParams.get("caseId");

  if (id) {
    const { data, error } = await supabase
      .from("hr_letters")
      .select("*")
      .eq("id", id)
      .single();
    if (error) { console.error("[api] not-found:", error); return NextResponse.json({ error: "Not found." }, { status: 404 }); }
    return NextResponse.json({ data });
  }
  if (caseId) {
    const { data, error } = await supabase
      .from("hr_letters")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Provide ?id or ?caseId" }, { status: 400 });
}

// ─── PATCH: manager decision ─────────────────────────────────────────────────

const VALID_LETTER_DECISIONS = ["edit", "approve", "send", "withdraw"] as const;
type LetterDecision = (typeof VALID_LETTER_DECISIONS)[number];

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
    letterId,
    decision,
    editedBody,
    seniorRiskAcceptance,
    actorUserId,
    actorRole,
  } = body as {
    letterId?: string;
    decision?: LetterDecision;
    editedBody?: string;
    seniorRiskAcceptance?: string;
    actorUserId?: string;
    actorRole?: HrRole;
  };

  if (!letterId || !actorUserId || !actorRole) {
    return NextResponse.json(
      { error: "letterId, actorUserId, and actorRole are required" },
      { status: 400 },
    );
  }
  if (!decision || !VALID_LETTER_DECISIONS.includes(decision)) {
    return NextResponse.json(
      { error: `decision must be one of: ${VALID_LETTER_DECISIONS.join(", ")}` },
      { status: 400 },
    );
  }

  const requiredAction =
    decision === "send" || decision === "approve" ? "letter.approve" : "letter.draft";
  const access = checkHrAccess({ role: actorRole, userId: actorUserId }, { action: requiredAction });
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  // For approve / send, fetch the linked Guardian review and enforce the gate.
  if (decision === "approve" || decision === "send") {
    const { data: existing, error: existingError } = await supabase
      .from("hr_letters")
      .select("guardian_review_id, status")
      .eq("id", letterId)
      .single();
    if (existingError || !existing) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 });
    }
    if (existing.guardian_review_id) {
      const { data: gr } = await supabase
        .from("hr_process_guardian_reviews")
        .select("fairness_judgement")
        .eq("id", existing.guardian_review_id)
        .single();
      if (gr?.fairness_judgement === "do_not_approve_yet") {
        const isRi = actorRole === "ri";
        if (!isRi || !seniorRiskAcceptance || seniorRiskAcceptance.trim().length < 30) {
          return NextResponse.json(
            {
              error:
                "Process Guardian gate: this letter cannot be approved or sent while the fairness judgement is do_not_approve_yet. An RI may override by supplying a written seniorRiskAcceptance (at least 30 characters) explaining the rationale.",
            },
            { status: 409 },
          );
        }
      }
    }
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };
  let auditEvent = "edited";

  switch (decision) {
    case "edit":
      if (!editedBody) {
        return NextResponse.json({ error: "editedBody is required" }, { status: 400 });
      }
      updates.draft_body = editedBody;
      updates.status = "manager_review";
      auditEvent = "edited";
      break;
    case "approve":
      updates.status = "approved";
      updates.approved_at = now;
      updates.approved_by = actorUserId;
      if (editedBody) updates.approved_body = editedBody;
      auditEvent = "approved";
      break;
    case "send":
      updates.status = "sent";
      updates.sent_at = now;
      auditEvent = "sent";
      break;
    case "withdraw":
      updates.status = "withdrawn";
      auditEvent = "edited";
      break;
  }

  const { data: updated, error: updateError } = await supabase
    .from("hr_letters")
    .update(updates)
    .eq("id", letterId)
    .select()
    .single();
  if (updateError) {
    console.error("[api] server error:", updateError); return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }

  await supabase.from("hr_audit_log").insert({
    id: `hr_aud_${letterId}_${decision}_${Date.now()}`,
    entity_type: "hr_letter",
    entity_id: letterId,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    event_type: auditEvent,
    event_detail: { decision, seniorRiskAcceptanceProvided: !!seniorRiskAcceptance },
  });

  return NextResponse.json({ data: { letter: updated, decision } });
}
