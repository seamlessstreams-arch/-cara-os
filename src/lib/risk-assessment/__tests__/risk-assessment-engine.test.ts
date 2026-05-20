import { describe, it, expect } from "vitest";
import {
  pct, getRating, getRiskAssessmentCategoryLabel, getRiskAssessmentOutcomeLabel, getRatingLabel,
  evaluateRiskAssessmentQuality, evaluateRiskAssessmentCompliance, evaluateRiskAssessmentPolicy,
  evaluateStaffRiskAssessmentReadiness, buildChildRiskAssessmentProfiles, generateRiskAssessmentIntelligence,
} from "../risk-assessment-engine";
import type { RiskAssessmentRecord, RiskAssessmentPolicy, StaffRiskAssessmentTraining } from "../risk-assessment-engine";

function makeRecord(overrides: Partial<RiskAssessmentRecord> = {}): RiskAssessmentRecord {
  return { id: "ra-001", homeId: "home-oak", date: "2026-05-01", childId: "child-alex", childName: "Alex", category: "initial_assessment", outcome: "risk_reduced", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true, ...overrides };
}
function makeFullPolicy(): RiskAssessmentPolicy {
  return { riskAssessmentPolicy: true, dynamicRiskUpdatePolicy: true, positiveRiskTakingPolicy: true, incidentTriggeredReviewPolicy: true, communityRiskPolicy: true, environmentalRiskPolicy: true, multiAgencyRiskSharingPolicy: true };
}
function makeFullStaff(): StaffRiskAssessmentTraining {
  return { staffId: "staff-sarah", riskAssessmentSkills: true, dynamicRiskManagement: true, positiveRiskTaking: true, incidentRiskAnalysis: true, childViewInRisk: true, multiAgencyRiskSharing: true };
}

// ── pct ───────────────────────────────────────────────────────────────────
describe("pct", () => {
  it("returns 0 when denominator is 0", () => expect(pct(5, 0)).toBe(0));
  it("returns 100 for perfect ratio", () => expect(pct(10, 10)).toBe(100));
  it("returns 50 for half", () => expect(pct(5, 10)).toBe(50));
  it("rounds correctly", () => { expect(pct(1, 3)).toBe(33); expect(pct(2, 3)).toBe(67); });
  it("returns 0 for 0 numerator", () => expect(pct(0, 10)).toBe(0));
});

// ── getRating ─────────────────────────────────────────────────────────────
describe("getRating", () => {
  it("returns outstanding for >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("returns good for >= 60", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("returns requires_improvement for >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ── Label helpers ─────────────────────────────────────────────────────────
describe("getRiskAssessmentCategoryLabel", () => {
  it("maps initial_assessment", () => expect(getRiskAssessmentCategoryLabel("initial_assessment")).toBe("Initial Assessment"));
  it("maps all 8 categories", () => {
    const cats = ["initial_assessment", "review_assessment", "dynamic_risk_update", "positive_risk_taking", "incident_triggered", "placement_risk", "community_risk", "environmental_risk"] as const;
    for (const c of cats) expect(getRiskAssessmentCategoryLabel(c)).toBeTruthy();
  });
});
describe("getRiskAssessmentOutcomeLabel", () => {
  it("maps risk_reduced", () => expect(getRiskAssessmentOutcomeLabel("risk_reduced")).toBe("Risk Reduced"));
  it("maps all 5 outcomes", () => {
    const outcomes = ["risk_reduced", "risk_maintained", "risk_increased", "controls_adequate", "not_applicable"] as const;
    for (const o of outcomes) expect(getRiskAssessmentOutcomeLabel(o)).toBeTruthy();
  });
});
describe("getRatingLabel", () => {
  it("maps outstanding", () => expect(getRatingLabel("outstanding")).toBe("Outstanding"));
  it("maps requires_improvement", () => expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement"));
});

// ── Evaluator 1: Quality ─────────────────────────────────────────────────
describe("evaluateRiskAssessmentQuality", () => {
  it("scores 25 for perfect records", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `ra-${i}` }));
    const result = evaluateRiskAssessmentQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.controlMeasuresIdentifiedRate).toBe(100);
  });
  it("scores 0 for empty records", () => {
    const result = evaluateRiskAssessmentQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
  });
  it("scores 0 for all-false quality flags", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `ra-${i}`, controlMeasuresIdentified: false, childViewIncluded: false, reviewDateSet: false, multiAgencyInput: false }));
    expect(evaluateRiskAssessmentQuality(records).overallScore).toBe(0);
  });
  it("weights controlMeasuresIdentified highest (7)", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `ra-${i}`, controlMeasuresIdentified: true, childViewIncluded: false, reviewDateSet: false, multiAgencyInput: false }));
    expect(evaluateRiskAssessmentQuality(records).overallScore).toBe(7);
  });
  it("handles mixed data", () => {
    const records = [makeRecord({ id: "ra-1" }), makeRecord({ id: "ra-2", childViewIncluded: false, multiAgencyInput: false })];
    const result = evaluateRiskAssessmentQuality(records);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });
  it("returns correct totalRecords", () => {
    const records = Array.from({ length: 7 }, (_, i) => makeRecord({ id: `ra-${i}` }));
    expect(evaluateRiskAssessmentQuality(records).totalRecords).toBe(7);
  });
});

