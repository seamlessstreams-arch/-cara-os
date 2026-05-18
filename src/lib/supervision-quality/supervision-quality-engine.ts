// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Supervision Quality Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Evaluates supervision quality across:
//   - Session quality (quality ratings, reflective practice, safeguarding)
//   - Schedule compliance (frequency, overdue sessions, consecutive missed)
//   - Action tracking (completion rates, safeguarding actions, categories)
//   - Staff development (skill improvement, wellbeing concerns)
//
// Regulatory framework:
//   CHR 2015 Reg 33 — employment of staff
//   CHR 2015 Reg 13 — leadership and management
//   SCCIF — leadership and management
//   NMS 19 — staffing of children's homes
//   NMS 20 — learning and development
//   Working Together 2023 — supervision requirements
//   Munro Review — reflective supervision
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type SupervisionType =
  | "formal_individual"
  | "group"
  | "peer"
  | "management"
  | "clinical"
  | "safeguarding";

export type SupervisionFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "six_weekly"
  | "quarterly"
  | "ad_hoc";

export type SupervisionQuality =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate";

export type ReflectivePracticeLevel =
  | "deeply_reflective"
  | "reflective"
  | "surface_level"
  | "not_reflective";

export type ActionCompletionStatus =
  | "completed_on_time"
  | "completed_late"
  | "in_progress"
  | "overdue"
  | "not_started";

export type WellbeingCheckOutcome =
  | "no_concerns"
  | "minor_concerns_addressed"
  | "significant_concerns"
  | "urgent_referral";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface SupervisionSession {
  id: string;
  staffId: string;
  staffName: string;
  supervisorId: string;
  supervisorName: string;
  date: string;
  durationMinutes: number;
  supervisionType: SupervisionType;
  quality: SupervisionQuality;
  reflectivePracticeLevel: ReflectivePracticeLevel;
  safeguardingDiscussed: boolean;
  childrenDiscussed: string[];
  actionsAgreed: number;
  actionsCompleted: number;
  wellbeingCheck: WellbeingCheckOutcome;
  recordedTimely: boolean;
  staffSignedOff: boolean;
  supervisorSignedOff: boolean;
}

export interface SupervisionSchedule {
  id: string;
  staffId: string;
  staffName: string;
  requiredFrequency: SupervisionFrequency;
  lastSessionDate: string;
  nextDueDate: string;
  consecutiveMissed: number;
  overdue: boolean;
}

export interface SupervisionAction {
  id: string;
  sessionId: string;
  staffId: string;
  staffName: string;
  description: string;
  targetDate: string;
  status: ActionCompletionStatus;
  category: "practice" | "training" | "wellbeing" | "safeguarding" | "development";
}

