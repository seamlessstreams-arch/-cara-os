import { describe, it, expect } from "vitest";
import {
  computeCommunalAreaMetrics,
  identifyCommunalAreaAlerts,
  type CommunalAreaRecord,
} from "./communal-area-audit-service";


/** Date string n days in the future — UTC throughout, so it never lands a day
 *  off across a DST boundary, and it floats with the clock so "still in the
 *  future" stays true whenever the suite runs. */
function daysFromNow(n: number): string {
  const [y, m, d] = new Date().toISOString().slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function makeRecord(overrides: Partial<CommunalAreaRecord> = {}): CommunalAreaRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    area_type: "lounge",
    audit_date: "2026-05-15",
    cleanliness_rating: "clean",
    homeliness_rating: "homely",
    safety_check: "all_clear",
    furniture_good_condition: true,
    decoration_fresh: true,
    temperature_comfortable: true,
    lighting_adequate: true,
    ventilation_adequate: true,
    accessible: true,
    child_artwork_displayed: true,
    age_appropriate_resources: true,
    hazards_removed: true,
    fire_exits_clear: true,
    children_consulted: true,
    issues_found: [],
    actions_taken: [],
    audited_by: "staff-1",
    next_audit_date: "2026-06-15",
    notes: null,
    created_at: "2026-05-15T08:00:00Z",
    updated_at: "2026-05-15T08:00:00Z",
    ...overrides,
  };
}

describe("computeCommunalAreaMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeCommunalAreaMetrics([]);
    expect(m.total_audits).toBe(0);
    expect(m.spotless_rate).toBeNull();;
    expect(m.clean_rate).toBeNull();;
    expect(m.unacceptable_count).toBe(0);
    expect(m.very_homely_rate).toBeNull();;
    expect(m.all_clear_rate).toBeNull();;
    expect(m.immediate_risk_count).toBe(0);
  });

  it("computes rates and counts for populated data", () => {
    const records = [
      makeRecord({ id: "r1", cleanliness_rating: "spotless", homeliness_rating: "very_homely", safety_check: "all_clear" }),
      makeRecord({ id: "r2", cleanliness_rating: "clean", homeliness_rating: "homely", safety_check: "all_clear" }),
      makeRecord({ id: "r3", cleanliness_rating: "unacceptable", homeliness_rating: "institutional", safety_check: "immediate_risk" }),
      makeRecord({ id: "r4", cleanliness_rating: "clean", homeliness_rating: "homely", safety_check: "significant_hazard" }),
    ];
    const m = computeCommunalAreaMetrics(records);
    expect(m.total_audits).toBe(4);
    expect(m.spotless_rate).toBe(25); // 1/4
    expect(m.clean_rate).toBe(50); // 2/4
    expect(m.unacceptable_count).toBe(1);
    expect(m.very_homely_rate).toBe(25); // 1/4
    expect(m.institutional_count).toBe(1);
    expect(m.all_clear_rate).toBe(50); // 2/4
    expect(m.immediate_risk_count).toBe(1);
    expect(m.significant_hazard_count).toBe(1);
  });

  it("computes boolean field rates", () => {
    const records = [
      makeRecord({ id: "r1", furniture_good_condition: true, fire_exits_clear: true }),
      makeRecord({ id: "r2", furniture_good_condition: false, fire_exits_clear: false }),
    ];
    const m = computeCommunalAreaMetrics(records);
    expect(m.furniture_good_rate).toBe(50);
    expect(m.fire_exits_clear_rate).toBe(50);
  });

  it("counts overdue audits and area type breakdowns", () => {
    const records = [
      makeRecord({ id: "r1", area_type: "lounge", next_audit_date: "2026-01-01" }),
      makeRecord({ id: "r2", area_type: "kitchen", next_audit_date: daysFromNow(120) }),
      makeRecord({ id: "r3", area_type: "lounge", next_audit_date: null }),
    ];
    const m = computeCommunalAreaMetrics(records);
    expect(m.audit_overdue_count).toBe(1);
    expect(m.by_area_type.lounge).toBe(2);
    expect(m.by_area_type.kitchen).toBe(1);
  });
});

describe("identifyCommunalAreaAlerts", () => {
  it("returns empty alerts for empty data", () => {
    const alerts = identifyCommunalAreaAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("flags immediate safety risk", () => {
    const records = [makeRecord({ safety_check: "immediate_risk" })];
    const alerts = identifyCommunalAreaAlerts(records);
    const riskAlerts = alerts.filter((a) => a.type === "immediate_risk");
    expect(riskAlerts).toHaveLength(1);
    expect(riskAlerts[0].severity).toBe("critical");
  });

  it("flags institutional homeliness rating", () => {
    const records = [makeRecord({ homeliness_rating: "institutional" })];
    const alerts = identifyCommunalAreaAlerts(records);
    const instAlerts = alerts.filter((a) => a.type === "institutional");
    expect(instAlerts).toHaveLength(1);
    expect(instAlerts[0].severity).toBe("high");
  });

  it("flags unacceptable cleanliness (>=1)", () => {
    const records = [makeRecord({ cleanliness_rating: "unacceptable" })];
    const alerts = identifyCommunalAreaAlerts(records);
    const cleanAlerts = alerts.filter((a) => a.type === "unacceptable_cleanliness");
    expect(cleanAlerts).toHaveLength(1);
    expect(cleanAlerts[0].severity).toBe("high");
  });

  it("flags blocked fire exits (>=1)", () => {
    const records = [makeRecord({ fire_exits_clear: false })];
    const alerts = identifyCommunalAreaAlerts(records);
    const exitAlerts = alerts.filter((a) => a.type === "fire_exits_blocked");
    expect(exitAlerts).toHaveLength(1);
    expect(exitAlerts[0].severity).toBe("high");
  });

  it("flags overdue audits (>=1)", () => {
    const records = [makeRecord({ next_audit_date: "2025-01-01" })];
    const alerts = identifyCommunalAreaAlerts(records);
    const overdueAlerts = alerts.filter((a) => a.type === "audit_overdue");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].severity).toBe("medium");
  });
});
