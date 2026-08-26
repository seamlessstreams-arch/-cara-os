import { below, meets, rate } from "@/lib/metrics/rate";
// Staff Wellbeing Resilience Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ══════════════════════════════════════════════════════════════════════════════
// Cara — Staff Wellbeing & Resilience Intelligence Engine
//
// Evaluates how well a children's home supports its staff workforce through
// wellbeing assessments, burnout prevention, policy frameworks, and
// resilience training.
//
// Regulatory basis:
//   - CHR 2015 Regulation 13 — Leadership and management (staff wellbeing)
//   - SCCIF — Workforce and leadership
//   - NMS 19 — Staffing of children's homes
//   - NMS 20 — Staff supervision and support
//   - Health and Safety at Work Act 1974 — Employer duty of care
//   - Working Time Regulations 1998 — Working hours and rest
//   - ACAS Guidance — Promoting positive mental health at work
//
// Scoring breakdown (0-100, 4 evaluators x 25):
//   Wellbeing Quality:       0-25  — Assessment outcomes and support metrics
//   Wellbeing Compliance:    0-25  — Action plans, follow-up, feedback, diversity
//   Wellbeing Policy:        0-25  — 7 policy booleans (4+4+4+4+3+3+3)
//   Staff Resilience Readiness: 0-25  — 6 training skills (6+5+5+4+3+2)
//
// PRESENCE pattern: empty data = 0 score (good data needed to score well)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type WellbeingType =
  | "supervision_session"
  | "wellbeing_check"
  | "stress_assessment"
  | "resilience_review"
  | "team_debrief"
  | "reflective_practice"
  | "employee_assistance"
  | "peer_support";

export type WellbeingScore =
  | "excellent"
  | "good"
  | "moderate"
  | "poor"
  | "critical";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ──────────────────────────────────────────────────

const wellbeingTypeLabels: Record<WellbeingType, string> = {
  supervision_session: "Supervision Session",
  wellbeing_check: "Wellbeing Check",
  stress_assessment: "Stress Assessment",
  resilience_review: "Resilience Review",
  team_debrief: "Team Debrief",
  reflective_practice: "Reflective Practice",
  employee_assistance: "Employee Assistance",
  peer_support: "Peer Support",
};

export function getWellbeingTypeLabel(type: WellbeingType): string {
  return wellbeingTypeLabels[type];
}

const wellbeingScoreLabels: Record<WellbeingScore, string> = {
  excellent: "Excellent",
  good: "Good",
  moderate: "Moderate",
  poor: "Poor",
  critical: "Critical",
};

export function getWellbeingScoreLabel(score: WellbeingScore): string {
  return wellbeingScoreLabels[score];
}

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface WellbeingAssessment {
  id: string;
  staffId: string;
  staffName: string;
  assessmentDate: string;
  wellbeingType: WellbeingType;
  wellbeingScore: WellbeingScore;
  stressManaged: boolean;
  supportProvided: boolean;
  workloadReviewed: boolean;
  actionPlanCreated: boolean;
  followUpScheduled: boolean;
  feedbackGiven: boolean;
}

export interface WellbeingPolicy {
  id: string;
  staffWellbeingStrategy: boolean;
  burnoutPreventionPlan: boolean;
  supervisionFramework: boolean;
  workloadManagementPolicy: boolean;
  employeeAssistanceProgramme: boolean;
  peerSupportNetwork: boolean;
  regularReview: boolean;
}

