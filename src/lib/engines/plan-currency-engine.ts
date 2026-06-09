// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLAN CURRENCY REGISTER ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// "Are the children's plans in date?" is one of the most common Ofsted findings
// and a direct Quality Standards / Reg 6 requirement — yet every plan type sits
// siloed on its own page. This engine scans the REVIEW DATE of every statutory
// child plan/assessment across every child and classifies each Overdue / Due-soon
// / Current / No-date, then builds a child × plan-type RAG matrix + an overdue
// list + rollups. One screen answers "which child has an out-of-date plan?".
//
// The route normalises each plan source into PlanRecordInput; this engine only
// classifies and aggregates. Status comes from the recorded review date.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input ─────────────────────────────────────────────────────────────────────

export interface PlanRecordInput {
  id: string;
  plan_type: string;        // human label, e.g. "Care plan"
  plan_type_key: string;    // stable key, e.g. "care_plan"
  child_id: string;
  child_name?: string;
  review_date?: string | null; // ISO YYYY-MM-DD
}

export interface PlanCurrencyInput {
  plans: PlanRecordInput[];
  // All current children + the plan-type columns, so the matrix shows gaps too.
  children: { id: string; name: string }[];
  plan_types: { key: string; label: string }[];
  due_soon_days?: number;   // default 30
  today?: string;
}

// ── Output ────────────────────────────────────────────────────────────────────

export type PlanStatus = "overdue" | "due_soon" | "current" | "no_date";
export type CellStatus = PlanStatus | "none"; // "none" = child has no plan of this type

export interface PlanCurrencyRecord extends PlanRecordInput {
  status: PlanStatus;
  days_to_review: number | null;   // negative = overdue; null = no date
}

export interface ChildRollup {
  child_id: string; child_name: string;
  total: number; overdue: number; due_soon: number; current: number; no_date: number;
  worst: CellStatus;
}
export interface PlanTypeRollup {
  plan_type: string; plan_type_key: string;
  total: number; overdue: number; due_soon: number; current: number; no_date: number;
}
export interface MatrixCell { plan_type_key: string; status: CellStatus; days_to_review: number | null }
export interface MatrixRow { child_id: string; child_name: string; cells: MatrixCell[] }

export interface PlanCurrencySummary {
  total: number; overdue: number; due_soon: number; current: number; no_date: number;
  currency_rate: number; // % of dated plans that are not overdue
}

export interface PlanCurrencyResult {
  summary: PlanCurrencySummary;
  by_child: ChildRollup[];
  by_plan_type: PlanTypeRollup[];
  overdue: PlanCurrencyRecord[]; // ranked most-overdue first
  matrix: MatrixRow[];
  plan_types: { key: string; label: string }[];
  headline: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((new Date(toISO).getTime() - new Date(fromISO).getTime()) / 86_400_000);
}

const STATUS_SEVERITY: Record<CellStatus, number> = { overdue: 0, no_date: 1, due_soon: 2, current: 3, none: 4 };

function classify(review_date: string | null | undefined, today: string, dueSoon: number): { status: PlanStatus; days: number | null } {
  if (!review_date) return { status: "no_date", days: null };
  const days = daysBetween(today, review_date);
  if (days < 0) return { status: "overdue", days };
  if (days <= dueSoon) return { status: "due_soon", days };
  return { status: "current", days };
}

// ── Main computation ──────────────────────────────────────────────────────────

export function computePlanCurrency(input: PlanCurrencyInput): PlanCurrencyResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const dueSoon = input.due_soon_days ?? 30;

  const records: PlanCurrencyRecord[] = input.plans.map((p) => {
    const { status, days } = classify(p.review_date, today, dueSoon);
    return { ...p, status, days_to_review: days };
  });

  const blank = () => ({ total: 0, overdue: 0, due_soon: 0, current: 0, no_date: 0 });
  const add = (acc: ReturnType<typeof blank>, st: PlanStatus) => { acc.total++; acc[st]++; };

  // Summary
  const sum = blank();
  records.forEach((r) => add(sum, r.status));
  const dated = sum.total - sum.no_date;
  const summary: PlanCurrencySummary = {
    ...sum,
    currency_rate: dated === 0 ? 0 : Math.round(((dated - sum.overdue) / dated) * 100),
  };

  // Per-plan-type rollup
  const byType = new Map<string, PlanTypeRollup>();
  for (const pt of input.plan_types) byType.set(pt.key, { plan_type: pt.label, plan_type_key: pt.key, ...blank() });
  for (const r of records) {
    const t = byType.get(r.plan_type_key);
    if (t) add(t as any, r.status);
  }
  const by_plan_type = [...byType.values()].sort((a, b) => b.overdue - a.overdue || b.due_soon - a.due_soon || a.plan_type.localeCompare(b.plan_type));

  // Per-child rollup + matrix
  const childRecs = new Map<string, PlanCurrencyRecord[]>();
  for (const r of records) {
    const list = childRecs.get(r.child_id) ?? [];
    list.push(r);
    childRecs.set(r.child_id, list);
  }

  const by_child: ChildRollup[] = [];
  const matrix: MatrixRow[] = [];
  for (const child of input.children) {
    const recs = childRecs.get(child.id) ?? [];
    const roll = blank();
    recs.forEach((r) => add(roll, r.status));
    // worst status the child holds (overdue > no_date > due_soon > current; none if no plans)
    let worst: CellStatus = recs.length === 0 ? "none" : "current";
    for (const r of recs) if (STATUS_SEVERITY[r.status] < STATUS_SEVERITY[worst]) worst = r.status;
    by_child.push({ child_id: child.id, child_name: child.name, ...roll, worst });

    // matrix row: one cell per plan-type (worst record of that type for this child, or "none")
    const cells: MatrixCell[] = input.plan_types.map((pt) => {
      const ofType = recs.filter((r) => r.plan_type_key === pt.key);
      if (ofType.length === 0) return { plan_type_key: pt.key, status: "none", days_to_review: null };
      const worstRec = ofType.reduce((a, b) => (STATUS_SEVERITY[b.status] < STATUS_SEVERITY[a.status] ? b : a));
      return { plan_type_key: pt.key, status: worstRec.status, days_to_review: worstRec.days_to_review };
    });
    matrix.push({ child_id: child.id, child_name: child.name, cells });
  }
  by_child.sort((a, b) => b.overdue - a.overdue || b.due_soon - a.due_soon || a.child_name.localeCompare(b.child_name));

  const overdue = records
    .filter((r) => r.status === "overdue")
    .sort((a, b) => (a.days_to_review ?? 0) - (b.days_to_review ?? 0)); // most overdue first

  return {
    summary, by_child, by_plan_type, overdue, matrix,
    plan_types: input.plan_types,
    headline: buildHeadline(summary),
  };
}

function buildHeadline(s: PlanCurrencySummary): string {
  if (s.total === 0) return "No child plans with review dates recorded yet.";
  if (s.overdue === 0 && s.due_soon === 0) return `All ${s.total} plans are in date — ${s.currency_rate}% currency.`;
  const parts: string[] = [];
  if (s.overdue > 0) parts.push(`${s.overdue} plan${s.overdue === 1 ? "" : "s"} overdue for review`);
  if (s.due_soon > 0) parts.push(`${s.due_soon} due within 30 days`);
  return `${parts.join(" — ")}. ${s.currency_rate}% of dated plans are in date.`;
}
