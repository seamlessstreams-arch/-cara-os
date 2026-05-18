// ══════════════════════════════════════════════════════════════════════════════
// TRANSITION & PATHWAY PLANNING INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating transition readiness, independence
// skills, placement stability, and pathway planning quality for children in
// residential care — ensuring every child has a clear, well-supported plan
// for their future.
//
// Regulatory basis:
//   - CHR 2015, Reg 14 — Children's care plans (including pathway plans)
//   - CHR 2015, Reg 5  — Statement of purpose (quality of care)
//   - SCCIF Quality of Care — preparation for adulthood
//   - Working Together 2023 — multi-agency collaboration
//   - UNCRC Article 12 — Child's right to be heard in planning
//   - Children Act 1989, s23C/D — Pathway planning duties
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type TransitionType =
  | "leaving_care"
  | "placement_move"
  | "step_down"
  | "step_up"
  | "independence"
  | "education_transition"
  | "family_reunification"
  | "supported_living";

export type PlanStatus =
  | "draft"
  | "active"
  | "reviewed"
  | "completed"
  | "overdue";

export type SkillCategory =
  | "cooking"
  | "budgeting"
  | "hygiene"
  | "laundry"
  | "travel"
  | "appointments"
  | "communication"
  | "employment"
  | "tenancy"
  | "emotional_regulation"
  | "social_skills"
  | "digital_literacy";

export type ConfidenceLevel =
  | "not_started"
  | "emerging"
  | "developing"
  | "competent"
  | "independent";

export type GoalStatus =
  | "not_started"
  | "in_progress"
  | "achieved"
  | "deferred";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface TransitionGoal {
  id: string;
  description: string;
  category: SkillCategory;
  targetDate: string;
  status: GoalStatus;
  evidence?: string;
}

export interface TransitionPlan {
  id: string;
  childId: string;
  childName: string;
  transitionType: TransitionType;
  targetDate: string;
  planCreatedDate: string;
  lastReviewDate: string;
  nextReviewDate: string;
  status: PlanStatus;
  keyWorker: string;
  socialWorkerInvolved: boolean;
  childVoiceRecorded: boolean;
  familyInvolved: boolean;
  multiAgencyInvolved: boolean;
  goals: TransitionGoal[];
}

export interface SkillRating {
  category: SkillCategory;
  confidence: ConfidenceLevel;
  notes?: string;
}

export interface IndependenceSkillAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessedBy: string;
  skills: SkillRating[];
}

export interface PlacementStabilityRecord {
  childId: string;
  childName: string;
  placementStartDate: string;
  previousPlacements: number;
  plannedEndDate?: string;
  disruptionRisks: string[];
  stabilityFactors: string[];
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface TransitionPlanningResult {
  planCurrencyRate: number;
  childVoiceRate: number;
  multiAgencyRate: number;
  overduePlans: number;
  goalAchievementRate: number;
  totalPlans: number;
  activePlans: number;
  reviewedPlans: number;
  completedPlans: number;
  draftPlans: number;
  familyInvolvementRate: number;
  socialWorkerRate: number;
}

export interface SkillProfile {
  childId: string;
  childName: string;
  averageConfidence: number;
  skillGaps: SkillCategory[];
  strongSkills: SkillCategory[];
  assessmentCount: number;
  latestAssessmentDate: string;
  skillBreakdown: SkillRating[];
}

export interface IndependenceSkillsResult {
  profiles: SkillProfile[];
  overallAverageConfidence: number;
  skillGaps: SkillCategory[];
  strongestSkills: SkillCategory[];
  categoryAverages: { category: SkillCategory; average: number }[];
}

export interface PlacementStabilityResult {
  averagePreviousPlacements: number;
  totalDisruptionRisks: number;
  totalStabilityFactors: number;
  childrenWithHighRisk: number;
  childrenStable: number;
  averageDisruptionRisks: number;
}

export interface GoalProgressResult {
  totalGoals: number;
  achieved: number;
  inProgress: number;
  notStarted: number;
  deferred: number;
  achievementRate: number;
  categoryBreakdown: { category: SkillCategory; total: number; achieved: number; rate: number }[];
  deferredGoals: TransitionGoal[];
  goalsNearingDeadline: TransitionGoal[];
}

export interface ChildTransitionProfile {
  childId: string;
  childName: string;
  planStatus: PlanStatus | "no_plan";
  transitionType: TransitionType | "none";
  targetDate: string | null;
  skillReadinessScore: number;
  skillGaps: SkillCategory[];
  goalAchievementRate: number;
  placementStability: "stable" | "at_risk" | "high_risk" | "unknown";
  previousPlacements: number;
  childVoiceRecorded: boolean;
  primaryConcern?: string;
}

export interface TransitionPlanningIntelligenceResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";

