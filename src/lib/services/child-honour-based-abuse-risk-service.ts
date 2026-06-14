// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD HONOUR-BASED ABUSE RISK SERVICE
// Honour-based abuse risk assessments, safety planning, multi-agency referrals,
// specialist service engagement, and the one chance rule.
// CHR 2015 Reg 12 (protection of children — safeguarding from honour-based abuse),
// Reg 34 (fitness of workers — recognising HBA indicators).
// Working Together to Safeguard Children 2023, Forced Marriage Unit guidance,
// Multi-agency statutory guidance on FGM, HM Government HBA guidance.
//
// SCCIF: Safety — "Children are protected from honour-based abuse and related practices."
// Ofsted expects proactive HBA screening, multi-agency referrals, and safety planning.
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

export const RISK_LEVELS = [
  "No Identified Risk",
  "Low",
  "Medium",
  "High",
  "Immediate",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const ABUSE_TYPES = [
  "Forced Marriage",
  "FGM",
  "Honour Killing Threat",
  "Physical Violence",
  "Emotional Abuse",
  "Isolation",
  "Financial Control",
  "Not Determined",
] as const;
export type AbuseType = (typeof ABUSE_TYPES)[number];

export const PERPETRATOR_RELATIONSHIPS = [
  "Parent",
  "Sibling",
  "Extended Family",
  "Community Member",
  "Partner",
  "Unknown",
  "Other",
] as const;
export type PerpetratorRelationship = (typeof PERPETRATOR_RELATIONSHIPS)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Under Review",
  "Escalated",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ChildHonourBasedAbuseRiskRow {
  id: string;
  home_id: string;
  assessment_date: string;
  assessor_name: string;
  child_name: string;
  risk_level: RiskLevel;
  abuse_type: AbuseType;
  perpetrator_relationship: PerpetratorRelationship;
  safety_plan_in_place: boolean;
  multi_agency_referral: boolean;
  police_notification: boolean;
  specialist_service_engaged: boolean;
  safe_accommodation_secured: boolean;
  one_chance_rule_applied: boolean;
  next_review_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMetrics(
  rows: ChildHonourBasedAbuseRiskRow[],
): {
  total_assessments: number;
  high_risk_count: number;
  immediate_count: number;
  safety_plan_rate: number;
  multi_agency_rate: number;
  police_notification_rate: number;
  specialist_rate: number;
  safe_accommodation_rate: number;
  one_chance_rule_rate: number;
  unique_children: number;
  unique_assessors: number;
} {
  const highRisk = rows.filter(
    (r) => r.risk_level === "High" || r.risk_level === "Immediate",
  ).length;
  const immediateCount = rows.filter(
    (r) => r.risk_level === "Immediate",
  ).length;

  const boolRate = (field: keyof ChildHonourBasedAbuseRiskRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  return {
    total_assessments: rows.length,
    high_risk_count: highRisk,
    immediate_count: immediateCount,
    safety_plan_rate: boolRate("safety_plan_in_place"),
    multi_agency_rate: boolRate("multi_agency_referral"),
    police_notification_rate: boolRate("police_notification"),
    specialist_rate: boolRate("specialist_service_engaged"),
    safe_accommodation_rate: boolRate("safe_accommodation_secured"),
    one_chance_rule_rate: boolRate("one_chance_rule_applied"),
    unique_children: uniqueChildren,
    unique_assessors: uniqueAssessors,
  };
}

export function computeAlerts(
  rows: ChildHonourBasedAbuseRiskRow[],
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

  // Critical: Immediate risk without safety plan
  for (const r of rows) {
    if (r.risk_level === "Immediate" && !r.safety_plan_in_place) {
      alerts.push({
        type: "immediate_no_safety_plan",
        severity: "critical",
        message: `${r.child_name} has Immediate honour-based abuse risk with no safety plan in place — implement safety plan urgently`,
        record_id: r.id,
      });
    }
  }

  // Critical: High risk without multi-agency referral
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Immediate") &&
      !r.multi_agency_referral
    ) {
      alerts.push({
        type: "high_risk_no_multi_agency",
        severity: "critical",
        message: `${r.child_name} has ${r.risk_level} honour-based abuse risk with no multi-agency referral — refer to MASH/MARAC immediately`,
        record_id: r.id,
      });
    }
  }

  // High: No police notification for High/Immediate risk
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Immediate") &&
      !r.police_notification
    ) {
      alerts.push({
        type: "no_police_high_risk",
        severity: "high",
        message: `Police not notified for ${r.child_name} with ${r.risk_level} honour-based abuse risk — consider police notification`,
        record_id: r.id,
      });
    }
  }

  // Medium: No specialist service for High/Immediate risk
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Immediate") &&
      !r.specialist_service_engaged
    ) {
      alerts.push({
        type: "no_specialist_high_risk",
        severity: "medium",
        message: `Specialist service not engaged for ${r.child_name} with ${r.risk_level} honour-based abuse risk — engage specialist HBA service`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: ChildHonourBasedAbuseRiskRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary counts
  insights.push(
    `[red] ${metrics.total_assessments} honour-based abuse risk assessments recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.high_risk_count} at High or Immediate risk level. ` +
      `${metrics.immediate_count} at Immediate risk. ` +
      `Safety plan rate: ${metrics.safety_plan_rate}%.`,
  );

  // Insight 2: Priority findings
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Multi-agency rate: ${metrics.multi_agency_rate}%. ` +
        `Police notification rate: ${metrics.police_notification_rate}%. ` +
        `Specialist service rate: ${metrics.specialist_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns identified. ` +
        `Multi-agency rate: ${metrics.multi_agency_rate}%. ` +
        `Police notification rate: ${metrics.police_notification_rate}%. ` +
        `Specialist service rate: ${metrics.specialist_rate}%.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  insights.push(
    `[reflect] Is the one chance rule being applied consistently for all children at risk of honour-based abuse, ` +
      `and is each child's safety plan informed by specialist services, safe accommodation, and multi-agency intelligence?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildHonourBasedAbuseRisks(
  homeId: string,
  filters?: { riskLevel?: RiskLevel; abuseType?: AbuseType; complianceStatus?: ComplianceStatus },
): Promise<ServiceResult<ChildHonourBasedAbuseRiskRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_honour_based_abuse_risks") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.abuseType) q = q.eq("abuse_type", filters.abuseType);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);

  q = q.order("assessment_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildHonourBasedAbuseRisk(input: {
  homeId: string;
  assessmentDate: string;
  assessorName: string;
  childName: string;
  riskLevel: RiskLevel;
  abuseType: AbuseType;
  perpetratorRelationship: PerpetratorRelationship;
  safetyPlanInPlace?: boolean;
  multiAgencyReferral?: boolean;
  policeNotification?: boolean;
  specialistServiceEngaged?: boolean;
  safeAccommodationSecured?: boolean;
  oneChanceRuleApplied?: boolean;
  nextReviewDate?: string | null;
  complianceStatus?: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<ChildHonourBasedAbuseRiskRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_honour_based_abuse_risks") as SB)
    .insert({
      home_id: input.homeId,
      assessment_date: input.assessmentDate,
      assessor_name: input.assessorName,
      child_name: input.childName,
      risk_level: input.riskLevel,
      abuse_type: input.abuseType,
      perpetrator_relationship: input.perpetratorRelationship,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      multi_agency_referral: input.multiAgencyReferral ?? false,
      police_notification: input.policeNotification ?? false,
      specialist_service_engaged: input.specialistServiceEngaged ?? false,
      safe_accommodation_secured: input.safeAccommodationSecured ?? false,
      one_chance_rule_applied: input.oneChanceRuleApplied ?? false,
      next_review_date: input.nextReviewDate ?? null,
      compliance_status: input.complianceStatus ?? "Under Review",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateChildHonourBasedAbuseRisk(
  id: string,
  updates: Partial<{
    assessmentDate: string;
    assessorName: string;
    childName: string;
    riskLevel: RiskLevel;
    abuseType: AbuseType;
    perpetratorRelationship: PerpetratorRelationship;
    safetyPlanInPlace: boolean;
    multiAgencyReferral: boolean;
    policeNotification: boolean;
    specialistServiceEngaged: boolean;
    safeAccommodationSecured: boolean;
    oneChanceRuleApplied: boolean;
    nextReviewDate: string | null;
    complianceStatus: ComplianceStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildHonourBasedAbuseRiskRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.assessorName !== undefined) mapped.assessor_name = updates.assessorName;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.abuseType !== undefined) mapped.abuse_type = updates.abuseType;
  if (updates.perpetratorRelationship !== undefined) mapped.perpetrator_relationship = updates.perpetratorRelationship;
  if (updates.safetyPlanInPlace !== undefined) mapped.safety_plan_in_place = updates.safetyPlanInPlace;
  if (updates.multiAgencyReferral !== undefined) mapped.multi_agency_referral = updates.multiAgencyReferral;
  if (updates.policeNotification !== undefined) mapped.police_notification = updates.policeNotification;
  if (updates.specialistServiceEngaged !== undefined) mapped.specialist_service_engaged = updates.specialistServiceEngaged;
  if (updates.safeAccommodationSecured !== undefined) mapped.safe_accommodation_secured = updates.safeAccommodationSecured;
  if (updates.oneChanceRuleApplied !== undefined) mapped.one_chance_rule_applied = updates.oneChanceRuleApplied;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.complianceStatus !== undefined) mapped.compliance_status = updates.complianceStatus;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (s.from("cs_child_honour_based_abuse_risks") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteChildHonourBasedAbuseRisk(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { error } = await (s.from("cs_child_honour_based_abuse_risks") as SB)
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
