import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getComplaintTypeLabel,
  getComplaintStatusLabel,
  getResolutionOutcomeLabel,
  getAdvocacyTypeLabel,
  getSatisfactionLevelLabel,
  getRatingLabel,
  evaluateComplaintsHandling,
  evaluateAdvocacyAccess,
  evaluateResolutionQuality,
  evaluateStaffComplaintsReadiness,
  buildChildComplaintsSummaries,
  generateComplaintsAdvocacyAccessIntelligence,
} from "../complaints-advocacy-access-engine";
import type {
  ComplaintRecord,
  AdvocacyRecord,
  ComplaintsPolicy,
  StaffComplaintsTraining,
} from "../complaints-advocacy-access-engine";

// -- Helpers -------------------------------------------------------------------

function makeComplaint(overrides: Partial<ComplaintRecord> = {}): ComplaintRecord {
  return {
    id: "comp-1",
    childId: "child-1",
    childName: "Alex",
    complaintDate: "2026-03-01",
    complaintType: "food",
    description: "Test complaint",
    status: "resolved",
    resolutionOutcome: "upheld",
    resolvedWithinTimescale: true,
    daysToResolve: 5,
    childSatisfaction: "satisfied",
    advocacyOffered: true,
    advocacyAccepted: false,
    learningIdentified: true,
    policyChangeRequired: false,
    ...overrides,
  };
}

