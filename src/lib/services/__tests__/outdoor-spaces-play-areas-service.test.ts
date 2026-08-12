import { describe, it, expect } from "vitest";
import { _testing, type OutdoorSpacesPlayAreasRecord } from "../outdoor-spaces-play-areas-service";
import { todayStr } from "@/lib/utils";

const { computeOutdoorSpacesMetrics, identifyOutdoorSpacesAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<OutdoorSpacesPlayAreasRecord>): OutdoorSpacesPlayAreasRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    space_type: overrides?.space_type ?? "garden",
    condition_rating: overrides?.condition_rating ?? "good",
    safety_assessment: overrides?.safety_assessment ?? "fully_safe",
    accessibility_level: overrides?.accessibility_level ?? "fully_accessible",
    inspection_date: overrides?.inspection_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    inspected_by: overrides?.inspected_by ?? "Staff A",
    equipment_checked: overrides?.equipment_checked ?? true,
    surface_safe: overrides?.surface_safe ?? true,
    fencing_secure: overrides?.fencing_secure ?? true,
    lighting_adequate: overrides?.lighting_adequate ?? true,
    clean_tidy: overrides?.clean_tidy ?? true,
    age_appropriate: overrides?.age_appropriate ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    maintenance_requested: overrides?.maintenance_requested ?? true,
    risk_assessed: overrides?.risk_assessed ?? true,
    children_consulted: overrides?.children_consulted ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("outdoor-spaces-play-areas-service", () => {
  describe("computeOutdoorSpacesMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeOutdoorSpacesMetrics([]);
      expect(m.total_inspections).toBe(0);;
      expect(m.unsafe_count).toBe(0);
      expect(m.hazard_count).toBe(0);
      expect(m.poor_condition_count).toBe(0);
      expect(m.not_accessible_count).toBe(0);
      expect(m.equipment_checked_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeOutdoorSpacesMetrics([]);
      expect(m.by_space_type).toEqual({});
      expect(m.by_condition_rating).toEqual({});
      expect(m.by_safety_assessment).toEqual({});
      expect(m.by_accessibility_level).toEqual({});
    });
    it("total_inspections counts records", () => { expect(computeOutdoorSpacesMetrics([makeRecord(), makeRecord()]).total_inspections).toBe(2); });
    it("counts unsafe", () => { expect(computeOutdoorSpacesMetrics([makeRecord({ condition_rating: "unsafe" })]).unsafe_count).toBe(1); });
    it("does not count poor as unsafe", () => { expect(computeOutdoorSpacesMetrics([makeRecord({ condition_rating: "poor" })]).unsafe_count).toBe(0); });
    it("counts significant_hazards as hazard", () => { expect(computeOutdoorSpacesMetrics([makeRecord({ safety_assessment: "significant_hazards" })]).hazard_count).toBe(1); });
    it("counts closed as hazard", () => { expect(computeOutdoorSpacesMetrics([makeRecord({ safety_assessment: "closed" })]).hazard_count).toBe(1); });
    it("does not count moderate_issues as hazard", () => { expect(computeOutdoorSpacesMetrics([makeRecord({ safety_assessment: "moderate_issues" })]).hazard_count).toBe(0); });
    it("counts poor as poor_condition", () => { expect(computeOutdoorSpacesMetrics([makeRecord({ condition_rating: "poor" })]).poor_condition_count).toBe(1); });
    it("counts unsafe as poor_condition", () => { expect(computeOutdoorSpacesMetrics([makeRecord({ condition_rating: "unsafe" })]).poor_condition_count).toBe(1); });
    it("does not count fair as poor_condition", () => { expect(computeOutdoorSpacesMetrics([makeRecord({ condition_rating: "fair" })]).poor_condition_count).toBe(0); });
    it("counts not_accessible", () => { expect(computeOutdoorSpacesMetrics([makeRecord({ accessibility_level: "not_accessible" })]).not_accessible_count).toBe(1); });
    it("does not count limited_access as not_accessible", () => { expect(computeOutdoorSpacesMetrics([makeRecord({ accessibility_level: "limited_access" })]).not_accessible_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeOutdoorSpacesMetrics([makeRecord()]);
      expect(m.equipment_checked_rate).toBe(100);
      expect(m.surface_safe_rate).toBe(100);
      expect(m.fencing_secure_rate).toBe(100);
      expect(m.lighting_rate).toBe(100);
      expect(m.clean_tidy_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.maintenance_rate).toBe(100);
      expect(m.risk_assessed_rate).toBe(100);
      expect(m.children_consulted_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("equipment_checked_rate 0 when false", () => { expect(computeOutdoorSpacesMetrics([makeRecord({ equipment_checked: false })]).equipment_checked_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeOutdoorSpacesMetrics([makeRecord({ fencing_secure: true }), makeRecord({ fencing_secure: false }), makeRecord({ fencing_secure: true })]); expect(m.fencing_secure_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeOutdoorSpacesMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 space types", () => { const types = ["garden","play_area","sports_court","sensory_garden","allotment","bike_storage","seating_area","bbq_area","nature_area","other"] as const; const records = types.map(t => makeRecord({ space_type: t })); const m = computeOutdoorSpacesMetrics(records); for (const t of types) expect(m.by_space_type[t]).toBe(1); });
    it("counts all 5 condition ratings", () => { const ratings = ["excellent","good","fair","poor","unsafe"] as const; const records = ratings.map(r => makeRecord({ condition_rating: r })); const m = computeOutdoorSpacesMetrics(records); for (const r of ratings) expect(m.by_condition_rating[r]).toBe(1); });
    it("counts all 5 safety assessments", () => { const assessments = ["fully_safe","minor_issues","moderate_issues","significant_hazards","closed"] as const; const records = assessments.map(a => makeRecord({ safety_assessment: a })); const m = computeOutdoorSpacesMetrics(records); for (const a of assessments) expect(m.by_safety_assessment[a]).toBe(1); });
    it("counts all 5 accessibility levels", () => { const levels = ["fully_accessible","mostly_accessible","partially_accessible","limited_access","not_accessible"] as const; const records = levels.map(l => makeRecord({ accessibility_level: l })); const m = computeOutdoorSpacesMetrics(records); for (const l of levels) expect(m.by_accessibility_level[l]).toBe(1); });
  });

  describe("identifyOutdoorSpacesAlerts", () => {
    it("returns empty for clean", () => { expect(identifyOutdoorSpacesAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyOutdoorSpacesAlerts([])).toEqual([]); });
    it("fires unsafe_hazard", () => { 
      const a = identifyOutdoorSpacesAlerts([makeRecord({ condition_rating: "unsafe", safety_assessment: "significant_hazards", space_type: "play_area" })]);
      expect(a[0].type).toBe("unsafe_hazard");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("play area");
    });
    it("unsafe with closed also critical", () => { const a = identifyOutdoorSpacesAlerts([makeRecord({ condition_rating: "unsafe", safety_assessment: "closed" })]); expect(a[0].type).toBe("unsafe_hazard"); expect(a[0].severity).toBe("critical"); });
    it("unsafe_hazard per-record", () => { const a = identifyOutdoorSpacesAlerts([makeRecord({ id: "a-1", condition_rating: "unsafe", safety_assessment: "significant_hazards" }), makeRecord({ id: "a-2", condition_rating: "unsafe", safety_assessment: "closed" })]); expect(a.filter(x => x.type === "unsafe_hazard")).toHaveLength(2); });
    it("unsafe without hazard no critical", () => { expect(identifyOutdoorSpacesAlerts([makeRecord({ condition_rating: "unsafe", safety_assessment: "minor_issues" })]).find(x => x.type === "unsafe_hazard")).toBeUndefined(); });
    it("hazard without unsafe no critical", () => { expect(identifyOutdoorSpacesAlerts([makeRecord({ safety_assessment: "significant_hazards", condition_rating: "good" })]).find(x => x.type === "unsafe_hazard")).toBeUndefined(); });
    it("fires fencing_not_secure singular", () => { 
      const a = identifyOutdoorSpacesAlerts([makeRecord({ fencing_secure: false })]);
      const f = a.find(x => x.type === "fencing_not_secure");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 inspection has");
    });
    it("fencing_not_secure plural", () => { const a = identifyOutdoorSpacesAlerts([makeRecord({ fencing_secure: false }), makeRecord({ fencing_secure: false })]); const f = a.find(x => x.type === "fencing_not_secure"); expect(f!.message).toContain("2 inspections have"); });
    it("fires no_risk_assessment singular", () => { 
      const a = identifyOutdoorSpacesAlerts([makeRecord({ risk_assessed: false })]);
      const f = a.find(x => x.type === "no_risk_assessment");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 space has");
    });
    it("equipment_not_checked not for 1", () => { expect(identifyOutdoorSpacesAlerts([makeRecord({ equipment_checked: false })]).find(x => x.type === "equipment_not_checked")).toBeUndefined(); });
    it("equipment_not_checked fires for 2", () => { const a = identifyOutdoorSpacesAlerts([makeRecord({ equipment_checked: false }), makeRecord({ equipment_checked: false })]); expect(a.find(x => x.type === "equipment_not_checked")).toBeDefined(); expect(a.find(x => x.type === "equipment_not_checked")!.severity).toBe("medium"); });
    it("children_not_consulted not for 1", () => { expect(identifyOutdoorSpacesAlerts([makeRecord({ children_consulted: false })]).find(x => x.type === "children_not_consulted")).toBeUndefined(); });
    it("children_not_consulted fires for 2", () => { const a = identifyOutdoorSpacesAlerts([makeRecord({ children_consulted: false }), makeRecord({ children_consulted: false })]); expect(a.find(x => x.type === "children_not_consulted")).toBeDefined(); expect(a.find(x => x.type === "children_not_consulted")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyOutdoorSpacesAlerts([makeRecord({ condition_rating: "unsafe", safety_assessment: "significant_hazards", fencing_secure: false, risk_assessed: false, equipment_checked: false, children_consulted: false }), makeRecord({ fencing_secure: false, risk_assessed: false, equipment_checked: false, children_consulted: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("unsafe_hazard");
      expect(types).toContain("fencing_not_secure");
      expect(types).toContain("no_risk_assessment");
      expect(types).toContain("equipment_not_checked");
      expect(types).toContain("children_not_consulted");
    });
  });
});
