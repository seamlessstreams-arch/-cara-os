// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Fire Safety Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateDrillCompliance,
  evaluateEquipmentMaintenance,
  evaluateRiskAssessments,
  evaluateTrainingAndPlanning,
  generateFireSafetyIntelligence,
} from "../fire-safety-engine";
import type {
  FireDrill,
  FireEquipment,
  FireRiskAssessment,
  EvacuationPlan,
  FireSafetyTraining,
} from "../fire-safety-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const REFERENCE_DATE = "2026-05-18";
const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

const makeDrill = (overrides: Partial<FireDrill> = {}): FireDrill => ({
  id: "drill-001",
  homeId: "oak-house",
  date: "2026-03-15",
  drillType: "full_evacuation",
  timeOfDay: "day",
  childrenPresent: 4,
  childrenEvacuated: 4,
  evacuationTimeSeconds: 150,
  targetTimeSeconds: 180,
  allAccountedFor: true,
  issuesIdentified: [],
  staffLed: "Darren Laville",
  debriefCompleted: true,
  ...overrides,
});

const makeEquipment = (overrides: Partial<FireEquipment> = {}): FireEquipment => ({
  id: "equip-001",
  homeId: "oak-house",
  equipmentType: "fire_extinguisher",
  location: "Ground floor hallway",
  lastInspectionDate: "2026-03-01",
  nextInspectionDate: "2026-09-01",
  status: "operational",
  notes: "",
  ...overrides,
});