export interface StaffDevelopmentOutcome {
  id: string;
  staffId: string;
  staffName: string;
  skillArea: string;
  startLevel: number;
  currentLevel: number;
  improvementPlan: boolean;
  targetDate: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface SessionQualityResult {
  overallScore: number;
  totalSessions: number;
  outstandingGoodRate: number;
  reflectiveRate: number;
  safeguardingDiscussionRate: number;
  averageDurationMinutes: number;
  recordingComplianceRate: number;
  signOffRate: number;
}

export interface ScheduleComplianceResult {
  overallScore: number;
  totalStaff: number;
  onScheduleRate: number;
  overdueCount: number;
  consecutiveMissedMax: number;
  averageDaysBetweenSessions: number;
}

export interface ActionTrackingResult {
  overallScore: number;
  totalActions: number;
  completedOnTimeRate: number;
  overdueCount: number;
  safeguardingActionCompletionRate: number;
  byCategory: Record<string, number>;
}

export interface StaffDevelopmentResult {
  overallScore: number;
  totalOutcomes: number;
  improvementRate: number;
  withPlanRate: number;
  averageSkillImprovement: number;
  wellbeingConcernRate: number;
}

export interface StaffSupervisionProfile {
  staffId: string;
  staffName: string;
  sessionCount: number;
  qualityAverage: SupervisionQuality | "none";
  lastSessionDate: string | null;
  overdue: boolean;
  actionsCompleted: number;
  actionsOutstanding: number;
  overallScore: number;
}

export interface SupervisionQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  sessionQuality: SessionQualityResult;
  scheduleCompliance: ScheduleComplianceResult;
  actionTracking: ActionTrackingResult;
  staffDevelopment: StaffDevelopmentResult;
  staffProfiles: StaffSupervisionProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getSupervisionTypeLabel(t: SupervisionType): string {
  const labels: Record<SupervisionType, string> = {
    formal_individual: "Formal Individual",
    group: "Group",
    peer: "Peer",
    management: "Management",
    clinical: "Clinical",
    safeguarding: "Safeguarding",
  };
  return labels[t] || t;
}

export function getSupervisionFrequencyLabel(f: SupervisionFrequency): string {
  const labels: Record<SupervisionFrequency, string> = {
    weekly: "Weekly",
    fortnightly: "Fortnightly",
    monthly: "Monthly",
    six_weekly: "Six-Weekly",
    quarterly: "Quarterly",
    ad_hoc: "Ad Hoc",
  };
  return labels[f] || f;
}

export function getSupervisionQualityLabel(q: SupervisionQuality): string {
  const labels: Record<SupervisionQuality, string> = {
    outstanding: "Outstanding",
    good: "Good",
    adequate: "Adequate",
    inadequate: "Inadequate",
  };
  return labels[q] || q;
}

export function getReflectivePracticeLevelLabel(r: ReflectivePracticeLevel): string {
  const labels: Record<ReflectivePracticeLevel, string> = {
    deeply_reflective: "Deeply Reflective",
    reflective: "Reflective",
    surface_level: "Surface Level",
    not_reflective: "Not Reflective",
  };
  return labels[r] || r;
}

export function getActionCompletionStatusLabel(s: ActionCompletionStatus): string {
  const labels: Record<ActionCompletionStatus, string> = {
    completed_on_time: "Completed On Time",
    completed_late: "Completed Late",
    in_progress: "In Progress",
    overdue: "Overdue",
    not_started: "Not Started",
  };
  return labels[s] || s;
}

export function getWellbeingCheckOutcomeLabel(w: WellbeingCheckOutcome): string {
  const labels: Record<WellbeingCheckOutcome, string> = {
    no_concerns: "No Concerns",
    minor_concerns_addressed: "Minor Concerns Addressed",
    significant_concerns: "Significant Concerns",
    urgent_referral: "Urgent Referral",
  };
  return labels[w] || w;
}

export function getRatingLabel(r: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[r] || r;
}

// ── Quality Score Mapping ──────────────────────────────────────────────────

const QUALITY_SCORES: Record<SupervisionQuality, number> = {
  outstanding: 4,
  good: 3,
  adequate: 2,
  inadequate: 1,
};

// ── Core Evaluation Functions ──────────────────────────────────────────────

/**
 * Evaluate supervision session quality.
 * Checks: outstanding+good rate, reflective practice, safeguarding discussion,
 *         recording compliance, sign-off rate, average duration.
 * Score: 0-25
 */
export function evaluateSessionQuality(
  sessions: SupervisionSession[],
): SessionQualityResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      outstandingGoodRate: 0,
      reflectiveRate: 0,
      safeguardingDiscussionRate: 0,
      averageDurationMinutes: 0,
      recordingComplianceRate: 0,
      signOffRate: 0,
    };
  }

  const total = sessions.length;

  // Outstanding + good rate
  const outstandingGoodCount = sessions.filter(
    (s) => s.quality === "outstanding" || s.quality === "good",
  ).length;
  const outstandingGoodRate = pct(outstandingGoodCount, total);

  // Reflective practice rate (deeply_reflective or reflective)
  const reflectiveCount = sessions.filter(
    (s) =>
      s.reflectivePracticeLevel === "deeply_reflective" ||
      s.reflectivePracticeLevel === "reflective",
  ).length;
  const reflectiveRate = pct(reflectiveCount, total);

  // Safeguarding discussion rate
  const safeguardingCount = sessions.filter(
    (s) => s.safeguardingDiscussed,
  ).length;
  const safeguardingDiscussionRate = pct(safeguardingCount, total);

  // Average duration
  const totalDuration = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const averageDurationMinutes = Math.round(totalDuration / total);

  // Recording compliance (recorded timely)
  const recordedTimelyCount = sessions.filter((s) => s.recordedTimely).length;
  const recordingComplianceRate = pct(recordedTimelyCount, total);

  // Sign-off rate (both staff and supervisor signed off)
  const signedOffCount = sessions.filter(
    (s) => s.staffSignedOff && s.supervisorSignedOff,
  ).length;
  const signOffRate = pct(signedOffCount, total);

  // Scoring: 0-25
  let score = 0;

  // Outstanding/good rate: up to 8 points
  score += (outstandingGoodRate / 100) * 8;

  // Reflective practice: up to 6 points
  score += (reflectiveRate / 100) * 6;

  // Safeguarding discussion: up to 5 points
  score += (safeguardingDiscussionRate / 100) * 5;

  // Recording compliance: up to 3 points
  score += (recordingComplianceRate / 100) * 3;

  // Sign-off rate: up to 3 points
  score += (signOffRate / 100) * 3;

  return {
    overallScore: clamp(Math.round(score * 10) / 10, 0, 25),
    totalSessions: total,
    outstandingGoodRate,
    reflectiveRate,
    safeguardingDiscussionRate,
    averageDurationMinutes,
    recordingComplianceRate,
    signOffRate,
  };
}

