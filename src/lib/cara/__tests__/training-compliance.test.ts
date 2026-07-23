import { describe, it, expect } from "vitest";
import {
  analyseTrainingCompliance,
  type StaffTrainingRecord,
  type TrainingEntry,
  type QualificationEntry,
} from "../training-compliance";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}

function futureDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
}

function makeTraining(overrides: Partial<TrainingEntry> = {}): TrainingEntry {
  return {
    id: `tr_${Math.random().toString(36).slice(2, 8)}`,
    courseId: "course_1",
    courseName: "Safeguarding",
    category: "safeguarding",
    completedDate: makeDate(30),
    expiryDate: futureDate(335),
    status: "completed",
    mandatory: true,
    renewalMonths: 12,
    ...overrides,
  };
}

function makeStaff(overrides: Partial<StaffTrainingRecord> = {}): StaffTrainingRecord {
  return {
    staffId: `staff_${Math.random().toString(36).slice(2, 8)}`,
    staffName: "Test Staff",
    role: "residential",
    startDate: makeDate(365),
    trainings: [
      makeTraining({ courseName: "Safeguarding", category: "safeguarding" }),
      makeTraining({ courseName: "First Aid", category: "first_aid" }),
      makeTraining({ courseName: "Fire Safety", category: "fire_safety" }),
    ],
    qualifications: [
      { id: "q1", name: "Level 3 Diploma", level: "L3", status: "completed" },
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Training Compliance Tracker", () => {
  describe("basic structure", () => {
    it("returns correct structure with no records", () => {
      const result = analyseTrainingCompliance([], "home_oak");
      expect(result.homeId).toBe("home_oak");
      expect(result.overallCompliancePercent).toBeNull();
      expect(result.regulatoryStatus.compliant).toBeNull();
      expect(result.totalStaff).toBe(0);
      expect(result.fullyCompliant).toBe(0);
      expect(result.withGaps).toBe(0);
      expect(result.alerts).toHaveLength(0);
    });

    it("sets analysis date to today", () => {
      const today = new Date().toISOString().slice(0, 10);
      const result = analyseTrainingCompliance([], "home_oak");
      expect(result.analysisDate).toBe(today);
    });
  });

  // ── Per-staff compliance ──────────────────────────────────────────────────

  describe("staff profiles", () => {
    it("100% compliant when all mandatory complete", () => {
      const staff = makeStaff();
      const result = analyseTrainingCompliance([staff]);
      expect(result.staffProfiles[0].compliancePercent).toBe(100);
      expect(result.staffProfiles[0].gaps).toHaveLength(0);
    });

    it("calculates partial compliance", () => {
      const staff = makeStaff({
        trainings: [
          makeTraining({ courseName: "Safeguarding", mandatory: true, status: "completed" }),
          makeTraining({ courseName: "First Aid", mandatory: true, status: "not_started" }),
          makeTraining({ courseName: "Fire Safety", mandatory: true, status: "completed" }),
        ],
      });
      const result = analyseTrainingCompliance([staff]);
      expect(result.staffProfiles[0].compliancePercent).toBe(67); // 2/3
      expect(result.staffProfiles[0].mandatoryComplete).toBe(2);
      expect(result.staffProfiles[0].mandatoryTotal).toBe(3);
    });

    it("identifies gaps by course name", () => {
      const staff = makeStaff({
        trainings: [
          makeTraining({ courseName: "Safeguarding", mandatory: true, status: "completed" }),
          makeTraining({ courseName: "First Aid", mandatory: true, status: "overdue" }),
          makeTraining({ courseName: "Fire Safety", mandatory: true, status: "not_started" }),
        ],
      });
      const result = analyseTrainingCompliance([staff]);
      expect(result.staffProfiles[0].gaps).toContain("First Aid");
      expect(result.staffProfiles[0].gaps).toContain("Fire Safety");
    });

    it("counts expired training", () => {
      const staff = makeStaff({
        trainings: [
          makeTraining({ status: "expired" }),
          makeTraining({ status: "expired" }),
          makeTraining({ status: "completed" }),
        ],
      });
      const result = analyseTrainingCompliance([staff]);
      expect(result.staffProfiles[0].expiredCount).toBe(2);
    });

    it("counts booked training", () => {
      const staff = makeStaff({
        trainings: [
          makeTraining({ status: "booked", mandatory: true }),
          makeTraining({ status: "completed", mandatory: true }),
        ],
      });
      const result = analyseTrainingCompliance([staff]);
      expect(result.staffProfiles[0].bookedCount).toBe(1);
    });

    it("profiles sorted by compliance (lowest first)", () => {
      const staff1 = makeStaff({ staffId: "s1", staffName: "Good Staff", trainings: [makeTraining({ mandatory: true, status: "completed" })] });
      const staff2 = makeStaff({ staffId: "s2", staffName: "Needs Work", trainings: [makeTraining({ mandatory: true, status: "not_started" }), makeTraining({ mandatory: true, status: "completed" })] });
      const result = analyseTrainingCompliance([staff1, staff2]);
      expect(result.staffProfiles[0].staffName).toBe("Needs Work");
    });
  });

  // ── Team coverage ─────────────────────────────────────────────────────────

  describe("team coverage", () => {
    it("calculates category coverage across team", () => {
      const staff1 = makeStaff({ staffId: "s1", trainings: [makeTraining({ category: "safeguarding", mandatory: true, status: "completed" })] });
      const staff2 = makeStaff({ staffId: "s2", trainings: [makeTraining({ category: "safeguarding", mandatory: true, status: "completed" })] });
      const staff3 = makeStaff({ staffId: "s3", trainings: [makeTraining({ category: "safeguarding", mandatory: true, status: "not_started" })] });
      const result = analyseTrainingCompliance([staff1, staff2, staff3]);
      const safeguarding = result.teamCoverage.find((c) => c.category === "safeguarding");
      expect(safeguarding!.staffWithTraining).toBe(2);
      expect(safeguarding!.totalStaff).toBe(3);
      expect(safeguarding!.coveragePercent).toBe(67);
    });

    it("marks categories as mandatory when any staff has it mandatory", () => {
      const staff = makeStaff({ trainings: [makeTraining({ category: "first_aid", mandatory: true, status: "completed" })] });
      const result = analyseTrainingCompliance([staff]);
      const firstAid = result.teamCoverage.find((c) => c.category === "first_aid");
      expect(firstAid!.mandatory).toBe(true);
    });

    it("coverage sorted lowest first", () => {
      const staff = makeStaff({
        trainings: [
          makeTraining({ category: "safeguarding", mandatory: true, status: "completed" }),
          makeTraining({ category: "first_aid", mandatory: true, status: "not_started" }),
        ],
      });
      const result = analyseTrainingCompliance([staff]);
      // first_aid coverage = 0%, safeguarding = 100%
      const firstAid = result.teamCoverage.find((c) => c.category === "first_aid");
      const safeguarding = result.teamCoverage.find((c) => c.category === "safeguarding");
      const firstAidIdx = result.teamCoverage.indexOf(firstAid!);
      const safeguardingIdx = result.teamCoverage.indexOf(safeguarding!);
      expect(firstAidIdx).toBeLessThan(safeguardingIdx);
    });
  });

  // ── Expiry warnings ───────────────────────────────────────────────────────

  describe("expiry warnings", () => {
    it("flags expired training", () => {
      const staff = makeStaff({
        trainings: [makeTraining({ expiryDate: makeDate(10), status: "expired", courseName: "First Aid" })],
      });
      const result = analyseTrainingCompliance([staff]);
      const warning = result.expiryWarnings.find((w) => w.courseName === "First Aid");
      expect(warning).toBeDefined();
      expect(warning!.severity).toBe("expired");
      expect(warning!.daysUntilExpiry).toBeLessThan(0);
    });

    it("flags imminent expiry (within 30 days)", () => {
      const staff = makeStaff({
        trainings: [makeTraining({ expiryDate: futureDate(15), courseName: "Fire Safety" })],
      });
      const result = analyseTrainingCompliance([staff]);
      const warning = result.expiryWarnings.find((w) => w.courseName === "Fire Safety");
      expect(warning).toBeDefined();
      expect(warning!.severity).toBe("imminent");
    });

    it("flags upcoming expiry (31-60 days)", () => {
      const staff = makeStaff({
        trainings: [makeTraining({ expiryDate: futureDate(45), courseName: "Safeguarding" })],
      });
      const result = analyseTrainingCompliance([staff]);
      const warning = result.expiryWarnings.find((w) => w.courseName === "Safeguarding");
      expect(warning).toBeDefined();
      expect(warning!.severity).toBe("upcoming");
    });

    it("no warning for expiry >60 days out", () => {
      const staff = makeStaff({
        trainings: [makeTraining({ expiryDate: futureDate(90) })],
      });
      const result = analyseTrainingCompliance([staff]);
      expect(result.expiryWarnings).toHaveLength(0);
    });

    it("sorted by days until expiry (most urgent first)", () => {
      const staff = makeStaff({
        trainings: [
          makeTraining({ expiryDate: futureDate(50), courseName: "Later" }),
          makeTraining({ expiryDate: futureDate(10), courseName: "Sooner" }),
          makeTraining({ expiryDate: makeDate(5), courseName: "Already expired" }),
        ],
      });
      const result = analyseTrainingCompliance([staff]);
      expect(result.expiryWarnings[0].courseName).toBe("Already expired");
      expect(result.expiryWarnings[1].courseName).toBe("Sooner");
    });
  });

  // ── Alerts ────────────────────────────────────────────────────────────────

  describe("alerts", () => {
    it("critical alert for expired training", () => {
      const staff = makeStaff({
        trainings: [makeTraining({ status: "expired", mandatory: true })],
      });
      const result = analyseTrainingCompliance([staff]);
      const critical = result.alerts.find((a) => a.severity === "critical" && a.category === "expired");
      expect(critical).toBeDefined();
      expect(critical!.regulation).toContain("Reg 33");
    });

    it("high alert for mandatory gaps", () => {
      const staff = makeStaff({
        trainings: [makeTraining({ status: "not_started", mandatory: true })],
      });
      const result = analyseTrainingCompliance([staff]);
      const high = result.alerts.find((a) => a.severity === "high" && a.category === "mandatory");
      expect(high).toBeDefined();
    });

    it("medium alert for low team coverage (<80%)", () => {
      const staff1 = makeStaff({ staffId: "s1", trainings: [makeTraining({ category: "medication", mandatory: true, status: "completed" })] });
      const staff2 = makeStaff({ staffId: "s2", trainings: [makeTraining({ category: "medication", mandatory: true, status: "not_started" })] });
      const staff3 = makeStaff({ staffId: "s3", trainings: [makeTraining({ category: "medication", mandatory: true, status: "not_started" })] });
      const result = analyseTrainingCompliance([staff1, staff2, staff3]);
      const medium = result.alerts.find((a) => a.category === "coverage");
      expect(medium).toBeDefined();
    });

    it("no coverage alert when all above 80%", () => {
      const staff1 = makeStaff({ staffId: "s1", trainings: [makeTraining({ category: "safeguarding", mandatory: true, status: "completed" })] });
      const staff2 = makeStaff({ staffId: "s2", trainings: [makeTraining({ category: "safeguarding", mandatory: true, status: "completed" })] });
      const result = analyseTrainingCompliance([staff1, staff2]);
      const coverageAlert = result.alerts.find((a) => a.category === "coverage");
      expect(coverageAlert).toBeUndefined();
    });

    it("alerts sorted by severity", () => {
      const staff = makeStaff({
        trainings: [
          makeTraining({ status: "expired", mandatory: true, category: "first_aid" }),
          makeTraining({ status: "not_started", mandatory: true, category: "safeguarding" }),
        ],
      });
      const result = analyseTrainingCompliance([staff]);
      expect(result.alerts.length).toBeGreaterThanOrEqual(2);
      expect(result.alerts[0].severity).toBe("critical");
    });
  });

  // ── Qualification overview ────────────────────────────────────────────────

  describe("qualification overview", () => {
    it("counts L3 completions", () => {
      const staff1 = makeStaff({ staffId: "s1", role: "residential", qualifications: [{ id: "q1", name: "L3", level: "L3", status: "completed" }] });
      const staff2 = makeStaff({ staffId: "s2", role: "residential", qualifications: [{ id: "q2", name: "L3", level: "L3", status: "in_progress" }] });
      const result = analyseTrainingCompliance([staff1, staff2]);
      expect(result.qualificationOverview.l3Completed).toBe(1);
      expect(result.qualificationOverview.l3InProgress).toBe(1);
    });

    it("counts L5 for seniors/RM", () => {
      const staff1 = makeStaff({ staffId: "s1", role: "senior", qualifications: [{ id: "q1", name: "L5", level: "L5", status: "completed" }] });
      const staff2 = makeStaff({ staffId: "s2", role: "registered_manager", qualifications: [{ id: "q2", name: "L5", level: "L5", status: "in_progress" }] });
      const result = analyseTrainingCompliance([staff1, staff2]);
      expect(result.qualificationOverview.l5Required).toBe(2);
      expect(result.qualificationOverview.l5Completed).toBe(1);
      expect(result.qualificationOverview.l5InProgress).toBe(1);
    });
  });

  // ── Overall compliance ────────────────────────────────────────────────────

  describe("overall compliance", () => {
    it("100% when all staff fully compliant", () => {
      const staff1 = makeStaff({ staffId: "s1" });
      const staff2 = makeStaff({ staffId: "s2" });
      const result = analyseTrainingCompliance([staff1, staff2]);
      expect(result.overallCompliancePercent).toBe(100);
      expect(result.fullyCompliant).toBe(2);
      expect(result.withGaps).toBe(0);
    });

    it("calculates average compliance", () => {
      const staff1 = makeStaff({ staffId: "s1", trainings: [makeTraining({ mandatory: true, status: "completed" })] }); // 100%
      const staff2 = makeStaff({ staffId: "s2", trainings: [makeTraining({ mandatory: true, status: "completed" }), makeTraining({ mandatory: true, status: "not_started" })] }); // 50%
      const result = analyseTrainingCompliance([staff1, staff2]);
      expect(result.overallCompliancePercent).toBe(75); // (100 + 50) / 2
    });
  });

  // ── Regulatory status ─────────────────────────────────────────────────────

  describe("regulatory status", () => {
    it("compliant when no issues", () => {
      const staff = makeStaff();
      const result = analyseTrainingCompliance([staff]);
      expect(result.regulatoryStatus.compliant).toBe(true);
    });

    it("non-compliant with expired training", () => {
      const staff = makeStaff({
        trainings: [makeTraining({ status: "expired", mandatory: true })],
      });
      const result = analyseTrainingCompliance([staff]);
      expect(result.regulatoryStatus.compliant).toBe(false);
      expect(result.regulatoryStatus.issues.some((i) => i.includes("expired"))).toBe(true);
    });

    it("records strength for 100% compliance", () => {
      const staff = makeStaff();
      const result = analyseTrainingCompliance([staff]);
      expect(result.regulatoryStatus.strengths.some((s) => s.includes("100%"))).toBe(true);
    });

    it("records strength for no expired certs", () => {
      const staff = makeStaff();
      const result = analyseTrainingCompliance([staff]);
      expect(result.regulatoryStatus.strengths.some((s) => s.includes("No expired"))).toBe(true);
    });
  });
});
