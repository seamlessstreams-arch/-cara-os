// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF CONFLICT OF INTEREST SERVICE
// Manages annual declarations, risk assessments, mitigation plans, and
// monitoring of potential conflicts that could compromise care quality.
// CHR 2015 Reg 13 (leadership — governance and transparency),
// Reg 33 (employment of staff — integrity and conduct),
// Reg 34 (fitness of workers — professional standards).
//
// Covers: annual conflict declarations, risk level assessments,
// mitigation planning, manager awareness, documentation,
// impact-on-children confirmation, and organisational learning.
//
// SCCIF: Leadership & Management — "Transparent, ethical governance."
// "Staff conduct is professionally managed and monitored."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const CONFLICT_TYPES = [
  "financial_interest",
  "personal_relationship",
  "secondary_employment",
  "gift_acceptance",
  "family_connection",
  "previous_professional",
  "social_media_contact",
  "religious_cultural",
  "political_affiliation",
  "property_interest",
] as const;
export type ConflictType = (typeof CONFLICT_TYPES)[number];

export const RISK_LEVELS = [
  "none_identified",
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const MITIGATION_STATUSES = [
  "not_required",
  "planned",
  "in_place",
  "under_review",
  "failed",
] as const;
export type MitigationStatus = (typeof MITIGATION_STATUSES)[number];

export const DECLARATION_STATUSES = [
  "submitted",
  "reviewed",
  "accepted",
  "requires_action",
  "escalated",
] as const;
export type DeclarationStatus = (typeof DECLARATION_STATUSES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface StaffConflictOfInterestRow {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  declaration_date: string;
  conflict_type: ConflictType;
  risk_level: RiskLevel;
  mitigation_status: MitigationStatus;
  declaration_status: DeclarationStatus;
  conflict_description: string;
  mitigation_plan: string | null;
  reviewed_by: string | null;
  annual_review_completed: boolean;
  manager_aware: boolean;
  documented_in_file: boolean;
  no_impact_on_children_confirmed: boolean;
  organisational_learning: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listStaffConflictOfInterest(
  homeId: string,
): Promise<ServiceResult<StaffConflictOfInterestRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_staff_conflict_of_interest") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("declaration_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createStaffConflictOfInterest(input: {
  homeId: string;
  staffName: string;
  staffId?: string | null;
  declarationDate: string;
  conflictType: ConflictType;
  riskLevel: RiskLevel;
  mitigationStatus: MitigationStatus;
  declarationStatus: DeclarationStatus;
  conflictDescription: string;
  mitigationPlan?: string | null;
  reviewedBy?: string | null;
  annualReviewCompleted: boolean;
  managerAware: boolean;
  documentedInFile: boolean;
  noImpactOnChildrenConfirmed: boolean;
  organisationalLearning: boolean;
  notes?: string | null;
}): Promise<ServiceResult<StaffConflictOfInterestRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_staff_conflict_of_interest") as any)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      declaration_date: input.declarationDate,
      conflict_type: input.conflictType,
      risk_level: input.riskLevel,
      mitigation_status: input.mitigationStatus,
      declaration_status: input.declarationStatus,
      conflict_description: input.conflictDescription,
      mitigation_plan: input.mitigationPlan ?? null,
      reviewed_by: input.reviewedBy ?? null,
      annual_review_completed: input.annualReviewCompleted,
      manager_aware: input.managerAware,
      documented_in_file: input.documentedInFile,
      no_impact_on_children_confirmed: input.noImpactOnChildrenConfirmed,
      organisational_learning: input.organisationalLearning,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffConflictMetrics(
  rows: StaffConflictOfInterestRow[],
): {
  total_declarations: number;
  high_risk_count: number;
  critical_risk_count: number;
  escalated_count: number;
  mitigation_failed_count: number;
  annual_review_rate: number;
  manager_aware_rate: number;
  documented_rate: number;
  no_impact_confirmed_rate: number;
  mitigation_in_place_rate: number;
  conflict_type_breakdown: Record<string, number>;
  risk_breakdown: Record<string, number>;
  unique_staff: number;
} {
  const total = rows.length;

  const highRisk = rows.filter((r) => r.risk_level === "high").length;
  const criticalRisk = rows.filter((r) => r.risk_level === "critical").length;
  const escalated = rows.filter((r) => r.declaration_status === "escalated").length;
  const mitigationFailed = rows.filter((r) => r.mitigation_status === "failed").length;

  const boolRate = (field: keyof StaffConflictOfInterestRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  // Mitigation in place rate: only count rows where mitigation is needed (risk != none_identified)
  const mitigationNeeded = rows.filter((r) => r.risk_level !== "none_identified");
  const mitigationInPlace = mitigationNeeded.filter((r) => r.mitigation_status === "in_place").length;
  const mitigationInPlaceRate =
    mitigationNeeded.length > 0
      ? Math.round((mitigationInPlace / mitigationNeeded.length) * 1000) / 10
      : 0;

  const conflictTypeBreakdown: Record<string, number> = {};
  for (const r of rows) conflictTypeBreakdown[r.conflict_type] = (conflictTypeBreakdown[r.conflict_type] ?? 0) + 1;

  const riskBreakdown: Record<string, number> = {};
  for (const r of rows) riskBreakdown[r.risk_level] = (riskBreakdown[r.risk_level] ?? 0) + 1;

  const uniqueStaff = new Set(rows.map((r) => r.staff_name)).size;

  return {
    total_declarations: total,
    high_risk_count: highRisk,
    critical_risk_count: criticalRisk,
    escalated_count: escalated,
    mitigation_failed_count: mitigationFailed,
    annual_review_rate: boolRate("annual_review_completed"),
    manager_aware_rate: boolRate("manager_aware"),
    documented_rate: boolRate("documented_in_file"),
    no_impact_confirmed_rate: boolRate("no_impact_on_children_confirmed"),
    mitigation_in_place_rate: mitigationInPlaceRate,
    conflict_type_breakdown: conflictTypeBreakdown,
    risk_breakdown: riskBreakdown,
    unique_staff: uniqueStaff,
  };
}

export function computeStaffConflictAlerts(
  rows: StaffConflictOfInterestRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: critical risk + mitigation failed (per-record)
  for (const r of rows) {
    if (r.risk_level === "critical" && r.mitigation_status === "failed") {
      alerts.push({
        type: "critical_mitigation_failed",
        severity: "critical",
        message: `${r.staff_name} has a critical-risk conflict of interest with failed mitigation — immediate senior management review required`,
        record_id: r.id,
      });
    }
  }

  // High: high risk + manager not aware (per-record)
  for (const r of rows) {
    if (r.risk_level === "high" && !r.manager_aware) {
      alerts.push({
        type: "high_risk_manager_unaware",
        severity: "high",
        message: `${r.staff_name} has a high-risk conflict of interest and the manager is not yet aware — escalate immediately`,
        record_id: r.id,
      });
    }
  }

  // High: multiple declarations not reviewed (aggregate)
  const notReviewed = rows.filter((r) => r.declaration_status === "submitted").length;
  if (notReviewed >= 2) {
    alerts.push({
      type: "declarations_not_reviewed",
      severity: "high",
      message: `${notReviewed} declarations have not been reviewed — timely review is essential for governance and safeguarding`,
    });
  }

  // Medium: annual reviews not completed (aggregate)
  const annualNotCompleted = rows.filter((r) => !r.annual_review_completed).length;
  if (annualNotCompleted >= 2) {
    alerts.push({
      type: "annual_reviews_incomplete",
      severity: "medium",
      message: `${annualNotCompleted} declarations have annual reviews not completed — schedule reviews to maintain compliance`,
    });
  }

  return alerts;
}

export function generateStaffConflictCaraInsights(
  metrics: ReturnType<typeof computeStaffConflictMetrics>,
  alerts: ReturnType<typeof computeStaffConflictAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (cyan-themed)
  insights.push(
    `[cyan] ${metrics.total_declarations} conflict of interest ${metrics.total_declarations === 1 ? "declaration" : "declarations"} recorded across ${metrics.unique_staff} ${metrics.unique_staff === 1 ? "staff member" : "staff members"}. ` +
      `Manager awareness at ${metrics.manager_aware_rate}%, documentation rate ${metrics.documented_rate}%, ` +
      `and annual review completion at ${metrics.annual_review_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.critical_risk_count} critical-risk and ${metrics.high_risk_count} high-risk declarations, ` +
        `with ${metrics.mitigation_failed_count} failed mitigations and ${metrics.escalated_count} escalated cases.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.critical_risk_count} critical-risk and ${metrics.high_risk_count} high-risk declarations on record. ` +
        `Continue regular declaration reviews to maintain transparent governance.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.critical_risk_count > 0 || metrics.mitigation_failed_count > 0) {
    insights.push(
      `[reflect] ${metrics.critical_risk_count} critical-risk ${metrics.critical_risk_count === 1 ? "declaration" : "declarations"} and ${metrics.mitigation_failed_count} failed ${metrics.mitigation_failed_count === 1 ? "mitigation" : "mitigations"} have been recorded. ` +
        `What systemic factors might be contributing to these conflicts, and how can the home strengthen its ` +
        `conflict management processes to better protect children and maintain professional integrity?`,
    );
  } else if (metrics.annual_review_rate < 100) {
    insights.push(
      `[reflect] Annual review completion stands at ${metrics.annual_review_rate}%. ` +
        `How can the home ensure every staff member completes their annual conflict of interest declaration on time, ` +
        `and are there barriers preventing timely completion that need to be addressed?`,
    );
  } else {
    insights.push(
      `[reflect] All declarations have annual reviews completed and no critical risks have been identified. ` +
        `How can the home build on this strong governance foundation to foster a culture of openness ` +
        `where staff feel confident declaring potential conflicts without fear of judgment?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffConflictMetrics,
  computeStaffConflictAlerts,
  generateStaffConflictCaraInsights,
};
