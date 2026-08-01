import { describe, it, expect } from "vitest";
import {
  computeEducationAttendanceMetrics,
  identifyEducationAttendanceAlerts,
  type EducationAttendanceTrackingRecord,
} from "./education-attendance-tracking-service";

function makeRecord(overrides: Partial<EducationAttendanceTrackingRecord> = {}): EducationAttendanceTrackingRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    attendance_status: "present",
    absence_reason: "none",
    school_engagement: "fully_engaged",
    education_setting: "mainstream_school",
    attendance_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    recorded_by: "Staff A",
    school_contacted: true,
    reason_documented: true,
    return_plan_in_place: false,
    pep_up_to_date: true,
    virtual_school_informed: false,
    social_worker_informed: false,
    child_views_sought: true,
    alternative_education_arranged: false,
    homework_supported: true,
    achievement_celebrated: true,
    parent_informed: false,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    sessions_attended: 2,
    sessions_possible: 2,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("education-attendance-tracking-service", () => {
  // ── computeEducationAttendanceMetrics ─────────────────────────────

  describe("computeEducationAttendanceMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeEducationAttendanceMetrics([]);
      expect(m.total_records).toBe(0);
      expect(m.present_count).toBe(0);
      expect(m.unauthorised_count).toBe(0);
      expect(m.exclusion_count).toBe(0);
      expect(m.refused_count).toBe(0);
      expect(m.attendance_percentage).toBeNull();;
      expect(m.unique_children).toBe(0);
    });

    it("counts present, unauthorised, exclusion, and refused correctly", () => {
      const records = [
        makeRecord({ id: "1", attendance_status: "present", absence_reason: "none" }),
        makeRecord({ id: "2", attendance_status: "unauthorised_absence", absence_reason: "refused_to_attend" }),
        makeRecord({ id: "3", attendance_status: "fixed_term_exclusion", absence_reason: "exclusion" }),
        makeRecord({ id: "4", attendance_status: "permanent_exclusion", absence_reason: "exclusion" }),
        makeRecord({ id: "5", attendance_status: "internal_exclusion", absence_reason: "exclusion" }),
      ];
      const m = computeEducationAttendanceMetrics(records);
      expect(m.present_count).toBe(1);
      expect(m.unauthorised_count).toBe(1);
      expect(m.exclusion_count).toBe(3);
      expect(m.refused_count).toBe(1);
    });

    it("computes attendance_percentage from sessions", () => {
      const records = [
        makeRecord({ id: "1", sessions_attended: 8, sessions_possible: 10 }),
        makeRecord({ id: "2", sessions_attended: 6, sessions_possible: 10 }),
      ];
      const m = computeEducationAttendanceMetrics(records);
      // (8+6)/(10+10) = 14/20 = 70%
      expect(m.attendance_percentage).toBe(70);
    });

    it("computes boolean rates correctly", () => {
      const records = [
        makeRecord({ id: "1", school_contacted: true, pep_up_to_date: true, child_views_sought: true }),
        makeRecord({ id: "2", school_contacted: false, pep_up_to_date: false, child_views_sought: false }),
      ];
      const m = computeEducationAttendanceMetrics(records);
      expect(m.school_contacted_rate).toBe(50);
      expect(m.pep_up_to_date_rate).toBe(50);
      expect(m.child_views_rate).toBe(50);
    });

    it("builds by_attendance_status and by_absence_reason breakdowns", () => {
      const records = [
        makeRecord({ id: "1", attendance_status: "present", absence_reason: "none" }),
        makeRecord({ id: "2", attendance_status: "present", absence_reason: "none" }),
        makeRecord({ id: "3", attendance_status: "authorised_absence", absence_reason: "illness" }),
      ];
      const m = computeEducationAttendanceMetrics(records);
      expect(m.by_attendance_status["present"]).toBe(2);
      expect(m.by_attendance_status["authorised_absence"]).toBe(1);
      expect(m.by_absence_reason["none"]).toBe(2);
      expect(m.by_absence_reason["illness"]).toBe(1);
    });
  });

  // ── identifyEducationAttendanceAlerts ──────────────────────────────

  describe("identifyEducationAttendanceAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyEducationAttendanceAlerts([])).toHaveLength(0);
    });

    it("fires permanent_exclusion alert", () => {
      const rec = makeRecord({
        id: "pe-1",
        attendance_status: "permanent_exclusion",
      });
      const alerts = identifyEducationAttendanceAlerts([rec]);
      const found = alerts.filter((a) => a.type === "permanent_exclusion");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
    });

    it("fires pep_not_current when >= 1 record has PEP not up to date", () => {
      const rec = makeRecord({ id: "pep-1", pep_up_to_date: false });
      const alerts = identifyEducationAttendanceAlerts([rec]);
      const found = alerts.filter((a) => a.type === "pep_not_current");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires school_not_contacted when >= 1 absence without school contact", () => {
      const rec = makeRecord({
        id: "sc-1",
        attendance_status: "unauthorised_absence",
        school_contacted: false,
      });
      const alerts = identifyEducationAttendanceAlerts([rec]);
      const found = alerts.filter((a) => a.type === "school_not_contacted");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires child_views_not_sought when >= 2 records without child views", () => {
      const records = [
        makeRecord({ id: "cv-1", child_views_sought: false }),
        makeRecord({ id: "cv-2", child_views_sought: false }),
      ];
      const alerts = identifyEducationAttendanceAlerts(records);
      const found = alerts.filter((a) => a.type === "child_views_not_sought");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("fires achievement_not_celebrated when >= 3 records without celebration", () => {
      const records = [
        makeRecord({ id: "ac-1", achievement_celebrated: false }),
        makeRecord({ id: "ac-2", achievement_celebrated: false }),
        makeRecord({ id: "ac-3", achievement_celebrated: false }),
      ];
      const alerts = identifyEducationAttendanceAlerts(records);
      const found = alerts.filter((a) => a.type === "achievement_not_celebrated");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("does not fire child_views_not_sought with only 1 record", () => {
      const records = [makeRecord({ id: "cv-1", child_views_sought: false })];
      const alerts = identifyEducationAttendanceAlerts(records);
      const found = alerts.filter((a) => a.type === "child_views_not_sought");
      expect(found).toHaveLength(0);
    });
  });
});
