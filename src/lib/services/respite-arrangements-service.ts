// ==============================================================================
// CARA -- RESPITE & SHORT BREAK ARRANGEMENTS SERVICE
// Tracks planned and emergency respite care, short breaks, shared care arrangements,
// and specialist breaks for looked-after children. Covers provider details, care plan
// sharing, medication plans, dietary needs, handover procedures, child preparation,
// child views, social worker approval, return debriefs, and experience outcomes.
//
// UK Regulatory Framework:
// CHR 2015 Reg 7 (children's plan), Children Act 1989 s17/s20,
// Short Breaks Regulations 2011,
// SCCIF: Overall experiences — "The home arranges appropriate breaks."
// SEND Short Breaks duty.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const ARRANGEMENT_TYPES = [
  "Planned Respite",
  "Emergency Respite",
  "Activity-Based Break",
  "Shared Care",
  "Family Short Break",
  "Specialist Break",
  "Therapeutic Break",
  "Holiday Respite",
  "Weekend Break",
] as const;
export type ArrangementType = (typeof ARRANGEMENT_TYPES)[number];

export const PROVIDER_TYPES = [
  "Foster Carer",
  "Another Residential Home",
  "Specialist Provider",
  "Family Member",
  "Activity Centre",
  "Other",
] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const EXPERIENCE_RATINGS = [
  "Very Positive",
  "Positive",
  "Neutral",
  "Negative",
  "Very Negative",
] as const;
export type ExperienceRating = (typeof EXPERIENCE_RATINGS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const PLANNED_TYPES: ArrangementType[] = [
  "Planned Respite",
  "Activity-Based Break",
  "Shared Care",
  "Family Short Break",
  "Holiday Respite",
  "Weekend Break",
];

export const EMERGENCY_TYPES: ArrangementType[] = [
  "Emergency Respite",
];

export const SPECIALIST_TYPES: ArrangementType[] = [
  "Specialist Break",
  "Therapeutic Break",
];

export const EXTERNAL_PROVIDER_TYPES: ProviderType[] = [
  "Foster Carer",
  "Another Residential Home",
  "Specialist Provider",
  "Activity Centre",
];

export const FAMILY_PROVIDER_TYPES: ProviderType[] = [
  "Family Member",
];

export const POSITIVE_EXPERIENCES: ExperienceRating[] = [
  "Very Positive",
  "Positive",
];

export const NEGATIVE_EXPERIENCES: ExperienceRating[] = [
  "Negative",
  "Very Negative",
];

// -- Label maps ---------------------------------------------------------------

export const ARRANGEMENT_TYPE_LABELS: { type: ArrangementType; label: string }[] = [
  { type: "Planned Respite", label: "Planned Respite" },
  { type: "Emergency Respite", label: "Emergency Respite" },
  { type: "Activity-Based Break", label: "Activity-Based Break" },
  { type: "Shared Care", label: "Shared Care" },
  { type: "Family Short Break", label: "Family Short Break" },
  { type: "Specialist Break", label: "Specialist Break" },
  { type: "Therapeutic Break", label: "Therapeutic Break" },
  { type: "Holiday Respite", label: "Holiday Respite" },
  { type: "Weekend Break", label: "Weekend Break" },
];

export const PROVIDER_TYPE_LABELS: { type: ProviderType; label: string }[] = [
  { type: "Foster Carer", label: "Foster Carer" },
  { type: "Another Residential Home", label: "Another Residential Home" },
  { type: "Specialist Provider", label: "Specialist Provider" },
  { type: "Family Member", label: "Family Member" },
  { type: "Activity Centre", label: "Activity Centre" },
  { type: "Other", label: "Other" },
];

export const EXPERIENCE_RATING_LABELS: { rating: ExperienceRating; label: string }[] = [
  { rating: "Very Positive", label: "Very Positive" },
  { rating: "Positive", label: "Positive" },
  { rating: "Neutral", label: "Neutral" },
  { rating: "Negative", label: "Negative" },
  { rating: "Very Negative", label: "Very Negative" },
];

// -- Row type -----------------------------------------------------------------

export interface RespiteArrangementRow {
  id: string;
  home_id: string;
  child_name: string;
  break_date: string;
  return_date: string;
  arrangement_type: ArrangementType;
  provider_name: string;
  provider_type: ProviderType;
  risk_assessment_completed: boolean;
  care_plan_shared: boolean;
  medication_plan_shared: boolean;
  dietary_needs_shared: boolean;
  emergency_contacts_provided: boolean;
  child_prepared: boolean;
  child_views_obtained: boolean;
  social_worker_approved: boolean;
  parental_consent: boolean | null;
  handover_completed: boolean;
  return_debrief: boolean;
  child_experience_rating: ExperienceRating | null;
  concerns_raised: boolean;
  concern_details: string | null;
  next_break_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateRespiteArrangement(input: {
  childName?: string;
  breakDate?: string;
  returnDate?: string;
  arrangementType?: string;
  providerName?: string;
  providerType?: string;
  riskAssessmentCompleted?: boolean;
  carePlanShared?: boolean;
  medicationPlanShared?: boolean;
  childPrepared?: boolean;
  childViewsObtained?: boolean;
  socialWorkerApproved?: boolean;
  handoverCompleted?: boolean;
  returnDebrief?: boolean;
  childExperienceRating?: string | null;
  concernsRaised?: boolean;
  concernDetails?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.breakDate) {
    errors.push("Break date is required");
  } else {
    const dateObj = new Date(input.breakDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Break date must be a valid date");
    }
  }

  if (!input.returnDate) {
    errors.push("Return date is required");
  } else {
    const retObj = new Date(input.returnDate);
    if (isNaN(retObj.getTime())) {
      errors.push("Return date must be a valid date");
    } else if (input.breakDate && new Date(input.returnDate) < new Date(input.breakDate)) {
      errors.push("Return date cannot be before break date");
    }
  }

  if (
    !input.arrangementType ||
    !(ARRANGEMENT_TYPES as readonly string[]).includes(input.arrangementType)
  ) {
    errors.push(`Arrangement type must be one of: ${ARRANGEMENT_TYPES.join(", ")}`);
  }

  if (!input.providerName || input.providerName.trim().length === 0) {
    errors.push("Provider name is required");
  }

  if (
    input.providerType &&
    !(PROVIDER_TYPES as readonly string[]).includes(input.providerType)
  ) {
    errors.push(`Provider type must be one of: ${PROVIDER_TYPES.join(", ")}`);
  }

  if (
    input.childExperienceRating &&
    !(EXPERIENCE_RATINGS as readonly string[]).includes(input.childExperienceRating)
  ) {
    errors.push(`Experience rating must be one of: ${EXPERIENCE_RATINGS.join(", ")}`);
  }

  // Business rule: Risk assessment is mandatory
  if (input.riskAssessmentCompleted === false) {
    errors.push(
      "Risk assessment not completed — CHR 2015 Reg 12 requires a risk assessment before any placement away from the home. This must cover the suitability of the respite provider, any risks specific to the child (health, emotional, behavioural), transport arrangements, and emergency procedures. The Short Breaks Regulations 2011 also require that the welfare of the child is safeguarded and promoted during any break",
    );
  }

  // Business rule: Care plan must be shared with provider
  if (input.carePlanShared === false) {
    errors.push(
      "Care plan not shared with respite provider — CHR 2015 Reg 7 requires that the child's care plan is followed. The respite provider cannot meet the child's needs without access to their care plan. This should include the child's routines, triggers, communication needs, relationship dynamics, and any specific strategies that work for them. Failure to share the care plan puts the child at risk of inconsistent or inappropriate care",
    );
  }

  // Business rule: Child views must be obtained
  if (input.childViewsObtained === false) {
    errors.push(
      "Child's views not obtained about the respite arrangement — UNCRC Article 12 requires that children's views are sought on matters affecting them. Short Breaks Regulations 2011 require that the child's wishes and feelings are ascertained. Many looked-after children experience anxiety about being moved, even temporarily. The child's views on the provider, timing, and duration of the break should be actively sought and considered",
    );
  }

  // Business rule: Social worker approval is required
  if (input.socialWorkerApproved === false) {
    errors.push(
      "Social worker has not approved the respite arrangement — respite placements constitute a change in the child's living arrangements and must be approved by the allocated social worker as part of the care planning process. Children Act 1989 requires that the responsible authority is informed of and approves placement changes",
    );
  }

  // Business rule: Concerns raised must have details
  if (input.concernsRaised === true && (!input.concernDetails || input.concernDetails.trim().length === 0)) {
    errors.push(
      "Concerns raised during respite but no details provided — any concerns about a child's respite experience must be fully documented including what happened, who was involved, what action was taken, and whether the concern constitutes a safeguarding issue requiring referral. This documentation is essential for the child's record and for informing future respite decisions",
    );
  }

  // Business rule: Handover must be completed for external providers
  if (
    input.providerType &&
    (EXTERNAL_PROVIDER_TYPES as string[]).includes(input.providerType) &&
    input.handoverCompleted === false
  ) {
    errors.push(
      `Handover not completed with ${input.providerType} — a structured handover is essential when a child moves to external respite care. This should cover current medication, daily routines, dietary requirements, emotional state, any recent incidents or triggers, emergency contact details, and return arrangements. The Short Breaks Regulations 2011 require that the child's welfare is safeguarded throughout the transition`,
    );
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: RespiteArrangementRow[],
): {
  total_arrangements: number;
  unique_children: number;
  by_arrangement_type: Record<string, number>;
  by_provider_type: Record<string, number>;
  by_experience_rating: Record<string, number>;
  risk_assessment_rate: number;
  care_plan_shared_rate: number;
  medication_plan_shared_rate: number;
  dietary_needs_shared_rate: number;
  emergency_contacts_rate: number;
  child_prepared_rate: number;
  child_views_rate: number;
  social_worker_approved_rate: number;
  handover_rate: number;
  return_debrief_rate: number;
  positive_experience_rate: number;
  negative_experience_rate: number;
  concerns_raised_rate: number;
  planned_count: number;
  emergency_count: number;
  specialist_count: number;
  average_per_child: number;
  average_break_duration_days: number;
  next_break_scheduled_rate: number;
} {
  const total = rows.length;

  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Arrangement type breakdown
  const byArrangementType: Record<string, number> = {};
  for (const at of ARRANGEMENT_TYPES) byArrangementType[at] = 0;
  for (const r of rows) byArrangementType[r.arrangement_type] = (byArrangementType[r.arrangement_type] || 0) + 1;

  // Provider type breakdown
  const byProviderType: Record<string, number> = {};
  for (const pt of PROVIDER_TYPES) byProviderType[pt] = 0;
  for (const r of rows) byProviderType[r.provider_type] = (byProviderType[r.provider_type] || 0) + 1;

  // Experience breakdown
  const byExperience: Record<string, number> = {};
  for (const er of EXPERIENCE_RATINGS) byExperience[er] = 0;
  const ratedRows = rows.filter((r) => r.child_experience_rating !== null);
  for (const r of ratedRows) byExperience[r.child_experience_rating!] = (byExperience[r.child_experience_rating!] || 0) + 1;

  // Boolean rates
  const pct = (filter: (r: RespiteArrangementRow) => boolean) =>
    total > 0 ? Math.round((rows.filter(filter).length / total) * 1000) / 10 : 0;

  const riskAssessmentRate = pct((r) => r.risk_assessment_completed);
  const carePlanSharedRate = pct((r) => r.care_plan_shared);
  const medicationPlanSharedRate = pct((r) => r.medication_plan_shared);
  const dietaryNeedsSharedRate = pct((r) => r.dietary_needs_shared);
  const emergencyContactsRate = pct((r) => r.emergency_contacts_provided);
  const childPreparedRate = pct((r) => r.child_prepared);
  const childViewsRate = pct((r) => r.child_views_obtained);
  const socialWorkerApprovedRate = pct((r) => r.social_worker_approved);
  const handoverRate = pct((r) => r.handover_completed);
  const returnDebriefRate = pct((r) => r.return_debrief);
  const concernsRaisedRate = pct((r) => r.concerns_raised);

  // Experience rates
  const positiveExperienceRate = ratedRows.length > 0
    ? Math.round(
        (ratedRows.filter((r) => (POSITIVE_EXPERIENCES as string[]).includes(r.child_experience_rating!)).length /
          ratedRows.length) *
          1000,
      ) / 10
    : 0;

  const negativeExperienceRate = ratedRows.length > 0
    ? Math.round(
        (ratedRows.filter((r) => (NEGATIVE_EXPERIENCES as string[]).includes(r.child_experience_rating!)).length /
          ratedRows.length) *
          1000,
      ) / 10
    : 0;

  // Category counts
  const plannedCount = rows.filter((r) => (PLANNED_TYPES as string[]).includes(r.arrangement_type)).length;
  const emergencyCount = rows.filter((r) => (EMERGENCY_TYPES as string[]).includes(r.arrangement_type)).length;
  const specialistCount = rows.filter((r) => (SPECIALIST_TYPES as string[]).includes(r.arrangement_type)).length;

  const avgPerChild = uniqueChildren.size > 0
    ? Math.round((total / uniqueChildren.size) * 10) / 10
    : 0;

  // Average duration in days
  const durations = rows.map((r) => {
    const start = new Date(r.break_date);
    const end = new Date(r.return_date);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  }).filter((d) => d >= 0);
  const avgDuration = durations.length > 0
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : 0;

  const nextBreakRate = pct((r) => r.next_break_date !== null);

  return {
    total_arrangements: total,
    unique_children: uniqueChildren.size,
    by_arrangement_type: byArrangementType,
    by_provider_type: byProviderType,
    by_experience_rating: byExperience,
    risk_assessment_rate: riskAssessmentRate,
    care_plan_shared_rate: carePlanSharedRate,
    medication_plan_shared_rate: medicationPlanSharedRate,
    dietary_needs_shared_rate: dietaryNeedsSharedRate,
    emergency_contacts_rate: emergencyContactsRate,
    child_prepared_rate: childPreparedRate,
    child_views_rate: childViewsRate,
    social_worker_approved_rate: socialWorkerApprovedRate,
    handover_rate: handoverRate,
    return_debrief_rate: returnDebriefRate,
    positive_experience_rate: positiveExperienceRate,
    negative_experience_rate: negativeExperienceRate,
    concerns_raised_rate: concernsRaisedRate,
    planned_count: plannedCount,
    emergency_count: emergencyCount,
    specialist_count: specialistCount,
    average_per_child: avgPerChild,
    average_break_duration_days: avgDuration,
    next_break_scheduled_rate: nextBreakRate,
  };
}

export function computeAlerts(
  rows: RespiteArrangementRow[],
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

  // Critical: Concerns raised during respite
  for (const r of rows) {
    if (r.concerns_raised) {
      alerts.push({
        type: "concerns_raised",
        severity: "critical",
        message: `Concerns raised during respite for ${r.child_name} at ${r.provider_name} (${r.arrangement_type}, ${r.break_date} to ${r.return_date})${r.concern_details ? ` — ${r.concern_details}` : ""}. All concerns about a child's welfare during respite must be fully investigated. Does this concern constitute a safeguarding referral? Has the designated safeguarding lead been informed? Should this provider continue to be used for respite? The child's views about what happened must be sought and their emotional wellbeing monitored following the experience`,
        record_id: r.id,
      });
    }
  }

  // Critical: No risk assessment
  for (const r of rows) {
    if (!r.risk_assessment_completed) {
      alerts.push({
        type: "no_risk_assessment",
        severity: "critical",
        message: `Respite arrangement for ${r.child_name} at ${r.provider_name} (${r.break_date}) has no completed risk assessment — CHR 2015 Reg 12 requires documented risk assessment before any placement away from the home. The Short Breaks Regulations 2011 require that the child's welfare is safeguarded. No child should be placed with a respite provider without a thorough assessment of risks including provider suitability, child-specific risks, transport, and emergency arrangements`,
        record_id: r.id,
      });
    }
  }

  // Critical: Care plan not shared
  for (const r of rows) {
    if (!r.care_plan_shared) {
      alerts.push({
        type: "care_plan_not_shared",
        severity: "critical",
        message: `Care plan not shared with respite provider ${r.provider_name} for ${r.child_name} (${r.break_date}) — the provider cannot meet this child's needs without their care plan. CHR 2015 Reg 7 requires care plans to be followed. This is a fundamental safeguarding requirement; the provider needs to understand the child's routines, triggers, communication needs, health requirements, and any specific care strategies`,
        record_id: r.id,
      });
    }
  }

  // Critical: Social worker not approved
  for (const r of rows) {
    if (!r.social_worker_approved) {
      alerts.push({
        type: "sw_not_approved",
        severity: "critical",
        message: `Social worker has not approved respite for ${r.child_name} at ${r.provider_name} (${r.break_date}) — respite placements constitute a change in living arrangements and must be approved by the allocated social worker. Children Act 1989 requires that the responsible authority is informed. Proceeding without approval may breach statutory requirements and compromise the child's care plan`,
        record_id: r.id,
      });
    }
  }

  // High: Child not prepared for break
  for (const r of rows) {
    if (!r.child_prepared && (PLANNED_TYPES as string[]).includes(r.arrangement_type)) {
      alerts.push({
        type: "child_not_prepared",
        severity: "high",
        message: `${r.child_name} was not prepared for planned respite at ${r.provider_name} (${r.break_date}) — for planned breaks, children should be gradually prepared including visiting the provider, meeting key people, understanding what to expect, and having their questions answered. Many looked-after children experience significant anxiety about changes to their living arrangements; inadequate preparation can trigger trauma responses and undermine the benefit of the break`,
        record_id: r.id,
      });
    }
  }

  // High: Repeated negative experiences
  const childNegativeMap = new Map<string, RespiteArrangementRow[]>();
  for (const r of rows) {
    if (r.child_experience_rating && (NEGATIVE_EXPERIENCES as string[]).includes(r.child_experience_rating)) {
      const key = r.child_name.toLowerCase().trim();
      if (!childNegativeMap.has(key)) childNegativeMap.set(key, []);
      childNegativeMap.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childNegativeMap) {
    if (childRows.length >= 2) {
      alerts.push({
        type: "repeated_negative_experience",
        severity: "high",
        message: `${childRows[0].child_name} has reported negative experiences across ${childRows.length} respite arrangements — the child's views must be taken seriously. Are the respite providers appropriate for this child? Are breaks being arranged at the child's request or imposed? Is the child experiencing separation anxiety? Does the matching of child to provider need reviewing? CHR 2015 Reg 7 requires that the care plan is informed by the child's experiences`,
      });
    }
  }

  // High: No return debrief pattern
  const debriefCount = rows.filter((r) => r.return_debrief).length;
  if (rows.length >= 5 && debriefCount / rows.length < 0.4) {
    alerts.push({
      type: "low_return_debrief_rate",
      severity: "high",
      message: `Return debrief completed for only ${Math.round((debriefCount / rows.length) * 100)}% of respite breaks — debriefing children after respite is essential for understanding their experience, identifying any concerns, and informing future arrangements. The child should be asked about their experience in a sensitive, age-appropriate way soon after returning. This also helps staff assess whether the respite achieved its intended purpose`,
    });
  }

  // High: High emergency respite ratio
  const emergencyCount = rows.filter((r) => (EMERGENCY_TYPES as string[]).includes(r.arrangement_type)).length;
  if (rows.length >= 5 && emergencyCount / rows.length > 0.5) {
    alerts.push({
      type: "high_emergency_ratio",
      severity: "high",
      message: `${Math.round((emergencyCount / rows.length) * 100)}% of respite arrangements are emergency placements — a high proportion of emergency respite suggests that planned respite is insufficient or that placement stability is an issue. Short Breaks Regulations 2011 expect that breaks are primarily planned as part of the child's care. Are there enough planned respite opportunities? Are placement pressures being managed proactively?`,
    });
  }

  // Medium: Low child views rate
  const viewsCount = rows.filter((r) => r.child_views_obtained).length;
  if (rows.length >= 5 && viewsCount / rows.length < 0.5) {
    alerts.push({
      type: "low_child_views",
      severity: "medium",
      message: `Child views obtained for only ${Math.round((viewsCount / rows.length) * 100)}% of respite arrangements — UNCRC Article 12 requires that children's views are sought. Short Breaks Regulations 2011 require ascertainment of wishes and feelings. Is the home consistently asking children about their preferences for respite — who they stay with, when breaks happen, and what activities they would like during breaks?`,
    });
  }

  // Medium: Low medication plan sharing
  const medCount = rows.filter((r) => r.medication_plan_shared).length;
  if (rows.length >= 5 && medCount / rows.length < 0.6) {
    alerts.push({
      type: "low_medication_plan_sharing",
      severity: "medium",
      message: `Medication plans shared for only ${Math.round((medCount / rows.length) * 100)}% of respite arrangements — medication errors are a serious safeguarding concern. Every child's medication plan must be shared with the respite provider, even if the child is not currently taking medication (so the provider knows). Where medication is prescribed, the provider must understand dosage, timing, storage, side effects, and what to do if doses are missed`,
    });
  }

  // Medium: No next break scheduled for children with regular respite
  const childBreakMap = new Map<string, RespiteArrangementRow[]>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    if (!childBreakMap.has(key)) childBreakMap.set(key, []);
    childBreakMap.get(key)!.push(r);
  }
  for (const [, childRows] of childBreakMap) {
    if (childRows.length >= 3) {
      const latestRow = childRows.sort((a, b) => new Date(b.break_date).getTime() - new Date(a.break_date).getTime())[0];
      if (!latestRow.next_break_date) {
        alerts.push({
          type: "no_next_break_scheduled",
          severity: "medium",
          message: `${latestRow.child_name} has had ${childRows.length} respite breaks but no next break is scheduled — for children who benefit from regular respite, continuity of provision is important. Short Breaks Regulations 2011 support planned, regular breaks. Is the next break being planned proactively with the child and their social worker?`,
        });
      }
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: RespiteArrangementRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const arrangementBreakdown = Object.entries(metrics.by_arrangement_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const providerBreakdown = Object.entries(metrics.by_provider_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const experienceBreakdown = Object.entries(metrics.by_experience_rating)
    .filter(([, count]) => count > 0)
    .map(([rating, count]) => `${rating}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_arrangements} respite ${metrics.total_arrangements === 1 ? "arrangement" : "arrangements"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Types: ${arrangementBreakdown || "none recorded"}. ` +
      `Providers: ${providerBreakdown || "none"}. ` +
      `Experience ratings: ${experienceBreakdown || "none rated"}. ` +
      `Planned: ${metrics.planned_count}. Emergency: ${metrics.emergency_count}. ` +
      `Specialist: ${metrics.specialist_count}. ` +
      `Average breaks per child: ${metrics.average_per_child}. ` +
      `Average duration: ${metrics.average_break_duration_days} days. ` +
      `Concerns raised: ${metrics.concerns_raised_rate}%. ` +
      `Positive experience rate: ${metrics.positive_experience_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Care plan shared rate: ${metrics.care_plan_shared_rate}%. ` +
        `Medication plan shared: ${metrics.medication_plan_shared_rate}%. ` +
        `Child prepared rate: ${metrics.child_prepared_rate}%. ` +
        `Child views rate: ${metrics.child_views_rate}%. ` +
        `SW approved rate: ${metrics.social_worker_approved_rate}%. ` +
        `Handover rate: ${metrics.handover_rate}%. ` +
        `Return debrief rate: ${metrics.return_debrief_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority respite alerts. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Care plan shared rate: ${metrics.care_plan_shared_rate}%. ` +
        `Child prepared rate: ${metrics.child_prepared_rate}%. ` +
        `Child views rate: ${metrics.child_views_rate}%. ` +
        `Handover rate: ${metrics.handover_rate}%. ` +
        `Return debrief rate: ${metrics.return_debrief_rate}%. ` +
        `Continue providing quality respite per Short Breaks Regulations 2011.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.concerns_raised_rate > 15 && metrics.total_arrangements > 5) {
    insights.push(
      `[reflect] Concerns have been raised in ${metrics.concerns_raised_rate}% of respite ` +
        `arrangements. While it is positive that concerns are being identified ` +
        `and reported (a culture of transparency is expected by SCCIF), this ` +
        `rate warrants careful review. Are the same providers generating ` +
        `repeated concerns? Are certain children more vulnerable during ` +
        `respite transitions? Are handover processes adequate? Is matching ` +
        `between children and providers sufficiently thorough? Each concern ` +
        `should be investigated individually, but patterns across multiple ` +
        `respite episodes may indicate systemic issues with the home's ` +
        `approach to respite planning. Short Breaks Regulations 2011 require ` +
        `that welfare is safeguarded — are current arrangements achieving this?`,
    );
  } else if (metrics.emergency_count > metrics.planned_count && metrics.total_arrangements > 3) {
    insights.push(
      `[reflect] Emergency respite (${metrics.emergency_count}) exceeds planned respite ` +
        `(${metrics.planned_count}). Short Breaks Regulations 2011 anticipate ` +
        `that respite is primarily planned, proactive, and part of the child's ` +
        `care plan. A preponderance of emergency respite suggests either ` +
        `insufficient planned provision, placement instability, or crisis-driven ` +
        `care. Is the home able to plan respite in advance, giving children ` +
        `time to prepare and look forward to breaks? Are placement pressures ` +
        `being escalated to commissioning managers? Emergency respite, while ` +
        `sometimes necessary, does not provide the same quality of experience ` +
        `as a well-planned break with a known provider.`,
    );
  } else if (metrics.child_prepared_rate < 50 && metrics.total_arrangements > 5) {
    insights.push(
      `[reflect] Children recorded as prepared for only ${metrics.child_prepared_rate}% of respite ` +
        `breaks. For looked-after children, any change in living arrangements ` +
        `— even temporary — can trigger anxiety rooted in past experiences ` +
        `of instability and loss. Preparation is not a tick-box exercise; it ` +
        `requires genuine engagement with the child about where they are going, ` +
        `who they will be with, what will happen, and when they will return. ` +
        `Where possible, pre-visits and introductions should be arranged. ` +
        `The child should have input into what they pack and what activities ` +
        `they would like. Is the home investing enough time in preparing ` +
        `children for respite transitions?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home evaluate whether respite breaks are ` +
        `achieving their intended purpose? Respite serves multiple functions: ` +
        `giving children new experiences, providing the home staff capacity ` +
        `to manage dynamics, supporting children with specific needs, and ` +
        `maintaining family connections. Short Breaks Regulations 2011 ` +
        `require that breaks are purposeful. Are outcomes from respite being ` +
        `fed back into care planning? Is the child's experience genuinely ` +
        `improving their wellbeing? Are providers being reviewed and the ` +
        `best matches identified? Respite should feel like a treat for the ` +
        `child, not a disruption to their routine.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    arrangementType?: ArrangementType;
    providerType?: ProviderType;
    limit?: number;
  },
): Promise<ServiceResult<RespiteArrangementRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_respite_arrangements") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.arrangementType) q = q.eq("arrangement_type", filters.arrangementType);
  if (filters?.providerType) q = q.eq("provider_type", filters.providerType);

  q = q.order("break_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<RespiteArrangementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_respite_arrangements") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  breakDate: string;
  returnDate: string;
  arrangementType: ArrangementType;
  providerName: string;
  providerType?: ProviderType;
  riskAssessmentCompleted?: boolean;
  carePlanShared?: boolean;
  medicationPlanShared?: boolean;
  dietaryNeedsShared?: boolean;
  emergencyContactsProvided?: boolean;
  childPrepared?: boolean;
  childViewsObtained?: boolean;
  socialWorkerApproved?: boolean;
  parentalConsent?: boolean | null;
  handoverCompleted?: boolean;
  returnDebrief?: boolean;
  childExperienceRating?: ExperienceRating | null;
  concernsRaised?: boolean;
  concernDetails?: string | null;
  nextBreakDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<RespiteArrangementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateRespiteArrangement({
    childName: input.childName,
    breakDate: input.breakDate,
    returnDate: input.returnDate,
    arrangementType: input.arrangementType,
    providerName: input.providerName,
    providerType: input.providerType,
    riskAssessmentCompleted: input.riskAssessmentCompleted,
    carePlanShared: input.carePlanShared,
    medicationPlanShared: input.medicationPlanShared,
    childPrepared: input.childPrepared,
    childViewsObtained: input.childViewsObtained,
    socialWorkerApproved: input.socialWorkerApproved,
    handoverCompleted: input.handoverCompleted,
    returnDebrief: input.returnDebrief,
    childExperienceRating: input.childExperienceRating,
    concernsRaised: input.concernsRaised,
    concernDetails: input.concernDetails,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_respite_arrangements") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      break_date: input.breakDate,
      return_date: input.returnDate,
      arrangement_type: input.arrangementType,
      provider_name: input.providerName,
      provider_type: input.providerType ?? "Another Residential Home",
      risk_assessment_completed: input.riskAssessmentCompleted ?? false,
      care_plan_shared: input.carePlanShared ?? false,
      medication_plan_shared: input.medicationPlanShared ?? false,
      dietary_needs_shared: input.dietaryNeedsShared ?? false,
      emergency_contacts_provided: input.emergencyContactsProvided ?? false,
      child_prepared: input.childPrepared ?? false,
      child_views_obtained: input.childViewsObtained ?? false,
      social_worker_approved: input.socialWorkerApproved ?? false,
      parental_consent: input.parentalConsent ?? null,
      handover_completed: input.handoverCompleted ?? false,
      return_debrief: input.returnDebrief ?? false,
      child_experience_rating: input.childExperienceRating ?? null,
      concerns_raised: input.concernsRaised ?? false,
      concern_details: input.concernDetails ?? null,
      next_break_date: input.nextBreakDate ?? null,
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
    breakDate: string;
    returnDate: string;
    arrangementType: ArrangementType;
    providerName: string;
    providerType: ProviderType;
    riskAssessmentCompleted: boolean;
    carePlanShared: boolean;
    medicationPlanShared: boolean;
    dietaryNeedsShared: boolean;
    emergencyContactsProvided: boolean;
    childPrepared: boolean;
    childViewsObtained: boolean;
    socialWorkerApproved: boolean;
    parentalConsent: boolean | null;
    handoverCompleted: boolean;
    returnDebrief: boolean;
    childExperienceRating: ExperienceRating | null;
    concernsRaised: boolean;
    concernDetails: string | null;
    nextBreakDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<RespiteArrangementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.breakDate !== undefined) mapped.break_date = updates.breakDate;
  if (updates.returnDate !== undefined) mapped.return_date = updates.returnDate;
  if (updates.arrangementType !== undefined) mapped.arrangement_type = updates.arrangementType;
  if (updates.providerName !== undefined) mapped.provider_name = updates.providerName;
  if (updates.providerType !== undefined) mapped.provider_type = updates.providerType;
  if (updates.riskAssessmentCompleted !== undefined) mapped.risk_assessment_completed = updates.riskAssessmentCompleted;
  if (updates.carePlanShared !== undefined) mapped.care_plan_shared = updates.carePlanShared;
  if (updates.medicationPlanShared !== undefined) mapped.medication_plan_shared = updates.medicationPlanShared;
  if (updates.dietaryNeedsShared !== undefined) mapped.dietary_needs_shared = updates.dietaryNeedsShared;
  if (updates.emergencyContactsProvided !== undefined) mapped.emergency_contacts_provided = updates.emergencyContactsProvided;
  if (updates.childPrepared !== undefined) mapped.child_prepared = updates.childPrepared;
  if (updates.childViewsObtained !== undefined) mapped.child_views_obtained = updates.childViewsObtained;
  if (updates.socialWorkerApproved !== undefined) mapped.social_worker_approved = updates.socialWorkerApproved;
  if (updates.parentalConsent !== undefined) mapped.parental_consent = updates.parentalConsent;
  if (updates.handoverCompleted !== undefined) mapped.handover_completed = updates.handoverCompleted;
  if (updates.returnDebrief !== undefined) mapped.return_debrief = updates.returnDebrief;
  if (updates.childExperienceRating !== undefined) mapped.child_experience_rating = updates.childExperienceRating;
  if (updates.concernsRaised !== undefined) mapped.concerns_raised = updates.concernsRaised;
  if (updates.concernDetails !== undefined) mapped.concern_details = updates.concernDetails;
  if (updates.nextBreakDate !== undefined) mapped.next_break_date = updates.nextBreakDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_respite_arrangements") as SB)
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

  const { error } = await (client.from("cs_respite_arrangements") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
