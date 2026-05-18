// ══════════════════════════════════════════════════════════════════════════════
// LEAVING CARE PREPARATION INTELLIGENCE ENGINE
//
// Pure deterministic engine for tracking how effectively a children's home
// prepares young people for independence and leaving care.  Covers pathway
// planning, independence skills development, accommodation planning, and
// ongoing support network arrangements.
//
// Scoring model (100 points):
//   pathway_planning      — 30  (plan quality, timeliness, reviews, YP involvement)
//   independence_skills    — 25  (practical life skills, progress, breadth)
//   accommodation_planning — 25  (suitable options, transition, staying close/put)
//   support_network        — 20  (ongoing support, mentoring, PA, social connections)
//
// Rating thresholds:
//   >= 80 outstanding
//   >= 60 good
//   >= 40 requires_improvement
//   <  40 inadequate
//
// Regulatory basis:
//   - Children Act 1989, s23C/24 — Leaving care provisions
//   - Children (Leaving Care) Act 2000 — Duties to care leavers
//   - CHR 2015, Reg 7 — Children's plans
//   - CHR 2015, Reg 14 — Preparation for leaving care
//   - SCCIF — Experiences and progress
//
// No AI.  No external calls.  Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type PathwayPlanStatus =
  | "current"
  | "due_for_review"
  | "overdue"
  | "not_started"
  | "draft";

export type SkillLevel =
  | "not_assessed"
  | "emerging"
  | "developing"
  | "competent"
  | "independent";

export type SkillCategory =
  | "cooking"
  | "budgeting"
  | "cleaning"
  | "laundry"
  | "shopping"
  | "personal_hygiene"
  | "using_public_transport"
  | "managing_appointments"
  | "basic_first_aid"
  | "understanding_tenancy";

export type AccommodationType =
  | "staying_put"
  | "staying_close"
  | "supported_lodgings"
  | "semi_independent"
  | "independent_tenancy"
  | "shared_housing"
  | "foyer_scheme"
  | "university_accommodation"
  | "not_identified";

export type AccommodationStatus =
  | "confirmed"
  | "in_progress"
  | "identified"
  | "exploring"
  | "not_started";

export type SupportType =
  | "personal_adviser"
  | "mentor"
  | "independent_visitor"
  | "social_worker"
  | "family_contact"
  | "peer_support"
  | "community_group"
  | "education_support"
  | "employment_support"
  | "health_support";

export type SupportStatus =
  | "active"
  | "planned"
  | "referred"
  | "ended"
  | "declined";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface LeavingCareChild {
  id: string;
  name: string;
  dateOfBirth: string;
  age: number;
  placementStartDate: string;
  currentPlacement: boolean;
  isEligibleChild: boolean;       // 16+ with pathway planning duties
  isRelevantChild: boolean;       // left care 16/17 but still entitled
  hasPathwayPlan: boolean;
  keyWorkerId: string;
  keyWorkerName: string;
}

export interface PathwayPlan {
  id: string;
  childId: string;
  status: PathwayPlanStatus;
  createdDate: string;
  lastReviewedDate?: string;
  nextReviewDue: string;
  youngPersonInvolved: boolean;
  youngPersonViewsRecorded: boolean;
  personalAdviserAssigned: boolean;
  goalsSet: number;
  goalsAchieved: number;
  educationPlanIncluded: boolean;
  healthPlanIncluded: boolean;
  financePlanIncluded: boolean;
  accommodationPlanIncluded: boolean;
}

export interface IndependenceSkillAssessment {
  id: string;
  childId: string;
  skill: SkillCategory;
  currentLevel: SkillLevel;
  previousLevel?: SkillLevel;
  assessedDate: string;
  assessedBy: string;
  targetLevel: SkillLevel;
  notes?: string;
}

export interface AccommodationPlan {
  id: string;
  childId: string;
  preferredType: AccommodationType;
  identifiedOption?: AccommodationType;
  status: AccommodationStatus;
  targetMoveDate?: string;
  stayingPutAvailable: boolean;
  stayingCloseAvailable: boolean;
  transitionPlanInPlace: boolean;
  trialStayCompleted: boolean;
  localAreaPreference?: string;
}

