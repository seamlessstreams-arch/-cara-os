// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME EXPENSE GOVERNANCE INTELLIGENCE ENGINE
// Financial stewardship: expense approval, receipt compliance, oversight.
// CHR 2015 Reg 36. SCCIF: "The arrangements for the financial management."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ExpenseInput {
  id: string;
  submitted_by: string;
  category: string;
  amount: number;
  has_receipt: boolean;
  date: string;                    // YYYY-MM-DD
  status: string;                  // draft | submitted | approved | paid | rejected
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;              // YYYY-MM-DD
  linked_child_id: string | null;
  payment_method: string;
}

export interface HomeExpenseGovernanceInput {
  today: string;
  expenses: ExpenseInput[];
  total_staff: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ExpenseGovernanceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface VolumeProfile {
  total_expenses: number;
  total_amount: number;
  avg_amount: number;
  draft_count: number;
  submitted_count: number;
  approved_count: number;
  paid_count: number;
  rejected_count: number;
}

export interface ApprovalProfile {
  avg_approval_days: number | null;
  fastest_approval_days: number | null;
  slowest_approval_days: number | null;
  pending_count: number;
  pending_amount: number;
  unique_approvers: number;
}

export interface ComplianceProfile {
  receipt_rate: number | null;
  child_linked_rate: number | null;
  child_linked_amount: number;
  personal_card_rate: number | null;
  house_card_rate: number | null;
  petty_cash_rate: number | null;
  mileage_rate: number | null;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  total_amount: number;
}

export interface Recommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string | null;
}

