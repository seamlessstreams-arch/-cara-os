import { below, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// Cara -- Children's Fund Management Intelligence Engine
//
// Pure deterministic engine -- no AI, no external calls.
// Evaluates how well a children's home manages pocket money, savings,
// personal allowances and promotes financial literacy for looked-after children.
//
// Aligned to:
//   - CHR 2015 Reg 21 -- Pocket money (provision of pocket money)
//   - CHR 2015 Reg 6 -- Quality and purpose of care (child development)
//   - SCCIF -- Social Care Common Inspection Framework
//   - NMS 10 -- Enjoying and achieving
//   - UNCRC Article 26 -- Right to social security
//   - CA 1989 s23(2) -- Maintenance of looked-after children
//   - CHR 2015 Reg 39 -- Financial procedures
//
// Key requirements:
//   - Individual child accounts maintained with clear records
//   - Regular reconciliation of all accounts
//   - Two-signature authorisation for transactions
//   - Receipts retained for all purchases
//   - Children's informed consent for transactions
//   - Financial literacy education age-appropriate and practical
//   - Quarterly audits with full compliance checks
//   - Children have access to their own funds
//   - Savings encouraged with goals
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type TransactionType =
  | "pocket_money"
  | "savings_deposit"
  | "savings_withdrawal"
  | "birthday_gift"
  | "clothing_allowance"
  | "activity_allowance"
  | "personal_purchase"
  | "other";

export type AccountStatus =
  | "active"
  | "overdue_reconciliation"
  | "dormant"
  | "closed";

export type ReconciliationFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "overdue";

export type FinancialLiteracyTopic =
  | "budgeting"
  | "saving"
  | "banking"
  | "spending_decisions"
  | "value_of_money"
  | "online_safety_financial"
  | "benefits_entitlements"
  | "debt_awareness";

export type ChildConsent =
  | "informed_consent"
  | "no_consent_sought"
  | "declined"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface ChildAccount {
  id: string;
  childId: string;
  childName: string;
  accountStatus: AccountStatus;
  balance: number;
  lastReconciled: string | null;
  reconciliationFrequency: ReconciliationFrequency;
  childHasAccess: boolean;
  signedAgreement: boolean;
  savingsGoal: number | null;
  savingsBalance: number;
}

export interface FinancialTransaction {
  id: string;
  childId: string;
  childName: string;
  date: string;
  transactionType: TransactionType;
  amount: number;
  description: string;
  receiptRetained: boolean;
  childConsent: ChildConsent;
  authorisedBy: string;
  twoSignatures: boolean;
}

export interface FinancialLiteracySession {
  id: string;
  childId: string;
  childName: string;
  date: string;
  topic: FinancialLiteracyTopic;
  duration: number; // minutes
  facilitator: string;
  childEngaged: boolean;
  practicalComponent: boolean;
  ageAppropriate: boolean;
}

export interface FinancialAudit {
  id: string;
  auditDate: string;
  auditor: string;
  allAccountsReconciled: boolean;
  receiptRetentionCompliant: boolean;
  twoSignatureCompliant: boolean;
  childAccessVerified: boolean;
  discrepanciesFound: number;
  discrepanciesResolved: number;
  policyCompliant: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface AccountManagementResult {
  overallScore: number; // 0-25
  totalAccounts: number;
  /** null when the population is empty — nothing measured, not 0%. */
  activeRate: number | null; // %
  /** null when the population is empty — nothing measured, not 0%. */
  reconciledRate: number | null; // %
  /** null when the population is empty — nothing measured, not 0%. */
  childAccessRate: number | null; // %
  /** null when the population is empty — nothing measured, not 0%. */
  signedAgreementRate: number | null; // %
  overdueCount: number;
  averageBalance: number;
  totalSavings: number;
}

export interface TransactionIntegrityResult {
  overallScore: number; // 0-25
  totalTransactions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  receiptRate: number | null; // %
  /** null when the population is empty — nothing measured, not 0%. */
  consentRate: number | null; // %
  /** null when the population is empty — nothing measured, not 0%. */
  twoSignatureRate: number | null; // %
  averageTransaction: number;
  typeDistribution: Record<TransactionType, number>;
}

export interface FinancialLiteracyResult {
  overallScore: number; // 0-25
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  engagementRate: number | null; // %
  /** null when the population is empty — nothing measured, not 0%. */
  practicalRate: number | null; // %
  /** null when the population is empty — nothing measured, not 0%. */
  ageAppropriateRate: number | null; // %
  /** null when the population is empty — nothing measured, not 0%. */
  topicCoverage: number | null; // % of topics covered
  topicDistribution: Record<FinancialLiteracyTopic, number>;
}

export interface AuditComplianceResult {
  overallScore: number; // 0-25
  totalAudits: number;
  /** null when the population is empty — nothing measured, not 0%. */
  allReconciledRate: number | null; // %
  /** null when the population is empty — nothing measured, not 0%. */
  receiptCompliantRate: number | null; // %
  /** null when the population is empty — nothing measured, not 0%. */
  twoSigCompliantRate: number | null; // %
  /** null when the population is empty — nothing measured, not 0%. */
  discrepancyRate: number | null; // % of found that were resolved
  /** null when the population is empty — nothing measured, not 0%. */
  policyCompliantRate: number | null; // %
}

export interface ChildFinancialProfile {
  childId: string;
  childName: string;
  accountStatus: AccountStatus;
  balance: number;
  savingsBalance: number;
  transactionCount: number;
  literacySessions: number;
  consentRate: number;
  overallScore: number; // 0-10
}

export interface ChildrenFundManagementIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100
  rating: Rating;
  accountManagement: AccountManagementResult;
  transactionIntegrity: TransactionIntegrityResult;
  financialLiteracy: FinancialLiteracyResult;
  auditCompliance: AuditComplianceResult;
  childProfiles: ChildFinancialProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

/** Calculate percentage, returning 0 if denominator is 0. */
/** Map overall score (0-100) to Ofsted-style rating. */
export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Label Functions ----------------------------------------------------------

export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    pocket_money: "Pocket Money",
    savings_deposit: "Savings Deposit",
    savings_withdrawal: "Savings Withdrawal",
    birthday_gift: "Birthday Gift",
    clothing_allowance: "Clothing Allowance",
    activity_allowance: "Activity Allowance",
    personal_purchase: "Personal Purchase",
    other: "Other",
  };
  return labels[type] || type;
}

