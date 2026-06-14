// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF RETENTION & EXIT ANALYSIS SERVICE
// Tracks staff turnover patterns, exit reasons, retention strategies,
// length of service analysis. Helps managers understand why staff leave
// and plan retention.
// CHR 2015 Reg 33 (employment, training, supervision — maintaining
// stable workforce), Reg 32 (fitness of premises — linked to staffing
// stability).
//
// Covers: exit reasons, retention risk levels, analysis statuses,
// length of service bands, exit/stay interview tracking, counter offers,
// knowledge transfer, replacement recruitment, and team impact.
//
// SCCIF: Leadership & Management — "The home has a stable and consistent
// staff team." Ofsted expects evidence of workforce stability and planned
// retention strategies.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const EXIT_REASONS = [
  "career_progression",
  "relocation",
  "retirement",
  "work_life_balance",
  "pay_dissatisfaction",
  "management_issues",
  "burnout",
  "personal_reasons",
  "health",
  "end_of_contract",
  "performance_managed",
  "other",
] as const;
export type ExitReason = (typeof EXIT_REASONS)[number];

export const RETENTION_RISK_LEVELS = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type RetentionRiskLevel = (typeof RETENTION_RISK_LEVELS)[number];

export const ANALYSIS_STATUSES = [
  "exit_interview_scheduled",
  "exit_interview_completed",
  "analysed",
  "retention_action_planned",
  "closed",
] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

export const LENGTH_OF_SERVICE_BANDS = [
  "under_6_months",
  "6_to_12_months",
  "1_to_2_years",
  "2_to_5_years",
  "over_5_years",
] as const;
export type LengthOfServiceBand = (typeof LENGTH_OF_SERVICE_BANDS)[number];

// ── Row interface ────────────────────────────────────────────────────────

