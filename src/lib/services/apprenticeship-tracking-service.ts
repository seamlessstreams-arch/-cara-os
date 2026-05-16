// ==============================================================================
// CORNERSTONE -- APPRENTICESHIP & VOCATIONAL TRAINING TRACKING SERVICE
// Tracks apprenticeship exploration, applications, enrolment, progress reviews,
// employer liaison, bursary applications, qualification achievements, pastoral
// support, and drop-out risk for looked-after young people.
//
// Covers: Record type and apprenticeship level tracking, sector analysis, bursary
// application and receipt monitoring, engagement assessment, personal adviser
// involvement, pathway plan linkage, social worker notification, at-risk
// identification, and support plan tracking.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (education/development),
// Apprenticeships, Skills, Children and Learning Act 2009,
// DfE apprenticeship funding for care leavers (bursary),
// SCCIF: Experiences & progress — "The home supports vocational aspirations."
// Gatsby Benchmark 6 (experiences of workplaces).
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "Exploration Session",
  "Application Support",
  "CV/Cover Letter Help",
  "Interview Preparation",
  "Application Submitted",
  "Offer Received",
  "Enrolment",
  "Progress Review",
  "Employer Liaison",
  "Pastoral Support",
  "Bursary Application",
  "Qualification Achieved",
  "Workplace Visit",
  "Mentor Meeting",
  "Issue/Concern",
  "Completion",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const APPRENTICESHIP_LEVELS = [
  "Intermediate — Level 2",
  "Advanced — Level 3",
  "Higher — Level 4/5",
  "Degree — Level 6/7",
  "T-Level",
  "Traineeship",
  "Supported Internship",
  "Work Trial",
  "Not Applicable",
] as const;
export type ApprenticeshipLevel = (typeof APPRENTICESHIP_LEVELS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const APPLICATION_STAGE_TYPES: RecordType[] = [
  "Application Support",
  "CV/Cover Letter Help",
  "Interview Preparation",
  "Application Submitted",
  "Offer Received",
];

export const ACTIVE_PROGRAMME_TYPES: RecordType[] = [
  "Enrolment",
  "Progress Review",
  "Employer Liaison",
  "Pastoral Support",
  "Qualification Achieved",
  "Completion",
];

export const SUPPORT_TYPES: RecordType[] = [
  "Pastoral Support",
  "Mentor Meeting",
  "Issue/Concern",
  "Bursary Application",
];

export const MILESTONE_TYPES: RecordType[] = [
  "Application Submitted",
  "Offer Received",
  "Enrolment",
  "Qualification Achieved",
  "Completion",
];

export const FORMAL_APPRENTICESHIP_LEVELS: ApprenticeshipLevel[] = [
  "Intermediate — Level 2",
  "Advanced — Level 3",
  "Higher — Level 4/5",
  "Degree — Level 6/7",
];

export const ALTERNATIVE_PATHWAY_LEVELS: ApprenticeshipLevel[] = [
  "T-Level",
  "Traineeship",
  "Supported Internship",
  "Work Trial",
];

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "Exploration Session", label: "Exploration Session" },
  { type: "Application Support", label: "Application Support" },
  { type: "CV/Cover Letter Help", label: "CV/Cover Letter Help" },
  { type: "Interview Preparation", label: "Interview Preparation" },
  { type: "Application Submitted", label: "Application Submitted" },
  { type: "Offer Received", label: "Offer Received" },
  { type: "Enrolment", label: "Enrolment" },
  { type: "Progress Review", label: "Progress Review" },
  { type: "Employer Liaison", label: "Employer Liaison" },
  { type: "Pastoral Support", label: "Pastoral Support" },
  { type: "Bursary Application", label: "Bursary Application" },
  { type: "Qualification Achieved", label: "Qualification Achieved" },
  { type: "Workplace Visit", label: "Workplace Visit" },
  { type: "Mentor Meeting", label: "Mentor Meeting" },
  { type: "Issue/Concern", label: "Issue/Concern" },
  { type: "Completion", label: "Completion" },
];

