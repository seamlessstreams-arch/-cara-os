import { describe, it, expect } from "vitest";
import {
  analyseStaffingAdequacy,
  type ShiftSlot,
  type ChildNeed,
  type PlannedActivity,
  type HomeConfig,
} from "../staffing-adequacy";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
}

const defaultConfig: HomeConfig = {
  homeId: "home_oak",
  homeName: "Oak House",
  registeredBeds: 4,
  currentOccupancy: 3,
  minimumDayStaff: 2,
  minimumEveningStaff: 2,
  minimumNightStaff: 1,
  requiresSeniorEveryShift: true,
  requiresFirstAidEveryShift: true,
  requiresMedTrainedEveryShift: true,
};

function makeShift(overrides: Partial<ShiftSlot> = {}): ShiftSlot {
  return {
    id: `shift_${Math.random().toString(36).slice(2, 8)}`,
    date: makeDate(1),
    shiftType: "day",
    startTime: "07:00",
    endTime: "15:00",
    staffId: "staff_1",
    staffName: "Sarah T",
    role: "senior",
    qualifications: ["L3", "first_aid", "med_trained"],
    confirmed: true,
    ...overrides,
  };
}

function makeChildNeed(overrides: Partial<ChildNeed> = {}): ChildNeed {
  return {
    childId: "child_1",
    childName: "Jordan P",
    staffingRatio: "standard",
    requiresWakingNight: false,
    requiresMedTrained: true,
    riskLevel: "medium",
    currentlyPlaced: true,
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Staffing Adequacy Analyser", () => {
  describe("basic structure", () => {
    it("returns correct structure with no shifts", () => {
      const result = analyseStaffingAdequacy([], [], [], defaultConfig, 7);
      expect(result.homeId).toBe("home_oak");
      expect(result.windowDays).toBe(7);
      expect(result.overallScore).toBe(100);
      expect(result.shiftAssessments).toHaveLength(0);
      expect(result.gaps).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.regulatoryStatus.compliant).toBe(true);
    });

    it("sets analysis date to today", () => {
      const today = new Date().toISOString().slice(0, 10);
      const result = analyseStaffingAdequacy([], [], [], defaultConfig, 7);
      expect(result.analysisDate).toBe(today);
    });
  });

  // ── Shift assessment ──────────────────────────────────────────────────────

  describe("shift assessment", () => {
    it("adequate when staff meets minimum", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", role: "senior" }),
        makeShift({ date, shiftType: "day", staffId: "s2", role: "residential" }),
        makeShift({ date, shiftType: "day", staffId: "s3", role: "residential" }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const day = result.shiftAssessments.find((a) => a.date === date && a.shiftType === "day");
      expect(day).toBeDefined();
      expect(day!.status).toBe("adequate");
      expect(day!.assigned).toBe(3);
    });

    it("marginal when exactly at minimum", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", role: "senior" }),
        makeShift({ date, shiftType: "day", staffId: "s2", role: "residential" }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const day = result.shiftAssessments.find((a) => a.date === date && a.shiftType === "day");
      expect(day!.status).toBe("marginal");
    });

    it("under_staffed when below minimum", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1" }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const day = result.shiftAssessments.find((a) => a.date === date && a.shiftType === "day");
      expect(day!.status).toBe("under_staffed");
    });

    it("unfilled when no staff assigned", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: undefined, staffName: undefined }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const day = result.shiftAssessments.find((a) => a.date === date && a.shiftType === "day");
      expect(day!.status).toBe("unfilled");
    });

    it("tracks confirmed vs unconfirmed", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", confirmed: true }),
        makeShift({ date, shiftType: "day", staffId: "s2", confirmed: false }),
        makeShift({ date, shiftType: "day", staffId: "s3", confirmed: true }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const day = result.shiftAssessments.find((a) => a.date === date && a.shiftType === "day");
      expect(day!.confirmed).toBe(2);
    });
  });

  // ── Qualification coverage ────────────────────────────────────────────────

  describe("qualification coverage", () => {
    it("detects missing senior on shift", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", role: "residential" }),
        makeShift({ date, shiftType: "day", staffId: "s2", role: "residential" }),
        makeShift({ date, shiftType: "day", staffId: "s3", role: "residential" }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const day = result.shiftAssessments.find((a) => a.date === date);
      expect(day!.hasSenior).toBe(false);
      expect(result.gaps.some((g) => g.gapType === "senior")).toBe(true);
    });

    it("detects missing first aider", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", role: "senior", qualifications: ["L3", "med_trained"] }),
        makeShift({ date, shiftType: "day", staffId: "s2", qualifications: ["L3"] }),
        makeShift({ date, shiftType: "day", staffId: "s3", qualifications: [] }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const day = result.shiftAssessments.find((a) => a.date === date);
      expect(day!.hasFirstAid).toBe(false);
      expect(result.gaps.some((g) => g.gapType === "first_aid")).toBe(true);
    });

    it("detects missing med-trained staff", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", role: "senior", qualifications: ["L3", "first_aid"] }),
        makeShift({ date, shiftType: "day", staffId: "s2", qualifications: ["L3", "first_aid"] }),
        makeShift({ date, shiftType: "day", staffId: "s3", qualifications: ["first_aid"] }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      expect(result.gaps.some((g) => g.gapType === "med_trained")).toBe(true);
      expect(result.gaps.find((g) => g.gapType === "med_trained")!.severity).toBe("critical");
    });

    it("calculates qualification coverage percentages", () => {
      const date1 = makeDate(1);
      const date2 = makeDate(2);
      const shifts = [
        makeShift({ date: date1, shiftType: "day", staffId: "s1", qualifications: ["first_aid", "med_trained"] }),
        makeShift({ date: date1, shiftType: "day", staffId: "s2", qualifications: ["first_aid"] }),
        makeShift({ date: date2, shiftType: "day", staffId: "s1", qualifications: ["first_aid", "med_trained"] }),
        makeShift({ date: date2, shiftType: "day", staffId: "s3", qualifications: [] }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const firstAid = result.qualificationCoverage.find((q) => q.qualification === "first_aid");
      expect(firstAid!.coveragePercent).toBe(100); // Both shifts have first_aid
      const medTrained = result.qualificationCoverage.find((q) => q.qualification === "med_trained");
      expect(medTrained!.coveragePercent).toBe(100); // Both shifts have med_trained
    });
  });

  // ── Alerts ────────────────────────────────────────────────────────────────

  describe("alerts", () => {
    it("critical alert for unfilled shifts", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "evening", staffId: undefined }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const critical = result.alerts.find((a) => a.severity === "critical" && a.category === "headcount");
      expect(critical).toBeDefined();
      expect(critical!.regulation).toContain("Reg 22");
    });

    it("high alert for under-staffed shifts", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1" }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const high = result.alerts.find((a) => a.severity === "high" && a.category === "headcount");
      expect(high).toBeDefined();
    });

    it("medium alert for unconfirmed shifts (>3)", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", confirmed: false }),
        makeShift({ date, shiftType: "day", staffId: "s2", confirmed: false }),
        makeShift({ date, shiftType: "evening", staffId: "s3", confirmed: false }),
        makeShift({ date, shiftType: "evening", staffId: "s4", confirmed: false }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const medium = result.alerts.find((a) => a.category === "confirmation");
      expect(medium).toBeDefined();
      expect(medium!.severity).toBe("medium");
    });

    it("no alert when few unconfirmed (<=3)", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", confirmed: false }),
        makeShift({ date, shiftType: "day", staffId: "s2", confirmed: true }),
        makeShift({ date, shiftType: "day", staffId: "s3", confirmed: true }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const confirmAlert = result.alerts.find((a) => a.category === "confirmation");
      expect(confirmAlert).toBeUndefined();
    });

    it("lone working alert when single staff on non-sleep-in shift", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "evening", staffId: "s1" }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const lone = result.alerts.find((a) => a.category === "lone_working");
      expect(lone).toBeDefined();
      expect(lone!.regulation).toContain("Lone Working");
    });

    it("no lone working alert for sleep-in with one staff", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "sleep_in", staffId: "s1" }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      const lone = result.alerts.find((a) => a.category === "lone_working");
      expect(lone).toBeUndefined();
    });

    it("alerts sorted by severity", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "evening", staffId: undefined }), // unfilled → critical
        makeShift({ date, shiftType: "day", staffId: "s1", confirmed: false }),
        makeShift({ date, shiftType: "day", staffId: "s2", confirmed: false }),
        makeShift({ date, shiftType: "day", staffId: "s3", confirmed: false }),
        makeShift({ date, shiftType: "day", staffId: "s4", confirmed: false }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      if (result.alerts.length >= 2) {
        expect(result.alerts[0].severity === "critical" || result.alerts[0].severity === "high").toBe(true);
      }
    });
  });

  // ── Activities ────────────────────────────────────────────────────────────

  describe("activity coverage", () => {
    it("detects insufficient staff for activity", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1" }),
        makeShift({ date, shiftType: "day", staffId: "s2" }),
      ];
      const activities: PlannedActivity[] = [
        { id: "act_1", date, time: "10:00", description: "Swimming trip", staffRequired: 3, requiresDriver: false },
      ];
      const result = analyseStaffingAdequacy(shifts, [], activities, defaultConfig, 7);
      expect(result.gaps.some((g) => g.description.includes("Swimming trip"))).toBe(true);
    });

    it("detects missing driver for activity", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", qualifications: ["L3", "first_aid", "med_trained"] }),
        makeShift({ date, shiftType: "day", staffId: "s2", qualifications: ["L3"] }),
      ];
      const activities: PlannedActivity[] = [
        { id: "act_1", date, time: "14:00", description: "Contact visit", staffRequired: 1, requiresDriver: true },
      ];
      const result = analyseStaffingAdequacy(shifts, [], activities, defaultConfig, 7);
      expect(result.gaps.some((g) => g.gapType === "driver")).toBe(true);
    });

    it("no gap when driver available", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", qualifications: ["L3", "first_aid", "med_trained", "driver"] }),
        makeShift({ date, shiftType: "day", staffId: "s2", qualifications: ["L3"] }),
      ];
      const activities: PlannedActivity[] = [
        { id: "act_1", date, time: "14:00", description: "Contact visit", staffRequired: 1, requiresDriver: true },
      ];
      const result = analyseStaffingAdequacy(shifts, [], activities, defaultConfig, 7);
      expect(result.gaps.some((g) => g.gapType === "driver")).toBe(false);
    });
  });

  // ── Child needs ───────────────────────────────────────────────────────────

  describe("child-specific needs", () => {
    it("alerts when staffing insufficient for enhanced ratios", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", role: "senior" }),
        makeShift({ date, shiftType: "day", staffId: "s2", role: "residential" }),
      ];
      const childNeeds = [
        makeChildNeed({ childId: "c1", staffingRatio: "1:1", currentlyPlaced: true }),
        makeChildNeed({ childId: "c2", staffingRatio: "standard", currentlyPlaced: true }),
      ];
      const result = analyseStaffingAdequacy(shifts, childNeeds, [], defaultConfig, 7);
      const alert = result.alerts.find((a) => a.description.includes("enhanced ratios"));
      expect(alert).toBeDefined();
    });
  });

  // ── Weekly pattern ────────────────────────────────────────────────────────

  describe("weekly pattern", () => {
    it("generates day-of-week pattern", () => {
      const shifts: ShiftSlot[] = [];
      for (let i = 1; i <= 7; i++) {
        const date = makeDate(i);
        shifts.push(makeShift({ date, shiftType: "day", staffId: `s_${i}_1` }));
        shifts.push(makeShift({ date, shiftType: "day", staffId: `s_${i}_2` }));
        if (i % 2 === 0) {
          shifts.push(makeShift({ date, shiftType: "day", staffId: `s_${i}_3` }));
        }
      }
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      expect(result.weeklyPattern.length).toBeGreaterThan(0);
      expect(result.weeklyPattern[0].dayOfWeek).toBeDefined();
      expect(result.weeklyPattern[0].averageStaff).toBeGreaterThan(0);
    });
  });

  // ── Overall scoring ───────────────────────────────────────────────────────

  describe("overall scoring", () => {
    it("adequate when all shifts properly staffed", () => {
      const shifts: ShiftSlot[] = [];
      for (let i = 1; i <= 3; i++) {
        const date = makeDate(i);
        shifts.push(makeShift({ date, shiftType: "day", staffId: `s_${i}_1`, role: "senior" }));
        shifts.push(makeShift({ date, shiftType: "day", staffId: `s_${i}_2` }));
        shifts.push(makeShift({ date, shiftType: "day", staffId: `s_${i}_3` }));
      }
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      expect(result.overallStatus).toBe("adequate");
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
    });

    it("inadequate when most shifts unfilled", () => {
      const shifts: ShiftSlot[] = [];
      for (let i = 1; i <= 3; i++) {
        const date = makeDate(i);
        shifts.push(makeShift({ date, shiftType: "day", staffId: undefined }));
        shifts.push(makeShift({ date, shiftType: "evening", staffId: undefined }));
      }
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      expect(result.overallStatus).toBe("inadequate");
      expect(result.overallScore).toBeLessThan(50);
    });

    it("concerns when some shifts marginal", () => {
      const date = makeDate(1);
      const date2 = makeDate(2);
      const shifts = [
        // Day 1: adequate (3 staff)
        makeShift({ date, shiftType: "day", staffId: "s1", role: "senior" }),
        makeShift({ date, shiftType: "day", staffId: "s2" }),
        makeShift({ date, shiftType: "day", staffId: "s3" }),
        // Day 2: under-staffed (1 staff)
        makeShift({ date: date2, shiftType: "day", staffId: "s1" }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      expect(result.overallStatus).toBe("concerns");
    });
  });

  // ── Regulatory status ─────────────────────────────────────────────────────

  describe("regulatory status", () => {
    it("compliant when fully staffed with qualifications", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: "s1", role: "senior", qualifications: ["L3", "first_aid", "med_trained"] }),
        makeShift({ date, shiftType: "day", staffId: "s2", qualifications: ["L3", "first_aid", "med_trained"] }),
        makeShift({ date, shiftType: "day", staffId: "s3", qualifications: ["L3", "first_aid", "med_trained"] }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      expect(result.regulatoryStatus.compliant).toBe(true);
    });

    it("non-compliant with unfilled shifts", () => {
      const date = makeDate(1);
      const shifts = [
        makeShift({ date, shiftType: "day", staffId: undefined }),
      ];
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      expect(result.regulatoryStatus.compliant).toBe(false);
      expect(result.regulatoryStatus.issues.some((i) => i.includes("unfilled"))).toBe(true);
    });

    it("records strengths for good staffing", () => {
      const shifts: ShiftSlot[] = [];
      for (let i = 1; i <= 3; i++) {
        const date = makeDate(i);
        shifts.push(makeShift({ date, shiftType: "day", staffId: `s_${i}_1`, role: "senior", qualifications: ["L3", "first_aid", "med_trained", "driver", "fire_marshal", "safeguarding_lead"] }));
        shifts.push(makeShift({ date, shiftType: "day", staffId: `s_${i}_2`, qualifications: ["L3", "first_aid", "med_trained", "driver", "fire_marshal", "safeguarding_lead"] }));
        shifts.push(makeShift({ date, shiftType: "day", staffId: `s_${i}_3`, qualifications: ["L3", "first_aid", "med_trained", "driver", "fire_marshal", "safeguarding_lead"] }));
      }
      const result = analyseStaffingAdequacy(shifts, [], [], defaultConfig, 7);
      expect(result.regulatoryStatus.strengths.length).toBeGreaterThan(0);
    });
  });
});
