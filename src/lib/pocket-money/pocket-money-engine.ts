// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Pocket Money & Savings Engine
//
// Deterministic engine for tracking children's financial entitlements,
// pocket money, savings, clothing allowances, birthday/festival money,
// and financial literacy — supporting independence skills.
//
// Aligned to:
//   - CHR 2015 Reg 39 — Pocket money & personal allowances
//   - CHR 2015 Reg 7 — Views & wishes (financial decisions)
//   - CHR 2015 Reg 5 — Quality and purpose of care (independence)
//   - Leaving Care Act 2000 — Financial preparation
//   - SCCIF — Preparing for adulthood, financial capability
//   - DfE Financial Framework for Looked After Children
//   - Local Authority Allowance Schedules
//
// Key requirements:
//   - Age-appropriate pocket money paid regularly
//   - Savings accounts maintained for each child
//   - Clothing and personal allowances tracked
//   - Birthday and festival money provided
//   - Financial literacy support evidenced
//   - All transactions receipted and transparent
//   - Children involved in financial decisions
//   - Receipts / audit trail maintained
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type TransactionType =
  | "pocket_money"
  | "savings_deposit"
  | "savings_withdrawal"
  | "clothing_allowance"
  | "birthday_money"
  | "festival_money"
  | "activity_money"
  | "travel_money"
  | "personal_purchase"
  | "educational_expense"
  | "other";

export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "prepaid_card"
  | "voucher";

export type FinancialLiteracyTopic =
  | "budgeting"
  | "saving"
  | "banking"
  | "comparison_shopping"
  | "bills_and_utilities"
  | "online_safety"
  | "debt_awareness"
  | "employment_income";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ChildFinancialProfile {
  childId: string;
  childName: string;
  homeId: string;
  dateOfBirth: string;
  weeklyPocketMoneyRate: number;         // £ per week (age-appropriate)
  monthlyClothingAllowance: number;      // £ per month
  birthdayAllowance: number;             // £ annual
  festivalAllowance: number;             // £ per festival (Christmas etc)
  savingsAccountExists: boolean;
  savingsAccountBalance?: number;
  savingsTargetMonthly?: number;         // target monthly deposit
  prepaidCardIssued: boolean;
  transactions: FinancialTransaction[];
  literacySessions: LiteracySession[];
  financialPlanInPlace: boolean;
  childInvolvedInBudget: boolean;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;                        // positive = credit, negative = debit
  description: string;
  method: PaymentMethod;
  receiptRecorded: boolean;
  authorisedBy: string;
  childSignature?: boolean;              // child acknowledged receipt
}

