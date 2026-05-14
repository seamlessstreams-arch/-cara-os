// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF LONE WORKING SERVICE
// Tracks lone working risk assessments, safety protocols, and
// check-in procedures for staff working alone in the home or
// during community activities with children.
// CHR 2015 Reg 33 (employment practices — staff safety),
// Reg 13 (leadership and management — risk management),
// Reg 12 (health and wellbeing — safe staffing).
//
// Covers: lone working assessments, check-in protocols, risk
// mitigation, communication plans, emergency contacts, DBS
// verification, and management authorisation.
//
// SCCIF: Leadership — "Staff safety protocols are robust."
// "Lone working is risk-assessed and properly managed."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type LoneWorkingScenario =
  | "night_shift_solo"
  | "community_activity"
  | "school_run"
  | "medical_appointment"
  | "emergency_cover"
  | "sleep_in"
  | "home_maintenance"
  | "office_admin"
  | "transport"
  | "other";

export type RiskLevel =
  | "very_high"
  | "high"
  | "medium"
  | "low"
  | "minimal";

export type CheckInFrequency =
  | "every_30_minutes"
  | "hourly"
  | "every_2_hours"
  | "every_4_hours"
  | "start_and_end";

export type AuthorisationLevel =
  | "manager_approved"
  | "senior_approved"
  | "ri_approved"
  | "emergency_only"
  | "standing_arrangement";

