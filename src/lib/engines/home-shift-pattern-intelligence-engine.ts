// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SHIFT PATTERN INTELLIGENCE ENGINE
// Staffing patterns: coverage, punctuality, overtime, workload fairness.
// CHR 2015 Reg 33(4)(c). SCCIF: "Staffing arrangements."
// Cross-cutting: shifts × shiftSwaps.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ShiftInput {
  id: string;
  staff_id: string;
  date: string;                 // YYYY-MM-DD
  shift_type: string;           // day | sleep_in
  start_time: string;           // HH:MM
  end_time: string;             // HH:MM
  actual_start: string | null;  // HH:MM or null
  actual_end: string | null;    // HH:MM or null
  overtime_minutes: number;
  status: string;               // scheduled | in_progress | completed
  is_open_shift: boolean;
}

export interface ShiftSwapInput {
  id: string;
  requester_id: string;
  target_staff_id: string | null;
  status: string;               // pending | approved | rejected
}

export interface HomeShiftPatternInput {
  today: string;
  shifts: ShiftInput[];
  shift_swaps: ShiftSwapInput[];
  total_staff: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ShiftPatternRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CoverageProfile {
  total_shifts: number;
  completed_shifts: number;
  in_progress_shifts: number;
  scheduled_shifts: number;
  open_shifts: number;
  open_shift_rate: number;
  unique_staff_working: number;
  day_shifts: number;
  sleep_in_shifts: number;
}

export interface PunctualityProfile {
  shifts_with_actual_start: number;
  avg_delay_minutes: number;
  on_time_count: number;
  on_time_rate: number;
  late_count: number;
  early_count: number;
  max_delay_minutes: number;
}

export interface OvertimeProfile {
  total_overtime_minutes: number;
  avg_overtime_per_shift: number;
  shifts_with_overtime: number;
  overtime_rate: number;
}

export interface WorkloadProfile {
  staff_shift_counts: { staff_id: string; count: number }[];
  max_shifts_per_staff: number;
  min_shifts_per_staff: number;
  fairness_ratio: number;         // min/max, 1.0 = perfectly even
}

export interface SwapProfile {
  total_swaps: number;
  pending_swaps: number;
  approved_swaps: number;
  rejected_swaps: number;
  resolution_rate: number;
}

export interface Recommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string | null;
}

