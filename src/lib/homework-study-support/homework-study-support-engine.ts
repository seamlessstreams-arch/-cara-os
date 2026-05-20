// Homework Study Support Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Types ──────────────────────────────────────────────────────────────────

export type StudyActivityType =
  | "homework_help"
  | "revision_session"
  | "reading_time"
  | "project_work"
  | "exam_preparation"
  | "tutoring"
  | "study_skills_coaching"
  | "educational_visit";

export type EngagementLevel =
  | "highly_engaged"
  | "engaged"
  | "moderate"
  | "minimal"
  | "disengaged";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ────────────────────────────────────────────────────

const STUDY_ACTIVITY_TYPE_LABELS: Record<StudyActivityType, string> = {
  homework_help: "Homework Help",
  revision_session: "Revision Session",
  reading_time: "Reading Time",
  project_work: "Project Work",
  exam_preparation: "Exam Preparation",
  tutoring: "Tutoring",
  study_skills_coaching: "Study Skills Coaching",
  educational_visit: "Educational Visit",
};

const ENGAGEMENT_LEVEL_LABELS: Record<EngagementLevel, string> = {
  highly_engaged: "Highly Engaged",
  engaged: "Engaged",
  moderate: "Moderate",
  minimal: "Minimal",
  disengaged: "Disengaged",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getStudyActivityTypeLabel(type: StudyActivityType): string {
  return STUDY_ACTIVITY_TYPE_LABELS[type];
}

export function getEngagementLevelLabel(level: EngagementLevel): string {
  return ENGAGEMENT_LEVEL_LABELS[level];
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

// ── Core Interfaces ─────────────────────────────────────────────────────────

export interface StudySession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string; // ISO date
  activityType: StudyActivityType;
  engagementLevel: EngagementLevel;
  progressNoted: boolean;
  confidenceGrown: boolean;
  resourcesProvided: boolean;
  documentedInPlan: boolean;
  staffSupported: boolean;
  feedbackGiven: boolean;
}

export interface StudySupportPolicy {
  id: string;
  homeworkSupportStrategy: boolean;
  quietStudySpaceProvision: boolean;
  educationalResourcePlan: boolean;
  tutoringArrangementFramework: boolean;
  schoolLiaisonProtocol: boolean;
  examSupportGuidance: boolean;
  regularReview: boolean;
}

export interface StaffStudySupportTraining {
  id: string;
  staffId: string;
  staffName: string;
  educationalSupport: boolean;
  studySkillsCoaching: boolean;
  motivationalTechniques: boolean;
  senAwareness: boolean;
  schoolLiaison: boolean;
  resourceManagement: boolean;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface QualityResult {
  overallScore: number; // 0-25
  totalSessions: number;
  engagementRate: number;
  progressRate: number;
  confidenceRate: number;
  resourceRate: number;
}

export interface ComplianceResult {
  overallScore: number; // 0-25
  documentedRate: number;
  staffSupportedRate: number;
  feedbackRate: number;
  activityDiversityRatio: number;
}

export interface PolicyResult {
  overallScore: number; // 0-25
  homeworkSupportStrategy: boolean;
  quietStudySpaceProvision: boolean;
  educationalResourcePlan: boolean;
  tutoringArrangementFramework: boolean;
  schoolLiaisonProtocol: boolean;
  examSupportGuidance: boolean;
  regularReview: boolean;
}

export interface StaffReadinessResult {
  overallScore: number; // 0-25
  educationalSupportRate: number;
  studySkillsCoachingRate: number;
  motivationalTechniquesRate: number;
  senAwarenessRate: number;
  schoolLiaisonRate: number;
  resourceManagementRate: number;
}

export interface ChildProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  engagementRate: number;
  progressRate: number;
  overallScore: number; // 0-10
}

export interface HomeworkStudySupportIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  quality: QualityResult;
  compliance: ComplianceResult;
  policy: PolicyResult;
  staffReadiness: StaffReadinessResult;

  childProfiles: ChildProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── All Activity Types (for diversity calculation) ──────────────────────────

const ALL_ACTIVITY_TYPES: StudyActivityType[] = [
  "homework_help",
  "revision_session",
  "reading_time",
  "project_work",
  "exam_preparation",
  "tutoring",
  "study_skills_coaching",
  "educational_visit",
];

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 1: Quality (0-25)
// Weights: engagementRate 7 + progressRate 6 + confidenceRate 6 + resourceRate 6
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateQuality(sessions: StudySession[]): QualityResult {
  const totalSessions = sessions.length;

  if (totalSessions === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      engagementRate: 0,
      progressRate: 0,
      confidenceRate: 0,
      resourceRate: 0,
    };
  }

  // Engagement rate (highly_engaged + engaged)
  const engagedCount = sessions.filter(
    (s) => s.engagementLevel === "highly_engaged" || s.engagementLevel === "engaged",
  ).length;
  const engagementRate = pct(engagedCount, totalSessions);

  // Progress rate
  const progressCount = sessions.filter((s) => s.progressNoted).length;
  const progressRate = pct(progressCount, totalSessions);

  // Confidence rate
  const confidenceCount = sessions.filter((s) => s.confidenceGrown).length;
  const confidenceRate = pct(confidenceCount, totalSessions);

  // Resource rate
  const resourceCount = sessions.filter((s) => s.resourcesProvided).length;
  const resourceRate = pct(resourceCount, totalSessions);

  // Score (out of 25): 7+6+6+6
  let score = 0;
  score += (engagementRate / 100) * 7;
  score += (progressRate / 100) * 6;
  score += (confidenceRate / 100) * 6;
  score += (resourceRate / 100) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    overallScore: score,
    totalSessions,
    engagementRate,
    progressRate,
    confidenceRate,
    resourceRate,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 2: Compliance (0-25)
// Weights: documentedRate 8 + staffSupportedRate 7 + feedbackRate 5 + activityDiversityRatio 5
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateCompliance(sessions: StudySession[]): ComplianceResult {
  const totalSessions = sessions.length;

  if (totalSessions === 0) {
    return {
      overallScore: 0,
      documentedRate: 0,
      staffSupportedRate: 0,
      feedbackRate: 0,
      activityDiversityRatio: 0,
    };
  }

  // Documented rate
  const documentedCount = sessions.filter((s) => s.documentedInPlan).length;
  const documentedRate = pct(documentedCount, totalSessions);

  // Staff supported rate
  const staffSupportedCount = sessions.filter((s) => s.staffSupported).length;
  const staffSupportedRate = pct(staffSupportedCount, totalSessions);

  // Feedback rate
  const feedbackCount = sessions.filter((s) => s.feedbackGiven).length;
  const feedbackRate = pct(feedbackCount, totalSessions);

  // Activity diversity ratio
  const uniqueTypes = new Set(sessions.map((s) => s.activityType)).size;
  const activityDiversityRatio = pct(uniqueTypes, ALL_ACTIVITY_TYPES.length);

  // Score (out of 25): 8+7+5+5
  let score = 0;
  score += (documentedRate / 100) * 8;
  score += (staffSupportedRate / 100) * 7;
  score += (feedbackRate / 100) * 5;
  score += (activityDiversityRatio / 100) * 5;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    overallScore: score,
    documentedRate,
    staffSupportedRate,
    feedbackRate,
    activityDiversityRatio,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 3: Policy (0-25)
// Weights: 4+4+4+4+3+3+3 = 25
// ══════════════════════════════════════════════════════════════════════════════

export function evaluatePolicy(policy: StudySupportPolicy | null): PolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      homeworkSupportStrategy: false,
      quietStudySpaceProvision: false,
      educationalResourcePlan: false,
      tutoringArrangementFramework: false,
      schoolLiaisonProtocol: false,
      examSupportGuidance: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.homeworkSupportStrategy) score += 4;
  if (policy.quietStudySpaceProvision) score += 4;
  if (policy.educationalResourcePlan) score += 4;
  if (policy.tutoringArrangementFramework) score += 4;
  if (policy.schoolLiaisonProtocol) score += 3;
  if (policy.examSupportGuidance) score += 3;
  if (policy.regularReview) score += 3;

  score = clamp(score, 0, 25);

  return {
    overallScore: score,
    homeworkSupportStrategy: policy.homeworkSupportStrategy,
    quietStudySpaceProvision: policy.quietStudySpaceProvision,
    educationalResourcePlan: policy.educationalResourcePlan,
    tutoringArrangementFramework: policy.tutoringArrangementFramework,
    schoolLiaisonProtocol: policy.schoolLiaisonProtocol,
    examSupportGuidance: policy.examSupportGuidance,
    regularReview: policy.regularReview,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 4: Staff Readiness (0-25)
// Weights: 6+5+5+4+3+2 = 25
// ══════════════════════════════════════════════════════════════════════════════

export function evaluateStaffReadiness(
  training: StaffStudySupportTraining[],
): StaffReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      overallScore: 0,
      educationalSupportRate: 0,
      studySkillsCoachingRate: 0,
      motivationalTechniquesRate: 0,
      senAwarenessRate: 0,
      schoolLiaisonRate: 0,
      resourceManagementRate: 0,
    };
  }

  const educationalSupportCount = training.filter((t) => t.educationalSupport).length;
  const educationalSupportRate = pct(educationalSupportCount, totalStaff);

  const studySkillsCoachingCount = training.filter((t) => t.studySkillsCoaching).length;
  const studySkillsCoachingRate = pct(studySkillsCoachingCount, totalStaff);

  const motivationalTechniquesCount = training.filter((t) => t.motivationalTechniques).length;
  const motivationalTechniquesRate = pct(motivationalTechniquesCount, totalStaff);

  const senAwarenessCount = training.filter((t) => t.senAwareness).length;
  const senAwarenessRate = pct(senAwarenessCount, totalStaff);

  const schoolLiaisonCount = training.filter((t) => t.schoolLiaison).length;
  const schoolLiaisonRate = pct(schoolLiaisonCount, totalStaff);

  const resourceManagementCount = training.filter((t) => t.resourceManagement).length;
  const resourceManagementRate = pct(resourceManagementCount, totalStaff);

  // Score (out of 25): 6+5+5+4+3+2
  let score = 0;
  score += (educationalSupportRate / 100) * 6;
  score += (studySkillsCoachingRate / 100) * 5;
  score += (motivationalTechniquesRate / 100) * 5;
  score += (senAwarenessRate / 100) * 4;
  score += (schoolLiaisonRate / 100) * 3;
  score += (resourceManagementRate / 100) * 2;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    overallScore: score,
    educationalSupportRate,
    studySkillsCoachingRate,
    motivationalTechniquesRate,
    senAwarenessRate,
    schoolLiaisonRate,
    resourceManagementRate,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Build Child Profiles (0-10)
