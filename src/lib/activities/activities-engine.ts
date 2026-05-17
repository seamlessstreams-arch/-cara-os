// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Activities & Enrichment Engine
//
// Deterministic engine for tracking children's participation in leisure,
// recreational, sporting, and cultural activities — ensuring normalised
// childhood experiences and equitable access to opportunities.
//
// Aligned to:
//   - CHR 2015 Reg 9 — Leisure, recreational and cultural activities
//   - CHR 2015 Reg 5 — Quality and purpose of care
//   - SCCIF — Experiences & progress / Enjoyment of activities
//   - UNCRC Article 31 — Right to rest, leisure, play, recreation, culture
//   - DfE Guidance: Promoting positive outcomes through activities
//
// Key requirements:
//   - Each child has personalised activity plan based on interests
//   - Range and diversity of activities (not just one type)
//   - New experiences encouraged (trying things outside comfort zone)
//   - Financial support/budgets equitable and adequate
//   - Cultural/identity-related activities supported
//   - Activities not cancelled as punishment (Reg 19 link)
//   - Barriers to participation identified and addressed
//   - Achievement and progress celebrated
//   - Community integration supported (not just "in-home" activities)
//   - Hobbies/interests sustained across placements
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type ActivityCategory =
  | "sport_team"             // team sports (football, netball, cricket)
  | "sport_individual"       // individual (swimming, running, martial arts)
  | "creative_arts"          // art, music, drama, dance
  | "outdoor_adventure"      // climbing, camping, DofE, forest school
  | "academic_enrichment"    // tutoring, homework clubs, coding
  | "cultural"               // museums, galleries, theatre, heritage
  | "religious_spiritual"    // faith-related activities
  | "life_skills"            // cooking, budgeting, DIY
  | "social_community"       // youth clubs, volunteering, scouts/guides
  | "health_wellbeing"       // yoga, mindfulness, gym
  | "hobbies_interests"      // gaming, reading groups, photography
  | "identity_heritage";     // cultural identity, language, family traditions

export type ParticipationLevel = "regular" | "occasional" | "tried_once" | "interested" | "dropped_out" | "refused";

export type BarrierType =
  | "financial"
  | "transport"
  | "confidence"
  | "peer_issues"
  | "timing_clash"
  | "health_condition"
  | "consent_required"
  | "placement_restriction"
  | "staffing"
  | "not_available_locally";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ActivityRecord {
  id: string;
  childId: string;
  name: string;                              // e.g. "Football (Oakville FC U14)"
  category: ActivityCategory;
  participationLevel: ParticipationLevel;
  startDate: string;
  endDate?: string;                          // null = ongoing
  frequency: string;                         // e.g. "Weekly", "Twice weekly"
  venue: string;                             // e.g. "Local leisure centre"
  communityBased: boolean;                   // vs in-home activity
  cost: number;                              // monthly cost £
  fundedBy: string;                          // e.g. "Home budget", "Pupil Premium"
  achievements?: string[];                   // certificates, medals, etc.
  barriers?: BarrierType[];
  barrierActions?: string[];                 // what's being done about barriers
  childChosenActivity: boolean;              // child chose this themselves
  sustainedFromPreviousPlacement: boolean;   // maintained from before
  notes?: string;
}

export interface ActivityPlan {
  childId: string;
  lastReviewDate: string;
  nextReviewDate: string;
  interestsExplored: string[];               // interests identified in key-work
  newExperiencesOffered: string[];           // new things tried this quarter
  monthlyBudget: number;                     // £ allocated
  monthlySpend: number;                      // £ actually spent
  preferredActivities: string[];             // what child says they enjoy
}