  planningQuality: TransitionPlanningResult;
  independenceReadiness: IndependenceSkillsResult;
  goalProgress: GoalProgressResult;
  placementStability: PlacementStabilityResult;

  childProfiles: ChildTransitionProfile[];

  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Confidence Level Scoring ──────────────────────────────────────────────

const CONFIDENCE_SCORES: Record<ConfidenceLevel, number> = {
  not_started: 0,
  emerging: 1,
  developing: 2,
  competent: 3,
  independent: 4,
};

function confidenceToScore(level: ConfidenceLevel): number {
  return CONFIDENCE_SCORES[level];
}

// ── Label Helpers ─────────────────────────────────────────────────────────

export function getTransitionTypeLabel(type: TransitionType): string {
  const labels: Record<TransitionType, string> = {
    leaving_care: "Leaving Care",
    placement_move: "Placement Move",
    step_down: "Step Down",
    step_up: "Step Up",
    independence: "Independence",
    education_transition: "Education Transition",
    family_reunification: "Family Reunification",
    supported_living: "Supported Living",
  };
  return labels[type];
}

export function getPlanStatusLabel(status: PlanStatus): string {
  const labels: Record<PlanStatus, string> = {
    draft: "Draft",
    active: "Active",
    reviewed: "Reviewed",
    completed: "Completed",
    overdue: "Overdue",
  };
  return labels[status];
}

export function getSkillCategoryLabel(category: SkillCategory): string {
  const labels: Record<SkillCategory, string> = {
    cooking: "Cooking & Meal Preparation",
    budgeting: "Budgeting & Money Management",
    hygiene: "Personal Hygiene",
    laundry: "Laundry & Clothing Care",
    travel: "Independent Travel",
    appointments: "Managing Appointments",
    communication: "Communication Skills",
    employment: "Employment Readiness",
    tenancy: "Tenancy Management",
    emotional_regulation: "Emotional Regulation",
    social_skills: "Social Skills",
    digital_literacy: "Digital Literacy",
  };
  return labels[category];
}

export function getConfidenceLevelLabel(level: ConfidenceLevel): string {
  const labels: Record<ConfidenceLevel, string> = {
    not_started: "Not Started",
    emerging: "Emerging",
    developing: "Developing",
    competent: "Competent",
    independent: "Independent",
  };
  return labels[level];
}

// ── Core: Evaluate Transition Planning ────────────────────────────────────

export function evaluateTransitionPlanning(
  plans: TransitionPlan[],
  referenceDate: string,
): TransitionPlanningResult {
  if (plans.length === 0) {
    return {
      planCurrencyRate: 0,
      childVoiceRate: 0,
      multiAgencyRate: 0,
      overduePlans: 0,
      goalAchievementRate: 0,
      totalPlans: 0,
      activePlans: 0,
      reviewedPlans: 0,
      completedPlans: 0,
      draftPlans: 0,
      familyInvolvementRate: 0,
      socialWorkerRate: 0,
    };
  }

  const refDate = new Date(referenceDate);
  const threeMonthsAgo = new Date(refDate);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoStr = threeMonthsAgo.toISOString().split("T")[0];

  // Plan currency: reviewed within last 3 months
  const currentPlans = plans.filter(
    (p) => p.lastReviewDate >= threeMonthsAgoStr,
  );
  const planCurrencyRate = Math.round((currentPlans.length / plans.length) * 100);

  // Child voice
  const withVoice = plans.filter((p) => p.childVoiceRecorded);
  const childVoiceRate = Math.round((withVoice.length / plans.length) * 100);

  // Multi-agency
  const withMultiAgency = plans.filter((p) => p.multiAgencyInvolved);
  const multiAgencyRate = Math.round((withMultiAgency.length / plans.length) * 100);

  // Overdue plans
  const overduePlans = plans.filter((p) => p.status === "overdue").length;

  // Goal achievement
  const allGoals = plans.flatMap((p) => p.goals);
  const achievedGoals = allGoals.filter((g) => g.status === "achieved");
  const goalAchievementRate = allGoals.length > 0
    ? Math.round((achievedGoals.length / allGoals.length) * 100)
    : 0;

  // Status counts
  const activePlans = plans.filter((p) => p.status === "active").length;
  const reviewedPlans = plans.filter((p) => p.status === "reviewed").length;
  const completedPlans = plans.filter((p) => p.status === "completed").length;
  const draftPlans = plans.filter((p) => p.status === "draft").length;

  // Family involvement
  const familyInvolved = plans.filter((p) => p.familyInvolved);
  const familyInvolvementRate = Math.round((familyInvolved.length / plans.length) * 100);

  // Social worker involvement
  const swInvolved = plans.filter((p) => p.socialWorkerInvolved);
  const socialWorkerRate = Math.round((swInvolved.length / plans.length) * 100);

  return {
    planCurrencyRate,
    childVoiceRate,
    multiAgencyRate,
    overduePlans,
    goalAchievementRate,
    totalPlans: plans.length,
    activePlans,
    reviewedPlans,
    completedPlans,
    draftPlans,
    familyInvolvementRate,
    socialWorkerRate,
  };
}

// ── Core: Evaluate Independence Skills ───────────────────────────────────

export function evaluateIndependenceSkills(
  assessments: IndependenceSkillAssessment[],
): IndependenceSkillsResult {
  if (assessments.length === 0) {
    return {
      profiles: [],
      overallAverageConfidence: 0,
      skillGaps: [],
      strongestSkills: [],
      categoryAverages: [],
    };
  }

  // Group assessments by child, use latest for profile
  const childMap = new Map<string, IndependenceSkillAssessment[]>();
  for (const assessment of assessments) {
    const existing = childMap.get(assessment.childId) || [];
    existing.push(assessment);
    childMap.set(assessment.childId, existing);
  }

  const profiles: SkillProfile[] = [];
  const allCategoryScores = new Map<SkillCategory, number[]>();

  for (const [childId, childAssessments] of childMap) {
    // Sort by date descending
    const sorted = [...childAssessments].sort(
      (a, b) => b.assessmentDate.localeCompare(a.assessmentDate),
    );
    const latest = sorted[0];

    const scores = latest.skills.map((s) => confidenceToScore(s.confidence));
    const avgConfidence = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

    const skillGaps = latest.skills
      .filter((s) => s.confidence === "not_started" || s.confidence === "emerging")
      .map((s) => s.category);

    const strongSkills = latest.skills
      .filter((s) => s.confidence === "competent" || s.confidence === "independent")
      .map((s) => s.category);

    // Accumulate for overall averages
    for (const skill of latest.skills) {
      const existing = allCategoryScores.get(skill.category) || [];
      existing.push(confidenceToScore(skill.confidence));
      allCategoryScores.set(skill.category, existing);
    }

    profiles.push({
      childId,
      childName: latest.childName,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      skillGaps,
      strongSkills,
      assessmentCount: childAssessments.length,
      latestAssessmentDate: latest.assessmentDate,
      skillBreakdown: latest.skills,
    });
  }

  // Overall average confidence across all children
  const allScores = profiles.map((p) => p.averageConfidence);
  const overallAverageConfidence = allScores.length > 0
    ? Math.round((allScores.reduce((sum, s) => sum + s, 0) / allScores.length) * 100) / 100
    : 0;

  // Category averages
  const categoryAverages = [...allCategoryScores.entries()]
    .map(([category, scores]) => ({
      category,
      average: Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100) / 100,
    }))
    .sort((a, b) => a.average - b.average);

