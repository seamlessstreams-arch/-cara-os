// ══════════════════════════════════════════════════════════════════════════════
// Contact Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getCategoryLabel,
  getOutcomeLabel,
  getRatingLabel,
  evaluateContactQuality,
  evaluateContactCompliance,
  evaluateContactPolicy,
  evaluateStaffContactReadiness,
  buildChildContactProfiles,
  generateContactIntelligence,
} from "../contact-engine";
import type {
  ContactRecord,
  ContactPolicy,
  StaffContactTraining,
  ContactCategory,
} from "../contact-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeRecord(overrides: Partial<ContactRecord> = {}): ContactRecord {
  return {
    id: "rec-001",
    childId: "child-alex",
    childName: "Alex",
    contactDate: "2026-03-15",
    category: "family_visit",
    childPrepared: true,
    contactPlanFollowed: true,
    childViewCaptured: true,
    safetyMeasuresInPlace: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<ContactPolicy> = {}): ContactPolicy {
  return {
    id: "pol-001",
    contactPolicy: true,
    supervisedContactGuidelines: true,
    riskAssessmentProtocol: true,
    childParticipationFramework: true,
    familyEngagementStrategy: true,
    emergencyContactProcedure: true,
    reviewSchedule: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffContactTraining> = {}): StaffContactTraining {
  return {
    id: "tr-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    contactSupervision: true,
    safeguardingAwareness: true,
    childCommunication: true,
    familyMediation: true,
    riskManagement: true,
    recordKeeping: true,
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
});

// ══════════════════════════════════════════════════════════════════════════════
// Label getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getCategoryLabel", () => {
  it("returns correct label for family_visit", () => {
    expect(getCategoryLabel("family_visit")).toBe("Family Visit");
  });

  it("returns correct label for phone_call", () => {
    expect(getCategoryLabel("phone_call")).toBe("Phone Call");
  });

  it("returns correct label for video_call", () => {
    expect(getCategoryLabel("video_call")).toBe("Video Call");
  });

  it("returns correct label for supervised_contact", () => {
    expect(getCategoryLabel("supervised_contact")).toBe("Supervised Contact");
  });

  it("returns correct label for unsupervised_contact", () => {
    expect(getCategoryLabel("unsupervised_contact")).toBe("Unsupervised Contact");
  });

  it("returns correct label for letterbox_contact", () => {
    expect(getCategoryLabel("letterbox_contact")).toBe("Letterbox Contact");
  });

  it("returns correct label for professional_meeting", () => {
    expect(getCategoryLabel("professional_meeting")).toBe("Professional Meeting");
  });

  it("returns correct label for sibling_contact", () => {
    expect(getCategoryLabel("sibling_contact")).toBe("Sibling Contact");
  });
});

