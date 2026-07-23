// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Shift Pattern & Staff Deployment Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateDeploymentIntelligence,
  evaluateFatigueRisk,
  evaluateKeyWorkerAvailability,
  analyseShiftCoverage,
  calculateShiftDurationHours,
  calculateRestGapHours,
  getComplianceRatingLabel,
  getFatigueRiskLabel,
  getShiftTypeLabel,
} from "../shift-intelligence-engine";
import type {
  ShiftRecord,
  StaffProfile,
  HomeShiftRequirements,
} from "../shift-intelligence-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const makeStaff = (overrides: Partial<StaffProfile> = {}): StaffProfile => ({
  id: "staff-1",
  name: "Sarah Johnson",
  role: "residential_child_worker",
  contractedHoursPerWeek: 37.5,
  isAgency: false,
  keyWorkerFor: ["child-1"],
  qualifications: ["Level 3 Diploma"],
  canWorkAlone: false,
  maxConsecutiveDays: 5,
  ...overrides,
});

const makeShift = (overrides: Partial<ShiftRecord> = {}): ShiftRecord => ({
  id: "shift-1",
  staffId: "staff-1",
  staffName: "Sarah Johnson",
  role: "residential_child_worker",
  shiftType: "day",
  date: "2026-05-12",
  startTime: "07:00",
  endTime: "15:00",
  isAgency: false,
  childrenPresent: 3,
  ...overrides,
});

const makeRequirements = (overrides: Partial<HomeShiftRequirements> = {}): HomeShiftRequirements => ({
  homeId: "oak-house",
  registeredCapacity: 4,
  currentOccupancy: 3,
  minimumStaffDay: 2,
  minimumStaffEvening: 2,
  minimumStaffNight: 1,
  requireSeniorOnShift: true,
  maximumAgencyPercentage: 30,
  keyWorkerContactMinDaysPerWeek: 3,
  ...overrides,
});

// ── calculateShiftDurationHours ────────────────────────────────────────────

describe("calculateShiftDurationHours", () => {
  it("calculates a standard day shift (07:00 - 15:00)", () => {
    expect(calculateShiftDurationHours("07:00", "15:00")).toBe(8);
  });

  it("calculates an evening shift (14:00 - 22:00)", () => {
    expect(calculateShiftDurationHours("14:00", "22:00")).toBe(8);
  });

  it("calculates a long day (07:00 - 21:30)", () => {
    expect(calculateShiftDurationHours("07:00", "21:30")).toBe(14.5);
  });

  it("calculates an overnight shift crossing midnight (22:00 - 07:00)", () => {
    expect(calculateShiftDurationHours("22:00", "07:00")).toBe(9);
  });

  it("calculates a waking night (21:00 - 08:00)", () => {
    expect(calculateShiftDurationHours("21:00", "08:00")).toBe(11);
  });

  it("handles midnight start (00:00 - 08:00)", () => {
    expect(calculateShiftDurationHours("00:00", "08:00")).toBe(8);
  });
});

// ── calculateRestGapHours ──────────────────────────────────────────────────

describe("calculateRestGapHours", () => {
  it("calculates rest gap between consecutive day shifts", () => {
    const gap = calculateRestGapHours("15:00", "2026-05-12", "07:00", "2026-05-13");
    expect(gap).toBe(16);
  });

  it("identifies insufficient rest gap (evening to early morning)", () => {
    const gap = calculateRestGapHours("22:00", "2026-05-12", "07:00", "2026-05-13");
    expect(gap).toBe(9);
  });

  it("calculates a full 24hr gap", () => {
    const gap = calculateRestGapHours("15:00", "2026-05-12", "15:00", "2026-05-13");
    expect(gap).toBe(24);
  });
});

// ── evaluateFatigueRisk ────────────────────────────────────────────────────

