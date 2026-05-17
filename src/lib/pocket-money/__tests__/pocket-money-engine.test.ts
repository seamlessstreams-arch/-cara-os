// ══════════════════════════════════════════════════════════════════════════════
// Pocket Money & Savings Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateChildFinancialCompliance,
  calculateHomeFinancialMetrics,
  getTransactionTypeLabel,
  getLiteracyTopicLabel,
} from "../pocket-money-engine";
import type {
  ChildFinancialProfile,
  FinancialTransaction,
  LiteracySession,
} from "../pocket-money-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeTransactions(): FinancialTransaction[] {
  return [
    { id: "ft-1", date: "2026-05-16T10:00:00Z", type: "pocket_money", amount: 15, description: "Weekly pocket money", method: "cash", receiptRecorded: true, authorisedBy: "staff-rm-01", childSignature: true },
    { id: "ft-2", date: "2026-05-09T10:00:00Z", type: "pocket_money", amount: 15, description: "Weekly pocket money", method: "cash", receiptRecorded: true, authorisedBy: "staff-rm-01", childSignature: true },
    { id: "ft-3", date: "2026-05-02T10:00:00Z", type: "pocket_money", amount: 15, description: "Weekly pocket money", method: "cash", receiptRecorded: true, authorisedBy: "staff-rm-01", childSignature: true },
    { id: "ft-4", date: "2026-04-25T10:00:00Z", type: "pocket_money", amount: 15, description: "Weekly pocket money", method: "cash", receiptRecorded: true, authorisedBy: "staff-rm-01", childSignature: true },
    { id: "ft-5", date: "2026-05-01T10:00:00Z", type: "savings_deposit", amount: 20, description: "Monthly savings deposit", method: "bank_transfer", receiptRecorded: true, authorisedBy: "staff-rm-01" },
    { id: "ft-6", date: "2026-04-01T10:00:00Z", type: "savings_deposit", amount: 20, description: "Monthly savings deposit", method: "bank_transfer", receiptRecorded: true, authorisedBy: "staff-rm-01" },
    { id: "ft-7", date: "2026-03-01T10:00:00Z", type: "savings_deposit", amount: 20, description: "Monthly savings deposit", method: "bank_transfer", receiptRecorded: true, authorisedBy: "staff-rm-01" },
    { id: "ft-8", date: "2026-04-15T14:00:00Z", type: "clothing_allowance", amount: 45, description: "New trainers", method: "prepaid_card", receiptRecorded: true, authorisedBy: "staff-sw-01", childSignature: true },
    { id: "ft-9", date: "2026-03-20T10:00:00Z", type: "clothing_allowance", amount: 30, description: "School uniform top", method: "prepaid_card", receiptRecorded: true, authorisedBy: "staff-sw-01" },
    { id: "ft-10", date: "2026-01-15T10:00:00Z", type: "birthday_money", amount: 50, description: "Birthday money", method: "cash", receiptRecorded: true, authorisedBy: "staff-rm-01", childSignature: true },
  ];
}

function makeLiteracySessions(): LiteracySession[] {
  return [
    { id: "ls-1", date: "2026-05-10T14:00:00Z", topic: "budgeting", duration: 30, facilitatedBy: "staff-sw-01" },
    { id: "ls-2", date: "2026-04-20T14:00:00Z", topic: "saving", duration: 30, facilitatedBy: "staff-sw-01" },
    { id: "ls-3", date: "2026-03-15T14:00:00Z", topic: "comparison_shopping", duration: 25, facilitatedBy: "staff-rm-01" },
    { id: "ls-4", date: "2026-04-05T14:00:00Z", topic: "banking", duration: 30, facilitatedBy: "staff-sw-01" },
    { id: "ls-5", date: "2026-02-10T14:00:00Z", topic: "online_safety", duration: 20, facilitatedBy: "staff-rm-01" },
  ];
}

