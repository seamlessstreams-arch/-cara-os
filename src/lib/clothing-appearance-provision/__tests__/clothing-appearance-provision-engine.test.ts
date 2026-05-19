import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getClothingCategoryLabel,
  getProvisionStatusLabel,
  getSeasonalReadinessLabel,
  getRatingLabel,
  evaluateClothingProvision,
  evaluateBudgetManagement,
  evaluateClothingPolicy,
  evaluateStaffClothingReadiness,
  buildChildClothingProfiles,
  generateClothingAppearanceProvisionIntelligence,
} from "../clothing-appearance-provision-engine";
import type {
  ClothingProvisionRecord,
  ClothingBudgetRecord,
  ClothingPolicy,
  StaffClothingTraining,
} from "../clothing-appearance-provision-engine";

// -- Helpers -------------------------------------------------------------------

function makeProvision(overrides: Partial<ClothingProvisionRecord> = {}): ClothingProvisionRecord {
  return {
    id: "prov-1",
    childId: "child-alex",
    childName: "Alex",
    recordDate: "2026-04-01",
    clothingCategory: "everyday",
    provisionStatus: "fully_met",
    childChoice: true,
    ageAppropriate: true,
    fitCorrect: true,
    culturallyAppropriate: true,
    ...overrides,
  };
}

