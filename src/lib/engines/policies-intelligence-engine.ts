// ══════════════════════════════════════════════════════════════════════════════
// CARA — POLICIES REGISTER INTELLIGENCE ENGINE
// Pure deterministic engine for policy register coverage analysis.
// Analyses review compliance, staff acknowledgement rates, category coverage,
// and generates Cara intelligence insights.
// Reg 38: policies and procedures — Reg 13: leadership and management
// CHR 2015: documented policies for all key operational areas
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PolicyInput {
  id: string;
  title: string;
  category: string;
  status: string; // "current" | "due_review" | "overdue" | "draft" | "archived"
  owner_id: string;
  next_review_date: string;
  last_reviewed: string | null;
  acknowledgement_count: number;
  total_staff_required: number;
  statutory_basis: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface PoliciesOverview {
  total_policies: number;
  active_policies: number;
  overdue_reviews: number;
  due_within_30_days: number;
  acknowledgement_rate: number;
  draft_count: number;
  categories_covered: number;
  total_categories_required: number;
}

export interface PolicyCategoryBreakdown {
  category: string;
  category_label: string;
  count: number;
  overdue_count: number;
  has_coverage: boolean;
}

export interface OverduePolicy {
  policy_id: string;
  title: string;
  category: string;
  days_overdue: number;
  owner_name: string;
}

export interface PoliciesAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraPoliciesInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface PoliciesIntelligenceResult {
  overview: PoliciesOverview;
  category_breakdown: PolicyCategoryBreakdown[];
  overdue_policies: OverduePolicy[];
  alerts: PoliciesAlert[];
  insights: CaraPoliciesInsight[];
}

// ── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  safeguarding: "Safeguarding",
  care_practice: "Care Practice",
  health_safety: "Health & Safety",
  workforce: "Workforce",
  behaviour: "Behaviour Support",
  complaints: "Complaints",
  data_protection: "Data Protection",
  admissions: "Admissions",
  missing_persons: "Missing Persons",
  medication: "Medication",
  fire_safety: "Fire Safety",
  lone_working: "Lone Working",
  whistleblowing: "Whistleblowing",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);
const TOTAL_CATEGORIES_REQUIRED = ALL_CATEGORIES.length; // 13

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const msA = Date.UTC(
    parseInt(a.slice(0, 4), 10),
    parseInt(a.slice(5, 7), 10) - 1,
    parseInt(a.slice(8, 10), 10),
  );
  const msB = Date.UTC(
    parseInt(b.slice(0, 4), 10),
    parseInt(b.slice(5, 7), 10) - 1,
    parseInt(b.slice(8, 10), 10),
  );
  return Math.floor((msB - msA) / 86_400_000);
}

