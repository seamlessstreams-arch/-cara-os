// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION INCIDENT REPORTING SERVICE
// Manages Medication Incident Reporting — tracking medication errors,
// near-misses, adverse reactions, and the investigation and learning
// outcomes from each incident.
// CHR 2015 Reg 23 (medication — safe administration),
// Reg 40 (notifications — serious medication incidents),
// Duty of Candour (informing families of errors and harm).
//
// Distinct from medication-errors-service (which focuses on error
// classification and root cause analysis). This service captures the
// full incident lifecycle: report, investigate, identify root cause,
// implement actions, close, and share learning.
//
// SCCIF: Helped & Protected — "Medication is managed safely."
// "When incidents occur, they are reported, investigated, and learned from."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const INCIDENT_TYPES = [
  "wrong_medication",
  "wrong_dose",
  "wrong_time",
  "missed_dose",
  "double_dose",
  "wrong_child",
  "wrong_route",
  "adverse_reaction",
  "near_miss",
  "storage_breach",
] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const INCIDENT_SEVERITIES = [
  "no_harm",
  "minor_harm",
  "moderate_harm",
  "serious_harm",
  "death",
] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INVESTIGATION_STATUSES = [
  "reported",
  "under_investigation",
  "root_cause_identified",
  "actions_implemented",
  "closed",
] as const;
export type InvestigationStatus = (typeof INVESTIGATION_STATUSES)[number];

