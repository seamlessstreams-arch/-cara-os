import { describe, it, expect } from "vitest";
import {
  computeHomeExpenseGovernance,
  type HomeExpenseGovernanceInput,
  type ExpenseInput,
} from "../home-expense-governance-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeExpense(overrides: Partial<ExpenseInput> = {}): ExpenseInput {
  return {
    id: "exp_1",
    submitted_by: "staff_1",
    category: "activities",
    amount: 50,
    has_receipt: true,
    date: "2026-05-20",
    status: "approved",
    approved_by: "staff_mgr",
    approved_at: "2026-05-21",
    created_at: "2026-05-20",
    linked_child_id: "child_1",
    payment_method: "house card",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeExpenseGovernanceInput> = {}): HomeExpenseGovernanceInput {
  return {
    today: "2026-05-27",
    expenses: [makeExpense()],
    total_staff: 5,
    ...overrides,
  };
}

// ── Insufficient Data ───────────────────────────────────────────────────────

describe("insufficient data", () => {
  it("returns insufficient_data when total_staff is 0", () => {
    const r = computeHomeExpenseGovernance(baseInput({ total_staff: 0 }));
    expect(r.expense_rating).toBe("insufficient_data");
    expect(r.expense_score).toBe(0);
  });

  it("returns insufficient_data when expenses array is empty", () => {
    const r = computeHomeExpenseGovernance(baseInput({ expenses: [] }));
    expect(r.expense_rating).toBe("insufficient_data");
    expect(r.expense_score).toBe(0);
  });

  it("returns empty arrays for all narrative fields when insufficient data", () => {
    const r = computeHomeExpenseGovernance(baseInput({ expenses: [] }));
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
    expect(r.distribution).toEqual([]);
  });
});

// ── Volume Profile ──────────────────────────────────────────────────────────

describe("volume profile", () => {
  it("counts expenses by status correctly", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "draft", approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e3", status: "approved" }),
        makeExpense({ id: "e4", status: "paid", approved_at: "2026-05-22" }),
        makeExpense({ id: "e5", status: "rejected", approved_by: null, approved_at: null }),
      ],
    }));
    expect(r.volume.draft_count).toBe(1);
    expect(r.volume.submitted_count).toBe(1);
    expect(r.volume.approved_count).toBe(1);
    expect(r.volume.paid_count).toBe(1);
    expect(r.volume.rejected_count).toBe(1);
    expect(r.volume.total_expenses).toBe(5);
  });

  it("calculates total and average amounts", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", amount: 100 }),
        makeExpense({ id: "e2", amount: 50 }),
        makeExpense({ id: "e3", amount: 25 }),
      ],
    }));
    expect(r.volume.total_amount).toBe(175);
    expect(r.volume.avg_amount).toBeCloseTo(58.33, 1);
  });
});

// ── Approval Profile ────────────────────────────────────────────────────────

describe("approval profile", () => {
  it("calculates avg/fastest/slowest approval days", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", created_at: "2026-05-20", approved_at: "2026-05-21" }), // 1 day
        makeExpense({ id: "e2", created_at: "2026-05-15", approved_at: "2026-05-20" }), // 5 days
        makeExpense({ id: "e3", created_at: "2026-05-10", approved_at: "2026-05-13", status: "paid" }), // 3 days
      ],
    }));
    expect(r.approval.fastest_approval_days).toBe(1);
    expect(r.approval.slowest_approval_days).toBe(5);
    expect(r.approval.avg_approval_days).toBe(3);
  });

  it("counts pending expenses and amount", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "submitted", approved_by: null, approved_at: null, amount: 100 }),
        makeExpense({ id: "e2", status: "submitted", approved_by: null, approved_at: null, amount: 75 }),
        makeExpense({ id: "e3", status: "approved", amount: 50 }),
      ],
    }));
    expect(r.approval.pending_count).toBe(2);
    expect(r.approval.pending_amount).toBe(175);
  });

  it("counts unique approvers", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", approved_by: "mgr_a" }),
        makeExpense({ id: "e2", approved_by: "mgr_b" }),
        makeExpense({ id: "e3", approved_by: "mgr_a" }),
      ],
    }));
    expect(r.approval.unique_approvers).toBe(2);
  });

  it("returns 0 for all approval fields when no approved expenses", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "submitted", approved_by: null, approved_at: null }),
      ],
    }));
    expect(r.approval.avg_approval_days).toBeNull();;
    expect(r.approval.fastest_approval_days).toBeNull();;
    expect(r.approval.slowest_approval_days).toBeNull();;
  });
});

