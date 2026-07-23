// ══════════════════════════════════════════════════════════════════════════════
// Cara — Staff Performance Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Evaluates individual staff performance including:
//   - Qualification compliance & renewal tracking
//   - Performance review quality & completion
//   - Professional development plan (PDP) progress
//   - Competency assessment & development
//
// Regulatory framework:
//   CHR 2015 Reg 32 — fitness of workers
//   CHR 2015 Reg 33 — employment of staff
//   SCCIF — Leadership & Management standards
//   NMS 19 — staffing of children's homes
//   Working Together 2023 Ch2 — organisational responsibilities
// ══════════════════════════════════════════════════════════════════════════════

import { meets } from "@/lib/metrics/rate";

// ── Types ───────────────────────────────────────────────────────────────────

export type QualificationStatus =
  | "not_started"
  | "in_progress"
  | "achieved"
  | "expired"
  | "not_applicable";

export type QualificationType =
  | "level_3_diploma"
  | "level_4_diploma"
  | "level_5_diploma"
  | "first_aid"
  | "safeguarding"
  | "restraint"
  | "medication"
  | "fire_safety"
  | "food_hygiene"
  | "mental_health"
  | "therapeutic_care"
  | "management";

export type PerformanceRating =
  | "exceptional"
  | "effective"
  | "developing"
  | "underperforming"
  | "capability_concern";

export type ReviewStatus =
  | "completed_on_time"
  | "completed_late"
  | "overdue"
  | "not_due";

export type PDPGoalStatus =
  | "not_started"
  | "in_progress"
  | "achieved"
  | "missed"
  | "deferred";

export type CompetencyArea =
  | "safeguarding"
  | "behaviour_management"
  | "therapeutic_care"
  | "record_keeping"
  | "communication"
  | "teamwork"
  | "professional_development"
  | "child_centred_practice"
  | "regulatory_knowledge"
  | "risk_management";

export type CompetencyLevel =
  | "not_assessed"
  | "emerging"
  | "developing"
  | "competent"
  | "expert";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  startDate: string;
  isActive: boolean;
  requiredQualifications: QualificationType[];
  managerId?: string;
}

export interface QualificationRecord {
  id: string;
  staffId: string;
  type: QualificationType;
  status: QualificationStatus;
  achievedDate?: string;
  expiryDate?: string;
  renewalDue?: string;
  provider?: string;
}

export interface PerformanceReview {
  id: string;
  staffId: string;
  reviewDate: string;
  reviewerId: string;
  rating: PerformanceRating;
  status: ReviewStatus;
  objectivesSet: number;
  objectivesMet: number;
  developmentAreasIdentified: number;
  staffViewsRecorded: boolean;
  actionPlanCreated: boolean;
}

export interface PDPGoal {
  id: string;
  staffId: string;
  description: string;
  status: PDPGoalStatus;
  targetDate: string;
  completedDate?: string;
  linkedToTraining: boolean;
}

export interface CompetencyAssessment {
  id: string;
  staffId: string;
  area: CompetencyArea;
  level: CompetencyLevel;
  assessedDate: string;
  assessedBy: string;
  previousLevel?: CompetencyLevel;
}

// ── Result Types ───────────────────────────────────────────────────────────

export interface QualificationComplianceResult {
  totalRequired: number;
  totalAchieved: number;
  achievedRate: number;
  expiredCount: number;
  renewalRate: number | null;   // null when no qualification is due for renewal
  mandatoryComplianceRate: number;
  overallScore: number; // 0-25
}

export interface ReviewQualityResult {
  totalReviews: number;
  completionRate: number;
  objectivesMetRate: number;
  staffViewsRate: number;
  actionPlanRate: number;
  negativeRatingCount: number;
  positiveRatingRate: number;
  overallScore: number; // 0-25
}

export interface PDPProgressResult {
  totalGoals: number;
  achievementRate: number;
  linkedToTrainingRate: number;
  missedGoalRate: number;
  staffWithMinGoals: boolean;
  overallScore: number; // 0-25
}

