// ==============================================================================
// Sleep Routine & Quality Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home supports children's sleep:
//   1. Sleep Quality (duration, consistency, waking, child satisfaction)
//   2. Bedtime Routine (consistency, preparation, wind-down, individual needs)
//   3. Policy & Governance (sleep policy, environment, night support)
//   4. Staff Readiness (training, night support, sleep hygiene knowledge)
//
// Regulatory: CHR 2015 Reg 10, CHR 2015 Reg 12, SCCIF, NMS 10,
//             Children Act 1989, UNCRC Article 24, NICE NG10
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type SleepQualityLevel =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "very_poor";

export type RoutineAdherence =
  | "fully_followed"
  | "mostly_followed"
  | "partially_followed"
  | "not_followed";

export type NightIssueType =
  | "difficulty_settling"
  | "night_waking"
  | "nightmares"
  | "early_waking"
  | "sleepwalking"
  | "refusal_to_sleep"
  | "screen_use"
  | "none";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const sleepQualityLabels: Record<SleepQualityLevel, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  very_poor: "Very Poor",
};

const routineAdherenceLabels: Record<RoutineAdherence, string> = {
  fully_followed: "Fully Followed",
  mostly_followed: "Mostly Followed",
  partially_followed: "Partially Followed",
  not_followed: "Not Followed",
};

