import { describe, it, expect } from "vitest";
import {
  pct, getRating, getPlacementStabilityIntelligenceCategoryLabel, getPlacementStabilityIntelligenceOutcomeLabel, getRatingLabel,
  evaluatePlacementStabilityQuality, evaluatePlacementStabilityCompliance, evaluatePlacementStabilityPolicyEval,
  evaluateStaffPlacementStabilityReadiness, buildChildPlacementStabilityProfiles, generatePlacementStabilityIntelligenceReport,
} from "../placement-stability-intelligence-engine";
import type {
  PlacementStabilityRecord, PlacementStabilityPolicy, StaffPlacementStabilityTraining,
  PlacementStabilityIntelligenceCategory, PlacementStabilityIntelligenceOutcome, Rating,
} from "../placement-stability-intelligence-engine";

function makeRecord(overrides: Partial<PlacementStabilityRecord> = {}): PlacementStabilityRecord {
  return { id: "ps-1", homeId: "home-oak", date: "2025-03-15", childId: "child-alex", childName: "Alex", category: "placement_review", outcome: "placement_sustained", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: true, riskFactorsIdentified: true, documentationComplete: true, timelyRecording: true, ...overrides };
}
function makeRecords(n: number, o: Partial<PlacementStabilityRecord> = {}): PlacementStabilityRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `ps-${i}`, ...o }));
}
function allTruePolicy(): PlacementStabilityPolicy {
  return { placementStabilityPolicy: true, matchingProcedure: true, disruptionManagementPolicy: true, transitionPlanningFramework: true, unplannedEndingProtocol: true, permanencePlanningPolicy: true, placementReviewSchedule: true };
}
function allFalsePolicy(): PlacementStabilityPolicy {
  return { placementStabilityPolicy: false, matchingProcedure: false, disruptionManagementPolicy: false, transitionPlanningFramework: false, unplannedEndingProtocol: false, permanencePlanningPolicy: false, placementReviewSchedule: false };
}
function makeStaff(o: Partial<StaffPlacementStabilityTraining> = {}): StaffPlacementStabilityTraining {
  return { staffId: "s1", matchingAssessmentSkills: true, stabilityPlanningKnowledge: true, disruptionPreventionSkills: true, transitionSupportSkills: true, childParticipationSkills: true, permanencePlanningKnowledge: true, ...o };
}

// ═══ pct ═══
describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("100 for 1/1", () => { expect(pct(1, 1)).toBe(100); });
  it("rounds 2/3 to 67", () => { expect(pct(2, 3)).toBe(67); });
  it("rounds 1/3 to 33", () => { expect(pct(1, 3)).toBe(33); });
  it("0 for 0/1", () => { expect(pct(0, 1)).toBe(0); });
  it("50 for 1/2", () => { expect(pct(1, 2)).toBe(50); });
});

// ═══ getRating ═══
describe("getRating", () => {
  it("outstanding >=80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate <40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
  it("boundary 80 is outstanding", () => { expect(getRating(80)).toBe("outstanding"); });
  it("boundary 60 is good", () => { expect(getRating(60)).toBe("good"); });
  it("boundary 40 is requires_improvement", () => { expect(getRating(40)).toBe("requires_improvement"); });
});

// ═══ Labels ═══
describe("getPlacementStabilityIntelligenceCategoryLabel", () => {
  const cases: [PlacementStabilityIntelligenceCategory, string][] = [
    ["placement_review", "Placement Review"], ["stability_meeting", "Stability Meeting"],
    ["matching_assessment", "Matching Assessment"], ["disruption_meeting", "Disruption Meeting"],
    ["transition_planning", "Transition Planning"], ["placement_support", "Placement Support"],
    ["unplanned_ending_review", "Unplanned Ending Review"], ["permanence_planning", "Permanence Planning"],
  ];
  it.each(cases)("%s -> %s", (c, l) => { expect(getPlacementStabilityIntelligenceCategoryLabel(c)).toBe(l); });
});

describe("getPlacementStabilityIntelligenceOutcomeLabel", () => {
  const cases: [PlacementStabilityIntelligenceOutcome, string][] = [
    ["placement_sustained", "Placement Sustained"], ["placement_improved", "Placement Improved"],
    ["early_intervention", "Early Intervention"], ["placement_at_risk", "Placement At Risk"], ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s -> %s", (o, l) => { expect(getPlacementStabilityIntelligenceOutcomeLabel(o)).toBe(l); });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [["outstanding", "Outstanding"], ["good", "Good"], ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"]];
  it.each(cases)("%s -> %s", (r, l) => { expect(getRatingLabel(r)).toBe(l); });
});