export interface CompetencyDevelopmentResult {
  totalAssessments: number;
  staffCoverageRate: number;
  averageCompetencyScore: number;
  improvementRate: number;
  criticalAreasCovered: boolean;
  highCompetencyRate: number;
  overallScore: number; // 0-25
}

export interface StaffProfile {
  staffId: string;
  staffName: string;
  qualificationComplianceRate: number;
  currentPerformanceRating: PerformanceRating | undefined;
  pdpGoalAchievementRate: number;
  averageCompetencyLevel: number;
  overallScore: number; // 0-10
}

export interface StaffPerformanceIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  qualificationCompliance: QualificationComplianceResult;
  reviewQuality: ReviewQualityResult;
  pdpProgress: PDPProgressResult;
  competencyDevelopment: CompetencyDevelopmentResult;
  staffProfiles: StaffProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function ratingFromScore(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

const COMPETENCY_LEVEL_SCORES: Record<CompetencyLevel, number> = {
  not_assessed: 0,
  emerging: 1,
  developing: 2,
  competent: 3,
  expert: 4,
};

const MANDATORY_QUALIFICATIONS: QualificationType[] = [
  "level_3_diploma",
  "first_aid",
  "safeguarding",
];

// ── Label Functions ─────────────────────────────────────────────────────────

export function getQualificationTypeLabel(t: QualificationType): string {
  const labels: Record<QualificationType, string> = {
    level_3_diploma: "Level 3 Diploma",
    level_4_diploma: "Level 4 Diploma",
    level_5_diploma: "Level 5 Diploma",
    first_aid: "First Aid",
    safeguarding: "Safeguarding",
    restraint: "Restraint",
    medication: "Medication",
    fire_safety: "Fire Safety",
    food_hygiene: "Food Hygiene",
    mental_health: "Mental Health",
    therapeutic_care: "Therapeutic Care",
    management: "Management",
  };
  return labels[t] || t;
}

export function getQualificationStatusLabel(s: QualificationStatus): string {
  const labels: Record<QualificationStatus, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    achieved: "Achieved",
    expired: "Expired",
    not_applicable: "Not Applicable",
  };
  return labels[s] || s;
}

export function getPerformanceRatingLabel(r: PerformanceRating): string {
  const labels: Record<PerformanceRating, string> = {
    exceptional: "Exceptional",
    effective: "Effective",
    developing: "Developing",
    underperforming: "Underperforming",
    capability_concern: "Capability Concern",
  };
  return labels[r] || r;
}

export function getReviewStatusLabel(s: ReviewStatus): string {
  const labels: Record<ReviewStatus, string> = {
    completed_on_time: "Completed On Time",
    completed_late: "Completed Late",
    overdue: "Overdue",
    not_due: "Not Due",
  };
  return labels[s] || s;
}

export function getPDPGoalStatusLabel(s: PDPGoalStatus): string {
  const labels: Record<PDPGoalStatus, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    achieved: "Achieved",
    missed: "Missed",
    deferred: "Deferred",
  };
  return labels[s] || s;
}

export function getCompetencyAreaLabel(a: CompetencyArea): string {
  const labels: Record<CompetencyArea, string> = {
    safeguarding: "Safeguarding",
    behaviour_management: "Behaviour Management",
    therapeutic_care: "Therapeutic Care",
    record_keeping: "Record Keeping",
    communication: "Communication",
    teamwork: "Teamwork",
    professional_development: "Professional Development",
    child_centred_practice: "Child-Centred Practice",
    regulatory_knowledge: "Regulatory Knowledge",
    risk_management: "Risk Management",
  };
  return labels[a] || a;
}

export function getCompetencyLevelLabel(l: CompetencyLevel): string {
  const labels: Record<CompetencyLevel, string> = {
    not_assessed: "Not Assessed",
    emerging: "Emerging",
    developing: "Developing",
    competent: "Competent",
    expert: "Expert",
  };
  return labels[l] || l;
}

// ── Core Evaluation Functions ───────────────────────────────────────────────

/**
 * Evaluate qualification compliance across all staff.
 * Checks: achieved rate, expired qualifications, mandatory quals, renewal rate.
 * Score: 0-25
 */
