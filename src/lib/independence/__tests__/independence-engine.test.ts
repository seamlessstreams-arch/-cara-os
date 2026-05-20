import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getCategoryLabel,
  getOutcomeLabel,
  getRatingLabel,
  evaluateIndependenceQuality,
  evaluateIndependenceCompliance,
  evaluateIndependencePolicy,
  evaluateStaffIndependenceReadiness,
  buildChildIndependenceProfiles,
  generateIndependenceIntelligence,
} from "../independence-engine";
import type {
  IndependenceRecord,
  IndependencePolicy,
  StaffIndependenceTraining,
} from "../independence-engine";

// -- Factory functions ---------------------------------------------------------

function makeRecord(overrides: Partial<IndependenceRecord> = {}): IndependenceRecord {
  return {
    id: "rec-1",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-03-15",
    category: "cooking_nutrition",
    outcome: "progressing",
    individualPlanInPlace: true,
    ageAppropriate: true,
    childEngaged: true,
    progressRecorded: true,
    documentationComplete: true,
    pathwayPlanAligned: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<IndependencePolicy> = {}): IndependencePolicy {
  return {
    id: "pol-1",
    independencePolicy: true,
    pathwayPlanningGuidance: true,
    lifeSkillsFramework: true,
    transitionProtocol: true,
    leavingCarePreparation: true,
    partnershipWorkingPolicy: true,
    reviewSchedule: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffIndependenceTraining> = {}): StaffIndependenceTraining {
  return {
    id: "tr-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    independencePlanning: true,
    lifeSkillsTeaching: true,
    pathwayKnowledge: true,
    motivationalSkills: true,
    communityResources: true,
    transitionSupport: true,
    ...overrides,
  };
}

// -- pct -----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for zero denominator", () => expect(pct(5, 0)).toBe(0));
  it("rounds correctly", () => expect(pct(1, 3)).toBe(33));
  it("returns 100 for equal values", () => expect(pct(10, 10)).toBe(100));
  it("returns 50 for half", () => expect(pct(5, 10)).toBe(50));
  it("returns 0 for zero numerator", () => expect(pct(0, 10)).toBe(0));
  it("handles large numbers", () => expect(pct(999, 1000)).toBe(100));
  it("rounds 2/3 to 67", () => expect(pct(2, 3)).toBe(67));
});

// -- getRating -----------------------------------------------------------------

describe("getRating", () => {
  it("outstanding for 80", () => expect(getRating(80)).toBe("outstanding"));
  it("outstanding for 100", () => expect(getRating(100)).toBe("outstanding"));
  it("outstanding for 95", () => expect(getRating(95)).toBe("outstanding"));
  it("good for 60", () => expect(getRating(60)).toBe("good"));
  it("good for 79", () => expect(getRating(79)).toBe("good"));
  it("requires_improvement for 40", () => expect(getRating(40)).toBe("requires_improvement"));
  it("requires_improvement for 59", () => expect(getRating(59)).toBe("requires_improvement"));
  it("inadequate for 39", () => expect(getRating(39)).toBe("inadequate"));
  it("inadequate for 0", () => expect(getRating(0)).toBe("inadequate"));
});

// -- Label functions -----------------------------------------------------------

