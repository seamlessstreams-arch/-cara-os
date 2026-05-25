// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ROTA & WORKFORCE INTELLIGENCE ENGINE
//
// Pure deterministic engine that analyses shift coverage, staffing levels,
// absence, overtime, and agency usage across the children's home rota.
//
// Key regulatory requirements:
//   Reg 16 — Sufficient staff of appropriate experience, qualification, skills
//   Reg 33 — Employment of staff, fitness, good character
//   Reg 34 — Staff deployment — enough staff on each shift
//   Working Time Regulations — max 48 hours/week average
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ────────────────────────────────────────────────────────────────

export interface ShiftInput {
  id: string;
  staff_id: string;
  date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  overtime_minutes: number;
  status: string;
  is_open_shift: boolean;
  notes: string | null;
}

export interface AbsenceInput {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  type: string;
  return_to_work_completed: boolean;
}

export interface StaffRef {
  id: string;
  name: string;
}

// ── Output Types ───────────────────────────────────────────────────────────────

export interface RotaIntelligenceResult {
  overview: RotaOverview;
  shift_coverage: ShiftCoverageSlot[];
  staff_hours: StaffHoursProfile[];
  upcoming_gaps: UpcomingGap[];
  alerts: RotaAlert[];
  insights: AriaRotaInsight[];
}

export interface RotaOverview {
  total_staff_today: number;
  shifts_today: number;
  open_shifts_7_days: number;
  total_hours_week: number;
  overtime_hours_week: number;
  no_show_count_30_days: number;
  completion_rate: number;
  agency_shifts: number;
}

export interface ShiftCoverageSlot {
  shift_type: string;
  shift_label: string;
  staff_count: number;
  is_covered: boolean;
}

export interface StaffHoursProfile {
  staff_id: string;
  staff_name: string;
  hours_this_week: number;
  overtime_this_week: number;
  shifts_this_week: number;
  exceeds_48h: boolean;
}

export interface UpcomingGap {
  date: string;
  shift_type: string;
  shift_label: string;
  reason: string;
}

export interface RotaAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaRotaInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shiftLabel(shiftType: string): string {
  const labels: Record<string, string> = {
    day: "Day Shift",
    sleep_in: "Sleep-In",
    waking_night: "Waking Night",
    long_day: "Long Day",
  };
  return labels[shiftType] ?? shiftType.charAt(0).toUpperCase() + shiftType.slice(1).replace(/_/g, " ");
}

export function computeShiftHours(startTime: string, endTime: string, breakMinutes: number): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  const grossMinutes = endMinutes - startMinutes;
  const netMinutes = grossMinutes - breakMinutes;
  return Math.max(0, netMinutes / 60);
}