// freq (>=10 -> 2, >=5 -> 1) + engagement (>=80 -> 3, >=60 -> 2, >=40 -> 1) +
// progress (>=80 -> 3, >=60 -> 2, >=40 -> 1) + diversity (>=4 -> 2, >=2 -> 1). Cap 10.
// ══════════════════════════════════════════════════════════════════════════════

export function buildChildProfiles(sessions: StudySession[]): ChildProfile[] {
  const childMap = new Map<string, { childId: string; childName: string; sessions: StudySession[] }>();

  for (const session of sessions) {
    const existing = childMap.get(session.childId);
    if (existing) {
      existing.sessions.push(session);
    } else {
      childMap.set(session.childId, {
        childId: session.childId,
        childName: session.childName,
        sessions: [session],
      });
    }
  }

  return Array.from(childMap.values()).map((child) => {
    const totalSessions = child.sessions.length;

    const engagedCount = child.sessions.filter(
      (s) => s.engagementLevel === "highly_engaged" || s.engagementLevel === "engaged",
    ).length;
    const engagementRate = pct(engagedCount, totalSessions);

    const progressCount = child.sessions.filter((s) => s.progressNoted).length;
    const progressRate = pct(progressCount, totalSessions);

    const uniqueTypes = new Set(child.sessions.map((s) => s.activityType)).size;

    // Score 0-10
    let score = 0;

    // Frequency: 0-2
    if (totalSessions >= 10) {
      score += 2;
    } else if (totalSessions >= 5) {
      score += 1;
    }

    // Engagement: 0-3
    if (engagementRate >= 80) {
      score += 3;
    } else if (engagementRate >= 60) {
      score += 2;
    } else if (engagementRate >= 40) {
      score += 1;
    }

    // Progress: 0-3
    if (progressRate >= 80) {
      score += 3;
    } else if (progressRate >= 60) {
      score += 2;
    } else if (progressRate >= 40) {
      score += 1;
    }

    // Diversity: 0-2
    if (uniqueTypes >= 4) {
      score += 2;
    } else if (uniqueTypes >= 2) {
      score += 1;
    }

    score = clamp(score, 0, 10);

    return {
      childId: child.childId,
      childName: child.childName,
      totalSessions,
      engagementRate,
      progressRate,
      overallScore: score,
    };
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Generate Full Intelligence
// ══════════════════════════════════════════════════════════════════════════════

export function generateHomeworkStudySupportIntelligence(
  sessions: StudySession[],
  policy: StudySupportPolicy | null,
  training: StaffStudySupportTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): HomeworkStudySupportIntelligence {
  const assessedAt = periodEnd;

  // Evaluate each layer
  const quality = evaluateQuality(sessions);
  const compliance = evaluateCompliance(sessions);
  const policyResult = evaluatePolicy(policy);
  const staffReadiness = evaluateStaffReadiness(training);

  // Build child profiles
  const childProfiles = buildChildProfiles(sessions);

  // Overall score (100 points, capped)
  const rawScore =
    quality.overallScore +
    compliance.overallScore +
    policyResult.overallScore +
    staffReadiness.overallScore;
  const overallScore = clamp(Math.round(rawScore), 0, 100);

  const rating = getRating(overallScore);

  // Derive strengths, areas for improvement, actions, regulatory links
  const strengths = deriveStrengths(quality, compliance, policyResult, staffReadiness, overallScore);
  const areasForImprovement = deriveAreasForImprovement(quality, compliance, overallScore);
  const actions = deriveActions(sessions, policy, training, quality, compliance);
  const regulatoryLinks = [
    "CHR 2015 Regulation 8 — Education standard",
    "CHR 2015 Regulation 9 — Quality of care (educational support)",
    "SCCIF — Experiences and progress of children (education)",
    "NMS 11 — Education (homework and study support)",
    "Children Act 1989 — Welfare of the child (education)",
    "UNCRC Article 28 — Right to education",
    "Promoting the Education of Looked-After Children (DfE 2018)",
  ];

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    quality,
    compliance,
    policy: policyResult,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Derive Strengths ────────────────────────────────────────────────────────

function deriveStrengths(
  quality: QualityResult,
  compliance: ComplianceResult,
  policy: PolicyResult,
  staff: StaffReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall homework and study support rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall homework and study support rated Good (" + overallScore + "/100)");
  }

  if (quality.engagementRate >= 80) {
    strengths.push("Strong study engagement: " + quality.engagementRate + "% of sessions show high or good engagement");
  }

  if (quality.progressRate >= 80) {
    strengths.push("Excellent progress tracking: progress noted in " + quality.progressRate + "% of sessions");
  }

  if (quality.confidenceRate >= 80) {
    strengths.push("Confidence growth observed in " + quality.confidenceRate + "% of sessions");
  }

  if (compliance.documentedRate >= 80) {
    strengths.push("Strong documentation: " + compliance.documentedRate + "% of sessions documented in plan");
  }

  if (compliance.staffSupportedRate >= 80) {
    strengths.push("Excellent staff support: staff present in " + compliance.staffSupportedRate + "% of sessions");
  }

  if (policy.overallScore === 25) {
    strengths.push("Comprehensive study support policy with all key elements in place");
  }

  if (staff.educationalSupportRate >= 90) {
    strengths.push("Excellent educational support training: " + staff.educationalSupportRate + "% of staff trained");
  }

  return strengths;
}

// ── Derive Areas for Improvement ────────────────────────────────────────────

function deriveAreasForImprovement(
  quality: QualityResult,
  compliance: ComplianceResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall homework and study support rated Inadequate (" + overallScore + "/100) — urgent review required");
  } else if (overallScore < 60) {
    areas.push("Overall homework and study support Requires Improvement (" + overallScore + "/100)");
  }

  if (quality.totalSessions > 0 && quality.engagementRate < 60) {
    areas.push("Study engagement rate at " + quality.engagementRate + "% — below 60% threshold, motivation strategies needed");
  }

  if (quality.totalSessions > 0 && quality.progressRate < 60) {
    areas.push("Progress tracking at " + quality.progressRate + "% — progress should be noted more consistently");
  }

  if (quality.totalSessions > 0 && quality.confidenceRate < 60) {
    areas.push("Confidence growth observed in only " + quality.confidenceRate + "% of sessions — strategies to build confidence needed");
  }

  if (compliance.documentedRate > 0 && compliance.documentedRate < 60) {
    areas.push("Documentation rate at " + compliance.documentedRate + "% — sessions should be recorded in education plans");
  }

  if (compliance.staffSupportedRate > 0 && compliance.staffSupportedRate < 60) {
    areas.push("Staff support rate at " + compliance.staffSupportedRate + "% — children need more consistent staff presence during study");
  }

  return areas;
}

// ── Derive Actions ──────────────────────────────────────────────────────────

function deriveActions(
  sessions: StudySession[],
  policy: StudySupportPolicy | null,
  training: StaffStudySupportTraining[],
  quality: QualityResult,
  compliance: ComplianceResult,
): string[] {
  const actions: string[] = [];

  if (sessions.length === 0) {
    actions.push("No study session records found — begin recording homework and study support sessions immediately");
  }

  if (policy === null) {
    actions.push("URGENT: No study support policy in place — develop and implement a homework and study support policy");
  }

  if (training.length === 0) {
    actions.push("URGENT: No staff study support training records — arrange training for all residential staff");
  }

  if (quality.totalSessions > 0 && quality.engagementRate < 60) {
    actions.push("Review study engagement strategies to improve engagement rate from " + quality.engagementRate + "%");
  }

  if (quality.totalSessions > 0 && quality.progressRate < 60) {
    actions.push("Implement consistent progress tracking across all study sessions");
  }

  if (compliance.documentedRate > 0 && compliance.documentedRate < 60) {
    actions.push("Ensure all study sessions are documented in education plans (" + compliance.documentedRate + "% currently documented)");
  }

  if (compliance.staffSupportedRate > 0 && compliance.staffSupportedRate < 60) {
    actions.push("Increase staff presence during study sessions from " + compliance.staffSupportedRate + "%");
  }

  return actions;
}