export interface ChildActivitiesProfile {
  childId: string;
  childName: string;
  homeId: string;
  age: number;
  activities: ActivityRecord[];
  plan: ActivityPlan;
  activitiesCancelledAsPunishment: number;   // should always be 0
  barriersIdentified: BarrierType[];
  barriersResolved: BarrierType[];
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ActivitiesComplianceResult {
  childId: string;
  childName: string;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  // Participation
  totalActiveActivities: number;
  communityBasedCount: number;
  inHomeCount: number;
  communityRate: number;                     // % community vs in-home
  // Diversity
  categoriesRepresented: number;
  totalCategories: number;
  diversityScore: number;                    // 0-100
  // Engagement
  childChosenRate: number;                   // % activities child chose themselves
  newExperiencesThisQuarter: number;
  droppedOutCount: number;
  // Financial
  monthlyBudget: number;
  monthlySpend: number;
  budgetUtilisation: number;                 // %
  // Barriers
  unresolvedBarriers: number;
  // Achievements
  achievementsCount: number;
  // Continuity
  sustainedFromPrevious: number;
  // Plan
  planInPlace: boolean;
  planReviewCurrent: boolean;
  // Normalcy
  activitiesCancelledAsPunishment: number;
}

export interface HomeActivitiesMetrics {
  homeId: string;
  totalChildren: number;
  // Participation
  averageActivitiesPerChild: number;
  childrenWithNoActivities: number;
  totalCommunityActivities: number;
  averageCommunityRate: number;
  // Diversity
  averageDiversityScore: number;
  leastRepresentedCategories: { category: ActivityCategory; count: number }[];
  // Engagement
  averageChildChosenRate: number;
  totalNewExperiences: number;
  totalDroppedOut: number;
  // Financial
  totalMonthlyBudget: number;
  totalMonthlySpend: number;
  averageBudgetUtilisation: number;
  // Barriers
  totalUnresolvedBarriers: number;
  mostCommonBarriers: { barrier: BarrierType; count: number }[];
  // Achievements
  totalAchievements: number;
  // Compliance
  complianceIssues: string[];
  overallScore: number;
}

// ── Configuration ──────────────────────────────────────────────────────────

const ALL_CATEGORIES: ActivityCategory[] = [
  "sport_team", "sport_individual", "creative_arts", "outdoor_adventure",
  "academic_enrichment", "cultural", "religious_spiritual", "life_skills",
  "social_community", "health_wellbeing", "hobbies_interests", "identity_heritage",
];

const MIN_ACTIVE_ACTIVITIES = 2;
const MIN_COMMUNITY_RATE = 50;              // at least 50% should be community-based
const MIN_DIVERSITY_CATEGORIES = 3;         // at least 3 different categories
const PLAN_REVIEW_INTERVAL_DAYS = 90;       // quarterly review

// ── Core: Evaluate Child Activities Compliance ──────────────────────────────

export function evaluateChildActivitiesCompliance(
  profile: ChildActivitiesProfile,
  now?: string,
): ActivitiesComplianceResult {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const issues: string[] = [];
  const warnings: string[] = [];

  // Active activities (ongoing or participation level not dropped/refused)
  const activeActivities = profile.activities.filter(
    a => !a.endDate && (a.participationLevel === "regular" || a.participationLevel === "occasional")
  );
  const totalActiveActivities = activeActivities.length;

  if (totalActiveActivities < MIN_ACTIVE_ACTIVITIES) {
    issues.push(`Only ${totalActiveActivities} active activity/activities — minimum ${MIN_ACTIVE_ACTIVITIES} expected`);
  }

  // Community vs in-home
  const communityBasedCount = activeActivities.filter(a => a.communityBased).length;
  const inHomeCount = totalActiveActivities - communityBasedCount;
  const communityRate = totalActiveActivities > 0
    ? Math.round((communityBasedCount / totalActiveActivities) * 100)
    : 0;

  if (totalActiveActivities > 0 && communityRate < MIN_COMMUNITY_RATE) {
    warnings.push(`Low community integration — only ${communityRate}% activities are community-based`);
  }

  // Diversity
  const activeCategories = new Set(activeActivities.map(a => a.category));
  const categoriesRepresented = activeCategories.size;
  const diversityScore = Math.round((categoriesRepresented / ALL_CATEGORIES.length) * 100);

  if (categoriesRepresented < MIN_DIVERSITY_CATEGORIES && totalActiveActivities >= MIN_ACTIVE_ACTIVITIES) {
    warnings.push(`Limited diversity — only ${categoriesRepresented} activity categories represented`);
  }

  // Child chosen rate
  const childChosenActivities = activeActivities.filter(a => a.childChosenActivity);
  const childChosenRate = totalActiveActivities > 0
    ? Math.round((childChosenActivities.length / totalActiveActivities) * 100)
    : 0;

  if (totalActiveActivities > 0 && childChosenRate < 50) {
    warnings.push(`Low child choice — only ${childChosenRate}% of activities were child-chosen`);
  }

  // New experiences
  const newExperiencesThisQuarter = profile.plan.newExperiencesOffered.length;
  if (newExperiencesThisQuarter === 0) {
    warnings.push("No new experiences offered this quarter");
  }

  // Dropped out
  const droppedOutCount = profile.activities.filter(a => a.participationLevel === "dropped_out").length;
  if (droppedOutCount >= 3) {
    warnings.push(`${droppedOutCount} activities dropped — explore barriers`);
  }

  // Financial
  const { monthlyBudget, monthlySpend } = profile.plan;
  const budgetUtilisation = monthlyBudget > 0
    ? Math.round((monthlySpend / monthlyBudget) * 100)
    : 0;

  if (budgetUtilisation < 50 && monthlyBudget > 0) {
    warnings.push(`Low activity budget utilisation (${budgetUtilisation}%) — funds available but not used`);
  }

  // Barriers
  const unresolvedBarriers = profile.barriersIdentified.filter(
    b => !profile.barriersResolved.includes(b)
  ).length;

  if (unresolvedBarriers > 0) {
    warnings.push(`${unresolvedBarriers} unresolved barrier(s) to participation`);
  }

  // Achievements
  const achievementsCount = profile.activities.reduce(
    (sum, a) => sum + (a.achievements?.length ?? 0), 0
  );

  // Continuity
  const sustainedFromPrevious = profile.activities.filter(a => a.sustainedFromPreviousPlacement).length;

  // Plan
  const planInPlace = true; // if profile exists, plan exists
  const reviewDueTime = new Date(profile.plan.nextReviewDate).getTime();
  const planReviewCurrent = reviewDueTime > currentTime;

  if (!planReviewCurrent) {
    issues.push("Activity plan review overdue");
  }

  // Punishment check
  if (profile.activitiesCancelledAsPunishment > 0) {
    issues.push(`${profile.activitiesCancelledAsPunishment} activity/activities cancelled as punishment — breach of Reg 19`);
  }

  return {
    childId: profile.childId,
    childName: profile.childName,
    isCompliant: issues.length === 0,
    issues,
    warnings,
    totalActiveActivities,
    communityBasedCount,
    inHomeCount,
    communityRate,
    categoriesRepresented,
    totalCategories: ALL_CATEGORIES.length,
    diversityScore,
    childChosenRate,
    newExperiencesThisQuarter,
    droppedOutCount,
    monthlyBudget,
    monthlySpend,
    budgetUtilisation,
    unresolvedBarriers,
    achievementsCount,
    sustainedFromPrevious,
    planInPlace,
    planReviewCurrent,
    activitiesCancelledAsPunishment: profile.activitiesCancelledAsPunishment,
  };
}

// ── Core: Calculate Home Activities Metrics ─────────────────────────────────

export function calculateHomeActivitiesMetrics(
  profiles: ChildActivitiesProfile[],
  homeId: string,
  now?: string,
): HomeActivitiesMetrics {
  const homeProfiles = profiles.filter(p => p.homeId === homeId);
  const totalChildren = homeProfiles.length;

  if (totalChildren === 0) {
    return {
      homeId,
      totalChildren: 0,
      averageActivitiesPerChild: 0,
      childrenWithNoActivities: 0,
      totalCommunityActivities: 0,
      averageCommunityRate: 0,
      averageDiversityScore: 0,
      leastRepresentedCategories: [],
      averageChildChosenRate: 0,
      totalNewExperiences: 0,
      totalDroppedOut: 0,
      totalMonthlyBudget: 0,
      totalMonthlySpend: 0,
      averageBudgetUtilisation: 0,
      totalUnresolvedBarriers: 0,
      mostCommonBarriers: [],
      totalAchievements: 0,
      complianceIssues: [],
      overallScore: 0,
    };
  }

  const results = homeProfiles.map(p => evaluateChildActivitiesCompliance(p, now));

  // Participation
  const totalActive = results.reduce((s, r) => s + r.totalActiveActivities, 0);
  const averageActivitiesPerChild = Math.round((totalActive / totalChildren) * 10) / 10;
  const childrenWithNoActivities = results.filter(r => r.totalActiveActivities === 0).length;
  const totalCommunityActivities = results.reduce((s, r) => s + r.communityBasedCount, 0);
  const averageCommunityRate = Math.round(
    results.reduce((s, r) => s + r.communityRate, 0) / results.length
  );

  // Diversity
  const averageDiversityScore = Math.round(
    results.reduce((s, r) => s + r.diversityScore, 0) / results.length
  );

  // Least represented categories
  const categoryCounts: Record<string, number> = {};
  ALL_CATEGORIES.forEach(c => { categoryCounts[c] = 0; });
  homeProfiles.forEach(p => {
    const active = p.activities.filter(a => !a.endDate && (a.participationLevel === "regular" || a.participationLevel === "occasional"));
    active.forEach(a => {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    });
  });
  const leastRepresentedCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category: category as ActivityCategory, count }))
    .sort((a, b) => a.count - b.count)
    .slice(0, 5);

  // Engagement
  const averageChildChosenRate = Math.round(
    results.reduce((s, r) => s + r.childChosenRate, 0) / results.length
  );
  const totalNewExperiences = results.reduce((s, r) => s + r.newExperiencesThisQuarter, 0);
  const totalDroppedOut = results.reduce((s, r) => s + r.droppedOutCount, 0);

  // Financial
  const totalMonthlyBudget = homeProfiles.reduce((s, p) => s + p.plan.monthlyBudget, 0);
  const totalMonthlySpend = homeProfiles.reduce((s, p) => s + p.plan.monthlySpend, 0);
  const averageBudgetUtilisation = Math.round(
    results.reduce((s, r) => s + r.budgetUtilisation, 0) / results.length
  );

  // Barriers
  const totalUnresolvedBarriers = results.reduce((s, r) => s + r.unresolvedBarriers, 0);
  const barrierCounts: Record<string, number> = {};
  homeProfiles.forEach(p => {
    const unresolved = p.barriersIdentified.filter(b => !p.barriersResolved.includes(b));
    unresolved.forEach(b => {
      barrierCounts[b] = (barrierCounts[b] || 0) + 1;
    });
  });
  const mostCommonBarriers = Object.entries(barrierCounts)
    .map(([barrier, count]) => ({ barrier: barrier as BarrierType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Achievements
  const totalAchievements = results.reduce((s, r) => s + r.achievementsCount, 0);

  // Compliance
  const complianceIssues = [...new Set(results.flatMap(r => r.issues))];

  // Overall score (composite)
  const participationScore = Math.min(100, Math.round((averageActivitiesPerChild / 4) * 100));
  const communityScore = averageCommunityRate;
  const choiceScore = averageChildChosenRate;
  const budgetScore = averageBudgetUtilisation;
  const barrierScore = totalUnresolvedBarriers === 0 ? 100 : Math.max(0, 100 - (totalUnresolvedBarriers * 20));
  const overallScore = Math.round(
    (participationScore * 0.25) + (communityScore * 0.2) + (averageDiversityScore * 0.2) +
    (choiceScore * 0.15) + (budgetScore * 0.1) + (barrierScore * 0.1)
  );

  return {
    homeId,
    totalChildren,
    averageActivitiesPerChild,
    childrenWithNoActivities,
    totalCommunityActivities,
    averageCommunityRate,
    averageDiversityScore,
    leastRepresentedCategories,
    averageChildChosenRate,
    totalNewExperiences,
    totalDroppedOut,
    totalMonthlyBudget,
    totalMonthlySpend,
    averageBudgetUtilisation,
    totalUnresolvedBarriers,
    mostCommonBarriers,
    totalAchievements,
    complianceIssues,
    overallScore,
  };
}

// ── Label Helpers ────────────────────────────────────────────────────────

export function getActivityCategoryLabel(category: ActivityCategory): string {
  const labels: Record<ActivityCategory, string> = {
    sport_team: "Team Sports",
    sport_individual: "Individual Sports",
    creative_arts: "Creative Arts",
    outdoor_adventure: "Outdoor/Adventure",
    academic_enrichment: "Academic Enrichment",
    cultural: "Cultural Activities",
    religious_spiritual: "Religious/Spiritual",
    life_skills: "Life Skills",
    social_community: "Social/Community",
    health_wellbeing: "Health & Wellbeing",
    hobbies_interests: "Hobbies/Interests",
    identity_heritage: "Identity/Heritage",
  };
  return labels[category] ?? category;
}

export function getBarrierLabel(barrier: BarrierType): string {
  const labels: Record<BarrierType, string> = {
    financial: "Financial",
    transport: "Transport",
    confidence: "Confidence/Anxiety",
    peer_issues: "Peer Issues",
    timing_clash: "Timing Clash",
    health_condition: "Health Condition",
    consent_required: "Consent Needed",
    placement_restriction: "Placement Restriction",
    staffing: "Staffing/Availability",
    not_available_locally: "Not Available Locally",
  };
  return labels[barrier] ?? barrier;
}
