// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Night Supervision Quality Intelligence Engine
//
// Demo: Chamberlain House — Staff: Sarah Johnson, Tom Richards, Lisa Williams,
//       Darren Laville. Covers all 8 check types, policy, and training.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateCheckQuality,
  evaluateNightCompliance,
  evaluateNightPolicy,
  evaluateStaffNightReadiness,
  buildStaffNightProfiles,
  generateNightSupervisionQualityIntelligence,
  getNightCheckTypeLabel,
  getCheckOutcomeLabel,
  getRatingLabel,
  getRating,
  pct,
} from "../night-supervision-quality-engine";
import type {
  NightCheck,
  NightPolicy,
  StaffNightTraining,
} from "../night-supervision-quality-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

let checkIdCounter = 0;
function makeCheck(overrides: Partial<NightCheck> = {}): NightCheck {
  checkIdCounter++;
  return {
    id: "nc-" + String(checkIdCounter).padStart(3, "0"),
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    checkDate: "2026-03-15",
    nightCheckType: "welfare_check",
    checkOutcome: "satisfactory",
    childrenAccountedFor: true,
    documentedImmediately: true,
    environmentSafe: true,
    responseTimeAdequate: true,
    handoverCompleted: true,
    incidentsReported: true,
    ...overrides,
  };
}

let policyIdCounter = 0;
function makePolicy(overrides: Partial<NightPolicy> = {}): NightPolicy {
  policyIdCounter++;
  return {
    id: "pol-" + String(policyIdCounter).padStart(3, "0"),
    nightStaffingPolicy: true,
    checkFrequencyStandard: true,
    wakingNightCriteria: true,
    sleepingNightProtocol: true,
    emergencyResponsePlan: true,
    handoverProcedure: true,
    regularReview: true,
    ...overrides,
  };
}

let trainingIdCounter = 0;
function makeTraining(overrides: Partial<StaffNightTraining> = {}): StaffNightTraining {
  trainingIdCounter++;
  return {
    id: "snt-" + String(trainingIdCounter).padStart(3, "0"),
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    nightSupervisionSkills: true,
    safeguardingAtNight: true,
    emergencyFirstAid: true,
    fireEvacuation: true,
    childProtocol: true,
    documentationSkills: true,
    ...overrides,
  };
}

// ── pct helper ────────────────────────────────────────────────────────────

describe("pct helper", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns correct percentage", () => {
    expect(pct(3, 4)).toBe(75);
    expect(pct(1, 3)).toBe(33);
    expect(pct(10, 10)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 6)).toBe(17); // 16.67 → 17
    expect(pct(2, 3)).toBe(67); // 66.67 → 67
  });
});

// ── getRating ─────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for 80+", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for 0-39", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label Getters ─────────────────────────────────────────────────────────

describe("getNightCheckTypeLabel", () => {
  it("returns correct labels", () => {
    expect(getNightCheckTypeLabel("welfare_check")).toBe("Welfare Check");
    expect(getNightCheckTypeLabel("bed_check")).toBe("Bed Check");
    expect(getNightCheckTypeLabel("room_check")).toBe("Room Check");
    expect(getNightCheckTypeLabel("perimeter_check")).toBe("Perimeter Check");
    expect(getNightCheckTypeLabel("medication_check")).toBe("Medication Check");
    expect(getNightCheckTypeLabel("fire_safety")).toBe("Fire Safety");
    expect(getNightCheckTypeLabel("emergency_response")).toBe("Emergency Response");
    expect(getNightCheckTypeLabel("handover")).toBe("Handover");
  });
});

describe("getCheckOutcomeLabel", () => {
  it("returns correct labels", () => {
    expect(getCheckOutcomeLabel("satisfactory")).toBe("Satisfactory");
    expect(getCheckOutcomeLabel("concern_noted")).toBe("Concern Noted");
    expect(getCheckOutcomeLabel("intervention_needed")).toBe("Intervention Needed");
    expect(getCheckOutcomeLabel("child_awake")).toBe("Child Awake");
    expect(getCheckOutcomeLabel("not_completed")).toBe("Not Completed");
  });
});

