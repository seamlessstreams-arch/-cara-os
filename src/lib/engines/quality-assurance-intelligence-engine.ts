// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUALITY ASSURANCE INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses internal audits, recommendations, improvement plans, and ratings
// to surface compliance posture, overdue actions, and actionable insights.
//
// Regulatory: Reg 45 (quality of care review — systematic review of care
// quality). SCCIF Leadership & Management: evidence of self-evaluation and
// improvement.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface QAAuditActionInput {
  action: string;
  owner: string;
  deadline: string;
  status: string; // "completed" | "in_progress" | "pending" | "overdue"
}

export interface QAAuditInput {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  auditor: string;
  scope: string;
  overall_rating: string; // "excellent" | "good" | "requires_improvement" | "inadequate"
  score: number;
  findings: string[];
  strengths: string[];
  areas_for_improvement: string[];
  actions: QAAuditActionInput[];
}

export interface StaffRef {
  id: string;
  name: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface QAOverview {
  total_audits: number;
  avg_rating_score: number;
  avg_rating_label: string;
  total_actions: number;
  actions_completed: number;
  actions_overdue: number;
  recommendation_completion_rate: number;
  audits_last_90_days: number;
  strengths_count: number;
  improvements_count: number;
}

export interface AuditAreaRating {
  scope: string;
  audit_count: number;
  avg_rating: string;
  latest_date: string;
}

export interface OverdueAction {
  action: string;
  owner: string;
  deadline: string;
  audit_title: string;
  days_overdue: number;
}

export interface QAAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaQAInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface QualityAssuranceIntelligenceResult {
  overview: QAOverview;
  audit_areas: AuditAreaRating[];
  overdue_actions: OverdueAction[];
  alerts: QAAlert[];
  insights: AriaQAInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const RATING_SCORE_MAP: Record<string, number> = {
  excellent: 4,
  good: 3,
  requires_improvement: 2,
  inadequate: 1,
};

function ratingToScore(rating: string): number {
  return RATING_SCORE_MAP[rating] ?? 0;
}

function scoreToLabel(score: number): string {
  if (score >= 3.5) return "Excellent";
  if (score >= 2.5) return "Good";
  if (score >= 1.5) return "Requires Improvement";
  return "Inadequate";
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z");
  const b = new Date(to + "T00:00:00Z");
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// An action counts as overdue when it is explicitly marked "overdue" OR it is
// still open (not completed/cancelled) and its deadline has passed. Gating on
// status === "overdue" alone hid in_progress/pending actions that were past due.
export function isActionOverdue(action: QAAuditActionInput, today: string): boolean {
  if (action.status === "completed" || action.status === "cancelled") return false;
  if (action.status === "overdue") return true;
  return !!action.deadline && daysBetween(action.deadline, today) > 0;
}

// ── Main Compute Function ───────────────────────────────────────────────────

export function computeQualityAssuranceIntelligence(input: {
  audits: QAAuditInput[];
  staff: StaffRef[];
  today?: string;
}): QualityAssuranceIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const audits = input.audits;

  // ── Overview ────────────────────────────────────────────────────────────
  const total_audits = audits.length;

  const ratingScores = audits.map((a) => ratingToScore(a.overall_rating));
  const avg_rating_score =
    total_audits > 0
      ? ratingScores.reduce((sum, s) => sum + s, 0) / total_audits
      : 0;
  const avg_rating_label = total_audits > 0 ? scoreToLabel(avg_rating_score) : "Inadequate";

  const allActions = audits.flatMap((a) => a.actions);
  const total_actions = allActions.length;
  const actions_completed = allActions.filter((a) => a.status === "completed").length;
  const actions_overdue = allActions.filter((a) => isActionOverdue(a, today)).length;
  const recommendation_completion_rate =
    total_actions > 0 ? Math.round((actions_completed / total_actions) * 100) : 100;

  const audits_last_90_days = audits.filter(
    (a) => daysBetween(a.date, today) >= 0 && daysBetween(a.date, today) <= 90
  ).length;

  const strengths_count = audits.reduce((sum, a) => sum + a.strengths.length, 0);
  const improvements_count = audits.reduce(
    (sum, a) => sum + a.areas_for_improvement.length,
    0
  );

  const overview: QAOverview = {
    total_audits,
    avg_rating_score: Math.round(avg_rating_score * 100) / 100,
    avg_rating_label,
    total_actions,
    actions_completed,
    actions_overdue,
    recommendation_completion_rate,
    audits_last_90_days,
    strengths_count,
    improvements_count,
  };

  // ── Audit Areas ─────────────────────────────────────────────────────────
  const scopeMap = new Map<
    string,
    { scores: number[]; dates: string[] }
  >();

  for (const a of audits) {
    const entry = scopeMap.get(a.scope) ?? { scores: [], dates: [] };
    entry.scores.push(ratingToScore(a.overall_rating));
    entry.dates.push(a.date);
    scopeMap.set(a.scope, entry);
  }

  const audit_areas: AuditAreaRating[] = [];
  for (const [scope, data] of Array.from(scopeMap.entries())) {
    const avg = data.scores.reduce((s, v) => s + v, 0) / data.scores.length;
    const sortedDates = [...data.dates].sort();
    audit_areas.push({
      scope,
      audit_count: data.scores.length,
      avg_rating: scoreToLabel(avg),
      latest_date: sortedDates[sortedDates.length - 1],
    });
  }

  // Sort by scope alphabetically
  audit_areas.sort((a, b) => a.scope.localeCompare(b.scope));

  // ── Overdue Actions ─────────────────────────────────────────────────────
  const overdue_actions: OverdueAction[] = [];

  for (const audit of audits) {
    for (const action of audit.actions) {
      if (isActionOverdue(action, today)) {
        const days = daysBetween(action.deadline, today);
        overdue_actions.push({
          action: action.action,
          owner: action.owner,
          deadline: action.deadline,
          audit_title: audit.title,
          days_overdue: Math.max(0, days),
        });
      }
    }
  }

  // Sort by most overdue first
  overdue_actions.sort((a, b) => b.days_overdue - a.days_overdue);

  // ── Alerts ──────────────────────────────────────────────────────────────
  const alerts: QAAlert[] = [];

  // Critical: any audit rated inadequate
  for (const a of audits) {
    if (a.overall_rating === "inadequate") {
      alerts.push({
        severity: "critical",
        message: `Audit '${a.title}' rated Inadequate — immediate improvement required`,
      });
    }
  }

  // High: actions overdue > 14 days
  for (const od of overdue_actions) {
    if (od.days_overdue > 14) {
      alerts.push({
        severity: "high",
        message: `Action '${od.action}' is ${od.days_overdue} days overdue (from ${od.audit_title})`,
      });
    }
  }

  // High: no audit in a scope for >90 days
  for (const [scope, data] of Array.from(scopeMap.entries())) {
    const sortedDates = [...data.dates].sort();
    const latestDate = sortedDates[sortedDates.length - 1];
    const daysSinceLatest = daysBetween(latestDate, today);
    if (daysSinceLatest > 90) {
      alerts.push({
        severity: "high",
        message: `No audit in scope '${scope}' for ${daysSinceLatest} days — review overdue`,
      });
    }
  }

  // Medium: recommendation_completion_rate < 70%
  if (total_actions > 0 && recommendation_completion_rate < 70) {
    alerts.push({
      severity: "medium",
      message: `Recommendation completion rate is ${recommendation_completion_rate}% — below 70% target`,
    });
  }

  // Medium: actions overdue <= 14 days
  for (const od of overdue_actions) {
    if (od.days_overdue > 0 && od.days_overdue <= 14) {
      alerts.push({
        severity: "medium",
        message: `Action '${od.action}' is ${od.days_overdue} days overdue (from ${od.audit_title})`,
      });
    }
  }

  // Low: areas_for_improvement > strengths in latest audit
  if (audits.length > 0) {
    const sorted = [...audits].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];
    if (latest.areas_for_improvement.length > latest.strengths.length) {
      alerts.push({
        severity: "low",
        message: `Latest audit '${latest.title}' has more areas for improvement (${latest.areas_for_improvement.length}) than strengths (${latest.strengths.length})`,
      });
    }
  }

