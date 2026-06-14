// ══════════════════════════════════════════════════════════════════════════════
// Tests — Cara Education Intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  analyseEducation,
  type EducationInput,
  type AttendanceRecord,
  type ExclusionRecord,
  type PEPRecord,
} from "../education-intelligence";

const FIXED_NOW = "2026-05-16T12:00:00Z";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
afterEach(() => { vi.useRealTimers(); });

// ── Helpers ────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<EducationInput> = {}): EducationInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    yearGroup: 10,
    schoolName: "Oak Academy",
    schoolType: "mainstream",
    inEducation: true,
    attendanceRecords: makeGoodAttendance(),
    attendanceTrend: "stable",
    exclusions: [],
    pepRecords: [makeGoodPEP()],
    pepDue: false,
    onTrackForTargets: true,
    progressRating: "expected",
    sendSupport: false,
    ehcpInPlace: false,
    designatedTeacherEngaged: true,
    virtualSchoolInvolved: true,
    tutoring: false,
    mentoring: false,
    ppPlusEffectivelyUsed: true,
    childEnjoysSChool: true,
    homeworkSupported: true,
    aspirationsDiscussed: true,
    careerGuidanceAccessed: true,
    postSixteenPlanInPlace: false,
    ...overrides,
  };
}

function makeGoodAttendance(): AttendanceRecord[] {
  // 12 weeks of attendance, 10 sessions/week, 97%+ attendance
  return Array.from({ length: 12 }, (_, i) => ({
    weekStarting: `2026-0${Math.floor((i + 1) / 5) + 2}-${((i % 4) * 7 + 1).toString().padStart(2, "0")}`,
    possibleSessions: 10,
    attendedSessions: i === 3 ? 9 : 10, // one session missed in week 4
    authorisedAbsences: i === 3 ? 1 : 0,
    unauthorisedAbsences: 0,
    lates: 0,
  }));
}

function makePoorAttendance(): AttendanceRecord[] {
  // 12 weeks, ~80% attendance
  return Array.from({ length: 12 }, (_, i) => ({
    weekStarting: `2026-0${Math.floor((i + 1) / 5) + 2}-${((i % 4) * 7 + 1).toString().padStart(2, "0")}`,
    possibleSessions: 10,
    attendedSessions: 8,
    authorisedAbsences: 1,
    unauthorisedAbsences: 1,
    lates: 1,
  }));
}

function makeGoodPEP(): PEPRecord {
  return {
    date: "2026-03-15",
    quality: "good",
    targetsSet: 4,
    targetsMet: 3,
    pupilPremiumPlusAllocated: 2530,
    pupilPremiumPlusSpent: 1800,
    childContributed: true,
    carerContributed: true,
    virtualSchoolAttended: true,
  };
}

function makeExclusion(overrides: Partial<ExclusionRecord> = {}): ExclusionRecord {
  return {
    date: "2026-03-01",
    type: "fixed_term",
    days: 2,
    reason: "persistent disruptive behaviour",
    reintegrationPlan: true,
    ...overrides,
  };
}

// ── Overall Structure ──────────────────────────────────────────────────────

