import { describe, it, expect } from "vitest";
import {
  computeAttendanceStats,
  computeEducationProfile,
  computeActivityEngagement,
  identifyEducationAlerts,
  type AttendanceEntry,
  type EducationRecord,
  type ActivityRecord,
} from "./education-service";

function makeAttendance(overrides: Partial<AttendanceEntry> = {}): AttendanceEntry {
  return {
    id: "att-1",
    home_id: "home-1",
    child_id: "child-1",
    education_record_id: "er-1",
    date: "2026-05-01",
    mark: "present",
    session: "am",
    notes: null,
    recorded_by: "Staff A",
    created_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeEducationRecord(overrides: Partial<EducationRecord> = {}): EducationRecord {
  return {
    id: "er-1",
    home_id: "home-1",
    child_id: "child-1",
    education_status: "full_time_school",
    school_name: "Test School",
    year_group: "Year 9",
    sen_status: "none",
    pupil_premium_plus: true,
    virtual_school_contact: "VSC",
    designated_teacher: "DT",
    pep_date: "2026-04-01",
    next_pep_date: "2026-07-01",
    attendance_percentage: 95,
    exclusion_count: 0,
    achievements: [],
    concerns: [],
    is_current: true,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeActivity(overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  return {
    id: "act-1",
    home_id: "home-1",
    child_id: "child-1",
    activity_name: "Football",
    category: "sport",
    date: "2026-05-15",
    duration_minutes: 60,
    location: "Park",
    description: "Match",
    child_feedback: "Fun!",
    child_enjoyed: true,
    skills_developed: ["teamwork"],
    staff_member: "Staff A",
    created_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

describe("education-service", () => {
  // ── computeAttendanceStats ────────────────────────────────────────

  describe("computeAttendanceStats", () => {
    it("returns zeroes for empty data", () => {
      const s = computeAttendanceStats([]);
      expect(s.total_sessions).toBe(0);
      expect(s.present).toBe(0);
      // fab-0: null when no sessions to compute rates over.
      expect(s.attendance_rate).toBeNull();
      expect(s.unauthorised_rate).toBeNull();
    });

    it("counts marks and computes rates correctly", () => {
      const entries = [
        makeAttendance({ id: "1", mark: "present" }),
        makeAttendance({ id: "2", mark: "present" }),
        makeAttendance({ id: "3", mark: "late" }),
        makeAttendance({ id: "4", mark: "unauthorised_absence" }),
        makeAttendance({ id: "5", mark: "excluded" }),
      ];
      const s = computeAttendanceStats(entries);
      expect(s.total_sessions).toBe(5);
      expect(s.present).toBe(2);
      expect(s.late).toBe(1);
      expect(s.unauthorised_absence).toBe(1);
      expect(s.excluded).toBe(1);
      // attendance_rate: (present + late) / total = 3/5 = 60%
      expect(s.attendance_rate).toBe(60);
      // unauthorised_rate: 1/5 = 20%
      expect(s.unauthorised_rate).toBe(20);
    });
  });

  // ── computeActivityEngagement ─────────────────────────────────────

  describe("computeActivityEngagement", () => {
    it("returns zeroes for empty data", () => {
      const r = computeActivityEngagement([]);
      expect(r.total_activities).toBe(0);
      expect(r.unique_children).toBe(0);
      expect(r.enjoyment_rate).toBeNull();
      expect(r.avg_duration).toBeNull();
      expect(r.feedback_rate).toBeNull();
    });

    it("computes engagement metrics for populated data", () => {
      const activities = [
        makeActivity({ id: "1", child_id: "c1", child_enjoyed: true, duration_minutes: 60, child_feedback: "Great!", skills_developed: ["teamwork", "fitness"] }),
        makeActivity({ id: "2", child_id: "c2", child_enjoyed: false, duration_minutes: 30, child_feedback: null, skills_developed: ["teamwork"] }),
      ];
      const r = computeActivityEngagement(activities);
      expect(r.total_activities).toBe(2);
      expect(r.unique_children).toBe(2);
      expect(r.enjoyment_rate).toBe(50);
      expect(r.avg_duration).toBe(45);
      expect(r.feedback_rate).toBe(50);
      expect(r.by_category["sport"]).toBe(2);
      expect(r.top_skills[0].skill).toBe("teamwork");
      expect(r.top_skills[0].count).toBe(2);
    });
  });

  // ── identifyEducationAlerts ───────────────────────────────────────

  describe("identifyEducationAlerts", () => {
    it("returns empty for empty data", () => {
      expect(identifyEducationAlerts([], [])).toHaveLength(0);
    });

    it("fires neet alert for NEET status", () => {
      const rec = makeEducationRecord({ education_status: "neet" });
      const alerts = identifyEducationAlerts([rec], []);
      const found = alerts.filter((a) => a.type === "neet");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
    });

    it("fires excluded alert for excluded status", () => {
      const rec = makeEducationRecord({ education_status: "excluded" });
      const alerts = identifyEducationAlerts([rec], []);
      const found = alerts.filter((a) => a.type === "excluded");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires persistent_absence for attendance < 50%", () => {
      const rec = makeEducationRecord({ attendance_percentage: 45 });
      const alerts = identifyEducationAlerts([rec], []);
      const found = alerts.filter((a) => a.type === "persistent_absence");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
    });

    it("fires low_attendance for attendance < 90% but >= 50%", () => {
      const rec = makeEducationRecord({ attendance_percentage: 80 });
      const alerts = identifyEducationAlerts([rec], []);
      const found = alerts.filter((a) => a.type === "low_attendance");
      expect(found).toHaveLength(1);
      // < 85 => high severity
      expect(found[0].severity).toBe("high");
    });

    it("fires low_attendance as medium for attendance 85-89%", () => {
      const rec = makeEducationRecord({ attendance_percentage: 87 });
      const alerts = identifyEducationAlerts([rec], []);
      const found = alerts.filter((a) => a.type === "low_attendance");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("fires pep_overdue when next_pep_date is in the past", () => {
      const rec = makeEducationRecord({ next_pep_date: "2026-01-01" });
      const alerts = identifyEducationAlerts([rec], []);
      const found = alerts.filter((a) => a.type === "pep_overdue");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("fires no_school_placement for awaiting_placement status", () => {
      const rec = makeEducationRecord({ education_status: "awaiting_placement" });
      const alerts = identifyEducationAlerts([rec], []);
      const found = alerts.filter((a) => a.type === "no_school_placement");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });
  });
});
