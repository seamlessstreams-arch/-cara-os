// ══════════════════════════════════════════════════════════════════════════════
// CARA — SUPERVISION & STAFF DEVELOPMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses supervision frequency, timeliness, action completion, staff
// wellbeing trends, training compliance, and professional development.
//
// Regulatory: Reg 33 (Employment of staff — supervision requirements),
// Reg 32 (Fitness of workers — training), Reg 29 (RM qualifications).
// SCCIF: Leadership & Management — "Are staff supervised and supported?"
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meanOf, meets, rateOf } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StaffInput {
  id: string;
  name: string;
  role: string;
}

export type SupervisionType = "formal" | "informal" | "group" | "reflective_practice" | "probation_review";
export type SupervisionStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";
export type TrainingStatus = "compliant" | "expiring_soon" | "expired" | "not_started";

export interface SupervisionActionInput {
  description: string;
  owner: string;
  due_date: string;
  status: "pending" | "completed";
}

export interface SupervisionInput {
  id: string;
  staff_id: string;
  supervisor_id: string;
  type: SupervisionType;
  scheduled_date: string;
  actual_date: string | null;
  duration_minutes: number | null;
  status: SupervisionStatus;
  actions_agreed: SupervisionActionInput[];
  wellbeing_score: number | null; // 1-10
  next_date: string | null;
}

export interface TrainingInput {
  id: string;
  staff_id: string;
  course_name: string;
  category: string;
  status: TrainingStatus;
  is_mandatory: boolean;
  expiry_date: string | null;
  completed_date: string | null;
}

