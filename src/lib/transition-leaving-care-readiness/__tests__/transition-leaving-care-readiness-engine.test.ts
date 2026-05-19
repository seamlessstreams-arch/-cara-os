import { describe, it, expect } from "vitest";
import {
  generateTransitionLeavingCareReadinessIntelligence, evaluateReadinessPreparation, evaluateTransitionCompliance,
  evaluateTransitionPolicy, evaluateStaffTransitionReadiness, buildChildTransitionProfiles, pct, getRating,
  getReadinessAreaLabel, getProgressLevelLabel, getRatingLabel,
} from "../transition-leaving-care-readiness-engine";
import type { TransitionAssessment, TransitionPolicy, StaffTransitionTraining } from "../transition-leaving-care-readiness-engine";

let _id = 0;
function makeAssessment(overrides: Partial<TransitionAssessment> = {}): TransitionAssessment {
  _id++;
  return { id: `ta-${_id}`, childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-01", readinessArea: "independent_living_skills", progressLevel: "on_track", pathwayPlanLinked: true, personalAdvisorInvolved: true, childVoiceCaptured: true, goalsSet: true, documentedInPlan: true, reviewScheduled: true, ...overrides };
}
function makePolicy(overrides: Partial<TransitionPolicy> = {}): TransitionPolicy {
  return { id: "tp-1", pathwayPlanningFramework: true, independenceProgramme: true, personalAdvisorAllocation: true, housingPathway: true, financialCapabilityPlan: true, healthPassportScheme: true, regularReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffTransitionTraining> = {}): StaffTransitionTraining {
  _tid++;
  return { id: `tt-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, leavingCareAct: true, pathwayPlanning: true, independencePractical: true, financialCapability: true, emotionalResilience: true, housingOptions: true, ...overrides };
}

describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(0, 0)).toBe(0); });
  it("returns 100 for equal", () => { expect(pct(5, 5)).toBe(100); });
  it("returns 0 for num=0", () => { expect(pct(0, 10)).toBe(0); });
});

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

describe("label getters", () => {
  it("getReadinessAreaLabel", () => {
    expect(getReadinessAreaLabel("independent_living_skills")).toBe("Independent Living Skills");
    expect(getReadinessAreaLabel("financial_literacy")).toBe("Financial Literacy");
    expect(getReadinessAreaLabel("education_employment")).toBe("Education & Employment");
    expect(getReadinessAreaLabel("health_management")).toBe("Health Management");
    expect(getReadinessAreaLabel("housing_planning")).toBe("Housing Planning");
    expect(getReadinessAreaLabel("social_networks")).toBe("Social Networks");
    expect(getReadinessAreaLabel("emotional_resilience")).toBe("Emotional Resilience");
    expect(getReadinessAreaLabel("identity_belonging")).toBe("Identity & Belonging");
  });
  it("getProgressLevelLabel", () => {
    expect(getProgressLevelLabel("exceeding")).toBe("Exceeding");
    expect(getProgressLevelLabel("on_track")).toBe("On Track");
    expect(getProgressLevelLabel("developing")).toBe("Developing");
    expect(getProgressLevelLabel("behind")).toBe("Behind");
    expect(getProgressLevelLabel("not_started")).toBe("Not Started");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("evaluateReadinessPreparation", () => {
  it("returns 0 for empty", () => { const r = evaluateReadinessPreparation([]); expect(r.overallScore).toBe(0); expect(r.totalAssessments).toBe(0); });
  it("scores 25 for perfect", () => { expect(evaluateReadinessPreparation(Array.from({ length: 10 }, () => makeAssessment())).overallScore).toBe(25); });
  it("counts exceeding+on_track as progress", () => {
    const assessments = [makeAssessment({ progressLevel: "exceeding" }), makeAssessment({ progressLevel: "on_track" }), makeAssessment({ progressLevel: "developing" }), makeAssessment({ progressLevel: "behind" }), makeAssessment({ progressLevel: "not_started" })];
    expect(evaluateReadinessPreparation(assessments).progressRate).toBe(40);
  });
  it("calculates pathway plan rate", () => {
    const assessments = [makeAssessment({ pathwayPlanLinked: true }), makeAssessment({ pathwayPlanLinked: false })];
    expect(evaluateReadinessPreparation(assessments).pathwayPlanRate).toBe(50);
  });
  it("calculates personal advisor rate", () => {
    const assessments = [makeAssessment({ personalAdvisorInvolved: true }), makeAssessment({ personalAdvisorInvolved: true }), makeAssessment({ personalAdvisorInvolved: false })];
    expect(evaluateReadinessPreparation(assessments).personalAdvisorRate).toBe(67);
  });
  it("calculates child voice rate", () => {
    const assessments = Array.from({ length: 4 }, () => makeAssessment({ childVoiceCaptured: true })).concat([makeAssessment({ childVoiceCaptured: false })]);
    expect(evaluateReadinessPreparation(assessments).childVoiceRate).toBe(80);
  });
  it("caps at 25", () => { expect(evaluateReadinessPreparation(Array.from({ length: 20 }, () => makeAssessment())).overallScore).toBeLessThanOrEqual(25); });
  it("scores lower with poor progress", () => {
    const good = evaluateReadinessPreparation(Array.from({ length: 5 }, () => makeAssessment()));
    const bad = evaluateReadinessPreparation(Array.from({ length: 5 }, () => makeAssessment({ progressLevel: "not_started", pathwayPlanLinked: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
});

describe("evaluateTransitionCompliance", () => {
  it("returns 0 for empty", () => { expect(evaluateTransitionCompliance([]).overallScore).toBe(0); });
  it("calculates goals set rate", () => {
    const assessments = [makeAssessment({ goalsSet: true }), makeAssessment({ goalsSet: false })];
    expect(evaluateTransitionCompliance(assessments).goalsSetRate).toBe(50);
  });
  it("calculates documented rate", () => {
    const assessments = [makeAssessment({ documentedInPlan: true }), makeAssessment({ documentedInPlan: false }), makeAssessment({ documentedInPlan: true })];
    expect(evaluateTransitionCompliance(assessments).documentedRate).toBe(67);
  });
  it("calculates review scheduled rate", () => {
    const assessments = Array.from({ length: 3 }, () => makeAssessment({ reviewScheduled: true })).concat([makeAssessment({ reviewScheduled: false })]);
    expect(evaluateTransitionCompliance(assessments).reviewScheduledRate).toBe(75);
  });
  it("calculates area diversity ratio", () => {
    const assessments = [makeAssessment({ readinessArea: "independent_living_skills" }), makeAssessment({ readinessArea: "independent_living_skills" })];
    expect(evaluateTransitionCompliance(assessments).areaDiversityRatio).toBe(13);
  });
  it("caps at 25", () => { expect(evaluateTransitionCompliance(Array.from({ length: 20 }, () => makeAssessment())).overallScore).toBeLessThanOrEqual(25); });
});

describe("evaluateTransitionPolicy", () => {
  it("returns 0 for null", () => { const r = evaluateTransitionPolicy(null); expect(r.overallScore).toBe(0); expect(r.pathwayPlanningFramework).toBe(false); });
  it("scores 25 for full policy", () => { expect(evaluateTransitionPolicy(makePolicy()).overallScore).toBe(25); });
  it("4-point items individually", () => { expect(evaluateTransitionPolicy(makePolicy({ pathwayPlanningFramework: true, independenceProgramme: false, personalAdvisorAllocation: false, housingPathway: false, financialCapabilityPlan: false, healthPassportScheme: false, regularReview: false })).overallScore).toBe(4); });
  it("3-point items individually", () => { expect(evaluateTransitionPolicy(makePolicy({ pathwayPlanningFramework: false, independenceProgramme: false, personalAdvisorAllocation: false, housingPathway: false, financialCapabilityPlan: true, healthPassportScheme: false, regularReview: false })).overallScore).toBe(3); });
  it("4-point items = 16", () => { expect(evaluateTransitionPolicy(makePolicy({ financialCapabilityPlan: false, healthPassportScheme: false, regularReview: false })).overallScore).toBe(16); });
  it("3-point items = 9", () => { expect(evaluateTransitionPolicy(makePolicy({ pathwayPlanningFramework: false, independenceProgramme: false, personalAdvisorAllocation: false, housingPathway: false })).overallScore).toBe(9); });
  it("all false = 0", () => { expect(evaluateTransitionPolicy(makePolicy({ pathwayPlanningFramework: false, independenceProgramme: false, personalAdvisorAllocation: false, housingPathway: false, financialCapabilityPlan: false, healthPassportScheme: false, regularReview: false })).overallScore).toBe(0); });
});

describe("evaluateStaffTransitionReadiness", () => {
  it("returns 0 for empty", () => { const r = evaluateStaffTransitionReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("scores 25 for fully trained", () => { expect(evaluateStaffTransitionReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25); });
  it("scores 0 for untrained", () => { expect(evaluateStaffTransitionReadiness([makeTraining({ leavingCareAct: false, pathwayPlanning: false, independencePractical: false, financialCapability: false, emotionalResilience: false, housingOptions: false })]).overallScore).toBe(0); });
  it("single fully trained = 25", () => { expect(evaluateStaffTransitionReadiness([makeTraining()]).overallScore).toBe(25); });
  it("caps at 25", () => { expect(evaluateStaffTransitionReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25); });
});

describe("buildChildTransitionProfiles", () => {
  it("returns empty for no assessments", () => { expect(buildChildTransitionProfiles([]).length).toBe(0); });
  it("groups by child", () => {
    const assessments = [makeAssessment({ childId: "c1", childName: "Alex" }), makeAssessment({ childId: "c2", childName: "Jordan" })];
    expect(buildChildTransitionProfiles(assessments).length).toBe(2);
  });
  it("calculates progress rate", () => {
    const assessments = [makeAssessment({ childId: "c1", childName: "Alex", progressLevel: "on_track" }), makeAssessment({ childId: "c1", childName: "Alex", progressLevel: "behind" })];
    expect(buildChildTransitionProfiles(assessments)[0].progressRate).toBe(50);
  });
  it("calculates pathway plan rate", () => {
    const assessments = [makeAssessment({ childId: "c1", childName: "Alex", pathwayPlanLinked: true }), makeAssessment({ childId: "c1", childName: "Alex", pathwayPlanLinked: false })];
    expect(buildChildTransitionProfiles(assessments)[0].pathwayPlanRate).toBe(50);
  });
  it("diversity bonus for 6+ areas", () => {
    const areas: TransitionAssessment["readinessArea"][] = ["independent_living_skills", "financial_literacy", "education_employment", "health_management", "housing_planning", "social_networks"];
    const assessments = areas.map((a) => makeAssessment({ childId: "c1", childName: "Alex", readinessArea: a }));
    const profile = buildChildTransitionProfiles(assessments)[0];
    expect(profile.overallScore).toBeGreaterThanOrEqual(7);
  });
  it("caps at 10", () => {
    const assessments = Array.from({ length: 15 }, () => makeAssessment({ childId: "c1", childName: "Alex" }));
    expect(buildChildTransitionProfiles(assessments)[0].overallScore).toBeLessThanOrEqual(10);
  });
});

describe("generateTransitionLeavingCareReadinessIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-19" };

  it("returns inadequate for empty", () => {
    const r = generateTransitionLeavingCareReadinessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const areas: TransitionAssessment["readinessArea"][] = ["independent_living_skills", "financial_literacy", "education_employment", "health_management", "housing_planning", "social_networks", "emotional_resilience", "identity_belonging"];
    const assessments = Array.from({ length: 10 }, (_, i) => makeAssessment({ readinessArea: areas[i % 8] }));
    const r = generateTransitionLeavingCareReadinessIntelligence(assessments, makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const areas: TransitionAssessment["readinessArea"][] = ["independent_living_skills", "financial_literacy", "education_employment", "health_management", "housing_planning", "social_networks", "emotional_resilience", "identity_belonging"];
    const r = generateTransitionLeavingCareReadinessIntelligence(Array.from({ length: 20 }, (_, i) => makeAssessment({ readinessArea: areas[i % 8] })), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generateTransitionLeavingCareReadinessIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test"); expect(r.periodStart).toBe("2026-01-01");
  });
  it("generates strength for high progress", () => {
    const r = generateTransitionLeavingCareReadinessIntelligence(Array.from({ length: 5 }, () => makeAssessment()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("readiness"))).toBe(true);
  });
  it("generates strength for high child voice", () => {
    const r = generateTransitionLeavingCareReadinessIntelligence(Array.from({ length: 5 }, () => makeAssessment()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("voices"))).toBe(true);
  });
  it("generates action for no assessments", () => {
    const r = generateTransitionLeavingCareReadinessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No transition assessment records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generateTransitionLeavingCareReadinessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generateTransitionLeavingCareReadinessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generateTransitionLeavingCareReadinessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("Leaving Care"))).toBe(true);
  });
  it("good rating for ~75", () => {
    const r = generateTransitionLeavingCareReadinessIntelligence(Array.from({ length: 5 }, () => makeAssessment()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.rating).toBe("good");
  });
});
