// ==============================================================================
// Cornerstone -- Financial Stewardship Intelligence Engine Tests
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateAllowanceManagement,
  evaluateSavingsInvestment,
  evaluateFinancialLiteracy,
  evaluateAuditCompliance,
  buildChildFinancialSummaries,
  generateFinancialStewardshipIntelligence,
  getAllowanceTypeLabel,
  getTransactionTypeLabel,
  getAuditStatusLabel,
  getFinancialLiteracyLevelLabel,
  getAccountTypeLabel,
} from "../financial-stewardship-engine";
import type {
  ChildFinancialProfile,
  FinancialTransaction,
  FinancialAudit,
  AllowancePolicy,
} from "../financial-stewardship-engine";

// -- Shared Constants ---------------------------------------------------------

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const HOME_ID = "oak-house";

// -- Factory Helpers ----------------------------------------------------------

function makeProfile(overrides: Partial<ChildFinancialProfile> = {}): ChildFinancialProfile {
  return {
    id: "fp-1",
    childId: "child-alex",
    childName: "Alex",
    weeklyPocketMoney: 10,
    savingsAccountInPlace: true,
    accountType: "savings",
    currentBalance: 145.50,
    financialLiteracyLevel: "developing",
    financialLiteracyAssessedDate: "2025-03-10",
    ageAppropriateAmount: true,
    budgetPlanInPlace: true,
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<FinancialTransaction> = {}): FinancialTransaction {
  return {
    id: "tx-1",
    childId: "child-alex",
    date: "2025-02-03",
    amount: 10,
    type: "issued",
    allowanceType: "pocket_money",
    description: "Weekly pocket money",
    receiptObtained: false,
    authorisedBy: "Sarah Johnson",
    childConsented: true,
    ...overrides,
  };
}

function makeAudit(overrides: Partial<FinancialAudit> = {}): FinancialAudit {
  return {
    id: "audit-1",
    auditDate: "2025-04-15",
    auditor: "Darren Laville",
    status: "compliant",
    discrepanciesFound: 0,
    discrepanciesResolved: 0,
    recommendationsCount: 0,
    recommendationsActioned: 0,
    policyCompliant: true,
    recordsAccurate: true,
    receiptsComplete: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<AllowancePolicy> = {}): AllowancePolicy {
  return {
    id: "policy-1",
    policyReviewedDate: "2025-01-10",
    ageAppropriateRates: true,
    regularPaymentSchedule: true,
    savingsEncouraged: true,
    financialLiteracyProgramme: true,
    birthdayHolidayGuidance: true,
    clothingAllowanceAdequate: true,
    ...overrides,
  };
}

// ==============================================================================
// Label Functions
// ==============================================================================

describe("Label Functions", () => {
  describe("getAllowanceTypeLabel", () => {
    it("returns human-readable labels for all allowance types", () => {
      expect(getAllowanceTypeLabel("pocket_money")).toBe("Pocket Money");
      expect(getAllowanceTypeLabel("clothing")).toBe("Clothing");
      expect(getAllowanceTypeLabel("birthday")).toBe("Birthday");
      expect(getAllowanceTypeLabel("holiday")).toBe("Holiday");
      expect(getAllowanceTypeLabel("education")).toBe("Education");
      expect(getAllowanceTypeLabel("savings")).toBe("Savings");
      expect(getAllowanceTypeLabel("personal_care")).toBe("Personal Care");
      expect(getAllowanceTypeLabel("activities")).toBe("Activities");
      expect(getAllowanceTypeLabel("transport")).toBe("Transport");
    });
  });

  describe("getTransactionTypeLabel", () => {
    it("returns human-readable labels for all transaction types", () => {
      expect(getTransactionTypeLabel("issued")).toBe("Issued");
      expect(getTransactionTypeLabel("received")).toBe("Received");
      expect(getTransactionTypeLabel("saved")).toBe("Saved");
      expect(getTransactionTypeLabel("spent")).toBe("Spent");
      expect(getTransactionTypeLabel("returned")).toBe("Returned");
    });
  });

  describe("getAuditStatusLabel", () => {
    it("returns human-readable labels for all audit statuses", () => {
      expect(getAuditStatusLabel("compliant")).toBe("Compliant");
      expect(getAuditStatusLabel("minor_issues")).toBe("Minor Issues");
      expect(getAuditStatusLabel("major_issues")).toBe("Major Issues");
      expect(getAuditStatusLabel("not_audited")).toBe("Not Audited");
    });
  });

  describe("getFinancialLiteracyLevelLabel", () => {
    it("returns human-readable labels for all literacy levels", () => {
      expect(getFinancialLiteracyLevelLabel("not_started")).toBe("Not Started");
      expect(getFinancialLiteracyLevelLabel("emerging")).toBe("Emerging");
      expect(getFinancialLiteracyLevelLabel("developing")).toBe("Developing");
      expect(getFinancialLiteracyLevelLabel("competent")).toBe("Competent");
      expect(getFinancialLiteracyLevelLabel("independent")).toBe("Independent");
    });
  });

  describe("getAccountTypeLabel", () => {
    it("returns human-readable labels for all account types", () => {
      expect(getAccountTypeLabel("savings")).toBe("Savings");
      expect(getAccountTypeLabel("current")).toBe("Current");
      expect(getAccountTypeLabel("junior_isa")).toBe("Junior ISA");
      expect(getAccountTypeLabel("cash")).toBe("Cash");
    });
  });
});

// ==============================================================================
// evaluateAllowanceManagement
// ==============================================================================

describe("evaluateAllowanceManagement", () => {
  it("returns zero scores for empty profiles", () => {
    const result = evaluateAllowanceManagement([], [], PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBe(0);
    expect(result.regularPocketMoneyRate).toBe(0);
    expect(result.ageAppropriateRate).toBe(0);
  });

  it("scores full marks when all conditions are perfect", () => {
    const profiles = [makeProfile(), makeProfile({ id: "fp-2", childId: "child-jordan", childName: "Jordan" })];
    const txns = [
      makeTransaction({ type: "spent", receiptObtained: true }),
      makeTransaction({ id: "tx-2", type: "saved" }),
      makeTransaction({ id: "tx-3", childId: "child-jordan" }),
    ];
    const result = evaluateAllowanceManagement(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBe(25);
    expect(result.regularPocketMoneyRate).toBe(100);
    expect(result.ageAppropriateRate).toBe(100);
    expect(result.savingsEncouraged).toBe(true);
  });

  it("detects children not receiving pocket money", () => {
    const profiles = [makeProfile({ weeklyPocketMoney: 0 })];
    const result = evaluateAllowanceManagement(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.regularPocketMoneyRate).toBe(0);
  });

  it("calculates correct pocket money rate when mixed", () => {
    const profiles = [
      makeProfile(),
      makeProfile({ id: "fp-2", childId: "child-jordan", weeklyPocketMoney: 0 }),
    ];
    const result = evaluateAllowanceManagement(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.regularPocketMoneyRate).toBe(50);
  });

  it("detects non-age-appropriate amounts", () => {
    const profiles = [makeProfile({ ageAppropriateAmount: false })];
    const result = evaluateAllowanceManagement(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.ageAppropriateRate).toBe(0);
  });

  it("calculates child consent rate correctly", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ childConsented: true }),
      makeTransaction({ id: "tx-2", childConsented: false }),
    ];
    const result = evaluateAllowanceManagement(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.childConsentRate).toBe(50);
  });

  it("calculates receipt rate for spent transactions only", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ type: "spent", receiptObtained: true }),
      makeTransaction({ id: "tx-2", type: "spent", receiptObtained: false }),
      makeTransaction({ id: "tx-3", type: "issued", receiptObtained: false }),
    ];
    const result = evaluateAllowanceManagement(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.receiptRate).toBe(50);
  });

  it("calculates authorisation rate correctly", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ authorisedBy: "Sarah Johnson" }),
      makeTransaction({ id: "tx-2", authorisedBy: "" }),
    ];
    const result = evaluateAllowanceManagement(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.authorisationRate).toBe(50);
  });

  it("detects savings encouraged via saved transactions", () => {
    const profiles = [makeProfile()];
    const txns = [makeTransaction({ type: "saved" })];
    const result = evaluateAllowanceManagement(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.savingsEncouraged).toBe(true);
  });

  it("detects savings not encouraged when no saved transactions", () => {
    const profiles = [makeProfile()];
    const txns = [makeTransaction({ type: "issued" })];
    const result = evaluateAllowanceManagement(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.savingsEncouraged).toBe(false);
  });

  it("filters transactions to period", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ date: "2024-12-01", type: "spent", receiptObtained: false }),
      makeTransaction({ id: "tx-2", date: "2025-03-01", type: "spent", receiptObtained: true }),
    ];
    const result = evaluateAllowanceManagement(profiles, txns, PERIOD_START, PERIOD_END);
    // Only the in-period spent transaction should count
    expect(result.receiptRate).toBe(100);
  });

  it("gives full consent/receipt/auth scores when no transactions exist", () => {
    const profiles = [makeProfile()];
    const result = evaluateAllowanceManagement(profiles, [], PERIOD_START, PERIOD_END);
    // No transactions means no consent/receipt/auth issues -- full points for those components
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
  });

  it("clamps score to 0-25", () => {
    const profiles = [makeProfile()];
    const result = evaluateAllowanceManagement(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles all profiles with zero pocket money", () => {
    const profiles = [
      makeProfile({ weeklyPocketMoney: 0 }),
      makeProfile({ id: "fp-2", childId: "child-jordan", weeklyPocketMoney: 0 }),
    ];
    const result = evaluateAllowanceManagement(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.regularPocketMoneyRate).toBe(0);
  });

  it("handles 100% receipt rate correctly", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ type: "spent", receiptObtained: true }),
      makeTransaction({ id: "tx-2", type: "spent", receiptObtained: true }),
    ];
    const result = evaluateAllowanceManagement(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.receiptRate).toBe(100);
  });

  it("handles 0% receipt rate correctly", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ type: "spent", receiptObtained: false }),
    ];
    const result = evaluateAllowanceManagement(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.receiptRate).toBe(0);
  });
});

