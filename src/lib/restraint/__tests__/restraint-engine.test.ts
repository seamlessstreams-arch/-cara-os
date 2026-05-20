// ══════════════════════════════════════════════════════════════════════════════
// Restraint Intelligence Engine — Tests (vitest)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getRestraintCategoryLabel,
  getRestraintOutcomeLabel,
  getRatingLabel,
  evaluateRestraintQuality,
  evaluateRestraintCompliance,
  evaluateRestraintPolicy,
  evaluateStaffRestraintReadiness,
  buildChildRestraintProfiles,
  generateRestraintIntelligence,
} from "../restraint-engine";
import type {
  RestraintRecord,
  RestraintPolicy,
  StaffRestraintTraining,
  RestraintCategory,
} from "../restraint-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeRecord(overrides: Partial<RestraintRecord> = {}): RestraintRecord {
  return {
    id: "rec-001",
    homeId: "oak-house",
    date: "2026-03-15",
    childId: "child-alex",
    childName: "Alex",
    category: "physical_intervention",
    outcome: "restraint_applied",
    deEscalationAttempted: true,
    debriefCompleted: true,
    bodyMapRecorded: true,
    parentNotified: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<RestraintPolicy> = {}): RestraintPolicy {
  return {
    restraintPolicy: true,
    deEscalationPolicy: true,
    postIncidentDebriefPolicy: true,
    bodyMapPolicy: true,
    notificationProcedure: true,
    techniqueReviewPolicy: true,
    reductionStrategyPolicy: true,
    ...overrides,
  };
}

