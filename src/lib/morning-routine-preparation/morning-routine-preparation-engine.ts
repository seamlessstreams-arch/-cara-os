import { above, below, meanOf, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// Morning Routine & Preparation Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home supports children's morning routines:
//   1. Routine Completion (completion rate, on-time, breakfast, documentation)
//   2. Wellbeing & Readiness (mood, parent communication, independence)
//   3. Morning Policy (policy framework and governance)
//   4. Staff Morning Readiness (training across morning support skills)
//
// Regulatory: CHR 2015 Reg 8, CHR 2015 Reg 10, SCCIF, NMS 6,
//             Children Act 1989, UNCRC Article 28, Ofsted ILACS
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type RoutineElement =
  | "wake_up"
  | "personal_hygiene"
  | "breakfast"
  | "medication"
  | "uniform_preparation"
  | "bag_packed"
  | "transport_ready"
  | "emotional_check_in";

export type CompletionStatus =
  | "completed_independently"
  | "completed_with_support"
  | "partially_completed"
  | "not_completed"
  | "refused";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const routineElementLabels: Record<RoutineElement, string> = {
  wake_up: "Wake Up",
  personal_hygiene: "Personal Hygiene",
  breakfast: "Breakfast",
  medication: "Medication",
  uniform_preparation: "Uniform Preparation",
  bag_packed: "Bag Packed",
  transport_ready: "Transport Ready",
  emotional_check_in: "Emotional Check-In",
};

const completionStatusLabels: Record<CompletionStatus, string> = {
  completed_independently: "Completed Independently",
  completed_with_support: "Completed with Support",
  partially_completed: "Partially Completed",
  not_completed: "Not Completed",
  refused: "Refused",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getRoutineElementLabel(r: RoutineElement): string {
  return routineElementLabels[r] ?? r;
}
export function getCompletionStatusLabel(c: CompletionStatus): string {
  return completionStatusLabels[c] ?? c;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface MorningRecord {
  id: string;
  childId: string;
  childName: string;
  recordDate: string;
  routineElement: RoutineElement;
  completionStatus: CompletionStatus;
  onTimeForSchool: boolean;
  breakfastEaten: boolean;
  staffSupported: boolean;
  moodPositive: boolean;
  documentedInLog: boolean;
  parentCarerInformed: boolean;
}

export interface MorningPolicy {
  id: string;
  morningRoutinePolicy: boolean;
  breakfastStandards: boolean;
  schoolReadinessProtocol: boolean;
  punctualityTracking: boolean;
  individualRoutinePlans: boolean;
  staffHandoverProcess: boolean;
  regularReview: boolean;
}

export interface StaffMorningTraining {
  id: string;
  staffId: string;
  staffName: string;
  morningRoutineManagement: boolean;
  breakfastNutrition: boolean;
  emotionalRegulation: boolean;
  timeManagement: boolean;
  schoolLiaison: boolean;
  handoverPractice: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface RoutineCompletionResult {
  overallScore: number;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  completionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  onTimeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  breakfastRate: number | null;
  supportDocumentationRate: number | null;
}

export interface WellbeingReadinessResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  moodPositiveRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  parentInformedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  independentCompletionRate: number | null;
}

export interface MorningPolicyResult {
  overallScore: number;
  morningRoutinePolicy: boolean;
  breakfastStandards: boolean;
  schoolReadinessProtocol: boolean;
  punctualityTracking: boolean;
  individualRoutinePlans: boolean;
  staffHandoverProcess: boolean;
  regularReview: boolean;
}

export interface StaffMorningReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  morningRoutineManagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  breakfastNutritionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  emotionalRegulationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timeManagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  schoolLiaisonRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  handoverPracticeRate: number | null;
}

export interface ChildMorningProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  completionRate: number;
  onTimeRate: number;
  breakfastRate: number;
  overallScore: number;
}

export interface MorningRoutinePreparationIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  routineCompletion: RoutineCompletionResult;
  wellbeingReadiness: WellbeingReadinessResult;
  morningPolicy: MorningPolicyResult;
  staffReadiness: StaffMorningReadinessResult;
  childProfiles: ChildMorningProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluators ----------------------------------------------------------------

/**
 * Evaluates routine completion across morning records.
 * Empty = 0 (no records = no evidence of morning monitoring).
 *
 *   Completion rate (independently + with support)  -> 0-7
 *   On-time for school rate                         -> 0-6
 *   Breakfast eaten rate                            -> 0-6
 *   Combined staffSupported + documentedInLog       -> 0-6
 */
export function evaluateRoutineCompletion(
  records: MorningRecord[],
): RoutineCompletionResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      completionRate: null,
      onTimeRate: null,
      breakfastRate: null,
      supportDocumentationRate: null,
    };
  }

  let score = 0;

  const completed = records.filter(
    (r) => r.completionStatus === "completed_independently" || r.completionStatus === "completed_with_support",
  ).length;
  const completionRate = rate(completed, records.length);
  if (meets(completionRate, 80)) score += 7;
  else if (meets(completionRate, 60)) score += 5;
  else if (meets(completionRate, 40)) score += 3;
  else if (above(completionRate, 0)) score += 1;

  const onTime = records.filter((r) => r.onTimeForSchool).length;
  const onTimeRate = rate(onTime, records.length);
  if (meets(onTimeRate, 80)) score += 6;
  else if (meets(onTimeRate, 60)) score += 4;
  else if (meets(onTimeRate, 40)) score += 2;
  else if (above(onTimeRate, 0)) score += 1;

  const breakfast = records.filter((r) => r.breakfastEaten).length;
  const breakfastRate = rate(breakfast, records.length);
  if (meets(breakfastRate, 80)) score += 6;
  else if (meets(breakfastRate, 60)) score += 4;
  else if (meets(breakfastRate, 40)) score += 2;
  else if (above(breakfastRate, 0)) score += 1;

  const staffSupported = records.filter((r) => r.staffSupported).length;
  const documented = records.filter((r) => r.documentedInLog).length;
  const supportDocumentationRate = meanOf([rate(staffSupported, records.length), rate(documented, records.length)]) ?? 0;
  if (supportDocumentationRate >= 90) score += 6;
  else if (supportDocumentationRate >= 70) score += 4;
  else if (supportDocumentationRate >= 50) score += 3;
  else if (supportDocumentationRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: records.length,
    completionRate,
    onTimeRate,
    breakfastRate,
    supportDocumentationRate,
  };
}

