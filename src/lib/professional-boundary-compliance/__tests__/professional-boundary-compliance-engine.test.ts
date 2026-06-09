// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Professional Boundary Compliance Intelligence Engine
//
// Demo: Chamberlain House, Staff: Sarah Johnson (Senior RSW), Tom Richards (RSW),
//       Lisa Williams (Senior RSW), Darren Laville (RM/DSL)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateBoundaryCompliance,
  evaluateChildSafeguarding,
  evaluateBoundaryPolicy,
  evaluateStaffBoundaryReadiness,
  buildStaffBoundaryProfiles,
  generateProfessionalBoundaryComplianceIntelligence,
  getBoundaryAreaLabel,
  getComplianceLevelLabel,
  getRatingLabel,
  getRating,
  pct,
} from "../professional-boundary-compliance-engine";
import type {
  BoundaryAudit,
  BoundaryPolicy,
  StaffBoundaryTraining,
} from "../professional-boundary-compliance-engine";

// ── Test Fixtures ─────────────────────────────────────────────────────────

const makeAudit = (overrides: Partial<BoundaryAudit> = {}): BoundaryAudit => ({
  id: "audit-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  auditDate: "2026-03-15",
  boundaryArea: "physical_contact",
  complianceLevel: "fully_compliant",
  supervisorVerified: true,
  documentedAppropriately: true,
  childFeedbackSought: true,
  correctiveActionTaken: true,
  reflectivePracticeCompleted: true,
  riskAssessed: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<BoundaryPolicy> = {}): BoundaryPolicy => ({
  id: "policy-001",
  boundaryFramework: true,
  socialMediaPolicy: true,
  giftGivingGuidance: true,
  physicalContactPolicy: true,
  whistleblowingProcedure: true,
  confidentialityProtocol: true,
  regularReview: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffBoundaryTraining> = {}): StaffBoundaryTraining => ({
  id: "train-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  professionalBoundaries: true,
  safeguardingAwareness: true,
  ethicalConduct: true,
  socialMediaSafety: true,
  reportingProcedures: true,
  reflectivePractice: true,
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// pct() helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
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

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating()
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
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });

  it("handles boundary values exactly", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(79)).toBe("good");
    expect(getRating(60)).toBe("good");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getBoundaryAreaLabel", () => {
  it("returns Physical Contact", () => {
    expect(getBoundaryAreaLabel("physical_contact")).toBe("Physical Contact");
  });

  it("returns Gift Giving", () => {
    expect(getBoundaryAreaLabel("gift_giving")).toBe("Gift Giving");
  });

  it("returns Social Media", () => {
    expect(getBoundaryAreaLabel("social_media")).toBe("Social Media");
  });

  it("returns Personal Disclosure", () => {
    expect(getBoundaryAreaLabel("personal_disclosure")).toBe("Personal Disclosure");
  });

  it("returns Favouritism", () => {
    expect(getBoundaryAreaLabel("favouritism")).toBe("Favouritism");
  });

  it("returns Dual Relationships", () => {
    expect(getBoundaryAreaLabel("dual_relationships")).toBe("Dual Relationships");
  });

  it("returns Confidentiality", () => {
    expect(getBoundaryAreaLabel("confidentiality")).toBe("Confidentiality");
  });

  it("returns Professional Language", () => {
    expect(getBoundaryAreaLabel("professional_language")).toBe("Professional Language");
  });
});

