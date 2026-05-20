import { describe, it, expect } from "vitest";
import {
  pct, getRating, getChildrenOutcomesCategoryLabel, getChildrenOutcomesOutcomeLabel, getRatingLabel,
  evaluateChildrenOutcomesQuality, evaluateChildrenOutcomesCompliance, evaluateChildrenOutcomesPolicy,
  evaluateStaffChildrenOutcomesReadiness, buildChildOutcomesProfiles, generateChildrenOutcomesIntelligence,
} from "../children-outcomes-intelligence-engine";
import type {
  ChildrenOutcomesRecord, ChildrenOutcomesPolicy, StaffChildrenOutcomesTraining,
  ChildrenOutcomesCategory, ChildrenOutcomesOutcome, Rating,
} from "../children-outcomes-intelligence-engine";

function makeRecord(overrides: Partial<ChildrenOutcomesRecord> = {}): ChildrenOutcomesRecord {
  return { id: "co-1", homeId: "home-oak", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "educational_achievement", outcome: "good_progress", outcomeMeasured: true, progressEvidenced: true, interventionAligned: true, voiceOfChildCaptured: true, documentationComplete: true, timelyRecording: true, ...overrides };
}
function makeRecords(n: number, o: Partial<ChildrenOutcomesRecord> = {}): ChildrenOutcomesRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `co-${i}`, ...o }));
}
function allTruePolicy(): ChildrenOutcomesPolicy {
  return { outcomesFrameworkPolicy: true, progressTrackingPolicy: true, educationSupportPolicy: true, healthWellbeingPolicy: true, independentLivingSkillsPolicy: true, voiceOfChildPolicy: true, multiAgencyOutcomesPolicy: true };
}
function allFalsePolicy(): ChildrenOutcomesPolicy {
  return { outcomesFrameworkPolicy: false, progressTrackingPolicy: false, educationSupportPolicy: false, healthWellbeingPolicy: false, independentLivingSkillsPolicy: false, voiceOfChildPolicy: false, multiAgencyOutcomesPolicy: false };
}
function makeStaff(o: Partial<StaffChildrenOutcomesTraining> = {}): StaffChildrenOutcomesTraining {
  return { staffId: "s1", outcomesFrameworkKnowledge: true, progressTrackingSkills: true, therapeuticInterventions: true, educationalSupportSkills: true, voiceOfChildTechniques: true, multiAgencyCollaboration: true, ...o };
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
describe("getChildrenOutcomesCategoryLabel", () => {
  const cases: [ChildrenOutcomesCategory, string][] = [
    ["educational_achievement", "Educational Achievement"], ["health_wellbeing", "Health & Wellbeing"],
    ["emotional_development", "Emotional Development"], ["social_skills", "Social Skills"],
    ["independent_living", "Independent Living"], ["identity_belonging", "Identity & Belonging"],
    ["positive_relationships", "Positive Relationships"], ["safety_stability", "Safety & Stability"],
  ];
  it.each(cases)("%s → %s", (c, l) => { expect(getChildrenOutcomesCategoryLabel(c)).toBe(l); });
});

describe("getChildrenOutcomesOutcomeLabel", () => {
  const cases: [ChildrenOutcomesOutcome, string][] = [
    ["exceptional_progress", "Exceptional Progress"], ["good_progress", "Good Progress"],
    ["steady_progress", "Steady Progress"], ["limited_progress", "Limited Progress"], ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s → %s", (o, l) => { expect(getChildrenOutcomesOutcomeLabel(o)).toBe(l); });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [["outstanding", "Outstanding"], ["good", "Good"], ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"]];
  it.each(cases)("%s → %s", (r, l) => { expect(getRatingLabel(r)).toBe(l); });
});