// ── Evaluator 2: Compliance ──────────────────────────────────────────────
describe("evaluateRiskAssessmentCompliance", () => {
  it("scores 25 for perfect records with all categories", () => {
    const cats = ["initial_assessment", "review_assessment", "dynamic_risk_update", "positive_risk_taking", "incident_triggered", "placement_risk", "community_risk", "environmental_risk"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `ra-${i}`, category: cat }));
    const result = evaluateRiskAssessmentCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.categoryDiversityRatio).toBe(100);
  });
  it("scores 0 for empty records", () => expect(evaluateRiskAssessmentCompliance([]).overallScore).toBe(0));
  it("calculates category diversity correctly", () => {
    const records = [makeRecord({ id: "ra-1", category: "initial_assessment" }), makeRecord({ id: "ra-2", category: "review_assessment" }), makeRecord({ id: "ra-3", category: "dynamic_risk_update" }), makeRecord({ id: "ra-4", category: "positive_risk_taking" })];
    expect(evaluateRiskAssessmentCompliance(records).categoryDiversityRatio).toBe(50);
  });
});

// ── Evaluator 3: Policy ──────────────────────────────────────────────────
describe("evaluateRiskAssessmentPolicy", () => {
  it("scores 25 for all true", () => expect(evaluateRiskAssessmentPolicy(makeFullPolicy()).overallScore).toBe(25));
  it("scores 0 for null", () => {
    const result = evaluateRiskAssessmentPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.riskAssessmentPolicy).toBe(false);
  });
  it("scores 0 for all false", () => expect(evaluateRiskAssessmentPolicy({ riskAssessmentPolicy: false, dynamicRiskUpdatePolicy: false, positiveRiskTakingPolicy: false, incidentTriggeredReviewPolicy: false, communityRiskPolicy: false, environmentalRiskPolicy: false, multiAgencyRiskSharingPolicy: false }).overallScore).toBe(0));
  it("first 4 booleans weighted at 4 each", () => {
    const result = evaluateRiskAssessmentPolicy({ riskAssessmentPolicy: true, dynamicRiskUpdatePolicy: true, positiveRiskTakingPolicy: true, incidentTriggeredReviewPolicy: true, communityRiskPolicy: false, environmentalRiskPolicy: false, multiAgencyRiskSharingPolicy: false });
    expect(result.overallScore).toBe(16);
  });
  it("last 3 booleans weighted at 3 each", () => {
    const result = evaluateRiskAssessmentPolicy({ riskAssessmentPolicy: false, dynamicRiskUpdatePolicy: false, positiveRiskTakingPolicy: false, incidentTriggeredReviewPolicy: false, communityRiskPolicy: true, environmentalRiskPolicy: true, multiAgencyRiskSharingPolicy: true });
    expect(result.overallScore).toBe(9);
  });
  it("preserves boolean values in result", () => {
    const policy = { ...makeFullPolicy(), multiAgencyRiskSharingPolicy: false };
    const result = evaluateRiskAssessmentPolicy(policy);
    expect(result.multiAgencyRiskSharingPolicy).toBe(false);
    expect(result.riskAssessmentPolicy).toBe(true);
  });
});

