import { below, meets, rate } from "@/lib/metrics/rate";
// After Care Support Quality Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type Unions ───────────────────────────────────────────────────────────

export type SupportType =
  | "housing_support"
  | "employment_guidance"
  | "education_continuation"
  | "financial_advice"
  | "emotional_wellbeing"
  | "health_access"
  | "social_network"
  | "practical_skills";

export type EngagementLevel =
  | "highly_engaged"
  | "engaged"
  | "moderate"
  | "minimal"
  | "disengaged";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps ────────────────────────────────────────────────────────────

const supportTypeLabels: Record<SupportType, string> = {
  housing_support: "Housing Support",
  employment_guidance: "Employment Guidance",
  education_continuation: "Education Continuation",
  financial_advice: "Financial Advice",
  emotional_wellbeing: "Emotional Wellbeing",
  health_access: "Health Access",
  social_network: "Social Network",
  practical_skills: "Practical Skills",
};

const engagementLevelLabels: Record<EngagementLevel, string> = {
  highly_engaged: "Highly Engaged",
  engaged: "Engaged",
  moderate: "Moderate",
  minimal: "Minimal",
  disengaged: "Disengaged",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSupportTypeLabel(type: SupportType): string {
  return supportTypeLabels[type];
}

export function getEngagementLevelLabel(level: EngagementLevel): string {
  return engagementLevelLabels[level];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

export function getSupportTypeLabels(): Record<SupportType, string> {
  return { ...supportTypeLabels };
}

export function getEngagementLevelLabels(): Record<EngagementLevel, string> {
  return { ...engagementLevelLabels };
}

export function getRatingLabels(): Record<Rating, string> {
  return { ...ratingLabels };
}

// ── Input Interfaces ──────────────────────────────────────────────────────

export interface AfterCareSession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  supportType: SupportType;
  engagementLevel: EngagementLevel;
  needsAssessed: boolean;
  goalsSet: boolean;
  progressTracked: boolean;
  documentedInPlan: boolean;
  staffSupported: boolean;
  feedbackGiven: boolean;
}

export interface AfterCarePolicy {
  id: string;
  leavingCareStrategy: boolean;
  pathwayPlanFramework: boolean;
  housingProtocol: boolean;
  educationEmploymentPlan: boolean;
  healthAndWellbeingContinuity: boolean;
  financialSupportGuidance: boolean;
  regularReview: boolean;
}

export interface StaffAfterCareTraining {
  id: string;
  staffId: string;
  staffName: string;
  leavingCareKnowledge: boolean;
  pathwayPlanning: boolean;
  housingAdvice: boolean;
  employmentSupport: boolean;
  benefitsAndFinance: boolean;
  emotionalResilience: boolean;
}

// ── Result Interfaces ─────────────────────────────────────────────────────

export interface AfterCareSupportQualityResult {
  overallScore: number;
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  engagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  needsAssessedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  goalsSetRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  progressRate: number | null;
}

export interface AfterCareSupportComplianceResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staffSupportedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  feedbackRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  supportTypeDiversityRatio: number | null;
}

export interface AfterCareSupportPolicyResult {
  overallScore: number;
  leavingCareStrategy: boolean;
  pathwayPlanFramework: boolean;
  housingProtocol: boolean;
  educationEmploymentPlan: boolean;
  healthAndWellbeingContinuity: boolean;
  financialSupportGuidance: boolean;
  regularReview: boolean;
}

export interface StaffAfterCareReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  leavingCareKnowledgeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  pathwayPlanningRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  housingAdviceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  employmentSupportRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  benefitsAndFinanceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  emotionalResilienceRate: number | null;
}

export interface ChildAfterCareProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  engagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  goalsRate: number | null;
  overallScore: number;
}

export interface AfterCareSupportQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  afterCareSupportQuality: AfterCareSupportQualityResult;
  afterCareSupportCompliance: AfterCareSupportComplianceResult;
  afterCareSupportPolicy: AfterCareSupportPolicyResult;
  staffAfterCareReadiness: StaffAfterCareReadinessResult;
  childProfiles: ChildAfterCareProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: After Care Support Quality (0–25) ───────────────────────

