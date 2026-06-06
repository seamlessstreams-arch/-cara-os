// ══════════════════════════════════════════════════════════════════════════════
// ANNUAL DEVELOPMENT REVIEW INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating the quality of annual development
// reviews (statutory reviews / LAC reviews). Tracks review timeliness, goal
// setting and achievement, multi-agency attendance, child participation, and
// action plan follow-through.
//
// Regulatory basis:
//   - CHR 2015, Reg 45 — Review of quality of care
//   - CHR 2015, Reg 14 — Care planning
//   - SCCIF — How well children are helped and protected
//   - IRO Handbook 2010 — Independent reviewing officer guidance
//   - Children Act 1989 — Welfare and care planning
//   - UNCRC Article 12 — Right to be heard
//   - Care Planning Regulations 2010 — Statutory review requirements
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type ReviewType =
  | "initial"
  | "first_review"
  | "subsequent"
  | "emergency"
  | "pre_discharge";

export type GoalStatus =
  | "achieved"
  | "on_track"
  | "partially_met"
  | "not_met"
  | "deferred";

export type AttendeeType =
  | "child"
  | "social_worker"
  | "iro"
  | "parent_carer"
  | "teacher"
  | "health_professional"
  | "advocate"
  | "keyworker"
  | "manager"
  | "other";

export type ParticipationLevel =
  | "fully_participated"
  | "views_submitted"
  | "partially_participated"
  | "declined"
  | "not_invited";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ReviewRecord {
  id: string;
  childId: string;
  childName: string;
  reviewDate: string; // ISO date
  reviewType: ReviewType;
  heldOnTime: boolean;
  iroPresent: boolean;
  childParticipation: ParticipationLevel;
  attendees: AttendeeType[];
  goalsSet: number;
  previousGoalsReviewed: boolean;
  actionPlanCreated: boolean;
  minutesDistributed: boolean;
  nextReviewDate: string; // ISO date
}

export interface GoalRecord {
  id: string;
  childId: string;
  childName: string;
  reviewId: string;
  goalDescription: string;
  goalStatus: GoalStatus;
  targetDate: string; // ISO date
  responsiblePerson: string;
  progressNotes: string;
}

export interface ReviewPolicy {
  id: string;
  policyReviewDate: string; // ISO date
  policyCurrent: boolean;
  timelinesCompliant: boolean;
  childParticipationFramework: boolean;
  multiAgencyInvitations: boolean;
  goalSettingStandards: boolean;
  minutesDistributionTimescale: boolean;
  qualityAssuranceProcess: boolean;
}