  // Sort by severity
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: AriaQAInsight[] = [];

  // Critical: inadequate rating
  for (const a of audits) {
    if (a.overall_rating === "inadequate") {
      insights.push({
        severity: "critical",
        text: `Audit '${a.title}' received an Inadequate rating — requires urgent management attention and remediation plan`,
      });
    }
  }

  // Warning: overdue actions
  if (actions_overdue > 0) {
    insights.push({
      severity: "warning",
      text: `${actions_overdue} action${actions_overdue === 1 ? "" : "s"} overdue — review ownership and deadlines`,
    });
  }

  // Warning: low completion rate
  if (total_actions > 0 && recommendation_completion_rate < 70) {
    insights.push({
      severity: "warning",
      text: `Recommendation completion rate at ${recommendation_completion_rate}% — below acceptable threshold of 70%`,
    });
  }

  // Warning: requires_improvement ratings
  const riAudits = audits.filter((a) => a.overall_rating === "requires_improvement");
  if (riAudits.length > 0) {
    insights.push({
      severity: "warning",
      text: `${riAudits.length} audit${riAudits.length === 1 ? "" : "s"} rated Requires Improvement — targeted action plans needed`,
    });
  }

  // Positive: all actions completed
  if (total_actions > 0 && actions_completed === total_actions) {
    insights.push({
      severity: "positive",
      text: "All audit actions are completed — excellent follow-through demonstrated",
    });
  }

  // Positive: high avg rating >= 3
  if (total_audits > 0 && avg_rating_score >= 3) {
    insights.push({
      severity: "positive",
      text: `Average quality rating is ${scoreToLabel(avg_rating_score)} (${overview.avg_rating_score}/4) — strong quality assurance posture`,
    });
  }

  // Positive: all scopes audited in 90 days
  if (scopeMap.size > 0) {
    const allScopesRecent = Array.from(scopeMap.values()).every((data) => {
      const sortedDates = [...data.dates].sort();
      const latest = sortedDates[sortedDates.length - 1];
      return daysBetween(latest, today) <= 90;
    });
    if (allScopesRecent) {
      insights.push({
        severity: "positive",
        text: `All ${scopeMap.size} audit scopes have been reviewed within the last 90 days — comprehensive coverage maintained`,
      });
    }
  }

  // Positive: strengths > improvements
  if (total_audits > 0 && strengths_count > improvements_count) {
    insights.push({
      severity: "positive",
      text: `More strengths identified (${strengths_count}) than areas for improvement (${improvements_count}) — positive quality trajectory`,
    });
  }

  return {
    overview,
    audit_areas,
    overdue_actions,
    alerts,
    insights,
  };
}
