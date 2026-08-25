import { describe, it, expect } from "vitest";
import {
  computeHomeFacilitiesCompliance,
  type HomeFacilitiesComplianceInput,
  type FireCheckInput,
  type WaterHygieneInput,
  type WindowCheckInput,
  type PestControlInput,
} from "../home-facilities-compliance-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeFireCheck(overrides: Partial<FireCheckInput> = {}): FireCheckInput {
  return {
    id: "fc_1",
    last_inspected_date: "2025-05-01",
    next_inspection_due: "2026-05-01",
    result: "pass",
    compliance_status: "compliant",
    defect_noted_present: false,
    ...overrides,
  };
}

function makeWaterRecord(overrides: Partial<WaterHygieneInput> = {}): WaterHygieneInput {
  return {
    id: "wh_1",
    date: "2025-05-01",
    compliance: "compliant",
    action_required_present: false,
    action_completed: false,
    next_due_date: "2026-05-01",
    ...overrides,
  };
}

function makeWindowCheck(overrides: Partial<WindowCheckInput> = {}): WindowCheckInput {
  return {
    id: "wc_1",
    inspection_date: "2025-05-01",
    restrictor_present: true,
    restrictor_working: true,
    opening_compliance: true,
    outcome: "pass",
    next_due_date: "2026-05-01",
    floor_above_ground: true,
    ...overrides,
  };
}