export function evaluateQualificationCompliance(
  staff: StaffMember[],
  qualifications: QualificationRecord[],
  periodEnd: string,
): QualificationComplianceResult {
  const activeStaff = staff.filter((s) => s.isActive);

  if (activeStaff.length === 0) {
    return {
      totalRequired: 0,
      totalAchieved: 0,
      achievedRate: 0,
      expiredCount: 0,
      renewalRate: null,
      mandatoryComplianceRate: 0,
      overallScore: 0,
    };
  }

  // Calculate total required qualifications and achieved across all staff
  let totalRequired = 0;
  let totalAchieved = 0;

  for (const s of activeStaff) {
    for (const reqType of s.requiredQualifications) {
      totalRequired++;
      const qual = qualifications.find(
        (q) => q.staffId === s.id && q.type === reqType && q.status === "achieved",
      );
      if (qual) totalAchieved++;
    }
  }

  const achievedRate = pct(totalAchieved, totalRequired);

  // Expired qualifications
  const expiredCount = qualifications.filter(
    (q) => q.status === "expired" || (q.expiryDate && q.expiryDate < periodEnd && q.status === "achieved"),
  ).length;

  // Renewal rate: of quals with renewalDue, how many are renewed (not expired)
  const qualsWithRenewal = qualifications.filter((q) => q.renewalDue);
  const renewedCount = qualsWithRenewal.filter(
    (q) => q.status === "achieved" && (!q.expiryDate || q.expiryDate >= periodEnd),
  ).length;
  // Null when nothing is up for renewal — there is no renewal practice to rate.
  const renewalRate = qualsWithRenewal.length > 0
    ? pct(renewedCount, qualsWithRenewal.length)
    : null;

  // Mandatory compliance: level_3_diploma, first_aid, safeguarding achieved by all active staff
  let mandatoryTotal = 0;
  let mandatoryAchieved = 0;
  for (const s of activeStaff) {
    for (const mandType of MANDATORY_QUALIFICATIONS) {
      mandatoryTotal++;
      const qual = qualifications.find(
        (q) => q.staffId === s.id && q.type === mandType && q.status === "achieved",
      );
      if (qual) mandatoryAchieved++;
    }
  }
  const mandatoryComplianceRate = pct(mandatoryAchieved, mandatoryTotal);

  // Scoring: 0-25
  let score = 0;

  // % of required qualifications achieved: score = percentage * 0.15 (max ~15)
  score += (achievedRate / 100) * 15;

  // +3 if no expired qualifications
  if (expiredCount === 0) score += 3;

  // +3 if all mandatory (level_3_diploma, first_aid, safeguarding) achieved by all staff
  if (mandatoryAchieved === mandatoryTotal && mandatoryTotal > 0) score += 3;

  // +4 if qualification renewal rate >= 90%. Nothing due for renewal earns
  // nothing here — it is not evidence that renewals are kept on top of.
  if (meets(renewalRate, 90)) score += 4;

  return {
    totalRequired,
    totalAchieved,
    achievedRate,
    expiredCount,
    renewalRate,
    mandatoryComplianceRate,
    overallScore: Math.round(Math.min(score, 25) * 10) / 10,
  };
}

/**
 * Evaluate performance review quality.
 * Checks: completion rate, objectives met, staff views, action plans, ratings.
 * Score: 0-25
 */