export interface StaffResilienceTraining {
  id: string;
  staffId: string;
  staffName: string;
  stressManagement: boolean;
  emotionalResilience: boolean;
  boundaryMaintenance: boolean;
  selfCare: boolean;
  teamSupport: boolean;
  debriefingSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface WellbeingQualityResult {
  totalAssessments: number;
  /** null when the population is empty — nothing measured, not 0%. */
  wellbeingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  stressManagedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  supportProvidedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  workloadReviewedRate: number | null;
  score: number; // 0-25
}

export interface WellbeingComplianceResult {
  totalAssessments: number;
  /** null when the population is empty — nothing measured, not 0%. */
  actionPlanRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  followUpRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  feedbackRate: number | null;
  wellbeingTypeDiversityRatio: number;
  score: number; // 0-25
}

export interface WellbeingPolicyResult {
  staffWellbeingStrategy: boolean;
  burnoutPreventionPlan: boolean;
  supervisionFramework: boolean;
  workloadManagementPolicy: boolean;
  employeeAssistanceProgramme: boolean;
  peerSupportNetwork: boolean;
  regularReview: boolean;
  score: number; // 0-25
}

export interface StaffResilienceReadinessResult {
  totalStaff: number;
  stressManagementCount: number;
  /** null when the population is empty — nothing measured, not 0%. */
  stressManagementRate: number | null;
  emotionalResilienceCount: number;
  /** null when the population is empty — nothing measured, not 0%. */
  emotionalResilienceRate: number | null;
  boundaryMaintenanceCount: number;
  /** null when the population is empty — nothing measured, not 0%. */
  boundaryMaintenanceRate: number | null;
  selfCareCount: number;
  /** null when the population is empty — nothing measured, not 0%. */
  selfCareRate: number | null;
  teamSupportCount: number;
  /** null when the population is empty — nothing measured, not 0%. */
  teamSupportRate: number | null;
  debriefingSkillsCount: number;
  /** null when the population is empty — nothing measured, not 0%. */
  debriefingSkillsRate: number | null;
  score: number; // 0-25
}

export interface StaffWellbeingProfile {
  staffId: string;
  staffName: string;
  totalAssessments: number;
  wellbeingRate: number;
  stressManagedRate: number;
  uniqueTypes: number;
  score: number; // 0-10
}

export interface StaffWellbeingResilienceIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  wellbeingQuality: WellbeingQualityResult;
  wellbeingCompliance: WellbeingComplianceResult;
  wellbeingPolicy: WellbeingPolicyResult;
  staffResilienceReadiness: StaffResilienceReadinessResult;

