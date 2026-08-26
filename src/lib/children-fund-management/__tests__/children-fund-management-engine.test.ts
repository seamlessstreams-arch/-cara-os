// ==============================================================================
// Children's Fund Management Intelligence Engine -- Tests
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateAccountManagement,
  evaluateTransactionIntegrity,
  evaluateFinancialLiteracy,
  evaluateAuditCompliance,
  buildChildFinancialProfiles,
  generateChildrenFundManagementIntelligence,
  getRating,
  getTransactionTypeLabel,
  getAccountStatusLabel,
  getReconciliationFrequencyLabel,
  getFinancialLiteracyTopicLabel,
  getChildConsentLabel,
  getRatingLabel,
} from "../children-fund-management-engine";
import type {
  ChildAccount,
  FinancialTransaction,
  FinancialLiteracySession,
  FinancialAudit,
} from "../children-fund-management-engine";

// -- Fixtures -----------------------------------------------------------------

function makeAccount(overrides: Partial<ChildAccount> = {}): ChildAccount {
  return {
    id: "acc-001",
    childId: "child-alex",
    childName: "Alex",
    accountStatus: "active",
    balance: 45.5,
    lastReconciled: "2026-05-10T10:00:00Z",
    reconciliationFrequency: "weekly",
    childHasAccess: true,
    signedAgreement: true,
    savingsGoal: 200,
    savingsBalance: 85,
    ...overrides,
  };
}

function makeTransaction(
  overrides: Partial<FinancialTransaction> = {},
): FinancialTransaction {
  return {
    id: "txn-001",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-12T10:00:00Z",
    transactionType: "pocket_money",
    amount: 15,
    description: "Weekly pocket money",
    receiptRetained: true,
    childConsent: "informed_consent",
    authorisedBy: "staff-rm-01",
    twoSignatures: true,
    ...overrides,
  };
}

function makeSession(
  overrides: Partial<FinancialLiteracySession> = {},
): FinancialLiteracySession {
  return {
    id: "sess-001",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-05T14:00:00Z",
    topic: "budgeting",
    duration: 45,
    facilitator: "staff-rm-01",
    childEngaged: true,
    practicalComponent: true,
    ageAppropriate: true,
    ...overrides,
  };
}

function makeAudit(overrides: Partial<FinancialAudit> = {}): FinancialAudit {
  return {
    id: "aud-001",
    auditDate: "2026-04-01T10:00:00Z",
    auditor: "John Carter",
    allAccountsReconciled: true,
    receiptRetentionCompliant: true,
    twoSignatureCompliant: true,
    childAccessVerified: true,
    discrepanciesFound: 0,
    discrepanciesResolved: 0,
    policyCompliant: true,
    ...overrides,
  };
}

// ==============================================================================
// pct helper
// ==============================================================================


// ==============================================================================
// getRating
// ==============================================================================

