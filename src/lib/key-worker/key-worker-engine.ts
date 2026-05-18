// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Key Worker Relationship Quality Intelligence Engine
//
// Deterministic engine for evaluating key worker session consistency,
// child voice representation, relationship quality indicators, goal
// progress, and overall relationship quality intelligence.
//
// Aligned to:
//   - CHR 2015 Reg 10 — Positive relationships
//   - CHR 2015 Reg 14 — Care planning
//   - SCCIF — Experience of Children (quality of relationships)
//   - UNCRC Article 12 — Right to be heard
//   - Working Together 2023 — Child-centred practice
//
// Key principles:
//   - Every child has a named key worker with regular, quality sessions
//   - Child voice is central to all planning and review
//   - Relationships are built on trust, warmth, and consistency
//   - Goals are co-produced, reviewed, and progressed
//   - Trauma-informed and culturally responsive practice throughout
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type SessionType =
  | "one_to_one"
  | "activity_based"
  | "review"
  | "goal_setting"
  | "crisis_support"
  | "informal_check_in";

export type SessionStatus =
  | "completed"
  | "cancelled_by_child"
  | "cancelled_by_staff"
  | "rescheduled"
  | "missed";

export type VoiceIndicator =
  | "wishes_recorded"
  | "feelings_expressed"
  | "choices_offered"
  | "views_influenced_plan"
  | "disagreement_noted"
  | "advocacy_offered";

export type RelationshipQualityIndicator =
  | "trust_building"
  | "consistent_boundaries"
  | "warmth_demonstrated"
  | "active_listening"
  | "child_led"
  | "culturally_responsive"
  | "trauma_informed";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface KeyWorkerSession {
  id: string;
  childId: string;
  childName: string;
  keyWorkerId: string;
  keyWorkerName: string;
  date: string;
  duration: number; // minutes
  sessionType: SessionType;
  status: SessionStatus;
  topicsDiscussed: string[];
  childVoiceIndicators: VoiceIndicator[];
  relationshipIndicators: RelationshipQualityIndicator[];
  goalsReviewed: string[];
  goalsSet: string[];
  childFeedback?: string;
  keyWorkerReflection?: string;
}

export interface KeyWorkerAssignment {
  childId: string;
  childName: string;
  primaryKeyWorkerId: string;
  primaryKeyWorkerName: string;
  secondaryKeyWorkerId?: string;
  secondaryKeyWorkerName?: string;
  assignmentDate: string;
  lastChangeDate?: string;
  changeReason?: string;
}

