// ==============================================================================
// TESTS -- Key Working Effectiveness Intelligence Engine
//
// Demo: Oak House, 3 children (Alex, Jordan, Morgan), 3 key workers
// (Sarah Johnson, Tom Richards, Lisa Williams)
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getSessionTypeLabel,
  getSessionQualityLabel,
  getRelationshipQualityLabel,
  getChildEngagementLabel,
  getCarePlanInputLabel,
  getChildVoiceEvidenceLabel,
  getRatingLabel,
  evaluateSessionEffectiveness,
  evaluateRelationshipQuality,
  evaluateCarePlanIntegration,
  evaluateProfessionalDevelopment,
  buildChildKeyWorkProfiles,
  generateKeyWorkingEffectivenessIntelligence,
} from "../key-working-effectiveness-engine";
import type {
  KeyWorkSession,
  KeyWorkerRelationship,
  CarePlanContribution,
  KeyWorkerDevelopment,
} from "../key-working-effectiveness-engine";

// -- Factories ---------------------------------------------------------------

const makeSession = (overrides: Partial<KeyWorkSession> = {}): KeyWorkSession => ({
  id: "sess-001",
  childId: "child-alex",
  childName: "Alex",
  keyWorkerId: "kw-sarah",
  keyWorkerName: "Sarah Johnson",
  date: "2026-05-01",
  durationMinutes: 45,
  sessionType: "one_to_one",
  sessionQuality: "good",
  childEngagement: "fully_engaged",
  topicsCovered: ["feelings", "school"],
  actionsAgreed: ["Contact school", "Update care plan"],
  actionsCompleted: 2,
  childVoiceEvidence: "wishes_captured_and_acted",
  recordedWithin24Hours: true,
  supervisorReviewed: true,
  ...overrides,
});

const makeRelationship = (overrides: Partial<KeyWorkerRelationship> = {}): KeyWorkerRelationship => ({
  id: "rel-001",
  childId: "child-alex",
  childName: "Alex",
  keyWorkerId: "kw-sarah",
  keyWorkerName: "Sarah Johnson",
  relationshipQuality: "strong_and_trusting",
  assignmentDate: "2025-09-01",
  keyWorkerChanges: 1,
  childFeelsListenedTo: true,
  childTrustsKeyWorker: true,
  culturalCompetence: true,
  consistencyRating: 9,
  ...overrides,
});

const makeContribution = (overrides: Partial<CarePlanContribution> = {}): CarePlanContribution => ({
  id: "cp-001",
  childId: "child-alex",
  childName: "Alex",
  keyWorkerId: "kw-sarah",
  keyWorkerName: "Sarah Johnson",
  carePlanInput: "comprehensive",
  reviewsAttended: 3,
  reviewsMissed: 0,
  reportsTimely: true,
  childViewsRepresented: true,
  outcomesFocused: true,
  ...overrides,
});

const makeDevelopment = (overrides: Partial<KeyWorkerDevelopment> = {}): KeyWorkerDevelopment => ({
  id: "dev-001",
  keyWorkerId: "kw-sarah",
  keyWorkerName: "Sarah Johnson",
  trainingCompleted: ["Therapeutic key working", "Attachment theory"],
  supervisionRegular: true,
  reflectivePractice: true,
  caseloadCount: 3,
  peerSupportAccessed: true,
  ...overrides,
});

// == pct =====================================================================

describe("pct", () => {
  it("calculates percentage correctly", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });

  it("rounds 50% correctly", () => {
    expect(pct(1, 2)).toBe(50);
  });
});

// == getRating ===============================================================

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });

  it("handles boundary values exactly", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(79)).toBe("good");
    expect(getRating(60)).toBe("good");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// == Label Functions =========================================================

describe("getSessionTypeLabel", () => {
  it("returns correct label for one_to_one", () => {
    expect(getSessionTypeLabel("one_to_one")).toBe("One-to-One");
  });

  it("returns correct label for informal_check_in", () => {
    expect(getSessionTypeLabel("informal_check_in")).toBe("Informal Check-In");
  });

  it("returns correct label for care_plan_review", () => {
    expect(getSessionTypeLabel("care_plan_review")).toBe("Care Plan Review");
  });

  it("returns correct label for activity_based", () => {
    expect(getSessionTypeLabel("activity_based")).toBe("Activity Based");
  });

  it("returns correct label for crisis_support", () => {
    expect(getSessionTypeLabel("crisis_support")).toBe("Crisis Support");
  });

  it("returns correct label for life_story_work", () => {
    expect(getSessionTypeLabel("life_story_work")).toBe("Life Story Work");
  });

  it("returns correct label for independence_planning", () => {
    expect(getSessionTypeLabel("independence_planning")).toBe("Independence Planning");
  });

  it("returns correct label for advocacy", () => {
    expect(getSessionTypeLabel("advocacy")).toBe("Advocacy");
  });
});

describe("getSessionQualityLabel", () => {
  it("returns correct label for excellent", () => {
    expect(getSessionQualityLabel("excellent")).toBe("Excellent");
  });

  it("returns correct label for good", () => {
    expect(getSessionQualityLabel("good")).toBe("Good");
  });

  it("returns correct label for adequate", () => {
    expect(getSessionQualityLabel("adequate")).toBe("Adequate");
  });

  it("returns correct label for poor", () => {
    expect(getSessionQualityLabel("poor")).toBe("Poor");
  });
});

