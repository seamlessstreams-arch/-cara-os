import { describe, it, expect } from "vitest";
import { _testing, type HomeEnvironmentInspectionRecord } from "../home-environment-inspection-service";
import { todayStr } from "@/lib/utils";

const { computeHomeEnvironmentMetrics, identifyHomeEnvironmentAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<HomeEnvironmentInspectionRecord>): HomeEnvironmentInspectionRecord {
  return {
    id: "a-1", home_id: "home-1",
    inspection_area: "kitchen",
    condition_rating: "good",
    hazard_level: "none",
    compliance_status: "fully_compliant",
    inspection_date: todayStr(),
    inspected_by: "Staff A",
    cleanliness_acceptable: true,
    fire_safety_checked: true,
    electrical_safety_checked: true,
    water_safety_checked: true,
    ventilation_adequate: true,
    lighting_adequate: true,
    maintenance_up_to_date: true,
    child_friendly: true,
    accessibility_adequate: true,
    security_adequate: true,
    pest_free: true,
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

describe("home-environment-inspection-service", () => {
  describe("computeHomeEnvironmentMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeHomeEnvironmentMetrics([]);
      expect(m.total_inspections).toBe(0);;
      expect(m.poor_condition_count).toBe(0);
      expect(m.unacceptable_condition_count).toBe(0);
      expect(m.high_hazard_count).toBe(0);
      expect(m.immediate_hazard_count).toBe(0);
      expect(m.cleanliness_rate).toBeNull();;
    });
    it("returns empty breakdowns", () => { 
      const m = computeHomeEnvironmentMetrics([]);
      expect(m.by_inspection_area).toEqual({});
      expect(m.by_condition_rating).toEqual({});
      expect(m.by_hazard_level).toEqual({});
      expect(m.by_compliance_status).toEqual({});
    });
    it("total_inspections counts records", () => { expect(computeHomeEnvironmentMetrics([makeRecord(), makeRecord()]).total_inspections).toBe(2); });
    it("counts poor_condition", () => { expect(computeHomeEnvironmentMetrics([makeRecord({ condition_rating: "poor" })]).poor_condition_count).toBe(1); });
    it("counts unacceptable_condition", () => { expect(computeHomeEnvironmentMetrics([makeRecord({ condition_rating: "unacceptable" })]).unacceptable_condition_count).toBe(1); });
    it("does not count satisfactory as poor", () => { expect(computeHomeEnvironmentMetrics([makeRecord({ condition_rating: "satisfactory" })]).poor_condition_count).toBe(0); });
    it("counts high_hazard", () => { expect(computeHomeEnvironmentMetrics([makeRecord({ hazard_level: "high" })]).high_hazard_count).toBe(1); });
    it("counts immediate_hazard", () => { expect(computeHomeEnvironmentMetrics([makeRecord({ hazard_level: "immediate" })]).immediate_hazard_count).toBe(1); });
    it("does not count medium as high", () => { expect(computeHomeEnvironmentMetrics([makeRecord({ hazard_level: "medium" })]).high_hazard_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeHomeEnvironmentMetrics([makeRecord()]);
      expect(m.cleanliness_rate).toBe(100);
      expect(m.fire_safety_rate).toBe(100);
      expect(m.electrical_safety_rate).toBe(100);
      expect(m.water_safety_rate).toBe(100);
      expect(m.ventilation_rate).toBe(100);
      expect(m.lighting_rate).toBe(100);
      expect(m.maintenance_rate).toBe(100);
      expect(m.child_friendly_rate).toBe(100);
      expect(m.accessibility_rate).toBe(100);
      expect(m.security_rate).toBe(100);
      expect(m.pest_free_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("cleanliness_rate 0 when false", () => { expect(computeHomeEnvironmentMetrics([makeRecord({ cleanliness_acceptable: false })]).cleanliness_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeHomeEnvironmentMetrics([makeRecord({ fire_safety_checked: true }), makeRecord({ fire_safety_checked: false }), makeRecord({ fire_safety_checked: true })]); expect(m.fire_safety_rate).toBe(66.7); });
    it("counts all 10 inspection areas", () => { const areas = ["kitchen","bathroom","bedroom","communal_area","garden","entrance","laundry","office","storage","other"] as const; const records = areas.map(a => makeRecord({ inspection_area: a })); const m = computeHomeEnvironmentMetrics(records); for (const a of areas) expect(m.by_inspection_area[a]).toBe(1); });
    it("counts all 5 condition ratings", () => { const ratings = ["excellent","good","satisfactory","poor","unacceptable"] as const; const records = ratings.map(r => makeRecord({ condition_rating: r })); const m = computeHomeEnvironmentMetrics(records); for (const r of ratings) expect(m.by_condition_rating[r]).toBe(1); });
    it("counts all 5 hazard levels", () => { const levels = ["none","low","medium","high","immediate"] as const; const records = levels.map(l => makeRecord({ hazard_level: l })); const m = computeHomeEnvironmentMetrics(records); for (const l of levels) expect(m.by_hazard_level[l]).toBe(1); });
    it("counts all 5 compliance statuses", () => { const statuses = ["fully_compliant","minor_issues","significant_issues","non_compliant","not_assessed"] as const; const records = statuses.map(s => makeRecord({ compliance_status: s })); const m = computeHomeEnvironmentMetrics(records); for (const s of statuses) expect(m.by_compliance_status[s]).toBe(1); });
  });

  describe("identifyHomeEnvironmentAlerts", () => {
    it("returns empty for clean", () => { expect(identifyHomeEnvironmentAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyHomeEnvironmentAlerts([])).toEqual([]); });
    it("fires immediate_hazard", () => { 
      const a = identifyHomeEnvironmentAlerts([makeRecord({ hazard_level: "immediate", inspection_area: "kitchen" })]);
      expect(a[0].type).toBe("immediate_hazard");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("kitchen");
    });
    it("immediate_hazard per-record", () => { const a = identifyHomeEnvironmentAlerts([makeRecord({ id: "a-1", hazard_level: "immediate" }), makeRecord({ id: "a-2", hazard_level: "immediate" })]); expect(a.filter(x => x.type === "immediate_hazard")).toHaveLength(2); });
    it("high hazard no critical alert", () => { expect(identifyHomeEnvironmentAlerts([makeRecord({ hazard_level: "high" })]).find(x => x.type === "immediate_hazard")).toBeUndefined(); });
    it("fires fire_safety_not_checked singular", () => { 
      const a = identifyHomeEnvironmentAlerts([makeRecord({ fire_safety_checked: false })]);
      const f = a.find(x => x.type === "fire_safety_not_checked");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 inspection has");
    });
    it("fire_safety_not_checked plural", () => { const a = identifyHomeEnvironmentAlerts([makeRecord({ fire_safety_checked: false }), makeRecord({ fire_safety_checked: false })]); const f = a.find(x => x.type === "fire_safety_not_checked"); expect(f!.message).toContain("2 inspections have"); });
    it("fires maintenance_overdue singular", () => { 
      const a = identifyHomeEnvironmentAlerts([makeRecord({ maintenance_up_to_date: false })]);
      const f = a.find(x => x.type === "maintenance_overdue");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 inspection shows");
    });
    it("maintenance_overdue plural", () => { const a = identifyHomeEnvironmentAlerts([makeRecord({ maintenance_up_to_date: false }), makeRecord({ maintenance_up_to_date: false })]); const f = a.find(x => x.type === "maintenance_overdue"); expect(f!.message).toContain("2 inspections show"); });
    it("cleanliness_issues not for 1", () => { expect(identifyHomeEnvironmentAlerts([makeRecord({ cleanliness_acceptable: false })]).find(x => x.type === "cleanliness_issues")).toBeUndefined(); });
    it("cleanliness_issues fires for 2", () => { const a = identifyHomeEnvironmentAlerts([makeRecord({ cleanliness_acceptable: false }), makeRecord({ cleanliness_acceptable: false })]); expect(a.find(x => x.type === "cleanliness_issues")).toBeDefined(); expect(a.find(x => x.type === "cleanliness_issues")!.severity).toBe("medium"); });
    it("security_inadequate not for 1", () => { expect(identifyHomeEnvironmentAlerts([makeRecord({ security_adequate: false })]).find(x => x.type === "security_inadequate")).toBeUndefined(); });
    it("security_inadequate fires for 2", () => { const a = identifyHomeEnvironmentAlerts([makeRecord({ security_adequate: false }), makeRecord({ security_adequate: false })]); expect(a.find(x => x.type === "security_inadequate")).toBeDefined(); expect(a.find(x => x.type === "security_inadequate")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyHomeEnvironmentAlerts([makeRecord({ hazard_level: "immediate", fire_safety_checked: false, maintenance_up_to_date: false, cleanliness_acceptable: false, security_adequate: false }), makeRecord({ fire_safety_checked: false, maintenance_up_to_date: false, cleanliness_acceptable: false, security_adequate: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("immediate_hazard");
      expect(types).toContain("fire_safety_not_checked");
      expect(types).toContain("maintenance_overdue");
      expect(types).toContain("cleanliness_issues");
      expect(types).toContain("security_inadequate");
    });
  });
});
