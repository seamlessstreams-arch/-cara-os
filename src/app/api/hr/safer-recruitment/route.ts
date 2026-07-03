// ══════════════════════════════════════════════════════════════════════════════
// API: /api/hr/safer-recruitment
//
// GET    /api/hr/safer-recruitment?staffId=...    — fetch the current record
//                                                   with the gate evaluation
// PATCH  /api/hr/safer-recruitment                — update individual checks
// POST   /api/hr/safer-recruitment/sign-off       — manager sign-off (records
//                                                   approved_for_unsupervised
//                                                   on the staff profile if the
//                                                   gate is satisfied)
//
// Every read and write is audit-logged in hr_audit_log. Sign-off and senior
// risk acceptance both write to hr_audit_log with explicit event types.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { checkHrAccess, type HrRole } from "@/lib/hr/permissions";
import {
  evaluateSaferRecruitmentGate,
  type SaferRecruitmentRecord,
  type CheckStatus,
} from "@/lib/hr/saferRecruitmentGate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface DbRow {
  id: string;
  staff_id: string;
  home_id: string | null;
  application_form_complete: boolean;
  employment_history_full: boolean;
  gaps_explored: boolean;
  gaps_explanation: string | null;
  identity_check_status: CheckStatus;
  right_to_work_status: CheckStatus;
  enhanced_dbs_status: SaferRecruitmentRecord["enhancedDbsStatus"];
  enhanced_dbs_number: string | null;
  enhanced_dbs_issued: string | null;
  enhanced_dbs_renewal_due: string | null;
  barred_list_check_status: CheckStatus;
  references_received_count: number;
  references_verified_count: number;
  interview_notes_present: boolean;
  values_based_interview_done: boolean;
  qualification_check_done: boolean;
  health_declaration_complete: boolean;
  recruitment_risk_assessment: string | null;
  induction_plan_present: boolean;
  manager_sign_off: boolean;
  manager_signed_off_by: string | null;
  manager_signed_off_at: string | null;
  senior_risk_acceptance: boolean;
  senior_risk_acceptance_text: string | null;
  senior_risk_acceptance_by: string | null;
  senior_risk_acceptance_at: string | null;
  status: SaferRecruitmentRecord["status"];
}

function rowToRecord(row: DbRow): SaferRecruitmentRecord {
  return {
    id: row.id,
    staffId: row.staff_id,
    homeId: row.home_id ?? undefined,
    applicationFormComplete: row.application_form_complete,
    employmentHistoryFull: row.employment_history_full,
    gapsExplored: row.gaps_explored,
    gapsExplanation: row.gaps_explanation ?? undefined,
    identityCheckStatus: row.identity_check_status,
    rightToWorkStatus: row.right_to_work_status,
    enhancedDbsStatus: row.enhanced_dbs_status,
    enhancedDbsNumber: row.enhanced_dbs_number ?? undefined,
    enhancedDbsIssued: row.enhanced_dbs_issued ?? undefined,
    enhancedDbsRenewalDue: row.enhanced_dbs_renewal_due ?? undefined,
    barredListCheckStatus: row.barred_list_check_status,
    referencesReceivedCount: row.references_received_count,
    referencesVerifiedCount: row.references_verified_count,
    interviewNotesPresent: row.interview_notes_present,
    valuesBasedInterviewDone: row.values_based_interview_done,
    qualificationCheckDone: row.qualification_check_done,
    healthDeclarationComplete: row.health_declaration_complete,
    recruitmentRiskAssessment: row.recruitment_risk_assessment ?? undefined,
    inductionPlanPresent: row.induction_plan_present,
    managerSignOff: row.manager_sign_off,
    managerSignedOffBy: row.manager_signed_off_by ?? undefined,
    managerSignedOffAt: row.manager_signed_off_at ?? undefined,
    seniorRiskAcceptance: row.senior_risk_acceptance,
    seniorRiskAcceptanceText: row.senior_risk_acceptance_text ?? undefined,
    seniorRiskAcceptanceBy: row.senior_risk_acceptance_by ?? undefined,
    seniorRiskAcceptanceAt: row.senior_risk_acceptance_at ?? undefined,
    status: row.status,
  };
}