describe("evaluateFatigueRisk", () => {
  it("returns low risk for a normal 37.5hr week", () => {
    const staff = makeStaff();
    const shifts: ShiftRecord[] = [
      makeShift({ date: "2026-05-12", startTime: "07:00", endTime: "14:30" }),
      makeShift({ date: "2026-05-13", startTime: "07:00", endTime: "14:30" }),
      makeShift({ date: "2026-05-14", startTime: "07:00", endTime: "14:30" }),
      makeShift({ date: "2026-05-15", startTime: "07:00", endTime: "14:30" }),
      makeShift({ date: "2026-05-16", startTime: "07:00", endTime: "14:30" }),
    ];

    const result = evaluateFatigueRisk(staff, shifts, "2026-05-12");
    expect(result.riskLevel).toBe("low");
    expect(result.totalHoursThisWeek).toBe(37.5);
    expect(result.consecutiveDaysWorked).toBe(5);
    expect(result.breachesIdentified).toHaveLength(0);
  });

  it("flags high risk when exceeding 48hr weekly limit", () => {
    const staff = makeStaff();
    const shifts: ShiftRecord[] = [
      makeShift({ date: "2026-05-12", startTime: "07:00", endTime: "19:00" }), // 12hrs
      makeShift({ date: "2026-05-13", startTime: "07:00", endTime: "19:00" }),
      makeShift({ date: "2026-05-14", startTime: "07:00", endTime: "19:00" }),
      makeShift({ date: "2026-05-15", startTime: "07:00", endTime: "19:00" }),
      makeShift({ date: "2026-05-16", startTime: "07:00", endTime: "07:00" }), // 24hrs (double)
    ];

    const result = evaluateFatigueRisk(staff, shifts, "2026-05-12");
    expect(result.riskLevel).toBe("critical");
    expect(result.totalHoursThisWeek).toBeGreaterThan(48);
    expect(result.breachesIdentified.length).toBeGreaterThan(0);
    expect(result.breachesIdentified.some((b) => b.includes("Working Time breach"))).toBe(true);
  });

  it("flags insufficient rest period below 11 hours", () => {
    const staff = makeStaff();
    const shifts: ShiftRecord[] = [
      makeShift({ date: "2026-05-12", startTime: "14:00", endTime: "22:00" }),
      makeShift({ date: "2026-05-13", startTime: "07:00", endTime: "15:00" }), // Only 9hr rest
    ];

    const result = evaluateFatigueRisk(staff, shifts, "2026-05-12");
    expect(result.shortestRestGapHours).toBe(9);
    expect(result.breachesIdentified.some((b) => b.includes("Rest period breach"))).toBe(true);
  });

  it("flags consecutive days exceeding limit", () => {
    const staff = makeStaff({ maxConsecutiveDays: 5 });
    const shifts: ShiftRecord[] = [
      makeShift({ date: "2026-05-11", startTime: "07:00", endTime: "15:00" }),
      makeShift({ date: "2026-05-12", startTime: "07:00", endTime: "15:00" }),
      makeShift({ date: "2026-05-13", startTime: "07:00", endTime: "15:00" }),
      makeShift({ date: "2026-05-14", startTime: "07:00", endTime: "15:00" }),
      makeShift({ date: "2026-05-15", startTime: "07:00", endTime: "15:00" }),
      makeShift({ date: "2026-05-16", startTime: "07:00", endTime: "15:00" }),
    ];

    const result = evaluateFatigueRisk(staff, shifts, "2026-05-11");
    expect(result.consecutiveDaysWorked).toBe(6);
    expect(result.breachesIdentified.some((b) => b.includes("Consecutive days breach"))).toBe(true);
  });

  it("ignores cancelled shifts", () => {
    const staff = makeStaff();
    const shifts: ShiftRecord[] = [
      makeShift({ date: "2026-05-12", startTime: "07:00", endTime: "15:00" }),
      makeShift({ date: "2026-05-13", startTime: "07:00", endTime: "15:00", cancelled: true }),
    ];

    const result = evaluateFatigueRisk(staff, shifts, "2026-05-12");
    expect(result.totalHoursThisWeek).toBe(8);
    expect(result.consecutiveDaysWorked).toBe(1);
  });

  it("generates appropriate recommendation for critical risk", () => {
    const staff = makeStaff({ name: "Tom Watson" });
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "staff-1", date: "2026-05-12", startTime: "07:00", endTime: "21:00" }), // 14hrs
      makeShift({ staffId: "staff-1", date: "2026-05-13", startTime: "06:00", endTime: "20:00" }), // 14hrs, 9hr rest
      makeShift({ staffId: "staff-1", date: "2026-05-14", startTime: "07:00", endTime: "21:00" }), // 14hrs
      makeShift({ staffId: "staff-1", date: "2026-05-15", startTime: "06:00", endTime: "20:00" }), // 14hrs
      makeShift({ staffId: "staff-1", date: "2026-05-16", startTime: "07:00", endTime: "21:00" }), // 14hrs
    ];

    const result = evaluateFatigueRisk(staff, shifts, "2026-05-12");
    expect(result.riskLevel).toBe("critical");
    expect(result.recommendation).toContain("Tom Watson");
    expect(result.recommendation).toContain("must not be rostered");
  });
});