export interface LiteracySession {
  id: string;
  date: string;
  topic: FinancialLiteracyTopic;
  duration: number;                      // minutes
  facilitatedBy: string;
  notes?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ChildFinancialResult {
  childId: string;
  childName: string;
  age: number;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  // Pocket money
  pocketMoneyPaidLast30Days: number;
  pocketMoneyOwed: number;               // any missed weeks
  pocketMoneyOnTime: boolean;
  // Savings
  savingsBalance: number;
  savingsDepositsLast90Days: number;
  savingsOnTrack: boolean;
  // Allowances
  clothingSpendLast90Days: number;
  birthdayMoneyProvided: boolean;
  // Transactions
  totalTransactions30Days: number;
  receiptRate: number;                   // % with receipts
  childSignatureRate: number;            // % child acknowledged
  // Literacy
  literacySessionsLast90Days: number;
  topicsCovered: FinancialLiteracyTopic[];
  topicsNotCovered: FinancialLiteracyTopic[];
  // Score
  financialWellbeingScore: number;       // 0-100
}

export interface HomeFinancialMetrics {
  homeId: string;
  childCount: number;
  overallFinancialScore: number;
  pocketMoneyComplianceRate: number;     // % paid on time
  savingsAccountRate: number;            // % with savings accounts
  averageSavingsBalance: number;
  receiptComplianceRate: number;
  clothingAllowanceUtilisation: number;  // % used of entitlement
  literacySessionRate: number;           // sessions per child per quarter
  topicsDelivered: FinancialLiteracyTopic[];
  topicsGap: FinancialLiteracyTopic[];
  totalSpend30Days: number;
  childrenWithIssues: { childName: string; issues: string[] }[];
  complianceIssues: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const POCKET_MONEY_FREQUENCY_DAYS = 7;        // weekly
const POCKET_MONEY_GRACE_DAYS = 2;            // 2 day grace period
const MIN_LITERACY_SESSIONS_PER_QUARTER = 3;  // at least quarterly sessions
const RECEIPT_TARGET_RATE = 90;               // 90% receipt rate
const SAVINGS_DEPOSIT_FREQUENCY_DAYS = 30;    // monthly deposits expected

const ALL_LITERACY_TOPICS: FinancialLiteracyTopic[] = [
  "budgeting",
  "saving",
  "banking",
  "comparison_shopping",
  "bills_and_utilities",
  "online_safety",
  "debt_awareness",
  "employment_income",
];

const AGE_APPROPRIATE_TOPICS: Record<string, FinancialLiteracyTopic[]> = {
  "under12": ["budgeting", "saving", "comparison_shopping"],
  "12to15": ["budgeting", "saving", "banking", "comparison_shopping", "online_safety"],
  "16plus": ALL_LITERACY_TOPICS,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function calculateAge(dob: string, now: number): number {
  const birth = new Date(dob);
  const current = new Date(now);
  let age = current.getFullYear() - birth.getFullYear();
  const monthDiff = current.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && current.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getAgeGroup(age: number): string {
  if (age < 12) return "under12";
  if (age < 16) return "12to15";
  return "16plus";
}

// ── Core: Evaluate Child Financial Compliance ────────────────────────────

export function evaluateChildFinancialCompliance(
  profile: ChildFinancialProfile,
  now?: string,
): ChildFinancialResult {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysAgo = currentTime - 90 * 24 * 60 * 60 * 1000;
  const issues: string[] = [];
  const warnings: string[] = [];

  const age = calculateAge(profile.dateOfBirth, currentTime);
  const ageGroup = getAgeGroup(age);

  // ── Pocket Money ────────────────────────────────────────────────────────
  const pocketMoneyTxns = profile.transactions.filter(
    t => t.type === "pocket_money" && new Date(t.date).getTime() > thirtyDaysAgo
  );
  const pocketMoneyPaidLast30Days = pocketMoneyTxns.reduce((s, t) => s + t.amount, 0);

  // Expected: ~4 weekly payments in 30 days
  const expectedWeeks = Math.floor(30 / POCKET_MONEY_FREQUENCY_DAYS);
  const expectedPocketMoney = expectedWeeks * profile.weeklyPocketMoneyRate;
  const pocketMoneyOwed = Math.max(0, expectedPocketMoney - pocketMoneyPaidLast30Days);
  const pocketMoneyOnTime = pocketMoneyOwed <= profile.weeklyPocketMoneyRate * 0.5; // allow half-week tolerance

  if (pocketMoneyTxns.length === 0) {
    issues.push("No pocket money paid in last 30 days");
  } else if (pocketMoneyOwed > profile.weeklyPocketMoneyRate) {
    warnings.push(`Pocket money shortfall of £${pocketMoneyOwed.toFixed(2)}`);
  }

  // ── Savings ─────────────────────────────────────────────────────────────
  if (!profile.savingsAccountExists) {
    issues.push("No savings account set up for child");
  }
  const savingsBalance = profile.savingsAccountBalance ?? 0;

  const savingsDeposits = profile.transactions.filter(
    t => t.type === "savings_deposit" && new Date(t.date).getTime() > ninetyDaysAgo
  );
  const savingsDepositsLast90Days = savingsDeposits.reduce((s, t) => s + t.amount, 0);

  let savingsOnTrack = true;
  if (profile.savingsTargetMonthly && profile.savingsTargetMonthly > 0) {
    const expectedSavings = profile.savingsTargetMonthly * 3; // 90 days
    savingsOnTrack = savingsDepositsLast90Days >= expectedSavings * 0.8; // 80% tolerance
    if (!savingsOnTrack) {
      warnings.push("Savings deposits below target — review with child");
    }
  }

  // ── Clothing Allowance ──────────────────────────────────────────────────
  const clothingTxns = profile.transactions.filter(
    t => t.type === "clothing_allowance" && new Date(t.date).getTime() > ninetyDaysAgo
  );
  const clothingSpendLast90Days = clothingTxns.reduce((s, t) => s + Math.abs(t.amount), 0);

  // ── Birthday Money ──────────────────────────────────────────────────────
  const oneYearAgo = currentTime - 365 * 24 * 60 * 60 * 1000;
  const birthdayTxns = profile.transactions.filter(
    t => t.type === "birthday_money" && new Date(t.date).getTime() > oneYearAgo
  );
  const birthdayMoneyProvided = birthdayTxns.length > 0;

  // Check if birthday was in last year and no money given
  const birthdayThisYear = new Date(profile.dateOfBirth);
  birthdayThisYear.setFullYear(new Date(currentTime).getFullYear());
  const birthdayTime = birthdayThisYear.getTime();
  if (birthdayTime < currentTime && birthdayTime > oneYearAgo && !birthdayMoneyProvided) {
    warnings.push("Birthday money not recorded this year");
  }

  // ── Transactions / Receipts ─────────────────────────────────────────────
  const recentTransactions = profile.transactions.filter(
    t => new Date(t.date).getTime() > thirtyDaysAgo
  );
  const withReceipts = recentTransactions.filter(t => t.receiptRecorded);
  const receiptRate = recentTransactions.length > 0
    ? Math.round((withReceipts.length / recentTransactions.length) * 100)
    : 100;

  if (recentTransactions.length >= 3 && receiptRate < RECEIPT_TARGET_RATE) {
    warnings.push(`Low receipt recording rate (${receiptRate}%) — audit trail at risk`);
  }

  const withSignature = recentTransactions.filter(t => t.childSignature);
  const childSignatureRate = recentTransactions.length > 0
    ? Math.round((withSignature.length / recentTransactions.length) * 100)
    : 0;

  // ── Financial Literacy ──────────────────────────────────────────────────
  const recentSessions = profile.literacySessions.filter(
    s => new Date(s.date).getTime() > ninetyDaysAgo
  );
  const literacySessionsLast90Days = recentSessions.length;

  if (literacySessionsLast90Days < MIN_LITERACY_SESSIONS_PER_QUARTER) {
    warnings.push(`Only ${literacySessionsLast90Days} financial literacy session(s) this quarter (target: ${MIN_LITERACY_SESSIONS_PER_QUARTER})`);
  }

  const topicsCovered = [...new Set(profile.literacySessions.map(s => s.topic))];
  const ageAppropriateTopics = AGE_APPROPRIATE_TOPICS[ageGroup] || ALL_LITERACY_TOPICS;
  const topicsNotCovered = ageAppropriateTopics.filter(t => !topicsCovered.includes(t));

  // ── Financial Plan ──────────────────────────────────────────────────────
  if (!profile.financialPlanInPlace && age >= 14) {
    warnings.push("No financial independence plan in place (recommended from 14+)");
  }

  if (!profile.childInvolvedInBudget) {
    warnings.push("Child not involved in budget discussions");
  }

  // ── Score ───────────────────────────────────────────────────────────────
  const scoringFactors = [
    pocketMoneyOnTime ? 20 : 0,
    profile.savingsAccountExists ? 15 : 0,
    (profile.savingsAccountExists && savingsOnTrack) ? 10 : 0,
    (recentTransactions.length > 0 && receiptRate >= 90) ? 10 : (recentTransactions.length > 0 && receiptRate >= 70) ? 5 : 0,
    literacySessionsLast90Days >= 3 ? 15 : literacySessionsLast90Days >= 1 ? 8 : 0,
    topicsNotCovered.length === 0 ? 10 : topicsNotCovered.length <= 2 ? 5 : 0,
    profile.financialPlanInPlace ? 10 : 0,
    profile.childInvolvedInBudget ? 5 : 0,
    profile.prepaidCardIssued && age >= 12 ? 5 : (!profile.prepaidCardIssued && age < 12) ? 5 : 0,
  ];
  const financialWellbeingScore = scoringFactors.reduce((a, b) => a + b, 0);

  return {
    childId: profile.childId,
    childName: profile.childName,
    age,
    isCompliant: issues.length === 0,
    issues,
    warnings,
    pocketMoneyPaidLast30Days,
    pocketMoneyOwed,
    pocketMoneyOnTime,
    savingsBalance,
    savingsDepositsLast90Days,
    savingsOnTrack,
    clothingSpendLast90Days,
    birthdayMoneyProvided,
    totalTransactions30Days: recentTransactions.length,
    receiptRate,
    childSignatureRate,
    literacySessionsLast90Days,
    topicsCovered,
    topicsNotCovered,
    financialWellbeingScore,
  };
}

// ── Core: Calculate Home Financial Metrics ──────────────────────────────

export function calculateHomeFinancialMetrics(
  profiles: ChildFinancialProfile[],
  homeId: string,
  now?: string,
): HomeFinancialMetrics {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysAgo = currentTime - 90 * 24 * 60 * 60 * 1000;

  const homeProfiles = profiles.filter(p => p.homeId === homeId);
  const results = homeProfiles.map(p => evaluateChildFinancialCompliance(p, now));
  const childCount = homeProfiles.length;

  // Overall score
  const overallFinancialScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.financialWellbeingScore, 0) / results.length)
    : 0;

  // Pocket money compliance
  const pocketMoneyOnTime = results.filter(r => r.pocketMoneyOnTime).length;
  const pocketMoneyComplianceRate = childCount > 0
    ? Math.round((pocketMoneyOnTime / childCount) * 100)
    : 100;

  // Savings
  const withSavings = homeProfiles.filter(p => p.savingsAccountExists).length;
  const savingsAccountRate = childCount > 0
    ? Math.round((withSavings / childCount) * 100)
    : 0;

  const averageSavingsBalance = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.savingsBalance, 0) / results.length)
    : 0;

