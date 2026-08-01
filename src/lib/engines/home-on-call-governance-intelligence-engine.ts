// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ON-CALL GOVERNANCE INTELLIGENCE ENGINE
// Pure deterministic engine: on-call coverage, response, escalation governance.
// CHR 2015 Reg 33(4)(b): "Systems for out-of-hours management support."
// SCCIF: "The home has robust on-call and emergency arrangements."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface OnCallCallInput {
  datetime: string;
  from_contact: string;
  call_type: string;                   // routine | advisory | critical
  duration_mins: number;
  outcome: string;
  escalated: boolean;
}

export interface OnCallShiftInput {
  id: string;
  date_from: string;                   // ISO datetime
  date_to: string;                     // ISO datetime
  role: string;                        // first_line_rm | second_line_deputy | senior_practitioner_cover
  on_call_staff: string;
  backup_staff: string;
  calls_received: OnCallCallInput[];
  critical_incidents_handled: number;
  routine_calls_handled: number;
  advisory_calls_handled: number;
  feedback_on_arrangements: string;
  review_notes: string;
}

export interface HomeOnCallGovernanceInput {
  today: string;                       // YYYY-MM-DD
  on_call_shifts: OnCallShiftInput[];
  total_staff: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type OnCallRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CoverageProfile {
  total_shifts: number;
  shifts_last_14_days: number;
  shifts_last_30_days: number;
  unique_on_call_staff: number;
  has_backup_rate: number | null;             // % of shifts with backup assigned
  role_distribution: Record<string, number>;
}

export interface ResponseProfile {
  total_calls: number;
  critical_calls: number;
  routine_calls: number;
  advisory_calls: number;
  escalated_calls: number;
  avg_call_duration: number;
  calls_per_shift: number | null;
}

export interface QualityProfile {
  shifts_with_feedback: number;
  shifts_with_review_notes: number;
  feedback_rate: number | null;               // % of completed shifts with feedback
}

export interface WorkloadProfile {
  critical_incidents_total: number;
  routine_total: number;
  advisory_total: number;
  busiest_shift_calls: number | null;
  quiet_shifts: number;                // 0 calls
}

export interface Insight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface Recommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string | null;
}