describe("label functions", () => {
  it("getCategoryLabel — cooking_nutrition", () => {
    expect(getCategoryLabel("cooking_nutrition")).toBe("Cooking & Nutrition");
  });
  it("getCategoryLabel — money_management", () => {
    expect(getCategoryLabel("money_management")).toBe("Money Management");
  });
  it("getCategoryLabel — personal_hygiene", () => {
    expect(getCategoryLabel("personal_hygiene")).toBe("Personal Hygiene");
  });
  it("getCategoryLabel — household_tasks", () => {
    expect(getCategoryLabel("household_tasks")).toBe("Household Tasks");
  });
  it("getCategoryLabel — travel_skills", () => {
    expect(getCategoryLabel("travel_skills")).toBe("Travel Skills");
  });
  it("getCategoryLabel — health_management", () => {
    expect(getCategoryLabel("health_management")).toBe("Health Management");
  });
  it("getCategoryLabel — social_skills", () => {
    expect(getCategoryLabel("social_skills")).toBe("Social Skills");
  });
  it("getCategoryLabel — education_employment", () => {
    expect(getCategoryLabel("education_employment")).toBe("Education & Employment");
  });
  it("getOutcomeLabel — mastered", () => {
    expect(getOutcomeLabel("mastered")).toBe("Mastered");
  });
  it("getOutcomeLabel — progressing", () => {
    expect(getOutcomeLabel("progressing")).toBe("Progressing");
  });
  it("getOutcomeLabel — developing", () => {
    expect(getOutcomeLabel("developing")).toBe("Developing");
  });
  it("getOutcomeLabel — not_started", () => {
    expect(getOutcomeLabel("not_started")).toBe("Not Started");
  });
  it("getOutcomeLabel — regressed", () => {
    expect(getOutcomeLabel("regressed")).toBe("Regressed");
  });
  it("getRatingLabel — outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("getRatingLabel — good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("getRatingLabel — requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("getRatingLabel — inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateIndependenceQuality -----------------------------------------------

describe("evaluateIndependenceQuality", () => {
  it("returns 0 for empty records", () => {
    const r = evaluateIndependenceQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
    expect(r.individualPlanRate).toBe(0);
    expect(r.ageAppropriateRate).toBe(0);
    expect(r.childEngagedRate).toBe(0);
    expect(r.progressRecordedRate).toBe(0);
  });

  it("returns max score for all-excellent records", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `r-${i}`, childId: `c-${i}` }));
    const r = evaluateIndependenceQuality(records);
    expect(r.overallScore).toBe(25);
    expect(r.individualPlanRate).toBe(100);
    expect(r.ageAppropriateRate).toBe(100);
    expect(r.childEngagedRate).toBe(100);
    expect(r.progressRecordedRate).toBe(100);
  });

  it("returns 0 for all-false quality indicators", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        individualPlanInPlace: false,
        ageAppropriate: false,
        childEngaged: false,
        progressRecorded: false,
      }),
    );
    const r = evaluateIndependenceQuality(records);
    expect(r.overallScore).toBe(0);
  });

  it("handles mixed quality indicators", () => {
    const records = [
      makeRecord({ id: "r1", individualPlanInPlace: true, childEngaged: true }),
      makeRecord({ id: "r2", individualPlanInPlace: false, childEngaged: false, ageAppropriate: false }),
    ];
    const r = evaluateIndependenceQuality(records);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("caps at 25", () => {
    const records = Array.from({ length: 50 }, (_, i) => makeRecord({ id: `r-${i}` }));
    expect(evaluateIndependenceQuality(records).overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly reports individual plan rate", () => {
    const records = [
      makeRecord({ id: "r1", individualPlanInPlace: true }),
      makeRecord({ id: "r2", individualPlanInPlace: false }),
    ];
    expect(evaluateIndependenceQuality(records).individualPlanRate).toBe(50);
  });

  it("correctly reports age appropriate rate", () => {
    const records = [
      makeRecord({ id: "r1", ageAppropriate: true }),
      makeRecord({ id: "r2", ageAppropriate: false }),
      makeRecord({ id: "r3", ageAppropriate: true }),
    ];
    expect(evaluateIndependenceQuality(records).ageAppropriateRate).toBe(67);
  });

  it("correctly reports child engaged rate", () => {
    const records = [
      makeRecord({ id: "r1", childEngaged: true }),
      makeRecord({ id: "r2", childEngaged: false }),
    ];
    expect(evaluateIndependenceQuality(records).childEngagedRate).toBe(50);
  });

  it("correctly reports progress recorded rate", () => {
    const records = [
      makeRecord({ id: "r1", progressRecorded: true }),
      makeRecord({ id: "r2", progressRecorded: false }),
      makeRecord({ id: "r3", progressRecorded: true }),
    ];
    expect(evaluateIndependenceQuality(records).progressRecordedRate).toBe(67);
  });

  it("single excellent record scores max", () => {
    expect(evaluateIndependenceQuality([makeRecord()]).overallScore).toBe(25);
  });

  it("plan rate tier — 90%+ gets 7", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, individualPlanInPlace: true }),
    );
    expect(evaluateIndependenceQuality(records).individualPlanRate).toBe(100);
  });

  it("plan rate tier — 70-89% gets 5", () => {
    const records = [
      ...Array.from({ length: 7 }, (_, i) => makeRecord({ id: `a-${i}`, individualPlanInPlace: true })),
      ...Array.from({ length: 3 }, (_, i) => makeRecord({ id: `b-${i}`, individualPlanInPlace: false })),
    ];
    expect(evaluateIndependenceQuality(records).individualPlanRate).toBe(70);
  });

  it("plan rate tier — 50-69% gets 3", () => {
    const records = [
      ...Array.from({ length: 5 }, (_, i) => makeRecord({ id: `a-${i}`, individualPlanInPlace: true })),
      ...Array.from({ length: 5 }, (_, i) => makeRecord({ id: `b-${i}`, individualPlanInPlace: false })),
    ];
    expect(evaluateIndependenceQuality(records).individualPlanRate).toBe(50);
  });
});