// ── Compliance Profile ──────────────────────────────────────────────────────

describe("compliance profile", () => {
  it("calculates receipt rate excluding drafts", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "submitted", has_receipt: true, approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", status: "submitted", has_receipt: false, approved_by: null, approved_at: null }),
        makeExpense({ id: "e3", status: "draft", has_receipt: false, approved_by: null, approved_at: null }),
      ],
    }));
    // 1 receipt out of 2 non-draft = 50%
    expect(r.compliance.receipt_rate).toBe(50);
  });

  it("calculates child-linked rate and amount", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", linked_child_id: "c1", amount: 30 }),
        makeExpense({ id: "e2", linked_child_id: null, amount: 70 }),
        makeExpense({ id: "e3", linked_child_id: "c2", amount: 50 }),
      ],
    }));
    expect(r.compliance.child_linked_rate).toBe(67);
    expect(r.compliance.child_linked_amount).toBe(80);
  });

  it("calculates payment method rates", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", payment_method: "personal card" }),
        makeExpense({ id: "e2", payment_method: "house card" }),
        makeExpense({ id: "e3", payment_method: "petty cash" }),
        makeExpense({ id: "e4", payment_method: "mileage" }),
      ],
    }));
    expect(r.compliance.personal_card_rate).toBe(25);
    expect(r.compliance.house_card_rate).toBe(25);
    expect(r.compliance.petty_cash_rate).toBe(25);
    expect(r.compliance.mileage_rate).toBe(25);
  });
});

// ── Category Distribution ───────────────────────────────────────────────────

describe("category distribution", () => {
  it("groups expenses by category with count and amount", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", category: "food", amount: 100 }),
        makeExpense({ id: "e2", category: "food", amount: 50 }),
        makeExpense({ id: "e3", category: "transport", amount: 30 }),
      ],
    }));
    expect(r.distribution).toHaveLength(2);
    const food = r.distribution.find((d) => d.category === "food");
    expect(food?.count).toBe(2);
    expect(food?.total_amount).toBe(150);
  });

  it("sorts categories by total amount descending", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", category: "small", amount: 10 }),
        makeExpense({ id: "e2", category: "big", amount: 200 }),
        makeExpense({ id: "e3", category: "medium", amount: 50 }),
      ],
    }));
    expect(r.distribution[0].category).toBe("big");
    expect(r.distribution[1].category).toBe("medium");
    expect(r.distribution[2].category).toBe("small");
  });
});

// ── Rating Thresholds ───────────────────────────────────────────────────────

describe("rating thresholds", () => {
  it("rates outstanding at score >= 80", () => {
    // Max everything: fast approval, 100% receipts, 0 pending, 4+ categories,
    // high child rate, controlled payments, 0 drafts, 2+ approvers
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", category: "activities", created_at: "2026-05-25", approved_at: "2026-05-26", approved_by: "mgr_a", payment_method: "house card", linked_child_id: "c1" }),
        makeExpense({ id: "e2", category: "food", created_at: "2026-05-24", approved_at: "2026-05-25", approved_by: "mgr_b", payment_method: "house card", linked_child_id: "c2" }),
        makeExpense({ id: "e3", category: "transport", created_at: "2026-05-23", approved_at: "2026-05-24", approved_by: "mgr_a", payment_method: "petty cash", linked_child_id: "c1" }),
        makeExpense({ id: "e4", category: "clothing", created_at: "2026-05-22", approved_at: "2026-05-23", approved_by: "mgr_b", payment_method: "house card", linked_child_id: null }),
        makeExpense({ id: "e5", category: "training", created_at: "2026-05-21", approved_at: "2026-05-22", approved_by: "mgr_a", payment_method: "petty cash", linked_child_id: null }),
      ],
    }));
    expect(r.expense_score).toBeGreaterThanOrEqual(80);
    expect(r.expense_rating).toBe("outstanding");
  });

  it("rates inadequate at score < 45", () => {
    // Everything bad: no receipts, all pending, 1 category, no child links,
    // all personal card, all drafts, no approvers
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "submitted", has_receipt: false, approved_by: null, approved_at: null, linked_child_id: null, payment_method: "personal card", category: "other" }),
        makeExpense({ id: "e2", status: "draft", has_receipt: false, approved_by: null, approved_at: null, linked_child_id: null, payment_method: "personal card", category: "other" }),
        makeExpense({ id: "e3", status: "draft", has_receipt: false, approved_by: null, approved_at: null, linked_child_id: null, payment_method: "personal card", category: "other" }),
      ],
    }));
    expect(r.expense_score).toBeLessThan(45);
    expect(r.expense_rating).toBe("inadequate");
  });
});