const nightIssueLabels: Record<NightIssueType, string> = {
  difficulty_settling: "Difficulty Settling",
  night_waking: "Night Waking",
  nightmares: "Nightmares",
  early_waking: "Early Waking",
  sleepwalking: "Sleepwalking",
  refusal_to_sleep: "Refusal to Sleep",
  screen_use: "Screen Use",
  none: "None",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getSleepQualityLabel(s: SleepQualityLevel): string {
  return sleepQualityLabels[s] ?? s;
}
export function getRoutineAdherenceLabel(r: RoutineAdherence): string {
  return routineAdherenceLabels[r] ?? r;
}
export function getNightIssueLabel(n: NightIssueType): string {
  return nightIssueLabels[n] ?? n;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface SleepRecord {
  id: string;
  childId: string;
  childName: string;
  recordDate: string;
  sleepQuality: SleepQualityLevel;
  hoursSlept: number;
  routineAdherence: RoutineAdherence;
  nightIssue: NightIssueType;
  windDownCompleted: boolean;
  screenFreeBeforeBed: boolean;
  environmentComfortable: boolean;
  childSatisfied: boolean;
  staffNightCheckCompleted: boolean;
  recordedTimely: boolean;
}

export interface SleepPolicy {
  id: string;
  bedtimeRoutinePolicy: boolean;
  individualSleepPlans: boolean;
  screenTimeLimits: boolean;
  sleepEnvironmentStandards: boolean;
  nightStaffProtocol: boolean;
  sleepHygieneEducation: boolean;
  regularSleepReview: boolean;
}

export interface StaffSleepTraining {
  id: string;
  staffId: string;
  staffName: string;
  sleepHygiene: boolean;
  bedtimeRoutines: boolean;
  nightSupport: boolean;
  sleepDisorders: boolean;
  screenTimeManagement: boolean;
  environmentalFactors: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface SleepQualityResult {
  overallScore: number;
  totalRecords: number;
  goodSleepRate: number;
  averageHours: number;
  nightIssueRate: number;
  childSatisfactionRate: number;
}

export interface BedtimeRoutineResult {
  overallScore: number;
  routineAdherenceRate: number;
  windDownRate: number;
  screenFreeRate: number;
  environmentRate: number;
}

export interface SleepPolicyResult {
  overallScore: number;
  bedtimeRoutinePolicy: boolean;
  individualSleepPlans: boolean;
  screenTimeLimits: boolean;
  sleepEnvironmentStandards: boolean;
  nightStaffProtocol: boolean;
  sleepHygieneEducation: boolean;
  regularSleepReview: boolean;
}

export interface StaffSleepReadinessResult {
  overallScore: number;
  totalStaff: number;
  sleepHygieneRate: number;
  bedtimeRoutinesRate: number;
  nightSupportRate: number;
  sleepDisordersRate: number;
  screenTimeRate: number;
  environmentalRate: number;
}

export interface ChildSleepProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  goodSleepRate: number;
  averageHours: number;
  routineAdherenceRate: number;
  overallScore: number;
}

export interface SleepRoutineQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  sleepQuality: SleepQualityResult;
  bedtimeRoutine: BedtimeRoutineResult;
  sleepPolicy: SleepPolicyResult;
  staffReadiness: StaffSleepReadinessResult;
  childProfiles: ChildSleepProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluators ----------------------------------------------------------------

/**
 * Evaluates sleep quality.
 * Empty = 0 (no records = no evidence of sleep monitoring).
 *
 *   Good sleep rate (excellent + good)  → 0-7
 *   Low night issue rate                → 0-6
 *   Child satisfaction rate             → 0-6
 *   Staff night check + timely record   → 0-6
 */
export function evaluateSleepQuality(
  records: SleepRecord[],
): SleepQualityResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      goodSleepRate: 0,
      averageHours: 0,
      nightIssueRate: 0,
      childSatisfactionRate: 0,
    };
  }

  let score = 0;

  const good = records.filter(
    (r) => r.sleepQuality === "excellent" || r.sleepQuality === "good",
  ).length;
  const goodSleepRate = pct(good, records.length);
  if (goodSleepRate >= 80) score += 7;
  else if (goodSleepRate >= 60) score += 5;
  else if (goodSleepRate >= 40) score += 3;
  else if (goodSleepRate > 0) score += 1;

  const withIssues = records.filter((r) => r.nightIssue !== "none").length;
  const nightIssueRate = pct(withIssues, records.length);
  const noIssueRate = 100 - nightIssueRate;
  if (noIssueRate >= 80) score += 6;
  else if (noIssueRate >= 60) score += 4;
  else if (noIssueRate >= 40) score += 2;
  else if (noIssueRate > 0) score += 1;

  const satisfied = records.filter((r) => r.childSatisfied).length;
  const childSatisfactionRate = pct(satisfied, records.length);
  if (childSatisfactionRate >= 90) score += 6;
  else if (childSatisfactionRate >= 70) score += 4;
  else if (childSatisfactionRate >= 50) score += 3;
  else if (childSatisfactionRate > 0) score += 1;

  const nightChecks = records.filter((r) => r.staffNightCheckCompleted).length;
  const timely = records.filter((r) => r.recordedTimely).length;
  const combinedRate = Math.round((pct(nightChecks, records.length) + pct(timely, records.length)) / 2);
  if (combinedRate >= 90) score += 6;
  else if (combinedRate >= 70) score += 4;
  else if (combinedRate >= 50) score += 3;
  else if (combinedRate > 0) score += 1;

  const totalHours = records.reduce((sum, r) => sum + r.hoursSlept, 0);
  const averageHours = Math.round((totalHours / records.length) * 10) / 10;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: records.length,
    goodSleepRate,
    averageHours,
    nightIssueRate,
    childSatisfactionRate,
  };
}

/**
 * Evaluates bedtime routine consistency.
 * Empty = 0 (no records = no evidence).
 *
 *   Routine adherence rate (fully + mostly)  → 0-7
 *   Wind-down completed rate                 → 0-6
 *   Screen-free before bed rate              → 0-6
 *   Environment comfortable rate             → 0-6
 */
