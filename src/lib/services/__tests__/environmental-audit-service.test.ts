import { describe, it, expect } from "vitest";
import { _testing, type EnvironmentalAuditRecord } from "../environmental-audit-service";

const { computeEnvironmentalAuditMetrics, identifyEnvironmentalAuditAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<EnvironmentalAuditRecord>): EnvironmentalAuditRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    audit_area: overrides?.audit_area ?? "communal_living",
    audit_rating: overrides?.audit_rating ?? "good",
    audit_type: overrides?.audit_type ?? "scheduled_audit",
    priority_level: overrides?.priority_level ?? "low",
    audit_date: overrides?.audit_date ?? now.toISOString().split("T")[0],
    area_name: overrides?.area_name ?? "Lounge",
    homely_feel: overrides?.homely_feel ?? true,
    child_friendly: overrides?.child_friendly ?? true,
    personalised: overrides?.personalised ?? true,
    clean_and_tidy: overrides?.clean_and_tidy ?? true,
    well_maintained: overrides?.well_maintained ?? true,
    safe_environment: overrides?.safe_environment ?? true,
    accessible: overrides?.accessible ?? true,
    adequate_lighting: overrides?.adequate_lighting ?? true,
    temperature_comfortable: overrides?.temperature_comfortable ?? true,
    noise_appropriate: overrides?.noise_appropriate ?? true,
    privacy_maintained: overrides?.privacy_maintained ?? true,
    children_consulted: overrides?.children_consulted ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    audited_by: overrides?.audited_by ?? "Manager A",
    next_audit_date: "next_audit_date" in (overrides ?? {}) ? (overrides!.next_audit_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("environmental-audit-service", () => {
  describe("computeEnvironmentalAuditMetrics", () => {
    it("returns zeros for empty", () => { const m = computeEnvironmentalAuditMetrics([]); expect(m.total_audits).toBe(0); expect(m.outstanding_count).toBe(0); expect(m.good_count).toBe(0); expect(m.requires_improvement_count).toBe(0); expect(m.inadequate_count).toBe(0); expect(m.homely_feel_rate).toBe(0); expect(m.immediate_priority_count).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeEnvironmentalAuditMetrics([]); expect(m.by_audit_area).toEqual({}); expect(m.by_audit_rating).toEqual({}); expect(m.by_audit_type).toEqual({}); expect(m.by_priority_level).toEqual({}); });
    it("counts outstanding", () => { expect(computeEnvironmentalAuditMetrics([makeRecord({ audit_rating: "outstanding" })]).outstanding_count).toBe(1); });
    it("counts good", () => { expect(computeEnvironmentalAuditMetrics([makeRecord()]).good_count).toBe(1); });
    it("counts requires_improvement", () => { expect(computeEnvironmentalAuditMetrics([makeRecord({ audit_rating: "requires_improvement" })]).requires_improvement_count).toBe(1); });
    it("counts inadequate", () => { expect(computeEnvironmentalAuditMetrics([makeRecord({ audit_rating: "inadequate" })]).inadequate_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeEnvironmentalAuditMetrics([makeRecord()]); expect(m.homely_feel_rate).toBe(100); expect(m.child_friendly_rate).toBe(100); expect(m.personalised_rate).toBe(100); expect(m.clean_and_tidy_rate).toBe(100); expect(m.well_maintained_rate).toBe(100); expect(m.safe_environment_rate).toBe(100); expect(m.accessible_rate).toBe(100); expect(m.adequate_lighting_rate).toBe(100); expect(m.temperature_comfortable_rate).toBe(100); expect(m.privacy_maintained_rate).toBe(100); expect(m.children_consulted_rate).toBe(100); });
    it("homely_feel_rate 0 when false", () => { expect(computeEnvironmentalAuditMetrics([makeRecord({ homely_feel: false })]).homely_feel_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeEnvironmentalAuditMetrics([makeRecord({ homely_feel: true }), makeRecord({ homely_feel: false }), makeRecord({ homely_feel: true })]); expect(m.homely_feel_rate).toBe(66.7); });
    it("immediate_priority_count", () => { const m = computeEnvironmentalAuditMetrics([makeRecord({ priority_level: "immediate" }), makeRecord({ priority_level: "immediate" }), makeRecord({ priority_level: "high" })]); expect(m.immediate_priority_count).toBe(2); });
    it("counts all 10 areas", () => { const areas = ["communal_living","bedrooms","bathrooms","kitchen_dining","outdoor_spaces","entrance_hallway","office_staff_areas","storage_areas","sensory_spaces","other"] as const; const records = areas.map(a => makeRecord({ audit_area: a })); const m = computeEnvironmentalAuditMetrics(records); for (const a of areas) expect(m.by_audit_area[a]).toBe(1); });
    it("counts all 5 ratings", () => { const ratings = ["outstanding","good","requires_improvement","inadequate","not_assessed"] as const; const records = ratings.map(r => makeRecord({ audit_rating: r })); const m = computeEnvironmentalAuditMetrics(records); for (const r of ratings) expect(m.by_audit_rating[r]).toBe(1); });
    it("counts all 10 types", () => { const types = ["scheduled_audit","spot_check","annual_review","post_incident","pre_admission","ofsted_preparation","children_led","staff_led","manager_walkthrough","other"] as const; const records = types.map(t => makeRecord({ audit_type: t })); const m = computeEnvironmentalAuditMetrics(records); for (const t of types) expect(m.by_audit_type[t]).toBe(1); });
    it("counts all 5 priorities", () => { const levels = ["immediate","high","medium","low","cosmetic"] as const; const records = levels.map(l => makeRecord({ priority_level: l })); const m = computeEnvironmentalAuditMetrics(records); for (const l of levels) expect(m.by_priority_level[l]).toBe(1); });
  });

  describe("identifyEnvironmentalAuditAlerts", () => {
    it("returns empty for clean", () => { expect(identifyEnvironmentalAuditAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyEnvironmentalAuditAlerts([])).toEqual([]); });
    it("fires inadequate_unsafe", () => { const a = identifyEnvironmentalAuditAlerts([makeRecord({ audit_rating: "inadequate", safe_environment: false, area_name: "Bathroom", audit_date: "2026-05-14" })]); expect(a[0].type).toBe("inadequate_unsafe"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Bathroom"); });
    it("inadequate_unsafe per-record", () => { const a = identifyEnvironmentalAuditAlerts([makeRecord({ id: "a-1", audit_rating: "inadequate", safe_environment: false }), makeRecord({ id: "a-2", audit_rating: "inadequate", safe_environment: false })]); expect(a.filter(x => x.type === "inadequate_unsafe")).toHaveLength(2); });
    it("no inadequate_unsafe if safe", () => { const a = identifyEnvironmentalAuditAlerts([makeRecord({ audit_rating: "inadequate", safe_environment: true })]); expect(a.filter(x => x.type === "inadequate_unsafe")).toHaveLength(0); });
    it("fires immediate_priority singular", () => { const a = identifyEnvironmentalAuditAlerts([makeRecord({ priority_level: "immediate" })]); const f = a.find(x => x.type === "immediate_priority"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 area has"); });
    it("immediate_priority plural", () => { const a = identifyEnvironmentalAuditAlerts([makeRecord({ priority_level: "immediate" }), makeRecord({ priority_level: "immediate" })]); const f = a.find(x => x.type === "immediate_priority"); expect(f!.message).toContain("2 areas have"); });
    it("not_child_friendly not for 1", () => { expect(identifyEnvironmentalAuditAlerts([makeRecord({ child_friendly: false })]).find(x => x.type === "not_child_friendly")).toBeUndefined(); });
    it("not_child_friendly fires for 2", () => { const a = identifyEnvironmentalAuditAlerts([makeRecord({ child_friendly: false }), makeRecord({ child_friendly: false })]); expect(a.find(x => x.type === "not_child_friendly")).toBeDefined(); });
    it("not_personalised not for 2", () => { expect(identifyEnvironmentalAuditAlerts([makeRecord({ personalised: false }), makeRecord({ personalised: false })]).find(x => x.type === "not_personalised")).toBeUndefined(); });
    it("not_personalised fires for 3", () => { const a = identifyEnvironmentalAuditAlerts([makeRecord({ personalised: false }), makeRecord({ personalised: false }), makeRecord({ personalised: false })]); expect(a.find(x => x.type === "not_personalised")).toBeDefined(); });
    it("children_not_consulted not for 2", () => { expect(identifyEnvironmentalAuditAlerts([makeRecord({ children_consulted: false }), makeRecord({ children_consulted: false })]).find(x => x.type === "children_not_consulted")).toBeUndefined(); });
    it("children_not_consulted fires for 3", () => { const a = identifyEnvironmentalAuditAlerts([makeRecord({ children_consulted: false }), makeRecord({ children_consulted: false }), makeRecord({ children_consulted: false })]); expect(a.find(x => x.type === "children_not_consulted")).toBeDefined(); });
    it("fires all applicable", () => { const a = identifyEnvironmentalAuditAlerts([makeRecord({ audit_rating: "inadequate", safe_environment: false, priority_level: "immediate", child_friendly: false, personalised: false, children_consulted: false }), makeRecord({ child_friendly: false, personalised: false, children_consulted: false }), makeRecord({ personalised: false, children_consulted: false })]); const types = a.map(x => x.type); expect(types).toContain("inadequate_unsafe"); expect(types).toContain("immediate_priority"); expect(types).toContain("not_child_friendly"); expect(types).toContain("not_personalised"); expect(types).toContain("children_not_consulted"); });
  });
});