describe("getRelationshipQualityLabel", () => {
  it("returns correct label for strong_and_trusting", () => {
    expect(getRelationshipQualityLabel("strong_and_trusting")).toBe("Strong & Trusting");
  });

  it("returns correct label for developing", () => {
    expect(getRelationshipQualityLabel("developing")).toBe("Developing");
  });

  it("returns correct label for inconsistent", () => {
    expect(getRelationshipQualityLabel("inconsistent")).toBe("Inconsistent");
  });

  it("returns correct label for difficult", () => {
    expect(getRelationshipQualityLabel("difficult")).toBe("Difficult");
  });

  it("returns correct label for not_established", () => {
    expect(getRelationshipQualityLabel("not_established")).toBe("Not Established");
  });
});

describe("getChildEngagementLabel", () => {
  it("returns correct label for fully_engaged", () => {
    expect(getChildEngagementLabel("fully_engaged")).toBe("Fully Engaged");
  });

  it("returns correct label for mostly_engaged", () => {
    expect(getChildEngagementLabel("mostly_engaged")).toBe("Mostly Engaged");
  });

  it("returns correct label for partially_engaged", () => {
    expect(getChildEngagementLabel("partially_engaged")).toBe("Partially Engaged");
  });

  it("returns correct label for reluctant", () => {
    expect(getChildEngagementLabel("reluctant")).toBe("Reluctant");
  });

  it("returns correct label for refused", () => {
    expect(getChildEngagementLabel("refused")).toBe("Refused");
  });
});

describe("getCarePlanInputLabel", () => {
  it("returns correct label for comprehensive", () => {
    expect(getCarePlanInputLabel("comprehensive")).toBe("Comprehensive");
  });

  it("returns correct label for partial", () => {
    expect(getCarePlanInputLabel("partial")).toBe("Partial");
  });

  it("returns correct label for minimal", () => {
    expect(getCarePlanInputLabel("minimal")).toBe("Minimal");
  });

  it("returns correct label for none", () => {
    expect(getCarePlanInputLabel("none")).toBe("None");
  });
});

