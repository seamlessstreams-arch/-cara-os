// ==============================================================================
// TRANSITION PATHWAY PLANNING INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing how well a home prepares children
// for transition out of residential care. Covers pathway plan quality,
// independence skill development, transition meetings, and staff readiness.
//
// Regulatory basis:
//   - Children Act 1989 — Duty to safeguard and promote welfare
//   - Children (Leaving Care) Act 2000 — Pathway plans and personal advisers
//   - CHR 2015, Reg 14 — Transition planning for children leaving care
//   - SCCIF — Overall experiences and progress of children
//   - NMS 13 — Preparing for adulthood and independence
//   - Care Leavers Covenant — Cross-sector commitment to support care leavers
//   - NICE QS31 — Health and wellbeing of looked-after children
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type TransitionType =
  | "leaving_care"
  | "step_down"
  | "foster_care"
  | "semi_independence"
  | "supported_living"
  | "return_home"
  | "adoption"
  | "other";

export type PathwayStatus =
  | "not_started"
  | "in_progress"
  | "on_track"
  | "at_risk"
  | "completed";

export type SkillArea =
  | "budgeting"
  | "cooking"
  | "cleaning"
  | "laundry"
  | "shopping"
  | "travel"
  | "health_management"
  | "tenancy_management"
  | "employment_readiness"
  | "education_continuation"
  | "emotional_resilience"
  | "social_skills";

export type SkillLevel =
  | "not_started"
  | "developing"
  | "competent"
  | "independent";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface PathwayPlan {
  id: string;
  childId: string;
  childName: string;
  planDate: string;
  transitionType: TransitionType;
  pathwayStatus: PathwayStatus;
  personalAdviserAssigned: boolean;
  planReviewedRegularly: boolean;
  childViewsIncluded: boolean;
  accommodationIdentified: boolean;
  financialPlanInPlace: boolean;
  healthPassportCompleted: boolean;
}

export interface IndependenceSkillAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessedBy: string;
  skillArea: SkillArea;
  currentLevel: SkillLevel;
  supportInPlace: boolean;
  progressRecorded: boolean;
}

export interface TransitionMeeting {
  id: string;
  childId: string;
  childName: string;
  meetingDate: string;
  attendees: string[];
  minutesRecorded: boolean;
  actionsAgreed: boolean;
  childAttended: boolean;
  socialWorkerPresent: boolean;
  nextMeetingScheduled: boolean;
}

export interface StaffTransitionTraining {
  id: string;
  staffId: string;
  staffName: string;
  leavingCarePolicy: boolean;
  pathwayPlanning: boolean;
  independenceSkills: boolean;
  housingOptions: boolean;
  financialCapability: boolean;
  emotionalSupport: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface PathwayPlanningResult {
  overallScore: number;
  totalPlans: number;
  personalAdviserRate: number;
  planReviewedRate: number;
  childViewsRate: number;
  accommodationRate: number;
  financialPlanRate: number;
  healthPassportRate: number;
}

export interface IndependenceSkillsResult {
  overallScore: number;
  totalAssessments: number;
  competentPlusRate: number;
  supportInPlaceRate: number;
  progressRecordedRate: number;
  skillBreadthScore: number;
}

export interface TransitionMeetingsResult {
  overallScore: number;
  totalMeetings: number;
  childAttendedRate: number;
  minutesRecordedRate: number;
  actionsAgreedRate: number;
  socialWorkerPresentRate: number;
  nextMeetingScheduledRate: number;
}

export interface StaffTransitionReadinessResult {
  overallScore: number;
  totalStaff: number;
  leavingCarePolicyRate: number;
  pathwayPlanningRate: number;
  independenceSkillsRate: number;
  housingOptionsRate: number;
  financialCapabilityRate: number;
  emotionalSupportRate: number;
}

export interface ChildTransitionProfile {
  childId: string;
  childName: string;
  transitionType: TransitionType;
  pathwayStatus: PathwayStatus;
  skillAssessmentCount: number;
  meetingCount: number;
  overallScore: number;
}

export interface TransitionPathwayPlanningIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  pathwayPlanning: PathwayPlanningResult;
  independenceSkills: IndependenceSkillsResult;
  transitionMeetings: TransitionMeetingsResult;
  staffTransitionReadiness: StaffTransitionReadinessResult;
  childProfiles: ChildTransitionProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

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

// -- Label Maps ---------------------------------------------------------------

const TRANSITION_TYPE_LABELS: Record<TransitionType, string> = {
  leaving_care: "Leaving Care",
  step_down: "Step Down",
  foster_care: "Foster Care",
  semi_independence: "Semi-Independence",
  supported_living: "Supported Living",
  return_home: "Return Home",
  adoption: "Adoption",
  other: "Other",
};

const PATHWAY_STATUS_LABELS: Record<PathwayStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  on_track: "On Track",
  at_risk: "At Risk",
  completed: "Completed",
};

