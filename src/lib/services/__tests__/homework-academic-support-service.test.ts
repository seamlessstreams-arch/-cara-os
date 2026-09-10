import { describe, it, expect } from "vitest";
import { _testing, type HomeworkAcademicSupportRecord } from "../homework-academic-support-service";
import { todayStr } from "@/lib/utils";

const { computeHomeworkAcademicMetrics, identifyHomeworkAcademicAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<HomeworkAcademicSupportRecord>): HomeworkAcademicSupportRecord {
  return {
    id: "a-1", home_id: "home-1",
    subject_area: "english",
    support_type: "homework_help",
    engagement_level: "engaged",
    progress_outcome: "met_expectations",
    session_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supported_by: "Staff A",
    homework_completed: true,
    quiet_space_provided: true,
    resources_available: true,
    school_liaison_made: true,
    learning_needs_met: true,
    positive_encouragement: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    pep_updated: true,
    attendance_checked: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("homework-academic-support-service", () => {
  describe("computeHomeworkAcademicMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeHomeworkAcademicMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.disengaged_count).toBe(0);
      expect(m.refused_count).toBe(0);
      expect(m.no_progress_count).toBe(0);
      expect(m.regression_count).toBe(0);
      expect(m.homework_completed_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeHomeworkAcademicMetrics([]);
      expect(m.by_subject_area).toEqual({});
      expect(m.by_support_type).toEqual({});
      expect(m.by_engagement_level).toEqual({});
      expect(m.by_progress_outcome).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computeHomeworkAcademicMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts disengaged", () => { expect(computeHomeworkAcademicMetrics([makeRecord({ engagement_level: "disengaged" })]).disengaged_count).toBe(1); });
    it("counts refused", () => { expect(computeHomeworkAcademicMetrics([makeRecord({ engagement_level: "refused" })]).refused_count).toBe(1); });
    it("does not count partially_engaged as disengaged", () => { expect(computeHomeworkAcademicMetrics([makeRecord({ engagement_level: "partially_engaged" })]).disengaged_count).toBe(0); });
    it("counts no_progress", () => { expect(computeHomeworkAcademicMetrics([makeRecord({ progress_outcome: "no_progress" })]).no_progress_count).toBe(1); });
    it("counts regression", () => { expect(computeHomeworkAcademicMetrics([makeRecord({ progress_outcome: "regression" })]).regression_count).toBe(1); });
    it("does not count some_progress as no_progress", () => { expect(computeHomeworkAcademicMetrics([makeRecord({ progress_outcome: "some_progress" })]).no_progress_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeHomeworkAcademicMetrics([makeRecord()]);
      expect(m.homework_completed_rate).toBe(100);
      expect(m.quiet_space_rate).toBe(100);
      expect(m.resources_rate).toBe(100);
      expect(m.school_liaison_rate).toBe(100);
      expect(m.learning_needs_rate).toBe(100);
      expect(m.encouragement_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.pep_updated_rate).toBe(100);
      expect(m.attendance_checked_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("homework_completed_rate 0 when false", () => { expect(computeHomeworkAcademicMetrics([makeRecord({ homework_completed: false })]).homework_completed_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeHomeworkAcademicMetrics([makeRecord({ pep_updated: true }), makeRecord({ pep_updated: false }), makeRecord({ pep_updated: true })]); expect(m.pep_updated_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeHomeworkAcademicMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 subject areas", () => { const areas = ["english","maths","science","humanities","languages","creative_arts","technology","physical_education","life_skills","other"] as const; const records = areas.map(a => makeRecord({ subject_area: a })); const m = computeHomeworkAcademicMetrics(records); for (const a of areas) expect(m.by_subject_area[a]).toBe(1); });
    it("counts all 5 support types", () => { const types = ["homework_help","one_to_one_tutoring","group_study","revision_support","exam_preparation"] as const; const records = types.map(t => makeRecord({ support_type: t })); const m = computeHomeworkAcademicMetrics(records); for (const t of types) expect(m.by_support_type[t]).toBe(1); });
    it("counts all 5 engagement levels", () => { const levels = ["highly_engaged","engaged","partially_engaged","disengaged","refused"] as const; const records = levels.map(l => makeRecord({ engagement_level: l })); const m = computeHomeworkAcademicMetrics(records); for (const l of levels) expect(m.by_engagement_level[l]).toBe(1); });
    it("counts all 5 progress outcomes", () => { const outcomes = ["exceeded_expectations","met_expectations","some_progress","no_progress","regression"] as const; const records = outcomes.map(o => makeRecord({ progress_outcome: o })); const m = computeHomeworkAcademicMetrics(records); for (const o of outcomes) expect(m.by_progress_outcome[o]).toBe(1); });
  });

  describe("identifyHomeworkAcademicAlerts", () => {
    it("returns empty for clean", () => { expect(identifyHomeworkAcademicAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyHomeworkAcademicAlerts([])).toEqual([]); });
    it("fires refused_regressing", () => { 
      const a = identifyHomeworkAcademicAlerts([makeRecord({ engagement_level: "refused", progress_outcome: "regression", child_name: "Jo" })]);
      expect(a[0].type).toBe("refused_regressing");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("refused_regressing per-record", () => { const a = identifyHomeworkAcademicAlerts([makeRecord({ id: "a-1", engagement_level: "refused", progress_outcome: "regression" }), makeRecord({ id: "a-2", engagement_level: "refused", progress_outcome: "regression" })]); expect(a.filter(x => x.type === "refused_regressing")).toHaveLength(2); });
    it("refused without regression no critical", () => { expect(identifyHomeworkAcademicAlerts([makeRecord({ engagement_level: "refused", progress_outcome: "met_expectations" })]).find(x => x.type === "refused_regressing")).toBeUndefined(); });
    it("regression without refused no critical", () => { expect(identifyHomeworkAcademicAlerts([makeRecord({ engagement_level: "engaged", progress_outcome: "regression" })]).find(x => x.type === "refused_regressing")).toBeUndefined(); });
    it("fires no_school_liaison singular", () => { 
      const a = identifyHomeworkAcademicAlerts([makeRecord({ school_liaison_made: false })]);
      const f = a.find(x => x.type === "no_school_liaison");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_school_liaison plural", () => { const a = identifyHomeworkAcademicAlerts([makeRecord({ school_liaison_made: false }), makeRecord({ school_liaison_made: false })]); const f = a.find(x => x.type === "no_school_liaison"); expect(f!.message).toContain("2 sessions have"); });
    it("fires pep_not_updated singular", () => { 
      const a = identifyHomeworkAcademicAlerts([makeRecord({ pep_updated: false })]);
      const f = a.find(x => x.type === "pep_not_updated");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_quiet_space not for 1", () => { expect(identifyHomeworkAcademicAlerts([makeRecord({ quiet_space_provided: false })]).find(x => x.type === "no_quiet_space")).toBeUndefined(); });
    it("no_quiet_space fires for 2", () => { const a = identifyHomeworkAcademicAlerts([makeRecord({ quiet_space_provided: false }), makeRecord({ quiet_space_provided: false })]); expect(a.find(x => x.type === "no_quiet_space")).toBeDefined(); expect(a.find(x => x.type === "no_quiet_space")!.severity).toBe("medium"); });
    it("no_resources not for 1", () => { expect(identifyHomeworkAcademicAlerts([makeRecord({ resources_available: false })]).find(x => x.type === "no_resources")).toBeUndefined(); });
    it("no_resources fires for 2", () => { const a = identifyHomeworkAcademicAlerts([makeRecord({ resources_available: false }), makeRecord({ resources_available: false })]); expect(a.find(x => x.type === "no_resources")).toBeDefined(); expect(a.find(x => x.type === "no_resources")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyHomeworkAcademicAlerts([makeRecord({ engagement_level: "refused", progress_outcome: "regression", school_liaison_made: false, pep_updated: false, quiet_space_provided: false, resources_available: false }), makeRecord({ school_liaison_made: false, pep_updated: false, quiet_space_provided: false, resources_available: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("refused_regressing");
      expect(types).toContain("no_school_liaison");
      expect(types).toContain("pep_not_updated");
      expect(types).toContain("no_quiet_space");
      expect(types).toContain("no_resources");
    });
  });
});