  // Skill gaps: categories where average is below "developing" (< 2) across children
  const skillGaps = categoryAverages
    .filter((ca) => ca.average < 2)
    .map((ca) => ca.category);

  // Strongest skills: categories where average is "competent" or above (>= 3)
  const strongestSkills = categoryAverages
    .filter((ca) => ca.average >= 3)
    .map((ca) => ca.category);

  return {
    profiles,
    overallAverageConfidence,
    skillGaps,
    strongestSkills,
    categoryAverages,
  };
}

// ── Core: Evaluate Placement Stability ───────────────────────────────────

export function evaluatePlacementStability(
  records: PlacementStabilityRecord[],
  _referenceDate: string,
): PlacementStabilityResult {
  if (records.length === 0) {
    return {
      averagePreviousPlacements: 0,
      totalDisruptionRisks: 0,
      totalStabilityFactors: 0,
      childrenWithHighRisk: 0,
      childrenStable: 0,
      averageDisruptionRisks: 0,
    };
  }

  const totalPlacements = records.reduce((sum, r) => sum + r.previousPlacements, 0);
  const averagePreviousPlacements = Math.round((totalPlacements / records.length) * 100) / 100;

  const totalDisruptionRisks = records.reduce((sum, r) => sum + r.disruptionRisks.length, 0);
  const totalStabilityFactors = records.reduce((sum, r) => sum + r.stabilityFactors.length, 0);

  const childrenWithHighRisk = records.filter(
    (r) => r.disruptionRisks.length >= 3 || r.previousPlacements >= 4,
  ).length;

  const childrenStable = records.filter(
    (r) => r.disruptionRisks.length === 0 && r.previousPlacements <= 1,
  ).length;

  const averageDisruptionRisks = Math.round((totalDisruptionRisks / records.length) * 100) / 100;

  return {
    averagePreviousPlacements,
    totalDisruptionRisks,
    totalStabilityFactors,
    childrenWithHighRisk,
    childrenStable,
    averageDisruptionRisks,
  };
}

