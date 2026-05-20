// Sleep Hygiene Quality Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ══════════════════════════════════════════════════════════════════════════════
// SLEEP HYGIENE QUALITY INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating sleep patterns, bedtime routines,
// sleep environment quality, and rest wellbeing for children in care.
//
// Regulatory basis:
//   - CHR 2015 Regulation 6 — The health and wellbeing standard
//   - CHR 2015 Regulation 9 — Quality of care standard
//   - SCCIF — Health and wellbeing of children
//   - NMS 6 — Health and wellbeing
//   - NMS 7 — Leisure activities (rest and relaxation)
//   - Children Act 1989 — Duty of care
//   - NICE Guideline NG92 — Sleep disorders in children
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type SleepType =
  | "bedtime_routine"
  | "night_check"
  | "morning_wakeup"
  | "sleep_environment_review"
  | "sleep_concern_assessment"
  | "relaxation_activity"
  | "screen_time_management"
  | "sleep_hygiene_education";

export type SleepQuality =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "very_poor";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const sleepTypeLabels: Record<SleepType, string> = {
  bedtime_routine: "Bedtime Routine",
  night_check: "Night Check",
  morning_wakeup: "Morning Wakeup",
  sleep_environment_review: "Sleep Environment Review",
  sleep_concern_assessment: "Sleep Concern Assessment",
  relaxation_activity: "Relaxation Activity",
  screen_time_management: "Screen Time Management",
  sleep_hygiene_education: "Sleep Hygiene Education",
};

const sleepQualityLabels: Record<SleepQuality, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  very_poor: "Very Poor",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSleepTypeLabel(type: SleepType): string {
  return sleepTypeLabels[type];
}

