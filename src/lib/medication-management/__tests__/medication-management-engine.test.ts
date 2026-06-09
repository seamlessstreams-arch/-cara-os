// ══════════════════════════════════════════════════════════════════════════════
// MEDICATION MANAGEMENT INTELLIGENCE — TEST SUITE
//
// Tests all 6 core functions, scoring, rating, edge cases, and demo data.
// Demo context: Chamberlain House children's home with Alex (14), Jordan (13),
// Morgan (15) and staff Sarah Johnson (RM), Tom Richards (RSW),
// Lisa Williams (Senior RSW), Darren Laville (RM).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAdministrationAccuracy,
  evaluateMedicationErrors,
  evaluateStockManagement,
  evaluateSelfAdministration,
  evaluateControlledDrugs,
  generateMedicationManagementIntelligence,
} from "../medication-management-engine";
import type {
  MedicationRecord,
  MedicationError,
  StockCheck,
  SelfAdminAssessment,
  ControlledDrugRecord,
  AdministrationStatus,
} from "../medication-management-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const PERIOD_START = "2026-05-01";
const PERIOD_END = "2026-05-18";
const REFERENCE_DATE = "2026-05-18";

// Alex: regular ADHD medication (Methylphenidate) + PRN anxiety (Lorazepam)
// Jordan: regular antidepressant (Sertraline)
// Morgan: controlled drug (Melatonin controlled context) + self-admin programme

