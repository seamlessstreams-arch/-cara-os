// ==============================================================================
// Tests — Sibling Contact Management Intelligence Engine
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateContactQuality,
  evaluatePlanningDocumentation,
  evaluateBarrierManagement,
  evaluateStaffSiblingReadiness,
  buildChildSiblingProfiles,
  generateSiblingContactManagementIntelligence,
  pct,
  getRating,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getBarrierTypeLabel,
  getBarrierStatusLabel,
  getRatingLabel,
} from "../sibling-contact-management-engine";
import type {
  SiblingContact,
  SiblingAssessment,
  ContactBarrier,
  StaffSiblingTraining,
} from "../sibling-contact-management-engine";

// -- Factories ----------------------------------------------------------------

function makeContact(overrides: Partial<SiblingContact> = {}): SiblingContact {
  return {
    id: "sc-1",
    childId: "child-1",
    childName: "Alex",
    siblingId: "sib-1",
    siblingName: "Sam",
    contactDate: "2026-03-01",
    contactType: "face_to_face",
    contactOutcome: "very_positive",
    durationMinutes: 120,
    facilitatedBy: "Sarah Johnson",
    childSatisfied: true,
    recordedInCasefile: true,
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<SiblingAssessment> = {}): SiblingAssessment {
  return {
    id: "sa-1",
    childId: "child-1",
    childName: "Alex",
    assessmentDate: "2026-01-15",
    assessedBy: "Sarah Johnson",
    siblingRelationshipMapped: true,
    contactPlanInPlace: true,
    childViewsSought: true,
    siblingViewsSought: true,
    reviewScheduled: true,
    socialWorkerConsulted: true,
    ...overrides,
  };
}

function makeBarrier(overrides: Partial<ContactBarrier> = {}): ContactBarrier {
  return {
    id: "cb-1",
    childId: "child-1",
    childName: "Alex",
    siblingName: "Sam",
    barrierType: "distance",
    barrierStatus: "resolved",
    identifiedDate: "2026-01-10",
    actionTaken: true,
    escalatedIfNeeded: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffSiblingTraining> = {}): StaffSiblingTraining {
  return {
    id: "st-1",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    siblingRelationships: true,
    contactFacilitation: true,
    childViewsAdvocacy: true,
    safeguardingInContact: true,
    recordKeeping: true,
    barrierResolution: true,
    ...overrides,
  };
}

// =============================================================================
// pct helper
// =============================================================================

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates correct percentage", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("returns 100 for equal values", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 0 for numerator 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// =============================================================================
// getRating
// =============================================================================

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// =============================================================================
// Label getters
// =============================================================================

describe("getContactTypeLabel", () => {
  it("returns correct labels", () => {
    expect(getContactTypeLabel("face_to_face")).toBe("Face to Face");
    expect(getContactTypeLabel("video_call")).toBe("Video Call");
    expect(getContactTypeLabel("phone_call")).toBe("Phone Call");
    expect(getContactTypeLabel("letter_email")).toBe("Letter / Email");
    expect(getContactTypeLabel("shared_activity")).toBe("Shared Activity");
    expect(getContactTypeLabel("overnight_stay")).toBe("Overnight Stay");
    expect(getContactTypeLabel("supervised_visit")).toBe("Supervised Visit");
    expect(getContactTypeLabel("other")).toBe("Other");
  });
});

describe("getContactOutcomeLabel", () => {
  it("returns correct labels", () => {
    expect(getContactOutcomeLabel("very_positive")).toBe("Very Positive");
    expect(getContactOutcomeLabel("positive")).toBe("Positive");
    expect(getContactOutcomeLabel("mixed")).toBe("Mixed");
    expect(getContactOutcomeLabel("difficult")).toBe("Difficult");
    expect(getContactOutcomeLabel("did_not_happen")).toBe("Did Not Happen");
  });
});

describe("getBarrierTypeLabel", () => {
  it("returns correct labels", () => {
    expect(getBarrierTypeLabel("distance")).toBe("Distance");
    expect(getBarrierTypeLabel("court_order")).toBe("Court Order");
    expect(getBarrierTypeLabel("safeguarding_concern")).toBe("Safeguarding Concern");
    expect(getBarrierTypeLabel("placement_policy")).toBe("Placement Policy");
    expect(getBarrierTypeLabel("child_refusal")).toBe("Child Refusal");
    expect(getBarrierTypeLabel("sibling_refusal")).toBe("Sibling Refusal");
    expect(getBarrierTypeLabel("scheduling_conflict")).toBe("Scheduling Conflict");
    expect(getBarrierTypeLabel("transport")).toBe("Transport");
    expect(getBarrierTypeLabel("other")).toBe("Other");
  });
});

describe("getBarrierStatusLabel", () => {
  it("returns correct labels", () => {
    expect(getBarrierStatusLabel("resolved")).toBe("Resolved");
    expect(getBarrierStatusLabel("in_progress")).toBe("In Progress");
    expect(getBarrierStatusLabel("unresolved")).toBe("Unresolved");
    expect(getBarrierStatusLabel("not_applicable")).toBe("Not Applicable");
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

// =============================================================================
// evaluateContactQuality
// =============================================================================

describe("evaluateContactQuality", () => {
  it("returns all zeros for empty contacts", () => {
    const result = evaluateContactQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalContacts).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
    expect(result.childSatisfactionRate).toBe(0);
    expect(result.recordedRate).toBe(0);
    expect(result.contactHappenedRate).toBe(0);
  });

  it("gives maximum score for all-perfect contacts", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({ id: `sc-${i}` }),
    );
    const result = evaluateContactQuality(contacts);
    expect(result.overallScore).toBe(25);
    expect(result.totalContacts).toBe(10);
    expect(result.positiveOutcomeRate).toBe(100);
    expect(result.childSatisfactionRate).toBe(100);
    expect(result.recordedRate).toBe(100);
    expect(result.contactHappenedRate).toBe(100);
  });

  it("counts very_positive + positive as positive outcomes", () => {
    const contacts = [
      makeContact({ id: "sc-1", contactOutcome: "very_positive" }),
      makeContact({ id: "sc-2", contactOutcome: "positive" }),
    ];
    const result = evaluateContactQuality(contacts);
    expect(result.positiveOutcomeRate).toBe(100);
  });

  it("excludes mixed/difficult/did_not_happen from positive outcomes", () => {
    const contacts = [
      makeContact({ id: "sc-1", contactOutcome: "mixed" }),
      makeContact({ id: "sc-2", contactOutcome: "difficult" }),
      makeContact({ id: "sc-3", contactOutcome: "did_not_happen" }),
    ];
    const result = evaluateContactQuality(contacts);
    expect(result.positiveOutcomeRate).toBe(0);
  });

  it("scores positive outcome at 60% → 5 points", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sc-${i}`,
        contactOutcome: i < 6 ? "positive" : "mixed",
      }),
    );
    const result = evaluateContactQuality(contacts);
    expect(result.positiveOutcomeRate).toBe(60);
    // 5 + 6 + 6 + 6 = 23
    expect(result.overallScore).toBe(23);
  });

  it("scores positive outcome at 40% → 3 points", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sc-${i}`,
        contactOutcome: i < 4 ? "positive" : "mixed",
      }),
    );
    const result = evaluateContactQuality(contacts);
    expect(result.positiveOutcomeRate).toBe(40);
  });

  it("scores positive outcome low → 1 point", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sc-${i}`,
        contactOutcome: i < 1 ? "positive" : "mixed",
      }),
    );
    const result = evaluateContactQuality(contacts);
    expect(result.positiveOutcomeRate).toBe(10);
  });

  it("scores child satisfaction at tier boundaries", () => {
    // 70% → 4 points
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({ id: `sc-${i}`, childSatisfied: i < 7 }),
    );
    const result = evaluateContactQuality(contacts);
    expect(result.childSatisfactionRate).toBe(70);
  });

  it("scores recorded rate at 50% → 3 points", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({ id: `sc-${i}`, recordedInCasefile: i < 5 }),
    );
    const result = evaluateContactQuality(contacts);
    expect(result.recordedRate).toBe(50);
  });

  it("handles did_not_happen contacts correctly", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sc-${i}`,
        contactOutcome: i < 3 ? "did_not_happen" : "positive",
      }),
    );
    const result = evaluateContactQuality(contacts);
    expect(result.contactHappenedRate).toBe(70);
  });

  it("scores all zeros when everything is worst case", () => {
    const contacts = [
      makeContact({
        contactOutcome: "did_not_happen",
        childSatisfied: false,
        recordedInCasefile: false,
      }),
    ];
    const result = evaluateContactQuality(contacts);
    // positive 0%, satisfaction 0%, recorded 0%, happened 0%
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const contacts = Array.from({ length: 50 }, (_, i) =>
      makeContact({ id: `sc-${i}` }),
    );
    const result = evaluateContactQuality(contacts);
    expect(result.overallScore).toBe(25);
  });
});