export interface Insight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HomeShiftPatternResult {
  shift_score: number;
  shift_rating: ShiftPatternRating;
  headline: string;
  coverage: CoverageProfile;
  punctuality: PunctualityProfile;
  overtime: OvertimeProfile;
  workload: WorkloadProfile;
  swaps: SwapProfile;
  strengths: string[];
  concerns: string[];
  recommendations: Recommendation[];
  insights: Insight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Parse HH:MM to minutes since midnight.
 */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Delay in minutes. Positive = late, negative = early.
 */
function delayMinutes(scheduled: string, actual: string): number {
  return timeToMinutes(actual) - timeToMinutes(scheduled);
}

// ── Core Engine ─────────────────────────────────────────────────────────────

export function computeHomeShiftPattern(
  input: HomeShiftPatternInput,
): HomeShiftPatternResult {
  const { shifts, shift_swaps, total_staff } = input;

  // ── Insufficient data ─────────────────────────────────────────────────
  if (total_staff === 0 || shifts.length === 0) {
    return {
      shift_score: 0,
      shift_rating: "insufficient_data",
      headline: "No shift data available for analysis.",
      coverage: {
        total_shifts: 0, completed_shifts: 0, in_progress_shifts: 0,
        scheduled_shifts: 0, open_shifts: 0, open_shift_rate: 0,
        unique_staff_working: 0, day_shifts: 0, sleep_in_shifts: 0,
      },
      punctuality: {
        shifts_with_actual_start: 0, avg_delay_minutes: 0,
        on_time_count: 0, on_time_rate: 0, late_count: 0,
        early_count: 0, max_delay_minutes: 0,
      },
      overtime: {
        total_overtime_minutes: 0, avg_overtime_per_shift: 0,
        shifts_with_overtime: 0, overtime_rate: 0,
      },
      workload: {
        staff_shift_counts: [], max_shifts_per_staff: 0,
        min_shifts_per_staff: 0, fairness_ratio: 0,
      },
      swaps: {
        total_swaps: 0, pending_swaps: 0, approved_swaps: 0,
        rejected_swaps: 0, resolution_rate: 0,
      },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Coverage Profile ──────────────────────────────────────────────────
  const completed = shifts.filter((s) => s.status === "completed");
  const inProgress = shifts.filter((s) => s.status === "in_progress");
  const scheduled = shifts.filter((s) => s.status === "scheduled");
  const openShifts = shifts.filter((s) => s.is_open_shift);
  const openShiftRate = pct(openShifts.length, shifts.length);
  const uniqueStaff = new Set(
    shifts.filter((s) => s.staff_id).map((s) => s.staff_id),
  ).size;
  const dayShifts = shifts.filter((s) => s.shift_type === "day");
  const sleepInShifts = shifts.filter((s) => s.shift_type === "sleep_in");

  const coverage: CoverageProfile = {
    total_shifts: shifts.length,
    completed_shifts: completed.length,
    in_progress_shifts: inProgress.length,
    scheduled_shifts: scheduled.length,
    open_shifts: openShifts.length,
    open_shift_rate: openShiftRate,
    unique_staff_working: uniqueStaff,
    day_shifts: dayShifts.length,
    sleep_in_shifts: sleepInShifts.length,
  };

  // ── Punctuality Profile ───────────────────────────────────────────────
  const shiftsWithActualStart = shifts.filter(
    (s) => s.actual_start !== null && s.actual_start !== "",
  );
  const delays = shiftsWithActualStart.map((s) =>
    delayMinutes(s.start_time, s.actual_start!),
  );
  const avgDelay =
    delays.length > 0
      ? Math.round((delays.reduce((s, d) => s + d, 0) / delays.length) * 10) / 10
      : 0;
  const onTime = delays.filter((d) => d >= -5 && d <= 5).length;
  const late = delays.filter((d) => d > 5).length;
  const early = delays.filter((d) => d < -5).length;
  const maxDelay = delays.length > 0 ? Math.max(...delays) : 0;

  const punctuality: PunctualityProfile = {
    shifts_with_actual_start: shiftsWithActualStart.length,
    avg_delay_minutes: avgDelay,
    on_time_count: onTime,
    on_time_rate: pct(onTime, shiftsWithActualStart.length),
    late_count: late,
    early_count: early,
    max_delay_minutes: maxDelay,
  };

  // ── Overtime Profile ──────────────────────────────────────────────────
  const totalOvertimeMinutes = shifts.reduce(
    (s, sh) => s + sh.overtime_minutes,
    0,
  );
  const completedShifts = completed.length + inProgress.length;
  const avgOvertimePerShift =
    completedShifts > 0
      ? Math.round((totalOvertimeMinutes / completedShifts) * 10) / 10
      : 0;
  const shiftsWithOvertime = shifts.filter(
    (s) => s.overtime_minutes > 0,
  ).length;

  const overtime: OvertimeProfile = {
    total_overtime_minutes: totalOvertimeMinutes,
    avg_overtime_per_shift: avgOvertimePerShift,
    shifts_with_overtime: shiftsWithOvertime,
    overtime_rate: pct(shiftsWithOvertime, shifts.length),
  };

  // ── Workload Profile ──────────────────────────────────────────────────
  const staffCountMap = new Map<string, number>();
  for (const s of shifts) {
    if (!s.staff_id) continue;
    staffCountMap.set(s.staff_id, (staffCountMap.get(s.staff_id) ?? 0) + 1);
  }
  const staffShiftCounts = [...staffCountMap.entries()]
    .map(([staff_id, count]) => ({ staff_id, count }))
    .sort((a, b) => b.count - a.count);
  const counts = staffShiftCounts.map((s) => s.count);
  const maxShifts = counts.length > 0 ? Math.max(...counts) : 0;
  const minShifts = counts.length > 0 ? Math.min(...counts) : 0;
  const fairnessRatio =
    maxShifts > 0
      ? Math.round((minShifts / maxShifts) * 100) / 100
      : 0;

  const workload: WorkloadProfile = {
    staff_shift_counts: staffShiftCounts,
    max_shifts_per_staff: maxShifts,
    min_shifts_per_staff: minShifts,
    fairness_ratio: fairnessRatio,
  };

  // ── Swap Profile ──────────────────────────────────────────────────────
  const pendingSwaps = shift_swaps.filter((s) => s.status === "pending");
  const approvedSwaps = shift_swaps.filter((s) => s.status === "approved");
  const rejectedSwaps = shift_swaps.filter((s) => s.status === "rejected");
  const resolvedSwaps = approvedSwaps.length + rejectedSwaps.length;
  const swapResolutionRate = pct(resolvedSwaps, shift_swaps.length);

  const swaps: SwapProfile = {
    total_swaps: shift_swaps.length,
    pending_swaps: pendingSwaps.length,
    approved_swaps: approvedSwaps.length,
    rejected_swaps: rejectedSwaps.length,
    resolution_rate: swapResolutionRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Open shift rate (±4)
  if (openShiftRate === 0) score += 4;
  else if (openShiftRate <= 5) score += 2;
  else if (openShiftRate <= 15) score += 0;
  else score -= 3;

  // Modifier 2: Punctuality (±4)
  if (shiftsWithActualStart.length > 0) {
    const onTimeRate = pct(onTime, shiftsWithActualStart.length);
    if (onTimeRate >= 90) score += 4;
    else if (onTimeRate >= 75) score += 2;
    else if (onTimeRate >= 50) score += 0;
    else score -= 3;
  }
  // No actual starts = neutral

  // Modifier 3: Overtime burden (±3)
  if (completedShifts > 0) {
    if (avgOvertimePerShift <= 5) score += 3;
    else if (avgOvertimePerShift <= 15) score += 1;
    else if (avgOvertimePerShift <= 30) score += 0;
    else score -= 3;
  }

  // Modifier 4: Staff coverage spread (±4)
  const staffCoverageRate = pct(uniqueStaff, total_staff);
  if (staffCoverageRate >= 80) score += 4;
  else if (staffCoverageRate >= 60) score += 2;
  else if (staffCoverageRate >= 40) score += 0;
  else score -= 3;

  // Modifier 5: Shift type balance (±3)
  if (dayShifts.length > 0 && sleepInShifts.length > 0) {
    const sleepInRate = pct(sleepInShifts.length, shifts.length);
    if (sleepInRate >= 15 && sleepInRate <= 40) score += 3;
    else if (sleepInRate >= 10 && sleepInRate <= 50) score += 1;
    else score += 0;
  } else if (dayShifts.length > 0 && sleepInShifts.length === 0) {
    score -= 2; // No sleep-in coverage
  }
  // All sleep-in and no day = neutral (unlikely)

  // Modifier 6: Swap resolution (±3)
  if (shift_swaps.length > 0) {
    if (swapResolutionRate >= 80) score += 3;
    else if (swapResolutionRate >= 50) score += 1;
    else if (swapResolutionRate >= 25) score += 0;
    else score -= 2;
  } else {
    score += 3; // No swaps needed = excellent stability
  }

  // Modifier 7: Completion rate (±4)
  const completionRate = pct(completed.length, completed.length + inProgress.length + scheduled.length);
  if (completionRate >= 70) score += 4;
  else if (completionRate >= 50) score += 2;
  else if (completionRate >= 30) score += 0;
  else score -= 3;

  // Modifier 8: Workload fairness (±3)
  if (staffShiftCounts.length >= 2) {
    if (fairnessRatio >= 0.6) score += 3;
    else if (fairnessRatio >= 0.4) score += 1;
    else if (fairnessRatio >= 0.2) score += 0;
    else score -= 2;
  } else if (staffShiftCounts.length === 1) {
    score += 0; // Single staff, no fairness metric
  }

  score = clamp(score, 0, 100);

  // ── Rating ────────────────────────────────────────────────────────────
  let shift_rating: ShiftPatternRating;
  if (score >= 80) shift_rating = "outstanding";
  else if (score >= 65) shift_rating = "good";
  else if (score >= 45) shift_rating = "adequate";
  else shift_rating = "inadequate";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (openShifts.length === 0)
    strengths.push("All shifts filled — no open or uncovered shifts.");
  if (punctuality.on_time_rate >= 90 && shiftsWithActualStart.length > 0)
    strengths.push(`${punctuality.on_time_rate}% punctuality rate across ${shiftsWithActualStart.length} recorded starts.`);
  if (totalOvertimeMinutes <= 30 && completedShifts > 0)
    strengths.push("Minimal overtime recorded — healthy workload management.");
  if (uniqueStaff >= total_staff * 0.8)
    strengths.push(`${uniqueStaff} of ${total_staff} staff rostered — strong team engagement.`);
  if (fairnessRatio >= 0.6 && staffShiftCounts.length >= 2)
    strengths.push(`Workload fairness ratio of ${fairnessRatio} — shifts distributed equitably.`);
  if (dayShifts.length > 0 && sleepInShifts.length > 0)
    strengths.push("Balanced mix of day and sleep-in shifts covering 24-hour care.");
  if (shift_swaps.length === 0)
    strengths.push("No shift swap requests — schedule stability.");
  if (completed.length > 0 && completionRate >= 70)
    strengths.push(`${completionRate}% shift completion rate — reliable shift execution.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (openShifts.length > 0)
    concerns.push(`${openShifts.length} open shift(s) without assigned staff — coverage gap risk.`);
  if (punctuality.on_time_rate < 50 && shiftsWithActualStart.length > 0)
    concerns.push(`Only ${punctuality.on_time_rate}% punctuality — systemic lateness affects handovers and children's routines.`);
  if (avgOvertimePerShift > 30 && completedShifts > 0)
    concerns.push(`Average ${avgOvertimePerShift} minutes overtime per shift — staff wellbeing risk and potential regulatory concern.`);
  if (staffCoverageRate < 40)
    concerns.push(`Only ${staffCoverageRate}% of staff rostered — over-reliance on a small team.`);
  if (fairnessRatio < 0.2 && staffShiftCounts.length >= 2)
    concerns.push("Significant workload imbalance — some staff working far more shifts than others.");
  if (pendingSwaps.length > 0)
    concerns.push(`${pendingSwaps.length} shift swap request(s) awaiting manager decision.`);
  if (dayShifts.length > 0 && sleepInShifts.length === 0)
    concerns.push("No sleep-in shifts scheduled — overnight coverage gap.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 1;
  if (openShifts.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Fill ${openShifts.length} open shift(s) urgently to maintain safe staffing levels as required by Reg 33(4)(c).`,
      urgency: "immediate",
      regulatory_ref: "Reg 33",
    });
  if (pendingSwaps.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Resolve ${pendingSwaps.length} pending shift swap request(s) to confirm coverage and support staff flexibility.`,
      urgency: "soon",
      regulatory_ref: null,
    });
  if (punctuality.on_time_rate < 75 && shiftsWithActualStart.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: "Address punctuality patterns — late starts affect shift handovers and children's daily routines.",
      urgency: punctuality.on_time_rate < 50 ? "immediate" : "soon",
      regulatory_ref: "Reg 33",
    });
  if (avgOvertimePerShift > 15 && completedShifts > 0)
    recommendations.push({
      rank: rank++,
      recommendation: "Review overtime patterns — excessive overtime suggests staffing gaps or rota inefficiency.",
      urgency: avgOvertimePerShift > 30 ? "immediate" : "planned",
      regulatory_ref: "Reg 33",
    });
  if (fairnessRatio < 0.4 && staffShiftCounts.length >= 2)
    recommendations.push({
      rank: rank++,
      recommendation: "Rebalance shift allocation to ensure equitable distribution across the team.",
      urgency: "planned",
      regulatory_ref: null,
    });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];
  if (openShifts.length >= 2)
    insights.push({
      text: `${openShifts.length} unfilled shifts represent a staffing adequacy risk. Ofsted will expect evidence that the home maintains sufficient numbers of suitably qualified staff at all times (Reg 33).`,
      severity: "critical",
    });
  if (punctuality.on_time_rate >= 90 && shiftsWithActualStart.length >= 3)
    insights.push({
      text: `${punctuality.on_time_rate}% of staff arrive on time — this supports consistent handovers and stable daily routines for children.`,
      severity: "positive",
    });
  if (pendingSwaps.length > 0)
    insights.push({
      text: `${pendingSwaps.length} pending swap request(s) need management attention. Unresolved swaps can create uncertainty for both staff and children's care continuity.`,
      severity: "warning",
    });
  if (uniqueStaff >= total_staff * 0.7 && total_staff > 0)
    insights.push({
      text: `${uniqueStaff} of ${total_staff} staff actively rostered — the home is using its workforce breadth effectively, reducing single-point-of-failure risks.`,
      severity: "positive",
    });
  if (totalOvertimeMinutes > 60 && completedShifts > 0)
    insights.push({
      text: `${totalOvertimeMinutes} total overtime minutes recorded. While some overtime is normal, sustained patterns may indicate staffing shortfalls or inadequate rota planning.`,
      severity: "warning",
    });

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (shift_rating === "outstanding")
    headline = `Strong shift management: ${shifts.length} shifts tracked, ${openShifts.length === 0 ? "all filled" : openShifts.length + " open"}, ${punctuality.on_time_rate}% punctuality.`;
  else if (shift_rating === "good")
    headline = `Good shift patterns: ${shifts.length} shifts across ${uniqueStaff} staff. ${concerns.length > 0 ? concerns.length + " minor issues noted." : ""}`;
  else if (shift_rating === "adequate")
    headline = `Adequate shift coverage: ${shifts.length} shifts tracked but ${concerns.length} area(s) need attention.`;
  else
    headline = `Shift management requires improvement: ${concerns.length} concerns identified affecting staffing adequacy.`;

  return {
    shift_score: score,
    shift_rating,
    headline,
    coverage,
    punctuality,
    overtime,
    workload,
    swaps,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