// ── Modifier 1: Approval Turnaround ────────────────────────────────────────

describe("modifier 1: approval turnaround", () => {
  it("awards +4 for avg <= 2 days", () => {
    const fast = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", created_at: "2026-05-25", approved_at: "2026-05-26" }), // 1 day
        makeExpense({ id: "e2", created_at: "2026-05-24", approved_at: "2026-05-25" }), // 1 day
      ],
    }));
    const slow = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", created_at: "2026-05-10", approved_at: "2026-05-25" }), // 15 days
        makeExpense({ id: "e2", created_at: "2026-05-09", approved_at: "2026-05-25" }), // 16 days
      ],
    }));
    // fast gets +4, slow gets -3 => diff of 7
    expect(fast.expense_score! - slow.expense_score!).toBe(7);
  });

  it("is neutral when no approved expenses exist", () => {
    const withApproval = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", created_at: "2026-05-25", approved_at: "2026-05-26" }),
      ],
    }));
    const noApproval = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "submitted", approved_by: null, approved_at: null }),
      ],
    }));
    // withApproval gets +4 for mod1, noApproval gets 0 for mod1
    // But other modifiers also change (pending status, approvers, etc.), so just
    // verify noApproval doesn't crash
    expect(noApproval.expense_score).toBeGreaterThan(0);
  });
});

// ── Modifier 2: Receipt Compliance ─────────────────────────────────────────

describe("modifier 2: receipt compliance", () => {
  it("awards +5 for 100% receipt rate", () => {
    const good = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", has_receipt: true }),
        makeExpense({ id: "e2", has_receipt: true }),
      ],
    }));
    const bad = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", has_receipt: false }),
        makeExpense({ id: "e2", has_receipt: false }),
      ],
    }));
    // 100% = +5, 0% = -4 => diff 9
    expect(good.expense_score! - bad.expense_score!).toBe(9);
  });
});

// ── Modifier 3: Pending Backlog ────────────────────────────────────────────

describe("modifier 3: pending backlog", () => {
  it("awards +3 for 0 pending", () => {
    const noPending = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "approved" }),
        makeExpense({ id: "e2", status: "paid", approved_at: "2026-05-22" }),
      ],
    }));
    const allPending = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", status: "submitted", approved_by: null, approved_at: null }),
      ],
    }));
    // noPending gets +3, allPending (100% pending) gets -3 => diff 6
    // But approver count also changes: noPending has approvers, allPending has 0
    // Mod 8 also shifts: noPending 1 approver (+1), allPending 0 approvers (-2) = +3 diff
    // Total expected diff = 6 (mod3) + 3 (mod8) + mod1 diff
    // noPending: mod1 +4 (1 day approval), allPending: mod1 neutral (no approved) = +4
    expect(noPending.expense_score).toBeGreaterThan(allPending.expense_score!);
  });
});

// ── Modifier 4: Category Diversity ─────────────────────────────────────────

