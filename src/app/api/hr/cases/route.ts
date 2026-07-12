// ══════════════════════════════════════════════════════════════════════════════
// API: /api/hr/cases
//
// POST    /api/hr/cases             — open a new HR case
// GET     /api/hr/cases?id=...      — fetch a single case (with actions and chronology)
// GET     /api/hr/cases?staffId=... — list cases for a staff member
// GET     /api/hr/cases?homeId=...  — list cases for a home (RM/RI/HR admin)
// PATCH   /api/hr/cases             — update case (status, risk, closure, oversight)
//
// Every read and write is audit-logged in hr_audit_log.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { checkHrAccess, type HrRole } from "@/lib/hr/permissions";
import type {
  HrCase,
  HrCaseType,
  HrRiskLevel,
  HrSafeguardingStatus,
  HrChildImpactStatus,
  HrCaseStatus,
} from "@/lib/hr/types";
import { readJsonBody } from "@/lib/http/read-json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

const VALID_CASE_TYPES: HrCaseType[] = [
  "disciplinary", "grievance", "capability", "sickness_absence", "probation",
  "conduct", "gross_misconduct", "bullying_harassment", "whistleblowing",
  "suspension", "safeguarding_allegation", "professional_boundaries",
  "medication_error", "poor_recording", "staff_conflict", "union_involvement",
  "appeal", "informal_concern", "restorative",
];

const SAFEGUARDING_TRIGGERING_TYPES = new Set<HrCaseType>([
  "safeguarding_allegation",
  "gross_misconduct",
  "professional_boundaries",
  "medication_error",
]);

