import { describe, it, expect } from "vitest";
import {
  evaluateVisitorManagementQuality,
  evaluateVisitorManagementCompliance,
  evaluateVisitorManagementPolicy,
  evaluateStaffVisitorReadiness,
  buildChildVisitorProfiles,
  generateVisitorManagementQualityIntelligence,
  pct,
  getRating,
  getVisitorTypeLabel,
  getVisitQualityLabel,
  getRatingLabel,
} from "../visitor-management-quality-engine";
import type {
  VisitorRecord,
  VisitorPolicy,
  StaffVisitorTraining,
} from "../visitor-management-quality-engine";

// ── Factory Helpers ─────────────────────────────────────────────────────────

let _visitId = 0;
function makeVisit(overrides: Partial<VisitorRecord> = {}): VisitorRecord {
  _visitId++;
  return {
    id: `vr-${_visitId}`,
    childId: "child-alex",
    childName: "Alex",
    visitDate: "2026-03-15",
    visitorType: "family_member",
    visitQuality: "good",
    childConsulted: true,
    safeguardingChecked: true,
    privacyMaintained: true,
    documentedInLog: true,
    staffSupervised: true,
    feedbackRecorded: true,
    ...overrides,
  };
}

let _policyId = 0;
function makePolicy(overrides: Partial<VisitorPolicy> = {}): VisitorPolicy {
  _policyId++;
  return {
    id: `pol-${_policyId}`,
    visitorManagementStrategy: true,
    safeguardingCheckProcedure: true,
    childConsentProtocol: true,
    privacyAndDignityGuidance: true,
    professionalVisitorFramework: true,
    emergencyVisitProtocol: true,
    regularReview: true,
    ...overrides,
  };
}

let _trainingId = 0;
function makeTraining(overrides: Partial<StaffVisitorTraining> = {}): StaffVisitorTraining {
  _trainingId++;
  return {
    id: `tr-${_trainingId}`,
    staffId: `staff-${_trainingId}`,
    staffName: `Staff ${_trainingId}`,
    visitorManagement: true,
    safeguardingChecks: true,
    childConsentPractice: true,
    privacyProtocol: true,
    conflictResolution: true,
    recordKeeping: true,
    ...overrides,
  };
}

// ── pct() ───────────────────────────────────────────────────────────────────

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
});

// ── getRating() ─────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ── Label Functions ─────────────────────────────────────────────────────────

describe("getVisitorTypeLabel", () => {
  it("returns Family Member", () => {
    expect(getVisitorTypeLabel("family_member")).toBe("Family Member");
  });
  it("returns Social Worker", () => {
    expect(getVisitorTypeLabel("social_worker")).toBe("Social Worker");
  });
  it("returns Therapist", () => {
    expect(getVisitorTypeLabel("therapist")).toBe("Therapist");
  });
  it("returns Independent Visitor", () => {
    expect(getVisitorTypeLabel("independent_visitor")).toBe("Independent Visitor");
  });
  it("returns Advocate", () => {
    expect(getVisitorTypeLabel("advocate")).toBe("Advocate");
  });
  it("returns Friend", () => {
    expect(getVisitorTypeLabel("friend")).toBe("Friend");
  });
  it("returns Professional Visitor", () => {
    expect(getVisitorTypeLabel("professional_visitor")).toBe("Professional Visitor");
  });
  it("returns Inspector", () => {
    expect(getVisitorTypeLabel("inspector")).toBe("Inspector");
  });
});