/**
 * Evaluate schedule compliance.
 * Checks: on-schedule rate, overdue count, consecutive missed.
 * Penalties: -3 per staff with consecutiveMissed > 2, -5 for any with 3+ consecutive missed.
 * Score: 0-25
 */
export function evaluateScheduleCompliance(
  schedules: SupervisionSchedule[],
): ScheduleComplianceResult {
  if (schedules.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      onScheduleRate: 0,
      overdueCount: 0,
      consecutiveMissedMax: 0,
      averageDaysBetweenSessions: 0,
    };
  }

  const totalStaff = schedules.length;

  // On-schedule rate: not overdue
  const onScheduleCount = schedules.filter((s) => !s.overdue).length;
  const onScheduleRate = pct(onScheduleCount, totalStaff);

  // Overdue count
  const overdueCount = schedules.filter((s) => s.overdue).length;

  // Max consecutive missed
  const consecutiveMissedMax = Math.max(
    ...schedules.map((s) => s.consecutiveMissed),
    0,
  );

  // Average days between sessions
  const now = new Date();
  let totalDays = 0;
  let validCount = 0;
  for (const sch of schedules) {
    if (sch.lastSessionDate && sch.nextDueDate) {
      const last = new Date(sch.lastSessionDate);
      const next = new Date(sch.nextDueDate);
      const diff = Math.round(
        (next.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff > 0) {
        totalDays += diff;
        validCount++;
      }
    }
  }
  const averageDaysBetweenSessions =
    validCount > 0 ? Math.round(totalDays / validCount) : 0;

  // Scoring: 0-25
  let score = 0;

  // On-schedule rate: up to 20 points
  score += (onScheduleRate / 100) * 20;

  // Bonus: +5 if 100% on schedule
  if (onScheduleRate === 100) score += 5;

  // Penalty: -3 per staff with consecutiveMissed > 2
  const staffWithConsecutiveMissedOver2 = schedules.filter(
    (s) => s.consecutiveMissed > 2,
  ).length;
  score -= staffWithConsecutiveMissedOver2 * 3;

  // Penalty: -5 for any staff with 3+ consecutive missed
  const anyWith3PlusMissed = schedules.some((s) => s.consecutiveMissed >= 3);
  if (anyWith3PlusMissed) score -= 5;

  return {
    overallScore: clamp(Math.round(score * 10) / 10, 0, 25),
    totalStaff,
    onScheduleRate,
    overdueCount,
    consecutiveMissedMax,
    averageDaysBetweenSessions,
  };
}

/**
 * Evaluate action tracking.
 * Checks: completed on time rate, overdue count, safeguarding action completion.
 * Penalty for overdue safeguarding actions.
 * Score: 0-25
 */
