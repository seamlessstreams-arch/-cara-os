// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF CODE OF CONDUCT COMPLIANCE SERVICE
// Code of conduct acknowledgements, annual compliance reviews,
// breach tracking, and training on professional standards.
// CHR 2015 Reg 33 (employment — staff standards and conduct),
// CHR 2015 Reg 34 (fitness of workers).
//
// Covers: code acknowledgement, compliance reviews, breach tracking,
// action outcomes, and improvement monitoring.
//
// SCCIF: Leadership & Management — "Staff understand and follow
// the code of conduct."
// Keeping Children Safe in Education (KCSiE).
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const COMPLIANCE_AREAS = [
  "professional_conduct",
  "safeguarding_practice",
  "confidentiality",
  "social_media_use",
  "relationships_with_children",
  "substance_use",
  "dress_code",
  "communication_standards",
  "financial_propriety",
  "whistleblowing_duty",
] as const;
export type ComplianceArea = (typeof COMPLIANCE_AREAS)[number];

export const COMPLIANCE_STATUSES = [
  "fully_compliant",
  "minor_concern",
  "significant_concern",
  "breach_identified",
  "under_investigation",
  "non_compliant",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export const REVIEW_TYPES = [
  "annual_acknowledgement",
  "induction_sign_off",
  "spot_check",
  "incident_review",
  "supervision_discussion",
  "formal_review",
] as const;
export type ReviewType = (typeof REVIEW_TYPES)[number];

export const ACTION_OUTCOMES = [
  "no_action_needed",
  "informal_guidance",
  "written_warning",
  "final_warning",
  "dismissal_considered",
  "training_required",
] as const;
export type ActionOutcome = (typeof ACTION_OUTCOMES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface StaffCodeOfConductComplianceRow {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  review_date: string;
  compliance_area: ComplianceArea;
  compliance_status: ComplianceStatus;
  review_type: ReviewType;
  action_outcome: ActionOutcome;
  code_acknowledged: boolean;
  training_completed: boolean;
  supervision_discussed: boolean;
  self_assessment_done: boolean;
  breach_reported: boolean;
  investigation_completed: boolean;
  improvement_plan_agreed: boolean;
  improvement_demonstrated: boolean;
  reviewer_name: string | null;
  breach_details: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listStaffCodeOfConductCompliance(
  homeId: string,
): Promise<ServiceResult<StaffCodeOfConductComplianceRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_staff_code_of_conduct_compliance") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("review_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createStaffCodeOfConductCompliance(input: {
  homeId: string;
  staffName: string;
  staffId?: string | null;
  reviewDate: string;
  complianceArea: ComplianceArea;
  complianceStatus: ComplianceStatus;
  reviewType: ReviewType;
  actionOutcome: ActionOutcome;
  codeAcknowledged?: boolean;
  trainingCompleted?: boolean;
  supervisionDiscussed?: boolean;
  selfAssessmentDone?: boolean;
  breachReported?: boolean;
  investigationCompleted?: boolean;
  improvementPlanAgreed?: boolean;
  improvementDemonstrated?: boolean;
  reviewerName?: string | null;
  breachDetails?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<StaffCodeOfConductComplianceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_staff_code_of_conduct_compliance") as any)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      review_date: input.reviewDate,
      compliance_area: input.complianceArea,
      compliance_status: input.complianceStatus,
      review_type: input.reviewType,
      action_outcome: input.actionOutcome,
      code_acknowledged: input.codeAcknowledged ?? true,
      training_completed: input.trainingCompleted ?? true,
      supervision_discussed: input.supervisionDiscussed ?? true,
      self_assessment_done: input.selfAssessmentDone ?? true,
      breach_reported: input.breachReported ?? false,
      investigation_completed: input.investigationCompleted ?? false,
      improvement_plan_agreed: input.improvementPlanAgreed ?? false,
      improvement_demonstrated: input.improvementDemonstrated ?? false,
      reviewer_name: input.reviewerName ?? null,
      breach_details: input.breachDetails ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeCodeOfConductMetrics(
  rows: StaffCodeOfConductComplianceRow[],
): {
  total_reviews: number;
  breach_count: number;
  non_compliant_count: number;
  investigation_count: number;
  significant_concern_count: number;
  code_acknowledged_rate: number;
  training_completed_rate: number;
  supervision_discussed_rate: number;
  self_assessment_rate: number;
  breach_reported_rate: number;
  investigation_completed_rate: number;
  improvement_plan_rate: number;
  improvement_demonstrated_rate: number;
  compliance_area_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  unique_staff: number;
} {
  const total = rows.length;

  const breachCount = rows.filter((r) => r.compliance_status === "breach_identified").length;
  const nonCompliantCount = rows.filter((r) => r.compliance_status === "non_compliant").length;
  const investigationCount = rows.filter((r) => r.compliance_status === "under_investigation").length;
  const significantConcernCount = rows.filter((r) => r.compliance_status === "significant_concern").length;

  const boolRate = (field: keyof StaffCodeOfConductComplianceRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  const complianceAreaBreakdown: Record<string, number> = {};
  for (const r of rows) complianceAreaBreakdown[r.compliance_area] = (complianceAreaBreakdown[r.compliance_area] ?? 0) + 1;

  const statusBreakdown: Record<string, number> = {};
  for (const r of rows) statusBreakdown[r.compliance_status] = (statusBreakdown[r.compliance_status] ?? 0) + 1;

  const uniqueStaff = new Set(rows.map((r) => r.staff_name)).size;

  return {
    total_reviews: total,
    breach_count: breachCount,
    non_compliant_count: nonCompliantCount,
    investigation_count: investigationCount,
    significant_concern_count: significantConcernCount,
    code_acknowledged_rate: boolRate("code_acknowledged"),
    training_completed_rate: boolRate("training_completed"),
    supervision_discussed_rate: boolRate("supervision_discussed"),
    self_assessment_rate: boolRate("self_assessment_done"),
    breach_reported_rate: boolRate("breach_reported"),
    investigation_completed_rate: boolRate("investigation_completed"),
    improvement_plan_rate: boolRate("improvement_plan_agreed"),
    improvement_demonstrated_rate: boolRate("improvement_demonstrated"),
    compliance_area_breakdown: complianceAreaBreakdown,
    status_breakdown: statusBreakdown,
    unique_staff: uniqueStaff,
  };
}

export function computeCodeOfConductAlerts(
  rows: StaffCodeOfConductComplianceRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: breach identified without investigation completed
  for (const r of rows) {
    if (r.compliance_status === "breach_identified" && !r.investigation_completed) {
      alerts.push({
        type: "breach_without_investigation",
        severity: "critical",
        message: `${r.staff_name} has a breach identified in ${r.compliance_area.replace(/_/g, " ")} without a completed investigation — initiate investigation immediately`,
        record_id: r.id,
      });
    }
  }

  // Critical: non_compliant in safeguarding_practice
  for (const r of rows) {
    if (r.compliance_status === "non_compliant" && r.compliance_area === "safeguarding_practice") {
      alerts.push({
        type: "non_compliant_safeguarding",
        severity: "critical",
        message: `${r.staff_name} is non-compliant in safeguarding practice — this poses a direct risk to children and requires urgent action`,
        record_id: r.id,
      });
    }
  }

  // High: code not acknowledged and no training completed
  for (const r of rows) {
    if (!r.code_acknowledged && !r.training_completed) {
      alerts.push({
        type: "no_acknowledgement_no_training",
        severity: "high",
        message: `${r.staff_name} has neither acknowledged the code of conduct nor completed training — ensure compliance before unsupervised duties`,
        record_id: r.id,
      });
    }
  }

  // High: significant concern without improvement plan
  for (const r of rows) {
    if (r.compliance_status === "significant_concern" && !r.improvement_plan_agreed) {
      alerts.push({
        type: "significant_concern_no_plan",
        severity: "high",
        message: `${r.staff_name} has a significant concern in ${r.compliance_area.replace(/_/g, " ")} without an improvement plan — agree an improvement plan promptly`,
        record_id: r.id,
      });
    }
  }

  // Medium: supervision not discussed for concern area
  const concernStatuses: ComplianceStatus[] = ["minor_concern", "significant_concern", "breach_identified", "under_investigation", "non_compliant"];
  for (const r of rows) {
    if (concernStatuses.includes(r.compliance_status) && !r.supervision_discussed) {
      alerts.push({
        type: "concern_not_in_supervision",
        severity: "medium",
        message: `${r.staff_name} has a ${r.compliance_status.replace(/_/g, " ")} in ${r.compliance_area.replace(/_/g, " ")} that has not been discussed in supervision`,
        record_id: r.id,
      });
    }
  }

  // Medium: annual acknowledgement overdue (no recent annual_acknowledgement review_type)
  const staffNames = new Set(rows.map((r) => r.staff_name));
  for (const name of staffNames) {
    const staffRows = rows.filter((r) => r.staff_name === name);
    const hasAnnual = staffRows.some((r) => r.review_type === "annual_acknowledgement");
    if (!hasAnnual) {
      alerts.push({
        type: "annual_acknowledgement_overdue",
        severity: "medium",
        message: `${name} has no annual acknowledgement review on record — schedule annual code of conduct acknowledgement`,
      });
    }
  }

  return alerts;
}

export function generateCodeOfConductCaraInsights(
  rows: StaffCodeOfConductComplianceRow[],
): string[] {
  const metrics = computeCodeOfConductMetrics(rows);
  const alerts = computeCodeOfConductAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats (emerald-themed)
  insights.push(
    `[emerald] ${metrics.total_reviews} code of conduct reviews across ${metrics.unique_staff} staff ${metrics.unique_staff === 1 ? "member" : "members"}. ` +
      `${metrics.code_acknowledged_rate}% have acknowledged the code, ${metrics.training_completed_rate}% completed training, ` +
      `and ${metrics.supervision_discussed_rate}% discussed in supervision.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.breach_count} breaches, ${metrics.non_compliant_count} non-compliant, ` +
        `and ${metrics.investigation_count} under investigation.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.breach_count} breaches and ${metrics.non_compliant_count} non-compliant records. ` +
        `Continue monitoring to maintain professional standards.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.breach_count > 0) {
    insights.push(
      `[reflect] ${metrics.breach_count} code of conduct ${metrics.breach_count === 1 ? "breach has" : "breaches have"} been identified. ` +
        `Are there systemic factors contributing to breaches, and how can the home strengthen ` +
        `its culture of professional conduct to better safeguard children?`,
    );
  } else if (metrics.code_acknowledged_rate < 100) {
    insights.push(
      `[reflect] ${metrics.code_acknowledged_rate}% of staff have acknowledged the code of conduct. ` +
        `Could gaps in acknowledgement indicate misunderstanding of professional expectations, ` +
        `and how might this affect the safety and care of children in the home?`,
    );
  } else {
    insights.push(
      `[reflect] All staff have acknowledged the code of conduct and no breaches have been identified. ` +
        `How can the home build on this strong foundation of professional standards ` +
        `to further improve outcomes for children?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeCodeOfConductMetrics,
  computeCodeOfConductAlerts,
  generateCodeOfConductCaraInsights,
};
