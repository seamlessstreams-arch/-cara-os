// ══════════════════════════════════════════════════════════════════════════════
// Workforce & Rota Intelligence Engine — Tests
//
// Covers: shift safety analysis, workforce compliance, DBS checking,
// qualification requirements, training deadlines, supervision tracking,
// agency reliance, lone working detection.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  analyzeShiftSafety,
  evaluateWorkforceCompliance,
  calculateWorkforceMetrics,
  getRoleLabel,
  getComplianceLabel,
} from "../workforce-engine";
import type {
  StaffMember,
  Shift,
  ChildOnShift,
  ShiftRequirement,
} from "../workforce-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

function makeStaff(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: "staff-001",
    name: "Emma Thompson",
    role: "support_worker",
    homeId: "home-001",
    startDate: "2024-01-15T00:00:00Z",
    contractedHours: 37.5,
    isAgency: false,
    dbsCheckDate: "2025-06-01T00:00:00Z",
    dbsClearanceLevel: "enhanced_barred",
    dbsOnUpdateService: true,
    qualificationLevel: 3,
    qualificationStatus: "achieved",
    mandatoryTraining: [
      { courseName: "Fire Safety", category: "mandatory", completedDate: "2026-01-15T00:00:00Z", expiryDate: "2027-01-15T00:00:00Z", status: "current" },
      { courseName: "Health & Safety", category: "mandatory", completedDate: "2026-02-01T00:00:00Z", expiryDate: "2027-02-01T00:00:00Z", status: "current" },
    ],
    supervisionDue: "2026-06-01T00:00:00Z",
    lastSupervision: "2026-04-20T00:00:00Z",
    firstAidCurrent: true,
    safeguardingTrainingDate: "2026-01-10T00:00:00Z",
    restraintTrainingDate: "2026-03-01T00:00:00Z",
    medicationTrainingDate: "2026-02-15T00:00:00Z",
    ...overrides,
  };
}

function makeShift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: "shift-001",
    date: "2026-05-17",
    shiftType: "day",
    startTime: "07:00",
    endTime: "15:00",
    staffId: "staff-001",
    staffName: "Emma Thompson",
    staffRole: "support_worker",
    homeId: "home-001",
    isAgency: false,
    isSleepIn: false,
    hoursWorked: 8,
    ...overrides,
  };
}

function makeChild(overrides: Partial<ChildOnShift> = {}): ChildOnShift {
  return {
    childId: "child-001",
    childName: "Child A",
    riskLevel: "medium",
    requiresOneToOne: false,
    medicalNeedsOnShift: false,
    ...overrides,
  };
}