export function evaluateBedtimeRoutine(
  records: SleepRecord[],
): BedtimeRoutineResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      routineAdherenceRate: 0,
      windDownRate: 0,
      screenFreeRate: 0,
      environmentRate: 0,
    };
  }

  let score = 0;

  const adherent = records.filter(
    (r) => r.routineAdherence === "fully_followed" || r.routineAdherence === "mostly_followed",
  ).length;
  const routineAdherenceRate = pct(adherent, records.length);
  if (routineAdherenceRate >= 80) score += 7;
  else if (routineAdherenceRate >= 60) score += 5;
  else if (routineAdherenceRate >= 40) score += 3;
  else if (routineAdherenceRate > 0) score += 1;

  const windDown = records.filter((r) => r.windDownCompleted).length;
  const windDownRate = pct(windDown, records.length);
  if (windDownRate >= 90) score += 6;
  else if (windDownRate >= 70) score += 4;
  else if (windDownRate >= 50) score += 3;
  else if (windDownRate > 0) score += 1;

  const screenFree = records.filter((r) => r.screenFreeBeforeBed).length;
  const screenFreeRate = pct(screenFree, records.length);
  if (screenFreeRate >= 90) score += 6;
  else if (screenFreeRate >= 70) score += 4;
  else if (screenFreeRate >= 50) score += 3;
  else if (screenFreeRate > 0) score += 1;

  const comfortable = records.filter((r) => r.environmentComfortable).length;
  const environmentRate = pct(comfortable, records.length);
  if (environmentRate >= 90) score += 6;
  else if (environmentRate >= 70) score += 4;
  else if (environmentRate >= 50) score += 3;
  else if (environmentRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    routineAdherenceRate,
    windDownRate,
    screenFreeRate,
    environmentRate,
  };
}

/**
 * Evaluates sleep policy and governance.
 * Null = 0.
 *
 *   bedtimeRoutinePolicy        → 0-4
 *   individualSleepPlans        → 0-4
 *   screenTimeLimits            → 0-4
 *   sleepEnvironmentStandards   → 0-4
 *   nightStaffProtocol          → 0-3
 *   sleepHygieneEducation       → 0-3
 *   regularSleepReview          → 0-3
 */
export function evaluateSleepPolicy(
  policy: SleepPolicy | null,
): SleepPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      bedtimeRoutinePolicy: false,
      individualSleepPlans: false,
      screenTimeLimits: false,
      sleepEnvironmentStandards: false,
      nightStaffProtocol: false,
      sleepHygieneEducation: false,
      regularSleepReview: false,
    };
  }

  let score = 0;

  if (policy.bedtimeRoutinePolicy) score += 4;
  if (policy.individualSleepPlans) score += 4;
  if (policy.screenTimeLimits) score += 4;
  if (policy.sleepEnvironmentStandards) score += 4;
  if (policy.nightStaffProtocol) score += 3;
  if (policy.sleepHygieneEducation) score += 3;
  if (policy.regularSleepReview) score += 3;

  return {
    overallScore: Math.min(score, 25),
    bedtimeRoutinePolicy: policy.bedtimeRoutinePolicy,
    individualSleepPlans: policy.individualSleepPlans,
    screenTimeLimits: policy.screenTimeLimits,
    sleepEnvironmentStandards: policy.sleepEnvironmentStandards,
    nightStaffProtocol: policy.nightStaffProtocol,
    sleepHygieneEducation: policy.sleepHygieneEducation,
    regularSleepReview: policy.regularSleepReview,
  };
}

/**
 * Evaluates staff sleep support readiness.
 * Empty = 0.
 *
 *   sleepHygiene rate           → 0-6
 *   bedtimeRoutines rate        → 0-5
 *   nightSupport rate           → 0-5
 *   sleepDisorders rate         → 0-4
 *   screenTimeManagement rate   → 0-3
 *   environmentalFactors rate   → 0-2
 */
