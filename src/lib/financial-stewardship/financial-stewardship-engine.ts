// ==============================================================================
// Cornerstone -- Financial Stewardship Intelligence Engine
//
// Pure deterministic engine -- no AI, no external calls.
// Evaluates financial management for looked after children:
//   - Pocket money, allowances, and age-appropriate amounts
//   - Savings accounts, investment, and budget planning
//   - Financial literacy assessment and progression
//   - Audit compliance and record-keeping
//
// Regulatory framework:
//   CHR 2015 Reg 5/6 -- quality and purpose of care / children's views
//   NMS 15 -- money management for looked after children
//   UNCRC Article 27 -- adequate standard of living
//   CA 1989 s23 -- duty to maintain / financial support
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type AllowanceType =
  | "pocket_money"
  | "clothing"
  | "birthday"
  | "holiday"
  | "education"
  | "savings"
  | "personal_care"
  | "activities"
  | "transport";

export type TransactionType =
  | "issued"
  | "received"
  | "saved"
  | "spent"
  | "returned";

export type AuditStatus =
  | "compliant"
  | "minor_issues"
  | "major_issues"
  | "not_audited";

export type FinancialLiteracyLevel =
  | "not_started"
  | "emerging"
  | "developing"
  | "competent"
  | "independent";

export type AccountType =
  | "savings"
  | "current"
  | "junior_isa"
  | "cash";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Interfaces ---------------------------------------------------------------

export interface ChildFinancialProfile {
  id: string;
  childId: string;
  childName: string;
  weeklyPocketMoney: number;
  savingsAccountInPlace: boolean;
  accountType: AccountType;
  currentBalance: number;
  financialLiteracyLevel: FinancialLiteracyLevel;
  financialLiteracyAssessedDate: string;
  ageAppropriateAmount: boolean;
  budgetPlanInPlace: boolean;
}

export interface FinancialTransaction {
  id: string;
  childId: string;
  date: string;
  amount: number;
  type: TransactionType;
  allowanceType: AllowanceType;
  description: string;
  receiptObtained: boolean;
  authorisedBy: string;
  childConsented: boolean;
}

export interface FinancialAudit {
  id: string;
  auditDate: string;
  auditor: string;
  status: AuditStatus;
  discrepanciesFound: number;
  discrepanciesResolved: number;
  recommendationsCount: number;
  recommendationsActioned: number;
  policyCompliant: boolean;
  recordsAccurate: boolean;
  receiptsComplete: boolean;
}

export interface AllowancePolicy {
  id: string;
  policyReviewedDate: string;
  ageAppropriateRates: boolean;
  regularPaymentSchedule: boolean;
  savingsEncouraged: boolean;
  financialLiteracyProgramme: boolean;
  birthdayHolidayGuidance: boolean;
  clothingAllowanceAdequate: boolean;
}

// -- Result Types -------------------------------------------------------------

export interface AllowanceManagementResult {
  regularPocketMoneyRate: number;
  ageAppropriateRate: number;
  childConsentRate: number;
  receiptRate: number;
  authorisationRate: number;
  savingsEncouraged: boolean;
  overallScore: number; // 0-25
}

export interface SavingsInvestmentResult {
  savingsAccountRate: number;
  positiveBalanceRate: number;
  budgetPlanRate: number;
  savingsGrowthDetected: boolean;
  ageAppropriateAccountRate: number;
  overallScore: number; // 0-25
}

export interface FinancialLiteracyResult {
  assessmentRate: number;
  competentOrIndependentRate: number;
  developingPlusRate: number;
  budgetPlanRate: number;
  improvementTrendDetected: boolean;
  overallScore: number; // 0-25
}

export interface AuditComplianceResult {
  auditCompletedRecently: boolean;
  compliantStatus: boolean;
  discrepancyResolutionRate: number;
  recommendationsActionedRate: number;
  policyCurrent: boolean;
  recordsAccurate: boolean;
  overallScore: number; // 0-25
}

export interface ChildFinancialSummary {
  childId: string;
  childName: string;
  weeklyPocketMoney: number;
  savingsAccountInPlace: boolean;
  accountType: AccountType;
  currentBalance: number;
  financialLiteracyLevel: FinancialLiteracyLevel;
  budgetPlanInPlace: boolean;
  totalTransactions: number;
  totalSaved: number;
  totalSpent: number;
  consentRate: number;
  receiptRate: number;
}

