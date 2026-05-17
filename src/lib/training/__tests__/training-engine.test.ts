// ══════════════════════════════════════════════════════════════════════════════
// Training & Development Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateStaffTrainingCompliance,
  calculateHomeTrainingMetrics,
  getTrainingCategoryLabel,
  getTrainingStatusLabel,
  getQualificationStatusLabel,
  MANDATORY_TRAINING,
} from "../training-engine";
import type { StaffTrainingRecord, TrainingCompletion } from "../training-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeAllTrainingCurrent(): TrainingCompletion[] {
  return MANDATORY_TRAINING.map(mt => ({
    category: mt.category,
    courseName: mt.name,
    completedDate: "2026-01-15T10:00:00Z",
    expiryDate: mt.refreshPeriodMonths > 0 ? "2027-01-15T10:00:00Z" : undefined,
    status: "current" as const,
    mandatory: true,
  }));
}

function makeStaffRecord(overrides: Partial<StaffTrainingRecord> = {}): StaffTrainingRecord {
  return {
    staffId: "staff-01",
    staffName: "Sarah Williams",
    role: "residential_worker",
    startDate: "2024-06-01T10:00:00Z",
    inductionCompleted: true,
    inductionCompletedDate: "2024-08-15T10:00:00Z",
    canWorkAlone: true,
    trainings: makeAllTrainingCurrent(),
    qualifications: [
      { type: "level_3_diploma", title: "Level 3 Diploma in Residential Childcare", status: "achieved", achievedDate: "2025-09-01T10:00:00Z" },
    ],
    cpdHoursThisYear: 15,
    cpdTarget: 20,
    supervisionUpToDate: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Staff Compliance Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffTrainingCompliance", () => {
  it("marks fully compliant staff member", () => {
    const result = evaluateStaffTrainingCompliance(makeStaffRecord(), NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.overallComplianceRate).toBe(100);
    expect(result.inductionComplete).toBe(true);
    expect(result.qualificationOnTrack).toBe(true);
  });

  it("flags expired training", () => {
    const trainings = makeAllTrainingCurrent();
    trainings[0] = { ...trainings[0], status: "expired" }; // safeguarding expired
    const record = makeStaffRecord({ trainings });
    const result = evaluateStaffTrainingCompliance(record, NOW);
    expect(result.isCompliant).toBe(false);
    expect(result.expiredCount).toBe(1);
    expect(result.issues.some(i => i.includes("Safeguarding") && i.includes("expired"))).toBe(true);
  });

  it("warns about expiring soon training", () => {
    const trainings = makeAllTrainingCurrent();
    trainings[1] = { ...trainings[1], status: "expiring_soon", expiryDate: "2026-06-01T10:00:00Z" }; // first aid expiring
    const record = makeStaffRecord({ trainings });
    const result = evaluateStaffTrainingCompliance(record, NOW);
    expect(result.expiringSoonCount).toBe(1);
    expect(result.warnings.some(w => w.includes("First Aid") && w.includes("expiring"))).toBe(true);
    // Still compliant because expiring_soon is counted as current
    expect(result.mandatoryTrainingCurrent).toBe(MANDATORY_TRAINING.length);
  });

  it("flags not started mandatory training", () => {
    const trainings = makeAllTrainingCurrent();
    trainings[2] = { ...trainings[2], status: "not_started", completedDate: undefined }; // medication not started
    const record = makeStaffRecord({ trainings });
    const result = evaluateStaffTrainingCompliance(record, NOW);
    expect(result.isCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Medication") && i.includes("not completed"))).toBe(true);
  });

  it("flags induction not completed past deadline", () => {
    const record = makeStaffRecord({
      inductionCompleted: false,
      startDate: "2025-01-01T10:00:00Z", // well past 90 days
    });
    const result = evaluateStaffTrainingCompliance(record, NOW);
    expect(result.inductionComplete).toBe(false);
    expect(result.issues.some(i => i.includes("Induction"))).toBe(true);
  });

  it("warns about induction in progress within deadline", () => {
    const record = makeStaffRecord({
      inductionCompleted: false,
      startDate: "2026-04-01T10:00:00Z", // within 90 days
    });
    const result = evaluateStaffTrainingCompliance(record, NOW);
    expect(result.inductionComplete).toBe(false);
    expect(result.warnings.some(w => w.includes("Induction in progress"))).toBe(true);
    // Should NOT be in issues since still within deadline
    expect(result.issues.some(i => i.includes("Induction"))).toBe(false);
  });

  it("flags Level 3 diploma overdue", () => {
    const record = makeStaffRecord({
      qualifications: [
        { type: "level_3_diploma", title: "Level 3 Diploma", status: "overdue" },
      ],
    });
    const result = evaluateStaffTrainingCompliance(record, NOW);
    expect(result.qualificationOnTrack).toBe(false);
    expect(result.issues.some(i => i.includes("Level 3 Diploma overdue"))).toBe(true);
  });

  it("passes with Level 3 in progress", () => {
    const record = makeStaffRecord({
      qualifications: [
        { type: "level_3_diploma", title: "Level 3 Diploma", status: "in_progress", startDate: "2025-06-01T10:00:00Z", percentComplete: 40 },
      ],
    });
    const result = evaluateStaffTrainingCompliance(record, NOW);
    expect(result.qualificationOnTrack).toBe(true);
  });

  it("recognises higher qualifications", () => {
    const record = makeStaffRecord({
      qualifications: [
        { type: "degree", title: "BSc Social Work", status: "achieved", achievedDate: "2020-07-01T10:00:00Z" },
      ],
    });
    const result = evaluateStaffTrainingCompliance(record, NOW);
    expect(result.qualificationOnTrack).toBe(true);
  });

  it("warns about low CPD hours", () => {
    const record = makeStaffRecord({ cpdHoursThisYear: 3, cpdTarget: 20 });
    const result = evaluateStaffTrainingCompliance(record, NOW);
    expect(result.cpdOnTrack).toBe(false);
    expect(result.warnings.some(w => w.includes("CPD"))).toBe(true);
  });

  it("flags lone working without required training", () => {
    const trainings = makeAllTrainingCurrent();
    // Expire safeguarding (required before lone working)
    trainings[0] = { ...trainings[0], status: "expired" };
    const record = makeStaffRecord({ trainings, canWorkAlone: true });
    const result = evaluateStaffTrainingCompliance(record, NOW);
    expect(result.loneWorkingRequirementsMet).toBe(false);
    expect(result.issues.some(i => i.includes("Lone working authorised but required training not current"))).toBe(true);
  });

  it("calculates overall compliance rate correctly", () => {
    const trainings = makeAllTrainingCurrent();
    // Make 2 expired out of 18 mandatory
    trainings[0] = { ...trainings[0], status: "expired" };
    trainings[1] = { ...trainings[1], status: "expired" };
    const record = makeStaffRecord({ trainings });
    const result = evaluateStaffTrainingCompliance(record, NOW);
    const expected = Math.round(((MANDATORY_TRAINING.length - 2) / MANDATORY_TRAINING.length) * 100);
    expect(result.overallComplianceRate).toBe(expected);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Home Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeTrainingMetrics", () => {
  it("calculates overall metrics for compliant team", () => {
    const staff = [
      makeStaffRecord({ staffId: "s1", staffName: "Sarah" }),
      makeStaffRecord({ staffId: "s2", staffName: "James" }),
    ];
    const result = calculateHomeTrainingMetrics(staff, "home-oak", NOW);
    expect(result.staffCount).toBe(2);
    expect(result.fullyCompliantStaff).toBe(2);
    expect(result.overallComplianceRate).toBe(100);
    expect(result.staffWithExpiredTraining).toBe(0);
  });

  it("identifies staff needing attention", () => {
    const trainings = makeAllTrainingCurrent();
    trainings[0] = { ...trainings[0], status: "expired" };
    const staff = [
      makeStaffRecord({ staffId: "s1", staffName: "Sarah" }),
      makeStaffRecord({ staffId: "s2", staffName: "James", trainings }),
    ];
    const result = calculateHomeTrainingMetrics(staff, "home-oak", NOW);
    expect(result.staffWithExpiredTraining).toBe(1);
    expect(result.staffNeedingAttention.length).toBe(1);
    expect(result.staffNeedingAttention[0].staffName).toBe("James");
  });

  it("calculates category compliance", () => {
    const staff = [
      makeStaffRecord({ staffId: "s1" }),
      makeStaffRecord({ staffId: "s2" }),
    ];
    const result = calculateHomeTrainingMetrics(staff, "home-oak", NOW);
    expect(result.categoryCompliance.length).toBe(MANDATORY_TRAINING.length);
    // All should be 100% for compliant team
    expect(result.categoryCompliance.every(c => c.rate === 100)).toBe(true);
  });

  it("tracks upcoming expiries", () => {
    const trainings = makeAllTrainingCurrent();
    trainings[3] = { ...trainings[3], status: "expiring_soon", expiryDate: "2026-06-10T10:00:00Z" };
    const staff = [makeStaffRecord({ staffId: "s1", staffName: "Sarah", trainings })];
    const result = calculateHomeTrainingMetrics(staff, "home-oak", NOW);
    expect(result.upcomingExpiries.length).toBe(1);
    expect(result.upcomingExpiries[0].staffName).toBe("Sarah");
  });

  it("calculates qualification rate", () => {
    const staff = [
      makeStaffRecord({ staffId: "s1", qualifications: [{ type: "level_3_diploma", title: "L3", status: "achieved", achievedDate: "2025-01-01" }] }),
      makeStaffRecord({ staffId: "s2", qualifications: [{ type: "level_3_diploma", title: "L3", status: "overdue" }] }),
    ];
    const result = calculateHomeTrainingMetrics(staff, "home-oak", NOW);
    expect(result.qualificationRate).toBe(50);
  });

  it("calculates CPD compliance", () => {
    const staff = [
      makeStaffRecord({ staffId: "s1", cpdHoursThisYear: 15, cpdTarget: 20 }), // on track (>50%)
      makeStaffRecord({ staffId: "s2", cpdHoursThisYear: 3, cpdTarget: 20 }),  // not on track
    ];
    const result = calculateHomeTrainingMetrics(staff, "home-oak", NOW);
    expect(result.cpdComplianceRate).toBe(50);
  });

  it("counts specific training categories", () => {
    const staff = [
      makeStaffRecord({ staffId: "s1" }),
      makeStaffRecord({ staffId: "s2" }),
    ];
    const result = calculateHomeTrainingMetrics(staff, "home-oak", NOW);
    expect(result.restraintTrainingCurrent).toBe(2);
    expect(result.safeguardingCurrent).toBe(2);
    expect(result.firstAidCurrent).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Helper functions", () => {
  it("getTrainingCategoryLabel returns readable labels", () => {
    expect(getTrainingCategoryLabel("safeguarding")).toBe("Safeguarding");
    expect(getTrainingCategoryLabel("restraint")).toBe("Restraint (PI)");
    expect(getTrainingCategoryLabel("csea")).toBe("CSE & Online Safety");
  });

  it("getTrainingStatusLabel returns readable labels", () => {
    expect(getTrainingStatusLabel("current")).toBe("Current");
    expect(getTrainingStatusLabel("expiring_soon")).toBe("Expiring Soon");
    expect(getTrainingStatusLabel("expired")).toBe("Expired");
  });

  it("getQualificationStatusLabel returns readable labels", () => {
    expect(getQualificationStatusLabel("achieved")).toBe("Achieved");
    expect(getQualificationStatusLabel("overdue")).toBe("Overdue");
  });
});
