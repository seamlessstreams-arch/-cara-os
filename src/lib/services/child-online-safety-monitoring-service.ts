// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD ONLINE SAFETY MONITORING SERVICE
// Device checks, internet filter reviews, social media audits, app reviews,
// screen time reviews, online incident recording, education sessions,
// and policy reviews for children in residential care.
// CHR 2015 Reg 12 (protection of children — online safety),
// Reg 13 (child's arrangements — digital wellbeing),
// Keeping Children Safe in Education 2023,
// Working Together to Safeguard Children 2023.
//
// SCCIF: Safety — "Children are protected from online risks and harm."
// Ofsted expects proactive online safety monitoring, age-appropriate filtering,
// parental controls, social media oversight, and prompt response to incidents.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Enums ─────────────────────────────────────────────────────────────────

export const CHECK_TYPES = [
  "Device Check",
  "Internet Filter Review",
  "Social Media Audit",
  "App Review",
  "Screen Time Review",
  "Online Incident",
  "Education Session",
  "Policy Review",
] as const;
export type CheckType = (typeof CHECK_TYPES)[number];

export const RISK_LEVELS = [
  "No Identified Risk",
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Action Required",
  "Under Review",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ChildOnlineSafetyMonitoringRow {
  id: string;
  home_id: string;
  check_date: string;
  checker_name: string;
  child_name: string;
  check_type: CheckType;
  risk_level: RiskLevel;
  filtering_active: boolean;
  age_appropriate: boolean;
  parental_controls: boolean;
  social_media_reviewed: boolean;
  harmful_content_found: boolean;
  online_contact_risk: boolean;
  cyberbullying_identified: boolean;
  action_taken: boolean;
  child_educated: boolean;
  parent_carer_notified: boolean;
  next_review_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMetrics(
  rows: ChildOnlineSafetyMonitoringRow[],
): {
  total_checks: number;
  high_risk_count: number;
  critical_count: number;
  harmful_content_count: number;
  cyberbullying_count: number;
  online_contact_risk_count: number;
  filtering_rate: number;
  age_appropriate_rate: number;
  parental_controls_rate: number;
  social_media_reviewed_rate: number;
  action_taken_rate: number;
  child_educated_rate: number;
  unique_children: number;
  unique_checkers: number;
} {
  const highRisk = rows.filter(
    (r) => r.risk_level === "High" || r.risk_level === "Critical",
  ).length;
  const criticalCount = rows.filter(
    (r) => r.risk_level === "Critical",
  ).length;
  const harmfulContentCount = rows.filter(
    (r) => r.harmful_content_found === true,
  ).length;
  const cyberbullyingCount = rows.filter(
    (r) => r.cyberbullying_identified === true,
  ).length;
  const onlineContactRiskCount = rows.filter(
    (r) => r.online_contact_risk === true,
  ).length;

  const boolRate = (field: keyof ChildOnlineSafetyMonitoringRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueCheckers = new Set(rows.map((r) => r.checker_name)).size;

  return {
    total_checks: rows.length,
    high_risk_count: highRisk,
    critical_count: criticalCount,
    harmful_content_count: harmfulContentCount,
    cyberbullying_count: cyberbullyingCount,
    online_contact_risk_count: onlineContactRiskCount,
    filtering_rate: boolRate("filtering_active"),
    age_appropriate_rate: boolRate("age_appropriate"),
    parental_controls_rate: boolRate("parental_controls"),
    social_media_reviewed_rate: boolRate("social_media_reviewed"),
    action_taken_rate: boolRate("action_taken"),
    child_educated_rate: boolRate("child_educated"),
    unique_children: uniqueChildren,
    unique_checkers: uniqueCheckers,
  };
}

export function computeAlerts(
  rows: ChildOnlineSafetyMonitoringRow[],
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

  // Critical: harmful content found
  for (const r of rows) {
    if (r.harmful_content_found) {
      alerts.push({
        type: "harmful_content_found",
        severity: "critical",
        message: `Harmful content found during check for ${r.child_name} — investigate and remove access immediately`,
        record_id: r.id,
      });
    }
  }

  // Critical: online contact risk
  for (const r of rows) {
    if (r.online_contact_risk) {
      alerts.push({
        type: "online_contact_risk",
        severity: "critical",
        message: `Online contact risk identified for ${r.child_name} — assess contact and safeguard urgently`,
        record_id: r.id,
      });
    }
  }

  // High: cyberbullying identified
  for (const r of rows) {
    if (r.cyberbullying_identified) {
      alerts.push({
        type: "cyberbullying_identified",
        severity: "high",
        message: `Cyberbullying identified for ${r.child_name} — implement anti-bullying response`,
        record_id: r.id,
      });
    }
  }

  // High: filtering not active
  for (const r of rows) {
    if (!r.filtering_active) {
      alerts.push({
        type: "filtering_not_active",
        severity: "high",
        message: `Internet filtering not active for ${r.child_name} — enable filtering immediately`,
        record_id: r.id,
      });
    }
  }

  // Medium: child not educated after incident
  for (const r of rows) {
    if (
      r.check_type === "Online Incident" &&
      !r.child_educated
    ) {
      alerts.push({
        type: "child_not_educated_after_incident",
        severity: "medium",
        message: `${r.child_name} not educated following online incident — schedule education session`,
        record_id: r.id,
      });
    }
  }

  // Medium: parent/carer not notified for high+critical
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Critical") &&
      !r.parent_carer_notified
    ) {
      alerts.push({
        type: "parent_carer_not_notified_high_risk",
        severity: "medium",
        message: `Parent/carer not notified for ${r.child_name} with ${r.risk_level} online safety risk — notify parent/carer`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: ChildOnlineSafetyMonitoringRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary counts
  insights.push(
    `[sky] ${metrics.total_checks} online safety checks recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.high_risk_count} at High or Critical risk level. ` +
      `${metrics.critical_count} at Critical risk. ` +
      `Filtering active rate: ${metrics.filtering_rate}%.`,
  );

  // Insight 2: Priority findings
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Harmful content found: ${metrics.harmful_content_count}. ` +
        `Cyberbullying identified: ${metrics.cyberbullying_count}. ` +
        `Online contact risks: ${metrics.online_contact_risk_count}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns identified. ` +
        `Harmful content found: ${metrics.harmful_content_count}. ` +
        `Cyberbullying identified: ${metrics.cyberbullying_count}. ` +
        `Online contact risks: ${metrics.online_contact_risk_count}.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  insights.push(
    `[reflect] Are internet filters consistently active for all children, ` +
      `and is each child educated about online safety risks including harmful content, cyberbullying, and unsafe online contact?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildOnlineSafetyMonitoring(
  homeId: string,
  filters?: { checkType?: CheckType; riskLevel?: RiskLevel; complianceStatus?: ComplianceStatus },
): Promise<ServiceResult<ChildOnlineSafetyMonitoringRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_online_safety_monitoring") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.checkType) q = q.eq("check_type", filters.checkType);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);

  q = q.order("check_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildOnlineSafetyMonitoring(input: {
  homeId: string;
  checkDate: string;
  checkerName: string;
  childName: string;
  checkType: CheckType;
  riskLevel: RiskLevel;
  filteringActive?: boolean;
  ageAppropriate?: boolean;
  parentalControls?: boolean;
  socialMediaReviewed?: boolean;
  harmfulContentFound?: boolean;
  onlineContactRisk?: boolean;
  cyberbullyingIdentified?: boolean;
  actionTaken?: boolean;
  childEducated?: boolean;
  parentCarerNotified?: boolean;
  nextReviewDate?: string | null;
  complianceStatus?: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<ChildOnlineSafetyMonitoringRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_online_safety_monitoring") as SB)
    .insert({
      home_id: input.homeId,
      check_date: input.checkDate,
      checker_name: input.checkerName,
      child_name: input.childName,
      check_type: input.checkType,
      risk_level: input.riskLevel,
      filtering_active: input.filteringActive ?? false,
      age_appropriate: input.ageAppropriate ?? false,
      parental_controls: input.parentalControls ?? false,
      social_media_reviewed: input.socialMediaReviewed ?? false,
      harmful_content_found: input.harmfulContentFound ?? false,
      online_contact_risk: input.onlineContactRisk ?? false,
      cyberbullying_identified: input.cyberbullyingIdentified ?? false,
      action_taken: input.actionTaken ?? false,
      child_educated: input.childEducated ?? false,
      parent_carer_notified: input.parentCarerNotified ?? false,
      next_review_date: input.nextReviewDate ?? null,
      compliance_status: input.complianceStatus ?? "Under Review",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateChildOnlineSafetyMonitoring(
  id: string,
  updates: Partial<{
    checkDate: string;
    checkerName: string;
    childName: string;
    checkType: CheckType;
    riskLevel: RiskLevel;
    filteringActive: boolean;
    ageAppropriate: boolean;
    parentalControls: boolean;
    socialMediaReviewed: boolean;
    harmfulContentFound: boolean;
    onlineContactRisk: boolean;
    cyberbullyingIdentified: boolean;
    actionTaken: boolean;
    childEducated: boolean;
    parentCarerNotified: boolean;
    nextReviewDate: string | null;
    complianceStatus: ComplianceStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildOnlineSafetyMonitoringRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.checkDate !== undefined) mapped.check_date = updates.checkDate;
  if (updates.checkerName !== undefined) mapped.checker_name = updates.checkerName;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.checkType !== undefined) mapped.check_type = updates.checkType;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.filteringActive !== undefined) mapped.filtering_active = updates.filteringActive;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.parentalControls !== undefined) mapped.parental_controls = updates.parentalControls;
  if (updates.socialMediaReviewed !== undefined) mapped.social_media_reviewed = updates.socialMediaReviewed;
  if (updates.harmfulContentFound !== undefined) mapped.harmful_content_found = updates.harmfulContentFound;
  if (updates.onlineContactRisk !== undefined) mapped.online_contact_risk = updates.onlineContactRisk;
  if (updates.cyberbullyingIdentified !== undefined) mapped.cyberbullying_identified = updates.cyberbullyingIdentified;
  if (updates.actionTaken !== undefined) mapped.action_taken = updates.actionTaken;
  if (updates.childEducated !== undefined) mapped.child_educated = updates.childEducated;
  if (updates.parentCarerNotified !== undefined) mapped.parent_carer_notified = updates.parentCarerNotified;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.complianceStatus !== undefined) mapped.compliance_status = updates.complianceStatus;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (s.from("cs_child_online_safety_monitoring") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteChildOnlineSafetyMonitoring(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { error } = await (s.from("cs_child_online_safety_monitoring") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
};