function makeBudget(overrides: Partial<ClothingBudgetRecord> = {}): ClothingBudgetRecord {
  return {
    id: "bud-1",
    childId: "child-alex",
    childName: "Alex",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    budgetAllocated: 200,
    budgetSpent: 180,
    childInvolved: true,
    receiptsRecorded: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<ClothingPolicy> = {}): ClothingPolicy {
  return {
    id: "pol-1",
    individualClothingList: true,
    seasonalReviewScheduled: true,
    childChoiceRespected: true,
    culturalNeedsMet: true,
    labellingProtocol: true,
    laundryArrangements: true,
    budgetTransparency: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffClothingTraining> = {}): StaffClothingTraining {
  return {
    id: "tr-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    clothingStandards: true,
    childChoice: true,
    culturalAwareness: true,
    budgetManagement: true,
    ageAppropriateness: true,
    dignityAndPrivacy: true,
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
    expect(getClothingCategoryLabel("everyday")).toBe("Everyday");
    expect(getClothingCategoryLabel("school_uniform")).toBe("School Uniform");
    expect(getClothingCategoryLabel("special_occasion")).toBe("Special Occasion");
  });
  it("getProvisionStatusLabel", () => {
    expect(getProvisionStatusLabel("fully_met")).toBe("Fully Met");
    expect(getProvisionStatusLabel("not_met")).toBe("Not Met");
  });
  it("getSeasonalReadinessLabel", () => {
    expect(getSeasonalReadinessLabel("fully_ready")).toBe("Fully Ready");
    expect(getSeasonalReadinessLabel("not_ready")).toBe("Not Ready");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateClothingProvision -------------------------------------------------

describe("evaluateClothingProvision", () => {
  it("returns 0 for empty records", () => {
    const r = evaluateClothingProvision([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
  });

  it("returns max score for all-excellent provisions", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeProvision({ id: `p-${i}`, childId: `c-${i}` }));
    const r = evaluateClothingProvision(records);
    expect(r.overallScore).toBe(25);
    expect(r.fullyMetRate).toBe(100);
    expect(r.childChoiceRate).toBe(100);
  });

  it("returns low score for poor provisions", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeProvision({
        id: `p-${i}`,
        provisionStatus: "not_met",
        childChoice: false,
        ageAppropriate: false,
        fitCorrect: false,
        culturallyAppropriate: false,
      }),
    );
    const r = evaluateClothingProvision(records);
    expect(r.overallScore).toBe(0);
  });

  it("handles mixed quality provisions", () => {
    const records = [
      makeProvision({ id: "p1" }),
      makeProvision({ id: "p2", provisionStatus: "not_met", childChoice: false, fitCorrect: false }),
    ];
    const r = evaluateClothingProvision(records);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("caps at 25", () => {
    const records = Array.from({ length: 50 }, (_, i) => makeProvision({ id: `p-${i}` }));
    expect(evaluateClothingProvision(records).overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly reports child choice rate", () => {
    const records = [
      makeProvision({ id: "p1", childChoice: true }),
      makeProvision({ id: "p2", childChoice: false }),
    ];
    expect(evaluateClothingProvision(records).childChoiceRate).toBe(50);
  });

  it("correctly reports culturally appropriate rate", () => {
    const records = [
      makeProvision({ id: "p1", culturallyAppropriate: true }),
      makeProvision({ id: "p2", culturallyAppropriate: true }),
      makeProvision({ id: "p3", culturallyAppropriate: false }),
    ];
    expect(evaluateClothingProvision(records).culturallyAppropriateRate).toBe(67);
  });
});

// -- evaluateBudgetManagement --------------------------------------------------

describe("evaluateBudgetManagement", () => {
  it("returns 0 for empty records", () => {
    const r = evaluateBudgetManagement([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
  });

  it("returns max score for well-managed budgets", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeBudget({ id: `b-${i}`, childId: `c-${i}` }));
    const r = evaluateBudgetManagement(records);
    expect(r.overallScore).toBe(25);
    expect(r.budgetAdequacyRate).toBe(100);
    expect(r.childInvolvedRate).toBe(100);
    expect(r.receiptsRecordedRate).toBe(100);
  });

  it("returns low score for overspent budgets without involvement", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeBudget({
        id: `b-${i}`,
        budgetAllocated: 100,
        budgetSpent: 300,
        childInvolved: false,
        receiptsRecorded: false,
      }),
    );
    const r = evaluateBudgetManagement(records);
    expect(r.overallScore).toBeLessThan(10);
  });

  it("detects overspend correctly", () => {
    const records = [
      makeBudget({ id: "b1", budgetAllocated: 200, budgetSpent: 150 }),
      makeBudget({ id: "b2", budgetAllocated: 200, budgetSpent: 250 }),
    ];
    const r = evaluateBudgetManagement(records);
    expect(r.budgetAdequacyRate).toBe(50);
  });

  it("caps at 25", () => {
    const records = Array.from({ length: 50 }, (_, i) => makeBudget({ id: `b-${i}` }));
    expect(evaluateBudgetManagement(records).overallScore).toBeLessThanOrEqual(25);
  });

  it("calculates average spend ratio", () => {
    const records = [
      makeBudget({ id: "b1", budgetAllocated: 200, budgetSpent: 180 }),
      makeBudget({ id: "b2", budgetAllocated: 200, budgetSpent: 160 }),
    ];
    const r = evaluateBudgetManagement(records);
    // Total spent 340 / total allocated 400 = 85%
    expect(r.averageSpendRatio).toBe(85);
  });

  it("correctly reports receipts rate", () => {
    const records = [
      makeBudget({ id: "b1", receiptsRecorded: true }),
      makeBudget({ id: "b2", receiptsRecorded: false }),
      makeBudget({ id: "b3", receiptsRecorded: true }),
    ];
    expect(evaluateBudgetManagement(records).receiptsRecordedRate).toBe(67);
  });
});

// -- evaluateClothingPolicy ----------------------------------------------------

describe("evaluateClothingPolicy", () => {
  it("returns 0 for empty policies", () => {
    const r = evaluateClothingPolicy([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalPolicies).toBe(0);
  });

  it("returns max score for fully compliant policies", () => {
    const policies = Array.from({ length: 10 }, (_, i) => makePolicy({ id: `pol-${i}` }));
    const r = evaluateClothingPolicy(policies);
    expect(r.overallScore).toBe(25);
    expect(r.individualClothingListRate).toBe(100);
  });

  it("returns 0 for non-compliant policies", () => {
    const policies = Array.from({ length: 10 }, (_, i) =>
      makePolicy({
        id: `pol-${i}`,
        individualClothingList: false,
        seasonalReviewScheduled: false,
        childChoiceRespected: false,
        culturalNeedsMet: false,
        labellingProtocol: false,
        laundryArrangements: false,
        budgetTransparency: false,
      }),
    );
    const r = evaluateClothingPolicy(policies);
    expect(r.overallScore).toBe(0);
  });

  it("handles mixed compliance", () => {
    const policies = [
      makePolicy({ id: "pol1" }),
      makePolicy({ id: "pol2", individualClothingList: false, labellingProtocol: false }),
    ];
    const r = evaluateClothingPolicy(policies);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("caps at 25", () => {
    const policies = Array.from({ length: 50 }, (_, i) => makePolicy({ id: `pol-${i}` }));
    expect(evaluateClothingPolicy(policies).overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly reports seasonal review rate", () => {
    const policies = [
      makePolicy({ id: "pol1", seasonalReviewScheduled: true }),
      makePolicy({ id: "pol2", seasonalReviewScheduled: false }),
    ];
    expect(evaluateClothingPolicy(policies).seasonalReviewRate).toBe(50);
  });
});

// -- evaluateStaffClothingReadiness --------------------------------------------

describe("evaluateStaffClothingReadiness", () => {
  it("returns 0 for empty training", () => {
    const r = evaluateStaffClothingReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
  });

  it("returns max score for fully trained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const r = evaluateStaffClothingReadiness(training);
    expect(r.overallScore).toBe(25);
    expect(r.clothingStandardsRate).toBe(100);
  });

  it("returns 0 for untrained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`,
        staffId: `s-${i}`,
        clothingStandards: false,
        childChoice: false,
        culturalAwareness: false,
        budgetManagement: false,
        ageAppropriateness: false,
        dignityAndPrivacy: false,
      }),
    );
    expect(evaluateStaffClothingReadiness(training).overallScore).toBe(0);
  });

  it("handles partial training", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2", culturalAwareness: false, budgetManagement: false }),
    ];
    const r = evaluateStaffClothingReadiness(training);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.culturalAwarenessRate).toBe(50);
  });

  it("caps at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    expect(evaluateStaffClothingReadiness(training).overallScore).toBeLessThanOrEqual(25);
  });

  it("single fully trained staff scores max", () => {
    expect(evaluateStaffClothingReadiness([makeTraining()]).overallScore).toBe(25);
  });
});

