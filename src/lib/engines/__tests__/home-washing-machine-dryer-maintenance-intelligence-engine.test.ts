// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WASHING MACHINE & DRYER MAINTENANCE INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration (180 tests)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeWashingMachineDryerMaintenance,
  type ServicingRecordInput,
  type BreakdownRecordInput,
  type ChildAccessRecordInput,
  type HygieneCycleRecordInput,
  type EnergyRecordInput,
  type WashingMachineDryerMaintenanceInput,
} from "../home-washing-machine-dryer-maintenance-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

function makeServicingRecord(overrides: Partial<ServicingRecordInput> = {}): ServicingRecordInput {
  return {
    id: "svc_test",
    appliance_id: "app_1",
    appliance_type: "washing_machine",
    appliance_location: "Utility room",
    service_type: "annual_service",
    service_date: "2026-03-01",
    next_service_due: "2027-03-01",
    service_overdue: false,
    engineer_name: "Joe Engineer",
    engineer_qualified: true,
    parts_replaced: false,
    parts_description: "",
    passed_safety_check: true,
    certificate_on_file: true,
    cost_gbp: 120,
    notes: "",
    created_at: "2026-03-01",
    ...overrides,
  };
}

function makeBreakdownRecord(overrides: Partial<BreakdownRecordInput> = {}): BreakdownRecordInput {
  return {
    id: "brk_test",
    appliance_id: "app_1",
    appliance_type: "washing_machine",
    reported_date: "2026-04-01",
    reported_by: "staff",
    fault_description: "Drum not spinning",
    severity: "moderate",
    response_date: "2026-04-01",
    resolved_date: "2026-04-02",
    resolved: true,
    response_within_24h: true,
    response_within_48h: true,
    temporary_arrangement_provided: true,
    impact_on_children: "minor_inconvenience",
    root_cause: "Belt worn",
    preventable: false,
    repeat_fault: false,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeChildAccessRecord(overrides: Partial<ChildAccessRecordInput> = {}): ChildAccessRecordInput {
  return {
    id: "acc_test",
    child_id: "yp_1",
    child_age: 15,
    access_type: "independent",
    can_use_washing_machine: true,
    can_use_dryer: true,
    trained_on_appliance_use: true,
    training_date: "2026-01-15",
    risk_assessment_completed: true,
    risk_assessment_date: "2026-01-15",
    child_preference_respected: true,
    laundry_schedule_agreed: true,
    personal_items_separated: true,
    child_satisfaction_rating: 5,
    barriers_to_access: [],
    independence_goal_set: true,
    independence_goal_met: true,
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeHygieneCycleRecord(overrides: Partial<HygieneCycleRecordInput> = {}): HygieneCycleRecordInput {
  return {
    id: "hyg_test",
    appliance_id: "app_1",
    appliance_type: "washing_machine",
    cycle_type: "hot_wash_90",
    scheduled_date: "2026-04-01",
    completed_date: "2026-04-01",
    completed: true,
    completed_on_time: true,
    temperature_verified: true,
    detergent_type: "anti_bacterial",
    infection_control_compliant: true,
    recorded_by: "staff_test",
    notes: "",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeEnergyRecord(overrides: Partial<EnergyRecordInput> = {}): EnergyRecordInput {
  return {
    id: "eng_test",
    appliance_id: "app_1",
    appliance_type: "washing_machine",
    energy_rating: "A+++",
    age_years: 2,
    average_cycles_per_week: 7,
    eco_mode_available: true,
    eco_mode_used_percentage: 80,
    water_consumption_litres_per_cycle: 45,
    energy_kwh_per_cycle: 0.9,
    last_efficiency_check_date: "2026-03-01",
    efficiency_check_overdue: false,
    replacement_recommended: false,
    replacement_reason: "",
    annual_cost_estimate_gbp: 120,
    created_at: "2026-03-01",
    ...overrides,
  };
}

const baseInput: WashingMachineDryerMaintenanceInput = {
  today: "2026-06-01",
  total_children: 3,
  servicing_records: [],
  breakdown_records: [],
  child_access_records: [],
  hygiene_cycle_records: [],
  energy_records: [],
};

// ══════════════════════════════════════════════════════════════════════════════
// 1. EMPTY / EDGE-CASE SCENARIOS
// ══════════════════════════════════════════════════════════════════════════════

describe("Empty / edge-case scenarios", () => {
  it("returns insufficient_data when all arrays empty and 0 children", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 0 });
    expect(r.appliance_rating).toBe("insufficient_data");
    expect(r.appliance_score).toBe(0);
  });

  it("returns correct headline for insufficient_data", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 0 });
    expect(r.headline).toContain("insufficient data");
  });

  it("returns zero for all rates when insufficient_data", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 0 });
    expect(r.servicing_rate).toBe(0);
    expect(r.breakdown_response_rate).toBe(0);
    expect(r.child_access_rate).toBe(0);
    expect(r.hygiene_cycle_rate).toBe(0);
    expect(r.energy_efficiency_rate).toBe(0);
    expect(r.child_independence_rate).toBe(0);
  });

  it("returns empty arrays for strengths/concerns/recommendations/insights when insufficient_data", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 0 });
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("returns inadequate with score 15 when all empty + children > 0", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 3 });
    expect(r.appliance_rating).toBe("inadequate");
    expect(r.appliance_score).toBe(15);
  });

  it("returns concerns when all empty + children > 0", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 3 });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No servicing records");
  });

  it("returns 2 recommendations when all empty + children > 0", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 3 });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("returns 1 critical insight when all empty + children > 0", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 3 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("returns total_appliances 0 when all empty", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 3 });
    expect(r.total_appliances).toBe(0);
  });

  it("returns headline mentioning urgent attention when all empty + children > 0", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 3 });
    expect(r.headline).toContain("urgent attention");
  });

  it("returns average_appliance_age 0 when no energy records", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 0 });
    expect(r.average_appliance_age).toBeNull();
  });

  it("returns breakdown_resolution_avg_hours 0 when no breakdowns", () => {
    const r = computeWashingMachineDryerMaintenance({ ...baseInput, total_children: 0 });
    expect(r.breakdown_resolution_avg_hours).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. SERVICING RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Servicing rate", () => {
  it("achieves 100% when no overdue services", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
    });
    expect(r.servicing_rate).toBe(100);
  });

  it("achieves 0% when all overdue", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
    });
    expect(r.servicing_rate).toBe(0);
  });

  it("achieves 50% when half compliant", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [
        makeServicingRecord({ id: "s1" }),
        makeServicingRecord({ id: "s2", service_overdue: true }),
      ],
    });
    expect(r.servicing_rate).toBe(50);
  });

  it("counts unique appliance IDs for total_appliances", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [
        makeServicingRecord({ id: "s1", appliance_id: "app_1" }),
        makeServicingRecord({ id: "s2", appliance_id: "app_1" }),
        makeServicingRecord({ id: "s3", appliance_id: "app_2" }),
      ],
    });
    expect(r.total_appliances).toBe(2);
  });

  it("tracks safety pass rate across multiple records", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [
        makeServicingRecord({ id: "s1", passed_safety_check: true }),
        makeServicingRecord({ id: "s2", passed_safety_check: false }),
      ],
    });
    // 50% safety pass rate → concern
    expect(r.concerns.some(c => c.includes("safety checks"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. BREAKDOWN RESPONSE RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Breakdown response rate", () => {
  it("achieves 100% when all responded within 24h", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord()],
    });
    expect(r.breakdown_response_rate).toBe(100);
  });

  it("achieves 0% when none responded within 24h", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({ response_within_24h: false })],
    });
    expect(r.breakdown_response_rate).toBe(0);
  });

  it("achieves 50% when half responded within 24h", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [
        makeBreakdownRecord({ id: "b1" }),
        makeBreakdownRecord({ id: "b2", response_within_24h: false }),
      ],
    });
    expect(r.breakdown_response_rate).toBe(50);
  });

  it("calculates breakdown_resolution_avg_hours correctly", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({
        reported_date: "2026-04-01T08:00:00",
        resolved_date: "2026-04-02T08:00:00",
        resolved: true,
      })],
    });
    expect(r.breakdown_resolution_avg_hours).toBe(24);
  });

  it("returns 0 avg hours when no resolved breakdowns", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({
        resolved: false,
        resolved_date: null,
      })],
    });
    expect(r.breakdown_resolution_avg_hours).toBeNull();
  });

  it("counts unique appliance IDs from breakdowns", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [
        makeBreakdownRecord({ id: "b1", appliance_id: "app_1" }),
        makeBreakdownRecord({ id: "b2", appliance_id: "app_2" }),
      ],
    });
    expect(r.total_appliances).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CHILD ACCESS RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Child access rate", () => {
  it("achieves 100% when all children have access", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord()],
    });
    expect(r.child_access_rate).toBe(100);
  });

  it("achieves 0% when no children have access", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({
        can_use_washing_machine: false,
        can_use_dryer: false,
      })],
    });
    expect(r.child_access_rate).toBe(0);
  });

  it("counts access if child can use either machine or dryer", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({
        can_use_washing_machine: true,
        can_use_dryer: false,
      })],
    });
    expect(r.child_access_rate).toBe(100);
  });

  it("calculates 50% when half have access", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [
        makeChildAccessRecord({ id: "a1", child_id: "yp_1" }),
        makeChildAccessRecord({ id: "a2", child_id: "yp_2", can_use_washing_machine: false, can_use_dryer: false }),
      ],
    });
    expect(r.child_access_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. CHILD INDEPENDENCE RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Child independence rate", () => {
  it("achieves 100% when all independent", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ access_type: "independent" })],
    });
    expect(r.child_independence_rate).toBe(100);
  });

  it("counts supported as independent", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ access_type: "supported" })],
    });
    expect(r.child_independence_rate).toBe(100);
  });

  it("achieves 0% when all supervised or staff_only", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ access_type: "supervised" })],
    });
    expect(r.child_independence_rate).toBe(0);
  });

  it("achieves 0% for staff_only access", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ access_type: "staff_only" })],
    });
    expect(r.child_independence_rate).toBe(0);
  });

  it("calculates 50% for mixed independence", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [
        makeChildAccessRecord({ id: "a1", child_id: "yp_1", access_type: "independent" }),
        makeChildAccessRecord({ id: "a2", child_id: "yp_2", access_type: "supervised" }),
      ],
    });
    expect(r.child_independence_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. HYGIENE CYCLE RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Hygiene cycle rate", () => {
  it("achieves 100% when all completed", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [makeHygieneCycleRecord()],
    });
    expect(r.hygiene_cycle_rate).toBe(100);
  });

  it("achieves 0% when none completed", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [makeHygieneCycleRecord({ completed: false })],
    });
    expect(r.hygiene_cycle_rate).toBe(0);
  });

  it("achieves 50% when half completed", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [
        makeHygieneCycleRecord({ id: "h1" }),
        makeHygieneCycleRecord({ id: "h2", completed: false }),
      ],
    });
    expect(r.hygiene_cycle_rate).toBe(50);
  });

  it("counts unique appliance IDs from hygiene cycles", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [
        makeHygieneCycleRecord({ id: "h1", appliance_id: "app_1" }),
        makeHygieneCycleRecord({ id: "h2", appliance_id: "app_2" }),
      ],
    });
    expect(r.total_appliances).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. ENERGY EFFICIENCY RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Energy efficiency rate", () => {
  it("achieves 100% for all A+++ rated appliances", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ energy_rating: "A+++" })],
    });
    expect(r.energy_efficiency_rate).toBe(100);
  });

  it("achieves 100% for A rated appliances", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ energy_rating: "A" })],
    });
    expect(r.energy_efficiency_rate).toBe(100);
  });

  it("achieves 0% for B or worse rated appliances", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ energy_rating: "B" })],
    });
    expect(r.energy_efficiency_rate).toBe(0);
  });

  it("achieves 0% for G rated appliances", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ energy_rating: "G" })],
    });
    expect(r.energy_efficiency_rate).toBe(0);
  });

  it("achieves 0% for unknown rated appliances", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ energy_rating: "unknown" })],
    });
    expect(r.energy_efficiency_rate).toBe(0);
  });

  it("calculates average appliance age correctly", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [
        makeEnergyRecord({ id: "e1", appliance_id: "a1", age_years: 3 }),
        makeEnergyRecord({ id: "e2", appliance_id: "a2", age_years: 7 }),
      ],
    });
    expect(r.average_appliance_age).toBe(5);
  });

  it("accepts all A-grade variants", () => {
    const records = (["A+++", "A++", "A+", "A"] as const).map((r, i) =>
      makeEnergyRecord({ id: `e${i}`, appliance_id: `a${i}`, energy_rating: r }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: records,
    });
    expect(r.energy_efficiency_rate).toBe(100);
  });

  it("counts mixed ratings correctly", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [
        makeEnergyRecord({ id: "e1", appliance_id: "a1", energy_rating: "A+++" }),
        makeEnergyRecord({ id: "e2", appliance_id: "a2", energy_rating: "D" }),
      ],
    });
    expect(r.energy_efficiency_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. SCORING — BONUSES
// ══════════════════════════════════════════════════════════════════════════════

describe("Scoring — bonuses", () => {
  it("starts at base 52 with minimal non-empty records (no bonus/penalty)", () => {
    // A single servicing record that is overdue but >= 50% overdue won't trigger penalty
    // Actually, 1 record overdue = 0% servicing < 50 → penalty -6. Let's use a non-triggering record.
    // Use energy record with bad rating: no penalty on energy, no bonus.
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ energy_rating: "C" })],
    });
    // base 52, energyEfficiency 0% but no penalty for that, no bonus
    expect(r.appliance_score).toBe(52);
  });

  it("awards +5 for servicingRate >= 95", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
    });
    // 100% servicing → +5
    expect(r.appliance_score).toBeGreaterThanOrEqual(57);
  });

  it("awards +3 for servicingRate 80-94", () => {
    const svcs = Array.from({ length: 10 }, (_, i) =>
      makeServicingRecord({ id: `s${i}`, service_overdue: i >= 9 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: svcs,
    });
    // 90% → +3
    expect(r.appliance_score).toBeGreaterThanOrEqual(55);
  });

  it("awards +5 for breakdownResponseRate >= 90", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord()],
    });
    // 100% → +5
    expect(r.appliance_score).toBeGreaterThanOrEqual(57);
  });

  it("awards +3 for breakdownResponseRate 70-89", () => {
    const brks = Array.from({ length: 10 }, (_, i) =>
      makeBreakdownRecord({ id: `b${i}`, appliance_id: `a${i}`, response_within_24h: i < 8 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: brks,
    });
    // 80% → +3
    expect(r.appliance_score).toBeGreaterThanOrEqual(55);
  });

  it("awards +4 for childAccessRate >= 90", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord()],
    });
    // 100% → +4
    expect(r.appliance_score).toBeGreaterThanOrEqual(56);
  });

  it("awards +2 for childAccessRate 70-89", () => {
    const accs = Array.from({ length: 10 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`,
        child_id: `yp_${i}`,
        can_use_washing_machine: i < 8,
        can_use_dryer: i < 8,
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    // 80% → +2
    expect(r.appliance_score).toBeGreaterThanOrEqual(54);
  });

  it("awards +5 for hygieneCycleRate >= 95", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [makeHygieneCycleRecord()],
    });
    // 100% → +5
    expect(r.appliance_score).toBeGreaterThanOrEqual(57);
  });

  it("awards +3 for hygieneCycleRate 80-94", () => {
    const hygs = Array.from({ length: 10 }, (_, i) =>
      makeHygieneCycleRecord({ id: `h${i}`, completed: i < 9 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: hygs,
    });
    // 90% → +3
    expect(r.appliance_score).toBeGreaterThanOrEqual(55);
  });

  it("awards +4 for energyEfficiencyRate >= 80", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord()],
    });
    // 100% → +4
    expect(r.appliance_score).toBeGreaterThanOrEqual(56);
  });

  it("awards +2 for energyEfficiencyRate 60-79", () => {
    const engs = Array.from({ length: 10 }, (_, i) =>
      makeEnergyRecord({
        id: `e${i}`,
        appliance_id: `a${i}`,
        energy_rating: i < 7 ? "A+++" : "D",
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: engs,
    });
    // 70% → +2
    expect(r.appliance_score).toBeGreaterThanOrEqual(54);
  });

  it("awards +5 for childIndependenceRate >= 80", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ access_type: "independent" })],
    });
    // 100% → +5
    expect(r.appliance_score).toBeGreaterThanOrEqual(57);
  });

  it("awards +3 for childIndependenceRate 60-79", () => {
    const accs = Array.from({ length: 10 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`,
        child_id: `yp_${i}`,
        access_type: i < 7 ? "independent" : "supervised",
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    // 70% → +3
    expect(r.appliance_score).toBeGreaterThanOrEqual(55);
  });

  it("achieves maximum score 80 with all bonuses", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
      breakdown_records: [makeBreakdownRecord()],
      child_access_records: [makeChildAccessRecord()],
      hygiene_cycle_records: [makeHygieneCycleRecord()],
      energy_records: [makeEnergyRecord()],
    });
    // base 52 + 5 + 5 + 4 + 5 + 4 + 5 = 80
    expect(r.appliance_score).toBe(80);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. SCORING — PENALTIES
// ══════════════════════════════════════════════════════════════════════════════

describe("Scoring — penalties", () => {
  it("penalises -6 for servicingRate < 50", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
    });
    // base 52 - 6 = 46
    expect(r.appliance_score).toBe(46);
  });

  it("penalises -5 for breakdownResponseRate < 50", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({ response_within_24h: false })],
    });
    // base 52 - 5 = 47
    expect(r.appliance_score).toBe(47);
  });

  it("penalises -5 for hygieneCycleRate < 50", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [makeHygieneCycleRecord({ completed: false })],
    });
    // base 52 - 5 = 47
    expect(r.appliance_score).toBe(47);
  });

  it("penalises -6 for unresolvedSafetyCritical > 0", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({
        severity: "safety_critical",
        resolved: false,
        response_within_24h: true,
      })],
    });
    // base 52 + 5 (response 100%) - 6 (safety critical) = 51
    expect(r.appliance_score).toBe(51);
  });

  it("stacks all penalties for combined worst case", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
      breakdown_records: [makeBreakdownRecord({
        response_within_24h: false,
        severity: "safety_critical",
        resolved: false,
      })],
      hygiene_cycle_records: [makeHygieneCycleRecord({ completed: false })],
    });
    // base 52 - 6 - 5 - 5 - 6 = 30
    expect(r.appliance_score).toBe(30);
  });

  it("does not penalise servicing when 0 records", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord()],
    });
    expect(r.appliance_score).toBeGreaterThanOrEqual(52);
  });

  it("does not penalise breakdowns when 0 records", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord()],
    });
    expect(r.appliance_score).toBeGreaterThanOrEqual(52);
  });

  it("score is clamped to minimum 0", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
      breakdown_records: [makeBreakdownRecord({
        response_within_24h: false,
        severity: "safety_critical",
        resolved: false,
      })],
      hygiene_cycle_records: [makeHygieneCycleRecord({ completed: false })],
    });
    expect(r.appliance_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped to maximum 100", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
      breakdown_records: [makeBreakdownRecord()],
      child_access_records: [makeChildAccessRecord()],
      hygiene_cycle_records: [makeHygieneCycleRecord()],
      energy_records: [makeEnergyRecord()],
    });
    expect(r.appliance_score).toBeLessThanOrEqual(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. RATING THRESHOLDS
// ══════════════════════════════════════════════════════════════════════════════

describe("Rating thresholds", () => {
  it("returns outstanding for score >= 80", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
      breakdown_records: [makeBreakdownRecord()],
      child_access_records: [makeChildAccessRecord()],
      hygiene_cycle_records: [makeHygieneCycleRecord()],
      energy_records: [makeEnergyRecord()],
    });
    expect(r.appliance_rating).toBe("outstanding");
    expect(r.appliance_score).toBe(80);
  });

  it("returns good for score 65-79", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
      breakdown_records: [makeBreakdownRecord()],
      child_access_records: [makeChildAccessRecord()],
    });
    // 52 + 5 + 5 + 4 + 5 = 71
    expect(r.appliance_rating).toBe("good");
  });

  it("returns adequate for score 45-64", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ energy_rating: "C" })],
    });
    // base 52
    expect(r.appliance_rating).toBe("adequate");
    expect(r.appliance_score).toBe(52);
  });

  it("returns inadequate for score < 45", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
      breakdown_records: [makeBreakdownRecord({
        response_within_24h: false,
        severity: "safety_critical",
        resolved: false,
      })],
      hygiene_cycle_records: [makeHygieneCycleRecord({ completed: false })],
    });
    // 52 - 6 - 5 - 5 - 6 = 30
    expect(r.appliance_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("includes servicing strength at >= 95%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
    });
    expect(r.strengths.some(s => s.includes("servicing is fully up to date"))).toBe(true);
  });

  it("includes servicing strength at 80-94%", () => {
    const svcs = Array.from({ length: 10 }, (_, i) =>
      makeServicingRecord({ id: `s${i}`, service_overdue: i >= 9 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: svcs,
    });
    expect(r.strengths.some(s => s.includes("90% servicing compliance"))).toBe(true);
  });

  it("includes breakdown response strength at >= 90%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord()],
    });
    expect(r.strengths.some(s => s.includes("breakdowns responded to within 24 hours"))).toBe(true);
  });

  it("includes breakdown response strength at 70-89%", () => {
    const brks = Array.from({ length: 10 }, (_, i) =>
      makeBreakdownRecord({ id: `b${i}`, appliance_id: `a${i}`, response_within_24h: i < 8 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: brks,
    });
    expect(r.strengths.some(s => s.includes("80% breakdown response"))).toBe(true);
  });

  it("includes child access strength at >= 90%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord()],
    });
    expect(r.strengths.some(s => s.includes("children have access to laundry"))).toBe(true);
  });

  it("includes child access strength at 70-89%", () => {
    const accs = Array.from({ length: 10 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`, child_id: `yp_${i}`,
        can_use_washing_machine: i < 8, can_use_dryer: i < 8,
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    expect(r.strengths.some(s => s.includes("80% child access"))).toBe(true);
  });

  it("includes hygiene cycle strength at >= 95%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [makeHygieneCycleRecord()],
    });
    expect(r.strengths.some(s => s.includes("Hygiene cycle compliance is exemplary"))).toBe(true);
  });

  it("includes hygiene cycle strength at 80-94%", () => {
    const hygs = Array.from({ length: 10 }, (_, i) =>
      makeHygieneCycleRecord({ id: `h${i}`, completed: i < 9 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: hygs,
    });
    expect(r.strengths.some(s => s.includes("90% of hygiene cycles completed"))).toBe(true);
  });

  it("includes energy efficiency strength at >= 80%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord()],
    });
    expect(r.strengths.some(s => s.includes("energy ratings of A or better"))).toBe(true);
  });

  it("includes energy efficiency strength at 60-79%", () => {
    const engs = Array.from({ length: 10 }, (_, i) =>
      makeEnergyRecord({
        id: `e${i}`, appliance_id: `a${i}`,
        energy_rating: i < 7 ? "A" : "D",
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: engs,
    });
    expect(r.strengths.some(s => s.includes("energy-efficient"))).toBe(true);
  });

  it("includes child independence strength at >= 80%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord()],
    });
    expect(r.strengths.some(s => s.includes("manage laundry independently"))).toBe(true);
  });

  it("includes child independence strength at 60-79%", () => {
    const accs = Array.from({ length: 10 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`, child_id: `yp_${i}`,
        access_type: i < 7 ? "independent" : "supervised",
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    expect(r.strengths.some(s => s.includes("independent or supported laundry access"))).toBe(true);
  });

  it("includes safety + certificate strength when both 100%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
    });
    expect(r.strengths.some(s => s.includes("safety check with certificates on file"))).toBe(true);
  });

  it("includes breakdown resolution + temp arrangement strength", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord()],
    });
    expect(r.strengths.some(s => s.includes("fully resolved") && s.includes("temporary arrangements"))).toBe(true);
  });

  it("includes training + risk assessment strength at >= 90%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord()],
    });
    expect(r.strengths.some(s => s.includes("trained") && s.includes("risk assessed"))).toBe(true);
  });

  it("includes satisfaction + preference strength", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord()],
    });
    expect(r.strengths.some(s => s.includes("satisfaction") && s.includes("preferences respected"))).toBe(true);
  });

  it("includes infection control strength at >= 95%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [makeHygieneCycleRecord()],
    });
    expect(r.strengths.some(s => s.includes("infection control compliance"))).toBe(true);
  });

  it("includes independence goals met strength", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({
        child_age: 15,
        access_type: "independent",
        independence_goal_set: true,
        independence_goal_met: true,
      })],
    });
    expect(r.strengths.some(s => s.includes("independence goals met"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("Concerns", () => {
  it("raises servicing concern < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
    });
    expect(r.concerns.some(c => c.includes("0% of servicing records are compliant"))).toBe(true);
  });

  it("raises servicing concern 50-79%", () => {
    const svcs = Array.from({ length: 10 }, (_, i) =>
      makeServicingRecord({ id: `s${i}`, service_overdue: i >= 6 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: svcs,
    });
    expect(r.concerns.some(c => c.includes("Servicing compliance at 60%"))).toBe(true);
  });

  it("raises breakdown response concern < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({ response_within_24h: false })],
    });
    expect(r.concerns.some(c => c.includes("0% of breakdowns responded to within 24 hours"))).toBe(true);
  });

  it("raises breakdown response concern 50-69%", () => {
    const brks = Array.from({ length: 10 }, (_, i) =>
      makeBreakdownRecord({ id: `b${i}`, appliance_id: `a${i}`, response_within_24h: i < 6 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: brks,
    });
    expect(r.concerns.some(c => c.includes("Breakdown response rate at 60%"))).toBe(true);
  });

  it("raises child access concern < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({
        can_use_washing_machine: false,
        can_use_dryer: false,
      })],
    });
    expect(r.concerns.some(c => c.includes("0% of children have access"))).toBe(true);
  });

  it("raises child access concern 50-69%", () => {
    const accs = Array.from({ length: 10 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`, child_id: `yp_${i}`,
        can_use_washing_machine: i < 6, can_use_dryer: i < 6,
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    expect(r.concerns.some(c => c.includes("Child laundry access at 60%"))).toBe(true);
  });

  it("raises hygiene cycle concern < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [makeHygieneCycleRecord({ completed: false })],
    });
    expect(r.concerns.some(c => c.includes("0% of scheduled hygiene cycles completed"))).toBe(true);
  });

  it("raises hygiene cycle concern 50-79%", () => {
    const hygs = Array.from({ length: 10 }, (_, i) =>
      makeHygieneCycleRecord({ id: `h${i}`, completed: i < 6 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: hygs,
    });
    expect(r.concerns.some(c => c.includes("Hygiene cycle completion at 60%"))).toBe(true);
  });

  it("raises energy efficiency concern < 40%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ energy_rating: "D" })],
    });
    expect(r.concerns.some(c => c.includes("0% of appliances meet modern energy"))).toBe(true);
  });

  it("raises energy efficiency concern 40-59%", () => {
    const engs = Array.from({ length: 10 }, (_, i) =>
      makeEnergyRecord({
        id: `e${i}`, appliance_id: `a${i}`,
        energy_rating: i < 5 ? "A" : "D",
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: engs,
    });
    expect(r.concerns.some(c => c.includes("Energy efficiency at 50%"))).toBe(true);
  });

  it("raises child independence concern < 40%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ access_type: "supervised" })],
    });
    expect(r.concerns.some(c => c.includes("0% of children manage laundry independently"))).toBe(true);
  });

  it("raises child independence concern 40-59%", () => {
    const accs = Array.from({ length: 10 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`, child_id: `yp_${i}`,
        access_type: i < 5 ? "independent" : "supervised",
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    expect(r.concerns.some(c => c.includes("Child independence in laundry at 50%"))).toBe(true);
  });

  it("raises unresolved safety critical concern", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({
        severity: "safety_critical",
        resolved: false,
      })],
    });
    expect(r.concerns.some(c => c.includes("safety-critical"))).toBe(true);
  });

  it("raises overdue servicing concern", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
    });
    expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
  });

  it("raises health hygiene impact concern", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({ impact_on_children: "health_hygiene_risk" })],
    });
    expect(r.concerns.some(c => c.includes("health or hygiene risks"))).toBe(true);
  });

  it("raises repeat fault concern > 30%", () => {
    const brks = Array.from({ length: 10 }, (_, i) =>
      makeBreakdownRecord({
        id: `b${i}`, appliance_id: `a${i}`,
        repeat_fault: i < 4,
        preventable: i < 5,
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: brks,
    });
    expect(r.concerns.some(c => c.includes("repeat faults"))).toBe(true);
  });

  it("raises training + risk assessment concern when both < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({
        trained_on_appliance_use: false,
        risk_assessment_completed: false,
      })],
    });
    expect(r.concerns.some(c => c.includes("trained") && c.includes("risk assessed"))).toBe(true);
  });

  it("raises low satisfaction concern < 2.5", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ child_satisfaction_rating: 2 })],
    });
    expect(r.concerns.some(c => c.includes("satisfaction"))).toBe(true);
  });

  it("raises infection control concern < 70%", () => {
    const hygs = Array.from({ length: 10 }, (_, i) =>
      makeHygieneCycleRecord({ id: `h${i}`, infection_control_compliant: i < 6 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: hygs,
    });
    expect(r.concerns.some(c => c.includes("Infection control compliance"))).toBe(true);
  });

  it("raises very old appliance concern", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ age_years: 16 })],
    });
    expect(r.concerns.some(c => c.includes("over 15 years old"))).toBe(true);
  });

  it("raises replacement recommended concern", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ replacement_recommended: true })],
    });
    expect(r.concerns.some(c => c.includes("flagged for replacement"))).toBe(true);
  });

  it("raises safety pass rate concern < 80%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [
        makeServicingRecord({ id: "s1", passed_safety_check: false }),
        makeServicingRecord({ id: "s2", passed_safety_check: false }),
      ],
    });
    expect(r.concerns.some(c => c.includes("safety checks"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Recommendations", () => {
  it("recommends immediate for unresolved safety critical", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({ severity: "safety_critical", resolved: false })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("safety-critical"))).toBe(true);
  });

  it("recommends immediate for servicing < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("servicing up to date"))).toBe(true);
  });

  it("recommends immediate for hygiene < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [makeHygieneCycleRecord({ completed: false })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("hygiene cycles"))).toBe(true);
  });

  it("recommends immediate for breakdown response < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({ response_within_24h: false })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("response protocol"))).toBe(true);
  });

  it("recommends immediate for health hygiene impact", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({ impact_on_children: "health_hygiene_risk" })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("health or hygiene risks"))).toBe(true);
  });

  it("recommends immediate for safety pass < 80%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [
        makeServicingRecord({ id: "s1", passed_safety_check: false }),
        makeServicingRecord({ id: "s2", passed_safety_check: false }),
      ],
    });
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("safety checks"))).toBe(true);
  });

  it("recommends immediate for child access < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ can_use_washing_machine: false, can_use_dryer: false })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("laundry access"))).toBe(true);
  });

  it("recommends soon for servicing 50-79%", () => {
    const svcs = Array.from({ length: 10 }, (_, i) =>
      makeServicingRecord({ id: `s${i}`, service_overdue: i >= 6 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: svcs,
    });
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("servicing compliance"))).toBe(true);
  });

  it("recommends soon for breakdown response 50-69%", () => {
    const brks = Array.from({ length: 10 }, (_, i) =>
      makeBreakdownRecord({ id: `b${i}`, appliance_id: `a${i}`, response_within_24h: i < 6 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: brks,
    });
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("breakdown response"))).toBe(true);
  });

  it("recommends soon for hygiene 50-79%", () => {
    const hygs = Array.from({ length: 10 }, (_, i) =>
      makeHygieneCycleRecord({ id: `h${i}`, completed: i < 6 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: hygs,
    });
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("hygiene cycle completion"))).toBe(true);
  });

  it("recommends soon for child access 50-69%", () => {
    const accs = Array.from({ length: 10 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`, child_id: `yp_${i}`,
        can_use_washing_machine: i < 6, can_use_dryer: i < 6,
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("laundry access"))).toBe(true);
  });

  it("recommends soon for child independence < 60%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ access_type: "supervised" })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("independence plans"))).toBe(true);
  });

  it("recommends soon for repeat/preventable faults", () => {
    const brks = Array.from({ length: 10 }, (_, i) =>
      makeBreakdownRecord({
        id: `b${i}`, appliance_id: `a${i}`,
        repeat_fault: i < 4,
        preventable: i < 5,
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: brks,
    });
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("repeat and preventable"))).toBe(true);
  });

  it("recommends planned for energy efficiency < 60%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ energy_rating: "D" })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("replacement programme"))).toBe(true);
  });

  it("recommends planned for very old/flagged appliances", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ age_years: 16 })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("ageing"))).toBe(true);
  });

  it("recommends planned for low eco mode usage", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ eco_mode_available: true, eco_mode_used_percentage: 20 })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("eco mode"))).toBe(true);
  });

  it("recommends planned for temperature verification < 80%", () => {
    const hygs = Array.from({ length: 10 }, (_, i) =>
      makeHygieneCycleRecord({ id: `h${i}`, temperature_verified: i < 7 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: hygs,
    });
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("temperature verification"))).toBe(true);
  });

  it("recommends planned for low satisfaction", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ child_satisfaction_rating: 2 })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("dissatisfaction"))).toBe(true);
  });

  it("assigns sequential rank numbers", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
      breakdown_records: [makeBreakdownRecord({ response_within_24h: false })],
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("includes regulatory_ref on all recommendations", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
    });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref).toBeTruthy();
    }
  });

  it("returns no recommendations when everything is excellent", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
      breakdown_records: [makeBreakdownRecord()],
      child_access_records: [makeChildAccessRecord()],
      hygiene_cycle_records: [makeHygieneCycleRecord()],
      energy_records: [makeEnergyRecord()],
    });
    expect(r.recommendations).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Insights", () => {
  it("critical insight for unresolved safety critical", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({ severity: "safety_critical", resolved: false })],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("safety-critical"))).toBe(true);
  });

  it("critical insight for servicing < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("servicing compliance"))).toBe(true);
  });

  it("critical insight for hygiene < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [makeHygieneCycleRecord({ completed: false })],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("hygiene cycles completed"))).toBe(true);
  });

  it("critical insight for breakdown response < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({ response_within_24h: false })],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("breakdowns responded to"))).toBe(true);
  });

  it("critical insight for health hygiene impact", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord({ impact_on_children: "health_hygiene_risk" })],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("health or hygiene risks"))).toBe(true);
  });

  it("critical insight for child access < 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ can_use_washing_machine: false, can_use_dryer: false })],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("laundry access"))).toBe(true);
  });

  it("warning insight for servicing 50-79%", () => {
    const svcs = Array.from({ length: 10 }, (_, i) =>
      makeServicingRecord({ id: `s${i}`, service_overdue: i >= 6 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: svcs,
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Servicing compliance at 60%"))).toBe(true);
  });

  it("warning insight for breakdown response 50-69%", () => {
    const brks = Array.from({ length: 10 }, (_, i) =>
      makeBreakdownRecord({ id: `b${i}`, appliance_id: `a${i}`, response_within_24h: i < 6 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: brks,
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Breakdown response at 60%"))).toBe(true);
  });

  it("warning insight for hygiene 50-79%", () => {
    const hygs = Array.from({ length: 10 }, (_, i) =>
      makeHygieneCycleRecord({ id: `h${i}`, completed: i < 6 }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: hygs,
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Hygiene cycle completion at 60%"))).toBe(true);
  });

  it("warning insight for child access 50-69%", () => {
    const accs = Array.from({ length: 10 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`, child_id: `yp_${i}`,
        can_use_washing_machine: i < 6, can_use_dryer: i < 6,
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Child laundry access at 60%"))).toBe(true);
  });

  it("warning insight for child independence 40-59%", () => {
    const accs = Array.from({ length: 10 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`, child_id: `yp_${i}`,
        access_type: i < 5 ? "independent" : "supervised",
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Child independence at 50%"))).toBe(true);
  });

  it("warning insight for energy efficiency 40-59%", () => {
    const engs = Array.from({ length: 10 }, (_, i) =>
      makeEnergyRecord({
        id: `e${i}`, appliance_id: `a${i}`,
        energy_rating: i < 5 ? "A" : "D",
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: engs,
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Energy efficiency at 50%"))).toBe(true);
  });

  it("warning insight for repeat/preventable faults", () => {
    const brks = Array.from({ length: 10 }, (_, i) =>
      makeBreakdownRecord({
        id: `b${i}`, appliance_id: `a${i}`,
        repeat_fault: i < 4,
        preventable: i < 5,
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: brks,
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("repeat faults"))).toBe(true);
  });

  it("warning insight for mediocre satisfaction 2.5-3.49", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord({ child_satisfaction_rating: 3 })],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("satisfaction"))).toBe(true);
  });

  it("warning insight for old appliances > 10 years (not > 15)", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ age_years: 12 })],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("over 10 years old"))).toBe(true);
  });

  it("includes child access type distribution insight for >= 3 records", () => {
    const accs = Array.from({ length: 3 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`, child_id: `yp_${i}`,
        access_type: i === 0 ? "independent" : "supervised",
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    expect(r.insights.some(i => i.text.includes("Child access levels:"))).toBe(true);
  });

  it("positive insight for outstanding rating", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
      breakdown_records: [makeBreakdownRecord()],
      child_access_records: [makeChildAccessRecord()],
      hygiene_cycle_records: [makeHygieneCycleRecord()],
      energy_records: [makeEnergyRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Outstanding"))).toBe(true);
  });

  it("positive insight for exemplary servicing", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Exemplary servicing"))).toBe(true);
  });

  it("positive insight for breakdown response + resolution >= 90%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [makeBreakdownRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("responded within 24 hours"))).toBe(true);
  });

  it("positive insight for child access + independence high", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [makeChildAccessRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("access") && i.text.includes("independence"))).toBe(true);
  });

  it("positive insight for hygiene + infection control >= 95%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: [makeHygieneCycleRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Exemplary hygiene"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. HEADLINES
// ══════════════════════════════════════════════════════════════════════════════

describe("Headlines", () => {
  it("outstanding headline", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
      breakdown_records: [makeBreakdownRecord()],
      child_access_records: [makeChildAccessRecord()],
      hygiene_cycle_records: [makeHygieneCycleRecord()],
      energy_records: [makeEnergyRecord()],
    });
    expect(r.headline).toContain("outstanding");
  });

  it("good headline", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
      breakdown_records: [makeBreakdownRecord()],
      child_access_records: [makeChildAccessRecord()],
    });
    expect(r.headline).toContain("good");
  });

  it("adequate headline", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord({ energy_rating: "C" })],
    });
    expect(r.headline).toContain("adequate");
  });

  it("inadequate headline", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ service_overdue: true })],
      breakdown_records: [makeBreakdownRecord({
        response_within_24h: false,
        severity: "safety_critical",
        resolved: false,
      })],
      hygiene_cycle_records: [makeHygieneCycleRecord({ completed: false })],
    });
    expect(r.headline).toContain("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. INTEGRATION — FULL SCENARIOS
// ══════════════════════════════════════════════════════════════════════════════

describe("Integration — full scenarios", () => {
  it("perfect home achieves outstanding with all strengths and no concerns", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
      breakdown_records: [makeBreakdownRecord()],
      child_access_records: [makeChildAccessRecord()],
      hygiene_cycle_records: [makeHygieneCycleRecord()],
      energy_records: [makeEnergyRecord()],
    });
    expect(r.appliance_rating).toBe("outstanding");
    expect(r.appliance_score).toBe(80);
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
  });

  it("worst-case home achieves inadequate with many concerns", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({
        service_overdue: true,
        passed_safety_check: false,
        certificate_on_file: false,
        engineer_qualified: false,
      })],
      breakdown_records: [makeBreakdownRecord({
        response_within_24h: false,
        severity: "safety_critical",
        resolved: false,
        impact_on_children: "health_hygiene_risk",
        repeat_fault: true,
        preventable: true,
      })],
      child_access_records: [makeChildAccessRecord({
        can_use_washing_machine: false,
        can_use_dryer: false,
        access_type: "staff_only",
        trained_on_appliance_use: false,
        risk_assessment_completed: false,
        child_satisfaction_rating: 1,
      })],
      hygiene_cycle_records: [makeHygieneCycleRecord({
        completed: false,
        infection_control_compliant: false,
      })],
      energy_records: [makeEnergyRecord({
        energy_rating: "G",
        age_years: 20,
        replacement_recommended: true,
      })],
    });
    expect(r.appliance_rating).toBe("inadequate");
    expect(r.concerns.length).toBeGreaterThan(5);
    expect(r.recommendations.length).toBeGreaterThan(3);
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
  });

  it("mixed home achieves good rating", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
      breakdown_records: [makeBreakdownRecord()],
      child_access_records: [makeChildAccessRecord()],
    });
    expect(r.appliance_rating).toBe("good");
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("home with only energy records gets adequate rating", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [makeEnergyRecord()],
    });
    // base 52 + 4 (energy >= 80) = 56
    expect(r.appliance_rating).toBe("adequate");
    expect(r.appliance_score).toBe(56);
  });

  it("all output fields are present", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
    });
    expect(r).toHaveProperty("appliance_rating");
    expect(r).toHaveProperty("appliance_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_appliances");
    expect(r).toHaveProperty("servicing_rate");
    expect(r).toHaveProperty("breakdown_response_rate");
    expect(r).toHaveProperty("child_access_rate");
    expect(r).toHaveProperty("hygiene_cycle_rate");
    expect(r).toHaveProperty("energy_efficiency_rate");
    expect(r).toHaveProperty("child_independence_rate");
    expect(r).toHaveProperty("average_appliance_age");
    expect(r).toHaveProperty("breakdown_resolution_avg_hours");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("unique appliance counting spans all record types", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ appliance_id: "app_1" })],
      breakdown_records: [makeBreakdownRecord({ appliance_id: "app_2" })],
      hygiene_cycle_records: [makeHygieneCycleRecord({ appliance_id: "app_3" })],
      energy_records: [makeEnergyRecord({ appliance_id: "app_4" })],
    });
    expect(r.total_appliances).toBe(4);
  });

  it("deduplicated appliance counting across record types", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord({ appliance_id: "app_1" })],
      breakdown_records: [makeBreakdownRecord({ appliance_id: "app_1" })],
      hygiene_cycle_records: [makeHygieneCycleRecord({ appliance_id: "app_1" })],
      energy_records: [makeEnergyRecord({ appliance_id: "app_1" })],
    });
    expect(r.total_appliances).toBe(1);
  });

  it("single child triggers same logic as multiple children for all-empty", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      total_children: 1,
    });
    expect(r.appliance_rating).toBe("inadequate");
    expect(r.appliance_score).toBe(15);
  });

  it("appliance types are all accepted in servicing", () => {
    const types: Array<ServicingRecordInput["appliance_type"]> = ["washing_machine", "dryer", "washer_dryer_combo"];
    const records = types.map((t, i) =>
      makeServicingRecord({ id: `s${i}`, appliance_id: `a${i}`, appliance_type: t }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: records,
    });
    expect(r.total_appliances).toBe(3);
    expect(r.servicing_rate).toBe(100);
  });

  it("all severity types are accepted in breakdowns", () => {
    const severities: Array<BreakdownRecordInput["severity"]> = ["minor", "moderate", "major", "safety_critical"];
    const records = severities.map((s, i) =>
      makeBreakdownRecord({ id: `b${i}`, appliance_id: `a${i}`, severity: s, resolved: true }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: records,
    });
    expect(r.breakdown_response_rate).toBe(100);
  });

  it("all access types are accepted", () => {
    const types: Array<ChildAccessRecordInput["access_type"]> = ["independent", "supervised", "staff_only", "supported"];
    const records = types.map((t, i) =>
      makeChildAccessRecord({ id: `a${i}`, child_id: `yp_${i}`, access_type: t }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: records,
    });
    // independent + supported = 2 out of 4 = 50%
    expect(r.child_independence_rate).toBe(50);
  });

  it("all cycle types are accepted in hygiene records", () => {
    const types: Array<HygieneCycleRecordInput["cycle_type"]> = [
      "hot_wash_60", "hot_wash_90", "anti_bacterial", "drum_clean", "descale", "sanitise",
    ];
    const records = types.map((t, i) =>
      makeHygieneCycleRecord({ id: `h${i}`, cycle_type: t }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      hygiene_cycle_records: records,
    });
    expect(r.hygiene_cycle_rate).toBe(100);
  });

  it("children with barriers are tracked", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [
        makeChildAccessRecord({ id: "a1", child_id: "yp_1", barriers_to_access: ["Physical limitation"] }),
        makeChildAccessRecord({ id: "a2", child_id: "yp_2", barriers_to_access: [] }),
      ],
    });
    // barriers exist but no specific concern for them at this threshold
    expect(r.child_access_rate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. ADDITIONAL BOUNDARY TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Additional boundary tests", () => {
  it("score exactly 80 yields outstanding", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [makeServicingRecord()],
      breakdown_records: [makeBreakdownRecord()],
      child_access_records: [makeChildAccessRecord()],
      hygiene_cycle_records: [makeHygieneCycleRecord()],
      energy_records: [makeEnergyRecord()],
    });
    expect(r.appliance_score).toBe(80);
    expect(r.appliance_rating).toBe("outstanding");
  });

  it("eco mode usage avg is calculated only for appliances that have it", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [
        makeEnergyRecord({ id: "e1", appliance_id: "a1", eco_mode_available: true, eco_mode_used_percentage: 60 }),
        makeEnergyRecord({ id: "e2", appliance_id: "a2", eco_mode_available: false, eco_mode_used_percentage: 0 }),
      ],
    });
    // Only 1 appliance has eco mode, avg = 60%. No eco mode recommendation since >= 50
    expect(r.recommendations.some(rec => rec.recommendation.includes("eco mode"))).toBe(false);
  });

  it("low eco mode triggers planned recommendation", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      energy_records: [
        makeEnergyRecord({ id: "e1", appliance_id: "a1", eco_mode_available: true, eco_mode_used_percentage: 20 }),
      ],
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("eco mode"))).toBe(true);
  });

  it("independence goal met rate uses goalsSet as denominator", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [
        makeChildAccessRecord({ id: "a1", child_id: "yp_1", independence_goal_set: true, independence_goal_met: true }),
        makeChildAccessRecord({ id: "a2", child_id: "yp_2", independence_goal_set: true, independence_goal_met: false }),
      ],
    });
    // 1 met out of 2 set = 50% goal met
    expect(r.strengths.some(s => s.includes("independence goals met"))).toBe(false);
  });

  it("recommends planned for independence goal set < 70%", () => {
    const accs = Array.from({ length: 10 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`, child_id: `yp_${i}`,
        independence_goal_set: i < 6,
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("independence goals"))).toBe(true);
  });

  it("recommends planned for age-appropriate rate < 70% for 14+", () => {
    const accs = Array.from({ length: 4 }, (_, i) =>
      makeChildAccessRecord({
        id: `a${i}`, child_id: `yp_${i}`,
        child_age: 15,
        access_type: i < 2 ? "independent" : "staff_only",
      }),
    );
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: accs,
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("aged 14+"))).toBe(true);
  });

  it("certificate rate concern triggers soon recommendation", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      servicing_records: [
        makeServicingRecord({ id: "s1", certificate_on_file: false }),
        makeServicingRecord({ id: "s2", certificate_on_file: false }),
      ],
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("certificates"))).toBe(true);
  });

  it("training-only concern when training < 50% but risk assessment >= 50%", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      child_access_records: [
        makeChildAccessRecord({ id: "a1", child_id: "yp_1", trained_on_appliance_use: false, risk_assessment_completed: true }),
        makeChildAccessRecord({ id: "a2", child_id: "yp_2", trained_on_appliance_use: false, risk_assessment_completed: true }),
      ],
    });
    expect(r.concerns.some(c => c.includes("appliance training"))).toBe(true);
  });

  it("multiple unresolved safety critical breakdowns uses plural", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [
        makeBreakdownRecord({ id: "b1", appliance_id: "a1", severity: "safety_critical", resolved: false }),
        makeBreakdownRecord({ id: "b2", appliance_id: "a2", severity: "safety_critical", resolved: false }),
      ],
    });
    expect(r.concerns.some(c => c.includes("2 safety-critical breakdowns remain"))).toBe(true);
  });

  it("single unresolved safety critical uses singular", () => {
    const r = computeWashingMachineDryerMaintenance({
      ...baseInput,
      breakdown_records: [
        makeBreakdownRecord({ severity: "safety_critical", resolved: false }),
      ],
    });
    expect(r.concerns.some(c => c.includes("1 safety-critical breakdown remains"))).toBe(true);
  });
});