  staffProfiles: StaffWellbeingProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function cap(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Wellbeing Quality (0-25) ─────────────────────────────────

export function evaluateWellbeingQuality(
  assessments: WellbeingAssessment[],
): WellbeingQualityResult {
  const total = assessments.length;

  if (total === 0) {
    return {
      totalAssessments: 0,
      wellbeingRate: null,
      stressManagedRate: null,
      supportProvidedRate: null,
      workloadReviewedRate: null,
      score: 0,
    };
  }

  const positiveCount = assessments.filter(
    (a) => a.wellbeingScore === "excellent" || a.wellbeingScore === "good",
  ).length;
  const wellbeingRate = rate(positiveCount, total);

  const stressManagedCount = assessments.filter((a) => a.stressManaged).length;
  const stressManagedRate = rate(stressManagedCount, total);

  const supportProvidedCount = assessments.filter((a) => a.supportProvided).length;
  const supportProvidedRate = rate(supportProvidedCount, total);

  const workloadReviewedCount = assessments.filter((a) => a.workloadReviewed).length;
  const workloadReviewedRate = rate(workloadReviewedCount, total);

  // Weighted scoring: wellbeingScore 0-7, stressManaged 0-6, supportProvided 0-6, workloadReviewed 0-6
  let score = 0;
  score += (wellbeingRate! / 100) * 7;
  score += (stressManagedRate! / 100) * 6;
  score += (supportProvidedRate! / 100) * 6;
  score += (workloadReviewedRate! / 100) * 6;

  score = cap(Math.round(score * 10) / 10, 0, 25);

  return {
    totalAssessments: total,
    wellbeingRate,
    stressManagedRate,
    supportProvidedRate,
    workloadReviewedRate,
    score,
  };
}

// ── Evaluator 2: Wellbeing Compliance (0-25) ──────────────────────────────

export function evaluateWellbeingCompliance(
  assessments: WellbeingAssessment[],
): WellbeingComplianceResult {
  const total = assessments.length;

  if (total === 0) {
    return {
      totalAssessments: 0,
      actionPlanRate: null,
      followUpRate: null,
      feedbackRate: null,
      wellbeingTypeDiversityRatio: 0,
      score: 0,
    };
  }

  const actionPlanCount = assessments.filter((a) => a.actionPlanCreated).length;
  const actionPlanRate = rate(actionPlanCount, total);

  const followUpCount = assessments.filter((a) => a.followUpScheduled).length;
  const followUpRate = rate(followUpCount, total);

  const feedbackCount = assessments.filter((a) => a.feedbackGiven).length;
  const feedbackRate = rate(feedbackCount, total);

  const uniqueTypes = new Set(assessments.map((a) => a.wellbeingType)).size;
  const wellbeingTypeDiversityRatio = Math.round((uniqueTypes / 8) * 100) / 100;

  // Weighted scoring: actionPlan 0-8, followUp 0-7, feedback 0-5, diversity 0-5
  let score = 0;
  score += (actionPlanRate! / 100) * 8;
  score += (followUpRate! / 100) * 7;
  score += (feedbackRate! / 100) * 5;
  score += wellbeingTypeDiversityRatio * 5;

  score = cap(Math.round(score * 10) / 10, 0, 25);

  return {
    totalAssessments: total,
    actionPlanRate,
    followUpRate,
    feedbackRate,
    wellbeingTypeDiversityRatio,
    score,
  };
}

// ── Evaluator 3: Wellbeing Policy (0-25) ──────────────────────────────────

export function evaluateWellbeingPolicy(
  policy: WellbeingPolicy | null,
): WellbeingPolicyResult {
  if (!policy) {
    return {
      staffWellbeingStrategy: false,
      burnoutPreventionPlan: false,
      supervisionFramework: false,
      workloadManagementPolicy: false,
      employeeAssistanceProgramme: false,
      peerSupportNetwork: false,
      regularReview: false,
      score: 0,
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.staffWellbeingStrategy) score += 4;
  if (policy.burnoutPreventionPlan) score += 4;
  if (policy.supervisionFramework) score += 4;
  if (policy.workloadManagementPolicy) score += 4;
  if (policy.employeeAssistanceProgramme) score += 3;
  if (policy.peerSupportNetwork) score += 3;
  if (policy.regularReview) score += 3;

  score = cap(score, 0, 25);

  return {
    staffWellbeingStrategy: policy.staffWellbeingStrategy,
    burnoutPreventionPlan: policy.burnoutPreventionPlan,
    supervisionFramework: policy.supervisionFramework,
    workloadManagementPolicy: policy.workloadManagementPolicy,
    employeeAssistanceProgramme: policy.employeeAssistanceProgramme,
    peerSupportNetwork: policy.peerSupportNetwork,
    regularReview: policy.regularReview,
    score,
  };
}

// ── Evaluator 4: Staff Resilience Readiness (0-25) ────────────────────────

export function evaluateStaffResilienceReadiness(
  training: StaffResilienceTraining[],
): StaffResilienceReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      stressManagementCount: 0,
      stressManagementRate: null,
      emotionalResilienceCount: 0,
      emotionalResilienceRate: null,
      boundaryMaintenanceCount: 0,
      boundaryMaintenanceRate: null,
      selfCareCount: 0,
      selfCareRate: null,
      teamSupportCount: 0,
      teamSupportRate: null,
      debriefingSkillsCount: 0,
      debriefingSkillsRate: null,
      score: 0,
    };
  }

  const stressManagementCount = training.filter((t) => t.stressManagement).length;
  const stressManagementRate = rate(stressManagementCount, totalStaff);

  const emotionalResilienceCount = training.filter((t) => t.emotionalResilience).length;
  const emotionalResilienceRate = rate(emotionalResilienceCount, totalStaff);

  const boundaryMaintenanceCount = training.filter((t) => t.boundaryMaintenance).length;
  const boundaryMaintenanceRate = rate(boundaryMaintenanceCount, totalStaff);

  const selfCareCount = training.filter((t) => t.selfCare).length;
  const selfCareRate = rate(selfCareCount, totalStaff);