// =============================================================================
// evaluatePlanningDocumentation
// =============================================================================

describe("evaluatePlanningDocumentation", () => {
  it("returns all zeros for empty assessments", () => {
    const result = evaluatePlanningDocumentation([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
  });

  it("gives maximum score for all-perfect assessments", () => {
    const assessments = Array.from({ length: 5 }, (_, i) =>
      makeAssessment({ id: `sa-${i}` }),
    );
    const result = evaluatePlanningDocumentation(assessments);
    // 6 + 6 + 5 + 4 + 2 + 2 = 25
    expect(result.overallScore).toBe(25);
    expect(result.relationshipMappedRate).toBe(100);
    expect(result.contactPlanRate).toBe(100);
    expect(result.childViewsRate).toBe(100);
    expect(result.siblingViewsRate).toBe(100);
    expect(result.reviewScheduledRate).toBe(100);
    expect(result.socialWorkerConsultedRate).toBe(100);
  });

  it("scores relationship mapped at 70% → 4 points", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({ id: `sa-${i}`, siblingRelationshipMapped: i < 7 }),
    );
    const result = evaluatePlanningDocumentation(assessments);
    expect(result.relationshipMappedRate).toBe(70);
  });

  it("scores contact plan at 50% → 3 points", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({ id: `sa-${i}`, contactPlanInPlace: i < 5 }),
    );
    const result = evaluatePlanningDocumentation(assessments);
    expect(result.contactPlanRate).toBe(50);
  });

  it("scores child views at 70% → 3 points", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({ id: `sa-${i}`, childViewsSought: i < 7 }),
    );
    const result = evaluatePlanningDocumentation(assessments);
    expect(result.childViewsRate).toBe(70);
  });

  it("scores sibling views at 70% → 3 points", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({ id: `sa-${i}`, siblingViewsSought: i < 7 }),
    );
    const result = evaluatePlanningDocumentation(assessments);
    expect(result.siblingViewsRate).toBe(70);
  });

  it("scores review scheduled at 50% → 1 point", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({ id: `sa-${i}`, reviewScheduled: i < 5 }),
    );
    const result = evaluatePlanningDocumentation(assessments);
    expect(result.reviewScheduledRate).toBe(50);
  });

  it("scores social worker consulted at 50% → 1 point", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({ id: `sa-${i}`, socialWorkerConsulted: i < 5 }),
    );
    const result = evaluatePlanningDocumentation(assessments);
    expect(result.socialWorkerConsultedRate).toBe(50);
  });

  it("scores all zeros when everything fails", () => {
    const assessments = [
      makeAssessment({
        siblingRelationshipMapped: false,
        contactPlanInPlace: false,
        childViewsSought: false,
        siblingViewsSought: false,
        reviewScheduled: false,
        socialWorkerConsulted: false,
      }),
    ];
    const result = evaluatePlanningDocumentation(assessments);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const assessments = Array.from({ length: 50 }, (_, i) =>
      makeAssessment({ id: `sa-${i}` }),
    );
    const result = evaluatePlanningDocumentation(assessments);
    expect(result.overallScore).toBe(25);
  });
});

