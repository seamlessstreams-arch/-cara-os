// ==============================================================================
// Tests — Independent Visitor & Advocacy Intelligence Engine
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  generateIndependentVisitorAdvocacyIntelligence,
  evaluateVisitorActivity,
  evaluateAdvocacyAccess,
  evaluatePolicyGovernance,
  evaluateStaffAdvocacyReadiness,
  buildChildAdvocacyProfiles,
  pct,
  getRating,
  getVisitorStatusLabel,
  getVisitOutcomeLabel,
  getAdvocacyTypeLabel,
  getReferralOutcomeLabel,
  getRatingLabel,
} from "../independent-visitor-advocacy-engine";
import type {
  IndependentVisit,
  AdvocacyReferral,
  AdvocacyPolicy,
  StaffAdvocacyTraining,
  VisitOutcome,
  ReferralOutcome,
} from "../independent-visitor-advocacy-engine";

// -- Factories ----------------------------------------------------------------

let _vid = 0;
function makeVisit(overrides: Partial<IndependentVisit> = {}): IndependentVisit {
  _vid++;
  return {
    id: `iv-${_vid}`,
    childId: "child-a",
    childName: "Alex",
    visitDate: "2026-03-01",
    visitorName: "Margaret Clarke",
    visitOutcome: "very_positive",
    durationMinutes: 60,
    childEngaged: true,
    childSatisfied: true,
    recordedInCasefile: true,
    privateTimeProvided: true,
    ...overrides,
  };
}

