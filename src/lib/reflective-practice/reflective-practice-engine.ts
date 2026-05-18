// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Professional Development & Reflective Practice Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// "Ofsted expects leaders to create a culture of learning and reflection
//  where staff continuously develop their practice."
// — SCCIF 2023
//
// Regulatory framework:
//   CHR 2015 Reg 13          — Leadership and management (developing staff)
//   CHR 2015 Reg 33(4)(a)    — Staff receive practice-related supervision
//   CHR 2015 Reg 33(4)(b)    — Staff receive training and support
//   SCCIF                    — "Effectiveness of leaders and managers"
//                               Inspectors look for evidence of a learning culture,
//                               reflective supervision, team development, and
//                               professional growth
//   Working Together 2023     — Reflective practice in safeguarding
//
// This module goes beyond training compliance (covered by staff-training)
// to track whether staff are actively developing their practice through
// reflection, peer learning, and professional development activities.
//
// Key indicators:
//   1. Staff engage in regular reflective activities
//   2. Learning leads to practice changes (not just "tick-box")
//   3. Learning is shared across the team
//   4. Activities link to outcomes for children
//   5. Staff have development goals and make progress
//   6. Team learning is embedded (debriefs, case discussions)
//
// Scoring breakdown (0–100):
//   Reflective engagement:    25  — Frequency and breadth of activities
//   Learning outcomes:        30  — Practice change, sharing, child links
//   Team learning:            25  — Team sessions, shared learning, diversity
//   Goal progress:            20  — Achievement rate, coverage, timeliness
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReflectiveActivityType =
  | "reflective_journal"
  | "supervision_reflection"
  | "team_debrief"
  | "peer_observation"
  | "case_discussion"
  | "practice_workshop"
  | "external_conference"
  | "reading_research"
  | "action_learning_set"
  | "coaching_session"
  | "mentoring"
  | "practice_audit";

export type LearningOutcome =
  | "new_insight"
  | "practice_change"
  | "skill_development"
  | "confidence_growth"
  | "no_clear_outcome"
  | "shared_with_team";

export type PracticeArea =
  | "therapeutic_care"
  | "safeguarding"
  | "behaviour_support"
  | "communication"
  | "recording"
  | "risk_assessment"
  | "leadership"
  | "trauma_informed"
  | "attachment"
  | "participation"
  | "equality_diversity"
  | "legislation"
  | "general";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface ReflectiveActivity {
  id: string;
  homeId: string;
  staffId: string;
  staffName: string;
  date: string;                       // ISO date
  activityType: ReflectiveActivityType;
  practiceArea: PracticeArea;
  title: string;
  description: string;
  durationMinutes: number;
  learningOutcomes: LearningOutcome[];
  sharedWithTeam: boolean;
  linkedToChildOutcome: boolean;
  linkedChildId?: string;
  linkedChildName?: string;
  facilitatedBy?: string;
  evidenceRecorded: boolean;
}

export interface PracticeDevelopmentGoal {
  id: string;
  staffId: string;
  staffName: string;
  goalDescription: string;
  practiceArea: PracticeArea;
  targetDate: string;                 // ISO date
  status: "not_started" | "in_progress" | "achieved" | "revised" | "discontinued";
  achievedDate?: string;              // ISO date
  reviewDate: string;                 // ISO date
}

