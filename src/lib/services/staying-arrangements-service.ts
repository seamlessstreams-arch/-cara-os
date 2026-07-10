// ==============================================================================
// CARA -- STAYING PUT & STAYING CLOSE ARRANGEMENTS SERVICE
// Tracks Staying Put and Staying Close arrangements for care leavers,
// including pathway planning, financial arrangements, education/training
// status, independent living skills progress, support levels, and review
// management for young people transitioning from residential care.
//
// Covers: Arrangement type classification (Staying Put / Staying Close),
// pathway plan monitoring, financial arrangement tracking, education and
// training status, independent living skills progress assessment (Emerging →
// Independent), support level management, personal adviser allocation,
// satisfaction tracking, breakdown risk identification, review scheduling,
// and outcome recording (successful completion vs premature ending).
//
// UK Regulatory Framework:
// Children and Families Act 2014 s98 (Staying Put duty),
// Children and Social Work Act 2017 (Staying Close duty),
// DfE Staying Put guidance 2021,
// CHR 2015 Reg 5 (independence preparation — engaging with education,
// training or employment),
// Leaving Care Act 2000 (pathway planning),
// Working Together to Safeguard Children 2023.
//
// SCCIF: Experiences and progress — "Young people are supported beyond 18.
// Staying Put and Staying Close arrangements are planned early, well-funded,
// and enable young people to maintain stability and progress their
// independence skills at their own pace."
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const ARRANGEMENT_TYPES = [
  "Staying Put",
  "Staying Close",
] as const;
export type ArrangementType = (typeof ARRANGEMENT_TYPES)[number];

export const PREVIOUS_PLACEMENT_TYPES = [
  "Foster Care",
  "Residential",
  "Semi-Independent",
  "Supported Lodgings",
  "Other",
] as const;
export type PreviousPlacementType = (typeof PREVIOUS_PLACEMENT_TYPES)[number];

export const SUPPORT_LEVELS = [
  "Intensive",
  "Regular",
  "Light Touch",
  "Crisis Only",
] as const;
export type SupportLevel = (typeof SUPPORT_LEVELS)[number];

export const FINANCIAL_ARRANGEMENTS = [
  "Housing Benefit",
  "Local Authority Funded",
  "Shared Funding",
  "Self-Funded",
  "Mixed",
] as const;
export type FinancialArrangement = (typeof FINANCIAL_ARRANGEMENTS)[number];

export const EDUCATION_TRAINING_STATUSES = [
  "In Education",
  "In Training",
  "In Employment",
  "NEET",
  "Volunteering",
  "Other",
] as const;
export type EducationTrainingStatus = (typeof EDUCATION_TRAINING_STATUSES)[number];

export const INDEPENDENT_LIVING_SKILLS_PROGRESS = [
  "Emerging",
  "Developing",
  "Competent",
  "Independent",
] as const;
export type IndependentLivingSkillsProgress = (typeof INDEPENDENT_LIVING_SKILLS_PROGRESS)[number];

export const REVIEW_FREQUENCIES = [
  "Monthly",
  "6-Weekly",
  "Quarterly",
  "As Needed",
] as const;
export type ReviewFrequency = (typeof REVIEW_FREQUENCIES)[number];

export const STATUSES = [
  "Active",
  "Extended",
  "Ended Successfully",
  "Ended Prematurely",
  "Transitioned",
] as const;
export type Status = (typeof STATUSES)[number];

// -- Label maps ---------------------------------------------------------------

export const ARRANGEMENT_TYPE_LABELS: { type: ArrangementType; label: string }[] = [
  { type: "Staying Put", label: "Staying Put (CFA 2014 s98)" },
  { type: "Staying Close", label: "Staying Close (CSW Act 2017)" },
];

export const PREVIOUS_PLACEMENT_TYPE_LABELS: { type: PreviousPlacementType; label: string }[] = [
  { type: "Foster Care", label: "Foster Care" },
  { type: "Residential", label: "Residential Children's Home" },
  { type: "Semi-Independent", label: "Semi-Independent Living" },
  { type: "Supported Lodgings", label: "Supported Lodgings" },
  { type: "Other", label: "Other Placement" },
];

