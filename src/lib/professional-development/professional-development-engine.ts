// ══════════════════════════════════════════════════════════════════════════════
// Cara — Professional Development Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// "Effective homes invest in staff development, creating a culture of
//  continuous learning that directly improves outcomes for children."
// — SCCIF 2023
//
// Regulatory framework:
//   CHR 2015 Reg 33         — Employment of staff (training & development)
//   CHR 2015 Reg 32         — Fitness of workers
//   NMS 19                  — Staffing (qualifications & CPD)
//   SCCIF                   — Leadership and management
//   Working Together 2023    — Training requirements
//   CHR 2015 Schedule 1     — Level 3 Diploma requirement
//   CA 1989 s22(3)(a)       — Duty to safeguard and promote welfare
//   Skills for Care         — Workforce development standards
//
// Scoring breakdown (0–100):
//   CPD quality:                 25  — Impact, relevance, sharing, hours
//   Qualification progress:      25  — Completion, funding, support, overdue penalties
//   Supervision development:     25  — Goals, reviews, action plans
//   Learning culture:            25  — Organisational learning indicators
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type CPDCategory =
  | "mandatory_training"
  | "specialist_qualification"
  | "conference_seminar"
  | "peer_learning"
  | "mentoring"
  | "shadowing"
  | "self_directed"
  | "external_course"
  | "in_house_training"
  | "reflective_practice";

export type QualificationLevel =
  | "level_2"
  | "level_3"
  | "level_4"
  | "level_5"
  | "degree"
  | "masters"
  | "specialist";

export type QualificationStatus =
  | "enrolled"
  | "in_progress"
  | "completed"
  | "overdue"
  | "withdrawn";

export type TrainingImpact =
  | "significant_improvement"
  | "some_improvement"
  | "no_change"
  | "not_assessed";

export type LearningStyle =
  | "visual"
  | "auditory"
  | "reading_writing"
  | "kinaesthetic"
  | "blended";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface CPDRecord {
  id: string;
  staffId: string;
  staffName: string;
  category: CPDCategory;
  title: string;
  date: string;
  hours: number;
  provider: string | null;
  certificateObtained: boolean;
  impactAssessed: boolean;
  impact: TrainingImpact | null;
  sharedWithTeam: boolean;
  relevantToRole: boolean;
}

export interface QualificationProgress {
  id: string;
  staffId: string;
  staffName: string;
  qualificationName: string;
  level: QualificationLevel;
  status: QualificationStatus;
  startDate: string;
  expectedCompletion: string | null;
  actualCompletion: string | null;
  fundedByEmployer: boolean;
  supportProvided: boolean;
}

export interface SupervisionDevelopment {
  id: string;
  staffId: string;
  staffName: string;
  supervisionDate: string;
  developmentGoalsSet: boolean;
  progressReviewed: boolean;
  trainingNeedsIdentified: boolean;
  actionPlanCreated: boolean;
  previousActionsCompleted: boolean | null;
}