export function getAccountStatusLabel(status: AccountStatus): string {
  const labels: Record<AccountStatus, string> = {
    active: "Active",
    overdue_reconciliation: "Overdue Reconciliation",
    dormant: "Dormant",
    closed: "Closed",
  };
  return labels[status] || status;
}

export function getReconciliationFrequencyLabel(
  freq: ReconciliationFrequency,
): string {
  const labels: Record<ReconciliationFrequency, string> = {
    weekly: "Weekly",
    fortnightly: "Fortnightly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    overdue: "Overdue",
  };
  return labels[freq] || freq;
}

export function getFinancialLiteracyTopicLabel(
  topic: FinancialLiteracyTopic,
): string {
  const labels: Record<FinancialLiteracyTopic, string> = {
    budgeting: "Budgeting",
    saving: "Saving",
    banking: "Banking",
    spending_decisions: "Spending Decisions",
    value_of_money: "Value of Money",
    online_safety_financial: "Online Financial Safety",
    benefits_entitlements: "Benefits & Entitlements",
    debt_awareness: "Debt Awareness",
  };
  return labels[topic] || topic;
}

export function getChildConsentLabel(consent: ChildConsent): string {
  const labels: Record<ChildConsent, string> = {
    informed_consent: "Informed Consent",
    no_consent_sought: "No Consent Sought",
    declined: "Declined",
    not_applicable: "Not Applicable",
  };
  return labels[consent] || consent;
}

export function getRatingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating] || rating;
}

// -- All topics constant (for coverage calculation) ---------------------------

const ALL_LITERACY_TOPICS: FinancialLiteracyTopic[] = [
  "budgeting",
  "saving",
  "banking",
  "spending_decisions",
  "value_of_money",
  "online_safety_financial",
  "benefits_entitlements",
  "debt_awareness",
];

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluate account management quality (0-25).
 *
 * Scoring:
 *   active rate            -> 0-6
 *   reconciled rate        -> 0-6
 *   child access rate      -> 0-5
 *   signed agreement rate  -> 0-4
 *   overdue penalty        -> -3 per overdue (clamped)
 *
 * Empty data = 0.
 */
