import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateSmokingVapingManagement,
  type SmokingVapingManagementRow,
} from "./smoking-vaping-management-service";

function makeRow(
  overrides: Partial<SmokingVapingManagementRow> = {},
): SmokingVapingManagementRow {
  return {
    id: overrides.id ?? "row-1",
    home_id: "home-1",
    child_name: "Child A",
    record_date: "2025-06-01",
    recorded_by: "Staff",
    record_type: "Education Session",
    substance: "Cigarettes",
    usage_frequency: "Non-User",
    motivation_to_quit: "Not Ready",
    nrt_provided: false,
    gp_consulted: false,
    young_person_engaged: true,
    harm_reduction_approach: false,
    education_provided: true,
    peer_influence_addressed: false,
    smoke_free_premises_compliant: true,
    age_verified: true,
    social_worker_informed: false,
    next_review_date: null,
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

// ── Metrics ──────────────────────────────────────────────────────────────

describe("computeMetrics (smoking-vaping)", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.nrt_rate).toBeNull();;
    expect(m.gp_rate).toBeNull();;
    expect(m.engagement_rate).toBeNull();;
    expect(m.daily_user_count).toBe(0);
    expect(m.vape_user_count).toBe(0);
    expect(m.tobacco_user_count).toBe(0);
  });

  it("counts daily users", () => {
    const rows = [
      makeRow({ usage_frequency: "Daily — Light" }),
      makeRow({ usage_frequency: "Daily — Heavy" }),
      makeRow({ usage_frequency: "Occasional" }),
    ];
    const m = computeMetrics(rows);
    expect(m.daily_user_count).toBe(2);
  });

  it("counts vape and tobacco users", () => {
    const rows = [
      makeRow({ substance: "E-Cigarette/Vape — Nicotine" }),
      makeRow({ substance: "E-Cigarette/Vape — Non-Nicotine" }),
      makeRow({ substance: "Cigarettes" }),
      makeRow({ substance: "Roll-Up Tobacco" }),
      makeRow({ substance: "Shisha" }),
      makeRow({ substance: "Nicotine Pouches" }),
    ];
    const m = computeMetrics(rows);
    expect(m.vape_user_count).toBe(2);
    expect(m.tobacco_user_count).toBe(3); // Cigarettes + Roll-Up + Shisha
  });

  it("counts active quitters, former users, and relapses", () => {
    const rows = [
      makeRow({ motivation_to_quit: "Actively Quitting" }),
      makeRow({ motivation_to_quit: "Actively Quitting" }),
      makeRow({ usage_frequency: "Former User" }),
      makeRow({ motivation_to_quit: "Relapsed" }),
      makeRow({ record_type: "Relapse Support" }),
    ];
    const m = computeMetrics(rows);
    expect(m.active_quitters_count).toBe(2);
    expect(m.former_user_count).toBe(1);
    expect(m.relapse_count).toBe(2); // Relapsed motivation + Relapse Support record type
  });

  it("computes boolean rates", () => {
    const rows = [
      makeRow({ nrt_provided: true, gp_consulted: true }),
      makeRow({ nrt_provided: false, gp_consulted: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.nrt_rate).toBe(50);
    expect(m.gp_rate).toBe(50);
  });

  it("counts clinical referrals", () => {
    const rows = [
      makeRow({ record_type: "NRT Provision" }),
      makeRow({ record_type: "GP Referral" }),
      makeRow({ record_type: "Stop Smoking Service Referral" }),
      makeRow({ record_type: "Education Session" }),
    ];
    const m = computeMetrics(rows);
    expect(m.clinical_referral_count).toBe(3);
  });
});

// ── Alerts ───────────────────────────────────────────────────────────────

