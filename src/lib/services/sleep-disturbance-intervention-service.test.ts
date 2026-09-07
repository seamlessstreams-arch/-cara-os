import { describe, it, expect } from "vitest";
import {
  computeSleepDisturbanceMetrics,
  computeSleepDisturbanceAlerts,
  type SleepDisturbanceInterventionRow,
} from "./sleep-disturbance-intervention-service";

function makeRow(
  overrides: Partial<SleepDisturbanceInterventionRow> = {},
): SleepDisturbanceInterventionRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: null,
    incident_date: "2025-06-01",
    disturbance_type: "nightmares",
    intervention_type: "reassurance",
    severity_level: "mild",
    outcome_status: "resolved_same_night",
    child_settled_within_hour: true,
    sleep_plan_in_place: true,
    clinical_referral_made: false,
    trauma_link_identified: false,
    parent_carer_informed: true,
    pattern_identified: false,
    environment_adapted: false,
    staff_debriefed: true,
    staff_on_duty: null,
    duration_minutes: null,
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

// ── Metrics ──────────────────────────────────────────────────────────────

describe("computeSleepDisturbanceMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeSleepDisturbanceMetrics([]);
    expect(m.total_incidents).toBe(0);
    expect(m.severe_count).toBe(0);
    expect(m.crisis_count).toBe(0);
    expect(m.trauma_linked_count).toBe(0);
    expect(m.ongoing_count).toBe(0);
    expect(m.settled_within_hour_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts severity levels correctly", () => {
    const rows = [
      makeRow({ severity_level: "severe" }),
      makeRow({ severity_level: "crisis" }),
      makeRow({ severity_level: "crisis" }),
      makeRow({ severity_level: "mild" }),
    ];
    const m = computeSleepDisturbanceMetrics(rows);
    expect(m.total_incidents).toBe(4);
    expect(m.severe_count).toBe(1);
    expect(m.crisis_count).toBe(2);
  });

  it("counts trauma-linked and ongoing", () => {
    const rows = [
      makeRow({ trauma_link_identified: true, outcome_status: "ongoing" }),
      makeRow({ trauma_link_identified: true, outcome_status: "resolved_same_night" }),
      makeRow({ outcome_status: "ongoing" }),
    ];
    const m = computeSleepDisturbanceMetrics(rows);
    expect(m.trauma_linked_count).toBe(2);
    expect(m.ongoing_count).toBe(2);
  });

  it("computes boolean rates", () => {
    const rows = [
      makeRow({ child_settled_within_hour: true, staff_debriefed: false }),
      makeRow({ child_settled_within_hour: false, staff_debriefed: false }),
    ];
    const m = computeSleepDisturbanceMetrics(rows);
    expect(m.settled_within_hour_rate).toBe(50);
    expect(m.staff_debriefed_rate).toBe(0);
  });

  it("counts unique children", () => {
    const rows = [
      makeRow({ child_name: "Alice" }),
      makeRow({ child_name: "Alice" }),
      makeRow({ child_name: "Bob" }),
    ];
    const m = computeSleepDisturbanceMetrics(rows);
    expect(m.unique_children).toBe(2);
  });

  it("breaks down by disturbance type and severity", () => {
    const rows = [
      makeRow({ disturbance_type: "nightmares", severity_level: "mild" }),
      makeRow({ disturbance_type: "nightmares", severity_level: "severe" }),
      makeRow({ disturbance_type: "insomnia", severity_level: "mild" }),
    ];
    const m = computeSleepDisturbanceMetrics(rows);
    expect(m.disturbance_type_breakdown["nightmares"]).toBe(2);
    expect(m.disturbance_type_breakdown["insomnia"]).toBe(1);
    expect(m.severity_breakdown["mild"]).toBe(2);
    expect(m.severity_breakdown["severe"]).toBe(1);
  });
});

// ── Alerts ───────────────────────────────────────────────────────────────

describe("computeSleepDisturbanceAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(computeSleepDisturbanceAlerts([])).toEqual([]);
  });

  it("fires critical alert for crisis without clinical referral", () => {
    const row = makeRow({ severity_level: "crisis", clinical_referral_made: false });
    const alerts = computeSleepDisturbanceAlerts([row]);
    expect(alerts.some((a) => a.type === "crisis_no_clinical_referral" && a.severity === "critical")).toBe(true);
  });

  it("does NOT fire crisis alert when referral was made", () => {
    const row = makeRow({ severity_level: "crisis", clinical_referral_made: true });
    const alerts = computeSleepDisturbanceAlerts([row]);
    expect(alerts.some((a) => a.type === "crisis_no_clinical_referral")).toBe(false);
  });

  it("fires high alert for severe without sleep plan", () => {
    const row = makeRow({ severity_level: "severe", sleep_plan_in_place: false });
    const alerts = computeSleepDisturbanceAlerts([row]);
    expect(alerts.some((a) => a.type === "severe_no_sleep_plan" && a.severity === "high")).toBe(true);
  });

  it("fires high alert for trauma link without therapeutic support", () => {
    const row = makeRow({ trauma_link_identified: true, intervention_type: "reassurance" });
    const alerts = computeSleepDisturbanceAlerts([row]);
    expect(alerts.some((a) => a.type === "trauma_link_no_therapeutic_support" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire trauma alert when intervention is therapeutic_support", () => {
    const row = makeRow({ trauma_link_identified: true, intervention_type: "therapeutic_support" });
    const alerts = computeSleepDisturbanceAlerts([row]);
    expect(alerts.some((a) => a.type === "trauma_link_no_therapeutic_support")).toBe(false);
  });

  it("fires medium alert for pattern without environment adaptation", () => {
    const row = makeRow({ pattern_identified: true, environment_adapted: false });
    const alerts = computeSleepDisturbanceAlerts([row]);
    expect(alerts.some((a) => a.type === "pattern_no_environment_adaptation" && a.severity === "medium")).toBe(true);
  });

  it("fires medium alert for 3+ incidents for same child", () => {
    const rows = [
      makeRow({ id: "r1", child_name: "Alice" }),
      makeRow({ id: "r2", child_name: "Alice" }),
      makeRow({ id: "r3", child_name: "Alice" }),
    ];
    const alerts = computeSleepDisturbanceAlerts(rows);
    expect(alerts.some((a) => a.type === "repeat_incidents")).toBe(true);
  });

  it("does NOT fire repeat_incidents for 2 incidents", () => {
    const rows = [
      makeRow({ id: "r1", child_name: "Alice" }),
      makeRow({ id: "r2", child_name: "Alice" }),
    ];
    const alerts = computeSleepDisturbanceAlerts(rows);
    expect(alerts.some((a) => a.type === "repeat_incidents")).toBe(false);
  });
});
