// ==============================================================================
// CARA -- SCHOOL EXCLUSION & ALTERNATIVE PROVISION SERVICE
// Tracks school exclusions (fixed-term, permanent, informal/illegal), alternative
// provision arrangements, managed moves, Virtual School Head notifications,
// reintegration planning, advocacy, and child/parent views for looked-after children.
//
// UK Regulatory Framework:
// CHR 2015 Reg 8 (education — promoting educational achievement),
// DfE Exclusion Guidance 2023,
// Virtual School Head statutory role,
// SCCIF: Experiences & progress — "The home advocates for children's education."
// Looked-after children are disproportionately excluded from school.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const EXCLUSION_TYPES = [
  "Fixed-Term Exclusion",
  "Permanent Exclusion",
  "Internal Exclusion",
  "Managed Move",
  "Off-Rolling Suspected",
  "Informal/Illegal Exclusion",
  "Reduced Timetable",
  "Alternative Provision Placed",
  "Elective Home Education",
  "Part-Time Timetable",
] as const;
export type ExclusionType = (typeof EXCLUSION_TYPES)[number];

export const STATUSES = [
  "Active",
  "Returned",
  "Alternative Provision",
  "Permanent — New School Found",
  "Ongoing",
] as const;
export type ExclusionStatus = (typeof STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const FORMAL_EXCLUSION_TYPES: ExclusionType[] = [
  "Fixed-Term Exclusion",
  "Permanent Exclusion",
  "Internal Exclusion",
];

export const UNLAWFUL_EXCLUSION_TYPES: ExclusionType[] = [
  "Off-Rolling Suspected",
  "Informal/Illegal Exclusion",
];

export const ALTERNATIVE_TYPES: ExclusionType[] = [
  "Managed Move",
  "Alternative Provision Placed",
  "Reduced Timetable",
  "Part-Time Timetable",
  "Elective Home Education",
];

export const RESOLVED_STATUSES: ExclusionStatus[] = [
  "Returned",
  "Alternative Provision",
  "Permanent — New School Found",
];

// -- Label maps ---------------------------------------------------------------

export const EXCLUSION_TYPE_LABELS: { type: ExclusionType; label: string }[] = [
  { type: "Fixed-Term Exclusion", label: "Fixed-Term Exclusion" },
  { type: "Permanent Exclusion", label: "Permanent Exclusion" },
  { type: "Internal Exclusion", label: "Internal Exclusion" },
  { type: "Managed Move", label: "Managed Move" },
  { type: "Off-Rolling Suspected", label: "Off-Rolling Suspected" },
  { type: "Informal/Illegal Exclusion", label: "Informal / Illegal Exclusion" },
  { type: "Reduced Timetable", label: "Reduced Timetable" },
  { type: "Alternative Provision Placed", label: "Alternative Provision Placed" },
  { type: "Elective Home Education", label: "Elective Home Education" },
  { type: "Part-Time Timetable", label: "Part-Time Timetable" },
];

export const STATUS_LABELS: { status: ExclusionStatus; label: string }[] = [
  { status: "Active", label: "Active" },
  { status: "Returned", label: "Returned to School" },
  { status: "Alternative Provision", label: "Alternative Provision" },
  { status: "Permanent — New School Found", label: "Permanent — New School Found" },
  { status: "Ongoing", label: "Ongoing" },
];

// -- Row type -----------------------------------------------------------------

export interface SchoolExclusionRow {
  id: string;
  home_id: string;
  child_name: string;
  exclusion_date: string;
  recorded_by: string;
  exclusion_type: ExclusionType;
  duration_days: number | null;
  reason_given: string;
  school_name: string;
  virtual_school_head_notified: boolean;
  social_worker_informed: boolean;
  independent_review_requested: boolean | null;
  governor_meeting_attended: boolean | null;
  alternative_provision_arranged: boolean;
  provision_name: string | null;
  education_hours_per_week: number | null;
  reintegration_plan: boolean;
  child_views_obtained: boolean;
  parent_carer_views: boolean;
  advocacy_provided: boolean;
  appeal_outcome: string | null;
  return_date: string | null;
  status: ExclusionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateSchoolExclusion(input: {
  childName?: string;
  exclusionDate?: string;
  recordedBy?: string;
  exclusionType?: string;
  durationDays?: number | null;
  reasonGiven?: string;
  schoolName?: string;
  virtualSchoolHeadNotified?: boolean;
  socialWorkerInformed?: boolean;
  independentReviewRequested?: boolean | null;
  governorMeetingAttended?: boolean | null;
  alternativeProvisionArranged?: boolean;
  provisionName?: string | null;
  educationHoursPerWeek?: number | null;
  reintegrationPlan?: boolean;
  childViewsObtained?: boolean;
  parentCarerViews?: boolean;
  advocacyProvided?: boolean;
  status?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.exclusionDate) {
    errors.push("Exclusion date is required");
  } else {
    const dateObj = new Date(input.exclusionDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Exclusion date must be a valid date");
    }
  }

  if (!input.recordedBy || input.recordedBy.trim().length === 0) {
    errors.push("Recorded by (staff name) is required");
  }

  if (
    !input.exclusionType ||
    !(EXCLUSION_TYPES as readonly string[]).includes(input.exclusionType)
  ) {
    errors.push(`Exclusion type must be one of: ${EXCLUSION_TYPES.join(", ")}`);
  }

  if (!input.reasonGiven || input.reasonGiven.trim().length === 0) {
    errors.push("Reason given for exclusion is required");
  }

  if (!input.schoolName || input.schoolName.trim().length === 0) {
    errors.push("School name is required");
  }

  if (input.status && !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  if (input.durationDays !== null && input.durationDays !== undefined && input.durationDays < 0) {
    errors.push("Duration days cannot be negative");
  }

  if (input.educationHoursPerWeek !== null && input.educationHoursPerWeek !== undefined && input.educationHoursPerWeek < 0) {
    errors.push("Education hours per week cannot be negative");
  }

  // Business rule: Virtual School Head must be notified for looked-after children
  if (input.virtualSchoolHeadNotified === false) {
    errors.push(
      "Virtual School Head not notified — under the Children and Families Act 2014, the Virtual School Head (VSH) must be informed of any exclusion of a looked-after child. The VSH has a statutory duty to promote the educational achievement of looked-after children and can intervene to prevent exclusion, arrange alternative provision, or challenge unlawful practices. Failure to notify the VSH is a regulatory breach. The designated teacher at school should inform the VSH, but the home must verify this has happened",
    );
  }

  // Business rule: Social worker must be informed
  if (input.socialWorkerInformed === false) {
    errors.push(
      "Social worker not informed — the child's allocated social worker must be notified of any school exclusion as it represents a significant event in the child's life. CHR 2015 Reg 40 requires notification of significant events. Exclusions can indicate underlying unmet needs, placement instability, or deteriorating mental health. The social worker must review the care plan in light of the exclusion",
    );
  }

  // Business rule: Informal/Illegal exclusion — serious concern
  if (
    input.exclusionType === "Informal/Illegal Exclusion" ||
    input.exclusionType === "Off-Rolling Suspected"
  ) {
    errors.push(
      "Informal/illegal exclusion or off-rolling suspected — DfE Exclusion Guidance 2023 is clear that informal exclusions are unlawful. Schools cannot ask parents/carers to collect a child early, send children home to 'cool off', or use 'internal exclusion' without proper recording. For looked-after children, the home has a duty to challenge such practices robustly. The Virtual School Head should be involved immediately to advocate for the child's right to full-time education. This must be reported to the local authority",
    );
  }

  // Business rule: Permanent exclusion requires independent review option
  if (input.exclusionType === "Permanent Exclusion" && input.independentReviewRequested === null) {
    errors.push(
      "Permanent exclusion recorded but independent review panel request status not set — for permanent exclusions, the child's carers have the right to request an Independent Review Panel (IRP) within 15 school days of the governing body's decision. For looked-after children, the Virtual School Head should advise on whether to pursue this. The home must ensure this deadline is not missed if there are grounds for challenge",
    );
  }

  // Business rule: Child views must be obtained
  if (input.childViewsObtained === false) {
    errors.push(
      "Child views not obtained — UNCRC Article 12 requires that children's views are heard in all decisions affecting them. CHR 2015 Reg 7 requires that children are consulted. The child's perspective on the exclusion, the reasons behind it, and their feelings about returning or moving schools must be recorded. For children with communication needs, advocacy or alternative communication methods should be used",
    );
  }

  // Business rule: Reduced timetable must not be indefinite
  if (
    (input.exclusionType === "Reduced Timetable" || input.exclusionType === "Part-Time Timetable") &&
    input.educationHoursPerWeek !== null &&
    input.educationHoursPerWeek !== undefined &&
    input.educationHoursPerWeek < 25
  ) {
    errors.push(
      "Reduced timetable provides less than 25 hours — DfE guidance states that reduced timetables should be time-limited with a clear plan to return to full-time education. For looked-after children, any reduction from 25 hours must be agreed with the Virtual School Head, reviewed regularly (at least fortnightly), and have a written plan with target dates for increase. A child receiving fewer than 25 hours is not receiving full-time education",
    );
  }

  // Business rule: Alternative provision must provide minimum hours
  if (
    input.alternativeProvisionArranged === true &&
    input.educationHoursPerWeek !== null &&
    input.educationHoursPerWeek !== undefined &&
    input.educationHoursPerWeek < 15
  ) {
    errors.push(
      "Alternative provision provides less than 15 hours per week — from the sixth day of exclusion, the local authority must arrange suitable full-time education (or from the first day for a looked-after child). Alternative provision offering fewer than 15 hours per week is unlikely to constitute suitable education. The Virtual School Head and social worker must challenge this and advocate for increased hours",
    );
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: SchoolExclusionRow[],
): {
  total_records: number;
  unique_children: number;
  by_exclusion_type: Record<string, number>;
  by_status: Record<string, number>;
  formal_exclusion_count: number;
  unlawful_exclusion_count: number;
  alternative_provision_count: number;
  average_duration_days: number;
  total_lost_days: number;
  virtual_school_head_notification_rate: number;
  social_worker_informed_rate: number;
  child_views_obtained_rate: number;
  parent_carer_views_rate: number;
  advocacy_provided_rate: number;
  reintegration_plan_rate: number;
  alternative_provision_arranged_rate: number;
  active_exclusion_count: number;
  resolved_count: number;
  average_education_hours_when_excluded: number;
  independent_review_requested_count: number;
  children_with_multiple_exclusions: number;
  repeat_exclusion_rate: number;
} {
  const total = rows.length;
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Exclusion type breakdown
  const byExclusionType: Record<string, number> = {};
  for (const et of EXCLUSION_TYPES) byExclusionType[et] = 0;
  for (const r of rows) byExclusionType[r.exclusion_type] = (byExclusionType[r.exclusion_type] || 0) + 1;

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const s of STATUSES) byStatus[s] = 0;
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  // Category counts
  const formalCount = rows.filter((r) => (FORMAL_EXCLUSION_TYPES as string[]).includes(r.exclusion_type)).length;
  const unlawfulCount = rows.filter((r) => (UNLAWFUL_EXCLUSION_TYPES as string[]).includes(r.exclusion_type)).length;
  const alternativeCount = rows.filter((r) => (ALTERNATIVE_TYPES as string[]).includes(r.exclusion_type)).length;

  // Duration metrics
  const durationRows = rows.filter((r) => r.duration_days !== null && r.duration_days > 0);
  const totalLostDays = durationRows.reduce((sum, r) => sum + (r.duration_days || 0), 0);
  const avgDuration = durationRows.length > 0 ? Math.round((totalLostDays / durationRows.length) * 10) / 10 : 0;

  // Boolean rates
  const pct = (filter: (r: SchoolExclusionRow) => boolean) =>
    total > 0 ? Math.round((rows.filter(filter).length / total) * 1000) / 10 : 0;

  const vshRate = pct((r) => r.virtual_school_head_notified);
  const swRate = pct((r) => r.social_worker_informed);
  const childViewsRate = pct((r) => r.child_views_obtained);
  const parentViewsRate = pct((r) => r.parent_carer_views);
  const advocacyRate = pct((r) => r.advocacy_provided);
  const reintegrationRate = pct((r) => r.reintegration_plan);
  const altProvArrangedRate = pct((r) => r.alternative_provision_arranged);

  // Active vs resolved
  const activeCount = rows.filter((r) => r.status === "Active" || r.status === "Ongoing").length;
  const resolvedCount = rows.filter((r) => (RESOLVED_STATUSES as string[]).includes(r.status)).length;

  // Education hours for excluded children
  const hoursRows = rows.filter((r) => r.education_hours_per_week !== null);
  const avgHours = hoursRows.length > 0
    ? Math.round((hoursRows.reduce((sum, r) => sum + (r.education_hours_per_week || 0), 0) / hoursRows.length) * 10) / 10
    : 0;

  // Independent review
  const irpCount = rows.filter((r) => r.independent_review_requested === true).length;

  // Repeat exclusions
  const childExclusionMap = new Map<string, number>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    childExclusionMap.set(key, (childExclusionMap.get(key) || 0) + 1);
  }
  const multipleExclusionChildren = Array.from(childExclusionMap.values()).filter((c) => c > 1).length;
  const repeatRate = uniqueChildren.size > 0
    ? Math.round((multipleExclusionChildren / uniqueChildren.size) * 1000) / 10
    : 0;

  return {
    total_records: total,
    unique_children: uniqueChildren.size,
    by_exclusion_type: byExclusionType,
    by_status: byStatus,
    formal_exclusion_count: formalCount,
    unlawful_exclusion_count: unlawfulCount,
    alternative_provision_count: alternativeCount,
    average_duration_days: avgDuration,
    total_lost_days: totalLostDays,
    virtual_school_head_notification_rate: vshRate,
    social_worker_informed_rate: swRate,
    child_views_obtained_rate: childViewsRate,
    parent_carer_views_rate: parentViewsRate,
    advocacy_provided_rate: advocacyRate,
    reintegration_plan_rate: reintegrationRate,
    alternative_provision_arranged_rate: altProvArrangedRate,
    active_exclusion_count: activeCount,
    resolved_count: resolvedCount,
    average_education_hours_when_excluded: avgHours,
    independent_review_requested_count: irpCount,
    children_with_multiple_exclusions: multipleExclusionChildren,
    repeat_exclusion_rate: repeatRate,
  };
}

export function computeAlerts(
  rows: SchoolExclusionRow[],
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

  // Critical: Informal/illegal exclusion detected
  for (const r of rows) {
    if ((UNLAWFUL_EXCLUSION_TYPES as string[]).includes(r.exclusion_type)) {
      alerts.push({
        type: "unlawful_exclusion",
        severity: "critical",
        message: `${r.child_name} — ${r.exclusion_type} detected at ${r.school_name} (${r.exclusion_date}). DfE Exclusion Guidance 2023 is unequivocal: informal exclusions are unlawful. Schools cannot send children home without following proper exclusion procedures. For looked-after children, this is especially concerning as it may indicate the school is trying to remove the child without triggering the statutory protections that apply to formal exclusions. The Virtual School Head must be informed immediately and should challenge the school. The local authority may need to consider whether the school is meeting its duties under the Equality Act 2010`,
        record_id: r.id,
      });
    }
  }

  // Critical: Permanent exclusion without review consideration
  for (const r of rows) {
    if (r.exclusion_type === "Permanent Exclusion" && r.independent_review_requested === null) {
      alerts.push({
        type: "permanent_no_review_decision",
        severity: "critical",
        message: `${r.child_name} permanently excluded from ${r.school_name} (${r.exclusion_date}) but Independent Review Panel request status not recorded. There is a 15 school-day deadline from the governing body decision to request an IRP. For looked-after children, the Virtual School Head should urgently advise whether to pursue this. Missing this deadline forfeits the right to challenge. The home must confirm whether the deadline has passed or whether a request should be made`,
        record_id: r.id,
      });
    }
  }

  // Critical: Active exclusion with no alternative provision and more than 5 days
  for (const r of rows) {
    if (
      (r.status === "Active" || r.status === "Ongoing") &&
      !r.alternative_provision_arranged &&
      r.duration_days !== null &&
      r.duration_days > 5
    ) {
      alerts.push({
        type: "no_provision_beyond_5_days",
        severity: "critical",
        message: `${r.child_name} has been excluded for ${r.duration_days} days without alternative provision arranged. From the sixth school day of exclusion (or first day for looked-after children), the local authority must arrange suitable full-time education. This child is currently receiving no education, which is a breach of their statutory entitlement. The Virtual School Head and social worker must escalate this immediately to the local authority`,
        record_id: r.id,
      });
    }
  }

  // Critical: VSH not notified
  for (const r of rows) {
    if (!r.virtual_school_head_notified) {
      alerts.push({
        type: "vsh_not_notified",
        severity: "critical",
        message: `${r.child_name}'s exclusion from ${r.school_name} (${r.exclusion_date}) — Virtual School Head not notified. The VSH has a statutory duty to promote educational achievement of looked-after children and can intervene to prevent or reduce exclusions. Every day of delay reduces the VSH's ability to advocate effectively. Notification must happen on the day of exclusion`,
        record_id: r.id,
      });
    }
  }

  // High: Child with multiple exclusions
  const childMap = new Map<string, SchoolExclusionRow[]>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(r);
  }
  for (const [, childRows] of childMap) {
    if (childRows.length >= 3) {
      alerts.push({
        type: "repeat_exclusions",
        severity: "high",
        message: `${childRows[0].child_name} has ${childRows.length} exclusion records. Repeat exclusions indicate that the child's needs are not being met by their current school placement. CHR 2015 Reg 8 requires the home to promote educational achievement. The PEP (Personal Education Plan) must be urgently reviewed. Is the school placement appropriate? Are there undiagnosed SEND needs? Is the child experiencing trauma, bullying, or discrimination that drives their behaviour? A multi-agency meeting should be convened`,
      });
    }
  }

  // High: Child views not obtained
  for (const r of rows) {
    if (!r.child_views_obtained) {
      alerts.push({
        type: "child_views_missing",
        severity: "high",
        message: `${r.child_name}'s views not recorded for exclusion from ${r.school_name} (${r.exclusion_date}). UNCRC Article 12 and CHR 2015 Reg 7 require that children's views are heard. The child may have a different perspective on what happened, may feel unfairly treated, or may be experiencing distress about the exclusion. Their views must inform the response — whether that is challenging the exclusion, arranging advocacy, or planning reintegration`,
        record_id: r.id,
      });
    }
  }

  // High: Social worker not informed
  for (const r of rows) {
    if (!r.social_worker_informed) {
      alerts.push({
        type: "sw_not_informed",
        severity: "high",
        message: `${r.child_name}'s social worker not informed of exclusion from ${r.school_name} (${r.exclusion_date}). Exclusion is a significant event under CHR 2015 Reg 40. The social worker must update the care plan, consider whether the placement remains appropriate, and may need to convene a review. For children subject to care proceedings, the court must be informed of significant changes in circumstances`,
        record_id: r.id,
      });
    }
  }

  // High: Low education hours in alternative provision
  for (const r of rows) {
    if (r.alternative_provision_arranged && r.education_hours_per_week !== null && r.education_hours_per_week < 15) {
      alerts.push({
        type: "low_education_hours",
        severity: "high",
        message: `${r.child_name} receiving only ${r.education_hours_per_week} hours/week in alternative provision (${r.provision_name || "unnamed provision"}). This falls significantly below the expected 25 hours of full-time education. For looked-after children, the local authority has a heightened duty to ensure suitable education. The Virtual School Head must challenge this and push for increased hours. The child is being educationally disadvantaged`,
        record_id: r.id,
      });
    }
  }

  // Medium: No reintegration plan for fixed-term exclusions
  const fixedTermRows = rows.filter((r) => r.exclusion_type === "Fixed-Term Exclusion" && !r.reintegration_plan);
  if (fixedTermRows.length > 0) {
    for (const r of fixedTermRows) {
      alerts.push({
        type: "no_reintegration_plan",
        severity: "medium",
        message: `${r.child_name} — no reintegration plan for fixed-term exclusion from ${r.school_name}. DfE guidance states that a reintegration interview should be held with the child and parent/carer on return. For looked-after children, the home should attend this meeting. Without a clear plan, the child may return to the same situation that led to the exclusion and be at risk of further exclusion. What support will be in place on return?`,
        record_id: r.id,
      });
    }
  }

  // Medium: No advocacy provided
  const noAdvocacyRows = rows.filter((r) => !r.advocacy_provided && (FORMAL_EXCLUSION_TYPES as string[]).includes(r.exclusion_type));
  if (noAdvocacyRows.length > 0) {
    alerts.push({
      type: "no_advocacy",
      severity: "medium",
      message: `${noAdvocacyRows.length} formal exclusion(s) without advocacy recorded. Looked-after children are entitled to advocacy under CHR 2015. When facing exclusion, children need someone to represent their views and challenge decisions on their behalf. The home should ensure that the child's IRO (Independent Reviewing Officer), VSH, or an independent advocate is supporting the child through the exclusion process`,
    });
  }

  // Medium: High total lost days
  const totalLostDays = rows.reduce((sum, r) => sum + (r.duration_days || 0), 0);
  if (totalLostDays > 30) {
    alerts.push({
      type: "high_total_lost_days",
      severity: "medium",
      message: `${totalLostDays} total school days lost to exclusions across all children. Every lost day widens the educational attainment gap for looked-after children, who already face significant educational disadvantage. Research shows that exclusion is strongly correlated with poor outcomes including NEET status, involvement in the criminal justice system, and mental health difficulties. The home must demonstrate robust advocacy to prevent educational loss`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: SchoolExclusionRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_exclusion_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const statusBreakdown = Object.entries(metrics.by_status)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} exclusion ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Types: ${typeBreakdown || "none recorded"}. ` +
      `Statuses: ${statusBreakdown || "none"}. ` +
      `Total education days lost: ${metrics.total_lost_days}. ` +
      `Average duration: ${metrics.average_duration_days} days. ` +
      `Formal exclusions: ${metrics.formal_exclusion_count}. ` +
      `Unlawful/suspected: ${metrics.unlawful_exclusion_count}. ` +
      `Active: ${metrics.active_exclusion_count}. Resolved: ${metrics.resolved_count}. ` +
      `VSH notification rate: ${metrics.virtual_school_head_notification_rate}%. ` +
      `Social worker informed rate: ${metrics.social_worker_informed_rate}%. ` +
      `Child views rate: ${metrics.child_views_obtained_rate}%. ` +
      `Repeat exclusion rate: ${metrics.repeat_exclusion_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Advocacy rate: ${metrics.advocacy_provided_rate}%. ` +
        `Reintegration plan rate: ${metrics.reintegration_plan_rate}%. ` +
        `Alternative provision arranged rate: ${metrics.alternative_provision_arranged_rate}%. ` +
        `Average education hours when excluded: ${metrics.average_education_hours_when_excluded}. ` +
        `Parent/carer views rate: ${metrics.parent_carer_views_rate}%. ` +
        `Children with multiple exclusions: ${metrics.children_with_multiple_exclusions}. ` +
        `Independent reviews requested: ${metrics.independent_review_requested_count}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority exclusion alerts. ` +
        `Advocacy rate: ${metrics.advocacy_provided_rate}%. ` +
        `Reintegration plan rate: ${metrics.reintegration_plan_rate}%. ` +
        `Alternative provision rate: ${metrics.alternative_provision_arranged_rate}%. ` +
        `Continue robust educational advocacy per CHR 2015 Reg 8.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.unlawful_exclusion_count > 0) {
    insights.push(
      `[reflect] ${metrics.unlawful_exclusion_count} suspected unlawful exclusion(s) recorded. ` +
        `Informal exclusions are a significant issue for looked-after children ` +
        `who may be sent home without formal paperwork — denying them the ` +
        `statutory protections that apply to formal exclusions (governor ` +
        `review, right to appeal, alternative provision from day 1). DfE ` +
        `Exclusion Guidance 2023 is clear this is unlawful. Is the home ` +
        `challenging schools that attempt informal exclusions? Is the Virtual ` +
        `School Head being used effectively to advocate? Are staff recognising ` +
        `the signs of off-rolling (pressure to move schools, reduced ` +
        `timetables without review, suggestions of elective home education)?`,
    );
  } else if (metrics.repeat_exclusion_rate > 30) {
    insights.push(
      `[reflect] ${metrics.repeat_exclusion_rate}% of children have multiple exclusions. ` +
        `Repeat exclusion is a strong signal that the current approach is not ` +
        `working. Research consistently shows that exclusion rarely changes ` +
        `behaviour — it removes the child from support, disrupts relationships, ` +
        `and increases risk of disengagement. For looked-after children whose ` +
        `behaviour is often driven by trauma, exclusion retraumatises. Are PEPs ` +
        `addressing the root causes? Has an Educational Psychologist been ` +
        `involved? Are therapeutic supports in place at school? Is the school ` +
        `genuinely inclusive or is it the wrong placement for this child?`,
    );
  } else if (metrics.child_views_obtained_rate < 60 && metrics.total_records > 3) {
    insights.push(
      `[reflect] Child views recorded in only ${metrics.child_views_obtained_rate}% of exclusions. ` +
        `Exclusion is often experienced as rejection, punishment, or ` +
        `confirmation of a child's negative self-belief. For looked-after ` +
        `children who have already experienced rejection and loss, exclusion ` +
        `can be deeply harmful to their sense of belonging and self-worth. ` +
        `Understanding the child's perspective is not just a regulatory ` +
        `requirement (UNCRC Article 12, CHR 2015 Reg 7) — it is essential ` +
        `for effective intervention. How did the child feel? Do they think ` +
        `it was fair? What do they need to succeed?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home's educational advocacy model work in ` +
        `practice? CHR 2015 Reg 8 requires that the home promotes children's ` +
        `educational achievement. SCCIF inspectors look for evidence that ` +
        `the home 'fights' for children's education rights. This means ` +
        `attending governor meetings, requesting IRPs where appropriate, ` +
        `involving the VSH proactively, and challenging schools that do not ` +
        `make reasonable adjustments for children with trauma histories. ` +
        `Is there a named education champion in the staff team? Are ` +
        `relationships with local schools proactive rather than reactive?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    exclusionType?: ExclusionType;
    status?: ExclusionStatus;
    limit?: number;
  },
): Promise<ServiceResult<SchoolExclusionRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_school_exclusion") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.exclusionType) q = q.eq("exclusion_type", filters.exclusionType);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("exclusion_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<SchoolExclusionRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_school_exclusion") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  exclusionDate: string;
  recordedBy: string;
  exclusionType: ExclusionType;
  durationDays?: number | null;
  reasonGiven: string;
  schoolName: string;
  virtualSchoolHeadNotified?: boolean;
  socialWorkerInformed?: boolean;
  independentReviewRequested?: boolean | null;
  governorMeetingAttended?: boolean | null;
  alternativeProvisionArranged?: boolean;
  provisionName?: string | null;
  educationHoursPerWeek?: number | null;
  reintegrationPlan?: boolean;
  childViewsObtained?: boolean;
  parentCarerViews?: boolean;
  advocacyProvided?: boolean;
  appealOutcome?: string | null;
  returnDate?: string | null;
  status?: ExclusionStatus;
  notes?: string | null;
}): Promise<ServiceResult<SchoolExclusionRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateSchoolExclusion({
    childName: input.childName,
    exclusionDate: input.exclusionDate,
    recordedBy: input.recordedBy,
    exclusionType: input.exclusionType,
    durationDays: input.durationDays,
    reasonGiven: input.reasonGiven,
    schoolName: input.schoolName,
    virtualSchoolHeadNotified: input.virtualSchoolHeadNotified,
    socialWorkerInformed: input.socialWorkerInformed,
    independentReviewRequested: input.independentReviewRequested,
    governorMeetingAttended: input.governorMeetingAttended,
    alternativeProvisionArranged: input.alternativeProvisionArranged,
    provisionName: input.provisionName,
    educationHoursPerWeek: input.educationHoursPerWeek,
    reintegrationPlan: input.reintegrationPlan,
    childViewsObtained: input.childViewsObtained,
    parentCarerViews: input.parentCarerViews,
    advocacyProvided: input.advocacyProvided,
    status: input.status,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_school_exclusion") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      exclusion_date: input.exclusionDate,
      recorded_by: input.recordedBy,
      exclusion_type: input.exclusionType,
      duration_days: input.durationDays ?? null,
      reason_given: input.reasonGiven,
      school_name: input.schoolName,
      virtual_school_head_notified: input.virtualSchoolHeadNotified ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      independent_review_requested: input.independentReviewRequested ?? null,
      governor_meeting_attended: input.governorMeetingAttended ?? null,
      alternative_provision_arranged: input.alternativeProvisionArranged ?? false,
      provision_name: input.provisionName ?? null,
      education_hours_per_week: input.educationHoursPerWeek ?? null,
      reintegration_plan: input.reintegrationPlan ?? false,
      child_views_obtained: input.childViewsObtained ?? false,
      parent_carer_views: input.parentCarerViews ?? false,
      advocacy_provided: input.advocacyProvided ?? false,
      appeal_outcome: input.appealOutcome ?? null,
      return_date: input.returnDate ?? null,
      status: input.status ?? "Active",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    childName: string;
    exclusionDate: string;
    recordedBy: string;
    exclusionType: ExclusionType;
    durationDays: number | null;
    reasonGiven: string;
    schoolName: string;
    virtualSchoolHeadNotified: boolean;
    socialWorkerInformed: boolean;
    independentReviewRequested: boolean | null;
    governorMeetingAttended: boolean | null;
    alternativeProvisionArranged: boolean;
    provisionName: string | null;
    educationHoursPerWeek: number | null;
    reintegrationPlan: boolean;
    childViewsObtained: boolean;
    parentCarerViews: boolean;
    advocacyProvided: boolean;
    appealOutcome: string | null;
    returnDate: string | null;
    status: ExclusionStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<SchoolExclusionRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.exclusionDate !== undefined) mapped.exclusion_date = updates.exclusionDate;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.exclusionType !== undefined) mapped.exclusion_type = updates.exclusionType;
  if (updates.durationDays !== undefined) mapped.duration_days = updates.durationDays;
  if (updates.reasonGiven !== undefined) mapped.reason_given = updates.reasonGiven;
  if (updates.schoolName !== undefined) mapped.school_name = updates.schoolName;
  if (updates.virtualSchoolHeadNotified !== undefined) mapped.virtual_school_head_notified = updates.virtualSchoolHeadNotified;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.independentReviewRequested !== undefined) mapped.independent_review_requested = updates.independentReviewRequested;
  if (updates.governorMeetingAttended !== undefined) mapped.governor_meeting_attended = updates.governorMeetingAttended;
  if (updates.alternativeProvisionArranged !== undefined) mapped.alternative_provision_arranged = updates.alternativeProvisionArranged;
  if (updates.provisionName !== undefined) mapped.provision_name = updates.provisionName;
  if (updates.educationHoursPerWeek !== undefined) mapped.education_hours_per_week = updates.educationHoursPerWeek;
  if (updates.reintegrationPlan !== undefined) mapped.reintegration_plan = updates.reintegrationPlan;
  if (updates.childViewsObtained !== undefined) mapped.child_views_obtained = updates.childViewsObtained;
  if (updates.parentCarerViews !== undefined) mapped.parent_carer_views = updates.parentCarerViews;
  if (updates.advocacyProvided !== undefined) mapped.advocacy_provided = updates.advocacyProvided;
  if (updates.appealOutcome !== undefined) mapped.appeal_outcome = updates.appealOutcome;
  if (updates.returnDate !== undefined) mapped.return_date = updates.returnDate;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_school_exclusion") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_school_exclusion") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
