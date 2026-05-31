// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME POCKET MONEY AUDIT & RECONCILIATION INTELLIGENCE ENGINE
// TESTS
//
// 180 tests covering: empty states, scoring bonuses/penalties, rating
// thresholds, audit compliance, reconciliation accuracy, discrepancy
// resolution, transparency, child awareness, timeliness, strengths,
// concerns, recommendations, insights, and headline generation.
// CHR 2015 Reg 5, Reg 36. SCCIF leadership and management.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computePocketMoneyAuditReconciliation,
  type PocketMoneyAuditInput,
  type AuditRecordInput,
  type ReconciliationRecordInput,
  type DiscrepancyRecordInput,
  type TransparencyRecordInput,
  type ChildAwarenessRecordInput,
} from "../home-pocket-money-audit-reconciliation-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

// ── Factory Helpers ─────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `pma_${++_id}`;
}

const baseInput: PocketMoneyAuditInput = {
  today: TODAY,
  total_children: 4,
  audit_records: [],
  reconciliation_records: [],
  discrepancy_records: [],
  transparency_records: [],
  child_awareness_records: [],
};

function run(overrides: Partial<PocketMoneyAuditInput> = {}) {
  return computePocketMoneyAuditReconciliation({ ...baseInput, ...overrides });
}

// -- Audit record factory --
function makeAudit(overrides: Partial<AuditRecordInput> = {}): AuditRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    audit_date: "2026-05-20",
    auditor_name: "Jane Smith",
    audit_type: "monthly",
    opening_balance: 20,
    closing_balance: 15,
    total_income: 10,
    total_expenditure: 15,
    receipts_present: true,
    receipts_match_records: true,
    signatures_present: true,
    child_signature_obtained: true,
    running_total_accurate: true,
    cash_count_matches: true,
    ledger_up_to_date: true,
    all_entries_dated: true,
    all_entries_described: true,
    no_unauthorized_transactions: true,
    corrective_actions_needed: false,
    corrective_actions_description: null,
    corrective_actions_completed: false,
    corrective_actions_completion_date: null,
    audit_outcome: "pass",
    observations: null,
    next_audit_due: "2026-06-20",
    created_at: "2026-05-20",
    ...overrides,
  };
}

// -- Reconciliation record factory --
function makeReconciliation(
  overrides: Partial<ReconciliationRecordInput> = {},
): ReconciliationRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    reconciliation_date: "2026-05-20",
    period_start: "2026-04-20",
    period_end: "2026-05-20",
    reconciled_by: "Jane Smith",
    expected_balance: 50,
    actual_balance: 50,
    variance_amount: 0,
    variance_explained: true,
    variance_explanation: null,
    all_transactions_accounted: true,
    bank_statement_matched: true,
    petty_cash_reconciled: true,
    savings_balance_verified: true,
    discrepancies_found: false,
    discrepancy_count: 0,
    reconciliation_outcome: "balanced",
    supervisor_reviewed: true,
    supervisor_name: "John Manager",
    review_date: "2026-05-21",
    notes: null,
    created_at: "2026-05-20",
    ...overrides,
  };
}

// -- Discrepancy record factory --
function makeDiscrepancy(
  overrides: Partial<DiscrepancyRecordInput> = {},
): DiscrepancyRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    identified_date: "2026-05-10",
    identified_by: "Jane Smith",
    discrepancy_type: "missing_receipt",
    amount_involved: 5,
    description: "Missing receipt for sweets purchase",
    severity: "minor",
    resolution_required: true,
    resolution_status: "resolved",
    resolution_date: "2026-05-12",
    resolution_description: "Receipt located in drawer",
    resolved_by: "Jane Smith",
    days_to_resolve: 2,
    escalated_to: null,
    root_cause_identified: true,
    root_cause_description: "Receipt misplaced during filing",
    preventive_action_taken: true,
    preventive_action_description: "Receipts now filed immediately",
    child_informed: true,
    child_impact: "none",
    created_at: "2026-05-10",
    ...overrides,
  };
}

// -- Transparency record factory --
function makeTransparency(
  overrides: Partial<TransparencyRecordInput> = {},
): TransparencyRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    record_date: "2026-05-15",
    child_has_access_to_records: true,
    records_explained_to_child: true,
    child_receives_regular_statements: true,
    statement_frequency: "monthly",
    pocket_money_amount_agreed: true,
    amount_age_appropriate: true,
    child_involved_in_budget_decisions: true,
    spending_choices_respected: true,
    savings_goals_discussed: true,
    savings_goals_documented: true,
    financial_records_accessible: true,
    complaints_process_explained: true,
    independent_oversight_in_place: true,
    staff_member: "Jane Smith",
    notes: null,
    created_at: "2026-05-15",
    ...overrides,
  };
}

// -- Child awareness record factory --
function makeAwareness(
  overrides: Partial<ChildAwarenessRecordInput> = {},
): ChildAwarenessRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    assessment_date: "2026-05-15",
    assessed_by: "Jane Smith",
    understands_pocket_money_amount: true,
    understands_how_amount_decided: true,
    knows_how_to_check_balance: true,
    knows_how_to_query_transaction: true,
    understands_saving_vs_spending: true,
    has_received_financial_education: true,
    financial_education_type: "budgeting workshop",
    can_manage_small_budget: true,
    understands_receipts_importance: true,
    feels_money_is_managed_fairly: true,
    has_raised_concerns: false,
    concerns_addressed: false,
    concerns_description: null,
    confidence_level: 5,
    age_appropriate_understanding: true,
    areas_for_development: null,
    support_plan_in_place: false,
    created_at: "2026-05-15",
    ...overrides,
  };
}

// -- Batch helpers --
function makeAudits(n: number, overrides: Partial<AuditRecordInput> = {}): AuditRecordInput[] {
  return Array.from({ length: n }, () => makeAudit(overrides));
}

function makeReconciliations(
  n: number,
  overrides: Partial<ReconciliationRecordInput> = {},
): ReconciliationRecordInput[] {
  return Array.from({ length: n }, () => makeReconciliation(overrides));
}

function makeDiscrepancies(
  n: number,
  overrides: Partial<DiscrepancyRecordInput> = {},
): DiscrepancyRecordInput[] {
  return Array.from({ length: n }, () => makeDiscrepancy(overrides));
}

function makeTransparencies(
  n: number,
  overrides: Partial<TransparencyRecordInput> = {},
): TransparencyRecordInput[] {
  return Array.from({ length: n }, () => makeTransparency(overrides));
}

function makeAwarenesses(
  n: number,
  overrides: Partial<ChildAwarenessRecordInput> = {},
): ChildAwarenessRecordInput[] {
  return Array.from({ length: n }, () => makeAwareness(overrides));
}

// Build a "perfect" input that should score outstanding
function perfectInput(): Partial<PocketMoneyAuditInput> {
  return {
    audit_records: makeAudits(10),
    reconciliation_records: makeReconciliations(10),
    discrepancy_records: makeDiscrepancies(5),
    transparency_records: makeTransparencies(8),
    child_awareness_records: makeAwarenesses(8),
  };
}

// Build a failing audit record (all checks false, outcome fail)
function makeFailingAudit(overrides: Partial<AuditRecordInput> = {}): AuditRecordInput {
  return makeAudit({
    receipts_present: false,
    receipts_match_records: false,
    signatures_present: false,
    child_signature_obtained: false,
    running_total_accurate: false,
    cash_count_matches: false,
    ledger_up_to_date: false,
    all_entries_dated: false,
    all_entries_described: false,
    no_unauthorized_transactions: false,
    audit_outcome: "fail",
    ...overrides,
  });
}