export function evaluateActionTracking(
  actions: SupervisionAction[],
): ActionTrackingResult {
  if (actions.length === 0) {
    return {
      overallScore: 0,
      totalActions: 0,
      completedOnTimeRate: 0,
      overdueCount: 0,
      safeguardingActionCompletionRate: 0,
      byCategory: {},
    };
  }

  const total = actions.length;

  // Completed on time rate
  const completedOnTimeCount = actions.filter(
    (a) => a.status === "completed_on_time",
  ).length;
  const completedOnTimeRate = pct(completedOnTimeCount, total);

  // Overdue count
  const overdueCount = actions.filter((a) => a.status === "overdue").length;

  // Safeguarding action completion rate
  const safeguardingActions = actions.filter(
    (a) => a.category === "safeguarding",
  );
  const safeguardingCompleted = safeguardingActions.filter(
    (a) =>
      a.status === "completed_on_time" || a.status === "completed_late",
  ).length;
  const safeguardingActionCompletionRate = pct(
    safeguardingCompleted,
    safeguardingActions.length,
  );

  // By category count
  const byCategory: Record<string, number> = {};
  for (const a of actions) {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
  }

  // Scoring: 0-25
  let score = 0;

  // Completed on time rate: up to 12 points
  score += (completedOnTimeRate / 100) * 12;

  // Safeguarding action completion: up to 8 points
  if (safeguardingActions.length > 0) {
    score += (safeguardingActionCompletionRate / 100) * 8;
  } else {
    // No safeguarding actions — neutral, give 4 of 8
    score += 4;
  }

  // Bonus: +5 if no overdue actions
  if (overdueCount === 0) score += 5;

  // Penalty: -3 per overdue safeguarding action
  const overdueSafeguardingCount = safeguardingActions.filter(
    (a) => a.status === "overdue",
  ).length;
  score -= overdueSafeguardingCount * 3;

  return {
    overallScore: clamp(Math.round(score * 10) / 10, 0, 25),
    totalActions: total,
    completedOnTimeRate,
    overdueCount,
    safeguardingActionCompletionRate,
    byCategory,
  };
}

/**
 * Evaluate staff development outcomes.
 * Checks: improvement rate, plans in place, skill improvement, wellbeing concerns.
 * Score: 0-25
 */
export function evaluateStaffDevelopment(
  outcomes: StaffDevelopmentOutcome[],
  sessions: SupervisionSession[],
): StaffDevelopmentResult {
  // Extract wellbeing concern rate from sessions
  const wellbeingConcernCount = sessions.filter(
    (s) =>
      s.wellbeingCheck === "significant_concerns" ||
      s.wellbeingCheck === "urgent_referral",
  ).length;
  const wellbeingConcernRate = pct(wellbeingConcernCount, sessions.length);

  if (outcomes.length === 0) {
    return {
      overallScore: 0,
      totalOutcomes: 0,
      improvementRate: 0,
      withPlanRate: 0,
      averageSkillImprovement: 0,
      wellbeingConcernRate,
    };
  }

  const total = outcomes.length;

  // Improvement rate: staff who improved (currentLevel > startLevel)
  const improvedCount = outcomes.filter(
    (o) => o.currentLevel > o.startLevel,
  ).length;
  const improvementRate = pct(improvedCount, total);

  // With improvement plan rate
  const withPlanCount = outcomes.filter((o) => o.improvementPlan).length;
  const withPlanRate = pct(withPlanCount, total);

  // Average skill improvement
  const totalImprovement = outcomes.reduce(
    (sum, o) => sum + (o.currentLevel - o.startLevel),
    0,
  );
  const averageSkillImprovement =
    Math.round((totalImprovement / total) * 100) / 100;

  // Scoring: 0-25
  let score = 0;

  // Improvement rate: up to 10 points
  score += (improvementRate / 100) * 10;

  // With plan rate: up to 5 points
  score += (withPlanRate / 100) * 5;

  // Average skill improvement: up to 5 points (1 level improvement = 5 pts)
  score += clamp(averageSkillImprovement, 0, 1) * 5;

  // Wellbeing management: up to 5 points
  // Lower concern rate = better (concerns handled or absent)
  if (wellbeingConcernRate <= 5) {
    score += 5;
  } else if (wellbeingConcernRate <= 15) {
    score += 3;
  } else if (wellbeingConcernRate <= 30) {
    score += 1;
  }

  return {
    overallScore: clamp(Math.round(score * 10) / 10, 0, 25),
    totalOutcomes: total,
    improvementRate,
    withPlanRate,
    averageSkillImprovement,
    wellbeingConcernRate,
  };
}

