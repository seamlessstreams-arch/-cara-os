// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME UTILITY BILLS & COST MANAGEMENT INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration (180 tests)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeUtilityBillsCostManagement,
  type UtilityBillRecordInput,
  type EnergyEfficiencyRecordInput,
  type BillPaymentRecordInput,
  type UtilityBudgetRecordInput,
  type SustainabilityRecordInput,
  type UtilityBillsCostManagementInput,
} from "../home-utility-bills-cost-management-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

function makeBillRecord(overrides: Partial<UtilityBillRecordInput> = {}): UtilityBillRecordInput {
  return {
    id: "bill_test",
    utility_type: "electricity",
    provider: "British Gas",
    billing_period_start: "2026-01-01",
    billing_period_end: "2026-01-31",
    amount_gbp: 150,
    previous_period_amount_gbp: 140,
    meter_reading_taken: true,
    meter_reading_date: "2026-01-31",
    usage_units: 500,
    usage_unit_type: "kWh",
    cost_per_unit: 0.28,
    standing_charge_gbp: 10,
    tariff_reviewed: true,
    best_deal_confirmed: true,
    variance_from_budget_pct: 5,
    reviewed_by: "staff_test",
    review_date: "2026-02-01",
    notes: null,
    created_at: "2026-02-01",
    ...overrides,
  };
}

