// ══════════════════════════════════════════════════════════════════════════════
// CARA — RESTRAINT & PHYSICAL INTERVENTION INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses restraint frequency, duration, patterns, de-escalation, debrief
// compliance, review completion, injury tracking, and workforce readiness.
//
// Regulatory: Reg 20 (Use of restraint — minimum force, last resort),
// Reg 35 (Behaviour management — positive strategies, records),
// Children's Homes Regulations 2015 + Ofsted SCCIF: Safety domain.
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildInput {
  id: string;
  name: string;
}

export type RestraintReason = "imminent_harm_to_self" | "imminent_harm_to_others" | "significant_damage" | "absconding_danger";
export type RestraintType = "planned_hold" | "standing_hold" | "seated_hold" | "ground_hold" | "wrap_hold" | "escort" | "other";
export type ReviewStatus = "pending" | "reviewed" | "referred";

export interface StaffInvolvedInput {
  staff_id: string;
  role: "lead" | "support" | "witness";
  team_teach_trained: boolean;
}

export interface InjuryInput {
  person: string; // child name or staff name
  description: string;
}

export interface RestraintInput {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  child_id: string;
  staff_involved: StaffInvolvedInput[];
  reason: RestraintReason;
  restraint_type: RestraintType;
  de_escalation_attempts: string[];
  injuries: InjuryInput[];
  child_debriefed: boolean;
  staff_debriefed: boolean;
  review_status: ReviewStatus;
  body_map_completed: boolean;
  medical_check_completed: boolean;
  notifications_sent: number; // count of parties notified
}

