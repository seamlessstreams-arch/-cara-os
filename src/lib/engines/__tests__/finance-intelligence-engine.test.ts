// ══════════════════════════════════════════════════════════════════════════════
// CARA — FINANCE INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeFinanceIntelligence,
  type PocketMoneyTransactionInput,
  type ClothingAllowanceInput,
  type ChildRef,
  type StaffRef,
  type FinanceEngineInput,
} from "../finance-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

function makeTransaction(overrides: Partial<PocketMoneyTransactionInput> = {}): PocketMoneyTransactionInput {
  return {
    id: "tx_test",
    child_id: "yp_alex",
    date: "2026-05-20",
    type: "spending",
    amount: 10,
    description: "Test transaction",
    category: "other",
    receipt_held: true,
    approved_by: "staff_darren",
    ...overrides,
  };
}

function makeClothingAllowance(overrides: Partial<ClothingAllowanceInput> = {}): ClothingAllowanceInput {
  return {
    id: "ca_test",
    child_id: "yp_alex",
    financial_year: "2025-2026",
    annual_budget: 600,
    quarterly_allowance: 150,
    current_quarter: 2,
    quarter_spend: 90,
    ytd_spend: 200,
    ...overrides,
  };
}

// ── Test Data ───────────────────────────────────────────────────────────────

const CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_ryan", name: "Ryan" },
];

const TODAY = "2026-05-25";