function makeEfficiencyRecord(overrides: Partial<EnergyEfficiencyRecordInput> = {}): EnergyEfficiencyRecordInput {
  return {
    id: "eff_test",
    assessment_date: "2026-01-15",
    area_assessed: "Main building",
    insulation_adequate: true,
    draught_proofing_ok: true,
    heating_system_efficient: true,
    lighting_efficient: true,
    appliances_energy_rated: true,
    thermostat_programmed: true,
    windows_double_glazed: true,
    energy_certificate_current: true,
    efficiency_score: 5,
    improvements_identified: [],
    improvements_completed: false,
    completion_date: null,
    estimated_annual_saving_gbp: null,
    assessed_by: "staff_test",
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makePaymentRecord(overrides: Partial<BillPaymentRecordInput> = {}): BillPaymentRecordInput {
  return {
    id: "pay_test",
    utility_type: "electricity",
    provider: "British Gas",
    invoice_date: "2026-01-15",
    due_date: "2026-02-01",
    payment_date: "2026-01-28",
    amount_gbp: 150,
    paid_on_time: true,
    payment_method: "direct_debit",
    late_payment_fee_gbp: null,
    dispute_raised: false,
    dispute_resolved: false,
    dispute_resolution_date: null,
    approved_by: "staff_test",
    created_at: "2026-01-28",
    ...overrides,
  };
}

function makeBudgetRecord(overrides: Partial<UtilityBudgetRecordInput> = {}): UtilityBudgetRecordInput {
  return {
    id: "bud_test",
    financial_year: "2025-2026",
    quarter: "Q1",
    utility_type: "electricity",
    budgeted_amount_gbp: 500,
    actual_amount_gbp: 480,
    variance_gbp: -20,
    variance_pct: -4,
    within_budget: true,
    overspend_reason: null,
    corrective_action_taken: null,
    corrective_action_effective: false,
    reviewed_by: "staff_test",
    review_date: "2026-04-01",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeSustainabilityRecord(overrides: Partial<SustainabilityRecordInput> = {}): SustainabilityRecordInput {
  return {
    id: "sus_test",
    initiative_date: "2026-03-01",
    initiative_type: "recycling",
    description: "Home recycling programme",
    children_involved: true,
    children_awareness_activity: true,
    staff_trained: true,
    measurable_impact: true,
    impact_description: "Waste reduced by 30%",
    estimated_saving_gbp: 100,
    ongoing: true,
    review_date: "2026-06-01",
    reviewed: true,
    created_at: "2026-03-01",
    ...overrides,
  };
}

const baseInput: UtilityBillsCostManagementInput = {
  today: "2026-06-01",
  total_children: 3,
  cost_monitoring_records: [],
  energy_efficiency_records: [],
  bill_payment_records: [],
  budget_records: [],
  sustainability_records: [],
};

// ══════════════════════════════════════════════════════════════════════════════
// 1. EMPTY / EDGE-CASE SCENARIOS
// ══════════════════════════════════════════════════════════════════════════════

describe("Empty / edge-case scenarios", () => {
  it("returns insufficient_data when all arrays empty and 0 children", () => {
    const r = computeUtilityBillsCostManagement({ ...baseInput, total_children: 0 });
    expect(r.utility_rating).toBe("insufficient_data");
    expect(r.utility_score).toBe(0);
  });

  it("returns correct headline for insufficient_data", () => {
    const r = computeUtilityBillsCostManagement({ ...baseInput, total_children: 0 });
    expect(r.headline).toContain("insufficient data");
  });

  it("returns zero for all rates when insufficient_data", () => {
    const r = computeUtilityBillsCostManagement({ ...baseInput, total_children: 0 });
    expect(r.cost_monitoring_rate).toBeNull();
    expect(r.energy_efficiency_rate).toBeNull();
    expect(r.bill_payment_rate).toBeNull();
    expect(r.budget_adherence_rate).toBeNull();
    expect(r.sustainability_rate).toBeNull();
    expect(r.child_awareness_rate).toBeNull();
  });

  it("returns empty arrays for strengths/concerns/recommendations/insights when insufficient_data", () => {
    const r = computeUtilityBillsCostManagement({ ...baseInput, total_children: 0 });
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("returns inadequate with score 15 when all empty + children > 0", () => {
    const r = computeUtilityBillsCostManagement({ ...baseInput, total_children: 3 });
    expect(r.utility_rating).toBe("inadequate");
    expect(r.utility_score).toBe(15);
  });

  it("returns concerns when all empty + children > 0", () => {
    const r = computeUtilityBillsCostManagement({ ...baseInput, total_children: 3 });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No utility bill records");
  });

  it("returns 2 recommendations when all empty + children > 0", () => {
    const r = computeUtilityBillsCostManagement({ ...baseInput, total_children: 3 });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("returns 1 critical insight when all empty + children > 0", () => {
    const r = computeUtilityBillsCostManagement({ ...baseInput, total_children: 3 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("returns total_bill_records 0 when all empty", () => {
    const r = computeUtilityBillsCostManagement({ ...baseInput, total_children: 3 });
    expect(r.total_bill_records).toBe(0);
    expect(r.total_payment_records).toBe(0);
  });

  it("returns headline mentioning urgent attention when all empty + children > 0", () => {
    const r = computeUtilityBillsCostManagement({ ...baseInput, total_children: 3 });
    expect(r.headline).toContain("urgent attention");
  });

  it("returns inadequate headline for all empty + children = 1", () => {
    const r = computeUtilityBillsCostManagement({ ...baseInput, total_children: 1 });
    expect(r.utility_rating).toBe("inadequate");
    expect(r.utility_score).toBe(15);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. COST MONITORING RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Cost monitoring rate", () => {
  it("achieves 100% when all 4 checks pass on every record", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.cost_monitoring_rate).toBe(100);
  });

  it("achieves 75% when 3 of 4 checks pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({ meter_reading_taken: false })],
    });
    expect(r.cost_monitoring_rate).toBe(75);
  });

  it("achieves 50% when 2 of 4 checks pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({ meter_reading_taken: false, tariff_reviewed: false })],
    });
    expect(r.cost_monitoring_rate).toBe(50);
  });

  it("achieves 25% when 1 of 4 checks pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({ meter_reading_taken: false, tariff_reviewed: false, best_deal_confirmed: false })],
    });
    expect(r.cost_monitoring_rate).toBe(25);
  });

  it("achieves 0% when no checks pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false,
        tariff_reviewed: false,
        best_deal_confirmed: false,
        review_date: null,
      })],
    });
    expect(r.cost_monitoring_rate).toBe(0);
  });

  it("correctly counts total_bill_records", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [
        makeBillRecord({ id: "b1" }),
        makeBillRecord({ id: "b2" }),
        makeBillRecord({ id: "b3" }),
      ],
    });
    expect(r.total_bill_records).toBe(3);
  });

  it("treats empty review_date as not reviewed", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({ review_date: "" })],
    });
    expect(r.cost_monitoring_rate).toBe(75);
  });

  it("handles mixed records correctly", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [
        makeBillRecord({ id: "b1" }),
        makeBillRecord({ id: "b2", meter_reading_taken: false, tariff_reviewed: false, best_deal_confirmed: false, review_date: null }),
      ],
    });
    // 4 pass + 0 pass = 4 out of 8
    expect(r.cost_monitoring_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. ENERGY EFFICIENCY RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Energy efficiency rate", () => {
  it("achieves 100% when all 8 checks pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord()],
    });
    expect(r.energy_efficiency_rate).toBe(100);
  });

  it("achieves 0% when no checks pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false,
        draught_proofing_ok: false,
        heating_system_efficient: false,
        lighting_efficient: false,
        appliances_energy_rated: false,
        thermostat_programmed: false,
        windows_double_glazed: false,
        energy_certificate_current: false,
      })],
    });
    expect(r.energy_efficiency_rate).toBe(0);
  });

  it("achieves 50% when 4 of 8 checks pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false,
        draught_proofing_ok: false,
        heating_system_efficient: false,
        lighting_efficient: false,
      })],
    });
    expect(r.energy_efficiency_rate).toBe(50);
  });

  it("handles multiple records averaging correctly", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [
        makeEfficiencyRecord({ id: "e1" }), // 8/8
        makeEfficiencyRecord({
          id: "e2",
          insulation_adequate: false,
          draught_proofing_ok: false,
          heating_system_efficient: false,
          lighting_efficient: false,
          appliances_energy_rated: false,
          thermostat_programmed: false,
          windows_double_glazed: false,
          energy_certificate_current: false,
        }), // 0/8
      ],
    });
    // 8 out of 16
    expect(r.energy_efficiency_rate).toBe(50);
  });

  it("counts 75% when 6 of 8 pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false,
        draught_proofing_ok: false,
      })],
    });
    expect(r.energy_efficiency_rate).toBe(75);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. BILL PAYMENT RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Bill payment rate", () => {
  it("achieves 100% when all paid on time", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord(), makePaymentRecord({ id: "p2" })],
    });
    expect(r.bill_payment_rate).toBe(100);
  });

  it("achieves 0% when none paid on time", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord({ paid_on_time: false })],
    });
    expect(r.bill_payment_rate).toBe(0);
  });

  it("achieves 50% when half paid on time", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [
        makePaymentRecord({ id: "p1" }),
        makePaymentRecord({ id: "p2", paid_on_time: false }),
      ],
    });
    expect(r.bill_payment_rate).toBe(50);
  });

  it("correctly counts total_payment_records", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [
        makePaymentRecord({ id: "p1" }),
        makePaymentRecord({ id: "p2" }),
        makePaymentRecord({ id: "p3" }),
      ],
    });
    expect(r.total_payment_records).toBe(3);
  });

  it("calculates direct debit rate correctly (used in strengths)", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [
        makePaymentRecord({ id: "p1", payment_method: "direct_debit" }),
        makePaymentRecord({ id: "p2", payment_method: "bank_transfer" }),
      ],
    });
    // 50% direct debit, no strength for it
    expect(r.strengths.some(s => s.includes("direct debit"))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. BUDGET ADHERENCE RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Budget adherence rate", () => {
  it("achieves 100% when all within budget", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [makeBudgetRecord(), makeBudgetRecord({ id: "b2" })],
    });
    expect(r.budget_adherence_rate).toBe(100);
  });

  it("achieves 0% when none within budget", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [makeBudgetRecord({ within_budget: false })],
    });
    expect(r.budget_adherence_rate).toBe(0);
  });

  it("achieves 50% when half within budget", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [
        makeBudgetRecord({ id: "b1" }),
        makeBudgetRecord({ id: "b2", within_budget: false }),
      ],
    });
    expect(r.budget_adherence_rate).toBe(50);
  });

  it("tracks corrective action rate on overspends", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [
        makeBudgetRecord({ id: "b1", within_budget: false, corrective_action_taken: null }),
        makeBudgetRecord({ id: "b2", within_budget: false, corrective_action_taken: null }),
        makeBudgetRecord({ id: "b3", within_budget: false, corrective_action_taken: null }),
      ],
    });
    // 0% corrective action rate → concern
    expect(r.concerns.some(c => c.includes("corrective action"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. SUSTAINABILITY RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Sustainability rate", () => {
  it("achieves 100% when all 5 indicators pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.sustainability_rate).toBe(100);
  });

  it("achieves 0% when no indicators pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false,
        children_awareness_activity: false,
        staff_trained: false,
        measurable_impact: false,
        reviewed: false,
      })],
    });
    expect(r.sustainability_rate).toBe(0);
  });

  it("achieves 60% when 3 of 5 pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false,
        children_awareness_activity: false,
      })],
    });
    expect(r.sustainability_rate).toBe(60);
  });

  it("achieves 40% when 2 of 5 pass", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false,
        children_awareness_activity: false,
        staff_trained: false,
      })],
    });
    expect(r.sustainability_rate).toBe(40);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. CHILD AWARENESS RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Child awareness rate", () => {
  it("achieves 100% when all have awareness activities", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.child_awareness_rate).toBe(100);
  });

  it("achieves 0% when none have awareness activities", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({ children_awareness_activity: false })],
    });
    expect(r.child_awareness_rate).toBe(0);
  });

  it("achieves 50% when half have awareness activities", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [
        makeSustainabilityRecord({ id: "s1" }),
        makeSustainabilityRecord({ id: "s2", children_awareness_activity: false }),
      ],
    });
    expect(r.child_awareness_rate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. SCORING — BONUSES
// ══════════════════════════════════════════════════════════════════════════════

describe("Scoring — bonuses", () => {
  it("starts at base 52 with minimal non-empty records", () => {
    // 1 sustainability record with nothing passing → sustainability_rate 0, no bonus/penalty
    // but costMonitoring, energy, billPayment, budget are 0 with 0 records so no penalty
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false,
        children_awareness_activity: false,
        staff_trained: false,
        measurable_impact: false,
        reviewed: false,
      })],
    });
    // base 52, sustainabilityRate 0% (<40 but we check concern not penalty), no penalty for sustainability in the score
    // score should be 52
    expect(r.utility_score).toBe(52);
  });

  it("awards +5 for costMonitoringRate >= 90", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    // base 52 + 5 = 57
    expect(r.utility_score).toBeGreaterThanOrEqual(57);
  });

  it("awards +3 for costMonitoringRate 70-89", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({ meter_reading_taken: false })],
    });
    // 75% → +3 → base 52 + 3 = 55
    expect(r.utility_score).toBeGreaterThanOrEqual(55);
  });

  it("awards +5 for energyEfficiencyRate >= 90", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord()],
    });
    expect(r.utility_score).toBeGreaterThanOrEqual(57);
  });

  it("awards +3 for energyEfficiencyRate 70-89", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false,
        draught_proofing_ok: false,
      })],
    });
    // 75% → +3
    expect(r.utility_score).toBeGreaterThanOrEqual(55);
  });

  it("awards +5 for billPaymentRate >= 95", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord()],
    });
    // 100% → +5
    expect(r.utility_score).toBeGreaterThanOrEqual(57);
  });

  it("awards +3 for billPaymentRate 80-94", () => {
    const bills = Array.from({ length: 10 }, (_, i) =>
      makePaymentRecord({ id: `p${i}`, paid_on_time: i < 9 }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: bills,
    });
    // 90% → +3
    expect(r.utility_score).toBeGreaterThanOrEqual(55);
  });

  it("awards +5 for budgetAdherenceRate >= 90", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [makeBudgetRecord()],
    });
    // 100% → +5
    expect(r.utility_score).toBeGreaterThanOrEqual(57);
  });

  it("awards +3 for budgetAdherenceRate 70-89", () => {
    const budgets = Array.from({ length: 10 }, (_, i) =>
      makeBudgetRecord({ id: `b${i}`, within_budget: i < 8 }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: budgets,
    });
    // 80% → +3
    expect(r.utility_score).toBeGreaterThanOrEqual(55);
  });

  it("awards +4 for sustainabilityRate >= 80", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    // 100% → +4
    expect(r.utility_score).toBeGreaterThanOrEqual(56);
  });

  it("awards +2 for sustainabilityRate 60-79", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false,
        children_awareness_activity: false,
      })],
    });
    // 60% → +2
    expect(r.utility_score).toBeGreaterThanOrEqual(54);
  });

  it("awards +4 for childAwarenessRate >= 80", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    // 100% → +4
    expect(r.utility_score).toBeGreaterThanOrEqual(56);
  });

  it("awards +2 for childAwarenessRate 50-79", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [
        makeSustainabilityRecord({ id: "s1" }),
        makeSustainabilityRecord({ id: "s2", children_awareness_activity: false }),
      ],
    });
    // 50% awareness → +2
    expect(r.utility_score).toBeGreaterThanOrEqual(54);
  });

  it("achieves maximum score 80 with all bonuses", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      bill_payment_records: [makePaymentRecord()],
      budget_records: [makeBudgetRecord()],
      sustainability_records: [makeSustainabilityRecord()],
    });
    // base 52 + 5 + 5 + 5 + 5 + 4 + 4 = 80
    expect(r.utility_score).toBe(80);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. SCORING — PENALTIES