// ── evaluateKeyWorkerAvailability ──────────────────────────────────────────

describe("evaluateKeyWorkerAvailability", () => {
  it("returns compliant when KW meets minimum contact days", () => {
    const staff = [makeStaff({ id: "kw-1", name: "Sarah", keyWorkerFor: ["child-1"] })];
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "kw-1", date: "2026-05-12" }),
      makeShift({ staffId: "kw-1", date: "2026-05-13" }),
      makeShift({ staffId: "kw-1", date: "2026-05-14" }),
    ];
    const children = [{ id: "child-1", name: "Alex" }];
    const requirements = makeRequirements({ keyWorkerContactMinDaysPerWeek: 3 });

    const result = evaluateKeyWorkerAvailability(staff, shifts, children, requirements);
    expect(result).toHaveLength(1);
    expect(result[0].isCompliant).toBe(true);
    expect(result[0].daysOnShiftTogether).toBe(3);
    expect(result[0].gapDays).toBe(0);
  });

  it("returns non-compliant when KW below minimum days", () => {
    const staff = [makeStaff({ id: "kw-1", name: "Sarah", keyWorkerFor: ["child-1"] })];
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "kw-1", date: "2026-05-12" }),
    ];
    const children = [{ id: "child-1", name: "Alex" }];
    const requirements = makeRequirements({ keyWorkerContactMinDaysPerWeek: 3 });

    const result = evaluateKeyWorkerAvailability(staff, shifts, children, requirements);
    expect(result[0].isCompliant).toBe(false);
    expect(result[0].daysOnShiftTogether).toBe(1);
    expect(result[0].gapDays).toBe(2);
    expect(result[0].concern).toContain("Sarah");
    expect(result[0].concern).toContain("Alex");
  });

  it("handles multiple children with different Key Workers", () => {
    const staff = [
      makeStaff({ id: "kw-1", name: "Sarah", keyWorkerFor: ["child-1"] }),
      makeStaff({ id: "kw-2", name: "Mike", keyWorkerFor: ["child-2"] }),
    ];
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "kw-1", date: "2026-05-12" }),
      makeShift({ staffId: "kw-1", date: "2026-05-13" }),
      makeShift({ staffId: "kw-1", date: "2026-05-14" }),
      makeShift({ staffId: "kw-2", date: "2026-05-12" }),
    ];
    const children = [
      { id: "child-1", name: "Alex" },
      { id: "child-2", name: "Jordan" },
    ];
    const requirements = makeRequirements({ keyWorkerContactMinDaysPerWeek: 3 });

    const result = evaluateKeyWorkerAvailability(staff, shifts, children, requirements);
    expect(result).toHaveLength(2);
    expect(result[0].isCompliant).toBe(true);
    expect(result[1].isCompliant).toBe(false);
  });

  it("skips children without assigned Key Worker", () => {
    const staff = [makeStaff({ id: "kw-1", keyWorkerFor: ["child-1"] })];
    const shifts: ShiftRecord[] = [makeShift({ staffId: "kw-1", date: "2026-05-12" })];
    const children = [
      { id: "child-1", name: "Alex" },
      { id: "child-2", name: "Jordan" }, // no KW assigned
    ];
    const requirements = makeRequirements();

    const result = evaluateKeyWorkerAvailability(staff, shifts, children, requirements);
    expect(result).toHaveLength(1); // only child-1 included
  });
});

// ── analyseShiftCoverage ───────────────────────────────────────────────────

