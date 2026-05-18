// ==============================================================================
// Cornerstone Independence & Life Skills Intelligence Engine
//
// Evaluates children's progress toward independent living, daily living skills,
// practical capabilities, and preparation for transitions out of care.
//
// Regulatory basis:
//   CHR 2015 Reg 12 — independence and enjoyment
//   CHR 2015 Reg 5 — engaging with the wider community
//   CA 1989 s22C — duty to promote welfare
//   UNCRC Article 6 — survival and development
//   UNCRC Article 29 — development of child's personality and abilities
//   SCCIF — experiences and progress (preparation for independence)
//   NMS 13 — preparing for adulthood
//   Leaving Care Act 2000 — pathway planning
//   Keep On Caring 2016 — care leavers strategy
//
// Pure deterministic engine — no AI, no external calls.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type SkillDomain =
  | "cooking_nutrition"
  | "budgeting_finance"
  | "personal_hygiene"
  | "laundry_clothing"
  | "household_tasks"
  | "travel_transport"
  | "communication"
  | "digital_literacy"
  | "health_management"
  | "emotional_regulation"
  | "social_skills"
  | "problem_solving";

export type CompetenceLevel =
  | "independent"
  | "mostly_independent"
  | "needs_some_support"
  | "needs_significant_support"
  | "not_yet_started";

export type AssessmentFrequency =
  | "monthly"
  | "quarterly"
  | "six_monthly"
  | "annually"
  | "ad_hoc";

export type GoalStatus =
  | "achieved"
  | "on_track"
  | "behind"
  | "not_started"
  | "abandoned";

export type TeachingMethod =
  | "one_to_one"
  | "group_session"
  | "practical_activity"
  | "community_based"
  | "peer_mentoring"
  | "online_learning";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface SkillAssessment {
  id: string;
  childId: string;
  childName: string;
  domain: SkillDomain;
  competenceLevel: CompetenceLevel;
  assessedDate: string;
  assessedBy: string;
  previousLevel: CompetenceLevel | null;
  targetLevel: CompetenceLevel;
  notes: string | null;
}

export interface IndependenceGoal {
  id: string;
  childId: string;
  childName: string;
  domain: SkillDomain;
  goalDescription: string;
  status: GoalStatus;
  targetDate: string;
  reviewDate: string | null;
  childInvolved: boolean;
  ageAppropriate: boolean;
}

export interface PracticalSession {
  id: string;
  childId: string;
  childName: string;
  domain: SkillDomain;
  teachingMethod: TeachingMethod;
  date: string;
  durationMinutes: number;
  childEngaged: boolean;
  progressMade: boolean;
  staffMember: string;
  communityBased: boolean;
}