const SKILL_AREA_LABELS: Record<SkillArea, string> = {
  budgeting: "Budgeting",
  cooking: "Cooking",
  cleaning: "Cleaning",
  laundry: "Laundry",
  shopping: "Shopping",
  travel: "Travel",
  health_management: "Health Management",
  tenancy_management: "Tenancy Management",
  employment_readiness: "Employment Readiness",
  education_continuation: "Education Continuation",
  emotional_resilience: "Emotional Resilience",
  social_skills: "Social Skills",
};

const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  not_started: "Not Started",
  developing: "Developing",
  competent: "Competent",
  independent: "Independent",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getTransitionTypeLabel(v: TransitionType): string { return TRANSITION_TYPE_LABELS[v]; }
export function getPathwayStatusLabel(v: PathwayStatus): string { return PATHWAY_STATUS_LABELS[v]; }
export function getSkillAreaLabel(v: SkillArea): string { return SKILL_AREA_LABELS[v]; }
export function getSkillLevelLabel(v: SkillLevel): string { return SKILL_LEVEL_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluates the quality of pathway planning for children transitioning out.
 * Empty = 0 (no plans documented = non-compliant).
 *
 * Scoring: personalAdviser rate (0-6), planReviewed rate (0-6),
 * childViews rate (0-5), accommodation rate (0-4),
 * financialPlan rate (0-2), healthPassport rate (0-2) = max 25
 */
export function evaluatePathwayPlanning(
  plans: PathwayPlan[],
): PathwayPlanningResult {
  if (plans.length === 0) {
    return {
      overallScore: 0,
      totalPlans: 0,
      personalAdviserRate: 0,
      planReviewedRate: 0,
      childViewsRate: 0,
      accommodationRate: 0,
      financialPlanRate: 0,
      healthPassportRate: 0,
    };
  }

  const personalAdviserCount = plans.filter((p) => p.personalAdviserAssigned).length;
  const personalAdviserRate = pct(personalAdviserCount, plans.length);

  const planReviewedCount = plans.filter((p) => p.planReviewedRegularly).length;
  const planReviewedRate = pct(planReviewedCount, plans.length);

  const childViewsCount = plans.filter((p) => p.childViewsIncluded).length;
  const childViewsRate = pct(childViewsCount, plans.length);

  const accommodationCount = plans.filter((p) => p.accommodationIdentified).length;
  const accommodationRate = pct(accommodationCount, plans.length);

  const financialPlanCount = plans.filter((p) => p.financialPlanInPlace).length;
  const financialPlanRate = pct(financialPlanCount, plans.length);

  const healthPassportCount = plans.filter((p) => p.healthPassportCompleted).length;
  const healthPassportRate = pct(healthPassportCount, plans.length);

  let score = 0;
  score += Math.round((personalAdviserRate / 100) * 6);
  score += Math.round((planReviewedRate / 100) * 6);
  score += Math.round((childViewsRate / 100) * 5);
  score += Math.round((accommodationRate / 100) * 4);
  score += Math.round((financialPlanRate / 100) * 2);
  score += Math.round((healthPassportRate / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalPlans: plans.length,
    personalAdviserRate,
    planReviewedRate,
    childViewsRate,
    accommodationRate,
    financialPlanRate,
    healthPassportRate,
  };
}

/**
 * Evaluates independence skill development across children.
 * Empty = 0 (no assessments documented = non-compliant).
 *
 * Scoring: competent+ rate (0-7), support in place rate (0-6),
 * progress recorded rate (0-6), skill breadth (unique skills / 12) (0-6) = max 25
 */
export function evaluateIndependenceSkills(
  assessments: IndependenceSkillAssessment[],
): IndependenceSkillsResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      competentPlusRate: 0,
      supportInPlaceRate: 0,
      progressRecordedRate: 0,
      skillBreadthScore: 0,
    };
  }

  const competentPlus = assessments.filter(
    (a) => a.currentLevel === "competent" || a.currentLevel === "independent",
  ).length;
  const competentPlusRate = pct(competentPlus, assessments.length);

  const supportInPlace = assessments.filter((a) => a.supportInPlace).length;
  const supportInPlaceRate = pct(supportInPlace, assessments.length);

  const progressRecorded = assessments.filter((a) => a.progressRecorded).length;
  const progressRecordedRate = pct(progressRecorded, assessments.length);

  const uniqueSkills = new Set(assessments.map((a) => a.skillArea));
  const skillBreadthRatio = uniqueSkills.size / 12;
  const skillBreadthScore = Math.round(skillBreadthRatio * 6);

  let score = 0;
  score += Math.round((competentPlusRate / 100) * 7);
  score += Math.round((supportInPlaceRate / 100) * 6);
  score += Math.round((progressRecordedRate / 100) * 6);
  score += Math.min(6, skillBreadthScore);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalAssessments: assessments.length,
    competentPlusRate,
    supportInPlaceRate,
    progressRecordedRate,
    skillBreadthScore: Math.min(6, skillBreadthScore),
  };
}