export interface SupervisionIntelligenceInput {
  staff: StaffInput[];
  supervisions: SupervisionInput[];
  training: TrainingInput[];
  today?: string; // ISO date — injectable for deterministic tests
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface SupervisionOverview {
  total_staff: number;
  supervisions_completed_90d: number;
  supervisions_overdue: number;
  // Every rate/average below is null when nothing has been recorded to measure.
  avg_days_between_supervisions: number | null;
  avg_wellbeing_score: number | null;
  action_completion_rate: number | null;  // 0-100
  training_compliance_rate: number | null; // 0-100
  mandatory_training_compliance: number | null; // 0-100
}

export interface StaffSupervisionProfile {
  staff_id: string;
  staff_name: string;
  role: string;
  supervisions_90d: number;
  last_supervision_date: string | null;
  last_supervision_days_ago: number;
  next_supervision_date: string | null;
  next_supervision_in_days: number;
  avg_wellbeing: number | null;   // null when no wellbeing score has been recorded
  wellbeing_trend: "improving" | "stable" | "declining" | "insufficient_data";
  actions_pending: number;
  actions_overdue: number;
  training_status: "compliant" | "expiring" | "non_compliant";
  compliance_status: "on_track" | "due_soon" | "overdue";
}

export interface WellbeingAnalysis {
  avg_score: number | null;
  lowest_score_staff: string | null;
  highest_score_staff: string | null;
  staff_below_threshold: number; // wellbeing <= 5
  trend: "improving" | "stable" | "declining" | "insufficient_data";
}

export interface TrainingComplianceSummary {
  total_records: number;
  compliant: number;
  expiring_soon: number;
  expired: number;
  not_started: number;
  mandatory_compliant: number;
  mandatory_total: number;
}

export interface SupervisionAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraSupervisionInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface SupervisionIntelligenceResult {
  overview: SupervisionOverview;
  staff_profiles: StaffSupervisionProfile[];
  wellbeing: WellbeingAnalysis;
  training_compliance: TrainingComplianceSummary;
  alerts: SupervisionAlert[];
  insights: CaraSupervisionInsight[];
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

/** Mean to one decimal place, or null when nothing has been scored. */
export function averageOrNull(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return Math.round(average(arr) * 10) / 10;
}

/**
 * Supervision compliance: Reg 33 requires formal supervision at least monthly.
 * We consider overdue if no supervision in 35+ days.
 */
export function computeSupervisionCompliance(
  nextDate: string | null,
  lastDate: string | null,
  today: string,
): "on_track" | "due_soon" | "overdue" {
  // If next_date is set, use that
  if (nextDate) {
    const daysLeft = daysUntil(today, nextDate);
    if (daysLeft < -7) return "overdue"; // more than 7 days past scheduled
    if (daysLeft < 0) return "due_soon"; // past but within grace
    if (daysLeft <= 7) return "due_soon";
    return "on_track";
  }
  // Fallback: use last_date + 30 days
  if (lastDate) {
    const daysSince = daysBetween(lastDate, today);
    if (daysSince > 35) return "overdue";
    if (daysSince > 25) return "due_soon";
    return "on_track";
  }
  return "overdue"; // no supervision history
}

/** Determine wellbeing trend from last two scores */
export function computeWellbeingTrend(
  scores: number[],
): "improving" | "stable" | "declining" | "insufficient_data" {
  if (scores.length < 2) return "insufficient_data";
  const recent = scores[scores.length - 1];
  const previous = scores[scores.length - 2];
  if (recent > previous) return "improving";
  if (recent < previous) return "declining";
  return "stable";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeSupervisionIntelligence(input: SupervisionIntelligenceInput): SupervisionIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { staff, supervisions, training } = input;

  const completed = supervisions.filter((s) => s.status === "completed");
  const completed90d = completed.filter((s) => s.actual_date && daysBetween(s.actual_date, today) <= 90);

  // ── Staff Profiles ─────────────────────────────────────────────────────
  const staff_profiles: StaffSupervisionProfile[] = staff.map((member) => {
    const memberSups = completed.filter((s) => s.staff_id === member.id);
    const member90d = completed90d.filter((s) => s.staff_id === member.id);
    const memberScheduled = supervisions.filter(
      (s) => s.staff_id === member.id && s.status === "scheduled",
    );

    // Last supervision
    const sorted = [...memberSups].sort((a, b) => (b.actual_date ?? "").localeCompare(a.actual_date ?? ""));
    const last = sorted[0];
    const lastDate = last?.actual_date ?? null;
    const lastDaysAgo = lastDate ? daysBetween(lastDate, today) : 999;

    // Next scheduled
    const nextScheduled = memberScheduled
      .filter((s) => s.scheduled_date >= today)
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0];
    const nextDate = nextScheduled?.scheduled_date ?? last?.next_date ?? null;
    const nextInDays = nextDate ? daysUntil(today, nextDate) : -999;

    // Wellbeing
    const wellbeingScores = memberSups
      .filter((s) => s.wellbeing_score != null)
      .sort((a, b) => (a.actual_date ?? "").localeCompare(b.actual_date ?? ""))
      .map((s) => s.wellbeing_score!);
    const avgWellbeing = averageOrNull(wellbeingScores);

    // Actions
    const allActions = memberSups.flatMap((s) => s.actions_agreed);
    const pending = allActions.filter((a) => a.status === "pending");
    const overdue = pending.filter((a) => a.due_date < today);

    // Training
    const memberTraining = training.filter((t) => t.staff_id === member.id);
    const mandatoryTraining = memberTraining.filter((t) => t.is_mandatory);
    const mandatoryNonCompliant = mandatoryTraining.filter(
      (t) => t.status === "expired" || t.status === "not_started",
    );
    const trainingStatus: "compliant" | "expiring" | "non_compliant" =
      mandatoryNonCompliant.length > 0
        ? "non_compliant"
        : mandatoryTraining.some((t) => t.status === "expiring_soon")
        ? "expiring"
        : "compliant";

    return {
      staff_id: member.id,
      staff_name: member.name,
      role: member.role,
      supervisions_90d: member90d.length,
      last_supervision_date: lastDate,
      last_supervision_days_ago: lastDaysAgo,
      next_supervision_date: nextDate,
      next_supervision_in_days: nextInDays,
      avg_wellbeing: avgWellbeing,
      wellbeing_trend: computeWellbeingTrend(wellbeingScores),
      actions_pending: pending.length,
      actions_overdue: overdue.length,
      training_status: trainingStatus,
      compliance_status: computeSupervisionCompliance(nextDate, lastDate, today),
    };
  });

