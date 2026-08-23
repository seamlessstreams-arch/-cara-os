// ══════════════════════════════════════════════════════════════════════════════
// CARA — EQUALITY & HUMAN RIGHTS SERVICE
// Tracks equality impact assessments, human rights compliance,
// protected characteristics monitoring, and discrimination prevention.
// CHR 2015 Reg 11 (positive relationships — non-discrimination),
// Reg 4 (welfare — rights and freedoms),
// Equality Act 2010, Human Rights Act 1998.
//
// Covers: equality impact assessments, protected characteristics,
// reasonable adjustments, discrimination incidents, and compliance audits.
//
// SCCIF: Experiences & Progress — "Children are treated with dignity
// and respect." "Discrimination is actively prevented."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AssessmentType =
  | "equality_impact_assessment"
  | "human_rights_audit"
  | "discrimination_incident"
  | "reasonable_adjustment"
  | "policy_review"
  | "staff_training"
  | "child_consultation"
  | "compliance_check"
  | "other";

export type ProtectedCharacteristic =
  | "age"
  | "disability"
  | "gender_reassignment"
  | "marriage_civil_partnership"
  | "pregnancy_maternity"
  | "race"
  | "religion_belief"
  | "sex"
  | "sexual_orientation"
  | "multiple"
  | "none_identified";

export type ComplianceLevel =
  | "fully_compliant"
  | "mostly_compliant"
  | "partially_compliant"
  | "non_compliant"
  | "not_assessed";

export type ActionStatus =
  | "completed"
  | "in_progress"
  | "planned"
  | "overdue"
  | "not_required";

