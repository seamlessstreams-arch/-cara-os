import { describe, it, expect } from "vitest";
import {
  generateIndependentLivingSkillsIntelligence, evaluateLivingSkillsQuality, evaluateLivingSkillsCompliance,
  evaluateLivingSkillsPolicy, evaluateStaffLivingSkillsReadiness, buildChildLivingSkillsProfiles, pct, getRating,
  getSkillTypeLabel, getCompetencyLevelLabel, getRatingLabel,
} from "../independent-living-skills-engine";
import type { SkillsSession, LivingSkillsPolicy, StaffLivingSkillsTraining } from "../independent-living-skills-engine";

let _id = 0;
function makeSession(overrides: Partial<SkillsSession> = {}): SkillsSession {
  _id++;
  return { id: `ss-${_id}`, childId: "child-alex", childName: "Alex", sessionDate: "2026-04-01", skillType: "cooking_meal_prep", competencyLevel: "independent", childEngaged: true, progressMade: true, confidenceBuilt: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true, ...overrides };
}
function makePolicy(overrides: Partial<LivingSkillsPolicy> = {}): LivingSkillsPolicy {
  return { id: "lp-1", independenceStrategy: true, skillsDevelopmentPlan: true, ageAppropriateFramework: true, riskAssessmentProcess: true, pathwayPlanIntegration: true, communityAccessPolicy: true, regularReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffLivingSkillsTraining> = {}): StaffLivingSkillsTraining {
  _tid++;
  return { id: `st-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, independencePromotion: true, practicalSkillsTeaching: true, riskEnablement: true, pathwayPlanning: true, communityAccess: true, motivationalApproaches: true, ...overrides };
}

// ── pct ──────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(0, 0)).toBe(0); });
  it("returns 100 for equal", () => { expect(pct(5, 5)).toBe(100); });
  it("returns 0 for num=0", () => { expect(pct(0, 10)).toBe(0); });
  it("rounds correctly", () => { expect(pct(1, 3)).toBe(33); });
});

// ── getRating ────────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ── label getters ────────────────────────────────────────────────────────────

describe("label getters", () => {
  it("getSkillTypeLabel returns all labels", () => {
    expect(getSkillTypeLabel("cooking_meal_prep")).toBe("Cooking & Meal Prep");
    expect(getSkillTypeLabel("cleaning_tidying")).toBe("Cleaning & Tidying");
    expect(getSkillTypeLabel("laundry_clothing_care")).toBe("Laundry & Clothing Care");
    expect(getSkillTypeLabel("budgeting_money")).toBe("Budgeting & Money");
    expect(getSkillTypeLabel("personal_hygiene")).toBe("Personal Hygiene");
    expect(getSkillTypeLabel("shopping_errands")).toBe("Shopping & Errands");
    expect(getSkillTypeLabel("travel_navigation")).toBe("Travel & Navigation");
    expect(getSkillTypeLabel("home_maintenance")).toBe("Home Maintenance");
  });
  it("getCompetencyLevelLabel returns all labels", () => {
    expect(getCompetencyLevelLabel("independent")).toBe("Independent");
    expect(getCompetencyLevelLabel("mostly_independent")).toBe("Mostly Independent");
    expect(getCompetencyLevelLabel("developing")).toBe("Developing");
    expect(getCompetencyLevelLabel("requires_support")).toBe("Requires Support");
    expect(getCompetencyLevelLabel("not_started")).toBe("Not Started");
  });
  it("getRatingLabel returns labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateLivingSkillsQuality ──────────────────────────────────────────────

describe("evaluateLivingSkillsQuality", () => {
  it("returns 0 for empty", () => {
    const r = evaluateLivingSkillsQuality([]);
    expect(r.overallScore).toBe(0); expect(r.totalSessions).toBe(0);
    expect(r.competencyRate).toBe(0); expect(r.engagementRate).toBe(0);
    expect(r.progressRate).toBe(0); expect(r.confidenceRate).toBe(0);
  });
  it("scores 25 for perfect", () => {
    expect(evaluateLivingSkillsQuality(Array.from({ length: 10 }, () => makeSession())).overallScore).toBe(25);
  });
  it("counts independent+mostly_independent as competent", () => {
    const sessions = [
      makeSession({ competencyLevel: "independent" }),
      makeSession({ competencyLevel: "mostly_independent" }),
      makeSession({ competencyLevel: "developing" }),
      makeSession({ competencyLevel: "requires_support" }),
      makeSession({ competencyLevel: "not_started" }),
    ];
    expect(evaluateLivingSkillsQuality(sessions).competencyRate).toBe(40);
  });
  it("calculates engagement rate", () => {
    const sessions = [makeSession({ childEngaged: true }), makeSession({ childEngaged: false })];
    expect(evaluateLivingSkillsQuality(sessions).engagementRate).toBe(50);
  });
  it("calculates progress rate", () => {
    const sessions = [makeSession({ progressMade: true }), makeSession({ progressMade: true }), makeSession({ progressMade: false })];
    expect(evaluateLivingSkillsQuality(sessions).progressRate).toBe(67);
  });
  it("calculates confidence rate", () => {
    const sessions = Array.from({ length: 4 }, () => makeSession({ confidenceBuilt: true })).concat([makeSession({ confidenceBuilt: false })]);
    expect(evaluateLivingSkillsQuality(sessions).confidenceRate).toBe(80);
  });
  it("caps at 25", () => {
    expect(evaluateLivingSkillsQuality(Array.from({ length: 20 }, () => makeSession())).overallScore).toBeLessThanOrEqual(25);
  });
  it("scores lower with poor competency", () => {
    const good = evaluateLivingSkillsQuality(Array.from({ length: 5 }, () => makeSession()));
    const bad = evaluateLivingSkillsQuality(Array.from({ length: 5 }, () => makeSession({ competencyLevel: "not_started", childEngaged: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
  it("returns total sessions count", () => {
    expect(evaluateLivingSkillsQuality(Array.from({ length: 7 }, () => makeSession())).totalSessions).toBe(7);
  });
});

// ── evaluateLivingSkillsCompliance ───────────────────────────────────────────

describe("evaluateLivingSkillsCompliance", () => {
  it("returns 0 for empty", () => {
    const r = evaluateLivingSkillsCompliance([]);
    expect(r.overallScore).toBe(0); expect(r.documentedRate).toBe(0);
    expect(r.staffSupportedRate).toBe(0); expect(r.feedbackRate).toBe(0);
    expect(r.skillTypeDiversityRatio).toBe(0);
  });
  it("calculates documented rate", () => {
    const sessions = [makeSession({ documentedInPlan: true }), makeSession({ documentedInPlan: false })];
    expect(evaluateLivingSkillsCompliance(sessions).documentedRate).toBe(50);
  });
  it("calculates staff supported rate", () => {
    const sessions = [makeSession({ staffSupported: true }), makeSession({ staffSupported: false }), makeSession({ staffSupported: true })];
    expect(evaluateLivingSkillsCompliance(sessions).staffSupportedRate).toBe(67);
  });
  it("calculates feedback rate", () => {
    const sessions = Array.from({ length: 3 }, () => makeSession({ feedbackGiven: true })).concat([makeSession({ feedbackGiven: false })]);
    expect(evaluateLivingSkillsCompliance(sessions).feedbackRate).toBe(75);
  });
  it("calculates skill type diversity ratio", () => {
    const sessions = [makeSession({ skillType: "cooking_meal_prep" }), makeSession({ skillType: "cooking_meal_prep" })];
    expect(evaluateLivingSkillsCompliance(sessions).skillTypeDiversityRatio).toBe(13);
  });
  it("full diversity scores higher", () => {
    const types: SkillsSession["skillType"][] = ["cooking_meal_prep", "cleaning_tidying", "laundry_clothing_care", "budgeting_money", "personal_hygiene", "shopping_errands", "travel_navigation", "home_maintenance"];
    const sessions = types.map((t) => makeSession({ skillType: t }));
    expect(evaluateLivingSkillsCompliance(sessions).skillTypeDiversityRatio).toBe(100);
  });
  it("caps at 25", () => {
    expect(evaluateLivingSkillsCompliance(Array.from({ length: 20 }, () => makeSession())).overallScore).toBeLessThanOrEqual(25);
  });
  it("scores 25 for perfect compliance with diversity", () => {
    const types: SkillsSession["skillType"][] = ["cooking_meal_prep", "cleaning_tidying", "laundry_clothing_care", "budgeting_money", "personal_hygiene", "shopping_errands", "travel_navigation", "home_maintenance"];
    const sessions = types.map((t) => makeSession({ skillType: t }));
    expect(evaluateLivingSkillsCompliance(sessions).overallScore).toBe(25);
  });
});

// ── evaluateLivingSkillsPolicy ───────────────────────────────────────────────

describe("evaluateLivingSkillsPolicy", () => {
  it("returns 0 for null", () => {
    const r = evaluateLivingSkillsPolicy(null);
    expect(r.overallScore).toBe(0); expect(r.independenceStrategy).toBe(false);
    expect(r.skillsDevelopmentPlan).toBe(false); expect(r.ageAppropriateFramework).toBe(false);
    expect(r.riskAssessmentProcess).toBe(false); expect(r.pathwayPlanIntegration).toBe(false);
    expect(r.communityAccessPolicy).toBe(false); expect(r.regularReview).toBe(false);
  });
  it("scores 25 for full policy", () => {
    expect(evaluateLivingSkillsPolicy(makePolicy()).overallScore).toBe(25);
  });
  it("4-point items individually — independenceStrategy", () => {
    expect(evaluateLivingSkillsPolicy(makePolicy({ independenceStrategy: true, skillsDevelopmentPlan: false, ageAppropriateFramework: false, riskAssessmentProcess: false, pathwayPlanIntegration: false, communityAccessPolicy: false, regularReview: false })).overallScore).toBe(4);
  });
  it("4-point items individually — skillsDevelopmentPlan", () => {
    expect(evaluateLivingSkillsPolicy(makePolicy({ independenceStrategy: false, skillsDevelopmentPlan: true, ageAppropriateFramework: false, riskAssessmentProcess: false, pathwayPlanIntegration: false, communityAccessPolicy: false, regularReview: false })).overallScore).toBe(4);
  });
  it("3-point items individually — pathwayPlanIntegration", () => {
    expect(evaluateLivingSkillsPolicy(makePolicy({ independenceStrategy: false, skillsDevelopmentPlan: false, ageAppropriateFramework: false, riskAssessmentProcess: false, pathwayPlanIntegration: true, communityAccessPolicy: false, regularReview: false })).overallScore).toBe(3);
  });
  it("3-point items individually — communityAccessPolicy", () => {
    expect(evaluateLivingSkillsPolicy(makePolicy({ independenceStrategy: false, skillsDevelopmentPlan: false, ageAppropriateFramework: false, riskAssessmentProcess: false, pathwayPlanIntegration: false, communityAccessPolicy: true, regularReview: false })).overallScore).toBe(3);
  });
  it("3-point items individually — regularReview", () => {
    expect(evaluateLivingSkillsPolicy(makePolicy({ independenceStrategy: false, skillsDevelopmentPlan: false, ageAppropriateFramework: false, riskAssessmentProcess: false, pathwayPlanIntegration: false, communityAccessPolicy: false, regularReview: true })).overallScore).toBe(3);
  });
  it("4-point items combined = 16", () => {
    expect(evaluateLivingSkillsPolicy(makePolicy({ pathwayPlanIntegration: false, communityAccessPolicy: false, regularReview: false })).overallScore).toBe(16);
  });
  it("3-point items combined = 9", () => {
    expect(evaluateLivingSkillsPolicy(makePolicy({ independenceStrategy: false, skillsDevelopmentPlan: false, ageAppropriateFramework: false, riskAssessmentProcess: false })).overallScore).toBe(9);
  });
  it("all false = 0", () => {
    expect(evaluateLivingSkillsPolicy(makePolicy({ independenceStrategy: false, skillsDevelopmentPlan: false, ageAppropriateFramework: false, riskAssessmentProcess: false, pathwayPlanIntegration: false, communityAccessPolicy: false, regularReview: false })).overallScore).toBe(0);
  });
  it("reflects boolean values on result", () => {
    const r = evaluateLivingSkillsPolicy(makePolicy({ independenceStrategy: true, skillsDevelopmentPlan: false }));
    expect(r.independenceStrategy).toBe(true);
    expect(r.skillsDevelopmentPlan).toBe(false);
  });
});

// ── evaluateStaffLivingSkillsReadiness ───────────────────────────────────────

describe("evaluateStaffLivingSkillsReadiness", () => {
  it("returns 0 for empty", () => {
    const r = evaluateStaffLivingSkillsReadiness([]);
    expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0);
    expect(r.independencePromotionRate).toBe(0); expect(r.practicalSkillsTeachingRate).toBe(0);
  });
  it("scores 25 for fully trained", () => {
    expect(evaluateStaffLivingSkillsReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25);
  });
  it("scores 0 for untrained", () => {
    expect(evaluateStaffLivingSkillsReadiness([makeTraining({ independencePromotion: false, practicalSkillsTeaching: false, riskEnablement: false, pathwayPlanning: false, communityAccess: false, motivationalApproaches: false })]).overallScore).toBe(0);
  });
  it("single fully trained = 25", () => {
    expect(evaluateStaffLivingSkillsReadiness([makeTraining()]).overallScore).toBe(25);
  });
  it("caps at 25", () => {
    expect(evaluateStaffLivingSkillsReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25);
  });
  it("returns totalStaff count", () => {
    expect(evaluateStaffLivingSkillsReadiness(Array.from({ length: 3 }, () => makeTraining())).totalStaff).toBe(3);
  });
  it("calculates individual skill rates", () => {
    const t = [makeTraining({ independencePromotion: true, practicalSkillsTeaching: false }), makeTraining({ independencePromotion: false, practicalSkillsTeaching: true })];
    const r = evaluateStaffLivingSkillsReadiness(t);
    expect(r.independencePromotionRate).toBe(50);
    expect(r.practicalSkillsTeachingRate).toBe(50);
  });
  it("weight 6 for independence promotion", () => {
    const only = [makeTraining({ independencePromotion: true, practicalSkillsTeaching: false, riskEnablement: false, pathwayPlanning: false, communityAccess: false, motivationalApproaches: false })];
    expect(evaluateStaffLivingSkillsReadiness(only).overallScore).toBe(6);
  });
  it("weight 5 for practical skills teaching", () => {
    const only = [makeTraining({ independencePromotion: false, practicalSkillsTeaching: true, riskEnablement: false, pathwayPlanning: false, communityAccess: false, motivationalApproaches: false })];
    expect(evaluateStaffLivingSkillsReadiness(only).overallScore).toBe(5);
  });
  it("weight 2 for motivational approaches", () => {
    const only = [makeTraining({ independencePromotion: false, practicalSkillsTeaching: false, riskEnablement: false, pathwayPlanning: false, communityAccess: false, motivationalApproaches: true })];
    expect(evaluateStaffLivingSkillsReadiness(only).overallScore).toBe(2);
  });
});

// ── buildChildLivingSkillsProfiles ───────────────────────────────────────────

describe("buildChildLivingSkillsProfiles", () => {
  it("returns empty for no sessions", () => { expect(buildChildLivingSkillsProfiles([]).length).toBe(0); });
  it("groups by child", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex" }), makeSession({ childId: "c2", childName: "Jordan" })];
    expect(buildChildLivingSkillsProfiles(sessions).length).toBe(2);
  });
  it("calculates competency rate", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex", competencyLevel: "independent" }), makeSession({ childId: "c1", childName: "Alex", competencyLevel: "not_started" })];
    expect(buildChildLivingSkillsProfiles(sessions)[0].competencyRate).toBe(50);
  });
  it("calculates engagement rate", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex", childEngaged: true }), makeSession({ childId: "c1", childName: "Alex", childEngaged: false })];
    expect(buildChildLivingSkillsProfiles(sessions)[0].engagementRate).toBe(50);
  });
  it("frequency score 2 for >= 10 sessions", () => {
    const sessions = Array.from({ length: 10 }, () => makeSession({ childId: "c1", childName: "Alex" }));
    const profile = buildChildLivingSkillsProfiles(sessions)[0];
    expect(profile.overallScore).toBeGreaterThanOrEqual(7);
  });
  it("frequency score 1 for >= 5 sessions", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ childId: "c1", childName: "Alex" }));
    const profile = buildChildLivingSkillsProfiles(sessions)[0];
    expect(profile.totalSessions).toBe(5);
  });
  it("diversity bonus for 4+ types", () => {
    const types: SkillsSession["skillType"][] = ["cooking_meal_prep", "cleaning_tidying", "laundry_clothing_care", "budgeting_money"];
    const sessions = types.map((t) => makeSession({ childId: "c1", childName: "Alex", skillType: t }));
    expect(buildChildLivingSkillsProfiles(sessions)[0].overallScore).toBeGreaterThanOrEqual(5);
  });
  it("diversity bonus for 2-3 types", () => {
    const types: SkillsSession["skillType"][] = ["cooking_meal_prep", "cleaning_tidying"];
    const sessions = types.map((t) => makeSession({ childId: "c1", childName: "Alex", skillType: t }));
    const profile = buildChildLivingSkillsProfiles(sessions)[0];
    expect(profile.overallScore).toBeGreaterThanOrEqual(1);
  });
  it("caps at 10", () => {
    const sessions = Array.from({ length: 15 }, () => makeSession({ childId: "c1", childName: "Alex" }));
    expect(buildChildLivingSkillsProfiles(sessions)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("returns child name", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Jordan" })];
    expect(buildChildLivingSkillsProfiles(sessions)[0].childName).toBe("Jordan");
  });
  it("no diversity bonus for single type", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex", skillType: "cooking_meal_prep" })];
    const profile = buildChildLivingSkillsProfiles(sessions)[0];
    // 1 session: freqScore=0, competencyRate=100 so compScore=3, engagementRate=100 so engScore=3, 1 type so divScore=0 => 6
    expect(profile.overallScore).toBe(6);
  });
});

// ── generateIndependentLivingSkillsIntelligence ──────────────────────────────

describe("generateIndependentLivingSkillsIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-20" };

  it("returns inadequate for empty", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const types: SkillsSession["skillType"][] = ["cooking_meal_prep", "cleaning_tidying", "laundry_clothing_care", "budgeting_money", "personal_hygiene", "shopping_errands", "travel_navigation", "home_maintenance"];
    const sessions = Array.from({ length: 10 }, (_, i) => makeSession({ skillType: types[i % 8] }));
    const r = generateIndependentLivingSkillsIntelligence(sessions, makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const types: SkillsSession["skillType"][] = ["cooking_meal_prep", "cleaning_tidying", "laundry_clothing_care", "budgeting_money", "personal_hygiene", "shopping_errands", "travel_navigation", "home_maintenance"];
    const r = generateIndependentLivingSkillsIntelligence(Array.from({ length: 20 }, (_, i) => makeSession({ skillType: types[i % 8] })), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test"); expect(r.periodStart).toBe("2026-01-01"); expect(r.periodEnd).toBe("2026-06-30");
  });
  it("generates strength for high competency", () => {
    const r = generateIndependentLivingSkillsIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("competency"))).toBe(true);
  });
  it("generates strength for high engagement", () => {
    const r = generateIndependentLivingSkillsIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("engaged"))).toBe(true);
  });
  it("generates strength for high progress", () => {
    const r = generateIndependentLivingSkillsIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("progress"))).toBe(true);
  });
  it("generates strength for high documentation", () => {
    const r = generateIndependentLivingSkillsIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("documented"))).toBe(true);
  });
  it("generates area for improvement for low competency", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ competencyLevel: "not_started" }));
    const r = generateIndependentLivingSkillsIntelligence(sessions, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("Competency"))).toBe(true);
  });
  it("generates area for improvement for low engagement", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ childEngaged: false }));
    const r = generateIndependentLivingSkillsIntelligence(sessions, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("engagement"))).toBe(true);
  });
  it("generates area for improvement for low feedback", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ feedbackGiven: false }));
    const r = generateIndependentLivingSkillsIntelligence(sessions, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("Feedback"))).toBe(true);
  });
  it("generates area for improvement for low confidence", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ confidenceBuilt: false }));
    const r = generateIndependentLivingSkillsIntelligence(sessions, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("Confidence"))).toBe(true);
  });
  it("generates action for no sessions", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No living skills session records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("generates action for low staff support", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ staffSupported: false }));
    const r = generateIndependentLivingSkillsIntelligence(sessions, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("staff support"))).toBe(true);
  });
  it("generates action for low progress", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ progressMade: false }));
    const r = generateIndependentLivingSkillsIntelligence(sessions, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("progress"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
  });
  it("includes CHR Regulation 5 link", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("Regulation 5"))).toBe(true);
  });
  it("includes CHR Regulation 8 link", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("Regulation 8"))).toBe(true);
  });
  it("includes SCCIF link", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });
  it("includes NMS 14 link", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 14"))).toBe(true);
  });
  it("includes Children Act 1989 link", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });
  it("includes Children and Social Work Act 2017 link", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("2017"))).toBe(true);
  });
  it("includes Staying Close/Staying Put link", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("Staying"))).toBe(true);
  });
  it("good rating for mid-range score", () => {
    const r = generateIndependentLivingSkillsIntelligence(Array.from({ length: 5 }, () => makeSession()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.rating).toBe("good");
  });
  it("child profiles are populated", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex" }), makeSession({ childId: "c2", childName: "Jordan" })];
    const r = generateIndependentLivingSkillsIntelligence(sessions, makePolicy(), [makeTraining()], b.homeId, b.periodStart, b.periodEnd);
    expect(r.childProfiles.length).toBe(2);
  });
  it("no areas for improvement when data is empty", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.length).toBe(0);
  });
  it("no strengths when data is empty", () => {
    const r = generateIndependentLivingSkillsIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.length).toBe(0);
  });
});