export function evaluateAccountManagement(
  accounts: ChildAccount[],
): AccountManagementResult {
  if (accounts.length === 0) {
    return {
      overallScore: 0,
      totalAccounts: 0,
      activeRate: null,
      reconciledRate: null,
      childAccessRate: null,
      signedAgreementRate: null,
      overdueCount: 0,
      averageBalance: 0,
      totalSavings: 0,
    };
  }

  const active = accounts.filter((a) => a.accountStatus === "active");
  const reconciled = accounts.filter((a) => a.lastReconciled !== null);
  const withAccess = accounts.filter((a) => a.childHasAccess);
  const withAgreement = accounts.filter((a) => a.signedAgreement);
  const overdue = accounts.filter(
    (a) => a.accountStatus === "overdue_reconciliation",
  );

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalSavings = accounts.reduce((sum, a) => sum + a.savingsBalance, 0);

  const activeRate = rate(active.length, accounts.length);
  const reconciledRate = rate(reconciled.length, accounts.length);
  const childAccessRate = rate(withAccess.length, accounts.length);
  const signedAgreementRate = rate(withAgreement.length, accounts.length);
  const averageBalance =
    Math.round((totalBalance / accounts.length) * 100) / 100;

  // Scoring
  const activeScore = Math.round(((activeRate ?? 0) / 100) * 6);
  const reconciledScore = Math.round(((reconciledRate ?? 0) / 100) * 6);
  const accessScore = Math.round(((childAccessRate ?? 0) / 100) * 5);
  const agreementScore = Math.round(((signedAgreementRate ?? 0) / 100) * 4);
  const overduePenalty = Math.min(overdue.length * 3, 10);

  const overallScore = Math.min(
    25,
    Math.max(
      0,
      activeScore + reconciledScore + accessScore + agreementScore - overduePenalty,
    ),
  );

  return {
    overallScore,
    totalAccounts: accounts.length,
    activeRate,
    reconciledRate,
    childAccessRate,
    signedAgreementRate,
    overdueCount: overdue.length,
    averageBalance,
    totalSavings,
  };
}

/**
 * Evaluate transaction integrity (0-25).
 *
 * Scoring:
 *   receipt rate           -> 0-8
 *   consent rate           -> 0-8
 *   two-signature rate     -> 0-9
 *
 * Empty data = 0.
 */
export function evaluateTransactionIntegrity(
  transactions: FinancialTransaction[],
): TransactionIntegrityResult {
  const emptyDist: Record<TransactionType, number> = {
    pocket_money: 0,
    savings_deposit: 0,
    savings_withdrawal: 0,
    birthday_gift: 0,
    clothing_allowance: 0,
    activity_allowance: 0,
    personal_purchase: 0,
    other: 0,
  };

  if (transactions.length === 0) {
    return {
      overallScore: 0,
      totalTransactions: 0,
      receiptRate: null,
      consentRate: null,
      twoSignatureRate: null,
      averageTransaction: 0,
      typeDistribution: { ...emptyDist },
    };
  }

  const withReceipt = transactions.filter((t) => t.receiptRetained);
  const withConsent = transactions.filter(
    (t) =>
      t.childConsent === "informed_consent" ||
      t.childConsent === "not_applicable",
  );
  const withTwoSig = transactions.filter((t) => t.twoSignatures);

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  const typeDist = { ...emptyDist };
  for (const t of transactions) {
    typeDist[t.transactionType] = (typeDist[t.transactionType] || 0) + 1;
  }

  const receiptRate = rate(withReceipt.length, transactions.length);
  const consentRate = rate(withConsent.length, transactions.length);
  const twoSignatureRate = rate(withTwoSig.length, transactions.length);
  const averageTransaction =
    Math.round((totalAmount / transactions.length) * 100) / 100;

  // Scoring
  const receiptScore = Math.round(((receiptRate ?? 0) / 100) * 8);
  const consentScore = Math.round(((consentRate ?? 0) / 100) * 8);
  const twoSigScore = Math.round(((twoSignatureRate ?? 0) / 100) * 9);

  const overallScore = Math.min(
    25,
    Math.max(0, receiptScore + consentScore + twoSigScore),
  );

  return {
    overallScore,
    totalTransactions: transactions.length,
    receiptRate,
    consentRate,
    twoSignatureRate,
    averageTransaction,
    typeDistribution: typeDist,
  };
}