  const teamSupportCount = training.filter((t) => t.teamSupport).length;
  const teamSupportRate = rate(teamSupportCount, totalStaff);

  const debriefingSkillsCount = training.filter((t) => t.debriefingSkills).length;
  const debriefingSkillsRate = rate(debriefingSkillsCount, totalStaff);

  // 6 skills weighted: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (stressManagementRate! / 100) * 6;
  score += (emotionalResilienceRate! / 100) * 5;
  score += (boundaryMaintenanceRate! / 100) * 5;
  score += (selfCareRate! / 100) * 4;
  score += ((teamSupportRate ?? 0) / 100) * 3;
  score += ((debriefingSkillsRate ?? 0) / 100) * 2;

  score = cap(Math.round(score * 10) / 10, 0, 25);

  return {
    totalStaff,
    stressManagementCount,
    stressManagementRate,
    emotionalResilienceCount,
    emotionalResilienceRate,
    boundaryMaintenanceCount,
    boundaryMaintenanceRate,
    selfCareCount,
    selfCareRate,
    teamSupportCount,
    teamSupportRate,
    debriefingSkillsCount,
    debriefingSkillsRate,
    score,
  };
}

// ── Build Staff Wellbeing Profiles ────────────────────────────────────────

export function buildStaffWellbeingProfiles(
  assessments: WellbeingAssessment[],
): StaffWellbeingProfile[] {
  const staffMap = new Map<string, { staffId: string; staffName: string; assessments: WellbeingAssessment[] }>();

  for (const assessment of assessments) {
    if (!staffMap.has(assessment.staffId)) {
      staffMap.set(assessment.staffId, {
        staffId: assessment.staffId,
        staffName: assessment.staffName,
        assessments: [],
      });
    }
    staffMap.get(assessment.staffId)!.assessments.push(assessment);
  }

  return Array.from(staffMap.values()).map((staff) => {
    const total = staff.assessments.length;

    const positiveCount = staff.assessments.filter(
      (a) => a.wellbeingScore === "excellent" || a.wellbeingScore === "good",
    ).length;
    const wellbeingRate = rate(positiveCount, total)!;

    const stressManagedCount = staff.assessments.filter((a) => a.stressManaged).length;
    const stressManagedRate = rate(stressManagedCount, total)!;

    const uniqueTypes = new Set(staff.assessments.map((a) => a.wellbeingType)).size;

    // Score 0-10: frequency(0-2), wellbeing(0-3), stress(0-3), diversityBonus(0-2)
    let score = 0;

    // frequency: >=10 assessments -> 2, >=5 -> 1, <5 -> 0
    if (total >= 10) score += 2;
    else if (total >= 5) score += 1;

    // wellbeing: based on wellbeingRate tiers
    if (meets(wellbeingRate, 80)) score += 3;
    else if (meets(wellbeingRate, 60)) score += 2;
    else if (meets(wellbeingRate, 40)) score += 1;

    // stress: based on stressManagedRate tiers
    if (meets(stressManagedRate, 80)) score += 3;
    else if (meets(stressManagedRate, 60)) score += 2;
    else if (meets(stressManagedRate, 40)) score += 1;

    // diversityBonus: >=4 types -> 2, >=2 -> 1
    if (uniqueTypes >= 4) score += 2;
    else if (uniqueTypes >= 2) score += 1;

    score = cap(score, 0, 10);

    return {
      staffId: staff.staffId,
      staffName: staff.staffName,
      totalAssessments: total,
      wellbeingRate,
      stressManagedRate,
      uniqueTypes,
      score,
    };
  });
}

// ── Main Orchestrator ─────────────────────────────────────────────────────