export function evaluateReviewQuality(
  reviews: PerformanceReview[],
  staff: StaffMember[],
): ReviewQualityResult {
  const activeStaff = staff.filter((s) => s.isActive);

  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      completionRate: 0,
      objectivesMetRate: 0,
      staffViewsRate: 0,
      actionPlanRate: 0,
      negativeRatingCount: 0,
      positiveRatingRate: 0,
      overallScore: 0,
    };
  }

  // Filter to reviews for active staff only
  const activeStaffIds = new Set(activeStaff.map((s) => s.id));
  const relevantReviews = reviews.filter((r) => activeStaffIds.has(r.staffId));

  if (relevantReviews.length === 0) {
    return {
      totalReviews: 0,
      completionRate: 0,
      objectivesMetRate: 0,
      staffViewsRate: 0,
      actionPlanRate: 0,
      negativeRatingCount: 0,
      positiveRatingRate: 0,
      overallScore: 0,
    };
  }

  // Completion rate: completed_on_time or completed_late
  const completedCount = relevantReviews.filter(
    (r) => r.status === "completed_on_time" || r.status === "completed_late",
  ).length;
  const completionRate = pct(completedCount, relevantReviews.length);

  // Objectives met rate
  const totalObjectivesSet = relevantReviews.reduce((sum, r) => sum + r.objectivesSet, 0);
  const totalObjectivesMet = relevantReviews.reduce((sum, r) => sum + r.objectivesMet, 0);
  const objectivesMetRate = pct(totalObjectivesMet, totalObjectivesSet);

  // Staff views recorded rate
  const viewsCount = relevantReviews.filter((r) => r.staffViewsRecorded).length;
  const staffViewsRate = pct(viewsCount, relevantReviews.length);

  // Action plan rate
  const actionPlanCount = relevantReviews.filter((r) => r.actionPlanCreated).length;
  const actionPlanRate = pct(actionPlanCount, relevantReviews.length);

  // Negative ratings
  const negativeRatingCount = relevantReviews.filter(
    (r) => r.rating === "underperforming" || r.rating === "capability_concern",
  ).length;

  // Positive ratings: exceptional or effective
  const positiveCount = relevantReviews.filter(
    (r) => r.rating === "exceptional" || r.rating === "effective",
  ).length;
  const positiveRatingRate = pct(positiveCount, relevantReviews.length);

  // Scoring: 0-25
  let score = 0;

  // +8 for review completion rate >= 90%
  if (completionRate >= 90) score += 8;

  // +4 for objectives met rate >= 75%
  if (objectivesMetRate >= 75) score += 4;

  // +4 if staff views recorded in >= 90% reviews
  if (staffViewsRate >= 90) score += 4;

  // +4 if action plans in >= 90% reviews
  if (actionPlanRate >= 90) score += 4;

  // +3 if no underperforming/capability_concern ratings
  if (negativeRatingCount === 0) score += 3;

  // +2 bonus if >= 50% rated exceptional/effective
  if (positiveRatingRate >= 50) score += 2;

  return {
    totalReviews: relevantReviews.length,
    completionRate,
    objectivesMetRate,
    staffViewsRate,
    actionPlanRate,
    negativeRatingCount,
    positiveRatingRate,
    overallScore: Math.round(Math.min(score, 25) * 10) / 10,
  };
}

/**
 * Evaluate PDP (Professional Development Plan) progress.
 * Checks: goal achievement, training linkage, missed goals, minimum goals per staff.
 * Score: 0-25
 */
export function evaluatePDPProgress(
  goals: PDPGoal[],
  staff: StaffMember[],
): PDPProgressResult {
  const activeStaff = staff.filter((s) => s.isActive);

  if (goals.length === 0) {
    return {
      totalGoals: 0,
      achievementRate: 0,
      linkedToTrainingRate: 0,
      missedGoalRate: 0,
      staffWithMinGoals: false,
      overallScore: 0,
    };
  }

  const activeStaffIds = new Set(activeStaff.map((s) => s.id));
  const relevantGoals = goals.filter((g) => activeStaffIds.has(g.staffId));

  if (relevantGoals.length === 0) {
    return {
      totalGoals: 0,
      achievementRate: 0,
      linkedToTrainingRate: 0,
      missedGoalRate: 0,
      staffWithMinGoals: false,
      overallScore: 0,
    };
  }

  // Achievement rate: achieved / total (excluding deferred)
  const nonDeferredGoals = relevantGoals.filter((g) => g.status !== "deferred");
  const achievedCount = nonDeferredGoals.filter((g) => g.status === "achieved").length;
  const achievementRate = pct(achievedCount, nonDeferredGoals.length);

  // Linked to training rate
  const linkedCount = relevantGoals.filter((g) => g.linkedToTraining).length;
  const linkedToTrainingRate = pct(linkedCount, relevantGoals.length);

  // Missed goal rate
  const missedCount = relevantGoals.filter((g) => g.status === "missed").length;
  const missedGoalRate = pct(missedCount, relevantGoals.length);

  // All staff have at least 2 goals
  const goalCountByStaff = new Map<string, number>();
  for (const g of relevantGoals) {
    goalCountByStaff.set(g.staffId, (goalCountByStaff.get(g.staffId) || 0) + 1);
  }
  const staffWithMinGoals = activeStaff.every(
    (s) => (goalCountByStaff.get(s.id) || 0) >= 2,
  );

  // Scoring: 0-25
  let score = 0;

  // +8 for goal achievement rate >= 70%
  if (achievementRate >= 70) score += 8;

  // +5 for linked to training rate * 0.05 (max 5)
  score += Math.min((linkedToTrainingRate / 100) * 5, 5);

  // +4 if missed goals <= 10%
  if (missedGoalRate <= 10) score += 4;

  // +4 if all staff have at least 2 goals
  if (staffWithMinGoals) score += 4;

  // +4 bonus if achievement rate >= 90%
  if (achievementRate >= 90) score += 4;

  return {
    totalGoals: relevantGoals.length,
    achievementRate,
    linkedToTrainingRate,
    missedGoalRate,
    staffWithMinGoals,
    overallScore: Math.round(Math.min(score, 25) * 10) / 10,
  };
}

