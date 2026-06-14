// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 INDEPENDENT VISITOR INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses visit frequency, recommendation follow-through, Ofsted reporting
// timeliness, children spoken to, records reviewed, and overall patterns.
//
// Regulatory: Reg 44 (Independent person — monthly visits),
// Schedule 4 para 5 (report within 5 working days of visit),
// Ofsted SCCIF: Leadership & Management — independent scrutiny.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type RecommendationStatus = "pending" | "in_progress" | "completed" | "rejected";
export type RecommendationPriority = "high" | "medium" | "low";

export interface RecommendationInput {
  id: string;
  recommendation: string;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  rm_response: string | null;
  completed_at: string | null;
}

export interface VisitInput {
  id: string;
  visit_date: string;
  visitor: string;
  duration_hours: number;
  children_spoken_count: number;
  children_total: number;
  staff_spoken: number;
  records_reviewed: string[];
  overall_judgement: string;
  strengths_count: number;
  areas_for_development_count: number;
  recommendations: RecommendationInput[];
  report_sent_to_ofsted: boolean;
  report_sent_date: string | null;
}

export interface Reg44IntelligenceInput {
  visits: VisitInput[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface Reg44Overview {
  total_visits_12m: number;
  visits_on_schedule: boolean;    // monthly visits maintained
  avg_days_between_visits: number;
  children_participation_rate: number; // 0-100
  total_recommendations: number;
  recommendations_completed: number;
  recommendations_in_progress: number;
  recommendations_pending: number;
  completion_rate: number;        // 0-100
  ofsted_reporting_compliance: number; // 0-100 (sent within 5 working days)
  avg_duration_hours: number;
}

export interface VisitComplianceProfile {
  visit_id: string;
  visit_date: string;
  visitor: string;
  days_since_previous: number | null;
  on_schedule: boolean;           // within 35 days of previous
  children_spoken_rate: number;   // 0-100
  recommendations_count: number;
  report_sent_timely: boolean;
  overall_judgement: string;
}

export interface RecommendationAnalysis {
  total: number;
  by_priority: { priority: RecommendationPriority; count: number; completed: number }[];
  avg_days_to_complete: number;
  overdue: number; // in_progress or pending for 30+ days
  high_priority_incomplete: number;
}

export interface Reg44Alert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraReg44Insight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface Reg44IntelligenceResult {
  overview: Reg44Overview;
  visit_profiles: VisitComplianceProfile[];
  recommendation_analysis: RecommendationAnalysis;
  alerts: Reg44Alert[];
  insights: CaraReg44Insight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

export function daysUntil(from: string, to: string): number {
  const msFrom = new Date(from).getTime();
  const msTo = new Date(to).getTime();
  return Math.round((msTo - msFrom) / 86_400_000);
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeReg44Intelligence(input: Reg44IntelligenceInput): Reg44IntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { visits } = input;

  // Sort visits chronologically (oldest first)
  const sorted = [...visits].sort((a, b) => a.visit_date.localeCompare(b.visit_date));

  // Filter to last 12 months
  const within12m = sorted.filter((v) => daysBetween(v.visit_date, today) <= 365);

  // ── Visit Compliance Profiles ─────────────────────────────────────────
  const visit_profiles: VisitComplianceProfile[] = within12m.map((visit, idx) => {
    const prev = idx > 0 ? within12m[idx - 1] : null;
    const daysSincePrev = prev ? daysBetween(prev.visit_date, visit.visit_date) : null;

    // On schedule: no more than 35 days since previous (Reg 44 = monthly)
    const onSchedule = daysSincePrev === null || daysSincePrev <= 35;

    // Children spoken rate
    const childSpokenRate = visit.children_total > 0
      ? Math.round((visit.children_spoken_count / visit.children_total) * 100)
      : 100;

    // Report sent within 5 working days (~7 calendar days)
    const reportTimely = visit.report_sent_to_ofsted && visit.report_sent_date
      ? daysBetween(visit.visit_date, visit.report_sent_date) <= 7
      : false;

    return {
      visit_id: visit.id,
      visit_date: visit.visit_date,
      visitor: visit.visitor,
      days_since_previous: daysSincePrev,
      on_schedule: onSchedule,
      children_spoken_rate: childSpokenRate,
      recommendations_count: visit.recommendations.length,
      report_sent_timely: reportTimely,
      overall_judgement: visit.overall_judgement,
    };
  });

  // ── Overview ──────────────────────────────────────────────────────────
  const intervals = visit_profiles
    .filter((v) => v.days_since_previous != null)
    .map((v) => v.days_since_previous!);

  const childRates = visit_profiles.map((v) => v.children_spoken_rate);

  const allRecs = within12m.flatMap((v) => v.recommendations);
  const completedRecs = allRecs.filter((r) => r.status === "completed");
  const inProgressRecs = allRecs.filter((r) => r.status === "in_progress");
  const pendingRecs = allRecs.filter((r) => r.status === "pending");

  const reportsCompliant = visit_profiles.filter((v) => v.report_sent_timely).length;

  // Are visits on schedule overall? No gap > 35 days
  const visitsOnSchedule = visit_profiles.every((v) => v.on_schedule);

  // Last visit gap check
  const lastVisit = within12m[within12m.length - 1];
  const daysSinceLastVisit = lastVisit ? daysBetween(lastVisit.visit_date, today) : 999;

  const overview: Reg44Overview = {
    total_visits_12m: within12m.length,
    visits_on_schedule: visitsOnSchedule && daysSinceLastVisit <= 35,
    avg_days_between_visits: Math.round(average(intervals)),
    children_participation_rate: Math.round(average(childRates)),
    total_recommendations: allRecs.length,
    recommendations_completed: completedRecs.length,
    recommendations_in_progress: inProgressRecs.length,
    recommendations_pending: pendingRecs.length,
    completion_rate: allRecs.length > 0 ? Math.round((completedRecs.length / allRecs.length) * 100) : 100,
    ofsted_reporting_compliance: within12m.length > 0 ? Math.round((reportsCompliant / within12m.length) * 100) : 100,
    avg_duration_hours: Math.round(average(within12m.map((v) => v.duration_hours)) * 10) / 10,
  };

  // ── Recommendation Analysis ───────────────────────────────────────────
  const priorities: RecommendationPriority[] = ["high", "medium", "low"];
  const byPriority = priorities.map((p) => {
    const precs = allRecs.filter((r) => r.priority === p);
    return {
      priority: p,
      count: precs.length,
      completed: precs.filter((r) => r.status === "completed").length,
    };
  }).filter((p) => p.count > 0);

  // Average days to complete
  const completionDays = completedRecs
    .filter((r) => r.completed_at)
    .map((r) => {
      // Find which visit this recommendation belongs to
      const visitDate = within12m.find((v) => v.recommendations.some((rec) => rec.id === r.id))?.visit_date;
      return visitDate ? daysBetween(visitDate, r.completed_at!) : 0;
    })
    .filter((d) => d > 0);

  // Overdue: pending or in_progress for 30+ days from visit
  const overdueRecs = within12m.flatMap((v) =>
    v.recommendations
      .filter((r) => r.status === "pending" || r.status === "in_progress")
      .filter(() => daysBetween(v.visit_date, today) >= 30),
  );

  const highPriorityIncomplete = allRecs.filter(
    (r) => r.priority === "high" && r.status !== "completed",
  ).length;

  const recommendation_analysis: RecommendationAnalysis = {
    total: allRecs.length,
    by_priority: byPriority,
    avg_days_to_complete: Math.round(average(completionDays)),
    overdue: overdueRecs.length,
    high_priority_incomplete: highPriorityIncomplete,
  };

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: Reg44Alert[] = [];

  // Critical: visit overdue (>35 days since last)
  if (daysSinceLastVisit > 35) {
    alerts.push({
      severity: "critical",
      message: `Reg 44 visit overdue — ${daysSinceLastVisit} days since last visit (maximum 35 days). Schedule immediately.`,
    });
  }

  // High: high priority recommendations incomplete
  if (highPriorityIncomplete > 0) {
    alerts.push({
      severity: "high",
      message: `${highPriorityIncomplete} high-priority recommendation${highPriorityIncomplete > 1 ? "s" : ""} from independent visitor not yet completed`,
    });
  }

  // Medium: report not sent to Ofsted
  const unreported = within12m.filter((v) => !v.report_sent_to_ofsted);
  if (unreported.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${unreported.length} Reg 44 report${unreported.length > 1 ? "s" : ""} not yet sent to Ofsted — must be submitted within 5 working days`,
    });
  }

  // Medium: overdue recommendations
  if (overdueRecs.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${overdueRecs.length} recommendation${overdueRecs.length > 1 ? "s" : ""} outstanding for 30+ days — review progress and update RM response`,
    });
  }

  // Low: children not spoken to
  const lowParticipation = visit_profiles.filter((v) => v.children_spoken_rate < 100);
  if (lowParticipation.length > 0) {
    alerts.push({
      severity: "low",
      message: `${lowParticipation.length} visit${lowParticipation.length > 1 ? "s" : ""} where not all children were spoken to — ensure catch-up arrangements made`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraReg44Insight[] = [];

  // Critical: visit overdue
  if (daysSinceLastVisit > 35) {
    insights.push({
      severity: "critical",
      text: `Reg 44 visit is ${daysSinceLastVisit} days overdue. The independent person must visit at least once per month. Ofsted will view gaps in independent scrutiny as a leadership failure. Contact the independent visitor immediately.`,
    });
  }

  // Warning: low completion rate
  if (allRecs.length >= 3 && overview.completion_rate < 70) {
    insights.push({
      severity: "warning",
      text: `Only ${overview.completion_rate}% of independent visitor recommendations completed. Low follow-through undermines the purpose of independent scrutiny and suggests accountability gaps. Ofsted expects robust RM responses to all recommendations.`,
    });
  }

  // Warning: reporting delays
  if (within12m.length >= 2 && overview.ofsted_reporting_compliance < 100) {
    insights.push({
      severity: "warning",
      text: `Ofsted reporting compliance is ${overview.ofsted_reporting_compliance}%. Schedule 4 requires the report to be sent within 5 working days of the visit. Late reporting is a regulatory breach.`,
    });
  }

  // Positive: all on schedule
  if (within12m.length >= 3 && visitsOnSchedule && daysSinceLastVisit <= 35) {
    insights.push({
      severity: "positive",
      text: `All ${within12m.length} Reg 44 visits completed on schedule with an average of ${overview.avg_days_between_visits} days between visits. Consistent independent scrutiny demonstrates strong governance under Reg 44.`,
    });
  }

  // Positive: high completion rate
  if (allRecs.length >= 3 && overview.completion_rate >= 80) {
    insights.push({
      severity: "positive",
      text: `${overview.completion_rate}% of independent visitor recommendations completed. Strong follow-through shows the RM values independent scrutiny and is committed to continuous improvement.`,
    });
  }

  // Positive: all children spoken to
  if (within12m.length >= 2 && overview.children_participation_rate === 100) {
    insights.push({
      severity: "positive",
      text: `100% of children spoken to across all visits. This ensures every child has an independent person they can speak to about their care — a key safeguarding measure.`,
    });
  }

  return {
    overview,
    visit_profiles,
    recommendation_analysis,
    alerts,
    insights,
  };
}
