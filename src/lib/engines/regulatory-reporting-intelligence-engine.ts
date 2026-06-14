// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATORY REPORTING INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses Reg 44 visit schedule compliance, Reg 45 quality of care reviews,
// statutory notification compliance (Reg 40), recommendation tracking, and
// computes an overall regulatory compliance score.
//
// Regulatory basis:
//   Reg 44 — independent person visits (monthly)
//   Reg 45 — quality of care review (6-monthly)
//   Reg 40 — notifiable events (notify Ofsted within 24 hours)
//   SCCIF  — evidence of regulatory compliance
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface Reg44ReportInput {
  id: string;
  visit_date: string;
  visitor_name: string;
  status: string; // completed, in_progress, draft, overdue
  submitted_date: string | null;
  recommendations_count: number;
  recommendations_completed: number;
  overall_rating: string; // good, satisfactory, requires_improvement
  next_visit_due: string;
}

export interface Reg45ReportInput {
  id: string;
  period_start: string;
  period_end: string;
  author: string;
  status: string; // completed, in_progress, draft, not_started
  submitted_date: string | null;
  next_due: string;
  progress_percentage: number;
}

export interface NotificationInput {
  id: string;
  event_type: string; // serious_injury, death, allegation, absconder, police_involvement, restrictive_intervention, other
  event_date: string;
  notified_date: string | null;
  notified_within_24h: boolean;
  ofsted_reference: string;
  status: string; // notified, pending, overdue
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface RegulatoryReportingIntelligenceInput {
  reg44Reports: Reg44ReportInput[];
  reg45Reports: Reg45ReportInput[];
  notifications: NotificationInput[];
  staff: StaffRef[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface RegulatoryReportingOverview {
  overall_compliance_score: number; // 0-100
  reg44_visits_last_12_months: number;
  reg44_compliant: boolean; // 12 visits in 12 months
  reg45_compliant: boolean; // submitted within 6-month cycle
  notifications_on_time_rate: number;
  outstanding_recommendations: number;
}

export interface Reg44Status {
  last_visit_date: string | null;
  next_visit_due: string | null;
  days_until_due: number | null;
  status: string; // on_track, due_soon, overdue
  visits_last_12_months: number;
  reports_completed: number;
  average_rating: string;
}

export interface Reg45Status {
  last_submitted: string | null;
  next_due: string | null;
  days_until_due: number | null;
  status: string; // on_track, due_soon, overdue, in_progress
  current_progress: number;
  reports_last_12_months: number;
}

export interface NotificationCompliance {
  total_notifications: number;
  notified_on_time: number;
  on_time_rate: number;
  pending_notifications: number;
  overdue_notifications: number;
}

export interface RecommendationTracker {
  total_recommendations: number;
  completed: number;
  outstanding: number;
  completion_rate: number;
}

export interface RegulatoryAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraRegulatoryInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface RegulatoryReportingIntelligenceResult {
  overview: RegulatoryReportingOverview;
  reg44_status: Reg44Status;
  reg45_status: Reg45Status;
  notification_compliance: NotificationCompliance;
  recommendation_tracker: RecommendationTracker;
  alerts: RegulatoryAlert[];
  insights: CaraRegulatoryInsight[];
}

// ── Helpers (exported for unit testing) ─────────────────────────────────────

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00Z");
  const b = new Date(dateB + "T00:00:00Z");
  return Math.round(Math.abs(b.getTime() - a.getTime()) / 86_400_000);
}

export function daysUntil(from: string, to: string): number {
  const f = new Date(from + "T00:00:00Z");
  const t = new Date(to + "T00:00:00Z");
  return Math.round((t.getTime() - f.getTime()) / 86_400_000);
}

export function isWithinLast12Months(date: string, today: string): boolean {
  return daysBetween(date, today) <= 365;
}

// ── Main Compute Function ───────────────────────────────────────────────────

export function computeRegulatoryReportingIntelligence(
  input: RegulatoryReportingIntelligenceInput
): RegulatoryReportingIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { reg44Reports, reg45Reports, notifications } = input;

  // ── Reg 44 Analysis ─────────────────────────────────────────────────────────

  const reg44InLast12 = reg44Reports.filter(
    (r) => isWithinLast12Months(r.visit_date, today)
  );

  const completedReg44 = reg44InLast12.filter((r) => r.status === "completed");

  // Last visit date — most recent visit_date from all reports
  const sortedByVisitDate = [...reg44Reports].sort(
    (a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
  );
  const lastVisitDate = sortedByVisitDate.length > 0 ? sortedByVisitDate[0].visit_date : null;

  // Next visit due — earliest next_visit_due that is in the future or the most recent
  const allNextDues = reg44Reports
    .map((r) => r.next_visit_due)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Find the next due date relative to today (the soonest upcoming or most recently passed)
  const futureNextDues = allNextDues.filter((d) => daysUntil(today, d) >= 0);
  const nextVisitDue = futureNextDues.length > 0
    ? futureNextDues[0]
    : allNextDues.length > 0
      ? allNextDues[allNextDues.length - 1]
      : null;

  const daysUntilDue = nextVisitDue !== null ? daysUntil(today, nextVisitDue) : null;

  // Reg 44 status
  let reg44StatusValue: string;
  if (daysUntilDue !== null && daysUntilDue < 0) {
    reg44StatusValue = "overdue";
  } else if (daysUntilDue !== null && daysUntilDue <= 7) {
    reg44StatusValue = "due_soon";
  } else {
    reg44StatusValue = "on_track";
  }

  // Average rating
  const ratingMap: Record<string, number> = {
    good: 3,
    satisfactory: 2,
    requires_improvement: 1,
  };
  const ratingValues = completedReg44
    .map((r) => ratingMap[r.overall_rating] ?? 0)
    .filter((v) => v > 0);
  const avgRatingNum = ratingValues.length > 0
    ? ratingValues.reduce((s, v) => s + v, 0) / ratingValues.length
    : 0;
  const averageRating = avgRatingNum >= 2.5 ? "good" : avgRatingNum >= 1.5 ? "satisfactory" : avgRatingNum > 0 ? "requires_improvement" : "none";

  const reg44Compliant = reg44InLast12.length >= 12;

  const reg44Status: Reg44Status = {
    last_visit_date: lastVisitDate,
    next_visit_due: nextVisitDue,
    days_until_due: daysUntilDue,
    status: reg44StatusValue,
    visits_last_12_months: reg44InLast12.length,
    reports_completed: completedReg44.length,
    average_rating: averageRating,
  };

  // ── Reg 45 Analysis ─────────────────────────────────────────────────────────

  const completedReg45 = reg45Reports.filter((r) => r.status === "completed");
  const completedReg45InLast12 = completedReg45.filter(
    (r) => r.submitted_date && isWithinLast12Months(r.submitted_date, today)
  );

  // Last submitted
  const sortedSubmitted = completedReg45
    .filter((r) => r.submitted_date !== null)
    .sort((a, b) => new Date(b.submitted_date!).getTime() - new Date(a.submitted_date!).getTime());
  const lastSubmitted = sortedSubmitted.length > 0 ? sortedSubmitted[0].submitted_date : null;

  // Next due — soonest next_due from all reports
  const allReg45NextDues = reg45Reports
    .map((r) => r.next_due)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const futureReg45Dues = allReg45NextDues.filter((d) => daysUntil(today, d) >= 0);
  const reg45NextDue = futureReg45Dues.length > 0
    ? futureReg45Dues[0]
    : allReg45NextDues.length > 0
      ? allReg45NextDues[allReg45NextDues.length - 1]
      : null;

  const reg45DaysUntilDue = reg45NextDue !== null ? daysUntil(today, reg45NextDue) : null;

  // Current progress — from the most recent in-progress or not-started report
  const inProgressReg45 = reg45Reports.filter(
    (r) => r.status === "in_progress" || r.status === "draft" || r.status === "not_started"
  );
  const currentProgress = inProgressReg45.length > 0
    ? inProgressReg45.reduce((max, r) => Math.max(max, r.progress_percentage), 0)
    : 0;

  // Reg 45 status logic
  let reg45StatusValue: string;
  if (reg45DaysUntilDue !== null && reg45DaysUntilDue < 0) {
    reg45StatusValue = "overdue";
  } else if (currentProgress > 0 && inProgressReg45.some((r) => r.status === "in_progress")) {
    reg45StatusValue = "in_progress";
  } else if (reg45DaysUntilDue !== null && reg45DaysUntilDue <= 30) {
    reg45StatusValue = "due_soon";
  } else {
    reg45StatusValue = "on_track";
  }

  // Reg 45 compliant — at least one completed within the 6-month cycle
  // If last submitted exists, check it was within 6 months (183 days)
  const reg45Compliant = lastSubmitted !== null && daysBetween(lastSubmitted, today) <= 183;

  const reg45Status: Reg45Status = {
    last_submitted: lastSubmitted,
    next_due: reg45NextDue,
    days_until_due: reg45DaysUntilDue,
    status: reg45StatusValue,
    current_progress: currentProgress,
    reports_last_12_months: completedReg45InLast12.length,
  };

  // ── Notification Compliance ─────────────────────────────────────────────────

  const totalNotifications = notifications.length;
  const notifiedOnTime = notifications.filter((n) => n.notified_within_24h).length;
  const onTimeRate = totalNotifications > 0
    ? Math.round((notifiedOnTime / totalNotifications) * 100)
    : 100;
  const pendingNotifications = notifications.filter((n) => n.status === "pending").length;
  const overdueNotifications = notifications.filter((n) => n.status === "overdue").length;

  const notificationCompliance: NotificationCompliance = {
    total_notifications: totalNotifications,
    notified_on_time: notifiedOnTime,
    on_time_rate: onTimeRate,
    pending_notifications: pendingNotifications,
    overdue_notifications: overdueNotifications,
  };

  // ── Recommendation Tracker ──────────────────────────────────────────────────

  const totalRecommendations = reg44Reports.reduce((s, r) => s + r.recommendations_count, 0);
  const completedRecommendations = reg44Reports.reduce((s, r) => s + r.recommendations_completed, 0);
  const outstandingRecommendations = totalRecommendations - completedRecommendations;
  const completionRate = totalRecommendations > 0
    ? Math.round((completedRecommendations / totalRecommendations) * 100)
    : 100;

  const recommendationTracker: RecommendationTracker = {
    total_recommendations: totalRecommendations,
    completed: completedRecommendations,
    outstanding: outstandingRecommendations,
    completion_rate: completionRate,
  };

  // ── Overall Compliance Score ────────────────────────────────────────────────
  // Weighted: reg44 compliant (30) + reg45 compliant (30) + notification rate (20) + recommendation rate (20)

  const reg44Score = reg44Compliant ? 30 : 0;
  const reg45Score = reg45Compliant ? 30 : 0;
  const notificationScore = Math.round((onTimeRate / 100) * 20);
  const recommendationScore = Math.round((completionRate / 100) * 20);
  const overallComplianceScore = reg44Score + reg45Score + notificationScore + recommendationScore;

  const overview: RegulatoryReportingOverview = {
    overall_compliance_score: overallComplianceScore,
    reg44_visits_last_12_months: reg44InLast12.length,
    reg44_compliant: reg44Compliant,
    reg45_compliant: reg45Compliant,
    notifications_on_time_rate: onTimeRate,
    outstanding_recommendations: outstandingRecommendations,
  };

  // ── Alerts ──────────────────────────────────────────────────────────────────

  const alerts: RegulatoryAlert[] = [];

  // Critical: Reg 44 visit overdue
  if (reg44StatusValue === "overdue") {
    alerts.push({
      severity: "critical",
      message: `Reg 44 visit is overdue — next visit was due ${nextVisitDue}. An independent person must visit at least once every month.`,
    });
  }

  // Critical: Notification not sent within 24 hours
  if (pendingNotifications > 0 || overdueNotifications > 0) {
    const count = pendingNotifications + overdueNotifications;
    alerts.push({
      severity: "critical",
      message: `${count} notifiable event${count > 1 ? "s" : ""} ${count > 1 ? "have" : "has"} not been reported to Ofsted within 24 hours as required by Reg 40.`,
    });
  }

  // High: Reg 45 report overdue
  if (reg45StatusValue === "overdue") {
    alerts.push({
      severity: "high",
      message: `Reg 45 quality of care review is overdue — was due ${reg45NextDue}. The review must be completed every 6 months.`,
    });
  }

  // High: Reg 44 visit due within 3 days
  if (daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3) {
    alerts.push({
      severity: "high",
      message: `Reg 44 visit due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""} (${nextVisitDue}). Ensure the independent visitor is confirmed.`,
    });
  }

  // Medium: Outstanding recommendations > 5
  if (outstandingRecommendations > 5) {
    alerts.push({
      severity: "medium",
      message: `${outstandingRecommendations} outstanding recommendations from Reg 44 visits remain unresolved. Action required before next inspection.`,
    });
  }

  // Medium: Reg 45 progress below 50% with due date within 30 days
  if (
    reg45DaysUntilDue !== null &&
    reg45DaysUntilDue >= 0 &&
    reg45DaysUntilDue <= 30 &&
    currentProgress < 50
  ) {
    alerts.push({
      severity: "medium",
      message: `Reg 45 report is only ${currentProgress}% complete with ${reg45DaysUntilDue} days until the deadline. Accelerate progress to ensure timely submission.`,
    });
  }

  // Low: Reg 44 visits below 12 in last 12 months
  if (!reg44Compliant && reg44InLast12.length > 0) {
    alerts.push({
      severity: "low",
      message: `Only ${reg44InLast12.length} Reg 44 visit${reg44InLast12.length !== 1 ? "s" : ""} recorded in the last 12 months. 12 monthly visits are required for full compliance.`,
    });
  }

  // ── Insights ────────────────────────────────────────────────────────────────

  const insights: CaraRegulatoryInsight[] = [];

  // Critical: Overdue notifications
  const lateNotifications = notifications.filter(
    (n) => !n.notified_within_24h && (n.status === "pending" || n.status === "overdue" || n.status === "notified")
  );
  if (lateNotifications.length > 0) {
    insights.push({
      severity: "critical",
      text: `${lateNotifications.length} notification${lateNotifications.length > 1 ? "s were" : " was"} not sent to Ofsted within 24 hours. Reg 40 requires immediate notification — any delay is a compliance breach that will be identified at inspection.`,
    });
  }

  // Warning: Reg 44 compliance at risk
  if (!reg44Compliant && reg44InLast12.length >= 9) {
    const remaining = 12 - reg44InLast12.length;
    insights.push({
      severity: "warning",
      text: `Reg 44 compliance is at risk — ${remaining} more visit${remaining !== 1 ? "s" : ""} needed in the next few months to achieve 12 monthly visits. Schedule visits promptly to maintain compliance.`,
    });
  }

  // Warning: Outstanding recommendations growing
  if (outstandingRecommendations > 3) {
    insights.push({
      severity: "warning",
      text: `${outstandingRecommendations} outstanding recommendations require action. Unresolved recommendations will be noted by the independent visitor at the next Reg 44 visit and may indicate poor follow-through at inspection.`,
    });
  }

  // Positive: Full Reg 44 compliance
  if (reg44Compliant) {
    insights.push({
      severity: "positive",
      text: "Full Reg 44 compliance achieved — 12 monthly independent visits completed in the last 12 months. This demonstrates strong governance and independent scrutiny.",
    });
  }

  // Positive: All notifications sent within 24 hours
  if (totalNotifications > 0 && notifiedOnTime === totalNotifications) {
    insights.push({
      severity: "positive",
      text: "All notifiable events have been reported to Ofsted within 24 hours. Excellent Reg 40 compliance demonstrates robust notification procedures.",
    });
  }

  // Positive: All recommendations completed from last report
  if (sortedByVisitDate.length > 0) {
    const lastReport = sortedByVisitDate[0];
    if (
      lastReport.recommendations_count > 0 &&
      lastReport.recommendations_completed === lastReport.recommendations_count
    ) {
      insights.push({
        severity: "positive",
        text: "All recommendations from the most recent Reg 44 report have been completed. This evidences responsive management and continuous improvement.",
      });
    }
  }

  return {
    overview,
    reg44_status: reg44Status,
    reg45_status: reg45Status,
    notification_compliance: notificationCompliance,
    recommendation_tracker: recommendationTracker,
    alerts,
    insights,
  };
}