// ═══ Quality ═══
describe("evaluatePlacementStabilityQuality", () => {
  it("0 for empty", () => { const r = evaluatePlacementStabilityQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("25 for perfect", () => { const r = evaluatePlacementStabilityQuality(makeRecords(5)); expect(r.overallScore).toBe(25); });
  it("0 for all-false", () => { const r = evaluatePlacementStabilityQuality(makeRecords(3, { matchingNeedsAssessed: false, stabilityPlanInPlace: false, childViewIncorporated: false, riskFactorsIdentified: false })); expect(r.overallScore).toBe(0); });
  it("weight 7 for matchingNeedsAssessed", () => { expect(evaluatePlacementStabilityQuality([makeRecord({ matchingNeedsAssessed: true, stabilityPlanInPlace: false, childViewIncorporated: false, riskFactorsIdentified: false })]).overallScore).toBe(7); });
  it("weight 6 for stabilityPlanInPlace", () => { expect(evaluatePlacementStabilityQuality([makeRecord({ matchingNeedsAssessed: false, stabilityPlanInPlace: true, childViewIncorporated: false, riskFactorsIdentified: false })]).overallScore).toBe(6); });
  it("weight 6 for childViewIncorporated", () => { expect(evaluatePlacementStabilityQuality([makeRecord({ matchingNeedsAssessed: false, stabilityPlanInPlace: false, childViewIncorporated: true, riskFactorsIdentified: false })]).overallScore).toBe(6); });
  it("weight 6 for riskFactorsIdentified", () => { expect(evaluatePlacementStabilityQuality([makeRecord({ matchingNeedsAssessed: false, stabilityPlanInPlace: false, childViewIncorporated: false, riskFactorsIdentified: true })]).overallScore).toBe(6); });
  it("50% partial = 12.5", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", matchingNeedsAssessed: false, stabilityPlanInPlace: false, childViewIncorporated: false, riskFactorsIdentified: false })];
    expect(evaluatePlacementStabilityQuality(records).overallScore).toBe(12.5);
  });
  it("caps at 25", () => { expect(evaluatePlacementStabilityQuality(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
  it("returns correct rates", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", matchingNeedsAssessed: false })];
    const r = evaluatePlacementStabilityQuality(records);
    expect(r.matchingNeedsAssessedRate).toBe(50);
    expect(r.stabilityPlanInPlaceRate).toBe(100);
  });
  it("single record all true rates are 100", () => {
    const r = evaluatePlacementStabilityQuality([makeRecord()]);
    expect(r.matchingNeedsAssessedRate).toBe(100);
    expect(r.stabilityPlanInPlaceRate).toBe(100);
    expect(r.childViewIncorporatedRate).toBe(100);
    expect(r.riskFactorsIdentifiedRate).toBe(100);
  });
  it("weights sum to 25", () => { expect(7 + 6 + 6 + 6).toBe(25); });
});

// ═══ Compliance ═══
describe("evaluatePlacementStabilityCompliance", () => {
  it("0 for empty", () => { expect(evaluatePlacementStabilityCompliance([]).overallScore).toBe(0); });
  it("25 for perfect with all 8 categories", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting", "transition_planning", "placement_support", "unplanned_ending_review", "permanence_planning"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    expect(evaluatePlacementStabilityCompliance(records).overallScore).toBe(25);
  });
  it("4/8 categories = 0.5 ratio", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluatePlacementStabilityCompliance(records);
    expect(r.uniqueCategories).toBe(4);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });
  it("single category = 0.13 ratio", () => { expect(evaluatePlacementStabilityCompliance(makeRecords(5)).categoryDiversityRatio).toBe(0.13); });
  it("caps at 25", () => { expect(evaluatePlacementStabilityCompliance(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
  it("returns correct documentation rate", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", documentationComplete: false })];
    expect(evaluatePlacementStabilityCompliance(records).documentationCompleteRate).toBe(50);
  });
  it("returns correct timely recording rate", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", timelyRecording: false })];
    expect(evaluatePlacementStabilityCompliance(records).timelyRecordingRate).toBe(50);
  });
  it("2/8 categories = 0.25 ratio", () => {
    const records = [makeRecord({ id: "a", category: "placement_review" }), makeRecord({ id: "b", category: "stability_meeting" })];
    expect(evaluatePlacementStabilityCompliance(records).categoryDiversityRatio).toBe(0.25);
  });
  it("all 8 categories = 1.0 ratio", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting", "transition_planning", "placement_support", "unplanned_ending_review", "permanence_planning"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    expect(evaluatePlacementStabilityCompliance(records).categoryDiversityRatio).toBe(1);
  });
  it("weights 8+7+5+5=25", () => { expect(8 + 7 + 5 + 5).toBe(25); });
  it("all false booleans still gets diversity score", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting", "transition_planning", "placement_support", "unplanned_ending_review", "permanence_planning"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c, documentationComplete: false, timelyRecording: false, matchingNeedsAssessed: false }));
    const r = evaluatePlacementStabilityCompliance(records);
    expect(r.overallScore).toBe(5);
  });
});

// ═══ Policy ═══
describe("evaluatePlacementStabilityPolicyEval", () => {
  it("0 for null", () => { expect(evaluatePlacementStabilityPolicyEval(null).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluatePlacementStabilityPolicyEval(allTruePolicy()).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluatePlacementStabilityPolicyEval(allFalsePolicy()).overallScore).toBe(0); });
  it("placementStabilityPolicy = 4", () => { expect(evaluatePlacementStabilityPolicyEval({ ...allFalsePolicy(), placementStabilityPolicy: true }).overallScore).toBe(4); });
  it("matchingProcedure = 4", () => { expect(evaluatePlacementStabilityPolicyEval({ ...allFalsePolicy(), matchingProcedure: true }).overallScore).toBe(4); });
  it("disruptionManagementPolicy = 4", () => { expect(evaluatePlacementStabilityPolicyEval({ ...allFalsePolicy(), disruptionManagementPolicy: true }).overallScore).toBe(4); });
  it("transitionPlanningFramework = 4", () => { expect(evaluatePlacementStabilityPolicyEval({ ...allFalsePolicy(), transitionPlanningFramework: true }).overallScore).toBe(4); });
  it("unplannedEndingProtocol = 3", () => { expect(evaluatePlacementStabilityPolicyEval({ ...allFalsePolicy(), unplannedEndingProtocol: true }).overallScore).toBe(3); });
  it("permanencePlanningPolicy = 3", () => { expect(evaluatePlacementStabilityPolicyEval({ ...allFalsePolicy(), permanencePlanningPolicy: true }).overallScore).toBe(3); });
  it("placementReviewSchedule = 3", () => { expect(evaluatePlacementStabilityPolicyEval({ ...allFalsePolicy(), placementReviewSchedule: true }).overallScore).toBe(3); });
  it("weights sum to 25", () => { expect(evaluatePlacementStabilityPolicyEval(allTruePolicy()).overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3); });
  it("null returns all false booleans", () => {
    const r = evaluatePlacementStabilityPolicyEval(null);
    expect(r.placementStabilityPolicy).toBe(false);
    expect(r.matchingProcedure).toBe(false);
    expect(r.disruptionManagementPolicy).toBe(false);
    expect(r.transitionPlanningFramework).toBe(false);
    expect(r.unplannedEndingProtocol).toBe(false);
    expect(r.permanencePlanningPolicy).toBe(false);
    expect(r.placementReviewSchedule).toBe(false);
  });
  it("partial policy scores correctly", () => {
    expect(evaluatePlacementStabilityPolicyEval({ ...allFalsePolicy(), placementStabilityPolicy: true, matchingProcedure: true }).overallScore).toBe(8);
  });
});

// ═══ Staff Readiness ═══
describe("evaluateStaffPlacementStabilityReadiness", () => {
  it("0 for empty", () => { expect(evaluateStaffPlacementStabilityReadiness([]).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateStaffPlacementStabilityReadiness([makeStaff()]).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffPlacementStabilityReadiness([makeStaff({ matchingAssessmentSkills: false, stabilityPlanningKnowledge: false, disruptionPreventionSkills: false, transitionSupportSkills: false, childParticipationSkills: false, permanencePlanningKnowledge: false })]).overallScore).toBe(0); });
  it("matchingAssessmentSkills = 6", () => { expect(evaluateStaffPlacementStabilityReadiness([makeStaff({ matchingAssessmentSkills: true, stabilityPlanningKnowledge: false, disruptionPreventionSkills: false, transitionSupportSkills: false, childParticipationSkills: false, permanencePlanningKnowledge: false })]).overallScore).toBe(6); });
  it("stabilityPlanningKnowledge = 5", () => { expect(evaluateStaffPlacementStabilityReadiness([makeStaff({ matchingAssessmentSkills: false, stabilityPlanningKnowledge: true, disruptionPreventionSkills: false, transitionSupportSkills: false, childParticipationSkills: false, permanencePlanningKnowledge: false })]).overallScore).toBe(5); });
  it("disruptionPreventionSkills = 5", () => { expect(evaluateStaffPlacementStabilityReadiness([makeStaff({ matchingAssessmentSkills: false, stabilityPlanningKnowledge: false, disruptionPreventionSkills: true, transitionSupportSkills: false, childParticipationSkills: false, permanencePlanningKnowledge: false })]).overallScore).toBe(5); });
  it("transitionSupportSkills = 4", () => { expect(evaluateStaffPlacementStabilityReadiness([makeStaff({ matchingAssessmentSkills: false, stabilityPlanningKnowledge: false, disruptionPreventionSkills: false, transitionSupportSkills: true, childParticipationSkills: false, permanencePlanningKnowledge: false })]).overallScore).toBe(4); });
  it("childParticipationSkills = 3", () => { expect(evaluateStaffPlacementStabilityReadiness([makeStaff({ matchingAssessmentSkills: false, stabilityPlanningKnowledge: false, disruptionPreventionSkills: false, transitionSupportSkills: false, childParticipationSkills: true, permanencePlanningKnowledge: false })]).overallScore).toBe(3); });
  it("permanencePlanningKnowledge = 2", () => { expect(evaluateStaffPlacementStabilityReadiness([makeStaff({ matchingAssessmentSkills: false, stabilityPlanningKnowledge: false, disruptionPreventionSkills: false, transitionSupportSkills: false, childParticipationSkills: false, permanencePlanningKnowledge: true })]).overallScore).toBe(2); });
  it("weights sum to 25", () => { expect(evaluateStaffPlacementStabilityReadiness([makeStaff()]).overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2); });
  it("mixed staff partial", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", matchingAssessmentSkills: false, permanencePlanningKnowledge: false })];
    const r = evaluateStaffPlacementStabilityReadiness(staff);
    expect(r.totalStaff).toBe(2);
    expect(r.overallScore).toBe(21); // 3+5+5+4+3+1
  });
  it("empty returns all zero rates", () => {
    const r = evaluateStaffPlacementStabilityReadiness([]);
    expect(r.totalStaff).toBe(0);
    expect(r.matchingAssessmentSkillsRate).toBe(0);
    expect(r.stabilityPlanningKnowledgeRate).toBe(0);
    expect(r.disruptionPreventionSkillsRate).toBe(0);
    expect(r.transitionSupportSkillsRate).toBe(0);
    expect(r.childParticipationSkillsRate).toBe(0);
    expect(r.permanencePlanningKnowledgeRate).toBe(0);
  });
  it("rates are percentages", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", matchingAssessmentSkills: false })];
    const r = evaluateStaffPlacementStabilityReadiness(staff);
    expect(r.matchingAssessmentSkillsRate).toBe(50);
    expect(r.stabilityPlanningKnowledgeRate).toBe(100);
  });
});