function buildOakHouseTransactions(): PocketMoneyTransactionInput[] {
  const txs: PocketMoneyTransactionInput[] = [];

  // Alex: 4 weekly allowances (£20 each)
  txs.push(makeTransaction({ id: "tx_alex_allow_1", child_id: "yp_alex", date: "2026-05-04", type: "allowance", amount: 20, description: "Weekly allowance", category: "allowance" }));
  txs.push(makeTransaction({ id: "tx_alex_allow_2", child_id: "yp_alex", date: "2026-05-11", type: "allowance", amount: 20, description: "Weekly allowance", category: "allowance" }));
  txs.push(makeTransaction({ id: "tx_alex_allow_3", child_id: "yp_alex", date: "2026-05-18", type: "allowance", amount: 20, description: "Weekly allowance", category: "allowance" }));
  txs.push(makeTransaction({ id: "tx_alex_allow_4", child_id: "yp_alex", date: "2026-05-25", type: "allowance", amount: 20, description: "Weekly allowance", category: "allowance" }));

  // Alex: 3 spending (clothing £35, entertainment £18, phone £15 = £68), all receipts held
  txs.push(makeTransaction({ id: "tx_alex_spend_1", child_id: "yp_alex", date: "2026-05-06", type: "spending", amount: 35, description: "New jacket", category: "clothing", receipt_held: true }));
  txs.push(makeTransaction({ id: "tx_alex_spend_2", child_id: "yp_alex", date: "2026-05-12", type: "spending", amount: 18, description: "Cinema trip", category: "entertainment", receipt_held: true }));
  txs.push(makeTransaction({ id: "tx_alex_spend_3", child_id: "yp_alex", date: "2026-05-19", type: "spending", amount: 15, description: "Phone top-up", category: "phone", receipt_held: true }));

  // Alex: 2 savings deposits (£10 each)
  txs.push(makeTransaction({ id: "tx_alex_save_1", child_id: "yp_alex", date: "2026-05-10", type: "savings_deposit", amount: 10, description: "Weekly savings", category: "savings" }));
  txs.push(makeTransaction({ id: "tx_alex_save_2", child_id: "yp_alex", date: "2026-05-17", type: "savings_deposit", amount: 10, description: "Weekly savings", category: "savings" }));

  // Jordan: 4 weekly allowances (£20 each)
  txs.push(makeTransaction({ id: "tx_jordan_allow_1", child_id: "yp_jordan", date: "2026-05-04", type: "allowance", amount: 20, description: "Weekly allowance", category: "allowance" }));
  txs.push(makeTransaction({ id: "tx_jordan_allow_2", child_id: "yp_jordan", date: "2026-05-11", type: "allowance", amount: 20, description: "Weekly allowance", category: "allowance" }));
  txs.push(makeTransaction({ id: "tx_jordan_allow_3", child_id: "yp_jordan", date: "2026-05-18", type: "allowance", amount: 20, description: "Weekly allowance", category: "allowance" }));
  txs.push(makeTransaction({ id: "tx_jordan_allow_4", child_id: "yp_jordan", date: "2026-05-25", type: "allowance", amount: 20, description: "Weekly allowance", category: "allowance" }));

  // Jordan: 5 spending (clothing £45, food £22, activities £30, entertainment £25, transport £12 = £134), 3/5 receipts
  txs.push(makeTransaction({ id: "tx_jordan_spend_1", child_id: "yp_jordan", date: "2026-05-05", type: "spending", amount: 45, description: "Trainers", category: "clothing", receipt_held: true }));
  txs.push(makeTransaction({ id: "tx_jordan_spend_2", child_id: "yp_jordan", date: "2026-05-08", type: "spending", amount: 22, description: "Takeaway", category: "food", receipt_held: false }));
  txs.push(makeTransaction({ id: "tx_jordan_spend_3", child_id: "yp_jordan", date: "2026-05-13", type: "spending", amount: 30, description: "Bowling", category: "activities", receipt_held: true }));
  txs.push(makeTransaction({ id: "tx_jordan_spend_4", child_id: "yp_jordan", date: "2026-05-20", type: "spending", amount: 25, description: "Gaming credit", category: "entertainment", receipt_held: false }));
  txs.push(makeTransaction({ id: "tx_jordan_spend_5", child_id: "yp_jordan", date: "2026-05-22", type: "spending", amount: 12, description: "Bus pass", category: "transport", receipt_held: true }));

  // Jordan: 1 savings deposit (£5)
  txs.push(makeTransaction({ id: "tx_jordan_save_1", child_id: "yp_jordan", date: "2026-05-15", type: "savings_deposit", amount: 5, description: "Savings", category: "savings" }));

  // Casey: 4 weekly allowances (£15 each)
  txs.push(makeTransaction({ id: "tx_casey_allow_1", child_id: "yp_casey", date: "2026-05-04", type: "allowance", amount: 15, description: "Weekly allowance", category: "allowance" }));
  txs.push(makeTransaction({ id: "tx_casey_allow_2", child_id: "yp_casey", date: "2026-05-11", type: "allowance", amount: 15, description: "Weekly allowance", category: "allowance" }));
  txs.push(makeTransaction({ id: "tx_casey_allow_3", child_id: "yp_casey", date: "2026-05-18", type: "allowance", amount: 15, description: "Weekly allowance", category: "allowance" }));
  txs.push(makeTransaction({ id: "tx_casey_allow_4", child_id: "yp_casey", date: "2026-05-25", type: "allowance", amount: 15, description: "Weekly allowance", category: "allowance" }));

  // Casey: 1 spending (food £8), receipt held
  txs.push(makeTransaction({ id: "tx_casey_spend_1", child_id: "yp_casey", date: "2026-05-14", type: "spending", amount: 8, description: "Snacks", category: "food", receipt_held: true }));

  // Casey: 3 savings deposits (£15 each)
  txs.push(makeTransaction({ id: "tx_casey_save_1", child_id: "yp_casey", date: "2026-05-05", type: "savings_deposit", amount: 15, description: "Weekly savings", category: "savings" }));
  txs.push(makeTransaction({ id: "tx_casey_save_2", child_id: "yp_casey", date: "2026-05-12", type: "savings_deposit", amount: 15, description: "Weekly savings", category: "savings" }));
  txs.push(makeTransaction({ id: "tx_casey_save_3", child_id: "yp_casey", date: "2026-05-19", type: "savings_deposit", amount: 15, description: "Weekly savings", category: "savings" }));

  return txs;
}

function buildOakHouseClothingAllowances(): ClothingAllowanceInput[] {
  return [
    makeClothingAllowance({ id: "ca_alex", child_id: "yp_alex", annual_budget: 600, quarterly_allowance: 150, current_quarter: 2, quarter_spend: 90, ytd_spend: 200 }),
    makeClothingAllowance({ id: "ca_jordan", child_id: "yp_jordan", annual_budget: 600, quarterly_allowance: 150, current_quarter: 2, quarter_spend: 280, ytd_spend: 280 }),
    makeClothingAllowance({ id: "ca_casey", child_id: "yp_casey", annual_budget: 600, quarterly_allowance: 150, current_quarter: 2, quarter_spend: 45, ytd_spend: 45 }),
  ];
}