/**
 * Evaluate financial literacy provision (0-25).
 *
 * Scoring:
 *   engagement rate        -> 0-6
 *   practical rate         -> 0-6
 *   age appropriate rate   -> 0-5
 *   topic coverage         -> 0-8
 *
 * Empty data = 0.
 */
export function evaluateFinancialLiteracy(
  sessions: FinancialLiteracySession[],
): FinancialLiteracyResult {
  const emptyDist: Record<FinancialLiteracyTopic, number> = {
    budgeting: 0,
    saving: 0,
    banking: 0,
    spending_decisions: 0,
    value_of_money: 0,
    online_safety_financial: 0,
    benefits_entitlements: 0,
    debt_awareness: 0,
  };

  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      engagementRate: null,
      practicalRate: null,
      ageAppropriateRate: null,
      topicCoverage: null,
      topicDistribution: { ...emptyDist },
    };
  }

  const engaged = sessions.filter((s) => s.childEngaged);
  const practical = sessions.filter((s) => s.practicalComponent);
  const ageAppropriate = sessions.filter((s) => s.ageAppropriate);

  const topicDist = { ...emptyDist };
  const topicsCovered = new Set<FinancialLiteracyTopic>();
  for (const s of sessions) {
    topicDist[s.topic] = (topicDist[s.topic] || 0) + 1;
    topicsCovered.add(s.topic);
  }

  const engagementRate = rate(engaged.length, sessions.length);
  const practicalRate = rate(practical.length, sessions.length);
  const ageAppropriateRate = rate(ageAppropriate.length, sessions.length);
  const topicCoverage = rate(topicsCovered.size, ALL_LITERACY_TOPICS.length);

  // Scoring
  const engagementScore = Math.round(((engagementRate ?? 0) / 100) * 6);
  const practicalScore = Math.round(((practicalRate ?? 0) / 100) * 6);
  const ageScore = Math.round(((ageAppropriateRate ?? 0) / 100) * 5);
  const coverageScore = Math.round(((topicCoverage ?? 0) / 100) * 8);

  const overallScore = Math.min(
    25,
    Math.max(
      0,
      engagementScore + practicalScore + ageScore + coverageScore,
    ),
  );

  return {
    overallScore,
    totalSessions: sessions.length,
    engagementRate,
    practicalRate,
    ageAppropriateRate,
    topicCoverage,
    topicDistribution: topicDist,
  };
}

/**
 * Evaluate audit compliance (0-25).
 *
 * Scoring:
 *   all reconciled rate      -> 0-5
 *   receipt compliant rate   -> 0-5
 *   two-sig compliant rate   -> 0-5
 *   discrepancy resolved     -> 0-5
 *   policy compliant rate    -> 0-5
 *
 * Empty data = 0.
 */
export function evaluateAuditCompliance(
  audits: FinancialAudit[],
): AuditComplianceResult {
  if (audits.length === 0) {
    return {
      overallScore: 0,
      totalAudits: 0,
      allReconciledRate: null,
      receiptCompliantRate: null,
      twoSigCompliantRate: null,
      discrepancyRate: null,
      policyCompliantRate: null,
    };
  }

  const reconciled = audits.filter((a) => a.allAccountsReconciled);
  const receiptCompliant = audits.filter((a) => a.receiptRetentionCompliant);
  const twoSigCompliant = audits.filter((a) => a.twoSignatureCompliant);
  const policyCompliant = audits.filter((a) => a.policyCompliant);

  const totalFound = audits.reduce((sum, a) => sum + a.discrepanciesFound, 0);
  const totalResolved = audits.reduce(
    (sum, a) => sum + a.discrepanciesResolved,
    0,
  );

  const allReconciledRate = rate(reconciled.length, audits.length);
  const receiptCompliantRate = rate(receiptCompliant.length, audits.length);
  const twoSigCompliantRate = rate(twoSigCompliant.length, audits.length);
  const discrepancyRate = rate(totalResolved, totalFound);
  const policyCompliantRate = rate(policyCompliant.length, audits.length);

  // Scoring
  const reconciledScore = Math.round(((allReconciledRate ?? 0) / 100) * 5);
  const receiptScore = Math.round(((receiptCompliantRate ?? 0) / 100) * 5);
  const twoSigScore = Math.round(((twoSigCompliantRate ?? 0) / 100) * 5);
  const discrepancyScore = Math.round(((discrepancyRate ?? 0) / 100) * 5);
  const policyScore = Math.round(((policyCompliantRate ?? 0) / 100) * 5);

  const overallScore = Math.min(
    25,
    Math.max(
      0,
      reconciledScore + receiptScore + twoSigScore + discrepancyScore + policyScore,
    ),
  );

  return {
    overallScore,
    totalAudits: audits.length,
    allReconciledRate,
    receiptCompliantRate,
    twoSigCompliantRate,
    discrepancyRate,
    policyCompliantRate,
  };
}