/**
 * Evaluate competency development across staff.
 * Checks: assessment coverage, competency levels, improvement, critical areas.
 * Score: 0-25
 */
export function evaluateCompetencyDevelopment(
  assessments: CompetencyAssessment[],
  staff: StaffMember[],
): CompetencyDevelopmentResult {
  const activeStaff = staff.filter((s) => s.isActive);

  if (assessments.length === 0) {
    return {
      totalAssessments: 0,
      staffCoverageRate: 0,
      averageCompetencyScore: 0,
      improvementRate: 0,
      criticalAreasCovered: false,
      highCompetencyRate: 0,
      overallScore: 0,
    };
  }

  const activeStaffIds = new Set(activeStaff.map((s) => s.id));
  const relevantAssessments = assessments.filter((a) => activeStaffIds.has(a.staffId));

  if (relevantAssessments.length === 0) {
    return {
      totalAssessments: 0,
      staffCoverageRate: 0,
      averageCompetencyScore: 0,
      improvementRate: 0,
      criticalAreasCovered: false,
      highCompetencyRate: 0,
      overallScore: 0,
    };
  }

  // Staff assessed in >= 5 competency areas
  const areasByStaff = new Map<string, Set<CompetencyArea>>();
  for (const a of relevantAssessments) {
    if (!areasByStaff.has(a.staffId)) {
      areasByStaff.set(a.staffId, new Set());
    }
    areasByStaff.get(a.staffId)!.add(a.area);
  }

  const staffWith5Plus = activeStaff.filter(
    (s) => (areasByStaff.get(s.id)?.size || 0) >= 5,
  ).length;
  const staffCoverageRate = pct(staffWith5Plus, activeStaff.length);

  // Average competency level score
  const totalLevelScore = relevantAssessments.reduce(
    (sum, a) => sum + COMPETENCY_LEVEL_SCORES[a.level],
    0,
  );
  const averageCompetencyScore =
    Math.round((totalLevelScore / relevantAssessments.length) * 100) / 100;

  // Improvement rate: % of assessments with a previous level that show increase
  const assessmentsWithPrevious = relevantAssessments.filter(
    (a) => a.previousLevel !== undefined,
  );
  const improvedCount = assessmentsWithPrevious.filter(
    (a) => COMPETENCY_LEVEL_SCORES[a.level] > COMPETENCY_LEVEL_SCORES[a.previousLevel!],
  ).length;
  const improvementRate = pct(improvedCount, assessmentsWithPrevious.length);

  // Critical areas: no staff have "not_assessed" in safeguarding or child_centred_practice
  // For each active staff, get the latest assessment in safeguarding and child_centred_practice
  const criticalAreas: CompetencyArea[] = ["safeguarding", "child_centred_practice"];
  let criticalAreasCovered = true;

  for (const s of activeStaff) {
    for (const area of criticalAreas) {
      const staffAssessments = relevantAssessments.filter(
        (a) => a.staffId === s.id && a.area === area,
      );
      if (staffAssessments.length === 0) {
        criticalAreasCovered = false;
        break;
      }
      // Get most recent assessment
      const latest = staffAssessments.sort(
        (a, b) => b.assessedDate.localeCompare(a.assessedDate),
      )[0];
      if (latest.level === "not_assessed") {
        criticalAreasCovered = false;
        break;
      }
    }
    if (!criticalAreasCovered) break;
  }

  // High competency rate: % of assessments at competent or above
  const highCount = relevantAssessments.filter(
    (a) => a.level === "competent" || a.level === "expert",
  ).length;
  const highCompetencyRate = pct(highCount, relevantAssessments.length);

  // Scoring: 0-25
  let score = 0;

  // +8 for % of staff assessed in >= 5 competency areas (percentage * 0.08)
  score += (staffCoverageRate / 100) * 8;

  // +5 for average competency level score (avg/4 * 5)
  score += (averageCompetencyScore / 4) * 5;

  // +4 for improvement rate (% with level increase vs previous, * 0.04)
  score += (improvementRate / 100) * 4;

  // +4 if no staff have "not_assessed" in safeguarding or child_centred_practice
  if (criticalAreasCovered) score += 4;

  // +4 bonus if >= 70% at competent or above
  if (highCompetencyRate >= 70) score += 4;

  return {
    totalAssessments: relevantAssessments.length,
    staffCoverageRate,
    averageCompetencyScore,
    improvementRate,
    criticalAreasCovered,
    highCompetencyRate,
    overallScore: Math.round(Math.min(score, 25) * 10) / 10,
  };
}

