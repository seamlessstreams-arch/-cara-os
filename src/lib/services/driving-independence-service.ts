// ==============================================================================
// CARA -- DRIVING LESSONS & TRANSPORT INDEPENDENCE SERVICE
// Tracks provisional licence applications, theory and practical test preparation,
// driving lessons, CBT (moped/scooter), car insurance research, road safety
// education, cycling proficiency, bus/train journey planning, and travel card
// applications for care leavers and looked-after young people approaching
// independence.
//
// Covers: Activity type and provider tracking, lesson numbering and funding
// oversight, cost monitoring, young person engagement, personal adviser involvement,
// pathway plan linkage, social worker notification, milestone and progress tracking,
// pass/fail rates for theory and practical tests, and transport independence
// preparation across multiple modalities (driving, cycling, public transport).
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (independence preparation),
// Children (Leaving Care) Act 2000,
// DfE guidance on supporting care leavers,
// SCCIF: Experiences & progress — "Young people are prepared for independence."
// DVLA provisional licence at 17, theory test, CBT (moped).
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const ACTIVITY_TYPES = [
  "Provisional Licence Application",
  "Theory Test Preparation",
  "Theory Test — Booked",
  "Theory Test — Passed",
  "Theory Test — Failed",
  "Driving Lesson",
  "Mock Test",
  "Practical Test — Booked",
  "Practical Test — Passed",
  "Practical Test — Failed",
  "CBT — Moped/Scooter",
  "Car Insurance Research",
  "Road Safety Education",
  "Cycling Proficiency",
  "Bus/Train Journey Planning",
  "Travel Card Application",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const FUNDING_SOURCES = [
  "Local Authority",
  "Leaving Care Grant",
  "Personal Savings",
  "Charity/Grant",
  "Employer",
  "Mixed",
  "Not Applicable",
] as const;
export type FundingSource = (typeof FUNDING_SOURCES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const DRIVING_TEST_ACTIVITIES: ActivityType[] = [
  "Theory Test — Passed",
  "Theory Test — Failed",
  "Practical Test — Passed",
  "Practical Test — Failed",
];

export const THEORY_ACTIVITIES: ActivityType[] = [
  "Theory Test Preparation",
  "Theory Test — Booked",
  "Theory Test — Passed",
  "Theory Test — Failed",
];

export const PRACTICAL_ACTIVITIES: ActivityType[] = [
  "Driving Lesson",
  "Mock Test",
  "Practical Test — Booked",
  "Practical Test — Passed",
  "Practical Test — Failed",
];

export const LICENCE_MILESTONE_ACTIVITIES: ActivityType[] = [
  "Provisional Licence Application",
  "Theory Test — Passed",
  "Practical Test — Passed",
  "CBT — Moped/Scooter",
];

export const PUBLIC_TRANSPORT_ACTIVITIES: ActivityType[] = [
  "Bus/Train Journey Planning",
  "Travel Card Application",
];

export const ALTERNATIVE_TRANSPORT_ACTIVITIES: ActivityType[] = [
  "Cycling Proficiency",
  "Bus/Train Journey Planning",
  "Travel Card Application",
  "Road Safety Education",
];

// -- Label maps ---------------------------------------------------------------

export const ACTIVITY_TYPE_LABELS: { type: ActivityType; label: string }[] = [
  { type: "Provisional Licence Application", label: "Provisional Licence Application" },
  { type: "Theory Test Preparation", label: "Theory Test Preparation" },
  { type: "Theory Test — Booked", label: "Theory Test — Booked" },
  { type: "Theory Test — Passed", label: "Theory Test — Passed" },
  { type: "Theory Test — Failed", label: "Theory Test — Failed" },
  { type: "Driving Lesson", label: "Driving Lesson" },
  { type: "Mock Test", label: "Mock Test" },
  { type: "Practical Test — Booked", label: "Practical Test — Booked" },
  { type: "Practical Test — Passed", label: "Practical Test — Passed" },
  { type: "Practical Test — Failed", label: "Practical Test — Failed" },
  { type: "CBT — Moped/Scooter", label: "CBT — Moped/Scooter" },
  { type: "Car Insurance Research", label: "Car Insurance Research" },
  { type: "Road Safety Education", label: "Road Safety Education" },
  { type: "Cycling Proficiency", label: "Cycling Proficiency" },
  { type: "Bus/Train Journey Planning", label: "Bus/Train Journey Planning" },
  { type: "Travel Card Application", label: "Travel Card Application" },
];

export const FUNDING_SOURCE_LABELS: { source: FundingSource; label: string }[] = [
  { source: "Local Authority", label: "Local Authority" },
  { source: "Leaving Care Grant", label: "Leaving Care Grant" },
  { source: "Personal Savings", label: "Personal Savings" },
  { source: "Charity/Grant", label: "Charity/Grant" },
  { source: "Employer", label: "Employer" },
  { source: "Mixed", label: "Mixed" },
  { source: "Not Applicable", label: "Not Applicable" },
];

// -- Row type -----------------------------------------------------------------

export interface DrivingIndependenceRow {
  id: string;
  home_id: string;
  young_person_name: string;
  record_date: string;
  supporting_staff: string;
  activity_type: ActivityType;
  provider_name: string | null;
  lesson_number: number | null;
  total_lessons_funded: number | null;
  funding_source: FundingSource;
  cost_per_lesson: number | null;
  total_spent: number | null;
  young_person_engaged: boolean;
  personal_adviser_involved: boolean;
  pathway_plan_linked: boolean;
  social_worker_informed: boolean;
  next_milestone: string | null;
  next_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateDrivingIndependence(input: {
  youngPersonName?: string;
  recordDate?: string;
  supportingStaff?: string;
  activityType?: string;
  fundingSource?: string;
  lessonNumber?: number | null;
  totalLessonsFunded?: number | null;
  costPerLesson?: number | null;
  totalSpent?: number | null;
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

  if (!input.activityType || !(ACTIVITY_TYPES as readonly string[]).includes(input.activityType)) {
    errors.push(`Activity type must be one of: ${ACTIVITY_TYPES.join(", ")}`);
  }

  if (
    input.fundingSource &&
    !(FUNDING_SOURCES as readonly string[]).includes(input.fundingSource)
  ) {
    errors.push(`Funding source must be one of: ${FUNDING_SOURCES.join(", ")}`);
  }

  // Business rule: Lesson number should be positive
  if (input.lessonNumber !== undefined && input.lessonNumber !== null && input.lessonNumber < 1) {
    errors.push("Lesson number must be a positive integer");
  }

  // Business rule: Total lessons funded should be positive
  if (input.totalLessonsFunded !== undefined && input.totalLessonsFunded !== null && input.totalLessonsFunded < 1) {
    errors.push("Total lessons funded must be a positive integer");
  }

  // Business rule: Cost per lesson should be non-negative
  if (input.costPerLesson !== undefined && input.costPerLesson !== null && input.costPerLesson < 0) {
    errors.push("Cost per lesson cannot be negative");
  }

  // Business rule: Total spent should be non-negative
  if (input.totalSpent !== undefined && input.totalSpent !== null && input.totalSpent < 0) {
    errors.push("Total spent cannot be negative");
  }

  // Business rule: Driving lessons should have a funding source
  if (
    input.activityType === "Driving Lesson" &&
    (!input.fundingSource || input.fundingSource === "Not Applicable")
  ) {
    // Advisory: driving lessons have a cost; funding source should be recorded
  }

  // Business rule: Theory/practical test results should have pathway plan linkage
  if (
    input.activityType &&
    (DRIVING_TEST_ACTIVITIES as string[]).includes(input.activityType) &&
    input.pathwayPlanLinked === false
  ) {
    // Advisory: test results are significant milestones — pathway plan should be updated
  }

  // Business rule: Personal adviser should be involved for leaving care activities
  if (
    input.activityType &&
    (LICENCE_MILESTONE_ACTIVITIES as string[]).includes(input.activityType) &&
    input.personalAdviserInvolved === false
  ) {
    // Advisory: Children (Leaving Care) Act 2000 — PA should support key milestones
  }

  // Business rule: Lesson number should not exceed funded lessons
  if (
    input.lessonNumber !== undefined &&
    input.lessonNumber !== null &&
    input.totalLessonsFunded !== undefined &&
    input.totalLessonsFunded !== null &&
    input.lessonNumber > input.totalLessonsFunded
  ) {
    errors.push(
      `Lesson number (${input.lessonNumber}) exceeds total lessons funded (${input.totalLessonsFunded}) — additional funding may be needed. Children (Leaving Care) Act 2000 requires local authorities to support care leavers with practical independence skills including transport. Check whether additional funding can be secured through the leaving care grant or charitable sources`,
    );
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: DrivingIndependenceRow[],
): {
  total_records: number;
  by_activity_type: Record<string, number>;
  by_funding_source: Record<string, number>;
  total_spent: number;
  theory_pass_rate: number;
  practical_pass_rate: number;
  average_lessons_to_test: number;
  engagement_rate: number;
  personal_adviser_rate: number;
  pathway_plan_rate: number;
  social_worker_informed_rate: number;
  unique_young_people: number;
  licence_achieved_count: number;
  driving_lesson_count: number;
  public_transport_count: number;
  alternative_transport_count: number;
  average_cost_per_lesson: number;
  funded_lesson_utilisation_rate: number;
  cbt_count: number;
  theory_attempts: number;
  practical_attempts: number;
} {
  const total = rows.length;

  // Unique young people
  const uniqueYP = new Set(rows.map((r) => r.young_person_name.toLowerCase().trim()));

  // Activity type breakdown
  const byActivityType: Record<string, number> = {};
  for (const at of ACTIVITY_TYPES) byActivityType[at] = 0;
  for (const r of rows) byActivityType[r.activity_type] = (byActivityType[r.activity_type] || 0) + 1;

  // Funding source breakdown
  const byFundingSource: Record<string, number> = {};
  for (const fs of FUNDING_SOURCES) byFundingSource[fs] = 0;
  for (const r of rows) byFundingSource[r.funding_source] = (byFundingSource[r.funding_source] || 0) + 1;

  // Total spent
  const totalSpent = rows.reduce((sum, r) => sum + (r.total_spent ?? 0), 0);

  // Theory pass rate
  const theoryPassed = rows.filter((r) => r.activity_type === "Theory Test — Passed").length;
  const theoryFailed = rows.filter((r) => r.activity_type === "Theory Test — Failed").length;
  const theoryAttempts = theoryPassed + theoryFailed;
  const theoryPassRate = theoryAttempts > 0
    ? Math.round((theoryPassed / theoryAttempts) * 1000) / 10
    : 0;

  // Practical pass rate
  const practicalPassed = rows.filter((r) => r.activity_type === "Practical Test — Passed").length;
  const practicalFailed = rows.filter((r) => r.activity_type === "Practical Test — Failed").length;
  const practicalAttempts = practicalPassed + practicalFailed;
  const practicalPassRate = practicalAttempts > 0
    ? Math.round((practicalPassed / practicalAttempts) * 1000) / 10
    : 0;

  // Average lessons to test — look at young people who have taken a practical test
  const ypWithPracticalTest = new Set(
    rows
      .filter((r) => r.activity_type === "Practical Test — Passed" || r.activity_type === "Practical Test — Failed")
      .map((r) => r.young_person_name.toLowerCase().trim()),
  );
  let totalLessonsForTesters = 0;
  for (const yp of ypWithPracticalTest) {
    const lessons = rows.filter(
      (r) => r.young_person_name.toLowerCase().trim() === yp && r.activity_type === "Driving Lesson",
    );
    totalLessonsForTesters += lessons.length;
  }
  const avgLessonsToTest = ypWithPracticalTest.size > 0
    ? Math.round((totalLessonsForTesters / ypWithPracticalTest.size) * 10) / 10
    : 0;

  // Boolean rates
  const engagementRate = total > 0
    ? Math.round((rows.filter((r) => r.young_person_engaged).length / total) * 1000) / 10
    : 0;

  const paRate = total > 0
    ? Math.round((rows.filter((r) => r.personal_adviser_involved).length / total) * 1000) / 10
    : 0;

  const pathwayRate = total > 0
    ? Math.round((rows.filter((r) => r.pathway_plan_linked).length / total) * 1000) / 10
    : 0;

  const swRate = total > 0
    ? Math.round((rows.filter((r) => r.social_worker_informed).length / total) * 1000) / 10
    : 0;

  // Licence achieved — count young people with Practical Test — Passed
  const licenceAchieved = new Set(
    rows
      .filter((r) => r.activity_type === "Practical Test — Passed")
      .map((r) => r.young_person_name.toLowerCase().trim()),
  ).size;

  // Driving lesson count
  const drivingLessonCount = rows.filter((r) => r.activity_type === "Driving Lesson").length;

  // Public transport count
  const publicTransportCount = rows.filter(
    (r) => (PUBLIC_TRANSPORT_ACTIVITIES as string[]).includes(r.activity_type),
  ).length;

  // Alternative transport count
  const altTransportCount = rows.filter(
    (r) => (ALTERNATIVE_TRANSPORT_ACTIVITIES as string[]).includes(r.activity_type),
  ).length;

  // Average cost per lesson
  const lessonsWithCost = rows.filter(
    (r) => r.activity_type === "Driving Lesson" && r.cost_per_lesson !== null && r.cost_per_lesson > 0,
  );
  const avgCostPerLesson = lessonsWithCost.length > 0
    ? Math.round((lessonsWithCost.reduce((sum, r) => sum + (r.cost_per_lesson ?? 0), 0) / lessonsWithCost.length) * 100) / 100
    : 0;

  // Funded lesson utilisation rate
  const lessonsWithFunding = rows.filter(
    (r) => r.total_lessons_funded !== null && r.total_lessons_funded > 0 && r.lesson_number !== null,
  );
  const fundedUtilisation = lessonsWithFunding.length > 0
    ? Math.round(
        (lessonsWithFunding.reduce((sum, r) => sum + ((r.lesson_number ?? 0) / (r.total_lessons_funded ?? 1)), 0) /
          lessonsWithFunding.length) *
          1000,
      ) / 10
    : 0;

  // CBT count
  const cbtCount = rows.filter((r) => r.activity_type === "CBT — Moped/Scooter").length;

  return {
    total_records: total,
    by_activity_type: byActivityType,
    by_funding_source: byFundingSource,
    total_spent: Math.round(totalSpent * 100) / 100,
    theory_pass_rate: theoryPassRate,
    practical_pass_rate: practicalPassRate,
    average_lessons_to_test: avgLessonsToTest,
    engagement_rate: engagementRate,
    personal_adviser_rate: paRate,
    pathway_plan_rate: pathwayRate,
    social_worker_informed_rate: swRate,
    unique_young_people: uniqueYP.size,
    licence_achieved_count: licenceAchieved,
    driving_lesson_count: drivingLessonCount,
    public_transport_count: publicTransportCount,
    alternative_transport_count: altTransportCount,
    average_cost_per_lesson: avgCostPerLesson,
    funded_lesson_utilisation_rate: fundedUtilisation,
    cbt_count: cbtCount,
    theory_attempts: theoryAttempts,
    practical_attempts: practicalAttempts,
  };
}

export function computeAlerts(
  rows: DrivingIndependenceRow[],
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

  // Critical: Young person approaching lesson limit without test booked
  const ypLessonMap = new Map<string, DrivingIndependenceRow[]>();
  for (const r of rows) {
    if (r.activity_type === "Driving Lesson") {
      const key = r.young_person_name.toLowerCase().trim();
      if (!ypLessonMap.has(key)) ypLessonMap.set(key, []);
      ypLessonMap.get(key)!.push(r);
    }
  }
  for (const [, ypRows] of ypLessonMap) {
    const latest = ypRows.sort((a, b) => b.record_date.localeCompare(a.record_date))[0];
    if (
      latest.total_lessons_funded !== null &&
      latest.lesson_number !== null &&
      latest.total_lessons_funded > 0 &&
      latest.lesson_number >= latest.total_lessons_funded - 2
    ) {
      // Check if practical test is booked
      const ypName = latest.young_person_name.toLowerCase().trim();
      const hasTestBooked = rows.some(
        (r) =>
          r.young_person_name.toLowerCase().trim() === ypName &&
          r.activity_type === "Practical Test — Booked",
      );
      if (!hasTestBooked) {
        alerts.push({
          type: "lessons_running_out_no_test",
          severity: "critical",
          message: `${latest.young_person_name} has used ${latest.lesson_number} of ${latest.total_lessons_funded} funded lessons with no practical test booked — funding may run out before the young person is test-ready. Children (Leaving Care) Act 2000 requires local authorities to support care leavers with practical independence skills. Discuss with the personal adviser and driving instructor whether additional funding is needed, and whether a test should be booked soon`,
          record_id: latest.id,
        });
      }
    }
  }

  // Critical: Multiple theory test failures without additional support
  const ypTheoryFailMap = new Map<string, number>();
  for (const r of rows) {
    if (r.activity_type === "Theory Test — Failed") {
      const key = r.young_person_name.toLowerCase().trim();
      ypTheoryFailMap.set(key, (ypTheoryFailMap.get(key) ?? 0) + 1);
    }
  }
  for (const [ypName, failCount] of ypTheoryFailMap) {
    if (failCount >= 2) {
      const displayName = rows.find(
        (r) => r.young_person_name.toLowerCase().trim() === ypName,
      )?.young_person_name ?? ypName;
      alerts.push({
        type: "repeated_theory_failure",
        severity: "critical",
        message: `${displayName} has failed the theory test ${failCount} times — repeated failure can be demoralising and may indicate a learning need (e.g. dyslexia, ADHD) that requires additional support. Consider DVLA-approved practice apps, extra preparation time, special arrangements for the test, or referral to the home's educational support. DfE guidance emphasises that care leavers should receive the same level of support a good parent would provide — a good parent would not let a young person keep failing without intervening`,
      });
    }
  }

  // High: No personal adviser involvement for milestone activities
  for (const r of rows) {
    if (
      (LICENCE_MILESTONE_ACTIVITIES as string[]).includes(r.activity_type) &&
      !r.personal_adviser_involved
    ) {
      alerts.push({
        type: "no_pa_milestone",
        severity: "high",
        message: `${r.young_person_name}'s ${r.activity_type} on ${r.record_date} had no personal adviser involvement — under the Children (Leaving Care) Act 2000, the personal adviser should be actively supporting key independence milestones. Transport independence is a critical life skill for care leavers. The PA should be helping navigate funding, applications, and emotional support through the process`,
        record_id: r.id,
      });
    }
  }

  // High: No pathway plan linkage for funded activities
  const fundedNoPathway = rows.filter(
    (r) =>
      r.funding_source !== "Not Applicable" &&
      r.funding_source !== "Personal Savings" &&
      !r.pathway_plan_linked,
  );
  if (fundedNoPathway.length >= 3) {
    alerts.push({
      type: "funded_no_pathway_plan",
      severity: "high",
      message: `${fundedNoPathway.length} funded transport activities are not linked to the pathway plan — DfE statutory guidance requires that the pathway plan sets out how the young person will be supported to develop independence skills including transport. If driving lessons or travel support are funded but not in the pathway plan, this creates accountability gaps and may complicate future funding requests`,
    });
  }

  // High: Low engagement rate
  const engagedCount = rows.filter((r) => r.young_person_engaged).length;
  if (rows.length >= 5 && engagedCount / rows.length < 0.4) {
    alerts.push({
      type: "low_engagement",
      severity: "high",
      message: `Young person engagement rate is only ${Math.round((engagedCount / rows.length) * 100)}% across transport independence activities — low engagement may indicate the young person is not motivated, anxious about learning, or the type of transport support does not match their interests. CHR 2015 Reg 5 requires the home to actively prepare young people for independence. Consider whether the programme is responsive to each young person's preferences and readiness`,
    });
  }

  // High: High total spend with no progress toward licence
  const ypSpendMap = new Map<string, number>();
  for (const r of rows) {
    if (r.total_spent !== null && r.total_spent > 0) {
      const key = r.young_person_name.toLowerCase().trim();
      ypSpendMap.set(key, Math.max(ypSpendMap.get(key) ?? 0, r.total_spent));
    }
  }
  for (const [ypName, totalSpent] of ypSpendMap) {
    if (totalSpent > 1500) {
      const hasPassedTheory = rows.some(
        (r) =>
          r.young_person_name.toLowerCase().trim() === ypName &&
          r.activity_type === "Theory Test — Passed",
      );
      if (!hasPassedTheory) {
        const displayName = rows.find(
          (r) => r.young_person_name.toLowerCase().trim() === ypName,
        )?.young_person_name ?? ypName;
        alerts.push({
          type: "high_spend_no_progress",
          severity: "high",
          message: `£${totalSpent.toFixed(2)} spent on transport independence for ${displayName} without passing the theory test — review the support plan and consider whether alternative transport options (public transport, cycling) may better serve this young person's needs in the short term while continuing to work toward a driving licence`,
        });
      }
    }
  }

  // Medium: No alternative transport activities
  const altTransport = rows.filter(
    (r) => (ALTERNATIVE_TRANSPORT_ACTIVITIES as string[]).includes(r.activity_type),
  );
  if (rows.length >= 5 && altTransport.length === 0) {
    alerts.push({
      type: "no_alternative_transport",
      severity: "medium",
      message: `No alternative transport activities recorded (cycling, bus/train planning, travel cards) — not all young people will drive, and many care leavers live in areas where public transport is essential. SCCIF: Experiences & progress expects that young people are prepared for independence across all practical domains. A balanced transport independence programme should include public transport skills alongside driving`,
    });
  }

  // Medium: No social worker informed for test activities
  const testNotInformed = rows.filter(
    (r) =>
      (DRIVING_TEST_ACTIVITIES as string[]).includes(r.activity_type) &&
      !r.social_worker_informed,
  );
  if (testNotInformed.length >= 2) {
    alerts.push({
      type: "sw_not_informed_tests",
      severity: "medium",
      message: `${testNotInformed.length} test results were not communicated to the social worker — the social worker needs to be aware of progress toward independence as this feeds into care planning and pathway plan reviews. Passing a driving test is a significant achievement; failing requires additional support planning`,
    });
  }

  // Medium: Only one type of activity recorded
  const activeTypes = new Set(rows.map((r) => r.activity_type));
  if (rows.length >= 5 && activeTypes.size === 1) {
    alerts.push({
      type: "single_activity_type",
      severity: "medium",
      message: `Only one activity type recorded (${[...activeTypes][0]}) — transport independence requires a range of skills and milestones. Consider whether the young person's programme includes licence applications, theory preparation, practical lessons, road safety, and public transport skills as appropriate to their stage`,
    });
  }

  // Medium: No provider recorded for driving lessons
  const lessonsNoProvider = rows.filter(
    (r) => r.activity_type === "Driving Lesson" && (!r.provider_name || r.provider_name.trim().length === 0),
  );
  if (lessonsNoProvider.length >= 3) {
    alerts.push({
      type: "lessons_no_provider",
      severity: "medium",
      message: `${lessonsNoProvider.length} driving lessons have no provider/driving school recorded — recording the provider ensures accountability, supports funding claims, and enables quality monitoring. If lessons are with a specific instructor, their details should be captured for safeguarding and continuity purposes`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: DrivingIndependenceRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_activity_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const fundingBreakdown = Object.entries(metrics.by_funding_source)
    .filter(([, count]) => count > 0)
    .map(([source, count]) => `${source}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} transport independence ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_young_people} young ${metrics.unique_young_people === 1 ? "person" : "people"}. ` +
      `Activities: ${typeBreakdown || "none recorded"}. ` +
      `Funding: ${fundingBreakdown || "none"}. ` +
      `Total spent: £${metrics.total_spent.toFixed(2)}. ` +
      `Average cost per lesson: £${metrics.average_cost_per_lesson.toFixed(2)}. ` +
      `Driving lessons: ${metrics.driving_lesson_count}. ` +
      `Theory attempts: ${metrics.theory_attempts} (pass rate: ${metrics.theory_pass_rate}%). ` +
      `Practical attempts: ${metrics.practical_attempts} (pass rate: ${metrics.practical_pass_rate}%). ` +
      `Licences achieved: ${metrics.licence_achieved_count}. ` +
      `Average lessons to test: ${metrics.average_lessons_to_test}. ` +
      `Public transport activities: ${metrics.public_transport_count}. ` +
      `Engagement rate: ${metrics.engagement_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `PA involvement: ${metrics.personal_adviser_rate}%. ` +
        `Pathway plan linked: ${metrics.pathway_plan_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Funded lesson utilisation: ${metrics.funded_lesson_utilisation_rate}%. ` +
        `CBT completions: ${metrics.cbt_count}. ` +
        `Alternative transport: ${metrics.alternative_transport_count} activities.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority transport independence alerts. ` +
        `PA involvement: ${metrics.personal_adviser_rate}%. ` +
        `Pathway plan linked: ${metrics.pathway_plan_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Funded lesson utilisation: ${metrics.funded_lesson_utilisation_rate}%. ` +
        `CBT completions: ${metrics.cbt_count}. ` +
        `Alternative transport: ${metrics.alternative_transport_count} activities. ` +
        `Continue supporting transport independence per CHR 2015 Reg 5.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.practical_pass_rate === 0 && metrics.driving_lesson_count > 20 && metrics.total_records > 5) {
    insights.push(
      `[reflect] ${metrics.driving_lesson_count} driving lessons have been delivered with no ` +
        `practical test pass yet. The national average for care leavers to pass is often ` +
        `higher than the general population because they start later and may have less ` +
        `informal practice time. Are young people getting enough practice between lessons? ` +
        `Is the home facilitating accompanied driving practice where appropriate? DfE ` +
        `guidance on supporting care leavers emphasises that local authorities should ` +
        `provide the same level of support a good parent would — a good parent would ` +
        `take their child out for practice drives, discuss road situations, and provide ` +
        `encouragement. Is the home fulfilling that corporate parenting role for ` +
        `transport independence?`,
    );
  } else if (metrics.alternative_transport_count === 0 && metrics.total_records > 5) {
    insights.push(
      `[reflect] No alternative transport activities (cycling, public transport, travel ` +
        `cards) have been recorded. While driving is important, many care leavers will ` +
        `rely on public transport for years after leaving care, and some may never drive. ` +
        `CHR 2015 Reg 5 requires preparation for independence — this includes the ` +
        `practical skill of navigating bus routes, buying train tickets, reading ` +
        `timetables, and managing travel budgets. Are young people being supported ` +
        `to develop confidence with public transport alongside any driving programme? ` +
        `Is the home in a rural area where transport poverty is a real risk for ` +
        `care leavers?`,
    );
  } else if (metrics.engagement_rate < 60 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Engagement rate is ${metrics.engagement_rate}% across transport ` +
        `independence activities. For care leavers, transport can feel overwhelming — ` +
        `the costs, the bureaucracy of licence applications, the anxiety of tests. ` +
        `Many young people in care have not had a parent who drives, or have negative ` +
        `associations with car journeys. Is the programme sensitive to these experiences? ` +
        `Are young people being given genuine choice about which transport skills they ` +
        `want to develop, or is driving assumed to be the default goal? SCCIF expects ` +
        `that independence preparation is personalised and responsive to each young ` +
        `person's wishes and feelings.`,
    );
  } else {
    insights.push(
      `[reflect] How does the home measure the real-world impact of its transport ` +
        `independence programme? Beyond pass rates and lesson counts, are young people ` +
        `actually using their transport skills independently? Can they plan and complete ` +
        `journeys to education, employment, and social activities without staff support? ` +
        `Children (Leaving Care) Act 2000 and CHR 2015 Reg 5 together require that ` +
        `young people leave care with practical skills for adult life. Transport ` +
        `independence is not just about passing a test — it is about the confidence ` +
        `and capability to get where you need to go. Is the programme building genuine ` +
        `independence, or creating dependence on funded provision?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    activityType?: ActivityType;
    fundingSource?: FundingSource;
    limit?: number;
  },
): Promise<ServiceResult<DrivingIndependenceRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_driving_independence") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.activityType) q = q.eq("activity_type", filters.activityType);
  if (filters?.fundingSource) q = q.eq("funding_source", filters.fundingSource);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<DrivingIndependenceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_driving_independence") as SB)
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
  activityType: ActivityType;
  providerName?: string | null;
  lessonNumber?: number | null;
  totalLessonsFunded?: number | null;
  fundingSource?: FundingSource;
  costPerLesson?: number | null;
  totalSpent?: number | null;
  youngPersonEngaged?: boolean;
  personalAdviserInvolved?: boolean;
  pathwayPlanLinked?: boolean;
  socialWorkerInformed?: boolean;
  nextMilestone?: string | null;
  nextDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<DrivingIndependenceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateDrivingIndependence({
    youngPersonName: input.youngPersonName,
    recordDate: input.recordDate,
    supportingStaff: input.supportingStaff,
    activityType: input.activityType,
    fundingSource: input.fundingSource,
    lessonNumber: input.lessonNumber,
    totalLessonsFunded: input.totalLessonsFunded,
    costPerLesson: input.costPerLesson,
    totalSpent: input.totalSpent,
    youngPersonEngaged: input.youngPersonEngaged,
    personalAdviserInvolved: input.personalAdviserInvolved,
    pathwayPlanLinked: input.pathwayPlanLinked,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_driving_independence") as SB)
    .insert({
      home_id: input.homeId,
      young_person_name: input.youngPersonName,
      record_date: input.recordDate,
      supporting_staff: input.supportingStaff,
      activity_type: input.activityType,
      provider_name: input.providerName ?? null,
      lesson_number: input.lessonNumber ?? null,
      total_lessons_funded: input.totalLessonsFunded ?? null,
      funding_source: input.fundingSource ?? "Local Authority",
      cost_per_lesson: input.costPerLesson ?? null,
      total_spent: input.totalSpent ?? null,
      young_person_engaged: input.youngPersonEngaged ?? false,
      personal_adviser_involved: input.personalAdviserInvolved ?? false,
      pathway_plan_linked: input.pathwayPlanLinked ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      next_milestone: input.nextMilestone ?? null,
      next_date: input.nextDate ?? null,
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
    activityType: ActivityType;
    providerName: string | null;
    lessonNumber: number | null;
    totalLessonsFunded: number | null;
    fundingSource: FundingSource;
    costPerLesson: number | null;
    totalSpent: number | null;
    youngPersonEngaged: boolean;
    personalAdviserInvolved: boolean;
    pathwayPlanLinked: boolean;
    socialWorkerInformed: boolean;
    nextMilestone: string | null;
    nextDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<DrivingIndependenceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.youngPersonName !== undefined) mapped.young_person_name = updates.youngPersonName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.supportingStaff !== undefined) mapped.supporting_staff = updates.supportingStaff;
  if (updates.activityType !== undefined) mapped.activity_type = updates.activityType;
  if (updates.providerName !== undefined) mapped.provider_name = updates.providerName;
  if (updates.lessonNumber !== undefined) mapped.lesson_number = updates.lessonNumber;
  if (updates.totalLessonsFunded !== undefined) mapped.total_lessons_funded = updates.totalLessonsFunded;
  if (updates.fundingSource !== undefined) mapped.funding_source = updates.fundingSource;
  if (updates.costPerLesson !== undefined) mapped.cost_per_lesson = updates.costPerLesson;
  if (updates.totalSpent !== undefined) mapped.total_spent = updates.totalSpent;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.personalAdviserInvolved !== undefined) mapped.personal_adviser_involved = updates.personalAdviserInvolved;
  if (updates.pathwayPlanLinked !== undefined) mapped.pathway_plan_linked = updates.pathwayPlanLinked;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.nextMilestone !== undefined) mapped.next_milestone = updates.nextMilestone;
  if (updates.nextDate !== undefined) mapped.next_date = updates.nextDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_driving_independence") as SB)
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

  const { error } = await (client.from("cs_driving_independence") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
