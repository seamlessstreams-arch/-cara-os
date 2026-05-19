// ==============================================================================
// Pocket Money & Financial Literacy Intelligence Engine -- Tests
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluatePocketMoneyManagement,
  evaluateSavingsEngagement,
  evaluateFinancialEducation,
  evaluateStaffFinancialReadiness,
  buildChildFinancialSummaries,
  generatePocketMoneyFinancialLiteracyIntelligence,
  pct,
  getRating,
  getPaymentFrequencyLabel,
  getSpendingCategoryLabel,
  getEducationTopicLabel,
  getSessionEngagementLabel,
  getRatingLabel,
} from "../pocket-money-financial-literacy-engine";
import type {
  PocketMoneyRecord,
  SavingsAccount,
  FinancialEducationSession,
  StaffFinancialTraining,
} from "../pocket-money-financial-literacy-engine";

// -- Fixtures -----------------------------------------------------------------

function makeRecord(overrides: Partial<PocketMoneyRecord> = {}): PocketMoneyRecord {
  return {
    id: "rec-001",
    childId: "child-alex",
    childName: "Alex",
    weekStarting: "2026-05-04",
    amountGiven: 10,
    amountSaved: 3,
    spendingCategories: ["personal_items", "food_treats"],
    receiptRecorded: true,
    childSignedOff: true,
    ...overrides,
  };
}

function makeAccount(overrides: Partial<SavingsAccount> = {}): SavingsAccount {
  return {
    id: "sa-001",
    childId: "child-alex",
    childName: "Alex",
    accountType: "junior_isa",
    balance: 150,
    monthlyDeposits: 4,
    savingsGoalSet: true,
    savingsGoalDescription: "New bicycle",
    ...overrides,
  };
}

function makeSession(
  overrides: Partial<FinancialEducationSession> = {},
): FinancialEducationSession {
  return {
    id: "sess-001",
    date: "2026-04-15",
    facilitatedBy: "Sarah Collins",
    topic: "budgeting",
    childrenAttended: ["child-alex", "child-jordan", "child-morgan"],
    engagement: "high",
    resourcesProvided: true,
    ...overrides,
  };
}

function makeTraining(
  overrides: Partial<StaffFinancialTraining> = {},
): StaffFinancialTraining {
  return {
    id: "tr-001",
    staffId: "staff-001",
    staffName: "Sarah Collins",
    pocketMoneyPolicyTrained: true,
    financialEducationTrained: true,
    budgetingSupportTrained: true,
    safeguardingFinancialAbuse: true,
    recordKeepingTrained: true,
    ...overrides,
  };
}

// =============================================================================
// pct() helper
// =============================================================================