// ── Staff Profile Builder ───────────────────────────────────────────────────

function buildStaffProfiles(
  staff: StaffMember[],
  qualifications: QualificationRecord[],
  reviews: PerformanceReview[],
  pdpGoals: PDPGoal[],
  competencyAssessments: CompetencyAssessment[],
): StaffProfile[] {
  const activeStaff = staff.filter((s) => s.isActive);

  return activeStaff.map((s) => {
    // Qualification compliance rate for this staff member
    const requiredCount = s.requiredQualifications.length;
    const achievedCount = s.requiredQualifications.filter((reqType) =>
      qualifications.some(
        (q) => q.staffId === s.id && q.type === reqType && q.status === "achieved",
      ),
    ).length;
    const qualificationComplianceRate = pct(achievedCount, requiredCount);

    // Most recent performance review rating
    const staffReviews = reviews
      .filter((r) => r.staffId === s.id)
      .sort((a, b) => b.reviewDate.localeCompare(a.reviewDate));
    const currentPerformanceRating = staffReviews.length > 0 ? staffReviews[0].rating : undefined;

    // PDP goal achievement rate
    const staffGoals = pdpGoals.filter((g) => g.staffId === s.id);
    const nonDeferredGoals = staffGoals.filter((g) => g.status !== "deferred");
    const achievedGoals = nonDeferredGoals.filter((g) => g.status === "achieved").length;
    const pdpGoalAchievementRate = pct(achievedGoals, nonDeferredGoals.length);

    // Average competency level
    const staffAssessments = competencyAssessments.filter((a) => a.staffId === s.id);
    const totalLevelScore = staffAssessments.reduce(
      (sum, a) => sum + COMPETENCY_LEVEL_SCORES[a.level],
      0,
    );
    const averageCompetencyLevel = staffAssessments.length > 0
      ? Math.round((totalLevelScore / staffAssessments.length) * 100) / 100
      : 0;

    // Overall score: 0-10 based on above metrics
    let overallScore = 0;
    // Qualification compliance: up to 2.5 pts
    overallScore += (qualificationComplianceRate / 100) * 2.5;
    // Performance rating: up to 2.5 pts
    if (currentPerformanceRating === "exceptional") overallScore += 2.5;
    else if (currentPerformanceRating === "effective") overallScore += 2;
    else if (currentPerformanceRating === "developing") overallScore += 1;
    else if (currentPerformanceRating === "underperforming") overallScore += 0.5;
    // PDP goal achievement: up to 2.5 pts
    overallScore += (pdpGoalAchievementRate / 100) * 2.5;
    // Competency level: up to 2.5 pts (avg/4 * 2.5)
    overallScore += (averageCompetencyLevel / 4) * 2.5;

    return {
      staffId: s.id,
      staffName: s.name,
      qualificationComplianceRate,
      currentPerformanceRating,
      pdpGoalAchievementRate,
      averageCompetencyLevel,
      overallScore: clamp(Math.round(overallScore * 10) / 10, 0, 10),
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateStaffPerformanceIntelligence(
  staff: StaffMember[],
  qualifications: QualificationRecord[],
  reviews: PerformanceReview[],
  pdpGoals: PDPGoal[],
  competencyAssessments: CompetencyAssessment[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): StaffPerformanceIntelligence {
  const qualificationCompliance = evaluateQualificationCompliance(staff, qualifications, periodEnd);
  const reviewQuality = evaluateReviewQuality(reviews, staff);
  const pdpProgress = evaluatePDPProgress(pdpGoals, staff);
  const competencyDevelopment = evaluateCompetencyDevelopment(competencyAssessments, staff);

  const overallScore = Math.round(
    (qualificationCompliance.overallScore +
      reviewQuality.overallScore +
      pdpProgress.overallScore +
      competencyDevelopment.overallScore) * 10,
  ) / 10;

  const rating = ratingFromScore(overallScore);

  const staffProfiles = buildStaffProfiles(
    staff, qualifications, reviews, pdpGoals, competencyAssessments,
  );

  // ── Strengths ──
  const strengths: string[] = [];

  if (qualificationCompliance.achievedRate >= 90) {
    strengths.push("Qualification compliance is strong with over 90% of required qualifications achieved across the staff team");
  }
  if (qualificationCompliance.expiredCount === 0 && qualificationCompliance.totalRequired > 0) {
    strengths.push("No expired qualifications — all certifications are current and maintained");
  }
  if (qualificationCompliance.mandatoryComplianceRate >= 100) {
    strengths.push("All staff hold mandatory qualifications (Level 3, First Aid, Safeguarding)");
  }
  if (reviewQuality.completionRate >= 90) {
    strengths.push("Performance reviews are consistently completed, demonstrating effective supervision");
  }
  if (reviewQuality.staffViewsRate >= 90) {
    strengths.push("Staff views are routinely recorded in performance reviews, promoting reflective practice");
  }
  if (reviewQuality.actionPlanRate >= 90) {
    strengths.push("Action plans are created in the vast majority of performance reviews");
  }
  if (reviewQuality.negativeRatingCount === 0 && reviewQuality.totalReviews > 0) {
    strengths.push("No staff rated as underperforming or requiring capability procedures");
  }
  if (pdpProgress.achievementRate >= 70) {
    strengths.push("Professional development goals are being achieved at a good rate across the team");
  }
  if (pdpProgress.staffWithMinGoals && pdpProgress.totalGoals > 0) {
    strengths.push("All staff have meaningful professional development plans with multiple goals");
  }
  if (competencyDevelopment.criticalAreasCovered) {
    strengths.push("All staff are assessed in critical competency areas of safeguarding and child-centred practice");
  }
  if (competencyDevelopment.highCompetencyRate >= 70) {
    strengths.push("Over 70% of competency assessments are rated at competent or expert level");
  }
  if (competencyDevelopment.improvementRate >= 50) {
    strengths.push("Strong evidence of competency improvement with over 50% of re-assessments showing increased levels");
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];

  if (qualificationCompliance.achievedRate < 80 && qualificationCompliance.totalRequired > 0) {
    areasForImprovement.push("Qualification compliance is below 80% — staff are missing required qualifications");
  }
  if (qualificationCompliance.expiredCount > 0) {
    areasForImprovement.push(`${qualificationCompliance.expiredCount} qualification(s) have expired and require renewal`);
  }
  if (qualificationCompliance.mandatoryComplianceRate < 100 && qualificationCompliance.totalRequired > 0) {
    areasForImprovement.push("Not all staff hold mandatory qualifications — this is a regulatory concern under Reg 32");
  }
  if (reviewQuality.completionRate < 80 && reviewQuality.totalReviews > 0) {
    areasForImprovement.push("Performance review completion rate is below 80% — regular supervision is not consistently evidenced");
  }
  if (reviewQuality.objectivesMetRate < 60 && reviewQuality.totalReviews > 0) {
    areasForImprovement.push("Objectives met rate is below 60% — objectives may not be realistic or adequately supported");
  }
  if (reviewQuality.staffViewsRate < 80 && reviewQuality.totalReviews > 0) {
    areasForImprovement.push("Staff views are not consistently recorded in reviews, limiting reflective practice");
  }
  if (reviewQuality.negativeRatingCount > 0) {
    areasForImprovement.push(`${reviewQuality.negativeRatingCount} staff member(s) rated as underperforming or capability concern — formal support plans needed`);
  }
  if (pdpProgress.achievementRate < 50 && pdpProgress.totalGoals > 0) {
    areasForImprovement.push("PDP goal achievement rate is below 50% — professional development is not progressing effectively");
  }
  if (pdpProgress.missedGoalRate > 20 && pdpProgress.totalGoals > 0) {
    areasForImprovement.push("Over 20% of PDP goals have been missed — review goal-setting and support mechanisms");
  }
  if (!pdpProgress.staffWithMinGoals && pdpProgress.totalGoals > 0) {
    areasForImprovement.push("Not all staff have at least 2 professional development goals — PDPs need strengthening");
  }
  if (competencyDevelopment.staffCoverageRate < 70 && competencyDevelopment.totalAssessments > 0) {
    areasForImprovement.push("Less than 70% of staff have been assessed in 5 or more competency areas — widen assessment coverage");
  }
  if (!competencyDevelopment.criticalAreasCovered && competencyDevelopment.totalAssessments > 0) {
    areasForImprovement.push("Not all staff are assessed in safeguarding and child-centred practice — these critical areas must be addressed");
  }

  // ── Actions ──
  const actions: string[] = [];

  if (qualificationCompliance.mandatoryComplianceRate < 100 && qualificationCompliance.totalRequired > 0) {
    actions.push("URGENT: Ensure all staff achieve mandatory qualifications (Level 3 Diploma, First Aid, Safeguarding) as required by Reg 32");
  }
  if (qualificationCompliance.expiredCount > 0) {
    actions.push("URGENT: Renew expired qualifications immediately and implement a tracking system for renewal dates");
  }
  if (reviewQuality.negativeRatingCount > 0) {
    actions.push("HIGH: Implement formal support plans for staff with underperforming or capability concern ratings");
  }
  if (reviewQuality.completionRate < 80 && reviewQuality.totalReviews > 0) {
    actions.push("HIGH: Establish a structured supervision and review schedule to ensure all reviews are completed on time");
  }
  if (!competencyDevelopment.criticalAreasCovered && competencyDevelopment.totalAssessments > 0) {
    actions.push("HIGH: Complete competency assessments in safeguarding and child-centred practice for all staff");
  }
  if (pdpProgress.achievementRate < 50 && pdpProgress.totalGoals > 0) {
    actions.push("MEDIUM: Review PDP goals for achievability and provide additional support for professional development");
  }
  if (competencyDevelopment.staffCoverageRate < 70 && competencyDevelopment.totalAssessments > 0) {
    actions.push("MEDIUM: Expand competency assessment programme to cover all staff in at least 5 areas");
  }
  if (pdpProgress.linkedToTrainingRate < 50 && pdpProgress.totalGoals > 0) {
    actions.push("LOW: Strengthen links between PDP goals and formal training opportunities");
  }

  // ── Regulatory Links ──
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 32 — fitness of workers, including qualifications, skills, and competence",
    "CHR 2015 Reg 33 — employment of staff, recruitment, and ongoing suitability",
    "SCCIF — Leadership & Management, staff supervision, training, and development",
    "NMS 19 — staffing of children's homes, sufficient and competent staff",
    "Working Together 2023 Ch2 — organisational responsibilities for safeguarding workforce development",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    qualificationCompliance,
    reviewQuality,
    pdpProgress,
    competencyDevelopment,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
