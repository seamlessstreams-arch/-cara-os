// ==============================================================================
// CORNERSTONE -- SLEEP SUPPORT & WELLBEING SERVICE
// Tracks sleep support and wellbeing for looked-after children including
// sleep assessments, sleep diary entries, bedtime routine reviews, sleep
// environment audits, melatonin reviews, sleep hygiene education, night
// disturbance logs, nightmare/night terror records, sleep pattern analysis,
// GP referrals, specialist referrals, waking night observations, and
// review meetings.
//
// Covers: Sleep quality monitoring, bedtime and wake time tracking,
// estimated sleep hours, night disturbance frequency and type recording,
// medication involvement (melatonin etc), sleep environment suitability
// assessment, screen time management, routine adherence tracking,
// young person voice and input, underlying cause identification (trauma,
// anxiety, ADHD etc), referral management, specialist service coordination,
// and review scheduling.
//
// UK Regulatory Framework:
// CHR 2015 Reg 10 (health and wellbeing),
// NICE CG158 (sleep problems in CYP),
// CHR 2015 Reg 12 (children's safety — night supervision),
// SCCIF: Health — "The home promotes good sleep hygiene."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "Sleep Assessment",
  "Sleep Diary Entry",
  "Bedtime Routine Review",
  "Sleep Environment Audit",
  "Melatonin Review",
  "Sleep Hygiene Education",
  "Night Disturbance Log",
  "Nightmare/Night Terror Record",
  "Sleep Pattern Analysis",
  "GP Referral",
  "Specialist Referral",
  "Waking Night Observation",
  "Review Meeting",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const SLEEP_QUALITIES = [
  "Very Poor",
  "Poor",
  "Fair",
  "Good",
  "Very Good",
] as const;
export type SleepQuality = (typeof SLEEP_QUALITIES)[number];

export const RECORD_STATUSES = [
  "Active",
  "Monitoring",
  "Improving",
  "Resolved",
] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const CLINICAL_RECORD_TYPES: RecordType[] = [
  "Sleep Assessment",
  "Melatonin Review",
  "GP Referral",
  "Specialist Referral",
  "Sleep Pattern Analysis",
];

export const DAILY_RECORD_TYPES: RecordType[] = [
  "Sleep Diary Entry",
  "Night Disturbance Log",
  "Nightmare/Night Terror Record",
  "Waking Night Observation",
];

export const INTERVENTION_RECORD_TYPES: RecordType[] = [
  "Bedtime Routine Review",
  "Sleep Environment Audit",
  "Sleep Hygiene Education",
  "Review Meeting",
];

// Sleep quality numeric mapping for trend calculation
const SLEEP_QUALITY_NUMERIC: Record<string, number> = {
  "Very Poor": 1,
  "Poor": 2,
  "Fair": 3,
  "Good": 4,
  "Very Good": 5,
};

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "Sleep Assessment", label: "Sleep Assessment" },
  { type: "Sleep Diary Entry", label: "Sleep Diary Entry" },
  { type: "Bedtime Routine Review", label: "Bedtime Routine Review" },
  { type: "Sleep Environment Audit", label: "Sleep Environment Audit" },
  { type: "Melatonin Review", label: "Melatonin Review" },
  { type: "Sleep Hygiene Education", label: "Sleep Hygiene Education" },
  { type: "Night Disturbance Log", label: "Night Disturbance Log" },
  { type: "Nightmare/Night Terror Record", label: "Nightmare / Night Terror Record" },
  { type: "Sleep Pattern Analysis", label: "Sleep Pattern Analysis" },
  { type: "GP Referral", label: "GP Referral" },
  { type: "Specialist Referral", label: "Specialist Referral" },
  { type: "Waking Night Observation", label: "Waking Night Observation" },
  { type: "Review Meeting", label: "Review Meeting" },
];

export const SLEEP_QUALITY_LABELS: { quality: SleepQuality; label: string }[] = [
  { quality: "Very Poor", label: "Very Poor" },
  { quality: "Poor", label: "Poor" },
  { quality: "Fair", label: "Fair" },
  { quality: "Good", label: "Good" },
  { quality: "Very Good", label: "Very Good" },
];

