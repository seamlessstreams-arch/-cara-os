import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getClothingCategoryLabel,
  getProvisionQualityLabel,
  getRatingLabel,
  evaluateQuality,
  evaluateCompliance,
  evaluatePolicy,
  evaluateStaffReadiness,
  buildChildProfiles,
  generateClothingAppearanceProvisionIntelligence,
} from "../clothing-appearance-provision-engine";
import type {
  ClothingAssessment,
  ClothingPolicy,
  StaffClothingTraining,
} from "../clothing-appearance-provision-engine";

// -- Helpers -------------------------------------------------------------------

function makeAssessment(overrides: Partial<ClothingAssessment> = {}): ClothingAssessment {
  return {
    id: "a-1",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-04-01",
    clothingCategory: "everyday_wear",
    provisionQuality: "excellent",
    childChoiceRespected: true,
    ageAppropriate: true,
    culturalNeedsMet: true,
    documentedInPlan: true,
    staffAssessed: true,
    feedbackGiven: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<ClothingPolicy> = {}): ClothingPolicy {
  return {
    id: "pol-1",
    clothingProvisionStrategy: true,
    clothingBudgetFramework: true,
    seasonalReviewProcedure: true,
    childChoiceGuidance: true,
    culturalAndReligiousAccommodation: true,
    laundryAndMaintenancePlan: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffClothingTraining> = {}): StaffClothingTraining {
  return {
    id: "tr-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    clothingAssessment: true,
    childChoiceFacilitation: true,
    budgetManagement: true,
    culturalAwareness: true,
    ageAppropriateGuidance: true,
    recordKeeping: true,
    ...overrides,
  };
}

// -- pct -----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for zero denominator", () => expect(pct(5, 0)).toBe(0));
  it("rounds correctly", () => expect(pct(1, 3)).toBe(33));
  it("returns 100 for equal values", () => expect(pct(10, 10)).toBe(100));
  it("returns 50 for half", () => expect(pct(5, 10)).toBe(50));
});

// -- getRating -----------------------------------------------------------------

describe("getRating", () => {
  it("outstanding for 80+", () => expect(getRating(80)).toBe("outstanding"));
  it("good for 60-79", () => expect(getRating(60)).toBe("good"));
  it("requires_improvement for 40-59", () => expect(getRating(40)).toBe("requires_improvement"));
  it("inadequate for <40", () => expect(getRating(39)).toBe("inadequate"));
});

// -- Label functions -----------------------------------------------------------