// ── Core: Evaluate Goal Progress ─────────────────────────────────────────

export function evaluateGoalProgress(
  plans: TransitionPlan[],
  referenceDate?: string,
): GoalProgressResult {
  const allGoals = plans.flatMap((p) => p.goals);

  if (allGoals.length === 0) {
    return {
      totalGoals: 0,
      achieved: 0,
      inProgress: 0,
      notStarted: 0,
      deferred: 0,
      achievementRate: 0,
      categoryBreakdown: [],
      deferredGoals: [],
      goalsNearingDeadline: [],
    };
  }

  const achieved = allGoals.filter((g) => g.status === "achieved").length;
  const inProgress = allGoals.filter((g) => g.status === "in_progress").length;
  const notStarted = allGoals.filter((g) => g.status === "not_started").length;
  const deferred = allGoals.filter((g) => g.status === "deferred").length;

  const achievementRate = Math.round((achieved / allGoals.length) * 100);

  // Category breakdown
  const categoryMap = new Map<SkillCategory, TransitionGoal[]>();
  for (const goal of allGoals) {
    const existing = categoryMap.get(goal.category) || [];
    existing.push(goal);
    categoryMap.set(goal.category, existing);
  }

  const categoryBreakdown = [...categoryMap.entries()]
    .map(([category, goals]) => {
      const catAchieved = goals.filter((g) => g.status === "achieved").length;
      return {
        category,
        total: goals.length,
        achieved: catAchieved,
        rate: Math.round((catAchieved / goals.length) * 100),
      };
    })
    .sort((a, b) => a.rate - b.rate);

  // Deferred goals
  const deferredGoals = allGoals.filter((g) => g.status === "deferred");

  // Goals nearing deadline: within 30 days of target date and not achieved/deferred
  const refDateStr = referenceDate ?? new Date().toISOString().split("T")[0];
  const refDate = new Date(refDateStr);
  const thirtyDaysLater = new Date(refDate);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split("T")[0];

  const goalsNearingDeadline = allGoals.filter(
    (g) =>
      g.status !== "achieved" &&
      g.status !== "deferred" &&
      g.targetDate >= refDateStr &&
      g.targetDate <= thirtyDaysLaterStr,
  );

  return {
    totalGoals: allGoals.length,
    achieved,
    inProgress,
    notStarted,
    deferred,
    achievementRate,
    categoryBreakdown,
    deferredGoals,
    goalsNearingDeadline,
  };
}

