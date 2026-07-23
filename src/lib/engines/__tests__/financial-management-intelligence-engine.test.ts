// ══════════════════════════════════════════════════════════════════════════════
// CARA — FINANCIAL MANAGEMENT INTELLIGENCE ENGINE — TESTS
//
// Comprehensive test suite for the financial management intelligence engine.
// Reg 40 (financial management), SCCIF governance indicators.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeFinancialManagementIntelligence,
  daysBetween,
  average,
  type ExpenseInput,
  type ExpenseCategory,
  type ExpenseStatus,
  type StaffRef,
  type FinancialManagementIntelligenceInput,
} from "../financial-management-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

// ── Factory Helpers ─────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `exp_${++_id}`;
}

function makeExpense(overrides: Partial<ExpenseInput> = {}): ExpenseInput {
  const id = overrides.id ?? uid();
  return {
    id,
    submitted_by: "staff_1",
    category: "food_shopping",
    description: "Test expense",
    amount: 50,
    receipt_url: "#",
    date: "2026-05-20",
    status: "submitted",
    approved_by: null,
    approved_at: null,
    linked_child_id: null,
    payment_method: "house card",
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeStaff(overrides: Partial<StaffRef> = {}): StaffRef {
  return {
    id: "staff_1",
    name: "Test Staff",
    ...overrides,
  };
}

const STAFF: StaffRef[] = [
  { id: "staff_ryan", name: "Ryan Clarke" },
  { id: "staff_sarah", name: "Sarah Thompson" },
  { id: "staff_darren", name: "Darren Laville" },
  { id: "staff_priya", name: "Priya Patel" },
  { id: "staff_marcus", name: "Marcus Williams" },
  { id: "staff_gemma", name: "Gemma Foster" },
];

function run(
  expenses: ExpenseInput[] = [],
  staff: StaffRef[] = STAFF,
  today: string = TODAY,
) {
  return computeFinancialManagementIntelligence({ expenses, staff, today });
}

// ── Helper Tests ────────────────────────────────────────────────────────────

describe("helpers", () => {
  it("daysBetween calculates correctly", () => {
    expect(daysBetween("2026-05-01", "2026-05-10")).toBe(9);
  });

  it("daysBetween returns 0 for same date", () => {
    expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
  });

  it("average returns 0 for empty array", () => {
    expect(average([])).toBe(0);
  });

  it("average computes correctly", () => {
    expect(average([2, 4, 6])).toBe(4);
  });
});

// ── Empty State ─────────────────────────────────────────────────────────────

describe("empty state", () => {
  it("returns zeroed overview with no expenses", () => {
    const r = run([]);
    expect(r.overview.total_expenses).toBe(0);
    expect(r.overview.total_spend).toBe(0);
    expect(r.overview.pending_approval).toBe(0);
    expect(r.overview.missing_receipts).toBe(0);
    expect(r.overview.avg_expense_amount).toBe(0);
    expect(r.overview.avg_approval_days).toBeNull();
    expect(r.category_spend).toHaveLength(0);
    expect(r.staff_spend).toHaveLength(0);
    expect(r.alerts).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ── Overview ────────────────────────────────────────────────────────────────

describe("overview", () => {
  it("counts total expenses", () => {
    const r = run([makeExpense(), makeExpense(), makeExpense()]);
    expect(r.overview.total_expenses).toBe(3);
  });

  it("sums total spend", () => {
    const r = run([
      makeExpense({ amount: 100 }),
      makeExpense({ amount: 50.50 }),
    ]);
    expect(r.overview.total_spend).toBe(150.5);
  });

  it("counts pending approvals (submitted status only)", () => {
    const r = run([
      makeExpense({ status: "submitted" }),
      makeExpense({ status: "submitted" }),
      makeExpense({ status: "approved" }),
      makeExpense({ status: "draft" }),
    ]);
    expect(r.overview.pending_approval).toBe(2);
  });

  it("sums pending approval amount", () => {
    const r = run([
      makeExpense({ status: "submitted", amount: 25 }),
      makeExpense({ status: "submitted", amount: 75 }),
      makeExpense({ status: "approved", amount: 200 }),
    ]);
    expect(r.overview.pending_approval_amount).toBe(100);
  });

  it("counts approved, rejected, paid, draft", () => {
    const r = run([
      makeExpense({ status: "approved" }),
      makeExpense({ status: "approved" }),
      makeExpense({ status: "rejected" }),
      makeExpense({ status: "paid" }),
      makeExpense({ status: "paid" }),
      makeExpense({ status: "paid" }),
      makeExpense({ status: "draft" }),
    ]);
    expect(r.overview.approved_count).toBe(2);
    expect(r.overview.rejected_count).toBe(1);
    expect(r.overview.paid_count).toBe(3);
    expect(r.overview.draft_count).toBe(1);
  });

  it("counts missing receipts on non-draft expenses", () => {
    const r = run([
      makeExpense({ status: "submitted", receipt_url: null }),
      makeExpense({ status: "approved", receipt_url: null }),
      makeExpense({ status: "draft", receipt_url: null }), // draft → not counted
      makeExpense({ status: "paid", receipt_url: "#" }),    // has receipt
    ]);
    expect(r.overview.missing_receipts).toBe(2);
  });

  it("calculates child-linked spend", () => {
    const r = run([
      makeExpense({ amount: 30, linked_child_id: "yp_1" }),
      makeExpense({ amount: 70, linked_child_id: "yp_2" }),
      makeExpense({ amount: 100, linked_child_id: null }),
    ]);
    expect(r.overview.child_linked_spend).toBe(100);
    expect(r.overview.child_linked_count).toBe(2);
  });

  it("calculates approval rate as pct of decided expenses", () => {
    // decided = approved + rejected + paid
    // approved_or_paid = approved + paid
    const r = run([
      makeExpense({ status: "approved" }),
      makeExpense({ status: "paid" }),
      makeExpense({ status: "rejected" }),
      makeExpense({ status: "rejected" }),
      makeExpense({ status: "submitted" }), // not decided yet
    ]);
    // 2 approved_or_paid / 4 decided = 50%
    expect(r.overview.approval_rate).toBe(50);
  });

  it("approval rate is unmeasured when no decided expenses", () => {
    const r = run([
      makeExpense({ status: "submitted" }),
      makeExpense({ status: "draft" }),
    ]);
    expect(r.overview.approval_rate).toBeNull();
  });

  it("calculates average expense amount", () => {
    const r = run([
      makeExpense({ amount: 100 }),
      makeExpense({ amount: 200 }),
      makeExpense({ amount: 300 }),
    ]);
    expect(r.overview.avg_expense_amount).toBe(200);
  });

  it("calculates average approval days", () => {
    const r = run([
      makeExpense({
        status: "approved",
        created_at: "2026-05-20",
        approved_at: "2026-05-22",
      }),
      makeExpense({
        status: "paid",
        created_at: "2026-05-18",
        approved_at: "2026-05-22",
      }),
    ]);
    // (2 + 4) / 2 = 3
    expect(r.overview.avg_approval_days).toBe(3);
  });
});

// ── Category Spend ──────────────────────────────────────────────────────────

describe("category spend", () => {
  it("groups by category and sums amounts", () => {
    const r = run([
      makeExpense({ category: "food_shopping", amount: 100 }),
      makeExpense({ category: "food_shopping", amount: 50 }),
      makeExpense({ category: "training", amount: 75 }),
    ]);
    expect(r.category_spend).toHaveLength(2);
    const food = r.category_spend.find((c) => c.category === "food_shopping")!;
    expect(food.total_amount).toBe(150);
    expect(food.count).toBe(2);
  });

  it("calculates pct of total spend", () => {
    const r = run([
      makeExpense({ category: "food_shopping", amount: 200 }),
      makeExpense({ category: "training", amount: 200 }),
    ]);
    const food = r.category_spend.find((c) => c.category === "food_shopping")!;
    expect(food.pct_of_total).toBe(50);
  });

  it("sorts by highest spend first", () => {
    const r = run([
      makeExpense({ category: "training", amount: 50 }),
      makeExpense({ category: "food_shopping", amount: 200 }),
      makeExpense({ category: "transport", amount: 100 }),
    ]);
    expect(r.category_spend[0].category).toBe("food_shopping");
    expect(r.category_spend[1].category).toBe("transport");
    expect(r.category_spend[2].category).toBe("training");
  });

  it("counts pending and missing receipts per category", () => {
    const r = run([
      makeExpense({ category: "food_shopping", status: "submitted", receipt_url: null }),
      makeExpense({ category: "food_shopping", status: "submitted", receipt_url: "#" }),
      makeExpense({ category: "food_shopping", status: "approved", receipt_url: "#" }),
    ]);
    const food = r.category_spend.find((c) => c.category === "food_shopping")!;
    expect(food.pending_count).toBe(2);
    expect(food.missing_receipts).toBe(1);
  });

  it("excludes draft receipts from missing count", () => {
    const r = run([
      makeExpense({ category: "petty_cash", status: "draft", receipt_url: null }),
    ]);
    const pc = r.category_spend.find((c) => c.category === "petty_cash")!;
    expect(pc.missing_receipts).toBe(0);
  });
});

// ── Staff Spend ─────────────────────────────────────────────────────────────

describe("staff spend", () => {
  it("groups by staff and sums amounts", () => {
    const r = run([
      makeExpense({ submitted_by: "staff_ryan", amount: 100 }),
      makeExpense({ submitted_by: "staff_ryan", amount: 50 }),
      makeExpense({ submitted_by: "staff_sarah", amount: 200 }),
    ]);
    expect(r.staff_spend).toHaveLength(2);
    const ryan = r.staff_spend.find((s) => s.staff_id === "staff_ryan")!;
    expect(ryan.total_amount).toBe(150);
    expect(ryan.count).toBe(2);
    expect(ryan.staff_name).toBe("Ryan Clarke");
  });

  it("sorts by highest spend first", () => {
    const r = run([
      makeExpense({ submitted_by: "staff_ryan", amount: 50 }),
      makeExpense({ submitted_by: "staff_sarah", amount: 200 }),
    ]);
    expect(r.staff_spend[0].staff_id).toBe("staff_sarah");
  });

  it("counts pending and missing receipts per staff member", () => {
    const r = run([
      makeExpense({ submitted_by: "staff_ryan", status: "submitted", receipt_url: null }),
      makeExpense({ submitted_by: "staff_ryan", status: "approved", receipt_url: "#" }),
    ]);
    const ryan = r.staff_spend.find((s) => s.staff_id === "staff_ryan")!;
    expect(ryan.pending_count).toBe(1);
    expect(ryan.missing_receipts).toBe(1);
  });

  it("falls back to staff_id when name not in staffMap", () => {
    const r = run(
      [makeExpense({ submitted_by: "staff_unknown", amount: 10 })],
      [], // no staff refs
    );
    const unknown = r.staff_spend.find((s) => s.staff_id === "staff_unknown")!;
    expect(unknown.staff_name).toBe("staff_unknown");
  });
});

// ── Alerts ──────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("critical: expenses pending >7 days", () => {
    const r = run([
      makeExpense({ status: "submitted", created_at: "2026-05-10" }), // 15 days
    ]);
    const critical = r.alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].message).toContain("pending approval for more than 7 days");
  });

  it("no critical alert when pending <7 days", () => {
    const r = run([
      makeExpense({ status: "submitted", created_at: "2026-05-20" }), // 5 days
    ]);
    const critical = r.alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(0);
  });

  it("high: missing receipts", () => {
    const r = run([
      makeExpense({ status: "submitted", receipt_url: null }),
    ]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("without receipts"));
    expect(high).toHaveLength(1);
  });

  it("high: single expense over £150", () => {
    const r = run([
      makeExpense({ amount: 200, status: "submitted" }),
    ]);
    const high = r.alerts.filter((a) => a.severity === "high" && a.message.includes("over £150"));
    expect(high).toHaveLength(1);
  });

  it("no high-value alert for draft expenses over £150", () => {
    const r = run([
      makeExpense({ amount: 200, status: "draft" }),
    ]);
    const high = r.alerts.filter((a) => a.message.includes("over £150"));
    expect(high).toHaveLength(0);
  });

  it("medium: pending amount over £100", () => {
    const r = run([
      makeExpense({ status: "submitted", amount: 60 }),
      makeExpense({ status: "submitted", amount: 60 }),
    ]);
    const med = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("awaiting approval"));
    expect(med).toHaveLength(1);
  });

  it("medium: draft expenses not submitted", () => {
    const r = run([
      makeExpense({ status: "draft" }),
    ]);
    const med = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("draft"));
    expect(med).toHaveLength(1);
  });

  it("low: no young person activities spend", () => {
    const r = run([
      makeExpense({ category: "food_shopping" }),
      makeExpense({ category: "training" }),
    ]);
    const low = r.alerts.filter((a) => a.severity === "low");
    expect(low).toHaveLength(1);
    expect(low[0].message).toContain("young person activities");
  });

  it("no low alert when YP activities exist", () => {
    const r = run([
      makeExpense({ category: "young_person_activities" }),
    ]);
    const low = r.alerts.filter((a) => a.message.includes("young person activities"));
    expect(low).toHaveLength(0);
  });

  it("no low alert when no expenses at all", () => {
    const r = run([]);
    const low = r.alerts.filter((a) => a.severity === "low");
    expect(low).toHaveLength(0);
  });
});