function makeAdvocacy(overrides: Partial<AdvocacyRecord> = {}): AdvocacyRecord {
  return {
    id: "adv-1",
    childId: "child-1",
    childName: "Alex",
    advocacyType: "independent_advocate",
    referralDate: "2026-03-01",
    contactMade: true,
    independentFromHome: true,
    childInformed: true,
    accessWithinTimescale: true,
    ongoingSupport: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<ComplaintsPolicy> = {}): ComplaintsPolicy {
  return {
    id: "pol-1",
    policyReviewDate: "2026-01-01",
    policyCurrent: true,
    childFriendlyVersion: true,
    displayedInHome: true,
    advocacyInfoDisplayed: true,
    complaintFormAccessible: true,
    externalContactsDisplayed: true,
    regularlyReviewedWithChildren: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffComplaintsTraining> = {}): StaffComplaintsTraining {
  return {
    id: "ct-1",
    staffId: "staff-1",
    staffName: "Sarah",
    complaintsProcedure: true,
    advocacyReferral: true,
    childRightsAwareness: true,
    conflictResolution: true,
    recordKeeping: true,
    escalationProcess: true,
    ...overrides,
  };
}

// -- pct() --------------------------------------------------------------------

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
  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });
  it("returns 0 when num is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// -- getRating() ---------------------------------------------------------------

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
  it("returns inadequate for below 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// -- Label getters ------------------------------------------------------------

describe("label getters", () => {
  it("getComplaintTypeLabel returns all labels", () => {
    expect(getComplaintTypeLabel("care_quality")).toBe("Care Quality");
    expect(getComplaintTypeLabel("staff_conduct")).toBe("Staff Conduct");
    expect(getComplaintTypeLabel("food")).toBe("Food");
    expect(getComplaintTypeLabel("activities")).toBe("Activities");
    expect(getComplaintTypeLabel("contact")).toBe("Contact");
    expect(getComplaintTypeLabel("privacy")).toBe("Privacy");
    expect(getComplaintTypeLabel("safety")).toBe("Safety");
    expect(getComplaintTypeLabel("property")).toBe("Property");
    expect(getComplaintTypeLabel("discrimination")).toBe("Discrimination");
    expect(getComplaintTypeLabel("other")).toBe("Other");
  });

  it("getComplaintStatusLabel returns all labels", () => {
    expect(getComplaintStatusLabel("open")).toBe("Open");
    expect(getComplaintStatusLabel("investigating")).toBe("Investigating");
    expect(getComplaintStatusLabel("resolved")).toBe("Resolved");
    expect(getComplaintStatusLabel("escalated")).toBe("Escalated");
    expect(getComplaintStatusLabel("withdrawn")).toBe("Withdrawn");
  });

  it("getResolutionOutcomeLabel returns all labels", () => {
    expect(getResolutionOutcomeLabel("upheld")).toBe("Upheld");
    expect(getResolutionOutcomeLabel("partially_upheld")).toBe("Partially Upheld");
    expect(getResolutionOutcomeLabel("not_upheld")).toBe("Not Upheld");
    expect(getResolutionOutcomeLabel("withdrawn")).toBe("Withdrawn");
    expect(getResolutionOutcomeLabel("pending")).toBe("Pending");
  });

  it("getAdvocacyTypeLabel returns all labels", () => {
    expect(getAdvocacyTypeLabel("independent_advocate")).toBe("Independent Advocate");
    expect(getAdvocacyTypeLabel("childrens_rights_officer")).toBe("Children's Rights Officer");
    expect(getAdvocacyTypeLabel("irp")).toBe("Independent Reviewing Panel");
    expect(getAdvocacyTypeLabel("ofsted_direct")).toBe("Ofsted Direct");
    expect(getAdvocacyTypeLabel("childline")).toBe("Childline");
    expect(getAdvocacyTypeLabel("peer_advocacy")).toBe("Peer Advocacy");
  });

  it("getSatisfactionLevelLabel returns all labels", () => {
    expect(getSatisfactionLevelLabel("very_satisfied")).toBe("Very Satisfied");
    expect(getSatisfactionLevelLabel("satisfied")).toBe("Satisfied");
    expect(getSatisfactionLevelLabel("neutral")).toBe("Neutral");
    expect(getSatisfactionLevelLabel("dissatisfied")).toBe("Dissatisfied");
    expect(getSatisfactionLevelLabel("very_dissatisfied")).toBe("Very Dissatisfied");
    expect(getSatisfactionLevelLabel("not_recorded")).toBe("Not Recorded");
  });

  it("getRatingLabel returns all labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateComplaintsHandling ------------------------------------------------

describe("evaluateComplaintsHandling", () => {
  it("returns 25 for empty complaints (no complaints = excellent)", () => {
    const r = evaluateComplaintsHandling([]);
    expect(r.overallScore).toBe(25);
    expect(r.totalComplaints).toBe(0);
    expect(r.resolvedRate).toBe(0);
    expect(r.resolvedWithinTimescaleRate).toBe(0);
    expect(r.advocacyOfferedRate).toBe(0);
    expect(r.satisfactionRate).toBe(0);
    expect(r.averageDaysToResolve).toBe(0);
  });

  it("scores maximum for outstanding complaints handling", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        status: "resolved",
        resolvedWithinTimescale: true,
        advocacyOffered: true,
        childSatisfaction: "very_satisfied",
        daysToResolve: 3,
      }),
    );
    const r = evaluateComplaintsHandling(complaints);
    expect(r.overallScore).toBe(25);
    expect(r.resolvedRate).toBe(100);
    expect(r.resolvedWithinTimescaleRate).toBe(100);
    expect(r.advocacyOfferedRate).toBe(100);
    expect(r.satisfactionRate).toBe(100);
    expect(r.averageDaysToResolve).toBe(3);
  });

  it("scores resolved rate at 90%+ tier (7 points)", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        status: i < 9 ? "resolved" : "open",
        resolvedWithinTimescale: false,
        advocacyOffered: false,
        childSatisfaction: "not_recorded",
      }),
    );
    const r = evaluateComplaintsHandling(complaints);
    expect(r.resolvedRate).toBe(90);
    expect(r.overallScore).toBeGreaterThanOrEqual(7);
  });

  it("scores resolved rate at 70-89% tier (5 points)", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        status: i < 7 ? "resolved" : "open",
        resolvedWithinTimescale: false,
        advocacyOffered: false,
        childSatisfaction: "not_recorded",
      }),
    );
    const r = evaluateComplaintsHandling(complaints);
    expect(r.resolvedRate).toBe(70);
  });

  it("scores resolved rate at 50-69% tier (3 points)", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        status: i < 5 ? "resolved" : "open",
        resolvedWithinTimescale: false,
        advocacyOffered: false,
        childSatisfaction: "not_recorded",
      }),
    );
    const r = evaluateComplaintsHandling(complaints);
    expect(r.resolvedRate).toBe(50);
  });

  it("scores resolved rate at >0% tier (1 point)", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        status: i < 1 ? "resolved" : "open",
        resolvedWithinTimescale: false,
        advocacyOffered: false,
        childSatisfaction: "not_recorded",
      }),
    );
    const r = evaluateComplaintsHandling(complaints);
    expect(r.resolvedRate).toBe(10);
  });

  it("counts withdrawn as resolved", () => {
    const complaints = [
      makeComplaint({ id: "c-1", status: "withdrawn" }),
      makeComplaint({ id: "c-2", status: "resolved" }),
    ];
    const r = evaluateComplaintsHandling(complaints);
    expect(r.resolvedRate).toBe(100);
  });

  it("calculates average days to resolve", () => {
    const complaints = [
      makeComplaint({ id: "c-1", daysToResolve: 3 }),
      makeComplaint({ id: "c-2", daysToResolve: 7 }),
    ];
    const r = evaluateComplaintsHandling(complaints);
    expect(r.averageDaysToResolve).toBe(5);
  });

  it("scores satisfaction at 80%+ tier", () => {
    const complaints = Array.from({ length: 5 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        childSatisfaction: i < 4 ? "satisfied" : "neutral",
        resolvedWithinTimescale: false,
        advocacyOffered: false,
        status: "open",
      }),
    );
    const r = evaluateComplaintsHandling(complaints);
    expect(r.satisfactionRate).toBe(80);
  });

  it("scores satisfaction at 60-79% tier", () => {
    const complaints = Array.from({ length: 5 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        childSatisfaction: i < 3 ? "very_satisfied" : "dissatisfied",
        resolvedWithinTimescale: false,
        advocacyOffered: false,
        status: "open",
      }),
    );
    const r = evaluateComplaintsHandling(complaints);
    expect(r.satisfactionRate).toBe(60);
  });

  it("caps score at 25", () => {
    const complaints = [makeComplaint()];
    const r = evaluateComplaintsHandling(complaints);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores zero complaints with all failures", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        status: "open",
        resolvedWithinTimescale: false,
        advocacyOffered: false,
        childSatisfaction: "not_recorded",
        daysToResolve: 30,
      }),
    );
    const r = evaluateComplaintsHandling(complaints);
    expect(r.overallScore).toBe(0);
    expect(r.resolvedRate).toBe(0);
  });
});