describe("analyseEducation", () => {
  it("returns all required fields", () => {
    const result = analyseEducation(makeInput());
    expect(result).toHaveProperty("childName");
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("overallRating");
    expect(result).toHaveProperty("attendanceScore");
    expect(result).toHaveProperty("progressScore");
    expect(result).toHaveProperty("pepScore");
    expect(result).toHaveProperty("supportScore");
    expect(result).toHaveProperty("attendancePercentage");
    expect(result).toHaveProperty("attendanceBand");
    expect(result).toHaveProperty("totalExclusions");
    expect(result).toHaveProperty("exclusionDays");
    expect(result).toHaveProperty("latestPEPQuality");
    expect(result).toHaveProperty("pepTargetsMet");
    expect(result).toHaveProperty("pepTargetsSet");
    expect(result).toHaveProperty("concerns");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("regulatoryFlags");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("summary");
  });

  it("uses childName from input", () => {
    const result = analyseEducation(makeInput({ childName: "Sam" }));
    expect(result.childName).toBe("Sam");
  });

  it("scores 0-100", () => {
    const result = analyseEducation(makeInput());
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});

// ── Attendance ─────────────────────────────────────────────────────────────

describe("attendance", () => {
  it("calculates attendance percentage correctly", () => {
    const result = analyseEducation(makeInput());
    // 12 weeks * 10 sessions = 120, minus 1 absence = 119/120 = 99.2%
    expect(result.attendancePercentage).toBeCloseTo(99.2, 0);
  });

  it("returns excellent band for 97%+", () => {
    const result = analyseEducation(makeInput());
    expect(result.attendanceBand).toBe("excellent");
  });

  it("returns persistent_absence for 80-90%", () => {
    const records = Array.from({ length: 12 }, () => ({
      weekStarting: "2026-03-01",
      possibleSessions: 10,
      attendedSessions: 8, // 80%
      authorisedAbsences: 1,
      unauthorisedAbsences: 1,
      lates: 0,
    }));
    const result = analyseEducation(makeInput({ attendanceRecords: records }));
    expect(result.attendanceBand).toBe("persistent_absence");
  });

  it("returns severe_absence for below 50%", () => {
    const records = Array.from({ length: 12 }, () => ({
      weekStarting: "2026-03-01",
      possibleSessions: 10,
      attendedSessions: 4,
      authorisedAbsences: 3,
      unauthorisedAbsences: 3,
      lates: 0,
    }));
    const result = analyseEducation(makeInput({ attendanceRecords: records }));
    expect(result.attendanceBand).toBe("severe_absence");
  });

  it("returns 0 attendance for empty records", () => {
    const result = analyseEducation(makeInput({ attendanceRecords: [] }));
    expect(result.attendancePercentage).toBe(0);
  });
});

// ── Attendance Score ───────────────────────────────────────────────────────

describe("attendanceScore", () => {
  it("is high for excellent attendance", () => {
    const result = analyseEducation(makeInput());
    expect(result.attendanceScore).toBeGreaterThanOrEqual(70);
  });

  it("is lower for poor attendance", () => {
    const good = analyseEducation(makeInput());
    const poor = analyseEducation(makeInput({ attendanceRecords: makePoorAttendance() }));
    expect(poor.attendanceScore).toBeLessThan(good.attendanceScore);
  });

  it("is 0 when not in education", () => {
    const result = analyseEducation(makeInput({
      inEducation: false,
      schoolType: "neet",
    }));
    expect(result.attendanceScore).toBe(0);
  });

  it("penalises declining trend", () => {
    const stable = analyseEducation(makeInput({ attendanceTrend: "stable" }));
    const declining = analyseEducation(makeInput({ attendanceTrend: "declining" }));
    expect(declining.attendanceScore).toBeLessThan(stable.attendanceScore);
  });

  it("rewards improving trend", () => {
    const stable = analyseEducation(makeInput({
      attendanceRecords: makePoorAttendance(),
      attendanceTrend: "stable",
    }));
    const improving = analyseEducation(makeInput({
      attendanceRecords: makePoorAttendance(),
      attendanceTrend: "improving",
    }));
    expect(improving.attendanceScore).toBeGreaterThan(stable.attendanceScore);
  });

  it("penalises exclusion days", () => {
    const noExcl = analyseEducation(makeInput());
    const withExcl = analyseEducation(makeInput({
      exclusions: [makeExclusion({ days: 6 })],
    }));
    expect(withExcl.attendanceScore).toBeLessThan(noExcl.attendanceScore);
  });
});

// ── Progress Score ─────────────────────────────────────────────────────────

describe("progressScore", () => {
  it("is higher for above expected progress", () => {
    const expected = analyseEducation(makeInput({ progressRating: "expected" }));
    const above = analyseEducation(makeInput({ progressRating: "above_expected" }));
    expect(above.progressScore).toBeGreaterThan(expected.progressScore);
  });

  it("is lower for below expected", () => {
    const expected = analyseEducation(makeInput({ progressRating: "expected" }));
    const below = analyseEducation(makeInput({ progressRating: "below_expected" }));
    expect(below.progressScore).toBeLessThan(expected.progressScore);
  });

  it("rewards on track for targets", () => {
    const onTrack = analyseEducation(makeInput({ onTrackForTargets: true }));
    const offTrack = analyseEducation(makeInput({ onTrackForTargets: false }));
    expect(onTrack.progressScore).toBeGreaterThan(offTrack.progressScore);
  });

  it("is 0 when not in education", () => {
    const result = analyseEducation(makeInput({
      inEducation: false,
      schoolType: "neet",
    }));
    expect(result.progressScore).toBe(0);
  });
});

// ── PEP Score ──────────────────────────────────────────────────────────────

describe("pepScore", () => {
  it("is high with good quality PEP", () => {
    const result = analyseEducation(makeInput());
    expect(result.pepScore).toBeGreaterThanOrEqual(70);
  });

  it("is lower with inadequate PEP", () => {
    const good = analyseEducation(makeInput());
    const poor = analyseEducation(makeInput({
      pepRecords: [{
        ...makeGoodPEP(),
        quality: "inadequate",
        targetsMet: 0,
        childContributed: false,
        carerContributed: false,
        virtualSchoolAttended: false,
      }],
    }));
    expect(poor.pepScore).toBeLessThan(good.pepScore);
  });

  it("penalises overdue PEP", () => {
    const current = analyseEducation(makeInput({ pepDue: false }));
    const overdue = analyseEducation(makeInput({ pepDue: true }));
    expect(overdue.pepScore).toBeLessThan(current.pepScore);
  });

  it("rewards child and carer contribution", () => {
    const contributed = analyseEducation(makeInput());
    const notContributed = analyseEducation(makeInput({
      pepRecords: [{
        ...makeGoodPEP(),
        childContributed: false,
        carerContributed: false,
      }],
    }));
    expect(contributed.pepScore).toBeGreaterThan(notContributed.pepScore);
  });

  it("is 0 when not in education", () => {
    const result = analyseEducation(makeInput({
      inEducation: false,
      schoolType: "neet",
    }));
    expect(result.pepScore).toBe(0);
  });
});

// ── Support Score ──────────────────────────────────────────────────────────

describe("supportScore", () => {
  it("is high with full support network", () => {
    const result = analyseEducation(makeInput());
    expect(result.supportScore).toBeGreaterThanOrEqual(80);
  });

  it("is lower without Designated Teacher", () => {
    const withDT = analyseEducation(makeInput());
    const withoutDT = analyseEducation(makeInput({ designatedTeacherEngaged: false }));
    expect(withoutDT.supportScore).toBeLessThan(withDT.supportScore);
  });

  it("is lower without Virtual School", () => {
    const withVS = analyseEducation(makeInput());
    const withoutVS = analyseEducation(makeInput({ virtualSchoolInvolved: false }));
    expect(withoutVS.supportScore).toBeLessThan(withVS.supportScore);
  });

  it("considers career guidance for 14+", () => {
    const withCG = analyseEducation(makeInput({ age: 15, careerGuidanceAccessed: true }));
    const withoutCG = analyseEducation(makeInput({ age: 15, careerGuidanceAccessed: false }));
    expect(withCG.supportScore).toBeGreaterThan(withoutCG.supportScore);
  });
});

// ── Exclusion Metrics ──────────────────────────────────────────────────────

describe("exclusion metrics", () => {
  it("counts exclusions correctly", () => {
    const result = analyseEducation(makeInput({
      exclusions: [makeExclusion(), makeExclusion({ days: 3 })],
    }));
    expect(result.totalExclusions).toBe(2);
    expect(result.exclusionDays).toBe(5);
  });

  it("returns 0 with no exclusions", () => {
    const result = analyseEducation(makeInput());
    expect(result.totalExclusions).toBe(0);
    expect(result.exclusionDays).toBe(0);
  });
});

// ── PEP Metrics ────────────────────────────────────────────────────────────

describe("PEP metrics", () => {
  it("returns latest PEP quality", () => {
    const result = analyseEducation(makeInput());
    expect(result.latestPEPQuality).toBe("good");
  });

  it("returns none when no PEPs", () => {
    const result = analyseEducation(makeInput({ pepRecords: [] }));
    expect(result.latestPEPQuality).toBe("none");
  });

  it("returns targets from latest PEP", () => {
    const result = analyseEducation(makeInput());
    expect(result.pepTargetsSet).toBe(4);
    expect(result.pepTargetsMet).toBe(3);
  });
});

// ── Concerns ───────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("raises critical for NEET", () => {
    const result = analyseEducation(makeInput({
      inEducation: false,
      schoolType: "neet",
    }));
    const c = result.concerns.find(c => c.category === "provision");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("critical");
  });

  it("raises significant for persistent absence", () => {
    const records = Array.from({ length: 12 }, () => ({
      weekStarting: "2026-03-01",
      possibleSessions: 10,
      attendedSessions: 8,
      authorisedAbsences: 1,
      unauthorisedAbsences: 1,
      lates: 0,
    }));
    const result = analyseEducation(makeInput({ attendanceRecords: records }));
    const c = result.concerns.find(c => c.category === "attendance");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("significant");
  });

  it("raises critical for permanent exclusion", () => {
    const result = analyseEducation(makeInput({
      exclusions: [makeExclusion({ type: "permanent", days: 0 })],
    }));
    const c = result.concerns.find(c => c.category === "exclusion");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("critical");
  });

  it("raises significant for overdue PEP", () => {
    const result = analyseEducation(makeInput({ pepDue: true }));
    const c = result.concerns.find(c => c.category === "pep");
    expect(c).toBeDefined();
    expect(c!.severity).toBe("significant");
  });

  it("raises concern for declining attendance trend", () => {
    const result = analyseEducation(makeInput({
      attendanceRecords: makePoorAttendance(),
      attendanceTrend: "declining",
    }));
    expect(result.concerns.some(c => c.category === "attendance_trend")).toBe(true);
  });

  it("raises concern for post-16 plan missing for Year 11+", () => {
    const result = analyseEducation(makeInput({
      age: 16,
      yearGroup: 11,
      postSixteenPlanInPlace: false,
    }));
    const c = result.concerns.find(c => c.category === "transition");
    expect(c).toBeDefined();
  });

  it("returns no concerns for good education profile", () => {
    const result = analyseEducation(makeInput());
    expect(result.concerns).toHaveLength(0);
  });
});