describe("label functions", () => {
  it("getClothingCategoryLabel", () => {
    expect(getClothingCategoryLabel("everyday_wear")).toBe("Everyday Wear");
    expect(getClothingCategoryLabel("school_uniform")).toBe("School Uniform");
    expect(getClothingCategoryLabel("cultural_religious")).toBe("Cultural / Religious");
  });
  it("getProvisionQualityLabel", () => {
    expect(getProvisionQualityLabel("excellent")).toBe("Excellent");
    expect(getProvisionQualityLabel("not_assessed")).toBe("Not Assessed");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateQuality -----------------------------------------------------------

describe("evaluateQuality", () => {
  it("returns 0 for empty assessments", () => {
    const r = evaluateQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalAssessments).toBe(0);
  });

  it("returns max score for all-excellent assessments", () => {
    const assessments = Array.from({ length: 10 }, (_, i) => makeAssessment({ id: `a-${i}`, childId: `c-${i}` }));
    const r = evaluateQuality(assessments);
    expect(r.overallScore).toBe(25);
    expect(r.qualityRate).toBe(100);
    expect(r.childChoiceRate).toBe(100);
  });

  it("returns low score for poor assessments", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a-${i}`,
        provisionQuality: "poor",
        childChoiceRespected: false,
        ageAppropriate: false,
        culturalNeedsMet: false,
      }),
    );
    const r = evaluateQuality(assessments);
    expect(r.overallScore).toBe(0);
  });

  it("handles mixed quality assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1" }),
      makeAssessment({ id: "a2", provisionQuality: "poor", childChoiceRespected: false }),
    ];
    const r = evaluateQuality(assessments);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("caps at 25", () => {
    const assessments = Array.from({ length: 50 }, (_, i) => makeAssessment({ id: `a-${i}` }));
    expect(evaluateQuality(assessments).overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly reports child choice rate", () => {
    const assessments = [
      makeAssessment({ id: "a1", childChoiceRespected: true }),
      makeAssessment({ id: "a2", childChoiceRespected: false }),
    ];
    expect(evaluateQuality(assessments).childChoiceRate).toBe(50);
  });

  it("correctly reports cultural rate", () => {
    const assessments = [
      makeAssessment({ id: "a1", culturalNeedsMet: true }),
      makeAssessment({ id: "a2", culturalNeedsMet: true }),
      makeAssessment({ id: "a3", culturalNeedsMet: false }),
    ];
    expect(evaluateQuality(assessments).culturalRate).toBe(67);
  });

  it("counts good as high quality", () => {
    const assessments = [
      makeAssessment({ id: "a1", provisionQuality: "good" }),
    ];
    expect(evaluateQuality(assessments).qualityRate).toBe(100);
  });

  it("does not count adequate as high quality", () => {
    const assessments = [
      makeAssessment({ id: "a1", provisionQuality: "adequate" }),
    ];
    expect(evaluateQuality(assessments).qualityRate).toBe(0);
  });
});

// -- evaluateCompliance --------------------------------------------------------

describe("evaluateCompliance", () => {
  it("returns 0 for empty assessments", () => {
    const r = evaluateCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.documentedRate).toBe(0);
  });

  it("returns max score for fully compliant assessments", () => {
    const categories = [
      "everyday_wear", "school_uniform", "seasonal_clothing", "footwear",
      "sleepwear", "sportswear", "formal_occasion", "cultural_religious",
    ] as const;
    const assessments = categories.map((c, i) =>
      makeAssessment({ id: `a-${i}`, clothingCategory: c }),
    );
    const r = evaluateCompliance(assessments);
    expect(r.overallScore).toBe(25);
    expect(r.documentedRate).toBe(100);
    expect(r.categoryDiversityRatio).toBe(100);
  });

  it("returns 0 for non-compliant assessments", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a-${i}`,
        documentedInPlan: false,
        staffAssessed: false,
        feedbackGiven: false,
      }),
    );
    const r = evaluateCompliance(assessments);
    // Still gets 1 for category diversity (all same category = 1/8 = 13%)
    expect(r.overallScore).toBeLessThanOrEqual(1);
  });

  it("handles mixed compliance", () => {
    const assessments = [
      makeAssessment({ id: "a1" }),
      makeAssessment({ id: "a2", documentedInPlan: false, feedbackGiven: false }),
    ];
    const r = evaluateCompliance(assessments);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("caps at 25", () => {
    const categories = [
      "everyday_wear", "school_uniform", "seasonal_clothing", "footwear",
      "sleepwear", "sportswear", "formal_occasion", "cultural_religious",
    ] as const;
    const assessments = Array.from({ length: 50 }, (_, i) =>
      makeAssessment({ id: `a-${i}`, clothingCategory: categories[i % 8] }),
    );
    expect(evaluateCompliance(assessments).overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly reports staff assessed rate", () => {
    const assessments = [
      makeAssessment({ id: "a1", staffAssessed: true }),
      makeAssessment({ id: "a2", staffAssessed: false }),
    ];
    expect(evaluateCompliance(assessments).staffAssessedRate).toBe(50);
  });

  it("correctly reports feedback rate", () => {
    const assessments = [
      makeAssessment({ id: "a1", feedbackGiven: true }),
      makeAssessment({ id: "a2", feedbackGiven: false }),
      makeAssessment({ id: "a3", feedbackGiven: true }),
    ];
    expect(evaluateCompliance(assessments).feedbackRate).toBe(67);
  });

  it("calculates category diversity correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", clothingCategory: "everyday_wear" }),
      makeAssessment({ id: "a2", clothingCategory: "school_uniform" }),
      makeAssessment({ id: "a3", clothingCategory: "footwear" }),
      makeAssessment({ id: "a4", clothingCategory: "sleepwear" }),
    ];
    // 4 out of 8 = 50%
    expect(evaluateCompliance(assessments).categoryDiversityRatio).toBe(50);
  });
});

// -- evaluatePolicy ------------------------------------------------------------

