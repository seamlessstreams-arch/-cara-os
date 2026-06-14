// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DISCIPLINARY INTELLIGENCE ENGINE
// Pure deterministic engine for staff disciplinary case analysis.
// Analyses active cases, investigation timelines, outcome distribution,
// patterns by category, staff support measures, and LADO referrals.
// Reg 33: fitness of staff — Reg 34: employment of staff
// Reg 21: supervision of staff (Schedule 4)
// SCCIF Leadership & Management: robust HR processes
// ══════════════════════════════════════════════════════════════════════════════

export interface DisciplinaryInput {
  id: string;
  staff_id: string;
  date_raised: string;
  category: string;
  severity: string;
  status: string;
  investigating_officer: string;
  outcome: string;
  date_concluded: string | null;
  days_to_resolution: number | null;
  lado_referral: boolean;
  suspension: boolean;
  support_offered: string[];
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface DisciplinaryOverview {
  total_cases: number;
  open_cases: number;
  concluded_cases: number;
  avg_days_to_resolution: number;
  lado_referrals: number;
  suspensions_active: number;
  cases_last_90_days: number;
  support_offered_rate: number;
}

export interface DisciplinaryCategoryBreakdown {
  category: string;
  category_label: string;
  count: number;
  open_count: number;
}

export interface OpenDisciplinaryCase {
  case_id: string;
  staff_name: string;
  category: string;
  category_label: string;
  severity: string;
  status: string;
  days_open: number;
  lado_referral: boolean;
  suspension: boolean;
}

export interface OutcomeDistribution {
  outcome: string;
  outcome_label: string;
  count: number;
}

export interface DisciplinaryAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraDisciplinaryInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface StaffDisciplinaryIntelligenceResult {
  overview: DisciplinaryOverview;
  category_breakdown: DisciplinaryCategoryBreakdown[];
  open_cases: OpenDisciplinaryCase[];
  outcome_distribution: OutcomeDistribution[];
  alerts: DisciplinaryAlert[];
  insights: CaraDisciplinaryInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

const CATEGORY_LABELS: Record<string, string> = {
  conduct: "Conduct",
  capability: "Capability",
  attendance: "Attendance",
  breach_of_policy: "Breach of Policy",
  safeguarding: "Safeguarding",
  gross_misconduct: "Gross Misconduct",
};

const OUTCOME_LABELS: Record<string, string> = {
  pending: "Pending",
  no_action: "No Action",
  management_advice: "Management Advice",
  verbal_warning: "Verbal Warning",
  written_warning: "Written Warning",
  final_warning: "Final Warning",
  dismissal: "Dismissal",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function outcomeLabel(outcome: string): string {
  return OUTCOME_LABELS[outcome] ?? outcome.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isOpen(c: DisciplinaryInput): boolean {
  return c.status !== "concluded";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeStaffDisciplinaryIntelligence(input: {
  cases: DisciplinaryInput[];
  staff: StaffRef[];
  today?: string;
}): StaffDisciplinaryIntelligenceResult {
  const { cases, staff, today = new Date().toISOString().slice(0, 10) } = input;

  if (cases.length === 0) {
    return {
      overview: {
        total_cases: 0,
        open_cases: 0,
        concluded_cases: 0,
        avg_days_to_resolution: 0,
        lado_referrals: 0,
        suspensions_active: 0,
        cases_last_90_days: 0,
        support_offered_rate: 0,
      },
      category_breakdown: [],
      open_cases: [],
      outcome_distribution: [],
      alerts: [],
      insights: [],
    };
  }

  const openCases = cases.filter(isOpen);
  const concludedCases = cases.filter((c) => !isOpen(c));

  // ── Overview ────────────────────────────────────────────────────────────

  const resolvedWithDays = concludedCases.filter((c) => c.days_to_resolution !== null && c.days_to_resolution > 0);
  const avgDaysToResolution =
    resolvedWithDays.length > 0
      ? Math.round(resolvedWithDays.reduce((sum, c) => sum + (c.days_to_resolution ?? 0), 0) / resolvedWithDays.length)
      : 0;

  const ladoReferrals = cases.filter((c) => c.lado_referral).length;
  const suspensionsActive = openCases.filter((c) => c.suspension).length;

  const ninetyDaysAgo = new Date(today + "T00:00:00Z");
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);
  const casesLast90Days = cases.filter((c) => c.date_raised >= ninetyDaysAgoStr).length;

  const formalCases = cases.filter(
    (c) => c.severity !== "informal"
  );
  const formalWithSupport = formalCases.filter((c) => c.support_offered.length > 0);
  const supportOfferedRate =
    formalCases.length > 0 ? Math.round((formalWithSupport.length / formalCases.length) * 100) : 0;

  const overview: DisciplinaryOverview = {
    total_cases: cases.length,
    open_cases: openCases.length,
    concluded_cases: concludedCases.length,
    avg_days_to_resolution: avgDaysToResolution,
    lado_referrals: ladoReferrals,
    suspensions_active: suspensionsActive,
    cases_last_90_days: casesLast90Days,
    support_offered_rate: supportOfferedRate,
  };

  // ── Category Breakdown ──────────────────────────────────────────────────

  const categoryMap = new Map<string, { count: number; open_count: number }>();
  for (const c of cases) {
    const existing = categoryMap.get(c.category) ?? { count: 0, open_count: 0 };
    existing.count++;
    if (isOpen(c)) existing.open_count++;
    categoryMap.set(c.category, existing);
  }

  const category_breakdown: DisciplinaryCategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([cat, data]) => ({
      category: cat,
      category_label: categoryLabel(cat),
      count: data.count,
      open_count: data.open_count,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Open Cases ──────────────────────────────────────────────────────────

  const staffMap = new Map<string, string>();
  for (const s of staff) {
    staffMap.set(s.id, s.name);
  }

  const open_cases: OpenDisciplinaryCase[] = openCases.map((c) => ({
    case_id: c.id,
    staff_name: staffMap.get(c.staff_id) ?? c.staff_id,
    category: c.category,
    category_label: categoryLabel(c.category),
    severity: c.severity,
    status: c.status,
    days_open: daysBetween(c.date_raised, today),
    lado_referral: c.lado_referral,
    suspension: c.suspension,
  }));

  // ── Outcome Distribution ────────────────────────────────────────────────

  const outcomeMap = new Map<string, number>();
  for (const c of cases) {
    outcomeMap.set(c.outcome, (outcomeMap.get(c.outcome) ?? 0) + 1);
  }

  const outcome_distribution: OutcomeDistribution[] = Array.from(outcomeMap.entries())
    .map(([out, count]) => ({
      outcome: out,
      outcome_label: outcomeLabel(out),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Alerts ──────────────────────────────────────────────────────────────

  const alerts: DisciplinaryAlert[] = [];

  // CRITICAL: Gross misconduct case open > 5 days without LADO consideration
  for (const c of openCases) {
    if (
      (c.severity === "gross_misconduct" || c.category === "gross_misconduct") &&
      !c.lado_referral &&
      daysBetween(c.date_raised, today) > 5
    ) {
      const name = staffMap.get(c.staff_id) ?? c.staff_id;
      alerts.push({
        severity: "critical",
        message: `Gross misconduct case for ${name} open ${daysBetween(c.date_raised, today)} days without LADO consideration`,
      });
    }
  }

  // CRITICAL: Suspended staff with investigation > 21 days (ACAS guidance)
  for (const c of openCases) {
    if (c.suspension && daysBetween(c.date_raised, today) > 21) {
      const name = staffMap.get(c.staff_id) ?? c.staff_id;
      alerts.push({
        severity: "critical",
        message: `Suspended staff member ${name} with investigation exceeding 21 days (ACAS guidance)`,
      });
    }
  }

  // HIGH: Open case exceeding 28 days without conclusion
  for (const c of openCases) {
    if (daysBetween(c.date_raised, today) > 28) {
      const name = staffMap.get(c.staff_id) ?? c.staff_id;
      alerts.push({
        severity: "high",
        message: `Open case for ${name} exceeding 28 days without conclusion`,
      });
    }
  }

  // HIGH: 2+ cases against the same staff member in 12 months
  const twelveMonthsAgo = new Date(today + "T00:00:00Z");
  twelveMonthsAgo.setDate(twelveMonthsAgo.getDate() - 365);
  const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().slice(0, 10);

  const staffCaseCounts = new Map<string, number>();
  for (const c of cases) {
    if (c.date_raised >= twelveMonthsAgoStr) {
      staffCaseCounts.set(c.staff_id, (staffCaseCounts.get(c.staff_id) ?? 0) + 1);
    }
  }

  for (const [staffId, count] of staffCaseCounts) {
    if (count >= 2) {
      const name = staffMap.get(staffId) ?? staffId;
      alerts.push({
        severity: "high",
        message: `${count} disciplinary cases against ${name} in the last 12 months`,
      });
    }
  }

  // MEDIUM: No support offered during formal proceedings
  for (const c of openCases) {
    if (c.severity !== "informal" && c.support_offered.length === 0) {
      const name = staffMap.get(c.staff_id) ?? c.staff_id;
      alerts.push({
        severity: "medium",
        message: `No support offered to ${name} during formal proceedings`,
      });
    }
  }

  // LOW: Informal cases without documented management advice outcome
  for (const c of concludedCases) {
    if (c.severity === "informal" && c.outcome !== "management_advice") {
      const name = staffMap.get(c.staff_id) ?? c.staff_id;
      alerts.push({
        severity: "low",
        message: `Informal case for ${name} concluded without documented management advice outcome`,
      });
    }
  }

  // ── Insights ────────────────────────────────────────────────────────────

  const insights: CaraDisciplinaryInsight[] = [];

  // CRITICAL: Active suspensions with LADO involvement
  const suspendedWithLado = openCases.filter((c) => c.suspension && c.lado_referral);
  if (suspendedWithLado.length > 0) {
    insights.push({
      severity: "critical",
      text: `${suspendedWithLado.length} active suspension${suspendedWithLado.length > 1 ? "s" : ""} with LADO involvement — immediate priority`,
    });
  }

  // WARNING: Average resolution time > 20 days
  if (avgDaysToResolution > 20) {
    insights.push({
      severity: "warning",
      text: `Average resolution time of ${avgDaysToResolution} days exceeds 20-day target — procedural efficiency concern`,
    });
  }

  // WARNING: Multiple open cases at same time — capacity concern
  const investigatorCaseCount = new Map<string, number>();
  for (const c of openCases) {
    if (c.investigating_officer) {
      investigatorCaseCount.set(
        c.investigating_officer,
        (investigatorCaseCount.get(c.investigating_officer) ?? 0) + 1
      );
    }
  }
  for (const [officer, count] of investigatorCaseCount) {
    if (count >= 2) {
      const name = staffMap.get(officer) ?? officer;
      insights.push({
        severity: "warning",
        text: `${name} is investigating ${count} open cases simultaneously — capacity concern`,
      });
    }
  }

  // POSITIVE: All cases have support measures documented
  if (cases.length > 0 && formalCases.length > 0 && formalCases.every((c) => c.support_offered.length > 0)) {
    insights.push({
      severity: "positive",
      text: "All formal cases have support measures documented",
    });
  }

  // POSITIVE: Average resolution time <= 14 days
  if (concludedCases.length > 0 && avgDaysToResolution > 0 && avgDaysToResolution <= 14) {
    insights.push({
      severity: "positive",
      text: `Average resolution time of ${avgDaysToResolution} days — efficient disciplinary process`,
    });
  }

  // POSITIVE: No open cases
  if (openCases.length === 0 && cases.length > 0) {
    insights.push({
      severity: "positive",
      text: "No open disciplinary cases — clean disciplinary record",
    });
  }

  // POSITIVE: All concluded cases have documented outcomes (no "pending" in concluded)
  if (
    concludedCases.length > 0 &&
    concludedCases.every((c) => c.outcome !== "pending")
  ) {
    insights.push({
      severity: "positive",
      text: "All concluded cases have documented outcomes",
    });
  }

  return {
    overview,
    category_breakdown,
    open_cases,
    outcome_distribution,
    alerts,
    insights,
  };
}
