// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Workforce Development Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// "Ofsted expects leaders and managers to ensure that staff have the
//  qualifications, experience, skills and knowledge to deliver the
//  ethos of the home and meet the needs of each child."
// — SCCIF 2023
//
// Regulatory framework:
//   CHR 2015 Reg 32         — Fitness of workers
//   CHR 2015 Reg 33         — Employment of staff / fitness of workers
//   CHR 2015 Reg 13         — Leadership and management
//   SCCIF                   — Leadership & management judgement area
//   Social Work England     — Professional standards for social workers
//   Working Together 2023   — Multi-agency competency framework
//
// Key requirements:
//   1. Staff hold appropriate qualifications for their role
//   2. CPD is evidenced, reflective, and linked to children's needs
//   3. Competency is regularly assessed with evidence of progression
//   4. Development plans are current, aligned, and staff-owned
//   5. Practice quality is observed and improvement trajectories tracked
//   6. Managers actively develop their workforce
//
// Scoring breakdown (0–100):
//   Qualifications:          20  — Mandatory compliance, Level 3+ attainment
//   CPD:                     20  — Hours, coverage, reflection, impact
//   Competency:              20  — Distribution, progression, currency
//   Development planning:    20  — Coverage, achievement, alignment
//   Practice quality:        20  — Ratings, follow-up, improvement
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type QualificationType =
  | "level_3_diploma"
  | "level_4_diploma"
  | "level_5_diploma"
  | "social_work_degree"
  | "management_qualification"
  | "first_aid"
  | "safeguarding_advanced"
  | "therapeutic_care"
  | "nvq"
  | "other";

export type QualificationStatus =
  | "achieved"
  | "in_progress"
  | "planned"
  | "overdue"
  | "not_started";

export type CPDCategory =
  | "safeguarding"
  | "therapeutic_practice"
  | "behaviour_management"
  | "medication"
  | "record_keeping"
  | "leadership"
  | "equality_diversity"
  | "health_safety"
  | "mental_health"
  | "communication"
  | "regulatory"
  | "specialist";

export type CompetencyLevel =
  | "developing"
  | "competent"
  | "proficient"
  | "expert";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface StaffQualification {
  id: string;
  staffId: string;
  staffName: string;
  qualificationType: QualificationType;
  qualificationName: string;
  status: QualificationStatus;
  startDate: string;
  expectedCompletionDate?: string;
  completedDate?: string;
  provider: string;
  mandatoryForRole: boolean;
  evidenceRecorded: boolean;
}

export interface CPDRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  category: CPDCategory;
  title: string;
  description: string;
  hoursCompleted: number;
  provider: string;
  reflectionRecorded: boolean;
  impactOnPractice: string;
  supervisorSignOff: boolean;
  certificate: boolean;
}

export interface CompetencyAssessment {
  id: string;
  staffId: string;
  staffName: string;
  assessmentDate: string;
  assessor: string;
  competencyArea: string;
  level: CompetencyLevel;
  previousLevel?: CompetencyLevel;
  evidenceBase: string[];
  developmentActions: string[];
  nextAssessmentDate: string;
}

export interface DevelopmentPlan {
  id: string;
  staffId: string;
  staffName: string;
  createdDate: string;
  reviewDate: string;
  nextReviewDate: string;
  goals: {
    description: string;
    targetDate: string;
    status: "not_started" | "in_progress" | "achieved" | "overdue";
    progress: number;
  }[];
  supervisorId: string;
  alignedToHomeNeeds: boolean;
  alignedToRegulatory: boolean;
  staffInputRecorded: boolean;
}