// ═══ Quality ═══
describe("evaluateChildrenOutcomesQuality", () => {
  it("0 for empty", () => { const r = evaluateChildrenOutcomesQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("25 for perfect", () => { const r = evaluateChildrenOutcomesQuality(makeRecords(5)); expect(r.overallScore).toBe(25); });
  it("0 for all-false", () => { const r = evaluateChildrenOutcomesQuality(makeRecords(3, { outcomeMeasured: false, progressEvidenced: false, interventionAligned: false, voiceOfChildCaptured: false })); expect(r.overallScore).toBe(0); });
  it("weight 7 for outcomeMeasured", () => { expect(evaluateChildrenOutcomesQuality([makeRecord({ outcomeMeasured: true, progressEvidenced: false, interventionAligned: false, voiceOfChildCaptured: false })]).overallScore).toBe(7); });
  it("weight 6 for progressEvidenced", () => { expect(evaluateChildrenOutcomesQuality([makeRecord({ outcomeMeasured: false, progressEvidenced: true, interventionAligned: false, voiceOfChildCaptured: false })]).overallScore).toBe(6); });
  it("weight 6 for interventionAligned", () => { expect(evaluateChildrenOutcomesQuality([makeRecord({ outcomeMeasured: false, progressEvidenced: false, interventionAligned: true, voiceOfChildCaptured: false })]).overallScore).toBe(6); });
  it("weight 6 for voiceOfChildCaptured", () => { expect(evaluateChildrenOutcomesQuality([makeRecord({ outcomeMeasured: false, progressEvidenced: false, interventionAligned: false, voiceOfChildCaptured: true })]).overallScore).toBe(6); });
  it("50% partial = 12.5", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", outcomeMeasured: false, progressEvidenced: false, interventionAligned: false, voiceOfChildCaptured: false })];
    expect(evaluateChildrenOutcomesQuality(records).overallScore).toBe(12.5);
  });
  it("caps at 25", () => { expect(evaluateChildrenOutcomesQuality(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
});

// ═══ Compliance ═══
describe("evaluateChildrenOutcomesCompliance", () => {
  it("0 for empty", () => { expect(evaluateChildrenOutcomesCompliance([]).overallScore).toBe(0); });
  it("25 for perfect with all 8 categories", () => {
    const cats: ChildrenOutcomesCategory[] = ["educational_achievement", "health_wellbeing", "emotional_development", "social_skills", "independent_living", "identity_belonging", "positive_relationships", "safety_stability"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    expect(evaluateChildrenOutcomesCompliance(records).overallScore).toBe(25);
  });
  it("4/8 categories = 0.5 ratio", () => {
    const cats: ChildrenOutcomesCategory[] = ["educational_achievement", "health_wellbeing", "emotional_development", "social_skills"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluateChildrenOutcomesCompliance(records);
    expect(r.uniqueCategories).toBe(4);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });
  it("single category = 0.13 ratio", () => { expect(evaluateChildrenOutcomesCompliance(makeRecords(5)).categoryDiversityRatio).toBe(0.13); });
  it("caps at 25", () => { expect(evaluateChildrenOutcomesCompliance(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
});

// ═══ Policy ═══
describe("evaluateChildrenOutcomesPolicy", () => {
  it("0 for null", () => { expect(evaluateChildrenOutcomesPolicy(null).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateChildrenOutcomesPolicy(allTruePolicy()).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateChildrenOutcomesPolicy(allFalsePolicy()).overallScore).toBe(0); });
  it("outcomesFrameworkPolicy = 4", () => { expect(evaluateChildrenOutcomesPolicy({ ...allFalsePolicy(), outcomesFrameworkPolicy: true }).overallScore).toBe(4); });
  it("progressTrackingPolicy = 4", () => { expect(evaluateChildrenOutcomesPolicy({ ...allFalsePolicy(), progressTrackingPolicy: true }).overallScore).toBe(4); });
  it("educationSupportPolicy = 4", () => { expect(evaluateChildrenOutcomesPolicy({ ...allFalsePolicy(), educationSupportPolicy: true }).overallScore).toBe(4); });
  it("healthWellbeingPolicy = 4", () => { expect(evaluateChildrenOutcomesPolicy({ ...allFalsePolicy(), healthWellbeingPolicy: true }).overallScore).toBe(4); });
  it("independentLivingSkillsPolicy = 3", () => { expect(evaluateChildrenOutcomesPolicy({ ...allFalsePolicy(), independentLivingSkillsPolicy: true }).overallScore).toBe(3); });
  it("voiceOfChildPolicy = 3", () => { expect(evaluateChildrenOutcomesPolicy({ ...allFalsePolicy(), voiceOfChildPolicy: true }).overallScore).toBe(3); });
  it("multiAgencyOutcomesPolicy = 3", () => { expect(evaluateChildrenOutcomesPolicy({ ...allFalsePolicy(), multiAgencyOutcomesPolicy: true }).overallScore).toBe(3); });
  it("weights sum to 25", () => { expect(evaluateChildrenOutcomesPolicy(allTruePolicy()).overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3); });
});

// ═══ Staff Readiness ═══
describe("evaluateStaffChildrenOutcomesReadiness", () => {
  it("0 for empty", () => { expect(evaluateStaffChildrenOutcomesReadiness([]).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateStaffChildrenOutcomesReadiness([makeStaff()]).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffChildrenOutcomesReadiness([makeStaff({ outcomesFrameworkKnowledge: false, progressTrackingSkills: false, therapeuticInterventions: false, educationalSupportSkills: false, voiceOfChildTechniques: false, multiAgencyCollaboration: false })]).overallScore).toBe(0); });
  it("outcomesFrameworkKnowledge = 6", () => { expect(evaluateStaffChildrenOutcomesReadiness([makeStaff({ outcomesFrameworkKnowledge: true, progressTrackingSkills: false, therapeuticInterventions: false, educationalSupportSkills: false, voiceOfChildTechniques: false, multiAgencyCollaboration: false })]).overallScore).toBe(6); });
  it("progressTrackingSkills = 5", () => { expect(evaluateStaffChildrenOutcomesReadiness([makeStaff({ outcomesFrameworkKnowledge: false, progressTrackingSkills: true, therapeuticInterventions: false, educationalSupportSkills: false, voiceOfChildTechniques: false, multiAgencyCollaboration: false })]).overallScore).toBe(5); });
  it("therapeuticInterventions = 5", () => { expect(evaluateStaffChildrenOutcomesReadiness([makeStaff({ outcomesFrameworkKnowledge: false, progressTrackingSkills: false, therapeuticInterventions: true, educationalSupportSkills: false, voiceOfChildTechniques: false, multiAgencyCollaboration: false })]).overallScore).toBe(5); });
  it("educationalSupportSkills = 4", () => { expect(evaluateStaffChildrenOutcomesReadiness([makeStaff({ outcomesFrameworkKnowledge: false, progressTrackingSkills: false, therapeuticInterventions: false, educationalSupportSkills: true, voiceOfChildTechniques: false, multiAgencyCollaboration: false })]).overallScore).toBe(4); });
  it("voiceOfChildTechniques = 3", () => { expect(evaluateStaffChildrenOutcomesReadiness([makeStaff({ outcomesFrameworkKnowledge: false, progressTrackingSkills: false, therapeuticInterventions: false, educationalSupportSkills: false, voiceOfChildTechniques: true, multiAgencyCollaboration: false })]).overallScore).toBe(3); });
  it("multiAgencyCollaboration = 2", () => { expect(evaluateStaffChildrenOutcomesReadiness([makeStaff({ outcomesFrameworkKnowledge: false, progressTrackingSkills: false, therapeuticInterventions: false, educationalSupportSkills: false, voiceOfChildTechniques: false, multiAgencyCollaboration: true })]).overallScore).toBe(2); });
  it("weights sum to 25", () => { expect(evaluateStaffChildrenOutcomesReadiness([makeStaff()]).overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2); });
  it("mixed staff partial", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", outcomesFrameworkKnowledge: false, multiAgencyCollaboration: false })];
    const r = evaluateStaffChildrenOutcomesReadiness(staff);
    expect(r.totalStaff).toBe(2);
    expect(r.overallScore).toBe(21); // 3+5+5+4+3+1
  });
});

// ═══ Child Profiles ═══
describe("buildChildOutcomesProfiles", () => {
  it("empty for no records", () => { expect(buildChildOutcomesProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const profiles = buildChildOutcomesProfiles([makeRecord({ id: "a", childId: "c1" }), makeRecord({ id: "b", childId: "c2" }), makeRecord({ id: "c", childId: "c1" })]);
    expect(profiles).toHaveLength(2);
  });
  it("freq=0 for <5", () => { expect(buildChildOutcomesProfiles(makeRecords(4, { childId: "c1" }))[0].overallScore).toBe(6); });
  it("freq=1 for 5-9", () => { expect(buildChildOutcomesProfiles(makeRecords(5, { childId: "c1" }))[0].overallScore).toBe(7); });
  it("freq=2 for >=10", () => { expect(buildChildOutcomesProfiles(makeRecords(10, { childId: "c1" }))[0].overallScore).toBe(8); });
  it("diversity 2 for >=4 cats", () => {
    const cats: ChildrenOutcomesCategory[] = ["educational_achievement", "health_wellbeing", "emotional_development", "social_skills"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, childId: "c1", category: c }));
    expect(buildChildOutcomesProfiles(records)[0].overallScore).toBe(8); // 0+3+3+2
  });
  it("caps at 10", () => {
    const cats: ChildrenOutcomesCategory[] = ["educational_achievement", "health_wellbeing", "emotional_development", "social_skills", "independent_living", "identity_belonging", "positive_relationships", "safety_stability"];
    const records = cats.flatMap((c, ci) => [0, 1].map(j => makeRecord({ id: `r-${ci}-${j}`, childId: "c1", category: c })));
    expect(buildChildOutcomesProfiles(records)[0].overallScore).toBe(10);
  });
});

// ═══ Orchestrator ═══
describe("generateChildrenOutcomesIntelligence", () => {
  it("outstanding for perfect data", () => {
    const cats: ChildrenOutcomesCategory[] = ["educational_achievement", "health_wellbeing", "emotional_development", "social_skills", "independent_living", "identity_belonging", "positive_relationships", "safety_stability"];
    const r = generateChildrenOutcomesIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("inadequate for empty", () => {
    const r = generateChildrenOutcomesIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters by period", () => {
    const r = generateChildrenOutcomesIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ date: "2026-06-15" }), makeRecord({ id: "out", date: "2025-01-01" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.childrenOutcomesQuality.totalRecords).toBe(1);
  });
  it("includes all evaluators", () => {
    const r = generateChildrenOutcomesIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.childrenOutcomesQuality).toBeDefined();
    expect(r.childrenOutcomesCompliance).toBeDefined();
    expect(r.childrenOutcomesPolicy).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
  });
  it("includes regulatory links", () => {
    const r = generateChildrenOutcomesIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 6"))).toBe(true);
  });
  it("actions when policy null", () => {
    const r = generateChildrenOutcomesIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.actions.some(a => a.includes("URGENT"))).toBe(true);
  });
});