export interface HomeOnCallGovernanceResult {
  on_call_rating: OnCallRating;
  on_call_score: number | null;
  headline: string;
  coverage: CoverageProfile;
  response: ResponseProfile;
  quality: QualityProfile;
  workload: WorkloadProfile;
  strengths: string[];
  concerns: string[];
  recommendations: Recommendation[];
  insights: Insight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function ratingFromScore(score: number): OnCallRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeOnCallGovernance(
  input: HomeOnCallGovernanceInput,
): HomeOnCallGovernanceResult {
  const { today, on_call_shifts, total_staff } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_staff === 0 || on_call_shifts.length === 0) {
    return {
      on_call_rating: "insufficient_data",
      on_call_score: 0,
      headline: total_staff === 0
        ? "No active staff registered."
        : "No on-call shifts recorded.",
      coverage: {
        total_shifts: 0, shifts_last_14_days: 0, shifts_last_30_days: 0,
        unique_on_call_staff: 0, has_backup_rate: 0, role_distribution: {},
      },
      response: {
        total_calls: 0, critical_calls: 0, routine_calls: 0,
        advisory_calls: 0, escalated_calls: 0, avg_call_duration: 0,
        calls_per_shift: 0,
      },
      quality: {
        shifts_with_feedback: 0, shifts_with_review_notes: 0, feedback_rate: 0,
      },
      workload: {
        critical_incidents_total: 0, routine_total: 0, advisory_total: 0,
        busiest_shift_calls: 0, quiet_shifts: 0,
      },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Coverage Profile ──────────────────────────────────────────────────
  const todayDate = today.slice(0, 10);
  const last14 = on_call_shifts.filter(
    (s) => daysBetween(s.date_from.slice(0, 10), todayDate) >= 0 &&
           daysBetween(s.date_from.slice(0, 10), todayDate) <= 14,
  );
  const last30 = on_call_shifts.filter(
    (s) => daysBetween(s.date_from.slice(0, 10), todayDate) >= 0 &&
           daysBetween(s.date_from.slice(0, 10), todayDate) <= 30,
  );

  const uniqueStaff = new Set(on_call_shifts.map((s) => s.on_call_staff));
  const withBackup = on_call_shifts.filter(
    (s) => s.backup_staff && s.backup_staff.trim().length > 0,
  );

  const roleDistribution: Record<string, number> = {};
  on_call_shifts.forEach((s) => {
    roleDistribution[s.role] = (roleDistribution[s.role] || 0) + 1;
  });

  const coverage: CoverageProfile = {
    total_shifts: on_call_shifts.length,
    shifts_last_14_days: last14.length,
    shifts_last_30_days: last30.length,
    unique_on_call_staff: uniqueStaff.size,
    has_backup_rate: pct(withBackup.length, on_call_shifts.length),
    role_distribution: roleDistribution,
  };

  // ── Response Profile ──────────────────────────────────────────────────
  const allCalls = on_call_shifts.flatMap((s) => s.calls_received);
  const durations = allCalls.map((c) => c.duration_mins);

  const response: ResponseProfile = {
    total_calls: allCalls.length,
    critical_calls: allCalls.filter((c) => c.call_type === "critical").length,
    routine_calls: allCalls.filter((c) => c.call_type === "routine").length,
    advisory_calls: allCalls.filter((c) => c.call_type === "advisory").length,
    escalated_calls: allCalls.filter((c) => c.escalated).length,
    avg_call_duration: avg(durations),
    calls_per_shift: on_call_shifts.length > 0
      ? Math.round((allCalls.length / on_call_shifts.length) * 10) / 10
      : null,
  };

  // ── Quality Profile ───────────────────────────────────────────────────
  // Only count completed shifts (date_to is in the past)
  const completedShifts = on_call_shifts.filter(
    (s) => daysBetween(s.date_to.slice(0, 10), todayDate) >= 0,
  );
  const withFeedback = completedShifts.filter(
    (s) => s.feedback_on_arrangements && s.feedback_on_arrangements.trim().length > 0,
  );
  const withNotes = completedShifts.filter(
    (s) => s.review_notes && s.review_notes.trim().length > 0,
  );

  const quality: QualityProfile = {
    shifts_with_feedback: withFeedback.length,
    shifts_with_review_notes: withNotes.length,
    feedback_rate: pct(withFeedback.length, completedShifts.length),
  };

  // ── Workload Profile ──────────────────────────────────────────────────
  const shiftCallCounts = on_call_shifts.map((s) => s.calls_received.length);

  const workload: WorkloadProfile = {
    critical_incidents_total: on_call_shifts.reduce((s, sh) => s + sh.critical_incidents_handled, 0),
    routine_total: on_call_shifts.reduce((s, sh) => s + sh.routine_calls_handled, 0),
    advisory_total: on_call_shifts.reduce((s, sh) => s + sh.advisory_calls_handled, 0),
    busiest_shift_calls: shiftCallCounts.length > 0 ? Math.max(...shiftCallCounts) : null,
    quiet_shifts: shiftCallCounts.filter((c) => c === 0).length,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // mod1: Coverage frequency (±4)
  // At least 2 shifts per 14-day period shows consistent coverage
  const mod1 =
    coverage.shifts_last_14_days >= 4 ? 4 :
    coverage.shifts_last_14_days >= 2 ? 2 :
    coverage.shifts_last_14_days >= 1 ? 0 : -4;
  score += mod1;

  // mod2: Backup designation (±4)
  const mod2 =
    (coverage.has_backup_rate ?? 0) >= 90 ? 4 :
    (coverage.has_backup_rate ?? 0) >= 70 ? 2 :
    (coverage.has_backup_rate ?? 0) >= 50 ? 0 : -3;
  score += mod2;

  // mod3: Staff diversity (±3)
  // Multiple people sharing on-call prevents burnout
  const mod3 =
    coverage.unique_on_call_staff >= 3 ? 3 :
    coverage.unique_on_call_staff >= 2 ? 1 : -2;
  score += mod3;

  // mod4: Response documentation (±4)
  // Calls should be documented with outcomes
  const callsWithOutcome = allCalls.filter(
    (c) => c.outcome && c.outcome.trim().length > 0,
  ).length;
  const outcomeRate = pct(callsWithOutcome, allCalls.length);
  const mod4 =
    allCalls.length === 0 ? 0 :
    outcomeRate >= 90 ? 4 :
    outcomeRate >= 70 ? 2 :
    outcomeRate >= 50 ? 0 : -3;
  score += mod4;

  // mod5: Feedback quality (±3)
  const mod5 =
    completedShifts.length === 0 ? 0 :
    (quality.feedback_rate ?? 0) >= 80 ? 3 :
    (quality.feedback_rate ?? 0) >= 50 ? 1 :
    (quality.feedback_rate ?? 0) >= 25 ? 0 : -2;
  score += mod5;

  // mod6: Escalation appropriateness (±3)
  // Critical calls should be escalated; routine should not
  const criticalEscalated = allCalls.filter(
    (c) => c.call_type === "critical" && c.escalated,
  ).length;
  const criticalNotEscalated = allCalls.filter(
    (c) => c.call_type === "critical" && !c.escalated,
  ).length;
  const mod6 =
    response.critical_calls === 0 ? 2 :
    criticalNotEscalated === 0 ? 3 :
    criticalNotEscalated <= 1 ? 0 : -3;
  score += mod6;

  // mod7: Role coverage (±3)
  // Having both first-line and second-line is best practice
  const rolesUsed = Object.keys(roleDistribution).length;
  const mod7 =
    rolesUsed >= 2 ? 3 :
    rolesUsed === 1 ? 0 : -2;
  score += mod7;

  // mod8: Continuity / no gaps (±4)
  // Ratio of on-call shifts to expected (1 per day in 30 days is ideal)
  // But typical: 1 shift covers multiple days (weekday evenings, weekends)
  // Just check that recent coverage exists
  const mod8 =
    coverage.shifts_last_30_days >= 6 ? 4 :
    coverage.shifts_last_30_days >= 4 ? 2 :
    coverage.shifts_last_30_days >= 2 ? 0 : -3;
  score += mod8;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const on_call_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if ((coverage.has_backup_rate ?? 0) >= 90) strengths.push(`${(coverage.has_backup_rate ?? 0)}% of on-call shifts have designated backup — excellent resilience.`);
  if (coverage.unique_on_call_staff >= 2) strengths.push(`${coverage.unique_on_call_staff} different staff members share on-call duties — good distribution.`);
  if (outcomeRate >= 90 && allCalls.length > 0) strengths.push("All on-call responses are documented with clear outcomes.");
  if ((quality.feedback_rate ?? 0) >= 80 && completedShifts.length > 0) strengths.push(`${(quality.feedback_rate ?? 0)}% of shifts have post-shift feedback — reflective practice.`);
  if (response.critical_calls > 0 && criticalNotEscalated === 0) strengths.push("All critical incidents were appropriately escalated.");
  if (rolesUsed >= 2) strengths.push("Both first-line and second-line on-call roles are covered.");
  if (coverage.shifts_last_14_days >= 4) strengths.push("Strong on-call coverage with 4+ shifts in the last 14 days.");
  if (workload.quiet_shifts > 0 && on_call_shifts.length >= 3) strengths.push(`${workload.quiet_shifts} quiet on-call shift(s) — the home runs smoothly out of hours.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (coverage.shifts_last_14_days === 0) concerns.push("No on-call shifts recorded in the last 14 days — potential coverage gap.");
  if ((coverage.has_backup_rate ?? 0) < 50) concerns.push(`Only ${(coverage.has_backup_rate ?? 0)}% of shifts have backup — single point of failure risk.`);
  if (coverage.unique_on_call_staff === 1) concerns.push("Only one person is covering all on-call duties — burnout risk.");
  if (criticalNotEscalated > 0) concerns.push(`${criticalNotEscalated} critical incident(s) were not escalated — governance gap.`);
  if ((quality.feedback_rate ?? 0) < 25 && completedShifts.length >= 2) concerns.push("Very few on-call shifts have post-shift feedback — limited learning.");
  if ((response.calls_per_shift ?? 0) > 3) concerns.push(`Average ${(response.calls_per_shift ?? 0)} calls per shift — high out-of-hours demand.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 0;

  if (coverage.shifts_last_14_days === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Establish on-call cover immediately — no shifts recorded in last 14 days.",
      urgency: "immediate",
      regulatory_ref: "Reg 33(4)(b)",
    });
  }
  if (criticalNotEscalated > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review escalation protocol — critical incidents must be escalated to senior management.",
      urgency: "immediate",
      regulatory_ref: "Reg 33",
    });
  }
  if (coverage.unique_on_call_staff === 1) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Train additional staff for on-call duties to prevent single-person dependency.",
      urgency: "soon",
      regulatory_ref: "Reg 33(4)(b)",
    });
  }
  if ((coverage.has_backup_rate ?? 0) < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure all on-call shifts have a designated backup contact.",
      urgency: "soon",
      regulatory_ref: null,
    });
  }
  if ((quality.feedback_rate ?? 0) < 50 && completedShifts.length >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Introduce mandatory post-shift feedback to capture learning and improve arrangements.",
      urgency: "planned",
      regulatory_ref: null,
    });
  }
  if (rolesUsed < 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Establish second-line on-call cover for escalation and resilience.",
      urgency: "planned",
      regulatory_ref: "Reg 33(4)(b)",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];

  if (workload.critical_incidents_total > 0) {
    insights.push({
      text: `${workload.critical_incidents_total} critical incident(s) handled via on-call — out-of-hours system is being tested in real situations.`,
      severity: workload.critical_incidents_total >= 3 ? "warning" : "positive",
    });
  }
  if (response.escalated_calls > 0 && response.critical_calls > 0) {
    insights.push({
      text: `${response.escalated_calls} call(s) escalated appropriately — governance chain is functioning.`,
      severity: "positive",
    });
  }
  if (coverage.unique_on_call_staff === 1 && on_call_shifts.length >= 3) {
    insights.push({
      text: "All on-call duties fall on one person — this is unsustainable and creates a safeguarding risk if they are unavailable.",
      severity: "critical",
    });
  }
  if ((response.calls_per_shift ?? 0) >= 2) {
    insights.push({
      text: `On average ${response.calls_per_shift} calls per shift — out-of-hours demand is significant.`,
      severity: "warning",
    });
  }
  if (workload.quiet_shifts >= on_call_shifts.length / 2 && on_call_shifts.length >= 3) {
    insights.push({
      text: `${pct(workload.quiet_shifts, on_call_shifts.length)}% of on-call shifts had no calls — the home generally runs smoothly out of hours.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    on_call_rating === "outstanding"
      ? "Exemplary on-call governance — consistent coverage, backup, and documented responses."
      : on_call_rating === "good"
      ? "Good on-call arrangements with minor areas for strengthening."
      : on_call_rating === "adequate"
      ? "On-call system is in place but coverage, documentation, or escalation needs improvement."
      : "On-call governance is inadequate — significant gaps in coverage or escalation.";

  return {
    on_call_rating,
    on_call_score: score,
    headline,
    coverage,
    response,
    quality,
    workload,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