/**
 * Evaluates wellbeing and readiness.
 * Empty = 0 (no records = no evidence).
 *
 *   Mood positive rate                             -> 0-8
 *   Parent/carer informed rate                     -> 0-9
 *   Independent completion rate (only independently) -> 0-8
 */
export function evaluateWellbeingReadiness(
  records: MorningRecord[],
): WellbeingReadinessResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      moodPositiveRate: null,
      parentInformedRate: null,
      independentCompletionRate: null,
    };
  }

  let score = 0;

  const moodPositive = records.filter((r) => r.moodPositive).length;
  const moodPositiveRate = rate(moodPositive, records.length);
  if (meets(moodPositiveRate, 90)) score += 8;
  else if (meets(moodPositiveRate, 70)) score += 6;
  else if (meets(moodPositiveRate, 50)) score += 4;
  else if (above(moodPositiveRate, 0)) score += 2;

  const parentInformed = records.filter((r) => r.parentCarerInformed).length;
  const parentInformedRate = rate(parentInformed, records.length);
  if (meets(parentInformedRate, 90)) score += 9;
  else if (meets(parentInformedRate, 70)) score += 6;
  else if (meets(parentInformedRate, 50)) score += 4;
  else if (above(parentInformedRate, 0)) score += 2;

  const independent = records.filter((r) => r.completionStatus === "completed_independently").length;
  const independentCompletionRate = rate(independent, records.length);
  if (meets(independentCompletionRate, 90)) score += 8;
  else if (meets(independentCompletionRate, 70)) score += 6;
  else if (meets(independentCompletionRate, 50)) score += 4;
  else if (above(independentCompletionRate, 0)) score += 2;

  return {
    overallScore: Math.min(score, 25),
    moodPositiveRate,
    parentInformedRate,
    independentCompletionRate,
  };
}

/**
 * Evaluates morning policy and governance.
 * Null = 0.
 *
 *   morningRoutinePolicy      -> 0-4
 *   breakfastStandards        -> 0-4
 *   schoolReadinessProtocol   -> 0-4
 *   punctualityTracking       -> 0-4
 *   individualRoutinePlans    -> 0-3
 *   staffHandoverProcess      -> 0-3
 *   regularReview             -> 0-3
 */