// ─── POST: open a case ───────────────────────────────────────────────────────

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
    const __parsed2 = await readJsonBody(req);
    if (!__parsed2.ok) return __parsed2.response;
    body = __parsed2.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    staffId,
    homeId,
    caseType,
    caseOwner,
    concernSummary,
    riskLevel,
    safeguardingStatus,
    childImpactStatus,
    actorUserId,
    actorRole,
  } = body as Partial<HrCase> & { actorUserId?: string; actorRole?: HrRole };

  if (!actorUserId || !actorRole) {
    return NextResponse.json({ error: "actorUserId and actorRole are required" }, { status: 400 });
  }
  if (!staffId || typeof staffId !== "string") {
    return NextResponse.json({ error: "staffId is required" }, { status: 400 });
  }
  if (!caseType || !VALID_CASE_TYPES.includes(caseType as HrCaseType)) {
    return NextResponse.json(
      { error: `caseType must be one of: ${VALID_CASE_TYPES.join(", ")}` },
      { status: 400 },
    );
  }
  if (!concernSummary || typeof concernSummary !== "string" || concernSummary.trim().length < 10) {
    return NextResponse.json(
      { error: "concernSummary is required and must be at least 10 characters" },
      { status: 400 },
    );
  }

  const access = checkHrAccess(
    { role: actorRole, userId: actorUserId, homeId },
    { action: "case.create", homeId, staffId },
  );
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  const id = `hrc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  // Sensible defaults. The author can override but the engine errs toward
  // safer settings when not specified.
  const resolvedSafeguardingStatus: HrSafeguardingStatus =
    (safeguardingStatus as HrSafeguardingStatus) ??
    (SAFEGUARDING_TRIGGERING_TYPES.has(caseType as HrCaseType)
      ? "possible_safeguarding"
      : "not_safeguarding");

  const resolvedChildImpactStatus: HrChildImpactStatus =
    (childImpactStatus as HrChildImpactStatus) ?? "unknown";

  const resolvedRiskLevel: HrRiskLevel = (riskLevel as HrRiskLevel) ?? "amber";

  const resolvedRiOversightRequired =
    SAFEGUARDING_TRIGGERING_TYPES.has(caseType as HrCaseType) ||
    resolvedRiskLevel === "red" ||
    resolvedRiskLevel === "black";

  const { error: insertError } = await supabase.from("hr_cases").insert({
    id,
    staff_id: staffId,
    home_id: homeId ?? null,
    case_type: caseType,
    case_owner: caseOwner ?? actorUserId,
    concern_summary: concernSummary,
    risk_level: resolvedRiskLevel,
    safeguarding_status: resolvedSafeguardingStatus,
    child_impact_status: resolvedChildImpactStatus,
    status: "open" as HrCaseStatus,
    opened_at: now,
    learning_actions: [],
    policy_links: [],
    regulation_links: [],
    ri_oversight_required: resolvedRiOversightRequired,
  });

  if (insertError) {
    console.error("[api] server error:", insertError); return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }

  // Seed the chronology with the opening event.
  await supabase.from("hr_case_chronology").insert({
    id: `hrc_chr_${id}_open`,
    case_id: id,
    occurred_at: now,
    entry_type: "concern_raised",
    summary: concernSummary.slice(0, 500),
    significance:
      resolvedRiskLevel === "red" || resolvedRiskLevel === "black" ? "critical" : "significant",
    recorded_by: actorUserId,
  });

  await supabase.from("hr_audit_log").insert({
    id: `hr_aud_${id}_create`,
    entity_type: "hr_case",
    entity_id: id,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    event_type: "created",
    event_detail: {
      caseType,
      riskLevel: resolvedRiskLevel,
      safeguardingStatus: resolvedSafeguardingStatus,
      childImpactStatus: resolvedChildImpactStatus,
      riOversightRequired: resolvedRiOversightRequired,
    },
  });

  return NextResponse.json({ data: { id, riOversightRequired: resolvedRiOversightRequired } });
}

// ─── GET: fetch ──────────────────────────────────────────────────────────────

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
  const staffId = searchParams.get("staffId");
  const homeId = searchParams.get("homeId");
  const actorUserId = searchParams.get("actorUserId") ?? "";
  const actorRole = (searchParams.get("actorRole") ?? "none") as HrRole;

  if (!actorUserId) {
    return NextResponse.json(
      { error: "actorUserId is required for HR record reads (audit requirement)" },
      { status: 400 },
    );
  }

  if (id) {
    const { data: caseRow, error } = await supabase
      .from("hr_cases")
      .select("*, hr_case_actions(*), hr_case_chronology(*)")
      .eq("id", id)
      .single();
    if (error) { console.error("[api] not-found:", error); return NextResponse.json({ error: "Not found." }, { status: 404 }); }

    const access = checkHrAccess(
      { role: actorRole, userId: actorUserId },
      {
        action: "case.read",
        homeId: caseRow.home_id ?? undefined,
        staffId: caseRow.staff_id ?? undefined,
        caseSafeguardingStatus: caseRow.safeguarding_status ?? undefined,
        caseOwner: caseRow.case_owner ?? undefined,
      },
    );
    if (!access.allowed) {
      // Log the denied access attempt — inspectors expect to see attempts.
      await supabase.from("hr_audit_log").insert({
        id: `hr_aud_${id}_deny_${Date.now()}`,
        entity_type: "hr_case",
        entity_id: id,
        actor_user_id: actorUserId,
        actor_role: actorRole,
        event_type: "restricted_access",
        event_detail: { reason: access.reason },
      });
      return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
    }

    await supabase.from("hr_audit_log").insert({
      id: `hr_aud_${id}_view_${Date.now()}`,
      entity_type: "hr_case",
      entity_id: id,
      actor_user_id: actorUserId,
      actor_role: actorRole,
      event_type: "viewed",
      event_detail: {},
    });

    return NextResponse.json({ data: caseRow });
  }

  if (staffId) {
    const { data, error } = await supabase
      .from("hr_cases")
      .select("id, case_type, status, risk_level, safeguarding_status, opened_at, closed_at")
      .eq("staff_id", staffId)
      .order("opened_at", { ascending: false });
    if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }
    return NextResponse.json({ data });
  }

  if (homeId) {
    const { data, error } = await supabase
      .from("hr_cases")
      .select("id, staff_id, case_type, status, risk_level, safeguarding_status, opened_at, closed_at")
      .eq("home_id", homeId)
      .order("opened_at", { ascending: false });
    if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Provide ?id, ?staffId, or ?homeId" }, { status: 400 });
}

// ─── PATCH: update a case ────────────────────────────────────────────────────

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
    caseId,
    actorUserId,
    actorRole,
    riskLevel,
    safeguardingStatus,
    childImpactStatus,
    status,
    closureSummary,
    rationaleForClosure,
    learningActions,
  } = body as {
    caseId?: string;
    actorUserId?: string;
    actorRole?: HrRole;
    riskLevel?: HrRiskLevel;
    safeguardingStatus?: HrSafeguardingStatus;
    childImpactStatus?: HrChildImpactStatus;
    status?: HrCaseStatus;
    closureSummary?: string;
    rationaleForClosure?: string;
    learningActions?: string[];
  };

  if (!caseId || !actorUserId || !actorRole) {
    return NextResponse.json(
      { error: "caseId, actorUserId and actorRole are required" },
      { status: 400 },
    );
  }

  const access = checkHrAccess(
    { role: actorRole, userId: actorUserId },
    { action: status === "closed" ? "case.close" : "case.update" },
  );
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (riskLevel) updates.risk_level = riskLevel;
  if (safeguardingStatus) updates.safeguarding_status = safeguardingStatus;
  if (childImpactStatus) updates.child_impact_status = childImpactStatus;
  if (status) {
    updates.status = status;
    if (status === "closed") {
      updates.closed_at = new Date().toISOString();
      if (!closureSummary) {
        return NextResponse.json(
          { error: "closureSummary is required when closing a case" },
          { status: 400 },
        );
      }
      updates.closure_summary = closureSummary;
      updates.rationale_for_closure = rationaleForClosure ?? closureSummary;
    }
  }
  if (learningActions) updates.learning_actions = learningActions;

  const { data: updated, error: updateError } = await supabase
    .from("hr_cases")
    .update(updates)
    .eq("id", caseId)
    .select()
    .single();
  if (updateError) {
    console.error("[api] server error:", updateError); return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }

  await supabase.from("hr_audit_log").insert({
    id: `hr_aud_${caseId}_edit_${Date.now()}`,
    entity_type: "hr_case",
    entity_id: caseId,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    event_type: status === "closed" ? "signed_off" : "edited",
    event_detail: { fields: Object.keys(updates) },
  });

  return NextResponse.json({ data: updated });
}