/**
 * Evaluates transition meeting quality and compliance.
 * Empty = 0 (no meetings documented = non-compliant).
 *
 * Scoring: child attended rate (0-7), minutes recorded rate (0-6),
 * actions agreed rate (0-6), SW present + next meeting combined rate (0-6) = max 25
 */
export function evaluateTransitionMeetings(
  meetings: TransitionMeeting[],
): TransitionMeetingsResult {
  if (meetings.length === 0) {
    return {
      overallScore: 0,
      totalMeetings: 0,
      childAttendedRate: 0,
      minutesRecordedRate: 0,
      actionsAgreedRate: 0,
      socialWorkerPresentRate: 0,
      nextMeetingScheduledRate: 0,
    };
  }

  const childAttended = meetings.filter((m) => m.childAttended).length;
  const childAttendedRate = pct(childAttended, meetings.length);

  const minutesRecorded = meetings.filter((m) => m.minutesRecorded).length;
  const minutesRecordedRate = pct(minutesRecorded, meetings.length);

  const actionsAgreed = meetings.filter((m) => m.actionsAgreed).length;
  const actionsAgreedRate = pct(actionsAgreed, meetings.length);

  const socialWorkerPresent = meetings.filter((m) => m.socialWorkerPresent).length;
  const socialWorkerPresentRate = pct(socialWorkerPresent, meetings.length);

  const nextMeetingScheduled = meetings.filter((m) => m.nextMeetingScheduled).length;
  const nextMeetingScheduledRate = pct(nextMeetingScheduled, meetings.length);

  // SW present + next meeting combined: average of both rates, scaled to 0-6
  const combinedRate = (socialWorkerPresentRate + nextMeetingScheduledRate) / 2;

  let score = 0;
  score += Math.round((childAttendedRate / 100) * 7);
  score += Math.round((minutesRecordedRate / 100) * 6);
  score += Math.round((actionsAgreedRate / 100) * 6);
  score += Math.round((combinedRate / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalMeetings: meetings.length,
    childAttendedRate,
    minutesRecordedRate,
    actionsAgreedRate,
    socialWorkerPresentRate,
    nextMeetingScheduledRate,
  };
}

/**
 * Evaluates staff readiness for supporting children through transition.
 * Empty = 0 (no staff training documented = non-compliant).
 *
 * Weighted scoring per area: leavingCarePolicy=6, pathwayPlanning=5,
 * independenceSkills=5, housingOptions=4, financialCapability=3,
 * emotionalSupport=2. Total max = 25.
 */
export function evaluateStaffTransitionReadiness(
  training: StaffTransitionTraining[],
): StaffTransitionReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      leavingCarePolicyRate: 0,
      pathwayPlanningRate: 0,
      independenceSkillsRate: 0,
      housingOptionsRate: 0,
      financialCapabilityRate: 0,
      emotionalSupportRate: 0,
    };
  }

  const leavingCareCount = training.filter((t) => t.leavingCarePolicy).length;
  const leavingCarePolicyRate = pct(leavingCareCount, training.length);

  const pathwayPlanningCount = training.filter((t) => t.pathwayPlanning).length;
  const pathwayPlanningRate = pct(pathwayPlanningCount, training.length);

  const independenceSkillsCount = training.filter((t) => t.independenceSkills).length;
  const independenceSkillsRate = pct(independenceSkillsCount, training.length);

  const housingOptionsCount = training.filter((t) => t.housingOptions).length;
  const housingOptionsRate = pct(housingOptionsCount, training.length);

  const financialCapabilityCount = training.filter((t) => t.financialCapability).length;
  const financialCapabilityRate = pct(financialCapabilityCount, training.length);

  const emotionalSupportCount = training.filter((t) => t.emotionalSupport).length;
  const emotionalSupportRate = pct(emotionalSupportCount, training.length);

  let score = 0;
  score += Math.round((leavingCarePolicyRate / 100) * 6);
  score += Math.round((pathwayPlanningRate / 100) * 5);
  score += Math.round((independenceSkillsRate / 100) * 5);
  score += Math.round((housingOptionsRate / 100) * 4);
  score += Math.round((financialCapabilityRate / 100) * 3);
  score += Math.round((emotionalSupportRate / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    leavingCarePolicyRate,
    pathwayPlanningRate,
    independenceSkillsRate,
    housingOptionsRate,
    financialCapabilityRate,
    emotionalSupportRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

export function buildChildTransitionProfiles(
  plans: PathwayPlan[],
  assessments: IndependenceSkillAssessment[],
  meetings: TransitionMeeting[],
): ChildTransitionProfile[] {
  // Gather all unique children from plans
  const childMap = new Map<string, { childName: string; transitionType: TransitionType; pathwayStatus: PathwayStatus }>();
  for (const plan of plans) {
    if (!childMap.has(plan.childId)) {
      childMap.set(plan.childId, {
        childName: plan.childName,
        transitionType: plan.transitionType,
        pathwayStatus: plan.pathwayStatus,
      });
    }
  }

  return Array.from(childMap.entries()).map(([childId, info]) => {
    const childPlans = plans.filter((p) => p.childId === childId);
    const childAssessments = assessments.filter((a) => a.childId === childId);
    const childMeetings = meetings.filter((m) => m.childId === childId);

    let score = 0;

    // Pathway plan quality (0-4)
    const plan = childPlans[0];
    if (plan) {
      if (plan.personalAdviserAssigned) score += 1;
      if (plan.planReviewedRegularly) score += 1;
      if (plan.childViewsIncluded) score += 1;
      if (plan.accommodationIdentified) score += 1;
    }

    // Independence skill level (0-3)
    if (childAssessments.length > 0) {
      const competentPlus = childAssessments.filter(
        (a) => a.currentLevel === "competent" || a.currentLevel === "independent",
      ).length;
      const competentRate = competentPlus / childAssessments.length;
      if (competentRate >= 0.8) score += 3;
      else if (competentRate >= 0.5) score += 2;
      else if (competentRate > 0) score += 1;
    }

    // Meeting engagement (0-3)
    if (childMeetings.length > 0) {
      const attended = childMeetings.filter((m) => m.childAttended).length;
      const attendRate = attended / childMeetings.length;
      if (attendRate >= 0.8) score += 2;
      else if (attendRate >= 0.5) score += 1;
      if (childMeetings.length >= 2) score += 1;
    }

    return {
      childId,
      childName: info.childName,
      transitionType: info.transitionType,
      pathwayStatus: info.pathwayStatus,
      skillAssessmentCount: childAssessments.length,
      meetingCount: childMeetings.length,
      overallScore: Math.min(10, score),
    };
  });
}

// -- Main Function ------------------------------------------------------------

export function generateTransitionPathwayPlanningIntelligence(
  plans: PathwayPlan[],
  assessments: IndependenceSkillAssessment[],
  meetings: TransitionMeeting[],
  training: StaffTransitionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): TransitionPathwayPlanningIntelligence {
  const pathwayPlanning = evaluatePathwayPlanning(plans);
  const independenceSkills = evaluateIndependenceSkills(assessments);
  const transitionMeetings = evaluateTransitionMeetings(meetings);
  const staffTransitionReadiness = evaluateStaffTransitionReadiness(training);

  const rawScore =
    pathwayPlanning.overallScore +
    independenceSkills.overallScore +
    transitionMeetings.overallScore +
    staffTransitionReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildTransitionProfiles(plans, assessments, meetings);

  // -- Strengths --
  const strengths: string[] = [];
  if (plans.length > 0 && pathwayPlanning.personalAdviserRate === 100)
    strengths.push("Personal adviser assigned to all children with pathway plans");
  if (plans.length > 0 && pathwayPlanning.planReviewedRate === 100)
    strengths.push("All pathway plans reviewed regularly and kept up to date");
  if (plans.length > 0 && pathwayPlanning.childViewsRate === 100)
    strengths.push("Child views included in all pathway plans — strong participation");
  if (plans.length > 0 && pathwayPlanning.accommodationRate >= 80)
    strengths.push("Accommodation identified for " + pathwayPlanning.accommodationRate + "% of transitioning children");
  if (assessments.length > 0 && independenceSkills.competentPlusRate >= 70)
    strengths.push("Strong independence skill development — " + independenceSkills.competentPlusRate + "% at competent or independent level");
  if (assessments.length > 0 && independenceSkills.progressRecordedRate === 100)
    strengths.push("Progress recorded for all independence skill assessments");
  if (meetings.length > 0 && transitionMeetings.childAttendedRate >= 90)
    strengths.push("Excellent child participation — " + transitionMeetings.childAttendedRate + "% attendance at transition meetings");
  if (meetings.length > 0 && transitionMeetings.minutesRecordedRate === 100)
    strengths.push("Minutes recorded for all transition meetings");
  if (training.length > 0 && staffTransitionReadiness.leavingCarePolicyRate === 100)
    strengths.push("All staff trained in leaving care policy");
  if (training.length > 0 && staffTransitionReadiness.overallScore >= 20)
    strengths.push("Staff demonstrate strong overall readiness to support transitions");

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];
  if (plans.length === 0)
    areasForImprovement.push("No pathway plans documented — all children approaching transition must have a plan");
  if (plans.length > 0 && pathwayPlanning.personalAdviserRate < 100)
    areasForImprovement.push("Personal adviser not assigned for " + (100 - pathwayPlanning.personalAdviserRate) + "% of pathway plans — statutory requirement");
  if (plans.length > 0 && pathwayPlanning.planReviewedRate < 80)
    areasForImprovement.push("Only " + pathwayPlanning.planReviewedRate + "% of pathway plans reviewed regularly — plans must be kept current");
  if (plans.length > 0 && pathwayPlanning.childViewsRate < 100)
    areasForImprovement.push("Child views missing from " + (100 - pathwayPlanning.childViewsRate) + "% of pathway plans");
  if (plans.length > 0 && pathwayPlanning.healthPassportRate < 80)
    areasForImprovement.push("Health passports completed for only " + pathwayPlanning.healthPassportRate + "% of children — should be universal");
  if (assessments.length === 0 && plans.length > 0)
    areasForImprovement.push("No independence skill assessments documented — essential for transition readiness");
  if (assessments.length > 0 && independenceSkills.competentPlusRate < 50)
    areasForImprovement.push("Only " + independenceSkills.competentPlusRate + "% of skills assessed at competent or independent level");
  if (assessments.length > 0 && independenceSkills.supportInPlaceRate < 80)
    areasForImprovement.push("Support in place for only " + independenceSkills.supportInPlaceRate + "% of skill assessments");
  if (meetings.length === 0 && plans.length > 0)
    areasForImprovement.push("No transition meetings recorded — regular multi-agency meetings required");
  if (meetings.length > 0 && transitionMeetings.childAttendedRate < 80)
    areasForImprovement.push("Child attendance at transition meetings is " + transitionMeetings.childAttendedRate + "% — children should be central to their planning");
  if (meetings.length > 0 && transitionMeetings.socialWorkerPresentRate < 80)
    areasForImprovement.push("Social worker present at only " + transitionMeetings.socialWorkerPresentRate + "% of transition meetings");
  if (training.length === 0)
    areasForImprovement.push("No staff transition training documented — all staff must be prepared to support transitions");
  if (training.length > 0 && staffTransitionReadiness.leavingCarePolicyRate < 100)
    areasForImprovement.push("Leaving care policy training incomplete — " + (100 - staffTransitionReadiness.leavingCarePolicyRate) + "% of staff not trained");

  // -- Actions --
  const actions: string[] = [];
  const atRiskPlans = plans.filter((p) => p.pathwayStatus === "at_risk");
  if (atRiskPlans.length > 0)
    actions.push("URGENT: " + atRiskPlans.length + " pathway plan(s) at risk — immediate review and intervention required");
  const noAdviser = plans.filter((p) => !p.personalAdviserAssigned);
  if (noAdviser.length > 0)
    actions.push("URGENT: Assign personal advisers for " + noAdviser.length + " child(ren) — statutory requirement under Leaving Care Act 2000");
  const notStartedPlans = plans.filter((p) => p.pathwayStatus === "not_started");
  if (notStartedPlans.length > 0)
    actions.push("URGENT: " + notStartedPlans.length + " pathway plan(s) not started — begin planning immediately");
  const noAccommodation = plans.filter((p) => !p.accommodationIdentified);
  if (noAccommodation.length > 0)
    actions.push("Identify accommodation for " + noAccommodation.length + " child(ren) approaching transition");
  const noFinancialPlan = plans.filter((p) => !p.financialPlanInPlace);
  if (noFinancialPlan.length > 0)
    actions.push("Develop financial plans for " + noFinancialPlan.length + " child(ren) — essential for independent living");
  const noHealthPassport = plans.filter((p) => !p.healthPassportCompleted);
  if (noHealthPassport.length > 0)
    actions.push("Complete health passports for " + noHealthPassport.length + " child(ren) — NICE QS31 requirement");
  if (assessments.length === 0 && plans.length > 0)
    actions.push("Schedule independence skill assessments for all children with pathway plans");
  if (meetings.length === 0 && plans.length > 0)
    actions.push("Arrange transition meetings for all children with pathway plans");
  if (training.length === 0)
    actions.push("Implement staff transition training programme across all areas");
  if (training.length > 0 && staffTransitionReadiness.overallScore < 15)
    actions.push("Enhance staff training — current readiness score of " + staffTransitionReadiness.overallScore + "/25 requires improvement");

  const regulatoryLinks: string[] = [
    "Children Act 1989 — Duty to safeguard and promote welfare of looked-after children",
    "Children (Leaving Care) Act 2000 — Pathway plans and personal adviser duty",
    "CHR 2015, Reg 14 — Transition planning: preparing children for leaving care",
    "SCCIF — Overall experiences and progress of children and young people",
    "NMS 13 — Preparing for adulthood: independence and life skills",
    "Care Leavers Covenant — Cross-sector commitment to support care leavers",
    "NICE QS31 — Health and wellbeing of looked-after children and young people",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    pathwayPlanning,
    independenceSkills,
    transitionMeetings,
    staffTransitionReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
