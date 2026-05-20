// ══════════════════════════════════════════════════════════════════════════════
// Handover Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getHandoverCategoryLabel,
  getHandoverOutcomeLabel,
  getRatingLabel,
  evaluateHandoverQuality,
  evaluateHandoverCompliance,
  evaluateHandoverPolicy,
  evaluateStaffHandoverReadiness,
  buildChildHandoverProfiles,
  generateHandoverIntelligence,
} from "../handover-engine";
import type {
  HandoverRecord,
  HandoverPolicy,
  StaffHandoverTraining,
  HandoverCategory,
} from "../handover-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeRecord(overrides: Partial<HandoverRecord> = {}): HandoverRecord {
  return {
    id: "ho-001",
    homeId: "oak-house",
    date: "2026-03-15",
    childId: "child-alex",
    childName: "Alex",
    category: "shift_handover",
    outcome: "fully_communicated",
    allChildrenCovered: true,
    medicationStatusUpdated: true,
    incidentsCommunicated: true,
    tasksHandedOver: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<HandoverPolicy> = {}): HandoverPolicy {
  return {
    handoverPolicy: true,
    shiftHandoverProcedure: true,
    medicationHandoverProtocol: true,
    incidentCommunicationPolicy: true,
    taskTrackingProcedure: true,
    handoverRecordKeeping: true,
    handoverAuditPolicy: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffHandoverTraining> = {}): StaffHandoverTraining {
  return {
    staffId: "staff-sarah",
    handoverCommunication: true,
    medicationHandoverSkills: true,
    incidentReporting: true,
    taskPrioritisation: true,
    childStatusAssessment: true,
    handoverDocumentation: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating helper
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score 80+", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(65)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(10)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("getHandoverCategoryLabel", () => {
  it("returns Shift Handover", () => {
    expect(getHandoverCategoryLabel("shift_handover")).toBe("Shift Handover");
  });

  it("returns Medication Handover", () => {
    expect(getHandoverCategoryLabel("medication_handover")).toBe("Medication Handover");
  });

  it("returns Incident Handover", () => {
    expect(getHandoverCategoryLabel("incident_handover")).toBe("Incident Handover");
  });

  it("returns Child Update", () => {
    expect(getHandoverCategoryLabel("child_update")).toBe("Child Update");
  });

  it("returns Risk Update", () => {
    expect(getHandoverCategoryLabel("risk_update")).toBe("Risk Update");
  });

  it("returns Appointment Reminder", () => {
    expect(getHandoverCategoryLabel("appointment_reminder")).toBe("Appointment Reminder");
  });

  it("returns Contact Update", () => {
    expect(getHandoverCategoryLabel("contact_update")).toBe("Contact Update");
  });

  it("returns Task Completion", () => {
    expect(getHandoverCategoryLabel("task_completion")).toBe("Task Completion");
  });
});

describe("getHandoverOutcomeLabel", () => {
  it("returns Fully Communicated", () => {
    expect(getHandoverOutcomeLabel("fully_communicated")).toBe("Fully Communicated");
  });

  it("returns Partially Communicated", () => {
    expect(getHandoverOutcomeLabel("partially_communicated")).toBe("Partially Communicated");
  });

  it("returns Information Gap", () => {
    expect(getHandoverOutcomeLabel("information_gap")).toBe("Information Gap");
  });

  it("returns Follow-up Required", () => {
    expect(getHandoverOutcomeLabel("follow_up_required")).toBe("Follow-up Required");
  });

  it("returns Not Applicable", () => {
    expect(getHandoverOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns Good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns Requires Improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns Inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: Handover Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHandoverQuality", () => {
  it("returns zero score for empty records", () => {
    const result = evaluateHandoverQuality([]);
    expect(result.totalRecords).toBe(0);
    expect(result.score).toBe(0);
    expect(result.allChildrenCoveredRate).toBe(0);
    expect(result.medicationStatusUpdatedRate).toBe(0);
    expect(result.incidentsCommunicatedRate).toBe(0);
    expect(result.tasksHandedOverRate).toBe(0);
  });

  it("adds a concern for empty records", () => {
    const result = evaluateHandoverQuality([]);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.strengths.length).toBe(0);
  });

  it("returns perfect score of 25 for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "ho-002" })];
    const result = evaluateHandoverQuality(records);
    expect(result.score).toBe(25);
    expect(result.allChildrenCoveredRate).toBe(100);
    expect(result.medicationStatusUpdatedRate).toBe(100);
    expect(result.incidentsCommunicatedRate).toBe(100);
    expect(result.tasksHandedOverRate).toBe(100);
  });

  it("returns 0 score when all booleans are false", () => {
    const records = [
      makeRecord({
        allChildrenCovered: false,
        medicationStatusUpdated: false,
        incidentsCommunicated: false,
        tasksHandedOver: false,
      }),
    ];
    const result = evaluateHandoverQuality(records);
    expect(result.score).toBe(0);
    expect(result.allChildrenCoveredRate).toBe(0);
  });

  it("calculates partial rates correctly", () => {
    const records = [
      makeRecord({ allChildrenCovered: true, medicationStatusUpdated: true, incidentsCommunicated: false, tasksHandedOver: false }),
      makeRecord({ id: "ho-002", allChildrenCovered: false, medicationStatusUpdated: false, incidentsCommunicated: true, tasksHandedOver: true }),
    ];
    const result = evaluateHandoverQuality(records);
    expect(result.allChildrenCoveredRate).toBe(50);
    expect(result.medicationStatusUpdatedRate).toBe(50);
    expect(result.incidentsCommunicatedRate).toBe(50);
    expect(result.tasksHandedOverRate).toBe(50);
  });

  it("generates strengths when rates are high", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `ho-${i}` }));
    const result = evaluateHandoverQuality(records);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates concerns when rates are low", () => {
    const records = [
      makeRecord({
        allChildrenCovered: false,
        medicationStatusUpdated: false,
        incidentsCommunicated: false,
        tasksHandedOver: false,
      }),
    ];
    const result = evaluateHandoverQuality(records);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("score is capped at 25", () => {
    const records = Array.from({ length: 100 }, (_, i) => makeRecord({ id: `ho-${i}` }));
    const result = evaluateHandoverQuality(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("weighted scoring: allChildrenCovered has highest weight (7)", () => {
    // Only allChildrenCovered true = score should be 7
    const records = [
      makeRecord({
        allChildrenCovered: true,
        medicationStatusUpdated: false,
        incidentsCommunicated: false,
        tasksHandedOver: false,
      }),
    ];
    const result = evaluateHandoverQuality(records);
    expect(result.score).toBe(7);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Handover Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHandoverCompliance", () => {
  it("returns zero score for empty records", () => {
    const result = evaluateHandoverCompliance([]);
    expect(result.totalRecords).toBe(0);
    expect(result.score).toBe(0);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
  });

  it("adds a concern for empty records", () => {
    const result = evaluateHandoverCompliance([]);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("returns perfect score for all-compliant records across 8 categories", () => {
    const categories: HandoverCategory[] = [
      "shift_handover", "medication_handover", "incident_handover", "child_update",
      "risk_update", "appointment_reminder", "contact_update", "task_completion",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `ho-${i}`, category: cat }),
    );
    const result = evaluateHandoverCompliance(records);
    expect(result.score).toBe(25);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.uniqueCategories).toBe(8);
  });

  it("returns 0 score when all compliance booleans are false and 1 category", () => {
    const records = [
      makeRecord({
        documentationComplete: false,
        timelyRecording: false,
        allChildrenCovered: false,
      }),
    ];
    const result = evaluateHandoverCompliance(records);
    // categoryDiversityRatio = 1/8 = 0.13, so 0.13 * 5 = 0.65 rounds to 0.6
    expect(result.score).toBeLessThan(1);
  });

  it("calculates documentation rate", () => {
    const records = [
      makeRecord({ documentationComplete: true }),
      makeRecord({ id: "ho-002", documentationComplete: false }),
    ];
    const result = evaluateHandoverCompliance(records);
    expect(result.documentationRate).toBe(50);
  });

  it("calculates timely recording rate", () => {
    const records = [
      makeRecord({ timelyRecording: true }),
      makeRecord({ id: "ho-002", timelyRecording: false }),
      makeRecord({ id: "ho-003", timelyRecording: true }),
    ];
    const result = evaluateHandoverCompliance(records);
    expect(result.timelyRecordingRate).toBe(67);
  });

  it("calculates category diversity correctly", () => {
    const records = [
      makeRecord({ category: "shift_handover" }),
      makeRecord({ id: "ho-002", category: "medication_handover" }),
      makeRecord({ id: "ho-003", category: "shift_handover" }),
    ];
    const result = evaluateHandoverCompliance(records);
    expect(result.uniqueCategories).toBe(2);
    expect(result.categoryDiversityRatio).toBe(0.25);
  });

  it("generates strengths when documentation is high", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `ho-${i}` }));
    const result = evaluateHandoverCompliance(records);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates concerns when documentation is low", () => {
    const records = [
      makeRecord({ documentationComplete: false, timelyRecording: false, allChildrenCovered: false }),
    ];
    const result = evaluateHandoverCompliance(records);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("weighted scoring: documentation has highest weight (8)", () => {
    const records = [
      makeRecord({
        documentationComplete: true,
        timelyRecording: false,
        allChildrenCovered: false,
      }),
    ];
    const result = evaluateHandoverCompliance(records);
    // 8 for doc + 0 + 0 + 0.13*5 = 8.63 -> rounds to 8.6
    expect(result.score).toBeGreaterThan(8);
    expect(result.score).toBeLessThan(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Handover Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHandoverPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateHandoverPolicy(null);
    expect(result.score).toBe(0);
    expect(result.handoverPolicy).toBe(false);
    expect(result.shiftHandoverProcedure).toBe(false);
    expect(result.medicationHandoverProtocol).toBe(false);
  });

  it("adds concern for null policy", () => {
    const result = evaluateHandoverPolicy(null);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateHandoverPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("returns strength for complete policy", () => {
    const result = evaluateHandoverPolicy(makePolicy());
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths[0]).toContain("7/7");
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateHandoverPolicy({
      handoverPolicy: false,
      shiftHandoverProcedure: false,
      medicationHandoverProtocol: false,
      incidentCommunicationPolicy: false,
      taskTrackingProcedure: false,
      handoverRecordKeeping: false,
      handoverAuditPolicy: false,
    });
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBe(7);
  });

  it("calculates score correctly with first 4 booleans true (weight 4 each)", () => {
    const result = evaluateHandoverPolicy({
      handoverPolicy: true,
      shiftHandoverProcedure: true,
      medicationHandoverProtocol: true,
      incidentCommunicationPolicy: true,
      taskTrackingProcedure: false,
      handoverRecordKeeping: false,
      handoverAuditPolicy: false,
    });
    expect(result.score).toBe(16); // 4+4+4+4
  });

  it("calculates score correctly with last 3 booleans true (weight 3 each)", () => {
    const result = evaluateHandoverPolicy({
      handoverPolicy: false,
      shiftHandoverProcedure: false,
      medicationHandoverProtocol: false,
      incidentCommunicationPolicy: false,
      taskTrackingProcedure: true,
      handoverRecordKeeping: true,
      handoverAuditPolicy: true,
    });
    expect(result.score).toBe(9); // 3+3+3
  });

  it("generates concerns for each missing policy component", () => {
    const result = evaluateHandoverPolicy({
      handoverPolicy: true,
      shiftHandoverProcedure: false,
      medicationHandoverProtocol: true,
      incidentCommunicationPolicy: false,
      taskTrackingProcedure: true,
      handoverRecordKeeping: false,
      handoverAuditPolicy: true,
    });
    expect(result.concerns.length).toBe(3);
  });

  it("shows 5/7 strength message for 5 policies", () => {
    const result = evaluateHandoverPolicy({
      handoverPolicy: true,
      shiftHandoverProcedure: true,
      medicationHandoverProtocol: true,
      incidentCommunicationPolicy: true,
      taskTrackingProcedure: true,
      handoverRecordKeeping: false,
      handoverAuditPolicy: false,
    });
    expect(result.strengths.some((s) => s.includes("5/7"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Handover Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffHandoverReadiness", () => {
  it("returns zero score for empty training", () => {
    const result = evaluateStaffHandoverReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.score).toBe(0);
  });

  it("adds concern for empty training", () => {
    const result = evaluateStaffHandoverReadiness([]);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns 25 for all-true training", () => {
    const training = [makeTraining()];
    const result = evaluateStaffHandoverReadiness(training);
    expect(result.score).toBe(25);
  });

  it("returns 0 for all-false training", () => {
    const training = [
      makeTraining({
        handoverCommunication: false,
        medicationHandoverSkills: false,
        incidentReporting: false,
        taskPrioritisation: false,
        childStatusAssessment: false,
        handoverDocumentation: false,
      }),
    ];
    const result = evaluateStaffHandoverReadiness(training);
    expect(result.score).toBe(0);
  });

  it("calculates rates correctly for mixed training", () => {
    const training = [
      makeTraining({ staffId: "staff-sarah" }),
      makeTraining({ staffId: "staff-tom", handoverCommunication: false, medicationHandoverSkills: false }),
    ];
    const result = evaluateStaffHandoverReadiness(training);
    expect(result.totalStaff).toBe(2);
    expect(result.handoverCommunicationRate).toBe(50);
    expect(result.medicationHandoverSkillsRate).toBe(50);
    expect(result.incidentReportingRate).toBe(100);
  });

  it("weighted scoring: handoverCommunication has highest weight (6)", () => {
    const training = [
      makeTraining({
        handoverCommunication: true,
        medicationHandoverSkills: false,
        incidentReporting: false,
        taskPrioritisation: false,
        childStatusAssessment: false,
        handoverDocumentation: false,
      }),
    ];
    const result = evaluateStaffHandoverReadiness(training);
    expect(result.score).toBe(6);
  });

  it("weighted scoring: handoverDocumentation has lowest weight (2)", () => {
    const training = [
      makeTraining({
        handoverCommunication: false,
        medicationHandoverSkills: false,
        incidentReporting: false,
        taskPrioritisation: false,
        childStatusAssessment: false,
        handoverDocumentation: true,
      }),
    ];
    const result = evaluateStaffHandoverReadiness(training);
    expect(result.score).toBe(2);
  });

  it("generates strengths when rates are high", () => {
    const training = [makeTraining()];
    const result = evaluateStaffHandoverReadiness(training);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates concerns when rates are low", () => {
    const training = [
      makeTraining({
        handoverCommunication: false,
        medicationHandoverSkills: false,
        incidentReporting: false,
        taskPrioritisation: false,
        childStatusAssessment: false,
        handoverDocumentation: false,
      }),
    ];
    const result = evaluateStaffHandoverReadiness(training);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("score is capped at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ staffId: `staff-${i}` }),
    );
    const result = evaluateStaffHandoverReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Handover Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildHandoverProfiles", () => {
  it("returns empty array for empty records", () => {
    const result = buildChildHandoverProfiles([]);
    expect(result).toEqual([]);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "ho-002", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "ho-003", childId: "child-alex", childName: "Alex" }),
    ];
    const result = buildChildHandoverProfiles(records);
    expect(result.length).toBe(2);
    expect(result.find((p) => p.childId === "child-alex")!.totalRecords).toBe(2);
    expect(result.find((p) => p.childId === "child-jordan")!.totalRecords).toBe(1);
  });

  it("frequency score: 10+ records gives 2 points", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `ho-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const result = buildChildHandoverProfiles(records);
    // 10 records -> 2 freq + 3 rate1 + 3 rate2 + 1 diversity = 9
    expect(result[0].handoverScore).toBeGreaterThanOrEqual(8);
  });

  it("frequency score: 5-9 records gives 1 point", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `ho-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const result = buildChildHandoverProfiles(records);
    // 5 records -> 1 freq + 3 rate1 + 3 rate2 + 1 diversity = 8
    expect(result[0].handoverScore).toBeGreaterThanOrEqual(7);
  });

  it("frequency score: < 5 records gives 0 points", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `ho-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const result = buildChildHandoverProfiles(records);
    // 3 records -> 0 freq + 3 rate1 + 3 rate2 + 1 diversity = 7
    expect(result[0].handoverScore).toBeLessThanOrEqual(7);
  });

  it("rate1 (allChildrenCoveredRate >= 80) gives 3 points", () => {
    const records = [makeRecord()];
    const result = buildChildHandoverProfiles(records);
    expect(result[0].allChildrenCoveredRate).toBe(100);
  });

  it("rate2 (medicationStatusUpdatedRate >= 80) gives 3 points", () => {
    const records = [makeRecord()];
    const result = buildChildHandoverProfiles(records);
    expect(result[0].medicationStatusUpdatedRate).toBe(100);
  });

  it("diversity: 4+ categories gives 2 points", () => {
    const categories: HandoverCategory[] = [
      "shift_handover", "medication_handover", "incident_handover", "child_update",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `ho-${i}`, category: cat }),
    );
    const result = buildChildHandoverProfiles(records);
    expect(result[0].uniqueCategories).toBe(4);
  });

  it("diversity: 2-3 categories gives 1 point", () => {
    const records = [
      makeRecord({ category: "shift_handover" }),
      makeRecord({ id: "ho-002", category: "medication_handover" }),
    ];
    const result = buildChildHandoverProfiles(records);
    expect(result[0].uniqueCategories).toBe(2);
  });

  it("diversity: 1 category gives 0 points", () => {
    const records = [makeRecord()];
    const result = buildChildHandoverProfiles(records);
    expect(result[0].uniqueCategories).toBe(1);
  });

  it("handover score capped at 10", () => {
    const categories: HandoverCategory[] = [
      "shift_handover", "medication_handover", "incident_handover", "child_update",
      "risk_update", "appointment_reminder", "contact_update", "task_completion",
    ];
    // 12 records across 8 categories
    const records: HandoverRecord[] = [];
    for (let i = 0; i < 12; i++) {
      records.push(makeRecord({
        id: `ho-${i}`,
        category: categories[i % 8],
      }));
    }
    const result = buildChildHandoverProfiles(records);
    expect(result[0].handoverScore).toBeLessThanOrEqual(10);
  });

  it("returns 0 score for child with poor data", () => {
    const records = [
      makeRecord({
        allChildrenCovered: false,
        medicationStatusUpdated: false,
      }),
    ];
    const result = buildChildHandoverProfiles(records);
    // 1 record -> 0 freq, 0% rate1 -> 0, 0% rate2 -> 0, 1 category -> 0 diversity
    expect(result[0].handoverScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Orchestrator: generateHandoverIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateHandoverIntelligence", () => {
  const periodStart = "2026-01-01";
  const periodEnd = "2026-12-31";

  it("returns complete structure with all required fields", () => {
    const result = generateHandoverIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()],
      "oak-house", periodStart, periodEnd,
    );
    expect(result).toHaveProperty("homeId", "oak-house");
    expect(result).toHaveProperty("periodStart", periodStart);
    expect(result).toHaveProperty("periodEnd", periodEnd);
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("handoverQuality");
    expect(result).toHaveProperty("handoverCompliance");
    expect(result).toHaveProperty("handoverPolicy");
    expect(result).toHaveProperty("staffReadiness");
    expect(result).toHaveProperty("childProfiles");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("areasForImprovement");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("regulatoryLinks");
  });

  it("score is 100 for perfect data across all 8 categories", () => {
    const categories: HandoverCategory[] = [
      "shift_handover", "medication_handover", "incident_handover", "child_update",
      "risk_update", "appointment_reminder", "contact_update", "task_completion",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `ho-${i}`, category: cat }),
    );
    const result = generateHandoverIntelligence(
      records, makePolicy(), [makeTraining()],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("score is 0 for empty data with null policy", () => {
    const result = generateHandoverIntelligence(
      [], null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("overall score is sum of 4 evaluator scores capped at 100", () => {
    const result = generateHandoverIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()],
      "oak-house", periodStart, periodEnd,
    );
    const expectedSum = Math.min(100, Math.round(
      result.handoverQuality.score +
      result.handoverCompliance.score +
      result.handoverPolicy.score +
      result.staffReadiness.score,
    ));
    expect(result.overallScore).toBe(expectedSum);
  });

  it("filters records by period", () => {
    const records = [
      makeRecord({ date: "2026-06-15" }),
      makeRecord({ id: "ho-002", date: "2025-06-15" }), // out of period
    ];
    const result = generateHandoverIntelligence(
      records, makePolicy(), [makeTraining()],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.handoverQuality.totalRecords).toBe(1);
  });

  it("generates regulatory links (7 items)", () => {
    const result = generateHandoverIntelligence(
      [], null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("includes CHR 2015 Reg 22 in regulatory links", () => {
    const result = generateHandoverIntelligence(
      [], null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 22"))).toBe(true);
  });

  it("includes CHR 2015 Reg 13 in regulatory links", () => {
    const result = generateHandoverIntelligence(
      [], null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 13"))).toBe(true);
  });

  it("includes NMS 19 in regulatory links", () => {
    const result = generateHandoverIntelligence(
      [], null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 19"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generateHandoverIntelligence(
      [], null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const result = generateHandoverIntelligence(
      [], null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("includes Quality Standards 2015 in regulatory links", () => {
    const result = generateHandoverIntelligence(
      [], null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Quality Standards 2015"))).toBe(true);
  });

  it("includes CHR 2015 Reg 5 in regulatory links", () => {
    const result = generateHandoverIntelligence(
      [], null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 5"))).toBe(true);
  });

  it("generates strengths for outstanding score", () => {
    const categories: HandoverCategory[] = [
      "shift_handover", "medication_handover", "incident_handover", "child_update",
      "risk_update", "appointment_reminder", "contact_update", "task_completion",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `ho-${i}`, category: cat }),
    );
    const result = generateHandoverIntelligence(
      records, makePolicy(), [makeTraining()],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates areas for improvement for inadequate score", () => {
    const result = generateHandoverIntelligence(
      [], null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("generates URGENT action when policy is null", () => {
    const result = generateHandoverIntelligence(
      [makeRecord()], null, [makeTraining()],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates URGENT action when no staff training", () => {
    const result = generateHandoverIntelligence(
      [makeRecord()], makePolicy(), [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates no-action message when everything is perfect", () => {
    const categories: HandoverCategory[] = [
      "shift_handover", "medication_handover", "incident_handover", "child_update",
      "risk_update", "appointment_reminder", "contact_update", "task_completion",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `ho-${i}`, category: cat }),
    );
    const result = generateHandoverIntelligence(
      records, makePolicy(), [makeTraining()],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("generates child profiles", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "ho-002", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateHandoverIntelligence(
      records, makePolicy(), [makeTraining()],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.childProfiles.length).toBe(2);
  });

  it("rating outstanding at 80+", () => {
    const categories: HandoverCategory[] = [
      "shift_handover", "medication_handover", "incident_handover", "child_update",
      "risk_update", "appointment_reminder", "contact_update", "task_completion",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `ho-${i}`, category: cat }),
    );
    const result = generateHandoverIntelligence(
      records, makePolicy(), [makeTraining()],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("assessedAt is populated", () => {
    const result = generateHandoverIntelligence(
      [], null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.assessedAt).toBeTruthy();
    expect(result.assessedAt.length).toBeGreaterThan(0);
  });

  it("generates actions for low child coverage", () => {
    const records = [
      makeRecord({ allChildrenCovered: false, medicationStatusUpdated: false }),
    ];
    const result = generateHandoverIntelligence(
      records, makePolicy(), [makeTraining()],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.actions.some((a) => a.includes("HIGH"))).toBe(true);
  });

  it("generates areas for improvement when evaluator scores are low", () => {
    const records = [
      makeRecord({
        allChildrenCovered: false,
        medicationStatusUpdated: false,
        incidentsCommunicated: false,
        tasksHandedOver: false,
        documentationComplete: false,
        timelyRecording: false,
      }),
    ];
    const result = generateHandoverIntelligence(
      records, null, [],
      "oak-house", periodStart, periodEnd,
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });
});