export function evaluateAfterCareSupportQuality(
  sessions: AfterCareSession[],
): AfterCareSupportQualityResult {
  const total = sessions.length;

  if (total === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      engagementRate: null,
      needsAssessedRate: null,
      goalsSetRate: null,
      progressRate: null,
    };
  }

  const engagedCount = sessions.filter(
    (s) => s.engagementLevel === "highly_engaged" || s.engagementLevel === "engaged",
  ).length;
  const needsAssessedCount = sessions.filter((s) => s.needsAssessed).length;
  const goalsSetCount = sessions.filter((s) => s.goalsSet).length;
  const progressCount = sessions.filter((s) => s.progressTracked).length;

  const engagementRate = rate(engagedCount, total);
  const needsAssessedRate = rate(needsAssessedCount, total);
  const goalsSetRate = rate(goalsSetCount, total);
  const progressRate = rate(progressCount, total);

  const score = Math.min(
    25,
    Math.round(((engagementRate ?? 0) / 100) * 7) +
      Math.round(((needsAssessedRate ?? 0) / 100) * 6) +
      Math.round(((goalsSetRate ?? 0) / 100) * 6) +
      Math.round(((progressRate ?? 0) / 100) * 6),
  );

  return {
    overallScore: score,
    totalSessions: total,
    engagementRate,
    needsAssessedRate,
    goalsSetRate,
    progressRate,
  };
}

// ── Evaluator 2: After Care Support Compliance (0–25) ────────────────────

export function evaluateAfterCareSupportCompliance(
  sessions: AfterCareSession[],
): AfterCareSupportComplianceResult {
  const total = sessions.length;

  if (total === 0) {
    return {
      overallScore: 0,
      documentedRate: null,
      staffSupportedRate: null,
      feedbackRate: null,
      supportTypeDiversityRatio: 0,
    };
  }

  const documentedCount = sessions.filter((s) => s.documentedInPlan).length;
  const staffSupportedCount = sessions.filter((s) => s.staffSupported).length;
  const feedbackCount = sessions.filter((s) => s.feedbackGiven).length;

  const documentedRate = rate(documentedCount, total);
  const staffSupportedRate = rate(staffSupportedCount, total);
  const feedbackRate = rate(feedbackCount, total);

  const uniqueTypes = new Set(sessions.map((s) => s.supportType)).size;
  const supportTypeDiversityRatio = rate(uniqueTypes, 8);

  const score = Math.min(
    25,
    Math.round(((documentedRate ?? 0) / 100) * 8) +
      Math.round(((staffSupportedRate ?? 0) / 100) * 7) +
      Math.round(((feedbackRate ?? 0) / 100) * 5) +
      Math.round(((supportTypeDiversityRatio ?? 0) / 100) * 5),
  );

  return {
    overallScore: score,
    documentedRate,
    staffSupportedRate,
    feedbackRate,
    supportTypeDiversityRatio,
  };
}

// ── Evaluator 3: After Care Support Policy (0–25) ────────────────────────

export function evaluateAfterCareSupportPolicy(
  policy: AfterCarePolicy | null,
): AfterCareSupportPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      leavingCareStrategy: false,
      pathwayPlanFramework: false,
      housingProtocol: false,
      educationEmploymentPlan: false,
      healthAndWellbeingContinuity: false,
      financialSupportGuidance: false,
      regularReview: false,
    };
  }

  const score = Math.min(
    25,
    (policy.leavingCareStrategy ? 4 : 0) +
      (policy.pathwayPlanFramework ? 4 : 0) +
      (policy.housingProtocol ? 4 : 0) +
      (policy.educationEmploymentPlan ? 4 : 0) +
      (policy.healthAndWellbeingContinuity ? 3 : 0) +
      (policy.financialSupportGuidance ? 3 : 0) +
      (policy.regularReview ? 3 : 0),
  );

  return {
    overallScore: score,
    leavingCareStrategy: policy.leavingCareStrategy,
    pathwayPlanFramework: policy.pathwayPlanFramework,
    housingProtocol: policy.housingProtocol,
    educationEmploymentPlan: policy.educationEmploymentPlan,
    healthAndWellbeingContinuity: policy.healthAndWellbeingContinuity,
    financialSupportGuidance: policy.financialSupportGuidance,
    regularReview: policy.regularReview,
  };
}

// ── Evaluator 4: Staff After Care Readiness (0–25) ───────────────────────