describe("getComplianceLevelLabel", () => {
  it("returns Fully Compliant", () => {
    expect(getComplianceLevelLabel("fully_compliant")).toBe("Fully Compliant");
  });

  it("returns Mostly Compliant", () => {
    expect(getComplianceLevelLabel("mostly_compliant")).toBe("Mostly Compliant");
  });

  it("returns Partially Compliant", () => {
    expect(getComplianceLevelLabel("partially_compliant")).toBe("Partially Compliant");
  });

  it("returns Non-Compliant", () => {
    expect(getComplianceLevelLabel("non_compliant")).toBe("Non-Compliant");
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
// evaluateBoundaryCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateBoundaryCompliance", () => {
  it("returns score 25 for empty audits (ABSENCE pattern)", () => {
    const result = evaluateBoundaryCompliance([]);
    expect(result.score).toBe(25);
    expect(result.totalAudits).toBe(0);
  });

  it("returns zero rates for empty audits", () => {
    const result = evaluateBoundaryCompliance([]);
    expect(result.complianceRate).toBe(0);
    expect(result.supervisorVerifiedRate).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.correctiveActionRate).toBe(0);
    expect(result.reflectivePracticeRate).toBe(0);
  });

  it("returns zeroed breakdowns for empty audits", () => {
    const result = evaluateBoundaryCompliance([]);
    expect(result.areaBreakdown.physical_contact).toBe(0);
    expect(result.areaBreakdown.gift_giving).toBe(0);
    expect(result.complianceLevelBreakdown.fully_compliant).toBe(0);
    expect(result.complianceLevelBreakdown.non_compliant).toBe(0);
  });

  it("scores perfectly for all-compliant, all-true audits", () => {
    const audits = [makeAudit(), makeAudit({ id: "audit-002" })];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.totalAudits).toBe(2);
    expect(result.complianceRate).toBe(100);
    expect(result.supervisorVerifiedRate).toBe(100);
    expect(result.documentedRate).toBe(100);
    expect(result.correctiveActionRate).toBe(100);
    expect(result.reflectivePracticeRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("counts mostly_compliant toward compliance rate", () => {
    const audits = [
      makeAudit({ complianceLevel: "mostly_compliant" }),
    ];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.complianceRate).toBe(100);
  });

  it("excludes partially_compliant from compliance rate", () => {
    const audits = [
      makeAudit({ complianceLevel: "partially_compliant" }),
    ];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.complianceRate).toBe(0);
  });

  it("excludes non_compliant from compliance rate", () => {
    const audits = [
      makeAudit({ complianceLevel: "non_compliant" }),
    ];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.complianceRate).toBe(0);
  });

  it("calculates mixed compliance rates correctly", () => {
    const audits = [
      makeAudit({ id: "a1", complianceLevel: "fully_compliant" }),
      makeAudit({ id: "a2", complianceLevel: "mostly_compliant" }),
      makeAudit({ id: "a3", complianceLevel: "partially_compliant" }),
      makeAudit({ id: "a4", complianceLevel: "non_compliant" }),
    ];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.complianceRate).toBe(50); // 2 out of 4
    expect(result.complianceLevelBreakdown.fully_compliant).toBe(1);
    expect(result.complianceLevelBreakdown.mostly_compliant).toBe(1);
    expect(result.complianceLevelBreakdown.partially_compliant).toBe(1);
    expect(result.complianceLevelBreakdown.non_compliant).toBe(1);
  });

  it("tracks area breakdown correctly", () => {
    const audits = [
      makeAudit({ id: "a1", boundaryArea: "gift_giving" }),
      makeAudit({ id: "a2", boundaryArea: "gift_giving" }),
      makeAudit({ id: "a3", boundaryArea: "social_media" }),
    ];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.areaBreakdown.gift_giving).toBe(2);
    expect(result.areaBreakdown.social_media).toBe(1);
    expect(result.areaBreakdown.physical_contact).toBe(0);
  });

  it("calculates supervisor verified rate", () => {
    const audits = [
      makeAudit({ id: "a1", supervisorVerified: true }),
      makeAudit({ id: "a2", supervisorVerified: false }),
    ];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.supervisorVerifiedRate).toBe(50);
  });

  it("calculates documented rate", () => {
    const audits = [
      makeAudit({ id: "a1", documentedAppropriately: true }),
      makeAudit({ id: "a2", documentedAppropriately: false }),
      makeAudit({ id: "a3", documentedAppropriately: false }),
    ];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.documentedRate).toBe(33);
  });

  it("combines corrective and reflective practice for scoring", () => {
    // All booleans false except compliance to isolate the corrective+reflective component
    const audits = [
      makeAudit({
        complianceLevel: "non_compliant",
        supervisorVerified: false,
        documentedAppropriately: false,
        correctiveActionTaken: true,
        reflectivePracticeCompleted: true,
      }),
    ];
    const result = evaluateBoundaryCompliance(audits);
    // compliance=0 -> 0, supervisor=0 -> 0, documented=0 -> 0, corr+refl=100% avg -> 5
    expect(result.score).toBe(5);
  });

  it("caps score at 25", () => {
    // Perfect audit should not exceed 25
    const audits = [makeAudit()];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score does not go below 0", () => {
    const audits = [
      makeAudit({
        complianceLevel: "non_compliant",
        supervisorVerified: false,
        documentedAppropriately: false,
        correctiveActionTaken: false,
        reflectivePracticeCompleted: false,
      }),
    ];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("returns score of 0 for all-worst audits", () => {
    const audits = [
      makeAudit({
        complianceLevel: "non_compliant",
        supervisorVerified: false,
        documentedAppropriately: false,
        correctiveActionTaken: false,
        reflectivePracticeCompleted: false,
      }),
    ];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.score).toBe(0);
  });

  it("handles single audit correctly", () => {
    const audits = [makeAudit()];
    const result = evaluateBoundaryCompliance(audits);
    expect(result.totalAudits).toBe(1);
    expect(result.complianceRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateChildSafeguarding
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildSafeguarding", () => {
  it("returns score 25 for empty audits (ABSENCE pattern)", () => {
    const result = evaluateChildSafeguarding([]);
    expect(result.score).toBe(25);
    expect(result.totalAudits).toBe(0);
  });

  it("returns zero rates for empty audits", () => {
    const result = evaluateChildSafeguarding([]);
    expect(result.childFeedbackSoughtRate).toBe(0);
    expect(result.riskAssessedRate).toBe(0);
    expect(result.nonComplianceRate).toBe(0);
  });

  it("scores perfectly for all-good audits", () => {
    const audits = [
      makeAudit({ childFeedbackSought: true, riskAssessed: true, complianceLevel: "fully_compliant" }),
    ];
    const result = evaluateChildSafeguarding(audits);
    expect(result.childFeedbackSoughtRate).toBe(100);
    expect(result.riskAssessedRate).toBe(100);
    expect(result.nonComplianceRate).toBe(0);
    expect(result.score).toBe(25);
  });

  it("calculates child feedback sought rate", () => {
    const audits = [
      makeAudit({ id: "a1", childFeedbackSought: true }),
      makeAudit({ id: "a2", childFeedbackSought: false }),
    ];
    const result = evaluateChildSafeguarding(audits);
    expect(result.childFeedbackSoughtRate).toBe(50);
  });

  it("calculates risk assessed rate", () => {
    const audits = [
      makeAudit({ id: "a1", riskAssessed: true }),
      makeAudit({ id: "a2", riskAssessed: true }),
      makeAudit({ id: "a3", riskAssessed: false }),
    ];
    const result = evaluateChildSafeguarding(audits);
    expect(result.riskAssessedRate).toBe(67);
  });

  it("calculates non-compliance rate", () => {
    const audits = [
      makeAudit({ id: "a1", complianceLevel: "non_compliant" }),
      makeAudit({ id: "a2", complianceLevel: "fully_compliant" }),
    ];
    const result = evaluateChildSafeguarding(audits);
    expect(result.nonComplianceRate).toBe(50);
  });

  it("inverts non-compliance rate for scoring", () => {
    // All non-compliant but everything else true
    const audits = [
      makeAudit({ complianceLevel: "non_compliant", childFeedbackSought: true, riskAssessed: true }),
    ];
    const result = evaluateChildSafeguarding(audits);
    // childFeedback=100% -> 9, risk=100% -> 8, nonCompliance=100% -> 8*(0/100)=0 -> total=17
    expect(result.score).toBe(17);
  });

  it("gives max non-compliance component when 0% non-compliant", () => {
    // No non-compliance but child feedback and risk = false
    const audits = [
      makeAudit({ complianceLevel: "fully_compliant", childFeedbackSought: false, riskAssessed: false }),
    ];
    const result = evaluateChildSafeguarding(audits);
    // childFeedback=0% -> 0, risk=0% -> 0, nonCompliance=0% -> 8*(100/100)=8 -> total=8
    expect(result.score).toBe(8);
  });

  it("caps score at 25", () => {
    const audits = [makeAudit()];
    const result = evaluateChildSafeguarding(audits);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score does not go below 0", () => {
    const audits = [
      makeAudit({
        complianceLevel: "non_compliant",
        childFeedbackSought: false,
        riskAssessed: false,
      }),
    ];
    const result = evaluateChildSafeguarding(audits);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("returns 0 for worst case", () => {
    const audits = [
      makeAudit({
        complianceLevel: "non_compliant",
        childFeedbackSought: false,
        riskAssessed: false,
      }),
    ];
    const result = evaluateChildSafeguarding(audits);
    expect(result.score).toBe(0);
  });

  it("handles multiple audits with mixed values", () => {
    const audits = [
      makeAudit({ id: "a1", childFeedbackSought: true, riskAssessed: true, complianceLevel: "fully_compliant" }),
      makeAudit({ id: "a2", childFeedbackSought: false, riskAssessed: false, complianceLevel: "non_compliant" }),
    ];
    const result = evaluateChildSafeguarding(audits);
    expect(result.childFeedbackSoughtRate).toBe(50);
    expect(result.riskAssessedRate).toBe(50);
    expect(result.nonComplianceRate).toBe(50);
    expect(result.totalAudits).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateBoundaryPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateBoundaryPolicy", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluateBoundaryPolicy(null);
    expect(result.score).toBe(0);
  });

  it("returns all false for null policy", () => {
    const result = evaluateBoundaryPolicy(null);
    expect(result.boundaryFramework).toBe(false);
    expect(result.socialMediaPolicy).toBe(false);
    expect(result.giftGivingGuidance).toBe(false);
    expect(result.physicalContactPolicy).toBe(false);
    expect(result.whistleblowingProcedure).toBe(false);
    expect(result.confidentialityProtocol).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns score 25 for fully complete policy", () => {
    const result = evaluateBoundaryPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("returns all true for fully complete policy", () => {
    const result = evaluateBoundaryPolicy(makePolicy());
    expect(result.boundaryFramework).toBe(true);
    expect(result.socialMediaPolicy).toBe(true);
    expect(result.giftGivingGuidance).toBe(true);
    expect(result.physicalContactPolicy).toBe(true);
    expect(result.whistleblowingProcedure).toBe(true);
    expect(result.confidentialityProtocol).toBe(true);
    expect(result.regularReview).toBe(true);
  });

  it("gives 4 points for boundaryFramework", () => {
    const result = evaluateBoundaryPolicy(makePolicy({
      socialMediaPolicy: false,
      giftGivingGuidance: false,
      physicalContactPolicy: false,
      whistleblowingProcedure: false,
      confidentialityProtocol: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("gives 4 points for socialMediaPolicy", () => {
    const result = evaluateBoundaryPolicy(makePolicy({
      boundaryFramework: false,
      giftGivingGuidance: false,
      physicalContactPolicy: false,
      whistleblowingProcedure: false,
      confidentialityProtocol: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("gives 4 points for giftGivingGuidance", () => {
    const result = evaluateBoundaryPolicy(makePolicy({
      boundaryFramework: false,
      socialMediaPolicy: false,
      physicalContactPolicy: false,
      whistleblowingProcedure: false,
      confidentialityProtocol: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("gives 4 points for physicalContactPolicy", () => {
    const result = evaluateBoundaryPolicy(makePolicy({
      boundaryFramework: false,
      socialMediaPolicy: false,
      giftGivingGuidance: false,
      whistleblowingProcedure: false,
      confidentialityProtocol: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("gives 3 points for whistleblowingProcedure", () => {
    const result = evaluateBoundaryPolicy(makePolicy({
      boundaryFramework: false,
      socialMediaPolicy: false,
      giftGivingGuidance: false,
      physicalContactPolicy: false,
      confidentialityProtocol: false,
      regularReview: false,
    }));
    expect(result.score).toBe(3);
  });

  it("gives 3 points for confidentialityProtocol", () => {
    const result = evaluateBoundaryPolicy(makePolicy({
      boundaryFramework: false,
      socialMediaPolicy: false,
      giftGivingGuidance: false,
      physicalContactPolicy: false,
      whistleblowingProcedure: false,
      regularReview: false,
    }));
    expect(result.score).toBe(3);
  });

  it("gives 3 points for regularReview", () => {
    const result = evaluateBoundaryPolicy(makePolicy({
      boundaryFramework: false,
      socialMediaPolicy: false,
      giftGivingGuidance: false,
      physicalContactPolicy: false,
      whistleblowingProcedure: false,
      confidentialityProtocol: false,
    }));
    expect(result.score).toBe(3);
  });

  it("sums weight-4 items correctly (16 total)", () => {
    const result = evaluateBoundaryPolicy(makePolicy({
      whistleblowingProcedure: false,
      confidentialityProtocol: false,
      regularReview: false,
    }));
    expect(result.score).toBe(16);
  });

  it("sums weight-3 items correctly (9 total)", () => {
    const result = evaluateBoundaryPolicy(makePolicy({
      boundaryFramework: false,
      socialMediaPolicy: false,
      giftGivingGuidance: false,
      physicalContactPolicy: false,
    }));
    expect(result.score).toBe(9);
  });

  it("score never exceeds 25", () => {
    const result = evaluateBoundaryPolicy(makePolicy());
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateBoundaryPolicy(makePolicy({
      boundaryFramework: false,
      socialMediaPolicy: false,
      giftGivingGuidance: false,
      physicalContactPolicy: false,
      whistleblowingProcedure: false,
      confidentialityProtocol: false,
      regularReview: false,
    }));
    expect(result.score).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffBoundaryReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffBoundaryReadiness", () => {
  it("returns score 0 for empty training array", () => {
    const result = evaluateStaffBoundaryReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns zero rates for empty training", () => {
    const result = evaluateStaffBoundaryReadiness([]);
    expect(result.professionalBoundariesRate).toBe(0);
    expect(result.safeguardingAwarenessRate).toBe(0);
    expect(result.ethicalConductRate).toBe(0);
    expect(result.socialMediaSafetyRate).toBe(0);
    expect(result.reportingProceduresRate).toBe(0);
    expect(result.reflectivePracticeRate).toBe(0);
  });

  it("scores 25 for fully trained staff", () => {
    const training = [makeTraining()];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.score).toBe(25);
    expect(result.totalStaff).toBe(1);
  });

  it("returns 100% rates for fully trained staff", () => {
    const training = [makeTraining()];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.professionalBoundariesRate).toBe(100);
    expect(result.safeguardingAwarenessRate).toBe(100);
    expect(result.ethicalConductRate).toBe(100);
    expect(result.socialMediaSafetyRate).toBe(100);
    expect(result.reportingProceduresRate).toBe(100);
    expect(result.reflectivePracticeRate).toBe(100);
  });

  it("gives 6 points for professionalBoundaries alone", () => {
    const training = [makeTraining({
      safeguardingAwareness: false,
      ethicalConduct: false,
      socialMediaSafety: false,
      reportingProcedures: false,
      reflectivePractice: false,
    })];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.score).toBe(6);
  });

  it("gives 5 points for safeguardingAwareness alone", () => {
    const training = [makeTraining({
      professionalBoundaries: false,
      ethicalConduct: false,
      socialMediaSafety: false,
      reportingProcedures: false,
      reflectivePractice: false,
    })];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.score).toBe(5);
  });

  it("gives 5 points for ethicalConduct alone", () => {
    const training = [makeTraining({
      professionalBoundaries: false,
      safeguardingAwareness: false,
      socialMediaSafety: false,
      reportingProcedures: false,
      reflectivePractice: false,
    })];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.score).toBe(5);
  });

  it("gives 4 points for socialMediaSafety alone", () => {
    const training = [makeTraining({
      professionalBoundaries: false,
      safeguardingAwareness: false,
      ethicalConduct: false,
      reportingProcedures: false,
      reflectivePractice: false,
    })];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.score).toBe(4);
  });

  it("gives 3 points for reportingProcedures alone", () => {
    const training = [makeTraining({
      professionalBoundaries: false,
      safeguardingAwareness: false,
      ethicalConduct: false,
      socialMediaSafety: false,
      reflectivePractice: false,
    })];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.score).toBe(3);
  });

  it("gives 2 points for reflectivePractice alone", () => {
    const training = [makeTraining({
      professionalBoundaries: false,
      safeguardingAwareness: false,
      ethicalConduct: false,
      socialMediaSafety: false,
      reportingProcedures: false,
    })];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.score).toBe(2);
  });

  it("returns 0 for all-untrained staff", () => {
    const training = [makeTraining({
      professionalBoundaries: false,
      safeguardingAwareness: false,
      ethicalConduct: false,
      socialMediaSafety: false,
      reportingProcedures: false,
      reflectivePractice: false,
    })];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.score).toBe(0);
  });

  it("handles multiple staff with mixed training", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "staff-sarah" }),
      makeTraining({
        id: "t2",
        staffId: "staff-tom",
        staffName: "Tom Richards",
        professionalBoundaries: false,
        reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.totalStaff).toBe(2);
    expect(result.professionalBoundariesRate).toBe(50);
    expect(result.reflectivePracticeRate).toBe(50);
  });

  it("caps score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score does not go below 0", () => {
    const training = [makeTraining({
      professionalBoundaries: false,
      safeguardingAwareness: false,
      ethicalConduct: false,
      socialMediaSafety: false,
      reportingProcedures: false,
      reflectivePractice: false,
    })];
    const result = evaluateStaffBoundaryReadiness(training);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildStaffBoundaryProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildStaffBoundaryProfiles", () => {
  it("returns empty array for no audits", () => {
    const result = buildStaffBoundaryProfiles([]);
    expect(result).toEqual([]);
  });

  it("creates one profile per staff member", () => {
    const audits = [
      makeAudit({ id: "a1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      makeAudit({ id: "a2", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      makeAudit({ id: "a3", staffId: "staff-tom", staffName: "Tom Richards" }),
    ];
    const result = buildStaffBoundaryProfiles(audits);
    expect(result.length).toBe(2);
    expect(result[0].staffId).toBe("staff-sarah");
    expect(result[0].totalAudits).toBe(2);
    expect(result[1].staffId).toBe("staff-tom");
    expect(result[1].totalAudits).toBe(1);
  });

  it("calculates perfect boundary score for fully compliant staff", () => {
    const audits = [
      makeAudit({
        complianceLevel: "fully_compliant",
        documentedAppropriately: true,
        supervisorVerified: true,
      }),
    ];
    const result = buildStaffBoundaryProfiles(audits);
    // compliance=100% -> 4, documented=100% -> 3, verified=100% -> 3 = 10
    expect(result[0].boundaryScore).toBe(10);
  });

  it("gives 0 boundary score for worst case staff", () => {
    const audits = [
      makeAudit({
        complianceLevel: "non_compliant",
        documentedAppropriately: false,
        supervisorVerified: false,
      }),
    ];
    const result = buildStaffBoundaryProfiles(audits);
    expect(result[0].boundaryScore).toBe(0);
  });

  it("calculates compliance rate tiers correctly — 90%+ gets 4", () => {
    const audits = Array.from({ length: 10 }, (_, i) =>
      makeAudit({
        id: `a${i}`,
        complianceLevel: i < 9 ? "fully_compliant" : "mostly_compliant",
        documentedAppropriately: false,
        supervisorVerified: false,
      }),
    );
    const result = buildStaffBoundaryProfiles(audits);
    // All 10 are compliant -> 100% -> tier 4
    expect(result[0].complianceRate).toBe(100);
    expect(result[0].boundaryScore).toBe(4); // compliance=4, doc=0, verified=0
  });

  it("calculates compliance rate tiers — 75%+ gets 3", () => {
    const audits = [
      makeAudit({ id: "a1", complianceLevel: "fully_compliant", documentedAppropriately: false, supervisorVerified: false }),
      makeAudit({ id: "a2", complianceLevel: "fully_compliant", documentedAppropriately: false, supervisorVerified: false }),
      makeAudit({ id: "a3", complianceLevel: "fully_compliant", documentedAppropriately: false, supervisorVerified: false }),
      makeAudit({ id: "a4", complianceLevel: "non_compliant", documentedAppropriately: false, supervisorVerified: false }),
    ];
    const result = buildStaffBoundaryProfiles(audits);
    expect(result[0].complianceRate).toBe(75);
    expect(result[0].boundaryScore).toBe(3); // compliance=3, doc=0, verified=0
  });

  it("calculates compliance rate tiers — 50%+ gets 2", () => {
    const audits = [
      makeAudit({ id: "a1", complianceLevel: "fully_compliant", documentedAppropriately: false, supervisorVerified: false }),
      makeAudit({ id: "a2", complianceLevel: "non_compliant", documentedAppropriately: false, supervisorVerified: false }),
    ];
    const result = buildStaffBoundaryProfiles(audits);
    expect(result[0].complianceRate).toBe(50);
    expect(result[0].boundaryScore).toBe(2); // compliance=2, doc=0, verified=0
  });

  it("calculates compliance rate tiers — >0% gets 1", () => {
    const audits = [
      makeAudit({ id: "a1", complianceLevel: "fully_compliant", documentedAppropriately: false, supervisorVerified: false }),
      makeAudit({ id: "a2", complianceLevel: "non_compliant", documentedAppropriately: false, supervisorVerified: false }),
      makeAudit({ id: "a3", complianceLevel: "non_compliant", documentedAppropriately: false, supervisorVerified: false }),
    ];
    const result = buildStaffBoundaryProfiles(audits);
    expect(result[0].complianceRate).toBe(33);
    expect(result[0].boundaryScore).toBe(1); // compliance=1, doc=0, verified=0
  });

  it("documented rate 90%+ gives 3 points", () => {
    const audits = [
      makeAudit({
        complianceLevel: "non_compliant",
        documentedAppropriately: true,
        supervisorVerified: false,
      }),
    ];
    const result = buildStaffBoundaryProfiles(audits);
    // compliance=0% -> 0, doc=100% -> 3, verified=0% -> 0
    expect(result[0].boundaryScore).toBe(3);
  });

  it("documented rate 70%+ gives 2 points", () => {
    const audits = Array.from({ length: 10 }, (_, i) =>
      makeAudit({
        id: `a${i}`,
        complianceLevel: "non_compliant",
        documentedAppropriately: i < 7,
        supervisorVerified: false,
      }),
    );
    const result = buildStaffBoundaryProfiles(audits);
    expect(result[0].documentedRate).toBe(70);
    expect(result[0].boundaryScore).toBe(2); // compliance=0, doc=2, verified=0
  });

  it("documented rate 50%+ gives 1 point", () => {
    const audits = [
      makeAudit({ id: "a1", complianceLevel: "non_compliant", documentedAppropriately: true, supervisorVerified: false }),
      makeAudit({ id: "a2", complianceLevel: "non_compliant", documentedAppropriately: false, supervisorVerified: false }),
    ];
    const result = buildStaffBoundaryProfiles(audits);
    expect(result[0].documentedRate).toBe(50);
    expect(result[0].boundaryScore).toBe(1); // compliance=0, doc=1, verified=0
  });

  it("supervisor verified 90%+ gives 3 points", () => {
    const audits = [
      makeAudit({
        complianceLevel: "non_compliant",
        documentedAppropriately: false,
        supervisorVerified: true,
      }),
    ];
    const result = buildStaffBoundaryProfiles(audits);
    expect(result[0].boundaryScore).toBe(3); // compliance=0, doc=0, verified=3
  });

  it("supervisor verified 70%+ gives 2 points", () => {
    const audits = Array.from({ length: 10 }, (_, i) =>
      makeAudit({
        id: `a${i}`,
        complianceLevel: "non_compliant",
        documentedAppropriately: false,
        supervisorVerified: i < 7,
      }),
    );
    const result = buildStaffBoundaryProfiles(audits);
    expect(result[0].supervisorVerifiedRate).toBe(70);
    expect(result[0].boundaryScore).toBe(2); // compliance=0, doc=0, verified=2
  });

  it("caps boundaryScore at 10", () => {
    const audits = [makeAudit()];
    const result = buildStaffBoundaryProfiles(audits);
    expect(result[0].boundaryScore).toBeLessThanOrEqual(10);
  });

  it("boundaryScore does not go below 0", () => {
    const audits = [
      makeAudit({
        complianceLevel: "non_compliant",
        documentedAppropriately: false,
        supervisorVerified: false,
      }),
    ];
    const result = buildStaffBoundaryProfiles(audits);
    expect(result[0].boundaryScore).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateProfessionalBoundaryComplianceIntelligence (Orchestrator)
// ══════════════════════════════════════════════════════════════════════════════

describe("generateProfessionalBoundaryComplianceIntelligence", () => {
  it("returns all required fields", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(typeof result.assessedAt).toBe("string");
    expect(typeof result.overallScore).toBe("number");
    expect(typeof result.rating).toBe("string");
    expect(result.boundaryCompliance).toBeDefined();
    expect(result.childSafeguarding).toBeDefined();
    expect(result.boundaryPolicy).toBeDefined();
    expect(result.staffBoundaryReadiness).toBeDefined();
    expect(Array.isArray(result.staffProfiles)).toBe(true);
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
    expect(Array.isArray(result.actions)).toBe(true);
    expect(Array.isArray(result.regulatoryLinks)).toBe(true);
  });

  it("returns exactly 7 regulatory links", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("includes all 7 specific regulatory links", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("CHR 2015 Regulation 12 — The protection of children");
    expect(result.regulatoryLinks).toContain("CHR 2015 Regulation 13 — Leadership and management");
    expect(result.regulatoryLinks).toContain("SCCIF — Safety of children");
    expect(result.regulatoryLinks).toContain("NMS 19 — Behaviour management");
    expect(result.regulatoryLinks).toContain("Children Act 1989 — Welfare and safeguarding");
    expect(result.regulatoryLinks).toContain("Working Together to Safeguard Children 2023");
    expect(result.regulatoryLinks).toContain("Ofsted ILACS — Impact of leaders on practice");
  });

  it("caps overall score at 100", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score does not go below 0", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [makeAudit({
        complianceLevel: "non_compliant",
        supervisorVerified: false,
        documentedAppropriately: false,
        correctiveActionTaken: false,
        reflectivePracticeCompleted: false,
        childFeedbackSought: false,
        riskAssessed: false,
      })],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("sums 4 evaluator scores correctly for empty data", () => {
    // empty audits=25+25, null policy=0, empty training=0 -> 50
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(50);
    expect(result.rating).toBe("requires_improvement");
  });

  it("sums 4 evaluator scores for perfect inputs", () => {
    const audits = [makeAudit()];
    const result = generateProfessionalBoundaryComplianceIntelligence(
      audits, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    // boundary compliance=25, child safeguarding=25, policy=25, training=25 = 100
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("assigns outstanding rating for score >= 80", () => {
    // audits=25+25, full policy=25, partial training
    const training = [makeTraining({
      socialMediaSafety: false,
      reportingProcedures: false,
      reflectivePractice: false,
    })];
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], makePolicy(), training, "oak-house", "2026-01-01", "2026-05-19",
    );
    // 25+25+25+16=91
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("assigns good rating for score >= 60 and < 80", () => {
    // empty audits=25+25=50, partial policy, partial training
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [],
      makePolicy({
        boundaryFramework: true,
        socialMediaPolicy: true,
        giftGivingGuidance: false,
        physicalContactPolicy: false,
        whistleblowingProcedure: false,
        confidentialityProtocol: false,
        regularReview: false,
      }),
      [makeTraining({
        safeguardingAwareness: false,
        ethicalConduct: false,
        socialMediaSafety: false,
        reportingProcedures: false,
        reflectivePractice: false,
      })],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    // 25+25+8+6=64
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
    expect(result.rating).toBe("good");
  });

  it("assigns inadequate rating for score < 40", () => {
    // worst case audits + no policy + no training
    const audits = [makeAudit({
      complianceLevel: "non_compliant",
      supervisorVerified: false,
      documentedAppropriately: false,
      correctiveActionTaken: false,
      reflectivePracticeCompleted: false,
      childFeedbackSought: false,
      riskAssessed: false,
    })];
    const result = generateProfessionalBoundaryComplianceIntelligence(
      audits, null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  // ── Strengths logic ─────────────────────────────────────────────────────

  it("generates compliance rate strength when >= 80%", () => {
    const audits = [
      makeAudit({ id: "a1", complianceLevel: "fully_compliant" }),
      makeAudit({ id: "a2", complianceLevel: "fully_compliant" }),
    ];
    const result = generateProfessionalBoundaryComplianceIntelligence(
      audits, null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("boundary compliance"))).toBe(true);
  });

  it("generates supervisor verified strength when >= 80%", () => {
    const audits = [
      makeAudit({ id: "a1", supervisorVerified: true }),
      makeAudit({ id: "a2", supervisorVerified: true }),
    ];
    const result = generateProfessionalBoundaryComplianceIntelligence(
      audits, null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("supervision oversight"))).toBe(true);
  });

  it("generates documentation strength when >= 80%", () => {
    const audits = [
      makeAudit({ id: "a1", documentedAppropriately: true }),
      makeAudit({ id: "a2", documentedAppropriately: true }),
    ];
    const result = generateProfessionalBoundaryComplianceIntelligence(
      audits, null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("documentation"))).toBe(true);
  });

  it("does not generate compliance strength when < 80%", () => {
    const audits = [
      makeAudit({ id: "a1", complianceLevel: "fully_compliant" }),
      makeAudit({ id: "a2", complianceLevel: "non_compliant" }),
    ];
    const result = generateProfessionalBoundaryComplianceIntelligence(
      audits, null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("boundary compliance"))).toBe(false);
  });

  // ── Actions logic ───────────────────────────────────────────────────────

  it("generates boundary audit action for empty audits (not urgent)", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    const auditAction = result.actions.find((a) => a.includes("boundary audits"));
    expect(auditAction).toBeDefined();
    expect(auditAction!.startsWith("URGENT")).toBe(false);
  });

  it("generates URGENT action for no policy", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action for no training", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("does not generate urgent policy action when policy exists", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(false);
  });

  it("does not generate urgent training action when training exists", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(false);
  });

  // ── Areas for improvement ───────────────────────────────────────────────

  it("generates compliance area for improvement when < 60%", () => {
    const audits = [
      makeAudit({ id: "a1", complianceLevel: "non_compliant" }),
      makeAudit({ id: "a2", complianceLevel: "partially_compliant" }),
    ];
    const result = generateProfessionalBoundaryComplianceIntelligence(
      audits, null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("boundary compliance"))).toBe(true);
  });

  it("generates child feedback area for improvement when < 60%", () => {
    const audits = [
      makeAudit({ id: "a1", childFeedbackSought: false }),
      makeAudit({ id: "a2", childFeedbackSought: false }),
    ];
    const result = generateProfessionalBoundaryComplianceIntelligence(
      audits, null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Child feedback"))).toBe(true);
  });

  it("does not generate areas for improvement for empty audits", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("boundary compliance"))).toBe(false);
    expect(result.areasForImprovement.some((a) => a.includes("Child feedback"))).toBe(false);
  });

  // ── Staff profiles ─────────────────────────────────────────────────────

  it("builds staff profiles from audits", () => {
    const audits = [
      makeAudit({ id: "a1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      makeAudit({ id: "a2", staffId: "staff-tom", staffName: "Tom Richards" }),
    ];
    const result = generateProfessionalBoundaryComplianceIntelligence(
      audits, null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.staffProfiles.length).toBe(2);
  });

  it("returns empty staff profiles for empty audits", () => {
    const result = generateProfessionalBoundaryComplianceIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.staffProfiles.length).toBe(0);
  });

  // ── Full scenario: Chamberlain House demo ─────────────────────────────────────

  it("handles realistic Chamberlain House data correctly", () => {
    const audits: BoundaryAudit[] = [
      makeAudit({ id: "a1", staffId: "staff-sarah", staffName: "Sarah Johnson", boundaryArea: "physical_contact", complianceLevel: "fully_compliant" }),
      makeAudit({ id: "a2", staffId: "staff-sarah", staffName: "Sarah Johnson", boundaryArea: "gift_giving", complianceLevel: "fully_compliant" }),
      makeAudit({ id: "a3", staffId: "staff-tom", staffName: "Tom Richards", boundaryArea: "social_media", complianceLevel: "mostly_compliant" }),
      makeAudit({ id: "a4", staffId: "staff-tom", staffName: "Tom Richards", boundaryArea: "personal_disclosure", complianceLevel: "partially_compliant", supervisorVerified: false }),
      makeAudit({ id: "a5", staffId: "staff-lisa", staffName: "Lisa Williams", boundaryArea: "confidentiality", complianceLevel: "fully_compliant" }),
      makeAudit({ id: "a6", staffId: "staff-lisa", staffName: "Lisa Williams", boundaryArea: "professional_language", complianceLevel: "fully_compliant" }),
      makeAudit({ id: "a7", staffId: "staff-darren", staffName: "Darren Laville", boundaryArea: "favouritism", complianceLevel: "fully_compliant" }),
      makeAudit({ id: "a8", staffId: "staff-darren", staffName: "Darren Laville", boundaryArea: "dual_relationships", complianceLevel: "fully_compliant" }),
    ];

    const policy = makePolicy();
    const training = [
      makeTraining({ id: "t1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      makeTraining({ id: "t2", staffId: "staff-tom", staffName: "Tom Richards" }),
      makeTraining({ id: "t3", staffId: "staff-lisa", staffName: "Lisa Williams" }),
      makeTraining({ id: "t4", staffId: "staff-darren", staffName: "Darren Laville" }),
    ];

    const result = generateProfessionalBoundaryComplianceIntelligence(
      audits, policy, training, "oak-house", "2026-01-01", "2026-05-19",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
    expect(result.staffProfiles.length).toBe(4);
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.boundaryCompliance.totalAudits).toBe(8);
    expect(result.childSafeguarding.totalAudits).toBe(8);
    expect(result.boundaryPolicy.score).toBe(25);
    expect(result.staffBoundaryReadiness.score).toBe(25);
  });
});