export function evaluateMorningPolicy(
  policy: MorningPolicy | null,
): MorningPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      morningRoutinePolicy: false,
      breakfastStandards: false,
      schoolReadinessProtocol: false,
      punctualityTracking: false,
      individualRoutinePlans: false,
      staffHandoverProcess: false,
      regularReview: false,
    };
  }

  let score = 0;

  if (policy.morningRoutinePolicy) score += 4;
  if (policy.breakfastStandards) score += 4;
  if (policy.schoolReadinessProtocol) score += 4;
  if (policy.punctualityTracking) score += 4;
  if (policy.individualRoutinePlans) score += 3;
  if (policy.staffHandoverProcess) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(score, 25),
    morningRoutinePolicy: policy.morningRoutinePolicy,
    breakfastStandards: policy.breakfastStandards,
    schoolReadinessProtocol: policy.schoolReadinessProtocol,
    punctualityTracking: policy.punctualityTracking,
    individualRoutinePlans: policy.individualRoutinePlans,
    staffHandoverProcess: policy.staffHandoverProcess,
    regularReview: policy.regularReview,
  };
}

/**
 * Evaluates staff morning support readiness.
 * Empty = 0.
 *
 *   morningRoutineManagement rate  -> 0-6
 *   breakfastNutrition rate        -> 0-5
 *   emotionalRegulation rate       -> 0-5
 *   timeManagement rate            -> 0-4
 *   schoolLiaison rate             -> 0-3
 *   handoverPractice rate          -> 0-2
 */