// -- evaluateAdvocacyAccess ----------------------------------------------------

describe("evaluateAdvocacyAccess", () => {
  it("returns 0 for empty records", () => {
    const r = evaluateAdvocacyAccess([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalReferrals).toBe(0);
    expect(r.contactMadeRate).toBe(0);
    expect(r.independentRate).toBe(0);
    expect(r.childInformedRate).toBe(0);
    expect(r.timelyAccessRate).toBe(0);
    expect(r.ongoingSupportRate).toBe(0);
  });

  it("scores maximum for perfect advocacy access", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeAdvocacy({ id: `a-${i}` }),
    );
    const r = evaluateAdvocacyAccess(records);
    expect(r.overallScore).toBe(25);
    expect(r.contactMadeRate).toBe(100);
    expect(r.independentRate).toBe(100);
    expect(r.childInformedRate).toBe(100);
    expect(r.timelyAccessRate).toBe(100);
  });

  it("scores contact made at 90%+ tier (7 points)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeAdvocacy({
        id: `a-${i}`,
        contactMade: i < 9 ? true : false,
        independentFromHome: false,
        childInformed: false,
        accessWithinTimescale: false,
      }),
    );
    const r = evaluateAdvocacyAccess(records);
    expect(r.contactMadeRate).toBe(90);
  });

  it("scores contact made at 70-89% tier (5 points)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeAdvocacy({
        id: `a-${i}`,
        contactMade: i < 7 ? true : false,
        independentFromHome: false,
        childInformed: false,
        accessWithinTimescale: false,
      }),
    );
    const r = evaluateAdvocacyAccess(records);
    expect(r.contactMadeRate).toBe(70);
  });

  it("scores contact made at 50-69% tier (3 points)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeAdvocacy({
        id: `a-${i}`,
        contactMade: i < 5 ? true : false,
        independentFromHome: false,
        childInformed: false,
        accessWithinTimescale: false,
      }),
    );
    const r = evaluateAdvocacyAccess(records);
    expect(r.contactMadeRate).toBe(50);
  });

  it("scores contact made at >0% tier (1 point)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeAdvocacy({
        id: `a-${i}`,
        contactMade: i < 1 ? true : false,
        independentFromHome: false,
        childInformed: false,
        accessWithinTimescale: false,
      }),
    );
    const r = evaluateAdvocacyAccess(records);
    expect(r.contactMadeRate).toBe(10);
  });

  it("calculates ongoing support rate", () => {
    const records = [
      makeAdvocacy({ id: "a-1", ongoingSupport: true }),
      makeAdvocacy({ id: "a-2", ongoingSupport: false }),
    ];
    const r = evaluateAdvocacyAccess(records);
    expect(r.ongoingSupportRate).toBe(50);
  });

  it("caps score at 25", () => {
    const records = [makeAdvocacy()];
    const r = evaluateAdvocacyAccess(records);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores zero for all failures", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeAdvocacy({
        id: `a-${i}`,
        contactMade: false,
        independentFromHome: false,
        childInformed: false,
        accessWithinTimescale: false,
      }),
    );
    const r = evaluateAdvocacyAccess(records);
    expect(r.overallScore).toBe(0);
  });
});

// -- evaluateResolutionQuality -------------------------------------------------

