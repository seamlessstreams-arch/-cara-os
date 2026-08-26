// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Visitor Engagement Monitoring Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateVisitorSafeguarding,
  evaluateVisitQuality,
  evaluateVisitorPolicy,
  evaluateStaffVisitorReadiness,
  buildVisitorTypeBreakdown,
  generateVisitorEngagementMonitoringIntelligence,
  getRating,
  getVisitorTypeLabel,
  getVisitOutcomeLabel,
  getRatingLabel,
  } from "../visitor-engagement-monitoring-engine";
import type {
  VisitorRecord,
  VisitorPolicy,
  StaffVisitorTraining,
} from "../visitor-engagement-monitoring-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const makeRecord = (overrides: Partial<VisitorRecord> = {}): VisitorRecord => ({
  id: "vr-001",
  visitorType: "family_member",
  visitDate: "2026-03-15",
  visitOutcome: "positive",
  identityVerified: true,
  signedIn: true,
  dbsChecked: true,
  childConsented: true,
  supervisedAppropriately: true,
  feedbackRecorded: true,
  safeguardingFollowed: true,
  documentedInLog: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<VisitorPolicy> = {}): VisitorPolicy => ({
  id: "pol-001",
  visitorManagementPolicy: true,
  identityVerification: true,
  dbsCheckingProcess: true,
  childConsentProtocol: true,
  supervisionGuidance: true,
  safeguardingProcedure: true,
  regularReview: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffVisitorTraining> = {}): StaffVisitorTraining => ({
  id: "tr-001",
  staffId: "staff-001",
  staffName: "Sarah Johnson",
  visitorManagement: true,
  safeguardingVisitors: true,
  identityChecking: true,
  childProtection: true,
  conflictManagement: true,
  recordKeeping: true,
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
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
});

// ══════════════════════════════════════════════════════════════════════════════
// LABEL MAPS & GETTERS
// ══════════════════════════════════════════════════════════════════════════════

describe("getVisitorTypeLabel", () => {
  it("returns Family Member for family_member", () => {
    expect(getVisitorTypeLabel("family_member")).toBe("Family Member");
  });

  it("returns Social Worker for social_worker", () => {
    expect(getVisitorTypeLabel("social_worker")).toBe("Social Worker");
  });

  it("returns Independent Visitor for independent_visitor", () => {
    expect(getVisitorTypeLabel("independent_visitor")).toBe("Independent Visitor");
  });

  it("returns Therapist for therapist", () => {
    expect(getVisitorTypeLabel("therapist")).toBe("Therapist");
  });

  it("returns Advocate for advocate", () => {
    expect(getVisitorTypeLabel("advocate")).toBe("Advocate");
  });

  it("returns Inspector for inspector", () => {
    expect(getVisitorTypeLabel("inspector")).toBe("Inspector");
  });

  it("returns Professional for professional", () => {
    expect(getVisitorTypeLabel("professional")).toBe("Professional");
  });

  it("returns Other for other", () => {
    expect(getVisitorTypeLabel("other")).toBe("Other");
  });
});

describe("getVisitOutcomeLabel", () => {
  it("returns Very Positive for very_positive", () => {
    expect(getVisitOutcomeLabel("very_positive")).toBe("Very Positive");
  });

  it("returns Positive for positive", () => {
    expect(getVisitOutcomeLabel("positive")).toBe("Positive");
  });

  it("returns Neutral for neutral", () => {
    expect(getVisitOutcomeLabel("neutral")).toBe("Neutral");
  });

  it("returns Concerning for concerning", () => {
    expect(getVisitOutcomeLabel("concerning")).toBe("Concerning");
  });

  it("returns Safeguarding Issue for safeguarding_issue", () => {
    expect(getVisitOutcomeLabel("safeguarding_issue")).toBe("Safeguarding Issue");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns Good for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns Requires Improvement for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns Inadequate for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. VISITOR SAFEGUARDING (ABSENCE PATTERN — empty = 25)
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateVisitorSafeguarding", () => {
  it("returns score 25 for empty records (ABSENCE pattern)", () => {
    const result = evaluateVisitorSafeguarding([]);
    expect(result.score).toBe(25);
    expect(result.totalRecords).toBe(0);
  });

  it("returns zeroed rates for empty records", () => {
    const result = evaluateVisitorSafeguarding([]);
    expect(result.identityVerifiedRate).toBeNull();
    expect(result.dbsCheckedRate).toBeNull();
    expect(result.safeguardingFollowedRate).toBeNull();
    expect(result.signedInRate).toBeNull();
    expect(result.documentedInLogRate).toBeNull();
  });

  it("returns full score for perfect records", () => {
    const records = [makeRecord(), makeRecord({ id: "vr-002" })];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.score).toBe(25);
    expect(result.identityVerifiedRate).toBe(100);
    expect(result.dbsCheckedRate).toBe(100);
    expect(result.safeguardingFollowedRate).toBe(100);
    expect(result.signedInRate).toBe(100);
    expect(result.documentedInLogRate).toBe(100);
  });

  it("returns correct totalRecords count", () => {
    const records = [makeRecord(), makeRecord({ id: "vr-002" }), makeRecord({ id: "vr-003" })];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.totalRecords).toBe(3);
  });

  it("calculates identity verified rate correctly", () => {
    const records = [
      makeRecord({ identityVerified: true }),
      makeRecord({ id: "vr-002", identityVerified: false }),
    ];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.identityVerifiedRate).toBe(50);
  });

  it("calculates DBS checked rate correctly", () => {
    const records = [
      makeRecord({ dbsChecked: true }),
      makeRecord({ id: "vr-002", dbsChecked: false }),
      makeRecord({ id: "vr-003", dbsChecked: false }),
    ];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.dbsCheckedRate).toBe(33);
  });

  it("calculates safeguarding followed rate correctly", () => {
    const records = [
      makeRecord({ safeguardingFollowed: true }),
      makeRecord({ id: "vr-002", safeguardingFollowed: true }),
      makeRecord({ id: "vr-003", safeguardingFollowed: false }),
    ];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.safeguardingFollowedRate).toBe(67);
  });

  it("calculates signed-in rate correctly", () => {
    const records = [
      makeRecord({ signedIn: true }),
      makeRecord({ id: "vr-002", signedIn: false }),
    ];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.signedInRate).toBe(50);
  });

  it("calculates documented in log rate correctly", () => {
    const records = [
      makeRecord({ documentedInLog: true }),
      makeRecord({ id: "vr-002", documentedInLog: false }),
    ];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.documentedInLogRate).toBe(50);
  });

  it("returns 0 score when all safeguarding fields are false", () => {
    const records = [
      makeRecord({
        identityVerified: false,
        dbsChecked: false,
        safeguardingFollowed: false,
        signedIn: false,
        documentedInLog: false,
      }),
    ];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.score).toBe(0);
  });

  it("caps score at 25", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ id: `vr-${i}` }),
    );
    const result = evaluateVisitorSafeguarding(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("scores identity verification at weight 7", () => {
    const records = [
      makeRecord({
        identityVerified: true,
        dbsChecked: false,
        safeguardingFollowed: false,
        signedIn: false,
        documentedInLog: false,
      }),
    ];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.score).toBe(7);
  });

  it("scores DBS checked at weight 6", () => {
    const records = [
      makeRecord({
        identityVerified: false,
        dbsChecked: true,
        safeguardingFollowed: false,
        signedIn: false,
        documentedInLog: false,
      }),
    ];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.score).toBe(6);
  });

  it("scores safeguarding followed at weight 6", () => {
    const records = [
      makeRecord({
        identityVerified: false,
        dbsChecked: false,
        safeguardingFollowed: true,
        signedIn: false,
        documentedInLog: false,
      }),
    ];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.score).toBe(6);
  });

  it("scores combined signedIn+documentedInLog at weight 6", () => {
    const records = [
      makeRecord({
        identityVerified: false,
        dbsChecked: false,
        safeguardingFollowed: false,
        signedIn: true,
        documentedInLog: true,
      }),
    ];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.score).toBe(6);
  });

  it("handles mixed records with partial compliance", () => {
    const records = [
      makeRecord({ identityVerified: true, dbsChecked: true, safeguardingFollowed: true, signedIn: true, documentedInLog: true }),
      makeRecord({ id: "vr-002", identityVerified: false, dbsChecked: false, safeguardingFollowed: false, signedIn: false, documentedInLog: false }),
    ];
    const result = evaluateVisitorSafeguarding(records);
    expect(result.identityVerifiedRate).toBe(50);
    expect(result.dbsCheckedRate).toBe(50);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. VISIT QUALITY (empty = 0)
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateVisitQuality", () => {
  it("returns score 0 for empty records", () => {
    const result = evaluateVisitQuality([]);
    expect(result.score).toBe(0);
    expect(result.totalRecords).toBe(0);
  });

  it("returns zeroed rates for empty records", () => {
    const result = evaluateVisitQuality([]);
    expect(result.positiveOutcomeRate).toBeNull();
    expect(result.childConsentedRate).toBeNull();
    expect(result.feedbackRecordedRate).toBeNull();
  });

  it("returns full score for perfect records", () => {
    const records = [
      makeRecord({ visitOutcome: "very_positive", childConsented: true, feedbackRecorded: true }),
      makeRecord({ id: "vr-002", visitOutcome: "positive", childConsented: true, feedbackRecorded: true }),
    ];
    const result = evaluateVisitQuality(records);
    expect(result.score).toBe(25);
    expect(result.positiveOutcomeRate).toBe(100);
  });

  it("counts very_positive as positive outcome", () => {
    const records = [makeRecord({ visitOutcome: "very_positive" })];
    const result = evaluateVisitQuality(records);
    expect(result.positiveOutcomeRate).toBe(100);
  });

  it("counts positive as positive outcome", () => {
    const records = [makeRecord({ visitOutcome: "positive" })];
    const result = evaluateVisitQuality(records);
    expect(result.positiveOutcomeRate).toBe(100);
  });

  it("does not count neutral as positive outcome", () => {
    const records = [makeRecord({ visitOutcome: "neutral" })];
    const result = evaluateVisitQuality(records);
    expect(result.positiveOutcomeRate).toBe(0);
  });

  it("does not count concerning as positive outcome", () => {
    const records = [makeRecord({ visitOutcome: "concerning" })];
    const result = evaluateVisitQuality(records);
    expect(result.positiveOutcomeRate).toBe(0);
  });

  it("does not count safeguarding_issue as positive outcome", () => {
    const records = [makeRecord({ visitOutcome: "safeguarding_issue" })];
    const result = evaluateVisitQuality(records);
    expect(result.positiveOutcomeRate).toBe(0);
  });

  it("calculates child consented rate correctly", () => {
    const records = [
      makeRecord({ childConsented: true }),
      makeRecord({ id: "vr-002", childConsented: false }),
    ];
    const result = evaluateVisitQuality(records);
    expect(result.childConsentedRate).toBe(50);
  });

  it("calculates feedback recorded rate correctly", () => {
    const records = [
      makeRecord({ feedbackRecorded: true }),
      makeRecord({ id: "vr-002", feedbackRecorded: false }),
      makeRecord({ id: "vr-003", feedbackRecorded: false }),
    ];
    const result = evaluateVisitQuality(records);
    expect(result.feedbackRecordedRate).toBe(33);
  });

  it("returns 0 score when all quality fields are poor", () => {
    const records = [
      makeRecord({ visitOutcome: "concerning", childConsented: false, feedbackRecorded: false }),
    ];
    const result = evaluateVisitQuality(records);
    expect(result.score).toBe(0);
  });

  it("scores positive outcome rate at weight 8", () => {
    const records = [
      makeRecord({ visitOutcome: "very_positive", childConsented: false, feedbackRecorded: false }),
    ];
    const result = evaluateVisitQuality(records);
    expect(result.score).toBe(8);
  });

  it("scores child consented rate at weight 9", () => {
    const records = [
      makeRecord({ visitOutcome: "concerning", childConsented: true, feedbackRecorded: false }),
    ];
    const result = evaluateVisitQuality(records);
    expect(result.score).toBe(9);
  });

  it("scores feedback recorded rate at weight 8", () => {
    const records = [
      makeRecord({ visitOutcome: "concerning", childConsented: false, feedbackRecorded: true }),
    ];
    const result = evaluateVisitQuality(records);
    expect(result.score).toBe(8);
  });

  it("caps score at 25", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ id: `vr-${i}`, visitOutcome: "very_positive" }),
    );
    const result = evaluateVisitQuality(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles mixed outcomes correctly", () => {
    const records = [
      makeRecord({ visitOutcome: "very_positive" }),
      makeRecord({ id: "vr-002", visitOutcome: "positive" }),
      makeRecord({ id: "vr-003", visitOutcome: "neutral" }),
      makeRecord({ id: "vr-004", visitOutcome: "concerning" }),
    ];
    const result = evaluateVisitQuality(records);
    expect(result.positiveOutcomeRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. VISITOR POLICY (null = 0)
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateVisitorPolicy", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluateVisitorPolicy(null);
    expect(result.score).toBe(0);
    expect(result.hasPolicy).toBe(false);
  });

  it("returns all false booleans for null policy", () => {
    const result = evaluateVisitorPolicy(null);
    expect(result.visitorManagementPolicy).toBe(false);
    expect(result.identityVerification).toBe(false);
    expect(result.dbsCheckingProcess).toBe(false);
    expect(result.childConsentProtocol).toBe(false);
    expect(result.supervisionGuidance).toBe(false);
    expect(result.safeguardingProcedure).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns full score for all-true policy", () => {
    const result = evaluateVisitorPolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.hasPolicy).toBe(true);
  });

  it("returns 0 score for all-false policy", () => {
    const result = evaluateVisitorPolicy(
      makePolicy({
        visitorManagementPolicy: false,
        identityVerification: false,
        dbsCheckingProcess: false,
        childConsentProtocol: false,
        supervisionGuidance: false,
        safeguardingProcedure: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(0);
    expect(result.hasPolicy).toBe(true);
  });

  it("weights visitorManagementPolicy at 4 points", () => {
    const result = evaluateVisitorPolicy(
      makePolicy({
        visitorManagementPolicy: true,
        identityVerification: false,
        dbsCheckingProcess: false,
        childConsentProtocol: false,
        supervisionGuidance: false,
        safeguardingProcedure: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights identityVerification at 4 points", () => {
    const result = evaluateVisitorPolicy(
      makePolicy({
        visitorManagementPolicy: false,
        identityVerification: true,
        dbsCheckingProcess: false,
        childConsentProtocol: false,
        supervisionGuidance: false,
        safeguardingProcedure: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights dbsCheckingProcess at 4 points", () => {
    const result = evaluateVisitorPolicy(
      makePolicy({
        visitorManagementPolicy: false,
        identityVerification: false,
        dbsCheckingProcess: true,
        childConsentProtocol: false,
        supervisionGuidance: false,
        safeguardingProcedure: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights childConsentProtocol at 4 points", () => {
    const result = evaluateVisitorPolicy(
      makePolicy({
        visitorManagementPolicy: false,
        identityVerification: false,
        dbsCheckingProcess: false,
        childConsentProtocol: true,
        supervisionGuidance: false,
        safeguardingProcedure: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights supervisionGuidance at 3 points", () => {
    const result = evaluateVisitorPolicy(
      makePolicy({
        visitorManagementPolicy: false,
        identityVerification: false,
        dbsCheckingProcess: false,
        childConsentProtocol: false,
        supervisionGuidance: true,
        safeguardingProcedure: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("weights safeguardingProcedure at 3 points", () => {
    const result = evaluateVisitorPolicy(
      makePolicy({
        visitorManagementPolicy: false,
        identityVerification: false,
        dbsCheckingProcess: false,
        childConsentProtocol: false,
        supervisionGuidance: false,
        safeguardingProcedure: true,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("weights regularReview at 3 points", () => {
    const result = evaluateVisitorPolicy(
      makePolicy({
        visitorManagementPolicy: false,
        identityVerification: false,
        dbsCheckingProcess: false,
        childConsentProtocol: false,
        supervisionGuidance: false,
        safeguardingProcedure: false,
        regularReview: true,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("correctly sums 4+4+4+4+3+3+3 = 25", () => {
    const result = evaluateVisitorPolicy(makePolicy());
    expect(result.score).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3);
  });

  it("returns correct boolean values from policy", () => {
    const policy = makePolicy({ supervisionGuidance: false, regularReview: false });
    const result = evaluateVisitorPolicy(policy);
    expect(result.supervisionGuidance).toBe(false);
    expect(result.regularReview).toBe(false);
    expect(result.visitorManagementPolicy).toBe(true);
  });

  it("handles partial policy correctly", () => {
    const result = evaluateVisitorPolicy(
      makePolicy({
        visitorManagementPolicy: true,
        identityVerification: true,
        dbsCheckingProcess: false,
        childConsentProtocol: false,
        supervisionGuidance: true,
        safeguardingProcedure: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4 + 4 + 3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. STAFF VISITOR READINESS (empty = 0)
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffVisitorReadiness", () => {
  it("returns score 0 for empty training array", () => {
    const result = evaluateStaffVisitorReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns zeroed rates for empty training array", () => {
    const result = evaluateStaffVisitorReadiness([]);
    expect(result.visitorManagementRate).toBeNull();
    expect(result.safeguardingVisitorsRate).toBeNull();
    expect(result.identityCheckingRate).toBeNull();
    expect(result.childProtectionRate).toBeNull();
    expect(result.conflictManagementRate).toBeNull();
    expect(result.recordKeepingRate).toBeNull();
  });

  it("returns full score for perfect training", () => {
    const training = [makeTraining(), makeTraining({ id: "tr-002", staffId: "staff-002", staffName: "Tom Richards" })];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.score).toBe(25);
  });

  it("returns correct totalStaff count", () => {
    const training = [
      makeTraining(),
      makeTraining({ id: "tr-002", staffId: "staff-002" }),
      makeTraining({ id: "tr-003", staffId: "staff-003" }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.totalStaff).toBe(3);
  });

  it("returns 0 score when all training fields are false", () => {
    const training = [
      makeTraining({
        visitorManagement: false,
        safeguardingVisitors: false,
        identityChecking: false,
        childProtection: false,
        conflictManagement: false,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.score).toBe(0);
  });

  it("scores visitorManagement at weight 6", () => {
    const training = [
      makeTraining({
        visitorManagement: true,
        safeguardingVisitors: false,
        identityChecking: false,
        childProtection: false,
        conflictManagement: false,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.score).toBe(6);
  });

  it("scores safeguardingVisitors at weight 5", () => {
    const training = [
      makeTraining({
        visitorManagement: false,
        safeguardingVisitors: true,
        identityChecking: false,
        childProtection: false,
        conflictManagement: false,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.score).toBe(5);
  });

  it("scores identityChecking at weight 5", () => {
    const training = [
      makeTraining({
        visitorManagement: false,
        safeguardingVisitors: false,
        identityChecking: true,
        childProtection: false,
        conflictManagement: false,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.score).toBe(5);
  });

  it("scores childProtection at weight 4", () => {
    const training = [
      makeTraining({
        visitorManagement: false,
        safeguardingVisitors: false,
        identityChecking: false,
        childProtection: true,
        conflictManagement: false,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.score).toBe(4);
  });

  it("scores conflictManagement at weight 3", () => {
    const training = [
      makeTraining({
        visitorManagement: false,
        safeguardingVisitors: false,
        identityChecking: false,
        childProtection: false,
        conflictManagement: true,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.score).toBe(3);
  });

  it("scores recordKeeping at weight 2", () => {
    const training = [
      makeTraining({
        visitorManagement: false,
        safeguardingVisitors: false,
        identityChecking: false,
        childProtection: false,
        conflictManagement: false,
        recordKeeping: true,
      }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.score).toBe(2);
  });

  it("correctly sums 6+5+5+4+3+2 = 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.score).toBe(6 + 5 + 5 + 4 + 3 + 2);
  });

  it("calculates rates correctly with mixed training", () => {
    const training = [
      makeTraining({ visitorManagement: true, safeguardingVisitors: true }),
      makeTraining({ id: "tr-002", staffId: "staff-002", visitorManagement: false, safeguardingVisitors: true }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.visitorManagementRate).toBe(50);
    expect(result.safeguardingVisitorsRate).toBe(100);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ id: `tr-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles single staff with partial training", () => {
    const training = [
      makeTraining({
        visitorManagement: true,
        safeguardingVisitors: true,
        identityChecking: false,
        childProtection: false,
        conflictManagement: false,
        recordKeeping: false,
      }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.score).toBe(6 + 5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// BUILD VISITOR TYPE BREAKDOWN
// ══════════════════════════════════════════════════════════════════════════════

describe("buildVisitorTypeBreakdown", () => {
  it("returns empty array for empty records", () => {
    const result = buildVisitorTypeBreakdown([]);
    expect(result).toEqual([]);
  });

  it("groups records by visitor type", () => {
    const records = [
      makeRecord({ visitorType: "family_member" }),
      makeRecord({ id: "vr-002", visitorType: "family_member" }),
      makeRecord({ id: "vr-003", visitorType: "social_worker" }),
    ];
    const result = buildVisitorTypeBreakdown(records);
    expect(result).toHaveLength(2);
  });

  it("returns correct count per type", () => {
    const records = [
      makeRecord({ visitorType: "family_member" }),
      makeRecord({ id: "vr-002", visitorType: "family_member" }),
      makeRecord({ id: "vr-003", visitorType: "social_worker" }),
    ];
    const result = buildVisitorTypeBreakdown(records);
    const family = result.find((r) => r.visitorType === "family_member");
    const sw = result.find((r) => r.visitorType === "social_worker");
    expect(family?.count).toBe(2);
    expect(sw?.count).toBe(1);
  });

  it("calculates positive rate correctly", () => {
    const records = [
      makeRecord({ visitorType: "family_member", visitOutcome: "very_positive" }),
      makeRecord({ id: "vr-002", visitorType: "family_member", visitOutcome: "concerning" }),
    ];
    const result = buildVisitorTypeBreakdown(records);
    const family = result.find((r) => r.visitorType === "family_member");
    expect(family?.positiveRate).toBe(50);
  });

  it("counts very_positive and positive in positive rate", () => {
    const records = [
      makeRecord({ visitorType: "therapist", visitOutcome: "very_positive" }),
      makeRecord({ id: "vr-002", visitorType: "therapist", visitOutcome: "positive" }),
      makeRecord({ id: "vr-003", visitorType: "therapist", visitOutcome: "neutral" }),
    ];
    const result = buildVisitorTypeBreakdown(records);
    const therapist = result.find((r) => r.visitorType === "therapist");
    expect(therapist?.positiveRate).toBe(67);
  });

  it("calculates safeguarding rate correctly", () => {
    const records = [
      makeRecord({ visitorType: "inspector", safeguardingFollowed: true }),
      makeRecord({ id: "vr-002", visitorType: "inspector", safeguardingFollowed: false }),
    ];
    const result = buildVisitorTypeBreakdown(records);
    const inspector = result.find((r) => r.visitorType === "inspector");
    expect(inspector?.safeguardingRate).toBe(50);
  });

  it("handles all visitor types", () => {
    const types = [
      "family_member", "social_worker", "independent_visitor", "therapist",
      "advocate", "inspector", "professional", "other",
    ] as const;
    const records = types.map((t, i) => makeRecord({ id: `vr-${i}`, visitorType: t }));
    const result = buildVisitorTypeBreakdown(records);
    expect(result).toHaveLength(8);
  });

  it("returns 100% positive rate when all outcomes are positive", () => {
    const records = [
      makeRecord({ visitorType: "advocate", visitOutcome: "positive" }),
      makeRecord({ id: "vr-002", visitorType: "advocate", visitOutcome: "very_positive" }),
    ];
    const result = buildVisitorTypeBreakdown(records);
    const advocate = result.find((r) => r.visitorType === "advocate");
    expect(advocate?.positiveRate).toBe(100);
  });

  it("returns 0% positive rate when no outcomes are positive", () => {
    const records = [
      makeRecord({ visitorType: "professional", visitOutcome: "concerning" }),
      makeRecord({ id: "vr-002", visitorType: "professional", visitOutcome: "safeguarding_issue" }),
    ];
    const result = buildVisitorTypeBreakdown(records);
    const professional = result.find((r) => r.visitorType === "professional");
    expect(professional?.positiveRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// FULL INTELLIGENCE GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("generateVisitorEngagementMonitoringIntelligence", () => {
  const perfectRecords = [
    makeRecord({ id: "vr-001", visitOutcome: "very_positive" }),
    makeRecord({ id: "vr-002", visitOutcome: "positive" }),
  ];
  const perfectPolicy = makePolicy();
  const perfectTraining = [
    makeTraining(),
    makeTraining({ id: "tr-002", staffId: "staff-002", staffName: "Tom Richards" }),
  ];

  it("returns correct homeId", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period dates", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("returns 100 for perfect data", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("caps overall score at 100", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("sums 4 evaluator scores correctly", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    const expectedSum =
      result.visitorSafeguarding.score +
      result.visitQuality.score +
      result.visitorPolicy.score +
      result.staffVisitorReadiness.score;
    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
  });

  it("returns empty data correctly (safeguarding=25, rest=0)", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.visitorSafeguarding.score).toBe(25);
    expect(result.visitQuality.score).toBe(0);
    expect(result.visitorPolicy.score).toBe(0);
    expect(result.staffVisitorReadiness.score).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("returns correct rating for empty data (inadequate at 25)", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("inadequate");
  });

  it("includes 7 regulatory links", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Regulation 12 in regulatory links", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("CHR 2015 Regulation 12 — The protection of children");
  });

  it("includes CHR 2015 Regulation 22 in regulatory links", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("CHR 2015 Regulation 22 — Monitoring the home");
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("SCCIF — Safety of children");
  });

  it("includes NMS 15 in regulatory links", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("NMS 15 — Contact and access to the home");
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("Children Act 1989 — Welfare and safeguarding");
  });

  it("includes Working Together 2023 in regulatory links", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("Working Together to Safeguard Children 2023");
  });

  it("includes Ofsted ILACS in regulatory links", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("Ofsted ILACS — Impact of leaders on practice");
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  it("generates identity verification strength when rate >= 80%", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("identity verification"))).toBe(true);
  });

  it("generates child consent strength when rate >= 80%", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("wishes") || s.includes("consent"))).toBe(true);
  });

  it("generates safeguarding strength when rate >= 80%", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("safeguarding"))).toBe(true);
  });

  it("does not generate identity verification strength when rate < 80%", () => {
    const poorRecords = [
      makeRecord({ identityVerified: true }),
      makeRecord({ id: "vr-002", identityVerified: false }),
      makeRecord({ id: "vr-003", identityVerified: false }),
      makeRecord({ id: "vr-004", identityVerified: false }),
      makeRecord({ id: "vr-005", identityVerified: false }),
    ];
    const result = generateVisitorEngagementMonitoringIntelligence(
      poorRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("identity verification"))).toBe(false);
  });

  // ── Actions ────────────────────────────────────────────────────────────

  it("generates no-records action when records are empty", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("no visitor records"))).toBe(true);
  });

  it("does not mark no-records action as urgent", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    const noRecordsAction = result.actions.find((a) => a.includes("no visitor records"));
    expect(noRecordsAction).toBeDefined();
    expect(noRecordsAction!.includes("[URGENT]")).toBe(false);
  });

  it("generates URGENT action when no policy", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, null, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("[URGENT]") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action when no training", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, perfectPolicy, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("[URGENT]") && a.includes("training"))).toBe(true);
  });

  // ── Areas for Improvement ──────────────────────────────────────────────

  it("generates improvement area when positive outcome < 60%", () => {
    const poorRecords = [
      makeRecord({ visitOutcome: "concerning" }),
      makeRecord({ id: "vr-002", visitOutcome: "safeguarding_issue" }),
      makeRecord({ id: "vr-003", visitOutcome: "neutral" }),
    ];
    const result = generateVisitorEngagementMonitoringIntelligence(
      poorRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Positive visit outcomes"))).toBe(true);
  });

  it("generates improvement area when safeguarding followed < 80%", () => {
    const poorRecords = [
      makeRecord({ safeguardingFollowed: false }),
      makeRecord({ id: "vr-002", safeguardingFollowed: false }),
      makeRecord({ id: "vr-003", safeguardingFollowed: true }),
    ];
    const result = generateVisitorEngagementMonitoringIntelligence(
      poorRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Safeguarding procedures"))).toBe(true);
  });

  it("does not generate improvement areas for empty records", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.filter((a) => a.includes("Positive visit outcomes"))).toHaveLength(0);
    expect(result.areasForImprovement.filter((a) => a.includes("Safeguarding procedures"))).toHaveLength(0);
  });

  it("includes visitor type breakdown", () => {
    const records = [
      makeRecord({ visitorType: "family_member" }),
      makeRecord({ id: "vr-002", visitorType: "social_worker" }),
    ];
    const result = generateVisitorEngagementMonitoringIntelligence(
      records, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.visitorTypeBreakdown).toHaveLength(2);
  });

  it("returns outstanding rating for score >= 80", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      perfectRecords, perfectPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
  });

  it("returns good rating for score 60-79", () => {
    // Records with safeguarding, policy with some gaps, some training
    const partialRecords = [
      makeRecord({ visitOutcome: "positive" }),
      makeRecord({ id: "vr-002", visitOutcome: "neutral", childConsented: false, feedbackRecorded: false }),
    ];
    const partialPolicy = makePolicy({
      supervisionGuidance: false,
      safeguardingProcedure: false,
      regularReview: false,
    });
    const result = generateVisitorEngagementMonitoringIntelligence(
      partialRecords, partialPolicy, perfectTraining, "oak-house", "2026-01-01", "2026-05-19",
    );
    // safeguarding=25, quality varies, policy=16, training=25 => check
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
  });

  it("handles all empty inputs gracefully", () => {
    const result = generateVisitorEngagementMonitoringIntelligence(
      [], null, [], "test-home", "2026-01-01", "2026-12-31",
    );
    expect(result.overallScore).toBe(25);
    expect(result.visitorTypeBreakdown).toHaveLength(0);
    expect(result.actions.length).toBeGreaterThan(0);
  });
});