describe("computeAlerts (smoking-vaping)", () => {
  it("returns no alerts for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical for premises non-compliance", () => {
    const row = makeRow({ smoke_free_premises_compliant: false });
    const alerts = computeAlerts([row]);
    expect(alerts.some((a) => a.type === "premises_non_compliant" && a.severity === "critical")).toBe(true);
  });

  it("fires critical for daily heavy user without GP", () => {
    const row = makeRow({ usage_frequency: "Daily — Heavy", gp_consulted: false });
    const alerts = computeAlerts([row]);
    expect(alerts.some((a) => a.type === "heavy_user_no_gp" && a.severity === "critical")).toBe(true);
  });

  it("fires critical for NRT without GP", () => {
    const row = makeRow({ nrt_provided: true, gp_consulted: false });
    const alerts = computeAlerts([row]);
    expect(alerts.some((a) => a.type === "nrt_without_gp" && a.severity === "critical")).toBe(true);
  });

  it("fires critical for age not verified", () => {
    const row = makeRow({ age_verified: false });
    const alerts = computeAlerts([row]);
    expect(alerts.some((a) => a.type === "age_not_verified" && a.severity === "critical")).toBe(true);
  });

  it("fires high alert for daily user SW not informed", () => {
    const row = makeRow({
      usage_frequency: "Daily — Light",
      social_worker_informed: false,
    });
    const alerts = computeAlerts([row]);
    expect(alerts.some((a) => a.type === "daily_user_sw_not_informed" && a.severity === "high")).toBe(true);
  });

  it("fires high alert for active user disengaged", () => {
    const row = makeRow({
      usage_frequency: "Occasional",
      young_person_engaged: false,
    });
    const alerts = computeAlerts([row]);
    expect(alerts.some((a) => a.type === "active_user_disengaged" && a.severity === "high")).toBe(true);
  });
});

// ── Validation ──────────────────────────────────────────────────────────

describe("validateSmokingVapingManagement", () => {
  it("returns valid for correct input", () => {
    const result = validateSmokingVapingManagement({
      childName: "Alice",
      recordDate: "2025-01-01",
      recordedBy: "Staff",
      recordType: "Education Session",
      substance: "Cigarettes",
      usageFrequency: "Non-User",
      motivationToQuit: "Not Ready",
      smokeFreePremisesCompliant: true,
      ageVerified: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns errors for missing required fields", () => {
    const result = validateSmokingVapingManagement({});
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Child name"))).toBe(true);
    expect(result.errors.some((e) => e.includes("Record date"))).toBe(true);
    expect(result.errors.some((e) => e.includes("Recorded by"))).toBe(true);
  });

  it("errors when smoke-free premises non-compliant", () => {
    const result = validateSmokingVapingManagement({
      childName: "A",
      recordDate: "2025-01-01",
      recordedBy: "S",
      recordType: "Education Session",
      substance: "Cigarettes",
      usageFrequency: "Non-User",
      motivationToQuit: "Not Ready",
      smokeFreePremisesCompliant: false,
      ageVerified: true,
    });
    expect(result.errors.some((e) => e.includes("Smoke-free"))).toBe(true);
  });

  it("errors when NRT provided without GP consultation", () => {
    const result = validateSmokingVapingManagement({
      childName: "A",
      recordDate: "2025-01-01",
      recordedBy: "S",
      recordType: "NRT Provision",
      substance: "Cigarettes",
      usageFrequency: "Daily — Heavy",
      motivationToQuit: "Actively Quitting",
      nrtProvided: true,
      gpConsulted: false,
      smokeFreePremisesCompliant: true,
      ageVerified: true,
    });
    expect(result.errors.some((e) => e.includes("NRT"))).toBe(true);
  });

  it("errors when age verification is false", () => {
    const result = validateSmokingVapingManagement({
      childName: "A",
      recordDate: "2025-01-01",
      recordedBy: "S",
      recordType: "Education Session",
      substance: "Cigarettes",
      usageFrequency: "Non-User",
      motivationToQuit: "Not Ready",
      smokeFreePremisesCompliant: true,
      ageVerified: false,
    });
    expect(result.errors.some((e) => e.includes("Age verification"))).toBe(true);
  });
});