// ── Evaluator 4: Staff Readiness ─────────────────────────────────────────
describe("evaluateStaffRiskAssessmentReadiness", () => {
  it("scores 25 for all-skilled staff", () => {
    const staff = [makeFullStaff(), { ...makeFullStaff(), staffId: "staff-tom" }];
    expect(evaluateStaffRiskAssessmentReadiness(staff).overallScore).toBe(25);
  });
  it("scores 0 for empty staff", () => {
    const result = evaluateStaffRiskAssessmentReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });
  it("scores 0 for all-false skills", () => {
    const staff: StaffRiskAssessmentTraining[] = [{ staffId: "s", riskAssessmentSkills: false, dynamicRiskManagement: false, positiveRiskTaking: false, incidentRiskAnalysis: false, childViewInRisk: false, multiAgencyRiskSharing: false }];
    expect(evaluateStaffRiskAssessmentReadiness(staff).overallScore).toBe(0);
  });
  it("weights riskAssessmentSkills highest (6)", () => {
    const staff: StaffRiskAssessmentTraining[] = [{ staffId: "s", riskAssessmentSkills: true, dynamicRiskManagement: false, positiveRiskTaking: false, incidentRiskAnalysis: false, childViewInRisk: false, multiAgencyRiskSharing: false }];
    expect(evaluateStaffRiskAssessmentReadiness(staff).overallScore).toBe(6);
  });
  it("weights multiAgencyRiskSharing lowest (2)", () => {
    const staff: StaffRiskAssessmentTraining[] = [{ staffId: "s", riskAssessmentSkills: false, dynamicRiskManagement: false, positiveRiskTaking: false, incidentRiskAnalysis: false, childViewInRisk: false, multiAgencyRiskSharing: true }];
    expect(evaluateStaffRiskAssessmentReadiness(staff).overallScore).toBe(2);
  });
  it("handles mixed skills", () => {
    const staff: StaffRiskAssessmentTraining[] = [makeFullStaff(), { ...makeFullStaff(), staffId: "staff-tom", riskAssessmentSkills: false, positiveRiskTaking: false }];
    const result = evaluateStaffRiskAssessmentReadiness(staff);
    expect(result.riskAssessmentSkillsRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });
});

// ── Child Profiles ───────────────────────────────────────────────────────
describe("buildChildRiskAssessmentProfiles", () => {
  it("returns empty array for no records", () => expect(buildChildRiskAssessmentProfiles([])).toEqual([]));
  it("groups by childId", () => {
    const records = [makeRecord({ id: "ra-1", childId: "child-alex" }), makeRecord({ id: "ra-2", childId: "child-jordan", childName: "Jordan" }), makeRecord({ id: "ra-3", childId: "child-alex" })];
    expect(buildChildRiskAssessmentProfiles(records)).toHaveLength(2);
  });
  it("scores 10 for perfect child", () => {
    const cats = ["initial_assessment", "review_assessment", "dynamic_risk_update", "positive_risk_taking", "incident_triggered"] as const;
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `ra-${i}`, category: cats[i % cats.length] }));
    expect(buildChildRiskAssessmentProfiles(records)[0].overallScore).toBe(10);
  });
  it("scores frequency correctly", () => {
    const records = Array.from({ length: 3 }, (_, i) => makeRecord({ id: `ra-${i}` }));
    // 3 records → freq:0 + rate1:3 + rate2:3 + diversity:0 = 6
    expect(buildChildRiskAssessmentProfiles(records)[0].overallScore).toBe(6);
  });
  it("sorts by overallScore descending", () => {
    const records = [
      makeRecord({ id: "ra-1", childId: "child-alex", childName: "Alex" }),
      ...Array.from({ length: 10 }, (_, i) => makeRecord({ id: `ra-j${i}`, childId: "child-jordan", childName: "Jordan", category: (["initial_assessment", "review_assessment", "dynamic_risk_update", "positive_risk_taking"] as const)[i % 4] })),
    ];
    expect(buildChildRiskAssessmentProfiles(records)[0].childId).toBe("child-jordan");
  });
  it("caps at 10", () => {
    const cats = ["initial_assessment", "review_assessment", "dynamic_risk_update", "positive_risk_taking", "incident_triggered", "placement_risk"] as const;
    const records = Array.from({ length: 15 }, (_, i) => makeRecord({ id: `ra-${i}`, category: cats[i % cats.length] }));
    expect(buildChildRiskAssessmentProfiles(records)[0].overallScore).toBeLessThanOrEqual(10);
  });
});