export function getSleepQualityLabel(quality: SleepQuality): string {
  return sleepQualityLabels[quality];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface SleepRecord {
  id: string;
  childId: string;
  childName: string;
  recordDate: string; // ISO date
  sleepType: SleepType;
  sleepQuality: SleepQuality;
  routineFollowed: boolean;
  environmentSuitable: boolean;
  restfulSleep: boolean;
  documentedInPlan: boolean;
  staffMonitored: boolean;
  feedbackGiven: boolean;
}

export interface SleepPolicy {
  id: string;
  bedtimeRoutineGuideline: boolean;
  sleepEnvironmentStandard: boolean;
  nightMonitoringProcedure: boolean;
  screenTimePolicy: boolean;
  sleepConcernProtocol: boolean;
  relaxationProgramme: boolean;
  regularReview: boolean;
}

export interface StaffSleepTraining {
  id: string;
  staffId: string;
  staffName: string;
  sleepHygieneKnowledge: boolean;
  nightSupervision: boolean;
  relaxationTechniques: boolean;
  sleepDisorderAwareness: boolean;
  traumaInformedSleep: boolean;
  environmentManagement: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface SleepQualityResult {
  totalRecords: number;
  sleepQualityRate: number;
  routineRate: number;
  environmentRate: number;
  restfulRate: number;
  qualityBreakdown: Record<SleepQuality, number>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface SleepComplianceResult {
  totalRecords: number;
  documentedRate: number;
  staffMonitoredRate: number;
  feedbackRate: number;
  sleepTypeDiversityRatio: number;
  uniqueTypes: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface SleepPolicyResult {
  bedtimeRoutineGuideline: boolean;
  sleepEnvironmentStandard: boolean;
  nightMonitoringProcedure: boolean;
  screenTimePolicy: boolean;
  sleepConcernProtocol: boolean;
  relaxationProgramme: boolean;
  regularReview: boolean;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface StaffSleepReadinessResult {
  totalStaff: number;
  sleepHygieneKnowledgeRate: number;
  nightSupervisionRate: number;
  relaxationTechniquesRate: number;
  sleepDisorderAwarenessRate: number;
  traumaInformedSleepRate: number;
  environmentManagementRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface ChildSleepProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  sleepQualityRate: number;
  routineRate: number;
  uniqueTypes: number;
  sleepScore: number; // 0-10
}

export interface SleepHygieneQualityIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  sleepQuality: SleepQualityResult;
  sleepCompliance: SleepComplianceResult;
  sleepPolicy: SleepPolicyResult;
  staffReadiness: StaffSleepReadinessResult;

  childProfiles: ChildSleepProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Evaluator 1: Sleep Quality (0-25) ──────────────────────────────────────

export function evaluateSleepQuality(
  records: SleepRecord[],
): SleepQualityResult {
  const totalRecords = records.length;

  // PRESENCE pattern: empty data → 0 score
  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      sleepQualityRate: 0,
      routineRate: 0,
      environmentRate: 0,
      restfulRate: 0,
      qualityBreakdown: { excellent: 0, good: 0, fair: 0, poor: 0, very_poor: 0 },
      score: 0,
      strengths: [],
      concerns: ["No sleep records available — sleep quality cannot be assessed"],
    };
  }

  // Sleep quality rate: excellent + good / total
  const goodOrBetter = records.filter(
    (r) => r.sleepQuality === "excellent" || r.sleepQuality === "good",
  ).length;
  const sleepQualityRate = pct(goodOrBetter, totalRecords);

  // Routine followed rate
  const routineCount = records.filter((r) => r.routineFollowed).length;
  const routineRate = pct(routineCount, totalRecords);

  // Environment suitable rate
  const envCount = records.filter((r) => r.environmentSuitable).length;
  const environmentRate = pct(envCount, totalRecords);

  // Restful sleep rate
  const restfulCount = records.filter((r) => r.restfulSleep).length;
  const restfulRate = pct(restfulCount, totalRecords);

  // Quality breakdown
  const qualityBreakdown: Record<SleepQuality, number> = {
    excellent: 0, good: 0, fair: 0, poor: 0, very_poor: 0,
  };
  for (const r of records) {
    qualityBreakdown[r.sleepQuality]++;
  }

  // Score: sleepQuality 0-7, routine 0-6, environment 0-6, restful 0-6 = 0-25
  let score = 0;
  score += (sleepQualityRate / 100) * 7;
  score += (routineRate / 100) * 6;
  score += (environmentRate / 100) * 6;
  score += (restfulRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (sleepQualityRate >= 80) {
    strengths.push("Excellent sleep quality: " + sleepQualityRate + "% of records rated good or excellent");
  } else if (sleepQualityRate < 50) {
    concerns.push("Sleep quality at " + sleepQualityRate + "% — majority of sleep records below good standard");
  }

  if (routineRate >= 90) {
    strengths.push("Strong bedtime routine adherence: " + routineRate + "% compliance");
  } else if (routineRate < 70) {
    concerns.push("Routine adherence at " + routineRate + "% — inconsistent bedtime routines may impact sleep quality");
  }

  if (environmentRate >= 90) {
    strengths.push("Sleep environment consistently suitable: " + environmentRate + "% of records");
  } else if (environmentRate < 70) {
    concerns.push("Sleep environment suitability at " + environmentRate + "% — review bedroom conditions and sensory factors");
  }

  if (restfulRate >= 80) {
    strengths.push("Good restful sleep rate: " + restfulRate + "% of records indicate restful sleep");
  } else if (restfulRate < 50) {
    concerns.push("Restful sleep rate at " + restfulRate + "% — children may not be getting adequate rest");
  }

  return {
    totalRecords,
    sleepQualityRate,
    routineRate,
    environmentRate,
    restfulRate,
    qualityBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 2: Sleep Compliance (0-25) ───────────────────────────────────

export function evaluateSleepCompliance(
  records: SleepRecord[],
): SleepComplianceResult {
  const totalRecords = records.length;

  // PRESENCE pattern: empty data → 0 score
  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      documentedRate: 0,
      staffMonitoredRate: 0,
      feedbackRate: 0,
      sleepTypeDiversityRatio: 0,
      uniqueTypes: 0,
      score: 0,
      strengths: [],
      concerns: ["No sleep records available — compliance cannot be assessed"],
    };
  }

  // Documented in plan rate
  const documentedCount = records.filter((r) => r.documentedInPlan).length;
  const documentedRate = pct(documentedCount, totalRecords);

  // Staff monitored rate
  const monitoredCount = records.filter((r) => r.staffMonitored).length;
  const staffMonitoredRate = pct(monitoredCount, totalRecords);

  // Feedback given rate
  const feedbackCount = records.filter((r) => r.feedbackGiven).length;
  const feedbackRate = pct(feedbackCount, totalRecords);

  // Sleep type diversity ratio (unique types / 8)
  const uniqueTypesSet = new Set(records.map((r) => r.sleepType));
  const uniqueTypes = uniqueTypesSet.size;
  const sleepTypeDiversityRatio = Math.round((uniqueTypes / 8) * 100) / 100;

  // Score: documented 0-8, staffMonitored 0-7, feedback 0-5, diversity 0-5 = 0-25
  let score = 0;
  score += (documentedRate / 100) * 8;
  score += (staffMonitoredRate / 100) * 7;
  score += (feedbackRate / 100) * 5;
  score += sleepTypeDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (documentedRate >= 90) {
    strengths.push("Excellent care plan documentation: " + documentedRate + "% of sleep records documented in plans");
  } else if (documentedRate < 60) {
    concerns.push("Care plan documentation at " + documentedRate + "% — sleep needs not consistently recorded in plans");
  }

  if (staffMonitoredRate >= 90) {
    strengths.push("Consistent staff monitoring: " + staffMonitoredRate + "% of sleep records staff-monitored");
  } else if (staffMonitoredRate < 70) {
    concerns.push("Staff monitoring at " + staffMonitoredRate + "% — gaps in overnight supervision may exist");
  }

  if (feedbackRate >= 80) {
    strengths.push("Good feedback practice: " + feedbackRate + "% of records include feedback to children");
  } else if (feedbackRate < 50) {
    concerns.push("Feedback rate at " + feedbackRate + "% — children not consistently informed about their sleep patterns");
  }

  if (uniqueTypes >= 6) {
    strengths.push("Comprehensive sleep monitoring: " + uniqueTypes + " of 8 sleep record types in use");
  } else if (uniqueTypes <= 2) {
    concerns.push("Only " + uniqueTypes + " sleep record type(s) used — limited monitoring scope");
  }

  return {
    totalRecords,
    documentedRate,
    staffMonitoredRate,
    feedbackRate,
    sleepTypeDiversityRatio,
    uniqueTypes,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 3: Sleep Policy (0-25) ───────────────────────────────────────

export function evaluateSleepPolicy(
  policy: SleepPolicy | null,
): SleepPolicyResult {
  // Null policy → all false, score 0
  if (policy === null) {
    return {
      bedtimeRoutineGuideline: false,
      sleepEnvironmentStandard: false,
      nightMonitoringProcedure: false,
      screenTimePolicy: false,
      sleepConcernProtocol: false,
      relaxationProgramme: false,
      regularReview: false,
      score: 0,
      strengths: [],
      concerns: ["No sleep policy in place — URGENT: develop comprehensive sleep hygiene policy"],
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.bedtimeRoutineGuideline) score += 4;
  if (policy.sleepEnvironmentStandard) score += 4;
  if (policy.nightMonitoringProcedure) score += 4;
  if (policy.screenTimePolicy) score += 4;
  if (policy.sleepConcernProtocol) score += 3;
  if (policy.relaxationProgramme) score += 3;
  if (policy.regularReview) score += 3;

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  const trueCount = [
    policy.bedtimeRoutineGuideline,
    policy.sleepEnvironmentStandard,
    policy.nightMonitoringProcedure,
    policy.screenTimePolicy,
    policy.sleepConcernProtocol,
    policy.relaxationProgramme,
    policy.regularReview,
  ].filter(Boolean).length;

  if (trueCount === 7) {
    strengths.push("Comprehensive sleep policy: all 7 policy areas covered");
  } else if (trueCount >= 5) {
    strengths.push("Good sleep policy coverage: " + trueCount + " of 7 areas addressed");
  }

  if (!policy.bedtimeRoutineGuideline) {
    concerns.push("No bedtime routine guideline — essential for consistent sleep hygiene");
  }
  if (!policy.sleepEnvironmentStandard) {
    concerns.push("No sleep environment standard — bedroom conditions not formally defined");
  }
  if (!policy.nightMonitoringProcedure) {
    concerns.push("No night monitoring procedure — overnight supervision may be inconsistent");
  }
  if (!policy.screenTimePolicy) {
    concerns.push("No screen time policy — screen exposure before bed impacts sleep quality");
  }
  if (!policy.sleepConcernProtocol) {
    concerns.push("No sleep concern protocol — escalation pathway for sleep issues unclear");
  }
  if (!policy.relaxationProgramme) {
    concerns.push("No relaxation programme — children may lack wind-down support");
  }
  if (!policy.regularReview) {
    concerns.push("No regular review process — sleep policy may become outdated");
  }

  return {
    bedtimeRoutineGuideline: policy.bedtimeRoutineGuideline,
    sleepEnvironmentStandard: policy.sleepEnvironmentStandard,
    nightMonitoringProcedure: policy.nightMonitoringProcedure,
    screenTimePolicy: policy.screenTimePolicy,
    sleepConcernProtocol: policy.sleepConcernProtocol,
    relaxationProgramme: policy.relaxationProgramme,
    regularReview: policy.regularReview,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 4: Staff Sleep Readiness (0-25) ─────────────────────────────

export function evaluateStaffSleepReadiness(
  training: StaffSleepTraining[],
): StaffSleepReadinessResult {
  const totalStaff = training.length;

  // PRESENCE pattern: empty data → 0 score
  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      sleepHygieneKnowledgeRate: 0,
      nightSupervisionRate: 0,
      relaxationTechniquesRate: 0,
      sleepDisorderAwarenessRate: 0,
      traumaInformedSleepRate: 0,
      environmentManagementRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff sleep training records — staff readiness cannot be assessed"],
    };
  }

  // 6 skills
  const hygieneCount = training.filter((t) => t.sleepHygieneKnowledge).length;
  const sleepHygieneKnowledgeRate = pct(hygieneCount, totalStaff);

  const nightCount = training.filter((t) => t.nightSupervision).length;
  const nightSupervisionRate = pct(nightCount, totalStaff);

  const relaxCount = training.filter((t) => t.relaxationTechniques).length;
  const relaxationTechniquesRate = pct(relaxCount, totalStaff);

  const disorderCount = training.filter((t) => t.sleepDisorderAwareness).length;
  const sleepDisorderAwarenessRate = pct(disorderCount, totalStaff);

  const traumaCount = training.filter((t) => t.traumaInformedSleep).length;
  const traumaInformedSleepRate = pct(traumaCount, totalStaff);

  const envCount = training.filter((t) => t.environmentManagement).length;
  const environmentManagementRate = pct(envCount, totalStaff);

  // 6 skills weighted: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (sleepHygieneKnowledgeRate / 100) * 6;
  score += (nightSupervisionRate / 100) * 5;
  score += (relaxationTechniquesRate / 100) * 5;
  score += (sleepDisorderAwarenessRate / 100) * 4;
  score += (traumaInformedSleepRate / 100) * 3;
  score += (environmentManagementRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (sleepHygieneKnowledgeRate >= 90) {
    strengths.push("Excellent sleep hygiene knowledge: " + sleepHygieneKnowledgeRate + "% of staff trained");
  } else if (sleepHygieneKnowledgeRate < 70) {
    concerns.push("Sleep hygiene knowledge at " + sleepHygieneKnowledgeRate + "% — staff may lack foundational understanding");
  }

  if (nightSupervisionRate >= 90) {
    strengths.push("Strong night supervision skills: " + nightSupervisionRate + "% of staff trained");
  } else if (nightSupervisionRate < 70) {
    concerns.push("Night supervision skills at " + nightSupervisionRate + "% — gaps in overnight care capability");
  }

  if (relaxationTechniquesRate >= 80) {
    strengths.push("Good relaxation technique skills: " + relaxationTechniquesRate + "% of staff trained");
  } else if (relaxationTechniquesRate < 50) {
    concerns.push("Relaxation technique skills at " + relaxationTechniquesRate + "% — staff may not support wind-down effectively");
  }

  if (sleepDisorderAwarenessRate >= 80) {
    strengths.push("Good sleep disorder awareness: " + sleepDisorderAwarenessRate + "% of staff trained");
  } else if (sleepDisorderAwarenessRate < 50) {
    concerns.push("Sleep disorder awareness at " + sleepDisorderAwarenessRate + "% — sleep difficulties may go unrecognised");
  }

  if (traumaInformedSleepRate >= 80) {
    strengths.push("Strong trauma-informed sleep practice: " + traumaInformedSleepRate + "% of staff trained");
  } else if (traumaInformedSleepRate < 50) {
    concerns.push("Trauma-informed sleep practice at " + traumaInformedSleepRate + "% — children with trauma may not receive appropriate support");
  }

  if (environmentManagementRate >= 80) {
    strengths.push("Good environment management skills: " + environmentManagementRate + "% of staff trained");
  } else if (environmentManagementRate < 50) {
    concerns.push("Environment management skills at " + environmentManagementRate + "% — staff may not optimise sleep conditions");
  }

  return {
    totalStaff,
    sleepHygieneKnowledgeRate,
    nightSupervisionRate,
    relaxationTechniquesRate,
    sleepDisorderAwarenessRate,
    traumaInformedSleepRate,
    environmentManagementRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Sleep Profiles ─────────────────────────────────────────────

export function buildChildSleepProfiles(
  records: SleepRecord[],
): ChildSleepProfile[] {
  if (records.length === 0) return [];

  // Group by childId
  const childMap = new Map<string, { childId: string; childName: string; records: SleepRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;

    // Per-child sleepQualityRate (excellent + good)
    const goodOrBetter = child.records.filter(
      (r) => r.sleepQuality === "excellent" || r.sleepQuality === "good",
    ).length;
    const sleepQualityRate = pct(goodOrBetter, totalRecords);

    // Per-child routineRate
    const routineCount = child.records.filter((r) => r.routineFollowed).length;
    const routineRate = pct(routineCount, totalRecords);

    // Unique types
    const uniqueTypesSet = new Set(child.records.map((r) => r.sleepType));
    const uniqueTypes = uniqueTypesSet.size;

    // Sleep score 0-10
    // frequencyScore: >=10 records → 2, >=5 → 1, else 0
    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    // qualityScore: >=80% → 3, >=60% → 2, >=40% → 1, else 0
    let qualityScore = 0;
    if (sleepQualityRate >= 80) qualityScore = 3;
    else if (sleepQualityRate >= 60) qualityScore = 2;
    else if (sleepQualityRate >= 40) qualityScore = 1;

    // routineScore: >=80% → 3, >=60% → 2, >=40% → 1, else 0
    let routineScore = 0;
    if (routineRate >= 80) routineScore = 3;
    else if (routineRate >= 60) routineScore = 2;
    else if (routineRate >= 40) routineScore = 1;

    // diversityBonus: >=4 types → 2, >=2 → 1, else 0
    let diversityBonus = 0;
    if (uniqueTypes >= 4) diversityBonus = 2;
    else if (uniqueTypes >= 2) diversityBonus = 1;

    const sleepScore = Math.min(10, frequencyScore + qualityScore + routineScore + diversityBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalRecords,
      sleepQualityRate,
      routineRate,
      uniqueTypes,
      sleepScore,
    };
  });
}

// ── Orchestrator ───────────────────────────────────────────────────────────

export function generateSleepHygieneQualityIntelligence(
  records: SleepRecord[],
  policy: SleepPolicy | null,
  training: StaffSleepTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SleepHygieneQualityIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter records to period
  const periodRecords = records.filter(
    (r) => r.recordDate >= periodStart && r.recordDate <= periodEnd,
  );

  // Evaluate each layer
  const sleepQuality = evaluateSleepQuality(periodRecords);
  const sleepCompliance = evaluateSleepCompliance(periodRecords);
  const sleepPolicy = evaluateSleepPolicy(policy);
  const staffReadiness = evaluateStaffSleepReadiness(training);

  // Build child profiles
  const childProfiles = buildChildSleepProfiles(periodRecords);

  // Overall score capped at 100
  const overallScore = Math.min(
    100,
    Math.round(
      sleepQuality.score +
      sleepCompliance.score +
      sleepPolicy.score +
      staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths = aggregateStrengths(
    sleepQuality, sleepCompliance, sleepPolicy, staffReadiness, overallScore,
  );

  // Aggregate areas for improvement
  const areasForImprovement = aggregateAreasForImprovement(
    sleepQuality, sleepCompliance, sleepPolicy, staffReadiness, overallScore,
  );

  // Generate actions
  const actions = generateActions(
    sleepQuality, sleepCompliance, sleepPolicy, staffReadiness, childProfiles,
  );

  // Regulatory links
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    sleepQuality,
    sleepCompliance,
    sleepPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ────────────────────────────────────────────────────

function aggregateStrengths(
  quality: SleepQualityResult,
  compliance: SleepComplianceResult,
  policy: SleepPolicyResult,
  staff: StaffSleepReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall sleep hygiene quality rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall sleep hygiene quality rated Good (" + overallScore + "/100)");
  }

  strengths.push(...quality.strengths.slice(0, 2));
  strengths.push(...compliance.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ────────────────────────────────────────

function aggregateAreasForImprovement(
  quality: SleepQualityResult,
  compliance: SleepComplianceResult,
  policy: SleepPolicyResult,
  staff: StaffSleepReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall sleep hygiene quality rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall sleep hygiene quality Requires Improvement (" + overallScore + "/100)");
  }

  areas.push(...quality.concerns);
  areas.push(...compliance.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ──────────────────────────────────────────────────────

function generateActions(
  quality: SleepQualityResult,
  compliance: SleepComplianceResult,
  policy: SleepPolicyResult,
  staff: StaffSleepReadinessResult,
  childProfiles: ChildSleepProfile[],
): string[] {
  const actions: string[] = [];

  // Missing policy = URGENT
  if (policy.score === 0) {
    actions.push("URGENT: No sleep hygiene policy in place — develop and implement comprehensive sleep policy immediately");
  }

  // Missing training = URGENT
  if (staff.totalStaff === 0) {
    actions.push("URGENT: No staff sleep training records — schedule sleep hygiene training for all staff immediately");
  }

  // Very poor sleep quality
  if (quality.totalRecords > 0 && quality.sleepQualityRate < 30) {
    actions.push("URGENT: Sleep quality critically low at " + quality.sleepQualityRate + "% — initiate comprehensive sleep review for all children");
  }

  // Children with low sleep scores
  const lowScoreChildren = childProfiles.filter((p) => p.sleepScore <= 3);
  if (lowScoreChildren.length > 0) {
    actions.push("URGENT: " + lowScoreChildren.length + " child(ren) with low sleep scores — arrange individual sleep assessments and support plans");
  }

  // Missing bedtime routine guideline
  if (!policy.bedtimeRoutineGuideline && policy.score > 0) {
    actions.push("HIGH: No bedtime routine guideline — develop age-appropriate bedtime routine guidance");
  }

  // Missing night monitoring
  if (!policy.nightMonitoringProcedure && policy.score > 0) {
    actions.push("HIGH: No night monitoring procedure — establish overnight monitoring protocols");
  }

  // Low staff sleep hygiene knowledge
  if (staff.totalStaff > 0 && staff.sleepHygieneKnowledgeRate < 70) {
    actions.push("HIGH: Sleep hygiene knowledge at " + staff.sleepHygieneKnowledgeRate + "% — schedule foundational sleep training");
  }

  // Low documentation rate
  if (compliance.totalRecords > 0 && compliance.documentedRate < 60) {
    actions.push("MEDIUM: Care plan documentation at " + compliance.documentedRate + "% — ensure sleep needs recorded in all care plans");
  }

  // Low monitoring rate
  if (compliance.totalRecords > 0 && compliance.staffMonitoredRate < 70) {
    actions.push("MEDIUM: Staff monitoring at " + compliance.staffMonitoredRate + "% — review overnight staffing and monitoring rota");
  }

  // Low routine adherence
  if (quality.totalRecords > 0 && quality.routineRate < 70) {
    actions.push("MEDIUM: Routine adherence at " + quality.routineRate + "% — reinforce consistent bedtime routines across the home");
  }

  // Low trauma-informed sleep
  if (staff.totalStaff > 0 && staff.traumaInformedSleepRate < 50) {
    actions.push("MEDIUM: Trauma-informed sleep practice at " + staff.traumaInformedSleepRate + "% — arrange specialist training for care team");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Sleep hygiene systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ──────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Regulation 6 — The health and wellbeing standard",
    "CHR 2015 Regulation 9 — Quality of care standard",
    "SCCIF — Health and wellbeing of children",
    "NMS 6 — Health and wellbeing",
    "NMS 7 — Leisure activities (rest and relaxation)",
    "Children Act 1989 — Duty of care",
    "NICE Guideline NG92 — Sleep disorders in children",
  ];
}