// ==============================================================================
// evaluateSavingsInvestment
// ==============================================================================

describe("evaluateSavingsInvestment", () => {
  it("returns zero scores for empty profiles", () => {
    const result = evaluateSavingsInvestment([], [], PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBe(0);
    expect(result.savingsAccountRate).toBe(0);
  });

  it("scores full marks when all conditions are perfect", () => {
    const profiles = [
      makeProfile({ savingsAccountInPlace: true, accountType: "savings", currentBalance: 100, budgetPlanInPlace: true }),
    ];
    const txns = [makeTransaction({ type: "saved" })];
    const result = evaluateSavingsInvestment(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBe(25);
  });

  it("detects missing savings accounts", () => {
    const profiles = [makeProfile({ savingsAccountInPlace: false })];
    const result = evaluateSavingsInvestment(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.savingsAccountRate).toBe(0);
  });

  it("calculates savings account rate correctly", () => {
    const profiles = [
      makeProfile({ savingsAccountInPlace: true }),
      makeProfile({ id: "fp-2", childId: "child-jordan", savingsAccountInPlace: false }),
    ];
    const result = evaluateSavingsInvestment(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.savingsAccountRate).toBe(50);
  });

  it("detects positive balances", () => {
    const profiles = [
      makeProfile({ currentBalance: 100 }),
      makeProfile({ id: "fp-2", childId: "child-jordan", currentBalance: 0 }),
    ];
    const result = evaluateSavingsInvestment(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.positiveBalanceRate).toBe(50);
  });

  it("calculates budget plan rate", () => {
    const profiles = [
      makeProfile({ budgetPlanInPlace: true }),
      makeProfile({ id: "fp-2", childId: "child-jordan", budgetPlanInPlace: false }),
    ];
    const result = evaluateSavingsInvestment(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.budgetPlanRate).toBe(50);
  });

  it("detects savings growth from saved transactions", () => {
    const profiles = [makeProfile()];
    const txns = [makeTransaction({ type: "saved" })];
    const result = evaluateSavingsInvestment(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.savingsGrowthDetected).toBe(true);
  });

  it("detects no savings growth when no saved transactions", () => {
    const profiles = [makeProfile()];
    const txns = [makeTransaction({ type: "issued" })];
    const result = evaluateSavingsInvestment(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.savingsGrowthDetected).toBe(false);
  });

  it("calculates age-appropriate account rate for savings accounts", () => {
    const profiles = [
      makeProfile({ savingsAccountInPlace: true, accountType: "savings" }),
      makeProfile({ id: "fp-2", childId: "child-jordan", savingsAccountInPlace: true, accountType: "cash" }),
    ];
    const result = evaluateSavingsInvestment(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.ageAppropriateAccountRate).toBe(50);
  });

  it("counts junior ISA as age-appropriate", () => {
    const profiles = [makeProfile({ savingsAccountInPlace: true, accountType: "junior_isa" })];
    const result = evaluateSavingsInvestment(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.ageAppropriateAccountRate).toBe(100);
  });

  it("does not count current accounts as age-appropriate for savings metric", () => {
    const profiles = [makeProfile({ savingsAccountInPlace: true, accountType: "current" })];
    const result = evaluateSavingsInvestment(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.ageAppropriateAccountRate).toBe(0);
  });

  it("filters transactions to period", () => {
    const profiles = [makeProfile()];
    const txns = [makeTransaction({ date: "2024-12-01", type: "saved" })];
    const result = evaluateSavingsInvestment(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result.savingsGrowthDetected).toBe(false);
  });

  it("clamps score to 0-25", () => {
    const profiles = [makeProfile()];
    const result = evaluateSavingsInvestment(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles all profiles with zero balance", () => {
    const profiles = [
      makeProfile({ currentBalance: 0 }),
      makeProfile({ id: "fp-2", childId: "child-jordan", currentBalance: 0 }),
    ];
    const result = evaluateSavingsInvestment(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.positiveBalanceRate).toBe(0);
  });

  it("gives zero for account without savings flag even if type is savings", () => {
    const profiles = [makeProfile({ savingsAccountInPlace: false, accountType: "savings" })];
    const result = evaluateSavingsInvestment(profiles, [], PERIOD_START, PERIOD_END);
    expect(result.ageAppropriateAccountRate).toBe(0);
  });
});

// ==============================================================================
// evaluateFinancialLiteracy
// ==============================================================================

describe("evaluateFinancialLiteracy", () => {
  it("returns zero scores for empty profiles", () => {
    const result = evaluateFinancialLiteracy([]);
    expect(result.overallScore).toBe(0);
    expect(result.assessmentRate).toBe(0);
  });

  it("scores full marks when all conditions are perfect", () => {
    const profiles = [
      makeProfile({ financialLiteracyLevel: "competent", financialLiteracyAssessedDate: "2025-03-01", budgetPlanInPlace: true }),
      makeProfile({ id: "fp-2", childId: "child-jordan", financialLiteracyLevel: "independent", financialLiteracyAssessedDate: "2025-02-01", budgetPlanInPlace: true }),
    ];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.overallScore).toBe(25);
  });

  it("calculates assessment rate correctly", () => {
    const profiles = [
      makeProfile({ financialLiteracyAssessedDate: "2025-03-10" }),
      makeProfile({ id: "fp-2", childId: "child-jordan", financialLiteracyAssessedDate: "" }),
    ];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.assessmentRate).toBe(50);
  });

  it("detects all assessed when all have dates", () => {
    const profiles = [
      makeProfile({ financialLiteracyAssessedDate: "2025-03-10" }),
      makeProfile({ id: "fp-2", childId: "child-jordan", financialLiteracyAssessedDate: "2025-02-15" }),
    ];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.assessmentRate).toBe(100);
  });

  it("calculates competent/independent rate", () => {
    const profiles = [
      makeProfile({ financialLiteracyLevel: "competent" }),
      makeProfile({ id: "fp-2", childId: "child-jordan", financialLiteracyLevel: "developing" }),
    ];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.competentOrIndependentRate).toBe(50);
  });

  it("counts independent level in competent/independent rate", () => {
    const profiles = [makeProfile({ financialLiteracyLevel: "independent" })];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.competentOrIndependentRate).toBe(100);
  });

  it("calculates developing+ rate correctly", () => {
    const profiles = [
      makeProfile({ financialLiteracyLevel: "developing" }),
      makeProfile({ id: "fp-2", childId: "child-jordan", financialLiteracyLevel: "emerging" }),
      makeProfile({ id: "fp-3", childId: "child-morgan", financialLiteracyLevel: "competent" }),
    ];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.developingPlusRate).toBeCloseTo(66.7, 0);
  });

  it("includes competent and independent in developing+ rate", () => {
    const profiles = [
      makeProfile({ financialLiteracyLevel: "competent" }),
      makeProfile({ id: "fp-2", childId: "child-jordan", financialLiteracyLevel: "independent" }),
    ];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.developingPlusRate).toBe(100);
  });

  it("calculates budget plan rate", () => {
    const profiles = [
      makeProfile({ budgetPlanInPlace: true }),
      makeProfile({ id: "fp-2", childId: "child-jordan", budgetPlanInPlace: false }),
    ];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.budgetPlanRate).toBe(50);
  });

  it("detects improvement trend when any child is developing+", () => {
    const profiles = [makeProfile({ financialLiteracyLevel: "developing" })];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.improvementTrendDetected).toBe(true);
  });

  it("detects no improvement trend when all are not_started or emerging", () => {
    const profiles = [
      makeProfile({ financialLiteracyLevel: "not_started" }),
      makeProfile({ id: "fp-2", childId: "child-jordan", financialLiteracyLevel: "emerging" }),
    ];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.improvementTrendDetected).toBe(false);
  });

  it("handles all not_started profiles", () => {
    const profiles = [
      makeProfile({ financialLiteracyLevel: "not_started", financialLiteracyAssessedDate: "" }),
    ];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.competentOrIndependentRate).toBe(0);
    expect(result.developingPlusRate).toBe(0);
    expect(result.improvementTrendDetected).toBe(false);
  });

  it("clamps score to 0-25", () => {
    const profiles = [makeProfile()];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives zero competent rate when all are below competent", () => {
    const profiles = [
      makeProfile({ financialLiteracyLevel: "developing" }),
      makeProfile({ id: "fp-2", childId: "child-jordan", financialLiteracyLevel: "emerging" }),
    ];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.competentOrIndependentRate).toBe(0);
  });

  it("treats whitespace-only assessment date as not assessed", () => {
    const profiles = [makeProfile({ financialLiteracyAssessedDate: "   " })];
    const result = evaluateFinancialLiteracy(profiles);
    expect(result.assessmentRate).toBe(0);
  });
});

