import { describe, it, expect } from "vitest";
import {
  generateEnvironmentalSustainabilityAwarenessIntelligence, evaluateEcoQuality, evaluateEcoCompliance,
  evaluateEnvironmentalPolicy, evaluateStaffEnvironmentalReadiness, buildChildEnvironmentalProfiles, pct, getRating,
  getActivityTypeLabel, getEngagementLevelLabel, getRatingLabel,
} from "../environmental-sustainability-awareness-engine";
import type { EcoActivity, EnvironmentalPolicy, StaffEnvironmentalTraining } from "../environmental-sustainability-awareness-engine";

let _id = 0;
function makeActivity(overrides: Partial<EcoActivity> = {}): EcoActivity {
  _id++;
  return { id: `ea-${_id}`, childId: "child-alex", childName: "Alex", activityDate: "2026-04-01", activityType: "recycling_project", engagementLevel: "highly_engaged", knowledgeDemonstrated: true, initiativeTaken: true, habitsFormed: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true, ...overrides };
}
function makePolicy(overrides: Partial<EnvironmentalPolicy> = {}): EnvironmentalPolicy {
  return { id: "ep-1", sustainabilityStrategy: true, recyclingProcedure: true, energyManagementPlan: true, gardenAndNaturePolicy: true, ecoEducationFramework: true, communityPartnership: true, regularReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffEnvironmentalTraining> = {}): StaffEnvironmentalTraining {
  _tid++;
  return { id: `et-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, sustainabilityAwareness: true, ecoEducation: true, gardenManagement: true, energyConservation: true, wildlifeKnowledge: true, communityEngagement: true, ...overrides };
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
  it("getActivityTypeLabel", () => {
    expect(getActivityTypeLabel("recycling_project")).toBe("Recycling Project");
    expect(getActivityTypeLabel("garden_maintenance")).toBe("Garden Maintenance");
    expect(getActivityTypeLabel("energy_conservation")).toBe("Energy Conservation");
    expect(getActivityTypeLabel("nature_walk")).toBe("Nature Walk");
    expect(getActivityTypeLabel("wildlife_care")).toBe("Wildlife Care");
    expect(getActivityTypeLabel("eco_workshop")).toBe("Eco Workshop");
    expect(getActivityTypeLabel("sustainability_discussion")).toBe("Sustainability Discussion");
    expect(getActivityTypeLabel("community_cleanup")).toBe("Community Cleanup");
  });
  it("getEngagementLevelLabel", () => {
    expect(getEngagementLevelLabel("highly_engaged")).toBe("Highly Engaged");
    expect(getEngagementLevelLabel("engaged")).toBe("Engaged");
    expect(getEngagementLevelLabel("moderate")).toBe("Moderate");
    expect(getEngagementLevelLabel("minimal")).toBe("Minimal");
    expect(getEngagementLevelLabel("disengaged")).toBe("Disengaged");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("evaluateEcoQuality", () => {
  it("returns 0 for empty", () => { const r = evaluateEcoQuality([]); expect(r.overallScore).toBe(0); expect(r.totalActivities).toBe(0); });
  it("scores 25 for perfect", () => { expect(evaluateEcoQuality(Array.from({ length: 10 }, () => makeActivity())).overallScore).toBe(25); });
  it("counts highly_engaged+engaged as engaged", () => {
    const activities = [makeActivity({ engagementLevel: "highly_engaged" }), makeActivity({ engagementLevel: "engaged" }), makeActivity({ engagementLevel: "moderate" }), makeActivity({ engagementLevel: "minimal" }), makeActivity({ engagementLevel: "disengaged" })];
    expect(evaluateEcoQuality(activities).engagementRate).toBe(40);
  });
  it("calculates knowledge rate", () => {
    const activities = [makeActivity({ knowledgeDemonstrated: true }), makeActivity({ knowledgeDemonstrated: false })];
    expect(evaluateEcoQuality(activities).knowledgeRate).toBe(50);
  });
  it("calculates initiative rate", () => {
    const activities = [makeActivity({ initiativeTaken: true }), makeActivity({ initiativeTaken: true }), makeActivity({ initiativeTaken: false })];
    expect(evaluateEcoQuality(activities).initiativeRate).toBe(67);
  });
  it("calculates habits rate", () => {
    const activities = Array.from({ length: 4 }, () => makeActivity({ habitsFormed: true })).concat([makeActivity({ habitsFormed: false })]);
    expect(evaluateEcoQuality(activities).habitsRate).toBe(80);
  });
  it("caps at 25", () => { expect(evaluateEcoQuality(Array.from({ length: 20 }, () => makeActivity())).overallScore).toBeLessThanOrEqual(25); });
  it("scores lower with poor engagement", () => {
    const good = evaluateEcoQuality(Array.from({ length: 5 }, () => makeActivity()));
    const bad = evaluateEcoQuality(Array.from({ length: 5 }, () => makeActivity({ engagementLevel: "disengaged", knowledgeDemonstrated: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
});

describe("evaluateEcoCompliance", () => {
  it("returns 0 for empty", () => { expect(evaluateEcoCompliance([]).overallScore).toBe(0); });
  it("calculates documented rate", () => {
    const activities = [makeActivity({ documentedInPlan: true }), makeActivity({ documentedInPlan: false })];
    expect(evaluateEcoCompliance(activities).documentedRate).toBe(50);
  });
  it("calculates staff supported rate", () => {
    const activities = [makeActivity({ staffSupported: true }), makeActivity({ staffSupported: false }), makeActivity({ staffSupported: true })];
    expect(evaluateEcoCompliance(activities).staffSupportedRate).toBe(67);
  });
  it("calculates feedback rate", () => {
    const activities = Array.from({ length: 3 }, () => makeActivity({ feedbackGiven: true })).concat([makeActivity({ feedbackGiven: false })]);
    expect(evaluateEcoCompliance(activities).feedbackRate).toBe(75);
  });
  it("calculates activity diversity ratio", () => {
    const activities = [makeActivity({ activityType: "recycling_project" }), makeActivity({ activityType: "recycling_project" })];
    expect(evaluateEcoCompliance(activities).activityDiversityRatio).toBe(13);
  });
  it("caps at 25", () => { expect(evaluateEcoCompliance(Array.from({ length: 20 }, () => makeActivity())).overallScore).toBeLessThanOrEqual(25); });
});

describe("evaluateEnvironmentalPolicy", () => {
  it("returns 0 for null", () => { const r = evaluateEnvironmentalPolicy(null); expect(r.overallScore).toBe(0); expect(r.sustainabilityStrategy).toBe(false); });
  it("scores 25 for full policy", () => { expect(evaluateEnvironmentalPolicy(makePolicy()).overallScore).toBe(25); });
  it("4-point items individually", () => { expect(evaluateEnvironmentalPolicy(makePolicy({ sustainabilityStrategy: true, recyclingProcedure: false, energyManagementPlan: false, gardenAndNaturePolicy: false, ecoEducationFramework: false, communityPartnership: false, regularReview: false })).overallScore).toBe(4); });
  it("3-point items individually", () => { expect(evaluateEnvironmentalPolicy(makePolicy({ sustainabilityStrategy: false, recyclingProcedure: false, energyManagementPlan: false, gardenAndNaturePolicy: false, ecoEducationFramework: true, communityPartnership: false, regularReview: false })).overallScore).toBe(3); });
  it("4-point items = 16", () => { expect(evaluateEnvironmentalPolicy(makePolicy({ ecoEducationFramework: false, communityPartnership: false, regularReview: false })).overallScore).toBe(16); });
  it("3-point items = 9", () => { expect(evaluateEnvironmentalPolicy(makePolicy({ sustainabilityStrategy: false, recyclingProcedure: false, energyManagementPlan: false, gardenAndNaturePolicy: false })).overallScore).toBe(9); });
  it("all false = 0", () => { expect(evaluateEnvironmentalPolicy(makePolicy({ sustainabilityStrategy: false, recyclingProcedure: false, energyManagementPlan: false, gardenAndNaturePolicy: false, ecoEducationFramework: false, communityPartnership: false, regularReview: false })).overallScore).toBe(0); });
});

describe("evaluateStaffEnvironmentalReadiness", () => {
  it("returns 0 for empty", () => { const r = evaluateStaffEnvironmentalReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("scores 25 for fully trained", () => { expect(evaluateStaffEnvironmentalReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25); });
  it("scores 0 for untrained", () => { expect(evaluateStaffEnvironmentalReadiness([makeTraining({ sustainabilityAwareness: false, ecoEducation: false, gardenManagement: false, energyConservation: false, wildlifeKnowledge: false, communityEngagement: false })]).overallScore).toBe(0); });
  it("single fully trained = 25", () => { expect(evaluateStaffEnvironmentalReadiness([makeTraining()]).overallScore).toBe(25); });
  it("caps at 25", () => { expect(evaluateStaffEnvironmentalReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25); });
});

describe("buildChildEnvironmentalProfiles", () => {
  it("returns empty for no activities", () => { expect(buildChildEnvironmentalProfiles([]).length).toBe(0); });
  it("groups by child", () => {
    const activities = [makeActivity({ childId: "c1", childName: "Alex" }), makeActivity({ childId: "c2", childName: "Jordan" })];
    expect(buildChildEnvironmentalProfiles(activities).length).toBe(2);
  });
  it("calculates engagement rate", () => {
    const activities = [makeActivity({ childId: "c1", childName: "Alex", engagementLevel: "highly_engaged" }), makeActivity({ childId: "c1", childName: "Alex", engagementLevel: "disengaged" })];
    expect(buildChildEnvironmentalProfiles(activities)[0].engagementRate).toBe(50);
  });
  it("calculates knowledge rate", () => {
    const activities = [makeActivity({ childId: "c1", childName: "Alex", knowledgeDemonstrated: true }), makeActivity({ childId: "c1", childName: "Alex", knowledgeDemonstrated: false })];
    expect(buildChildEnvironmentalProfiles(activities)[0].knowledgeRate).toBe(50);
  });
  it("diversity bonus for 4+ types", () => {
    const types: EcoActivity["activityType"][] = ["recycling_project", "garden_maintenance", "energy_conservation", "nature_walk"];
    const activities = types.map((t) => makeActivity({ childId: "c1", childName: "Alex", activityType: t }));
    expect(buildChildEnvironmentalProfiles(activities)[0].overallScore).toBeGreaterThanOrEqual(5);
  });
  it("caps at 10", () => {
    const activities = Array.from({ length: 15 }, () => makeActivity({ childId: "c1", childName: "Alex" }));
    expect(buildChildEnvironmentalProfiles(activities)[0].overallScore).toBeLessThanOrEqual(10);
  });
});

describe("generateEnvironmentalSustainabilityAwarenessIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-20" };

  it("returns inadequate for empty", () => {
    const r = generateEnvironmentalSustainabilityAwarenessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const types: EcoActivity["activityType"][] = ["recycling_project", "garden_maintenance", "energy_conservation", "nature_walk", "wildlife_care", "eco_workshop", "sustainability_discussion", "community_cleanup"];
    const activities = Array.from({ length: 10 }, (_, i) => makeActivity({ activityType: types[i % 8] }));
    const r = generateEnvironmentalSustainabilityAwarenessIntelligence(activities, makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const types: EcoActivity["activityType"][] = ["recycling_project", "garden_maintenance", "energy_conservation", "nature_walk", "wildlife_care", "eco_workshop", "sustainability_discussion", "community_cleanup"];
    const r = generateEnvironmentalSustainabilityAwarenessIntelligence(Array.from({ length: 20 }, (_, i) => makeActivity({ activityType: types[i % 8] })), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generateEnvironmentalSustainabilityAwarenessIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test"); expect(r.periodStart).toBe("2026-01-01");
  });
  it("generates strength for high engagement", () => {
    const r = generateEnvironmentalSustainabilityAwarenessIntelligence(Array.from({ length: 5 }, () => makeActivity()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("engaged"))).toBe(true);
  });
  it("generates action for no activities", () => {
    const r = generateEnvironmentalSustainabilityAwarenessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No environmental activity records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generateEnvironmentalSustainabilityAwarenessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generateEnvironmentalSustainabilityAwarenessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generateEnvironmentalSustainabilityAwarenessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("Environment Act"))).toBe(true);
  });
  it("good rating for ~75", () => {
    const r = generateEnvironmentalSustainabilityAwarenessIntelligence(Array.from({ length: 5 }, () => makeActivity()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.rating).toBe("good");
  });
});