export const SUPPORT_LEVEL_LABELS: { level: SupportLevel; label: string }[] = [
  { level: "Intensive", label: "Intensive (daily contact)" },
  { level: "Regular", label: "Regular (weekly contact)" },
  { level: "Light Touch", label: "Light Touch (fortnightly+)" },
  { level: "Crisis Only", label: "Crisis Only (on request)" },
];

export const FINANCIAL_ARRANGEMENT_LABELS: { arrangement: FinancialArrangement; label: string }[] = [
  { arrangement: "Housing Benefit", label: "Housing Benefit" },
  { arrangement: "Local Authority Funded", label: "Local Authority Funded" },
  { arrangement: "Shared Funding", label: "Shared Funding (LA + HB)" },
  { arrangement: "Self-Funded", label: "Self-Funded" },
  { arrangement: "Mixed", label: "Mixed Funding Sources" },
];

export const EDUCATION_TRAINING_STATUS_LABELS: { status: EducationTrainingStatus; label: string }[] = [
  { status: "In Education", label: "In Education" },
  { status: "In Training", label: "In Training / Apprenticeship" },
  { status: "In Employment", label: "In Employment" },
  { status: "NEET", label: "NEET (Not in Education, Employment or Training)" },
  { status: "Volunteering", label: "Volunteering" },
  { status: "Other", label: "Other" },
];

export const INDEPENDENT_LIVING_SKILLS_LABELS: { progress: IndependentLivingSkillsProgress; label: string }[] = [
  { progress: "Emerging", label: "Emerging (needs significant support)" },
  { progress: "Developing", label: "Developing (gaining confidence)" },
  { progress: "Competent", label: "Competent (manages with minimal support)" },
  { progress: "Independent", label: "Independent (self-managing)" },
];

export const REVIEW_FREQUENCY_LABELS: { frequency: ReviewFrequency; label: string }[] = [
  { frequency: "Monthly", label: "Monthly" },
  { frequency: "6-Weekly", label: "6-Weekly" },
  { frequency: "Quarterly", label: "Quarterly" },
  { frequency: "As Needed", label: "As Needed" },
];

export const STATUS_LABELS: { status: Status; label: string }[] = [
  { status: "Active", label: "Active" },
  { status: "Extended", label: "Extended" },
  { status: "Ended Successfully", label: "Ended Successfully" },
  { status: "Ended Prematurely", label: "Ended Prematurely" },
  { status: "Transitioned", label: "Transitioned to Independent Living" },
];

// -- Row type -----------------------------------------------------------------