describe("evaluatePolicy", () => {
  it("returns 0 for empty policies", () => {
    const r = evaluatePolicy([]);
    expect(r.overallScore).toBe(0);
  });

  it("returns max score for fully compliant policies", () => {
    const policies = Array.from({ length: 10 }, (_, i) => makePolicy({ id: `pol-${i}` }));
    const r = evaluatePolicy(policies);
    expect(r.overallScore).toBe(25);
    expect(r.clothingProvisionStrategyRate).toBe(100);
  });

  it("returns 0 for non-compliant policies", () => {
    const policies = Array.from({ length: 10 }, (_, i) =>
      makePolicy({
        id: `pol-${i}`,
        clothingProvisionStrategy: false,
        clothingBudgetFramework: false,
        seasonalReviewProcedure: false,
        childChoiceGuidance: false,
        culturalAndReligiousAccommodation: false,
        laundryAndMaintenancePlan: false,
        regularReview: false,
      }),
    );
    const r = evaluatePolicy(policies);
    expect(r.overallScore).toBe(0);
  });

  it("handles mixed compliance", () => {
    const policies = [
      makePolicy({ id: "pol1" }),
      makePolicy({ id: "pol2", clothingProvisionStrategy: false, laundryAndMaintenancePlan: false }),
    ];
    const r = evaluatePolicy(policies);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("caps at 25", () => {
    const policies = Array.from({ length: 50 }, (_, i) => makePolicy({ id: `pol-${i}` }));
    expect(evaluatePolicy(policies).overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly reports seasonal review rate", () => {
    const policies = [
      makePolicy({ id: "pol1", seasonalReviewProcedure: true }),
      makePolicy({ id: "pol2", seasonalReviewProcedure: false }),
    ];
    expect(evaluatePolicy(policies).seasonalReviewProcedureRate).toBe(50);
  });
});

// -- evaluateStaffReadiness ----------------------------------------------------

describe("evaluateStaffReadiness", () => {
  it("returns 0 for empty training", () => {
    const r = evaluateStaffReadiness([]);
    expect(r.overallScore).toBe(0);
  });

  it("returns max score for fully trained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const r = evaluateStaffReadiness(training);
    expect(r.overallScore).toBe(25);
    expect(r.clothingAssessmentRate).toBe(100);
  });

  it("returns 0 for untrained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`,
        staffId: `s-${i}`,
        clothingAssessment: false,
        childChoiceFacilitation: false,
        budgetManagement: false,
        culturalAwareness: false,
        ageAppropriateGuidance: false,
        recordKeeping: false,
      }),
    );
    expect(evaluateStaffReadiness(training).overallScore).toBe(0);
  });

  it("handles partial training", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2", culturalAwareness: false, budgetManagement: false }),
    ];
    const r = evaluateStaffReadiness(training);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.culturalAwarenessRate).toBe(50);
  });

  it("caps at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    expect(evaluateStaffReadiness(training).overallScore).toBeLessThanOrEqual(25);
  });

  it("single fully trained staff scores max", () => {
    expect(evaluateStaffReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("correctly reports record keeping rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", recordKeeping: true }),
      makeTraining({ id: "t2", staffId: "s2", recordKeeping: false }),
    ];
    expect(evaluateStaffReadiness(training).recordKeepingRate).toBe(50);
  });
});

// -- buildChildProfiles --------------------------------------------------------

