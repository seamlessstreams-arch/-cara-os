// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Restraint Analysis Intelligence Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateProportionality,
  evaluateDeEscalation,
  evaluatePostIncident,
  evaluateReduction,
  buildChildRestraintProfiles,
  generateRestraintAnalysisIntelligence,
  getRestraintTypeLabel,
  getRestraintReasonLabel,
  getDeEscalationLabel,
  getPostIncidentActionLabel,
} from "../restraint-analysis-engine";
import type {
  RestraintRecord,
  RestraintReduction,
  RestraintTraining,
} from "../restraint-analysis-engine";

// ── Shared Constants ───────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const REF_DATE = "2025-07-01";
const HOME_ID = "oak-house";

// ── Factory Helpers ────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<RestraintRecord> = {}): RestraintRecord {
  return {
    id: "r-1",
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    date: "2025-02-10",
    startTime: "14:30",
    endTime: "14:33",
    durationMinutes: 3,
    restraintType: "physical_intervention",
    reason: "risk_to_self",
    staffInvolved: ["Sarah Johnson"],
    deEscalationAttempted: true,
    deEscalationTechniques: ["verbal_reassurance", "distraction", "choices_offered"],
    postIncidentActions: ["child_debrief", "medical_check", "body_map_completed", "written_record", "manager_review", "ofsted_notified"],
    childInjured: false,
    staffInjured: false,
    childViewsRecorded: true,
    proportionalityAssessed: true,
    approvedTechniqueUsed: true,
    managerNotifiedImmediately: true,
    ...overrides,
  };
}