export interface PathwayPlanProgress {
  id: string;
  childId: string;
  childName: string;
  hasPathwayPlan: boolean;
  lastReviewDate: string | null;
  independenceSectionComplete: boolean;
  accommodationPlanned: boolean;
  educationEmploymentPlanned: boolean;
  financialLiteracyIncluded: boolean;
  healthPassportComplete: boolean;
  socialNetworksIdentified: boolean;
  childContributed: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface SkillDevelopmentResult {
  overallScore: number; // 0-25
  totalAssessments: number;
  independentMostlyRate: number; // %
  improvementRate: number; // % showing improvement from previousLevel
  domainsAssessed: number;
  averageDomainsPerChild: number;
  notYetStartedCount: number;
}

export interface GoalProgressResult {
  overallScore: number; // 0-25
  totalGoals: number;
  achievedOnTrackRate: number; // %
  behindCount: number;
  abandonedCount: number;
  childInvolvementRate: number; // %
  ageAppropriateRate: number; // %
}

export interface PracticalLearningResult {
  overallScore: number; // 0-25
  totalSessions: number;
  engagementRate: number; // %
  progressRate: number; // %
  communityBasedRate: number; // %
  averageDurationMinutes: number;
  teachingMethodVariety: number; // unique methods used
  domainsActive: number; // unique domains with sessions
}

export interface PathwayPreparationResult {
  overallScore: number; // 0-25
  totalChildren: number;
  pathwayPlanRate: number; // %
  independenceSectionRate: number; // %
  accommodationPlannedRate: number; // %
  financialLiteracyRate: number; // %
  healthPassportRate: number; // %
  childContributionRate: number; // %
}

export interface ChildIndependenceProfile {
  childId: string;
  childName: string;
  domainsAssessed: number;
  independentDomains: number;
  goalCount: number;
  goalsAchieved: number;
  sessionCount: number;
  hasPathwayPlan: boolean;
  overallScore: number; // 0-10
}

export interface IndependenceLifeSkillsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  skillDevelopment: SkillDevelopmentResult;
  goalProgress: GoalProgressResult;
  practicalLearning: PracticalLearningResult;
  pathwayPreparation: PathwayPreparationResult;
  childProfiles: ChildIndependenceProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function cap(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Label Functions ----------------------------------------------------------

const SKILL_DOMAIN_LABELS: Record<SkillDomain, string> = {
  cooking_nutrition: "Cooking & Nutrition",
  budgeting_finance: "Budgeting & Finance",
  personal_hygiene: "Personal Hygiene",
  laundry_clothing: "Laundry & Clothing",
  household_tasks: "Household Tasks",
  travel_transport: "Travel & Transport",
  communication: "Communication",
  digital_literacy: "Digital Literacy",
  health_management: "Health Management",
  emotional_regulation: "Emotional Regulation",
  social_skills: "Social Skills",
  problem_solving: "Problem Solving",
};

const COMPETENCE_LEVEL_LABELS: Record<CompetenceLevel, string> = {
  independent: "Independent",
  mostly_independent: "Mostly Independent",
  needs_some_support: "Needs Some Support",
  needs_significant_support: "Needs Significant Support",
  not_yet_started: "Not Yet Started",
};

const ASSESSMENT_FREQUENCY_LABELS: Record<AssessmentFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  six_monthly: "Six-Monthly",
  annually: "Annually",
  ad_hoc: "Ad Hoc",
};

const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  achieved: "Achieved",
  on_track: "On Track",
  behind: "Behind",
  not_started: "Not Started",
  abandoned: "Abandoned",
};