export const RECORD_STATUS_LABELS: { status: RecordStatus; label: string }[] = [
  { status: "Active", label: "Active" },
  { status: "Monitoring", label: "Monitoring" },
  { status: "Improving", label: "Improving" },
  { status: "Resolved", label: "Resolved" },
];

// -- Row type -----------------------------------------------------------------

export interface SleepSupportRow {
  id: string;
  home_id: string;
  child_name: string;
  record_date: string;
  recorder_name: string;
  record_type: RecordType;
  sleep_quality: SleepQuality;
  bedtime: string | null;
  wake_time: string | null;
  estimated_hours: number | null;
  night_disturbances: number | null;
  disturbance_type: string | null;
  medication_involved: boolean;
  medication_type: string | null;
  sleep_environment_suitable: boolean;
  screen_time_managed: boolean;
  routine_followed: boolean;
  young_person_input: boolean;
  underlying_cause_identified: string | null;
  referral_made: boolean;
  specialist_service: string | null;
  next_review_date: string | null;
  status: RecordStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateSleepSupport(input: {
  childName?: string;
  recordDate?: string;
  recorderName?: string;
  recordType?: string;
  sleepQuality?: string;
  estimatedHours?: number | null;
  nightDisturbances?: number | null;
  medicationInvolved?: boolean;
  medicationType?: string | null;
  referralMade?: boolean;
  specialistService?: string | null;
  nextReviewDate?: string | null;
  status?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
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

  if (!input.recorderName || input.recorderName.trim().length === 0) {
    errors.push("Recorder name is required");
  }

  if (!input.recordType || !(RECORD_TYPES as readonly string[]).includes(input.recordType)) {
    errors.push(`Record type must be one of: ${RECORD_TYPES.join(", ")}`);
  }

  if (
    input.sleepQuality &&
    !(SLEEP_QUALITIES as readonly string[]).includes(input.sleepQuality)
  ) {
    errors.push(`Sleep quality must be one of: ${SLEEP_QUALITIES.join(", ")}`);
  }

  if (input.status && !(RECORD_STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${RECORD_STATUSES.join(", ")}`);
  }

  // Business rule: Estimated hours should be reasonable
  if (input.estimatedHours !== null && input.estimatedHours !== undefined) {
    if (input.estimatedHours < 0) {
      errors.push("Estimated hours cannot be negative");
    }
    if (input.estimatedHours > 24) {
      errors.push("Estimated hours cannot exceed 24 hours");
    }
  }

  // Business rule: Night disturbances should be non-negative
  if (input.nightDisturbances !== null && input.nightDisturbances !== undefined) {
    if (input.nightDisturbances < 0) {
      errors.push("Night disturbances cannot be negative");
    }
    if (input.nightDisturbances > 50) {
      errors.push("Night disturbances count seems unreasonably high — please verify");
    }
  }

  // Business rule: Medication involved must have medication type
  if (input.medicationInvolved && (!input.medicationType || input.medicationType.trim().length === 0)) {
    errors.push("Medication type is required when medication is involved");
  }

  // Business rule: Referral made must have specialist service
  if (input.referralMade && (!input.specialistService || input.specialistService.trim().length === 0)) {
    errors.push("Specialist service is required when a referral has been made");
  }

  // Business rule: Next review date should be in the future
  if (input.nextReviewDate) {
    const nextDate = new Date(input.nextReviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(nextDate.getTime())) {
      errors.push("Next review date must be a valid date");
    } else if (nextDate < today) {
      errors.push("Next review date should not be in the past");
    }
  }

  // Business rule: Melatonin review should have medication involved
  if (input.recordType === "Melatonin Review" && !input.medicationInvolved) {
    errors.push("Melatonin review records should indicate medication involvement");
  }

  // Business rule: Night disturbance log should have disturbance count
  if (
    input.recordType === "Night Disturbance Log" &&
    (input.nightDisturbances === null || input.nightDisturbances === undefined)
  ) {
    errors.push("Night disturbance logs require the number of disturbances to be recorded");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: SleepSupportRow[],
): {
  total_records: number;
  unique_children: number;
  by_record_type: Record<string, number>;
  by_sleep_quality: Record<string, number>;
  by_status: Record<string, number>;
  average_sleep_quality: number;
  average_estimated_hours: number;
  average_disturbances: number;
  medication_rate: number;
  environment_suitable_rate: number;
  screen_time_managed_rate: number;
  routine_followed_rate: number;
  young_person_input_rate: number;
  referral_rate: number;
  poor_sleep_rate: number;
  good_sleep_rate: number;
  children_with_disturbances: number;
  overdue_reviews: number;
  active_records: number;
  clinical_record_count: number;
  sleep_quality_trend: string;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows) byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Sleep quality breakdown
  const bySleepQuality: Record<string, number> = {};
  for (const sq of SLEEP_QUALITIES) bySleepQuality[sq] = 0;
  for (const r of rows) bySleepQuality[r.sleep_quality] = (bySleepQuality[r.sleep_quality] || 0) + 1;

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const s of RECORD_STATUSES) byStatus[s] = 0;
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  // Average sleep quality (numeric)
  const qualityValues = rows.map((r) => SLEEP_QUALITY_NUMERIC[r.sleep_quality] ?? 0).filter((v) => v > 0);
  const avgSleepQuality = qualityValues.length > 0
    ? Math.round((qualityValues.reduce((a, b) => a + b, 0) / qualityValues.length) * 10) / 10
    : 0;

  // Average estimated hours
  const hoursValues = rows.filter((r) => r.estimated_hours !== null).map((r) => r.estimated_hours!);
  const avgEstimatedHours = hoursValues.length > 0
    ? Math.round((hoursValues.reduce((a, b) => a + b, 0) / hoursValues.length) * 10) / 10
    : 0;

  // Average disturbances
  const disturbanceValues = rows.filter((r) => r.night_disturbances !== null).map((r) => r.night_disturbances!);
  const avgDisturbances = disturbanceValues.length > 0
    ? Math.round((disturbanceValues.reduce((a, b) => a + b, 0) / disturbanceValues.length) * 10) / 10
    : 0;

  // Boolean rates
  const pct = (count: number) => total > 0 ? Math.round((count / total) * 1000) / 10 : 0;

  const medicationRate = pct(rows.filter((r) => r.medication_involved).length);
  const environmentRate = pct(rows.filter((r) => r.sleep_environment_suitable).length);
  const screenTimeRate = pct(rows.filter((r) => r.screen_time_managed).length);
  const routineRate = pct(rows.filter((r) => r.routine_followed).length);
  const ypInputRate = pct(rows.filter((r) => r.young_person_input).length);
  const referralRate = pct(rows.filter((r) => r.referral_made).length);

  // Poor sleep rate (Very Poor or Poor)
  const poorSleep = rows.filter(
    (r) => r.sleep_quality === "Very Poor" || r.sleep_quality === "Poor",
  );
  const poorSleepRate = pct(poorSleep.length);

  // Good sleep rate (Good or Very Good)
  const goodSleep = rows.filter(
    (r) => r.sleep_quality === "Good" || r.sleep_quality === "Very Good",
  );
  const goodSleepRate = pct(goodSleep.length);

  // Children with disturbances
  const childrenWithDisturbances = new Set(
    rows.filter((r) => r.night_disturbances !== null && r.night_disturbances > 0)
      .map((r) => r.child_name.toLowerCase().trim()),
  ).size;

  // Overdue reviews
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueReviews = rows.filter((r) => {
    if (!r.next_review_date) return false;
    const reviewDate = new Date(r.next_review_date);
    return reviewDate < today && (r.status === "Active" || r.status === "Monitoring");
  }).length;

  // Active records count
  const activeRecords = rows.filter((r) => r.status === "Active" || r.status === "Monitoring").length;

  // Clinical record count
  const clinicalRecordCount = rows.filter(
    (r) => (CLINICAL_RECORD_TYPES as string[]).includes(r.record_type),
  ).length;

  // Sleep quality trend (compare first half to second half of records by date)
  let sleepQualityTrend = "stable";
  if (rows.length >= 4) {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime(),
    );
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const firstAvg = firstHalf.reduce((s, r) => s + (SLEEP_QUALITY_NUMERIC[r.sleep_quality] ?? 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, r) => s + (SLEEP_QUALITY_NUMERIC[r.sleep_quality] ?? 0), 0) / secondHalf.length;

    if (secondAvg - firstAvg > 0.5) sleepQualityTrend = "improving";
    else if (firstAvg - secondAvg > 0.5) sleepQualityTrend = "declining";
  }

  return {
    total_records: total,
    unique_children: uniqueChildren.size,
    by_record_type: byRecordType,
    by_sleep_quality: bySleepQuality,
    by_status: byStatus,
    average_sleep_quality: avgSleepQuality,
    average_estimated_hours: avgEstimatedHours,
    average_disturbances: avgDisturbances,
    medication_rate: medicationRate,
    environment_suitable_rate: environmentRate,
    screen_time_managed_rate: screenTimeRate,
    routine_followed_rate: routineRate,
    young_person_input_rate: ypInputRate,
    referral_rate: referralRate,
    poor_sleep_rate: poorSleepRate,
    good_sleep_rate: goodSleepRate,
    children_with_disturbances: childrenWithDisturbances,
    overdue_reviews: overdueReviews,
    active_records: activeRecords,
    clinical_record_count: clinicalRecordCount,
    sleep_quality_trend: sleepQualityTrend,
  };
}

export function computeAlerts(
  rows: SleepSupportRow[],
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

  const activeRows = rows.filter((r) => r.status === "Active" || r.status === "Monitoring");

  // Critical: Very poor sleep quality persisting
  const childSleepMap = new Map<string, SleepSupportRow[]>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    if (!childSleepMap.has(key)) childSleepMap.set(key, []);
    childSleepMap.get(key)!.push(r);
  }

  for (const [, childRows] of childSleepMap) {
    const recentRows = childRows
      .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())
      .slice(0, 5);
    const veryPoorCount = recentRows.filter((r) => r.sleep_quality === "Very Poor").length;
    if (veryPoorCount >= 3) {
      alerts.push({
        type: "persistent_very_poor_sleep",
        severity: "critical",
        message: `${recentRows[0].child_name} has recorded "Very Poor" sleep quality in ${veryPoorCount} of the last ${recentRows.length} entries — NICE CG158 recommends urgent assessment for persistent sleep difficulties in children and young people, as chronic sleep deprivation significantly impacts physical health, mental wellbeing, and educational outcomes`,
        record_id: recentRows[0].id,
      });
    }
  }

  // Critical: Very low estimated hours for age-appropriate needs
  for (const r of rows) {
    if (r.estimated_hours !== null && r.estimated_hours < 4) {
      alerts.push({
        type: "critically_low_sleep_hours",
        severity: "critical",
        message: `${r.child_name} recorded only ${r.estimated_hours} hours of sleep on ${r.record_date} — this is critically below recommended levels for any age group per NHS and NICE guidelines; consider urgent GP review and whether safeguarding or wellbeing concerns are contributing factors`,
        record_id: r.id,
      });
    }
  }

  // Critical: Medication without review
  for (const r of activeRows) {
    if (r.medication_involved && r.record_type !== "Melatonin Review") {
      const childMedReviews = rows.filter(
        (mr) =>
          mr.child_name.toLowerCase().trim() === r.child_name.toLowerCase().trim() &&
          mr.record_type === "Melatonin Review",
      );
      if (childMedReviews.length === 0) {
        alerts.push({
          type: "medication_no_review",
          severity: "critical",
          message: `${r.child_name} is on sleep medication but no melatonin/medication review has been recorded — NICE CG158 requires regular review of sleep medication in children and young people to assess effectiveness and side effects`,
          record_id: r.id,
        });
      }
    }
  }

  // High: Sleep environment not suitable
  for (const r of activeRows) {
    if (!r.sleep_environment_suitable) {
      alerts.push({
        type: "environment_not_suitable",
        severity: "high",
        message: `Sleep environment for ${r.child_name} has been assessed as not suitable on ${r.record_date} — CHR 2015 Reg 10 requires the home to promote health and wellbeing, and an appropriate sleep environment is fundamental to good sleep hygiene`,
        record_id: r.id,
      });
    }
  }

  // High: High frequency of night disturbances
  for (const r of rows) {
    if (r.night_disturbances !== null && r.night_disturbances >= 5) {
      alerts.push({
        type: "high_disturbance_count",
        severity: "high",
        message: `${r.child_name} experienced ${r.night_disturbances} night disturbances on ${r.record_date} — frequent night disturbances may indicate underlying trauma, anxiety, or medical conditions requiring specialist assessment per NICE CG158`,
        record_id: r.id,
      });
    }
  }

  // High: Screen time not managed for active records
  const noScreenManagement = activeRows.filter((r) => !r.screen_time_managed);
  if (noScreenManagement.length >= 3) {
    alerts.push({
      type: "screen_time_not_managed",
      severity: "high",
      message: `${noScreenManagement.length} active sleep records indicate screen time is not being managed — NICE CG158 identifies excessive screen use before bed as a significant contributor to sleep difficulties in children and young people; the home should implement and monitor screen-free periods before bedtime`,
    });
  }

  // High: Routine not followed pattern
  const noRoutine = activeRows.filter((r) => !r.routine_followed);
  if (noRoutine.length >= 3) {
    alerts.push({
      type: "routine_not_followed",
      severity: "high",
      message: `${noRoutine.length} active records indicate bedtime routines are not being followed — consistent routines are a cornerstone of good sleep hygiene per NICE CG158, and CHR 2015 Reg 10 requires the home to actively promote health and wellbeing`,
    });
  }

  // High: No young person input
  const noInput = activeRows.filter((r) => !r.young_person_input);
  if (noInput.length >= 3) {
    alerts.push({
      type: "no_young_person_input",
      severity: "high",
      message: `${noInput.length} sleep support records have no young person input recorded — CHR 2015 Reg 7 requires the child's views to be sought and taken into account; understanding what the child thinks is affecting their sleep is essential to effective support`,
    });
  }

  // Medium: Overdue review dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of activeRows) {
    if (r.next_review_date) {
      const nextDate = new Date(r.next_review_date);
      if (nextDate < today) {
        alerts.push({
          type: "overdue_review",
          severity: "medium",
          message: `Sleep support review for ${r.child_name} was due on ${r.next_review_date} and is now overdue — schedule a review to assess whether the current sleep support plan remains effective`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: No referral made for persistent poor sleep
  for (const [, childRows] of childSleepMap) {
    const poorRows = childRows.filter(
      (r) => r.sleep_quality === "Very Poor" || r.sleep_quality === "Poor",
    );
    const anyReferral = childRows.some((r) => r.referral_made);
    if (poorRows.length >= 3 && !anyReferral) {
      alerts.push({
        type: "no_referral_persistent_poor",
        severity: "medium",
        message: `${childRows[0].child_name} has ${poorRows.length} records of poor or very poor sleep but no referral has been made — NICE CG158 recommends referral to specialist services when sleep difficulties persist despite initial interventions`,
      });
    }
  }

  // Medium: Underlying cause identified but no action
  for (const r of activeRows) {
    if (r.underlying_cause_identified && !r.referral_made && r.status === "Active") {
      alerts.push({
        type: "cause_identified_no_action",
        severity: "medium",
        message: `An underlying cause (${r.underlying_cause_identified}) has been identified for ${r.child_name}'s sleep difficulties but no referral has been made — consider whether specialist input is needed to address the root cause`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateAriaInsights(
  rows: SleepSupportRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_record_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const qualityBreakdown = Object.entries(metrics.by_sleep_quality)
    .filter(([, count]) => count > 0)
    .map(([quality, count]) => `${quality}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} sleep support ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Active/monitoring: ${metrics.active_records}. ` +
      `Record types: ${typeBreakdown || "none recorded"}. ` +
      `Sleep quality distribution: ${qualityBreakdown || "none recorded"}. ` +
      `Average sleep quality: ${metrics.average_sleep_quality}/5. ` +
      `Average hours: ${metrics.average_estimated_hours}. ` +
      `Average disturbances: ${metrics.average_disturbances}. ` +
      `Sleep quality trend: ${metrics.sleep_quality_trend}. ` +
      `Overdue reviews: ${metrics.overdue_reviews}.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Poor/very poor sleep: ${metrics.poor_sleep_rate}%. ` +
        `Good/very good sleep: ${metrics.good_sleep_rate}%. ` +
        `Environment suitable: ${metrics.environment_suitable_rate}%. ` +
        `Screen time managed: ${metrics.screen_time_managed_rate}%. ` +
        `Routine followed: ${metrics.routine_followed_rate}%. ` +
        `Young person input: ${metrics.young_person_input_rate}%. ` +
        `Medication involved: ${metrics.medication_rate}%. ` +
        `Referral rate: ${metrics.referral_rate}%. ` +
        `Children with disturbances: ${metrics.children_with_disturbances}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority sleep support alerts. ` +
        `Poor/very poor sleep: ${metrics.poor_sleep_rate}%. ` +
        `Good/very good sleep: ${metrics.good_sleep_rate}%. ` +
        `Environment suitable: ${metrics.environment_suitable_rate}%. ` +
        `Screen time managed: ${metrics.screen_time_managed_rate}%. ` +
        `Routine followed: ${metrics.routine_followed_rate}%. ` +
        `Young person input: ${metrics.young_person_input_rate}%. ` +
        `Continue promoting good sleep hygiene per CHR 2015 Reg 10.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.poor_sleep_rate > 40 && metrics.total_records > 0) {
    insights.push(
      `[reflect] ${metrics.poor_sleep_rate}% of sleep records show poor or very poor quality. ` +
        `Is the home doing enough to address the root causes of sleep difficulties? ` +
        `NICE CG158 identifies trauma, anxiety, ADHD, environmental factors, and inconsistent ` +
        `routines as common contributors to sleep problems in children. For looked-after children, ` +
        `the impact of adverse childhood experiences on sleep regulation is well-documented. ` +
        `Are individual sleep plans being developed? Is the home environment conducive to good ` +
        `sleep — quiet, dark, comfortable? Are staff trained in sleep hygiene approaches? ` +
        `Has the home considered whether the current waking night provision is adequate?`,
    );
  } else if (metrics.routine_followed_rate < 50 && metrics.total_records > 0) {
    insights.push(
      `[reflect] Bedtime routines are only being followed in ${metrics.routine_followed_rate}% of records. ` +
        `Consistent routines are one of the most effective non-pharmacological interventions ` +
        `for sleep difficulties per NICE CG158. For looked-after children who may have ` +
        `experienced chaotic or unpredictable home environments, a reliable bedtime routine ` +
        `provides safety and predictability. Is the home investing in co-created, personalised ` +
        `bedtime routines that young people have helped design? Are routines being consistently ` +
        `maintained even when staffing is stretched? Is there a shared understanding among all ` +
        `staff of each child's routine?`,
    );
  } else if (metrics.screen_time_managed_rate < 50 && metrics.total_records > 0) {
    insights.push(
      `[reflect] Screen time is being managed in only ${metrics.screen_time_managed_rate}% of records. ` +
        `Research consistently identifies screen use before bed as a major contributor to ` +
        `sleep onset difficulties. NICE CG158 recommends limiting screen exposure in the ` +
        `hour before bedtime. For children in residential care, where devices may be used ` +
        `for social connection with family and friends, balancing screen access with sleep ` +
        `needs requires careful, empathetic negotiation. Does the home have clear, ` +
        `co-produced agreements about screen use in the evenings? Are there appealing ` +
        `alternative activities to replace screen time?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home balance promoting good sleep hygiene with respecting ` +
        `young people's growing autonomy? Sleep support should be collaborative, not ` +
        `controlling. CHR 2015 Reg 34 prohibits punitive approaches, so taking devices ` +
        `or imposing strict bedtimes without agreement would not be appropriate. Instead, ` +
        `the home should work with each young person to understand their sleep needs and ` +
        `develop strategies that feel supportive rather than restrictive. SCCIF inspectors ` +
        `look for evidence that the home promotes good sleep hygiene through positive ` +
        `relationships and genuine concern for wellbeing.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    sleepQuality?: SleepQuality;
    status?: RecordStatus;
    limit?: number;
  },
): Promise<ServiceResult<SleepSupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_sleep_support") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);
  if (filters?.sleepQuality) q = q.eq("sleep_quality", filters.sleepQuality);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<SleepSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_sleep_support") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  recordDate: string;
  recorderName: string;
  recordType: RecordType;
  sleepQuality?: SleepQuality;
  bedtime?: string | null;
  wakeTime?: string | null;
  estimatedHours?: number | null;
  nightDisturbances?: number | null;
  disturbanceType?: string | null;
  medicationInvolved?: boolean;
  medicationType?: string | null;
  sleepEnvironmentSuitable?: boolean;
  screenTimeManaged?: boolean;
  routineFollowed?: boolean;
  youngPersonInput?: boolean;
  underlyingCauseIdentified?: string | null;
  referralMade?: boolean;
  specialistService?: string | null;
  nextReviewDate?: string | null;
  status?: RecordStatus;
  notes?: string | null;
}): Promise<ServiceResult<SleepSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateSleepSupport({
    childName: input.childName,
    recordDate: input.recordDate,
    recorderName: input.recorderName,
    recordType: input.recordType,
    sleepQuality: input.sleepQuality,
    estimatedHours: input.estimatedHours,
    nightDisturbances: input.nightDisturbances,
    medicationInvolved: input.medicationInvolved,
    medicationType: input.medicationType,
    referralMade: input.referralMade,
    specialistService: input.specialistService,
    nextReviewDate: input.nextReviewDate,
    status: input.status,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_sleep_support") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      record_date: input.recordDate,
      recorder_name: input.recorderName,
      record_type: input.recordType,
      sleep_quality: input.sleepQuality ?? "Fair",
      bedtime: input.bedtime ?? null,
      wake_time: input.wakeTime ?? null,
      estimated_hours: input.estimatedHours ?? null,
      night_disturbances: input.nightDisturbances ?? null,
      disturbance_type: input.disturbanceType ?? null,
      medication_involved: input.medicationInvolved ?? false,
      medication_type: input.medicationType ?? null,
      sleep_environment_suitable: input.sleepEnvironmentSuitable ?? true,
      screen_time_managed: input.screenTimeManaged ?? false,
      routine_followed: input.routineFollowed ?? false,
      young_person_input: input.youngPersonInput ?? false,
      underlying_cause_identified: input.underlyingCauseIdentified ?? null,
      referral_made: input.referralMade ?? false,
      specialist_service: input.specialistService ?? null,
      next_review_date: input.nextReviewDate ?? null,
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
    recordDate: string;
    recorderName: string;
    recordType: RecordType;
    sleepQuality: SleepQuality;
    bedtime: string | null;
    wakeTime: string | null;
    estimatedHours: number | null;
    nightDisturbances: number | null;
    disturbanceType: string | null;
    medicationInvolved: boolean;
    medicationType: string | null;
    sleepEnvironmentSuitable: boolean;
    screenTimeManaged: boolean;
    routineFollowed: boolean;
    youngPersonInput: boolean;
    underlyingCauseIdentified: string | null;
    referralMade: boolean;
    specialistService: string | null;
    nextReviewDate: string | null;
    status: RecordStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<SleepSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.recorderName !== undefined) mapped.recorder_name = updates.recorderName;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.sleepQuality !== undefined) mapped.sleep_quality = updates.sleepQuality;
  if (updates.bedtime !== undefined) mapped.bedtime = updates.bedtime;
  if (updates.wakeTime !== undefined) mapped.wake_time = updates.wakeTime;
  if (updates.estimatedHours !== undefined) mapped.estimated_hours = updates.estimatedHours;
  if (updates.nightDisturbances !== undefined) mapped.night_disturbances = updates.nightDisturbances;
  if (updates.disturbanceType !== undefined) mapped.disturbance_type = updates.disturbanceType;
  if (updates.medicationInvolved !== undefined) mapped.medication_involved = updates.medicationInvolved;
  if (updates.medicationType !== undefined) mapped.medication_type = updates.medicationType;
  if (updates.sleepEnvironmentSuitable !== undefined) mapped.sleep_environment_suitable = updates.sleepEnvironmentSuitable;
  if (updates.screenTimeManaged !== undefined) mapped.screen_time_managed = updates.screenTimeManaged;
  if (updates.routineFollowed !== undefined) mapped.routine_followed = updates.routineFollowed;
  if (updates.youngPersonInput !== undefined) mapped.young_person_input = updates.youngPersonInput;
  if (updates.underlyingCauseIdentified !== undefined) mapped.underlying_cause_identified = updates.underlyingCauseIdentified;
  if (updates.referralMade !== undefined) mapped.referral_made = updates.referralMade;
  if (updates.specialistService !== undefined) mapped.specialist_service = updates.specialistService;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_sleep_support") as SB)
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

  const { error } = await (client.from("cs_sleep_support") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