// ── Staff Profile Builder ──────────────────────────────────────────────────

export function buildStaffSupervisionProfiles(
  sessions: SupervisionSession[],
  schedules: SupervisionSchedule[],
  actions: SupervisionAction[],
): StaffSupervisionProfile[] {
  // Collect all unique staff IDs
  const staffIds = new Set<string>();
  const staffNames = new Map<string, string>();

  for (const s of sessions) {
    staffIds.add(s.staffId);
    staffNames.set(s.staffId, s.staffName);
  }
  for (const s of schedules) {
    staffIds.add(s.staffId);
    staffNames.set(s.staffId, s.staffName);
  }
  for (const a of actions) {
    staffIds.add(a.staffId);
    staffNames.set(a.staffId, a.staffName);
  }

  return Array.from(staffIds).map((staffId) => {
    const staffSessions = sessions.filter((s) => s.staffId === staffId);
    const staffSchedule = schedules.find((s) => s.staffId === staffId);
    const staffActions = actions.filter((a) => a.staffId === staffId);

    // Session count
    const sessionCount = staffSessions.length;

    // Quality average
    let qualityAverage: SupervisionQuality | "none" = "none";
    if (staffSessions.length > 0) {
      const totalQualityScore = staffSessions.reduce(
        (sum, s) => sum + QUALITY_SCORES[s.quality],
        0,
      );
      const avg = totalQualityScore / staffSessions.length;
      if (avg >= 3.5) qualityAverage = "outstanding";
      else if (avg >= 2.5) qualityAverage = "good";
      else if (avg >= 1.5) qualityAverage = "adequate";
      else qualityAverage = "inadequate";
    }

    // Last session date
    const sortedSessions = [...staffSessions].sort(
      (a, b) => b.date.localeCompare(a.date),
    );
    const lastSessionDate =
      sortedSessions.length > 0 ? sortedSessions[0].date : null;

    // Overdue
    const overdue = staffSchedule?.overdue ?? false;

    // Actions completed/outstanding
    const actionsCompleted = staffActions.filter(
      (a) =>
        a.status === "completed_on_time" || a.status === "completed_late",
    ).length;
    const actionsOutstanding = staffActions.filter(
      (a) =>
        a.status === "in_progress" ||
        a.status === "overdue" ||
        a.status === "not_started",
    ).length;

    // Overall score: 0-10
    let overallScore = 0;

    // Session count contribution: up to 2 pts (1 pt per 2 sessions, max 2)
    overallScore += clamp(sessionCount / 2, 0, 2);

    // Quality contribution: up to 3 pts
    if (qualityAverage === "outstanding") overallScore += 3;
    else if (qualityAverage === "good") overallScore += 2;
    else if (qualityAverage === "adequate") overallScore += 1;

    // Schedule compliance: up to 2 pts
    if (!overdue) overallScore += 2;

    // Action completion: up to 3 pts
    const totalActions = actionsCompleted + actionsOutstanding;
    if (totalActions > 0) {
      overallScore += (actionsCompleted / totalActions) * 3;
    } else {
      overallScore += 1.5; // neutral
    }

    return {
      staffId,
      staffName: staffNames.get(staffId) || "Unknown",
      sessionCount,
      qualityAverage,
      lastSessionDate,
      overdue,
      actionsCompleted,
      actionsOutstanding,
      overallScore: clamp(Math.round(overallScore * 10) / 10, 0, 10),
    };
  });
}

// ── Main Intelligence Function ─────────────────────────────────────────────