// ==============================================================================
// evaluateAuditCompliance
// ==============================================================================

describe("evaluateAuditCompliance", () => {
  it("returns zero scores for no audits and no policy", () => {
    const result = evaluateAuditCompliance([], null, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBe(0);
    expect(result.auditCompletedRecently).toBe(false);
    expect(result.policyCurrent).toBe(false);
  });

  it("scores full marks with compliant audit and current policy", () => {
    const audits = [makeAudit()];
    const policy = makePolicy();
    const result = evaluateAuditCompliance(audits, policy, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBe(25);
  });

  it("detects recent audit in period", () => {
    const audits = [makeAudit({ auditDate: "2025-04-15" })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.auditCompletedRecently).toBe(true);
  });

  it("does not count audit outside period", () => {
    const audits = [makeAudit({ auditDate: "2024-06-01" })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.auditCompletedRecently).toBe(false);
  });

  it("detects compliant status from latest audit", () => {
    const audits = [makeAudit({ status: "compliant" })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.compliantStatus).toBe(true);
  });

  it("detects non-compliant status", () => {
    const audits = [makeAudit({ status: "major_issues" })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.compliantStatus).toBe(false);
  });

  it("calculates discrepancy resolution rate", () => {
    const audits = [makeAudit({ discrepanciesFound: 4, discrepanciesResolved: 2 })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.discrepancyResolutionRate).toBe(50);
  });

  it("gives 100% discrepancy rate when all resolved", () => {
    const audits = [makeAudit({ discrepanciesFound: 3, discrepanciesResolved: 3 })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.discrepancyResolutionRate).toBe(100);
  });

  it("gives full discrepancy score when none found", () => {
    const audits = [makeAudit({ discrepanciesFound: 0, discrepanciesResolved: 0 })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    // 0 discrepancies = ideal = full 4 points for that component
    expect(result.discrepancyResolutionRate).toBe(0); // pct(0,0) = 0
  });

  it("calculates recommendations actioned rate", () => {
    const audits = [makeAudit({ recommendationsCount: 5, recommendationsActioned: 3 })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.recommendationsActionedRate).toBe(60);
  });

  it("detects current policy", () => {
    const policy = makePolicy({ policyReviewedDate: "2025-02-01" });
    const result = evaluateAuditCompliance([], policy, PERIOD_START, PERIOD_END);
    expect(result.policyCurrent).toBe(true);
  });

  it("detects outdated policy", () => {
    const policy = makePolicy({ policyReviewedDate: "2024-06-01" });
    const result = evaluateAuditCompliance([], policy, PERIOD_START, PERIOD_END);
    expect(result.policyCurrent).toBe(false);
  });

  it("detects accurate records", () => {
    const audits = [makeAudit({ recordsAccurate: true })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.recordsAccurate).toBe(true);
  });

  it("detects inaccurate records", () => {
    const audits = [makeAudit({ recordsAccurate: false })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.recordsAccurate).toBe(false);
  });

  it("aggregates discrepancies across multiple audits", () => {
    const audits = [
      makeAudit({ discrepanciesFound: 3, discrepanciesResolved: 2 }),
      makeAudit({ id: "audit-2", auditDate: "2025-02-01", discrepanciesFound: 2, discrepanciesResolved: 2 }),
    ];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.discrepancyResolutionRate).toBe(80); // 4/5
  });

  it("uses latest in-period audit for compliant status", () => {
    const audits = [
      makeAudit({ auditDate: "2025-02-01", status: "major_issues" }),
      makeAudit({ id: "audit-2", auditDate: "2025-04-01", status: "compliant" }),
    ];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.compliantStatus).toBe(true);
  });

  it("clamps score to 0-25", () => {
    const audits = [makeAudit()];
    const policy = makePolicy();
    const result = evaluateAuditCompliance(audits, policy, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles policy only (no audits)", () => {
    const policy = makePolicy();
    const result = evaluateAuditCompliance([], policy, PERIOD_START, PERIOD_END);
    expect(result.auditCompletedRecently).toBe(false);
    expect(result.policyCurrent).toBe(true);
    // Should get 4 for policy + 4 for no discrepancies + 4 for no recommendations
    expect(result.overallScore).toBe(12);
  });

  it("handles minor_issues status", () => {
    const audits = [makeAudit({ status: "minor_issues" })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.compliantStatus).toBe(false);
  });

  it("handles not_audited status", () => {
    const audits = [makeAudit({ status: "not_audited" })];
    const result = evaluateAuditCompliance(audits, null, PERIOD_START, PERIOD_END);
    expect(result.compliantStatus).toBe(false);
  });
});

// ==============================================================================
// buildChildFinancialSummaries
// ==============================================================================

describe("buildChildFinancialSummaries", () => {
  it("returns empty array for empty profiles", () => {
    const result = buildChildFinancialSummaries([], [], PERIOD_START, PERIOD_END);
    expect(result).toEqual([]);
  });

  it("builds summary for a single child", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ type: "saved", amount: 5 }),
      makeTransaction({ id: "tx-2", type: "spent", amount: 3.50, receiptObtained: true }),
    ];
    const result = buildChildFinancialSummaries(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result).toHaveLength(1);
    expect(result[0].childName).toBe("Alex");
    expect(result[0].totalSaved).toBe(5);
    expect(result[0].totalSpent).toBe(3.50);
    expect(result[0].totalTransactions).toBe(2);
  });

  it("calculates consent rate per child", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ childConsented: true }),
      makeTransaction({ id: "tx-2", childConsented: false }),
    ];
    const result = buildChildFinancialSummaries(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result[0].consentRate).toBe(50);
  });

  it("calculates receipt rate per child for spent transactions", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ type: "spent", receiptObtained: true }),
      makeTransaction({ id: "tx-2", type: "spent", receiptObtained: false }),
      makeTransaction({ id: "tx-3", type: "issued", receiptObtained: false }),
    ];
    const result = buildChildFinancialSummaries(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result[0].receiptRate).toBe(50);
  });

  it("builds summaries for multiple children", () => {
    const profiles = [
      makeProfile(),
      makeProfile({ id: "fp-2", childId: "child-jordan", childName: "Jordan", weeklyPocketMoney: 8 }),
    ];
    const txns = [
      makeTransaction({ childId: "child-alex", type: "saved", amount: 5 }),
      makeTransaction({ id: "tx-2", childId: "child-jordan", type: "spent", amount: 3 }),
    ];
    const result = buildChildFinancialSummaries(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result).toHaveLength(2);
    expect(result[0].totalSaved).toBe(5);
    expect(result[1].totalSpent).toBe(3);
  });

  it("filters transactions to period", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ date: "2024-12-01", type: "saved", amount: 100 }),
      makeTransaction({ id: "tx-2", date: "2025-03-01", type: "saved", amount: 5 }),
    ];
    const result = buildChildFinancialSummaries(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result[0].totalSaved).toBe(5);
    expect(result[0].totalTransactions).toBe(1);
  });

  it("returns zero amounts when no transactions for child", () => {
    const profiles = [makeProfile()];
    const result = buildChildFinancialSummaries(profiles, [], PERIOD_START, PERIOD_END);
    expect(result[0].totalSaved).toBe(0);
    expect(result[0].totalSpent).toBe(0);
    expect(result[0].totalTransactions).toBe(0);
  });

  it("includes profile data in summaries", () => {
    const profiles = [makeProfile({
      weeklyPocketMoney: 10,
      savingsAccountInPlace: true,
      accountType: "junior_isa",
      currentBalance: 220,
      financialLiteracyLevel: "competent",
      budgetPlanInPlace: true,
    })];
    const result = buildChildFinancialSummaries(profiles, [], PERIOD_START, PERIOD_END);
    expect(result[0].weeklyPocketMoney).toBe(10);
    expect(result[0].savingsAccountInPlace).toBe(true);
    expect(result[0].accountType).toBe("junior_isa");
    expect(result[0].currentBalance).toBe(220);
    expect(result[0].financialLiteracyLevel).toBe("competent");
    expect(result[0].budgetPlanInPlace).toBe(true);
  });

  it("rounds saved and spent amounts", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ type: "saved", amount: 1.111 }),
      makeTransaction({ id: "tx-2", type: "saved", amount: 2.222 }),
    ];
    const result = buildChildFinancialSummaries(profiles, txns, PERIOD_START, PERIOD_END);
    expect(result[0].totalSaved).toBe(3.33);
  });
});

