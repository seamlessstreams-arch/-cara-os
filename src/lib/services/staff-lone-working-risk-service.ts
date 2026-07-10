// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF LONE WORKING RISK SERVICE
// Tracks lone working risk assessments, check-in protocols, personal safety
// equipment, training compliance, and incident monitoring for staff working
// alone in children's residential homes.
//
// Health and Safety at Work Act 1974 — employer duty to protect lone workers.
// Management of Health and Safety at Work Regulations 1999 — risk assessment
// obligations for lone working activities.
// CHR 2015 Reg 32 (fitness of workers — staff welfare and safe working practices).
//
// Covers: Lone working type classification, risk level assessment, check-in
// protocols, personal alarms, mobile phone availability, emergency procedures,
// training completion, incident and near-miss reporting.
//
// SCCIF: Leadership & Management — "The home ensures that staff who work alone
// are properly risk-assessed, equipped, and supported to maintain the safety
// of both themselves and the children in their care."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const LONE_WORKING_TYPES = [
  "Night Shift",
  "Sleep-In",
  "Home Visit",
  "Transport",
  "Community Outing",
  "Office Alone",
  "Emergency Cover",
  "Other",
] as const;
export type LoneWorkingType = (typeof LONE_WORKING_TYPES)[number];

export const RISK_LEVELS = [
  "Low",
  "Medium",
  "High",
  "Unacceptable",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const CHECK_IN_FREQUENCIES = [
  "Hourly",
  "2-Hourly",
  "4-Hourly",
  "Start/End",
  "On Demand",
] as const;
export type CheckInFrequency = (typeof CHECK_IN_FREQUENCIES)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Action Required",
  "Suspended",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row Interface ─────────────────────────────────────────────────────────

export interface StaffLoneWorkingRiskRow {
  id: string;
  home_id: string;
  assessment_date: string;
  assessor_name: string;
  staff_name: string;
  lone_working_type: LoneWorkingType;
  risk_level: RiskLevel;
  risk_assessment_completed: boolean;
  check_in_protocol_agreed: boolean;
  check_in_frequency: CheckInFrequency | null;
  personal_alarm_issued: boolean;
  mobile_phone_available: boolean;
  emergency_procedures_known: boolean;
  training_completed: boolean;
  incident_during_lone_work: boolean;
  near_miss_reported: boolean;
  next_review_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Supabase helper ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sb(): any | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Metrics ───────────────────────────────────────────────────────────────

export function computeMetrics(rows: StaffLoneWorkingRiskRow[]): {
  total_assessments: number;
  high_risk_count: number;
  unacceptable_count: number;
  risk_assessment_rate: number;
  check_in_rate: number;
  personal_alarm_rate: number;
  mobile_phone_rate: number;
  emergency_procedures_rate: number;
  training_rate: number;
  incident_count: number;
  near_miss_count: number;
  non_compliant_count: number;
  unique_staff: number;
  unique_assessors: number;
} {
  const total = rows.length;

  const highRiskCount = rows.filter((r) => r.risk_level === "High").length;
  const unacceptableCount = rows.filter((r) => r.risk_level === "Unacceptable").length;
  const incidentCount = rows.filter((r) => r.incident_during_lone_work).length;
  const nearMissCount = rows.filter((r) => r.near_miss_reported).length;
  const nonCompliantCount = rows.filter((r) => r.compliance_status === "Non-Compliant").length;

  const boolRate = (field: keyof StaffLoneWorkingRiskRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  return {
    total_assessments: total,
    high_risk_count: highRiskCount,
    unacceptable_count: unacceptableCount,
    risk_assessment_rate: boolRate("risk_assessment_completed"),
    check_in_rate: boolRate("check_in_protocol_agreed"),
    personal_alarm_rate: boolRate("personal_alarm_issued"),
    mobile_phone_rate: boolRate("mobile_phone_available"),
    emergency_procedures_rate: boolRate("emergency_procedures_known"),
    training_rate: boolRate("training_completed"),
    incident_count: incidentCount,
    near_miss_count: nearMissCount,
    non_compliant_count: nonCompliantCount,
    unique_staff: new Set(rows.map((r) => r.staff_name)).size,
    unique_assessors: new Set(rows.map((r) => r.assessor_name)).size,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function computeAlerts(
  rows: StaffLoneWorkingRiskRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: Unacceptable risk level
  for (const r of rows) {
    if (r.risk_level === "Unacceptable") {
      alerts.push({
        type: "unacceptable_risk_level",
        severity: "critical",
        message: `${r.staff_name} has an unacceptable lone working risk level — the home must immediately suspend lone working arrangements and implement alternative staffing until the risk is reduced to an acceptable level.`,
        record_id: r.id,
      });
    }
  }

  // Critical: High risk without risk assessment completed
  for (const r of rows) {
    if (r.risk_level === "High" && !r.risk_assessment_completed) {
      alerts.push({
        type: "high_risk_no_assessment",
        severity: "critical",
        message: `${r.staff_name} has a high lone working risk level without a completed risk assessment — the home must complete a full risk assessment before any further lone working is permitted under the Management of Health and Safety at Work Regulations 1999.`,
        record_id: r.id,
      });
    }
  }

  // High: No check-in protocol for high risk
  for (const r of rows) {
    if (r.risk_level === "High" && !r.check_in_protocol_agreed) {
      alerts.push({
        type: "high_risk_no_check_in",
        severity: "high",
        message: `${r.staff_name} has a high lone working risk level without an agreed check-in protocol — the home must establish a robust check-in procedure to monitor the safety and wellbeing of staff working alone.`,
        record_id: r.id,
      });
    }
  }

  // High: Incident during lone work
  for (const r of rows) {
    if (r.incident_during_lone_work) {
      alerts.push({
        type: "incident_during_lone_work",
        severity: "high",
        message: `${r.staff_name} experienced an incident during lone working — the home must review the lone working risk assessment and implement additional safeguards to prevent recurrence and protect staff safety.`,
        record_id: r.id,
      });
    }
  }

  // Medium: No personal alarm for high risk
  for (const r of rows) {
    if (r.risk_level === "High" && !r.personal_alarm_issued) {
      alerts.push({
        type: "high_risk_no_alarm",
        severity: "medium",
        message: `${r.staff_name} has a high lone working risk level without a personal alarm issued — the home should ensure all high-risk lone workers are provided with personal safety equipment to summon assistance if needed.`,
        record_id: r.id,
      });
    }
  }

  // Medium: Training not completed
  for (const r of rows) {
    if (!r.training_completed) {
      alerts.push({
        type: "training_not_completed",
        severity: "medium",
        message: `${r.staff_name} has not completed lone working training — the home must ensure all staff who work alone receive appropriate training on safety procedures, emergency protocols, and risk awareness.`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

// ── Cara Insights ─────────────────────────────────────────────────────────

export function computeCaraInsights(rows: StaffLoneWorkingRiskRow[]): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[indigo] ${metrics.total_assessments} lone working ${metrics.total_assessments === 1 ? "assessment" : "assessments"} recorded across ${metrics.unique_staff} ${metrics.unique_staff === 1 ? "staff member" : "staff members"} assessed by ${metrics.unique_assessors} ${metrics.unique_assessors === 1 ? "assessor" : "assessors"}. ` +
      `Risk assessment completion: ${metrics.risk_assessment_rate}%, check-in protocol: ${metrics.check_in_rate}%, training: ${metrics.training_rate}%.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `High risk: ${metrics.high_risk_count}, unacceptable: ${metrics.unacceptable_count}, ` +
        `incidents: ${metrics.incident_count}, near misses: ${metrics.near_miss_count}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `Personal alarm rate: ${metrics.personal_alarm_rate}%, mobile phone rate: ${metrics.mobile_phone_rate}%. ` +
        `Continue monitoring lone working arrangements to maintain staff safety standards.`,
    );
  }

  // Insight 3: Reflective question
  if (criticalAlerts.length > 0) {
    insights.push(
      `[reflect] ${criticalAlerts.length} critical ${criticalAlerts.length === 1 ? "alert requires" : "alerts require"} immediate attention. ` +
        `How is the home ensuring lone working risk assessments are completed ` +
        `and that all staff working alone are properly equipped and supported under the Health and Safety at Work Act 1974?`,
    );
  } else if (metrics.training_rate < 100) {
    insights.push(
      `[reflect] ${metrics.training_rate}% of staff have completed lone working training. ` +
        `How is the home ensuring all lone workers receive appropriate training, ` +
        `and are processes in place to monitor staff safety and prevent incidents during lone working?`,
    );
  } else {
    insights.push(
      `[reflect] All lone working risk management processes are in good standing. ` +
        `How can the home build on this strong safety practice to ensure ` +
        `continued adherence to lone working policies and staff welfare obligations?`,
    );
  }

  return insights;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listStaffLoneWorkingRisks(
  homeId: string,
  filters?: { complianceStatus?: ComplianceStatus },
): Promise<ServiceResult<StaffLoneWorkingRiskRow[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  let query = (client.from("cs_staff_lone_working_risks") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.complianceStatus) {
    query = query.eq("compliance_status", filters.complianceStatus);
  }
  const { data, error } = await query.order("assessment_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffLoneWorkingRiskRow[] };
}

export async function createStaffLoneWorkingRisk(input: {
  homeId: string;
  assessmentDate: string;
  assessorName: string;
  staffName: string;
  loneWorkingType: LoneWorkingType;
  riskLevel?: RiskLevel;
  riskAssessmentCompleted?: boolean;
  checkInProtocolAgreed?: boolean;
  checkInFrequency?: CheckInFrequency | null;
  personalAlarmIssued?: boolean;
  mobilePhoneAvailable?: boolean;
  emergencyProceduresKnown?: boolean;
  trainingCompleted?: boolean;
  incidentDuringLoneWork?: boolean;
  nearMissReported?: boolean;
  nextReviewDate?: string | null;
  complianceStatus?: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<StaffLoneWorkingRiskRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_lone_working_risks") as SB)
    .insert({
      home_id: input.homeId,
      assessment_date: input.assessmentDate,
      assessor_name: input.assessorName,
      staff_name: input.staffName,
      lone_working_type: input.loneWorkingType,
      risk_level: input.riskLevel ?? "Low",
      risk_assessment_completed: input.riskAssessmentCompleted ?? true,
      check_in_protocol_agreed: input.checkInProtocolAgreed ?? true,
      check_in_frequency: input.checkInFrequency ?? null,
      personal_alarm_issued: input.personalAlarmIssued ?? false,
      mobile_phone_available: input.mobilePhoneAvailable ?? true,
      emergency_procedures_known: input.emergencyProceduresKnown ?? true,
      training_completed: input.trainingCompleted ?? true,
      incident_during_lone_work: input.incidentDuringLoneWork ?? false,
      near_miss_reported: input.nearMissReported ?? false,
      next_review_date: input.nextReviewDate ?? null,
      compliance_status: input.complianceStatus ?? "Compliant",
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffLoneWorkingRiskRow };
}

export async function updateStaffLoneWorkingRisk(
  id: string,
  updates: Partial<Omit<StaffLoneWorkingRiskRow, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffLoneWorkingRiskRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_lone_working_risks") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffLoneWorkingRiskRow };
}

// ── Testing export ────────────────────────────────────────────────────────

export const _testing = { computeMetrics, computeAlerts, computeCaraInsights };
