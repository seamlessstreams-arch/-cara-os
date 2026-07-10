// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD MODERN SLAVERY RISK SERVICE
// Modern slavery risk assessments, NRM referrals, exploitation type tracking,
// multi-agency safeguarding under the Modern Slavery Act 2015.
// CHR 2015 Reg 12 (protection of children — safeguarding from exploitation),
// Reg 34 (fitness of workers — recognising modern slavery indicators).
// Working Together to Safeguard Children 2023, Modern Slavery Act 2015.
// National Referral Mechanism (NRM) for trafficking/modern slavery.
//
// SCCIF: Safety — "Children are protected from modern slavery and trafficking."
// Ofsted expects proactive modern slavery screening, NRM referrals, and safety planning.
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

export const EXPLOITATION_TYPES = [
  "Labour",
  "Sexual",
  "Criminal",
  "Domestic Servitude",
  "Organ Harvesting",
  "Multiple",
  "Not Determined",
] as const;
export type ExploitationType = (typeof EXPLOITATION_TYPES)[number];

export const NRM_DECISIONS = [
  "Reasonable Grounds",
  "Conclusive Grounds",
  "Negative",
  "Pending",
] as const;
export type NrmDecision = (typeof NRM_DECISIONS)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ChildModernSlaveryRiskRow {
  id: string;
  home_id: string;
  child_name: string;
  assessment_date: string;
  risk_level: RiskLevel;
  exploitation_type: ExploitationType;
  nrm_referral_made: boolean;
  nrm_decision: NrmDecision | null;
  police_notified: boolean;
  social_worker_notified: boolean;
  multi_agency_referral: boolean;
  safety_plan_in_place: boolean;
  specialist_service_involved: boolean;
  independent_advocate_appointed: boolean;
  missing_episodes_linked: number;
  review_date: string | null;
  assessor_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeModernSlaveryRiskMetrics(
  rows: ChildModernSlaveryRiskRow[],
): {
  total_assessments: number;
  high_risk_count: number;
  nrm_referral_count: number;
  safety_plan_rate: number;
  multi_agency_rate: number;
  police_notification_rate: number;
  specialist_rate: number;
  advocate_rate: number;
  avg_missing_episodes: number;
  unique_children: number;
  unique_assessors: number;
} {
  const highRisk = rows.filter(
    (r) => r.risk_level === "High" || r.risk_level === "Immediate",
  ).length;
  const nrmReferrals = rows.filter((r) => r.nrm_referral_made).length;

  const boolRate = (field: keyof ChildModernSlaveryRiskRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const avgMissing =
    rows.length > 0
      ? Math.round(
          (rows.reduce((sum, r) => sum + r.missing_episodes_linked, 0) /
            rows.length) *
            1000,
        ) / 1000
      : 0;

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  return {
    total_assessments: rows.length,
    high_risk_count: highRisk,
    nrm_referral_count: nrmReferrals,
    safety_plan_rate: boolRate("safety_plan_in_place"),
    multi_agency_rate: boolRate("multi_agency_referral"),
    police_notification_rate: boolRate("police_notified"),
    specialist_rate: boolRate("specialist_service_involved"),
    advocate_rate: boolRate("independent_advocate_appointed"),
    avg_missing_episodes: avgMissing,
    unique_children: uniqueChildren,
    unique_assessors: uniqueAssessors,
  };
}

export function computeModernSlaveryRiskAlerts(
  rows: ChildModernSlaveryRiskRow[],
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

  // Critical: Immediate risk without NRM referral
  for (const r of rows) {
    if (r.risk_level === "Immediate" && !r.nrm_referral_made) {
      alerts.push({
        type: "immediate_no_nrm",
        severity: "critical",
        message: `${r.child_name} has Immediate modern slavery risk with no NRM referral made — submit NRM referral urgently`,
        record_id: r.id,
      });
    }
  }

  // Critical: High risk without safety plan
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Immediate") &&
      !r.safety_plan_in_place
    ) {
      alerts.push({
        type: "high_risk_no_safety_plan",
        severity: "critical",
        message: `${r.child_name} has ${r.risk_level} modern slavery risk with no safety plan in place — implement safety plan immediately`,
        record_id: r.id,
      });
    }
  }

  // High: No multi-agency referral when risk is not "No Identified Risk"
  for (const r of rows) {
    if (r.risk_level !== "No Identified Risk" && !r.multi_agency_referral) {
      alerts.push({
        type: "no_multi_agency_referral",
        severity: "high",
        message: `Multi-agency referral not made for ${r.child_name} with ${r.risk_level} modern slavery risk — consider strategy meeting`,
        record_id: r.id,
      });
    }
  }

  // Medium: No independent advocate for High/Immediate risk
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Immediate") &&
      !r.independent_advocate_appointed
    ) {
      alerts.push({
        type: "no_advocate_high_risk",
        severity: "medium",
        message: `Independent advocate not appointed for ${r.child_name} with ${r.risk_level} modern slavery risk — appoint advocate to support the child`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateModernSlaveryRiskCaraInsights(
  rows: ChildModernSlaveryRiskRow[],
): string[] {
  const metrics = computeModernSlaveryRiskMetrics(rows);
  const alerts = computeModernSlaveryRiskAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary counts
  insights.push(
    `[red] ${metrics.total_assessments} modern slavery risk assessments recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.high_risk_count} at High or Immediate risk level. ` +
      `${metrics.nrm_referral_count} NRM ${metrics.nrm_referral_count === 1 ? "referral" : "referrals"} made. ` +
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
    `[reflect] Are NRM referral pathways being followed consistently for all children at risk of modern slavery, ` +
      `and is each child's safety plan informed by specialist services, independent advocacy, and multi-agency intelligence?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildModernSlaveryRisks(
  homeId: string,
): Promise<ServiceResult<ChildModernSlaveryRiskRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_modern_slavery_risks") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("assessment_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildModernSlaveryRisk(input: {
  homeId: string;
  childName: string;
  assessmentDate: string;
  riskLevel: RiskLevel;
  exploitationType: ExploitationType;
  nrmReferralMade?: boolean;
  nrmDecision?: NrmDecision | null;
  policeNotified?: boolean;
  socialWorkerNotified?: boolean;
  multiAgencyReferral?: boolean;
  safetyPlanInPlace?: boolean;
  specialistServiceInvolved?: boolean;
  independentAdvocateAppointed?: boolean;
  missingEpisodesLinked?: number;
  reviewDate?: string | null;
  assessorName: string;
  notes?: string | null;
}): Promise<ServiceResult<ChildModernSlaveryRiskRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_modern_slavery_risks") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      assessment_date: input.assessmentDate,
      risk_level: input.riskLevel,
      exploitation_type: input.exploitationType,
      nrm_referral_made: input.nrmReferralMade ?? false,
      nrm_decision: input.nrmDecision ?? null,
      police_notified: input.policeNotified ?? false,
      social_worker_notified: input.socialWorkerNotified ?? true,
      multi_agency_referral: input.multiAgencyReferral ?? false,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      specialist_service_involved: input.specialistServiceInvolved ?? false,
      independent_advocate_appointed: input.independentAdvocateAppointed ?? false,
      missing_episodes_linked: input.missingEpisodesLinked ?? 0,
      review_date: input.reviewDate ?? null,
      assessor_name: input.assessorName,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateChildModernSlaveryRisk(
  id: string,
  updates: Partial<{
    childName: string;
    assessmentDate: string;
    riskLevel: RiskLevel;
    exploitationType: ExploitationType;
    nrmReferralMade: boolean;
    nrmDecision: NrmDecision | null;
    policeNotified: boolean;
    socialWorkerNotified: boolean;
    multiAgencyReferral: boolean;
    safetyPlanInPlace: boolean;
    specialistServiceInvolved: boolean;
    independentAdvocateAppointed: boolean;
    missingEpisodesLinked: number;
    reviewDate: string | null;
    assessorName: string;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildModernSlaveryRiskRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.exploitationType !== undefined) mapped.exploitation_type = updates.exploitationType;
  if (updates.nrmReferralMade !== undefined) mapped.nrm_referral_made = updates.nrmReferralMade;
  if (updates.nrmDecision !== undefined) mapped.nrm_decision = updates.nrmDecision;
  if (updates.policeNotified !== undefined) mapped.police_notified = updates.policeNotified;
  if (updates.socialWorkerNotified !== undefined) mapped.social_worker_notified = updates.socialWorkerNotified;
  if (updates.multiAgencyReferral !== undefined) mapped.multi_agency_referral = updates.multiAgencyReferral;
  if (updates.safetyPlanInPlace !== undefined) mapped.safety_plan_in_place = updates.safetyPlanInPlace;
  if (updates.specialistServiceInvolved !== undefined) mapped.specialist_service_involved = updates.specialistServiceInvolved;
  if (updates.independentAdvocateAppointed !== undefined) mapped.independent_advocate_appointed = updates.independentAdvocateAppointed;
  if (updates.missingEpisodesLinked !== undefined) mapped.missing_episodes_linked = updates.missingEpisodesLinked;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.assessorName !== undefined) mapped.assessor_name = updates.assessorName;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (s.from("cs_child_modern_slavery_risks") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteChildModernSlaveryRisk(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { error } = await (s.from("cs_child_modern_slavery_risks") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeModernSlaveryRiskMetrics,
  computeModernSlaveryRiskAlerts,
  generateModernSlaveryRiskCaraInsights,
};