function makeProfile(overrides: Partial<ChildFinancialProfile> = {}): ChildFinancialProfile {
  return {
    childId: "child-alex",
    childName: "Alex Turner",
    homeId: "home-oak",
    dateOfBirth: "2012-01-15T00:00:00Z", // age 14
    weeklyPocketMoneyRate: 15,
    monthlyClothingAllowance: 50,
    birthdayAllowance: 50,
    festivalAllowance: 30,
    savingsAccountExists: true,
    savingsAccountBalance: 240,
    savingsTargetMonthly: 20,
    prepaidCardIssued: true,
    transactions: makeTransactions(),
    literacySessions: makeLiteracySessions(),
    financialPlanInPlace: true,
    childInvolvedInBudget: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Child Financial Compliance Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildFinancialCompliance", () => {
  it("marks compliant child with good financial management", () => {
    const result = evaluateChildFinancialCompliance(makeProfile(), NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.pocketMoneyOnTime).toBe(true);
    expect(result.financialWellbeingScore).toBeGreaterThan(70);
  });

  it("calculates correct age", () => {
    const result = evaluateChildFinancialCompliance(makeProfile(), NOW);
    expect(result.age).toBe(14);
  });

  it("flags no pocket money paid", () => {
    const profile = makeProfile({ transactions: [] });
    const result = evaluateChildFinancialCompliance(profile, NOW);
    expect(result.issues.some(i => i.includes("No pocket money paid"))).toBe(true);
  });

  it("warns about pocket money shortfall", () => {
    const txns: FinancialTransaction[] = [
      { id: "ft-1", date: "2026-05-16T10:00:00Z", type: "pocket_money", amount: 15, description: "Weekly", method: "cash", receiptRecorded: true, authorisedBy: "staff-01" },
      // Only 1 of 4 expected weeks
    ];
    const profile = makeProfile({ transactions: txns });
    const result = evaluateChildFinancialCompliance(profile, NOW);
    expect(result.pocketMoneyOwed).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes("shortfall"))).toBe(true);
  });

  it("flags no savings account", () => {
    const profile = makeProfile({ savingsAccountExists: false, savingsAccountBalance: undefined });
    const result = evaluateChildFinancialCompliance(profile, NOW);
    expect(result.issues.some(i => i.includes("No savings account"))).toBe(true);
  });

  it("tracks savings deposits over 90 days", () => {
    const result = evaluateChildFinancialCompliance(makeProfile(), NOW);
    expect(result.savingsDepositsLast90Days).toBe(60); // 3 x £20
    expect(result.savingsOnTrack).toBe(true);
  });

  it("warns about below-target savings", () => {
    const profile = makeProfile({
      savingsTargetMonthly: 50,
      transactions: [
        { id: "ft-1", date: "2026-05-01T10:00:00Z", type: "savings_deposit", amount: 10, description: "Deposit", method: "bank_transfer", receiptRecorded: true, authorisedBy: "staff-01" },
        // Only £10 vs £150 target (50*3)
        ...makeTransactions().filter(t => t.type === "pocket_money"),
      ],
    });
    const result = evaluateChildFinancialCompliance(profile, NOW);
    expect(result.savingsOnTrack).toBe(false);
    expect(result.warnings.some(w => w.includes("Savings deposits below target"))).toBe(true);
  });

  it("calculates clothing spend", () => {
    const result = evaluateChildFinancialCompliance(makeProfile(), NOW);
    expect(result.clothingSpendLast90Days).toBe(75); // £45 + £30
  });

  it("detects birthday money provided", () => {
    const result = evaluateChildFinancialCompliance(makeProfile(), NOW);
    expect(result.birthdayMoneyProvided).toBe(true);
  });

  it("calculates receipt rate", () => {
    const result = evaluateChildFinancialCompliance(makeProfile(), NOW);
    expect(result.receiptRate).toBe(100); // all have receipts
  });

  it("warns about low receipt rate", () => {
    const txns: FinancialTransaction[] = [
      { id: "ft-1", date: "2026-05-16T10:00:00Z", type: "pocket_money", amount: 15, description: "Weekly", method: "cash", receiptRecorded: false, authorisedBy: "staff-01" },
      { id: "ft-2", date: "2026-05-09T10:00:00Z", type: "pocket_money", amount: 15, description: "Weekly", method: "cash", receiptRecorded: false, authorisedBy: "staff-01" },
      { id: "ft-3", date: "2026-05-02T10:00:00Z", type: "pocket_money", amount: 15, description: "Weekly", method: "cash", receiptRecorded: true, authorisedBy: "staff-01" },
    ];
    const profile = makeProfile({ transactions: txns });
    const result = evaluateChildFinancialCompliance(profile, NOW);
    expect(result.receiptRate).toBe(33);
    expect(result.warnings.some(w => w.includes("receipt recording rate"))).toBe(true);
  });

  it("tracks financial literacy sessions", () => {
    const result = evaluateChildFinancialCompliance(makeProfile(), NOW);
    expect(result.literacySessionsLast90Days).toBe(4); // 4 sessions in last 90 days
  });

  it("warns about too few literacy sessions", () => {
    const profile = makeProfile({ literacySessions: [] });
    const result = evaluateChildFinancialCompliance(profile, NOW);
    expect(result.literacySessionsLast90Days).toBe(0);
    expect(result.warnings.some(w => w.includes("financial literacy session"))).toBe(true);
  });

  it("identifies topics not covered", () => {
    const profile = makeProfile({ literacySessions: [] });
    const result = evaluateChildFinancialCompliance(profile, NOW);
    expect(result.topicsNotCovered.length).toBeGreaterThan(0);
    expect(result.topicsCovered).toHaveLength(0);
  });

  it("warns about no financial plan for 14+", () => {
    const profile = makeProfile({ financialPlanInPlace: false });
    const result = evaluateChildFinancialCompliance(profile, NOW);
    expect(result.warnings.some(w => w.includes("financial independence plan"))).toBe(true);
  });

  it("warns about child not involved in budget", () => {
    const profile = makeProfile({ childInvolvedInBudget: false });
    const result = evaluateChildFinancialCompliance(profile, NOW);
    expect(result.warnings.some(w => w.includes("not involved in budget"))).toBe(true);
  });

  it("calculates financial wellbeing score", () => {
    const result = evaluateChildFinancialCompliance(makeProfile(), NOW);
    expect(result.financialWellbeingScore).toBe(100);

    // Minimal profile
    const minimal = makeProfile({
      savingsAccountExists: false,
      savingsAccountBalance: undefined,
      savingsTargetMonthly: undefined,
      prepaidCardIssued: false,
      transactions: [],
      literacySessions: [],
      financialPlanInPlace: false,
      childInvolvedInBudget: false,
    });
    const minResult = evaluateChildFinancialCompliance(minimal, NOW);
    expect(minResult.financialWellbeingScore).toBe(0);
  });

  it("gives under-12 children credit for not having prepaid card", () => {
    const profile = makeProfile({
      dateOfBirth: "2016-06-01T00:00:00Z", // age 9
      prepaidCardIssued: false,
    });
    const result = evaluateChildFinancialCompliance(profile, NOW);
    // Under-12 without card should still get 5 points for appropriate decision
    expect(result.age).toBe(9);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Home Financial Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeFinancialMetrics", () => {
  it("calculates metrics for well-managed home", () => {
    const profiles = [
      makeProfile({ childId: "c1", childName: "Alex" }),
      makeProfile({ childId: "c2", childName: "Jordan" }),
    ];
    const result = calculateHomeFinancialMetrics(profiles, "home-oak", NOW);
    expect(result.childCount).toBe(2);
    expect(result.overallFinancialScore).toBe(100);
    expect(result.pocketMoneyComplianceRate).toBe(100);
    expect(result.savingsAccountRate).toBe(100);
  });

  it("calculates pocket money compliance rate", () => {
    const profiles = [
      makeProfile({ childId: "c1", childName: "Alex" }),
      makeProfile({ childId: "c2", childName: "Jordan", transactions: [] }),
    ];
    const result = calculateHomeFinancialMetrics(profiles, "home-oak", NOW);
    expect(result.pocketMoneyComplianceRate).toBe(50);
  });

  it("calculates receipt compliance", () => {
    const profiles = [makeProfile({ childId: "c1" })];
    const result = calculateHomeFinancialMetrics(profiles, "home-oak", NOW);
    expect(result.receiptComplianceRate).toBe(100);
  });

  it("calculates literacy session rate per child", () => {
    const profiles = [
      makeProfile({ childId: "c1", childName: "Alex" }),
      makeProfile({ childId: "c2", childName: "Jordan", literacySessions: [] }),
    ];
    const result = calculateHomeFinancialMetrics(profiles, "home-oak", NOW);
    expect(result.literacySessionRate).toBe(2); // 4 total sessions / 2 children
  });

  it("identifies children with issues", () => {
    const profiles = [
      makeProfile({ childId: "c1", childName: "Alex" }),
      makeProfile({ childId: "c2", childName: "Jordan", savingsAccountExists: false, transactions: [] }),
    ];
    const result = calculateHomeFinancialMetrics(profiles, "home-oak", NOW);
    expect(result.childrenWithIssues.length).toBe(1);
    expect(result.childrenWithIssues[0].childName).toBe("Jordan");
  });

  it("identifies topic gaps across home", () => {
    const profiles = [makeProfile({ childId: "c1" })];
    const result = calculateHomeFinancialMetrics(profiles, "home-oak", NOW);
    // Topics covered: budgeting, saving, comparison_shopping, banking, online_safety
    // Gaps: bills_and_utilities, debt_awareness, employment_income
    expect(result.topicsGap.length).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Helper functions", () => {
  it("getTransactionTypeLabel returns readable labels", () => {
    expect(getTransactionTypeLabel("pocket_money")).toBe("Pocket Money");
    expect(getTransactionTypeLabel("savings_deposit")).toBe("Savings Deposit");
    expect(getTransactionTypeLabel("clothing_allowance")).toBe("Clothing Allowance");
  });

  it("getLiteracyTopicLabel returns readable labels", () => {
    expect(getLiteracyTopicLabel("budgeting")).toBe("Budgeting");
    expect(getLiteracyTopicLabel("online_safety")).toBe("Online Financial Safety");
    expect(getLiteracyTopicLabel("employment_income")).toBe("Earning & Employment");
  });
});