describe("getVisitQualityLabel", () => {
  it("returns Excellent", () => {
    expect(getVisitQualityLabel("excellent")).toBe("Excellent");
  });
  it("returns Good", () => {
    expect(getVisitQualityLabel("good")).toBe("Good");
  });
  it("returns Satisfactory", () => {
    expect(getVisitQualityLabel("satisfactory")).toBe("Satisfactory");
  });
  it("returns Poor", () => {
    expect(getVisitQualityLabel("poor")).toBe("Poor");
  });
  it("returns Not Assessed", () => {
    expect(getVisitQualityLabel("not_assessed")).toBe("Not Assessed");
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

// ── evaluateVisitorManagementQuality ────────────────────────────────────────

describe("evaluateVisitorManagementQuality", () => {
  it("returns all zeros for empty visits", () => {
    const r = evaluateVisitorManagementQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalVisits).toBe(0);
    expect(r.qualityRate).toBe(0);
    expect(r.childConsultedRate).toBe(0);
    expect(r.safeguardingRate).toBe(0);
    expect(r.privacyRate).toBe(0);
  });

  it("scores 25 for single perfect visit", () => {
    const v = makeVisit({ visitQuality: "excellent" });
    const r = evaluateVisitorManagementQuality([v]);
    expect(r.overallScore).toBe(25);
    expect(r.qualityRate).toBe(100);
    expect(r.childConsultedRate).toBe(100);
    expect(r.safeguardingRate).toBe(100);
    expect(r.privacyRate).toBe(100);
  });

  it("counts excellent as quality visit", () => {
    const v = makeVisit({ visitQuality: "excellent" });
    const r = evaluateVisitorManagementQuality([v]);
    expect(r.qualityRate).toBe(100);
  });

  it("counts good as quality visit", () => {
    const v = makeVisit({ visitQuality: "good" });
    const r = evaluateVisitorManagementQuality([v]);
    expect(r.qualityRate).toBe(100);
  });

  it("does not count satisfactory as quality visit", () => {
    const v = makeVisit({ visitQuality: "satisfactory" });
    const r = evaluateVisitorManagementQuality([v]);
    expect(r.qualityRate).toBe(0);
  });

  it("does not count poor as quality visit", () => {
    const v = makeVisit({ visitQuality: "poor" });
    const r = evaluateVisitorManagementQuality([v]);
    expect(r.qualityRate).toBe(0);
  });

  it("does not count not_assessed as quality visit", () => {
    const v = makeVisit({ visitQuality: "not_assessed" });
    const r = evaluateVisitorManagementQuality([v]);
    expect(r.qualityRate).toBe(0);
  });

  it("all false booleans score 0", () => {
    const v = makeVisit({
      visitQuality: "poor",
      childConsulted: false,
      safeguardingChecked: false,
      privacyMaintained: false,
    });
    const r = evaluateVisitorManagementQuality([v]);
    expect(r.overallScore).toBe(0);
  });

  it("mixed visits produce mid-range score", () => {
    const good = makeVisit({ visitQuality: "excellent" });
    const bad = makeVisit({
      visitQuality: "poor",
      childConsulted: false,
      safeguardingChecked: false,
      privacyMaintained: false,
    });
    const r = evaluateVisitorManagementQuality([good, bad]);
    expect(r.qualityRate).toBe(50);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("score capped at 25", () => {
    const visits = Array.from({ length: 20 }, () =>
      makeVisit({ visitQuality: "excellent" }),
    );
    const r = evaluateVisitorManagementQuality(visits);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("tracks totalVisits correctly", () => {
    const visits = [makeVisit(), makeVisit(), makeVisit()];
    const r = evaluateVisitorManagementQuality(visits);
    expect(r.totalVisits).toBe(3);
  });

  it("calculates childConsultedRate correctly with mix", () => {
    const consulted = makeVisit();
    const notConsulted = makeVisit({ childConsulted: false });
    const r = evaluateVisitorManagementQuality([consulted, notConsulted]);
    expect(r.childConsultedRate).toBe(50);
  });

  it("calculates safeguardingRate correctly with mix", () => {
    const checked = makeVisit();
    const notChecked = makeVisit({ safeguardingChecked: false });
    const r = evaluateVisitorManagementQuality([checked, notChecked]);
    expect(r.safeguardingRate).toBe(50);
  });

  it("calculates privacyRate correctly with mix", () => {
    const maintained = makeVisit();
    const notMaintained = makeVisit({ privacyMaintained: false });
    const r = evaluateVisitorManagementQuality([maintained, notMaintained]);
    expect(r.privacyRate).toBe(50);
  });

  it("weight verification: qualityRate max 7", () => {
    const v = makeVisit({
      visitQuality: "excellent",
      childConsulted: false,
      safeguardingChecked: false,
      privacyMaintained: false,
    });
    const r = evaluateVisitorManagementQuality([v]);
    expect(r.overallScore).toBe(7);
  });

  it("weight verification: childConsulted max 6", () => {
    const v = makeVisit({
      visitQuality: "poor",
      childConsulted: true,
      safeguardingChecked: false,
      privacyMaintained: false,
    });
    const r = evaluateVisitorManagementQuality([v]);
    expect(r.overallScore).toBe(6);
  });

  it("weight verification: safeguarding max 6", () => {
    const v = makeVisit({
      visitQuality: "poor",
      childConsulted: false,
      safeguardingChecked: true,
      privacyMaintained: false,
    });
    const r = evaluateVisitorManagementQuality([v]);
    expect(r.overallScore).toBe(6);
  });

  it("weight verification: privacy max 6", () => {
    const v = makeVisit({
      visitQuality: "poor",
      childConsulted: false,
      safeguardingChecked: false,
      privacyMaintained: true,
    });
    const r = evaluateVisitorManagementQuality([v]);
    expect(r.overallScore).toBe(6);
  });
});

// ── evaluateVisitorManagementCompliance ─────────────────────────────────────

describe("evaluateVisitorManagementCompliance", () => {
  it("returns all zeros for empty visits", () => {
    const r = evaluateVisitorManagementCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.documentedRate).toBe(0);
    expect(r.staffSupervisedRate).toBe(0);
    expect(r.feedbackRate).toBe(0);
    expect(r.visitorTypeDiversityRatio).toBe(0);
  });

  it("scores high for fully compliant visits with diverse types", () => {
    const types = [
      "family_member", "social_worker", "therapist", "independent_visitor",
      "advocate", "friend", "professional_visitor", "inspector",
    ] as const;
    const visits = types.map((t) => makeVisit({ visitorType: t }));
    const r = evaluateVisitorManagementCompliance(visits);
    expect(r.overallScore).toBe(25);
    expect(r.documentedRate).toBe(100);
    expect(r.staffSupervisedRate).toBe(100);
    expect(r.feedbackRate).toBe(100);
    expect(r.visitorTypeDiversityRatio).toBe(100);
  });

  it("calculates documentedRate correctly", () => {
    const doc = makeVisit();
    const notDoc = makeVisit({ documentedInLog: false });
    const r = evaluateVisitorManagementCompliance([doc, notDoc]);
    expect(r.documentedRate).toBe(50);
  });

  it("calculates staffSupervisedRate correctly", () => {
    const sup = makeVisit();
    const notSup = makeVisit({ staffSupervised: false });
    const r = evaluateVisitorManagementCompliance([sup, notSup]);
    expect(r.staffSupervisedRate).toBe(50);
  });

  it("calculates feedbackRate correctly", () => {
    const fb = makeVisit();
    const noFb = makeVisit({ feedbackRecorded: false });
    const r = evaluateVisitorManagementCompliance([fb, noFb]);
    expect(r.feedbackRate).toBe(50);
  });

  it("calculates visitorTypeDiversityRatio correctly", () => {
    const v = makeVisit({ visitorType: "therapist" });
    const r = evaluateVisitorManagementCompliance([v]);
    expect(r.visitorTypeDiversityRatio).toBe(13);
  });

  it("4 unique types = 50% diversity", () => {
    const visits = [
      makeVisit({ visitorType: "family_member" }),
      makeVisit({ visitorType: "social_worker" }),
      makeVisit({ visitorType: "therapist" }),
      makeVisit({ visitorType: "independent_visitor" }),
    ];
    const r = evaluateVisitorManagementCompliance(visits);
    expect(r.visitorTypeDiversityRatio).toBe(50);
  });

  it("all false booleans with single type scores 0 or very low", () => {
    const v = makeVisit({
      documentedInLog: false,
      staffSupervised: false,
      feedbackRecorded: false,
    });
    const r = evaluateVisitorManagementCompliance([v]);
    // Only diversity contributes: Math.round(13/100 * 5) = Math.round(0.625) = 1
    expect(r.overallScore).toBe(1);
  });

  it("score capped at 25", () => {
    const types = [
      "family_member", "social_worker", "therapist", "independent_visitor",
      "advocate", "friend", "professional_visitor", "inspector",
    ] as const;
    const visits = types.map((t) => makeVisit({ visitorType: t }));
    const r = evaluateVisitorManagementCompliance(visits);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("weight verification: documented max 8", () => {
    const v = makeVisit({
      staffSupervised: false,
      feedbackRecorded: false,
    });
    const r = evaluateVisitorManagementCompliance([v]);
    // documented 8 + diversity Math.round(13/100 * 5)=1 = 9
    expect(r.overallScore).toBe(9);
  });

  it("weight verification: staffSupervised max 7", () => {
    const v = makeVisit({
      documentedInLog: false,
      feedbackRecorded: false,
    });
    const r = evaluateVisitorManagementCompliance([v]);
    // supervised 7 + diversity 1 = 8
    expect(r.overallScore).toBe(8);
  });

  it("weight verification: feedback max 5", () => {
    const v = makeVisit({
      documentedInLog: false,
      staffSupervised: false,
    });
    const r = evaluateVisitorManagementCompliance([v]);
    // feedback 5 + diversity 1 = 6
    expect(r.overallScore).toBe(6);
  });
});

// ── evaluateVisitorManagementPolicy ─────────────────────────────────────────

describe("evaluateVisitorManagementPolicy", () => {
  it("returns 0 and all false for null policy", () => {
    const r = evaluateVisitorManagementPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.visitorManagementStrategy).toBe(false);
    expect(r.safeguardingCheckProcedure).toBe(false);
    expect(r.childConsentProtocol).toBe(false);
    expect(r.privacyAndDignityGuidance).toBe(false);
    expect(r.professionalVisitorFramework).toBe(false);
    expect(r.emergencyVisitProtocol).toBe(false);
    expect(r.regularReview).toBe(false);
  });

  it("returns 25 for full policy", () => {
    const r = evaluateVisitorManagementPolicy(makePolicy());
    expect(r.overallScore).toBe(25);
  });

  it("scores visitorManagementStrategy as 4", () => {
    const p = makePolicy({
      visitorManagementStrategy: true,
      safeguardingCheckProcedure: false,
      childConsentProtocol: false,
      privacyAndDignityGuidance: false,
      professionalVisitorFramework: false,
      emergencyVisitProtocol: false,
      regularReview: false,
    });
    expect(evaluateVisitorManagementPolicy(p).overallScore).toBe(4);
  });

  it("scores safeguardingCheckProcedure as 4", () => {
    const p = makePolicy({
      visitorManagementStrategy: false,
      safeguardingCheckProcedure: true,
      childConsentProtocol: false,
      privacyAndDignityGuidance: false,
      professionalVisitorFramework: false,
      emergencyVisitProtocol: false,
      regularReview: false,
    });
    expect(evaluateVisitorManagementPolicy(p).overallScore).toBe(4);
  });

  it("scores childConsentProtocol as 4", () => {
    const p = makePolicy({
      visitorManagementStrategy: false,
      safeguardingCheckProcedure: false,
      childConsentProtocol: true,
      privacyAndDignityGuidance: false,
      professionalVisitorFramework: false,
      emergencyVisitProtocol: false,
      regularReview: false,
    });
    expect(evaluateVisitorManagementPolicy(p).overallScore).toBe(4);
  });

  it("scores privacyAndDignityGuidance as 4", () => {
    const p = makePolicy({
      visitorManagementStrategy: false,
      safeguardingCheckProcedure: false,
      childConsentProtocol: false,
      privacyAndDignityGuidance: true,
      professionalVisitorFramework: false,
      emergencyVisitProtocol: false,
      regularReview: false,
    });
    expect(evaluateVisitorManagementPolicy(p).overallScore).toBe(4);
  });

  it("scores professionalVisitorFramework as 3", () => {
    const p = makePolicy({
      visitorManagementStrategy: false,
      safeguardingCheckProcedure: false,
      childConsentProtocol: false,
      privacyAndDignityGuidance: false,
      professionalVisitorFramework: true,
      emergencyVisitProtocol: false,
      regularReview: false,
    });
    expect(evaluateVisitorManagementPolicy(p).overallScore).toBe(3);
  });

  it("scores emergencyVisitProtocol as 3", () => {
    const p = makePolicy({
      visitorManagementStrategy: false,
      safeguardingCheckProcedure: false,
      childConsentProtocol: false,
      privacyAndDignityGuidance: false,
      professionalVisitorFramework: false,
      emergencyVisitProtocol: true,
      regularReview: false,
    });
    expect(evaluateVisitorManagementPolicy(p).overallScore).toBe(3);
  });

  it("scores regularReview as 3", () => {
    const p = makePolicy({
      visitorManagementStrategy: false,
      safeguardingCheckProcedure: false,
      childConsentProtocol: false,
      privacyAndDignityGuidance: false,
      professionalVisitorFramework: false,
      emergencyVisitProtocol: false,
      regularReview: true,
    });
    expect(evaluateVisitorManagementPolicy(p).overallScore).toBe(3);
  });

  it("first 4 booleans total 16", () => {
    const p = makePolicy({
      professionalVisitorFramework: false,
      emergencyVisitProtocol: false,
      regularReview: false,
    });
    expect(evaluateVisitorManagementPolicy(p).overallScore).toBe(16);
  });

  it("last 3 booleans total 9", () => {
    const p = makePolicy({
      visitorManagementStrategy: false,
      safeguardingCheckProcedure: false,
      childConsentProtocol: false,
      privacyAndDignityGuidance: false,
    });
    expect(evaluateVisitorManagementPolicy(p).overallScore).toBe(9);
  });

  it("all false scores 0", () => {
    const p = makePolicy({
      visitorManagementStrategy: false,
      safeguardingCheckProcedure: false,
      childConsentProtocol: false,
      privacyAndDignityGuidance: false,
      professionalVisitorFramework: false,
      emergencyVisitProtocol: false,
      regularReview: false,
    });
    expect(evaluateVisitorManagementPolicy(p).overallScore).toBe(0);
  });

  it("mirrors boolean values in result", () => {
    const p = makePolicy({ regularReview: false });
    const r = evaluateVisitorManagementPolicy(p);
    expect(r.regularReview).toBe(false);
    expect(r.visitorManagementStrategy).toBe(true);
  });

  it("score capped at 25", () => {
    const r = evaluateVisitorManagementPolicy(makePolicy());
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("all weights sum to 25", () => {
    expect(4 + 4 + 4 + 4 + 3 + 3 + 3).toBe(25);
    expect(evaluateVisitorManagementPolicy(makePolicy()).overallScore).toBe(25);
  });
});

// ── evaluateStaffVisitorReadiness ───────────────────────────────────────────

describe("evaluateStaffVisitorReadiness", () => {
  it("returns all zeros for empty training", () => {
    const r = evaluateStaffVisitorReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.visitorManagementRate).toBe(0);
    expect(r.safeguardingChecksRate).toBe(0);
    expect(r.childConsentPracticeRate).toBe(0);
    expect(r.privacyProtocolRate).toBe(0);
    expect(r.conflictResolutionRate).toBe(0);
    expect(r.recordKeepingRate).toBe(0);
  });

  it("scores 25 for single fully trained staff", () => {
    const r = evaluateStaffVisitorReadiness([makeTraining()]);
    expect(r.overallScore).toBe(25);
    expect(r.totalStaff).toBe(1);
  });

  it("scores 25 for all staff fully trained", () => {
    const r = evaluateStaffVisitorReadiness([makeTraining(), makeTraining()]);
    expect(r.overallScore).toBe(25);
  });

  it("all untrained staff scores 0", () => {
    const t = makeTraining({
      visitorManagement: false,
      safeguardingChecks: false,
      childConsentPractice: false,
      privacyProtocol: false,
      conflictResolution: false,
      recordKeeping: false,
    });
    const r = evaluateStaffVisitorReadiness([t]);
    expect(r.overallScore).toBe(0);
  });

  it("weight: visitorManagement = 6", () => {
    const t = makeTraining({
      visitorManagement: true,
      safeguardingChecks: false,
      childConsentPractice: false,
      privacyProtocol: false,
      conflictResolution: false,
      recordKeeping: false,
    });
    expect(evaluateStaffVisitorReadiness([t]).overallScore).toBe(6);
  });

  it("weight: safeguardingChecks = 5", () => {
    const t = makeTraining({
      visitorManagement: false,
      safeguardingChecks: true,
      childConsentPractice: false,
      privacyProtocol: false,
      conflictResolution: false,
      recordKeeping: false,
    });
    expect(evaluateStaffVisitorReadiness([t]).overallScore).toBe(5);
  });

  it("weight: childConsentPractice = 5", () => {
    const t = makeTraining({
      visitorManagement: false,
      safeguardingChecks: false,
      childConsentPractice: true,
      privacyProtocol: false,
      conflictResolution: false,
      recordKeeping: false,
    });
    expect(evaluateStaffVisitorReadiness([t]).overallScore).toBe(5);
  });

  it("weight: privacyProtocol = 4", () => {
    const t = makeTraining({
      visitorManagement: false,
      safeguardingChecks: false,
      childConsentPractice: false,
      privacyProtocol: true,
      conflictResolution: false,
      recordKeeping: false,
    });
    expect(evaluateStaffVisitorReadiness([t]).overallScore).toBe(4);
  });

  it("weight: conflictResolution = 3", () => {
    const t = makeTraining({
      visitorManagement: false,
      safeguardingChecks: false,
      childConsentPractice: false,
      privacyProtocol: false,
      conflictResolution: true,
      recordKeeping: false,
    });
    expect(evaluateStaffVisitorReadiness([t]).overallScore).toBe(3);
  });

  it("weight: recordKeeping = 2", () => {
    const t = makeTraining({
      visitorManagement: false,
      safeguardingChecks: false,
      childConsentPractice: false,
      privacyProtocol: false,
      conflictResolution: false,
      recordKeeping: true,
    });
    expect(evaluateStaffVisitorReadiness([t]).overallScore).toBe(2);
  });

  it("all weights sum to 25", () => {
    expect(6 + 5 + 5 + 4 + 3 + 2).toBe(25);
    expect(evaluateStaffVisitorReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("score capped at 25", () => {
    const r = evaluateStaffVisitorReadiness([makeTraining()]);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("calculates per-skill rates correctly for mixed staff", () => {
    const full = makeTraining();
    const partial = makeTraining({
      conflictResolution: false,
      recordKeeping: false,
    });
    const r = evaluateStaffVisitorReadiness([full, partial]);
    expect(r.totalStaff).toBe(2);
    expect(r.visitorManagementRate).toBe(100);
    expect(r.safeguardingChecksRate).toBe(100);
    expect(r.childConsentPracticeRate).toBe(100);
    expect(r.privacyProtocolRate).toBe(100);
    expect(r.conflictResolutionRate).toBe(50);
    expect(r.recordKeepingRate).toBe(50);
  });

  it("partial training produces mid-range score", () => {
    const t = makeTraining({
      visitorManagement: true,
      safeguardingChecks: true,
      childConsentPractice: false,
      privacyProtocol: false,
      conflictResolution: false,
      recordKeeping: false,
    });
    const r = evaluateStaffVisitorReadiness([t]);
    expect(r.overallScore).toBe(11);
  });
});

// ── buildChildVisitorProfiles ───────────────────────────────────────────────

describe("buildChildVisitorProfiles", () => {
  it("returns empty array for empty visits", () => {
    expect(buildChildVisitorProfiles([])).toHaveLength(0);
  });

  it("builds one profile per child", () => {
    const visits = [
      makeVisit({ childId: "child-a", childName: "A" }),
      makeVisit({ childId: "child-a", childName: "A" }),
      makeVisit({ childId: "child-b", childName: "B" }),
    ];
    const profiles = buildChildVisitorProfiles(visits);
    expect(profiles).toHaveLength(2);
  });

  it("calculates totalVisits correctly", () => {
    const visits = [
      makeVisit({ childId: "child-x", childName: "X" }),
      makeVisit({ childId: "child-x", childName: "X" }),
      makeVisit({ childId: "child-x", childName: "X" }),
    ];
    const profiles = buildChildVisitorProfiles(visits);
    expect(profiles[0].totalVisits).toBe(3);
  });

  it("calculates qualityRate correctly", () => {
    const visits = [
      makeVisit({ childId: "child-x", childName: "X", visitQuality: "excellent" }),
      makeVisit({ childId: "child-x", childName: "X", visitQuality: "poor" }),
    ];
    const profiles = buildChildVisitorProfiles(visits);
    expect(profiles[0].qualityRate).toBe(50);
  });

  it("calculates consultedRate correctly", () => {
    const visits = [
      makeVisit({ childId: "child-x", childName: "X", childConsulted: true }),
      makeVisit({ childId: "child-x", childName: "X", childConsulted: false }),
    ];
    const profiles = buildChildVisitorProfiles(visits);
    expect(profiles[0].consultedRate).toBe(50);
  });

  it("uses childName from first visit", () => {
    const visits = [
      makeVisit({ childId: "child-x", childName: "Xavier" }),
      makeVisit({ childId: "child-x", childName: "Xavier Smith" }),
    ];
    const profiles = buildChildVisitorProfiles(visits);
    expect(profiles[0].childName).toBe("Xavier");
  });

  it("score includes frequency bonus for >= 5 visits", () => {
    const visits = Array.from({ length: 5 }, () =>
      makeVisit({ childId: "child-x", childName: "X", visitQuality: "excellent" }),
    );
    const profiles = buildChildVisitorProfiles(visits);
    // 1 (freq) + 3 (quality) + 3 (consulted) + 0 (only 1 type) = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("score includes frequency bonus for >= 10 visits", () => {
    const visits = Array.from({ length: 10 }, () =>
      makeVisit({ childId: "child-x", childName: "X", visitQuality: "excellent" }),
    );
    const profiles = buildChildVisitorProfiles(visits);
    // 2 (freq) + 3 (quality) + 3 (consulted) + 0 (only 1 type) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("score includes diversity bonus for >= 2 types", () => {
    const visits = [
      makeVisit({ childId: "child-x", childName: "X", visitorType: "family_member", visitQuality: "excellent" }),
      makeVisit({ childId: "child-x", childName: "X", visitorType: "social_worker", visitQuality: "excellent" }),
    ];
    const profiles = buildChildVisitorProfiles(visits);
    // 0 (freq < 5) + 3 (quality) + 3 (consulted) + 1 (2 types) = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("score includes diversity bonus for >= 4 types", () => {
    const types = ["family_member", "social_worker", "therapist", "independent_visitor"] as const;
    const visits = types.map((t) =>
      makeVisit({ childId: "child-x", childName: "X", visitorType: t, visitQuality: "excellent" }),
    );
    const profiles = buildChildVisitorProfiles(visits);
    // 0 (freq < 5) + 3 (quality) + 3 (consulted) + 2 (4 types) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("score capped at 10", () => {
    const types = ["family_member", "social_worker", "therapist", "independent_visitor", "advocate"] as const;
    const visits = Array.from({ length: 10 }, (_, i) =>
      makeVisit({
        childId: "child-x",
        childName: "X",
        visitorType: types[i % types.length],
        visitQuality: "excellent",
      }),
    );
    const profiles = buildChildVisitorProfiles(visits);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
    // 2 (freq >= 10) + 3 (quality) + 3 (consulted) + 2 (5 types) = 10
    expect(profiles[0].overallScore).toBe(10);
  });

  it("all bad visits produce score 0", () => {
    const v = makeVisit({
      childId: "child-x",
      childName: "X",
      visitQuality: "poor",
      childConsulted: false,
    });
    const profiles = buildChildVisitorProfiles([v]);
    // 0 (freq) + 0 (quality 0%) + 0 (consulted 0%) + 0 (1 type) = 0
    expect(profiles[0].overallScore).toBe(0);
  });

  it("multiple children each get correct profiles", () => {
    const visits = [
      makeVisit({ childId: "child-a", childName: "A", visitQuality: "excellent" }),
      makeVisit({ childId: "child-b", childName: "B", visitQuality: "poor" }),
    ];
    const profiles = buildChildVisitorProfiles(visits);
    const a = profiles.find((p) => p.childId === "child-a")!;
    const b = profiles.find((p) => p.childId === "child-b")!;
    expect(a.qualityRate).toBe(100);
    expect(b.qualityRate).toBe(0);
  });
});

// ── generateVisitorManagementQualityIntelligence ────────────────────────────

describe("generateVisitorManagementQualityIntelligence", () => {
  const fullVisits: VisitorRecord[] = [
    makeVisit({ childId: "child-alex", childName: "Alex", visitorType: "family_member", visitQuality: "excellent" }),
    makeVisit({ childId: "child-alex", childName: "Alex", visitorType: "social_worker", visitQuality: "good" }),
    makeVisit({ childId: "child-jordan", childName: "Jordan", visitorType: "therapist", visitQuality: "excellent" }),
    makeVisit({ childId: "child-jordan", childName: "Jordan", visitorType: "independent_visitor", visitQuality: "good" }),
    makeVisit({ childId: "child-morgan", childName: "Morgan", visitorType: "advocate", visitQuality: "excellent" }),
    makeVisit({ childId: "child-morgan", childName: "Morgan", visitorType: "friend", visitQuality: "good" }),
  ];
  const fullPolicy = makePolicy();
  const fullTraining = [makeTraining(), makeTraining(), makeTraining()];

  it("returns complete structure", () => {
    const r = generateVisitorManagementQualityIntelligence(
      fullVisits, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r).toHaveProperty("homeId", "oak-house");
    expect(r).toHaveProperty("periodStart", "2026-01-01");
    expect(r).toHaveProperty("periodEnd", "2026-05-20");
    expect(r).toHaveProperty("overallScore");
    expect(r).toHaveProperty("rating");
    expect(r).toHaveProperty("visitorManagementQuality");
    expect(r).toHaveProperty("visitorManagementCompliance");
    expect(r).toHaveProperty("visitorManagementPolicy");
    expect(r).toHaveProperty("staffVisitorReadiness");
    expect(r).toHaveProperty("childProfiles");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("areasForImprovement");
    expect(r).toHaveProperty("actions");
    expect(r).toHaveProperty("regulatoryLinks");
  });

  it("overall score is sum of 4 evaluators capped at 100", () => {
    const r = generateVisitorManagementQualityIntelligence(
      fullVisits, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    const sum =
      r.visitorManagementQuality.overallScore +
      r.visitorManagementCompliance.overallScore +
      r.visitorManagementPolicy.overallScore +
      r.staffVisitorReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(sum, 100));
  });

  it("empty data produces inadequate with score 0", () => {
    const r = generateVisitorManagementQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("full data produces good or outstanding", () => {
    const r = generateVisitorManagementQualityIntelligence(
      fullVisits, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBeGreaterThanOrEqual(60);
    expect(["good", "outstanding"]).toContain(r.rating);
  });

  it("includes 7 regulatory links", () => {
    const r = generateVisitorManagementQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.regulatoryLinks).toHaveLength(7);
  });

  it("regulatory links include CHR 2015 Regulation 7", () => {
    const r = generateVisitorManagementQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 7"))).toBe(true);
  });

  it("regulatory links include CHR 2015 Regulation 22", () => {
    const r = generateVisitorManagementQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 22"))).toBe(true);
  });

  it("regulatory links include SCCIF", () => {
    const r = generateVisitorManagementQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("regulatory links include NMS 15", () => {
    const r = generateVisitorManagementQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 15"))).toBe(true);
  });

  it("regulatory links include Children Act 1989", () => {
    const r = generateVisitorManagementQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("regulatory links include UNCRC Article 9", () => {
    const r = generateVisitorManagementQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 9"))).toBe(true);
  });

  it("regulatory links include Data Protection Act 2018", () => {
    const r = generateVisitorManagementQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("Data Protection Act 2018"))).toBe(true);
  });

  it("generates strengths for good practice", () => {
    const r = generateVisitorManagementQualityIntelligence(
      fullVisits, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates URGENT action when no visits", () => {
    const r = generateVisitorManagementQualityIntelligence(
      [], fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT action when no policy", () => {
    const r = generateVisitorManagementQualityIntelligence(
      fullVisits, null, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.actions.some((a) => a.includes("URGENT") && a.toLowerCase().includes("policy"))).toBe(true);
  });

  it("generates URGENT action when no training", () => {
    const r = generateVisitorManagementQualityIntelligence(
      fullVisits, fullPolicy, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.actions.some((a) => a.includes("URGENT") && a.toLowerCase().includes("training"))).toBe(true);
  });

  it("score capped at 100", () => {
    const r = generateVisitorManagementQualityIntelligence(
      fullVisits, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("child profiles included in output", () => {
    const r = generateVisitorManagementQualityIntelligence(
      fullVisits, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.childProfiles).toHaveLength(3);
  });

  it("visits only — no policy, no training", () => {
    const r = generateVisitorManagementQualityIntelligence(
      fullVisits, null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.visitorManagementPolicy.overallScore).toBe(0);
    expect(r.staffVisitorReadiness.overallScore).toBe(0);
    expect(r.overallScore).toBeGreaterThan(0);
  });

  it("policy only — no visits, no training", () => {
    const r = generateVisitorManagementQualityIntelligence(
      [], fullPolicy, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.visitorManagementQuality.overallScore).toBe(0);
    expect(r.visitorManagementCompliance.overallScore).toBe(0);
    expect(r.visitorManagementPolicy.overallScore).toBe(25);
    expect(r.overallScore).toBe(25);
  });

  it("training only — no visits, no policy", () => {
    const r = generateVisitorManagementQualityIntelligence(
      [], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.staffVisitorReadiness.overallScore).toBe(25);
    expect(r.overallScore).toBe(25);
  });

  it("all poor data produces inadequate", () => {
    const badVisit = makeVisit({
      visitQuality: "poor",
      childConsulted: false,
      safeguardingChecked: false,
      privacyMaintained: false,
      documentedInLog: false,
      staffSupervised: false,
      feedbackRecorded: false,
    });
    const emptyPolicy = makePolicy({
      visitorManagementStrategy: false,
      safeguardingCheckProcedure: false,
      childConsentProtocol: false,
      privacyAndDignityGuidance: false,
      professionalVisitorFramework: false,
      emergencyVisitProtocol: false,
      regularReview: false,
    });
    const untrainedStaff = makeTraining({
      visitorManagement: false,
      safeguardingChecks: false,
      childConsentPractice: false,
      privacyProtocol: false,
      conflictResolution: false,
      recordKeeping: false,
    });
    const r = generateVisitorManagementQualityIntelligence(
      [badVisit], emptyPolicy, [untrainedStaff], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.rating).toBe("inadequate");
    // Only diversity contributes 1 point from compliance
    expect(r.overallScore).toBe(1);
  });

  it("large number of visits does not exceed caps", () => {
    const visits = Array.from({ length: 100 }, () =>
      makeVisit({ visitQuality: "excellent" }),
    );
    const r = generateVisitorManagementQualityIntelligence(
      visits, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.visitorManagementQuality.overallScore).toBeLessThanOrEqual(25);
    expect(r.visitorManagementCompliance.overallScore).toBeLessThanOrEqual(25);
  });
});
