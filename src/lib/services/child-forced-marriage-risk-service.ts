// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD FORCED MARRIAGE RISK SERVICE
// Forced marriage risk assessments, Forced Marriage Protection Orders (FMPOs),
// multi-agency safeguarding, and specialist referral tracking
// for children in residential care.
// Anti-social Behaviour, Crime and Policing Act 2014 (criminalised forced marriage).
// Forced Marriage (Civil Protection) Act 2007 (FMPOs).
// CHR 2015 Reg 12 (protection of children — safeguarding from forced marriage).
// Working Together to Safeguard Children 2023.
// Multi-agency practice guidelines: Handling cases of Forced Marriage (2023).
//
// SCCIF: Safety — "Children are protected from forced marriage and harmful practices."
// Ofsted expects proactive risk assessment, FMPO compliance,
// Forced Marriage Unit engagement, and multi-agency safeguarding approaches.
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

export const FORCED_MARRIAGE_RISK_LEVELS = [
  "No Identified Risk",
  "Low",
  "Medium",
  "High",
  "Immediate",
] as const;
export type ForcedMarriageRiskLevel = (typeof FORCED_MARRIAGE_RISK_LEVELS)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ChildForcedMarriageRiskRow {
  id: string;
  home_id: string;
  child_name: string;
  assessment_date: string;
  risk_level: ForcedMarriageRiskLevel;
  risk_indicators_count: number;
  fmpo_in_place: boolean;
  police_notified: boolean;
  social_worker_notified: boolean;
  forced_marriage_unit_contacted: boolean;
  multi_agency_referral: boolean;
  safety_plan_in_place: boolean;
  passport_secured: boolean;
  travel_restrictions: boolean;
  specialist_service_involved: boolean;
  review_date: string | null;
  assessor_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeForcedMarriageRiskMetrics(
  rows: ChildForcedMarriageRiskRow[],
): {
  total_assessments: number;
  high_risk_count: number;
  fmpo_count: number;
  fmu_contacted_count: number;
  safety_plan_rate: number;
  multi_agency_rate: number;
  police_notification_rate: number;
  passport_secured_rate: number;
  travel_restriction_rate: number;
  review_scheduled_rate: number;
  unique_children: number;
  unique_assessors: number;
} {
  const highRisk = rows.filter(
    (r) => r.risk_level === "High" || r.risk_level === "Immediate",
  ).length;
  const fmpoCount = rows.filter((r) => r.fmpo_in_place).length;
  const fmuContactedCount = rows.filter((r) => r.forced_marriage_unit_contacted).length;

  const boolRate = (field: keyof ChildForcedMarriageRiskRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const reviewScheduledRate =
    rows.length > 0
      ? Math.round(
          (rows.filter((r) => r.review_date !== null).length / rows.length) * 1000,
        ) / 10
      : 0;

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  return {
    total_assessments: rows.length,
    high_risk_count: highRisk,
    fmpo_count: fmpoCount,
    fmu_contacted_count: fmuContactedCount,
    safety_plan_rate: boolRate("safety_plan_in_place"),
    multi_agency_rate: boolRate("multi_agency_referral"),
    police_notification_rate: boolRate("police_notified"),
    passport_secured_rate: boolRate("passport_secured"),
    travel_restriction_rate: boolRate("travel_restrictions"),
    review_scheduled_rate: reviewScheduledRate,
    unique_children: uniqueChildren,
    unique_assessors: uniqueAssessors,
  };
}

export function computeForcedMarriageRiskAlerts(
  rows: ChildForcedMarriageRiskRow[],
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

  // Critical: Immediate risk without FMPO
  for (const r of rows) {
    if (r.risk_level === "Immediate" && !r.fmpo_in_place) {
      alerts.push({
        type: "immediate_risk_no_fmpo",
        severity: "critical",
        message: `${r.child_name} has Immediate forced marriage risk without a Forced Marriage Protection Order — apply for FMPO immediately`,
        record_id: r.id,
      });
    }
  }

  // Critical: High risk without safety plan
  for (const r of rows) {
    if (r.risk_level === "High" && !r.safety_plan_in_place) {
      alerts.push({
        type: "high_risk_no_safety_plan",
        severity: "critical",
        message: `${r.child_name} has High forced marriage risk with no safety plan in place — implement safety plan immediately`,
        record_id: r.id,
      });
    }
  }

  // High: High or Immediate risk without FMU contacted
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Immediate") &&
      !r.forced_marriage_unit_contacted
    ) {
      alerts.push({
        type: "high_risk_no_fmu_contact",
        severity: "high",
        message: `Forced Marriage Unit not contacted for ${r.child_name} with ${r.risk_level} risk — contact FMU for specialist advice`,
        record_id: r.id,
      });
    }
  }

  // Medium: Any risk (not "No Identified Risk") without multi-agency referral
  for (const r of rows) {
    if (r.risk_level !== "No Identified Risk" && !r.multi_agency_referral) {
      alerts.push({
        type: "risk_no_multi_agency_referral",
        severity: "medium",
        message: `Multi-agency referral not made for ${r.child_name} with ${r.risk_level} forced marriage risk — consider multi-agency strategy meeting`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateForcedMarriageRiskCaraInsights(
  rows: ChildForcedMarriageRiskRow[],
): string[] {
  const metrics = computeForcedMarriageRiskMetrics(rows);
  const alerts = computeForcedMarriageRiskAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary counts
  insights.push(
    `[red] ${metrics.total_assessments} forced marriage risk ${metrics.total_assessments === 1 ? "assessment" : "assessments"} recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.high_risk_count} at High or Immediate risk level. ` +
      `${metrics.fmpo_count} ${metrics.fmpo_count === 1 ? "FMPO" : "FMPOs"} in place. ` +
      `${metrics.fmu_contacted_count} Forced Marriage Unit ${metrics.fmu_contacted_count === 1 ? "contact" : "contacts"} made.`,
  );

  // Insight 2: Priority findings
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
        `Multi-agency rate: ${metrics.multi_agency_rate}%. ` +
        `Passport secured rate: ${metrics.passport_secured_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns identified. ` +
        `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
        `Multi-agency rate: ${metrics.multi_agency_rate}%. ` +
        `Passport secured rate: ${metrics.passport_secured_rate}%.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  insights.push(
    `[reflect] Are forced marriage risk assessments being conducted with appropriate multi-agency coordination, and is each child's safety plan ` +
      `informed by the Forced Marriage Unit, travel restrictions, passport security, and specialist service involvement?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildForcedMarriageRisks(
  homeId: string,
): Promise<ServiceResult<ChildForcedMarriageRiskRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_forced_marriage_risks") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("assessment_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildForcedMarriageRisk(input: {
  homeId: string;
  childName: string;
  assessmentDate: string;
  riskLevel: ForcedMarriageRiskLevel;
  riskIndicatorsCount?: number;
  fmpoInPlace?: boolean;
  policeNotified?: boolean;
  socialWorkerNotified?: boolean;
  forcedMarriageUnitContacted?: boolean;
  multiAgencyReferral?: boolean;
  safetyPlanInPlace?: boolean;
  passportSecured?: boolean;
  travelRestrictions?: boolean;
  specialistServiceInvolved?: boolean;
  reviewDate?: string | null;
  assessorName: string;
  notes?: string | null;
}): Promise<ServiceResult<ChildForcedMarriageRiskRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_forced_marriage_risks") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      assessment_date: input.assessmentDate,
      risk_level: input.riskLevel,
      risk_indicators_count: input.riskIndicatorsCount ?? 0,
      fmpo_in_place: input.fmpoInPlace ?? false,
      police_notified: input.policeNotified ?? false,
      social_worker_notified: input.socialWorkerNotified ?? true,
      forced_marriage_unit_contacted: input.forcedMarriageUnitContacted ?? false,
      multi_agency_referral: input.multiAgencyReferral ?? false,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      passport_secured: input.passportSecured ?? false,
      travel_restrictions: input.travelRestrictions ?? false,
      specialist_service_involved: input.specialistServiceInvolved ?? false,
      review_date: input.reviewDate ?? null,
      assessor_name: input.assessorName,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeForcedMarriageRiskMetrics,
  computeForcedMarriageRiskAlerts,
  generateForcedMarriageRiskCaraInsights,
};
