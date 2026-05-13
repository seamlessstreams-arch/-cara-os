// ==============================================================================
// CORNERSTONE -- EDUCATION & ACTIVITIES SERVICE TESTS
// Pure-function tests for attendance stats, education profiles,
// activity engagement, education alerts, and constant validation.
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  EDUCATION_STATUSES,
  ATTENDANCE_MARKS,
  ACTIVITY_CATEGORIES,
  EXCLUSION_TYPES,
  PEP_TARGETS_STATUS,
} from "../education-service";
import { _testing } from "../education-service";

const {
  computeAttendanceStats,
  computeEducationProfile,
  computeActivityEngagement,
  identifyEducationAlerts,
} = _testing;

// -- Types (minimal shapes used by pure functions) --------------------------

interface AttendanceEntry {
  id: string;
  home_id: string;
  child_id: string;
  education_record_id: string;
  date: string;
  mark: string;
  session: "am" | "pm";
  notes?: string | null;
  recorded_by: string;
  created_at: string;
}

interface EducationRecord {
  id: string;
  home_id: string;
  child_id: string;
  education_status: string;
  school_name: string;
  year_group?: string | null;
  sen_status?: string | null;
  pupil_premium_plus: boolean;
  virtual_school_contact?: string | null;
  designated_teacher?: string | null;
  pep_date?: string | null;
  next_pep_date?: string | null;
  attendance_percentage?: number | null;
  exclusion_count: number;
  achievements: string[];
  concerns: string[];
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

interface ActivityRecord {
  id: string;
  home_id: string;
  child_id: string;
  activity_name: string;
  category: string;
  date: string;
  duration_minutes?: number | null;
  location?: string | null;
  description?: string | null;
  child_feedback?: string | null;
  child_enjoyed: boolean;
  skills_developed: string[];
  staff_member: string;
  created_at: string;
}

// -- Helpers ----------------------------------------------------------------

/** Build an AttendanceEntry with sensible defaults, overridable per-field. */
function attendance(overrides?: Partial<AttendanceEntry>): AttendanceEntry {
  return {
    id: "att-1",
    home_id: "home-1",
    child_id: "child-1",
    education_record_id: "edu-1",
    date: "2026-05-10",
    mark: "present",
    session: "am",
    notes: null,
    recorded_by: "staff-1",
    created_at: "2026-05-10T08:00:00Z",
    ...overrides,
  };
}

/** Build an EducationRecord with sensible defaults, overridable per-field. */
function eduRecord(overrides?: Partial<EducationRecord>): EducationRecord {
  return {
    id: "edu-1",
    home_id: "home-1",
    child_id: "child-1",
    education_status: "full_time_school",
    school_name: "Oak Academy",
    year_group: "Year 9",
    sen_status: "none",
    pupil_premium_plus: true,
    virtual_school_contact: null,
    designated_teacher: null,
    pep_date: null,
    next_pep_date: null,
    attendance_percentage: "attendance_percentage" in (overrides ?? {}) ? overrides!.attendance_percentage : 95,
    exclusion_count: 0,
    achievements: [],
    concerns: [],
    is_current: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/** Build an ActivityRecord with sensible defaults, overridable per-field. */
function activity(overrides?: Partial<ActivityRecord>): ActivityRecord {
  return {
    id: "act-1",
    home_id: "home-1",
    child_id: "child-1",
    activity_name: "Football",
    category: "sport",
    date: new Date().toISOString().slice(0, 10),
    duration_minutes: 60,
    location: "Playing field",
    description: null,
    child_feedback: null,
    child_enjoyed: true,
    skills_developed: ["teamwork"],
    staff_member: "staff-1",
    created_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeAttendanceStats -------------------------------------------------

describe("computeAttendanceStats", () => {
  it("returns zero stats for an empty array", () => {
    const result = computeAttendanceStats([]);
    expect(result.total_sessions).toBe(0);
    expect(result.present).toBe(0);
    expect(result.authorised_absence).toBe(0);
    expect(result.unauthorised_absence).toBe(0);
    expect(result.late).toBe(0);
    expect(result.excluded).toBe(0);
    expect(result.attendance_rate).toBe(0);
    expect(result.unauthorised_rate).toBe(0);
  });

  it("counts total_sessions as the number of entries", () => {
    const entries = [
      attendance({ id: "a1" }),
      attendance({ id: "a2" }),
      attendance({ id: "a3" }),
    ];
    const result = computeAttendanceStats(entries);
    expect(result.total_sessions).toBe(3);
  });

  it("counts present marks correctly", () => {
    const entries = [
      attendance({ id: "a1", mark: "present" }),
      attendance({ id: "a2", mark: "present" }),
      attendance({ id: "a3", mark: "late" }),
    ];
    const result = computeAttendanceStats(entries);
    expect(result.present).toBe(2);
  });

  it("counts authorised_absence marks correctly", () => {
    const entries = [
      attendance({ id: "a1", mark: "authorised_absence" }),
      attendance({ id: "a2", mark: "authorised_absence" }),
      attendance({ id: "a3", mark: "present" }),
    ];
    const result = computeAttendanceStats(entries);
    expect(result.authorised_absence).toBe(2);
  });

  it("counts unauthorised_absence marks correctly", () => {
    const entries = [
      attendance({ id: "a1", mark: "unauthorised_absence" }),
      attendance({ id: "a2", mark: "present" }),
    ];
    const result = computeAttendanceStats(entries);
    expect(result.unauthorised_absence).toBe(1);
  });

  it("counts late marks correctly", () => {
    const entries = [
      attendance({ id: "a1", mark: "late" }),
      attendance({ id: "a2", mark: "late" }),
      attendance({ id: "a3", mark: "late" }),
    ];
    const result = computeAttendanceStats(entries);
    expect(result.late).toBe(3);
  });

  it("counts excluded marks correctly", () => {
    const entries = [
      attendance({ id: "a1", mark: "excluded" }),
      attendance({ id: "a2", mark: "present" }),
    ];
    const result = computeAttendanceStats(entries);
    expect(result.excluded).toBe(1);
  });

  it("calculates attendance_rate as (present + late) / total * 100, one decimal", () => {
    // 2 present + 1 late = 3 out of 4 = 75.0%
    const entries = [
      attendance({ id: "a1", mark: "present" }),
      attendance({ id: "a2", mark: "present" }),
      attendance({ id: "a3", mark: "late" }),
      attendance({ id: "a4", mark: "unauthorised_absence" }),
    ];
    const result = computeAttendanceStats(entries);
    expect(result.attendance_rate).toBe(75);
  });

  it("rounds attendance_rate to one decimal place", () => {
    // 2 present out of 3 = 66.666... -> 66.7
    const entries = [
      attendance({ id: "a1", mark: "present" }),
      attendance({ id: "a2", mark: "present" }),
      attendance({ id: "a3", mark: "authorised_absence" }),
    ];
    const result = computeAttendanceStats(entries);
    expect(result.attendance_rate).toBe(66.7);
  });

  it("calculates unauthorised_rate as unauthorised / total * 100, one decimal", () => {
    // 1 unauthorised out of 4 = 25.0%
    const entries = [
      attendance({ id: "a1", mark: "present" }),
      attendance({ id: "a2", mark: "present" }),
      attendance({ id: "a3", mark: "present" }),
      attendance({ id: "a4", mark: "unauthorised_absence" }),
    ];
    const result = computeAttendanceStats(entries);
    expect(result.unauthorised_rate).toBe(25);
  });

  it("rounds unauthorised_rate to one decimal place", () => {
    // 1 unauthorised out of 3 = 33.333... -> 33.3
    const entries = [
      attendance({ id: "a1", mark: "present" }),
      attendance({ id: "a2", mark: "present" }),
      attendance({ id: "a3", mark: "unauthorised_absence" }),
    ];
    const result = computeAttendanceStats(entries);
    expect(result.unauthorised_rate).toBe(33.3);
  });

  it("treats late as counting towards attendance_rate", () => {
    // All late -> 100% attendance rate
    const entries = [
      attendance({ id: "a1", mark: "late" }),
      attendance({ id: "a2", mark: "late" }),
    ];
    const result = computeAttendanceStats(entries);
    expect(result.attendance_rate).toBe(100);
  });

  it("handles a single entry correctly", () => {
    const result = computeAttendanceStats([attendance({ mark: "present" })]);
    expect(result.total_sessions).toBe(1);
    expect(result.present).toBe(1);
    expect(result.attendance_rate).toBe(100);
    expect(result.unauthorised_rate).toBe(0);
  });
});

// -- computeEducationProfile ------------------------------------------------

describe("computeEducationProfile", () => {
  it("returns zero stats for empty inputs", () => {
    const result = computeEducationProfile([], [], []);
    expect(result.total_children).toBe(0);
    expect(result.neet_count).toBe(0);
    expect(result.excluded_count).toBe(0);
    expect(result.sen_count).toBe(0);
    expect(result.ehcp_count).toBe(0);
    expect(result.avg_attendance).toBe(0);
    expect(result.pep_overdue).toBe(0);
    expect(result.activity_count_30d).toBe(0);
    expect(result.activity_categories).toEqual({});
  });

  it("counts total unique children across all records", () => {
    const records = [
      eduRecord({ id: "e1", child_id: "c1" }),
      eduRecord({ id: "e2", child_id: "c2" }),
      eduRecord({ id: "e3", child_id: "c1" }), // duplicate child
    ];
    const result = computeEducationProfile(records, [], []);
    expect(result.total_children).toBe(2);
  });

  it("counts unique NEET children", () => {
    const records = [
      eduRecord({ id: "e1", child_id: "c1", education_status: "neet" }),
      eduRecord({ id: "e2", child_id: "c1", education_status: "neet" }), // same child
      eduRecord({ id: "e3", child_id: "c2", education_status: "full_time_school" }),
    ];
    const result = computeEducationProfile(records, [], []);
    expect(result.neet_count).toBe(1);
  });

  it("counts unique excluded children", () => {
    const records = [
      eduRecord({ id: "e1", child_id: "c1", education_status: "excluded" }),
      eduRecord({ id: "e2", child_id: "c2", education_status: "excluded" }),
      eduRecord({ id: "e3", child_id: "c3", education_status: "full_time_school" }),
    ];
    const result = computeEducationProfile(records, [], []);
    expect(result.excluded_count).toBe(2);
  });

  it("counts unique SEN children (non-null and non-none)", () => {
    const records = [
      eduRecord({ id: "e1", child_id: "c1", sen_status: "sen_support" }),
      eduRecord({ id: "e2", child_id: "c2", sen_status: "ehcp" }),
      eduRecord({ id: "e3", child_id: "c3", sen_status: "none" }),
      eduRecord({ id: "e4", child_id: "c4", sen_status: null }),
    ];
    const result = computeEducationProfile(records, [], []);
    expect(result.sen_count).toBe(2);
  });

  it("counts unique EHCP children", () => {
    const records = [
      eduRecord({ id: "e1", child_id: "c1", sen_status: "ehcp" }),
      eduRecord({ id: "e2", child_id: "c2", sen_status: "ehcp" }),
      eduRecord({ id: "e3", child_id: "c3", sen_status: "sen_support" }),
    ];
    const result = computeEducationProfile(records, [], []);
    expect(result.ehcp_count).toBe(2);
  });

  it("calculates avg_attendance from non-null attendance_percentage values", () => {
    const records = [
      eduRecord({ id: "e1", attendance_percentage: 90 }),
      eduRecord({ id: "e2", attendance_percentage: 80 }),
      eduRecord({ id: "e3", attendance_percentage: null }),
    ];
    const result = computeEducationProfile(records, [], []);
    // (90 + 80) / 2 = 85.0
    expect(result.avg_attendance).toBe(85);
  });

  it("returns 0 avg_attendance when all attendance_percentage values are null", () => {
    const records = [
      eduRecord({ id: "e1", attendance_percentage: null }),
      eduRecord({ id: "e2", attendance_percentage: null }),
    ];
    const result = computeEducationProfile(records, [], []);
    expect(result.avg_attendance).toBe(0);
  });

  it("rounds avg_attendance to one decimal place", () => {
    const records = [
      eduRecord({ id: "e1", attendance_percentage: 91 }),
      eduRecord({ id: "e2", attendance_percentage: 92 }),
      eduRecord({ id: "e3", attendance_percentage: 93 }),
    ];
    const result = computeEducationProfile(records, [], []);
    // (91 + 92 + 93) / 3 = 92.0
    expect(result.avg_attendance).toBe(92);
  });

  it("counts PEP overdue records (next_pep_date in the past)", () => {
    const records = [
      eduRecord({ id: "e1", next_pep_date: "2020-01-01" }), // overdue
      eduRecord({ id: "e2", next_pep_date: "2020-06-01" }), // overdue
      eduRecord({ id: "e3", next_pep_date: "2099-12-31" }), // future
      eduRecord({ id: "e4", next_pep_date: null }),          // no date
    ];
    const result = computeEducationProfile(records, [], []);
    expect(result.pep_overdue).toBe(2);
  });

  it("counts activities within the last 30 days", () => {
    const today = new Date();
    const recent = new Date(today.getTime() - 5 * 86400000).toISOString().slice(0, 10);
    const old = new Date(today.getTime() - 60 * 86400000).toISOString().slice(0, 10);

    const activities = [
      activity({ id: "a1", date: recent }),
      activity({ id: "a2", date: recent }),
      activity({ id: "a3", date: old }),
    ];
    const result = computeEducationProfile([], [], activities);
    expect(result.activity_count_30d).toBe(2);
  });

  it("groups recent activities by category", () => {
    const today = new Date();
    const recent = new Date(today.getTime() - 5 * 86400000).toISOString().slice(0, 10);

    const activities = [
      activity({ id: "a1", category: "sport", date: recent }),
      activity({ id: "a2", category: "sport", date: recent }),
      activity({ id: "a3", category: "creative", date: recent }),
    ];
    const result = computeEducationProfile([], [], activities);
    expect(result.activity_categories).toEqual({ sport: 2, creative: 1 });
  });

  it("excludes old activities from category counts", () => {
    const old = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
    const activities = [
      activity({ id: "a1", category: "sport", date: old }),
    ];
    const result = computeEducationProfile([], [], activities);
    expect(result.activity_categories).toEqual({});
    expect(result.activity_count_30d).toBe(0);
  });
});

// -- computeActivityEngagement ----------------------------------------------

describe("computeActivityEngagement", () => {
  it("returns zero stats for an empty array", () => {
    const result = computeActivityEngagement([]);
    expect(result.total_activities).toBe(0);
    expect(result.unique_children).toBe(0);
    expect(result.enjoyment_rate).toBe(0);
    expect(result.avg_duration).toBe(0);
    expect(result.by_category).toEqual({});
    expect(result.top_skills).toEqual([]);
    expect(result.feedback_rate).toBe(0);
  });

  it("counts total activities", () => {
    const activities = [
      activity({ id: "a1" }),
      activity({ id: "a2" }),
      activity({ id: "a3" }),
    ];
    const result = computeActivityEngagement(activities);
    expect(result.total_activities).toBe(3);
  });

  it("counts unique children", () => {
    const activities = [
      activity({ id: "a1", child_id: "c1" }),
      activity({ id: "a2", child_id: "c2" }),
      activity({ id: "a3", child_id: "c1" }), // duplicate
    ];
    const result = computeActivityEngagement(activities);
    expect(result.unique_children).toBe(2);
  });

  it("calculates enjoyment_rate as percentage with one decimal", () => {
    const activities = [
      activity({ id: "a1", child_enjoyed: true }),
      activity({ id: "a2", child_enjoyed: true }),
      activity({ id: "a3", child_enjoyed: false }),
    ];
    const result = computeActivityEngagement(activities);
    // 2/3 * 100 = 66.666... -> 66.7
    expect(result.enjoyment_rate).toBe(66.7);
  });

  it("returns 100% enjoyment_rate when all children enjoyed", () => {
    const activities = [
      activity({ id: "a1", child_enjoyed: true }),
      activity({ id: "a2", child_enjoyed: true }),
    ];
    const result = computeActivityEngagement(activities);
    expect(result.enjoyment_rate).toBe(100);
  });

  it("returns 0% enjoyment_rate when no children enjoyed", () => {
    const activities = [
      activity({ id: "a1", child_enjoyed: false }),
      activity({ id: "a2", child_enjoyed: false }),
    ];
    const result = computeActivityEngagement(activities);
    expect(result.enjoyment_rate).toBe(0);
  });

  it("calculates avg_duration from non-null durations, rounded to integer", () => {
    const activities = [
      activity({ id: "a1", duration_minutes: 60 }),
      activity({ id: "a2", duration_minutes: 45 }),
      activity({ id: "a3", duration_minutes: null }),
    ];
    const result = computeActivityEngagement(activities);
    // (60 + 45) / 2 = 52.5 -> 53 (rounded)
    expect(result.avg_duration).toBe(53);
  });

  it("returns 0 avg_duration when all durations are null", () => {
    const activities = [
      activity({ id: "a1", duration_minutes: null }),
      activity({ id: "a2", duration_minutes: null }),
    ];
    const result = computeActivityEngagement(activities);
    expect(result.avg_duration).toBe(0);
  });

  it("groups activities by category", () => {
    const activities = [
      activity({ id: "a1", category: "sport" }),
      activity({ id: "a2", category: "sport" }),
      activity({ id: "a3", category: "creative" }),
      activity({ id: "a4", category: "social" }),
    ];
    const result = computeActivityEngagement(activities);
    expect(result.by_category).toEqual({ sport: 2, creative: 1, social: 1 });
  });

  it("returns top 5 skills sorted by count descending", () => {
    const activities = [
      activity({ id: "a1", skills_developed: ["teamwork", "leadership", "communication"] }),
      activity({ id: "a2", skills_developed: ["teamwork", "resilience"] }),
      activity({ id: "a3", skills_developed: ["teamwork", "leadership", "creativity"] }),
      activity({ id: "a4", skills_developed: ["communication", "creativity", "problem_solving"] }),
    ];
    const result = computeActivityEngagement(activities);
    // teamwork: 3, leadership: 2, communication: 2, creativity: 2, resilience: 1, problem_solving: 1
    expect(result.top_skills).toHaveLength(5);
    expect(result.top_skills[0].skill).toBe("teamwork");
    expect(result.top_skills[0].count).toBe(3);
  });

  it("limits top_skills to 5 even when more skills exist", () => {
    const activities = [
      activity({
        id: "a1",
        skills_developed: ["s1", "s2", "s3", "s4", "s5", "s6", "s7"],
      }),
    ];
    const result = computeActivityEngagement(activities);
    expect(result.top_skills).toHaveLength(5);
  });

  it("returns empty top_skills when no skills_developed exist", () => {
    const activities = [
      activity({ id: "a1", skills_developed: [] }),
      activity({ id: "a2", skills_developed: [] }),
    ];
    const result = computeActivityEngagement(activities);
    expect(result.top_skills).toEqual([]);
  });

  it("calculates feedback_rate as percentage with one decimal", () => {
    const activities = [
      activity({ id: "a1", child_feedback: "Great fun!" }),
      activity({ id: "a2", child_feedback: null }),
      activity({ id: "a3", child_feedback: "" }),
    ];
    const result = computeActivityEngagement(activities);
    // 1/3 * 100 = 33.333... -> 33.3
    expect(result.feedback_rate).toBe(33.3);
  });

  it("treats empty string feedback as not provided", () => {
    const activities = [
      activity({ id: "a1", child_feedback: "" }),
      activity({ id: "a2", child_feedback: "" }),
    ];
    const result = computeActivityEngagement(activities);
    expect(result.feedback_rate).toBe(0);
  });

  it("treats non-empty feedback as provided", () => {
    const activities = [
      activity({ id: "a1", child_feedback: "Loved it" }),
      activity({ id: "a2", child_feedback: "Good" }),
    ];
    const result = computeActivityEngagement(activities);
    expect(result.feedback_rate).toBe(100);
  });
});

// -- identifyEducationAlerts ------------------------------------------------

describe("identifyEducationAlerts", () => {
  it("returns empty alerts for empty inputs", () => {
    const result = identifyEducationAlerts([], []);
    expect(result).toEqual([]);
  });

  it("flags NEET children with critical severity", () => {
    const records = [
      eduRecord({ child_id: "c1", education_status: "neet", attendance_percentage: null }),
    ];
    const result = identifyEducationAlerts(records, []);
    const neetAlerts = result.filter((a) => a.type === "neet");
    expect(neetAlerts).toHaveLength(1);
    expect(neetAlerts[0].severity).toBe("critical");
    expect(neetAlerts[0].child_id).toBe("c1");
  });

  it("flags currently excluded children with high severity", () => {
    const records = [
      eduRecord({ child_id: "c1", education_status: "excluded", attendance_percentage: null }),
    ];
    const result = identifyEducationAlerts(records, []);
    const excludedAlerts = result.filter((a) => a.type === "excluded");
    expect(excludedAlerts).toHaveLength(1);
    expect(excludedAlerts[0].severity).toBe("high");
    expect(excludedAlerts[0].child_id).toBe("c1");
  });

  it("flags children awaiting school placement with high severity", () => {
    const records = [
      eduRecord({ child_id: "c1", education_status: "awaiting_placement", attendance_percentage: null }),
    ];
    const result = identifyEducationAlerts(records, []);
    const placementAlerts = result.filter((a) => a.type === "no_school_placement");
    expect(placementAlerts).toHaveLength(1);
    expect(placementAlerts[0].severity).toBe("high");
    expect(placementAlerts[0].child_id).toBe("c1");
  });

  it("flags persistent absence (< 50%) with critical severity", () => {
    const records = [
      eduRecord({ child_id: "c1", attendance_percentage: 40 }),
    ];
    const result = identifyEducationAlerts(records, []);
    const absenceAlerts = result.filter((a) => a.type === "persistent_absence");
    expect(absenceAlerts).toHaveLength(1);
    expect(absenceAlerts[0].severity).toBe("critical");
    expect(absenceAlerts[0].message).toContain("40%");
  });

  it("flags low attendance (< 85%) with high severity", () => {
    const records = [
      eduRecord({ child_id: "c1", attendance_percentage: 80 }),
    ];
    const result = identifyEducationAlerts(records, []);
    const lowAlerts = result.filter((a) => a.type === "low_attendance");
    expect(lowAlerts).toHaveLength(1);
    expect(lowAlerts[0].severity).toBe("high");
  });

  it("flags low attendance (85-89%) with medium severity", () => {
    const records = [
      eduRecord({ child_id: "c1", attendance_percentage: 87 }),
    ];
    const result = identifyEducationAlerts(records, []);
    const lowAlerts = result.filter((a) => a.type === "low_attendance");
    expect(lowAlerts).toHaveLength(1);
    expect(lowAlerts[0].severity).toBe("medium");
  });

  it("does not flag attendance at exactly 90%", () => {
    const records = [
      eduRecord({ child_id: "c1", attendance_percentage: 90 }),
    ];
    const result = identifyEducationAlerts(records, []);
    const attendanceAlerts = result.filter(
      (a) => a.type === "low_attendance" || a.type === "persistent_absence",
    );
    expect(attendanceAlerts).toHaveLength(0);
  });

  it("does not flag attendance when null", () => {
    const records = [
      eduRecord({ child_id: "c1", attendance_percentage: null }),
    ];
    const result = identifyEducationAlerts(records, []);
    const attendanceAlerts = result.filter(
      (a) => a.type === "low_attendance" || a.type === "persistent_absence",
    );
    expect(attendanceAlerts).toHaveLength(0);
  });

  it("flags overdue PEP review with medium severity", () => {
    const records = [
      eduRecord({ child_id: "c1", next_pep_date: "2020-01-01" }),
    ];
    const result = identifyEducationAlerts(records, []);
    const pepAlerts = result.filter((a) => a.type === "pep_overdue");
    expect(pepAlerts).toHaveLength(1);
    expect(pepAlerts[0].severity).toBe("medium");
    expect(pepAlerts[0].message).toContain("2020-01-01");
  });

  it("does not flag PEP when next_pep_date is in the future", () => {
    const records = [
      eduRecord({ child_id: "c1", next_pep_date: "2099-12-31" }),
    ];
    const result = identifyEducationAlerts(records, []);
    const pepAlerts = result.filter((a) => a.type === "pep_overdue");
    expect(pepAlerts).toHaveLength(0);
  });

  it("does not flag PEP when next_pep_date is null", () => {
    const records = [
      eduRecord({ child_id: "c1", next_pep_date: null }),
    ];
    const result = identifyEducationAlerts(records, []);
    const pepAlerts = result.filter((a) => a.type === "pep_overdue");
    expect(pepAlerts).toHaveLength(0);
  });

  it("generates multiple alerts for the same child when applicable", () => {
    const records = [
      eduRecord({
        child_id: "c1",
        education_status: "neet",
        attendance_percentage: 30,
        next_pep_date: "2020-01-01",
      }),
    ];
    const result = identifyEducationAlerts(records, []);
    // Should have: neet (critical) + persistent_absence (critical) + pep_overdue (medium)
    expect(result.length).toBeGreaterThanOrEqual(3);
    const types = result.map((a) => a.type);
    expect(types).toContain("neet");
    expect(types).toContain("persistent_absence");
    expect(types).toContain("pep_overdue");
  });

  it("does not generate alerts for children with good status", () => {
    const records = [
      eduRecord({
        child_id: "c1",
        education_status: "full_time_school",
        attendance_percentage: 95,
        next_pep_date: "2099-12-31",
      }),
    ];
    const result = identifyEducationAlerts(records, []);
    expect(result).toEqual([]);
  });

  it("boundary: attendance at exactly 50% triggers low_attendance, not persistent_absence", () => {
    const records = [
      eduRecord({ child_id: "c1", attendance_percentage: 50 }),
    ];
    const result = identifyEducationAlerts(records, []);
    const persistent = result.filter((a) => a.type === "persistent_absence");
    const low = result.filter((a) => a.type === "low_attendance");
    expect(persistent).toHaveLength(0);
    expect(low).toHaveLength(1);
  });

  it("boundary: attendance at exactly 85% triggers low_attendance with medium severity", () => {
    const records = [
      eduRecord({ child_id: "c1", attendance_percentage: 85 }),
    ];
    const result = identifyEducationAlerts(records, []);
    const low = result.filter((a) => a.type === "low_attendance");
    expect(low).toHaveLength(1);
    expect(low[0].severity).toBe("medium");
  });
});

// -- Constants --------------------------------------------------------------

describe("EDUCATION_STATUSES", () => {
  it("has exactly 10 statuses", () => {
    expect(EDUCATION_STATUSES).toHaveLength(10);
  });

  it("each entry has status and label strings", () => {
    for (const es of EDUCATION_STATUSES) {
      expect(typeof es.status).toBe("string");
      expect(es.status.length).toBeGreaterThan(0);
      expect(typeof es.label).toBe("string");
      expect(es.label.length).toBeGreaterThan(0);
    }
  });

  it("has unique status identifiers", () => {
    const statuses = EDUCATION_STATUSES.map((es) => es.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("includes full_time_school as the first status", () => {
    expect(EDUCATION_STATUSES[0].status).toBe("full_time_school");
    expect(EDUCATION_STATUSES[0].label).toBe("Full-Time School");
  });

  it("includes awaiting_placement as the last status", () => {
    const last = EDUCATION_STATUSES[EDUCATION_STATUSES.length - 1];
    expect(last.status).toBe("awaiting_placement");
    expect(last.label).toBe("Awaiting School Placement");
  });

  it("includes neet and excluded statuses", () => {
    const statuses = EDUCATION_STATUSES.map((es) => es.status);
    expect(statuses).toContain("neet");
    expect(statuses).toContain("excluded");
  });
});

describe("ATTENDANCE_MARKS", () => {
  it("has exactly 7 marks", () => {
    expect(ATTENDANCE_MARKS).toHaveLength(7);
  });

  it("all items are non-empty strings", () => {
    for (const mark of ATTENDANCE_MARKS) {
      expect(typeof mark).toBe("string");
      expect(mark.length).toBeGreaterThan(0);
    }
  });

  it("has unique values with no duplicates", () => {
    expect(new Set(ATTENDANCE_MARKS).size).toBe(ATTENDANCE_MARKS.length);
  });

  it("starts with present", () => {
    expect(ATTENDANCE_MARKS[0]).toBe("present");
  });

  it("ends with activity", () => {
    expect(ATTENDANCE_MARKS[ATTENDANCE_MARKS.length - 1]).toBe("activity");
  });

  it("includes authorised_absence and unauthorised_absence", () => {
    expect(ATTENDANCE_MARKS).toContain("authorised_absence");
    expect(ATTENDANCE_MARKS).toContain("unauthorised_absence");
  });
});

describe("ACTIVITY_CATEGORIES", () => {
  it("has exactly 10 categories", () => {
    expect(ACTIVITY_CATEGORIES).toHaveLength(10);
  });

  it("each entry has category and label strings", () => {
    for (const ac of ACTIVITY_CATEGORIES) {
      expect(typeof ac.category).toBe("string");
      expect(ac.category.length).toBeGreaterThan(0);
      expect(typeof ac.label).toBe("string");
      expect(ac.label.length).toBeGreaterThan(0);
    }
  });

  it("has unique category identifiers", () => {
    const categories = ACTIVITY_CATEGORIES.map((ac) => ac.category);
    expect(new Set(categories).size).toBe(categories.length);
  });

  it("includes sport as the first category", () => {
    expect(ACTIVITY_CATEGORIES[0].category).toBe("sport");
    expect(ACTIVITY_CATEGORIES[0].label).toBe("Sport & Physical Activity");
  });

  it("includes employment as the last category", () => {
    const last = ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
    expect(last.category).toBe("employment");
    expect(last.label).toBe("Employment/Work Experience");
  });

  it("includes therapeutic and outdoor categories", () => {
    const categories = ACTIVITY_CATEGORIES.map((ac) => ac.category);
    expect(categories).toContain("therapeutic");
    expect(categories).toContain("outdoor");
  });
});

describe("EXCLUSION_TYPES", () => {
  it("has exactly 4 types", () => {
    expect(EXCLUSION_TYPES).toHaveLength(4);
  });

  it("all items are non-empty strings", () => {
    for (const et of EXCLUSION_TYPES) {
      expect(typeof et).toBe("string");
      expect(et.length).toBeGreaterThan(0);
    }
  });

  it("has unique values with no duplicates", () => {
    expect(new Set(EXCLUSION_TYPES).size).toBe(EXCLUSION_TYPES.length);
  });

  it("starts with fixed_term", () => {
    expect(EXCLUSION_TYPES[0]).toBe("fixed_term");
  });

  it("ends with informal", () => {
    expect(EXCLUSION_TYPES[EXCLUSION_TYPES.length - 1]).toBe("informal");
  });

  it("includes permanent and internal", () => {
    expect(EXCLUSION_TYPES).toContain("permanent");
    expect(EXCLUSION_TYPES).toContain("internal");
  });
});

describe("PEP_TARGETS_STATUS", () => {
  it("has exactly 5 statuses", () => {
    expect(PEP_TARGETS_STATUS).toHaveLength(5);
  });

  it("all items are non-empty strings", () => {
    for (const ps of PEP_TARGETS_STATUS) {
      expect(typeof ps).toBe("string");
      expect(ps.length).toBeGreaterThan(0);
    }
  });

  it("has unique values with no duplicates", () => {
    expect(new Set(PEP_TARGETS_STATUS).size).toBe(PEP_TARGETS_STATUS.length);
  });

  it("starts with not_started", () => {
    expect(PEP_TARGETS_STATUS[0]).toBe("not_started");
  });

  it("ends with not_achieved", () => {
    expect(PEP_TARGETS_STATUS[PEP_TARGETS_STATUS.length - 1]).toBe("not_achieved");
  });

  it("includes in_progress and achieved", () => {
    expect(PEP_TARGETS_STATUS).toContain("in_progress");
    expect(PEP_TARGETS_STATUS).toContain("achieved");
  });

  it("includes partially_achieved", () => {
    expect(PEP_TARGETS_STATUS).toContain("partially_achieved");
  });
});
