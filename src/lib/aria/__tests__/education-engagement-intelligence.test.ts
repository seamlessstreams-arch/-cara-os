// ══════════════════════════════════════════════════════════════════════════════
// ARIA — Education Engagement Intelligence Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { analyseEducationEngagement } from "../education-engagement-intelligence";
import type { EducationInput, EducationWeek } from "../education-engagement-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeWeek(overrides?: Partial<EducationWeek>): EducationWeek {
  return {
    weekStart: "2026-04-07",
    sessionsExpected: 10,
    sessionsAttended: 10,
    sessionsAuthorisedAbsence: 0,
    sessionsUnauthorisedAbsence: 0,
    lateArrivals: 0,
    exclusionDays: 0,
    ...overrides,
  };
}

function makeWeeks(count: number, attendanceRate: number, opts?: Partial<EducationWeek>): EducationWeek[] {
  return Array.from({ length: count }, (_, i) => {
    const attended = Math.round(10 * attendanceRate);
    return makeWeek({
      weekStart: new Date(2026, 2, 3 + i * 7).toISOString().slice(0, 10),
      sessionsAttended: attended,
      sessionsUnauthorisedAbsence: 10 - attended,
      ...opts,
    });
  });
}

function makeInput(overrides?: Partial<EducationInput>): EducationInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    currentProvision: "mainstream_school",
    provisionName: "Oak Academy",
    senStatus: "none",
    hasEHCP: false,
    pepUpToDate: true,
    pepLastReviewDate: "2026-04-01",
    pepNextDueDate: "2026-07-01",
    schoolMoves: 0,
    weeks: makeWeeks(12, 1.0),
    currentExclusions: 0,
    previousExclusions: 0,
    atRiskOfPermanentExclusion: false,
    virtualSchoolInvolved: true,
    designatedTeacherEngaged: true,
    pupilPremiumPlusAllocated: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("education-engagement-intelligence", () => {
  describe("analyseEducationEngagement", () => {
    it("returns a complete assessment structure", () => {
      const result = analyseEducationEngagement(makeInput());
      expect(result.childId).toBe("child_1");
      expect(result.childName).toBe("Jordan");
      expect(result.assessedAt).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.overallRating).toBeDefined();
      expect(result.attendanceScore).toBeDefined();
      expect(result.engagementScore).toBeDefined();
      expect(result.stabilityScore).toBeDefined();
      expect(result.complianceScore).toBeDefined();
      expect(result.currentAttendance).toBeDefined();
      expect(result.attendanceCategory).toBeDefined();
      expect(result.attendanceTrend).toBeDefined();
      expect(result.exclusionRisk).toBeDefined();
      expect(result.concerns).toBeDefined();
      expect(result.strengths).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.regulatoryFlags).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it("rates excellent for 100% attendance with full compliance", () => {
      const result = analyseEducationEngagement(makeInput());
      expect(result.overallRating).toBe("excellent");
      expect(result.overallScore).toBeGreaterThanOrEqual(85);
      expect(result.currentAttendance).toBe(100);
      expect(result.attendanceCategory).toBe("above_national");
    });

    it("rates inadequate for NEET with no compliance", () => {
      const result = analyseEducationEngagement(makeInput({
        currentProvision: "neet",
        provisionName: "None",
        pepUpToDate: false,
        pepLastReviewDate: undefined,
        virtualSchoolInvolved: false,
        designatedTeacherEngaged: false,
        pupilPremiumPlusAllocated: false,
        weeks: makeWeeks(12, 0),
      }));
      expect(result.overallRating).toBe("inadequate");
      expect(result.overallScore).toBeLessThan(40);
    });

    it("calculates attendance percentage correctly", () => {
      // 80% attendance
      const result = analyseEducationEngagement(makeInput({
        weeks: makeWeeks(12, 0.8),
      }));
      expect(result.currentAttendance).toBe(80);
    });

    it("categorises attendance correctly", () => {
      // 96%+ = above national
      expect(analyseEducationEngagement(makeInput({ weeks: makeWeeks(12, 0.97) })).attendanceCategory).toBe("above_national");
      // 94-95% = national average
      expect(analyseEducationEngagement(makeInput({ weeks: makeWeeks(12, 0.95) })).attendanceCategory).toBe("above_national");
      // 90-93% = below average (0.9 → 9/10 = 90%)
      expect(analyseEducationEngagement(makeInput({ weeks: makeWeeks(12, 0.9) })).attendanceCategory).toBe("below_average");
      // <90% = persistent absence (0.8 → 8/10 = 80%)
      expect(analyseEducationEngagement(makeInput({ weeks: makeWeeks(12, 0.8) })).attendanceCategory).toBe("persistent_absence");
      // <50% = severe absence (0.4 → 4/10 = 40%)
      expect(analyseEducationEngagement(makeInput({ weeks: makeWeeks(12, 0.4) })).attendanceCategory).toBe("severe_absence");
    });
  });

  describe("attendance trend", () => {
    it("detects improving attendance", () => {
      const weeks = [
        ...makeWeeks(6, 0.7),  // first half: 70%
        ...makeWeeks(6, 0.9),  // second half: 90%
      ];
      const result = analyseEducationEngagement(makeInput({ weeks }));
      expect(result.attendanceTrend).toBe("improving");
    });

    it("detects declining attendance", () => {
      const weeks = [
        ...makeWeeks(6, 0.95), // first half: 95%
        ...makeWeeks(6, 0.7),  // second half: 70%
      ];
      const result = analyseEducationEngagement(makeInput({ weeks }));
      expect(result.attendanceTrend).toBe("declining");
    });

    it("detects stable attendance", () => {
      const result = analyseEducationEngagement(makeInput({
        weeks: makeWeeks(12, 0.9),
      }));
      expect(result.attendanceTrend).toBe("stable");
    });
  });

  describe("exclusion risk", () => {
    it("assesses low risk when no exclusions", () => {
      const result = analyseEducationEngagement(makeInput());
      expect(result.exclusionRisk).toBe("low");
    });

    it("assesses critical risk when at risk of permanent exclusion", () => {
      const result = analyseEducationEngagement(makeInput({
        atRiskOfPermanentExclusion: true,
      }));
      expect(result.exclusionRisk).toBe("critical");
    });

    it("assesses high risk with 10+ exclusion days", () => {
      const result = analyseEducationEngagement(makeInput({
        currentExclusions: 12,
      }));
      expect(result.exclusionRisk).toBe("high");
    });

    it("assesses moderate risk with some exclusions", () => {
      const result = analyseEducationEngagement(makeInput({
        currentExclusions: 3,
      }));
      expect(result.exclusionRisk).toBe("moderate");
    });
  });

  describe("compliance scoring", () => {
    it("scores 100% when all compliance elements met", () => {
      const result = analyseEducationEngagement(makeInput({
        pepUpToDate: true,
        virtualSchoolInvolved: true,
        designatedTeacherEngaged: true,
        pupilPremiumPlusAllocated: true,
        hasEHCP: false,
        senStatus: "none",
      }));
      expect(result.complianceScore).toBe(100);
    });

    it("scores lower without PEP", () => {
      const result = analyseEducationEngagement(makeInput({
        pepUpToDate: false,
        pepLastReviewDate: undefined,
      }));
      expect(result.complianceScore).toBeLessThan(80);
    });

    it("scores lower without Virtual School involvement", () => {
      const result = analyseEducationEngagement(makeInput({
        virtualSchoolInvolved: false,
      }));
      expect(result.complianceScore).toBeLessThan(85);
    });
  });

  describe("stability scoring", () => {
    it("scores 100 with no school moves and mainstream", () => {
      const result = analyseEducationEngagement(makeInput({
        schoolMoves: 0,
        currentProvision: "mainstream_school",
        atRiskOfPermanentExclusion: false,
      }));
      expect(result.stabilityScore).toBe(100);
    });

    it("penalises multiple school moves", () => {
      const result = analyseEducationEngagement(makeInput({
        schoolMoves: 3,
      }));
      expect(result.stabilityScore).toBeLessThanOrEqual(60);
    });

    it("penalises NEET status", () => {
      const result = analyseEducationEngagement(makeInput({
        currentProvision: "neet",
        provisionName: "None",
      }));
      expect(result.stabilityScore).toBeLessThanOrEqual(70);
    });
  });

  describe("concerns", () => {
    it("raises critical concern for severe absence", () => {
      const result = analyseEducationEngagement(makeInput({
        weeks: makeWeeks(12, 0.4),
      }));
      expect(result.concerns.some(c => c.severity === "critical" && c.category === "attendance")).toBe(true);
    });

    it("raises significant concern for persistent absence", () => {
      const result = analyseEducationEngagement(makeInput({
        weeks: makeWeeks(12, 0.8), // 8/10 = 80% = persistent absence
      }));
      expect(result.concerns.some(c => c.severity === "significant" && c.category === "attendance")).toBe(true);
    });

    it("raises critical concern for NEET", () => {
      const result = analyseEducationEngagement(makeInput({
        currentProvision: "neet",
        provisionName: "None",
        weeks: makeWeeks(12, 0),
      }));
      expect(result.concerns.some(c => c.severity === "critical" && c.category === "provision")).toBe(true);
    });

    it("raises concern for overdue PEP", () => {
      const result = analyseEducationEngagement(makeInput({
        pepUpToDate: false,
      }));
      expect(result.concerns.some(c => c.category === "compliance")).toBe(true);
    });

    it("raises concern for exclusion risk", () => {
      const result = analyseEducationEngagement(makeInput({
        atRiskOfPermanentExclusion: true,
      }));
      expect(result.concerns.some(c => c.category === "exclusion")).toBe(true);
    });

    it("raises concern for multiple school moves", () => {
      const result = analyseEducationEngagement(makeInput({
        schoolMoves: 3,
      }));
      expect(result.concerns.some(c => c.category === "stability")).toBe(true);
    });

    it("raises concern for excessive late arrivals", () => {
      const result = analyseEducationEngagement(makeInput({
        weeks: makeWeeks(12, 0.9).map(w => ({ ...w, lateArrivals: 1 })),
      }));
      expect(result.concerns.some(c => c.description.includes("late"))).toBe(true);
    });

    it("sorts concerns by severity", () => {
      const result = analyseEducationEngagement(makeInput({
        currentProvision: "neet",
        provisionName: "None",
        pepUpToDate: false,
        schoolMoves: 3,
        weeks: makeWeeks(12, 0),
      }));
      const order = { critical: 0, significant: 1, moderate: 2, low: 3 };
      for (let i = 0; i < result.concerns.length - 1; i++) {
        expect(order[result.concerns[i].severity]).toBeLessThanOrEqual(order[result.concerns[i + 1].severity]);
      }
    });
  });

  describe("strengths", () => {
    it("identifies excellent attendance as a strength", () => {
      const result = analyseEducationEngagement(makeInput());
      expect(result.strengths.some(s => s.category === "Attendance")).toBe(true);
    });

    it("identifies PEP compliance as a strength", () => {
      const result = analyseEducationEngagement(makeInput());
      expect(result.strengths.some(s => s.category === "Compliance")).toBe(true);
    });

    it("identifies multi-agency support as a strength", () => {
      const result = analyseEducationEngagement(makeInput({
        designatedTeacherEngaged: true,
        virtualSchoolInvolved: true,
      }));
      expect(result.strengths.some(s => s.category === "Support")).toBe(true);
    });

    it("identifies stable school placement as a strength", () => {
      const result = analyseEducationEngagement(makeInput({
        currentProvision: "mainstream_school",
        schoolMoves: 0,
      }));
      expect(result.strengths.some(s => s.category === "Stability")).toBe(true);
    });

    it("identifies positive school notes as a strength", () => {
      const result = analyseEducationEngagement(makeInput({
        weeks: makeWeeks(12, 1.0).map(w => ({ ...w, positiveNotes: 2 })),
      }));
      expect(result.strengths.some(s => s.category === "Achievement")).toBe(true);
    });
  });

  describe("regulatory flags", () => {
    it("flags Reg 8(1) as met with good attendance", () => {
      const result = analyseEducationEngagement(makeInput());
      const reg8 = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 8(1)");
      expect(reg8).toBeDefined();
      expect(reg8!.status).toBe("met");
    });

    it("flags Reg 8(1) as not met when NEET", () => {
      const result = analyseEducationEngagement(makeInput({
        currentProvision: "neet",
        provisionName: "None",
        weeks: makeWeeks(12, 0),
      }));
      const reg8 = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 8(1)");
      expect(reg8).toBeDefined();
      expect(reg8!.status).toBe("not_met");
    });

    it("flags PEP regulation as met when up to date", () => {
      const result = analyseEducationEngagement(makeInput({ pepUpToDate: true }));
      const pep = result.regulatoryFlags.find(f => f.area === "Personal Education Plan");
      expect(pep).toBeDefined();
      expect(pep!.status).toBe("met");
    });

    it("flags PEP regulation as not met when overdue", () => {
      const result = analyseEducationEngagement(makeInput({
        pepUpToDate: false,
        pepLastReviewDate: undefined,
      }));
      const pep = result.regulatoryFlags.find(f => f.area === "Personal Education Plan");
      expect(pep).toBeDefined();
      expect(pep!.status).toBe("not_met");
    });

    it("flags VS involvement when concerns exist but VS not involved", () => {
      const result = analyseEducationEngagement(makeInput({
        weeks: makeWeeks(12, 0.8),
        virtualSchoolInvolved: false,
      }));
      const vs = result.regulatoryFlags.find(f => f.area === "Virtual School Head involvement");
      expect(vs).toBeDefined();
      expect(vs!.status).toBe("not_met");
    });
  });

  describe("recommendations", () => {
    it("recommends urgent action for NEET", () => {
      const result = analyseEducationEngagement(makeInput({
        currentProvision: "neet",
        provisionName: "None",
        weeks: makeWeeks(12, 0),
      }));
      expect(result.recommendations.some(r => r.includes("URGENT"))).toBe(true);
    });

    it("recommends PEP review when overdue", () => {
      const result = analyseEducationEngagement(makeInput({
        pepUpToDate: false,
      }));
      expect(result.recommendations.some(r => r.toLowerCase().includes("pep"))).toBe(true);
    });

    it("recommends VS involvement when needed", () => {
      const result = analyseEducationEngagement(makeInput({
        weeks: makeWeeks(12, 0.8),
        virtualSchoolInvolved: false,
      }));
      expect(result.recommendations.some(r => r.toLowerCase().includes("virtual school"))).toBe(true);
    });

    it("limits recommendations to 5", () => {
      const result = analyseEducationEngagement(makeInput({
        currentProvision: "neet",
        provisionName: "None",
        pepUpToDate: false,
        virtualSchoolInvolved: false,
        designatedTeacherEngaged: false,
        pupilPremiumPlusAllocated: false,
        schoolMoves: 3,
        weeks: makeWeeks(12, 0),
      }));
      expect(result.recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe("summary", () => {
    it("includes child name", () => {
      const result = analyseEducationEngagement(makeInput());
      expect(result.summary).toContain("Jordan");
    });

    it("includes attendance percentage", () => {
      const result = analyseEducationEngagement(makeInput());
      expect(result.summary).toContain("100%");
    });

    it("mentions critical concerns when present", () => {
      const result = analyseEducationEngagement(makeInput({
        currentProvision: "neet",
        provisionName: "None",
        weeks: makeWeeks(12, 0),
      }));
      expect(result.summary).toContain("critical");
    });
  });
});
