// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FINANCIAL WELLBEING INTELLIGENCE ENGINE
// Home-level: analyses pocket money transactions and clothing allowance
// records to assess financial management, savings culture, receipt compliance,
// clothing provision, and equity across children.
// CHR 2015 Reg 7, Reg 8. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FinancialTransactionInput {
  child_id: string;
  date: string;
  type: string;              // allowance | spending | savings_deposit | savings_withdrawal | gift | earnings | refund
  amount: number;
  category: string;
  receipt_held: boolean;
  has_approval: boolean;
}

export interface ClothingAllowanceInput {
  child_id: string;
  annual_budget: number;
  ytd_spend: number;
  quarterly_allowance: number;
  quarter_spend: number;
  current_quarter: number;   // 1-4
}

export interface HomeFinancialInput {
  today: string;
  transactions: FinancialTransactionInput[];
  clothing_allowances: ClothingAllowanceInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FinancialRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AllowanceProfile {
  children_count: number;
  total_allowances_90d: number;
  regularity_rate: number | null;          // % children with >=8 allowance payments in 90d
  avg_weekly_per_child: number;
}

export interface SpendingProfile {
  total_spending_90d: number;
  receipt_rate: number | null;
  approval_rate: number | null;
  category_count: number;
  avg_per_child_90d: number;
}

export interface SavingsProfile {
  children_saving: number;
  savings_participation_rate: number | null;
  total_deposits_90d: number;
}

export interface ClothingProfile {
  children_tracked: number;
  avg_budget_utilization: number;
  over_pace_count: number;
  under_utilization_count: number;
}

export interface FinancialInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface FinancialRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeFinancialResult {
  financial_rating: FinancialRating;
  financial_score: number | null;
  headline: string;
  allowance_profile: AllowanceProfile;
  spending_profile: SpendingProfile;
  savings_profile: SavingsProfile;
  clothing_profile: ClothingProfile;
  strengths: string[];
  concerns: string[];
  recommendations: FinancialRecommendation[];
  insights: FinancialInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FinancialRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeFinancial(
  input: HomeFinancialInput,
): HomeFinancialResult {
  const { today, transactions, clothing_allowances } = input;

  // 90-day window for transactions
  const cutoff90d = new Date(today);
  cutoff90d.setDate(cutoff90d.getDate() - 90);
  const cutoff90dStr = cutoff90d.toISOString().slice(0, 10);
  const recent = transactions.filter(t => t.date >= cutoff90dStr && t.date <= today);

  // Insufficient data: 0 recent transactions AND 0 clothing allowances
  if (recent.length === 0 && clothing_allowances.length === 0) {
    return {
      financial_rating: "insufficient_data",
      financial_score: 0,
      headline: "No financial records found — pocket money and clothing allowance data not available.",
      allowance_profile: emptyAllowanceProfile(),
      spending_profile: emptySpendingProfile(),
      savings_profile: emptySavingsProfile(),
      clothing_profile: emptyClothingProfile(),
      strengths: [],
      concerns: ["No pocket money or clothing allowance records — Ofsted expects homes to manage children's finances transparently."],
      recommendations: [{ rank: 1, recommendation: "Implement a pocket money recording system with receipts, approvals, and savings tracking for all children.", urgency: "immediate", regulatory_ref: "Reg 7" }],
      insights: [{ text: "No financial wellbeing data found. Ofsted inspectors will ask about pocket money, savings, and clothing provision. Without records, the home cannot evidence responsible financial management or that children are learning money skills.", severity: "critical" }],
    };
  }

  // ── Unique Children ───────────────────────────────────────────────
  const allChildren = new Set([
    ...recent.map(t => t.child_id),
    ...clothing_allowances.map(c => c.child_id),
  ]);
  const childCount = allChildren.size;

  // ── Allowance Profile ─────────────────────────────────────────────
  const allowanceTxns = recent.filter(t => t.type === "allowance");
  const childAllowanceCounts = new Map<string, number>();
  const childAllowanceAmounts = new Map<string, number>();
  for (const t of allowanceTxns) {
    childAllowanceCounts.set(t.child_id, (childAllowanceCounts.get(t.child_id) ?? 0) + 1);
    childAllowanceAmounts.set(t.child_id, (childAllowanceAmounts.get(t.child_id) ?? 0) + t.amount);
  }
  const childrenReceiving = childAllowanceCounts.size;
  const regularChildren = [...childAllowanceCounts.values()].filter(c => c >= 8).length;
  const regularityRate = rate(regularChildren, childCount);
  const totalAllowances90d = allowanceTxns.reduce((a, t) => a + t.amount, 0);
  const weeksInWindow = 90 / 7;
  const avgWeeklyPerChild = childrenReceiving > 0
    ? Math.round((totalAllowances90d / childrenReceiving / weeksInWindow) * 100) / 100
    : null;

  const allowanceProfile: AllowanceProfile = {
    children_count: childrenReceiving,
    total_allowances_90d: totalAllowances90d,
    regularity_rate: regularityRate,
    avg_weekly_per_child: Math.round((avgWeeklyPerChild ?? 0) * 10) / 10,
  };

  // ── Spending Profile ──────────────────────────────────────────────
  const spendingTxns = recent.filter(t => t.type === "spending");
  const totalSpending = spendingTxns.reduce((a, t) => a + t.amount, 0);
  const receiptRate = rate(spendingTxns.filter(t => t.receipt_held).length, spendingTxns.length);
  const approvalRate = rate(recent.filter(t => t.has_approval).length, recent.length);
  const spendingCategories = new Set(spendingTxns.map(t => t.category));
  const spendingChildCount = new Set(spendingTxns.map(t => t.child_id)).size;
  const avgSpendPerChild = spendingChildCount > 0
    ? Math.round((totalSpending / spendingChildCount) * 100) / 100
    : null;

  const spendingProfile: SpendingProfile = {
    total_spending_90d: Math.round(totalSpending * 100) / 100,
    receipt_rate: receiptRate,
    approval_rate: approvalRate,
    category_count: spendingCategories.size,
    avg_per_child_90d: Math.round((avgSpendPerChild ?? 0) * 100) / 100,
  };

  // ── Savings Profile ───────────────────────────────────────────────
  const savingsDeposits = recent.filter(t => t.type === "savings_deposit");
  const childrenSaving = new Set(savingsDeposits.map(t => t.child_id)).size;
  const savingsParticipation = rate(childrenSaving, childCount);
  const totalDeposits = savingsDeposits.reduce((a, t) => a + t.amount, 0);

  const savingsProfile: SavingsProfile = {
    children_saving: childrenSaving,
    savings_participation_rate: savingsParticipation,
    total_deposits_90d: Math.round(totalDeposits * 100) / 100,
  };

  // ── Clothing Profile ──────────────────────────────────────────────
  let avgUtilization = 0;
  let overPace = 0;
  let underUtil = 0;
  if (clothing_allowances.length > 0) {
    for (const c of clothing_allowances) {
      const expectedSpend = c.annual_budget * (c.current_quarter / 4);
      const utilization = expectedSpend > 0 ? (c.ytd_spend / expectedSpend) * 100 : 0;
      avgUtilization += utilization;
      if (utilization > 110) overPace++;
      if (utilization < 30) underUtil++;
    }
    avgUtilization = Math.round(avgUtilization / clothing_allowances.length);
  }

  const clothingProfile: ClothingProfile = {
    children_tracked: clothing_allowances.length,
    avg_budget_utilization: avgUtilization,
    over_pace_count: overPace,
    under_utilization_count: underUtil,
  };

  // ── Scoring ───────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Allowance regularity (±5)
  if (allowanceTxns.length > 0) {
    if (meets(regularityRate, 80)) score += 5;
    else if (meets(regularityRate, 50)) score += 2;
    else score -= 3;
  } else if (recent.length > 0) {
    // Has other transactions but no allowances — children spending without recorded income
    score -= 3;
  } else {
    // Only clothing data, no pocket money transactions at all
    score -= 2;
  }

  // 2. Receipt compliance (±4)
  if (spendingTxns.length > 0) {
    if (meets(receiptRate, 80)) score += 4;
    else if (meets(receiptRate, 60)) score += 2;
    else score -= 3;
  } else {
    score += 1; // no spending to receipt
  }

  // 3. Approval documentation (±3)
  if (recent.length > 0) {
    if (meets(approvalRate, 90)) score += 3;
    else if (meets(approvalRate, 70)) score += 1;
    else score -= 2;
  }

  // 4. Savings engagement (±4)
  if (childCount > 0) {
    if (meets(savingsParticipation, 60)) score += 4;
    else if (meets(savingsParticipation, 30)) score += 2;
    else if (savingsDeposits.length > 0) score += 1;
    else score -= 2;
  }

  // 5. Spending diversity (±3)
  if (spendingCategories.size >= 4) score += 3;
  else if (spendingCategories.size >= 2) score += 1;
  else if (spendingTxns.length > 0) score -= 1;

  // 6. Clothing utilization (±3)
  if (clothing_allowances.length > 0) {
    if (avgUtilization >= 40 && avgUtilization <= 100) score += 3;
    else if (avgUtilization >= 25 && avgUtilization <= 110) score += 1;
    else score -= 2;
  }

  // 7. Budget pace compliance (±3)
  if (clothing_allowances.length > 0) {
    if (overPace === 0) score += 3;
    else if (overPace <= 1) score += 1;
    else score -= 2;
  }

  // 8. Equity (±3)
  if (childAllowanceAmounts.size >= 2) {
    const amounts = [...childAllowanceAmounts.values()];
    const maxAmt = Math.max(...amounts);
    const minAmt = Math.min(...amounts);
    const ratio = minAmt > 0 ? maxAmt / minAmt : 99;
    if (ratio <= 1.5) score += 3;
    else if (ratio <= 2.0) score += 1;
    else score -= 2;
  } else if (childAllowanceAmounts.size === 1) {
    score += 1; // single child, equity by default
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(regularityRate, 80) && childrenReceiving > 0) strengths.push(`${childrenReceiving} children receiving regular pocket money — consistent financial entitlement.`);
  if (meets(receiptRate, 80) && spendingTxns.length > 0) strengths.push(`${formatRate(receiptRate)} receipt compliance — transparent financial management.`);
  if (meets(savingsParticipation, 60)) strengths.push(`${childrenSaving} of ${childCount} children actively saving — strong financial literacy culture.`);
  if (meets(approvalRate, 90) && recent.length > 0) strengths.push(`${formatRate(approvalRate)} of transactions approved — robust financial governance.`);
  if (spendingCategories.size >= 4) strengths.push(`Spending across ${spendingCategories.size} categories — children accessing a range of activities and purchases.`);
  if (avgUtilization >= 40 && avgUtilization <= 100 && clothing_allowances.length > 0) strengths.push(`Clothing budget ${avgUtilization}% utilised — appropriate clothing provision for all children.`);
  if (overPace === 0 && clothing_allowances.length > 0) strengths.push("All children within clothing budget — responsible budget management.");

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (below(regularityRate, 50) && allowanceTxns.length > 0) concerns.push(`Only ${formatRate(regularityRate)} of children receiving regular pocket money — inconsistent allowance payments.`);
  if (allowanceTxns.length === 0 && recent.length > 0) concerns.push("No pocket money allowance records in 90 days — children may not be receiving their financial entitlement.");
  if (below(receiptRate, 60) && spendingTxns.length > 0) concerns.push(`Only ${formatRate(receiptRate)} of spending has receipts — financial accountability gap.`);
  if (savingsParticipation === 0 && childCount > 0 && recent.length > 0) concerns.push("No children have savings activity — opportunity to build financial independence skills.");
  if (overPace > 0) concerns.push(`${overPace} child${overPace > 1 ? "ren" : ""} exceeding clothing budget pace — overspending risk.`);
  if (underUtil > 0) concerns.push(`${underUtil} child${underUtil > 1 ? "ren" : ""} using less than 30% of clothing budget — may indicate unmet clothing needs.`);
  if (below(approvalRate, 70) && recent.length > 0) concerns.push(`Only ${formatRate(approvalRate)} of transactions have approval — financial governance weakness.`);

  // ── Recommendations ───────────────────────────────────────────────
  const recs: FinancialRecommendation[] = [];
  let rank = 1;

  if (allowanceTxns.length === 0 && recent.length > 0) {
    recs.push({ rank: rank++, recommendation: "Establish a regular pocket money payment schedule for all children — this is a basic entitlement.", urgency: "immediate", regulatory_ref: "Reg 7" });
  }
  if (below(receiptRate, 60) && spendingTxns.length > 0) {
    recs.push({ rank: rank++, recommendation: "Improve receipt collection for children's spending — maintain audit trail for financial transparency.", urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (below(savingsParticipation, 30) && childCount > 0 && recent.length > 0) {
    recs.push({ rank: rank++, recommendation: "Encourage all children to participate in savings — consider matched savings scheme or savings goals.", urgency: "planned", regulatory_ref: "Reg 7" });
  }
  if (overPace > 1) {
    recs.push({ rank: rank++, recommendation: "Review clothing budget monitoring — some children are overspending. Discuss budgeting with them as a learning opportunity.", urgency: "soon", regulatory_ref: "Reg 8" });
  }
  if (below(regularityRate, 50) && allowanceTxns.length > 0) {
    recs.push({ rank: rank++, recommendation: "Ensure all children receive pocket money on a consistent weekly schedule — record all payments.", urgency: "soon", regulatory_ref: "Reg 7" });
  }

  // ── Insights ──────────────────────────────────────────────────────
  const insights: FinancialInsight[] = [];

  if (meets(savingsParticipation, 60) && meets(receiptRate, 80) && meets(regularityRate, 80)) {
    insights.push({ text: `${formatRate(savingsParticipation)} savings participation with ${formatRate(receiptRate)} receipt compliance and regular allowances. This evidences an outstanding approach to financial wellbeing — children are learning real money management skills. Ofsted will see this as strong preparation for independence.`, severity: "positive" });
  }
  if (savingsParticipation === 0 && childCount > 0 && recent.length > 0) {
    insights.push({ text: "No children are currently saving. Financial literacy is a key independence skill — Ofsted inspectors may ask how children are being supported to manage money and save for their futures.", severity: "warning" });
  }
  if (below(receiptRate, 50) && spendingTxns.length >= 5) {
    insights.push({ text: `Only ${formatRate(receiptRate)} of spending transactions have receipts. Ofsted expects transparent financial management of children's money. Poor receipt compliance may raise governance concerns at inspection.`, severity: "warning" });
  }
  if (overPace > 0) {
    insights.push({ text: `${overPace} child${overPace > 1 ? "ren" : ""} spending above clothing budget pace. While this may reflect genuine need, Ofsted expects careful budgeting. This is also an opportunity to involve children in budgeting conversations.`, severity: "warning" });
  }
  if (childAllowanceAmounts.size >= 2) {
    const amounts = [...childAllowanceAmounts.values()];
    const maxAmt = Math.max(...amounts);
    const minAmt = Math.min(...amounts);
    const ratio = minAmt > 0 ? maxAmt / minAmt : 99;
    if (ratio > 2.0) {
      insights.push({ text: `Significant variation in pocket money amounts between children (ratio ${Math.round(ratio * 10) / 10}:1). While age-appropriate differences are reasonable, large disparities may raise fairness concerns. Ensure differences are documented and justified.`, severity: "warning" });
    }
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding financial wellbeing — regular allowances, ${formatRate(receiptRate)} receipt compliance, and ${formatRate(savingsParticipation)} savings participation.`;
  } else if (rating === "good") {
    headline = `Good financial management — children's money managed transparently with ${formatRate(savingsParticipation)} savings engagement.`;
  } else if (rating === "adequate") {
    headline = "Adequate financial wellbeing — gaps in receipt compliance, savings engagement, or allowance regularity need addressing.";
  } else {
    headline = "Financial wellbeing is inadequate — significant gaps in pocket money management, receipt compliance, or financial governance.";
  }

  return {
    financial_rating: rating,
    financial_score: score,
    headline,
    allowance_profile: allowanceProfile,
    spending_profile: spendingProfile,
    savings_profile: savingsProfile,
    clothing_profile: clothingProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptyAllowanceProfile(): AllowanceProfile {
  return { children_count: 0, total_allowances_90d: 0, regularity_rate: 0, avg_weekly_per_child: 0 };
}

function emptySpendingProfile(): SpendingProfile {
  return { total_spending_90d: 0, receipt_rate: 0, approval_rate: 0, category_count: 0, avg_per_child_90d: 0 };
}

function emptySavingsProfile(): SavingsProfile {
  return { children_saving: 0, savings_participation_rate: 0, total_deposits_90d: 0 };
}

function emptyClothingProfile(): ClothingProfile {
  return { children_tracked: 0, avg_budget_utilization: 0, over_pace_count: 0, under_utilization_count: 0 };
}
