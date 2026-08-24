import { describe, it, expect } from "vitest";
import {
  computeHomeFinancial,
  type HomeFinancialInput,
  type FinancialTransactionInput,
  type ClothingAllowanceInput,
} from "../home-financial-wellbeing-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeTransaction(overrides: Partial<FinancialTransactionInput> = {}): FinancialTransactionInput {
  return {
    child_id: "child_1",
    date: "2025-06-01",
    type: "allowance",
    amount: 20,
    category: "allowance",
    receipt_held: false,
    has_approval: true,
    ...overrides,
  };
}

function makeClothing(overrides: Partial<ClothingAllowanceInput> = {}): ClothingAllowanceInput {
  return {
    child_id: "child_1",
    annual_budget: 600,
    ytd_spend: 240,
    quarterly_allowance: 150,
    quarter_spend: 90,
    current_quarter: 2,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeFinancialInput> = {}): HomeFinancialInput {
  return {
    today: "2025-06-15",
    transactions: [],
    clothing_allowances: [],
    ...overrides,
  };
}

/** Generate weekly allowance transactions for a child within the 90-day window */
function weeklyAllowances(childId: string, weeks: number, amount = 20): FinancialTransactionInput[] {
  const txns: FinancialTransactionInput[] = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date("2025-06-15");
    d.setDate(d.getDate() - (i * 7 + 1));
    txns.push(makeTransaction({
      child_id: childId,
      date: d.toISOString().slice(0, 10),
      type: "allowance",
      amount,
      category: "allowance",
    }));
  }
  return txns;
}

function makeSpending(childId: string, date: string, amount: number, category: string, receipt = true): FinancialTransactionInput {
  return makeTransaction({
    child_id: childId,
    date,
    type: "spending",
    amount,
    category,
    receipt_held: receipt,
  });
}

function makeSavings(childId: string, date: string, amount: number): FinancialTransactionInput {
  return makeTransaction({
    child_id: childId,
    date,
    type: "savings_deposit",
    amount,
    category: "savings",
  });
}

// ═════════════════════════════════════════════════════════════════════════════