export interface PracticeObservation {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  observer: string;
  observationType:
    | "direct_practice"
    | "shift_observation"
    | "supervision_of_others"
    | "key_work_session";
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  strengths: string[];
  developmentAreas: string[];
  actionPlanCreated: boolean;
  followUpDate?: string;
  followUpCompleted?: boolean;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface QualificationEvaluationResult {
  totalStaff: number;
  totalQualifications: number;
  mandatoryComplianceRate: number;
  mandatoryAchieved: number;
  mandatoryTotal: number;
  inProgressCount: number;
  overdueCount: number;
  level3PlusRate: number;
  level3PlusCount: number;
  evidenceRecordedRate: number;
  staffBreakdown: {
    staffId: string;
    staffName: string;
    qualifications: StaffQualification[];
    mandatoryMet: boolean;
    hasLevel3Plus: boolean;
  }[];
  overdueQualifications: {
    staffName: string;
    qualificationName: string;
    expectedCompletionDate?: string;
  }[];
}

export interface CPDEvaluationResult {
  totalRecords: number;
  totalHours: number;
  averageHoursPerStaff: number;
  staffCPD: {
    staffId: string;
    staffName: string;
    hoursCompleted: number;
    recordCount: number;
    categoriesCovered: CPDCategory[];
    reflectionRate: number;
    signOffRate: number;
    impactDocumentedRate: number;
  }[];
  categoryCoverage: {
    category: CPDCategory;
    count: number;
    totalHours: number;
  }[];
  overallReflectionRate: number;
  overallSignOffRate: number;
  overallImpactDocumentedRate: number;
  staffMeetingHoursTarget: number;
  hoursTargetMetRate: number;
}

export interface CompetencyEvaluationResult {
  totalAssessments: number;
  competencyDistribution: Record<CompetencyLevel, number>;
  progressionRate: number;
  progressionCount: number;
  regressionCount: number;
  staticCount: number;
  noBaselineCount: number;
  areasNeedingDevelopment: {
    staffName: string;
    competencyArea: string;
    level: CompetencyLevel;
    developmentActions: string[];
  }[];
  assessmentCurrency: {
    current: number;
    overdue: number;
    currencyRate: number;
  };
  staffCompetencies: {
    staffId: string;
    staffName: string;
    assessments: CompetencyAssessment[];
    averageLevel: number;
    hasProgressed: boolean;
  }[];
}

export interface DevelopmentPlanningResult {
  totalStaff: number;
  staffWithPlans: number;
  planCoverageRate: number;
  totalGoals: number;
  goalsAchieved: number;
  goalsInProgress: number;
  goalsOverdue: number;
  goalsNotStarted: number;
  goalAchievementRate: number;
  currentPlans: number;
  overduePlans: number;
  planCurrencyRate: number;
  alignedToHomeNeeds: number;
  alignedToRegulatory: number;
  staffInputRecorded: number;
  homeNeedsAlignmentRate: number;
  regulatoryAlignmentRate: number;
  staffInputRate: number;
  staffBreakdown: {
    staffId: string;
    staffName: string;
    hasPlan: boolean;
    planCurrent: boolean;
    goalCount: number;
    goalsAchieved: number;
    averageProgress: number;
  }[];
}

export interface PracticeQualityResult {
  totalObservations: number;
  ratingDistribution: Record<PracticeObservation["rating"], number>;
  outstandingRate: number;
  goodOrBetterRate: number;
  requiresImprovementOrWorseRate: number;
  followUpRequired: number;
  followUpCompleted: number;
  followUpCompletionRate: number;
  improvementTrajectory: "improving" | "stable" | "declining" | "insufficient_data";
  observationsByType: Record<PracticeObservation["observationType"], number>;
  staffObservations: {
    staffId: string;
    staffName: string;
    observations: PracticeObservation[];
    latestRating: PracticeObservation["rating"];
    observationCount: number;
  }[];
  actionPlansCreated: number;
  actionPlanRate: number;
}

export interface WorkforceDevelopmentResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  qualifications: QualificationEvaluationResult;
  cpd: CPDEvaluationResult;
  competency: CompetencyEvaluationResult;
  developmentPlanning: DevelopmentPlanningResult;
  practiceQuality: PracticeQualityResult;
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const LEVEL_3_PLUS_TYPES: QualificationType[] = [
  "level_3_diploma",
  "level_4_diploma",
  "level_5_diploma",
  "social_work_degree",
  "management_qualification",
];

const CPD_HOURS_TARGET = 30; // 30 hours per year

const ALL_CPD_CATEGORIES: CPDCategory[] = [
  "safeguarding",
  "therapeutic_practice",
  "behaviour_management",
  "medication",
  "record_keeping",
  "leadership",
  "equality_diversity",
  "health_safety",
  "mental_health",
  "communication",
  "regulatory",
  "specialist",
];

const COMPETENCY_LEVEL_VALUES: Record<CompetencyLevel, number> = {
  developing: 1,
  competent: 2,
  proficient: 3,
  expert: 4,
};

const RATING_VALUES: Record<PracticeObservation["rating"], number> = {
  outstanding: 4,
  good: 3,
  requires_improvement: 2,
  inadequate: 1,
};

const CPD_CATEGORY_LABELS: Record<CPDCategory, string> = {
  safeguarding: "Safeguarding",
  therapeutic_practice: "Therapeutic Practice",
  behaviour_management: "Behaviour Management",
  medication: "Medication",
  record_keeping: "Record Keeping",
  leadership: "Leadership",
  equality_diversity: "Equality & Diversity",
  health_safety: "Health & Safety",
  mental_health: "Mental Health",
  communication: "Communication",
  regulatory: "Regulatory",
  specialist: "Specialist",
};

const QUALIFICATION_TYPE_LABELS: Record<QualificationType, string> = {
  level_3_diploma: "Level 3 Diploma",
  level_4_diploma: "Level 4 Diploma",
  level_5_diploma: "Level 5 Diploma",
  social_work_degree: "Social Work Degree",
  management_qualification: "Management Qualification",
  first_aid: "First Aid",
  safeguarding_advanced: "Advanced Safeguarding",
  therapeutic_care: "Therapeutic Care",
  nvq: "NVQ",
  other: "Other",
};

const COMPETENCY_LEVEL_LABELS: Record<CompetencyLevel, string> = {
  developing: "Developing",
  competent: "Competent",
  proficient: "Proficient",
  expert: "Expert",
};

// ── Label Functions ──────────────────────────────────────────────────────────

export function getCPDCategoryLabel(c: CPDCategory): string {
  return CPD_CATEGORY_LABELS[c] ?? c.replace(/_/g, " ");
}

export function getQualificationTypeLabel(q: QualificationType): string {
  return QUALIFICATION_TYPE_LABELS[q] ?? q.replace(/_/g, " ");
}

export function getCompetencyLevelLabel(l: CompetencyLevel): string {
  return COMPETENCY_LEVEL_LABELS[l] ?? l.replace(/_/g, " ");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

function daysBetween(earlier: string, later: string): number {
  const diff = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function uniqueStaffIds(items: { staffId: string }[]): string[] {
  return [...new Set(items.map((i) => i.staffId))];
}

// ── Core Function 1: Evaluate Qualifications ─────────────────────────────────

export function evaluateQualifications(
  quals: StaffQualification[],
  staffIds: string[],
): QualificationEvaluationResult {
  const totalStaff = staffIds.length;
  const totalQualifications = quals.length;

  // Mandatory qualifications
  const mandatoryQuals = quals.filter((q) => q.mandatoryForRole);
  const mandatoryAchieved = mandatoryQuals.filter((q) => q.status === "achieved").length;
  const mandatoryTotal = mandatoryQuals.length;
  const mandatoryComplianceRate = pct(mandatoryAchieved, mandatoryTotal);

  // In-progress and overdue counts
  const inProgressCount = quals.filter((q) => q.status === "in_progress").length;
  const overdueCount = quals.filter((q) => q.status === "overdue").length;

  // Level 3+ rate: how many staff have at least one achieved Level 3+ qualification
  const staffWithLevel3Plus = staffIds.filter((sid) => {
    return quals.some(
      (q) =>
        q.staffId === sid &&
        q.status === "achieved" &&
        LEVEL_3_PLUS_TYPES.includes(q.qualificationType),
    );
  });
  const level3PlusCount = staffWithLevel3Plus.length;
  const level3PlusRate = pct(level3PlusCount, totalStaff);

  // Evidence recorded rate
  const evidenceRecordedCount = quals.filter((q) => q.evidenceRecorded).length;
  const evidenceRecordedRate = pct(evidenceRecordedCount, totalQualifications);

  // Staff breakdown
  const staffBreakdown = staffIds.map((sid) => {
    const staffQuals = quals.filter((q) => q.staffId === sid);
    const staffName = staffQuals.length > 0 ? staffQuals[0].staffName : sid;
    const mandatoryForStaff = staffQuals.filter((q) => q.mandatoryForRole);
    const mandatoryMet =
      mandatoryForStaff.length > 0 &&
      mandatoryForStaff.every((q) => q.status === "achieved");
    const hasLevel3Plus = staffQuals.some(
      (q) =>
        q.status === "achieved" &&
        LEVEL_3_PLUS_TYPES.includes(q.qualificationType),
    );

    return {
      staffId: sid,
      staffName,
      qualifications: staffQuals,
      mandatoryMet,
      hasLevel3Plus,
    };
  });

  // Overdue qualifications detail
  const overdueQualifications = quals
    .filter((q) => q.status === "overdue")
    .map((q) => ({
      staffName: q.staffName,
      qualificationName: q.qualificationName,
      expectedCompletionDate: q.expectedCompletionDate,
    }));

  return {
    totalStaff,
    totalQualifications,
    mandatoryComplianceRate,
    mandatoryAchieved,
    mandatoryTotal,
    inProgressCount,
    overdueCount,
    level3PlusRate,
    level3PlusCount,
    evidenceRecordedRate,
    staffBreakdown,
    overdueQualifications,
  };
}

// ── Core Function 2: Evaluate CPD ────────────────────────────────────────────

export function evaluateCPD(
  cpd: CPDRecord[],
  staffIds: string[],
  periodStart: string,
  periodEnd: string,
): CPDEvaluationResult {
  // Filter CPD records to the period
  const periodRecords = cpd.filter((r) => inPeriod(r.date, periodStart, periodEnd));
  const totalRecords = periodRecords.length;
  const totalHours = Math.round(periodRecords.reduce((sum, r) => sum + r.hoursCompleted, 0) * 10) / 10;
  const averageHoursPerStaff = staffIds.length === 0 ? 0 : Math.round((totalHours / staffIds.length) * 10) / 10;

  // Staff-level CPD
  const staffCPD = staffIds.map((sid) => {
    const staffRecords = periodRecords.filter((r) => r.staffId === sid);
    const staffName = staffRecords.length > 0 ? staffRecords[0].staffName : sid;
    const hoursCompleted = Math.round(staffRecords.reduce((sum, r) => sum + r.hoursCompleted, 0) * 10) / 10;
    const categoriesCovered = [...new Set(staffRecords.map((r) => r.category))];
    const reflectionRate = pct(
      staffRecords.filter((r) => r.reflectionRecorded).length,
      staffRecords.length,
    );
    const signOffRate = pct(
      staffRecords.filter((r) => r.supervisorSignOff).length,
      staffRecords.length,
    );
    const impactDocumentedRate = pct(
      staffRecords.filter((r) => r.impactOnPractice.trim().length > 0).length,
      staffRecords.length,
    );

    return {
      staffId: sid,
      staffName,
      hoursCompleted,
      recordCount: staffRecords.length,
      categoriesCovered,
      reflectionRate,
      signOffRate,
      impactDocumentedRate,
    };
  });

  // Category coverage
  const categoryCoverage = ALL_CPD_CATEGORIES.map((cat) => {
    const catRecords = periodRecords.filter((r) => r.category === cat);
    return {
      category: cat,
      count: catRecords.length,
      totalHours: Math.round(catRecords.reduce((sum, r) => sum + r.hoursCompleted, 0) * 10) / 10,
    };
  }).filter((c) => c.count > 0);

  // Overall rates
  const overallReflectionRate = pct(
    periodRecords.filter((r) => r.reflectionRecorded).length,
    totalRecords,
  );
  const overallSignOffRate = pct(
    periodRecords.filter((r) => r.supervisorSignOff).length,
    totalRecords,
  );
  const overallImpactDocumentedRate = pct(
    periodRecords.filter((r) => r.impactOnPractice.trim().length > 0).length,
    totalRecords,
  );

  // Hours target
  const staffMeetingHoursTarget = staffCPD.filter((s) => s.hoursCompleted >= CPD_HOURS_TARGET).length;
  const hoursTargetMetRate = pct(staffMeetingHoursTarget, staffIds.length);

  return {
    totalRecords,
    totalHours,
    averageHoursPerStaff,
    staffCPD,
    categoryCoverage,
    overallReflectionRate,
    overallSignOffRate,
    overallImpactDocumentedRate,
    staffMeetingHoursTarget,
    hoursTargetMetRate,
  };
}

// ── Core Function 3: Evaluate Competency ─────────────────────────────────────

export function evaluateCompetency(
  assessments: CompetencyAssessment[],
  staffIds: string[],
): CompetencyEvaluationResult {
  const totalAssessments = assessments.length;

  // Distribution
  const competencyDistribution: Record<CompetencyLevel, number> = {
    developing: 0,
    competent: 0,
    proficient: 0,
    expert: 0,
  };
  for (const a of assessments) {
    competencyDistribution[a.level]++;
  }

  // Progression: compare current vs previous level
  let progressionCount = 0;
  let regressionCount = 0;
  let staticCount = 0;
  let noBaselineCount = 0;
  for (const a of assessments) {
    if (!a.previousLevel) {
      noBaselineCount++;
    } else {
      const currentVal = COMPETENCY_LEVEL_VALUES[a.level];
      const previousVal = COMPETENCY_LEVEL_VALUES[a.previousLevel];
      if (currentVal > previousVal) progressionCount++;
      else if (currentVal < previousVal) regressionCount++;
      else staticCount++;
    }
  }
  const assessmentsWithBaseline = totalAssessments - noBaselineCount;
  const progressionRate = pct(progressionCount, assessmentsWithBaseline);

  // Areas needing development (developing level)
  const areasNeedingDevelopment = assessments
    .filter((a) => a.level === "developing")
    .map((a) => ({
      staffName: a.staffName,
      competencyArea: a.competencyArea,
      level: a.level,
      developmentActions: a.developmentActions,
    }));

  // Assessment currency: check if nextAssessmentDate is in the future relative to the latest assessment
  // We consider an assessment "current" if the nextAssessmentDate hasn't passed
  const now = new Date().toISOString().split("T")[0];
  const current = assessments.filter((a) => a.nextAssessmentDate >= now).length;
  const overdue = assessments.filter((a) => a.nextAssessmentDate < now).length;
  const currencyRate = pct(current, totalAssessments);

  // Staff competencies
  const staffCompetencies = staffIds.map((sid) => {
    const staffAssessments = assessments.filter((a) => a.staffId === sid);
    const staffName = staffAssessments.length > 0 ? staffAssessments[0].staffName : sid;
    const avgLevel =
      staffAssessments.length === 0
        ? 0
        : Math.round(
            (staffAssessments.reduce(
              (sum, a) => sum + COMPETENCY_LEVEL_VALUES[a.level],
              0,
            ) /
              staffAssessments.length) *
              10,
          ) / 10;
    const hasProgressed = staffAssessments.some(
      (a) =>
        a.previousLevel &&
        COMPETENCY_LEVEL_VALUES[a.level] >
          COMPETENCY_LEVEL_VALUES[a.previousLevel],
    );

    return {
      staffId: sid,
      staffName,
      assessments: staffAssessments,
      averageLevel: avgLevel,
      hasProgressed,
    };
  });

  return {
    totalAssessments,
    competencyDistribution,
    progressionRate,
    progressionCount,
    regressionCount,
    staticCount,
    noBaselineCount,
    areasNeedingDevelopment,
    assessmentCurrency: { current, overdue, currencyRate },
    staffCompetencies,
  };
}

// ── Core Function 4: Evaluate Development Planning ───────────────────────────

export function evaluateDevelopmentPlanning(
  plans: DevelopmentPlan[],
  staffIds: string[],
  referenceDate: string,
): DevelopmentPlanningResult {
  const totalStaff = staffIds.length;
  const staffWithPlanIds = [...new Set(plans.map((p) => p.staffId))];
  const staffWithPlans = staffWithPlanIds.filter((sid) => staffIds.includes(sid)).length;
  const planCoverageRate = pct(staffWithPlans, totalStaff);

  // Goals
  const allGoals = plans.flatMap((p) => p.goals);
  const totalGoals = allGoals.length;
  const goalsAchieved = allGoals.filter((g) => g.status === "achieved").length;
  const goalsInProgress = allGoals.filter((g) => g.status === "in_progress").length;
  const goalsOverdue = allGoals.filter((g) => g.status === "overdue").length;
  const goalsNotStarted = allGoals.filter((g) => g.status === "not_started").length;
  const goalAchievementRate = pct(goalsAchieved, totalGoals);

  // Plan currency: nextReviewDate >= referenceDate means current
  const currentPlans = plans.filter((p) => p.nextReviewDate >= referenceDate).length;
  const overduePlans = plans.filter((p) => p.nextReviewDate < referenceDate).length;
  const planCurrencyRate = pct(currentPlans, plans.length);

  // Alignment
  const alignedToHomeNeeds = plans.filter((p) => p.alignedToHomeNeeds).length;
  const alignedToRegulatory = plans.filter((p) => p.alignedToRegulatory).length;
  const staffInputRecorded = plans.filter((p) => p.staffInputRecorded).length;
  const homeNeedsAlignmentRate = pct(alignedToHomeNeeds, plans.length);
  const regulatoryAlignmentRate = pct(alignedToRegulatory, plans.length);
  const staffInputRate = pct(staffInputRecorded, plans.length);

  // Staff breakdown
  const staffBreakdown = staffIds.map((sid) => {
    const staffPlans = plans.filter((p) => p.staffId === sid);
    const hasPlan = staffPlans.length > 0;
    const latestPlan = staffPlans.length > 0
      ? staffPlans.sort((a, b) => b.createdDate.localeCompare(a.createdDate))[0]
      : null;
    const planCurrent = latestPlan ? latestPlan.nextReviewDate >= referenceDate : false;
    const staffGoals = staffPlans.flatMap((p) => p.goals);
    const goalCount = staffGoals.length;
    const staffGoalsAchieved = staffGoals.filter((g) => g.status === "achieved").length;
    const averageProgress =
      goalCount === 0
        ? 0
        : Math.round(staffGoals.reduce((sum, g) => sum + g.progress, 0) / goalCount);
    const staffName = staffPlans.length > 0 ? staffPlans[0].staffName : sid;

    return {
      staffId: sid,
      staffName,
      hasPlan,
      planCurrent,
      goalCount,
      goalsAchieved: staffGoalsAchieved,
      averageProgress,
    };
  });

  return {
    totalStaff,
    staffWithPlans,
    planCoverageRate,
    totalGoals,
    goalsAchieved,
    goalsInProgress,
    goalsOverdue,
    goalsNotStarted,
    goalAchievementRate,
    currentPlans,
    overduePlans,
    planCurrencyRate,
    alignedToHomeNeeds,
    alignedToRegulatory,
    staffInputRecorded,
    homeNeedsAlignmentRate,
    regulatoryAlignmentRate,
    staffInputRate,
    staffBreakdown,
  };
}

// ── Core Function 5: Evaluate Practice Quality ───────────────────────────────

export function evaluatePracticeQuality(
  observations: PracticeObservation[],
): PracticeQualityResult {
  const totalObservations = observations.length;

  // Rating distribution
  const ratingDistribution: Record<PracticeObservation["rating"], number> = {
    outstanding: 0,
    good: 0,
    requires_improvement: 0,
    inadequate: 0,
  };
  for (const o of observations) {
    ratingDistribution[o.rating]++;
  }

  const outstandingRate = pct(ratingDistribution.outstanding, totalObservations);
  const goodOrBetterCount = ratingDistribution.outstanding + ratingDistribution.good;
  const goodOrBetterRate = pct(goodOrBetterCount, totalObservations);
  const requiresImprovementOrWorseCount =
    ratingDistribution.requires_improvement + ratingDistribution.inadequate;
  const requiresImprovementOrWorseRate = pct(requiresImprovementOrWorseCount, totalObservations);

  // Follow-up
  const observationsWithFollowUp = observations.filter((o) => o.followUpDate);
  const followUpRequired = observationsWithFollowUp.length;
  const followUpCompleted = observationsWithFollowUp.filter((o) => o.followUpCompleted === true).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpRequired);

  // Improvement trajectory: compare first half vs second half of observations sorted by date
  let improvementTrajectory: PracticeQualityResult["improvementTrajectory"] = "insufficient_data";
  if (totalObservations >= 4) {
    const sorted = [...observations].sort((a, b) => a.date.localeCompare(b.date));
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    const firstAvg =
      firstHalf.reduce((sum, o) => sum + RATING_VALUES[o.rating], 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, o) => sum + RATING_VALUES[o.rating], 0) / secondHalf.length;

    if (secondAvg > firstAvg + 0.25) {
      improvementTrajectory = "improving";
    } else if (secondAvg < firstAvg - 0.25) {
      improvementTrajectory = "declining";
    } else {
      improvementTrajectory = "stable";
    }
  }

  // Observations by type
  const observationsByType: Record<PracticeObservation["observationType"], number> = {
    direct_practice: 0,
    shift_observation: 0,
    supervision_of_others: 0,
    key_work_session: 0,
  };
  for (const o of observations) {
    observationsByType[o.observationType]++;
  }

  // Staff observations
  const staffIdSet = uniqueStaffIds(observations);
  const staffObservations = staffIdSet.map((sid) => {
    const staffObs = observations.filter((o) => o.staffId === sid);
    const sorted = [...staffObs].sort((a, b) => b.date.localeCompare(a.date));
    return {
      staffId: sid,
      staffName: sorted[0].staffName,
      observations: staffObs,
      latestRating: sorted[0].rating,
      observationCount: staffObs.length,
    };
  });

  // Action plans
  const actionPlansCreated = observations.filter((o) => o.actionPlanCreated).length;
  const actionPlanRate = pct(actionPlansCreated, totalObservations);

  return {
    totalObservations,
    ratingDistribution,
    outstandingRate,
    goodOrBetterRate,
    requiresImprovementOrWorseRate,
    followUpRequired,
    followUpCompleted,
    followUpCompletionRate,
    improvementTrajectory,
    observationsByType,
    staffObservations,
    actionPlansCreated,
    actionPlanRate,
  };
}

// ── Core Function 6: Generate Workforce Development Intelligence ─────────────

export function generateWorkforceDevelopmentIntelligence(
  quals: StaffQualification[],
  cpd: CPDRecord[],
  competencies: CompetencyAssessment[],
  plans: DevelopmentPlan[],
  observations: PracticeObservation[],
  staffIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): WorkforceDevelopmentResult {
  const qualifications = evaluateQualifications(quals, staffIds);
  const cpdResult = evaluateCPD(cpd, staffIds, periodStart, periodEnd);
  const competency = evaluateCompetency(competencies, staffIds);
  const developmentPlanning = evaluateDevelopmentPlanning(plans, staffIds, referenceDate);
  const practiceQuality = evaluatePracticeQuality(observations);

  // ── Scoring ──────────────────────────────────────────────────────────

  // 1. Qualifications (20 points)
  // Split: 12 for mandatory compliance, 8 for Level 3+ attainment
  let qualScore = 0;

  // Mandatory compliance portion (12 points)
  if (qualifications.mandatoryComplianceRate >= 100) qualScore += 12;
  else if (qualifications.mandatoryComplianceRate >= 90) qualScore += 10;
  else if (qualifications.mandatoryComplianceRate >= 75) qualScore += 7;
  else if (qualifications.mandatoryComplianceRate >= 50) qualScore += 4;
  else if (qualifications.mandatoryComplianceRate > 0) qualScore += 2;

  // Level 3+ portion (8 points)
  if (qualifications.level3PlusRate >= 100) qualScore += 8;
  else if (qualifications.level3PlusRate >= 80) qualScore += 6;
  else if (qualifications.level3PlusRate >= 60) qualScore += 4;
  else if (qualifications.level3PlusRate >= 40) qualScore += 2;
  else if (qualifications.level3PlusRate > 0) qualScore += 1;

  // 2. CPD (20 points)
  // Split: 6 for hours, 5 for coverage, 5 for reflection, 4 for impact
  let cpdScore = 0;

  // Hours portion (6 points)
  if (cpdResult.hoursTargetMetRate >= 100) cpdScore += 6;
  else if (cpdResult.hoursTargetMetRate >= 75) cpdScore += 5;
  else if (cpdResult.hoursTargetMetRate >= 50) cpdScore += 3;
  else if (cpdResult.hoursTargetMetRate > 0) cpdScore += 1;

  // Coverage portion (5 points) — how many categories are represented
  const categoriesCoveredCount = cpdResult.categoryCoverage.length;
  if (categoriesCoveredCount >= 8) cpdScore += 5;
  else if (categoriesCoveredCount >= 6) cpdScore += 4;
  else if (categoriesCoveredCount >= 4) cpdScore += 3;
  else if (categoriesCoveredCount >= 2) cpdScore += 1;

  // Reflection portion (5 points)
  if (cpdResult.overallReflectionRate >= 90) cpdScore += 5;
  else if (cpdResult.overallReflectionRate >= 75) cpdScore += 4;
  else if (cpdResult.overallReflectionRate >= 50) cpdScore += 2;
  else if (cpdResult.overallReflectionRate > 0) cpdScore += 1;

  // Impact documented portion (4 points)
  if (cpdResult.overallImpactDocumentedRate >= 90) cpdScore += 4;
  else if (cpdResult.overallImpactDocumentedRate >= 75) cpdScore += 3;
  else if (cpdResult.overallImpactDocumentedRate >= 50) cpdScore += 2;
  else if (cpdResult.overallImpactDocumentedRate > 0) cpdScore += 1;

  // 3. Competency (20 points)
  // Split: 8 for distribution, 6 for progression, 6 for currency
  let compScore = 0;

  // Distribution portion (8 points) — weight toward proficient/expert
  const totalAssessments = competency.totalAssessments;
  if (totalAssessments > 0) {
    const proficientOrExpert =
      competency.competencyDistribution.proficient +
      competency.competencyDistribution.expert;
    const proficientExpertRate = pct(proficientOrExpert, totalAssessments);
    if (proficientExpertRate >= 75) compScore += 8;
    else if (proficientExpertRate >= 50) compScore += 6;
    else if (proficientExpertRate >= 25) compScore += 4;
    else compScore += 2;
  }

  // Progression portion (6 points)
  if (competency.progressionRate >= 60) compScore += 6;
  else if (competency.progressionRate >= 40) compScore += 4;
  else if (competency.progressionRate >= 20) compScore += 2;
  else if (competency.progressionCount > 0) compScore += 1;

  // Currency portion (6 points)
  if (competency.assessmentCurrency.currencyRate >= 90) compScore += 6;
  else if (competency.assessmentCurrency.currencyRate >= 75) compScore += 4;
  else if (competency.assessmentCurrency.currencyRate >= 50) compScore += 2;
  else if (competency.assessmentCurrency.currencyRate > 0) compScore += 1;

  // 4. Development planning (20 points)
  // Split: 6 for coverage, 6 for achievement, 4 for currency, 4 for alignment
  let devScore = 0;

  // Coverage portion (6 points)
  if (developmentPlanning.planCoverageRate >= 100) devScore += 6;
  else if (developmentPlanning.planCoverageRate >= 80) devScore += 5;
  else if (developmentPlanning.planCoverageRate >= 60) devScore += 3;
  else if (developmentPlanning.planCoverageRate > 0) devScore += 1;

  // Achievement portion (6 points)
  if (developmentPlanning.goalAchievementRate >= 80) devScore += 6;
  else if (developmentPlanning.goalAchievementRate >= 60) devScore += 4;
  else if (developmentPlanning.goalAchievementRate >= 40) devScore += 3;
  else if (developmentPlanning.goalAchievementRate > 0) devScore += 1;

  // Currency portion (4 points)
  if (developmentPlanning.planCurrencyRate >= 90) devScore += 4;
  else if (developmentPlanning.planCurrencyRate >= 75) devScore += 3;
  else if (developmentPlanning.planCurrencyRate >= 50) devScore += 2;
  else if (developmentPlanning.planCurrencyRate > 0) devScore += 1;

  // Alignment portion (4 points) — average of home needs + regulatory alignment
  const avgAlignment = (developmentPlanning.homeNeedsAlignmentRate + developmentPlanning.regulatoryAlignmentRate) / 2;
  if (avgAlignment >= 90) devScore += 4;
  else if (avgAlignment >= 75) devScore += 3;
  else if (avgAlignment >= 50) devScore += 2;
  else if (avgAlignment > 0) devScore += 1;

  // 5. Practice quality (20 points)
  // Split: 8 for ratings, 6 for follow-up, 6 for improvement
  let practiceScore = 0;

  // Ratings portion (8 points)
  if (practiceQuality.goodOrBetterRate >= 90) practiceScore += 8;
  else if (practiceQuality.goodOrBetterRate >= 75) practiceScore += 6;
  else if (practiceQuality.goodOrBetterRate >= 50) practiceScore += 4;
  else if (practiceQuality.goodOrBetterRate > 0) practiceScore += 2;

  // Follow-up portion (6 points)
  if (practiceQuality.followUpCompletionRate >= 90) practiceScore += 6;
  else if (practiceQuality.followUpCompletionRate >= 75) practiceScore += 4;
  else if (practiceQuality.followUpCompletionRate >= 50) practiceScore += 2;
  else if (practiceQuality.followUpRequired > 0 && practiceQuality.followUpCompleted > 0) practiceScore += 1;

  // Improvement portion (6 points)
  if (practiceQuality.improvementTrajectory === "improving") practiceScore += 6;
  else if (practiceQuality.improvementTrajectory === "stable" && practiceQuality.goodOrBetterRate >= 75) practiceScore += 5;
  else if (practiceQuality.improvementTrajectory === "stable") practiceScore += 3;
  else if (practiceQuality.improvementTrajectory === "declining") practiceScore += 1;
  else practiceScore += 2; // insufficient_data — neutral

  const overallScore = Math.min(100, Math.max(0, qualScore + cpdScore + compScore + devScore + practiceScore));

  const rating: WorkforceDevelopmentResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ──────────────────────────────────────

  const strengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const immediateActions: string[] = [];

  // Strengths
  if (qualifications.mandatoryComplianceRate >= 100) {
    strengths.push("All mandatory qualifications achieved — full regulatory compliance");
  } else if (qualifications.mandatoryComplianceRate >= 90) {
    strengths.push("Strong mandatory qualification compliance above 90%");
  }

  if (qualifications.level3PlusRate >= 100) {
    strengths.push("All staff hold Level 3+ qualifications — exceeds sector expectations");
  }

  if (cpdResult.hoursTargetMetRate >= 80) {
    strengths.push(`Strong CPD engagement — ${cpdResult.hoursTargetMetRate}% of staff meeting hours target`);
  }

  if (cpdResult.overallReflectionRate >= 80) {
    strengths.push("High-quality reflective CPD culture — reflections recorded across workforce");
  }

  if (competency.progressionRate >= 50) {
    strengths.push("Positive competency progression — staff demonstrating professional growth");
  }

  if (developmentPlanning.planCoverageRate >= 100) {
    strengths.push("All staff have development plans — strong investment in workforce growth");
  }

  if (practiceQuality.goodOrBetterRate >= 80) {
    strengths.push("High-quality practice observed across the team");
  }

  if (practiceQuality.improvementTrajectory === "improving") {
    strengths.push("Positive practice improvement trajectory identified");
  }

  if (developmentPlanning.staffInputRate >= 80) {
    strengths.push("Development plans co-produced with staff — evidence of participative leadership");
  }

  if (strengths.length === 0) {
    strengths.push("No significant strengths identified — workforce development programme requires attention");
  }

  // Areas for development
  if (qualifications.mandatoryComplianceRate < 80) {
    areasForDevelopment.push(
      `Mandatory qualification compliance at ${qualifications.mandatoryComplianceRate}% — target 100%`,
    );
  }

  if (qualifications.overdueCount > 0) {
    areasForDevelopment.push(
      `${qualifications.overdueCount} overdue qualification${qualifications.overdueCount !== 1 ? "s" : ""} — chase with providers and agree revised completion dates`,
    );
  }

  if (cpdResult.hoursTargetMetRate < 60) {
    areasForDevelopment.push(
      `Only ${cpdResult.hoursTargetMetRate}% of staff meeting CPD hours target — plan additional development opportunities`,
    );
  }

  if (cpdResult.overallReflectionRate < 60) {
    areasForDevelopment.push(
      `CPD reflection rate at ${cpdResult.overallReflectionRate}% — embed reflective practice into supervision`,
    );
  }

  if (competency.areasNeedingDevelopment.length > 0) {
    areasForDevelopment.push(
      `${competency.areasNeedingDevelopment.length} competency area${competency.areasNeedingDevelopment.length !== 1 ? "s" : ""} at developing level — targeted support needed`,
    );
  }

  if (developmentPlanning.planCoverageRate < 100) {
    areasForDevelopment.push(
      `${developmentPlanning.totalStaff - developmentPlanning.staffWithPlans} staff member${(developmentPlanning.totalStaff - developmentPlanning.staffWithPlans) !== 1 ? "s" : ""} without development plans — create and agree plans`,
    );
  }

  if (practiceQuality.followUpCompletionRate < 75 && practiceQuality.followUpRequired > 0) {
    areasForDevelopment.push(
      `Practice observation follow-up completion at ${practiceQuality.followUpCompletionRate}% — ensure all actions are progressed`,
    );
  }

  if (areasForDevelopment.length === 0) {
    areasForDevelopment.push("No significant areas for development identified — maintain current trajectory");
  }

  // Immediate actions
  if (qualifications.overdueCount > 0) {
    const overdueNames = qualifications.overdueQualifications.map((q) => q.staffName).join(", ");
    immediateActions.push(
      `URGENT: ${qualifications.overdueCount} overdue qualification${qualifications.overdueCount !== 1 ? "s" : ""} (${overdueNames}) — escalate to responsible individual`,
    );
  }

  if (qualifications.mandatoryComplianceRate < 50) {
    immediateActions.push(
      "URGENT: Mandatory qualification compliance below 50% — significant Reg 32 breach risk",
    );
  }

  if (practiceQuality.improvementTrajectory === "declining") {
    immediateActions.push(
      "HIGH: Practice quality declining — review supervision frequency and implement targeted coaching",
    );
  }

  if (practiceQuality.ratingDistribution.inadequate > 0) {
    immediateActions.push(
      `HIGH: ${practiceQuality.ratingDistribution.inadequate} inadequate practice observation${practiceQuality.ratingDistribution.inadequate !== 1 ? "s" : ""} recorded — implement immediate capability support`,
    );
  }

  if (developmentPlanning.goalsOverdue > 0) {
    immediateActions.push(
      `${developmentPlanning.goalsOverdue} development goal${developmentPlanning.goalsOverdue !== 1 ? "s" : ""} overdue — review in next supervision`,
    );
  }

  if (competency.assessmentCurrency.overdue > 0) {
    immediateActions.push(
      `${competency.assessmentCurrency.overdue} competency assessment${competency.assessmentCurrency.overdue !== 1 ? "s" : ""} overdue for review — schedule assessments`,
    );
  }

  if (immediateActions.length === 0) {
    immediateActions.push(
      "No immediate actions required — workforce development is well maintained",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 32 — Fitness of workers (qualifications, skills, experience)",
    "CHR 2015 Reg 33 — Employment of staff (sufficient staffing, fitness requirements)",
    "CHR 2015 Reg 13 — Leadership and management (leading improvements in practice)",
    "SCCIF — Leadership & management (developing workforce, professional growth)",
    "Social Work England — Professional standards (CPD, competence, development)",
    "Working Together 2023 — Multi-agency competency and professional development",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    qualifications,
    cpd: cpdResult,
    competency,
    developmentPlanning,
    practiceQuality,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}