describe("pct()", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when numerator equals denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// =============================================================================
// getRating() helper
// =============================================================================

describe("getRating()", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// =============================================================================
// Label getters
// =============================================================================

describe("getPaymentFrequencyLabel()", () => {
  it("returns Weekly", () => {
    expect(getPaymentFrequencyLabel("weekly")).toBe("Weekly");
  });

  it("returns Fortnightly", () => {
    expect(getPaymentFrequencyLabel("fortnightly")).toBe("Fortnightly");
  });

  it("returns Monthly", () => {
    expect(getPaymentFrequencyLabel("monthly")).toBe("Monthly");
  });
});

describe("getSpendingCategoryLabel()", () => {
  it("returns correct label for each category", () => {
    expect(getSpendingCategoryLabel("savings")).toBe("Savings");
    expect(getSpendingCategoryLabel("personal_items")).toBe("Personal Items");
    expect(getSpendingCategoryLabel("activities")).toBe("Activities");
    expect(getSpendingCategoryLabel("food_treats")).toBe("Food & Treats");
    expect(getSpendingCategoryLabel("gifts")).toBe("Gifts");
    expect(getSpendingCategoryLabel("clothing")).toBe("Clothing");
    expect(getSpendingCategoryLabel("technology")).toBe("Technology");
    expect(getSpendingCategoryLabel("other")).toBe("Other");
  });
});

describe("getEducationTopicLabel()", () => {
  it("returns correct label for each topic", () => {
    expect(getEducationTopicLabel("budgeting")).toBe("Budgeting");
    expect(getEducationTopicLabel("saving")).toBe("Saving");
    expect(getEducationTopicLabel("banking")).toBe("Banking");
    expect(getEducationTopicLabel("value_of_money")).toBe("Value of Money");
    expect(getEducationTopicLabel("comparison_shopping")).toBe("Comparison Shopping");
    expect(getEducationTopicLabel("online_safety")).toBe("Online Safety");
    expect(getEducationTopicLabel("debt_awareness")).toBe("Debt Awareness");
  });
});

describe("getSessionEngagementLabel()", () => {
  it("returns correct label for each engagement level", () => {
    expect(getSessionEngagementLabel("high")).toBe("High");
    expect(getSessionEngagementLabel("medium")).toBe("Medium");
    expect(getSessionEngagementLabel("low")).toBe("Low");
  });
});

describe("getRatingLabel()", () => {
  it("returns correct label for each rating", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// =============================================================================
// evaluatePocketMoneyManagement()
// =============================================================================

describe("evaluatePocketMoneyManagement()", () => {
  it("returns 0 for empty records", () => {
    const result = evaluatePocketMoneyManagement([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.receiptRecordingRate).toBe(0);
    expect(result.childSignOffRate).toBe(0);
    expect(result.savingsParticipationRate).toBe(0);
    expect(result.consistentPayments).toBe(false);
  });

  it("scores 25 for perfect records with multiple children having multiple entries", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", childName: "A", receiptRecorded: true, childSignedOff: true, amountSaved: 3 }),
      makeRecord({ id: "r2", childId: "child-a", childName: "A", weekStarting: "2026-05-11", receiptRecorded: true, childSignedOff: true, amountSaved: 3 }),
      makeRecord({ id: "r3", childId: "child-b", childName: "B", receiptRecorded: true, childSignedOff: true, amountSaved: 5 }),
      makeRecord({ id: "r4", childId: "child-b", childName: "B", weekStarting: "2026-05-11", receiptRecorded: true, childSignedOff: true, amountSaved: 5 }),
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.overallScore).toBe(25);
    expect(result.receiptRecordingRate).toBe(100);
    expect(result.childSignOffRate).toBe(100);
    expect(result.savingsParticipationRate).toBe(100);
    expect(result.consistentPayments).toBe(true);
  });

  it("calculates receipt recording rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", receiptRecorded: true }),
      makeRecord({ id: "r2", receiptRecorded: false, weekStarting: "2026-05-11" }),
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.receiptRecordingRate).toBe(50);
  });

  it("calculates child sign-off rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", childSignedOff: true }),
      makeRecord({ id: "r2", childSignedOff: false, weekStarting: "2026-05-11" }),
      makeRecord({ id: "r3", childSignedOff: true, weekStarting: "2026-05-18" }),
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.childSignOffRate).toBe(67);
  });

  it("calculates savings participation rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", amountSaved: 5 }),
      makeRecord({ id: "r2", amountSaved: 0, weekStarting: "2026-05-11" }),
      makeRecord({ id: "r3", amountSaved: 0, weekStarting: "2026-05-18" }),
      makeRecord({ id: "r4", amountSaved: 3, weekStarting: "2026-05-25" }),
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.savingsParticipationRate).toBe(50);
  });

  it("detects inconsistent payments (single record for a child)", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a" }),
      makeRecord({ id: "r2", childId: "child-a", weekStarting: "2026-05-11" }),
      makeRecord({ id: "r3", childId: "child-b" }),
      // child-b only has 1 record
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.consistentPayments).toBe(false);
  });

  it("detects consistent payments (all children have >= 2 records)", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a" }),
      makeRecord({ id: "r2", childId: "child-a", weekStarting: "2026-05-11" }),
      makeRecord({ id: "r3", childId: "child-b" }),
      makeRecord({ id: "r4", childId: "child-b", weekStarting: "2026-05-11" }),
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.consistentPayments).toBe(true);
  });

  it("returns totalRecords count", () => {
    const records = [
      makeRecord({ id: "r1" }),
      makeRecord({ id: "r2", weekStarting: "2026-05-11" }),
      makeRecord({ id: "r3", weekStarting: "2026-05-18" }),
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.totalRecords).toBe(3);
  });

  it("scores lower when no receipts recorded", () => {
    const records = [
      makeRecord({ id: "r1", receiptRecorded: false }),
      makeRecord({ id: "r2", receiptRecorded: false, weekStarting: "2026-05-11" }),
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.receiptRecordingRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("scores lower when no sign-offs", () => {
    const records = [
      makeRecord({ id: "r1", childSignedOff: false }),
      makeRecord({ id: "r2", childSignedOff: false, weekStarting: "2026-05-11" }),
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.childSignOffRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("scores lower when no savings", () => {
    const records = [
      makeRecord({ id: "r1", amountSaved: 0 }),
      makeRecord({ id: "r2", amountSaved: 0, weekStarting: "2026-05-11" }),
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.savingsParticipationRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("caps score at 25", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a" }),
      makeRecord({ id: "r2", childId: "child-a", weekStarting: "2026-05-11" }),
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("never returns negative score", () => {
    const records = [
      makeRecord({
        id: "r1",
        receiptRecorded: false,
        childSignedOff: false,
        amountSaved: 0,
      }),
    ];
    const result = evaluatePocketMoneyManagement(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// evaluateSavingsEngagement()
// =============================================================================

describe("evaluateSavingsEngagement()", () => {
  it("returns 0 for empty accounts", () => {
    const result = evaluateSavingsEngagement([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAccounts).toBe(0);
    expect(result.accountsPerChild).toBe(0);
    expect(result.savingsGoalRate).toBe(0);
    expect(result.monthlyDepositRegularity).toBe(0);
    expect(result.balanceDiversity).toBe(false);
  });

  it("scores 25 for perfect accounts", () => {
    const accounts = [
      makeAccount({ id: "sa-1", childId: "child-a", childName: "A", balance: 150, savingsGoalSet: true, monthlyDeposits: 4 }),
      makeAccount({ id: "sa-2", childId: "child-b", childName: "B", balance: 85, savingsGoalSet: true, monthlyDeposits: 3 }),
      makeAccount({ id: "sa-3", childId: "child-c", childName: "C", balance: 210, savingsGoalSet: true, monthlyDeposits: 5 }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.overallScore).toBe(25);
  });

  it("calculates accounts per child correctly", () => {
    const accounts = [
      makeAccount({ id: "sa-1", childId: "child-a" }),
      makeAccount({ id: "sa-2", childId: "child-a", accountType: "current" }),
      makeAccount({ id: "sa-3", childId: "child-b" }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.accountsPerChild).toBe(1.5);
  });

  it("calculates savings goal rate correctly", () => {
    const accounts = [
      makeAccount({ id: "sa-1", savingsGoalSet: true }),
      makeAccount({ id: "sa-2", childId: "child-b", savingsGoalSet: false }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.savingsGoalRate).toBe(50);
  });

  it("calculates monthly deposit regularity correctly", () => {
    const accounts = [
      makeAccount({ id: "sa-1", monthlyDeposits: 4 }),
      makeAccount({ id: "sa-2", childId: "child-b", monthlyDeposits: 0 }),
      makeAccount({ id: "sa-3", childId: "child-c", monthlyDeposits: 3 }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.monthlyDepositRegularity).toBe(67);
  });

  it("detects balance diversity when balances differ", () => {
    const accounts = [
      makeAccount({ id: "sa-1", balance: 100 }),
      makeAccount({ id: "sa-2", childId: "child-b", balance: 200 }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.balanceDiversity).toBe(true);
  });

  it("detects no balance diversity when all balances are the same", () => {
    const accounts = [
      makeAccount({ id: "sa-1", balance: 100 }),
      makeAccount({ id: "sa-2", childId: "child-b", balance: 100 }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.balanceDiversity).toBe(false);
  });

  it("detects no balance diversity when all balances are zero", () => {
    const accounts = [
      makeAccount({ id: "sa-1", balance: 0 }),
      makeAccount({ id: "sa-2", childId: "child-b", balance: 0 }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.balanceDiversity).toBe(false);
  });

  it("returns totalAccounts count", () => {
    const accounts = [
      makeAccount({ id: "sa-1" }),
      makeAccount({ id: "sa-2", childId: "child-b" }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.totalAccounts).toBe(2);
  });

  it("scores lower with no goals set", () => {
    const accounts = [
      makeAccount({ id: "sa-1", savingsGoalSet: false, balance: 100 }),
      makeAccount({ id: "sa-2", childId: "child-b", savingsGoalSet: false, balance: 200 }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.savingsGoalRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("scores lower with no monthly deposits", () => {
    const accounts = [
      makeAccount({ id: "sa-1", monthlyDeposits: 0, balance: 100 }),
      makeAccount({ id: "sa-2", childId: "child-b", monthlyDeposits: 0, balance: 200 }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.monthlyDepositRegularity).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("caps score at 25", () => {
    const accounts = [
      makeAccount({ id: "sa-1", childId: "child-a", balance: 500 }),
      makeAccount({ id: "sa-2", childId: "child-b", balance: 1000 }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("never returns negative score", () => {
    const accounts = [
      makeAccount({ id: "sa-1", balance: 0, monthlyDeposits: 0, savingsGoalSet: false }),
    ];
    const result = evaluateSavingsEngagement(accounts);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// evaluateFinancialEducation()
// =============================================================================

describe("evaluateFinancialEducation()", () => {
  it("returns 0 for empty sessions", () => {
    const result = evaluateFinancialEducation([], 3);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.topicVariety).toBe(0);
    expect(result.engagementRate).toBe(0);
    expect(result.resourcesProvidedRate).toBe(0);
    expect(result.childrenReachedRate).toBe(0);
  });

  it("scores 25 for perfect sessions covering all topics", () => {
    const sessions = [
      makeSession({ id: "s1", topic: "budgeting", engagement: "high", resourcesProvided: true, childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s2", topic: "saving", engagement: "high", resourcesProvided: true, childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s3", topic: "banking", engagement: "high", resourcesProvided: true, childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s4", topic: "value_of_money", engagement: "high", resourcesProvided: true, childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s5", topic: "comparison_shopping", engagement: "high", resourcesProvided: true, childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s6", topic: "online_safety", engagement: "high", resourcesProvided: true, childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s7", topic: "debt_awareness", engagement: "high", resourcesProvided: true, childrenAttended: ["child-a", "child-b", "child-c"] }),
    ];
    const result = evaluateFinancialEducation(sessions, 3);
    expect(result.overallScore).toBe(25);
    expect(result.topicVariety).toBe(100);
    expect(result.engagementRate).toBe(100);
    expect(result.resourcesProvidedRate).toBe(100);
    expect(result.childrenReachedRate).toBe(100);
  });

  it("calculates topic variety correctly", () => {
    const sessions = [
      makeSession({ id: "s1", topic: "budgeting" }),
      makeSession({ id: "s2", topic: "saving" }),
      makeSession({ id: "s3", topic: "budgeting" }), // duplicate topic
    ];
    const result = evaluateFinancialEducation(sessions, 3);
    expect(result.topicVariety).toBe(29); // 2/7 = 28.57 -> 29
  });

  it("calculates engagement rate correctly (only high counts)", () => {
    const sessions = [
      makeSession({ id: "s1", engagement: "high" }),
      makeSession({ id: "s2", engagement: "medium" }),
      makeSession({ id: "s3", engagement: "low" }),
    ];
    const result = evaluateFinancialEducation(sessions, 3);
    expect(result.engagementRate).toBe(33);
  });

  it("calculates resources provided rate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", resourcesProvided: true }),
      makeSession({ id: "s2", resourcesProvided: false }),
    ];
    const result = evaluateFinancialEducation(sessions, 3);
    expect(result.resourcesProvidedRate).toBe(50);
  });

  it("calculates children reached rate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", childrenAttended: ["child-a", "child-b"] }),
      makeSession({ id: "s2", childrenAttended: ["child-b", "child-c"] }),
    ];
    const result = evaluateFinancialEducation(sessions, 4);
    expect(result.childrenReachedRate).toBe(75); // 3 unique out of 4
  });

  it("returns 0 for children reached rate when totalChildren is 0", () => {
    const sessions = [
      makeSession({ id: "s1", childrenAttended: ["child-a"] }),
    ];
    const result = evaluateFinancialEducation(sessions, 0);
    expect(result.childrenReachedRate).toBe(0);
  });

  it("returns totalSessions count", () => {
    const sessions = [
      makeSession({ id: "s1" }),
      makeSession({ id: "s2", topic: "saving" }),
    ];
    const result = evaluateFinancialEducation(sessions, 3);
    expect(result.totalSessions).toBe(2);
  });

  it("scores lower with low engagement", () => {
    const sessions = [
      makeSession({ id: "s1", engagement: "low" }),
      makeSession({ id: "s2", engagement: "low", topic: "saving" }),
    ];
    const result = evaluateFinancialEducation(sessions, 3);
    expect(result.engagementRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("scores lower with no resources", () => {
    const sessions = [
      makeSession({ id: "s1", resourcesProvided: false }),
      makeSession({ id: "s2", resourcesProvided: false, topic: "saving" }),
    ];
    const result = evaluateFinancialEducation(sessions, 3);
    expect(result.resourcesProvidedRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("caps score at 25", () => {
    const sessions = [
      makeSession({ id: "s1", topic: "budgeting" }),
      makeSession({ id: "s2", topic: "saving" }),
      makeSession({ id: "s3", topic: "banking" }),
      makeSession({ id: "s4", topic: "value_of_money" }),
      makeSession({ id: "s5", topic: "comparison_shopping" }),
      makeSession({ id: "s6", topic: "online_safety" }),
      makeSession({ id: "s7", topic: "debt_awareness" }),
    ];
    const result = evaluateFinancialEducation(sessions, 3);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("never returns negative score", () => {
    const sessions = [
      makeSession({ id: "s1", engagement: "low", resourcesProvided: false, childrenAttended: [] }),
    ];
    const result = evaluateFinancialEducation(sessions, 10);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// evaluateStaffFinancialReadiness()
// =============================================================================

describe("evaluateStaffFinancialReadiness()", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffFinancialReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.policyTrainedRate).toBe(0);
    expect(result.educationTrainedRate).toBe(0);
    expect(result.budgetingSupportRate).toBe(0);
    expect(result.safeguardingFinancialAbuseRate).toBe(0);
    expect(result.recordKeepingRate).toBe(0);
  });

  it("scores 25 for all staff fully trained", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2", staffName: "Mark Taylor" }),
      makeTraining({ id: "t3", staffId: "s3", staffName: "Lisa Brown" }),
      makeTraining({ id: "t4", staffId: "s4", staffName: "Tom Green" }),
    ];
    const result = evaluateStaffFinancialReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.policyTrainedRate).toBe(100);
    expect(result.educationTrainedRate).toBe(100);
    expect(result.budgetingSupportRate).toBe(100);
    expect(result.safeguardingFinancialAbuseRate).toBe(100);
    expect(result.recordKeepingRate).toBe(100);
  });

  it("calculates policy trained rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", pocketMoneyPolicyTrained: true }),
      makeTraining({ id: "t2", staffId: "s2", pocketMoneyPolicyTrained: false }),
    ];
    const result = evaluateStaffFinancialReadiness(training);
    expect(result.policyTrainedRate).toBe(50);
  });

  it("calculates education trained rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", financialEducationTrained: true }),
      makeTraining({ id: "t2", staffId: "s2", financialEducationTrained: false }),
      makeTraining({ id: "t3", staffId: "s3", financialEducationTrained: true }),
    ];
    const result = evaluateStaffFinancialReadiness(training);
    expect(result.educationTrainedRate).toBe(67);
  });

  it("calculates budgeting support rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", budgetingSupportTrained: false }),
      makeTraining({ id: "t2", staffId: "s2", budgetingSupportTrained: false }),
    ];
    const result = evaluateStaffFinancialReadiness(training);
    expect(result.budgetingSupportRate).toBe(0);
  });

  it("calculates safeguarding financial abuse rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", safeguardingFinancialAbuse: true }),
      makeTraining({ id: "t2", staffId: "s2", safeguardingFinancialAbuse: true }),
      makeTraining({ id: "t3", staffId: "s3", safeguardingFinancialAbuse: false }),
    ];
    const result = evaluateStaffFinancialReadiness(training);
    expect(result.safeguardingFinancialAbuseRate).toBe(67);
  });

  it("calculates record keeping rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", recordKeepingTrained: true }),
      makeTraining({ id: "t2", staffId: "s2", recordKeepingTrained: false }),
      makeTraining({ id: "t3", staffId: "s3", recordKeepingTrained: true }),
      makeTraining({ id: "t4", staffId: "s4", recordKeepingTrained: true }),
    ];
    const result = evaluateStaffFinancialReadiness(training);
    expect(result.recordKeepingRate).toBe(75);
  });

  it("returns totalStaff count", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
    ];
    const result = evaluateStaffFinancialReadiness(training);
    expect(result.totalStaff).toBe(2);
  });

  it("scores lower when no training completed", () => {
    const training = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        pocketMoneyPolicyTrained: false,
        financialEducationTrained: false,
        budgetingSupportTrained: false,
        safeguardingFinancialAbuse: false,
        recordKeepingTrained: false,
      }),
    ];
    const result = evaluateStaffFinancialReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const training = [makeTraining({ id: "t1", staffId: "s1" })];
    const result = evaluateStaffFinancialReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("never returns negative score", () => {
    const training = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        pocketMoneyPolicyTrained: false,
        financialEducationTrained: false,
        budgetingSupportTrained: false,
        safeguardingFinancialAbuse: false,
        recordKeepingTrained: false,
      }),
    ];
    const result = evaluateStaffFinancialReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles mixed training completion", () => {
    const training = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        pocketMoneyPolicyTrained: true,
        financialEducationTrained: true,
        budgetingSupportTrained: false,
        safeguardingFinancialAbuse: true,
        recordKeepingTrained: false,
      }),
    ];
    const result = evaluateStaffFinancialReadiness(training);
    expect(result.policyTrainedRate).toBe(100);
    expect(result.educationTrainedRate).toBe(100);
    expect(result.budgetingSupportRate).toBe(0);
    expect(result.safeguardingFinancialAbuseRate).toBe(100);
    expect(result.recordKeepingRate).toBe(0);
    expect(result.overallScore).toBe(15); // 5 + 5 + 0 + 5 + 0
  });
});

// =============================================================================
// buildChildFinancialSummaries()
// =============================================================================

describe("buildChildFinancialSummaries()", () => {
  it("returns empty array when no records", () => {
    const result = buildChildFinancialSummaries([], []);
    expect(result).toEqual([]);
  });

  it("builds summaries for each unique child in records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", childName: "A" }),
      makeRecord({ id: "r2", childId: "child-b", childName: "B" }),
    ];
    const result = buildChildFinancialSummaries(records, []);
    expect(result).toHaveLength(2);
    expect(result[0].childId).toBe("child-a");
    expect(result[1].childId).toBe("child-b");
  });

  it("calculates total pocket money correctly", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", amountGiven: 10 }),
      makeRecord({ id: "r2", childId: "child-a", amountGiven: 10, weekStarting: "2026-05-11" }),
    ];
    const result = buildChildFinancialSummaries(records, []);
    expect(result[0].totalPocketMoney).toBe(20);
  });

  it("calculates total saved correctly", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", amountSaved: 3 }),
      makeRecord({ id: "r2", childId: "child-a", amountSaved: 5, weekStarting: "2026-05-11" }),
    ];
    const result = buildChildFinancialSummaries(records, []);
    expect(result[0].totalSaved).toBe(8);
  });

  it("calculates savings rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", amountGiven: 10, amountSaved: 3 }),
      makeRecord({ id: "r2", childId: "child-a", amountGiven: 10, amountSaved: 2, weekStarting: "2026-05-11" }),
    ];
    const result = buildChildFinancialSummaries(records, []);
    expect(result[0].savingsRate).toBe(25); // 5/20 = 25%
  });

  it("calculates receipt rate per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", receiptRecorded: true }),
      makeRecord({ id: "r2", childId: "child-a", receiptRecorded: false, weekStarting: "2026-05-11" }),
    ];
    const result = buildChildFinancialSummaries(records, []);
    expect(result[0].receiptRate).toBe(50);
  });

  it("calculates sign-off rate per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", childSignedOff: true }),
      makeRecord({ id: "r2", childId: "child-a", childSignedOff: true, weekStarting: "2026-05-11" }),
      makeRecord({ id: "r3", childId: "child-a", childSignedOff: false, weekStarting: "2026-05-18" }),
    ];
    const result = buildChildFinancialSummaries(records, []);
    expect(result[0].signOffRate).toBe(67);
  });

  it("detects when child has savings account", () => {
    const records = [makeRecord({ id: "r1", childId: "child-a" })];
    const accounts = [makeAccount({ id: "sa-1", childId: "child-a" })];
    const result = buildChildFinancialSummaries(records, accounts);
    expect(result[0].hasSavingsAccount).toBe(true);
  });

  it("detects when child has no savings account", () => {
    const records = [makeRecord({ id: "r1", childId: "child-a" })];
    const result = buildChildFinancialSummaries(records, []);
    expect(result[0].hasSavingsAccount).toBe(false);
  });

  it("calculates score 0-10 with all factors", () => {
    const records = [
      makeRecord({
        id: "r1",
        childId: "child-a",
        amountGiven: 10,
        amountSaved: 5, // 50% savings rate -> 2 points
        receiptRecorded: true, // 100% -> 2 points
        childSignedOff: true, // 100% -> 2 points
      }),
    ];
    const accounts = [
      makeAccount({
        id: "sa-1",
        childId: "child-a",
        savingsGoalSet: true, // +1 point for goal, +2 points for account
      }),
    ];
    const result = buildChildFinancialSummaries(records, accounts);
    // savings rate 50% -> round(0.5*3) = 2
    // receipt 100% -> round(1*2) = 2
    // signOff 100% -> round(1*2) = 2
    // hasAccount -> 2
    // hasGoal -> 1
    // Total = 9
    expect(result[0].overallScore).toBe(9);
  });

  it("caps child score at 10", () => {
    const records = [
      makeRecord({
        id: "r1",
        childId: "child-a",
        amountGiven: 10,
        amountSaved: 10, // 100% -> 3
        receiptRecorded: true, // 100% -> 2
        childSignedOff: true, // 100% -> 2
      }),
    ];
    const accounts = [
      makeAccount({ id: "sa-1", childId: "child-a", savingsGoalSet: true }),
    ]; // +2 account +1 goal = 3
    // Total would be 3+2+2+2+1 = 10, exactly at cap
    const result = buildChildFinancialSummaries(records, accounts);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("minimum child score is 0", () => {
    const records = [
      makeRecord({
        id: "r1",
        childId: "child-a",
        amountGiven: 10,
        amountSaved: 0,
        receiptRecorded: false,
        childSignedOff: false,
      }),
    ];
    const result = buildChildFinancialSummaries(records, []);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// generatePocketMoneyFinancialLiteracyIntelligence()
// =============================================================================

describe("generatePocketMoneyFinancialLiteracyIntelligence()", () => {
  it("returns full intelligence for complete data", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-a", childName: "Alex", weekStarting: "2026-05-11" }),
      makeRecord({ id: "r3", childId: "child-b", childName: "Jordan" }),
      makeRecord({ id: "r4", childId: "child-b", childName: "Jordan", weekStarting: "2026-05-11" }),
      makeRecord({ id: "r5", childId: "child-c", childName: "Morgan" }),
      makeRecord({ id: "r6", childId: "child-c", childName: "Morgan", weekStarting: "2026-05-11" }),
    ];
    const accounts = [
      makeAccount({ id: "sa-1", childId: "child-a", childName: "Alex", balance: 150 }),
      makeAccount({ id: "sa-2", childId: "child-b", childName: "Jordan", balance: 85 }),
      makeAccount({ id: "sa-3", childId: "child-c", childName: "Morgan", balance: 210 }),
    ];
    const sessions = [
      makeSession({ id: "s1", topic: "budgeting", childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s2", topic: "saving", childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s3", topic: "banking", childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s4", topic: "comparison_shopping", childrenAttended: ["child-a", "child-b", "child-c"] }),
    ];
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
      makeTraining({ id: "t3", staffId: "s3" }),
      makeTraining({ id: "t4", staffId: "s4" }),
    ];

    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      records, accounts, sessions, training,
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-03-31");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.pocketMoneyManagement.overallScore).toBeLessThanOrEqual(25);
    expect(result.savingsEngagement.overallScore).toBeLessThanOrEqual(25);
    expect(result.financialEducation.overallScore).toBeLessThanOrEqual(25);
    expect(result.staffFinancialReadiness.overallScore).toBeLessThanOrEqual(25);
    expect(result.childFinancialSummaries).toHaveLength(3);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("returns all zeros for completely empty data", () => {
    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      [], [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.pocketMoneyManagement.overallScore).toBe(0);
    expect(result.savingsEngagement.overallScore).toBe(0);
    expect(result.financialEducation.overallScore).toBe(0);
    expect(result.staffFinancialReadiness.overallScore).toBe(0);
    expect(result.childFinancialSummaries).toHaveLength(0);
    expect(result.strengths).toHaveLength(0);
  });

  it("generates URGENT areas for empty data", () => {
    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      [], [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.areasForImprovement.every((a) => a.startsWith("URGENT:"))).toBe(true);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions.every((a) => a.startsWith("URGENT:"))).toBe(true);
  });

  it("generates URGENT actions for empty records", () => {
    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      [], [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );

    const recordAction = result.actions.find((a) => a.includes("pocket money recording"));
    expect(recordAction).toBeDefined();
    expect(recordAction).toContain("URGENT");
  });

  it("generates URGENT actions for empty accounts", () => {
    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      [], [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );

    const accountAction = result.actions.find((a) => a.includes("savings accounts"));
    expect(accountAction).toBeDefined();
    expect(accountAction).toContain("URGENT");
  });

  it("generates URGENT actions for empty sessions", () => {
    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      [], [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );

    const sessionAction = result.actions.find((a) => a.includes("financial education"));
    expect(sessionAction).toBeDefined();
    expect(sessionAction).toContain("URGENT");
  });

  it("generates URGENT actions for empty training", () => {
    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      [], [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );

    const trainingAction = result.actions.find((a) => a.includes("financial training"));
    expect(trainingAction).toBeDefined();
    expect(trainingAction).toContain("URGENT");
  });

  it("generates strengths for high scores", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a" }),
      makeRecord({ id: "r2", childId: "child-a", weekStarting: "2026-05-11" }),
      makeRecord({ id: "r3", childId: "child-b" }),
      makeRecord({ id: "r4", childId: "child-b", weekStarting: "2026-05-11" }),
      makeRecord({ id: "r5", childId: "child-c" }),
      makeRecord({ id: "r6", childId: "child-c", weekStarting: "2026-05-11" }),
    ];
    const accounts = [
      makeAccount({ id: "sa-1", childId: "child-a", balance: 150 }),
      makeAccount({ id: "sa-2", childId: "child-b", balance: 85 }),
      makeAccount({ id: "sa-3", childId: "child-c", balance: 210 }),
    ];
    const sessions = [
      makeSession({ id: "s1", topic: "budgeting", childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s2", topic: "saving", childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s3", topic: "banking", childrenAttended: ["child-a", "child-b", "child-c"] }),
      makeSession({ id: "s4", topic: "comparison_shopping", childrenAttended: ["child-a", "child-b", "child-c"] }),
    ];
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
      makeTraining({ id: "t3", staffId: "s3" }),
      makeTraining({ id: "t4", staffId: "s4" }),
    ];

    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      records, accounts, sessions, training,
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("caps overall score at 100", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a" }),
      makeRecord({ id: "r2", childId: "child-a", weekStarting: "2026-05-11" }),
    ];
    const accounts = [makeAccount({ id: "sa-1", childId: "child-a", balance: 150 })];
    const sessions = [
      makeSession({ id: "s1", topic: "budgeting", childrenAttended: ["child-a"] }),
    ];
    const training = [makeTraining({ id: "t1", staffId: "s1" })];

    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      records, accounts, sessions, training,
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes all 7 regulatory links", () => {
    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      [], [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((r) => r.includes("Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Reg 14"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("UNCRC Article 27"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("NMS 10"))).toBe(true);
  });

  it("generates areas for improvement when receipt rate is low", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", receiptRecorded: false }),
      makeRecord({ id: "r2", childId: "child-a", receiptRecorded: false, weekStarting: "2026-05-11" }),
    ];

    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      records, [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.areasForImprovement.some((a) => a.includes("Receipt recording"))).toBe(true);
  });

  it("generates areas for improvement when child sign-off is low", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", childSignedOff: false }),
      makeRecord({ id: "r2", childId: "child-a", childSignedOff: false, weekStarting: "2026-05-11" }),
    ];

    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      records, [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.areasForImprovement.some((a) => a.includes("sign-off"))).toBe(true);
  });

  it("generates actions for low savings participation", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", amountSaved: 0 }),
      makeRecord({ id: "r2", childId: "child-a", amountSaved: 0, weekStarting: "2026-05-11" }),
    ];

    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      records, [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.actions.some((a) => a.includes("savings plan"))).toBe(true);
  });

  it("generates actions for low staff training", () => {
    const training = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        pocketMoneyPolicyTrained: false,
        safeguardingFinancialAbuse: false,
        recordKeepingTrained: false,
      }),
    ];

    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      [], [], [], training,
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.actions.some((a) => a.includes("pocket money policy training"))).toBe(true);
    expect(result.actions.some((a) => a.includes("safeguarding financial abuse"))).toBe(true);
    expect(result.actions.some((a) => a.includes("record keeping training"))).toBe(true);
  });

  it("correctly sets rating based on overall score", () => {
    // Empty data = 0 = inadequate
    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      [], [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );
    expect(result.rating).toBe("inadequate");
  });

  it("builds child summaries from records and accounts", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-b", childName: "Jordan" }),
    ];
    const accounts = [
      makeAccount({ id: "sa-1", childId: "child-a", childName: "Alex" }),
    ];

    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      records, accounts, [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.childFinancialSummaries).toHaveLength(2);
    expect(result.childFinancialSummaries[0].childId).toBe("child-a");
    expect(result.childFinancialSummaries[0].hasSavingsAccount).toBe(true);
    expect(result.childFinancialSummaries[1].childId).toBe("child-b");
    expect(result.childFinancialSummaries[1].hasSavingsAccount).toBe(false);
  });

  it("handles mixed quality data correctly", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-a", receiptRecorded: true, childSignedOff: true, amountSaved: 3 }),
      makeRecord({ id: "r2", childId: "child-a", receiptRecorded: false, childSignedOff: false, amountSaved: 0, weekStarting: "2026-05-11" }),
    ];
    const accounts = [
      makeAccount({ id: "sa-1", childId: "child-a", savingsGoalSet: false, monthlyDeposits: 0 }),
    ];
    const sessions = [
      makeSession({ id: "s1", topic: "budgeting", engagement: "low", resourcesProvided: false, childrenAttended: ["child-a"] }),
    ];
    const training = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        pocketMoneyPolicyTrained: true,
        financialEducationTrained: false,
        budgetingSupportTrained: false,
        safeguardingFinancialAbuse: true,
        recordKeepingTrained: false,
      }),
    ];

    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      records, accounts, sessions, training,
      "home-oak", "2026-01-01", "2026-03-31",
    );

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(100);
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("never returns negative overall score", () => {
    const result = generatePocketMoneyFinancialLiteracyIntelligence(
      [], [], [], [],
      "home-oak", "2026-01-01", "2026-03-31",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});