// ── Strengths ──────────────────────────────────────────────────────────────

describe("strengths", () => {
  it("includes excellent attendance", () => {
    const result = analyseEducation(makeInput());
    expect(result.strengths.some(s => s.category === "attendance")).toBe(true);
  });

  it("includes good progress", () => {
    const result = analyseEducation(makeInput({ progressRating: "above_expected" }));
    expect(result.strengths.some(s => s.category === "progress")).toBe(true);
  });

  it("includes good PEP", () => {
    const result = analyseEducation(makeInput());
    expect(result.strengths.some(s => s.category === "pep")).toBe(true);
  });

  it("includes no exclusions", () => {
    const result = analyseEducation(makeInput());
    expect(result.strengths.some(s => s.category === "behaviour")).toBe(true);
  });

  it("includes child enjoyment", () => {
    const result = analyseEducation(makeInput());
    expect(result.strengths.some(s => s.category === "engagement")).toBe(true);
  });

  it("includes DT and VS network", () => {
    const result = analyseEducation(makeInput());
    expect(result.strengths.some(s => s.category === "support")).toBe(true);
  });
});

// ── Regulatory Flags ───────────────────────────────────────────────────────

describe("regulatoryFlags", () => {
  it("Reg 8 met for good education", () => {
    const result = analyseEducation(makeInput());
    const f = result.regulatoryFlags.find(f => f.area === "Education");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("Reg 8 not met when not in education", () => {
    const result = analyseEducation(makeInput({
      inEducation: false,
      schoolType: "neet",
    }));
    const f = result.regulatoryFlags.find(f => f.area === "Education");
    expect(f).toBeDefined();
    expect(f!.status).toBe("not_met");
  });

  it("PEP met when current and good quality", () => {
    const result = analyseEducation(makeInput());
    const f = result.regulatoryFlags.find(f => f.area === "PEP Quality");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("PEP not met when overdue", () => {
    const result = analyseEducation(makeInput({ pepDue: true, pepRecords: [] }));
    const f = result.regulatoryFlags.find(f => f.area === "PEP Quality");
    expect(f).toBeDefined();
    expect(f!.status).toBe("not_met");
  });

  it("Virtual School met when involved and PP+ used", () => {
    const result = analyseEducation(makeInput());
    const f = result.regulatoryFlags.find(f => f.area === "Educational Achievement");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });

  it("SCCIF education met for good outcomes", () => {
    const result = analyseEducation(makeInput());
    const f = result.regulatoryFlags.find(f => f.area === "Education Outcomes");
    expect(f).toBeDefined();
    expect(f!.status).toBe("met");
  });
});

// ── Recommendations ────────────────────────────────────────────────────────

describe("recommendations", () => {
  it("returns empty for good profile", () => {
    const result = analyseEducation(makeInput());
    expect(result.recommendations).toHaveLength(0);
  });

  it("URGENT for NEET", () => {
    const result = analyseEducation(makeInput({
      inEducation: false,
      schoolType: "neet",
    }));
    expect(result.recommendations.some(r => r.includes("URGENT"))).toBe(true);
  });

  it("recommends attendance plan for PA", () => {
    const records = Array.from({ length: 12 }, () => ({
      weekStarting: "2026-03-01",
      possibleSessions: 10,
      attendedSessions: 8,
      authorisedAbsences: 1,
      unauthorisedAbsences: 1,
      lates: 0,
    }));
    const result = analyseEducation(makeInput({ attendanceRecords: records }));
    expect(result.recommendations.some(r => r.toLowerCase().includes("attendance"))).toBe(true);
  });

  it("recommends PEP when overdue", () => {
    const result = analyseEducation(makeInput({ pepDue: true }));
    expect(result.recommendations.some(r => r.includes("PEP"))).toBe(true);
  });

  it("recommends engaging DT", () => {
    const result = analyseEducation(makeInput({ designatedTeacherEngaged: false }));
    expect(result.recommendations.some(r => r.includes("Designated Teacher"))).toBe(true);
  });

  it("recommends careers guidance for 14+", () => {
    const result = analyseEducation(makeInput({ age: 15, careerGuidanceAccessed: false }));
    expect(result.recommendations.some(r => r.toLowerCase().includes("careers") || r.toLowerCase().includes("career"))).toBe(true);
  });
});

// ── Summary ────────────────────────────────────────────────────────────────

describe("summary", () => {
  it("includes child name", () => {
    const result = analyseEducation(makeInput({ childName: "Sam" }));
    expect(result.summary).toContain("Sam");
  });

  it("includes attendance percentage", () => {
    const result = analyseEducation(makeInput());
    expect(result.summary).toMatch(/attendance \d+/);
  });

  it("includes progress rating", () => {
    const result = analyseEducation(makeInput());
    expect(result.summary).toContain("expected");
  });
});