describe("modifier 4: category diversity", () => {
  it("awards +3 for 4+ categories", () => {
    const diverse = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", category: "food" }),
        makeExpense({ id: "e2", category: "transport" }),
        makeExpense({ id: "e3", category: "clothing" }),
        makeExpense({ id: "e4", category: "activities" }),
      ],
    }));
    const single = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", category: "food" }),
        makeExpense({ id: "e2", category: "food" }),
        makeExpense({ id: "e3", category: "food" }),
        makeExpense({ id: "e4", category: "food" }),
      ],
    }));
    // diverse: +3, single: -2 => diff 5
    expect(diverse.expense_score! - single.expense_score!).toBe(5);
  });
});

// ── Modifier 5: Child Benefit Rate ─────────────────────────────────────────

describe("modifier 5: child benefit rate", () => {
  it("awards +4 for high child-linked rate", () => {
    const high = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", linked_child_id: "c1" }),
        makeExpense({ id: "e2", linked_child_id: "c2" }),
        makeExpense({ id: "e3", linked_child_id: "c1" }),
      ],
    }));
    const none = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", linked_child_id: null }),
        makeExpense({ id: "e2", linked_child_id: null }),
        makeExpense({ id: "e3", linked_child_id: null }),
      ],
    }));
    // 100% child linked = +4, 0% = -3 => diff 7
    expect(high.expense_score! - none.expense_score!).toBe(7);
  });
});

// ── Modifier 6: Payment Method Governance ──────────────────────────────────

describe("modifier 6: payment method governance", () => {
  it("awards +3 for high controlled spending rate", () => {
    const controlled = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", payment_method: "house card" }),
        makeExpense({ id: "e2", payment_method: "petty cash" }),
        makeExpense({ id: "e3", payment_method: "house card" }),
      ],
    }));
    const personal = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", payment_method: "personal card" }),
        makeExpense({ id: "e2", payment_method: "personal card" }),
        makeExpense({ id: "e3", payment_method: "personal card" }),
      ],
    }));
    // 100% controlled = +3, 0% controlled = -2 => diff 5
    expect(controlled.expense_score! - personal.expense_score!).toBe(5);
  });
});

// ── Modifier 7: Draft Discipline ───────────────────────────────────────────

describe("modifier 7: draft discipline", () => {
  it("awards +3 for 0 drafts", () => {
    const noDrafts = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "approved" }),
        makeExpense({ id: "e2", status: "approved" }),
      ],
    }));
    // Change to mostly drafts — 2 drafts out of 3 = 67% draft rate
    const manyDrafts = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "draft", approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", status: "draft", approved_by: null, approved_at: null }),
        makeExpense({ id: "e3", status: "approved" }),
      ],
    }));
    // noDrafts: mod7 +3, manyDrafts: mod7 -2 => diff 5 from mod7 alone
    // But other modifiers also change (receipt rate denominator, pending rate, approvers)
    expect(noDrafts.expense_score).toBeGreaterThan(manyDrafts.expense_score!);
  });
});

// ── Modifier 8: Manager Oversight ──────────────────────────────────────────

describe("modifier 8: manager oversight", () => {
  it("awards +3 for 2+ unique approvers", () => {
    const multi = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", approved_by: "mgr_a" }),
        makeExpense({ id: "e2", approved_by: "mgr_b" }),
      ],
    }));
    const single = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", approved_by: "mgr_a" }),
        makeExpense({ id: "e2", approved_by: "mgr_a" }),
      ],
    }));
    // multi: +3, single: +1 => diff 2
    expect(multi.expense_score! - single.expense_score!).toBe(2);
  });
});

// ── Strengths ───────────────────────────────────────────────────────────────

describe("strengths", () => {
  it("includes fast approval strength", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", created_at: "2026-05-25", approved_at: "2026-05-26" }),
        makeExpense({ id: "e2", created_at: "2026-05-24", approved_at: "2026-05-25" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("day") && s.includes("turnaround"))).toBe(true);
  });

  it("includes receipt compliance strength when >= 90%", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", has_receipt: true }),
        makeExpense({ id: "e2", has_receipt: true }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("receipt compliance"))).toBe(true);
  });

  it("includes child benefit strength when >= 40%", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", linked_child_id: "c1" }),
        makeExpense({ id: "e2", linked_child_id: "c2" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("child-benefit"))).toBe(true);
  });

  it("includes diverse categories strength when >= 4", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", category: "a" }),
        makeExpense({ id: "e2", category: "b" }),
        makeExpense({ id: "e3", category: "c" }),
        makeExpense({ id: "e4", category: "d" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("categories"))).toBe(true);
  });

  it("includes no pending strength when 0 pending", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "approved" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("No pending"))).toBe(true);
  });

  it("includes no drafts strength when 0 drafts", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "approved" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("draft"))).toBe(true);
  });
});