export function generateStaffWellbeingResilienceIntelligence(
  assessments: WellbeingAssessment[],
  policy: WellbeingPolicy | null,
  training: StaffResilienceTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): StaffWellbeingResilienceIntelligence {
  const wellbeingQuality = evaluateWellbeingQuality(assessments);
  const wellbeingCompliance = evaluateWellbeingCompliance(assessments);
  const wellbeingPolicyResult = evaluateWellbeingPolicy(policy);
  const staffResilienceReadiness = evaluateStaffResilienceReadiness(training);

  const rawScore =
    wellbeingQuality.score +
    wellbeingCompliance.score +
    wellbeingPolicyResult.score +
    staffResilienceReadiness.score;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const staffProfiles = buildStaffWellbeingProfiles(assessments);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Strengths logic
  if (meets(wellbeingQuality.wellbeingRate, 80) && assessments.length > 0) {
    strengths.push("Strong staff wellbeing culture with " + wellbeingQuality.wellbeingRate + "% positive wellbeing scores");
  }
  if (meets(wellbeingQuality.stressManagedRate, 80) && assessments.length > 0) {
    strengths.push("Effective stress management with " + wellbeingQuality.stressManagedRate + "% stress managed rate");
  }
  if (meets(wellbeingQuality.supportProvidedRate, 80) && assessments.length > 0) {
    strengths.push("Consistent support provision with " + wellbeingQuality.supportProvidedRate + "% support provided rate");
  }
  if (meets(wellbeingCompliance.actionPlanRate, 80) && assessments.length > 0) {
    strengths.push("Robust action planning with " + wellbeingCompliance.actionPlanRate + "% action plan creation rate");
  }
  if (wellbeingPolicyResult.score === 25) {
    strengths.push("Comprehensive wellbeing policy framework fully in place");
  }
  if (staffResilienceReadiness.score === 25) {
    strengths.push("All staff fully trained in resilience skills");
  }

  // Areas for improvement
  if (assessments.length > 0 && below(wellbeingQuality.wellbeingRate, 60)) {
    areasForImprovement.push("Wellbeing score rate at " + wellbeingQuality.wellbeingRate + "% — below 60% threshold, targeted wellbeing interventions needed");
  }
  if (assessments.length > 0 && below(wellbeingCompliance.followUpRate, 60)) {
    areasForImprovement.push("Follow-up scheduling rate at " + wellbeingCompliance.followUpRate + "% — below 60% threshold, improve follow-up processes");
  }
  if (assessments.length > 0 && wellbeingCompliance.wellbeingTypeDiversityRatio < 0.5) {
    areasForImprovement.push("Limited diversity of wellbeing assessment types — expand range of wellbeing support activities");
  }
  if (staffResilienceReadiness.totalStaff > 0 && staffResilienceReadiness.score < 15) {
    areasForImprovement.push("Staff resilience training coverage below expected levels — prioritise training programme");
  }

  // Actions logic
  if (assessments.length === 0) {
    actions.push("No wellbeing assessment records found — begin recording staff wellbeing assessments to build evidence base");
  }
  if (!policy) {
    actions.push("URGENT: No wellbeing policy in place — develop and implement staff wellbeing policy immediately");
  }
  if (training.length === 0) {
    actions.push("URGENT: No staff resilience training records — arrange resilience training programme for all staff");
  }
  if (assessments.length > 0 && below(wellbeingQuality.workloadReviewedRate, 50)) {
    actions.push("Workload review rate at " + wellbeingQuality.workloadReviewedRate + "% — ensure workload is reviewed in all wellbeing assessments");
  }
  if (policy && !policy.burnoutPreventionPlan) {
    actions.push("URGENT: No burnout prevention plan in place — develop burnout prevention strategy as a priority");
  }
  if (policy && !policy.staffWellbeingStrategy) {
    actions.push("URGENT: No staff wellbeing strategy — create and implement a comprehensive wellbeing strategy");
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 13 — Leadership and management (staff wellbeing)",
    "SCCIF — Workforce and leadership",
    "NMS 19 — Staffing of children's homes",
    "NMS 20 — Staff supervision and support",
    "Health and Safety at Work Act 1974 — Employer duty of care",
    "Working Time Regulations 1998 — Working hours and rest",
    "ACAS Guidance — Promoting positive mental health at work",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    wellbeingQuality,
    wellbeingCompliance,
    wellbeingPolicy: wellbeingPolicyResult,
    staffResilienceReadiness,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