export interface StaffLoneWorkingRecord {
  id: string;
  home_id: string;
  lone_working_scenario: LoneWorkingScenario;
  risk_level: RiskLevel;
  check_in_frequency: CheckInFrequency;
  authorisation_level: AuthorisationLevel;
  assessment_date: string;
  staff_name: string;
  risk_assessed: boolean;
  manager_authorised: boolean;
  communication_plan: boolean;
  emergency_contacts_available: boolean;
  phone_charged: boolean;
  check_in_protocol_agreed: boolean;
  buddy_system_available: boolean;
  panic_alarm_available: boolean;
  first_aid_trained: boolean;
  medication_trained: boolean;
  safeguarding_trained: boolean;
  lone_working_policy_read: boolean;
  issues_found: string[];
  actions_taken: string[];
  assessed_by: string;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const LONE_WORKING_SCENARIOS: { scenario: LoneWorkingScenario; label: string }[] = [
  { scenario: "night_shift_solo", label: "Night Shift Solo" },
  { scenario: "community_activity", label: "Community Activity" },
  { scenario: "school_run", label: "School Run" },
  { scenario: "medical_appointment", label: "Medical Appointment" },
  { scenario: "emergency_cover", label: "Emergency Cover" },
  { scenario: "sleep_in", label: "Sleep-In" },
  { scenario: "home_maintenance", label: "Home Maintenance" },
  { scenario: "office_admin", label: "Office Admin" },
  { scenario: "transport", label: "Transport" },
  { scenario: "other", label: "Other" },
];

export const RISK_LEVELS: { level: RiskLevel; label: string }[] = [
  { level: "very_high", label: "Very High" },
  { level: "high", label: "High" },
  { level: "medium", label: "Medium" },
  { level: "low", label: "Low" },
  { level: "minimal", label: "Minimal" },
];

export const CHECK_IN_FREQUENCIES: { frequency: CheckInFrequency; label: string }[] = [
  { frequency: "every_30_minutes", label: "Every 30 Minutes" },
  { frequency: "hourly", label: "Hourly" },
  { frequency: "every_2_hours", label: "Every 2 Hours" },
  { frequency: "every_4_hours", label: "Every 4 Hours" },
  { frequency: "start_and_end", label: "Start & End" },
];

export const AUTHORISATION_LEVELS: { level: AuthorisationLevel; label: string }[] = [
  { level: "manager_approved", label: "Manager Approved" },
  { level: "senior_approved", label: "Senior Approved" },
  { level: "ri_approved", label: "RI Approved" },
  { level: "emergency_only", label: "Emergency Only" },
  { level: "standing_arrangement", label: "Standing Arrangement" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffLoneWorkingMetrics(
  records: StaffLoneWorkingRecord[],
): {
  total_assessments: number;
  very_high_count: number;
  high_count: number;
  emergency_only_count: number;
  not_authorised_count: number;
  risk_assessed_rate: number;
  manager_authorised_rate: number;
  communication_plan_rate: number;
  emergency_contacts_rate: number;
  phone_charged_rate: number;
  check_in_protocol_rate: number;
  buddy_system_rate: number;
  panic_alarm_rate: number;
  first_aid_trained_rate: number;
  medication_trained_rate: number;
  safeguarding_trained_rate: number;
  policy_read_rate: number;
  unique_staff: number;
  by_scenario: Record<string, number>;
  by_risk_level: Record<string, number>;
  by_check_in_frequency: Record<string, number>;
  by_authorisation_level: Record<string, number>;
} {
  const veryHigh = records.filter((r) => r.risk_level === "very_high").length;
  const high = records.filter((r) => r.risk_level === "high").length;
  const emergencyOnly = records.filter((r) => r.authorisation_level === "emergency_only").length;
  const notAuthorised = records.filter((r) => !r.manager_authorised).length;

  const boolRate = (field: keyof StaffLoneWorkingRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byScenario: Record<string, number> = {};
  for (const r of records) byScenario[r.lone_working_scenario] = (byScenario[r.lone_working_scenario] ?? 0) + 1;

  const byRisk: Record<string, number> = {};
  for (const r of records) byRisk[r.risk_level] = (byRisk[r.risk_level] ?? 0) + 1;

  const byCheckIn: Record<string, number> = {};
  for (const r of records) byCheckIn[r.check_in_frequency] = (byCheckIn[r.check_in_frequency] ?? 0) + 1;

  const byAuth: Record<string, number> = {};
  for (const r of records) byAuth[r.authorisation_level] = (byAuth[r.authorisation_level] ?? 0) + 1;

  return {
    total_assessments: records.length,
    very_high_count: veryHigh,
    high_count: high,
    emergency_only_count: emergencyOnly,
    not_authorised_count: notAuthorised,
    risk_assessed_rate: boolRate("risk_assessed"),
    manager_authorised_rate: boolRate("manager_authorised"),
    communication_plan_rate: boolRate("communication_plan"),
    emergency_contacts_rate: boolRate("emergency_contacts_available"),
    phone_charged_rate: boolRate("phone_charged"),
    check_in_protocol_rate: boolRate("check_in_protocol_agreed"),
    buddy_system_rate: boolRate("buddy_system_available"),
    panic_alarm_rate: boolRate("panic_alarm_available"),
    first_aid_trained_rate: boolRate("first_aid_trained"),
    medication_trained_rate: boolRate("medication_trained"),
    safeguarding_trained_rate: boolRate("safeguarding_trained"),
    policy_read_rate: boolRate("lone_working_policy_read"),
    unique_staff: uniqueStaff,
    by_scenario: byScenario,
    by_risk_level: byRisk,
    by_check_in_frequency: byCheckIn,
    by_authorisation_level: byAuth,
  };
}

export function identifyStaffLoneWorkingAlerts(
  records: StaffLoneWorkingRecord[],
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

  // Very high risk without authorisation
  for (const r of records) {
    if (r.risk_level === "very_high" && !r.manager_authorised) {
      alerts.push({
        type: "very_high_not_authorised",
        severity: "critical",
        message: `${r.staff_name} lone working in ${r.lone_working_scenario.replace(/_/g, " ")} assessed as very high risk without manager authorisation`,
        id: r.id,
      });
    }
  }

  // Not risk assessed
  const notAssessed = records.filter((r) => !r.risk_assessed).length;
  if (notAssessed >= 1) {
    alerts.push({
      type: "not_risk_assessed",
      severity: "high",
      message: `${notAssessed} lone working ${notAssessed === 1 ? "arrangement has" : "arrangements have"} not been risk assessed`,
      id: "not_risk_assessed",
    });
  }

  // No communication plan
  const noPlan = records.filter((r) => !r.communication_plan).length;
  if (noPlan >= 1) {
    alerts.push({
      type: "no_communication_plan",
      severity: "high",
      message: `${noPlan} lone working ${noPlan === 1 ? "arrangement has" : "arrangements have"} no communication plan`,
      id: "no_communication_plan",
    });
  }

  // No check-in protocol
  const noCheckIn = records.filter((r) => !r.check_in_protocol_agreed).length;
  if (noCheckIn >= 2) {
    alerts.push({
      type: "no_check_in_protocol",
      severity: "medium",
      message: `${noCheckIn} arrangements without agreed check-in protocol — ensure staff safety`,
      id: "no_check_in_protocol",
    });
  }

  // Policy not read
  const noPolicyRead = records.filter((r) => !r.lone_working_policy_read).length;
  if (noPolicyRead >= 2) {
    alerts.push({
      type: "policy_not_read",
      severity: "medium",
      message: `${noPolicyRead} staff have not read lone working policy — ensure compliance`,
      id: "policy_not_read",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    loneWorkingScenario?: LoneWorkingScenario;
    riskLevel?: RiskLevel;
    checkInFrequency?: CheckInFrequency;
    authorisationLevel?: AuthorisationLevel;
    limit?: number;
  },
): Promise<ServiceResult<StaffLoneWorkingRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_lone_working") as SB).select("*").eq("home_id", homeId);
  if (filters?.loneWorkingScenario) q = q.eq("lone_working_scenario", filters.loneWorkingScenario);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.checkInFrequency) q = q.eq("check_in_frequency", filters.checkInFrequency);
  if (filters?.authorisationLevel) q = q.eq("authorisation_level", filters.authorisationLevel);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    loneWorkingScenario: LoneWorkingScenario;
    riskLevel: RiskLevel;
    checkInFrequency: CheckInFrequency;
    authorisationLevel: AuthorisationLevel;
    assessmentDate: string;
    staffName: string;
    riskAssessed?: boolean;
    managerAuthorised?: boolean;
    communicationPlan?: boolean;
    emergencyContactsAvailable?: boolean;
    phoneCharged?: boolean;
    checkInProtocolAgreed?: boolean;
    buddySystemAvailable?: boolean;
    panicAlarmAvailable?: boolean;
    firstAidTrained?: boolean;
    medicationTrained?: boolean;
    safeguardingTrained?: boolean;
    loneWorkingPolicyRead?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    assessedBy: string;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffLoneWorkingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_lone_working") as SB)
    .insert({
      home_id: payload.homeId,
      lone_working_scenario: payload.loneWorkingScenario,
      risk_level: payload.riskLevel,
      check_in_frequency: payload.checkInFrequency,
      authorisation_level: payload.authorisationLevel,
      assessment_date: payload.assessmentDate,
      staff_name: payload.staffName,
      risk_assessed: payload.riskAssessed ?? true,
      manager_authorised: payload.managerAuthorised ?? true,
      communication_plan: payload.communicationPlan ?? true,
      emergency_contacts_available: payload.emergencyContactsAvailable ?? true,
      phone_charged: payload.phoneCharged ?? true,
      check_in_protocol_agreed: payload.checkInProtocolAgreed ?? true,
      buddy_system_available: payload.buddySystemAvailable ?? false,
      panic_alarm_available: payload.panicAlarmAvailable ?? false,
      first_aid_trained: payload.firstAidTrained ?? true,
      medication_trained: payload.medicationTrained ?? true,
      safeguarding_trained: payload.safeguardingTrained ?? true,
      lone_working_policy_read: payload.loneWorkingPolicyRead ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      assessed_by: payload.assessedBy,
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
    loneWorkingScenario: LoneWorkingScenario;
    riskLevel: RiskLevel;
    checkInFrequency: CheckInFrequency;
    authorisationLevel: AuthorisationLevel;
    assessmentDate: string;
    staffName: string;
    riskAssessed: boolean;
    managerAuthorised: boolean;
    communicationPlan: boolean;
    emergencyContactsAvailable: boolean;
    phoneCharged: boolean;
    checkInProtocolAgreed: boolean;
    buddySystemAvailable: boolean;
    panicAlarmAvailable: boolean;
    firstAidTrained: boolean;
    medicationTrained: boolean;
    safeguardingTrained: boolean;
    loneWorkingPolicyRead: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    assessedBy: string;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffLoneWorkingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.loneWorkingScenario !== undefined) mapped.lone_working_scenario = updates.loneWorkingScenario;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.checkInFrequency !== undefined) mapped.check_in_frequency = updates.checkInFrequency;
  if (updates.authorisationLevel !== undefined) mapped.authorisation_level = updates.authorisationLevel;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.riskAssessed !== undefined) mapped.risk_assessed = updates.riskAssessed;
  if (updates.managerAuthorised !== undefined) mapped.manager_authorised = updates.managerAuthorised;
  if (updates.communicationPlan !== undefined) mapped.communication_plan = updates.communicationPlan;
  if (updates.emergencyContactsAvailable !== undefined) mapped.emergency_contacts_available = updates.emergencyContactsAvailable;
  if (updates.phoneCharged !== undefined) mapped.phone_charged = updates.phoneCharged;
  if (updates.checkInProtocolAgreed !== undefined) mapped.check_in_protocol_agreed = updates.checkInProtocolAgreed;
  if (updates.buddySystemAvailable !== undefined) mapped.buddy_system_available = updates.buddySystemAvailable;
  if (updates.panicAlarmAvailable !== undefined) mapped.panic_alarm_available = updates.panicAlarmAvailable;
  if (updates.firstAidTrained !== undefined) mapped.first_aid_trained = updates.firstAidTrained;
  if (updates.medicationTrained !== undefined) mapped.medication_trained = updates.medicationTrained;
  if (updates.safeguardingTrained !== undefined) mapped.safeguarding_trained = updates.safeguardingTrained;
  if (updates.loneWorkingPolicyRead !== undefined) mapped.lone_working_policy_read = updates.loneWorkingPolicyRead;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_lone_working") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffLoneWorkingMetrics,
  identifyStaffLoneWorkingAlerts,
};
