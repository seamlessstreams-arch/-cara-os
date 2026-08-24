// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FINANCIAL LITERACY & MONEY MANAGEMENT INTELLIGENCE ENGINE
// Home-level: assesses pocket money management, bank account setup, savings
// habits, petty cash governance, and charity grant access across all children.
// CHR 2015 Reg 9 (quality of care), Reg 40 (standards).
// SCCIF: "Children are helped to understand the value of money and are
// supported to manage their finances and save for the future."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PocketMoneyInput {
  id: string;
  child_id: string;
  date: string;
  amount: number;
  receipt_held: boolean;
  approved_by_staff: boolean;
}

export interface BankAccountInput {
  id: string;
  child_id: string;
  account_type: string; // "savings" | "current" | "junior_isa"
  child_is_holder: boolean;
  has_savings_target: boolean;
  current_balance: number;
  financial_literacy_assessed: boolean;
}

export interface PettyCashInput {
  id: string;
  date: string;
  amount: number;
  receipt_attached: boolean;
  authorised: boolean;
  child_id: string;
}

export interface SavingsAccountInput {
  id: string;
  child_id: string;
  current_balance: number;
  monthly_target: number;
  child_manages: boolean;
  has_goals: boolean;
}

export interface CharityGrantInput {
  id: string;
  child_id: string;
  status: string; // "approved" | "pending" | "rejected"
  child_involved: boolean;
  amount_awarded: number;
}