const TEACHING_METHOD_LABELS: Record<TeachingMethod, string> = {
  one_to_one: "One-to-One",
  group_session: "Group Session",
  practical_activity: "Practical Activity",
  community_based: "Community Based",
  peer_mentoring: "Peer Mentoring",
  online_learning: "Online Learning",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSkillDomainLabel(domain: SkillDomain): string {
  return SKILL_DOMAIN_LABELS[domain];
}

export function getCompetenceLevelLabel(level: CompetenceLevel): string {
  return COMPETENCE_LEVEL_LABELS[level];
}

export function getAssessmentFrequencyLabel(freq: AssessmentFrequency): string {
  return ASSESSMENT_FREQUENCY_LABELS[freq];
}

export function getGoalStatusLabel(status: GoalStatus): string {
  return GOAL_STATUS_LABELS[status];
}

export function getTeachingMethodLabel(method: TeachingMethod): string {
  return TEACHING_METHOD_LABELS[method];
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

// -- Competence level numeric helpers -----------------------------------------

const COMPETENCE_ORDER: Record<CompetenceLevel, number> = {
  not_yet_started: 0,
  needs_significant_support: 1,
  needs_some_support: 2,
  mostly_independent: 3,
  independent: 4,
};

function levelImproved(previous: CompetenceLevel | null, current: CompetenceLevel): boolean {
  if (previous === null) return false;
  return COMPETENCE_ORDER[current] > COMPETENCE_ORDER[previous];
}

// -- Evaluators ---------------------------------------------------------------

export function evaluateSkillDevelopment(
  assessments: SkillAssessment[],
): SkillDevelopmentResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      independentMostlyRate: 0,
      improvementRate: 0,
      domainsAssessed: 0,
      averageDomainsPerChild: 0,
      notYetStartedCount: 0,
    };
  }

  const independentOrMostly = assessments.filter(
    (a) => a.competenceLevel === "independent" || a.competenceLevel === "mostly_independent",
  ).length;
  const independentMostlyRate = pct(independentOrMostly, assessments.length);

  const withPrevious = assessments.filter((a) => a.previousLevel !== null);
  const improved = withPrevious.filter((a) => levelImproved(a.previousLevel, a.competenceLevel)).length;
  const improvementRate = pct(improved, withPrevious.length);

  const uniqueDomains = new Set(assessments.map((a) => a.domain));
  const domainsAssessed = uniqueDomains.size;

  const childIds = new Set(assessments.map((a) => a.childId));
  const averageDomainsPerChild = childIds.size > 0
    ? Math.round((assessments.length / childIds.size) * 10) / 10
    : 0;

  const notYetStartedCount = assessments.filter((a) => a.competenceLevel === "not_yet_started").length;

  // Score calculation
  let score = 0;
  // Independent/mostly rate (0-8)
  score += Math.round((independentMostlyRate / 100) * 8);
  // Improvement rate (0-6)
  score += withPrevious.length > 0 ? Math.round((improvementRate / 100) * 6) : 0;
  // Domain coverage (0-6): more domains = better
  const domainCoverage = Math.min(domainsAssessed / 8, 1);
  score += Math.round(domainCoverage * 6);
  // Average domains per child (0-5): target ≥6
  const avgCoverage = Math.min(averageDomainsPerChild / 6, 1);
  score += Math.round(avgCoverage * 5);

  // Penalty for not_yet_started
  score -= Math.min(notYetStartedCount, 5);

  return {
    overallScore: cap(score, 0, 25),
    totalAssessments: assessments.length,
    independentMostlyRate,
    improvementRate,
    domainsAssessed,
    averageDomainsPerChild,
    notYetStartedCount,
  };
}

export function evaluateGoalProgress(
  goals: IndependenceGoal[],
): GoalProgressResult {
  if (goals.length === 0) {
    return {
      overallScore: 0,
      totalGoals: 0,
      achievedOnTrackRate: 0,
      behindCount: 0,
      abandonedCount: 0,
      childInvolvementRate: 0,
      ageAppropriateRate: 0,
    };
  }

  const achievedOrOnTrack = goals.filter(
    (g) => g.status === "achieved" || g.status === "on_track",
  ).length;
  const achievedOnTrackRate = pct(achievedOrOnTrack, goals.length);

  const behindCount = goals.filter((g) => g.status === "behind").length;
  const abandonedCount = goals.filter((g) => g.status === "abandoned").length;

  const childInvolved = goals.filter((g) => g.childInvolved).length;
  const childInvolvementRate = pct(childInvolved, goals.length);

  const ageAppropriate = goals.filter((g) => g.ageAppropriate).length;
  const ageAppropriateRate = pct(ageAppropriate, goals.length);

  // Score calculation
  let score = 0;
  // Achieved/on-track rate (0-10)
  score += Math.round((achievedOnTrackRate / 100) * 10);
  // Child involvement (0-6)
  score += Math.round((childInvolvementRate / 100) * 6);
  // Age appropriate (0-5)
  score += Math.round((ageAppropriateRate / 100) * 5);
  // Review coverage (0-4): goals with review dates
  const reviewed = goals.filter((g) => g.reviewDate !== null).length;
  score += Math.round((pct(reviewed, goals.length) / 100) * 4);

  // Penalties
  score -= Math.min(behindCount, 3);
  score -= abandonedCount * 2;

  return {
    overallScore: cap(score, 0, 25),
    totalGoals: goals.length,
    achievedOnTrackRate,
    behindCount,
    abandonedCount,
    childInvolvementRate,
    ageAppropriateRate,
  };
}