export function evaluateStaffAfterCareReadiness(
  training: StaffAfterCareTraining[],
): StaffAfterCareReadinessResult {
  const total = training.length;

  if (total === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      leavingCareKnowledgeRate: null,
      pathwayPlanningRate: null,
      housingAdviceRate: null,
      employmentSupportRate: null,
      benefitsAndFinanceRate: null,
      emotionalResilienceRate: null,
    };
  }

  const leavingCareKnowledgeRate = rate(
    training.filter((t) => t.leavingCareKnowledge).length,
    total,
  );
  const pathwayPlanningRate = rate(
    training.filter((t) => t.pathwayPlanning).length,
    total,
  );
  const housingAdviceRate = rate(
    training.filter((t) => t.housingAdvice).length,
    total,
  );
  const employmentSupportRate = rate(
    training.filter((t) => t.employmentSupport).length,
    total,
  );
  const benefitsAndFinanceRate = rate(
    training.filter((t) => t.benefitsAndFinance).length,
    total,
  );
  const emotionalResilienceRate = rate(
    training.filter((t) => t.emotionalResilience).length,
    total,
  );

  const score = Math.min(
    25,
    Math.round(((leavingCareKnowledgeRate ?? 0) / 100) * 6) +
      Math.round(((pathwayPlanningRate ?? 0) / 100) * 5) +
      Math.round(((housingAdviceRate ?? 0) / 100) * 5) +
      Math.round(((employmentSupportRate ?? 0) / 100) * 4) +
      Math.round(((benefitsAndFinanceRate ?? 0) / 100) * 3) +
      Math.round(((emotionalResilienceRate ?? 0) / 100) * 2),
  );

  return {
    overallScore: score,
    totalStaff: total,
    leavingCareKnowledgeRate,
    pathwayPlanningRate,
    housingAdviceRate,
    employmentSupportRate,
    benefitsAndFinanceRate,
    emotionalResilienceRate,
  };
}

// ── Child Profiles ────────────────────────────────────────────────────────