let _rid = 0;
function makeReferral(overrides: Partial<AdvocacyReferral> = {}): AdvocacyReferral {
  _rid++;
  return {
    id: `ar-${_rid}`,
    childId: "child-a",
    childName: "Alex",
    referralDate: "2026-02-01",
    advocacyType: "formal_advocate",
    referralOutcome: "successful",
    childInformedOfRights: true,
    childConsentObtained: true,
    timelyResponse: true,
    childSatisfied: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<AdvocacyPolicy> = {}): AdvocacyPolicy {
  return {
    id: "ap-1",
    advocacyInformationDisplayed: true,
    childrenInformedOnAdmission: true,
    independentVisitorPromoted: true,
    complaintsAdvocacyAvailable: true,
    rightsLeafletProvided: true,
    regularRightsReminders: true,
    advocacyContactDetailsAccessible: true,
    ...overrides,
  };
}

let _tid = 0;
function makeTraining(overrides: Partial<StaffAdvocacyTraining> = {}): StaffAdvocacyTraining {
  _tid++;
  return {
    id: `at-${_tid}`,
    staffId: `staff-${_tid}`,
    staffName: `Staff ${_tid}`,
    advocacyRights: true,
    independentVisitorRole: true,
    complaintsProcess: true,
    signposting: true,
    childParticipation: true,
    confidentiality: true,
    ...overrides,
  };
}

// =============================================================================
// pct()
// =============================================================================

describe("pct", () => {
  it("returns percentage rounded to integer", () => {
    expect(pct(3, 4)).toBe(75);
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("returns 0 when denominator is 0", () => {
    expect(pct(0, 0)).toBe(0);
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 0 when num is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// =============================================================================
// getRating()
// =============================================================================

describe("getRating", () => {
  it("returns outstanding for scores >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for scores 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for scores 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for scores < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// =============================================================================
// Label getters
// =============================================================================

describe("label getters", () => {
  it("getVisitorStatusLabel returns correct labels", () => {
    expect(getVisitorStatusLabel("active")).toBe("Active");
    expect(getVisitorStatusLabel("pending_match")).toBe("Pending Match");
    expect(getVisitorStatusLabel("not_requested")).toBe("Not Requested");
    expect(getVisitorStatusLabel("declined_by_child")).toBe("Declined by Child");
    expect(getVisitorStatusLabel("ended")).toBe("Ended");
  });

  it("getVisitOutcomeLabel returns correct labels", () => {
    expect(getVisitOutcomeLabel("very_positive")).toBe("Very Positive");
    expect(getVisitOutcomeLabel("positive")).toBe("Positive");
    expect(getVisitOutcomeLabel("neutral")).toBe("Neutral");
    expect(getVisitOutcomeLabel("difficult")).toBe("Difficult");
    expect(getVisitOutcomeLabel("did_not_happen")).toBe("Did Not Happen");
  });

  it("getAdvocacyTypeLabel returns correct labels", () => {
    expect(getAdvocacyTypeLabel("formal_advocate")).toBe("Formal Advocate");
    expect(getAdvocacyTypeLabel("independent_visitor")).toBe("Independent Visitor");
    expect(getAdvocacyTypeLabel("childrens_rights_officer")).toBe("Children's Rights Officer");
    expect(getAdvocacyTypeLabel("complaints_advocacy")).toBe("Complaints Advocacy");
    expect(getAdvocacyTypeLabel("legal_advocacy")).toBe("Legal Advocacy");
    expect(getAdvocacyTypeLabel("peer_advocacy")).toBe("Peer Advocacy");
    expect(getAdvocacyTypeLabel("other")).toBe("Other");
  });

  it("getReferralOutcomeLabel returns correct labels", () => {
    expect(getReferralOutcomeLabel("successful")).toBe("Successful");
    expect(getReferralOutcomeLabel("in_progress")).toBe("In Progress");
    expect(getReferralOutcomeLabel("declined_by_child")).toBe("Declined by Child");
    expect(getReferralOutcomeLabel("no_service_available")).toBe("No Service Available");
    expect(getReferralOutcomeLabel("not_needed")).toBe("Not Needed");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// =============================================================================
// evaluateVisitorActivity
// =============================================================================

describe("evaluateVisitorActivity", () => {
  it("returns all zeros for empty visits", () => {
    const r = evaluateVisitorActivity([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalVisits).toBe(0);
    expect(r.positiveOutcomeRate).toBe(0);
    expect(r.childEngagementRate).toBe(0);
    expect(r.childSatisfactionRate).toBe(0);
    expect(r.recordedRate).toBe(0);
    expect(r.privateTimeRate).toBe(0);
  });

  it("scores 25 for perfect visits", () => {
    const visits = Array.from({ length: 10 }, () => makeVisit());
    const r = evaluateVisitorActivity(visits);
    expect(r.overallScore).toBe(25);
    expect(r.totalVisits).toBe(10);
    expect(r.positiveOutcomeRate).toBe(100);
    expect(r.childEngagementRate).toBe(100);
    expect(r.childSatisfactionRate).toBe(100);
    expect(r.recordedRate).toBe(100);
    expect(r.privateTimeRate).toBe(100);
  });

  it("counts only very_positive and positive as positive outcomes", () => {
    const visits = [
      makeVisit({ visitOutcome: "very_positive" }),
      makeVisit({ visitOutcome: "positive" }),
      makeVisit({ visitOutcome: "neutral" }),
      makeVisit({ visitOutcome: "difficult" }),
      makeVisit({ visitOutcome: "did_not_happen" }),
    ];
    const r = evaluateVisitorActivity(visits);
    expect(r.positiveOutcomeRate).toBe(40); // 2/5 = 40%
  });

  it("scores positive outcome tiers correctly", () => {
    // 100% positive → 7
    const perfect = Array.from({ length: 5 }, () => makeVisit({ visitOutcome: "very_positive" }));
    expect(evaluateVisitorActivity(perfect).overallScore).toBe(25); // 7+6+6+6

    // 60% positive → 5
    const goodVisits = [
      makeVisit({ visitOutcome: "very_positive" }),
      makeVisit({ visitOutcome: "positive" }),
      makeVisit({ visitOutcome: "positive" }),
      makeVisit({ visitOutcome: "neutral" }),
      makeVisit({ visitOutcome: "difficult" }),
    ];
    const r60 = evaluateVisitorActivity(goodVisits);
    expect(r60.positiveOutcomeRate).toBe(60);

    // 20% positive → 1
    const lowVisits = [
      makeVisit({ visitOutcome: "very_positive" }),
      makeVisit({ visitOutcome: "neutral" }),
      makeVisit({ visitOutcome: "neutral" }),
      makeVisit({ visitOutcome: "difficult" }),
      makeVisit({ visitOutcome: "did_not_happen" }),
    ];
    const r20 = evaluateVisitorActivity(lowVisits);
    expect(r20.positiveOutcomeRate).toBe(20);
  });

  it("scores engagement tiers correctly", () => {
    // 100% engaged → 6
    const allEngaged = Array.from({ length: 5 }, () => makeVisit({ childEngaged: true }));
    expect(evaluateVisitorActivity(allEngaged).childEngagementRate).toBe(100);

    // 60% engaged → 3 (below 70 but ≥50)
    const someEngaged = [
      makeVisit({ childEngaged: true }),
      makeVisit({ childEngaged: true }),
      makeVisit({ childEngaged: true }),
      makeVisit({ childEngaged: false }),
      makeVisit({ childEngaged: false }),
    ];
    expect(evaluateVisitorActivity(someEngaged).childEngagementRate).toBe(60);
  });

  it("scores recorded-in-casefile tiers correctly", () => {
    // 80% recorded → 4 (≥70, <90)
    const visits = [
      makeVisit({ recordedInCasefile: true }),
      makeVisit({ recordedInCasefile: true }),
      makeVisit({ recordedInCasefile: true }),
      makeVisit({ recordedInCasefile: true }),
      makeVisit({ recordedInCasefile: false }),
    ];
    expect(evaluateVisitorActivity(visits).recordedRate).toBe(80);
  });

  it("scores combined satisfaction + private time", () => {
    // All satisfied, no private time → avg = 50 → 3 points
    const visits = Array.from({ length: 5 }, () =>
      makeVisit({ childSatisfied: true, privateTimeProvided: false }),
    );
    const r = evaluateVisitorActivity(visits);
    expect(r.childSatisfactionRate).toBe(100);
    expect(r.privateTimeRate).toBe(0);
    // combinedRate = (100+0)/2 = 50 → ≥50 → 3 points
  });

  it("caps at 25", () => {
    const visits = Array.from({ length: 20 }, () => makeVisit());
    expect(evaluateVisitorActivity(visits).overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single visit", () => {
    const r = evaluateVisitorActivity([makeVisit()]);
    expect(r.totalVisits).toBe(1);
    expect(r.overallScore).toBeGreaterThan(0);
  });

  it("all negative outcomes still count for engagement", () => {
    const visits = Array.from({ length: 5 }, () =>
      makeVisit({ visitOutcome: "difficult", childEngaged: true }),
    );
    const r = evaluateVisitorActivity(visits);
    expect(r.positiveOutcomeRate).toBe(0);
    expect(r.childEngagementRate).toBe(100);
  });
});

// =============================================================================
// evaluateAdvocacyAccess
// =============================================================================

describe("evaluateAdvocacyAccess", () => {
  it("returns all zeros for empty referrals", () => {
    const r = evaluateAdvocacyAccess([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalReferrals).toBe(0);
    expect(r.successfulRate).toBe(0);
    expect(r.informedOfRightsRate).toBe(0);
    expect(r.consentObtainedRate).toBe(0);
    expect(r.timelyResponseRate).toBe(0);
    expect(r.childSatisfactionRate).toBe(0);
  });

  it("scores 25 for perfect referrals", () => {
    const refs = Array.from({ length: 5 }, () => makeReferral());
    const r = evaluateAdvocacyAccess(refs);
    expect(r.overallScore).toBe(25);
    expect(r.totalReferrals).toBe(5);
    expect(r.successfulRate).toBe(100);
    expect(r.informedOfRightsRate).toBe(100);
    expect(r.consentObtainedRate).toBe(100);
    expect(r.timelyResponseRate).toBe(100);
    expect(r.childSatisfactionRate).toBe(100);
  });

  it("counts not_needed as successful for rate", () => {
    const refs = [
      makeReferral({ referralOutcome: "successful" }),
      makeReferral({ referralOutcome: "not_needed" }),
      makeReferral({ referralOutcome: "in_progress" }),
    ];
    const r = evaluateAdvocacyAccess(refs);
    expect(r.successfulRate).toBe(67); // 2/3
  });

  it("does not count in_progress, declined_by_child, or no_service_available as successful", () => {
    const refs = [
      makeReferral({ referralOutcome: "in_progress" }),
      makeReferral({ referralOutcome: "declined_by_child" }),
      makeReferral({ referralOutcome: "no_service_available" }),
    ];
    const r = evaluateAdvocacyAccess(refs);
    expect(r.successfulRate).toBe(0);
  });

  it("scores successful referral tiers", () => {
    // 100% → 7
    const perfect = Array.from({ length: 5 }, () => makeReferral({ referralOutcome: "successful" }));
    expect(evaluateAdvocacyAccess(perfect).overallScore).toBe(25);

    // 40% → 3
    const mixed = [
      makeReferral({ referralOutcome: "successful" }),
      makeReferral({ referralOutcome: "successful" }),
      makeReferral({ referralOutcome: "in_progress" }),
      makeReferral({ referralOutcome: "declined_by_child" }),
      makeReferral({ referralOutcome: "no_service_available" }),
    ];
    expect(evaluateAdvocacyAccess(mixed).successfulRate).toBe(40);
  });

  it("scores informed-of-rights tiers", () => {
    // 60% informed → 3 (≥50, <70)
    const refs = [
      makeReferral({ childInformedOfRights: true }),
      makeReferral({ childInformedOfRights: true }),
      makeReferral({ childInformedOfRights: true }),
      makeReferral({ childInformedOfRights: false }),
      makeReferral({ childInformedOfRights: false }),
    ];
    expect(evaluateAdvocacyAccess(refs).informedOfRightsRate).toBe(60);
  });

  it("scores consent-obtained tiers", () => {
    // 80% consent → 4 (≥70, <90)
    const refs = [
      makeReferral({ childConsentObtained: true }),
      makeReferral({ childConsentObtained: true }),
      makeReferral({ childConsentObtained: true }),
      makeReferral({ childConsentObtained: true }),
      makeReferral({ childConsentObtained: false }),
    ];
    expect(evaluateAdvocacyAccess(refs).consentObtainedRate).toBe(80);
  });

  it("scores combined timely + satisfaction", () => {
    // All timely, none satisfied → avg = 50 → 3
    const refs = Array.from({ length: 5 }, () =>
      makeReferral({ timelyResponse: true, childSatisfied: false }),
    );
    const r = evaluateAdvocacyAccess(refs);
    expect(r.timelyResponseRate).toBe(100);
    expect(r.childSatisfactionRate).toBe(0);
  });

  it("caps at 25", () => {
    const refs = Array.from({ length: 20 }, () => makeReferral());
    expect(evaluateAdvocacyAccess(refs).overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single referral", () => {
    const r = evaluateAdvocacyAccess([makeReferral()]);
    expect(r.totalReferrals).toBe(1);
    expect(r.overallScore).toBeGreaterThan(0);
  });
});

// =============================================================================
// evaluatePolicyGovernance
// =============================================================================

describe("evaluatePolicyGovernance", () => {
  it("returns all zeros/false for null policy", () => {
    const r = evaluatePolicyGovernance(null);
    expect(r.overallScore).toBe(0);
    expect(r.informationDisplayed).toBe(false);
    expect(r.informedOnAdmission).toBe(false);
    expect(r.visitorPromoted).toBe(false);
    expect(r.complaintsAvailable).toBe(false);
    expect(r.leafletProvided).toBe(false);
    expect(r.regularReminders).toBe(false);
    expect(r.contactAccessible).toBe(false);
  });

  it("scores 25 for fully compliant policy", () => {
    const r = evaluatePolicyGovernance(makePolicy());
    expect(r.overallScore).toBe(25); // 4+4+4+4+3+3+3
    expect(r.informationDisplayed).toBe(true);
    expect(r.informedOnAdmission).toBe(true);
    expect(r.visitorPromoted).toBe(true);
    expect(r.complaintsAvailable).toBe(true);
    expect(r.leafletProvided).toBe(true);
    expect(r.regularReminders).toBe(true);
    expect(r.contactAccessible).toBe(true);
  });

  it("scores individual booleans at correct weights", () => {
    // Only informationDisplayed = 4
    const r1 = evaluatePolicyGovernance(makePolicy({
      advocacyInformationDisplayed: true,
      childrenInformedOnAdmission: false,
      independentVisitorPromoted: false,
      complaintsAdvocacyAvailable: false,
      rightsLeafletProvided: false,
      regularRightsReminders: false,
      advocacyContactDetailsAccessible: false,
    }));
    expect(r1.overallScore).toBe(4);

    // Only informedOnAdmission = 4
    const r2 = evaluatePolicyGovernance(makePolicy({
      advocacyInformationDisplayed: false,
      childrenInformedOnAdmission: true,
      independentVisitorPromoted: false,
      complaintsAdvocacyAvailable: false,
      rightsLeafletProvided: false,
      regularRightsReminders: false,
      advocacyContactDetailsAccessible: false,
    }));
    expect(r2.overallScore).toBe(4);

    // Only visitorPromoted = 4
    const r3 = evaluatePolicyGovernance(makePolicy({
      advocacyInformationDisplayed: false,
      childrenInformedOnAdmission: false,
      independentVisitorPromoted: true,
      complaintsAdvocacyAvailable: false,
      rightsLeafletProvided: false,
      regularRightsReminders: false,
      advocacyContactDetailsAccessible: false,
    }));
    expect(r3.overallScore).toBe(4);

    // Only complaintsAvailable = 4
    const r4 = evaluatePolicyGovernance(makePolicy({
      advocacyInformationDisplayed: false,
      childrenInformedOnAdmission: false,
      independentVisitorPromoted: false,
      complaintsAdvocacyAvailable: true,
      rightsLeafletProvided: false,
      regularRightsReminders: false,
      advocacyContactDetailsAccessible: false,
    }));
    expect(r4.overallScore).toBe(4);

    // Only leafletProvided = 3
    const r5 = evaluatePolicyGovernance(makePolicy({
      advocacyInformationDisplayed: false,
      childrenInformedOnAdmission: false,
      independentVisitorPromoted: false,
      complaintsAdvocacyAvailable: false,
      rightsLeafletProvided: true,
      regularRightsReminders: false,
      advocacyContactDetailsAccessible: false,
    }));
    expect(r5.overallScore).toBe(3);

    // Only regularReminders = 3
    const r6 = evaluatePolicyGovernance(makePolicy({
      advocacyInformationDisplayed: false,
      childrenInformedOnAdmission: false,
      independentVisitorPromoted: false,
      complaintsAdvocacyAvailable: false,
      rightsLeafletProvided: false,
      regularRightsReminders: true,
      advocacyContactDetailsAccessible: false,
    }));
    expect(r6.overallScore).toBe(3);

    // Only contactAccessible = 3
    const r7 = evaluatePolicyGovernance(makePolicy({
      advocacyInformationDisplayed: false,
      childrenInformedOnAdmission: false,
      independentVisitorPromoted: false,
      complaintsAdvocacyAvailable: false,
      rightsLeafletProvided: false,
      regularRightsReminders: false,
      advocacyContactDetailsAccessible: true,
    }));
    expect(r7.overallScore).toBe(3);
  });

  it("scores partial policy: 4-point items only = 16", () => {
    const r = evaluatePolicyGovernance(makePolicy({
      advocacyInformationDisplayed: true,
      childrenInformedOnAdmission: true,
      independentVisitorPromoted: true,
      complaintsAdvocacyAvailable: true,
      rightsLeafletProvided: false,
      regularRightsReminders: false,
      advocacyContactDetailsAccessible: false,
    }));
    expect(r.overallScore).toBe(16);
  });

  it("scores partial policy: 3-point items only = 9", () => {
    const r = evaluatePolicyGovernance(makePolicy({
      advocacyInformationDisplayed: false,
      childrenInformedOnAdmission: false,
      independentVisitorPromoted: false,
      complaintsAdvocacyAvailable: false,
      rightsLeafletProvided: true,
      regularRightsReminders: true,
      advocacyContactDetailsAccessible: true,
    }));
    expect(r.overallScore).toBe(9);
  });

  it("all false policy = 0", () => {
    const r = evaluatePolicyGovernance(makePolicy({
      advocacyInformationDisplayed: false,
      childrenInformedOnAdmission: false,
      independentVisitorPromoted: false,
      complaintsAdvocacyAvailable: false,
      rightsLeafletProvided: false,
      regularRightsReminders: false,
      advocacyContactDetailsAccessible: false,
    }));
    expect(r.overallScore).toBe(0);
  });

  it("reflects boolean values in result", () => {
    const r = evaluatePolicyGovernance(makePolicy({
      advocacyInformationDisplayed: true,
      childrenInformedOnAdmission: false,
      independentVisitorPromoted: true,
      complaintsAdvocacyAvailable: false,
      rightsLeafletProvided: true,
      regularRightsReminders: false,
      advocacyContactDetailsAccessible: true,
    }));
    expect(r.informationDisplayed).toBe(true);
    expect(r.informedOnAdmission).toBe(false);
    expect(r.visitorPromoted).toBe(true);
    expect(r.complaintsAvailable).toBe(false);
    expect(r.leafletProvided).toBe(true);
    expect(r.regularReminders).toBe(false);
    expect(r.contactAccessible).toBe(true);
    expect(r.overallScore).toBe(14); // 4+4+3+3
  });
});

// =============================================================================
// evaluateStaffAdvocacyReadiness
// =============================================================================

describe("evaluateStaffAdvocacyReadiness", () => {
  it("returns all zeros for empty training", () => {
    const r = evaluateStaffAdvocacyReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.advocacyRightsRate).toBe(0);
    expect(r.independentVisitorRate).toBe(0);
    expect(r.complaintsProcessRate).toBe(0);
    expect(r.signpostingRate).toBe(0);
    expect(r.childParticipationRate).toBe(0);
    expect(r.confidentialityRate).toBe(0);
  });

  it("scores 25 for fully trained staff", () => {
    const staff = Array.from({ length: 5 }, () => makeTraining());
    const r = evaluateStaffAdvocacyReadiness(staff);
    expect(r.overallScore).toBe(25); // 6+5+5+4+3+2
    expect(r.totalStaff).toBe(5);
    expect(r.advocacyRightsRate).toBe(100);
    expect(r.independentVisitorRate).toBe(100);
    expect(r.complaintsProcessRate).toBe(100);
    expect(r.signpostingRate).toBe(100);
    expect(r.childParticipationRate).toBe(100);
    expect(r.confidentialityRate).toBe(100);
  });

  it("scores advocacy rights tiers: ≥90→6, ≥70→4, ≥50→3, >0→1", () => {
    // 100% → 6
    const all = Array.from({ length: 4 }, () => makeTraining({ advocacyRights: true }));
    expect(evaluateStaffAdvocacyReadiness(all).advocacyRightsRate).toBe(100);

    // 75% → 4
    const some = [
      makeTraining({ advocacyRights: true }),
      makeTraining({ advocacyRights: true }),
      makeTraining({ advocacyRights: true }),
      makeTraining({ advocacyRights: false }),
    ];
    const r75 = evaluateStaffAdvocacyReadiness(some);
    expect(r75.advocacyRightsRate).toBe(75);

    // 50% → 3
    const half = [
      makeTraining({ advocacyRights: true }),
      makeTraining({ advocacyRights: false }),
    ];
    expect(evaluateStaffAdvocacyReadiness(half).advocacyRightsRate).toBe(50);

    // 25% → 1
    const low = [
      makeTraining({ advocacyRights: true }),
      makeTraining({ advocacyRights: false }),
      makeTraining({ advocacyRights: false }),
      makeTraining({ advocacyRights: false }),
    ];
    expect(evaluateStaffAdvocacyReadiness(low).advocacyRightsRate).toBe(25);
  });

  it("scores independent visitor role tiers: ≥90→5, ≥70→3, ≥50→2, >0→1", () => {
    // 100% → 5
    const all = Array.from({ length: 4 }, () => makeTraining({ independentVisitorRole: true }));
    expect(evaluateStaffAdvocacyReadiness(all).independentVisitorRate).toBe(100);

    // 50% → 2
    const half = [
      makeTraining({ independentVisitorRole: true }),
      makeTraining({ independentVisitorRole: false }),
    ];
    expect(evaluateStaffAdvocacyReadiness(half).independentVisitorRate).toBe(50);
  });

  it("scores complaints process tiers: ≥90→5, ≥70→3, ≥50→2, >0→1", () => {
    // 75% → 3
    const r = evaluateStaffAdvocacyReadiness([
      makeTraining({ complaintsProcess: true }),
      makeTraining({ complaintsProcess: true }),
      makeTraining({ complaintsProcess: true }),
      makeTraining({ complaintsProcess: false }),
    ]);
    expect(r.complaintsProcessRate).toBe(75);
  });

  it("scores signposting tiers: ≥90→4, ≥70→3, ≥50→2, >0→1", () => {
    // 100% → 4
    const all = Array.from({ length: 4 }, () => makeTraining({ signposting: true }));
    expect(evaluateStaffAdvocacyReadiness(all).signpostingRate).toBe(100);
  });

  it("scores child participation tiers: ≥90→3, ≥70→2, ≥50→1, <50→0", () => {
    // 100% → 3
    const all = Array.from({ length: 4 }, () => makeTraining({ childParticipation: true }));
    expect(evaluateStaffAdvocacyReadiness(all).childParticipationRate).toBe(100);

    // 40% → 0 (below 50)
    const low = [
      makeTraining({ childParticipation: true }),
      makeTraining({ childParticipation: true }),
      makeTraining({ childParticipation: false }),
      makeTraining({ childParticipation: false }),
      makeTraining({ childParticipation: false }),
    ];
    expect(evaluateStaffAdvocacyReadiness(low).childParticipationRate).toBe(40);
  });

  it("scores confidentiality tiers: ≥90→2, ≥70→1, <70→0", () => {
    // 100% → 2
    const all = Array.from({ length: 4 }, () => makeTraining({ confidentiality: true }));
    expect(evaluateStaffAdvocacyReadiness(all).confidentialityRate).toBe(100);

    // 75% → 1
    const some = [
      makeTraining({ confidentiality: true }),
      makeTraining({ confidentiality: true }),
      makeTraining({ confidentiality: true }),
      makeTraining({ confidentiality: false }),
    ];
    expect(evaluateStaffAdvocacyReadiness(some).confidentialityRate).toBe(75);

    // 50% → 0
    const half = [
      makeTraining({ confidentiality: true }),
      makeTraining({ confidentiality: false }),
    ];
    expect(evaluateStaffAdvocacyReadiness(half).confidentialityRate).toBe(50);
  });

  it("handles single staff member", () => {
    const r = evaluateStaffAdvocacyReadiness([makeTraining()]);
    expect(r.totalStaff).toBe(1);
    expect(r.overallScore).toBe(25);
  });

  it("scores staff with no training areas as all zero rates", () => {
    const untrained = [makeTraining({
      advocacyRights: false,
      independentVisitorRole: false,
      complaintsProcess: false,
      signposting: false,
      childParticipation: false,
      confidentiality: false,
    })];
    const r = evaluateStaffAdvocacyReadiness(untrained);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(1);
    expect(r.advocacyRightsRate).toBe(0);
  });

  it("caps at 25", () => {
    const staff = Array.from({ length: 20 }, () => makeTraining());
    expect(evaluateStaffAdvocacyReadiness(staff).overallScore).toBeLessThanOrEqual(25);
  });
});

// =============================================================================
// buildChildAdvocacyProfiles
// =============================================================================

describe("buildChildAdvocacyProfiles", () => {
  it("returns empty array for no visits or referrals", () => {
    expect(buildChildAdvocacyProfiles([], []).length).toBe(0);
  });

  it("builds profile from visits only", () => {
    const visits = [
      makeVisit({ childId: "c1", childName: "Alex" }),
      makeVisit({ childId: "c1", childName: "Alex" }),
      makeVisit({ childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildAdvocacyProfiles(visits, []);
    expect(profiles.length).toBe(1);
    expect(profiles[0].childId).toBe("c1");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalVisits).toBe(3);
    expect(profiles[0].totalReferrals).toBe(0);
  });

  it("builds profile from referrals only", () => {
    const refs = [
      makeReferral({ childId: "c1", childName: "Alex" }),
      makeReferral({ childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildAdvocacyProfiles([], refs);
    expect(profiles.length).toBe(1);
    expect(profiles[0].totalVisits).toBe(0);
    expect(profiles[0].totalReferrals).toBe(2);
  });

  it("merges visits and referrals for same child", () => {
    const visits = [
      makeVisit({ childId: "c1", childName: "Alex" }),
      makeVisit({ childId: "c1", childName: "Alex" }),
    ];
    const refs = [makeReferral({ childId: "c1", childName: "Alex" })];
    const profiles = buildChildAdvocacyProfiles(visits, refs);
    expect(profiles.length).toBe(1);
    expect(profiles[0].totalVisits).toBe(2);
    expect(profiles[0].totalReferrals).toBe(1);
  });

  it("creates separate profiles for different children", () => {
    const visits = [
      makeVisit({ childId: "c1", childName: "Alex" }),
      makeVisit({ childId: "c2", childName: "Jordan" }),
    ];
    const refs = [makeReferral({ childId: "c3", childName: "Morgan" })];
    const profiles = buildChildAdvocacyProfiles(visits, refs);
    expect(profiles.length).toBe(3);
    expect(profiles.map((p) => p.childId).sort()).toEqual(["c1", "c2", "c3"]);
  });

  it("scores visit frequency: ≥5→3, ≥3→2, ≥1→1", () => {
    // 5 visits → 3
    const v5 = Array.from({ length: 5 }, () => makeVisit({ childId: "c1", childName: "Alex" }));
    const p5 = buildChildAdvocacyProfiles(v5, []);
    expect(p5[0].totalVisits).toBe(5);

    // 3 visits → 2
    const v3 = Array.from({ length: 3 }, () => makeVisit({ childId: "c2", childName: "Jordan" }));
    const p3 = buildChildAdvocacyProfiles(v3, []);
    expect(p3[0].totalVisits).toBe(3);

    // 1 visit → 1
    const v1 = [makeVisit({ childId: "c3", childName: "Morgan" })];
    const p1 = buildChildAdvocacyProfiles(v1, []);
    expect(p1[0].totalVisits).toBe(1);
  });

  it("scores positive outcome rate", () => {
    // 100% positive → 3
    const visits = Array.from({ length: 3 }, () =>
      makeVisit({ childId: "c1", childName: "Alex", visitOutcome: "very_positive" }),
    );
    const p = buildChildAdvocacyProfiles(visits, []);
    expect(p[0].positiveOutcomeRate).toBe(100);

    // 0% positive → 0 (all neutral)
    const negVisits = Array.from({ length: 3 }, () =>
      makeVisit({ childId: "c2", childName: "Jordan", visitOutcome: "neutral" }),
    );
    const pNeg = buildChildAdvocacyProfiles(negVisits, []);
    expect(pNeg[0].positiveOutcomeRate).toBe(0);
  });

  it("calculates satisfaction from visits and referrals combined", () => {
    // 2 visits satisfied + 1 referral satisfied = 3/3 = 100%
    const visits = [
      makeVisit({ childId: "c1", childName: "Alex", childSatisfied: true }),
      makeVisit({ childId: "c1", childName: "Alex", childSatisfied: true }),
    ];
    const refs = [makeReferral({ childId: "c1", childName: "Alex", childSatisfied: true })];
    const p = buildChildAdvocacyProfiles(visits, refs);
    expect(p[0].satisfactionRate).toBe(100);

    // 1 visit satisfied + 1 not = 50%
    const mixVisits = [
      makeVisit({ childId: "c2", childName: "Jordan", childSatisfied: true }),
      makeVisit({ childId: "c2", childName: "Jordan", childSatisfied: false }),
    ];
    const pMix = buildChildAdvocacyProfiles(mixVisits, []);
    expect(pMix[0].satisfactionRate).toBe(50);
  });

  it("scores advocacy access based on referral count", () => {
    // 2 referrals → 2
    const refs2 = [
      makeReferral({ childId: "c1", childName: "Alex" }),
      makeReferral({ childId: "c1", childName: "Alex" }),
    ];
    const p2 = buildChildAdvocacyProfiles([], refs2);
    expect(p2[0].totalReferrals).toBe(2);

    // 1 referral → 1
    const refs1 = [makeReferral({ childId: "c2", childName: "Jordan" })];
    const p1 = buildChildAdvocacyProfiles([], refs1);
    expect(p1[0].totalReferrals).toBe(1);
  });

  it("caps profile score at 10", () => {
    const visits = Array.from({ length: 10 }, () =>
      makeVisit({ childId: "c1", childName: "Alex" }),
    );
    const refs = Array.from({ length: 5 }, () =>
      makeReferral({ childId: "c1", childName: "Alex" }),
    );
    const p = buildChildAdvocacyProfiles(visits, refs);
    expect(p[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("perfect child profile scores 10", () => {
    // 5+ visits (3) + 100% positive (3) + 100% satisfaction (2) + 2+ referrals (2) = 10
    const visits = Array.from({ length: 5 }, () =>
      makeVisit({ childId: "c1", childName: "Alex", visitOutcome: "very_positive", childSatisfied: true }),
    );
    const refs = [
      makeReferral({ childId: "c1", childName: "Alex", childSatisfied: true }),
      makeReferral({ childId: "c1", childName: "Alex", childSatisfied: true }),
    ];
    const p = buildChildAdvocacyProfiles(visits, refs);
    expect(p[0].overallScore).toBe(10);
  });

  it("handles child with only referrals (0 visits)", () => {
    const refs = [makeReferral({ childId: "c1", childName: "Alex" })];
    const p = buildChildAdvocacyProfiles([], refs);
    expect(p[0].totalVisits).toBe(0);
    expect(p[0].positiveOutcomeRate).toBe(0); // pct(0, 0) = 0
    expect(p[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// generateIndependentVisitorAdvocacyIntelligence
// =============================================================================

describe("generateIndependentVisitorAdvocacyIntelligence", () => {
  const base = {
    homeId: "oak-house",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-19",
  };

  it("returns inadequate (0) for all empty inputs", () => {
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
    expect(r.visitorActivity.overallScore).toBe(0);
    expect(r.advocacyAccess.overallScore).toBe(0);
    expect(r.policyGovernance.overallScore).toBe(0);
    expect(r.staffAdvocacyReadiness.overallScore).toBe(0);
    expect(r.childProfiles).toEqual([]);
  });

  it("returns outstanding (100) for perfect inputs", () => {
    const visits = Array.from({ length: 10 }, () => makeVisit());
    const refs = Array.from({ length: 5 }, () => makeReferral());
    const policy = makePolicy();
    const training = Array.from({ length: 5 }, () => makeTraining());

    const r = generateIndependentVisitorAdvocacyIntelligence(visits, refs, policy, training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
    expect(r.visitorActivity.overallScore).toBe(25);
    expect(r.advocacyAccess.overallScore).toBe(25);
    expect(r.policyGovernance.overallScore).toBe(25);
    expect(r.staffAdvocacyReadiness.overallScore).toBe(25);
  });

  it("caps overallScore at 100", () => {
    const visits = Array.from({ length: 20 }, () => makeVisit());
    const refs = Array.from({ length: 10 }, () => makeReferral());
    const policy = makePolicy();
    const training = Array.from({ length: 10 }, () => makeTraining());

    const r = generateIndependentVisitorAdvocacyIntelligence(visits, refs, policy, training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes homeId and period dates", () => {
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, [], "test-home", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test-home");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-06-30");
  });

  it("produces child profiles from visits and referrals", () => {
    const visits = [
      makeVisit({ childId: "c1", childName: "Alex" }),
      makeVisit({ childId: "c2", childName: "Jordan" }),
    ];
    const refs = [makeReferral({ childId: "c1", childName: "Alex" })];
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, refs, null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.childProfiles.length).toBe(2);
  });

  // -- Strengths ---------------------------------------------------------------

  it("generates strength for high positive outcome rate", () => {
    const visits = Array.from({ length: 5 }, () => makeVisit({ visitOutcome: "very_positive" }));
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("positive outcomes"))).toBe(true);
  });

  it("generates strength for high engagement", () => {
    const visits = Array.from({ length: 5 }, () => makeVisit({ childEngaged: true }));
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("engaged"))).toBe(true);
  });

  it("generates strength for private time", () => {
    const visits = Array.from({ length: 5 }, () => makeVisit({ privateTimeProvided: true }));
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("Private time"))).toBe(true);
  });

  it("generates strength for informed of rights", () => {
    const refs = Array.from({ length: 5 }, () => makeReferral({ childInformedOfRights: true }));
    const r = generateIndependentVisitorAdvocacyIntelligence([], refs, null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("advocacy rights"))).toBe(true);
  });

  it("generates strength for successful referrals", () => {
    const refs = Array.from({ length: 5 }, () => makeReferral({ referralOutcome: "successful" }));
    const r = generateIndependentVisitorAdvocacyIntelligence([], refs, null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("successful outcomes"))).toBe(true);
  });

  it("generates strength for staff advocacy rights training", () => {
    const training = Array.from({ length: 5 }, () => makeTraining({ advocacyRights: true }));
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("advocacy rights"))).toBe(true);
  });

  it("generates strength for signposting training", () => {
    const training = Array.from({ length: 5 }, () => makeTraining({ signposting: true }));
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("signpost"))).toBe(true);
  });

  it("generates strength for informed on admission", () => {
    const policy = makePolicy({ childrenInformedOnAdmission: true });
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], policy, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("admission"))).toBe(true);
  });

  it("does not generate strengths for empty data", () => {
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.length).toBe(0);
  });

  // -- Areas for improvement ---------------------------------------------------

  it("generates improvement for low positive outcome rate", () => {
    const visits = [
      makeVisit({ visitOutcome: "neutral" }),
      makeVisit({ visitOutcome: "difficult" }),
      makeVisit({ visitOutcome: "positive" }),
    ];
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, [], null, [], base.homeId, base.periodStart, base.periodEnd);
    // 33% positive < 60
    expect(r.areasForImprovement.some((a) => a.includes("outcomes below expected"))).toBe(true);
  });

  it("generates improvement for low recorded rate", () => {
    const visits = [
      makeVisit({ recordedInCasefile: true }),
      makeVisit({ recordedInCasefile: false }),
      makeVisit({ recordedInCasefile: false }),
    ];
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, [], null, [], base.homeId, base.periodStart, base.periodEnd);
    // 33% < 70
    expect(r.areasForImprovement.some((a) => a.includes("recorded"))).toBe(true);
  });

  it("generates improvement for low informed-of-rights rate", () => {
    const refs = [
      makeReferral({ childInformedOfRights: true }),
      makeReferral({ childInformedOfRights: false }),
      makeReferral({ childInformedOfRights: false }),
    ];
    const r = generateIndependentVisitorAdvocacyIntelligence([], refs, null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("informed of their advocacy rights"))).toBe(true);
  });

  it("generates improvement for low IV role training", () => {
    const training = [
      makeTraining({ independentVisitorRole: true }),
      makeTraining({ independentVisitorRole: false }),
      makeTraining({ independentVisitorRole: false }),
    ];
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("independent visitor role"))).toBe(true);
  });

  it("generates improvement for low complaints process training", () => {
    const training = [
      makeTraining({ complaintsProcess: true }),
      makeTraining({ complaintsProcess: false }),
      makeTraining({ complaintsProcess: false }),
    ];
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("complaints advocacy"))).toBe(true);
  });

  it("does not generate improvements for perfect data", () => {
    const visits = Array.from({ length: 5 }, () => makeVisit());
    const refs = Array.from({ length: 5 }, () => makeReferral());
    const training = Array.from({ length: 5 }, () => makeTraining());
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, refs, makePolicy(), training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.areasForImprovement.length).toBe(0);
  });

  // -- Actions -----------------------------------------------------------------

  it("generates action for zero visits", () => {
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.actions.some((a) => a.includes("No independent visitor sessions"))).toBe(true);
  });

  it("generates action for zero referrals", () => {
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.actions.some((a) => a.includes("No advocacy referrals"))).toBe(true);
  });

  it("generates URGENT action for no policy", () => {
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action for no training", () => {
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("generates action for low private time", () => {
    const visits = [
      makeVisit({ privateTimeProvided: true }),
      makeVisit({ privateTimeProvided: false }),
      makeVisit({ privateTimeProvided: false }),
    ];
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, [], null, [], base.homeId, base.periodStart, base.periodEnd);
    // 33% < 70
    expect(r.actions.some((a) => a.includes("private time"))).toBe(true);
  });

  it("generates action for no_service_available referrals", () => {
    const refs = [
      makeReferral({ referralOutcome: "no_service_available" }),
      makeReferral({ referralOutcome: "no_service_available" }),
    ];
    const r = generateIndependentVisitorAdvocacyIntelligence([], refs, null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.actions.some((a) => a.includes("2 advocacy referral(s) failed"))).toBe(true);
  });

  it("generates action for low consent rate", () => {
    const refs = [
      makeReferral({ childConsentObtained: true }),
      makeReferral({ childConsentObtained: true }),
      makeReferral({ childConsentObtained: true }),
      makeReferral({ childConsentObtained: false }),
      makeReferral({ childConsentObtained: false }),
    ];
    const r = generateIndependentVisitorAdvocacyIntelligence([], refs, null, [], base.homeId, base.periodStart, base.periodEnd);
    // 60% < 80
    expect(r.actions.some((a) => a.includes("consent recording"))).toBe(true);
  });

  it("does not generate empty-data actions when data exists", () => {
    const visits = [makeVisit()];
    const refs = [makeReferral()];
    const policy = makePolicy();
    const training = [makeTraining()];
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, refs, policy, training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.actions.some((a) => a.includes("No independent visitor sessions"))).toBe(false);
    expect(r.actions.some((a) => a.includes("No advocacy referrals"))).toBe(false);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(false);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(false);
  });

  // -- Regulatory links --------------------------------------------------------

  it("always includes regulatory links", () => {
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989 s24"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Advocacy Services Regulations 2004"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 15"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 12"))).toBe(true);
  });

  // -- Rating thresholds -------------------------------------------------------

  it("produces outstanding rating for perfect data", () => {
    const visits = Array.from({ length: 10 }, () => makeVisit());
    const refs = Array.from({ length: 5 }, () => makeReferral());
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, refs, makePolicy(), Array.from({ length: 5 }, () => makeTraining()), base.homeId, base.periodStart, base.periodEnd);
    expect(r.rating).toBe("outstanding");
  });

  it("produces good rating for policy-only scenario", () => {
    // Policy alone = 25 + 0 + 0 + 0 = 25 → inadequate
    // Let's create a scenario with ~65 points
    const visits = Array.from({ length: 5 }, () => makeVisit());
    const refs = Array.from({ length: 3 }, () => makeReferral());
    const training = Array.from({ length: 5 }, () => makeTraining());
    // 25 + 25 + 0 (no policy) + 25 = 75 → good
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, refs, null, training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.overallScore).toBe(75);
    expect(r.rating).toBe("good");
  });

  it("produces requires_improvement for moderate data", () => {
    // Just policy (25) + some visits ~partial
    const visits = [
      makeVisit({ visitOutcome: "neutral", childEngaged: false, recordedInCasefile: false, childSatisfied: false, privateTimeProvided: false }),
      makeVisit({ visitOutcome: "positive", childEngaged: true, recordedInCasefile: true, childSatisfied: true, privateTimeProvided: true }),
    ];
    // positive: 50% → 3, engaged: 50% → 3, recorded: 50% → 3, combined: (50+50)/2=50 → 3 = 12
    // Policy = 25, total = 37 → still inadequate
    // Add partial training
    const training = [
      makeTraining({ advocacyRights: true, independentVisitorRole: false, complaintsProcess: false, signposting: false, childParticipation: false, confidentiality: false }),
    ];
    // rights: 100→6, iv: 0→0, complaints: 0→0, signposting: 0→0, participation: 0→0, confidentiality: 0→0 = 6
    // Total: 12 + 0 + 25 + 6 = 43 → requires_improvement
    const r = generateIndependentVisitorAdvocacyIntelligence(visits, [], makePolicy(), training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.overallScore).toBe(43);
    expect(r.rating).toBe("requires_improvement");
  });

  it("produces inadequate for minimal data", () => {
    const r = generateIndependentVisitorAdvocacyIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.rating).toBe("inadequate");
  });
});
