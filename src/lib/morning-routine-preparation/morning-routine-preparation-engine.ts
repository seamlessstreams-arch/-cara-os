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
  completionRate: number;
  onTimeRate: number;
  breakfastRate: number;
  supportDocumentationRate: number;
}

export interface WellbeingReadinessResult {
  overallScore: number;
  moodPositiveRate: number;
  parentInformedRate: number;
  independentCompletionRate: number;
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
  morningRoutineManagementRate: number;
  breakfastNutritionRate: number;
  emotionalRegulationRate: number;
  timeManagementRate: number;
  schoolLiaisonRate: number;
  handoverPracticeRate: number;
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
      completionRate: 0,
      onTimeRate: 0,
      breakfastRate: 0,
      supportDocumentationRate: 0,
    };
  }

  let score = 0;

  const completed = records.filter(
    (r) => r.completionStatus === "completed_independently" || r.completionStatus === "completed_with_support",
  ).length;
  const completionRate = pct(completed, records.length);
  if (completionRate >= 80) score += 7;
  else if (completionRate >= 60) score += 5;
  else if (completionRate >= 40) score += 3;
  else if (completionRate > 0) score += 1;

  const onTime = records.filter((r) => r.onTimeForSchool).length;
  const onTimeRate = pct(onTime, records.length);
  if (onTimeRate >= 80) score += 6;
  else if (onTimeRate >= 60) score += 4;
  else if (onTimeRate >= 40) score += 2;
  else if (onTimeRate > 0) score += 1;

  const breakfast = records.filter((r) => r.breakfastEaten).length;
  const breakfastRate = pct(breakfast, records.length);
  if (breakfastRate >= 80) score += 6;
  else if (breakfastRate >= 60) score += 4;
  else if (breakfastRate >= 40) score += 2;
  else if (breakfastRate > 0) score += 1;

  const staffSupported = records.filter((r) => r.staffSupported).length;
  const documented = records.filter((r) => r.documentedInLog).length;
  const supportDocumentationRate = Math.round((pct(staffSupported, records.length) + pct(documented, records.length)) / 2);
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
      moodPositiveRate: 0,
      parentInformedRate: 0,
      independentCompletionRate: 0,
    };
  }

  let score = 0;

  const moodPositive = records.filter((r) => r.moodPositive).length;
  const moodPositiveRate = pct(moodPositive, records.length);
  if (moodPositiveRate >= 90) score += 8;
  else if (moodPositiveRate >= 70) score += 6;
  else if (moodPositiveRate >= 50) score += 4;
  else if (moodPositiveRate > 0) score += 2;

  const parentInformed = records.filter((r) => r.parentCarerInformed).length;
  const parentInformedRate = pct(parentInformed, records.length);
  if (parentInformedRate >= 90) score += 9;
  else if (parentInformedRate >= 70) score += 6;
  else if (parentInformedRate >= 50) score += 4;
  else if (parentInformedRate > 0) score += 2;

  const independent = records.filter((r) => r.completionStatus === "completed_independently").length;
  const independentCompletionRate = pct(independent, records.length);
  if (independentCompletionRate >= 90) score += 8;
  else if (independentCompletionRate >= 70) score += 6;
  else if (independentCompletionRate >= 50) score += 4;
  else if (independentCompletionRate > 0) score += 2;

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
      morningRoutineManagementRate: 0,
      breakfastNutritionRate: 0,
      emotionalRegulationRate: 0,
      timeManagementRate: 0,
      schoolLiaisonRate: 0,
      handoverPracticeRate: 0,
    };
  }

  let score = 0;

  const mrm = training.filter((t) => t.morningRoutineManagement).length;
  const morningRoutineManagementRate = pct(mrm, training.length);
  if (morningRoutineManagementRate >= 90) score += 6;
  else if (morningRoutineManagementRate >= 70) score += 4;
  else if (morningRoutineManagementRate >= 50) score += 3;
  else if (morningRoutineManagementRate > 0) score += 1;

  const bn = training.filter((t) => t.breakfastNutrition).length;
  const breakfastNutritionRate = pct(bn, training.length);
  if (breakfastNutritionRate >= 90) score += 5;
  else if (breakfastNutritionRate >= 70) score += 3;
  else if (breakfastNutritionRate >= 50) score += 2;
  else if (breakfastNutritionRate > 0) score += 1;

  const er = training.filter((t) => t.emotionalRegulation).length;
  const emotionalRegulationRate = pct(er, training.length);
  if (emotionalRegulationRate >= 90) score += 5;
  else if (emotionalRegulationRate >= 70) score += 3;
  else if (emotionalRegulationRate >= 50) score += 2;
  else if (emotionalRegulationRate > 0) score += 1;

  const tm = training.filter((t) => t.timeManagement).length;
  const timeManagementRate = pct(tm, training.length);
  if (timeManagementRate >= 90) score += 4;
  else if (timeManagementRate >= 70) score += 3;
  else if (timeManagementRate >= 50) score += 2;
  else if (timeManagementRate > 0) score += 1;

  const sl = training.filter((t) => t.schoolLiaison).length;
  const schoolLiaisonRate = pct(sl, training.length);
  if (schoolLiaisonRate >= 90) score += 3;
  else if (schoolLiaisonRate >= 70) score += 2;
  else if (schoolLiaisonRate >= 50) score += 1;

  const hp = training.filter((t) => t.handoverPractice).length;
  const handoverPracticeRate = pct(hp, training.length);
  if (handoverPracticeRate >= 90) score += 2;
  else if (handoverPracticeRate >= 70) score += 1;

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
    const completionRate = pct(completed, entry.records.length);
    if (completionRate >= 80) score += 3;
    else if (completionRate >= 50) score += 2;
    else if (completionRate > 0) score += 1;

    // On-time rate (0-3)
    const onTime = entry.records.filter((r) => r.onTimeForSchool).length;
    const onTimeRate = pct(onTime, entry.records.length);
    if (onTimeRate >= 80) score += 3;
    else if (onTimeRate >= 50) score += 2;
    else if (onTimeRate > 0) score += 1;

    // Breakfast rate (0-2)
    const breakfast = entry.records.filter((r) => r.breakfastEaten).length;
    const breakfastRate = pct(breakfast, entry.records.length);
    if (breakfastRate >= 80) score += 2;
    else if (breakfastRate >= 50) score += 1;

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

  if (routineCompletion.completionRate >= 80 && records.length > 0) {
    strengths.push("Children consistently completing morning routine tasks");
  }
  if (routineCompletion.onTimeRate >= 80 && records.length > 0) {
    strengths.push("Strong punctuality with children consistently on time for school");
  }
  if (routineCompletion.breakfastRate >= 80 && records.length > 0) {
    strengths.push("Good nutritional start with breakfast consistently eaten before school");
  }
  if (wellbeingReadiness.moodPositiveRate >= 90 && records.length > 0) {
    strengths.push("Children starting the day in a positive emotional state");
  }
  if (wellbeingReadiness.independentCompletionRate >= 80 && records.length > 0) {
    strengths.push("Children demonstrating strong independence in morning routines");
  }
  if (staffReadiness.morningRoutineManagementRate >= 90 && training.length > 0) {
    strengths.push("Staff team fully trained in morning routine management");
  }
  if (morningPolicy.individualRoutinePlans && policy) {
    strengths.push("Individual morning routine plans in place for each child");
  }

  // -- Areas for improvement
  const areasForImprovement: string[] = [];

  if (routineCompletion.onTimeRate < 60 && records.length > 0) {
    areasForImprovement.push("School punctuality below expected standard — review morning scheduling and transport arrangements");
  }
  if (routineCompletion.breakfastRate < 60 && records.length > 0) {
    areasForImprovement.push("Breakfast participation needs improvement — review breakfast provision and encouragement strategies");
  }
  if (wellbeingReadiness.moodPositiveRate < 60 && records.length > 0) {
    areasForImprovement.push("Children's morning mood needs attention — review wake-up approaches and emotional support");
  }
  if (wellbeingReadiness.independentCompletionRate < 50 && records.length > 0) {
    areasForImprovement.push("Independence in morning routines needs development — consider graduated support strategies");
  }
  if (staffReadiness.emotionalRegulationRate < 70 && training.length > 0) {
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
  if (routineCompletion.completionRate < 60 && records.length > 0) {
    actions.push("Improve morning routine completion rates across the home");
  }
  if (wellbeingReadiness.parentInformedRate < 70 && records.length > 0) {
    actions.push("Strengthen parent/carer communication about morning routines");
  }
  if (routineCompletion.supportDocumentationRate < 70 && records.length > 0) {
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