export interface LearningCulture {
  id: string;
  homeId: string;
  assessmentDate: string;
  regularTeamMeetings: boolean;
  sharedLearningOpportunities: boolean;
  reflectivePracticeEmbedded: boolean;
  feedbackCulture: boolean;
  innovationEncouraged: boolean;
  budgetAllocated: boolean;
  trainingCalendarExists: boolean;
  inductionProgramRobust: boolean;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface CPDQualityResult {
  overallScore: number;         // 0-25
  totalRecords: number;
  totalHours: number;
  averageHoursPerStaff: number;
  impactAssessedRate: number;   // pct
  positiveImpactRate: number;   // pct
  sharedWithTeamRate: number;   // pct
  relevantToRoleRate: number;   // pct
  certificateRate: number;      // pct
  categoryDistribution: Record<CPDCategory, number>;
}

export interface QualificationProgressResult {
  overallScore: number;         // 0-25
  totalQualifications: number;
  completedRate: number;        // pct
  inProgressRate: number;       // pct
  overdueCount: number;
  fundedRate: number;           // pct
  supportRate: number;          // pct
  levelDistribution: Record<QualificationLevel, number>;
}

export interface SupervisionDevelopmentResult {
  overallScore: number;         // 0-25
  totalSupervisions: number;
  goalsSetRate: number;         // pct
  progressReviewedRate: number; // pct
  trainingNeedsRate: number;    // pct
  actionPlanRate: number;       // pct
  actionsCompletedRate: number; // pct
}

export interface LearningCultureResult {
  overallScore: number;         // 0-25
  totalAssessments: number;
  teamMeetingRate: number;      // pct
  sharedLearningRate: number;   // pct
  reflectiveRate: number;       // pct
  feedbackCultureRate: number;  // pct
  innovationRate: number;       // pct
  budgetRate: number;           // pct
  inductionRate: number;        // pct
}

export interface StaffDevelopmentProfile {
  staffId: string;
  staffName: string;
  totalCPDHours: number;
  qualificationsInProgress: number;
  qualificationsCompleted: number;
  hasOverdueQualification: boolean;
  impactAssessmentRate: number;
  overallScore: number;         // 0-10
}

export interface ProfessionalDevelopmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;         // 0-100, capped
  rating: Rating;
  cpdQuality: CPDQualityResult;
  qualificationProgress: QualificationProgressResult;
  supervisionDevelopment: SupervisionDevelopmentResult;
  learningCulture: LearningCultureResult;
  staffProfiles: StaffDevelopmentProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Label Maps ──────────────────────────────────────────────────────────────

const CPD_CATEGORY_LABELS: Record<CPDCategory, string> = {
  mandatory_training: "Mandatory Training",
  specialist_qualification: "Specialist Qualification",
  conference_seminar: "Conference / Seminar",
  peer_learning: "Peer Learning",
  mentoring: "Mentoring",
  shadowing: "Shadowing",
  self_directed: "Self-Directed Learning",
  external_course: "External Course",
  in_house_training: "In-House Training",
  reflective_practice: "Reflective Practice",
};

const QUALIFICATION_LEVEL_LABELS: Record<QualificationLevel, string> = {
  level_2: "Level 2",
  level_3: "Level 3",
  level_4: "Level 4",
  level_5: "Level 5",
  degree: "Degree",
  masters: "Masters",
  specialist: "Specialist",
};

const QUALIFICATION_STATUS_LABELS: Record<QualificationStatus, string> = {
  enrolled: "Enrolled",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  withdrawn: "Withdrawn",
};

const TRAINING_IMPACT_LABELS: Record<TrainingImpact, string> = {
  significant_improvement: "Significant Improvement",
  some_improvement: "Some Improvement",
  no_change: "No Change",
  not_assessed: "Not Assessed",
};

const LEARNING_STYLE_LABELS: Record<LearningStyle, string> = {
  visual: "Visual",
  auditory: "Auditory",
  reading_writing: "Reading / Writing",
  kinaesthetic: "Kinaesthetic",
  blended: "Blended",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Label Functions ──────────────────────────────────────────────────────────

export function getCPDCategoryLabel(c: CPDCategory): string {
  return CPD_CATEGORY_LABELS[c] ?? c.replace(/_/g, " ");
}

export function getQualificationLevelLabel(l: QualificationLevel): string {
  return QUALIFICATION_LEVEL_LABELS[l] ?? l.replace(/_/g, " ");
}

export function getQualificationStatusLabel(s: QualificationStatus): string {
  return QUALIFICATION_STATUS_LABELS[s] ?? s.replace(/_/g, " ");
}

export function getTrainingImpactLabel(i: TrainingImpact): string {
  return TRAINING_IMPACT_LABELS[i] ?? i.replace(/_/g, " ");
}

export function getLearningStyleLabel(s: LearningStyle): string {
  return LEARNING_STYLE_LABELS[s] ?? s.replace(/_/g, " ");
}

export function getRatingLabel(r: Rating): string {
  return RATING_LABELS[r] ?? r.replace(/_/g, " ");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  return den === 0 ? 0 : Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Core Evaluators ─────────────────────────────────────────────────────────

/**
 * Evaluate CPD Quality (0-25)
 *
 * - Impact assessed rate: 0-7
 * - Positive impact rate: 0-5
 * - Shared with team rate: 0-5
 * - Relevant to role rate: 0-4
 * - Average hours >= 30/year bonus: 0-4
 */
export function evaluateCPDQuality(
  records: CPDRecord[],
  staffIds: string[],
): CPDQualityResult {
  const totalRecords = records.length;
  const uniqueStaff = staffIds.length;

  if (totalRecords === 0) {
    const emptyDistribution: Record<CPDCategory, number> = {
      mandatory_training: 0,
      specialist_qualification: 0,
      conference_seminar: 0,
      peer_learning: 0,
      mentoring: 0,
      shadowing: 0,
      self_directed: 0,
      external_course: 0,
      in_house_training: 0,
      reflective_practice: 0,
    };
    return {
      overallScore: 0,
      totalRecords: 0,
      totalHours: 0,
      averageHoursPerStaff: 0,
      impactAssessedRate: 0,
      positiveImpactRate: 0,
      sharedWithTeamRate: 0,
      relevantToRoleRate: 0,
      certificateRate: 0,
      categoryDistribution: emptyDistribution,
    };
  }

  const totalHours = records.reduce((sum, r) => sum + r.hours, 0);
  const averageHoursPerStaff = uniqueStaff > 0
    ? Math.round((totalHours / uniqueStaff) * 10) / 10
    : null;

  const impactAssessedCount = records.filter((r) => r.impactAssessed).length;
  const impactAssessedRate = pct(impactAssessedCount, totalRecords);

  const positiveImpactCount = records.filter(
    (r) => r.impact === "significant_improvement" || r.impact === "some_improvement",
  ).length;
  const positiveImpactRate = pct(positiveImpactCount, totalRecords);

  const sharedCount = records.filter((r) => r.sharedWithTeam).length;
  const sharedWithTeamRate = pct(sharedCount, totalRecords);

  const relevantCount = records.filter((r) => r.relevantToRole).length;
  const relevantToRoleRate = pct(relevantCount, totalRecords);

  const certCount = records.filter((r) => r.certificateObtained).length;
  const certificateRate = pct(certCount, totalRecords);

  // Category distribution
  const categoryDistribution: Record<CPDCategory, number> = {
    mandatory_training: 0,
    specialist_qualification: 0,
    conference_seminar: 0,
    peer_learning: 0,
    mentoring: 0,
    shadowing: 0,
    self_directed: 0,
    external_course: 0,
    in_house_training: 0,
    reflective_practice: 0,
  };
  for (const r of records) {
    categoryDistribution[r.category]++;
  }

  // Scoring
  const impactAssessedScore = Math.round((impactAssessedRate / 100) * 7);
  const positiveImpactScore = Math.round((positiveImpactRate / 100) * 5);
  const sharedScore = Math.round((sharedWithTeamRate / 100) * 5);
  const relevantScore = Math.round((relevantToRoleRate / 100) * 4);
  const hoursBonus = (averageHoursPerStaff ?? 0) >= 30 ? 4 : Math.round(((averageHoursPerStaff ?? 0) / 30) * 4);

  const overallScore = Math.min(25, impactAssessedScore + positiveImpactScore + sharedScore + relevantScore + hoursBonus);

  return {
    overallScore,
    totalRecords,
    totalHours: Math.round(totalHours * 10) / 10,
    averageHoursPerStaff,
    impactAssessedRate,
    positiveImpactRate,
    sharedWithTeamRate,
    relevantToRoleRate,
    certificateRate,
    categoryDistribution,
  };
}

/**
 * Evaluate Qualification Progress (0-25)
 *
 * - Completed rate: 0-8
 * - In progress rate: 0-5
 * - Funded rate: 0-4
 * - Support rate: 0-4
 * - Penalty: -3 per overdue (capped so floor is 0 of the 4-pt sub-range)
 */
export function evaluateQualificationProgress(
  qualifications: QualificationProgress[],
): QualificationProgressResult {
  const totalQualifications = qualifications.length;

  if (totalQualifications === 0) {
    const emptyLevels: Record<QualificationLevel, number> = {
      level_2: 0, level_3: 0, level_4: 0, level_5: 0,
      degree: 0, masters: 0, specialist: 0,
    };
    return {
      overallScore: 0,
      totalQualifications: 0,
      completedRate: 0,
      inProgressRate: 0,
      overdueCount: 0,
      fundedRate: 0,
      supportRate: 0,
      levelDistribution: emptyLevels,
    };
  }

  const completedCount = qualifications.filter((q) => q.status === "completed").length;
  const inProgressCount = qualifications.filter((q) => q.status === "in_progress" || q.status === "enrolled").length;
  const overdueCount = qualifications.filter((q) => q.status === "overdue").length;
  const fundedCount = qualifications.filter((q) => q.fundedByEmployer).length;
  const supportCount = qualifications.filter((q) => q.supportProvided).length;

  const completedRate = pct(completedCount, totalQualifications);
  const inProgressRate = pct(inProgressCount, totalQualifications);
  const fundedRate = pct(fundedCount, totalQualifications);
  const supportRate = pct(supportCount, totalQualifications);

  // Level distribution
  const levelDistribution: Record<QualificationLevel, number> = {
    level_2: 0, level_3: 0, level_4: 0, level_5: 0,
    degree: 0, masters: 0, specialist: 0,
  };
  for (const q of qualifications) {
    levelDistribution[q.level]++;
  }

  // Scoring
  const completedScore = Math.round((completedRate / 100) * 8);
  const inProgressScore = Math.round((inProgressRate / 100) * 5);
  const fundedScore = Math.round((fundedRate / 100) * 4);
  const supportScore = Math.round((supportRate / 100) * 4);
  const overduePenalty = Math.min(overdueCount * 3, 4);

  const rawScore = completedScore + inProgressScore + fundedScore + supportScore - overduePenalty;
  const overallScore = Math.min(25, Math.max(0, rawScore));

  return {
    overallScore,
    totalQualifications,
    completedRate,
    inProgressRate,
    overdueCount,
    fundedRate,
    supportRate,
    levelDistribution,
  };
}

/**
 * Evaluate Supervision Development (0-25)
 *
 * - Goals set: 0-7
 * - Progress reviewed: 0-6
 * - Training needs identified: 0-5
 * - Action plan created: 0-4
 * - Actions completed: 0-3
 */
export function evaluateSupervisionDevelopment(
  supervisions: SupervisionDevelopment[],
): SupervisionDevelopmentResult {
  const totalSupervisions = supervisions.length;

  if (totalSupervisions === 0) {
    return {
      overallScore: 0,
      totalSupervisions: 0,
      goalsSetRate: 0,
      progressReviewedRate: 0,
      trainingNeedsRate: 0,
      actionPlanRate: 0,
      actionsCompletedRate: 0,
    };
  }

  const goalsSetCount = supervisions.filter((s) => s.developmentGoalsSet).length;
  const progressReviewedCount = supervisions.filter((s) => s.progressReviewed).length;
  const trainingNeedsCount = supervisions.filter((s) => s.trainingNeedsIdentified).length;
  const actionPlanCount = supervisions.filter((s) => s.actionPlanCreated).length;

  // For actionsCompleted, only count supervisions where previousActionsCompleted is not null
  const supervisionsWithPrior = supervisions.filter((s) => s.previousActionsCompleted !== null);
  const actionsCompletedCount = supervisionsWithPrior.filter((s) => s.previousActionsCompleted === true).length;

  const goalsSetRate = pct(goalsSetCount, totalSupervisions);
  const progressReviewedRate = pct(progressReviewedCount, totalSupervisions);
  const trainingNeedsRate = pct(trainingNeedsCount, totalSupervisions);
  const actionPlanRate = pct(actionPlanCount, totalSupervisions);
  const actionsCompletedRate = pct(actionsCompletedCount, supervisionsWithPrior.length);

  // Scoring
  const goalsScore = Math.round((goalsSetRate / 100) * 7);
  const progressScore = Math.round((progressReviewedRate / 100) * 6);
  const trainingNeedsScore = Math.round((trainingNeedsRate / 100) * 5);
  const actionPlanScore = Math.round((actionPlanRate / 100) * 4);
  const actionsCompletedScore = Math.round((actionsCompletedRate / 100) * 3);

  const overallScore = Math.min(25, goalsScore + progressScore + trainingNeedsScore + actionPlanScore + actionsCompletedScore);

  return {
    overallScore,
    totalSupervisions,
    goalsSetRate,
    progressReviewedRate,
    trainingNeedsRate,
    actionPlanRate,
    actionsCompletedRate,
  };
}

/**
 * Evaluate Learning Culture (0-25)
 *
 * 8 boolean fields across assessments.
 * Reflective practice + feedback culture weighted slightly higher (~3.5 each).
 * Other 6 fields: ~3 each.
 * Total: 3.5 + 3.5 + 3*6 = 25.
 */
export function evaluateLearningCulture(
  assessments: LearningCulture[],
): LearningCultureResult {
  const totalAssessments = assessments.length;

  if (totalAssessments === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      teamMeetingRate: 0,
      sharedLearningRate: 0,
      reflectiveRate: 0,
      feedbackCultureRate: 0,
      innovationRate: 0,
      budgetRate: 0,
      inductionRate: 0,
    };
  }

  const teamMeetingCount = assessments.filter((a) => a.regularTeamMeetings).length;
  const sharedLearningCount = assessments.filter((a) => a.sharedLearningOpportunities).length;
  const reflectiveCount = assessments.filter((a) => a.reflectivePracticeEmbedded).length;
  const feedbackCount = assessments.filter((a) => a.feedbackCulture).length;
  const innovationCount = assessments.filter((a) => a.innovationEncouraged).length;
  const budgetCount = assessments.filter((a) => a.budgetAllocated).length;
  const trainingCalendarCount = assessments.filter((a) => a.trainingCalendarExists).length;
  const inductionCount = assessments.filter((a) => a.inductionProgramRobust).length;

  const teamMeetingRate = pct(teamMeetingCount, totalAssessments);
  const sharedLearningRate = pct(sharedLearningCount, totalAssessments);
  const reflectiveRate = pct(reflectiveCount, totalAssessments);
  const feedbackCultureRate = pct(feedbackCount, totalAssessments);
  const innovationRate = pct(innovationCount, totalAssessments);
  const budgetRate = pct(budgetCount, totalAssessments);
  const calendarRate = pct(trainingCalendarCount, totalAssessments);
  const inductionRate = pct(inductionCount, totalAssessments);

  // Scoring: reflective practice + feedback culture = 3.5 each, others = 3 each
  const reflectiveScore = (reflectiveRate / 100) * 3.5;
  const feedbackScore = (feedbackCultureRate / 100) * 3.5;
  const teamMeetingScore = (teamMeetingRate / 100) * 3;
  const sharedLearningScore = (sharedLearningRate / 100) * 3;
  const innovationScore = (innovationRate / 100) * 3;
  const budgetScore = (budgetRate / 100) * 3;
  const calendarScore = (calendarRate / 100) * 3;
  const inductionScore = (inductionRate / 100) * 3;

  const raw = reflectiveScore + feedbackScore + teamMeetingScore + sharedLearningScore
    + innovationScore + budgetScore + calendarScore + inductionScore;
  const overallScore = Math.min(25, Math.round(raw));

  return {
    overallScore,
    totalAssessments,
    teamMeetingRate,
    sharedLearningRate,
    reflectiveRate,
    feedbackCultureRate,
    innovationRate,
    budgetRate,
    inductionRate,
  };
}

// ── Staff Development Profiles ──────────────────────────────────────────────

export function buildStaffDevelopmentProfiles(
  cpdRecords: CPDRecord[],
  qualifications: QualificationProgress[],
): StaffDevelopmentProfile[] {
  // Gather all unique staff from CPD records and qualifications
  const staffMap = new Map<string, { staffId: string; staffName: string }>();
  for (const r of cpdRecords) {
    if (!staffMap.has(r.staffId)) {
      staffMap.set(r.staffId, { staffId: r.staffId, staffName: r.staffName });
    }
  }
  for (const q of qualifications) {
    if (!staffMap.has(q.staffId)) {
      staffMap.set(q.staffId, { staffId: q.staffId, staffName: q.staffName });
    }
  }

  const profiles: StaffDevelopmentProfile[] = [];

  for (const [staffId, info] of staffMap) {
    const staffCPD = cpdRecords.filter((r) => r.staffId === staffId);
    const staffQuals = qualifications.filter((q) => q.staffId === staffId);

    const totalCPDHours = Math.round(staffCPD.reduce((sum, r) => sum + r.hours, 0) * 10) / 10;
    const qualificationsInProgress = staffQuals.filter(
      (q) => q.status === "in_progress" || q.status === "enrolled",
    ).length;
    const qualificationsCompleted = staffQuals.filter((q) => q.status === "completed").length;
    const hasOverdueQualification = staffQuals.some((q) => q.status === "overdue");

    const assessedCount = staffCPD.filter((r) => r.impactAssessed).length;
    const impactAssessmentRate = pct(assessedCount, staffCPD.length);

    // Overall score: blend of hours (3), impact assessment (3), qualifications (2), no overdue (2)
    let score = 0;
    if (totalCPDHours >= 30) score += 3;
    else if (totalCPDHours >= 20) score += 2;
    else if (totalCPDHours >= 10) score += 1;

    if (impactAssessmentRate >= 80) score += 3;
    else if (impactAssessmentRate >= 50) score += 2;
    else if (impactAssessmentRate >= 20) score += 1;

    if (qualificationsCompleted >= 2) score += 2;
    else if (qualificationsCompleted >= 1 || qualificationsInProgress >= 1) score += 1;

    if (!hasOverdueQualification) score += 2;

    profiles.push({
      staffId,
      staffName: info.staffName,
      totalCPDHours,
      qualificationsInProgress,
      qualificationsCompleted,
      hasOverdueQualification,
      impactAssessmentRate,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateProfessionalDevelopmentIntelligence(
  cpdRecords: CPDRecord[],
  qualifications: QualificationProgress[],
  supervisions: SupervisionDevelopment[],
  learningCultureAssessments: LearningCulture[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ProfessionalDevelopmentIntelligence {
  // Unique staff IDs from CPD records
  const staffIds = [...new Set(cpdRecords.map((r) => r.staffId))];

  const cpdQuality = evaluateCPDQuality(cpdRecords, staffIds);
  const qualificationProgress = evaluateQualificationProgress(qualifications);
  const supervisionDevelopment = evaluateSupervisionDevelopment(supervisions);
  const learningCulture = evaluateLearningCulture(learningCultureAssessments);
  const staffProfiles = buildStaffDevelopmentProfiles(cpdRecords, qualifications);

  // ── Overall Score ──────────────────────────────────────────────────────
  const rawScore = cpdQuality.overallScore
    + qualificationProgress.overallScore
    + supervisionDevelopment.overallScore
    + learningCulture.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (cpdQuality.impactAssessedRate >= 80) {
    strengths.push("Strong culture of impact assessment — staff routinely evaluate learning outcomes");
  }
  if (cpdQuality.sharedWithTeamRate >= 75) {
    strengths.push("Excellent knowledge sharing — staff regularly disseminate learning to colleagues");
  }
  if (cpdQuality.averageHoursPerStaff >= 30) {
    strengths.push("CPD hours exceed target of 30 hours per staff member annually");
  }
  if (qualificationProgress.completedRate >= 70) {
    strengths.push("High qualification completion rate demonstrates commitment to professional growth");
  }
  if (qualificationProgress.fundedRate >= 80) {
    strengths.push("Employer invests strongly in qualification funding for staff");
  }
  if (supervisionDevelopment.goalsSetRate >= 85) {
    strengths.push("Development goals consistently set in supervision sessions");
  }
  if (supervisionDevelopment.actionsCompletedRate >= 80) {
    strengths.push("Supervision action plans are followed through effectively");
  }
  if (learningCulture.overallScore >= 20) {
    strengths.push("Strong organisational learning culture with embedded reflective practice");
  }
  if (cpdQuality.relevantToRoleRate >= 90) {
    strengths.push("CPD activities are highly relevant to staff roles and responsibilities");
  }
  if (qualificationProgress.overdueCount === 0 && qualificationProgress.totalQualifications > 0) {
    strengths.push("No overdue qualifications — all staff progressing within expected timescales");
  }

  if (strengths.length === 0) {
    strengths.push("No significant strengths identified — professional development programme requires strategic review");
  }

  // ── Areas for Improvement ──────────────────────────────────────────────
  const areasForImprovement: string[] = [];

  if (cpdQuality.impactAssessedRate < 50 && cpdQuality.totalRecords > 0) {
    areasForImprovement.push(
      `Impact assessment rate at ${cpdQuality.impactAssessedRate}% — embed impact evaluation into all CPD activities`,
    );
  }
  if (cpdQuality.sharedWithTeamRate < 50 && cpdQuality.totalRecords > 0) {
    areasForImprovement.push(
      `Only ${cpdQuality.sharedWithTeamRate}% of learning shared with team — introduce team learning sessions`,
    );
  }
  if (cpdQuality.averageHoursPerStaff < 30 && cpdQuality.totalRecords > 0) {
    areasForImprovement.push(
      `Average CPD hours (${cpdQuality.averageHoursPerStaff}h) below 30-hour annual target`,
    );
  }
  if (qualificationProgress.overdueCount > 0) {
    areasForImprovement.push(
      `${qualificationProgress.overdueCount} overdue qualification${qualificationProgress.overdueCount !== 1 ? "s" : ""} — review support and timescales`,
    );
  }
  if (supervisionDevelopment.goalsSetRate < 70 && supervisionDevelopment.totalSupervisions > 0) {
    areasForImprovement.push(
      `Development goals set in only ${supervisionDevelopment.goalsSetRate}% of supervisions — ensure goals are set each session`,
    );
  }
  if (supervisionDevelopment.actionPlanRate < 60 && supervisionDevelopment.totalSupervisions > 0) {
    areasForImprovement.push(
      `Action plans created in only ${supervisionDevelopment.actionPlanRate}% of supervisions`,
    );
  }
  if (learningCulture.overallScore < 15 && learningCulture.totalAssessments > 0) {
    areasForImprovement.push(
      "Learning culture requires development — consider embedding reflective practice and team learning",
    );
  }
  if (qualificationProgress.supportRate < 60 && qualificationProgress.totalQualifications > 0) {
    areasForImprovement.push(
      `Only ${qualificationProgress.supportRate}% of staff receiving qualification support — review mentoring and study time`,
    );
  }

  if (areasForImprovement.length === 0) {
    areasForImprovement.push("No significant areas for improvement identified — maintain current standards");
  }

  // ── Actions ───────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (qualificationProgress.overdueCount >= 2) {
    actions.push(
      `URGENT: ${qualificationProgress.overdueCount} overdue qualifications — schedule review meetings with affected staff immediately`,
    );
  } else if (qualificationProgress.overdueCount === 1) {
    actions.push(
      "URGENT: 1 overdue qualification — schedule review meeting with affected staff member",
    );
  }

  if (cpdQuality.impactAssessedRate < 30 && cpdQuality.totalRecords > 0) {
    actions.push(
      "URGENT: Impact assessment rate critically low — implement mandatory post-training evaluation forms",
    );
  }

  if (supervisionDevelopment.goalsSetRate < 50 && supervisionDevelopment.totalSupervisions > 0) {
    actions.push(
      "URGENT: Development goals absent from majority of supervisions — retrain supervisors on development-focused supervision",
    );
  }

  if (cpdQuality.sharedWithTeamRate < 30 && cpdQuality.totalRecords > 0) {
    actions.push("Introduce monthly team learning sessions to increase knowledge sharing");
  }

  if (learningCulture.reflectiveRate < 50 && learningCulture.totalAssessments > 0) {
    actions.push("Embed reflective practice into daily routines — introduce reflective journals and group reflections");
  }

  if (qualificationProgress.fundedRate < 50 && qualificationProgress.totalQualifications > 0) {
    actions.push("Review training budget allocation — increase employer funding for staff qualifications");
  }

  if (cpdQuality.averageHoursPerStaff < 20 && cpdQuality.totalRecords > 0) {
    actions.push("Develop annual training plan to ensure staff meet minimum 30 CPD hours target");
  }

  const profilesWithOverdue = staffProfiles.filter((p) => p.hasOverdueQualification);
  if (profilesWithOverdue.length > 0) {
    for (const p of profilesWithOverdue) {
      actions.push(
        `Review qualification progress for ${p.staffName} — overdue qualification identified`,
      );
    }
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required — professional development programme is well maintained");
  }

  // ── Regulatory Links ──────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 33 — Employment of staff (training and development)",
    "CHR 2015 Reg 32 — Fitness of workers",
    "NMS 19 — Staffing (qualifications and CPD)",
    "SCCIF — Leadership and management",
    "Working Together 2023 — Training requirements",
    "CHR 2015 Schedule 1 — Level 3 Diploma requirement",
    "CA 1989 s22(3)(a) — Duty to safeguard and promote welfare",
    "Skills for Care — Workforce development standards",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    cpdQuality,
    qualificationProgress,
    supervisionDevelopment,
    learningCulture,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