export function weekStart(today: string): string {
  const d = new Date(today + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function weekEnd(today: string): string {
  const ws = weekStart(today);
  const d = new Date(ws + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

function daysAgo(today: string, n: number): string {
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysAhead(today: string, n: number): string {
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Main Engine ────────────────────────────────────────────────────────────────

export function computeRotaIntelligence(input: {
  shifts: ShiftInput[];
  absences: AbsenceInput[];
  staff: StaffRef[];
  today?: string;
}): RotaIntelligenceResult {
  const today = input.today ?? todayStr();
  const { shifts, absences, staff } = input;

  const wStart = weekStart(today);
  const wEnd = weekEnd(today);
  const thirtyDaysAgo = daysAgo(today, 30);
  const sevenDaysAgo = daysAgo(today, 7);
  const sevenDaysAhead = daysAhead(today, 7);
  const tomorrow = daysAhead(today, 1);

  // ── Filtered collections ──────────────────────────────────────────────────

  const notCancelled = shifts.filter((s) => s.status !== "cancelled");
  const todayShifts = notCancelled.filter((s) => s.date === today && !s.is_open_shift);
  const todayShiftsAll = notCancelled.filter((s) => s.date === today);
  const weekShifts = notCancelled.filter((s) => s.date >= wStart && s.date <= wEnd && !s.is_open_shift);

  const openShifts7Days = notCancelled.filter(
    (s) => s.is_open_shift && s.date >= today && s.date <= sevenDaysAhead
  );

  const last30Days = notCancelled.filter((s) => s.date > thirtyDaysAgo && s.date <= today);
  const last7Days = notCancelled.filter((s) => s.date > sevenDaysAgo && s.date <= today);

  // ── Overview ──────────────────────────────────────────────────────────────

  const uniqueStaffToday = new Set(todayShifts.map((s) => s.staff_id)).size;
  const shiftsToday = todayShiftsAll.length;
  const openShifts7DaysCount = openShifts7Days.length;

  const totalHoursWeek = weekShifts.reduce(
    (sum, s) => sum + computeShiftHours(s.start_time, s.end_time, s.break_minutes),
    0
  );
  const overtimeHoursWeek = weekShifts.reduce((sum, s) => sum + s.overtime_minutes / 60, 0);

  const noShows30 = last30Days.filter((s) => s.status === "no_show");
  const completed30 = last30Days.filter((s) => s.status === "completed");
  const completionDenom = completed30.length + noShows30.length;
  const completionRate = completionDenom > 0
    ? Math.round((completed30.length / completionDenom) * 100)
    : 100;

  const agencyShifts = notCancelled.filter(
    (s) => s.notes && s.notes.toLowerCase().includes("agency")
  ).length;

  const overview: RotaOverview = {
    total_staff_today: uniqueStaffToday,
    shifts_today: shiftsToday,
    open_shifts_7_days: openShifts7DaysCount,
    total_hours_week: Math.round(totalHoursWeek * 10) / 10,
    overtime_hours_week: Math.round(overtimeHoursWeek * 10) / 10,
    no_show_count_30_days: noShows30.length,
    completion_rate: completionRate,
    agency_shifts: agencyShifts,
  };

  // ── Shift Coverage ────────────────────────────────────────────────────────

  const coverageMap = new Map<string, Set<string>>();
  for (const s of todayShiftsAll) {
    if (!coverageMap.has(s.shift_type)) {
      coverageMap.set(s.shift_type, new Set());
    }
    if (!s.is_open_shift && s.staff_id) {
      coverageMap.get(s.shift_type)!.add(s.staff_id);
    }
  }

  const shift_coverage: ShiftCoverageSlot[] = Array.from(coverageMap.entries())
    .map(([type, staffSet]) => ({
      shift_type: type,
      shift_label: shiftLabel(type),
      staff_count: staffSet.size,
      is_covered: staffSet.size >= 1,
    }))
    .sort((a, b) => a.shift_type.localeCompare(b.shift_type));

  // ── Staff Hours Profiles ──────────────────────────────────────────────────

  const staffHoursMap = new Map<string, { hours: number; overtime: number; shifts: number }>();
  for (const s of weekShifts) {
    const existing = staffHoursMap.get(s.staff_id) ?? { hours: 0, overtime: 0, shifts: 0 };
    existing.hours += computeShiftHours(s.start_time, s.end_time, s.break_minutes);
    existing.overtime += s.overtime_minutes / 60;
    existing.shifts += 1;
    staffHoursMap.set(s.staff_id, existing);
  }

  const staffMap = new Map(staff.map((s) => [s.id, s.name]));

  const staff_hours: StaffHoursProfile[] = Array.from(staffHoursMap.entries())
    .map(([staffId, data]) => ({
      staff_id: staffId,
      staff_name: staffMap.get(staffId) ?? staffId,
      hours_this_week: Math.round(data.hours * 10) / 10,
      overtime_this_week: Math.round(data.overtime * 10) / 10,
      shifts_this_week: data.shifts,
      exceeds_48h: data.hours > 48,
    }))
    .sort((a, b) => b.hours_this_week - a.hours_this_week);

  // ── Upcoming Gaps ─────────────────────────────────────────────────────────

  const upcoming_gaps: UpcomingGap[] = openShifts7Days
    .map((s) => ({
      date: s.date,
      shift_type: s.shift_type,
      shift_label: shiftLabel(s.shift_type),
      reason: s.notes ?? "No staff assigned",
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Alerts ────────────────────────────────────────────────────────────────

  const alerts: RotaAlert[] = [];

  const openShiftsToday = notCancelled.filter((s) => s.is_open_shift && s.date === today);
  for (const s of openShiftsToday) {
    alerts.push({
      severity: "critical",
      message: `Unfilled ${shiftLabel(s.shift_type)} shift today — no staff assigned`,
    });
  }

  const openShiftsTomorrow = notCancelled.filter((s) => s.is_open_shift && s.date === tomorrow);
  for (const s of openShiftsTomorrow) {
    alerts.push({
      severity: "high",
      message: `Unfilled ${shiftLabel(s.shift_type)} shift tomorrow — arrange cover urgently`,
    });
  }

  const staffOver48 = staff_hours.filter((s) => s.exceeds_48h);
  for (const s of staffOver48) {
    alerts.push({
      severity: "high",
      message: `${s.staff_name} has worked ${s.hours_this_week}h this week — exceeds 48h Working Time limit`,
    });
  }

  const noShows7 = last7Days.filter((s) => s.status === "no_show").length;
  if (noShows7 > 0) {
    alerts.push({
      severity: "medium",
      message: `${noShows7} no-show(s) in last 7 days — investigate and follow up`,
    });
  }

  if (openShifts7DaysCount > 0) {
    alerts.push({
      severity: "medium",
      message: `${openShifts7DaysCount} open shift(s) in next 7 days — recruit cover`,
    });
  }

  if (overtimeHoursWeek > 10) {
    alerts.push({
      severity: "low",
      message: `High overtime this week: ${Math.round(overtimeHoursWeek * 10) / 10}h total across team`,
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────────

  const insights: AriaRotaInsight[] = [];

  if (openShiftsToday.length > 0) {
    insights.push({
      severity: "critical",
      text: `${openShiftsToday.length} unfilled shift(s) today — Reg 34 staffing deployment at risk`,
    });
  }

  if (staffOver48.length > 0) {
    insights.push({
      severity: "warning",
      text: `${staffOver48.length} staff member(s) exceeding 48h Working Time Regulations limit this week`,
    });
  }

  if (openShifts7DaysCount > 2) {
    insights.push({
      severity: "warning",
      text: `${openShifts7DaysCount} open shifts in next 7 days — risk of understaffing (Reg 34)`,
    });
  }

  if (noShows7 > 0) {
    insights.push({
      severity: "warning",
      text: `${noShows7} no-show(s) in last 7 days — pattern may indicate staff welfare concern`,
    });
  }

  const allTodayCovered = shift_coverage.length > 0 && shift_coverage.every((s) => s.is_covered) && openShiftsToday.length === 0;
  if (allTodayCovered) {
    insights.push({
      severity: "positive",
      text: "All shifts covered today — staffing levels meet Reg 34 requirements",
    });
  }

  if (openShifts7DaysCount === 0 && shifts.length > 0) {
    insights.push({
      severity: "positive",
      text: "No open shifts in the next 7 days — full rota coverage achieved",
    });
  }

  if (completionRate >= 95 && completionDenom > 0) {
    insights.push({
      severity: "positive",
      text: `Shift completion rate at ${completionRate}% — strong reliability and attendance`,
    });
  }

  if (staffOver48.length === 0 && staff_hours.length > 0) {
    insights.push({
      severity: "positive",
      text: "No staff exceeding 48h Working Time limit — compliance maintained",
    });
  }

  if (overtimeHoursWeek <= 10 && overtimeHoursWeek > 0) {
    insights.push({
      severity: "positive",
      text: "Overtime within acceptable limits this week",
    });
  }

  return {
    overview,
    shift_coverage,
    staff_hours,
    upcoming_gaps,
    alerts,
    insights,
  };
}