export interface EqualityRecord {
  id: string;
  home_id: string;
  assessment_type: AssessmentType;
  assessment_date: string;
  protected_characteristic: ProtectedCharacteristic;
  compliance_level: ComplianceLevel;
  action_status: ActionStatus;
  assessed_by: string;
  child_involved: string | null;
  staff_involved: string | null;
  description: string;
  findings: string | null;
  actions_required: string[];
  actions_completed: string[];
  reasonable_adjustment_made: boolean;
  human_rights_article: string | null;
  discrimination_type: string | null;
  impact_on_child: boolean;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ASSESSMENT_TYPES: { type: AssessmentType; label: string }[] = [
  { type: "equality_impact_assessment", label: "Equality Impact Assessment" },
  { type: "human_rights_audit", label: "Human Rights Audit" },
  { type: "discrimination_incident", label: "Discrimination Incident" },
  { type: "reasonable_adjustment", label: "Reasonable Adjustment" },
  { type: "policy_review", label: "Policy Review" },
  { type: "staff_training", label: "Staff Training" },
  { type: "child_consultation", label: "Child Consultation" },
  { type: "compliance_check", label: "Compliance Check" },
  { type: "other", label: "Other" },
];

export const PROTECTED_CHARACTERISTICS: { characteristic: ProtectedCharacteristic; label: string }[] = [
  { characteristic: "age", label: "Age" },
  { characteristic: "disability", label: "Disability" },
  { characteristic: "gender_reassignment", label: "Gender Reassignment" },
  { characteristic: "marriage_civil_partnership", label: "Marriage/Civil Partnership" },
  { characteristic: "pregnancy_maternity", label: "Pregnancy/Maternity" },
  { characteristic: "race", label: "Race" },
  { characteristic: "religion_belief", label: "Religion/Belief" },
  { characteristic: "sex", label: "Sex" },
  { characteristic: "sexual_orientation", label: "Sexual Orientation" },
  { characteristic: "multiple", label: "Multiple" },
  { characteristic: "none_identified", label: "None Identified" },
];

export const COMPLIANCE_LEVELS: { level: ComplianceLevel; label: string }[] = [
  { level: "fully_compliant", label: "Fully Compliant" },
  { level: "mostly_compliant", label: "Mostly Compliant" },
  { level: "partially_compliant", label: "Partially Compliant" },
  { level: "non_compliant", label: "Non-Compliant" },
  { level: "not_assessed", label: "Not Assessed" },
];

export const ACTION_STATUSES: { status: ActionStatus; label: string }[] = [
  { status: "completed", label: "Completed" },
  { status: "in_progress", label: "In Progress" },
  { status: "planned", label: "Planned" },
  { status: "overdue", label: "Overdue" },
  { status: "not_required", label: "Not Required" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeEqualityMetrics(
  records: EqualityRecord[],
): {
  total_records: number;
  eia_count: number;
  human_rights_audit_count: number;
  discrimination_incident_count: number;
  reasonable_adjustment_count: number;
  fully_compliant_rate: number | null;
  non_compliant_count: number;
  actions_overdue_count: number;
  actions_completed_rate: number | null;
  reasonable_adjustment_rate: number | null;
  impact_on_child_count: number;
  review_overdue_count: number;
  by_assessment_type: Record<string, number>;
  by_protected_characteristic: Record<string, number>;
  by_compliance_level: Record<string, number>;
  by_action_status: Record<string, number>;
} {
  const eia = records.filter((r) => r.assessment_type === "equality_impact_assessment").length;
  const hrAudit = records.filter((r) => r.assessment_type === "human_rights_audit").length;
  const discrimination = records.filter((r) => r.assessment_type === "discrimination_incident").length;
  const adjustment = records.filter((r) => r.assessment_type === "reasonable_adjustment").length;

  const fullyCompliant = records.filter((r) => r.compliance_level === "fully_compliant").length;
  const fullyCompliantRate =
    records.length > 0
      ? Math.round((fullyCompliant / records.length) * 1000) / 10
      : null;

  const nonCompliant = records.filter((r) => r.compliance_level === "non_compliant").length;
  const overdue = records.filter((r) => r.action_status === "overdue").length;

  const totalActionsRequired = records.reduce((sum, r) => sum + r.actions_required.length, 0);
  const totalActionsCompleted = records.reduce((sum, r) => sum + r.actions_completed.length, 0);
  const actionsCompletedRate =
    totalActionsRequired > 0
      ? Math.round((totalActionsCompleted / totalActionsRequired) * 1000) / 10
      : null;

  const adjustmentsMade = records.filter((r) => r.reasonable_adjustment_made).length;
  const adjustmentRate =
    records.length > 0
      ? Math.round((adjustmentsMade / records.length) * 1000) / 10
      : null;

  const impactOnChild = records.filter((r) => r.impact_on_child).length;

  const now = new Date();
  const reviewOverdue = records.filter((r) => {
    if (!r.review_date) return false;
    return new Date(r.review_date) < now;
  }).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.assessment_type] = (byType[r.assessment_type] ?? 0) + 1;

  const byCharacteristic: Record<string, number> = {};
  for (const r of records) byCharacteristic[r.protected_characteristic] = (byCharacteristic[r.protected_characteristic] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.compliance_level] = (byCompliance[r.compliance_level] ?? 0) + 1;

  const byAction: Record<string, number> = {};
  for (const r of records) byAction[r.action_status] = (byAction[r.action_status] ?? 0) + 1;

  return {
    total_records: records.length,
    eia_count: eia,
    human_rights_audit_count: hrAudit,
    discrimination_incident_count: discrimination,
    reasonable_adjustment_count: adjustment,
    fully_compliant_rate: fullyCompliantRate,
    non_compliant_count: nonCompliant,
    actions_overdue_count: overdue,
    actions_completed_rate: actionsCompletedRate,
    reasonable_adjustment_rate: adjustmentRate,
    impact_on_child_count: impactOnChild,
    review_overdue_count: reviewOverdue,
    by_assessment_type: byType,
    by_protected_characteristic: byCharacteristic,
    by_compliance_level: byCompliance,
    by_action_status: byAction,
  };
}

export function identifyEqualityAlerts(
  records: EqualityRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Discrimination incidents
  for (const r of records) {
    if (r.assessment_type === "discrimination_incident") {
      alerts.push({
        type: "discrimination_incident",
        severity: "critical",
        message: `Discrimination incident involving ${r.protected_characteristic.replace(/_/g, " ")} on ${r.assessment_date} — investigate and take action`,
        id: r.id,
      });
    }
  }

  // Non-compliant findings
  for (const r of records) {
    if (r.compliance_level === "non_compliant") {
      alerts.push({
        type: "non_compliant",
        severity: "high",
        message: `Non-compliant ${r.assessment_type.replace(/_/g, " ")} finding on ${r.assessment_date} — remedial action required`,
        id: r.id,
      });
    }
  }

  // Actions overdue
  const overdueCount = records.filter((r) => r.action_status === "overdue").length;
  if (overdueCount >= 1) {
    alerts.push({
      type: "actions_overdue",
      severity: "high",
      message: `${overdueCount} equality ${overdueCount === 1 ? "action is" : "actions are"} overdue — complete promptly`,
      id: "actions_overdue",
    });
  }

  // Impact on child without adjustment
  for (const r of records) {
    if (r.impact_on_child && !r.reasonable_adjustment_made && r.action_status !== "completed") {
      alerts.push({
        type: "child_impact_no_adjustment",
        severity: "medium",
        message: `Impact on child identified in ${r.assessment_type.replace(/_/g, " ")} on ${r.assessment_date} without reasonable adjustment`,
        id: r.id,
      });
    }
  }

  // Review overdue
  const now = new Date();
  const reviewOverdue = records.filter((r) => {
    if (!r.review_date) return false;
    return new Date(r.review_date) < now;
  }).length;
  if (reviewOverdue >= 1) {
    alerts.push({
      type: "review_overdue",
      severity: "medium",
      message: `${reviewOverdue} equality ${reviewOverdue === 1 ? "review is" : "reviews are"} overdue — schedule promptly`,
      id: "review_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    assessmentType?: AssessmentType;
    protectedCharacteristic?: ProtectedCharacteristic;
    complianceLevel?: ComplianceLevel;
    limit?: number;
  },
): Promise<ServiceResult<EqualityRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_equality_human_rights") as SB).select("*").eq("home_id", homeId);
  if (filters?.assessmentType) q = q.eq("assessment_type", filters.assessmentType);
  if (filters?.protectedCharacteristic) q = q.eq("protected_characteristic", filters.protectedCharacteristic);
  if (filters?.complianceLevel) q = q.eq("compliance_level", filters.complianceLevel);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    assessmentType: AssessmentType;
    assessmentDate: string;
    protectedCharacteristic: ProtectedCharacteristic;
    complianceLevel: ComplianceLevel;
    actionStatus: ActionStatus;
    assessedBy: string;
    childInvolved?: string;
    staffInvolved?: string;
    description: string;
    findings?: string;
    actionsRequired: string[];
    actionsCompleted: string[];
    reasonableAdjustmentMade: boolean;
    humanRightsArticle?: string;
    discriminationType?: string;
    impactOnChild: boolean;
    reviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<EqualityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_equality_human_rights") as SB)
    .insert({
      home_id: input.homeId,
      assessment_type: input.assessmentType,
      assessment_date: input.assessmentDate,
      protected_characteristic: input.protectedCharacteristic,
      compliance_level: input.complianceLevel,
      action_status: input.actionStatus,
      assessed_by: input.assessedBy,
      child_involved: input.childInvolved ?? null,
      staff_involved: input.staffInvolved ?? null,
      description: input.description,
      findings: input.findings ?? null,
      actions_required: input.actionsRequired,
      actions_completed: input.actionsCompleted,
      reasonable_adjustment_made: input.reasonableAdjustmentMade,
      human_rights_article: input.humanRightsArticle ?? null,
      discrimination_type: input.discriminationType ?? null,
      impact_on_child: input.impactOnChild,
      review_date: input.reviewDate ?? null,
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
): Promise<ServiceResult<EqualityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_equality_human_rights") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeEqualityMetrics,
  identifyEqualityAlerts,
};