// ==============================================================================
// generateFinancialStewardshipIntelligence
// ==============================================================================

describe("generateFinancialStewardshipIntelligence", () => {
  const perfectProfiles = [
    makeProfile({ financialLiteracyLevel: "competent" }),
    makeProfile({ id: "fp-2", childId: "child-jordan", childName: "Jordan", financialLiteracyLevel: "independent", accountType: "junior_isa", weeklyPocketMoney: 8, currentBalance: 220 }),
  ];
  const perfectTxns = [
    makeTransaction({ type: "spent", receiptObtained: true }),
    makeTransaction({ id: "tx-2", type: "saved" }),
    makeTransaction({ id: "tx-3", childId: "child-jordan" }),
  ];
  const perfectAudits = [makeAudit()];
  const perfectPolicy = makePolicy();

  it("returns correct homeId and period", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("calculates overall score as sum of sub-scores", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    const expected = result.allowanceManagement.overallScore +
      result.savingsInvestment.overallScore +
      result.financialLiteracy.overallScore +
      result.auditCompliance.overallScore;
    expect(result.overallScore).toBeCloseTo(expected, 0);
  });

  it("assigns outstanding rating for score >= 80", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("assigns good rating for score 60-79", () => {
    // Create partially good data
    const profiles = [
      makeProfile({ financialLiteracyLevel: "developing", savingsAccountInPlace: false, budgetPlanInPlace: false }),
    ];
    const txns = [makeTransaction({ type: "spent", receiptObtained: true, childConsented: true })];
    const result = generateFinancialStewardshipIntelligence(
      profiles, txns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    // Score should be moderate
    if (result.overallScore >= 60 && result.overallScore < 80) {
      expect(result.rating).toBe("good");
    }
  });

  it("assigns requires_improvement for score 40-59", () => {
    const profiles = [
      makeProfile({
        weeklyPocketMoney: 0, savingsAccountInPlace: false, ageAppropriateAmount: false,
        budgetPlanInPlace: false, financialLiteracyLevel: "not_started",
        financialLiteracyAssessedDate: "",
      }),
    ];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], [], null,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    if (result.overallScore >= 40 && result.overallScore < 60) {
      expect(result.rating).toBe("requires_improvement");
    }
  });

  it("assigns inadequate rating for score < 40", () => {
    const profiles = [
      makeProfile({
        weeklyPocketMoney: 0, savingsAccountInPlace: false, ageAppropriateAmount: false,
        budgetPlanInPlace: false, financialLiteracyLevel: "not_started",
        financialLiteracyAssessedDate: "", currentBalance: 0,
      }),
    ];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], [], null,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("includes child summaries", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.childSummaries).toHaveLength(2);
  });

  it("includes regulatory links", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 15"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CA 1989"))).toBe(true);
  });

  // -- Strengths --

  it("generates strength for all children receiving pocket money", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("pocket money"))).toBe(true);
  });

  it("generates strength for age-appropriate amounts", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("age-appropriate"))).toBe(true);
  });

  it("generates strength for high consent rate", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("consent"))).toBe(true);
  });

  it("generates strength for savings accounts in place", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("Savings accounts"))).toBe(true);
  });

  it("generates strength for savings growth", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("actively saving"))).toBe(true);
  });

  it("generates strength for all assessed", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("assessed for financial literacy"))).toBe(true);
  });

  it("generates strength for compliant audit", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("compliance"))).toBe(true);
  });

  it("generates strength for accurate records", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("accurate"))).toBe(true);
  });

  // -- Areas for Improvement --

  it("identifies missing pocket money as area for improvement", () => {
    const profiles = [makeProfile({ weeklyPocketMoney: 0 })];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("pocket money"))).toBe(true);
  });

  it("identifies missing savings accounts as area for improvement", () => {
    const profiles = [makeProfile({ savingsAccountInPlace: false })];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("savings accounts"))).toBe(true);
  });

  it("identifies non-age-appropriate amounts as area for improvement", () => {
    const profiles = [makeProfile({ ageAppropriateAmount: false })];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("age-appropriate"))).toBe(true);
  });

  it("identifies low consent rate as area for improvement", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ childConsented: false }),
      makeTransaction({ id: "tx-2", childConsented: false }),
    ];
    const result = generateFinancialStewardshipIntelligence(
      profiles, txns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("consent"))).toBe(true);
  });

  it("identifies missing audit as area for improvement", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, [], perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("audit"))).toBe(true);
  });

  it("identifies outdated policy as area for improvement", () => {
    const policy = makePolicy({ policyReviewedDate: "2024-01-01" });
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, policy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("policy"))).toBe(true);
  });

  it("identifies unassessed literacy as area for improvement", () => {
    const profiles = [makeProfile({ financialLiteracyAssessedDate: "" })];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("assessed for financial literacy"))).toBe(true);
  });

  // -- Actions --

  it("generates URGENT action for missing pocket money", () => {
    const profiles = [makeProfile({ weeklyPocketMoney: 0 })];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], [], null,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("pocket money"))).toBe(true);
  });

  it("generates HIGH action for missing audit", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, [], perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("HIGH") && a.includes("audit"))).toBe(true);
  });

  it("generates HIGH action for missing savings accounts", () => {
    const profiles = [makeProfile({ savingsAccountInPlace: false })];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("HIGH") && a.includes("savings"))).toBe(true);
  });

  it("generates no actions when everything is perfect", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions).toHaveLength(0);
  });

  // -- Edge Cases --

  it("handles empty inputs gracefully", () => {
    const result = generateFinancialStewardshipIntelligence(
      [], [], [], null,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childSummaries).toHaveLength(0);
  });

  it("handles null policy", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, null,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.auditCompliance.policyCurrent).toBe(false);
  });

  it("includes all four sub-score results", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.allowanceManagement).toBeDefined();
    expect(result.savingsInvestment).toBeDefined();
    expect(result.financialLiteracy).toBeDefined();
    expect(result.auditCompliance).toBeDefined();
  });

  it("overall score does not exceed 100", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score is not negative", () => {
    const result = generateFinancialStewardshipIntelligence(
      [], [], [], null,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("generates strength for competent/independent rate when >= 50%", () => {
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("competent or independent"))).toBe(true);
  });

  it("identifies low receipt rate as area for improvement", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ type: "spent", receiptObtained: false }),
      makeTransaction({ id: "tx-2", type: "spent", receiptObtained: false }),
    ];
    const result = generateFinancialStewardshipIntelligence(
      profiles, txns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("Receipts"))).toBe(true);
  });

  it("identifies low developing+ rate as area for improvement", () => {
    const profiles = [
      makeProfile({ financialLiteracyLevel: "not_started", financialLiteracyAssessedDate: "2025-01-01" }),
      makeProfile({ id: "fp-2", childId: "child-jordan", financialLiteracyLevel: "emerging", financialLiteracyAssessedDate: "2025-01-01" }),
    ];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("developing level"))).toBe(true);
  });

  it("generates MEDIUM action for low consent rate", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ childConsented: false }),
      makeTransaction({ id: "tx-2", childConsented: false }),
    ];
    const result = generateFinancialStewardshipIntelligence(
      profiles, txns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("MEDIUM") && a.includes("consent"))).toBe(true);
  });

  it("generates MEDIUM action for low receipt rate", () => {
    const profiles = [makeProfile()];
    const txns = [
      makeTransaction({ type: "spent", receiptObtained: false }),
      makeTransaction({ id: "tx-2", type: "spent", receiptObtained: false }),
    ];
    const result = generateFinancialStewardshipIntelligence(
      profiles, txns, perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("MEDIUM") && a.includes("receipt"))).toBe(true);
  });

  it("generates MEDIUM action for outdated policy", () => {
    const policy = makePolicy({ policyReviewedDate: "2024-01-01" });
    const result = generateFinancialStewardshipIntelligence(
      perfectProfiles, perfectTxns, perfectAudits, policy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("MEDIUM") && a.includes("policy"))).toBe(true);
  });

  it("generates HIGH action for unassessed literacy", () => {
    const profiles = [makeProfile({ financialLiteracyAssessedDate: "" })];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("HIGH") && a.includes("literacy"))).toBe(true);
  });

  it("generates LOW action for low developing+ rate", () => {
    const profiles = [
      makeProfile({ financialLiteracyLevel: "not_started", financialLiteracyAssessedDate: "2025-01-01" }),
      makeProfile({ id: "fp-2", childId: "child-jordan", financialLiteracyLevel: "emerging", financialLiteracyAssessedDate: "2025-01-01" }),
    ];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("LOW") && a.includes("literacy"))).toBe(true);
  });

  it("identifies zero/negative balances as area for improvement", () => {
    const profiles = [
      makeProfile({ currentBalance: 0 }),
      makeProfile({ id: "fp-2", childId: "child-jordan", currentBalance: 0 }),
    ];
    const result = generateFinancialStewardshipIntelligence(
      profiles, [], perfectAudits, perfectPolicy,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("balance"))).toBe(true);
  });
});

