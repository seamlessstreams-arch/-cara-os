/* ──────────────────────────────────────────────────────────────
   Daily Log Intelligence Engine

   Pure deterministic engine for evaluating the quality, compliance,
   policy coverage, and staff readiness of daily recording practices
   in a children's residential home.

   Regulatory basis:
     - CHR 2015 Reg 36 / Schedule 3 — Records to be maintained
     - CHR 2015 Reg 37 — Notification of significant events
     - CHR 2015 Reg 34 — Quality of care (daily routines)
     - CHR 2015 Reg 5 — Quality and purpose of care
     - SCCIF — Children experience positive routines and relationships
     - DfE Guide to Children's Homes Regulations — Daily logs
     - Working Together 2023 — Information sharing

   No AI. No external calls. Pure input -> output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type DailyLogCategory =
  | "morning_routine"
  | "education_update"
  | "health_observation"
  | "social_interaction"
  | "emotional_wellbeing"
  | "evening_routine"
  | "night_observation"
  | "significant_event";

export type DailyLogOutcome =
  | "completed"
  | "partially_completed"
  | "not_completed"
  | "deferred"
  | "emergency_override";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Constants ─────────────────────────────────────────────────────────────

export const ALL_CATEGORIES: DailyLogCategory[] = [
  "morning_routine",
  "education_update",
  "health_observation",
  "social_interaction",
  "emotional_wellbeing",
  "evening_routine",
  "night_observation",
  "significant_event",
];

// ── Label Maps ────────────────────────────────────────────────────────────

const dailyLogCategoryLabels: Record<DailyLogCategory, string> = {
  morning_routine: "Morning Routine",
  education_update: "Education Update",
  health_observation: "Health Observation",
  social_interaction: "Social Interaction",
  emotional_wellbeing: "Emotional Wellbeing",
  evening_routine: "Evening Routine",
  night_observation: "Night Observation",
  significant_event: "Significant Event",
};

const dailyLogOutcomeLabels: Record<DailyLogOutcome, string> = {
  completed: "Completed",
  partially_completed: "Partially Completed",
  not_completed: "Not Completed",
  deferred: "Deferred",
  emergency_override: "Emergency Override",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getDailyLogCategoryLabel(category: DailyLogCategory): string {
  return dailyLogCategoryLabels[category];
}

export function getDailyLogOutcomeLabel(outcome: DailyLogOutcome): string {
  return dailyLogOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface DailyLogRecord {
  id: string;
  childId: string;
  childName: string;
  logDate: string;
  category: DailyLogCategory;
  // 4 quality indicators
  detailedObservation: boolean;
  childMoodRecorded: boolean;
  keyworkerInformed: boolean;
  actionFollowedUp: boolean;
  // 2 compliance indicators
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface DailyLogPolicy {
  id: string;
  dailyRecordingPolicy: boolean;
  observationFramework: boolean;
  handoverProtocol: boolean;
  significantEventsProcedure: boolean;
  childParticipationGuidance: boolean;
  qualityAssuranceProcess: boolean;
  reviewSchedule: boolean;
}

export interface StaffDailyLogTraining {
  id: string;
  staffId: string;
  staffName: string;
  observationSkills: boolean;
  recordKeeping: boolean;
  childCommunication: boolean;
  safeguardingAwareness: boolean;
  handoverPractice: boolean;
  reflectiveWriting: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface DailyLogQualityResult {
  totalRecords: number;
  detailedObservationRate: number;
  childMoodRate: number;
  keyworkerInformedRate: number;
  actionFollowedUpRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface DailyLogComplianceResult {
  totalRecords: number;
  documentationRate: number;
  timelyRecordingRate: number;
  keyworkerInformedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface DailyLogPolicyResult {
  dailyRecordingPolicy: boolean;
  observationFramework: boolean;
  handoverProtocol: boolean;
  significantEventsProcedure: boolean;
  childParticipationGuidance: boolean;
  qualityAssuranceProcess: boolean;
  reviewSchedule: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface StaffDailyLogReadinessResult {
  totalStaff: number;
  observationSkillsRate: number;
  recordKeepingRate: number;
  childCommunicationRate: number;
  safeguardingAwarenessRate: number;
  handoverPracticeRate: number;
  reflectiveWritingRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ChildDailyLogProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  detailedObservationRate: number;
  childMoodRate: number;
  uniqueCategories: number;
  dailyLogScore: number;
}

export interface DailyLogIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  dailyLogQuality: DailyLogQualityResult;
  dailyLogCompliance: DailyLogComplianceResult;
  dailyLogPolicy: DailyLogPolicyResult;
  staffReadiness: StaffDailyLogReadinessResult;
  childProfiles: ChildDailyLogProfile[];
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

// ── Evaluator 1: Daily Log Quality (0-25) ─────────────────────────────────

export function evaluateDailyLogQuality(
  records: DailyLogRecord[],
): DailyLogQualityResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      detailedObservationRate: 0,
      childMoodRate: 0,
      keyworkerInformedRate: 0,
      actionFollowedUpRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No daily log records — quality cannot be assessed"],
    };
  }

  const detailedCount = records.filter((r) => r.detailedObservation).length;
  const detailedObservationRate = pct(detailedCount, totalRecords);

  const moodCount = records.filter((r) => r.childMoodRecorded).length;
  const childMoodRate = pct(moodCount, totalRecords);

  const keyworkerCount = records.filter((r) => r.keyworkerInformed).length;
  const keyworkerInformedRate = pct(keyworkerCount, totalRecords);

  const actionCount = records.filter((r) => r.actionFollowedUp).length;
  const actionFollowedUpRate = pct(actionCount, totalRecords);

  // Weights: detailedObservationRate 7 + childMoodRate 6 + keyworkerInformedRate 6 + actionFollowedUpRate 6 = 25
  let score = 0;
  score += (detailedObservationRate / 100) * 7;
  score += (childMoodRate / 100) * 6;
  score += (keyworkerInformedRate / 100) * 6;
  score += (actionFollowedUpRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (detailedObservationRate >= 80) {
    strengths.push("Strong detailed observations: " + detailedObservationRate + "% of records include thorough observations");
  } else if (detailedObservationRate < 50) {
    concerns.push("Detailed observation rate at " + detailedObservationRate + "% — observations lack sufficient detail");
  }

  if (childMoodRate >= 80) {
    strengths.push("Excellent mood recording: " + childMoodRate + "% of records capture child mood");
  } else if (childMoodRate < 50) {
    concerns.push("Child mood recording at " + childMoodRate + "% — mood not consistently captured");
  }

  if (keyworkerInformedRate >= 80) {
    strengths.push("Good keyworker communication: " + keyworkerInformedRate + "% of records show keyworker informed");
  } else if (keyworkerInformedRate < 50) {
    concerns.push("Keyworker informed rate at " + keyworkerInformedRate + "% — keyworkers not consistently updated");
  }

  if (actionFollowedUpRate >= 80) {
    strengths.push("Strong follow-up practice: " + actionFollowedUpRate + "% of actions followed up");
  } else if (actionFollowedUpRate < 50) {
    concerns.push("Action follow-up rate at " + actionFollowedUpRate + "% — actions not consistently completed");
  }

  return {
    totalRecords,
    detailedObservationRate,
    childMoodRate,
    keyworkerInformedRate,
    actionFollowedUpRate,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 2: Daily Log Compliance (0-25) ──────────────────────────────

export function evaluateDailyLogCompliance(
  records: DailyLogRecord[],
): DailyLogComplianceResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      documentationRate: 0,
      timelyRecordingRate: 0,
      keyworkerInformedRate: 0,
      categoryDiversityRatio: 0,
      uniqueCategories: 0,
      score: 0,
      strengths: [],
      concerns: ["No daily log records — compliance cannot be assessed"],
    };
  }

  const docCount = records.filter((r) => r.documentationComplete).length;
  const documentationRate = pct(docCount, totalRecords);

  const timelyCount = records.filter((r) => r.timelyRecording).length;
  const timelyRecordingRate = pct(timelyCount, totalRecords);

  const keyworkerCount = records.filter((r) => r.keyworkerInformed).length;
  const keyworkerInformedRate = pct(keyworkerCount, totalRecords);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = pct(uniqueCategories, ALL_CATEGORIES.length);

  // Weights: documentationRate 8 + timelyRecordingRate 7 + keyworkerInformedRate 5 + categoryDiversityRatio 5 = 25
  let score = 0;
  score += (documentationRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (keyworkerInformedRate / 100) * 5;
  score += (categoryDiversityRatio / 100) * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (documentationRate >= 90) {
    strengths.push("Excellent documentation: " + documentationRate + "% of records fully documented");
  } else if (documentationRate < 50) {
    concerns.push("Documentation rate at " + documentationRate + "% — records are incomplete");
  }

  if (timelyRecordingRate >= 80) {
    strengths.push("Timely recording: " + timelyRecordingRate + "% of entries recorded promptly");
  } else if (timelyRecordingRate < 50) {
    concerns.push("Timely recording at " + timelyRecordingRate + "% — records not completed within expected timeframes");
  }

  if (keyworkerInformedRate >= 80) {
    strengths.push("Good keyworker communication: " + keyworkerInformedRate + "% compliance with keyworker notification");
  } else if (keyworkerInformedRate < 50) {
    concerns.push("Keyworker informed rate at " + keyworkerInformedRate + "% — information not reliably shared");
  }

  if (uniqueCategories >= 6) {
    strengths.push("Comprehensive category coverage: " + uniqueCategories + " of " + ALL_CATEGORIES.length + " categories represented");
  } else if (uniqueCategories <= 2) {
    concerns.push("Only " + uniqueCategories + " category(ies) covered — recording scope is very limited");
  }

  return {
    totalRecords,
    documentationRate,
    timelyRecordingRate,
    keyworkerInformedRate,
    categoryDiversityRatio,
    uniqueCategories,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 3: Daily Log Policy (0-25) ──────────────────────────────────

export function evaluateDailyLogPolicy(
  policy: DailyLogPolicy | null,
): DailyLogPolicyResult {
  if (policy === null) {
    return {
      dailyRecordingPolicy: false,
      observationFramework: false,
      handoverProtocol: false,
      significantEventsProcedure: false,
      childParticipationGuidance: false,
      qualityAssuranceProcess: false,
      reviewSchedule: false,
      score: 0,
      strengths: [],
      concerns: ["No daily log policy in place — URGENT: develop comprehensive daily recording policy immediately"],
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.dailyRecordingPolicy) score += 4;
  if (policy.observationFramework) score += 4;
  if (policy.handoverProtocol) score += 4;
  if (policy.significantEventsProcedure) score += 4;
  if (policy.childParticipationGuidance) score += 3;
  if (policy.qualityAssuranceProcess) score += 3;
  if (policy.reviewSchedule) score += 3;

  const strengths: string[] = [];
  const concerns: string[] = [];

  const trueCount = [
    policy.dailyRecordingPolicy,
    policy.observationFramework,
    policy.handoverProtocol,
    policy.significantEventsProcedure,
    policy.childParticipationGuidance,
    policy.qualityAssuranceProcess,
    policy.reviewSchedule,
  ].filter(Boolean).length;

  if (trueCount === 7) {
    strengths.push("Complete daily log policy framework in place (7/7 components)");
  } else if (trueCount >= 5) {
    strengths.push("Good policy coverage: " + trueCount + "/7 daily log policy components in place");
  }

  if (!policy.dailyRecordingPolicy) {
    concerns.push("No daily recording policy — staff may lack clarity on recording expectations");
  }
  if (!policy.observationFramework) {
    concerns.push("No observation framework — inconsistent observation quality may result");
  }
  if (!policy.handoverProtocol) {
    concerns.push("No handover protocol — critical information may not transfer between shifts");
  }
  if (!policy.significantEventsProcedure) {
    concerns.push("No significant events procedure — significant events may not be properly recorded");
  }
  if (!policy.childParticipationGuidance) {
    concerns.push("No child participation guidance — children may not be involved in their daily records");
  }
  if (!policy.qualityAssuranceProcess) {
    concerns.push("No quality assurance process — record quality may not be monitored");
  }
  if (!policy.reviewSchedule) {
    concerns.push("No review schedule — daily recording practices may become outdated");
  }

  return {
    dailyRecordingPolicy: policy.dailyRecordingPolicy,
    observationFramework: policy.observationFramework,
    handoverProtocol: policy.handoverProtocol,
    significantEventsProcedure: policy.significantEventsProcedure,
    childParticipationGuidance: policy.childParticipationGuidance,
    qualityAssuranceProcess: policy.qualityAssuranceProcess,
    reviewSchedule: policy.reviewSchedule,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 4: Staff Daily Log Readiness (0-25) ─────────────────────────

export function evaluateStaffDailyLogReadiness(
  staff: StaffDailyLogTraining[],
): StaffDailyLogReadinessResult {
  const totalStaff = staff.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      observationSkillsRate: 0,
      recordKeepingRate: 0,
      childCommunicationRate: 0,
      safeguardingAwarenessRate: 0,
      handoverPracticeRate: 0,
      reflectiveWritingRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff training records — URGENT: schedule daily log training for all staff"],
    };
  }

  const obsCount = staff.filter((s) => s.observationSkills).length;
  const observationSkillsRate = pct(obsCount, totalStaff);

  const recCount = staff.filter((s) => s.recordKeeping).length;
  const recordKeepingRate = pct(recCount, totalStaff);

  const commCount = staff.filter((s) => s.childCommunication).length;
  const childCommunicationRate = pct(commCount, totalStaff);

  const safCount = staff.filter((s) => s.safeguardingAwareness).length;
  const safeguardingAwarenessRate = pct(safCount, totalStaff);

  const handCount = staff.filter((s) => s.handoverPractice).length;
  const handoverPracticeRate = pct(handCount, totalStaff);

  const refCount = staff.filter((s) => s.reflectiveWriting).length;
  const reflectiveWritingRate = pct(refCount, totalStaff);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (observationSkillsRate / 100) * 6;
  score += (recordKeepingRate / 100) * 5;
  score += (childCommunicationRate / 100) * 5;
  score += (safeguardingAwarenessRate / 100) * 4;
  score += (handoverPracticeRate / 100) * 3;
  score += (reflectiveWritingRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (observationSkillsRate >= 80) {
    strengths.push("Strong observation skills: " + observationSkillsRate + "% of staff trained");
  } else if (observationSkillsRate < 50) {
    concerns.push("Observation skills at " + observationSkillsRate + "% — foundational training needed");
  }

  if (recordKeepingRate >= 80) {
    strengths.push("Good record keeping skills: " + recordKeepingRate + "% of staff competent");
  } else if (recordKeepingRate < 50) {
    concerns.push("Record keeping at " + recordKeepingRate + "% — staff need support with documentation");
  }

  if (childCommunicationRate >= 80) {
    strengths.push("Strong child communication: " + childCommunicationRate + "% of staff skilled");
  } else if (childCommunicationRate < 50) {
    concerns.push("Child communication at " + childCommunicationRate + "% — staff may struggle to capture child voice");
  }

  if (safeguardingAwarenessRate >= 80) {
    strengths.push("Good safeguarding awareness: " + safeguardingAwarenessRate + "% of staff aware");
  } else if (safeguardingAwarenessRate < 50) {
    concerns.push("Safeguarding awareness at " + safeguardingAwarenessRate + "% — risk of missing safeguarding indicators");
  }

  if (handoverPracticeRate >= 80) {
    strengths.push("Effective handover practice: " + handoverPracticeRate + "% of staff trained");
  } else if (handoverPracticeRate < 50) {
    concerns.push("Handover practice at " + handoverPracticeRate + "% — information may not transfer between shifts");
  }

  if (reflectiveWritingRate >= 80) {
    strengths.push("Good reflective writing skills: " + reflectiveWritingRate + "% of staff capable");
  } else if (reflectiveWritingRate < 50) {
    concerns.push("Reflective writing at " + reflectiveWritingRate + "% — daily records may lack depth and analysis");
  }

  return {
    totalStaff,
    observationSkillsRate,
    recordKeepingRate,
    childCommunicationRate,
    safeguardingAwarenessRate,
    handoverPracticeRate,
    reflectiveWritingRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Daily Log Profiles ────────────────────────────────────────

export function buildChildDailyLogProfiles(
  records: DailyLogRecord[],
): ChildDailyLogProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: DailyLogRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;

    const detailedCount = child.records.filter((r) => r.detailedObservation).length;
    const detailedObservationRate = pct(detailedCount, totalRecords);

    const moodCount = child.records.filter((r) => r.childMoodRecorded).length;
    const childMoodRate = pct(moodCount, totalRecords);

    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const uniqueCategories = uniqueCategoriesSet.size;

    // frequency: >=10 records -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    // rate1 (detailedObservationRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (detailedObservationRate >= 80) rate1Score = 3;
    else if (detailedObservationRate >= 60) rate1Score = 2;
    else if (detailedObservationRate >= 40) rate1Score = 1;

    // rate2 (childMoodRate): same thresholds
    let rate2Score = 0;
    if (childMoodRate >= 80) rate2Score = 3;
    else if (childMoodRate >= 60) rate2Score = 2;
    else if (childMoodRate >= 40) rate2Score = 1;

    // diversity (unique categories): >=4 -> 2, >=2 -> 1, else 0
    let diversityBonus = 0;
    if (uniqueCategories >= 4) diversityBonus = 2;
    else if (uniqueCategories >= 2) diversityBonus = 1;

    const dailyLogScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalRecords,
      detailedObservationRate,
      childMoodRate,
      uniqueCategories,
      dailyLogScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateDailyLogIntelligence(
  records: DailyLogRecord[],
  policy: DailyLogPolicy | null,
  staff: StaffDailyLogTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): DailyLogIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter records to period
  const periodRecords = records.filter(
    (r) => r.logDate >= periodStart && r.logDate <= periodEnd,
  );

  // Evaluate each layer
  const dailyLogQuality = evaluateDailyLogQuality(periodRecords);
  const dailyLogCompliance = evaluateDailyLogCompliance(periodRecords);
  const dailyLogPolicy = evaluateDailyLogPolicy(policy);
  const staffReadiness = evaluateStaffDailyLogReadiness(staff);

  // Build child profiles
  const childProfiles = buildChildDailyLogProfiles(periodRecords);

  // Overall score capped at 100
  const overallScore = Math.min(
    100,
    Math.round(
      dailyLogQuality.score +
      dailyLogCompliance.score +
      dailyLogPolicy.score +
      staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths = aggregateStrengths(
    dailyLogQuality, dailyLogCompliance, dailyLogPolicy, staffReadiness, overallScore,
  );

  // Aggregate areas for improvement
  const areasForImprovement = aggregateAreasForImprovement(
    dailyLogQuality, dailyLogCompliance, dailyLogPolicy, staffReadiness, overallScore,
  );

  // Generate actions
  const actions = generateActions(
    dailyLogQuality, dailyLogCompliance, dailyLogPolicy, staffReadiness, childProfiles,
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
    dailyLogQuality,
    dailyLogCompliance,
    dailyLogPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ──────────────────────────────────────────────────

function aggregateStrengths(
  quality: DailyLogQualityResult,
  compliance: DailyLogComplianceResult,
  policy: DailyLogPolicyResult,
  staff: StaffDailyLogReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall daily log management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall daily log management rated Good (" + overallScore + "/100)");
  }

  if (quality.score >= 20) {
    strengths.push("Daily log quality is strong (score " + quality.score + "/25)");
  }
  if (compliance.score >= 20) {
    strengths.push("Daily log compliance is strong (score " + compliance.score + "/25)");
  }
  if (policy.score >= 20) {
    strengths.push("Daily log policy framework is robust (score " + policy.score + "/25)");
  }
  if (staff.score >= 20) {
    strengths.push("Staff daily log readiness is strong (score " + staff.score + "/25)");
  }

  strengths.push(...quality.strengths.slice(0, 2));
  strengths.push(...compliance.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ──────────────────────────────────────

function aggregateAreasForImprovement(
  quality: DailyLogQualityResult,
  compliance: DailyLogComplianceResult,
  policy: DailyLogPolicyResult,
  staff: StaffDailyLogReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall daily log management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall daily log management Requires Improvement (" + overallScore + "/100)");
  }

  if (quality.score < 15) {
    areas.push("Daily log quality needs improvement (score " + quality.score + "/25)");
  }
  if (compliance.score < 15) {
    areas.push("Daily log compliance needs improvement (score " + compliance.score + "/25)");
  }
  if (policy.score < 15) {
    areas.push("Daily log policy framework needs improvement (score " + policy.score + "/25)");
  }
  if (staff.score < 15) {
    areas.push("Staff daily log readiness needs improvement (score " + staff.score + "/25)");
  }

  areas.push(...quality.concerns);
  areas.push(...compliance.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ─────────────────────────────────────────────────────

function generateActions(
  quality: DailyLogQualityResult,
  compliance: DailyLogComplianceResult,
  policy: DailyLogPolicyResult,
  staff: StaffDailyLogReadinessResult,
  childProfiles: ChildDailyLogProfile[],
): string[] {
  const actions: string[] = [];

  // URGENT when policy score = 0
  if (policy.score === 0) {
    actions.push("URGENT: No daily log policy in place — develop and implement comprehensive daily recording policy immediately");
  }

  // URGENT when staff score = 0
  if (staff.totalStaff === 0) {
    actions.push("URGENT: No staff daily log training records — schedule daily recording training for all staff immediately");
  }

  // Conditional on rates < 50
  if (quality.totalRecords > 0 && quality.detailedObservationRate < 50) {
    actions.push("HIGH: Detailed observation rate at " + quality.detailedObservationRate + "% — improve observation depth and quality");
  }

  if (quality.totalRecords > 0 && quality.childMoodRate < 50) {
    actions.push("HIGH: Child mood recording at " + quality.childMoodRate + "% — ensure mood is captured in every daily record");
  }

  if (compliance.totalRecords > 0 && compliance.documentationRate < 50) {
    actions.push("HIGH: Documentation rate at " + compliance.documentationRate + "% — strengthen recording completion practices");
  }

  if (compliance.totalRecords > 0 && compliance.timelyRecordingRate < 50) {
    actions.push("HIGH: Timely recording at " + compliance.timelyRecordingRate + "% — records must be completed within shift");
  }

  if (quality.totalRecords > 0 && quality.keyworkerInformedRate < 50) {
    actions.push("MEDIUM: Keyworker informed rate at " + quality.keyworkerInformedRate + "% — improve communication with keyworkers");
  }

  if (quality.totalRecords > 0 && quality.actionFollowedUpRate < 50) {
    actions.push("MEDIUM: Action follow-up at " + quality.actionFollowedUpRate + "% — ensure all identified actions are completed");
  }

  if (staff.totalStaff > 0 && staff.observationSkillsRate < 50) {
    actions.push("MEDIUM: Staff observation skills at " + staff.observationSkillsRate + "% — schedule refresher training on observation techniques");
  }

  // Children with low scores
  const lowScoreChildren = childProfiles.filter((p) => p.dailyLogScore <= 3);
  if (lowScoreChildren.length > 0) {
    actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low daily log scores — review individual recording quality");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Daily log systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ─────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Regulation 36 / Schedule 3 — Records to be maintained",
    "CHR 2015 Regulation 37 — Notification of significant events",
    "CHR 2015 Regulation 34 — Quality of care (daily routines)",
    "CHR 2015 Regulation 5 — Quality and purpose of care",
    "SCCIF — Children experience positive routines and relationships",
    "DfE Guide to Children's Homes Regulations — Daily log requirements",
    "Working Together 2023 — Information sharing to safeguard children",
  ];
}