export function evaluatePracticalLearning(
  sessions: PracticalSession[],
): PracticalLearningResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      engagementRate: 0,
      progressRate: 0,
      communityBasedRate: 0,
      averageDurationMinutes: 0,
      teachingMethodVariety: 0,
      domainsActive: 0,
    };
  }

  const engaged = sessions.filter((s) => s.childEngaged).length;
  const engagementRate = pct(engaged, sessions.length);

  const progress = sessions.filter((s) => s.progressMade).length;
  const progressRate = pct(progress, sessions.length);

  const communityBased = sessions.filter((s) => s.communityBased).length;
  const communityBasedRate = pct(communityBased, sessions.length);

  const totalDuration = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const averageDurationMinutes = Math.round(totalDuration / sessions.length);

  const uniqueMethods = new Set(sessions.map((s) => s.teachingMethod));
  const teachingMethodVariety = uniqueMethods.size;

  const uniqueDomains = new Set(sessions.map((s) => s.domain));
  const domainsActive = uniqueDomains.size;

  // Score calculation
  let score = 0;
  // Engagement rate (0-7)
  score += Math.round((engagementRate / 100) * 7);
  // Progress rate (0-7)
  score += Math.round((progressRate / 100) * 7);
  // Community based rate (0-4)
  score += Math.round((communityBasedRate / 100) * 4);
  // Teaching variety (0-4): target ≥4 methods
  score += Math.min(teachingMethodVariety, 4);
  // Domain coverage (0-3): target ≥6 domains
  score += Math.min(Math.round(domainsActive / 2), 3);

  return {
    overallScore: cap(score, 0, 25),
    totalSessions: sessions.length,
    engagementRate,
    progressRate,
    communityBasedRate,
    averageDurationMinutes,
    teachingMethodVariety,
    domainsActive,
  };
}

