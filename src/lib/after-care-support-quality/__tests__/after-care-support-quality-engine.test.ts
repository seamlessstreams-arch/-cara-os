import { describe, it, expect } from "vitest";
import {
  evaluateAfterCareSupportQuality,
  evaluateAfterCareSupportCompliance,
  evaluateAfterCareSupportPolicy,
  evaluateStaffAfterCareReadiness,
  buildChildAfterCareProfiles,
  generateAfterCareSupportQualityIntelligence,
  pct,
  getRating,
  getSupportTypeLabel,
  getEngagementLevelLabel,
  getRatingLabel,
} from "../after-care-support-quality-engine";
import type {
  AfterCareSession,
  AfterCarePolicy,
  StaffAfterCareTraining,
} from "../after-care-support-quality-engine";

// ── Factory Helpers ─────────────────────────────────────────────────────────

let _sessionId = 0;
function makeSession(overrides: Partial<AfterCareSession> = {}): AfterCareSession {
  _sessionId++;
  return {
    id: `acs-${_sessionId}`,
    childId: "child-alex",
    childName: "Alex",
    sessionDate: "2026-03-15",
    supportType: "housing_support",
    engagementLevel: "engaged",
    needsAssessed: true,
    goalsSet: true,
    progressTracked: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
    ...overrides,
  };
}

let _policyId = 0;
function makePolicy(overrides: Partial<AfterCarePolicy> = {}): AfterCarePolicy {
  _policyId++;
  return {
    id: `pol-${_policyId}`,
    leavingCareStrategy: true,
    pathwayPlanFramework: true,
    housingProtocol: true,
    educationEmploymentPlan: true,
    healthAndWellbeingContinuity: true,
    financialSupportGuidance: true,
    regularReview: true,
    ...overrides,
  };
}

let _trainingId = 0;
function makeTraining(overrides: Partial<StaffAfterCareTraining> = {}): StaffAfterCareTraining {
  _trainingId++;
  return {
    id: `tr-${_trainingId}`,
    staffId: `staff-${_trainingId}`,
    staffName: `Staff ${_trainingId}`,
    leavingCareKnowledge: true,
    pathwayPlanning: true,
    housingAdvice: true,
    employmentSupport: true,
    benefitsAndFinance: true,
    emotionalResilience: true,
    ...overrides,
  };
}

// ── pct() ───────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ── getRating() ─────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ── Label functions ─────────────────────────────────────────────────────────

