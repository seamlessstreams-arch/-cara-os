// ==============================================================================
// CARA -- BENEFIT ENTITLEMENT & WELFARE SUPPORT SERVICE
// Tracks benefit entitlement awareness, application support, and welfare
// provision for care leavers and looked-after young people. Covers Universal
// Credit, Housing Benefit, Council Tax Exemption, PIP, DLA, ESA, Carers
// Allowance, Healthy Start Vouchers, education bursaries, care leaver grants,
// setting up home allowance, leaving care grant, utility support schemes,
// free school meals, and travel passes/discounts.
//
// Covers: Entitlement awareness raising, eligibility checking, application
// support, decision tracking, appeal/mandatory reconsideration, review/renewal,
// ongoing support, personal adviser involvement, social worker notification,
// pathway plan linkage, payment frequency, young person engagement, and
// next review date tracking.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (independence preparation),
// Children (Leaving Care) Act 2000,
// DWP guidance for care leavers,
// Universal Credit for care leavers (exempt from shared accommodation rate),
// Council tax exemption for care leavers,
// SCCIF: Experiences & progress — "Young people understand their entitlements."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const ENTITLEMENT_TYPES = [
  "Universal Credit",
  "Housing Benefit",
  "Council Tax Exemption",
  "Personal Independence Payment",
  "Disability Living Allowance",
  "Employment and Support Allowance",
  "Carers Allowance",
  "Free Prescriptions",
  "Healthy Start Vouchers",
  "Education Maintenance Allowance",
  "16-19 Bursary Fund",
  "Care Leaver Bursary",
  "Setting Up Home Allowance",
  "Leaving Care Grant",
  "Council Tax Reduction",
  "Water — Social Tariff",
  "Energy — Warm Home Discount",
  "Free School Meals",
  "Travel Pass/Discount",
  "Other",
] as const;
export type EntitlementType = (typeof ENTITLEMENT_TYPES)[number];

export const SUPPORT_STAGES = [
  "Awareness Raising",
  "Eligibility Check",
  "Application Support",
  "Application Submitted",
  "Decision — Awarded",
  "Decision — Refused",
  "Appeal/Mandatory Reconsideration",
  "Review/Renewal",
  "Ongoing Support",
  "Closed",
] as const;
export type SupportStage = (typeof SUPPORT_STAGES)[number];