function makeReduction(overrides: Partial<RestraintReduction> = {}): RestraintReduction {
  return {
    id: "red-1",
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    planInPlace: true,
    planReviewDate: "2025-07-01",
    targetReduction: "Reduce restraints by 50% over 6 months",
    currentStrategies: ["Visual schedule", "Sensory breaks", "Choice boards"],
    triggerAwarenessDocumented: true,
    alternativeStrategiesIdentified: 5,
    sensoryProfileCompleted: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<RestraintTraining> = {}): RestraintTraining {
  return {
    id: "tr-1",
    homeId: HOME_ID,
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    trainingType: "PROACT-SCIPr",
    completedDate: "2025-01-15",
    expiryDate: "2026-01-15",
    refresherDue: false,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("Label Functions", () => {
  describe("getRestraintTypeLabel", () => {
    it("returns human-readable labels for all restraint types", () => {
      expect(getRestraintTypeLabel("physical_intervention")).toBe("Physical Intervention");
      expect(getRestraintTypeLabel("guided_away")).toBe("Guided Away");
      expect(getRestraintTypeLabel("held")).toBe("Held");
      expect(getRestraintTypeLabel("seated_support")).toBe("Seated Support");
      expect(getRestraintTypeLabel("standing_support")).toBe("Standing Support");
      expect(getRestraintTypeLabel("ground_based")).toBe("Ground-Based");
      expect(getRestraintTypeLabel("other")).toBe("Other");
    });
  });

  describe("getRestraintReasonLabel", () => {
    it("returns human-readable labels for all reasons", () => {
      expect(getRestraintReasonLabel("risk_to_self")).toBe("Risk to Self");
      expect(getRestraintReasonLabel("risk_to_others")).toBe("Risk to Others");
      expect(getRestraintReasonLabel("risk_to_property")).toBe("Risk to Property");
      expect(getRestraintReasonLabel("absconding")).toBe("Absconding");
      expect(getRestraintReasonLabel("other")).toBe("Other");
    });
  });

  describe("getDeEscalationLabel", () => {
    it("returns human-readable labels for all de-escalation techniques", () => {
      expect(getDeEscalationLabel("verbal_reassurance")).toBe("Verbal Reassurance");
      expect(getDeEscalationLabel("distraction")).toBe("Distraction");
      expect(getDeEscalationLabel("change_of_environment")).toBe("Change of Environment");
      expect(getDeEscalationLabel("time_away")).toBe("Time Away");
      expect(getDeEscalationLabel("active_listening")).toBe("Active Listening");
      expect(getDeEscalationLabel("choices_offered")).toBe("Choices Offered");
      expect(getDeEscalationLabel("planned_ignoring")).toBe("Planned Ignoring");
      expect(getDeEscalationLabel("humour")).toBe("Humour");
      expect(getDeEscalationLabel("other")).toBe("Other");
    });
  });

  describe("getPostIncidentActionLabel", () => {
    it("returns human-readable labels for all post-incident actions", () => {
      expect(getPostIncidentActionLabel("child_debrief")).toBe("Child Debrief");
      expect(getPostIncidentActionLabel("medical_check")).toBe("Medical Check");
      expect(getPostIncidentActionLabel("parent_notified")).toBe("Parent Notified");
      expect(getPostIncidentActionLabel("social_worker_notified")).toBe("Social Worker Notified");
      expect(getPostIncidentActionLabel("ofsted_notified")).toBe("Ofsted Notified");
      expect(getPostIncidentActionLabel("body_map_completed")).toBe("Body Map Completed");
      expect(getPostIncidentActionLabel("written_record")).toBe("Written Record");
      expect(getPostIncidentActionLabel("manager_review")).toBe("Manager Review");
      expect(getPostIncidentActionLabel("staff_debrief")).toBe("Staff Debrief");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateProportionality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateProportionality", () => {
  it("returns max score (30) when no restraints — no restraints is excellent", () => {
    const result = evaluateProportionality([], PERIOD_START, PERIOD_END);
    expect(result.totalRestraints).toBe(0);
    expect(result.overallScore).toBe(30);
  });

  it("scores high for ideal restraint practice", () => {
    const records = [makeRecord()];
    const result = evaluateProportionality(records, PERIOD_START, PERIOD_END);
    expect(result.totalRestraints).toBe(1);
    expect(result.proportionalityAssessedRate).toBe(100);
    expect(result.approvedTechniqueRate).toBe(100);
    expect(result.averageDurationMinutes).toBe(3);
    expect(result.longDurationCount).toBe(0);
    expect(result.injuryToChildRate).toBe(0);
    expect(result.injuryToStaffRate).toBe(0);
    expect(result.managerNotifiedRate).toBe(100);
    expect(result.overallScore).toBe(30);
  });

  it("penalises long durations (>10 minutes)", () => {
    const records = [makeRecord({ durationMinutes: 15 })];
    const result = evaluateProportionality(records, PERIOD_START, PERIOD_END);
    expect(result.longDurationCount).toBe(1);
    expect(result.averageDurationMinutes).toBe(15);
    // No duration bonus (>10 min = 0 pts from that component)
    expect(result.overallScore).toBeLessThan(30);
  });

  it("penalises child injuries", () => {
    const records = [makeRecord({ childInjured: true })];
    const result = evaluateProportionality(records, PERIOD_START, PERIOD_END);
    expect(result.injuryToChildRate).toBe(100);
    expect(result.overallScore).toBeLessThan(30);
  });

  it("penalises staff injuries", () => {
    const records = [makeRecord({ staffInjured: true })];
    const result = evaluateProportionality(records, PERIOD_START, PERIOD_END);
    expect(result.injuryToStaffRate).toBe(100);
    expect(result.overallScore).toBeLessThan(30);
  });

  it("penalises when proportionality not assessed", () => {
    const records = [makeRecord({ proportionalityAssessed: false })];
    const result = evaluateProportionality(records, PERIOD_START, PERIOD_END);
    expect(result.proportionalityAssessedRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("penalises unapproved techniques", () => {
    const records = [makeRecord({ approvedTechniqueUsed: false })];
    const result = evaluateProportionality(records, PERIOD_START, PERIOD_END);
    expect(result.approvedTechniqueRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("excludes records outside period", () => {
    const records = [makeRecord({ date: "2024-06-01" })];
    const result = evaluateProportionality(records, PERIOD_START, PERIOD_END);
    expect(result.totalRestraints).toBe(0);
    expect(result.overallScore).toBe(30);
  });

  it("handles multiple records with mixed quality", () => {
    const records = [
      makeRecord({ id: "r-1", durationMinutes: 3 }),
      makeRecord({ id: "r-2", date: "2025-03-15", durationMinutes: 12, proportionalityAssessed: false, childInjured: true }),
      makeRecord({ id: "r-3", date: "2025-04-20", durationMinutes: 5, approvedTechniqueUsed: false }),
    ];
    const result = evaluateProportionality(records, PERIOD_START, PERIOD_END);
    expect(result.totalRestraints).toBe(3);
    expect(result.proportionalityAssessedRate).toBeCloseTo(66.7, 0);
    expect(result.approvedTechniqueRate).toBeCloseTo(66.7, 0);
    expect(result.longDurationCount).toBe(1);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("awards duration bonus tiers correctly", () => {
    // ≤3 min = 5 pts
    const short = evaluateProportionality([makeRecord({ durationMinutes: 2 })], PERIOD_START, PERIOD_END);
    // ≤5 min = 4 pts
    const medium = evaluateProportionality([makeRecord({ durationMinutes: 5 })], PERIOD_START, PERIOD_END);
    // ≤10 min = 2 pts
    const longer = evaluateProportionality([makeRecord({ durationMinutes: 8 })], PERIOD_START, PERIOD_END);
    // >10 min = 0 pts
    const veryLong = evaluateProportionality([makeRecord({ durationMinutes: 15 })], PERIOD_START, PERIOD_END);

    expect(short.overallScore).toBeGreaterThan(medium.overallScore);
    expect(medium.overallScore).toBeGreaterThan(longer.overallScore);
    expect(longer.overallScore).toBeGreaterThan(veryLong.overallScore);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateDeEscalation
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDeEscalation", () => {
  it("returns max score (25) when no restraints", () => {
    const result = evaluateDeEscalation([], PERIOD_START, PERIOD_END);
    expect(result.totalRestraints).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("scores high for consistent de-escalation with multiple techniques", () => {
    const records = [makeRecord()]; // 3 techniques, de-escalation attempted
    const result = evaluateDeEscalation(records, PERIOD_START, PERIOD_END);
    expect(result.deEscalationAttemptedRate).toBe(100);
    expect(result.averageTechniquesPerIncident).toBe(3);
    // 15 (attempted) + 3 (3 unique techniques) + 5 (avg ≥ 3) = 23
    expect(result.overallScore).toBe(23);
  });

  it("penalises when de-escalation not attempted", () => {
    const records = [makeRecord({ deEscalationAttempted: false, deEscalationTechniques: [] })];
    const result = evaluateDeEscalation(records, PERIOD_START, PERIOD_END);
    expect(result.deEscalationAttemptedRate).toBe(0);
    expect(result.averageTechniquesPerIncident).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("tracks technique usage across incidents", () => {
    const records = [
      makeRecord({ id: "r-1", deEscalationTechniques: ["verbal_reassurance", "distraction"] }),
      makeRecord({ id: "r-2", date: "2025-03-01", deEscalationTechniques: ["verbal_reassurance", "active_listening"] }),
    ];
    const result = evaluateDeEscalation(records, PERIOD_START, PERIOD_END);
    expect(result.techniquesUsed["verbal_reassurance"]).toBe(2);
    expect(result.techniquesUsed["distraction"]).toBe(1);
    expect(result.techniquesUsed["active_listening"]).toBe(1);
  });

  it("awards technique variety bonus (up to 5 unique)", () => {
    const records = [
      makeRecord({
        deEscalationTechniques: [
          "verbal_reassurance", "distraction", "change_of_environment",
          "active_listening", "choices_offered",
        ],
      }),
    ];
    const result = evaluateDeEscalation(records, PERIOD_START, PERIOD_END);
    expect(Object.keys(result.techniquesUsed).length).toBe(5);
    expect(result.overallScore).toBe(25); // Max
  });

  it("excludes records outside period", () => {
    const records = [makeRecord({ date: "2024-06-01" })];
    const result = evaluateDeEscalation(records, PERIOD_START, PERIOD_END);
    expect(result.totalRestraints).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("handles mixed de-escalation quality", () => {
    const records = [
      makeRecord({ id: "r-1", deEscalationAttempted: true, deEscalationTechniques: ["verbal_reassurance", "distraction"] }),
      makeRecord({ id: "r-2", date: "2025-03-01", deEscalationAttempted: false, deEscalationTechniques: [] }),
    ];
    const result = evaluateDeEscalation(records, PERIOD_START, PERIOD_END);
    expect(result.deEscalationAttemptedRate).toBe(50);
    expect(result.averageTechniquesPerIncident).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePostIncident
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePostIncident", () => {
  it("returns max score (25) when no restraints", () => {
    const result = evaluatePostIncident([], PERIOD_START, PERIOD_END);
    expect(result.totalRestraints).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("scores high when all post-incident actions completed", () => {
    const records = [makeRecord()];
    const result = evaluatePostIncident(records, PERIOD_START, PERIOD_END);
    expect(result.childDebriefRate).toBe(100);
    expect(result.medicalCheckRate).toBe(100);
    expect(result.bodyMapRate).toBe(100);
    expect(result.writtenRecordRate).toBe(100);
    expect(result.managerReviewRate).toBe(100);
    expect(result.ofstedNotifiedRate).toBe(100);
    expect(result.childViewsRecordedRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("scores low when no post-incident actions completed", () => {
    const records = [makeRecord({ postIncidentActions: [], childViewsRecorded: false })];
    const result = evaluatePostIncident(records, PERIOD_START, PERIOD_END);
    expect(result.childDebriefRate).toBe(0);
    expect(result.writtenRecordRate).toBe(0);
    expect(result.childViewsRecordedRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("calculates rates correctly across multiple records", () => {
    const records = [
      makeRecord({ id: "r-1", postIncidentActions: ["child_debrief", "written_record", "body_map_completed"], childViewsRecorded: true }),
      makeRecord({ id: "r-2", date: "2025-03-01", postIncidentActions: ["written_record"], childViewsRecorded: false }),
    ];
    const result = evaluatePostIncident(records, PERIOD_START, PERIOD_END);
    expect(result.childDebriefRate).toBe(50);
    expect(result.writtenRecordRate).toBe(100);
    expect(result.bodyMapRate).toBe(50);
    expect(result.childViewsRecordedRate).toBe(50);
  });

  it("excludes records outside period", () => {
    const records = [makeRecord({ date: "2024-06-01" })];
    const result = evaluatePostIncident(records, PERIOD_START, PERIOD_END);
    expect(result.totalRestraints).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("tracks parent and social worker notification rates", () => {
    const records = [
      makeRecord({ id: "r-1", postIncidentActions: ["parent_notified", "social_worker_notified", "written_record"] }),
      makeRecord({ id: "r-2", date: "2025-03-01", postIncidentActions: ["written_record"] }),
    ];
    const result = evaluatePostIncident(records, PERIOD_START, PERIOD_END);
    expect(result.parentNotifiedRate).toBe(50);
    expect(result.socialWorkerNotifiedRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateReduction
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateReduction", () => {
  it("returns max score (20) when no restraints and no training needed", () => {
    const result = evaluateReduction([], [], [], PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.childrenWithRestraints).toBe(0);
    expect(result.overallScore).toBe(20);
  });

  it("scores well when all children have reduction plans and training is current", () => {
    const records = [makeRecord()];
    const reductions = [makeReduction()];
    const training = [makeTraining()];
    const result = evaluateReduction(records, reductions, training, PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.childrenWithRestraints).toBe(1);
    expect(result.reductionPlansInPlace).toBe(1);
    expect(result.reductionPlanRate).toBe(100);
    expect(result.triggerAwarenessRate).toBe(100);
    expect(result.sensoryProfileRate).toBe(100);
    expect(result.staffTrainingCompliance).toBe(100);
    expect(result.overallScore).toBe(20);
  });

  it("penalises missing reduction plans", () => {
    const records = [makeRecord()];
    const reductions = [makeReduction({ planInPlace: false, triggerAwarenessDocumented: false, alternativeStrategiesIdentified: 0, sensoryProfileCompleted: false })];
    const training = [makeTraining()];
    const result = evaluateReduction(records, reductions, training, PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.reductionPlanRate).toBe(0);
    expect(result.overallScore).toBeLessThan(15);
  });

  it("penalises expired training", () => {
    const records = [makeRecord()];
    const reductions = [makeReduction()];
    const training = [makeTraining({ expiryDate: "2025-01-01" })]; // Expired before ref date
    const result = evaluateReduction(records, reductions, training, PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.staffTrainingCompliance).toBe(0);
    expect(result.overallScore).toBeLessThan(20);
  });

  it("handles training compliance even without restraints", () => {
    const training = [
      makeTraining({ id: "t1", expiryDate: "2026-01-01" }),
      makeTraining({ id: "t2", staffId: "staff-tom", staffName: "Tom Richards", expiryDate: "2024-12-01" }),
    ];
    const result = evaluateReduction([], [], training, PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.staffTrainingCompliance).toBe(50);
    expect(result.overallScore).toBeLessThan(20);
  });

  it("awards alternative strategies bonus tiers", () => {
    const records = [makeRecord()];
    const high = evaluateReduction(records, [makeReduction({ alternativeStrategiesIdentified: 6 })], [makeTraining()], PERIOD_START, PERIOD_END, REF_DATE);
    const mid = evaluateReduction(records, [makeReduction({ alternativeStrategiesIdentified: 3 })], [makeTraining()], PERIOD_START, PERIOD_END, REF_DATE);
    const low = evaluateReduction(records, [makeReduction({ alternativeStrategiesIdentified: 1 })], [makeTraining()], PERIOD_START, PERIOD_END, REF_DATE);
    const none = evaluateReduction(records, [makeReduction({ alternativeStrategiesIdentified: 0 })], [makeTraining()], PERIOD_START, PERIOD_END, REF_DATE);

    expect(high.overallScore).toBeGreaterThanOrEqual(mid.overallScore);
    expect(mid.overallScore).toBeGreaterThanOrEqual(low.overallScore);
    expect(low.overallScore).toBeGreaterThan(none.overallScore);
  });

  it("handles multiple children with varying plans", () => {
    const records = [
      makeRecord({ id: "r-1", childId: "child-alex" }),
      makeRecord({ id: "r-2", childId: "child-jordan", childName: "Jordan", date: "2025-03-01" }),
    ];
    const reductions = [
      makeReduction({ childId: "child-alex", planInPlace: true }),
      // Jordan has no reduction plan
    ];
    const result = evaluateReduction(records, reductions, [makeTraining()], PERIOD_START, PERIOD_END, REF_DATE);
    expect(result.childrenWithRestraints).toBe(2);
    expect(result.reductionPlansInPlace).toBe(1);
    expect(result.reductionPlanRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildRestraintProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildRestraintProfiles", () => {
  it("returns empty array when no restraints in period", () => {
    const profiles = buildChildRestraintProfiles([], [], PERIOD_START, PERIOD_END);
    expect(profiles).toEqual([]);
  });

  it("builds profile for single child with ideal practice", () => {
    const records = [makeRecord()];
    const reductions = [makeReduction()];
    const profiles = buildChildRestraintProfiles(records, reductions, PERIOD_START, PERIOD_END);
    expect(profiles.length).toBe(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].totalRestraints).toBe(1);
    expect(profiles[0].averageDurationMinutes).toBe(3);
    expect(profiles[0].deEscalationAttemptedRate).toBe(100);
    expect(profiles[0].childViewsRecordedRate).toBe(100);
    expect(profiles[0].injuryRate).toBe(0);
    expect(profiles[0].reductionPlanInPlace).toBe(true);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(7);
  });

  it("builds profiles for multiple children and sorts by score (lowest first)", () => {
    const records = [
      makeRecord({ id: "r-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r-2", childId: "child-jordan", childName: "Jordan", date: "2025-03-01", deEscalationAttempted: false, deEscalationTechniques: [], childViewsRecorded: false, postIncidentActions: [] }),
    ];
    const reductions = [makeReduction({ childId: "child-alex" })];
    const profiles = buildChildRestraintProfiles(records, reductions, PERIOD_START, PERIOD_END);
    expect(profiles.length).toBe(2);
    // Jordan should have lower score (sorted first)
    expect(profiles[0].childName).toBe("Jordan");
    expect(profiles[1].childName).toBe("Alex");
  });

  it("identifies most common reason and type", () => {
    const records = [
      makeRecord({ id: "r-1", reason: "risk_to_self", restraintType: "physical_intervention" }),
      makeRecord({ id: "r-2", date: "2025-03-01", reason: "risk_to_self", restraintType: "guided_away" }),
      makeRecord({ id: "r-3", date: "2025-04-01", reason: "risk_to_others", restraintType: "physical_intervention" }),
    ];
    const profiles = buildChildRestraintProfiles(records, [], PERIOD_START, PERIOD_END);
    expect(profiles[0].mostCommonReason).toBe("risk_to_self");
    expect(profiles[0].mostCommonType).toBe("physical_intervention");
  });

  it("penalises high volume (>5 restraints)", () => {
    const records = Array.from({ length: 6 }, (_, i) =>
      makeRecord({ id: `r-${i}`, date: `2025-0${(i % 5) + 1}-15` }),
    );
    const profiles = buildChildRestraintProfiles(records, [], PERIOD_START, PERIOD_END);
    expect(profiles[0].totalRestraints).toBe(6);
    // Volume penalty of -1 applied, but other bonuses still active
    expect(profiles[0].overallScore).toBeLessThanOrEqual(8);
  });

  it("penalises long average duration (>10 min)", () => {
    const records = [makeRecord({ durationMinutes: 15 })];
    const profiles = buildChildRestraintProfiles(records, [], PERIOD_START, PERIOD_END);
    expect(profiles[0].averageDurationMinutes).toBe(15);
    // Duration penalty of -1 applied, but other bonuses still active
    expect(profiles[0].overallScore).toBeLessThanOrEqual(8);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateRestraintAnalysisIntelligence — Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("generateRestraintAnalysisIntelligence", () => {
  // ── Chamberlain House Demo Scenario ──────────────────────────────────────────────

  const demoRecords: RestraintRecord[] = [
    // Alex — 2 restraints, well managed
    {
      id: "r-a1", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
      date: "2025-02-10", startTime: "14:30", endTime: "14:33", durationMinutes: 3,
      restraintType: "physical_intervention", reason: "risk_to_self",
      staffInvolved: ["Sarah Johnson", "Tom Richards"],
      deEscalationAttempted: true,
      deEscalationTechniques: ["verbal_reassurance", "distraction", "choices_offered"],
      postIncidentActions: ["child_debrief", "medical_check", "body_map_completed", "written_record", "manager_review", "ofsted_notified", "parent_notified"],
      childInjured: false, staffInjured: false, childViewsRecorded: true,
      proportionalityAssessed: true, approvedTechniqueUsed: true, managerNotifiedImmediately: true,
    },
    {
      id: "r-a2", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
      date: "2025-04-22", startTime: "17:15", endTime: "17:18", durationMinutes: 3,
      restraintType: "guided_away", reason: "risk_to_others",
      staffInvolved: ["Tom Richards"],
      deEscalationAttempted: true,
      deEscalationTechniques: ["verbal_reassurance", "change_of_environment", "active_listening"],
      postIncidentActions: ["child_debrief", "medical_check", "body_map_completed", "written_record", "manager_review", "ofsted_notified"],
      childInjured: false, staffInjured: false, childViewsRecorded: true,
      proportionalityAssessed: true, approvedTechniqueUsed: true, managerNotifiedImmediately: true,
    },
    // Morgan — 1 restraint, some gaps in follow-up
    {
      id: "r-m1", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
      date: "2025-03-15", startTime: "20:45", endTime: "20:53", durationMinutes: 8,
      restraintType: "physical_intervention", reason: "risk_to_self",
      staffInvolved: ["Lisa Williams", "Sarah Johnson"],
      deEscalationAttempted: true,
      deEscalationTechniques: ["verbal_reassurance", "time_away"],
      postIncidentActions: ["written_record", "manager_review", "ofsted_notified", "medical_check"],
      childInjured: false, staffInjured: false, childViewsRecorded: false, // Morgan refused to give views
      proportionalityAssessed: true, approvedTechniqueUsed: true, managerNotifiedImmediately: true,
    },
  ];

  const demoReductions: RestraintReduction[] = [
    {
      id: "red-a1", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
      planInPlace: true, planReviewDate: "2025-07-01",
      targetReduction: "Reduce restraint incidents to zero over 6 months through enhanced transition planning",
      currentStrategies: ["Visual schedule", "Sensory breaks", "Choice boards", "Transition plans"],
      triggerAwarenessDocumented: true, alternativeStrategiesIdentified: 5, sensoryProfileCompleted: true,
    },
    {
      id: "red-m1", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
      planInPlace: true, planReviewDate: "2025-08-01",
      targetReduction: "Reduce through improved evening routine and CAMHS support",
      currentStrategies: ["Evening routine structure", "CAMHS coping strategies", "Sensory tools"],
      triggerAwarenessDocumented: true, alternativeStrategiesIdentified: 4, sensoryProfileCompleted: false,
    },
  ];

  const demoTraining: RestraintTraining[] = [
    { id: "tr-1", homeId: HOME_ID, staffId: "staff-sarah", staffName: "Sarah Johnson", trainingType: "PROACT-SCIPr", completedDate: "2025-01-15", expiryDate: "2026-01-15", refresherDue: false },
    { id: "tr-2", homeId: HOME_ID, staffId: "staff-tom", staffName: "Tom Richards", trainingType: "PROACT-SCIPr", completedDate: "2025-01-15", expiryDate: "2026-01-15", refresherDue: false },
    { id: "tr-3", homeId: HOME_ID, staffId: "staff-lisa", staffName: "Lisa Williams", trainingType: "PROACT-SCIPr", completedDate: "2025-02-01", expiryDate: "2026-02-01", refresherDue: false },
    { id: "tr-4", homeId: HOME_ID, staffId: "staff-darren", staffName: "Darren Laville", trainingType: "PROACT-SCIPr", completedDate: "2024-11-01", expiryDate: "2025-11-01", refresherDue: false },
  ];

  it("produces a complete intelligence result", () => {
    const result = generateRestraintAnalysisIntelligence(
      demoRecords, demoReductions, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);

    expect(result.proportionality).toBeDefined();
    expect(result.deEscalation).toBeDefined();
    expect(result.postIncident).toBeDefined();
    expect(result.reduction).toBeDefined();
    expect(result.childProfiles.length).toBe(2); // Alex and Morgan
    expect(result.regulatoryLinks.length).toBe(6);
  });

  it("calculates correct proportionality metrics for demo data", () => {
    const result = generateRestraintAnalysisIntelligence(
      demoRecords, demoReductions, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    const prop = result.proportionality;
    expect(prop.totalRestraints).toBe(3);
    expect(prop.proportionalityAssessedRate).toBe(100);
    expect(prop.approvedTechniqueRate).toBe(100);
    expect(prop.injuryToChildRate).toBe(0);
    expect(prop.injuryToStaffRate).toBe(0);
    expect(prop.managerNotifiedRate).toBe(100);
    expect(prop.longDurationCount).toBe(0); // all ≤10 min
  });

  it("calculates correct de-escalation metrics for demo data", () => {
    const result = generateRestraintAnalysisIntelligence(
      demoRecords, demoReductions, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    const de = result.deEscalation;
    expect(de.totalRestraints).toBe(3);
    expect(de.deEscalationAttemptedRate).toBe(100);
    expect(de.averageTechniquesPerIncident).toBeGreaterThan(2);
  });

  it("calculates correct post-incident metrics for demo data", () => {
    const result = generateRestraintAnalysisIntelligence(
      demoRecords, demoReductions, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    const post = result.postIncident;
    expect(post.totalRestraints).toBe(3);
    expect(post.writtenRecordRate).toBe(100);
    expect(post.managerReviewRate).toBe(100);
    expect(post.ofstedNotifiedRate).toBe(100);
    // Child debrief: 2/3 (Alex x2, not Morgan)
    expect(post.childDebriefRate).toBeCloseTo(66.7, 0);
    // Child views: 2/3
    expect(post.childViewsRecordedRate).toBeCloseTo(66.7, 0);
  });

  it("calculates correct reduction metrics for demo data", () => {
    const result = generateRestraintAnalysisIntelligence(
      demoRecords, demoReductions, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    const red = result.reduction;
    expect(red.childrenWithRestraints).toBe(2);
    expect(red.reductionPlansInPlace).toBe(2);
    expect(red.reductionPlanRate).toBe(100);
    expect(red.staffTrainingCompliance).toBe(100); // All valid at ref date
  });

  it("generates strengths for good practice", () => {
    const result = generateRestraintAnalysisIntelligence(
      demoRecords, demoReductions, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Approved"),
      ]),
    );
    expect(result.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("De-escalation"),
      ]),
    );
  });

  it("generates areas for improvement when child views not consistently recorded", () => {
    const result = generateRestraintAnalysisIntelligence(
      demoRecords, demoReductions, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    // childViewsRecordedRate is ~66.7% which is <70%
    expect(result.areasForImprovement).toEqual(
      expect.arrayContaining([
        expect.stringContaining("views"),
      ]),
    );
  });

  it("generates regulatory links", () => {
    const result = generateRestraintAnalysisIntelligence(
      demoRecords, demoReductions, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.regulatoryLinks).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Reg 35"),
        expect.stringContaining("Reg 19"),
        expect.stringContaining("Reg 40"),
        expect.stringContaining("SCCIF"),
        expect.stringContaining("UNCRC"),
      ]),
    );
  });

  it("overall score is sum of component scores", () => {
    const result = generateRestraintAnalysisIntelligence(
      demoRecords, demoReductions, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    const expected = Math.round(
      (result.proportionality.overallScore +
        result.deEscalation.overallScore +
        result.postIncident.overallScore +
        result.reduction.overallScore) * 10,
    ) / 10;
    expect(result.overallScore).toBe(expected);
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  it("handles zero restraints — maximum score", () => {
    const result = generateRestraintAnalysisIntelligence(
      [], [], demoTraining, HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.childProfiles.length).toBe(0);
    expect(result.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("No restraints"),
      ]),
    );
  });

  it("handles worst-case scenario — everything wrong", () => {
    const badRecords = [
      makeRecord({
        id: "bad-1", durationMinutes: 20,
        deEscalationAttempted: false, deEscalationTechniques: [],
        postIncidentActions: [], childViewsRecorded: false,
        childInjured: true, staffInjured: true,
        proportionalityAssessed: false, approvedTechniqueUsed: false,
        managerNotifiedImmediately: false,
      }),
    ];
    const result = generateRestraintAnalysisIntelligence(
      badRecords, [], [], HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.overallScore).toBeLessThan(20);
    expect(result.rating).toBe("inadequate");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("URGENT"),
      ]),
    );
  });

  it("rating thresholds work correctly", () => {
    const result = generateRestraintAnalysisIntelligence(
      demoRecords, demoReductions, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    if (result.overallScore >= 80) expect(result.rating).toBe("outstanding");
    else if (result.overallScore >= 60) expect(result.rating).toBe("good");
    else if (result.overallScore >= 40) expect(result.rating).toBe("requires_improvement");
    else expect(result.rating).toBe("inadequate");
  });

  it("builds child profiles sorted by lowest score first", () => {
    const result = generateRestraintAnalysisIntelligence(
      demoRecords, demoReductions, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.childProfiles.length).toBe(2);
    // First profile should have lower or equal score
    expect(result.childProfiles[0].overallScore).toBeLessThanOrEqual(result.childProfiles[1].overallScore);
  });
});