export function evaluatePathwayPreparation(
  pathways: PathwayPlanProgress[],
): PathwayPreparationResult {
  if (pathways.length === 0) {
    return {
      overallScore: 0,
      totalChildren: 0,
      pathwayPlanRate: 0,
      independenceSectionRate: 0,
      accommodationPlannedRate: 0,
      financialLiteracyRate: 0,
      healthPassportRate: 0,
      childContributionRate: 0,
    };
  }

  const withPlan = pathways.filter((p) => p.hasPathwayPlan).length;
  const pathwayPlanRate = pct(withPlan, pathways.length);

  const withSection = pathways.filter((p) => p.independenceSectionComplete).length;
  const independenceSectionRate = pct(withSection, pathways.length);

  const withAccomm = pathways.filter((p) => p.accommodationPlanned).length;
  const accommodationPlannedRate = pct(withAccomm, pathways.length);

  const withFinance = pathways.filter((p) => p.financialLiteracyIncluded).length;
  const financialLiteracyRate = pct(withFinance, pathways.length);

  const withHealth = pathways.filter((p) => p.healthPassportComplete).length;
  const healthPassportRate = pct(withHealth, pathways.length);

  const withChild = pathways.filter((p) => p.childContributed).length;
  const childContributionRate = pct(withChild, pathways.length);

  // Score calculation
  let score = 0;
  // Pathway plan rate (0-5)
  score += Math.round((pathwayPlanRate / 100) * 5);
  // Independence section (0-5)
  score += Math.round((independenceSectionRate / 100) * 5);
  // Accommodation planned (0-4)
  score += Math.round((accommodationPlannedRate / 100) * 4);
  // Financial literacy (0-4)
  score += Math.round((financialLiteracyRate / 100) * 4);
  // Health passport (0-3)
  score += Math.round((healthPassportRate / 100) * 3);
  // Child contribution (0-4)
  score += Math.round((childContributionRate / 100) * 4);

  return {
    overallScore: cap(score, 0, 25),
    totalChildren: pathways.length,
    pathwayPlanRate,
    independenceSectionRate,
    accommodationPlannedRate,
    financialLiteracyRate,
    healthPassportRate,
    childContributionRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

export function buildChildIndependenceProfiles(
  assessments: SkillAssessment[],
  goals: IndependenceGoal[],
  sessions: PracticalSession[],
  pathways: PathwayPlanProgress[],
): ChildIndependenceProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const a of assessments) { childIds.add(a.childId); childNames.set(a.childId, a.childName); }
  for (const g of goals) { childIds.add(g.childId); childNames.set(g.childId, g.childName); }
  for (const s of sessions) { childIds.add(s.childId); childNames.set(s.childId, s.childName); }
  for (const p of pathways) { childIds.add(p.childId); childNames.set(p.childId, p.childName); }

  return Array.from(childIds).map((childId) => {
    const childAssessments = assessments.filter((a) => a.childId === childId);
    const childGoals = goals.filter((g) => g.childId === childId);
    const childSessions = sessions.filter((s) => s.childId === childId);
    const childPathway = pathways.find((p) => p.childId === childId);

    const domainsAssessed = new Set(childAssessments.map((a) => a.domain)).size;
    const independentDomains = new Set(
      childAssessments
        .filter((a) => a.competenceLevel === "independent" || a.competenceLevel === "mostly_independent")
        .map((a) => a.domain),
    ).size;

    const goalsAchieved = childGoals.filter((g) => g.status === "achieved").length;

    // Score: combination of domains, goals, sessions, pathway
    let score = 0;
    // Domain competence (0-3)
    if (domainsAssessed > 0) {
      score += Math.min(Math.round((independentDomains / domainsAssessed) * 3), 3);
    }
    // Goals (0-3)
    if (childGoals.length > 0) {
      const achievedOnTrack = childGoals.filter((g) => g.status === "achieved" || g.status === "on_track").length;
      score += Math.min(Math.round((achievedOnTrack / childGoals.length) * 3), 3);
    }
    // Sessions (0-2)
    score += Math.min(Math.round(childSessions.length / 4), 2);
    // Pathway plan (0-2)
    if (childPathway?.hasPathwayPlan) score += 1;
    if (childPathway?.childContributed) score += 1;

    return {
      childId,
      childName: childNames.get(childId) || "Unknown",
      domainsAssessed,
      independentDomains,
      goalCount: childGoals.length,
      goalsAchieved,
      sessionCount: childSessions.length,
      hasPathwayPlan: childPathway?.hasPathwayPlan ?? false,
      overallScore: cap(score, 0, 10),
    };
  });
}

// -- Strengths, Areas, Actions ------------------------------------------------

function generateStrengths(
  skill: SkillDevelopmentResult,
  goalProgress: GoalProgressResult,
  practical: PracticalLearningResult,
  pathway: PathwayPreparationResult,
): string[] {
  const strengths: string[] = [];

  if (skill.independentMostlyRate >= 60) {
    strengths.push(
      `${skill.independentMostlyRate}% of skill assessments show independent or mostly independent competence`,
    );
  }
  if (skill.improvementRate >= 70) {
    strengths.push(`Strong skills improvement trajectory — ${skill.improvementRate}% of reassessed areas show progress`);
  }
  if (skill.domainsAssessed >= 8) {
    strengths.push(`Comprehensive skill assessment coverage across ${skill.domainsAssessed} domains`);
  }
  if (goalProgress.achievedOnTrackRate >= 75) {
    strengths.push(`${goalProgress.achievedOnTrackRate}% of independence goals are achieved or on track`);
  }
  if (goalProgress.childInvolvementRate >= 80) {
    strengths.push(`Excellent child involvement in goal setting at ${goalProgress.childInvolvementRate}%`);
  }
  if (practical.engagementRate >= 80) {
    strengths.push(`High engagement in practical learning sessions at ${practical.engagementRate}%`);
  }
  if (practical.communityBasedRate >= 50) {
    strengths.push(`Good use of community-based learning opportunities (${practical.communityBasedRate}%)`);
  }
  if (practical.teachingMethodVariety >= 4) {
    strengths.push(`Diverse teaching methods employed (${practical.teachingMethodVariety} different approaches)`);
  }
  if (pathway.pathwayPlanRate >= 80) {
    strengths.push(`${pathway.pathwayPlanRate}% of children have pathway plans in place`);
  }
  if (pathway.childContributionRate >= 80) {
    strengths.push(`Children meaningfully contribute to their pathway plans (${pathway.childContributionRate}%)`);
  }
  if (pathway.healthPassportRate >= 80) {
    strengths.push(`Health passports completed for ${pathway.healthPassportRate}% of children`);
  }

  return strengths;
}

