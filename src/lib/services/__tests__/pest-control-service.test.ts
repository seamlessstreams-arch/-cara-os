// ══════════════════════════════════════════════════════════════════════════════
// CARA — PEST CONTROL SERVICE TESTS
// Pure-function unit tests for pest control metrics computation, alert
// identification, and constant validation.
// CHR 2015 Reg 25 (premises — health and safety),
// Reg 36 (fitness of premises — habitable conditions),
// Reg 15 (quality standards — suitable environment).
//
// Covers: routine inspections, pest sightings, treatments,
// prevention measures, contractor visits, and follow-up.
//
// SCCIF: Overall Experiences — "The home is clean and well-maintained."
// "Children live in a safe, hygienic environment."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  INSPECTION_TYPES,
  PEST_TYPES,
  TREATMENT_OUTCOMES,
  RISK_LEVELS,
} from "../pest-control-service";

import type { PestControlRecord } from "../pest-control-service";

const { computePestControlMetrics, identifyPestControlAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

/** Build a minimal PestControlRecord with sensible defaults. */
function makeRecord(overrides: Partial<PestControlRecord> = {}): PestControlRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    inspection_type: "routine_inspection",
    inspection_date: "2024-06-01",
    pest_type: "none_found",
    treatment_outcome: "no_treatment_needed",
    risk_level: "no_risk",
    location_in_home: "Kitchen",
    contractor_name:
      "contractor_name" in (overrides ?? {})
        ? (overrides!.contractor_name ?? null)
        : null,
    contractor_certified: true,
    children_informed: true,
    children_relocated: false,
    chemicals_used: false,
    chemical_safety_sheet_obtained: false,
    area_ventilated: true,
    food_areas_affected: false,
    entry_points_sealed: false,
    prevention_measures_implemented: false,
    follow_up_required: false,
    follow_up_date:
      "follow_up_date" in (overrides ?? {})
        ? (overrides!.follow_up_date ?? null)
        : null,
    follow_up_completed: false,
    environmental_health_notified: false,
    issues_found: [],
    actions_taken: [],
    inspected_by: "Inspector Smith",
    notes:
      "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "2024-06-01T10:00:00.000Z",
    updated_at: "2024-06-01T10:00:00.000Z",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("INSPECTION_TYPES", () => {
  it("has exactly 10 entries", () => {
    expect(INSPECTION_TYPES).toHaveLength(10);
  });

  it("contains unique type values", () => {
    const values = INSPECTION_TYPES.map((e) => e.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = INSPECTION_TYPES.map((e) => e.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const e of INSPECTION_TYPES) {
      expect(e.label.length).toBeGreaterThan(0);
    }
  });

  it("includes routine_inspection", () => {
    expect(INSPECTION_TYPES.find((e) => e.type === "routine_inspection")).toBeTruthy();
  });

  it("includes reactive_call", () => {
    expect(INSPECTION_TYPES.find((e) => e.type === "reactive_call")).toBeTruthy();
  });

  it("includes follow_up", () => {
    expect(INSPECTION_TYPES.find((e) => e.type === "follow_up")).toBeTruthy();
  });

  it("includes annual_contract", () => {
    expect(INSPECTION_TYPES.find((e) => e.type === "annual_contract")).toBeTruthy();
  });

  it("includes emergency_treatment", () => {
    expect(INSPECTION_TYPES.find((e) => e.type === "emergency_treatment")).toBeTruthy();
  });

  it("includes prevention_visit", () => {
    expect(INSPECTION_TYPES.find((e) => e.type === "prevention_visit")).toBeTruthy();
  });

  it("includes complaint_investigation", () => {
    expect(INSPECTION_TYPES.find((e) => e.type === "complaint_investigation")).toBeTruthy();
  });

  it("includes post_treatment_check", () => {
    expect(INSPECTION_TYPES.find((e) => e.type === "post_treatment_check")).toBeTruthy();
  });

  it("includes seasonal_check", () => {
    expect(INSPECTION_TYPES.find((e) => e.type === "seasonal_check")).toBeTruthy();
  });

  it("includes other", () => {
    expect(INSPECTION_TYPES.find((e) => e.type === "other")).toBeTruthy();
  });
});

describe("PEST_TYPES", () => {
  it("has exactly 10 entries", () => {
    expect(PEST_TYPES).toHaveLength(10);
  });

  it("contains unique type values", () => {
    const values = PEST_TYPES.map((e) => e.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = PEST_TYPES.map((e) => e.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const e of PEST_TYPES) {
      expect(e.label.length).toBeGreaterThan(0);
    }
  });

  it("includes rodents", () => {
    expect(PEST_TYPES.find((e) => e.type === "rodents")).toBeTruthy();
  });

  it("includes insects", () => {
    expect(PEST_TYPES.find((e) => e.type === "insects")).toBeTruthy();
  });

  it("includes birds", () => {
    expect(PEST_TYPES.find((e) => e.type === "birds")).toBeTruthy();
  });

  it("includes wasps_bees", () => {
    expect(PEST_TYPES.find((e) => e.type === "wasps_bees")).toBeTruthy();
  });

  it("includes ants", () => {
    expect(PEST_TYPES.find((e) => e.type === "ants")).toBeTruthy();
  });

  it("includes cockroaches", () => {
    expect(PEST_TYPES.find((e) => e.type === "cockroaches")).toBeTruthy();
  });

  it("includes bed_bugs", () => {
    expect(PEST_TYPES.find((e) => e.type === "bed_bugs")).toBeTruthy();
  });

  it("includes fleas", () => {
    expect(PEST_TYPES.find((e) => e.type === "fleas")).toBeTruthy();
  });

  it("includes moths", () => {
    expect(PEST_TYPES.find((e) => e.type === "moths")).toBeTruthy();
  });

  it("includes none_found", () => {
    expect(PEST_TYPES.find((e) => e.type === "none_found")).toBeTruthy();
  });
});

describe("TREATMENT_OUTCOMES", () => {
  it("has exactly 5 entries", () => {
    expect(TREATMENT_OUTCOMES).toHaveLength(5);
  });

  it("contains unique outcome values", () => {
    const values = TREATMENT_OUTCOMES.map((e) => e.outcome);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = TREATMENT_OUTCOMES.map((e) => e.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const e of TREATMENT_OUTCOMES) {
      expect(e.label.length).toBeGreaterThan(0);
    }
  });

  it("includes resolved", () => {
    expect(TREATMENT_OUTCOMES.find((e) => e.outcome === "resolved")).toBeTruthy();
  });

  it("includes partially_resolved", () => {
    expect(TREATMENT_OUTCOMES.find((e) => e.outcome === "partially_resolved")).toBeTruthy();
  });

  it("includes ongoing", () => {
    expect(TREATMENT_OUTCOMES.find((e) => e.outcome === "ongoing")).toBeTruthy();
  });

  it("includes no_treatment_needed", () => {
    expect(TREATMENT_OUTCOMES.find((e) => e.outcome === "no_treatment_needed")).toBeTruthy();
  });

  it("includes referred_to_specialist", () => {
    expect(TREATMENT_OUTCOMES.find((e) => e.outcome === "referred_to_specialist")).toBeTruthy();
  });
});

describe("RISK_LEVELS", () => {
  it("has exactly 5 entries", () => {
    expect(RISK_LEVELS).toHaveLength(5);
  });

  it("contains unique level values", () => {
    const values = RISK_LEVELS.map((e) => e.level);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = RISK_LEVELS.map((e) => e.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const e of RISK_LEVELS) {
      expect(e.label.length).toBeGreaterThan(0);
    }
  });

  it("includes no_risk", () => {
    expect(RISK_LEVELS.find((e) => e.level === "no_risk")).toBeTruthy();
  });

  it("includes low", () => {
    expect(RISK_LEVELS.find((e) => e.level === "low")).toBeTruthy();
  });

  it("includes medium", () => {
    expect(RISK_LEVELS.find((e) => e.level === "medium")).toBeTruthy();
  });

  it("includes high", () => {
    expect(RISK_LEVELS.find((e) => e.level === "high")).toBeTruthy();
  });

  it("includes critical", () => {
    expect(RISK_LEVELS.find((e) => e.level === "critical")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computePestControlMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computePestControlMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────
  describe("empty records", () => {
    it("returns zero total_inspections", () => {
      expect(computePestControlMetrics([]).total_inspections).toBe(0);
    });

    it("returns zero routine_count", () => {
      expect(computePestControlMetrics([]).routine_count).toBe(0);
    });

    it("returns zero reactive_count", () => {
      expect(computePestControlMetrics([]).reactive_count).toBe(0);
    });

    it("returns zero emergency_count", () => {
      expect(computePestControlMetrics([]).emergency_count).toBe(0);
    });

    it("returns zero follow_up_count", () => {
      expect(computePestControlMetrics([]).follow_up_count).toBe(0);
    });

    it("returns zero resolved_rate", () => {
      expect(computePestControlMetrics([]).resolved_rate).toBeNull();;
    });

    it("returns zero ongoing_count", () => {
      expect(computePestControlMetrics([]).ongoing_count).toBe(0);
    });

    it("returns zero no_pest_found_rate", () => {
      expect(computePestControlMetrics([]).no_pest_found_rate).toBeNull();;
    });

    it("returns zero high_risk_count", () => {
      expect(computePestControlMetrics([]).high_risk_count).toBe(0);
    });

    it("returns zero critical_risk_count", () => {
      expect(computePestControlMetrics([]).critical_risk_count).toBe(0);
    });

    it("returns zero contractor_certified_rate", () => {
      expect(computePestControlMetrics([]).contractor_certified_rate).toBeNull();;
    });

    it("returns zero children_informed_rate", () => {
      expect(computePestControlMetrics([]).children_informed_rate).toBeNull();;
    });

    it("returns zero chemicals_used_count", () => {
      expect(computePestControlMetrics([]).chemicals_used_count).toBe(0);
    });

    it("returns zero safety_sheet_obtained_rate", () => {
      expect(computePestControlMetrics([]).safety_sheet_obtained_rate).toBeNull();;
    });

    it("returns zero food_areas_affected_count", () => {
      expect(computePestControlMetrics([]).food_areas_affected_count).toBe(0);
    });

    it("returns zero entry_points_sealed_rate", () => {
      expect(computePestControlMetrics([]).entry_points_sealed_rate).toBeNull();;
    });

    it("returns zero prevention_implemented_rate", () => {
      expect(computePestControlMetrics([]).prevention_implemented_rate).toBeNull();;
    });

    it("returns zero follow_up_required_count", () => {
      expect(computePestControlMetrics([]).follow_up_required_count).toBe(0);
    });

    it("returns zero follow_up_overdue_count", () => {
      expect(computePestControlMetrics([]).follow_up_overdue_count).toBe(0);
    });

    it("returns zero env_health_notified_count", () => {
      expect(computePestControlMetrics([]).env_health_notified_count).toBe(0);
    });

    it("returns empty by_inspection_type", () => {
      expect(computePestControlMetrics([]).by_inspection_type).toEqual({});
    });

    it("returns empty by_pest_type", () => {
      expect(computePestControlMetrics([]).by_pest_type).toEqual({});
    });

    it("returns empty by_treatment_outcome", () => {
      expect(computePestControlMetrics([]).by_treatment_outcome).toEqual({});
    });

    it("returns empty by_risk_level", () => {
      expect(computePestControlMetrics([]).by_risk_level).toEqual({});
    });
  });

  // ── Single record (defaults) ───────────────────────────────────────
  describe("single record", () => {
    const single = [makeRecord()];

    it("total_inspections is 1", () => {
      expect(computePestControlMetrics(single).total_inspections).toBe(1);
    });

    it("routine_count is 1 for routine_inspection", () => {
      expect(computePestControlMetrics(single).routine_count).toBe(1);
    });

    it("reactive_count is 0 for routine_inspection", () => {
      expect(computePestControlMetrics(single).reactive_count).toBe(0);
    });

    it("emergency_count is 0 for routine_inspection", () => {
      expect(computePestControlMetrics(single).emergency_count).toBe(0);
    });

    it("follow_up_count is 0 for routine_inspection", () => {
      expect(computePestControlMetrics(single).follow_up_count).toBe(0);
    });

    it("resolved_rate is 0 for no_treatment_needed", () => {
      expect(computePestControlMetrics(single).resolved_rate).toBe(0);
    });

    it("ongoing_count is 0 for no_treatment_needed", () => {
      expect(computePestControlMetrics(single).ongoing_count).toBe(0);
    });

    it("no_pest_found_rate is 100 for none_found", () => {
      expect(computePestControlMetrics(single).no_pest_found_rate).toBe(100);
    });

    it("high_risk_count is 0 for no_risk", () => {
      expect(computePestControlMetrics(single).high_risk_count).toBe(0);
    });

    it("critical_risk_count is 0 for no_risk", () => {
      expect(computePestControlMetrics(single).critical_risk_count).toBe(0);
    });

    it("contractor_certified_rate is 100 when contractor_certified is true", () => {
      expect(computePestControlMetrics(single).contractor_certified_rate).toBe(100);
    });

    it("children_informed_rate is 100 when children_informed is true", () => {
      expect(computePestControlMetrics(single).children_informed_rate).toBe(100);
    });

    it("chemicals_used_count is 0 when chemicals_used is false", () => {
      expect(computePestControlMetrics(single).chemicals_used_count).toBe(0);
    });

    it("safety_sheet_obtained_rate is 0 when no chemicals used", () => {
      expect(computePestControlMetrics(single).safety_sheet_obtained_rate).toBeNull();;
    });

    it("food_areas_affected_count is 0 when food_areas_affected is false", () => {
      expect(computePestControlMetrics(single).food_areas_affected_count).toBe(0);
    });

    it("entry_points_sealed_rate is 0 when entry_points_sealed is false", () => {
      expect(computePestControlMetrics(single).entry_points_sealed_rate).toBe(0);
    });

    it("prevention_implemented_rate is 0 when prevention_measures_implemented is false", () => {
      expect(computePestControlMetrics(single).prevention_implemented_rate).toBe(0);
    });

    it("follow_up_required_count is 0 when follow_up_required is false", () => {
      expect(computePestControlMetrics(single).follow_up_required_count).toBe(0);
    });

    it("follow_up_overdue_count is 0 when follow_up_required is false", () => {
      expect(computePestControlMetrics(single).follow_up_overdue_count).toBe(0);
    });

    it("env_health_notified_count is 0 when environmental_health_notified is false", () => {
      expect(computePestControlMetrics(single).env_health_notified_count).toBe(0);
    });

    it("by_inspection_type groups single record correctly", () => {
      expect(computePestControlMetrics(single).by_inspection_type).toEqual({ routine_inspection: 1 });
    });

    it("by_pest_type groups single record correctly", () => {
      expect(computePestControlMetrics(single).by_pest_type).toEqual({ none_found: 1 });
    });

    it("by_treatment_outcome groups single record correctly", () => {
      expect(computePestControlMetrics(single).by_treatment_outcome).toEqual({ no_treatment_needed: 1 });
    });

    it("by_risk_level groups single record correctly", () => {
      expect(computePestControlMetrics(single).by_risk_level).toEqual({ no_risk: 1 });
    });
  });

  // ── Specific inspection type counts ────────────────────────────────
  describe("inspection type counts", () => {
    it("reactive_count is 1 for reactive_call", () => {
      const r = [makeRecord({ inspection_type: "reactive_call" })];
      expect(computePestControlMetrics(r).reactive_count).toBe(1);
    });

    it("emergency_count is 1 for emergency_treatment", () => {
      const r = [makeRecord({ inspection_type: "emergency_treatment" })];
      expect(computePestControlMetrics(r).emergency_count).toBe(1);
    });

    it("follow_up_count is 1 for follow_up", () => {
      const r = [makeRecord({ inspection_type: "follow_up" })];
      expect(computePestControlMetrics(r).follow_up_count).toBe(1);
    });

    it("routine_count is 0 for non-routine type", () => {
      const r = [makeRecord({ inspection_type: "seasonal_check" })];
      expect(computePestControlMetrics(r).routine_count).toBe(0);
    });
  });

  // ── Treatment outcome metrics ─────────────────────────────────────
  describe("treatment outcomes", () => {
    it("resolved_rate is 100 when all records are resolved", () => {
      const r = [makeRecord({ treatment_outcome: "resolved" })];
      expect(computePestControlMetrics(r).resolved_rate).toBe(100);
    });

    it("ongoing_count is 1 for ongoing treatment", () => {
      const r = [makeRecord({ treatment_outcome: "ongoing" })];
      expect(computePestControlMetrics(r).ongoing_count).toBe(1);
    });

    it("resolved_rate is 50 for 1 of 2 resolved", () => {
      const r = [
        makeRecord({ treatment_outcome: "resolved" }),
        makeRecord({ treatment_outcome: "ongoing" }),
      ];
      expect(computePestControlMetrics(r).resolved_rate).toBe(50);
    });

    it("ongoing_count is 2 for two ongoing records", () => {
      const r = [
        makeRecord({ treatment_outcome: "ongoing" }),
        makeRecord({ treatment_outcome: "ongoing" }),
      ];
      expect(computePestControlMetrics(r).ongoing_count).toBe(2);
    });
  });

  // ── Pest type metrics ──────────────────────────────────────────────
  describe("pest type metrics", () => {
    it("no_pest_found_rate is 0 when pest is found", () => {
      const r = [makeRecord({ pest_type: "rodents" })];
      expect(computePestControlMetrics(r).no_pest_found_rate).toBe(0);
    });

    it("no_pest_found_rate is 50 for 1 none_found out of 2", () => {
      const r = [
        makeRecord({ pest_type: "none_found" }),
        makeRecord({ pest_type: "ants" }),
      ];
      expect(computePestControlMetrics(r).no_pest_found_rate).toBe(50);
    });
  });

  // ── Risk level metrics ────────────────────────────────────────────
  describe("risk levels", () => {
    it("high_risk_count is 1 for high risk", () => {
      const r = [makeRecord({ risk_level: "high" })];
      expect(computePestControlMetrics(r).high_risk_count).toBe(1);
    });

    it("critical_risk_count is 1 for critical risk", () => {
      const r = [makeRecord({ risk_level: "critical" })];
      expect(computePestControlMetrics(r).critical_risk_count).toBe(1);
    });

    it("high_risk_count is 0 for medium risk", () => {
      const r = [makeRecord({ risk_level: "medium" })];
      expect(computePestControlMetrics(r).high_risk_count).toBe(0);
    });

    it("critical_risk_count is 0 for high risk", () => {
      const r = [makeRecord({ risk_level: "high" })];
      expect(computePestControlMetrics(r).critical_risk_count).toBe(0);
    });

    it("high_risk_count is 2 for two high-risk records", () => {
      const r = [
        makeRecord({ risk_level: "high" }),
        makeRecord({ risk_level: "high" }),
      ];
      expect(computePestControlMetrics(r).high_risk_count).toBe(2);
    });
  });

  // ── Boolean rate fields ──────────────────────────────────────────
  describe("boolean rate fields", () => {
    it("contractor_certified_rate is 0 when all uncertified", () => {
      const r = [makeRecord({ contractor_certified: false })];
      expect(computePestControlMetrics(r).contractor_certified_rate).toBe(0);
    });

    it("contractor_certified_rate is 50 for 1 of 2 certified", () => {
      const r = [
        makeRecord({ contractor_certified: true }),
        makeRecord({ contractor_certified: false }),
      ];
      expect(computePestControlMetrics(r).contractor_certified_rate).toBe(50);
    });

    it("children_informed_rate is 0 when none informed", () => {
      const r = [makeRecord({ children_informed: false })];
      expect(computePestControlMetrics(r).children_informed_rate).toBe(0);
    });

    it("children_informed_rate is 50 for 1 of 2 informed", () => {
      const r = [
        makeRecord({ children_informed: true }),
        makeRecord({ children_informed: false }),
      ];
      expect(computePestControlMetrics(r).children_informed_rate).toBe(50);
    });

    it("entry_points_sealed_rate is 100 when all sealed", () => {
      const r = [makeRecord({ entry_points_sealed: true })];
      expect(computePestControlMetrics(r).entry_points_sealed_rate).toBe(100);
    });

    it("prevention_implemented_rate is 100 when all implemented", () => {
      const r = [makeRecord({ prevention_measures_implemented: true })];
      expect(computePestControlMetrics(r).prevention_implemented_rate).toBe(100);
    });

    it("prevention_implemented_rate is 50 for 1 of 2 implemented", () => {
      const r = [
        makeRecord({ prevention_measures_implemented: true }),
        makeRecord({ prevention_measures_implemented: false }),
      ];
      expect(computePestControlMetrics(r).prevention_implemented_rate).toBe(50);
    });
  });

  // ── Chemicals and safety sheet ─────────────────────────────────────
  describe("chemicals and safety sheet", () => {
    it("chemicals_used_count is 1 when chemicals_used is true", () => {
      const r = [makeRecord({ chemicals_used: true })];
      expect(computePestControlMetrics(r).chemicals_used_count).toBe(1);
    });

    it("chemicals_used_count is 0 when chemicals_used is false", () => {
      const r = [makeRecord({ chemicals_used: false })];
      expect(computePestControlMetrics(r).chemicals_used_count).toBe(0);
    });

    it("safety_sheet_obtained_rate is 100 when all chem records have sheet", () => {
      const r = [makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: true })];
      expect(computePestControlMetrics(r).safety_sheet_obtained_rate).toBe(100);
    });

    it("safety_sheet_obtained_rate is 0 when chem records lack sheet", () => {
      const r = [makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false })];
      expect(computePestControlMetrics(r).safety_sheet_obtained_rate).toBe(0);
    });

    it("safety_sheet_obtained_rate only considers chemical records", () => {
      const r = [
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: true }),
        makeRecord({ chemicals_used: false, chemical_safety_sheet_obtained: false }),
      ];
      expect(computePestControlMetrics(r).safety_sheet_obtained_rate).toBe(100);
    });

    it("safety_sheet_obtained_rate is 50 for 1 of 2 chem records with sheet", () => {
      const r = [
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: true }),
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false }),
      ];
      expect(computePestControlMetrics(r).safety_sheet_obtained_rate).toBe(50);
    });

    it("safety_sheet_obtained_rate is 0 when no chemicals used at all", () => {
      const r = [makeRecord({ chemicals_used: false })];
      expect(computePestControlMetrics(r).safety_sheet_obtained_rate).toBeNull();;
    });
  });

  // ── Food areas affected ────────────────────────────────────────────
  describe("food areas affected", () => {
    it("food_areas_affected_count is 1 when food_areas_affected is true", () => {
      const r = [makeRecord({ food_areas_affected: true })];
      expect(computePestControlMetrics(r).food_areas_affected_count).toBe(1);
    });

    it("food_areas_affected_count is 0 when food_areas_affected is false", () => {
      const r = [makeRecord({ food_areas_affected: false })];
      expect(computePestControlMetrics(r).food_areas_affected_count).toBe(0);
    });

    it("food_areas_affected_count is 2 for two affected records", () => {
      const r = [
        makeRecord({ food_areas_affected: true }),
        makeRecord({ food_areas_affected: true }),
      ];
      expect(computePestControlMetrics(r).food_areas_affected_count).toBe(2);
    });
  });

  // ── Follow-up metrics ──────────────────────────────────────────────
  describe("follow-up metrics", () => {
    it("follow_up_required_count is 1 when follow_up_required is true", () => {
      const r = [makeRecord({ follow_up_required: true })];
      expect(computePestControlMetrics(r).follow_up_required_count).toBe(1);
    });

    it("follow_up_required_count is 0 when follow_up_required is false", () => {
      const r = [makeRecord({ follow_up_required: false })];
      expect(computePestControlMetrics(r).follow_up_required_count).toBe(0);
    });

    it("follow_up_overdue_count is 1 for overdue follow-up", () => {
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 5);
      const r = [makeRecord({
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: pastDate.toISOString().split("T")[0],
      })];
      expect(computePestControlMetrics(r).follow_up_overdue_count).toBe(1);
    });

    it("follow_up_overdue_count is 0 when follow-up is completed", () => {
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 5);
      const r = [makeRecord({
        follow_up_required: true,
        follow_up_completed: true,
        follow_up_date: pastDate.toISOString().split("T")[0],
      })];
      expect(computePestControlMetrics(r).follow_up_overdue_count).toBe(0);
    });

    it("follow_up_overdue_count is 0 when follow-up date is in the future", () => {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 30);
      const r = [makeRecord({
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: futureDate.toISOString().split("T")[0],
      })];
      expect(computePestControlMetrics(r).follow_up_overdue_count).toBe(0);
    });

    it("follow_up_overdue_count is 0 when follow_up_required is false even with past date", () => {
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 5);
      const r = [makeRecord({
        follow_up_required: false,
        follow_up_completed: false,
        follow_up_date: pastDate.toISOString().split("T")[0],
      })];
      expect(computePestControlMetrics(r).follow_up_overdue_count).toBe(0);
    });

    it("follow_up_overdue_count is 0 when follow_up_date is null", () => {
      const r = [makeRecord({
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: null,
      })];
      expect(computePestControlMetrics(r).follow_up_overdue_count).toBe(0);
    });
  });

  // ── Environmental health ───────────────────────────────────────────
  describe("environmental health notified", () => {
    it("env_health_notified_count is 1 when notified", () => {
      const r = [makeRecord({ environmental_health_notified: true })];
      expect(computePestControlMetrics(r).env_health_notified_count).toBe(1);
    });

    it("env_health_notified_count is 0 when not notified", () => {
      const r = [makeRecord({ environmental_health_notified: false })];
      expect(computePestControlMetrics(r).env_health_notified_count).toBe(0);
    });
  });

  // ── Breakdown maps ─────────────────────────────────────────────────
  describe("breakdown maps", () => {
    it("by_inspection_type counts multiple types", () => {
      const r = [
        makeRecord({ inspection_type: "routine_inspection" }),
        makeRecord({ inspection_type: "routine_inspection" }),
        makeRecord({ inspection_type: "reactive_call" }),
      ];
      expect(computePestControlMetrics(r).by_inspection_type).toEqual({
        routine_inspection: 2,
        reactive_call: 1,
      });
    });

    it("by_pest_type counts multiple types", () => {
      const r = [
        makeRecord({ pest_type: "rodents" }),
        makeRecord({ pest_type: "rodents" }),
        makeRecord({ pest_type: "ants" }),
      ];
      expect(computePestControlMetrics(r).by_pest_type).toEqual({
        rodents: 2,
        ants: 1,
      });
    });

    it("by_treatment_outcome counts multiple outcomes", () => {
      const r = [
        makeRecord({ treatment_outcome: "resolved" }),
        makeRecord({ treatment_outcome: "ongoing" }),
        makeRecord({ treatment_outcome: "ongoing" }),
      ];
      expect(computePestControlMetrics(r).by_treatment_outcome).toEqual({
        resolved: 1,
        ongoing: 2,
      });
    });

    it("by_risk_level counts multiple levels", () => {
      const r = [
        makeRecord({ risk_level: "no_risk" }),
        makeRecord({ risk_level: "high" }),
        makeRecord({ risk_level: "high" }),
        makeRecord({ risk_level: "critical" }),
      ];
      expect(computePestControlMetrics(r).by_risk_level).toEqual({
        no_risk: 1,
        high: 2,
        critical: 1,
      });
    });
  });

  // ── Rate precision (Math.round * 1000 / 10) ───────────────────────
  describe("rate precision", () => {
    it("resolved_rate uses correct rounding for 1 of 3", () => {
      const r = [
        makeRecord({ treatment_outcome: "resolved" }),
        makeRecord({ treatment_outcome: "ongoing" }),
        makeRecord({ treatment_outcome: "ongoing" }),
      ];
      // 1/3 = 0.3333... → Math.round(333.3...) = 333 → 333/10 = 33.3
      expect(computePestControlMetrics(r).resolved_rate).toBe(33.3);
    });

    it("resolved_rate uses correct rounding for 2 of 3", () => {
      const r = [
        makeRecord({ treatment_outcome: "resolved" }),
        makeRecord({ treatment_outcome: "resolved" }),
        makeRecord({ treatment_outcome: "ongoing" }),
      ];
      // 2/3 = 0.6666... → Math.round(666.6...) = 667 → 667/10 = 66.7
      expect(computePestControlMetrics(r).resolved_rate).toBe(66.7);
    });

    it("no_pest_found_rate uses correct rounding for 1 of 3", () => {
      const r = [
        makeRecord({ pest_type: "none_found" }),
        makeRecord({ pest_type: "rodents" }),
        makeRecord({ pest_type: "ants" }),
      ];
      expect(computePestControlMetrics(r).no_pest_found_rate).toBe(33.3);
    });

    it("contractor_certified_rate uses correct rounding for 2 of 3", () => {
      const r = [
        makeRecord({ contractor_certified: true }),
        makeRecord({ contractor_certified: true }),
        makeRecord({ contractor_certified: false }),
      ];
      expect(computePestControlMetrics(r).contractor_certified_rate).toBe(66.7);
    });

    it("children_informed_rate uses correct rounding for 1 of 3", () => {
      const r = [
        makeRecord({ children_informed: true }),
        makeRecord({ children_informed: false }),
        makeRecord({ children_informed: false }),
      ];
      expect(computePestControlMetrics(r).children_informed_rate).toBe(33.3);
    });

    it("entry_points_sealed_rate uses correct rounding for 1 of 3", () => {
      const r = [
        makeRecord({ entry_points_sealed: true }),
        makeRecord({ entry_points_sealed: false }),
        makeRecord({ entry_points_sealed: false }),
      ];
      expect(computePestControlMetrics(r).entry_points_sealed_rate).toBe(33.3);
    });

    it("safety_sheet_obtained_rate uses correct rounding for 1 of 3 chem records", () => {
      const r = [
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: true }),
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false }),
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false }),
      ];
      expect(computePestControlMetrics(r).safety_sheet_obtained_rate).toBe(33.3);
    });
  });

  // ── Multiple record mix ────────────────────────────────────────────
  describe("multiple records — mixed data", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 10);
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 10);

    const records = [
      makeRecord({
        id: "r-1",
        inspection_type: "routine_inspection",
        pest_type: "none_found",
        treatment_outcome: "no_treatment_needed",
        risk_level: "no_risk",
        contractor_certified: true,
        children_informed: true,
        chemicals_used: false,
        food_areas_affected: false,
        entry_points_sealed: false,
        prevention_measures_implemented: false,
        follow_up_required: false,
        environmental_health_notified: false,
      }),
      makeRecord({
        id: "r-2",
        inspection_type: "reactive_call",
        pest_type: "rodents",
        treatment_outcome: "resolved",
        risk_level: "high",
        contractor_certified: true,
        children_informed: true,
        chemicals_used: true,
        chemical_safety_sheet_obtained: true,
        food_areas_affected: true,
        entry_points_sealed: true,
        prevention_measures_implemented: true,
        follow_up_required: true,
        follow_up_date: futureDate.toISOString().split("T")[0],
        follow_up_completed: false,
        environmental_health_notified: true,
      }),
      makeRecord({
        id: "r-3",
        inspection_type: "emergency_treatment",
        pest_type: "cockroaches",
        treatment_outcome: "ongoing",
        risk_level: "critical",
        contractor_certified: false,
        children_informed: false,
        chemicals_used: true,
        chemical_safety_sheet_obtained: false,
        food_areas_affected: true,
        entry_points_sealed: false,
        prevention_measures_implemented: false,
        follow_up_required: true,
        follow_up_date: pastDate.toISOString().split("T")[0],
        follow_up_completed: false,
        environmental_health_notified: true,
      }),
    ];

    it("total_inspections is 3", () => {
      expect(computePestControlMetrics(records).total_inspections).toBe(3);
    });

    it("routine_count is 1", () => {
      expect(computePestControlMetrics(records).routine_count).toBe(1);
    });

    it("reactive_count is 1", () => {
      expect(computePestControlMetrics(records).reactive_count).toBe(1);
    });

    it("emergency_count is 1", () => {
      expect(computePestControlMetrics(records).emergency_count).toBe(1);
    });

    it("follow_up_count is 0", () => {
      expect(computePestControlMetrics(records).follow_up_count).toBe(0);
    });

    it("resolved_rate is 33.3", () => {
      expect(computePestControlMetrics(records).resolved_rate).toBe(33.3);
    });

    it("ongoing_count is 1", () => {
      expect(computePestControlMetrics(records).ongoing_count).toBe(1);
    });

    it("no_pest_found_rate is 33.3", () => {
      expect(computePestControlMetrics(records).no_pest_found_rate).toBe(33.3);
    });

    it("high_risk_count is 1", () => {
      expect(computePestControlMetrics(records).high_risk_count).toBe(1);
    });

    it("critical_risk_count is 1", () => {
      expect(computePestControlMetrics(records).critical_risk_count).toBe(1);
    });

    it("contractor_certified_rate is 66.7", () => {
      expect(computePestControlMetrics(records).contractor_certified_rate).toBe(66.7);
    });

    it("children_informed_rate is 66.7", () => {
      expect(computePestControlMetrics(records).children_informed_rate).toBe(66.7);
    });

    it("chemicals_used_count is 2", () => {
      expect(computePestControlMetrics(records).chemicals_used_count).toBe(2);
    });

    it("safety_sheet_obtained_rate is 50", () => {
      expect(computePestControlMetrics(records).safety_sheet_obtained_rate).toBe(50);
    });

    it("food_areas_affected_count is 2", () => {
      expect(computePestControlMetrics(records).food_areas_affected_count).toBe(2);
    });

    it("entry_points_sealed_rate is 33.3", () => {
      expect(computePestControlMetrics(records).entry_points_sealed_rate).toBe(33.3);
    });

    it("prevention_implemented_rate is 33.3", () => {
      expect(computePestControlMetrics(records).prevention_implemented_rate).toBe(33.3);
    });

    it("follow_up_required_count is 2", () => {
      expect(computePestControlMetrics(records).follow_up_required_count).toBe(2);
    });

    it("follow_up_overdue_count is 1", () => {
      expect(computePestControlMetrics(records).follow_up_overdue_count).toBe(1);
    });

    it("env_health_notified_count is 2", () => {
      expect(computePestControlMetrics(records).env_health_notified_count).toBe(2);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyPestControlAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyPestControlAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────
  describe("no alerts", () => {
    it("returns empty array for no records", () => {
      expect(identifyPestControlAlerts([])).toEqual([]);
    });

    it("returns empty array for safe defaults", () => {
      expect(identifyPestControlAlerts([makeRecord()])).toEqual([]);
    });

    it("returns empty array for low-risk non-food record", () => {
      const r = [makeRecord({ risk_level: "low", pest_type: "ants" })];
      expect(identifyPestControlAlerts(r)).toEqual([]);
    });

    it("returns empty array for medium-risk non-food record", () => {
      const r = [makeRecord({ risk_level: "medium" })];
      expect(identifyPestControlAlerts(r)).toEqual([]);
    });
  });

  // ── critical_risk alert ────────────────────────────────────────────
  describe("critical_risk alert", () => {
    it("fires for a critical-risk record", () => {
      const r = [makeRecord({ risk_level: "critical", pest_type: "rodents", location_in_home: "Bedroom", inspection_date: "2024-08-01" })];
      const alerts = identifyPestControlAlerts(r);
      expect(alerts.some((a) => a.type === "critical_risk")).toBe(true);
    });

    it("has severity critical", () => {
      const r = [makeRecord({ risk_level: "critical" })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "critical_risk");
      expect(alert!.severity).toBe("critical");
    });

    it("includes location_in_home in message", () => {
      const r = [makeRecord({ risk_level: "critical", location_in_home: "Attic" })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "critical_risk");
      expect(alert!.message).toContain("Attic");
    });

    it("includes pest_type with underscores replaced by spaces", () => {
      const r = [makeRecord({ risk_level: "critical", pest_type: "bed_bugs" })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "critical_risk");
      expect(alert!.message).toContain("bed bugs");
    });

    it("includes inspection_date in message", () => {
      const r = [makeRecord({ risk_level: "critical", inspection_date: "2024-09-15" })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "critical_risk");
      expect(alert!.message).toContain("2024-09-15");
    });

    it("uses the record id as alert id", () => {
      const r = [makeRecord({ id: "rec-critical-1", risk_level: "critical" })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "critical_risk");
      expect(alert!.id).toBe("rec-critical-1");
    });

    it("fires per-record for multiple critical records", () => {
      const r = [
        makeRecord({ id: "c-1", risk_level: "critical" }),
        makeRecord({ id: "c-2", risk_level: "critical" }),
      ];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "critical_risk");
      expect(alerts).toHaveLength(2);
    });

    it("does not fire for high risk", () => {
      const r = [makeRecord({ risk_level: "high" })];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "critical_risk");
      expect(alerts).toHaveLength(0);
    });

    it("replaces wasps_bees underscores in message", () => {
      const r = [makeRecord({ risk_level: "critical", pest_type: "wasps_bees" })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "critical_risk");
      expect(alert!.message).toContain("wasps bees");
    });

    it("replaces none_found underscores in message", () => {
      const r = [makeRecord({ risk_level: "critical", pest_type: "none_found" })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "critical_risk");
      expect(alert!.message).toContain("none found");
    });
  });

  // ── food_area_affected alert ──────────────────────────────────────
  describe("food_area_affected alert", () => {
    it("fires when 1 record has food_areas_affected", () => {
      const r = [makeRecord({ food_areas_affected: true })];
      const alerts = identifyPestControlAlerts(r);
      expect(alerts.some((a) => a.type === "food_area_affected")).toBe(true);
    });

    it("has severity high", () => {
      const r = [makeRecord({ food_areas_affected: true })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "food_area_affected");
      expect(alert!.severity).toBe("high");
    });

    it("uses singular 'inspection has' for 1 record", () => {
      const r = [makeRecord({ food_areas_affected: true })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "food_area_affected");
      expect(alert!.message).toContain("inspection has");
    });

    it("uses plural 'inspections have' for 2 records", () => {
      const r = [
        makeRecord({ food_areas_affected: true }),
        makeRecord({ food_areas_affected: true }),
      ];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "food_area_affected");
      expect(alert!.message).toContain("inspections have");
    });

    it("counts only affected records in message", () => {
      const r = [
        makeRecord({ food_areas_affected: true }),
        makeRecord({ food_areas_affected: true }),
        makeRecord({ food_areas_affected: false }),
      ];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "food_area_affected");
      expect(alert!.message).toMatch(/^2 /);
    });

    it("has id 'food_area_affected'", () => {
      const r = [makeRecord({ food_areas_affected: true })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "food_area_affected");
      expect(alert!.id).toBe("food_area_affected");
    });

    it("does not fire when no food areas affected", () => {
      const r = [makeRecord({ food_areas_affected: false })];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "food_area_affected");
      expect(alerts).toHaveLength(0);
    });

    it("fires exactly once even with multiple affected records", () => {
      const r = [
        makeRecord({ food_areas_affected: true }),
        makeRecord({ food_areas_affected: true }),
        makeRecord({ food_areas_affected: true }),
      ];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "food_area_affected");
      expect(alerts).toHaveLength(1);
    });
  });

  // ── ongoing_treatment alert ───────────────────────────────────────
  describe("ongoing_treatment alert", () => {
    it("fires when 1 record is ongoing", () => {
      const r = [makeRecord({ treatment_outcome: "ongoing" })];
      const alerts = identifyPestControlAlerts(r);
      expect(alerts.some((a) => a.type === "ongoing_treatment")).toBe(true);
    });

    it("has severity high", () => {
      const r = [makeRecord({ treatment_outcome: "ongoing" })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "ongoing_treatment");
      expect(alert!.severity).toBe("high");
    });

    it("uses singular 'treatment is' for 1 record", () => {
      const r = [makeRecord({ treatment_outcome: "ongoing" })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "ongoing_treatment");
      expect(alert!.message).toContain("treatment is");
    });

    it("uses plural 'treatments are' for 2 records", () => {
      const r = [
        makeRecord({ treatment_outcome: "ongoing" }),
        makeRecord({ treatment_outcome: "ongoing" }),
      ];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "ongoing_treatment");
      expect(alert!.message).toContain("treatments are");
    });

    it("counts only ongoing records in message", () => {
      const r = [
        makeRecord({ treatment_outcome: "ongoing" }),
        makeRecord({ treatment_outcome: "ongoing" }),
        makeRecord({ treatment_outcome: "resolved" }),
      ];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "ongoing_treatment");
      expect(alert!.message).toMatch(/^2 /);
    });

    it("has id 'ongoing_treatment'", () => {
      const r = [makeRecord({ treatment_outcome: "ongoing" })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "ongoing_treatment");
      expect(alert!.id).toBe("ongoing_treatment");
    });

    it("does not fire when no treatments are ongoing", () => {
      const r = [makeRecord({ treatment_outcome: "resolved" })];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "ongoing_treatment");
      expect(alerts).toHaveLength(0);
    });

    it("does not fire for partially_resolved", () => {
      const r = [makeRecord({ treatment_outcome: "partially_resolved" })];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "ongoing_treatment");
      expect(alerts).toHaveLength(0);
    });

    it("fires exactly once even with multiple ongoing records", () => {
      const r = [
        makeRecord({ treatment_outcome: "ongoing" }),
        makeRecord({ treatment_outcome: "ongoing" }),
        makeRecord({ treatment_outcome: "ongoing" }),
      ];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "ongoing_treatment");
      expect(alerts).toHaveLength(1);
    });
  });

  // ── follow_up_overdue alert ───────────────────────────────────────
  describe("follow_up_overdue alert", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 5);
    const pastStr = pastDate.toISOString().split("T")[0];
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 30);
    const futureStr = futureDate.toISOString().split("T")[0];

    it("fires when 1 follow-up is overdue", () => {
      const r = [makeRecord({
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: pastStr,
      })];
      const alerts = identifyPestControlAlerts(r);
      expect(alerts.some((a) => a.type === "follow_up_overdue")).toBe(true);
    });

    it("has severity high", () => {
      const r = [makeRecord({
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: pastStr,
      })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "follow_up_overdue");
      expect(alert!.severity).toBe("high");
    });

    it("uses singular 'follow-up is' for 1 overdue", () => {
      const r = [makeRecord({
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: pastStr,
      })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "follow_up_overdue");
      expect(alert!.message).toContain("follow-up is");
    });

    it("uses plural 'follow-ups are' for 2 overdue", () => {
      const r = [
        makeRecord({ follow_up_required: true, follow_up_completed: false, follow_up_date: pastStr }),
        makeRecord({ follow_up_required: true, follow_up_completed: false, follow_up_date: pastStr }),
      ];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "follow_up_overdue");
      expect(alert!.message).toContain("follow-ups are");
    });

    it("has id 'follow_up_overdue'", () => {
      const r = [makeRecord({
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: pastStr,
      })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "follow_up_overdue");
      expect(alert!.id).toBe("follow_up_overdue");
    });

    it("does not fire when follow-up is completed", () => {
      const r = [makeRecord({
        follow_up_required: true,
        follow_up_completed: true,
        follow_up_date: pastStr,
      })];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "follow_up_overdue");
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when follow-up date is in the future", () => {
      const r = [makeRecord({
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: futureStr,
      })];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "follow_up_overdue");
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when follow_up_required is false", () => {
      const r = [makeRecord({
        follow_up_required: false,
        follow_up_completed: false,
        follow_up_date: pastStr,
      })];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "follow_up_overdue");
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when follow_up_date is null", () => {
      const r = [makeRecord({
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: null,
      })];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "follow_up_overdue");
      expect(alerts).toHaveLength(0);
    });

    it("excludes completed from count", () => {
      const r = [
        makeRecord({ follow_up_required: true, follow_up_completed: false, follow_up_date: pastStr }),
        makeRecord({ follow_up_required: true, follow_up_completed: true, follow_up_date: pastStr }),
        makeRecord({ follow_up_required: true, follow_up_completed: false, follow_up_date: pastStr }),
      ];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "follow_up_overdue");
      expect(alert!.message).toMatch(/^2 /);
    });

    it("fires exactly once even with multiple overdue", () => {
      const r = [
        makeRecord({ follow_up_required: true, follow_up_completed: false, follow_up_date: pastStr }),
        makeRecord({ follow_up_required: true, follow_up_completed: false, follow_up_date: pastStr }),
      ];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "follow_up_overdue");
      expect(alerts).toHaveLength(1);
    });
  });

  // ── no_safety_sheet alert ──────────────────────────────────────────
  describe("no_safety_sheet alert", () => {
    it("fires when 1 record uses chemicals without sheet", () => {
      const r = [makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false })];
      const alerts = identifyPestControlAlerts(r);
      expect(alerts.some((a) => a.type === "no_safety_sheet")).toBe(true);
    });

    it("has severity medium", () => {
      const r = [makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "no_safety_sheet");
      expect(alert!.severity).toBe("medium");
    });

    it("uses singular 'treatment' for 1 record", () => {
      const r = [makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "no_safety_sheet");
      expect(alert!.message).toContain("1 treatment");
    });

    it("uses plural 'treatments' for 2 records", () => {
      const r = [
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false }),
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false }),
      ];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "no_safety_sheet");
      expect(alert!.message).toContain("2 treatments");
    });

    it("has id 'no_safety_sheet'", () => {
      const r = [makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false })];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "no_safety_sheet");
      expect(alert!.id).toBe("no_safety_sheet");
    });

    it("does not fire when sheet is obtained", () => {
      const r = [makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: true })];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "no_safety_sheet");
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when no chemicals used", () => {
      const r = [makeRecord({ chemicals_used: false, chemical_safety_sheet_obtained: false })];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "no_safety_sheet");
      expect(alerts).toHaveLength(0);
    });

    it("counts only records without sheet in message", () => {
      const r = [
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false }),
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: true }),
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false }),
      ];
      const alert = identifyPestControlAlerts(r).find((a) => a.type === "no_safety_sheet");
      expect(alert!.message).toMatch(/^2 /);
    });

    it("fires exactly once even with multiple missing sheets", () => {
      const r = [
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false }),
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false }),
        makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false }),
      ];
      const alerts = identifyPestControlAlerts(r).filter((a) => a.type === "no_safety_sheet");
      expect(alerts).toHaveLength(1);
    });
  });

  // ── Combined alerts ────────────────────────────────────────────────
  describe("combined alerts", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 5);
    const pastStr = pastDate.toISOString().split("T")[0];

    it("fires multiple alert types simultaneously", () => {
      const r = [makeRecord({
        risk_level: "critical",
        food_areas_affected: true,
        treatment_outcome: "ongoing",
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: pastStr,
        chemicals_used: true,
        chemical_safety_sheet_obtained: false,
      })];
      const alerts = identifyPestControlAlerts(r);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("critical_risk");
      expect(types).toContain("food_area_affected");
      expect(types).toContain("ongoing_treatment");
      expect(types).toContain("follow_up_overdue");
      expect(types).toContain("no_safety_sheet");
    });

    it("returns 5 alerts for a record triggering all conditions", () => {
      const r = [makeRecord({
        risk_level: "critical",
        food_areas_affected: true,
        treatment_outcome: "ongoing",
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: pastStr,
        chemicals_used: true,
        chemical_safety_sheet_obtained: false,
      })];
      expect(identifyPestControlAlerts(r)).toHaveLength(5);
    });

    it("critical_risk alert appears first in order", () => {
      const r = [makeRecord({
        risk_level: "critical",
        food_areas_affected: true,
        treatment_outcome: "ongoing",
        chemicals_used: true,
        chemical_safety_sheet_obtained: false,
      })];
      const alerts = identifyPestControlAlerts(r);
      expect(alerts[0].type).toBe("critical_risk");
    });

    it("no_safety_sheet alert appears last in order", () => {
      const r = [makeRecord({
        risk_level: "critical",
        food_areas_affected: true,
        treatment_outcome: "ongoing",
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: pastStr,
        chemicals_used: true,
        chemical_safety_sheet_obtained: false,
      })];
      const alerts = identifyPestControlAlerts(r);
      expect(alerts[alerts.length - 1].type).toBe("no_safety_sheet");
    });
  });
});