function makeAdministrationRecords(): MedicationRecord[] {
  return [
    // Alex — Methylphenidate (regular ADHD) morning doses
    { id: "rec-001", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-01", administeredTime: "08:00", administeredBy: "Sarah Johnson", status: "given" },
    { id: "rec-002", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-02", administeredTime: "08:15", administeredBy: "Tom Richards", status: "given" },
    { id: "rec-003", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-03", administeredTime: "08:00", administeredBy: "Lisa Williams", status: "given" },
    { id: "rec-004", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-04", administeredTime: "09:30", administeredBy: "Tom Richards", status: "late", notes: "Slept in — given 90 mins late" },
    { id: "rec-005", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-05", administeredTime: "08:00", administeredBy: "Sarah Johnson", status: "refused", notes: "Alex refused — upset after phone call" },
    { id: "rec-006", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-06", administeredTime: "08:00", administeredBy: "Lisa Williams", status: "given" },
    { id: "rec-007", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-07", administeredTime: "08:10", administeredBy: "Tom Richards", status: "given" },
    { id: "rec-008", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-08", administeredTime: "08:00", administeredBy: "Sarah Johnson", status: "given" },

    // Alex — Lorazepam (PRN anxiety)
    { id: "rec-009", childId: "child-alex", childName: "Alex", medicationName: "Lorazepam 0.5mg", medicationType: "prn", prescribedDose: "0.5mg", administeredDate: "2026-05-05", administeredTime: "14:30", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards", status: "given", notes: "Acute anxiety episode after phone call from mum" },
    { id: "rec-010", childId: "child-alex", childName: "Alex", medicationName: "Lorazepam 0.5mg", medicationType: "prn", prescribedDose: "0.5mg", administeredDate: "2026-05-12", administeredTime: "20:00", administeredBy: "Lisa Williams", witnessedBy: "Tom Richards", status: "given", notes: "Anxiety before bedtime" },

    // Jordan — Sertraline (regular antidepressant)
    { id: "rec-011", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-01", administeredTime: "08:30", administeredBy: "Sarah Johnson", status: "given" },
    { id: "rec-012", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-02", administeredTime: "08:30", administeredBy: "Tom Richards", status: "given" },
    { id: "rec-013", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-03", administeredTime: "08:45", administeredBy: "Lisa Williams", status: "given" },
    { id: "rec-014", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-04", administeredTime: "08:30", administeredBy: "Tom Richards", status: "given" },
    { id: "rec-015", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-05", administeredTime: "08:30", administeredBy: "Sarah Johnson", status: "given" },
    { id: "rec-016", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-06", administeredTime: "08:30", administeredBy: "Lisa Williams", status: "omitted", notes: "Run out of stock — pharmacy delayed" },
    { id: "rec-017", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-07", administeredTime: "08:30", administeredBy: "Tom Richards", status: "given" },
    { id: "rec-018", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-08", administeredTime: "08:30", administeredBy: "Sarah Johnson", status: "given" },

    // Morgan — Melatonin (controlled) evening doses
    { id: "rec-019", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-01", administeredTime: "21:00", administeredBy: "Tom Richards", witnessedBy: "Lisa Williams", status: "given" },
    { id: "rec-020", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-02", administeredTime: "21:00", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards", status: "given" },
    { id: "rec-021", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-03", administeredTime: "21:15", administeredBy: "Lisa Williams", witnessedBy: "Tom Richards", status: "given" },
    { id: "rec-022", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-04", administeredTime: "21:00", administeredBy: "Tom Richards", witnessedBy: "Sarah Johnson", status: "self_administered" },
    { id: "rec-023", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-05", administeredTime: "21:00", administeredBy: "Sarah Johnson", witnessedBy: "Lisa Williams", status: "given" },
    { id: "rec-024", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-06", administeredTime: "21:00", administeredBy: "Lisa Williams", witnessedBy: "Tom Richards", status: "self_administered" },
    { id: "rec-025", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-07", administeredTime: "21:00", administeredBy: "Tom Richards", witnessedBy: "Sarah Johnson", status: "given" },
    { id: "rec-026", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-08", administeredTime: "21:00", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards", status: "given" },

    // Error record — wrong time for Jordan
    { id: "rec-027", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-10", administeredTime: "14:00", administeredBy: "Tom Richards", status: "error", notes: "Given at wrong time — should have been morning" },
  ];
}

function makeMedicationErrors(): MedicationError[] {
  return [
    // Error 1: Wrong time (minor)
    {
      id: "err-001", childId: "child-jordan", childName: "Jordan",
      errorDate: "2026-05-10", errorType: "wrong_time", severity: "minor",
      description: "Sertraline given at 14:00 instead of 08:30 — staff forgot during busy morning",
      reportedBy: "Tom Richards", actionTaken: "Incident form completed, GP notified, staff reminded",
      notifiedParties: ["GP", "Darren Laville"], rootCauseIdentified: "Staff distracted by incident with another child",
    },
    // Error 2: Documentation error (moderate)
    {
      id: "err-002", childId: "child-alex", childName: "Alex",
      errorDate: "2026-05-07", errorType: "documentation_error", severity: "moderate",
      description: "MAR chart not signed for Methylphenidate administration — dose was given but not recorded until end of shift",
      reportedBy: "Lisa Williams", actionTaken: "MAR chart retrospectively completed, staff supervision arranged",
      notifiedParties: ["Darren Laville"], rootCauseIdentified: "Staff new to home, unfamiliar with MAR chart process",
    },
    // Error 3: Missed dose (significant)
    {
      id: "err-003", childId: "child-jordan", childName: "Jordan",
      errorDate: "2026-05-06", errorType: "missed", severity: "significant",
      description: "Sertraline omitted due to stock running out — pharmacy delivery was not chased",
      reportedBy: "Sarah Johnson", actionTaken: "Emergency supply obtained from pharmacy, stock management reviewed",
      notifiedParties: ["GP", "Social Worker", "Darren Laville"],
    },
  ];
}

function makeStockChecks(): StockCheck[] {
  return [
    // Weekly stock checks — no discrepancy
    { id: "sc-001", medicationName: "Methylphenidate 10mg", childId: "child-alex", childName: "Alex", checkDate: "2026-05-01", checkedBy: "Sarah Johnson", expectedCount: 30, actualCount: 30, discrepancy: false },
    { id: "sc-002", medicationName: "Sertraline 50mg", childId: "child-jordan", childName: "Jordan", checkDate: "2026-05-01", checkedBy: "Sarah Johnson", expectedCount: 28, actualCount: 28, discrepancy: false },
    { id: "sc-003", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", checkDate: "2026-05-01", checkedBy: "Lisa Williams", expectedCount: 30, actualCount: 30, discrepancy: false },
    // Second week — one discrepancy
    { id: "sc-004", medicationName: "Methylphenidate 10mg", childId: "child-alex", childName: "Alex", checkDate: "2026-05-08", checkedBy: "Tom Richards", expectedCount: 23, actualCount: 23, discrepancy: false },
    { id: "sc-005", medicationName: "Sertraline 50mg", childId: "child-jordan", childName: "Jordan", checkDate: "2026-05-08", checkedBy: "Tom Richards", expectedCount: 21, actualCount: 20, discrepancy: true, actionTaken: "Recounted and confirmed one tablet unaccounted for — incident form completed" },
    { id: "sc-006", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", checkDate: "2026-05-08", checkedBy: "Lisa Williams", expectedCount: 23, actualCount: 23, discrepancy: false },
    // Third check
    { id: "sc-007", medicationName: "Methylphenidate 10mg", childId: "child-alex", childName: "Alex", checkDate: "2026-05-15", checkedBy: "Sarah Johnson", expectedCount: 16, actualCount: 16, discrepancy: false },
    { id: "sc-008", medicationName: "Sertraline 50mg", childId: "child-jordan", childName: "Jordan", checkDate: "2026-05-15", checkedBy: "Sarah Johnson", expectedCount: 13, actualCount: 13, discrepancy: false },
    { id: "sc-009", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", checkDate: "2026-05-15", checkedBy: "Lisa Williams", expectedCount: 16, actualCount: 16, discrepancy: false },
    // Lorazepam PRN stock check
    { id: "sc-010", medicationName: "Lorazepam 0.5mg", childId: "child-alex", childName: "Alex", checkDate: "2026-05-08", checkedBy: "Sarah Johnson", expectedCount: 8, actualCount: 8, discrepancy: false },
  ];
}

function makeSelfAdminAssessments(): SelfAdminAssessment[] {
  return [
    // Morgan — first assessment: level 1 to target level 3
    {
      id: "sa-001", childId: "child-morgan", childName: "Morgan",
      assessmentDate: "2026-04-01",
      currentLevel: "level_1_full_staff", targetLevel: "level_3_independent_checked",
      assessedBy: "Darren Laville",
      competencies: ["Understands medication purpose", "Can identify own medication"],
      areasForDevelopment: ["Remembering timing without prompts", "Recognising side effects"],
      reviewDate: "2026-05-01",
    },
    // Morgan — second assessment: progressed to level 2
    {
      id: "sa-002", childId: "child-morgan", childName: "Morgan",
      assessmentDate: "2026-05-01",
      currentLevel: "level_2_supervised", targetLevel: "level_3_independent_checked",
      assessedBy: "Darren Laville",
      competencies: ["Understands medication purpose", "Can identify own medication", "Knows correct dose", "Can open packaging safely"],
      areasForDevelopment: ["Remembering timing without prompts"],
      reviewDate: "2026-06-01",
    },
    // Morgan — third assessment: progressed to level 3 (target met!)
    {
      id: "sa-003", childId: "child-morgan", childName: "Morgan",
      assessmentDate: "2026-05-15",
      currentLevel: "level_3_independent_checked", targetLevel: "level_3_independent_checked",
      assessedBy: "Darren Laville",
      competencies: ["Understands medication purpose", "Can identify own medication", "Knows correct dose", "Can open packaging safely", "Remembers timing independently"],
      areasForDevelopment: [],
      reviewDate: "2026-06-15",
    },
  ];
}

function makeControlledDrugRecords(): ControlledDrugRecord[] {
  return [
    { id: "cd-001", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-01", administeredBy: "Tom Richards", witnessedBy: "Lisa Williams", balanceBefore: 30, balanceAfter: 29, balanceCorrect: true },
    { id: "cd-002", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-02", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards", balanceBefore: 29, balanceAfter: 28, balanceCorrect: true },
    { id: "cd-003", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-03", administeredBy: "Lisa Williams", witnessedBy: "Tom Richards", balanceBefore: 28, balanceAfter: 27, balanceCorrect: true },
    { id: "cd-004", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-04", administeredBy: "Tom Richards", witnessedBy: "Sarah Johnson", balanceBefore: 27, balanceAfter: 26, balanceCorrect: true },
    { id: "cd-005", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-05", administeredBy: "Sarah Johnson", witnessedBy: "Lisa Williams", balanceBefore: 26, balanceAfter: 25, balanceCorrect: true },
    { id: "cd-006", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-06", administeredBy: "Lisa Williams", witnessedBy: "Tom Richards", balanceBefore: 25, balanceAfter: 24, balanceCorrect: true },
    { id: "cd-007", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-07", administeredBy: "Tom Richards", witnessedBy: "Sarah Johnson", balanceBefore: 24, balanceAfter: 23, balanceCorrect: true },
    { id: "cd-008", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-08", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards", balanceBefore: 23, balanceAfter: 22, balanceCorrect: true },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateAdministrationAccuracy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAdministrationAccuracy", () => {
  it("returns correct totals for demo data", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    expect(result.totalRecords).toBe(27);
  });

  it("calculates accuracy rate as (given + self_administered) / total", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    // given: 21, self_admin: 2, total: 27 => (23/27)*100 = 85.2%
    expect(result.accuracyRate).toBeCloseTo(85.2, 0);
  });

  it("calculates refusal rate correctly", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    // 1 refused out of 27
    expect(result.refusalRate).toBeCloseTo(3.7, 0);
  });

  it("calculates late rate correctly", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    // 1 late out of 27
    expect(result.lateRate).toBeCloseTo(3.7, 0);
  });

  it("calculates omission rate correctly", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    // 1 omitted out of 27
    expect(result.omissionRate).toBeCloseTo(3.7, 0);
  });

  it("calculates error rate correctly", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    // 1 error out of 27
    expect(result.errorRate).toBeCloseTo(3.7, 0);
  });

  it("calculates self-administration rate correctly", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    // 2 self-admin out of 27
    expect(result.selfAdminRate).toBeCloseTo(7.4, 0);
  });

  it("produces per-child breakdown for all children", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    expect(result.perChildBreakdown).toHaveLength(3);
    const childIds = result.perChildBreakdown.map(b => b.childId);
    expect(childIds).toContain("child-alex");
    expect(childIds).toContain("child-jordan");
    expect(childIds).toContain("child-morgan");
  });

  it("per-child breakdown has correct data for Alex", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    const alex = result.perChildBreakdown.find(b => b.childId === "child-alex")!;
    expect(alex.childName).toBe("Alex");
    expect(alex.total).toBe(10);
    expect(alex.given).toBe(8);
    expect(alex.refused).toBe(1);
    expect(alex.late).toBe(1);
    expect(alex.selfAdministered).toBe(0);
  });

  it("per-child breakdown has correct data for Jordan", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    const jordan = result.perChildBreakdown.find(b => b.childId === "child-jordan")!;
    expect(jordan.childName).toBe("Jordan");
    expect(jordan.total).toBe(9);
    expect(jordan.given).toBe(7);
    expect(jordan.omitted).toBe(1);
    expect(jordan.errors).toBe(1);
  });

  it("per-child breakdown has correct data for Morgan", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    const morgan = result.perChildBreakdown.find(b => b.childId === "child-morgan")!;
    expect(morgan.childName).toBe("Morgan");
    expect(morgan.total).toBe(8);
    expect(morgan.given).toBe(6);
    expect(morgan.selfAdministered).toBe(2);
    expect(morgan.accuracyRate).toBe(100);
  });

  it("generates time pattern analysis", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    expect(result.timePatterns.length).toBeGreaterThan(0);
    // Should have entries for 08:00, 09:00, 14:00, 20:00, 21:00 hour buckets
    const hours = result.timePatterns.map(t => t.hour);
    expect(hours).toContain("08:00");
    expect(hours).toContain("21:00");
  });

  it("time pattern captures late counts", () => {
    const result = evaluateAdministrationAccuracy(makeAdministrationRecords());
    const nineAm = result.timePatterns.find(t => t.hour === "09:00");
    expect(nineAm).toBeDefined();
    expect(nineAm!.lateCount).toBe(1);
  });

  it("handles empty records", () => {
    const result = evaluateAdministrationAccuracy([]);
    expect(result.totalRecords).toBe(0);
    expect(result.accuracyRate).toBe(100);
    expect(result.refusalRate).toBe(0);
    expect(result.perChildBreakdown).toHaveLength(0);
    expect(result.timePatterns).toHaveLength(0);
  });

  it("handles all-given records", () => {
    const records: MedicationRecord[] = [
      { id: "r1", childId: "c1", childName: "Test", medicationName: "Med A", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-01", administeredTime: "08:00", administeredBy: "Staff", status: "given" },
      { id: "r2", childId: "c1", childName: "Test", medicationName: "Med A", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-02", administeredTime: "08:00", administeredBy: "Staff", status: "given" },
    ];
    const result = evaluateAdministrationAccuracy(records);
    expect(result.accuracyRate).toBe(100);
    expect(result.lateRate).toBe(0);
  });

  it("handles all-refused records", () => {
    const records: MedicationRecord[] = [
      { id: "r1", childId: "c1", childName: "Test", medicationName: "Med A", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-01", administeredTime: "08:00", administeredBy: "Staff", status: "refused" },
      { id: "r2", childId: "c1", childName: "Test", medicationName: "Med A", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-02", administeredTime: "08:00", administeredBy: "Staff", status: "refused" },
    ];
    const result = evaluateAdministrationAccuracy(records);
    expect(result.accuracyRate).toBe(0);
    expect(result.refusalRate).toBe(100);
  });

  it("handles single record", () => {
    const records: MedicationRecord[] = [
      { id: "r1", childId: "c1", childName: "Test", medicationName: "Med A", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-01", administeredTime: "08:00", administeredBy: "Staff", status: "given" },
    ];
    const result = evaluateAdministrationAccuracy(records);
    expect(result.totalRecords).toBe(1);
    expect(result.accuracyRate).toBe(100);
    expect(result.perChildBreakdown).toHaveLength(1);
  });

  it("handles mix of all statuses", () => {
    const records: MedicationRecord[] = [
      { id: "r1", childId: "c1", childName: "Test", medicationName: "Med", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-01", administeredTime: "08:00", administeredBy: "Staff", status: "given" },
      { id: "r2", childId: "c1", childName: "Test", medicationName: "Med", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-02", administeredTime: "08:00", administeredBy: "Staff", status: "refused" },
      { id: "r3", childId: "c1", childName: "Test", medicationName: "Med", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-03", administeredTime: "08:00", administeredBy: "Staff", status: "omitted" },
      { id: "r4", childId: "c1", childName: "Test", medicationName: "Med", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-04", administeredTime: "08:00", administeredBy: "Staff", status: "late" },
      { id: "r5", childId: "c1", childName: "Test", medicationName: "Med", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-05", administeredTime: "08:00", administeredBy: "Staff", status: "self_administered" },
      { id: "r6", childId: "c1", childName: "Test", medicationName: "Med", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-06", administeredTime: "08:00", administeredBy: "Staff", status: "error" },
    ];
    const result = evaluateAdministrationAccuracy(records);
    expect(result.totalRecords).toBe(6);
    // given (1) + self_admin (1) = 2 out of 6 => 33.3%
    expect(result.accuracyRate).toBeCloseTo(33.3, 0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateMedicationErrors
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMedicationErrors", () => {
  it("counts total errors in period", () => {
    const result = evaluateMedicationErrors(makeMedicationErrors(), PERIOD_START, PERIOD_END);
    expect(result.totalErrors).toBe(3);
  });

  it("produces correct severity breakdown", () => {
    const result = evaluateMedicationErrors(makeMedicationErrors(), PERIOD_START, PERIOD_END);
    expect(result.severityBreakdown.minor).toBe(1);
    expect(result.severityBreakdown.moderate).toBe(1);
    expect(result.severityBreakdown.significant).toBe(1);
    expect(result.severityBreakdown.critical).toBe(0);
  });

  it("produces correct error type breakdown", () => {
    const result = evaluateMedicationErrors(makeMedicationErrors(), PERIOD_START, PERIOD_END);
    expect(result.errorTypeBreakdown.wrong_time).toBe(1);
    expect(result.errorTypeBreakdown.documentation_error).toBe(1);
    expect(result.errorTypeBreakdown.missed).toBe(1);
    expect(result.errorTypeBreakdown.wrong_dose).toBe(0);
  });

  it("determines trend direction", () => {
    const result = evaluateMedicationErrors(makeMedicationErrors(), PERIOD_START, PERIOD_END);
    // Period: May 1-18, midpoint ~May 9
    // First half: err-002 (May 7), err-003 (May 6) = 2
    // Second half: err-001 (May 10) = 1
    expect(result.trend.direction).toBe("improving");
    expect(result.trend.firstHalfCount).toBe(2);
    expect(result.trend.secondHalfCount).toBe(1);
  });

  it("detects repeat errors when no types repeat", () => {
    const result = evaluateMedicationErrors(makeMedicationErrors(), PERIOD_START, PERIOD_END);
    // All three are different types, so no repeats
    expect(result.repeatErrors).toHaveLength(0);
  });

  it("detects repeat errors when types repeat", () => {
    const errors: MedicationError[] = [
      ...makeMedicationErrors(),
      { id: "err-004", childId: "child-alex", childName: "Alex", errorDate: "2026-05-12", errorType: "wrong_time", severity: "minor", description: "Another wrong time", reportedBy: "Tom", actionTaken: "Noted", notifiedParties: [] },
    ];
    const result = evaluateMedicationErrors(errors, PERIOD_START, PERIOD_END);
    expect(result.repeatErrors.length).toBeGreaterThan(0);
    const wrongTimeRepeat = result.repeatErrors.find(r => r.errorType === "wrong_time");
    expect(wrongTimeRepeat).toBeDefined();
    expect(wrongTimeRepeat!.count).toBe(2);
  });

  it("counts root cause analysis", () => {
    const result = evaluateMedicationErrors(makeMedicationErrors(), PERIOD_START, PERIOD_END);
    expect(result.errorsWithRootCause).toBe(2);
    expect(result.errorsWithoutRootCause).toBe(1);
  });

  it("handles empty errors", () => {
    const result = evaluateMedicationErrors([], PERIOD_START, PERIOD_END);
    expect(result.totalErrors).toBe(0);
    expect(result.trend.direction).toBe("stable");
    expect(result.repeatErrors).toHaveLength(0);
  });

  it("filters errors outside period", () => {
    const errors: MedicationError[] = [
      { id: "e1", childId: "c1", childName: "Test", errorDate: "2026-04-15", errorType: "wrong_dose", severity: "minor", description: "Outside", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
    ];
    const result = evaluateMedicationErrors(errors, PERIOD_START, PERIOD_END);
    expect(result.totalErrors).toBe(0);
  });

  it("includes errors at period boundaries", () => {
    const errors: MedicationError[] = [
      { id: "e1", childId: "c1", childName: "Test", errorDate: "2026-05-01", errorType: "wrong_dose", severity: "minor", description: "Start boundary", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
      { id: "e2", childId: "c1", childName: "Test", errorDate: "2026-05-18", errorType: "wrong_time", severity: "minor", description: "End boundary", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
    ];
    const result = evaluateMedicationErrors(errors, PERIOD_START, PERIOD_END);
    expect(result.totalErrors).toBe(2);
  });

  it("determines stable trend when equal halves", () => {
    const errors: MedicationError[] = [
      { id: "e1", childId: "c1", childName: "Test", errorDate: "2026-05-03", errorType: "wrong_dose", severity: "minor", description: "First half", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
      { id: "e2", childId: "c1", childName: "Test", errorDate: "2026-05-15", errorType: "wrong_time", severity: "minor", description: "Second half", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
    ];
    const result = evaluateMedicationErrors(errors, PERIOD_START, PERIOD_END);
    expect(result.trend.direction).toBe("stable");
  });

  it("determines worsening trend", () => {
    const errors: MedicationError[] = [
      { id: "e1", childId: "c1", childName: "Test", errorDate: "2026-05-03", errorType: "wrong_dose", severity: "minor", description: "First half", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
      { id: "e2", childId: "c1", childName: "Test", errorDate: "2026-05-14", errorType: "wrong_time", severity: "minor", description: "Second half 1", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
      { id: "e3", childId: "c1", childName: "Test", errorDate: "2026-05-16", errorType: "missed", severity: "minor", description: "Second half 2", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
    ];
    const result = evaluateMedicationErrors(errors, PERIOD_START, PERIOD_END);
    expect(result.trend.direction).toBe("worsening");
  });

  it("handles all severities", () => {
    const errors: MedicationError[] = [
      { id: "e1", childId: "c1", childName: "Test", errorDate: "2026-05-05", errorType: "wrong_dose", severity: "minor", description: "Minor", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
      { id: "e2", childId: "c1", childName: "Test", errorDate: "2026-05-06", errorType: "wrong_time", severity: "moderate", description: "Moderate", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
      { id: "e3", childId: "c1", childName: "Test", errorDate: "2026-05-07", errorType: "wrong_medication", severity: "significant", description: "Significant", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
      { id: "e4", childId: "c1", childName: "Test", errorDate: "2026-05-08", errorType: "wrong_child", severity: "critical", description: "Critical", reportedBy: "Staff", actionTaken: "None", notifiedParties: [] },
    ];
    const result = evaluateMedicationErrors(errors, PERIOD_START, PERIOD_END);
    expect(result.severityBreakdown.minor).toBe(1);
    expect(result.severityBreakdown.moderate).toBe(1);
    expect(result.severityBreakdown.significant).toBe(1);
    expect(result.severityBreakdown.critical).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateStockManagement
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStockManagement", () => {
  it("counts total stock checks", () => {
    const result = evaluateStockManagement(makeStockChecks());
    expect(result.totalChecks).toBe(10);
  });

  it("calculates check frequency per week", () => {
    const result = evaluateStockManagement(makeStockChecks());
    // Span: May 1 to May 15 = 14 days = 2 weeks, 10 checks
    expect(result.checkFrequencyPerWeek).toBeGreaterThanOrEqual(3);
  });

  it("calculates discrepancy rate", () => {
    const result = evaluateStockManagement(makeStockChecks());
    // 1 discrepancy out of 10 = 10%
    expect(result.discrepancyRate).toBe(10);
  });

  it("counts discrepancies", () => {
    const result = evaluateStockManagement(makeStockChecks());
    expect(result.discrepancyCount).toBe(1);
    expect(result.checksWithDiscrepancy).toBe(1);
  });

  it("collects reconciliation actions", () => {
    const result = evaluateStockManagement(makeStockChecks());
    expect(result.reconciliationActions).toHaveLength(1);
    expect(result.reconciliationActions[0]).toContain("Recounted");
  });

  it("handles empty stock checks", () => {
    const result = evaluateStockManagement([]);
    expect(result.totalChecks).toBe(0);
    expect(result.checkFrequencyPerWeek).toBe(0);
    expect(result.discrepancyRate).toBe(0);
  });

  it("handles all-clear stock checks", () => {
    const checks: StockCheck[] = [
      { id: "s1", medicationName: "Med A", childId: "c1", childName: "Test", checkDate: "2026-05-01", checkedBy: "Staff", expectedCount: 30, actualCount: 30, discrepancy: false },
      { id: "s2", medicationName: "Med A", childId: "c1", childName: "Test", checkDate: "2026-05-08", checkedBy: "Staff", expectedCount: 23, actualCount: 23, discrepancy: false },
    ];
    const result = evaluateStockManagement(checks);
    expect(result.discrepancyRate).toBe(0);
    expect(result.reconciliationActions).toHaveLength(0);
  });

  it("handles all-discrepant stock checks", () => {
    const checks: StockCheck[] = [
      { id: "s1", medicationName: "Med A", childId: "c1", childName: "Test", checkDate: "2026-05-01", checkedBy: "Staff", expectedCount: 30, actualCount: 29, discrepancy: true, actionTaken: "Investigated" },
      { id: "s2", medicationName: "Med A", childId: "c1", childName: "Test", checkDate: "2026-05-08", checkedBy: "Staff", expectedCount: 23, actualCount: 21, discrepancy: true, actionTaken: "Escalated" },
    ];
    const result = evaluateStockManagement(checks);
    expect(result.discrepancyRate).toBe(100);
    expect(result.reconciliationActions).toHaveLength(2);
  });

  it("handles single stock check", () => {
    const checks: StockCheck[] = [
      { id: "s1", medicationName: "Med A", childId: "c1", childName: "Test", checkDate: "2026-05-01", checkedBy: "Staff", expectedCount: 30, actualCount: 30, discrepancy: false },
    ];
    const result = evaluateStockManagement(checks);
    expect(result.totalChecks).toBe(1);
    expect(result.checkFrequencyPerWeek).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateSelfAdministration
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSelfAdministration", () => {
  it("counts total assessments", () => {
    const result = evaluateSelfAdministration(makeSelfAdminAssessments());
    expect(result.totalAssessments).toBe(3);
  });

  it("identifies children progressing toward target", () => {
    const result = evaluateSelfAdministration(makeSelfAdminAssessments());
    // Latest assessment for Morgan is level 3 (target is level 3) — at target, not progressing
    expect(result.childrenAtTarget).toBe(1);
  });

  it("identifies children at target", () => {
    const result = evaluateSelfAdministration(makeSelfAdminAssessments());
    expect(result.childrenAtTarget).toBe(1);
  });

  it("produces level distribution based on latest assessments", () => {
    const result = evaluateSelfAdministration(makeSelfAdminAssessments());
    // Latest for Morgan is level_3_independent_checked
    expect(result.currentLevelDistribution).toHaveLength(1);
    expect(result.currentLevelDistribution[0].level).toBe("level_3_independent_checked");
    expect(result.currentLevelDistribution[0].count).toBe(1);
  });

  it("analyses competencies across all assessments", () => {
    const result = evaluateSelfAdministration(makeSelfAdminAssessments());
    expect(result.competencyAnalysis.length).toBeGreaterThan(0);
    const understandsPurpose = result.competencyAnalysis.find(c => c.competency === "Understands medication purpose");
    expect(understandsPurpose).toBeDefined();
    expect(understandsPurpose!.count).toBe(3); // appears in all 3 assessments
  });

  it("analyses areas for development", () => {
    const result = evaluateSelfAdministration(makeSelfAdminAssessments());
    expect(result.areasForDevelopmentSummary.length).toBeGreaterThan(0);
    const timing = result.areasForDevelopmentSummary.find(a => a.competency === "Remembering timing without prompts");
    expect(timing).toBeDefined();
    expect(timing!.count).toBe(2); // appears in first 2 assessments
  });

  it("handles empty assessments", () => {
    const result = evaluateSelfAdministration([]);
    expect(result.totalAssessments).toBe(0);
    expect(result.childrenProgressing).toBe(0);
    expect(result.currentLevelDistribution).toHaveLength(0);
  });

  it("correctly uses only latest assessment per child for level distribution", () => {
    const assessments: SelfAdminAssessment[] = [
      { id: "a1", childId: "c1", childName: "Child A", assessmentDate: "2026-04-01", currentLevel: "level_1_full_staff", targetLevel: "level_3_independent_checked", assessedBy: "Staff", competencies: [], areasForDevelopment: [], reviewDate: "2026-05-01" },
      { id: "a2", childId: "c1", childName: "Child A", assessmentDate: "2026-05-01", currentLevel: "level_2_supervised", targetLevel: "level_3_independent_checked", assessedBy: "Staff", competencies: [], areasForDevelopment: [], reviewDate: "2026-06-01" },
    ];
    const result = evaluateSelfAdministration(assessments);
    expect(result.currentLevelDistribution).toHaveLength(1);
    expect(result.currentLevelDistribution[0].level).toBe("level_2_supervised");
    expect(result.childrenProgressing).toBe(1);
  });

  it("handles multiple children on self-admin", () => {
    const assessments: SelfAdminAssessment[] = [
      { id: "a1", childId: "c1", childName: "Child A", assessmentDate: "2026-05-01", currentLevel: "level_2_supervised", targetLevel: "level_4_fully_independent", assessedBy: "Staff", competencies: ["A"], areasForDevelopment: ["B"], reviewDate: "2026-06-01" },
      { id: "a2", childId: "c2", childName: "Child B", assessmentDate: "2026-05-01", currentLevel: "level_4_fully_independent", targetLevel: "level_4_fully_independent", assessedBy: "Staff", competencies: ["A", "C"], areasForDevelopment: [], reviewDate: "2026-06-01" },
    ];
    const result = evaluateSelfAdministration(assessments);
    expect(result.childrenProgressing).toBe(1);
    expect(result.childrenAtTarget).toBe(1);
    expect(result.currentLevelDistribution).toHaveLength(2);
  });

  it("sorts competencies by frequency descending", () => {
    const assessments: SelfAdminAssessment[] = [
      { id: "a1", childId: "c1", childName: "A", assessmentDate: "2026-05-01", currentLevel: "level_1_full_staff", targetLevel: "level_2_supervised", assessedBy: "S", competencies: ["X", "Y"], areasForDevelopment: [], reviewDate: "2026-06-01" },
      { id: "a2", childId: "c2", childName: "B", assessmentDate: "2026-05-01", currentLevel: "level_1_full_staff", targetLevel: "level_2_supervised", assessedBy: "S", competencies: ["X"], areasForDevelopment: [], reviewDate: "2026-06-01" },
    ];
    const result = evaluateSelfAdministration(assessments);
    expect(result.competencyAnalysis[0].competency).toBe("X");
    expect(result.competencyAnalysis[0].count).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. evaluateControlledDrugs
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateControlledDrugs", () => {
  it("counts total records", () => {
    const result = evaluateControlledDrugs(makeControlledDrugRecords());
    expect(result.totalRecords).toBe(8);
  });

  it("calculates witness rate (all witnessed = 100%)", () => {
    const result = evaluateControlledDrugs(makeControlledDrugRecords());
    expect(result.witnessRate).toBe(100);
  });

  it("calculates balance accuracy rate (all correct = 100%)", () => {
    const result = evaluateControlledDrugs(makeControlledDrugRecords());
    expect(result.balanceAccuracyRate).toBe(100);
  });

  it("reports zero discrepancies when all correct", () => {
    const result = evaluateControlledDrugs(makeControlledDrugRecords());
    expect(result.discrepancyCount).toBe(0);
  });

  it("handles empty records", () => {
    const result = evaluateControlledDrugs([]);
    expect(result.totalRecords).toBe(0);
    expect(result.witnessRate).toBe(100);
    expect(result.balanceAccuracyRate).toBe(100);
  });

  it("detects missing witness", () => {
    const records: ControlledDrugRecord[] = [
      { id: "cd1", medicationName: "Med A", childId: "c1", childName: "Test", date: "2026-05-01", administeredBy: "Staff A", witnessedBy: "Staff B", balanceBefore: 10, balanceAfter: 9, balanceCorrect: true },
      { id: "cd2", medicationName: "Med A", childId: "c1", childName: "Test", date: "2026-05-02", administeredBy: "Staff A", witnessedBy: "", balanceBefore: 9, balanceAfter: 8, balanceCorrect: true },
    ];
    const result = evaluateControlledDrugs(records);
    expect(result.witnessRate).toBe(50);
  });

  it("detects balance discrepancy", () => {
    const records: ControlledDrugRecord[] = [
      { id: "cd1", medicationName: "Med A", childId: "c1", childName: "Test", date: "2026-05-01", administeredBy: "Staff A", witnessedBy: "Staff B", balanceBefore: 10, balanceAfter: 9, balanceCorrect: true },
      { id: "cd2", medicationName: "Med A", childId: "c1", childName: "Test", date: "2026-05-02", administeredBy: "Staff A", witnessedBy: "Staff B", balanceBefore: 9, balanceAfter: 7, balanceCorrect: false },
    ];
    const result = evaluateControlledDrugs(records);
    expect(result.balanceAccuracyRate).toBe(50);
    expect(result.discrepancyCount).toBe(1);
  });

  it("handles single record", () => {
    const records: ControlledDrugRecord[] = [
      { id: "cd1", medicationName: "Med A", childId: "c1", childName: "Test", date: "2026-05-01", administeredBy: "Staff A", witnessedBy: "Staff B", balanceBefore: 10, balanceAfter: 9, balanceCorrect: true },
    ];
    const result = evaluateControlledDrugs(records);
    expect(result.totalRecords).toBe(1);
    expect(result.witnessRate).toBe(100);
    expect(result.balanceAccuracyRate).toBe(100);
  });

  it("handles all discrepancies", () => {
    const records: ControlledDrugRecord[] = [
      { id: "cd1", medicationName: "Med A", childId: "c1", childName: "Test", date: "2026-05-01", administeredBy: "Staff A", witnessedBy: "Staff B", balanceBefore: 10, balanceAfter: 8, balanceCorrect: false },
      { id: "cd2", medicationName: "Med A", childId: "c1", childName: "Test", date: "2026-05-02", administeredBy: "Staff A", witnessedBy: "Staff B", balanceBefore: 8, balanceAfter: 5, balanceCorrect: false },
    ];
    const result = evaluateControlledDrugs(records);
    expect(result.balanceAccuracyRate).toBe(0);
    expect(result.discrepancyCount).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateMedicationManagementIntelligence — Full Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("generateMedicationManagementIntelligence", () => {
  function runFullIntelligence() {
    return generateMedicationManagementIntelligence(
      makeAdministrationRecords(),
      makeMedicationErrors(),
      makeStockChecks(),
      makeSelfAdminAssessments(),
      makeControlledDrugRecords(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
  }

  it("returns correct home ID", () => {
    const result = runFullIntelligence();
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    const result = runFullIntelligence();
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns assessedAt matching reference date", () => {
    const result = runFullIntelligence();
    expect(result.assessedAt).toBe(REFERENCE_DATE);
  });

  it("returns overall score as a number 0-100", () => {
    const result = runFullIntelligence();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns a valid rating", () => {
    const result = runFullIntelligence();
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("scoring breakdown sums to roughly overall score", () => {
    const result = runFullIntelligence();
    const sum =
      result.scoringBreakdown.administrationAccuracy +
      result.scoringBreakdown.errorManagement +
      result.scoringBreakdown.stockManagement +
      result.scoringBreakdown.selfAdministration +
      result.scoringBreakdown.controlledDrugsCompliance;
    expect(Math.round(sum)).toBeCloseTo(result.overallScore, 0);
  });

  it("administration accuracy breakdown is included", () => {
    const result = runFullIntelligence();
    expect(result.administrationAccuracy.totalRecords).toBe(27);
    expect(result.administrationAccuracy.perChildBreakdown).toHaveLength(3);
  });

  it("error analysis is included", () => {
    const result = runFullIntelligence();
    expect(result.errorAnalysis.totalErrors).toBe(3);
  });

  it("stock management is included", () => {
    const result = runFullIntelligence();
    expect(result.stockManagement.totalChecks).toBe(10);
  });

  it("self administration is included", () => {
    const result = runFullIntelligence();
    expect(result.selfAdministration.totalAssessments).toBe(3);
  });

  it("controlled drugs is included", () => {
    const result = runFullIntelligence();
    expect(result.controlledDrugs.totalRecords).toBe(8);
  });

  it("generates strengths", () => {
    const result = runFullIntelligence();
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement", () => {
    const result = runFullIntelligence();
    // With errors and discrepancies, there should be areas for improvement
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates recommended actions", () => {
    const result = runFullIntelligence();
    expect(result.recommendedActions.length).toBeGreaterThan(0);
  });

  it("generates regulatory links", () => {
    const result = runFullIntelligence();
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("regulatory links include CHR 2015 Reg 23", () => {
    const result = runFullIntelligence();
    expect(result.regulatoryLinks.some(l => l.includes("Reg 23"))).toBe(true);
  });

  it("regulatory links include SCCIF", () => {
    const result = runFullIntelligence();
    expect(result.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
  });

  it("regulatory links include Medicines Act 1968", () => {
    const result = runFullIntelligence();
    expect(result.regulatoryLinks.some(l => l.includes("Medicines Act 1968"))).toBe(true);
  });

  it("regulatory links include Misuse of Drugs Act for controlled drugs", () => {
    const result = runFullIntelligence();
    expect(result.regulatoryLinks.some(l => l.includes("Misuse of Drugs Act"))).toBe(true);
  });

  it("strengths mention controlled drug compliance when fully witnessed", () => {
    const result = runFullIntelligence();
    expect(result.strengths.some(s => s.includes("dual-witnessed"))).toBe(true);
  });

  it("strengths mention error trend when improving", () => {
    const result = runFullIntelligence();
    expect(result.strengths.some(s => s.includes("improving"))).toBe(true);
  });

  it("areas mention significant errors", () => {
    const result = runFullIntelligence();
    expect(result.areasForImprovement.some(a => a.includes("significant"))).toBe(true);
  });

  it("areas mention root cause analysis gaps", () => {
    const result = runFullIntelligence();
    // err-003 has no rootCauseIdentified
    expect(result.areasForImprovement.some(a => a.includes("root cause"))).toBe(true);
  });

  it("scoring breakdown administration is capped at 35", () => {
    const result = runFullIntelligence();
    expect(result.scoringBreakdown.administrationAccuracy).toBeLessThanOrEqual(35);
  });

  it("scoring breakdown error management is capped at 20", () => {
    const result = runFullIntelligence();
    expect(result.scoringBreakdown.errorManagement).toBeLessThanOrEqual(20);
  });

  it("scoring breakdown stock management is capped at 15", () => {
    const result = runFullIntelligence();
    expect(result.scoringBreakdown.stockManagement).toBeLessThanOrEqual(15);
  });

  it("scoring breakdown self admin is capped at 15", () => {
    const result = runFullIntelligence();
    expect(result.scoringBreakdown.selfAdministration).toBeLessThanOrEqual(15);
  });

  it("scoring breakdown controlled drugs is capped at 15", () => {
    const result = runFullIntelligence();
    expect(result.scoringBreakdown.controlledDrugsCompliance).toBeLessThanOrEqual(15);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Rating Thresholds
// ══════════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  function makeMinimal(statuses: AdministrationStatus[]): MedicationRecord[] {
    return statuses.map((status, i) => ({
      id: `r-${i}`, childId: "c1", childName: "Test", medicationName: "Med",
      medicationType: "regular" as const, prescribedDose: "5mg",
      administeredDate: "2026-05-05", administeredTime: "08:00",
      administeredBy: "Staff", status,
    }));
  }

  it("outstanding rating for perfect data", () => {
    const records = makeMinimal(Array(20).fill("given"));
    const result = generateMedicationManagementIntelligence(
      records, [], makeStockChecks(), makeSelfAdminAssessments(), makeControlledDrugRecords(),
      "test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("inadequate rating for terrible data", () => {
    const records = makeMinimal(Array(20).fill("error"));
    const errors: MedicationError[] = Array.from({ length: 10 }, (_, i) => ({
      id: `e-${i}`, childId: "c1", childName: "Test", errorDate: "2026-05-10",
      errorType: "wrong_dose" as const, severity: "critical" as const,
      description: "Critical error", reportedBy: "Staff", actionTaken: "None",
      notifiedParties: [],
    }));
    // Bad controlled drug records to eliminate CD score
    const badCd: ControlledDrugRecord[] = Array.from({ length: 5 }, (_, i) => ({
      id: `cd-${i}`, medicationName: "Med", childId: "c1", childName: "Test",
      date: "2026-05-05", administeredBy: "Staff A", witnessedBy: "",
      balanceBefore: 10 - i, balanceAfter: 8 - i, balanceCorrect: false,
    }));
    const result = generateMedicationManagementIntelligence(
      records, errors, [], [], badCd,
      "test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
  });

  it("no controlled drugs gives full controlled drug score", () => {
    const records = makeMinimal(Array(10).fill("given"));
    const result = generateMedicationManagementIntelligence(
      records, [], makeStockChecks(), [], [],
      "test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.scoringBreakdown.controlledDrugsCompliance).toBe(15);
  });

  it("no self-admin gives baseline self-admin score", () => {
    const records = makeMinimal(Array(10).fill("given"));
    const result = generateMedicationManagementIntelligence(
      records, [], makeStockChecks(), [], makeControlledDrugRecords(),
      "test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.scoringBreakdown.selfAdministration).toBe(7.5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("all empty arrays produce a valid result", () => {
    const result = generateMedicationManagementIntelligence(
      [], [], [], [], [],
      "empty-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.recommendedActions.length).toBeGreaterThan(0);
  });

  it("very high error count produces low score", () => {
    const records: MedicationRecord[] = Array.from({ length: 5 }, (_, i) => ({
      id: `r-${i}`, childId: "c1", childName: "Test", medicationName: "Med",
      medicationType: "regular" as const, prescribedDose: "5mg",
      administeredDate: "2026-05-05", administeredTime: "08:00",
      administeredBy: "Staff", status: "error" as const,
    }));
    const errors: MedicationError[] = Array.from({ length: 5 }, (_, i) => ({
      id: `e-${i}`, childId: "c1", childName: "Test", errorDate: "2026-05-10",
      errorType: "wrong_dose" as const, severity: "significant" as const,
      description: "Error", reportedBy: "Staff", actionTaken: "None", notifiedParties: [],
    }));
    const result = generateMedicationManagementIntelligence(
      records, errors, [], [], [],
      "test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThan(50);
  });

  it("only late administrations reduce accuracy but not dramatically", () => {
    const records: MedicationRecord[] = Array.from({ length: 10 }, (_, i) => ({
      id: `r-${i}`, childId: "c1", childName: "Test", medicationName: "Med",
      medicationType: "regular" as const, prescribedDose: "5mg",
      administeredDate: "2026-05-05", administeredTime: "08:00",
      administeredBy: "Staff", status: "late" as const,
    }));
    const result = generateMedicationManagementIntelligence(
      records, [], makeStockChecks(), [], [],
      "test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // Late administrations count as not-accurate but should not crash
    expect(result.administrationAccuracy.lateRate).toBe(100);
    expect(result.administrationAccuracy.accuracyRate).toBe(0);
  });

  it("handles large dataset without error", () => {
    const records: MedicationRecord[] = Array.from({ length: 500 }, (_, i) => ({
      id: `r-${i}`, childId: `c-${i % 10}`, childName: `Child ${i % 10}`,
      medicationName: "Med", medicationType: "regular" as const, prescribedDose: "5mg",
      administeredDate: "2026-05-05", administeredTime: `${String(8 + (i % 12)).padStart(2, "0")}:00`,
      administeredBy: "Staff", status: "given" as const,
    }));
    const result = evaluateAdministrationAccuracy(records);
    expect(result.totalRecords).toBe(500);
    expect(result.perChildBreakdown).toHaveLength(10);
  });

  it("self-admin with child already at highest level", () => {
    const assessments: SelfAdminAssessment[] = [
      { id: "a1", childId: "c1", childName: "Test", assessmentDate: "2026-05-01", currentLevel: "level_4_fully_independent", targetLevel: "level_4_fully_independent", assessedBy: "Staff", competencies: ["All"], areasForDevelopment: [], reviewDate: "2026-06-01" },
    ];
    const result = evaluateSelfAdministration(assessments);
    expect(result.childrenAtTarget).toBe(1);
    expect(result.childrenProgressing).toBe(0);
  });

  it("errors only outside period returns zero", () => {
    const errors: MedicationError[] = [
      { id: "e1", childId: "c1", childName: "Test", errorDate: "2026-04-01", errorType: "wrong_dose", severity: "critical", description: "Old error", reportedBy: "Staff", actionTaken: "Done", notifiedParties: [] },
      { id: "e2", childId: "c1", childName: "Test", errorDate: "2026-06-01", errorType: "wrong_dose", severity: "critical", description: "Future error", reportedBy: "Staff", actionTaken: "Done", notifiedParties: [] },
    ];
    const result = evaluateMedicationErrors(errors, PERIOD_START, PERIOD_END);
    expect(result.totalErrors).toBe(0);
  });

  it("actions recommend Ofsted notification for critical errors", () => {
    const records: MedicationRecord[] = [
      { id: "r1", childId: "c1", childName: "Test", medicationName: "Med", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-05", administeredTime: "08:00", administeredBy: "Staff", status: "given" },
    ];
    const errors: MedicationError[] = [
      { id: "e1", childId: "c1", childName: "Test", errorDate: "2026-05-10", errorType: "wrong_child", severity: "critical", description: "Wrong child given medication", reportedBy: "Staff", actionTaken: "Immediate escalation", notifiedParties: ["Ofsted"] },
    ];
    const result = generateMedicationManagementIntelligence(
      records, errors, [], [], [],
      "test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.recommendedActions.some(a => a.includes("Ofsted"))).toBe(true);
  });

  it("actions recommend Ofsted notification for significant errors", () => {
    const records: MedicationRecord[] = [
      { id: "r1", childId: "c1", childName: "Test", medicationName: "Med", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-05", administeredTime: "08:00", administeredBy: "Staff", status: "given" },
    ];
    const errors: MedicationError[] = [
      { id: "e1", childId: "c1", childName: "Test", errorDate: "2026-05-10", errorType: "missed", severity: "significant", description: "Missed dose", reportedBy: "Staff", actionTaken: "Reported", notifiedParties: [] },
    ];
    const result = generateMedicationManagementIntelligence(
      records, errors, [], [], [],
      "test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.recommendedActions.some(a => a.includes("Ofsted"))).toBe(true);
  });

  it("high refusal rate triggers GP review recommendation", () => {
    const records: MedicationRecord[] = Array.from({ length: 10 }, (_, i) => ({
      id: `r-${i}`, childId: "c1", childName: "Test", medicationName: "Med",
      medicationType: "regular" as const, prescribedDose: "5mg",
      administeredDate: "2026-05-05", administeredTime: "08:00",
      administeredBy: "Staff",
      status: i < 3 ? "given" as const : "refused" as const,
    }));
    const result = generateMedicationManagementIntelligence(
      records, [], [], [], [],
      "test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.recommendedActions.some(a => a.includes("GP review"))).toBe(true);
  });

  it("no stock checks triggers action", () => {
    const records: MedicationRecord[] = [
      { id: "r1", childId: "c1", childName: "Test", medicationName: "Med", medicationType: "regular", prescribedDose: "5mg", administeredDate: "2026-05-05", administeredTime: "08:00", administeredBy: "Staff", status: "given" },
    ];
    const result = generateMedicationManagementIntelligence(
      records, [], [], [], [],
      "test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.recommendedActions.some(a => a.includes("stock check"))).toBe(true);
  });

  it("perfect scenario produces outstanding with many strengths", () => {
    const records: MedicationRecord[] = Array.from({ length: 20 }, (_, i) => ({
      id: `r-${i}`, childId: "c1", childName: "Test", medicationName: "Med",
      medicationType: "regular" as const, prescribedDose: "5mg",
      administeredDate: "2026-05-05", administeredTime: "08:00",
      administeredBy: "Staff", status: "given" as const,
    }));
    const checks: StockCheck[] = [
      { id: "s1", medicationName: "Med", childId: "c1", childName: "Test", checkDate: "2026-05-01", checkedBy: "Staff", expectedCount: 30, actualCount: 30, discrepancy: false },
      { id: "s2", medicationName: "Med", childId: "c1", childName: "Test", checkDate: "2026-05-08", checkedBy: "Staff", expectedCount: 23, actualCount: 23, discrepancy: false },
      { id: "s3", medicationName: "Med", childId: "c1", childName: "Test", checkDate: "2026-05-15", checkedBy: "Staff", expectedCount: 16, actualCount: 16, discrepancy: false },
    ];
    const result = generateMedicationManagementIntelligence(
      records, [], checks, [], [],
      "test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.rating).toBe("outstanding");
    expect(result.strengths.length).toBeGreaterThanOrEqual(3);
  });
});
