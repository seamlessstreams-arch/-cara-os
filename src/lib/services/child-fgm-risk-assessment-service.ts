// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD FGM RISK ASSESSMENT SERVICE
// Female genital mutilation risk assessments, mandatory reporting,
// FGM Protection Orders, multi-agency safeguarding, and specialist referrals
// for children in residential care.
// Female Genital Mutilation Act 2003 (as amended by Serious Crime Act 2015).
// CHR 2015 Reg 12 (protection of children — safeguarding from FGM).
// Mandatory Reporting Duty (Section 5B FGM Act 2003).
// Working Together to Safeguard Children 2023.
// Multi-agency statutory guidance on FGM (2020).
//
// SCCIF: Safety — "Children are protected from FGM and harmful practices."
// Ofsted expects proactive FGM risk assessment, mandatory reporting compliance,
// and culturally sensitive safeguarding approaches.
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

export const FGM_RISK_LEVELS = [
  "No Identified Risk",
  "Low",
  "Medium",
  "High",
  "Immediate",
] as const;
export type FgmRiskLevel = (typeof FGM_RISK_LEVELS)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ChildFgmRiskAssessmentRow {
  id: string;
  home_id: string;
  child_name: string;
  assessment_date: string;
  risk_level: FgmRiskLevel;
  risk_indicators_count: number;
  mandatory_report_made: boolean;
  police_notified: boolean;
  social_worker_notified: boolean;
  fgm_protection_order: boolean;
  multi_agency_referral: boolean;
  safety_plan_in_place: boolean;
  cultural_sensitivity_considered: boolean;
  specialist_service_involved: boolean;
  specialist_service_name: string | null;
  review_date: string | null;
  assessor_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeFgmRiskMetrics(
  rows: ChildFgmRiskAssessmentRow[],
): {
  total_assessments: number;
  high_risk_count: number;
  mandatory_report_count: number;
  fgm_protection_order_count: number;
  safety_plan_rate: number;
  multi_agency_rate: number;
  police_notification_rate: number;
  specialist_rate: number;
  cultural_sensitivity_rate: number;
  review_scheduled_rate: number;
  unique_children: number;
  unique_assessors: number;
} {
  const highRisk = rows.filter(
    (r) => r.risk_level === "High" || r.risk_level === "Immediate",
  ).length;
  const mandatoryReportCount = rows.filter((r) => r.mandatory_report_made).length;
  const fgmProtectionOrderCount = rows.filter((r) => r.fgm_protection_order).length;

  const boolRate = (field: keyof ChildFgmRiskAssessmentRow) => {
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
    mandatory_report_count: mandatoryReportCount,
    fgm_protection_order_count: fgmProtectionOrderCount,
    safety_plan_rate: boolRate("safety_plan_in_place"),
    multi_agency_rate: boolRate("multi_agency_referral"),
    police_notification_rate: boolRate("police_notified"),
    specialist_rate: boolRate("specialist_service_involved"),
    cultural_sensitivity_rate: boolRate("cultural_sensitivity_considered"),
    review_scheduled_rate: reviewScheduledRate,
    unique_children: uniqueChildren,
    unique_assessors: uniqueAssessors,
  };
}

export function computeFgmRiskAlerts(
  rows: ChildFgmRiskAssessmentRow[],
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

  // Critical: Immediate risk without mandatory report (legal duty under FGM Act 2003)
  for (const r of rows) {
    if (r.risk_level === "Immediate" && !r.mandatory_report_made) {
      alerts.push({
        type: "immediate_risk_no_mandatory_report",
        severity: "critical",
        message: `${r.child_name} has Immediate FGM risk without mandatory report — this is a legal duty under the FGM Act 2003, report immediately`,
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
        message: `${r.child_name} has High FGM risk with no safety plan in place — implement safety plan immediately`,
        record_id: r.id,
      });
    }
  }

  // High: Any risk (not "No Identified Risk") without multi-agency referral
  for (const r of rows) {
    if (r.risk_level !== "No Identified Risk" && !r.multi_agency_referral) {
      alerts.push({
        type: "risk_no_multi_agency_referral",
        severity: "high",
        message: `Multi-agency referral not made for ${r.child_name} with ${r.risk_level} FGM risk — consider multi-agency strategy meeting`,
        record_id: r.id,
      });
    }
  }

  // Medium: Cultural sensitivity not considered
  for (const r of rows) {
    if (!r.cultural_sensitivity_considered) {
      alerts.push({
        type: "cultural_sensitivity_not_considered",
        severity: "medium",
        message: `Cultural sensitivity not considered for ${r.child_name} — ensure culturally sensitive approach in FGM risk assessment`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateFgmRiskCaraInsights(
  rows: ChildFgmRiskAssessmentRow[],
): string[] {
  const metrics = computeFgmRiskMetrics(rows);
  const alerts = computeFgmRiskAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary counts
  insights.push(
    `[red] ${metrics.total_assessments} FGM risk assessments recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.high_risk_count} at High or Immediate risk level. ` +
      `${metrics.mandatory_report_count} mandatory ${metrics.mandatory_report_count === 1 ? "report" : "reports"} made. ` +
      `${metrics.fgm_protection_order_count} FGM Protection ${metrics.fgm_protection_order_count === 1 ? "Order" : "Orders"} in place.`,
  );

  // Insight 2: Priority findings
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
        `Multi-agency rate: ${metrics.multi_agency_rate}%. ` +
        `Cultural sensitivity rate: ${metrics.cultural_sensitivity_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns identified. ` +
        `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
        `Multi-agency rate: ${metrics.multi_agency_rate}%. ` +
        `Cultural sensitivity rate: ${metrics.cultural_sensitivity_rate}%.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  insights.push(
    `[reflect] Are FGM risk assessments being conducted with appropriate cultural sensitivity, and is each child's safety plan ` +
      `informed by specialist services, multi-agency intelligence, and mandatory reporting compliance?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildFgmRiskAssessments(
  homeId: string,
): Promise<ServiceResult<ChildFgmRiskAssessmentRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_fgm_risk_assessments") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("assessment_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildFgmRiskAssessment(input: {
  homeId: string;
  childName: string;
  assessmentDate: string;
  riskLevel: FgmRiskLevel;
  riskIndicatorsCount?: number;
  mandatoryReportMade?: boolean;
  policeNotified?: boolean;
  socialWorkerNotified?: boolean;
  fgmProtectionOrder?: boolean;
  multiAgencyReferral?: boolean;
  safetyPlanInPlace?: boolean;
  culturalSensitivityConsidered?: boolean;
  specialistServiceInvolved?: boolean;
  specialistServiceName?: string | null;
  reviewDate?: string | null;
  assessorName: string;
  notes?: string | null;
}): Promise<ServiceResult<ChildFgmRiskAssessmentRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_fgm_risk_assessments") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      assessment_date: input.assessmentDate,
      risk_level: input.riskLevel,
      risk_indicators_count: input.riskIndicatorsCount ?? 0,
      mandatory_report_made: input.mandatoryReportMade ?? false,
      police_notified: input.policeNotified ?? false,
      social_worker_notified: input.socialWorkerNotified ?? true,
      fgm_protection_order: input.fgmProtectionOrder ?? false,
      multi_agency_referral: input.multiAgencyReferral ?? false,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      cultural_sensitivity_considered: input.culturalSensitivityConsidered ?? true,
      specialist_service_involved: input.specialistServiceInvolved ?? false,
      specialist_service_name: input.specialistServiceName ?? null,
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
  computeFgmRiskMetrics,
  computeFgmRiskAlerts,
  generateFgmRiskCaraInsights,
};