export const APPRENTICESHIP_LEVEL_LABELS: { level: ApprenticeshipLevel; label: string }[] = [
  { level: "Intermediate — Level 2", label: "Intermediate (Level 2)" },
  { level: "Advanced — Level 3", label: "Advanced (Level 3)" },
  { level: "Higher — Level 4/5", label: "Higher (Level 4/5)" },
  { level: "Degree — Level 6/7", label: "Degree (Level 6/7)" },
  { level: "T-Level", label: "T-Level" },
  { level: "Traineeship", label: "Traineeship" },
  { level: "Supported Internship", label: "Supported Internship" },
  { level: "Work Trial", label: "Work Trial" },
  { level: "Not Applicable", label: "Not Applicable" },
];

// -- Row type -----------------------------------------------------------------

export interface ApprenticeshipTrackingRow {
  id: string;
  home_id: string;
  young_person_name: string;
  record_date: string;
  supporting_staff: string;
  record_type: RecordType;
  apprenticeship_level: ApprenticeshipLevel | null;
  sector: string | null;
  employer_name: string | null;
  training_provider: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  bursary_applied: boolean;
  bursary_received: boolean;
  young_person_engaged: boolean;
  personal_adviser_involved: boolean;
  pathway_plan_linked: boolean;
  social_worker_informed: boolean;
  at_risk_of_dropping_out: boolean;
  support_plan_in_place: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateApprenticeshipTracking(input: {
  youngPersonName?: string;
  recordDate?: string;
  supportingStaff?: string;
  recordType?: string;
  apprenticeshipLevel?: string | null;
  bursaryApplied?: boolean;
  bursaryReceived?: boolean;
  atRiskOfDroppingOut?: boolean;
  supportPlanInPlace?: boolean | null;
  youngPersonEngaged?: boolean;
  personalAdviserInvolved?: boolean;
  pathwayPlanLinked?: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.youngPersonName || input.youngPersonName.trim().length === 0) {
    errors.push("Young person name is required");
  }

  if (!input.recordDate) {
    errors.push("Record date is required");
  } else {
    const dateObj = new Date(input.recordDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Record date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Record date cannot be in the future");
    }
  }

  if (!input.supportingStaff || input.supportingStaff.trim().length === 0) {
    errors.push("Supporting staff name is required");
  }

  if (!input.recordType || !(RECORD_TYPES as readonly string[]).includes(input.recordType)) {
    errors.push(`Record type must be one of: ${RECORD_TYPES.join(", ")}`);
  }

  if (
    input.apprenticeshipLevel !== null &&
    input.apprenticeshipLevel !== undefined &&
    !(APPRENTICESHIP_LEVELS as readonly string[]).includes(input.apprenticeshipLevel)
  ) {
    errors.push(`Apprenticeship level must be one of: ${APPRENTICESHIP_LEVELS.join(", ")}`);
  }

  // Business rule: If bursary received, must have been applied for
  if (input.bursaryReceived === true && input.bursaryApplied !== true) {
    errors.push(
      "Bursary cannot be marked as received without first being applied for — DfE care leaver bursary requires a formal application process",
    );
  }

  // Business rule: At-risk young people should have a support plan
  if (input.atRiskOfDroppingOut === true && input.supportPlanInPlace === false) {
    errors.push(
      "Young person is at risk of dropping out but no support plan is in place — CHR 2015 Reg 5 requires the home to actively support education and training. An at-risk young person without a support plan represents a safeguarding gap in their vocational pathway",
    );
  }

  // Business rule: Active programme records should have PA involvement for care leavers
  if (
    input.recordType &&
    (ACTIVE_PROGRAMME_TYPES as string[]).includes(input.recordType) &&
    input.personalAdviserInvolved === false &&
    input.pathwayPlanLinked === false
  ) {
    // Advisory: PA involvement and pathway plan linkage are expected for active programmes
    // Not a hard error as some young people may not yet have a PA assigned
  }

  // Business rule: Milestone records should consider engagement
  if (
    input.recordType &&
    (MILESTONE_TYPES as string[]).includes(input.recordType) &&
    input.youngPersonEngaged === false
  ) {
    // Advisory: milestones achieved without engagement may indicate the young person
    // is being pushed rather than supported — worth noting but not blocking
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: ApprenticeshipTrackingRow[],
): {
  total_records: number;
  unique_young_people: number;
  by_record_type: Record<string, number>;
  by_apprenticeship_level: Record<string, number>;
  by_sector_top5: { sector: string; count: number }[];
  application_success_rate: number;
  completion_rate: number;
  bursary_application_rate: number;
  bursary_receipt_rate: number;
  at_risk_count: number;
  engagement_rate: number;
  personal_adviser_rate: number;
  pathway_plan_rate: number;
  social_worker_informed_rate: number;
  active_apprenticeships: number;
  average_duration_days: number;
  milestone_count: number;
  support_type_count: number;
  application_stage_count: number;
  formal_apprenticeship_count: number;
  alternative_pathway_count: number;
} {
  const total = rows.length;

  // Unique young people
  const uniqueYP = new Set(rows.map((r) => r.young_person_name.toLowerCase().trim()));

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows) byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Apprenticeship level breakdown
  const byLevel: Record<string, number> = {};
  for (const al of APPRENTICESHIP_LEVELS) byLevel[al] = 0;
  for (const r of rows) {
    if (r.apprenticeship_level) {
      byLevel[r.apprenticeship_level] = (byLevel[r.apprenticeship_level] || 0) + 1;
    }
  }

  // Sector breakdown — top 5
  const sectorMap: Record<string, number> = {};
  for (const r of rows) {
    if (r.sector && r.sector.trim().length > 0) {
      const key = r.sector.trim().toLowerCase();
      sectorMap[key] = (sectorMap[key] || 0) + 1;
    }
  }
  const bySectorTop5 = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sector, count]) => ({ sector, count }));

  // Application success rate: offers received / applications submitted
  const applicationsSubmitted = rows.filter((r) => r.record_type === "Application Submitted").length;
  const offersReceived = rows.filter((r) => r.record_type === "Offer Received").length;
  const applicationSuccessRate = applicationsSubmitted > 0
    ? Math.round((offersReceived / applicationsSubmitted) * 1000) / 10
    : 0;

  // Completion rate: completions / enrolments
  const enrolments = rows.filter((r) => r.record_type === "Enrolment").length;
  const completions = rows.filter((r) => r.record_type === "Completion").length;
  const completionRate = enrolments > 0
    ? Math.round((completions / enrolments) * 1000) / 10
    : 0;

  // Bursary rates
  const bursaryAppliedCount = rows.filter((r) => r.bursary_applied).length;
  const bursaryReceivedCount = rows.filter((r) => r.bursary_received).length;
  const bursaryApplicationRate = total > 0
    ? Math.round((bursaryAppliedCount / total) * 1000) / 10
    : 0;
  const bursaryReceiptRate = bursaryAppliedCount > 0
    ? Math.round((bursaryReceivedCount / bursaryAppliedCount) * 1000) / 10
    : 0;

  // At risk count
  const atRiskCount = rows.filter((r) => r.at_risk_of_dropping_out).length;

  // Engagement rate
  const engagementRate = total > 0
    ? Math.round((rows.filter((r) => r.young_person_engaged).length / total) * 1000) / 10
    : 0;

  // PA rate
  const paRate = total > 0
    ? Math.round((rows.filter((r) => r.personal_adviser_involved).length / total) * 1000) / 10
    : 0;

  // Pathway plan rate
  const pathwayRate = total > 0
    ? Math.round((rows.filter((r) => r.pathway_plan_linked).length / total) * 1000) / 10
    : 0;

  // Social worker informed rate
  const swRate = total > 0
    ? Math.round((rows.filter((r) => r.social_worker_informed).length / total) * 1000) / 10
    : 0;

  // Active apprenticeships: enrolments minus completions (rough proxy)
  const activeApprenticeships = Math.max(0, enrolments - completions);

  // Average duration in days (where start and expected end dates are available)
  const withDates = rows.filter((r) => r.start_date && r.expected_end_date);
  let avgDuration = 0;
  if (withDates.length > 0) {
    const totalDays = withDates.reduce((acc, r) => {
      const start = new Date(r.start_date!);
      const end = new Date(r.expected_end_date!);
      return acc + Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    avgDuration = Math.round(totalDays / withDates.length);
  }

  // Category counts
  const milestoneCount = rows.filter(
    (r) => (MILESTONE_TYPES as string[]).includes(r.record_type),
  ).length;

  const supportTypeCount = rows.filter(
    (r) => (SUPPORT_TYPES as string[]).includes(r.record_type),
  ).length;

  const applicationStageCount = rows.filter(
    (r) => (APPLICATION_STAGE_TYPES as string[]).includes(r.record_type),
  ).length;

  const formalCount = rows.filter(
    (r) =>
      r.apprenticeship_level !== null &&
      (FORMAL_APPRENTICESHIP_LEVELS as string[]).includes(r.apprenticeship_level),
  ).length;

  const alternativeCount = rows.filter(
    (r) =>
      r.apprenticeship_level !== null &&
      (ALTERNATIVE_PATHWAY_LEVELS as string[]).includes(r.apprenticeship_level),
  ).length;

  return {
    total_records: total,
    unique_young_people: uniqueYP.size,
    by_record_type: byRecordType,
    by_apprenticeship_level: byLevel,
    by_sector_top5: bySectorTop5,
    application_success_rate: applicationSuccessRate,
    completion_rate: completionRate,
    bursary_application_rate: bursaryApplicationRate,
    bursary_receipt_rate: bursaryReceiptRate,
    at_risk_count: atRiskCount,
    engagement_rate: engagementRate,
    personal_adviser_rate: paRate,
    pathway_plan_rate: pathwayRate,
    social_worker_informed_rate: swRate,
    active_apprenticeships: activeApprenticeships,
    average_duration_days: avgDuration,
    milestone_count: milestoneCount,
    support_type_count: supportTypeCount,
    application_stage_count: applicationStageCount,
    formal_apprenticeship_count: formalCount,
    alternative_pathway_count: alternativeCount,
  };
}

export function computeAlerts(
  rows: ApprenticeshipTrackingRow[],
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

  // Critical: At risk of dropping out without support plan
  for (const r of rows) {
    if (r.at_risk_of_dropping_out && r.support_plan_in_place !== true) {
      alerts.push({
        type: "at_risk_no_support_plan",
        severity: "critical",
        message: `${r.young_person_name} is at risk of dropping out of their apprenticeship/training (${r.record_date}) but no support plan is in place — CHR 2015 Reg 5 requires the home to actively support each child's education and training. Care leavers who drop out of apprenticeships without support are significantly more likely to become NEET. Immediate action is needed: convene a review with the young person, employer, training provider, and personal adviser to develop a retention plan`,
        record_id: r.id,
      });
    }
  }

  // Critical: Repeated disengagement by same young person
  const ypDisengageMap = new Map<string, ApprenticeshipTrackingRow[]>();
  for (const r of rows) {
    if (!r.young_person_engaged) {
      const key = r.young_person_name.toLowerCase().trim();
      if (!ypDisengageMap.has(key)) ypDisengageMap.set(key, []);
      ypDisengageMap.get(key)!.push(r);
    }
  }
  for (const [, ypRows] of ypDisengageMap) {
    if (ypRows.length >= 3) {
      alerts.push({
        type: "repeated_disengagement",
        severity: "critical",
        message: `${ypRows[0].young_person_name} has been disengaged across ${ypRows.length} apprenticeship/vocational records — persistent disengagement from vocational pathways is a significant concern for looked-after young people. DfE research shows care leavers are disproportionately represented in NEET statistics. Is the vocational pathway genuinely suited to this young person's interests and abilities? Are barriers (transport, anxiety, past negative experiences of work/education) being addressed? CHR 2015 Reg 5 requires active support, not just provision`,
      });
    }
  }

  // Critical: Bursary received without application
  for (const r of rows) {
    if (r.bursary_received && !r.bursary_applied) {
      alerts.push({
        type: "bursary_received_no_application",
        severity: "critical",
        message: `${r.young_person_name} has bursary marked as received without an application recorded (${r.record_date}) — this is a data integrity concern. DfE care leaver bursary funding requires formal application. Verify the record and ensure proper audit trail for financial support`,
        record_id: r.id,
      });
    }
  }

  // High: Low pathway plan linkage across active programmes
  const activeProgrammeRows = rows.filter(
    (r) => (ACTIVE_PROGRAMME_TYPES as string[]).includes(r.record_type),
  );
  const pathwayLinked = activeProgrammeRows.filter((r) => r.pathway_plan_linked).length;
  if (activeProgrammeRows.length >= 3 && pathwayLinked / activeProgrammeRows.length < 0.3) {
    alerts.push({
      type: "low_pathway_plan_linkage",
      severity: "high",
      message: `Only ${Math.round((pathwayLinked / activeProgrammeRows.length) * 100)}% of active programme records are linked to pathway plans — the pathway plan is the statutory planning document for care leavers aged 16+ and should be the central coordination point for all vocational support. Without pathway plan linkage, apprenticeship support risks being disconnected from the young person's wider transition planning. SCCIF inspectors expect to see vocational aspirations reflected in pathway plans`,
    });
  }

  // High: Low personal adviser involvement
  const paInvolved = rows.filter((r) => r.personal_adviser_involved).length;
  if (rows.length >= 5 && paInvolved / rows.length < 0.25) {
    alerts.push({
      type: "low_pa_involvement",
      severity: "high",
      message: `Personal advisers involved in only ${Math.round((paInvolved / rows.length) * 100)}% of apprenticeship records — the Children (Leaving Care) Act 2000 provides for personal adviser support for eligible and relevant care leavers. PAs play a crucial role in coordinating vocational support, advocating with employers, and ensuring the young person has consistent adult support throughout their apprenticeship journey`,
    });
  }

  // High: Multiple at-risk young people
  const atRiskYP = new Set(
    rows.filter((r) => r.at_risk_of_dropping_out).map((r) => r.young_person_name.toLowerCase().trim()),
  );
  if (atRiskYP.size >= 3) {
    alerts.push({
      type: "multiple_at_risk",
      severity: "high",
      message: `${atRiskYP.size} young people are currently at risk of dropping out of apprenticeships/training — this may indicate systemic issues with the home's vocational support arrangements. Are young people being adequately prepared before starting? Is ongoing pastoral support sufficient? Are employer expectations being managed? CHR 2015 Reg 5 requires the home to demonstrate it actively promotes and supports education and training`,
    });
  }

  // High: No exploration or preparation before enrolment
  const ypWithEnrolment = new Set(
    rows.filter((r) => r.record_type === "Enrolment").map((r) => r.young_person_name.toLowerCase().trim()),
  );
  for (const ypName of ypWithEnrolment) {
    const ypRecords = rows.filter((r) => r.young_person_name.toLowerCase().trim() === ypName);
    const hasExploration = ypRecords.some(
      (r) => r.record_type === "Exploration Session" || r.record_type === "Workplace Visit",
    );
    if (!hasExploration) {
      const displayName = ypRecords[0].young_person_name;
      alerts.push({
        type: "enrolment_without_exploration",
        severity: "high",
        message: `${displayName} was enrolled in an apprenticeship without any recorded exploration sessions or workplace visits — Gatsby Benchmark 6 emphasises the importance of meaningful experiences of workplaces before making career decisions. For looked-after young people, who often have limited exposure to the world of work, exploration and taster experiences are essential to making informed choices and reducing early drop-out`,
      });
    }
  }

  // High: Issue/Concern without social worker informed
  for (const r of rows) {
    if (r.record_type === "Issue/Concern" && !r.social_worker_informed) {
      alerts.push({
        type: "issue_sw_not_informed",
        severity: "high",
        message: `Issue/Concern recorded for ${r.young_person_name} on ${r.record_date} but social worker not informed — the allocated social worker should be kept informed of significant concerns about a looked-after child's education or training. Vocational difficulties can be symptomatic of wider wellbeing issues that the social worker needs to know about`,
        record_id: r.id,
      });
    }
  }

  // Medium: Low engagement rate overall
  const engagedCount = rows.filter((r) => r.young_person_engaged).length;
  if (rows.length >= 5 && engagedCount / rows.length < 0.5) {
    alerts.push({
      type: "low_engagement_rate",
      severity: "medium",
      message: `Young person engagement rate is only ${Math.round((engagedCount / rows.length) * 100)}% across vocational records — low engagement with apprenticeship and training support may indicate that the approaches being used are not meeting young people's needs. Are sessions being delivered at convenient times? Is the support practical and relevant? Are young people's own interests and aspirations genuinely driving the vocational pathway? SCCIF expects to see that the home actively supports vocational aspirations`,
    });
  }

  // Medium: Low bursary uptake
  const eligibleForBursary = rows.filter(
    (r) => (ACTIVE_PROGRAMME_TYPES as string[]).includes(r.record_type),
  );
  const bursaryApplied = eligibleForBursary.filter((r) => r.bursary_applied).length;
  if (eligibleForBursary.length >= 3 && bursaryApplied / eligibleForBursary.length < 0.3) {
    alerts.push({
      type: "low_bursary_uptake",
      severity: "medium",
      message: `Bursary applied for in only ${Math.round((bursaryApplied / eligibleForBursary.length) * 100)}% of active programme records — care leavers are entitled to a bursary of up to £1,000 from their employer when starting an apprenticeship, plus additional funding support. Many care leavers miss out on financial entitlements they are eligible for. Is the home proactively supporting bursary applications for all eligible young people?`,
    });
  }

  // Medium: No sector variety
  const sectors = new Set(
    rows.filter((r) => r.sector && r.sector.trim().length > 0).map((r) => r.sector!.trim().toLowerCase()),
  );
  if (rows.length >= 8 && sectors.size <= 1) {
    alerts.push({
      type: "low_sector_variety",
      severity: "medium",
      message: `All apprenticeship records relate to ${sectors.size === 0 ? "no recorded sector" : `only the ${[...sectors][0]} sector`} — young people in residential care should be exposed to a range of vocational options. Gatsby Benchmark 6 recommends varied workplace experiences. Is the home relying on a single employer or sector for convenience rather than matching opportunities to individual young people's interests?`,
    });
  }

  // Medium: Low social worker informed rate
  const swCount = rows.filter((r) => r.social_worker_informed).length;
  if (rows.length >= 5 && swCount / rows.length < 0.3) {
    alerts.push({
      type: "low_sw_informed_rate",
      severity: "medium",
      message: `Social worker informed in only ${Math.round((swCount / rows.length) * 100)}% of apprenticeship records — the allocated social worker should be kept informed of significant vocational progress and concerns for looked-after children. Education and training outcomes are a key area of the care plan and LAC review`,
    });
  }

  return alerts;
}

export function generateAriaInsights(
  rows: ApprenticeshipTrackingRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_record_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const levelBreakdown = Object.entries(metrics.by_apprenticeship_level)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => `${level}: ${count}`)
    .join(", ");

  const sectorBreakdown = metrics.by_sector_top5
    .map((s) => `${s.sector}: ${s.count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} apprenticeship/vocational ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_young_people} ${metrics.unique_young_people === 1 ? "young person" : "young people"}. ` +
      `Record types: ${typeBreakdown || "none recorded"}. ` +
      `Levels: ${levelBreakdown || "none"}. ` +
      `Top sectors: ${sectorBreakdown || "none recorded"}. ` +
      `Active apprenticeships: ${metrics.active_apprenticeships}. ` +
      `Milestones achieved: ${metrics.milestone_count}. ` +
      `Application success rate: ${metrics.application_success_rate}%. ` +
      `Completion rate: ${metrics.completion_rate}%. ` +
      `Engagement rate: ${metrics.engagement_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `At risk of dropping out: ${metrics.at_risk_count}. ` +
        `Bursary application rate: ${metrics.bursary_application_rate}%. ` +
        `Bursary receipt rate: ${metrics.bursary_receipt_rate}%. ` +
        `PA involved: ${metrics.personal_adviser_rate}%. ` +
        `Pathway plan linked: ${metrics.pathway_plan_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Average duration: ${metrics.average_duration_days} days. ` +
        `Formal apprenticeships: ${metrics.formal_apprenticeship_count}. ` +
        `Alternative pathways: ${metrics.alternative_pathway_count}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority vocational alerts. ` +
        `At risk: ${metrics.at_risk_count}. ` +
        `Bursary application rate: ${metrics.bursary_application_rate}%. ` +
        `Bursary receipt rate: ${metrics.bursary_receipt_rate}%. ` +
        `PA involved: ${metrics.personal_adviser_rate}%. ` +
        `Pathway plan linked: ${metrics.pathway_plan_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Average duration: ${metrics.average_duration_days} days. ` +
        `Continue supporting vocational aspirations per CHR 2015 Reg 5.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.at_risk_count > 0 && metrics.total_records > 3) {
    insights.push(
      `[reflect] ${metrics.at_risk_count} young ${metrics.at_risk_count === 1 ? "person is" : "people are"} at risk ` +
        `of dropping out. DfE data shows that care leavers are significantly ` +
        `overrepresented among those who do not complete apprenticeships — 26% ` +
        `of care leavers aged 19-21 are NEET compared to 12% of all young people. ` +
        `CHR 2015 Reg 5 requires the home to actively support education and ` +
        `training, which means addressing the specific barriers that looked-after ` +
        `young people face: instability, mental health difficulties, gaps in ` +
        `foundational skills, and limited informal networks. Is the home providing ` +
        `wraparound support that addresses these barriers? Are employers being ` +
        `supported to understand the needs of care-experienced apprentices? Is ` +
        `the young person's voice central to decisions about their vocational ` +
        `pathway? The Apprenticeships, Skills, Children and Learning Act 2009 ` +
        `provides additional protections and funding — is the home maximising ` +
        `these entitlements?`,
    );
  } else if (metrics.personal_adviser_rate < 40 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Personal advisers are involved in only ${metrics.personal_adviser_rate}% ` +
        `of records. For care leavers, the personal adviser is the statutory ` +
        `point of continuity through the transition to independence. The Children ` +
        `(Leaving Care) Act 2000 provides for PA support specifically because ` +
        `care leavers lack the informal family support networks that most young ` +
        `people rely on when navigating the world of work. Is the PA being ` +
        `proactively included in apprenticeship planning and review? Are PAs ` +
        `attending employer meetings and progress reviews? The relationship ` +
        `between PA and young person is often the single most important factor ` +
        `in sustaining a vocational placement. SCCIF inspectors will look for ` +
        `evidence that multi-agency coordination supports vocational outcomes.`,
    );
  } else if (metrics.completion_rate < 50 && metrics.active_apprenticeships > 0) {
    insights.push(
      `[reflect] Completion rate is ${metrics.completion_rate}% against ${metrics.active_apprenticeships} ` +
        `active apprenticeships. National apprenticeship completion rates are ` +
        `around 50-55%, but care leavers typically achieve lower rates due to ` +
        `the additional challenges they face. What is the home doing differently ` +
        `to support retention? Are progress reviews regular and meaningful? Is ` +
        `pastoral support available when personal difficulties arise? Are ` +
        `employers briefed on how to support care-experienced young people? ` +
        `Gatsby Benchmark 6 emphasises quality workplace experiences — are ` +
        `these apprenticeships providing genuine skill development and a ` +
        `sense of achievement?`,
    );
  } else {
    insights.push(
      `[reflect] How is the home ensuring that apprenticeship and vocational ` +
        `support is driven by each young person's genuine interests rather than ` +
        `convenience or availability? SCCIF: Experiences & progress expects to ` +
        `see that vocational aspirations are nurtured with the same ambition ` +
        `that any good parent would show. CHR 2015 Reg 5 requires that ` +
        `education and training provision is personalised. Are young people ` +
        `being exposed to a range of sectors and roles? Are exploration sessions ` +
        `and workplace visits happening before commitments are made? Is the home ` +
        `thinking about career trajectories, not just immediate placements? For ` +
        `care leavers, vocational success is one of the strongest protective ` +
        `factors against poor adult outcomes.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    apprenticeshipLevel?: ApprenticeshipLevel;
    limit?: number;
  },
): Promise<ServiceResult<ApprenticeshipTrackingRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_apprenticeship_tracking") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);
  if (filters?.apprenticeshipLevel) q = q.eq("apprenticeship_level", filters.apprenticeshipLevel);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<ApprenticeshipTrackingRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_apprenticeship_tracking") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  youngPersonName: string;
  recordDate: string;
  supportingStaff: string;
  recordType: RecordType;
  apprenticeshipLevel?: ApprenticeshipLevel | null;
  sector?: string | null;
  employerName?: string | null;
  trainingProvider?: string | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  bursaryApplied?: boolean;
  bursaryReceived?: boolean;
  youngPersonEngaged?: boolean;
  personalAdviserInvolved?: boolean;
  pathwayPlanLinked?: boolean;
  socialWorkerInformed?: boolean;
  atRiskOfDroppingOut?: boolean;
  supportPlanInPlace?: boolean | null;
  notes?: string | null;
}): Promise<ServiceResult<ApprenticeshipTrackingRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateApprenticeshipTracking({
    youngPersonName: input.youngPersonName,
    recordDate: input.recordDate,
    supportingStaff: input.supportingStaff,
    recordType: input.recordType,
    apprenticeshipLevel: input.apprenticeshipLevel,
    bursaryApplied: input.bursaryApplied,
    bursaryReceived: input.bursaryReceived,
    atRiskOfDroppingOut: input.atRiskOfDroppingOut,
    supportPlanInPlace: input.supportPlanInPlace,
    youngPersonEngaged: input.youngPersonEngaged,
    personalAdviserInvolved: input.personalAdviserInvolved,
    pathwayPlanLinked: input.pathwayPlanLinked,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_apprenticeship_tracking") as SB)
    .insert({
      home_id: input.homeId,
      young_person_name: input.youngPersonName,
      record_date: input.recordDate,
      supporting_staff: input.supportingStaff,
      record_type: input.recordType,
      apprenticeship_level: input.apprenticeshipLevel ?? null,
      sector: input.sector ?? null,
      employer_name: input.employerName ?? null,
      training_provider: input.trainingProvider ?? null,
      start_date: input.startDate ?? null,
      expected_end_date: input.expectedEndDate ?? null,
      bursary_applied: input.bursaryApplied ?? false,
      bursary_received: input.bursaryReceived ?? false,
      young_person_engaged: input.youngPersonEngaged ?? false,
      personal_adviser_involved: input.personalAdviserInvolved ?? false,
      pathway_plan_linked: input.pathwayPlanLinked ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      at_risk_of_dropping_out: input.atRiskOfDroppingOut ?? false,
      support_plan_in_place: input.supportPlanInPlace ?? null,
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
    youngPersonName: string;
    recordDate: string;
    supportingStaff: string;
    recordType: RecordType;
    apprenticeshipLevel: ApprenticeshipLevel | null;
    sector: string | null;
    employerName: string | null;
    trainingProvider: string | null;
    startDate: string | null;
    expectedEndDate: string | null;
    bursaryApplied: boolean;
    bursaryReceived: boolean;
    youngPersonEngaged: boolean;
    personalAdviserInvolved: boolean;
    pathwayPlanLinked: boolean;
    socialWorkerInformed: boolean;
    atRiskOfDroppingOut: boolean;
    supportPlanInPlace: boolean | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ApprenticeshipTrackingRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.youngPersonName !== undefined) mapped.young_person_name = updates.youngPersonName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.supportingStaff !== undefined) mapped.supporting_staff = updates.supportingStaff;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.apprenticeshipLevel !== undefined) mapped.apprenticeship_level = updates.apprenticeshipLevel;
  if (updates.sector !== undefined) mapped.sector = updates.sector;
  if (updates.employerName !== undefined) mapped.employer_name = updates.employerName;
  if (updates.trainingProvider !== undefined) mapped.training_provider = updates.trainingProvider;
  if (updates.startDate !== undefined) mapped.start_date = updates.startDate;
  if (updates.expectedEndDate !== undefined) mapped.expected_end_date = updates.expectedEndDate;
  if (updates.bursaryApplied !== undefined) mapped.bursary_applied = updates.bursaryApplied;
  if (updates.bursaryReceived !== undefined) mapped.bursary_received = updates.bursaryReceived;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.personalAdviserInvolved !== undefined) mapped.personal_adviser_involved = updates.personalAdviserInvolved;
  if (updates.pathwayPlanLinked !== undefined) mapped.pathway_plan_linked = updates.pathwayPlanLinked;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.atRiskOfDroppingOut !== undefined) mapped.at_risk_of_dropping_out = updates.atRiskOfDroppingOut;
  if (updates.supportPlanInPlace !== undefined) mapped.support_plan_in_place = updates.supportPlanInPlace;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_apprenticeship_tracking") as SB)
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

  const { error } = await (client.from("cs_apprenticeship_tracking") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