export interface StayingArrangementsRow {
  id: string;
  home_id: string;
  young_person_name: string;
  arrangement_type: ArrangementType;
  start_date: string;
  planned_end_date: string | null;
  actual_end_date: string | null;
  previous_placement_type: PreviousPlacementType;
  current_accommodation: string;
  support_level: SupportLevel;
  personal_adviser_name: string;
  pathway_plan_in_place: boolean;
  pathway_plan_review_date: string | null;
  financial_arrangement: FinancialArrangement;
  weekly_support_hours: number | null;
  education_training_status: EducationTrainingStatus;
  health_needs_met: boolean;
  mental_health_support: boolean;
  independent_living_skills_progress: IndependentLivingSkillsProgress;
  social_network_maintained: boolean;
  young_person_satisfied: boolean;
  regular_contact_maintained: boolean;
  review_frequency: ReviewFrequency;
  last_review_date: string | null;
  risk_of_breakdown: boolean;
  early_termination_risk: string | null;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateStayingArrangement(input: {
  youngPersonName?: string;
  arrangementType?: string;
  startDate?: string;
  plannedEndDate?: string | null;
  actualEndDate?: string | null;
  previousPlacementType?: string;
  currentAccommodation?: string;
  supportLevel?: string;
  personalAdviserName?: string;
  financialArrangement?: string;
  weeklySupportHours?: number | null;
  educationTrainingStatus?: string;
  independentLivingSkillsProgress?: string;
  reviewFrequency?: string;
  status?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.youngPersonName || input.youngPersonName.trim().length === 0) {
    errors.push("Young person name is required");
  }
  if (!input.arrangementType || !(ARRANGEMENT_TYPES as readonly string[]).includes(input.arrangementType)) {
    errors.push(`Arrangement type must be one of: ${ARRANGEMENT_TYPES.join(", ")}`);
  }
  if (!input.startDate) {
    errors.push("Start date is required");
  } else {
    const dateObj = new Date(input.startDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Start date must be a valid date");
    }
  }

  // Business rule: planned end date must be after start date
  if (input.startDate && input.plannedEndDate) {
    const start = new Date(input.startDate);
    const end = new Date(input.plannedEndDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
      errors.push("Planned end date must be after the start date");
    }
  }

  // Business rule: actual end date must be after start date
  if (input.startDate && input.actualEndDate) {
    const start = new Date(input.startDate);
    const actual = new Date(input.actualEndDate);
    if (!isNaN(start.getTime()) && !isNaN(actual.getTime()) && actual <= start) {
      errors.push("Actual end date must be after the start date");
    }
  }

  if (!input.previousPlacementType || !(PREVIOUS_PLACEMENT_TYPES as readonly string[]).includes(input.previousPlacementType)) {
    errors.push(`Previous placement type must be one of: ${PREVIOUS_PLACEMENT_TYPES.join(", ")}`);
  }
  if (!input.currentAccommodation || input.currentAccommodation.trim().length === 0) {
    errors.push("Current accommodation description is required");
  }
  if (!input.supportLevel || !(SUPPORT_LEVELS as readonly string[]).includes(input.supportLevel)) {
    errors.push(`Support level must be one of: ${SUPPORT_LEVELS.join(", ")}`);
  }
  if (!input.personalAdviserName || input.personalAdviserName.trim().length === 0) {
    errors.push("Personal adviser name is required — Leaving Care Act 2000 requires all care leavers to have an allocated personal adviser");
  }
  if (!input.financialArrangement || !(FINANCIAL_ARRANGEMENTS as readonly string[]).includes(input.financialArrangement)) {
    errors.push(`Financial arrangement must be one of: ${FINANCIAL_ARRANGEMENTS.join(", ")}`);
  }

  // Business rule: weekly support hours must be reasonable if provided
  if (input.weeklySupportHours !== undefined && input.weeklySupportHours !== null) {
    if (input.weeklySupportHours < 0) {
      errors.push("Weekly support hours cannot be negative");
    } else if (input.weeklySupportHours > 168) {
      errors.push("Weekly support hours cannot exceed 168 (total hours in a week)");
    }
  }

  if (!input.educationTrainingStatus || !(EDUCATION_TRAINING_STATUSES as readonly string[]).includes(input.educationTrainingStatus)) {
    errors.push(`Education/training status must be one of: ${EDUCATION_TRAINING_STATUSES.join(", ")}`);
  }
  if (input.independentLivingSkillsProgress && !(INDEPENDENT_LIVING_SKILLS_PROGRESS as readonly string[]).includes(input.independentLivingSkillsProgress)) {
    errors.push(`Independent living skills progress must be one of: ${INDEPENDENT_LIVING_SKILLS_PROGRESS.join(", ")}`);
  }
  if (input.reviewFrequency && !(REVIEW_FREQUENCIES as readonly string[]).includes(input.reviewFrequency)) {
    errors.push(`Review frequency must be one of: ${REVIEW_FREQUENCIES.join(", ")}`);
  }
  if (input.status && !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  // Business rule: Staying Put is specifically for former foster placements per CFA 2014 s98
  if (input.arrangementType === "Staying Put" && input.previousPlacementType && input.previousPlacementType !== "Foster Care") {
    errors.push("Staying Put arrangements are specifically for young people remaining with their former foster carers per CFA 2014 s98 — consider Staying Close for other placement types");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: StayingArrangementsRow[],
): {
  total_arrangements: number;
  by_arrangement_type: Record<string, number>;
  by_support_level: Record<string, number>;
  by_education_status: Record<string, number>;
  by_financial_arrangement: Record<string, number>;
  by_independent_living_skills: Record<string, number>;
  by_status: Record<string, number>;
  pathway_plan_rate: number;
  satisfaction_rate: number;
  breakdown_risk_count: number;
  neet_count: number;
  successful_completion_rate: number;
  average_duration_days: number;
  active_arrangements: number;
  health_needs_met_rate: number;
  mental_health_support_rate: number;
  social_network_maintained_rate: number;
  regular_contact_rate: number;
  overdue_pathway_reviews: number;
  unique_young_people: number;
  extended_count: number;
} {
  const total = rows.length;

  const boolRate = (field: keyof StayingArrangementsRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  // Arrangement type breakdown
  const byArrangementType: Record<string, number> = {};
  for (const at of ARRANGEMENT_TYPES) byArrangementType[at] = 0;
  for (const r of rows) byArrangementType[r.arrangement_type] = (byArrangementType[r.arrangement_type] || 0) + 1;

  // Support level breakdown
  const bySupportLevel: Record<string, number> = {};
  for (const sl of SUPPORT_LEVELS) bySupportLevel[sl] = 0;
  for (const r of rows) bySupportLevel[r.support_level] = (bySupportLevel[r.support_level] || 0) + 1;

  // Education status breakdown
  const byEducationStatus: Record<string, number> = {};
  for (const es of EDUCATION_TRAINING_STATUSES) byEducationStatus[es] = 0;
  for (const r of rows) byEducationStatus[r.education_training_status] = (byEducationStatus[r.education_training_status] || 0) + 1;

  // Financial arrangement breakdown
  const byFinancialArrangement: Record<string, number> = {};
  for (const fa of FINANCIAL_ARRANGEMENTS) byFinancialArrangement[fa] = 0;
  for (const r of rows) byFinancialArrangement[r.financial_arrangement] = (byFinancialArrangement[r.financial_arrangement] || 0) + 1;

  // Independent living skills breakdown
  const byIndependentLivingSkills: Record<string, number> = {};
  for (const il of INDEPENDENT_LIVING_SKILLS_PROGRESS) byIndependentLivingSkills[il] = 0;
  for (const r of rows) byIndependentLivingSkills[r.independent_living_skills_progress] = (byIndependentLivingSkills[r.independent_living_skills_progress] || 0) + 1;

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const s of STATUSES) byStatus[s] = 0;
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  // Breakdown risk count
  const breakdownRiskCount = rows.filter((r) => r.risk_of_breakdown && (r.status === "Active" || r.status === "Extended")).length;

  // NEET count
  const neetCount = rows.filter((r) => r.education_training_status === "NEET" && (r.status === "Active" || r.status === "Extended")).length;

  // Successful completion rate (of all ended arrangements)
  const ended = rows.filter((r) => r.status === "Ended Successfully" || r.status === "Ended Prematurely" || r.status === "Transitioned");
  const successfulEnded = rows.filter((r) => r.status === "Ended Successfully" || r.status === "Transitioned").length;
  const successfulCompletionRate = ended.length > 0 ? Math.round((successfulEnded / ended.length) * 1000) / 10 : 0;

  // Average duration in days (for arrangements with end dates)
  const durationsMs = rows
    .filter((r) => r.actual_end_date)
    .map((r) => {
      const start = new Date(r.start_date).getTime();
      const end = new Date(r.actual_end_date!).getTime();
      return end - start;
    })
    .filter((d) => d > 0);
  const avgDurationDays = durationsMs.length > 0
    ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length / (1000 * 60 * 60 * 24))
    : 0;

  // Active arrangements
  const activeArrangements = rows.filter((r) => r.status === "Active" || r.status === "Extended").length;

  // Overdue pathway plan reviews
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overduePathwayReviews = rows.filter((r) => {
    if (!r.pathway_plan_review_date) return false;
    const reviewDate = new Date(r.pathway_plan_review_date);
    return reviewDate < today && (r.status === "Active" || r.status === "Extended");
  }).length;

  // Unique young people
  const uniqueYoungPeople = new Set(rows.map((r) => r.young_person_name)).size;

  // Extended count
  const extendedCount = rows.filter((r) => r.status === "Extended").length;

  return {
    total_arrangements: total,
    by_arrangement_type: byArrangementType,
    by_support_level: bySupportLevel,
    by_education_status: byEducationStatus,
    by_financial_arrangement: byFinancialArrangement,
    by_independent_living_skills: byIndependentLivingSkills,
    by_status: byStatus,
    pathway_plan_rate: boolRate("pathway_plan_in_place"),
    satisfaction_rate: boolRate("young_person_satisfied"),
    breakdown_risk_count: breakdownRiskCount,
    neet_count: neetCount,
    successful_completion_rate: successfulCompletionRate,
    average_duration_days: avgDurationDays,
    active_arrangements: activeArrangements,
    health_needs_met_rate: boolRate("health_needs_met"),
    mental_health_support_rate: boolRate("mental_health_support"),
    social_network_maintained_rate: boolRate("social_network_maintained"),
    regular_contact_rate: boolRate("regular_contact_maintained"),
    overdue_pathway_reviews: overduePathwayReviews,
    unique_young_people: uniqueYoungPeople,
    extended_count: extendedCount,
  };
}

export function computeAlerts(
  rows: StayingArrangementsRow[],
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

  const active = rows.filter((r) => r.status === "Active" || r.status === "Extended");

  // Critical: Breakdown risk with no early termination risk notes
  for (const r of active) {
    if (r.risk_of_breakdown && (!r.early_termination_risk || r.early_termination_risk.trim().length === 0)) {
      alerts.push({
        type: "breakdown_risk_no_detail",
        severity: "critical",
        message: `${r.young_person_name}'s ${r.arrangement_type} arrangement is at risk of breakdown but no early termination risk factors have been documented — immediate review and support plan escalation required per DfE Staying Put guidance`,
        record_id: r.id,
      });
    }
  }

  // Critical: No pathway plan for active arrangement
  for (const r of active) {
    if (!r.pathway_plan_in_place) {
      alerts.push({
        type: "no_pathway_plan",
        severity: "critical",
        message: `${r.young_person_name} has an active ${r.arrangement_type} arrangement but no pathway plan in place — pathway plan is a statutory requirement under the Leaving Care Act 2000`,
        record_id: r.id,
      });
    }
  }

  // High: NEET status in active arrangement
  for (const r of active) {
    if (r.education_training_status === "NEET") {
      alerts.push({
        type: "neet_status",
        severity: "high",
        message: `${r.young_person_name} is NEET during their ${r.arrangement_type} arrangement — Reg 5 requires homes to support engagement with education, training, or employment. Review pathway plan and consider additional support`,
        record_id: r.id,
      });
    }
  }

  // High: Health needs not met
  for (const r of active) {
    if (!r.health_needs_met) {
      alerts.push({
        type: "health_needs_not_met",
        severity: "high",
        message: `${r.young_person_name}'s health needs are not being met in their ${r.arrangement_type} arrangement — review health provision and update pathway plan`,
        record_id: r.id,
      });
    }
  }

  // High: Breakdown risk identified
  for (const r of active) {
    if (r.risk_of_breakdown && r.early_termination_risk) {
      alerts.push({
        type: "breakdown_risk",
        severity: "high",
        message: `${r.young_person_name}'s ${r.arrangement_type} arrangement is at risk of breakdown: ${r.early_termination_risk}. Review support level and consider whether escalation to Intensive is needed`,
        record_id: r.id,
      });
    }
  }

  // High: No regular contact maintained
  for (const r of active) {
    if (!r.regular_contact_maintained) {
      alerts.push({
        type: "no_regular_contact",
        severity: "high",
        message: `Regular contact is not maintained with ${r.young_person_name} in their ${r.arrangement_type} arrangement — personal adviser must ensure consistent contact per Leaving Care Act 2000`,
        record_id: r.id,
      });
    }
  }

  // Medium: Young person not satisfied
  for (const r of active) {
    if (!r.young_person_satisfied) {
      alerts.push({
        type: "not_satisfied",
        severity: "medium",
        message: `${r.young_person_name} is not satisfied with their ${r.arrangement_type} arrangement — explore concerns and review whether the arrangement is meeting their needs`,
        record_id: r.id,
      });
    }
  }

  // Medium: Overdue pathway plan review
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of active) {
    if (r.pathway_plan_review_date) {
      const reviewDate = new Date(r.pathway_plan_review_date);
      if (reviewDate < today) {
        alerts.push({
          type: "overdue_pathway_review",
          severity: "medium",
          message: `Pathway plan review for ${r.young_person_name} was due on ${r.pathway_plan_review_date} and is now overdue — statutory pathway plan must be reviewed at least every 6 months`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: Social network not maintained
  for (const r of active) {
    if (!r.social_network_maintained) {
      alerts.push({
        type: "social_network_risk",
        severity: "medium",
        message: `${r.young_person_name}'s social network is not being maintained during their ${r.arrangement_type} arrangement — social isolation increases risk of premature ending`,
        record_id: r.id,
      });
    }
  }

  // Medium: Emerging independent living skills for long-running arrangement
  for (const r of active) {
    if (r.independent_living_skills_progress === "Emerging") {
      const start = new Date(r.start_date);
      const monthsActive = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsActive > 6) {
        alerts.push({
          type: "skills_not_progressing",
          severity: "medium",
          message: `${r.young_person_name} has been in their ${r.arrangement_type} arrangement for ${Math.round(monthsActive)} months but independent living skills remain at Emerging level — review independence preparation plan per Reg 5`,
          record_id: r.id,
        });
      }
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: StayingArrangementsRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_arrangement_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_arrangements} Staying Put/Close ${metrics.total_arrangements === 1 ? "arrangement" : "arrangements"} ` +
      `for ${metrics.unique_young_people} ${metrics.unique_young_people === 1 ? "young person" : "young people"}. ` +
      `Types: ${typeBreakdown || "none recorded"}. ` +
      `Active: ${metrics.active_arrangements}. Extended: ${metrics.extended_count}. ` +
      `Pathway plan rate: ${metrics.pathway_plan_rate}%. ` +
      `Satisfaction rate: ${metrics.satisfaction_rate}%. ` +
      `Successful completion rate: ${metrics.successful_completion_rate}%. ` +
      `Average duration: ${metrics.average_duration_days} days.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority leaving care alerts active. ` +
        `Breakdown risk: ${metrics.breakdown_risk_count} ${metrics.breakdown_risk_count === 1 ? "arrangement" : "arrangements"}. ` +
        `NEET: ${metrics.neet_count}. ` +
        `Health needs met: ${metrics.health_needs_met_rate}%. ` +
        `Regular contact maintained: ${metrics.regular_contact_rate}%. ` +
        `${metrics.overdue_pathway_reviews} overdue pathway plan ${metrics.overdue_pathway_reviews === 1 ? "review" : "reviews"}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority leaving care alerts currently active. ` +
        `Mental health support rate: ${metrics.mental_health_support_rate}%. ` +
        `Social network maintained: ${metrics.social_network_maintained_rate}%. ` +
        `Continue supporting smooth transitions and independence skills development per DfE guidance.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.neet_count > 0) {
    const neetRate = metrics.active_arrangements > 0
      ? Math.round((metrics.neet_count / metrics.active_arrangements) * 100)
      : 0;
    insights.push(
      `[reflect] ${metrics.neet_count} young ${metrics.neet_count === 1 ? "person is" : "people are"} currently NEET ` +
        `(${neetRate}% of active arrangements). What targeted support is being offered to help ` +
        `these young people access education, training, or employment? Are personal advisers ` +
        `working with local services such as Connexions, DWP, and training providers, ` +
        `and is the pathway plan reflecting realistic steps towards engagement?`,
    );
  } else if (metrics.breakdown_risk_count > 0) {
    insights.push(
      `[reflect] ${metrics.breakdown_risk_count} ${metrics.breakdown_risk_count === 1 ? "arrangement is" : "arrangements are"} ` +
        `at risk of breakdown. Are early warning signs being identified and acted upon ` +
        `promptly? Is the support level appropriate, and have mediation or conflict resolution ` +
        `strategies been considered? DfE Staying Put guidance emphasises proactive support ` +
        `to prevent premature endings and maintain placement stability.`,
    );
  } else {
    insights.push(
      `[reflect] Are Staying Put and Staying Close discussions happening early enough in the ` +
        `care planning process? Best practice suggests planning should begin at least 12 months ` +
        `before a young person's 18th birthday to ensure seamless transition and continuity. ` +
        `Are all eligible young people being informed of their rights under CFA 2014 and CSW Act 2017?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listStayingArrangements(
  homeId: string,
  filters?: {
    arrangementType?: ArrangementType;
    supportLevel?: SupportLevel;
    educationTrainingStatus?: EducationTrainingStatus;
    status?: Status;
    limit?: number;
  },
): Promise<ServiceResult<StayingArrangementsRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_staying_arrangements") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.arrangementType) q = q.eq("arrangement_type", filters.arrangementType);
  if (filters?.supportLevel) q = q.eq("support_level", filters.supportLevel);
  if (filters?.educationTrainingStatus) q = q.eq("education_training_status", filters.educationTrainingStatus);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("start_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getStayingArrangement(
  id: string,
): Promise<ServiceResult<StayingArrangementsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_staying_arrangements") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createStayingArrangement(input: {
  homeId: string;
  youngPersonName: string;
  arrangementType: ArrangementType;
  startDate: string;
  plannedEndDate?: string | null;
  actualEndDate?: string | null;
  previousPlacementType: PreviousPlacementType;
  currentAccommodation: string;
  supportLevel: SupportLevel;
  personalAdviserName: string;
  pathwayPlanInPlace?: boolean;
  pathwayPlanReviewDate?: string | null;
  financialArrangement: FinancialArrangement;
  weeklySupportHours?: number | null;
  educationTrainingStatus: EducationTrainingStatus;
  healthNeedsMet?: boolean;
  mentalHealthSupport?: boolean;
  independentLivingSkillsProgress?: IndependentLivingSkillsProgress;
  socialNetworkMaintained?: boolean;
  youngPersonSatisfied?: boolean;
  regularContactMaintained?: boolean;
  reviewFrequency?: ReviewFrequency;
  lastReviewDate?: string | null;
  riskOfBreakdown?: boolean;
  earlyTerminationRisk?: string | null;
  status?: Status;
  notes?: string | null;
}): Promise<ServiceResult<StayingArrangementsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateStayingArrangement({
    youngPersonName: input.youngPersonName,
    arrangementType: input.arrangementType,
    startDate: input.startDate,
    plannedEndDate: input.plannedEndDate,
    actualEndDate: input.actualEndDate,
    previousPlacementType: input.previousPlacementType,
    currentAccommodation: input.currentAccommodation,
    supportLevel: input.supportLevel,
    personalAdviserName: input.personalAdviserName,
    financialArrangement: input.financialArrangement,
    weeklySupportHours: input.weeklySupportHours,
    educationTrainingStatus: input.educationTrainingStatus,
    independentLivingSkillsProgress: input.independentLivingSkillsProgress,
    reviewFrequency: input.reviewFrequency,
    status: input.status,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_staying_arrangements") as SB)
    .insert({
      home_id: input.homeId,
      young_person_name: input.youngPersonName,
      arrangement_type: input.arrangementType,
      start_date: input.startDate,
      planned_end_date: input.plannedEndDate ?? null,
      actual_end_date: input.actualEndDate ?? null,
      previous_placement_type: input.previousPlacementType,
      current_accommodation: input.currentAccommodation,
      support_level: input.supportLevel,
      personal_adviser_name: input.personalAdviserName,
      pathway_plan_in_place: input.pathwayPlanInPlace ?? false,
      pathway_plan_review_date: input.pathwayPlanReviewDate ?? null,
      financial_arrangement: input.financialArrangement,
      weekly_support_hours: input.weeklySupportHours ?? null,
      education_training_status: input.educationTrainingStatus,
      health_needs_met: input.healthNeedsMet ?? true,
      mental_health_support: input.mentalHealthSupport ?? false,
      independent_living_skills_progress: input.independentLivingSkillsProgress ?? "Developing",
      social_network_maintained: input.socialNetworkMaintained ?? true,
      young_person_satisfied: input.youngPersonSatisfied ?? true,
      regular_contact_maintained: input.regularContactMaintained ?? true,
      review_frequency: input.reviewFrequency ?? "Monthly",
      last_review_date: input.lastReviewDate ?? null,
      risk_of_breakdown: input.riskOfBreakdown ?? false,
      early_termination_risk: input.earlyTerminationRisk ?? null,
      status: input.status ?? "Active",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateStayingArrangement(
  id: string,
  updates: Partial<{
    youngPersonName: string;
    arrangementType: ArrangementType;
    startDate: string;
    plannedEndDate: string | null;
    actualEndDate: string | null;
    previousPlacementType: PreviousPlacementType;
    currentAccommodation: string;
    supportLevel: SupportLevel;
    personalAdviserName: string;
    pathwayPlanInPlace: boolean;
    pathwayPlanReviewDate: string | null;
    financialArrangement: FinancialArrangement;
    weeklySupportHours: number | null;
    educationTrainingStatus: EducationTrainingStatus;
    healthNeedsMet: boolean;
    mentalHealthSupport: boolean;
    independentLivingSkillsProgress: IndependentLivingSkillsProgress;
    socialNetworkMaintained: boolean;
    youngPersonSatisfied: boolean;
    regularContactMaintained: boolean;
    reviewFrequency: ReviewFrequency;
    lastReviewDate: string | null;
    riskOfBreakdown: boolean;
    earlyTerminationRisk: string | null;
    status: Status;
    notes: string | null;
  }>,
): Promise<ServiceResult<StayingArrangementsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.youngPersonName !== undefined) mapped.young_person_name = updates.youngPersonName;
  if (updates.arrangementType !== undefined) mapped.arrangement_type = updates.arrangementType;
  if (updates.startDate !== undefined) mapped.start_date = updates.startDate;
  if (updates.plannedEndDate !== undefined) mapped.planned_end_date = updates.plannedEndDate;
  if (updates.actualEndDate !== undefined) mapped.actual_end_date = updates.actualEndDate;
  if (updates.previousPlacementType !== undefined) mapped.previous_placement_type = updates.previousPlacementType;
  if (updates.currentAccommodation !== undefined) mapped.current_accommodation = updates.currentAccommodation;
  if (updates.supportLevel !== undefined) mapped.support_level = updates.supportLevel;
  if (updates.personalAdviserName !== undefined) mapped.personal_adviser_name = updates.personalAdviserName;
  if (updates.pathwayPlanInPlace !== undefined) mapped.pathway_plan_in_place = updates.pathwayPlanInPlace;
  if (updates.pathwayPlanReviewDate !== undefined) mapped.pathway_plan_review_date = updates.pathwayPlanReviewDate;
  if (updates.financialArrangement !== undefined) mapped.financial_arrangement = updates.financialArrangement;
  if (updates.weeklySupportHours !== undefined) mapped.weekly_support_hours = updates.weeklySupportHours;
  if (updates.educationTrainingStatus !== undefined) mapped.education_training_status = updates.educationTrainingStatus;
  if (updates.healthNeedsMet !== undefined) mapped.health_needs_met = updates.healthNeedsMet;
  if (updates.mentalHealthSupport !== undefined) mapped.mental_health_support = updates.mentalHealthSupport;
  if (updates.independentLivingSkillsProgress !== undefined) mapped.independent_living_skills_progress = updates.independentLivingSkillsProgress;
  if (updates.socialNetworkMaintained !== undefined) mapped.social_network_maintained = updates.socialNetworkMaintained;
  if (updates.youngPersonSatisfied !== undefined) mapped.young_person_satisfied = updates.youngPersonSatisfied;
  if (updates.regularContactMaintained !== undefined) mapped.regular_contact_maintained = updates.regularContactMaintained;
  if (updates.reviewFrequency !== undefined) mapped.review_frequency = updates.reviewFrequency;
  if (updates.lastReviewDate !== undefined) mapped.last_review_date = updates.lastReviewDate;
  if (updates.riskOfBreakdown !== undefined) mapped.risk_of_breakdown = updates.riskOfBreakdown;
  if (updates.earlyTerminationRisk !== undefined) mapped.early_termination_risk = updates.earlyTerminationRisk;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_staying_arrangements") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteStayingArrangement(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_staying_arrangements") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