export interface StaffRetentionExitAnalysisRow {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  exit_date: string;
  exit_reason: ExitReason;
  retention_risk_level: RetentionRiskLevel;
  analysis_status: AnalysisStatus;
  length_of_service_band: LengthOfServiceBand;
  exit_interview_completed: boolean;
  stay_interview_completed: boolean;
  counter_offer_made: boolean;
  counter_offer_accepted: boolean;
  notice_period_served: boolean;
  knowledge_transfer_completed: boolean;
  replacement_recruited: boolean;
  team_impact_assessed: boolean;
  exit_interview_findings: string | null;
  retention_strategy_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffRetentionMetrics(
  rows: StaffRetentionExitAnalysisRow[],
): {
  total_exits: number;
  career_progression_count: number;
  burnout_count: number;
  pay_dissatisfaction_count: number;
  critical_risk_count: number;
  exit_interview_rate: number;
  notice_served_rate: number;
  knowledge_transfer_rate: number;
  counter_offer_rate: number;
  replacement_rate: number;
  stay_interview_rate: number;
  exit_reason_breakdown: Record<string, number>;
  service_band_breakdown: Record<string, number>;
  unique_staff: number;
} {
  const careerProgressionCount = rows.filter((r) => r.exit_reason === "career_progression").length;
  const burnoutCount = rows.filter((r) => r.exit_reason === "burnout").length;
  const payDissatisfactionCount = rows.filter((r) => r.exit_reason === "pay_dissatisfaction").length;
  const criticalRiskCount = rows.filter((r) => r.retention_risk_level === "critical").length;

  const boolRate = (field: keyof StaffRetentionExitAnalysisRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const uniqueStaff = new Set(rows.map((r) => r.staff_name)).size;

  const exitReasonBreakdown: Record<string, number> = {};
  for (const r of rows) exitReasonBreakdown[r.exit_reason] = (exitReasonBreakdown[r.exit_reason] ?? 0) + 1;

  const serviceBandBreakdown: Record<string, number> = {};
  for (const r of rows) serviceBandBreakdown[r.length_of_service_band] = (serviceBandBreakdown[r.length_of_service_band] ?? 0) + 1;

  return {
    total_exits: rows.length,
    career_progression_count: careerProgressionCount,
    burnout_count: burnoutCount,
    pay_dissatisfaction_count: payDissatisfactionCount,
    critical_risk_count: criticalRiskCount,
    exit_interview_rate: boolRate("exit_interview_completed"),
    notice_served_rate: boolRate("notice_period_served"),
    knowledge_transfer_rate: boolRate("knowledge_transfer_completed"),
    counter_offer_rate: boolRate("counter_offer_made"),
    replacement_rate: boolRate("replacement_recruited"),
    stay_interview_rate: boolRate("stay_interview_completed"),
    exit_reason_breakdown: exitReasonBreakdown,
    service_band_breakdown: serviceBandBreakdown,
    unique_staff: uniqueStaff,
  };
}

export function computeStaffRetentionAlerts(
  rows: StaffRetentionExitAnalysisRow[],
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

  // Critical: critical risk level staff exiting without retention action planned
  for (const r of rows) {
    if (r.retention_risk_level === "critical" && r.analysis_status !== "retention_action_planned") {
      alerts.push({
        type: "critical_risk_no_retention_action",
        severity: "critical",
        message: `${r.staff_name} is a critical retention risk exiting without a retention action plan — immediate intervention needed.`,
        record_id: r.id,
      });
    }
  }

  // High: burnout as exit reason + no stay interview completed
  for (const r of rows) {
    if (r.exit_reason === "burnout" && !r.stay_interview_completed) {
      alerts.push({
        type: "burnout_no_stay_interview",
        severity: "high",
        message: `${r.staff_name} is leaving due to burnout without a stay interview being completed — early intervention may have helped.`,
        record_id: r.id,
      });
    }
  }

  // High: no exit interview completed for leavers
  for (const r of rows) {
    if (!r.exit_interview_completed) {
      alerts.push({
        type: "no_exit_interview",
        severity: "high",
        message: `${r.staff_name} has no exit interview completed — valuable feedback may be lost.`,
        record_id: r.id,
      });
    }
  }

  // Medium: knowledge transfer not completed for exiting staff under 6 months service
  for (const r of rows) {
    if (r.length_of_service_band === "under_6_months" && !r.knowledge_transfer_completed) {
      alerts.push({
        type: "short_service_no_knowledge_transfer",
        severity: "medium",
        message: `${r.staff_name} (under 6 months service) has not completed knowledge transfer — review onboarding and handover processes.`,
        record_id: r.id,
      });
    }
  }

  // Medium: multiple exits in same reason category (3+)
  const reasonCounts: Record<string, number> = {};
  for (const r of rows) reasonCounts[r.exit_reason] = (reasonCounts[r.exit_reason] ?? 0) + 1;
  for (const [reason, count] of Object.entries(reasonCounts)) {
    if (count >= 3) {
      alerts.push({
        type: "repeated_exit_reason",
        severity: "medium",
        message: `${count} staff have left citing ${reason.replace(/_/g, " ")} — this pattern warrants investigation and targeted retention strategies.`,
      });
    }
  }

  return alerts;
}

export function generateStaffRetentionCaraInsights(
  rows: StaffRetentionExitAnalysisRow[],
): string[] {
  const metrics = computeStaffRetentionMetrics(rows);
  const alerts = computeStaffRetentionAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary line with counts (amber-themed)
  insights.push(
    `[amber] ${metrics.total_exits} staff ${metrics.total_exits === 1 ? "exit" : "exits"} recorded across ${metrics.unique_staff} unique ${metrics.unique_staff === 1 ? "staff member" : "staff members"}. ` +
      `${metrics.exit_interview_rate}% had exit interviews, ${metrics.notice_served_rate}% served notice, ` +
      `and ${metrics.knowledge_transfer_rate}% completed knowledge transfer.`,
  );

  // Insight 2: Priority line with critical findings
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority ${highAlerts.length === 1 ? "alert" : "alerts"} identified. ` +
        `${metrics.critical_risk_count} critical-risk leavers, ${metrics.burnout_count} burnout-related exits, ` +
        `and ${metrics.pay_dissatisfaction_count} due to pay dissatisfaction.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.career_progression_count} left for career progression, ` +
        `${metrics.burnout_count} due to burnout. Continue monitoring exit patterns to maintain workforce stability.`,
    );
  }

  // Insight 3: Reflective question about workforce stability
  if (metrics.burnout_count > 0) {
    insights.push(
      `[reflect] ${metrics.burnout_count} staff ${metrics.burnout_count === 1 ? "member has" : "members have"} left due to burnout. ` +
        `What systemic factors might be contributing to staff exhaustion, and are current wellbeing ` +
        `and supervision arrangements sufficient to maintain a stable, consistent team for children?`,
    );
  } else if (metrics.critical_risk_count > 0) {
    insights.push(
      `[reflect] ${metrics.critical_risk_count} critical-risk ${metrics.critical_risk_count === 1 ? "departure was" : "departures were"} recorded. ` +
        `Are proactive retention strategies being embedded early enough to prevent the loss of ` +
        `experienced staff, and how does turnover affect placement stability for children?`,
    );
  } else {
    insights.push(
      `[reflect] No burnout or critical-risk departures were recorded in this period. ` +
        `How can the home build on its current workforce stability to further strengthen ` +
        `continuity of care and the lived experience of children?`,
    );
  }

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listStaffRetentionExitAnalysis(
  homeId: string,
): Promise<ServiceResult<StaffRetentionExitAnalysisRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_staff_retention_exit_analysis") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("exit_date", { ascending: false })
    .limit(200);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createStaffRetentionExitAnalysis(
  input: {
    homeId: string;
    staffName: string;
    staffId?: string | null;
    exitDate: string;
    exitReason: ExitReason;
    retentionRiskLevel: RetentionRiskLevel;
    analysisStatus: AnalysisStatus;
    lengthOfServiceBand: LengthOfServiceBand;
    exitInterviewCompleted?: boolean;
    stayInterviewCompleted?: boolean;
    counterOfferMade?: boolean;
    counterOfferAccepted?: boolean;
    noticePeriodServed?: boolean;
    knowledgeTransferCompleted?: boolean;
    replacementRecruited?: boolean;
    teamImpactAssessed?: boolean;
    exitInterviewFindings?: string | null;
    retentionStrategyNotes?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffRetentionExitAnalysisRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_staff_retention_exit_analysis") as any)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      exit_date: input.exitDate,
      exit_reason: input.exitReason,
      retention_risk_level: input.retentionRiskLevel,
      analysis_status: input.analysisStatus,
      length_of_service_band: input.lengthOfServiceBand,
      exit_interview_completed: input.exitInterviewCompleted ?? false,
      stay_interview_completed: input.stayInterviewCompleted ?? false,
      counter_offer_made: input.counterOfferMade ?? false,
      counter_offer_accepted: input.counterOfferAccepted ?? false,
      notice_period_served: input.noticePeriodServed ?? false,
      knowledge_transfer_completed: input.knowledgeTransferCompleted ?? false,
      replacement_recruited: input.replacementRecruited ?? false,
      team_impact_assessed: input.teamImpactAssessed ?? false,
      exit_interview_findings: input.exitInterviewFindings ?? null,
      retention_strategy_notes: input.retentionStrategyNotes ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffRetentionMetrics,
  computeStaffRetentionAlerts,
  generateStaffRetentionCaraInsights,
};
