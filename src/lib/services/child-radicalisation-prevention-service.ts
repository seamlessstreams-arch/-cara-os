// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD RADICALISATION PREVENTION (PREVENT DUTY) SERVICE
// Prevent duty compliance, Channel referrals, vulnerability indicators,
// online radicalisation screening, ideology concerns.
// Counter-Terrorism and Security Act 2015 (Prevent Duty).
// CHR 2015 Reg 12 (protection of children).
// Working Together to Safeguard Children 2023.
// Channel programme referrals.
//
// SCCIF: Safety — "Children are protected from radicalisation."
// Ofsted expects proactive identification of vulnerability to radicalisation,
// appropriate Channel referrals, and evidence of Prevent training for staff.
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

export const VULNERABILITY_LEVELS = [
  "no_identified_risk",
  "low",
  "medium",
  "significant",
  "high",
] as const;
export type VulnerabilityLevel = (typeof VULNERABILITY_LEVELS)[number];

export const REFERRAL_OUTCOMES = [
  "no_referral_needed",
  "channel_referral",
  "police_referral",
  "social_care_referral",
  "monitoring_continued",
  "closed_no_concerns",
] as const;
export type ReferralOutcome = (typeof REFERRAL_OUTCOMES)[number];

export const ASSESSMENT_STATUSES = [
  "initial_screening",
  "assessment_ongoing",
  "channel_active",
  "monitoring",
  "closed",
] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const CONCERN_TYPES = [
  "far_right",
  "islamist",
  "incel",
  "eco_extremism",
  "single_issue",
  "online_radicalisation",
  "peer_influence",
  "mixed_ideology",
] as const;
export type ConcernType = (typeof CONCERN_TYPES)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ChildRadicalisationPreventionRow {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  assessment_date: string;
  vulnerability_level: VulnerabilityLevel;
  referral_outcome: ReferralOutcome;
  assessment_status: AssessmentStatus;
  concern_type: ConcernType;
  prevent_training_completed: boolean;
  online_activity_monitored: boolean;
  channel_referral_made: boolean;
  multi_agency_involved: boolean;
  child_views_obtained: boolean;
  family_engaged: boolean;
  safety_plan_in_place: boolean;
  ideology_challenged: boolean;
  assessor_name: string | null;
  vulnerability_indicators: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeRadicalisationMetrics(
  rows: ChildRadicalisationPreventionRow[],
): {
  total_assessments: number;
  high_risk_count: number;
  significant_risk_count: number;
  channel_active_count: number;
  monitoring_count: number;
  prevent_training_rate: number;
  online_monitoring_rate: number;
  channel_referral_rate: number;
  multi_agency_rate: number;
  child_views_rate: number;
  family_engaged_rate: number;
  safety_plan_rate: number;
  ideology_challenged_rate: number;
  concern_type_breakdown: Record<string, number>;
  vulnerability_breakdown: Record<string, number>;
  unique_children: number;
} {
  const highRisk = rows.filter((r) => r.vulnerability_level === "high").length;
  const significantRisk = rows.filter((r) => r.vulnerability_level === "significant").length;
  const channelActive = rows.filter((r) => r.assessment_status === "channel_active").length;
  const monitoring = rows.filter((r) => r.assessment_status === "monitoring").length;

  const boolRate = (field: keyof ChildRadicalisationPreventionRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  const concernTypeBreakdown: Record<string, number> = {};
  for (const r of rows) concernTypeBreakdown[r.concern_type] = (concernTypeBreakdown[r.concern_type] ?? 0) + 1;

  const vulnerabilityBreakdown: Record<string, number> = {};
  for (const r of rows) vulnerabilityBreakdown[r.vulnerability_level] = (vulnerabilityBreakdown[r.vulnerability_level] ?? 0) + 1;

  return {
    total_assessments: rows.length,
    high_risk_count: highRisk,
    significant_risk_count: significantRisk,
    channel_active_count: channelActive,
    monitoring_count: monitoring,
    prevent_training_rate: boolRate("prevent_training_completed"),
    online_monitoring_rate: boolRate("online_activity_monitored"),
    channel_referral_rate: boolRate("channel_referral_made"),
    multi_agency_rate: boolRate("multi_agency_involved"),
    child_views_rate: boolRate("child_views_obtained"),
    family_engaged_rate: boolRate("family_engaged"),
    safety_plan_rate: boolRate("safety_plan_in_place"),
    ideology_challenged_rate: boolRate("ideology_challenged"),
    concern_type_breakdown: concernTypeBreakdown,
    vulnerability_breakdown: vulnerabilityBreakdown,
    unique_children: uniqueChildren,
  };
}

export function computeRadicalisationAlerts(
  rows: ChildRadicalisationPreventionRow[],
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

  // Critical: high vulnerability without safety plan
  for (const r of rows) {
    if (r.vulnerability_level === "high" && !r.safety_plan_in_place) {
      alerts.push({
        type: "high_vulnerability_no_safety_plan",
        severity: "critical",
        message: `${r.child_name} has high vulnerability level with no safety plan in place — implement safety plan immediately`,
        record_id: r.id,
      });
    }
  }

  // Critical: high vulnerability without channel referral
  for (const r of rows) {
    if (r.vulnerability_level === "high" && !r.channel_referral_made) {
      alerts.push({
        type: "high_vulnerability_no_channel_referral",
        severity: "critical",
        message: `${r.child_name} has high vulnerability level without Channel referral — refer to Channel programme urgently`,
        record_id: r.id,
      });
    }
  }

  // High: significant vulnerability without multi-agency involvement
  for (const r of rows) {
    if (r.vulnerability_level === "significant" && !r.multi_agency_involved) {
      alerts.push({
        type: "significant_no_multi_agency",
        severity: "high",
        message: `${r.child_name} has significant vulnerability without multi-agency involvement — consider multi-agency strategy meeting`,
        record_id: r.id,
      });
    }
  }

  // High: online_radicalisation concern without online monitoring
  for (const r of rows) {
    if (r.concern_type === "online_radicalisation" && !r.online_activity_monitored) {
      alerts.push({
        type: "online_concern_no_monitoring",
        severity: "high",
        message: `${r.child_name} has online radicalisation concern without online activity monitoring — implement online monitoring immediately`,
        record_id: r.id,
      });
    }
  }

  // Medium: child views not obtained
  for (const r of rows) {
    if (!r.child_views_obtained) {
      alerts.push({
        type: "child_views_not_obtained",
        severity: "medium",
        message: `Child views not obtained for ${r.child_name} — ensure the child's voice is heard in the assessment`,
        record_id: r.id,
      });
    }
  }

  // Medium: prevent training not completed
  for (const r of rows) {
    if (!r.prevent_training_completed) {
      alerts.push({
        type: "prevent_training_not_completed",
        severity: "medium",
        message: `Prevent training not completed for assessment of ${r.child_name} — ensure assessor has completed Prevent awareness training`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateRadicalisationCaraInsights(
  rows: ChildRadicalisationPreventionRow[],
): string[] {
  const metrics = computeRadicalisationMetrics(rows);
  const alerts = computeRadicalisationAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary counts
  const highPlusCount = metrics.high_risk_count + metrics.significant_risk_count;
  insights.push(
    `[red] ${metrics.total_assessments} radicalisation prevention assessments recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${highPlusCount} at significant or above vulnerability level (${metrics.significant_risk_count} significant, ${metrics.high_risk_count} high). ` +
      `${metrics.channel_active_count} Channel ${metrics.channel_active_count === 1 ? "case" : "cases"} active, ${metrics.monitoring_count} in monitoring. ` +
      `Prevent training completion rate: ${metrics.prevent_training_rate}%.`,
  );

  // Insight 2: Priority findings
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
        `Channel referral rate: ${metrics.channel_referral_rate}%. ` +
        `Child views rate: ${metrics.child_views_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns identified. ` +
        `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
        `Channel referral rate: ${metrics.channel_referral_rate}%. ` +
        `Child views rate: ${metrics.child_views_rate}%.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  insights.push(
    `[reflect] Are vulnerability assessments being reviewed regularly, and is each child's safety plan ` +
      `informed by their own voice, family engagement, and up-to-date intelligence from multi-agency partners?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildRadicalisationPrevention(
  homeId: string,
): Promise<ServiceResult<ChildRadicalisationPreventionRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_radicalisation_prevention") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("assessment_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildRadicalisationPrevention(input: {
  homeId: string;
  childName: string;
  childId?: string | null;
  assessmentDate: string;
  vulnerabilityLevel: VulnerabilityLevel;
  referralOutcome: ReferralOutcome;
  assessmentStatus: AssessmentStatus;
  concernType: ConcernType;
  preventTrainingCompleted?: boolean;
  onlineActivityMonitored?: boolean;
  channelReferralMade?: boolean;
  multiAgencyInvolved?: boolean;
  childViewsObtained?: boolean;
  familyEngaged?: boolean;
  safetyPlanInPlace?: boolean;
  ideologyChallenged?: boolean;
  assessorName?: string | null;
  vulnerabilityIndicators?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<ChildRadicalisationPreventionRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_radicalisation_prevention") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      assessment_date: input.assessmentDate,
      vulnerability_level: input.vulnerabilityLevel,
      referral_outcome: input.referralOutcome,
      assessment_status: input.assessmentStatus,
      concern_type: input.concernType,
      prevent_training_completed: input.preventTrainingCompleted ?? false,
      online_activity_monitored: input.onlineActivityMonitored ?? false,
      channel_referral_made: input.channelReferralMade ?? false,
      multi_agency_involved: input.multiAgencyInvolved ?? false,
      child_views_obtained: input.childViewsObtained ?? true,
      family_engaged: input.familyEngaged ?? false,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      ideology_challenged: input.ideologyChallenged ?? false,
      assessor_name: input.assessorName ?? null,
      vulnerability_indicators: input.vulnerabilityIndicators ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeRadicalisationMetrics,
  computeRadicalisationAlerts,
  generateRadicalisationCaraInsights,
};