// -- buildChildClothingProfiles ------------------------------------------------

describe("buildChildClothingProfiles", () => {
  it("returns empty for no data", () => {
    expect(buildChildClothingProfiles([], [])).toHaveLength(0);
  });

  it("creates profiles from provisions only", () => {
    const provisions = [makeProvision({ childId: "c1", childName: "Alex" })];
    const profiles = buildChildClothingProfiles(provisions, []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].fullyMetRate).toBe(100);
  });

  it("creates profiles from budgets only", () => {
    const budgets = [makeBudget({ childId: "c1", childName: "Alex" })];
    const profiles = buildChildClothingProfiles([], budgets);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalRecords).toBe(0);
  });

  it("merges data across provisions and budgets", () => {
    const provisions = [makeProvision({ childId: "c1" })];
    const budgets = [makeBudget({ childId: "c1" })];
    const profiles = buildChildClothingProfiles(provisions, budgets);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].overallScore).toBeGreaterThan(0);
    expect(profiles[0].budgetAdequacy).toBe(true);
  });

  it("detects budget overspend", () => {
    const budgets = [
      makeBudget({ childId: "c1", budgetAllocated: 100, budgetSpent: 200 }),
    ];
    const profiles = buildChildClothingProfiles([], budgets);
    expect(profiles[0].budgetAdequacy).toBe(false);
  });

  it("calculates fully met rate correctly", () => {
    const provisions = [
      makeProvision({ id: "p1", childId: "c1", provisionStatus: "fully_met" }),
      makeProvision({ id: "p2", childId: "c1", provisionStatus: "not_met" }),
      makeProvision({ id: "p3", childId: "c1", provisionStatus: "fully_met" }),
    ];
    const profiles = buildChildClothingProfiles(provisions, []);
    expect(profiles[0].fullyMetRate).toBe(67);
  });

  it("caps child score at 10", () => {
    const provisions = Array.from({ length: 20 }, (_, i) =>
      makeProvision({ id: `p-${i}`, childId: "c1" }),
    );
    const budgets = Array.from({ length: 5 }, (_, i) =>
      makeBudget({ id: `b-${i}`, childId: "c1" }),
    );
    const profiles = buildChildClothingProfiles(provisions, budgets);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("score 0 minimum", () => {
    const provisions = [
      makeProvision({
        childId: "c1",
        provisionStatus: "not_met",
        childChoice: false,
        fitCorrect: false,
      }),
    ];
    const profiles = buildChildClothingProfiles(provisions, []);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- generateClothingAppearanceProvisionIntelligence ---------------------------

describe("generateClothingAppearanceProvisionIntelligence", () => {
  const demoProvisions = [
    makeProvision({ id: "p1", childId: "child-alex" }),
    makeProvision({ id: "p2", childId: "child-jordan", childName: "Jordan", clothingCategory: "school_uniform" }),
    makeProvision({ id: "p3", childId: "child-morgan", childName: "Morgan", clothingCategory: "outdoor" }),
  ];

  const demoBudgets = [
    makeBudget({ id: "b1", childId: "child-alex" }),
    makeBudget({ id: "b2", childId: "child-jordan", childName: "Jordan" }),
    makeBudget({ id: "b3", childId: "child-morgan", childName: "Morgan" }),
  ];

  const demoPolicies = [
    makePolicy({ id: "pol1" }),
  ];

  const demoTraining = [
    makeTraining({ id: "t1", staffId: "s1" }),
    makeTraining({ id: "t2", staffId: "s2" }),
    makeTraining({ id: "t3", staffId: "s3" }),
    makeTraining({ id: "t4", staffId: "s4" }),
  ];

  it("returns complete intelligence", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      demoProvisions, demoBudgets, demoPolicies, demoTraining,
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
      demoProvisions, demoBudgets, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const sum =
      r.clothingProvision.overallScore +
      r.budgetManagement.overallScore +
      r.clothingPolicy.overallScore +
      r.staffClothingReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(sum, 100));
  });

  it("rates outstanding for high-performing home", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      demoProvisions, demoBudgets, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBeGreaterThanOrEqual(80);
    expect(r.rating).toBe("outstanding");
  });

  it("returns inadequate for all-empty inputs", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], [], "empty", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("generates URGENT actions for empty inputs", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], [], "empty", "2026-01-01", "2026-05-18",
    );
    const urgent = r.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBeGreaterThanOrEqual(4);
  });

  it("caps overall score at 100", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      demoProvisions, demoBudgets, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes child profiles", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      demoProvisions, demoBudgets, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.childProfiles.length).toBe(3);
  });

  it("has 7 regulatory links", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Reg 10 in regulatory links", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
  });

  it("includes UNCRC Article 27 in regulatory links", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 27"))).toBe(true);
  });

  it("includes Care Planning Regulations 2010 in regulatory links", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      [], [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("Care Planning Regulations 2010"))).toBe(true);
  });

  it("generates strengths for outstanding home", () => {
    const r = generateClothingAppearanceProvisionIntelligence(
      demoProvisions, demoBudgets, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas when child choice is low", () => {
    const badProvisions = Array.from({ length: 10 }, (_, i) =>
      makeProvision({
        id: `p-${i}`,
        childChoice: false,
        fitCorrect: false,
        culturallyAppropriate: false,
        provisionStatus: "partially_met",
      }),
    );
    const r = generateClothingAppearanceProvisionIntelligence(
      badProvisions, demoBudgets, demoPolicies, demoTraining,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
});

// -- Edge cases ----------------------------------------------------------------

describe("Edge cases", () => {
  it("single provision scores max", () => {
    expect(evaluateClothingProvision([makeProvision()]).overallScore).toBe(25);
  });

  it("single budget scores max", () => {
    expect(evaluateBudgetManagement([makeBudget()]).overallScore).toBe(25);
  });

  it("single policy scores max", () => {
    expect(evaluateClothingPolicy([makePolicy()]).overallScore).toBe(25);
  });

  it("single training scores max", () => {
    expect(evaluateStaffClothingReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("evaluator scores never exceed 25", () => {
    const largeProvisions = Array.from({ length: 100 }, (_, i) => makeProvision({ id: `p-${i}` }));
    const largeBudgets = Array.from({ length: 100 }, (_, i) => makeBudget({ id: `b-${i}` }));
    const largePolicies = Array.from({ length: 100 }, (_, i) => makePolicy({ id: `pol-${i}` }));
    const largeTraining = Array.from({ length: 100 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    expect(evaluateClothingProvision(largeProvisions).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateBudgetManagement(largeBudgets).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateClothingPolicy(largePolicies).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateStaffClothingReadiness(largeTraining).overallScore).toBeLessThanOrEqual(25);
  });

  it("large dataset runs without error", () => {
    const provisions = Array.from({ length: 200 }, (_, i) => makeProvision({ id: `p-${i}`, childId: `c-${i % 20}` }));
    const budgets = Array.from({ length: 200 }, (_, i) => makeBudget({ id: `b-${i}`, childId: `c-${i % 20}` }));
    const policies = Array.from({ length: 10 }, (_, i) => makePolicy({ id: `pol-${i}` }));
    const training = Array.from({ length: 20 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    const r = generateClothingAppearanceProvisionIntelligence(
      provisions, budgets, policies, training, "big", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.childProfiles.length).toBe(20);
  });
});