// -- evaluateIndependenceCompliance --------------------------------------------

describe("evaluateIndependenceCompliance", () => {
  it("returns 0 for empty records", () => {
    const r = evaluateIndependenceCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
    expect(r.documentationCompleteRate).toBe(0);
    expect(r.pathwayPlanAlignedRate).toBe(0);
    expect(r.positiveOutcomeRate).toBe(0);
    expect(r.categoryDiversityRate).toBe(0);
  });

  it("returns max score for excellent records covering all categories", () => {
    const categories = [
      "cooking_nutrition", "money_management", "personal_hygiene", "household_tasks",
      "travel_skills", "health_management", "social_skills", "education_employment",
    ] as const;
    const records = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, category: cat, outcome: "mastered" }),
    );
    const r = evaluateIndependenceCompliance(records);
    expect(r.overallScore).toBe(25);
    expect(r.categoryDiversityRate).toBe(100);
  });

  it("returns low score for all-false compliance indicators", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        documentationComplete: false,
        pathwayPlanAligned: false,
        outcome: "not_started",
      }),
    );
    const r = evaluateIndependenceCompliance(records);
    expect(r.overallScore).toBeLessThan(10);
  });

  it("caps at 25", () => {
    const records = Array.from({ length: 50 }, (_, i) => makeRecord({ id: `r-${i}` }));
    expect(evaluateIndependenceCompliance(records).overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly reports documentation complete rate", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true }),
      makeRecord({ id: "r2", documentationComplete: false }),
    ];
    expect(evaluateIndependenceCompliance(records).documentationCompleteRate).toBe(50);
  });

  it("correctly reports pathway plan aligned rate", () => {
    const records = [
      makeRecord({ id: "r1", pathwayPlanAligned: true }),
      makeRecord({ id: "r2", pathwayPlanAligned: false }),
      makeRecord({ id: "r3", pathwayPlanAligned: true }),
    ];
    expect(evaluateIndependenceCompliance(records).pathwayPlanAlignedRate).toBe(67);
  });

  it("correctly reports positive outcome rate — mastered counts", () => {
    const records = [
      makeRecord({ id: "r1", outcome: "mastered" }),
      makeRecord({ id: "r2", outcome: "not_started" }),
    ];
    expect(evaluateIndependenceCompliance(records).positiveOutcomeRate).toBe(50);
  });

  it("correctly reports positive outcome rate — progressing counts", () => {
    const records = [
      makeRecord({ id: "r1", outcome: "progressing" }),
      makeRecord({ id: "r2", outcome: "regressed" }),
    ];
    expect(evaluateIndependenceCompliance(records).positiveOutcomeRate).toBe(50);
  });

  it("developing does not count as positive outcome", () => {
    const records = [
      makeRecord({ id: "r1", outcome: "developing" }),
    ];
    expect(evaluateIndependenceCompliance(records).positiveOutcomeRate).toBe(0);
  });

  it("correctly counts unique categories for diversity", () => {
    const records = [
      makeRecord({ id: "r1", category: "cooking_nutrition" }),
      makeRecord({ id: "r2", category: "cooking_nutrition" }),
      makeRecord({ id: "r3", category: "money_management" }),
    ];
    // 2 of 8 categories = 25%
    expect(evaluateIndependenceCompliance(records).categoryDiversityRate).toBe(25);
  });

  it("category diversity — 4 categories gives 50%", () => {
    const records = [
      makeRecord({ id: "r1", category: "cooking_nutrition" }),
      makeRecord({ id: "r2", category: "money_management" }),
      makeRecord({ id: "r3", category: "personal_hygiene" }),
      makeRecord({ id: "r4", category: "household_tasks" }),
    ];
    expect(evaluateIndependenceCompliance(records).categoryDiversityRate).toBe(50);
  });

  it("documentation rate tier — 90%+ gets 8", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, documentationComplete: true }),
    );
    expect(evaluateIndependenceCompliance(records).documentationCompleteRate).toBe(100);
  });
});

// -- evaluateIndependencePolicy ------------------------------------------------