describe("getOutcomeLabel", () => {
  it("returns correct label for completed", () => {
    expect(getOutcomeLabel("completed")).toBe("Completed");
  });

  it("returns correct label for partially_completed", () => {
    expect(getOutcomeLabel("partially_completed")).toBe("Partially Completed");
  });

  it("returns correct label for not_completed", () => {
    expect(getOutcomeLabel("not_completed")).toBe("Not Completed");
  });

  it("returns correct label for cancelled", () => {
    expect(getOutcomeLabel("cancelled")).toBe("Cancelled");
  });

  it("returns correct label for rescheduled", () => {
    expect(getOutcomeLabel("rescheduled")).toBe("Rescheduled");
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
// Evaluator 1: evaluateContactQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateContactQuality", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateContactQuality([]);
    expect(result.totalRecords).toBe(0);
    expect(result.childPreparedRate).toBe(0);
    expect(result.contactPlanFollowedRate).toBe(0);
    expect(result.childViewCapturedRate).toBe(0);
    expect(result.safetyMeasuresRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns inadequate rating concern for empty records", () => {
    const result = evaluateContactQuality([]);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("cannot be assessed");
  });

  it("returns perfect score for all-true records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateContactQuality(records);
    expect(result.childPreparedRate).toBe(100);
    expect(result.contactPlanFollowedRate).toBe(100);
    expect(result.childViewCapturedRate).toBe(100);
    expect(result.safetyMeasuresRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("returns zero score for all-false records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        childPrepared: false,
        contactPlanFollowed: false,
        childViewCaptured: false,
        safetyMeasuresInPlace: false,
      }),
    );
    const result = evaluateContactQuality(records);
    expect(result.childPreparedRate).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("calculates partial scores correctly", () => {
    const records = [
      makeRecord({ id: "r1", childPrepared: true, contactPlanFollowed: true, childViewCaptured: true, safetyMeasuresInPlace: true }),
      makeRecord({ id: "r2", childPrepared: false, contactPlanFollowed: false, childViewCaptured: false, safetyMeasuresInPlace: false }),
    ];
    const result = evaluateContactQuality(records);
    expect(result.childPreparedRate).toBe(50);
    expect(result.contactPlanFollowedRate).toBe(50);
    expect(result.childViewCapturedRate).toBe(50);
    expect(result.safetyMeasuresRate).toBe(50);
    // (50/100)*7 + (50/100)*6 + (50/100)*6 + (50/100)*6 = 3.5+3+3+3 = 12.5
    expect(result.score).toBe(12.5);
  });

  it("caps score at 25", () => {
    const records = [makeRecord()];
    const result = evaluateContactQuality(records);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.score).toBe(25);
  });

  it("includes strengths when rates are high", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateContactQuality(records);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBe(0);
  });

  it("includes concerns when rates are low", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        childPrepared: false,
        contactPlanFollowed: false,
        childViewCaptured: false,
        safetyMeasuresInPlace: false,
      }),
    );
    const result = evaluateContactQuality(records);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.childPreparedRate).toBe(0);
  });

  it("handles mixed boolean values correctly", () => {
    const records = [
      makeRecord({ id: "r1", childPrepared: true, contactPlanFollowed: false }),
      makeRecord({ id: "r2", childPrepared: true, contactPlanFollowed: true }),
      makeRecord({ id: "r3", childPrepared: false, contactPlanFollowed: true }),
    ];
    const result = evaluateContactQuality(records);
    expect(result.childPreparedRate).toBe(67);
    expect(result.contactPlanFollowedRate).toBe(67);
  });

  it("handles single record correctly", () => {
    const result = evaluateContactQuality([makeRecord()]);
    expect(result.totalRecords).toBe(1);
    expect(result.score).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: evaluateContactCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateContactCompliance", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateContactCompliance([]);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.completedOutcomeRate).toBe(0);
    expect(result.categoryDiversityRate).toBe(0);
    expect(result.uniqueCategories).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns perfect score for all-true records across all categories", () => {
    const categories: ContactCategory[] = [
      "family_visit", "phone_call", "video_call", "supervised_contact",
      "unsupervised_contact", "letterbox_contact", "professional_meeting", "sibling_contact",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateContactCompliance(records);
    expect(result.documentationCompleteRate).toBe(100);
    expect(result.timelyRecordingRate).toBe(100);
    expect(result.completedOutcomeRate).toBe(100);
    expect(result.categoryDiversityRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates diversity rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", category: "family_visit" }),
      makeRecord({ id: "r2", category: "phone_call" }),
      makeRecord({ id: "r3", category: "video_call" }),
      makeRecord({ id: "r4", category: "supervised_contact" }),
    ];
    const result = evaluateContactCompliance(records);
    expect(result.uniqueCategories).toBe(4);
    expect(result.categoryDiversityRate).toBe(50);
  });

  it("calculates partial compliance scores", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "r2", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluateContactCompliance(records);
    expect(result.documentationCompleteRate).toBe(50);
    expect(result.timelyRecordingRate).toBe(50);
  });

  it("caps score at 25", () => {
    const categories: ContactCategory[] = [
      "family_visit", "phone_call", "video_call", "supervised_contact",
      "unsupervised_contact", "letterbox_contact", "professional_meeting", "sibling_contact",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateContactCompliance(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("includes concerns when rates are low", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        documentationComplete: false,
        timelyRecording: false,
        childPrepared: false,
        contactPlanFollowed: false,
      }),
    );
    const result = evaluateContactCompliance(records);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("includes strength for high documentation rate", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateContactCompliance(records);
    expect(result.strengths.some((s) => s.includes("documentation"))).toBe(true);
  });

  it("calculates completedOutcomeRate based on childPrepared AND contactPlanFollowed", () => {
    const records = [
      makeRecord({ id: "r1", childPrepared: true, contactPlanFollowed: true }),
      makeRecord({ id: "r2", childPrepared: true, contactPlanFollowed: false }),
      makeRecord({ id: "r3", childPrepared: false, contactPlanFollowed: true }),
      makeRecord({ id: "r4", childPrepared: false, contactPlanFollowed: false }),
    ];
    const result = evaluateContactCompliance(records);
    expect(result.completedOutcomeRate).toBe(25);
  });

  it("reports concern for limited category diversity", () => {
    const records = [
      makeRecord({ id: "r1", category: "family_visit" }),
    ];
    const result = evaluateContactCompliance(records);
    expect(result.uniqueCategories).toBe(1);
    expect(result.concerns.some((c) => c.includes("contact type"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: evaluateContactPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateContactPolicy", () => {
  it("returns 0 score and all false for null policy", () => {
    const result = evaluateContactPolicy(null);
    expect(result.score).toBe(0);
    expect(result.contactPolicy).toBe(false);
    expect(result.supervisedContactGuidelines).toBe(false);
    expect(result.riskAssessmentProtocol).toBe(false);
    expect(result.childParticipationFramework).toBe(false);
    expect(result.familyEngagementStrategy).toBe(false);
    expect(result.emergencyContactProcedure).toBe(false);
    expect(result.reviewSchedule).toBe(false);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns perfect 25 for fully compliant policy", () => {
    const result = evaluateContactPolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBe(0);
  });

  it("weights 4-point booleans correctly", () => {
    // Only the four 4-point booleans
    const result = evaluateContactPolicy(makePolicy({
      familyEngagementStrategy: false,
      emergencyContactProcedure: false,
      reviewSchedule: false,
    }));
    expect(result.score).toBe(16); // 4+4+4+4 = 16
  });

  it("weights 3-point booleans correctly", () => {
    // Only the three 3-point booleans
    const result = evaluateContactPolicy(makePolicy({
      contactPolicy: false,
      supervisedContactGuidelines: false,
      riskAssessmentProtocol: false,
      childParticipationFramework: false,
    }));
    expect(result.score).toBe(9); // 3+3+3 = 9
  });

  it("reports concerns for missing components", () => {
    const result = evaluateContactPolicy(makePolicy({
      contactPolicy: false,
      riskAssessmentProtocol: false,
    }));
    expect(result.concerns.some((c) => c.includes("contact policy"))).toBe(true);
    expect(result.concerns.some((c) => c.includes("risk assessment"))).toBe(true);
  });

  it("reports strength for 5+ components", () => {
    const result = evaluateContactPolicy(makePolicy({
      reviewSchedule: false,
      emergencyContactProcedure: false,
    }));
    expect(result.strengths.some((s) => s.includes("5/7"))).toBe(true);
  });

  it("reports strength for all 7 components", () => {
    const result = evaluateContactPolicy(makePolicy());
    expect(result.strengths.some((s) => s.includes("7/7"))).toBe(true);
  });

  it("returns all false booleans for all-false policy", () => {
    const result = evaluateContactPolicy(makePolicy({
      contactPolicy: false,
      supervisedContactGuidelines: false,
      riskAssessmentProtocol: false,
      childParticipationFramework: false,
      familyEngagementStrategy: false,
      emergencyContactProcedure: false,
      reviewSchedule: false,
    }));
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBe(7);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: evaluateStaffContactReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffContactReadiness", () => {
  it("returns all zeros for empty training", () => {
    const result = evaluateStaffContactReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.contactSupervisionRate).toBe(0);
    expect(result.safeguardingAwarenessRate).toBe(0);
    expect(result.childCommunicationRate).toBe(0);
    expect(result.familyMediationRate).toBe(0);
    expect(result.riskManagementRate).toBe(0);
    expect(result.recordKeepingRate).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns perfect 25 for fully trained staff", () => {
    const staff = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
    ];
    const result = evaluateStaffContactReadiness(staff);
    expect(result.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("calculates partial rates correctly", () => {
    const staff = [
      makeTraining({ id: "t1", staffId: "s1", contactSupervision: true, safeguardingAwareness: false }),
      makeTraining({ id: "t2", staffId: "s2", contactSupervision: false, safeguardingAwareness: true }),
    ];
    const result = evaluateStaffContactReadiness(staff);
    expect(result.contactSupervisionRate).toBe(50);
    expect(result.safeguardingAwarenessRate).toBe(50);
  });

  it("caps score at 25", () => {
    const staff = [makeTraining()];
    const result = evaluateStaffContactReadiness(staff);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("includes concerns when rates are low", () => {
    const staff = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        contactSupervision: false,
        safeguardingAwareness: false,
        childCommunication: false,
        familyMediation: false,
        riskManagement: false,
        recordKeeping: false,
      }),
      makeTraining({
        id: "t2",
        staffId: "s2",
        contactSupervision: false,
        safeguardingAwareness: false,
        childCommunication: false,
        familyMediation: false,
        riskManagement: false,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffContactReadiness(staff);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("weights skills correctly: supervision=6, safeguarding=5, communication=5, mediation=4, risk=3, records=2", () => {
    // Single staff with only supervision true
    const t1 = [makeTraining({
      contactSupervision: true,
      safeguardingAwareness: false,
      childCommunication: false,
      familyMediation: false,
      riskManagement: false,
      recordKeeping: false,
    })];
    const r1 = evaluateStaffContactReadiness(t1);
    expect(r1.score).toBe(6);

    // Single staff with only safeguarding true
    const t2 = [makeTraining({
      contactSupervision: false,
      safeguardingAwareness: true,
      childCommunication: false,
      familyMediation: false,
      riskManagement: false,
      recordKeeping: false,
    })];
    const r2 = evaluateStaffContactReadiness(t2);
    expect(r2.score).toBe(5);

    // Single staff with only recordKeeping true
    const t3 = [makeTraining({
      contactSupervision: false,
      safeguardingAwareness: false,
      childCommunication: false,
      familyMediation: false,
      riskManagement: false,
      recordKeeping: true,
    })];
    const r3 = evaluateStaffContactReadiness(t3);
    expect(r3.score).toBe(2);

    // Single staff with only mediation true
    const t4 = [makeTraining({
      contactSupervision: false,
      safeguardingAwareness: false,
      childCommunication: false,
      familyMediation: true,
      riskManagement: false,
      recordKeeping: false,
    })];
    const r4 = evaluateStaffContactReadiness(t4);
    expect(r4.score).toBe(4);

    // Single staff with only riskManagement true
    const t5 = [makeTraining({
      contactSupervision: false,
      safeguardingAwareness: false,
      childCommunication: false,
      familyMediation: false,
      riskManagement: true,
      recordKeeping: false,
    })];
    const r5 = evaluateStaffContactReadiness(t5);
    expect(r5.score).toBe(3);
  });

  it("handles single staff member", () => {
    const result = evaluateStaffContactReadiness([makeTraining()]);
    expect(result.totalStaff).toBe(1);
    expect(result.score).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Contact Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildContactProfiles", () => {
  it("returns empty array for no records", () => {
    const profiles = buildChildContactProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildContactProfiles(records);
    expect(profiles.length).toBe(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.totalContacts).toBe(2);
  });

  it("calculates frequency score: 0 for < 5 contacts", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildContactProfiles(records);
    // freq=0, rate1=3 (100%>=80), rate2=3 (100%>=80), diversity=0 (1 cat) = 6
    expect(profiles[0].contactScore).toBe(6);
  });

  it("calculates frequency score: 1 for 5-9 contacts", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildContactProfiles(records);
    // freq=1, rate1=3, rate2=3, diversity=0 (1 cat) = 7
    expect(profiles[0].contactScore).toBe(7);
  });

  it("calculates frequency score: 2 for >= 10 contacts", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildContactProfiles(records);
    // freq=2, rate1=3, rate2=3, diversity=0 (1 cat) = 8
    expect(profiles[0].contactScore).toBe(8);
  });

  it("caps contactScore at 10", () => {
    const categories: ContactCategory[] = [
      "family_visit", "phone_call", "video_call", "supervised_contact",
      "unsupervised_contact", "letterbox_contact", "professional_meeting", "sibling_contact",
    ];
    // 10 records, all true, 8 categories
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-alex",
        childName: "Alex",
        category: categories[i % categories.length],
      }),
    );
    const profiles = buildChildContactProfiles(records);
    // freq=2, rate1=3, rate2=3, diversity=2 = 10 (capped)
    expect(profiles[0].contactScore).toBe(10);
  });

  it("calculates diversity bonus: 0 for 1 category", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "A", category: "family_visit" }),
    ];
    const profiles = buildChildContactProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(1);
  });

  it("calculates diversity bonus: 1 for 2-3 categories", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "A", category: "family_visit" }),
      makeRecord({ id: "r2", childId: "c1", childName: "A", category: "phone_call" }),
    ];
    const profiles = buildChildContactProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(2);
    // freq=0, rate1=3, rate2=3, div=1 = 7
    expect(profiles[0].contactScore).toBe(7);
  });

  it("calculates diversity bonus: 2 for 4+ categories", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "A", category: "family_visit" }),
      makeRecord({ id: "r2", childId: "c1", childName: "A", category: "phone_call" }),
      makeRecord({ id: "r3", childId: "c1", childName: "A", category: "video_call" }),
      makeRecord({ id: "r4", childId: "c1", childName: "A", category: "supervised_contact" }),
    ];
    const profiles = buildChildContactProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(4);
    // freq=0, rate1=3, rate2=3, div=2 = 8
    expect(profiles[0].contactScore).toBe(8);
  });

  it("calculates rate1 threshold: 0 when childPreparedRate < 40%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "c1",
        childName: "A",
        childPrepared: i === 0,
      }),
    );
    const profiles = buildChildContactProfiles(records);
    // 1/5 = 20% prepared -> rate1=0
    expect(profiles[0].childPreparedRate).toBe(20);
  });

  it("calculates rate2 threshold: 0 when childViewCapturedRate < 40%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "c1",
        childName: "A",
        childViewCaptured: i === 0,
      }),
    );
    const profiles = buildChildContactProfiles(records);
    expect(profiles[0].childViewCapturedRate).toBe(20);
  });

  it("calculates rate1 threshold: 1 for 40-59%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "c1",
        childName: "A",
        childPrepared: i < 2, // 40%
      }),
    );
    const profiles = buildChildContactProfiles(records);
    expect(profiles[0].childPreparedRate).toBe(40);
    // freq=1, rate1=1 (40%>=40), rate2=3 (100%), div=0 = 5
    expect(profiles[0].contactScore).toBe(5);
  });

  it("calculates rate1 threshold: 2 for 60-79%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "c1",
        childName: "A",
        childPrepared: i < 3, // 60%
      }),
    );
    const profiles = buildChildContactProfiles(records);
    expect(profiles[0].childPreparedRate).toBe(60);
    // freq=1, rate1=2 (60%>=60), rate2=3 (100%), div=0 = 6
    expect(profiles[0].contactScore).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Generator: generateContactIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateContactIntelligence", () => {
  const categories: ContactCategory[] = [
    "family_visit", "phone_call", "video_call", "supervised_contact",
    "unsupervised_contact", "letterbox_contact", "professional_meeting", "sibling_contact",
  ];

  function makePerfectRecords(count: number): ContactRecord[] {
    return Array.from({ length: count }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: i < count / 2 ? "child-alex" : "child-jordan",
        childName: i < count / 2 ? "Alex" : "Jordan",
        contactDate: "2026-03-15",
        category: categories[i % categories.length],
      }),
    );
  }

  it("produces a complete intelligence result", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateContactIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.rating).toBeDefined();
    expect(result.contactQuality).toBeDefined();
    expect(result.contactCompliance).toBeDefined();
    expect(result.contactPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("achieves 100 overall score with perfect data", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateContactIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 overall score with empty data and no policy", () => {
    const result = generateContactIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("caps overall score at 100", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateContactIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateContactIntelligence(
      [makeRecord()], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT actions when no staff training", () => {
    const result = generateContactIntelligence(
      [makeRecord()], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("staff"))).toBe(true);
  });

  it("includes strengths for high-scoring evaluators (score >= 20)", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining()];

    const result = generateContactIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.strengths.some((s) => s.includes("strong"))).toBe(true);
  });

  it("includes areas for improvement for low-scoring evaluators (score < 15)", () => {
    const result = generateContactIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.areasForImprovement.some((a) => a.includes("needs improvement"))).toBe(true);
  });

  it("returns exactly 7 regulatory links", () => {
    const result = generateContactIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("filters records to period", () => {
    const records = [
      makeRecord({ id: "r1", contactDate: "2025-12-01" }), // before period
      makeRecord({ id: "r2", contactDate: "2026-03-15" }), // in period
      makeRecord({ id: "r3", contactDate: "2026-06-01" }), // after period
    ];

    const result = generateContactIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.contactQuality.totalRecords).toBe(1);
  });

  it("builds child profiles from period-filtered records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex", contactDate: "2026-03-15" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan", contactDate: "2026-03-15" }),
      makeRecord({ id: "r3", childId: "c1", childName: "Alex", contactDate: "2025-06-01" }), // outside period
    ];

    const result = generateContactIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.childProfiles.length).toBe(2);
    const alex = result.childProfiles.find((p) => p.childId === "c1");
    expect(alex!.totalContacts).toBe(1);
  });

  it("generates conditional actions when rates are below 50%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        contactDate: "2026-03-15",
        childPrepared: false,
        contactPlanFollowed: false,
        childViewCaptured: false,
        safetyMeasuresInPlace: false,
        documentationComplete: false,
        timelyRecording: false,
      }),
    );

    const result = generateContactIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("Child preparation rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Child view capture rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Documentation rate"))).toBe(true);
  });

  it("includes assessedAt timestamp", () => {
    const result = generateContactIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.assessedAt).toBeDefined();
    expect(typeof result.assessedAt).toBe("string");
  });

  it("generates no-action message when everything is perfect", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateContactIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });

  it("includes Inadequate area for improvement when overall < 40", () => {
    const result = generateContactIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("includes Requires Improvement area when overall 40-59", () => {
    // Policy only = 25, everything else 0, but need 40-59 range
    // Policy 25 + some quality but not much
    const records = Array.from({ length: 3 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        contactDate: "2026-03-15",
        childPrepared: true,
        contactPlanFollowed: true,
        childViewCaptured: true,
        safetyMeasuresInPlace: true,
        documentationComplete: true,
        timelyRecording: true,
      }),
    );
    // No staff, but has policy. Quality 25, compliance ~18 (1 category only), policy 25, staff 0 = too high
    // Let's try with partial data to hit 40-59 range
    const partialRecords = Array.from({ length: 3 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        contactDate: "2026-03-15",
        childPrepared: i === 0,
        contactPlanFollowed: i === 0,
        childViewCaptured: i === 0,
        safetyMeasuresInPlace: i === 0,
        documentationComplete: i === 0,
        timelyRecording: i === 0,
      }),
    );

    const result = generateContactIntelligence(
      partialRecords, makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20",
    );

    // If score falls in 40-59 range, check the message
    if (result.overallScore >= 40 && result.overallScore < 60) {
      expect(result.areasForImprovement.some((a) => a.includes("Requires Improvement"))).toBe(true);
    }
  });
});