// =============================================================================
// evaluateBarrierManagement
// =============================================================================

describe("evaluateBarrierManagement", () => {
  it("returns 25 for empty barriers (no obstacles = ideal)", () => {
    const result = evaluateBarrierManagement([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalBarriers).toBe(0);
  });

  it("gives maximum score for all resolved barriers", () => {
    const barriers = Array.from({ length: 5 }, (_, i) =>
      makeBarrier({ id: `cb-${i}` }),
    );
    const result = evaluateBarrierManagement(barriers);
    // 10 + 8 + 7 = 25
    expect(result.overallScore).toBe(25);
    expect(result.resolvedRate).toBe(100);
    expect(result.actionTakenRate).toBe(100);
    expect(result.escalatedRate).toBe(100);
  });

  it("counts resolved + not_applicable as resolved", () => {
    const barriers = [
      makeBarrier({ id: "cb-1", barrierStatus: "resolved" }),
      makeBarrier({ id: "cb-2", barrierStatus: "not_applicable" }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.resolvedRate).toBe(100);
  });

  it("excludes in_progress and unresolved from resolved rate", () => {
    const barriers = [
      makeBarrier({ id: "cb-1", barrierStatus: "in_progress" }),
      makeBarrier({ id: "cb-2", barrierStatus: "unresolved" }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.resolvedRate).toBe(0);
  });

  it("scores resolved at 60% → 7 points", () => {
    const barriers = Array.from({ length: 10 }, (_, i) =>
      makeBarrier({
        id: `cb-${i}`,
        barrierStatus: i < 6 ? "resolved" : "unresolved",
      }),
    );
    const result = evaluateBarrierManagement(barriers);
    expect(result.resolvedRate).toBe(60);
  });

  it("scores resolved at 40% → 4 points", () => {
    const barriers = Array.from({ length: 10 }, (_, i) =>
      makeBarrier({
        id: `cb-${i}`,
        barrierStatus: i < 4 ? "resolved" : "unresolved",
      }),
    );
    const result = evaluateBarrierManagement(barriers);
    expect(result.resolvedRate).toBe(40);
  });

  it("scores resolved low → 2 points", () => {
    const barriers = Array.from({ length: 10 }, (_, i) =>
      makeBarrier({
        id: `cb-${i}`,
        barrierStatus: i < 1 ? "resolved" : "unresolved",
      }),
    );
    const result = evaluateBarrierManagement(barriers);
    expect(result.resolvedRate).toBe(10);
  });

  it("scores action taken at tier boundaries", () => {
    // 70% → 6 points
    const barriers = Array.from({ length: 10 }, (_, i) =>
      makeBarrier({ id: `cb-${i}`, actionTaken: i < 7 }),
    );
    const result = evaluateBarrierManagement(barriers);
    expect(result.actionTakenRate).toBe(70);
  });

  it("scores escalated at tier boundaries", () => {
    // 70% → 5 points
    const barriers = Array.from({ length: 10 }, (_, i) =>
      makeBarrier({ id: `cb-${i}`, escalatedIfNeeded: i < 7 }),
    );
    const result = evaluateBarrierManagement(barriers);
    expect(result.escalatedRate).toBe(70);
  });

  it("scores all zeros when everything fails", () => {
    const barriers = [
      makeBarrier({
        barrierStatus: "unresolved",
        actionTaken: false,
        escalatedIfNeeded: false,
      }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const barriers = Array.from({ length: 50 }, (_, i) =>
      makeBarrier({ id: `cb-${i}` }),
    );
    const result = evaluateBarrierManagement(barriers);
    expect(result.overallScore).toBe(25);
  });
});

// =============================================================================
// evaluateStaffSiblingReadiness
// =============================================================================

describe("evaluateStaffSiblingReadiness", () => {
  it("returns all zeros for empty training", () => {
    const result = evaluateStaffSiblingReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("gives maximum score for all-perfect training", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({ id: `st-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffSiblingReadiness(training);
    // 6 + 5 + 5 + 4 + 3 + 2 = 25
    expect(result.overallScore).toBe(25);
    expect(result.siblingRelationshipsRate).toBe(100);
    expect(result.contactFacilitationRate).toBe(100);
    expect(result.childViewsAdvocacyRate).toBe(100);
    expect(result.safeguardingRate).toBe(100);
    expect(result.recordKeepingRate).toBe(100);
    expect(result.barrierResolutionRate).toBe(100);
  });

  it("scores sibling relationships at 70% → 4 points", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `staff-${i}`,
        siblingRelationships: i < 7,
      }),
    );
    const result = evaluateStaffSiblingReadiness(training);
    expect(result.siblingRelationshipsRate).toBe(70);
  });

  it("scores contact facilitation at 70% → 3 points", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `staff-${i}`,
        contactFacilitation: i < 7,
      }),
    );
    const result = evaluateStaffSiblingReadiness(training);
    expect(result.contactFacilitationRate).toBe(70);
  });

  it("scores child views advocacy at 50% → 2 points", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `staff-${i}`,
        childViewsAdvocacy: i < 5,
      }),
    );
    const result = evaluateStaffSiblingReadiness(training);
    expect(result.childViewsAdvocacyRate).toBe(50);
  });

  it("scores safeguarding at 70% → 3 points", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `staff-${i}`,
        safeguardingInContact: i < 7,
      }),
    );
    const result = evaluateStaffSiblingReadiness(training);
    expect(result.safeguardingRate).toBe(70);
  });

  it("scores record keeping at 70% → 2 points", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `staff-${i}`,
        recordKeeping: i < 7,
      }),
    );
    const result = evaluateStaffSiblingReadiness(training);
    expect(result.recordKeepingRate).toBe(70);
  });

  it("scores barrier resolution at 70% → 1 point", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `staff-${i}`,
        barrierResolution: i < 7,
      }),
    );
    const result = evaluateStaffSiblingReadiness(training);
    expect(result.barrierResolutionRate).toBe(70);
  });

  it("scores barrier resolution low → 0 points (no tier below 70)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `staff-${i}`,
        barrierResolution: i < 5,
      }),
    );
    const result = evaluateStaffSiblingReadiness(training);
    expect(result.barrierResolutionRate).toBe(50);
  });

  it("scores all zeros when nobody trained", () => {
    const training = [
      makeTraining({
        siblingRelationships: false,
        contactFacilitation: false,
        childViewsAdvocacy: false,
        safeguardingInContact: false,
        recordKeeping: false,
        barrierResolution: false,
      }),
    ];
    const result = evaluateStaffSiblingReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ id: `st-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffSiblingReadiness(training);
    expect(result.overallScore).toBe(25);
  });
});

// =============================================================================
// buildChildSiblingProfiles
// =============================================================================

describe("buildChildSiblingProfiles", () => {
  it("returns empty array for no data", () => {
    expect(buildChildSiblingProfiles([], [])).toEqual([]);
  });

  it("builds profile from contacts only", () => {
    const contacts = [makeContact()];
    const profiles = buildChildSiblingProfiles(contacts, []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalContacts).toBe(1);
    expect(profiles[0].hasContactPlan).toBe(false);
  });

  it("builds profile from assessments only", () => {
    const assessments = [makeAssessment()];
    const profiles = buildChildSiblingProfiles([], assessments);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].totalContacts).toBe(0);
    expect(profiles[0].hasContactPlan).toBe(true);
  });

  it("merges contacts and assessments for same child", () => {
    const contacts = [makeContact()];
    const assessments = [makeAssessment()];
    const profiles = buildChildSiblingProfiles(contacts, assessments);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].totalContacts).toBe(1);
    expect(profiles[0].hasContactPlan).toBe(true);
  });

  it("groups contacts by childId", () => {
    const contacts = [
      makeContact({ id: "sc-1", childId: "child-1", childName: "Alex" }),
      makeContact({ id: "sc-2", childId: "child-2", childName: "Jordan" }),
      makeContact({ id: "sc-3", childId: "child-1", childName: "Alex" }),
    ];
    const profiles = buildChildSiblingProfiles(contacts, []);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].totalContacts).toBe(2);
    expect(profiles[1].totalContacts).toBe(1);
  });

  it("scores contacts: 1 → 1 point", () => {
    const contacts = [makeContact()];
    const profiles = buildChildSiblingProfiles(contacts, []);
    // 1 contact → 1, positive 100% → 3, satisfied 100% → 2, no plan → 0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("scores contacts: 3 → 2 points", () => {
    const contacts = Array.from({ length: 3 }, (_, i) =>
      makeContact({ id: `sc-${i}` }),
    );
    const profiles = buildChildSiblingProfiles(contacts, []);
    // 3 contacts → 2, positive 100% → 3, satisfied 100% → 2, no plan → 0 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("scores contacts: 6+ → 3 points", () => {
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({ id: `sc-${i}` }),
    );
    const profiles = buildChildSiblingProfiles(contacts, []);
    // 6 contacts → 3, positive 100% → 3, satisfied 100% → 2, no plan → 0 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("scores positive outcome at 80%+ → 3 points", () => {
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({
        id: `sc-${i}`,
        contactOutcome: i < 4 ? "positive" : "mixed",
      }),
    );
    const profiles = buildChildSiblingProfiles(contacts, []);
    expect(profiles[0].positiveOutcomeRate).toBe(80);
  });

  it("scores positive outcome at 50% → 2 points", () => {
    const contacts = Array.from({ length: 4 }, (_, i) =>
      makeContact({
        id: `sc-${i}`,
        contactOutcome: i < 2 ? "positive" : "mixed",
      }),
    );
    const profiles = buildChildSiblingProfiles(contacts, []);
    expect(profiles[0].positiveOutcomeRate).toBe(50);
  });

  it("scores satisfaction at 80%+ → 2 points", () => {
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({ id: `sc-${i}`, childSatisfied: i < 4 }),
    );
    const profiles = buildChildSiblingProfiles(contacts, []);
    expect(profiles[0].satisfactionRate).toBe(80);
  });

  it("scores contact plan → 2 points", () => {
    const assessments = [makeAssessment({ contactPlanInPlace: true })];
    const profiles = buildChildSiblingProfiles([], assessments);
    // 0 contacts → 0, positive 0% → 0, satisfied 0% → 0, plan → 2 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("caps profile score at 10", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({ id: `sc-${i}` }),
    );
    const assessments = [makeAssessment()];
    const profiles = buildChildSiblingProfiles(contacts, assessments);
    expect(profiles[0].overallScore).toBe(10);
  });
});