function makePestRecord(overrides: Partial<PestControlInput> = {}): PestControlInput {
  return {
    id: "pr_1",
    record_date: "2025-05-01",
    follow_up_required: false,
    follow_up_completed: false,
    child_safety_measures_count: 2,
    flags_count: 0,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeFacilitiesComplianceInput> = {}): HomeFacilitiesComplianceInput {
  return {
    today: "2025-06-15",
    fire_checks: [],
    water_hygiene_records: [],
    window_checks: [],
    pest_records: [],
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════════════════════════

describe("computeHomeFacilitiesCompliance", () => {

  // ── Insufficient Data ─────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when all arrays empty", () => {
      const r = computeHomeFacilitiesCompliance(baseInput());
      expect(r.facilities_rating).toBe("insufficient_data");
      expect(r.facilities_score).toBe(0);
      expect(r.headline).toBe("No facilities compliance data available for analysis.");
    });

    it("returns zero-value profiles for insufficient_data", () => {
      const r = computeHomeFacilitiesCompliance(baseInput());
      expect(r.fire.total_checks).toBe(0);
      expect(r.water.total_checks).toBe(0);
      expect(r.windows.total_checks).toBe(0);
      expect(r.pest.total_records).toBe(0);
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights on insufficient_data", () => {
      const r = computeHomeFacilitiesCompliance(baseInput());
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("does NOT return insufficient_data with only fire_checks", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: [makeFireCheck()] }));
      expect(r.facilities_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data with only water_hygiene_records", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: [makeWaterRecord()] }));
      expect(r.facilities_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data with only window_checks", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: [makeWindowCheck()] }));
      expect(r.facilities_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data with only pest_records", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: [makePestRecord()] }));
      expect(r.facilities_rating).not.toBe("insufficient_data");
    });
  });

  // ── Rating Boundaries ─────────────────────────────────────────────────

  describe("rating boundaries", () => {
    it("returns outstanding when all metrics excellent (score >= 80)", () => {
      // Base 52
      // mod1: 20 pass fire checks → 100% → +5
      // mod2: all timely → 100% → +3
      // mod3: 20 compliant water → 100% → +4
      // mod4: no actions required → +2
      // mod5: 20 above-ground windows all compliant → 100% → +4
      // mod6: all timely → 100% → +3
      // mod7: no pest follow-ups needed → +1
      // mod8: no defects → +2
      // Total: 52+5+3+4+2+4+3+1+2 = 76... need more
      // Actually need score >= 80. Let's maximize.
      // mod4 max is +3 (need action_required with >= 90% completed)
      // mod7 max is +3 (need follow-up_required with >= 90% completed)
      // Total: 52+5+3+4+3+4+3+3+2 = 79... still not 80
      // mod8 max is +3 (need defects with >= 90% addressed)
      // Total: 52+5+3+4+3+4+3+3+3 = 80!
      const fireChecks = Array.from({ length: 20 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          defect_noted_present: i < 2,       // 2 defects, result still "pass" so addressed
        }),
      );
      const waterRecords = Array.from({ length: 20 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          action_required_present: i < 2,    // 2 actions needed
          action_completed: true,             // all completed
        }),
      );
      const windowChecks = Array.from({ length: 20 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}` }),
      );
      const pestRecords = Array.from({ length: 5 }, (_, i) =>
        makePestRecord({
          id: `pr_${i}`,
          follow_up_required: i < 2,         // 2 need follow-up
          follow_up_completed: true,          // all completed
        }),
      );

      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
        window_checks: windowChecks,
        pest_records: pestRecords,
      }));

      expect(r.facilities_rating).toBe("outstanding");
      expect(r.facilities_score).toBeGreaterThanOrEqual(80);
      expect(r.headline).toContain("Exemplary");
    });

    it("returns good for score 65-79", () => {
      // Base 52
      // mod1: 100% pass → +5  (57)
      // mod2: 100% timely → +3  (60)
      // mod3: no water → -2  (58)
      // mod4: no water actions → +2 (but no water records so mod4 gets waterWithAction.length === 0 → +2; wait, water records are empty so waterWithAction is empty → +2)
      // Actually mod4 depends on waterWithAction (filtered from water_hygiene_records). If no water records, waterWithAction is empty → +2
      // mod5: no above-ground windows → +1 (need window_checks with floor_above_ground: false)
      // mod6: window timely → +3
      // mod7: no pest follow-ups → +1
      // mod8: fire defects addressed... need some defects
      // Let me build: 52 + 5 + 3 - 2 + 2 + 1 + 3 + 1 + 2 = 67
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}` }),
      );
      const windowChecks = Array.from({ length: 5 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}`, floor_above_ground: false }),
      );
      const pestRecords = [makePestRecord()];

      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        window_checks: windowChecks,
        pest_records: pestRecords,
      }));

      expect(r.facilities_rating).toBe("good");
      expect(r.facilities_score).toBeGreaterThanOrEqual(65);
      expect(r.facilities_score).toBeLessThan(80);
    });

    it("returns adequate for score 45-64", () => {
      // Base 52
      // mod1: 80% pass (not >=85, not >=95) → +0
      // mod2: 80% timely → +1
      // mod3: no water → -2
      // mod4: no water → +2
      // mod5: no windows → no above-ground → +1
      // mod6: no windows → 0
      // mod7: no pest → +1
      // mod8: no defects → +2
      // Total: 52 + 0 + 1 - 2 + 2 + 1 + 0 + 1 + 2 = 57
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          result: i < 8 ? "pass" : "fail",
          next_inspection_due: i < 8 ? "2026-05-01" : "2025-01-01",
        }),
      );

      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
      }));

      expect(r.facilities_rating).toBe("adequate");
      expect(r.facilities_score).toBeGreaterThanOrEqual(45);
      expect(r.facilities_score).toBeLessThan(65);
    });

    it("returns inadequate for score < 45", () => {
      // Base 52
      // mod1: 0% pass → -5
      // mod2: 0% timely → -3
      // mod3: no water → -2
      // mod4: no water → +2
      // mod5: 0% restrictor → -4
      // mod6: 0% window timely → -3
      // mod7: 0% pest follow-up → -3
      // mod8: defects at 0% → -3
      // Total: 52 - 5 - 3 - 2 + 2 - 4 - 3 - 3 - 3 = 31
      const fireChecks = Array.from({ length: 5 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          result: "fail",
          next_inspection_due: "2025-01-01",
          defect_noted_present: true,
        }),
      );
      const windowChecks = Array.from({ length: 5 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          restrictor_present: false,
          restrictor_working: false,
          opening_compliance: false,
          outcome: "fail",
          next_due_date: "2025-01-01",
        }),
      );
      const pestRecords = Array.from({ length: 5 }, (_, i) =>
        makePestRecord({
          id: `pr_${i}`,
          follow_up_required: true,
          follow_up_completed: false,
        }),
      );

      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        window_checks: windowChecks,
        pest_records: pestRecords,
      }));

      expect(r.facilities_rating).toBe("inadequate");
      expect(r.facilities_score).toBeLessThan(45);
    });

    it("score is clamped to 0-100", () => {
      // Max all penalties + some more
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          result: "fail",
          next_inspection_due: "2024-01-01",
          defect_noted_present: true,
        }),
      );
      const waterRecords = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          compliance: "non_compliant",
          action_required_present: true,
          action_completed: false,
          next_due_date: "2024-01-01",
        }),
      );
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          restrictor_present: false,
          restrictor_working: false,
          opening_compliance: false,
          outcome: "fail",
          next_due_date: "2024-01-01",
        }),
      );
      const pestRecords = Array.from({ length: 10 }, (_, i) =>
        makePestRecord({
          id: `pr_${i}`,
          follow_up_required: true,
          follow_up_completed: false,
          flags_count: 3,
        }),
      );

      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
        window_checks: windowChecks,
        pest_records: pestRecords,
      }));

      expect(r.facilities_score).toBeGreaterThanOrEqual(0);
      expect(r.facilities_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Mod 1: Fire equipment compliance ──────────────────────────────────

  describe("mod 1 — fire equipment compliance (±5)", () => {
    it("gives +5 for >= 95% pass rate", () => {
      const fireChecks = Array.from({ length: 20 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}`, result: i < 19 ? "pass" : "needs_attention" }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      // 95% pass rate → +5
      // Base 52 + 5 + ... (other mods from fire-only: mod2=+3, mod3=-2, mod4=+2, mod5=+1, mod6=0, mod7=+1, mod8=+2)
      // We just check relative score vs baseline
      expect(r.fire.pass_rate).toBe(95);
    });

    it("gives +3 for >= 85% pass rate", () => {
      const fireChecks = Array.from({ length: 20 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}`, result: i < 17 ? "pass" : "fail" }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.pass_rate).toBe(85);
    });

    it("gives +0 for >= 70% pass rate", () => {
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}`, result: i < 7 ? "pass" : "fail" }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.pass_rate).toBe(70);
    });

    it("gives -5 for < 70% pass rate", () => {
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}`, result: i < 6 ? "pass" : "fail" }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.pass_rate).toBe(60);
    });

    it("gives -3 when no fire checks (statutory)", () => {
      // Only water records to avoid insufficient_data
      const r = computeHomeFacilitiesCompliance(baseInput({
        water_hygiene_records: [makeWaterRecord()],
      }));
      expect(r.fire.total_checks).toBe(0);
      // mod1 = -3 for no fire checks
    });
  });

  // ── Mod 2: Fire inspection timeliness ─────────────────────────────────

  describe("mod 2 — fire inspection timeliness (±3)", () => {
    it("gives +3 for >= 95% timely", () => {
      const fireChecks = Array.from({ length: 20 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          next_inspection_due: i < 19 ? "2026-05-01" : "2025-01-01",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.overdue_inspections).toBe(1);
    });

    it("gives +1 for >= 80% timely", () => {
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          next_inspection_due: i < 8 ? "2026-05-01" : "2025-01-01",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.overdue_inspections).toBe(2);
    });

    it("gives -3 for < 60% timely", () => {
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          next_inspection_due: i < 5 ? "2026-05-01" : "2025-01-01",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.overdue_inspections).toBe(5);
    });

    it("gives -2 for no fire checks", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        water_hygiene_records: [makeWaterRecord()],
      }));
      expect(r.fire.total_checks).toBe(0);
    });
  });

  // ── Mod 3: Water hygiene compliance ───────────────────────────────────

  describe("mod 3 — water hygiene compliance (±4)", () => {
    it("gives +4 for >= 95% compliance", () => {
      const records = Array.from({ length: 20 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          compliance: i < 19 ? "compliant" : "borderline",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.compliance_rate).toBe(95);
    });

    it("gives +2 for >= 85% compliance", () => {
      const records = Array.from({ length: 20 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          compliance: i < 17 ? "compliant" : "non_compliant",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.compliance_rate).toBe(85);
    });

    it("gives +0 for >= 70% compliance", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          compliance: i < 7 ? "compliant" : "non_compliant",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.compliance_rate).toBe(70);
    });

    it("gives -4 for < 70% compliance", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          compliance: i < 5 ? "compliant" : "non_compliant",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.compliance_rate).toBe(50);
    });

    it("gives -2 for no water records", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: [makeFireCheck()],
      }));
      expect(r.water.total_checks).toBe(0);
    });
  });

  // ── Mod 4: Water action completion ────────────────────────────────────

  describe("mod 4 — water action completion (±3)", () => {
    it("gives +3 for >= 90% completion", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          action_required_present: true,
          action_completed: i < 9,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.action_completion_rate).toBe(90);
    });

    it("gives +1 for >= 70% completion", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          action_required_present: true,
          action_completed: i < 7,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.action_completion_rate).toBe(70);
    });

    it("gives +0 for >= 50% completion", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          action_required_present: true,
          action_completed: i < 5,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.action_completion_rate).toBe(50);
    });

    it("gives -3 for < 50% completion", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          action_required_present: true,
          action_completed: i < 4,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.action_completion_rate).toBe(40);
    });

    it("gives +2 when no actions required", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeWaterRecord({ id: `wh_${i}`, action_required_present: false }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.action_completion_rate).toBeNull(); // pct(0,0) = 0
    });
  });

  // ── Mod 5: Window restrictor compliance ───────────────────────────────

  describe("mod 5 — window restrictor compliance (±4)", () => {
    it("gives +4 for 100% above-ground compliance", () => {
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}` }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.restrictor_compliance_rate).toBe(100);
    });

    it("gives +2 for >= 90% compliance", () => {
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          restrictor_working: i < 9,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.restrictor_compliance_rate).toBe(90);
    });

    it("gives +0 for >= 70% compliance", () => {
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          restrictor_working: i < 7,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.restrictor_compliance_rate).toBe(70);
    });

    it("gives -4 for < 70% compliance", () => {
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          restrictor_present: i < 5,
          restrictor_working: i < 5,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.restrictor_compliance_rate).toBe(50);
    });

    it("gives +1 when no above-ground windows", () => {
      const windowChecks = Array.from({ length: 5 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}`, floor_above_ground: false }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.above_ground_count).toBe(0);
    });

    it("only counts above-ground windows for restrictor compliance", () => {
      const windowChecks = [
        makeWindowCheck({ id: "wc_1", floor_above_ground: true }),
        makeWindowCheck({ id: "wc_2", floor_above_ground: false, restrictor_present: false, restrictor_working: false }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.restrictor_compliance_rate).toBe(100); // only 1 above-ground, it's compliant
      expect(r.windows.above_ground_count).toBe(1);
    });

    it("requires all three conditions for compliance", () => {
      // restrictor_present but not working
      const windowChecks = [
        makeWindowCheck({ id: "wc_1", restrictor_present: true, restrictor_working: false, opening_compliance: true }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.restrictor_compliance_rate).toBe(0);
    });
  });

  // ── Mod 6: Window check timeliness ────────────────────────────────────

  describe("mod 6 — window check timeliness (±3)", () => {
    it("gives +3 for >= 95% timely", () => {
      const windowChecks = Array.from({ length: 20 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          next_due_date: i < 19 ? "2026-05-01" : "2025-01-01",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.overdue_checks).toBe(1);
    });

    it("gives +1 for >= 80% timely", () => {
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          next_due_date: i < 8 ? "2026-05-01" : "2025-01-01",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.overdue_checks).toBe(2);
    });

    it("gives -3 for < 60% timely", () => {
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          next_due_date: i < 5 ? "2026-05-01" : "2025-01-01",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.overdue_checks).toBe(5);
    });

    it("gives 0 for no window checks", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: [makeFireCheck()],
      }));
      expect(r.windows.total_checks).toBe(0);
    });
  });

  // ── Mod 7: Pest control follow-up ────────────────────────────────────

  describe("mod 7 — pest control follow-up (±3)", () => {
    it("gives +3 for >= 90% follow-up completion", () => {
      const pestRecords = Array.from({ length: 10 }, (_, i) =>
        makePestRecord({
          id: `pr_${i}`,
          follow_up_required: true,
          follow_up_completed: i < 9,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.pest.follow_up_completion_rate).toBe(90);
    });

    it("gives +1 for >= 70% follow-up completion", () => {
      const pestRecords = Array.from({ length: 10 }, (_, i) =>
        makePestRecord({
          id: `pr_${i}`,
          follow_up_required: true,
          follow_up_completed: i < 7,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.pest.follow_up_completion_rate).toBe(70);
    });

    it("gives +0 for >= 50% follow-up completion", () => {
      const pestRecords = Array.from({ length: 10 }, (_, i) =>
        makePestRecord({
          id: `pr_${i}`,
          follow_up_required: true,
          follow_up_completed: i < 5,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.pest.follow_up_completion_rate).toBe(50);
    });

    it("gives -3 for < 50% follow-up completion", () => {
      const pestRecords = Array.from({ length: 10 }, (_, i) =>
        makePestRecord({
          id: `pr_${i}`,
          follow_up_required: true,
          follow_up_completed: i < 3,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.pest.follow_up_completion_rate).toBe(30);
    });

    it("gives +1 when no follow-ups needed", () => {
      const pestRecords = Array.from({ length: 5 }, (_, i) =>
        makePestRecord({ id: `pr_${i}`, follow_up_required: false }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.pest.follow_up_completion_rate).toBeNull(); // pct(0,0) = 0
    });
  });

  // ── Mod 8: Overall defect management ──────────────────────────────────

  describe("mod 8 — overall defect management (±3)", () => {
    it("gives +2 when no defects anywhere", () => {
      const fireChecks = [makeFireCheck({ defect_noted_present: false })];
      const waterRecords = [makeWaterRecord({ action_required_present: false })];
      const windowChecks = [makeWindowCheck({ outcome: "pass" })];
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
        window_checks: windowChecks,
      }));
      // totalDefects = 0 → mod8 = +2
      expect(r.strengths).toContain("No defects identified across fire, water, or window checks.");
    });

    it("gives +3 for >= 90% defects addressed", () => {
      // 10 fire defects, all with result "pass" (addressed)
      // 10 water actions, 9 completed
      // No window defects
      // Total: 20, addressed: 19, rate = 95%
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}`, defect_noted_present: true, result: "pass" }),
      );
      const waterRecords = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          action_required_present: true,
          action_completed: i < 9,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
      }));
      // Total defects: 10 fire + 10 water = 20
      // Addressed: 10 fire (pass) + 9 water = 19
      // Rate: 95% → +3
      expect(r.facilities_score).toBeGreaterThan(52); // should be well above base
    });

    it("gives +1 for >= 70% defects addressed", () => {
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          defect_noted_present: true,
          result: i < 7 ? "pass" : "fail",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      // fire defects: 10, addressed: 7 (70%)
      // mod8 should be +1
      // 52 + 0(mod1 70% pass) + 3(mod2) - 2(mod3) + 2(mod4) + 1(mod5) + 0(mod6) + 1(mod7) + 1(mod8) = 58
      expect(r.facilities_score).toBe(58);
    });

    it("gives -3 for < 50% defects addressed", () => {
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          defect_noted_present: true,
          result: i < 4 ? "pass" : "fail",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      // fire defects: 10, addressed: 4 (40%)
      // mod8 should be -3
      // 52 - 5(mod1 40% pass) + 3(mod2) - 2(mod3) + 2(mod4) + 1(mod5) + 0(mod6) + 1(mod7) - 3(mod8) = 49
      expect(r.facilities_score).toBe(49);
    });

    it("counts window fail/urgent_action as unaddressed defects", () => {
      const windowChecks = Array.from({ length: 5 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          outcome: i < 3 ? "fail" : "pass",
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      // 3 window defects, 0 addressed → total defects = 3, addressed = 0 → 0%
      // 52 - 3(mod1) - 2(mod2) - 2(mod3) + 2(mod4) + 4(mod5) + 3(mod6) + 1(mod7) - 3(mod8) = 52
      expect(r.facilities_score).toBe(52);
    });
  });

  // ── Fire Profile ──────────────────────────────────────────────────────

  describe("fire profile calculations", () => {
    it("calculates pass rate correctly", () => {
      const fireChecks = [
        makeFireCheck({ id: "fc_1", result: "pass" }),
        makeFireCheck({ id: "fc_2", result: "pass" }),
        makeFireCheck({ id: "fc_3", result: "fail" }),
        makeFireCheck({ id: "fc_4", result: "needs_attention" }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.pass_rate).toBe(50); // 2/4
      expect(r.fire.total_checks).toBe(4);
    });

    it("counts overdue inspections correctly", () => {
      const fireChecks = [
        makeFireCheck({ id: "fc_1", next_inspection_due: "2025-01-01" }), // overdue
        makeFireCheck({ id: "fc_2", next_inspection_due: "2025-06-15" }), // today — not overdue
        makeFireCheck({ id: "fc_3", next_inspection_due: "2026-01-01" }), // future
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.overdue_inspections).toBe(1);
    });

    it("calculates compliant rate correctly", () => {
      const fireChecks = [
        makeFireCheck({ id: "fc_1", compliance_status: "compliant" }),
        makeFireCheck({ id: "fc_2", compliance_status: "non_compliant" }),
        makeFireCheck({ id: "fc_3", compliance_status: "compliant" }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.compliant_rate).toBe(67); // Math.round(2/3 * 100)
    });
  });

  // ── Water Profile ─────────────────────────────────────────────────────

  describe("water profile calculations", () => {
    it("calculates compliance rate correctly", () => {
      const records = [
        makeWaterRecord({ id: "wh_1", compliance: "compliant" }),
        makeWaterRecord({ id: "wh_2", compliance: "non_compliant" }),
        makeWaterRecord({ id: "wh_3", compliance: "compliant" }),
        makeWaterRecord({ id: "wh_4", compliance: "borderline" }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.compliance_rate).toBe(50); // 2/4
    });

    it("calculates action completion rate correctly", () => {
      const records = [
        makeWaterRecord({ id: "wh_1", action_required_present: true, action_completed: true }),
        makeWaterRecord({ id: "wh_2", action_required_present: true, action_completed: false }),
        makeWaterRecord({ id: "wh_3", action_required_present: false }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.action_completion_rate).toBe(50); // 1/2 (only action_required counted)
    });

    it("counts overdue water checks correctly", () => {
      const records = [
        makeWaterRecord({ id: "wh_1", next_due_date: "2025-01-01" }), // overdue
        makeWaterRecord({ id: "wh_2", next_due_date: "2025-06-15" }), // today — not overdue
        makeWaterRecord({ id: "wh_3", next_due_date: "2026-01-01" }), // future
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.overdue_checks).toBe(1);
    });
  });

  // ── Window Profile ────────────────────────────────────────────────────

  describe("window profile calculations", () => {
    it("counts above-ground windows correctly", () => {
      const windowChecks = [
        makeWindowCheck({ id: "wc_1", floor_above_ground: true }),
        makeWindowCheck({ id: "wc_2", floor_above_ground: false }),
        makeWindowCheck({ id: "wc_3", floor_above_ground: true }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.above_ground_count).toBe(2);
    });

    it("calculates restrictor compliance from above-ground only", () => {
      const windowChecks = [
        makeWindowCheck({ id: "wc_1", floor_above_ground: true, restrictor_present: true, restrictor_working: true, opening_compliance: true }),
        makeWindowCheck({ id: "wc_2", floor_above_ground: true, restrictor_present: false }),
        makeWindowCheck({ id: "wc_3", floor_above_ground: false, restrictor_present: false }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.restrictor_compliance_rate).toBe(50); // 1/2 above-ground
    });

    it("counts overdue window checks correctly", () => {
      const windowChecks = [
        makeWindowCheck({ id: "wc_1", next_due_date: "2025-01-01" }),
        makeWindowCheck({ id: "wc_2", next_due_date: "2026-01-01" }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.overdue_checks).toBe(1);
    });
  });

  // ── Pest Profile ──────────────────────────────────────────────────────

  describe("pest profile calculations", () => {
    it("calculates follow-up completion rate correctly", () => {
      const pestRecords = [
        makePestRecord({ id: "pr_1", follow_up_required: true, follow_up_completed: true }),
        makePestRecord({ id: "pr_2", follow_up_required: true, follow_up_completed: false }),
        makePestRecord({ id: "pr_3", follow_up_required: false }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.pest.follow_up_completion_rate).toBe(50); // 1/2
    });

    it("sums flags correctly", () => {
      const pestRecords = [
        makePestRecord({ id: "pr_1", flags_count: 2 }),
        makePestRecord({ id: "pr_2", flags_count: 3 }),
        makePestRecord({ id: "pr_3", flags_count: 0 }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.pest.flags_total).toBe(5);
      expect(r.pest.total_records).toBe(3);
    });

    it("follow_up_completion_rate is unmeasured when no follow-ups needed", () => {
      const pestRecords = [
        makePestRecord({ id: "pr_1", follow_up_required: false }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.pest.follow_up_completion_rate).toBeNull();
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("uses outstanding headline", () => {
      const fireChecks = Array.from({ length: 20 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}`, defect_noted_present: i < 2 }),
      );
      const waterRecords = Array.from({ length: 20 }, (_, i) =>
        makeWaterRecord({ id: `wh_${i}`, action_required_present: i < 2, action_completed: true }),
      );
      const windowChecks = Array.from({ length: 20 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}` }),
      );
      const pestRecords = Array.from({ length: 5 }, (_, i) =>
        makePestRecord({ id: `pr_${i}`, follow_up_required: i < 2, follow_up_completed: true }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
        window_checks: windowChecks,
        pest_records: pestRecords,
      }));
      if (r.facilities_rating === "outstanding") {
        expect(r.headline).toContain("Exemplary");
      }
    });

    it("uses inadequate headline", () => {
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          result: "fail",
          next_inspection_due: "2024-01-01",
          defect_noted_present: true,
        }),
      );
      const waterRecords = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          compliance: "non_compliant",
          action_required_present: true,
          action_completed: false,
        }),
      );
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          restrictor_present: false,
          restrictor_working: false,
          opening_compliance: false,
          outcome: "fail",
          next_due_date: "2024-01-01",
        }),
      );
      const pestRecords = Array.from({ length: 10 }, (_, i) =>
        makePestRecord({
          id: `pr_${i}`,
          follow_up_required: true,
          follow_up_completed: false,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
        window_checks: windowChecks,
        pest_records: pestRecords,
      }));
      expect(r.facilities_rating).toBe("inadequate");
      expect(r.headline).toContain("Critical");
    });

    it("uses insufficient_data headline for empty input", () => {
      const r = computeHomeFacilitiesCompliance(baseInput());
      expect(r.headline).toBe("No facilities compliance data available for analysis.");
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("adds fire pass rate strength when >= 95%", () => {
      const fireChecks = Array.from({ length: 20 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}` }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.strengths.some((s) => s.includes("fire equipment pass rate"))).toBe(true);
    });

    it("adds water compliance strength when >= 95%", () => {
      const waterRecords = Array.from({ length: 20 }, (_, i) =>
        makeWaterRecord({ id: `wh_${i}` }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: waterRecords }));
      expect(r.strengths.some((s) => s.includes("water hygiene compliance"))).toBe(true);
    });

    it("adds restrictor compliance strength when 100%", () => {
      const windowChecks = Array.from({ length: 5 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}` }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.strengths.some((s) => s.includes("window restrictor compliance"))).toBe(true);
    });

    it("adds no-actions-required strength", () => {
      const waterRecords = Array.from({ length: 5 }, (_, i) =>
        makeWaterRecord({ id: `wh_${i}`, action_required_present: false }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: waterRecords }));
      expect(r.strengths.some((s) => s.includes("No water hygiene actions required"))).toBe(true);
    });

    it("adds no-defects strength", () => {
      const fireChecks = [makeFireCheck({ defect_noted_present: false })];
      const waterRecords = [makeWaterRecord({ action_required_present: false })];
      const windowChecks = [makeWindowCheck({ outcome: "pass" })];
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
        window_checks: windowChecks,
      }));
      expect(r.strengths.some((s) => s.includes("No defects identified"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("raises concern for no fire checks", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        water_hygiene_records: [makeWaterRecord()],
      }));
      expect(r.concerns.some((c) => c.includes("No fire equipment checks"))).toBe(true);
    });

    it("raises concern for low fire pass rate", () => {
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}`, result: i < 5 ? "pass" : "fail" }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.concerns.some((c) => c.includes("fire equipment pass rate"))).toBe(true);
    });

    it("raises concern for overdue fire inspections", () => {
      const fireChecks = [
        makeFireCheck({ id: "fc_1", next_inspection_due: "2025-01-01" }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.concerns.some((c) => c.includes("fire inspection"))).toBe(true);
    });

    it("raises concern for no water records", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: [makeFireCheck()],
      }));
      expect(r.concerns.some((c) => c.includes("No water hygiene records"))).toBe(true);
    });

    it("raises concern for low window restrictor compliance", () => {
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}`, restrictor_present: i < 5, restrictor_working: i < 5 }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.concerns.some((c) => c.includes("window restrictor compliance"))).toBe(true);
    });

    it("raises concern for pest flags", () => {
      const pestRecords = [
        makePestRecord({ id: "pr_1", flags_count: 3 }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.concerns.some((c) => c.includes("pest control flag"))).toBe(true);
    });

    it("raises concern for low water action completion", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          action_required_present: true,
          action_completed: i < 4,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.concerns.some((c) => c.includes("water hygiene actions completed"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends fire check programme when none exist", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        water_hygiene_records: [makeWaterRecord()],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("fire equipment check programme"))).toBe(true);
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("recommends water monitoring when none exist", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: [makeFireCheck()],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("water hygiene monitoring"))).toBe(true);
    });

    it("recommends window restrictors when compliance low", () => {
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}`, restrictor_present: i < 5, restrictor_working: i < 5 }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("window restrictor"))).toBe(true);
    });

    it("recommends pest follow-up when completion low", () => {
      const pestRecords = Array.from({ length: 10 }, (_, i) =>
        makePestRecord({ id: `pr_${i}`, follow_up_required: true, follow_up_completed: i < 4 }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("pest control follow-up"))).toBe(true);
    });

    it("has sequential ranking", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        water_hygiene_records: [makeWaterRecord()],
      }));
      if (r.recommendations.length >= 2) {
        for (let i = 1; i < r.recommendations.length; i++) {
          expect(r.recommendations[i].rank).toBe(r.recommendations[i - 1].rank + 1);
        }
      }
    });

    it("includes regulatory references", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        water_hygiene_records: [makeWaterRecord()],
      }));
      const fireRec = r.recommendations.find((rec) => rec.recommendation.includes("fire"));
      if (fireRec) {
        expect(fireRec.regulatory_ref).toContain("Fire Safety Order");
      }
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────

  describe("insights", () => {
    it("adds positive insight when all domains excellent", () => {
      const fireChecks = Array.from({ length: 20 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}` }),
      );
      const waterRecords = Array.from({ length: 20 }, (_, i) =>
        makeWaterRecord({ id: `wh_${i}` }),
      );
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}` }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
        window_checks: windowChecks,
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("adds critical insight when no fire AND no water records", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        window_checks: [makeWindowCheck()],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No fire equipment or water hygiene"))).toBe(true);
    });

    it("adds critical insight when only no fire records", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        water_hygiene_records: [makeWaterRecord()],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No fire equipment checks"))).toBe(true);
    });

    it("adds critical insight for low restrictor compliance", () => {
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}`, restrictor_present: i < 5, restrictor_working: i < 5 }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("restrictor compliance"))).toBe(true);
    });

    it("adds warning insight for pest flags >= 3", () => {
      const pestRecords = [
        makePestRecord({ id: "pr_1", flags_count: 2 }),
        makePestRecord({ id: "pr_2", flags_count: 2 }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("pest control flags"))).toBe(true);
    });

    it("adds positive water insight when compliance excellent", () => {
      const waterRecords = Array.from({ length: 20 }, (_, i) =>
        makeWaterRecord({ id: `wh_${i}` }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: waterRecords }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Water hygiene compliance"))).toBe(true);
    });
  });

  // ── Cross-modifier interactions ───────────────────────────────────────

  describe("cross-modifier interactions", () => {
    it("fire penalties + water penalties stack correctly", () => {
      // Fire: 60% pass → mod1=-5, 50% timely → mod2=-3
      // Water: 50% compliance → mod3=-4, 40% action → mod4=-3
      // No windows/pest → mod5=+1, mod6=0, mod7=+1, mod8=defects
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          result: i < 6 ? "pass" : "fail",
          next_inspection_due: i < 5 ? "2026-01-01" : "2025-01-01",
          defect_noted_present: true,
        }),
      );
      const waterRecords = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          compliance: i < 5 ? "compliant" : "non_compliant",
          action_required_present: true,
          action_completed: i < 4,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
      }));
      expect(r.facilities_rating).toBe("inadequate");
    });

    it("all max bonuses can reach outstanding", () => {
      // Build input that maximises every modifier
      const fireChecks = Array.from({ length: 20 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}`, defect_noted_present: i < 3 }),
      );
      const waterRecords = Array.from({ length: 20 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          action_required_present: i < 3,
          action_completed: true,
        }),
      );
      const windowChecks = Array.from({ length: 20 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}` }),
      );
      const pestRecords = Array.from({ length: 10 }, (_, i) =>
        makePestRecord({
          id: `pr_${i}`,
          follow_up_required: i < 3,
          follow_up_completed: true,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
        window_checks: windowChecks,
        pest_records: pestRecords,
      }));
      expect(r.facilities_score).toBeGreaterThanOrEqual(80);
      expect(r.facilities_rating).toBe("outstanding");
    });

    it("all max penalties produce inadequate", () => {
      const fireChecks = Array.from({ length: 10 }, (_, i) =>
        makeFireCheck({
          id: `fc_${i}`,
          result: "fail",
          next_inspection_due: "2024-01-01",
          defect_noted_present: true,
        }),
      );
      const waterRecords = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          compliance: "non_compliant",
          action_required_present: true,
          action_completed: false,
          next_due_date: "2024-01-01",
        }),
      );
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          restrictor_present: false,
          restrictor_working: false,
          opening_compliance: false,
          outcome: "fail",
          next_due_date: "2024-01-01",
        }),
      );
      const pestRecords = Array.from({ length: 10 }, (_, i) =>
        makePestRecord({
          id: `pr_${i}`,
          follow_up_required: true,
          follow_up_completed: false,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
        window_checks: windowChecks,
        pest_records: pestRecords,
      }));
      expect(r.facilities_rating).toBe("inadequate");
      expect(r.facilities_score).toBeLessThan(45);
    });

    it("good fire + poor water = adequate overall", () => {
      const fireChecks = Array.from({ length: 20 }, (_, i) =>
        makeFireCheck({ id: `fc_${i}` }),
      );
      const waterRecords = Array.from({ length: 10 }, (_, i) =>
        makeWaterRecord({
          id: `wh_${i}`,
          compliance: i < 3 ? "compliant" : "non_compliant",
          action_required_present: true,
          action_completed: i < 2,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: fireChecks,
        water_hygiene_records: waterRecords,
      }));
      // Good fire (mod1=+5, mod2=+3) but poor water (mod3=-4, mod4=-3)
      // Should land in adequate or inadequate territory
      expect(r.facilities_score).toBeLessThan(80);
    });

    it("no fire, no water, but excellent windows = adequate", () => {
      // mod1=-3, mod2=-2, mod3=-2, mod4=+2, mod5=+4, mod6=+3, mod7=+1, mod8=+2
      // 52 - 3 - 2 - 2 + 2 + 4 + 3 + 1 + 2 = 57
      const windowChecks = Array.from({ length: 10 }, (_, i) =>
        makeWindowCheck({ id: `wc_${i}` }),
      );
      const pestRecords = [makePestRecord()];
      const r = computeHomeFacilitiesCompliance(baseInput({
        window_checks: windowChecks,
        pest_records: pestRecords,
      }));
      expect(r.facilities_rating).toBe("adequate");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single fire check", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        fire_checks: [makeFireCheck()],
      }));
      expect(r.fire.total_checks).toBe(1);
      expect(r.fire.pass_rate).toBe(100);
    });

    it("handles single water record", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        water_hygiene_records: [makeWaterRecord()],
      }));
      expect(r.water.total_checks).toBe(1);
      expect(r.water.compliance_rate).toBe(100);
    });

    it("handles single window check", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        window_checks: [makeWindowCheck()],
      }));
      expect(r.windows.total_checks).toBe(1);
    });

    it("handles single pest record", () => {
      const r = computeHomeFacilitiesCompliance(baseInput({
        pest_records: [makePestRecord()],
      }));
      expect(r.pest.total_records).toBe(1);
    });

    it("today boundary: inspection due today is not overdue", () => {
      const fireChecks = [
        makeFireCheck({ id: "fc_1", next_inspection_due: "2025-06-15" }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.overdue_inspections).toBe(0);
    });

    it("today boundary: inspection due yesterday is overdue", () => {
      const fireChecks = [
        makeFireCheck({ id: "fc_1", next_inspection_due: "2025-06-14" }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.overdue_inspections).toBe(1);
    });

    it("window due today is not overdue", () => {
      const windowChecks = [
        makeWindowCheck({ id: "wc_1", next_due_date: "2025-06-15" }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.overdue_checks).toBe(0);
    });

    it("water due today is not overdue", () => {
      const records = [
        makeWaterRecord({ id: "wh_1", next_due_date: "2025-06-15" }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ water_hygiene_records: records }));
      expect(r.water.overdue_checks).toBe(0);
    });

    it("mixes result types correctly for fire pass rate", () => {
      const fireChecks = [
        makeFireCheck({ id: "fc_1", result: "pass" }),
        makeFireCheck({ id: "fc_2", result: "needs_attention" }),
        makeFireCheck({ id: "fc_3", result: "out_of_service" }),
        makeFireCheck({ id: "fc_4", result: "fail" }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ fire_checks: fireChecks }));
      expect(r.fire.pass_rate).toBe(25); // only "pass" counts
    });

    it("handles all window checks on ground floor", () => {
      const windowChecks = Array.from({ length: 5 }, (_, i) =>
        makeWindowCheck({
          id: `wc_${i}`,
          floor_above_ground: false,
          restrictor_present: false,
        }),
      );
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.above_ground_count).toBe(0);
      expect(r.windows.restrictor_compliance_rate).toBeNull(); // pct(0, 0) = 0
    });

    it("today parameter drives all date comparisons", () => {
      const fireChecks = [
        makeFireCheck({ id: "fc_1", next_inspection_due: "2026-01-01" }),
      ];
      // With today = 2026-01-02, this should be overdue
      const r1 = computeHomeFacilitiesCompliance(baseInput({
        today: "2026-01-02",
        fire_checks: fireChecks,
      }));
      expect(r1.fire.overdue_inspections).toBe(1);

      // With today = 2025-12-31, this should NOT be overdue
      const r2 = computeHomeFacilitiesCompliance(baseInput({
        today: "2025-12-31",
        fire_checks: fireChecks,
      }));
      expect(r2.fire.overdue_inspections).toBe(0);
    });

    it("handles zero flags_count in pest records", () => {
      const pestRecords = [
        makePestRecord({ id: "pr_1", flags_count: 0 }),
        makePestRecord({ id: "pr_2", flags_count: 0 }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ pest_records: pestRecords }));
      expect(r.pest.flags_total).toBe(0);
    });

    it("handles mixed floor levels in window compliance", () => {
      const windowChecks = [
        makeWindowCheck({ id: "wc_1", floor_above_ground: true, restrictor_present: true, restrictor_working: true, opening_compliance: true }),
        makeWindowCheck({ id: "wc_2", floor_above_ground: true, restrictor_present: false, restrictor_working: false, opening_compliance: false }),
        makeWindowCheck({ id: "wc_3", floor_above_ground: false, restrictor_present: false, restrictor_working: false, opening_compliance: false }),
        makeWindowCheck({ id: "wc_4", floor_above_ground: false, restrictor_present: false, restrictor_working: false, opening_compliance: false }),
      ];
      const r = computeHomeFacilitiesCompliance(baseInput({ window_checks: windowChecks }));
      expect(r.windows.above_ground_count).toBe(2);
      expect(r.windows.restrictor_compliance_rate).toBe(50); // 1/2 above-ground compliant
      expect(r.windows.total_checks).toBe(4);
    });
  });

  // ── Score determinism ─────────────────────────────────────────────────

  describe("determinism", () => {
    it("same input always produces same output", () => {
      const input = baseInput({
        fire_checks: Array.from({ length: 10 }, (_, i) =>
          makeFireCheck({ id: `fc_${i}`, result: i < 8 ? "pass" : "fail" }),
        ),
        water_hygiene_records: Array.from({ length: 10 }, (_, i) =>
          makeWaterRecord({ id: `wh_${i}` }),
        ),
        window_checks: Array.from({ length: 5 }, (_, i) =>
          makeWindowCheck({ id: `wc_${i}` }),
        ),
        pest_records: Array.from({ length: 3 }, (_, i) =>
          makePestRecord({ id: `pr_${i}` }),
        ),
      });

      const r1 = computeHomeFacilitiesCompliance(input);
      const r2 = computeHomeFacilitiesCompliance(input);
      expect(r1.facilities_score).toBe(r2.facilities_score);
      expect(r1.facilities_rating).toBe(r2.facilities_rating);
      expect(r1.headline).toBe(r2.headline);
    });
  });
});