export interface StaffReviewTraining {
  id: string;
  staffId: string;
  staffName: string;
  reviewProcess: boolean;
  childParticipation: boolean;
  goalSetting: boolean;
  multiAgencyWorking: boolean;
  minutesTaking: boolean;
  advocacyAwareness: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ReviewTimelinessResult {
  totalReviews: number;
  heldOnTimeCount: number;
  heldOnTimeRate: number;
  iroPresenceCount: number;
  iroPresenceRate: number;
  minutesDistributedCount: number;
  minutesDistributedRate: number;
  actionPlanCreatedCount: number;
  actionPlanCreatedRate: number;
  reviewTypeBreakdown: Record<ReviewType, number>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface ChildParticipationResult {
  totalReviews: number;
  fullyParticipatedCount: number;
  fullyParticipatedRate: number;
  viewsSubmittedPlusCount: number;
  viewsSubmittedPlusRate: number;
  multiAgencyAttendanceCount: number;
  multiAgencyAttendanceRate: number;
  previousGoalsReviewedCount: number;
  previousGoalsReviewedRate: number;
  participationBreakdown: Record<ParticipationLevel, number>;
  averageAttendeesPerReview: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface GoalAchievementResult {
  totalGoals: number;
  achievedCount: number;
  achievedRate: number;
  onTrackPlusCount: number;
  onTrackPlusRate: number;
  notMetCount: number;
  notMetRate: number;
  goalsPerChild: number;
  uniqueChildren: number;
  statusBreakdown: Record<GoalStatus, number>;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface StaffReviewReadinessResult {
  totalStaff: number;
  reviewProcessCount: number;
  reviewProcessRate: number;
  childParticipationCount: number;
  childParticipationRate: number;
  goalSettingCount: number;
  goalSettingRate: number;
  multiAgencyWorkingCount: number;
  multiAgencyWorkingRate: number;
  minutesTakingCount: number;
  minutesTakingRate: number;
  advocacyAwarenessCount: number;
  advocacyAwarenessRate: number;
  overallReadyCount: number;
  overallReadyRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface ChildReviewProfile {
  childId: string;
  childName: string;
  totalReviews: number;
  onTimeReviews: number;
  participationLevels: ParticipationLevel[];
  totalGoals: number;
  goalsAchieved: number;
  goalsOnTrack: number;
  goalsNotMet: number;
  score: number; // 0-10
}

export interface AnnualDevelopmentReviewIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  reviewTimeliness: ReviewTimelinessResult;
  childParticipation: ChildParticipationResult;
  goalAchievement: GoalAchievementResult;
  staffReviewReadiness: StaffReviewReadinessResult;

  childProfiles: ChildReviewProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Core Function 1: Evaluate Review Timeliness (0-25) ─────────────────

export function evaluateReviewTimeliness(
  reviews: ReviewRecord[],
): ReviewTimelinessResult {
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      heldOnTimeCount: 0,
      heldOnTimeRate: 0,
      iroPresenceCount: 0,
      iroPresenceRate: 0,
      minutesDistributedCount: 0,
      minutesDistributedRate: 0,
      actionPlanCreatedCount: 0,
      actionPlanCreatedRate: 0,
      reviewTypeBreakdown: {
        initial: 0, first_review: 0, subsequent: 0, emergency: 0, pre_discharge: 0,
      },
      score: 0,
      strengths: [],
      concerns: ["No review records found — statutory reviews may not be taking place"],
    };
  }

  // On-time rate
  const heldOnTimeCount = reviews.filter((r) => r.heldOnTime).length;
  const heldOnTimeRate = pct(heldOnTimeCount, totalReviews);

  // IRO presence
  const iroPresenceCount = reviews.filter((r) => r.iroPresent).length;
  const iroPresenceRate = pct(iroPresenceCount, totalReviews);

  // Minutes distributed
  const minutesDistributedCount = reviews.filter((r) => r.minutesDistributed).length;
  const minutesDistributedRate = pct(minutesDistributedCount, totalReviews);

  // Action plan created
  const actionPlanCreatedCount = reviews.filter((r) => r.actionPlanCreated).length;
  const actionPlanCreatedRate = pct(actionPlanCreatedCount, totalReviews);

  // Review type breakdown
  const reviewTypeBreakdown: Record<ReviewType, number> = {
    initial: 0, first_review: 0, subsequent: 0, emergency: 0, pre_discharge: 0,
  };
  for (const r of reviews) {
    reviewTypeBreakdown[r.reviewType]++;
  }

  // Score (out of 25)
  let score = 0;
  // On-time rate: max 7
  score += (heldOnTimeRate / 100) * 7;
  // IRO present: max 6
  score += (iroPresenceRate / 100) * 6;
  // Minutes distributed: max 6
  score += (minutesDistributedRate / 100) * 6;
  // Action plan created: max 6
  score += (actionPlanCreatedRate / 100) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (heldOnTimeRate >= 90) {
    strengths.push("Excellent review timeliness: " + heldOnTimeRate + "% of reviews held on time");
  } else if (heldOnTimeRate < 70) {
    concerns.push("Review timeliness at " + heldOnTimeRate + "% — below 70% threshold. Statutory timescales must be met");
  }

  if (iroPresenceRate >= 90) {
    strengths.push("Strong IRO attendance: " + iroPresenceRate + "% of reviews chaired by IRO");
  } else if (iroPresenceRate < 70) {
    concerns.push("IRO present at only " + iroPresenceRate + "% of reviews — IRO Handbook requires independent oversight");
  }

  if (minutesDistributedRate >= 90) {
    strengths.push("Minutes distributed promptly in " + minutesDistributedRate + "% of reviews");
  } else if (minutesDistributedRate < 70) {
    concerns.push("Minutes distributed in only " + minutesDistributedRate + "% of reviews — participants need timely records");
  }

  if (actionPlanCreatedRate >= 90) {
    strengths.push("Action plans created for " + actionPlanCreatedRate + "% of reviews");
  } else if (actionPlanCreatedRate < 70) {
    concerns.push("Action plans created for only " + actionPlanCreatedRate + "% of reviews — every review must generate clear actions");
  }

  return {
    totalReviews,
    heldOnTimeCount,
    heldOnTimeRate,
    iroPresenceCount,
    iroPresenceRate,
    minutesDistributedCount,
    minutesDistributedRate,
    actionPlanCreatedCount,
    actionPlanCreatedRate,
    reviewTypeBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 2: Evaluate Child Participation (0-25) ────────────────

export function evaluateChildParticipation(
  reviews: ReviewRecord[],
): ChildParticipationResult {
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      fullyParticipatedCount: 0,
      fullyParticipatedRate: 0,
      viewsSubmittedPlusCount: 0,
      viewsSubmittedPlusRate: 0,
      multiAgencyAttendanceCount: 0,
      multiAgencyAttendanceRate: 0,
      previousGoalsReviewedCount: 0,
      previousGoalsReviewedRate: 0,
      participationBreakdown: {
        fully_participated: 0, views_submitted: 0, partially_participated: 0,
        declined: 0, not_invited: 0,
      },
      averageAttendeesPerReview: 0,
      score: 0,
      strengths: [],
      concerns: ["No review records found — child participation cannot be assessed"],
    };
  }

  // Fully participated
  const fullyParticipatedCount = reviews.filter(
    (r) => r.childParticipation === "fully_participated",
  ).length;
  const fullyParticipatedRate = pct(fullyParticipatedCount, totalReviews);

  // Views submitted or better (fully_participated OR views_submitted)
  const viewsSubmittedPlusCount = reviews.filter(
    (r) =>
      r.childParticipation === "fully_participated" ||
      r.childParticipation === "views_submitted",
  ).length;
  const viewsSubmittedPlusRate = pct(viewsSubmittedPlusCount, totalReviews);

  // Multi-agency attendance (3+ different attendee types per review)
  const multiAgencyAttendanceCount = reviews.filter((r) => {
    const uniqueTypes = new Set(r.attendees);
    return uniqueTypes.size >= 3;
  }).length;
  const multiAgencyAttendanceRate = pct(multiAgencyAttendanceCount, totalReviews);

  // Previous goals reviewed
  const previousGoalsReviewedCount = reviews.filter(
    (r) => r.previousGoalsReviewed,
  ).length;
  const previousGoalsReviewedRate = pct(previousGoalsReviewedCount, totalReviews);

  // Participation breakdown
  const participationBreakdown: Record<ParticipationLevel, number> = {
    fully_participated: 0, views_submitted: 0, partially_participated: 0,
    declined: 0, not_invited: 0,
  };
  for (const r of reviews) {
    participationBreakdown[r.childParticipation]++;
  }

  // Average attendees per review
  const totalAttendees = reviews.reduce((sum, r) => sum + r.attendees.length, 0);
  const averageAttendeesPerReview =
    Math.round((totalAttendees / totalReviews) * 10) / 10;

  // Score (out of 25)
  let score = 0;
  // Fully participated rate: max 7
  score += (fullyParticipatedRate / 100) * 7;
  // Views submitted+ rate: max 6
  score += (viewsSubmittedPlusRate / 100) * 6;
  // Multi-agency attendance: max 6
  score += (multiAgencyAttendanceRate / 100) * 6;
  // Previous goals reviewed: max 6
  score += (previousGoalsReviewedRate / 100) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (fullyParticipatedRate >= 80) {
    strengths.push("Excellent child participation: " + fullyParticipatedRate + "% of children fully participated in their reviews");
  } else if (fullyParticipatedRate < 50) {
    concerns.push("Full participation at only " + fullyParticipatedRate + "% — UNCRC Article 12 requires children to be heard");
  }

  if (viewsSubmittedPlusRate >= 90) {
    strengths.push("Children's views captured in " + viewsSubmittedPlusRate + "% of reviews");
  } else if (viewsSubmittedPlusRate < 70) {
    concerns.push("Children's views captured in only " + viewsSubmittedPlusRate + "% of reviews — advocacy support may be needed");
  }

  if (multiAgencyAttendanceRate >= 80) {
    strengths.push("Strong multi-agency attendance: " + multiAgencyAttendanceRate + "% of reviews had 3+ professional types");
  } else if (multiAgencyAttendanceRate < 50) {
    concerns.push("Multi-agency attendance at only " + multiAgencyAttendanceRate + "% — collaborative working needs strengthening");
  }

  if (previousGoalsReviewedRate >= 90) {
    strengths.push("Previous goals reviewed in " + previousGoalsReviewedRate + "% of reviews — strong continuity of care planning");
  } else if (previousGoalsReviewedRate < 70) {
    concerns.push("Previous goals reviewed in only " + previousGoalsReviewedRate + "% of reviews — continuity of planning at risk");
  }

  if (participationBreakdown.not_invited > 0) {
    concerns.push(participationBreakdown.not_invited + " review(s) where child was not invited — all children must be invited to their reviews");
  }

  return {
    totalReviews,
    fullyParticipatedCount,
    fullyParticipatedRate,
    viewsSubmittedPlusCount,
    viewsSubmittedPlusRate,
    multiAgencyAttendanceCount,
    multiAgencyAttendanceRate,
    previousGoalsReviewedCount,
    previousGoalsReviewedRate,
    participationBreakdown,
    averageAttendeesPerReview,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 3: Evaluate Goal Achievement (0-25) ───────────────────

export function evaluateGoalAchievement(
  goals: GoalRecord[],
): GoalAchievementResult {
  const totalGoals = goals.length;

  if (totalGoals === 0) {
    return {
      totalGoals: 0,
      achievedCount: 0,
      achievedRate: 0,
      onTrackPlusCount: 0,
      onTrackPlusRate: 0,
      notMetCount: 0,
      notMetRate: 0,
      goalsPerChild: 0,
      uniqueChildren: 0,
      statusBreakdown: {
        achieved: 0, on_track: 0, partially_met: 0, not_met: 0, deferred: 0,
      },
      score: 0,
      strengths: [],
      concerns: ["No goal records found — care planning may lack measurable objectives"],
    };
  }

  // Achieved
  const achievedCount = goals.filter((g) => g.goalStatus === "achieved").length;
  const achievedRate = pct(achievedCount, totalGoals);

  // On-track+ (achieved or on_track)
  const onTrackPlusCount = goals.filter(
    (g) => g.goalStatus === "achieved" || g.goalStatus === "on_track",
  ).length;
  const onTrackPlusRate = pct(onTrackPlusCount, totalGoals);

  // Not met
  const notMetCount = goals.filter((g) => g.goalStatus === "not_met").length;
  const notMetRate = pct(notMetCount, totalGoals);

  // Goals per child breadth
  const uniqueChildIds = new Set(goals.map((g) => g.childId));
  const uniqueChildren = uniqueChildIds.size;
  const goalsPerChild =
    uniqueChildren > 0
      ? Math.round((totalGoals / uniqueChildren) * 10) / 10
      : 0;

  // Status breakdown
  const statusBreakdown: Record<GoalStatus, number> = {
    achieved: 0, on_track: 0, partially_met: 0, not_met: 0, deferred: 0,
  };
  for (const g of goals) {
    statusBreakdown[g.goalStatus]++;
  }

  // Score (out of 25)
  let score = 0;
  // Achieved rate: max 7
  score += (achievedRate / 100) * 7;
  // On-track+ rate: max 6
  score += (onTrackPlusRate / 100) * 6;
  // Not-met rate inversed: max 6 (0% not met = 6, 100% not met = 0)
  const notMetInversed = 100 - notMetRate;
  score += (notMetInversed / 100) * 6;
  // Goals per child breadth: max 6 (target: 3+ goals per child = full marks)
  const breadthFactor = Math.min(goalsPerChild / 3, 1);
  score += breadthFactor * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (achievedRate >= 60) {
    strengths.push("Strong goal achievement: " + achievedRate + "% of goals achieved");
  } else if (achievedRate < 30) {
    concerns.push("Goal achievement at only " + achievedRate + "% — review whether goals are realistic and adequately supported");
  }

  if (onTrackPlusRate >= 80) {
    strengths.push("Excellent progress tracking: " + onTrackPlusRate + "% of goals achieved or on track");
  } else if (onTrackPlusRate < 50) {
    concerns.push("Only " + onTrackPlusRate + "% of goals achieved or on track — care plan effectiveness needs review");
  }

  if (notMetRate > 30) {
    concerns.push(notMetRate + "% of goals not met — systemic barriers to goal achievement may exist");
  }

  if (goalsPerChild >= 3) {
    strengths.push("Good breadth of goal setting: " + goalsPerChild + " goals per child covering multiple development areas");
  } else if (goalsPerChild < 2 && goalsPerChild > 0) {
    concerns.push("Only " + goalsPerChild + " goals per child — broader developmental objectives needed");
  }

  return {
    totalGoals,
    achievedCount,
    achievedRate,
    onTrackPlusCount,
    onTrackPlusRate,
    notMetCount,
    notMetRate,
    goalsPerChild,
    uniqueChildren,
    statusBreakdown,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 4: Evaluate Staff Review Readiness (0-25) ─────────────

export function evaluateStaffReviewReadiness(
  training: StaffReviewTraining[],
): StaffReviewReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      reviewProcessCount: 0,
      reviewProcessRate: 0,
      childParticipationCount: 0,
      childParticipationRate: 0,
      goalSettingCount: 0,
      goalSettingRate: 0,
      multiAgencyWorkingCount: 0,
      multiAgencyWorkingRate: 0,
      minutesTakingCount: 0,
      minutesTakingRate: 0,
      advocacyAwarenessCount: 0,
      advocacyAwarenessRate: 0,
      overallReadyCount: 0,
      overallReadyRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff review training records — staff readiness cannot be assessed"],
    };
  }

  // Individual field counts
  const reviewProcessCount = training.filter((t) => t.reviewProcess).length;
  const reviewProcessRate = pct(reviewProcessCount, totalStaff);

  const childParticipationCount = training.filter((t) => t.childParticipation).length;
  const childParticipationRate = pct(childParticipationCount, totalStaff);

  const goalSettingCount = training.filter((t) => t.goalSetting).length;
  const goalSettingRate = pct(goalSettingCount, totalStaff);

  const multiAgencyWorkingCount = training.filter((t) => t.multiAgencyWorking).length;
  const multiAgencyWorkingRate = pct(multiAgencyWorkingCount, totalStaff);

  const minutesTakingCount = training.filter((t) => t.minutesTaking).length;
  const minutesTakingRate = pct(minutesTakingCount, totalStaff);

  const advocacyAwarenessCount = training.filter((t) => t.advocacyAwareness).length;
  const advocacyAwarenessRate = pct(advocacyAwarenessCount, totalStaff);

  // Overall ready (all 6 fields true)
  const overallReadyCount = training.filter(
    (t) =>
      t.reviewProcess &&
      t.childParticipation &&
      t.goalSetting &&
      t.multiAgencyWorking &&
      t.minutesTaking &&
      t.advocacyAwareness,
  ).length;
  const overallReadyRate = pct(overallReadyCount, totalStaff);

  // Score (out of 25) — rate-based scoring per field
  // reviewProcess=6, childParticipation=5, goalSetting=4, multiAgencyWorking=4, minutesTaking=3, advocacyAwareness=3
  let score = 0;
  score += (reviewProcessRate / 100) * 6;
  score += (childParticipationRate / 100) * 5;
  score += (goalSettingRate / 100) * 4;
  score += (multiAgencyWorkingRate / 100) * 4;
  score += (minutesTakingRate / 100) * 3;
  score += (advocacyAwarenessRate / 100) * 3;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (reviewProcessRate >= 90) {
    strengths.push("Excellent review process knowledge: " + reviewProcessRate + "% of staff trained");
  } else if (reviewProcessRate < 70) {
    concerns.push("Review process training at only " + reviewProcessRate + "% — staff may not understand statutory requirements");
  }

  if (childParticipationRate >= 90) {
    strengths.push("Strong child participation skills: " + childParticipationRate + "% of staff trained");
  } else if (childParticipationRate < 70) {
    concerns.push("Child participation training at only " + childParticipationRate + "% — children's voices may not be adequately supported");
  }

  if (goalSettingRate >= 90) {
    strengths.push("Good goal-setting competency: " + goalSettingRate + "% of staff trained");
  } else if (goalSettingRate < 70) {
    concerns.push("Goal-setting training at only " + goalSettingRate + "% — SMART objectives may not be effectively set");
  }

  if (multiAgencyWorkingRate >= 90) {
    strengths.push("Strong multi-agency working skills: " + multiAgencyWorkingRate + "% of staff trained");
  } else if (multiAgencyWorkingRate < 70) {
    concerns.push("Multi-agency working training at only " + multiAgencyWorkingRate + "% — collaborative practice needs strengthening");
  }

  if (overallReadyRate === 100) {
    strengths.push("100% of staff fully trained across all review competencies");
  } else if (overallReadyRate < 50) {
    concerns.push("Only " + overallReadyRate + "% of staff have complete review training — significant training gap");
  }

  return {
    totalStaff,
    reviewProcessCount,
    reviewProcessRate,
    childParticipationCount,
    childParticipationRate,
    goalSettingCount,
    goalSettingRate,
    multiAgencyWorkingCount,
    multiAgencyWorkingRate,
    minutesTakingCount,
    minutesTakingRate,
    advocacyAwarenessCount,
    advocacyAwarenessRate,
    overallReadyCount,
    overallReadyRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Review Profiles ─────────────────────────────────────────

export function buildChildReviewProfiles(
  reviews: ReviewRecord[],
  goals: GoalRecord[],
): ChildReviewProfile[] {
  // Collect unique children from reviews and goals
  const childMap = new Map<string, { childId: string; childName: string }>();

  for (const r of reviews) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName });
    }
  }
  for (const g of goals) {
    if (!childMap.has(g.childId)) {
      childMap.set(g.childId, { childId: g.childId, childName: g.childName });
    }
  }

  return Array.from(childMap.values()).map((child) => {
    const childReviews = reviews.filter((r) => r.childId === child.childId);
    const childGoals = goals.filter((g) => g.childId === child.childId);

    const totalReviews = childReviews.length;
    const onTimeReviews = childReviews.filter((r) => r.heldOnTime).length;
    const participationLevels = childReviews.map((r) => r.childParticipation);

    const totalGoals = childGoals.length;
    const goalsAchieved = childGoals.filter((g) => g.goalStatus === "achieved").length;
    const goalsOnTrack = childGoals.filter((g) => g.goalStatus === "on_track").length;
    const goalsNotMet = childGoals.filter((g) => g.goalStatus === "not_met").length;

    // Score 0-10
    let score = 0;

    // Review timeliness (max 3)
    if (totalReviews > 0) {
      score += (onTimeReviews / totalReviews) * 3;
    }

    // Participation quality (max 3)
    const fullyParticipated = participationLevels.filter(
      (p) => p === "fully_participated",
    ).length;
    if (totalReviews > 0) {
      score += (fullyParticipated / totalReviews) * 3;
    }

    // Goal achievement (max 4)
    if (totalGoals > 0) {
      const achievedAndOnTrack = goalsAchieved + goalsOnTrack;
      score += (achievedAndOnTrack / totalGoals) * 4;
    }

    score = clamp(Math.round(score * 10) / 10, 0, 10);

    return {
      childId: child.childId,
      childName: child.childName,
      totalReviews,
      onTimeReviews,
      participationLevels,
      totalGoals,
      goalsAchieved,
      goalsOnTrack,
      goalsNotMet,
      score,
    };
  });
}

// ── Generate Annual Development Review Intelligence ─────────────────────

export function generateAnnualDevelopmentReviewIntelligence(
  reviews: ReviewRecord[],
  goals: GoalRecord[],
  policy: ReviewPolicy | null,
  training: StaffReviewTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): AnnualDevelopmentReviewIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter reviews to period
  const periodReviews = reviews.filter(
    (r) => withinPeriod(r.reviewDate, periodStart, periodEnd),
  );

  // Filter goals to reviews in the period
  const periodReviewIds = new Set(periodReviews.map((r) => r.id));
  const periodGoals = goals.filter((g) => periodReviewIds.has(g.reviewId));

  // Evaluate each layer
  const reviewTimeliness = evaluateReviewTimeliness(periodReviews);
  const childParticipation = evaluateChildParticipation(periodReviews);
  const goalAchievement = evaluateGoalAchievement(periodGoals);
  const staffReviewReadiness = evaluateStaffReviewReadiness(training);

  // Build child profiles
  const childProfiles = buildChildReviewProfiles(periodReviews, periodGoals);

  // Overall score (100 points)
  const overallScore = clamp(
    Math.round(
      reviewTimeliness.score +
        childParticipation.score +
        goalAchievement.score +
        staffReviewReadiness.score,
    ),
    0,
    100,
  );

  const rating = getRating(overallScore);

  // Aggregate insights
  const strengths = aggregateStrengths(
    reviewTimeliness, childParticipation, goalAchievement, staffReviewReadiness, overallScore,
  );
  const areasForImprovement = aggregateAreasForImprovement(
    reviewTimeliness, childParticipation, goalAchievement, staffReviewReadiness, overallScore,
  );
  const actions = generateActions(
    reviewTimeliness, childParticipation, goalAchievement, staffReviewReadiness, childProfiles, policy,
  );
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    reviewTimeliness,
    childParticipation,
    goalAchievement,
    staffReviewReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ────────────────────────────────────────────────────

function aggregateStrengths(
  timeliness: ReviewTimelinessResult,
  participation: ChildParticipationResult,
  goals: GoalAchievementResult,
  staff: StaffReviewReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall annual development review quality rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall annual development review quality rated Good (" + overallScore + "/100)");
  }

  // Pick top strengths from each area (max 2 per area)
  strengths.push(...timeliness.strengths.slice(0, 2));
  strengths.push(...participation.strengths.slice(0, 2));
  strengths.push(...goals.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ────────────────────────────────────────

function aggregateAreasForImprovement(
  timeliness: ReviewTimelinessResult,
  participation: ChildParticipationResult,
  goals: GoalAchievementResult,
  staff: StaffReviewReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall annual development review quality rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall annual development review quality Requires Improvement (" + overallScore + "/100)");
  }

  areas.push(...timeliness.concerns);
  areas.push(...participation.concerns);
  areas.push(...goals.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ──────────────────────────────────────────────────────

function generateActions(
  timeliness: ReviewTimelinessResult,
  participation: ChildParticipationResult,
  goals: GoalAchievementResult,
  staff: StaffReviewReadinessResult,
  childProfiles: ChildReviewProfile[],
  policy: ReviewPolicy | null,
): string[] {
  const actions: string[] = [];

  // Late reviews
  if (timeliness.heldOnTimeRate < 70 && timeliness.totalReviews > 0) {
    actions.push("URGENT: Review timeliness at " + timeliness.heldOnTimeRate + "% — implement review tracking calendar and escalation process");
  }

  // IRO absence
  if (timeliness.iroPresenceRate < 70 && timeliness.totalReviews > 0) {
    actions.push("URGENT: IRO present at only " + timeliness.iroPresenceRate + "% of reviews — liaise with IRO service to ensure attendance");
  }

  // Low child participation
  if (participation.fullyParticipatedRate < 50 && participation.totalReviews > 0) {
    actions.push("URGENT: Only " + participation.fullyParticipatedRate + "% of children fully participating — review participation support and advocacy provision");
  }

  // Not invited children
  if (participation.participationBreakdown.not_invited > 0) {
    actions.push("URGENT: " + participation.participationBreakdown.not_invited + " review(s) where child was not invited — all children must be invited per UNCRC Article 12");
  }

  // High not-met goal rate
  if (goals.notMetRate > 30 && goals.totalGoals > 0) {
    actions.push("HIGH: " + goals.notMetRate + "% of goals not met — review goal-setting process and support mechanisms");
  }

  // Low goal breadth
  if (goals.goalsPerChild < 2 && goals.goalsPerChild > 0) {
    actions.push("MEDIUM: Only " + goals.goalsPerChild + " goals per child — broaden developmental objectives across health, education, emotional wellbeing");
  }

  // Low multi-agency attendance
  if (participation.multiAgencyAttendanceRate < 50 && participation.totalReviews > 0) {
    actions.push("HIGH: Multi-agency attendance at only " + participation.multiAgencyAttendanceRate + "% — strengthen invitation process and professional engagement");
  }

  // Staff training gaps
  if (staff.overallReadyRate < 50 && staff.totalStaff > 0) {
    actions.push("HIGH: Only " + staff.overallReadyRate + "% of staff fully trained in review competencies — schedule comprehensive training programme");
  }

  // Minutes not distributed
  if (timeliness.minutesDistributedRate < 70 && timeliness.totalReviews > 0) {
    actions.push("MEDIUM: Minutes distributed for only " + timeliness.minutesDistributedRate + "% of reviews — implement distribution tracking");
  }

  // Action plans missing
  if (timeliness.actionPlanCreatedRate < 70 && timeliness.totalReviews > 0) {
    actions.push("MEDIUM: Action plans created for only " + timeliness.actionPlanCreatedRate + "% of reviews — ensure every review generates an action plan");
  }

  // Children with low scores
  const atRiskChildren = childProfiles.filter((p) => p.score <= 4);
  if (atRiskChildren.length > 0) {
    actions.push("HIGH: " + atRiskChildren.length + " child(ren) with low review profile scores — prioritise enhanced review planning and support");
  }

  // Policy gaps
  if (policy && !policy.policyCurrent) {
    actions.push("MEDIUM: Review policy is not current — update to reflect latest statutory guidance");
  }
  if (policy && !policy.qualityAssuranceProcess) {
    actions.push("MEDIUM: No quality assurance process for reviews — implement audit and feedback cycle");
  }

  // Previous goals not reviewed
  if (participation.previousGoalsReviewedRate < 70 && participation.totalReviews > 0) {
    actions.push("MEDIUM: Previous goals reviewed in only " + participation.previousGoalsReviewedRate + "% of reviews — ensure continuity in care planning");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Annual development review systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ──────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015, Reg 45 — Review of quality of care",
    "CHR 2015, Reg 14 — Care planning",
    "SCCIF — How well children are helped and protected",
    "IRO Handbook 2010 — Independent reviewing officer guidance",
    "Children Act 1989 — Welfare and care planning",
    "UNCRC Article 12 — Right to be heard",
    "Care Planning Regulations 2010 — Statutory review requirements",
  ];
}

// ── Utility: Label Maps ────────────────────────────────────────────────────

const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  initial: "Initial",
  first_review: "First Review",
  subsequent: "Subsequent",
  emergency: "Emergency",
  pre_discharge: "Pre-Discharge",
};

const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  achieved: "Achieved",
  on_track: "On Track",
  partially_met: "Partially Met",
  not_met: "Not Met",
  deferred: "Deferred",
};

const ATTENDEE_TYPE_LABELS: Record<AttendeeType, string> = {
  child: "Child",
  social_worker: "Social Worker",
  iro: "IRO",
  parent_carer: "Parent/Carer",
  teacher: "Teacher",
  health_professional: "Health Professional",
  advocate: "Advocate",
  keyworker: "Keyworker",
  manager: "Manager",
  other: "Other",
};

const PARTICIPATION_LEVEL_LABELS: Record<ParticipationLevel, string> = {
  fully_participated: "Fully Participated",
  views_submitted: "Views Submitted",
  partially_participated: "Partially Participated",
  declined: "Declined",
  not_invited: "Not Invited",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getReviewTypeLabel(type: ReviewType): string {
  return REVIEW_TYPE_LABELS[type];
}

export function getGoalStatusLabel(status: GoalStatus): string {
  return GOAL_STATUS_LABELS[status];
}

export function getAttendeeTypeLabel(type: AttendeeType): string {
  return ATTENDEE_TYPE_LABELS[type];
}

export function getParticipationLevelLabel(level: ParticipationLevel): string {
  return PARTICIPATION_LEVEL_LABELS[level];
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}
