import { describe, it, expect } from "vitest";
import {
  pct, getRating, getContextualSafeguardingCategoryLabel, getContextualSafeguardingOutcomeLabel, getRatingLabel,
  evaluateContextualSafeguardingQuality, evaluateContextualSafeguardingCompliance, evaluateContextualSafeguardingPolicy,
  evaluateStaffContextualSafeguardingReadiness, buildChildContextualSafeguardingProfiles, generateContextualSafeguardingIntelligence,
} from "../contextual-safeguarding-intelligence-engine";
import type {
  ContextualSafeguardingRecord, ContextualSafeguardingPolicy, StaffContextualSafeguardingTraining,
  ContextualSafeguardingCategory, ContextualSafeguardingOutcome, Rating,
} from "../contextual-safeguarding-intelligence-engine";

function makeRecord(overrides: Partial<ContextualSafeguardingRecord> = {}): ContextualSafeguardingRecord {
  return { id: "cs-1", homeId: "home-oak", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "peer_risk_assessment", outcome: "no_risk_identified", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: true, safetyPlanInPlace: true, documentationComplete: true, timelyRecording: true, ...overrides };
}
function makeRecords(n: number, o: Partial<ContextualSafeguardingRecord> = {}): ContextualSafeguardingRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `cs-${i}`, ...o }));
}
function allTruePolicy(): ContextualSafeguardingPolicy {
  return { contextualSafeguardingPolicy: true, peerRiskAssessmentPolicy: true, onlineSafetyPolicy: true, exploitationScreeningPolicy: true, communityMappingPolicy: true, multiAgencyProtocol: true, safetyPlanningPolicy: true };
}
function allFalsePolicy(): ContextualSafeguardingPolicy {
  return { contextualSafeguardingPolicy: false, peerRiskAssessmentPolicy: false, onlineSafetyPolicy: false, exploitationScreeningPolicy: false, communityMappingPolicy: false, multiAgencyProtocol: false, safetyPlanningPolicy: false };
}
function makeStaff(o: Partial<StaffContextualSafeguardingTraining> = {}): StaffContextualSafeguardingTraining {
  return { staffId: "s1", contextualSafeguardingKnowledge: true, exploitationAwareness: true, onlineSafetyCompetency: true, multiAgencyWorkingSkills: true, riskAssessmentSkills: true, safetyPlanningSkills: true, ...o };
}

// ═══ pct ═══
describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("100 for 1/1", () => { expect(pct(1, 1)).toBe(100); });
  it("rounds 2/3 to 67", () => { expect(pct(2, 3)).toBe(67); });
  it("rounds 1/3 to 33", () => { expect(pct(1, 3)).toBe(33); });
});