export const CONTRIBUTING_FACTORS = [
  "staffing_levels",
  "training_gap",
  "communication_failure",
  "system_error",
  "distraction",
  "handover_failure",
  "documentation_error",
  "equipment_failure",
  "policy_not_followed",
  "supervision_gap",
] as const;
export type ContributingFactor = (typeof CONTRIBUTING_FACTORS)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface MedicationIncidentReportRow {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  incident_date: string;
  incident_type: string;
  incident_severity: string;
  investigation_status: string;
  contributing_factor: string;
  staff_involved: string;
  medication_name: string;
  gp_notified: boolean;
  parent_notified: boolean;
  social_worker_notified: boolean;
  ofsted_notified: boolean;
  root_cause_identified: boolean;
  learning_shared: boolean;
  duty_of_candour_applied: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMedicationIncidentMetrics(
  rows: MedicationIncidentReportRow[],
): {
  total_incidents: number;
  serious_harm_count: number;
  moderate_harm_count: number;
  near_miss_count: number;
  open_investigation_count: number;
  gp_notified_rate: number;
  parent_notified_rate: number;
  social_worker_notified_rate: number;
  root_cause_rate: number;
  learning_shared_rate: number;
  type_breakdown: Record<string, number>;
  severity_breakdown: Record<string, number>;
  unique_children: number;
} {
  const seriousHarm = rows.filter(
    (r) => r.incident_severity === "serious_harm" || r.incident_severity === "death",
  ).length;

  const moderateHarm = rows.filter((r) => r.incident_severity === "moderate_harm").length;

  const nearMiss = rows.filter((r) => r.incident_type === "near_miss").length;

  const openInvestigation = rows.filter(
    (r) => r.investigation_status === "reported" || r.investigation_status === "under_investigation",
  ).length;

  const boolRate = (field: keyof MedicationIncidentReportRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const typeBreakdown: Record<string, number> = {};
  for (const r of rows) typeBreakdown[r.incident_type] = (typeBreakdown[r.incident_type] ?? 0) + 1;

  const severityBreakdown: Record<string, number> = {};
  for (const r of rows) severityBreakdown[r.incident_severity] = (severityBreakdown[r.incident_severity] ?? 0) + 1;

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  return {
    total_incidents: rows.length,
    serious_harm_count: seriousHarm,
    moderate_harm_count: moderateHarm,
    near_miss_count: nearMiss,
    open_investigation_count: openInvestigation,
    gp_notified_rate: boolRate("gp_notified"),
    parent_notified_rate: boolRate("parent_notified"),
    social_worker_notified_rate: boolRate("social_worker_notified"),
    root_cause_rate: boolRate("root_cause_identified"),
    learning_shared_rate: boolRate("learning_shared"),
    type_breakdown: typeBreakdown,
    severity_breakdown: severityBreakdown,
    unique_children: uniqueChildren,
  };
}

export function computeMedicationIncidentAlerts(
  rows: MedicationIncidentReportRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: serious_harm or death + ofsted not notified
  for (const r of rows) {
    if (
      (r.incident_severity === "serious_harm" || r.incident_severity === "death") &&
      !r.ofsted_notified
    ) {
      alerts.push({
        type: "serious_harm_ofsted_not_notified",
        severity: "critical",
        message: `${r.child_name} experienced ${r.incident_severity.replace(/_/g, " ")} from ${r.incident_type.replace(/_/g, " ")} (${r.medication_name}) — Ofsted has not been notified`,
        record_id: r.id,
      });
    }
  }

  // High: moderate+ harm + duty of candour not applied
  for (const r of rows) {
    if (
      (r.incident_severity === "moderate_harm" ||
        r.incident_severity === "serious_harm" ||
        r.incident_severity === "death") &&
      !r.duty_of_candour_applied
    ) {
      alerts.push({
        type: "duty_of_candour_not_applied",
        severity: "high",
        message: `Duty of candour not applied for ${r.child_name}'s ${r.incident_severity.replace(/_/g, " ")} incident (${r.medication_name}) — disclosure to family required`,
        record_id: r.id,
      });
    }
  }

  // High: multiple incidents for same child
  const childCounts: Record<string, number> = {};
  for (const r of rows) childCounts[r.child_name] = (childCounts[r.child_name] ?? 0) + 1;
  for (const [name, count] of Object.entries(childCounts)) {
    if (count >= 2) {
      alerts.push({
        type: "multiple_incidents_same_child",
        severity: "high",
        message: `${name} has ${count} medication incidents — review medication management and care plan`,
      });
    }
  }

  // Medium: root cause not identified for closed investigations
  for (const r of rows) {
    if (r.investigation_status === "closed" && !r.root_cause_identified) {
      alerts.push({
        type: "closed_without_root_cause",
        severity: "medium",
        message: `Investigation for ${r.child_name}'s incident (${r.medication_name}) closed without root cause identified — reopen to complete analysis`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateMedicationIncidentCaraInsights(
  metrics: ReturnType<typeof computeMedicationIncidentMetrics>,
  alerts: ReturnType<typeof computeMedicationIncidentAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (pink-themed)
  const seriousPct =
    metrics.total_incidents > 0
      ? Math.round((metrics.serious_harm_count / metrics.total_incidents) * 1000) / 10
      : 0;
  insights.push(
    `[pink] ${metrics.total_incidents} medication incidents across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.serious_harm_count} (${seriousPct}%) resulted in serious harm or death. ` +
      `Near misses: ${metrics.near_miss_count}. ` +
      `Open investigations: ${metrics.open_investigation_count}.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `GP notified rate: ${metrics.gp_notified_rate}%. ` +
        `Parent notified rate: ${metrics.parent_notified_rate}%. ` +
        `Root cause identified rate: ${metrics.root_cause_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns. ` +
        `GP notified rate: ${metrics.gp_notified_rate}%. ` +
        `Parent notified rate: ${metrics.parent_notified_rate}%. ` +
        `Root cause identified rate: ${metrics.root_cause_rate}%.`,
    );
  }

  // Insight 3: Reflective question
  insights.push(
    `[reflect] Are medication incidents being thoroughly investigated with root causes identified, ` +
      `and is learning from each incident genuinely embedded into practice to prevent recurrence?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export function listMedicationIncidentReports(
  homeId: string,
): Promise<ServiceResult<MedicationIncidentReportRow[]>> {
  if (!isSupabaseEnabled()) return Promise.resolve({ ok: true, data: [] });

  const q = (
    (createServerClient() as unknown as SB) as any
  ).from("cs_medication_incident_reports").select("*").eq("home_id", homeId)
    .order("created_at", { ascending: false }).limit(200);

  return q.then(({ data, error }: { data: MedicationIncidentReportRow[] | null; error: { message: string } | null }) => {
    if (error) return { ok: false, error: error.message } as ServiceResult<MedicationIncidentReportRow[]>;
    return { ok: true, data: data ?? [] } as ServiceResult<MedicationIncidentReportRow[]>;
  });
}

export function createMedicationIncidentReport(payload: {
  homeId: string;
  childName: string;
  childId?: string | null;
  incidentDate: string;
  incidentType: IncidentType;
  incidentSeverity: IncidentSeverity;
  investigationStatus: InvestigationStatus;
  contributingFactor: ContributingFactor;
  staffInvolved: string;
  medicationName: string;
  gpNotified?: boolean;
  parentNotified?: boolean;
  socialWorkerNotified?: boolean;
  ofstedNotified?: boolean;
  rootCauseIdentified?: boolean;
  learningShared?: boolean;
  dutyOfCandourApplied?: boolean;
  notes?: string | null;
}): Promise<ServiceResult<MedicationIncidentReportRow>> {
  if (!isSupabaseEnabled()) return Promise.resolve({ ok: false, error: "Supabase not configured" });

  const s = createServerClient() as unknown as SB;

  return ((s as any).from("cs_medication_incident_reports") as any)
    .insert({
      home_id: payload.homeId,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      incident_date: payload.incidentDate,
      incident_type: payload.incidentType,
      incident_severity: payload.incidentSeverity,
      investigation_status: payload.investigationStatus,
      contributing_factor: payload.contributingFactor,
      staff_involved: payload.staffInvolved,
      medication_name: payload.medicationName,
      gp_notified: payload.gpNotified ?? false,
      parent_notified: payload.parentNotified ?? false,
      social_worker_notified: payload.socialWorkerNotified ?? false,
      ofsted_notified: payload.ofstedNotified ?? false,
      root_cause_identified: payload.rootCauseIdentified ?? false,
      learning_shared: payload.learningShared ?? false,
      duty_of_candour_applied: payload.dutyOfCandourApplied ?? false,
      notes: payload.notes ?? null,
    })
    .select()
    .single()
    .then(({ data, error }: { data: MedicationIncidentReportRow | null; error: { message: string } | null }) => {
      if (error) return { ok: false, error: error.message } as ServiceResult<MedicationIncidentReportRow>;
      return { ok: true, data: data! } as ServiceResult<MedicationIncidentReportRow>;
    });
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMedicationIncidentMetrics,
  computeMedicationIncidentAlerts,
  generateMedicationIncidentCaraInsights,
};