export const PAYMENT_FREQUENCIES = [
  "Weekly",
  "Fortnightly",
  "Monthly",
  "One-Off",
  "Annual",
  "Not Applicable",
] as const;
export type PaymentFrequency = (typeof PAYMENT_FREQUENCIES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const CARE_LEAVER_SPECIFIC_TYPES: EntitlementType[] = [
  "Care Leaver Bursary",
  "Setting Up Home Allowance",
  "Leaving Care Grant",
];

export const DWP_BENEFIT_TYPES: EntitlementType[] = [
  "Universal Credit",
  "Housing Benefit",
  "Personal Independence Payment",
  "Disability Living Allowance",
  "Employment and Support Allowance",
  "Carers Allowance",
];

export const EDUCATION_BENEFIT_TYPES: EntitlementType[] = [
  "Education Maintenance Allowance",
  "16-19 Bursary Fund",
  "Care Leaver Bursary",
  "Free School Meals",
];

export const UTILITY_SUPPORT_TYPES: EntitlementType[] = [
  "Council Tax Exemption",
  "Council Tax Reduction",
  "Water — Social Tariff",
  "Energy — Warm Home Discount",
];

export const HEALTH_BENEFIT_TYPES: EntitlementType[] = [
  "Free Prescriptions",
  "Healthy Start Vouchers",
];

export const ACTIVE_STAGES: SupportStage[] = [
  "Awareness Raising",
  "Eligibility Check",
  "Application Support",
  "Application Submitted",
  "Appeal/Mandatory Reconsideration",
  "Review/Renewal",
  "Ongoing Support",
];

export const DECISION_STAGES: SupportStage[] = [
  "Decision — Awarded",
  "Decision — Refused",
];

// -- Label maps ---------------------------------------------------------------

export const ENTITLEMENT_TYPE_LABELS: { type: EntitlementType; label: string }[] = [
  { type: "Universal Credit", label: "Universal Credit" },
  { type: "Housing Benefit", label: "Housing Benefit" },
  { type: "Council Tax Exemption", label: "Council Tax Exemption" },
  { type: "Personal Independence Payment", label: "Personal Independence Payment (PIP)" },
  { type: "Disability Living Allowance", label: "Disability Living Allowance (DLA)" },
  { type: "Employment and Support Allowance", label: "Employment and Support Allowance (ESA)" },
  { type: "Carers Allowance", label: "Carer's Allowance" },
  { type: "Free Prescriptions", label: "Free Prescriptions" },
  { type: "Healthy Start Vouchers", label: "Healthy Start Vouchers" },
  { type: "Education Maintenance Allowance", label: "Education Maintenance Allowance (EMA)" },
  { type: "16-19 Bursary Fund", label: "16-19 Bursary Fund" },
  { type: "Care Leaver Bursary", label: "Care Leaver Bursary (HE)" },
  { type: "Setting Up Home Allowance", label: "Setting Up Home Allowance" },
  { type: "Leaving Care Grant", label: "Leaving Care Grant" },
  { type: "Council Tax Reduction", label: "Council Tax Reduction" },
  { type: "Water — Social Tariff", label: "Water — Social Tariff" },
  { type: "Energy — Warm Home Discount", label: "Energy — Warm Home Discount" },
  { type: "Free School Meals", label: "Free School Meals" },
  { type: "Travel Pass/Discount", label: "Travel Pass / Discount" },
  { type: "Other", label: "Other" },
];

export const SUPPORT_STAGE_LABELS: { stage: SupportStage; label: string }[] = [
  { stage: "Awareness Raising", label: "Awareness Raising" },
  { stage: "Eligibility Check", label: "Eligibility Check" },
  { stage: "Application Support", label: "Application Support" },
  { stage: "Application Submitted", label: "Application Submitted" },
  { stage: "Decision — Awarded", label: "Decision — Awarded" },
  { stage: "Decision — Refused", label: "Decision — Refused" },
  { stage: "Appeal/Mandatory Reconsideration", label: "Appeal / Mandatory Reconsideration" },
  { stage: "Review/Renewal", label: "Review / Renewal" },
  { stage: "Ongoing Support", label: "Ongoing Support" },
  { stage: "Closed", label: "Closed" },
];

// -- Row type -----------------------------------------------------------------

export interface BenefitEntitlementSupportRow {
  id: string;
  home_id: string;
  young_person_name: string;
  record_date: string;
  supporting_staff: string;
  entitlement_type: EntitlementType;
  support_stage: SupportStage;
  amount_awarded: number | null;
  payment_frequency: PaymentFrequency | null;
  young_person_engaged: boolean;
  application_successful: boolean | null;
  appeal_outcome: string | null;
  personal_adviser_involved: boolean;
  social_worker_informed: boolean;
  pathway_plan_linked: boolean;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateBenefitEntitlementSupport(input: {
  youngPersonName?: string;
  recordDate?: string;
  supportingStaff?: string;
  entitlementType?: string;
  supportStage?: string;
  amountAwarded?: number | null;
  paymentFrequency?: string | null;
  youngPersonEngaged?: boolean;
  applicationSuccessful?: boolean | null;
  appealOutcome?: string | null;
  personalAdviserInvolved?: boolean;
  socialWorkerInformed?: boolean;
  pathwayPlanLinked?: boolean;
  nextReviewDate?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.youngPersonName || input.youngPersonName.trim().length === 0) {
    errors.push("Young person's name is required");
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
    errors.push("Supporting staff member is required");
  }

  if (
    !input.entitlementType ||
    !(ENTITLEMENT_TYPES as readonly string[]).includes(input.entitlementType)
  ) {
    errors.push(`Entitlement type must be one of: ${ENTITLEMENT_TYPES.join(", ")}`);
  }

  if (
    !input.supportStage ||
    !(SUPPORT_STAGES as readonly string[]).includes(input.supportStage)
  ) {
    errors.push(`Support stage must be one of: ${SUPPORT_STAGES.join(", ")}`);
  }

  if (
    input.paymentFrequency &&
    !(PAYMENT_FREQUENCIES as readonly string[]).includes(input.paymentFrequency)
  ) {
    errors.push(`Payment frequency must be one of: ${PAYMENT_FREQUENCIES.join(", ")}`);
  }

  // Business rule: Amount should be recorded when decision is awarded
  if (
    input.supportStage === "Decision — Awarded" &&
    (input.amountAwarded === null || input.amountAwarded === undefined)
  ) {
    errors.push("Amount awarded should be recorded when the decision is 'Awarded' — this is needed for pathway plan financial planning and review");
  }

  // Business rule: Payment frequency should be recorded when amount is awarded
  if (
    input.amountAwarded !== null &&
    input.amountAwarded !== undefined &&
    input.amountAwarded > 0 &&
    !input.paymentFrequency
  ) {
    errors.push("Payment frequency should be recorded when an amount is awarded — this helps with budgeting support and pathway plan financial planning");
  }

  // Business rule: Appeal outcome required when at appeal stage
  if (
    input.supportStage === "Appeal/Mandatory Reconsideration" &&
    input.applicationSuccessful === null
  ) {
    // Advisory — appeal may still be in progress
  }

  // Business rule: Personal adviser should be involved for care leavers
  if (
    input.entitlementType &&
    (CARE_LEAVER_SPECIFIC_TYPES as string[]).includes(input.entitlementType) &&
    input.personalAdviserInvolved === false
  ) {
    errors.push(`${input.entitlementType} is a care leaver-specific entitlement — the personal adviser should be involved per the Children (Leaving Care) Act 2000. Personal advisers have a statutory duty to provide support with entitlements`);
  }

  // Business rule: Pathway plan should be linked for DWP benefits
  if (
    input.entitlementType &&
    (DWP_BENEFIT_TYPES as string[]).includes(input.entitlementType) &&
    input.supportStage === "Decision — Awarded" &&
    input.pathwayPlanLinked === false
  ) {
    errors.push(`${input.entitlementType} award should be linked to the pathway plan — financial support is a key element of the pathway plan under the Children (Leaving Care) Act 2000`);
  }

  // Business rule: Social worker should be informed for significant decisions
  if (
    (input.supportStage === "Decision — Awarded" || input.supportStage === "Decision — Refused") &&
    input.socialWorkerInformed === false
  ) {
    errors.push("Social worker should be informed of benefit decisions — both awards and refusals have implications for the young person's care plan and financial support arrangements");
  }

  // Business rule: Next review date should be set for awarded benefits
  if (
    input.supportStage === "Decision — Awarded" &&
    !input.nextReviewDate
  ) {
    errors.push("Next review date should be set when a benefit is awarded — benefits require periodic review/renewal to maintain entitlement");
  }

  // Business rule: Young person should be engaged in the process
  if (input.youngPersonEngaged === false) {
    // Advisory but not blocking — record the disengagement
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: BenefitEntitlementSupportRow[],
): {
  total_records: number;
  by_entitlement_type: Record<string, number>;
  by_support_stage: Record<string, number>;
  total_awarded: number;
  application_success_rate: number;
  appeal_rate: number;
  engagement_rate: number;
  pa_involvement_rate: number;
  pathway_plan_rate: number;
  unique_young_people: number;
  active_awards_count: number;
  pending_applications_count: number;
  social_worker_informed_rate: number;
  care_leaver_entitlements_count: number;
  education_benefits_count: number;
  utility_support_count: number;
  overdue_reviews_count: number;
  refused_count: number;
  average_award_amount: number;
} {
  const total = rows.length;

  // Unique young people
  const uniqueYP = new Set(rows.map((r) => r.young_person_name.toLowerCase().trim()));

  // Entitlement type breakdown
  const byEntitlementType: Record<string, number> = {};
  for (const et of ENTITLEMENT_TYPES) byEntitlementType[et] = 0;
  for (const r of rows)
    byEntitlementType[r.entitlement_type] = (byEntitlementType[r.entitlement_type] || 0) + 1;

  // Support stage breakdown
  const bySupportStage: Record<string, number> = {};
  for (const ss of SUPPORT_STAGES) bySupportStage[ss] = 0;
  for (const r of rows)
    bySupportStage[r.support_stage] = (bySupportStage[r.support_stage] || 0) + 1;

  // Total awarded amount
  const awardedRows = rows.filter(
    (r) => r.support_stage === "Decision — Awarded" && r.amount_awarded !== null,
  );
  const totalAwarded = awardedRows.reduce((sum, r) => sum + Number(r.amount_awarded), 0);

  // Average award amount
  const averageAwardAmount = awardedRows.length > 0
    ? Math.round((totalAwarded / awardedRows.length) * 100) / 100
    : 0;

  // Application success rate
  const decidedRows = rows.filter(
    (r) => r.application_successful !== null,
  );
  const successfulRows = decidedRows.filter((r) => r.application_successful === true);
  const applicationSuccessRate = decidedRows.length > 0
    ? Math.round((successfulRows.length / decidedRows.length) * 1000) / 10
    : 0;

  // Appeal rate
  const appealRows = rows.filter(
    (r) => r.support_stage === "Appeal/Mandatory Reconsideration",
  );
  const appealRate = total > 0
    ? Math.round((appealRows.length / total) * 1000) / 10
    : 0;

  // Engagement rate
  const engagementRate = total > 0
    ? Math.round((rows.filter((r) => r.young_person_engaged).length / total) * 1000) / 10
    : 0;

  // PA involvement rate
  const paInvolvementRate = total > 0
    ? Math.round((rows.filter((r) => r.personal_adviser_involved).length / total) * 1000) / 10
    : 0;

  // Pathway plan rate
  const pathwayPlanRate = total > 0
    ? Math.round((rows.filter((r) => r.pathway_plan_linked).length / total) * 1000) / 10
    : 0;

  // Social worker informed rate
  const socialWorkerInformedRate = total > 0
    ? Math.round((rows.filter((r) => r.social_worker_informed).length / total) * 1000) / 10
    : 0;

  // Active awards (Decision — Awarded and not Closed)
  const activeAwardsCount = rows.filter(
    (r) => r.support_stage === "Decision — Awarded" || r.support_stage === "Ongoing Support",
  ).length;

  // Pending applications
  const pendingApplicationsCount = rows.filter(
    (r) => r.support_stage === "Application Submitted" || r.support_stage === "Application Support",
  ).length;

  // Care leaver entitlements
  const careLeaveEntitlementsCount = rows.filter(
    (r) => (CARE_LEAVER_SPECIFIC_TYPES as string[]).includes(r.entitlement_type),
  ).length;

  // Education benefits
  const educationBenefitsCount = rows.filter(
    (r) => (EDUCATION_BENEFIT_TYPES as string[]).includes(r.entitlement_type),
  ).length;

  // Utility support
  const utilitySupportCount = rows.filter(
    (r) => (UTILITY_SUPPORT_TYPES as string[]).includes(r.entitlement_type),
  ).length;

  // Overdue reviews
  const today = new Date();
  const overdueReviewsCount = rows.filter((r) => {
    if (!r.next_review_date) return false;
    const reviewDate = new Date(r.next_review_date);
    return reviewDate < today && r.support_stage !== "Closed";
  }).length;

  // Refused count
  const refusedCount = rows.filter(
    (r) => r.support_stage === "Decision — Refused",
  ).length;

  return {
    total_records: total,
    by_entitlement_type: byEntitlementType,
    by_support_stage: bySupportStage,
    total_awarded: Math.round(totalAwarded * 100) / 100,
    application_success_rate: applicationSuccessRate,
    appeal_rate: appealRate,
    engagement_rate: engagementRate,
    pa_involvement_rate: paInvolvementRate,
    pathway_plan_rate: pathwayPlanRate,
    unique_young_people: uniqueYP.size,
    active_awards_count: activeAwardsCount,
    pending_applications_count: pendingApplicationsCount,
    social_worker_informed_rate: socialWorkerInformedRate,
    care_leaver_entitlements_count: careLeaveEntitlementsCount,
    education_benefits_count: educationBenefitsCount,
    utility_support_count: utilitySupportCount,
    overdue_reviews_count: overdueReviewsCount,
    refused_count: refusedCount,
    average_award_amount: averageAwardAmount,
  };
}

export function computeAlerts(
  rows: BenefitEntitlementSupportRow[],
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

  const total = rows.length;

  // Critical: Overdue benefit reviews
  const today = new Date();
  for (const r of rows) {
    if (r.next_review_date && r.support_stage !== "Closed") {
      const reviewDate = new Date(r.next_review_date);
      if (reviewDate < today) {
        const daysOverdue = Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: "overdue_review",
          severity: "critical",
          message: `${r.entitlement_type} review for ${r.young_person_name} is ${daysOverdue} days overdue (due ${r.next_review_date}) — failure to renew benefits on time can result in payments stopping and financial hardship. This is a statutory duty under the Children (Leaving Care) Act 2000`,
          record_id: r.id,
        });
      }
    }
  }

  // Critical: Care leaver entitlement refused without appeal
  for (const r of rows) {
    if (
      (CARE_LEAVER_SPECIFIC_TYPES as string[]).includes(r.entitlement_type) &&
      r.support_stage === "Decision — Refused"
    ) {
      const hasAppeal = rows.some(
        (other) =>
          other.young_person_name.toLowerCase().trim() === r.young_person_name.toLowerCase().trim() &&
          other.entitlement_type === r.entitlement_type &&
          other.support_stage === "Appeal/Mandatory Reconsideration",
      );
      if (!hasAppeal) {
        alerts.push({
          type: "care_leaver_refused_no_appeal",
          severity: "critical",
          message: `${r.entitlement_type} for ${r.young_person_name} was refused with no appeal recorded — care leaver-specific entitlements should always be challenged if refused. The Children (Leaving Care) Act 2000 places a duty on the LA to provide financial support`,
          record_id: r.id,
        });
      }
    }
  }

  // Critical: PA not involved in care leaver entitlement
  for (const r of rows) {
    if (
      (CARE_LEAVER_SPECIFIC_TYPES as string[]).includes(r.entitlement_type) &&
      !r.personal_adviser_involved
    ) {
      alerts.push({
        type: "pa_not_involved_care_leaver",
        severity: "critical",
        message: `Personal adviser not involved in ${r.entitlement_type} for ${r.young_person_name} — personal advisers have a statutory duty under the Children (Leaving Care) Act 2000 to support care leavers with entitlements and financial planning`,
        record_id: r.id,
      });
    }
  }

  // High: UC application without social worker awareness
  for (const r of rows) {
    if (
      r.entitlement_type === "Universal Credit" &&
      (r.support_stage === "Application Submitted" || r.support_stage === "Application Support") &&
      !r.social_worker_informed
    ) {
      alerts.push({
        type: "uc_sw_not_informed",
        severity: "high",
        message: `Universal Credit application for ${r.young_person_name} is progressing without social worker being informed — UC applications for care leavers have specific considerations (shared accommodation rate exemption, transitional protection) that the social worker should be aware of`,
        record_id: r.id,
      });
    }
  }

  // High: Young person not engaged in their entitlement support
  for (const r of rows) {
    if (!r.young_person_engaged && (ACTIVE_STAGES as string[]).includes(r.support_stage)) {
      alerts.push({
        type: "yp_disengaged",
        severity: "high",
        message: `${r.young_person_name} is not engaged in their ${r.entitlement_type} support (currently at ${r.support_stage}) — SCCIF expects young people to understand their entitlements. Disengagement may lead to missed benefits and financial hardship after leaving care`,
        record_id: r.id,
      });
    }
  }

  // High: Benefit refused without pathway plan update
  for (const r of rows) {
    if (r.support_stage === "Decision — Refused" && !r.pathway_plan_linked) {
      alerts.push({
        type: "refusal_not_in_pathway_plan",
        severity: "high",
        message: `${r.entitlement_type} refusal for ${r.young_person_name} is not linked to the pathway plan — a benefit refusal changes the financial picture and the pathway plan must be updated to reflect alternative support arrangements`,
        record_id: r.id,
      });
    }
  }

  // High: Multiple refusals for same young person
  const ypRefusals = new Map<string, BenefitEntitlementSupportRow[]>();
  for (const r of rows) {
    if (r.support_stage === "Decision — Refused") {
      const key = r.young_person_name.toLowerCase().trim();
      if (!ypRefusals.has(key)) ypRefusals.set(key, []);
      ypRefusals.get(key)!.push(r);
    }
  }
  for (const [, ypRows] of ypRefusals) {
    if (ypRows.length >= 2) {
      alerts.push({
        type: "multiple_refusals",
        severity: "high",
        message: `${ypRows[0].young_person_name} has had ${ypRows.length} benefit applications refused — review whether applications are being submitted correctly, whether the young person needs additional support, and whether mandatory reconsideration or appeal should be pursued`,
      });
    }
  }

  // Medium: No pathway plan linkage for ongoing awards
  const ongoingNoPathway = rows.filter(
    (r) =>
      (r.support_stage === "Decision — Awarded" || r.support_stage === "Ongoing Support") &&
      !r.pathway_plan_linked,
  );
  if (ongoingNoPathway.length >= 2) {
    alerts.push({
      type: "awards_not_in_pathway_plan",
      severity: "medium",
      message: `${ongoingNoPathway.length} active benefit awards are not linked to pathway plans — benefit income should be reflected in the pathway plan to ensure accurate financial planning for independence per Children (Leaving Care) Act 2000`,
    });
  }

  // Medium: Low PA involvement overall
  const paInvolvedCount = rows.filter((r) => r.personal_adviser_involved).length;
  if (total >= 5 && paInvolvedCount / total < 0.3) {
    alerts.push({
      type: "low_pa_involvement",
      severity: "medium",
      message: `Personal adviser involved in only ${Math.round((paInvolvedCount / total) * 100)}% of benefit records — personal advisers should be actively supporting young people with entitlements as part of their statutory role under the Children (Leaving Care) Act 2000`,
    });
  }

  // Medium: No utility support explored
  const utilityCount = rows.filter(
    (r) => (UTILITY_SUPPORT_TYPES as string[]).includes(r.entitlement_type),
  ).length;
  if (total >= 10 && utilityCount === 0) {
    alerts.push({
      type: "no_utility_support",
      severity: "medium",
      message: "No utility support entitlements (Council Tax exemption/reduction, water social tariff, Warm Home Discount) have been explored — care leavers are exempt from council tax until age 25 and may be eligible for reduced utility costs. These entitlements can significantly reduce living costs",
    });
  }

  // Medium: No education benefits explored
  const educationCount = rows.filter(
    (r) => (EDUCATION_BENEFIT_TYPES as string[]).includes(r.entitlement_type),
  ).length;
  if (total >= 10 && educationCount === 0) {
    alerts.push({
      type: "no_education_benefits",
      severity: "medium",
      message: "No education-related benefits (EMA, 16-19 Bursary, Care Leaver Bursary, Free School Meals) have been explored — care leavers in education have specific financial entitlements that can support continued learning and reduce financial barriers",
    });
  }

  // Medium: Reviews approaching (within 30 days)
  const approachingReviews = rows.filter((r) => {
    if (!r.next_review_date || r.support_stage === "Closed") return false;
    const reviewDate = new Date(r.next_review_date);
    const daysUntil = Math.floor((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  });
  if (approachingReviews.length > 0) {
    alerts.push({
      type: "reviews_approaching",
      severity: "medium",
      message: `${approachingReviews.length} benefit ${approachingReviews.length === 1 ? "review is" : "reviews are"} due within 30 days — ensure renewal paperwork is prepared and submitted on time to avoid gaps in payments`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: BenefitEntitlementSupportRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_entitlement_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const stageBreakdown = Object.entries(metrics.by_support_stage)
    .filter(([, count]) => count > 0)
    .map(([stage, count]) => `${stage}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} benefit/entitlement ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_young_people} young ${metrics.unique_young_people === 1 ? "person" : "people"}. ` +
      `Active awards: ${metrics.active_awards_count}. ` +
      `Pending applications: ${metrics.pending_applications_count}. ` +
      `Total awarded: £${metrics.total_awarded.toFixed(2)}. ` +
      `Success rate: ${metrics.application_success_rate}%. ` +
      `Refused: ${metrics.refused_count}. ` +
      `Entitlements: ${typeBreakdown || "none recorded"}. ` +
      `Stages: ${stageBreakdown || "none"}.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Young person engagement: ${metrics.engagement_rate}%. ` +
        `PA involvement: ${metrics.pa_involvement_rate}%. ` +
        `Pathway plan linkage: ${metrics.pathway_plan_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Overdue reviews: ${metrics.overdue_reviews_count}. ` +
        `Care leaver entitlements: ${metrics.care_leaver_entitlements_count}. ` +
        `Education benefits: ${metrics.education_benefits_count}. ` +
        `Utility support: ${metrics.utility_support_count}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority benefit entitlement alerts. ` +
        `Young person engagement: ${metrics.engagement_rate}%. ` +
        `PA involvement: ${metrics.pa_involvement_rate}%. ` +
        `Pathway plan linkage: ${metrics.pathway_plan_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Care leaver entitlements: ${metrics.care_leaver_entitlements_count}. ` +
        `Education benefits: ${metrics.education_benefits_count}. ` +
        `Continue ensuring young people understand their full entitlements per SCCIF.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.overdue_reviews_count > 0) {
    insights.push(
      `[reflect] ${metrics.overdue_reviews_count} benefit ${metrics.overdue_reviews_count === 1 ? "review is" : "reviews are"} overdue. ` +
        `Missed benefit reviews can result in payments stopping and immediate financial ` +
        `hardship for care leavers. The Children (Leaving Care) Act 2000 places a duty ` +
        `on the LA to provide financial support. Is there a robust system for tracking ` +
        `review dates? Are personal advisers diarising renewal deadlines? For Universal ` +
        `Credit, missed reviews can trigger sanctions and payment reductions. Is the home ` +
        `supporting young people to attend DWP appointments and provide required evidence ` +
        `on time?`,
    );
  } else if (metrics.engagement_rate < 60 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Young person engagement is only ${metrics.engagement_rate}% — are young people ` +
        `genuinely understanding their entitlements, or are staff managing benefits on ` +
        `their behalf without building the young person's capability? SCCIF inspectors ` +
        `expect to see that young people understand their entitlements. When a young ` +
        `person leaves care, they need to be able to navigate the benefits system ` +
        `independently. Is the home using real-life benefit interactions as teaching ` +
        `moments? Can young people explain what Universal Credit is and how to apply?`,
    );
  } else if (metrics.pa_involvement_rate < 40 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Personal adviser involvement is only ${metrics.pa_involvement_rate}%. Personal ` +
        `advisers have a statutory duty under the Children (Leaving Care) Act 2000 to ` +
        `support care leavers with entitlements and financial planning. Are PAs being ` +
        `involved early enough in the entitlement journey — at awareness raising and ` +
        `eligibility checking stages, not just when problems arise? Effective PA ` +
        `involvement can prevent failed applications, missed renewals, and financial ` +
        `crises after leaving care.`,
    );
  } else {
    insights.push(
      `[reflect] Is the home taking a proactive approach to benefit entitlements — ` +
        `identifying all possible entitlements before the young person needs them, ` +
        `rather than responding reactively when financial problems arise? Care leavers ` +
        `are entitled to council tax exemption until 25, shared accommodation rate ` +
        `exemption for UC, and various grants and bursaries. Are all eligible young ` +
        `people receiving every entitlement they qualify for? A comprehensive benefits ` +
        `check at pathway plan reviews can identify missed entitlements worth hundreds ` +
        `of pounds per year.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    entitlementType?: EntitlementType;
    supportStage?: SupportStage;
    limit?: number;
  },
): Promise<ServiceResult<BenefitEntitlementSupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_benefit_entitlement_support") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.entitlementType) q = q.eq("entitlement_type", filters.entitlementType);
  if (filters?.supportStage) q = q.eq("support_stage", filters.supportStage);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<BenefitEntitlementSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_benefit_entitlement_support") as SB)
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
  entitlementType: EntitlementType;
  supportStage: SupportStage;
  amountAwarded?: number | null;
  paymentFrequency?: PaymentFrequency | null;
  youngPersonEngaged?: boolean;
  applicationSuccessful?: boolean | null;
  appealOutcome?: string | null;
  personalAdviserInvolved?: boolean;
  socialWorkerInformed?: boolean;
  pathwayPlanLinked?: boolean;
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<BenefitEntitlementSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateBenefitEntitlementSupport({
    youngPersonName: input.youngPersonName,
    recordDate: input.recordDate,
    supportingStaff: input.supportingStaff,
    entitlementType: input.entitlementType,
    supportStage: input.supportStage,
    amountAwarded: input.amountAwarded,
    paymentFrequency: input.paymentFrequency,
    youngPersonEngaged: input.youngPersonEngaged,
    applicationSuccessful: input.applicationSuccessful,
    appealOutcome: input.appealOutcome,
    personalAdviserInvolved: input.personalAdviserInvolved,
    socialWorkerInformed: input.socialWorkerInformed,
    pathwayPlanLinked: input.pathwayPlanLinked,
    nextReviewDate: input.nextReviewDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_benefit_entitlement_support") as SB)
    .insert({
      home_id: input.homeId,
      young_person_name: input.youngPersonName,
      record_date: input.recordDate,
      supporting_staff: input.supportingStaff,
      entitlement_type: input.entitlementType,
      support_stage: input.supportStage,
      amount_awarded: input.amountAwarded ?? null,
      payment_frequency: input.paymentFrequency ?? null,
      young_person_engaged: input.youngPersonEngaged ?? true,
      application_successful: input.applicationSuccessful ?? null,
      appeal_outcome: input.appealOutcome ?? null,
      personal_adviser_involved: input.personalAdviserInvolved ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      pathway_plan_linked: input.pathwayPlanLinked ?? false,
      next_review_date: input.nextReviewDate ?? null,
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
    entitlementType: EntitlementType;
    supportStage: SupportStage;
    amountAwarded: number | null;
    paymentFrequency: PaymentFrequency | null;
    youngPersonEngaged: boolean;
    applicationSuccessful: boolean | null;
    appealOutcome: string | null;
    personalAdviserInvolved: boolean;
    socialWorkerInformed: boolean;
    pathwayPlanLinked: boolean;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<BenefitEntitlementSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.youngPersonName !== undefined) mapped.young_person_name = updates.youngPersonName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.supportingStaff !== undefined) mapped.supporting_staff = updates.supportingStaff;
  if (updates.entitlementType !== undefined) mapped.entitlement_type = updates.entitlementType;
  if (updates.supportStage !== undefined) mapped.support_stage = updates.supportStage;
  if (updates.amountAwarded !== undefined) mapped.amount_awarded = updates.amountAwarded;
  if (updates.paymentFrequency !== undefined) mapped.payment_frequency = updates.paymentFrequency;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.applicationSuccessful !== undefined) mapped.application_successful = updates.applicationSuccessful;
  if (updates.appealOutcome !== undefined) mapped.appeal_outcome = updates.appealOutcome;
  if (updates.personalAdviserInvolved !== undefined) mapped.personal_adviser_involved = updates.personalAdviserInvolved;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.pathwayPlanLinked !== undefined) mapped.pathway_plan_linked = updates.pathwayPlanLinked;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (client.from("cs_benefit_entitlement_support") as SB)
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

  const { error } = await (client.from("cs_benefit_entitlement_support") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