// ═══ getRating ═══
describe("getRating", () => {
  it("outstanding ≥80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); });
  it("inadequate <40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ═══ Labels ═══
describe("getContextualSafeguardingCategoryLabel", () => {
  const cases: [ContextualSafeguardingCategory, string][] = [
    ["peer_risk_assessment", "Peer Risk Assessment"], ["environmental_mapping", "Environmental Mapping"],
    ["online_safety_assessment", "Online Safety Assessment"], ["gang_exploitation_screening", "Gang/Exploitation Screening"],
    ["county_lines_assessment", "County Lines Assessment"], ["community_risk_mapping", "Community Risk Mapping"],
    ["family_network_analysis", "Family Network Analysis"], ["school_safety_assessment", "School Safety Assessment"],
  ];
  it.each(cases)("%s → %s", (c, l) => { expect(getContextualSafeguardingCategoryLabel(c)).toBe(l); });
});

describe("getContextualSafeguardingOutcomeLabel", () => {
  const cases: [ContextualSafeguardingOutcome, string][] = [
    ["no_risk_identified", "No Risk Identified"], ["low_risk", "Low Risk"], ["moderate_risk", "Moderate Risk"],
    ["high_risk", "High Risk"], ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s → %s", (o, l) => { expect(getContextualSafeguardingOutcomeLabel(o)).toBe(l); });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [["outstanding", "Outstanding"], ["good", "Good"], ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"]];
  it.each(cases)("%s → %s", (r, l) => { expect(getRatingLabel(r)).toBe(l); });
});

// ═══ Quality ═══
describe("evaluateContextualSafeguardingQuality", () => {
  it("0 for empty", () => { const r = evaluateContextualSafeguardingQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("25 for perfect", () => { expect(evaluateContextualSafeguardingQuality(makeRecords(5)).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateContextualSafeguardingQuality(makeRecords(3, { riskAssessmentCompleted: false, protectiveFactorsIdentified: false, multiAgencyInvolved: false, safetyPlanInPlace: false })).overallScore).toBe(0); });
  it("weight 7 for riskAssessmentCompleted", () => { expect(evaluateContextualSafeguardingQuality([makeRecord({ riskAssessmentCompleted: true, protectiveFactorsIdentified: false, multiAgencyInvolved: false, safetyPlanInPlace: false })]).overallScore).toBe(7); });
  it("weight 6 for protectiveFactorsIdentified", () => { expect(evaluateContextualSafeguardingQuality([makeRecord({ riskAssessmentCompleted: false, protectiveFactorsIdentified: true, multiAgencyInvolved: false, safetyPlanInPlace: false })]).overallScore).toBe(6); });
  it("weight 6 for multiAgencyInvolved", () => { expect(evaluateContextualSafeguardingQuality([makeRecord({ riskAssessmentCompleted: false, protectiveFactorsIdentified: false, multiAgencyInvolved: true, safetyPlanInPlace: false })]).overallScore).toBe(6); });
  it("weight 6 for safetyPlanInPlace", () => { expect(evaluateContextualSafeguardingQuality([makeRecord({ riskAssessmentCompleted: false, protectiveFactorsIdentified: false, multiAgencyInvolved: false, safetyPlanInPlace: true })]).overallScore).toBe(6); });
  it("50% partial = 12.5", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", riskAssessmentCompleted: false, protectiveFactorsIdentified: false, multiAgencyInvolved: false, safetyPlanInPlace: false })];
    expect(evaluateContextualSafeguardingQuality(records).overallScore).toBe(12.5);
  });
  it("caps at 25", () => { expect(evaluateContextualSafeguardingQuality(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
});

// ═══ Compliance ═══
describe("evaluateContextualSafeguardingCompliance", () => {
  it("0 for empty", () => { expect(evaluateContextualSafeguardingCompliance([]).overallScore).toBe(0); });
  it("25 for perfect with 8 categories", () => {
    const cats: ContextualSafeguardingCategory[] = ["peer_risk_assessment", "environmental_mapping", "online_safety_assessment", "gang_exploitation_screening", "county_lines_assessment", "community_risk_mapping", "family_network_analysis", "school_safety_assessment"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    expect(evaluateContextualSafeguardingCompliance(records).overallScore).toBe(25);
  });
  it("4/8 = 0.5 ratio", () => {
    const cats: ContextualSafeguardingCategory[] = ["peer_risk_assessment", "environmental_mapping", "online_safety_assessment", "gang_exploitation_screening"];
    const r = evaluateContextualSafeguardingCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })));
    expect(r.uniqueCategories).toBe(4);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });
  it("single category = 0.13", () => { expect(evaluateContextualSafeguardingCompliance(makeRecords(5)).categoryDiversityRatio).toBe(0.13); });
  it("caps at 25", () => { expect(evaluateContextualSafeguardingCompliance(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
});

// ═══ Policy ═══
describe("evaluateContextualSafeguardingPolicy", () => {
  it("0 for null", () => { expect(evaluateContextualSafeguardingPolicy(null).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateContextualSafeguardingPolicy(allTruePolicy()).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateContextualSafeguardingPolicy(allFalsePolicy()).overallScore).toBe(0); });
  it("contextualSafeguardingPolicy = 4", () => { expect(evaluateContextualSafeguardingPolicy({ ...allFalsePolicy(), contextualSafeguardingPolicy: true }).overallScore).toBe(4); });
  it("peerRiskAssessmentPolicy = 4", () => { expect(evaluateContextualSafeguardingPolicy({ ...allFalsePolicy(), peerRiskAssessmentPolicy: true }).overallScore).toBe(4); });
  it("onlineSafetyPolicy = 4", () => { expect(evaluateContextualSafeguardingPolicy({ ...allFalsePolicy(), onlineSafetyPolicy: true }).overallScore).toBe(4); });
  it("exploitationScreeningPolicy = 4", () => { expect(evaluateContextualSafeguardingPolicy({ ...allFalsePolicy(), exploitationScreeningPolicy: true }).overallScore).toBe(4); });
  it("communityMappingPolicy = 3", () => { expect(evaluateContextualSafeguardingPolicy({ ...allFalsePolicy(), communityMappingPolicy: true }).overallScore).toBe(3); });
  it("multiAgencyProtocol = 3", () => { expect(evaluateContextualSafeguardingPolicy({ ...allFalsePolicy(), multiAgencyProtocol: true }).overallScore).toBe(3); });
  it("safetyPlanningPolicy = 3", () => { expect(evaluateContextualSafeguardingPolicy({ ...allFalsePolicy(), safetyPlanningPolicy: true }).overallScore).toBe(3); });
  it("weights sum to 25", () => { expect(evaluateContextualSafeguardingPolicy(allTruePolicy()).overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3); });
});

// ═══ Staff Readiness ═══
describe("evaluateStaffContextualSafeguardingReadiness", () => {
  it("0 for empty", () => { expect(evaluateStaffContextualSafeguardingReadiness([]).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateStaffContextualSafeguardingReadiness([makeStaff()]).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffContextualSafeguardingReadiness([makeStaff({ contextualSafeguardingKnowledge: false, exploitationAwareness: false, onlineSafetyCompetency: false, multiAgencyWorkingSkills: false, riskAssessmentSkills: false, safetyPlanningSkills: false })]).overallScore).toBe(0); });
  it("contextualSafeguardingKnowledge = 6", () => { expect(evaluateStaffContextualSafeguardingReadiness([makeStaff({ contextualSafeguardingKnowledge: true, exploitationAwareness: false, onlineSafetyCompetency: false, multiAgencyWorkingSkills: false, riskAssessmentSkills: false, safetyPlanningSkills: false })]).overallScore).toBe(6); });
  it("exploitationAwareness = 5", () => { expect(evaluateStaffContextualSafeguardingReadiness([makeStaff({ contextualSafeguardingKnowledge: false, exploitationAwareness: true, onlineSafetyCompetency: false, multiAgencyWorkingSkills: false, riskAssessmentSkills: false, safetyPlanningSkills: false })]).overallScore).toBe(5); });
  it("onlineSafetyCompetency = 5", () => { expect(evaluateStaffContextualSafeguardingReadiness([makeStaff({ contextualSafeguardingKnowledge: false, exploitationAwareness: false, onlineSafetyCompetency: true, multiAgencyWorkingSkills: false, riskAssessmentSkills: false, safetyPlanningSkills: false })]).overallScore).toBe(5); });
  it("multiAgencyWorkingSkills = 4", () => { expect(evaluateStaffContextualSafeguardingReadiness([makeStaff({ contextualSafeguardingKnowledge: false, exploitationAwareness: false, onlineSafetyCompetency: false, multiAgencyWorkingSkills: true, riskAssessmentSkills: false, safetyPlanningSkills: false })]).overallScore).toBe(4); });
  it("riskAssessmentSkills = 3", () => { expect(evaluateStaffContextualSafeguardingReadiness([makeStaff({ contextualSafeguardingKnowledge: false, exploitationAwareness: false, onlineSafetyCompetency: false, multiAgencyWorkingSkills: false, riskAssessmentSkills: true, safetyPlanningSkills: false })]).overallScore).toBe(3); });
  it("safetyPlanningSkills = 2", () => { expect(evaluateStaffContextualSafeguardingReadiness([makeStaff({ contextualSafeguardingKnowledge: false, exploitationAwareness: false, onlineSafetyCompetency: false, multiAgencyWorkingSkills: false, riskAssessmentSkills: false, safetyPlanningSkills: true })]).overallScore).toBe(2); });
  it("weights sum to 25", () => { expect(evaluateStaffContextualSafeguardingReadiness([makeStaff()]).overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2); });
  it("mixed staff", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", contextualSafeguardingKnowledge: false, safetyPlanningSkills: false })];
    expect(evaluateStaffContextualSafeguardingReadiness(staff).overallScore).toBe(21);
  });
});

// ═══ Child Profiles ═══
describe("buildChildContextualSafeguardingProfiles", () => {
  it("empty for no records", () => { expect(buildChildContextualSafeguardingProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const profiles = buildChildContextualSafeguardingProfiles([makeRecord({ id: "a", childId: "c1" }), makeRecord({ id: "b", childId: "c2" }), makeRecord({ id: "c", childId: "c1" })]);
    expect(profiles).toHaveLength(2);
  });
  it("freq=0 for <5", () => { expect(buildChildContextualSafeguardingProfiles(makeRecords(4, { childId: "c1" }))[0].overallScore).toBe(6); });
  it("freq=1 for 5-9", () => { expect(buildChildContextualSafeguardingProfiles(makeRecords(5, { childId: "c1" }))[0].overallScore).toBe(7); });
  it("freq=2 for >=10", () => { expect(buildChildContextualSafeguardingProfiles(makeRecords(10, { childId: "c1" }))[0].overallScore).toBe(8); });
  it("diversity 2 for >=4 cats", () => {
    const cats: ContextualSafeguardingCategory[] = ["peer_risk_assessment", "environmental_mapping", "online_safety_assessment", "gang_exploitation_screening"];
    expect(buildChildContextualSafeguardingProfiles(cats.map((c, i) => makeRecord({ id: `r-${i}`, childId: "c1", category: c })))[0].overallScore).toBe(8);
  });
  it("caps at 10", () => {
    const cats: ContextualSafeguardingCategory[] = ["peer_risk_assessment", "environmental_mapping", "online_safety_assessment", "gang_exploitation_screening", "county_lines_assessment", "community_risk_mapping", "family_network_analysis", "school_safety_assessment"];
    expect(buildChildContextualSafeguardingProfiles(cats.flatMap((c, ci) => [0, 1].map(j => makeRecord({ id: `r-${ci}-${j}`, childId: "c1", category: c }))))[0].overallScore).toBe(10);
  });
});

// ═══ Orchestrator ═══
describe("generateContextualSafeguardingIntelligence", () => {
  it("outstanding for perfect data", () => {
    const cats: ContextualSafeguardingCategory[] = ["peer_risk_assessment", "environmental_mapping", "online_safety_assessment", "gang_exploitation_screening", "county_lines_assessment", "community_risk_mapping", "family_network_analysis", "school_safety_assessment"];
    const r = generateContextualSafeguardingIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("inadequate for empty", () => {
    const r = generateContextualSafeguardingIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters by period", () => {
    const r = generateContextualSafeguardingIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ date: "2026-06-15" }), makeRecord({ id: "out", date: "2025-01-01" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.contextualSafeguardingQuality.totalRecords).toBe(1);
  });
  it("includes all evaluators", () => {
    const r = generateContextualSafeguardingIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.contextualSafeguardingQuality).toBeDefined();
    expect(r.contextualSafeguardingCompliance).toBeDefined();
    expect(r.contextualSafeguardingPolicy).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
  });
  it("includes regulatory links", () => {
    const r = generateContextualSafeguardingIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 34"))).toBe(true);
  });
  it("actions when policy null", () => {
    const r = generateContextualSafeguardingIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.actions.some(a => a.includes("URGENT"))).toBe(true);
  });
});