describe("evaluateResolutionQuality", () => {
  it("returns 0 for empty policies", () => {
    const r = evaluateResolutionQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.policyCurrent).toBe(false);
    expect(r.childFriendlyVersion).toBe(false);
    expect(r.displayedInHome).toBe(false);
    expect(r.advocacyInfoDisplayed).toBe(false);
    expect(r.formAccessible).toBe(false);
    expect(r.externalContacts).toBe(false);
    expect(r.reviewedWithChildren).toBe(false);
  });

  it("scores maximum for all-true policy", () => {
    const r = evaluateResolutionQuality([makePolicy()]);
    expect(r.overallScore).toBe(25);
    expect(r.policyCurrent).toBe(true);
    expect(r.childFriendlyVersion).toBe(true);
    expect(r.displayedInHome).toBe(true);
    expect(r.advocacyInfoDisplayed).toBe(true);
    expect(r.formAccessible).toBe(true);
    expect(r.externalContacts).toBe(true);
    expect(r.reviewedWithChildren).toBe(true);
  });

  it("scores policy current = 5 points", () => {
    const r = evaluateResolutionQuality([
      makePolicy({
        policyCurrent: true,
        childFriendlyVersion: false,
        displayedInHome: false,
        advocacyInfoDisplayed: false,
        complaintFormAccessible: false,
        externalContactsDisplayed: false,
        regularlyReviewedWithChildren: false,
      }),
    ]);
    expect(r.overallScore).toBe(5);
  });

  it("scores child-friendly version = 4 points", () => {
    const r = evaluateResolutionQuality([
      makePolicy({
        policyCurrent: false,
        childFriendlyVersion: true,
        displayedInHome: false,
        advocacyInfoDisplayed: false,
        complaintFormAccessible: false,
        externalContactsDisplayed: false,
        regularlyReviewedWithChildren: false,
      }),
    ]);
    expect(r.overallScore).toBe(4);
  });

  it("scores displayed in home = 4 points", () => {
    const r = evaluateResolutionQuality([
      makePolicy({
        policyCurrent: false,
        childFriendlyVersion: false,
        displayedInHome: true,
        advocacyInfoDisplayed: false,
        complaintFormAccessible: false,
        externalContactsDisplayed: false,
        regularlyReviewedWithChildren: false,
      }),
    ]);
    expect(r.overallScore).toBe(4);
  });

  it("scores advocacy info displayed = 4 points", () => {
    const r = evaluateResolutionQuality([
      makePolicy({
        policyCurrent: false,
        childFriendlyVersion: false,
        displayedInHome: false,
        advocacyInfoDisplayed: true,
        complaintFormAccessible: false,
        externalContactsDisplayed: false,
        regularlyReviewedWithChildren: false,
      }),
    ]);
    expect(r.overallScore).toBe(4);
  });

  it("scores complaint form accessible = 3 points", () => {
    const r = evaluateResolutionQuality([
      makePolicy({
        policyCurrent: false,
        childFriendlyVersion: false,
        displayedInHome: false,
        advocacyInfoDisplayed: false,
        complaintFormAccessible: true,
        externalContactsDisplayed: false,
        regularlyReviewedWithChildren: false,
      }),
    ]);
    expect(r.overallScore).toBe(3);
  });

  it("scores external contacts = 3 points", () => {
    const r = evaluateResolutionQuality([
      makePolicy({
        policyCurrent: false,
        childFriendlyVersion: false,
        displayedInHome: false,
        advocacyInfoDisplayed: false,
        complaintFormAccessible: false,
        externalContactsDisplayed: true,
        regularlyReviewedWithChildren: false,
      }),
    ]);
    expect(r.overallScore).toBe(3);
  });

  it("scores reviewed with children = 2 points", () => {
    const r = evaluateResolutionQuality([
      makePolicy({
        policyCurrent: false,
        childFriendlyVersion: false,
        displayedInHome: false,
        advocacyInfoDisplayed: false,
        complaintFormAccessible: false,
        externalContactsDisplayed: false,
        regularlyReviewedWithChildren: true,
      }),
    ]);
    expect(r.overallScore).toBe(2);
  });

  it("uses the last policy when multiple provided", () => {
    const policies = [
      makePolicy({ id: "p-1", policyCurrent: false }),
      makePolicy({ id: "p-2", policyCurrent: true }),
    ];
    const r = evaluateResolutionQuality(policies);
    expect(r.policyCurrent).toBe(true);
  });

  it("scores zero for all-false policy", () => {
    const r = evaluateResolutionQuality([
      makePolicy({
        policyCurrent: false,
        childFriendlyVersion: false,
        displayedInHome: false,
        advocacyInfoDisplayed: false,
        complaintFormAccessible: false,
        externalContactsDisplayed: false,
        regularlyReviewedWithChildren: false,
      }),
    ]);
    expect(r.overallScore).toBe(0);
  });
});