function addDays(date: string, days: number): string {
  const d = new Date(
    Date.UTC(
      parseInt(date.slice(0, 4), 10),
      parseInt(date.slice(5, 7), 10) - 1,
      parseInt(date.slice(8, 10), 10),
    ),
  );
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function labelFor(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

// ── Engine ───────────────────────────────────────────────────────────────────

export function computePoliciesIntelligence(input: {
  policies: PolicyInput[];
  staff: StaffRef[];
  today?: string;
}): PoliciesIntelligenceResult {
  const { policies, staff, today: todayOverride } = input;
  const today = todayOverride ?? new Date().toISOString().slice(0, 10);

  // ── Overview calculations ───────────────────────────────────────────────

  const activePolicies = policies.filter(
    (p) => p.status === "current" || p.status === "due_review",
  );
  const overduePolicies = policies.filter((p) => p.status === "overdue");
  const draftPolicies = policies.filter((p) => p.status === "draft");

  const todayPlus30 = addDays(today, 30);
  const dueWithin30 = policies.filter((p) => {
    if (p.status === "overdue" || p.status === "archived" || p.status === "draft") return false;
    return p.next_review_date >= today && p.next_review_date <= todayPlus30;
  });

  // Acknowledgement rate across active (non-archived, non-draft) policies
  const ackPolicies = policies.filter(
    (p) => p.status !== "archived" && p.status !== "draft",
  );
  let totalAck = 0;
  let totalRequired = 0;
  for (const p of ackPolicies) {
    totalAck += p.acknowledgement_count;
    totalRequired += p.total_staff_required;
  }
  const acknowledgementRate = totalRequired > 0 ? round1((totalAck / totalRequired) * 100) : 0;

  // Categories covered: unique categories with at least one active policy
  const coveredCategories = new Set<string>();
  for (const p of activePolicies) {
    coveredCategories.add(p.category);
  }

  const overview: PoliciesOverview = {
    total_policies: policies.length,
    active_policies: activePolicies.length,
    overdue_reviews: overduePolicies.length,
    due_within_30_days: dueWithin30.length,
    acknowledgement_rate: acknowledgementRate,
    draft_count: draftPolicies.length,
    categories_covered: coveredCategories.size,
    total_categories_required: TOTAL_CATEGORIES_REQUIRED,
  };

  // ── Category breakdown ──────────────────────────────────────────────────

  const categoryBreakdown: PolicyCategoryBreakdown[] = ALL_CATEGORIES.map((cat) => {
    const catPolicies = policies.filter((p) => p.category === cat);
    const catActive = catPolicies.filter(
      (p) => p.status === "current" || p.status === "due_review",
    );
    const catOverdue = catPolicies.filter((p) => p.status === "overdue");
    return {
      category: cat,
      category_label: labelFor(cat),
      count: catPolicies.length,
      overdue_count: catOverdue.length,
      has_coverage: catActive.length > 0,
    };
  });

  // ── Overdue policies ────────────────────────────────────────────────────

  const staffMap = new Map<string, string>();
  for (const s of staff) {
    staffMap.set(s.id, s.name);
  }

  const overduePolicyList: OverduePolicy[] = overduePolicies
    .map((p) => ({
      policy_id: p.id,
      title: p.title,
      category: p.category,
      days_overdue: daysBetween(p.next_review_date, today),
      owner_name: staffMap.get(p.owner_id) ?? "Unknown",
    }))
    .sort((a, b) => b.days_overdue - a.days_overdue);

  // ── Alerts ──────────────────────────────────────────────────────────────

  const alerts: PoliciesAlert[] = [];

  // Critical: missing required category coverage
  for (const cat of ALL_CATEGORIES) {
    const bd = categoryBreakdown.find((c) => c.category === cat)!;
    if (!bd.has_coverage) {
      alerts.push({
        severity: "critical",
        message: `Required policy area '${labelFor(cat)}' has no active policy`,
      });
    }
  }

  // High: policy overdue > 30 days
  for (const op of overduePolicyList) {
    if (op.days_overdue > 30) {
      alerts.push({
        severity: "high",
        message: `'${op.title}' policy review is ${op.days_overdue} days overdue`,
      });
    }
  }

  // Medium: low acknowledgement rate
  if (acknowledgementRate < 90 && ackPolicies.length > 0) {
    alerts.push({
      severity: "medium",
      message: `Staff policy acknowledgement rate at ${acknowledgementRate}% — target 100%`,
    });
  }

  // Medium: policy overdue <= 30 days
  for (const op of overduePolicyList) {
    if (op.days_overdue <= 30) {
      alerts.push({
        severity: "medium",
        message: `'${op.title}' policy review is ${op.days_overdue} days overdue`,
      });
    }
  }

  // Low: many reviews due within 30 days
  if (dueWithin30.length > 2) {
    alerts.push({
      severity: "low",
      message: `${dueWithin30.length} policy reviews due within 30 days — schedule ahead`,
    });
  }

  // ── Insights ────────────────────────────────────────────────────────────

  const insights: CaraPoliciesInsight[] = [];

  // Critical: missing required categories
  const missingCategories = ALL_CATEGORIES.filter(
    (cat) => !coveredCategories.has(cat),
  );
  if (missingCategories.length > 0) {
    const labels = missingCategories.map(labelFor).join(", ");
    insights.push({
      severity: "critical",
      text:
        missingCategories.length === 1
          ? `Required policy area missing: ${labels}. CHR 2015 requires documented policies for all key operational areas.`
          : `${missingCategories.length} required policy areas missing: ${labels}. CHR 2015 requires documented policies for all key operational areas.`,
    });
  }

  // Warning: overdue reviews
  if (overduePolicies.length > 0) {
    insights.push({
      severity: "warning",
      text:
        overduePolicies.length === 1
          ? `1 policy review is overdue. Reg 38 requires policies to be kept under regular review.`
          : `${overduePolicies.length} policy reviews are overdue. Reg 38 requires policies to be kept under regular review.`,
    });
  }

  // Warning: low acknowledgement rate
  if (acknowledgementRate < 90 && ackPolicies.length > 0) {
    insights.push({
      severity: "warning",
      text: `Staff policy acknowledgement rate is ${acknowledgementRate}%. All staff must read and acknowledge current policies to demonstrate competence under Reg 13.`,
    });
  }

  // Warning: multiple upcoming reviews
  if (dueWithin30.length > 2) {
    insights.push({
      severity: "warning",
      text: `${dueWithin30.length} policy reviews due within the next 30 days. Consider staggering review dates to manage workload.`,
    });
  }

  // Positive: all categories covered
  if (missingCategories.length === 0 && policies.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${TOTAL_CATEGORIES_REQUIRED} required policy areas have active coverage. Full compliance with CHR 2015 documented policy requirements.`,
    });
  }

  // Positive: high acknowledgement
  if (acknowledgementRate >= 95 && ackPolicies.length > 0) {
    insights.push({
      severity: "positive",
      text: `Staff policy acknowledgement rate is ${acknowledgementRate}%. Strong evidence of workforce policy awareness under Reg 13.`,
    });
  }

  // Positive: no overdue reviews
  if (overduePolicies.length === 0 && policies.length > 0) {
    insights.push({
      severity: "positive",
      text: "No overdue policy reviews. All policies are within their review schedule under Reg 38.",
    });
  }

  // Positive: all policies current
  const allCurrent =
    policies.length > 0 &&
    policies.every((p) => p.status === "current" || p.status === "archived");
  if (allCurrent && policies.filter((p) => p.status !== "archived").length > 0) {
    insights.push({
      severity: "positive",
      text: "All active policies have current status. Excellent policy governance under Reg 38.",
    });
  }

  return {
    overview,
    category_breakdown: categoryBreakdown,
    overdue_policies: overduePolicyList,
    alerts,
    insights,
  };
}
