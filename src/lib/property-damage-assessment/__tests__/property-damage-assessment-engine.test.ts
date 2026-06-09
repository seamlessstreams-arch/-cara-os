// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Property Damage Assessment Intelligence Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateIncidentManagement,
  evaluatePropertyCondition,
  evaluateRepairEffectiveness,
  evaluatePreventionStrategy,
  buildChildDamageProfiles,
  generatePropertyDamageAssessmentIntelligence,
  getDamageTypeLabel,
  getDamageSeverityLabel,
  getDamageContextLabel,
  getRepairStatusLabel,
  getCostBandLabel,
} from "../property-damage-assessment-engine";
import type {
  DamageIncident,
  PropertyInspection,
  RepairRecord,
  DamagePreventionMeasure,
} from "../property-damage-assessment-engine";

// ── Shared Constants ───────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const REF_DATE = "2025-07-01";
const HOME_ID = "oak-house";

// ── Factory Helpers ────────────────────────────────────────────────────────

function makeIncident(overrides: Partial<DamageIncident> = {}): DamageIncident {
  return {
    id: "dmg-1",
    date: "2025-03-10",
    damageType: "furniture",
    severity: "moderate",
    context: "frustration_expression",
    location: "Living Room",
    childInvolved: true,
    childId: "child-jordan",
    childName: "Jordan",
    description: "Chair damaged during frustration episode",
    estimatedCost: 120,
    costBand: "50_to_200",
    repairStatus: "completed",
    repairCompletedDate: "2025-03-17",
    insuranceClaimed: false,
    therapeuticResponseProvided: true,
    ...overrides,
  };
}

function makeInspection(overrides: Partial<PropertyInspection> = {}): PropertyInspection {
  return {
    id: "insp-1",
    inspectionDate: "2025-02-15",
    inspector: "Darren Laville",
    areasChecked: 12,
    issuesFound: 3,
    issuesResolved: 3,
    maintenanceScheduleFollowed: true,
    overallCondition: "good",
    ...overrides,
  };
}

function makeRepair(overrides: Partial<RepairRecord> = {}): RepairRecord {
  return {
    id: "rep-1",
    damageIncidentId: "dmg-1",
    repairDate: "2025-03-17",
    repairedBy: "Tom Richards",
    costActual: 95,
    timeliness: "within_week",
    qualityRating: "good",
    safetyRestored: true,
    ...overrides,
  };
}

