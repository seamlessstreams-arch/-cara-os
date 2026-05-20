import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getBehaviourCategoryLabel,
  getBehaviourOutcomeLabel,
  getRatingLabel,
  evaluateBehaviourQuality,
  evaluateBehaviourCompliance,
  evaluateBehaviourPolicy,
  evaluateStaffBehaviourReadiness,
  buildChildBehaviourProfiles,
  generateBehaviourIntelligence,
} from "../behaviour-engine";
import type {
  BehaviourRecord,
  BehaviourPolicy,
  StaffBehaviourTraining,
} from "../behaviour-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<BehaviourRecord> = {}): BehaviourRecord {
  return {
    id: "rec-1",
    childId: "child-1",
    childName: "Test Child",
    recordDate: "2026-03-15",
    category: "positive_reinforcement",
    positiveApproachUsed: true,
    deEscalationAttempted: true,
    childViewCaptured: true,
    supportPlanFollowed: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<BehaviourPolicy> = {}): BehaviourPolicy {
  return {
    id: "pol-1",
    behaviourManagementPolicy: true,
    positiveReinforcementFramework: true,
    deEscalationProtocol: true,
    restraintReductionPlan: true,
    childParticipationGuidance: true,
    debriefingProcedure: true,
    reviewSchedule: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffBehaviourTraining> = {}): StaffBehaviourTraining {
  return {
    id: "t-1",
    staffId: "staff-1",
    staffName: "Test Staff",
    positiveApproaches: true,
    deEscalationSkills: true,
    traumaInformedPractice: true,
    restorativePractice: true,
    riskAssessment: true,
    recordKeeping: true,
    ...overrides,
  };
}

// ── pct ────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });
  it("returns 100 for equal num and den", () => {
    expect(pct(10, 10)).toBe(100);
  });
  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });
  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
  it("returns 0 for 0 numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("returns good for >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("returns requires_improvement for >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("returns inadequate for < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ── Label Helpers ──────────────────────────────────────────────────────────

describe("getBehaviourCategoryLabel", () => {
  it("returns human-readable labels", () => {
    expect(getBehaviourCategoryLabel("positive_reinforcement")).toBe("Positive Reinforcement");
    expect(getBehaviourCategoryLabel("de_escalation")).toBe("De-escalation");
    expect(getBehaviourCategoryLabel("behaviour_support_plan")).toBe("Behaviour Support Plan");
    expect(getBehaviourCategoryLabel("restorative_practice")).toBe("Restorative Practice");
    expect(getBehaviourCategoryLabel("risk_assessment")).toBe("Risk Assessment");
    expect(getBehaviourCategoryLabel("therapeutic_intervention")).toBe("Therapeutic Intervention");
    expect(getBehaviourCategoryLabel("staff_debriefing")).toBe("Staff Debriefing");
    expect(getBehaviourCategoryLabel("child_consultation")).toBe("Child Consultation");
  });
});

describe("getBehaviourOutcomeLabel", () => {
  it("returns human-readable labels", () => {
    expect(getBehaviourOutcomeLabel("successful")).toBe("Successful");
    expect(getBehaviourOutcomeLabel("partially_successful")).toBe("Partially Successful");
    expect(getBehaviourOutcomeLabel("unsuccessful")).toBe("Unsuccessful");
    expect(getBehaviourOutcomeLabel("escalated")).toBe("Escalated");
    expect(getBehaviourOutcomeLabel("ongoing")).toBe("Ongoing");
  });
});

describe("getRatingLabel", () => {
  it("formats rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── Evaluator 1: Behaviour Quality ─────────────────────────────────────────

describe("evaluateBehaviourQuality", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateBehaviourQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalRecords).toBe(0);
    expect(result.positiveApproachRate).toBe(0);
    expect(result.deEscalationRate).toBe(0);
    expect(result.childViewRate).toBe(0);
    expect(result.supportPlanRate).toBe(0);
  });

  it("returns max score for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2" })];
    const result = evaluateBehaviourQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalRecords).toBe(2);
    expect(result.positiveApproachRate).toBe(100);
    expect(result.deEscalationRate).toBe(100);
    expect(result.childViewRate).toBe(100);
    expect(result.supportPlanRate).toBe(100);
  });

  it("returns 0 score for all-false records", () => {
    const records = [makeRecord({ positiveApproachUsed: false, deEscalationAttempted: false, childViewCaptured: false, supportPlanFollowed: false })];
    const result = evaluateBehaviourQuality(records);
    expect(result.overallScore).toBe(0);
    expect(result.positiveApproachRate).toBe(0);
  });

  it("calculates mixed rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", positiveApproachUsed: true, deEscalationAttempted: true, childViewCaptured: false, supportPlanFollowed: false }),
      makeRecord({ id: "r2", positiveApproachUsed: true, deEscalationAttempted: false, childViewCaptured: true, supportPlanFollowed: false }),
    ];
    const result = evaluateBehaviourQuality(records);
    expect(result.positiveApproachRate).toBe(100);
    expect(result.deEscalationRate).toBe(50);
    expect(result.childViewRate).toBe(50);
    expect(result.supportPlanRate).toBe(0);
  });

  it("applies correct weights (7+6+6+6=25)", () => {
    // All rates at 100% → raw = 7+6+6+6 = 25
    const records = [makeRecord()];
    const result = evaluateBehaviourQuality(records);
    expect(result.overallScore).toBe(25);

    // Only positiveApproachRate at 100% → raw = 7
    const records2 = [makeRecord({ deEscalationAttempted: false, childViewCaptured: false, supportPlanFollowed: false })];
    const result2 = evaluateBehaviourQuality(records2);
    expect(result2.overallScore).toBe(7);
  });

  it("caps score at 25", () => {
    const records = [makeRecord()];
    const result = evaluateBehaviourQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── Evaluator 2: Behaviour Compliance ──────────────────────────────────────

describe("evaluateBehaviourCompliance", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateBehaviourCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.supportPlanFollowedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
  });

  it("calculates documentation and timely rates", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "r2", documentationComplete: true, timelyRecording: false }),
      makeRecord({ id: "r3", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluateBehaviourCompliance(records);
    expect(result.documentationRate).toBe(67);
    expect(result.timelyRecordingRate).toBe(33);
  });

  it("calculates category diversity correctly", () => {
    // 1 out of 8 categories → 13%
    const records = [makeRecord({ category: "positive_reinforcement" })];
    const result = evaluateBehaviourCompliance(records);
    expect(result.categoryDiversityRatio).toBe(13);
  });

  it("returns high diversity for many categories", () => {
    const categories: Array<BehaviourRecord["category"]> = [
      "positive_reinforcement", "de_escalation", "behaviour_support_plan",
      "restorative_practice", "risk_assessment", "therapeutic_intervention",
      "staff_debriefing", "child_consultation",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateBehaviourCompliance(records);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("applies correct weights (8+7+5+5=25)", () => {
    // All rates at 100%, all 8 categories → documentationRate=100, timelyRecordingRate=100, supportPlanFollowedRate=100, diversity=100
    const categories: Array<BehaviourRecord["category"]> = [
      "positive_reinforcement", "de_escalation", "behaviour_support_plan",
      "restorative_practice", "risk_assessment", "therapeutic_intervention",
      "staff_debriefing", "child_consultation",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateBehaviourCompliance(records);
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for all-false compliance indicators", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, supportPlanFollowed: false })];
    const result = evaluateBehaviourCompliance(records);
    // Only diversity counts: 1/8 = 13% → 0.13 * 5 = 0.65 → rounds to 1
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.supportPlanFollowedRate).toBe(0);
  });
});

// ── Evaluator 3: Behaviour Policy ──────────────────────────────────────────

describe("evaluateBehaviourPolicy", () => {
  it("returns zeros for null policy", () => {
    const result = evaluateBehaviourPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.behaviourManagementPolicy).toBe(false);
    expect(result.positiveReinforcementFramework).toBe(false);
    expect(result.deEscalationProtocol).toBe(false);
    expect(result.restraintReductionPlan).toBe(false);
    expect(result.childParticipationGuidance).toBe(false);
    expect(result.debriefingProcedure).toBe(false);
    expect(result.reviewSchedule).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateBehaviourPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateBehaviourPolicy(makePolicy({
      behaviourManagementPolicy: false,
      positiveReinforcementFramework: false,
      deEscalationProtocol: false,
      restraintReductionPlan: false,
      childParticipationGuidance: false,
      debriefingProcedure: false,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("weights first 4 at 4 points each", () => {
    // Only first policy true → 4
    const result = evaluateBehaviourPolicy(makePolicy({
      behaviourManagementPolicy: true,
      positiveReinforcementFramework: false,
      deEscalationProtocol: false,
      restraintReductionPlan: false,
      childParticipationGuidance: false,
      debriefingProcedure: false,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights last 3 at 3 points each", () => {
    // Only last 3 true → 3+3+3=9
    const result = evaluateBehaviourPolicy(makePolicy({
      behaviourManagementPolicy: false,
      positiveReinforcementFramework: false,
      deEscalationProtocol: false,
      restraintReductionPlan: false,
      childParticipationGuidance: true,
      debriefingProcedure: true,
      reviewSchedule: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("handles partial policy", () => {
    // First 4 true → 16, last 3 false → 0, total 16
    const result = evaluateBehaviourPolicy(makePolicy({
      childParticipationGuidance: false,
      debriefingProcedure: false,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(16);
  });
});

// ── Evaluator 4: Staff Readiness ───────────────────────────────────────────

describe("evaluateStaffBehaviourReadiness", () => {
  it("returns zeros for empty staff", () => {
    const result = evaluateStaffBehaviourReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalStaff).toBe(0);
    expect(result.positiveApproachesRate).toBe(0);
    expect(result.deEscalationSkillsRate).toBe(0);
    expect(result.traumaInformedRate).toBe(0);
    expect(result.restorativePracticeRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.recordKeepingRate).toBe(0);
  });

  it("returns max score for all-true staff", () => {
    const staff = [makeTraining(), makeTraining({ id: "t-2", staffId: "staff-2" })];
    const result = evaluateStaffBehaviourReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false staff", () => {
    const staff = [makeTraining({
      positiveApproaches: false,
      deEscalationSkills: false,
      traumaInformedPractice: false,
      restorativePractice: false,
      riskAssessment: false,
      recordKeeping: false,
    })];
    const result = evaluateStaffBehaviourReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("applies correct weights (6+5+5+4+3+2=25)", () => {
    // Only positiveApproaches true → raw = 6, score 6
    const staff = [makeTraining({
      deEscalationSkills: false,
      traumaInformedPractice: false,
      restorativePractice: false,
      riskAssessment: false,
      recordKeeping: false,
    })];
    const result = evaluateStaffBehaviourReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("calculates mixed rates correctly", () => {
    const staff = [
      makeTraining({ id: "t-1", positiveApproaches: true, deEscalationSkills: true, traumaInformedPractice: false, restorativePractice: false, riskAssessment: false, recordKeeping: false }),
      makeTraining({ id: "t-2", staffId: "staff-2", positiveApproaches: true, deEscalationSkills: false, traumaInformedPractice: true, restorativePractice: false, riskAssessment: false, recordKeeping: false }),
    ];
    const result = evaluateStaffBehaviourReadiness(staff);
    expect(result.positiveApproachesRate).toBe(100);
    expect(result.deEscalationSkillsRate).toBe(50);
    expect(result.traumaInformedRate).toBe(50);
    expect(result.restorativePracticeRate).toBe(0);
  });
});

// ── Child Profiles ─────────────────────────────────────────────────────────

describe("buildChildBehaviourProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildBehaviourProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildBehaviourProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "c1")?.totalRecords).toBe(2);
    expect(profiles.find((p) => p.childId === "c2")?.totalRecords).toBe(1);
  });

  it("scores frequency: >=10 → 2, >=5 → 1, <5 → 0", () => {
    const recs10 = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", positiveApproachUsed: false, childViewCaptured: false }),
    );
    const profiles10 = buildChildBehaviourProfiles(recs10);
    // freq=2, rate1(0%)=0, rate2(0%)=0, diversity(1cat)=0 → score=2
    expect(profiles10[0].overallScore).toBe(2);

    const recs5 = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", positiveApproachUsed: false, childViewCaptured: false }),
    );
    const profiles5 = buildChildBehaviourProfiles(recs5);
    expect(profiles5[0].overallScore).toBe(1);

    const recs3 = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", positiveApproachUsed: false, childViewCaptured: false }),
    );
    const profiles3 = buildChildBehaviourProfiles(recs3);
    expect(profiles3[0].overallScore).toBe(0);
  });

  it("scores rate1 (positiveApproachRate): >=80→3, >=60→2, >=40→1, <40→0", () => {
    // 5 records, 4 positive → 80% → 3 points
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", positiveApproachUsed: i < 4, childViewCaptured: false }),
    );
    const profiles = buildChildBehaviourProfiles(recs);
    // freq=1, rate1(80%)=3, rate2(0%)=0, diversity(1cat)=0 → 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("scores diversity: >=4 → 2, >=2 → 1, <2 → 0", () => {
    const categories: Array<BehaviourRecord["category"]> = [
      "positive_reinforcement", "de_escalation", "behaviour_support_plan", "restorative_practice",
    ];
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: cat, positiveApproachUsed: false, childViewCaptured: false }),
    );
    const profiles = buildChildBehaviourProfiles(recs);
    // freq(4)=0, rate1(0%)=0, rate2(0%)=0, diversity(4)=2 → 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("caps at 10", () => {
    // 10 records, all true, 4+ categories → freq=2, rate1=3, rate2=3, diversity=2 → 10
    const categories: Array<BehaviourRecord["category"]> = [
      "positive_reinforcement", "de_escalation", "behaviour_support_plan", "restorative_practice",
    ];
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: categories[i % 4] }),
    );
    const profiles = buildChildBehaviourProfiles(recs);
    expect(profiles[0].overallScore).toBe(10);
  });
});

// ── Additional Quality Edge Cases ──────────────────────────────────────────

describe("evaluateBehaviourQuality — additional", () => {
  it("single record with only deEscalation true gives weight-6 score", () => {
    const records = [makeRecord({ positiveApproachUsed: false, childViewCaptured: false, supportPlanFollowed: false })];
    const result = evaluateBehaviourQuality(records);
    expect(result.overallScore).toBe(6);
    expect(result.deEscalationRate).toBe(100);
  });

  it("rating maps correctly from score * 4", () => {
    // Score 20 → 80 → outstanding
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}` }),
    );
    const result = evaluateBehaviourQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
  });

  it("handles large record sets", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ id: `r-${i}`, positiveApproachUsed: i % 2 === 0 }),
    );
    const result = evaluateBehaviourQuality(records);
    expect(result.positiveApproachRate).toBe(50);
    expect(result.totalRecords).toBe(100);
  });
});

// ── Additional Compliance Edge Cases ──────────────────────────────────────

describe("evaluateBehaviourCompliance — additional", () => {
  it("two categories gives 25% diversity", () => {
    const records = [
      makeRecord({ id: "r1", category: "positive_reinforcement" }),
      makeRecord({ id: "r2", category: "de_escalation" }),
    ];
    const result = evaluateBehaviourCompliance(records);
    expect(result.categoryDiversityRatio).toBe(25);
  });

  it("all compliance false with single category", () => {
    const records = [makeRecord({
      documentationComplete: false,
      timelyRecording: false,
      supportPlanFollowed: false,
    })];
    const result = evaluateBehaviourCompliance(records);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.supportPlanFollowedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(13);
    // raw = 0 + 0 + 0 + 0.13*5 = 0.65 → rounds to 1
    expect(result.overallScore).toBe(1);
  });
});

// ── Additional Policy Edge Cases ──────────────────────────────────────────

describe("evaluateBehaviourPolicy — additional", () => {
  it("single middle policy gives 4 points", () => {
    const result = evaluateBehaviourPolicy(makePolicy({
      behaviourManagementPolicy: false,
      positiveReinforcementFramework: false,
      deEscalationProtocol: true,
      restraintReductionPlan: false,
      childParticipationGuidance: false,
      debriefingProcedure: false,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("preserves boolean values in result", () => {
    const result = evaluateBehaviourPolicy(makePolicy({
      behaviourManagementPolicy: true,
      positiveReinforcementFramework: false,
    }));
    expect(result.behaviourManagementPolicy).toBe(true);
    expect(result.positiveReinforcementFramework).toBe(false);
  });

  it("rating for partial policy (score=16 → 64 → good)", () => {
    const result = evaluateBehaviourPolicy(makePolicy({
      childParticipationGuidance: false,
      debriefingProcedure: false,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(16);
    expect(result.rating).toBe("good");
  });
});

// ── Additional Staff Edge Cases ───────────────────────────────────────────

describe("evaluateStaffBehaviourReadiness — additional", () => {
  it("only recordKeeping true gives weight-2 score", () => {
    const staff = [makeTraining({
      positiveApproaches: false,
      deEscalationSkills: false,
      traumaInformedPractice: false,
      restorativePractice: false,
      riskAssessment: false,
      recordKeeping: true,
    })];
    const result = evaluateStaffBehaviourReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("3 staff with mixed skills", () => {
    const staff = [
      makeTraining({ id: "t-1", staffId: "s1" }),
      makeTraining({ id: "t-2", staffId: "s2", positiveApproaches: false, deEscalationSkills: false }),
      makeTraining({ id: "t-3", staffId: "s3", traumaInformedPractice: false, restorativePractice: false, riskAssessment: false, recordKeeping: false }),
    ];
    const result = evaluateStaffBehaviourReadiness(staff);
    expect(result.totalStaff).toBe(3);
    expect(result.positiveApproachesRate).toBe(67);
    expect(result.deEscalationSkillsRate).toBe(67);
  });
});

// ── Additional Child Profile Edge Cases ───────────────────────────────────

describe("buildChildBehaviourProfiles — additional", () => {
  it("rate2 (childViewRate) scoring: 60% → 2 points", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", positiveApproachUsed: false, childViewCaptured: i < 3 }),
    );
    const profiles = buildChildBehaviourProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(60%)=2, diversity(1)=0 → 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("rate2 (childViewRate) scoring: 40% → 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", positiveApproachUsed: false, childViewCaptured: i < 2 }),
    );
    const profiles = buildChildBehaviourProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(40%)=1, diversity(1)=0 → 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("2 categories gives diversity 1", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", category: "positive_reinforcement", positiveApproachUsed: false, childViewCaptured: false }),
      makeRecord({ id: "r2", childId: "c1", category: "de_escalation", positiveApproachUsed: false, childViewCaptured: false }),
    ];
    const profiles = buildChildBehaviourProfiles(recs);
    // freq(2)=0, rate1(0%)=0, rate2(0%)=0, diversity(2)=1 → 1
    expect(profiles[0].overallScore).toBe(1);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });

  it("preserves child name from first record", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex Updated" }),
    ];
    const profiles = buildChildBehaviourProfiles(recs);
    expect(profiles[0].childName).toBe("Alex");
  });
});

// ── Master Generator ───────────────────────────────────────────────────────

describe("generateBehaviourIntelligence", () => {
  it("returns correct structure with all data", () => {
    const records = [makeRecord()];
    const result = generateBehaviourIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.rating).toBeDefined();
    expect(result.behaviourQuality).toBeDefined();
    expect(result.behaviourCompliance).toBeDefined();
    expect(result.behaviourPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("sums 4 evaluator scores", () => {
    const records = [makeRecord()];
    const result = generateBehaviourIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    const expectedTotal = result.behaviourQuality.overallScore + result.behaviourCompliance.overallScore + result.behaviourPolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, expectedTotal));
  });

  it("caps overall score at 100", () => {
    const records = [makeRecord()];
    const result = generateBehaviourIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns outstanding for high scores", () => {
    const categories: Array<BehaviourRecord["category"]> = [
      "positive_reinforcement", "de_escalation", "behaviour_support_plan",
      "restorative_practice", "risk_assessment", "therapeutic_intervention",
      "staff_debriefing", "child_consultation",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateBehaviourIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate for empty data", () => {
    const result = generateBehaviourIntelligence([], null, [], "h", "s", "e");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for metrics >= 80%", () => {
    const categories: Array<BehaviourRecord["category"]> = [
      "positive_reinforcement", "de_escalation", "behaviour_support_plan",
      "restorative_practice", "risk_assessment", "therapeutic_intervention",
      "staff_debriefing", "child_consultation",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateBehaviourIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for metrics < 60%", () => {
    const records = [makeRecord({
      positiveApproachUsed: false,
      deEscalationAttempted: false,
      childViewCaptured: false,
      supportPlanFollowed: false,
      documentationComplete: false,
      timelyRecording: false,
    })];
    const result = generateBehaviourIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions when policy score is 0", () => {
    const result = generateBehaviourIntelligence([makeRecord()], null, [makeTraining()], "h", "s", "e");
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT actions when staff score is 0", () => {
    const result = generateBehaviourIntelligence([makeRecord()], makePolicy(), [], "h", "s", "e");
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates actions for low metrics (<50%)", () => {
    const records = [makeRecord({
      positiveApproachUsed: false,
      deEscalationAttempted: false,
      childViewCaptured: false,
      documentationComplete: false,
      timelyRecording: false,
    })];
    const staff = [makeTraining({ traumaInformedPractice: false })];
    const result = generateBehaviourIntelligence(records, makePolicy(), staff, "h", "s", "e");
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("builds child profiles from records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
    ];
    const result = generateBehaviourIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.childProfiles).toHaveLength(2);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateBehaviourIntelligence([], null, [], "h", "s", "e");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("Reg 19");
  });

  it("no strengths when all metrics are low", () => {
    const records = [makeRecord({
      positiveApproachUsed: false,
      deEscalationAttempted: false,
      childViewCaptured: false,
      supportPlanFollowed: false,
      documentationComplete: false,
      timelyRecording: false,
    })];
    const staff = [makeTraining({
      positiveApproaches: false,
      deEscalationSkills: false,
      traumaInformedPractice: false,
      restorativePractice: false,
      riskAssessment: false,
      recordKeeping: false,
    })];
    const result = generateBehaviourIntelligence(records, null, staff, "h", "s", "e");
    expect(result.strengths).toHaveLength(0);
  });

  it("no areas for improvement when all metrics high", () => {
    const categories: Array<BehaviourRecord["category"]> = [
      "positive_reinforcement", "de_escalation", "behaviour_support_plan",
      "restorative_practice", "risk_assessment", "therapeutic_intervention",
      "staff_debriefing", "child_consultation",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateBehaviourIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.areasForImprovement).toHaveLength(0);
  });

  it("empty childProfiles when no records", () => {
    const result = generateBehaviourIntelligence([], makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.childProfiles).toHaveLength(0);
  });
});