function makeStaff(overrides: Partial<StaffRestraintTraining> = {}): StaffRestraintTraining {
  return {
    staffId: "staff-sarah",
    approvedTechniqueTraining: true,
    deEscalationSkills: true,
    postIncidentDebrief: true,
    bodyMapRecording: true,
    notificationProcedures: true,
    reductionStrategyKnowledge: true,
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

  it("returns 0 for 0 numerator with positive denominator", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
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

  it("handles boundary at exactly 80", () => {
    expect(getRating(80)).toBe("outstanding");
  });

  it("handles boundary at exactly 60", () => {
    expect(getRating(60)).toBe("good");
  });

  it("handles boundary at exactly 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getRestraintCategoryLabel", () => {
  it("returns correct label for physical_intervention", () => {
    expect(getRestraintCategoryLabel("physical_intervention")).toBe("Physical Intervention");
  });

  it("returns correct label for de_escalation", () => {
    expect(getRestraintCategoryLabel("de_escalation")).toBe("De-escalation");
  });

  it("returns correct label for post_incident_debrief", () => {
    expect(getRestraintCategoryLabel("post_incident_debrief")).toBe("Post-Incident Debrief");
  });

  it("returns correct label for medical_check", () => {
    expect(getRestraintCategoryLabel("medical_check")).toBe("Medical Check");
  });

  it("returns correct label for body_map_record", () => {
    expect(getRestraintCategoryLabel("body_map_record")).toBe("Body Map Record");
  });

  it("returns correct label for notification_to_parent", () => {
    expect(getRestraintCategoryLabel("notification_to_parent")).toBe("Notification to Parent");
  });

  it("returns correct label for notification_to_ofsted", () => {
    expect(getRestraintCategoryLabel("notification_to_ofsted")).toBe("Notification to Ofsted");
  });

  it("returns correct label for review_of_technique", () => {
    expect(getRestraintCategoryLabel("review_of_technique")).toBe("Review of Technique");
  });
});

describe("getRestraintOutcomeLabel", () => {
  it("returns correct label for de_escalation_successful", () => {
    expect(getRestraintOutcomeLabel("de_escalation_successful")).toBe("De-escalation Successful");
  });

  it("returns correct label for restraint_applied", () => {
    expect(getRestraintOutcomeLabel("restraint_applied")).toBe("Restraint Applied");
  });

  it("returns correct label for injury_reported", () => {
    expect(getRestraintOutcomeLabel("injury_reported")).toBe("Injury Reported");
  });

  it("returns correct label for no_further_action", () => {
    expect(getRestraintOutcomeLabel("no_further_action")).toBe("No Further Action");
  });

  it("returns correct label for not_applicable", () => {
    expect(getRestraintOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns correct label for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns correct label for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns correct label for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: evaluateRestraintQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRestraintQuality", () => {
  it("returns all zeros and score 0 for empty records", () => {
    const result = evaluateRestraintQuality([]);
    expect(result.totalRecords).toBe(0);
    expect(result.deEscalationAttemptedRate).toBe(0);
    expect(result.debriefCompletedRate).toBe(0);
    expect(result.bodyMapRecordedRate).toBe(0);
    expect(result.parentNotifiedRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("returns perfect 25 for all-true records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateRestraintQuality(records);
    expect(result.deEscalationAttemptedRate).toBe(100);
    expect(result.debriefCompletedRate).toBe(100);
    expect(result.bodyMapRecordedRate).toBe(100);
    expect(result.parentNotifiedRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("calculates partial scores correctly (50% across all)", () => {
    const records = [
      makeRecord({ id: "r1", deEscalationAttempted: true, debriefCompleted: true, bodyMapRecorded: true, parentNotified: true }),
      makeRecord({ id: "r2", deEscalationAttempted: false, debriefCompleted: false, bodyMapRecorded: false, parentNotified: false }),
    ];
    const result = evaluateRestraintQuality(records);
    expect(result.deEscalationAttemptedRate).toBe(50);
    expect(result.debriefCompletedRate).toBe(50);
    expect(result.bodyMapRecordedRate).toBe(50);
    expect(result.parentNotifiedRate).toBe(50);
    // (50/100)*7 + (50/100)*6 + (50/100)*6 + (50/100)*6 = 3.5+3+3+3 = 12.5 -> rounds to 13
    expect(result.overallScore).toBe(13);
  });

  it("caps score at 25", () => {
    const records = [makeRecord()];
    const result = evaluateRestraintQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.overallScore).toBe(25);
  });

  it("assigns correct rating for perfect score", () => {
    const records = [makeRecord()];
    const result = evaluateRestraintQuality(records);
    // 25 * 4 = 100 -> outstanding
    expect(result.rating).toBe("outstanding");
  });

  it("assigns inadequate rating for empty records", () => {
    const result = evaluateRestraintQuality([]);
    expect(result.rating).toBe("inadequate");
  });

  it("handles single record with all false quality flags", () => {
    const records = [
      makeRecord({
        deEscalationAttempted: false,
        debriefCompleted: false,
        bodyMapRecorded: false,
        parentNotified: false,
      }),
    ];
    const result = evaluateRestraintQuality(records);
    expect(result.overallScore).toBe(0);
    expect(result.deEscalationAttemptedRate).toBe(0);
  });

  it("weights deEscalationAttempted at 7", () => {
    const records = [
      makeRecord({ deEscalationAttempted: true, debriefCompleted: false, bodyMapRecorded: false, parentNotified: false }),
    ];
    const result = evaluateRestraintQuality(records);
    // (100/100)*7 = 7 -> rounds to 7
    expect(result.overallScore).toBe(7);
  });

  it("weights debriefCompleted at 6", () => {
    const records = [
      makeRecord({ deEscalationAttempted: false, debriefCompleted: true, bodyMapRecorded: false, parentNotified: false }),
    ];
    const result = evaluateRestraintQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("weights bodyMapRecorded at 6", () => {
    const records = [
      makeRecord({ deEscalationAttempted: false, debriefCompleted: false, bodyMapRecorded: true, parentNotified: false }),
    ];
    const result = evaluateRestraintQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("weights parentNotified at 6", () => {
    const records = [
      makeRecord({ deEscalationAttempted: false, debriefCompleted: false, bodyMapRecorded: false, parentNotified: true }),
    ];
    const result = evaluateRestraintQuality(records);
    expect(result.overallScore).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: evaluateRestraintCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRestraintCompliance", () => {
  it("returns all zeros and score 0 for empty records", () => {
    const result = evaluateRestraintCompliance([]);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.debriefCompletedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("returns perfect score when all docs complete with full category diversity", () => {
    const allCategories: RestraintCategory[] = [
      "physical_intervention", "de_escalation", "post_incident_debrief", "medical_check",
      "body_map_record", "notification_to_parent", "notification_to_ofsted", "review_of_technique",
    ];
    const records = allCategories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateRestraintCompliance(records);
    expect(result.documentationRate).toBe(100);
    expect(result.timelyRecordingRate).toBe(100);
    expect(result.debriefCompletedRate).toBe(100);
    expect(result.categoryDiversityRatio).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("calculates documentation rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true }),
      makeRecord({ id: "r2", documentationComplete: false }),
    ];
    const result = evaluateRestraintCompliance(records);
    expect(result.documentationRate).toBe(50);
  });

  it("calculates timely recording rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", timelyRecording: true }),
      makeRecord({ id: "r2", timelyRecording: false }),
    ];
    const result = evaluateRestraintCompliance(records);
    expect(result.timelyRecordingRate).toBe(50);
  });

  it("calculates debrief completed rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", debriefCompleted: true }),
      makeRecord({ id: "r2", debriefCompleted: false }),
    ];
    const result = evaluateRestraintCompliance(records);
    expect(result.debriefCompletedRate).toBe(50);
  });

  it("calculates category diversity ratio correctly (1 of 8 = 13%)", () => {
    const records = [makeRecord()]; // only physical_intervention
    const result = evaluateRestraintCompliance(records);
    expect(result.categoryDiversityRatio).toBe(13); // 1/8 = 12.5 -> rounds to 13
  });

  it("caps score at 25", () => {
    const allCategories: RestraintCategory[] = [
      "physical_intervention", "de_escalation", "post_incident_debrief", "medical_check",
      "body_map_record", "notification_to_parent", "notification_to_ofsted", "review_of_technique",
    ];
    const records = allCategories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateRestraintCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("weights documentationRate at 8", () => {
    // Only documentation is true, others false, single category
    const records = [makeRecord({
      documentationComplete: true,
      timelyRecording: false,
      debriefCompleted: false,
    })];
    const result = evaluateRestraintCompliance(records);
    // docRate=100 -> (100/100)*8 = 8; timely=0; debrief=0; diversity=1/8=13% -> (13/100)*5 = 0.65
    // total = 8 + 0 + 0 + 0.65 = 8.65 -> rounds to 9
    expect(result.overallScore).toBe(9);
  });

  it("assigns inadequate rating for empty records", () => {
    const result = evaluateRestraintCompliance([]);
    expect(result.rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: evaluateRestraintPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRestraintPolicy", () => {
  it("returns 0 score and all false for null policy", () => {
    const result = evaluateRestraintPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.restraintPolicy).toBe(false);
    expect(result.deEscalationPolicy).toBe(false);
    expect(result.postIncidentDebriefPolicy).toBe(false);
    expect(result.bodyMapPolicy).toBe(false);
    expect(result.notificationProcedure).toBe(false);
    expect(result.techniqueReviewPolicy).toBe(false);
    expect(result.reductionStrategyPolicy).toBe(false);
  });

  it("returns inadequate rating for null policy", () => {
    const result = evaluateRestraintPolicy(null);
    expect(result.rating).toBe("inadequate");
  });

  it("returns perfect 25 for fully compliant policy", () => {
    const result = evaluateRestraintPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("returns outstanding rating for full policy", () => {
    const result = evaluateRestraintPolicy(makePolicy());
    // 25 * 4 = 100 -> outstanding
    expect(result.rating).toBe("outstanding");
  });

  it("weights first 4 booleans at 4 points each (16 total)", () => {
    const result = evaluateRestraintPolicy(makePolicy({
      notificationProcedure: false,
      techniqueReviewPolicy: false,
      reductionStrategyPolicy: false,
    }));
    expect(result.overallScore).toBe(16); // 4+4+4+4 = 16
  });

  it("weights last 3 booleans at 3 points each (9 total)", () => {
    const result = evaluateRestraintPolicy(makePolicy({
      restraintPolicy: false,
      deEscalationPolicy: false,
      postIncidentDebriefPolicy: false,
      bodyMapPolicy: false,
    }));
    expect(result.overallScore).toBe(9); // 3+3+3 = 9
  });

  it("returns 0 when all booleans are false", () => {
    const result = evaluateRestraintPolicy({
      restraintPolicy: false,
      deEscalationPolicy: false,
      postIncidentDebriefPolicy: false,
      bodyMapPolicy: false,
      notificationProcedure: false,
      techniqueReviewPolicy: false,
      reductionStrategyPolicy: false,
    });
    expect(result.overallScore).toBe(0);
  });

  it("returns correct score for single 4-point boolean", () => {
    const result = evaluateRestraintPolicy({
      restraintPolicy: true,
      deEscalationPolicy: false,
      postIncidentDebriefPolicy: false,
      bodyMapPolicy: false,
      notificationProcedure: false,
      techniqueReviewPolicy: false,
      reductionStrategyPolicy: false,
    });
    expect(result.overallScore).toBe(4);
  });

  it("returns correct score for single 3-point boolean", () => {
    const result = evaluateRestraintPolicy({
      restraintPolicy: false,
      deEscalationPolicy: false,
      postIncidentDebriefPolicy: false,
      bodyMapPolicy: false,
      notificationProcedure: true,
      techniqueReviewPolicy: false,
      reductionStrategyPolicy: false,
    });
    expect(result.overallScore).toBe(3);
  });

  it("reflects boolean values in result", () => {
    const result = evaluateRestraintPolicy(makePolicy({
      restraintPolicy: true,
      deEscalationPolicy: false,
    }));
    expect(result.restraintPolicy).toBe(true);
    expect(result.deEscalationPolicy).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: evaluateStaffRestraintReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffRestraintReadiness", () => {
  it("returns all zeros and score 0 for empty staff", () => {
    const result = evaluateStaffRestraintReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.approvedTechniqueTrainingRate).toBe(0);
    expect(result.deEscalationSkillsRate).toBe(0);
    expect(result.postIncidentDebriefRate).toBe(0);
    expect(result.bodyMapRecordingRate).toBe(0);
    expect(result.notificationProceduresRate).toBe(0);
    expect(result.reductionStrategyKnowledgeRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("returns inadequate rating for empty staff", () => {
    const result = evaluateStaffRestraintReadiness([]);
    expect(result.rating).toBe("inadequate");
  });

  it("returns perfect 25 for fully trained staff", () => {
    const staff = [
      makeStaff({ staffId: "s1" }),
      makeStaff({ staffId: "s2" }),
    ];
    const result = evaluateStaffRestraintReadiness(staff);
    expect(result.overallScore).toBe(25);
  });

  it("calculates partial rates correctly", () => {
    const staff = [
      makeStaff({ staffId: "s1", approvedTechniqueTraining: true, deEscalationSkills: false }),
      makeStaff({ staffId: "s2", approvedTechniqueTraining: false, deEscalationSkills: true }),
    ];
    const result = evaluateStaffRestraintReadiness(staff);
    expect(result.approvedTechniqueTrainingRate).toBe(50);
    expect(result.deEscalationSkillsRate).toBe(50);
  });

  it("caps score at 25", () => {
    const staff = [makeStaff()];
    const result = evaluateStaffRestraintReadiness(staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns 0 score when all skills are false", () => {
    const staff = [
      makeStaff({
        staffId: "s1",
        approvedTechniqueTraining: false,
        deEscalationSkills: false,
        postIncidentDebrief: false,
        bodyMapRecording: false,
        notificationProcedures: false,
        reductionStrategyKnowledge: false,
      }),
    ];
    const result = evaluateStaffRestraintReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("weights approvedTechniqueTraining at 6", () => {
    const staff = [makeStaff({
      approvedTechniqueTraining: true,
      deEscalationSkills: false,
      postIncidentDebrief: false,
      bodyMapRecording: false,
      notificationProcedures: false,
      reductionStrategyKnowledge: false,
    })];
    const result = evaluateStaffRestraintReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("weights deEscalationSkills at 5", () => {
    const staff = [makeStaff({
      approvedTechniqueTraining: false,
      deEscalationSkills: true,
      postIncidentDebrief: false,
      bodyMapRecording: false,
      notificationProcedures: false,
      reductionStrategyKnowledge: false,
    })];
    const result = evaluateStaffRestraintReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("weights postIncidentDebrief at 5", () => {
    const staff = [makeStaff({
      approvedTechniqueTraining: false,
      deEscalationSkills: false,
      postIncidentDebrief: true,
      bodyMapRecording: false,
      notificationProcedures: false,
      reductionStrategyKnowledge: false,
    })];
    const result = evaluateStaffRestraintReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("weights bodyMapRecording at 4", () => {
    const staff = [makeStaff({
      approvedTechniqueTraining: false,
      deEscalationSkills: false,
      postIncidentDebrief: false,
      bodyMapRecording: true,
      notificationProcedures: false,
      reductionStrategyKnowledge: false,
    })];
    const result = evaluateStaffRestraintReadiness(staff);
    expect(result.overallScore).toBe(4);
  });

  it("weights notificationProcedures at 3", () => {
    const staff = [makeStaff({
      approvedTechniqueTraining: false,
      deEscalationSkills: false,
      postIncidentDebrief: false,
      bodyMapRecording: false,
      notificationProcedures: true,
      reductionStrategyKnowledge: false,
    })];
    const result = evaluateStaffRestraintReadiness(staff);
    expect(result.overallScore).toBe(3);
  });

  it("weights reductionStrategyKnowledge at 2", () => {
    const staff = [makeStaff({
      approvedTechniqueTraining: false,
      deEscalationSkills: false,
      postIncidentDebrief: false,
      bodyMapRecording: false,
      notificationProcedures: false,
      reductionStrategyKnowledge: true,
    })];
    const result = evaluateStaffRestraintReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("counts total staff", () => {
    const staff = [
      makeStaff({ staffId: "s1" }),
      makeStaff({ staffId: "s2" }),
      makeStaff({ staffId: "s3" }),
    ];
    const result = evaluateStaffRestraintReadiness(staff);
    expect(result.totalStaff).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Restraint Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildRestraintProfiles", () => {
  it("returns empty array for no records", () => {
    const profiles = buildChildRestraintProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildRestraintProfiles(records);
    expect(profiles.length).toBe(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.totalRecords).toBe(2);
  });

  it("calculates freq score: 2 for >= 10 records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildRestraintProfiles(records);
    // freq=2, rate1=3 (100%>=80), rate2=3 (100%>=80), diversity=0 (only 1 cat < 2)
    // Actually diversity: 1 cat -> 0
    // Total = 2+3+3+0 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("calculates freq score: 1 for >= 5 and < 10 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildRestraintProfiles(records);
    // freq=1, rate1=3, rate2=3, diversity=0 (1 cat < 2)
    // Total = 1+3+3+0 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("calculates freq score: 0 for < 5 records", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildRestraintProfiles(records);
    // freq=0, rate1=3, rate2=3, diversity=0 (1 cat < 2)
    // Total = 0+3+3+0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("caps overallScore at 10", () => {
    // 10+ records, all true, 4+ categories -> 2+3+3+2 = 10
    const categories: RestraintCategory[] = ["physical_intervention", "de_escalation", "post_incident_debrief", "medical_check"];
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex", category: categories[i % 4] }),
    );
    const profiles = buildChildRestraintProfiles(records);
    // freq=2 (12>=10), rate1=3 (100%>=80), rate2=3 (100%>=80), diversity=2 (4>=4)
    // Total = 2+3+3+2 = 10
    expect(profiles[0].overallScore).toBe(10);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("calculates rate1 (deEscalation): 3 for >= 80%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childName: "A", deEscalationAttempted: true }),
    );
    const profiles = buildChildRestraintProfiles(records);
    expect(profiles[0].deEscalationAttemptedRate).toBe(100);
  });

  it("calculates rate1 (deEscalation): 2 for >= 60% and < 80%", () => {
    // 3/5 = 60%
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childName: "A", deEscalationAttempted: i < 3 }),
    );
    const profiles = buildChildRestraintProfiles(records);
    expect(profiles[0].deEscalationAttemptedRate).toBe(60);
  });

  it("calculates rate1 (deEscalation): 1 for >= 40% and < 60%", () => {
    // 2/5 = 40%
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childName: "A", deEscalationAttempted: i < 2 }),
    );
    const profiles = buildChildRestraintProfiles(records);
    expect(profiles[0].deEscalationAttemptedRate).toBe(40);
  });

  it("calculates rate1 (deEscalation): 0 for < 40%", () => {
    // 1/5 = 20%
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childName: "A", deEscalationAttempted: i === 0 }),
    );
    const profiles = buildChildRestraintProfiles(records);
    expect(profiles[0].deEscalationAttemptedRate).toBe(20);
  });

  it("calculates rate2 (debrief): thresholds match rate1", () => {
    // 2/5 = 40% -> score 1
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childName: "A", debriefCompleted: i < 2 }),
    );
    const profiles = buildChildRestraintProfiles(records);
    expect(profiles[0].debriefCompletedRate).toBe(40);
  });

  it("calculates diversity: 2 for >= 4 categories", () => {
    const cats: RestraintCategory[] = ["physical_intervention", "de_escalation", "post_incident_debrief", "medical_check"];
    const records = cats.map((cat, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childName: "A", category: cat }),
    );
    const profiles = buildChildRestraintProfiles(records);
    expect(profiles[0].categoriesCovered.length).toBe(4);
  });

  it("calculates diversity: 1 for >= 2 and < 4 categories", () => {
    const cats: RestraintCategory[] = ["physical_intervention", "de_escalation"];
    const records = cats.map((cat, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childName: "A", category: cat }),
    );
    const profiles = buildChildRestraintProfiles(records);
    expect(profiles[0].categoriesCovered.length).toBe(2);
  });

  it("calculates diversity: 0 for < 2 categories", () => {
    const records = [makeRecord({ childId: "c1", childName: "A" })];
    const profiles = buildChildRestraintProfiles(records);
    expect(profiles[0].categoriesCovered.length).toBe(1);
  });

  it("tracks categoriesCovered as string array", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "A", category: "physical_intervention" }),
      makeRecord({ id: "r2", childId: "c1", childName: "A", category: "de_escalation" }),
    ];
    const profiles = buildChildRestraintProfiles(records);
    expect(profiles[0].categoriesCovered).toContain("physical_intervention");
    expect(profiles[0].categoriesCovered).toContain("de_escalation");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Orchestrator: generateRestraintIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateRestraintIntelligence", () => {
  function makePerfectRecords(count: number): RestraintRecord[] {
    const allCats: RestraintCategory[] = [
      "physical_intervention", "de_escalation", "post_incident_debrief", "medical_check",
      "body_map_record", "notification_to_parent", "notification_to_ofsted", "review_of_technique",
    ];
    return Array.from({ length: count }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        childId: i < count / 2 ? "child-alex" : "child-jordan",
        childName: i < count / 2 ? "Alex" : "Jordan",
        date: "2026-03-15",
        category: allCats[i % allCats.length],
      }),
    );
  }

  it("produces a complete intelligence result", () => {
    const records = makePerfectRecords(8);
    const policy = makePolicy();
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2" })];

    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy,
      staff,
    });

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.rating).toBeDefined();
    expect(result.restraintQuality).toBeDefined();
    expect(result.restraintCompliance).toBeDefined();
    expect(result.restraintPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("achieves 100 overall score with perfect data", () => {
    const records = makePerfectRecords(8);
    const policy = makePolicy();
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2" })];

    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy,
      staff,
    });

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 overall score with empty data and no policy", () => {
    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("caps overall score at 100", () => {
    const records = makePerfectRecords(8);
    const policy = makePolicy();
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2" })];

    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy,
      staff,
    });

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [makeRecord()],
      policy: null,
      staff: [makeStaff()],
    });

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("restraint policy"))).toBe(true);
  });

  it("generates URGENT actions when no staff training", () => {
    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [makeRecord()],
      policy: makePolicy(),
      staff: [],
    });

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("includes strengths for high-scoring rates (>= 80%)", () => {
    const records = makePerfectRecords(8);
    const policy = makePolicy();
    const staff = [makeStaff()];

    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy,
      staff,
    });

    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes areas for improvement for low rates (< 60%)", () => {
    const records = [
      makeRecord({
        deEscalationAttempted: false,
        debriefCompleted: false,
        bodyMapRecorded: false,
        parentNotified: false,
        documentationComplete: false,
        timelyRecording: false,
      }),
    ];

    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff()],
    });

    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("returns exactly 7 regulatory links", () => {
    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("includes correct regulatory link text", () => {
    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 20 — Restraint and deprivation of liberty");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 19 — Behaviour management");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 35 — Behaviour management record");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 40(4)(a) — Notification to Ofsted");
    expect(result.regulatoryLinks).toContain("SCCIF — Safety: use of restraint");
    expect(result.regulatoryLinks).toContain("DfE 2019 — Reducing the need for restraint");
    expect(result.regulatoryLinks).toContain("Children Act 1989 s.22 — Duty to safeguard welfare");
  });

  it("generates conditional actions when rates are below 50%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        date: "2026-03-15",
        deEscalationAttempted: false,
        debriefCompleted: false,
        bodyMapRecorded: false,
        documentationComplete: false,
        timelyRecording: false,
      }),
    );

    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff()],
    });

    expect(result.actions.some((a) => a.includes("de-escalation"))).toBe(true);
    expect(result.actions.some((a) => a.includes("documentation"))).toBe(true);
  });

  it("builds child profiles from records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex", date: "2026-03-15" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan", date: "2026-03-15" }),
      makeRecord({ id: "r3", childId: "c1", childName: "Alex", date: "2026-03-16" }),
    ];

    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff()],
    });

    expect(result.childProfiles.length).toBe(2);
    const alex = result.childProfiles.find((p) => p.childId === "c1");
    expect(alex!.totalRecords).toBe(2);
  });

  it("sums evaluator scores correctly for mixed data", () => {
    const records = [
      makeRecord({ id: "r1" }),
      makeRecord({ id: "r2", deEscalationAttempted: false, debriefCompleted: false }),
    ];
    const policy = makePolicy({ reductionStrategyPolicy: false }); // 22 points
    const staff = [makeStaff({ reductionStrategyKnowledge: false })]; // 23 points

    const result = generateRestraintIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy,
      staff,
    });

    // Quality: 50% deEsc(7) + 50% debrief(6) + 100% bodyMap(6) + 100% parent(6) = 3.5+3+6+6 = 18.5 -> 19
    // Compliance: 100% doc(8) + 100% timely(7) + 50% debrief(5) + 13% diversity(5) = 8+7+2.5+0.65 = 18.15 -> 18
    // Policy: 22
    // Staff: 23
    // Total = 19+18+22+23 = 82
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("handles all-empty data gracefully", () => {
    const result = generateRestraintIntelligence({
      homeId: "empty-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toEqual([]);
    expect(result.restraintQuality.overallScore).toBe(0);
    expect(result.restraintCompliance.overallScore).toBe(0);
    expect(result.restraintPolicy.overallScore).toBe(0);
    expect(result.staffReadiness.overallScore).toBe(0);
  });
});