// ── Cara Insights ───────────────────────────────────────────────────────────

describe("Cara insights", () => {
  it("critical: stale approvals", () => {
    const r = run([
      makeExpense({ status: "submitted", created_at: "2026-05-10" }),
    ]);
    const critical = r.insights.filter((i) => i.severity === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].text).toContain("awaiting approval for more than 7 days");
  });

  it("warning: missing receipts percentage", () => {
    const r = run([
      makeExpense({ status: "submitted", receipt_url: null }),
      makeExpense({ status: "submitted", receipt_url: "#" }),
      makeExpense({ status: "approved", receipt_url: "#" }),
    ]);
    const warnings = r.insights.filter((i) => i.severity === "warning" && i.text.includes("missing receipts"));
    expect(warnings).toHaveLength(1);
    // 1 of 3 non-draft = 33%
    expect(warnings[0].text).toContain("33%");
  });

  it("warning: low approval rate", () => {
    const r = run([
      makeExpense({ status: "approved" }),
      makeExpense({ status: "rejected" }),
      makeExpense({ status: "rejected" }),
      makeExpense({ status: "rejected" }),
    ]);
    // 1 approved / 4 decided = 25%
    const warnings = r.insights.filter((i) => i.text.includes("approval rate"));
    expect(warnings).toHaveLength(1);
    expect(warnings[0].text).toContain("25%");
  });

  it("no approval rate warning when rate >= 80%", () => {
    const r = run([
      makeExpense({ status: "approved" }),
      makeExpense({ status: "approved" }),
      makeExpense({ status: "approved" }),
      makeExpense({ status: "approved" }),
      makeExpense({ status: "rejected" }),
    ]);
    // 4/5 = 80%
    const warnings = r.insights.filter((i) => i.text.includes("approval rate"));
    expect(warnings).toHaveLength(0);
  });

  it("positive: child-linked spending", () => {
    const r = run([
      makeExpense({ amount: 60, linked_child_id: "yp_1" }),
      makeExpense({ amount: 40, linked_child_id: null }),
    ]);
    const pos = r.insights.filter((i) => i.severity === "positive" && i.text.includes("linked directly"));
    expect(pos).toHaveLength(1);
    expect(pos[0].text).toContain("60%");
  });

  it("positive: all receipts present", () => {
    const r = run([
      makeExpense({ status: "submitted", receipt_url: "#" }),
      makeExpense({ status: "approved", receipt_url: "#" }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("All") && i.text.includes("receipts"));
    expect(pos).toHaveLength(1);
  });

  it("no all-receipts positive when some are missing", () => {
    const r = run([
      makeExpense({ status: "submitted", receipt_url: null }),
      makeExpense({ status: "approved", receipt_url: "#" }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("All") && i.text.includes("receipts"));
    expect(pos).toHaveLength(0);
  });

  it("positive: fast approval turnaround ≤2 days", () => {
    const r = run([
      makeExpense({ status: "approved", created_at: "2026-05-23", approved_at: "2026-05-24" }),
      makeExpense({ status: "paid", created_at: "2026-05-22", approved_at: "2026-05-24" }),
    ]);
    // avg = (1+2)/2 = 1.5 → rounds to 2
    const pos = r.insights.filter((i) => i.text.includes("turnaround"));
    expect(pos).toHaveLength(1);
  });

  it("positive: no stale pending (submitted but all <7 days)", () => {
    const r = run([
      makeExpense({ status: "submitted", created_at: "2026-05-20" }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("No expenses pending for more than 7 days"));
    expect(pos).toHaveLength(1);
  });

  it("positive: diverse spending categories ≥4", () => {
    const r = run([
      makeExpense({ category: "food_shopping" }),
      makeExpense({ category: "training" }),
      makeExpense({ category: "transport" }),
      makeExpense({ category: "clothing" }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("categories"));
    expect(pos).toHaveLength(1);
    expect(pos[0].text).toContain("4 categories");
  });

  it("no diversity insight when <4 categories", () => {
    const r = run([
      makeExpense({ category: "food_shopping" }),
      makeExpense({ category: "training" }),
    ]);
    const pos = r.insights.filter((i) => i.text.includes("categories"));
    expect(pos).toHaveLength(0);
  });
});

// ── Chamberlain House Integration ───────────────────────────────────────────────────

describe("Chamberlain House integration", () => {
  // Mirrors the 7 seeded expenses from store.ts
  const oakExpenses: ExpenseInput[] = [
    {
      id: "exp_1", submitted_by: "staff_ryan", category: "young_person_activities",
      description: "Cinema trip for Tyler and Jordan", amount: 28.50,
      receipt_url: "#", date: "2026-05-22", status: "submitted",
      approved_by: null, approved_at: null, linked_child_id: "yp_tyler",
      payment_method: "personal card", created_at: "2026-05-22",
    },
    {
      id: "exp_2", submitted_by: "staff_sarah", category: "food_shopping",
      description: "Weekly food shop", amount: 142.80,
      receipt_url: "#", date: "2026-05-20", status: "approved",
      approved_by: "staff_darren", approved_at: "2026-05-21",
      linked_child_id: null, payment_method: "house card", created_at: "2026-05-20",
    },
    {
      id: "exp_3", submitted_by: "staff_darren", category: "training",
      description: "Level 7 study materials", amount: 95.00,
      receipt_url: "#", date: "2026-05-15", status: "approved",
      approved_by: "staff_alicia", approved_at: "2026-05-16",
      linked_child_id: null, payment_method: "personal card", created_at: "2026-05-15",
    },
    {
      id: "exp_4", submitted_by: "staff_priya", category: "transport",
      description: "Mileage — hospital appointment with Ayo", amount: 27.90,
      receipt_url: null, date: "2026-05-18", status: "submitted",
      approved_by: null, approved_at: null, linked_child_id: "yp_ayo",
      payment_method: "mileage", created_at: "2026-05-18",
    },
    {
      id: "exp_5", submitted_by: "staff_marcus", category: "maintenance",
      description: "Emergency plumber call-out", amount: 185.00,
      receipt_url: "#", date: "2026-05-11", status: "paid",
      approved_by: "staff_darren", approved_at: "2026-05-12",
      linked_child_id: null, payment_method: "house card", created_at: "2026-05-11",
    },
    {
      id: "exp_6", submitted_by: "staff_gemma", category: "clothing",
      description: "School uniform and shoes for Jordan", amount: 67.40,
      receipt_url: "#", date: "2026-05-24", status: "submitted",
      approved_by: null, approved_at: null, linked_child_id: "yp_jordan",
      payment_method: "personal card", created_at: "2026-05-24",
    },
    {
      id: "exp_7", submitted_by: "staff_ryan", category: "petty_cash",
      description: "Haircut for Tyler", amount: 15.00,
      receipt_url: null, date: "2026-05-23", status: "draft",
      approved_by: null, approved_at: null, linked_child_id: "yp_tyler",
      payment_method: "petty cash", created_at: "2026-05-23",
    },
  ];

  it("produces correct overview for Chamberlain House expense data", () => {
    const r = run(oakExpenses, STAFF);
    const o = r.overview;

    // Total: 28.50 + 142.80 + 95 + 27.90 + 185 + 67.40 + 15 = 561.60
    expect(o.total_expenses).toBe(7);
    expect(o.total_spend).toBe(561.6);

    // Submitted: exp_1, exp_4, exp_6 = 3
    expect(o.pending_approval).toBe(3);
    // 28.50 + 27.90 + 67.40 = 123.80
    expect(o.pending_approval_amount).toBe(123.8);

    // Approved: exp_2, exp_3 = 2. Rejected: 0. Paid: exp_5 = 1. Draft: exp_7 = 1
    expect(o.approved_count).toBe(2);
    expect(o.rejected_count).toBe(0);
    expect(o.paid_count).toBe(1);
    expect(o.draft_count).toBe(1);

    // Missing receipts on non-draft: exp_4 (submitted, no receipt) = 1
    expect(o.missing_receipts).toBe(1);

    // Child-linked: exp_1 (28.50) + exp_4 (27.90) + exp_6 (67.40) + exp_7 (15.00) = 138.80
    expect(o.child_linked_spend).toBe(138.8);
    expect(o.child_linked_count).toBe(4);

    // Decided: approved(2) + rejected(0) + paid(1) = 3. Approved or paid = 3. Rate = 100%
    expect(o.approval_rate).toBe(100);

    // Avg amount: 561.60 / 7 = 80.2285... → round2 = 80.23
    expect(o.avg_expense_amount).toBe(80.23);

    // Approval days: exp_2 (20→21=1d), exp_3 (15→16=1d), exp_5 (11→12=1d). Avg = 1
    expect(o.avg_approval_days).toBe(1);
  });

  it("produces correct category breakdown for Chamberlain House", () => {
    const r = run(oakExpenses, STAFF);
    // 7 unique categories: young_person_activities, food_shopping, training, transport, maintenance, clothing, petty_cash
    expect(r.category_spend).toHaveLength(7);
    // Highest: maintenance at £185
    expect(r.category_spend[0].category).toBe("maintenance");
    expect(r.category_spend[0].total_amount).toBe(185);
  });

  it("produces correct staff breakdown for Chamberlain House", () => {
    const r = run(oakExpenses, STAFF);
    // 6 unique staff members (Ryan submits 2, but 6 distinct submitters)
    expect(r.staff_spend).toHaveLength(6);
    // Marcus highest at £185
    expect(r.staff_spend[0].staff_id).toBe("staff_marcus");
    expect(r.staff_spend[0].total_amount).toBe(185);
    // Ryan: 28.50 + 15.00 = 43.50
    const ryan = r.staff_spend.find((s) => s.staff_id === "staff_ryan")!;
    expect(ryan.total_amount).toBe(43.5);
    expect(ryan.count).toBe(2);
  });

  it("fires expected alerts for Chamberlain House data", () => {
    const r = run(oakExpenses, STAFF);

    // exp_4 submitted on May 18, today May 25 = 7 days → NOT >7 → no critical
    // Actually daysBetween("2026-05-18","2026-05-25") = 7 which is NOT > 7
    const criticals = r.alerts.filter((a) => a.severity === "critical");
    expect(criticals).toHaveLength(0);

    // Missing receipts: 1 (exp_4) → high alert
    const missingAlert = r.alerts.filter((a) => a.message.includes("without receipts"));
    expect(missingAlert).toHaveLength(1);

    // High-value: exp_5 £185 > £150 → alert
    const highVal = r.alerts.filter((a) => a.message.includes("over £150"));
    expect(highVal).toHaveLength(1);

    // Pending amount £123.80 > £100 → medium
    const pendingMed = r.alerts.filter((a) => a.message.includes("awaiting approval"));
    expect(pendingMed).toHaveLength(1);

    // 1 draft → medium
    const draftMed = r.alerts.filter((a) => a.message.includes("draft"));
    expect(draftMed).toHaveLength(1);
  });

  it("fires expected Cara insights for Chamberlain House data", () => {
    const r = run(oakExpenses, STAFF);

    // No stale approvals → no critical insight
    const criticals = r.insights.filter((i) => i.severity === "critical");
    expect(criticals).toHaveLength(0);

    // 1 missing receipt of 6 non-draft = 17% → warning
    const missingW = r.insights.filter((i) => i.text.includes("missing receipts"));
    expect(missingW).toHaveLength(1);

    // Child-linked positive: 138.80 / 561.60 = 24.7% → 25%
    const childPos = r.insights.filter((i) => i.text.includes("linked directly"));
    expect(childPos).toHaveLength(1);

    // Fast turnaround: avg 1 day ≤ 2 → positive
    const fastPos = r.insights.filter((i) => i.text.includes("turnaround"));
    expect(fastPos).toHaveLength(1);

    // No stale pending → positive
    const noPendPos = r.insights.filter((i) => i.text.includes("No expenses pending"));
    expect(noPendPos).toHaveLength(1);

    // 6 categories ≥ 4 → positive
    const diversePos = r.insights.filter((i) => i.text.includes("categories"));
    expect(diversePos).toHaveLength(1);
    expect(diversePos[0].text).toContain("7 categories");
  });
});