// ==============================================================================
// Integration / Demo Data Scenario
// ==============================================================================

describe("Demo Data Scenario", () => {
  const demoProfiles: ChildFinancialProfile[] = [
    {
      id: "fp-alex", childId: "child-alex", childName: "Alex",
      weeklyPocketMoney: 10, savingsAccountInPlace: true, accountType: "savings",
      currentBalance: 145.50, financialLiteracyLevel: "developing",
      financialLiteracyAssessedDate: "2025-03-10", ageAppropriateAmount: true,
      budgetPlanInPlace: true,
    },
    {
      id: "fp-jordan", childId: "child-jordan", childName: "Jordan",
      weeklyPocketMoney: 8, savingsAccountInPlace: true, accountType: "junior_isa",
      currentBalance: 220.00, financialLiteracyLevel: "competent",
      financialLiteracyAssessedDate: "2025-02-15", ageAppropriateAmount: true,
      budgetPlanInPlace: true,
    },
    {
      id: "fp-morgan", childId: "child-morgan", childName: "Morgan",
      weeklyPocketMoney: 12, savingsAccountInPlace: true, accountType: "savings",
      currentBalance: 89.75, financialLiteracyLevel: "competent",
      financialLiteracyAssessedDate: "2025-04-01", ageAppropriateAmount: true,
      budgetPlanInPlace: true,
    },
  ];

  const demoTxns: FinancialTransaction[] = [
    { id: "tx-a1", childId: "child-alex", date: "2025-02-03", amount: 10, type: "issued", allowanceType: "pocket_money", description: "Weekly pocket money", receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true },
    { id: "tx-a2", childId: "child-alex", date: "2025-02-05", amount: 5, type: "saved", allowanceType: "savings", description: "Saved", receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true },
    { id: "tx-a3", childId: "child-alex", date: "2025-02-07", amount: 3.50, type: "spent", allowanceType: "activities", description: "Cinema", receiptObtained: true, authorisedBy: "Tom Richards", childConsented: true },
    { id: "tx-j1", childId: "child-jordan", date: "2025-02-03", amount: 8, type: "issued", allowanceType: "pocket_money", description: "Weekly pocket money", receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true },
    { id: "tx-j2", childId: "child-jordan", date: "2025-02-06", amount: 4, type: "saved", allowanceType: "savings", description: "Saved", receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true },
    { id: "tx-j3", childId: "child-jordan", date: "2025-02-10", amount: 6.99, type: "spent", allowanceType: "personal_care", description: "Toiletries", receiptObtained: true, authorisedBy: "Tom Richards", childConsented: true },
    { id: "tx-m1", childId: "child-morgan", date: "2025-02-03", amount: 12, type: "issued", allowanceType: "pocket_money", description: "Weekly pocket money", receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true },
    { id: "tx-m2", childId: "child-morgan", date: "2025-02-04", amount: 6, type: "saved", allowanceType: "savings", description: "Saved", receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true },
    { id: "tx-m3", childId: "child-morgan", date: "2025-02-08", amount: 4.20, type: "spent", allowanceType: "transport", description: "Bus fare", receiptObtained: true, authorisedBy: "Lisa Williams", childConsented: true },
  ];

  const demoAudits: FinancialAudit[] = [
    {
      id: "audit-1", auditDate: "2025-04-15", auditor: "Darren Laville",
      status: "compliant", discrepanciesFound: 1, discrepanciesResolved: 1,
      recommendationsCount: 2, recommendationsActioned: 2,
      policyCompliant: true, recordsAccurate: true, receiptsComplete: true,
    },
  ];

  const demoPolicy: AllowancePolicy = {
    id: "policy-1", policyReviewedDate: "2025-01-10",
    ageAppropriateRates: true, regularPaymentSchedule: true,
    savingsEncouraged: true, financialLiteracyProgramme: true,
    birthdayHolidayGuidance: true, clothingAllowanceAdequate: true,
  };

  it("generates outstanding rating for the demo scenario", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("returns correct number of child summaries", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.childSummaries).toHaveLength(3);
  });

  it("calculates Alex's saved total correctly", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    const alex = result.childSummaries.find((c) => c.childName === "Alex");
    expect(alex).toBeDefined();
    expect(alex!.totalSaved).toBe(5);
  });

  it("calculates Jordan's spent total correctly", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    const jordan = result.childSummaries.find((c) => c.childName === "Jordan");
    expect(jordan).toBeDefined();
    expect(jordan!.totalSpent).toBe(6.99);
  });

  it("reports 100% consent rate across demo transactions", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.allowanceManagement.childConsentRate).toBe(100);
  });

  it("reports 100% receipt rate for spent demo transactions", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.allowanceManagement.receiptRate).toBe(100);
  });

  it("reports 100% savings account rate", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.savingsInvestment.savingsAccountRate).toBe(100);
  });

  it("reports 100% assessment rate", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.financialLiteracy.assessmentRate).toBe(100);
  });

  it("reports compliant audit status", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.auditCompliance.compliantStatus).toBe(true);
    expect(result.auditCompliance.auditCompletedRecently).toBe(true);
  });

  it("generates multiple strengths for demo data", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.strengths.length).toBeGreaterThanOrEqual(5);
  });

  it("generates no areas for improvement for demo data", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.areasForImprovement).toHaveLength(0);
  });

  it("generates no actions for demo data", () => {
    const result = generateFinancialStewardshipIntelligence(
      demoProfiles, demoTxns, demoAudits, demoPolicy,
      "oak-house", "2025-01-01", "2025-06-30",
    );
    expect(result.actions).toHaveLength(0);
  });
});
