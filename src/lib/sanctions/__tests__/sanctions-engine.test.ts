// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Sanctions Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  getSanctionTypeLabel,
  getSanctionOutcomeLabel,
  getRatingLabel,
  pct,
  getRating,
  evaluateSanctionQuality,
  evaluateSanctionCompliance,
  evaluateSanctionPolicy,
  evaluateStaffSanctionReadiness,
  buildChildSanctionProfiles,
  generateSanctionsIntelligence,
} from "../sanctions-engine";
import type {
  SanctionRecord,
  SanctionPolicy,
  StaffSanctionTraining,
} from "../sanctions-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const makeRecord = (overrides: Partial<SanctionRecord> = {}): SanctionRecord => ({
  id: "san-001",
  childId: "child-alex",
  childName: "Alex",
  sanctionDate: "2026-03-15",
  sanctionType: "loss_of_privilege",
  outcome: "accepted_by_child",
  proportionateToIncident: true,
  childViewsRecorded: true,
  parentNotified: true,
  documentedProperly: true,
  staffApplied: true,
  reviewScheduled: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<SanctionPolicy> = {}): SanctionPolicy => ({
  id: "pol-001",
  behaviourManagementPolicy: true,
  sanctionsGuidance: true,
  prohibitedSanctionsList: true,
  childParticipationProcess: true,
  complaintsMechanism: true,
  restorativeApproach: true,
  regularReview: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffSanctionTraining> = {}): StaffSanctionTraining => ({
  id: "tr-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  behaviourManagement: true,
  proportionalityAssessment: true,
  restorativeApproach: true,
  childRightsAwareness: true,
  documentationSkills: true,
  deEscalationFirst: true,
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getSanctionTypeLabel", () => {
  it("returns correct label for loss_of_privilege", () => {
    expect(getSanctionTypeLabel("loss_of_privilege")).toBe("Loss of Privilege");
  });

  it("returns correct label for additional_chore", () => {
    expect(getSanctionTypeLabel("additional_chore")).toBe("Additional Chore");
  });

  it("returns correct label for earlier_bedtime", () => {
    expect(getSanctionTypeLabel("earlier_bedtime")).toBe("Earlier Bedtime");
  });

  it("returns correct label for restricted_screen_time", () => {
    expect(getSanctionTypeLabel("restricted_screen_time")).toBe("Restricted Screen Time");
  });

  it("returns correct label for grounding", () => {
    expect(getSanctionTypeLabel("grounding")).toBe("Grounding");
  });

  it("returns correct label for verbal_warning", () => {
    expect(getSanctionTypeLabel("verbal_warning")).toBe("Verbal Warning");
  });

  it("returns correct label for written_warning", () => {
    expect(getSanctionTypeLabel("written_warning")).toBe("Written Warning");
  });

  it("returns correct label for restorative_task", () => {
    expect(getSanctionTypeLabel("restorative_task")).toBe("Restorative Task");
  });
});

describe("getSanctionOutcomeLabel", () => {
  it("returns correct label for accepted_by_child", () => {
    expect(getSanctionOutcomeLabel("accepted_by_child")).toBe("Accepted by Child");
  });

  it("returns correct label for disputed_by_child", () => {
    expect(getSanctionOutcomeLabel("disputed_by_child")).toBe("Disputed by Child");
  });

  it("returns correct label for escalated", () => {
    expect(getSanctionOutcomeLabel("escalated")).toBe("Escalated");
  });

  it("returns correct label for not_recorded", () => {
    expect(getSanctionOutcomeLabel("not_recorded")).toBe("Not Recorded");
  });

  it("returns correct label for partially_accepted", () => {
    expect(getSanctionOutcomeLabel("partially_accepted")).toBe("Partially Accepted");
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
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates percentage correctly", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(7, 7)).toBe(100);
  });

  it("returns 0 for zero numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

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
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. Evaluate Sanction Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSanctionQuality", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateSanctionQuality([]);
    expect(result.totalRecords).toBe(0);
    expect(result.proportionateRate).toBe(0);
    expect(result.childViewsRate).toBe(0);
    expect(result.acceptanceRate).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores maximum 25 for perfect records", () => {
    const records = [makeRecord(), makeRecord({ id: "san-002" })];
    const result = evaluateSanctionQuality(records);
    expect(result.totalRecords).toBe(2);
    expect(result.proportionateRate).toBe(100);
    expect(result.childViewsRate).toBe(100);
    expect(result.acceptanceRate).toBe(100);
    expect(result.documentedRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("calculates proportionate rate correctly", () => {
    const records = [
      makeRecord({ proportionateToIncident: true }),
      makeRecord({ id: "san-002", proportionateToIncident: false }),
    ];
    const result = evaluateSanctionQuality(records);
    expect(result.proportionateRate).toBe(50);
  });

  it("calculates child views rate correctly", () => {
    const records = [
      makeRecord({ childViewsRecorded: true }),
      makeRecord({ id: "san-002", childViewsRecorded: false }),
      makeRecord({ id: "san-003", childViewsRecorded: false }),
    ];
    const result = evaluateSanctionQuality(records);
    expect(result.childViewsRate).toBe(33);
  });

  it("calculates acceptance rate — only accepted_by_child counts", () => {
    const records = [
      makeRecord({ outcome: "accepted_by_child" }),
      makeRecord({ id: "san-002", outcome: "disputed_by_child" }),
      makeRecord({ id: "san-003", outcome: "partially_accepted" }),
      makeRecord({ id: "san-004", outcome: "escalated" }),
    ];
    const result = evaluateSanctionQuality(records);
    expect(result.acceptanceRate).toBe(25);
  });

  it("calculates documented rate correctly", () => {
    const records = [
      makeRecord({ documentedProperly: true }),
      makeRecord({ id: "san-002", documentedProperly: false }),
    ];
    const result = evaluateSanctionQuality(records);
    expect(result.documentedRate).toBe(50);
  });

  it("scores 0 when all metrics are zero", () => {
    const records = [
      makeRecord({
        proportionateToIncident: false,
        childViewsRecorded: false,
        outcome: "not_recorded",
        documentedProperly: false,
      }),
    ];
    const result = evaluateSanctionQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("never exceeds 25", () => {
    const records = Array.from({ length: 20 }, (_, i) => makeRecord({ id: `san-${i}` }));
    const result = evaluateSanctionQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Evaluate Sanction Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSanctionCompliance", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateSanctionCompliance([]);
    expect(result.totalRecords).toBe(0);
    expect(result.parentNotifiedRate).toBe(0);
    expect(result.staffAppliedRate).toBe(0);
    expect(result.reviewScheduledRate).toBe(0);
    expect(result.typeDiversityRatio).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores maximum 25 for perfect compliance with full type diversity", () => {
    const allTypes = [
      "loss_of_privilege", "additional_chore", "earlier_bedtime",
      "restricted_screen_time", "grounding", "verbal_warning",
      "written_warning", "restorative_task",
    ] as const;
    const records = allTypes.map((type, i) =>
      makeRecord({ id: `san-${i}`, sanctionType: type }),
    );
    const result = evaluateSanctionCompliance(records);
    expect(result.parentNotifiedRate).toBe(100);
    expect(result.staffAppliedRate).toBe(100);
    expect(result.reviewScheduledRate).toBe(100);
    expect(result.typeDiversityRatio).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("calculates parent notified rate correctly", () => {
    const records = [
      makeRecord({ parentNotified: true }),
      makeRecord({ id: "san-002", parentNotified: false }),
    ];
    const result = evaluateSanctionCompliance(records);
    expect(result.parentNotifiedRate).toBe(50);
  });

  it("calculates staff applied rate correctly", () => {
    const records = [
      makeRecord({ staffApplied: true }),
      makeRecord({ id: "san-002", staffApplied: false }),
      makeRecord({ id: "san-003", staffApplied: false }),
    ];
    const result = evaluateSanctionCompliance(records);
    expect(result.staffAppliedRate).toBe(33);
  });

  it("calculates review scheduled rate correctly", () => {
    const records = [
      makeRecord({ reviewScheduled: true }),
      makeRecord({ id: "san-002", reviewScheduled: false }),
    ];
    const result = evaluateSanctionCompliance(records);
    expect(result.reviewScheduledRate).toBe(50);
  });

  it("calculates type diversity correctly for single type", () => {
    const records = [
      makeRecord({ sanctionType: "grounding" }),
      makeRecord({ id: "san-002", sanctionType: "grounding" }),
    ];
    const result = evaluateSanctionCompliance(records);
    // 1 unique type / 8 total = 12.5% -> rounds to 13
    expect(result.typeDiversityRatio).toBe(13);
  });

  it("calculates type diversity correctly for multiple types", () => {
    const records = [
      makeRecord({ sanctionType: "grounding" }),
      makeRecord({ id: "san-002", sanctionType: "verbal_warning" }),
      makeRecord({ id: "san-003", sanctionType: "loss_of_privilege" }),
      makeRecord({ id: "san-004", sanctionType: "restorative_task" }),
    ];
    const result = evaluateSanctionCompliance(records);
    // 4 unique / 8 total = 50%
    expect(result.typeDiversityRatio).toBe(50);
  });

  it("scores 0 when all metrics are zero", () => {
    const records = [
      makeRecord({
        parentNotified: false,
        staffApplied: false,
        reviewScheduled: false,
      }),
    ];
    // Single type = 13% diversity, gives Math.round(0.13 * 5) = 1
    const result = evaluateSanctionCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(1);
  });

  it("never exceeds 25", () => {
    const records = Array.from({ length: 20 }, (_, i) => makeRecord({ id: `san-${i}` }));
    const result = evaluateSanctionCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Evaluate Sanction Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSanctionPolicy", () => {
  it("returns all false and score 0 for null policy", () => {
    const result = evaluateSanctionPolicy(null);
    expect(result.behaviourManagementPolicy).toBe(false);
    expect(result.sanctionsGuidance).toBe(false);
    expect(result.prohibitedSanctionsList).toBe(false);
    expect(result.childParticipationProcess).toBe(false);
    expect(result.complaintsMechanism).toBe(false);
    expect(result.restorativeApproach).toBe(false);
    expect(result.regularReview).toBe(false);
    expect(result.overallScore).toBe(0);
  });

  it("scores maximum 25 for all-true policy", () => {
    const result = evaluateSanctionPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("scores 4 for behaviour management policy only", () => {
    const result = evaluateSanctionPolicy(
      makePolicy({
        behaviourManagementPolicy: true,
        sanctionsGuidance: false,
        prohibitedSanctionsList: false,
        childParticipationProcess: false,
        complaintsMechanism: false,
        restorativeApproach: false,
        regularReview: false,
      }),
    );
    expect(result.overallScore).toBe(4);
  });

  it("scores 4 for sanctions guidance only", () => {
    const result = evaluateSanctionPolicy(
      makePolicy({
        behaviourManagementPolicy: false,
        sanctionsGuidance: true,
        prohibitedSanctionsList: false,
        childParticipationProcess: false,
        complaintsMechanism: false,
        restorativeApproach: false,
        regularReview: false,
      }),
    );
    expect(result.overallScore).toBe(4);
  });

  it("scores 3 for complaints mechanism only", () => {
    const result = evaluateSanctionPolicy(
      makePolicy({
        behaviourManagementPolicy: false,
        sanctionsGuidance: false,
        prohibitedSanctionsList: false,
        childParticipationProcess: false,
        complaintsMechanism: true,
        restorativeApproach: false,
        regularReview: false,
      }),
    );
    expect(result.overallScore).toBe(3);
  });

  it("scores 16 for top 4 booleans (4+4+4+4)", () => {
    const result = evaluateSanctionPolicy(
      makePolicy({
        complaintsMechanism: false,
        restorativeApproach: false,
        regularReview: false,
      }),
    );
    expect(result.overallScore).toBe(16);
  });

  it("scores 0 for all-false policy", () => {
    const result = evaluateSanctionPolicy(
      makePolicy({
        behaviourManagementPolicy: false,
        sanctionsGuidance: false,
        prohibitedSanctionsList: false,
        childParticipationProcess: false,
        complaintsMechanism: false,
        restorativeApproach: false,
        regularReview: false,
      }),
    );
    expect(result.overallScore).toBe(0);
  });

  it("reflects individual boolean values in result", () => {
    const result = evaluateSanctionPolicy(
      makePolicy({
        behaviourManagementPolicy: true,
        sanctionsGuidance: false,
        prohibitedSanctionsList: true,
        childParticipationProcess: false,
        complaintsMechanism: true,
        restorativeApproach: false,
        regularReview: true,
      }),
    );
    expect(result.behaviourManagementPolicy).toBe(true);
    expect(result.sanctionsGuidance).toBe(false);
    expect(result.prohibitedSanctionsList).toBe(true);
    expect(result.childParticipationProcess).toBe(false);
    expect(result.complaintsMechanism).toBe(true);
    expect(result.restorativeApproach).toBe(false);
    expect(result.regularReview).toBe(true);
    // 4+0+4+0+3+0+3 = 14
    expect(result.overallScore).toBe(14);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Evaluate Staff Sanction Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffSanctionReadiness", () => {
  it("returns all zeros for empty training array", () => {
    const result = evaluateStaffSanctionReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.behaviourManagementRate).toBe(0);
    expect(result.proportionalityAssessmentRate).toBe(0);
    expect(result.restorativeApproachRate).toBe(0);
    expect(result.childRightsAwarenessRate).toBe(0);
    expect(result.documentationSkillsRate).toBe(0);
    expect(result.deEscalationFirstRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores maximum 25 for fully trained staff", () => {
    const training = [makeTraining(), makeTraining({ id: "tr-002", staffId: "staff-tom", staffName: "Tom Richards" })];
    const result = evaluateStaffSanctionReadiness(training);
    expect(result.totalStaff).toBe(2);
    expect(result.overallScore).toBe(25);
  });

  it("calculates behaviour management rate correctly", () => {
    const training = [
      makeTraining({ behaviourManagement: true }),
      makeTraining({ id: "tr-002", staffId: "staff-tom", staffName: "Tom", behaviourManagement: false }),
    ];
    const result = evaluateStaffSanctionReadiness(training);
    expect(result.behaviourManagementRate).toBe(50);
  });

  it("calculates proportionality assessment rate correctly", () => {
    const training = [
      makeTraining({ proportionalityAssessment: true }),
      makeTraining({ id: "tr-002", staffId: "staff-tom", staffName: "Tom", proportionalityAssessment: false }),
      makeTraining({ id: "tr-003", staffId: "staff-lisa", staffName: "Lisa", proportionalityAssessment: false }),
    ];
    const result = evaluateStaffSanctionReadiness(training);
    expect(result.proportionalityAssessmentRate).toBe(33);
  });

  it("scores 0 when no staff have any training", () => {
    const training = [
      makeTraining({
        behaviourManagement: false,
        proportionalityAssessment: false,
        restorativeApproach: false,
        childRightsAwareness: false,
        documentationSkills: false,
        deEscalationFirst: false,
      }),
    ];
    const result = evaluateStaffSanctionReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("never exceeds 25", () => {
    const training = Array.from({ length: 20 }, (_, i) =>
      makeTraining({ id: `tr-${i}`, staffId: `staff-${i}`, staffName: `Staff ${i}` }),
    );
    const result = evaluateStaffSanctionReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("weights behaviour management (6) higher than de-escalation (2)", () => {
    // Only behaviour management trained
    const bmOnly = [
      makeTraining({
        behaviourManagement: true,
        proportionalityAssessment: false,
        restorativeApproach: false,
        childRightsAwareness: false,
        documentationSkills: false,
        deEscalationFirst: false,
      }),
    ];
    const bmResult = evaluateStaffSanctionReadiness(bmOnly);

    // Only de-escalation trained
    const deOnly = [
      makeTraining({
        behaviourManagement: false,
        proportionalityAssessment: false,
        restorativeApproach: false,
        childRightsAwareness: false,
        documentationSkills: false,
        deEscalationFirst: true,
      }),
    ];
    const deResult = evaluateStaffSanctionReadiness(deOnly);

    expect(bmResult.overallScore).toBeGreaterThan(deResult.overallScore);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Build Child Sanction Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildSanctionProfiles", () => {
  it("returns empty array for no records", () => {
    const profiles = buildChildSanctionProfiles([]);
    expect(profiles).toHaveLength(0);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "san-002", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "san-003", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildSanctionProfiles(records);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(alex?.totalSanctions).toBe(2);
    expect(jordan?.totalSanctions).toBe(1);
  });

  it("scores 10 for a child with 1 perfect sanction", () => {
    const records = [makeRecord()];
    const profiles = buildChildSanctionProfiles(records);
    expect(profiles[0].sanctionScore).toBe(10);
    // freq=3 (1<=2), rate1=3 (100>=80), rate2=3 (100>=80), noEscalation=1
  });

  it("freq scoring: 2 sanctions gives freq=3", () => {
    const records = [
      makeRecord(),
      makeRecord({ id: "san-002" }),
    ];
    const profiles = buildChildSanctionProfiles(records);
    // freq=3, rate1=3, rate2=3, noEscalation=1 => 10, capped at 10
    expect(profiles[0].sanctionScore).toBe(10);
  });

  it("freq scoring: 5 sanctions gives freq=2", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `san-${i}` }));
    const profiles = buildChildSanctionProfiles(records);
    // freq=2, rate1=3, rate2=3, noEscalation=1 => 9
    expect(profiles[0].sanctionScore).toBe(9);
  });

  it("freq scoring: 8 sanctions gives freq=1", () => {
    const records = Array.from({ length: 8 }, (_, i) => makeRecord({ id: `san-${i}` }));
    const profiles = buildChildSanctionProfiles(records);
    // freq=1, rate1=3, rate2=3, noEscalation=1 => 8
    expect(profiles[0].sanctionScore).toBe(8);
  });

  it("freq scoring: 9 sanctions gives freq=0", () => {
    const records = Array.from({ length: 9 }, (_, i) => makeRecord({ id: `san-${i}` }));
    const profiles = buildChildSanctionProfiles(records);
    // freq=0, rate1=3, rate2=3, noEscalation=1 => 7
    expect(profiles[0].sanctionScore).toBe(7);
  });

  it("escalated outcome sets noEscalation to 0", () => {
    const records = [makeRecord({ outcome: "escalated" })];
    const profiles = buildChildSanctionProfiles(records);
    // freq=3, rate1=3, rate2=3, noEscalation=0 => 9
    expect(profiles[0].escalatedCount).toBe(1);
    expect(profiles[0].sanctionScore).toBe(9);
  });

  it("low proportionate rate gives lower rate1 score", () => {
    const records = [
      makeRecord({ proportionateToIncident: false }),
      makeRecord({ id: "san-002", proportionateToIncident: false }),
      makeRecord({ id: "san-003", proportionateToIncident: true }),
    ];
    const profiles = buildChildSanctionProfiles(records);
    // proportionateRate = 33%, rate1=0 (below 40)
    expect(profiles[0].proportionateRate).toBe(33);
  });

  it("collects unique sanction types", () => {
    const records = [
      makeRecord({ sanctionType: "grounding" }),
      makeRecord({ id: "san-002", sanctionType: "grounding" }),
      makeRecord({ id: "san-003", sanctionType: "verbal_warning" }),
    ];
    const profiles = buildChildSanctionProfiles(records);
    expect(profiles[0].sanctionTypes).toContain("grounding");
    expect(profiles[0].sanctionTypes).toContain("verbal_warning");
    expect(profiles[0].sanctionTypes).toHaveLength(2);
  });

  it("caps score at 10", () => {
    const records = [makeRecord()];
    const profiles = buildChildSanctionProfiles(records);
    expect(profiles[0].sanctionScore).toBeLessThanOrEqual(10);
  });

  it("rate2 uses childViewsRate thresholds correctly", () => {
    // 50% childViewsRate -> rate2=1 (>=40 but <60)
    const records = [
      makeRecord({ childViewsRecorded: true }),
      makeRecord({ id: "san-002", childViewsRecorded: false }),
    ];
    const profiles = buildChildSanctionProfiles(records);
    expect(profiles[0].childViewsRate).toBe(50);
    // freq=3 (2<=2), rate1=3 (100>=80 for proportionate), rate2=1 (50>=40), noEscalation=1 => 8
    expect(profiles[0].sanctionScore).toBe(8);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Generate Full Sanctions Intelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateSanctionsIntelligence", () => {
  it("returns complete result with all sections", () => {
    const records = [makeRecord()];
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateSanctionsIntelligence(records, policy, training, "oak-house", "2026-01-01", "2026-05-20");

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(typeof result.assessedAt).toBe("string");
    expect(typeof result.overallScore).toBe("number");
    expect(typeof result.rating).toBe("string");
    expect(result.sanctionQuality).toBeDefined();
    expect(result.sanctionCompliance).toBeDefined();
    expect(result.sanctionPolicy).toBeDefined();
    expect(result.staffSanctionReadiness).toBeDefined();
    expect(result.childSanctionProfiles).toBeDefined();
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
    expect(Array.isArray(result.actions)).toBe(true);
    expect(Array.isArray(result.regulatoryLinks)).toBe(true);
  });

  it("scores 100 with outstanding rating for perfect inputs", () => {
    const allTypes = [
      "loss_of_privilege", "additional_chore", "earlier_bedtime",
      "restricted_screen_time", "grounding", "verbal_warning",
      "written_warning", "restorative_task",
    ] as const;
    const records = allTypes.map((type, i) =>
      makeRecord({ id: `san-${i}`, sanctionType: type }),
    );
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateSanctionsIntelligence(records, policy, training, "oak-house", "2026-01-01", "2026-05-20");

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("scores 0 with inadequate rating for worst-case inputs", () => {
    const result = generateSanctionsIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("includes strengths when evaluators score >= 20", () => {
    const records = [makeRecord()];
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateSanctionsIntelligence(records, policy, training, "oak-house", "2026-01-01", "2026-05-20");

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("policy"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("readiness"))).toBe(true);
  });

  it("includes areas for improvement when evaluators score < 15", () => {
    const records = [
      makeRecord({
        proportionateToIncident: false,
        childViewsRecorded: false,
        outcome: "not_recorded",
        documentedProperly: false,
        parentNotified: false,
        staffApplied: false,
        reviewScheduled: false,
      }),
    ];
    const result = generateSanctionsIntelligence(records, null, [], "oak-house", "2026-01-01", "2026-05-20");

    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("adds URGENT action when policy score is 0", () => {
    const result = generateSanctionsIntelligence([], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("adds URGENT action when staff score is 0", () => {
    const result = generateSanctionsIntelligence([], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("adds conditional actions when rates < 50", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makeRecord({
        id: `san-${i}`,
        proportionateToIncident: false,
        childViewsRecorded: false,
        outcome: "disputed_by_child",
        documentedProperly: false,
        parentNotified: false,
        staffApplied: false,
        reviewScheduled: false,
      }),
    );
    const result = generateSanctionsIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");

    expect(result.actions.some((a) => a.includes("Proportionality rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Child views recording rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Documentation rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Parent notification rate"))).toBe(true);
  });

  it("returns exactly 7 regulatory links", () => {
    const result = generateSanctionsIntelligence([makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("regulatory links reference CHR 2015 Reg 19", () => {
    const result = generateSanctionsIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 19"))).toBe(true);
  });

  it("regulatory links reference Children Act 1989", () => {
    const result = generateSanctionsIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("regulatory links reference UNCRC", () => {
    const result = generateSanctionsIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
  });

  it("regulatory links reference Ofsted SCCIF", () => {
    const result = generateSanctionsIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("overall score is capped at 100", () => {
    const allTypes = [
      "loss_of_privilege", "additional_chore", "earlier_bedtime",
      "restricted_screen_time", "grounding", "verbal_warning",
      "written_warning", "restorative_task",
    ] as const;
    const records = allTypes.map((type, i) =>
      makeRecord({ id: `san-${i}`, sanctionType: type }),
    );
    const result = generateSanctionsIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score never goes below 0", () => {
    const result = generateSanctionsIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("builds child profiles from records", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "san-002", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateSanctionsIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.childSanctionProfiles).toHaveLength(2);
  });

  it("includes default action when no issues found", () => {
    const allTypes = [
      "loss_of_privilege", "additional_chore", "earlier_bedtime",
      "restricted_screen_time", "grounding", "verbal_warning",
      "written_warning", "restorative_task",
    ] as const;
    const records = allTypes.map((type, i) =>
      makeRecord({ id: `san-${i}`, sanctionType: type }),
    );
    const result = generateSanctionsIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.actions.some((a) => a.includes("No urgent actions required"))).toBe(true);
  });

  it("strength includes 100% proportionate message", () => {
    const records = [makeRecord()];
    const result = generateSanctionsIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.strengths.some((s) => s.includes("proportionate"))).toBe(true);
  });

  it("strength includes child views message when 100%", () => {
    const records = [makeRecord()];
    const result = generateSanctionsIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.strengths.some((s) => s.includes("Child views recorded"))).toBe(true);
  });

  it("area for improvement includes child views when < 100%", () => {
    const records = [
      makeRecord({ childViewsRecorded: true }),
      makeRecord({ id: "san-002", childViewsRecorded: false }),
    ];
    const result = generateSanctionsIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.areasForImprovement.some((a) => a.includes("Child views"))).toBe(true);
  });
});