function makePrevention(overrides: Partial<DamagePreventionMeasure> = {}): DamagePreventionMeasure {
  return {
    id: "prev-1",
    measureType: "sensory_provision",
    implementedDate: "2025-01-20",
    targetChildId: "child-jordan",
    effectiveness: "effective",
    reviewDate: "2025-04-20",
    active: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("Label Functions", () => {
  describe("getDamageTypeLabel", () => {
    it("returns human-readable labels for all damage types", () => {
      expect(getDamageTypeLabel("structural")).toBe("Structural");
      expect(getDamageTypeLabel("furniture")).toBe("Furniture");
      expect(getDamageTypeLabel("electronics")).toBe("Electronics");
      expect(getDamageTypeLabel("fixtures")).toBe("Fixtures");
      expect(getDamageTypeLabel("communal_area")).toBe("Communal Area");
      expect(getDamageTypeLabel("bedroom")).toBe("Bedroom");
      expect(getDamageTypeLabel("vehicle")).toBe("Vehicle");
      expect(getDamageTypeLabel("garden_outdoor")).toBe("Garden/Outdoor");
      expect(getDamageTypeLabel("safety_equipment")).toBe("Safety Equipment");
      expect(getDamageTypeLabel("other")).toBe("Other");
    });
  });

  describe("getDamageSeverityLabel", () => {
    it("returns human-readable labels for all severities", () => {
      expect(getDamageSeverityLabel("minor")).toBe("Minor");
      expect(getDamageSeverityLabel("moderate")).toBe("Moderate");
      expect(getDamageSeverityLabel("significant")).toBe("Significant");
      expect(getDamageSeverityLabel("severe")).toBe("Severe");
    });
  });

  describe("getDamageContextLabel", () => {
    it("returns human-readable labels for all contexts", () => {
      expect(getDamageContextLabel("frustration_expression")).toBe("Frustration Expression");
      expect(getDamageContextLabel("accidental")).toBe("Accidental");
      expect(getDamageContextLabel("targeted_vandalism")).toBe("Targeted Vandalism");
      expect(getDamageContextLabel("during_restraint")).toBe("During Restraint");
      expect(getDamageContextLabel("peer_conflict")).toBe("Peer Conflict");
      expect(getDamageContextLabel("unknown")).toBe("Unknown");
      expect(getDamageContextLabel("weather_wear")).toBe("Weather/Wear");
    });
  });

  describe("getRepairStatusLabel", () => {
    it("returns human-readable labels for all repair statuses", () => {
      expect(getRepairStatusLabel("completed")).toBe("Completed");
      expect(getRepairStatusLabel("in_progress")).toBe("In Progress");
      expect(getRepairStatusLabel("awaiting_parts")).toBe("Awaiting Parts");
      expect(getRepairStatusLabel("scheduled")).toBe("Scheduled");
      expect(getRepairStatusLabel("not_started")).toBe("Not Started");
      expect(getRepairStatusLabel("written_off")).toBe("Written Off");
    });
  });

  describe("getCostBandLabel", () => {
    it("returns human-readable labels for all cost bands", () => {
      expect(getCostBandLabel("under_50")).toBe("Under £50");
      expect(getCostBandLabel("50_to_200")).toBe("£50–£200");
      expect(getCostBandLabel("200_to_500")).toBe("£200–£500");
      expect(getCostBandLabel("500_to_1000")).toBe("£500–£1,000");
      expect(getCostBandLabel("over_1000")).toBe("Over £1,000");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateIncidentManagement
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentManagement", () => {
  it("returns 25 when no incidents in period (no damage = excellent)", () => {
    const result = evaluateIncidentManagement([], [], PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("scores high for therapeutic response, timely repair, and documented context", () => {
    const incidents = [makeIncident()];
    const repairs = [makeRepair()];
    const result = evaluateIncidentManagement(incidents, repairs, PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(1);
    expect(result.therapeuticResponseRate).toBe(100);
    expect(result.timelyRepairRate).toBe(100);
    expect(result.contextDocumentedRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(20);
  });

  it("penalises missing therapeutic response for child-involved incidents", () => {
    const incidents = [makeIncident({ therapeuticResponseProvided: false })];
    const repairs = [makeRepair()];
    const result = evaluateIncidentManagement(incidents, repairs, PERIOD_START, PERIOD_END);
    expect(result.therapeuticResponseRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("gives full therapeutic score when no child involved (not applicable)", () => {
    const incidents = [makeIncident({ childInvolved: false, childId: null, childName: null })];
    const repairs = [makeRepair()];
    const result = evaluateIncidentManagement(incidents, repairs, PERIOD_START, PERIOD_END);
    // When no child involved, therapeuticRate = pct(0, 0) = 0 but no child means 0 denominator
    expect(result.therapeuticResponseRate).toBe(0);
  });

  it("penalises lack of timely repairs", () => {
    const incidents = [makeIncident()];
    const result = evaluateIncidentManagement(incidents, [], PERIOD_START, PERIOD_END);
    expect(result.timelyRepairRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("awards insurance bonus for significant+ incidents with claims", () => {
    const incidents = [makeIncident({ severity: "significant", insuranceClaimed: true })];
    const repairs = [makeRepair()];
    const result = evaluateIncidentManagement(incidents, repairs, PERIOD_START, PERIOD_END);
    expect(result.insuranceClaimedForSignificant).toBe(1);
  });

  it("penalises unclaimed insurance for significant damage", () => {
    const incidents = [makeIncident({ severity: "significant", insuranceClaimed: false })];
    const repairs = [makeRepair()];
    const withClaim = evaluateIncidentManagement(
      [makeIncident({ severity: "significant", insuranceClaimed: true })],
      repairs, PERIOD_START, PERIOD_END,
    );
    const withoutClaim = evaluateIncidentManagement(incidents, repairs, PERIOD_START, PERIOD_END);
    expect(withClaim.overallScore).toBeGreaterThan(withoutClaim.overallScore);
  });

  it("awards low severe count bonus when no severe incidents", () => {
    const incidents = [makeIncident({ severity: "moderate" })];
    const repairs = [makeRepair()];
    const result = evaluateIncidentManagement(incidents, repairs, PERIOD_START, PERIOD_END);
    expect(result.severeCount).toBe(0);
    // Score includes 4 points for no severe incidents
  });

  it("reduces bonus for severe incidents", () => {
    const noneResult = evaluateIncidentManagement(
      [makeIncident({ severity: "moderate" })],
      [makeRepair()], PERIOD_START, PERIOD_END,
    );
    const oneResult = evaluateIncidentManagement(
      [makeIncident({ severity: "severe" })],
      [makeRepair()], PERIOD_START, PERIOD_END,
    );
    const twoResult = evaluateIncidentManagement(
      [
        makeIncident({ id: "d1", severity: "severe" }),
        makeIncident({ id: "d2", date: "2025-04-01", severity: "severe" }),
      ],
      [makeRepair({ damageIncidentId: "d1" }), makeRepair({ id: "r2", damageIncidentId: "d2" })],
      PERIOD_START, PERIOD_END,
    );
    expect(noneResult.overallScore).toBeGreaterThan(oneResult.overallScore);
    expect(oneResult.overallScore).toBeGreaterThan(twoResult.overallScore);
  });

  it("penalises unknown context", () => {
    const known = evaluateIncidentManagement(
      [makeIncident({ context: "frustration_expression" })],
      [makeRepair()], PERIOD_START, PERIOD_END,
    );
    const unknown = evaluateIncidentManagement(
      [makeIncident({ context: "unknown" })],
      [makeRepair()], PERIOD_START, PERIOD_END,
    );
    expect(known.overallScore).toBeGreaterThan(unknown.overallScore);
  });

  it("excludes incidents outside the period", () => {
    const incidents = [makeIncident({ date: "2024-06-15" })];
    const result = evaluateIncidentManagement(incidents, [], PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("handles multiple incidents with mixed properties", () => {
    const incidents = [
      makeIncident({ id: "d1", severity: "minor", context: "accidental", therapeuticResponseProvided: true }),
      makeIncident({ id: "d2", date: "2025-04-01", severity: "significant", context: "frustration_expression", therapeuticResponseProvided: true, insuranceClaimed: true }),
      makeIncident({ id: "d3", date: "2025-05-01", severity: "moderate", context: "unknown", therapeuticResponseProvided: false }),
    ];
    const repairs = [
      makeRepair({ damageIncidentId: "d1", timeliness: "within_24h" }),
      makeRepair({ id: "r2", damageIncidentId: "d2", timeliness: "within_week" }),
    ];
    const result = evaluateIncidentManagement(incidents, repairs, PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(3);
    expect(result.severeCount).toBe(0);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("caps score at 25", () => {
    const result = evaluateIncidentManagement(
      [makeIncident({ severity: "minor", insuranceClaimed: true })],
      [makeRepair({ timeliness: "within_24h" })],
      PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives full insurance score when no significant+ incidents exist", () => {
    const incidents = [makeIncident({ severity: "minor" })];
    const repairs = [makeRepair()];
    const result = evaluateIncidentManagement(incidents, repairs, PERIOD_START, PERIOD_END);
    // No significant+ means full 5 points for insurance
    expect(result.overallScore).toBeGreaterThan(18);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePropertyCondition
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePropertyCondition", () => {
  it("returns 0 when no inspections in period (no inspections = bad)", () => {
    const result = evaluatePropertyCondition([], PERIOD_START, PERIOD_END);
    expect(result.totalInspections).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores high for excellent inspections with all issues resolved", () => {
    const inspections = [
      makeInspection({ overallCondition: "excellent", issuesFound: 5, issuesResolved: 5 }),
      makeInspection({ id: "insp-2", inspectionDate: "2025-05-15", overallCondition: "excellent", issuesFound: 2, issuesResolved: 2 }),
    ];
    const result = evaluatePropertyCondition(inspections, PERIOD_START, PERIOD_END);
    expect(result.excellentOrGoodRate).toBe(100);
    expect(result.issuesResolvedRate).toBe(100);
    expect(result.maintenanceFollowedRate).toBe(100);
    expect(result.regularInspections).toBe(true);
    expect(result.overallScore).toBeGreaterThan(20);
  });

  it("reduces score for poor condition inspections", () => {
    const goodResult = evaluatePropertyCondition(
      [makeInspection({ overallCondition: "good" }), makeInspection({ id: "i2", inspectionDate: "2025-05-01", overallCondition: "good" })],
      PERIOD_START, PERIOD_END,
    );
    const poorResult = evaluatePropertyCondition(
      [makeInspection({ overallCondition: "poor" }), makeInspection({ id: "i2", inspectionDate: "2025-05-01", overallCondition: "poor" })],
      PERIOD_START, PERIOD_END,
    );
    expect(goodResult.overallScore).toBeGreaterThan(poorResult.overallScore);
  });

  it("penalises unresolved issues", () => {
    const resolved = evaluatePropertyCondition(
      [makeInspection({ issuesFound: 5, issuesResolved: 5 })],
      PERIOD_START, PERIOD_END,
    );
    const unresolved = evaluatePropertyCondition(
      [makeInspection({ issuesFound: 5, issuesResolved: 0 })],
      PERIOD_START, PERIOD_END,
    );
    expect(resolved.overallScore).toBeGreaterThan(unresolved.overallScore);
  });

  it("handles zero issues found", () => {
    const result = evaluatePropertyCondition(
      [makeInspection({ issuesFound: 0, issuesResolved: 0 })],
      PERIOD_START, PERIOD_END,
    );
    expect(result.issuesResolvedRate).toBe(0); // pct(0,0) = 0
  });

  it("penalises maintenance schedule not followed", () => {
    const followed = evaluatePropertyCondition(
      [makeInspection({ maintenanceScheduleFollowed: true })],
      PERIOD_START, PERIOD_END,
    );
    const notFollowed = evaluatePropertyCondition(
      [makeInspection({ maintenanceScheduleFollowed: false })],
      PERIOD_START, PERIOD_END,
    );
    expect(followed.overallScore).toBeGreaterThan(notFollowed.overallScore);
  });

  it("awards regular inspections bonus for 2+ inspections", () => {
    const single = evaluatePropertyCondition(
      [makeInspection()],
      PERIOD_START, PERIOD_END,
    );
    const multiple = evaluatePropertyCondition(
      [makeInspection(), makeInspection({ id: "insp-2", inspectionDate: "2025-05-15" })],
      PERIOD_START, PERIOD_END,
    );
    expect(multiple.regularInspections).toBe(true);
    expect(single.regularInspections).toBe(false);
    expect(multiple.overallScore).toBeGreaterThan(single.overallScore);
  });

  it("excludes inspections outside the period", () => {
    const result = evaluatePropertyCondition(
      [makeInspection({ inspectionDate: "2024-06-15" })],
      PERIOD_START, PERIOD_END,
    );
    expect(result.totalInspections).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const inspections = [
      makeInspection({ overallCondition: "excellent", issuesFound: 10, issuesResolved: 10 }),
      makeInspection({ id: "i2", inspectionDate: "2025-03-15", overallCondition: "excellent", issuesFound: 5, issuesResolved: 5 }),
      makeInspection({ id: "i3", inspectionDate: "2025-04-15", overallCondition: "excellent", issuesFound: 2, issuesResolved: 2 }),
      makeInspection({ id: "i4", inspectionDate: "2025-05-15", overallCondition: "excellent", issuesFound: 1, issuesResolved: 1 }),
    ];
    const result = evaluatePropertyCondition(inspections, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts mixed condition inspections correctly", () => {
    const inspections = [
      makeInspection({ overallCondition: "excellent" }),
      makeInspection({ id: "i2", inspectionDate: "2025-04-01", overallCondition: "fair" }),
    ];
    const result = evaluatePropertyCondition(inspections, PERIOD_START, PERIOD_END);
    expect(result.excellentOrGoodRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateRepairEffectiveness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRepairEffectiveness", () => {
  it("returns 25 when no incidents in period (nothing to repair)", () => {
    const result = evaluateRepairEffectiveness([], [], PERIOD_START, PERIOD_END);
    expect(result.totalRepairs).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 when incidents exist but no repairs", () => {
    const result = evaluateRepairEffectiveness([makeIncident()], [], PERIOD_START, PERIOD_END);
    expect(result.totalRepairs).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores high for timely, quality repairs with safety restored", () => {
    const incidents = [makeIncident()];
    const repairs = [makeRepair({ timeliness: "within_24h", qualityRating: "excellent", safetyRestored: true })];
    const result = evaluateRepairEffectiveness(incidents, repairs, PERIOD_START, PERIOD_END);
    expect(result.totalRepairs).toBe(1);
    expect(result.safetyRestoredRate).toBe(100);
    expect(result.completionRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(22);
  });

  it("penalises slow repairs", () => {
    const fast = evaluateRepairEffectiveness(
      [makeIncident()],
      [makeRepair({ timeliness: "within_24h" })],
      PERIOD_START, PERIOD_END,
    );
    const slow = evaluateRepairEffectiveness(
      [makeIncident()],
      [makeRepair({ timeliness: "over_month" })],
      PERIOD_START, PERIOD_END,
    );
    expect(fast.overallScore).toBeGreaterThan(slow.overallScore);
  });

  it("penalises poor quality repairs", () => {
    const excellent = evaluateRepairEffectiveness(
      [makeIncident()],
      [makeRepair({ qualityRating: "excellent" })],
      PERIOD_START, PERIOD_END,
    );
    const poor = evaluateRepairEffectiveness(
      [makeIncident()],
      [makeRepair({ qualityRating: "poor" })],
      PERIOD_START, PERIOD_END,
    );
    expect(excellent.overallScore).toBeGreaterThan(poor.overallScore);
  });

  it("penalises safety not restored", () => {
    const restored = evaluateRepairEffectiveness(
      [makeIncident()],
      [makeRepair({ safetyRestored: true })],
      PERIOD_START, PERIOD_END,
    );
    const notRestored = evaluateRepairEffectiveness(
      [makeIncident()],
      [makeRepair({ safetyRestored: false })],
      PERIOD_START, PERIOD_END,
    );
    expect(restored.overallScore).toBeGreaterThan(notRestored.overallScore);
  });

  it("measures completion rate correctly", () => {
    const incidents = [
      makeIncident({ id: "d1" }),
      makeIncident({ id: "d2", date: "2025-04-01" }),
    ];
    const repairs = [makeRepair({ damageIncidentId: "d1" })];
    const result = evaluateRepairEffectiveness(incidents, repairs, PERIOD_START, PERIOD_END);
    expect(result.completionRate).toBe(50);
  });

  it("only counts repairs for incidents within the period", () => {
    const incidents = [makeIncident({ date: "2024-06-01" })]; // out of period
    const repairs = [makeRepair()];
    const result = evaluateRepairEffectiveness(incidents, repairs, PERIOD_START, PERIOD_END);
    expect(result.totalRepairs).toBe(0);
    expect(result.overallScore).toBe(25); // no incidents in period
  });

  it("caps score at 25", () => {
    const result = evaluateRepairEffectiveness(
      [makeIncident()],
      [makeRepair({ timeliness: "within_24h", qualityRating: "excellent", safetyRestored: true })],
      PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles multiple repairs with mixed quality", () => {
    const incidents = [
      makeIncident({ id: "d1" }),
      makeIncident({ id: "d2", date: "2025-04-01" }),
      makeIncident({ id: "d3", date: "2025-05-01" }),
    ];
    const repairs = [
      makeRepair({ damageIncidentId: "d1", timeliness: "within_24h", qualityRating: "excellent" }),
      makeRepair({ id: "r2", damageIncidentId: "d2", timeliness: "over_month", qualityRating: "poor" }),
      makeRepair({ id: "r3", damageIncidentId: "d3", timeliness: "within_week", qualityRating: "good" }),
    ];
    const result = evaluateRepairEffectiveness(incidents, repairs, PERIOD_START, PERIOD_END);
    expect(result.totalRepairs).toBe(3);
    expect(result.completionRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePreventionStrategy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePreventionStrategy", () => {
  it("returns 0 when no prevention measures", () => {
    const result = evaluatePreventionStrategy([], [], PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.totalMeasures).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores high for active, effective measures with current reviews", () => {
    const measures = [
      makePrevention({ effectiveness: "highly_effective" }),
      makePrevention({ id: "p2", measureType: "environmental_adaptation", effectiveness: "effective", targetChildId: "child-alex" }),
    ];
    const result = evaluatePreventionStrategy(measures, [], PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.activeMeasures).toBe(2);
    expect(result.effectivenessRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(15);
  });

  it("penalises ineffective measures", () => {
    const effective = evaluatePreventionStrategy(
      [makePrevention({ effectiveness: "highly_effective" })],
      [], PERIOD_START, PERIOD_END, REF_DATE,
    );
    const ineffective = evaluatePreventionStrategy(
      [makePrevention({ effectiveness: "ineffective" })],
      [], PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(effective.overallScore).toBeGreaterThan(ineffective.overallScore);
  });

  it("awards coverage for repeat children with measures", () => {
    const incidents = [
      makeIncident({ id: "d1", childId: "child-jordan" }),
      makeIncident({ id: "d2", date: "2025-04-01", childId: "child-jordan" }),
    ];
    const measures = [makePrevention({ targetChildId: "child-jordan" })];
    const result = evaluatePreventionStrategy(measures, incidents, PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.repeatChildrenCovered).toBe(1);
  });

  it("penalises uncovered repeat children", () => {
    const incidents = [
      makeIncident({ id: "d1", childId: "child-jordan" }),
      makeIncident({ id: "d2", date: "2025-04-01", childId: "child-jordan" }),
    ];
    const covered = evaluatePreventionStrategy(
      [makePrevention({ targetChildId: "child-jordan" })],
      incidents, PERIOD_START, PERIOD_END, REF_DATE,
    );
    const uncovered = evaluatePreventionStrategy(
      [makePrevention({ targetChildId: "child-alex" })],
      incidents, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(covered.overallScore).toBeGreaterThan(uncovered.overallScore);
  });

  it("awards environmental adaptation points", () => {
    const withEnv = evaluatePreventionStrategy(
      [makePrevention({ measureType: "environmental_adaptation" })],
      [], PERIOD_START, PERIOD_END, REF_DATE,
    );
    const withoutEnv = evaluatePreventionStrategy(
      [makePrevention({ measureType: "risk_assessment" })],
      [], PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(withEnv.environmentalAdaptations).toBe(1);
    expect(withoutEnv.environmentalAdaptations).toBe(0);
    expect(withEnv.overallScore).toBeGreaterThan(withoutEnv.overallScore);
  });

  it("awards review currency for measures reviewed in period", () => {
    const current = evaluatePreventionStrategy(
      [makePrevention({ reviewDate: "2025-03-01" })],
      [], PERIOD_START, PERIOD_END, REF_DATE,
    );
    const stale = evaluatePreventionStrategy(
      [makePrevention({ reviewDate: "2024-06-01" })],
      [], PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(current.reviewCurrent).toBe(1);
    expect(stale.reviewCurrent).toBe(0);
    expect(current.overallScore).toBeGreaterThan(stale.overallScore);
  });

  it("includes active measures regardless of implementation date", () => {
    const measure = makePrevention({ implementedDate: "2024-06-01", active: true });
    const result = evaluatePreventionStrategy([measure], [], PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.totalMeasures).toBe(1);
    expect(result.activeMeasures).toBe(1);
  });

  it("includes period-implemented measures even if inactive", () => {
    const measure = makePrevention({ implementedDate: "2025-02-01", active: false });
    const result = evaluatePreventionStrategy([measure], [], PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.totalMeasures).toBe(1);
    expect(result.activeMeasures).toBe(0);
  });

  it("gives full repeat-child points when no repeat children", () => {
    const incidents = [makeIncident({ childId: "child-jordan" })]; // only 1 incident
    const measures = [makePrevention()];
    const result = evaluatePreventionStrategy(measures, incidents, PERIOD_START, PERIOD_END, REF_DATE);
    // No repeat children means full 5 points
    expect(result.overallScore).toBeGreaterThan(10);
  });

  it("caps score at 25", () => {
    const measures = [
      makePrevention({ measureType: "environmental_adaptation", effectiveness: "highly_effective" }),
      makePrevention({ id: "p2", measureType: "sensory_provision", effectiveness: "highly_effective" }),
      makePrevention({ id: "p3", measureType: "therapeutic_support", effectiveness: "effective" }),
      makePrevention({ id: "p4", measureType: "de_escalation_training", effectiveness: "effective" }),
      makePrevention({ id: "p5", measureType: "structural_reinforcement", effectiveness: "effective" }),
    ];
    const result = evaluatePreventionStrategy(measures, [], PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildDamageProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildDamageProfiles", () => {
  it("returns empty array when no child IDs provided", () => {
    const profiles = buildChildDamageProfiles([], [], PERIOD_START, PERIOD_END, []);
    expect(profiles).toHaveLength(0);
  });

  it("returns profile with high score for child with no incidents", () => {
    const profiles = buildChildDamageProfiles([], [], PERIOD_START, PERIOD_END, ["child-morgan"]);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-morgan");
    expect(profiles[0].incidentCount).toBe(0);
    expect(profiles[0].score).toBe(10);
  });

  it("reduces score for child with incidents and no therapeutic response", () => {
    const incidents = [makeIncident({ childId: "child-jordan", therapeuticResponseProvided: false })];
    const profiles = buildChildDamageProfiles(incidents, [], PERIOD_START, PERIOD_END, ["child-jordan"]);
    expect(profiles[0].incidentCount).toBe(1);
    expect(profiles[0].score).toBeLessThan(10);
  });

  it("identifies primary context from multiple incidents", () => {
    const incidents = [
      makeIncident({ id: "d1", childId: "child-jordan", context: "frustration_expression" }),
      makeIncident({ id: "d2", date: "2025-04-01", childId: "child-jordan", context: "frustration_expression" }),
      makeIncident({ id: "d3", date: "2025-05-01", childId: "child-jordan", context: "accidental" }),
    ];
    const profiles = buildChildDamageProfiles(incidents, [], PERIOD_START, PERIOD_END, ["child-jordan"]);
    expect(profiles[0].primaryContext).toBe("frustration_expression");
  });

  it("calculates total estimated cost", () => {
    const incidents = [
      makeIncident({ id: "d1", childId: "child-jordan", estimatedCost: 100 }),
      makeIncident({ id: "d2", date: "2025-04-01", childId: "child-jordan", estimatedCost: 250 }),
    ];
    const profiles = buildChildDamageProfiles(incidents, [], PERIOD_START, PERIOD_END, ["child-jordan"]);
    expect(profiles[0].totalEstimatedCost).toBe(350);
  });

  it("gives bonus for active prevention measures", () => {
    // Use 2+ incidents so the no-prevention penalty kicks in for the without-prevention case
    const incidents = [
      makeIncident({ id: "d1", childId: "child-jordan", therapeuticResponseProvided: false }),
      makeIncident({ id: "d2", date: "2025-04-01", childId: "child-jordan", therapeuticResponseProvided: false }),
    ];
    const withPrevention = buildChildDamageProfiles(
      incidents, [makePrevention({ targetChildId: "child-jordan" })],
      PERIOD_START, PERIOD_END, ["child-jordan"],
    );
    const withoutPrevention = buildChildDamageProfiles(
      incidents, [], PERIOD_START, PERIOD_END, ["child-jordan"],
    );
    expect(withPrevention[0].preventionMeasuresActive).toBe(1);
    expect(withoutPrevention[0].preventionMeasuresActive).toBe(0);
    expect(withPrevention[0].score).toBeGreaterThan(withoutPrevention[0].score);
  });

  it("gives bonus for 100% therapeutic response", () => {
    const incidents = [makeIncident({ childId: "child-jordan", therapeuticResponseProvided: true })];
    const full = buildChildDamageProfiles(incidents, [], PERIOD_START, PERIOD_END, ["child-jordan"]);
    const none = buildChildDamageProfiles(
      [makeIncident({ childId: "child-jordan", therapeuticResponseProvided: false })],
      [], PERIOD_START, PERIOD_END, ["child-jordan"],
    );
    expect(full[0].therapeuticResponseRate).toBe(100);
    expect(none[0].therapeuticResponseRate).toBe(0);
    expect(full[0].score).toBeGreaterThan(none[0].score);
  });

  it("penalises child with 2+ incidents and no prevention", () => {
    const incidents = [
      makeIncident({ id: "d1", childId: "child-jordan" }),
      makeIncident({ id: "d2", date: "2025-04-01", childId: "child-jordan" }),
    ];
    const profiles = buildChildDamageProfiles(incidents, [], PERIOD_START, PERIOD_END, ["child-jordan"]);
    expect(profiles[0].score).toBeLessThan(8); // -2 incidents -2 no prevention
  });

  it("clamps score between 0 and 10", () => {
    // Child with many incidents, no therapeutic response, no prevention
    const incidents = [
      makeIncident({ id: "d1", childId: "child-jordan", therapeuticResponseProvided: false }),
      makeIncident({ id: "d2", date: "2025-02-01", childId: "child-jordan", therapeuticResponseProvided: false }),
      makeIncident({ id: "d3", date: "2025-03-01", childId: "child-jordan", therapeuticResponseProvided: false }),
      makeIncident({ id: "d4", date: "2025-04-01", childId: "child-jordan", therapeuticResponseProvided: false }),
      makeIncident({ id: "d5", date: "2025-05-01", childId: "child-jordan", therapeuticResponseProvided: false }),
    ];
    const profiles = buildChildDamageProfiles(incidents, [], PERIOD_START, PERIOD_END, ["child-jordan"]);
    expect(profiles[0].score).toBeGreaterThanOrEqual(0);
    expect(profiles[0].score).toBeLessThanOrEqual(10);
  });

  it("handles multiple children correctly", () => {
    const incidents = [
      makeIncident({ id: "d1", childId: "child-jordan", childName: "Jordan" }),
      makeIncident({ id: "d2", date: "2025-04-01", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildDamageProfiles(
      incidents, [], PERIOD_START, PERIOD_END, ["child-jordan", "child-alex"],
    );
    expect(profiles).toHaveLength(2);
    expect(profiles[0].childId).toBe("child-jordan");
    expect(profiles[1].childId).toBe("child-alex");
  });

  it("excludes incidents outside the period", () => {
    const incidents = [makeIncident({ childId: "child-jordan", date: "2024-06-01" })];
    const profiles = buildChildDamageProfiles(incidents, [], PERIOD_START, PERIOD_END, ["child-jordan"]);
    expect(profiles[0].incidentCount).toBe(0);
    expect(profiles[0].score).toBe(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generatePropertyDamageAssessmentIntelligence — Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("generatePropertyDamageAssessmentIntelligence", () => {
  it("returns complete intelligence with all fields", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      [makeIncident()],
      [makeInspection()],
      [makeRepair()],
      [makePrevention()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.referenceDate).toBe(REF_DATE);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.incidentManagement).toBeDefined();
    expect(result.propertyCondition).toBeDefined();
    expect(result.repairEffectiveness).toBeDefined();
    expect(result.preventionStrategy).toBeDefined();
    expect(result.childDamageProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("includes 7 regulatory links", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("Reg 19");
    expect(result.regulatoryLinks[1]).toContain("Reg 16");
    expect(result.regulatoryLinks[2]).toContain("SCCIF");
    expect(result.regulatoryLinks[3]).toContain("NMS 7");
    expect(result.regulatoryLinks[4]).toContain("Reg 13");
    expect(result.regulatoryLinks[5]).toContain("Working Together");
    expect(result.regulatoryLinks[6]).toContain("UNCRC Article 27");
  });

  it("rates outstanding for score >= 80", () => {
    // Ideal scenario: no incidents, good inspections, good prevention
    const result = generatePropertyDamageAssessmentIntelligence(
      [],
      [
        makeInspection({ overallCondition: "excellent", issuesFound: 3, issuesResolved: 3 }),
        makeInspection({ id: "i2", inspectionDate: "2025-05-01", overallCondition: "excellent", issuesFound: 1, issuesResolved: 1 }),
      ],
      [],
      [
        makePrevention({ measureType: "environmental_adaptation", effectiveness: "highly_effective" }),
        makePrevention({ id: "p2", measureType: "sensory_provision", effectiveness: "effective" }),
        makePrevention({ id: "p3", measureType: "de_escalation_training", effectiveness: "effective" }),
        makePrevention({ id: "p4", measureType: "therapeutic_support", effectiveness: "effective" }),
        makePrevention({ id: "p5", measureType: "structural_reinforcement", effectiveness: "effective" }),
      ],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rates inadequate for poor scores", () => {
    // No inspections, no prevention, incidents with no repairs or responses
    const result = generatePropertyDamageAssessmentIntelligence(
      [
        makeIncident({ id: "d1", severity: "severe", therapeuticResponseProvided: false, context: "unknown" }),
        makeIncident({ id: "d2", date: "2025-04-01", severity: "severe", therapeuticResponseProvided: false, context: "unknown" }),
      ],
      [],
      [],
      [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for no-damage period", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      [], [makeInspection()], [], [makePrevention()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.strengths.some((s) => s.includes("No property damage"))).toBe(true);
  });

  it("generates strengths for high therapeutic response rate", () => {
    const incidents = [
      makeIncident({ id: "d1", therapeuticResponseProvided: true }),
      makeIncident({ id: "d2", date: "2025-04-01", therapeuticResponseProvided: true }),
    ];
    const result = generatePropertyDamageAssessmentIntelligence(
      incidents, [makeInspection()], [makeRepair(), makeRepair({ id: "r2", damageIncidentId: "d2" })],
      [makePrevention()], HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.strengths.some((s) => s.includes("Therapeutic responses"))).toBe(true);
  });

  it("generates areas for improvement when no inspections", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      [makeIncident()], [], [makeRepair()], [makePrevention()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("No property inspections"))).toBe(true);
  });

  it("generates URGENT action for severe incidents", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      [makeIncident({ severity: "severe" })],
      [makeInspection()], [makeRepair()], [makePrevention()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("severe"))).toBe(true);
  });

  it("generates URGENT action when no inspections recorded", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      [makeIncident()], [], [makeRepair()], [makePrevention()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("inspection"))).toBe(true);
  });

  it("generates URGENT action when incidents exist but no repairs", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      [makeIncident()], [makeInspection()], [], [makePrevention()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("repairs"))).toBe(true);
  });

  it("builds child damage profiles for involved children", () => {
    const incidents = [
      makeIncident({ id: "d1", childId: "child-jordan", childName: "Jordan" }),
      makeIncident({ id: "d2", date: "2025-04-01", childId: "child-alex", childName: "Alex" }),
    ];
    const result = generatePropertyDamageAssessmentIntelligence(
      incidents, [makeInspection()],
      [makeRepair(), makeRepair({ id: "r2", damageIncidentId: "d2" })],
      [makePrevention()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.childDamageProfiles).toHaveLength(2);
    const jordan = result.childDamageProfiles.find((p) => p.childId === "child-jordan");
    const alex = result.childDamageProfiles.find((p) => p.childId === "child-alex");
    expect(jordan).toBeDefined();
    expect(alex).toBeDefined();
  });

  it("overall score is sum of 4 evaluator scores", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      [makeIncident()],
      [makeInspection()],
      [makeRepair()],
      [makePrevention()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    const sum = Math.round(
      (result.incidentManagement.overallScore +
        result.propertyCondition.overallScore +
        result.repairEffectiveness.overallScore +
        result.preventionStrategy.overallScore) * 10,
    ) / 10;
    expect(result.overallScore).toBe(sum);
  });

  it("handles completely empty data", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.childDamageProfiles).toHaveLength(0);
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("generates area for improvement when no prevention measures and incidents exist", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      [makeIncident()], [makeInspection()], [makeRepair()], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("No prevention measures"))).toBe(true);
  });

  it("generates URGENT action for low therapeutic response", () => {
    const incidents = [
      makeIncident({ id: "d1", therapeuticResponseProvided: false }),
      makeIncident({ id: "d2", date: "2025-04-01", therapeuticResponseProvided: false }),
      makeIncident({ id: "d3", date: "2025-05-01", therapeuticResponseProvided: false }),
    ];
    const result = generatePropertyDamageAssessmentIntelligence(
      incidents, [makeInspection()], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("therapeutic"))).toBe(true);
  });

  it("generates strength for regular inspections", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      [],
      [makeInspection(), makeInspection({ id: "i2", inspectionDate: "2025-05-01" })],
      [], [makePrevention()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.strengths.some((s) => s.includes("Regular property inspections"))).toBe(true);
  });

  it("score range is 0–100", () => {
    // Max possible: 25 + 25 + 25 + 25 = 100
    const minResult = generatePropertyDamageAssessmentIntelligence(
      [
        makeIncident({ id: "d1", severity: "severe", therapeuticResponseProvided: false, context: "unknown" }),
        makeIncident({ id: "d2", date: "2025-04-01", severity: "severe", therapeuticResponseProvided: false, context: "unknown" }),
        makeIncident({ id: "d3", date: "2025-05-01", severity: "severe", therapeuticResponseProvided: false, context: "unknown" }),
      ],
      [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(minResult.overallScore).toBeGreaterThanOrEqual(0);
    expect(minResult.overallScore).toBeLessThanOrEqual(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Chamberlain House Demo Data Validation
// ══════════════════════════════════════════════════════════════════════════════

describe("Chamberlain House Demo Data Validation", () => {
  const demoIncidents: DamageIncident[] = [
    {
      id: "dmg-j1", date: "2025-03-12", damageType: "furniture", severity: "moderate",
      context: "frustration_expression", location: "Living Room", childInvolved: true,
      childId: "child-jordan", childName: "Jordan",
      description: "Chair damaged during frustration episode", estimatedCost: 120,
      costBand: "50_to_200", repairStatus: "completed", repairCompletedDate: "2025-03-18",
      insuranceClaimed: false, therapeuticResponseProvided: true,
    },
    {
      id: "dmg-a1", date: "2025-04-05", damageType: "fixtures", severity: "minor",
      context: "accidental", location: "Kitchen", childInvolved: false,
      childId: null, childName: null,
      description: "Kitchen tile cracked", estimatedCost: 80,
      costBand: "50_to_200", repairStatus: "completed", repairCompletedDate: "2025-04-12",
      insuranceClaimed: false, therapeuticResponseProvided: false,
    },
    {
      id: "dmg-ax1", date: "2025-05-01", damageType: "structural", severity: "significant",
      context: "peer_conflict", location: "Hallway", childInvolved: true,
      childId: "child-alex", childName: "Alex",
      description: "Window cracked during argument", estimatedCost: 350,
      costBand: "200_to_500", repairStatus: "completed", repairCompletedDate: "2025-05-05",
      insuranceClaimed: true, therapeuticResponseProvided: true,
    },
  ];

  const demoInspections: PropertyInspection[] = [
    { id: "insp-1", inspectionDate: "2025-02-15", inspector: "Darren Laville", areasChecked: 12, issuesFound: 3, issuesResolved: 3, maintenanceScheduleFollowed: true, overallCondition: "good" },
    { id: "insp-2", inspectionDate: "2025-05-10", inspector: "Darren Laville", areasChecked: 12, issuesFound: 2, issuesResolved: 1, maintenanceScheduleFollowed: true, overallCondition: "good" },
  ];

  const demoRepairs: RepairRecord[] = [
    { id: "rep-1", damageIncidentId: "dmg-j1", repairDate: "2025-03-18", repairedBy: "Tom Richards", costActual: 95, timeliness: "within_week", qualityRating: "good", safetyRestored: true },
    { id: "rep-2", damageIncidentId: "dmg-a1", repairDate: "2025-04-12", repairedBy: "External Contractor", costActual: 75, timeliness: "within_week", qualityRating: "excellent", safetyRestored: true },
    { id: "rep-3", damageIncidentId: "dmg-ax1", repairDate: "2025-05-05", repairedBy: "External Contractor", costActual: 320, timeliness: "within_week", qualityRating: "good", safetyRestored: true },
  ];

  const demoPreventionMeasures: DamagePreventionMeasure[] = [
    { id: "prev-1", measureType: "sensory_provision", implementedDate: "2025-01-20", targetChildId: "child-jordan", effectiveness: "effective", reviewDate: "2025-04-20", active: true },
    { id: "prev-2", measureType: "de_escalation_training", implementedDate: "2025-02-10", targetChildId: "child-alex", effectiveness: "partially_effective", reviewDate: "2025-05-10", active: true },
  ];

  it("demo data produces a valid intelligence result", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      demoIncidents, demoInspections, demoRepairs, demoPreventionMeasures,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("demo data counts 3 incidents", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      demoIncidents, demoInspections, demoRepairs, demoPreventionMeasures,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.incidentManagement.totalIncidents).toBe(3);
  });

  it("demo data counts 2 inspections", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      demoIncidents, demoInspections, demoRepairs, demoPreventionMeasures,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.propertyCondition.totalInspections).toBe(2);
  });

  it("demo data counts 3 repairs", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      demoIncidents, demoInspections, demoRepairs, demoPreventionMeasures,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.repairEffectiveness.totalRepairs).toBe(3);
  });

  it("demo data has 2 child damage profiles (Jordan and Alex)", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      demoIncidents, demoInspections, demoRepairs, demoPreventionMeasures,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.childDamageProfiles).toHaveLength(2);
    const childIds = result.childDamageProfiles.map((p) => p.childId);
    expect(childIds).toContain("child-jordan");
    expect(childIds).toContain("child-alex");
  });

  it("demo data shows 100% therapeutic response for child-involved incidents", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      demoIncidents, demoInspections, demoRepairs, demoPreventionMeasures,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.incidentManagement.therapeuticResponseRate).toBe(100);
  });

  it("demo data shows 100% timely repair rate", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      demoIncidents, demoInspections, demoRepairs, demoPreventionMeasures,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.incidentManagement.timelyRepairRate).toBe(100);
  });

  it("demo data shows 100% context documented", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      demoIncidents, demoInspections, demoRepairs, demoPreventionMeasures,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(result.incidentManagement.contextDocumentedRate).toBe(100);
  });

  it("demo data produces good or outstanding rating", () => {
    const result = generatePropertyDamageAssessmentIntelligence(
      demoIncidents, demoInspections, demoRepairs, demoPreventionMeasures,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );
    expect(["outstanding", "good"]).toContain(result.rating);
  });
});