describe("analyseShiftCoverage", () => {
  it("marks shift as covered when meeting all requirements", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "s1", staffName: "Sarah", role: "team_leader", shiftType: "day", date: "2026-05-12" }),
      makeShift({ staffId: "s2", staffName: "Mike", role: "residential_child_worker", shiftType: "day", date: "2026-05-12" }),
    ];
    const requirements = makeRequirements({ minimumStaffDay: 2, requireSeniorOnShift: true });

    const result = analyseShiftCoverage(shifts, requirements);
    expect(result).toHaveLength(1);
    expect(result[0].isCovered).toBe(true);
    expect(result[0].actualStaff).toBe(2);
    expect(result[0].seniorPresent).toBe(true);
    expect(result[0].concerns).toHaveLength(0);
  });

  it("flags understaffed when below minimum", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "s1", role: "team_leader", shiftType: "day", date: "2026-05-12" }),
    ];
    const requirements = makeRequirements({ minimumStaffDay: 2 });

    const result = analyseShiftCoverage(shifts, requirements);
    expect(result[0].isCovered).toBe(false);
    expect(result[0].concerns).toContain("understaffed");
  });

  it("flags lone working", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "s1", role: "team_leader", shiftType: "evening", date: "2026-05-12" }),
    ];
    const requirements = makeRequirements({ minimumStaffEvening: 2, currentOccupancy: 3 });

    const result = analyseShiftCoverage(shifts, requirements);
    expect(result[0].concerns).toContain("lone_working");
  });

  it("flags no senior cover", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "s1", role: "residential_child_worker", shiftType: "day", date: "2026-05-12" }),
      makeShift({ staffId: "s2", role: "residential_child_worker", shiftType: "day", date: "2026-05-12" }),
    ];
    const requirements = makeRequirements({ requireSeniorOnShift: true });

    const result = analyseShiftCoverage(shifts, requirements);
    expect(result[0].concerns).toContain("no_senior_cover");
  });

  it("flags excessive agency usage", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "s1", role: "team_leader", shiftType: "day", date: "2026-05-12", isAgency: false }),
      makeShift({ staffId: "s2", role: "agency", shiftType: "day", date: "2026-05-12", isAgency: true }),
      makeShift({ staffId: "s3", role: "agency", shiftType: "day", date: "2026-05-12", isAgency: true }),
    ];
    const requirements = makeRequirements({ minimumStaffDay: 2, maximumAgencyPercentage: 30 });

    const result = analyseShiftCoverage(shifts, requirements);
    expect(result[0].agencyPercentage).toBeCloseTo(67, 0);
    expect(result[0].concerns).toContain("excessive_agency");
  });

  it("ignores cancelled shifts", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "s1", role: "team_leader", shiftType: "day", date: "2026-05-12" }),
      makeShift({ staffId: "s2", role: "residential_child_worker", shiftType: "day", date: "2026-05-12", cancelled: true }),
    ];
    const requirements = makeRequirements({ minimumStaffDay: 2 });

    const result = analyseShiftCoverage(shifts, requirements);
    expect(result[0].actualStaff).toBe(1); // cancelled shift not counted
  });

  it("analyses night shifts with correct minimum", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "s1", role: "waking_night_staff", shiftType: "waking_night", date: "2026-05-12" }),
    ];
    const requirements = makeRequirements({ minimumStaffNight: 1, requireSeniorOnShift: false });

    const result = analyseShiftCoverage(shifts, requirements);
    expect(result[0].isCovered).toBe(true);
    expect(result[0].requiredStaff).toBe(1);
  });

  it("groups shifts correctly by date and type", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ staffId: "s1", shiftType: "day", date: "2026-05-12" }),
      makeShift({ staffId: "s2", shiftType: "day", date: "2026-05-12" }),
      makeShift({ staffId: "s3", shiftType: "evening", date: "2026-05-12" }),
      makeShift({ staffId: "s4", shiftType: "evening", date: "2026-05-12" }),
      makeShift({ staffId: "s5", shiftType: "day", date: "2026-05-13" }),
    ];
    const requirements = makeRequirements({ requireSeniorOnShift: false });

    const result = analyseShiftCoverage(shifts, requirements);
    expect(result).toHaveLength(3); // day 12th, evening 12th, day 13th
  });
});

// ── generateDeploymentIntelligence ─────────────────────────────────────────