// ══════════════════════════════════════════════════════════════════════════════

describe("Scoring — penalties", () => {
  it("penalises -5 for billPaymentRate < 60", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [
        makePaymentRecord({ id: "p1", paid_on_time: false }),
        makePaymentRecord({ id: "p2", paid_on_time: false }),
      ],
    });
    // billPaymentRate 0% → -5, base 52 - 5 = 47
    expect(r.utility_score).toBe(47);
  });

  it("penalises -5 for budgetAdherenceRate < 40", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [
        makeBudgetRecord({ id: "b1", within_budget: false }),
        makeBudgetRecord({ id: "b2", within_budget: false }),
      ],
    });
    // 0% → -5
    expect(r.utility_score).toBe(47);
  });

  it("penalises -4 for costMonitoringRate < 40", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false,
        tariff_reviewed: false,
        best_deal_confirmed: false,
        review_date: null,
      })],
    });
    // 0% → -4
    expect(r.utility_score).toBe(48);
  });

  it("penalises -4 for energyEfficiencyRate < 40", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false,
        draught_proofing_ok: false,
        heating_system_efficient: false,
        lighting_efficient: false,
        appliances_energy_rated: false,
        thermostat_programmed: false,
        windows_double_glazed: false,
        energy_certificate_current: false,
        efficiency_score: 1,
      })],
    });
    // 0% → -4
    expect(r.utility_score).toBe(48);
  });

  it("stacks all penalties for combined worst case", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
      })],
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
        appliances_energy_rated: false, thermostat_programmed: false,
        windows_double_glazed: false, energy_certificate_current: false,
        efficiency_score: 1,
      })],
      bill_payment_records: [makePaymentRecord({ paid_on_time: false })],
      budget_records: [makeBudgetRecord({ within_budget: false })],
    });
    // base 52 - 5 - 5 - 4 - 4 = 34
    expect(r.utility_score).toBe(34);
  });

  it("does not penalise billPaymentRate < 60 when 0 payment records", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    // No payment records, no penalty applied
    expect(r.utility_score).toBeGreaterThanOrEqual(52);
  });

  it("does not penalise budget when 0 budget records", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.utility_score).toBeGreaterThanOrEqual(52);
  });

  it("score is clamped to minimum 0", () => {
    // Even stacking all penalties, score should never go below 0
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
      })],
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
        appliances_energy_rated: false, thermostat_programmed: false,
        windows_double_glazed: false, energy_certificate_current: false,
        efficiency_score: 1,
      })],
      bill_payment_records: [makePaymentRecord({ paid_on_time: false })],
      budget_records: [makeBudgetRecord({ within_budget: false })],
    });
    expect(r.utility_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped to maximum 100", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      bill_payment_records: [makePaymentRecord()],
      budget_records: [makeBudgetRecord()],
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.utility_score).toBeLessThanOrEqual(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. RATING THRESHOLDS
// ══════════════════════════════════════════════════════════════════════════════

describe("Rating thresholds", () => {
  it("returns outstanding for score >= 80", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      bill_payment_records: [makePaymentRecord()],
      budget_records: [makeBudgetRecord()],
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.utility_rating).toBe("outstanding");
    expect(r.utility_score).toBe(80);
  });

  it("returns good for score 65-79", () => {
    // base 52 + 5 (cost) + 5 (efficiency) + 5 (payment) = 67
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.utility_rating).toBe("good");
    expect(r.utility_score).toBe(67);
  });

  it("returns adequate for score 45-64", () => {
    // base 52 alone
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false,
        children_awareness_activity: false,
        staff_trained: false,
        measurable_impact: false,
        reviewed: false,
      })],
    });
    expect(r.utility_rating).toBe("adequate");
    expect(r.utility_score).toBe(52);
  });

  it("returns inadequate for score < 45", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
      })],
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
        appliances_energy_rated: false, thermostat_programmed: false,
        windows_double_glazed: false, energy_certificate_current: false,
        efficiency_score: 1,
      })],
      bill_payment_records: [makePaymentRecord({ paid_on_time: false })],
      budget_records: [makeBudgetRecord({ within_budget: false })],
    });
    // 52 - 5 - 5 - 4 - 4 = 34
    expect(r.utility_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("includes cost monitoring strength at >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.strengths.some(s => s.includes("100% cost monitoring compliance"))).toBe(true);
  });

  it("includes cost monitoring strength at 70-89%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({ meter_reading_taken: false })],
    });
    expect(r.strengths.some(s => s.includes("75% cost monitoring compliance"))).toBe(true);
  });

  it("includes energy efficiency strength at >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord()],
    });
    expect(r.strengths.some(s => s.includes("100% energy efficiency compliance"))).toBe(true);
  });

  it("includes energy efficiency strength at 70-89%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false,
        draught_proofing_ok: false,
      })],
    });
    expect(r.strengths.some(s => s.includes("75% energy efficiency compliance"))).toBe(true);
  });

  it("includes bill payment strength at >= 95%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.strengths.some(s => s.includes("100% bill payment timeliness"))).toBe(true);
  });

  it("includes bill payment strength at 80-94%", () => {
    const bills = Array.from({ length: 10 }, (_, i) =>
      makePaymentRecord({ id: `p${i}`, paid_on_time: i < 9 }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: bills,
    });
    expect(r.strengths.some(s => s.includes("90% bill payment timeliness"))).toBe(true);
  });

  it("includes budget adherence strength at >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [makeBudgetRecord()],
    });
    expect(r.strengths.some(s => s.includes("100% budget adherence"))).toBe(true);
  });

  it("includes budget adherence strength at 70-89%", () => {
    const budgets = Array.from({ length: 10 }, (_, i) =>
      makeBudgetRecord({ id: `b${i}`, within_budget: i < 8 }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: budgets,
    });
    expect(r.strengths.some(s => s.includes("80% budget adherence"))).toBe(true);
  });

  it("includes sustainability strength at >= 80%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.strengths.some(s => s.includes("sustainability programme quality"))).toBe(true);
  });

  it("includes sustainability strength at 60-79%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false,
        children_awareness_activity: false,
      })],
    });
    expect(r.strengths.some(s => s.includes("60% sustainability programme quality"))).toBe(true);
  });

  it("includes child awareness strength at >= 80%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.strengths.some(s => s.includes("100% child awareness engagement"))).toBe(true);
  });

  it("includes child awareness strength at 50-79%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [
        makeSustainabilityRecord({ id: "s1" }),
        makeSustainabilityRecord({ id: "s2", children_awareness_activity: false }),
      ],
    });
    expect(r.strengths.some(s => s.includes("50% child awareness engagement"))).toBe(true);
  });

  it("includes direct debit strength at >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.strengths.some(s => s.includes("direct debit"))).toBe(true);
  });

  it("includes best deal strength at >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.strengths.some(s => s.includes("best available deal"))).toBe(true);
  });

  it("includes improvement completion strength at >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        improvements_identified: ["Fix draft"],
        improvements_completed: true,
      })],
    });
    expect(r.strengths.some(s => s.includes("improvement"))).toBe(true);
  });

  it("includes dispute resolution strength at >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord({
        dispute_raised: true,
        dispute_resolved: true,
      })],
    });
    expect(r.strengths.some(s => s.includes("disputes resolved"))).toBe(true);
  });

  it("includes staff training strength at >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.strengths.some(s => s.includes("staff training rate"))).toBe(true);
  });

  it("includes measurable impact strength at >= 80%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.strengths.some(s => s.includes("measurable impact"))).toBe(true);
  });

  it("includes meter reading strength at >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.strengths.some(s => s.includes("meter reading compliance"))).toBe(true);
  });

  it("includes corrective action strength at >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [
        makeBudgetRecord({
          id: "b1",
          within_budget: false,
          corrective_action_taken: "Reduced usage",
          corrective_action_effective: true,
        }),
      ],
    });
    expect(r.strengths.some(s => s.includes("corrective action taken"))).toBe(true);
  });

  it("includes avg efficiency score strength >= 4.0", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({ efficiency_score: 5 })],
    });
    expect(r.strengths.some(s => s.includes("Average energy efficiency score"))).toBe(true);
  });

  it("includes avg efficiency score strength 3.5-3.99", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [
        makeEfficiencyRecord({ id: "e1", efficiency_score: 4 }),
        makeEfficiencyRecord({ id: "e2", efficiency_score: 3 }),
      ],
    });
    // avg = 3.5
    expect(r.strengths.some(s => s.includes("3.5/5"))).toBe(true);
  });

  it("includes child involvement strength >= 80%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.strengths.some(s => s.includes("child involvement"))).toBe(true);
  });

  it("includes zero late fees strength", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.strengths.some(s => s.includes("Zero late payment fees"))).toBe(true);
  });

  it("does not include cost monitoring strength below 70%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
      })],
    });
    expect(r.strengths.some(s => s.includes("cost monitoring compliance"))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("Concerns", () => {
  it("raises critical cost monitoring concern < 40%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
      })],
    });
    expect(r.concerns.some(c => c.includes("0% cost monitoring compliance"))).toBe(true);
  });

  it("raises moderate cost monitoring concern 40-69%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
      })],
    });
    // 50%
    expect(r.concerns.some(c => c.includes("Cost monitoring compliance at 50%"))).toBe(true);
  });

  it("raises critical energy efficiency concern < 40%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
        appliances_energy_rated: false, thermostat_programmed: false,
        windows_double_glazed: false, energy_certificate_current: false,
        efficiency_score: 1,
      })],
    });
    expect(r.concerns.some(c => c.includes("0% energy efficiency compliance"))).toBe(true);
  });

  it("raises moderate energy efficiency concern 40-69%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
      })],
    });
    // 50%
    expect(r.concerns.some(c => c.includes("Energy efficiency compliance at 50%"))).toBe(true);
  });

  it("raises critical bill payment concern < 60%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord({ paid_on_time: false })],
    });
    expect(r.concerns.some(c => c.includes("0% bill payment timeliness"))).toBe(true);
  });

  it("raises moderate bill payment concern 60-79%", () => {
    const bills = Array.from({ length: 10 }, (_, i) =>
      makePaymentRecord({ id: `p${i}`, paid_on_time: i < 7 }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: bills,
    });
    expect(r.concerns.some(c => c.includes("Bill payment timeliness at 70%"))).toBe(true);
  });

  it("raises critical budget adherence concern < 40%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [makeBudgetRecord({ within_budget: false })],
    });
    expect(r.concerns.some(c => c.includes("0% budget adherence"))).toBe(true);
  });

  it("raises moderate budget adherence concern 40-69%", () => {
    const budgets = Array.from({ length: 10 }, (_, i) =>
      makeBudgetRecord({ id: `b${i}`, within_budget: i < 5 }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: budgets,
    });
    expect(r.concerns.some(c => c.includes("Budget adherence at 50%"))).toBe(true);
  });

  it("raises critical sustainability concern < 40%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false, children_awareness_activity: false,
        staff_trained: false, measurable_impact: false, reviewed: false,
      })],
    });
    expect(r.concerns.some(c => c.includes("0% sustainability programme quality"))).toBe(true);
  });

  it("raises moderate sustainability concern 40-59%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false, children_awareness_activity: false,
        staff_trained: false,
      })],
    });
    // 40%
    expect(r.concerns.some(c => c.includes("Sustainability programme quality at 40%"))).toBe(true);
  });

  it("raises critical child awareness concern < 30%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [
        makeSustainabilityRecord({ id: "s1", children_awareness_activity: false }),
        makeSustainabilityRecord({ id: "s2", children_awareness_activity: false }),
        makeSustainabilityRecord({ id: "s3", children_awareness_activity: false }),
        makeSustainabilityRecord({ id: "s4", children_awareness_activity: false }),
      ],
    });
    // 0% awareness
    expect(r.concerns.some(c => c.includes("0% child awareness engagement"))).toBe(true);
  });

  it("raises moderate child awareness concern 30-49%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [
        makeSustainabilityRecord({ id: "s1" }),
        makeSustainabilityRecord({ id: "s2", children_awareness_activity: false }),
        makeSustainabilityRecord({ id: "s3", children_awareness_activity: false }),
      ],
    });
    // 33% awareness
    expect(r.concerns.some(c => c.includes("Child awareness engagement at 33%"))).toBe(true);
  });

  it("raises late fees concern when total > 0", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord({ paid_on_time: false, late_payment_fee_gbp: 25 })],
    });
    expect(r.concerns.some(c => c.includes("late payment fees"))).toBe(true);
  });

  it("raises significant cost increase concern > 50%", () => {
    const bills = Array.from({ length: 4 }, (_, i) =>
      makeBillRecord({
        id: `b${i}`,
        amount_gbp: 200,
        previous_period_amount_gbp: 100,
      }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: bills,
    });
    expect(r.concerns.some(c => c.includes("significant cost increases"))).toBe(true);
  });

  it("raises improvement completion concern < 50%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [
        makeEfficiencyRecord({ id: "e1", improvements_identified: ["A"], improvements_completed: false }),
        makeEfficiencyRecord({ id: "e2", improvements_identified: ["B"], improvements_completed: false }),
      ],
    });
    expect(r.concerns.some(c => c.includes("improvements completed"))).toBe(true);
  });

  it("raises corrective action concern < 50%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [
        makeBudgetRecord({ id: "b1", within_budget: false, corrective_action_taken: null }),
        makeBudgetRecord({ id: "b2", within_budget: false, corrective_action_taken: null }),
      ],
    });
    expect(r.concerns.some(c => c.includes("corrective action"))).toBe(true);
  });

  it("raises meter reading concern < 50%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [
        makeBillRecord({ id: "b1", meter_reading_taken: false }),
        makeBillRecord({ id: "b2", meter_reading_taken: false }),
        makeBillRecord({ id: "b3", meter_reading_taken: false }),
      ],
    });
    expect(r.concerns.some(c => c.includes("meter reading rate"))).toBe(true);
  });

  it("raises no-bill-records concern when 0 bill records but not allEmpty", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.concerns.some(c => c.includes("No utility bill monitoring records"))).toBe(true);
  });

  it("raises no-budget-records concern when 0 budget records but not allEmpty", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.concerns.some(c => c.includes("No utility budget records"))).toBe(true);
  });

  it("raises no-payment-records concern when 0 payment records but not allEmpty", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.concerns.some(c => c.includes("No bill payment records"))).toBe(true);
  });

  it("raises certificate rate concern < 50%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [
        makeEfficiencyRecord({ id: "e1", energy_certificate_current: false }),
        makeEfficiencyRecord({ id: "e2", energy_certificate_current: false }),
        makeEfficiencyRecord({ id: "e3", energy_certificate_current: false }),
      ],
    });
    expect(r.concerns.some(c => c.includes("energy certificates"))).toBe(true);
  });

  it("raises low avg efficiency score concern < 2.5", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        efficiency_score: 2,
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
        appliances_energy_rated: false, thermostat_programmed: false,
        windows_double_glazed: false, energy_certificate_current: false,
      })],
    });
    expect(r.concerns.some(c => c.includes("2/5"))).toBe(true);
  });

  it("raises moderate avg efficiency score concern 2.5-2.99", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [
        makeEfficiencyRecord({ id: "e1", efficiency_score: 3, insulation_adequate: false, draught_proofing_ok: false, heating_system_efficient: false, lighting_efficient: false, appliances_energy_rated: false }),
        makeEfficiencyRecord({ id: "e2", efficiency_score: 2, insulation_adequate: false, draught_proofing_ok: false, heating_system_efficient: false, lighting_efficient: false, appliances_energy_rated: false }),
      ],
    });
    // avg = 2.5
    expect(r.concerns.some(c => c.includes("2.5/5"))).toBe(true);
  });

  it("raises staff training concern < 40%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [
        makeSustainabilityRecord({ id: "s1", staff_trained: false }),
        makeSustainabilityRecord({ id: "s2", staff_trained: false }),
        makeSustainabilityRecord({ id: "s3", staff_trained: false }),
      ],
    });
    expect(r.concerns.some(c => c.includes("staff training rate"))).toBe(true);
  });

  it("does not raise cost monitoring concern when no bill records", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.concerns.some(c => c.includes("cost monitoring compliance"))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Recommendations", () => {
  it("recommends immediate action for billPaymentRate < 60", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord({ paid_on_time: false })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("bill payment processes"))).toBe(true);
  });

  it("recommends immediate action for budgetAdherenceRate < 40", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [makeBudgetRecord({ within_budget: false })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("utility budgets"))).toBe(true);
  });

  it("recommends immediate action for costMonitoringRate < 40", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
      })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("cost monitoring"))).toBe(true);
  });

  it("recommends immediate action for energyEfficiencyRate < 40", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
        appliances_energy_rated: false, thermostat_programmed: false,
        windows_double_glazed: false, energy_certificate_current: false,
        efficiency_score: 1,
      })],
    });
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("energy efficiency review"))).toBe(true);
  });

  it("recommends immediate recording when 0 bill records but not allEmpty", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("recording and review of all utility bills"))).toBe(true);
  });

  it("recommends immediate budgets when 0 budget records but not allEmpty", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("utility budgets with quarterly monitoring"))).toBe(true);
  });

  it("recommends immediate payment recording when 0 payment records but not allEmpty", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.recommendations.some(rec => rec.recommendation.includes("recording of all utility bill payments"))).toBe(true);
  });

  it("recommends soon for bill payment 60-79%", () => {
    const bills = Array.from({ length: 10 }, (_, i) =>
      makePaymentRecord({ id: `p${i}`, paid_on_time: i < 7 }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: bills,
    });
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("bill payment timeliness"))).toBe(true);
  });

  it("recommends soon for budget adherence 40-69%", () => {
    const budgets = Array.from({ length: 10 }, (_, i) =>
      makeBudgetRecord({ id: `b${i}`, within_budget: i < 5 }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: budgets,
    });
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("budget adherence"))).toBe(true);
  });

  it("recommends soon for cost monitoring 40-69%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
      })],
    });
    // 50%
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("cost monitoring consistency"))).toBe(true);
  });

  it("recommends soon for improvement completion < 50%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [
        makeEfficiencyRecord({ id: "e1", improvements_identified: ["A"], improvements_completed: false }),
      ],
    });
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("energy efficiency improvements"))).toBe(true);
  });

  it("recommends soon for corrective action < 50%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [
        makeBudgetRecord({ id: "b1", within_budget: false, corrective_action_taken: null }),
      ],
    });
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("corrective action"))).toBe(true);
  });

  it("recommends soon for child awareness < 50%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [
        makeSustainabilityRecord({ id: "s1", children_awareness_activity: false }),
        makeSustainabilityRecord({ id: "s2", children_awareness_activity: false }),
        makeSustainabilityRecord({ id: "s3", children_awareness_activity: false }),
      ],
    });
    expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("awareness activities"))).toBe(true);
  });

  it("recommends planned for energy efficiency 40-69%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
      })],
    });
    // 50%
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("energy efficiency standards"))).toBe(true);
  });

  it("recommends planned for sustainability 40-59%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false, children_awareness_activity: false,
        staff_trained: false,
      })],
    });
    // 40%
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("sustainability programme quality"))).toBe(true);
  });

  it("recommends planned for staff training < 60%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [
        makeSustainabilityRecord({ id: "s1", staff_trained: false }),
        makeSustainabilityRecord({ id: "s2", staff_trained: false }),
      ],
    });
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("sustainability training"))).toBe(true);
  });

  it("recommends planned for meter reading < 70%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [
        makeBillRecord({ id: "b1", meter_reading_taken: false }),
        makeBillRecord({ id: "b2", meter_reading_taken: false }),
      ],
    });
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("meter reading schedule"))).toBe(true);
  });

  it("recommends planned for tariff review < 70%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [
        makeBillRecord({ id: "b1", tariff_reviewed: false }),
        makeBillRecord({ id: "b2", tariff_reviewed: false }),
      ],
    });
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("tariff reviews"))).toBe(true);
  });

  it("recommends planned sustainability when 0 records but not allEmpty", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("sustainability initiatives"))).toBe(true);
  });

  it("assigns sequential rank numbers", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
      })],
      bill_payment_records: [makePaymentRecord({ paid_on_time: false })],
      budget_records: [makeBudgetRecord({ within_budget: false })],
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("includes regulatory_ref on all recommendations", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
      })],
    });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref).toBeTruthy();
    }
  });

  it("returns no recommendations when everything is excellent", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      bill_payment_records: [makePaymentRecord()],
      budget_records: [makeBudgetRecord()],
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.recommendations).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Insights", () => {
  it("critical insight for billPaymentRate < 60", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord({ paid_on_time: false })],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("bill payment timeliness"))).toBe(true);
  });

  it("critical insight for budgetAdherenceRate < 40", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [makeBudgetRecord({ within_budget: false })],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("budget adherence"))).toBe(true);
  });

  it("critical insight for costMonitoringRate < 40", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
      })],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("cost monitoring compliance"))).toBe(true);
  });

  it("critical insight for energyEfficiencyRate < 40", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
        appliances_energy_rated: false, thermostat_programmed: false,
        windows_double_glazed: false, energy_certificate_current: false,
        efficiency_score: 1,
      })],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("energy efficiency compliance"))).toBe(true);
  });

  it("critical insight for 0 bill records when not allEmpty", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No utility bill monitoring records"))).toBe(true);
  });

  it("critical insight for 0 budget records when not allEmpty", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No utility budget records"))).toBe(true);
  });

  it("critical insight for 0 payment records when not allEmpty", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No bill payment tracking"))).toBe(true);
  });

  it("critical insight for late fees > 100", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [
        makePaymentRecord({ id: "p1", paid_on_time: false, late_payment_fee_gbp: 60 }),
        makePaymentRecord({ id: "p2", paid_on_time: false, late_payment_fee_gbp: 60 }),
      ],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("late payment fees"))).toBe(true);
  });

  it("warning insight for cost monitoring 40-69%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
      })],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Cost monitoring compliance at 50%"))).toBe(true);
  });

  it("warning insight for energy efficiency 40-69%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
      })],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Energy efficiency compliance at 50%"))).toBe(true);
  });

  it("warning insight for bill payment 60-79%", () => {
    const bills = Array.from({ length: 10 }, (_, i) =>
      makePaymentRecord({ id: `p${i}`, paid_on_time: i < 7 }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: bills,
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Bill payment timeliness at 70%"))).toBe(true);
  });

  it("warning insight for budget adherence 40-69%", () => {
    const budgets = Array.from({ length: 10 }, (_, i) =>
      makeBudgetRecord({ id: `b${i}`, within_budget: i < 5 }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: budgets,
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Budget adherence at 50%"))).toBe(true);
  });

  it("warning insight for sustainability 40-59%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false, children_awareness_activity: false,
        staff_trained: false,
      })],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Sustainability programme quality at 40%"))).toBe(true);
  });

  it("warning insight for child awareness 30-49%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [
        makeSustainabilityRecord({ id: "s1" }),
        makeSustainabilityRecord({ id: "s2", children_awareness_activity: false }),
        makeSustainabilityRecord({ id: "s3", children_awareness_activity: false }),
      ],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Child awareness engagement at 33%"))).toBe(true);
  });

  it("warning insight for improvement completion 30-69%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [
        makeEfficiencyRecord({ id: "e1", improvements_identified: ["A"], improvements_completed: true }),
        makeEfficiencyRecord({ id: "e2", improvements_identified: ["B"], improvements_completed: false }),
      ],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("improvement completion"))).toBe(true);
  });

  it("warning insight for significant cost increase 30-50%", () => {
    const bills = Array.from({ length: 10 }, (_, i) =>
      makeBillRecord({
        id: `b${i}`,
        amount_gbp: i < 4 ? 200 : 100,
        previous_period_amount_gbp: 100,
      }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: bills,
    });
    // 40% significant increase
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("significant cost increases"))).toBe(true);
  });

  it("warning insight for corrective action 30-69%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [
        makeBudgetRecord({ id: "b1", within_budget: false, corrective_action_taken: "Yes" }),
        makeBudgetRecord({ id: "b2", within_budget: false, corrective_action_taken: null }),
      ],
    });
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Corrective action rate"))).toBe(true);
  });

  it("warning insight for meter reading 40-69%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [
        makeBillRecord({ id: "b1" }),
        makeBillRecord({ id: "b2", meter_reading_taken: false }),
      ],
    });
    // 50% meter reading
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Meter reading rate at 50%"))).toBe(true);
  });

  it("includes utility type cost analysis insight", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [
        makeBillRecord({ id: "b1", utility_type: "electricity", amount_gbp: 200 }),
        makeBillRecord({ id: "b2", utility_type: "gas", amount_gbp: 150 }),
      ],
    });
    expect(r.insights.some(i => i.text.includes("Highest utility costs"))).toBe(true);
  });

  it("positive insight for outstanding rating", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      bill_payment_records: [makePaymentRecord()],
      budget_records: [makeBudgetRecord()],
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
  });

  it("positive insight for combined cost monitoring + best deal >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("cost monitoring"))).toBe(true);
  });

  it("positive insight for bill payment >= 95 + zero late fees", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("bill payment timeliness"))).toBe(true);
  });

  it("positive insight for budget adherence >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [makeBudgetRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("budget adherence"))).toBe(true);
  });

  it("positive insight for energy efficiency >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("energy efficiency compliance"))).toBe(true);
  });

  it("positive insight for sustainability + child awareness both >= 80%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("sustainability quality"))).toBe(true);
  });

  it("positive insight for child awareness >= 80%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child awareness engagement"))).toBe(true);
  });

  it("positive insight for improvement completion >= 90%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        improvements_identified: ["A"],
        improvements_completed: true,
      })],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("improvement completion"))).toBe(true);
  });

  it("positive insight for direct debit >= 90% + payment >= 95%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("direct debit"))).toBe(true);
  });

  it("positive insight for corrective action >= 90% + effectiveness >= 80%", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [
        makeBudgetRecord({
          within_budget: false,
          corrective_action_taken: "Reduced usage",
          corrective_action_effective: true,
        }),
      ],
    });
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("corrective action rate"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. HEADLINES
// ══════════════════════════════════════════════════════════════════════════════

describe("Headlines", () => {
  it("outstanding headline", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      bill_payment_records: [makePaymentRecord()],
      budget_records: [makeBudgetRecord()],
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline with strengths and concerns counts", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.headline).toContain("Good");
    expect(r.headline).toMatch(/strength/);
  });

  it("adequate headline with concerns count", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false, children_awareness_activity: false,
        staff_trained: false, measurable_impact: false, reviewed: false,
      })],
    });
    expect(r.headline).toContain("Adequate");
    expect(r.headline).toMatch(/concern/);
  });

  it("inadequate headline with concerns count", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
      })],
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
        appliances_energy_rated: false, thermostat_programmed: false,
        windows_double_glazed: false, energy_certificate_current: false,
        efficiency_score: 1,
      })],
      bill_payment_records: [makePaymentRecord({ paid_on_time: false })],
      budget_records: [makeBudgetRecord({ within_budget: false })],
    });
    expect(r.headline).toContain("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. INTEGRATION — FULL SCENARIOS
// ══════════════════════════════════════════════════════════════════════════════

describe("Integration — full scenarios", () => {
  it("perfect home achieves outstanding with all strengths and no concerns", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      bill_payment_records: [makePaymentRecord()],
      budget_records: [makeBudgetRecord()],
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.utility_rating).toBe("outstanding");
    expect(r.utility_score).toBe(80);
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
  });

  it("worst-case home achieves inadequate with many concerns", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
        amount_gbp: 300, previous_period_amount_gbp: 100,
      })],
      energy_efficiency_records: [makeEfficiencyRecord({
        insulation_adequate: false, draught_proofing_ok: false,
        heating_system_efficient: false, lighting_efficient: false,
        appliances_energy_rated: false, thermostat_programmed: false,
        windows_double_glazed: false, energy_certificate_current: false,
        efficiency_score: 1,
        improvements_identified: ["A"],
        improvements_completed: false,
      })],
      bill_payment_records: [makePaymentRecord({
        paid_on_time: false,
        late_payment_fee_gbp: 150,
      })],
      budget_records: [makeBudgetRecord({
        within_budget: false,
        corrective_action_taken: null,
      })],
      sustainability_records: [makeSustainabilityRecord({
        children_involved: false, children_awareness_activity: false,
        staff_trained: false, measurable_impact: false, reviewed: false,
      })],
    });
    expect(r.utility_rating).toBe("inadequate");
    expect(r.utility_score).toBe(34);
    expect(r.concerns.length).toBeGreaterThan(5);
    expect(r.recommendations.length).toBeGreaterThan(3);
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
  });

  it("mixed home achieves good rating", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      bill_payment_records: [makePaymentRecord()],
    });
    expect(r.utility_rating).toBe("good");
    expect(r.utility_score).toBe(67);
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("home with only sustainability records gets adequate rating", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord()],
    });
    // base 52 + 4 (sustainability>=80) + 4 (childAwareness>=80) = 60
    expect(r.utility_rating).toBe("adequate");
    expect(r.utility_score).toBe(60);
  });

  it("home with many records scales correctly", () => {
    const bills = Array.from({ length: 20 }, (_, i) =>
      makeBillRecord({ id: `b${i}` }),
    );
    const payments = Array.from({ length: 20 }, (_, i) =>
      makePaymentRecord({ id: `p${i}` }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: bills,
      bill_payment_records: payments,
      energy_efficiency_records: [makeEfficiencyRecord()],
      budget_records: [makeBudgetRecord()],
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.total_bill_records).toBe(20);
    expect(r.total_payment_records).toBe(20);
    expect(r.utility_rating).toBe("outstanding");
  });

  it("all output fields are present in the result", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
    });
    expect(r).toHaveProperty("utility_rating");
    expect(r).toHaveProperty("utility_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_bill_records");
    expect(r).toHaveProperty("total_payment_records");
    expect(r).toHaveProperty("cost_monitoring_rate");
    expect(r).toHaveProperty("energy_efficiency_rate");
    expect(r).toHaveProperty("bill_payment_rate");
    expect(r).toHaveProperty("budget_adherence_rate");
    expect(r).toHaveProperty("sustainability_rate");
    expect(r).toHaveProperty("child_awareness_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("utility types are tracked in cost analysis insight", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [
        makeBillRecord({ id: "b1", utility_type: "electricity", amount_gbp: 500 }),
        makeBillRecord({ id: "b2", utility_type: "gas", amount_gbp: 300 }),
        makeBillRecord({ id: "b3", utility_type: "water", amount_gbp: 100 }),
      ],
    });
    const costInsight = r.insights.find(i => i.text.includes("Highest utility costs"));
    expect(costInsight).toBeDefined();
    expect(costInsight!.text).toContain("electricity");
  });

  it("cost decrease does not trigger increase concern", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        amount_gbp: 80,
        previous_period_amount_gbp: 150,
      })],
    });
    expect(r.concerns.some(c => c.includes("significant cost increases"))).toBe(false);
  });

  it("null previous_period_amount does not count toward cost increase", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        previous_period_amount_gbp: null,
      })],
    });
    expect(r.concerns.some(c => c.includes("significant cost increases"))).toBe(false);
  });

  it("handles empty corrective_action_taken as empty string correctly", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: [makeBudgetRecord({
        within_budget: false,
        corrective_action_taken: "",
      })],
    });
    // empty string treated as no action
    expect(r.concerns.some(c => c.includes("corrective action"))).toBe(true);
  });

  it("zero previous_period_amount is excluded from comparison", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        previous_period_amount_gbp: 0,
      })],
    });
    expect(r.concerns.some(c => c.includes("significant cost increases"))).toBe(false);
  });

  it("disputes raised but none resolved yields 0% resolution rate", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord({
        dispute_raised: true,
        dispute_resolved: false,
      })],
    });
    expect(r.strengths.some(s => s.includes("disputes resolved"))).toBe(false);
  });

  it("no disputes means no dispute strength", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord()],
    });
    // dispute_raised is false by default, so disputeResolutionRate = pct(0, 0) = 0
    // but disputesRaised === 0, so the strength check won't fire
    // Actually, the default has dispute_raised: false, so disputesRaised=0, meaning the condition `disputesRaised > 0` is false
    expect(r.strengths.some(s => s.includes("disputes resolved"))).toBe(false);
  });

  it("late fees not raised when exactly 0", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord({ late_payment_fee_gbp: 0 })],
    });
    expect(r.concerns.some(c => c.includes("late payment fees"))).toBe(false);
  });

  it("late fees critical insight only when > 100", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord({ paid_on_time: false, late_payment_fee_gbp: 50 })],
    });
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("late payment fees of"))).toBe(false);
    expect(r.concerns.some(c => c.includes("late payment fees"))).toBe(true);
  });

  it("single child triggers same logic as multiple children", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      total_children: 1,
    });
    expect(r.utility_rating).toBe("inadequate");
    expect(r.utility_score).toBe(15);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. ADDITIONAL BOUNDARY TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Additional boundary tests", () => {
  it("exactly 80 score yields outstanding", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      bill_payment_records: [makePaymentRecord()],
      budget_records: [makeBudgetRecord()],
      sustainability_records: [makeSustainabilityRecord()],
    });
    expect(r.utility_score).toBe(80);
    expect(r.utility_rating).toBe("outstanding");
  });

  it("score 65 yields good", () => {
    // base 52 + 5 (cost >= 90) + 5 (eff >= 90) + 3 (budget 70-89) = 65
    const budgets = Array.from({ length: 10 }, (_, i) =>
      makeBudgetRecord({ id: `b${i}`, within_budget: i < 8 }),
    );
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord()],
      energy_efficiency_records: [makeEfficiencyRecord()],
      budget_records: budgets,
    });
    expect(r.utility_score).toBe(65);
    expect(r.utility_rating).toBe("good");
  });

  it("score 45 yields adequate", () => {
    // base 52 - 4 (costMonitoring < 40) - 4 (energyEff < 40) + some small bonus
    // Let's target exactly 45: base 52 - 4 - 4 = 44, need +1...
    // Actually, 52 - 5 (billPay<60) = 47. That's adequate.
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: [makePaymentRecord({ paid_on_time: false })],
    });
    expect(r.utility_score).toBe(47);
    expect(r.utility_rating).toBe("adequate");
  });

  it("score 44 yields inadequate", () => {
    // 52 - 5 (billPay) - 4 (costMon) = 43
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: [makeBillRecord({
        meter_reading_taken: false, tariff_reviewed: false,
        best_deal_confirmed: false, review_date: null,
      })],
      bill_payment_records: [makePaymentRecord({ paid_on_time: false })],
    });
    expect(r.utility_score).toBe(43);
    expect(r.utility_rating).toBe("inadequate");
  });

  it("all possible utility types are accepted", () => {
    const types: Array<UtilityBillRecordInput["utility_type"]> = [
      "electricity", "gas", "water", "internet", "telephone", "waste", "oil", "other",
    ];
    const records = types.map((t, i) => makeBillRecord({ id: `b${i}`, utility_type: t }));
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      cost_monitoring_records: records,
    });
    expect(r.total_bill_records).toBe(8);
  });

  it("all quarter types are accepted", () => {
    const quarters: Array<UtilityBudgetRecordInput["quarter"]> = ["Q1", "Q2", "Q3", "Q4"];
    const records = quarters.map((q, i) => makeBudgetRecord({ id: `b${i}`, quarter: q }));
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      budget_records: records,
    });
    expect(r.budget_adherence_rate).toBe(100);
  });

  it("all sustainability initiative types are accepted", () => {
    const types: Array<SustainabilityRecordInput["initiative_type"]> = [
      "recycling", "energy_reduction", "water_conservation",
      "waste_minimisation", "renewable_energy", "education",
      "green_procurement", "other",
    ];
    const records = types.map((t, i) => makeSustainabilityRecord({ id: `s${i}`, initiative_type: t }));
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: records,
    });
    expect(r.sustainability_rate).toBe(100);
  });

  it("all payment methods are accepted", () => {
    const methods: Array<BillPaymentRecordInput["payment_method"]> = [
      "direct_debit", "bank_transfer", "card", "cheque", "other",
    ];
    const records = methods.map((m, i) => makePaymentRecord({ id: `p${i}`, payment_method: m }));
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      bill_payment_records: records,
    });
    expect(r.bill_payment_rate).toBe(100);
  });

  it("improvements with empty array does not count as having improvements", () => {
    const r = computeUtilityBillsCostManagement({
      ...baseInput,
      energy_efficiency_records: [makeEfficiencyRecord({
        improvements_identified: [],
        improvements_completed: false,
      })],
    });
    // No improvements identified, so improvement completion rate check doesn't fire
    expect(r.concerns.some(c => c.includes("improvements completed"))).toBe(false);
  });

  it("ongoing initiatives are tracked but don't affect scoring directly", () => {
    const r1 = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({ ongoing: true })],
    });
    const r2 = computeUtilityBillsCostManagement({
      ...baseInput,
      sustainability_records: [makeSustainabilityRecord({ ongoing: false })],
    });
    // ongoing doesn't affect the composite sustainability rate
    expect(r1.sustainability_rate).toBe(r2.sustainability_rate);
  });
});
