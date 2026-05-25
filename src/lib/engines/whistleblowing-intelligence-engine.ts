// ==============================================================================
// CORNERSTONE -- WHISTLEBLOWING INTELLIGENCE ENGINE
// Pure deterministic engine for whistleblowing disclosure analysis.
// Analyses disclosure handling, investigation progress, protection compliance,
// and generates ARIA intelligence insights.
// Reg 41: whistleblowing -- Public Interest Disclosure Act 1998 (PIDA)
// ==============================================================================

export interface WhistleblowingInput {
  id: string;
  reference: string;
  date_raised: string;
  anonymous: boolean;
  category: string;
  severity: string;
  status: string;
  assigned_to: string;
  external_referral: string | null;
  outcome: string;
  lessons_learned: string;
  protection_measures: string[];
  date_closed: string | null; // last timeline entry date for resolved/closed, null for open
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface WhistleblowingOverview {
  total_reports: number;
  open_reports: number;
  resolved_reports: number;
  avg_resolution_days: number;
  external_referral_count: number;
  anonymous_count: number;
  protection_measures_rate: number;
  lessons_recorded_rate: number;
}

export interface CategoryBreakdown {
  category: string;
  category_label: string;
  count: number;
  open_count: number;
}

export interface OpenCase {
  case_id: string;
  reference: string;
  category: string;
  category_label: string;
  severity: string;
  status: string;
  assigned_to: string;
  days_open: number;
}

export interface WhistleblowingAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaWhistleblowingInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface WhistleblowingIntelligenceResult {
  overview: WhistleblowingOverview;
  category_breakdown: CategoryBreakdown[];
  open_cases: OpenCase[];
  alerts: WhistleblowingAlert[];
  insights: AriaWhistleblowingInsight[];
}

// -- Helpers ------------------------------------------------------------------

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

const CATEGORY_LABELS: Record<string, string> = {
  safeguarding: "Safeguarding",
  malpractice: "Malpractice",
  health_safety: "Health & Safety",
  financial: "Financial",
  bullying: "Bullying",
  data_breach: "Data Breach",
  discrimination: "Discrimination",
  neglect: "Neglect",
  policy_breach: "Policy Breach",
  other: "Other",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const OPEN_STATUSES = new Set(["received", "investigating", "escalated"]);

function isOpen(status: string): boolean {
  return OPEN_STATUSES.has(status);
}

// -- Engine -------------------------------------------------------------------

export function computeWhistleblowingIntelligence(input: {
  reports: WhistleblowingInput[];
  staff: StaffRef[];
  today?: string;
}): WhistleblowingIntelligenceResult {
  const { reports, staff, today = new Date().toISOString().slice(0, 10) } = input;

  if (reports.length === 0) {
    return {
      overview: {
        total_reports: 0,
        open_reports: 0,
        resolved_reports: 0,
        avg_resolution_days: 0,
        external_referral_count: 0,
        anonymous_count: 0,
        protection_measures_rate: 0,
        lessons_recorded_rate: 0,
      },
      category_breakdown: [],
      open_cases: [],
      alerts: [],
      insights: [],
    };
  }

  const openReports = reports.filter((r) => isOpen(r.status));
  const resolvedReports = reports.filter((r) => r.status === "resolved" || r.status === "closed_no_action");

  // -- Overview ---------------------------------------------------------------

  // avg_resolution_days: for resolved/closed cases with date_closed, calculate from date_raised
  const resolvedWithDates = resolvedReports.filter((r) => r.date_closed !== null);
  const totalResolutionDays = resolvedWithDates.reduce(
    (sum, r) => sum + daysBetween(r.date_raised, r.date_closed!),
    0,
  );
  const avgResolutionDays =
    resolvedWithDates.length > 0 ? Math.round(totalResolutionDays / resolvedWithDates.length) : 0;

  const externalReferralCount = reports.filter((r) => r.external_referral !== null && r.external_referral.trim().length > 0).length;
  const anonymousCount = reports.filter((r) => r.anonymous).length;

  const withProtection = reports.filter((r) => r.protection_measures.length > 0).length;
  const protectionMeasuresRate = Math.round((withProtection / reports.length) * 100);

  const withLessons = reports.filter((r) => r.lessons_learned.trim().length > 0).length;
  const lessonsRecordedRate = Math.round((withLessons / reports.length) * 100);

  const overview: WhistleblowingOverview = {
    total_reports: reports.length,
    open_reports: openReports.length,
    resolved_reports: resolvedReports.length,
    avg_resolution_days: avgResolutionDays,
    external_referral_count: externalReferralCount,
    anonymous_count: anonymousCount,
    protection_measures_rate: protectionMeasuresRate,
    lessons_recorded_rate: lessonsRecordedRate,
  };

  // -- Category breakdown -----------------------------------------------------

  const categoryCounts = new Map<string, { count: number; open_count: number }>();
  for (const r of reports) {
    const existing = categoryCounts.get(r.category) ?? { count: 0, open_count: 0 };
    existing.count++;
    if (isOpen(r.status)) existing.open_count++;
    categoryCounts.set(r.category, existing);
  }
  const category_breakdown: CategoryBreakdown[] = [...categoryCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([category, { count, open_count }]) => ({
      category,
      category_label: categoryLabel(category),
      count,
      open_count,
    }));

  // -- Open cases -------------------------------------------------------------

  const open_cases: OpenCase[] = openReports
    .map((r) => ({
      case_id: r.id,
      reference: r.reference,
      category: r.category,
      category_label: categoryLabel(r.category),
      severity: r.severity,
      status: r.status,
      assigned_to: r.assigned_to,
      days_open: daysBetween(r.date_raised, today),
    }))
    .sort((a, b) => b.days_open - a.days_open);

  // -- Alerts -----------------------------------------------------------------

  const alerts: WhistleblowingAlert[] = [];

  // critical: open case with severity "critical"
  for (const oc of open_cases) {
    if (oc.severity === "critical") {
      alerts.push({
        severity: "critical",
        message: `Critical whistleblowing case (${oc.reference}) is still open — ${oc.days_open} days since raised`,
      });
    }
  }

  // high: open case > 30 days
  for (const oc of open_cases) {
    if (oc.days_open > 30) {
      alerts.push({
        severity: "high",
        message: `Whistleblowing case ${oc.reference} open for ${oc.days_open} days — exceeds investigation timeline`,
      });
    }
  }

  // high: case with severity high or critical and no external referral
  for (const r of reports) {
    if (
      (r.severity === "high" || r.severity === "critical") &&
      (r.external_referral === null || r.external_referral.trim().length === 0)
    ) {
      alerts.push({
        severity: "high",
        message: `High-severity case ${r.reference} has no external referral — assess if Ofsted/LADO notification required`,
      });
    }
  }

  // medium: protection_measures_rate < 80%
  if (protectionMeasuresRate < 80) {
    alerts.push({
      severity: "medium",
      message: `Protection measures documented in only ${protectionMeasuresRate}% of cases`,
    });
  }

  // medium: open investigation > 14 days
  for (const oc of open_cases) {
    if (oc.status === "investigating" && oc.days_open > 14) {
      alerts.push({
        severity: "medium",
        message: `Investigation ${oc.reference} ongoing for ${oc.days_open} days — update stakeholders`,
      });
    }
  }

  // low: lessons not recorded for resolved case
  for (const r of resolvedReports) {
    if (r.lessons_learned.trim().length === 0) {
      alerts.push({
        severity: "low",
        message: `Resolved case ${r.reference} has no lessons learned recorded`,
      });
    }
  }

  alerts.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  // -- Insights ---------------------------------------------------------------

  const insights: AriaWhistleblowingInsight[] = [];

  // critical: critical severity open
  for (const oc of open_cases) {
    if (oc.severity === "critical") {
      insights.push({
        severity: "critical",
        text: `Critical whistleblowing disclosure (${oc.reference}) remains unresolved after ${oc.days_open} days — immediate management attention required`,
      });
    }
  }

  // warning: long investigations (> 30 days)
  for (const oc of open_cases) {
    if (oc.days_open > 30) {
      insights.push({
        severity: "warning",
        text: `Investigation into ${oc.reference} has been open ${oc.days_open} days — prolonged investigations risk whistleblower confidence`,
      });
    }
  }

  // warning: no external referrals for serious cases
  const seriousWithoutReferral = reports.filter(
    (r) =>
      (r.severity === "high" || r.severity === "critical") &&
      (r.external_referral === null || r.external_referral.trim().length === 0),
  );
  if (seriousWithoutReferral.length > 0) {
    insights.push({
      severity: "warning",
      text: `${seriousWithoutReferral.length} high/critical case${seriousWithoutReferral.length > 1 ? "s" : ""} without external referral — review whether Ofsted or LADO notification is needed`,
    });
  }

  // warning: low protection rate
  if (protectionMeasuresRate < 80) {
    insights.push({
      severity: "warning",
      text: `Protection measures documented in only ${protectionMeasuresRate}% of cases — PIDA requires clear detriment protection for whistleblowers`,
    });
  }

  // positive: all resolved
  if (reports.length > 0 && openReports.length === 0) {
    insights.push({
      severity: "positive",
      text: "All whistleblowing disclosures have been resolved — no outstanding cases",
    });
  }

  // positive: lessons recorded for all resolved
  const allResolvedHaveLessons =
    resolvedReports.length > 0 && resolvedReports.every((r) => r.lessons_learned.trim().length > 0);
  if (allResolvedHaveLessons) {
    insights.push({
      severity: "positive",
      text: "All resolved cases have lessons learned recorded — strong reflective practice culture",
    });
  }

  // positive: protection measures in place
  if (reports.length > 0 && protectionMeasuresRate >= 80) {
    insights.push({
      severity: "positive",
      text: `Protection measures documented in ${protectionMeasuresRate}% of cases — PIDA compliance is strong`,
    });
  }

  // positive: no detriment (all have protection measures)
  if (reports.length > 0 && protectionMeasuresRate === 100) {
    insights.push({
      severity: "positive",
      text: "All whistleblowers have documented protection measures — no detriment culture in place",
    });
  }

  // positive: timely resolution (all resolved within 30 days)
  const allResolvedTimely =
    resolvedWithDates.length > 0 &&
    resolvedWithDates.every((r) => daysBetween(r.date_raised, r.date_closed!) <= 30);
  if (allResolvedTimely) {
    insights.push({
      severity: "positive",
      text: `All resolved cases were concluded within 30 days — timely investigation process`,
    });
  }

  return {
    overview,
    category_breakdown,
    open_cases,
    alerts,
    insights,
  };
}