export interface Insight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HomeExpenseGovernanceResult {
  expense_score: number | null;
  expense_rating: ExpenseGovernanceRating;
  headline: string;
  volume: VolumeProfile;
  approval: ApprovalProfile;
  compliance: ComplianceProfile;
  distribution: CategoryDistribution[];
  strengths: string[];
  concerns: string[];
  recommendations: Recommendation[];
  insights: Insight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ── Core Engine ─────────────────────────────────────────────────────────────

export function computeHomeExpenseGovernance(
  input: HomeExpenseGovernanceInput,
): HomeExpenseGovernanceResult {
  const { expenses, total_staff } = input;

  // ── Insufficient data ─────────────────────────────────────────────────
  if (total_staff === 0 || expenses.length === 0) {
    return {
      expense_score: 0,
      expense_rating: "insufficient_data",
      headline: "No expense data available for analysis.",
      volume: {
        total_expenses: 0, total_amount: 0, avg_amount: 0,
        draft_count: 0, submitted_count: 0, approved_count: 0,
        paid_count: 0, rejected_count: 0,
      },
      approval: {
        avg_approval_days: 0, fastest_approval_days: 0,
        slowest_approval_days: 0, pending_count: 0,
        pending_amount: 0, unique_approvers: 0,
      },
      compliance: {
        receipt_rate: null, child_linked_rate: null, child_linked_amount: 0,
        personal_card_rate: null, house_card_rate: null,
        petty_cash_rate: null, mileage_rate: null,
      },
      distribution: [],
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Volume Profile ────────────────────────────────────────────────────
  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const drafts = expenses.filter((e) => e.status === "draft");
  const submitted = expenses.filter((e) => e.status === "submitted");
  const approved = expenses.filter((e) => e.status === "approved");
  const paid = expenses.filter((e) => e.status === "paid");
  const rejected = expenses.filter((e) => e.status === "rejected");

  const volume: VolumeProfile = {
    total_expenses: expenses.length,
    total_amount: Math.round(totalAmount * 100) / 100,
    avg_amount: Math.round((totalAmount / expenses.length) * 100) / 100,
    draft_count: drafts.length,
    submitted_count: submitted.length,
    approved_count: approved.length,
    paid_count: paid.length,
    rejected_count: rejected.length,
  };

  // ── Approval Profile ──────────────────────────────────────────────────
  const approvedOrPaid = expenses.filter(
    (e) => (e.status === "approved" || e.status === "paid") && e.approved_at,
  );
  const approvalDays = approvedOrPaid.map((e) =>
    daysBetween(e.created_at, e.approved_at!),
  );
  const avgApprovalDays =
    approvalDays.length > 0
      ? Math.round((approvalDays.reduce((s, d) => s + d, 0) / approvalDays.length) * 10) / 10
      : null;
  const fastest = approvalDays.length > 0 ? Math.min(...approvalDays) : null;
  const slowest = approvalDays.length > 0 ? Math.max(...approvalDays) : null;

  const pending = submitted; // "submitted" means awaiting approval
  const pendingAmount = pending.reduce((s, e) => s + e.amount, 0);
  const uniqueApprovers = new Set(
    approvedOrPaid.map((e) => e.approved_by).filter(Boolean),
  ).size;

  const approval: ApprovalProfile = {
    avg_approval_days: avgApprovalDays,
    fastest_approval_days: fastest,
    slowest_approval_days: slowest,
    pending_count: pending.length,
    pending_amount: Math.round(pendingAmount * 100) / 100,
    unique_approvers: uniqueApprovers,
  };

  // ── Compliance Profile ────────────────────────────────────────────────
  const nonDraft = expenses.filter((e) => e.status !== "draft");
  const withReceipt = nonDraft.filter((e) => e.has_receipt);
  const receiptRate = pct(withReceipt.length, nonDraft.length);

  const childLinked = expenses.filter((e) => e.linked_child_id !== null);
  const childLinkedRate = pct(childLinked.length, expenses.length);
  const childLinkedAmount = childLinked.reduce((s, e) => s + e.amount, 0);

  const personalCard = expenses.filter((e) => e.payment_method === "personal card");
  const houseCard = expenses.filter((e) => e.payment_method === "house card");
  const pettyCash = expenses.filter((e) => e.payment_method === "petty cash");
  const mileage = expenses.filter((e) => e.payment_method === "mileage");

  const compliance: ComplianceProfile = {
    receipt_rate: receiptRate,
    child_linked_rate: childLinkedRate,
    child_linked_amount: Math.round(childLinkedAmount * 100) / 100,
    personal_card_rate: pct(personalCard.length, expenses.length),
    house_card_rate: pct(houseCard.length, expenses.length),
    petty_cash_rate: pct(pettyCash.length, expenses.length),
    mileage_rate: pct(mileage.length, expenses.length),
  };

  // ── Category Distribution ─────────────────────────────────────────────
  const catMap = new Map<string, { count: number; amount: number }>();
  for (const e of expenses) {
    const existing = catMap.get(e.category) ?? { count: 0, amount: 0 };
    existing.count += 1;
    existing.amount += e.amount;
    catMap.set(e.category, existing);
  }
  const distribution: CategoryDistribution[] = [...catMap.entries()]
    .map(([category, v]) => ({
      category,
      count: v.count,
      total_amount: Math.round(v.amount * 100) / 100,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Approval turnaround (±4)
  // Fast = ≤2 days, moderate = ≤5, slow = ≤10, very slow > 10
  if (approvalDays.length > 0) {
    if ((avgApprovalDays ?? 0) <= 2) score += 4;
    else if ((avgApprovalDays ?? 0) <= 5) score += 2;
    else if ((avgApprovalDays ?? 0) <= 10) score += 0;
    else score -= 3;
  }
  // No approved = neutral (0)

  // Modifier 2: Receipt compliance (±5)
  if (nonDraft.length > 0) {
    if (receiptRate >= 90) score += 5;
    else if (receiptRate >= 75) score += 3;
    else if (receiptRate >= 50) score += 0;
    else score -= 4;
  }
  // No non-draft = neutral (0)

  // Modifier 3: Pending backlog (±3)
  const pendingRate = pct(pending.length, expenses.length);
  if (pendingRate === 0) score += 3;
  else if (pendingRate <= 20) score += 1;
  else if (pendingRate <= 40) score += 0;
  else score -= 3;

  // Modifier 4: Category diversity (±3)
  const uniqueCategories = catMap.size;
  if (uniqueCategories >= 4) score += 3;
  else if (uniqueCategories >= 3) score += 1;
  else if (uniqueCategories >= 2) score += 0;
  else score -= 2;

  // Modifier 5: Child benefit rate (±4)
  if (childLinkedRate >= 40) score += 4;
  else if (childLinkedRate >= 25) score += 2;
  else if (childLinkedRate >= 10) score += 0;
  else score -= 3;

  // Modifier 6: Payment method governance (±3)
  // Good governance = mix of house card + petty cash (controlled) not all personal
  const controlledRate = pct(houseCard.length + pettyCash.length, expenses.length);
  if (controlledRate >= 50) score += 3;
  else if (controlledRate >= 30) score += 1;
  else if (controlledRate >= 15) score += 0;
  else score -= 2;

  // Modifier 7: Draft discipline (±3)
  const draftRate = pct(drafts.length, expenses.length);
  if (draftRate === 0) score += 3;
  else if (draftRate <= 10) score += 1;
  else if (draftRate <= 25) score += 0;
  else score -= 2;

  // Modifier 8: Manager oversight (±3)
  if (uniqueApprovers >= 2) score += 3;
  else if (uniqueApprovers === 1) score += 1;
  else score -= 2;

  score = clamp(score, 0, 100);

  // ── Rating ────────────────────────────────────────────────────────────
  let expense_rating: ExpenseGovernanceRating;
  if (score >= 80) expense_rating = "outstanding";
  else if (score >= 65) expense_rating = "good";
  else if (score >= 45) expense_rating = "adequate";
  else expense_rating = "inadequate";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if ((avgApprovalDays ?? 0) <= 2 && approvalDays.length > 0)
    strengths.push(`Expenses approved within ${avgApprovalDays} days on average — excellent turnaround.`);
  if (receiptRate >= 90 && nonDraft.length > 0)
    strengths.push(`${receiptRate}% receipt compliance across submitted expenses.`);
  if (childLinkedRate >= 40)
    strengths.push(`${childLinkedRate}% of expenses directly linked to children — strong child-benefit focus.`);
  if (uniqueApprovers >= 2)
    strengths.push(`${uniqueApprovers} different managers approving expenses — good oversight distribution.`);
  if (uniqueCategories >= 4)
    strengths.push(`Spending across ${uniqueCategories} categories — healthy operational diversity.`);
  if (pendingRate === 0)
    strengths.push("No pending expenses awaiting approval — fully up to date.");
  if (draftRate === 0)
    strengths.push("No draft expenses sitting unsubmitted — good claim discipline.");
  if (controlledRate >= 50)
    strengths.push(`${controlledRate}% of claims via house card or petty cash — proper controlled spending channels.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (receiptRate < 50 && nonDraft.length > 0)
    concerns.push(`Only ${receiptRate}% of submitted expenses have receipts — audit risk under Reg 36.`);
  if ((avgApprovalDays ?? 0) > 10 && approvalDays.length > 0)
    concerns.push(`Average approval turnaround is ${avgApprovalDays} days — staff reimbursement significantly delayed.`);
  if (pendingRate > 40)
    concerns.push(`${pending.length} expenses (${pendingRate}% of total) pending approval — backlog needs attention.`);
  if (uniqueApprovers === 0 && approvedOrPaid.length === 0 && submitted.length > 0)
    concerns.push("No expenses have been approved — management oversight gap.");
  if (draftRate > 25)
    concerns.push(`${drafts.length} draft expenses not yet submitted — potential unreported spending.`);
  if (childLinkedRate === 0)
    concerns.push("No expenses linked to individual children — missing child-benefit tracking.");
  if (controlledRate < 15)
    concerns.push("Very few expenses via controlled channels (house card/petty cash) — financial controls may be weak.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 1;
  if (receiptRate < 75 && nonDraft.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: "Implement mandatory receipt upload before expense submission to strengthen financial audit trail.",
      urgency: receiptRate < 50 ? "immediate" : "soon",
      regulatory_ref: "Reg 36",
    });
  if (pendingRate > 20)
    recommendations.push({
      rank: rank++,
      recommendation: `Clear the ${pending.length} pending expenses — establish a 48-hour approval target for all claims.`,
      urgency: pendingRate > 40 ? "immediate" : "soon",
      regulatory_ref: "Reg 36",
    });
  if (uniqueApprovers < 2 && approvedOrPaid.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: "Ensure more than one manager is approving expenses to provide proper financial segregation of duties.",
      urgency: "soon",
      regulatory_ref: "Reg 36",
    });
  if (draftRate > 10)
    recommendations.push({
      rank: rank++,
      recommendation: "Follow up on draft expenses — set a weekly reminder for staff to submit or discard stale drafts.",
      urgency: "planned",
      regulatory_ref: null,
    });
  if (childLinkedRate < 25)
    recommendations.push({
      rank: rank++,
      recommendation: "Encourage staff to link child-related expenses to individual profiles for improved benefit-tracking and Reg 44 reporting.",
      urgency: "planned",
      regulatory_ref: "Reg 44",
    });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];
  if (receiptRate < 50 && nonDraft.length > 0)
    insights.push({
      text: `Receipt compliance at ${receiptRate}% is significantly below the 90% audit threshold. This represents a material financial governance gap that would be flagged in any Reg 36 audit.`,
      severity: "critical",
    });
  if (pendingAmount > 200)
    insights.push({
      text: `£${pendingAmount.toFixed(2)} in pending expenses awaiting approval. Delayed reimbursement can affect staff morale and indicates management oversight lag.`,
      severity: "warning",
    });
  if (childLinkedRate >= 40 && childLinkedAmount > 0)
    insights.push({
      text: `£${childLinkedAmount.toFixed(2)} in expenses directly benefit individual children (${childLinkedRate}% of claims). This demonstrates the home is actively investing in young people's experiences.`,
      severity: "positive",
    });
  if ((avgApprovalDays ?? 0) <= 2 && approvalDays.length >= 2)
    insights.push({
      text: `Approval turnaround averages ${avgApprovalDays} days — well within best practice of 48 hours. This supports prompt staff reimbursement and financial confidence.`,
      severity: "positive",
    });
  if (uniqueCategories >= 4)
    insights.push({
      text: `Expenses span ${uniqueCategories} categories including child activities, food, and training. This spending profile suggests a well-resourced operational environment.`,
      severity: "positive",
    });

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (expense_rating === "outstanding")
    headline = `Strong financial governance: ${volume.total_expenses} expenses tracked with ${receiptRate}% receipt compliance and ${avgApprovalDays}-day average approval.`;
  else if (expense_rating === "good")
    headline = `Good financial management: ${volume.total_expenses} expenses processed with ${receiptRate}% receipt rate. Minor improvements available.`;
  else if (expense_rating === "adequate")
    headline = `Adequate expense governance: ${volume.total_expenses} claims tracked but ${concerns.length > 0 ? concerns.length + " areas need attention" : "some improvements needed"}.`;
  else
    headline = `Financial governance requires improvement: ${concerns.length} concerns identified across expense management.`;

  return {
    expense_score: score,
    expense_rating,
    headline,
    volume,
    approval,
    compliance,
    distribution,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