export interface KeyWorkerGoal {
  id: string;
  childId: string;
  childName: string;
  setBySession: string;
  goalDescription: string;
  category: "emotional" | "behavioural" | "educational" | "social" | "health" | "independence";
  targetDate: string;
  status: "active" | "achieved" | "partially_achieved" | "not_achieved" | "deferred";
  reviewNotes?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface SessionConsistencyResult {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  cancellationRate: number;
  cancelledByChild: number;
  cancelledByStaff: number;
  rescheduled: number;
  missed: number;
  averageDuration: number;
  sessionsPerChildPerMonth: Record<string, number>;
  sessionTypeBreakdown: Record<SessionType, number>;
  sessionTypeVariety: number; // count of distinct types used
  childrenBelowMinimum: string[]; // children with < 2 sessions/month
}

export interface ChildVoiceResult {
  totalVoiceIndicators: number;
  voiceIndicatorFrequency: Record<VoiceIndicator, number>;
  perChildVoicePresence: Record<string, number>; // childId -> % of sessions with any voice indicator
  indicatorsDrivingPlanChanges: number; // count of views_influenced_plan
  planInfluenceRate: number; // % of sessions with views_influenced_plan
  childrenWithLowVoice: string[]; // children with < 50% voice presence
  averageVoiceScore: number; // 0-100
}

export interface RelationshipQualityResult {
  totalIndicators: number;
  indicatorFrequency: Record<RelationshipQualityIndicator, number>;
  perChildQualityScore: Record<string, number>; // 0-100
  traumaInformedRate: number; // % of sessions with trauma_informed
  culturallyResponsiveRate: number; // % of sessions with culturally_responsive
  averageQualityScore: number; // 0-100
}

export interface GoalProgressResult {
  totalGoals: number;
  achievedGoals: number;
  achievementRate: number;
  partiallyAchieved: number;
  notAchieved: number;
  deferred: number;
  deferredRate: number;
  activeGoals: number;
  activeGoalsPerChild: Record<string, number>;
  categoryBreakdown: Record<string, { total: number; achieved: number; rate: number }>;
}

export interface ChildKeyWorkerProfile {
  childId: string;
  childName: string;
  primaryKeyWorkerId: string;
  primaryKeyWorkerName: string;
  secondaryKeyWorkerName?: string;
  totalSessions: number;
  completedSessions: number;
  voiceScore: number; // 0-100
  relationshipScore: number; // 0-100
  goalProgress: number; // 0-100 (achievement rate)
  activeGoals: number;
  consistencyRating: "excellent" | "good" | "fair" | "poor";
  lastSessionDate: string | null;
  sessionTypes: SessionType[];
}

export interface RegulatoryLink {
  regulation: string;
  description: string;
  status: "met" | "partially_met" | "not_met";
  evidence: string;
}

export interface KeyWorkerIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  overallScore: number;
  overallRating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  sessionConsistency: SessionConsistencyResult;
  childVoice: ChildVoiceResult;
  relationshipQuality: RelationshipQualityResult;
  goalProgress: GoalProgressResult;
  childProfiles: ChildKeyWorkerProfile[];
  scoring: {
    sessionConsistencyScore: number;
    childVoiceScore: number;
    relationshipQualityScore: number;
    goalProgressScore: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: RegulatoryLink[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const MIN_SESSIONS_PER_MONTH = 2;
const LOW_VOICE_THRESHOLD = 50; // % below which voice is flagged
const ALL_VOICE_INDICATORS: VoiceIndicator[] = [
  "wishes_recorded",
  "feelings_expressed",
  "choices_offered",
  "views_influenced_plan",
  "disagreement_noted",
  "advocacy_offered",
];
const ALL_RELATIONSHIP_INDICATORS: RelationshipQualityIndicator[] = [
  "trust_building",
  "consistent_boundaries",
  "warmth_demonstrated",
  "active_listening",
  "child_led",
  "culturally_responsive",
  "trauma_informed",
];
const ALL_SESSION_TYPES: SessionType[] = [
  "one_to_one",
  "activity_based",
  "review",
  "goal_setting",
  "crisis_support",
  "informal_check_in",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.abs(d2 - d1) / (1000 * 60 * 60 * 24);
}

function monthsBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const months =
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return Math.max(1, months);
}

function isInPeriod(date: string, start: string, end: string): boolean {
  const d = new Date(date).getTime();
  return d >= new Date(start).getTime() && d <= new Date(end).getTime();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function uniqueChildIds(sessions: KeyWorkerSession[]): string[] {
  return [...new Set(sessions.map((s) => s.childId))];
}

// ── Core Function 1: Evaluate Session Consistency ─────────────────────────

export function evaluateSessionConsistency(
  sessions: KeyWorkerSession[],
  assignments: KeyWorkerAssignment[],
  periodStart: string,
  periodEnd: string,
): SessionConsistencyResult {
  const periodSessions = sessions.filter((s) =>
    isInPeriod(s.date, periodStart, periodEnd),
  );

  const completed = periodSessions.filter((s) => s.status === "completed");
  const cancelledByChild = periodSessions.filter(
    (s) => s.status === "cancelled_by_child",
  );
  const cancelledByStaff = periodSessions.filter(
    (s) => s.status === "cancelled_by_staff",
  );
  const rescheduled = periodSessions.filter(
    (s) => s.status === "rescheduled",
  );
  const missed = periodSessions.filter((s) => s.status === "missed");

  const totalSessions = periodSessions.length;
  const completionRate =
    totalSessions > 0
      ? round2((completed.length / totalSessions) * 100)
      : 0;
  const cancellations = cancelledByChild.length + cancelledByStaff.length;
  const cancellationRate =
    totalSessions > 0 ? round2((cancellations / totalSessions) * 100) : 0;

  const durations = completed
    .map((s) => s.duration)
    .filter((d) => d > 0);
  const averageDuration =
    durations.length > 0
      ? round2(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  // Sessions per child per month
  const months = monthsBetween(periodStart, periodEnd);
  const childIds = [
    ...new Set([
      ...assignments.map((a) => a.childId),
      ...periodSessions.map((s) => s.childId),
    ]),
  ];
  const sessionsPerChildPerMonth: Record<string, number> = {};
  for (const childId of childIds) {
    const childCompleted = completed.filter((s) => s.childId === childId);
    sessionsPerChildPerMonth[childId] = round2(childCompleted.length / months);
  }

  // Children below minimum
  const childrenBelowMinimum = childIds.filter(
    (cid) =>
      (sessionsPerChildPerMonth[cid] ?? 0) < MIN_SESSIONS_PER_MONTH,
  );

  // Session type breakdown
  const sessionTypeBreakdown: Record<SessionType, number> = {
    one_to_one: 0,
    activity_based: 0,
    review: 0,
    goal_setting: 0,
    crisis_support: 0,
    informal_check_in: 0,
  };
  for (const s of completed) {
    sessionTypeBreakdown[s.sessionType]++;
  }

  const sessionTypeVariety = ALL_SESSION_TYPES.filter(
    (t) => sessionTypeBreakdown[t] > 0,
  ).length;

  return {
    totalSessions,
    completedSessions: completed.length,
    completionRate,
    cancellationRate,
    cancelledByChild: cancelledByChild.length,
    cancelledByStaff: cancelledByStaff.length,
    rescheduled: rescheduled.length,
    missed: missed.length,
    averageDuration,
    sessionsPerChildPerMonth,
    sessionTypeBreakdown,
    sessionTypeVariety,
    childrenBelowMinimum,
  };
}

// ── Core Function 2: Evaluate Child Voice ─────────────────────────────────

export function evaluateChildVoice(
  sessions: KeyWorkerSession[],
): ChildVoiceResult {
  const completed = sessions.filter((s) => s.status === "completed");

  // Voice indicator frequency across all completed sessions
  const voiceIndicatorFrequency: Record<VoiceIndicator, number> = {
    wishes_recorded: 0,
    feelings_expressed: 0,
    choices_offered: 0,
    views_influenced_plan: 0,
    disagreement_noted: 0,
    advocacy_offered: 0,
  };

  let totalVoiceIndicators = 0;
  for (const s of completed) {
    for (const vi of s.childVoiceIndicators) {
      voiceIndicatorFrequency[vi]++;
      totalVoiceIndicators++;
    }
  }

  // Per-child voice presence (% of completed sessions with at least 1 voice indicator)
  const childIds = uniqueChildIds(completed);
  const perChildVoicePresence: Record<string, number> = {};
  for (const childId of childIds) {
    const childSessions = completed.filter((s) => s.childId === childId);
    const withVoice = childSessions.filter(
      (s) => s.childVoiceIndicators.length > 0,
    );
    perChildVoicePresence[childId] =
      childSessions.length > 0
        ? round2((withVoice.length / childSessions.length) * 100)
        : 0;
  }

  // Plan influence
  const indicatorsDrivingPlanChanges =
    voiceIndicatorFrequency["views_influenced_plan"];
  const planInfluenceRate =
    completed.length > 0
      ? round2(
          (completed.filter((s) =>
            s.childVoiceIndicators.includes("views_influenced_plan"),
          ).length /
            completed.length) *
            100,
        )
      : 0;

  // Children with low voice
  const childrenWithLowVoice = childIds.filter(
    (cid) => (perChildVoicePresence[cid] ?? 0) < LOW_VOICE_THRESHOLD,
  );

  // Average voice score: average of per-child voice presence rates
  const presenceValues = Object.values(perChildVoicePresence);
  const averageVoiceScore =
    presenceValues.length > 0
      ? round2(
          presenceValues.reduce((a, b) => a + b, 0) / presenceValues.length,
        )
      : 0;

  return {
    totalVoiceIndicators,
    voiceIndicatorFrequency,
    perChildVoicePresence,
    indicatorsDrivingPlanChanges,
    planInfluenceRate,
    childrenWithLowVoice,
    averageVoiceScore,
  };
}

// ── Core Function 3: Evaluate Relationship Quality ────────────────────────

export function evaluateRelationshipQuality(
  sessions: KeyWorkerSession[],
): RelationshipQualityResult {
  const completed = sessions.filter((s) => s.status === "completed");

  const indicatorFrequency: Record<RelationshipQualityIndicator, number> = {
    trust_building: 0,
    consistent_boundaries: 0,
    warmth_demonstrated: 0,
    active_listening: 0,
    child_led: 0,
    culturally_responsive: 0,
    trauma_informed: 0,
  };

  let totalIndicators = 0;
  for (const s of completed) {
    for (const ri of s.relationshipIndicators) {
      indicatorFrequency[ri]++;
      totalIndicators++;
    }
  }

  // Per-child quality score: (avg indicators per session / total possible indicators) * 100
  const childIds = uniqueChildIds(completed);
  const perChildQualityScore: Record<string, number> = {};
  for (const childId of childIds) {
    const childSessions = completed.filter((s) => s.childId === childId);
    if (childSessions.length === 0) {
      perChildQualityScore[childId] = 0;
      continue;
    }
    const totalChildIndicators = childSessions.reduce(
      (sum, s) => sum + s.relationshipIndicators.length,
      0,
    );
    const avgPerSession = totalChildIndicators / childSessions.length;
    perChildQualityScore[childId] = round2(
      (avgPerSession / ALL_RELATIONSHIP_INDICATORS.length) * 100,
    );
  }

  // Trauma-informed rate
  const traumaInformedRate =
    completed.length > 0
      ? round2(
          (completed.filter((s) =>
            s.relationshipIndicators.includes("trauma_informed"),
          ).length /
            completed.length) *
            100,
        )
      : 0;

  // Culturally responsive rate
  const culturallyResponsiveRate =
    completed.length > 0
      ? round2(
          (completed.filter((s) =>
            s.relationshipIndicators.includes("culturally_responsive"),
          ).length /
            completed.length) *
            100,
        )
      : 0;

  // Average quality score
  const qualityValues = Object.values(perChildQualityScore);
  const averageQualityScore =
    qualityValues.length > 0
      ? round2(
          qualityValues.reduce((a, b) => a + b, 0) / qualityValues.length,
        )
      : 0;

  return {
    totalIndicators,
    indicatorFrequency,
    perChildQualityScore,
    traumaInformedRate,
    culturallyResponsiveRate,
    averageQualityScore,
  };
}

// ── Core Function 4: Evaluate Goal Progress ───────────────────────────────

export function evaluateGoalProgress(
  goals: KeyWorkerGoal[],
): GoalProgressResult {
  const totalGoals = goals.length;
  const achieved = goals.filter((g) => g.status === "achieved").length;
  const partiallyAchieved = goals.filter(
    (g) => g.status === "partially_achieved",
  ).length;
  const notAchieved = goals.filter((g) => g.status === "not_achieved").length;
  const deferred = goals.filter((g) => g.status === "deferred").length;
  const active = goals.filter((g) => g.status === "active").length;

  const closedGoals = achieved + partiallyAchieved + notAchieved;
  const achievementRate =
    closedGoals > 0 ? round2((achieved / closedGoals) * 100) : 0;
  const deferredRate =
    totalGoals > 0 ? round2((deferred / totalGoals) * 100) : 0;

  // Active goals per child
  const activeGoalsPerChild: Record<string, number> = {};
  for (const g of goals.filter((g) => g.status === "active")) {
    activeGoalsPerChild[g.childId] =
      (activeGoalsPerChild[g.childId] ?? 0) + 1;
  }

  // Category breakdown
  const categories = [
    "emotional",
    "behavioural",
    "educational",
    "social",
    "health",
    "independence",
  ] as const;
  const categoryBreakdown: Record<
    string,
    { total: number; achieved: number; rate: number }
  > = {};
  for (const cat of categories) {
    const catGoals = goals.filter((g) => g.category === cat);
    const catAchieved = catGoals.filter(
      (g) => g.status === "achieved",
    ).length;
    const catClosed = catGoals.filter((g) =>
      ["achieved", "partially_achieved", "not_achieved"].includes(g.status),
    ).length;
    categoryBreakdown[cat] = {
      total: catGoals.length,
      achieved: catAchieved,
      rate: catClosed > 0 ? round2((catAchieved / catClosed) * 100) : 0,
    };
  }

  return {
    totalGoals,
    achievedGoals: achieved,
    achievementRate,
    partiallyAchieved,
    notAchieved,
    deferred,
    deferredRate,
    activeGoals: active,
    activeGoalsPerChild,
    categoryBreakdown,
  };
}

// ── Core Function 5: Build Child Key Worker Profiles ──────────────────────

export function buildChildKeyWorkerProfiles(
  sessions: KeyWorkerSession[],
  assignments: KeyWorkerAssignment[],
  goals: KeyWorkerGoal[],
): ChildKeyWorkerProfile[] {
  const profiles: ChildKeyWorkerProfile[] = [];

  for (const assignment of assignments) {
    const childSessions = sessions.filter(
      (s) => s.childId === assignment.childId,
    );
    const completed = childSessions.filter((s) => s.status === "completed");
    const childGoals = goals.filter(
      (g) => g.childId === assignment.childId,
    );

    // Voice score: % of completed sessions with any voice indicator
    const withVoice = completed.filter(
      (s) => s.childVoiceIndicators.length > 0,
    );
    const voiceScore =
      completed.length > 0
        ? round2((withVoice.length / completed.length) * 100)
        : 0;

    // Relationship score: avg indicators per session / total possible * 100
    const totalIndicators = completed.reduce(
      (sum, s) => sum + s.relationshipIndicators.length,
      0,
    );
    const avgPerSession =
      completed.length > 0 ? totalIndicators / completed.length : 0;
    const relationshipScore = round2(
      (avgPerSession / ALL_RELATIONSHIP_INDICATORS.length) * 100,
    );

    // Goal progress: achievement rate of closed goals
    const closedGoals = childGoals.filter((g) =>
      ["achieved", "partially_achieved", "not_achieved"].includes(g.status),
    );
    const achieved = childGoals.filter(
      (g) => g.status === "achieved",
    ).length;
    const goalProgress =
      closedGoals.length > 0
        ? round2((achieved / closedGoals.length) * 100)
        : 0;

    const activeGoals = childGoals.filter(
      (g) => g.status === "active",
    ).length;

    // Consistency rating based on completion rate
    const completionRate =
      childSessions.length > 0
        ? (completed.length / childSessions.length) * 100
        : 0;
    let consistencyRating: "excellent" | "good" | "fair" | "poor";
    if (completionRate >= 90) consistencyRating = "excellent";
    else if (completionRate >= 75) consistencyRating = "good";
    else if (completionRate >= 60) consistencyRating = "fair";
    else consistencyRating = "poor";

    // Last session date
    const sortedCompleted = [...completed].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const lastSessionDate =
      sortedCompleted.length > 0 ? sortedCompleted[0].date : null;

    // Session types used
    const sessionTypes = [
      ...new Set(completed.map((s) => s.sessionType)),
    ];

    profiles.push({
      childId: assignment.childId,
      childName: assignment.childName,
      primaryKeyWorkerId: assignment.primaryKeyWorkerId,
      primaryKeyWorkerName: assignment.primaryKeyWorkerName,
      secondaryKeyWorkerName: assignment.secondaryKeyWorkerName,
      totalSessions: childSessions.length,
      completedSessions: completed.length,
      voiceScore,
      relationshipScore,
      goalProgress,
      activeGoals,
      consistencyRating,
      lastSessionDate,
      sessionTypes,
    });
  }

  return profiles;
}

// ── Core Function 6: Generate Key Worker Intelligence ─────────────────────

export function generateKeyWorkerIntelligence(
  sessions: KeyWorkerSession[],
  assignments: KeyWorkerAssignment[],
  goals: KeyWorkerGoal[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): KeyWorkerIntelligenceResult {
  const periodSessions = sessions.filter((s) =>
    isInPeriod(s.date, periodStart, periodEnd),
  );

  // Run all evaluations
  const sessionConsistency = evaluateSessionConsistency(
    sessions,
    assignments,
    periodStart,
    periodEnd,
  );
  const childVoice = evaluateChildVoice(periodSessions);
  const relationshipQuality = evaluateRelationshipQuality(periodSessions);
  const goalProgress = evaluateGoalProgress(goals);
  const childProfiles = buildChildKeyWorkerProfiles(
    periodSessions,
    assignments,
    goals,
  );

  // ── Scoring ──────────────────────────────────────────────────────────

  // Session consistency score (25 points)
  // - Frequency: up to 10 pts (based on avg sessions per child per month vs target)
  // - Completion rate: up to 10 pts
  // - Variety: up to 5 pts
  const avgSessionsPerMonth =
    Object.values(sessionConsistency.sessionsPerChildPerMonth).length > 0
      ? Object.values(sessionConsistency.sessionsPerChildPerMonth).reduce(
          (a, b) => a + b,
          0,
        ) /
        Object.values(sessionConsistency.sessionsPerChildPerMonth).length
      : 0;
  const frequencyScore = clamp(
    (avgSessionsPerMonth / MIN_SESSIONS_PER_MONTH) * 10,
    0,
    10,
  );
  const completionScore = (sessionConsistency.completionRate / 100) * 10;
  const varietyScore = clamp(
    (sessionConsistency.sessionTypeVariety / 4) * 5,
    0,
    5,
  );
  const sessionConsistencyScore = round2(
    frequencyScore + completionScore + varietyScore,
  );

  // Child voice score (30 points)
  // - Voice presence: up to 20 pts (average voice score across children)
  // - Plan influence: up to 10 pts
  const voicePresenceScore = (childVoice.averageVoiceScore / 100) * 20;
  const planInfluenceScore = clamp(
    (childVoice.planInfluenceRate / 50) * 10,
    0,
    10,
  );
  const childVoiceScore = round2(voicePresenceScore + planInfluenceScore);

  // Relationship quality score (25 points)
  // - Quality indicators: up to 15 pts
  // - Trauma-informed: up to 5 pts
  // - Culturally responsive: up to 5 pts
  const qualityIndicatorScore =
    (relationshipQuality.averageQualityScore / 100) * 15;
  const traumaScore = clamp(
    (relationshipQuality.traumaInformedRate / 80) * 5,
    0,
    5,
  );
  const culturalScore = clamp(
    (relationshipQuality.culturallyResponsiveRate / 80) * 5,
    0,
    5,
  );
  const relationshipQualityScore = round2(
    qualityIndicatorScore + traumaScore + culturalScore,
  );

  // Goal progress score (20 points)
  // - Achievement rate: up to 10 pts
  // - Active goals (each child should have some): up to 5 pts
  // - Low deferral: up to 5 pts
  const achievementScore = (goalProgress.achievementRate / 100) * 10;
  const childCount = assignments.length;
  const childrenWithActiveGoals = Object.keys(
    goalProgress.activeGoalsPerChild,
  ).length;
  const activeGoalsScore =
    childCount > 0
      ? clamp((childrenWithActiveGoals / childCount) * 5, 0, 5)
      : 0;
  const deferralScore = clamp(
    ((100 - goalProgress.deferredRate) / 100) * 5,
    0,
    5,
  );
  const goalProgressScore = round2(
    achievementScore + activeGoalsScore + deferralScore,
  );

  // Overall
  const overallScore = round2(
    sessionConsistencyScore +
      childVoiceScore +
      relationshipQualityScore +
      goalProgressScore,
  );

  let overallRating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  if (overallScore >= 80) overallRating = "outstanding";
  else if (overallScore >= 60) overallRating = "good";
  else if (overallScore >= 40) overallRating = "requires_improvement";
  else overallRating = "inadequate";

  // ── Strengths / Areas / Actions ──────────────────────────────────────

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Session consistency insights
  if (sessionConsistency.completionRate >= 85) {
    strengths.push("High session completion rate demonstrates commitment to regular key working");
  }
  if (sessionConsistency.completionRate < 70) {
    areasForImprovement.push("Session completion rate below 70% — children not receiving consistent key working");
    actions.push("Review session scheduling and staffing to improve completion rates");
  }
  if (sessionConsistency.childrenBelowMinimum.length > 0) {
    areasForImprovement.push(
      `${sessionConsistency.childrenBelowMinimum.length} child(ren) below minimum session frequency`,
    );
    actions.push("Ensure all children receive at least 2 key worker sessions per month");
  }
  if (sessionConsistency.sessionTypeVariety >= 4) {
    strengths.push("Good variety of session types — children engaged through multiple approaches");
  }

  // Child voice insights
  if (childVoice.averageVoiceScore >= 80) {
    strengths.push("Strong child voice representation — children's wishes and feelings consistently captured");
  }
  if (childVoice.childrenWithLowVoice.length > 0) {
    areasForImprovement.push(
      `${childVoice.childrenWithLowVoice.length} child(ren) with low voice representation in sessions`,
    );
    actions.push("Implement structured voice tools (e.g. talking mats, wish lists) for children with low voice scores");
  }
  if (childVoice.planInfluenceRate >= 40) {
    strengths.push("Children's views actively influencing care planning decisions");
  }
  if (childVoice.planInfluenceRate < 20) {
    areasForImprovement.push("Low rate of children's views influencing care plans");
    actions.push("Ensure child views from key working sessions are documented and acted upon in care plan reviews");
  }

  // Relationship quality insights
  if (relationshipQuality.averageQualityScore >= 70) {
    strengths.push("High relationship quality indicators across sessions");
  }
  if (relationshipQuality.traumaInformedRate >= 60) {
    strengths.push("Trauma-informed practice embedded in key working approach");
  }
  if (relationshipQuality.traumaInformedRate < 40) {
    areasForImprovement.push("Trauma-informed practice not consistently evidenced in sessions");
    actions.push("Provide trauma-informed practice refresher training for all key workers");
  }
  if (relationshipQuality.culturallyResponsiveRate < 30) {
    areasForImprovement.push("Culturally responsive practice not evidenced in sufficient sessions");
    actions.push("Review cultural needs assessments and ensure key workers address cultural identity in sessions");
  }

  // Goal progress insights
  if (goalProgress.achievementRate >= 70) {
    strengths.push("Strong goal achievement rate — children progressing toward outcomes");
  }
  if (goalProgress.achievementRate < 40) {
    areasForImprovement.push("Low goal achievement rate — review whether goals are realistic and appropriately supported");
    actions.push("Review goal-setting approach to ensure goals are SMART and co-produced with children");
  }
  if (goalProgress.deferredRate > 25) {
    areasForImprovement.push("High deferral rate suggests goals may not be achievable or well-supported");
    actions.push("Audit deferred goals and consider if alternative approaches or support are needed");
  }

  // ── Regulatory Links ─────────────────────────────────────────────────

  const regulatoryLinks: RegulatoryLink[] = [
    {
      regulation: "CHR 2015 Reg 10",
      description: "Positive relationships — children must be supported to develop positive relationships with staff",
      status:
        relationshipQuality.averageQualityScore >= 60
          ? "met"
          : relationshipQuality.averageQualityScore >= 40
            ? "partially_met"
            : "not_met",
      evidence: `Average relationship quality score: ${relationshipQuality.averageQualityScore}%. Trauma-informed rate: ${relationshipQuality.traumaInformedRate}%`,
    },
    {
      regulation: "CHR 2015 Reg 14",
      description: "Care planning — care plans reviewed and informed by child's wishes",
      status:
        childVoice.planInfluenceRate >= 30 && goalProgress.achievementRate >= 50
          ? "met"
          : childVoice.planInfluenceRate >= 15 || goalProgress.achievementRate >= 30
            ? "partially_met"
            : "not_met",
      evidence: `Plan influence rate: ${childVoice.planInfluenceRate}%. Goal achievement rate: ${goalProgress.achievementRate}%`,
    },
    {
      regulation: "SCCIF Experience of Children",
      description: "Quality of relationships and child-centred practice",
      status:
        overallScore >= 60
          ? "met"
          : overallScore >= 40
            ? "partially_met"
            : "not_met",
      evidence: `Overall key worker quality score: ${overallScore}/100 (${overallRating})`,
    },
    {
      regulation: "UNCRC Article 12",
      description: "Right to be heard — children's views given due weight",
      status:
        childVoice.averageVoiceScore >= 70 &&
        childVoice.childrenWithLowVoice.length === 0
          ? "met"
          : childVoice.averageVoiceScore >= 50
            ? "partially_met"
            : "not_met",
      evidence: `Average voice score: ${childVoice.averageVoiceScore}%. Children with low voice: ${childVoice.childrenWithLowVoice.length}`,
    },
    {
      regulation: "Working Together 2023",
      description: "Child-centred practice with effective multi-agency collaboration",
      status:
        sessionConsistency.completionRate >= 75 &&
        childVoice.averageVoiceScore >= 60
          ? "met"
          : sessionConsistency.completionRate >= 50
            ? "partially_met"
            : "not_met",
      evidence: `Session completion: ${sessionConsistency.completionRate}%. Voice score: ${childVoice.averageVoiceScore}%`,
    },
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    generatedAt: referenceDate,
    overallScore,
    overallRating,
    sessionConsistency,
    childVoice,
    relationshipQuality,
    goalProgress,
    childProfiles,
    scoring: {
      sessionConsistencyScore,
      childVoiceScore,
      relationshipQualityScore,
      goalProgressScore,
    },
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
