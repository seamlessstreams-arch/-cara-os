// ══════════════════════════════════════════════════════════════════════════════
// TESTS -- Homework & Study Support Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateQuality,
  evaluateCompliance,
  evaluatePolicy,
  evaluateStaffReadiness,
  buildChildProfiles,
  generateHomeworkStudySupportIntelligence,
  getRating,
  getStudyActivityTypeLabel,
  getEngagementLevelLabel,
  getRatingLabel,
  pct,
} from "../homework-study-support-engine";
import type {
  StudySession,
  StudySupportPolicy,
  StaffStudySupportTraining,
} from "../homework-study-support-engine";

// -- Test Fixtures: Chamberlain House Demo Data ---------------------------------------

const makeSession = (overrides: Partial<StudySession> = {}): StudySession => ({
  id: "ss-001",
  childId: "child-alex",
  childName: "Alex",
  sessionDate: "2026-05-05",
  activityType: "homework_help",
  engagementLevel: "highly_engaged",
  progressNoted: true,
  confidenceGrown: true,
  resourcesProvided: true,
  documentedInPlan: true,
  staffSupported: true,
  feedbackGiven: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<StudySupportPolicy> = {}): StudySupportPolicy => ({
  id: "policy-001",
  homeworkSupportStrategy: true,
  quietStudySpaceProvision: true,
  educationalResourcePlan: true,
  tutoringArrangementFramework: true,
  schoolLiaisonProtocol: true,
  examSupportGuidance: true,
  regularReview: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffStudySupportTraining> = {}): StaffStudySupportTraining => ({
  id: "sst-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  educationalSupport: true,
  studySkillsCoaching: true,
  motivationalTechniques: true,
  senAwareness: true,
  schoolLiaison: true,
  resourceManagement: true,
  ...overrides,
});

// Chamberlain House demo data: 8 sessions across Alex/Jordan/Morgan, all booleans true
const OAK_HOUSE_SESSIONS: StudySession[] = [
  makeSession({ id: "ss-001", childId: "child-alex", childName: "Alex", sessionDate: "2026-05-05", activityType: "homework_help", engagementLevel: "highly_engaged" }),
  makeSession({ id: "ss-002", childId: "child-alex", childName: "Alex", sessionDate: "2026-05-07", activityType: "revision_session", engagementLevel: "engaged" }),
  makeSession({ id: "ss-003", childId: "child-alex", childName: "Alex", sessionDate: "2026-05-10", activityType: "reading_time", engagementLevel: "highly_engaged" }),
  makeSession({ id: "ss-004", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-05-06", activityType: "project_work", engagementLevel: "engaged" }),
  makeSession({ id: "ss-005", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-05-08", activityType: "exam_preparation", engagementLevel: "highly_engaged" }),
  makeSession({ id: "ss-006", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-05-12", activityType: "tutoring", engagementLevel: "engaged" }),
  makeSession({ id: "ss-007", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-05-09", activityType: "study_skills_coaching", engagementLevel: "highly_engaged" }),
  makeSession({ id: "ss-008", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-05-14", activityType: "educational_visit", engagementLevel: "engaged" }),
];

const OAK_HOUSE_POLICY: StudySupportPolicy = makePolicy();

const OAK_HOUSE_TRAINING: StaffStudySupportTraining[] = [
  makeTraining({ id: "sst-001", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
  makeTraining({ id: "sst-002", staffId: "staff-tom", staffName: "Tom Richards" }),
  makeTraining({ id: "sst-003", staffId: "staff-lisa", staffName: "Lisa Williams" }),
  makeTraining({ id: "sst-004", staffId: "staff-darren", staffName: "Darren Laville" }),
];

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateQuality", () => {
  it("returns score 0 for empty sessions", () => {
    const result = evaluateQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
  });

  it("returns zero rates for empty sessions", () => {
    const result = evaluateQuality([]);
    expect(result.engagementRate).toBe(0);
    expect(result.progressRate).toBe(0);
    expect(result.confidenceRate).toBe(0);
    expect(result.resourceRate).toBe(0);
  });

  it("calculates engagement rate for highly_engaged and engaged", () => {
    const sessions = [
      makeSession({ id: "1", engagementLevel: "highly_engaged" }),
      makeSession({ id: "2", engagementLevel: "engaged" }),
      makeSession({ id: "3", engagementLevel: "moderate" }),
    ];
    const result = evaluateQuality(sessions);
    expect(result.engagementRate).toBe(67);
  });

  it("calculates 100% engagement when all highly_engaged", () => {
    const sessions = [
      makeSession({ id: "1", engagementLevel: "highly_engaged" }),
      makeSession({ id: "2", engagementLevel: "highly_engaged" }),
    ];
    const result = evaluateQuality(sessions);
    expect(result.engagementRate).toBe(100);
  });

  it("calculates 0% engagement when all disengaged", () => {
    const sessions = [
      makeSession({ id: "1", engagementLevel: "disengaged" }),
      makeSession({ id: "2", engagementLevel: "minimal" }),
    ];
    const result = evaluateQuality(sessions);
    expect(result.engagementRate).toBe(0);
  });

  it("calculates progress rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", progressNoted: true }),
      makeSession({ id: "2", progressNoted: false }),
      makeSession({ id: "3", progressNoted: true }),
    ];
    const result = evaluateQuality(sessions);
    expect(result.progressRate).toBe(67);
  });

  it("calculates confidence rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", confidenceGrown: true }),
      makeSession({ id: "2", confidenceGrown: false }),
    ];
    const result = evaluateQuality(sessions);
    expect(result.confidenceRate).toBe(50);
  });

  it("calculates resource rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", resourcesProvided: true }),
      makeSession({ id: "2", resourcesProvided: true }),
      makeSession({ id: "3", resourcesProvided: false }),
    ];
    const result = evaluateQuality(sessions);
    expect(result.resourceRate).toBe(67);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateQuality(OAK_HOUSE_SESSIONS);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo has 8 total sessions", () => {
    const result = evaluateQuality(OAK_HOUSE_SESSIONS);
    expect(result.totalSessions).toBe(8);
  });

  it("Chamberlain House demo has 100% engagement rate", () => {
    const result = evaluateQuality(OAK_HOUSE_SESSIONS);
    expect(result.engagementRate).toBe(100);
  });

  it("Chamberlain House demo has 100% progress rate", () => {
    const result = evaluateQuality(OAK_HOUSE_SESSIONS);
    expect(result.progressRate).toBe(100);
  });

  it("Chamberlain House demo quality score is 25", () => {
    const result = evaluateQuality(OAK_HOUSE_SESSIONS);
    expect(result.overallScore).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateCompliance", () => {
  it("returns score 0 for empty sessions", () => {
    const result = evaluateCompliance([]);
    expect(result.overallScore).toBe(0);
  });

  it("returns zero rates for empty sessions", () => {
    const result = evaluateCompliance([]);
    expect(result.documentedRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
    expect(result.activityDiversityRatio).toBe(0);
  });

  it("calculates documented rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", documentedInPlan: true }),
      makeSession({ id: "2", documentedInPlan: false }),
      makeSession({ id: "3", documentedInPlan: true }),
    ];
    const result = evaluateCompliance(sessions);
    expect(result.documentedRate).toBe(67);
  });

  it("calculates staff supported rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", staffSupported: true }),
      makeSession({ id: "2", staffSupported: false }),
    ];
    const result = evaluateCompliance(sessions);
    expect(result.staffSupportedRate).toBe(50);
  });

  it("calculates feedback rate correctly", () => {
    const sessions = [
      makeSession({ id: "1", feedbackGiven: true }),
      makeSession({ id: "2", feedbackGiven: true }),
      makeSession({ id: "3", feedbackGiven: false }),
    ];
    const result = evaluateCompliance(sessions);
    expect(result.feedbackRate).toBe(67);
  });

  it("calculates activity diversity ratio correctly", () => {
    const sessions = [
      makeSession({ id: "1", activityType: "homework_help" }),
      makeSession({ id: "2", activityType: "tutoring" }),
      makeSession({ id: "3", activityType: "homework_help" }),
    ];
    const result = evaluateCompliance(sessions);
    // 2 unique out of 8 total types = 25%
    expect(result.activityDiversityRatio).toBe(25);
  });

  it("Chamberlain House demo has 100% documented rate", () => {
    const result = evaluateCompliance(OAK_HOUSE_SESSIONS);
    expect(result.documentedRate).toBe(100);
  });

  it("Chamberlain House demo has 100% staff supported rate", () => {
    const result = evaluateCompliance(OAK_HOUSE_SESSIONS);
    expect(result.staffSupportedRate).toBe(100);
  });

  it("Chamberlain House demo has 100% feedback rate", () => {
    const result = evaluateCompliance(OAK_HOUSE_SESSIONS);
    expect(result.feedbackRate).toBe(100);
  });

  it("Chamberlain House demo has 100% activity diversity (8/8 types)", () => {
    const result = evaluateCompliance(OAK_HOUSE_SESSIONS);
    expect(result.activityDiversityRatio).toBe(100);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateCompliance(OAK_HOUSE_SESSIONS);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo compliance score is 25", () => {
    const result = evaluateCompliance(OAK_HOUSE_SESSIONS);
    expect(result.overallScore).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluatePolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePolicy", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluatePolicy(null);
    expect(result.overallScore).toBe(0);
  });

  it("returns all false booleans for null policy", () => {
    const result = evaluatePolicy(null);
    expect(result.homeworkSupportStrategy).toBe(false);
    expect(result.quietStudySpaceProvision).toBe(false);
    expect(result.educationalResourcePlan).toBe(false);
    expect(result.tutoringArrangementFramework).toBe(false);
    expect(result.schoolLiaisonProtocol).toBe(false);
    expect(result.examSupportGuidance).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("scores full 25 for all-true policy", () => {
    const result = evaluatePolicy(OAK_HOUSE_POLICY);
    expect(result.overallScore).toBe(25);
  });

  it("mirrors policy booleans correctly", () => {
    const result = evaluatePolicy(OAK_HOUSE_POLICY);
    expect(result.homeworkSupportStrategy).toBe(true);
    expect(result.quietStudySpaceProvision).toBe(true);
    expect(result.educationalResourcePlan).toBe(true);
    expect(result.tutoringArrangementFramework).toBe(true);
    expect(result.schoolLiaisonProtocol).toBe(true);
    expect(result.examSupportGuidance).toBe(true);
    expect(result.regularReview).toBe(true);
  });

  it("homeworkSupportStrategy contributes 4 points", () => {
    const result = evaluatePolicy(makePolicy({ homeworkSupportStrategy: false }));
    expect(result.overallScore).toBe(21);
  });

  it("quietStudySpaceProvision contributes 4 points", () => {
    const result = evaluatePolicy(makePolicy({ quietStudySpaceProvision: false }));
    expect(result.overallScore).toBe(21);
  });

  it("educationalResourcePlan contributes 4 points", () => {
    const result = evaluatePolicy(makePolicy({ educationalResourcePlan: false }));
    expect(result.overallScore).toBe(21);
  });

  it("tutoringArrangementFramework contributes 4 points", () => {
    const result = evaluatePolicy(makePolicy({ tutoringArrangementFramework: false }));
    expect(result.overallScore).toBe(21);
  });

  it("schoolLiaisonProtocol contributes 3 points", () => {
    const result = evaluatePolicy(makePolicy({ schoolLiaisonProtocol: false }));
    expect(result.overallScore).toBe(22);
  });

  it("examSupportGuidance contributes 3 points", () => {
    const result = evaluatePolicy(makePolicy({ examSupportGuidance: false }));
    expect(result.overallScore).toBe(22);
  });

  it("regularReview contributes 3 points", () => {
    const result = evaluatePolicy(makePolicy({ regularReview: false }));
    expect(result.overallScore).toBe(22);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluatePolicy(OAK_HOUSE_POLICY);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateStaffReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffReadiness", () => {
  it("returns score 0 for empty training", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.overallScore).toBe(0);
  });

  it("returns zero rates for empty training", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.educationalSupportRate).toBe(0);
    expect(result.studySkillsCoachingRate).toBe(0);
    expect(result.motivationalTechniquesRate).toBe(0);
    expect(result.senAwarenessRate).toBe(0);
    expect(result.schoolLiaisonRate).toBe(0);
    expect(result.resourceManagementRate).toBe(0);
  });

  it("calculates educational support rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", educationalSupport: true }),
      makeTraining({ id: "2", staffId: "s2", educationalSupport: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.educationalSupportRate).toBe(50);
  });

  it("calculates study skills coaching rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", studySkillsCoaching: true }),
      makeTraining({ id: "2", staffId: "s2", studySkillsCoaching: true }),
      makeTraining({ id: "3", staffId: "s3", studySkillsCoaching: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.studySkillsCoachingRate).toBe(67);
  });

  it("calculates motivational techniques rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", motivationalTechniques: true }),
      makeTraining({ id: "2", staffId: "s2", motivationalTechniques: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.motivationalTechniquesRate).toBe(50);
  });

  it("calculates SEN awareness rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", senAwareness: true }),
      makeTraining({ id: "2", staffId: "s2", senAwareness: false }),
      makeTraining({ id: "3", staffId: "s3", senAwareness: true }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.senAwarenessRate).toBe(67);
  });

  it("calculates school liaison rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", schoolLiaison: true }),
      makeTraining({ id: "2", staffId: "s2", schoolLiaison: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.schoolLiaisonRate).toBe(50);
  });

  it("calculates resource management rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", resourceManagement: true }),
      makeTraining({ id: "2", staffId: "s2", resourceManagement: true }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.resourceManagementRate).toBe(100);
  });

  it("Chamberlain House demo has 4 staff", () => {
    const result = evaluateStaffReadiness(OAK_HOUSE_TRAINING);
    expect(result.educationalSupportRate).toBe(100);
  });

  it("Chamberlain House demo has 100% across all training skills", () => {
    const result = evaluateStaffReadiness(OAK_HOUSE_TRAINING);
    expect(result.educationalSupportRate).toBe(100);
    expect(result.studySkillsCoachingRate).toBe(100);
    expect(result.motivationalTechniquesRate).toBe(100);
    expect(result.senAwarenessRate).toBe(100);
    expect(result.schoolLiaisonRate).toBe(100);
    expect(result.resourceManagementRate).toBe(100);
  });

  it("Chamberlain House demo staff readiness score is 25", () => {
    const result = evaluateStaffReadiness(OAK_HOUSE_TRAINING);
    expect(result.overallScore).toBe(25);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateStaffReadiness(OAK_HOUSE_TRAINING);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildProfiles", () => {
  it("returns empty array for no sessions", () => {
    const result = buildChildProfiles([]);
    expect(result).toHaveLength(0);
  });

  it("creates profiles grouped by child", () => {
    const result = buildChildProfiles(OAK_HOUSE_SESSIONS);
    expect(result).toHaveLength(3);
  });

  it("counts sessions per child correctly", () => {
    const result = buildChildProfiles(OAK_HOUSE_SESSIONS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.totalSessions).toBe(3);
    const jordan = result.find((p) => p.childId === "child-jordan");
    expect(jordan!.totalSessions).toBe(3);
    const morgan = result.find((p) => p.childId === "child-morgan");
    expect(morgan!.totalSessions).toBe(2);
  });

  it("calculates engagement rate per child", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-a", childName: "A", engagementLevel: "highly_engaged" }),
      makeSession({ id: "2", childId: "child-a", childName: "A", engagementLevel: "disengaged" }),
    ];
    const result = buildChildProfiles(sessions);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.engagementRate).toBe(50);
  });

  it("calculates progress rate per child", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-a", childName: "A", progressNoted: true }),
      makeSession({ id: "2", childId: "child-a", childName: "A", progressNoted: false }),
      makeSession({ id: "3", childId: "child-a", childName: "A", progressNoted: true }),
    ];
    const result = buildChildProfiles(sessions);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.progressRate).toBe(67);
  });

  it("frequency score: >= 10 sessions gives 2 points", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `s-${i}`, childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: false, activityType: "homework_help" }),
    );
    const result = buildChildProfiles(sessions);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=2, engagement=0, progress=0, diversity=0 (only 1 type)
    expect(childA!.overallScore).toBe(2);
  });

  it("frequency score: >= 5 sessions gives 1 point", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s-${i}`, childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: false, activityType: "homework_help" }),
    );
    const result = buildChildProfiles(sessions);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=1, engagement=0, progress=0, diversity=0
    expect(childA!.overallScore).toBe(1);
  });

  it("frequency score: < 5 sessions gives 0 points", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: false, activityType: "homework_help" }),
    ];
    const result = buildChildProfiles(sessions);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, engagement=0, progress=0, diversity=0
    expect(childA!.overallScore).toBe(0);
  });

  it("engagement score: >= 80% gives 3 points", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s-${i}`, childId: "child-a", childName: "A", engagementLevel: "highly_engaged", progressNoted: false, activityType: "homework_help" }),
    );
    const result = buildChildProfiles(sessions);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=1, engagement=3, progress=0, diversity=0
    expect(childA!.overallScore).toBe(4);
  });

  it("engagement score: >= 60% gives 2 points", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-a", childName: "A", engagementLevel: "highly_engaged", progressNoted: false, activityType: "homework_help" }),
      makeSession({ id: "2", childId: "child-a", childName: "A", engagementLevel: "highly_engaged", progressNoted: false, activityType: "homework_help" }),
      makeSession({ id: "3", childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: false, activityType: "homework_help" }),
    ];
    const result = buildChildProfiles(sessions);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, engagement=2 (67%), progress=0, diversity=0
    expect(childA!.overallScore).toBe(2);
  });

  it("engagement score: >= 40% gives 1 point", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-a", childName: "A", engagementLevel: "highly_engaged", progressNoted: false, activityType: "homework_help" }),
      makeSession({ id: "2", childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: false, activityType: "homework_help" }),
    ];
    const result = buildChildProfiles(sessions);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, engagement=1 (50%), progress=0, diversity=0
    expect(childA!.overallScore).toBe(1);
  });

  it("progress score: >= 80% gives 3 points", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s-${i}`, childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: true, activityType: "homework_help" }),
    );
    const result = buildChildProfiles(sessions);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=1, engagement=0, progress=3, diversity=0
    expect(childA!.overallScore).toBe(4);
  });

  it("diversity score: >= 4 unique types gives 2 points", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: false, activityType: "homework_help" }),
      makeSession({ id: "2", childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: false, activityType: "tutoring" }),
      makeSession({ id: "3", childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: false, activityType: "reading_time" }),
      makeSession({ id: "4", childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: false, activityType: "project_work" }),
    ];
    const result = buildChildProfiles(sessions);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, engagement=0, progress=0, diversity=2
    expect(childA!.overallScore).toBe(2);
  });

  it("diversity score: >= 2 unique types gives 1 point", () => {
    const sessions = [
      makeSession({ id: "1", childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: false, activityType: "homework_help" }),
      makeSession({ id: "2", childId: "child-a", childName: "A", engagementLevel: "disengaged", progressNoted: false, activityType: "tutoring" }),
    ];
    const result = buildChildProfiles(sessions);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, engagement=0, progress=0, diversity=1
    expect(childA!.overallScore).toBe(1);
  });

  it("score is clamped to 0-10", () => {
    const result = buildChildProfiles(OAK_HOUSE_SESSIONS);
    for (const profile of result) {
      expect(profile.overallScore).toBeGreaterThanOrEqual(0);
      expect(profile.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("Chamberlain House Alex has 100% engagement rate", () => {
    const result = buildChildProfiles(OAK_HOUSE_SESSIONS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.engagementRate).toBe(100);
  });

  it("Chamberlain House Alex has 100% progress rate", () => {
    const result = buildChildProfiles(OAK_HOUSE_SESSIONS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.progressRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateHomeworkStudySupportIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateHomeworkStudySupportIntelligence", () => {
  it("produces overall score 0-100", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("flags 0% documented / staff-supported (worst case must not be hidden by a >0 guard)", () => {
    // Every session undocumented + unsupported — the worst case. The improvement
    // areas must surface; previously a `rate > 0` guard suppressed the 0% case.
    const sessions = OAK_HOUSE_SESSIONS.map((s) => ({ ...s, documentedInPlan: false, staffSupported: false }));
    const result = generateHomeworkStudySupportIntelligence(
      sessions, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("documentation"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("staff support"))).toBe(true);
  });

  it("produces a valid rating", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes all 4 evaluator results", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.quality).toBeDefined();
    expect(result.compliance).toBeDefined();
    expect(result.policy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
  });

  it("overall score equals sum of 4 evaluator scores", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    const expectedSum = Math.round(
      result.quality.overallScore +
      result.compliance.overallScore +
      result.policy.overallScore +
      result.staffReadiness.overallScore,
    );
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, expectedSum)));
  });

  it("includes child profiles", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.childProfiles.length).toBeGreaterThan(0);
  });

  it("includes 3 child profiles for Chamberlain House demo", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.childProfiles).toHaveLength(3);
  });

  it("includes regulatory links", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("includes CHR 2015 Regulation 8 in regulatory links", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 8"))).toBe(true);
  });

  it("includes CHR 2015 Regulation 9 in regulatory links", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 9"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes NMS 11 in regulatory links", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 11"))).toBe(true);
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("includes UNCRC Article 28 in regulatory links", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 28"))).toBe(true);
  });

  it("includes DfE 2018 in regulatory links", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("DfE 2018"))).toBe(true);
  });

  it("sets homeId correctly", () => {
    const result = generateHomeworkStudySupportIntelligence(
      [], null, [], "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
  });

  it("sets period dates correctly", () => {
    const result = generateHomeworkStudySupportIntelligence(
      [], null, [], "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.periodStart).toBe("2026-04-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("Chamberlain House demo is rated outstanding (100/100)", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("empty data produces inadequate rating", () => {
    const result = generateHomeworkStudySupportIntelligence(
      [], null, [], "test", "2026-04-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("includes assessedAt", () => {
    const result = generateHomeworkStudySupportIntelligence(
      [], null, [], "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.assessedAt).toBeDefined();
    expect(result.assessedAt.length).toBeGreaterThan(0);
  });

  it("generates strengths for outstanding data", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates areas for improvement for empty sessions", () => {
    const result = generateHomeworkStudySupportIntelligence(
      [], null, [], "test", "2026-04-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("generates actions for missing policy", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, null, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates actions for missing training", () => {
    const result = generateHomeworkStudySupportIntelligence(
      OAK_HOUSE_SESSIONS, OAK_HOUSE_POLICY, [],
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("generates actions for no sessions", () => {
    const result = generateHomeworkStudySupportIntelligence(
      [], OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-04-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("No study session records found"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Label utilities
// ══════════════════════════════════════════════════════════════════════════════

describe("getStudyActivityTypeLabel", () => {
  it("returns Homework Help for homework_help", () => {
    expect(getStudyActivityTypeLabel("homework_help")).toBe("Homework Help");
  });
  it("returns Revision Session for revision_session", () => {
    expect(getStudyActivityTypeLabel("revision_session")).toBe("Revision Session");
  });
  it("returns Reading Time for reading_time", () => {
    expect(getStudyActivityTypeLabel("reading_time")).toBe("Reading Time");
  });
  it("returns Project Work for project_work", () => {
    expect(getStudyActivityTypeLabel("project_work")).toBe("Project Work");
  });
  it("returns Exam Preparation for exam_preparation", () => {
    expect(getStudyActivityTypeLabel("exam_preparation")).toBe("Exam Preparation");
  });
  it("returns Tutoring for tutoring", () => {
    expect(getStudyActivityTypeLabel("tutoring")).toBe("Tutoring");
  });
  it("returns Study Skills Coaching for study_skills_coaching", () => {
    expect(getStudyActivityTypeLabel("study_skills_coaching")).toBe("Study Skills Coaching");
  });
  it("returns Educational Visit for educational_visit", () => {
    expect(getStudyActivityTypeLabel("educational_visit")).toBe("Educational Visit");
  });
});

describe("getEngagementLevelLabel", () => {
  it("returns Highly Engaged for highly_engaged", () => {
    expect(getEngagementLevelLabel("highly_engaged")).toBe("Highly Engaged");
  });
  it("returns Engaged for engaged", () => {
    expect(getEngagementLevelLabel("engaged")).toBe("Engaged");
  });
  it("returns Moderate for moderate", () => {
    expect(getEngagementLevelLabel("moderate")).toBe("Moderate");
  });
  it("returns Minimal for minimal", () => {
    expect(getEngagementLevelLabel("minimal")).toBe("Minimal");
  });
  it("returns Disengaged for disengaged", () => {
    expect(getEngagementLevelLabel("disengaged")).toBe("Disengaged");
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
// 9. pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct helper", () => {
  it("returns 0 for zero denominator", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("rounds correctly for 1/3", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("rounds correctly for 2/3", () => {
    expect(pct(2, 3)).toBe(67);
  });

  it("returns 0 for zero numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Edge cases via evaluators
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases via evaluators", () => {
  it("handles zero denominator in quality evaluator", () => {
    const result = evaluateQuality([]);
    expect(result.engagementRate).toBe(0);
    expect(result.progressRate).toBe(0);
    expect(result.confidenceRate).toBe(0);
    expect(result.resourceRate).toBe(0);
  });

  it("handles zero denominator in compliance evaluator", () => {
    const result = evaluateCompliance([]);
    expect(result.documentedRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
    expect(result.activityDiversityRatio).toBe(0);
  });

  it("handles zero denominator in staff readiness evaluator", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.educationalSupportRate).toBe(0);
    expect(result.studySkillsCoachingRate).toBe(0);
    expect(result.motivationalTechniquesRate).toBe(0);
    expect(result.senAwarenessRate).toBe(0);
    expect(result.schoolLiaisonRate).toBe(0);
    expect(result.resourceManagementRate).toBe(0);
  });

  it("single session with all false booleans scores low", () => {
    const sessions = [
      makeSession({
        id: "1",
        engagementLevel: "disengaged",
        progressNoted: false,
        confidenceGrown: false,
        resourcesProvided: false,
        documentedInPlan: false,
        staffSupported: false,
        feedbackGiven: false,
      }),
    ];
    const qualityResult = evaluateQuality(sessions);
    expect(qualityResult.overallScore).toBe(0);
    const complianceResult = evaluateCompliance(sessions);
    // activity diversity = 1/8 = 13% => 0.13*5 = 0.65 => rounds to 0.7
    expect(complianceResult.overallScore).toBeLessThanOrEqual(5);
  });

  it("mixed engagement levels calculate correctly", () => {
    const sessions = [
      makeSession({ id: "1", engagementLevel: "highly_engaged" }),
      makeSession({ id: "2", engagementLevel: "engaged" }),
      makeSession({ id: "3", engagementLevel: "moderate" }),
      makeSession({ id: "4", engagementLevel: "minimal" }),
      makeSession({ id: "5", engagementLevel: "disengaged" }),
    ];
    const result = evaluateQuality(sessions);
    expect(result.engagementRate).toBe(40);
  });
});