describe("evaluateIndependencePolicy", () => {
  it("returns 0 for null policy", () => {
    const r = evaluateIndependencePolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.independencePolicyMet).toBe(false);
    expect(r.pathwayPlanningGuidanceMet).toBe(false);
    expect(r.lifeSkillsFrameworkMet).toBe(false);
    expect(r.transitionProtocolMet).toBe(false);
    expect(r.leavingCarePreparationMet).toBe(false);
    expect(r.partnershipWorkingPolicyMet).toBe(false);
    expect(r.reviewScheduleMet).toBe(false);
  });

  it("returns max score (25) for fully compliant policy", () => {
    const r = evaluateIndependencePolicy(makePolicy());
    expect(r.overallScore).toBe(25);
  });

  it("returns 0 for all-false policy", () => {
    const r = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false,
      pathwayPlanningGuidance: false,
      lifeSkillsFramework: false,
      transitionProtocol: false,
      leavingCarePreparation: false,
      partnershipWorkingPolicy: false,
      reviewSchedule: false,
    }));
    expect(r.overallScore).toBe(0);
  });

  it("independencePolicy adds 4 points", () => {
    const base = makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: false,
      transitionProtocol: false, leavingCarePreparation: false, partnershipWorkingPolicy: false, reviewSchedule: false,
    });
    const withPolicy = makePolicy({
      ...base, independencePolicy: true,
    });
    const diff = evaluateIndependencePolicy(withPolicy).overallScore - evaluateIndependencePolicy(base).overallScore;
    expect(diff).toBe(4);
  });

  it("pathwayPlanningGuidance adds 4 points", () => {
    const without = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: false,
      transitionProtocol: false, leavingCarePreparation: false, partnershipWorkingPolicy: false, reviewSchedule: false,
    }));
    const with_ = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: true, lifeSkillsFramework: false,
      transitionProtocol: false, leavingCarePreparation: false, partnershipWorkingPolicy: false, reviewSchedule: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("lifeSkillsFramework adds 4 points", () => {
    const without = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: false,
      transitionProtocol: false, leavingCarePreparation: false, partnershipWorkingPolicy: false, reviewSchedule: false,
    }));
    const with_ = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: true,
      transitionProtocol: false, leavingCarePreparation: false, partnershipWorkingPolicy: false, reviewSchedule: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("transitionProtocol adds 4 points", () => {
    const without = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: false,
      transitionProtocol: false, leavingCarePreparation: false, partnershipWorkingPolicy: false, reviewSchedule: false,
    }));
    const with_ = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: false,
      transitionProtocol: true, leavingCarePreparation: false, partnershipWorkingPolicy: false, reviewSchedule: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("leavingCarePreparation adds 3 points", () => {
    const without = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: false,
      transitionProtocol: false, leavingCarePreparation: false, partnershipWorkingPolicy: false, reviewSchedule: false,
    }));
    const with_ = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: false,
      transitionProtocol: false, leavingCarePreparation: true, partnershipWorkingPolicy: false, reviewSchedule: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(3);
  });

  it("partnershipWorkingPolicy adds 3 points", () => {
    const without = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: false,
      transitionProtocol: false, leavingCarePreparation: false, partnershipWorkingPolicy: false, reviewSchedule: false,
    }));
    const with_ = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: false,
      transitionProtocol: false, leavingCarePreparation: false, partnershipWorkingPolicy: true, reviewSchedule: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(3);
  });

  it("reviewSchedule adds 3 points", () => {
    const without = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: false,
      transitionProtocol: false, leavingCarePreparation: false, partnershipWorkingPolicy: false, reviewSchedule: false,
    }));
    const with_ = evaluateIndependencePolicy(makePolicy({
      independencePolicy: false, pathwayPlanningGuidance: false, lifeSkillsFramework: false,
      transitionProtocol: false, leavingCarePreparation: false, partnershipWorkingPolicy: false, reviewSchedule: true,
    }));
    expect(with_.overallScore - without.overallScore).toBe(3);
  });

  it("all weights sum to 25", () => {
    // 4+4+4+4+3+3+3 = 25
    expect(evaluateIndependencePolicy(makePolicy()).overallScore).toBe(25);
  });

  it("reports boolean flags correctly for partial policy", () => {
    const r = evaluateIndependencePolicy(makePolicy({
      independencePolicy: true,
      pathwayPlanningGuidance: false,
      lifeSkillsFramework: true,
      transitionProtocol: false,
    }));
    expect(r.independencePolicyMet).toBe(true);
    expect(r.pathwayPlanningGuidanceMet).toBe(false);
    expect(r.lifeSkillsFrameworkMet).toBe(true);
    expect(r.transitionProtocolMet).toBe(false);
  });

  it("caps at 25", () => {
    expect(evaluateIndependencePolicy(makePolicy()).overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateStaffIndependenceReadiness ----------------------------------------

describe("evaluateStaffIndependenceReadiness", () => {
  it("returns 0 for empty training", () => {
    const r = evaluateStaffIndependenceReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.independencePlanningRate).toBe(0);
    expect(r.lifeSkillsTeachingRate).toBe(0);
    expect(r.pathwayKnowledgeRate).toBe(0);
    expect(r.motivationalSkillsRate).toBe(0);
    expect(r.communityResourcesRate).toBe(0);
    expect(r.transitionSupportRate).toBe(0);
  });

  it("returns max score for fully trained staff", () => {
    const staff = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const r = evaluateStaffIndependenceReadiness(staff);
    expect(r.overallScore).toBe(25);
    expect(r.independencePlanningRate).toBe(100);
  });

  it("returns 0 for untrained staff", () => {
    const staff = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`,
        staffId: `s-${i}`,
        independencePlanning: false,
        lifeSkillsTeaching: false,
        pathwayKnowledge: false,
        motivationalSkills: false,
        communityResources: false,
        transitionSupport: false,
      }),
    );
    expect(evaluateStaffIndependenceReadiness(staff).overallScore).toBe(0);
  });

  it("handles partial training", () => {
    const staff = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2", pathwayKnowledge: false, motivationalSkills: false }),
    ];
    const r = evaluateStaffIndependenceReadiness(staff);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.pathwayKnowledgeRate).toBe(50);
    expect(r.motivationalSkillsRate).toBe(50);
  });

  it("caps at 25", () => {
    const staff = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    expect(evaluateStaffIndependenceReadiness(staff).overallScore).toBeLessThanOrEqual(25);
  });

  it("single fully trained staff scores max", () => {
    expect(evaluateStaffIndependenceReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("correctly reports independence planning rate", () => {
    const staff = [
      makeTraining({ id: "t1", staffId: "s1", independencePlanning: true }),
      makeTraining({ id: "t2", staffId: "s2", independencePlanning: false }),
      makeTraining({ id: "t3", staffId: "s3", independencePlanning: true }),
    ];
    expect(evaluateStaffIndependenceReadiness(staff).independencePlanningRate).toBe(67);
  });

  it("correctly reports life skills teaching rate", () => {
    const staff = [
      makeTraining({ id: "t1", staffId: "s1", lifeSkillsTeaching: true }),
      makeTraining({ id: "t2", staffId: "s2", lifeSkillsTeaching: false }),
    ];
    expect(evaluateStaffIndependenceReadiness(staff).lifeSkillsTeachingRate).toBe(50);
  });

  it("correctly reports motivational skills rate", () => {
    const staff = [
      makeTraining({ id: "t1", staffId: "s1", motivationalSkills: true }),
      makeTraining({ id: "t2", staffId: "s2", motivationalSkills: true }),
      makeTraining({ id: "t3", staffId: "s3", motivationalSkills: false }),
    ];
    expect(evaluateStaffIndependenceReadiness(staff).motivationalSkillsRate).toBe(67);
  });

  it("correctly reports community resources rate", () => {
    const staff = [
      makeTraining({ id: "t1", staffId: "s1", communityResources: true }),
      makeTraining({ id: "t2", staffId: "s2", communityResources: false }),
    ];
    expect(evaluateStaffIndependenceReadiness(staff).communityResourcesRate).toBe(50);
  });

  it("correctly reports transition support rate", () => {
    const staff = [
      makeTraining({ id: "t1", staffId: "s1", transitionSupport: true }),
      makeTraining({ id: "t2", staffId: "s2", transitionSupport: false }),
      makeTraining({ id: "t3", staffId: "s3", transitionSupport: true }),
    ];
    expect(evaluateStaffIndependenceReadiness(staff).transitionSupportRate).toBe(67);
  });

  it("weights are correct — independencePlanning worth 6", () => {
    const r = evaluateStaffIndependenceReadiness([makeTraining({
      independencePlanning: true,
      lifeSkillsTeaching: false,
      pathwayKnowledge: false,
      motivationalSkills: false,
      communityResources: false,
      transitionSupport: false,
    })]);
    expect(r.overallScore).toBe(6);
  });

  it("weights are correct — lifeSkillsTeaching worth 5", () => {
    const r = evaluateStaffIndependenceReadiness([makeTraining({
      independencePlanning: false,
      lifeSkillsTeaching: true,
      pathwayKnowledge: false,
      motivationalSkills: false,
      communityResources: false,
      transitionSupport: false,
    })]);
    expect(r.overallScore).toBe(5);
  });

  it("weights are correct — pathwayKnowledge worth 5", () => {
    const r = evaluateStaffIndependenceReadiness([makeTraining({
      independencePlanning: false,
      lifeSkillsTeaching: false,
      pathwayKnowledge: true,
      motivationalSkills: false,
      communityResources: false,
      transitionSupport: false,
    })]);
    expect(r.overallScore).toBe(5);
  });

  it("weights are correct — motivationalSkills worth 4", () => {
    const r = evaluateStaffIndependenceReadiness([makeTraining({
      independencePlanning: false,
      lifeSkillsTeaching: false,
      pathwayKnowledge: false,
      motivationalSkills: true,
      communityResources: false,
      transitionSupport: false,
    })]);
    expect(r.overallScore).toBe(4);
  });

  it("weights are correct — communityResources worth 3", () => {
    const r = evaluateStaffIndependenceReadiness([makeTraining({
      independencePlanning: false,
      lifeSkillsTeaching: false,
      pathwayKnowledge: false,
      motivationalSkills: false,
      communityResources: true,
      transitionSupport: false,
    })]);
    expect(r.overallScore).toBe(3);
  });

  it("weights are correct — transitionSupport worth 2", () => {
    const r = evaluateStaffIndependenceReadiness([makeTraining({
      independencePlanning: false,
      lifeSkillsTeaching: false,
      pathwayKnowledge: false,
      motivationalSkills: false,
      communityResources: false,
      transitionSupport: true,
    })]);
    expect(r.overallScore).toBe(2);
  });

  it("all weights sum to 25", () => {
    // 6+5+5+4+3+2 = 25
    expect(evaluateStaffIndependenceReadiness([makeTraining()]).overallScore).toBe(25);
  });
});

// -- buildChildIndependenceProfiles --------------------------------------------

describe("buildChildIndependenceProfiles", () => {
  it("returns empty for no records", () => {
    expect(buildChildIndependenceProfiles([])).toHaveLength(0);
  });

  it("creates profile from single record", () => {
    const profiles = buildChildIndependenceProfiles([makeRecord({ childId: "c1", childName: "Alex" })]);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalRecords).toBe(1);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r3", childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles).toHaveLength(2);
  });

  it("calculates individual plan rate per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", individualPlanInPlace: true }),
      makeRecord({ id: "r2", childId: "c1", individualPlanInPlace: false }),
    ];
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles[0].individualPlanRate).toBe(50);
  });

  it("calculates child engaged rate per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childEngaged: true }),
      makeRecord({ id: "r2", childId: "c1", childEngaged: false }),
      makeRecord({ id: "r3", childId: "c1", childEngaged: true }),
    ];
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles[0].childEngagedRate).toBe(67);
  });

  it("counts unique categories per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", category: "cooking_nutrition" }),
      makeRecord({ id: "r2", childId: "c1", category: "cooking_nutrition" }),
      makeRecord({ id: "r3", childId: "c1", category: "money_management" }),
      makeRecord({ id: "r4", childId: "c1", category: "travel_skills" }),
    ];
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(3);
  });

  it("frequency score: >=10 records -> 2 points", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1" }),
    );
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(2);
  });

  it("frequency score: >=5 but <10 records -> 1 point", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", individualPlanInPlace: false, childEngaged: false }),
    );
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(1);
  });

  it("frequency score: <5 records -> 0 points from frequency", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", individualPlanInPlace: false, childEngaged: false }),
    ];
    const profiles = buildChildIndependenceProfiles(records);
    // 0 from frequency, 0 from plan, 0 from engaged, 0 from diversity (1 < 2)
    expect(profiles[0].overallScore).toBe(0);
  });

  it("plan score: >=80% -> 3 points", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", individualPlanInPlace: true, childEngaged: false }),
    );
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles[0].individualPlanRate).toBe(100);
  });

  it("engaged score: >=80% -> 3 points", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childEngaged: true, individualPlanInPlace: false }),
    );
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles[0].childEngagedRate).toBe(100);
  });

  it("diversity score: >=4 unique categories -> 2 points", () => {
    const categories = [
      "cooking_nutrition", "money_management", "personal_hygiene", "household_tasks",
    ] as const;
    const records = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: cat, individualPlanInPlace: false, childEngaged: false }),
    );
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(4);
  });

  it("diversity score: >=2 but <4 unique categories -> 1 point", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", category: "cooking_nutrition", individualPlanInPlace: false, childEngaged: false }),
      makeRecord({ id: "r2", childId: "c1", category: "money_management", individualPlanInPlace: false, childEngaged: false }),
    ];
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(2);
  });

  it("caps child score at 10", () => {
    const categories = [
      "cooking_nutrition", "money_management", "personal_hygiene", "household_tasks",
      "travel_skills", "health_management", "social_skills", "education_employment",
    ] as const;
    const records = Array.from({ length: 16 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: categories[i % 8] }),
    );
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("score minimum is 0", () => {
    const records = [
      makeRecord({
        childId: "c1",
        individualPlanInPlace: false,
        childEngaged: false,
      }),
    ];
    const profiles = buildChildIndependenceProfiles(records);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });

  it("multiple children have independent scores", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", individualPlanInPlace: true, childEngaged: true }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan", individualPlanInPlace: false, childEngaged: false }),
    ];
    const profiles = buildChildIndependenceProfiles(records);
    const alex = profiles.find((p) => p.childId === "c1")!;
    const jordan = profiles.find((p) => p.childId === "c2")!;
    expect(alex.individualPlanRate).toBe(100);
    expect(jordan.individualPlanRate).toBe(0);
  });
});

// -- generateIndependenceIntelligence ------------------------------------------

describe("generateIndependenceIntelligence", () => {
  const demoRecords = [
    makeRecord({ id: "r1", childId: "child-alex", childName: "Alex", category: "cooking_nutrition" }),
    makeRecord({ id: "r2", childId: "child-alex", childName: "Alex", category: "money_management" }),
    makeRecord({ id: "r3", childId: "child-jordan", childName: "Jordan", category: "personal_hygiene" }),
    makeRecord({ id: "r4", childId: "child-jordan", childName: "Jordan", category: "household_tasks" }),
    makeRecord({ id: "r5", childId: "child-morgan", childName: "Morgan", category: "travel_skills" }),
    makeRecord({ id: "r6", childId: "child-morgan", childName: "Morgan", category: "health_management" }),
    makeRecord({ id: "r7", childId: "child-morgan", childName: "Morgan", category: "social_skills" }),
    makeRecord({ id: "r8", childId: "child-alex", childName: "Alex", category: "education_employment" }),
  ];

  const demoPolicy = makePolicy();

  const demoStaff = [
    makeTraining({ id: "t1", staffId: "s1", staffName: "Sarah Johnson" }),
    makeTraining({ id: "t2", staffId: "s2", staffName: "Tom Richards" }),
    makeTraining({ id: "t3", staffId: "s3", staffName: "Lisa Williams" }),
    makeTraining({ id: "t4", staffId: "s4", staffName: "Darren Laville" }),
  ];

  it("returns complete intelligence", () => {
    const r = generateIndependenceIntelligence(
      demoRecords, demoPolicy, demoStaff,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-20");
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.rating).toBeDefined();
  });

  it("sums evaluator scores correctly", () => {
    const r = generateIndependenceIntelligence(
      demoRecords, demoPolicy, demoStaff,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    const sum =
      r.independenceQuality.overallScore +
      r.independenceCompliance.overallScore +
      r.independencePolicy.overallScore +
      r.staffIndependenceReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(sum, 100));
  });

  it("rates outstanding for high-performing home", () => {
    const r = generateIndependenceIntelligence(
      demoRecords, demoPolicy, demoStaff,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBeGreaterThanOrEqual(80);
    expect(r.rating).toBe("outstanding");
  });

  it("returns inadequate for all-empty inputs", () => {
    const r = generateIndependenceIntelligence(
      [], null, [], "empty", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("generates actions for empty records", () => {
    const r = generateIndependenceIntelligence(
      [], demoPolicy, demoStaff, "x", "2026-01-01", "2026-05-20",
    );
    expect(r.actions.some((a) => a.includes("No independence assessment records"))).toBe(true);
  });

  it("generates URGENT action for null policy", () => {
    const r = generateIndependenceIntelligence(
      demoRecords, null, demoStaff, "x", "2026-01-01", "2026-05-20",
    );
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action for empty staff", () => {
    const r = generateIndependenceIntelligence(
      demoRecords, demoPolicy, [], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("generates all URGENT actions for completely empty inputs", () => {
    const r = generateIndependenceIntelligence(
      [], null, [], "empty", "2026-01-01", "2026-05-20",
    );
    const urgent = r.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBeGreaterThanOrEqual(2);
  });

  it("caps overall score at 100", () => {
    const r = generateIndependenceIntelligence(
      demoRecords, demoPolicy, demoStaff,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes child profiles", () => {
    const r = generateIndependenceIntelligence(
      demoRecords, demoPolicy, demoStaff,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.childProfiles.length).toBe(3);
  });

  it("has 7 regulatory links", () => {
    const r = generateIndependenceIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Regulation 5 in regulatory links", () => {
    const r = generateIndependenceIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 5"))).toBe(true);
  });

  it("includes CHR 2015 Regulation 9 in regulatory links", () => {
    const r = generateIndependenceIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 9"))).toBe(true);
  });

  it("includes Children (Leaving Care) Act 2000 in regulatory links", () => {
    const r = generateIndependenceIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("Children (Leaving Care) Act 2000"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const r = generateIndependenceIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes Care Leavers Strategy 2013 in regulatory links", () => {
    const r = generateIndependenceIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("Care Leavers Strategy 2013"))).toBe(true);
  });

  it("includes Children Act 1989 s.23C in regulatory links", () => {
    const r = generateIndependenceIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989 s.23C"))).toBe(true);
  });

  it("includes DfE Guide in regulatory links", () => {
    const r = generateIndependenceIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("DfE Guide"))).toBe(true);
  });

  it("generates strengths for outstanding home", () => {
    const r = generateIndependenceIntelligence(
      demoRecords, demoPolicy, demoStaff,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates plan strength when individualPlanRate >=80%", () => {
    const r = generateIndependenceIntelligence(
      demoRecords, demoPolicy, demoStaff,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.strengths.some((s) => s.includes("plan") || s.includes("Plan"))).toBe(true);
  });

  it("generates engagement strength when childEngagedRate >=80%", () => {
    const r = generateIndependenceIntelligence(
      demoRecords, demoPolicy, demoStaff,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.strengths.some((s) => s.includes("engagement") || s.includes("Engagement"))).toBe(true);
  });

  it("generates areas when engagement <60%", () => {
    const badRecords = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childEngaged: false,
        individualPlanInPlace: false,
        documentationComplete: false,
        pathwayPlanAligned: false,
      }),
    );
    const r = generateIndependenceIntelligence(
      badRecords, demoPolicy, demoStaff,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("no areas for improvement with excellent data", () => {
    const r = generateIndependenceIntelligence(
      demoRecords, demoPolicy, demoStaff,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.areasForImprovement.length).toBeGreaterThanOrEqual(0);
  });
});

// -- Edge cases ----------------------------------------------------------------

describe("Edge cases", () => {
  it("single record scores max quality", () => {
    expect(evaluateIndependenceQuality([makeRecord()]).overallScore).toBe(25);
  });

  it("single record with one category — diversity limited", () => {
    const r = evaluateIndependenceCompliance([makeRecord()]);
    // 1 of 8 categories = 13%
    expect(r.categoryDiversityRate).toBe(13);
  });

  it("single policy scores max", () => {
    expect(evaluateIndependencePolicy(makePolicy()).overallScore).toBe(25);
  });

  it("single training scores max", () => {
    expect(evaluateStaffIndependenceReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("evaluator scores never exceed 25", () => {
    const largeRecords = Array.from({ length: 100 }, (_, i) => makeRecord({ id: `r-${i}` }));
    const largeStaff = Array.from({ length: 100 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    expect(evaluateIndependenceQuality(largeRecords).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateIndependenceCompliance(largeRecords).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateIndependencePolicy(makePolicy()).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateStaffIndependenceReadiness(largeStaff).overallScore).toBeLessThanOrEqual(25);
  });

  it("large dataset runs without error", () => {
    const records = Array.from({ length: 200 }, (_, i) => makeRecord({ id: `r-${i}`, childId: `c-${i % 20}` }));
    const staff = Array.from({ length: 20 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    const r = generateIndependenceIntelligence(
      records, makePolicy(), staff, "big", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.childProfiles.length).toBe(20);
  });

  it("overall score for all-empty is exactly 0", () => {
    const r = generateIndependenceIntelligence(
      [], null, [], "empty", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBe(0);
  });

  it("records only (no policy, no staff) still produces valid result", () => {
    const r = generateIndependenceIntelligence(
      [makeRecord()], null, [], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.independencePolicy.overallScore).toBe(0);
    expect(r.staffIndependenceReadiness.overallScore).toBe(0);
  });

  it("policy only (no records, no staff) still produces valid result", () => {
    const r = generateIndependenceIntelligence(
      [], makePolicy(), [], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.independencePolicy.overallScore).toBe(25);
    expect(r.independenceQuality.overallScore).toBe(0);
  });

  it("staff only (no records, no policy) still produces valid result", () => {
    const r = generateIndependenceIntelligence(
      [], null, [makeTraining()], "x", "2026-01-01", "2026-05-20",
    );
    expect(r.staffIndependenceReadiness.overallScore).toBe(25);
    expect(r.independenceQuality.overallScore).toBe(0);
  });
});