describe("buildChildProfiles", () => {
  it("returns empty for no data", () => {
    expect(buildChildProfiles([])).toHaveLength(0);
  });

  it("creates profiles from assessments", () => {
    const assessments = [makeAssessment({ childId: "c1", childName: "Alex" })];
    const profiles = buildChildProfiles(assessments);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].qualityRate).toBe(100);
  });

  it("merges multiple assessments per child", () => {
    const assessments = [
      makeAssessment({ id: "a1", childId: "c1" }),
      makeAssessment({ id: "a2", childId: "c1", clothingCategory: "school_uniform" }),
    ];
    const profiles = buildChildProfiles(assessments);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].totalAssessments).toBe(2);
  });

  it("calculates quality rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", childId: "c1", provisionQuality: "excellent" }),
      makeAssessment({ id: "a2", childId: "c1", provisionQuality: "poor" }),
      makeAssessment({ id: "a3", childId: "c1", provisionQuality: "excellent" }),
    ];
    const profiles = buildChildProfiles(assessments);
    expect(profiles[0].qualityRate).toBe(67);
  });

  it("caps child score at 10", () => {
    const assessments = Array.from({ length: 20 }, (_, i) =>
      makeAssessment({ id: `a-${i}`, childId: "c1" }),
    );
    const profiles = buildChildProfiles(assessments);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("score 0 minimum", () => {
    const assessments = [
      makeAssessment({
        childId: "c1",
        provisionQuality: "poor",
        childChoiceRespected: false,
        culturalNeedsMet: false,
        ageAppropriate: false,
      }),
    ];
    const profiles = buildChildProfiles(assessments);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });

  it("creates separate profiles for different children", () => {
    const assessments = [
      makeAssessment({ id: "a1", childId: "c1", childName: "Alex" }),
      makeAssessment({ id: "a2", childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildProfiles(assessments);
    expect(profiles).toHaveLength(2);
  });
});

// -- generateClothingAppearanceProvisionIntelligence ---------------------------

describe("generateClothingAppearanceProvisionIntelligence", () => {
  const demoAssessments: ClothingAssessment[] = [
    makeAssessment({ id: "a1", childId: "child-alex", childName: "Alex", clothingCategory: "everyday_wear" }),
    makeAssessment({ id: "a2", childId: "child-alex", childName: "Alex", clothingCategory: "school_uniform" }),
    makeAssessment({ id: "a3", childId: "child-alex", childName: "Alex", clothingCategory: "seasonal_clothing" }),
    makeAssessment({ id: "a4", childId: "child-jordan", childName: "Jordan", clothingCategory: "footwear" }),
    makeAssessment({ id: "a5", childId: "child-jordan", childName: "Jordan", clothingCategory: "sleepwear" }),
    makeAssessment({ id: "a6", childId: "child-morgan", childName: "Morgan", clothingCategory: "sportswear" }),
    makeAssessment({ id: "a7", childId: "child-morgan", childName: "Morgan", clothingCategory: "formal_occasion" }),
    makeAssessment({ id: "a8", childId: "child-morgan", childName: "Morgan", clothingCategory: "cultural_religious" }),
  ];

  const demoPolicies: ClothingPolicy[] = [
    makePolicy({ id: "pol-1" }),
  ];

  const demoTraining: StaffClothingTraining[] = [
    makeTraining({ id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
    makeTraining({ id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards" }),
    makeTraining({ id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams" }),
    makeTraining({ id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville" }),
  ];

  it("returns complete intelligence", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      demoAssessments, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-18");
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.rating).toBeDefined();
  });

  it("sums evaluator scores correctly", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      demoAssessments, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const sum =
      r.quality.overallScore +
      r.compliance.overallScore +
      r.policy.overallScore +
      r.staffReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(sum, 100));
  });

  it("rates outstanding for high-performing home", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      demoAssessments, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBeGreaterThanOrEqual(80);
    expect(r.rating).toBe("outstanding");
  });

  it("returns inadequate for all-empty inputs", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], "empty", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("generates URGENT actions for empty inputs", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], "empty", "2026-01-01", "2026-05-18",
    );
    const urgent = r.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBeGreaterThanOrEqual(3);
  });

  it("caps overall score at 100", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      demoAssessments, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes child profiles", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      demoAssessments, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.childProfiles.length).toBe(3);
  });

  it("has 7 regulatory links", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Regulation 6 in regulatory links", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 6"))).toBe(true);
  });

  it("includes CHR 2015 Regulation 10 in regulatory links", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 10"))).toBe(true);
  });

  it("includes UNCRC Article 27 in regulatory links", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 27"))).toBe(true);
  });

  it("includes Care Planning Regulations 2010 in regulatory links", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("Care Planning Regulations 2010"))).toBe(true);
  });

  it("includes NMS 6 in regulatory links", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 6"))).toBe(true);
  });

  it("generates strengths for outstanding home", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      demoAssessments, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas when child choice is low", () => {
    const badAssessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a-${i}`,
        childChoiceRespected: false,
        culturalNeedsMet: false,
        provisionQuality: "adequate",
      }),
    );
    const r = generateClothingAppearanceProvisionIntelligence(
      badAssessments, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
});

// -- Edge cases ----------------------------------------------------------------

describe("Edge cases", () => {
  it("single assessment scores max quality", () => {
    expect(evaluateQuality([makeAssessment()]).overallScore).toBe(25);
  });

  it("single policy scores max", () => {
    expect(evaluatePolicy([makePolicy()]).overallScore).toBe(25);
  });

  it("single training scores max", () => {
    expect(evaluateStaffReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("evaluator scores never exceed 25", () => {
    const largeAssessments = Array.from({ length: 100 }, (_, i) => makeAssessment({ id: `a-${i}` }));
    const largePolicies = Array.from({ length: 100 }, (_, i) => makePolicy({ id: `pol-${i}` }));
    const largeTraining = Array.from({ length: 100 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    expect(evaluateQuality(largeAssessments).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateCompliance(largeAssessments).overallScore).toBeLessThanOrEqual(25);
    expect(evaluatePolicy(largePolicies).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateStaffReadiness(largeTraining).overallScore).toBeLessThanOrEqual(25);
  });

  it("large dataset runs without error", () => {
    const assessments = Array.from({ length: 200 }, (_, i) => makeAssessment({ id: `a-${i}`, childId: `c-${i % 20}` }));
    const policies = Array.from({ length: 10 }, (_, i) => makePolicy({ id: `pol-${i}` }));
    const training = Array.from({ length: 20 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    const r = generateClothingAppearanceProvisionIntelligence(
      assessments, policies, training, "big", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.childProfiles.length).toBe(20);
  });
});
