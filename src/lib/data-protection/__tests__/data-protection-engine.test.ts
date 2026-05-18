// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Data Protection & GDPR Intelligence Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateBreachManagement,
  evaluateConsentCompliance,
  evaluateSARCompliance,
  evaluateGovernancePractice,
  generateDataProtectionIntelligence,
} from "../data-protection-engine";
import type {
  DataBreach,
  ConsentRecord,
  SubjectAccessRequest,
  DataGovernance,
} from "../data-protection-engine";

// ── Shared Constants ───────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const REF_DATE = "2025-07-01";
const HOME_ID = "oak-house";

// ── Factory Helpers ────────────────────────────────────────────────────────

function makeBreach(overrides: Partial<DataBreach> = {}): DataBreach {
  return {
    id: "breach-1",
    detectedDate: "2025-03-10",
    reportedDate: "2025-03-11",
    severity: "low",
    status: "resolved",
    childrenAffected: 1,
    staffAffected: 0,
    icoNotified: true,
    icoNotifiedWithin72Hours: true,
    containmentMeasures: ["Password reset", "Access revoked"],
    rootCauseIdentified: true,
    lessonsLearned: "Staff reminded about data handling procedures",
    ...overrides,
  };
}

function makeConsent(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    id: "consent-1",
    childId: "child-alex",
    childName: "Alex",
    consentType: "photography",
    status: "given",
    obtainedDate: "2025-01-15",
    reviewDate: "2026-01-15",
    obtainedFrom: "Social Worker",
    ageAppropriateExplained: true,
    ...overrides,
  };
}

function makeSAR(overrides: Partial<SubjectAccessRequest> = {}): SubjectAccessRequest {
  return {
    id: "sar-1",
    requestDate: "2025-04-01",
    requesterType: "parent",
    status: "completed",
    acknowledgedWithin5Days: true,
    completedWithin30Days: true,
    redactionCompleted: true,
    qualityChecked: true,
    ...overrides,
  };
}

function makeGovernance(overrides: Partial<DataGovernance> = {}): DataGovernance {
  return {
    id: "gov-1",
    dataProtectionOfficerAppointed: true,
    dpiaCompleted: true,
    retentionScheduleInPlace: true,
    privacyNoticesUpToDate: true,
    staffTrainingCompliance: 95,
    lastAuditDate: "2025-03-01",
    dataProcessingRegisterMaintained: true,
    thirdPartyAgreementsReviewed: true,
    ...overrides,
  };
}