describe("getRatingLabel", () => {
  it("returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateCheckQuality ──────────────────────────────────────────────────

describe("evaluateCheckQuality", () => {
  it("returns score 0 for empty checks (PRESENCE pattern)", () => {
    const result = evaluateCheckQuality([]);
    expect(result.score).toBe(0);
    expect(result.totalChecks).toBe(0);
    expect(result.satisfactoryRate).toBe(0);
  });

  it("returns max score 25 for perfect checks", () => {
    const checks = Array.from({ length: 10 }, () => makeCheck());
    const result = evaluateCheckQuality(checks);
    expect(result.score).toBe(25);
    expect(result.satisfactoryRate).toBe(100);
    expect(result.childrenAccountedForRate).toBe(100);
    expect(result.documentedRate).toBe(100);
    expect(result.environmentSafeRate).toBe(100);
  });

  it("returns partial score for mixed checks", () => {
    const checks = [
      makeCheck({ checkOutcome: "satisfactory", childrenAccountedFor: true, documentedImmediately: true, environmentSafe: true }),
      makeCheck({ checkOutcome: "concern_noted", childrenAccountedFor: false, documentedImmediately: false, environmentSafe: false }),
    ];
    const result = evaluateCheckQuality(checks);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(25);
    expect(result.satisfactoryRate).toBe(50);
  });

  it("scores higher when more checks are satisfactory", () => {
    const goodChecks = [
      makeCheck({ checkOutcome: "satisfactory" }),
      makeCheck({ checkOutcome: "satisfactory" }),
      makeCheck({ checkOutcome: "concern_noted" }),
    ];
    const poorChecks = [
      makeCheck({ checkOutcome: "concern_noted" }),
      makeCheck({ checkOutcome: "not_completed" }),
      makeCheck({ checkOutcome: "intervention_needed" }),
    ];
    const goodResult = evaluateCheckQuality(goodChecks);
    const poorResult = evaluateCheckQuality(poorChecks);
    expect(goodResult.score).toBeGreaterThan(poorResult.score);
  });

  it("boundary: single check scores proportionally", () => {
    const result = evaluateCheckQuality([makeCheck()]);
    expect(result.totalChecks).toBe(1);
    expect(result.score).toBe(25);
  });
});

// ── evaluateNightCompliance ───────────────────────────────────────────────

describe("evaluateNightCompliance", () => {
  it("returns score 0 for empty checks (PRESENCE pattern)", () => {
    const result = evaluateNightCompliance([]);
    expect(result.score).toBe(0);
    expect(result.totalChecks).toBe(0);
    expect(result.uniqueCheckTypes).toBe(0);
  });

  it("returns max score 25 for perfect compliance with all 8 types", () => {
    const allTypes: NightCheck["nightCheckType"][] = [
      "welfare_check", "bed_check", "room_check", "perimeter_check",
      "medication_check", "fire_safety", "emergency_response", "handover",
    ];
    const checks = allTypes.map((type) =>
      makeCheck({ nightCheckType: type }),
    );
    const result = evaluateNightCompliance(checks);
    expect(result.score).toBe(25);
    expect(result.uniqueCheckTypes).toBe(8);
    expect(result.checkTypeDiversity).toBe(100);
  });

  it("returns partial score for mixed compliance", () => {
    const checks = [
      makeCheck({ responseTimeAdequate: true, handoverCompleted: true, incidentsReported: true }),
      makeCheck({ responseTimeAdequate: false, handoverCompleted: false, incidentsReported: false }),
    ];
    const result = evaluateNightCompliance(checks);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(25);
  });

  it("check type diversity calculated as uniqueTypes / 8", () => {
    const checks = [
      makeCheck({ nightCheckType: "welfare_check" }),
      makeCheck({ nightCheckType: "bed_check" }),
      makeCheck({ nightCheckType: "welfare_check" }),
    ];
    const result = evaluateNightCompliance(checks);
    expect(result.uniqueCheckTypes).toBe(2);
    expect(result.checkTypeDiversity).toBe(25); // 2/8 = 0.25 = 25%
  });

  it("scores higher with better compliance rates", () => {
    const goodChecks = Array.from({ length: 5 }, () => makeCheck());
    const poorChecks = Array.from({ length: 5 }, () =>
      makeCheck({
        responseTimeAdequate: false,
        handoverCompleted: false,
        incidentsReported: false,
      }),
    );
    expect(evaluateNightCompliance(goodChecks).score).toBeGreaterThan(
      evaluateNightCompliance(poorChecks).score,
    );
  });
});

// ── evaluateNightPolicy ───────────────────────────────────────────────────

describe("evaluateNightPolicy", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluateNightPolicy(null);
    expect(result.score).toBe(0);
    expect(result.nightStaffingPolicy).toBe(false);
  });

  it("returns max score 25 for all-true policy", () => {
    const result = evaluateNightPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("correctly weights individual booleans (4+4+4+4+3+3+3)", () => {
    // Only nightStaffingPolicy = 4
    const r1 = evaluateNightPolicy(
      makePolicy({
        nightStaffingPolicy: true,
        checkFrequencyStandard: false,
        wakingNightCriteria: false,
        sleepingNightProtocol: false,
        emergencyResponsePlan: false,
        handoverProcedure: false,
        regularReview: false,
      }),
    );
    expect(r1.score).toBe(4);

    // Only emergencyResponsePlan = 3
    const r2 = evaluateNightPolicy(
      makePolicy({
        nightStaffingPolicy: false,
        checkFrequencyStandard: false,
        wakingNightCriteria: false,
        sleepingNightProtocol: false,
        emergencyResponsePlan: true,
        handoverProcedure: false,
        regularReview: false,
      }),
    );
    expect(r2.score).toBe(3);

    // First four booleans = 16
    const r3 = evaluateNightPolicy(
      makePolicy({
        emergencyResponsePlan: false,
        handoverProcedure: false,
        regularReview: false,
      }),
    );
    expect(r3.score).toBe(16);
  });

  it("all-false policy scores 0", () => {
    const result = evaluateNightPolicy(
      makePolicy({
        nightStaffingPolicy: false,
        checkFrequencyStandard: false,
        wakingNightCriteria: false,
        sleepingNightProtocol: false,
        emergencyResponsePlan: false,
        handoverProcedure: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(0);
  });
});

// ── evaluateStaffNightReadiness ───────────────────────────────────────────

describe("evaluateStaffNightReadiness", () => {
  it("returns score 0 for empty training (PRESENCE pattern)", () => {
    const result = evaluateStaffNightReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns max score 25 for all-trained staff", () => {
    const training = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2" }),
      makeTraining({ staffId: "s3" }),
    ];
    const result = evaluateStaffNightReadiness(training);
    expect(result.score).toBe(25);
    expect(result.nightSupervisionSkillsRate).toBe(100);
  });

  it("weights skills correctly (6+5+5+4+3+2 = 25)", () => {
    // Only nightSupervisionSkills trained = round(100/100 * 6) = 6
    const r = evaluateStaffNightReadiness([
      makeTraining({
        nightSupervisionSkills: true,
        safeguardingAtNight: false,
        emergencyFirstAid: false,
        fireEvacuation: false,
        childProtocol: false,
        documentationSkills: false,
      }),
    ]);
    expect(r.score).toBe(6);
  });

  it("partial training gives partial scores", () => {
    const training = [
      makeTraining({
        staffId: "s1",
        nightSupervisionSkills: true,
        safeguardingAtNight: true,
        emergencyFirstAid: false,
        fireEvacuation: false,
        childProtocol: false,
        documentationSkills: false,
      }),
      makeTraining({
        staffId: "s2",
        nightSupervisionSkills: false,
        safeguardingAtNight: false,
        emergencyFirstAid: false,
        fireEvacuation: false,
        childProtocol: false,
        documentationSkills: false,
      }),
    ];
    const result = evaluateStaffNightReadiness(training);
    // nightSupervisionSkills: 50% → round(0.5*6) = 3
    // safeguardingAtNight: 50% → round(0.5*5) = 3 (2.5 rounded)
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(25);
    expect(result.nightSupervisionSkillsRate).toBe(50);
  });

  it("scores higher with better trained staff", () => {
    const goodTraining = [makeTraining(), makeTraining({ staffId: "s2" })];
    const poorTraining = [
      makeTraining({
        nightSupervisionSkills: false,
        safeguardingAtNight: false,
        emergencyFirstAid: false,
        fireEvacuation: false,
        childProtocol: false,
        documentationSkills: false,
      }),
    ];
    expect(evaluateStaffNightReadiness(goodTraining).score).toBeGreaterThan(
      evaluateStaffNightReadiness(poorTraining).score,
    );
  });
});

// ── buildStaffNightProfiles ───────────────────────────────────────────────

describe("buildStaffNightProfiles", () => {
  it("returns empty array for no checks", () => {
    expect(buildStaffNightProfiles([])).toEqual([]);
  });

  it("groups checks by staffId", () => {
    const checks = [
      makeCheck({ staffId: "s1", staffName: "Sarah" }),
      makeCheck({ staffId: "s1", staffName: "Sarah" }),
      makeCheck({ staffId: "s2", staffName: "Tom" }),
    ];
    const profiles = buildStaffNightProfiles(checks);
    expect(profiles).toHaveLength(2);
    const sarah = profiles.find((p) => p.staffId === "s1")!;
    expect(sarah.totalChecks).toBe(2);
    const tom = profiles.find((p) => p.staffId === "s2")!;
    expect(tom.totalChecks).toBe(1);
  });

  it("calculates satisfactoryRate and documentedRate", () => {
    const checks = [
      makeCheck({ staffId: "s1", checkOutcome: "satisfactory", documentedImmediately: true }),
      makeCheck({ staffId: "s1", checkOutcome: "concern_noted", documentedImmediately: false }),
      makeCheck({ staffId: "s1", checkOutcome: "satisfactory", documentedImmediately: true }),
    ];
    const profiles = buildStaffNightProfiles(checks);
    expect(profiles[0].satisfactoryRate).toBe(67); // 2/3
    expect(profiles[0].documentedRate).toBe(67); // 2/3
  });

  it("caps score at 10", () => {
    // All perfect: frequency >= 10, sat >= 80, doc >= 80, diverse >= 4
    const types: NightCheck["nightCheckType"][] = [
      "welfare_check", "bed_check", "room_check", "perimeter_check",
      "medication_check", "fire_safety", "emergency_response", "handover",
      "welfare_check", "bed_check",
    ];
    const checks = types.map((type) =>
      makeCheck({ staffId: "s1", staffName: "Sarah", nightCheckType: type }),
    );
    const profiles = buildStaffNightProfiles(checks);
    expect(profiles[0].score).toBe(10);
  });

  it("scores frequency correctly", () => {
    // 10 checks → 2 pts for frequency
    const checks10 = Array.from({ length: 10 }, () =>
      makeCheck({ staffId: "s1" }),
    );
    const profiles10 = buildStaffNightProfiles(checks10);
    // 5 checks → 1 pt for frequency
    const checks5 = Array.from({ length: 5 }, () =>
      makeCheck({ staffId: "s1" }),
    );
    const profiles5 = buildStaffNightProfiles(checks5);
    // 3 checks → 0 pts for frequency
    const checks3 = Array.from({ length: 3 }, () =>
      makeCheck({ staffId: "s1" }),
    );
    const profiles3 = buildStaffNightProfiles(checks3);

    expect(profiles10[0].score).toBeGreaterThanOrEqual(profiles5[0].score);
    expect(profiles5[0].score).toBeGreaterThanOrEqual(profiles3[0].score);
  });

  it("scores type diversity correctly", () => {
    // Single type → 0 pts
    const singleType = [
      makeCheck({ staffId: "s1", nightCheckType: "welfare_check" }),
      makeCheck({ staffId: "s1", nightCheckType: "welfare_check" }),
    ];
    const p1 = buildStaffNightProfiles(singleType);
    // In this case uniqueCheckTypes = 1, so diversity = 0

    // 2 types → 1 pt
    const twoTypes = [
      makeCheck({ staffId: "s1", nightCheckType: "welfare_check" }),
      makeCheck({ staffId: "s1", nightCheckType: "bed_check" }),
    ];
    const p2 = buildStaffNightProfiles(twoTypes);

    // 4 types → 2 pts
    const fourTypes = [
      makeCheck({ staffId: "s1", nightCheckType: "welfare_check" }),
      makeCheck({ staffId: "s1", nightCheckType: "bed_check" }),
      makeCheck({ staffId: "s1", nightCheckType: "room_check" }),
      makeCheck({ staffId: "s1", nightCheckType: "perimeter_check" }),
    ];
    const p3 = buildStaffNightProfiles(fourTypes);

    expect(p1[0].uniqueCheckTypes).toBe(1);
    expect(p2[0].uniqueCheckTypes).toBe(2);
    expect(p3[0].uniqueCheckTypes).toBe(4);
    expect(p3[0].score).toBeGreaterThan(p2[0].score);
    expect(p2[0].score).toBeGreaterThan(p1[0].score);
  });
});

// ── generateNightSupervisionQualityIntelligence (Orchestrator) ────────────

describe("generateNightSupervisionQualityIntelligence", () => {
  it("empty data → inadequate rating", () => {
    const result = generateNightSupervisionQualityIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("perfect data → outstanding rating", () => {
    const allTypes: NightCheck["nightCheckType"][] = [
      "welfare_check", "bed_check", "room_check", "perimeter_check",
      "medication_check", "fire_safety", "emergency_response", "handover",
    ];
    const checks = allTypes.map((type) => makeCheck({ nightCheckType: type }));
    const policy = makePolicy();
    const training = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2" }),
    ];

    const result = generateNightSupervisionQualityIntelligence(
      checks,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("caps overall score at 100", () => {
    // Even with all maximums the cap holds
    const allTypes: NightCheck["nightCheckType"][] = [
      "welfare_check", "bed_check", "room_check", "perimeter_check",
      "medication_check", "fire_safety", "emergency_response", "handover",
    ];
    const checks = allTypes.map((type) => makeCheck({ nightCheckType: type }));
    const policy = makePolicy();
    const training = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2" }),
      makeTraining({ staffId: "s3" }),
    ];

    const result = generateNightSupervisionQualityIntelligence(
      checks,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("preserves homeId and period", () => {
    const result = generateNightSupervisionQualityIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("produces strengths when rates >= 80", () => {
    const checks = Array.from({ length: 10 }, () => makeCheck());
    const policy = makePolicy();
    const training = [makeTraining()];

    const result = generateNightSupervisionQualityIntelligence(
      checks,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("Strong night check quality"))).toBe(
      true,
    );
    expect(
      result.strengths.some((s) => s.includes("Children consistently accounted for")),
    ).toBe(true);
    expect(
      result.strengths.some((s) => s.includes("Excellent night shift handover")),
    ).toBe(true);
    expect(result.strengths.some((s) => s.includes("Good documentation"))).toBe(true);
  });

  it("produces actions for empty checks", () => {
    const result = generateNightSupervisionQualityIntelligence(
      [],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("No night check records found"))).toBe(
      true,
    );
  });

  it("produces URGENT action for null policy", () => {
    const result = generateNightSupervisionQualityIntelligence(
      [makeCheck()],
      null,
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(
      true,
    );
  });

  it("produces URGENT action for empty training", () => {
    const result = generateNightSupervisionQualityIntelligence(
      [makeCheck()],
      makePolicy(),
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(
      result.actions.some((a) => a.startsWith("URGENT") && a.includes("training")),
    ).toBe(true);
  });

  it("includes 7 regulatory links", () => {
    const result = generateNightSupervisionQualityIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Fire Safety Order 2005"))).toBe(
      true,
    );
  });

  it("good rating around score ~75", () => {
    // Build data that gives approximately 75/100
    // checkQuality: 25 (perfect checks)
    // nightCompliance: ~18 (partial)
    // nightPolicy: 25 (all true)
    // staffReadiness: ~6 (partial)
    // Total ~74
    const checks = [
      makeCheck({ nightCheckType: "welfare_check" }),
      makeCheck({ nightCheckType: "bed_check" }),
      makeCheck({
        nightCheckType: "room_check",
        responseTimeAdequate: false,
        handoverCompleted: false,
        incidentsReported: false,
      }),
    ];
    const policy = makePolicy();
    const training = [
      makeTraining({
        staffId: "s1",
        nightSupervisionSkills: true,
        safeguardingAtNight: false,
        emergencyFirstAid: false,
        fireEvacuation: false,
        childProtocol: false,
        documentationSkills: false,
      }),
    ];

    const result = generateNightSupervisionQualityIntelligence(
      checks,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    // Score should be in good range (60-79)
    expect(result.rating).toBe("good");
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
  });

  it("includes actions for low responseTime and incidentReport rates", () => {
    const checks = [
      makeCheck({ responseTimeAdequate: false, incidentsReported: false }),
      makeCheck({ responseTimeAdequate: false, incidentsReported: false }),
      makeCheck({ responseTimeAdequate: false, incidentsReported: false }),
    ];
    const result = generateNightSupervisionQualityIntelligence(
      checks,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("Improve response time"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Strengthen incident reporting"))).toBe(
      true,
    );
  });
});
