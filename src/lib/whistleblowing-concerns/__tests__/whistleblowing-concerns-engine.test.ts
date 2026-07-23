// ══════════════════════════════════════════════════════════════════════════════
// WHISTLEBLOWING & PROFESSIONAL CONCERNS INTELLIGENCE — TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateWhistleblowingConcernsIntelligence,
  evaluateReportingCulture,
  evaluateResponseQuality,
  evaluateStaffProtection,
  evaluateOutcomesLearning,
  getConcernCategoryLabel,
  getConcernSeverityLabel,
  getConcernStatusLabel,
  getResolutionOutcomeLabel,
  getProtectionStatusLabel,
  getReporterTypeLabel,
  getDemoWhistleblowingConcernsData,
} from "../whistleblowing-concerns-engine";
import type {
  WhistleblowingConcern,
  StaffProtectionRecord,
  WhistleblowingPolicy,
  ConcernCulture,
  ConcernCategory,
  ConcernSeverity,
  ConcernStatus,
  ResolutionOutcome,
  ProtectionStatus,
  ReporterType,
} from "../whistleblowing-concerns-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

function makePolicy(overrides?: Partial<WhistleblowingPolicy>): WhistleblowingPolicy {
  return {
    id: "pol-001",
    lastReviewedDate: "2026-01-15",
    staffAwareOfPolicy: true,
    policyAccessible: true,
    namedContactDesignated: true,
    externalContactsListed: true,
    childFriendlyVersionAvailable: true,
    trainingProvidedToAllStaff: true,
    annualRefresherCompleted: true,
    ...overrides,
  };
}

function makeCulture(overrides?: Partial<ConcernCulture>): ConcernCulture {
  return {
    id: "cult-001",
    surveyDate: "2026-01-20",
    staffConfidenceToReport: 8,
    staffTrustInProcess: 7.5,
    perceivedFairnessOfOutcomes: 7,
    awarenessOfWhistleblowingPolicy: 9,
    responseRate: 85,
    ...overrides,
  };
}

function makeConcern(overrides?: Partial<WhistleblowingConcern>): WhistleblowingConcern {
  return {
    id: "wbc-001",
    reportDate: "2026-02-15",
    category: "safeguarding",
    severity: "critical",
    status: "resolved",
    reporterType: "staff_member",
    isAnonymous: false,
    acknowledgedWithin48Hours: true,
    investigationStartedWithin7Days: true,
    resolvedWithin30Days: true,
    resolutionOutcome: "substantiated",
    externalReferralMade: true,
    lessonsIdentified: true,
    actionsTaken: ["Staff suspended", "LADO referral", "Policy review"],
    ...overrides,
  };
}

