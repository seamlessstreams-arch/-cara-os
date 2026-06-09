// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EDUCATION INTELLIGENCE ENGINE TESTS
// Comprehensive unit + integration tests for Education Intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeEducationIntelligence,
  daysBetween,
  activityCategoryLabel,
  isPresent,
  isLate,
  isAbsent,
  computeAttendancePct,
  computeAttendanceTrend,
  type EducationIntelligenceInput,
  type ChildInput,
  type EducationRecordInput,
  type ActivityInput,
  type EduAttendanceInput,
} from "../education-intelligence-engine";

// ── Factories ──────────────────────────────────────────────────────────────

const TODAY = "2025-03-15";

function makeChild(overrides: Partial<ChildInput> = {}): ChildInput {
  return { id: "child_1", name: "Alex", ...overrides };
}

function makeEduRecord(overrides: Partial<EducationRecordInput> = {}): EducationRecordInput {
  return {
    id: "edu_1",
    child_id: "child_1",
    record_type: "attendance",
    date: "2025-03-10",
    school: "Oak Academy",
    attendance_status: "present",
    linked_pep: false,
    status: "open",
    ...overrides,
  };
}

function makeActivity(overrides: Partial<ActivityInput> = {}): ActivityInput {
  return {
    id: "act_1",
    child_id: "child_1",
    date: "2025-03-10",
    category: "sport",
    engagement: "enthusiastic",
    duration_minutes: 60,
    is_new_experience: false,
    ...overrides,
  };
}

function makeEduAttendance(overrides: Partial<EduAttendanceInput> = {}): EduAttendanceInput {
  return {
    id: "ea_1",
    child_id: "child_1",
    date: "2025-03-10",
    attendance_code: "/",
    session: "full_day",
    ...overrides,
  };
}