// ─── GET: fetch a record + gate evaluation ──────────────────────────────────

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
  const staffId = searchParams.get("staffId");
  const actorUserId = searchParams.get("actorUserId");
  const actorRole = (searchParams.get("actorRole") ?? "none") as HrRole;

  if (!staffId) {
    return NextResponse.json({ error: "staffId is required" }, { status: 400 });
  }
  if (!actorUserId) {
    return NextResponse.json({ error: "actorUserId is required" }, { status: 400 });
  }

  const access = checkHrAccess(
    { role: actorRole, userId: actorUserId },
    { action: "safer_recruitment.read", staffId },
  );
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("hr_safer_recruitment")
    .select("*")
    .eq("staff_id", staffId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({
      data: { exists: false, record: null, evaluation: null },
    });
  }

  const record = rowToRecord(data as DbRow);
  const evaluation = evaluateSaferRecruitmentGate(record);

  await supabase.from("hr_audit_log").insert({
    id: `hr_aud_${record.id}_view_${Date.now()}`,
    entity_type: "hr_safer_recruitment",
    entity_id: record.id,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    event_type: "viewed",
    event_detail: { outcome: evaluation.outcome },
  });

  return NextResponse.json({ data: { exists: true, record, evaluation } });
}

// ─── PATCH: update individual checks ────────────────────────────────────────

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

  const recordId = body.recordId as string | undefined;
  const staffId = body.staffId as string | undefined;
  const actorUserId = body.actorUserId as string | undefined;
  const actorRole = (body.actorRole as HrRole | undefined) ?? "none";

  if ((!recordId && !staffId) || !actorUserId) {
    return NextResponse.json(
      { error: "recordId or staffId, plus actorUserId, are required" },
      { status: 400 },
    );
  }

  const access = checkHrAccess(
    { role: actorRole, userId: actorUserId },
    { action: "safer_recruitment.update", staffId },
  );
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  // The set of mutable fields. If any are present in the body, they're applied.
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fieldMap: Record<string, string> = {
    applicationFormComplete: "application_form_complete",
    employmentHistoryFull: "employment_history_full",
    gapsExplored: "gaps_explored",
    gapsExplanation: "gaps_explanation",
    identityCheckStatus: "identity_check_status",
    rightToWorkStatus: "right_to_work_status",
    enhancedDbsStatus: "enhanced_dbs_status",
    enhancedDbsNumber: "enhanced_dbs_number",
    enhancedDbsIssued: "enhanced_dbs_issued",
    enhancedDbsRenewalDue: "enhanced_dbs_renewal_due",
    barredListCheckStatus: "barred_list_check_status",
    referencesReceivedCount: "references_received_count",
    referencesVerifiedCount: "references_verified_count",
    interviewNotesPresent: "interview_notes_present",
    valuesBasedInterviewDone: "values_based_interview_done",
    qualificationCheckDone: "qualification_check_done",
    healthDeclarationComplete: "health_declaration_complete",
    recruitmentRiskAssessment: "recruitment_risk_assessment",
    inductionPlanPresent: "induction_plan_present",
    status: "status",
  };
  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (body[camel] !== undefined) updates[snake] = body[camel];
  }

  // Locate the row by recordId or by staffId.
  let row: DbRow | null = null;
  if (recordId) {
    const { data, error } = await supabase
      .from("hr_safer_recruitment")
      .update(updates)
      .eq("id", recordId)
      .select()
      .single();
    if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }
    row = data as DbRow;
  } else if (staffId) {
    // Find existing or create new.
    const { data: existing } = await supabase
      .from("hr_safer_recruitment")
      .select("*")
      .eq("staff_id", staffId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("hr_safer_recruitment")
        .update(updates)
        .eq("id", (existing as DbRow).id)
        .select()
        .single();
      if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }
      row = data as DbRow;
    } else {
      // Bootstrap a new record with whatever fields were supplied.
      const id = `hsr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { data, error } = await supabase
        .from("hr_safer_recruitment")
        .insert({ id, staff_id: staffId, ...updates })
        .select()
        .single();
      if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }
      row = data as DbRow;
    }
  }

  if (!row) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  await supabase.from("hr_audit_log").insert({
    id: `hr_aud_${row.id}_edit_${Date.now()}`,
    entity_type: "hr_safer_recruitment",
    entity_id: row.id,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    event_type: "edited",
    event_detail: { fields: Object.keys(updates).filter((k) => k !== "updated_at") },
  });

  const record = rowToRecord(row);
  const evaluation = evaluateSaferRecruitmentGate(record);

  return NextResponse.json({ data: { record, evaluation } });
}

// ─── POST: sign-off / senior risk acceptance ───────────────────────────────

export async function POST(req: NextRequest) {
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

  const action = body.action as
    | "manager_sign_off"
    | "senior_risk_acceptance"
    | undefined;
  const recordId = body.recordId as string | undefined;
  const actorUserId = body.actorUserId as string | undefined;
  const actorRole = (body.actorRole as HrRole | undefined) ?? "none";

  if (!action || !recordId || !actorUserId) {
    return NextResponse.json(
      { error: "action, recordId, and actorUserId are required" },
      { status: 400 },
    );
  }

  const requiredAction =
    action === "senior_risk_acceptance"
      ? "safer_recruitment.senior_risk_acceptance"
      : "safer_recruitment.sign_off";
  const access = checkHrAccess(
    { role: actorRole, userId: actorUserId },
    { action: requiredAction },
  );
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  // Fetch the current row so we can evaluate the gate against the eventual
  // intended state.
  const { data: existing, error: existingError } = await supabase
    .from("hr_safer_recruitment")
    .select("*")
    .eq("id", recordId)
    .single();
  if (existingError || !existing) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  if (action === "manager_sign_off") {
    updates.manager_sign_off = true;
    updates.manager_signed_off_by = actorUserId;
    updates.manager_signed_off_at = now;
  } else if (action === "senior_risk_acceptance") {
    const text = body.text as string | undefined;
    if (!text || text.trim().length < 30) {
      return NextResponse.json(
        {
          error:
            "senior_risk_acceptance requires 'text' of at least 30 characters explaining the rationale",
        },
        { status: 400 },
      );
    }
    updates.senior_risk_acceptance = true;
    updates.senior_risk_acceptance_text = text;
    updates.senior_risk_acceptance_by = actorUserId;
    updates.senior_risk_acceptance_at = now;
  }

  const { data: updated, error: updateError } = await supabase
    .from("hr_safer_recruitment")
    .update(updates)
    .eq("id", recordId)
    .select()
    .single();
  if (updateError) {
    console.error("[api] server error:", updateError); return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }

  const record = rowToRecord(updated as DbRow);
  const evaluation = evaluateSaferRecruitmentGate(record);

  // If the gate is now satisfied, flip approved_for_unsupervised on the
  // staff profile. This is the actual operational gate.
  if (evaluation.approvedForUnsupervised) {
    await supabase
      .from("hr_staff_profiles")
      .upsert(
        {
          staff_id: record.staffId,
          approved_for_unsupervised: true,
          approved_at: now,
          approved_by: actorUserId,
          approval_notes:
            evaluation.outcome === "approved_with_senior_risk_acceptance"
              ? "Approved via senior risk acceptance. Outstanding checks remain to be closed."
              : "Approved on satisfaction of all mandatory safer recruitment checks.",
          home_id: record.homeId ?? null,
          employment_type: "permanent",
        },
        { onConflict: "staff_id" },
      );
  }

  await supabase.from("hr_audit_log").insert({
    id: `hr_aud_${recordId}_${action}_${Date.now()}`,
    entity_type: "hr_safer_recruitment",
    entity_id: recordId,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    event_type: "signed_off",
    event_detail: {
      action,
      outcome: evaluation.outcome,
      approvedForUnsupervised: evaluation.approvedForUnsupervised,
    },
  });

  return NextResponse.json({ data: { record, evaluation } });
}