  // ── Overview ──────────────────────────────────────────────────────────
  // Avg days between supervisions (per staff)
  const intervalsByStaff: number[] = [];
  for (const member of staff) {
    const memberCompleted = completed
      .filter((s) => s.staff_id === member.id && s.actual_date)
      .sort((a, b) => (a.actual_date!).localeCompare(b.actual_date!));
    for (let i = 1; i < memberCompleted.length; i++) {
      intervalsByStaff.push(daysBetween(memberCompleted[i - 1].actual_date!, memberCompleted[i].actual_date!));
    }
  }

  const allActions = completed.flatMap((s) => s.actions_agreed);
  const completedActions = allActions.filter((a) => a.status === "completed");

  const wellbeingScoresAll = completed
    .filter((s) => s.wellbeing_score != null)
    .map((s) => s.wellbeing_score!);

  // Training compliance
  const mandatoryTraining = training.filter((t) => t.is_mandatory);
  const mandatoryCompliant = mandatoryTraining.filter((t) => t.status === "compliant" || t.status === "expiring_soon");
  const allCompliant = training.filter((t) => t.status === "compliant" || t.status === "expiring_soon");

  const overdueStaff = staff_profiles.filter((p) => p.compliance_status === "overdue");

  const overview: SupervisionOverview = {
    total_staff: staff.length,
    supervisions_completed_90d: completed90d.length,
    supervisions_overdue: overdueStaff.length,
    // A staff member needs two supervisions before an interval exists at all.
    avg_days_between_supervisions: intervalsByStaff.length > 0 ? Math.round(average(intervalsByStaff)) : null,
    avg_wellbeing_score: averageOrNull(wellbeingScoresAll),
    action_completion_rate: rateOf(completedActions, allActions),
    training_compliance_rate: rateOf(allCompliant, training),
    mandatory_training_compliance: rateOf(mandatoryCompliant, mandatoryTraining),
  };

  // ── Wellbeing Analysis ────────────────────────────────────────────────
  const staffWellbeingAvgs = staff_profiles
    .filter((p): p is StaffSupervisionProfile & { avg_wellbeing: number } => p.avg_wellbeing !== null)
    .sort((a, b) => a.avg_wellbeing - b.avg_wellbeing);

  const belowThreshold = staffWellbeingAvgs.filter((p) => p.avg_wellbeing <= 5);

  // Overall trend from last two completed supervisions (across all staff)
  const sortedCompleted = [...completed]
    .filter((s) => s.wellbeing_score != null)
    .sort((a, b) => (a.actual_date ?? "").localeCompare(b.actual_date ?? ""));
  const overallScores = sortedCompleted.map((s) => s.wellbeing_score!);

  const wellbeing: WellbeingAnalysis = {
    avg_score: averageOrNull(wellbeingScoresAll),
    lowest_score_staff: staffWellbeingAvgs[0]?.staff_name ?? null,
    highest_score_staff: staffWellbeingAvgs[staffWellbeingAvgs.length - 1]?.staff_name ?? null,
    staff_below_threshold: belowThreshold.length,
    trend: computeWellbeingTrend(overallScores.slice(-5)),
  };

  // ── Training Compliance Summary ───────────────────────────────────────
  const training_compliance: TrainingComplianceSummary = {
    total_records: training.length,
    compliant: training.filter((t) => t.status === "compliant").length,
    expiring_soon: training.filter((t) => t.status === "expiring_soon").length,
    expired: training.filter((t) => t.status === "expired").length,
    not_started: training.filter((t) => t.status === "not_started").length,
    mandatory_compliant: mandatoryCompliant.length,
    mandatory_total: mandatoryTraining.length,
  };

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: SupervisionAlert[] = [];

  // Critical: supervision overdue for staff
  for (const p of overdueStaff) {
    alerts.push({
      severity: "critical",
      message: `${p.staff_name}'s supervision is overdue (last: ${p.last_supervision_days_ago < 999 ? `${p.last_supervision_days_ago} days ago` : "never"}) — schedule immediately`,
    });
  }

