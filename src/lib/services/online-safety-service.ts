// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ONLINE SAFETY SERVICE
// Manages online safety assessments, incidents, education, and monitoring
// for children and young people in residential care.
// CHR 2015 Reg 12 (safeguarding — online risks),
// Reg 5 (quality of care — digital wellbeing),
// KCSIE (Keeping Children Safe in Education — online safety).
//
// Tracks device usage agreements, online safety incidents, education
// sessions, filtering/monitoring checks, and digital wellbeing assessments.
//
// SCCIF: Safety — "Children are protected from online risks."
// "Staff understand online risks and respond effectively."
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

export type OnlineRiskCategory =
  | "cyberbullying"
  | "inappropriate_content"
  | "grooming"
  | "sexting"
  | "radicalisation"
  | "excessive_screen_time"
  | "online_gambling"
  | "identity_theft"
  | "social_media_misuse"
  | "data_sharing"
  | "online_exploitation"
  | "self_harm_content"
  | "other";

export type IncidentSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type DeviceAgreementStatus =
  | "active"
  | "suspended"
  | "revoked"
  | "pending_review"
  | "not_in_place";

export type SafetyCheckResult =
  | "compliant"
  | "issues_found"
  | "action_required"
  | "not_checked";

export interface OnlineSafetyIncident {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  incident_date: string;
  risk_category: OnlineRiskCategory;
  severity: IncidentSeverity;
  description: string;
  platform_involved: string | null;
  device_type: string | null;
  action_taken: string;
  parent_carer_informed: boolean;
  social_worker_informed: boolean;
  police_involved: boolean;
  safeguarding_referral: boolean;
  outcome: string | null;
  staff_recording: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceAgreement {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  device_types: string[];
  agreement_date: string;
  review_date: string;
  status: DeviceAgreementStatus;
  filtering_enabled: boolean;
  monitoring_enabled: boolean;
  agreed_usage_hours: number;
  restrictions: string[];
  last_safety_check: string | null;
  last_check_result: SafetyCheckResult;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ONLINE_RISK_CATEGORIES: { category: OnlineRiskCategory; label: string }[] = [
  { category: "cyberbullying", label: "Cyberbullying" },
  { category: "inappropriate_content", label: "Inappropriate Content" },
  { category: "grooming", label: "Grooming" },
  { category: "sexting", label: "Sexting" },
  { category: "radicalisation", label: "Radicalisation" },
  { category: "excessive_screen_time", label: "Excessive Screen Time" },
  { category: "online_gambling", label: "Online Gambling" },
  { category: "identity_theft", label: "Identity Theft" },
  { category: "social_media_misuse", label: "Social Media Misuse" },
  { category: "data_sharing", label: "Data Sharing" },
  { category: "online_exploitation", label: "Online Exploitation" },
  { category: "self_harm_content", label: "Self-Harm Content" },
  { category: "other", label: "Other" },
];

export const INCIDENT_SEVERITIES: { severity: IncidentSeverity; label: string }[] = [
  { severity: "critical", label: "Critical" },
  { severity: "high", label: "High" },
  { severity: "medium", label: "Medium" },
  { severity: "low", label: "Low" },
];

export const DEVICE_AGREEMENT_STATUSES: { status: DeviceAgreementStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "suspended", label: "Suspended" },
  { status: "revoked", label: "Revoked" },
  { status: "pending_review", label: "Pending Review" },
  { status: "not_in_place", label: "Not in Place" },
];

export const SAFETY_CHECK_RESULTS: { result: SafetyCheckResult; label: string }[] = [
  { result: "compliant", label: "Compliant" },
  { result: "issues_found", label: "Issues Found" },
  { result: "action_required", label: "Action Required" },
  { result: "not_checked", label: "Not Checked" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute online safety metrics.
 */
export function computeOnlineSafetyMetrics(
  incidents: OnlineSafetyIncident[],
  agreements: DeviceAgreement[],
  totalChildren: number,
  now: Date = new Date(),
): {
  total_incidents: number;
  incidents_this_month: number;
  critical_incidents: number;
  safeguarding_referrals: number;
  police_involved_count: number;
  total_agreements: number;
  active_agreements: number;
  agreement_coverage: number;
  filtering_enabled_rate: number;
  monitoring_enabled_rate: number;
  checks_overdue: number;
  issues_found: number;
  by_risk_category: Record<string, number>;
  by_severity: Record<string, number>;
  by_agreement_status: Record<string, number>;
  by_check_result: Record<string, number>;
} {
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const incidentsThisMonth = incidents.filter(
    (i) => new Date(i.incident_date) >= thirtyDaysAgo && new Date(i.incident_date) <= now,
  ).length;
  const critical = incidents.filter((i) => i.severity === "critical").length;
  const safeguarding = incidents.filter((i) => i.safeguarding_referral).length;
  const police = incidents.filter((i) => i.police_involved).length;

  // Agreement metrics
  const active = agreements.filter((a) => a.status === "active").length;
  const uniqueChildren = new Set(agreements.filter((a) => a.status === "active").map((a) => a.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : 0;

  const filteringEnabled = agreements.filter((a) => a.status === "active" && a.filtering_enabled).length;
  const filteringRate =
    active > 0 ? Math.round((filteringEnabled / active) * 1000) / 10 : 0;

  const monitoringEnabled = agreements.filter((a) => a.status === "active" && a.monitoring_enabled).length;
  const monitoringRate =
    active > 0 ? Math.round((monitoringEnabled / active) * 1000) / 10 : 0;

  // Check overdue (review_date past + active)
  const checksOverdue = agreements.filter(
    (a) => a.status === "active" && new Date(a.review_date) < now,
  ).length;

  const issuesFound = agreements.filter(
    (a) => a.last_check_result === "issues_found" || a.last_check_result === "action_required",
  ).length;

  // By risk category
  const byRiskCategory: Record<string, number> = {};
  for (const i of incidents) {
    byRiskCategory[i.risk_category] = (byRiskCategory[i.risk_category] ?? 0) + 1;
  }

  // By severity
  const bySeverity: Record<string, number> = {};
  for (const i of incidents) {
    bySeverity[i.severity] = (bySeverity[i.severity] ?? 0) + 1;
  }

  // By agreement status
  const byAgreementStatus: Record<string, number> = {};
  for (const a of agreements) {
    byAgreementStatus[a.status] = (byAgreementStatus[a.status] ?? 0) + 1;
  }

  // By check result
  const byCheckResult: Record<string, number> = {};
  for (const a of agreements) {
    byCheckResult[a.last_check_result] = (byCheckResult[a.last_check_result] ?? 0) + 1;
  }

  return {
    total_incidents: incidents.length,
    incidents_this_month: incidentsThisMonth,
    critical_incidents: critical,
    safeguarding_referrals: safeguarding,
    police_involved_count: police,
    total_agreements: agreements.length,
    active_agreements: active,
    agreement_coverage: coverage,
    filtering_enabled_rate: filteringRate,
    monitoring_enabled_rate: monitoringRate,
    checks_overdue: checksOverdue,
    issues_found: issuesFound,
    by_risk_category: byRiskCategory,
    by_severity: bySeverity,
    by_agreement_status: byAgreementStatus,
    by_check_result: byCheckResult,
  };
}

/**
 * Identify online safety alerts.
 */
export function identifyOnlineSafetyAlerts(
  incidents: OnlineSafetyIncident[],
  agreements: DeviceAgreement[],
  totalChildren: number,
  now: Date = new Date(),
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

  // Critical/high incidents needing safeguarding referral but not made
  for (const i of incidents) {
    if (
      (i.severity === "critical" || i.severity === "high") &&
      (i.risk_category === "grooming" || i.risk_category === "online_exploitation" || i.risk_category === "sexting") &&
      !i.safeguarding_referral
    ) {
      alerts.push({
        type: "safeguarding_not_referred",
        severity: "critical",
        message: `${i.risk_category === "grooming" ? "Grooming" : i.risk_category === "online_exploitation" ? "Online exploitation" : "Sexting"} incident involving ${i.child_name} on ${i.incident_date} — safeguarding referral not made`,
        id: i.id,
      });
    }
  }

  // No device agreement in place
  const childrenWithAgreement = new Set(
    agreements.filter((a) => a.status === "active" || a.status === "pending_review").map((a) => a.child_id),
  );
  if (totalChildren > 0 && childrenWithAgreement.size < totalChildren) {
    const gap = totalChildren - childrenWithAgreement.size;
    alerts.push({
      type: "no_agreement",
      severity: "high",
      message: `${gap} ${gap === 1 ? "child does" : "children do"} not have an active device usage agreement — ensure agreements are in place`,
      id: "agreement_gap",
    });
  }

  // Agreement review overdue
  for (const a of agreements) {
    if (a.status === "active" && new Date(a.review_date) < now) {
      alerts.push({
        type: "review_overdue",
        severity: "medium",
        message: `Device agreement for ${a.child_name} overdue for review since ${a.review_date} — review filtering and monitoring arrangements`,
        id: a.id,
      });
    }
  }

  // Filtering/monitoring not enabled
  for (const a of agreements) {
    if (a.status === "active" && (!a.filtering_enabled || !a.monitoring_enabled)) {
      const missing = !a.filtering_enabled && !a.monitoring_enabled
        ? "Filtering and monitoring"
        : !a.filtering_enabled
          ? "Filtering"
          : "Monitoring";
      alerts.push({
        type: "safety_controls_missing",
        severity: "high",
        message: `${missing} not enabled for ${a.child_name}'s device agreement — review safety controls`,
        id: a.id,
      });
    }
  }

  // Safety check issues
  for (const a of agreements) {
    if (a.last_check_result === "action_required") {
      alerts.push({
        type: "check_action_required",
        severity: "high",
        message: `Safety check for ${a.child_name}'s devices found issues requiring action — address before next review`,
        id: a.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Incidents ──────────────────────────────────────────────────

export async function listIncidents(
  homeId: string,
  filters?: {
    childId?: string;
    riskCategory?: OnlineRiskCategory;
    severity?: IncidentSeverity;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<OnlineSafetyIncident[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_online_safety_incidents") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.riskCategory) q = q.eq("risk_category", filters.riskCategory);
  if (filters?.severity) q = q.eq("severity", filters.severity);
  if (filters?.dateFrom) q = q.gte("incident_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("incident_date", filters.dateTo);
  q = q.order("incident_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createIncident(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    incidentDate: string;
    riskCategory: OnlineRiskCategory;
    severity: IncidentSeverity;
    description: string;
    platformInvolved?: string;
    deviceType?: string;
    actionTaken: string;
    parentCarerInformed: boolean;
    socialWorkerInformed: boolean;
    policeInvolved: boolean;
    safeguardingReferral: boolean;
    staffRecording: string;
  },
): Promise<ServiceResult<OnlineSafetyIncident>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_online_safety_incidents") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      incident_date: input.incidentDate,
      risk_category: input.riskCategory,
      severity: input.severity,
      description: input.description,
      platform_involved: input.platformInvolved ?? null,
      device_type: input.deviceType ?? null,
      action_taken: input.actionTaken,
      parent_carer_informed: input.parentCarerInformed,
      social_worker_informed: input.socialWorkerInformed,
      police_involved: input.policeInvolved,
      safeguarding_referral: input.safeguardingReferral,
      outcome: null,
      staff_recording: input.staffRecording,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateIncident(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<OnlineSafetyIncident>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_online_safety_incidents") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Device Agreements ──────────────────────────────────────────

export async function listAgreements(
  homeId: string,
  filters?: {
    childId?: string;
    status?: DeviceAgreementStatus;
    limit?: number;
  },
): Promise<ServiceResult<DeviceAgreement[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_device_agreements") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("agreement_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAgreement(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    deviceTypes: string[];
    agreementDate: string;
    reviewDate: string;
    filteringEnabled: boolean;
    monitoringEnabled: boolean;
    agreedUsageHours: number;
    restrictions: string[];
  },
): Promise<ServiceResult<DeviceAgreement>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_device_agreements") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      device_types: input.deviceTypes,
      agreement_date: input.agreementDate,
      review_date: input.reviewDate,
      status: "active",
      filtering_enabled: input.filteringEnabled,
      monitoring_enabled: input.monitoringEnabled,
      agreed_usage_hours: input.agreedUsageHours,
      restrictions: input.restrictions,
      last_safety_check: null,
      last_check_result: "not_checked",
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAgreement(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<DeviceAgreement>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_device_agreements") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeOnlineSafetyMetrics,
  identifyOnlineSafetyAlerts,
};