// ── Core: Build Child Transition Profiles ────────────────────────────────

export function buildChildTransitionProfiles(
  plans: TransitionPlan[],
  assessments: IndependenceSkillAssessment[],
  stability: PlacementStabilityRecord[],
): ChildTransitionProfile[] {
  // Gather all unique child IDs from all sources
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const plan of plans) {
    childIds.add(plan.childId);
    childNames.set(plan.childId, plan.childName);
  }
  for (const assessment of assessments) {
    childIds.add(assessment.childId);
    childNames.set(assessment.childId, assessment.childName);
  }
  for (const record of stability) {
    childIds.add(record.childId);
    childNames.set(record.childId, record.childName);
  }

  return [...childIds].map((childId) => {
    const childPlans = plans.filter((p) => p.childId === childId);
    const childAssessments = assessments.filter((a) => a.childId === childId);
    const stabilityRecord = stability.find((s) => s.childId === childId);

    // Plan status: use the most "active" plan
    const activePlan = childPlans.find((p) => p.status === "active")
      || childPlans.find((p) => p.status === "reviewed")
      || childPlans.find((p) => p.status === "overdue")
      || childPlans.find((p) => p.status === "draft")
      || childPlans[0];

    const planStatus = (activePlan?.status ?? "no_plan") as PlanStatus | "no_plan";
    const transitionType = (activePlan?.transitionType ?? "none") as TransitionType | "none";
    const targetDate = activePlan?.targetDate ?? null;
    const childVoiceRecorded = activePlan?.childVoiceRecorded ?? false;

    // Skill readiness: from latest assessment
    let skillReadinessScore = 0;
    let skillGaps: SkillCategory[] = [];
    if (childAssessments.length > 0) {
      const sorted = [...childAssessments].sort(
        (a, b) => b.assessmentDate.localeCompare(a.assessmentDate),
      );
      const latest = sorted[0];
      const scores = latest.skills.map((s) => confidenceToScore(s.confidence));
      const avg = scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : 0;
      // Normalize to 0-100 (max score is 4 = independent)
      skillReadinessScore = Math.round((avg / 4) * 100);
      skillGaps = latest.skills
        .filter((s) => s.confidence === "not_started" || s.confidence === "emerging")
        .map((s) => s.category);
    }

    // Goal achievement
    const childGoals = childPlans.flatMap((p) => p.goals);
    const goalAchievementRate = childGoals.length > 0
      ? Math.round(
          (childGoals.filter((g) => g.status === "achieved").length / childGoals.length) * 100,
        )
      : 0;

    // Placement stability
    let placementStability: "stable" | "at_risk" | "high_risk" | "unknown" = "unknown";
    let previousPlacements = 0;
    if (stabilityRecord) {
      previousPlacements = stabilityRecord.previousPlacements;
      if (stabilityRecord.disruptionRisks.length >= 3 || stabilityRecord.previousPlacements >= 4) {
        placementStability = "high_risk";
      } else if (stabilityRecord.disruptionRisks.length >= 1 || stabilityRecord.previousPlacements >= 2) {
        placementStability = "at_risk";
      } else {
        placementStability = "stable";
      }
    }

    // Primary concern
    let primaryConcern: string | undefined;
    if (planStatus === "overdue") {
      primaryConcern = "Transition plan is overdue for review — statutory obligation not met";
    } else if (planStatus === "no_plan") {
      primaryConcern = "No transition plan in place — planning required under Reg 14";
    } else if (placementStability === "high_risk") {
      primaryConcern = "High placement disruption risk — stability planning needed";
    } else if (skillGaps.length >= 6) {
      primaryConcern = `${skillGaps.length} independence skill gaps — intensive skills programme needed`;
    } else if (goalAchievementRate < 20 && childGoals.length > 0) {
      primaryConcern = "Very low goal achievement — transition plan may need restructuring";
    }

    return {
      childId,
      childName: childNames.get(childId) ?? childId,
      planStatus,
      transitionType,
      targetDate,
      skillReadinessScore,
      skillGaps,
      goalAchievementRate,
      placementStability,
      previousPlacements,
      childVoiceRecorded,
      primaryConcern,
    };
  });
}