export interface SupportArrangement {
  id: string;
  childId: string;
  supportType: SupportType;
  status: SupportStatus;
  providerName: string;
  startDate?: string;
  frequency?: string;
  lastContactDate?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface PathwayPlanningResult {
  score: number;
  maxScore: number;
  totalPlansRequired: number;
  plansInPlace: number;
  plansCurrent: number;
  plansOverdue: number;
  plansDraft: number;
  plansNotStarted: number;
  youngPersonInvolvementRate: number;
  averageGoalAchievementRate: number;
  planCompletenessRate: number;
}

export interface IndependenceSkillsResult {
  score: number;
  maxScore: number;
  totalAssessments: number;
  averageSkillLevel: number;
  skillsAtCompetentOrAbove: number;
  skillsImproving: number;
  skillsStagnant: number;
  skillsNotAssessed: number;
  coverageRate: number;
  progressRate: number;
  categoryBreakdown: SkillCategoryBreakdown[];
}

export interface SkillCategoryBreakdown {
  skill: SkillCategory;
  childCount: number;
  averageLevel: number;
  competentCount: number;
  label: string;
}

export interface AccommodationPlanningResult {
  score: number;
  maxScore: number;
  totalChildrenRequiringPlan: number;
  optionsIdentified: number;
  transitionPlansInPlace: number;
  trialStaysCompleted: number;
  stayingPutAvailable: number;
  stayingCloseAvailable: number;
  notStartedCount: number;
  confirmationRate: number;
}

export interface SupportNetworkResult {
  score: number;
  maxScore: number;
  totalArrangements: number;
  activeArrangements: number;
  personalAdvisersAssigned: number;
  mentorsActive: number;
  communityConnections: number;
  supportTypeCoverage: number;
  averageSupportPerChild: number;
  childrenWithNoSupport: number;
}

export interface ChildLeavingProfile {
  childId: string;
  childName: string;
  age: number;
  hasPathwayPlan: boolean;
  pathwayPlanStatus?: PathwayPlanStatus;
  goalAchievementRate: number;
  independenceSkillLevel: number;
  skillsAssessed: number;
  skillsCompetent: number;
  accommodationStatus?: AccommodationStatus;
  accommodationType?: AccommodationType;
  activeSupportCount: number;
  hasPersonalAdviser: boolean;
  overallReadiness: number;
  readinessLabel: string;
  primaryConcern?: string;
}

export interface LeavingCareIntelligenceResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number;
  rating: Rating;

  pathwayPlanning: PathwayPlanningResult;
  independenceSkills: IndependenceSkillsResult;
  accommodationPlanning: AccommodationPlanningResult;
  supportNetwork: SupportNetworkResult;