export function evaluateStaffMorningReadiness(
  training: StaffMorningTraining[],
): StaffMorningReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      morningRoutineManagementRate: null,
      breakfastNutritionRate: null,
      emotionalRegulationRate: null,
      timeManagementRate: null,
      schoolLiaisonRate: null,
      handoverPracticeRate: null,
    };
  }

  let score = 0;

  const mrm = training.filter((t) => t.morningRoutineManagement).length;
  const morningRoutineManagementRate = rate(mrm, training.length);
  if (meets(morningRoutineManagementRate, 90)) score += 6;
  else if (meets(morningRoutineManagementRate, 70)) score += 4;
  else if (meets(morningRoutineManagementRate, 50)) score += 3;
  else if (above(morningRoutineManagementRate, 0)) score += 1;

  const bn = training.filter((t) => t.breakfastNutrition).length;
  const breakfastNutritionRate = rate(bn, training.length);
  if (meets(breakfastNutritionRate, 90)) score += 5;
  else if (meets(breakfastNutritionRate, 70)) score += 3;
  else if (meets(breakfastNutritionRate, 50)) score += 2;
  else if (above(breakfastNutritionRate, 0)) score += 1;

  const er = training.filter((t) => t.emotionalRegulation).length;
  const emotionalRegulationRate = rate(er, training.length);
  if (meets(emotionalRegulationRate, 90)) score += 5;
  else if (meets(emotionalRegulationRate, 70)) score += 3;
  else if (meets(emotionalRegulationRate, 50)) score += 2;
  else if (above(emotionalRegulationRate, 0)) score += 1;

  const tm = training.filter((t) => t.timeManagement).length;
  const timeManagementRate = rate(tm, training.length);
  if (meets(timeManagementRate, 90)) score += 4;
  else if (meets(timeManagementRate, 70)) score += 3;
  else if (meets(timeManagementRate, 50)) score += 2;
  else if (above(timeManagementRate, 0)) score += 1;

  const sl = training.filter((t) => t.schoolLiaison).length;
  const schoolLiaisonRate = rate(sl, training.length);
  if (meets(schoolLiaisonRate, 90)) score += 3;
  else if (meets(schoolLiaisonRate, 70)) score += 2;
  else if (meets(schoolLiaisonRate, 50)) score += 1;

  const hp = training.filter((t) => t.handoverPractice).length;
  const handoverPracticeRate = rate(hp, training.length);
  if (meets(handoverPracticeRate, 90)) score += 2;
  else if (meets(handoverPracticeRate, 70)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    morningRoutineManagementRate,
    breakfastNutritionRate,
    emotionalRegulationRate,
    timeManagementRate,
    schoolLiaisonRate,
    handoverPracticeRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildMorningProfiles(
  records: MorningRecord[],
): ChildMorningProfile[] {
  const childMap = new Map<
    string,
    { childId: string; childName: string; records: MorningRecord[] }
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

    // Completion rate (0-3)
    const completed = entry.records.filter(
      (r) => r.completionStatus === "completed_independently" || r.completionStatus === "completed_with_support",
    ).length;
    const completionRate = rate(completed, entry.records.length)!;
    if (meets(completionRate, 80)) score += 3;
    else if (meets(completionRate, 50)) score += 2;
    else if (above(completionRate, 0)) score += 1;

    // On-time rate (0-3)
    const onTime = entry.records.filter((r) => r.onTimeForSchool).length;
    const onTimeRate = rate(onTime, entry.records.length)!;
    if (meets(onTimeRate, 80)) score += 3;
    else if (meets(onTimeRate, 50)) score += 2;
    else if (above(onTimeRate, 0)) score += 1;

    // Breakfast rate (0-2)
    const breakfast = entry.records.filter((r) => r.breakfastEaten).length;
    const breakfastRate = rate(breakfast, entry.records.length)!;
    if (meets(breakfastRate, 80)) score += 2;
    else if (meets(breakfastRate, 50)) score += 1;

    return {
      childId: entry.childId,
      childName: entry.childName,
      totalRecords: entry.records.length,
      completionRate,
      onTimeRate,
      breakfastRate,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateMorningRoutinePreparationIntelligence(
  records: MorningRecord[],
  policy: MorningPolicy | null,
  training: StaffMorningTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): MorningRoutinePreparationIntelligence {
  const routineCompletion = evaluateRoutineCompletion(records);
  const wellbeingReadiness = evaluateWellbeingReadiness(records);
  const morningPolicy = evaluateMorningPolicy(policy);
  const staffReadiness = evaluateStaffMorningReadiness(training);

  const rawScore =
    routineCompletion.overallScore +
    wellbeingReadiness.overallScore +
    morningPolicy.overallScore +
    staffReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildMorningProfiles(records);

  // -- Strengths
  const strengths: string[] = [];

  if (meets(routineCompletion.completionRate, 80) && records.length > 0) {
    strengths.push("Children consistently completing morning routine tasks");
  }
  if (meets(routineCompletion.onTimeRate, 80) && records.length > 0) {
    strengths.push("Strong punctuality with children consistently on time for school");
  }
  if (meets(routineCompletion.breakfastRate, 80) && records.length > 0) {
    strengths.push("Good nutritional start with breakfast consistently eaten before school");
  }
  if (meets(wellbeingReadiness.moodPositiveRate, 90) && records.length > 0) {
    strengths.push("Children starting the day in a positive emotional state");
  }
  if (meets(wellbeingReadiness.independentCompletionRate, 80) && records.length > 0) {
    strengths.push("Children demonstrating strong independence in morning routines");
  }
  if (meets(staffReadiness.morningRoutineManagementRate, 90) && training.length > 0) {
    strengths.push("Staff team fully trained in morning routine management");
  }
  if (morningPolicy.individualRoutinePlans && policy) {
    strengths.push("Individual morning routine plans in place for each child");
  }

  // -- Areas for improvement
  const areasForImprovement: string[] = [];

  if (below(routineCompletion.onTimeRate, 60) && records.length > 0) {
    areasForImprovement.push("School punctuality below expected standard — review morning scheduling and transport arrangements");
  }
  if (below(routineCompletion.breakfastRate, 60) && records.length > 0) {
    areasForImprovement.push("Breakfast participation needs improvement — review breakfast provision and encouragement strategies");
  }
  if (below(wellbeingReadiness.moodPositiveRate, 60) && records.length > 0) {
    areasForImprovement.push("Children's morning mood needs attention — review wake-up approaches and emotional support");
  }
  if (below(wellbeingReadiness.independentCompletionRate, 50) && records.length > 0) {
    areasForImprovement.push("Independence in morning routines needs development — consider graduated support strategies");
  }
  if (below(staffReadiness.emotionalRegulationRate, 70) && training.length > 0) {
    areasForImprovement.push("Staff training on morning emotional regulation needs strengthening");
  }

  // -- Actions
  const actions: string[] = [];

  if (records.length === 0) {
    actions.push("No morning routine records — implement systematic morning monitoring for all children");
  }
  if (!policy) {
    actions.push("URGENT: No morning routine policy in place — develop morning routine and school readiness policy");
  }
  if (training.length === 0) {
    actions.push("URGENT: No staff morning training records — deliver training on morning routine management and school preparation");
  }
  if (below(routineCompletion.completionRate, 60) && records.length > 0) {
    actions.push("Improve morning routine completion rates across the home");
  }
  if (below(wellbeingReadiness.parentInformedRate, 70) && records.length > 0) {
    actions.push("Strengthen parent/carer communication about morning routines");
  }
  if (below(routineCompletion.supportDocumentationRate, 70) && records.length > 0) {
    actions.push("Improve documentation of morning support in daily logs");
  }

  // -- Regulatory links
  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 8 — The education standard",
    "CHR 2015 Regulation 10 — Health and wellbeing",
    "SCCIF — Experiences and progress of children",
    "NMS 6 — Health and wellbeing",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 28 — Right to education",
    "Ofsted ILACS — Education attendance and punctuality",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    routineCompletion,
    wellbeingReadiness,
    morningPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