describe("generateDeploymentIntelligence", () => {
  const baseStaff: StaffProfile[] = [
    makeStaff({ id: "s1", name: "Sarah Johnson", role: "team_leader", keyWorkerFor: ["child-1"] }),
    makeStaff({ id: "s2", name: "Mike Chen", role: "residential_child_worker", keyWorkerFor: ["child-2"] }),
    makeStaff({ id: "s3", name: "Lisa Williams", role: "residential_child_worker", keyWorkerFor: ["child-3"] }),
    makeStaff({ id: "s4", name: "David Brown", role: "senior_rcw", keyWorkerFor: [] }),
  ];

  const baseChildren = [
    { id: "child-1", name: "Alex" },
    { id: "child-2", name: "Jordan" },
    { id: "child-3", name: "Morgan" },
  ];

  it("produces compliant result for well-staffed week", () => {
    const shifts: ShiftRecord[] = [];
    // 5 days with 2 staff (including senior) on each day and evening
    // Staff rotate so nobody exceeds weekly hours
    for (let d = 12; d <= 16; d++) {
      const date = `2026-05-${d}`;
      shifts.push(
        makeShift({ id: `d${d}-1`, staffId: "s1", staffName: "Sarah Johnson", role: "team_leader", shiftType: "day", date, startTime: "07:00", endTime: "15:00" }),
        makeShift({ id: `d${d}-2`, staffId: "s2", staffName: "Mike Chen", role: "residential_child_worker", shiftType: "day", date, startTime: "07:00", endTime: "15:00" }),
        makeShift({ id: `e${d}-1`, staffId: "s3", staffName: "Lisa Williams", role: "residential_child_worker", shiftType: "evening", date, startTime: "14:00", endTime: "22:00" }),
        makeShift({ id: `e${d}-2`, staffId: "s4", staffName: "David Brown", role: "senior_rcw", shiftType: "evening", date, startTime: "14:00", endTime: "22:00" }),
      );
    }

    const requirements = makeRequirements({
      minimumStaffDay: 2,
      minimumStaffEvening: 2,
      requireSeniorOnShift: true,
      keyWorkerContactMinDaysPerWeek: 3,
    });

    const result = generateDeploymentIntelligence(
      shifts, baseStaff, baseChildren, requirements, "2026-05-12", "2026-05-16",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.coveragePercentage).toBe(100);
    expect(result.complianceRating).toBe("compliant");
    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.uncoveredShifts).toBe(0);
  });

  it("detects multiple concerns in poorly-staffed scenario", () => {
    const shifts: ShiftRecord[] = [
      // Day with only 1 RCW (no senior)
      makeShift({ id: "d1", staffId: "s2", staffName: "Mike Chen", role: "residential_child_worker", shiftType: "day", date: "2026-05-12", startTime: "07:00", endTime: "15:00" }),
      // Evening lone working
      makeShift({ id: "e1", staffId: "s3", staffName: "Lisa Williams", role: "residential_child_worker", shiftType: "evening", date: "2026-05-12", startTime: "14:00", endTime: "22:00" }),
    ];

    const requirements = makeRequirements({
      minimumStaffDay: 2,
      minimumStaffEvening: 2,
      requireSeniorOnShift: true,
      currentOccupancy: 3,
    });

    const result = generateDeploymentIntelligence(
      shifts, baseStaff, baseChildren, requirements, "2026-05-12", "2026-05-16",
    );

    expect(result.complianceRating).not.toBe("compliant");
    expect(result.uncoveredShifts).toBeGreaterThan(0);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.immediateActions.length).toBeGreaterThan(0);
  });

  it("calculates agency usage percentage correctly", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ id: "d1", staffId: "s1", staffName: "Sarah", role: "team_leader", shiftType: "day", date: "2026-05-12", isAgency: false }),
      makeShift({ id: "d2", staffId: "a1", staffName: "Agency Worker", role: "agency", shiftType: "day", date: "2026-05-12", isAgency: true }),
    ];

    const requirements = makeRequirements({ requireSeniorOnShift: false });

    const result = generateDeploymentIntelligence(
      shifts, baseStaff, baseChildren, requirements, "2026-05-12", "2026-05-12",
    );

    expect(result.agencyUsagePercentage).toBe(50);
  });

  it("includes regulatory links when concerns present", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ id: "d1", staffId: "s2", staffName: "Mike", role: "residential_child_worker", shiftType: "day", date: "2026-05-12" }),
    ];

    const requirements = makeRequirements({
      minimumStaffDay: 2,
      requireSeniorOnShift: true,
      currentOccupancy: 3,
    });

    const result = generateDeploymentIntelligence(
      shifts, baseStaff, baseChildren, requirements, "2026-05-12", "2026-05-12",
    );

    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 32"))).toBe(true);
  });

  it("handles empty shift data gracefully", () => {
    const requirements = makeRequirements();

    const result = generateDeploymentIntelligence(
      [], baseStaff, baseChildren, requirements, "2026-05-12", "2026-05-16",
    );

    expect(result.totalShiftsAnalysed).toBe(0);
    // No shift analysed means coverage is unmeasured, not fully covered
    expect(result.coveragePercentage).toBeNull();
    expect(result.seniorCoveragePercentage).toBeNull();
    expect(result.agencyUsagePercentage).toBeNull();
    expect(result.averageStaffPerShift).toBeNull();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("populates key worker compliance data", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ id: "d1", staffId: "s1", staffName: "Sarah", role: "team_leader", shiftType: "day", date: "2026-05-12" }),
      makeShift({ id: "d2", staffId: "s1", staffName: "Sarah", role: "team_leader", shiftType: "day", date: "2026-05-13" }),
      makeShift({ id: "d3", staffId: "s1", staffName: "Sarah", role: "team_leader", shiftType: "day", date: "2026-05-14" }),
    ];

    const requirements = makeRequirements({ keyWorkerContactMinDaysPerWeek: 3, requireSeniorOnShift: false });

    const result = generateDeploymentIntelligence(
      shifts, baseStaff, baseChildren, requirements, "2026-05-12", "2026-05-16",
    );

    // Sarah (s1) is KW for child-1 and was on 3 days — compliant
    const alexKw = result.keyWorkerAvailability.find((k) => k.childId === "child-1");
    expect(alexKw?.isCompliant).toBe(true);
  });

  it("calculates senior coverage percentage", () => {
    const shifts: ShiftRecord[] = [
      makeShift({ id: "d1", staffId: "s1", role: "team_leader", shiftType: "day", date: "2026-05-12" }),
      makeShift({ id: "d2", staffId: "s2", role: "residential_child_worker", shiftType: "day", date: "2026-05-12" }),
      makeShift({ id: "e1", staffId: "s3", role: "residential_child_worker", shiftType: "evening", date: "2026-05-12" }),
      makeShift({ id: "e2", staffId: "s2", role: "residential_child_worker", shiftType: "evening", date: "2026-05-12" }),
    ];

    const requirements = makeRequirements({ requireSeniorOnShift: true });

    const result = generateDeploymentIntelligence(
      shifts, baseStaff, baseChildren, requirements, "2026-05-12", "2026-05-12",
    );

    // 2 shift groups: day (senior present) and evening (no senior)
    expect(result.seniorCoveragePercentage).toBe(50);
  });
});

