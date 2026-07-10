// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD RADICALISATION RISK SERVICE
// Radicalisation risk assessments, Prevent referrals, Channel programme,
// police notification, safety planning, and multi-agency coordination.
// CHR 2015 Reg 12 (protection of children — safeguarding from radicalisation),
// Reg 34 (fitness of workers — recognising radicalisation indicators).
// Working Together to Safeguard Children 2023, Prevent Duty Guidance 2023,
// Channel Duty Guidance 2020, Counter-Terrorism and Security Act 2015.
//
// SCCIF: Safety — "Children are protected from radicalisation and extremism."
// Ofsted expects proactive radicalisation screening, Prevent referrals,
// Channel engagement, and multi-agency coordination.
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

export const EXTREMISM_TYPES = [
  "Islamist",
  "Far Right",
  "Far Left",
  "Incel",
  "Mixed/Unclear",
  "Single Issue",
  "Not Determined",
] as const;
export type ExtremismType = (typeof EXTREMISM_TYPES)[number];

export const INDICATOR_TYPES = [
  "Online Activity",
  "Social Isolation",
  "Expressed Views",
  "Material Possession",
  "Behavioural Change",
  "Association",
  "Travel Concerns",
  "Not Determined",
] as const;
export type IndicatorType = (typeof INDICATOR_TYPES)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Under Review",
  "Escalated",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ChildRadicalisationRiskRow {
  id: string;
  home_id: string;
  assessment_date: string;
  assessor_name: string;
  child_name: string;
  risk_level: RiskLevel;
  extremism_type: ExtremismType;
  indicator_type: IndicatorType;
  prevent_referral_made: boolean;
  channel_programme: boolean;
  police_notification: boolean;
  safety_plan_in_place: boolean;
  multi_agency_referral: boolean;
  internet_monitoring: boolean;
  next_review_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMetrics(
  rows: ChildRadicalisationRiskRow[],
): {
  total_assessments: number;
  high_risk_count: number;
  immediate_count: number;
  prevent_referral_rate: number;
  channel_rate: number;
  police_notification_rate: number;
  safety_plan_rate: number;
  multi_agency_rate: number;
  internet_monitoring_rate: number;
  unique_children: number;
  unique_assessors: number;
} {
  const highRisk = rows.filter(
    (r) => r.risk_level === "High" || r.risk_level === "Immediate",
  ).length;
  const immediateCount = rows.filter(
    (r) => r.risk_level === "Immediate",
  ).length;

  const boolRate = (field: keyof ChildRadicalisationRiskRow) => {
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
    prevent_referral_rate: boolRate("prevent_referral_made"),
    channel_rate: boolRate("channel_programme"),
    police_notification_rate: boolRate("police_notification"),
    safety_plan_rate: boolRate("safety_plan_in_place"),
    multi_agency_rate: boolRate("multi_agency_referral"),
    internet_monitoring_rate: boolRate("internet_monitoring"),
    unique_children: uniqueChildren,
    unique_assessors: uniqueAssessors,
  };
}

export function computeAlerts(
  rows: ChildRadicalisationRiskRow[],
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

  // Critical: High/Immediate risk without Prevent referral
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Immediate") &&
      !r.prevent_referral_made
    ) {
      alerts.push({
        type: "high_risk_no_prevent_referral",
        severity: "critical",
        message: `${r.child_name} has ${r.risk_level} radicalisation risk with no Prevent referral made — submit Prevent referral urgently`,
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
        message: `${r.child_name} has Immediate radicalisation risk with no safety plan in place — implement safety plan urgently`,
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
        message: `Police not notified for ${r.child_name} with ${r.risk_level} radicalisation risk — consider police notification`,
        record_id: r.id,
      });
    }
  }

  // Medium: No Channel programme for High/Immediate risk
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Immediate") &&
      !r.channel_programme
    ) {
      alerts.push({
        type: "no_channel_high_risk",
        severity: "medium",
        message: `Channel programme not engaged for ${r.child_name} with ${r.risk_level} radicalisation risk — consider Channel referral`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: ChildRadicalisationRiskRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary counts
  insights.push(
    `[red] ${metrics.total_assessments} radicalisation risk assessments recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.high_risk_count} at High or Immediate risk level. ` +
      `${metrics.immediate_count} at Immediate risk. ` +
      `Prevent referral rate: ${metrics.prevent_referral_rate}%.`,
  );

  // Insight 2: Priority findings
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Channel programme rate: ${metrics.channel_rate}%. ` +
        `Police notification rate: ${metrics.police_notification_rate}%. ` +
        `Internet monitoring rate: ${metrics.internet_monitoring_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns identified. ` +
        `Channel programme rate: ${metrics.channel_rate}%. ` +
        `Police notification rate: ${metrics.police_notification_rate}%. ` +
        `Internet monitoring rate: ${metrics.internet_monitoring_rate}%.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  insights.push(
    `[reflect] Are Prevent referrals being made consistently for all children at risk of radicalisation, ` +
      `and is each child's safety plan informed by Channel programme engagement, internet monitoring, and multi-agency intelligence?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildRadicalisationRisks(
  homeId: string,
  filters?: { riskLevel?: RiskLevel; extremismType?: ExtremismType; complianceStatus?: ComplianceStatus },
): Promise<ServiceResult<ChildRadicalisationRiskRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_radicalisation_risks") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.extremismType) q = q.eq("extremism_type", filters.extremismType);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);

  q = q.order("assessment_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildRadicalisationRisk(input: {
  homeId: string;
  assessmentDate: string;
  assessorName: string;
  childName: string;
  riskLevel: RiskLevel;
  extremismType: ExtremismType;
  indicatorType: IndicatorType;
  preventReferralMade?: boolean;
  channelProgramme?: boolean;
  policeNotification?: boolean;
  safetyPlanInPlace?: boolean;
  multiAgencyReferral?: boolean;
  internetMonitoring?: boolean;
  nextReviewDate?: string | null;
  complianceStatus?: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<ChildRadicalisationRiskRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_radicalisation_risks") as SB)
    .insert({
      home_id: input.homeId,
      assessment_date: input.assessmentDate,
      assessor_name: input.assessorName,
      child_name: input.childName,
      risk_level: input.riskLevel,
      extremism_type: input.extremismType,
      indicator_type: input.indicatorType,
      prevent_referral_made: input.preventReferralMade ?? false,
      channel_programme: input.channelProgramme ?? false,
      police_notification: input.policeNotification ?? false,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      multi_agency_referral: input.multiAgencyReferral ?? false,
      internet_monitoring: input.internetMonitoring ?? false,
      next_review_date: input.nextReviewDate ?? null,
      compliance_status: input.complianceStatus ?? "Under Review",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateChildRadicalisationRisk(
  id: string,
  updates: Partial<{
    assessmentDate: string;
    assessorName: string;
    childName: string;
    riskLevel: RiskLevel;
    extremismType: ExtremismType;
    indicatorType: IndicatorType;
    preventReferralMade: boolean;
    channelProgramme: boolean;
    policeNotification: boolean;
    safetyPlanInPlace: boolean;
    multiAgencyReferral: boolean;
    internetMonitoring: boolean;
    nextReviewDate: string | null;
    complianceStatus: ComplianceStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildRadicalisationRiskRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.assessorName !== undefined) mapped.assessor_name = updates.assessorName;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.extremismType !== undefined) mapped.extremism_type = updates.extremismType;
  if (updates.indicatorType !== undefined) mapped.indicator_type = updates.indicatorType;
  if (updates.preventReferralMade !== undefined) mapped.prevent_referral_made = updates.preventReferralMade;
  if (updates.channelProgramme !== undefined) mapped.channel_programme = updates.channelProgramme;
  if (updates.policeNotification !== undefined) mapped.police_notification = updates.policeNotification;
  if (updates.safetyPlanInPlace !== undefined) mapped.safety_plan_in_place = updates.safetyPlanInPlace;
  if (updates.multiAgencyReferral !== undefined) mapped.multi_agency_referral = updates.multiAgencyReferral;
  if (updates.internetMonitoring !== undefined) mapped.internet_monitoring = updates.internetMonitoring;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.complianceStatus !== undefined) mapped.compliance_status = updates.complianceStatus;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (s.from("cs_child_radicalisation_risks") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteChildRadicalisationRisk(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { error } = await (s.from("cs_child_radicalisation_risks") as SB)
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