describe("getChildVoiceEvidenceLabel", () => {
  it("returns correct label for wishes_captured_and_acted", () => {
    expect(getChildVoiceEvidenceLabel("wishes_captured_and_acted")).toBe("Wishes Captured & Acted Upon");
  });

  it("returns correct label for wishes_captured", () => {
    expect(getChildVoiceEvidenceLabel("wishes_captured")).toBe("Wishes Captured");
  });

  it("returns correct label for token_consultation", () => {
    expect(getChildVoiceEvidenceLabel("token_consultation")).toBe("Token Consultation");
  });

  it("returns correct label for not_sought", () => {
    expect(getChildVoiceEvidenceLabel("not_sought")).toBe("Not Sought");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns correct label for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns correct label for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns correct label for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// == evaluateSessionEffectiveness ============================================

describe("evaluateSessionEffectiveness", () => {
  it("returns zero scores for empty sessions", () => {
    const result = evaluateSessionEffectiveness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.excellentGoodRate).toBe(0);
    expect(result.childEngagementRate).toBe(0);
    expect(result.childVoiceRate).toBe(0);
    expect(result.recordingComplianceRate).toBe(0);
    expect(result.averageDurationMinutes).toBe(0);
    expect(result.actionsCompletionRate).toBe(0);
  });

  it("returns perfect scores for all-excellent sessions", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `sess-${i}`,
        sessionQuality: "excellent",
        childEngagement: "fully_engaged",
        childVoiceEvidence: "wishes_captured_and_acted",
        recordedWithin24Hours: true,
      }),
    );
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.overallScore).toBe(25);
    expect(result.excellentGoodRate).toBe(100);
    expect(result.childEngagementRate).toBe(100);
    expect(result.childVoiceRate).toBe(100);
    expect(result.recordingComplianceRate).toBe(100);
  });

  it("counts excellent and good sessions together", () => {
    const sessions = [
      makeSession({ id: "s1", sessionQuality: "excellent" }),
      makeSession({ id: "s2", sessionQuality: "good" }),
      makeSession({ id: "s3", sessionQuality: "adequate" }),
      makeSession({ id: "s4", sessionQuality: "poor" }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.excellentGoodRate).toBe(50);
    expect(result.totalSessions).toBe(4);
  });

  it("counts fully and mostly engaged children", () => {
    const sessions = [
      makeSession({ id: "s1", childEngagement: "fully_engaged" }),
      makeSession({ id: "s2", childEngagement: "mostly_engaged" }),
      makeSession({ id: "s3", childEngagement: "partially_engaged" }),
      makeSession({ id: "s4", childEngagement: "reluctant" }),
      makeSession({ id: "s5", childEngagement: "refused" }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.childEngagementRate).toBe(40);
  });

  it("counts wishes_captured_and_acted and wishes_captured for voice rate", () => {
    const sessions = [
      makeSession({ id: "s1", childVoiceEvidence: "wishes_captured_and_acted" }),
      makeSession({ id: "s2", childVoiceEvidence: "wishes_captured" }),
      makeSession({ id: "s3", childVoiceEvidence: "token_consultation" }),
      makeSession({ id: "s4", childVoiceEvidence: "not_sought" }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.childVoiceRate).toBe(50);
  });

  it("calculates recording compliance rate", () => {
    const sessions = [
      makeSession({ id: "s1", recordedWithin24Hours: true }),
      makeSession({ id: "s2", recordedWithin24Hours: true }),
      makeSession({ id: "s3", recordedWithin24Hours: false }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.recordingComplianceRate).toBe(67);
  });

  it("calculates average duration correctly", () => {
    const sessions = [
      makeSession({ id: "s1", durationMinutes: 30 }),
      makeSession({ id: "s2", durationMinutes: 60 }),
      makeSession({ id: "s3", durationMinutes: 45 }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.averageDurationMinutes).toBe(45);
  });

  it("calculates actions completion rate", () => {
    const sessions = [
      makeSession({ id: "s1", actionsAgreed: ["a", "b", "c"], actionsCompleted: 2 }),
      makeSession({ id: "s2", actionsAgreed: ["a"], actionsCompleted: 1 }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.actionsCompletionRate).toBe(75);
  });

  it("handles sessions with no actions agreed", () => {
    const sessions = [
      makeSession({ id: "s1", actionsAgreed: [], actionsCompleted: 0 }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.actionsCompletionRate).toBe(0);
  });

  it("returns score capped at 25", () => {
    const sessions = Array.from({ length: 100 }, (_, i) =>
      makeSession({ id: `sess-${i}`, sessionQuality: "excellent" }),
    );
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores low for all-poor sessions", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({
        id: `sess-${i}`,
        sessionQuality: "poor",
        childEngagement: "refused",
        childVoiceEvidence: "not_sought",
        recordedWithin24Hours: false,
      }),
    );
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.overallScore).toBe(0);
    expect(result.excellentGoodRate).toBe(0);
    expect(result.childEngagementRate).toBe(0);
    expect(result.childVoiceRate).toBe(0);
    expect(result.recordingComplianceRate).toBe(0);
  });

  it("handles single session", () => {
    const result = evaluateSessionEffectiveness([makeSession()]);
    expect(result.totalSessions).toBe(1);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("produces mixed scores for mixed quality sessions", () => {
    const sessions = [
      makeSession({ id: "s1", sessionQuality: "excellent", childEngagement: "fully_engaged", childVoiceEvidence: "wishes_captured_and_acted", recordedWithin24Hours: true }),
      makeSession({ id: "s2", sessionQuality: "poor", childEngagement: "refused", childVoiceEvidence: "not_sought", recordedWithin24Hours: false }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.excellentGoodRate).toBe(50);
    expect(result.childEngagementRate).toBe(50);
    expect(result.childVoiceRate).toBe(50);
    expect(result.recordingComplianceRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });
});

// == evaluateRelationshipQuality =============================================

describe("evaluateRelationshipQuality", () => {
  it("returns zero scores for empty relationships", () => {
    const result = evaluateRelationshipQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRelationships).toBe(0);
    expect(result.strongDevelopingRate).toBe(0);
    expect(result.childFeelsListenedRate).toBe(0);
    expect(result.childTrustsRate).toBe(0);
    expect(result.averageConsistencyRating).toBe(0);
    expect(result.highTurnoverCount).toBe(0);
  });

  it("returns perfect scores for all-strong relationships", () => {
    const relationships = Array.from({ length: 5 }, (_, i) =>
      makeRelationship({
        id: `rel-${i}`,
        childId: `child-${i}`,
        relationshipQuality: "strong_and_trusting",
        childFeelsListenedTo: true,
        childTrustsKeyWorker: true,
        consistencyRating: 10,
        keyWorkerChanges: 0,
      }),
    );
    const result = evaluateRelationshipQuality(relationships);
    expect(result.overallScore).toBe(25);
    expect(result.strongDevelopingRate).toBe(100);
    expect(result.childFeelsListenedRate).toBe(100);
    expect(result.childTrustsRate).toBe(100);
    expect(result.highTurnoverCount).toBe(0);
  });

  it("counts strong and developing together for rate", () => {
    const relationships = [
      makeRelationship({ id: "r1", relationshipQuality: "strong_and_trusting" }),
      makeRelationship({ id: "r2", childId: "child-2", relationshipQuality: "developing" }),
      makeRelationship({ id: "r3", childId: "child-3", relationshipQuality: "inconsistent" }),
      makeRelationship({ id: "r4", childId: "child-4", relationshipQuality: "difficult" }),
    ];
    const result = evaluateRelationshipQuality(relationships);
    expect(result.strongDevelopingRate).toBe(50);
  });

  it("calculates child feels listened rate", () => {
    const relationships = [
      makeRelationship({ id: "r1", childFeelsListenedTo: true }),
      makeRelationship({ id: "r2", childId: "child-2", childFeelsListenedTo: false }),
      makeRelationship({ id: "r3", childId: "child-3", childFeelsListenedTo: true }),
    ];
    const result = evaluateRelationshipQuality(relationships);
    expect(result.childFeelsListenedRate).toBe(67);
  });

  it("calculates child trusts rate", () => {
    const relationships = [
      makeRelationship({ id: "r1", childTrustsKeyWorker: true }),
      makeRelationship({ id: "r2", childId: "child-2", childTrustsKeyWorker: false }),
    ];
    const result = evaluateRelationshipQuality(relationships);
    expect(result.childTrustsRate).toBe(50);
  });

  it("calculates average consistency rating", () => {
    const relationships = [
      makeRelationship({ id: "r1", consistencyRating: 8 }),
      makeRelationship({ id: "r2", childId: "child-2", consistencyRating: 6 }),
    ];
    const result = evaluateRelationshipQuality(relationships);
    expect(result.averageConsistencyRating).toBe(7);
  });

  it("counts high turnover children (3+ changes)", () => {
    const relationships = [
      makeRelationship({ id: "r1", keyWorkerChanges: 3 }),
      makeRelationship({ id: "r2", childId: "child-2", keyWorkerChanges: 5 }),
      makeRelationship({ id: "r3", childId: "child-3", keyWorkerChanges: 1 }),
    ];
    const result = evaluateRelationshipQuality(relationships);
    expect(result.highTurnoverCount).toBe(2);
  });

  it("applies penalty for high turnover", () => {
    const baseRel = makeRelationship({
      relationshipQuality: "strong_and_trusting",
      childFeelsListenedTo: true,
      childTrustsKeyWorker: true,
      consistencyRating: 10,
    });

    const noTurnover = evaluateRelationshipQuality([
      { ...baseRel, id: "r1", keyWorkerChanges: 0 },
    ]);
    const withTurnover = evaluateRelationshipQuality([
      { ...baseRel, id: "r1", keyWorkerChanges: 4 },
    ]);

    expect(withTurnover.overallScore).toBeLessThan(noTurnover.overallScore);
  });

  it("clamps score to minimum 0 with heavy turnover penalty", () => {
    const relationships = Array.from({ length: 10 }, (_, i) =>
      makeRelationship({
        id: `rel-${i}`,
        childId: `child-${i}`,
        relationshipQuality: "not_established",
        childFeelsListenedTo: false,
        childTrustsKeyWorker: false,
        consistencyRating: 1,
        keyWorkerChanges: 5,
      }),
    );
    const result = evaluateRelationshipQuality(relationships);
    expect(result.overallScore).toBe(0);
  });

  it("handles single relationship", () => {
    const result = evaluateRelationshipQuality([makeRelationship()]);
    expect(result.totalRelationships).toBe(1);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("scores correctly for all-difficult relationships with no trust", () => {
    const relationships = [
      makeRelationship({
        id: "r1",
        relationshipQuality: "difficult",
        childFeelsListenedTo: false,
        childTrustsKeyWorker: false,
        consistencyRating: 2,
        keyWorkerChanges: 0,
      }),
    ];
    const result = evaluateRelationshipQuality(relationships);
    expect(result.strongDevelopingRate).toBe(0);
    expect(result.childFeelsListenedRate).toBe(0);
    expect(result.childTrustsRate).toBe(0);
    expect(result.overallScore).toBeLessThan(5);
  });
});

// == evaluateCarePlanIntegration =============================================

describe("evaluateCarePlanIntegration", () => {
  it("returns zero scores for empty contributions", () => {
    const result = evaluateCarePlanIntegration([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalContributions).toBe(0);
    expect(result.comprehensivePartialRate).toBe(0);
    expect(result.reviewAttendanceRate).toBe(0);
    expect(result.reportsTimelyRate).toBe(0);
    expect(result.childViewsRepresentedRate).toBe(0);
    expect(result.outcomesFocusedRate).toBe(0);
  });

  it("returns perfect scores for all-comprehensive contributions", () => {
    const contributions = Array.from({ length: 5 }, (_, i) =>
      makeContribution({
        id: `cp-${i}`,
        childId: `child-${i}`,
        carePlanInput: "comprehensive",
        reviewsAttended: 4,
        reviewsMissed: 0,
        reportsTimely: true,
        childViewsRepresented: true,
        outcomesFocused: true,
      }),
    );
    const result = evaluateCarePlanIntegration(contributions);
    expect(result.overallScore).toBe(25);
    expect(result.comprehensivePartialRate).toBe(100);
    expect(result.reviewAttendanceRate).toBe(100);
    expect(result.reportsTimelyRate).toBe(100);
    expect(result.childViewsRepresentedRate).toBe(100);
    expect(result.outcomesFocusedRate).toBe(100);
  });

  it("counts comprehensive and partial together", () => {
    const contributions = [
      makeContribution({ id: "cp1", carePlanInput: "comprehensive" }),
      makeContribution({ id: "cp2", childId: "child-2", carePlanInput: "partial" }),
      makeContribution({ id: "cp3", childId: "child-3", carePlanInput: "minimal" }),
      makeContribution({ id: "cp4", childId: "child-4", carePlanInput: "none" }),
    ];
    const result = evaluateCarePlanIntegration(contributions);
    expect(result.comprehensivePartialRate).toBe(50);
  });

  it("calculates review attendance rate from attended and missed", () => {
    const contributions = [
      makeContribution({ id: "cp1", reviewsAttended: 3, reviewsMissed: 1 }),
      makeContribution({ id: "cp2", childId: "child-2", reviewsAttended: 2, reviewsMissed: 2 }),
    ];
    const result = evaluateCarePlanIntegration(contributions);
    // Total attended: 5, total reviews: 8
    expect(result.reviewAttendanceRate).toBe(63);
  });

  it("handles zero reviews gracefully", () => {
    const contributions = [
      makeContribution({ id: "cp1", reviewsAttended: 0, reviewsMissed: 0 }),
    ];
    const result = evaluateCarePlanIntegration(contributions);
    expect(result.reviewAttendanceRate).toBe(0);
  });

  it("calculates reports timely rate", () => {
    const contributions = [
      makeContribution({ id: "cp1", reportsTimely: true }),
      makeContribution({ id: "cp2", childId: "child-2", reportsTimely: false }),
      makeContribution({ id: "cp3", childId: "child-3", reportsTimely: true }),
    ];
    const result = evaluateCarePlanIntegration(contributions);
    expect(result.reportsTimelyRate).toBe(67);
  });

  it("calculates child views represented rate", () => {
    const contributions = [
      makeContribution({ id: "cp1", childViewsRepresented: true }),
      makeContribution({ id: "cp2", childId: "child-2", childViewsRepresented: false }),
    ];
    const result = evaluateCarePlanIntegration(contributions);
    expect(result.childViewsRepresentedRate).toBe(50);
  });

  it("calculates outcomes focused rate", () => {
    const contributions = [
      makeContribution({ id: "cp1", outcomesFocused: true }),
      makeContribution({ id: "cp2", childId: "child-2", outcomesFocused: false }),
      makeContribution({ id: "cp3", childId: "child-3", outcomesFocused: true }),
      makeContribution({ id: "cp4", childId: "child-4", outcomesFocused: false }),
    ];
    const result = evaluateCarePlanIntegration(contributions);
    expect(result.outcomesFocusedRate).toBe(50);
  });

  it("scores low for all-none contributions with poor metrics", () => {
    const contributions = [
      makeContribution({
        id: "cp1",
        carePlanInput: "none",
        reviewsAttended: 0,
        reviewsMissed: 3,
        reportsTimely: false,
        childViewsRepresented: false,
        outcomesFocused: false,
      }),
    ];
    const result = evaluateCarePlanIntegration(contributions);
    expect(result.overallScore).toBe(0);
    expect(result.comprehensivePartialRate).toBe(0);
    expect(result.reportsTimelyRate).toBe(0);
  });

  it("handles single contribution", () => {
    const result = evaluateCarePlanIntegration([makeContribution()]);
    expect(result.totalContributions).toBe(1);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("caps score at 25", () => {
    const contributions = Array.from({ length: 20 }, (_, i) =>
      makeContribution({ id: `cp-${i}`, childId: `child-${i}` }),
    );
    const result = evaluateCarePlanIntegration(contributions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// == evaluateProfessionalDevelopment =========================================

describe("evaluateProfessionalDevelopment", () => {
  it("returns zero scores for empty development data", () => {
    const result = evaluateProfessionalDevelopment([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalKeyWorkers).toBe(0);
    expect(result.trainingComplianceRate).toBe(0);
    expect(result.supervisionRegularRate).toBe(0);
    expect(result.reflectivePracticeRate).toBe(0);
    expect(result.managableCaseloadRate).toBe(0);
    expect(result.peerSupportRate).toBe(0);
  });

  it("returns perfect scores for fully developed key workers", () => {
    const development = Array.from({ length: 5 }, (_, i) =>
      makeDevelopment({
        id: `dev-${i}`,
        keyWorkerId: `kw-${i}`,
        trainingCompleted: ["Course A", "Course B"],
        supervisionRegular: true,
        reflectivePractice: true,
        caseloadCount: 3,
        peerSupportAccessed: true,
      }),
    );
    const result = evaluateProfessionalDevelopment(development);
    expect(result.overallScore).toBe(25);
    expect(result.trainingComplianceRate).toBe(100);
    expect(result.supervisionRegularRate).toBe(100);
    expect(result.reflectivePracticeRate).toBe(100);
    expect(result.managableCaseloadRate).toBe(100);
    expect(result.peerSupportRate).toBe(100);
  });

  it("counts training compliance based on non-empty training arrays", () => {
    const development = [
      makeDevelopment({ id: "d1", trainingCompleted: ["Course A"] }),
      makeDevelopment({ id: "d2", keyWorkerId: "kw-2", trainingCompleted: [] }),
      makeDevelopment({ id: "d3", keyWorkerId: "kw-3", trainingCompleted: ["Course B", "Course C"] }),
    ];
    const result = evaluateProfessionalDevelopment(development);
    expect(result.trainingComplianceRate).toBe(67);
  });

  it("calculates supervision regular rate", () => {
    const development = [
      makeDevelopment({ id: "d1", supervisionRegular: true }),
      makeDevelopment({ id: "d2", keyWorkerId: "kw-2", supervisionRegular: false }),
    ];
    const result = evaluateProfessionalDevelopment(development);
    expect(result.supervisionRegularRate).toBe(50);
  });

  it("calculates reflective practice rate", () => {
    const development = [
      makeDevelopment({ id: "d1", reflectivePractice: true }),
      makeDevelopment({ id: "d2", keyWorkerId: "kw-2", reflectivePractice: true }),
      makeDevelopment({ id: "d3", keyWorkerId: "kw-3", reflectivePractice: false }),
    ];
    const result = evaluateProfessionalDevelopment(development);
    expect(result.reflectivePracticeRate).toBe(67);
  });

  it("calculates manageable caseload rate (caseload <= 4)", () => {
    const development = [
      makeDevelopment({ id: "d1", caseloadCount: 3 }),
      makeDevelopment({ id: "d2", keyWorkerId: "kw-2", caseloadCount: 4 }),
      makeDevelopment({ id: "d3", keyWorkerId: "kw-3", caseloadCount: 5 }),
      makeDevelopment({ id: "d4", keyWorkerId: "kw-4", caseloadCount: 6 }),
    ];
    const result = evaluateProfessionalDevelopment(development);
    expect(result.managableCaseloadRate).toBe(50);
  });

  it("treats caseload of exactly 4 as manageable", () => {
    const development = [
      makeDevelopment({ id: "d1", caseloadCount: 4 }),
    ];
    const result = evaluateProfessionalDevelopment(development);
    expect(result.managableCaseloadRate).toBe(100);
  });

  it("calculates peer support rate", () => {
    const development = [
      makeDevelopment({ id: "d1", peerSupportAccessed: true }),
      makeDevelopment({ id: "d2", keyWorkerId: "kw-2", peerSupportAccessed: false }),
      makeDevelopment({ id: "d3", keyWorkerId: "kw-3", peerSupportAccessed: false }),
    ];
    const result = evaluateProfessionalDevelopment(development);
    expect(result.peerSupportRate).toBe(33);
  });

  it("scores low when all metrics are poor", () => {
    const development = [
      makeDevelopment({
        id: "d1",
        trainingCompleted: [],
        supervisionRegular: false,
        reflectivePractice: false,
        caseloadCount: 8,
        peerSupportAccessed: false,
      }),
    ];
    const result = evaluateProfessionalDevelopment(development);
    expect(result.overallScore).toBe(0);
  });

  it("handles single key worker", () => {
    const result = evaluateProfessionalDevelopment([makeDevelopment()]);
    expect(result.totalKeyWorkers).toBe(1);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("caps score at 25", () => {
    const development = Array.from({ length: 20 }, (_, i) =>
      makeDevelopment({ id: `dev-${i}`, keyWorkerId: `kw-${i}` }),
    );
    const result = evaluateProfessionalDevelopment(development);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// == buildChildKeyWorkProfiles ===============================================

describe("buildChildKeyWorkProfiles", () => {
  it("returns empty array when all inputs are empty", () => {
    const profiles = buildChildKeyWorkProfiles([], [], []);
    expect(profiles).toHaveLength(0);
  });

  it("builds profile from sessions only", () => {
    const sessions = [
      makeSession({ id: "s1" }),
      makeSession({ id: "s2" }),
    ];
    const profiles = buildChildKeyWorkProfiles(sessions, [], []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].keyWorkerName).toBe("Sarah Johnson");
    expect(profiles[0].sessionCount).toBe(2);
    expect(profiles[0].relationshipQuality).toBe("not_assessed");
    expect(profiles[0].carePlanInput).toBe("none");
  });

  it("builds profile from relationships only", () => {
    const relationships = [makeRelationship()];
    const profiles = buildChildKeyWorkProfiles([], relationships, []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].relationshipQuality).toBe("strong_and_trusting");
    expect(profiles[0].sessionCount).toBe(0);
  });

  it("builds profile from contributions only", () => {
    const contributions = [makeContribution()];
    const profiles = buildChildKeyWorkProfiles([], [], contributions);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].carePlanInput).toBe("comprehensive");
    expect(profiles[0].sessionCount).toBe(0);
  });

  it("merges data across sessions, relationships, and contributions for same child", () => {
    const sessions = [makeSession({ id: "s1" })];
    const relationships = [makeRelationship()];
    const contributions = [makeContribution()];
    const profiles = buildChildKeyWorkProfiles(sessions, relationships, contributions);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].sessionCount).toBe(1);
    expect(profiles[0].relationshipQuality).toBe("strong_and_trusting");
    expect(profiles[0].carePlanInput).toBe("comprehensive");
  });

  it("creates separate profiles for different children", () => {
    const sessions = [
      makeSession({ id: "s1", childId: "child-alex", childName: "Alex" }),
      makeSession({ id: "s2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildKeyWorkProfiles(sessions, [], []);
    expect(profiles).toHaveLength(2);
    const ids = profiles.map((p) => p.childId);
    expect(ids).toContain("child-alex");
    expect(ids).toContain("child-jordan");
  });

  it("calculates engagement rate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", childEngagement: "fully_engaged" }),
      makeSession({ id: "s2", childEngagement: "refused" }),
    ];
    const profiles = buildChildKeyWorkProfiles(sessions, [], []);
    expect(profiles[0].engagementRate).toBe(50);
  });

  it("scores higher for more sessions", () => {
    const fewSessions = [makeSession({ id: "s1" })];
    const manySessions = Array.from({ length: 8 }, (_, i) =>
      makeSession({ id: `s-${i}` }),
    );
    const fewProfiles = buildChildKeyWorkProfiles(fewSessions, [], []);
    const manyProfiles = buildChildKeyWorkProfiles(manySessions, [], []);
    expect(manyProfiles[0].overallScore).toBeGreaterThanOrEqual(fewProfiles[0].overallScore);
  });

  it("scores higher for strong relationship vs not assessed", () => {
    const withRel = buildChildKeyWorkProfiles(
      [makeSession()],
      [makeRelationship()],
      [],
    );
    const withoutRel = buildChildKeyWorkProfiles(
      [makeSession()],
      [],
      [],
    );
    expect(withRel[0].overallScore).toBeGreaterThanOrEqual(withoutRel[0].overallScore);
  });

  it("scores higher for comprehensive care plan vs none", () => {
    const withCP = buildChildKeyWorkProfiles(
      [makeSession()],
      [],
      [makeContribution()],
    );
    const withoutCP = buildChildKeyWorkProfiles(
      [makeSession()],
      [],
      [],
    );
    expect(withCP[0].overallScore).toBeGreaterThanOrEqual(withoutCP[0].overallScore);
  });

  it("sorts profiles by score ascending (lowest first)", () => {
    const sessions = [
      makeSession({ id: "s1", childId: "child-alex", childName: "Alex", childEngagement: "fully_engaged" }),
      makeSession({ id: "s2", childId: "child-alex", childName: "Alex", childEngagement: "fully_engaged" }),
      makeSession({ id: "s3", childId: "child-alex", childName: "Alex", childEngagement: "fully_engaged" }),
      makeSession({ id: "s4", childId: "child-alex", childName: "Alex", childEngagement: "fully_engaged" }),
      makeSession({ id: "s5", childId: "child-jordan", childName: "Jordan", childEngagement: "refused" }),
    ];
    const relationships = [
      makeRelationship({ id: "r1", childId: "child-alex", relationshipQuality: "strong_and_trusting" }),
      makeRelationship({ id: "r2", childId: "child-jordan", childName: "Jordan", relationshipQuality: "difficult" }),
    ];
    const profiles = buildChildKeyWorkProfiles(sessions, relationships, []);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(profiles[1].overallScore);
  });

  it("clamps overall score to 0-10 range", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        childEngagement: "fully_engaged",
        childVoiceEvidence: "wishes_captured_and_acted",
      }),
    );
    const relationships = [makeRelationship({ relationshipQuality: "strong_and_trusting" })];
    const contributions = [makeContribution({ carePlanInput: "comprehensive" })];
    const profiles = buildChildKeyWorkProfiles(sessions, relationships, contributions);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// == generateKeyWorkingEffectivenessIntelligence (main function) ==============

describe("generateKeyWorkingEffectivenessIntelligence", () => {
  const SESSIONS: KeyWorkSession[] = [
    makeSession({ id: "s1", childId: "child-alex", childName: "Alex", keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson" }),
    makeSession({ id: "s2", childId: "child-alex", childName: "Alex", keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson", sessionType: "activity_based" }),
    makeSession({ id: "s3", childId: "child-jordan", childName: "Jordan", keyWorkerId: "kw-tom", keyWorkerName: "Tom Richards", sessionType: "crisis_support", sessionQuality: "adequate", childEngagement: "partially_engaged" }),
    makeSession({ id: "s4", childId: "child-morgan", childName: "Morgan", keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams", sessionType: "life_story_work" }),
    makeSession({ id: "s5", childId: "child-morgan", childName: "Morgan", keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams", sessionType: "independence_planning" }),
  ];

  const RELATIONSHIPS: KeyWorkerRelationship[] = [
    makeRelationship({ id: "r1", childId: "child-alex", childName: "Alex" }),
    makeRelationship({ id: "r2", childId: "child-jordan", childName: "Jordan", keyWorkerId: "kw-tom", keyWorkerName: "Tom Richards", relationshipQuality: "developing", consistencyRating: 6 }),
    makeRelationship({ id: "r3", childId: "child-morgan", childName: "Morgan", keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams", relationshipQuality: "strong_and_trusting", consistencyRating: 8 }),
  ];

  const CONTRIBUTIONS: CarePlanContribution[] = [
    makeContribution({ id: "cp1", childId: "child-alex", childName: "Alex" }),
    makeContribution({ id: "cp2", childId: "child-jordan", childName: "Jordan", keyWorkerId: "kw-tom", keyWorkerName: "Tom Richards", carePlanInput: "partial", reviewsAttended: 2, reviewsMissed: 1 }),
    makeContribution({ id: "cp3", childId: "child-morgan", childName: "Morgan", keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams" }),
  ];

  const DEVELOPMENT: KeyWorkerDevelopment[] = [
    makeDevelopment({ id: "d1", keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson" }),
    makeDevelopment({ id: "d2", keyWorkerId: "kw-tom", keyWorkerName: "Tom Richards", trainingCompleted: [], supervisionRegular: false, reflectivePractice: false }),
    makeDevelopment({ id: "d3", keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams" }),
  ];

  it("returns correct homeId and period", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-04-01");
    expect(result.periodEnd).toBe("2026-05-18");
  });

  it("calculates overall score as sum of 4 evaluator scores", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    const expectedSum =
      result.sessionEffectiveness.overallScore +
      result.relationshipQuality.overallScore +
      result.carePlanIntegration.overallScore +
      result.professionalDevelopment.overallScore;
    expect(result.overallScore).toBe(expectedSum);
  });

  it("overall score is between 0 and 100", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("rating matches getRating for the overall score", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.rating).toBe(getRating(result.overallScore));
  });

  it("includes child profiles for all children", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.childProfiles.length).toBe(3);
    const childIds = result.childProfiles.map((p) => p.childId);
    expect(childIds).toContain("child-alex");
    expect(childIds).toContain("child-jordan");
    expect(childIds).toContain("child-morgan");
  });

  it("generates strengths array", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("generates areasForImprovement array", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates actions array", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("generates regulatory links", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("regulatory links include CHR 2015 Reg 5", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 5"))).toBe(true);
  });

  it("regulatory links include CHR 2015 Reg 14", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 14"))).toBe(true);
  });

  it("regulatory links include SCCIF", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("regulatory links include NMS 2", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 2"))).toBe(true);
  });

  it("returns inadequate when all inputs empty", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      [], [], [], [],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toHaveLength(0);
  });

  it("generates URGENT actions when all inputs empty", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      [], [], [], [],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT:"));
    expect(urgentActions.length).toBeGreaterThan(0);
  });

  it("generates URGENT action when score < 40 (inadequate)", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      [], [], [], [],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("inadequate"))).toBe(true);
  });

  it("generates URGENT action for key worker turnover", () => {
    const relationships = [
      makeRelationship({ id: "r1", childId: "child-alex", keyWorkerChanges: 5 }),
    ];
    const result = generateKeyWorkingEffectivenessIntelligence(
      [makeSession()], relationships, [makeContribution()], [makeDevelopment()],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("changes"))).toBe(true);
  });

  it("includes NMS 19 when supervision is not 100%", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    // Tom has supervisionRegular: false, so NMS 19 should appear
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 19"))).toBe(true);
  });

  it("includes UNCRC Article 12 when child voice is below threshold", () => {
    const sessions = [
      makeSession({ id: "s1", childVoiceEvidence: "not_sought" }),
      makeSession({ id: "s2", childVoiceEvidence: "token_consultation" }),
    ];
    const result = generateKeyWorkingEffectivenessIntelligence(
      sessions, [], [], [],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 12"))).toBe(true);
  });

  it("includes Working Together 2023 when child views below threshold", () => {
    const contributions = [
      makeContribution({ id: "cp1", childViewsRepresented: false }),
    ];
    const sessions = [
      makeSession({ id: "s1", childVoiceEvidence: "not_sought" }),
    ];
    const result = generateKeyWorkingEffectivenessIntelligence(
      sessions, [], contributions, [],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
  });

  it("generates strengths about child voice when rate is high", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        childVoiceEvidence: "wishes_captured_and_acted",
      }),
    );
    const result = generateKeyWorkingEffectivenessIntelligence(
      sessions, [], [], [],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.strengths.some((s) => s.includes("voice") || s.includes("wishes"))).toBe(true);
  });

  it("generates areas for improvement about recording when compliance is low", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        recordedWithin24Hours: false,
      }),
    );
    const result = generateKeyWorkingEffectivenessIntelligence(
      sessions, [], [], [],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Recording") || a.includes("recording"))).toBe(true);
  });

  it("returns outstanding rating for perfect data", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        sessionQuality: "excellent",
        childEngagement: "fully_engaged",
        childVoiceEvidence: "wishes_captured_and_acted",
        recordedWithin24Hours: true,
      }),
    );
    const relationships = Array.from({ length: 3 }, (_, i) =>
      makeRelationship({
        id: `r-${i}`,
        childId: `child-${i}`,
        relationshipQuality: "strong_and_trusting",
        childFeelsListenedTo: true,
        childTrustsKeyWorker: true,
        consistencyRating: 10,
        keyWorkerChanges: 0,
      }),
    );
    const contributions = Array.from({ length: 3 }, (_, i) =>
      makeContribution({
        id: `cp-${i}`,
        childId: `child-${i}`,
        carePlanInput: "comprehensive",
        reviewsAttended: 4,
        reviewsMissed: 0,
        reportsTimely: true,
        childViewsRepresented: true,
        outcomesFocused: true,
      }),
    );
    const development = Array.from({ length: 3 }, (_, i) =>
      makeDevelopment({
        id: `d-${i}`,
        keyWorkerId: `kw-${i}`,
        trainingCompleted: ["A", "B"],
        supervisionRegular: true,
        reflectivePractice: true,
        caseloadCount: 3,
        peerSupportAccessed: true,
      }),
    );
    const result = generateKeyWorkingEffectivenessIntelligence(
      sessions, relationships, contributions, development,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("generates areas about no sessions when sessions empty", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      [], [makeRelationship()], [makeContribution()], [makeDevelopment()],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No key work sessions"))).toBe(true);
  });

  it("generates areas about no relationships when relationships empty", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      [makeSession()], [], [makeContribution()], [makeDevelopment()],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No key worker relationships"))).toBe(true);
  });

  it("generates areas about no contributions when contributions empty", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      [makeSession()], [makeRelationship()], [], [makeDevelopment()],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No care plan contributions"))).toBe(true);
  });

  it("generates areas about no development when development empty", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      [makeSession()], [makeRelationship()], [makeContribution()], [],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No key worker development"))).toBe(true);
  });

  it("sessionEffectiveness result is populated", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.sessionEffectiveness.totalSessions).toBe(5);
    expect(result.sessionEffectiveness.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.sessionEffectiveness.overallScore).toBeLessThanOrEqual(25);
  });

  it("relationshipQuality result is populated", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.relationshipQuality.totalRelationships).toBe(3);
    expect(result.relationshipQuality.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.relationshipQuality.overallScore).toBeLessThanOrEqual(25);
  });

  it("carePlanIntegration result is populated", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.carePlanIntegration.totalContributions).toBe(3);
    expect(result.carePlanIntegration.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.carePlanIntegration.overallScore).toBeLessThanOrEqual(25);
  });

  it("professionalDevelopment result is populated", () => {
    const result = generateKeyWorkingEffectivenessIntelligence(
      SESSIONS, RELATIONSHIPS, CONTRIBUTIONS, DEVELOPMENT,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.professionalDevelopment.totalKeyWorkers).toBe(3);
    expect(result.professionalDevelopment.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.professionalDevelopment.overallScore).toBeLessThanOrEqual(25);
  });
});