// ── Utility Label Functions ────────────────────────────────────────────────

describe("utility label functions", () => {
  it("getComplianceRatingLabel returns correct labels", () => {
    expect(getComplianceRatingLabel("compliant")).toBe("Compliant");
    expect(getComplianceRatingLabel("minor_concerns")).toBe("Minor Concerns");
    expect(getComplianceRatingLabel("significant_concerns")).toBe("Significant Concerns");
    expect(getComplianceRatingLabel("non_compliant")).toBe("Non-Compliant");
  });

  it("getFatigueRiskLabel returns correct labels", () => {
    expect(getFatigueRiskLabel("low")).toBe("Low Risk");
    expect(getFatigueRiskLabel("moderate")).toBe("Moderate Risk");
    expect(getFatigueRiskLabel("high")).toBe("High Risk");
    expect(getFatigueRiskLabel("critical")).toBe("Critical Risk");
  });

  it("getShiftTypeLabel returns correct labels", () => {
    expect(getShiftTypeLabel("day")).toBe("Day Shift");
    expect(getShiftTypeLabel("evening")).toBe("Evening Shift");
    expect(getShiftTypeLabel("night")).toBe("Night Shift");
    expect(getShiftTypeLabel("waking_night")).toBe("Waking Night");
    expect(getShiftTypeLabel("sleep_in")).toBe("Sleep-In");
    expect(getShiftTypeLabel("long_day")).toBe("Long Day");
    expect(getShiftTypeLabel("split")).toBe("Split Shift");
  });
});