  // Receipts
  const allRecentTxns = homeProfiles.flatMap(p =>
    p.transactions.filter(t => new Date(t.date).getTime() > thirtyDaysAgo)
  );
  const allWithReceipts = allRecentTxns.filter(t => t.receiptRecorded);
  const receiptComplianceRate = allRecentTxns.length > 0
    ? Math.round((allWithReceipts.length / allRecentTxns.length) * 100)
    : 100;

  // Clothing allowance
  const totalClothingEntitlement = homeProfiles.reduce(
    (s, p) => s + p.monthlyClothingAllowance * 3, 0
  ); // 3 months
  const totalClothingSpend = results.reduce((s, r) => s + r.clothingSpendLast90Days, 0);
  const clothingAllowanceUtilisation = totalClothingEntitlement > 0
    ? Math.round((totalClothingSpend / totalClothingEntitlement) * 100)
    : 0;

  // Literacy
  const totalLiteracySessions = results.reduce((s, r) => s + r.literacySessionsLast90Days, 0);
  const literacySessionRate = childCount > 0
    ? Math.round((totalLiteracySessions / childCount) * 10) / 10
    : 0;

  const allTopicsCovered = [...new Set(results.flatMap(r => r.topicsCovered))];
  const topicsGap = ALL_LITERACY_TOPICS.filter(t => !allTopicsCovered.includes(t));

