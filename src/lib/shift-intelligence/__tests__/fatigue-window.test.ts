import { describe, it, expect } from "vitest";
import {
  evaluateFatigueRisk,
  calculateRestGapHours,
  type StaffProfile,
  type ShiftRecord,
} from "../shift-intelligence-engine";

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

/** Four ordinary 37.5hr weeks — Mon–Fri 07:00–14:30, starting 2026-05-11. */
function fourNormalWeeks(): ShiftRecord[] {
  const shifts: ShiftRecord[] = [];
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 5; day++) {
      const d = new Date(Date.UTC(2026, 4, 11) + (week * 7 + day) * 86_400_000);
      shifts.push(
        makeShift({
          id: `shift-${week}-${day}`,
          date: d.toISOString().slice(0, 10),
          startTime: "07:00",
          endTime: "14:30",
        }),
      );
    }
  }
  return shifts;
}

describe("fatigue risk is assessed over the week, not the whole period", () => {
  // The Working Time thresholds this engine applies are explicitly weekly
  // ("48hr weekly limit", "in one week is unsafe"), and the field is named
  // totalHoursThisWeek — but the sum used to run over every shift handed in.
  // generateDeploymentIntelligence passes the FULL analysis period, so a month
  // of ordinary 37.5hr weeks reported 150hrs and a critical Working Time
  // breach: a false alarm against a staff member who did nothing wrong.
  it("counts only the week beginning weekStartDate", () => {
    const result = evaluateFatigueRisk(makeStaff(), fourNormalWeeks(), "2026-05-11");

    expect(result.totalHoursThisWeek).toBe(37.5);
    expect(result.riskLevel).toBe("low");
    expect(result.breachesIdentified).toHaveLength(0);
  });

  it("counts a later week when asked for that week", () => {
    // Third week of the same month — same 37.5hrs, not a running total.
    const result = evaluateFatigueRisk(makeStaff(), fourNormalWeeks(), "2026-05-25");

    expect(result.totalHoursThisWeek).toBe(37.5);
    expect(result.riskLevel).toBe("low");
  });

  it("still catches a genuine 48hr breach inside the week", () => {
    const shifts = [
      makeShift({ id: "a", date: "2026-05-11", startTime: "07:00", endTime: "19:00" }),
      makeShift({ id: "b", date: "2026-05-12", startTime: "07:00", endTime: "19:00" }),
      makeShift({ id: "c", date: "2026-05-13", startTime: "07:00", endTime: "19:00" }),
      makeShift({ id: "d", date: "2026-05-14", startTime: "07:00", endTime: "19:00" }),
      makeShift({ id: "e", date: "2026-05-15", startTime: "07:00", endTime: "19:00" }),
      // Sits outside the week — must not inflate it.
      makeShift({ id: "f", date: "2026-05-20", startTime: "07:00", endTime: "19:00" }),
    ];

    const result = evaluateFatigueRisk(makeStaff(), shifts, "2026-05-11");

    expect(result.totalHoursThisWeek).toBe(60);
    expect(result.breachesIdentified.some((b) => b.includes("Working Time breach"))).toBe(true);
  });
});

describe("rest gaps after an overnight shift", () => {
  // An overnight shift's END belongs to the NEXT calendar day. The engine used
  // to build its end timestamp from the shift's own start date, so a night
  // worker's rest looked ~24hrs longer than it was — and the direction of the
  // error is the dangerous one: a real Working Time rest breach went unreported.
  it("measures from the morning the night shift actually ended", () => {
    const gap = calculateRestGapHours({
      shift1Start: "20:00",
      shift1End: "06:00", // ends 2026-05-13 06:00, not 2026-05-12 06:00
      shift1Date: "2026-05-12",
      shift2Start: "15:00",
      shift2Date: "2026-05-13",
    });

    expect(gap).toBe(9);
  });

  it("flags the rest breach that the overnight gap hides", () => {
    const shifts = [
      makeShift({ id: "night", date: "2026-05-12", startTime: "20:00", endTime: "06:00", shiftType: "night" }),
      makeShift({ id: "late", date: "2026-05-13", startTime: "15:00", endTime: "23:00" }),
    ];

    const result = evaluateFatigueRisk(makeStaff(), shifts, "2026-05-11");

    expect(result.shortestRestGapHours).toBe(9);
    expect(result.breachesIdentified.some((b) => b.includes("Rest period breach"))).toBe(true);
  });

  it("leaves ordinary day-to-day gaps unchanged", () => {
    const gap = calculateRestGapHours({
      shift1Start: "07:00",
      shift1End: "15:00",
      shift1Date: "2026-05-12",
      shift2Start: "07:00",
      shift2Date: "2026-05-13",
    });

    expect(gap).toBe(16);
  });
});