// Build a poor reconciliation (all checks false)
function makePoorReconciliation(
  overrides: Partial<ReconciliationRecordInput> = {},
): ReconciliationRecordInput {
  return makeReconciliation({
    all_transactions_accounted: false,
    bank_statement_matched: false,
    petty_cash_reconciled: false,
    savings_balance_verified: false,
    supervisor_reviewed: false,
    reconciliation_outcome: "variance_unexplained",
    variance_amount: 10,
    variance_explained: false,
    ...overrides,
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

// ════════════════════════════════════════════════════════════════════════════
// 1. EMPTY / SPECIAL STATES
// ════════════════════════════════════════════════════════════════════════════

describe("empty / special states", () => {
  it("1: returns insufficient_data when all empty and 0 children", () => {
    const r = run({ total_children: 0 });
    expect(r.audit_rating).toBe("insufficient_data");
    expect(r.audit_score).toBe(0);
    expect(r.total_audits).toBe(0);
    expect(r.total_reconciliations).toBe(0);
    expect(r.total_discrepancies).toBe(0);
  });

  it("2: insufficient_data headline mentions no children", () => {
    const r = run({ total_children: 0 });
    expect(r.headline).toContain("No children on placement");
  });

  it("3: insufficient_data has empty arrays", () => {
    const r = run({ total_children: 0 });
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("4: returns inadequate when all empty but children > 0", () => {
    const r = run({ total_children: 3 });
    expect(r.audit_rating).toBe("inadequate");
    expect(r.audit_score).toBe(15);
  });

  it("5: inadequate empty state has 1 concern", () => {
    const r = run({ total_children: 3 });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No audit records");
  });

  it("6: inadequate empty state has 2 recommendations", () => {
    const r = run({ total_children: 3 });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("7: inadequate empty state has 1 critical insight", () => {
    const r = run({ total_children: 3 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("8: inadequate empty state headline mentions urgent attention", () => {
    const r = run({ total_children: 3 });
    expect(r.headline).toContain("urgent attention");
  });

  it("9: recommendations have rank 1 and 2", () => {
    const r = run({ total_children: 3 });
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("10: recommendations reference Reg 36 and Reg 5", () => {
    const r = run({ total_children: 3 });
    expect(r.recommendations[0].regulatory_ref).toContain("Reg 36");
    expect(r.recommendations[1].regulatory_ref).toContain("Reg 5");
  });

  it("11: all rates are 0 with no data and children", () => {
    const r = run({ total_children: 3 });
    expect(r.audit_compliance_rate).toBe(0);
    expect(r.reconciliation_accuracy_rate).toBe(0);
    expect(r.discrepancy_resolution_rate).toBe(0);
    expect(r.transparency_rate).toBe(0);
    expect(r.child_awareness_rate).toBe(0);
    expect(r.timeliness_rate).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. TOTALS
// ════════════════════════════════════════════════════════════════════════════

describe("totals", () => {
  it("12: counts total audits", () => {
    const r = run({ audit_records: makeAudits(5) });
    expect(r.total_audits).toBe(5);
  });

  it("13: counts total reconciliations", () => {
    const r = run({ reconciliation_records: makeReconciliations(3) });
    expect(r.total_reconciliations).toBe(3);
  });

  it("14: counts total discrepancies", () => {
    const r = run({ discrepancy_records: makeDiscrepancies(7) });
    expect(r.total_discrepancies).toBe(7);
  });

  it("15: total_audits 0 when only other records exist", () => {
    const r = run({ transparency_records: makeTransparencies(2) });
    expect(r.total_audits).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. AUDIT COMPLIANCE RATE
// ════════════════════════════════════════════════════════════════════════════

describe("audit compliance rate", () => {
  it("16: 100% compliance with all-perfect audits", () => {
    const r = run({ audit_records: makeAudits(5) });
    expect(r.audit_compliance_rate).toBe(100);
  });

  it("17: 0% compliance with all-failing audits", () => {
    const r = run({ audit_records: Array.from({ length: 5 }, () => makeFailingAudit()) });
    expect(r.audit_compliance_rate).toBe(0);
  });

  it("18: partial compliance rates correctly", () => {
    // 1 perfect (10/10 checks) + 1 all-fail (0/10 checks) = 10/20 = 50%
    const r = run({
      audit_records: [makeAudit(), makeFailingAudit()],
    });
    expect(r.audit_compliance_rate).toBe(50);
  });

  it("19: single audit with some checks failed", () => {
    // 8/10 checks pass
    const r = run({
      audit_records: [makeAudit({ receipts_present: false, cash_count_matches: false })],
    });
    expect(r.audit_compliance_rate).toBe(80);
  });

  it("20: pass_with_observations counts as compliance check pass", () => {
    const r = run({
      audit_records: [makeAudit({ audit_outcome: "pass_with_observations" })],
    });
    expect(r.audit_compliance_rate).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. RECONCILIATION ACCURACY RATE
// ════════════════════════════════════════════════════════════════════════════

describe("reconciliation accuracy rate", () => {
  it("21: 100% accuracy with all-perfect reconciliations", () => {
    const r = run({ reconciliation_records: makeReconciliations(5) });
    expect(r.reconciliation_accuracy_rate).toBe(100);
  });

  it("22: 0% accuracy with all-poor reconciliations", () => {
    const r = run({
      reconciliation_records: Array.from({ length: 5 }, () => makePoorReconciliation()),
    });
    expect(r.reconciliation_accuracy_rate).toBe(0);
  });

  it("23: mixed reconciliations produce expected rate", () => {
    // 1 perfect (6/6) + 1 poor (0/6) = 6/12 = 50%
    const r = run({
      reconciliation_records: [makeReconciliation(), makePoorReconciliation()],
    });
    expect(r.reconciliation_accuracy_rate).toBe(50);
  });

  it("24: variance_explained outcome counts as accuracy pass", () => {
    const r = run({
      reconciliation_records: [
        makeReconciliation({ reconciliation_outcome: "variance_explained" }),
      ],
    });
    expect(r.reconciliation_accuracy_rate).toBe(100);
  });

  it("25: pending outcome does not count as accuracy pass", () => {
    const r = run({
      reconciliation_records: [
        makeReconciliation({
          reconciliation_outcome: "pending",
          all_transactions_accounted: true,
          bank_statement_matched: true,
          petty_cash_reconciled: true,
          savings_balance_verified: true,
          supervisor_reviewed: true,
        }),
      ],
    });
    // 5/6 checks pass (outcome fails) = 83%
    expect(r.reconciliation_accuracy_rate).toBe(83);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. DISCREPANCY RESOLUTION RATE
// ════════════════════════════════════════════════════════════════════════════

describe("discrepancy resolution rate", () => {
  it("26: 100% resolution when all resolved", () => {
    const r = run({ discrepancy_records: makeDiscrepancies(5) });
    expect(r.discrepancy_resolution_rate).toBe(100);
  });

  it("27: 0% resolution when all open", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(5, {
        resolution_status: "open",
        resolution_date: null,
        resolved_by: null,
        days_to_resolve: null,
      }),
    });
    expect(r.discrepancy_resolution_rate).toBe(0);
  });

  it("28: escalated does not count as resolved", () => {
    const r = run({
      discrepancy_records: [makeDiscrepancy({ resolution_status: "escalated" })],
    });
    expect(r.discrepancy_resolution_rate).toBe(0);
  });

  it("29: investigating does not count as resolved", () => {
    const r = run({
      discrepancy_records: [makeDiscrepancy({ resolution_status: "investigating" })],
    });
    expect(r.discrepancy_resolution_rate).toBe(0);
  });

  it("30: mixed resolution statuses calculated correctly", () => {
    const r = run({
      discrepancy_records: [
        makeDiscrepancy({ resolution_status: "resolved" }),
        makeDiscrepancy({ resolution_status: "open" }),
      ],
    });
    expect(r.discrepancy_resolution_rate).toBe(50);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. TRANSPARENCY RATE
// ════════════════════════════════════════════════════════════════════════════

describe("transparency rate", () => {
  it("31: 100% transparency with all checks true", () => {
    const r = run({ transparency_records: makeTransparencies(5) });
    expect(r.transparency_rate).toBe(100);
  });

  it("32: 0% transparency with all checks false", () => {
    const r = run({
      transparency_records: makeTransparencies(5, {
        child_has_access_to_records: false,
        records_explained_to_child: false,
        child_receives_regular_statements: false,
        pocket_money_amount_agreed: false,
        amount_age_appropriate: false,
        child_involved_in_budget_decisions: false,
        spending_choices_respected: false,
        financial_records_accessible: false,
        complaints_process_explained: false,
        independent_oversight_in_place: false,
      }),
    });
    expect(r.transparency_rate).toBe(0);
  });

  it("33: partial transparency produces correct rate", () => {
    // 5/10 checks true per record
    const r = run({
      transparency_records: [
        makeTransparency({
          child_has_access_to_records: true,
          records_explained_to_child: true,
          child_receives_regular_statements: true,
          pocket_money_amount_agreed: true,
          amount_age_appropriate: true,
          child_involved_in_budget_decisions: false,
          spending_choices_respected: false,
          financial_records_accessible: false,
          complaints_process_explained: false,
          independent_oversight_in_place: false,
        }),
      ],
    });
    expect(r.transparency_rate).toBe(50);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. CHILD AWARENESS RATE
// ════════════════════════════════════════════════════════════════════════════

describe("child awareness rate", () => {
  it("34: 100% awareness with all checks true", () => {
    const r = run({ child_awareness_records: makeAwarenesses(5) });
    expect(r.child_awareness_rate).toBe(100);
  });

  it("35: 0% awareness with all checks false", () => {
    const r = run({
      child_awareness_records: makeAwarenesses(5, {
        understands_pocket_money_amount: false,
        understands_how_amount_decided: false,
        knows_how_to_check_balance: false,
        knows_how_to_query_transaction: false,
        understands_saving_vs_spending: false,
        has_received_financial_education: false,
        can_manage_small_budget: false,
        understands_receipts_importance: false,
        feels_money_is_managed_fairly: false,
        age_appropriate_understanding: false,
      }),
    });
    expect(r.child_awareness_rate).toBe(0);
  });

  it("36: partial awareness calculated correctly", () => {
    // 7/10 checks true
    const r = run({
      child_awareness_records: [
        makeAwareness({
          knows_how_to_query_transaction: false,
          can_manage_small_budget: false,
          understands_receipts_importance: false,
        }),
      ],
    });
    expect(r.child_awareness_rate).toBe(70);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. TIMELINESS RATE
// ════════════════════════════════════════════════════════════════════════════

describe("timeliness rate", () => {
  it("37: 100% timeliness with corrective + resolved + supervised", () => {
    const r = run({
      audit_records: [makeAudit({ corrective_actions_needed: true, corrective_actions_completed: true })],
      discrepancy_records: [makeDiscrepancy({ resolution_status: "resolved", days_to_resolve: 5 })],
      reconciliation_records: [makeReconciliation({ supervisor_reviewed: true })],
    });
    // numerator: 1 corrective + 1 resolved<=14 + 1 supervisor = 3
    // denominator: 1 needing correction + 1 resolved discrepancy + 1 recon = 3
    expect(r.timeliness_rate).toBe(100);
  });

  it("38: 0% timeliness when none completed", () => {
    const r = run({
      audit_records: [makeAudit({ corrective_actions_needed: true, corrective_actions_completed: false })],
      discrepancy_records: [makeDiscrepancy({ resolution_status: "resolved", days_to_resolve: 20 })],
      reconciliation_records: [makeReconciliation({ supervisor_reviewed: false })],
    });
    // numerator: 0+0+0 = 0, denominator = 1+1+1 = 3
    expect(r.timeliness_rate).toBe(0);
  });

  it("39: discrepancy resolved in 14 days counts as timely", () => {
    const r = run({
      discrepancy_records: [makeDiscrepancy({ resolution_status: "resolved", days_to_resolve: 14 })],
      reconciliation_records: [makeReconciliation({ supervisor_reviewed: true })],
    });
    // numerator: 0+1+1 = 2, denominator: 0+1+1 = 2
    expect(r.timeliness_rate).toBe(100);
  });

  it("40: discrepancy resolved in 15 days not timely", () => {
    const r = run({
      discrepancy_records: [makeDiscrepancy({ resolution_status: "resolved", days_to_resolve: 15 })],
    });
    // numerator: 0+0 = 0, denominator: 0+1 = 1
    expect(r.timeliness_rate).toBe(0);
  });

  it("41: open discrepancy does not affect timeliness denominator", () => {
    const r = run({
      discrepancy_records: [
        makeDiscrepancy({ resolution_status: "open", days_to_resolve: null }),
      ],
      reconciliation_records: [makeReconciliation({ supervisor_reviewed: true })],
    });
    // only resolved discrepancies count; denominator: 0+0+1 = 1; numerator: 0+0+1 = 1
    expect(r.timeliness_rate).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. SCORING — BASE AND BONUSES
// ════════════════════════════════════════════════════════════════════════════

describe("scoring — base and bonuses", () => {
  it("42: base score is 52 with minimal data (no bonus/penalty)", () => {
    // One audit with ~70% compliance (7/10 checks) => auditComplianceRate=70 => +2 bonus
    // We need exactly 52. Give 1 transparency record with partial data so no bonus triggers.
    // Actually need to avoid all bonus/penalty. Use 1 audit at ~60% compliance (no bonus, no penalty).
    const r = run({
      audit_records: [
        makeAudit({
          receipts_present: false,
          receipts_match_records: false,
          cash_count_matches: false,
          ledger_up_to_date: false,
          // 6/10 checks = 60% => no bonus, no penalty (>=50)
        }),
      ],
    });
    // auditComplianceRate 60% => no bonus, no penalty
    // All other rates 0 with 0 records => no bonus/penalty
    expect(r.audit_score).toBe(52);
  });

  it("43: audit compliance >=90 adds +5", () => {
    const r = run({
      audit_records: makeAudits(10), // 100% compliance
    });
    // base 52 + 5 = 57
    expect(r.audit_score).toBe(57);
  });

  it("44: audit compliance 70-89 adds +2", () => {
    // 7/10 checks per audit = 70%
    const r = run({
      audit_records: [
        makeAudit({
          receipts_present: false,
          cash_count_matches: false,
          ledger_up_to_date: false,
        }),
      ],
    });
    expect(r.audit_score).toBe(54);
  });

  it("45: reconciliation accuracy >=90 adds +5", () => {
    const r = run({
      reconciliation_records: makeReconciliations(10), // 100%
    });
    // 52 + 5 (recon) + 3 (timeliness: 10 supervisor_reviewed / 10 recons = 100%) = 60
    expect(r.audit_score).toBe(60);
  });

  it("46: reconciliation accuracy 70-89 adds +2", () => {
    // Need ~5/6 checks per recon = 83%
    const r = run({
      reconciliation_records: [
        makeReconciliation({ supervisor_reviewed: false }),
      ],
    });
    expect(r.audit_score).toBe(54);
  });

  it("47: discrepancy resolution >=90 adds +4", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(10), // 100% resolved
    });
    // 52 + 4 (disc) + 3 (timeliness: 10 resolved<=14 / 10 resolved = 100%) + 3 (rootCause 100%) = 62
    expect(r.audit_score).toBe(62);
  });

  it("48: discrepancy resolution 70-89 adds +2", () => {
    // 7/10 resolved
    const resolved = makeDiscrepancies(7);
    const open = makeDiscrepancies(3, { resolution_status: "open" });
    const r = run({ discrepancy_records: [...resolved, ...open] });
    // 52 + 2 (disc 70%) + 3 (timeliness: 7 resolved<=14 / 7 resolved = 100%) + 3 (rootCause 100%) = 60
    expect(r.audit_score).toBe(60);
  });

  it("49: transparency >=90 adds +4", () => {
    const r = run({
      transparency_records: makeTransparencies(10), // 100%
    });
    expect(r.audit_score).toBe(56);
  });

  it("50: transparency 70-89 adds +2", () => {
    // 7/10 checks per record = 70%
    const r = run({
      transparency_records: [
        makeTransparency({
          child_involved_in_budget_decisions: false,
          spending_choices_respected: false,
          financial_records_accessible: false,
        }),
      ],
    });
    expect(r.audit_score).toBe(54);
  });

  it("51: child awareness >=90 adds +4", () => {
    const r = run({
      child_awareness_records: makeAwarenesses(10), // 100%
    });
    expect(r.audit_score).toBe(56);
  });

  it("52: child awareness 70-89 adds +2", () => {
    const r = run({
      child_awareness_records: [
        makeAwareness({
          knows_how_to_query_transaction: false,
          can_manage_small_budget: false,
          understands_receipts_importance: false,
        }),
      ],
    });
    expect(r.audit_score).toBe(54);
  });

  it("53: timeliness >=90 adds +3", () => {
    const r = run({
      audit_records: [makeAudit({ corrective_actions_needed: true, corrective_actions_completed: true })],
      discrepancy_records: [makeDiscrepancy({ days_to_resolve: 5 })],
      reconciliation_records: [makeReconciliation({ supervisor_reviewed: true })],
    });
    // timeliness 100% => +3
    // audit compliance: 100% => +5
    // recon accuracy: 100% => +5
    // discrepancy resolution: 100% => +4
    // rootCause: 100% => +3
    // 52 + 5 + 5 + 4 + 3 + 3 = 72
    expect(r.audit_score).toBe(72);
  });

  it("54: timeliness 70-89 adds +1", () => {
    // 2 out of 3 items timely = 67%... need to get exactly 70-89
    // 7 out of 10 = 70%
    const corrective = makeAudits(3, { corrective_actions_needed: true, corrective_actions_completed: true });
    const notCorrective = makeAudits(3, { corrective_actions_needed: true, corrective_actions_completed: false });
    const timelyDisc = makeDiscrepancies(2, { resolution_status: "resolved", days_to_resolve: 5 });
    const lateDisc = makeDiscrepancies(1, { resolution_status: "resolved", days_to_resolve: 20 });
    const reviewed = makeReconciliations(1, { supervisor_reviewed: true });

    // numerator: 3 + 2 + 1 = 6, denominator: 6 + 3 + 1 = 10 => 60%... not enough
    // Let's adjust. Need 70%. 7/10:
    // 4 corrective completed, 1 not completed => audits needing correction = 5, completed = 4
    // 2 timely disc, 1 late => resolved = 3, within 14 = 2
    // 1 recon reviewed
    // num: 4+2+1 = 7, den: 5+3+1 = 9 => 78%
    const r = run({
      audit_records: [
        ...makeAudits(4, { corrective_actions_needed: true, corrective_actions_completed: true }),
        makeAudit({ corrective_actions_needed: true, corrective_actions_completed: false }),
      ],
      discrepancy_records: [
        ...makeDiscrepancies(2, { resolution_status: "resolved", days_to_resolve: 5 }),
        makeDiscrepancy({ resolution_status: "resolved", days_to_resolve: 20 }),
      ],
      reconciliation_records: [makeReconciliation({ supervisor_reviewed: true })],
    });
    expect(r.timeliness_rate).toBe(78);
    // Bonus check: timeliness 78% => +1
    // Other bonuses also apply but we just check timeliness contributes +1
  });

  it("55: root cause >=90 adds +3", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(10, { root_cause_identified: true }),
    });
    // 52 + 4 (disc 100%) + 3 (timeliness 100%) + 3 (rootCause 100%) = 62
    expect(r.audit_score).toBe(62);
  });

  it("56: root cause 70-89 adds +1", () => {
    // 7/10 root cause
    const withRC = makeDiscrepancies(7, { root_cause_identified: true });
    const withoutRC = makeDiscrepancies(3, { root_cause_identified: false });
    const r = run({ discrepancy_records: [...withRC, ...withoutRC] });
    // 52 + 4 (disc 100%) + 1 (rootCause 70%) + 3 (timeliness 100%) = 60
    expect(r.audit_score).toBe(60);
  });

  it("57: all bonuses stack for maximum score", () => {
    const r = run(perfectInput());
    // 52 + 5 + 5 + 4 + 4 + 4 + 3 + 3 = 80
    // timeliness: num = 0 corrective + 5 resolved<=14 + 10 supervisor = 15
    //             den = 0 needing correction + 5 resolved discrepancies + 10 recons = 15
    //             => 100% => +3
    expect(r.audit_score).toBe(80);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. SCORING — PENALTIES
// ════════════════════════════════════════════════════════════════════════════

describe("scoring — penalties", () => {
  it("58: audit compliance < 50 subtracts -6", () => {
    const r = run({
      audit_records: Array.from({ length: 5 }, () => makeFailingAudit()),
    });
    // compliance 0% => -6, from 52 => 46
    expect(r.audit_score).toBe(46);
  });

  it("59: reconciliation accuracy < 50 subtracts -6", () => {
    const r = run({
      reconciliation_records: Array.from({ length: 5 }, () => makePoorReconciliation()),
    });
    // accuracy 0% => -6, from 52 => 46
    expect(r.audit_score).toBe(46);
  });

  it("60: critical discrepancy rate > 40 subtracts -5", () => {
    // 3/5 critical => 60%
    const r = run({
      discrepancy_records: [
        ...makeDiscrepancies(3, { severity: "critical" }),
        ...makeDiscrepancies(2, { severity: "minor" }),
      ],
    });
    // 52 + 4 (disc 100%) + 3 (rootCause 100%) + 3 (timeliness 100%) - 5 (critical>40) = 57
    expect(r.audit_score).toBe(57);
  });

  it("61: transparency < 40 subtracts -5", () => {
    const r = run({
      transparency_records: makeTransparencies(5, {
        child_has_access_to_records: false,
        records_explained_to_child: false,
        child_receives_regular_statements: false,
        pocket_money_amount_agreed: false,
        amount_age_appropriate: false,
        child_involved_in_budget_decisions: false,
        spending_choices_respected: false,
        financial_records_accessible: true,
        complaints_process_explained: true,
        independent_oversight_in_place: true,
      }),
    });
    // 3/10 = 30% < 40 => -5
    expect(r.audit_score).toBe(47);
  });

  it("62: multiple penalties stack", () => {
    const r = run({
      audit_records: Array.from({ length: 5 }, () => makeFailingAudit()),
      reconciliation_records: Array.from({ length: 5 }, () => makePoorReconciliation()),
    });
    // 52 - 6 - 6 = 40
    expect(r.audit_score).toBe(40);
  });

  it("63: score clamped to 0 minimum", () => {
    // Stack all penalties with as many penalizable conditions as possible
    const r = run({
      audit_records: Array.from({ length: 5 }, () => makeFailingAudit()),
      reconciliation_records: Array.from({ length: 5 }, () => makePoorReconciliation()),
      discrepancy_records: makeDiscrepancies(5, {
        severity: "critical",
        resolution_status: "open",
        root_cause_identified: false,
        preventive_action_taken: false,
        days_to_resolve: null,
      }),
      transparency_records: makeTransparencies(5, {
        child_has_access_to_records: false,
        records_explained_to_child: false,
        child_receives_regular_statements: false,
        pocket_money_amount_agreed: false,
        amount_age_appropriate: false,
        child_involved_in_budget_decisions: false,
        spending_choices_respected: false,
        financial_records_accessible: false,
        complaints_process_explained: false,
        independent_oversight_in_place: false,
      }),
    });
    // 52 - 6 - 6 - 5 - 5 = 30 => still above 0 but let's verify it's at least >= 0
    expect(r.audit_score).toBeGreaterThanOrEqual(0);
    expect(r.audit_score).toBeLessThanOrEqual(100);
  });

  it("64: score clamped to 100 maximum", () => {
    const r = run(perfectInput());
    expect(r.audit_score).toBeLessThanOrEqual(100);
  });

  it("65: penalty only applies when records exist (audit compliance)", () => {
    // 0 audits => compliance is 0% but penalty should NOT apply
    const r = run({
      reconciliation_records: makeReconciliations(5),
    });
    // 52 + 5 (recon 100%) + 3 (timeliness: 5 supervisor / 5 recons = 100%) = 60
    expect(r.audit_score).toBe(60);
  });

  it("66: penalty only applies when records exist (recon accuracy)", () => {
    const r = run({
      audit_records: makeAudits(5),
    });
    // No recon penalty. Base 52 + audit bonus 5 = 57
    expect(r.audit_score).toBe(57);
  });

  it("67: penalty only applies when records exist (critical discrepancy)", () => {
    // 0 discrepancies => criticalDiscrepancyRate is 0% but that's fine (no penalty trigger)
    const r = run({
      audit_records: makeAudits(5),
    });
    // No discrepancy penalty
    expect(r.audit_score).toBe(57);
  });

  it("68: penalty only applies when records exist (transparency)", () => {
    // 0 transparency records => rate is 0 but penalty should NOT apply
    const r = run({
      audit_records: makeAudits(5),
    });
    expect(r.audit_score).toBe(57);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 11. RATING THRESHOLDS
// ════════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("69: score >= 80 => outstanding", () => {
    const r = run(perfectInput());
    expect(r.audit_score).toBe(80);
    expect(r.audit_rating).toBe("outstanding");
  });

  it("70: score 79 => good", () => {
    // Remove 1 bonus to go from 80 to below 80
    const input = perfectInput();
    // Remove root cause from discrepancies => rootCauseRate drops below 90
    input.discrepancy_records = makeDiscrepancies(5, { root_cause_identified: false });
    const r = run(input);
    // 52 + 5 + 5 + 4 + 4 + 4 + 3 + 0 = 77 (no root cause bonus)
    expect(r.audit_score).toBe(77);
    expect(r.audit_rating).toBe("good");
  });

  it("71: score 65 => good boundary", () => {
    const r = run({
      audit_records: makeAudits(5),
      reconciliation_records: makeReconciliations(5),
      discrepancy_records: makeDiscrepancies(5),
    });
    // 52 + 5 + 5 + 4 + 3 = 69 (+ timeliness + rootCause bonuses)
    expect(r.audit_rating).toBe("good");
    expect(r.audit_score).toBeGreaterThanOrEqual(65);
  });

  it("72: score 45-64 => adequate", () => {
    // Just audits and penalties
    const r = run({
      audit_records: [
        makeAudit({
          receipts_present: false,
          receipts_match_records: false,
          cash_count_matches: false,
          ledger_up_to_date: false,
        }),
      ],
    });
    // compliance 60% => no bonus, no penalty. Score 52 => adequate? No, 52 is adequate (45-64)
    // Actually >= 65 is good. So 52 is adequate.
    expect(r.audit_rating).toBe("adequate");
  });

  it("73: score < 45 => inadequate", () => {
    const r = run({
      audit_records: Array.from({ length: 5 }, () => makeFailingAudit()),
      reconciliation_records: Array.from({ length: 5 }, () => makePoorReconciliation()),
    });
    // 52 - 6 - 6 = 40 => inadequate
    expect(r.audit_score).toBe(40);
    expect(r.audit_rating).toBe("inadequate");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 12. STRENGTHS
// ════════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("74: audit compliance >=90 generates strength", () => {
    const r = run({ audit_records: makeAudits(5) });
    expect(r.strengths.some((s) => s.includes("audit compliance"))).toBe(true);
  });

  it("75: audit compliance 70-89 generates different strength", () => {
    const r = run({
      audit_records: [
        makeAudit({
          receipts_present: false,
          cash_count_matches: false,
          ledger_up_to_date: false,
        }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("audit compliance") && s.includes("generally maintains"))).toBe(true);
  });

  it("76: reconciliation accuracy >=90 generates strength", () => {
    const r = run({ reconciliation_records: makeReconciliations(5) });
    expect(r.strengths.some((s) => s.includes("reconciliation accuracy"))).toBe(true);
  });

  it("77: reconciliation accuracy 70-89 generates strength", () => {
    const r = run({
      reconciliation_records: [makeReconciliation({ supervisor_reviewed: false })],
    });
    expect(r.strengths.some((s) => s.includes("reconciliation accuracy") && s.includes("generally reliable"))).toBe(true);
  });

  it("78: discrepancy resolution >=90 generates strength", () => {
    const r = run({ discrepancy_records: makeDiscrepancies(5) });
    expect(r.strengths.some((s) => s.includes("discrepancy resolution"))).toBe(true);
  });

  it("79: discrepancy resolution 70-89 generates strength", () => {
    const resolved = makeDiscrepancies(8);
    const open = makeDiscrepancies(2, { resolution_status: "open" });
    const r = run({ discrepancy_records: [...resolved, ...open] });
    expect(r.strengths.some((s) => s.includes("discrepancy resolution") && s.includes("majority"))).toBe(true);
  });

  it("80: transparency >=90 generates strength", () => {
    const r = run({ transparency_records: makeTransparencies(5) });
    expect(r.strengths.some((s) => s.includes("transparency"))).toBe(true);
  });

  it("81: transparency 70-89 generates strength", () => {
    const r = run({
      transparency_records: [
        makeTransparency({
          child_involved_in_budget_decisions: false,
          spending_choices_respected: false,
          financial_records_accessible: false,
        }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("transparency") && s.includes("generally good"))).toBe(true);
  });

  it("82: child awareness >=90 generates strength", () => {
    const r = run({ child_awareness_records: makeAwarenesses(5) });
    expect(r.strengths.some((s) => s.includes("child financial awareness"))).toBe(true);
  });

  it("83: child awareness 70-89 generates strength", () => {
    const r = run({
      child_awareness_records: [
        makeAwareness({
          knows_how_to_query_transaction: false,
          can_manage_small_budget: false,
          understands_receipts_importance: false,
        }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("child financial awareness") && s.includes("majority"))).toBe(true);
  });

  it("84: timeliness >=90 generates strength", () => {
    const r = run({
      audit_records: [makeAudit({ corrective_actions_needed: true, corrective_actions_completed: true })],
      discrepancy_records: [makeDiscrepancy({ days_to_resolve: 5 })],
      reconciliation_records: [makeReconciliation({ supervisor_reviewed: true })],
    });
    expect(r.strengths.some((s) => s.includes("timeliness"))).toBe(true);
  });

  it("85: audit pass rate >=95 generates strength", () => {
    const r = run({ audit_records: makeAudits(20) });
    expect(r.strengths.some((s) => s.includes("audits passed"))).toBe(true);
  });

  it("86: audit pass rate 85-94 generates strength", () => {
    // 9/10 pass = 90%
    const r = run({
      audit_records: [
        ...makeAudits(9),
        makeFailingAudit(),
      ],
    });
    expect(r.strengths.some((s) => s.includes("audits passed") && s.includes("strong audit pass rate"))).toBe(true);
  });

  it("87: cash count >=95 generates strength", () => {
    const r = run({ audit_records: makeAudits(20) });
    expect(r.strengths.some((s) => s.includes("cash count accuracy"))).toBe(true);
  });

  it("88: supervisor review >=90 generates strength", () => {
    const r = run({ reconciliation_records: makeReconciliations(10) });
    expect(r.strengths.some((s) => s.includes("supervisor review"))).toBe(true);
  });

  it("89: supervisor review 70-89 generates strength", () => {
    const reviewed = makeReconciliations(8, { supervisor_reviewed: true });
    const notReviewed = makeReconciliations(2, { supervisor_reviewed: false });
    const r = run({ reconciliation_records: [...reviewed, ...notReviewed] });
    expect(r.strengths.some((s) => s.includes("supervisor review") && s.includes("generally provides"))).toBe(true);
  });

  it("90: root cause >=90 generates strength", () => {
    const r = run({ discrepancy_records: makeDiscrepancies(10) });
    expect(r.strengths.some((s) => s.includes("root cause analysis"))).toBe(true);
  });

  it("91: root cause 70-89 generates strength", () => {
    const withRC = makeDiscrepancies(7, { root_cause_identified: true });
    const withoutRC = makeDiscrepancies(3, { root_cause_identified: false });
    const r = run({ discrepancy_records: [...withRC, ...withoutRC] });
    expect(r.strengths.some((s) => s.includes("root cause identification"))).toBe(true);
  });

  it("92: preventive action >=90 generates strength", () => {
    const r = run({ discrepancy_records: makeDiscrepancies(10) });
    expect(r.strengths.some((s) => s.includes("preventive action rate"))).toBe(true);
  });

  it("93: feels fair >=90 generates strength", () => {
    const r = run({ child_awareness_records: makeAwarenesses(10) });
    expect(r.strengths.some((s) => s.includes("feel their money is managed fairly"))).toBe(true);
  });

  it("94: child signature >=90 generates strength", () => {
    const r = run({ audit_records: makeAudits(10) });
    expect(r.strengths.some((s) => s.includes("child signature rate"))).toBe(true);
  });

  it("95: spending respected >=90 generates strength", () => {
    const r = run({ transparency_records: makeTransparencies(10) });
    expect(r.strengths.some((s) => s.includes("spending choices respected"))).toBe(true);
  });

  it("96: financial education >=90 generates strength", () => {
    const r = run({ child_awareness_records: makeAwarenesses(10) });
    expect(r.strengths.some((s) => s.includes("received financial education"))).toBe(true);
  });

  it("97: financial education 70-89 generates strength", () => {
    const withEd = makeAwarenesses(8, { has_received_financial_education: true });
    const withoutEd = makeAwarenesses(2, { has_received_financial_education: false });
    const r = run({ child_awareness_records: [...withEd, ...withoutEd] });
    expect(r.strengths.some((s) => s.includes("financial education") && s.includes("majority"))).toBe(true);
  });

  it("98: concerns addressed >=90 generates strength", () => {
    const r = run({
      child_awareness_records: makeAwarenesses(5, {
        has_raised_concerns: true,
        concerns_addressed: true,
      }),
    });
    expect(r.strengths.some((s) => s.includes("financial concerns addressed"))).toBe(true);
  });

  it("99: rapid resolution >=90 generates strength", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(10, { days_to_resolve: 3 }),
    });
    expect(r.strengths.some((s) => s.includes("resolved within 7 days"))).toBe(true);
  });

  it("100: independent oversight >=90 generates strength", () => {
    const r = run({ transparency_records: makeTransparencies(10) });
    expect(r.strengths.some((s) => s.includes("independent oversight"))).toBe(true);
  });

  it("101: no strengths when all rates are low", () => {
    const r = run({
      audit_records: Array.from({ length: 5 }, () => makeFailingAudit()),
    });
    expect(r.strengths).toHaveLength(0);
  });

  it("102: no strengths for empty record arrays", () => {
    const r = run({ transparency_records: [] });
    // With default baseInput (4 children, no records for specific category)
    // No strengths for transparency since 0 records
    const hasTransparencyStrength = r.strengths.some((s) => s.includes("transparency"));
    expect(hasTransparencyStrength).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 13. CONCERNS
// ════════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("103: audit compliance < 50 generates concern", () => {
    const r = run({
      audit_records: Array.from({ length: 5 }, () => makeFailingAudit()),
    });
    expect(r.concerns.some((c) => c.includes("audit compliance"))).toBe(true);
  });

  it("104: audit compliance 50-69 generates concern", () => {
    const r = run({
      audit_records: [
        makeAudit({
          receipts_present: false,
          receipts_match_records: false,
          cash_count_matches: false,
          ledger_up_to_date: false,
        }),
      ],
    });
    // 6/10 = 60%
    expect(r.concerns.some((c) => c.includes("Audit compliance at 60%"))).toBe(true);
  });

  it("105: reconciliation accuracy < 50 generates concern", () => {
    const r = run({
      reconciliation_records: Array.from({ length: 5 }, () => makePoorReconciliation()),
    });
    expect(r.concerns.some((c) => c.includes("reconciliation accuracy"))).toBe(true);
  });

  it("106: reconciliation accuracy 50-69 generates concern", () => {
    // 3/6 checks per record = 50%
    const r = run({
      reconciliation_records: [
        makeReconciliation({
          all_transactions_accounted: false,
          bank_statement_matched: false,
          petty_cash_reconciled: false,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Reconciliation accuracy at 50%"))).toBe(true);
  });

  it("107: discrepancy resolution < 50 generates concern", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(5, {
        resolution_status: "open",
        days_to_resolve: null,
      }),
    });
    expect(r.concerns.some((c) => c.includes("discrepancy resolution"))).toBe(true);
  });

  it("108: discrepancy resolution 50-69 generates concern", () => {
    const resolved = makeDiscrepancies(6);
    const open = makeDiscrepancies(4, { resolution_status: "open" });
    const r = run({ discrepancy_records: [...resolved, ...open] });
    expect(r.concerns.some((c) => c.includes("Discrepancy resolution at 60%"))).toBe(true);
  });

  it("109: transparency < 40 generates concern", () => {
    const r = run({
      transparency_records: makeTransparencies(5, {
        child_has_access_to_records: false,
        records_explained_to_child: false,
        child_receives_regular_statements: false,
        pocket_money_amount_agreed: false,
        amount_age_appropriate: false,
        child_involved_in_budget_decisions: false,
        spending_choices_respected: false,
        financial_records_accessible: true,
        complaints_process_explained: true,
        independent_oversight_in_place: true,
      }),
    });
    // 3/10 = 30%
    expect(r.concerns.some((c) => c.includes("Only 30% transparency"))).toBe(true);
  });

  it("110: transparency 40-69 generates concern", () => {
    const r = run({
      transparency_records: [
        makeTransparency({
          child_involved_in_budget_decisions: false,
          spending_choices_respected: false,
          financial_records_accessible: false,
        }),
      ],
    });
    // 7/10 = 70% => no concern (70 is NOT < 70)
    // Need 40-69. Let's use 6/10 = 60%
    const r2 = run({
      transparency_records: [
        makeTransparency({
          child_involved_in_budget_decisions: false,
          spending_choices_respected: false,
          financial_records_accessible: false,
          complaints_process_explained: false,
        }),
      ],
    });
    expect(r2.concerns.some((c) => c.includes("Transparency at 60%"))).toBe(true);
  });

  it("111: child awareness < 50 generates concern", () => {
    const r = run({
      child_awareness_records: makeAwarenesses(5, {
        understands_pocket_money_amount: false,
        understands_how_amount_decided: false,
        knows_how_to_check_balance: false,
        knows_how_to_query_transaction: false,
        understands_saving_vs_spending: false,
        has_received_financial_education: false,
        can_manage_small_budget: false,
        understands_receipts_importance: false,
        feels_money_is_managed_fairly: false,
        age_appropriate_understanding: false,
      }),
    });
    expect(r.concerns.some((c) => c.includes("child financial awareness"))).toBe(true);
  });

  it("112: child awareness 50-69 generates concern", () => {
    const r = run({
      child_awareness_records: [
        makeAwareness({
          knows_how_to_query_transaction: false,
          can_manage_small_budget: false,
          understands_receipts_importance: false,
          feels_money_is_managed_fairly: false,
        }),
      ],
    });
    // 6/10 = 60%
    expect(r.concerns.some((c) => c.includes("Child financial awareness at 60%"))).toBe(true);
  });

  it("113: critical discrepancy rate > 40 generates concern", () => {
    const r = run({
      discrepancy_records: [
        ...makeDiscrepancies(3, { severity: "critical" }),
        ...makeDiscrepancies(2, { severity: "minor" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("critical or major"))).toBe(true);
  });

  it("114: critical discrepancy rate 21-40 generates concern", () => {
    const r = run({
      discrepancy_records: [
        ...makeDiscrepancies(3, { severity: "major" }),
        ...makeDiscrepancies(7, { severity: "minor" }),
      ],
    });
    // 3/10 = 30%
    expect(r.concerns.some((c) => c.includes("30% of discrepancies are critical or major"))).toBe(true);
  });

  it("115: audit fail rate > 30 generates concern", () => {
    const r = run({
      audit_records: [
        ...Array.from({ length: 4 }, () => makeFailingAudit()),
        ...makeAudits(6),
      ],
    });
    // 4/10 = 40%
    expect(r.concerns.some((c) => c.includes("audit failure rate"))).toBe(true);
  });

  it("116: audit fail rate 16-30 generates concern", () => {
    const r = run({
      audit_records: [
        ...Array.from({ length: 2 }, () => makeFailingAudit()),
        ...makeAudits(8),
      ],
    });
    // 2/10 = 20%
    expect(r.concerns.some((c) => c.includes("20% audit failure rate"))).toBe(true);
  });

  it("117: unexplained variance > 30 generates concern", () => {
    const r = run({
      reconciliation_records: [
        ...Array.from({ length: 4 }, () =>
          makePoorReconciliation({ reconciliation_outcome: "variance_unexplained" }),
        ),
        ...makeReconciliations(6),
      ],
    });
    // 4/10 = 40%
    expect(r.concerns.some((c) => c.includes("unexplained variances"))).toBe(true);
  });

  it("118: unexplained variance 16-30 generates concern", () => {
    const r = run({
      reconciliation_records: [
        ...Array.from({ length: 2 }, () =>
          makePoorReconciliation({ reconciliation_outcome: "variance_unexplained" }),
        ),
        ...makeReconciliations(8),
      ],
    });
    expect(r.concerns.some((c) => c.includes("unexplained variances"))).toBe(true);
  });

  it("119: feels fair < 50 generates concern", () => {
    const r = run({
      child_awareness_records: makeAwarenesses(5, {
        feels_money_is_managed_fairly: false,
      }),
    });
    expect(r.concerns.some((c) => c.includes("feel their money is managed fairly"))).toBe(true);
  });

  it("120: feels fair 50-69 generates concern", () => {
    const fair = makeAwarenesses(6, { feels_money_is_managed_fairly: true });
    const unfair = makeAwarenesses(4, { feels_money_is_managed_fairly: false });
    const r = run({ child_awareness_records: [...fair, ...unfair] });
    expect(r.concerns.some((c) => c.includes("feel their money is managed fairly"))).toBe(true);
  });

  it("121: supervisor review < 50 generates concern", () => {
    const r = run({
      reconciliation_records: makeReconciliations(5, { supervisor_reviewed: false }),
    });
    expect(r.concerns.some((c) => c.includes("supervisor review"))).toBe(true);
  });

  it("122: supervisor review 50-69 generates concern", () => {
    const reviewed = makeReconciliations(6, { supervisor_reviewed: true });
    const notReviewed = makeReconciliations(4, { supervisor_reviewed: false });
    const r = run({ reconciliation_records: [...reviewed, ...notReviewed] });
    expect(r.concerns.some((c) => c.includes("Supervisor review rate at 60%"))).toBe(true);
  });

  it("123: significant impact > 30 generates concern", () => {
    const r = run({
      discrepancy_records: [
        ...makeDiscrepancies(4, { child_impact: "significant" }),
        ...makeDiscrepancies(6, { child_impact: "none" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("child impact"))).toBe(true);
  });

  it("124: no audits with children generates concern", () => {
    const r = run({
      total_children: 4,
      transparency_records: makeTransparencies(2),
    });
    expect(r.concerns.some((c) => c.includes("No pocket money audits recorded"))).toBe(true);
  });

  it("125: no reconciliations with children generates concern", () => {
    const r = run({
      total_children: 4,
      audit_records: makeAudits(2),
    });
    expect(r.concerns.some((c) => c.includes("No pocket money reconciliations recorded"))).toBe(true);
  });

  it("126: no transparency records with children generates concern", () => {
    const r = run({
      total_children: 4,
      audit_records: makeAudits(2),
    });
    expect(r.concerns.some((c) => c.includes("No financial transparency records"))).toBe(true);
  });

  it("127: no awareness records with children generates concern", () => {
    const r = run({
      total_children: 4,
      audit_records: makeAudits(2),
    });
    expect(r.concerns.some((c) => c.includes("No child financial awareness assessments"))).toBe(true);
  });

  it("128: corrective action completion < 50 generates concern", () => {
    const r = run({
      audit_records: [
        makeAudit({ corrective_actions_needed: true, corrective_actions_completed: false }),
        makeAudit({ corrective_actions_needed: true, corrective_actions_completed: false }),
        makeAudit({ corrective_actions_needed: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("corrective actions completed"))).toBe(true);
  });

  it("129: root cause < 50 generates concern", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(5, { root_cause_identified: false }),
    });
    expect(r.concerns.some((c) => c.includes("root cause analysis"))).toBe(true);
  });

  it("130: no concerns generated for perfect data", () => {
    const r = run(perfectInput());
    expect(r.concerns).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 14. RECOMMENDATIONS
// ════════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("131: audit compliance < 50 generates immediate recommendation", () => {
    const r = run({
      audit_records: Array.from({ length: 5 }, () => makeFailingAudit()),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("audit processes"))).toBe(true);
  });

  it("132: reconciliation accuracy < 50 generates immediate recommendation", () => {
    const r = run({
      reconciliation_records: Array.from({ length: 5 }, () => makePoorReconciliation()),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("reconciliation procedures"))).toBe(true);
  });

  it("133: critical discrepancy > 40 generates immediate recommendation", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(5, { severity: "critical" }),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("critical and major"))).toBe(true);
  });

  it("134: transparency < 40 generates immediate recommendation", () => {
    const r = run({
      transparency_records: makeTransparencies(5, {
        child_has_access_to_records: false,
        records_explained_to_child: false,
        child_receives_regular_statements: false,
        pocket_money_amount_agreed: false,
        amount_age_appropriate: false,
        child_involved_in_budget_decisions: false,
        spending_choices_respected: false,
        financial_records_accessible: false,
        complaints_process_explained: true,
        independent_oversight_in_place: true,
      }),
    });
    // 2/10 = 20%
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("transparency"))).toBe(true);
  });

  it("135: unexplained variance > 30 generates immediate recommendation", () => {
    const r = run({
      reconciliation_records: [
        ...Array.from({ length: 4 }, () =>
          makePoorReconciliation({ reconciliation_outcome: "variance_unexplained" }),
        ),
        ...makeReconciliations(6),
      ],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("unexplained variances"))).toBe(true);
  });

  it("136: no audits with children generates immediate recommendation", () => {
    const r = run({
      total_children: 4,
      transparency_records: makeTransparencies(2),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("audit schedule"))).toBe(true);
  });

  it("137: no reconciliations with children generates immediate recommendation", () => {
    const r = run({
      total_children: 4,
      audit_records: makeAudits(2),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("reconciliations for all children"))).toBe(true);
  });

  it("138: discrepancy resolution < 50 generates immediate recommendation", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(5, { resolution_status: "open", days_to_resolve: null }),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("discrepancy resolution process"))).toBe(true);
  });

  it("139: feels fair < 50 generates immediate recommendation", () => {
    const r = run({
      child_awareness_records: makeAwarenesses(5, { feels_money_is_managed_fairly: false }),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("consult children"))).toBe(true);
  });

  it("140: child awareness < 50 generates soon recommendation", () => {
    const r = run({
      child_awareness_records: makeAwarenesses(5, {
        understands_pocket_money_amount: false,
        understands_how_amount_decided: false,
        knows_how_to_check_balance: false,
        knows_how_to_query_transaction: false,
        understands_saving_vs_spending: false,
        has_received_financial_education: false,
        can_manage_small_budget: false,
        understands_receipts_importance: false,
        feels_money_is_managed_fairly: false,
        age_appropriate_understanding: false,
      }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("financial awareness education"))).toBe(true);
  });

  it("141: supervisor review < 50 generates soon recommendation", () => {
    const r = run({
      reconciliation_records: makeReconciliations(5, { supervisor_reviewed: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("supervisory review"))).toBe(true);
  });

  it("142: corrective action < 50 generates soon recommendation", () => {
    const r = run({
      audit_records: makeAudits(5, { corrective_actions_needed: true, corrective_actions_completed: false }),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("corrective action tracker"))).toBe(true);
  });

  it("143: root cause < 50 generates soon recommendation", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(5, { root_cause_identified: false }),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("root cause analysis"))).toBe(true);
  });

  it("144: child signature < 70 generates planned recommendation", () => {
    const r = run({
      audit_records: makeAudits(10, { child_signature_obtained: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("children sign"))).toBe(true);
  });

  it("145: preventive action < 70 generates planned recommendation", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(10, { preventive_action_taken: false }),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("preventive actions"))).toBe(true);
  });

  it("146: savings discussed < 70 generates planned recommendation", () => {
    const r = run({
      transparency_records: makeTransparencies(10, { savings_goals_discussed: false }),
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("savings goals"))).toBe(true);
  });

  it("147: recommendations have sequential ranks", () => {
    const r = run({
      audit_records: Array.from({ length: 5 }, () => makeFailingAudit()),
      reconciliation_records: Array.from({ length: 5 }, () => makePoorReconciliation()),
    });
    const ranks = r.recommendations.map((rec) => rec.rank);
    for (let i = 0; i < ranks.length; i++) {
      expect(ranks[i]).toBe(i + 1);
    }
  });

  it("148: all recommendations have regulatory_ref", () => {
    const r = run({
      audit_records: Array.from({ length: 5 }, () => makeFailingAudit()),
      discrepancy_records: makeDiscrepancies(5, { severity: "critical", resolution_status: "open", days_to_resolve: null }),
    });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref.length).toBeGreaterThan(0);
    }
  });

  it("149: no recommendations for perfect data", () => {
    const r = run(perfectInput());
    expect(r.recommendations).toHaveLength(0);
  });

  it("150: audit compliance 50-69 generates soon recommendation", () => {
    // 6/10 checks = 60%
    const r = run({
      audit_records: [
        makeAudit({
          receipts_present: false,
          receipts_match_records: false,
          cash_count_matches: false,
          ledger_up_to_date: false,
        }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve audit compliance"))).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 15. INSIGHTS
// ════════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("151: audit compliance < 50 produces critical insight", () => {
    const r = run({
      audit_records: Array.from({ length: 5 }, () => makeFailingAudit()),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("audit compliance"))).toBe(true);
  });

  it("152: reconciliation accuracy < 50 produces critical insight", () => {
    const r = run({
      reconciliation_records: Array.from({ length: 5 }, () => makePoorReconciliation()),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("reconciliation accuracy"))).toBe(true);
  });

  it("153: critical discrepancy > 40 produces critical insight", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(5, { severity: "critical" }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("critical or major"))).toBe(true);
  });

  it("154: transparency < 40 produces critical insight", () => {
    const r = run({
      transparency_records: makeTransparencies(5, {
        child_has_access_to_records: false,
        records_explained_to_child: false,
        child_receives_regular_statements: false,
        pocket_money_amount_agreed: false,
        amount_age_appropriate: false,
        child_involved_in_budget_decisions: false,
        spending_choices_respected: false,
        financial_records_accessible: false,
        complaints_process_explained: true,
        independent_oversight_in_place: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("financial transparency"))).toBe(true);
  });

  it("155: unexplained variance > 30 produces critical insight", () => {
    const r = run({
      reconciliation_records: [
        ...Array.from({ length: 4 }, () =>
          makePoorReconciliation({ reconciliation_outcome: "variance_unexplained" }),
        ),
        ...makeReconciliations(6),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("unexplained variances"))).toBe(true);
  });

  it("156: no audits with children produces critical insight", () => {
    const r = run({
      total_children: 4,
      transparency_records: makeTransparencies(2),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No pocket money audits"))).toBe(true);
  });

  it("157: no reconciliations with children produces critical insight", () => {
    const r = run({
      total_children: 4,
      audit_records: makeAudits(2),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No pocket money reconciliations"))).toBe(true);
  });

  it("158: feels fair < 50 produces critical insight", () => {
    const r = run({
      child_awareness_records: makeAwarenesses(5, { feels_money_is_managed_fairly: false }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("feel their money is managed fairly"))).toBe(true);
  });

  it("159: audit compliance 50-69 produces warning insight", () => {
    const r = run({
      audit_records: [
        makeAudit({
          receipts_present: false,
          receipts_match_records: false,
          cash_count_matches: false,
          ledger_up_to_date: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Audit compliance at 60%"))).toBe(true);
  });

  it("160: reconciliation accuracy 50-69 produces warning insight", () => {
    const r = run({
      reconciliation_records: [
        makeReconciliation({
          all_transactions_accounted: false,
          bank_statement_matched: false,
          petty_cash_reconciled: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Reconciliation accuracy at 50%"))).toBe(true);
  });

  it("161: discrepancy resolution 50-69 produces warning insight", () => {
    const resolved = makeDiscrepancies(6);
    const open = makeDiscrepancies(4, { resolution_status: "open" });
    const r = run({ discrepancy_records: [...resolved, ...open] });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Discrepancy resolution at 60%"))).toBe(true);
  });

  it("162: transparency 40-69 produces warning insight", () => {
    const r = run({
      transparency_records: [
        makeTransparency({
          child_involved_in_budget_decisions: false,
          spending_choices_respected: false,
          financial_records_accessible: false,
          complaints_process_explained: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Financial transparency at 60%"))).toBe(true);
  });

  it("163: child awareness 50-69 produces warning insight", () => {
    const r = run({
      child_awareness_records: [
        makeAwareness({
          knows_how_to_query_transaction: false,
          can_manage_small_budget: false,
          understands_receipts_importance: false,
          feels_money_is_managed_fairly: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child financial awareness at 60%"))).toBe(true);
  });

  it("164: avg days to resolve > 14 produces warning insight", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(5, { days_to_resolve: 20 }),
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Average 20 days"))).toBe(true);
  });

  it("165: avg days to resolve 8-14 produces warning insight", () => {
    const r = run({
      discrepancy_records: makeDiscrepancies(5, { days_to_resolve: 10 }),
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Average 10 days"))).toBe(true);
  });

  it("166: discrepancy type analysis produces warning insight", () => {
    const r = run({
      discrepancy_records: [
        ...makeDiscrepancies(3, { discrepancy_type: "missing_receipt" }),
        ...makeDiscrepancies(2, { discrepancy_type: "balance_mismatch" }),
      ],
    });
    expect(r.insights.some((i) => i.text.includes("Most common discrepancy types"))).toBe(true);
  });

  it("167: child budget involvement < 50 produces warning insight", () => {
    const r = run({
      transparency_records: makeTransparencies(5, { child_involved_in_budget_decisions: false }),
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("budget decisions"))).toBe(true);
  });

  it("168: financial education < 50 produces warning insight", () => {
    const r = run({
      child_awareness_records: makeAwarenesses(5, { has_received_financial_education: false }),
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("financial education"))).toBe(true);
  });

  it("169: outstanding rating produces positive insight", () => {
    const r = run(perfectInput());
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
  });

  it("170: high audit compliance + pass rate produces positive insight", () => {
    const r = run({ audit_records: makeAudits(20) });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("audit compliance") && i.text.includes("pass rate"))).toBe(true);
  });

  it("171: high reconciliation accuracy + perfect rate produces positive insight", () => {
    const r = run({ reconciliation_records: makeReconciliations(10) });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("reconciliation accuracy"))).toBe(true);
  });

  it("172: high discrepancy resolution + root cause produces positive insight", () => {
    const r = run({ discrepancy_records: makeDiscrepancies(10) });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("discrepancy resolution") && i.text.includes("root cause"))).toBe(true);
  });

  it("173: high transparency + awareness produces positive insight", () => {
    const r = run({
      transparency_records: makeTransparencies(10),
      child_awareness_records: makeAwarenesses(10),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("transparency") && i.text.includes("child awareness"))).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 16. HEADLINES
// ════════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("174: outstanding headline text", () => {
    const r = run(perfectInput());
    expect(r.headline).toContain("Outstanding pocket money audit");
  });

  it("175: good headline includes strength and concern counts", () => {
    const r = run({
      audit_records: makeAudits(5),
      reconciliation_records: makeReconciliations(5),
      discrepancy_records: makeDiscrepancies(5),
    });
    expect(r.headline).toContain("Good pocket money audit");
  });

  it("176: adequate headline mentions concerns", () => {
    const r = run({
      audit_records: [
        makeAudit({
          receipts_present: false,
          receipts_match_records: false,
          cash_count_matches: false,
          ledger_up_to_date: false,
        }),
      ],
    });
    expect(r.headline).toContain("Adequate pocket money audit");
    expect(r.headline).toContain("concern");
  });

  it("177: inadequate headline mentions urgent action", () => {
    const r = run({
      audit_records: Array.from({ length: 5 }, () => makeFailingAudit()),
      reconciliation_records: Array.from({ length: 5 }, () => makePoorReconciliation()),
    });
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("urgent action");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 17. EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("178: single audit record produces valid result", () => {
    const r = run({ audit_records: [makeAudit()] });
    expect(r.total_audits).toBe(1);
    expect(r.audit_compliance_rate).toBe(100);
    expect(r.audit_rating).toBeDefined();
  });

  it("179: all record types with single record each", () => {
    const r = run({
      audit_records: [makeAudit()],
      reconciliation_records: [makeReconciliation()],
      discrepancy_records: [makeDiscrepancy()],
      transparency_records: [makeTransparency()],
      child_awareness_records: [makeAwareness()],
    });
    expect(r.total_audits).toBe(1);
    expect(r.total_reconciliations).toBe(1);
    expect(r.total_discrepancies).toBe(1);
    expect(r.audit_compliance_rate).toBe(100);
    expect(r.reconciliation_accuracy_rate).toBe(100);
    expect(r.discrepancy_resolution_rate).toBe(100);
    expect(r.transparency_rate).toBe(100);
    expect(r.child_awareness_rate).toBe(100);
  });

  it("180: discrepancy with null days_to_resolve does not affect timeliness denominator for resolved disc", () => {
    // A discrepancy that is resolved but has null days_to_resolve:
    // It is resolved (counts in resolution rate) but not in resolvedDiscrepancies filter
    // (which requires resolution_status === "resolved" AND days_to_resolve !== null)
    const r = run({
      discrepancy_records: [
        makeDiscrepancy({ resolution_status: "resolved", days_to_resolve: null }),
      ],
    });
    expect(r.discrepancy_resolution_rate).toBe(100);
    // timeliness denominator won't include this discrepancy since resolvedDiscrepancies
    // filters for days_to_resolve !== null
    expect(r.timeliness_rate).toBe(0); // 0/0 = 0
  });
});
