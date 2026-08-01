import { describe, it, expect } from "vitest";
import { _testing, type EducationAttendanceTrackingRecord } from "../education-attendance-tracking-service";

const { computeEducationAttendanceMetrics, identifyEducationAttendanceAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<EducationAttendanceTrackingRecord>): EducationAttendanceTrackingRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    attendance_status: overrides?.attendance_status ?? "present",
    absence_reason: overrides?.absence_reason ?? "none",
    school_engagement: overrides?.school_engagement ?? "fully_engaged",
    education_setting: overrides?.education_setting ?? "mainstream_school",
    attendance_date: overrides?.attendance_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    recorded_by: overrides?.recorded_by ?? "Staff A",
    school_contacted: overrides?.school_contacted ?? true,
    reason_documented: overrides?.reason_documented ?? true,
    return_plan_in_place: overrides?.return_plan_in_place ?? true,
    pep_up_to_date: overrides?.pep_up_to_date ?? true,
    virtual_school_informed: overrides?.virtual_school_informed ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    child_views_sought: overrides?.child_views_sought ?? true,
    alternative_education_arranged: overrides?.alternative_education_arranged ?? true,
    homework_supported: overrides?.homework_supported ?? true,
    achievement_celebrated: overrides?.achievement_celebrated ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    sessions_attended: overrides?.sessions_attended ?? 2,
    sessions_possible: overrides?.sessions_possible ?? 2,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("education-attendance-tracking-service", () => {
  describe("computeEducationAttendanceMetrics", () => {
    it("returns zeros for empty", () => { const m = computeEducationAttendanceMetrics([]); expect(m.total_records).toBe(0); expect(m.present_count).toBe(0); expect(m.unauthorised_count).toBe(0); expect(m.exclusion_count).toBe(0); expect(m.refused_count).toBe(0); expect(m.school_contacted_rate).toBeNull(); expect(m.attendance_percentage).toBeNull(); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeEducationAttendanceMetrics([]); expect(m.by_attendance_status).toEqual({}); expect(m.by_absence_reason).toEqual({}); expect(m.by_school_engagement).toEqual({}); expect(m.by_education_setting).toEqual({}); });
    it("counts present", () => { expect(computeEducationAttendanceMetrics([makeRecord()]).present_count).toBe(1); });
    it("counts unauthorised", () => { expect(computeEducationAttendanceMetrics([makeRecord({ attendance_status: "unauthorised_absence" })]).unauthorised_count).toBe(1); });
    it("counts exclusion fixed_term", () => { expect(computeEducationAttendanceMetrics([makeRecord({ attendance_status: "fixed_term_exclusion" })]).exclusion_count).toBe(1); });
    it("counts exclusion permanent", () => { expect(computeEducationAttendanceMetrics([makeRecord({ attendance_status: "permanent_exclusion" })]).exclusion_count).toBe(1); });
    it("counts exclusion internal", () => { expect(computeEducationAttendanceMetrics([makeRecord({ attendance_status: "internal_exclusion" })]).exclusion_count).toBe(1); });
    it("exclusion_count combines all types", () => { const m = computeEducationAttendanceMetrics([makeRecord({ attendance_status: "fixed_term_exclusion" }), makeRecord({ attendance_status: "permanent_exclusion" }), makeRecord({ attendance_status: "internal_exclusion" })]); expect(m.exclusion_count).toBe(3); });
    it("counts refused", () => { expect(computeEducationAttendanceMetrics([makeRecord({ absence_reason: "refused_to_attend" })]).refused_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeEducationAttendanceMetrics([makeRecord()]); expect(m.school_contacted_rate).toBe(100); expect(m.reason_documented_rate).toBe(100); expect(m.return_plan_rate).toBe(100); expect(m.pep_up_to_date_rate).toBe(100); expect(m.virtual_school_rate).toBe(100); expect(m.social_worker_informed_rate).toBe(100); expect(m.child_views_rate).toBe(100); expect(m.alternative_education_rate).toBe(100); expect(m.homework_supported_rate).toBe(100); expect(m.achievement_celebrated_rate).toBe(100); expect(m.parent_informed_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("school_contacted_rate 0 when false", () => { expect(computeEducationAttendanceMetrics([makeRecord({ school_contacted: false })]).school_contacted_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeEducationAttendanceMetrics([makeRecord({ school_contacted: true }), makeRecord({ school_contacted: false }), makeRecord({ school_contacted: true })]); expect(m.school_contacted_rate).toBe(66.7); });
    it("attendance_percentage correct", () => { const m = computeEducationAttendanceMetrics([makeRecord({ sessions_attended: 1, sessions_possible: 2 }), makeRecord({ sessions_attended: 2, sessions_possible: 2 })]); expect(m.attendance_percentage).toBe(75); });
    it("attendance_percentage 0 for no sessions", () => { expect(computeEducationAttendanceMetrics([makeRecord({ sessions_attended: 0, sessions_possible: 0 })]).attendance_percentage).toBeNull();; });
    it("unique_children distinct", () => { const m = computeEducationAttendanceMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 attendance statuses", () => { const statuses = ["present","authorised_absence","unauthorised_absence","fixed_term_exclusion","permanent_exclusion","internal_exclusion","part_time_timetable","alternative_provision","school_holiday","other"] as const; const records = statuses.map(s => makeRecord({ attendance_status: s })); const m = computeEducationAttendanceMetrics(records); for (const s of statuses) expect(m.by_attendance_status[s]).toBe(1); });
    it("counts all 10 absence reasons", () => { const reasons = ["illness","medical_appointment","therapy_session","contact_visit","emotional_wellbeing","refused_to_attend","transport_issue","exclusion","none","other"] as const; const records = reasons.map(r => makeRecord({ absence_reason: r })); const m = computeEducationAttendanceMetrics(records); for (const r of reasons) expect(m.by_absence_reason[r]).toBe(1); });
    it("counts all 5 school engagements", () => { const engagements = ["fully_engaged","mostly_engaged","partially_engaged","disengaged","not_assessed"] as const; const records = engagements.map(e => makeRecord({ school_engagement: e })); const m = computeEducationAttendanceMetrics(records); for (const e of engagements) expect(m.by_school_engagement[e]).toBe(1); });
    it("counts all 5 education settings", () => { const settings = ["mainstream_school","special_school","alternative_provision","pru","home_education"] as const; const records = settings.map(s => makeRecord({ education_setting: s })); const m = computeEducationAttendanceMetrics(records); for (const s of settings) expect(m.by_education_setting[s]).toBe(1); });
  });

  describe("identifyEducationAttendanceAlerts", () => {
    it("returns empty for clean", () => { expect(identifyEducationAttendanceAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyEducationAttendanceAlerts([])).toEqual([]); });
    it("fires permanent_exclusion", () => { const a = identifyEducationAttendanceAlerts([makeRecord({ attendance_status: "permanent_exclusion", child_name: "Jo", education_setting: "mainstream_school" })]); expect(a[0].type).toBe("permanent_exclusion"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); expect(a[0].message).toContain("mainstream school"); });
    it("permanent_exclusion per-record", () => { const a = identifyEducationAttendanceAlerts([makeRecord({ id: "a-1", attendance_status: "permanent_exclusion" }), makeRecord({ id: "a-2", attendance_status: "permanent_exclusion" })]); expect(a.filter(x => x.type === "permanent_exclusion")).toHaveLength(2); });
    it("fires pep_not_current singular", () => { const a = identifyEducationAttendanceAlerts([makeRecord({ pep_up_to_date: false })]); const f = a.find(x => x.type === "pep_not_current"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 record shows"); });
    it("pep_not_current plural", () => { const a = identifyEducationAttendanceAlerts([makeRecord({ pep_up_to_date: false }), makeRecord({ pep_up_to_date: false })]); const f = a.find(x => x.type === "pep_not_current"); expect(f!.message).toContain("2 records show"); });
    it("fires school_not_contacted for absence", () => { const a = identifyEducationAttendanceAlerts([makeRecord({ attendance_status: "authorised_absence", school_contacted: false })]); const f = a.find(x => x.type === "school_not_contacted"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); });
    it("school_not_contacted ignores present", () => { expect(identifyEducationAttendanceAlerts([makeRecord({ attendance_status: "present", school_contacted: false })]).find(x => x.type === "school_not_contacted")).toBeUndefined(); });
    it("school_not_contacted ignores school_holiday", () => { expect(identifyEducationAttendanceAlerts([makeRecord({ attendance_status: "school_holiday", school_contacted: false })]).find(x => x.type === "school_not_contacted")).toBeUndefined(); });
    it("child_views_not_sought not for 1", () => { expect(identifyEducationAttendanceAlerts([makeRecord({ child_views_sought: false })]).find(x => x.type === "child_views_not_sought")).toBeUndefined(); });
    it("child_views_not_sought fires for 2", () => { const a = identifyEducationAttendanceAlerts([makeRecord({ child_views_sought: false }), makeRecord({ child_views_sought: false })]); expect(a.find(x => x.type === "child_views_not_sought")).toBeDefined(); });
    it("achievement_not_celebrated not for 2", () => { expect(identifyEducationAttendanceAlerts([makeRecord({ achievement_celebrated: false }), makeRecord({ achievement_celebrated: false })]).find(x => x.type === "achievement_not_celebrated")).toBeUndefined(); });
    it("achievement_not_celebrated fires for 3", () => { const a = identifyEducationAttendanceAlerts([makeRecord({ achievement_celebrated: false }), makeRecord({ achievement_celebrated: false }), makeRecord({ achievement_celebrated: false })]); expect(a.find(x => x.type === "achievement_not_celebrated")).toBeDefined(); });
    it("fires all applicable", () => { const a = identifyEducationAttendanceAlerts([makeRecord({ attendance_status: "permanent_exclusion", pep_up_to_date: false, school_contacted: false, child_views_sought: false, achievement_celebrated: false }), makeRecord({ attendance_status: "unauthorised_absence", school_contacted: false, child_views_sought: false, achievement_celebrated: false }), makeRecord({ achievement_celebrated: false })]); const types = a.map(x => x.type); expect(types).toContain("permanent_exclusion"); expect(types).toContain("pep_not_current"); expect(types).toContain("school_not_contacted"); expect(types).toContain("child_views_not_sought"); expect(types).toContain("achievement_not_celebrated"); });
  });
});
