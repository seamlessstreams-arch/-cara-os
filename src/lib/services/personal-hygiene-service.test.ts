import { describe, it, expect } from "vitest";
import {
  computePersonalHygieneMetrics,
  identifyPersonalHygieneAlerts,
} from "./personal-hygiene-service";
import type { PersonalHygieneRecord } from "./personal-hygiene-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<PersonalHygieneRecord> = {}): PersonalHygieneRecord {
  return {
    id: "ph-1",
    home_id: "home-1",
    hygiene_area: "bathing_showering",
    support_level: "independent",
    progress_rating: "good",
    sensitivity_level: "standard",
    assessment_date: "2026-05-10",
    child_name: "Alex",
    child_id: "child-1",
    child_consulted: true,
    child_comfortable: true,
    dignity_maintained: true,
    age_appropriate: true,
    culturally_sensitive: true,
    products_available: true,
    products_preferred: true,
    independence_encouraged: true,
    routine_established: true,
    care_plan_updated: true,
    training_provided: true,
    issues_found: [],
    actions_taken: [],
    assessed_by: "Staff A",
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computePersonalHygieneMetrics --------------------------------------------

describe("computePersonalHygieneMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computePersonalHygieneMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.independent_count).toBe(0);
    expect(m.full_support_count).toBe(0);
    expect(m.independence_rate).toBeNull();;
    expect(m.excellent_progress_count).toBe(0);
    expect(m.needs_improvement_count).toBe(0);
    expect(m.child_consulted_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts independent and full_support levels", () => {
    const records = [
      makeRecord({ id: "1", support_level: "independent" }),
      makeRecord({ id: "2", support_level: "full_support" }),
      makeRecord({ id: "3", support_level: "independent" }),
      makeRecord({ id: "4", support_level: "verbal_guidance" }),
    ];
    const m = computePersonalHygieneMetrics(records);
    expect(m.independent_count).toBe(2);
    expect(m.full_support_count).toBe(1);
    expect(m.independence_rate).toBe(50);
  });

  it("counts progress ratings", () => {
    const records = [
      makeRecord({ id: "1", progress_rating: "excellent" }),
      makeRecord({ id: "2", progress_rating: "needs_improvement" }),
      makeRecord({ id: "3", progress_rating: "needs_improvement" }),
    ];
    const m = computePersonalHygieneMetrics(records);
    expect(m.excellent_progress_count).toBe(1);
    expect(m.needs_improvement_count).toBe(2);
  });

  it("calculates boolean rates at 100% when all true", () => {
    const records = [makeRecord({ id: "1" }), makeRecord({ id: "2" })];
    const m = computePersonalHygieneMetrics(records);
    expect(m.child_consulted_rate).toBe(100);
    expect(m.child_comfortable_rate).toBe(100);
    expect(m.dignity_maintained_rate).toBe(100);
    expect(m.age_appropriate_rate).toBe(100);
    expect(m.culturally_sensitive_rate).toBe(100);
    expect(m.products_available_rate).toBe(100);
    expect(m.independence_encouraged_rate).toBe(100);
    expect(m.routine_established_rate).toBe(100);
    expect(m.care_plan_updated_rate).toBe(100);
  });

  it("calculates rates at 50% when half true", () => {
    const records = [
      makeRecord({ id: "1", dignity_maintained: true }),
      makeRecord({ id: "2", dignity_maintained: false }),
    ];
    const m = computePersonalHygieneMetrics(records);
    expect(m.dignity_maintained_rate).toBe(50);
  });

  it("populates breakdowns by area, support, progress, sensitivity", () => {
    const records = [
      makeRecord({ id: "1", hygiene_area: "bathing_showering", support_level: "independent", progress_rating: "good", sensitivity_level: "standard" }),
      makeRecord({ id: "2", hygiene_area: "dental_care", support_level: "full_support", progress_rating: "excellent", sensitivity_level: "trauma_informed" }),
    ];
    const m = computePersonalHygieneMetrics(records);
    expect(m.by_hygiene_area.bathing_showering).toBe(1);
    expect(m.by_hygiene_area.dental_care).toBe(1);
    expect(m.by_support_level.independent).toBe(1);
    expect(m.by_support_level.full_support).toBe(1);
    expect(m.by_progress_rating.good).toBe(1);
    expect(m.by_progress_rating.excellent).toBe(1);
    expect(m.by_sensitivity_level.standard).toBe(1);
    expect(m.by_sensitivity_level.trauma_informed).toBe(1);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
    ];
    const m = computePersonalHygieneMetrics(records);
    expect(m.unique_children).toBe(2);
  });
});

// -- identifyPersonalHygieneAlerts --------------------------------------------

describe("identifyPersonalHygieneAlerts", () => {
  it("returns empty array when no issues", () => {
    const alerts = identifyPersonalHygieneAlerts([makeRecord()]);
    expect(alerts).toEqual([]);
  });

  it("flags critical dignity_not_maintained per record", () => {
    const records = [makeRecord({ dignity_maintained: false })];
    const alerts = identifyPersonalHygieneAlerts(records);
    const dn = alerts.filter((a) => a.type === "dignity_not_maintained");
    expect(dn.length).toBe(1);
    expect(dn[0].severity).toBe("critical");
  });

  it("flags high child_not_comfortable when >= 1", () => {
    const records = [makeRecord({ child_comfortable: false })];
    const alerts = identifyPersonalHygieneAlerts(records);
    const nc = alerts.filter((a) => a.type === "child_not_comfortable");
    expect(nc.length).toBe(1);
    expect(nc[0].severity).toBe("high");
  });

  it("flags high products_unavailable when >= 2", () => {
    const records = [
      makeRecord({ id: "1", products_available: false }),
      makeRecord({ id: "2", products_available: false }),
    ];
    const alerts = identifyPersonalHygieneAlerts(records);
    const pu = alerts.filter((a) => a.type === "products_unavailable");
    expect(pu.length).toBe(1);
    expect(pu[0].severity).toBe("high");
  });

  it("does not flag products_unavailable when only 1", () => {
    const records = [makeRecord({ products_available: false })];
    const alerts = identifyPersonalHygieneAlerts(records);
    const pu = alerts.filter((a) => a.type === "products_unavailable");
    expect(pu.length).toBe(0);
  });

  it("flags medium not_culturally_sensitive when >= 2", () => {
    const records = [
      makeRecord({ id: "1", culturally_sensitive: false }),
      makeRecord({ id: "2", culturally_sensitive: false }),
    ];
    const alerts = identifyPersonalHygieneAlerts(records);
    const cs = alerts.filter((a) => a.type === "not_culturally_sensitive");
    expect(cs.length).toBe(1);
    expect(cs[0].severity).toBe("medium");
  });

  it("flags medium care_plan_not_updated when >= 3", () => {
    const records = [
      makeRecord({ id: "1", care_plan_updated: false }),
      makeRecord({ id: "2", care_plan_updated: false }),
      makeRecord({ id: "3", care_plan_updated: false }),
    ];
    const alerts = identifyPersonalHygieneAlerts(records);
    const cp = alerts.filter((a) => a.type === "care_plan_not_updated");
    expect(cp.length).toBe(1);
    expect(cp[0].severity).toBe("medium");
  });

  it("does not flag care_plan_not_updated when only 2", () => {
    const records = [
      makeRecord({ id: "1", care_plan_updated: false }),
      makeRecord({ id: "2", care_plan_updated: false }),
    ];
    const alerts = identifyPersonalHygieneAlerts(records);
    const cp = alerts.filter((a) => a.type === "care_plan_not_updated");
    expect(cp.length).toBe(0);
  });
});
