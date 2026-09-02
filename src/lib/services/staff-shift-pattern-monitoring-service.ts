// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF SHIFT PATTERN MONITORING SERVICE
// Tracks shift patterns, working hours, fatigue risk, and staffing
// levels to ensure safe care delivery.
// CHR 2015 Reg 31 (workforce planning — sufficient, suitably qualified staff),
// Reg 33 (employment of staff — fitness and suitability).
//
// Covers: shift type, fatigue risk, staffing level,
// compliance status, and working time directive adherence.
//
// SCCIF: Leadership — "Staffing is sufficient to meet children's needs."
// "Staff welfare and working conditions support safe care."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ShiftType =
  | "early_morning"
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | "sleep_in"
  | "waking_night"
  | "split_shift"
  | "double_shift"
  | "other";

export type FatigueRisk =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "critical";

export type StaffingLevel =
  | "over_staffed"
  | "fully_staffed"
  | "adequate"
  | "understaffed"
  | "critically_understaffed";

export type ShiftCompliance =
  | "fully_compliant"
  | "minor_issues"
  | "significant_issues"
  | "non_compliant"
  | "not_assessed";

export interface StaffShiftPatternMonitoringRecord {
  id: string;
  home_id: string;
  shift_type: ShiftType;
  fatigue_risk: FatigueRisk;
  staffing_level: StaffingLevel;
  shift_compliance: ShiftCompliance;
  shift_date: string;
  staff_name: string;
  shift_supervisor: string;
  /** Tri-state judgements/observations: null = not recorded. Absence is never
   *  an answer — rates run over the records where the question was answered. */
  rest_period_compliant: boolean | null;
  working_time_directive_met: boolean | null;
  lone_working_risk_assessed: boolean | null;
  handover_completed: boolean | null;
  break_taken: boolean | null;
  training_current: boolean | null;
  dbs_current: boolean | null;
  first_aid_current: boolean | null;
  medication_trained: boolean | null;
  supervision_up_to_date: boolean | null;
  wellbeing_checked: boolean | null;
  recorded_promptly: boolean | null;
  shift_duration_hours: number;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SHIFT_TYPES: { type: ShiftType; label: string }[] = [
  { type: "early_morning", label: "Early Morning" },
  { type: "morning", label: "Morning" },
  { type: "afternoon", label: "Afternoon" },
  { type: "evening", label: "Evening" },
  { type: "night", label: "Night" },
  { type: "sleep_in", label: "Sleep-In" },
  { type: "waking_night", label: "Waking Night" },
  { type: "split_shift", label: "Split Shift" },
  { type: "double_shift", label: "Double Shift" },
  { type: "other", label: "Other" },
];

export const FATIGUE_RISKS: { risk: FatigueRisk; label: string }[] = [
  { risk: "very_low", label: "Very Low" },
  { risk: "low", label: "Low" },
  { risk: "moderate", label: "Moderate" },
  { risk: "high", label: "High" },
  { risk: "critical", label: "Critical" },
];

export const STAFFING_LEVELS: { level: StaffingLevel; label: string }[] = [
  { level: "over_staffed", label: "Over-Staffed" },
  { level: "fully_staffed", label: "Fully Staffed" },
  { level: "adequate", label: "Adequate" },
  { level: "understaffed", label: "Understaffed" },
  { level: "critically_understaffed", label: "Critically Understaffed" },
];

export const SHIFT_COMPLIANCES: { compliance: ShiftCompliance; label: string }[] = [
  { compliance: "fully_compliant", label: "Fully Compliant" },
  { compliance: "minor_issues", label: "Minor Issues" },
  { compliance: "significant_issues", label: "Significant Issues" },
  { compliance: "non_compliant", label: "Non-Compliant" },
  { compliance: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffShiftPatternMetrics(
  records: StaffShiftPatternMonitoringRecord[],
): {
  total_shifts: number;
  high_fatigue_count: number;
  critical_fatigue_count: number;
  understaffed_count: number;
  critically_understaffed_count: number;
  rest_period_rate: number | null;
  working_time_rate: number | null;
  lone_working_rate: number | null;
  handover_rate: number | null;
  break_taken_rate: number | null;
  training_current_rate: number | null;
  dbs_current_rate: number | null;
  first_aid_rate: number | null;
  medication_trained_rate: number | null;
  supervision_rate: number | null;
  wellbeing_rate: number | null;
  recorded_promptly_rate: number | null;
  average_shift_duration: number | null;
  unique_staff: number;
  by_shift_type: Record<string, number>;
  by_fatigue_risk: Record<string, number>;
  by_staffing_level: Record<string, number>;
  by_shift_compliance: Record<string, number>;
} {
  const highFatigue = records.filter((r) => r.fatigue_risk === "high").length;
  const criticalFatigue = records.filter((r) => r.fatigue_risk === "critical").length;
  const understaffed = records.filter((r) => r.staffing_level === "understaffed").length;
  const criticallyUnderstaffed = records.filter((r) => r.staffing_level === "critically_understaffed").length;

  const boolRate = (field: keyof StaffShiftPatternMonitoringRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const avgDuration =
    records.length > 0
      ? Math.round(
          (records.reduce((s, r) => s + r.shift_duration_hours, 0) / records.length) * 10,
        ) / 10
      : null;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.shift_type] = (byType[r.shift_type] ?? 0) + 1;

  const byRisk: Record<string, number> = {};
  for (const r of records) byRisk[r.fatigue_risk] = (byRisk[r.fatigue_risk] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const r of records) byLevel[r.staffing_level] = (byLevel[r.staffing_level] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.shift_compliance] = (byCompliance[r.shift_compliance] ?? 0) + 1;

  return {
    total_shifts: records.length,
    high_fatigue_count: highFatigue,
    critical_fatigue_count: criticalFatigue,
    understaffed_count: understaffed,
    critically_understaffed_count: criticallyUnderstaffed,
    rest_period_rate: boolRate("rest_period_compliant"),
    working_time_rate: boolRate("working_time_directive_met"),
    lone_working_rate: boolRate("lone_working_risk_assessed"),
    handover_rate: boolRate("handover_completed"),
    break_taken_rate: boolRate("break_taken"),
    training_current_rate: boolRate("training_current"),
    dbs_current_rate: boolRate("dbs_current"),
    first_aid_rate: boolRate("first_aid_current"),
    medication_trained_rate: boolRate("medication_trained"),
    supervision_rate: boolRate("supervision_up_to_date"),
    wellbeing_rate: boolRate("wellbeing_checked"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    average_shift_duration: avgDuration,
    unique_staff: new Set(records.map((r) => r.staff_name)).size,
    by_shift_type: byType,
    by_fatigue_risk: byRisk,
    by_staffing_level: byLevel,
    by_shift_compliance: byCompliance,
  };
}

export function identifyStaffShiftPatternAlerts(
  records: StaffShiftPatternMonitoringRecord[],
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

  // Critical fatigue without rest period compliance — per-record
  for (const r of records) {
    if (r.fatigue_risk === "critical" && !r.rest_period_compliant) {
      alerts.push({
        type: "critical_fatigue_no_rest",
        severity: "critical",
        message: `${r.staff_name} has critical fatigue risk without rest period compliance on ${r.shift_date} — immediate action required`,
        id: r.id,
      });
    }
  }

  // Critically understaffed
  const critUnder = records.filter((r) => r.staffing_level === "critically_understaffed").length;
  if (critUnder >= 1) {
    alerts.push({
      type: "critically_understaffed",
      severity: "high",
      message: `${critUnder} ${critUnder === 1 ? "shift is" : "shifts are"} critically understaffed — review staffing urgently`,
      id: "critically_understaffed",
    });
  }

  // Working time directive breached
  // A recorded "no" is a finding; an unanswered question is not.
  const wtdBreached = records.filter((r) => r.working_time_directive_met === false).length;
  if (wtdBreached >= 1) {
    alerts.push({
      type: "working_time_breached",
      severity: "high",
      message: `${wtdBreached} ${wtdBreached === 1 ? "shift has" : "shifts have"} working time directive breaches — ensure legal compliance`,
      id: "working_time_breached",
    });
  }

  // Lone working not assessed
  const loneNotAssessed = records.filter((r) => r.lone_working_risk_assessed === false).length;
  if (loneNotAssessed >= 2) {
    alerts.push({
      type: "lone_working_not_assessed",
      severity: "medium",
      message: `${loneNotAssessed} shifts without lone working risk assessment — review safety measures`,
      id: "lone_working_not_assessed",
    });
  }

  // Handover not completed
  const noHandover = records.filter((r) => r.handover_completed === false).length;
  if (noHandover >= 2) {
    alerts.push({
      type: "handover_not_completed",
      severity: "medium",
      message: `${noHandover} shifts without completed handover — ensure continuity of care`,
      id: "handover_not_completed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    shiftType?: ShiftType;
    fatigueRisk?: FatigueRisk;
    staffingLevel?: StaffingLevel;
    shiftCompliance?: ShiftCompliance;
    limit?: number;
  },
): Promise<ServiceResult<StaffShiftPatternMonitoringRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_shift_pattern_monitoring") as SB).select("*").eq("home_id", homeId);
  if (filters?.shiftType) q = q.eq("shift_type", filters.shiftType);
  if (filters?.fatigueRisk) q = q.eq("fatigue_risk", filters.fatigueRisk);
  if (filters?.staffingLevel) q = q.eq("staffing_level", filters.staffingLevel);
  if (filters?.shiftCompliance) q = q.eq("shift_compliance", filters.shiftCompliance);
  q = q.order("shift_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    shiftType: ShiftType;
    fatigueRisk: FatigueRisk;
    staffingLevel: StaffingLevel;
    shiftCompliance: ShiftCompliance;
    shiftDate: string;
    staffName: string;
    shiftSupervisor: string;
    restPeriodCompliant?: boolean;
    workingTimeDirectiveMet?: boolean;
    loneWorkingRiskAssessed?: boolean;
    handoverCompleted?: boolean;
    breakTaken?: boolean;
    trainingCurrent?: boolean;
    dbsCurrent?: boolean;
    firstAidCurrent?: boolean;
    medicationTrained?: boolean;
    supervisionUpToDate?: boolean;
    wellbeingChecked?: boolean;
    recordedPromptly?: boolean;
    shiftDurationHours?: number;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffShiftPatternMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_shift_pattern_monitoring") as SB)
    .insert({
      home_id: payload.homeId,
      shift_type: payload.shiftType,
      fatigue_risk: payload.fatigueRisk,
      staffing_level: payload.staffingLevel,
      shift_compliance: payload.shiftCompliance,
      shift_date: payload.shiftDate,
      staff_name: payload.staffName,
      shift_supervisor: payload.shiftSupervisor,
      rest_period_compliant: payload.restPeriodCompliant ?? null,
      working_time_directive_met: payload.workingTimeDirectiveMet ?? null,
      lone_working_risk_assessed: payload.loneWorkingRiskAssessed ?? null,
      handover_completed: payload.handoverCompleted ?? null,
      break_taken: payload.breakTaken ?? null,
      training_current: payload.trainingCurrent ?? null,
      dbs_current: payload.dbsCurrent ?? null,
      first_aid_current: payload.firstAidCurrent ?? null,
      medication_trained: payload.medicationTrained ?? null,
      supervision_up_to_date: payload.supervisionUpToDate ?? null,
      wellbeing_checked: payload.wellbeingChecked ?? null,
      recorded_promptly: payload.recordedPromptly ?? null,
      shift_duration_hours: payload.shiftDurationHours ?? 8,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
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
    shiftType: ShiftType;
    fatigueRisk: FatigueRisk;
    staffingLevel: StaffingLevel;
    shiftCompliance: ShiftCompliance;
    shiftDate: string;
    staffName: string;
    shiftSupervisor: string;
    restPeriodCompliant: boolean;
    workingTimeDirectiveMet: boolean;
    loneWorkingRiskAssessed: boolean;
    handoverCompleted: boolean;
    breakTaken: boolean;
    trainingCurrent: boolean;
    dbsCurrent: boolean;
    firstAidCurrent: boolean;
    medicationTrained: boolean;
    supervisionUpToDate: boolean;
    wellbeingChecked: boolean;
    recordedPromptly: boolean;
    shiftDurationHours: number;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffShiftPatternMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.shiftType !== undefined) mapped.shift_type = updates.shiftType;
  if (updates.fatigueRisk !== undefined) mapped.fatigue_risk = updates.fatigueRisk;
  if (updates.staffingLevel !== undefined) mapped.staffing_level = updates.staffingLevel;
  if (updates.shiftCompliance !== undefined) mapped.shift_compliance = updates.shiftCompliance;
  if (updates.shiftDate !== undefined) mapped.shift_date = updates.shiftDate;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.shiftSupervisor !== undefined) mapped.shift_supervisor = updates.shiftSupervisor;
  if (updates.restPeriodCompliant !== undefined) mapped.rest_period_compliant = updates.restPeriodCompliant;
  if (updates.workingTimeDirectiveMet !== undefined) mapped.working_time_directive_met = updates.workingTimeDirectiveMet;
  if (updates.loneWorkingRiskAssessed !== undefined) mapped.lone_working_risk_assessed = updates.loneWorkingRiskAssessed;
  if (updates.handoverCompleted !== undefined) mapped.handover_completed = updates.handoverCompleted;
  if (updates.breakTaken !== undefined) mapped.break_taken = updates.breakTaken;
  if (updates.trainingCurrent !== undefined) mapped.training_current = updates.trainingCurrent;
  if (updates.dbsCurrent !== undefined) mapped.dbs_current = updates.dbsCurrent;
  if (updates.firstAidCurrent !== undefined) mapped.first_aid_current = updates.firstAidCurrent;
  if (updates.medicationTrained !== undefined) mapped.medication_trained = updates.medicationTrained;
  if (updates.supervisionUpToDate !== undefined) mapped.supervision_up_to_date = updates.supervisionUpToDate;
  if (updates.wellbeingChecked !== undefined) mapped.wellbeing_checked = updates.wellbeingChecked;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.shiftDurationHours !== undefined) mapped.shift_duration_hours = updates.shiftDurationHours;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_shift_pattern_monitoring") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffShiftPatternMetrics,
  identifyStaffShiftPatternAlerts,
};