describe("label functions", () => {
  it("returns all support type labels", () => {
    expect(getSupportTypeLabel("housing_support")).toBe("Housing Support");
    expect(getSupportTypeLabel("employment_guidance")).toBe("Employment Guidance");
    expect(getSupportTypeLabel("education_continuation")).toBe("Education Continuation");
    expect(getSupportTypeLabel("financial_advice")).toBe("Financial Advice");
    expect(getSupportTypeLabel("emotional_wellbeing")).toBe("Emotional Wellbeing");
    expect(getSupportTypeLabel("health_access")).toBe("Health Access");
    expect(getSupportTypeLabel("social_network")).toBe("Social Network");
    expect(getSupportTypeLabel("practical_skills")).toBe("Practical Skills");
  });

  it("returns all engagement level labels", () => {
    expect(getEngagementLevelLabel("highly_engaged")).toBe("Highly Engaged");
    expect(getEngagementLevelLabel("engaged")).toBe("Engaged");
    expect(getEngagementLevelLabel("moderate")).toBe("Moderate");
    expect(getEngagementLevelLabel("minimal")).toBe("Minimal");
    expect(getEngagementLevelLabel("disengaged")).toBe("Disengaged");
  });

  it("returns all rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateAfterCareSupportQuality ─────────────────────────────────────────

describe("evaluateAfterCareSupportQuality", () => {
  it("returns 0 for empty sessions", () => {
    const result = evaluateAfterCareSupportQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.engagementRate).toBe(0);
    expect(result.needsAssessedRate).toBe(0);
    expect(result.goalsSetRate).toBe(0);
    expect(result.progressRate).toBe(0);
  });

  it("scores high for fully engaged sessions with all flags", () => {
    const sessions = [
      makeSession({ engagementLevel: "highly_engaged" }),
      makeSession({ engagementLevel: "engaged" }),
    ];
    const result = evaluateAfterCareSupportQuality(sessions);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.engagementRate).toBe(100);
    expect(result.needsAssessedRate).toBe(100);
    expect(result.goalsSetRate).toBe(100);
    expect(result.progressRate).toBe(100);
  });

  it("counts engaged and highly_engaged for engagement rate", () => {
    const sessions = [
      makeSession({ engagementLevel: "highly_engaged" }),
      makeSession({ engagementLevel: "engaged" }),
      makeSession({ engagementLevel: "moderate" }),
      makeSession({ engagementLevel: "minimal" }),
      makeSession({ engagementLevel: "disengaged" }),
    ];
    const result = evaluateAfterCareSupportQuality(sessions);
    expect(result.engagementRate).toBe(40);
  });

  it("calculates needs assessed rate", () => {
    const sessions = [
      makeSession({ needsAssessed: true }),
      makeSession({ needsAssessed: false }),
      makeSession({ needsAssessed: true }),
    ];
    const result = evaluateAfterCareSupportQuality(sessions);
    expect(result.needsAssessedRate).toBe(67);
  });

  it("calculates goals set rate", () => {
    const sessions = [
      makeSession({ goalsSet: true }),
      makeSession({ goalsSet: false }),
    ];
    const result = evaluateAfterCareSupportQuality(sessions);
    expect(result.goalsSetRate).toBe(50);
  });

  it("calculates progress tracked rate", () => {
    const sessions = [
      makeSession({ progressTracked: true }),
      makeSession({ progressTracked: false }),
      makeSession({ progressTracked: false }),
    ];
    const result = evaluateAfterCareSupportQuality(sessions);
    expect(result.progressRate).toBe(33);
  });

  it("score capped at 25", () => {
    const sessions = Array.from({ length: 10 }, () =>
      makeSession({ engagementLevel: "highly_engaged" }),
    );
    const result = evaluateAfterCareSupportQuality(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores low when all flags are false", () => {
    const sessions = [
      makeSession({
        engagementLevel: "disengaged",
        needsAssessed: false,
        goalsSet: false,
        progressTracked: false,
      }),
    ];
    const result = evaluateAfterCareSupportQuality(sessions);
    expect(result.overallScore).toBe(0);
  });

  it("counts total sessions correctly", () => {
    const sessions = [makeSession(), makeSession(), makeSession()];
    const result = evaluateAfterCareSupportQuality(sessions);
    expect(result.totalSessions).toBe(3);
  });
});

// ── evaluateAfterCareSupportCompliance ───────────────────────────────────────

describe("evaluateAfterCareSupportCompliance", () => {
  it("returns 0 for empty sessions", () => {
    const result = evaluateAfterCareSupportCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
    expect(result.supportTypeDiversityRatio).toBe(0);
  });

  it("scores high for fully compliant sessions", () => {
    const sessions = [makeSession(), makeSession()];
    const result = evaluateAfterCareSupportCompliance(sessions);
    expect(result.overallScore).toBeGreaterThanOrEqual(15);
    expect(result.documentedRate).toBe(100);
    expect(result.staffSupportedRate).toBe(100);
    expect(result.feedbackRate).toBe(100);
  });

  it("calculates documented rate", () => {
    const sessions = [
      makeSession({ documentedInPlan: true }),
      makeSession({ documentedInPlan: false }),
      makeSession({ documentedInPlan: true }),
    ];
    const result = evaluateAfterCareSupportCompliance(sessions);
    expect(result.documentedRate).toBe(67);
  });

  it("calculates staff supported rate", () => {
    const sessions = [
      makeSession({ staffSupported: true }),
      makeSession({ staffSupported: false }),
    ];
    const result = evaluateAfterCareSupportCompliance(sessions);
    expect(result.staffSupportedRate).toBe(50);
  });

  it("calculates feedback rate", () => {
    const sessions = [
      makeSession({ feedbackGiven: true }),
      makeSession({ feedbackGiven: false }),
      makeSession({ feedbackGiven: false }),
    ];
    const result = evaluateAfterCareSupportCompliance(sessions);
    expect(result.feedbackRate).toBe(33);
  });

  it("calculates support type diversity ratio", () => {
    const sessions = [
      makeSession({ supportType: "housing_support" }),
      makeSession({ supportType: "employment_guidance" }),
      makeSession({ supportType: "education_continuation" }),
      makeSession({ supportType: "financial_advice" }),
    ];
    const result = evaluateAfterCareSupportCompliance(sessions);
    expect(result.supportTypeDiversityRatio).toBe(50);
  });

  it("max diversity ratio with all 8 types", () => {
    const types: AfterCareSession["supportType"][] = [
      "housing_support", "employment_guidance", "education_continuation",
      "financial_advice", "emotional_wellbeing", "health_access",
      "social_network", "practical_skills",
    ];
    const sessions = types.map((t) => makeSession({ supportType: t }));
    const result = evaluateAfterCareSupportCompliance(sessions);
    expect(result.supportTypeDiversityRatio).toBe(100);
  });

  it("score capped at 25", () => {
    const types: AfterCareSession["supportType"][] = [
      "housing_support", "employment_guidance", "education_continuation",
      "financial_advice", "emotional_wellbeing", "health_access",
      "social_network", "practical_skills",
    ];
    const sessions = types.map((t) => makeSession({ supportType: t }));
    const result = evaluateAfterCareSupportCompliance(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores low when all compliance flags are false", () => {
    const sessions = [
      makeSession({
        documentedInPlan: false,
        staffSupported: false,
        feedbackGiven: false,
      }),
    ];
    const result = evaluateAfterCareSupportCompliance(sessions);
    expect(result.documentedRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
  });
});

// ── evaluateAfterCareSupportPolicy ──────────────────────────────────────────

describe("evaluateAfterCareSupportPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateAfterCareSupportPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.leavingCareStrategy).toBe(false);
    expect(result.pathwayPlanFramework).toBe(false);
    expect(result.housingProtocol).toBe(false);
    expect(result.educationEmploymentPlan).toBe(false);
    expect(result.healthAndWellbeingContinuity).toBe(false);
    expect(result.financialSupportGuidance).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("scores 25 for fully compliant policy", () => {
    const result = evaluateAfterCareSupportPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("mirrors each policy boolean", () => {
    const policy = makePolicy({
      leavingCareStrategy: true,
      pathwayPlanFramework: false,
      housingProtocol: true,
      educationEmploymentPlan: false,
      healthAndWellbeingContinuity: true,
      financialSupportGuidance: false,
      regularReview: true,
    });
    const result = evaluateAfterCareSupportPolicy(policy);
    expect(result.leavingCareStrategy).toBe(true);
    expect(result.pathwayPlanFramework).toBe(false);
    expect(result.housingProtocol).toBe(true);
    expect(result.educationEmploymentPlan).toBe(false);
    expect(result.healthAndWellbeingContinuity).toBe(true);
    expect(result.financialSupportGuidance).toBe(false);
    expect(result.regularReview).toBe(true);
  });

  it("scores 4 for leavingCareStrategy only", () => {
    const result = evaluateAfterCareSupportPolicy(makePolicy({
      leavingCareStrategy: true,
      pathwayPlanFramework: false,
      housingProtocol: false,
      educationEmploymentPlan: false,
      healthAndWellbeingContinuity: false,
      financialSupportGuidance: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores 4 for pathwayPlanFramework only", () => {
    const result = evaluateAfterCareSupportPolicy(makePolicy({
      leavingCareStrategy: false,
      pathwayPlanFramework: true,
      housingProtocol: false,
      educationEmploymentPlan: false,
      healthAndWellbeingContinuity: false,
      financialSupportGuidance: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores 3 for regularReview only", () => {
    const result = evaluateAfterCareSupportPolicy(makePolicy({
      leavingCareStrategy: false,
      pathwayPlanFramework: false,
      housingProtocol: false,
      educationEmploymentPlan: false,
      healthAndWellbeingContinuity: false,
      financialSupportGuidance: false,
      regularReview: true,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("scores 0 for all false policy", () => {
    const result = evaluateAfterCareSupportPolicy(makePolicy({
      leavingCareStrategy: false,
      pathwayPlanFramework: false,
      housingProtocol: false,
      educationEmploymentPlan: false,
      healthAndWellbeingContinuity: false,
      financialSupportGuidance: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("score capped at 25", () => {
    const result = evaluateAfterCareSupportPolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateStaffAfterCareReadiness ─────────────────────────────────────────

describe("evaluateStaffAfterCareReadiness", () => {
  it("returns 0 for empty training array", () => {
    const result = evaluateStaffAfterCareReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.leavingCareKnowledgeRate).toBe(0);
    expect(result.pathwayPlanningRate).toBe(0);
    expect(result.housingAdviceRate).toBe(0);
    expect(result.employmentSupportRate).toBe(0);
    expect(result.benefitsAndFinanceRate).toBe(0);
    expect(result.emotionalResilienceRate).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const training = [makeTraining(), makeTraining()];
    const result = evaluateStaffAfterCareReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.leavingCareKnowledgeRate).toBe(100);
    expect(result.pathwayPlanningRate).toBe(100);
  });

  it("calculates leaving care knowledge rate", () => {
    const training = [
      makeTraining({ leavingCareKnowledge: true }),
      makeTraining({ leavingCareKnowledge: false }),
      makeTraining({ leavingCareKnowledge: true }),
    ];
    const result = evaluateStaffAfterCareReadiness(training);
    expect(result.leavingCareKnowledgeRate).toBe(67);
  });

  it("calculates pathway planning rate", () => {
    const training = [
      makeTraining({ pathwayPlanning: true }),
      makeTraining({ pathwayPlanning: false }),
    ];
    const result = evaluateStaffAfterCareReadiness(training);
    expect(result.pathwayPlanningRate).toBe(50);
  });

  it("calculates housing advice rate", () => {
    const training = [
      makeTraining({ housingAdvice: true }),
      makeTraining({ housingAdvice: false }),
      makeTraining({ housingAdvice: false }),
    ];
    const result = evaluateStaffAfterCareReadiness(training);
    expect(result.housingAdviceRate).toBe(33);
  });

  it("calculates employment support rate", () => {
    const training = [
      makeTraining({ employmentSupport: false }),
      makeTraining({ employmentSupport: true }),
    ];
    const result = evaluateStaffAfterCareReadiness(training);
    expect(result.employmentSupportRate).toBe(50);
  });

  it("calculates benefits and finance rate", () => {
    const training = [
      makeTraining({ benefitsAndFinance: true }),
      makeTraining({ benefitsAndFinance: true }),
      makeTraining({ benefitsAndFinance: false }),
    ];
    const result = evaluateStaffAfterCareReadiness(training);
    expect(result.benefitsAndFinanceRate).toBe(67);
  });

  it("calculates emotional resilience rate", () => {
    const training = [
      makeTraining({ emotionalResilience: false }),
      makeTraining({ emotionalResilience: false }),
    ];
    const result = evaluateStaffAfterCareReadiness(training);
    expect(result.emotionalResilienceRate).toBe(0);
  });

  it("counts total staff", () => {
    const training = [makeTraining(), makeTraining(), makeTraining()];
    const result = evaluateStaffAfterCareReadiness(training);
    expect(result.totalStaff).toBe(3);
  });

  it("score capped at 25", () => {
    const training = [makeTraining(), makeTraining()];
    const result = evaluateStaffAfterCareReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores 0 when all training flags are false", () => {
    const training = [
      makeTraining({
        leavingCareKnowledge: false,
        pathwayPlanning: false,
        housingAdvice: false,
        employmentSupport: false,
        benefitsAndFinance: false,
        emotionalResilience: false,
      }),
    ];
    const result = evaluateStaffAfterCareReadiness(training);
    expect(result.overallScore).toBe(0);
  });
});

// ── buildChildAfterCareProfiles ─────────────────────────────────────────────

describe("buildChildAfterCareProfiles", () => {
  it("returns empty for no sessions", () => {
    expect(buildChildAfterCareProfiles([])).toEqual([]);
  });

  it("creates one profile per child", () => {
    const sessions = [
      makeSession({ childId: "child-alex", childName: "Alex" }),
      makeSession({ childId: "child-alex", childName: "Alex" }),
      makeSession({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildAfterCareProfiles(sessions);
    expect(profiles).toHaveLength(2);
  });

  it("counts total sessions per child", () => {
    const sessions = [
      makeSession({ childId: "child-alex" }),
      makeSession({ childId: "child-alex" }),
      makeSession({ childId: "child-alex" }),
    ];
    const profiles = buildChildAfterCareProfiles(sessions);
    expect(profiles[0].totalSessions).toBe(3);
  });

  it("calculates engagement rate per child", () => {
    const sessions = [
      makeSession({ childId: "child-alex", engagementLevel: "highly_engaged" }),
      makeSession({ childId: "child-alex", engagementLevel: "disengaged" }),
    ];
    const profiles = buildChildAfterCareProfiles(sessions);
    expect(profiles[0].engagementRate).toBe(50);
  });

  it("calculates goals rate per child", () => {
    const sessions = [
      makeSession({ childId: "child-alex", goalsSet: true }),
      makeSession({ childId: "child-alex", goalsSet: false }),
      makeSession({ childId: "child-alex", goalsSet: true }),
    ];
    const profiles = buildChildAfterCareProfiles(sessions);
    expect(profiles[0].goalsRate).toBe(67);
  });

  it("scores high for many sessions with high engagement and goals", () => {
    const sessions = Array.from({ length: 10 }, () =>
      makeSession({
        childId: "child-alex",
        engagementLevel: "highly_engaged",
        goalsSet: true,
        supportType: "housing_support",
      }),
    ).concat([
      makeSession({ childId: "child-alex", supportType: "employment_guidance" }),
      makeSession({ childId: "child-alex", supportType: "education_continuation" }),
      makeSession({ childId: "child-alex", supportType: "financial_advice" }),
    ]);
    const profiles = buildChildAfterCareProfiles(sessions);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(8);
  });

  it("scores low for disengaged child with no goals", () => {
    const sessions = [
      makeSession({
        childId: "child-alex",
        engagementLevel: "disengaged",
        goalsSet: false,
      }),
    ];
    const profiles = buildChildAfterCareProfiles(sessions);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(1);
  });

  it("score capped at 10", () => {
    const sessions = Array.from({ length: 20 }, (_, i) =>
      makeSession({
        childId: "child-alex",
        engagementLevel: "highly_engaged",
        supportType: (["housing_support", "employment_guidance", "education_continuation", "financial_advice"] as const)[i % 4],
      }),
    );
    const profiles = buildChildAfterCareProfiles(sessions);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("gives partial score for moderate frequency", () => {
    const sessions = Array.from({ length: 5 }, () =>
      makeSession({ childId: "child-alex", engagementLevel: "disengaged", goalsSet: false }),
    );
    const profiles = buildChildAfterCareProfiles(sessions);
    // frequency=1, engagement=0, goals=0, diversity=0
    expect(profiles[0].overallScore).toBe(1);
  });

  it("gives diversity bonus for 2+ types", () => {
    const sessions = [
      makeSession({ childId: "child-alex", supportType: "housing_support", engagementLevel: "disengaged", goalsSet: false }),
      makeSession({ childId: "child-alex", supportType: "employment_guidance", engagementLevel: "disengaged", goalsSet: false }),
    ];
    const profiles = buildChildAfterCareProfiles(sessions);
    // frequency=0, engagement=0, goals=0, diversity=1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("preserves child name", () => {
    const sessions = [makeSession({ childId: "child-morgan", childName: "Morgan" })];
    const profiles = buildChildAfterCareProfiles(sessions);
    expect(profiles[0].childName).toBe("Morgan");
  });
});

// ── generateAfterCareSupportQualityIntelligence ─────────────────────────────

describe("generateAfterCareSupportQualityIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateAfterCareSupportQualityIntelligence(
      [makeSession(), makeSession()],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-20",
    );
    expect(result.overallScore).toBe(
      result.afterCareSupportQuality.overallScore +
      result.afterCareSupportCompliance.overallScore +
      result.afterCareSupportPolicy.overallScore +
      result.staffAfterCareReadiness.overallScore,
    );
  });

  it("returns inadequate with no data", () => {
    const result = generateAfterCareSupportQualityIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const types: AfterCareSession["supportType"][] = [
      "housing_support", "employment_guidance", "education_continuation",
      "financial_advice", "emotional_wellbeing", "health_access",
      "social_network", "practical_skills",
    ];
    const sessions = types.map((t) =>
      makeSession({ supportType: t, engagementLevel: "highly_engaged" }),
    );
    const result = generateAfterCareSupportQualityIntelligence(
      sessions,
      makePolicy(),
      [makeTraining(), makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-20",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("score capped at 100", () => {
    const result = generateAfterCareSupportQualityIntelligence(
      [makeSession()],
      makePolicy(),
      [makeTraining()],
      "test",
      "2026-01-01",
      "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateAfterCareSupportQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
  });

  // -- Strengths --

  it("adds strength for high engagement", () => {
    const sessions = [
      makeSession({ engagementLevel: "highly_engaged" }),
      makeSession({ engagementLevel: "engaged" }),
    ];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("engagement rate"))).toBe(true);
  });

  it("adds strength for needs assessed", () => {
    const sessions = [makeSession({ needsAssessed: true })];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Needs consistently assessed"))).toBe(true);
  });

  it("adds strength for goals set", () => {
    const sessions = [makeSession({ goalsSet: true })];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Goals set"))).toBe(true);
  });

  it("adds strength for progress tracked", () => {
    const sessions = [makeSession({ progressTracked: true })];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Progress tracked"))).toBe(true);
  });

  it("adds strength for documented sessions", () => {
    const sessions = [makeSession({ documentedInPlan: true })];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("well documented"))).toBe(true);
  });

  it("adds strength for comprehensive policy", () => {
    const result = generateAfterCareSupportQualityIntelligence(
      [], makePolicy(), [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Comprehensive after care policy"))).toBe(true);
  });

  it("adds strength for strong staff readiness", () => {
    const result = generateAfterCareSupportQualityIntelligence(
      [], null, [makeTraining(), makeTraining()], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("strong readiness"))).toBe(true);
  });

  // -- Areas for Improvement --

  it("adds area for low engagement rate", () => {
    const sessions = [makeSession({ engagementLevel: "disengaged" })];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Engagement rate"))).toBe(true);
  });

  it("adds area for low documentation", () => {
    const sessions = [makeSession({ documentedInPlan: false })];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Documentation"))).toBe(true);
  });

  it("adds area for weak policy", () => {
    const result = generateAfterCareSupportQualityIntelligence(
      [], makePolicy({
        leavingCareStrategy: false,
        pathwayPlanFramework: false,
        housingProtocol: false,
        educationEmploymentPlan: false,
        healthAndWellbeingContinuity: false,
        financialSupportGuidance: false,
        regularReview: true,
      }), [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("policy framework has significant gaps"))).toBe(true);
  });

  it("adds area for weak staff training", () => {
    const training = [makeTraining({
      leavingCareKnowledge: false,
      pathwayPlanning: false,
      housingAdvice: false,
      employmentSupport: false,
      benefitsAndFinance: false,
      emotionalResilience: false,
    })];
    const result = generateAfterCareSupportQualityIntelligence(
      [], null, training, "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Staff training"))).toBe(true);
  });

  // -- Actions --

  it("adds URGENT for no sessions", () => {
    const result = generateAfterCareSupportQualityIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("No after care support sessions"))).toBe(true);
  });

  it("adds URGENT for no policy", () => {
    const result = generateAfterCareSupportQualityIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("No after care support policy"))).toBe(true);
  });

  it("adds URGENT for no training", () => {
    const result = generateAfterCareSupportQualityIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("No staff training records"))).toBe(true);
  });

  it("adds MEDIUM for low support type diversity", () => {
    const sessions = [makeSession({ supportType: "housing_support" })];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("MEDIUM") && a.includes("Diversify"))).toBe(true);
  });

  it("adds HIGH for low engagement with sessions present", () => {
    const sessions = [makeSession({ engagementLevel: "disengaged" })];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("HIGH") && a.includes("engagement"))).toBe(true);
  });

  it("adds HIGH for low goal-setting with sessions present", () => {
    const sessions = [makeSession({ goalsSet: false })];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("HIGH") && a.includes("goal-setting"))).toBe(true);
  });

  // -- Regulatory links --

  it("includes all 7 regulatory links", () => {
    const result = generateAfterCareSupportQualityIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 9"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children (Leaving Care) Act 2000"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 13"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989 Section 24"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 27"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Keep On Caring Strategy 2016"))).toBe(true);
  });

  // -- Child profiles in orchestrator --

  it("builds child profiles from sessions", () => {
    const sessions = [
      makeSession({ childId: "child-alex", childName: "Alex" }),
      makeSession({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(2);
    expect(result.childProfiles.find((p) => p.childId === "child-alex")!.childName).toBe("Alex");
    expect(result.childProfiles.find((p) => p.childId === "child-jordan")!.childName).toBe("Jordan");
  });

  it("no duplicate child profiles", () => {
    const sessions = [
      makeSession({ childId: "child-alex" }),
      makeSession({ childId: "child-alex" }),
    ];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(1);
  });

  // -- Integration --

  it("handles realistic mixed scenario", () => {
    const sessions = [
      makeSession({ childId: "child-alex", childName: "Alex", supportType: "housing_support", engagementLevel: "highly_engaged" }),
      makeSession({ childId: "child-alex", childName: "Alex", supportType: "education_continuation", engagementLevel: "engaged" }),
      makeSession({ childId: "child-jordan", childName: "Jordan", supportType: "employment_guidance", engagementLevel: "moderate", goalsSet: false, progressTracked: false }),
      makeSession({ childId: "child-jordan", childName: "Jordan", supportType: "financial_advice", engagementLevel: "minimal", needsAssessed: false, feedbackGiven: false }),
      makeSession({ childId: "child-morgan", childName: "Morgan", supportType: "emotional_wellbeing", engagementLevel: "engaged" }),
    ];
    const result = generateAfterCareSupportQualityIntelligence(
      sessions,
      makePolicy({ regularReview: false }),
      [makeTraining(), makeTraining({ housingAdvice: false })],
      "oak-house",
      "2026-01-01",
      "2026-05-20",
    );
    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(7);
  });
});