  // High: staff wellbeing concern (score ≤ 5)
  if (belowThreshold.length > 0) {
    for (const p of belowThreshold) {
      alerts.push({
        severity: "high",
        message: `${p.staff_name} average wellbeing score is ${p.avg_wellbeing}/10 — explore support needs`,
      });
    }
  }

  // Medium: training expired
  const expiredTraining = training.filter((t) => t.status === "expired" && t.is_mandatory);
  if (expiredTraining.length > 0) {
    const staffWithExpired = new Set(expiredTraining.map((t) => t.staff_id)).size;
    alerts.push({
      severity: "medium",
      message: `${expiredTraining.length} mandatory training record${expiredTraining.length > 1 ? "s" : ""} expired across ${staffWithExpired} staff member${staffWithExpired > 1 ? "s" : ""}`,
    });
  }

  // Medium: actions overdue
  const allPending = allActions.filter((a) => a.status === "pending" && a.due_date < today);
  if (allPending.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${allPending.length} supervision action${allPending.length > 1 ? "s" : ""} overdue — review at next session`,
    });
  }

  // Low: supervision due soon
  const dueSoon = staff_profiles.filter((p) => p.compliance_status === "due_soon");
  if (dueSoon.length > 0) {
    alerts.push({
      severity: "low",
      message: `${dueSoon.length} supervision${dueSoon.length > 1 ? "s" : ""} due within 7 days — prepare agendas`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraSupervisionInsight[] = [];

  // Critical: overdue supervision
  if (overdueStaff.length > 0) {
    insights.push({
      severity: "critical",
      text: `${overdueStaff.length} staff member${overdueStaff.length > 1 ? "s" : ""} ${overdueStaff.length > 1 ? "have" : "has"} overdue supervision. Reg 33 requires regular supervision of all staff. Ofsted inspectors will check supervision records — prioritise scheduling immediately.`,
    });
  }

  // Warning: declining wellbeing
  const decliningWellbeing = staff_profiles.filter((p) => p.wellbeing_trend === "declining");
  if (decliningWellbeing.length > 0) {
    const names = decliningWellbeing.map((p) => p.staff_name).join(", ");
    insights.push({
      severity: "warning",
      text: `${names} showing declining wellbeing scores. Monitor for burnout indicators, review workload, and consider whether additional support or occupational health referral is needed.`,
    });
  }

  // Warning: low training compliance
  if (mandatoryTraining.length >= 3 && below(overview.mandatory_training_compliance, 80)) {
    insights.push({
      severity: "warning",
      text: `Mandatory training compliance is ${formatRate(overview.mandatory_training_compliance)}. Non-compliance creates regulatory risk under Reg 32. Review training schedule and remove barriers to completion.`,
    });
  }

  // Warning: no mandatory training recorded at all — silence is the finding
  if (staff.length > 0 && mandatoryTraining.length === 0) {
    insights.push({
      severity: "warning",
      text: `No mandatory training records held for any of the ${staff.length} staff. Compliance with Reg 32 cannot be evidenced from an empty training register — inspectors treat missing evidence as a gap, not a pass.`,
    });
  }

  // Positive: all supervisions current
  if (staff.length > 0 && overdueStaff.length === 0 && dueSoon.length === 0) {
    insights.push({
      severity: "positive",
      text: `All ${staff.length} staff members have current supervision. This demonstrates strong leadership oversight and commitment to staff development under Reg 33.`,
    });
  }

  // Positive: high wellbeing
  if (wellbeingScoresAll.length >= 3 && meets(wellbeing.avg_score, 7.5)) {
    insights.push({
      severity: "positive",
      text: `Average staff wellbeing score is ${wellbeing.avg_score}/10. High wellbeing correlates with better care quality, lower turnover, and improved outcomes for children.`,
    });
  }

  // Positive: high action completion
  if (allActions.length >= 3 && meets(overview.action_completion_rate, 80)) {
    insights.push({
      severity: "positive",
      text: `Supervision action completion rate is ${formatRate(overview.action_completion_rate)}. Strong follow-through demonstrates accountable management and genuine professional development.`,
    });
  }

  return {
    overview,
    staff_profiles,
    wellbeing,
    training_compliance,
    alerts,
    insights,
  };
}