function buildFullInput(): FinanceEngineInput {
  return {
    transactions: buildOakHouseTransactions(),
    clothing_allowances: buildOakHouseClothingAllowances(),
    children: CHILDREN,
    staff: STAFF,
    today: TODAY,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Finance Intelligence Engine", () => {
  // ── Overview ────────────────────────────────────────────────────────────
  describe("Overview", () => {
    it("calculates total_children correctly", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      expect(result.overview.total_children).toBe(3);
    });

    it("calculates total_allowances_monthly as sum of all allowance transactions in period", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      // Alex: 4x20=80, Jordan: 4x20=80, Casey: 4x15=60 = 220
      expect(result.overview.total_allowances_monthly).toBe(220);
    });

    it("calculates total_savings as net deposits minus withdrawals", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      // Alex: 10+10=20, Jordan: 5, Casey: 15+15+15=45 = 70
      expect(result.overview.total_savings).toBe(70);
    });

    it("calculates total_spending_this_period from spending transactions only", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      // Alex: 35+18+15=68, Jordan: 45+22+30+25+12=134, Casey: 8 = 210
      expect(result.overview.total_spending_this_period).toBe(210);
    });

    it("calculates receipt_compliance_rate from spending transactions with receipts", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      // 9 spending transactions total, 7 with receipts = 78% (rounded)
      expect(result.overview.receipt_compliance_rate).toBe(78);
    });

    it("calculates avg_spending_per_child", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      // 210 / 3 = 70
      expect(result.overview.avg_spending_per_child).toBe(70);
    });
  });

  // ── Child Spending Profiles ─────────────────────────────────────────────
  describe("Child Spending Profiles", () => {
    it("returns a profile for each child", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      expect(result.child_spending).toHaveLength(3);
    });

    it("calculates Alex total_spending correctly", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const alex = result.child_spending.find((p) => p.child_id === "yp_alex")!;
      expect(alex.total_spending).toBe(68);
    });

    it("calculates Alex total_savings correctly", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const alex = result.child_spending.find((p) => p.child_id === "yp_alex")!;
      expect(alex.total_savings).toBe(20);
    });

    it("calculates Alex monthly_allowance correctly", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const alex = result.child_spending.find((p) => p.child_id === "yp_alex")!;
      expect(alex.monthly_allowance).toBe(80);
    });

    it("marks Alex spending_above_average as false (68 < 70*1.15=80.5)", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const alex = result.child_spending.find((p) => p.child_id === "yp_alex")!;
      expect(alex.spending_above_average).toBe(false);
    });

    it("calculates Alex receipt_rate as 100%", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const alex = result.child_spending.find((p) => p.child_id === "yp_alex")!;
      expect(alex.receipt_rate).toBe(100);
    });

    it("calculates Alex transaction_count correctly", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const alex = result.child_spending.find((p) => p.child_id === "yp_alex")!;
      // 4 allowances + 3 spending + 2 savings = 9
      expect(alex.transaction_count).toBe(9);
    });

    it("calculates Jordan total_spending correctly", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const jordan = result.child_spending.find((p) => p.child_id === "yp_jordan")!;
      expect(jordan.total_spending).toBe(134);
    });

    it("calculates Jordan total_savings correctly", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const jordan = result.child_spending.find((p) => p.child_id === "yp_jordan")!;
      expect(jordan.total_savings).toBe(5);
    });

    it("marks Jordan spending_above_average as true (134 > 70*1.15=80.5)", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const jordan = result.child_spending.find((p) => p.child_id === "yp_jordan")!;
      expect(jordan.spending_above_average).toBe(true);
    });

    it("calculates Jordan receipt_rate as 60% (3/5)", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const jordan = result.child_spending.find((p) => p.child_id === "yp_jordan")!;
      expect(jordan.receipt_rate).toBe(60);
    });

    it("calculates Casey total_spending correctly", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const casey = result.child_spending.find((p) => p.child_id === "yp_casey")!;
      expect(casey.total_spending).toBe(8);
    });

    it("calculates Casey total_savings correctly", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const casey = result.child_spending.find((p) => p.child_id === "yp_casey")!;
      expect(casey.total_savings).toBe(45);
    });

    it("calculates Casey monthly_allowance correctly", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const casey = result.child_spending.find((p) => p.child_id === "yp_casey")!;
      expect(casey.monthly_allowance).toBe(60);
    });

    it("marks Casey spending_above_average as false (8 < 80.5)", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const casey = result.child_spending.find((p) => p.child_id === "yp_casey")!;
      expect(casey.spending_above_average).toBe(false);
    });
  });

  // ── Spending Categories ─────────────────────────────────────────────────
  describe("Spending Categories", () => {
    it("groups spending by category", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      expect(result.spending_categories.length).toBeGreaterThan(0);
    });

    it("sorts categories by total_amount descending", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      for (let i = 1; i < result.spending_categories.length; i++) {
        expect(result.spending_categories[i - 1].total_amount).toBeGreaterThanOrEqual(result.spending_categories[i].total_amount);
      }
    });

    it("calculates clothing category correctly (35+45=80)", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const clothing = result.spending_categories.find((c) => c.category === "clothing")!;
      expect(clothing.total_amount).toBe(80);
      expect(clothing.transaction_count).toBe(2);
    });

    it("calculates entertainment category correctly (18+25=43)", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const ent = result.spending_categories.find((c) => c.category === "entertainment")!;
      expect(ent.total_amount).toBe(43);
      expect(ent.transaction_count).toBe(2);
    });

    it("calculates food category correctly (22+8=30)", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const food = result.spending_categories.find((c) => c.category === "food")!;
      expect(food.total_amount).toBe(30);
      expect(food.transaction_count).toBe(2);
    });

    it("calculates percentage for clothing (80/210 = 38%)", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const clothing = result.spending_categories.find((c) => c.category === "clothing")!;
      expect(clothing.percentage).toBe(38);
    });

    it("includes all spending categories from test data", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const categories = result.spending_categories.map((c) => c.category).sort();
      expect(categories).toEqual(["activities", "clothing", "entertainment", "food", "phone", "transport"].sort());
    });
  });

  // ── Alerts ──────────────────────────────────────────────────────────────
  describe("Alerts", () => {
    it("generates high alert for Jordan spending more than double the average", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const highAlerts = result.alerts.filter((a) => a.severity === "high");
      // avg = 70, 2x = 140, Jordan = 134 — NOT more than double
      expect(highAlerts).toHaveLength(0);
    });

    it("generates high alert when child spends more than 2x average", () => {
      const input = buildFullInput();
      input.transactions.push(makeTransaction({ id: "tx_jordan_extra", child_id: "yp_jordan", date: "2026-05-23", type: "spending", amount: 50, category: "other", receipt_held: false }));
      const result = computeFinanceIntelligence(input);
      // New total spending = 260, avg = 86.67, 2x = 173.33, Jordan = 184 > 173.33
      const highAlerts = result.alerts.filter((a) => a.severity === "high");
      expect(highAlerts.length).toBeGreaterThanOrEqual(1);
      expect(highAlerts[0].message).toContain("Jordan");
    });

    it("generates medium alert for receipt compliance below 80%", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const receiptAlert = result.alerts.find((a) => a.message.includes("Receipt compliance"));
      expect(receiptAlert).toBeDefined();
      expect(receiptAlert!.severity).toBe("medium");
    });

    it("does not generate no-allowance alert when all children have allowances", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const noAllowanceAlerts = result.alerts.filter((a) => a.message.includes("No allowance recorded"));
      expect(noAllowanceAlerts).toHaveLength(0);
    });

    it("generates medium alert when child has no allowance in period", () => {
      const input = buildFullInput();
      input.transactions = input.transactions.filter((t) => !(t.child_id === "yp_casey" && t.type === "allowance"));
      const result = computeFinanceIntelligence(input);
      const noAllowanceAlert = result.alerts.find((a) => a.message.includes("No allowance recorded for Casey"));
      expect(noAllowanceAlert).toBeDefined();
      expect(noAllowanceAlert!.severity).toBe("medium");
    });

    it("generates medium alert for clothing budget exceeding 90%", () => {
      const input = buildFullInput();
      input.clothing_allowances = [
        makeClothingAllowance({ id: "ca_jordan_high", child_id: "yp_jordan", annual_budget: 600, ytd_spend: 550 }),
      ];
      const result = computeFinanceIntelligence(input);
      const clothingAlert = result.alerts.find((a) => a.message.includes("Clothing budget for Jordan"));
      expect(clothingAlert).toBeDefined();
      expect(clothingAlert!.severity).toBe("medium");
      expect(clothingAlert!.message).toContain("92%");
    });

    it("generates low alert for child with transactions but no spending", () => {
      const input: FinanceEngineInput = {
        transactions: [
          makeTransaction({ id: "tx_only_allow", child_id: "yp_alex", date: "2026-05-20", type: "allowance", amount: 20, category: "allowance" }),
        ],
        clothing_allowances: [],
        children: [{ id: "yp_alex", name: "Alex" }],
        staff: STAFF,
        today: TODAY,
      };
      const result = computeFinanceIntelligence(input);
      const lowAlert = result.alerts.find((a) => a.severity === "low" && a.message.includes("Alex"));
      expect(lowAlert).toBeDefined();
      expect(lowAlert!.message).toContain("no spending transactions");
    });
  });

  // ── Insights ────────────────────────────────────────────────────────────
  describe("Insights", () => {
    it("generates positive insight when all children have savings", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const savingsInsight = result.insights.find((i) => i.text.includes("actively saving"));
      expect(savingsInsight).toBeDefined();
      expect(savingsInsight!.severity).toBe("positive");
    });

    it("generates warning insight for receipt compliance below 80%", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const receiptInsight = result.insights.find((i) => i.text.includes("Receipt compliance is"));
      expect(receiptInsight).toBeDefined();
      expect(receiptInsight!.severity).toBe("warning");
    });

    it("generates positive insight when all allowances paid", () => {
      const result = computeFinanceIntelligence(buildFullInput());
      const allowanceInsight = result.insights.find((i) => i.text.includes("received their allowances"));
      expect(allowanceInsight).toBeDefined();
      expect(allowanceInsight!.severity).toBe("positive");
    });

    it("generates critical insight for child with no transactions", () => {
      const input: FinanceEngineInput = {
        transactions: [
          makeTransaction({ id: "tx_1", child_id: "yp_alex", date: "2026-05-20", type: "allowance", amount: 20, category: "allowance" }),
        ],
        clothing_allowances: [],
        children: [{ id: "yp_alex", name: "Alex" }, { id: "yp_jordan", name: "Jordan" }],
        staff: STAFF,
        today: TODAY,
      };
      const result = computeFinanceIntelligence(input);
      const criticalInsight = result.insights.find((i) => i.severity === "critical" && i.text.includes("Jordan"));
      expect(criticalInsight).toBeDefined();
      expect(criticalInsight!.text).toContain("no financial transactions");
    });

    it("generates warning insight for high-spending child", () => {
      const input = buildFullInput();
      input.transactions.push(makeTransaction({ id: "tx_jordan_huge", child_id: "yp_jordan", date: "2026-05-23", type: "spending", amount: 50, category: "other", receipt_held: false }));
      const result = computeFinanceIntelligence(input);
      const spendInsight = result.insights.find((i) => i.severity === "warning" && i.text.includes("Jordan") && i.text.includes("above average"));
      expect(spendInsight).toBeDefined();
    });

    it("generates warning insight for clothing budget near exhaustion", () => {
      const input = buildFullInput();
      input.clothing_allowances = [
        makeClothingAllowance({ id: "ca_alex_high", child_id: "yp_alex", annual_budget: 600, ytd_spend: 560 }),
      ];
      const result = computeFinanceIntelligence(input);
      const clothingInsight = result.insights.find((i) => i.severity === "warning" && i.text.includes("Clothing budget for Alex"));
      expect(clothingInsight).toBeDefined();
    });

    it("generates positive insight for receipt compliance >= 90%", () => {
      const input: FinanceEngineInput = {
        transactions: [
          makeTransaction({ id: "tx_1", child_id: "yp_alex", date: "2026-05-20", type: "spending", amount: 10, receipt_held: true, category: "food" }),
          makeTransaction({ id: "tx_2", child_id: "yp_alex", date: "2026-05-21", type: "spending", amount: 15, receipt_held: true, category: "clothing" }),
          makeTransaction({ id: "tx_3", child_id: "yp_alex", date: "2026-05-22", type: "allowance", amount: 20, category: "allowance" }),
          makeTransaction({ id: "tx_4", child_id: "yp_alex", date: "2026-05-20", type: "savings_deposit", amount: 5, category: "savings" }),
        ],
        clothing_allowances: [],
        children: [{ id: "yp_alex", name: "Alex" }],
        staff: STAFF,
        today: TODAY,
      };
      const result = computeFinanceIntelligence(input);
      const receiptInsight = result.insights.find((i) => i.text.includes("exceeds regulatory expectations"));
      expect(receiptInsight).toBeDefined();
      expect(receiptInsight!.severity).toBe("positive");
    });
  });

  // ── Empty State ─────────────────────────────────────────────────────────
  describe("Empty State", () => {
    it("handles no transactions gracefully", () => {
      const result = computeFinanceIntelligence({
        transactions: [],
        clothing_allowances: [],
        children: CHILDREN,
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.total_spending_this_period).toBe(0);
      expect(result.overview.total_allowances_monthly).toBe(0);
      expect(result.overview.total_savings).toBe(0);
      expect(result.overview.receipt_compliance_rate).toBeNull();
      expect(result.overview.avg_spending_per_child).toBe(0);
    });

    it("returns empty spending_categories when no spending", () => {
      const result = computeFinanceIntelligence({
        transactions: [],
        clothing_allowances: [],
        children: CHILDREN,
        staff: STAFF,
        today: TODAY,
      });
      expect(result.spending_categories).toHaveLength(0);
    });

    it("generates critical insights for all children with no transactions", () => {
      const result = computeFinanceIntelligence({
        transactions: [],
        clothing_allowances: [],
        children: CHILDREN,
        staff: STAFF,
        today: TODAY,
      });
      const criticals = result.insights.filter((i) => i.severity === "critical");
      expect(criticals).toHaveLength(3);
    });

    it("handles no children gracefully", () => {
      const result = computeFinanceIntelligence({
        transactions: [],
        clothing_allowances: [],
        children: [],
        staff: STAFF,
        today: TODAY,
      });
      expect(result.overview.total_children).toBe(0);
      expect(result.child_spending).toHaveLength(0);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────
  describe("Edge Cases", () => {
    it("ignores transactions outside the 30-day period", () => {
      const input: FinanceEngineInput = {
        transactions: [
          makeTransaction({ id: "tx_old", child_id: "yp_alex", date: "2026-04-01", type: "spending", amount: 100, category: "clothing" }),
          makeTransaction({ id: "tx_recent", child_id: "yp_alex", date: "2026-05-20", type: "spending", amount: 25, category: "food", receipt_held: true }),
          makeTransaction({ id: "tx_allow", child_id: "yp_alex", date: "2026-05-20", type: "allowance", amount: 20, category: "allowance" }),
        ],
        clothing_allowances: [],
        children: [{ id: "yp_alex", name: "Alex" }],
        staff: STAFF,
        today: TODAY,
      };
      const result = computeFinanceIntelligence(input);
      expect(result.overview.total_spending_this_period).toBe(25);
    });

    it("only counts spending transactions for receipt rate (not allowances, savings)", () => {
      const input: FinanceEngineInput = {
        transactions: [
          makeTransaction({ id: "tx_allow", child_id: "yp_alex", date: "2026-05-20", type: "allowance", amount: 20, receipt_held: false, category: "allowance" }),
          makeTransaction({ id: "tx_save", child_id: "yp_alex", date: "2026-05-20", type: "savings_deposit", amount: 10, receipt_held: false, category: "savings" }),
          makeTransaction({ id: "tx_spend", child_id: "yp_alex", date: "2026-05-20", type: "spending", amount: 5, receipt_held: true, category: "food" }),
        ],
        clothing_allowances: [],
        children: [{ id: "yp_alex", name: "Alex" }],
        staff: STAFF,
        today: TODAY,
      };
      const result = computeFinanceIntelligence(input);
      expect(result.overview.receipt_compliance_rate).toBe(100);
    });

    it("handles savings withdrawals reducing total savings", () => {
      const input: FinanceEngineInput = {
        transactions: [
          makeTransaction({ id: "tx_dep", child_id: "yp_alex", date: "2026-05-10", type: "savings_deposit", amount: 50, category: "savings" }),
          makeTransaction({ id: "tx_wth", child_id: "yp_alex", date: "2026-05-20", type: "savings_withdrawal", amount: 30, category: "savings" }),
          makeTransaction({ id: "tx_allow", child_id: "yp_alex", date: "2026-05-20", type: "allowance", amount: 20, category: "allowance" }),
        ],
        clothing_allowances: [],
        children: [{ id: "yp_alex", name: "Alex" }],
        staff: STAFF,
        today: TODAY,
      };
      const result = computeFinanceIntelligence(input);
      expect(result.overview.total_savings).toBe(20);
      const alex = result.child_spending.find((p) => p.child_id === "yp_alex")!;
      expect(alex.total_savings).toBe(20);
    });

    it("includes transaction on the boundary date (today)", () => {
      const input: FinanceEngineInput = {
        transactions: [
          makeTransaction({ id: "tx_today", child_id: "yp_alex", date: "2026-05-25", type: "spending", amount: 10, category: "food", receipt_held: true }),
          makeTransaction({ id: "tx_allow", child_id: "yp_alex", date: "2026-05-25", type: "allowance", amount: 20, category: "allowance" }),
        ],
        clothing_allowances: [],
        children: [{ id: "yp_alex", name: "Alex" }],
        staff: STAFF,
        today: TODAY,
      };
      const result = computeFinanceIntelligence(input);
      expect(result.overview.total_spending_this_period).toBe(10);
    });

    it("includes transaction on the start boundary (30 days ago)", () => {
      const input: FinanceEngineInput = {
        transactions: [
          makeTransaction({ id: "tx_boundary", child_id: "yp_alex", date: "2026-04-25", type: "spending", amount: 10, category: "food", receipt_held: true }),
          makeTransaction({ id: "tx_allow", child_id: "yp_alex", date: "2026-04-25", type: "allowance", amount: 20, category: "allowance" }),
        ],
        clothing_allowances: [],
        children: [{ id: "yp_alex", name: "Alex" }],
        staff: STAFF,
        today: TODAY,
      };
      const result = computeFinanceIntelligence(input);
      expect(result.overview.total_spending_this_period).toBe(10);
    });

    it("defaults today to current date if not provided", () => {
      const result = computeFinanceIntelligence({
        transactions: [],
        clothing_allowances: [],
        children: [],
        staff: [],
      });
      expect(result.overview.total_children).toBe(0);
    });

    it("does not generate spending_above_average when avg is 0", () => {
      const input: FinanceEngineInput = {
        transactions: [
          makeTransaction({ id: "tx_allow", child_id: "yp_alex", date: "2026-05-20", type: "allowance", amount: 20, category: "allowance" }),
        ],
        clothing_allowances: [],
        children: [{ id: "yp_alex", name: "Alex" }],
        staff: STAFF,
        today: TODAY,
      };
      const result = computeFinanceIntelligence(input);
      const alex = result.child_spending.find((p) => p.child_id === "yp_alex")!;
      expect(alex.spending_above_average).toBe(false);
    });

    it("leaves receipt_rate unmeasured for child with no spending", () => {
      const input: FinanceEngineInput = {
        transactions: [
          makeTransaction({ id: "tx_allow", child_id: "yp_alex", date: "2026-05-20", type: "allowance", amount: 20, category: "allowance" }),
        ],
        clothing_allowances: [],
        children: [{ id: "yp_alex", name: "Alex" }],
        staff: STAFF,
        today: TODAY,
      };
      const result = computeFinanceIntelligence(input);
      const alex = result.child_spending.find((p) => p.child_id === "yp_alex")!;
      expect(alex.receipt_rate).toBeNull();
    });
  });
});
