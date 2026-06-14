// ══════════════════════════════════════════════════════════════════════════════
// CARA — FINANCIAL MANAGEMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses expenses to surface spend patterns, approval compliance, missing
// receipts, child-linked expenditure, and category distribution.
//
// Regulatory: Reg 40 (financial management — homes must demonstrate responsible
// and transparent financial management), SCCIF: "Is the home well led and
// managed?" and "Does the home provide good value?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | "petty_cash"
  | "young_person_activities"
  | "food_shopping"
  | "clothing"
  | "transport"
  | "maintenance"
  | "office_supplies"
  | "training"
  | "other";

export type ExpenseStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "paid";

export interface ExpenseInput {
  id: string;
  submitted_by: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  receipt_url: string | null;
  date: string;
  status: ExpenseStatus;
  approved_by: string | null;
  approved_at: string | null;
  linked_child_id: string | null;
  payment_method: string | null;
  created_at: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface FinancialManagementIntelligenceInput {
  expenses: ExpenseInput[];
  staff: StaffRef[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface FinancialOverview {
  total_expenses: number;
  total_spend: number;
  pending_approval: number;
  pending_approval_amount: number;
  approved_count: number;
  rejected_count: number;
  paid_count: number;
  draft_count: number;
  missing_receipts: number;
  child_linked_spend: number;       // total amount linked to a child
  child_linked_count: number;
  approval_rate: number;            // pct of submitted that are approved/paid
  avg_expense_amount: number;
  avg_approval_days: number;        // avg days from submitted to approved
}

export interface CategorySpend {
  category: ExpenseCategory;
  total_amount: number;
  count: number;
  pct_of_total: number;
  pending_count: number;
  missing_receipts: number;
}

export interface StaffSpend {
  staff_id: string;
  staff_name: string;
  total_amount: number;
  count: number;
  pending_count: number;
  missing_receipts: number;
}

export interface FinancialAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraFinancialInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface FinancialManagementIntelligenceResult {
  overview: FinancialOverview;
  category_spend: CategorySpend[];
  staff_spend: StaffSpend[];
  alerts: FinancialAlert[];
  insights: CaraFinancialInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeFinancialManagementIntelligence(
  input: FinancialManagementIntelligenceInput,
): FinancialManagementIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { expenses, staff } = input;

  const staffMap = new Map(staff.map((s) => [s.id, s.name]));

  // ── Status breakdowns ──────────────────────────────────────────────────
  const submitted = expenses.filter((e) => e.status === "submitted");
  const approved = expenses.filter((e) => e.status === "approved");
  const rejected = expenses.filter((e) => e.status === "rejected");
  const paid = expenses.filter((e) => e.status === "paid");
  const drafts = expenses.filter((e) => e.status === "draft");

  // ── Financial totals ──────────────────────────────────────────────────
  const totalSpend = round2(expenses.reduce((s, e) => s + e.amount, 0));
  const pendingAmount = round2(submitted.reduce((s, e) => s + e.amount, 0));
  const childLinked = expenses.filter((e) => e.linked_child_id !== null);
  const childLinkedSpend = round2(childLinked.reduce((s, e) => s + e.amount, 0));

  // Missing receipts (non-draft expenses without receipt_url)
  const nonDraft = expenses.filter((e) => e.status !== "draft");
  const missingReceipts = nonDraft.filter((e) => !e.receipt_url).length;

  // Approval rate: out of all submitted+approved+rejected+paid, what pct ended up approved or paid
  const decidedExpenses = [...approved, ...rejected, ...paid];
  const approvedOrPaid = [...approved, ...paid];
  const approvalRate =
    decidedExpenses.length > 0
      ? Math.round((approvedOrPaid.length / decidedExpenses.length) * 100)
      : 100;

  // Average expense amount
  const avgAmount = expenses.length > 0 ? round2(totalSpend / expenses.length) : 0;

  // Average approval turnaround
  const approvalDays = approvedOrPaid
    .filter((e) => e.approved_at && e.created_at)
    .map((e) => Math.max(0, daysBetween(e.created_at, e.approved_at!)));
  const avgApprovalDays = approvalDays.length > 0
    ? Math.round(average(approvalDays))
    : 0;

  const overview: FinancialOverview = {
    total_expenses: expenses.length,
    total_spend: totalSpend,
    pending_approval: submitted.length,
    pending_approval_amount: pendingAmount,
    approved_count: approved.length,
    rejected_count: rejected.length,
    paid_count: paid.length,
    draft_count: drafts.length,
    missing_receipts: missingReceipts,
    child_linked_spend: childLinkedSpend,
    child_linked_count: childLinked.length,
    approval_rate: approvalRate,
    avg_expense_amount: avgAmount,
    avg_approval_days: avgApprovalDays,
  };

  // ── Category spend analysis ────────────────────────────────────────────
  const catMap = new Map<ExpenseCategory, ExpenseInput[]>();
  for (const e of expenses) {
    const arr = catMap.get(e.category) ?? [];
    arr.push(e);
    catMap.set(e.category, arr);
  }

  const category_spend: CategorySpend[] = [...catMap.entries()]
    .map(([category, items]) => {
      const amount = round2(items.reduce((s, e) => s + e.amount, 0));
      return {
        category,
        total_amount: amount,
        count: items.length,
        pct_of_total: totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0,
        pending_count: items.filter((e) => e.status === "submitted").length,
        missing_receipts: items.filter((e) => e.status !== "draft" && !e.receipt_url).length,
      };
    })
    .sort((a, b) => b.total_amount - a.total_amount); // highest spend first

  // ── Staff spend analysis ───────────────────────────────────────────────
  const staffExpMap = new Map<string, ExpenseInput[]>();
  for (const e of expenses) {
    const arr = staffExpMap.get(e.submitted_by) ?? [];
    arr.push(e);
    staffExpMap.set(e.submitted_by, arr);
  }

  const staff_spend: StaffSpend[] = [...staffExpMap.entries()]
    .map(([staff_id, items]) => ({
      staff_id,
      staff_name: staffMap.get(staff_id) ?? staff_id,
      total_amount: round2(items.reduce((s, e) => s + e.amount, 0)),
      count: items.length,
      pending_count: items.filter((e) => e.status === "submitted").length,
      missing_receipts: items.filter((e) => e.status !== "draft" && !e.receipt_url).length,
    }))
    .sort((a, b) => b.total_amount - a.total_amount); // highest spender first

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: FinancialAlert[] = [];

  // Critical: expenses pending approval >7 days
  const oldPending = submitted.filter(
    (e) => daysBetween(e.created_at, today) > 7,
  );
  if (oldPending.length > 0) {
    const totalAmount = round2(oldPending.reduce((s, e) => s + e.amount, 0));
    alerts.push({
      severity: "critical",
      message: `${oldPending.length} expense(s) pending approval for more than 7 days (total: £${totalAmount.toFixed(2)}). Reg 40 requires transparent and timely financial management. Stale approvals indicate a governance gap.`,
    });
  }

  // High: missing receipts
  if (missingReceipts > 0) {
    alerts.push({
      severity: "high",
      message: `${missingReceipts} submitted expense(s) without receipts. All expenditure should have supporting documentation for audit purposes and Ofsted evidence files.`,
    });
  }

  // High: single expense > £150
  const highValue = expenses.filter((e) => e.amount > 150 && e.status !== "draft");
  if (highValue.length > 0) {
    const desc = highValue.map((e) => `${e.description} (£${e.amount.toFixed(2)})`).join(", ");
    alerts.push({
      severity: "high",
      message: `${highValue.length} high-value expense(s) over £150: ${desc}. High-value items should have documented authorisation and clear audit trails.`,
    });
  }

  // Medium: pending approval amount
  if (pendingAmount > 100) {
    alerts.push({
      severity: "medium",
      message: `£${pendingAmount.toFixed(2)} in expenses awaiting approval. Review and approve or reject promptly to maintain financial oversight.`,
    });
  }

  // Medium: draft expenses not submitted
  if (drafts.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${drafts.length} draft expense(s) not yet submitted. Remind staff to submit expenses promptly for manager review.`,
    });
  }

  // Low: category with no child-linked spend where expected
  const activitySpend = catMap.get("young_person_activities");
  if (!activitySpend || activitySpend.length === 0) {
    if (expenses.length > 0) {
      alerts.push({
        severity: "low",
        message: `No expenses recorded for young person activities. Ofsted expects evidence that children have access to leisure, hobbies, and enrichment activities. Record activity spending to evidence this.`,
      });
    }
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraFinancialInsight[] = [];

  // Critical: stale approvals
  if (oldPending.length > 0) {
    insights.push({
      severity: "critical",
      text: `${oldPending.length} expense(s) have been awaiting approval for more than 7 days. Timely financial management is a governance indicator under SCCIF. Inspectors expect to see that expenditure is authorised and monitored.`,
    });
  }

  // Warning: missing receipts
  if (missingReceipts > 0 && nonDraft.length > 0) {
    const pct = Math.round((missingReceipts / nonDraft.length) * 100);
    insights.push({
      severity: "warning",
      text: `${pct}% of expenses are missing receipts (${missingReceipts} of ${nonDraft.length}). Complete documentation supports transparent financial governance and protects the home during audit.`,
    });
  }

  // Warning: low approval rate
  if (approvalRate < 80 && decidedExpenses.length > 0) {
    insights.push({
      severity: "warning",
      text: `Expense approval rate is ${approvalRate}%. A high rejection rate may indicate unclear spending guidelines or insufficient pre-approval processes. Review spending policies with the team.`,
    });
  }

  // Positive: child-linked spending
  if (childLinked.length > 0 && totalSpend > 0) {
    const pct = Math.round((childLinkedSpend / totalSpend) * 100);
    insights.push({
      severity: "positive",
      text: `${pct}% of expenditure (£${childLinkedSpend.toFixed(2)}) is linked directly to children's care and activities. This demonstrates that the home invests in young people's experiences — a positive indicator under SCCIF.`,
    });
  }

  // Positive: all receipts present
  if (missingReceipts === 0 && nonDraft.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${nonDraft.length} submitted expenses have receipts attached. Complete financial documentation is a hallmark of strong governance under Reg 40.`,
    });
  }

  // Positive: fast approval turnaround
  if (avgApprovalDays <= 2 && approvalDays.length > 0) {
    insights.push({
      severity: "positive",
      text: `Average expense approval turnaround is ${avgApprovalDays} day(s). Prompt financial oversight demonstrates active management engagement.`,
    });
  }

  // Positive: no stale pending
  if (oldPending.length === 0 && submitted.length > 0) {
    insights.push({
      severity: "positive",
      text: `No expenses pending for more than 7 days. All submitted expenses are being reviewed within a reasonable timeframe — good financial governance.`,
    });
  }

  // Positive: diverse spending categories
  if (catMap.size >= 4) {
    insights.push({
      severity: "positive",
      text: `Spending covers ${catMap.size} categories including activities, essentials, and development. Balanced expenditure shows holistic care provision.`,
    });
  }

  return {
    overview,
    category_spend,
    staff_spend,
    alerts,
    insights,
  };
}
