// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DEBRIEF SUPPORT SERVICE
// Tracks post-incident and routine debriefs for staff emotional
// wellbeing, learning, and professional development.
// CHR 2015 Reg 13 (leadership and management — staff support),
// Reg 33 (fitness of staff — emotional wellbeing).
//
// Covers: debrief type, incident severity, staff emotional impact,
// support outcome, and learning captured.
//
// SCCIF: Leadership — "Staff are supported after difficult incidents."
// "Debriefing leads to learning and improved practice."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type DebriefType =
  | "post_incident"
  | "post_restraint"
  | "post_missing"
  | "post_safeguarding"
  | "routine_end_of_shift"
  | "team_reflection"
  | "supervision_debrief"
  | "critical_incident"
  | "complaint_related"
  | "other";

export type IncidentSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "not_applicable";

export type StaffImpact =
  | "significantly_affected"
  | "moderately_affected"
  | "mildly_affected"
  | "not_affected"
  | "not_assessed";

export type SupportOutcome =
  | "fully_supported"
  | "partially_supported"
  | "further_support_needed"
  | "referred_externally"
  | "declined_support";

export interface StaffDebriefSupportRecord {
  id: string;
  home_id: string;
  debrief_type: DebriefType;
  incident_severity: IncidentSeverity;
  staff_impact: StaffImpact;
  support_outcome: SupportOutcome;
  debrief_date: string;
  staff_name: string;
  facilitated_by: string;
  timely_debrief: boolean;
  safe_space_provided: boolean;
  confidentiality_assured: boolean;
  emotional_support_offered: boolean;
  learning_captured: boolean;
  action_plan_agreed: boolean;
  follow_up_scheduled: boolean;
  supervision_linked: boolean;
  occupational_health_considered: boolean;
  eap_signposted: boolean;
  peer_support_offered: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  debrief_duration_minutes: number;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DEBRIEF_TYPES: { type: DebriefType; label: string }[] = [
  { type: "post_incident", label: "Post-Incident" },
  { type: "post_restraint", label: "Post-Restraint" },
  { type: "post_missing", label: "Post-Missing" },
  { type: "post_safeguarding", label: "Post-Safeguarding" },
  { type: "routine_end_of_shift", label: "End of Shift" },
  { type: "team_reflection", label: "Team Reflection" },
  { type: "supervision_debrief", label: "Supervision Debrief" },
  { type: "critical_incident", label: "Critical Incident" },
  { type: "complaint_related", label: "Complaint Related" },
  { type: "other", label: "Other" },
];

export const INCIDENT_SEVERITIES: { severity: IncidentSeverity; label: string }[] = [
  { severity: "critical", label: "Critical" },
  { severity: "high", label: "High" },
  { severity: "medium", label: "Medium" },
  { severity: "low", label: "Low" },
  { severity: "not_applicable", label: "Not Applicable" },
];

export const STAFF_IMPACTS: { impact: StaffImpact; label: string }[] = [
  { impact: "significantly_affected", label: "Significantly Affected" },
  { impact: "moderately_affected", label: "Moderately Affected" },
  { impact: "mildly_affected", label: "Mildly Affected" },
  { impact: "not_affected", label: "Not Affected" },
  { impact: "not_assessed", label: "Not Assessed" },
];

export const SUPPORT_OUTCOMES: { outcome: SupportOutcome; label: string }[] = [
  { outcome: "fully_supported", label: "Fully Supported" },
  { outcome: "partially_supported", label: "Partially Supported" },
  { outcome: "further_support_needed", label: "Further Support Needed" },
  { outcome: "referred_externally", label: "Referred Externally" },
  { outcome: "declined_support", label: "Declined Support" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffDebriefMetrics(
  records: StaffDebriefSupportRecord[],
): {
  total_debriefs: number;
  critical_severity_count: number;
  significantly_affected_count: number;
  further_support_count: number;
  declined_support_count: number;
  timely_debrief_rate: number | null;
  safe_space_rate: number | null;
  confidentiality_rate: number | null;
  emotional_support_rate: number | null;
  learning_captured_rate: number | null;
  action_plan_rate: number | null;
  follow_up_rate: number | null;
  supervision_linked_rate: number | null;
  occupational_health_rate: number | null;
  eap_signposted_rate: number | null;
  peer_support_rate: number | null;
  recorded_promptly_rate: number | null;
  average_duration: number | null;
  unique_staff: number;
  by_debrief_type: Record<string, number>;
  by_incident_severity: Record<string, number>;
  by_staff_impact: Record<string, number>;
  by_support_outcome: Record<string, number>;
} {
  const criticalSeverity = records.filter((r) => r.incident_severity === "critical").length;
  const sigAffected = records.filter((r) => r.staff_impact === "significantly_affected").length;
  const furtherSupport = records.filter((r) => r.support_outcome === "further_support_needed").length;
  const declinedSupport = records.filter((r) => r.support_outcome === "declined_support").length;

  const boolRate = (field: keyof StaffDebriefSupportRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const avgDuration =
    records.length > 0
      ? Math.round(
          (records.reduce((sum, r) => sum + r.debrief_duration_minutes, 0) / records.length) * 10,
        ) / 10
      : null;

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.debrief_type] = (byType[r.debrief_type] ?? 0) + 1;

  const bySeverity: Record<string, number> = {};
  for (const r of records) bySeverity[r.incident_severity] = (bySeverity[r.incident_severity] ?? 0) + 1;

  const byImpact: Record<string, number> = {};
  for (const r of records) byImpact[r.staff_impact] = (byImpact[r.staff_impact] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.support_outcome] = (byOutcome[r.support_outcome] ?? 0) + 1;

  return {
    total_debriefs: records.length,
    critical_severity_count: criticalSeverity,
    significantly_affected_count: sigAffected,
    further_support_count: furtherSupport,
    declined_support_count: declinedSupport,
    timely_debrief_rate: boolRate("timely_debrief"),
    safe_space_rate: boolRate("safe_space_provided"),
    confidentiality_rate: boolRate("confidentiality_assured"),
    emotional_support_rate: boolRate("emotional_support_offered"),
    learning_captured_rate: boolRate("learning_captured"),
    action_plan_rate: boolRate("action_plan_agreed"),
    follow_up_rate: boolRate("follow_up_scheduled"),
    supervision_linked_rate: boolRate("supervision_linked"),
    occupational_health_rate: boolRate("occupational_health_considered"),
    eap_signposted_rate: boolRate("eap_signposted"),
    peer_support_rate: boolRate("peer_support_offered"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    average_duration: avgDuration,
    unique_staff: uniqueStaff,
    by_debrief_type: byType,
    by_incident_severity: bySeverity,
    by_staff_impact: byImpact,
    by_support_outcome: byOutcome,
  };
}

export function identifyStaffDebriefAlerts(
  records: StaffDebriefSupportRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Significantly affected without follow-up
  for (const r of records) {
    if (r.staff_impact === "significantly_affected" && !r.follow_up_scheduled) {
      alerts.push({
        type: "significantly_affected_no_followup",
        severity: "critical",
        message: `${r.staff_name} significantly affected after ${r.debrief_type.replace(/_/g, " ")} without follow-up scheduled — ensure wellbeing support`,
        id: r.id,
      });
    }
  }

  // Not timely debrief
  const notTimely = records.filter((r) => !r.timely_debrief).length;
  if (notTimely >= 1) {
    alerts.push({
      type: "not_timely",
      severity: "high",
      message: `${notTimely} ${notTimely === 1 ? "debrief was" : "debriefs were"} not conducted in a timely manner — review debrief protocols`,
      id: "not_timely",
    });
  }

  // Learning not captured
  const noLearning = records.filter((r) => !r.learning_captured).length;
  if (noLearning >= 1) {
    alerts.push({
      type: "learning_not_captured",
      severity: "high",
      message: `${noLearning} ${noLearning === 1 ? "debrief has" : "debriefs have"} learning not captured — ensure reflective practice`,
      id: "learning_not_captured",
    });
  }

  // Emotional support not offered
  const noEmotional = records.filter((r) => !r.emotional_support_offered).length;
  if (noEmotional >= 2) {
    alerts.push({
      type: "no_emotional_support",
      severity: "medium",
      message: `${noEmotional} debriefs without emotional support offered — strengthen staff wellbeing focus`,
      id: "no_emotional_support",
    });
  }

  // No safe space
  const noSafeSpace = records.filter((r) => !r.safe_space_provided).length;
  if (noSafeSpace >= 2) {
    alerts.push({
      type: "no_safe_space",
      severity: "medium",
      message: `${noSafeSpace} debriefs without safe space provided — ensure appropriate environment`,
      id: "no_safe_space",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    debriefType?: DebriefType;
    incidentSeverity?: IncidentSeverity;
    staffImpact?: StaffImpact;
    supportOutcome?: SupportOutcome;
    limit?: number;
  },
): Promise<ServiceResult<StaffDebriefSupportRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_debrief_support") as SB).select("*").eq("home_id", homeId);
  if (filters?.debriefType) q = q.eq("debrief_type", filters.debriefType);
  if (filters?.incidentSeverity) q = q.eq("incident_severity", filters.incidentSeverity);
  if (filters?.staffImpact) q = q.eq("staff_impact", filters.staffImpact);
  if (filters?.supportOutcome) q = q.eq("support_outcome", filters.supportOutcome);
  q = q.order("debrief_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    debriefType: DebriefType;
    incidentSeverity: IncidentSeverity;
    staffImpact: StaffImpact;
    supportOutcome: SupportOutcome;
    debriefDate: string;
    staffName: string;
    facilitatedBy: string;
    timelyDebrief?: boolean;
    safeSpaceProvided?: boolean;
    confidentialityAssured?: boolean;
    emotionalSupportOffered?: boolean;
    learningCaptured?: boolean;
    actionPlanAgreed?: boolean;
    followUpScheduled?: boolean;
    supervisionLinked?: boolean;
    occupationalHealthConsidered?: boolean;
    eapSignposted?: boolean;
    peerSupportOffered?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    debriefDurationMinutes: number;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffDebriefSupportRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_debrief_support") as SB)
    .insert({
      home_id: payload.homeId,
      debrief_type: payload.debriefType,
      incident_severity: payload.incidentSeverity,
      staff_impact: payload.staffImpact,
      support_outcome: payload.supportOutcome,
      debrief_date: payload.debriefDate,
      staff_name: payload.staffName,
      facilitated_by: payload.facilitatedBy,
      timely_debrief: payload.timelyDebrief ?? true,
      safe_space_provided: payload.safeSpaceProvided ?? true,
      confidentiality_assured: payload.confidentialityAssured ?? true,
      emotional_support_offered: payload.emotionalSupportOffered ?? true,
      learning_captured: payload.learningCaptured ?? true,
      action_plan_agreed: payload.actionPlanAgreed ?? true,
      follow_up_scheduled: payload.followUpScheduled ?? false,
      supervision_linked: payload.supervisionLinked ?? true,
      occupational_health_considered: payload.occupationalHealthConsidered ?? false,
      eap_signposted: payload.eapSignposted ?? false,
      peer_support_offered: payload.peerSupportOffered ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      debrief_duration_minutes: payload.debriefDurationMinutes,
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    debriefType: DebriefType;
    incidentSeverity: IncidentSeverity;
    staffImpact: StaffImpact;
    supportOutcome: SupportOutcome;
    debriefDate: string;
    staffName: string;
    facilitatedBy: string;
    timelyDebrief: boolean;
    safeSpaceProvided: boolean;
    confidentialityAssured: boolean;
    emotionalSupportOffered: boolean;
    learningCaptured: boolean;
    actionPlanAgreed: boolean;
    followUpScheduled: boolean;
    supervisionLinked: boolean;
    occupationalHealthConsidered: boolean;
    eapSignposted: boolean;
    peerSupportOffered: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    debriefDurationMinutes: number;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffDebriefSupportRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.debriefType !== undefined) mapped.debrief_type = updates.debriefType;
  if (updates.incidentSeverity !== undefined) mapped.incident_severity = updates.incidentSeverity;
  if (updates.staffImpact !== undefined) mapped.staff_impact = updates.staffImpact;
  if (updates.supportOutcome !== undefined) mapped.support_outcome = updates.supportOutcome;
  if (updates.debriefDate !== undefined) mapped.debrief_date = updates.debriefDate;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.facilitatedBy !== undefined) mapped.facilitated_by = updates.facilitatedBy;
  if (updates.timelyDebrief !== undefined) mapped.timely_debrief = updates.timelyDebrief;
  if (updates.safeSpaceProvided !== undefined) mapped.safe_space_provided = updates.safeSpaceProvided;
  if (updates.confidentialityAssured !== undefined) mapped.confidentiality_assured = updates.confidentialityAssured;
  if (updates.emotionalSupportOffered !== undefined) mapped.emotional_support_offered = updates.emotionalSupportOffered;
  if (updates.learningCaptured !== undefined) mapped.learning_captured = updates.learningCaptured;
  if (updates.actionPlanAgreed !== undefined) mapped.action_plan_agreed = updates.actionPlanAgreed;
  if (updates.followUpScheduled !== undefined) mapped.follow_up_scheduled = updates.followUpScheduled;
  if (updates.supervisionLinked !== undefined) mapped.supervision_linked = updates.supervisionLinked;
  if (updates.occupationalHealthConsidered !== undefined) mapped.occupational_health_considered = updates.occupationalHealthConsidered;
  if (updates.eapSignposted !== undefined) mapped.eap_signposted = updates.eapSignposted;
  if (updates.peerSupportOffered !== undefined) mapped.peer_support_offered = updates.peerSupportOffered;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.debriefDurationMinutes !== undefined) mapped.debrief_duration_minutes = updates.debriefDurationMinutes;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_debrief_support") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffDebriefMetrics,
  identifyStaffDebriefAlerts,
};