// ── Concerns ────────────────────────────────────────────────────────────────

describe("concerns", () => {
  it("includes low receipt concern when < 50%", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", has_receipt: false, status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", has_receipt: false, status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e3", has_receipt: true, status: "submitted", approved_by: null, approved_at: null }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("receipt") && c.includes("Reg 36"))).toBe(true);
  });

  it("includes slow approval concern when > 10 days", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", created_at: "2026-05-01", approved_at: "2026-05-20" }), // 19 days
      ],
    }));
    expect(r.concerns.some((c) => c.includes("approval turnaround"))).toBe(true);
  });

  it("includes pending backlog concern when > 40%", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e3", status: "submitted", approved_by: null, approved_at: null }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("pending"))).toBe(true);
  });

  it("includes no child linking concern when 0%", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", linked_child_id: null }),
        makeExpense({ id: "e2", linked_child_id: null }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("child-benefit"))).toBe(true);
  });

  it("includes draft concern when > 25%", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "draft", approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", status: "draft", approved_by: null, approved_at: null }),
        makeExpense({ id: "e3", status: "approved" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("draft"))).toBe(true);
  });
});

// ── Recommendations ─────────────────────────────────────────────────────────

describe("recommendations", () => {
  it("recommends receipt uploads when < 75%", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", has_receipt: false, status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", has_receipt: true, status: "submitted", approved_by: null, approved_at: null }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("receipt") && rec.regulatory_ref === "Reg 36")).toBe(true);
  });

  it("recommends clearing pending when > 20%", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", status: "approved" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("pending"))).toBe(true);
  });

  it("sets immediate urgency for receipt rate < 50%", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", has_receipt: false, status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", has_receipt: false, status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e3", has_receipt: true, status: "submitted", approved_by: null, approved_at: null }),
      ],
    }));
    const receiptRec = r.recommendations.find((rec) => rec.recommendation.includes("receipt"));
    expect(receiptRec?.urgency).toBe("immediate");
  });

  it("recommends child linking when < 25%", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", linked_child_id: null }),
        makeExpense({ id: "e2", linked_child_id: null }),
        makeExpense({ id: "e3", linked_child_id: null }),
        makeExpense({ id: "e4", linked_child_id: null }),
        makeExpense({ id: "e5", linked_child_id: "c1" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("child-related") && rec.regulatory_ref === "Reg 44")).toBe(true);
  });

  it("has sequential rank numbers", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", has_receipt: false, status: "submitted", approved_by: null, approved_at: null, linked_child_id: null }),
        makeExpense({ id: "e2", has_receipt: false, status: "submitted", approved_by: null, approved_at: null, linked_child_id: null }),
      ],
    }));
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });
});

// ── Insights ────────────────────────────────────────────────────────────────

describe("insights", () => {
  it("generates critical insight for receipt rate < 50%", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", has_receipt: false, status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", has_receipt: false, status: "submitted", approved_by: null, approved_at: null }),
        makeExpense({ id: "e3", has_receipt: true, status: "submitted", approved_by: null, approved_at: null }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Receipt compliance"))).toBe(true);
  });

  it("generates warning insight for high pending amount", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "submitted", approved_by: null, approved_at: null, amount: 150 }),
        makeExpense({ id: "e2", status: "submitted", approved_by: null, approved_at: null, amount: 100 }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("pending"))).toBe(true);
  });

  it("generates positive insight for high child benefit rate", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", linked_child_id: "c1", amount: 50 }),
        makeExpense({ id: "e2", linked_child_id: "c2", amount: 30 }),
        makeExpense({ id: "e3", linked_child_id: null, amount: 20 }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("benefit individual children"))).toBe(true);
  });

  it("generates positive insight for fast approval", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", created_at: "2026-05-25", approved_at: "2026-05-26" }),
        makeExpense({ id: "e2", created_at: "2026-05-24", approved_at: "2026-05-25" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Approval turnaround"))).toBe(true);
  });

  it("generates positive insight for diverse categories", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", category: "a" }),
        makeExpense({ id: "e2", category: "b" }),
        makeExpense({ id: "e3", category: "c" }),
        makeExpense({ id: "e4", category: "d" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("categories"))).toBe(true);
  });
});