export function generateSupervisionQualityIntelligence(
  sessions: SupervisionSession[],
  schedules: SupervisionSchedule[],
  actions: SupervisionAction[],
  outcomes: StaffDevelopmentOutcome[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SupervisionQualityIntelligence {
  const sessionQuality = evaluateSessionQuality(sessions);
  const scheduleCompliance = evaluateScheduleCompliance(schedules);
  const actionTracking = evaluateActionTracking(actions);
  const staffDevelopment = evaluateStaffDevelopment(outcomes, sessions);

  const overallScore = Math.round(
    (sessionQuality.overallScore +
      scheduleCompliance.overallScore +
      actionTracking.overallScore +
      staffDevelopment.overallScore) *
      10,
  ) / 10;

  const rating = getRating(overallScore);

  const staffProfiles = buildStaffSupervisionProfiles(
    sessions,
    schedules,
    actions,
  );

  // ── Strengths ──
  const strengths: string[] = [];

  if (sessionQuality.outstandingGoodRate >= 80) {
    strengths.push(
      "Supervision sessions are consistently rated outstanding or good, reflecting high-quality practice",
    );
  }
  if (sessionQuality.reflectiveRate >= 80) {
    strengths.push(
      "Reflective practice is embedded in supervision with the majority of sessions demonstrating reflective or deeply reflective engagement",
    );
  }
  if (sessionQuality.safeguardingDiscussionRate >= 90) {
    strengths.push(
      "Safeguarding is discussed in the vast majority of supervision sessions, ensuring children's safety is consistently prioritised",
    );
  }
  if (sessionQuality.recordingComplianceRate >= 90) {
    strengths.push(
      "Supervision records are completed in a timely manner, demonstrating strong administrative compliance",
    );
  }
  if (sessionQuality.signOffRate >= 90) {
    strengths.push(
      "Both staff and supervisors consistently sign off supervision records, demonstrating shared accountability",
    );
  }
  if (scheduleCompliance.onScheduleRate >= 90) {
    strengths.push(
      "Supervision is delivered on schedule for the majority of staff, ensuring consistent support",
    );
  }
  if (scheduleCompliance.onScheduleRate === 100) {
    strengths.push(
      "All staff are receiving supervision within required timescales — excellent compliance",
    );
  }
  if (actionTracking.completedOnTimeRate >= 80) {
    strengths.push(
      "Supervision actions are completed on time at a high rate, demonstrating effective follow-through",
    );
  }
  if (
    actionTracking.safeguardingActionCompletionRate >= 100 &&
    actionTracking.totalActions > 0
  ) {
    strengths.push(
      "All safeguarding-related supervision actions have been completed, prioritising child protection",
    );
  }
  if (staffDevelopment.improvementRate >= 70) {
    strengths.push(
      "Staff are demonstrating measurable skill improvement through supervision-linked development",
    );
  }
  if (staffDevelopment.wellbeingConcernRate <= 5 && sessions.length > 0) {
    strengths.push(
      "Low levels of significant wellbeing concerns among staff, suggesting a supportive working environment",
    );
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];

  if (
    sessionQuality.outstandingGoodRate < 60 &&
    sessionQuality.totalSessions > 0
  ) {
    areasForImprovement.push(
      "The quality of supervision sessions needs improvement — less than 60% are rated good or outstanding",
    );
  }
  if (sessionQuality.reflectiveRate < 50 && sessionQuality.totalSessions > 0) {
    areasForImprovement.push(
      "Reflective practice in supervision is insufficient — supervisors should be trained in reflective supervision techniques",
    );
  }
  if (
    sessionQuality.safeguardingDiscussionRate < 80 &&
    sessionQuality.totalSessions > 0
  ) {
    areasForImprovement.push(
      "Safeguarding is not consistently discussed in supervision — this must be a standing agenda item",
    );
  }
  if (
    sessionQuality.recordingComplianceRate < 80 &&
    sessionQuality.totalSessions > 0
  ) {
    areasForImprovement.push(
      "Supervision records are not being completed in a timely manner — recording compliance needs attention",
    );
  }
  if (scheduleCompliance.overdueCount > 0) {
    areasForImprovement.push(
      `${scheduleCompliance.overdueCount} staff member(s) have overdue supervision — schedules must be maintained`,
    );
  }
  if (scheduleCompliance.consecutiveMissedMax >= 2) {
    areasForImprovement.push(
      `Staff have missed up to ${scheduleCompliance.consecutiveMissedMax} consecutive supervision sessions — this is a significant concern`,
    );
  }
  if (actionTracking.overdueCount > 0) {
    areasForImprovement.push(
      `${actionTracking.overdueCount} supervision action(s) are overdue — follow-through on agreed actions must improve`,
    );
  }
  if (
    actionTracking.completedOnTimeRate < 60 &&
    actionTracking.totalActions > 0
  ) {
    areasForImprovement.push(
      "Supervision action completion rate is below 60% — actions agreed in supervision are not being followed through",
    );
  }
  if (staffDevelopment.improvementRate < 40 && staffDevelopment.totalOutcomes > 0) {
    areasForImprovement.push(
      "Staff skill improvement through supervision is below 40% — development outcomes need strengthening",
    );
  }
  if (staffDevelopment.wellbeingConcernRate > 20 && sessions.length > 0) {
    areasForImprovement.push(
      "Over 20% of supervision sessions identified significant wellbeing concerns — staff support mechanisms need review",
    );
  }

  // ── Actions ──
  const actionsList: string[] = [];

  // URGENT actions
  const overdueSafeguardingActions = actions.filter(
    (a) => a.category === "safeguarding" && a.status === "overdue",
  );
  if (overdueSafeguardingActions.length > 0) {
    actionsList.push(
      `URGENT: ${overdueSafeguardingActions.length} safeguarding action(s) are overdue — these must be completed immediately as a child protection priority`,
    );
  }

  const staffWith3PlusMissed = schedules.filter(
    (s) => s.consecutiveMissed >= 3,
  );
  if (staffWith3PlusMissed.length > 0) {
    actionsList.push(
      `URGENT: ${staffWith3PlusMissed.length} staff member(s) have missed 3 or more consecutive supervision sessions — immediate intervention required`,
    );
  }

  if (scheduleCompliance.overdueCount > 0) {
    actionsList.push(
      "URGENT: Schedule overdue supervision sessions immediately and review scheduling processes",
    );
  }

  // HIGH priority
  if (
    sessionQuality.safeguardingDiscussionRate < 80 &&
    sessionQuality.totalSessions > 0
  ) {
    actionsList.push(
      "HIGH: Make safeguarding discussion a mandatory standing item on all supervision agendas",
    );
  }
  if (sessionQuality.reflectiveRate < 50 && sessionQuality.totalSessions > 0) {
    actionsList.push(
      "HIGH: Provide training for supervisors in reflective supervision techniques in line with the Munro Review recommendations",
    );
  }
  if (actionTracking.overdueCount > 0) {
    actionsList.push(
      "HIGH: Review all overdue supervision actions and establish a tracking system for completion",
    );
  }
  if (staffDevelopment.wellbeingConcernRate > 20 && sessions.length > 0) {
    actionsList.push(
      "HIGH: Review staff wellbeing support mechanisms and consider additional pastoral or clinical supervision",
    );
  }

  // MEDIUM priority
  if (
    sessionQuality.recordingComplianceRate < 80 &&
    sessionQuality.totalSessions > 0
  ) {
    actionsList.push(
      "MEDIUM: Implement a supervision recording template and set expectations for timely completion within 48 hours",
    );
  }
  if (staffDevelopment.improvementRate < 40 && staffDevelopment.totalOutcomes > 0) {
    actionsList.push(
      "MEDIUM: Review staff development outcomes and ensure supervision is effectively supporting skill growth",
    );
  }
  if (sessionQuality.signOffRate < 80 && sessionQuality.totalSessions > 0) {
    actionsList.push(
      "MEDIUM: Reinforce the expectation that both parties sign off supervision records at the end of each session",
    );
  }

  // ── Regulatory Links ──
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 33 — employment of staff, ensuring staff receive appropriate supervision",
    "CHR 2015 Reg 13 — leadership and management, quality of supervision and support",
    "SCCIF — leadership and management, effectiveness of supervision arrangements",
    "NMS 19 — staffing of children's homes, supervision frequency and quality",
    "NMS 20 — learning and development, supervision supporting professional growth",
    "Working Together 2023 — supervision requirements for safeguarding practitioners",
    "Munro Review — reflective supervision as essential to effective child protection practice",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    sessionQuality,
    scheduleCompliance,
    actionTracking,
    staffDevelopment,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions: actionsList,
    regulatoryLinks,
  };
}