function generateAreasForImprovement(
  skill: SkillDevelopmentResult,
  goalProgress: GoalProgressResult,
  practical: PracticalLearningResult,
  pathway: PathwayPreparationResult,
): string[] {
  const areas: string[] = [];

  if (skill.totalAssessments === 0) {
    areas.push("No independence skill assessments have been completed — formal assessment programme needed");
  }
  if (skill.domainsAssessed > 0 && skill.domainsAssessed < 6) {
    areas.push(`Only ${skill.domainsAssessed} skill domains assessed — broader coverage needed`);
  }
  if (skill.notYetStartedCount > 0) {
    areas.push(`${skill.notYetStartedCount} skill assessment(s) show "not yet started" — development plans needed`);
  }
  if (goalProgress.totalGoals > 0 && goalProgress.achievedOnTrackRate < 50) {
    areas.push(`Only ${goalProgress.achievedOnTrackRate}% of independence goals are on track or achieved`);
  }
  if (goalProgress.behindCount > 0) {
    areas.push(`${goalProgress.behindCount} independence goal(s) are behind schedule`);
  }
  if (goalProgress.abandonedCount > 0) {
    areas.push(`${goalProgress.abandonedCount} independence goal(s) have been abandoned — review and reset needed`);
  }
  if (goalProgress.totalGoals > 0 && goalProgress.childInvolvementRate < 60) {
    areas.push(
      `Child involvement in goal setting is low at ${goalProgress.childInvolvementRate}% — children must be central to their independence planning`,
    );
  }
  if (practical.totalSessions > 0 && practical.engagementRate < 60) {
    areas.push(`Engagement in practical sessions is low at ${practical.engagementRate}% — review approaches`);
  }
  if (practical.totalSessions === 0) {
    areas.push("No practical learning sessions recorded — active skills teaching programme required");
  }
  if (practical.communityBasedRate < 30 && practical.totalSessions > 0) {
    areas.push(`Only ${practical.communityBasedRate}% of sessions are community-based — increase real-world learning`);
  }
  if (pathway.totalChildren > 0 && pathway.pathwayPlanRate < 50) {
    areas.push(`Only ${pathway.pathwayPlanRate}% of children have pathway plans — immediate action needed`);
  }
  if (pathway.totalChildren > 0 && pathway.financialLiteracyRate < 50) {
    areas.push(
      `Financial literacy included for only ${pathway.financialLiteracyRate}% of pathway plans — essential for independence`,
    );
  }
  if (pathway.totalChildren > 0 && pathway.healthPassportRate < 50) {
    areas.push(`Health passports complete for only ${pathway.healthPassportRate}% — priority for transition readiness`);
  }

  return areas;
}