function makeInput(overrides: Partial<EducationIntelligenceInput> = {}): EducationIntelligenceInput {
  return {
    children: [],
    educationRecords: [],
    activities: [],
    eduAttendance: [],
    today: TODAY,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// UNIT TESTS — HELPERS
// ══════════════════════════════════════════════════════════════════════════════

describe("Education Intelligence Engine — Helper Functions", () => {
  describe("daysBetween", () => {
    it("returns 0 for same date", () => {
      expect(daysBetween("2025-03-15", "2025-03-15")).toBe(0);
    });

    it("returns positive for later date", () => {
      expect(daysBetween("2025-03-01", "2025-03-15")).toBe(14);
    });

    it("returns negative for earlier date", () => {
      expect(daysBetween("2025-03-15", "2025-03-01")).toBe(-14);
    });
  });

  describe("activityCategoryLabel", () => {
    it("maps known categories", () => {
      expect(activityCategoryLabel("sport")).toBe("Sport & Fitness");
      expect(activityCategoryLabel("creative")).toBe("Creative Arts");
      expect(activityCategoryLabel("life_skills")).toBe("Life Skills");
    });

    it("formats unknown categories", () => {
      expect(activityCategoryLabel("horse_riding")).toBe("Horse Riding");
    });
  });

  describe("isPresent", () => {
    it("returns true for / and \\", () => {
      expect(isPresent("/")).toBe(true);
      expect(isPresent("\\")).toBe(true);
    });

    it("returns false for other codes", () => {
      expect(isPresent("L")).toBe(false);
      expect(isPresent("U")).toBe(false);
    });
  });

  describe("isLate", () => {
    it("returns true for L", () => {
      expect(isLate("L")).toBe(true);
    });

    it("returns false for present codes", () => {
      expect(isLate("/")).toBe(false);
    });
  });

  describe("isAbsent", () => {
    it("returns true for absence codes", () => {
      expect(isAbsent("U")).toBe(true);
      expect(isAbsent("N")).toBe(true);
      expect(isAbsent("I")).toBe(true);
      expect(isAbsent("M")).toBe(true);
      expect(isAbsent("O")).toBe(true);
    });

    it("returns false for present/late codes", () => {
      expect(isAbsent("/")).toBe(false);
      expect(isAbsent("L")).toBe(false);
    });
  });

  describe("computeAttendancePct", () => {
    it("returns 100 for zero total", () => {
      expect(computeAttendancePct(0, 0)).toBe(100);
    });

    it("computes correct percentage", () => {
      expect(computeAttendancePct(90, 100)).toBe(90);
    });

    it("rounds to one decimal", () => {
      expect(computeAttendancePct(85, 93)).toBeCloseTo(91.4, 1);
    });
  });

  describe("computeAttendanceTrend", () => {
    it("returns improving for +3% or more", () => {
      expect(computeAttendanceTrend(95, 90)).toBe("improving");
    });

    it("returns declining for -3% or more", () => {
      expect(computeAttendanceTrend(85, 90)).toBe("declining");
    });

    it("returns stable for small changes", () => {
      expect(computeAttendanceTrend(91, 90)).toBe("stable");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Education Intelligence Engine — Empty Input", () => {
  it("returns safe defaults for empty input", () => {
    const result = computeEducationIntelligence(makeInput());

    expect(result.overview.total_children).toBe(0);
    expect(result.overview.neet_count).toBe(0);
    expect(result.attendance.overall_pct).toBe(100);
    expect(result.activities.total_activities_30d).toBe(0);
    expect(result.child_profiles).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.insights.length).toBeGreaterThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════

describe("Education Intelligence Engine — Overview", () => {
  it("counts children in education", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const result = computeEducationIntelligence(makeInput({
      children,
      educationRecords: [
        makeEduRecord({ child_id: "c1", date: "2025-03-10" }),
        makeEduRecord({ id: "edu_2", child_id: "c2", date: "2025-03-08" }),
      ],
    }));

    expect(result.overview.total_children).toBe(2);
    expect(result.overview.in_education).toBe(2);
    expect(result.overview.neet_count).toBe(0);
  });

  it("detects NEET children (no records in 30 days)", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2", name: "Tyler" })];
    const result = computeEducationIntelligence(makeInput({
      children,
      educationRecords: [
        makeEduRecord({ child_id: "c1", date: "2025-03-10" }),
        // c2 only has old records
        makeEduRecord({ id: "edu_2", child_id: "c2", date: "2024-12-01" }),
      ],
    }));

    expect(result.overview.neet_count).toBe(1);
    expect(result.overview.in_education).toBe(1);
  });

  it("counts exclusions in 90 days", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ record_type: "exclusion", date: "2025-02-01" }),
        makeEduRecord({ id: "edu_2", record_type: "exclusion", date: "2025-03-01" }),
        makeEduRecord({ id: "edu_3", record_type: "attendance", date: "2025-03-10" }), // in education
      ],
    }));

    expect(result.overview.exclusion_events_90d).toBe(2);
    expect(result.overview.excluded_count).toBe(1); // 1 child
  });

  it("detects PEP current vs overdue", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const result = computeEducationIntelligence(makeInput({
      children,
      educationRecords: [
        // c1 has recent PEP
        makeEduRecord({ child_id: "c1", record_type: "pep_meeting", date: "2025-02-01", linked_pep: true }),
        makeEduRecord({ id: "edu_2", child_id: "c1", date: "2025-03-10" }),
        // c2 has old PEP
        makeEduRecord({ id: "edu_3", child_id: "c2", record_type: "pep_meeting", date: "2024-10-01", linked_pep: true }),
        makeEduRecord({ id: "edu_4", child_id: "c2", date: "2025-03-08" }),
      ],
    }));

    expect(result.overview.pep_current_count).toBe(1);
    expect(result.overview.pep_overdue_count).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — ATTENDANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("Education Intelligence Engine — Attendance", () => {
  it("computes attendance from detailed records", () => {
    const child = makeChild();
    const records: EduAttendanceInput[] = [
      makeEduAttendance({ id: "ea1", date: "2025-03-01", attendance_code: "/" }),
      makeEduAttendance({ id: "ea2", date: "2025-03-02", attendance_code: "/" }),
      makeEduAttendance({ id: "ea3", date: "2025-03-03", attendance_code: "L" }),
      makeEduAttendance({ id: "ea4", date: "2025-03-04", attendance_code: "U" }),
      makeEduAttendance({ id: "ea5", date: "2025-03-05", attendance_code: "I" }),
    ];

    const result = computeEducationIntelligence(makeInput({
      children: [child],
      eduAttendance: records,
    }));

    expect(result.attendance.sessions_total).toBe(5);
    expect(result.attendance.sessions_present).toBe(2);
    expect(result.attendance.sessions_late).toBe(1);
    expect(result.attendance.sessions_absent).toBe(2);
    // Present + Late = 3 / 5 = 60%
    expect(result.attendance.overall_pct).toBe(60);
  });

  it("excludes children with no attendance data from the home average", () => {
    // A no-data child reads 100% (pct(0,0)) — it must not inflate the home average.
    const result = computeEducationIntelligence(makeInput({
      children: [makeChild({ id: "with_data", name: "A" }), makeChild({ id: "no_data", name: "B" })],
      eduAttendance: [
        makeEduAttendance({ id: "1", child_id: "with_data", date: "2025-03-01", attendance_code: "/" }),
        makeEduAttendance({ id: "2", child_id: "with_data", date: "2025-03-02", attendance_code: "/" }),
        makeEduAttendance({ id: "3", child_id: "with_data", date: "2025-03-03", attendance_code: "/" }),
        makeEduAttendance({ id: "4", child_id: "with_data", date: "2025-03-04", attendance_code: "U" }),
        makeEduAttendance({ id: "5", child_id: "with_data", date: "2025-03-05", attendance_code: "U" }),
      ],
    }));
    // Only the tracked child counts: 60%, not (60 + 100) / 2 = 80.
    expect(result.overview.avg_attendance_pct).toBe(60);
  });

  it("raises a critical low_attendance alert for a child with 0% attendance (all absent)", () => {
    // Previously suppressed by `attendance_pct > 0` — the single worst case.
    const child = makeChild({ id: "child_1", name: "Alex" });
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      eduAttendance: [
        makeEduAttendance({ id: "z1", date: "2025-03-01", attendance_code: "U" }),
        makeEduAttendance({ id: "z2", date: "2025-03-05", attendance_code: "U" }),
        makeEduAttendance({ id: "z3", date: "2025-03-08", attendance_code: "U" }),
        makeEduAttendance({ id: "z4", date: "2025-03-12", attendance_code: "U" }),
      ],
    }));
    const alert = result.alerts.find((a) => a.type === "low_attendance" && a.child_name === "Alex");
    expect(alert).toBeTruthy();
    expect(alert?.severity).toBe("critical");
  });

  it("uses education records as fallback when no detailed attendance", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ id: "e1", date: "2025-02-01", attendance_status: "present" }),
        makeEduRecord({ id: "e2", date: "2025-02-02", attendance_status: "present" }),
        makeEduRecord({ id: "e3", date: "2025-02-03", attendance_status: "present" }),
        makeEduRecord({ id: "e4", date: "2025-02-04", attendance_status: "absent_unauthorised" }),
      ],
    }));

    // 3 present / 4 total = 75%
    expect(result.attendance.overall_pct).toBe(75);
  });

  it("identifies children below 90% attendance", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const result = computeEducationIntelligence(makeInput({
      children,
      eduAttendance: [
        // c1: all present
        makeEduAttendance({ id: "ea1", child_id: "c1", date: "2025-03-01", attendance_code: "/" }),
        makeEduAttendance({ id: "ea2", child_id: "c1", date: "2025-03-02", attendance_code: "/" }),
        makeEduAttendance({ id: "ea3", child_id: "c1", date: "2025-03-03", attendance_code: "/" }),
        // c2: 1 of 3 present
        makeEduAttendance({ id: "ea4", child_id: "c2", date: "2025-03-01", attendance_code: "/" }),
        makeEduAttendance({ id: "ea5", child_id: "c2", date: "2025-03-02", attendance_code: "U" }),
        makeEduAttendance({ id: "ea6", child_id: "c2", date: "2025-03-03", attendance_code: "U" }),
      ],
    }));

    expect(result.attendance.below_90_count).toBe(1); // c2 at 33%
  });

  it("detects attendance trend from periods", () => {
    const child = makeChild();
    // Older period: all present
    const olderDates = ["2025-01-20", "2025-01-21", "2025-01-22", "2025-01-23", "2025-01-24"];
    // Recent period: many absences
    const recentDates = ["2025-03-01", "2025-03-02", "2025-03-03", "2025-03-04", "2025-03-05"];

    const records: EduAttendanceInput[] = [
      ...olderDates.map((d, i) => makeEduAttendance({ id: `old_${i}`, date: d, attendance_code: "/" })),
      ...recentDates.map((d, i) => makeEduAttendance({ id: `new_${i}`, date: d, attendance_code: i < 2 ? "/" : "U" })),
    ];

    const result = computeEducationIntelligence(makeInput({
      children: [child],
      eduAttendance: records,
    }));

    const profile = result.child_profiles[0];
    expect(profile.attendance_trend).toBe("declining");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — ACTIVITIES
// ══════════════════════════════════════════════════════════════════════════════

describe("Education Intelligence Engine — Activities", () => {
  it("counts activities in last 30 days", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      activities: [
        makeActivity({ id: "a1", date: "2025-03-01" }),
        makeActivity({ id: "a2", date: "2025-03-05", category: "creative" }),
        makeActivity({ id: "a3", date: "2025-03-10", category: "outdoor" }),
        makeActivity({ id: "a4", date: "2024-12-01" }), // too old
      ],
    }));

    expect(result.activities.total_activities_30d).toBe(3);
  });

  it("breaks down by category", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      activities: [
        makeActivity({ id: "a1", date: "2025-03-01", category: "sport" }),
        makeActivity({ id: "a2", date: "2025-03-05", category: "sport" }),
        makeActivity({ id: "a3", date: "2025-03-10", category: "creative" }),
      ],
    }));

    expect(result.activities.categories).toHaveLength(2);
    expect(result.activities.categories[0].category).toBe("sport");
    expect(result.activities.categories[0].count).toBe(2);
  });

  it("counts new experiences", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      activities: [
        makeActivity({ id: "a1", date: "2025-03-01", is_new_experience: true }),
        makeActivity({ id: "a2", date: "2025-03-05", is_new_experience: true }),
        makeActivity({ id: "a3", date: "2025-03-10", is_new_experience: false }),
      ],
    }));

    expect(result.activities.new_experiences_30d).toBe(2);
  });

  it("identifies children with zero activities", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2", name: "Tyler" })];
    const result = computeEducationIntelligence(makeInput({
      children,
      activities: [
        makeActivity({ child_id: "c1", date: "2025-03-10" }),
        // c2 has no activities
      ],
    }));

    expect(result.activities.children_with_zero_activities).toBe(1);
  });

  it("computes engagement breakdown", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      activities: [
        makeActivity({ id: "a1", date: "2025-03-01", engagement: "enthusiastic" }),
        makeActivity({ id: "a2", date: "2025-03-05", engagement: "enthusiastic" }),
        makeActivity({ id: "a3", date: "2025-03-10", engagement: "reluctant" }),
      ],
    }));

    expect(result.activities.engagement_breakdown[0].level).toBe("enthusiastic");
    expect(result.activities.engagement_breakdown[0].count).toBe(2);
  });

  it("computes average activities per child", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const result = computeEducationIntelligence(makeInput({
      children,
      activities: [
        makeActivity({ id: "a1", child_id: "c1", date: "2025-03-01" }),
        makeActivity({ id: "a2", child_id: "c1", date: "2025-03-05" }),
        makeActivity({ id: "a3", child_id: "c2", date: "2025-03-10" }),
      ],
    }));

    expect(result.activities.avg_activities_per_child_30d).toBe(1.5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — CHILD PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("Education Intelligence Engine — Child Profiles", () => {
  it("builds profile with attendance and school", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ date: "2025-03-01", school: "Oak Academy", attendance_status: "present" }),
        makeEduRecord({ id: "e2", date: "2025-03-02", school: "Oak Academy", attendance_status: "present" }),
      ],
    }));

    const profile = result.child_profiles[0];
    expect(profile.child_name).toBe("Alex");
    expect(profile.school).toBe("Oak Academy");
    expect(profile.attendance_pct).toBe(100);
  });

  it("tracks exclusion count per child", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ record_type: "exclusion", date: "2025-02-01" }),
        makeEduRecord({ id: "e2", record_type: "exclusion", date: "2025-03-01" }),
        makeEduRecord({ id: "e3", date: "2025-03-10" }),
      ],
    }));

    expect(result.child_profiles[0].exclusion_count_90d).toBe(2);
  });

  it("tracks achievements count", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ record_type: "achievement", date: "2025-03-01" }),
        makeEduRecord({ id: "e2", record_type: "attainment", date: "2025-02-15" }),
        makeEduRecord({ id: "e3", date: "2025-03-10" }),
      ],
    }));

    expect(result.child_profiles[0].achievements_90d).toBe(2);
  });

  it("tracks open concerns", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ record_type: "concern", status: "open", date: "2025-03-01" }),
        makeEduRecord({ id: "e2", record_type: "concern", status: "resolved", date: "2025-02-01" }),
        makeEduRecord({ id: "e3", date: "2025-03-10" }),
      ],
    }));

    expect(result.child_profiles[0].concerns_open).toBe(1);
  });

  it("reports PEP currency per child", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ record_type: "pep_meeting", date: "2025-02-15", linked_pep: true }),
        makeEduRecord({ id: "e2", date: "2025-03-10" }),
      ],
    }));

    expect(result.child_profiles[0].pep_current).toBe(true);
    expect(result.child_profiles[0].latest_pep_date).toBe("2025-02-15");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — ALERTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Education Intelligence Engine — Alerts", () => {
  it("generates NEET alert for children with no recent education", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ date: "2024-11-01" }), // too old
      ],
    }));

    const alert = result.alerts.find((a) => a.type === "neet");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
  });

  it("generates repeat exclusion alert", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ record_type: "exclusion", date: "2025-02-01" }),
        makeEduRecord({ id: "e2", record_type: "exclusion", date: "2025-03-01" }),
        makeEduRecord({ id: "e3", date: "2025-03-10" }),
      ],
    }));

    const alert = result.alerts.find((a) => a.type === "repeat_exclusion");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
  });

  it("generates low attendance alert", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      eduAttendance: [
        makeEduAttendance({ id: "ea1", date: "2025-03-01", attendance_code: "/" }),
        makeEduAttendance({ id: "ea2", date: "2025-03-02", attendance_code: "/" }),
        makeEduAttendance({ id: "ea3", date: "2025-03-03", attendance_code: "/" }),
        makeEduAttendance({ id: "ea4", date: "2025-03-04", attendance_code: "/" }),
        makeEduAttendance({ id: "ea5", date: "2025-03-05", attendance_code: "/" }),
        makeEduAttendance({ id: "ea6", date: "2025-03-06", attendance_code: "/" }),
        makeEduAttendance({ id: "ea7", date: "2025-03-07", attendance_code: "/" }),
        makeEduAttendance({ id: "ea8", date: "2025-03-10", attendance_code: "U" }),
        makeEduAttendance({ id: "ea9", date: "2025-03-11", attendance_code: "U" }),
        makeEduAttendance({ id: "ea10", date: "2025-03-12", attendance_code: "U" }),
      ],
    }));

    // 7/10 = 70% — below 90% but above 50% = medium severity
    const alert = result.alerts.find((a) => a.type === "low_attendance");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
  });

  it("generates PEP overdue alert", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        // Has recent education but no recent PEP
        makeEduRecord({ date: "2025-03-10" }),
        makeEduRecord({ id: "e2", record_type: "pep_meeting", date: "2024-06-01", linked_pep: true }),
      ],
    }));

    const alert = result.alerts.find((a) => a.type === "pep_overdue");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
  });

  it("sorts alerts by severity", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2", name: "Tyler" })];
    const result = computeEducationIntelligence(makeInput({
      children,
      educationRecords: [
        // c1 in education with exclusions
        makeEduRecord({ child_id: "c1", record_type: "exclusion", date: "2025-02-01" }),
        makeEduRecord({ id: "e2", child_id: "c1", record_type: "exclusion", date: "2025-03-01" }),
        makeEduRecord({ id: "e3", child_id: "c1", date: "2025-03-10" }),
        // c2 NEET
        makeEduRecord({ id: "e4", child_id: "c2", date: "2024-11-01" }),
      ],
    }));

    // NEET (critical) should come before repeat_exclusion (high)
    const neetIdx = result.alerts.findIndex((a) => a.type === "neet");
    const excIdx = result.alerts.findIndex((a) => a.type === "repeat_exclusion");
    expect(neetIdx).toBeLessThan(excIdx);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Education Intelligence Engine — ARIA Insights", () => {
  it("generates NEET critical insight", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      // No recent education
    }));

    const insight = result.insights.find((i) => i.text.includes("NEET"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("critical");
  });

  it("generates exclusion warning insight", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ record_type: "exclusion", date: "2025-02-01" }),
        makeEduRecord({ id: "e2", record_type: "exclusion", date: "2025-03-01" }),
        makeEduRecord({ id: "e3", date: "2025-03-10" }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("exclusion"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates attendance warning", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      eduAttendance: [
        makeEduAttendance({ id: "ea1", date: "2025-03-01", attendance_code: "/" }),
        makeEduAttendance({ id: "ea2", date: "2025-03-02", attendance_code: "U" }),
        makeEduAttendance({ id: "ea3", date: "2025-03-03", attendance_code: "U" }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("below 90%"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates PEP overdue warning", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ date: "2025-03-10" }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("PEP"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates activity gap warning", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2", name: "Tyler" })];
    const result = computeEducationIntelligence(makeInput({
      children,
      educationRecords: [
        makeEduRecord({ child_id: "c1", date: "2025-03-10" }),
        makeEduRecord({ id: "e2", child_id: "c2", date: "2025-03-08" }),
      ],
      activities: [
        makeActivity({ child_id: "c1", date: "2025-03-10" }),
        // c2 has no activities
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("activities in 30 days"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates positive insight for all in education", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      educationRecords: [
        makeEduRecord({ date: "2025-03-10" }),
        makeEduRecord({ id: "e2", record_type: "pep_meeting", date: "2025-02-15", linked_pep: true }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("Zero NEET"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("generates positive insight for good attendance", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      eduAttendance: [
        // 20 sessions, all present
        ...Array.from({ length: 20 }, (_, i) => makeEduAttendance({
          id: `ea_${i}`,
          date: `2025-03-${String(i + 1).padStart(2, "0")}`,
          attendance_code: "/",
        })),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("95%"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("generates positive insight for activity breadth", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      activities: [
        makeActivity({ id: "a1", date: "2025-03-01", category: "sport" }),
        makeActivity({ id: "a2", date: "2025-03-02", category: "creative" }),
        makeActivity({ id: "a3", date: "2025-03-03", category: "outdoor" }),
        makeActivity({ id: "a4", date: "2025-03-04", category: "social" }),
        makeActivity({ id: "a5", date: "2025-03-05", category: "life_skills" }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("different categories"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("generates positive insight for new experiences", () => {
    const child = makeChild();
    const result = computeEducationIntelligence(makeInput({
      children: [child],
      activities: [
        makeActivity({ id: "a1", date: "2025-03-01", is_new_experience: true }),
        makeActivity({ id: "a2", date: "2025-03-02", is_new_experience: true }),
        makeActivity({ id: "a3", date: "2025-03-03", is_new_experience: true }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("new experiences"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("always generates at least one insight", () => {
    const result = computeEducationIntelligence(makeInput());
    expect(result.insights.length).toBeGreaterThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// FULL INTEGRATION TEST — OAK HOUSE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Education Intelligence Engine — Chamberlain House Integration", () => {
  it("produces comprehensive analysis for multi-child home", () => {
    const children: ChildInput[] = [
      { id: "yp_alex", name: "Alex" },
      { id: "yp_jordan", name: "Jordan" },
      { id: "yp_casey", name: "Casey" },
    ];

    const educationRecords: EducationRecordInput[] = [
      // Alex — AP with exclusion, has PEP
      { id: "e1", child_id: "yp_alex", record_type: "attendance", date: "2025-03-10", school: "Derby AP", attendance_status: "present", linked_pep: false, status: "open" },
      { id: "e2", child_id: "yp_alex", record_type: "exclusion", date: "2025-03-03", school: "Derby AP", attendance_status: "excluded", linked_pep: false, status: "monitoring" },
      { id: "e3", child_id: "yp_alex", record_type: "exclusion", date: "2025-02-10", school: "Derby AP", attendance_status: "excluded", linked_pep: false, status: "monitoring" },
      { id: "e4", child_id: "yp_alex", record_type: "pep_meeting", date: "2025-03-01", school: "Derby AP", attendance_status: null, linked_pep: true, status: "monitoring" },
      // Jordan — good attendance, PEP current, achievement
      { id: "e5", child_id: "yp_jordan", record_type: "attendance", date: "2025-03-10", school: "Highfields", attendance_status: "present", linked_pep: false, status: "open" },
      { id: "e6", child_id: "yp_jordan", record_type: "attendance", date: "2025-03-08", school: "Highfields", attendance_status: "present", linked_pep: false, status: "open" },
      { id: "e7", child_id: "yp_jordan", record_type: "pep_meeting", date: "2025-02-15", school: "Highfields", attendance_status: null, linked_pep: true, status: "resolved" },
      { id: "e8", child_id: "yp_jordan", record_type: "attainment", date: "2025-03-05", school: "Highfields", attendance_status: null, linked_pep: false, status: "resolved" },
      // Casey — all good, recent PEP, achievement
      { id: "e9", child_id: "yp_casey", record_type: "attendance", date: "2025-03-10", school: "Allestree", attendance_status: "present", linked_pep: false, status: "open" },
      { id: "e10", child_id: "yp_casey", record_type: "pep_meeting", date: "2025-02-20", school: "Allestree", attendance_status: null, linked_pep: true, status: "resolved" },
      { id: "e11", child_id: "yp_casey", record_type: "achievement", date: "2025-03-05", school: "Allestree", attendance_status: null, linked_pep: false, status: "resolved" },
    ];

    const activities: ActivityInput[] = [
      { id: "a1", child_id: "yp_alex", date: "2025-03-02", category: "sport", engagement: "enthusiastic", duration_minutes: 90, is_new_experience: false },
      { id: "a2", child_id: "yp_alex", date: "2025-03-08", category: "creative", engagement: "willing", duration_minutes: 60, is_new_experience: true },
      { id: "a3", child_id: "yp_jordan", date: "2025-03-01", category: "sport", engagement: "enthusiastic", duration_minutes: 90, is_new_experience: false },
      { id: "a4", child_id: "yp_jordan", date: "2025-03-05", category: "social", engagement: "enthusiastic", duration_minutes: 120, is_new_experience: false },
      { id: "a5", child_id: "yp_jordan", date: "2025-03-10", category: "outdoor", engagement: "enthusiastic", duration_minutes: 180, is_new_experience: true },
      { id: "a6", child_id: "yp_casey", date: "2025-03-04", category: "creative", engagement: "enthusiastic", duration_minutes: 45, is_new_experience: false },
      { id: "a7", child_id: "yp_casey", date: "2025-03-09", category: "life_skills", engagement: "willing", duration_minutes: 60, is_new_experience: true },
    ];

    const result = computeEducationIntelligence({
      children,
      educationRecords,
      activities,
      eduAttendance: [],
      today: TODAY,
    });

    // ── Overview ───────────────────────────────────────────────────────────
    expect(result.overview.total_children).toBe(3);
    expect(result.overview.neet_count).toBe(0);
    expect(result.overview.exclusion_events_90d).toBe(2);
    expect(result.overview.excluded_count).toBe(1); // only Alex
    expect(result.overview.pep_current_count).toBe(3); // all have recent PEPs

    // ── Child profiles ─────────────────────────────────────────────────────
    expect(result.child_profiles).toHaveLength(3);
    const alex = result.child_profiles.find((p) => p.child_id === "yp_alex")!;
    expect(alex.school).toBe("Derby AP");
    expect(alex.exclusion_count_90d).toBe(2);
    expect(alex.pep_current).toBe(true);

    const jordan = result.child_profiles.find((p) => p.child_id === "yp_jordan")!;
    expect(jordan.achievements_90d).toBe(1);
    expect(jordan.pep_current).toBe(true);

    // ── Activities ─────────────────────────────────────────────────────────
    expect(result.activities.total_activities_30d).toBe(7);
    expect(result.activities.new_experiences_30d).toBe(3);
    expect(result.activities.children_with_zero_activities).toBe(0);
    expect(result.activities.categories.length).toBeGreaterThanOrEqual(4); // sport, creative, social, outdoor, life_skills

    // ── Alerts ─────────────────────────────────────────────────────────────
    // Alex should have repeat exclusion alert
    expect(result.alerts.some((a) => a.type === "repeat_exclusion" && a.child_name === "Alex")).toBe(true);

    // ── Insights ───────────────────────────────────────────────────────────
    // Zero NEET positive
    expect(result.insights.some((i) => i.severity === "positive" && i.text.includes("Zero NEET"))).toBe(true);
    // Exclusion warning
    expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("exclusion"))).toBe(true);
    // Activity breadth positive (5 categories)
    expect(result.insights.some((i) => i.severity === "positive" && i.text.includes("categories"))).toBe(true);
    // New experiences positive
    expect(result.insights.some((i) => i.severity === "positive" && i.text.includes("new experiences"))).toBe(true);
  });
});