describe("getRating", () => {
  it("returns outstanding for 80+", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for below 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ==============================================================================
// evaluateAccountManagement
// ==============================================================================

describe("evaluateAccountManagement", () => {
  it("returns zero scores for empty accounts", () => {
    const result = evaluateAccountManagement([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAccounts).toBe(0);
    expect(result.activeRate).toBeNull();
    expect(result.reconciledRate).toBeNull();
    expect(result.childAccessRate).toBeNull();
    expect(result.signedAgreementRate).toBeNull();
    expect(result.overdueCount).toBe(0);
    expect(result.averageBalance).toBe(0);
    expect(result.totalSavings).toBe(0);
  });

  it("scores fully compliant accounts highly", () => {
    const accounts = [
      makeAccount({ id: "acc-001", childId: "child-alex" }),
      makeAccount({ id: "acc-002", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = evaluateAccountManagement(accounts);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.totalAccounts).toBe(2);
    expect(result.activeRate).toBe(100);
    expect(result.reconciledRate).toBe(100);
    expect(result.childAccessRate).toBe(100);
    expect(result.signedAgreementRate).toBe(100);
    expect(result.overdueCount).toBe(0);
  });

  it("calculates average balance and total savings", () => {
    const accounts = [
      makeAccount({ balance: 30, savingsBalance: 100 }),
      makeAccount({ id: "acc-002", childId: "child-jordan", balance: 50, savingsBalance: 200 }),
    ];
    const result = evaluateAccountManagement(accounts);
    expect(result.averageBalance).toBe(40);
    expect(result.totalSavings).toBe(300);
  });

  it("penalises overdue reconciliation accounts", () => {
    const accounts = [
      makeAccount({ accountStatus: "overdue_reconciliation" }),
    ];
    const result = evaluateAccountManagement(accounts);
    expect(result.overdueCount).toBe(1);
    expect(result.activeRate).toBe(0);
    // Score should be lower due to penalty
    const goodAccounts = [makeAccount()];
    const goodResult = evaluateAccountManagement(goodAccounts);
    expect(result.overallScore).toBeLessThan(goodResult.overallScore);
  });

  it("detects accounts without child access", () => {
    const accounts = [
      makeAccount({ childHasAccess: false }),
      makeAccount({ id: "acc-002", childId: "child-jordan", childHasAccess: true }),
    ];
    const result = evaluateAccountManagement(accounts);
    expect(result.childAccessRate).toBe(50);
  });

  it("detects accounts without signed agreements", () => {
    const accounts = [
      makeAccount({ signedAgreement: false }),
    ];
    const result = evaluateAccountManagement(accounts);
    expect(result.signedAgreementRate).toBe(0);
  });

  it("tracks accounts with null lastReconciled", () => {
    const accounts = [
      makeAccount({ lastReconciled: null }),
      makeAccount({ id: "acc-002", childId: "child-jordan", lastReconciled: "2026-05-10T10:00:00Z" }),
    ];
    const result = evaluateAccountManagement(accounts);
    expect(result.reconciledRate).toBe(50);
  });

  it("caps score at 25", () => {
    const accounts = [makeAccount()];
    const result = evaluateAccountManagement(accounts);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score never goes below 0", () => {
    const accounts = [
      makeAccount({ accountStatus: "overdue_reconciliation", childHasAccess: false, signedAgreement: false, lastReconciled: null }),
      makeAccount({ id: "acc-002", childId: "child-jordan", accountStatus: "overdue_reconciliation", childHasAccess: false, signedAgreement: false, lastReconciled: null }),
      makeAccount({ id: "acc-003", childId: "child-morgan", accountStatus: "overdue_reconciliation", childHasAccess: false, signedAgreement: false, lastReconciled: null }),
      makeAccount({ id: "acc-004", childId: "child-sam", accountStatus: "overdue_reconciliation", childHasAccess: false, signedAgreement: false, lastReconciled: null }),
    ];
    const result = evaluateAccountManagement(accounts);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ==============================================================================
// evaluateTransactionIntegrity
// ==============================================================================

describe("evaluateTransactionIntegrity", () => {
  it("returns zero scores for empty transactions", () => {
    const result = evaluateTransactionIntegrity([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalTransactions).toBe(0);
    expect(result.receiptRate).toBeNull();
    expect(result.consentRate).toBeNull();
    expect(result.twoSignatureRate).toBeNull();
    expect(result.averageTransaction).toBe(0);
  });

  it("scores fully compliant transactions highly", () => {
    const txns = [
      makeTransaction(),
      makeTransaction({ id: "txn-002", transactionType: "savings_deposit", amount: 10 }),
    ];
    const result = evaluateTransactionIntegrity(txns);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.receiptRate).toBe(100);
    expect(result.consentRate).toBe(100);
    expect(result.twoSignatureRate).toBe(100);
  });

  it("calculates average transaction amount", () => {
    const txns = [
      makeTransaction({ amount: 10 }),
      makeTransaction({ id: "txn-002", amount: 20 }),
    ];
    const result = evaluateTransactionIntegrity(txns);
    expect(result.averageTransaction).toBe(15);
  });

  it("builds type distribution", () => {
    const txns = [
      makeTransaction({ transactionType: "pocket_money" }),
      makeTransaction({ id: "txn-002", transactionType: "pocket_money" }),
      makeTransaction({ id: "txn-003", transactionType: "savings_deposit" }),
    ];
    const result = evaluateTransactionIntegrity(txns);
    expect(result.typeDistribution.pocket_money).toBe(2);
    expect(result.typeDistribution.savings_deposit).toBe(1);
    expect(result.typeDistribution.birthday_gift).toBe(0);
  });

  it("detects missing receipts", () => {
    const txns = [
      makeTransaction({ receiptRetained: false }),
      makeTransaction({ id: "txn-002", receiptRetained: true }),
    ];
    const result = evaluateTransactionIntegrity(txns);
    expect(result.receiptRate).toBe(50);
  });

  it("counts not_applicable consent as valid", () => {
    const txns = [
      makeTransaction({ childConsent: "not_applicable" }),
    ];
    const result = evaluateTransactionIntegrity(txns);
    expect(result.consentRate).toBe(100);
  });

  it("detects missing consent", () => {
    const txns = [
      makeTransaction({ childConsent: "no_consent_sought" }),
      makeTransaction({ id: "txn-002", childConsent: "declined" }),
      makeTransaction({ id: "txn-003", childConsent: "informed_consent" }),
    ];
    const result = evaluateTransactionIntegrity(txns);
    expect(result.consentRate).toBe(33);
  });

  it("detects missing two-signature authorisation", () => {
    const txns = [
      makeTransaction({ twoSignatures: false }),
      makeTransaction({ id: "txn-002", twoSignatures: true }),
    ];
    const result = evaluateTransactionIntegrity(txns);
    expect(result.twoSignatureRate).toBe(50);
  });

  it("caps score at 25", () => {
    const txns = [makeTransaction()];
    const result = evaluateTransactionIntegrity(txns);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ==============================================================================
// evaluateFinancialLiteracy
// ==============================================================================

describe("evaluateFinancialLiteracy", () => {
  it("returns zero scores for empty sessions", () => {
    const result = evaluateFinancialLiteracy([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.engagementRate).toBeNull();
    expect(result.practicalRate).toBeNull();
    expect(result.ageAppropriateRate).toBeNull();
    expect(result.topicCoverage).toBeNull();
  });

  it("scores high-quality sessions highly", () => {
    const sessions = [
      makeSession({ topic: "budgeting" }),
      makeSession({ id: "sess-002", topic: "saving" }),
      makeSession({ id: "sess-003", topic: "banking" }),
      makeSession({ id: "sess-004", topic: "spending_decisions" }),
      makeSession({ id: "sess-005", topic: "value_of_money" }),
      makeSession({ id: "sess-006", topic: "online_safety_financial" }),
      makeSession({ id: "sess-007", topic: "benefits_entitlements" }),
      makeSession({ id: "sess-008", topic: "debt_awareness" }),
    ];
    const result = evaluateFinancialLiteracy(sessions);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.engagementRate).toBe(100);
    expect(result.topicCoverage).toBe(100);
  });

  it("calculates topic coverage correctly", () => {
    const sessions = [
      makeSession({ topic: "budgeting" }),
      makeSession({ id: "sess-002", topic: "saving" }),
    ];
    const result = evaluateFinancialLiteracy(sessions);
    expect(result.topicCoverage).toBe(25); // 2 of 8 topics
  });

  it("builds topic distribution", () => {
    const sessions = [
      makeSession({ topic: "budgeting" }),
      makeSession({ id: "sess-002", topic: "budgeting" }),
      makeSession({ id: "sess-003", topic: "saving" }),
    ];
    const result = evaluateFinancialLiteracy(sessions);
    expect(result.topicDistribution.budgeting).toBe(2);
    expect(result.topicDistribution.saving).toBe(1);
    expect(result.topicDistribution.banking).toBe(0);
  });

  it("detects low engagement", () => {
    const sessions = [
      makeSession({ childEngaged: false }),
      makeSession({ id: "sess-002", childEngaged: true }),
    ];
    const result = evaluateFinancialLiteracy(sessions);
    expect(result.engagementRate).toBe(50);
  });

  it("detects missing practical components", () => {
    const sessions = [
      makeSession({ practicalComponent: false }),
    ];
    const result = evaluateFinancialLiteracy(sessions);
    expect(result.practicalRate).toBe(0);
  });

  it("detects age-inappropriate sessions", () => {
    const sessions = [
      makeSession({ ageAppropriate: false }),
      makeSession({ id: "sess-002", ageAppropriate: true }),
    ];
    const result = evaluateFinancialLiteracy(sessions);
    expect(result.ageAppropriateRate).toBe(50);
  });

  it("caps score at 25", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `sess-${i}`, topic: "budgeting" }),
    );
    const result = evaluateFinancialLiteracy(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ==============================================================================
// evaluateAuditCompliance
// ==============================================================================

describe("evaluateAuditCompliance", () => {
  it("returns zero scores for empty audits", () => {
    const result = evaluateAuditCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAudits).toBe(0);
    expect(result.allReconciledRate).toBeNull();
    expect(result.receiptCompliantRate).toBeNull();
    expect(result.twoSigCompliantRate).toBeNull();
    expect(result.discrepancyRate).toBeNull();
    expect(result.policyCompliantRate).toBeNull();
  });

  it("scores fully compliant audits highly", () => {
    const audits = [makeAudit()];
    const result = evaluateAuditCompliance(audits);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.allReconciledRate).toBe(100);
    expect(result.receiptCompliantRate).toBe(100);
    expect(result.twoSigCompliantRate).toBe(100);
    expect(result.policyCompliantRate).toBe(100);
  });

  it("calculates discrepancy resolution rate", () => {
    const audits = [
      makeAudit({ discrepanciesFound: 4, discrepanciesResolved: 3 }),
    ];
    const result = evaluateAuditCompliance(audits);
    expect(result.discrepancyRate).toBe(75);
  });

  it("handles zero discrepancies found", () => {
    const audits = [
      makeAudit({ discrepanciesFound: 0, discrepanciesResolved: 0 }),
    ];
    const result = evaluateAuditCompliance(audits);
    expect(result.discrepancyRate).toBeNull();
  });

  it("detects non-compliant audits", () => {
    const audits = [
      makeAudit({ allAccountsReconciled: false, receiptRetentionCompliant: false }),
      makeAudit({ id: "aud-002" }),
    ];
    const result = evaluateAuditCompliance(audits);
    expect(result.allReconciledRate).toBe(50);
    expect(result.receiptCompliantRate).toBe(50);
  });

  it("detects policy non-compliance", () => {
    const audits = [
      makeAudit({ policyCompliant: false }),
    ];
    const result = evaluateAuditCompliance(audits);
    expect(result.policyCompliantRate).toBe(0);
  });

  it("caps score at 25", () => {
    const audits = [makeAudit()];
    const result = evaluateAuditCompliance(audits);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("aggregates across multiple audits", () => {
    const audits = [
      makeAudit({ discrepanciesFound: 2, discrepanciesResolved: 2 }),
      makeAudit({ id: "aud-002", discrepanciesFound: 3, discrepanciesResolved: 1 }),
    ];
    const result = evaluateAuditCompliance(audits);
    // 3 resolved of 5 found = 60%
    expect(result.discrepancyRate).toBe(60);
  });
});

// ==============================================================================
// buildChildFinancialProfiles
// ==============================================================================

describe("buildChildFinancialProfiles", () => {
  it("builds profiles with correct transaction count", () => {
    const accounts = [makeAccount()];
    const transactions = [
      makeTransaction(),
      makeTransaction({ id: "txn-002" }),
    ];
    const sessions = [makeSession()];

    const profiles = buildChildFinancialProfiles(accounts, transactions, sessions);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].transactionCount).toBe(2);
    expect(profiles[0].literacySessions).toBe(1);
  });

  it("calculates consent rate per child", () => {
    const accounts = [makeAccount()];
    const transactions = [
      makeTransaction({ childConsent: "informed_consent" }),
      makeTransaction({ id: "txn-002", childConsent: "no_consent_sought" }),
    ];

    const profiles = buildChildFinancialProfiles(accounts, transactions, []);
    expect(profiles[0].consentRate).toBe(50);
  });

  it("assigns higher score for active accounts with access", () => {
    const activeAccount = makeAccount({ accountStatus: "active", childHasAccess: true });
    const dormantAccount = makeAccount({
      id: "acc-002",
      childId: "child-jordan",
      childName: "Jordan",
      accountStatus: "dormant",
      childHasAccess: false,
    });

    const profiles = buildChildFinancialProfiles(
      [activeAccount, dormantAccount],
      [],
      [],
    );
    expect(profiles[0].overallScore).toBeGreaterThan(profiles[1].overallScore);
  });

  it("caps profile score at 10", () => {
    const accounts = [makeAccount()];
    const transactions = [
      makeTransaction(),
      makeTransaction({ id: "txn-002" }),
    ];
    const sessions = [
      makeSession(),
      makeSession({ id: "sess-002" }),
      makeSession({ id: "sess-003" }),
    ];

    const profiles = buildChildFinancialProfiles(accounts, transactions, sessions);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("assigns 0 score for worst-case profile", () => {
    const accounts = [
      makeAccount({
        accountStatus: "dormant",
        childHasAccess: false,
      }),
    ];
    const profiles = buildChildFinancialProfiles(accounts, [], []);
    expect(profiles[0].overallScore).toBe(0);
  });

  it("includes balance and savings from account", () => {
    const accounts = [makeAccount({ balance: 55.5, savingsBalance: 120 })];
    const profiles = buildChildFinancialProfiles(accounts, [], []);
    expect(profiles[0].balance).toBe(55.5);
    expect(profiles[0].savingsBalance).toBe(120);
  });

  it("filters transactions and sessions by child", () => {
    const accounts = [
      makeAccount({ childId: "child-alex" }),
      makeAccount({ id: "acc-002", childId: "child-jordan", childName: "Jordan" }),
    ];
    const transactions = [
      makeTransaction({ childId: "child-alex" }),
      makeTransaction({ id: "txn-002", childId: "child-alex" }),
      makeTransaction({ id: "txn-003", childId: "child-jordan" }),
    ];
    const sessions = [
      makeSession({ childId: "child-jordan" }),
    ];

    const profiles = buildChildFinancialProfiles(accounts, transactions, sessions);
    const alexProfile = profiles.find((p) => p.childId === "child-alex")!;
    const jordanProfile = profiles.find((p) => p.childId === "child-jordan")!;
    expect(alexProfile.transactionCount).toBe(2);
    expect(alexProfile.literacySessions).toBe(0);
    expect(jordanProfile.transactionCount).toBe(1);
    expect(jordanProfile.literacySessions).toBe(1);
  });
});

// ==============================================================================
// generateChildrenFundManagementIntelligence
// ==============================================================================

describe("generateChildrenFundManagementIntelligence", () => {
  const baseAccounts: ChildAccount[] = [
    makeAccount({ childId: "child-alex", childName: "Alex" }),
    makeAccount({ id: "acc-002", childId: "child-jordan", childName: "Jordan" }),
  ];

  const baseTransactions: FinancialTransaction[] = [
    makeTransaction({ childId: "child-alex" }),
    makeTransaction({ id: "txn-002", childId: "child-jordan", childName: "Jordan" }),
  ];

  const baseSessions: FinancialLiteracySession[] = [
    makeSession({ topic: "budgeting" }),
    makeSession({ id: "sess-002", topic: "saving" }),
    makeSession({ id: "sess-003", topic: "banking" }),
    makeSession({ id: "sess-004", topic: "spending_decisions" }),
  ];

  const baseAudits: FinancialAudit[] = [makeAudit()];

  it("produces overall intelligence with correct structure", () => {
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      baseTransactions,
      baseSessions,
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );

    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-03-31");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(
      result.rating,
    );
    expect(result.accountManagement).toBeDefined();
    expect(result.transactionIntegrity).toBeDefined();
    expect(result.financialLiteracy).toBeDefined();
    expect(result.auditCompliance).toBeDefined();
    expect(result.childProfiles).toHaveLength(2);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("sums four evaluator scores for overall", () => {
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      baseTransactions,
      baseSessions,
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );

    const expectedSum =
      result.accountManagement.overallScore +
      result.transactionIntegrity.overallScore +
      result.financialLiteracy.overallScore +
      result.auditCompliance.overallScore;

    expect(result.overallScore).toBe(
      Math.min(100, Math.max(0, expectedSum)),
    );
  });

  it("produces strengths for high-scoring data", () => {
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      baseTransactions,
      baseSessions,
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );

    // With good data we should get at least some strengths
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("produces areas for improvement for poor data", () => {
    const result = generateChildrenFundManagementIntelligence(
      [],
      [],
      [],
      [],
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("identifies missing accounts as an issue", () => {
    const result = generateChildrenFundManagementIntelligence(
      [],
      baseTransactions,
      baseSessions,
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );
    expect(
      result.areasForImprovement.some((a) => a.includes("No child accounts")),
    ).toBe(true);
  });

  it("identifies missing transactions as an issue", () => {
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      [],
      baseSessions,
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );
    expect(
      result.areasForImprovement.some((a) => a.includes("No financial transactions")),
    ).toBe(true);
  });

  it("identifies missing sessions as an issue", () => {
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      baseTransactions,
      [],
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );
    expect(
      result.areasForImprovement.some((a) => a.includes("No financial literacy")),
    ).toBe(true);
  });

  it("identifies missing audits as an issue", () => {
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      baseTransactions,
      baseSessions,
      [],
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );
    expect(
      result.areasForImprovement.some((a) => a.includes("No financial audits")),
    ).toBe(true);
  });

  it("caps overall score at 100", () => {
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      baseTransactions,
      baseSessions,
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes regulatory links", () => {
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      baseTransactions,
      baseSessions,
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 21"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 6"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 26"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CA 1989 s23(2)"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 39"))).toBe(true);
  });

  it("flags low receipt retention as area for improvement", () => {
    const poorTxns = [
      makeTransaction({ receiptRetained: false }),
      makeTransaction({ id: "txn-002", receiptRetained: false }),
    ];
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      poorTxns,
      baseSessions,
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );
    expect(
      result.areasForImprovement.some((a) => a.includes("Receipt retention")),
    ).toBe(true);
  });

  it("flags low consent rate as area for improvement", () => {
    const poorTxns = [
      makeTransaction({ childConsent: "no_consent_sought" }),
      makeTransaction({ id: "txn-002", childConsent: "no_consent_sought" }),
    ];
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      poorTxns,
      baseSessions,
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );
    expect(
      result.areasForImprovement.some((a) => a.includes("consent rate")),
    ).toBe(true);
  });

  it("generates actions for overdue accounts", () => {
    const overdueAccounts = [
      makeAccount({ accountStatus: "overdue_reconciliation" }),
    ];
    const result = generateChildrenFundManagementIntelligence(
      overdueAccounts,
      baseTransactions,
      baseSessions,
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );
    expect(
      result.actions.some((a) => a.includes("overdue")),
    ).toBe(true);
  });

  it("generates actions for low two-signature rate", () => {
    const poorTxns = [
      makeTransaction({ twoSignatures: false }),
      makeTransaction({ id: "txn-002", twoSignatures: false }),
    ];
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      poorTxns,
      baseSessions,
      baseAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );
    expect(
      result.actions.some((a) => a.includes("two-signature")),
    ).toBe(true);
  });

  it("rates outstanding for excellent data", () => {
    // All compliant data with broad topic coverage
    const fullSessions: FinancialLiteracySession[] = [
      makeSession({ id: "s1", topic: "budgeting" }),
      makeSession({ id: "s2", topic: "saving" }),
      makeSession({ id: "s3", topic: "banking" }),
      makeSession({ id: "s4", topic: "spending_decisions" }),
      makeSession({ id: "s5", topic: "value_of_money" }),
      makeSession({ id: "s6", topic: "online_safety_financial" }),
      makeSession({ id: "s7", topic: "benefits_entitlements" }),
      makeSession({ id: "s8", topic: "debt_awareness" }),
    ];
    const goodAudits = [
      makeAudit({ discrepanciesFound: 2, discrepanciesResolved: 2 }),
    ];
    const result = generateChildrenFundManagementIntelligence(
      baseAccounts,
      baseTransactions,
      fullSessions,
      goodAudits,
      "home-oak",
      "2026-01-01",
      "2026-03-31",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });
});

// ==============================================================================
// Label Helpers
// ==============================================================================

describe("Label helpers", () => {
  it("getTransactionTypeLabel returns readable labels", () => {
    expect(getTransactionTypeLabel("pocket_money")).toBe("Pocket Money");
    expect(getTransactionTypeLabel("savings_deposit")).toBe("Savings Deposit");
    expect(getTransactionTypeLabel("birthday_gift")).toBe("Birthday Gift");
    expect(getTransactionTypeLabel("clothing_allowance")).toBe("Clothing Allowance");
    expect(getTransactionTypeLabel("activity_allowance")).toBe("Activity Allowance");
    expect(getTransactionTypeLabel("personal_purchase")).toBe("Personal Purchase");
    expect(getTransactionTypeLabel("other")).toBe("Other");
  });

  it("getAccountStatusLabel returns readable labels", () => {
    expect(getAccountStatusLabel("active")).toBe("Active");
    expect(getAccountStatusLabel("overdue_reconciliation")).toBe("Overdue Reconciliation");
    expect(getAccountStatusLabel("dormant")).toBe("Dormant");
    expect(getAccountStatusLabel("closed")).toBe("Closed");
  });

  it("getReconciliationFrequencyLabel returns readable labels", () => {
    expect(getReconciliationFrequencyLabel("weekly")).toBe("Weekly");
    expect(getReconciliationFrequencyLabel("fortnightly")).toBe("Fortnightly");
    expect(getReconciliationFrequencyLabel("monthly")).toBe("Monthly");
    expect(getReconciliationFrequencyLabel("quarterly")).toBe("Quarterly");
    expect(getReconciliationFrequencyLabel("overdue")).toBe("Overdue");
  });

  it("getFinancialLiteracyTopicLabel returns readable labels", () => {
    expect(getFinancialLiteracyTopicLabel("budgeting")).toBe("Budgeting");
    expect(getFinancialLiteracyTopicLabel("saving")).toBe("Saving");
    expect(getFinancialLiteracyTopicLabel("online_safety_financial")).toBe("Online Financial Safety");
    expect(getFinancialLiteracyTopicLabel("benefits_entitlements")).toBe("Benefits & Entitlements");
    expect(getFinancialLiteracyTopicLabel("debt_awareness")).toBe("Debt Awareness");
  });

  it("getChildConsentLabel returns readable labels", () => {
    expect(getChildConsentLabel("informed_consent")).toBe("Informed Consent");
    expect(getChildConsentLabel("no_consent_sought")).toBe("No Consent Sought");
    expect(getChildConsentLabel("declined")).toBe("Declined");
    expect(getChildConsentLabel("not_applicable")).toBe("Not Applicable");
  });

  it("getRatingLabel returns readable labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});