// ── Main: Generate Transition Planning Intelligence ──────────────────────

export function generateTransitionPlanningIntelligence(
  plans: TransitionPlan[],
  assessments: IndependenceSkillAssessment[],
  stability: PlacementStabilityRecord[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): TransitionPlanningIntelligenceResult {
  const assessedAt = new Date().toISOString();

  // Filter plans to those relevant to the period
  const periodPlans = plans.filter(
    (p) => p.planCreatedDate <= periodEnd && (p.status !== "completed" || p.targetDate >= periodStart),
  );

  const planningQuality = evaluateTransitionPlanning(periodPlans, referenceDate);
  const independenceReadiness = evaluateIndependenceSkills(assessments);
  const goalProgress = evaluateGoalProgress(periodPlans, referenceDate);
  const placementStabilityResult = evaluatePlacementStability(stability, referenceDate);
  const childProfiles = buildChildTransitionProfiles(periodPlans, assessments, stability);

  // Score
  const overallScore = calculateTransitionScore(
    planningQuality,
    independenceReadiness,
    goalProgress,
    placementStabilityResult,
  );
  const rating = getTransitionRating(overallScore);

  // Insights
  const strengths = generateStrengths(planningQuality, independenceReadiness, goalProgress, placementStabilityResult, childProfiles);
  const areasForDevelopment = generateAreasForDevelopment(planningQuality, independenceReadiness, goalProgress, placementStabilityResult, childProfiles);
  const immediateActions = generateImmediateActions(planningQuality, goalProgress, placementStabilityResult, childProfiles);
  const regulatoryLinks = generateRegulatoryLinks(planningQuality, childProfiles, periodPlans);

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    planningQuality,
    independenceReadiness,
    goalProgress,
    placementStability: placementStabilityResult,
    childProfiles,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calculateTransitionScore(
  planning: TransitionPlanningResult,
  independence: IndependenceSkillsResult,
  goals: GoalProgressResult,
  stability: PlacementStabilityResult,
): number {
  let score = 0;

  // Planning quality: max 30
  // Plan currency (max 10)
  score += (planning.planCurrencyRate / 100) * 10;
  // Child voice (max 8)
  score += (planning.childVoiceRate / 100) * 8;
  // Multi-agency (max 7)
  score += (planning.multiAgencyRate / 100) * 7;
  // Overdue penalty (max 5 deducted)
  if (planning.totalPlans > 0) {
    const overdueRate = planning.overduePlans / planning.totalPlans;
    score += Math.max(0, 5 - overdueRate * 20);
  } else {
    score += 0; // No plans = no points for planning
  }

  // Independence readiness: max 25
  // Average confidence (max 15) — normalized to 0-4 scale
  const confidenceNorm = independence.overallAverageConfidence / 4;
  score += confidenceNorm * 15;
  // Gap analysis (max 10) — fewer gaps = more points
  if (independence.profiles.length > 0) {
    const totalCategories = 12; // all SkillCategory values
    const gapRatio = independence.skillGaps.length / totalCategories;
    score += (1 - gapRatio) * 10;
  }

  // Goal progress: max 25
  // Achievement rate (max 15)
  score += (goals.achievementRate / 100) * 15;
  // Overdue/deferred penalty (max 10)
  if (goals.totalGoals > 0) {
    const problemGoals = goals.deferred + goals.notStarted;
    const problemRate = problemGoals / goals.totalGoals;
    score += Math.max(0, 10 - problemRate * 15);
  }

  // Placement stability: max 20
  if (stability.averagePreviousPlacements === 0 && stability.totalDisruptionRisks === 0) {
    // Perfect stability
    score += 20;
  } else {
    // Placement count factor (max 10)
    const placementPenalty = Math.min(stability.averagePreviousPlacements * 2, 10);
    score += Math.max(0, 10 - placementPenalty);
    // Disruption risk factor (max 10)
    const riskPenalty = Math.min(stability.averageDisruptionRisks * 3, 10);
    score += Math.max(0, 10 - riskPenalty);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getTransitionRating(
  score: number,
): "outstanding" | "good" | "requires_improvement" | "inadequate" {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateStrengths(
  planning: TransitionPlanningResult,
  independence: IndependenceSkillsResult,
  goals: GoalProgressResult,
  stability: PlacementStabilityResult,
  profiles: ChildTransitionProfile[],
): string[] {
  const strengths: string[] = [];

  if (planning.planCurrencyRate >= 90) {
    strengths.push("Transition plans are well maintained with regular reviews — strong planning culture");
  }
  if (planning.childVoiceRate >= 90) {
    strengths.push("Children's voices are consistently captured in transition planning — demonstrating commitment to UNCRC Article 12");
  }
  if (planning.multiAgencyRate >= 80) {
    strengths.push("Strong multi-agency involvement in transition planning — collaborative approach in line with Working Together 2023");
  }
  if (goals.achievementRate >= 75) {
    strengths.push("High goal achievement rate — children are making tangible progress toward transition outcomes");
  }
  if (independence.strongestSkills.length >= 4) {
    strengths.push(`Children demonstrate strong competence in ${independence.strongestSkills.length} skill areas — effective independence preparation`);
  }
  if (stability.childrenStable > 0 && stability.childrenWithHighRisk === 0) {
    strengths.push("All placements are stable with no high-risk disruption factors identified");
  }
  if (planning.familyInvolvementRate >= 80) {
    strengths.push("Families are actively involved in transition planning — supporting continuity and belonging");
  }
  if (profiles.length > 0 && profiles.every((p) => p.planStatus !== "no_plan" && p.planStatus !== "overdue")) {
    strengths.push("Every child has a current, active transition plan — statutory obligations met consistently");
  }

  return strengths;
}

function generateAreasForDevelopment(
  planning: TransitionPlanningResult,
  independence: IndependenceSkillsResult,
  goals: GoalProgressResult,
  stability: PlacementStabilityResult,
  profiles: ChildTransitionProfile[],
): string[] {
  const areas: string[] = [];

  if (planning.planCurrencyRate < 80) {
    areas.push(`Plan currency rate is ${planning.planCurrencyRate}% — ensure all transition plans are reviewed at least every 3 months`);
  }
  if (planning.childVoiceRate < 75) {
    areas.push(`Child voice recorded in only ${planning.childVoiceRate}% of plans — review methods for capturing children's views`);
  }
  if (planning.multiAgencyRate < 60) {
    areas.push(`Multi-agency involvement is ${planning.multiAgencyRate}% — strengthen partnerships with external agencies`);
  }
  if (planning.overduePlans > 0) {
    areas.push(`${planning.overduePlans} plan(s) overdue for review — prioritise immediate review completion`);
  }
  if (independence.skillGaps.length > 0) {
    const gapLabels = independence.skillGaps.map(getSkillCategoryLabel).join(", ");
    areas.push(`Independence skill gaps identified in: ${gapLabels}`);
  }
  if (goals.achievementRate < 50) {
    areas.push(`Goal achievement rate is ${goals.achievementRate}% — review goal-setting approach and support arrangements`);
  }
  if (goals.deferred > 0) {
    areas.push(`${goals.deferred} goal(s) deferred — ensure deferrals are purposeful and plans updated`);
  }
  if (stability.childrenWithHighRisk > 0) {
    areas.push(`${stability.childrenWithHighRisk} child(ren) at high risk of placement disruption — implement targeted stability plans`);
  }
  if (planning.socialWorkerRate < 80) {
    areas.push(`Social worker involvement is ${planning.socialWorkerRate}% — escalate to ensure consistent SW engagement`);
  }

  const childrenWithNoPlans = profiles.filter((p) => p.planStatus === "no_plan");
  if (childrenWithNoPlans.length > 0) {
    areas.push(`${childrenWithNoPlans.length} child(ren) without a transition plan — urgent planning required`);
  }

  return areas;
}

function generateImmediateActions(
  planning: TransitionPlanningResult,
  goals: GoalProgressResult,
  stability: PlacementStabilityResult,
  profiles: ChildTransitionProfile[],
): string[] {
  const actions: string[] = [];

  // Overdue plans
  if (planning.overduePlans > 0) {
    actions.push(`URGENT: ${planning.overduePlans} transition plan(s) overdue — schedule review within 5 working days`);
  }

  // Children without plans
  const noPlan = profiles.filter((p) => p.planStatus === "no_plan");
  if (noPlan.length > 0) {
    for (const child of noPlan) {
      actions.push(`URGENT: ${child.childName} has no transition plan — initiate planning process immediately`);
    }
  }

  // High risk placements
  const highRisk = profiles.filter((p) => p.placementStability === "high_risk");
  if (highRisk.length > 0) {
    for (const child of highRisk) {
      actions.push(`HIGH: ${child.childName} at high risk of placement disruption — convene stability meeting`);
    }
  }

  // Goals nearing deadline
  if (goals.goalsNearingDeadline.length > 0) {
    actions.push(`${goals.goalsNearingDeadline.length} goal(s) approaching deadline within 30 days — review progress and adjust support`);
  }

  // Low child voice
  if (planning.childVoiceRate < 50 && planning.totalPlans > 0) {
    actions.push("Child voice recorded in fewer than half of plans — implement advocacy and consultation tools");
  }

  // Low multi-agency involvement
  if (planning.multiAgencyRate < 40 && planning.totalPlans > 0) {
    actions.push("Multi-agency involvement below 40% — request professionals meetings for active plans");
  }

  // Children with many skill gaps
  for (const child of profiles) {
    if (child.skillGaps.length >= 8) {
      actions.push(`HIGH: ${child.childName} has ${child.skillGaps.length} independence skill gaps — develop intensive skills programme`);
    }
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required — continue monitoring transition planning progress");
  }

  return actions;
}

function generateRegulatoryLinks(
  planning: TransitionPlanningResult,
  profiles: ChildTransitionProfile[],
  plans: TransitionPlan[],
): string[] {
  const links: string[] = [];

  links.push("CHR 2015, Reg 14 — Children's care plans must include transition/pathway planning with regular review");

  if (planning.overduePlans > 0 || profiles.some((p) => p.planStatus === "no_plan")) {
    links.push("CHR 2015, Reg 5 — Statement of purpose requires clear planning for each child's future");
  }

  if (planning.childVoiceRate < 100) {
    links.push("UNCRC Article 12 — Every child has the right to express their views in decisions affecting their future");
  }

  if (planning.multiAgencyRate < 100) {
    links.push("Working Together 2023 — Multi-agency collaboration is essential for effective transition planning");
  }

  const leavingCarePlans = plans.filter(
    (p) => p.transitionType === "leaving_care" || p.transitionType === "independence" || p.transitionType === "supported_living",
  );
  if (leavingCarePlans.length > 0) {
    links.push("Children Act 1989, s23C/D — Pathway planning duties for eligible and relevant children");
  }

  links.push("SCCIF Quality of Care — Preparation for adulthood and independence must be embedded in daily practice");

  return links;
}