describe("computeHomeFinancial", () => {
  // ── Insufficient Data ──────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data with 0 transactions and 0 clothing", () => {
      const r = computeHomeFinancial(baseInput());
      expect(r.financial_rating).toBe("insufficient_data");
      expect(r.financial_score).toBe(0);
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns insufficient_data when all transactions outside 90-day window", () => {
      const r = computeHomeFinancial(baseInput({
        transactions: [makeTransaction({ date: "2024-01-01" })],
      }));
      expect(r.financial_rating).toBe("insufficient_data");
    });

    it("does NOT return insufficient_data with only clothing data", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [makeClothing()],
      }));
      expect(r.financial_rating).not.toBe("insufficient_data");
    });

    it("does NOT return insufficient_data with only transactions", () => {
      const r = computeHomeFinancial(baseInput({
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.financial_rating).not.toBe("insufficient_data");
    });
  });

  // ── Rating Boundaries ─────────────────────────────────────────────

  describe("rating boundaries", () => {
    it("returns outstanding when all metrics excellent", () => {
      // 3 children, each 10 weekly allowances, spending with receipts across 4+ categories,
      // savings deposits, good clothing, all approved, equitable amounts
      // Score trace: 52 + 5(reg) + 4(receipt) + 3(approval) + 4(savings) + 3(diversity) + 3(clothing) + 3(budget) + 3(equity) = 80
      const txns: FinancialTransactionInput[] = [
        ...weeklyAllowances("child_1", 10, 20),
        ...weeklyAllowances("child_2", 10, 20),
        ...weeklyAllowances("child_3", 10, 20),
        // Spending with receipts in 4+ categories
        makeSpending("child_1", "2025-06-01", 15, "clothing", true),
        makeSpending("child_1", "2025-05-20", 12, "entertainment", true),
        makeSpending("child_2", "2025-05-25", 18, "food", true),
        makeSpending("child_2", "2025-06-05", 10, "phone", true),
        makeSpending("child_3", "2025-05-15", 8, "activities", true),
        // Savings from all 3 children
        makeSavings("child_1", "2025-06-01", 10),
        makeSavings("child_1", "2025-05-24", 10),
        makeSavings("child_2", "2025-06-03", 15),
        makeSavings("child_3", "2025-05-28", 10),
      ];
      const r = computeHomeFinancial(baseInput({
        transactions: txns,
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 240 }),  // 80% util
          makeClothing({ child_id: "child_2", ytd_spend: 250 }),  // 83% util
          makeClothing({ child_id: "child_3", ytd_spend: 200 }),  // 67% util
        ],
      }));
      expect(r.financial_rating).toBe("outstanding");
      expect(r.financial_score).toBe(80);
    });

    it("returns good with solid but not perfect metrics", () => {
      // 3 children, regular allowances, some receipts missing, 1/3 saving, OK clothing
      // Score trace: 52 + 5(reg) + 2(receipt~70%) + 1(approval~80%) + 2(savings 33%) + 1(2 cat) + 3(clothing) + 3(budget) + 3(equity) = 72
      const txns: FinancialTransactionInput[] = [
        ...weeklyAllowances("child_1", 10, 20),
        ...weeklyAllowances("child_2", 10, 20),
        ...weeklyAllowances("child_3", 10, 20),
        // 10 spending: 7 with receipts (70%)
        makeSpending("child_1", "2025-06-01", 15, "clothing", true),
        makeSpending("child_1", "2025-05-20", 12, "entertainment", true),
        makeSpending("child_2", "2025-05-25", 18, "clothing", true),
        makeSpending("child_2", "2025-06-05", 10, "entertainment", true),
        makeSpending("child_3", "2025-05-15", 8, "clothing", true),
        makeSpending("child_3", "2025-06-10", 6, "entertainment", true),
        makeSpending("child_1", "2025-06-12", 20, "clothing", true),
        makeSpending("child_2", "2025-06-13", 14, "entertainment", false),
        makeSpending("child_3", "2025-06-14", 9, "clothing", false),
        makeSpending("child_1", "2025-05-30", 11, "clothing", false),
        // 1 child saving, plus some unapproved txns
        makeSavings("child_1", "2025-06-01", 10),
        // Make ~80% approval: 30 allowances + 10 spending + 1 savings = 41 total, all approved by default = 100%
        // Adjust: set some to unapproved
        makeTransaction({ child_id: "child_1", date: "2025-05-10", type: "spending", amount: 5, category: "phone", receipt_held: false, has_approval: false }),
        makeTransaction({ child_id: "child_2", date: "2025-05-12", type: "spending", amount: 7, category: "phone", receipt_held: false, has_approval: false }),
        makeTransaction({ child_id: "child_3", date: "2025-05-14", type: "spending", amount: 3, category: "phone", receipt_held: false, has_approval: false }),
      ];
      const r = computeHomeFinancial(baseInput({
        transactions: txns,
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 200 }),
          makeClothing({ child_id: "child_2", ytd_spend: 180 }),
          makeClothing({ child_id: "child_3", ytd_spend: 190 }),
        ],
      }));
      expect(r.financial_rating).toBe("good");
      expect(r.financial_score).toBeGreaterThanOrEqual(65);
      expect(r.financial_score).toBeLessThan(80);
    });

    it("returns adequate with mixed metrics", () => {
      // 2 children, 1 regular 1 not, poor receipts, no savings, some clothing issues
      // 52 + 2(reg 50%) - 3(receipt<60%) + 1(approval~75%) - 2(savings 0%) + 1(2 cat) + 1(clothing~35%) + 1(overPace=1) + 3(equity) = 56
      const txns: FinancialTransactionInput[] = [
        ...weeklyAllowances("child_1", 10, 20),      // regular
        ...weeklyAllowances("child_2", 4, 20),        // not regular (4 < 8)
        // 8 spending: 4 with receipts (50%)
        makeSpending("child_1", "2025-06-01", 15, "clothing", true),
        makeSpending("child_1", "2025-05-20", 12, "food", true),
        makeSpending("child_2", "2025-05-25", 18, "clothing", true),
        makeSpending("child_2", "2025-06-05", 10, "food", true),
        makeSpending("child_1", "2025-06-10", 8, "clothing", false),
        makeSpending("child_2", "2025-06-12", 6, "food", false),
        makeSpending("child_1", "2025-05-28", 14, "clothing", false),
        makeSpending("child_2", "2025-05-30", 11, "food", false),
        // Some unapproved
        makeTransaction({ child_id: "child_1", date: "2025-05-15", type: "spending", amount: 5, category: "phone", receipt_held: false, has_approval: false }),
        makeTransaction({ child_id: "child_2", date: "2025-05-18", type: "spending", amount: 7, category: "phone", receipt_held: false, has_approval: false }),
        makeTransaction({ child_id: "child_1", date: "2025-06-08", type: "spending", amount: 3, category: "phone", receipt_held: false, has_approval: false }),
        makeTransaction({ child_id: "child_2", date: "2025-06-09", type: "spending", amount: 4, category: "phone", receipt_held: false, has_approval: false }),
      ];
      const r = computeHomeFinancial(baseInput({
        transactions: txns,
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 100 }),   // 33% util
          makeClothing({ child_id: "child_2", ytd_spend: 350 }),   // 117% util - over pace
        ],
      }));
      expect(r.financial_rating).toBe("adequate");
      expect(r.financial_score).toBeGreaterThanOrEqual(45);
      expect(r.financial_score).toBeLessThan(65);
    });

    it("returns inadequate with poor metrics across the board", () => {
      // Only spending, no allowances, poor receipts, no savings, bad clothing
      const txns: FinancialTransactionInput[] = [
        // No allowances — spending only
        makeSpending("child_1", "2025-06-01", 50, "clothing", false),
        makeSpending("child_1", "2025-05-20", 30, "clothing", false),
        makeSpending("child_2", "2025-05-25", 40, "clothing", false),
        makeSpending("child_2", "2025-06-05", 25, "clothing", true),
        makeSpending("child_1", "2025-06-10", 15, "clothing", false),
        // Some unapproved
        makeTransaction({ child_id: "child_1", date: "2025-05-15", type: "spending", amount: 20, category: "clothing", receipt_held: false, has_approval: false }),
        makeTransaction({ child_id: "child_2", date: "2025-05-18", type: "spending", amount: 15, category: "clothing", receipt_held: false, has_approval: false }),
        makeTransaction({ child_id: "child_1", date: "2025-06-08", type: "spending", amount: 10, category: "clothing", receipt_held: false, has_approval: false }),
      ];
      const r = computeHomeFinancial(baseInput({
        transactions: txns,
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 60 }),    // 20% util
          makeClothing({ child_id: "child_2", ytd_spend: 350 }),   // 117% over pace
          makeClothing({ child_id: "child_3", ytd_spend: 360 }),   // 120% over pace
        ],
      }));
      expect(r.financial_rating).toBe("inadequate");
      expect(r.financial_score).toBeLessThan(45);
    });
  });

  // ── Allowance Regularity ──────────────────────────────────────────

  describe("allowance regularity", () => {
    it("gives full bonus when all children have 8+ allowances", () => {
      const txns = [
        ...weeklyAllowances("child_1", 10),
        ...weeklyAllowances("child_2", 10),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.allowance_profile.regularity_rate).toBe(100);
    });

    it("gives partial bonus when 50-79% regular", () => {
      // 2 children: 1 with 10 allowances (regular), 1 with 4 (not regular)
      const txns = [
        ...weeklyAllowances("child_1", 10),
        ...weeklyAllowances("child_2", 4),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.allowance_profile.regularity_rate).toBe(50);
    });

    it("penalises when less than 50% regular", () => {
      // 3 children: 1 regular, 2 not regular
      const txns = [
        ...weeklyAllowances("child_1", 10),
        ...weeklyAllowances("child_2", 3),
        ...weeklyAllowances("child_3", 2),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.allowance_profile.regularity_rate).toBe(33);
    });

    it("applies penalty with only clothing data and no transactions", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [makeClothing()],
      }));
      // No transactions at all — mild penalty on allowance regularity
      // but clothing bonuses offset it: 52 - 2(no allow) + 1(no spend) - 2(no save) + 3(util) + 3(budget) = 55
      expect(r.allowance_profile.children_count).toBe(0);
      expect(r.financial_score).toBe(55);
    });
  });

  // ── Receipt Compliance ────────────────────────────────────────────

  describe("receipt compliance", () => {
    it("full bonus at 80%+ receipts", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 10, "food", true),
        makeSpending("child_1", "2025-06-02", 10, "food", true),
        makeSpending("child_1", "2025-06-03", 10, "food", true),
        makeSpending("child_1", "2025-06-04", 10, "food", true),
        makeSpending("child_1", "2025-06-05", 10, "food", false),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.spending_profile.receipt_rate).toBe(80);
    });

    it("partial bonus at 60-79%", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 10, "food", true),
        makeSpending("child_1", "2025-06-02", 10, "food", true),
        makeSpending("child_1", "2025-06-03", 10, "food", true),
        makeSpending("child_1", "2025-06-04", 10, "food", false),
        makeSpending("child_1", "2025-06-05", 10, "food", false),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.spending_profile.receipt_rate).toBe(60);
    });

    it("penalty below 60%", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 10, "food", true),
        makeSpending("child_1", "2025-06-02", 10, "food", false),
        makeSpending("child_1", "2025-06-03", 10, "food", false),
        makeSpending("child_1", "2025-06-04", 10, "food", false),
        makeSpending("child_1", "2025-06-05", 10, "food", false),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.spending_profile.receipt_rate).toBe(20);
    });

    it("small bonus when no spending transactions", () => {
      // Only allowances, no spending → receipt branch gives +1
      const r = computeHomeFinancial(baseInput({
        transactions: weeklyAllowances("child_1", 3),
      }));
      expect(r.spending_profile.receipt_rate).toBeNull();
      expect(r.spending_profile.total_spending_90d).toBe(0);
    });
  });

  // ── Approval Rate ─────────────────────────────────────────────────

  describe("approval rate", () => {
    it("full bonus at 90%+ approval", () => {
      const txns = Array.from({ length: 10 }, (_, i) =>
        makeTransaction({ date: "2025-06-01", has_approval: i < 9 ? true : true }),
      );
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.spending_profile.approval_rate).toBe(100);
    });

    it("partial bonus at 70-89%", () => {
      const txns = [
        ...Array.from({ length: 8 }, () => makeTransaction({ date: "2025-06-01", has_approval: true })),
        ...Array.from({ length: 2 }, () => makeTransaction({ date: "2025-06-01", has_approval: false })),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.spending_profile.approval_rate).toBe(80);
    });

    it("penalty below 70%", () => {
      const txns = [
        ...Array.from({ length: 5 }, () => makeTransaction({ date: "2025-06-01", has_approval: true })),
        ...Array.from({ length: 5 }, () => makeTransaction({ date: "2025-06-01", has_approval: false })),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.spending_profile.approval_rate).toBe(50);
    });
  });

  // ── Savings Engagement ────────────────────────────────────────────

  describe("savings engagement", () => {
    it("full bonus at 60%+ participation", () => {
      // 3 children, 2 saving
      const txns = [
        ...weeklyAllowances("child_1", 3),
        ...weeklyAllowances("child_2", 3),
        ...weeklyAllowances("child_3", 3),
        makeSavings("child_1", "2025-06-01", 10),
        makeSavings("child_2", "2025-06-02", 10),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.savings_profile.savings_participation_rate).toBe(67);
    });

    it("partial bonus at 30-59%", () => {
      // 3 children, 1 saving
      const txns = [
        ...weeklyAllowances("child_1", 3),
        ...weeklyAllowances("child_2", 3),
        ...weeklyAllowances("child_3", 3),
        makeSavings("child_1", "2025-06-01", 10),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.savings_profile.savings_participation_rate).toBe(33);
    });

    it("small bonus with any savings when below 30%", () => {
      // 5 children, 1 saving (20%)
      const txns = [
        ...weeklyAllowances("child_1", 3),
        ...weeklyAllowances("child_2", 3),
        ...weeklyAllowances("child_3", 3),
        ...weeklyAllowances("child_4", 3),
        ...weeklyAllowances("child_5", 3),
        makeSavings("child_1", "2025-06-01", 10),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.savings_profile.savings_participation_rate).toBe(20);
      expect(r.savings_profile.children_saving).toBe(1);
    });

    it("penalty with 0 savings", () => {
      const txns = weeklyAllowances("child_1", 3);
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.savings_profile.children_saving).toBe(0);
      expect(r.savings_profile.savings_participation_rate).toBe(0);
    });
  });

  // ── Spending Diversity ────────────────────────────────────────────

  describe("spending diversity", () => {
    it("full bonus at 4+ categories", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 10, "clothing"),
        makeSpending("child_1", "2025-06-02", 10, "food"),
        makeSpending("child_1", "2025-06-03", 10, "entertainment"),
        makeSpending("child_1", "2025-06-04", 10, "phone"),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.spending_profile.category_count).toBe(4);
    });

    it("partial bonus at 2-3 categories", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 10, "clothing"),
        makeSpending("child_1", "2025-06-02", 10, "food"),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.spending_profile.category_count).toBe(2);
    });

    it("penalty with single category spending", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 10, "clothing"),
        makeSpending("child_1", "2025-06-02", 10, "clothing"),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.spending_profile.category_count).toBe(1);
    });
  });

  // ── Clothing Utilization ──────────────────────────────────────────

  describe("clothing utilization", () => {
    it("full bonus at 40-100% utilization", () => {
      // annual_budget=600, current_quarter=2 → expected=300, ytd_spend=240 → 80%
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [makeClothing({ ytd_spend: 240 })],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.clothing_profile.avg_budget_utilization).toBe(80);
    });

    it("partial bonus at 25-39% or 101-110%", () => {
      // ytd_spend=90 → 90/300 = 30%
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [makeClothing({ ytd_spend: 90 })],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.clothing_profile.avg_budget_utilization).toBe(30);
    });

    it("penalty outside range", () => {
      // ytd_spend=50 → 50/300 = 17%
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [makeClothing({ ytd_spend: 50 })],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.clothing_profile.avg_budget_utilization).toBe(17);
    });
  });

  // ── Budget Pace ───────────────────────────────────────────────────

  describe("budget pace compliance", () => {
    it("full bonus with 0 over pace", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 200 }),  // 67%
          makeClothing({ child_id: "child_2", ytd_spend: 250 }),  // 83%
        ],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.clothing_profile.over_pace_count).toBe(0);
    });

    it("partial bonus with 1 over pace", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 200 }),  // 67%
          makeClothing({ child_id: "child_2", ytd_spend: 350 }),  // 117% → over
        ],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.clothing_profile.over_pace_count).toBe(1);
    });

    it("penalty with 2+ over pace", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 400 }),  // 133% → over
          makeClothing({ child_id: "child_2", ytd_spend: 350 }),  // 117% → over
        ],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.clothing_profile.over_pace_count).toBe(2);
    });
  });

  // ── Under-Utilization ─────────────────────────────────────────────

  describe("under-utilization", () => {
    it("detects children with less than 30% utilization", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 60 }),   // 20% → under
          makeClothing({ child_id: "child_2", ytd_spend: 200 }),  // 67% → fine
        ],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.clothing_profile.under_utilization_count).toBe(1);
    });
  });

  // ── Equity ────────────────────────────────────────────────────────

  describe("equity", () => {
    it("full bonus when allowance ratio <= 1.5", () => {
      // Both children get £20/week × 10 = £200 each → ratio 1.0
      const txns = [
        ...weeklyAllowances("child_1", 10, 20),
        ...weeklyAllowances("child_2", 10, 20),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      // Ratio = 200/200 = 1.0 → +3
      expect(r.financial_score).toBeGreaterThanOrEqual(52);
    });

    it("partial bonus when ratio 1.5-2.0", () => {
      // child_1: £20×10 = £200, child_2: £12×10 = £120 → ratio 200/120 = 1.67
      const txns = [
        ...weeklyAllowances("child_1", 10, 20),
        ...weeklyAllowances("child_2", 10, 12),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      // Should still be adequate or better
      expect(r.financial_rating).not.toBe("insufficient_data");
    });

    it("penalty when ratio > 2.0", () => {
      // child_1: £30×10 = £300, child_2: £10×10 = £100 → ratio 3.0
      const txns = [
        ...weeklyAllowances("child_1", 10, 30),
        ...weeklyAllowances("child_2", 10, 10),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      // Should generate equity insight
      expect(r.insights.some(i => i.text.includes("variation in pocket money"))).toBe(true);
    });

    it("small bonus with single child", () => {
      const txns = weeklyAllowances("child_1", 10);
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      // Single child → equity +1 bonus
      expect(r.financial_rating).not.toBe("insufficient_data");
    });
  });

  // ── Profiles ──────────────────────────────────────────────────────

  describe("profiles", () => {
    it("computes allowance profile correctly", () => {
      // 2 children, each 4 allowances of £20 in 90 days
      const txns = [
        ...weeklyAllowances("child_1", 4, 20),
        ...weeklyAllowances("child_2", 4, 20),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.allowance_profile.children_count).toBe(2);
      expect(r.allowance_profile.total_allowances_90d).toBe(160); // 8 × £20
    });

    it("computes spending profile correctly", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 25, "food", true),
        makeSpending("child_1", "2025-06-05", 15, "clothing", false),
        makeSpending("child_2", "2025-06-03", 30, "entertainment", true),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.spending_profile.total_spending_90d).toBe(70);
      expect(r.spending_profile.receipt_rate).toBe(67);
      expect(r.spending_profile.category_count).toBe(3);
      expect(r.spending_profile.avg_per_child_90d).toBe(35); // 70/2
    });

    it("computes savings profile correctly", () => {
      const txns = [
        ...weeklyAllowances("child_1", 3),
        ...weeklyAllowances("child_2", 3),
        ...weeklyAllowances("child_3", 3),
        makeSavings("child_1", "2025-06-01", 10),
        makeSavings("child_1", "2025-05-25", 10),
        makeSavings("child_2", "2025-06-02", 15),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.savings_profile.children_saving).toBe(2);
      expect(r.savings_profile.savings_participation_rate).toBe(67);
      expect(r.savings_profile.total_deposits_90d).toBe(35);
    });

    it("computes clothing profile correctly", () => {
      // child_1: expected=300, ytd=240 → 80%, child_2: expected=300, ytd=350 → 117%
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 240 }),
          makeClothing({ child_id: "child_2", ytd_spend: 350 }),
        ],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.clothing_profile.children_tracked).toBe(2);
      expect(r.clothing_profile.avg_budget_utilization).toBe(98); // (80+116.67)/2 ≈ 98
      expect(r.clothing_profile.over_pace_count).toBe(1);
      expect(r.clothing_profile.under_utilization_count).toBe(0);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────

  describe("strengths", () => {
    it("generates regularity strength when all children receive regular pocket money", () => {
      const txns = [
        ...weeklyAllowances("child_1", 10),
        ...weeklyAllowances("child_2", 10),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.strengths.some(s => s.includes("regular pocket money"))).toBe(true);
    });

    it("generates receipt strength at 80%+", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 10, "food", true),
        makeSpending("child_1", "2025-06-02", 10, "food", true),
        makeSpending("child_1", "2025-06-03", 10, "food", true),
        makeSpending("child_1", "2025-06-04", 10, "food", true),
        makeSpending("child_1", "2025-06-05", 10, "food", false),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.strengths.some(s => s.includes("receipt compliance"))).toBe(true);
    });

    it("generates savings strength at 60%+ participation", () => {
      const txns = [
        ...weeklyAllowances("child_1", 3),
        ...weeklyAllowances("child_2", 3),
        makeSavings("child_1", "2025-06-01", 10),
        makeSavings("child_2", "2025-06-02", 10),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.strengths.some(s => s.includes("actively saving"))).toBe(true);
    });

    it("generates clothing budget strength", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 240 }),
          makeClothing({ child_id: "child_2", ytd_spend: 200 }),
        ],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.strengths.some(s => s.includes("within clothing budget"))).toBe(true);
    });

    it("generates spending diversity strength at 4+ categories", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 10, "clothing"),
        makeSpending("child_1", "2025-06-02", 10, "food"),
        makeSpending("child_1", "2025-06-03", 10, "entertainment"),
        makeSpending("child_1", "2025-06-04", 10, "transport"),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.strengths.some(s => s.includes("categories"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags inconsistent allowances when regularity < 50%", () => {
      const txns = [
        ...weeklyAllowances("child_1", 10),
        ...weeklyAllowances("child_2", 2),
        ...weeklyAllowances("child_3", 2),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.concerns.some(c => c.includes("inconsistent allowance"))).toBe(true);
    });

    it("flags missing allowances when only spending exists", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 20, "food"),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.concerns.some(c => c.includes("No pocket money allowance records"))).toBe(true);
    });

    it("flags poor receipt compliance", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 10, "food", false),
        makeSpending("child_1", "2025-06-02", 10, "food", false),
        makeSpending("child_1", "2025-06-03", 10, "food", true),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.concerns.some(c => c.includes("receipts"))).toBe(true);
    });

    it("flags no savings activity", () => {
      const txns = weeklyAllowances("child_1", 5);
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.concerns.some(c => c.includes("savings activity"))).toBe(true);
    });

    it("flags over-budget children", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [makeClothing({ ytd_spend: 400 })],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.concerns.some(c => c.includes("exceeding clothing budget"))).toBe(true);
    });

    it("flags under-utilization of clothing budget", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [makeClothing({ ytd_spend: 50 })],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.concerns.some(c => c.includes("less than 30% of clothing budget"))).toBe(true);
    });

    it("flags poor approval rate", () => {
      const txns = [
        ...Array.from({ length: 3 }, () => makeTransaction({ date: "2025-06-01", has_approval: true })),
        ...Array.from({ length: 7 }, () => makeTransaction({ date: "2025-06-01", has_approval: false })),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.concerns.some(c => c.includes("approval"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends establishing pocket money when no allowances", () => {
      const txns = [makeSpending("child_1", "2025-06-01", 20, "food")];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("pocket money payment schedule"))).toBe(true);
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("recommends improving receipts when compliance low", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 10, "food", false),
        makeSpending("child_1", "2025-06-02", 10, "food", false),
        makeSpending("child_1", "2025-06-03", 10, "food", true),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("receipt collection"))).toBe(true);
    });

    it("recommends savings encouragement when participation low", () => {
      const txns = weeklyAllowances("child_1", 5);
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("savings"))).toBe(true);
    });

    it("recommends budget review when multiple children over pace", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 400 }),
          makeClothing({ child_id: "child_2", ytd_spend: 380 }),
        ],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("clothing budget monitoring"))).toBe(true);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates outstanding financial wellbeing insight", () => {
      const txns = [
        ...weeklyAllowances("child_1", 10),
        ...weeklyAllowances("child_2", 10),
        makeSpending("child_1", "2025-06-01", 10, "food", true),
        makeSpending("child_1", "2025-06-02", 10, "clothing", true),
        makeSpending("child_1", "2025-06-03", 10, "food", true),
        makeSpending("child_2", "2025-06-04", 10, "clothing", true),
        makeSpending("child_2", "2025-06-05", 10, "food", true),
        makeSavings("child_1", "2025-06-01", 10),
        makeSavings("child_2", "2025-06-02", 10),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("generates no savings warning insight", () => {
      const txns = weeklyAllowances("child_1", 5);
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.insights.some(i => i.text.includes("No children are currently saving"))).toBe(true);
    });

    it("generates poor receipt compliance insight when 5+ spending with <50% receipts", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 10, "food", false),
        makeSpending("child_1", "2025-06-02", 10, "food", false),
        makeSpending("child_1", "2025-06-03", 10, "food", false),
        makeSpending("child_1", "2025-06-04", 10, "food", true),
        makeSpending("child_1", "2025-06-05", 10, "food", false),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.insights.some(i => i.text.includes("receipts"))).toBe(true);
    });

    it("generates over-budget insight", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [makeClothing({ ytd_spend: 400 })],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.insights.some(i => i.text.includes("clothing budget pace"))).toBe(true);
    });

    it("generates equity warning insight when ratio > 2.0", () => {
      const txns = [
        ...weeklyAllowances("child_1", 10, 30),
        ...weeklyAllowances("child_2", 10, 10),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.insights.some(i => i.text.includes("variation in pocket money"))).toBe(true);
    });

    it("does NOT generate equity warning when ratio <= 2.0", () => {
      const txns = [
        ...weeklyAllowances("child_1", 10, 20),
        ...weeklyAllowances("child_2", 10, 15),
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.insights.every(i => !i.text.includes("variation in pocket money"))).toBe(true);
    });
  });

  // ── Headline ──────────────────────────────────────────────────────

  describe("headline", () => {
    it("uses outstanding headline for outstanding rating", () => {
      const txns = [
        ...weeklyAllowances("child_1", 10),
        ...weeklyAllowances("child_2", 10),
        ...weeklyAllowances("child_3", 10),
        makeSpending("child_1", "2025-06-01", 10, "clothing", true),
        makeSpending("child_2", "2025-06-02", 10, "food", true),
        makeSpending("child_3", "2025-06-03", 10, "entertainment", true),
        makeSpending("child_1", "2025-06-04", 10, "phone", true),
        makeSavings("child_1", "2025-06-01", 10),
        makeSavings("child_2", "2025-06-02", 10),
        makeSavings("child_3", "2025-06-03", 10),
      ];
      const r = computeHomeFinancial(baseInput({
        transactions: txns,
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 240 }),
          makeClothing({ child_id: "child_2", ytd_spend: 200 }),
          makeClothing({ child_id: "child_3", ytd_spend: 220 }),
        ],
      }));
      expect(r.headline).toContain("Outstanding financial wellbeing");
    });

    it("uses inadequate headline for inadequate rating", () => {
      const txns = [
        makeSpending("child_1", "2025-06-01", 50, "clothing", false),
        makeSpending("child_1", "2025-06-02", 30, "clothing", false),
        makeTransaction({ child_id: "child_1", date: "2025-06-03", type: "spending", amount: 20, category: "clothing", receipt_held: false, has_approval: false }),
        makeTransaction({ child_id: "child_1", date: "2025-06-04", type: "spending", amount: 15, category: "clothing", receipt_held: false, has_approval: false }),
        makeTransaction({ child_id: "child_1", date: "2025-06-05", type: "spending", amount: 10, category: "clothing", receipt_held: false, has_approval: false }),
      ];
      const r = computeHomeFinancial(baseInput({
        transactions: txns,
        clothing_allowances: [
          makeClothing({ child_id: "child_1", ytd_spend: 50 }),
          makeClothing({ child_id: "child_2", ytd_spend: 400 }),
          makeClothing({ child_id: "child_3", ytd_spend: 380 }),
        ],
      }));
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── 90-Day Window ─────────────────────────────────────────────────

  describe("90-day window", () => {
    it("excludes transactions outside 90-day window", () => {
      const txns = [
        makeTransaction({ date: "2025-06-01", type: "allowance", amount: 20 }),
        makeTransaction({ date: "2024-01-01", type: "allowance", amount: 20 }),   // outside window
        makeTransaction({ date: "2025-01-01", type: "allowance", amount: 20 }),   // outside window
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.allowance_profile.total_allowances_90d).toBe(20); // only 1 within window
    });

    it("includes transactions exactly at the 90-day boundary", () => {
      // today = 2025-06-15, cutoff = 2025-03-17
      const txns = [
        makeTransaction({ date: "2025-03-17", type: "allowance", amount: 20 }),
        makeTransaction({ date: "2025-03-16", type: "allowance", amount: 20 }),   // outside
      ];
      const r = computeHomeFinancial(baseInput({ transactions: txns }));
      expect(r.allowance_profile.total_allowances_90d).toBe(20);
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles clothing with current_quarter 0 gracefully", () => {
      const r = computeHomeFinancial(baseInput({
        clothing_allowances: [makeClothing({ current_quarter: 0 })],
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      // expected = 600 * (0/4) = 0, utilization = 0
      expect(r.clothing_profile.avg_budget_utilization).toBe(0);
    });

    it("handles single transaction", () => {
      const r = computeHomeFinancial(baseInput({
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.financial_rating).not.toBe("insufficient_data");
      expect(r.allowance_profile.children_count).toBe(1);
    });

    it("score is clamped to 0-100", () => {
      const r = computeHomeFinancial(baseInput({
        transactions: [makeTransaction({ date: "2025-06-01" })],
      }));
      expect(r.financial_score).toBeGreaterThanOrEqual(0);
      expect(r.financial_score).toBeLessThanOrEqual(100);
    });
  });
});