  // Spend
  const totalSpend30Days = allRecentTxns
    .filter(t => t.amount < 0 || ["pocket_money", "clothing_allowance", "birthday_money", "festival_money", "activity_money"].includes(t.type))
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  // Issues
  const childrenWithIssues = results
    .filter(r => r.issues.length > 0)
    .map(r => ({ childName: r.childName, issues: r.issues }));

  const complianceIssues = [...new Set(results.flatMap(r => r.issues))];

  return {
    homeId,
    childCount,
    overallFinancialScore,
    pocketMoneyComplianceRate,
    savingsAccountRate,
    averageSavingsBalance,
    receiptComplianceRate,
    clothingAllowanceUtilisation,
    literacySessionRate,
    topicsDelivered: allTopicsCovered,
    topicsGap,
    totalSpend30Days,
    childrenWithIssues,
    complianceIssues,
  };
}

// ── Label Helpers ────────────────────────────────────────────────────────

export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    pocket_money: "Pocket Money",
    savings_deposit: "Savings Deposit",
    savings_withdrawal: "Savings Withdrawal",
    clothing_allowance: "Clothing Allowance",
    birthday_money: "Birthday Money",
    festival_money: "Festival Money",
    activity_money: "Activity Money",
    travel_money: "Travel Money",
    personal_purchase: "Personal Purchase",
    educational_expense: "Educational Expense",
    other: "Other",
  };
  return labels[type] ?? type;
}

export function getLiteracyTopicLabel(topic: FinancialLiteracyTopic): string {
  const labels: Record<FinancialLiteracyTopic, string> = {
    budgeting: "Budgeting",
    saving: "Saving & Goals",
    banking: "Bank Accounts",
    comparison_shopping: "Smart Shopping",
    bills_and_utilities: "Bills & Utilities",
    online_safety: "Online Financial Safety",
    debt_awareness: "Debt Awareness",
    employment_income: "Earning & Employment",
  };
  return labels[topic] ?? topic;
}