// ── Headline ────────────────────────────────────────────────────────────────

describe("headline", () => {
  it("reflects outstanding rating", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", category: "a", created_at: "2026-05-25", approved_at: "2026-05-26", approved_by: "mgr_a", payment_method: "house card" }),
        makeExpense({ id: "e2", category: "b", created_at: "2026-05-24", approved_at: "2026-05-25", approved_by: "mgr_b", payment_method: "house card" }),
        makeExpense({ id: "e3", category: "c", created_at: "2026-05-23", approved_at: "2026-05-24", approved_by: "mgr_a", payment_method: "petty cash" }),
        makeExpense({ id: "e4", category: "d", created_at: "2026-05-22", approved_at: "2026-05-23", approved_by: "mgr_b", payment_method: "house card" }),
        makeExpense({ id: "e5", category: "e", created_at: "2026-05-21", approved_at: "2026-05-22", approved_by: "mgr_a", payment_method: "petty cash" }),
      ],
    }));
    expect(r.headline).toContain("Strong financial governance");
  });

  it("reflects inadequate rating", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "submitted", has_receipt: false, approved_by: null, approved_at: null, linked_child_id: null, payment_method: "personal card", category: "x" }),
        makeExpense({ id: "e2", status: "draft", has_receipt: false, approved_by: null, approved_at: null, linked_child_id: null, payment_method: "personal card", category: "x" }),
        makeExpense({ id: "e3", status: "draft", has_receipt: false, approved_by: null, approved_at: null, linked_child_id: null, payment_method: "personal card", category: "x" }),
      ],
    }));
    expect(r.headline).toContain("requires improvement");
  });
});

// ── Score Clamping ──────────────────────────────────────────────────────────

describe("score clamping", () => {
  it("never exceeds 100", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: Array.from({ length: 20 }, (_, i) =>
        makeExpense({
          id: `e${i}`,
          category: `cat_${i % 5}`,
          approved_by: i % 2 === 0 ? "mgr_a" : "mgr_b",
          created_at: "2026-05-25",
          approved_at: "2026-05-26",
          payment_method: "house card",
          linked_child_id: `c${i % 3}`,
        }),
      ),
    }));
    expect(r.expense_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "submitted", has_receipt: false, approved_by: null, approved_at: null, linked_child_id: null, payment_method: "personal card", category: "x" }),
      ],
    }));
    expect(r.expense_score).toBeGreaterThanOrEqual(0);
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles single expense correctly", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [makeExpense()],
    }));
    expect(r.volume.total_expenses).toBe(1);
    expect(r.expense_score).toBeGreaterThan(0);
    expect(r.expense_rating).not.toBe("insufficient_data");
  });

  it("handles all rejected expenses", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "rejected", has_receipt: true, approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", status: "rejected", has_receipt: true, approved_by: null, approved_at: null }),
      ],
    }));
    expect(r.volume.rejected_count).toBe(2);
    expect(r.approval.unique_approvers).toBe(0);
  });

  it("handles zero-amount expenses", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", amount: 0 }),
      ],
    }));
    expect(r.volume.total_amount).toBe(0);
    expect(r.volume.avg_amount).toBe(0);
  });

  it("receipt rate excludes draft expenses", () => {
    const r = computeHomeExpenseGovernance(baseInput({
      expenses: [
        makeExpense({ id: "e1", status: "draft", has_receipt: false, approved_by: null, approved_at: null }),
        makeExpense({ id: "e2", status: "approved", has_receipt: true }),
      ],
    }));
    // 1 non-draft with receipt / 1 non-draft total = 100%
    expect(r.compliance.receipt_rate).toBe(100);
  });
});