export function evaluateStaffSleepReadiness(
  training: StaffSleepTraining[],
): StaffSleepReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      sleepHygieneRate: 0,
      bedtimeRoutinesRate: 0,
      nightSupportRate: 0,
      sleepDisordersRate: 0,
      screenTimeRate: 0,
      environmentalRate: 0,
    };
  }

  let score = 0;

  const sh = training.filter((t) => t.sleepHygiene).length;
  const sleepHygieneRate = pct(sh, training.length);
  if (sleepHygieneRate >= 90) score += 6;
  else if (sleepHygieneRate >= 70) score += 4;
  else if (sleepHygieneRate >= 50) score += 3;
  else if (sleepHygieneRate > 0) score += 1;

  const br = training.filter((t) => t.bedtimeRoutines).length;
  const bedtimeRoutinesRate = pct(br, training.length);
  if (bedtimeRoutinesRate >= 90) score += 5;
  else if (bedtimeRoutinesRate >= 70) score += 3;
  else if (bedtimeRoutinesRate >= 50) score += 2;
  else if (bedtimeRoutinesRate > 0) score += 1;

  const ns = training.filter((t) => t.nightSupport).length;
  const nightSupportRate = pct(ns, training.length);
  if (nightSupportRate >= 90) score += 5;
  else if (nightSupportRate >= 70) score += 3;
  else if (nightSupportRate >= 50) score += 2;
  else if (nightSupportRate > 0) score += 1;

  const sd = training.filter((t) => t.sleepDisorders).length;
  const sleepDisordersRate = pct(sd, training.length);
  if (sleepDisordersRate >= 90) score += 4;
  else if (sleepDisordersRate >= 70) score += 3;
  else if (sleepDisordersRate >= 50) score += 2;
  else if (sleepDisordersRate > 0) score += 1;

  const st = training.filter((t) => t.screenTimeManagement).length;
  const screenTimeRate = pct(st, training.length);
  if (screenTimeRate >= 90) score += 3;
  else if (screenTimeRate >= 70) score += 2;
  else if (screenTimeRate >= 50) score += 1;

  const ef = training.filter((t) => t.environmentalFactors).length;
  const environmentalRate = pct(ef, training.length);
  if (environmentalRate >= 90) score += 2;
  else if (environmentalRate >= 70) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    sleepHygieneRate,
    bedtimeRoutinesRate,
    nightSupportRate,
    sleepDisordersRate,
    screenTimeRate,
    environmentalRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildSleepProfiles(
  records: SleepRecord[],
): ChildSleepProfile[] {
  const childMap = new Map<
    string,
    { childId: string; childName: string; records: SleepRecord[] }
  >();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((entry) => {
    let score = 0;

    // Record frequency (0-2)
    if (entry.records.length >= 10) score += 2;
    else if (entry.records.length >= 5) score += 1;

    // Good sleep rate (0-3)
    const good = entry.records.filter(
      (r) => r.sleepQuality === "excellent" || r.sleepQuality === "good",
    ).length;
    const goodSleepRate = pct(good, entry.records.length);
    if (goodSleepRate >= 80) score += 3;
    else if (goodSleepRate >= 50) score += 2;
    else if (goodSleepRate > 0) score += 1;

    // Routine adherence (0-3)
    const adherent = entry.records.filter(
      (r) => r.routineAdherence === "fully_followed" || r.routineAdherence === "mostly_followed",
    ).length;
    const routineAdherenceRate = pct(adherent, entry.records.length);
    if (routineAdherenceRate >= 80) score += 3;
    else if (routineAdherenceRate >= 50) score += 2;
    else if (routineAdherenceRate > 0) score += 1;

    // Average hours (0-2) — ideal 8-10 for adolescents
    const totalHours = entry.records.reduce((sum, r) => sum + r.hoursSlept, 0);
    const averageHours = Math.round((totalHours / entry.records.length) * 10) / 10;
    if (averageHours >= 8) score += 2;
    else if (averageHours >= 7) score += 1;

    return {
      childId: entry.childId,
      childName: entry.childName,
      totalRecords: entry.records.length,
      goodSleepRate,
      averageHours,
      routineAdherenceRate,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateSleepRoutineQualityIntelligence(
  records: SleepRecord[],
  policy: SleepPolicy | null,
  training: StaffSleepTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SleepRoutineQualityIntelligence {
  const sleepQuality = evaluateSleepQuality(records);
  const bedtimeRoutine = evaluateBedtimeRoutine(records);
  const sleepPolicy = evaluateSleepPolicy(policy);
  const staffReadiness = evaluateStaffSleepReadiness(training);

  const rawScore =
    sleepQuality.overallScore +
    bedtimeRoutine.overallScore +
    sleepPolicy.overallScore +
    staffReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildSleepProfiles(records);

  // -- Strengths
  const strengths: string[] = [];

  if (sleepQuality.goodSleepRate >= 80 && records.length > 0) {
    strengths.push("Children consistently achieving good or excellent sleep quality");
  }
  if (sleepQuality.childSatisfactionRate >= 90 && records.length > 0) {
    strengths.push("Children satisfied with their sleep arrangements and routines");
  }
  if (bedtimeRoutine.routineAdherenceRate >= 80 && records.length > 0) {
    strengths.push("Bedtime routines consistently followed across the home");
  }
  if (bedtimeRoutine.screenFreeRate >= 90 && records.length > 0) {
    strengths.push("Screen-free time before bed consistently maintained");
  }
  if (bedtimeRoutine.windDownRate >= 90 && records.length > 0) {
    strengths.push("Wind-down activities consistently completed before bedtime");
  }
  if (staffReadiness.sleepHygieneRate >= 90 && training.length > 0) {
    strengths.push("Staff team fully trained in sleep hygiene practices");
  }
  if (staffReadiness.nightSupportRate >= 90 && training.length > 0) {
    strengths.push("Staff team trained to provide effective night support");
  }
  if (sleepPolicy.individualSleepPlans && policy) {
    strengths.push("Individual sleep plans in place for each child");
  }

  // -- Areas for improvement
  const areasForImprovement: string[] = [];

  if (sleepQuality.goodSleepRate < 60 && records.length > 0) {
    areasForImprovement.push("Sleep quality below expected standard — review sleep environment and routines");
  }
  if (bedtimeRoutine.routineAdherenceRate < 60 && records.length > 0) {
    areasForImprovement.push("Bedtime routine consistency needs improvement");
  }
  if (bedtimeRoutine.screenFreeRate < 70 && records.length > 0) {
    areasForImprovement.push("Screen-free time before bed not consistently achieved");
  }
  if (staffReadiness.sleepDisordersRate < 70 && training.length > 0) {
    areasForImprovement.push("Staff training on sleep disorders needs strengthening");
  }
  if (sleepQuality.nightIssueRate > 40 && records.length > 0) {
    areasForImprovement.push("Night-time issues affecting a significant proportion of sleep records");
  }

  // -- Actions
  const actions: string[] = [];

  if (records.length === 0) {
    actions.push("No sleep records — implement systematic sleep monitoring for all children");
  }
  if (!policy) {
    actions.push("URGENT: No sleep policy in place — develop bedtime routine and sleep quality policy");
  }
  if (training.length === 0) {
    actions.push("URGENT: No staff sleep training records — deliver training on sleep hygiene and night support");
  }
  if (bedtimeRoutine.windDownRate < 70 && records.length > 0) {
    actions.push("Improve wind-down activity completion before bedtime");
  }
  if (bedtimeRoutine.environmentRate < 80 && records.length > 0) {
    actions.push("Review sleep environment comfort for children reporting issues");
  }
  if (sleepQuality.nightIssueRate > 50 && records.length > 0) {
    actions.push("High night-time issue rate — consider referral for sleep assessment");
  }

  // -- Regulatory links
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — The health and wellbeing standard (physical health and sleep)",
    "CHR 2015 Reg 12 — The positive relationships standard",
    "SCCIF — Social Care Common Inspection Framework (health and wellbeing)",
    "NMS 10 — National Minimum Standards (health and wellbeing)",
    "Children Act 1989 — Welfare of looked-after children",
    "UNCRC Article 24 — Right to the highest attainable standard of health",
    "NICE NG10 — Violence and aggression (sleep environment and routines)",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    sleepQuality,
    bedtimeRoutine,
    sleepPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
