import { describe, it, expect } from "vitest";
import {
  generateLocationAssessmentIntelligence, evaluateAssessmentQuality, evaluateAssessmentCompliance,
  evaluateLocationPolicy, evaluateStaffLocationReadiness, buildChildLocationProfiles, pct, getRating,
  getCategoryLabel, getOutcomeLabel, getRatingLabel,
} from "../location-engine";
import type { LocationAssessmentRecord, LocationPolicy, StaffLocationTraining } from "../location-engine";

let _id = 0;
function makeRecord(overrides: Partial<LocationAssessmentRecord> = {}): LocationAssessmentRecord {
  _id++;
  return { id: `la-${_id}`, childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-01", category: "transport_links", thoroughAssessment: true, childViewIncorporated: true, riskIdentified: true, mitigationsDocumented: true, documentationComplete: true, regulatoryAligned: true, ...overrides };
}
function makePolicy(overrides: Partial<LocationPolicy> = {}): LocationPolicy {
  return { id: "lp-1", locationAssessmentPolicy: true, communityRiskFramework: true, transportAccessPlan: true, serviceProximityGuidelines: true, environmentalSafetyProtocol: true, annualReviewSchedule: true, stakeholderConsultation: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffLocationTraining> = {}): StaffLocationTraining {
  _tid++;
  return { id: `lt-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, riskAssessmentSkills: true, communityMapping: true, safeguardingAwareness: true, regulatoryKnowledge: true, childConsultation: true, reportWriting: true, ...overrides };
}

// ── pct ──────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(0, 0)).toBe(0); });
  it("returns 100 for equal", () => { expect(pct(5, 5)).toBe(100); });
  it("returns 0 for num=0", () => { expect(pct(0, 10)).toBe(0); });
  it("rounds correctly", () => { expect(pct(1, 3)).toBe(33); });
  it("handles large numbers", () => { expect(pct(999, 1000)).toBe(100); });
});

// ── getRating ────────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
  it("boundary at 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(79)).toBe("good"); });
  it("boundary at 60", () => { expect(getRating(60)).toBe("good"); expect(getRating(59)).toBe("requires_improvement"); });
  it("boundary at 40", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(39)).toBe("inadequate"); });
});

// ── Label getters ────────────────────────────────────────────────────────────

describe("getCategoryLabel", () => {
  it("returns all category labels", () => {
    expect(getCategoryLabel("transport_links")).toBe("Transport Links");
    expect(getCategoryLabel("education_access")).toBe("Education Access");
    expect(getCategoryLabel("health_services")).toBe("Health Services");
    expect(getCategoryLabel("community_safety")).toBe("Community Safety");
    expect(getCategoryLabel("recreational_facilities")).toBe("Recreational Facilities");
    expect(getCategoryLabel("cultural_diversity")).toBe("Cultural Diversity");
    expect(getCategoryLabel("environmental_quality")).toBe("Environmental Quality");
    expect(getCategoryLabel("emergency_services")).toBe("Emergency Services");
  });
});

describe("getOutcomeLabel", () => {
  it("returns all outcome labels", () => {
    expect(getOutcomeLabel("fully_adequate")).toBe("Fully Adequate");
    expect(getOutcomeLabel("mostly_adequate")).toBe("Mostly Adequate");
    expect(getOutcomeLabel("partially_adequate")).toBe("Partially Adequate");
    expect(getOutcomeLabel("inadequate")).toBe("Inadequate");
    expect(getOutcomeLabel("not_assessed")).toBe("Not Assessed");
  });
});

describe("getRatingLabel", () => {
  it("returns all rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateAssessmentQuality ────────────────────────────────────────────────

describe("evaluateAssessmentQuality", () => {
  it("returns 0 for empty", () => {
    const r = evaluateAssessmentQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
    expect(r.thoroughRate).toBe(0);
    expect(r.childViewRate).toBe(0);
    expect(r.riskIdentifiedRate).toBe(0);
    expect(r.mitigationsRate).toBe(0);
  });

  it("scores 25 for perfect records", () => {
    expect(evaluateAssessmentQuality(Array.from({ length: 10 }, () => makeRecord())).overallScore).toBe(25);
  });

  it("scores 0 for all-false records", () => {
    const r = evaluateAssessmentQuality([makeRecord({ thoroughAssessment: false, childViewIncorporated: false, riskIdentified: false, mitigationsDocumented: false })]);
    expect(r.overallScore).toBe(0);
  });

  it("calculates thorough rate", () => {
    const records = [makeRecord({ thoroughAssessment: true }), makeRecord({ thoroughAssessment: false })];
    expect(evaluateAssessmentQuality(records).thoroughRate).toBe(50);
  });

  it("calculates child view rate", () => {
    const records = [makeRecord({ childViewIncorporated: true }), makeRecord({ childViewIncorporated: true }), makeRecord({ childViewIncorporated: false })];
    expect(evaluateAssessmentQuality(records).childViewRate).toBe(67);
  });

  it("calculates risk identified rate", () => {
    const records = [makeRecord({ riskIdentified: true }), makeRecord({ riskIdentified: false }), makeRecord({ riskIdentified: false })];
    expect(evaluateAssessmentQuality(records).riskIdentifiedRate).toBe(33);
  });

  it("calculates mitigations rate", () => {
    const records = Array.from({ length: 4 }, () => makeRecord({ mitigationsDocumented: true })).concat([makeRecord({ mitigationsDocumented: false })]);
    expect(evaluateAssessmentQuality(records).mitigationsRate).toBe(80);
  });

  it("caps at 25", () => {
    expect(evaluateAssessmentQuality(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25);
  });

  it("scores lower with poor quality", () => {
    const good = evaluateAssessmentQuality(Array.from({ length: 5 }, () => makeRecord()));
    const bad = evaluateAssessmentQuality(Array.from({ length: 5 }, () => makeRecord({ thoroughAssessment: false, childViewIncorporated: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });

  it("returns correct totalRecords", () => {
    expect(evaluateAssessmentQuality([makeRecord(), makeRecord(), makeRecord()]).totalRecords).toBe(3);
  });

  it("mixed quality produces mid-range score", () => {
    const records = [
      makeRecord({ thoroughAssessment: true, childViewIncorporated: true, riskIdentified: true, mitigationsDocumented: true }),
      makeRecord({ thoroughAssessment: false, childViewIncorporated: false, riskIdentified: false, mitigationsDocumented: false }),
    ];
    const r = evaluateAssessmentQuality(records);
    expect(r.overallScore).toBeGreaterThan(5);
    expect(r.overallScore).toBeLessThan(20);
  });
});

// ── evaluateAssessmentCompliance ─────────────────────────────────────────────

describe("evaluateAssessmentCompliance", () => {
  it("returns 0 for empty", () => {
    const r = evaluateAssessmentCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.documentationRate).toBe(0);
    expect(r.regulatoryRate).toBe(0);
    expect(r.mitigationsRate).toBe(0);
    expect(r.categoryDiversityRatio).toBe(0);
  });

  it("calculates documentation rate", () => {
    const records = [makeRecord({ documentationComplete: true }), makeRecord({ documentationComplete: false })];
    expect(evaluateAssessmentCompliance(records).documentationRate).toBe(50);
  });

  it("calculates regulatory rate", () => {
    const records = [makeRecord({ regulatoryAligned: true }), makeRecord({ regulatoryAligned: false }), makeRecord({ regulatoryAligned: true })];
    expect(evaluateAssessmentCompliance(records).regulatoryRate).toBe(67);
  });

  it("calculates mitigations rate", () => {
    const records = Array.from({ length: 3 }, () => makeRecord({ mitigationsDocumented: true })).concat([makeRecord({ mitigationsDocumented: false })]);
    expect(evaluateAssessmentCompliance(records).mitigationsRate).toBe(75);
  });

  it("calculates category diversity ratio", () => {
    const records = [makeRecord({ category: "transport_links" }), makeRecord({ category: "transport_links" })];
    expect(evaluateAssessmentCompliance(records).categoryDiversityRatio).toBe(13);
  });

  it("high diversity for many categories", () => {
    const categories = ["transport_links", "education_access", "health_services", "community_safety", "recreational_facilities", "cultural_diversity", "environmental_quality", "emergency_services"] as const;
    const records = categories.map((c) => makeRecord({ category: c }));
    expect(evaluateAssessmentCompliance(records).categoryDiversityRatio).toBe(100);
  });

  it("caps at 25", () => {
    expect(evaluateAssessmentCompliance(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25);
  });

  it("scores 0 for all-false", () => {
    const r = evaluateAssessmentCompliance([makeRecord({ documentationComplete: false, regulatoryAligned: false, mitigationsDocumented: false })]);
    expect(r.documentationRate).toBe(0);
    expect(r.regulatoryRate).toBe(0);
  });
});

// ── evaluateLocationPolicy ───────────────────────────────────────────────────

describe("evaluateLocationPolicy", () => {
  it("returns 0 for null", () => {
    const r = evaluateLocationPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.locationAssessmentPolicy).toBe(false);
    expect(r.communityRiskFramework).toBe(false);
    expect(r.transportAccessPlan).toBe(false);
    expect(r.serviceProximityGuidelines).toBe(false);
    expect(r.environmentalSafetyProtocol).toBe(false);
    expect(r.annualReviewSchedule).toBe(false);
    expect(r.stakeholderConsultation).toBe(false);
  });

  it("scores 25 for full policy", () => {
    expect(evaluateLocationPolicy(makePolicy()).overallScore).toBe(25);
  });

  it("4-point items individually", () => {
    expect(evaluateLocationPolicy(makePolicy({ locationAssessmentPolicy: true, communityRiskFramework: false, transportAccessPlan: false, serviceProximityGuidelines: false, environmentalSafetyProtocol: false, annualReviewSchedule: false, stakeholderConsultation: false })).overallScore).toBe(4);
  });

  it("3-point items individually", () => {
    expect(evaluateLocationPolicy(makePolicy({ locationAssessmentPolicy: false, communityRiskFramework: false, transportAccessPlan: false, serviceProximityGuidelines: false, environmentalSafetyProtocol: true, annualReviewSchedule: false, stakeholderConsultation: false })).overallScore).toBe(3);
  });

  it("4-point items = 16", () => {
    expect(evaluateLocationPolicy(makePolicy({ environmentalSafetyProtocol: false, annualReviewSchedule: false, stakeholderConsultation: false })).overallScore).toBe(16);
  });

  it("3-point items = 9", () => {
    expect(evaluateLocationPolicy(makePolicy({ locationAssessmentPolicy: false, communityRiskFramework: false, transportAccessPlan: false, serviceProximityGuidelines: false })).overallScore).toBe(9);
  });

  it("all false = 0", () => {
    expect(evaluateLocationPolicy(makePolicy({ locationAssessmentPolicy: false, communityRiskFramework: false, transportAccessPlan: false, serviceProximityGuidelines: false, environmentalSafetyProtocol: false, annualReviewSchedule: false, stakeholderConsultation: false })).overallScore).toBe(0);
  });

  it("partial policy scores correctly", () => {
    const r = evaluateLocationPolicy(makePolicy({ locationAssessmentPolicy: true, communityRiskFramework: true, transportAccessPlan: false, serviceProximityGuidelines: false, environmentalSafetyProtocol: true, annualReviewSchedule: false, stakeholderConsultation: false }));
    expect(r.overallScore).toBe(11); // 4+4+3 = 11
  });

  it("preserves boolean values in result", () => {
    const r = evaluateLocationPolicy(makePolicy({ locationAssessmentPolicy: true, communityRiskFramework: false }));
    expect(r.locationAssessmentPolicy).toBe(true);
    expect(r.communityRiskFramework).toBe(false);
  });
});

// ── evaluateStaffLocationReadiness ───────────────────────────────────────────

describe("evaluateStaffLocationReadiness", () => {
  it("returns 0 for empty", () => {
    const r = evaluateStaffLocationReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.riskAssessmentRate).toBe(0);
    expect(r.communityMappingRate).toBe(0);
    expect(r.safeguardingRate).toBe(0);
    expect(r.regulatoryRate).toBe(0);
    expect(r.childConsultationRate).toBe(0);
    expect(r.reportWritingRate).toBe(0);
  });

  it("scores 25 for fully trained", () => {
    expect(evaluateStaffLocationReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25);
  });

  it("scores 0 for untrained", () => {
    expect(evaluateStaffLocationReadiness([makeTraining({ riskAssessmentSkills: false, communityMapping: false, safeguardingAwareness: false, regulatoryKnowledge: false, childConsultation: false, reportWriting: false })]).overallScore).toBe(0);
  });

  it("single fully trained = 25", () => {
    expect(evaluateStaffLocationReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("caps at 25", () => {
    expect(evaluateStaffLocationReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25);
  });

  it("partial training gives partial score", () => {
    const training = [makeTraining({ riskAssessmentSkills: true, communityMapping: true, safeguardingAwareness: false, regulatoryKnowledge: false, childConsultation: false, reportWriting: false })];
    const r = evaluateStaffLocationReadiness(training);
    expect(r.overallScore).toBe(11); // 6+5 = 11
    expect(r.riskAssessmentRate).toBe(100);
    expect(r.communityMappingRate).toBe(100);
    expect(r.safeguardingRate).toBe(0);
  });

  it("calculates rates for mixed staff", () => {
    const training = [
      makeTraining({ riskAssessmentSkills: true, communityMapping: true, safeguardingAwareness: true, regulatoryKnowledge: true, childConsultation: true, reportWriting: true }),
      makeTraining({ riskAssessmentSkills: false, communityMapping: false, safeguardingAwareness: false, regulatoryKnowledge: false, childConsultation: false, reportWriting: false }),
    ];
    const r = evaluateStaffLocationReadiness(training);
    expect(r.riskAssessmentRate).toBe(50);
    expect(r.communityMappingRate).toBe(50);
    expect(r.totalStaff).toBe(2);
  });

  it("reports correct totalStaff count", () => {
    expect(evaluateStaffLocationReadiness([makeTraining(), makeTraining(), makeTraining()]).totalStaff).toBe(3);
  });
});

// ── buildChildLocationProfiles ───────────────────────────────────────────────

describe("buildChildLocationProfiles", () => {
  it("returns empty for no records", () => {
    expect(buildChildLocationProfiles([]).length).toBe(0);
  });

  it("groups by child", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex" }), makeRecord({ childId: "c2", childName: "Jordan" })];
    expect(buildChildLocationProfiles(records).length).toBe(2);
  });

  it("calculates thorough rate", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex", thoroughAssessment: true }), makeRecord({ childId: "c1", childName: "Alex", thoroughAssessment: false })];
    expect(buildChildLocationProfiles(records)[0].thoroughRate).toBe(50);
  });

  it("calculates child view rate", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex", childViewIncorporated: true }), makeRecord({ childId: "c1", childName: "Alex", childViewIncorporated: false })];
    expect(buildChildLocationProfiles(records)[0].childViewRate).toBe(50);
  });

  it("diversity bonus for 4+ categories", () => {
    const categories = ["transport_links", "education_access", "health_services", "community_safety"] as const;
    const records = categories.map((c) => makeRecord({ childId: "c1", childName: "Alex", category: c }));
    expect(buildChildLocationProfiles(records)[0].overallScore).toBeGreaterThanOrEqual(5);
  });

  it("caps at 10", () => {
    const records = Array.from({ length: 15 }, () => makeRecord({ childId: "c1", childName: "Alex" }));
    expect(buildChildLocationProfiles(records)[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("frequency score for >= 10 records", () => {
    const records = Array.from({ length: 10 }, () => makeRecord({ childId: "c1", childName: "Alex" }));
    const profile = buildChildLocationProfiles(records)[0];
    expect(profile.totalAssessments).toBe(10);
    expect(profile.overallScore).toBeGreaterThanOrEqual(5);
  });

  it("frequency score for >= 5 records", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ childId: "c1", childName: "Alex" }));
    const profile = buildChildLocationProfiles(records)[0];
    expect(profile.totalAssessments).toBe(5);
  });

  it("low frequency score for < 5 records", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex" })];
    const profile = buildChildLocationProfiles(records)[0];
    expect(profile.totalAssessments).toBe(1);
  });

  it("diversity bonus for 2+ categories", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex", category: "transport_links" }),
      makeRecord({ childId: "c1", childName: "Alex", category: "education_access" }),
    ];
    const profile = buildChildLocationProfiles(records)[0];
    expect(profile.overallScore).toBeGreaterThanOrEqual(1);
  });

  it("no diversity bonus for single category", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex", category: "transport_links", thoroughAssessment: false, childViewIncorporated: false }),
    ];
    const profile = buildChildLocationProfiles(records)[0];
    expect(profile.overallScore).toBeLessThanOrEqual(2);
  });
});

// ── generateLocationAssessmentIntelligence ───────────────────────────────────

describe("generateLocationAssessmentIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-20" };

  it("returns inadequate for empty", () => {
    const r = generateLocationAssessmentIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("returns outstanding for perfect", () => {
    const categories = ["transport_links", "education_access", "health_services", "community_safety", "recreational_facilities", "cultural_diversity", "environmental_quality", "emergency_services"] as const;
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ category: categories[i % 8] }));
    const r = generateLocationAssessmentIntelligence(records, makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });

  it("caps at 100", () => {
    const categories = ["transport_links", "education_access", "health_services", "community_safety", "recreational_facilities", "cultural_diversity", "environmental_quality", "emergency_services"] as const;
    const r = generateLocationAssessmentIntelligence(Array.from({ length: 20 }, (_, i) => makeRecord({ category: categories[i % 8] })), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes homeId and period", () => {
    const r = generateLocationAssessmentIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-06-30");
  });

  it("generates strength for high thoroughness", () => {
    const r = generateLocationAssessmentIntelligence(Array.from({ length: 5 }, () => makeRecord()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("thorough"))).toBe(true);
  });

  it("generates strength for high child view rate", () => {
    const r = generateLocationAssessmentIntelligence(Array.from({ length: 5 }, () => makeRecord()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("Children's views"))).toBe(true);
  });

  it("generates action for no records", () => {
    const r = generateLocationAssessmentIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No location assessment records"))).toBe(true);
  });

  it("generates URGENT for no policy", () => {
    const r = generateLocationAssessmentIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT for no training", () => {
    const r = generateLocationAssessmentIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("has 7 regulatory links", () => {
    const r = generateLocationAssessmentIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("good rating for ~75", () => {
    const r = generateLocationAssessmentIntelligence(Array.from({ length: 5 }, () => makeRecord()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.rating).toBe("good");
  });

  it("areas for improvement when thoroughness is low", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ thoroughAssessment: false }));
    const r = generateLocationAssessmentIntelligence(records, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("thoroughness"))).toBe(true);
  });

  it("areas for improvement when child view is low", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ childViewIncorporated: false }));
    const r = generateLocationAssessmentIntelligence(records, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("Children's views"))).toBe(true);
  });

  it("includes child profiles in result", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex" }), makeRecord({ childId: "c2", childName: "Jordan" })];
    const r = generateLocationAssessmentIntelligence(records, makePolicy(), [makeTraining()], b.homeId, b.periodStart, b.periodEnd);
    expect(r.childProfiles.length).toBe(2);
  });

  it("no areas for improvement when no records", () => {
    const r = generateLocationAssessmentIntelligence([], makePolicy(), [makeTraining()], b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.length).toBe(0);
  });

  it("sums evaluator scores correctly", () => {
    const records = Array.from({ length: 5 }, () => makeRecord());
    const r = generateLocationAssessmentIntelligence(records, makePolicy(), [makeTraining()], b.homeId, b.periodStart, b.periodEnd);
    const expectedSum = r.assessmentQuality.overallScore + r.assessmentCompliance.overallScore + r.locationPolicy.overallScore + r.staffLocationReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(100, expectedSum));
  });

  it("action for low risk identification", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ riskIdentified: false, thoroughAssessment: false, childViewIncorporated: false, mitigationsDocumented: false }));
    const r = generateLocationAssessmentIntelligence(records, makePolicy(), [makeTraining()], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("risk identification"))).toBe(true);
  });

  it("action for low documentation", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ documentationComplete: false, regulatoryAligned: false, mitigationsDocumented: false }));
    const r = generateLocationAssessmentIntelligence(records, makePolicy(), [makeTraining()], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("documentation completeness"))).toBe(true);
  });
});