  childProfiles: ChildLeavingProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Skill Level Utilities ──────────────────────────────────────────────────

const SKILL_LEVEL_VALUES: Record<SkillLevel, number> = {
  not_assessed: 0,
  emerging: 1,
  developing: 2,
  competent: 3,
  independent: 4,
};

function skillLevelToNumber(level: SkillLevel): number {
  return SKILL_LEVEL_VALUES[level];
}

function isSkillImproving(current: SkillLevel, previous?: SkillLevel): boolean {
  if (!previous) return false;
  return skillLevelToNumber(current) > skillLevelToNumber(previous);
}

// ── All Skill Categories ───────────────────────────────────────────────────

const ALL_SKILL_CATEGORIES: SkillCategory[] = [
  "cooking",
  "budgeting",
  "cleaning",
  "laundry",
  "shopping",
  "personal_hygiene",
  "using_public_transport",
  "managing_appointments",
  "basic_first_aid",
  "understanding_tenancy",
];

// ── All Support Types ──────────────────────────────────────────────────────

const ALL_SUPPORT_TYPES: SupportType[] = [
  "personal_adviser",
  "mentor",
  "independent_visitor",
  "social_worker",
  "family_contact",
  "peer_support",
  "community_group",
  "education_support",
  "employment_support",
  "health_support",
];

// ── Core: Evaluate Pathway Planning (30 pts) ───────────────────────────────

export function evaluatePathwayPlanning(
  children: LeavingCareChild[],
  pathwayPlans: PathwayPlan[],
): PathwayPlanningResult {
  const eligibleChildren = children.filter(
    (c) => c.currentPlacement && c.isEligibleChild,
  );
  const totalRequired = eligibleChildren.length;

  if (totalRequired === 0) {
    return {
      score: 30,
      maxScore: 30,
      totalPlansRequired: 0,
      plansInPlace: 0,
      plansCurrent: 0,
      plansOverdue: 0,
      plansDraft: 0,
      plansNotStarted: 0,
      youngPersonInvolvementRate: 100,
      averageGoalAchievementRate: 100,
      planCompletenessRate: 100,
    };
  }

  const relevantPlans = pathwayPlans.filter((p) =>
    eligibleChildren.some((c) => c.id === p.childId),
  );

  const plansInPlace = relevantPlans.filter(
    (p) => p.status === "current" || p.status === "due_for_review",
  ).length;
  const plansCurrent = relevantPlans.filter(
    (p) => p.status === "current",
  ).length;
  const plansOverdue = relevantPlans.filter(
    (p) => p.status === "overdue",
  ).length;
  const plansDraft = relevantPlans.filter(
    (p) => p.status === "draft",
  ).length;
  const childrenWithPlan = new Set(relevantPlans.map((p) => p.childId));
  const plansNotStarted = totalRequired - childrenWithPlan.size;

  // Young person involvement
  const involvedPlans = relevantPlans.filter((p) => p.youngPersonInvolved);
  const involvementRate =
    relevantPlans.length > 0
      ? Math.round((involvedPlans.length / relevantPlans.length) * 100)
      : 0;

  // Goal achievement
  const goalRates = relevantPlans
    .filter((p) => p.goalsSet > 0)
    .map((p) => (p.goalsAchieved / p.goalsSet) * 100);
  const avgGoalRate =
    goalRates.length > 0
      ? Math.round(goalRates.reduce((sum, r) => sum + r, 0) / goalRates.length)
      : 0;

  // Plan completeness (all 4 sections included)
  const completeCount = relevantPlans.filter(
    (p) =>
      p.educationPlanIncluded &&
      p.healthPlanIncluded &&
      p.financePlanIncluded &&
      p.accommodationPlanIncluded,
  ).length;
  const completenessRate =
    relevantPlans.length > 0
      ? Math.round((completeCount / relevantPlans.length) * 100)
      : 0;

  // Score (max 30)
  let score = 0;

  // Plans in place (max 10)
  const coverageRate = plansInPlace / totalRequired;
  score += coverageRate * 10;

  // Timeliness — no overdue (max 6)
  const overdueRatio = plansOverdue / totalRequired;
  score += Math.max(0, 6 - overdueRatio * 12);

  // Young person involvement (max 6)
  score += (involvementRate / 100) * 6;

  // Goal achievement (max 4)
  score += (avgGoalRate / 100) * 4;

  // Completeness (max 4)
  score += (completenessRate / 100) * 4;

  score = Math.max(0, Math.min(30, Math.round(score)));

  return {
    score,
    maxScore: 30,
    totalPlansRequired: totalRequired,
    plansInPlace,
    plansCurrent,
    plansOverdue,
    plansDraft,
    plansNotStarted,
    youngPersonInvolvementRate: involvementRate,
    averageGoalAchievementRate: avgGoalRate,
    planCompletenessRate: completenessRate,
  };
}

// ── Core: Evaluate Independence Skills (25 pts) ────────────────────────────

export function evaluateIndependenceSkills(
  children: LeavingCareChild[],
  assessments: IndependenceSkillAssessment[],
): IndependenceSkillsResult {
  const activeChildren = children.filter((c) => c.currentPlacement);

  if (activeChildren.length === 0) {
    return {
      score: 25,
      maxScore: 25,
      totalAssessments: 0,
      averageSkillLevel: 0,
      skillsAtCompetentOrAbove: 0,
      skillsImproving: 0,
      skillsStagnant: 0,
      skillsNotAssessed: 0,
      coverageRate: 100,
      progressRate: 100,
      categoryBreakdown: [],
    };
  }

  const relevantAssessments = assessments.filter((a) =>
    activeChildren.some((c) => c.id === a.childId),
  );

  const totalPossible = activeChildren.length * ALL_SKILL_CATEGORIES.length;
  const assessed = relevantAssessments.filter(
    (a) => a.currentLevel !== "not_assessed",
  );
  const notAssessed = relevantAssessments.filter(
    (a) => a.currentLevel === "not_assessed",
  ).length;

  // Unique child-skill combos assessed (not_assessed excluded)
  const assessedPairs = new Set(
    assessed.map((a) => `${a.childId}:${a.skill}`),
  );
  const coverageRate =
    totalPossible > 0
      ? Math.round((assessedPairs.size / totalPossible) * 100)
      : 0;

  // Average skill level (over assessed only)
  const levelValues = assessed.map((a) => skillLevelToNumber(a.currentLevel));
  const avgLevel =
    levelValues.length > 0
      ? Math.round(
          (levelValues.reduce((s, v) => s + v, 0) / levelValues.length) * 100,
        ) / 100
      : 0;

  // Competent or above
  const competentOrAbove = assessed.filter(
    (a) => a.currentLevel === "competent" || a.currentLevel === "independent",
  ).length;

  // Improving (has previous level AND improved)
  const improving = relevantAssessments.filter(
    (a) =>
      a.previousLevel && isSkillImproving(a.currentLevel, a.previousLevel),
  ).length;

  // Stagnant (has previous level, no improvement, not yet competent/independent)
  const stagnant = relevantAssessments.filter(
    (a) =>
      a.previousLevel &&
      !isSkillImproving(a.currentLevel, a.previousLevel) &&
      a.currentLevel !== "competent" &&
      a.currentLevel !== "independent",
  ).length;

  const withPrevious = relevantAssessments.filter(
    (a) => a.previousLevel,
  ).length;
  const progressRate =
    withPrevious > 0 ? Math.round((improving / withPrevious) * 100) : 0;

  // Category breakdown
  const categoryBreakdown: SkillCategoryBreakdown[] = ALL_SKILL_CATEGORIES.map(
    (skill) => {
      const skillAssessments = relevantAssessments.filter(
        (a) => a.skill === skill && a.currentLevel !== "not_assessed",
      );
      const levels = skillAssessments.map((a) =>
        skillLevelToNumber(a.currentLevel),
      );
      const avg =
        levels.length > 0
          ? Math.round(
              (levels.reduce((s, v) => s + v, 0) / levels.length) * 100,
            ) / 100
          : 0;
      const competent = skillAssessments.filter(
        (a) =>
          a.currentLevel === "competent" || a.currentLevel === "independent",
      ).length;

      return {
        skill,
        childCount: skillAssessments.length,
        averageLevel: avg,
        competentCount: competent,
        label: getSkillCategoryLabel(skill),
      };
    },
  );

  // Score (max 25)
  let score = 0;

  // Coverage (max 8)
  score += (coverageRate / 100) * 8;

  // Average skill level (max 7) — normalized to 0-4 scale
  score += (avgLevel / 4) * 7;

  // Progress rate (max 5)
  score += (progressRate / 100) * 5;

  // Competent ratio (max 5)
  const competentRatio =
    assessed.length > 0 ? competentOrAbove / assessed.length : 0;
  score += competentRatio * 5;

  score = Math.max(0, Math.min(25, Math.round(score)));

  return {
    score,
    maxScore: 25,
    totalAssessments: relevantAssessments.length,
    averageSkillLevel: avgLevel,
    skillsAtCompetentOrAbove: competentOrAbove,
    skillsImproving: improving,
    skillsStagnant: stagnant,
    skillsNotAssessed: notAssessed,
    coverageRate,
    progressRate,
    categoryBreakdown,
  };
}

// ── Core: Evaluate Accommodation Planning (25 pts) ─────────────────────────

export function evaluateAccommodationPlanning(
  children: LeavingCareChild[],
  accommodationPlans: AccommodationPlan[],
): AccommodationPlanningResult {
  const eligibleChildren = children.filter(
    (c) => c.currentPlacement && c.isEligibleChild,
  );
  const totalRequired = eligibleChildren.length;

  if (totalRequired === 0) {
    return {
      score: 25,
      maxScore: 25,
      totalChildrenRequiringPlan: 0,
      optionsIdentified: 0,
      transitionPlansInPlace: 0,
      trialStaysCompleted: 0,
      stayingPutAvailable: 0,
      stayingCloseAvailable: 0,
      notStartedCount: 0,
      confirmationRate: 100,
    };
  }

  const relevantPlans = accommodationPlans.filter((p) =>
    eligibleChildren.some((c) => c.id === p.childId),
  );

  const optionsIdentified = relevantPlans.filter(
    (p) => p.identifiedOption && p.identifiedOption !== "not_identified",
  ).length;
  const transitionPlans = relevantPlans.filter(
    (p) => p.transitionPlanInPlace,
  ).length;
  const trialStays = relevantPlans.filter(
    (p) => p.trialStayCompleted,
  ).length;
  const stayingPut = relevantPlans.filter(
    (p) => p.stayingPutAvailable,
  ).length;
  const stayingClose = relevantPlans.filter(
    (p) => p.stayingCloseAvailable,
  ).length;
  const notStarted = relevantPlans.filter(
    (p) => p.status === "not_started",
  ).length;
  const confirmed = relevantPlans.filter(
    (p) => p.status === "confirmed",
  ).length;
  const confirmationRate = Math.round((confirmed / totalRequired) * 100);

  // Score (max 25)
  let score = 0;

  // Options identified (max 8)
  const identifiedRate = optionsIdentified / totalRequired;
  score += identifiedRate * 8;

  // Transition plans (max 6)
  const transitionRate = transitionPlans / totalRequired;
  score += transitionRate * 6;

  // Staying put/close availability (max 4)
  const stayingOptions = (stayingPut + stayingClose) / (totalRequired * 2);
  score += stayingOptions * 4;

  // Trial stays (max 4)
  const trialRate = trialStays / totalRequired;
  score += trialRate * 4;

  // No unstarted penalty (max 3)
  const notStartedRate = notStarted / totalRequired;
  score += Math.max(0, 3 - notStartedRate * 6);

  score = Math.max(0, Math.min(25, Math.round(score)));

  return {
    score,
    maxScore: 25,
    totalChildrenRequiringPlan: totalRequired,
    optionsIdentified,
    transitionPlansInPlace: transitionPlans,
    trialStaysCompleted: trialStays,
    stayingPutAvailable: stayingPut,
    stayingCloseAvailable: stayingClose,
    notStartedCount: notStarted,
    confirmationRate,
  };
}

// ── Core: Evaluate Support Network (20 pts) ────────────────────────────────

export function evaluateSupportNetwork(
  children: LeavingCareChild[],
  supportArrangements: SupportArrangement[],
): SupportNetworkResult {
  const eligibleChildren = children.filter(
    (c) => c.currentPlacement && c.isEligibleChild,
  );

  if (eligibleChildren.length === 0) {
    return {
      score: 20,
      maxScore: 20,
      totalArrangements: 0,
      activeArrangements: 0,
      personalAdvisersAssigned: 0,
      mentorsActive: 0,
      communityConnections: 0,
      supportTypeCoverage: 100,
      averageSupportPerChild: 0,
      childrenWithNoSupport: 0,
    };
  }

  const relevantArrangements = supportArrangements.filter((s) =>
    eligibleChildren.some((c) => c.id === s.childId),
  );

  const active = relevantArrangements.filter(
    (s) => s.status === "active",
  );
  const personalAdvisers = active.filter(
    (s) => s.supportType === "personal_adviser",
  );
  const mentors = active.filter((s) => s.supportType === "mentor");
  const communityConnections = active.filter(
    (s) =>
      s.supportType === "community_group" || s.supportType === "peer_support",
  );

  // Support type coverage
  const activeTypes = new Set(active.map((s) => s.supportType));
  const typeCoverage = Math.round(
    (activeTypes.size / ALL_SUPPORT_TYPES.length) * 100,
  );

  // Per-child support
  const childSupportCounts = eligibleChildren.map(
    (c) => active.filter((s) => s.childId === c.id).length,
  );
  const avgSupport =
    childSupportCounts.length > 0
      ? Math.round(
          (childSupportCounts.reduce((s, v) => s + v, 0) /
            childSupportCounts.length) *
            100,
        ) / 100
      : 0;
  const noSupport = childSupportCounts.filter((c) => c === 0).length;

  // Unique children with PAs
  const childrenWithPA = new Set(
    personalAdvisers.map((s) => s.childId),
  ).size;

  // Unique children with mentors
  const childrenWithMentor = new Set(mentors.map((s) => s.childId)).size;

  // Score (max 20)
  let score = 0;

  // Personal advisers assigned (max 6)
  const paRate = childrenWithPA / eligibleChildren.length;
  score += paRate * 6;

  // Active support breadth (max 5)
  score += (typeCoverage / 100) * 5;

  // Average support per child (max 4) — target 3+
  const supportRatio = Math.min(1, avgSupport / 3);
  score += supportRatio * 4;

  // Mentoring (max 3)
  const mentorRate = childrenWithMentor / eligibleChildren.length;
  score += mentorRate * 3;

  // No children without support (max 2)
  if (noSupport === 0) {
    score += 2;
  } else {
    const unsupportedRate = noSupport / eligibleChildren.length;
    score += Math.max(0, 2 - unsupportedRate * 4);
  }

  score = Math.max(0, Math.min(20, Math.round(score)));

  return {
    score,
    maxScore: 20,
    totalArrangements: relevantArrangements.length,
    activeArrangements: active.length,
    personalAdvisersAssigned: childrenWithPA,
    mentorsActive: childrenWithMentor,
    communityConnections: communityConnections.length,
    supportTypeCoverage: typeCoverage,
    averageSupportPerChild: avgSupport,
    childrenWithNoSupport: noSupport,
  };
}

// ── Build Child Leaving Profiles ───────────────────────────────────────────

export function buildChildLeavingProfiles(
  children: LeavingCareChild[],
  pathwayPlans: PathwayPlan[],
  assessments: IndependenceSkillAssessment[],
  accommodationPlans: AccommodationPlan[],
  supportArrangements: SupportArrangement[],
): ChildLeavingProfile[] {
  const activeChildren = children.filter((c) => c.currentPlacement);

  return activeChildren.map((child) => {
    const plan = pathwayPlans.find((p) => p.childId === child.id);
    const childAssessments = assessments.filter(
      (a) => a.childId === child.id && a.currentLevel !== "not_assessed",
    );
    const accomPlan = accommodationPlans.find((p) => p.childId === child.id);
    const support = supportArrangements.filter(
      (s) => s.childId === child.id && s.status === "active",
    );

    // Goal achievement
    const goalRate =
      plan && plan.goalsSet > 0
        ? Math.round((plan.goalsAchieved / plan.goalsSet) * 100)
        : 0;

    // Average skill level (0-100 scale based on 0-4)
    const levels = childAssessments.map((a) =>
      skillLevelToNumber(a.currentLevel),
    );
    const avgSkillLevel =
      levels.length > 0
        ? Math.round(
            (levels.reduce((s, v) => s + v, 0) / levels.length / 4) * 100,
          )
        : 0;

    const competentCount = childAssessments.filter(
      (a) =>
        a.currentLevel === "competent" || a.currentLevel === "independent",
    ).length;

    const hasPA = support.some((s) => s.supportType === "personal_adviser");

    // Overall readiness (weighted)
    let readiness = 0;
    if (child.isEligibleChild) {
      // Pathway plan contribution (30%)
      const planScore = plan
        ? plan.status === "current"
          ? 30
          : plan.status === "due_for_review"
            ? 20
            : 5
        : 0;
      readiness += (planScore / 30) * 30;

      // Independence skills (25%)
      readiness += avgSkillLevel * 0.25;

      // Accommodation (25%)
      const accomScore = accomPlan
        ? accomPlan.status === "confirmed"
          ? 25
          : accomPlan.status === "in_progress"
            ? 18
            : accomPlan.status === "identified"
              ? 12
              : accomPlan.status === "exploring"
                ? 6
                : 0
        : 0;
      readiness += accomScore;

      // Support (20%)
      const supportScore = Math.min(20, support.length * 5) + (hasPA ? 5 : 0);
      readiness += Math.min(20, supportScore);
    } else {
      // Non-eligible: simpler calculation based on skills and support
      readiness += avgSkillLevel * 0.6;
      readiness += Math.min(40, support.length * 10);
    }
    readiness = Math.max(0, Math.min(100, Math.round(readiness)));

    const readinessLabel = getReadinessLabel(readiness);

    // Primary concern
    let primaryConcern: string | undefined;
    if (child.isEligibleChild && !plan) {
      primaryConcern =
        "No pathway plan in place — statutory requirement not met";
    } else if (plan && plan.status === "overdue") {
      primaryConcern =
        "Pathway plan overdue for review — young person's plan not current";
    } else if (child.isEligibleChild && !hasPA) {
      primaryConcern =
        "No personal adviser assigned — statutory entitlement not met";
    } else if (
      child.isEligibleChild &&
      accomPlan &&
      accomPlan.status === "not_started"
    ) {
      primaryConcern =
        "Accommodation planning not started — risk of unplanned move";
    } else if (childAssessments.length === 0 && child.isEligibleChild) {
      primaryConcern =
        "No independence skills assessed — preparation for leaving care not evidenced";
    }

    return {
      childId: child.id,
      childName: child.name,
      age: child.age,
      hasPathwayPlan: !!plan,
      pathwayPlanStatus: plan?.status,
      goalAchievementRate: goalRate,
      independenceSkillLevel: avgSkillLevel,
      skillsAssessed: childAssessments.length,
      skillsCompetent: competentCount,
      accommodationStatus: accomPlan?.status,
      accommodationType:
        accomPlan?.identifiedOption ?? accomPlan?.preferredType,
      activeSupportCount: support.length,
      hasPersonalAdviser: hasPA,
      overallReadiness: readiness,
      readinessLabel,
      primaryConcern,
    };
  });
}

// ── Main: Generate Leaving Care Intelligence ───────────────────────────────

export function generateLeavingCareIntelligence(
  children: LeavingCareChild[],
  pathwayPlans: PathwayPlan[],
  assessments: IndependenceSkillAssessment[],
  accommodationPlans: AccommodationPlan[],
  supportArrangements: SupportArrangement[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): LeavingCareIntelligenceResult {
  const assessedAt = new Date().toISOString();

  const pathwayPlanning = evaluatePathwayPlanning(children, pathwayPlans);
  const independenceSkills = evaluateIndependenceSkills(children, assessments);
  const accommodationPlanning = evaluateAccommodationPlanning(
    children,
    accommodationPlans,
  );
  const supportNetwork = evaluateSupportNetwork(children, supportArrangements);

  const overallScore = Math.max(
    0,
    Math.min(
      100,
      pathwayPlanning.score +
        independenceSkills.score +
        accommodationPlanning.score +
        supportNetwork.score,
    ),
  );
  const rating = getRating(overallScore);

  const childProfiles = buildChildLeavingProfiles(
    children,
    pathwayPlans,
    assessments,
    accommodationPlans,
    supportArrangements,
  );

  const strengths = generateStrengths(
    pathwayPlanning,
    independenceSkills,
    accommodationPlanning,
    supportNetwork,
    childProfiles,
  );
  const areasForImprovement = generateAreasForImprovement(
    pathwayPlanning,
    independenceSkills,
    accommodationPlanning,
    supportNetwork,
    childProfiles,
  );
  const actions = generateActions(
    pathwayPlanning,
    independenceSkills,
    accommodationPlanning,
    supportNetwork,
    childProfiles,
  );
  const regulatoryLinks = generateRegulatoryLinks(
    pathwayPlanning,
    accommodationPlanning,
    supportNetwork,
    children,
  );

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    pathwayPlanning,
    independenceSkills,
    accommodationPlanning,
    supportNetwork,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Rating ─────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

export function getReadinessLabel(readiness: number): string {
  if (readiness >= 80) return "Well Prepared";
  if (readiness >= 60) return "On Track";
  if (readiness >= 40) return "Developing";
  if (readiness >= 20) return "Early Stages";
  return "Not Started";
}

// ── Label Functions ────────────────────────────────────────────────────────

export function getSkillCategoryLabel(skill: SkillCategory): string {
  const labels: Record<SkillCategory, string> = {
    cooking: "Cooking & Meal Preparation",
    budgeting: "Budgeting & Money Management",
    cleaning: "Cleaning & Home Maintenance",
    laundry: "Laundry",
    shopping: "Shopping & Groceries",
    personal_hygiene: "Personal Hygiene",
    using_public_transport: "Using Public Transport",
    managing_appointments: "Managing Appointments",
    basic_first_aid: "Basic First Aid",
    understanding_tenancy: "Understanding Tenancy",
  };
  return labels[skill];
}

export function getSkillLevelLabel(level: SkillLevel): string {
  const labels: Record<SkillLevel, string> = {
    not_assessed: "Not Assessed",
    emerging: "Emerging",
    developing: "Developing",
    competent: "Competent",
    independent: "Independent",
  };
  return labels[level];
}

export function getPathwayPlanStatusLabel(
  status: PathwayPlanStatus,
): string {
  const labels: Record<PathwayPlanStatus, string> = {
    current: "Current",
    due_for_review: "Due for Review",
    overdue: "Overdue",
    not_started: "Not Started",
    draft: "Draft",
  };
  return labels[status];
}

export function getAccommodationTypeLabel(
  type: AccommodationType,
): string {
  const labels: Record<AccommodationType, string> = {
    staying_put: "Staying Put",
    staying_close: "Staying Close",
    supported_lodgings: "Supported Lodgings",
    semi_independent: "Semi-Independent",
    independent_tenancy: "Independent Tenancy",
    shared_housing: "Shared Housing",
    foyer_scheme: "Foyer Scheme",
    university_accommodation: "University Accommodation",
    not_identified: "Not Identified",
  };
  return labels[type];
}

export function getAccommodationStatusLabel(
  status: AccommodationStatus,
): string {
  const labels: Record<AccommodationStatus, string> = {
    confirmed: "Confirmed",
    in_progress: "In Progress",
    identified: "Identified",
    exploring: "Exploring",
    not_started: "Not Started",
  };
  return labels[status];
}

export function getSupportTypeLabel(type: SupportType): string {
  const labels: Record<SupportType, string> = {
    personal_adviser: "Personal Adviser",
    mentor: "Mentor",
    independent_visitor: "Independent Visitor",
    social_worker: "Social Worker",
    family_contact: "Family Contact",
    peer_support: "Peer Support",
    community_group: "Community Group",
    education_support: "Education Support",
    employment_support: "Employment Support",
    health_support: "Health Support",
  };
  return labels[type];
}

export function getSupportStatusLabel(status: SupportStatus): string {
  const labels: Record<SupportStatus, string> = {
    active: "Active",
    planned: "Planned",
    referred: "Referred",
    ended: "Ended",
    declined: "Declined",
  };
  return labels[status];
}

// ── Insight: Strengths ─────────────────────────────────────────────────────

function generateStrengths(
  pathway: PathwayPlanningResult,
  skills: IndependenceSkillsResult,
  accommodation: AccommodationPlanningResult,
  support: SupportNetworkResult,
  profiles: ChildLeavingProfile[],
): string[] {
  const strengths: string[] = [];

  if (
    pathway.totalPlansRequired > 0 &&
    pathway.plansOverdue === 0 &&
    pathway.plansNotStarted === 0
  ) {
    strengths.push(
      "All eligible young people have current pathway plans in place — statutory duties met",
    );
  }
  if (pathway.youngPersonInvolvementRate >= 90) {
    strengths.push(
      "Excellent young person involvement in pathway planning — their voice is central to the process",
    );
  }
  if (pathway.averageGoalAchievementRate >= 75) {
    strengths.push(
      "Strong goal achievement rate in pathway plans — young people are making good progress toward their aspirations",
    );
  }
  if (skills.coverageRate >= 80) {
    strengths.push(
      "Independence skills assessment coverage is comprehensive — all key areas are being tracked",
    );
  }
  if (skills.progressRate >= 70) {
    strengths.push(
      "Good progress in independence skills development — young people are building practical life skills",
    );
  }
  if (skills.averageSkillLevel >= 3) {
    strengths.push(
      "Average skill level is at or above competent — young people are developing real independence",
    );
  }
  if (
    accommodation.totalChildrenRequiringPlan > 0 &&
    accommodation.notStartedCount === 0
  ) {
    strengths.push(
      "All eligible young people have accommodation planning underway — no gaps in transition planning",
    );
  }
  if (accommodation.confirmationRate >= 50) {
    strengths.push(
      "Over half of accommodation arrangements are confirmed — providing security and certainty for young people",
    );
  }
  if (
    accommodation.stayingPutAvailable > 0 ||
    accommodation.stayingCloseAvailable > 0
  ) {
    strengths.push(
      "Staying put/staying close arrangements are available — continuity of care is supported",
    );
  }
  if (support.childrenWithNoSupport === 0 && support.totalArrangements > 0) {
    strengths.push(
      "All eligible young people have active support arrangements — no one is leaving care without a network",
    );
  }
  if (support.personalAdvisersAssigned > 0 && support.totalArrangements > 0) {
    strengths.push(
      "Personal advisers are assigned — fulfilling the statutory duty for eligible care leavers",
    );
  }
  if (support.mentorsActive > 0) {
    strengths.push(
      "Mentoring relationships are active — providing additional positive role models",
    );
  }
  if (profiles.length > 0 && profiles.every((p) => !p.primaryConcern)) {
    strengths.push(
      "No primary concerns identified for any young person — leaving care preparation is consistent across the home",
    );
  }

  return strengths;
}

// ── Insight: Areas for Improvement ─────────────────────────────────────────

function generateAreasForImprovement(
  pathway: PathwayPlanningResult,
  skills: IndependenceSkillsResult,
  accommodation: AccommodationPlanningResult,
  support: SupportNetworkResult,
  profiles: ChildLeavingProfile[],
): string[] {
  const areas: string[] = [];

  if (pathway.plansOverdue > 0) {
    areas.push(
      `${pathway.plansOverdue} pathway plan(s) overdue for review — young people's plans are not current`,
    );
  }
  if (pathway.plansNotStarted > 0) {
    areas.push(
      `${pathway.plansNotStarted} eligible young person(s) without a pathway plan — statutory requirement not met`,
    );
  }
  if (
    pathway.youngPersonInvolvementRate < 75 &&
    pathway.totalPlansRequired > 0
  ) {
    areas.push(
      `Young person involvement in pathway planning is ${pathway.youngPersonInvolvementRate}% — review how young people participate in their plans`,
    );
  }
  if (pathway.planCompletenessRate < 80 && pathway.totalPlansRequired > 0) {
    areas.push(
      `Only ${pathway.planCompletenessRate}% of pathway plans include all required sections — ensure education, health, finance, and accommodation are all addressed`,
    );
  }
  if (skills.coverageRate < 60) {
    areas.push(
      `Independence skills assessment coverage is only ${skills.coverageRate}% — expand assessment to cover all key life skill areas`,
    );
  }
  if (skills.skillsStagnant > 0) {
    areas.push(
      `${skills.skillsStagnant} skill assessment(s) show no progress — review teaching approaches and support`,
    );
  }
  if (skills.averageSkillLevel < 2 && skills.totalAssessments > 0) {
    areas.push(
      "Average independence skill level is below developing — intensify life skills teaching programme",
    );
  }
  if (accommodation.notStartedCount > 0) {
    areas.push(
      `${accommodation.notStartedCount} young person(s) have no accommodation planning started — risk of unplanned transition`,
    );
  }
  if (
    accommodation.transitionPlansInPlace === 0 &&
    accommodation.totalChildrenRequiringPlan > 0
  ) {
    areas.push(
      "No transition plans in place — young people need structured support for the move to independence",
    );
  }
  if (support.childrenWithNoSupport > 0) {
    areas.push(
      `${support.childrenWithNoSupport} young person(s) have no active support arrangements — urgent gap in leaving care provision`,
    );
  }
  if (support.supportTypeCoverage < 40) {
    areas.push(
      `Support type coverage is only ${support.supportTypeCoverage}% — broaden the range of support available`,
    );
  }

  const concernedProfiles = profiles.filter((p) => p.primaryConcern);
  for (const profile of concernedProfiles) {
    areas.push(`${profile.childName}: ${profile.primaryConcern}`);
  }

  return areas;
}

// ── Insight: Actions ───────────────────────────────────────────────────────

function generateActions(
  pathway: PathwayPlanningResult,
  skills: IndependenceSkillsResult,
  accommodation: AccommodationPlanningResult,
  support: SupportNetworkResult,
  profiles: ChildLeavingProfile[],
): string[] {
  const result: string[] = [];

  if (pathway.plansNotStarted > 0) {
    result.push(
      `URGENT: ${pathway.plansNotStarted} eligible young person(s) require a pathway plan. Initiate within 10 working days to meet statutory duty under CA 1989 s23C.`,
    );
  }
  if (pathway.plansOverdue > 0) {
    result.push(
      `URGENT: ${pathway.plansOverdue} pathway plan(s) overdue for review. Schedule review meetings within 5 working days.`,
    );
  }
  if (support.childrenWithNoSupport > 0) {
    result.push(
      `HIGH: ${support.childrenWithNoSupport} young person(s) have no active support. Assign personal adviser and arrange support network meeting.`,
    );
  }
  if (accommodation.notStartedCount > 0) {
    result.push(
      `HIGH: ${accommodation.notStartedCount} young person(s) need accommodation planning started. Convene planning meeting with young person and allocated worker.`,
    );
  }

  // Check for eligible profiles without a personal adviser
  const profilesWithoutPA = profiles.filter(
    (p) => p.age >= 16 && !p.hasPersonalAdviser && p.hasPathwayPlan,
  );
  for (const p of profilesWithoutPA) {
    result.push(
      `HIGH: ${p.childName} has no personal adviser assigned — request allocation from leaving care team.`,
    );
  }

  if (skills.coverageRate < 50) {
    result.push(
      "MEDIUM: Independence skills coverage below 50%. Schedule comprehensive life skills assessment for all young people within 4 weeks.",
    );
  }
  if (skills.skillsStagnant > 2) {
    result.push(
      `MEDIUM: ${skills.skillsStagnant} skill areas showing no progress. Review individual teaching plans and consider specialist support.`,
    );
  }
  if (
    accommodation.transitionPlansInPlace === 0 &&
    accommodation.totalChildrenRequiringPlan > 0
  ) {
    result.push(
      "MEDIUM: No transition plans in place. Develop individualised transition plans with each young person within 6 weeks.",
    );
  }

  if (result.length === 0) {
    result.push(
      "No immediate actions required. Leaving care preparation is progressing well across all domains.",
    );
  }

  return result;
}

// ── Insight: Regulatory Links ──────────────────────────────────────────────

function generateRegulatoryLinks(
  pathway: PathwayPlanningResult,
  accommodation: AccommodationPlanningResult,
  support: SupportNetworkResult,
  children: LeavingCareChild[],
): string[] {
  const links = new Set<string>();

  // Always applicable
  links.add("CHR 2015, Reg 14 — Preparation for ceasing to be looked after");
  links.add("SCCIF: Experiences and progress — Preparation for adulthood");

  const hasEligible = children.some(
    (c) => c.currentPlacement && c.isEligibleChild,
  );

  if (hasEligible) {
    links.add(
      "Children Act 1989, s23C — Continuing functions in respect of former relevant children",
    );
    links.add(
      "Children Act 1989, s24 — Persons qualifying for advice and assistance",
    );
    links.add("Children (Leaving Care) Act 2000 — Duties to care leavers");
  }

  if (pathway.plansOverdue > 0 || pathway.plansNotStarted > 0) {
    links.add(
      "CHR 2015, Reg 7 — Children's plans including pathway plans",
    );
  }

  if (
    accommodation.notStartedCount > 0 ||
    accommodation.totalChildrenRequiringPlan > 0
  ) {
    links.add(
      "Children Act 1989, s23C(4) — Accommodation and maintenance for former relevant children",
    );
  }

  if (support.childrenWithNoSupport > 0) {
    links.add(
      "Children (Leaving Care) Act 2000 — Personal adviser duty",
    );
  }

  return [...links];
}