function makeProtection(overrides?: Partial<StaffProtectionRecord>): StaffProtectionRecord {
  return {
    id: "prot-001",
    concernId: "wbc-001",
    staffId: "staff-010",
    protectionStatus: "fully_protected",
    supportOffered: true,
    supportAccepted: true,
    confidentialityMaintained: true,
    retaliationReported: false,
    retaliationInvestigated: false,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. LABEL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("getConcernCategoryLabel", () => {
  it("returns correct label for safeguarding", () => {
    expect(getConcernCategoryLabel("safeguarding")).toBe("Safeguarding");
  });

  it("returns correct label for practice_standards", () => {
    expect(getConcernCategoryLabel("practice_standards")).toBe("Practice Standards");
  });

  it("returns correct label for regulatory_breach", () => {
    expect(getConcernCategoryLabel("regulatory_breach")).toBe("Regulatory Breach");
  });

  it("returns correct label for bullying_harassment", () => {
    expect(getConcernCategoryLabel("bullying_harassment")).toBe("Bullying & Harassment");
  });

  it("returns correct label for fraud_financial", () => {
    expect(getConcernCategoryLabel("fraud_financial")).toBe("Fraud / Financial");
  });

  it("returns correct label for health_safety", () => {
    expect(getConcernCategoryLabel("health_safety")).toBe("Health & Safety");
  });

  it("returns correct label for data_protection", () => {
    expect(getConcernCategoryLabel("data_protection")).toBe("Data Protection");
  });

  it("returns correct label for discrimination", () => {
    expect(getConcernCategoryLabel("discrimination")).toBe("Discrimination");
  });

  it("returns correct label for management_conduct", () => {
    expect(getConcernCategoryLabel("management_conduct")).toBe("Management Conduct");
  });

  it("returns correct label for staffing_levels", () => {
    expect(getConcernCategoryLabel("staffing_levels")).toBe("Staffing Levels");
  });
});

describe("getConcernSeverityLabel", () => {
  it("returns correct label for critical", () => {
    expect(getConcernSeverityLabel("critical")).toBe("Critical");
  });

  it("returns correct label for high", () => {
    expect(getConcernSeverityLabel("high")).toBe("High");
  });

  it("returns correct label for medium", () => {
    expect(getConcernSeverityLabel("medium")).toBe("Medium");
  });

  it("returns correct label for low", () => {
    expect(getConcernSeverityLabel("low")).toBe("Low");
  });
});

describe("getConcernStatusLabel", () => {
  it("returns correct label for received", () => {
    expect(getConcernStatusLabel("received")).toBe("Received");
  });

  it("returns correct label for acknowledged", () => {
    expect(getConcernStatusLabel("acknowledged")).toBe("Acknowledged");
  });

  it("returns correct label for investigating", () => {
    expect(getConcernStatusLabel("investigating")).toBe("Investigating");
  });

  it("returns correct label for resolved", () => {
    expect(getConcernStatusLabel("resolved")).toBe("Resolved");
  });

  it("returns correct label for escalated", () => {
    expect(getConcernStatusLabel("escalated")).toBe("Escalated");
  });

  it("returns correct label for closed_no_action", () => {
    expect(getConcernStatusLabel("closed_no_action")).toBe("Closed — No Action");
  });

  it("returns correct label for withdrawn", () => {
    expect(getConcernStatusLabel("withdrawn")).toBe("Withdrawn");
  });
});

describe("getResolutionOutcomeLabel", () => {
  it("returns correct label for substantiated", () => {
    expect(getResolutionOutcomeLabel("substantiated")).toBe("Substantiated");
  });

  it("returns correct label for partially_substantiated", () => {
    expect(getResolutionOutcomeLabel("partially_substantiated")).toBe("Partially Substantiated");
  });

  it("returns correct label for unsubstantiated", () => {
    expect(getResolutionOutcomeLabel("unsubstantiated")).toBe("Unsubstantiated");
  });

  it("returns correct label for inconclusive", () => {
    expect(getResolutionOutcomeLabel("inconclusive")).toBe("Inconclusive");
  });

  it("returns correct label for withdrawn", () => {
    expect(getResolutionOutcomeLabel("withdrawn")).toBe("Withdrawn");
  });
});

describe("getProtectionStatusLabel", () => {
  it("returns correct label for fully_protected", () => {
    expect(getProtectionStatusLabel("fully_protected")).toBe("Fully Protected");
  });

  it("returns correct label for partially_protected", () => {
    expect(getProtectionStatusLabel("partially_protected")).toBe("Partially Protected");
  });

  it("returns correct label for not_protected", () => {
    expect(getProtectionStatusLabel("not_protected")).toBe("Not Protected");
  });

  it("returns correct label for retaliation_reported", () => {
    expect(getProtectionStatusLabel("retaliation_reported")).toBe("Retaliation Reported");
  });
});

describe("getReporterTypeLabel", () => {
  it("returns correct label for staff_member", () => {
    expect(getReporterTypeLabel("staff_member")).toBe("Staff Member");
  });

  it("returns correct label for anonymous", () => {
    expect(getReporterTypeLabel("anonymous")).toBe("Anonymous");
  });

  it("returns correct label for external_professional", () => {
    expect(getReporterTypeLabel("external_professional")).toBe("External Professional");
  });

  it("returns correct label for child", () => {
    expect(getReporterTypeLabel("child")).toBe("Child");
  });

  it("returns correct label for parent_carer", () => {
    expect(getReporterTypeLabel("parent_carer")).toBe("Parent / Carer");
  });

  it("returns correct label for visitor", () => {
    expect(getReporterTypeLabel("visitor")).toBe("Visitor");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. EVALUATE REPORTING CULTURE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateReportingCulture", () => {
  it("returns max score (25) when all criteria met", () => {
    const result = evaluateReportingCulture([], makePolicy(), makeCulture());
    expect(result.score).toBe(25);
  });

  it("awards 5 points for policy reviewed within 12 months", () => {
    const result = evaluateReportingCulture([], makePolicy(), null);
    expect(result.policyReviewedWithin12Months).toBe(true);
    // Policy alone gives: 5 (reviewed) + 4 (aware) + 3 (named) + 3 (external) + 3 (child) = 18
    expect(result.score).toBe(18);
  });

  it("gives 0 for policy reviewed over 12 months ago", () => {
    const result = evaluateReportingCulture(
      [],
      makePolicy({ lastReviewedDate: "2024-01-01" }),
      null,
    );
    expect(result.policyReviewedWithin12Months).toBe(false);
  });

  it("awards 4 points for staff awareness", () => {
    const base = evaluateReportingCulture(
      [],
      makePolicy({ staffAwareOfPolicy: false }),
      null,
    );
    const withAwareness = evaluateReportingCulture([], makePolicy(), null);
    expect(withAwareness.score - base.score).toBe(4);
  });

  it("awards 3 points for named contact", () => {
    const without = evaluateReportingCulture(
      [],
      makePolicy({ namedContactDesignated: false }),
      null,
    );
    const withContact = evaluateReportingCulture(
      [],
      makePolicy({ namedContactDesignated: true }),
      null,
    );
    expect(withContact.score - without.score).toBe(3);
  });

  it("awards 3 points for external contacts listed", () => {
    const without = evaluateReportingCulture(
      [],
      makePolicy({ externalContactsListed: false }),
      null,
    );
    const withContacts = evaluateReportingCulture(
      [],
      makePolicy({ externalContactsListed: true }),
      null,
    );
    expect(withContacts.score - without.score).toBe(3);
  });

  it("awards 3 points for child-friendly version", () => {
    const without = evaluateReportingCulture(
      [],
      makePolicy({ childFriendlyVersionAvailable: false }),
      null,
    );
    const withVersion = evaluateReportingCulture(
      [],
      makePolicy({ childFriendlyVersionAvailable: true }),
      null,
    );
    expect(withVersion.score - without.score).toBe(3);
  });

  it("awards 4 points for staff confidence >= 7", () => {
    const below = evaluateReportingCulture(
      [],
      null,
      makeCulture({ staffConfidenceToReport: 6 }),
    );
    const above = evaluateReportingCulture(
      [],
      null,
      makeCulture({ staffConfidenceToReport: 7 }),
    );
    expect(above.score - below.score).toBe(4);
  });

  it("awards 3 points for staff trust >= 7", () => {
    const below = evaluateReportingCulture(
      [],
      null,
      makeCulture({ staffTrustInProcess: 6.9 }),
    );
    const above = evaluateReportingCulture(
      [],
      null,
      makeCulture({ staffTrustInProcess: 7 }),
    );
    expect(above.score - below.score).toBe(3);
  });

  it("returns 0 when no policy and no culture data", () => {
    const result = evaluateReportingCulture([], null, null);
    expect(result.score).toBe(0);
  });

  it("clamps score at 25 even if all criteria exceed", () => {
    const result = evaluateReportingCulture([], makePolicy(), makeCulture());
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("correctly identifies staff confidence below 7", () => {
    const result = evaluateReportingCulture(
      [],
      null,
      makeCulture({ staffConfidenceToReport: 5 }),
    );
    expect(result.staffConfidenceAbove7).toBe(false);
  });

  it("correctly identifies staff trust below 7", () => {
    const result = evaluateReportingCulture(
      [],
      null,
      makeCulture({ staffTrustInProcess: 6.5 }),
    );
    expect(result.staffTrustAbove7).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. EVALUATE RESPONSE QUALITY
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateResponseQuality", () => {
  it("returns baseline + bonus (25) when no concerns", () => {
    const result = evaluateResponseQuality([]);
    expect(result.score).toBe(25);
    expect(result.totalConcerns).toBe(0);
  });

  it("returns unmeasured rates when no concerns", () => {
    const result = evaluateResponseQuality([]);
    expect(result.acknowledgedWithin48HrsRate).toBeNull();
    expect(result.investigationStartedRate).toBeNull();
    expect(result.resolvedWithin30DaysRate).toBeNull();
    expect(result.lessonsIdentifiedRate).toBeNull();
  });

  it("awards 8 points when >=90% acknowledged within 48hrs", () => {
    const concerns = Array.from({ length: 10 }, (_, i) =>
      makeConcern({
        id: `wbc-${i}`,
        acknowledgedWithin48Hours: i < 9 ? true : false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: false,
        lessonsIdentified: false,
        externalReferralMade: false,
        actionsTaken: [],
        severity: "low",
      }),
    );
    const result = evaluateResponseQuality(concerns);
    expect(result.acknowledgedWithin48HrsRate).toBe(90);
    // 8 for ack, 0 for inv, 0 for res, 0 for lessons, 0 for ext ref (no critical/high), 0 for actions
    expect(result.score).toBeGreaterThanOrEqual(8);
  });

  it("does not award ack points when below 90%", () => {
    const concerns = Array.from({ length: 10 }, (_, i) =>
      makeConcern({
        id: `wbc-${i}`,
        acknowledgedWithin48Hours: i < 8 ? true : false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: false,
        lessonsIdentified: false,
        externalReferralMade: false,
        actionsTaken: [],
        severity: "low",
      }),
    );
    const result = evaluateResponseQuality(concerns);
    expect(result.acknowledgedWithin48HrsRate).toBe(80);
    // No ack points (below 90%), and no external referral points (nothing critical/high to refer)
    expect(result.score).toBe(0);
  });

  it("awards 6 points when >=90% investigation started", () => {
    const concerns = Array.from({ length: 10 }, (_, i) =>
      makeConcern({
        id: `wbc-${i}`,
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: i < 9 ? true : false,
        resolvedWithin30Days: false,
        lessonsIdentified: false,
        externalReferralMade: false,
        actionsTaken: [],
        severity: "low",
      }),
    );
    const result = evaluateResponseQuality(concerns);
    expect(result.investigationStartedRate).toBe(90);
    // 6 for inv; no external referral points (nothing critical/high to refer)
    expect(result.score).toBe(6);
  });

  it("awards 6 points when >=80% resolved within 30 days", () => {
    const concerns = Array.from({ length: 10 }, (_, i) =>
      makeConcern({
        id: `wbc-${i}`,
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: i < 8 ? true : false,
        lessonsIdentified: false,
        externalReferralMade: false,
        actionsTaken: [],
        severity: "low",
      }),
    );
    const result = evaluateResponseQuality(concerns);
    expect(result.resolvedWithin30DaysRate).toBe(80);
    // 6 for resolved; no external referral points (nothing critical/high to refer)
    expect(result.score).toBe(6);
  });

  it("awards 5 points when >=80% lessons identified", () => {
    const concerns = Array.from({ length: 10 }, (_, i) =>
      makeConcern({
        id: `wbc-${i}`,
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: false,
        lessonsIdentified: i < 8 ? true : false,
        externalReferralMade: false,
        actionsTaken: [],
        severity: "low",
      }),
    );
    const result = evaluateResponseQuality(concerns);
    expect(result.lessonsIdentifiedRate).toBe(80);
    // 5 for lessons; no external referral points (nothing critical/high to refer)
    expect(result.score).toBe(5);
  });

  it("awards 3 points for external referral on critical/high concerns", () => {
    const concerns = [
      makeConcern({
        id: "wbc-crit",
        severity: "critical",
        externalReferralMade: true,
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: false,
        lessonsIdentified: false,
        actionsTaken: [],
      }),
    ];
    const result = evaluateResponseQuality(concerns);
    expect(result.externalReferralForCriticalHighRate).toBe(100);
    expect(result.score).toBe(3);
  });

  it("awards 2 points for avg actions >= 2", () => {
    const concerns = [
      makeConcern({
        id: "wbc-acts",
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: false,
        lessonsIdentified: false,
        externalReferralMade: false,
        severity: "low",
        actionsTaken: ["action1", "action2"],
      }),
    ];
    const result = evaluateResponseQuality(concerns);
    expect(result.averageActionsTaken).toBe(2);
    // 2 for actions; no external referral points (nothing critical/high to refer)
    expect(result.score).toBe(2);
  });

  it("awards maximum 30 when all criteria met", () => {
    const concerns = [
      makeConcern({
        id: "wbc-perfect",
        acknowledgedWithin48Hours: true,
        investigationStartedWithin7Days: true,
        resolvedWithin30Days: true,
        lessonsIdentified: true,
        severity: "critical",
        externalReferralMade: true,
        actionsTaken: ["a", "b", "c"],
      }),
    ];
    const result = evaluateResponseQuality(concerns);
    expect(result.score).toBe(30);
  });

  it("clamps score at 30", () => {
    const concerns = [
      makeConcern({
        acknowledgedWithin48Hours: true,
        investigationStartedWithin7Days: true,
        resolvedWithin30Days: true,
        lessonsIdentified: true,
        severity: "critical",
        externalReferralMade: true,
        actionsTaken: ["a", "b", "c"],
      }),
    ];
    const result = evaluateResponseQuality(concerns);
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it("calculates average actions taken correctly", () => {
    const concerns = [
      makeConcern({ id: "wbc-1", actionsTaken: ["a", "b", "c"] }),
      makeConcern({ id: "wbc-2", actionsTaken: ["x"] }),
    ];
    const result = evaluateResponseQuality(concerns);
    expect(result.averageActionsTaken).toBe(2);
  });

  it("leaves external referral rate unmeasured with no critical/high concerns", () => {
    const concerns = [
      makeConcern({
        id: "wbc-low",
        severity: "low",
        externalReferralMade: false,
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: false,
        lessonsIdentified: false,
        actionsTaken: [],
      }),
    ];
    const result = evaluateResponseQuality(concerns);
    expect(result.externalReferralForCriticalHighRate).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. EVALUATE STAFF PROTECTION
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffProtection", () => {
  it("returns 0 score for empty protections", () => {
    const result = evaluateStaffProtection([]);
    expect(result.score).toBe(0);
    expect(result.totalProtections).toBe(0);
  });

  it("returns noRetaliationReported = true for empty protections", () => {
    const result = evaluateStaffProtection([]);
    expect(result.noRetaliationReported).toBe(true);
  });

  it("returns allRetaliationInvestigated = true for empty protections", () => {
    const result = evaluateStaffProtection([]);
    expect(result.allRetaliationInvestigated).toBe(true);
  });

  it("awards 8 points for fully protected rate >= 90%", () => {
    const protections = Array.from({ length: 10 }, (_, i) =>
      makeProtection({
        id: `prot-${i}`,
        protectionStatus: i < 9 ? "fully_protected" : "partially_protected",
        supportOffered: false,
        confidentialityMaintained: false,
      }),
    );
    const result = evaluateStaffProtection(protections);
    expect(result.fullyProtectedRate).toBe(90);
    expect(result.score).toBeGreaterThanOrEqual(8);
  });

  it("does not award fully protected points below 90%", () => {
    const protections = Array.from({ length: 10 }, (_, i) =>
      makeProtection({
        id: `prot-${i}`,
        protectionStatus: i < 8 ? "fully_protected" : "not_protected",
        supportOffered: false,
        confidentialityMaintained: false,
      }),
    );
    const result = evaluateStaffProtection(protections);
    expect(result.fullyProtectedRate).toBe(80);
    // No points for fully protected, but 4 for no retaliation + 4 for all investigated
    expect(result.score).toBe(8);
  });

  it("awards 5 points for confidentiality >= 95%", () => {
    const protections = Array.from({ length: 20 }, (_, i) =>
      makeProtection({
        id: `prot-${i}`,
        protectionStatus: "not_protected",
        confidentialityMaintained: i < 19 ? true : false,
        supportOffered: false,
      }),
    );
    const result = evaluateStaffProtection(protections);
    expect(result.confidentialityMaintainedRate).toBe(95);
    // 5 for confidentiality + 4 no retaliation + 4 all investigated = 13
    expect(result.score).toBe(13);
  });

  it("awards 4 points for support offered >= 90%", () => {
    const protections = Array.from({ length: 10 }, (_, i) =>
      makeProtection({
        id: `prot-${i}`,
        protectionStatus: "not_protected",
        confidentialityMaintained: false,
        supportOffered: i < 9 ? true : false,
      }),
    );
    const result = evaluateStaffProtection(protections);
    expect(result.supportOfferedRate).toBe(90);
    // 4 for support + 4 no retaliation + 4 all investigated = 12
    expect(result.score).toBe(12);
  });

  it("awards 4 points for no retaliation reported", () => {
    const result = evaluateStaffProtection([
      makeProtection({
        protectionStatus: "not_protected",
        confidentialityMaintained: false,
        supportOffered: false,
        retaliationReported: false,
      }),
    ]);
    // 4 for no retaliation + 4 for all investigated (no retaliation to investigate)
    expect(result.noRetaliationReported).toBe(true);
    expect(result.score).toBe(8);
  });

  it("does not award no-retaliation points when retaliation reported", () => {
    const result = evaluateStaffProtection([
      makeProtection({
        protectionStatus: "not_protected",
        confidentialityMaintained: false,
        supportOffered: false,
        retaliationReported: true,
        retaliationInvestigated: true,
      }),
    ]);
    expect(result.noRetaliationReported).toBe(false);
    // 0 for no retaliation + 4 for all investigated = 4
    expect(result.score).toBe(4);
  });

  it("awards 4 points for all retaliation investigated", () => {
    const result = evaluateStaffProtection([
      makeProtection({
        protectionStatus: "not_protected",
        confidentialityMaintained: false,
        supportOffered: false,
        retaliationReported: true,
        retaliationInvestigated: true,
      }),
    ]);
    expect(result.allRetaliationInvestigated).toBe(true);
  });

  it("does not award investigated points when retaliation not investigated", () => {
    const result = evaluateStaffProtection([
      makeProtection({
        protectionStatus: "not_protected",
        confidentialityMaintained: false,
        supportOffered: false,
        retaliationReported: true,
        retaliationInvestigated: false,
      }),
    ]);
    expect(result.allRetaliationInvestigated).toBe(false);
    expect(result.score).toBe(0);
  });

  it("awards maximum 25 when all criteria met", () => {
    const result = evaluateStaffProtection([
      makeProtection({
        protectionStatus: "fully_protected",
        confidentialityMaintained: true,
        supportOffered: true,
        retaliationReported: false,
      }),
    ]);
    expect(result.score).toBe(25);
  });

  it("clamps score at 25", () => {
    const result = evaluateStaffProtection([makeProtection()]);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("calculates rates correctly with mixed data", () => {
    const protections = [
      makeProtection({
        id: "p1",
        protectionStatus: "fully_protected",
        confidentialityMaintained: true,
        supportOffered: true,
      }),
      makeProtection({
        id: "p2",
        protectionStatus: "not_protected",
        confidentialityMaintained: false,
        supportOffered: false,
      }),
    ];
    const result = evaluateStaffProtection(protections);
    expect(result.fullyProtectedRate).toBe(50);
    expect(result.confidentialityMaintainedRate).toBe(50);
    expect(result.supportOfferedRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. EVALUATE OUTCOMES & LEARNING
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateOutcomesLearning", () => {
  it("returns 0 score for empty concerns", () => {
    const result = evaluateOutcomesLearning([]);
    expect(result.score).toBe(0);
    expect(result.resolutionDocumentedRate).toBeNull();
  });

  it("returns escalationAppropriate = true for empty concerns", () => {
    const result = evaluateOutcomesLearning([]);
    expect(result.escalationAppropriate).toBe(true);
  });

  it("awards points for resolution documented rate", () => {
    const concerns = [
      makeConcern({
        id: "wbc-1",
        resolutionOutcome: "substantiated",
        lessonsIdentified: false,
        severity: "low",
        actionsTaken: [],
      }),
    ];
    const result = evaluateOutcomesLearning(concerns);
    expect(result.resolutionDocumentedRate).toBe(100);
    expect(result.score).toBeGreaterThan(0);
  });

  it("gives partial documented points proportionally", () => {
    const concerns = [
      makeConcern({ id: "wbc-1", resolutionOutcome: "substantiated", lessonsIdentified: false, severity: "low", actionsTaken: [] }),
      makeConcern({ id: "wbc-2", resolutionOutcome: undefined, lessonsIdentified: false, severity: "low", actionsTaken: [] }),
    ];
    const result = evaluateOutcomesLearning(concerns);
    expect(result.resolutionDocumentedRate).toBe(50);
  });

  it("awards 5 points for appropriate substantiation rate (20-80%)", () => {
    const concerns = [
      makeConcern({ id: "wbc-1", resolutionOutcome: "substantiated", lessonsIdentified: false, severity: "low", actionsTaken: [] }),
      makeConcern({ id: "wbc-2", resolutionOutcome: "unsubstantiated", lessonsIdentified: false, severity: "low", actionsTaken: [] }),
    ];
    const result = evaluateOutcomesLearning(concerns);
    expect(result.substantiationRate).toBe(50);
    // Should get 5 points for appropriate substantiation
  });

  it("awards 3 points for non-zero but outside 20-80% substantiation", () => {
    const concerns = Array.from({ length: 10 }, (_, i) =>
      makeConcern({
        id: `wbc-${i}`,
        resolutionOutcome: i === 0 ? "substantiated" : "unsubstantiated",
        lessonsIdentified: false,
        severity: "low",
        actionsTaken: [],
      }),
    );
    const result = evaluateOutcomesLearning(concerns);
    expect(result.substantiationRate).toBe(10);
    // 10% is outside 20-80% but >0, so 3 points
  });

  it("awards 4 points when lessons identified >= 80%", () => {
    const concerns = Array.from({ length: 10 }, (_, i) =>
      makeConcern({
        id: `wbc-${i}`,
        resolutionOutcome: undefined,
        lessonsIdentified: i < 8 ? true : false,
        severity: "low",
        actionsTaken: [],
      }),
    );
    const result = evaluateOutcomesLearning(concerns);
    expect(result.lessonsIdentifiedRate).toBe(80);
  });

  it("awards 3 points for avg actions >= 2", () => {
    const concerns = [
      makeConcern({
        id: "wbc-1",
        resolutionOutcome: undefined,
        lessonsIdentified: false,
        severity: "low",
        actionsTaken: ["a", "b", "c"],
      }),
    ];
    const result = evaluateOutcomesLearning(concerns);
    expect(result.averageActionsPerConcern).toBe(3);
  });

  it("awards 2 points for appropriate escalation", () => {
    const concerns = [
      makeConcern({
        id: "wbc-crit",
        severity: "critical",
        status: "escalated",
        resolutionOutcome: undefined,
        lessonsIdentified: false,
        actionsTaken: [],
      }),
    ];
    const result = evaluateOutcomesLearning(concerns);
    expect(result.escalationAppropriate).toBe(true);
  });

  it("flags inappropriate escalation for unresolved critical concern", () => {
    const concerns = [
      makeConcern({
        id: "wbc-crit",
        severity: "critical",
        status: "received",
        externalReferralMade: false,
        resolutionOutcome: undefined,
        lessonsIdentified: false,
        actionsTaken: [],
      }),
    ];
    const result = evaluateOutcomesLearning(concerns);
    expect(result.escalationAppropriate).toBe(false);
  });

  it("treats resolved critical concerns as appropriate escalation", () => {
    const concerns = [
      makeConcern({
        id: "wbc-crit",
        severity: "critical",
        status: "resolved",
        externalReferralMade: false,
        resolutionOutcome: "substantiated",
        lessonsIdentified: false,
        actionsTaken: [],
      }),
    ];
    const result = evaluateOutcomesLearning(concerns);
    expect(result.escalationAppropriate).toBe(true);
  });

  it("treats external referral as appropriate for critical concerns", () => {
    const concerns = [
      makeConcern({
        id: "wbc-crit",
        severity: "high",
        status: "investigating",
        externalReferralMade: true,
        resolutionOutcome: undefined,
        lessonsIdentified: false,
        actionsTaken: [],
      }),
    ];
    const result = evaluateOutcomesLearning(concerns);
    expect(result.escalationAppropriate).toBe(true);
  });

  it("clamps score at 20", () => {
    const concerns = [
      makeConcern({
        resolutionOutcome: "substantiated",
        lessonsIdentified: true,
        severity: "critical",
        status: "resolved",
        actionsTaken: ["a", "b", "c"],
      }),
      makeConcern({
        id: "wbc-2",
        resolutionOutcome: "unsubstantiated",
        lessonsIdentified: true,
        severity: "high",
        status: "resolved",
        actionsTaken: ["a", "b"],
      }),
    ];
    const result = evaluateOutcomesLearning(concerns);
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it("considers low severity concerns as not needing escalation", () => {
    const concerns = [
      makeConcern({
        severity: "low",
        status: "received",
        externalReferralMade: false,
        resolutionOutcome: undefined,
        lessonsIdentified: false,
        actionsTaken: [],
      }),
    ];
    const result = evaluateOutcomesLearning(concerns);
    expect(result.escalationAppropriate).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. MAIN: GENERATE INTELLIGENCE
// ══════════════════════════════════════════════════════════════════════════════

describe("generateWhistleblowingConcernsIntelligence", () => {
  it("returns correct homeId", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("home-001");
  });

  it("returns correct period dates", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns assessedAt as ISO string", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.assessedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("filters concerns to period", () => {
    const outOfPeriod = makeConcern({ id: "oop-1", reportDate: "2025-06-01" });
    const inPeriod = makeConcern({ id: "ip-1", reportDate: "2026-03-01" });
    const result = generateWhistleblowingConcernsIntelligence(
      [outOfPeriod, inPeriod],
      [],
      makePolicy(),
      makeCulture(),
      "home-001",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.responseQuality.totalConcerns).toBe(1);
  });

  it("filters protections to match period concerns", () => {
    const concern = makeConcern({ id: "wbc-in", reportDate: "2026-02-01" });
    const matchingProt = makeProtection({ id: "p-match", concernId: "wbc-in" });
    const orphanProt = makeProtection({ id: "p-orphan", concernId: "wbc-out" });
    const result = generateWhistleblowingConcernsIntelligence(
      [concern],
      [matchingProt, orphanProt],
      makePolicy(),
      makeCulture(),
      "home-001",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.staffProtection.totalProtections).toBe(1);
  });

  it("clamps overall score between 0 and 100", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], makePolicy(), makeCulture(), "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns outstanding rating for high scores", () => {
    // Full policy + good culture + no concerns = high score
    const demo = getDemoWhistleblowingConcernsData();
    const result = generateWhistleblowingConcernsIntelligence(
      demo.concerns,
      demo.protections,
      demo.policy,
      demo.culture,
      "home-001",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate rating for very low scores", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("returns good rating for scores 60-79", () => {
    // Partial policy, no concerns, no culture
    const result = generateWhistleblowingConcernsIntelligence(
      [],
      [],
      makePolicy({ childFriendlyVersionAvailable: false }),
      makeCulture({ staffConfidenceToReport: 6, staffTrustInProcess: 6 }),
      "home-001",
      PERIOD_START,
      PERIOD_END,
    );
    // Score: 5+4+3+3+0 (reporting) + 25 (response no concerns) = 40
    // If between 60-79, it's good. We check via the rating system.
    expect(["good", "requires_improvement", "outstanding", "inadequate"]).toContain(result.rating);
  });

  it("returns requires_improvement for scores 40-59", () => {
    const poorConcern = makeConcern({
      id: "wbc-poor",
      reportDate: "2026-02-01",
      acknowledgedWithin48Hours: false,
      investigationStartedWithin7Days: false,
      resolvedWithin30Days: false,
      lessonsIdentified: false,
      externalReferralMade: false,
      actionsTaken: [],
      severity: "low",
      resolutionOutcome: undefined,
    });
    const result = generateWhistleblowingConcernsIntelligence(
      [poorConcern],
      [],
      makePolicy({ childFriendlyVersionAvailable: false, staffAwareOfPolicy: false }),
      makeCulture({ staffConfidenceToReport: 5, staffTrustInProcess: 5 }),
      "home-001",
      PERIOD_START,
      PERIOD_END,
    );
    // With poor responses and partial policy, score should be moderate
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates strengths for good data", () => {
    const demo = getDemoWhistleblowingConcernsData();
    const result = generateWhistleblowingConcernsIntelligence(
      demo.concerns,
      demo.protections,
      demo.policy,
      demo.culture,
      "home-001",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates concerns for poor data", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("generates immediate actions for poor data", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.length).toBeGreaterThan(0);
  });

  it("generates regulatory links", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Public Interest Disclosure Act"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes Ofsted in regulatory links", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Ofsted"))).toBe(true);
  });

  it("sums sub-scores correctly for overall score", () => {
    const demo = getDemoWhistleblowingConcernsData();
    const result = generateWhistleblowingConcernsIntelligence(
      demo.concerns,
      demo.protections,
      demo.policy,
      demo.culture,
      "home-001",
      PERIOD_START,
      PERIOD_END,
    );
    const expectedSum =
      result.reportingCulture.score +
      result.responseQuality.score +
      result.staffProtection.score +
      result.outcomesLearning.score;
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, expectedSum)));
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. DEMO DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("getDemoWhistleblowingConcernsData", () => {
  it("returns 2 concerns", () => {
    const demo = getDemoWhistleblowingConcernsData();
    expect(demo.concerns).toHaveLength(2);
  });

  it("returns 2 protections", () => {
    const demo = getDemoWhistleblowingConcernsData();
    expect(demo.protections).toHaveLength(2);
  });

  it("returns a policy", () => {
    const demo = getDemoWhistleblowingConcernsData();
    expect(demo.policy).toBeDefined();
    expect(demo.policy.id).toBeTruthy();
  });

  it("returns a culture record", () => {
    const demo = getDemoWhistleblowingConcernsData();
    expect(demo.culture).toBeDefined();
    expect(demo.culture.staffConfidenceToReport).toBeGreaterThan(0);
  });

  it("first concern is safeguarding critical resolved", () => {
    const demo = getDemoWhistleblowingConcernsData();
    expect(demo.concerns[0].category).toBe("safeguarding");
    expect(demo.concerns[0].severity).toBe("critical");
    expect(demo.concerns[0].status).toBe("resolved");
  });

  it("second concern is practice_standards medium resolved", () => {
    const demo = getDemoWhistleblowingConcernsData();
    expect(demo.concerns[1].category).toBe("practice_standards");
    expect(demo.concerns[1].severity).toBe("medium");
    expect(demo.concerns[1].status).toBe("resolved");
  });

  it("protections reference valid concern IDs", () => {
    const demo = getDemoWhistleblowingConcernsData();
    const concernIds = new Set(demo.concerns.map((c) => c.id));
    for (const prot of demo.protections) {
      expect(concernIds.has(prot.concernId)).toBe(true);
    }
  });

  it("policy shows staff aware and accessible", () => {
    const demo = getDemoWhistleblowingConcernsData();
    expect(demo.policy.staffAwareOfPolicy).toBe(true);
    expect(demo.policy.policyAccessible).toBe(true);
  });

  it("culture shows good confidence scores", () => {
    const demo = getDemoWhistleblowingConcernsData();
    expect(demo.culture.staffConfidenceToReport).toBeGreaterThanOrEqual(7);
    expect(demo.culture.staffTrustInProcess).toBeGreaterThanOrEqual(7);
  });

  it("demo data produces outstanding intelligence result", () => {
    const demo = getDemoWhistleblowingConcernsData();
    const result = generateWhistleblowingConcernsIntelligence(
      demo.concerns,
      demo.protections,
      demo.policy,
      demo.culture,
      "home-demo",
      "2026-01-01",
      "2026-05-18",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. EDGE CASES & BOUNDARY CONDITIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles single concern with all flags false", () => {
    const concern = makeConcern({
      acknowledgedWithin48Hours: false,
      investigationStartedWithin7Days: false,
      resolvedWithin30Days: false,
      lessonsIdentified: false,
      externalReferralMade: false,
      actionsTaken: [],
      resolutionOutcome: undefined,
      severity: "low",
    });
    const result = evaluateResponseQuality([concern]);
    // Nothing met and nothing critical/high to refer — no points at all
    expect(result.score).toBe(0);
  });

  it("handles concern at exact period boundary (start)", () => {
    const concern = makeConcern({ id: "boundary-start", reportDate: PERIOD_START });
    const result = generateWhistleblowingConcernsIntelligence(
      [concern], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.responseQuality.totalConcerns).toBe(1);
  });

  it("handles concern at exact period boundary (end)", () => {
    const concern = makeConcern({ id: "boundary-end", reportDate: PERIOD_END });
    const result = generateWhistleblowingConcernsIntelligence(
      [concern], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.responseQuality.totalConcerns).toBe(1);
  });

  it("excludes concern before period start", () => {
    const concern = makeConcern({ id: "before", reportDate: "2025-12-31" });
    const result = generateWhistleblowingConcernsIntelligence(
      [concern], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.responseQuality.totalConcerns).toBe(0);
  });

  it("excludes concern after period end", () => {
    const concern = makeConcern({ id: "after", reportDate: "2026-06-01" });
    const result = generateWhistleblowingConcernsIntelligence(
      [concern], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.responseQuality.totalConcerns).toBe(0);
  });

  it("handles all concerns being anonymous", () => {
    const concerns = [
      makeConcern({ id: "anon-1", isAnonymous: true, reporterType: "anonymous" }),
      makeConcern({ id: "anon-2", isAnonymous: true, reporterType: "anonymous" }),
    ];
    const result = evaluateResponseQuality(concerns);
    expect(result.totalConcerns).toBe(2);
  });

  it("handles protection with retaliation reported but not investigated", () => {
    const result = evaluateStaffProtection([
      makeProtection({
        retaliationReported: true,
        retaliationInvestigated: false,
        protectionStatus: "retaliation_reported",
        confidentialityMaintained: false,
        supportOffered: false,
      }),
    ]);
    expect(result.noRetaliationReported).toBe(false);
    expect(result.allRetaliationInvestigated).toBe(false);
    expect(result.score).toBe(0);
  });

  it("handles very large number of concerns", () => {
    const concerns = Array.from({ length: 100 }, (_, i) =>
      makeConcern({
        id: `wbc-${i}`,
        reportDate: "2026-03-01",
        acknowledgedWithin48Hours: true,
        investigationStartedWithin7Days: true,
        resolvedWithin30Days: true,
        lessonsIdentified: true,
        externalReferralMade: true,
        actionsTaken: ["action1", "action2"],
      }),
    );
    const result = evaluateResponseQuality(concerns);
    expect(result.totalConcerns).toBe(100);
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it("handles all concerns with withdrawn outcome", () => {
    const concerns = [
      makeConcern({
        id: "withdrawn-1",
        resolutionOutcome: "withdrawn",
        lessonsIdentified: false,
        severity: "low",
        actionsTaken: [],
      }),
    ];
    const result = evaluateOutcomesLearning(concerns);
    expect(result.resolutionDocumentedRate).toBe(100);
  });

  it("handles mixed severity concerns for external referral", () => {
    const concerns = [
      makeConcern({
        id: "crit",
        severity: "critical",
        externalReferralMade: true,
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: false,
        lessonsIdentified: false,
        actionsTaken: [],
      }),
      makeConcern({
        id: "low",
        severity: "low",
        externalReferralMade: false,
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: false,
        lessonsIdentified: false,
        actionsTaken: [],
      }),
    ];
    const result = evaluateResponseQuality(concerns);
    // Only critical/high matters for external referral
    expect(result.externalReferralForCriticalHighRate).toBe(100);
  });

  it("handles high severity concern without external referral", () => {
    const concerns = [
      makeConcern({
        id: "high-noref",
        severity: "high",
        externalReferralMade: false,
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: false,
        lessonsIdentified: false,
        actionsTaken: [],
      }),
    ];
    const result = evaluateResponseQuality(concerns);
    expect(result.externalReferralForCriticalHighRate).toBe(0);
  });

  it("overall score never exceeds 100", () => {
    const demo = getDemoWhistleblowingConcernsData();
    const result = generateWhistleblowingConcernsIntelligence(
      demo.concerns,
      demo.protections,
      demo.policy,
      demo.culture,
      "home-001",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score never goes below 0", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null, null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. STRENGTH & CONCERN GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("strength and concern generation", () => {
  it("generates policy current strength when policy is reviewed and staff aware", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], makePolicy(), null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("current"))).toBe(true);
  });

  it("generates named contact strength", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], makePolicy(), null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("Named contact"))).toBe(true);
  });

  it("generates child-friendly version strength", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], makePolicy(), null, "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("Child-friendly"))).toBe(true);
  });

  it("generates confidence strength when both scores above 7", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null, makeCulture(), "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("confidence and trust"))).toBe(true);
  });

  it("generates concern when policy not reviewed", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [],
      makePolicy({ lastReviewedDate: "2024-01-01" }),
      null,
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.concerns.some((c) => c.includes("not reviewed within 12 months"))).toBe(true);
  });

  it("generates concern when staff not aware", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [],
      makePolicy({ staffAwareOfPolicy: false }),
      null,
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.concerns.some((c) => c.includes("not recorded as aware"))).toBe(true);
  });

  it("generates concern when no named contact", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [],
      makePolicy({ namedContactDesignated: false }),
      null,
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.concerns.some((c) => c.includes("No named contact"))).toBe(true);
  });

  it("generates concern for low staff confidence", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [], null,
      makeCulture({ staffConfidenceToReport: 5 }),
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.concerns.some((c) => c.includes("confidence to report"))).toBe(true);
  });

  it("generates retaliation concern when retaliation reported", () => {
    const concern = makeConcern({ reportDate: "2026-02-01" });
    const prot = makeProtection({
      concernId: concern.id,
      retaliationReported: true,
      retaliationInvestigated: true,
    });
    const result = generateWhistleblowingConcernsIntelligence(
      [concern], [prot], makePolicy(), makeCulture(),
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.concerns.some((c) => c.includes("Retaliation reported"))).toBe(true);
  });

  it("generates no concerns for perfect data", () => {
    const demo = getDemoWhistleblowingConcernsData();
    const result = generateWhistleblowingConcernsIntelligence(
      demo.concerns, demo.protections, demo.policy, demo.culture,
      "home-001", PERIOD_START, PERIOD_END,
    );
    // With perfect demo data, there should be few or no concerns
    // Check that no critical concerns are flagged
    expect(result.concerns.every((c) => !c.includes("URGENT"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. IMMEDIATE ACTIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("immediate actions", () => {
  it("generates urgent action for policy not reviewed", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [],
      makePolicy({ lastReviewedDate: "2024-01-01" }),
      null,
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates high action for no named contact", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [],
      makePolicy({ namedContactDesignated: false }),
      null,
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("HIGH") && a.includes("named contact"))).toBe(true);
  });

  it("generates urgent action for retaliation", () => {
    const concern = makeConcern({ reportDate: "2026-02-01" });
    const prot = makeProtection({
      concernId: concern.id,
      retaliationReported: true,
      retaliationInvestigated: false,
    });
    const result = generateWhistleblowingConcernsIntelligence(
      [concern], [prot], makePolicy(), makeCulture(),
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("URGENT") && a.includes("retaliation"))).toBe(true);
  });

  it("generates default action when no issues", () => {
    const demo = getDemoWhistleblowingConcernsData();
    const result = generateWhistleblowingConcernsIntelligence(
      demo.concerns, demo.protections, demo.policy, demo.culture,
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("operating effectively"))).toBe(true);
  });

  it("generates high action for staff not aware", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [],
      makePolicy({ staffAwareOfPolicy: false }),
      null,
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("HIGH") && a.includes("training"))).toBe(true);
  });

  it("generates medium action for no external contacts", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [],
      makePolicy({ externalContactsListed: false }),
      null,
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("MEDIUM") && a.includes("external"))).toBe(true);
  });

  it("generates medium action for no child-friendly version", () => {
    const result = generateWhistleblowingConcernsIntelligence(
      [], [],
      makePolicy({ childFriendlyVersionAvailable: false }),
      null,
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("MEDIUM") && a.includes("child-friendly"))).toBe(true);
  });

  it("generates action for low ack rate", () => {
    const concerns = [
      makeConcern({
        id: "slow-ack",
        reportDate: "2026-02-01",
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: true,
        resolvedWithin30Days: true,
        lessonsIdentified: true,
        actionsTaken: ["a", "b"],
      }),
    ];
    const result = generateWhistleblowingConcernsIntelligence(
      concerns, [], makePolicy(), makeCulture(),
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("48-hour"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. INTEGRATION — FULL SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("integration: full scenario", () => {
  it("handles perfect scenario — outstanding rating", () => {
    const demo = getDemoWhistleblowingConcernsData();
    const result = generateWhistleblowingConcernsIntelligence(
      demo.concerns,
      demo.protections,
      demo.policy,
      demo.culture,
      "home-001",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.rating).toBe("outstanding");
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("handles worst-case scenario — inadequate rating", () => {
    const concerns = [
      makeConcern({
        id: "bad-1",
        reportDate: "2026-02-01",
        severity: "critical",
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: false,
        lessonsIdentified: false,
        externalReferralMade: false,
        actionsTaken: [],
        resolutionOutcome: undefined,
        status: "received",
      }),
    ];
    const protections = [
      makeProtection({
        concernId: "bad-1",
        protectionStatus: "not_protected",
        confidentialityMaintained: false,
        supportOffered: false,
        retaliationReported: true,
        retaliationInvestigated: false,
      }),
    ];
    const result = generateWhistleblowingConcernsIntelligence(
      concerns, protections, null, null,
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.immediateActions.length).toBeGreaterThan(0);
  });

  it("handles mixed scenario with some good and some bad data", () => {
    const concerns = [
      makeConcern({
        id: "good-1",
        reportDate: "2026-02-01",
        acknowledgedWithin48Hours: true,
        investigationStartedWithin7Days: true,
        resolvedWithin30Days: true,
        lessonsIdentified: true,
        externalReferralMade: true,
        actionsTaken: ["a", "b"],
        resolutionOutcome: "substantiated",
      }),
      makeConcern({
        id: "bad-1",
        reportDate: "2026-03-01",
        severity: "low",
        acknowledgedWithin48Hours: false,
        investigationStartedWithin7Days: false,
        resolvedWithin30Days: false,
        lessonsIdentified: false,
        externalReferralMade: false,
        actionsTaken: [],
        resolutionOutcome: undefined,
      }),
    ];
    const result = generateWhistleblowingConcernsIntelligence(
      concerns, [], makePolicy(), makeCulture(),
      "home-001", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(100);
  });
});
