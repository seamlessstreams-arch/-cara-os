// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Homework & Learning Support Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson (Senior RSW), Tom Richards (RSW),
//        Lisa Williams (Senior RSW), Darren Laville (RM/DSL)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateHomeworkEngagement,
  evaluateLearningEnvironment,
  evaluateLearningPolicy,
  evaluateStaffLearningReadiness,
  buildChildLearningProfiles,
  generateHomeworkLearningSupportIntelligence,
  getSubjectAreaLabel,
  getEngagementLevelLabel,
  getRatingLabel,
  getRating,
  pct,
} from "../homework-learning-support-engine";
import type {
  HomeworkSession,
  LearningPolicy,
  StaffLearningTraining,
} from "../homework-learning-support-engine";

// ── Test Fixtures ────────────────────────────────────────────────────────

const makeSession = (overrides: Partial<HomeworkSession> = {}): HomeworkSession => ({
  id: "hw-001",
  childId: "child-alex",
  childName: "Alex",
  sessionDate: "2026-03-10",
  subjectArea: "maths",
  engagementLevel: "willing",
  taskCompleted: true,
  staffSupported: true,
  quietSpaceProvided: true,
  resourcesAvailable: true,
  progressNoted: true,
  documentedInLog: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<LearningPolicy> = {}): LearningPolicy => ({
  id: "policy-001",
  homeworkPolicy: true,
  quietStudySpaces: true,
  learningResources: true,
  educationLiaison: true,
  individualLearningPlans: true,
  tutoringProvision: true,
  regularReview: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffLearningTraining> = {}): StaffLearningTraining => ({
  id: "slt-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  homeworkSupport: true,
  learningDifficulties: true,
  educationalMotivation: true,
  senAwareness: true,
  digitalLiteracy: true,
  communicationWithSchools: true,
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// 0. pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when numerator equals denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("handles 50% correctly", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });

  it("returns 0 when both are 0", () => {
    expect(pct(0, 0)).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 0b. getRating helper
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });

  it("handles boundary at 80 exactly", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(79)).toBe("good");
  });

  it("handles boundary at 60 exactly", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("handles boundary at 40 exactly", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 0c. Label getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getSubjectAreaLabel", () => {
  it("returns English for english", () => {
    expect(getSubjectAreaLabel("english")).toBe("English");
  });

  it("returns Maths for maths", () => {
    expect(getSubjectAreaLabel("maths")).toBe("Maths");
  });

  it("returns Science for science", () => {
    expect(getSubjectAreaLabel("science")).toBe("Science");
  });

  it("returns Humanities for humanities", () => {
    expect(getSubjectAreaLabel("humanities")).toBe("Humanities");
  });

  it("returns Languages for languages", () => {
    expect(getSubjectAreaLabel("languages")).toBe("Languages");
  });

  it("returns Creative Arts for creative_arts", () => {
    expect(getSubjectAreaLabel("creative_arts")).toBe("Creative Arts");
  });

  it("returns Technology for technology", () => {
    expect(getSubjectAreaLabel("technology")).toBe("Technology");
  });

  it("returns Life Skills for life_skills", () => {
    expect(getSubjectAreaLabel("life_skills")).toBe("Life Skills");
  });
});

describe("getEngagementLevelLabel", () => {
  it("returns Enthusiastic for enthusiastic", () => {
    expect(getEngagementLevelLabel("enthusiastic")).toBe("Enthusiastic");
  });

  it("returns Willing for willing", () => {
    expect(getEngagementLevelLabel("willing")).toBe("Willing");
  });

  it("returns Reluctant for reluctant", () => {
    expect(getEngagementLevelLabel("reluctant")).toBe("Reluctant");
  });

  it("returns Refused for refused", () => {
    expect(getEngagementLevelLabel("refused")).toBe("Refused");
  });

  it("returns Unable for unable", () => {
    expect(getEngagementLevelLabel("unable")).toBe("Unable");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns Good for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns Requires Improvement for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns Inadequate for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateHomeworkEngagement
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHomeworkEngagement", () => {
  it("returns score 0 for empty sessions", () => {
    const result = evaluateHomeworkEngagement([]);
    expect(result.score).toBe(0);
    expect(result.totalSessions).toBe(0);
  });

  it("returns all zero rates for empty sessions", () => {
    const result = evaluateHomeworkEngagement([]);
    expect(result.completionRate).toBe(0);
    expect(result.engagementRate).toBe(0);
    expect(result.progressNotedRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
    expect(result.documentedInLogRate).toBe(0);
  });

  it("returns all zero counts for empty sessions", () => {
    const result = evaluateHomeworkEngagement([]);
    expect(result.completionCount).toBe(0);
    expect(result.engagementCount).toBe(0);
    expect(result.progressNotedCount).toBe(0);
    expect(result.staffSupportedCount).toBe(0);
    expect(result.documentedInLogCount).toBe(0);
  });

  it("calculates completion rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", taskCompleted: true }),
      makeSession({ id: "2", taskCompleted: false }),
      makeSession({ id: "3", taskCompleted: true }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.completionRate).toBe(67);
    expect(result.completionCount).toBe(2);
  });

  it("returns 100% completion when all completed", () => {
    const sessions = [
      makeSession({ id: "1", taskCompleted: true }),
      makeSession({ id: "2", taskCompleted: true }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.completionRate).toBe(100);
  });

  it("returns 0% completion when none completed", () => {
    const sessions = [
      makeSession({ id: "1", taskCompleted: false }),
      makeSession({ id: "2", taskCompleted: false }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.completionRate).toBe(0);
  });

  it("counts enthusiastic as engaged", () => {
    const sessions = [
      makeSession({ id: "1", engagementLevel: "enthusiastic" }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.engagementCount).toBe(1);
    expect(result.engagementRate).toBe(100);
  });

  it("counts willing as engaged", () => {
    const sessions = [
      makeSession({ id: "1", engagementLevel: "willing" }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.engagementCount).toBe(1);
    expect(result.engagementRate).toBe(100);
  });

  it("does not count reluctant as engaged", () => {
    const sessions = [
      makeSession({ id: "1", engagementLevel: "reluctant" }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.engagementCount).toBe(0);
    expect(result.engagementRate).toBe(0);
  });

  it("does not count refused as engaged", () => {
    const sessions = [
      makeSession({ id: "1", engagementLevel: "refused" }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.engagementCount).toBe(0);
  });

  it("does not count unable as engaged", () => {
    const sessions = [
      makeSession({ id: "1", engagementLevel: "unable" }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.engagementCount).toBe(0);
  });

  it("calculates engagement rate for mixed levels", () => {
    const sessions = [
      makeSession({ id: "1", engagementLevel: "enthusiastic" }),
      makeSession({ id: "2", engagementLevel: "willing" }),
      makeSession({ id: "3", engagementLevel: "reluctant" }),
      makeSession({ id: "4", engagementLevel: "refused" }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.engagementCount).toBe(2);
    expect(result.engagementRate).toBe(50);
  });

  it("calculates progress noted rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", progressNoted: true }),
      makeSession({ id: "2", progressNoted: false }),
      makeSession({ id: "3", progressNoted: true }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.progressNotedRate).toBe(67);
    expect(result.progressNotedCount).toBe(2);
  });

  it("calculates staff supported rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", staffSupported: true }),
      makeSession({ id: "2", staffSupported: false }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.staffSupportedRate).toBe(50);
    expect(result.staffSupportedCount).toBe(1);
  });

  it("calculates documented in log rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", documentedInLog: true }),
      makeSession({ id: "2", documentedInLog: true }),
      makeSession({ id: "3", documentedInLog: false }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.documentedInLogRate).toBe(67);
    expect(result.documentedInLogCount).toBe(2);
  });

  it("achieves maximum score of 25 with perfect data", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `hw-${i}`,
        taskCompleted: true,
        engagementLevel: "enthusiastic",
        progressNoted: true,
        staffSupported: true,
        documentedInLog: true,
      }),
    );
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.score).toBe(25);
  });

  it("caps score at 25", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `hw-${i}` }),
    );
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("returns a score > 0 for a single good session", () => {
    const result = evaluateHomeworkEngagement([makeSession()]);
    expect(result.score).toBeGreaterThan(0);
  });

  it("returns correct totalSessions count", () => {
    const sessions = [
      makeSession({ id: "1" }),
      makeSession({ id: "2" }),
      makeSession({ id: "3" }),
    ];
    const result = evaluateHomeworkEngagement(sessions);
    expect(result.totalSessions).toBe(3);
  });

  it("scores lower with poor engagement", () => {
    const good = [makeSession({ id: "1", engagementLevel: "enthusiastic" })];
    const poor = [makeSession({ id: "1", engagementLevel: "refused" })];
    const goodResult = evaluateHomeworkEngagement(good);
    const poorResult = evaluateHomeworkEngagement(poor);
    expect(goodResult.score).toBeGreaterThan(poorResult.score);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateLearningEnvironment
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateLearningEnvironment", () => {
  it("returns score 0 for empty sessions", () => {
    const result = evaluateLearningEnvironment([]);
    expect(result.score).toBe(0);
    expect(result.totalSessions).toBe(0);
  });

  it("returns all zero rates for empty sessions", () => {
    const result = evaluateLearningEnvironment([]);
    expect(result.quietSpaceRate).toBe(0);
    expect(result.resourcesAvailableRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
  });

  it("returns all zero counts for empty sessions", () => {
    const result = evaluateLearningEnvironment([]);
    expect(result.quietSpaceCount).toBe(0);
    expect(result.resourcesAvailableCount).toBe(0);
    expect(result.staffSupportedCount).toBe(0);
  });

  it("calculates quiet space rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", quietSpaceProvided: true }),
      makeSession({ id: "2", quietSpaceProvided: false }),
    ];
    const result = evaluateLearningEnvironment(sessions);
    expect(result.quietSpaceRate).toBe(50);
    expect(result.quietSpaceCount).toBe(1);
  });

  it("calculates 100% quiet space rate", () => {
    const sessions = [
      makeSession({ id: "1", quietSpaceProvided: true }),
      makeSession({ id: "2", quietSpaceProvided: true }),
    ];
    const result = evaluateLearningEnvironment(sessions);
    expect(result.quietSpaceRate).toBe(100);
  });

  it("calculates resources available rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", resourcesAvailable: true }),
      makeSession({ id: "2", resourcesAvailable: false }),
      makeSession({ id: "3", resourcesAvailable: true }),
    ];
    const result = evaluateLearningEnvironment(sessions);
    expect(result.resourcesAvailableRate).toBe(67);
    expect(result.resourcesAvailableCount).toBe(2);
  });

  it("calculates staff supported rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", staffSupported: true }),
      makeSession({ id: "2", staffSupported: true }),
      makeSession({ id: "3", staffSupported: false }),
    ];
    const result = evaluateLearningEnvironment(sessions);
    expect(result.staffSupportedRate).toBe(67);
  });

  it("achieves maximum score of 25 with perfect data", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({
        id: `hw-${i}`,
        quietSpaceProvided: true,
        resourcesAvailable: true,
        staffSupported: true,
      }),
    );
    const result = evaluateLearningEnvironment(sessions);
    expect(result.score).toBe(25);
  });

  it("caps score at 25", () => {
    const sessions = [makeSession()];
    const result = evaluateLearningEnvironment(sessions);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("scores 0 when no environment support", () => {
    const sessions = [
      makeSession({
        id: "1",
        quietSpaceProvided: false,
        resourcesAvailable: false,
        staffSupported: false,
      }),
    ];
    const result = evaluateLearningEnvironment(sessions);
    expect(result.score).toBe(0);
  });

  it("returns correct totalSessions", () => {
    const sessions = [makeSession({ id: "1" }), makeSession({ id: "2" })];
    const result = evaluateLearningEnvironment(sessions);
    expect(result.totalSessions).toBe(2);
  });

  it("quiet space contributes max 8 points", () => {
    const sessions = [
      makeSession({
        id: "1",
        quietSpaceProvided: true,
        resourcesAvailable: false,
        staffSupported: false,
      }),
    ];
    const result = evaluateLearningEnvironment(sessions);
    expect(result.score).toBe(8);
  });

  it("resources contributes max 9 points", () => {
    const sessions = [
      makeSession({
        id: "1",
        quietSpaceProvided: false,
        resourcesAvailable: true,
        staffSupported: false,
      }),
    ];
    const result = evaluateLearningEnvironment(sessions);
    expect(result.score).toBe(9);
  });

  it("staff support contributes max 8 points", () => {
    const sessions = [
      makeSession({
        id: "1",
        quietSpaceProvided: false,
        resourcesAvailable: false,
        staffSupported: true,
      }),
    ];
    const result = evaluateLearningEnvironment(sessions);
    expect(result.score).toBe(8);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateLearningPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateLearningPolicy", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluateLearningPolicy(null);
    expect(result.score).toBe(0);
  });

  it("returns all false for null policy", () => {
    const result = evaluateLearningPolicy(null);
    expect(result.homeworkPolicy).toBe(false);
    expect(result.quietStudySpaces).toBe(false);
    expect(result.learningResources).toBe(false);
    expect(result.educationLiaison).toBe(false);
    expect(result.individualLearningPlans).toBe(false);
    expect(result.tutoringProvision).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns maximum score of 25 with all true", () => {
    const result = evaluateLearningPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("returns 0 with all false policy", () => {
    const result = evaluateLearningPolicy(
      makePolicy({
        homeworkPolicy: false,
        quietStudySpaces: false,
        learningResources: false,
        educationLiaison: false,
        individualLearningPlans: false,
        tutoringProvision: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(0);
  });

  it("homeworkPolicy contributes 4 points", () => {
    const result = evaluateLearningPolicy(
      makePolicy({
        homeworkPolicy: true,
        quietStudySpaces: false,
        learningResources: false,
        educationLiaison: false,
        individualLearningPlans: false,
        tutoringProvision: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("quietStudySpaces contributes 4 points", () => {
    const result = evaluateLearningPolicy(
      makePolicy({
        homeworkPolicy: false,
        quietStudySpaces: true,
        learningResources: false,
        educationLiaison: false,
        individualLearningPlans: false,
        tutoringProvision: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("learningResources contributes 4 points", () => {
    const result = evaluateLearningPolicy(
      makePolicy({
        homeworkPolicy: false,
        quietStudySpaces: false,
        learningResources: true,
        educationLiaison: false,
        individualLearningPlans: false,
        tutoringProvision: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("educationLiaison contributes 4 points", () => {
    const result = evaluateLearningPolicy(
      makePolicy({
        homeworkPolicy: false,
        quietStudySpaces: false,
        learningResources: false,
        educationLiaison: true,
        individualLearningPlans: false,
        tutoringProvision: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("individualLearningPlans contributes 3 points", () => {
    const result = evaluateLearningPolicy(
      makePolicy({
        homeworkPolicy: false,
        quietStudySpaces: false,
        learningResources: false,
        educationLiaison: false,
        individualLearningPlans: true,
        tutoringProvision: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("tutoringProvision contributes 3 points", () => {
    const result = evaluateLearningPolicy(
      makePolicy({
        homeworkPolicy: false,
        quietStudySpaces: false,
        learningResources: false,
        educationLiaison: false,
        individualLearningPlans: false,
        tutoringProvision: true,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("regularReview contributes 3 points", () => {
    const result = evaluateLearningPolicy(
      makePolicy({
        homeworkPolicy: false,
        quietStudySpaces: false,
        learningResources: false,
        educationLiaison: false,
        individualLearningPlans: false,
        tutoringProvision: false,
        regularReview: true,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("weights sum to 25 (4+4+4+4+3+3+3)", () => {
    const result = evaluateLearningPolicy(makePolicy());
    expect(result.score).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3);
  });

  it("reflects boolean values from policy", () => {
    const result = evaluateLearningPolicy(
      makePolicy({ homeworkPolicy: true, regularReview: false }),
    );
    expect(result.homeworkPolicy).toBe(true);
    expect(result.regularReview).toBe(false);
  });

  it("partial policy scores correctly", () => {
    const result = evaluateLearningPolicy(
      makePolicy({
        homeworkPolicy: true,
        quietStudySpaces: true,
        learningResources: false,
        educationLiaison: false,
        individualLearningPlans: true,
        tutoringProvision: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4 + 4 + 3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateStaffLearningReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffLearningReadiness", () => {
  it("returns score 0 for empty training", () => {
    const result = evaluateStaffLearningReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns all zero rates for empty training", () => {
    const result = evaluateStaffLearningReadiness([]);
    expect(result.homeworkSupportRate).toBe(0);
    expect(result.learningDifficultiesRate).toBe(0);
    expect(result.educationalMotivationRate).toBe(0);
    expect(result.senAwarenessRate).toBe(0);
    expect(result.digitalLiteracyRate).toBe(0);
    expect(result.communicationWithSchoolsRate).toBe(0);
  });

  it("returns all zero counts for empty training", () => {
    const result = evaluateStaffLearningReadiness([]);
    expect(result.homeworkSupportCount).toBe(0);
    expect(result.learningDifficultiesCount).toBe(0);
    expect(result.educationalMotivationCount).toBe(0);
    expect(result.senAwarenessCount).toBe(0);
    expect(result.digitalLiteracyCount).toBe(0);
    expect(result.communicationWithSchoolsCount).toBe(0);
  });

  it("achieves maximum score of 25 with fully trained staff", () => {
    const training = [makeTraining()];
    const result = evaluateStaffLearningReadiness(training);
    expect(result.score).toBe(25);
  });

  it("returns 0 with all false training", () => {
    const training = [
      makeTraining({
        homeworkSupport: false,
        learningDifficulties: false,
        educationalMotivation: false,
        senAwareness: false,
        digitalLiteracy: false,
        communicationWithSchools: false,
      }),
    ];
    const result = evaluateStaffLearningReadiness(training);
    expect(result.score).toBe(0);
  });

  it("calculates homework support rate correctly", () => {
    const training = [
      makeTraining({ id: "1", homeworkSupport: true }),
      makeTraining({ id: "2", staffId: "s2", homeworkSupport: false }),
    ];
    const result = evaluateStaffLearningReadiness(training);
    expect(result.homeworkSupportRate).toBe(50);
    expect(result.homeworkSupportCount).toBe(1);
  });

  it("calculates learning difficulties rate correctly", () => {
    const training = [
      makeTraining({ id: "1", learningDifficulties: true }),
      makeTraining({ id: "2", staffId: "s2", learningDifficulties: false }),
      makeTraining({ id: "3", staffId: "s3", learningDifficulties: true }),
    ];
    const result = evaluateStaffLearningReadiness(training);
    expect(result.learningDifficultiesRate).toBe(67);
    expect(result.learningDifficultiesCount).toBe(2);
  });

  it("calculates educational motivation rate correctly", () => {
    const training = [
      makeTraining({ id: "1", educationalMotivation: true }),
      makeTraining({ id: "2", staffId: "s2", educationalMotivation: true }),
    ];
    const result = evaluateStaffLearningReadiness(training);
    expect(result.educationalMotivationRate).toBe(100);
  });

  it("calculates SEN awareness rate correctly", () => {
    const training = [
      makeTraining({ id: "1", senAwareness: false }),
      makeTraining({ id: "2", staffId: "s2", senAwareness: true }),
    ];
    const result = evaluateStaffLearningReadiness(training);
    expect(result.senAwarenessRate).toBe(50);
  });

  it("calculates digital literacy rate correctly", () => {
    const training = [
      makeTraining({ id: "1", digitalLiteracy: true }),
      makeTraining({ id: "2", staffId: "s2", digitalLiteracy: false }),
    ];
    const result = evaluateStaffLearningReadiness(training);
    expect(result.digitalLiteracyRate).toBe(50);
  });

  it("calculates communication with schools rate correctly", () => {
    const training = [
      makeTraining({ id: "1", communicationWithSchools: true }),
    ];
    const result = evaluateStaffLearningReadiness(training);
    expect(result.communicationWithSchoolsRate).toBe(100);
  });

  it("returns correct totalStaff count", () => {
    const training = [
      makeTraining({ id: "1" }),
      makeTraining({ id: "2", staffId: "s2" }),
      makeTraining({ id: "3", staffId: "s3" }),
    ];
    const result = evaluateStaffLearningReadiness(training);
    expect(result.totalStaff).toBe(3);
  });

  it("caps score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffLearningReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("weights are 6+5+5+4+3+2 = 25", () => {
    // homeworkSupport only → 6 points
    const t1 = [
      makeTraining({
        homeworkSupport: true,
        learningDifficulties: false,
        educationalMotivation: false,
        senAwareness: false,
        digitalLiteracy: false,
        communicationWithSchools: false,
      }),
    ];
    const r1 = evaluateStaffLearningReadiness(t1);
    expect(r1.score).toBe(6);

    // learningDifficulties only → 5 points
    const t2 = [
      makeTraining({
        homeworkSupport: false,
        learningDifficulties: true,
        educationalMotivation: false,
        senAwareness: false,
        digitalLiteracy: false,
        communicationWithSchools: false,
      }),
    ];
    const r2 = evaluateStaffLearningReadiness(t2);
    expect(r2.score).toBe(5);

    // educationalMotivation only → 5 points
    const t3 = [
      makeTraining({
        homeworkSupport: false,
        learningDifficulties: false,
        educationalMotivation: true,
        senAwareness: false,
        digitalLiteracy: false,
        communicationWithSchools: false,
      }),
    ];
    const r3 = evaluateStaffLearningReadiness(t3);
    expect(r3.score).toBe(5);

    // senAwareness only → 4 points
    const t4 = [
      makeTraining({
        homeworkSupport: false,
        learningDifficulties: false,
        educationalMotivation: false,
        senAwareness: true,
        digitalLiteracy: false,
        communicationWithSchools: false,
      }),
    ];
    const r4 = evaluateStaffLearningReadiness(t4);
    expect(r4.score).toBe(4);

    // digitalLiteracy only → 3 points
    const t5 = [
      makeTraining({
        homeworkSupport: false,
        learningDifficulties: false,
        educationalMotivation: false,
        senAwareness: false,
        digitalLiteracy: true,
        communicationWithSchools: false,
      }),
    ];
    const r5 = evaluateStaffLearningReadiness(t5);
    expect(r5.score).toBe(3);

    // communicationWithSchools only → 2 points
    const t6 = [
      makeTraining({
        homeworkSupport: false,
        learningDifficulties: false,
        educationalMotivation: false,
        senAwareness: false,
        digitalLiteracy: false,
        communicationWithSchools: true,
      }),
    ];
    const r6 = evaluateStaffLearningReadiness(t6);
    expect(r6.score).toBe(2);

    expect(r1.score + r2.score + r3.score + r4.score + r5.score + r6.score).toBe(25);
  });

  it("scores proportionally with partial staff training", () => {
    const training = [
      makeTraining({ id: "1", homeworkSupport: true }),
      makeTraining({ id: "2", staffId: "s2", homeworkSupport: false }),
    ];
    const result = evaluateStaffLearningReadiness(training);
    // 50% homework support rate → 3 points from that, plus 100% of rest
    expect(result.score).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildLearningProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildLearningProfiles", () => {
  it("returns empty array for empty sessions", () => {
    const result = buildChildLearningProfiles([]);
    expect(result).toEqual([]);
  });

  it("groups sessions by childId", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-alex", childName: "Alex" }),
      makeSession({ id: "2", childId: "child-jordan", childName: "Jordan" }),
      makeSession({ id: "3", childId: "child-alex", childName: "Alex" }),
    ];
    const result = buildChildLearningProfiles(sessions);
    expect(result).toHaveLength(2);
  });

  it("calculates per-child completion rate", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-alex", taskCompleted: true }),
      makeSession({ id: "2", childId: "child-alex", taskCompleted: false }),
    ];
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex?.completionRate).toBe(50);
  });

  it("calculates per-child engagement rate", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-alex", engagementLevel: "enthusiastic" }),
      makeSession({ id: "2", childId: "child-alex", engagementLevel: "refused" }),
    ];
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex?.engagementRate).toBe(50);
  });

  it("counts unique subjects for diversity", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-alex", subjectArea: "maths" }),
      makeSession({ id: "2", childId: "child-alex", subjectArea: "english" }),
      makeSession({ id: "3", childId: "child-alex", subjectArea: "science" }),
      makeSession({ id: "4", childId: "child-alex", subjectArea: "maths" }),
    ];
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex?.subjectDiversity).toBe(3);
  });

  it("awards frequency score 2 for >= 10 sessions", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `hw-${i}`, childId: "child-alex" }),
    );
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    // frequency=2, completion=3, engagement=3, subjectDiversity=0 (all maths) = 8
    expect(alex?.score).toBe(8);
  });

  it("awards frequency score 1 for >= 5 and < 10 sessions", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `hw-${i}`, childId: "child-alex" }),
    );
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    // frequency=1, completion=3, engagement=3, subjectDiversity=0 = 7
    expect(alex?.score).toBe(7);
  });

  it("awards frequency score 0 for < 5 sessions", () => {
    const sessions = Array.from({ length: 4 }, (_, i) =>
      makeSession({ id: `hw-${i}`, childId: "child-alex" }),
    );
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    // frequency=0, completion=3, engagement=3, subjectDiversity=0 = 6
    expect(alex?.score).toBe(6);
  });

  it("awards subject diversity score 2 for >= 5 subjects", () => {
    const subjects: ("english" | "maths" | "science" | "humanities" | "languages")[] = [
      "english", "maths", "science", "humanities", "languages",
    ];
    const sessions = subjects.map((s, i) =>
      makeSession({ id: `hw-${i}`, childId: "child-alex", subjectArea: s }),
    );
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex?.subjectDiversity).toBe(5);
    // frequency=1, completion=3, engagement=3, diversity=2 = 9
    expect(alex?.score).toBe(9);
  });

  it("awards subject diversity score 1 for >= 3 and < 5 subjects", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-alex", subjectArea: "english" }),
      makeSession({ id: "2", childId: "child-alex", subjectArea: "maths" }),
      makeSession({ id: "3", childId: "child-alex", subjectArea: "science" }),
    ];
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex?.subjectDiversity).toBe(3);
  });

  it("awards subject diversity score 0 for < 3 subjects", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-alex", subjectArea: "maths" }),
      makeSession({ id: "2", childId: "child-alex", subjectArea: "english" }),
    ];
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex?.subjectDiversity).toBe(2);
  });

  it("caps child score at 10", () => {
    const subjects: ("english" | "maths" | "science" | "humanities" | "languages" | "creative_arts" | "technology")[] = [
      "english", "maths", "science", "humanities", "languages", "creative_arts", "technology",
    ];
    const sessions = Array.from({ length: 14 }, (_, i) =>
      makeSession({
        id: `hw-${i}`,
        childId: "child-alex",
        subjectArea: subjects[i % subjects.length],
        taskCompleted: true,
        engagementLevel: "enthusiastic",
      }),
    );
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex?.score).toBeLessThanOrEqual(10);
  });

  it("minimum child score is 0", () => {
    const sessions = [
      makeSession({
        id: "1",
        childId: "child-alex",
        taskCompleted: false,
        engagementLevel: "refused",
      }),
    ];
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex?.score).toBeGreaterThanOrEqual(0);
  });

  it("preserves childName from sessions", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-alex", childName: "Alex" }),
    ];
    const result = buildChildLearningProfiles(sessions);
    expect(result[0].childName).toBe("Alex");
  });

  it("returns totalSessions per child", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-alex" }),
      makeSession({ id: "2", childId: "child-alex" }),
      makeSession({ id: "3", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = buildChildLearningProfiles(sessions);
    const alex = result.find((p) => p.childId === "child-alex");
    const jordan = result.find((p) => p.childId === "child-jordan");
    expect(alex?.totalSessions).toBe(2);
    expect(jordan?.totalSessions).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateHomeworkLearningSupportIntelligence (orchestrator)
// ══════════════════════════════════════════════════════════════════════════════

describe("generateHomeworkLearningSupportIntelligence", () => {
  it("returns a complete intelligence object", () => {
    const result = generateHomeworkLearningSupportIntelligence(
      [makeSession()],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.homeworkEngagement).toBeDefined();
    expect(result.learningEnvironment).toBeDefined();
    expect(result.learningPolicy).toBeDefined();
    expect(result.staffLearningReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("caps overall score at 100", () => {
    const result = generateHomeworkLearningSupportIntelligence(
      Array.from({ length: 10 }, (_, i) => makeSession({ id: `hw-${i}` })),
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("scores 0 overall with empty data and no policy", () => {
    const result = generateHomeworkLearningSupportIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("returns 7 regulatory links", () => {
    const result = generateHomeworkLearningSupportIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Regulation 8 in regulatory links", () => {
    const result = generateHomeworkLearningSupportIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("CHR 2015 Regulation 8 — The education standard");
  });

  it("includes CHR 2015 Regulation 10 in regulatory links", () => {
    const result = generateHomeworkLearningSupportIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("CHR 2015 Regulation 10 — Enjoyment and achievement");
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generateHomeworkLearningSupportIntelligence([], null, [], "x", "a", "b");
    expect(result.regulatoryLinks).toContain("SCCIF — Experiences and progress of children");
  });

  it("includes NMS 8 in regulatory links", () => {
    const result = generateHomeworkLearningSupportIntelligence([], null, [], "x", "a", "b");
    expect(result.regulatoryLinks).toContain("NMS 8 — Education");
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const result = generateHomeworkLearningSupportIntelligence([], null, [], "x", "a", "b");
    expect(result.regulatoryLinks).toContain("Children Act 1989 — Welfare of the child");
  });

  it("includes UNCRC Article 28 in regulatory links", () => {
    const result = generateHomeworkLearningSupportIntelligence([], null, [], "x", "a", "b");
    expect(result.regulatoryLinks).toContain("UNCRC Article 28 — Right to education");
  });

  it("includes Ofsted ILACS in regulatory links", () => {
    const result = generateHomeworkLearningSupportIntelligence([], null, [], "x", "a", "b");
    expect(result.regulatoryLinks).toContain("Ofsted ILACS — Education, employment and training");
  });

  it("generates action for no sessions", () => {
    const result = generateHomeworkLearningSupportIntelligence(
      [],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("No homework session records found"))).toBe(true);
  });

  it("generates urgent action for no policy", () => {
    const result = generateHomeworkLearningSupportIntelligence(
      [makeSession()],
      null,
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("No learning support policy"))).toBe(true);
  });

  it("generates urgent action for no training", () => {
    const result = generateHomeworkLearningSupportIntelligence(
      [makeSession()],
      makePolicy(),
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("No staff learning support training"))).toBe(true);
  });

  it("generates strength for high completion rate", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `hw-${i}`, taskCompleted: true }),
    );
    const result = generateHomeworkLearningSupportIntelligence(
      sessions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("homework completion"))).toBe(true);
  });

  it("generates strength for high engagement rate", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `hw-${i}`, engagementLevel: "enthusiastic" }),
    );
    const result = generateHomeworkLearningSupportIntelligence(
      sessions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("learning engagement") || s.includes("engagement"))).toBe(true);
  });

  it("generates strength for high quiet space rate", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `hw-${i}`, quietSpaceProvided: true }),
    );
    const result = generateHomeworkLearningSupportIntelligence(
      sessions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("learning environment") || s.includes("quiet study space"))).toBe(true);
  });

  it("generates area for improvement for low completion", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `hw-${i}`, taskCompleted: i < 3 }),
    );
    const result = generateHomeworkLearningSupportIntelligence(
      sessions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("completion rate"))).toBe(true);
  });

  it("generates area for improvement for low engagement", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `hw-${i}`,
        engagementLevel: i < 3 ? "willing" : "reluctant",
      }),
    );
    const result = generateHomeworkLearningSupportIntelligence(
      sessions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("engagement rate"))).toBe(true);
  });

  it("returns outstanding rating for perfect data", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `hw-${i}` }),
    );
    const result = generateHomeworkLearningSupportIntelligence(
      sessions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate rating for empty data", () => {
    const result = generateHomeworkLearningSupportIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.rating).toBe("inadequate");
  });

  it("sums 4 evaluator scores correctly", () => {
    const sessions = [makeSession()];
    const result = generateHomeworkLearningSupportIntelligence(
      sessions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    const expectedSum =
      result.homeworkEngagement.score +
      result.learningEnvironment.score +
      result.learningPolicy.score +
      result.staffLearningReadiness.score;
    expect(result.overallScore).toBe(Math.min(Math.round(expectedSum), 100));
  });

  it("builds child profiles from sessions", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-alex", childName: "Alex" }),
      makeSession({ id: "2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateHomeworkLearningSupportIntelligence(
      sessions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  it("includes assessedAt timestamp", () => {
    const result = generateHomeworkLearningSupportIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.assessedAt).toBeDefined();
    expect(typeof result.assessedAt).toBe("string");
  });

  it("returns strength about overall rating when outstanding", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `hw-${i}` }),
    );
    const result = generateHomeworkLearningSupportIntelligence(
      sessions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates action for low completion rate", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `hw-${i}`, taskCompleted: false }),
    );
    const result = generateHomeworkLearningSupportIntelligence(
      sessions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("completion rate"))).toBe(true);
  });

  it("generates action for low engagement rate", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `hw-${i}`, engagementLevel: "refused" }),
    );
    const result = generateHomeworkLearningSupportIntelligence(
      sessions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("engagement") || a.includes("motivation"))).toBe(true);
  });
});