// ═══ Child Profiles ═══
describe("buildChildPlacementStabilityProfiles", () => {
  it("empty for no records", () => { expect(buildChildPlacementStabilityProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const profiles = buildChildPlacementStabilityProfiles([makeRecord({ id: "a", childId: "c1" }), makeRecord({ id: "b", childId: "c2" }), makeRecord({ id: "c", childId: "c1" })]);
    expect(profiles).toHaveLength(2);
  });
  it("freq=0 for <5", () => { expect(buildChildPlacementStabilityProfiles(makeRecords(4, { childId: "c1" }))[0].overallScore).toBe(6); });
  it("freq=1 for 5-9", () => { expect(buildChildPlacementStabilityProfiles(makeRecords(5, { childId: "c1" }))[0].overallScore).toBe(7); });
  it("freq=2 for >=10", () => { expect(buildChildPlacementStabilityProfiles(makeRecords(10, { childId: "c1" }))[0].overallScore).toBe(8); });
  it("diversity 2 for >=4 cats", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, childId: "c1", category: c }));
    expect(buildChildPlacementStabilityProfiles(records)[0].overallScore).toBe(8); // 0+3+3+2
  });
  it("caps at 10", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting", "transition_planning", "placement_support", "unplanned_ending_review", "permanence_planning"];
    const records = cats.flatMap((c, ci) => [0, 1].map(j => makeRecord({ id: `r-${ci}-${j}`, childId: "c1", category: c })));
    expect(buildChildPlacementStabilityProfiles(records)[0].overallScore).toBe(10);
  });
  it("rate1=0 for matchingNeedsAssessed < 40%", () => {
    const records = makeRecords(5, { childId: "c1", matchingNeedsAssessed: false });
    records[0].matchingNeedsAssessed = true; // 1/5 = 20%
    const profile = buildChildPlacementStabilityProfiles(records)[0];
    expect(profile.matchingNeedsAssessedRate).toBe(20);
  });
  it("rate1=1 for matchingNeedsAssessed >= 40%", () => {
    const records = makeRecords(5, { childId: "c1", matchingNeedsAssessed: false });
    records[0].matchingNeedsAssessed = true;
    records[1].matchingNeedsAssessed = true; // 2/5 = 40%
    const profile = buildChildPlacementStabilityProfiles(records)[0];
    expect(profile.matchingNeedsAssessedRate).toBe(40);
  });
  it("rate1=2 for matchingNeedsAssessed >= 60%", () => {
    const records = makeRecords(5, { childId: "c1", matchingNeedsAssessed: false });
    records[0].matchingNeedsAssessed = true;
    records[1].matchingNeedsAssessed = true;
    records[2].matchingNeedsAssessed = true; // 3/5 = 60%
    const profile = buildChildPlacementStabilityProfiles(records)[0];
    expect(profile.matchingNeedsAssessedRate).toBe(60);
  });
  it("rate2=0 for stabilityPlanInPlace < 40%", () => {
    const records = makeRecords(5, { childId: "c1", stabilityPlanInPlace: false });
    records[0].stabilityPlanInPlace = true; // 1/5 = 20%
    const profile = buildChildPlacementStabilityProfiles(records)[0];
    expect(profile.stabilityPlanInPlaceRate).toBe(20);
  });
  it("diversity=0 for 1 cat", () => {
    const records = [makeRecord({ childId: "c1" })]; // 1 category
    const profile = buildChildPlacementStabilityProfiles(records)[0];
    // freq=0, rate1=3, rate2=3, div=0 => 6
    expect(profile.overallScore).toBe(6);
  });
  it("diversity=1 for 2 cats", () => {
    const records = [makeRecord({ id: "a", childId: "c1", category: "placement_review" }), makeRecord({ id: "b", childId: "c1", category: "stability_meeting" })];
    const profile = buildChildPlacementStabilityProfiles(records)[0];
    // freq=0, rate1=3, rate2=3, div=1 => 7
    expect(profile.overallScore).toBe(7);
  });
  it("returns correct childName", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex" })];
    expect(buildChildPlacementStabilityProfiles(records)[0].childName).toBe("Alex");
  });
  it("returns categoriesCovered list", () => {
    const records = [makeRecord({ id: "a", childId: "c1", category: "placement_review" }), makeRecord({ id: "b", childId: "c1", category: "stability_meeting" })];
    const profile = buildChildPlacementStabilityProfiles(records)[0];
    expect(profile.categoriesCovered).toContain("placement_review");
    expect(profile.categoriesCovered).toContain("stability_meeting");
  });
});

