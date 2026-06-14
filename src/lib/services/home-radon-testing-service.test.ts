import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
  type HomeRadonTestingRow,
} from "./home-radon-testing-service";

function makeRow(overrides: Partial<HomeRadonTestingRow> = {}): HomeRadonTestingRow {
  return {
    id: "row-1",
    home_id: "home-1",
    test_date: "2026-05-01",
    tester_name: "Tester A",
    test_location: "Living Room",
    test_duration_days: 90,
    radon_level_bq_m3: 50,
    above_action_level: false,
    above_target_level: false,
    mitigation_required: false,
    mitigation_type: null,
    mitigation_installed: false,
    post_mitigation_level: null,
    retest_date: null,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics (radon)", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_tests).toBe(0);
    expect(m.above_action_count).toBe(0);
    expect(m.above_target_count).toBe(0);
    expect(m.mitigation_required_count).toBe(0);
    expect(m.mitigation_installed_rate).toBe(0);
    expect(m.avg_radon_level).toBe(0);
    expect(m.max_radon_level).toBe(0);
    expect(m.retest_scheduled_rate).toBe(0);
    expect(m.compliant_count).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.unique_testers).toBe(0);
  });

  it("calculates correctly for populated data", () => {
    const rows = [
      makeRow({ id: "r1", radon_level_bq_m3: 250, above_action_level: true, above_target_level: true, mitigation_required: true, mitigation_installed: true, compliance_status: "Non-Compliant", retest_date: "2026-08-01" }),
      makeRow({ id: "r2", radon_level_bq_m3: 150, above_target_level: true, mitigation_required: true, mitigation_installed: false, tester_name: "Tester B", retest_date: "2026-09-01" }),
      makeRow({ id: "r3", radon_level_bq_m3: 50 }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_tests).toBe(3);
    expect(m.above_action_count).toBe(1);
    expect(m.above_target_count).toBe(2);
    expect(m.mitigation_required_count).toBe(2);
    // mitigation installed: 1 of 2 required = 50%
    expect(m.mitigation_installed_rate).toBe(50);
    // avg: (250+150+50)/3 = 150
    expect(m.avg_radon_level).toBe(150);
    expect(m.max_radon_level).toBe(250);
    // retest: 2/3
    expect(m.retest_scheduled_rate).toBe(66.7);
    expect(m.compliant_count).toBe(2);
    expect(m.non_compliant_count).toBe(1);
    expect(m.unique_testers).toBe(2);
  });
});

describe("computeAlerts (radon)", () => {
  it("returns empty for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns no alerts for compliant data", () => {
    expect(computeAlerts([makeRow()])).toEqual([]);
  });

  it("fires critical above_action_no_mitigation when above action level without mitigation installed", () => {
    const rows = [makeRow({ above_action_level: true, mitigation_installed: false, radon_level_bq_m3: 250 })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "above_action_no_mitigation");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
    expect(found!.message).toContain("200 Bq/m");
  });

  it("does NOT fire above_action_no_mitigation when mitigation IS installed", () => {
    const rows = [makeRow({ above_action_level: true, mitigation_installed: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "above_action_no_mitigation")).toBeUndefined();
  });

  it("fires high non_compliant_status", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "non_compliant_status");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium above_target_no_retest", () => {
    const rows = [makeRow({ above_target_level: true, retest_date: null })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "above_target_no_retest");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("fires medium mitigation_required_no_type", () => {
    const rows = [makeRow({ mitigation_required: true, mitigation_type: null })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "mitigation_required_no_type");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });
});

describe("computeCaraInsights (radon)", () => {
  it("returns 3 insights for empty metrics", () => {
    const insights = computeCaraInsights(computeMetrics([]));
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for populated metrics with action level breaches", () => {
    const m = computeMetrics([
      makeRow({ above_action_level: true, compliance_status: "Non-Compliant", radon_level_bq_m3: 300 }),
    ]);
    const insights = computeCaraInsights(m);
    expect(insights).toHaveLength(3);
    expect(insights[2]).toContain("200 Bq/m");
  });
});
