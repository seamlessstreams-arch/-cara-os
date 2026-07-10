// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD TRAFFICKING RISK SERVICE
// Trafficking risk assessments, NRM referrals, first responder notification,
// safety planning, safe accommodation, multi-agency coordination,
// police notification, and independent advocate engagement.
// CHR 2015 Reg 12 (protection of children — safeguarding from trafficking),
// Reg 34 (fitness of workers — recognising trafficking indicators).
// Working Together to Safeguard Children 2023, Modern Slavery Act 2015,
// National Referral Mechanism Guidance 2022, Trafficking and Exploitation
// Strategy, Children Act 1989/2004.
//
// SCCIF: Safety — "Children are protected from trafficking and exploitation."
// Ofsted expects proactive trafficking screening, NRM referrals,
// first responder engagement, and multi-agency coordination.
// ══════════════════════════════════════════════════════════════════════════════

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

export const TRAFFICKING_TYPES = [
  "Sexual Exploitation",
  "Labour Exploitation",
  "Criminal Exploitation",
  "Domestic Servitude",
  "Organ Harvesting",
  "Forced Begging",
  "Benefit Fraud",
  "Not Determined",
] as const;
export type TraffickingType = (typeof TRAFFICKING_TYPES)[number];

export const NRM_DECISIONS = [
  "Reasonable Grounds",
  "Conclusive Grounds",
  "Negative",
  "Pending",
  "Suspended",
] as const;
export type NrmDecision = (typeof NRM_DECISIONS)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Under Review",
  "Escalated",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ChildTraffickingRiskRow {
  id: string;
  home_id: string;
  assessment_date: string;
  assessor_name: string;
  child_name: string;
  risk_level: RiskLevel;
  trafficking_type: TraffickingType;
  country_of_origin: string | null;
  nrm_referral_made: boolean;
  nrm_decision: NrmDecision | null;
  first_responder_notified: boolean;
  safety_plan_in_place: boolean;
  safe_accommodation: boolean;
  multi_agency_referral: boolean;
  police_notification: boolean;
  independent_advocate: boolean;
  next_review_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMetrics(
  rows: ChildTraffickingRiskRow[],
): {
  total_assessments: number;
  high_risk_count: number;
  immediate_count: number;
  nrm_referral_rate: number;
  first_responder_rate: number;
  safety_plan_rate: number;
  safe_accommodation_rate: number;
  multi_agency_rate: number;
  police_notification_rate: number;
  advocate_rate: number;
  unique_children: number;
  unique_assessors: number;
} {
  const highRisk = rows.filter(
    (r) => r.risk_level === "High" || r.risk_level === "Immediate",
  ).length;
  const immediateCount = rows.filter(
    (r) => r.risk_level === "Immediate",
  ).length;

  const boolRate = (field: keyof ChildTraffickingRiskRow) => {
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
    nrm_referral_rate: boolRate("nrm_referral_made"),
    first_responder_rate: boolRate("first_responder_notified"),
    safety_plan_rate: boolRate("safety_plan_in_place"),
    safe_accommodation_rate: boolRate("safe_accommodation"),
    multi_agency_rate: boolRate("multi_agency_referral"),
    police_notification_rate: boolRate("police_notification"),
    advocate_rate: boolRate("independent_advocate"),
    unique_children: uniqueChildren,
    unique_assessors: uniqueAssessors,
  };
}

export function computeAlerts(
  rows: ChildTraffickingRiskRow[],
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

  // Critical: High/Immediate risk without NRM referral
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Immediate") &&
      !r.nrm_referral_made
    ) {
      alerts.push({
        type: "high_risk_no_nrm_referral",
        severity: "critical",
        message: `${r.child_name} has ${r.risk_level} trafficking risk with no NRM referral made — submit NRM referral urgently`,
        record_id: r.id,
      });
    }
  }

  // Critical: Immediate risk without safety plan
  for (const r of rows) {
    if (r.risk_level === "Immediate" && !r.safety_plan_in_place) {
      alerts.push({
        type: "immediate_no_safety_plan",
        severity: "critical",
        message: `${r.child_name} has Immediate trafficking risk with no safety plan in place — implement safety plan urgently`,
        record_id: r.id,
      });
    }
  }

  // High: No first responder notification for High/Immediate risk
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Immediate") &&
      !r.first_responder_notified
    ) {
      alerts.push({
        type: "no_first_responder_high_risk",
        severity: "high",
        message: `First responder not notified for ${r.child_name} with ${r.risk_level} trafficking risk — consider first responder notification`,
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
        message: `Police not notified for ${r.child_name} with ${r.risk_level} trafficking risk — consider police notification`,
        record_id: r.id,
      });
    }
  }

  // Medium: No independent advocate for High/Immediate risk
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Immediate") &&
      !r.independent_advocate
    ) {
      alerts.push({
        type: "no_advocate_high_risk",
        severity: "medium",
        message: `Independent advocate not engaged for ${r.child_name} with ${r.risk_level} trafficking risk — consider advocate referral`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: ChildTraffickingRiskRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary counts
  insights.push(
    `[fuchsia] ${metrics.total_assessments} trafficking risk assessments recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.high_risk_count} at High or Immediate risk level. ` +
      `${metrics.immediate_count} at Immediate risk. ` +
      `NRM referral rate: ${metrics.nrm_referral_rate}%.`,
  );

  // Insight 2: Priority findings
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `First responder rate: ${metrics.first_responder_rate}%. ` +
        `Police notification rate: ${metrics.police_notification_rate}%. ` +
        `Safe accommodation rate: ${metrics.safe_accommodation_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns identified. ` +
        `First responder rate: ${metrics.first_responder_rate}%. ` +
        `Police notification rate: ${metrics.police_notification_rate}%. ` +
        `Safe accommodation rate: ${metrics.safe_accommodation_rate}%.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  insights.push(
    `[reflect] Are NRM referrals being made consistently for all children at risk of trafficking, ` +
      `and is each child's safety plan informed by first responder engagement, safe accommodation, and multi-agency intelligence?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildTraffickingRisks(
  homeId: string,
  filters?: { riskLevel?: RiskLevel; traffickingType?: TraffickingType; complianceStatus?: ComplianceStatus },
): Promise<ServiceResult<ChildTraffickingRiskRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_trafficking_risks") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.traffickingType) q = q.eq("trafficking_type", filters.traffickingType);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);

  q = q.order("assessment_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildTraffickingRisk(input: {
  homeId: string;
  assessmentDate: string;
  assessorName: string;
  childName: string;
  riskLevel: RiskLevel;
  traffickingType: TraffickingType;
  countryOfOrigin?: string | null;
  nrmReferralMade?: boolean;
  nrmDecision?: NrmDecision | null;
  firstResponderNotified?: boolean;
  safetyPlanInPlace?: boolean;
  safeAccommodation?: boolean;
  multiAgencyReferral?: boolean;
  policeNotification?: boolean;
  independentAdvocate?: boolean;
  nextReviewDate?: string | null;
  complianceStatus?: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<ChildTraffickingRiskRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_trafficking_risks") as SB)
    .insert({
      home_id: input.homeId,
      assessment_date: input.assessmentDate,
      assessor_name: input.assessorName,
      child_name: input.childName,
      risk_level: input.riskLevel,
      trafficking_type: input.traffickingType,
      country_of_origin: input.countryOfOrigin ?? null,
      nrm_referral_made: input.nrmReferralMade ?? false,
      nrm_decision: input.nrmDecision ?? null,
      first_responder_notified: input.firstResponderNotified ?? false,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      safe_accommodation: input.safeAccommodation ?? false,
      multi_agency_referral: input.multiAgencyReferral ?? false,
      police_notification: input.policeNotification ?? false,
      independent_advocate: input.independentAdvocate ?? false,
      next_review_date: input.nextReviewDate ?? null,
      compliance_status: input.complianceStatus ?? "Under Review",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateChildTraffickingRisk(
  id: string,
  updates: Partial<{
    assessmentDate: string;
    assessorName: string;
    childName: string;
    riskLevel: RiskLevel;
    traffickingType: TraffickingType;
    countryOfOrigin: string | null;
    nrmReferralMade: boolean;
    nrmDecision: NrmDecision | null;
    firstResponderNotified: boolean;
    safetyPlanInPlace: boolean;
    safeAccommodation: boolean;
    multiAgencyReferral: boolean;
    policeNotification: boolean;
    independentAdvocate: boolean;
    nextReviewDate: string | null;
    complianceStatus: ComplianceStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildTraffickingRiskRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.assessorName !== undefined) mapped.assessor_name = updates.assessorName;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.traffickingType !== undefined) mapped.trafficking_type = updates.traffickingType;
  if (updates.countryOfOrigin !== undefined) mapped.country_of_origin = updates.countryOfOrigin;
  if (updates.nrmReferralMade !== undefined) mapped.nrm_referral_made = updates.nrmReferralMade;
  if (updates.nrmDecision !== undefined) mapped.nrm_decision = updates.nrmDecision;
  if (updates.firstResponderNotified !== undefined) mapped.first_responder_notified = updates.firstResponderNotified;
  if (updates.safetyPlanInPlace !== undefined) mapped.safety_plan_in_place = updates.safetyPlanInPlace;
  if (updates.safeAccommodation !== undefined) mapped.safe_accommodation = updates.safeAccommodation;
  if (updates.multiAgencyReferral !== undefined) mapped.multi_agency_referral = updates.multiAgencyReferral;
  if (updates.policeNotification !== undefined) mapped.police_notification = updates.policeNotification;
  if (updates.independentAdvocate !== undefined) mapped.independent_advocate = updates.independentAdvocate;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.complianceStatus !== undefined) mapped.compliance_status = updates.complianceStatus;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (s.from("cs_child_trafficking_risks") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteChildTraffickingRisk(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { error } = await (s.from("cs_child_trafficking_risks") as SB)
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