function makeRequirement(overrides: Partial<ShiftRequirement> = {}): ShiftRequirement {
  return {
    homeId: "home-001",
    shiftType: "day",
    minimumStaff: 2,
    minimumSenior: 1,
    childrenExpected: 4,
    highRiskChildren: 1,
    oneToOneRequired: 0,
    sleepInRequired: false,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Shift Safety Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("analyzeShiftSafety", () => {
  it("marks safe shift with adequate staffing", () => {
    const shifts = [
      makeShift({ staffId: "s1", staffRole: "senior_support_worker" }),
      makeShift({ staffId: "s2", staffRole: "support_worker" }),
      makeShift({ staffId: "s3", staffRole: "support_worker" }),
    ];
    const children = [makeChild(), makeChild({ childId: "c2" }), makeChild({ childId: "c3" })];
    const req = makeRequirement({ minimumStaff: 2, minimumSenior: 1 });

    const result = analyzeShiftSafety(shifts, children, req);
    expect(result.isSafe).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.seniorPresent).toBe(true);
  });

  it("flags understaffed shift", () => {
    const shifts = [makeShift({ staffId: "s1" })];
    const children = [makeChild(), makeChild({ childId: "c2" })];
    const req = makeRequirement({ minimumStaff: 2 });

    const result = analyzeShiftSafety(shifts, children, req);
    expect(result.isSafe).toBe(false);
    expect(result.issues.some(i => i.includes("Understaffed"))).toBe(true);
  });

  it("flags lone working", () => {
    const shifts = [makeShift({ staffId: "s1" })];
    const children = [makeChild()];
    const req = makeRequirement({ minimumStaff: 1, minimumSenior: 0 });

    const result = analyzeShiftSafety(shifts, children, req);
    expect(result.loneWorking).toBe(true);
    expect(result.issues.some(i => i.includes("LONE WORKING"))).toBe(true);
  });

  it("flags missing senior on shift", () => {
    const shifts = [
      makeShift({ staffId: "s1", staffRole: "support_worker" }),
      makeShift({ staffId: "s2", staffRole: "support_worker" }),
    ];
    const children = [makeChild()];
    const req = makeRequirement({ minimumStaff: 2, minimumSenior: 1 });

    const result = analyzeShiftSafety(shifts, children, req);
    expect(result.seniorPresent).toBe(false);
    expect(result.issues.some(i => i.includes("No senior staff"))).toBe(true);
  });

  it("flags all-agency shift", () => {
    const shifts = [
      makeShift({ staffId: "s1", isAgency: true, staffRole: "senior_support_worker" }),
      makeShift({ staffId: "s2", isAgency: true }),
    ];
    const children = [makeChild()];
    const req = makeRequirement({ minimumStaff: 2, minimumSenior: 1 });

    const result = analyzeShiftSafety(shifts, children, req);
    expect(result.agencyReliance).toBe(100);
    expect(result.issues.some(i => i.includes("All staff on shift are agency"))).toBe(true);
  });

  it("flags insufficient cover for 1:1 children", () => {
    const shifts = [
      makeShift({ staffId: "s1", staffRole: "senior_support_worker" }),
      makeShift({ staffId: "s2" }),
    ];
    const children = [
      makeChild({ requiresOneToOne: true }),
      makeChild({ childId: "c2" }),
    ];
    const req = makeRequirement({ minimumStaff: 2, minimumSenior: 1, oneToOneRequired: 1 });

    const result = analyzeShiftSafety(shifts, children, req);
    expect(result.issues.some(i => i.includes("1:1"))).toBe(true);
  });

  it("flags high risk children with insufficient staff", () => {
    const shifts = [
      makeShift({ staffId: "s1", staffRole: "senior_support_worker" }),
    ];
    const children = [
      makeChild({ riskLevel: "high" }),
      makeChild({ childId: "c2", riskLevel: "very_high" }),
    ];
    const req = makeRequirement({ minimumStaff: 1, minimumSenior: 1, highRiskChildren: 2 });

    const result = analyzeShiftSafety(shifts, children, req);
    expect(result.issues.some(i => i.includes("high/very-high risk"))).toBe(true);
  });

  it("warns on high agency percentage", () => {
    const shifts = [
      makeShift({ staffId: "s1", staffRole: "senior_support_worker" }),
      makeShift({ staffId: "s2", isAgency: true }),
      makeShift({ staffId: "s3", isAgency: true }),
    ];
    const children = [makeChild()];
    const req = makeRequirement({ minimumStaff: 2, minimumSenior: 1 });

    const result = analyzeShiftSafety(shifts, children, req);
    expect(result.agencyReliance).toBe(67);
    expect(result.warnings.some(w => w.includes("agency staff"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Workforce Compliance Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateWorkforceCompliance", () => {
  const now = "2026-05-17T12:00:00Z";

  it("marks fully compliant staff as compliant", () => {
    const staff = [makeStaff()];
    const result = evaluateWorkforceCompliance(staff, "home-001", now);
    expect(result.overallStatus).toBe("compliant");
    expect(result.fullyCompliant).toBe(1);
  });

  it("flags expired DBS (not on update service)", () => {
    const staff = [makeStaff({
      dbsCheckDate: "2022-01-01T00:00:00Z", // >36 months ago
      dbsOnUpdateService: false,
    })];
    const result = evaluateWorkforceCompliance(staff, "home-001", now);
    expect(result.dbsOverdue).toBe(1);
    expect(result.overallStatus).toBe("non_compliant");
  });

  it("flags overdue DBS update service check", () => {
    const staff = [makeStaff({
      dbsCheckDate: "2025-01-01T00:00:00Z", // >12 months ago
      dbsOnUpdateService: true,
    })];
    const result = evaluateWorkforceCompliance(staff, "home-001", now);
    expect(result.dbsOverdue).toBe(1);
  });

  it("flags below Level 3 qualification", () => {
    const staff = [makeStaff({
      qualificationLevel: 2,
      qualificationStatus: "not_started",
    })];
    const result = evaluateWorkforceCompliance(staff, "home-001", now);
    expect(result.qualificationsBelowTarget).toBe(1);
    expect(result.byStaff[0].issues.some(i => i.includes("Level 3"))).toBe(true);
  });

  it("flags overdue mandatory training", () => {
    const staff = [makeStaff({
      mandatoryTraining: [
        { courseName: "Fire Safety", category: "mandatory", completedDate: "2024-01-01T00:00:00Z", expiryDate: "2025-01-01T00:00:00Z", status: "overdue" },
      ],
    })];
    const result = evaluateWorkforceCompliance(staff, "home-001", now);
    expect(result.trainingOverdue).toBe(1);
    expect(result.byStaff[0].trainingCurrent).toBe(false);
  });

  it("flags overdue supervision", () => {
    const staff = [makeStaff({
      lastSupervision: "2026-03-01T00:00:00Z", // >42 days ago from May 17
    })];
    const result = evaluateWorkforceCompliance(staff, "home-001", now);
    expect(result.supervisionOverdue).toBe(1);
    expect(result.byStaff[0].supervisionCurrent).toBe(false);
  });

  it("flags no supervision on record", () => {
    const staff = [makeStaff({ lastSupervision: undefined })];
    const result = evaluateWorkforceCompliance(staff, "home-001", now);
    expect(result.supervisionOverdue).toBe(1);
  });

  it("flags expired safeguarding training", () => {
    const staff = [makeStaff({
      safeguardingTrainingDate: "2025-01-01T00:00:00Z", // >12 months ago
    })];
    const result = evaluateWorkforceCompliance(staff, "home-001", now);
    expect(result.byStaff[0].trainingCurrent).toBe(false);
  });

  it("flags no safeguarding training", () => {
    const staff = [makeStaff({ safeguardingTrainingDate: undefined })];
    const result = evaluateWorkforceCompliance(staff, "home-001", now);
    expect(result.byStaff[0].issues.some(i => i.includes("No safeguarding training"))).toBe(true);
  });

  it("flags high agency percentage", () => {
    const staff = [
      makeStaff({ id: "s1", isAgency: true }),
      makeStaff({ id: "s2", isAgency: true }),
      makeStaff({ id: "s3", isAgency: false }),
    ];
    const result = evaluateWorkforceCompliance(staff, "home-001", now);
    expect(result.agencyPercentage).toBe(67);
    expect(result.issues.some(i => i.includes("Agency staff"))).toBe(true);
  });

  it("marks critical when 2+ DBS overdue", () => {
    const staff = [
      makeStaff({ id: "s1", dbsCheckDate: "2022-01-01T00:00:00Z", dbsOnUpdateService: false }),
      makeStaff({ id: "s2", dbsCheckDate: "2022-06-01T00:00:00Z", dbsOnUpdateService: false }),
    ];
    const result = evaluateWorkforceCompliance(staff, "home-001", now);
    expect(result.overallStatus).toBe("critical");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateWorkforceMetrics", () => {
  const now = "2026-05-17T12:00:00Z";

  it("calculates staff composition", () => {
    const staff = [
      makeStaff({ id: "s1", isAgency: false }),
      makeStaff({ id: "s2", isAgency: false }),
      makeStaff({ id: "s3", isAgency: true }),
    ];
    const result = calculateWorkforceMetrics(staff, [], "home-001", now);
    expect(result.totalStaff).toBe(3);
    expect(result.permanentStaff).toBe(2);
    expect(result.agencyStaff).toBe(1);
    expect(result.agencyPercentage).toBe(33);
  });

  it("calculates qualification metrics", () => {
    const staff = [
      makeStaff({ id: "s1", qualificationLevel: 5 }),
      makeStaff({ id: "s2", qualificationLevel: 3 }),
      makeStaff({ id: "s3", qualificationLevel: 2 }),
    ];
    const result = calculateWorkforceMetrics(staff, [], "home-001", now);
    expect(result.averageQualificationLevel).toBeCloseTo(3.3, 1);
    expect(result.qualificationTargetMet).toBe(67); // 2 of 3 at Level 3+
  });

  it("calculates DBS compliance", () => {
    const staff = [
      makeStaff({ id: "s1", dbsCheckDate: "2025-06-01T00:00:00Z", dbsOnUpdateService: true }), // current
      makeStaff({ id: "s2", dbsCheckDate: "2024-01-01T00:00:00Z", dbsOnUpdateService: true }), // overdue
    ];
    const result = calculateWorkforceMetrics(staff, [], "home-001", now);
    expect(result.dbsCompliance).toBe(50);
  });

  it("calculates average tenure", () => {
    const staff = [
      makeStaff({ id: "s1", startDate: "2024-05-17T00:00:00Z", isAgency: false }), // 24 months
      makeStaff({ id: "s2", startDate: "2025-05-17T00:00:00Z", isAgency: false }), // 12 months
    ];
    const result = calculateWorkforceMetrics(staff, [], "home-001", now);
    expect(result.averageTenureMonths).toBe(18);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Helper functions", () => {
  it("getRoleLabel returns readable labels", () => {
    expect(getRoleLabel("registered_manager")).toBe("Registered Manager");
    expect(getRoleLabel("senior_support_worker")).toBe("Senior Support Worker");
    expect(getRoleLabel("agency_staff")).toBe("Agency Staff");
  });

  it("getComplianceLabel returns readable labels", () => {
    expect(getComplianceLabel("compliant")).toBe("Compliant");
    expect(getComplianceLabel("critical")).toBe("Critical");
    expect(getComplianceLabel("action_needed")).toBe("Action Needed");
  });
});