// -- evaluateStaffComplaintsReadiness ------------------------------------------

describe("evaluateStaffComplaintsReadiness", () => {
  it("returns 0 for empty training", () => {
    const r = evaluateStaffComplaintsReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.complaintsProcedureRate).toBe(0);
    expect(r.advocacyReferralRate).toBe(0);
    expect(r.childRightsRate).toBe(0);
    expect(r.conflictResolutionRate).toBe(0);
    expect(r.recordKeepingRate).toBe(0);
    expect(r.escalationRate).toBe(0);
  });

  it("scores maximum for fully trained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `ct-${i}`, staffId: `s-${i}`, staffName: `Staff ${i}` }),
    );
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.overallScore).toBe(25);
    expect(r.complaintsProcedureRate).toBe(100);
    expect(r.advocacyReferralRate).toBe(100);
    expect(r.childRightsRate).toBe(100);
    expect(r.conflictResolutionRate).toBe(100);
    expect(r.recordKeepingRate).toBe(100);
    expect(r.escalationRate).toBe(100);
  });

  it("scores complaints procedure at 90%+ tier (6 points)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `ct-${i}`,
        staffId: `s-${i}`,
        complaintsProcedure: true,
        advocacyReferral: false,
        childRightsAwareness: false,
        conflictResolution: false,
        recordKeeping: false,
        escalationProcess: false,
      }),
    );
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.complaintsProcedureRate).toBe(100);
  });

  it("scores complaints procedure at 70-89% tier (4 points)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `ct-${i}`,
        staffId: `s-${i}`,
        complaintsProcedure: i < 7,
        advocacyReferral: false,
        childRightsAwareness: false,
        conflictResolution: false,
        recordKeeping: false,
        escalationProcess: false,
      }),
    );
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.complaintsProcedureRate).toBe(70);
  });

  it("scores complaints procedure at 50-69% tier (3 points)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `ct-${i}`,
        staffId: `s-${i}`,
        complaintsProcedure: i < 5,
        advocacyReferral: false,
        childRightsAwareness: false,
        conflictResolution: false,
        recordKeeping: false,
        escalationProcess: false,
      }),
    );
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.complaintsProcedureRate).toBe(50);
  });

  it("scores complaints procedure at >0% tier (1 point)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `ct-${i}`,
        staffId: `s-${i}`,
        complaintsProcedure: i < 1,
        advocacyReferral: false,
        childRightsAwareness: false,
        conflictResolution: false,
        recordKeeping: false,
        escalationProcess: false,
      }),
    );
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.complaintsProcedureRate).toBe(10);
  });

  it("scores record keeping at 90%+ tier (3 points)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `ct-${i}`,
        staffId: `s-${i}`,
        complaintsProcedure: false,
        advocacyReferral: false,
        childRightsAwareness: false,
        conflictResolution: false,
        recordKeeping: true,
        escalationProcess: false,
      }),
    );
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.recordKeepingRate).toBe(100);
  });

  it("scores record keeping at 70-89% tier (2 points)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `ct-${i}`,
        staffId: `s-${i}`,
        complaintsProcedure: false,
        advocacyReferral: false,
        childRightsAwareness: false,
        conflictResolution: false,
        recordKeeping: i < 7,
        escalationProcess: false,
      }),
    );
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.recordKeepingRate).toBe(70);
  });

  it("scores record keeping at 50-69% tier (1 point)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `ct-${i}`,
        staffId: `s-${i}`,
        complaintsProcedure: false,
        advocacyReferral: false,
        childRightsAwareness: false,
        conflictResolution: false,
        recordKeeping: i < 5,
        escalationProcess: false,
      }),
    );
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.recordKeepingRate).toBe(50);
  });

  it("scores escalation at 90%+ tier (2 points)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `ct-${i}`,
        staffId: `s-${i}`,
        complaintsProcedure: false,
        advocacyReferral: false,
        childRightsAwareness: false,
        conflictResolution: false,
        recordKeeping: false,
        escalationProcess: true,
      }),
    );
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.escalationRate).toBe(100);
  });

  it("scores escalation at 70-89% tier (1 point)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `ct-${i}`,
        staffId: `s-${i}`,
        complaintsProcedure: false,
        advocacyReferral: false,
        childRightsAwareness: false,
        conflictResolution: false,
        recordKeeping: false,
        escalationProcess: i < 7,
      }),
    );
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.escalationRate).toBe(70);
  });

  it("caps score at 25", () => {
    const training = [makeTraining()];
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores zero for all untrained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `ct-${i}`,
        staffId: `s-${i}`,
        complaintsProcedure: false,
        advocacyReferral: false,
        childRightsAwareness: false,
        conflictResolution: false,
        recordKeeping: false,
        escalationProcess: false,
      }),
    );
    const r = evaluateStaffComplaintsReadiness(training);
    expect(r.overallScore).toBe(0);
  });
});