// ── Orchestrator ──────────────────────────────────────────────────────────
describe("generateRiskAssessmentIntelligence", () => {
  it("returns outstanding for perfect data", () => {
    const cats = ["initial_assessment", "review_assessment", "dynamic_risk_update", "positive_risk_taking", "incident_triggered", "placement_risk", "community_risk", "environmental_risk"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `ra-${i}`, category: cat }));
    const result = generateRiskAssessmentIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20", records, policy: makeFullPolicy(), staff: [makeFullStaff()] });
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("returns inadequate for empty data", () => {
    const result = generateRiskAssessmentIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20", records: [], policy: null, staff: [] });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("returns good for decent data", () => {
    const records = [
      makeRecord({ id: "ra-1", category: "initial_assessment" }),
      makeRecord({ id: "ra-2", category: "review_assessment", childViewIncluded: false }),
      makeRecord({ id: "ra-3", category: "dynamic_risk_update", multiAgencyInput: false }),
      makeRecord({ id: "ra-4", category: "positive_risk_taking", reviewDateSet: false, timelyRecording: false }),
      makeRecord({ id: "ra-5", category: "incident_triggered", controlMeasuresIdentified: false, documentationComplete: false }),
      makeRecord({ id: "ra-6", category: "initial_assessment", childViewIncluded: false, multiAgencyInput: false }),
    ];
    const policy: RiskAssessmentPolicy = { riskAssessmentPolicy: true, dynamicRiskUpdatePolicy: true, positiveRiskTakingPolicy: true, incidentTriggeredReviewPolicy: false, communityRiskPolicy: true, environmentalRiskPolicy: false, multiAgencyRiskSharingPolicy: false };
    const staff = [makeFullStaff(), { ...makeFullStaff(), staffId: "staff-tom", riskAssessmentSkills: false, positiveRiskTaking: false, multiAgencyRiskSharing: false }];
    const result = generateRiskAssessmentIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20", records, policy, staff });
    expect(result.rating).toBe("good");
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
  });

  it("returns requires_improvement for weak data", () => {
    const records = [
      makeRecord({ id: "ra-1", category: "initial_assessment", controlMeasuresIdentified: false, multiAgencyInput: false, reviewDateSet: false, documentationComplete: false }),
      makeRecord({ id: "ra-2", category: "review_assessment", childViewIncluded: false, multiAgencyInput: false, timelyRecording: false }),
      makeRecord({ id: "ra-3", category: "dynamic_risk_update", controlMeasuresIdentified: false, childViewIncluded: false, reviewDateSet: false, documentationComplete: false, timelyRecording: false }),
      makeRecord({ id: "ra-4", category: "positive_risk_taking", multiAgencyInput: false, reviewDateSet: false }),
      makeRecord({ id: "ra-5", category: "incident_triggered" }),
    ];
    const policy: RiskAssessmentPolicy = { riskAssessmentPolicy: true, dynamicRiskUpdatePolicy: true, positiveRiskTakingPolicy: true, incidentTriggeredReviewPolicy: false, communityRiskPolicy: false, environmentalRiskPolicy: false, multiAgencyRiskSharingPolicy: false };
    const staff: StaffRiskAssessmentTraining[] = [{ staffId: "s", riskAssessmentSkills: true, dynamicRiskManagement: true, positiveRiskTaking: false, incidentRiskAnalysis: false, childViewInRisk: true, multiAgencyRiskSharing: false }];
    const result = generateRiskAssessmentIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20", records, policy, staff });
    expect(result.rating).toBe("requires_improvement");
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.overallScore).toBeLessThan(60);
  });

  it("caps at 100", () => {
    const cats = ["initial_assessment", "review_assessment", "dynamic_risk_update", "positive_risk_taking", "incident_triggered", "placement_risk", "community_risk", "environmental_risk"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `ra-${i}`, category: cat }));
    const result = generateRiskAssessmentIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20", records, policy: makeFullPolicy(), staff: [makeFullStaff()] });
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates strengths and actions", () => {
    const cats = ["initial_assessment", "review_assessment", "dynamic_risk_update", "positive_risk_taking", "incident_triggered", "placement_risk", "community_risk", "environmental_risk"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `ra-${i}`, category: cat }));
    const result = generateRiskAssessmentIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20", records, policy: makeFullPolicy(), staff: [makeFullStaff()] });
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes URGENT actions for empty records", () => {
    const result = generateRiskAssessmentIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20", records: [], policy: null, staff: [] });
    expect(result.actions.some(a => a.includes("URGENT"))).toBe(true);
  });

  it("includes child profiles", () => {
    const records = [makeRecord({ id: "ra-1", childId: "child-alex" }), makeRecord({ id: "ra-2", childId: "child-jordan", childName: "Jordan" })];
    const result = generateRiskAssessmentIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20", records, policy: makeFullPolicy(), staff: [makeFullStaff()] });
    expect(result.childProfiles).toHaveLength(2);
  });
});