export function buildChildAfterCareProfiles(
  sessions: AfterCareSession[],
): ChildAfterCareProfile[] {
  const grouped = new Map<string, AfterCareSession[]>();

  for (const s of sessions) {
    const existing = grouped.get(s.childId) ?? [];
    existing.push(s);
    grouped.set(s.childId, existing);
  }

  const profiles: ChildAfterCareProfile[] = [];

  for (const [childId, childSessions] of grouped) {
    const childName = childSessions[0].childName;
    const totalSessions = childSessions.length;

    const engagedCount = childSessions.filter(
      (s) => s.engagementLevel === "highly_engaged" || s.engagementLevel === "engaged",
    ).length;
    const engagementRate = rate(engagedCount, totalSessions);

    const goalsCount = childSessions.filter((s) => s.goalsSet).length;
    const goalsRate = rate(goalsCount, totalSessions);

    const uniqueTypes = new Set(childSessions.map((s) => s.supportType)).size;

    // Score 0–10
    let score = 0;

    // Frequency
    if (totalSessions >= 10) score += 2;
    else if (totalSessions >= 5) score += 1;

    // Engagement
    if (meets(engagementRate, 80)) score += 3;
    else if (meets(engagementRate, 60)) score += 2;
    else if (meets(engagementRate, 40)) score += 1;

    // Goals
    if (meets(goalsRate, 80)) score += 3;
    else if (meets(goalsRate, 60)) score += 2;
    else if (meets(goalsRate, 40)) score += 1;

    // Support type diversity
    if (uniqueTypes >= 4) score += 2;
    else if (uniqueTypes >= 2) score += 1;

    score = Math.min(10, score);

    profiles.push({
      childId,
      childName,
      totalSessions,
      engagementRate,
      goalsRate,
      overallScore: score,
    });
  }

  return profiles;
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateAfterCareSupportQualityIntelligence(
  sessions: AfterCareSession[],
  policy: AfterCarePolicy | null,
  training: StaffAfterCareTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): AfterCareSupportQualityIntelligence {
  const afterCareSupportQuality = evaluateAfterCareSupportQuality(sessions);
  const afterCareSupportCompliance = evaluateAfterCareSupportCompliance(sessions);
  const afterCareSupportPolicy = evaluateAfterCareSupportPolicy(policy);
  const staffAfterCareReadiness = evaluateStaffAfterCareReadiness(training);

  const rawScore =
    afterCareSupportQuality.overallScore +
    afterCareSupportCompliance.overallScore +
    afterCareSupportPolicy.overallScore +
    staffAfterCareReadiness.overallScore;

  const overallScore = Math.min(100, rawScore);
  const rating = getRating(overallScore);
  const childProfiles = buildChildAfterCareProfiles(sessions);

  // Strengths
  const strengths: string[] = [];
  if (meets(afterCareSupportQuality.engagementRate, 80)) {
    strengths.push("High engagement rate — " + afterCareSupportQuality.engagementRate + "% of sessions show strong young person engagement");
  }
  if (meets(afterCareSupportQuality.needsAssessedRate, 80)) {
    strengths.push("Needs consistently assessed in " + afterCareSupportQuality.needsAssessedRate + "% of after care sessions");
  }
  if (meets(afterCareSupportQuality.goalsSetRate, 80)) {
    strengths.push("Goals set in " + afterCareSupportQuality.goalsSetRate + "% of sessions — strong forward planning");
  }
  if (meets(afterCareSupportQuality.progressRate, 80)) {
    strengths.push("Progress tracked in " + afterCareSupportQuality.progressRate + "% of sessions — consistent monitoring");
  }
  if (meets(afterCareSupportCompliance.documentedRate, 80)) {
    strengths.push("After care support is well documented in care plans");
  }
  if (meets(afterCareSupportCompliance.staffSupportedRate, 80)) {
    strengths.push("Staff support is consistently provided during after care sessions");
  }
  if (meets(afterCareSupportCompliance.feedbackRate, 80)) {
    strengths.push("Feedback routinely given to young people following sessions");
  }
  if (afterCareSupportPolicy.overallScore >= 20) {
    strengths.push("Comprehensive after care policy framework in place");
  }
  if (staffAfterCareReadiness.overallScore >= 20) {
    strengths.push("Staff team demonstrates strong readiness to support care leavers");
  }

  // Areas for improvement
  const areasForImprovement: string[] = [];
  if (below(afterCareSupportQuality.engagementRate, 60)) {
    areasForImprovement.push("Engagement rate is below 60% — review how sessions are structured to improve participation");
  }
  if (below(afterCareSupportQuality.needsAssessedRate, 60)) {
    areasForImprovement.push("Needs assessment rate needs improvement — ensure all sessions include a needs review");
  }
  if (below(afterCareSupportQuality.goalsSetRate, 60)) {
    areasForImprovement.push("Goal-setting rate is low — ensure clear goals are established in each session");
  }
  if (below(afterCareSupportQuality.progressRate, 60)) {
    areasForImprovement.push("Progress tracking is insufficient — implement systematic progress monitoring");
  }
  if (below(afterCareSupportCompliance.documentedRate, 60)) {
    areasForImprovement.push("Documentation of after care support in care plans needs improvement");
  }
  if (below(afterCareSupportCompliance.staffSupportedRate, 60)) {
    areasForImprovement.push("Staff support during after care sessions is inconsistent");
  }
  if (below(afterCareSupportCompliance.feedbackRate, 60)) {
    areasForImprovement.push("Feedback provision to young people after sessions needs improvement");
  }
  if (afterCareSupportPolicy.overallScore < 15) {
    areasForImprovement.push("After care policy framework has significant gaps — review and update");
  }
  if (staffAfterCareReadiness.overallScore < 15) {
    areasForImprovement.push("Staff training in after care support areas requires improvement");
  }

  // Actions
  const actions: string[] = [];
  if (sessions.length === 0) {
    actions.push("URGENT: No after care support sessions recorded — review whether sessions are being facilitated and recorded");
  }
  if (policy === null) {
    actions.push("URGENT: No after care support policy in place — develop and implement policy immediately");
  }
  if (training.length === 0) {
    actions.push("URGENT: No staff training records for after care support — arrange training programme");
  }
  if (below(afterCareSupportCompliance.supportTypeDiversityRatio, 50)) {
    actions.push("MEDIUM: Diversify support types — consider housing, employment, education, and wellbeing sessions");
  }
  if (below(afterCareSupportQuality.engagementRate, 60) && sessions.length > 0) {
    actions.push("HIGH: Review session delivery methods to improve young person engagement");
  }
  if (below(afterCareSupportQuality.goalsSetRate, 60) && sessions.length > 0) {
    actions.push("HIGH: Implement structured goal-setting in all after care sessions");
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 9 — Quality of care (leaving care preparation)",
    "Children (Leaving Care) Act 2000 — Duties to care leavers",
    "SCCIF — Experiences and progress of children (leaving care)",
    "NMS 13 — Preparing for adulthood",
    "Children Act 1989 Section 24 — Advice and assistance for care leavers",
    "UNCRC Article 27 — Adequate standard of living",
    "Keep On Caring Strategy 2016 — Supporting care leavers",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    afterCareSupportQuality,
    afterCareSupportCompliance,
    afterCareSupportPolicy,
    staffAfterCareReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