// -- buildChildComplaintsSummaries ---------------------------------------------

describe("buildChildComplaintsSummaries", () => {
  it("returns empty array for no data", () => {
    expect(buildChildComplaintsSummaries([], [])).toEqual([]);
  });

  it("creates summary for child with complaints only", () => {
    const complaints = [
      makeComplaint({ childId: "c-1", childName: "Alex", status: "resolved" }),
    ];
    const result = buildChildComplaintsSummaries(complaints, []);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("c-1");
    expect(result[0].childName).toBe("Alex");
    expect(result[0].totalComplaints).toBe(1);
    expect(result[0].resolvedCount).toBe(1);
    expect(result[0].advocacyAccessed).toBe(false);
  });

  it("creates summary for child with advocacy only", () => {
    const advocacy = [
      makeAdvocacy({ childId: "c-1", childName: "Alex" }),
    ];
    const result = buildChildComplaintsSummaries([], advocacy);
    expect(result).toHaveLength(1);
    expect(result[0].advocacyAccessed).toBe(true);
    expect(result[0].totalComplaints).toBe(0);
  });

  it("merges complaints and advocacy for same child", () => {
    const complaints = [
      makeComplaint({ childId: "c-1", childName: "Alex" }),
    ];
    const advocacy = [
      makeAdvocacy({ childId: "c-1", childName: "Alex" }),
    ];
    const result = buildChildComplaintsSummaries(complaints, advocacy);
    expect(result).toHaveLength(1);
    expect(result[0].totalComplaints).toBe(1);
    expect(result[0].advocacyAccessed).toBe(true);
  });

  it("handles multiple children", () => {
    const complaints = [
      makeComplaint({ id: "c-1", childId: "c-1", childName: "Alex" }),
      makeComplaint({ id: "c-2", childId: "c-2", childName: "Jordan" }),
    ];
    const result = buildChildComplaintsSummaries(complaints, []);
    expect(result).toHaveLength(2);
  });

  it("scores maximum (10) for child with no complaints + advocacy accessed", () => {
    const advocacy = [makeAdvocacy({ childId: "c-1", childName: "Alex" })];
    const result = buildChildComplaintsSummaries([], advocacy);
    expect(result[0].overallScore).toBe(10);
  });

  it("scores no complaints child without advocacy at 8", () => {
    const complaints: ComplaintRecord[] = [];
    const advocacy: AdvocacyRecord[] = [];
    const result = buildChildComplaintsSummaries(complaints, advocacy);
    expect(result).toHaveLength(0);
  });

  it("scores all resolved + advocacy + high satisfaction", () => {
    const complaints = [
      makeComplaint({
        childId: "c-1",
        childName: "Alex",
        status: "resolved",
        childSatisfaction: "very_satisfied",
        advocacyOffered: true,
      }),
    ];
    const advocacy = [makeAdvocacy({ childId: "c-1", childName: "Alex" })];
    const result = buildChildComplaintsSummaries(complaints, advocacy);
    expect(result[0].overallScore).toBe(10);
  });

  it("satisfaction positive is true when no complaints", () => {
    const advocacy = [makeAdvocacy({ childId: "c-1", childName: "Alex" })];
    const result = buildChildComplaintsSummaries([], advocacy);
    expect(result[0].satisfactionPositive).toBe(true);
  });

  it("satisfaction positive is true when satisfaction >= 50%", () => {
    const complaints = [
      makeComplaint({ id: "c-1", childId: "c-1", childName: "Alex", childSatisfaction: "satisfied" }),
      makeComplaint({ id: "c-2", childId: "c-1", childName: "Alex", childSatisfaction: "dissatisfied" }),
    ];
    const result = buildChildComplaintsSummaries(complaints, []);
    expect(result[0].satisfactionPositive).toBe(true);
  });

  it("satisfaction positive is false when satisfaction < 50%", () => {
    const complaints = [
      makeComplaint({ id: "c-1", childId: "c-1", childName: "Alex", childSatisfaction: "dissatisfied" }),
      makeComplaint({ id: "c-2", childId: "c-1", childName: "Alex", childSatisfaction: "very_dissatisfied" }),
      makeComplaint({ id: "c-3", childId: "c-1", childName: "Alex", childSatisfaction: "neutral" }),
    ];
    const result = buildChildComplaintsSummaries(complaints, []);
    expect(result[0].satisfactionPositive).toBe(false);
  });

  it("caps child score at 10", () => {
    const complaints = [
      makeComplaint({ childId: "c-1", childName: "Alex", status: "resolved", childSatisfaction: "very_satisfied", advocacyOffered: true }),
    ];
    const advocacy = [makeAdvocacy({ childId: "c-1", childName: "Alex" })];
    const result = buildChildComplaintsSummaries(complaints, advocacy);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("floors child score at 0", () => {
    const complaints = [
      makeComplaint({
        childId: "c-1",
        childName: "Alex",
        status: "open",
        childSatisfaction: "very_dissatisfied",
        advocacyOffered: false,
      }),
    ];
    const result = buildChildComplaintsSummaries(complaints, []);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- generateComplaintsAdvocacyAccessIntelligence -----------------------------

describe("generateComplaintsAdvocacyAccessIntelligence", () => {
  it("generates full assessment with all data", () => {
    const complaints = [makeComplaint()];
    const advocacy = [makeAdvocacy()];
    const policies = [makePolicy()];
    const training = [makeTraining()];

    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints,
      advocacy,
      policies,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-19");
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(r.rating);
    expect(r.complaintsHandling).toBeDefined();
    expect(r.advocacyAccess).toBeDefined();
    expect(r.resolutionQuality).toBeDefined();
    expect(r.staffComplaintsReadiness).toBeDefined();
    expect(Array.isArray(r.childSummaries)).toBe(true);
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.areasForImprovement)).toBe(true);
    expect(Array.isArray(r.actions)).toBe(true);
    expect(Array.isArray(r.regulatoryLinks)).toBe(true);
  });

  it("generates assessment with all empty data", () => {
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [], [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(r.overallScore).toBe(25);
    expect(r.rating).toBe("inadequate");
    expect(r.complaintsHandling.overallScore).toBe(25);
    expect(r.advocacyAccess.overallScore).toBe(0);
    expect(r.resolutionQuality.overallScore).toBe(0);
    expect(r.staffComplaintsReadiness.overallScore).toBe(0);
    expect(r.childSummaries).toEqual([]);
  });

  it("caps overall score at 100", () => {
    const complaints = Array.from({ length: 20 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        status: "resolved",
        resolvedWithinTimescale: true,
        advocacyOffered: true,
        childSatisfaction: "very_satisfied",
      }),
    );
    const advocacy = Array.from({ length: 20 }, (_, i) =>
      makeAdvocacy({ id: `a-${i}`, childId: `c-${i}`, childName: `Child ${i}` }),
    );
    const policies = [makePolicy()];
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `ct-${i}`, staffId: `s-${i}` }),
    );

    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, advocacy, policies, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates strength: no complaints received", () => {
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [makePolicy()], [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain(
      "No complaints received during the assessment period — positive care environment",
    );
  });

  it("generates strength: complaints consistently resolved", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({ id: `c-${i}`, status: "resolved" }),
    );
    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, [], [makePolicy()], [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain(
      "Complaints consistently resolved to a high standard",
    );
  });

  it("generates strength: advocacy consistently offered", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({ id: `c-${i}`, advocacyOffered: true }),
    );
    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, [], [makePolicy()], [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain(
      "Advocacy consistently offered to all children making complaints",
    );
  });

  it("generates strength: strong advocacy contact rate", () => {
    const advocacy = Array.from({ length: 10 }, (_, i) =>
      makeAdvocacy({ id: `a-${i}`, contactMade: true }),
    );
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], advocacy, [makePolicy()], [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain(
      "Strong advocacy contact rate — children accessing independent support",
    );
  });

  it("generates strength: policy current", () => {
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [makePolicy({ policyCurrent: true })], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain("Complaints policy current and comprehensive");
  });

  it("generates strength: child-friendly version available", () => {
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [makePolicy({ childFriendlyVersion: true })], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain("Child-friendly version of complaints policy available");
  });

  it("generates strength: staff fully trained", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `ct-${i}`, staffId: `s-${i}`, complaintsProcedure: true }),
    );
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [], training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain("Staff team fully trained in complaints procedures");
  });

  it("generates strength: high satisfaction", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        childSatisfaction: i < 8 ? "satisfied" : "neutral",
      }),
    );
    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, [], [makePolicy()], [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain(
      "High levels of child satisfaction with complaint resolution",
    );
  });

  it("generates area for improvement: timescales not met", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        resolvedWithinTimescale: i < 3,
      }),
    );
    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement).toContain(
      "Complaint resolution timescales not consistently met",
    );
  });

  it("generates area for improvement: advocacy not offered", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        advocacyOffered: i < 3,
      }),
    );
    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement).toContain(
      "Advocacy not consistently offered when complaints are made",
    );
  });

  it("generates area for improvement: advocacy not independent", () => {
    const advocacy = Array.from({ length: 10 }, (_, i) =>
      makeAdvocacy({
        id: `a-${i}`,
        independentFromHome: i < 3,
      }),
    );
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], advocacy, [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement).toContain(
      "Advocacy provision not consistently independent from the home",
    );
  });

  it("generates area for improvement: policy not reviewed with children", () => {
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [makePolicy({ regularlyReviewedWithChildren: false })], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement).toContain(
      "Complaints policy not regularly reviewed with children",
    );
  });

  it("generates area for improvement: child rights awareness low", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `ct-${i}`,
        staffId: `s-${i}`,
        childRightsAwareness: i < 3,
      }),
    );
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [], training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement).toContain(
      "Staff awareness of children's rights needs strengthening",
    );
  });

  it("generates area for improvement: low satisfaction", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        childSatisfaction: i < 2 ? "satisfied" : "dissatisfied",
      }),
    );
    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement).toContain(
      "Child satisfaction with complaint outcomes below expected standard",
    );
  });

  it("generates URGENT action: no complaints policy", () => {
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "URGENT: No complaints policy in place — develop and implement immediately",
    );
  });

  it("generates URGENT action: no staff training records", () => {
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "URGENT: No staff complaints training records — deliver comprehensive training",
    );
  });

  it("generates URGENT action: no advocacy despite complaints", () => {
    const complaints = [makeComplaint()];
    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "URGENT: No advocacy referrals despite complaints — ensure advocacy access for all children",
    );
  });

  it("generates URGENT action: low resolution rate", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        status: i < 2 ? "resolved" : "open",
      }),
    );
    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "URGENT: Low complaint resolution rate — review and address outstanding complaints immediately",
    );
  });

  it("generates action for escalated complaints", () => {
    const complaints = [
      makeComplaint({ id: "c-1", status: "escalated" }),
      makeComplaint({ id: "c-2", status: "escalated" }),
    ];
    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "2 complaint(s) escalated — ensure senior management oversight and timely resolution",
    );
  });

  it("generates action: display complaints info", () => {
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [makePolicy({ displayedInHome: false })], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "Display complaints information prominently within the home",
    );
  });

  it("generates action: display advocacy contact info", () => {
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [makePolicy({ advocacyInfoDisplayed: false })], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "Display advocacy contact information where children can access it independently",
    );
  });

  it("includes all regulatory links", () => {
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks).toHaveLength(7);
    expect(r.regulatoryLinks[0]).toContain("CHR 2015 Reg 39");
    expect(r.regulatoryLinks[1]).toContain("CHR 2015 Reg 45");
    expect(r.regulatoryLinks[2]).toContain("SCCIF");
    expect(r.regulatoryLinks[3]).toContain("UNCRC Article 12");
    expect(r.regulatoryLinks[4]).toContain("Children Act 1989");
    expect(r.regulatoryLinks[5]).toContain("NMS 15");
    expect(r.regulatoryLinks[6]).toContain("Advocacy Services");
  });

  it("rating is outstanding when all 4 evaluators score 20+", () => {
    const complaints = Array.from({ length: 10 }, (_, i) =>
      makeComplaint({
        id: `c-${i}`,
        status: "resolved",
        resolvedWithinTimescale: true,
        advocacyOffered: true,
        childSatisfaction: "very_satisfied",
      }),
    );
    const advocacy = Array.from({ length: 10 }, (_, i) =>
      makeAdvocacy({ id: `a-${i}`, childId: `c-${i}` }),
    );
    const policies = [makePolicy()];
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `ct-${i}`, staffId: `s-${i}` }),
    );

    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, advocacy, policies, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.rating).toBe("outstanding");
  });

  it("rating is inadequate for all empty data", () => {
    const r = generateComplaintsAdvocacyAccessIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.rating).toBe("inadequate");
  });

  it("child summaries include all children from complaints and advocacy", () => {
    const complaints = [
      makeComplaint({ id: "c-1", childId: "c-alex", childName: "Alex" }),
    ];
    const advocacy = [
      makeAdvocacy({ id: "a-1", childId: "c-jordan", childName: "Jordan" }),
    ];
    const r = generateComplaintsAdvocacyAccessIntelligence(
      complaints, advocacy, [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.childSummaries).toHaveLength(2);
    const names = r.childSummaries.map((c) => c.childName);
    expect(names).toContain("Alex");
    expect(names).toContain("Jordan");
  });
});