export interface StaffProfile {
  staffId: string;
  staffName: string;
  role: string;
  startDate: string;                  // ISO date
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface EngagementResult {
  totalActivities: number;
  activitiesPerStaff: number;
  staffWithZeroActivities: string[];
  activityTypeDistribution: Record<string, number>;
  practiceAreaDistribution: Record<string, number>;
  totalHours: number;
  avgHoursPerStaff: number;
  engagementRate: number;             // % of staff with >= 1 activity per month avg
}

export interface LearningOutcomeResult {
  totalOutcomes: number;
  practiceChangeRate: number;
  skillDevelopmentRate: number;
  sharedWithTeamRate: number;
  linkedToChildOutcomeRate: number;
  noOutcomeRate: number;
}

export interface TeamLearningResult {
  teamActivities: ReflectiveActivity[];
  totalTeamSessions: number;
  avgAttendance: number;
  topTeamTopics: { practiceArea: string; count: number }[];
  sharedLearningRate: number;
}

export interface GoalProgressResult {
  totalGoals: number;
  achieved: number;
  inProgress: number;
  overdue: number;
  achievementRate: number;
  overdueGoals: { staffName: string; goalDescription: string; targetDate: string; daysPastDue: number }[];
  practiceAreaDistribution: Record<string, number>;
}

export interface StaffDevelopmentProfile {
  staffId: string;
  staffName: string;
  totalActivities: number;
  totalHours: number;
  practiceChangeCount: number;
  goalsAchieved: number;
  activeGoals: number;
  reflectiveScore: number;
  developmentRating: "exemplary" | "engaged" | "developing" | "minimal";
}

export interface ReflectivePracticeResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  engagement: EngagementResult;
  learningOutcomes: LearningOutcomeResult;
  teamLearning: TeamLearningResult;
  goalProgress: GoalProgressResult;
  staffProfiles: StaffDevelopmentProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const TEAM_ACTIVITY_TYPES: ReflectiveActivityType[] = [
  "team_debrief",
  "case_discussion",
  "practice_workshop",
  "action_learning_set",
];

const ACTIVITY_TYPE_LABELS: Record<ReflectiveActivityType, string> = {
  reflective_journal: "Reflective Journal",
  supervision_reflection: "Supervision Reflection",
  team_debrief: "Team Debrief",
  peer_observation: "Peer Observation",
  case_discussion: "Case Discussion",
  practice_workshop: "Practice Workshop",
  external_conference: "External Conference",
  reading_research: "Reading & Research",
  action_learning_set: "Action Learning Set",
  coaching_session: "Coaching Session",
  mentoring: "Mentoring",
  practice_audit: "Practice Audit",
};

const PRACTICE_AREA_LABELS: Record<PracticeArea, string> = {
  therapeutic_care: "Therapeutic Care",
  safeguarding: "Safeguarding",
  behaviour_support: "Behaviour Support",
  communication: "Communication",
  recording: "Recording & Documentation",
  risk_assessment: "Risk Assessment",
  leadership: "Leadership",
  trauma_informed: "Trauma-Informed Practice",
  attachment: "Attachment",
  participation: "Children's Participation",
  equality_diversity: "Equality & Diversity",
  legislation: "Legislation & Policy",
  general: "General",
};

// ── Label Functions ──────────────────────────────────────────────────────────

export function getActivityTypeLabel(t: ReflectiveActivityType): string {
  return ACTIVITY_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function getPracticeAreaLabel(a: PracticeArea): string {
  return PRACTICE_AREA_LABELS[a] ?? a.replace(/_/g, " ");
}

export function getTeamActivityTypes(): ReflectiveActivityType[] {
  return [...TEAM_ACTIVITY_TYPES];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function daysBetween(earlier: string, later: string): number {
  const diff = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function monthsBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return Math.max(1, months);
}

// ── Core Functions ───────────────────────────────────────────────────────────

export function evaluateReflectiveEngagement(
  activities: ReflectiveActivity[],
  staff: StaffProfile[],
  periodStart: string,
  periodEnd: string,
): EngagementResult {
  const periodActivities = activities.filter((a) =>
    inPeriod(a.date, periodStart, periodEnd),
  );

  const totalActivities = periodActivities.length;
  const totalStaff = staff.length;
  const activitiesPerStaff = totalStaff === 0 ? 0 : Math.round((totalActivities / totalStaff) * 10) / 10;

  // Staff with zero activities
  const staffWithActivities = new Set(periodActivities.map((a) => a.staffId));
  const staffWithZeroActivities = staff
    .filter((s) => !staffWithActivities.has(s.staffId))
    .map((s) => s.staffName);

  // Activity type distribution
  const activityTypeDistribution: Record<string, number> = {};
  for (const a of periodActivities) {
    activityTypeDistribution[a.activityType] = (activityTypeDistribution[a.activityType] ?? 0) + 1;
  }

  // Practice area distribution
  const practiceAreaDistribution: Record<string, number> = {};
  for (const a of periodActivities) {
    practiceAreaDistribution[a.practiceArea] = (practiceAreaDistribution[a.practiceArea] ?? 0) + 1;
  }

  // Total hours
  const totalMinutes = periodActivities.reduce((sum, a) => sum + a.durationMinutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const avgHoursPerStaff = totalStaff === 0 ? 0 : Math.round((totalHours / totalStaff) * 10) / 10;

  // Engagement rate: % of staff with >= 1 activity per month on average
  const months = monthsBetween(periodStart, periodEnd);
  const staffEngaged = staff.filter((s) => {
    const staffActivities = periodActivities.filter((a) => a.staffId === s.staffId);
    return staffActivities.length >= months;
  }).length;
  const engagementRate = pct(staffEngaged, totalStaff);

  return {
    totalActivities,
    activitiesPerStaff,
    staffWithZeroActivities,
    activityTypeDistribution,
    practiceAreaDistribution,
    totalHours,
    avgHoursPerStaff,
    engagementRate,
  };
}

export function evaluateLearningOutcomes(
  activities: ReflectiveActivity[],
  periodStart: string,
  periodEnd: string,
): LearningOutcomeResult {
  const periodActivities = activities.filter((a) =>
    inPeriod(a.date, periodStart, periodEnd),
  );

  const total = periodActivities.length;

  // Count outcomes across all activities
  const allOutcomes = periodActivities.flatMap((a) => a.learningOutcomes);
  const totalOutcomes = allOutcomes.length;

  // Activities leading to specific outcomes
  const practiceChangeCount = periodActivities.filter((a) =>
    a.learningOutcomes.includes("practice_change"),
  ).length;
  const skillDevCount = periodActivities.filter((a) =>
    a.learningOutcomes.includes("skill_development"),
  ).length;
  const sharedCount = periodActivities.filter((a) => a.sharedWithTeam).length;
  const linkedCount = periodActivities.filter((a) => a.linkedToChildOutcome).length;
  const noOutcomeCount = periodActivities.filter((a) =>
    a.learningOutcomes.includes("no_clear_outcome"),
  ).length;

  return {
    totalOutcomes,
    practiceChangeRate: pct(practiceChangeCount, total),
    skillDevelopmentRate: pct(skillDevCount, total),
    sharedWithTeamRate: pct(sharedCount, total),
    linkedToChildOutcomeRate: pct(linkedCount, total),
    noOutcomeRate: pct(noOutcomeCount, total),
  };
}

export function evaluateTeamLearning(
  activities: ReflectiveActivity[],
  periodStart: string,
  periodEnd: string,
): TeamLearningResult {
  const periodActivities = activities.filter((a) =>
    inPeriod(a.date, periodStart, periodEnd),
  );

  // Team activities: debriefs, case discussions, workshops, action learning sets
  const teamActivities = periodActivities.filter((a) =>
    TEAM_ACTIVITY_TYPES.includes(a.activityType),
  );
  const totalTeamSessions = teamActivities.length;

  // Average attendance: count distinct staff per unique team session date+type
  const sessionKeys = new Map<string, Set<string>>();
  for (const a of teamActivities) {
    const key = `${a.date}-${a.activityType}`;
    if (!sessionKeys.has(key)) {
      sessionKeys.set(key, new Set());
    }
    sessionKeys.get(key)!.add(a.staffId);
  }
  let avgAttendance = 0;
  if (sessionKeys.size > 0) {
    const totalAttendees = Array.from(sessionKeys.values()).reduce((sum, s) => sum + s.size, 0);
    avgAttendance = Math.round((totalAttendees / sessionKeys.size) * 10) / 10;
  }

  // Top team topics
  const topicCounts: Record<string, number> = {};
  for (const a of teamActivities) {
    topicCounts[a.practiceArea] = (topicCounts[a.practiceArea] ?? 0) + 1;
  }
  const topTeamTopics = Object.entries(topicCounts)
    .map(([practiceArea, count]) => ({ practiceArea, count }))
    .sort((a, b) => b.count - a.count);

  // Shared learning rate: % of all activities where learning was shared
  const sharedCount = periodActivities.filter((a) => a.sharedWithTeam).length;
  const sharedLearningRate = pct(sharedCount, periodActivities.length);

  return {
    teamActivities,
    totalTeamSessions,
    avgAttendance,
    topTeamTopics,
    sharedLearningRate,
  };
}

export function evaluateGoalProgress(
  goals: PracticeDevelopmentGoal[],
  referenceDate: string,
): GoalProgressResult {
  const totalGoals = goals.length;

  const achieved = goals.filter((g) => g.status === "achieved").length;
  const inProgress = goals.filter((g) => g.status === "in_progress").length;

  // Overdue: in_progress or not_started with targetDate before referenceDate
  const overdueGoals = goals
    .filter((g) =>
      (g.status === "in_progress" || g.status === "not_started") &&
      g.targetDate < referenceDate,
    )
    .map((g) => ({
      staffName: g.staffName,
      goalDescription: g.goalDescription,
      targetDate: g.targetDate,
      daysPastDue: daysBetween(g.targetDate, referenceDate),
    }))
    .sort((a, b) => b.daysPastDue - a.daysPastDue);

  const overdue = overdueGoals.length;
  const achievementRate = pct(achieved, totalGoals);

  // Practice area distribution
  const practiceAreaDistribution: Record<string, number> = {};
  for (const g of goals) {
    practiceAreaDistribution[g.practiceArea] = (practiceAreaDistribution[g.practiceArea] ?? 0) + 1;
  }

  return {
    totalGoals,
    achieved,
    inProgress,
    overdue,
    achievementRate,
    overdueGoals,
    practiceAreaDistribution,
  };
}

export function buildStaffDevelopmentProfiles(
  activities: ReflectiveActivity[],
  goals: PracticeDevelopmentGoal[],
  staff: StaffProfile[],
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): StaffDevelopmentProfile[] {
  return staff.map((s) => {
    const staffActivities = activities.filter(
      (a) => a.staffId === s.staffId && inPeriod(a.date, periodStart, periodEnd),
    );
    const staffGoals = goals.filter((g) => g.staffId === s.staffId);

    const totalActivities = staffActivities.length;
    const totalMinutes = staffActivities.reduce((sum, a) => sum + a.durationMinutes, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    const practiceChangeCount = staffActivities.filter((a) =>
      a.learningOutcomes.includes("practice_change"),
    ).length;

    const goalsAchieved = staffGoals.filter((g) => g.status === "achieved").length;
    const activeGoals = staffGoals.filter((g) =>
      g.status === "in_progress" || g.status === "not_started",
    ).length;

    // Reflective score per staff (0-100):
    // Activities breadth (30): diverse activity types
    // Outcomes quality (30): practice changes and sharing
    // Goal progress (20): achieved goals
    // Consistency (20): activities per month
    const months = monthsBetween(periodStart, periodEnd);
    const activitiesPerMonth = totalActivities / months;
    const uniqueTypes = new Set(staffActivities.map((a) => a.activityType)).size;
    const sharedCount = staffActivities.filter((a) => a.sharedWithTeam).length;

    // Activities breadth (30)
    let breadthScore = 0;
    if (uniqueTypes >= 5) breadthScore = 30;
    else if (uniqueTypes >= 3) breadthScore = 22;
    else if (uniqueTypes >= 2) breadthScore = 14;
    else if (uniqueTypes >= 1) breadthScore = 7;

    // Outcomes quality (30)
    let outcomeScore = 0;
    if (totalActivities > 0) {
      const pcRate = pct(practiceChangeCount, totalActivities);
      const shareRate = pct(sharedCount, totalActivities);
      if (pcRate >= 40) outcomeScore += 15;
      else if (pcRate >= 20) outcomeScore += 10;
      else if (pcRate >= 10) outcomeScore += 5;
      if (shareRate >= 50) outcomeScore += 15;
      else if (shareRate >= 30) outcomeScore += 10;
      else if (shareRate >= 10) outcomeScore += 5;
    }

    // Goal progress (20)
    let goalScore = 0;
    const totalStaffGoals = staffGoals.length;
    if (totalStaffGoals > 0) {
      const achieveRate = pct(goalsAchieved, totalStaffGoals);
      if (achieveRate >= 60) goalScore = 20;
      else if (achieveRate >= 40) goalScore = 14;
      else if (achieveRate >= 20) goalScore = 8;
    } else {
      // No goals set = no score
      goalScore = 0;
    }

    // Consistency (20)
    let consistencyScore = 0;
    if (activitiesPerMonth >= 3) consistencyScore = 20;
    else if (activitiesPerMonth >= 2) consistencyScore = 15;
    else if (activitiesPerMonth >= 1) consistencyScore = 10;
    else if (activitiesPerMonth >= 0.5) consistencyScore = 5;

    const reflectiveScore = Math.min(100, Math.max(0,
      breadthScore + outcomeScore + goalScore + consistencyScore,
    ));

    let developmentRating: StaffDevelopmentProfile["developmentRating"];
    if (reflectiveScore >= 75) developmentRating = "exemplary";
    else if (reflectiveScore >= 50) developmentRating = "engaged";
    else if (reflectiveScore >= 25) developmentRating = "developing";
    else developmentRating = "minimal";

    return {
      staffId: s.staffId,
      staffName: s.staffName,
      totalActivities,
      totalHours,
      practiceChangeCount,
      goalsAchieved,
      activeGoals,
      reflectiveScore,
      developmentRating,
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateReflectivePracticeIntelligence(
  activities: ReflectiveActivity[],
  goals: PracticeDevelopmentGoal[],
  staff: StaffProfile[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): ReflectivePracticeResult {
  const engagement = evaluateReflectiveEngagement(activities, staff, periodStart, periodEnd);
  const learningOutcomes = evaluateLearningOutcomes(activities, periodStart, periodEnd);
  const teamLearning = evaluateTeamLearning(activities, periodStart, periodEnd);
  const goalProgress = evaluateGoalProgress(goals, referenceDate);
  const staffProfiles = buildStaffDevelopmentProfiles(activities, goals, staff, periodStart, periodEnd, referenceDate);

  // ── Scoring ──────────────────────────────────────────────────────────

  // 1. Engagement (25): activities per staff per month
  const months = monthsBetween(periodStart, periodEnd);
  const activitiesPerStaffPerMonth = staff.length > 0
    ? engagement.totalActivities / staff.length / months
    : 0;

  let engagementScore = 0;
  if (activitiesPerStaffPerMonth >= 3) engagementScore = 25;
  else if (activitiesPerStaffPerMonth >= 2) engagementScore = 20;
  else if (activitiesPerStaffPerMonth >= 1) engagementScore = 14;
  else if (staff.length > 0) engagementScore = 6;

  // 2. Learning outcomes (30): practice change + sharing + child link
  let learningScore = 0;
  if (learningOutcomes.practiceChangeRate >= 40) learningScore += 15;
  else if (learningOutcomes.practiceChangeRate >= 20) learningScore += 10;
  else if (learningOutcomes.practiceChangeRate >= 10) learningScore += 5;

  if (learningOutcomes.sharedWithTeamRate >= 50) learningScore += 8;
  else if (learningOutcomes.sharedWithTeamRate >= 30) learningScore += 5;
  else if (learningOutcomes.sharedWithTeamRate >= 10) learningScore += 2;

  if (learningOutcomes.linkedToChildOutcomeRate >= 30) learningScore += 7;
  else if (learningOutcomes.linkedToChildOutcomeRate >= 15) learningScore += 4;
  else if (learningOutcomes.linkedToChildOutcomeRate >= 5) learningScore += 2;

  // 3. Team learning (25): team sessions + shared rate + diverse areas
  let teamScore = 0;
  const teamSessionsPerMonth = teamLearning.totalTeamSessions / months;
  if (teamSessionsPerMonth >= 2) teamScore += 12;
  else if (teamSessionsPerMonth >= 1) teamScore += 8;
  else if (teamSessionsPerMonth >= 0.5) teamScore += 4;

  if (teamLearning.sharedLearningRate >= 60) teamScore += 8;
  else if (teamLearning.sharedLearningRate >= 40) teamScore += 5;
  else if (teamLearning.sharedLearningRate >= 20) teamScore += 2;

  // Diverse practice areas: count unique areas in activities
  const uniqueAreas = Object.keys(engagement.practiceAreaDistribution).length;
  if (uniqueAreas >= 6) teamScore += 5;
  else if (uniqueAreas >= 4) teamScore += 3;
  else if (uniqueAreas >= 2) teamScore += 1;

  // 4. Goal progress (20): achievement + coverage + timeliness
  let goalScore = 0;
  if (goalProgress.achievementRate >= 60) goalScore += 12;
  else if (goalProgress.achievementRate >= 40) goalScore += 8;
  else if (goalProgress.achievementRate >= 20) goalScore += 4;

  // All staff have goals
  const staffWithGoals = new Set(goals.map((g) => g.staffId));
  const allStaffHaveGoals = staff.length > 0 && staff.every((s) => staffWithGoals.has(s.staffId));
  if (allStaffHaveGoals) goalScore += 5;

  // No overdue goals
  if (goalProgress.overdue === 0 && goalProgress.totalGoals > 0) goalScore += 3;

  const overallScore = Math.min(100, Math.max(0,
    engagementScore + learningScore + teamScore + goalScore,
  ));

  const rating: ReflectivePracticeResult["rating"] =
    overallScore >= 80 ? "outstanding"
    : overallScore >= 60 ? "good"
    : overallScore >= 40 ? "requires_improvement"
    : "inadequate";

  // ── Strengths / Areas / Actions ──────────────────────────────────────

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Strengths
  if (activitiesPerStaffPerMonth >= 3) {
    strengths.push("Excellent reflective engagement — staff averaging 3+ activities per month");
  } else if (activitiesPerStaffPerMonth >= 2) {
    strengths.push("Good reflective engagement — staff averaging 2+ activities per month");
  }

  if (learningOutcomes.practiceChangeRate >= 40) {
    strengths.push(`Strong practice change culture — ${learningOutcomes.practiceChangeRate}% of activities leading to practice changes`);
  }

  if (learningOutcomes.sharedWithTeamRate >= 50) {
    strengths.push(`Learning regularly shared across team — ${learningOutcomes.sharedWithTeamRate}% shared with team`);
  }

  if (learningOutcomes.linkedToChildOutcomeRate >= 30) {
    strengths.push(`Reflective practice linked to children's outcomes — ${learningOutcomes.linkedToChildOutcomeRate}% connected to child outcomes`);
  }

  if (teamSessionsPerMonth >= 2) {
    strengths.push("Regular team learning sessions embedded in practice");
  }

  if (goalProgress.achievementRate >= 60 && goalProgress.totalGoals > 0) {
    strengths.push(`Strong goal achievement — ${goalProgress.achievementRate}% of development goals achieved`);
  }

  if (allStaffHaveGoals && staff.length > 0) {
    strengths.push("All staff have practice development goals");
  }

  if (engagement.staffWithZeroActivities.length === 0 && staff.length > 0) {
    strengths.push("All staff participating in reflective activities");
  }

  if (strengths.length === 0) {
    strengths.push("No significant strengths identified — reflective practice culture requires development");
  }

  // Areas for improvement
  if (engagement.staffWithZeroActivities.length > 0) {
    areasForImprovement.push(
      `${engagement.staffWithZeroActivities.length} staff member${engagement.staffWithZeroActivities.length !== 1 ? "s" : ""} with no reflective activities: ${engagement.staffWithZeroActivities.join(", ")}`,
    );
  }

  if (learningOutcomes.practiceChangeRate < 20 && engagement.totalActivities > 0) {
    areasForImprovement.push(
      `Low practice change rate at ${learningOutcomes.practiceChangeRate}% — reflective activities not translating into practice improvements`,
    );
  }

  if (learningOutcomes.sharedWithTeamRate < 30 && engagement.totalActivities > 0) {
    areasForImprovement.push(
      `Only ${learningOutcomes.sharedWithTeamRate}% of learning shared with team — increase peer learning opportunities`,
    );
  }

  if (teamSessionsPerMonth < 1 && staff.length > 0) {
    areasForImprovement.push(
      "Fewer than 1 team learning session per month — embed regular debriefs and case discussions",
    );
  }

  if (goalProgress.overdue > 0) {
    areasForImprovement.push(
      `${goalProgress.overdue} overdue development goal${goalProgress.overdue !== 1 ? "s" : ""} — review and update in supervision`,
    );
  }

  if (!allStaffHaveGoals && staff.length > 0) {
    const staffWithoutGoals = staff.filter((s) => !staffWithGoals.has(s.staffId));
    areasForImprovement.push(
      `${staffWithoutGoals.length} staff member${staffWithoutGoals.length !== 1 ? "s" : ""} without development goals — set goals in next supervision`,
    );
  }

  if (learningOutcomes.noOutcomeRate > 30 && engagement.totalActivities > 0) {
    areasForImprovement.push(
      `${learningOutcomes.noOutcomeRate}% of activities recording no clear outcome — improve quality of reflection`,
    );
  }

  if (areasForImprovement.length === 0) {
    areasForImprovement.push("No significant areas for improvement identified");
  }

  // Actions
  if (engagement.staffWithZeroActivities.length > 0) {
    actions.push(
      `Support ${engagement.staffWithZeroActivities.join(", ")} to begin reflective practice activities — discuss in next supervision`,
    );
  }

  if (teamSessionsPerMonth < 1 && staff.length > 0) {
    actions.push(
      "Schedule at least one team debrief or case discussion per month",
    );
  }

  if (goalProgress.overdue > 0) {
    actions.push(
      `Review ${goalProgress.overdue} overdue development goal${goalProgress.overdue !== 1 ? "s" : ""} in supervision — update or revise targets`,
    );
  }

  if (learningOutcomes.linkedToChildOutcomeRate < 15 && engagement.totalActivities > 0) {
    actions.push(
      "Encourage staff to link reflective activities to specific children's outcomes",
    );
  }

  if (!allStaffHaveGoals && staff.length > 0) {
    actions.push(
      "Ensure all staff have at least one practice development goal — add to supervision agenda",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required — reflective practice culture is well established",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 13 — Leadership and management (developing staff)",
    "CHR 2015 Reg 33(4)(a) — Practice-related supervision",
    "CHR 2015 Reg 33(4)(b) — Staff training and support",
    "SCCIF — Effectiveness of leaders and managers (learning culture)",
    "Working Together 2023 — Reflective practice in safeguarding",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    engagement,
    learningOutcomes,
    teamLearning,
    goalProgress,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