export interface FinancialStewardshipIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  allowanceManagement: AllowanceManagementResult;
  savingsInvestment: SavingsInvestmentResult;
  financialLiteracy: FinancialLiteracyResult;
  auditCompliance: AuditComplianceResult;
  childSummaries: ChildFinancialSummary[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function ratingFromScore(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

function isInPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

// -- Label Functions ----------------------------------------------------------

export function getAllowanceTypeLabel(t: AllowanceType): string {
  const labels: Record<AllowanceType, string> = {
    pocket_money: "Pocket Money",
    clothing: "Clothing",
    birthday: "Birthday",
    holiday: "Holiday",
    education: "Education",
    savings: "Savings",
    personal_care: "Personal Care",
    activities: "Activities",
    transport: "Transport",
  };
  return labels[t] || t;
}

export function getTransactionTypeLabel(t: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    issued: "Issued",
    received: "Received",
    saved: "Saved",
    spent: "Spent",
    returned: "Returned",
  };
  return labels[t] || t;
}

export function getAuditStatusLabel(s: AuditStatus): string {
  const labels: Record<AuditStatus, string> = {
    compliant: "Compliant",
    minor_issues: "Minor Issues",
    major_issues: "Major Issues",
    not_audited: "Not Audited",
  };
  return labels[s] || s;
}

export function getFinancialLiteracyLevelLabel(l: FinancialLiteracyLevel): string {
  const labels: Record<FinancialLiteracyLevel, string> = {
    not_started: "Not Started",
    emerging: "Emerging",
    developing: "Developing",
    competent: "Competent",
    independent: "Independent",
  };
  return labels[l] || l;
}

export function getAccountTypeLabel(t: AccountType): string {
  const labels: Record<AccountType, string> = {
    savings: "Savings",
    current: "Current",
    junior_isa: "Junior ISA",
    cash: "Cash",
  };
  return labels[t] || t;
}

// -- Core Evaluation Functions ------------------------------------------------

/**
 * Evaluate allowance management -- are children receiving regular, age-appropriate
 * pocket money with proper consent, receipts, and authorisation?
 * Score: 0-25
 */
export function evaluateAllowanceManagement(
  profiles: ChildFinancialProfile[],
  transactions: FinancialTransaction[],
  periodStart: string,
  periodEnd: string,
): AllowanceManagementResult {
  if (profiles.length === 0) {
    return {
      regularPocketMoneyRate: 0,
      ageAppropriateRate: 0,
      childConsentRate: 0,
      receiptRate: 0,
      authorisationRate: 0,
      savingsEncouraged: false,
      overallScore: 0,
    };
  }

  const periodTxns = transactions.filter((t) => isInPeriod(t.date, periodStart, periodEnd));

  // Children receiving regular pocket money (weeklyPocketMoney > 0)
  const receivingPocketMoney = profiles.filter((p) => p.weeklyPocketMoney > 0).length;
  const regularPocketMoneyRate = pct(receivingPocketMoney, profiles.length);

  // Age-appropriate amounts
  const ageAppropriate = profiles.filter((p) => p.ageAppropriateAmount).length;
  const ageAppropriateRate = pct(ageAppropriate, profiles.length);

  // Child consent rate for transactions (>= 90% target)
  const consentedTxns = periodTxns.filter((t) => t.childConsented).length;
  const childConsentRate = pct(consentedTxns, periodTxns.length);

  // Receipt rate for spent transactions (>= 80% target)
  const spentTxns = periodTxns.filter((t) => t.type === "spent");
  const receiptsObtained = spentTxns.filter((t) => t.receiptObtained).length;
  const receiptRate = pct(receiptsObtained, spentTxns.length);

  // Authorisation rate
  const authorisedTxns = periodTxns.filter((t) => t.authorisedBy.trim().length > 0).length;
  const authorisationRate = pct(authorisedTxns, periodTxns.length);

  // Savings encouraged -- any saved transactions exist
  const hasSavedTxns = periodTxns.some((t) => t.type === "saved");
  const savingsEncouraged = hasSavedTxns;

  // Scoring -- 25 points max
  let score = 0;

  // +7 all children receive regular pocket money
  score += (regularPocketMoneyRate / 100) * 7;

  // +5 age-appropriate amounts
  score += (ageAppropriateRate / 100) * 5;

  // +4 child consent rate >= 90%
  if (periodTxns.length > 0) {
    score += (Math.min(childConsentRate, 100) / 100) * 4;
  } else {
    score += 4; // no transactions, no consent issues
  }

  // +4 receipt rate for spent >= 80%
  if (spentTxns.length > 0) {
    score += (Math.min(receiptRate, 100) / 100) * 4;
  } else {
    score += 4; // no spent transactions, no receipt issues
  }

  // +3 authorisation rate
  if (periodTxns.length > 0) {
    score += (Math.min(authorisationRate, 100) / 100) * 3;
  } else {
    score += 3;
  }

  // +2 savings encouraged
  if (savingsEncouraged) {
    score += 2;
  }

  return {
    regularPocketMoneyRate,
    ageAppropriateRate,
    childConsentRate,
    receiptRate,
    authorisationRate,
    savingsEncouraged,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate savings and investment -- do children have savings accounts,
 * positive balances, budget plans, and age-appropriate account types?
 * Score: 0-25
 */
export function evaluateSavingsInvestment(
  profiles: ChildFinancialProfile[],
  transactions: FinancialTransaction[],
  periodStart: string,
  periodEnd: string,
): SavingsInvestmentResult {
  if (profiles.length === 0) {
    return {
      savingsAccountRate: 0,
      positiveBalanceRate: 0,
      budgetPlanRate: 0,
      savingsGrowthDetected: false,
      ageAppropriateAccountRate: 0,
      overallScore: 0,
    };
  }

  const periodTxns = transactions.filter((t) => isInPeriod(t.date, periodStart, periodEnd));

  // Savings accounts in place (>= 90% target)
  const withSavings = profiles.filter((p) => p.savingsAccountInPlace).length;
  const savingsAccountRate = pct(withSavings, profiles.length);

  // Positive balance rate
  const positiveBalance = profiles.filter((p) => p.currentBalance > 0).length;
  const positiveBalanceRate = pct(positiveBalance, profiles.length);

  // Budget plan rate
  const withBudgetPlan = profiles.filter((p) => p.budgetPlanInPlace).length;
  const budgetPlanRate = pct(withBudgetPlan, profiles.length);

  // Savings growth -- any saved transactions in period
  const savingsGrowthDetected = periodTxns.some((t) => t.type === "saved");

  // Age-appropriate account types (savings, junior_isa are age-appropriate; cash alone is not ideal)
  const ageAppropriateAccounts = profiles.filter(
    (p) => p.savingsAccountInPlace && (p.accountType === "savings" || p.accountType === "junior_isa"),
  ).length;
  const ageAppropriateAccountRate = pct(ageAppropriateAccounts, profiles.length);

  // Scoring -- 25 points max
  let score = 0;

  // +8 savings accounts >= 90%
  score += (Math.min(savingsAccountRate, 100) / 100) * 8;

  // +5 positive balance rate
  score += (Math.min(positiveBalanceRate, 100) / 100) * 5;

  // +4 budget plan in place
  score += (Math.min(budgetPlanRate, 100) / 100) * 4;

  // +4 savings growth
  if (savingsGrowthDetected) {
    score += 4;
  }

  // +4 age-appropriate account types
  score += (Math.min(ageAppropriateAccountRate, 100) / 100) * 4;

  return {
    savingsAccountRate,
    positiveBalanceRate,
    budgetPlanRate,
    savingsGrowthDetected,
    ageAppropriateAccountRate,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate financial literacy -- have children been assessed, are they progressing
 * towards competence/independence, and do they have budget plans?
 * Score: 0-25
 */
export function evaluateFinancialLiteracy(
  profiles: ChildFinancialProfile[],
): FinancialLiteracyResult {
  if (profiles.length === 0) {
    return {
      assessmentRate: 0,
      competentOrIndependentRate: 0,
      developingPlusRate: 0,
      budgetPlanRate: 0,
      improvementTrendDetected: false,
      overallScore: 0,
    };
  }

  // Assessment rate -- all children assessed (have a non-empty assessed date)
  const assessed = profiles.filter(
    (p) => p.financialLiteracyAssessedDate.trim().length > 0,
  ).length;
  const assessmentRate = pct(assessed, profiles.length);

  // Competent/independent rate (>= 50% target)
  const competentOrIndependent = profiles.filter(
    (p) => p.financialLiteracyLevel === "competent" || p.financialLiteracyLevel === "independent",
  ).length;
  const competentOrIndependentRate = pct(competentOrIndependent, profiles.length);

  // Developing+ rate (>= 80% target)
  const developingPlus = profiles.filter(
    (p) =>
      p.financialLiteracyLevel === "developing" ||
      p.financialLiteracyLevel === "competent" ||
      p.financialLiteracyLevel === "independent",
  ).length;
  const developingPlusRate = pct(developingPlus, profiles.length);

  // Budget plans
  const withBudgetPlan = profiles.filter((p) => p.budgetPlanInPlace).length;
  const budgetPlanRate = pct(withBudgetPlan, profiles.length);

  // Improvement trend -- if any child is at developing or above, consider it a positive trend
  // (In a real system this would compare historical data; here we use a proxy)
  const improvementTrendDetected = developingPlus > 0;

  // Scoring -- 25 points max
  let score = 0;

  // +8 assessment rate (all assessed)
  score += (Math.min(assessmentRate, 100) / 100) * 8;

  // +6 competent/independent rate >= 50%
  score += (Math.min(competentOrIndependentRate, 100) / 100) * 6;

  // +4 developing+ rate >= 80%
  score += (Math.min(developingPlusRate, 100) / 100) * 4;

  // +4 budget plans
  score += (Math.min(budgetPlanRate, 100) / 100) * 4;

  // +3 improvement trend
  if (improvementTrendDetected) {
    score += 3;
  }

  return {
    assessmentRate,
    competentOrIndependentRate,
    developingPlusRate,
    budgetPlanRate,
    improvementTrendDetected,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate audit compliance -- has a recent audit been completed, are records
 * accurate, discrepancies resolved, and policy current?
 * Score: 0-25
 */
export function evaluateAuditCompliance(
  audits: FinancialAudit[],
  policy: AllowancePolicy | null,
  periodStart: string,
  periodEnd: string,
): AuditComplianceResult {
  if (audits.length === 0 && !policy) {
    return {
      auditCompletedRecently: false,
      compliantStatus: false,
      discrepancyResolutionRate: 0,
      recommendationsActionedRate: 0,
      policyCurrent: false,
      recordsAccurate: false,
      overallScore: 0,
    };
  }

  // Most recent audit in period
  const periodAudits = audits.filter((a) => isInPeriod(a.auditDate, periodStart, periodEnd));
  const latestAudit = periodAudits.length > 0
    ? periodAudits.sort((a, b) => b.auditDate.localeCompare(a.auditDate))[0]
    : null;

  const auditCompletedRecently = latestAudit !== null;
  const compliantStatus = latestAudit?.status === "compliant";
  const recordsAccurate = latestAudit?.recordsAccurate ?? false;

  // Discrepancy resolution
  const totalDiscrepancies = audits.reduce((s, a) => s + a.discrepanciesFound, 0);
  const totalResolved = audits.reduce((s, a) => s + a.discrepanciesResolved, 0);
  const discrepancyResolutionRate = pct(totalResolved, totalDiscrepancies);

  // Recommendations actioned
  const totalRecommendations = audits.reduce((s, a) => s + a.recommendationsCount, 0);
  const totalActioned = audits.reduce((s, a) => s + a.recommendationsActioned, 0);
  const recommendationsActionedRate = pct(totalActioned, totalRecommendations);

  // Policy current (reviewed within period or after period start)
  const policyCurrent = policy ? policy.policyReviewedDate >= periodStart : false;

  // Scoring -- 25 points max
  let score = 0;

  // +6 audit completed recently
  if (auditCompletedRecently) {
    score += 6;
  }

  // +4 compliant status
  if (compliantStatus) {
    score += 4;
  }

  // +4 discrepancies resolved
  if (totalDiscrepancies === 0) {
    score += 4; // no discrepancies is ideal
  } else {
    score += (Math.min(discrepancyResolutionRate, 100) / 100) * 4;
  }

  // +4 recommendations actioned
  if (totalRecommendations === 0) {
    score += 4; // no outstanding recommendations
  } else {
    score += (Math.min(recommendationsActionedRate, 100) / 100) * 4;
  }

  // +4 policy current
  if (policyCurrent) {
    score += 4;
  }

  // +3 records accurate
  if (recordsAccurate) {
    score += 3;
  }

  return {
    auditCompletedRecently,
    compliantStatus,
    discrepancyResolutionRate,
    recommendationsActionedRate,
    policyCurrent,
    recordsAccurate,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Build per-child financial summaries.
 */
export function buildChildFinancialSummaries(
  profiles: ChildFinancialProfile[],
  transactions: FinancialTransaction[],
  periodStart: string,
  periodEnd: string,
): ChildFinancialSummary[] {
  const periodTxns = transactions.filter((t) => isInPeriod(t.date, periodStart, periodEnd));

  return profiles.map((profile) => {
    const childTxns = periodTxns.filter((t) => t.childId === profile.childId);
    const totalSaved = childTxns
      .filter((t) => t.type === "saved")
      .reduce((s, t) => s + t.amount, 0);
    const totalSpent = childTxns
      .filter((t) => t.type === "spent")
      .reduce((s, t) => s + t.amount, 0);

    const consentedCount = childTxns.filter((t) => t.childConsented).length;
    const consentRate = pct(consentedCount, childTxns.length);

    const spentTxns = childTxns.filter((t) => t.type === "spent");
    const receiptsCount = spentTxns.filter((t) => t.receiptObtained).length;
    const receiptRate = pct(receiptsCount, spentTxns.length);

    return {
      childId: profile.childId,
      childName: profile.childName,
      weeklyPocketMoney: profile.weeklyPocketMoney,
      savingsAccountInPlace: profile.savingsAccountInPlace,
      accountType: profile.accountType,
      currentBalance: profile.currentBalance,
      financialLiteracyLevel: profile.financialLiteracyLevel,
      budgetPlanInPlace: profile.budgetPlanInPlace,
      totalTransactions: childTxns.length,
      totalSaved: Math.round(totalSaved * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
      consentRate,
      receiptRate,
    };
  });
}

// -- Main Intelligence Function -----------------------------------------------

export function generateFinancialStewardshipIntelligence(
  profiles: ChildFinancialProfile[],
  transactions: FinancialTransaction[],
  audits: FinancialAudit[],
  policy: AllowancePolicy | null,
  homeId: string,
  periodStart: string,
  periodEnd: string,
): FinancialStewardshipIntelligence {
  const allowanceManagement = evaluateAllowanceManagement(profiles, transactions, periodStart, periodEnd);
  const savingsInvestment = evaluateSavingsInvestment(profiles, transactions, periodStart, periodEnd);
  const financialLiteracy = evaluateFinancialLiteracy(profiles);
  const auditCompliance = evaluateAuditCompliance(audits, policy, periodStart, periodEnd);
  const childSummaries = buildChildFinancialSummaries(profiles, transactions, periodStart, periodEnd);

  const overallScore = Math.round(
    (allowanceManagement.overallScore +
      savingsInvestment.overallScore +
      financialLiteracy.overallScore +
      auditCompliance.overallScore) * 10,
  ) / 10;
  const rating = ratingFromScore(overallScore);

  // -- Strengths --
  const strengths: string[] = [];

  if (allowanceManagement.regularPocketMoneyRate >= 100) {
    strengths.push("All children receive regular pocket money, supporting their independence and financial skills");
  }
  if (allowanceManagement.ageAppropriateRate >= 100) {
    strengths.push("Pocket money amounts are age-appropriate for all children");
  }
  if (allowanceManagement.childConsentRate >= 90 && transactions.length > 0) {
    strengths.push("Children consistently consent to financial transactions, respecting their autonomy");
  }
  if (allowanceManagement.receiptRate >= 80) {
    strengths.push("Receipts are obtained for the majority of expenditure, supporting audit compliance");
  }
  if (savingsInvestment.savingsAccountRate >= 90) {
    strengths.push("Savings accounts are in place for almost all children, encouraging financial responsibility");
  }
  if (savingsInvestment.savingsGrowthDetected) {
    strengths.push("Children are actively saving, demonstrating growing financial capability");
  }
  if (financialLiteracy.assessmentRate >= 100) {
    strengths.push("All children have been assessed for financial literacy");
  }
  if (financialLiteracy.competentOrIndependentRate >= 50) {
    strengths.push("A good proportion of children demonstrate competent or independent financial skills");
  }
  if (auditCompliance.auditCompletedRecently && auditCompliance.compliantStatus) {
    strengths.push("Recent financial audit found full compliance with no issues");
  }
  if (auditCompliance.recordsAccurate) {
    strengths.push("Financial records are accurate and well-maintained");
  }

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];

  if (allowanceManagement.regularPocketMoneyRate < 100 && profiles.length > 0) {
    areasForImprovement.push("Not all children are receiving regular pocket money");
  }
  if (allowanceManagement.ageAppropriateRate < 100 && profiles.length > 0) {
    areasForImprovement.push("Some children's pocket money amounts are not age-appropriate");
  }
  if (allowanceManagement.childConsentRate < 90 && transactions.length > 0) {
    areasForImprovement.push("Child consent is not consistently obtained for financial transactions");
  }
  if (allowanceManagement.receiptRate < 80 && transactions.some((t) => t.type === "spent")) {
    areasForImprovement.push("Receipts are not consistently obtained for expenditure");
  }
  if (savingsInvestment.savingsAccountRate < 90 && profiles.length > 0) {
    areasForImprovement.push("Not all children have savings accounts in place");
  }
  if (savingsInvestment.positiveBalanceRate < 80 && profiles.length > 0) {
    areasForImprovement.push("Some children have zero or negative savings balances");
  }
  if (financialLiteracy.assessmentRate < 100 && profiles.length > 0) {
    areasForImprovement.push("Not all children have been assessed for financial literacy");
  }
  if (financialLiteracy.developingPlusRate < 80 && profiles.length > 0) {
    areasForImprovement.push("Too few children are reaching at least developing level in financial literacy");
  }
  if (!auditCompliance.auditCompletedRecently) {
    areasForImprovement.push("No financial audit has been completed in the current period");
  }
  if (!auditCompliance.policyCurrent) {
    areasForImprovement.push("The allowance policy has not been reviewed recently");
  }

  // -- Actions --
  const actions: string[] = [];

  if (allowanceManagement.regularPocketMoneyRate < 100 && profiles.length > 0) {
    actions.push("URGENT: Ensure all children receive regular pocket money as required by NMS 15");
  }
  if (!auditCompliance.auditCompletedRecently) {
    actions.push("HIGH: Complete a financial audit covering the current period");
  }
  if (savingsInvestment.savingsAccountRate < 90 && profiles.length > 0) {
    actions.push("HIGH: Open savings accounts for all children who do not currently have one");
  }
  if (financialLiteracy.assessmentRate < 100 && profiles.length > 0) {
    actions.push("HIGH: Complete financial literacy assessments for all children");
  }
  if (allowanceManagement.childConsentRate < 90 && transactions.length > 0) {
    actions.push("MEDIUM: Implement a process to obtain and record child consent for all financial transactions");
  }
  if (allowanceManagement.receiptRate < 80 && transactions.some((t) => t.type === "spent")) {
    actions.push("MEDIUM: Improve receipt collection processes for all expenditure");
  }
  if (!auditCompliance.policyCurrent) {
    actions.push("MEDIUM: Review and update the allowance policy");
  }
  if (financialLiteracy.developingPlusRate < 80 && profiles.length > 0) {
    actions.push("LOW: Develop a financial literacy programme to support children reaching at least developing level");
  }

  // -- Regulatory Links --
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 5 -- quality and purpose of care, including financial support and independence skills",
    "CHR 2015 Reg 6 -- children's views, wishes and feelings about their financial support",
    "NMS 15 -- money management: pocket money, savings, financial literacy for looked after children",
    "UNCRC Article 27 -- right to an adequate standard of living, including financial wellbeing",
    "CA 1989 s23 -- local authority duty to maintain looked after children, including financial provision",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    allowanceManagement,
    savingsInvestment,
    financialLiteracy,
    auditCompliance,
    childSummaries,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