export interface FinancialLiteracyInput {
  today: string;
  total_children: number;
  pocket_money: PocketMoneyInput[];
  bank_accounts: BankAccountInput[];
  petty_cash: PettyCashInput[];
  savings_accounts: SavingsAccountInput[];
  charity_grants: CharityGrantInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FinancialLiteracyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FinancialLiteracyResult {
  financial_rating: FinancialLiteracyRating;
  financial_score: number;
  headline: string;
  children_with_pocket_money: number;
  children_with_bank_accounts: number;
  /** null when the population is empty — nothing measured, not 0%. */
  receipt_compliance_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  savings_engagement_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  charity_access_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FinancialLiteracyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeFinancialLiteracyMoneyManagement(
  input: FinancialLiteracyInput,
): FinancialLiteracyResult {
  const {
    total_children,
    pocket_money,
    bank_accounts,
    petty_cash,
    savings_accounts,
    charity_grants,
  } = input;

  // ── Insufficient data ─────────────────────────────────────────────────
  if (total_children === 0) {
    return {
      financial_rating: "insufficient_data",
      financial_score: 0,
      headline: "No children recorded — financial literacy and money management cannot be assessed.",
      children_with_pocket_money: 0,
      children_with_bank_accounts: 0,
      receipt_compliance_rate: null,
      savings_engagement_rate: null,
      charity_access_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Core Metrics ──────────────────────────────────────────────────────

  // Children receiving pocket money (unique child IDs in pocket_money)
  const childrenWithPocketMoney = new Set(pocket_money.map((p) => p.child_id)).size;
  const pocketMoneyCoverage = rate(childrenWithPocketMoney, total_children);

  // Receipt compliance across pocket_money + petty_cash
  const allReceiptItems = [
    ...pocket_money.map((p) => p.receipt_held),
    ...petty_cash.map((p) => p.receipt_attached),
  ];
  const totalReceiptItems = allReceiptItems.length;
  const receiptsHeld = allReceiptItems.filter(Boolean).length;
  const receiptComplianceRate = rate(receiptsHeld, totalReceiptItems);

  // Bank account coverage (unique children with bank accounts)
  const childrenWithBankAccounts = new Set(bank_accounts.map((b) => b.child_id)).size;
  const bankAccountCoverage = rate(childrenWithBankAccounts, total_children);

  // Savings engagement (children with savings where child_manages=true OR has_goals=true)
  const engagedSaversSet = new Set(
    savings_accounts
      .filter((s) => s.child_manages || s.has_goals)
      .map((s) => s.child_id),
  );
  const engagedSaversCount = engagedSaversSet.size;
  const savingsEngagementRate = rate(engagedSaversCount, total_children);

  // Financial literacy assessed (children with bank accounts where financial_literacy_assessed=true)
  const childrenWithLiteracyAssessed = new Set(
    bank_accounts
      .filter((b) => b.financial_literacy_assessed)
      .map((b) => b.child_id),
  ).size;
  const financialLiteracyRate = rate(childrenWithLiteracyAssessed, childrenWithBankAccounts);

  // Charity grant access (unique children with approved charity grants)
  const childrenWithApprovedGrants = new Set(
    charity_grants
      .filter((g) => g.status === "approved")
      .map((g) => g.child_id),
  ).size;
  const charityAccessRate = rate(childrenWithApprovedGrants, total_children);

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52, 6 modifiers
  let score = 52;

  // Mod 1: Pocket money coverage (±5)
  if (meets(pocketMoneyCoverage, 90)) score += 5;
  else if (meets(pocketMoneyCoverage, 70)) score += 2;
  else if (meets(pocketMoneyCoverage, 50)) score += 0;
  else score -= 5;

  // Mod 2: Receipt compliance (±6)
  if (meets(receiptComplianceRate, 95)) score += 6;
  else if (meets(receiptComplianceRate, 80)) score += 3;
  else if (meets(receiptComplianceRate, 60)) score += 0;
  else score -= 6;

  // Mod 3: Bank account coverage (±5)
  if (meets(bankAccountCoverage, 80)) score += 5;
  else if (meets(bankAccountCoverage, 50)) score += 2;
  else if (meets(bankAccountCoverage, 30)) score += 0;
  else score -= 5;

  // Mod 4: Savings engagement (±5/−4)
  if (meets(savingsEngagementRate, 70)) score += 5;
  else if (meets(savingsEngagementRate, 40)) score += 2;
  else if (meets(savingsEngagementRate, 20)) score += 0;
  else score -= 4;

  // Mod 5: Financial literacy assessment (±4)
  if (meets(financialLiteracyRate, 80)) score += 4;
  else if (meets(financialLiteracyRate, 50)) score += 1;
  else if (meets(financialLiteracyRate, 30)) score += 0;
  else score -= 4;

  // Mod 6: Charity grant access (±5/−4)
  if (meets(charityAccessRate, 50)) score += 5;
  else if (meets(charityAccessRate, 25)) score += 2;
  else if (meets(charityAccessRate, 10)) score += 0;
  else score -= 4;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meets(pocketMoneyCoverage, 90))
    strengths.push(`${childrenWithPocketMoney} of ${total_children} children receiving pocket money — excellent financial entitlement coverage.`);
  if (meets(receiptComplianceRate, 95) && totalReceiptItems > 0)
    strengths.push(`${formatRate(receiptComplianceRate)} receipt compliance across pocket money and petty cash — strong financial accountability.`);
  if (meets(bankAccountCoverage, 80))
    strengths.push(`${childrenWithBankAccounts} of ${total_children} children have bank accounts — good preparation for financial independence.`);
  if (meets(savingsEngagementRate, 70))
    strengths.push(`${engagedSaversCount} of ${total_children} children actively engaged with savings goals — strong savings culture.`);
  if (meets(financialLiteracyRate, 80) && childrenWithBankAccounts > 0)
    strengths.push(`${formatRate(financialLiteracyRate)} of children with bank accounts have had financial literacy assessed — proactive financial education.`);
  if (meets(charityAccessRate, 50))
    strengths.push(`${childrenWithApprovedGrants} of ${total_children} children have accessed charity grants — maximising additional financial support.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (below(pocketMoneyCoverage, 50))
    concerns.push(`Only ${formatRate(pocketMoneyCoverage)} of children receiving pocket money — children may not be receiving their financial entitlement.`);
  if (below(receiptComplianceRate, 60) && totalReceiptItems > 0)
    concerns.push(`Receipt compliance at ${formatRate(receiptComplianceRate)} — financial accountability gap across pocket money and petty cash records.`);
  if (below(bankAccountCoverage, 30))
    concerns.push(`Only ${formatRate(bankAccountCoverage)} of children have bank accounts — limited preparation for financial independence.`);
  if (below(savingsEngagementRate, 20))
    concerns.push(`Only ${formatRate(savingsEngagementRate)} of children engaged with savings — children are not being supported to develop savings habits.`);
  if (below(financialLiteracyRate, 30) && childrenWithBankAccounts > 0)
    concerns.push(`Only ${formatRate(financialLiteracyRate)} of children with bank accounts have had financial literacy assessed — financial education gaps.`);
  if (below(charityAccessRate, 10))
    concerns.push(`Only ${formatRate(charityAccessRate)} of children have accessed charity grants — potential funding opportunities being missed.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 1;

  if (below(pocketMoneyCoverage, 70)) {
    recs.push({
      rank: rank++,
      recommendation: "Ensure all children receive regular pocket money as a basic entitlement — record all payments with staff approval.",
      urgency: below(pocketMoneyCoverage, 50) ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 9",
    });
  }
  if (below(receiptComplianceRate, 80) && totalReceiptItems > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Improve receipt collection for all pocket money and petty cash transactions to maintain a complete audit trail.",
      urgency: below(receiptComplianceRate, 60) ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if (below(bankAccountCoverage, 50)) {
    recs.push({
      rank: rank++,
      recommendation: "Support all children to open age-appropriate bank accounts as part of independence preparation.",
      urgency: below(bankAccountCoverage, 30) ? "immediate" : "soon",
      regulatory_ref: "CHR 2015 Reg 9",
    });
  }
  if (below(savingsEngagementRate, 40)) {
    recs.push({
      rank: rank++,
      recommendation: "Introduce savings goals and encourage children to manage their own savings — consider matched savings schemes.",
      urgency: below(savingsEngagementRate, 20) ? "immediate" : "planned",
      regulatory_ref: "CHR 2015 Reg 9",
    });
  }
  if (below(financialLiteracyRate, 50) && childrenWithBankAccounts > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Conduct financial literacy assessments for all children with bank accounts to identify knowledge gaps.",
      urgency: below(financialLiteracyRate, 30) ? "soon" : "planned",
      regulatory_ref: "CHR 2015 Reg 9",
    });
  }
  if (below(charityAccessRate, 25)) {
    recs.push({
      rank: rank++,
      recommendation: "Research and apply for charity grants on behalf of children — involve them in the application process where appropriate.",
      urgency: below(charityAccessRate, 10) ? "soon" : "planned",
      regulatory_ref: null,
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  if (meets(pocketMoneyCoverage, 90) && meets(receiptComplianceRate, 95) && meets(savingsEngagementRate, 70)) {
    insights.push({
      text: `${formatRate(pocketMoneyCoverage)} pocket money coverage with ${formatRate(receiptComplianceRate)} receipt compliance and ${formatRate(savingsEngagementRate)} savings engagement. This evidences an outstanding approach to children's financial literacy — Ofsted will recognise this as strong independence preparation.`,
      severity: "positive",
    });
  }
  if (meets(bankAccountCoverage, 80) && meets(financialLiteracyRate, 80)) {
    insights.push({
      text: `${formatRate(bankAccountCoverage)} of children have bank accounts with ${formatRate(financialLiteracyRate)} having completed financial literacy assessment. Children are being actively prepared for financial independence.`,
      severity: "positive",
    });
  }
  if (meets(charityAccessRate, 50)) {
    insights.push({
      text: `${formatRate(charityAccessRate)} of children have accessed charity grants. The home is proactively securing additional financial support for young people.`,
      severity: "positive",
    });
  }
  if (below(pocketMoneyCoverage, 50)) {
    insights.push({
      text: `Only ${formatRate(pocketMoneyCoverage)} of children are receiving pocket money. Ofsted inspectors will ask how children learn to manage money. Without regular pocket money, the home cannot evidence that children are developing real financial skills.`,
      severity: "critical",
    });
  }
  if (below(receiptComplianceRate, 60) && totalReceiptItems > 0) {
    insights.push({
      text: `Receipt compliance at ${formatRate(receiptComplianceRate)} is significantly below acceptable standards. This represents a material financial governance gap that would be flagged under Reg 40.`,
      severity: "critical",
    });
  }
  if (below(bankAccountCoverage, 30)) {
    insights.push({
      text: `Only ${formatRate(bankAccountCoverage)} of children have bank accounts. This is a significant gap in independence preparation — Ofsted expects all children to be supported to understand banking and manage their own finances.`,
      severity: "warning",
    });
  }
  if (below(savingsEngagementRate, 20)) {
    insights.push({
      text: `Only ${formatRate(savingsEngagementRate)} of children are engaged with savings. Building a savings habit is a key life skill. Without active savings engagement, children are missing a critical aspect of financial literacy.`,
      severity: "warning",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding financial literacy — ${formatRate(pocketMoneyCoverage)} pocket money coverage, ${formatRate(receiptComplianceRate)} receipt compliance, and ${formatRate(savingsEngagementRate)} savings engagement.`;
  } else if (rating === "good") {
    headline = `Good financial management — children's money managed with ${formatRate(bankAccountCoverage)} bank account coverage and ${formatRate(savingsEngagementRate)} savings engagement.`;
  } else if (rating === "adequate") {
    headline = "Adequate financial literacy — gaps in pocket money coverage, savings engagement, or receipt compliance need addressing.";
  } else {
    headline = "Financial literacy is inadequate — significant gaps in money management, bank account access, or savings support require urgent action.";
  }

  return {
    financial_rating: rating,
    financial_score: score,
    headline,
    children_with_pocket_money: childrenWithPocketMoney,
    children_with_bank_accounts: childrenWithBankAccounts,
    receipt_compliance_rate: receiptComplianceRate,
    savings_engagement_rate: savingsEngagementRate,
    charity_access_rate: charityAccessRate,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
