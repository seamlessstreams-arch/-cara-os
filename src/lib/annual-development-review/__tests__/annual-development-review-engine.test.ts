// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Annual Development Review Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex 14, Jordan 13, Morgan 15),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateReviewTimeliness,
  evaluateChildParticipation,
  evaluateGoalAchievement,
  evaluateStaffReviewReadiness,
  buildChildReviewProfiles,
  generateAnnualDevelopmentReviewIntelligence,
  getReviewTypeLabel,
  getGoalStatusLabel,
  getAttendeeTypeLabel,
  getParticipationLevelLabel,
  getRatingLabel,
} from "../annual-development-review-engine";
import type {
  ReviewRecord,
  GoalRecord,
  ReviewPolicy,
  StaffReviewTraining,
} from "../annual-development-review-engine";

// ── Test Fixtures: Chamberlain House Demo Data ────────────────────────────────────

const makeReview = (overrides: Partial<ReviewRecord> = {}): ReviewRecord => ({
  id: "rev-001",
  childId: "child-alex",
  childName: "Alex",
  reviewDate: "2026-03-15",
  reviewType: "subsequent",
  heldOnTime: true,
  iroPresent: true,
  childParticipation: "fully_participated",
  attendees: ["child", "social_worker", "iro", "keyworker"],
  goalsSet: 3,
  previousGoalsReviewed: true,
  actionPlanCreated: true,
  minutesDistributed: true,
  nextReviewDate: "2026-09-15",
  ...overrides,
});

const makeGoal = (overrides: Partial<GoalRecord> = {}): GoalRecord => ({
  id: "goal-001",
  childId: "child-alex",
  childName: "Alex",
  reviewId: "rev-001",
  goalDescription: "Improve school attendance to 95%",
  goalStatus: "achieved",
  targetDate: "2026-06-01",
  responsiblePerson: "Sarah Johnson",
  progressNotes: "Attendance improved from 88% to 96%",
  ...overrides,
});

