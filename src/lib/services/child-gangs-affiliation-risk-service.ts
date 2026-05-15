// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD GANGS AFFILIATION RISK SERVICE
// Tracks gang affiliation risk indicators, disruption strategies, and
// multi-agency working for children in residential care.
// CHR 2015 Reg 12 (protection of children — safeguarding from exploitation),
// Reg 34 (fitness of workers — recognising exploitation indicators).
// Working Together to Safeguard Children 2023, Serious Violence Strategy.
// National Referral Mechanism (NRM) for trafficking/modern slavery.
//
// SCCIF: Safety — "Children are protected from gang exploitation and
// criminal affiliation." Ofsted expects proactive gang risk screening,
// disruption strategies, and multi-agency safety planning.
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
  "Significant",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const DISRUPTION_STRATEGIES = [
  "Placement Move",
  "Education Change",
  "Restricted Contact",
  "Multi-Agency Plan",
  "Safety Plan",
  "None Required",
] as const;
export type DisruptionStrategy = (typeof DISRUPTION_STRATEGIES)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ChildGangsAffiliationRiskRow {
  id: string;
  home_id: string;
  child_name: string;
  assessment_date: string;
  risk_level: RiskLevel;
  gang_involvement_indicators: number;
  county_lines_risk: boolean;
  nrm_referral_made: boolean;
  police_notified: boolean;
  social_worker_notified: boolean;
  disruption_strategy: DisruptionStrategy | null;
  multi_agency_meeting_held: boolean;
  safety_plan_in_place: boolean;
  exploitation_screening_completed: boolean;
  missing_episodes_linked: number;
  review_date: string | null;
  assessor_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMetrics(
  rows: ChildGangsAffiliationRiskRow[],
): {
  total_assessments: number;
  high_risk_count: number;
  county_lines_count: number;
  nrm_referral_count: number;
  safety_plan_rate: number;
  exploitation_screening_rate: number;
  multi_agency_rate: number;
  police_notification_rate: number;
  avg_indicators: number;
  avg_missing_episodes: number;
  unique_children: number;
  unique_assessors: number;
} {
  const highRisk = rows.filter(
    (r) => r.risk_level === "High" || r.risk_level === "Significant",
  ).length;

  const countyLines = rows.filter((r) => r.county_lines_risk).length;
  const nrmReferrals = rows.filter((r) => r.nrm_referral_made).length;

  const boolRate = (field: keyof ChildGangsAffiliationRiskRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const avgIndicators =
    rows.length > 0
      ? Math.round(
          (rows.reduce((sum, r) => sum + r.gang_involvement_indicators, 0) /
            rows.length) *
            10,
        ) / 10
      : 0;

  const avgMissing =
    rows.length > 0
      ? Math.round(
          (rows.reduce((sum, r) => sum + r.missing_episodes_linked, 0) /
            rows.length) *
            10,
        ) / 10
      : 0;

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  return {
    total_assessments: rows.length,
    high_risk_count: highRisk,
    county_lines_count: countyLines,
    nrm_referral_count: nrmReferrals,
    safety_plan_rate: boolRate("safety_plan_in_place"),
    exploitation_screening_rate: boolRate("exploitation_screening_completed"),
    multi_agency_rate: boolRate("multi_agency_meeting_held"),
    police_notification_rate: boolRate("police_notified"),
    avg_indicators: avgIndicators,
    avg_missing_episodes: avgMissing,
    unique_children: uniqueChildren,
    unique_assessors: uniqueAssessors,
  };
}

export function computeAlerts(
  rows: ChildGangsAffiliationRiskRow[],
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

  // Critical: Significant risk without safety plan
  for (const r of rows) {
    if (r.risk_level === "Significant" && !r.safety_plan_in_place) {
      alerts.push({
        type: "significant_risk_no_safety_plan",
        severity: "critical",
        message: `${r.child_name} has Significant gang affiliation risk with no safety plan in place — implement safety plan immediately`,
        record_id: r.id,
      });
    }
  }

  // Critical: County lines risk without NRM referral
  for (const r of rows) {
    if (r.county_lines_risk && !r.nrm_referral_made) {
      alerts.push({
        type: "county_lines_no_nrm",
        severity: "critical",
        message: `${r.child_name} has county lines risk but no NRM referral made — submit NRM referral urgently`,
        record_id: r.id,
      });
    }
  }

  // High: High risk without multi-agency meeting
  for (const r of rows) {
    if (r.risk_level === "High" && !r.multi_agency_meeting_held) {
      alerts.push({
        type: "high_risk_no_multi_agency",
        severity: "high",
        message: `${r.child_name} has High gang affiliation risk without multi-agency meeting — convene multi-agency meeting promptly`,
        record_id: r.id,
      });
    }
  }

  // Medium: No exploitation screening when risk != "No Identified Risk"
  for (const r of rows) {
    if (
      r.risk_level !== "No Identified Risk" &&
      !r.exploitation_screening_completed
    ) {
      alerts.push({
        type: "no_exploitation_screening",
        severity: "medium",
        message: `${r.child_name} with ${r.risk_level} risk has not had exploitation screening completed — complete screening promptly`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function computeAriaInsights(
  metrics: ReturnType<typeof computeMetrics>,
  alerts?: ReturnType<typeof computeAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[red] ${metrics.total_assessments} gang affiliation risk ${metrics.total_assessments === 1 ? "assessment" : "assessments"} across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.high_risk_count} at High or Significant risk level. ` +
      `${metrics.county_lines_count} county lines ${metrics.county_lines_count === 1 ? "case" : "cases"}. ` +
      `NRM referral count: ${metrics.nrm_referral_count}.`,
  );

  // Insight 2: Priority findings
  const alertList = alerts ?? [];
  const criticalAlerts = alertList.filter((a) => a.severity === "critical");
  const highAlerts = alertList.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
        `Multi-agency rate: ${metrics.multi_agency_rate}%. ` +
        `Police notification rate: ${metrics.police_notification_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns identified. ` +
        `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
        `Multi-agency rate: ${metrics.multi_agency_rate}%. ` +
        `Police notification rate: ${metrics.police_notification_rate}%.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  insights.push(
    `[reflect] Are gang affiliation risk assessments being informed by contextual safeguarding, peer mapping, and the child's own voice, ` +
      `and is every disruption strategy regularly reviewed with multi-agency partners to ensure it remains proportionate and effective?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
): Promise<ServiceResult<ChildGangsAffiliationRiskRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_gangs_affiliation_risks") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("assessment_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  assessmentDate: string;
  riskLevel: RiskLevel;
  gangInvolvementIndicators?: number;
  countyLinesRisk?: boolean;
  nrmReferralMade?: boolean;
  policeNotified?: boolean;
  socialWorkerNotified?: boolean;
  disruptionStrategy?: DisruptionStrategy | null;
  multiAgencyMeetingHeld?: boolean;
  safetyPlanInPlace?: boolean;
  exploitationScreeningCompleted?: boolean;
  missingEpisodesLinked?: number;
  reviewDate?: string | null;
  assessorName: string;
  notes?: string | null;
}): Promise<ServiceResult<ChildGangsAffiliationRiskRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_gangs_affiliation_risks") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      assessment_date: input.assessmentDate,
      risk_level: input.riskLevel,
      gang_involvement_indicators: input.gangInvolvementIndicators ?? 0,
      county_lines_risk: input.countyLinesRisk ?? false,
      nrm_referral_made: input.nrmReferralMade ?? false,
      police_notified: input.policeNotified ?? false,
      social_worker_notified: input.socialWorkerNotified ?? true,
      disruption_strategy: input.disruptionStrategy ?? null,
      multi_agency_meeting_held: input.multiAgencyMeetingHeld ?? false,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      exploitation_screening_completed: input.exploitationScreeningCompleted ?? false,
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

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ChildGangsAffiliationRiskRow>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_gangs_affiliation_risks") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMetrics,
  computeAlerts,
  computeAriaInsights,
};
