import { describe, expect, it } from "vitest";
import {
  computeAlerts,
  computeMetrics,
  type KnifeWeaponSafetyRow,
} from "../knife-weapon-safety-service";

function makeRow(
  overrides: Partial<KnifeWeaponSafetyRow> = {},
): KnifeWeaponSafetyRow {
  return {
    id: "r-1",
    home_id: "home_oak",
    record_date: "2026-05-04",
    recorded_by: "Alex Morgan",
    record_type: "Kitchen Knife Audit",
    child_name: null,
    weapon_type: null,
    location_found: null,
    risk_level: "Low",
    kitchen_knives_accounted_for: true,
    kitchen_knife_count: 12,
    sharp_objects_secured: true,
    tool_storage_locked: true,
    search_consent_obtained: null,
    police_notified: false,
    social_worker_informed: false,
    reg_40_notification: false,
    parent_carer_informed: false,
    child_safety_plan_updated: false,
    environmental_changes_made: null,
    educational_content_delivered: false,
    next_audit_date: null,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-04T10:00:00Z",
    updated_at: "2026-05-04T10:00:00Z",
    ...overrides,
  };
}

describe("tri-state judgements", () => {
  it("splits the knife-audit critical between recorded missing knives and an unrecorded count", () => {
    const nullAlert = computeAlerts([
      makeRow({ kitchen_knives_accounted_for: null }),
    ]).find((a) => a.type === "knives_not_accounted");
    const falseAlert = computeAlerts([
      makeRow({ kitchen_knives_accounted_for: false }),
    ]).find((a) => a.type === "knives_not_accounted");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });

  it("raises no knife critical when knives are recorded as accounted for", () => {
    const alerts = computeAlerts([makeRow({ kitchen_knives_accounted_for: true })]);
    expect(alerts.some((a) => a.type === "knives_not_accounted")).toBe(false);
  });

  it("splits the sharp-objects alert the same way", () => {
    const nullAlert = computeAlerts([
      makeRow({ record_type: "Sharp Object Check", sharp_objects_secured: null }),
    ]).find((a) => a.type === "sharp_objects_not_secured");
    const falseAlert = computeAlerts([
      makeRow({ record_type: "Sharp Object Check", sharp_objects_secured: false }),
    ]).find((a) => a.type === "sharp_objects_not_secured");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });

  it("does not dilute the kitchen compliance rate with unrecorded audits", () => {
    const rows = [true, null, null, null].map((v, i) =>
      makeRow({ id: `r-${i}`, kitchen_knives_accounted_for: v }),
    );
    expect(computeMetrics(rows).kitchen_compliance_rate).toBe(100);
  });
});