export interface RestraintIntelligenceInput {
  children: ChildInput[];
  restraints: RestraintInput[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface RestraintOverview {
  total_incidents_30d: number;
  total_incidents_90d: number;
  avg_duration_minutes: number;
  max_duration_minutes: number;
  children_involved_30d: number;
  incidents_with_injury: number;
  // null on every rate below = no restraint records in the window, so practice
  // quality is unmeasured — not perfect
  child_debrief_rate: number | null;      // 0-100
  staff_debrief_rate: number | null;      // 0-100
  review_completion_rate: number | null;  // 0-100
  body_map_rate: number | null;           // 0-100
  de_escalation_documented_rate: number | null; // 0-100
  team_teach_compliance_rate: number | null;    // 0-100
}

export interface ChildRestraintProfile {
  child_id: string;
  child_name: string;
  total_incidents_30d: number;
  total_incidents_90d: number;
  avg_duration: number;
  primary_reason: RestraintReason | null;
  primary_type: RestraintType | null;
  injuries_count: number;
  debriefed_rate: number | null;
  frequency_trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
}

export interface ReasonBreakdown {
  reason: RestraintReason;
  count: number;
  percentage: number;
}

export interface TypeBreakdown {
  type: RestraintType;
  count: number;
  percentage: number;
}

export interface TimePattern {
  period: string;
  count: number;
}

export interface RestraintAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraRestraintInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface RestraintIntelligenceResult {
  overview: RestraintOverview;
  child_profiles: ChildRestraintProfile[];
  reason_breakdown: ReasonBreakdown[];
  type_breakdown: TypeBreakdown[];
  time_patterns: TimePattern[];
  alerts: RestraintAlert[];
  insights: CaraRestraintInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function majority<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  const counts = new Map<T, number>();
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T = arr[0];
  let bestCount = 0;
  for (const [val, cnt] of counts) {
    if (cnt > bestCount) { best = val; bestCount = cnt; }
  }
  return best;
}

/** Classify hour into time period */
export function getTimePeriod(time: string): string {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour >= 6 && hour < 12) return "Morning (6-12)";
  if (hour >= 12 && hour < 17) return "Afternoon (12-17)";
  if (hour >= 17 && hour < 21) return "Evening (17-21)";
  return "Night (21-6)";
}

/** Compute frequency trend: compare last 15d vs prior 15d within 30d window */
export function computeFrequencyTrend(
  incidents: RestraintInput[],
  today: string,
): "increasing" | "stable" | "decreasing" | "insufficient_data" {
  const recent = incidents.filter((r) => daysBetween(r.date, today) <= 15);
  const prior = incidents.filter((r) => {
    const d = daysBetween(r.date, today);
    return d > 15 && d <= 30;
  });

  if (recent.length + prior.length < 2) return "insufficient_data";
  if (recent.length > prior.length) return "increasing";
  if (recent.length < prior.length) return "decreasing";
  return "stable";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeRestraintIntelligence(input: RestraintIntelligenceInput): RestraintIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { children, restraints } = input;

  const within30d = restraints.filter((r) => daysBetween(r.date, today) <= 30);
  const within90d = restraints.filter((r) => daysBetween(r.date, today) <= 90);

  // ── Overview ──────────────────────────────────────────────────────────
  const durations90d = within90d.map((r) => r.duration_minutes);
  const childrenInvolved30d = new Set(within30d.map((r) => r.child_id)).size;

  const withInjury = within90d.filter((r) => r.injuries.length > 0).length;
  const childDebrief = within90d.filter((r) => r.child_debriefed).length;
  const staffDebrief = within90d.filter((r) => r.staff_debriefed).length;
  const reviewed = within90d.filter((r) => r.review_status === "reviewed" || r.review_status === "referred").length;
  const bodyMaps = within90d.filter((r) => r.body_map_completed).length;
  const deEscDoc = within90d.filter((r) => r.de_escalation_attempts.length > 0).length;

  // Team Teach compliance: all staff involved in all incidents must be trained
  const allStaff = within90d.flatMap((r) => r.staff_involved);
  const trainedStaff = allStaff.filter((s) => s.team_teach_trained).length;

  const total90d = within90d.length;
  const pct = (n: number) => rate(n, total90d);

  const overview: RestraintOverview = {
    total_incidents_30d: within30d.length,
    total_incidents_90d: total90d,
    avg_duration_minutes: Math.round(average(durations90d) * 10) / 10,
    max_duration_minutes: durations90d.length > 0 ? Math.max(...durations90d) : 0,
    children_involved_30d: childrenInvolved30d,
    incidents_with_injury: withInjury,
    child_debrief_rate: pct(childDebrief),
    staff_debrief_rate: pct(staffDebrief),
    review_completion_rate: pct(reviewed),
    body_map_rate: pct(bodyMaps),
    de_escalation_documented_rate: pct(deEscDoc),
    team_teach_compliance_rate: rate(trainedStaff, allStaff.length),
  };

  // ── Child Profiles ────────────────────────────────────────────────────
  const childrenWithIncidents = new Set(within90d.map((r) => r.child_id));
  const child_profiles: ChildRestraintProfile[] = children
    .filter((c) => childrenWithIncidents.has(c.id))
    .map((child) => {
      const childIncidents90d = within90d.filter((r) => r.child_id === child.id);
      const childIncidents30d = within30d.filter((r) => r.child_id === child.id);

      const reasons = childIncidents90d.map((r) => r.reason);
      const types = childIncidents90d.map((r) => r.restraint_type);
      const injuryCount = childIncidents90d.filter((r) => r.injuries.length > 0).length;
      const debriefed = childIncidents90d.filter((r) => r.child_debriefed).length;

      return {
        child_id: child.id,
        child_name: child.name,
        total_incidents_30d: childIncidents30d.length,
        total_incidents_90d: childIncidents90d.length,
        avg_duration: Math.round(average(childIncidents90d.map((r) => r.duration_minutes)) * 10) / 10,
        primary_reason: majority(reasons),
        primary_type: majority(types),
        injuries_count: injuryCount,
        debriefed_rate: rate(debriefed, childIncidents90d.length),
        frequency_trend: computeFrequencyTrend(childIncidents90d.filter((r) => daysBetween(r.date, today) <= 30), today),
      };
    });

  // ── Reason Breakdown ──────────────────────────────────────────────────
  const reasonCounts = new Map<RestraintReason, number>();
  for (const r of within90d) {
    reasonCounts.set(r.reason, (reasonCounts.get(r.reason) ?? 0) + 1);
  }
  const reason_breakdown: ReasonBreakdown[] = [...reasonCounts.entries()]
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: total90d > 0 ? Math.round((count / total90d) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Type Breakdown ────────────────────────────────────────────────────
  const typeCounts = new Map<RestraintType, number>();
  for (const r of within90d) {
    typeCounts.set(r.restraint_type, (typeCounts.get(r.restraint_type) ?? 0) + 1);
  }
  const type_breakdown: TypeBreakdown[] = [...typeCounts.entries()]
    .map(([type, count]) => ({
      type,
      count,
      percentage: total90d > 0 ? Math.round((count / total90d) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Time Patterns ─────────────────────────────────────────────────────
  const periodCounts = new Map<string, number>();
  for (const r of within90d) {
    const period = getTimePeriod(r.start_time);
    periodCounts.set(period, (periodCounts.get(period) ?? 0) + 1);
  }
  const time_patterns: TimePattern[] = [...periodCounts.entries()]
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => b.count - a.count);

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: RestraintAlert[] = [];

  // Critical: high frequency for single child (3+ in 30d)
  for (const profile of child_profiles) {
    if (profile.total_incidents_30d >= 3) {
      alerts.push({
        severity: "critical",
        message: `${profile.child_name} has had ${profile.total_incidents_30d} restraints in 30 days — urgent behaviour support plan review required`,
      });
    }
  }

  // Critical: restraint with injury not reviewed
  const injuryUnreviewed = within90d.filter(
    (r) => r.injuries.length > 0 && r.review_status === "pending",
  );
  if (injuryUnreviewed.length > 0) {
    alerts.push({
      severity: "critical",
      message: `${injuryUnreviewed.length} restraint${injuryUnreviewed.length > 1 ? "s" : ""} resulting in injury still pending review — requires immediate management attention`,
    });
  }

  // High: child not debriefed
  const notDebriefed = within90d.filter((r) => !r.child_debriefed);
  if (notDebriefed.length > 0) {
    alerts.push({
      severity: "high",
      message: `${notDebriefed.length} incident${notDebriefed.length > 1 ? "s" : ""} where child was not debriefed — debrief is essential for therapeutic recovery`,
    });
  }

  // Medium: reviews pending
  const pendingReviews = within90d.filter((r) => r.review_status === "pending");
  if (pendingReviews.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${pendingReviews.length} restraint review${pendingReviews.length > 1 ? "s" : ""} pending management sign-off`,
    });
  }

  // Medium: untrained staff involved
  const untrainedIncidents = within90d.filter(
    (r) => r.staff_involved.some((s) => !s.team_teach_trained),
  );
  if (untrainedIncidents.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${untrainedIncidents.length} incident${untrainedIncidents.length > 1 ? "s" : ""} involved staff without current Team Teach certification`,
    });
  }

  // Low: increasing trend
  for (const profile of child_profiles) {
    if (profile.frequency_trend === "increasing") {
      alerts.push({
        severity: "low",
        message: `${profile.child_name}'s restraint frequency is increasing — consider proactive behaviour support strategies`,
      });
    }
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraRestraintInsight[] = [];

  // Critical: high restraint frequency
  if (within30d.length >= 5) {
    insights.push({
      severity: "critical",
      text: `${within30d.length} physical interventions in 30 days. Reg 20 requires restraint as absolute last resort. High frequency may indicate inadequate behaviour support plans, environmental triggers, or staffing issues. Conduct urgent multi-disciplinary review.`,
    });
  }

  // Warning: injuries sustained
  if (withInjury > 0) {
    insights.push({
      severity: "warning",
      text: `${withInjury} restraint${withInjury > 1 ? "s" : ""} resulted in injury in 90 days. Each injury must be recorded on body maps, medically assessed where appropriate, and reported to placing authorities. Review technique application and training needs.`,
    });
  }

  // Warning: low debrief rate
  if (total90d >= 2 && below(overview.child_debrief_rate, 100)) {
    insights.push({
      severity: "warning",
      text: `Child debrief rate is ${formatRate(overview.child_debrief_rate)}. Every child must be offered a debrief following physical intervention to process the experience therapeutically. Lack of debrief compounds trauma and reduces trust.`,
    });
  }

  // Warning: untrained staff
  if (below(overview.team_teach_compliance_rate, 100)) {
    insights.push({
      severity: "warning",
      text: `Team Teach compliance is ${formatRate(overview.team_teach_compliance_rate)}. All staff involved in physical intervention must hold current certification. Untrained staff increase risk of harm and regulatory non-compliance.`,
    });
  }

  // Positive: all debriefs completed
  if (total90d >= 2 && meets(overview.child_debrief_rate, 100) && meets(overview.staff_debrief_rate, 100)) {
    insights.push({
      severity: "positive",
      text: `100% debrief completion for both children and staff. This demonstrates trauma-informed practice and commitment to therapeutic recovery following physical intervention.`,
    });
  }

  // Positive: decreasing trend
  const allDecreasing = child_profiles.every(
    (p) => p.frequency_trend === "decreasing" || p.frequency_trend === "insufficient_data",
  );
  if (child_profiles.length > 0 && child_profiles.some((p) => p.frequency_trend === "decreasing") && allDecreasing) {
    insights.push({
      severity: "positive",
      text: `Restraint frequency is decreasing. This suggests effective behaviour support strategies, improved de-escalation skills, and better understanding of children's triggers.`,
    });
  }

  // Positive: zero restraints in 30d
  if (children.length > 0 && within30d.length === 0 && within90d.length > 0) {
    insights.push({
      severity: "positive",
      text: `No physical interventions in the last 30 days, down from ${within90d.length} in 90 days. Strong evidence of effective positive behaviour support.`,
    });
  }

  // Positive: all reviews complete
  if (total90d >= 2 && meets(overview.review_completion_rate, 100)) {
    insights.push({
      severity: "positive",
      text: `All ${total90d} restraint records have been reviewed by management. This demonstrates robust oversight and accountability under Reg 35.`,
    });
  }

  return {
    overview,
    child_profiles,
    reason_breakdown,
    type_breakdown,
    time_patterns,
    alerts,
    insights,
  };
}