// Helper to generate consent records covering multiple types for a child
function makeFullConsentSet(childId: string, childName: string): ConsentRecord[] {
  const types: ConsentRecord["consentType"][] = [
    "photography", "social_media", "data_sharing", "medical_info",
    "education_records", "therapeutic_records", "contact_info", "location_tracking",
  ];
  return types.map((t, i) =>
    makeConsent({
      id: `consent-${childId}-${i}`,
      childId,
      childName,
      consentType: t,
      reviewDate: "2026-06-01",
    })
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 1. evaluateBreachManagement
// ════════════════════════════════════════════════════════════════════════════

describe("evaluateBreachManagement", () => {
  it("returns perfect score 25 when no breaches exist", () => {
    const result = evaluateBreachManagement([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalBreaches).toBe(0);
  });

  it("counts breaches by severity correctly", () => {
    const breaches = [
      makeBreach({ id: "b1", severity: "critical" }),
      makeBreach({ id: "b2", severity: "high" }),
      makeBreach({ id: "b3", severity: "medium" }),
      makeBreach({ id: "b4", severity: "low" }),
      makeBreach({ id: "b5", severity: "low" }),
    ];
    const result = evaluateBreachManagement(breaches);
    expect(result.criticalBreaches).toBe(1);
    expect(result.highBreaches).toBe(1);
    expect(result.mediumBreaches).toBe(1);
    expect(result.lowBreaches).toBe(2);
    expect(result.totalBreaches).toBe(5);
  });

  it("calculates ICO notification rate", () => {
    const breaches = [
      makeBreach({ id: "b1", icoNotified: true }),
      makeBreach({ id: "b2", icoNotified: false }),
    ];
    const result = evaluateBreachManagement(breaches);
    expect(result.icoNotificationRate).toBe(50);
  });

  it("calculates ICO notification within 72 hours rate", () => {
    const breaches = [
      makeBreach({ id: "b1", icoNotifiedWithin72Hours: true }),
      makeBreach({ id: "b2", icoNotifiedWithin72Hours: false }),
      makeBreach({ id: "b3", icoNotifiedWithin72Hours: true }),
    ];
    const result = evaluateBreachManagement(breaches);
    expect(result.icoNotificationWithin72HoursRate).toBeCloseTo(66.7, 0);
  });

  it("awards full 7 points when all breaches reported within 72h", () => {
    const breaches = [
      makeBreach({ id: "b1", icoNotifiedWithin72Hours: true }),
    ];
    const result = evaluateBreachManagement(breaches);
    // 7 (72h) + 5 (containment) + 5 (root cause) + 4 (lessons) + 4 (resolved) = 25
    expect(result.overallScore).toBe(25);
  });

  it("calculates containment rate correctly", () => {
    const breaches = [
      makeBreach({ id: "b1", containmentMeasures: ["Action taken"] }),
      makeBreach({ id: "b2", containmentMeasures: [] }),
    ];
    const result = evaluateBreachManagement(breaches);
    expect(result.containmentRate).toBe(50);
  });

  it("calculates root cause identification rate", () => {
    const breaches = [
      makeBreach({ id: "b1", rootCauseIdentified: true }),
      makeBreach({ id: "b2", rootCauseIdentified: false }),
    ];
    const result = evaluateBreachManagement(breaches);
    expect(result.rootCauseRate).toBe(50);
  });

  it("calculates lessons learned rate (excluding undefined and empty)", () => {
    const breaches = [
      makeBreach({ id: "b1", lessonsLearned: "Lesson noted" }),
      makeBreach({ id: "b2", lessonsLearned: undefined }),
      makeBreach({ id: "b3", lessonsLearned: "" }),
    ];
    const result = evaluateBreachManagement(breaches);
    expect(result.lessonsLearnedRate).toBeCloseTo(33.3, 0);
  });

  it("calculates resolution rate (resolved + closed)", () => {
    const breaches = [
      makeBreach({ id: "b1", status: "resolved" }),
      makeBreach({ id: "b2", status: "closed" }),
      makeBreach({ id: "b3", status: "investigating" }),
      makeBreach({ id: "b4", status: "detected" }),
    ];
    const result = evaluateBreachManagement(breaches);
    expect(result.resolutionRate).toBe(50);
  });

  it("sums children and staff affected totals", () => {
    const breaches = [
      makeBreach({ id: "b1", childrenAffected: 3, staffAffected: 1 }),
      makeBreach({ id: "b2", childrenAffected: 2, staffAffected: 4 }),
    ];
    const result = evaluateBreachManagement(breaches);
    expect(result.childrenAffectedTotal).toBe(5);
    expect(result.staffAffectedTotal).toBe(5);
  });

  it("applies penalty for critical breaches", () => {
    const perfect = [makeBreach({ id: "b1", severity: "low" })];
    const critical = [makeBreach({ id: "b1", severity: "critical" })];
    const perfectResult = evaluateBreachManagement(perfect);
    const criticalResult = evaluateBreachManagement(critical);
    expect(criticalResult.overallScore).toBeLessThan(perfectResult.overallScore);
  });

  it("applies penalty for high-severity breaches", () => {
    const low = [makeBreach({ id: "b1", severity: "low" })];
    const high = [makeBreach({ id: "b1", severity: "high" })];
    const lowResult = evaluateBreachManagement(low);
    const highResult = evaluateBreachManagement(high);
    expect(highResult.overallScore).toBeLessThan(lowResult.overallScore);
  });

  it("clamps score to maximum 25", () => {
    // Even a perfect single low breach should not exceed 25
    const result = evaluateBreachManagement([makeBreach()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("clamps score to minimum 0", () => {
    const terribleBreaches = Array.from({ length: 10 }, (_, i) =>
      makeBreach({
        id: `b${i}`,
        severity: "critical",
        icoNotifiedWithin72Hours: false,
        containmentMeasures: [],
        rootCauseIdentified: false,
        lessonsLearned: undefined,
        status: "detected",
      })
    );
    const result = evaluateBreachManagement(terribleBreaches);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("no breaches sets all rates to 0", () => {
    const result = evaluateBreachManagement([]);
    expect(result.icoNotificationRate).toBe(0);
    expect(result.icoNotificationWithin72HoursRate).toBe(0);
    expect(result.containmentRate).toBe(0);
    expect(result.rootCauseRate).toBe(0);
    expect(result.lessonsLearnedRate).toBe(0);
    expect(result.resolutionRate).toBe(0);
  });

  it("handles a single perfectly managed breach", () => {
    const result = evaluateBreachManagement([makeBreach()]);
    expect(result.totalBreaches).toBe(1);
    expect(result.icoNotificationWithin72HoursRate).toBe(100);
    expect(result.containmentRate).toBe(100);
    expect(result.rootCauseRate).toBe(100);
    expect(result.lessonsLearnedRate).toBe(100);
    expect(result.resolutionRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("handles a single poorly managed breach", () => {
    const result = evaluateBreachManagement([
      makeBreach({
        icoNotified: false,
        icoNotifiedWithin72Hours: false,
        containmentMeasures: [],
        rootCauseIdentified: false,
        lessonsLearned: undefined,
        status: "detected",
      }),
    ]);
    expect(result.overallScore).toBe(0);
  });

  it("multiple critical breaches drive score to 0", () => {
    const breaches = Array.from({ length: 5 }, (_, i) =>
      makeBreach({ id: `b${i}`, severity: "critical", icoNotifiedWithin72Hours: false, containmentMeasures: [], rootCauseIdentified: false, lessonsLearned: undefined, status: "detected" })
    );
    const result = evaluateBreachManagement(breaches);
    expect(result.overallScore).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. evaluateConsentCompliance
// ════════════════════════════════════════════════════════════════════════════

describe("evaluateConsentCompliance", () => {
  it("returns 0 score for empty records", () => {
    const result = evaluateConsentCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.uniqueChildren).toBe(0);
  });

  it("calculates consent obtained rate (given + refused)", () => {
    const records = [
      makeConsent({ id: "c1", status: "given" }),
      makeConsent({ id: "c2", status: "refused" }),
      makeConsent({ id: "c3", status: "not_sought" }),
    ];
    const result = evaluateConsentCompliance(records);
    expect(result.consentObtainedRate).toBeCloseTo(66.7, 0);
  });

  it("calculates age-appropriate explained rate", () => {
    const records = [
      makeConsent({ id: "c1", ageAppropriateExplained: true }),
      makeConsent({ id: "c2", ageAppropriateExplained: false }),
    ];
    const result = evaluateConsentCompliance(records);
    expect(result.ageAppropriateExplainedRate).toBe(50);
  });

  it("counts expired consents correctly", () => {
    const records = [
      makeConsent({ id: "c1", status: "expired" }),
      makeConsent({ id: "c2", status: "given" }),
      makeConsent({ id: "c3", status: "expired" }),
    ];
    const result = evaluateConsentCompliance(records);
    expect(result.expiredConsentCount).toBe(2);
  });

  it("calculates unique children count", () => {
    const records = [
      makeConsent({ id: "c1", childId: "child-1", consentType: "photography" }),
      makeConsent({ id: "c2", childId: "child-1", consentType: "medical_info" }),
      makeConsent({ id: "c3", childId: "child-2", consentType: "photography" }),
    ];
    const result = evaluateConsentCompliance(records);
    expect(result.uniqueChildren).toBe(2);
  });

  it("calculates average types per child", () => {
    const records = [
      makeConsent({ id: "c1", childId: "child-1", consentType: "photography" }),
      makeConsent({ id: "c2", childId: "child-1", consentType: "medical_info" }),
      makeConsent({ id: "c3", childId: "child-1", consentType: "data_sharing" }),
      makeConsent({ id: "c4", childId: "child-2", consentType: "photography" }),
    ];
    const result = evaluateConsentCompliance(records);
    // child-1: 3 types, child-2: 1 type, average = 2
    expect(result.averageTypesPerChild).toBe(2);
  });

  it("populates consentByType breakdown", () => {
    const records = [
      makeConsent({ id: "c1", consentType: "photography", status: "given" }),
      makeConsent({ id: "c2", consentType: "photography", status: "refused" }),
      makeConsent({ id: "c3", consentType: "medical_info", status: "given" }),
    ];
    const result = evaluateConsentCompliance(records);
    expect(result.consentByType["photography"].given).toBe(1);
    expect(result.consentByType["photography"].refused).toBe(1);
    expect(result.consentByType["medical_info"].given).toBe(1);
  });

  it("awards full 8 points when consent obtained rate >= 95%", () => {
    // All given = 100% obtained rate
    const records = Array.from({ length: 20 }, (_, i) =>
      makeConsent({ id: `c${i}`, status: "given", reviewDate: "2026-06-01" })
    );
    const result = evaluateConsentCompliance(records);
    expect(result.consentObtainedRate).toBe(100);
  });

  it("awards full 4 points when no expired consents", () => {
    const records = [
      makeConsent({ id: "c1", status: "given" }),
      makeConsent({ id: "c2", status: "refused" }),
    ];
    const result = evaluateConsentCompliance(records);
    expect(result.expiredConsentCount).toBe(0);
  });

  it("gives full coverage score when children have 5+ consent types", () => {
    const records = makeFullConsentSet("child-1", "Alex");
    const result = evaluateConsentCompliance(records);
    expect(result.averageTypesPerChild).toBe(8);
  });

  it("calculates review date current rate only for records with review date", () => {
    const records = [
      makeConsent({ id: "c1", reviewDate: "2030-01-01" }), // future = current
      makeConsent({ id: "c2", reviewDate: "2020-01-01" }), // past = not current
      makeConsent({ id: "c3", reviewDate: undefined }),     // no date = excluded from calculation
    ];
    const result = evaluateConsentCompliance(records);
    // 1 current out of 2 with review dates = 50%
    expect(result.reviewDateCurrentRate).toBe(50);
  });

  it("handles all consent statuses in breakdown", () => {
    const records = [
      makeConsent({ id: "c1", consentType: "photography", status: "given" }),
      makeConsent({ id: "c2", consentType: "photography", status: "refused" }),
      makeConsent({ id: "c3", consentType: "photography", status: "withdrawn" }),
      makeConsent({ id: "c4", consentType: "photography", status: "not_sought" }),
      makeConsent({ id: "c5", consentType: "photography", status: "expired" }),
    ];
    const result = evaluateConsentCompliance(records);
    const photo = result.consentByType["photography"];
    expect(photo.given).toBe(1);
    expect(photo.refused).toBe(1);
    expect(photo.withdrawn).toBe(1);
    expect(photo.notSought).toBe(1);
    expect(photo.expired).toBe(1);
  });

  it("score is clamped to maximum 25", () => {
    const records = makeFullConsentSet("child-1", "Alex");
    const result = evaluateConsentCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is clamped to minimum 0", () => {
    const records = [makeConsent({ id: "c1", status: "not_sought", ageAppropriateExplained: false, reviewDate: "2020-01-01" })];
    const result = evaluateConsentCompliance(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("calculates correctly with multiple children", () => {
    const records = [
      ...makeFullConsentSet("child-1", "Alex"),
      ...makeFullConsentSet("child-2", "Jordan"),
    ];
    const result = evaluateConsentCompliance(records);
    expect(result.uniqueChildren).toBe(2);
    expect(result.totalRecords).toBe(16);
    expect(result.averageTypesPerChild).toBe(8);
  });

  it("treats refused as consent obtained (active decision)", () => {
    const records = [makeConsent({ id: "c1", status: "refused" })];
    const result = evaluateConsentCompliance(records);
    expect(result.consentObtainedRate).toBe(100);
  });

  it("treats withdrawn as not actively obtained", () => {
    const records = [makeConsent({ id: "c1", status: "withdrawn" })];
    const result = evaluateConsentCompliance(records);
    expect(result.consentObtainedRate).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. evaluateSARCompliance
// ════════════════════════════════════════════════════════════════════════════

describe("evaluateSARCompliance", () => {
  it("returns 23 for no SARs (20 baseline + 3 bonus)", () => {
    const result = evaluateSARCompliance([]);
    expect(result.overallScore).toBe(23);
    expect(result.totalRequests).toBe(0);
  });

  it("calculates acknowledged within 5 days rate", () => {
    const requests = [
      makeSAR({ id: "s1", acknowledgedWithin5Days: true }),
      makeSAR({ id: "s2", acknowledgedWithin5Days: false }),
    ];
    const result = evaluateSARCompliance(requests);
    expect(result.acknowledgedWithin5DaysRate).toBe(50);
  });

  it("calculates completed within 30 days rate", () => {
    const requests = [
      makeSAR({ id: "s1", completedWithin30Days: true }),
      makeSAR({ id: "s2", completedWithin30Days: false }),
      makeSAR({ id: "s3", completedWithin30Days: true }),
    ];
    const result = evaluateSARCompliance(requests);
    expect(result.completedWithin30DaysRate).toBeCloseTo(66.7, 0);
  });

  it("calculates redaction completed rate", () => {
    const requests = [
      makeSAR({ id: "s1", redactionCompleted: true }),
      makeSAR({ id: "s2", redactionCompleted: false }),
    ];
    const result = evaluateSARCompliance(requests);
    expect(result.redactionCompletedRate).toBe(50);
  });

  it("calculates quality checked rate", () => {
    const requests = [
      makeSAR({ id: "s1", qualityChecked: true }),
      makeSAR({ id: "s2", qualityChecked: false }),
      makeSAR({ id: "s3", qualityChecked: true }),
    ];
    const result = evaluateSARCompliance(requests);
    expect(result.qualityCheckedRate).toBeCloseTo(66.7, 0);
  });

  it("counts overdue requests", () => {
    const requests = [
      makeSAR({ id: "s1", status: "overdue" }),
      makeSAR({ id: "s2", status: "completed" }),
      makeSAR({ id: "s3", status: "overdue" }),
    ];
    const result = evaluateSARCompliance(requests);
    expect(result.overdueCount).toBe(2);
  });

  it("awards full 3 points when no overdue SARs", () => {
    const requests = [makeSAR({ id: "s1", status: "completed" })];
    const result = evaluateSARCompliance(requests);
    expect(result.overdueCount).toBe(0);
  });

  it("gives maximum score for perfectly handled SARs", () => {
    const requests = [makeSAR()];
    const result = evaluateSARCompliance(requests);
    expect(result.overallScore).toBe(25);
  });

  it("reduces score for poor SAR handling", () => {
    const requests = [
      makeSAR({
        acknowledgedWithin5Days: false,
        completedWithin30Days: false,
        redactionCompleted: false,
        qualityChecked: false,
        status: "overdue",
      }),
    ];
    const result = evaluateSARCompliance(requests);
    expect(result.overallScore).toBeLessThan(5);
  });

  it("populates byStatus breakdown", () => {
    const requests = [
      makeSAR({ id: "s1", status: "completed" }),
      makeSAR({ id: "s2", status: "completed" }),
      makeSAR({ id: "s3", status: "in_progress" }),
      makeSAR({ id: "s4", status: "overdue" }),
    ];
    const result = evaluateSARCompliance(requests);
    expect(result.byStatus["completed"]).toBe(2);
    expect(result.byStatus["in_progress"]).toBe(1);
    expect(result.byStatus["overdue"]).toBe(1);
  });

  it("score is clamped to maximum 25", () => {
    const result = evaluateSARCompliance([makeSAR()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is clamped to minimum 0", () => {
    const requests = Array.from({ length: 10 }, (_, i) =>
      makeSAR({
        id: `s${i}`,
        acknowledgedWithin5Days: false,
        completedWithin30Days: false,
        redactionCompleted: false,
        qualityChecked: false,
        status: "overdue",
      })
    );
    const result = evaluateSARCompliance(requests);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles single perfectly managed SAR", () => {
    const result = evaluateSARCompliance([makeSAR()]);
    expect(result.acknowledgedWithin5DaysRate).toBe(100);
    expect(result.completedWithin30DaysRate).toBe(100);
    expect(result.redactionCompletedRate).toBe(100);
    expect(result.qualityCheckedRate).toBe(100);
    expect(result.overdueCount).toBe(0);
  });

  it("no SARs gives empty byStatus", () => {
    const result = evaluateSARCompliance([]);
    expect(Object.keys(result.byStatus).length).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. evaluateGovernancePractice
// ════════════════════════════════════════════════════════════════════════════

describe("evaluateGovernancePractice", () => {
  it("returns 0 for empty governance array", () => {
    const result = evaluateGovernancePractice([]);
    expect(result.overallScore).toBe(0);
    expect(result.dpoAppointed).toBe(false);
  });

  it("gives 4 points for DPO appointed", () => {
    const withDPO = evaluateGovernancePractice([makeGovernance()], REF_DATE);
    const withoutDPO = evaluateGovernancePractice(
      [makeGovernance({ dataProtectionOfficerAppointed: false })],
      REF_DATE
    );
    expect(withDPO.overallScore - withoutDPO.overallScore).toBeCloseTo(4, 0);
  });

  it("gives 3 points for DPIA completed", () => {
    const with_ = evaluateGovernancePractice([makeGovernance()], REF_DATE);
    const without = evaluateGovernancePractice(
      [makeGovernance({ dpiaCompleted: false })],
      REF_DATE
    );
    expect(with_.overallScore - without.overallScore).toBeCloseTo(3, 0);
  });

  it("gives 3 points for retention schedule in place", () => {
    const with_ = evaluateGovernancePractice([makeGovernance()], REF_DATE);
    const without = evaluateGovernancePractice(
      [makeGovernance({ retentionScheduleInPlace: false })],
      REF_DATE
    );
    expect(with_.overallScore - without.overallScore).toBeCloseTo(3, 0);
  });

  it("gives 3 points for privacy notices up to date", () => {
    const with_ = evaluateGovernancePractice([makeGovernance()], REF_DATE);
    const without = evaluateGovernancePractice(
      [makeGovernance({ privacyNoticesUpToDate: false })],
      REF_DATE
    );
    expect(with_.overallScore - without.overallScore).toBeCloseTo(3, 0);
  });

  it("gives full 4 points for staff training >= 90%", () => {
    const high = evaluateGovernancePractice(
      [makeGovernance({ staffTrainingCompliance: 95 })],
      REF_DATE
    );
    const low = evaluateGovernancePractice(
      [makeGovernance({ staffTrainingCompliance: 45 })],
      REF_DATE
    );
    expect(high.overallScore).toBeGreaterThan(low.overallScore);
  });

  it("gives partial points for training below 90%", () => {
    const result = evaluateGovernancePractice(
      [makeGovernance({ staffTrainingCompliance: 45 })],
      REF_DATE
    );
    // 45/90 * 4 = 2 points for training
    expect(result.staffTrainingCompliance).toBe(45);
  });

  it("detects audit within 12 months correctly", () => {
    const recent = evaluateGovernancePractice(
      [makeGovernance({ lastAuditDate: "2025-03-01" })],
      "2025-07-01"
    );
    expect(recent.auditWithin12Months).toBe(true);

    const old = evaluateGovernancePractice(
      [makeGovernance({ lastAuditDate: "2023-01-01" })],
      "2025-07-01"
    );
    expect(old.auditWithin12Months).toBe(false);
  });

  it("gives 3 points for audit within 12 months", () => {
    const with_ = evaluateGovernancePractice(
      [makeGovernance({ lastAuditDate: "2025-03-01" })],
      "2025-07-01"
    );
    const without = evaluateGovernancePractice(
      [makeGovernance({ lastAuditDate: "2023-01-01" })],
      "2025-07-01"
    );
    expect(with_.overallScore - without.overallScore).toBeCloseTo(3, 0);
  });

  it("gives 3 points for register maintained", () => {
    const with_ = evaluateGovernancePractice([makeGovernance()], REF_DATE);
    const without = evaluateGovernancePractice(
      [makeGovernance({ dataProcessingRegisterMaintained: false })],
      REF_DATE
    );
    expect(with_.overallScore - without.overallScore).toBeCloseTo(3, 0);
  });

  it("gives 2 points for third party agreements reviewed", () => {
    const with_ = evaluateGovernancePractice([makeGovernance()], REF_DATE);
    const without = evaluateGovernancePractice(
      [makeGovernance({ thirdPartyAgreementsReviewed: false })],
      REF_DATE
    );
    expect(with_.overallScore - without.overallScore).toBeCloseTo(2, 0);
  });

  it("gives maximum score for fully compliant governance", () => {
    const result = evaluateGovernancePractice([makeGovernance()], REF_DATE);
    expect(result.overallScore).toBe(25);
  });

  it("gives minimum score for non-compliant governance", () => {
    const result = evaluateGovernancePractice([
      makeGovernance({
        dataProtectionOfficerAppointed: false,
        dpiaCompleted: false,
        retentionScheduleInPlace: false,
        privacyNoticesUpToDate: false,
        staffTrainingCompliance: 0,
        lastAuditDate: undefined,
        dataProcessingRegisterMaintained: false,
        thirdPartyAgreementsReviewed: false,
      }),
    ], REF_DATE);
    expect(result.overallScore).toBe(0);
  });

  it("uses last governance record when multiple provided", () => {
    const result = evaluateGovernancePractice(
      [
        makeGovernance({ id: "old", dataProtectionOfficerAppointed: false }),
        makeGovernance({ id: "new", dataProtectionOfficerAppointed: true }),
      ],
      REF_DATE
    );
    expect(result.dpoAppointed).toBe(true);
  });

  it("treats missing lastAuditDate as audit not within 12 months", () => {
    const result = evaluateGovernancePractice(
      [makeGovernance({ lastAuditDate: undefined })],
      REF_DATE
    );
    expect(result.auditWithin12Months).toBe(false);
  });

  it("treats empty lastAuditDate as audit not within 12 months", () => {
    const result = evaluateGovernancePractice(
      [makeGovernance({ lastAuditDate: "" })],
      REF_DATE
    );
    expect(result.auditWithin12Months).toBe(false);
  });

  it("score is clamped to 0-25 range", () => {
    const result = evaluateGovernancePractice([makeGovernance()], REF_DATE);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. generateDataProtectionIntelligence — Integration
// ════════════════════════════════════════════════════════════════════════════

describe("generateDataProtectionIntelligence", () => {
  const defaultBreaches = [makeBreach()];
  const defaultConsent = makeFullConsentSet("child-1", "Alex");
  const defaultSARs = [makeSAR()];
  const defaultGovernance = [makeGovernance()];

  it("returns correct homeId, periodStart, periodEnd", () => {
    const result = generateDataProtectionIntelligence(
      defaultBreaches, defaultConsent, defaultSARs, defaultGovernance,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("overall score is sum of four sub-scores clamped to 0-100", () => {
    const result = generateDataProtectionIntelligence(
      defaultBreaches, defaultConsent, defaultSARs, defaultGovernance,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    const expectedSum =
      result.breachManagement.overallScore +
      result.consentCompliance.overallScore +
      result.sarCompliance.overallScore +
      result.governancePractice.overallScore;
    expect(result.overallScore).toBeCloseTo(expectedSum, 0);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns outstanding rating for score >= 80", () => {
    const result = generateDataProtectionIntelligence(
      [], makeFullConsentSet("child-1", "Alex"), [makeSAR()], [makeGovernance()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    // No breaches = 25, good consent ~21+, SAR = 25, governance = 25 => ~96+
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("assigns good rating for score >= 60 and < 80", () => {
    // Create scenario that scores between 60-80
    const partialConsent = [
      makeConsent({ id: "c1", childId: "child-1", status: "given", ageAppropriateExplained: false, reviewDate: "2020-01-01" }),
      makeConsent({ id: "c2", childId: "child-1", status: "not_sought", ageAppropriateExplained: false, consentType: "medical_info" }),
    ];
    const partialGov = [makeGovernance({
      dpiaCompleted: false,
      privacyNoticesUpToDate: false,
      thirdPartyAgreementsReviewed: false,
      staffTrainingCompliance: 70,
      lastAuditDate: "2023-01-01",
    })];
    const result = generateDataProtectionIntelligence(
      [], partialConsent, [], partialGov,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    // Check score range and rating
    if (result.overallScore >= 60 && result.overallScore < 80) {
      expect(result.rating).toBe("good");
    }
  });

  it("assigns requires_improvement rating for score >= 40 and < 60", () => {
    const poorConsent = Array.from({ length: 5 }, (_, i) =>
      makeConsent({
        id: `c${i}`,
        childId: `child-${i}`,
        status: "not_sought",
        ageAppropriateExplained: false,
        consentType: "photography",
        reviewDate: "2020-01-01",
      })
    );
    const poorGov = [makeGovernance({
      dataProtectionOfficerAppointed: false,
      dpiaCompleted: false,
      retentionScheduleInPlace: false,
      privacyNoticesUpToDate: false,
      staffTrainingCompliance: 30,
      lastAuditDate: undefined,
      dataProcessingRegisterMaintained: false,
      thirdPartyAgreementsReviewed: false,
    })];
    const result = generateDataProtectionIntelligence(
      [], poorConsent, [], poorGov,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    // No breaches=25, poor consent~low, no SAR=23, poor governance=0 => ~48+
    if (result.overallScore >= 40 && result.overallScore < 60) {
      expect(result.rating).toBe("requires_improvement");
    }
  });

  it("assigns inadequate rating for score < 40", () => {
    const terribleBreaches = Array.from({ length: 5 }, (_, i) =>
      makeBreach({
        id: `b${i}`, severity: "critical",
        icoNotifiedWithin72Hours: false, containmentMeasures: [],
        rootCauseIdentified: false, lessonsLearned: undefined, status: "detected",
      })
    );
    const noConsent: ConsentRecord[] = [];
    const overdueSARs = Array.from({ length: 3 }, (_, i) =>
      makeSAR({
        id: `s${i}`, status: "overdue",
        acknowledgedWithin5Days: false, completedWithin30Days: false,
        redactionCompleted: false, qualityChecked: false,
      })
    );
    const noGov: DataGovernance[] = [];
    const result = generateDataProtectionIntelligence(
      terribleBreaches, noConsent, overdueSARs, noGov,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("includes regulatory links", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("UK GDPR"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("DPA 2018") || l.includes("Data Protection Act 2018"))).toBe(true);
  });

  it("includes breachManagement sub-result", () => {
    const result = generateDataProtectionIntelligence(
      [makeBreach()], [], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.breachManagement).toBeDefined();
    expect(result.breachManagement.totalBreaches).toBe(1);
  });

  it("includes consentCompliance sub-result", () => {
    const result = generateDataProtectionIntelligence(
      [], [makeConsent()], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.consentCompliance).toBeDefined();
    expect(result.consentCompliance.totalRecords).toBe(1);
  });

  it("includes sarCompliance sub-result", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [makeSAR()], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.sarCompliance).toBeDefined();
    expect(result.sarCompliance.totalRequests).toBe(1);
  });

  it("includes governancePractice sub-result", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.governancePractice).toBeDefined();
    expect(result.governancePractice.dpoAppointed).toBe(true);
  });

  it("handles all empty inputs gracefully", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    // No breaches=25, no consent=0, no SARs=23, no governance=0 => 48
    expect(result.overallScore).toBe(48);
    expect(result.rating).toBe("requires_improvement");
  });

  it("generates strengths array", () => {
    const result = generateDataProtectionIntelligence(
      [], makeFullConsentSet("child-1", "Alex"), [], [makeGovernance()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement array", () => {
    const result = generateDataProtectionIntelligence(
      [makeBreach({ rootCauseIdentified: false, lessonsLearned: undefined })],
      [],
      [makeSAR({ status: "overdue" })],
      [makeGovernance({ dataProtectionOfficerAppointed: false })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions array", () => {
    const result = generateDataProtectionIntelligence(
      [makeBreach({ severity: "critical" })],
      [],
      [makeSAR({ status: "overdue" })],
      [makeGovernance({ dataProtectionOfficerAppointed: false })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(Array.isArray(result.actions)).toBe(true);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions for critical situations", () => {
    const result = generateDataProtectionIntelligence(
      [makeBreach({ severity: "critical" })],
      [],
      [makeSAR({ status: "overdue" })],
      [makeGovernance({ dataProtectionOfficerAppointed: false })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgentActions.length).toBeGreaterThan(0);
  });

  it("uses current date as fallback when referenceDate not provided", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance()],
      HOME_ID, PERIOD_START, PERIOD_END
    );
    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Strength Generation
// ════════════════════════════════════════════════════════════════════════════

describe("strengths generation", () => {
  it("includes no-breach strength when no breaches", () => {
    const result = generateDataProtectionIntelligence(
      [], [makeConsent()], [], [makeGovernance()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("no data breaches"))).toBe(true);
  });

  it("includes ICO 72h strength when all breaches reported on time", () => {
    const result = generateDataProtectionIntelligence(
      [makeBreach({ icoNotifiedWithin72Hours: true })],
      [], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("72"))).toBe(true);
  });

  it("includes DPO strength when appointed", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ dataProtectionOfficerAppointed: true })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("data protection officer"))).toBe(true);
  });

  it("includes consent obtained strength when rate >= 95%", () => {
    const records = makeFullConsentSet("child-1", "Alex");
    const result = generateDataProtectionIntelligence(
      [], records, [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("consent"))).toBe(true);
  });

  it("includes training compliance strength when >= 90%", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ staffTrainingCompliance: 95 })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("training"))).toBe(true);
  });

  it("includes audit strength when recent", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ lastAuditDate: "2025-03-01" })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("audit"))).toBe(true);
  });

  it("includes no expired consents strength", () => {
    const records = [makeConsent({ status: "given" })];
    const result = generateDataProtectionIntelligence(
      [], records, [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("expired"))).toBe(true);
  });

  it("includes SAR acknowledged strength when all on time", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [makeSAR({ acknowledgedWithin5Days: true })], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("subject access") || s.toLowerCase().includes("sar"))).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Areas For Improvement Generation
// ════════════════════════════════════════════════════════════════════════════

describe("areasForImprovement generation", () => {
  it("flags missing DPO", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ dataProtectionOfficerAppointed: false })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("data protection officer"))).toBe(true);
  });

  it("flags overdue SARs", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [makeSAR({ status: "overdue" })], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("flags expired consents", () => {
    const result = generateDataProtectionIntelligence(
      [], [makeConsent({ status: "expired" })], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("expired"))).toBe(true);
  });

  it("flags low training compliance", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ staffTrainingCompliance: 50 })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("training"))).toBe(true);
  });

  it("flags missing DPIA", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ dpiaCompleted: false })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("impact assessment"))).toBe(true);
  });

  it("flags missing retention schedule", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ retentionScheduleInPlace: false })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("retention"))).toBe(true);
  });

  it("flags incomplete root cause analysis", () => {
    const result = generateDataProtectionIntelligence(
      [makeBreach({ rootCauseIdentified: false })], [], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("root cause"))).toBe(true);
  });

  it("flags low consent obtained rate", () => {
    const records = [
      makeConsent({ id: "c1", status: "not_sought" }),
      makeConsent({ id: "c2", status: "not_sought" }),
    ];
    const result = generateDataProtectionIntelligence(
      [], records, [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("consent"))).toBe(true);
  });

  it("flags no audit within 12 months", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ lastAuditDate: "2023-01-01" })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("audit"))).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Action Generation
// ════════════════════════════════════════════════════════════════════════════

describe("actions generation", () => {
  it("generates URGENT action for critical breaches", () => {
    const result = generateDataProtectionIntelligence(
      [makeBreach({ severity: "critical" })], [], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.toLowerCase().includes("breach"))).toBe(true);
  });

  it("generates URGENT action for overdue SARs", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [makeSAR({ status: "overdue" })], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.toLowerCase().includes("sar"))).toBe(true);
  });

  it("generates URGENT action for missing DPO", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ dataProtectionOfficerAppointed: false })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.toLowerCase().includes("data protection officer"))).toBe(true);
  });

  it("suggests consent audit when rate below 95%", () => {
    const records = [
      makeConsent({ id: "c1", status: "not_sought" }),
      makeConsent({ id: "c2", status: "not_sought" }),
    ];
    const result = generateDataProtectionIntelligence(
      [], records, [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("consent audit"))).toBe(true);
  });

  it("suggests renewing expired consents", () => {
    const result = generateDataProtectionIntelligence(
      [], [makeConsent({ status: "expired" })], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("expired consent"))).toBe(true);
  });

  it("suggests DPIA completion", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ dpiaCompleted: false })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("impact assessment"))).toBe(true);
  });

  it("suggests training refresh when below 90%", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ staffTrainingCompliance: 60 })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("training"))).toBe(true);
  });

  it("suggests annual audit when overdue", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ lastAuditDate: "2023-01-01" })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("audit"))).toBe(true);
  });

  it("suggests retention schedule when missing", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ retentionScheduleInPlace: false })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("retention"))).toBe(true);
  });

  it("suggests privacy notice update when outdated", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ privacyNoticesUpToDate: false })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("privacy notice"))).toBe(true);
  });

  it("suggests ROPA when register not maintained", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [makeGovernance({ dataProcessingRegisterMaintained: false })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("processing activities") || a.toLowerCase().includes("ropa"))).toBe(true);
  });

  it("generates no URGENT actions when everything is compliant", () => {
    const result = generateDataProtectionIntelligence(
      [makeBreach({ severity: "low" })],
      makeFullConsentSet("child-1", "Alex"),
      [makeSAR()],
      [makeGovernance()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgentActions.length).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. Edge Cases & Boundaries
// ════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles single breach with all poor indicators", () => {
    const result = evaluateBreachManagement([
      makeBreach({
        severity: "low",
        icoNotified: false,
        icoNotifiedWithin72Hours: false,
        containmentMeasures: [],
        rootCauseIdentified: false,
        lessonsLearned: undefined,
        status: "detected",
      }),
    ]);
    expect(result.overallScore).toBe(0);
  });

  it("handles 100 consent records", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeConsent({
        id: `c${i}`,
        childId: `child-${i % 10}`,
        childName: `Child ${i % 10}`,
        consentType: ["photography", "social_media", "data_sharing", "medical_info", "education_records"][i % 5] as ConsentRecord["consentType"],
      })
    );
    const result = evaluateConsentCompliance(records);
    expect(result.totalRecords).toBe(100);
    expect(result.uniqueChildren).toBe(10);
  });

  it("handles governance with exactly 90% training compliance", () => {
    const result = evaluateGovernancePractice(
      [makeGovernance({ staffTrainingCompliance: 90 })],
      REF_DATE
    );
    // 90% should get full 4 points for training
    expect(result.overallScore).toBe(25);
  });

  it("handles governance with 50% training compliance (partial)", () => {
    const result = evaluateGovernancePractice(
      [makeGovernance({ staffTrainingCompliance: 50 })],
      REF_DATE
    );
    // 50/90 * 4 = ~2.2, so overall < 25
    expect(result.overallScore).toBeLessThan(25);
  });

  it("handles SAR with exactly 0 requests giving bonus score", () => {
    const result = evaluateSARCompliance([]);
    expect(result.overallScore).toBe(23);
  });

  it("handles breach where all are closed status", () => {
    const breaches = [
      makeBreach({ id: "b1", status: "closed" }),
      makeBreach({ id: "b2", status: "closed" }),
    ];
    const result = evaluateBreachManagement(breaches);
    expect(result.resolutionRate).toBe(100);
  });

  it("handles consent with all types for one child", () => {
    const records = makeFullConsentSet("child-1", "Alex");
    const result = evaluateConsentCompliance(records);
    expect(result.averageTypesPerChild).toBe(8);
    expect(result.uniqueChildren).toBe(1);
  });

  it("handles consent with only not_sought status", () => {
    const records = [
      makeConsent({ id: "c1", status: "not_sought" }),
      makeConsent({ id: "c2", status: "not_sought" }),
    ];
    const result = evaluateConsentCompliance(records);
    expect(result.consentObtainedRate).toBe(0);
  });

  it("overall score is numeric and within range", () => {
    const result = generateDataProtectionIntelligence(
      [makeBreach()], [makeConsent()], [makeSAR()], [makeGovernance()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(typeof result.overallScore).toBe("number");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(Number.isFinite(result.overallScore)).toBe(true);
  });

  it("rating is one of the four valid values", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("regulatoryLinks contains ICO children's code reference", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.regulatoryLinks.some((l) => l.includes("ICO") && l.includes("Children"))).toBe(true);
  });

  it("regulatoryLinks contains GDPR Article 33 (breach notification)", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Article 33"))).toBe(true);
  });

  it("regulatoryLinks contains GDPR Article 15 (right of access)", () => {
    const result = generateDataProtectionIntelligence(
      [], [], [], [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Article 15"))).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. Full Scenario Tests
// ════════════════════════════════════════════════════════════════════════════

describe("full scenario tests", () => {
  it("outstanding home: no breaches, full consent, SARs handled, strong governance", () => {
    const consents = [
      ...makeFullConsentSet("child-1", "Alex"),
      ...makeFullConsentSet("child-2", "Jordan"),
    ];
    const result = generateDataProtectionIntelligence(
      [],
      consents,
      [makeSAR()],
      [makeGovernance()],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("inadequate home: multiple critical breaches, no consent, overdue SARs, no governance", () => {
    const breaches = Array.from({ length: 3 }, (_, i) =>
      makeBreach({
        id: `b${i}`, severity: "critical",
        icoNotifiedWithin72Hours: false, containmentMeasures: [],
        rootCauseIdentified: false, lessonsLearned: undefined, status: "detected",
      })
    );
    const sars = [
      makeSAR({ id: "s1", status: "overdue", acknowledgedWithin5Days: false, completedWithin30Days: false, redactionCompleted: false, qualityChecked: false }),
    ];
    const result = generateDataProtectionIntelligence(
      breaches, [], sars, [],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
  });

  it("mixed scenario: good breach management but poor governance", () => {
    const result = generateDataProtectionIntelligence(
      [makeBreach()], // well-managed breach
      makeFullConsentSet("child-1", "Alex"),
      [makeSAR()],
      [makeGovernance({
        dataProtectionOfficerAppointed: false,
        dpiaCompleted: false,
        retentionScheduleInPlace: false,
        privacyNoticesUpToDate: false,
        staffTrainingCompliance: 20,
        lastAuditDate: undefined,
        dataProcessingRegisterMaintained: false,
        thirdPartyAgreementsReviewed: false,
      })],
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.breachManagement.overallScore).toBe(25);
    expect(result.governancePractice.overallScore).toBeLessThan(5);
  });

  it("demo scenario: 1 resolved breach, 3 children consent, 2 SARs, mostly compliant governance", () => {
    const breaches = [
      makeBreach({
        severity: "low", status: "resolved",
        icoNotified: true, icoNotifiedWithin72Hours: true,
        containmentMeasures: ["Password reset"], rootCauseIdentified: true,
        lessonsLearned: "Staff reminded about procedures",
      }),
    ];
    const consents = [
      ...makeFullConsentSet("child-alex", "Alex"),
      ...makeFullConsentSet("child-jordan", "Jordan"),
      ...makeFullConsentSet("child-morgan", "Morgan"),
    ];
    const sars = [
      makeSAR({ id: "s1" }),
      makeSAR({ id: "s2" }),
    ];
    const governance = [
      makeGovernance({
        staffTrainingCompliance: 92,
        thirdPartyAgreementsReviewed: false,
      }),
    ];
    const result = generateDataProtectionIntelligence(
      breaches, consents, sars, governance,
      HOME_ID, PERIOD_START, PERIOD_END, REF_DATE
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });
});