// -- Build Child Financial Profiles -------------------------------------------

export function buildChildFinancialProfiles(
  accounts: ChildAccount[],
  transactions: FinancialTransaction[],
  sessions: FinancialLiteracySession[],
): ChildFinancialProfile[] {
  return accounts.map((account) => {
    const childTransactions = transactions.filter(
      (t) => t.childId === account.childId,
    );
    const childSessions = sessions.filter(
      (s) => s.childId === account.childId,
    );

    const consentedTransactions = childTransactions.filter(
      (t) =>
        t.childConsent === "informed_consent" ||
        t.childConsent === "not_applicable",
    );
    const consentRate = rate(consentedTransactions.length, childTransactions.length)!;

    // Score (0-10):
    //   account active = 2
    //   has access = 2
    //   consent rate contribution = 0-3
    //   has literacy sessions = 0-3
    let score = 0;
    if (account.accountStatus === "active") score += 2;
    if (account.childHasAccess) score += 2;
    score += Math.round(((consentRate ?? 0) / 100) * 3);
    const sessionScore =
      childSessions.length >= 3 ? 3 : childSessions.length >= 1 ? 2 : 0;
    score += sessionScore;

    return {
      childId: account.childId,
      childName: account.childName,
      accountStatus: account.accountStatus,
      balance: account.balance,
      savingsBalance: account.savingsBalance,
      transactionCount: childTransactions.length,
      literacySessions: childSessions.length,
      consentRate,
      overallScore: Math.min(10, Math.max(0, score)),
    };
  });
}

// -- Main Intelligence Function -----------------------------------------------

