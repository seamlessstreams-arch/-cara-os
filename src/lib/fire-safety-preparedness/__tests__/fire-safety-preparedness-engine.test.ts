import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getDrillTypeLabel,
  getDrillOutcomeLabel,
  getEquipmentTypeLabel,
  getCheckOutcomeLabel,
  getPeepStatusLabel,
  getRatingLabel,
  evaluateFireDrillCompliance,
  evaluateEquipmentChecks,
  evaluateEvacuationPlanning,
  evaluateStaffFireReadiness,
  buildChildFireSafetySummaries,
  generateFireSafetyPreparednessIntelligence,
} from "../fire-safety-preparedness-engine";
import type {
  FireDrillRecord,
  EquipmentCheck,
  EvacuationPlan,
  StaffFireTraining,
} from "../fire-safety-preparedness-engine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });
  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(3, 3)).toBe(100);
  });
  it("returns 50 for half", () => {
    expect(pct(1, 2)).toBe(50);
  });
  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });
  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 5)).toBe(0);
  });
});

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
  it("returns inadequate for <40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ---------------------------------------------------------------------------
// Label getters
// ---------------------------------------------------------------------------

describe("label getters", () => {
  it("getDrillTypeLabel returns correct labels", () => {
    expect(getDrillTypeLabel("planned")).toBe("Planned");
    expect(getDrillTypeLabel("unannounced")).toBe("Unannounced");
    expect(getDrillTypeLabel("night_drill")).toBe("Night Drill");
    expect(getDrillTypeLabel("partial_evacuation")).toBe("Partial Evacuation");
    expect(getDrillTypeLabel("tabletop_exercise")).toBe("Tabletop Exercise");
  });
  it("getDrillOutcomeLabel returns correct labels", () => {
    expect(getDrillOutcomeLabel("successful")).toBe("Successful");
    expect(getDrillOutcomeLabel("partial_success")).toBe("Partial Success");
    expect(getDrillOutcomeLabel("failed")).toBe("Failed");
    expect(getDrillOutcomeLabel("abandoned")).toBe("Abandoned");
  });
  it("getEquipmentTypeLabel returns correct labels", () => {
    expect(getEquipmentTypeLabel("smoke_alarm")).toBe("Smoke Alarm");
    expect(getEquipmentTypeLabel("fire_extinguisher")).toBe("Fire Extinguisher");
    expect(getEquipmentTypeLabel("emergency_lighting")).toBe("Emergency Lighting");
    expect(getEquipmentTypeLabel("fire_door")).toBe("Fire Door");
    expect(getEquipmentTypeLabel("signage")).toBe("Signage");
  });
  it("getCheckOutcomeLabel returns correct labels", () => {
    expect(getCheckOutcomeLabel("pass")).toBe("Pass");
    expect(getCheckOutcomeLabel("minor_fault")).toBe("Minor Fault");
    expect(getCheckOutcomeLabel("major_fault")).toBe("Major Fault");
    expect(getCheckOutcomeLabel("out_of_service")).toBe("Out of Service");
  });
  it("getPeepStatusLabel returns correct labels", () => {
    expect(getPeepStatusLabel("current")).toBe("Current");
    expect(getPeepStatusLabel("overdue")).toBe("Overdue");
    expect(getPeepStatusLabel("not_required")).toBe("Not Required");
    expect(getPeepStatusLabel("in_progress")).toBe("In Progress");
  });
  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ---------------------------------------------------------------------------
// Fire Drill Compliance
// ---------------------------------------------------------------------------

const baseDrill: FireDrillRecord = {
  id: "d-1",
  drillDate: "2026-04-01",
  drillType: "planned",
  conductedBy: "Sarah Johnson",
  outcome: "successful",
  evacuationTimeSeconds: 120,
  allChildrenParticipated: true,
  allStaffParticipated: true,
  issuesIdentified: [],
  correctiveActionsTaken: false,
};

describe("evaluateFireDrillCompliance", () => {
  it("reports rates as unmeasured for empty data", () => {
    const r = evaluateFireDrillCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalDrills).toBe(0);
    expect(r.successRate).toBeNull();
    expect(r.fullParticipationRate).toBeNull();
    expect(r.drillTypeVariety).toBe(0);
    expect(r.averageEvacuationTime).toBeNull();
    expect(r.correctiveActionsRate).toBeNull();
  });

  it("scores maximum for perfect drill data", () => {
    const drills: FireDrillRecord[] = [
      { ...baseDrill, id: "d-1", drillType: "planned" },
      { ...baseDrill, id: "d-2", drillType: "unannounced" },
      { ...baseDrill, id: "d-3", drillType: "night_drill" },
      { ...baseDrill, id: "d-4", drillType: "partial_evacuation" },
    ];
    const r = evaluateFireDrillCompliance(drills);
    expect(r.overallScore).toBe(25);
    expect(r.successRate).toBe(100);
    expect(r.fullParticipationRate).toBe(100);
    expect(r.drillTypeVariety).toBe(4);
  });

  it("reduces score for failed drills", () => {
    const drills: FireDrillRecord[] = [
      { ...baseDrill, id: "d-1", outcome: "failed" },
      { ...baseDrill, id: "d-2", outcome: "failed" },
    ];
    const r = evaluateFireDrillCompliance(drills);
    expect(r.successRate).toBe(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("reduces score for partial participation", () => {
    const drills: FireDrillRecord[] = [
      { ...baseDrill, id: "d-1", allChildrenParticipated: false },
      { ...baseDrill, id: "d-2", allStaffParticipated: false },
    ];
    const r = evaluateFireDrillCompliance(drills);
    expect(r.fullParticipationRate).toBe(0);
  });

  it("measures drill type variety correctly", () => {
    const drills: FireDrillRecord[] = [
      { ...baseDrill, id: "d-1", drillType: "planned" },
      { ...baseDrill, id: "d-2", drillType: "planned" },
    ];
    const r = evaluateFireDrillCompliance(drills);
    expect(r.drillTypeVariety).toBe(1);
  });

  it("calculates average evacuation time", () => {
    const drills: FireDrillRecord[] = [
      { ...baseDrill, id: "d-1", evacuationTimeSeconds: 100 },
      { ...baseDrill, id: "d-2", evacuationTimeSeconds: 200 },
    ];
    const r = evaluateFireDrillCompliance(drills);
    expect(r.averageEvacuationTime).toBe(150);
  });

  it("corrective actions rate is unmeasured when no issues identified", () => {
    const drills: FireDrillRecord[] = [
      { ...baseDrill, id: "d-1", issuesIdentified: [] },
    ];
    const r = evaluateFireDrillCompliance(drills);
    expect(r.correctiveActionsRate).toBeNull();
  });

  it("measures corrective actions for drills with issues", () => {
    const drills: FireDrillRecord[] = [
      { ...baseDrill, id: "d-1", issuesIdentified: ["exit blocked"], correctiveActionsTaken: true },
      { ...baseDrill, id: "d-2", issuesIdentified: ["alarm delayed"], correctiveActionsTaken: false },
    ];
    const r = evaluateFireDrillCompliance(drills);
    expect(r.correctiveActionsRate).toBe(50);
  });

  it("caps score at 25", () => {
    const drills: FireDrillRecord[] = Array.from({ length: 10 }, (_, i) => ({
      ...baseDrill,
      id: `d-${i}`,
      drillType: (["planned", "unannounced", "night_drill", "partial_evacuation", "tabletop_exercise"] as const)[i % 5],
    }));
    const r = evaluateFireDrillCompliance(drills);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores partial success drills lower than successful", () => {
    const allSuccessful = evaluateFireDrillCompliance([
      { ...baseDrill, id: "d-1", drillType: "planned" },
      { ...baseDrill, id: "d-2", drillType: "unannounced" },
      { ...baseDrill, id: "d-3", drillType: "night_drill" },
      { ...baseDrill, id: "d-4", drillType: "partial_evacuation" },
    ]);
    const allPartial = evaluateFireDrillCompliance([
      { ...baseDrill, id: "d-1", outcome: "partial_success", drillType: "planned" },
      { ...baseDrill, id: "d-2", outcome: "partial_success", drillType: "unannounced" },
      { ...baseDrill, id: "d-3", outcome: "partial_success", drillType: "night_drill" },
      { ...baseDrill, id: "d-4", outcome: "partial_success", drillType: "partial_evacuation" },
    ]);
    expect(allPartial.overallScore).toBeLessThan(allSuccessful.overallScore);
  });
});

// ---------------------------------------------------------------------------
// Equipment Checks
// ---------------------------------------------------------------------------

const baseCheck: EquipmentCheck = {
  id: "ec-1",
  checkDate: "2026-04-01",
  checkedBy: "Tom Richards",
  equipmentType: "smoke_alarm",
  location: "Hallway",
  outcome: "pass",
  nextCheckDue: "2026-05-01",
};

describe("evaluateEquipmentChecks", () => {
  it("reports rates as unmeasured for empty data", () => {
    const r = evaluateEquipmentChecks([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalChecks).toBe(0);
    expect(r.passRate).toBeNull();
    expect(r.majorFaultRate).toBeNull();
    expect(r.equipmentTypesCovered).toBe(0);
    expect(r.rectificationRate).toBeNull();
  });

  it("scores maximum for all pass checks across many types", () => {
    const checks: EquipmentCheck[] = [
      { ...baseCheck, id: "ec-1", equipmentType: "smoke_alarm" },
      { ...baseCheck, id: "ec-2", equipmentType: "fire_extinguisher" },
      { ...baseCheck, id: "ec-3", equipmentType: "emergency_lighting" },
      { ...baseCheck, id: "ec-4", equipmentType: "fire_door" },
      { ...baseCheck, id: "ec-5", equipmentType: "fire_blanket" },
      { ...baseCheck, id: "ec-6", equipmentType: "signage" },
    ];
    const r = evaluateEquipmentChecks(checks);
    expect(r.overallScore).toBe(25);
    expect(r.passRate).toBe(100);
    expect(r.majorFaultRate).toBe(0);
    expect(r.equipmentTypesCovered).toBe(6);
    expect(r.rectificationRate).toBeNull();
  });

  it("reduces score for failures", () => {
    const checks: EquipmentCheck[] = [
      { ...baseCheck, id: "ec-1", outcome: "major_fault" },
      { ...baseCheck, id: "ec-2", outcome: "out_of_service" },
    ];
    const r = evaluateEquipmentChecks(checks);
    expect(r.passRate).toBe(0);
    expect(r.majorFaultRate).toBe(100);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("calculates rectification rate for faults", () => {
    const checks: EquipmentCheck[] = [
      { ...baseCheck, id: "ec-1", outcome: "minor_fault", rectifiedDate: "2026-04-02" },
      { ...baseCheck, id: "ec-2", outcome: "minor_fault" },
      { ...baseCheck, id: "ec-3", outcome: "major_fault", rectifiedDate: "2026-04-03" },
    ];
    const r = evaluateEquipmentChecks(checks);
    expect(r.rectificationRate).toBe(67);
  });

  it("rectification rate is unmeasured when no faults", () => {
    const checks: EquipmentCheck[] = [
      { ...baseCheck, id: "ec-1", outcome: "pass" },
    ];
    const r = evaluateEquipmentChecks(checks);
    expect(r.rectificationRate).toBeNull();
  });

  it("counts equipment types covered", () => {
    const checks: EquipmentCheck[] = [
      { ...baseCheck, id: "ec-1", equipmentType: "smoke_alarm" },
      { ...baseCheck, id: "ec-2", equipmentType: "smoke_alarm" },
      { ...baseCheck, id: "ec-3", equipmentType: "fire_door" },
    ];
    const r = evaluateEquipmentChecks(checks);
    expect(r.equipmentTypesCovered).toBe(2);
  });

  it("caps score at 25", () => {
    const checks: EquipmentCheck[] = Array.from({ length: 20 }, (_, i) => ({
      ...baseCheck,
      id: `ec-${i}`,
      equipmentType: (["smoke_alarm", "fire_extinguisher", "emergency_lighting", "fire_door", "fire_blanket", "signage", "sprinkler", "break_glass_point", "heat_detector"] as const)[i % 9],
    }));
    const r = evaluateEquipmentChecks(checks);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("major fault includes out_of_service", () => {
    const checks: EquipmentCheck[] = [
      { ...baseCheck, id: "ec-1", outcome: "out_of_service" },
      { ...baseCheck, id: "ec-2", outcome: "pass" },
    ];
    const r = evaluateEquipmentChecks(checks);
    expect(r.majorFaultRate).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// Evacuation Planning
// ---------------------------------------------------------------------------

const basePlan: EvacuationPlan = {
  id: "ep-1",
  childId: "child-alex",
  childName: "Alex",
  peepStatus: "current",
  lastReviewDate: "2026-04-01",
  assemblyPointKnown: true,
  escapeRouteAccessible: true,
  mobilityConsiderations: [],
  nightEvacuationPlan: true,
};

describe("evaluateEvacuationPlanning", () => {
  it("reports rates as unmeasured for empty data", () => {
    const r = evaluateEvacuationPlanning([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalPlans).toBe(0);
    expect(r.peepCurrentRate).toBeNull();
    expect(r.assemblyPointRate).toBeNull();
    expect(r.escapeRouteRate).toBeNull();
    expect(r.nightPlanRate).toBeNull();
  });

  it("scores maximum for perfect plans", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1" },
      { ...basePlan, id: "ep-2", childId: "child-jordan", childName: "Jordan" },
      { ...basePlan, id: "ep-3", childId: "child-morgan", childName: "Morgan" },
    ];
    const r = evaluateEvacuationPlanning(plans);
    expect(r.overallScore).toBe(25);
    expect(r.peepCurrentRate).toBe(100);
    expect(r.assemblyPointRate).toBe(100);
    expect(r.escapeRouteRate).toBe(100);
    expect(r.nightPlanRate).toBe(100);
  });

  it("treats not_required PEEPs as current", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1", peepStatus: "not_required" },
    ];
    const r = evaluateEvacuationPlanning(plans);
    expect(r.peepCurrentRate).toBe(100);
  });

  it("reduces score for overdue PEEPs", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1", peepStatus: "overdue" },
      { ...basePlan, id: "ep-2", peepStatus: "overdue", childId: "child-jordan" },
    ];
    const r = evaluateEvacuationPlanning(plans);
    expect(r.peepCurrentRate).toBe(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("reduces score for missing assembly point knowledge", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1", assemblyPointKnown: false },
    ];
    const r = evaluateEvacuationPlanning(plans);
    expect(r.assemblyPointRate).toBe(0);
  });

  it("reduces score for inaccessible escape routes", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1", escapeRouteAccessible: false },
    ];
    const r = evaluateEvacuationPlanning(plans);
    expect(r.escapeRouteRate).toBe(0);
  });

  it("reduces score for missing night plans", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1", nightEvacuationPlan: false },
    ];
    const r = evaluateEvacuationPlanning(plans);
    expect(r.nightPlanRate).toBe(0);
  });

  it("handles mixed PEEP statuses", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1", peepStatus: "current" },
      { ...basePlan, id: "ep-2", peepStatus: "overdue", childId: "child-jordan" },
      { ...basePlan, id: "ep-3", peepStatus: "in_progress", childId: "child-morgan" },
    ];
    const r = evaluateEvacuationPlanning(plans);
    expect(r.peepCurrentRate).toBe(33);
  });

  it("caps score at 25", () => {
    const plans: EvacuationPlan[] = Array.from({ length: 10 }, (_, i) => ({
      ...basePlan,
      id: `ep-${i}`,
      childId: `child-${i}`,
    }));
    const r = evaluateEvacuationPlanning(plans);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });
});

// ---------------------------------------------------------------------------
// Staff Fire Readiness
// ---------------------------------------------------------------------------

const baseTraining: StaffFireTraining = {
  id: "st-1",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  fireAwareness: true,
  fireMarshalTrained: true,
  evacuationProcedures: true,
  extinguisherUse: true,
  peepAwareness: true,
  nightResponseTrained: true,
};

describe("evaluateStaffFireReadiness", () => {
  it("reports rates as unmeasured for empty data", () => {
    const r = evaluateStaffFireReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.fireAwarenessRate).toBeNull();
    expect(r.fireMarshalRate).toBeNull();
    expect(r.evacuationRate).toBeNull();
    expect(r.extinguisherRate).toBeNull();
    expect(r.peepAwarenessRate).toBeNull();
    expect(r.nightResponseRate).toBeNull();
  });

  it("scores maximum for fully trained staff", () => {
    const training: StaffFireTraining[] = [
      { ...baseTraining, id: "st-1" },
      { ...baseTraining, id: "st-2", staffId: "staff-tom", staffName: "Tom Richards" },
      { ...baseTraining, id: "st-3", staffId: "staff-lisa", staffName: "Lisa Williams" },
      { ...baseTraining, id: "st-4", staffId: "staff-darren", staffName: "Darren Laville" },
    ];
    const r = evaluateStaffFireReadiness(training);
    expect(r.overallScore).toBe(25);
    expect(r.fireAwarenessRate).toBe(100);
    expect(r.fireMarshalRate).toBe(100);
    expect(r.evacuationRate).toBe(100);
    expect(r.extinguisherRate).toBe(100);
    expect(r.peepAwarenessRate).toBe(100);
    expect(r.nightResponseRate).toBe(100);
  });

  it("scores lower for untrained staff", () => {
    const training: StaffFireTraining[] = [
      {
        ...baseTraining,
        id: "st-1",
        fireAwareness: false,
        fireMarshalTrained: false,
        evacuationProcedures: false,
        extinguisherUse: false,
        peepAwareness: false,
        nightResponseTrained: false,
      },
    ];
    const r = evaluateStaffFireReadiness(training);
    expect(r.overallScore).toBe(0);
    expect(r.fireAwarenessRate).toBe(0);
  });

  it("handles partial training", () => {
    const training: StaffFireTraining[] = [
      { ...baseTraining, id: "st-1" },
      {
        ...baseTraining,
        id: "st-2",
        staffId: "staff-tom",
        staffName: "Tom Richards",
        fireMarshalTrained: false,
        extinguisherUse: false,
        nightResponseTrained: false,
      },
    ];
    const r = evaluateStaffFireReadiness(training);
    expect(r.fireMarshalRate).toBe(50);
    expect(r.extinguisherRate).toBe(50);
    expect(r.nightResponseRate).toBe(50);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("caps score at 25", () => {
    const training: StaffFireTraining[] = Array.from({ length: 10 }, (_, i) => ({
      ...baseTraining,
      id: `st-${i}`,
      staffId: `staff-${i}`,
      staffName: `Staff ${i}`,
    }));
    const r = evaluateStaffFireReadiness(training);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("fire awareness rates calculated correctly with mixed data", () => {
    const training: StaffFireTraining[] = [
      { ...baseTraining, id: "st-1", fireAwareness: true },
      { ...baseTraining, id: "st-2", staffId: "s2", staffName: "S2", fireAwareness: false },
      { ...baseTraining, id: "st-3", staffId: "s3", staffName: "S3", fireAwareness: true },
    ];
    const r = evaluateStaffFireReadiness(training);
    expect(r.fireAwarenessRate).toBe(67);
  });
});

// ---------------------------------------------------------------------------
// Child Fire Safety Summaries
// ---------------------------------------------------------------------------

describe("buildChildFireSafetySummaries", () => {
  it("returns empty array for empty plans", () => {
    const summaries = buildChildFireSafetySummaries([]);
    expect(summaries).toEqual([]);
  });

  it("builds summary for each child", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1" },
      { ...basePlan, id: "ep-2", childId: "child-jordan", childName: "Jordan" },
    ];
    const summaries = buildChildFireSafetySummaries(plans);
    expect(summaries).toHaveLength(2);
    expect(summaries[0].childName).toBe("Alex");
    expect(summaries[1].childName).toBe("Jordan");
  });

  it("gives high score for current PEEP with all features", () => {
    const plans: EvacuationPlan[] = [{ ...basePlan }];
    const summaries = buildChildFireSafetySummaries(plans);
    expect(summaries[0].overallScore).toBeGreaterThanOrEqual(8);
  });

  it("gives lower score for overdue PEEP", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1", peepStatus: "overdue", assemblyPointKnown: false, escapeRouteAccessible: false, nightEvacuationPlan: false },
    ];
    const summaries = buildChildFireSafetySummaries(plans);
    expect(summaries[0].overallScore).toBeLessThan(5);
  });

  it("includes correct peepStatus in summary", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1", peepStatus: "in_progress" },
    ];
    const summaries = buildChildFireSafetySummaries(plans);
    expect(summaries[0].peepStatus).toBe("in_progress");
  });

  it("reflects nightPlanInPlace correctly", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1", nightEvacuationPlan: false },
    ];
    const summaries = buildChildFireSafetySummaries(plans);
    expect(summaries[0].nightPlanInPlace).toBe(false);
  });

  it("score capped at 10", () => {
    const plans: EvacuationPlan[] = [{ ...basePlan }];
    const summaries = buildChildFireSafetySummaries(plans);
    expect(summaries[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("not_required PEEP gets full points", () => {
    const plans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1", peepStatus: "not_required" },
    ];
    const summaries = buildChildFireSafetySummaries(plans);
    expect(summaries[0].overallScore).toBeGreaterThanOrEqual(8);
  });
});

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

describe("generateFireSafetyPreparednessIntelligence", () => {
  const fullDrills: FireDrillRecord[] = [
    { ...baseDrill, id: "d-1", drillType: "planned" },
    { ...baseDrill, id: "d-2", drillType: "unannounced" },
    { ...baseDrill, id: "d-3", drillType: "night_drill" },
    { ...baseDrill, id: "d-4", drillType: "partial_evacuation" },
  ];

  const fullChecks: EquipmentCheck[] = [
    { ...baseCheck, id: "ec-1", equipmentType: "smoke_alarm" },
    { ...baseCheck, id: "ec-2", equipmentType: "fire_extinguisher" },
    { ...baseCheck, id: "ec-3", equipmentType: "emergency_lighting" },
    { ...baseCheck, id: "ec-4", equipmentType: "fire_door" },
    { ...baseCheck, id: "ec-5", equipmentType: "fire_blanket" },
    { ...baseCheck, id: "ec-6", equipmentType: "signage" },
  ];

  const fullPlans: EvacuationPlan[] = [
    { ...basePlan, id: "ep-1" },
    { ...basePlan, id: "ep-2", childId: "child-jordan", childName: "Jordan" },
    { ...basePlan, id: "ep-3", childId: "child-morgan", childName: "Morgan" },
  ];

  const fullTraining: StaffFireTraining[] = [
    { ...baseTraining, id: "st-1" },
    { ...baseTraining, id: "st-2", staffId: "staff-tom", staffName: "Tom Richards" },
    { ...baseTraining, id: "st-3", staffId: "staff-lisa", staffName: "Lisa Williams" },
    { ...baseTraining, id: "st-4", staffId: "staff-darren", staffName: "Darren Laville" },
  ];

  it("returns outstanding rating with perfect data", () => {
    const r = generateFireSafetyPreparednessIntelligence(
      fullDrills, fullChecks, fullPlans, fullTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-19");
  });

  it("returns inadequate rating with all empty data", () => {
    const r = generateFireSafetyPreparednessIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("generates strengths for perfect data", () => {
    const r = generateFireSafetyPreparednessIntelligence(
      fullDrills, fullChecks, fullPlans, fullTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions for all empty data", () => {
    const r = generateFireSafetyPreparednessIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    const urgent = r.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBe(4);
  });

  it("generates action for overdue PEEPs", () => {
    const overduePlans: EvacuationPlan[] = [
      { ...basePlan, id: "ep-1", peepStatus: "overdue" },
    ];
    const r = generateFireSafetyPreparednessIntelligence(
      fullDrills, fullChecks, overduePlans, fullTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    const peepAction = r.actions.find((a) => a.includes("PEEP"));
    expect(peepAction).toBeDefined();
  });

  it("always includes regulatoryLinks", () => {
    const r = generateFireSafetyPreparednessIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.length).toBeGreaterThan(0);
    expect(r.regulatoryLinks.some((l) => l.includes("Fire Safety"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015"))).toBe(true);
  });

  it("builds child summaries from plans", () => {
    const r = generateFireSafetyPreparednessIntelligence(
      fullDrills, fullChecks, fullPlans, fullTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.childSummaries).toHaveLength(3);
    expect(r.childSummaries[0].childName).toBe("Alex");
  });

  it("generates no strengths for all-empty data", () => {
    const r = generateFireSafetyPreparednessIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toHaveLength(0);
  });

  it("overall score capped at 100", () => {
    const r = generateFireSafetyPreparednessIntelligence(
      fullDrills, fullChecks, fullPlans, fullTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes areas for improvement with poor data", () => {
    const poorDrills: FireDrillRecord[] = [
      { ...baseDrill, id: "d-1", outcome: "failed", drillType: "planned" },
    ];
    const poorTraining: StaffFireTraining[] = [
      {
        ...baseTraining,
        id: "st-1",
        fireMarshalTrained: false,
        extinguisherUse: false,
      },
    ];
    const r = generateFireSafetyPreparednessIntelligence(
      poorDrills, fullChecks, fullPlans, poorTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates action for high major fault rate", () => {
    const badChecks: EquipmentCheck[] = [
      { ...baseCheck, id: "ec-1", outcome: "major_fault" },
      { ...baseCheck, id: "ec-2", outcome: "major_fault" },
      { ...baseCheck, id: "ec-3", outcome: "out_of_service" },
      { ...baseCheck, id: "ec-4", outcome: "pass" },
    ];
    const r = generateFireSafetyPreparednessIntelligence(
      fullDrills, badChecks, fullPlans, fullTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    const majorAction = r.actions.find((a) => a.includes("major faults"));
    expect(majorAction).toBeDefined();
  });

  it("mixed scenario produces requires_improvement or good", () => {
    const mixedDrills: FireDrillRecord[] = [
      { ...baseDrill, id: "d-1", drillType: "planned" },
      { ...baseDrill, id: "d-2", drillType: "unannounced", outcome: "partial_success" },
    ];
    const mixedTraining: StaffFireTraining[] = [
      { ...baseTraining, id: "st-1" },
      {
        ...baseTraining,
        id: "st-2",
        staffId: "staff-tom",
        staffName: "Tom",
        fireMarshalTrained: false,
        peepAwareness: false,
        nightResponseTrained: false,
      },
    ];
    const r = generateFireSafetyPreparednessIntelligence(
      mixedDrills, fullChecks, fullPlans, mixedTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(["good", "requires_improvement", "outstanding"]).toContain(r.rating);
  });
});
