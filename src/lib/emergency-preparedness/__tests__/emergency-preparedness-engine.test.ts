import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getRatingLabel,
  getEmergencyTypeLabel,
  getReadinessLevelLabel,
  evaluateEmergencyQuality,
  evaluateEmergencyCompliance,
  evaluateEmergencyPolicy,
  evaluateStaffEmergencyReadiness,
  buildDrillTypeSummary,
  generateEmergencyPreparednessIntelligence,
} from "../emergency-preparedness-engine";
import type {
  EmergencyDrill,
  EmergencyPolicy,
  StaffEmergencyTraining,
  EmergencyType,
} from "../emergency-preparedness-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeDrill(overrides: Partial<EmergencyDrill> = {}): EmergencyDrill {
  return {
    id: "drill-1",
    drillDate: "2026-03-15",
    drillType: "fire_drill",
    readinessLevel: "good",
    allStaffParticipated: true,
    childrenBriefed: true,
    completedWithinTarget: true,
    documentedProperly: true,
    debriefConducted: true,
    improvementsIdentified: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<EmergencyPolicy> = {}): EmergencyPolicy {
  return {
    id: "policy-1",
    fireEvacuationPlan: true,
    lockdownProcedure: true,
    missingChildProtocol: true,
    medicalEmergencyPlan: true,
    businessContinuityPlan: true,
    emergencyContactSystem: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffEmergencyTraining> = {}): StaffEmergencyTraining {
  return {
    id: "training-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    firstAidCertified: true,
    fireMarshallTrained: true,
    evacuationProcedures: true,
    emergencyProtocols: true,
    safeguardingInEmergencies: true,
    communicationInCrisis: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates 50%", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("calculates 100%", () => {
    expect(pct(3, 3)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 0 for 0 numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Label functions
// ══════════════════════════════════════════════════════════════════════════════

describe("label functions", () => {
  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });

  it("getEmergencyTypeLabel returns correct labels", () => {
    expect(getEmergencyTypeLabel("fire_drill")).toBe("Fire Drill");
    expect(getEmergencyTypeLabel("evacuation_exercise")).toBe("Evacuation Exercise");
    expect(getEmergencyTypeLabel("first_aid_scenario")).toBe("First Aid Scenario");
    expect(getEmergencyTypeLabel("lockdown_procedure")).toBe("Lockdown Procedure");
    expect(getEmergencyTypeLabel("missing_child_protocol")).toBe("Missing Child Protocol");
    expect(getEmergencyTypeLabel("medical_emergency")).toBe("Medical Emergency");
    expect(getEmergencyTypeLabel("utility_failure")).toBe("Utility Failure");
    expect(getEmergencyTypeLabel("severe_weather")).toBe("Severe Weather");
  });

  it("getReadinessLevelLabel returns correct labels", () => {
    expect(getReadinessLevelLabel("excellent")).toBe("Excellent");
    expect(getReadinessLevelLabel("good")).toBe("Good");
    expect(getReadinessLevelLabel("developing")).toBe("Developing");
    expect(getReadinessLevelLabel("limited")).toBe("Limited");
    expect(getReadinessLevelLabel("not_assessed")).toBe("Not Assessed");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateEmergencyQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEmergencyQuality", () => {
  it("returns all zeros for empty drills", () => {
    const result = evaluateEmergencyQuality([]);
    expect(result.totalDrills).toBe(0);
    expect(result.readinessRate).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.childBriefingRate).toBe(0);
    expect(result.debriefRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns max score for perfect drills", () => {
    const drills = [
      makeDrill({ id: "d1" }),
      makeDrill({ id: "d2", readinessLevel: "excellent" }),
    ];
    const result = evaluateEmergencyQuality(drills);
    expect(result.readinessRate).toBe(100);
    expect(result.completionRate).toBe(100);
    expect(result.childBriefingRate).toBe(100);
    expect(result.debriefRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("counts readiness correctly (excellent or good)", () => {
    const drills = [
      makeDrill({ id: "d1", readinessLevel: "excellent" }),
      makeDrill({ id: "d2", readinessLevel: "good" }),
      makeDrill({ id: "d3", readinessLevel: "developing" }),
      makeDrill({ id: "d4", readinessLevel: "limited" }),
    ];
    const result = evaluateEmergencyQuality(drills);
    expect(result.readinessCount).toBe(2);
    expect(result.readinessRate).toBe(50);
  });

  it("calculates partial scores correctly", () => {
    const drills = [
      makeDrill({ id: "d1", completedWithinTarget: false, debriefConducted: false }),
      makeDrill({ id: "d2" }),
    ];
    const result = evaluateEmergencyQuality(drills);
    expect(result.completionRate).toBe(50);
    expect(result.debriefRate).toBe(50);
  });

  it("caps score at 25", () => {
    const drills = [makeDrill()];
    const result = evaluateEmergencyQuality(drills);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles single drill with all false flags", () => {
    const drill = makeDrill({
      readinessLevel: "not_assessed",
      allStaffParticipated: false,
      childrenBriefed: false,
      completedWithinTarget: false,
      documentedProperly: false,
      debriefConducted: false,
      improvementsIdentified: false,
    });
    const result = evaluateEmergencyQuality([drill]);
    expect(result.readinessRate).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.childBriefingRate).toBe(0);
    expect(result.debriefRate).toBe(0);
    expect(result.score).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. evaluateEmergencyCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEmergencyCompliance", () => {
  it("returns all zeros for empty drills", () => {
    const result = evaluateEmergencyCompliance([]);
    expect(result.totalDrills).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.staffParticipationRate).toBe(0);
    expect(result.improvementsRate).toBe(0);
    expect(result.uniqueDrillTypes).toBe(0);
    expect(result.typeDiversityRatio).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns max score for perfect compliance with all 8 drill types", () => {
    const types: EmergencyType[] = [
      "fire_drill", "evacuation_exercise", "first_aid_scenario", "lockdown_procedure",
      "missing_child_protocol", "medical_emergency", "utility_failure", "severe_weather",
    ];
    const drills = types.map((t, i) => makeDrill({ id: `d${i}`, drillType: t }));
    const result = evaluateEmergencyCompliance(drills);
    expect(result.documentedRate).toBe(100);
    expect(result.staffParticipationRate).toBe(100);
    expect(result.improvementsRate).toBe(100);
    expect(result.uniqueDrillTypes).toBe(8);
    expect(result.typeDiversityRatio).toBe(1);
    expect(result.score).toBe(25);
  });

  it("calculates type diversity ratio correctly", () => {
    const drills = [
      makeDrill({ id: "d1", drillType: "fire_drill" }),
      makeDrill({ id: "d2", drillType: "fire_drill" }),
      makeDrill({ id: "d3", drillType: "lockdown_procedure" }),
    ];
    const result = evaluateEmergencyCompliance(drills);
    expect(result.uniqueDrillTypes).toBe(2);
    expect(result.typeDiversityRatio).toBe(0.25);
  });

  it("counts documented drills correctly", () => {
    const drills = [
      makeDrill({ id: "d1", documentedProperly: true }),
      makeDrill({ id: "d2", documentedProperly: false }),
    ];
    const result = evaluateEmergencyCompliance(drills);
    expect(result.documentedCount).toBe(1);
    expect(result.documentedRate).toBe(50);
  });

  it("counts staff participation correctly", () => {
    const drills = [
      makeDrill({ id: "d1", allStaffParticipated: true }),
      makeDrill({ id: "d2", allStaffParticipated: false }),
      makeDrill({ id: "d3", allStaffParticipated: false }),
    ];
    const result = evaluateEmergencyCompliance(drills);
    expect(result.staffParticipationCount).toBe(1);
    expect(result.staffParticipationRate).toBe(33);
  });

  it("caps score at 25", () => {
    const types: EmergencyType[] = [
      "fire_drill", "evacuation_exercise", "first_aid_scenario", "lockdown_procedure",
      "missing_child_protocol", "medical_emergency", "utility_failure", "severe_weather",
    ];
    const drills = types.map((t, i) => makeDrill({ id: `d${i}`, drillType: t }));
    const result = evaluateEmergencyCompliance(drills);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles single drill type yielding low diversity", () => {
    const drills = [
      makeDrill({ id: "d1", drillType: "fire_drill" }),
    ];
    const result = evaluateEmergencyCompliance(drills);
    expect(result.uniqueDrillTypes).toBe(1);
    expect(result.typeDiversityRatio).toBe(0.13);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. evaluateEmergencyPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEmergencyPolicy", () => {
  it("returns score 0 and all false for null policy", () => {
    const result = evaluateEmergencyPolicy(null);
    expect(result.score).toBe(0);
    expect(result.fireEvacuationPlan).toBe(false);
    expect(result.lockdownProcedure).toBe(false);
    expect(result.missingChildProtocol).toBe(false);
    expect(result.medicalEmergencyPlan).toBe(false);
    expect(result.businessContinuityPlan).toBe(false);
    expect(result.emergencyContactSystem).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateEmergencyPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateEmergencyPolicy(makePolicy({
      fireEvacuationPlan: false,
      lockdownProcedure: false,
      missingChildProtocol: false,
      medicalEmergencyPlan: false,
      businessContinuityPlan: false,
      emergencyContactSystem: false,
      regularReview: false,
    }));
    expect(result.score).toBe(0);
  });

  it("scores fire evacuation at 4 points", () => {
    const result = evaluateEmergencyPolicy(makePolicy({
      fireEvacuationPlan: true,
      lockdownProcedure: false,
      missingChildProtocol: false,
      medicalEmergencyPlan: false,
      businessContinuityPlan: false,
      emergencyContactSystem: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("scores 4-point booleans correctly (4+4+4+4=16)", () => {
    const result = evaluateEmergencyPolicy(makePolicy({
      fireEvacuationPlan: true,
      lockdownProcedure: true,
      missingChildProtocol: true,
      medicalEmergencyPlan: true,
      businessContinuityPlan: false,
      emergencyContactSystem: false,
      regularReview: false,
    }));
    expect(result.score).toBe(16);
  });

  it("scores 3-point booleans correctly (3+3+3=9)", () => {
    const result = evaluateEmergencyPolicy(makePolicy({
      fireEvacuationPlan: false,
      lockdownProcedure: false,
      missingChildProtocol: false,
      medicalEmergencyPlan: false,
      businessContinuityPlan: true,
      emergencyContactSystem: true,
      regularReview: true,
    }));
    expect(result.score).toBe(9);
  });

  it("passes through boolean values from the policy", () => {
    const policy = makePolicy({ regularReview: false });
    const result = evaluateEmergencyPolicy(policy);
    expect(result.regularReview).toBe(false);
    expect(result.fireEvacuationPlan).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. evaluateStaffEmergencyReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffEmergencyReadiness", () => {
  it("returns all zeros for empty training", () => {
    const result = evaluateStaffEmergencyReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.firstAidCertifiedRate).toBe(0);
    expect(result.fireMarshallTrainedRate).toBe(0);
    expect(result.evacuationProceduresRate).toBe(0);
    expect(result.emergencyProtocolsRate).toBe(0);
    expect(result.safeguardingInEmergenciesRate).toBe(0);
    expect(result.communicationInCrisisRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns max score for fully trained staff", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
    ];
    const result = evaluateStaffEmergencyReadiness(training);
    expect(result.firstAidCertifiedRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates partial training rates correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", firstAidCertified: true, fireMarshallTrained: false }),
      makeTraining({ id: "t2", staffId: "s2", firstAidCertified: false, fireMarshallTrained: true }),
    ];
    const result = evaluateStaffEmergencyReadiness(training);
    expect(result.firstAidCertifiedCount).toBe(1);
    expect(result.firstAidCertifiedRate).toBe(50);
    expect(result.fireMarshallTrainedCount).toBe(1);
    expect(result.fireMarshallTrainedRate).toBe(50);
  });

  it("handles staff with no training at all", () => {
    const training = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        firstAidCertified: false,
        fireMarshallTrained: false,
        evacuationProcedures: false,
        emergencyProtocols: false,
        safeguardingInEmergencies: false,
        communicationInCrisis: false,
      }),
    ];
    const result = evaluateStaffEmergencyReadiness(training);
    expect(result.score).toBe(0);
  });

  it("caps score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffEmergencyReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("scores first aid at 6 points weight", () => {
    const training = [
      makeTraining({
        id: "t1",
        firstAidCertified: true,
        fireMarshallTrained: false,
        evacuationProcedures: false,
        emergencyProtocols: false,
        safeguardingInEmergencies: false,
        communicationInCrisis: false,
      }),
    ];
    const result = evaluateStaffEmergencyReadiness(training);
    expect(result.score).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. buildDrillTypeSummary
// ══════════════════════════════════════════════════════════════════════════════

describe("buildDrillTypeSummary", () => {
  it("returns empty array for no drills", () => {
    const result = buildDrillTypeSummary([]);
    expect(result).toEqual([]);
  });

  it("groups drills by type", () => {
    const drills = [
      makeDrill({ id: "d1", drillType: "fire_drill", drillDate: "2026-01-01" }),
      makeDrill({ id: "d2", drillType: "fire_drill", drillDate: "2026-02-01" }),
      makeDrill({ id: "d3", drillType: "lockdown_procedure", drillDate: "2026-03-01" }),
    ];
    const result = buildDrillTypeSummary(drills);
    expect(result).toHaveLength(2);
    const fire = result.find((r) => r.drillType === "fire_drill");
    expect(fire?.count).toBe(2);
    const lockdown = result.find((r) => r.drillType === "lockdown_procedure");
    expect(lockdown?.count).toBe(1);
  });

  it("calculates average readiness per type", () => {
    const drills = [
      makeDrill({ id: "d1", drillType: "fire_drill", readinessLevel: "excellent" }),
      makeDrill({ id: "d2", drillType: "fire_drill", readinessLevel: "limited" }),
    ];
    const result = buildDrillTypeSummary(drills);
    const fire = result.find((r) => r.drillType === "fire_drill");
    expect(fire?.avgReadiness).toBe(50);
  });

  it("returns 100% readiness when all drills are excellent or good", () => {
    const drills = [
      makeDrill({ id: "d1", drillType: "fire_drill", readinessLevel: "excellent" }),
      makeDrill({ id: "d2", drillType: "fire_drill", readinessLevel: "good" }),
    ];
    const result = buildDrillTypeSummary(drills);
    const fire = result.find((r) => r.drillType === "fire_drill");
    expect(fire?.avgReadiness).toBe(100);
  });

  it("tracks latest drill date per type", () => {
    const drills = [
      makeDrill({ id: "d1", drillType: "fire_drill", drillDate: "2026-01-10" }),
      makeDrill({ id: "d2", drillType: "fire_drill", drillDate: "2026-05-15" }),
      makeDrill({ id: "d3", drillType: "fire_drill", drillDate: "2026-03-20" }),
    ];
    const result = buildDrillTypeSummary(drills);
    const fire = result.find((r) => r.drillType === "fire_drill");
    expect(fire?.lastDate).toBe("2026-05-15");
  });

  it("handles single drill", () => {
    const drills = [makeDrill({ id: "d1", drillType: "severe_weather", readinessLevel: "developing" })];
    const result = buildDrillTypeSummary(drills);
    expect(result).toHaveLength(1);
    expect(result[0].drillType).toBe("severe_weather");
    expect(result[0].count).toBe(1);
    expect(result[0].avgReadiness).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. generateEmergencyPreparednessIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateEmergencyPreparednessIntelligence", () => {
  const allTypes: EmergencyType[] = [
    "fire_drill", "evacuation_exercise", "first_aid_scenario", "lockdown_procedure",
    "missing_child_protocol", "medical_emergency", "utility_failure", "severe_weather",
  ];

  function perfectDrills(): EmergencyDrill[] {
    return allTypes.map((t, i) =>
      makeDrill({ id: `d${i}`, drillType: t, readinessLevel: "excellent" }),
    );
  }

  function perfectTraining(): StaffEmergencyTraining[] {
    return [
      makeTraining({ id: "t1", staffId: "s1", staffName: "Sarah Johnson" }),
      makeTraining({ id: "t2", staffId: "s2", staffName: "Tom Richards" }),
      makeTraining({ id: "t3", staffId: "s3", staffName: "Lisa Williams" }),
      makeTraining({ id: "t4", staffId: "s4", staffName: "Darren Laville" }),
    ];
  }

  it("returns correct homeId and period", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
  });

  it("caps overall score at 100", () => {
    const result = generateEmergencyPreparednessIntelligence(
      perfectDrills(), makePolicy(), perfectTraining(),
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("achieves outstanding rating with perfect data", () => {
    const result = generateEmergencyPreparednessIntelligence(
      perfectDrills(), makePolicy(), perfectTraining(),
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("returns score 0 with all empty inputs", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("score never goes below 0", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("includes exactly 7 regulatory links", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("regulatory links reference fire safety", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Fire Safety"))).toBe(true);
  });

  it("regulatory links reference CHR 2015 Reg 25", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 25"))).toBe(true);
  });

  it("regulatory links reference Civil Contingencies Act", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Civil Contingencies Act 2004"))).toBe(true);
  });

  it("generates URGENT action when policy is null", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [makeDrill()], null, [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action when staff training is empty", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [makeDrill()], makePolicy(), [],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("staff"))).toBe(true);
  });

  it("includes strengths when evaluator scores >= 20", () => {
    const result = generateEmergencyPreparednessIntelligence(
      perfectDrills(), makePolicy(), perfectTraining(),
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes areas for improvement when evaluator scores < 15", () => {
    const drills = [makeDrill({
      readinessLevel: "limited",
      completedWithinTarget: false,
      childrenBriefed: false,
      debriefConducted: false,
      documentedProperly: false,
      allStaffParticipated: false,
      improvementsIdentified: false,
    })];
    const result = generateEmergencyPreparednessIntelligence(
      drills, null, [],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("includes drill summary from buildDrillTypeSummary", () => {
    const drills = [
      makeDrill({ id: "d1", drillType: "fire_drill" }),
      makeDrill({ id: "d2", drillType: "lockdown_procedure" }),
    ];
    const result = generateEmergencyPreparednessIntelligence(
      drills, makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.drillSummary).toHaveLength(2);
  });

  it("drill summary is empty when no drills provided", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [], makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.drillSummary).toEqual([]);
  });

  it("generates action for low readiness rate", () => {
    const drills = [
      makeDrill({ id: "d1", readinessLevel: "limited" }),
      makeDrill({ id: "d2", readinessLevel: "not_assessed" }),
      makeDrill({ id: "d3", readinessLevel: "developing" }),
    ];
    const result = generateEmergencyPreparednessIntelligence(
      drills, makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("readiness"))).toBe(true);
  });

  it("generates action for low documentation rate", () => {
    const drills = [
      makeDrill({ id: "d1", documentedProperly: false }),
      makeDrill({ id: "d2", documentedProperly: false }),
      makeDrill({ id: "d3", documentedProperly: false }),
    ];
    const result = generateEmergencyPreparednessIntelligence(
      drills, makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("documented"))).toBe(true);
  });

  it("all 4 evaluator results are present", () => {
    const result = generateEmergencyPreparednessIntelligence(
      [makeDrill()], makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.emergencyQuality).toBeDefined();
    expect(result.emergencyCompliance).toBeDefined();
    expect(result.emergencyPolicy).toBeDefined();
    expect(result.staffEmergencyReadiness).toBeDefined();
  });

  it("overall score equals sum of evaluator scores when under 100", () => {
    // Use partial data so scores are moderate
    const drills = [makeDrill({ id: "d1", readinessLevel: "developing", completedWithinTarget: false })];
    const result = generateEmergencyPreparednessIntelligence(
      drills, makePolicy({ regularReview: false }), [makeTraining({ firstAidCertified: false })],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    const expectedSum = result.emergencyQuality.score
      + result.emergencyCompliance.score
      + result.emergencyPolicy.score
      + result.staffEmergencyReadiness.score;
    expect(result.overallScore).toBe(Math.min(Math.round(expectedSum), 100));
  });

  it("includes strengths for all evaluators scoring >= 20", () => {
    const result = generateEmergencyPreparednessIntelligence(
      perfectDrills(), makePolicy(), perfectTraining(),
      "oak-house", "2026-01-01", "2026-05-20",
    );
    // With perfect data, all 4 evaluators should score >= 20
    expect(result.strengths.length).toBeGreaterThanOrEqual(4);
  });

  it("generates child briefing action when rate < 50", () => {
    const drills = [
      makeDrill({ id: "d1", childrenBriefed: false }),
      makeDrill({ id: "d2", childrenBriefed: false }),
      makeDrill({ id: "d3", childrenBriefed: false }),
    ];
    const result = generateEmergencyPreparednessIntelligence(
      drills, makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("brief children"))).toBe(true);
  });

  it("generates debrief action when rate < 50", () => {
    const drills = [
      makeDrill({ id: "d1", debriefConducted: false }),
      makeDrill({ id: "d2", debriefConducted: false }),
      makeDrill({ id: "d3", debriefConducted: false }),
    ];
    const result = generateEmergencyPreparednessIntelligence(
      drills, makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("debrief"))).toBe(true);
  });
});