function generateActions(
  skill: SkillDevelopmentResult,
  goalProgress: GoalProgressResult,
  practical: PracticalLearningResult,
  pathway: PathwayPreparationResult,
  profiles: ChildIndependenceProfile[],
): string[] {
  const actions: string[] = [];

  if (skill.totalAssessments === 0) {
    actions.push("URGENT: Implement formal independence skill assessment programme for all children");
  }
  if (practical.totalSessions === 0) {
    actions.push("URGENT: Establish practical life skills teaching programme with dedicated sessions");
  }
  if (pathway.totalChildren > 0 && pathway.pathwayPlanRate < 50) {
    actions.push("URGENT: Ensure all children aged 14+ have comprehensive pathway plans");
  }

  const noPathway = profiles.filter((p) => !p.hasPathwayPlan);
  if (noPathway.length > 0) {
    actions.push(
      `Develop pathway plans for ${noPathway.length} child(ren) without plans: ${noPathway.map((p) => p.childName).join(", ")}`,
    );
  }

  if (goalProgress.behindCount > 0) {
    actions.push(`Review and adjust ${goalProgress.behindCount} behind-schedule independence goal(s)`);
  }

  if (skill.domainsAssessed > 0 && skill.domainsAssessed < 6) {
    actions.push(`Expand skill assessment to cover additional domains (currently ${skill.domainsAssessed} of 12)`);
  }

  if (practical.communityBasedRate < 40 && practical.totalSessions > 0) {
    actions.push("Increase community-based learning opportunities for practical real-world experience");
  }

  if (goalProgress.totalGoals > 0 && goalProgress.childInvolvementRate < 70) {
    actions.push("Ensure children are actively involved in setting their own independence goals");
  }

  if (pathway.totalChildren > 0 && pathway.financialLiteracyRate < 60) {
    actions.push("Include financial literacy components in all pathway plans");
  }

  if (pathway.totalChildren > 0 && pathway.healthPassportRate < 60) {
    actions.push("Complete health passports for all children approaching transition age");
  }

  if (practical.teachingMethodVariety < 3 && practical.totalSessions > 0) {
    actions.push("Diversify teaching methods — consider peer mentoring, community-based, and practical activities");
  }

  return actions;
}

function generateRegulatoryLinks(
  profiles: ChildIndependenceProfile[],
  pathway: PathwayPreparationResult,
): string[] {
  const links: string[] = [
    "CHR 2015 Reg 12 — The enjoyment and achievement standard, including independence and life skills development",
    "CHR 2015 Reg 5 — The engaging with the wider community standard",
    "SCCIF — Experiences and progress of children: preparation for independence and adulthood",
    "NMS 13 — Preparing for adulthood: equipping children with practical skills for independent living",
    "UNCRC Article 6 — Right to survival and development, including development of life skills",
    "UNCRC Article 29 — Education directed to development of child's personality, talents and abilities",
  ];

  if (pathway.totalChildren > 0) {
    links.push("Leaving Care Act 2000 — Pathway planning requirements for looked-after children");
    links.push("Keep On Caring 2016 — Government strategy for care leavers' successful transition");
  }

  if (profiles.some((p) => !p.hasPathwayPlan)) {
    links.push("CA 1989 s22C — Duty to promote the welfare and prepare for ceasing to be looked after");
  }

  return links;
}

// -- Main Function ------------------------------------------------------------

export function generateIndependenceLifeSkillsIntelligence(
  assessments: SkillAssessment[],
  goals: IndependenceGoal[],
  sessions: PracticalSession[],
  pathways: PathwayPlanProgress[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): IndependenceLifeSkillsIntelligence {
  const skillResult = evaluateSkillDevelopment(assessments);
  const goalResult = evaluateGoalProgress(goals);
  const practicalResult = evaluatePracticalLearning(sessions);
  const pathwayResult = evaluatePathwayPreparation(pathways);

  const overallScore = cap(
    skillResult.overallScore + goalResult.overallScore + practicalResult.overallScore + pathwayResult.overallScore,
    0,
    100,
  );
  const rating = getRating(overallScore);

  const childProfiles = buildChildIndependenceProfiles(assessments, goals, sessions, pathways);

  const strengths = generateStrengths(skillResult, goalResult, practicalResult, pathwayResult);
  const areasForImprovement = generateAreasForImprovement(skillResult, goalResult, practicalResult, pathwayResult);
  const actions = generateActions(skillResult, goalResult, practicalResult, pathwayResult, childProfiles);
  const regulatoryLinks = generateRegulatoryLinks(childProfiles, pathwayResult);

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    skillDevelopment: skillResult,
    goalProgress: goalResult,
    practicalLearning: practicalResult,
    pathwayPreparation: pathwayResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
