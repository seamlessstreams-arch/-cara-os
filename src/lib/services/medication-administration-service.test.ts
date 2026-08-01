import { describe, it, expect } from "vitest";
import {
  computeAdministrationMetrics,
  identifyAdministrationAlerts,
  type MedicationAdministration,
} from "./medication-administration-service";

function makeRecord(
  overrides: Partial<MedicationAdministration> = {},
): MedicationAdministration {
  return {
    id: "rec-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    medication_name: "Ibuprofen",
    medication_type: "prescribed_regular",
    dosage: "200mg",
    administration_route: "oral",
    administration_outcome: "administered",
    scheduled_time: "2026-05-20T08:00:00Z",
    actual_time: "2026-05-20T08:05:00Z",
    administered_by: "Staff A",
    witness_status: "not_required",
    witness_name: null,
    reason_for_prn: null,
    reason_for_refusal: null,
    stock_balance: 20,
    controlled_drug: false,
    mar_chart_updated: true,
    side_effects_observed: false,
    side_effects_details: null,
    notes: null,
    created_at: "2026-05-20T08:05:00Z",
    updated_at: "2026-05-20T08:05:00Z",
    ...overrides,
  };
}

describe("computeAdministrationMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeAdministrationMetrics([], 4);
    expect(m.total_administrations).toBe(0);
    expect(m.children_with_medication).toBe(0);
    expect(m.medication_coverage).toBe(0);
    expect(m.administration_rate).toBeNull();; expect(m.refusal_rate).toBeNull();; });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "1", child_id: "c1", child_name: "Child A", administration_outcome: "administered", medication_type: "prescribed_prn" }),
      makeRecord({ id: "2", child_id: "c1", child_name: "Child A", administration_outcome: "refused" }),
      makeRecord({ id: "3", child_id: "c2", child_name: "Child B", administration_outcome: "withheld" }),
      makeRecord({ id: "4", child_id: "c2", child_name: "Child B", administration_outcome: "delayed" }),
      makeRecord({ id: "5", child_id: "c3", child_name: "Child C", administration_outcome: "self_administered", controlled_drug: true, witness_status: "yes_witnessed" }),
    ];
    const m = computeAdministrationMetrics(records, 4);
    expect(m.total_administrations).toBe(5);
    expect(m.children_with_medication).toBe(3);
    expect(m.medication_coverage).toBe(75); // 3/4
    expect(m.administered_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.withheld_count).toBe(1);
    expect(m.delayed_count).toBe(1);
    expect(m.self_administered_count).toBe(1);
    expect(m.administration_rate).toBe(20); // 1/5
    expect(m.refusal_rate).toBe(20); // 1/5
    expect(m.controlled_drug_count).toBe(1);
    expect(m.controlled_drug_witnessed_rate).toBe(100);
    expect(m.prn_count).toBe(1);
    expect(m.by_child["Child A"]).toBe(2);
    expect(m.by_child["Child B"]).toBe(2);
  });

  it("computes MAR chart and side effects rates", () => {
    const records = [
      makeRecord({ id: "1", mar_chart_updated: true, side_effects_observed: true }),
      makeRecord({ id: "2", mar_chart_updated: false, side_effects_observed: false }),
    ];
    const m = computeAdministrationMetrics(records, 4);
    expect(m.mar_chart_updated_rate).toBe(50);
    expect(m.side_effects_count).toBe(1);
    expect(m.side_effects_rate).toBe(50);
  });
});

describe("identifyAdministrationAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyAdministrationAlerts([])).toHaveLength(0);
  });

  it("triggers cd_not_witnessed (critical) when controlled drug administered but not witnessed", () => {
    const records = [
      makeRecord({ id: "a1", controlled_drug: true, witness_status: "yes_not_witnessed", administration_outcome: "administered" }),
    ];
    const alerts = identifyAdministrationAlerts(records);
    const a = alerts.find((x) => x.type === "cd_not_witnessed");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("does NOT trigger cd_not_witnessed when witness_status is yes_witnessed", () => {
    const records = [
      makeRecord({ id: "a1", controlled_drug: true, witness_status: "yes_witnessed", administration_outcome: "administered" }),
    ];
    const alerts = identifyAdministrationAlerts(records);
    expect(alerts.find((x) => x.type === "cd_not_witnessed")).toBeUndefined();
  });

  it("triggers side_effects (high) when side_effects_observed=true", () => {
    const records = [
      makeRecord({ id: "a2", side_effects_observed: true, side_effects_details: "Nausea" }),
    ];
    const alerts = identifyAdministrationAlerts(records);
    const a = alerts.find((x) => x.type === "side_effects");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers high_refusal (high) when child has >= 3 records and > 50% refused", () => {
    const records = [
      makeRecord({ id: "1", child_id: "c1", child_name: "Resistant Child", administration_outcome: "refused" }),
      makeRecord({ id: "2", child_id: "c1", child_name: "Resistant Child", administration_outcome: "refused" }),
      makeRecord({ id: "3", child_id: "c1", child_name: "Resistant Child", administration_outcome: "administered" }),
    ];
    const alerts = identifyAdministrationAlerts(records);
    const a = alerts.find((x) => x.type === "high_refusal");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("does NOT trigger high_refusal when refusal rate <= 50%", () => {
    const records = [
      makeRecord({ id: "1", child_id: "c1", administration_outcome: "refused" }),
      makeRecord({ id: "2", child_id: "c1", administration_outcome: "administered" }),
      makeRecord({ id: "3", child_id: "c1", administration_outcome: "administered" }),
      makeRecord({ id: "4", child_id: "c1", administration_outcome: "administered" }),
    ];
    const alerts = identifyAdministrationAlerts(records);
    expect(alerts.find((x) => x.type === "high_refusal")).toBeUndefined();
  });

  it("triggers mar_not_updated (medium) when >= 2 administrations without MAR update (excluding not_required)", () => {
    const records = [
      makeRecord({ id: "1", mar_chart_updated: false, administration_outcome: "administered" }),
      makeRecord({ id: "2", mar_chart_updated: false, administration_outcome: "refused" }),
    ];
    const alerts = identifyAdministrationAlerts(records);
    const a = alerts.find((x) => x.type === "mar_not_updated");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("triggers not_available (medium) when >= 1 medication was not_available", () => {
    const records = [
      makeRecord({ id: "1", administration_outcome: "not_available" }),
    ];
    const alerts = identifyAdministrationAlerts(records);
    const a = alerts.find((x) => x.type === "not_available");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });
});
