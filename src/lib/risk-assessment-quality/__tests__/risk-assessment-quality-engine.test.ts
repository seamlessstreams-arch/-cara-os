// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Risk Assessment Quality Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson (Senior RSW), Tom Richards (RSW),
//        Lisa Williams (Senior RSW), Darren Laville (RM/DSL)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateRiskQuality,
  evaluateRiskCompliance,
  evaluateRiskPolicy,
  evaluateStaffRiskReadiness,
  buildChildRiskProfiles,
  generateRiskAssessmentQualityIntelligence,
  getRiskCategoryLabel,
  getRiskLevelLabel,
  getRatingLabel,
  getRating,
  pct,
} from "../risk-assessment-quality-engine";
import type {
  RiskAssessment,
  RiskAssessmentPolicy,
  StaffRiskAssessmentTraining,
} from "../risk-assessment-quality-engine";

// ── Test Fixtures: Chamberlain House Demo Data ────────────────────────────────────

const makeAssessment = (overrides: Partial<RiskAssessment> = {}): RiskAssessment => ({
  id: "ra-001",
  childId: "child-alex",
  childName: "Alex",
  assessmentDate: "2026-05-05",
  riskCategory: "self_harm",
  riskLevel: "medium",
  mitigationPlanInPlace: true,
  childConsulted: true,
  reviewScheduled: true,
  documentedInPlan: true,
  staffAware: true,
  feedbackGiven: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<RiskAssessmentPolicy> = {}): RiskAssessmentPolicy => ({
  id: "policy-001",
  riskManagementFramework: true,
  dynamicAssessmentProcedure: true,
  positiveRiskTakingPolicy: true,
  incidentResponseProtocol: true,
  multiAgencyRiskSharing: true,
  staffRiskTrainingRequirement: true,
  regularReview: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffRiskAssessmentTraining> = {}): StaffRiskAssessmentTraining => ({
  id: "srt-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  riskIdentification: true,
  mitigationPlanning: true,
  dynamicRiskAssessment: true,
  positiveRiskTaking: true,
  incidentManagement: true,
  multiAgencyWorking: true,
  ...overrides,
});

// Chamberlain House demo assessments
const OAK_HOUSE_ASSESSMENTS: RiskAssessment[] = [
  makeAssessment({ id: "ra-001", childId: "child-alex", childName: "Alex", riskCategory: "self_harm", riskLevel: "medium" }),
  makeAssessment({ id: "ra-002", childId: "child-alex", childName: "Alex", riskCategory: "absconding", riskLevel: "low", assessmentDate: "2026-05-08" }),
  makeAssessment({ id: "ra-003", childId: "child-alex", childName: "Alex", riskCategory: "online_safety", riskLevel: "low", assessmentDate: "2026-05-10" }),
  makeAssessment({ id: "ra-004", childId: "child-jordan", childName: "Jordan", riskCategory: "aggression", riskLevel: "high", assessmentDate: "2026-05-06" }),
  makeAssessment({ id: "ra-005", childId: "child-jordan", childName: "Jordan", riskCategory: "bullying", riskLevel: "medium", assessmentDate: "2026-05-09" }),
  makeAssessment({ id: "ra-006", childId: "child-morgan", childName: "Morgan", riskCategory: "exploitation", riskLevel: "critical", assessmentDate: "2026-05-07" }),
  makeAssessment({ id: "ra-007", childId: "child-morgan", childName: "Morgan", riskCategory: "substance_misuse", riskLevel: "medium", assessmentDate: "2026-05-11" }),
  makeAssessment({ id: "ra-008", childId: "child-morgan", childName: "Morgan", riskCategory: "fire_setting", riskLevel: "low", assessmentDate: "2026-05-12" }),
];

const OAK_HOUSE_POLICY: RiskAssessmentPolicy = makePolicy();

const OAK_HOUSE_TRAINING: StaffRiskAssessmentTraining[] = [
  makeTraining({ id: "srt-001", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
  makeTraining({ id: "srt-002", staffId: "staff-tom", staffName: "Tom Richards" }),
  makeTraining({ id: "srt-003", staffId: "staff-lisa", staffName: "Lisa Williams" }),
  makeTraining({ id: "srt-004", staffId: "staff-darren", staffName: "Darren Laville" }),
];

// ── Helper Tests ──────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns correct percentage", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label Getter Tests ───────────────────────────────────────────────────

describe("getRiskCategoryLabel", () => {
  it("returns human-readable label for self_harm", () => {
    expect(getRiskCategoryLabel("self_harm")).toBe("Self-Harm");
  });

  it("returns human-readable label for aggression", () => {
    expect(getRiskCategoryLabel("aggression")).toBe("Aggression");
  });

  it("returns human-readable label for absconding", () => {
    expect(getRiskCategoryLabel("absconding")).toBe("Absconding");
  });

  it("returns human-readable label for exploitation", () => {
    expect(getRiskCategoryLabel("exploitation")).toBe("Exploitation");
  });

  it("returns human-readable label for substance_misuse", () => {
    expect(getRiskCategoryLabel("substance_misuse")).toBe("Substance Misuse");
  });

  it("returns human-readable label for online_safety", () => {
    expect(getRiskCategoryLabel("online_safety")).toBe("Online Safety");
  });

  it("returns human-readable label for fire_setting", () => {
    expect(getRiskCategoryLabel("fire_setting")).toBe("Fire Setting");
  });

  it("returns human-readable label for bullying", () => {
    expect(getRiskCategoryLabel("bullying")).toBe("Bullying");
  });
});

describe("getRiskLevelLabel", () => {
  it("returns human-readable labels for all levels", () => {
    expect(getRiskLevelLabel("critical")).toBe("Critical");
    expect(getRiskLevelLabel("high")).toBe("High");
    expect(getRiskLevelLabel("medium")).toBe("Medium");
    expect(getRiskLevelLabel("low")).toBe("Low");
    expect(getRiskLevelLabel("minimal")).toBe("Minimal");
  });
});

describe("getRatingLabel", () => {
  it("returns human-readable labels for all ratings", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── Evaluator 1: Risk Quality ────────────────────────────────────────────

describe("evaluateRiskQuality", () => {
  it("returns all zeros for empty assessments", () => {
    const result = evaluateRiskQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.mitigationRate).toBe(0);
    expect(result.childConsultedRate).toBe(0);
    expect(result.reviewScheduledRate).toBe(0);
    expect(result.comprehensiveRate).toBe(0);
  });

  it("scores 25 for perfect assessments", () => {
    const result = evaluateRiskQuality(OAK_HOUSE_ASSESSMENTS);
    expect(result.overallScore).toBe(25);
    expect(result.mitigationRate).toBe(100);
    expect(result.childConsultedRate).toBe(100);
    expect(result.reviewScheduledRate).toBe(100);
    expect(result.comprehensiveRate).toBe(100);
  });

  it("counts total assessments correctly", () => {
    const result = evaluateRiskQuality(OAK_HOUSE_ASSESSMENTS);
    expect(result.totalAssessments).toBe(8);
  });

  it("calculates mitigation rate correctly with mixed data", () => {
    const mixed = [
      makeAssessment({ id: "1", mitigationPlanInPlace: true }),
      makeAssessment({ id: "2", mitigationPlanInPlace: false }),
      makeAssessment({ id: "3", mitigationPlanInPlace: true }),
      makeAssessment({ id: "4", mitigationPlanInPlace: false }),
    ];
    const result = evaluateRiskQuality(mixed);
    expect(result.mitigationRate).toBe(50);
  });

  it("calculates child consulted rate correctly", () => {
    const mixed = [
      makeAssessment({ id: "1", childConsulted: true }),
      makeAssessment({ id: "2", childConsulted: false }),
      makeAssessment({ id: "3", childConsulted: true }),
    ];
    const result = evaluateRiskQuality(mixed);
    expect(result.childConsultedRate).toBe(67);
  });

  it("calculates comprehensive rate — all three booleans true", () => {
    const mixed = [
      makeAssessment({ id: "1", mitigationPlanInPlace: true, childConsulted: true, reviewScheduled: true }),
      makeAssessment({ id: "2", mitigationPlanInPlace: true, childConsulted: false, reviewScheduled: true }),
      makeAssessment({ id: "3", mitigationPlanInPlace: false, childConsulted: true, reviewScheduled: true }),
    ];
    const result = evaluateRiskQuality(mixed);
    expect(result.comprehensiveRate).toBe(33);
  });

  it("score is capped at 25", () => {
    const result = evaluateRiskQuality(OAK_HOUSE_ASSESSMENTS);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const allFalse = [makeAssessment({
      mitigationPlanInPlace: false,
      childConsulted: false,
      reviewScheduled: false,
    })];
    const result = evaluateRiskQuality(allFalse);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── Evaluator 2: Risk Compliance ─────────────────────────────────────────

describe("evaluateRiskCompliance", () => {
  it("returns all zeros for empty assessments", () => {
    const result = evaluateRiskCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.staffAwareRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
    expect(result.riskCategoryDiversityRatio).toBe(0);
  });

  it("scores high for perfect compliance", () => {
    const result = evaluateRiskCompliance(OAK_HOUSE_ASSESSMENTS);
    expect(result.overallScore).toBe(25);
    expect(result.documentedRate).toBe(100);
    expect(result.staffAwareRate).toBe(100);
    expect(result.feedbackRate).toBe(100);
  });

  it("calculates diversity ratio correctly", () => {
    const result = evaluateRiskCompliance(OAK_HOUSE_ASSESSMENTS);
    // 8 assessments across 8 unique categories = 1.0
    expect(result.riskCategoryDiversityRatio).toBe(1);
  });

  it("calculates diversity ratio for single category", () => {
    const single = [makeAssessment({ riskCategory: "self_harm" })];
    const result = evaluateRiskCompliance(single);
    expect(result.riskCategoryDiversityRatio).toBe(0.13); // 1/8 rounded
  });

  it("calculates documented rate with mixed data", () => {
    const mixed = [
      makeAssessment({ id: "1", documentedInPlan: true }),
      makeAssessment({ id: "2", documentedInPlan: false }),
    ];
    const result = evaluateRiskCompliance(mixed);
    expect(result.documentedRate).toBe(50);
  });

  it("calculates staff aware rate with mixed data", () => {
    const mixed = [
      makeAssessment({ id: "1", staffAware: true }),
      makeAssessment({ id: "2", staffAware: false }),
      makeAssessment({ id: "3", staffAware: false }),
    ];
    const result = evaluateRiskCompliance(mixed);
    expect(result.staffAwareRate).toBe(33);
  });

  it("calculates feedback rate correctly", () => {
    const mixed = [
      makeAssessment({ id: "1", feedbackGiven: true }),
      makeAssessment({ id: "2", feedbackGiven: true }),
      makeAssessment({ id: "3", feedbackGiven: false }),
      makeAssessment({ id: "4", feedbackGiven: false }),
    ];
    const result = evaluateRiskCompliance(mixed);
    expect(result.feedbackRate).toBe(50);
  });

  it("score is capped at 25", () => {
    const result = evaluateRiskCompliance(OAK_HOUSE_ASSESSMENTS);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── Evaluator 3: Risk Policy ─────────────────────────────────────────────

describe("evaluateRiskPolicy", () => {
  it("returns all zeros/false for null policy", () => {
    const result = evaluateRiskPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.riskManagementFramework).toBe(false);
    expect(result.dynamicAssessmentProcedure).toBe(false);
    expect(result.positiveRiskTakingPolicy).toBe(false);
    expect(result.incidentResponseProtocol).toBe(false);
    expect(result.multiAgencyRiskSharing).toBe(false);
    expect(result.staffRiskTrainingRequirement).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("scores 25 for fully compliant policy", () => {
    const result = evaluateRiskPolicy(OAK_HOUSE_POLICY);
    expect(result.overallScore).toBe(25);
  });

  it("mirrors all boolean fields from policy", () => {
    const result = evaluateRiskPolicy(OAK_HOUSE_POLICY);
    expect(result.riskManagementFramework).toBe(true);
    expect(result.dynamicAssessmentProcedure).toBe(true);
    expect(result.positiveRiskTakingPolicy).toBe(true);
    expect(result.incidentResponseProtocol).toBe(true);
    expect(result.multiAgencyRiskSharing).toBe(true);
    expect(result.staffRiskTrainingRequirement).toBe(true);
    expect(result.regularReview).toBe(true);
  });

  it("scores partial policy — only framework", () => {
    const partial = makePolicy({
      riskManagementFramework: true,
      dynamicAssessmentProcedure: false,
      positiveRiskTakingPolicy: false,
      incidentResponseProtocol: false,
      multiAgencyRiskSharing: false,
      staffRiskTrainingRequirement: false,
      regularReview: false,
    });
    const result = evaluateRiskPolicy(partial);
    expect(result.overallScore).toBe(4); // only framework weight = 4
  });

  it("scores partial policy — mixed booleans", () => {
    const partial = makePolicy({
      riskManagementFramework: true,
      dynamicAssessmentProcedure: true,
      positiveRiskTakingPolicy: false,
      incidentResponseProtocol: false,
      multiAgencyRiskSharing: true,
      staffRiskTrainingRequirement: false,
      regularReview: true,
    });
    const result = evaluateRiskPolicy(partial);
    // 4 + 4 + 3 + 3 = 14
    expect(result.overallScore).toBe(14);
  });

  it("weight of minor booleans is 3 each", () => {
    const minorOnly = makePolicy({
      riskManagementFramework: false,
      dynamicAssessmentProcedure: false,
      positiveRiskTakingPolicy: false,
      incidentResponseProtocol: false,
      multiAgencyRiskSharing: true,
      staffRiskTrainingRequirement: true,
      regularReview: true,
    });
    const result = evaluateRiskPolicy(minorOnly);
    expect(result.overallScore).toBe(9); // 3+3+3
  });

  it("weight of major booleans is 4 each", () => {
    const majorOnly = makePolicy({
      riskManagementFramework: true,
      dynamicAssessmentProcedure: true,
      positiveRiskTakingPolicy: true,
      incidentResponseProtocol: true,
      multiAgencyRiskSharing: false,
      staffRiskTrainingRequirement: false,
      regularReview: false,
    });
    const result = evaluateRiskPolicy(majorOnly);
    expect(result.overallScore).toBe(16); // 4+4+4+4
  });
});

// ── Evaluator 4: Staff Risk Readiness ────────────────────────────────────

describe("evaluateStaffRiskReadiness", () => {
  it("returns all zeros for empty training", () => {
    const result = evaluateStaffRiskReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.riskIdentificationRate).toBe(0);
    expect(result.mitigationPlanningRate).toBe(0);
    expect(result.dynamicRiskAssessmentRate).toBe(0);
    expect(result.positiveRiskTakingRate).toBe(0);
    expect(result.incidentManagementRate).toBe(0);
    expect(result.multiAgencyWorkingRate).toBe(0);
  });

  it("scores 25 for fully trained staff", () => {
    const result = evaluateStaffRiskReadiness(OAK_HOUSE_TRAINING);
    expect(result.overallScore).toBe(25);
  });

  it("counts total staff correctly", () => {
    const result = evaluateStaffRiskReadiness(OAK_HOUSE_TRAINING);
    expect(result.totalStaff).toBe(4);
  });

  it("all skill rates are 100% for fully trained staff", () => {
    const result = evaluateStaffRiskReadiness(OAK_HOUSE_TRAINING);
    expect(result.riskIdentificationRate).toBe(100);
    expect(result.mitigationPlanningRate).toBe(100);
    expect(result.dynamicRiskAssessmentRate).toBe(100);
    expect(result.positiveRiskTakingRate).toBe(100);
    expect(result.incidentManagementRate).toBe(100);
    expect(result.multiAgencyWorkingRate).toBe(100);
  });

  it("calculates rates correctly with mixed training", () => {
    const mixed = [
      makeTraining({ id: "1", staffId: "s1", riskIdentification: true, mitigationPlanning: false }),
      makeTraining({ id: "2", staffId: "s2", riskIdentification: false, mitigationPlanning: true }),
    ];
    const result = evaluateStaffRiskReadiness(mixed);
    expect(result.riskIdentificationRate).toBe(50);
    expect(result.mitigationPlanningRate).toBe(50);
  });

  it("handles single staff member", () => {
    const single = [makeTraining()];
    const result = evaluateStaffRiskReadiness(single);
    expect(result.totalStaff).toBe(1);
    expect(result.overallScore).toBe(25);
  });

  it("score reflects weighted skills — riskIdentification is 6 points", () => {
    const onlyRiskId = [makeTraining({
      riskIdentification: true,
      mitigationPlanning: false,
      dynamicRiskAssessment: false,
      positiveRiskTaking: false,
      incidentManagement: false,
      multiAgencyWorking: false,
    })];
    const result = evaluateStaffRiskReadiness(onlyRiskId);
    expect(result.overallScore).toBe(6);
  });

  it("score reflects weighted skills — multiAgencyWorking is 2 points", () => {
    const onlyMultiAgency = [makeTraining({
      riskIdentification: false,
      mitigationPlanning: false,
      dynamicRiskAssessment: false,
      positiveRiskTaking: false,
      incidentManagement: false,
      multiAgencyWorking: true,
    })];
    const result = evaluateStaffRiskReadiness(onlyMultiAgency);
    expect(result.overallScore).toBe(2);
  });
});

// ── Child Risk Profiles ──────────────────────────────────────────────────

describe("buildChildRiskProfiles", () => {
  it("returns empty array for empty assessments", () => {
    const profiles = buildChildRiskProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("builds profiles for each unique child", () => {
    const profiles = buildChildRiskProfiles(OAK_HOUSE_ASSESSMENTS);
    expect(profiles.length).toBe(3);
  });

  it("groups assessments by childId", () => {
    const profiles = buildChildRiskProfiles(OAK_HOUSE_ASSESSMENTS);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.totalAssessments).toBe(3);
  });

  it("calculates mitigation rate per child", () => {
    const profiles = buildChildRiskProfiles(OAK_HOUSE_ASSESSMENTS);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.mitigationRate).toBe(100);
  });

  it("calculates consulted rate per child", () => {
    const profiles = buildChildRiskProfiles(OAK_HOUSE_ASSESSMENTS);
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan!.consultedRate).toBe(100);
  });

  it("preserves child name", () => {
    const profiles = buildChildRiskProfiles(OAK_HOUSE_ASSESSMENTS);
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan!.childName).toBe("Morgan");
  });

  it("child score includes frequency bonus for >= 5 assessments", () => {
    const manyAssessments = Array.from({ length: 5 }, (_, i) =>
      makeAssessment({
        id: `ra-${i}`,
        childId: "child-alex",
        childName: "Alex",
        riskCategory: "self_harm",
      }),
    );
    const profiles = buildChildRiskProfiles(manyAssessments);
    const alex = profiles[0];
    // freq 1 + mitigation 3 + consulted 3 + diversity 0 (only 1 category) = 7
    expect(alex.overallScore).toBe(7);
  });

  it("child score includes frequency bonus for >= 10 assessments", () => {
    const manyAssessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `ra-${i}`,
        childId: "child-alex",
        childName: "Alex",
        riskCategory: "self_harm",
      }),
    );
    const profiles = buildChildRiskProfiles(manyAssessments);
    const alex = profiles[0];
    // freq 2 + mitigation 3 + consulted 3 + diversity 0 = 8
    expect(alex.overallScore).toBe(8);
  });

  it("child score includes diversity bonus for >= 2 categories", () => {
    const diverse = [
      makeAssessment({ id: "1", childId: "c1", childName: "C1", riskCategory: "self_harm" }),
      makeAssessment({ id: "2", childId: "c1", childName: "C1", riskCategory: "aggression" }),
    ];
    const profiles = buildChildRiskProfiles(diverse);
    // freq 0 + mitigation 3 + consulted 3 + diversity 1 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("child score includes diversity bonus for >= 4 categories", () => {
    const diverse = [
      makeAssessment({ id: "1", childId: "c1", childName: "C1", riskCategory: "self_harm" }),
      makeAssessment({ id: "2", childId: "c1", childName: "C1", riskCategory: "aggression" }),
      makeAssessment({ id: "3", childId: "c1", childName: "C1", riskCategory: "absconding" }),
      makeAssessment({ id: "4", childId: "c1", childName: "C1", riskCategory: "exploitation" }),
    ];
    const profiles = buildChildRiskProfiles(diverse);
    // freq 0 + mitigation 3 + consulted 3 + diversity 2 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("child score capped at 10", () => {
    // 10+ assessments across 4+ categories all perfect
    const many = Array.from({ length: 12 }, (_, i) =>
      makeAssessment({
        id: `ra-${i}`,
        childId: "c1",
        childName: "C1",
        riskCategory: (["self_harm", "aggression", "absconding", "exploitation"] as const)[i % 4],
      }),
    );
    const profiles = buildChildRiskProfiles(many);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("child score is 0 for no mitigation, no consultation, single category, few assessments", () => {
    const poor = [
      makeAssessment({
        id: "1",
        childId: "c1",
        childName: "C1",
        mitigationPlanInPlace: false,
        childConsulted: false,
        riskCategory: "self_harm",
      }),
    ];
    const profiles = buildChildRiskProfiles(poor);
    // freq 0 + mitigation 0 + consulted 0 + diversity 0 = 0
    expect(profiles[0].overallScore).toBe(0);
  });
});

// ── Orchestrator ─────────────────────────────────────────────────────────

describe("generateRiskAssessmentQualityIntelligence", () => {
  const result = generateRiskAssessmentQualityIntelligence(
    OAK_HOUSE_ASSESSMENTS,
    OAK_HOUSE_POLICY,
    OAK_HOUSE_TRAINING,
    "oak-house",
    "2026-04-01",
    "2026-05-20",
  );

  it("returns correct homeId", () => {
    expect(result.homeId).toBe("oak-house");
  });

  it("returns period dates", () => {
    expect(result.periodStart).toBe("2026-04-01");
    expect(result.periodEnd).toBe("2026-05-20");
  });

  it("has assessedAt timestamp", () => {
    expect(result.assessedAt).toBeTruthy();
  });

  it("overall score is sum of 4 evaluators", () => {
    const expected =
      result.riskQuality.overallScore +
      result.riskCompliance.overallScore +
      result.riskPolicy.overallScore +
      result.staffRiskReadiness.overallScore;
    expect(result.overallScore).toBe(Math.round(expected));
  });

  it("overall score is 100 for perfect Chamberlain House data", () => {
    expect(result.overallScore).toBe(100);
  });

  it("rating is outstanding for perfect data", () => {
    expect(result.rating).toBe("outstanding");
  });

  it("includes child profiles", () => {
    expect(result.childProfiles.length).toBe(3);
  });

  it("includes regulatory links", () => {
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks[0]).toContain("CHR 2015 Regulation 12");
  });

  it("regulatory links include Children Act 1989", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("regulatory links include UNCRC Article 19", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 19"))).toBe(true);
  });

  it("regulatory links include Working Together 2023", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together to Safeguard Children 2023"))).toBe(true);
  });

  it("includes strengths for high-scoring data", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes actions array", () => {
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("surfaces an URGENT action for a high/critical-risk assessment lacking mitigation or review", () => {
    // Aggregate mitigationRate stays high (9/10), so only the per-assessment
    // check surfaces the unmitigated critical risk.
    const assessments = [
      makeAssessment({ id: "u1", riskLevel: "critical", mitigationPlanInPlace: false }),
      ...Array.from({ length: 9 }, (_, i) => makeAssessment({ id: `ok-${i}` })),
    ];
    const r = generateRiskAssessmentQualityIntelligence(
      assessments, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING, "oak-house", "2026-05-01", "2026-05-20",
    );
    expect(r.actions.some((a) => a.toLowerCase().includes("without a mitigation plan or scheduled review"))).toBe(true);
  });

  it("filters assessments by period", () => {
    const narrow = generateRiskAssessmentQualityIntelligence(
      OAK_HOUSE_ASSESSMENTS,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-05-10",
      "2026-05-12",
    );
    // Only ra-003 (May 10), ra-007 (May 11), ra-008 (May 12) within range
    expect(narrow.riskQuality.totalAssessments).toBe(3);
  });

  it("handles empty assessments gracefully", () => {
    const empty = generateRiskAssessmentQualityIntelligence(
      [],
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-04-01",
      "2026-05-20",
    );
    expect(empty.riskQuality.overallScore).toBe(0);
    expect(empty.riskCompliance.overallScore).toBe(0);
    expect(empty.overallScore).toBe(50); // policy 25 + staff 25
  });

  it("handles null policy gracefully", () => {
    const noPolicy = generateRiskAssessmentQualityIntelligence(
      OAK_HOUSE_ASSESSMENTS,
      null,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-04-01",
      "2026-05-20",
    );
    expect(noPolicy.riskPolicy.overallScore).toBe(0);
  });

  it("handles empty training gracefully", () => {
    const noTraining = generateRiskAssessmentQualityIntelligence(
      OAK_HOUSE_ASSESSMENTS,
      OAK_HOUSE_POLICY,
      [],
      "oak-house",
      "2026-04-01",
      "2026-05-20",
    );
    expect(noTraining.staffRiskReadiness.overallScore).toBe(0);
  });

  it("generates urgent action when no assessments exist", () => {
    const empty = generateRiskAssessmentQualityIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-04-01",
      "2026-05-20",
    );
    expect(empty.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("areas for improvement populated for low scores", () => {
    const poor = generateRiskAssessmentQualityIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-04-01",
      "2026-05-20",
    );
    expect(poor.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("overall score clamped between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});