const makePolicy = (overrides: Partial<ReviewPolicy> = {}): ReviewPolicy => ({
  id: "policy-001",
  policyReviewDate: "2026-01-15",
  policyCurrent: true,
  timelinesCompliant: true,
  childParticipationFramework: true,
  multiAgencyInvitations: true,
  goalSettingStandards: true,
  minutesDistributionTimescale: true,
  qualityAssuranceProcess: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffReviewTraining> = {}): StaffReviewTraining => ({
  id: "train-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  reviewProcess: true,
  childParticipation: true,
  goalSetting: true,
  multiAgencyWorking: true,
  minutesTaking: true,
  advocacyAwareness: true,
  ...overrides,
});

// Chamberlain House demo reviews
const OAK_HOUSE_REVIEWS: ReviewRecord[] = [
  makeReview({
    id: "rev-001",
    childId: "child-alex",
    childName: "Alex",
    reviewDate: "2026-02-10",
    reviewType: "subsequent",
    heldOnTime: true,
    iroPresent: true,
    childParticipation: "fully_participated",
    attendees: ["child", "social_worker", "iro", "keyworker", "teacher"],
    goalsSet: 3,
    previousGoalsReviewed: true,
    actionPlanCreated: true,
    minutesDistributed: true,
    nextReviewDate: "2026-08-10",
  }),
  makeReview({
    id: "rev-002",
    childId: "child-jordan",
    childName: "Jordan",
    reviewDate: "2026-03-05",
    reviewType: "first_review",
    heldOnTime: true,
    iroPresent: true,
    childParticipation: "views_submitted",
    attendees: ["social_worker", "iro", "keyworker", "parent_carer"],
    goalsSet: 4,
    previousGoalsReviewed: false,
    actionPlanCreated: true,
    minutesDistributed: true,
    nextReviewDate: "2026-06-05",
  }),
  makeReview({
    id: "rev-003",
    childId: "child-morgan",
    childName: "Morgan",
    reviewDate: "2026-04-20",
    reviewType: "subsequent",
    heldOnTime: true,
    iroPresent: true,
    childParticipation: "fully_participated",
    attendees: ["child", "social_worker", "iro", "keyworker", "health_professional", "teacher"],
    goalsSet: 3,
    previousGoalsReviewed: true,
    actionPlanCreated: true,
    minutesDistributed: true,
    nextReviewDate: "2026-10-20",
  }),
  makeReview({
    id: "rev-004",
    childId: "child-alex",
    childName: "Alex",
    reviewDate: "2026-05-01",
    reviewType: "emergency",
    heldOnTime: false,
    iroPresent: false,
    childParticipation: "partially_participated",
    attendees: ["social_worker", "keyworker", "manager"],
    goalsSet: 1,
    previousGoalsReviewed: true,
    actionPlanCreated: true,
    minutesDistributed: false,
    nextReviewDate: "2026-08-10",
  }),
];

const OAK_HOUSE_GOALS: GoalRecord[] = [
  makeGoal({ id: "goal-001", childId: "child-alex", childName: "Alex", reviewId: "rev-001", goalDescription: "Improve school attendance to 95%", goalStatus: "achieved", targetDate: "2026-06-01", responsiblePerson: "Sarah Johnson" }),
  makeGoal({ id: "goal-002", childId: "child-alex", childName: "Alex", reviewId: "rev-001", goalDescription: "Complete anger management programme", goalStatus: "on_track", targetDate: "2026-07-01", responsiblePerson: "Tom Richards" }),
  makeGoal({ id: "goal-003", childId: "child-alex", childName: "Alex", reviewId: "rev-001", goalDescription: "Re-establish contact with aunt", goalStatus: "partially_met", targetDate: "2026-05-15", responsiblePerson: "Lisa Williams" }),
  makeGoal({ id: "goal-004", childId: "child-jordan", childName: "Jordan", reviewId: "rev-002", goalDescription: "Register with local GP", goalStatus: "achieved", targetDate: "2026-04-01", responsiblePerson: "Darren Laville" }),
  makeGoal({ id: "goal-005", childId: "child-jordan", childName: "Jordan", reviewId: "rev-002", goalDescription: "Join a local sports club", goalStatus: "on_track", targetDate: "2026-06-15", responsiblePerson: "Tom Richards" }),
  makeGoal({ id: "goal-006", childId: "child-jordan", childName: "Jordan", reviewId: "rev-002", goalDescription: "Complete life story work", goalStatus: "not_met", targetDate: "2026-05-01", responsiblePerson: "Sarah Johnson" }),
  makeGoal({ id: "goal-007", childId: "child-jordan", childName: "Jordan", reviewId: "rev-002", goalDescription: "Transition plan for secondary school", goalStatus: "deferred", targetDate: "2026-09-01", responsiblePerson: "Lisa Williams" }),
  makeGoal({ id: "goal-008", childId: "child-morgan", childName: "Morgan", reviewId: "rev-003", goalDescription: "Complete GCSE coursework", goalStatus: "on_track", targetDate: "2026-06-30", responsiblePerson: "Sarah Johnson" }),
  makeGoal({ id: "goal-009", childId: "child-morgan", childName: "Morgan", reviewId: "rev-003", goalDescription: "Attend CAMHS appointments", goalStatus: "achieved", targetDate: "2026-05-01", responsiblePerson: "Tom Richards" }),
  makeGoal({ id: "goal-010", childId: "child-morgan", childName: "Morgan", reviewId: "rev-003", goalDescription: "Develop independent living skills", goalStatus: "on_track", targetDate: "2026-08-01", responsiblePerson: "Darren Laville" }),
  makeGoal({ id: "goal-011", childId: "child-alex", childName: "Alex", reviewId: "rev-004", goalDescription: "Safety plan following incident", goalStatus: "on_track", targetDate: "2026-06-01", responsiblePerson: "Darren Laville" }),
];

const OAK_HOUSE_TRAINING: StaffReviewTraining[] = [
  makeTraining({ id: "train-001", staffId: "staff-sarah", staffName: "Sarah Johnson", reviewProcess: true, childParticipation: true, goalSetting: true, multiAgencyWorking: true, minutesTaking: true, advocacyAwareness: true }),
  makeTraining({ id: "train-002", staffId: "staff-tom", staffName: "Tom Richards", reviewProcess: true, childParticipation: true, goalSetting: true, multiAgencyWorking: true, minutesTaking: true, advocacyAwareness: false }),
  makeTraining({ id: "train-003", staffId: "staff-lisa", staffName: "Lisa Williams", reviewProcess: true, childParticipation: true, goalSetting: true, multiAgencyWorking: false, minutesTaking: false, advocacyAwareness: true }),
  makeTraining({ id: "train-004", staffId: "staff-darren", staffName: "Darren Laville", reviewProcess: true, childParticipation: true, goalSetting: true, multiAgencyWorking: true, minutesTaking: true, advocacyAwareness: true }),
];

const OAK_HOUSE_POLICY: ReviewPolicy = makePolicy();

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateReviewTimeliness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateReviewTimeliness", () => {
  it("returns 0 score for empty array", () => {
    const result = evaluateReviewTimeliness([]);
    expect(result.score).toBe(0);
    expect(result.totalReviews).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("scores on-time rate (max 7)", () => {
    const reviews = [
      makeReview({ id: "r1", heldOnTime: true }),
      makeReview({ id: "r2", heldOnTime: true }),
      makeReview({ id: "r3", heldOnTime: false }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.heldOnTimeRate).toBe(67);
    expect(result.heldOnTimeCount).toBe(2);
  });

  it("scores IRO presence rate (max 6)", () => {
    const reviews = [
      makeReview({ id: "r1", iroPresent: true }),
      makeReview({ id: "r2", iroPresent: false }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.iroPresenceRate).toBe(50);
    expect(result.iroPresenceCount).toBe(1);
  });

  it("scores minutes distributed rate (max 6)", () => {
    const reviews = [
      makeReview({ id: "r1", minutesDistributed: true }),
      makeReview({ id: "r2", minutesDistributed: true }),
      makeReview({ id: "r3", minutesDistributed: true }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.minutesDistributedRate).toBe(100);
    expect(result.minutesDistributedCount).toBe(3);
  });

  it("scores action plan created rate (max 6)", () => {
    const reviews = [
      makeReview({ id: "r1", actionPlanCreated: true }),
      makeReview({ id: "r2", actionPlanCreated: false }),
      makeReview({ id: "r3", actionPlanCreated: false }),
      makeReview({ id: "r4", actionPlanCreated: false }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.actionPlanCreatedRate).toBe(25);
    expect(result.actionPlanCreatedCount).toBe(1);
  });

  it("caps at 25", () => {
    const reviews = [
      makeReview({
        id: "r1", heldOnTime: true, iroPresent: true,
        minutesDistributed: true, actionPlanCreated: true,
      }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.score).toBe(25);
  });

  it("generates strengths for high on-time rate", () => {
    const reviews = Array.from({ length: 10 }, (_, i) =>
      makeReview({ id: `r${i}`, heldOnTime: true }),
    );
    const result = evaluateReviewTimeliness(reviews);
    expect(result.strengths.some((s) => s.includes("timeliness"))).toBe(true);
  });

  it("generates concerns for low on-time rate", () => {
    const reviews = [
      makeReview({ id: "r1", heldOnTime: false }),
      makeReview({ id: "r2", heldOnTime: false }),
      makeReview({ id: "r3", heldOnTime: true }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.concerns.some((c) => c.includes("timeliness"))).toBe(true);
  });

  it("generates concern for low IRO presence", () => {
    const reviews = [
      makeReview({ id: "r1", iroPresent: false }),
      makeReview({ id: "r2", iroPresent: false }),
      makeReview({ id: "r3", iroPresent: true }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.concerns.some((c) => c.includes("IRO"))).toBe(true);
  });

  it("tracks review type breakdown", () => {
    const reviews = [
      makeReview({ id: "r1", reviewType: "initial" }),
      makeReview({ id: "r2", reviewType: "subsequent" }),
      makeReview({ id: "r3", reviewType: "subsequent" }),
      makeReview({ id: "r4", reviewType: "emergency" }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.reviewTypeBreakdown.initial).toBe(1);
    expect(result.reviewTypeBreakdown.subsequent).toBe(2);
    expect(result.reviewTypeBreakdown.emergency).toBe(1);
    expect(result.reviewTypeBreakdown.first_review).toBe(0);
    expect(result.reviewTypeBreakdown.pre_discharge).toBe(0);
  });

  it("Chamberlain House demo scores between 0-25", () => {
    const result = evaluateReviewTimeliness(OAK_HOUSE_REVIEWS);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.totalReviews).toBe(4);
  });

  it("generates concern for low minutes distribution", () => {
    const reviews = [
      makeReview({ id: "r1", minutesDistributed: false }),
      makeReview({ id: "r2", minutesDistributed: false }),
      makeReview({ id: "r3", minutesDistributed: true }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.concerns.some((c) => c.includes("Minutes"))).toBe(true);
  });

  it("generates concern for low action plan rate", () => {
    const reviews = [
      makeReview({ id: "r1", actionPlanCreated: false }),
      makeReview({ id: "r2", actionPlanCreated: false }),
      makeReview({ id: "r3", actionPlanCreated: true }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.concerns.some((c) => c.includes("Action plans"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateChildParticipation
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildParticipation", () => {
  it("returns 0 score for empty array", () => {
    const result = evaluateChildParticipation([]);
    expect(result.score).toBe(0);
    expect(result.totalReviews).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("scores fully participated rate (max 7)", () => {
    const reviews = [
      makeReview({ id: "r1", childParticipation: "fully_participated" }),
      makeReview({ id: "r2", childParticipation: "fully_participated" }),
      makeReview({ id: "r3", childParticipation: "views_submitted" }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.fullyParticipatedRate).toBe(67);
    expect(result.fullyParticipatedCount).toBe(2);
  });

  it("scores views submitted+ rate (max 6)", () => {
    const reviews = [
      makeReview({ id: "r1", childParticipation: "fully_participated" }),
      makeReview({ id: "r2", childParticipation: "views_submitted" }),
      makeReview({ id: "r3", childParticipation: "declined" }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.viewsSubmittedPlusRate).toBe(67);
    expect(result.viewsSubmittedPlusCount).toBe(2);
  });

  it("scores multi-agency attendance rate (max 6)", () => {
    const reviews = [
      makeReview({ id: "r1", attendees: ["child", "social_worker", "iro", "keyworker"] }),
      makeReview({ id: "r2", attendees: ["child", "keyworker"] }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.multiAgencyAttendanceCount).toBe(1);
    expect(result.multiAgencyAttendanceRate).toBe(50);
  });

  it("counts multi-agency as 3+ unique attendee types", () => {
    const reviews = [
      makeReview({ id: "r1", attendees: ["child", "social_worker", "iro"] }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.multiAgencyAttendanceCount).toBe(1);
    expect(result.multiAgencyAttendanceRate).toBe(100);
  });

  it("does not count 2 attendee types as multi-agency", () => {
    const reviews = [
      makeReview({ id: "r1", attendees: ["child", "keyworker"] }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.multiAgencyAttendanceCount).toBe(0);
    expect(result.multiAgencyAttendanceRate).toBe(0);
  });

  it("scores previous goals reviewed rate (max 6)", () => {
    const reviews = [
      makeReview({ id: "r1", previousGoalsReviewed: true }),
      makeReview({ id: "r2", previousGoalsReviewed: true }),
      makeReview({ id: "r3", previousGoalsReviewed: false }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.previousGoalsReviewedRate).toBe(67);
    expect(result.previousGoalsReviewedCount).toBe(2);
  });

  it("caps at 25", () => {
    const reviews = [
      makeReview({
        id: "r1",
        childParticipation: "fully_participated",
        attendees: ["child", "social_worker", "iro", "keyworker"],
        previousGoalsReviewed: true,
      }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.score).toBe(25);
  });

  it("tracks participation breakdown", () => {
    const reviews = [
      makeReview({ id: "r1", childParticipation: "fully_participated" }),
      makeReview({ id: "r2", childParticipation: "views_submitted" }),
      makeReview({ id: "r3", childParticipation: "declined" }),
      makeReview({ id: "r4", childParticipation: "not_invited" }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.participationBreakdown.fully_participated).toBe(1);
    expect(result.participationBreakdown.views_submitted).toBe(1);
    expect(result.participationBreakdown.declined).toBe(1);
    expect(result.participationBreakdown.not_invited).toBe(1);
    expect(result.participationBreakdown.partially_participated).toBe(0);
  });

  it("calculates average attendees per review", () => {
    const reviews = [
      makeReview({ id: "r1", attendees: ["child", "social_worker", "iro", "keyworker"] }),
      makeReview({ id: "r2", attendees: ["child", "keyworker"] }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.averageAttendeesPerReview).toBe(3);
  });

  it("generates strengths for high full participation", () => {
    const reviews = Array.from({ length: 5 }, (_, i) =>
      makeReview({ id: `r${i}`, childParticipation: "fully_participated" }),
    );
    const result = evaluateChildParticipation(reviews);
    expect(result.strengths.some((s) => s.includes("child participation") || s.includes("Excellent"))).toBe(true);
  });

  it("generates concern for low participation", () => {
    const reviews = [
      makeReview({ id: "r1", childParticipation: "declined" }),
      makeReview({ id: "r2", childParticipation: "declined" }),
      makeReview({ id: "r3", childParticipation: "fully_participated" }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.fullyParticipatedRate).toBe(33);
    expect(result.concerns.some((c) => c.includes("participation") || c.includes("UNCRC"))).toBe(true);
  });

  it("generates concern for not_invited children", () => {
    const reviews = [
      makeReview({ id: "r1", childParticipation: "not_invited" }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.concerns.some((c) => c.includes("not invited"))).toBe(true);
  });

  it("generates concern for low multi-agency attendance", () => {
    const reviews = [
      makeReview({ id: "r1", attendees: ["child", "keyworker"] }),
      makeReview({ id: "r2", attendees: ["child", "keyworker"] }),
    ];
    const result = evaluateChildParticipation(reviews);
    expect(result.concerns.some((c) => c.includes("Multi-agency") || c.includes("collaborative"))).toBe(true);
  });

  it("Chamberlain House demo scores between 0-25", () => {
    const result = evaluateChildParticipation(OAK_HOUSE_REVIEWS);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.totalReviews).toBe(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateGoalAchievement
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateGoalAchievement", () => {
  it("returns 0 score for empty array", () => {
    const result = evaluateGoalAchievement([]);
    expect(result.score).toBe(0);
    expect(result.totalGoals).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("scores achieved rate (max 7)", () => {
    const goals = [
      makeGoal({ id: "g1", goalStatus: "achieved" }),
      makeGoal({ id: "g2", goalStatus: "achieved" }),
      makeGoal({ id: "g3", goalStatus: "not_met" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.achievedRate).toBe(67);
    expect(result.achievedCount).toBe(2);
  });

  it("scores on-track+ rate (max 6)", () => {
    const goals = [
      makeGoal({ id: "g1", goalStatus: "achieved" }),
      makeGoal({ id: "g2", goalStatus: "on_track" }),
      makeGoal({ id: "g3", goalStatus: "not_met" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.onTrackPlusRate).toBe(67);
    expect(result.onTrackPlusCount).toBe(2);
  });

  it("scores not-met rate inversed (max 6)", () => {
    const goals = [
      makeGoal({ id: "g1", goalStatus: "achieved" }),
      makeGoal({ id: "g2", goalStatus: "achieved" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.notMetRate).toBe(0);
    // 100% inversed => full 6 points from not-met component
  });

  it("high not-met rate reduces score", () => {
    const goals = [
      makeGoal({ id: "g1", goalStatus: "not_met" }),
      makeGoal({ id: "g2", goalStatus: "not_met" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.notMetRate).toBe(100);
    expect(result.score).toBeLessThan(10);
  });

  it("scores goals-per-child breadth (max 6, target 3+)", () => {
    const goals = [
      makeGoal({ id: "g1", childId: "child-a", goalStatus: "achieved" }),
      makeGoal({ id: "g2", childId: "child-a", goalStatus: "achieved" }),
      makeGoal({ id: "g3", childId: "child-a", goalStatus: "achieved" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.goalsPerChild).toBe(3);
    expect(result.uniqueChildren).toBe(1);
    // 3 goals per child => full breadth marks
  });

  it("caps breadth at 3+ goals per child", () => {
    const goals = [
      makeGoal({ id: "g1", childId: "child-a", goalStatus: "achieved" }),
      makeGoal({ id: "g2", childId: "child-a", goalStatus: "achieved" }),
      makeGoal({ id: "g3", childId: "child-a", goalStatus: "achieved" }),
      makeGoal({ id: "g4", childId: "child-a", goalStatus: "achieved" }),
      makeGoal({ id: "g5", childId: "child-a", goalStatus: "achieved" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.goalsPerChild).toBe(5);
    // breadth factor still capped at 1 (min(5/3, 1) = 1)
  });

  it("caps at 25", () => {
    const goals = [
      makeGoal({ id: "g1", childId: "child-a", goalStatus: "achieved" }),
      makeGoal({ id: "g2", childId: "child-a", goalStatus: "achieved" }),
      makeGoal({ id: "g3", childId: "child-a", goalStatus: "achieved" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.score).toBe(25);
  });

  it("tracks status breakdown", () => {
    const goals = [
      makeGoal({ id: "g1", goalStatus: "achieved" }),
      makeGoal({ id: "g2", goalStatus: "on_track" }),
      makeGoal({ id: "g3", goalStatus: "partially_met" }),
      makeGoal({ id: "g4", goalStatus: "not_met" }),
      makeGoal({ id: "g5", goalStatus: "deferred" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.statusBreakdown.achieved).toBe(1);
    expect(result.statusBreakdown.on_track).toBe(1);
    expect(result.statusBreakdown.partially_met).toBe(1);
    expect(result.statusBreakdown.not_met).toBe(1);
    expect(result.statusBreakdown.deferred).toBe(1);
  });

  it("generates strengths for high achievement rate", () => {
    const goals = [
      makeGoal({ id: "g1", goalStatus: "achieved" }),
      makeGoal({ id: "g2", goalStatus: "achieved" }),
      makeGoal({ id: "g3", goalStatus: "achieved" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.strengths.some((s) => s.includes("achievement"))).toBe(true);
  });

  it("generates concern for low achievement rate", () => {
    const goals = [
      makeGoal({ id: "g1", goalStatus: "not_met" }),
      makeGoal({ id: "g2", goalStatus: "partially_met" }),
      makeGoal({ id: "g3", goalStatus: "deferred" }),
      makeGoal({ id: "g4", goalStatus: "not_met" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.achievedRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("achievement"))).toBe(true);
  });

  it("generates concern for high not-met rate", () => {
    const goals = [
      makeGoal({ id: "g1", goalStatus: "not_met" }),
      makeGoal({ id: "g2", goalStatus: "not_met" }),
      makeGoal({ id: "g3", goalStatus: "achieved" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.notMetRate).toBe(67);
    expect(result.concerns.some((c) => c.includes("not met"))).toBe(true);
  });

  it("generates concern for low goals per child", () => {
    const goals = [
      makeGoal({ id: "g1", childId: "child-a", goalStatus: "achieved" }),
      makeGoal({ id: "g2", childId: "child-b", goalStatus: "achieved" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.goalsPerChild).toBe(1);
    expect(result.concerns.some((c) => c.includes("goals per child"))).toBe(true);
  });

  it("Chamberlain House demo scores between 0-25", () => {
    const result = evaluateGoalAchievement(OAK_HOUSE_GOALS);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.totalGoals).toBe(11);
    expect(result.uniqueChildren).toBe(3);
  });

  it("counts unique children correctly", () => {
    const goals = [
      makeGoal({ id: "g1", childId: "child-a" }),
      makeGoal({ id: "g2", childId: "child-a" }),
      makeGoal({ id: "g3", childId: "child-b" }),
    ];
    const result = evaluateGoalAchievement(goals);
    expect(result.uniqueChildren).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateStaffReviewReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffReviewReadiness", () => {
  it("returns 0 score for empty array", () => {
    const result = evaluateStaffReviewReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("scores reviewProcess at weight 6", () => {
    const training = [
      makeTraining({ id: "t1", reviewProcess: true, childParticipation: false, goalSetting: false, multiAgencyWorking: false, minutesTaking: false, advocacyAwareness: false }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.reviewProcessRate).toBe(100);
    expect(result.score).toBe(6);
  });

  it("scores childParticipation at weight 5", () => {
    const training = [
      makeTraining({ id: "t1", reviewProcess: false, childParticipation: true, goalSetting: false, multiAgencyWorking: false, minutesTaking: false, advocacyAwareness: false }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.childParticipationRate).toBe(100);
    expect(result.score).toBe(5);
  });

  it("scores goalSetting at weight 4", () => {
    const training = [
      makeTraining({ id: "t1", reviewProcess: false, childParticipation: false, goalSetting: true, multiAgencyWorking: false, minutesTaking: false, advocacyAwareness: false }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.goalSettingRate).toBe(100);
    expect(result.score).toBe(4);
  });

  it("scores multiAgencyWorking at weight 4", () => {
    const training = [
      makeTraining({ id: "t1", reviewProcess: false, childParticipation: false, goalSetting: false, multiAgencyWorking: true, minutesTaking: false, advocacyAwareness: false }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.multiAgencyWorkingRate).toBe(100);
    expect(result.score).toBe(4);
  });

  it("scores minutesTaking at weight 3", () => {
    const training = [
      makeTraining({ id: "t1", reviewProcess: false, childParticipation: false, goalSetting: false, multiAgencyWorking: false, minutesTaking: true, advocacyAwareness: false }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.minutesTakingRate).toBe(100);
    expect(result.score).toBe(3);
  });

  it("scores advocacyAwareness at weight 3", () => {
    const training = [
      makeTraining({ id: "t1", reviewProcess: false, childParticipation: false, goalSetting: false, multiAgencyWorking: false, minutesTaking: false, advocacyAwareness: true }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.advocacyAwarenessRate).toBe(100);
    expect(result.score).toBe(3);
  });

  it("all fields sum to 25", () => {
    const training = [
      makeTraining({
        id: "t1", reviewProcess: true, childParticipation: true,
        goalSetting: true, multiAgencyWorking: true,
        minutesTaking: true, advocacyAwareness: true,
      }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.score).toBe(25);
  });

  it("caps at 25", () => {
    const training = [
      makeTraining({ id: "t1" }),
      makeTraining({ id: "t2" }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("computes overall ready count", () => {
    const training = [
      makeTraining({ id: "t1", reviewProcess: true, childParticipation: true, goalSetting: true, multiAgencyWorking: true, minutesTaking: true, advocacyAwareness: true }),
      makeTraining({ id: "t2", reviewProcess: true, childParticipation: true, goalSetting: true, multiAgencyWorking: true, minutesTaking: true, advocacyAwareness: false }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.overallReadyCount).toBe(1);
    expect(result.overallReadyRate).toBe(50);
  });

  it("generates strengths for 100% overall readiness", () => {
    const training = [makeTraining({ id: "t1" })];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.strengths.some((s) => s.includes("100%"))).toBe(true);
  });

  it("generates concern for low overall readiness", () => {
    const training = [
      makeTraining({ id: "t1", reviewProcess: true, childParticipation: false, goalSetting: false, multiAgencyWorking: false, minutesTaking: false, advocacyAwareness: false }),
      makeTraining({ id: "t2", reviewProcess: false, childParticipation: true, goalSetting: false, multiAgencyWorking: false, minutesTaking: false, advocacyAwareness: false }),
      makeTraining({ id: "t3", reviewProcess: false, childParticipation: false, goalSetting: true, multiAgencyWorking: false, minutesTaking: false, advocacyAwareness: false }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.overallReadyRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("complete review training"))).toBe(true);
  });

  it("generates concern for low review process training", () => {
    const training = [
      makeTraining({ id: "t1", reviewProcess: false }),
      makeTraining({ id: "t2", reviewProcess: false }),
      makeTraining({ id: "t3", reviewProcess: true }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    expect(result.concerns.some((c) => c.includes("Review process") || c.includes("review process"))).toBe(true);
  });

  it("Chamberlain House demo scores between 0-25", () => {
    const result = evaluateStaffReviewReadiness(OAK_HOUSE_TRAINING);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.totalStaff).toBe(4);
  });

  it("computes individual field rates correctly", () => {
    const result = evaluateStaffReviewReadiness(OAK_HOUSE_TRAINING);
    expect(result.reviewProcessRate).toBe(100);
    expect(result.childParticipationRate).toBe(100);
    expect(result.goalSettingRate).toBe(100);
    expect(result.multiAgencyWorkingRate).toBe(75);
    expect(result.minutesTakingRate).toBe(75);
    expect(result.advocacyAwarenessRate).toBe(75);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildReviewProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildReviewProfiles", () => {
  it("returns empty array for no data", () => {
    const result = buildChildReviewProfiles([], []);
    expect(result).toEqual([]);
  });

  it("builds profiles from reviews only", () => {
    const reviews = [
      makeReview({ id: "r1", childId: "child-alex", childName: "Alex", heldOnTime: true }),
    ];
    const result = buildChildReviewProfiles(reviews, []);
    expect(result.length).toBe(1);
    expect(result[0].childId).toBe("child-alex");
    expect(result[0].childName).toBe("Alex");
    expect(result[0].totalReviews).toBe(1);
    expect(result[0].totalGoals).toBe(0);
  });

  it("builds profiles from goals only", () => {
    const goals = [
      makeGoal({ id: "g1", childId: "child-alex", childName: "Alex", goalStatus: "achieved" }),
    ];
    const result = buildChildReviewProfiles([], goals);
    expect(result.length).toBe(1);
    expect(result[0].childId).toBe("child-alex");
    expect(result[0].totalReviews).toBe(0);
    expect(result[0].totalGoals).toBe(1);
  });

  it("merges children from reviews and goals", () => {
    const reviews = [
      makeReview({ id: "r1", childId: "child-alex", childName: "Alex" }),
    ];
    const goals = [
      makeGoal({ id: "g1", childId: "child-alex", childName: "Alex" }),
      makeGoal({ id: "g2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = buildChildReviewProfiles(reviews, goals);
    expect(result.length).toBe(2);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex?.totalReviews).toBe(1);
    expect(alex?.totalGoals).toBe(1);
  });

  it("counts on-time reviews per child", () => {
    const reviews = [
      makeReview({ id: "r1", childId: "child-alex", childName: "Alex", heldOnTime: true }),
      makeReview({ id: "r2", childId: "child-alex", childName: "Alex", heldOnTime: false }),
    ];
    const result = buildChildReviewProfiles(reviews, []);
    const alex = result.find((p) => p.childId === "child-alex")!;
    expect(alex.onTimeReviews).toBe(1);
    expect(alex.totalReviews).toBe(2);
  });

  it("tracks participation levels per child", () => {
    const reviews = [
      makeReview({ id: "r1", childId: "child-alex", childName: "Alex", childParticipation: "fully_participated" }),
      makeReview({ id: "r2", childId: "child-alex", childName: "Alex", childParticipation: "views_submitted" }),
    ];
    const result = buildChildReviewProfiles(reviews, []);
    const alex = result.find((p) => p.childId === "child-alex")!;
    expect(alex.participationLevels).toEqual(["fully_participated", "views_submitted"]);
  });

  it("counts goal statuses per child", () => {
    const goals = [
      makeGoal({ id: "g1", childId: "child-alex", childName: "Alex", goalStatus: "achieved" }),
      makeGoal({ id: "g2", childId: "child-alex", childName: "Alex", goalStatus: "on_track" }),
      makeGoal({ id: "g3", childId: "child-alex", childName: "Alex", goalStatus: "not_met" }),
    ];
    const result = buildChildReviewProfiles([], goals);
    const alex = result.find((p) => p.childId === "child-alex")!;
    expect(alex.goalsAchieved).toBe(1);
    expect(alex.goalsOnTrack).toBe(1);
    expect(alex.goalsNotMet).toBe(1);
    expect(alex.totalGoals).toBe(3);
  });

  it("calculates score 0-10 per child", () => {
    const reviews = [
      makeReview({ id: "r1", childId: "child-alex", childName: "Alex", heldOnTime: true, childParticipation: "fully_participated" }),
    ];
    const goals = [
      makeGoal({ id: "g1", childId: "child-alex", childName: "Alex", goalStatus: "achieved" }),
      makeGoal({ id: "g2", childId: "child-alex", childName: "Alex", goalStatus: "achieved" }),
    ];
    const result = buildChildReviewProfiles(reviews, goals);
    const alex = result.find((p) => p.childId === "child-alex")!;
    expect(alex.score).toBe(10);
  });

  it("gives lower score for poor timeliness", () => {
    const reviews = [
      makeReview({ id: "r1", childId: "child-alex", childName: "Alex", heldOnTime: false, childParticipation: "fully_participated" }),
    ];
    const goals = [
      makeGoal({ id: "g1", childId: "child-alex", childName: "Alex", goalStatus: "achieved" }),
    ];
    const result = buildChildReviewProfiles(reviews, goals);
    const alex = result.find((p) => p.childId === "child-alex")!;
    expect(alex.score).toBe(7);
  });

  it("gives lower score for low participation", () => {
    const reviews = [
      makeReview({ id: "r1", childId: "child-alex", childName: "Alex", heldOnTime: true, childParticipation: "declined" }),
    ];
    const goals = [
      makeGoal({ id: "g1", childId: "child-alex", childName: "Alex", goalStatus: "achieved" }),
    ];
    const result = buildChildReviewProfiles(reviews, goals);
    const alex = result.find((p) => p.childId === "child-alex")!;
    expect(alex.score).toBe(7);
  });

  it("gives lower score for not-met goals", () => {
    const reviews = [
      makeReview({ id: "r1", childId: "child-alex", childName: "Alex", heldOnTime: true, childParticipation: "fully_participated" }),
    ];
    const goals = [
      makeGoal({ id: "g1", childId: "child-alex", childName: "Alex", goalStatus: "not_met" }),
    ];
    const result = buildChildReviewProfiles(reviews, goals);
    const alex = result.find((p) => p.childId === "child-alex")!;
    expect(alex.score).toBe(6);
  });

  it("clamps score between 0 and 10", () => {
    const reviews = [
      makeReview({ id: "r1", childId: "child-alex", childName: "Alex", heldOnTime: false, childParticipation: "declined" }),
    ];
    const goals = [
      makeGoal({ id: "g1", childId: "child-alex", childName: "Alex", goalStatus: "not_met" }),
      makeGoal({ id: "g2", childId: "child-alex", childName: "Alex", goalStatus: "not_met" }),
    ];
    const result = buildChildReviewProfiles(reviews, goals);
    const alex = result.find((p) => p.childId === "child-alex")!;
    expect(alex.score).toBeGreaterThanOrEqual(0);
    expect(alex.score).toBeLessThanOrEqual(10);
  });

  it("Chamberlain House demo builds 3 child profiles", () => {
    const result = buildChildReviewProfiles(OAK_HOUSE_REVIEWS, OAK_HOUSE_GOALS);
    expect(result.length).toBe(3);
    const names = result.map((p) => p.childName).sort();
    expect(names).toEqual(["Alex", "Jordan", "Morgan"]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateAnnualDevelopmentReviewIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateAnnualDevelopmentReviewIntelligence", () => {
  it("returns complete intelligence object", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      OAK_HOUSE_REVIEWS,
      OAK_HOUSE_GOALS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("overall score is sum of 4 evaluators", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      OAK_HOUSE_REVIEWS,
      OAK_HOUSE_GOALS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    const expectedSum = Math.round(
      result.reviewTimeliness.score +
      result.childParticipation.score +
      result.goalAchievement.score +
      result.staffReviewReadiness.score,
    );
    expect(result.overallScore).toBe(expectedSum);
  });

  it("caps overall score at 100", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      OAK_HOUSE_REVIEWS,
      OAK_HOUSE_GOALS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("filters reviews to period", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      OAK_HOUSE_REVIEWS,
      OAK_HOUSE_GOALS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-04-01",
      "2026-05-19",
    );
    // Only rev-003 (2026-04-20) and rev-004 (2026-05-01) within period
    expect(result.reviewTimeliness.totalReviews).toBe(2);
  });

  it("filters goals to reviews in period", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      OAK_HOUSE_REVIEWS,
      OAK_HOUSE_GOALS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-04-01",
      "2026-05-19",
    );
    // Goals for rev-003 and rev-004 only
    // rev-003 has 3 goals (goal-008, goal-009, goal-010), rev-004 has 1 (goal-011)
    expect(result.goalAchievement.totalGoals).toBe(4);
  });

  it("includes child profiles", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      OAK_HOUSE_REVIEWS,
      OAK_HOUSE_GOALS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.childProfiles.length).toBe(3);
  });

  it("includes strengths array", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      OAK_HOUSE_REVIEWS,
      OAK_HOUSE_GOALS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("includes areasForImprovement array", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      OAK_HOUSE_REVIEWS,
      OAK_HOUSE_GOALS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("includes actions array", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      OAK_HOUSE_REVIEWS,
      OAK_HOUSE_GOALS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(Array.isArray(result.actions)).toBe(true);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      OAK_HOUSE_REVIEWS,
      OAK_HOUSE_GOALS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("CHR 2015, Reg 45 — Review of quality of care");
    expect(result.regulatoryLinks).toContain("CHR 2015, Reg 14 — Care planning");
    expect(result.regulatoryLinks).toContain("SCCIF — How well children are helped and protected");
    expect(result.regulatoryLinks).toContain("IRO Handbook 2010 — Independent reviewing officer guidance");
    expect(result.regulatoryLinks).toContain("Children Act 1989 — Welfare and care planning");
    expect(result.regulatoryLinks).toContain("UNCRC Article 12 — Right to be heard");
    expect(result.regulatoryLinks).toContain("Care Planning Regulations 2010 — Statutory review requirements");
  });

  it("returns outstanding for high scores", () => {
    // All perfect data
    const reviews = [
      makeReview({
        id: "r1", heldOnTime: true, iroPresent: true,
        childParticipation: "fully_participated",
        attendees: ["child", "social_worker", "iro", "keyworker"],
        previousGoalsReviewed: true,
        actionPlanCreated: true, minutesDistributed: true,
        reviewDate: "2026-03-01",
      }),
    ];
    const goals = [
      makeGoal({ id: "g1", reviewId: "r1", goalStatus: "achieved" }),
      makeGoal({ id: "g2", reviewId: "r1", goalStatus: "achieved" }),
      makeGoal({ id: "g3", reviewId: "r1", goalStatus: "achieved" }),
    ];
    const training = [makeTraining({ id: "t1" })];
    const result = generateAnnualDevelopmentReviewIntelligence(
      reviews, goals, OAK_HOUSE_POLICY, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate for empty data", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      [], [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
  });

  it("handles empty reviews with non-empty goals gracefully", () => {
    // Goals that don't match any review IDs
    const goals = [makeGoal({ id: "g1", reviewId: "nonexistent" })];
    const result = generateAnnualDevelopmentReviewIntelligence(
      [], goals, null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.reviewTimeliness.score).toBe(0);
    expect(result.goalAchievement.score).toBe(0); // filtered goals won't match
  });

  it("has assessedAt timestamp", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      [], [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.assessedAt).toBeTruthy();
    expect(new Date(result.assessedAt).getTime()).not.toBeNaN();
  });

  it("includes 4 layer results", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      OAK_HOUSE_REVIEWS,
      OAK_HOUSE_GOALS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.reviewTimeliness).toBeDefined();
    expect(result.childParticipation).toBeDefined();
    expect(result.goalAchievement).toBeDefined();
    expect(result.staffReviewReadiness).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Rating Logic
// ══════════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("80+ = outstanding", () => {
    const reviews = [
      makeReview({ id: "r1", heldOnTime: true, iroPresent: true, childParticipation: "fully_participated", attendees: ["child", "social_worker", "iro", "keyworker"], previousGoalsReviewed: true, actionPlanCreated: true, minutesDistributed: true, reviewDate: "2026-03-01" }),
    ];
    const goals = [
      makeGoal({ id: "g1", reviewId: "r1", goalStatus: "achieved" }),
      makeGoal({ id: "g2", reviewId: "r1", goalStatus: "achieved" }),
      makeGoal({ id: "g3", reviewId: "r1", goalStatus: "achieved" }),
    ];
    const training = [makeTraining({ id: "t1" })];
    const result = generateAnnualDevelopmentReviewIntelligence(
      reviews, goals, OAK_HOUSE_POLICY, training,
      "test", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
  });

  it("60-79 = good", () => {
    // More imperfections to land firmly in the 60-79 range
    const reviews = [
      makeReview({ id: "r1", heldOnTime: true, iroPresent: true, childParticipation: "fully_participated", attendees: ["child", "social_worker", "iro"], previousGoalsReviewed: true, actionPlanCreated: true, minutesDistributed: true, reviewDate: "2026-03-01" }),
      makeReview({ id: "r2", heldOnTime: false, iroPresent: false, childParticipation: "views_submitted", attendees: ["social_worker", "keyworker"], previousGoalsReviewed: false, actionPlanCreated: true, minutesDistributed: false, reviewDate: "2026-04-01" }),
    ];
    const goals = [
      makeGoal({ id: "g1", reviewId: "r1", goalStatus: "achieved" }),
      makeGoal({ id: "g2", reviewId: "r1", goalStatus: "partially_met" }),
      makeGoal({ id: "g3", reviewId: "r2", goalStatus: "not_met" }),
    ];
    const training = [
      makeTraining({ id: "t1" }),
      makeTraining({ id: "t2", advocacyAwareness: false, minutesTaking: false, goalSetting: false, reviewProcess: false }),
    ];
    const result = generateAnnualDevelopmentReviewIntelligence(
      reviews, goals, OAK_HOUSE_POLICY, training,
      "test", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
    expect(result.rating).toBe("good");
  });

  it("0 = inadequate with empty data", () => {
    const result = generateAnnualDevelopmentReviewIntelligence(
      [], [], null, [],
      "test", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getReviewTypeLabel", () => {
  it("returns Initial", () => expect(getReviewTypeLabel("initial")).toBe("Initial"));
  it("returns First Review", () => expect(getReviewTypeLabel("first_review")).toBe("First Review"));
  it("returns Subsequent", () => expect(getReviewTypeLabel("subsequent")).toBe("Subsequent"));
  it("returns Emergency", () => expect(getReviewTypeLabel("emergency")).toBe("Emergency"));
  it("returns Pre-Discharge", () => expect(getReviewTypeLabel("pre_discharge")).toBe("Pre-Discharge"));
});

describe("getGoalStatusLabel", () => {
  it("returns Achieved", () => expect(getGoalStatusLabel("achieved")).toBe("Achieved"));
  it("returns On Track", () => expect(getGoalStatusLabel("on_track")).toBe("On Track"));
  it("returns Partially Met", () => expect(getGoalStatusLabel("partially_met")).toBe("Partially Met"));
  it("returns Not Met", () => expect(getGoalStatusLabel("not_met")).toBe("Not Met"));
  it("returns Deferred", () => expect(getGoalStatusLabel("deferred")).toBe("Deferred"));
});

describe("getAttendeeTypeLabel", () => {
  it("returns Child", () => expect(getAttendeeTypeLabel("child")).toBe("Child"));
  it("returns Social Worker", () => expect(getAttendeeTypeLabel("social_worker")).toBe("Social Worker"));
  it("returns IRO", () => expect(getAttendeeTypeLabel("iro")).toBe("IRO"));
  it("returns Parent/Carer", () => expect(getAttendeeTypeLabel("parent_carer")).toBe("Parent/Carer"));
  it("returns Teacher", () => expect(getAttendeeTypeLabel("teacher")).toBe("Teacher"));
  it("returns Health Professional", () => expect(getAttendeeTypeLabel("health_professional")).toBe("Health Professional"));
  it("returns Advocate", () => expect(getAttendeeTypeLabel("advocate")).toBe("Advocate"));
  it("returns Keyworker", () => expect(getAttendeeTypeLabel("keyworker")).toBe("Keyworker"));
  it("returns Manager", () => expect(getAttendeeTypeLabel("manager")).toBe("Manager"));
  it("returns Other", () => expect(getAttendeeTypeLabel("other")).toBe("Other"));
});

describe("getParticipationLevelLabel", () => {
  it("returns Fully Participated", () => expect(getParticipationLevelLabel("fully_participated")).toBe("Fully Participated"));
  it("returns Views Submitted", () => expect(getParticipationLevelLabel("views_submitted")).toBe("Views Submitted"));
  it("returns Partially Participated", () => expect(getParticipationLevelLabel("partially_participated")).toBe("Partially Participated"));
  it("returns Declined", () => expect(getParticipationLevelLabel("declined")).toBe("Declined"));
  it("returns Not Invited", () => expect(getParticipationLevelLabel("not_invited")).toBe("Not Invited"));
});

describe("getRatingLabel", () => {
  it("returns Outstanding", () => expect(getRatingLabel("outstanding")).toBe("Outstanding"));
  it("returns Good", () => expect(getRatingLabel("good")).toBe("Good"));
  it("returns Requires Improvement", () => expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement"));
  it("returns Inadequate", () => expect(getRatingLabel("inadequate")).toBe("Inadequate"));
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. Edge Cases and Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("single review with all flags true gives max score for timeliness", () => {
    const reviews = [
      makeReview({
        id: "r1", heldOnTime: true, iroPresent: true,
        minutesDistributed: true, actionPlanCreated: true,
      }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.score).toBe(25);
  });

  it("single review with all flags false gives 0 for timeliness", () => {
    const reviews = [
      makeReview({
        id: "r1", heldOnTime: false, iroPresent: false,
        minutesDistributed: false, actionPlanCreated: false,
      }),
    ];
    const result = evaluateReviewTimeliness(reviews);
    expect(result.score).toBe(0);
  });

  it("single perfect goal gives max possible score for achievement", () => {
    const goals = [
      makeGoal({ id: "g1", childId: "child-a", goalStatus: "achieved" }),
    ];
    const result = evaluateGoalAchievement(goals);
    // achieved=7, onTrack+=6, notMet inversed=6, breadth=1/3*6=2 => 21
    expect(result.score).toBe(21);
  });

  it("training with partial fields scores proportionally", () => {
    const training = [
      makeTraining({
        id: "t1", reviewProcess: true, childParticipation: true,
        goalSetting: false, multiAgencyWorking: false,
        minutesTaking: false, advocacyAwareness: false,
      }),
    ];
    const result = evaluateStaffReviewReadiness(training);
    // 6 + 5 = 11
    expect(result.score).toBe(11);
  });

  it("handles large number of reviews without error", () => {
    const reviews = Array.from({ length: 100 }, (_, i) =>
      makeReview({ id: `r${i}`, heldOnTime: i % 2 === 0, reviewDate: "2026-03-01" }),
    );
    const result = evaluateReviewTimeliness(reviews);
    expect(result.totalReviews).toBe(100);
    expect(result.heldOnTimeRate).toBe(50);
  });

  it("handles large number of goals without error", () => {
    const goals = Array.from({ length: 100 }, (_, i) =>
      makeGoal({ id: `g${i}`, goalStatus: i % 3 === 0 ? "achieved" : "on_track" }),
    );
    const result = evaluateGoalAchievement(goals);
    expect(result.totalGoals).toBe(100);
  });

  it("reviews outside period are excluded", () => {
    const reviews = [
      makeReview({ id: "r1", reviewDate: "2025-12-01" }),
      makeReview({ id: "r2", reviewDate: "2026-06-01" }),
      makeReview({ id: "r3", reviewDate: "2026-03-15" }),
    ];
    const result = generateAnnualDevelopmentReviewIntelligence(
      reviews, [], null, [],
      "test", "2026-01-01", "2026-05-19",
    );
    expect(result.reviewTimeliness.totalReviews).toBe(1);
  });

  it("goals linked to excluded reviews are filtered out", () => {
    const reviews = [
      makeReview({ id: "r1", reviewDate: "2025-12-01" }),
      makeReview({ id: "r2", reviewDate: "2026-03-15" }),
    ];
    const goals = [
      makeGoal({ id: "g1", reviewId: "r1", goalStatus: "achieved" }),
      makeGoal({ id: "g2", reviewId: "r2", goalStatus: "on_track" }),
    ];
    const result = generateAnnualDevelopmentReviewIntelligence(
      reviews, goals, null, [],
      "test", "2026-01-01", "2026-05-19",
    );
    expect(result.goalAchievement.totalGoals).toBe(1);
    expect(result.goalAchievement.statusBreakdown.on_track).toBe(1);
    expect(result.goalAchievement.statusBreakdown.achieved).toBe(0);
  });
});