// =============================================================================
// generateSiblingContactManagementIntelligence
// =============================================================================

describe("generateSiblingContactManagementIntelligence", () => {
  it("returns correct structure with all empty inputs", () => {
    const result = generateSiblingContactManagementIntelligence(
      [], [], [], [], "test-home", "2026-01-01", "2026-06-01",
    );
    expect(result.homeId).toBe("test-home");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-06-01");
    // barriers empty = 25, rest = 0 → total = 25
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toEqual([]);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("sums all four evaluator scores", () => {
    const contacts = [makeContact()];
    const assessments = [makeAssessment()];
    const barriers = [makeBarrier()];
    const training = [makeTraining()];

    const result = generateSiblingContactManagementIntelligence(
      contacts, assessments, barriers, training, "oak-house", "2026-01-01", "2026-06-01",
    );

    const expected =
      result.contactQuality.overallScore +
      result.planningDocumentation.overallScore +
      result.barrierManagement.overallScore +
      result.staffSiblingReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(expected, 100));
  });

  it("caps overall score at 100", () => {
    const contacts = Array.from({ length: 10 }, (_, i) => makeContact({ id: `sc-${i}` }));
    const assessments = Array.from({ length: 10 }, (_, i) => makeAssessment({ id: `sa-${i}` }));
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `st-${i}`, staffId: `staff-${i}` }),
    );

    const result = generateSiblingContactManagementIntelligence(
      contacts, assessments, [], training, "oak-house", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  // -- Strengths ---------------------------------------------------------------

  it("adds positive outcome strength when rate >= 80%", () => {
    const contacts = Array.from({ length: 5 }, (_, i) =>
      makeContact({ id: `sc-${i}` }),
    );
    const result = generateSiblingContactManagementIntelligence(
      contacts, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Sibling contacts consistently producing positive outcomes for children",
    );
  });

  it("adds satisfaction strength when rate >= 90%", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({ id: `sc-${i}` }),
    );
    const result = generateSiblingContactManagementIntelligence(
      contacts, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Children report high satisfaction with sibling contact arrangements",
    );
  });

  it("adds contact plan strength when rate >= 90%", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({ id: `sa-${i}` }),
    );
    const result = generateSiblingContactManagementIntelligence(
      [], assessments, [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Contact plans in place for all children with siblings",
    );
  });

  it("adds barrier resolution strength when rate >= 80%", () => {
    const barriers = Array.from({ length: 5 }, (_, i) =>
      makeBarrier({ id: `cb-${i}` }),
    );
    const result = generateSiblingContactManagementIntelligence(
      [], [], barriers, [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Barriers to sibling contact effectively identified and resolved",
    );
  });

  it("adds staff training strength when rate >= 90%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `st-${i}`, staffId: `staff-${i}` }),
    );
    const result = generateSiblingContactManagementIntelligence(
      [], [], [], training, "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Staff team fully trained in supporting sibling relationships",
    );
  });

  // -- Areas for improvement ---------------------------------------------------

  it("adds positive outcome area when rate < 60%", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sc-${i}`,
        contactOutcome: i < 5 ? "positive" : "mixed",
      }),
    );
    const result = generateSiblingContactManagementIntelligence(
      contacts, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement).toContain(
      "Sibling contact outcomes below expected standard — review facilitation approach",
    );
  });

  it("adds satisfaction area when rate < 70%", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({ id: `sc-${i}`, childSatisfied: i < 6 }),
    );
    const result = generateSiblingContactManagementIntelligence(
      contacts, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement).toContain(
      "Children's satisfaction with sibling contact needs improvement",
    );
  });

  // -- Actions -----------------------------------------------------------------

  it("adds no-contacts action when contacts empty", () => {
    const result = generateSiblingContactManagementIntelligence(
      [], [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "No sibling contacts recorded — review whether children have siblings and establish contact arrangements",
    );
  });

  it("adds URGENT assessment action when assessments empty but contacts exist", () => {
    const contacts = [makeContact()];
    const result = generateSiblingContactManagementIntelligence(
      contacts, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "URGENT: No sibling assessments recorded — complete sibling relationship mapping for all children",
    );
  });

  it("adds URGENT training action when training empty", () => {
    const result = generateSiblingContactManagementIntelligence(
      [], [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "URGENT: No staff sibling contact training records — deliver training on sibling relationship support",
    );
  });

  it("adds URGENT unresolved barrier action", () => {
    const barriers = [
      makeBarrier({ id: "cb-1", barrierStatus: "unresolved" }),
      makeBarrier({ id: "cb-2", barrierStatus: "unresolved" }),
    ];
    const result = generateSiblingContactManagementIntelligence(
      [], [], barriers, [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "URGENT: 2 unresolved barrier(s) to sibling contact — take action to address immediately",
    );
  });

  it("adds recording action when recordedRate < 70%", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({ id: `sc-${i}`, recordedInCasefile: i < 6 }),
    );
    const result = generateSiblingContactManagementIntelligence(
      contacts, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "Improve recording of sibling contacts in casefiles",
    );
  });

  it("adds contact happened action when rate < 80%", () => {
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        id: `sc-${i}`,
        contactOutcome: i < 3 ? "did_not_happen" : "positive",
      }),
    );
    const result = generateSiblingContactManagementIntelligence(
      contacts, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "Review why scheduled sibling contacts are not taking place",
    );
  });

  // -- Regulatory links -------------------------------------------------------

  it("always includes all 7 regulatory links", () => {
    const result = generateSiblingContactManagementIntelligence(
      [], [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 10 — The health and wellbeing standard (emotional wellbeing through family contact)");
    expect(result.regulatoryLinks).toContain("Children Act 1989 s34 — Contact with children in care");
    expect(result.regulatoryLinks).toContain("UNCRC Article 8 — Right to preserve family relations");
  });

  // -- Full Oak House demo scenario -------------------------------------------

  it("scores Oak House demo data correctly", () => {
    const contacts: SiblingContact[] = [
      makeContact({ id: "sc-1", childId: "child-alex", childName: "Alex", siblingId: "sib-1", siblingName: "Sam" }),
      makeContact({ id: "sc-2", childId: "child-alex", childName: "Alex", siblingId: "sib-1", siblingName: "Sam", contactType: "video_call", contactOutcome: "positive" }),
      makeContact({ id: "sc-3", childId: "child-alex", childName: "Alex", siblingId: "sib-1", siblingName: "Sam", contactType: "shared_activity" }),
      makeContact({ id: "sc-4", childId: "child-jordan", childName: "Jordan", siblingId: "sib-2", siblingName: "Casey", contactOutcome: "positive" }),
      makeContact({ id: "sc-5", childId: "child-jordan", childName: "Jordan", siblingId: "sib-2", siblingName: "Casey", contactType: "phone_call", contactOutcome: "positive" }),
      makeContact({ id: "sc-6", childId: "child-jordan", childName: "Jordan", siblingId: "sib-3", siblingName: "Riley" }),
      makeContact({ id: "sc-7", childId: "child-morgan", childName: "Morgan", siblingId: "sib-4", siblingName: "Taylor", contactType: "video_call", contactOutcome: "positive" }),
      makeContact({ id: "sc-8", childId: "child-morgan", childName: "Morgan", siblingId: "sib-4", siblingName: "Taylor", contactType: "overnight_stay" }),
    ];
    const assessments: SiblingAssessment[] = [
      makeAssessment({ id: "sa-1", childId: "child-alex", childName: "Alex" }),
      makeAssessment({ id: "sa-2", childId: "child-jordan", childName: "Jordan" }),
      makeAssessment({ id: "sa-3", childId: "child-morgan", childName: "Morgan" }),
    ];
    const barriers: ContactBarrier[] = [
      makeBarrier({ id: "cb-1", childId: "child-morgan", childName: "Morgan", siblingName: "Taylor", barrierType: "distance" }),
    ];
    const training: StaffSiblingTraining[] = [
      makeTraining({ id: "st-1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      makeTraining({ id: "st-2", staffId: "staff-tom", staffName: "Tom Richards" }),
      makeTraining({ id: "st-3", staffId: "staff-lisa", staffName: "Lisa Williams" }),
      makeTraining({ id: "st-4", staffId: "staff-darren", staffName: "Darren Laville" }),
    ];

    const result = generateSiblingContactManagementIntelligence(
      contacts, assessments, barriers, training, "oak-house", "2026-01-01", "2026-05-19",
    );

    expect(result.contactQuality.overallScore).toBe(25);
    expect(result.planningDocumentation.overallScore).toBe(25);
    expect(result.barrierManagement.overallScore).toBe(25);
    expect(result.staffSiblingReadiness.overallScore).toBe(25);
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.childProfiles).toHaveLength(3);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.areasForImprovement).toHaveLength(0);
  });
});