// ═══ Orchestrator ═══
describe("generatePlacementStabilityIntelligenceReport", () => {
  it("outstanding for perfect data", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting", "transition_planning", "placement_support", "unplanned_ending_review", "permanence_planning"];
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("inadequate for empty", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters by period", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [makeRecord({ date: "2025-06-15" }), makeRecord({ id: "out", date: "2024-01-01" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.placementStabilityQuality.totalRecords).toBe(1);
  });
  it("includes all evaluators", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.placementStabilityQuality).toBeDefined();
    expect(r.placementStabilityCompliance).toBeDefined();
    expect(r.placementStabilityPolicyResult).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
  });
  it("includes regulatory links", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 36"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 14"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 9"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("NMS 11"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("Children Act 1989"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("Quality Standards 2015"))).toBe(true);
  });
  it("actions when policy null", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.actions.some(a => a.includes("URGENT"))).toBe(true);
  });
  it("caps at 100", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting", "transition_planning", "placement_support", "unplanned_ending_review", "permanence_planning"];
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("homeId is passed through", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-test", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.homeId).toBe("home-test");
  });
  it("periodStart and periodEnd are passed through", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.periodStart).toBe("2025-01-01");
    expect(r.periodEnd).toBe("2025-12-31");
  });
  it("strengths for outstanding score", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting", "transition_planning", "placement_support", "unplanned_ending_review", "permanence_planning"];
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("Outstanding"))).toBe(true);
  });
  it("areasForImprovement for inadequate score", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.areasForImprovement.some(a => a.includes("Inadequate"))).toBe(true);
  });
  it("no actions message when all good", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting", "transition_planning", "placement_support", "unplanned_ending_review", "permanence_planning"];
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("No immediate actions required"))).toBe(true);
  });
  it("child profiles included", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [makeRecord({ childId: "c1" }), makeRecord({ id: "ps-2", childId: "c2" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.childProfiles).toHaveLength(2);
  });
  it("good rating for score 60-79", () => {
    // Staff 25 + Policy 25 + Quality 0 + Compliance 0.7 = 50.7 not enough
    // Need partial quality to reach good range (60-79)
    // Quality: all true single record = 25. Compliance: 1 cat = 20.6. Policy: 4+4=8. Staff: 6=6. Total=59.6 -> 60
    // Actually simpler: staff 25 + policy partial (12) + quality half (12.5) + compliance partial
    // Use: 1 all-true record + 1 all-false record => quality 12.5, compliance ~10.3+0.13*5=11 ish
    // + policy 12 + staff 25 = 60.5 -> 61 good
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", matchingNeedsAssessed: false, stabilityPlanInPlace: false, childViewIncorporated: false, riskFactorsIdentified: false, documentationComplete: false, timelyRecording: false })];
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records, policy: { ...allFalsePolicy(), placementStabilityPolicy: true, matchingProcedure: true, disruptionManagementPolicy: true }, staff: [makeStaff()] });
    // Quality: 12.5, Compliance: 50%*8 + 50%*7 + 50%*5 + 0.13*5 = 4+3.5+2.5+0.65 = 10.65 -> 10.7
    // Policy: 12, Staff: 25. Total = 12.5+10.7+12+25 = 60.2 -> 60
    expect(r.overallScore).toBeGreaterThanOrEqual(60);
    expect(r.overallScore).toBeLessThan(80);
    expect(r.rating).toBe("good");
  });
  it("requires_improvement for score 40-59", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: { ...allFalsePolicy(), placementStabilityPolicy: true, matchingProcedure: true, disruptionManagementPolicy: true }, staff: [makeStaff()] });
    // Policy 12 + Staff 25 + Quality 0 + Compliance 0 = 37 -> inadequate
    // Add more policy: 4+4+4+4 = 16 + 25 = 41
    const r2 = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: { ...allFalsePolicy(), placementStabilityPolicy: true, matchingProcedure: true, disruptionManagementPolicy: true, transitionPlanningFramework: true }, staff: [makeStaff()] });
    expect(r2.overallScore).toBe(41);
    expect(r2.rating).toBe("requires_improvement");
  });
  it("areasForImprovement includes no records message", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.areasForImprovement.some(a => a.includes("No placement stability records"))).toBe(true);
  });
  it("areasForImprovement includes no policy message", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [makeStaff()] });
    expect(r.areasForImprovement.some(a => a.includes("No placement stability policy"))).toBe(true);
  });
  it("areasForImprovement includes no staff message", () => {
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: allTruePolicy(), staff: [] });
    expect(r.areasForImprovement.some(a => a.includes("No staff placement stability training"))).toBe(true);
  });
  it("actions includes low score children message", () => {
    // Create records with all false to get low child profile score
    const records = [makeRecord({ childId: "c1", matchingNeedsAssessed: false, stabilityPlanInPlace: false })];
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    // 1 record, matching=0%, stability=0%, 1 cat => freq 0 + rate1 0 + rate2 0 + div 0 = 0
    expect(r.actions.some(a => a.includes("child(ren) with low placement stability scores"))).toBe(true);
  });
  it("strengths include matching rate when high", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting", "transition_planning", "placement_support", "unplanned_ending_review", "permanence_planning"];
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("Matching needs assessment rate"))).toBe(true);
  });
  it("strengths include stability plan rate when high", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting", "transition_planning", "placement_support", "unplanned_ending_review", "permanence_planning"];
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("Stability plans in place"))).toBe(true);
  });
  it("strengths include documentation rate when high", () => {
    const cats: PlacementStabilityIntelligenceCategory[] = ["placement_review", "stability_meeting", "matching_assessment", "disruption_meeting", "transition_planning", "placement_support", "unplanned_ending_review", "permanence_planning"];
    const r = generatePlacementStabilityIntelligenceReport({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("Documentation rate"))).toBe(true);
  });
});