export function generateChildrenFundManagementIntelligence(
  accounts: ChildAccount[],
  transactions: FinancialTransaction[],
  sessions: FinancialLiteracySession[],
  audits: FinancialAudit[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ChildrenFundManagementIntelligence {
  const accountManagement = evaluateAccountManagement(accounts);
  const transactionIntegrity = evaluateTransactionIntegrity(transactions);
  const financialLiteracy = evaluateFinancialLiteracy(sessions);
  const auditCompliance = evaluateAuditCompliance(audits);

  const childProfiles = buildChildFinancialProfiles(
    accounts,
    transactions,
    sessions,
  );

  // Overall score: sum of 4 evaluators (each 0-25) = 0-100
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      accountManagement.overallScore +
        transactionIntegrity.overallScore +
        financialLiteracy.overallScore +
        auditCompliance.overallScore,
    ),
  );

  const rating = getRating(overallScore);

  // -- Strengths --
  const strengths: string[] = [];

  if (accountManagement.overallScore >= 20) {
    strengths.push(
      "Child accounts are well-maintained with high active rates and regular reconciliation",
    );
  }
  if (transactionIntegrity.overallScore >= 20) {
    strengths.push(
      "Transaction records demonstrate strong integrity with consistent receipts, consent and dual authorisation",
    );
  }
  if (financialLiteracy.overallScore >= 20) {
    strengths.push(
      "Financial literacy provision is comprehensive with strong engagement and practical learning opportunities",
    );
  }
  if (auditCompliance.overallScore >= 20) {
    strengths.push(
      "Audit compliance is robust with thorough reconciliation and discrepancy resolution",
    );
  }
  if (meets(accountManagement.childAccessRate, 90) && accounts.length > 0) {
    strengths.push(
      "Children have good access to their own funds, supporting autonomy and independence",
    );
  }
  if (accountManagement.signedAgreementRate === 100 && accounts.length > 0) {
    strengths.push(
      "All children have signed agreements in place for their accounts, demonstrating informed participation",
    );
  }
  if (meets(transactionIntegrity.receiptRate, 95) && transactions.length > 0) {
    strengths.push(
      "Receipt retention is excellent, providing a clear audit trail for all financial transactions",
    );
  }
  if (meets(transactionIntegrity.twoSignatureRate, 95) && transactions.length > 0) {
    strengths.push(
      "Two-signature authorisation is consistently applied, reducing the risk of financial mismanagement",
    );
  }
  if (transactionIntegrity.consentRate === 100 && transactions.length > 0) {
    strengths.push(
      "Children's consent is obtained for all transactions, respecting their right to financial participation",
    );
  }
  if (meets(financialLiteracy.topicCoverage, 75) && sessions.length > 0) {
    strengths.push(
      "Financial literacy sessions cover a broad range of topics, preparing children for financial independence",
    );
  }
  if (meets(financialLiteracy.practicalRate, 90) && sessions.length > 0) {
    strengths.push(
      "Financial literacy sessions include practical components, making learning applicable to real life",
    );
  }
  if (
    auditCompliance.discrepancyRate === 100 &&
    auditCompliance.totalAudits > 0
  ) {
    strengths.push(
      "All financial discrepancies identified in audits have been resolved, demonstrating accountability",
    );
  }

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];

  if (accounts.length === 0) {
    areasForImprovement.push(
      "No child accounts found -- individual financial accounts must be maintained for each child",
    );
  }
  if (below(accountManagement.activeRate, 80) && accounts.length > 0) {
    areasForImprovement.push(
      `Only ${accountManagement.activeRate}% of accounts are active -- inactive accounts should be reviewed`,
    );
  }
  if (accountManagement.overdueCount > 0) {
    areasForImprovement.push(
      `${accountManagement.overdueCount} account(s) have overdue reconciliation -- all accounts must be reconciled on schedule`,
    );
  }
  if (below(accountManagement.childAccessRate, 90) && accounts.length > 0) {
    areasForImprovement.push(
      `Only ${accountManagement.childAccessRate}% of children have access to their own funds -- this restricts autonomy`,
    );
  }
  if (below(accountManagement.signedAgreementRate, 100) && accounts.length > 0) {
    areasForImprovement.push(
      `Signed agreements in place for only ${accountManagement.signedAgreementRate}% of accounts`,
    );
  }
  if (transactions.length === 0) {
    areasForImprovement.push(
      "No financial transactions recorded -- all pocket money and allowances must be documented",
    );
  }
  if (below(transactionIntegrity.receiptRate, 90) && transactions.length > 0) {
    areasForImprovement.push(
      `Receipt retention at ${transactionIntegrity.receiptRate}% -- all transactions should have receipts retained`,
    );
  }
  if (below(transactionIntegrity.consentRate, 90) && transactions.length > 0) {
    areasForImprovement.push(
      `Children's consent rate at ${transactionIntegrity.consentRate}% -- informed consent should be sought for all transactions`,
    );
  }
  if (below(transactionIntegrity.twoSignatureRate, 90) && transactions.length > 0) {
    areasForImprovement.push(
      `Two-signature authorisation at ${transactionIntegrity.twoSignatureRate}% -- dual authorisation is required for financial accountability`,
    );
  }
  if (sessions.length === 0) {
    areasForImprovement.push(
      "No financial literacy sessions recorded -- children should receive regular financial education",
    );
  }
  if (below(financialLiteracy.engagementRate, 80) && sessions.length > 0) {
    areasForImprovement.push(
      `Child engagement in financial literacy at ${financialLiteracy.engagementRate}% -- sessions should be more engaging`,
    );
  }
  if (below(financialLiteracy.topicCoverage, 50) && sessions.length > 0) {
    areasForImprovement.push(
      `Only ${financialLiteracy.topicCoverage}% of financial literacy topics covered -- broader curriculum needed`,
    );
  }
  if (below(financialLiteracy.practicalRate, 80) && sessions.length > 0) {
    areasForImprovement.push(
      `Only ${financialLiteracy.practicalRate}% of sessions include practical components -- hands-on learning is essential`,
    );
  }
  if (audits.length === 0) {
    areasForImprovement.push(
      "No financial audits completed -- quarterly audits are required under Reg 39",
    );
  }
  if (below(auditCompliance.policyCompliantRate, 100) && audits.length > 0) {
    areasForImprovement.push(
      `Policy compliance at ${auditCompliance.policyCompliantRate}% across audits -- all audits should demonstrate full policy compliance`,
    );
  }
  if (
    below(auditCompliance.discrepancyRate, 100) &&
    auditCompliance.totalAudits > 0 &&
    audits.some((a) => a.discrepanciesFound > 0)
  ) {
    areasForImprovement.push(
      "Not all financial discrepancies identified in audits have been resolved",
    );
  }

  // -- Actions --
  const actions: string[] = [];

  if (accounts.length === 0) {
    actions.push(
      "Set up individual financial accounts for each child with signed agreements and clear reconciliation schedules",
    );
  }
  if (accountManagement.overdueCount > 0) {
    actions.push(
      "Reconcile all overdue accounts immediately and establish a monitoring system to prevent future overdue reconciliations",
    );
  }
  if (below(accountManagement.childAccessRate, 90) && accounts.length > 0) {
    actions.push(
      "Review access arrangements for each child and ensure age-appropriate access to their own funds",
    );
  }
  if (below(accountManagement.signedAgreementRate, 100) && accounts.length > 0) {
    actions.push(
      "Obtain signed agreements from all children for their financial accounts, explaining their rights and the home's responsibilities",
    );
  }
  if (below(transactionIntegrity.receiptRate, 90) && transactions.length > 0) {
    actions.push(
      "Implement a receipts protocol requiring staff to retain and file receipts for all transactions at point of purchase",
    );
  }
  if (below(transactionIntegrity.consentRate, 90) && transactions.length > 0) {
    actions.push(
      "Train staff on obtaining and recording children's informed consent before processing transactions",
    );
  }
  if (below(transactionIntegrity.twoSignatureRate, 90) && transactions.length > 0) {
    actions.push(
      "Enforce two-signature authorisation for all financial transactions and audit compliance monthly",
    );
  }
  if (sessions.length === 0) {
    actions.push(
      "Develop a financial literacy programme with age-appropriate sessions covering budgeting, saving, banking and spending decisions",
    );
  }
  if (below(financialLiteracy.engagementRate, 80) && sessions.length > 0) {
    actions.push(
      "Review financial literacy delivery methods to increase child engagement, incorporating interactive and practical activities",
    );
  }
  if (below(financialLiteracy.topicCoverage, 50) && sessions.length > 0) {
    actions.push(
      "Expand financial literacy curriculum to cover all core topics including online financial safety, benefits and debt awareness",
    );
  }
  if (audits.length === 0) {
    actions.push(
      "Schedule quarterly financial audits with an independent auditor and establish a discrepancy resolution process",
    );
  }
  if (below(auditCompliance.policyCompliantRate, 100) && audits.length > 0) {
    actions.push(
      "Review and update the financial procedures policy, ensuring all staff are trained and audits demonstrate compliance",
    );
  }
  if (
    below(auditCompliance.discrepancyRate, 100) &&
    auditCompliance.totalAudits > 0 &&
    audits.some((a) => a.discrepanciesFound > 0)
  ) {
    actions.push(
      "Resolve all outstanding financial discrepancies and implement controls to prevent recurrence",
    );
  }

  const regulatoryLinks = [
    "CHR 2015 Reg 21 -- Pocket money: provision and management of children's pocket money",
    "CHR 2015 Reg 6 -- Quality and purpose of care: promoting child development",
    "SCCIF -- Social Care Common Inspection Framework: experiences and progress of children",
    "NMS 10 -- Enjoying and achieving: supporting children to develop life skills",
    "UNCRC Article 26 -- Right to social security and adequate standard of living",
    "CA 1989 s23(2) -- Duty to maintain looked-after children including financial provision",
    "CHR 2015 Reg 39 -- Financial procedures: proper systems of financial management",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    accountManagement,
    transactionIntegrity,
    financialLiteracy,
    auditCompliance,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