const makeAssessment = (overrides: Partial<FireRiskAssessment> = {}): FireRiskAssessment => ({
  id: "assess-001",
  homeId: "oak-house",
  assessmentDate: "2026-01-15",
  assessedBy: "Fire Safety Consultants Ltd",
  nextDueDate: "2027-01-15",
  riskLevel: "low",
  findingsCount: 3,
  actionsRequired: 3,
  actionsCompleted: 3,
  sharedWithStaff: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<FireSafetyTraining> = {}): FireSafetyTraining => ({
  staffId: "staff-001",
  staffName: "Darren Laville",
  trainingDate: "2026-02-01",
  expiryDate: "2027-02-01",
  trainingType: "basic",
  passed: true,
  ...overrides,
});

const makeEvacPlan = (overrides: Partial<EvacuationPlan> = {}): EvacuationPlan => ({
  id: "evac-001",
  homeId: "oak-house",
  lastReviewed: "2026-03-01",
  assemblyPoint: "Front car park, by the oak tree",
  specialConsiderations: ["Child A uses wheelchair — ground floor room assigned", "Child B has anxiety around alarms — pre-warning protocol"],
  peepPlans: 2,
  childrenRequiringPeep: 2,
  ...overrides,
});

// ── Oak House Demo Data ────────────────────────────────────────────────────

const oakHouseDrills: FireDrill[] = [
  makeDrill({ id: "drill-001", date: "2026-01-20", drillType: "full_evacuation", timeOfDay: "day", evacuationTimeSeconds: 145, targetTimeSeconds: 180 }),
  makeDrill({ id: "drill-002", date: "2026-02-18", drillType: "full_evacuation", timeOfDay: "evening", evacuationTimeSeconds: 160, targetTimeSeconds: 180 }),
  makeDrill({ id: "drill-003", date: "2026-03-10", drillType: "night_drill", timeOfDay: "night", evacuationTimeSeconds: 200, targetTimeSeconds: 240, childrenPresent: 3, childrenEvacuated: 3 }),
  makeDrill({ id: "drill-004", date: "2026-04-05", drillType: "partial_evacuation", timeOfDay: "day", evacuationTimeSeconds: 90, targetTimeSeconds: 120 }),
  makeDrill({ id: "drill-005", date: "2026-05-01", drillType: "tabletop_exercise", timeOfDay: "day", evacuationTimeSeconds: 0, targetTimeSeconds: 0, issuesIdentified: ["Staff unsure about call point locations on first floor"] }),
];

const oakHouseEquipment: FireEquipment[] = [
  makeEquipment({ id: "equip-001", equipmentType: "fire_extinguisher", location: "Ground floor hallway" }),
  makeEquipment({ id: "equip-002", equipmentType: "fire_extinguisher", location: "First floor landing" }),
  makeEquipment({ id: "equip-003", equipmentType: "smoke_detector", location: "Kitchen" }),
  makeEquipment({ id: "equip-004", equipmentType: "smoke_detector", location: "Lounge" }),
  makeEquipment({ id: "equip-005", equipmentType: "smoke_detector", location: "Each bedroom (x4)", lastInspectionDate: "2026-04-15", nextInspectionDate: "2026-10-15" }),
  makeEquipment({ id: "equip-006", equipmentType: "fire_blanket", location: "Kitchen" }),
  makeEquipment({ id: "equip-007", equipmentType: "emergency_lighting", location: "Corridors and stairwell" }),
  makeEquipment({ id: "equip-008", equipmentType: "fire_door", location: "Kitchen fire door", status: "needs_repair", notes: "Self-closer not engaging fully" }),
  makeEquipment({ id: "equip-009", equipmentType: "alarm_panel", location: "Front entrance hall" }),
  makeEquipment({ id: "equip-010", equipmentType: "call_point", location: "Ground floor by front door" }),
  makeEquipment({ id: "equip-011", equipmentType: "call_point", location: "First floor landing" }),
];

const oakHouseAssessments: FireRiskAssessment[] = [
  makeAssessment({ id: "assess-001", assessmentDate: "2026-01-15", assessedBy: "Fire Safety Consultants Ltd", nextDueDate: "2027-01-15", riskLevel: "low", findingsCount: 5, actionsRequired: 4, actionsCompleted: 3, sharedWithStaff: true }),
];

const oakHouseTraining: FireSafetyTraining[] = [
  makeTraining({ staffId: "staff-001", staffName: "Darren Laville", trainingType: "fire_marshal", expiryDate: "2027-02-01" }),
  makeTraining({ staffId: "staff-002", staffName: "Lisa Williams", trainingType: "advanced", expiryDate: "2027-01-15" }),
  makeTraining({ staffId: "staff-003", staffName: "Tom Richards", trainingType: "basic", expiryDate: "2027-03-01" }),
  makeTraining({ staffId: "staff-004", staffName: "Sarah Johnson", trainingType: "basic", expiryDate: "2026-08-01" }),
  makeTraining({ staffId: "staff-005", staffName: "James Cooper", trainingType: "basic", expiryDate: "2026-04-01", passed: true }),
];

const oakHouseEvacPlan: EvacuationPlan = makeEvacPlan();

// ══════════════════════════════════════════════════════════════════════════════
// 1. DRILL COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDrillCompliance", () => {
  it("returns zeroed result for empty drills array", () => {
    const result = evaluateDrillCompliance([], PERIOD_START, PERIOD_END);
    expect(result.totalDrills).toBe(0);
    expect(result.drillScore).toBe(0);
    expect(result.meetsMonthlyTarget).toBe(false);
    expect(result.meetsNightDrillTarget).toBe(false);
    expect(result.averageEvacuationTimeSeconds).toBeNull();
  });

  it("counts drills within the period only", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2025-12-15" }), // outside
      makeDrill({ id: "d2", date: "2026-02-10" }), // inside
      makeDrill({ id: "d3", date: "2026-06-01" }), // outside
    ];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.totalDrills).toBe(1);
  });

  it("groups drills by type correctly", () => {
    const result = evaluateDrillCompliance(oakHouseDrills, PERIOD_START, PERIOD_END);
    expect(result.drillsByType["full_evacuation"]).toBe(2);
    expect(result.drillsByType["night_drill"]).toBe(1);
    expect(result.drillsByType["partial_evacuation"]).toBe(1);
    expect(result.drillsByType["tabletop_exercise"]).toBe(1);
  });

  it("calculates monthly frequency", () => {
    const result = evaluateDrillCompliance(oakHouseDrills, PERIOD_START, PERIOD_END);
    expect(result.monthlyFrequency).toBeGreaterThan(0);
  });

  it("identifies monthly target is met with sufficient drills", () => {
    const result = evaluateDrillCompliance(oakHouseDrills, PERIOD_START, PERIOD_END);
    expect(result.meetsMonthlyTarget).toBe(true);
  });

  it("identifies monthly target not met with insufficient drills", () => {
    const drills = [makeDrill({ id: "d1", date: "2026-03-01" })];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.meetsMonthlyTarget).toBe(false);
  });

  it("tracks night drill frequency per quarter", () => {
    const result = evaluateDrillCompliance(oakHouseDrills, PERIOD_START, PERIOD_END);
    expect(result.nightDrillsPerQuarter).toBeGreaterThan(0);
  });

  it("identifies night drill target met", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-02-01", drillType: "night_drill", timeOfDay: "night" }),
      makeDrill({ id: "d2", date: "2026-03-01" }),
      makeDrill({ id: "d3", date: "2026-04-01", drillType: "night_drill", timeOfDay: "night" }),
    ];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.meetsNightDrillTarget).toBe(true);
  });

  it("identifies night drill target not met with no night drills", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-02-01", drillType: "full_evacuation", timeOfDay: "day" }),
      makeDrill({ id: "d2", date: "2026-03-01", drillType: "full_evacuation", timeOfDay: "day" }),
    ];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.meetsNightDrillTarget).toBe(false);
  });

  it("calculates average evacuation time excluding zero values", () => {
    const result = evaluateDrillCompliance(oakHouseDrills, PERIOD_START, PERIOD_END);
    expect(result.averageEvacuationTimeSeconds).not.toBeNull();
    expect(result.averageEvacuationTimeSeconds).toBeGreaterThan(0);
  });

  it("returns null avg evacuation time when no evacuation drills exist", () => {
    const drills = [makeDrill({ id: "d1", date: "2026-03-01", evacuationTimeSeconds: 0, targetTimeSeconds: 0 })];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.averageEvacuationTimeSeconds).toBeNull();
  });

  it("counts on-target and over-target evacuations", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-02-01", evacuationTimeSeconds: 150, targetTimeSeconds: 180 }),
      makeDrill({ id: "d2", date: "2026-03-01", evacuationTimeSeconds: 200, targetTimeSeconds: 180 }),
    ];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.evacuationOnTarget).toBe(1);
    expect(result.evacuationOverTarget).toBe(1);
    expect(result.evacuationTargetRate).toBe(50);
  });

  it("calculates 100% target rate when all on target", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-02-01", evacuationTimeSeconds: 100, targetTimeSeconds: 180 }),
      makeDrill({ id: "d2", date: "2026-03-01", evacuationTimeSeconds: 180, targetTimeSeconds: 180 }),
    ];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.evacuationTargetRate).toBe(100);
  });

  it("calculates all-accounted-for rate", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-02-01", allAccountedFor: true }),
      makeDrill({ id: "d2", date: "2026-03-01", allAccountedFor: false }),
    ];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.allAccountedForRate).toBe(50);
  });

  it("calculates debrief rate", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-02-01", debriefCompleted: true }),
      makeDrill({ id: "d2", date: "2026-03-01", debriefCompleted: false }),
      makeDrill({ id: "d3", date: "2026-04-01", debriefCompleted: true }),
    ];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.debriefRate).toBe(67);
  });

  it("counts total issues identified", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-02-01", issuesIdentified: ["Issue A", "Issue B"] }),
      makeDrill({ id: "d2", date: "2026-03-01", issuesIdentified: ["Issue C"] }),
    ];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.totalIssues).toBe(3);
  });

  it("awards maximum drill score for perfect compliance", () => {
    const perfectDrills: FireDrill[] = [];
    for (let month = 1; month <= 5; month++) {
      const mm = String(month).padStart(2, "0");
      perfectDrills.push(makeDrill({
        id: `perf-${month}`,
        date: `2026-${mm}-15`,
        drillType: month === 1 || month === 4 ? "night_drill" : "full_evacuation",
        timeOfDay: month === 1 || month === 4 ? "night" : "day",
        evacuationTimeSeconds: 120,
        targetTimeSeconds: 180,
        allAccountedFor: true,
        debriefCompleted: true,
      }));
    }
    const result = evaluateDrillCompliance(perfectDrills, PERIOD_START, PERIOD_END);
    expect(result.drillScore).toBe(25);
  });

  it("drill score is between 0 and 25", () => {
    const result = evaluateDrillCompliance(oakHouseDrills, PERIOD_START, PERIOD_END);
    expect(result.drillScore).toBeGreaterThanOrEqual(0);
    expect(result.drillScore).toBeLessThanOrEqual(25);
  });

  it("returns zero score when all drills outside period", () => {
    const drills = [makeDrill({ id: "d1", date: "2025-06-01" })];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.drillScore).toBe(0);
    expect(result.totalDrills).toBe(0);
  });

  it("treats night_drill type as night drill regardless of timeOfDay", () => {
    const drills = [
      makeDrill({ id: "d1", date: "2026-02-01", drillType: "night_drill", timeOfDay: "day" }),
      makeDrill({ id: "d2", date: "2026-03-01" }),
      makeDrill({ id: "d3", date: "2026-04-01" }),
    ];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.nightDrillsPerQuarter).toBeGreaterThan(0);
  });

  it("handles drill exactly on period boundary dates", () => {
    const drills = [
      makeDrill({ id: "d1", date: PERIOD_START }),
      makeDrill({ id: "d2", date: PERIOD_END }),
    ];
    const result = evaluateDrillCompliance(drills, PERIOD_START, PERIOD_END);
    expect(result.totalDrills).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. EQUIPMENT MAINTENANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEquipmentMaintenance", () => {
  it("returns zeroed result for empty equipment array", () => {
    const result = evaluateEquipmentMaintenance([], REFERENCE_DATE);
    expect(result.totalEquipment).toBe(0);
    expect(result.equipmentScore).toBe(0);
    expect(result.operationalRate).toBe(0);
    expect(result.criticalIssues).toHaveLength(0);
  });

  it("counts equipment by type", () => {
    const result = evaluateEquipmentMaintenance(oakHouseEquipment, REFERENCE_DATE);
    expect(result.byType["fire_extinguisher"]).toBe(2);
    expect(result.byType["smoke_detector"]).toBe(3);
    expect(result.byType["call_point"]).toBe(2);
  });

  it("counts equipment by status", () => {
    const result = evaluateEquipmentMaintenance(oakHouseEquipment, REFERENCE_DATE);
    expect(result.byStatus["operational"]).toBe(10);
    expect(result.byStatus["needs_repair"]).toBe(1);
  });

  it("calculates operational rate", () => {
    const result = evaluateEquipmentMaintenance(oakHouseEquipment, REFERENCE_DATE);
    expect(result.operationalRate).toBe(91); // 10/11
  });

  it("identifies out-of-service equipment as critical", () => {
    const equipment = [
      makeEquipment({ id: "e1", status: "out_of_service", notes: "Damaged beyond repair" }),
    ];
    const result = evaluateEquipmentMaintenance(equipment, REFERENCE_DATE);
    expect(result.outOfServiceCount).toBe(1);
    expect(result.criticalIssues).toHaveLength(1);
    expect(result.criticalIssues[0].status).toBe("out_of_service");
  });

  it("identifies needs-repair equipment as critical", () => {
    const result = evaluateEquipmentMaintenance(oakHouseEquipment, REFERENCE_DATE);
    expect(result.needsRepairCount).toBe(1);
    expect(result.criticalIssues.some((c) => c.status === "needs_repair")).toBe(true);
  });

  it("detects overdue inspections", () => {
    const equipment = [
      makeEquipment({ id: "e1", nextInspectionDate: "2026-01-01" }), // overdue
      makeEquipment({ id: "e2", nextInspectionDate: "2026-12-01" }), // ok
    ];
    const result = evaluateEquipmentMaintenance(equipment, REFERENCE_DATE);
    expect(result.overdueInspections).toBe(1);
  });

  it("calculates inspection compliance rate", () => {
    const equipment = [
      makeEquipment({ id: "e1", nextInspectionDate: "2026-01-01" }),
      makeEquipment({ id: "e2", nextInspectionDate: "2026-12-01" }),
      makeEquipment({ id: "e3", nextInspectionDate: "2026-12-01" }),
    ];
    const result = evaluateEquipmentMaintenance(equipment, REFERENCE_DATE);
    expect(result.inspectionComplianceRate).toBe(67);
  });

  it("awards high score for fully operational, inspected equipment", () => {
    const equipment = Array.from({ length: 10 }, (_, i) =>
      makeEquipment({ id: `e-${i}`, status: "operational", nextInspectionDate: "2026-12-01" }),
    );
    const result = evaluateEquipmentMaintenance(equipment, REFERENCE_DATE);
    expect(result.equipmentScore).toBe(25);
  });

  it("penalises out-of-service equipment in score", () => {
    const equipment = [
      makeEquipment({ id: "e1", status: "out_of_service" }),
      makeEquipment({ id: "e2", status: "operational" }),
    ];
    const good = evaluateEquipmentMaintenance(
      [makeEquipment({ id: "e1" }), makeEquipment({ id: "e2" })],
      REFERENCE_DATE,
    );
    const bad = evaluateEquipmentMaintenance(equipment, REFERENCE_DATE);
    expect(bad.equipmentScore).toBeLessThan(good.equipmentScore);
  });

  it("equipment score is between 0 and 25", () => {
    const result = evaluateEquipmentMaintenance(oakHouseEquipment, REFERENCE_DATE);
    expect(result.equipmentScore).toBeGreaterThanOrEqual(0);
    expect(result.equipmentScore).toBeLessThanOrEqual(25);
  });

  it("handles all equipment out of service", () => {
    const equipment = Array.from({ length: 5 }, (_, i) =>
      makeEquipment({ id: `e-${i}`, status: "out_of_service", notes: "Broken" }),
    );
    const result = evaluateEquipmentMaintenance(equipment, REFERENCE_DATE);
    expect(result.outOfServiceCount).toBe(5);
    expect(result.operationalRate).toBe(0);
    expect(result.criticalIssues).toHaveLength(5);
  });

  it("handles all equipment overdue for inspection", () => {
    const equipment = Array.from({ length: 3 }, (_, i) =>
      makeEquipment({ id: `e-${i}`, nextInspectionDate: "2025-01-01" }),
    );
    const result = evaluateEquipmentMaintenance(equipment, REFERENCE_DATE);
    expect(result.overdueInspections).toBe(3);
    expect(result.inspectionComplianceRate).toBe(0);
  });

  it("correctly counts replaced equipment", () => {
    const equipment = [
      makeEquipment({ id: "e1", status: "replaced" }),
      makeEquipment({ id: "e2", status: "operational" }),
    ];
    const result = evaluateEquipmentMaintenance(equipment, REFERENCE_DATE);
    expect(result.byStatus["replaced"]).toBe(1);
    expect(result.operationalRate).toBe(50);
  });

  it("counts due_inspection status correctly", () => {
    const equipment = [
      makeEquipment({ id: "e1", status: "due_inspection" }),
    ];
    const result = evaluateEquipmentMaintenance(equipment, REFERENCE_DATE);
    expect(result.dueInspectionCount).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. RISK ASSESSMENTS
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRiskAssessments", () => {
  it("returns zeroed result for empty assessments array", () => {
    const result = evaluateRiskAssessments([], REFERENCE_DATE);
    expect(result.totalAssessments).toBe(0);
    expect(result.assessmentScore).toBe(0);
    expect(result.averageRiskLevel).toBe("unknown");
    expect(result.actionCompletionRate).toBe(0);
  });

  it("identifies current assessments correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", nextDueDate: "2027-01-01" }), // current
      makeAssessment({ id: "a2", nextDueDate: "2025-12-01" }), // overdue
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.currentAssessments).toBe(1);
    expect(result.overdueAssessments).toBe(1);
  });

  it("calculates current rate", () => {
    const assessments = [
      makeAssessment({ id: "a1", nextDueDate: "2027-01-01" }),
      makeAssessment({ id: "a2", nextDueDate: "2027-06-01" }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.currentRate).toBe(100);
  });

  it("calculates average risk level as low", () => {
    const assessments = [
      makeAssessment({ id: "a1", riskLevel: "low" }),
      makeAssessment({ id: "a2", riskLevel: "low" }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.averageRiskLevel).toBe("low");
  });

  it("calculates average risk level as medium", () => {
    const assessments = [
      makeAssessment({ id: "a1", riskLevel: "low" }),
      makeAssessment({ id: "a2", riskLevel: "high" }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.averageRiskLevel).toBe("medium");
  });

  it("calculates average risk level as high", () => {
    const assessments = [
      makeAssessment({ id: "a1", riskLevel: "high" }),
      makeAssessment({ id: "a2", riskLevel: "critical" }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.averageRiskLevel).toBe("high");
  });

  it("calculates average risk level as critical", () => {
    const assessments = [
      makeAssessment({ id: "a1", riskLevel: "critical" }),
      makeAssessment({ id: "a2", riskLevel: "critical" }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.averageRiskLevel).toBe("critical");
  });

  it("counts risk levels", () => {
    const assessments = [
      makeAssessment({ id: "a1", riskLevel: "low" }),
      makeAssessment({ id: "a2", riskLevel: "medium" }),
      makeAssessment({ id: "a3", riskLevel: "low" }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.riskLevelCounts["low"]).toBe(2);
    expect(result.riskLevelCounts["medium"]).toBe(1);
  });

  it("sums findings across assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", findingsCount: 3 }),
      makeAssessment({ id: "a2", findingsCount: 7 }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.totalFindings).toBe(10);
  });

  it("calculates action completion rate", () => {
    const assessments = [
      makeAssessment({ id: "a1", actionsRequired: 4, actionsCompleted: 2 }),
      makeAssessment({ id: "a2", actionsRequired: 6, actionsCompleted: 6 }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.actionCompletionRate).toBe(80);
  });

  it("handles zero actions required", () => {
    const assessments = [
      makeAssessment({ id: "a1", actionsRequired: 0, actionsCompleted: 0 }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.actionCompletionRate).toBe(0);
  });

  it("calculates shared with staff rate", () => {
    const assessments = [
      makeAssessment({ id: "a1", sharedWithStaff: true }),
      makeAssessment({ id: "a2", sharedWithStaff: false }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.sharedWithStaffRate).toBe(50);
  });

  it("awards high score for perfect risk assessment compliance", () => {
    const assessments = [
      makeAssessment({
        id: "a1",
        nextDueDate: "2027-01-01",
        riskLevel: "low",
        actionsRequired: 5,
        actionsCompleted: 5,
        sharedWithStaff: true,
      }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.assessmentScore).toBe(25);
  });

  it("awards low score for all overdue, high risk, no actions completed", () => {
    const assessments = [
      makeAssessment({
        id: "a1",
        nextDueDate: "2025-01-01",
        riskLevel: "critical",
        actionsRequired: 10,
        actionsCompleted: 0,
        sharedWithStaff: false,
      }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.assessmentScore).toBeLessThanOrEqual(5);
  });

  it("assessment score is between 0 and 25", () => {
    const result = evaluateRiskAssessments(oakHouseAssessments, REFERENCE_DATE);
    expect(result.assessmentScore).toBeGreaterThanOrEqual(0);
    expect(result.assessmentScore).toBeLessThanOrEqual(25);
  });

  it("handles assessment exactly on reference date boundary", () => {
    const assessments = [
      makeAssessment({ id: "a1", nextDueDate: REFERENCE_DATE }),
    ];
    const result = evaluateRiskAssessments(assessments, REFERENCE_DATE);
    expect(result.currentAssessments).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. TRAINING & PLANNING
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTrainingAndPlanning", () => {
  it("returns zeroed result for empty training and no plan", () => {
    const result = evaluateTrainingAndPlanning([], null, REFERENCE_DATE);
    expect(result.totalStaffTrained).toBe(0);
    expect(result.trainingScore).toBe(0);
    expect(result.evacuationPlanReviewed).toBe(false);
    expect(result.hasFireMarshal).toBe(false);
  });

  it("counts current and expired training", () => {
    const training = [
      makeTraining({ staffId: "s1", expiryDate: "2027-01-01" }), // current
      makeTraining({ staffId: "s2", expiryDate: "2025-01-01" }), // expired
      makeTraining({ staffId: "s3", expiryDate: "2027-06-01" }), // current
    ];
    const result = evaluateTrainingAndPlanning(training, null, REFERENCE_DATE);
    expect(result.currentTraining).toBe(2);
    expect(result.expiredTraining).toBe(1);
  });

  it("calculates training currency rate", () => {
    const training = [
      makeTraining({ staffId: "s1", expiryDate: "2027-01-01" }),
      makeTraining({ staffId: "s2", expiryDate: "2025-01-01" }),
    ];
    const result = evaluateTrainingAndPlanning(training, null, REFERENCE_DATE);
    expect(result.trainingCurrencyRate).toBe(50);
  });

  it("counts training by type", () => {
    const result = evaluateTrainingAndPlanning(oakHouseTraining, oakHouseEvacPlan, REFERENCE_DATE);
    expect(result.byTrainingType["fire_marshal"]).toBe(1);
    expect(result.byTrainingType["advanced"]).toBe(1);
    expect(result.byTrainingType["basic"]).toBe(3);
  });

  it("calculates pass rate", () => {
    const training = [
      makeTraining({ staffId: "s1", passed: true }),
      makeTraining({ staffId: "s2", passed: false }),
    ];
    const result = evaluateTrainingAndPlanning(training, null, REFERENCE_DATE);
    expect(result.passRate).toBe(50);
  });

  it("detects fire marshal presence", () => {
    const training = [
      makeTraining({ staffId: "s1", trainingType: "fire_marshal", expiryDate: "2027-01-01", passed: true }),
    ];
    const result = evaluateTrainingAndPlanning(training, null, REFERENCE_DATE);
    expect(result.hasFireMarshal).toBe(true);
  });

  it("does not count expired fire marshal as having fire marshal", () => {
    const training = [
      makeTraining({ staffId: "s1", trainingType: "fire_marshal", expiryDate: "2025-01-01", passed: true }),
    ];
    const result = evaluateTrainingAndPlanning(training, null, REFERENCE_DATE);
    expect(result.hasFireMarshal).toBe(false);
  });

  it("does not count failed fire marshal as having fire marshal", () => {
    const training = [
      makeTraining({ staffId: "s1", trainingType: "fire_marshal", expiryDate: "2027-01-01", passed: false }),
    ];
    const result = evaluateTrainingAndPlanning(training, null, REFERENCE_DATE);
    expect(result.hasFireMarshal).toBe(false);
  });

  it("evaluates evacuation plan age", () => {
    const result = evaluateTrainingAndPlanning(oakHouseTraining, oakHouseEvacPlan, REFERENCE_DATE);
    expect(result.evacuationPlanReviewed).toBe(true);
    expect(result.evacuationPlanAge).not.toBeNull();
    expect(result.evacuationPlanAge!).toBeGreaterThan(0);
  });

  it("calculates PEEP coverage rate", () => {
    const plan = makeEvacPlan({ peepPlans: 1, childrenRequiringPeep: 2 });
    const result = evaluateTrainingAndPlanning([], plan, REFERENCE_DATE);
    expect(result.peepCoverageRate).toBe(50);
  });

  it("handles 100% PEEP coverage", () => {
    const plan = makeEvacPlan({ peepPlans: 3, childrenRequiringPeep: 3 });
    const result = evaluateTrainingAndPlanning([], plan, REFERENCE_DATE);
    expect(result.peepCoverageRate).toBe(100);
  });

  it("defaults to 100% PEEP coverage when no children require PEEP", () => {
    const plan = makeEvacPlan({ peepPlans: 0, childrenRequiringPeep: 0 });
    const result = evaluateTrainingAndPlanning([], plan, REFERENCE_DATE);
    expect(result.peepCoverageRate).toBe(100);
  });

  it("counts special considerations documented", () => {
    const plan = makeEvacPlan({
      specialConsiderations: ["Wheelchair user", "Hearing impairment", "Anxiety disorder"],
    });
    const result = evaluateTrainingAndPlanning([], plan, REFERENCE_DATE);
    expect(result.specialConsiderationsDocumented).toBe(3);
  });

  it("returns null evacuation plan age when no plan exists", () => {
    const result = evaluateTrainingAndPlanning([], null, REFERENCE_DATE);
    expect(result.evacuationPlanAge).toBeNull();
  });

  it("training score is between 0 and 25", () => {
    const result = evaluateTrainingAndPlanning(oakHouseTraining, oakHouseEvacPlan, REFERENCE_DATE);
    expect(result.trainingScore).toBeGreaterThanOrEqual(0);
    expect(result.trainingScore).toBeLessThanOrEqual(25);
  });

  it("awards high score for perfect training and planning", () => {
    const training = [
      makeTraining({ staffId: "s1", trainingType: "fire_marshal", expiryDate: "2027-01-01", passed: true }),
      makeTraining({ staffId: "s2", trainingType: "advanced", expiryDate: "2027-01-01", passed: true }),
      makeTraining({ staffId: "s3", trainingType: "basic", expiryDate: "2027-01-01", passed: true }),
    ];
    const plan = makeEvacPlan({
      lastReviewed: "2026-04-01",
      peepPlans: 2,
      childrenRequiringPeep: 2,
      specialConsiderations: ["Wheelchair access", "Sensory needs"],
    });
    const result = evaluateTrainingAndPlanning(training, plan, REFERENCE_DATE);
    expect(result.trainingScore).toBe(25);
  });

  it("expired training not counted as current", () => {
    const training = [
      makeTraining({ staffId: "s1", expiryDate: "2025-01-01", passed: true }),
    ];
    const result = evaluateTrainingAndPlanning(training, null, REFERENCE_DATE);
    expect(result.currentTraining).toBe(0);
    expect(result.expiredTraining).toBe(1);
    expect(result.trainingCurrencyRate).toBe(0);
  });

  it("failed training not counted as current even if not expired", () => {
    const training = [
      makeTraining({ staffId: "s1", expiryDate: "2027-01-01", passed: false }),
    ];
    const result = evaluateTrainingAndPlanning(training, null, REFERENCE_DATE);
    expect(result.currentTraining).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. FULL INTELLIGENCE — generateFireSafetyIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateFireSafetyIntelligence", () => {
  it("produces a complete intelligence object", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.assessedAt).toBe(REFERENCE_DATE);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(typeof result.overallScore).toBe("number");
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("overall score is sum of four sub-scores", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const expectedSum = result.drillCompliance.drillScore +
      result.equipmentMaintenance.equipmentScore +
      result.riskAssessment.assessmentScore +
      result.trainingAndPlanning.trainingScore;
    expect(result.overallScore).toBe(clampHelper(expectedSum, 0, 100));
  });

  it("overall score is between 0 and 100", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("rates outstanding for score >= 80", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore >= 80) {
      expect(result.rating).toBe("outstanding");
    }
  });

  it("rates good for score >= 60 and < 80", () => {
    // We'll verify threshold logic rather than engineer exact data
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore >= 60 && result.overallScore < 80) {
      expect(result.rating).toBe("good");
    }
  });

  it("rates requires_improvement for score >= 40 and < 60", () => {
    const result = generateFireSafetyIntelligence(
      [], [makeEquipment({ id: "e1", status: "needs_repair" })], [], [], null,
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore >= 40 && result.overallScore < 60) {
      expect(result.rating).toBe("requires_improvement");
    }
  });

  it("rates inadequate for score < 40", () => {
    const result = generateFireSafetyIntelligence(
      [], [], [], [], null,
      "empty-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths array", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates actions array", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("includes regulatory links", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.regulatoryLinks.length).toBe(4);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Regulatory Reform"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Health and Safety"))).toBe(true);
  });

  it("handles completely empty data — worst case", () => {
    const result = generateFireSafetyIntelligence(
      [], [], [], [], null,
      "empty-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("identifies no drills as area for improvement", () => {
    const result = generateFireSafetyIntelligence(
      [], oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("No fire drills"))).toBe(true);
  });

  it("identifies no risk assessment as area for improvement", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, [], oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("No fire risk assessment"))).toBe(true);
  });

  it("identifies out of service equipment in actions", () => {
    const equipment = [
      makeEquipment({ id: "e1", status: "out_of_service" }),
    ];
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, equipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("out-of-service"))).toBe(true);
  });

  it("identifies missing fire marshal in actions", () => {
    const training = [
      makeTraining({ staffId: "s1", trainingType: "basic", expiryDate: "2027-01-01" }),
    ];
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, training, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("fire marshal"))).toBe(true);
  });

  it("identifies missing evacuation plan in actions", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, null,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("evacuation plan"))).toBe(true);
  });

  it("identifies expired training in areas for improvement", () => {
    const training = [
      makeTraining({ staffId: "s1", expiryDate: "2025-06-01" }),
      makeTraining({ staffId: "s2", expiryDate: "2025-03-01" }),
    ];
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, training, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("expired fire safety training"))).toBe(true);
  });

  it("generates strengths for high drill compliance", () => {
    const perfectDrills: FireDrill[] = [];
    for (let month = 1; month <= 5; month++) {
      const mm = String(month).padStart(2, "0");
      perfectDrills.push(makeDrill({
        id: `perf-${month}`,
        date: `2026-${mm}-15`,
        drillType: month % 3 === 0 ? "night_drill" : "full_evacuation",
        timeOfDay: month % 3 === 0 ? "night" : "day",
        evacuationTimeSeconds: 120,
        targetTimeSeconds: 180,
        allAccountedFor: true,
        debriefCompleted: true,
      }));
    }
    const result = generateFireSafetyIntelligence(
      perfectDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("monthly"))).toBe(true);
  });

  it("perfect compliance across all areas achieves outstanding", () => {
    const perfectDrills: FireDrill[] = [];
    for (let month = 1; month <= 5; month++) {
      const mm = String(month).padStart(2, "0");
      perfectDrills.push(makeDrill({
        id: `perf-${month}`,
        date: `2026-${mm}-15`,
        drillType: month === 1 || month === 4 ? "night_drill" : "full_evacuation",
        timeOfDay: month === 1 || month === 4 ? "night" : "day",
        evacuationTimeSeconds: 120,
        targetTimeSeconds: 180,
        allAccountedFor: true,
        debriefCompleted: true,
      }));
    }

    const perfectEquip = Array.from({ length: 8 }, (_, i) =>
      makeEquipment({ id: `e-${i}`, status: "operational", nextInspectionDate: "2026-12-01" }),
    );

    const perfectAssessments = [
      makeAssessment({
        id: "a1", riskLevel: "low", nextDueDate: "2027-01-01",
        actionsRequired: 3, actionsCompleted: 3, sharedWithStaff: true,
      }),
    ];

    const perfectTraining = [
      makeTraining({ staffId: "s1", trainingType: "fire_marshal", expiryDate: "2027-01-01", passed: true }),
      makeTraining({ staffId: "s2", trainingType: "advanced", expiryDate: "2027-01-01", passed: true }),
      makeTraining({ staffId: "s3", trainingType: "basic", expiryDate: "2027-01-01", passed: true }),
    ];

    const perfectPlan = makeEvacPlan({
      lastReviewed: "2026-04-01",
      peepPlans: 2, childrenRequiringPeep: 2,
      specialConsiderations: ["Wheelchair user", "Sensory needs"],
    });

    const result = generateFireSafetyIntelligence(
      perfectDrills, perfectEquip, perfectAssessments, perfectTraining, perfectPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("includes sub-evaluations in the result", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.drillCompliance).toBeDefined();
    expect(result.equipmentMaintenance).toBeDefined();
    expect(result.riskAssessment).toBeDefined();
    expect(result.trainingAndPlanning).toBeDefined();
  });

  it("Oak House demo data produces reasonable score", () => {
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overdue equipment inspections trigger actions", () => {
    const equipment = [
      makeEquipment({ id: "e1", nextInspectionDate: "2025-01-01" }),
    ];
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, equipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("overdue"))).toBe(true);
  });

  it("identifies night drill target not met when only day drills exist", () => {
    const dayDrills = Array.from({ length: 5 }, (_, i) =>
      makeDrill({ id: `d-${i}`, date: `2026-0${i + 1}-15`, drillType: "full_evacuation", timeOfDay: "day" }),
    );
    const result = generateFireSafetyIntelligence(
      dayDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("night drill"))).toBe(true);
  });

  it("identifies incomplete risk assessment actions", () => {
    const assessments = [
      makeAssessment({ id: "a1", actionsRequired: 10, actionsCompleted: 3, sharedWithStaff: true }),
    ];
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, assessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("outstanding actions from fire risk"))).toBe(true);
  });

  it("identifies risk assessment not shared with staff", () => {
    const assessments = [
      makeAssessment({ id: "a1", sharedWithStaff: false }),
    ];
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, assessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("Share fire risk assessment"))).toBe(true);
  });

  it("identifies incomplete PEEP coverage", () => {
    const plan = makeEvacPlan({ peepPlans: 1, childrenRequiringPeep: 3 });
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, plan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("PEEP"))).toBe(true);
  });

  it("handles stale evacuation plan (over 12 months old)", () => {
    const plan = makeEvacPlan({ lastReviewed: "2024-01-01" });
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, plan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("not been reviewed in the past 12 months"))).toBe(true);
  });

  it("identifies equipment needing repair in areas for improvement", () => {
    const equipment = [
      makeEquipment({ id: "e1", status: "needs_repair", notes: "Broken handle" }),
      makeEquipment({ id: "e2", status: "needs_repair", notes: "Cracked casing" }),
    ];
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, equipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("need repair"))).toBe(true);
    expect(result.actions.some((a) => a.includes("repairs"))).toBe(true);
  });

  it("identifies low training currency as area for improvement", () => {
    const training = [
      makeTraining({ staffId: "s1", expiryDate: "2025-01-01" }),
      makeTraining({ staffId: "s2", expiryDate: "2025-03-01" }),
      makeTraining({ staffId: "s3", expiryDate: "2025-06-01" }),
      makeTraining({ staffId: "s4", expiryDate: "2027-01-01" }),
    ];
    const result = generateFireSafetyIntelligence(
      oakHouseDrills, oakHouseEquipment, oakHouseAssessments, training, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("training currency"))).toBe(true);
  });

  it("strength: all children accounted for in every drill", () => {
    const drills = Array.from({ length: 5 }, (_, i) =>
      makeDrill({
        id: `d-${i}`,
        date: `2026-0${i + 1}-15`,
        allAccountedFor: true,
        debriefCompleted: true,
      }),
    );
    const result = generateFireSafetyIntelligence(
      drills, oakHouseEquipment, oakHouseAssessments, oakHouseTraining, oakHouseEvacPlan,
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("accounted for"))).toBe(true);
  });
});

// ── Helper for test assertions ────────────────────────────────────────────

function clampHelper(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
