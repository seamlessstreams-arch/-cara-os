import { describe, it, expect } from "vitest";
import { _testing, type PocketMoneyManagementRecord } from "../pocket-money-management-service";
import { todayStr } from "@/lib/utils";

const { computePocketMoneyMetrics, identifyPocketMoneyAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<PocketMoneyManagementRecord>): PocketMoneyManagementRecord {
  return {
    id: "a-1", home_id: "home-1",
    transaction_type: "weekly_allowance",
    spending_category: "savings",
    approval_status: "approved",
    financial_literacy_level: "supported",
    transaction_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    recorded_by: "Staff A",
    receipt_obtained: true,
    child_chose_purchase: true,
    age_appropriate_spend: true,
    budget_discussed: true,
    savings_encouraged: true,
    value_for_money_discussed: true,
    financial_record_updated: true,
    balance_reconciled: true,
    social_worker_informed: true,
    parent_informed: true,
    care_plan_linked: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    amount_pence: 1000,
    running_balance_pence: 5000,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("pocket-money-management-service", () => {
  describe("computePocketMoneyMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computePocketMoneyMetrics([]);
      expect(m.total_transactions).toBe(0);;
      expect(m.purchase_count).toBe(0);
      expect(m.savings_deposit_count).toBe(0);
      expect(m.declined_count).toBe(0);
      expect(m.retrospective_count).toBe(0);
      expect(m.receipt_obtained_rate).toBeNull();;
      expect(m.total_amount_pence).toBe(0);
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computePocketMoneyMetrics([]);
      expect(m.by_transaction_type).toEqual({});
      expect(m.by_spending_category).toEqual({});
      expect(m.by_approval_status).toEqual({});
      expect(m.by_financial_literacy_level).toEqual({});
    });
    it("counts purchase", () => { expect(computePocketMoneyMetrics([makeRecord({ transaction_type: "purchase" })]).purchase_count).toBe(1); });
    it("counts savings_deposit", () => { expect(computePocketMoneyMetrics([makeRecord({ transaction_type: "savings_deposit" })]).savings_deposit_count).toBe(1); });
    it("counts declined", () => { expect(computePocketMoneyMetrics([makeRecord({ approval_status: "declined" })]).declined_count).toBe(1); });
    it("counts retrospective", () => { expect(computePocketMoneyMetrics([makeRecord({ approval_status: "retrospective" })]).retrospective_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computePocketMoneyMetrics([makeRecord()]);
      expect(m.receipt_obtained_rate).toBe(100);
      expect(m.child_chose_purchase_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.budget_discussed_rate).toBe(100);
      expect(m.savings_encouraged_rate).toBe(100);
      expect(m.value_for_money_rate).toBe(100);
      expect(m.financial_record_rate).toBe(100);
      expect(m.balance_reconciled_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.care_plan_linked_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("receipt_obtained_rate 0 when false", () => { expect(computePocketMoneyMetrics([makeRecord({ receipt_obtained: false })]).receipt_obtained_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computePocketMoneyMetrics([makeRecord({ receipt_obtained: true }), makeRecord({ receipt_obtained: false }), makeRecord({ receipt_obtained: true })]); expect(m.receipt_obtained_rate).toBe(66.7); });
    it("total_amount_pence sums", () => { expect(computePocketMoneyMetrics([makeRecord({ amount_pence: 500 }), makeRecord({ amount_pence: 750 })]).total_amount_pence).toBe(1250); });
    it("unique_children distinct", () => { const m = computePocketMoneyMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 transaction types", () => { const types = ["weekly_allowance","birthday_money","gift_money","earned_income","savings_deposit","savings_withdrawal","purchase","charitable_donation","refund","other"] as const; const records = types.map(t => makeRecord({ transaction_type: t })); const m = computePocketMoneyMetrics(records); for (const t of types) expect(m.by_transaction_type[t]).toBe(1); });
    it("counts all 10 spending categories", () => { const cats = ["clothing","food_treats","entertainment","electronics","hobbies","toiletries","transport","gifts_for_others","savings","other"] as const; const records = cats.map(c => makeRecord({ spending_category: c })); const m = computePocketMoneyMetrics(records); for (const c of cats) expect(m.by_spending_category[c]).toBe(1); });
    it("counts all 5 approval statuses", () => { const statuses = ["approved","pending","declined","not_required","retrospective"] as const; const records = statuses.map(s => makeRecord({ approval_status: s })); const m = computePocketMoneyMetrics(records); for (const s of statuses) expect(m.by_approval_status[s]).toBe(1); });
    it("counts all 5 financial literacy levels", () => { const levels = ["independent","supported","learning","needs_guidance","not_assessed"] as const; const records = levels.map(l => makeRecord({ financial_literacy_level: l })); const m = computePocketMoneyMetrics(records); for (const l of levels) expect(m.by_financial_literacy_level[l]).toBe(1); });
  });

  describe("identifyPocketMoneyAlerts", () => {
    it("returns empty for clean", () => { expect(identifyPocketMoneyAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyPocketMoneyAlerts([])).toEqual([]); });
    it("fires retrospective_no_receipt", () => { 
      const a = identifyPocketMoneyAlerts([makeRecord({ approval_status: "retrospective", receipt_obtained: false, child_name: "Jo", spending_category: "electronics" })]);
      expect(a[0].type).toBe("retrospective_no_receipt");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("electronics");
    });
    it("retrospective_no_receipt per-record", () => { const a = identifyPocketMoneyAlerts([makeRecord({ id: "a-1", approval_status: "retrospective", receipt_obtained: false }), makeRecord({ id: "a-2", approval_status: "retrospective", receipt_obtained: false })]); expect(a.filter(x => x.type === "retrospective_no_receipt")).toHaveLength(2); });
    it("no alert if retrospective with receipt", () => { expect(identifyPocketMoneyAlerts([makeRecord({ approval_status: "retrospective", receipt_obtained: true })]).filter(x => x.type === "retrospective_no_receipt")).toHaveLength(0); });
    it("fires balance_not_reconciled singular", () => { 
      const a = identifyPocketMoneyAlerts([makeRecord({ balance_reconciled: false })]);
      const f = a.find(x => x.type === "balance_not_reconciled");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 transaction has");
    });
    it("balance_not_reconciled plural", () => { const a = identifyPocketMoneyAlerts([makeRecord({ balance_reconciled: false }), makeRecord({ balance_reconciled: false })]); const f = a.find(x => x.type === "balance_not_reconciled"); expect(f!.message).toContain("2 transactions have"); });
    it("fires financial_record_not_updated singular", () => { const a = identifyPocketMoneyAlerts([makeRecord({ financial_record_updated: false })]); const f = a.find(x => x.type === "financial_record_not_updated"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); });
    it("budget_not_discussed not for 1", () => { expect(identifyPocketMoneyAlerts([makeRecord({ budget_discussed: false })]).find(x => x.type === "budget_not_discussed")).toBeUndefined(); });
    it("budget_not_discussed fires for 2", () => { const a = identifyPocketMoneyAlerts([makeRecord({ budget_discussed: false }), makeRecord({ budget_discussed: false })]); expect(a.find(x => x.type === "budget_not_discussed")).toBeDefined(); });
    it("receipts_missing not for 2", () => { expect(identifyPocketMoneyAlerts([makeRecord({ receipt_obtained: false }), makeRecord({ receipt_obtained: false })]).find(x => x.type === "receipts_missing")).toBeUndefined(); });
    it("receipts_missing fires for 3", () => { const a = identifyPocketMoneyAlerts([makeRecord({ receipt_obtained: false }), makeRecord({ receipt_obtained: false }), makeRecord({ receipt_obtained: false })]); expect(a.find(x => x.type === "receipts_missing")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyPocketMoneyAlerts([makeRecord({ approval_status: "retrospective", receipt_obtained: false, balance_reconciled: false, financial_record_updated: false, budget_discussed: false }), makeRecord({ budget_discussed: false, receipt_obtained: false }), makeRecord({ receipt_obtained: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("retrospective_no_receipt");
      expect(types).toContain("balance_not_reconciled");
      expect(types).toContain("financial_record_not_updated");
      expect(types).toContain("budget_not_discussed");
      expect(types).toContain("receipts_missing");
    });
  });
});
