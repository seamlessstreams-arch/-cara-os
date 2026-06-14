// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFORCE INTELLIGENCE ENGINE
//
// Pure deterministic engine that aggregates staff records, training, shifts,
// supervisions, leave, and DBS data to produce:
// - Workforce profile (headcount, training compliance, supervision rates)
// - Training compliance matrix (per-category, expired, expiring soon)
// - Supervision compliance (overdue, scheduled, frequency analysis)
// - Staffing coverage analysis (rota gaps, overtime patterns)
// - DBS / safer recruitment compliance
// - Sickness and absence patterns
// - Auto-generated Cara workforce intelligence insights (deterministic)
//
// Key regulatory requirements:
//   Reg 32 — Fitness of workers (DBS, training, references)
//   Reg 33 — Employment of staff (safer recruitment)
//   Sch 2  — Recruitment checks
//   Reg 30 — Staff supervision
//   Children's Homes Regulations 2015
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export interface StaffInput {
  id: string;
  full_name: string;
  role: string;
  employment_type: string; // full_time, part_time, bank, agency
  employment_status: string; // active, on_leave, probation, etc.
  start_date: string;
  probation_end_date: string | null;
  contracted_hours: number;
  dbs_number: string | null;
  dbs_issue_date: string | null;
  dbs_update_service: boolean;
  next_supervision_due: string | null;
  next_appraisal_due: string | null;
  is_active: boolean;
}

export interface TrainingInput {
  id: string;
  staff_id: string;
  course_name: string;
  category: string;
  completed_date: string | null;
  expiry_date: string | null;
  status: string; // compliant, expiring_soon, expired, not_started
  is_mandatory: boolean;
}

export interface SupervisionInput {
  id: string;
  staff_id: string;
  scheduled_date: string;
  actual_date: string | null;
  status: string; // scheduled, completed, cancelled, rescheduled
  type: string;
  wellbeing_score: number | null;
}

export interface ShiftInput {
  id: string;
  staff_id: string;
  date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  status: string; // scheduled, confirmed, in_progress, completed, no_show, cancelled
  overtime_minutes: number;
}

export interface LeaveInput {
  id: string;
  staff_id: string;
  leave_type: string; // annual_leave, sick, compassionate, training, etc.
  start_date: string;
  end_date: string;
  total_days: number;
  status: string; // approved, pending, declined
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface WorkforceProfile {
  total_staff: number;
  active_staff: number;
  full_time: number;
  part_time: number;
  bank_agency: number;
  on_probation: number;
  training_compliance_rate: number; // percentage
  supervision_compliance_rate: number; // percentage
  dbs_compliance_rate: number; // percentage
  staff_on_leave_today: number;
  staff_on_shift_today: number;
  average_tenure_months: number;
}

export interface TrainingCompliance {
  category: string;
  total_required: number;
  compliant: number;
  expiring_soon: number; // within 30 days
  expired: number;
  not_started: number;
  compliance_rate: number;
}

export interface SupervisionCompliance {
  total_staff_requiring: number;
  up_to_date: number;
  overdue: number;
  due_within_7_days: number;
  avg_frequency_days: number;
  avg_wellbeing_score: number | null;
  staff_overdue: { staff_id: string; staff_name: string; days_overdue: number }[];
}

export interface StaffingCoverage {
  shifts_this_week: number;
  shifts_filled: number;
  shifts_unfilled: number;
  coverage_rate: number; // percentage
  overtime_hours_this_month: number;
  no_shows_this_month: number;
  avg_shifts_per_staff_per_week: number;
}

export interface DBSCompliance {
  total_staff: number;
  valid_dbs: number;
  update_service_enrolled: number;
  expired_or_missing: number;
  compliance_rate: number;
  staff_needing_renewal: { staff_id: string; staff_name: string; issue_date: string | null; days_since_issue: number }[];
}

export interface SicknessPattern {
  total_sick_days_this_month: number;
  total_sick_days_last_month: number;
  staff_with_sickness: number;
  bradford_factor_alerts: { staff_id: string; staff_name: string; factor: number; instances: number; days: number }[];
  trend: "increasing" | "stable" | "decreasing";
}

export interface CaraInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface WorkforceIntelligenceResult {
  profile: WorkforceProfile;
  training: TrainingCompliance[];
  supervision: SupervisionCompliance;
  staffing: StaffingCoverage;
  dbs: DBSCompliance;
  sickness: SicknessPattern;
  insights: CaraInsight[];
}

export interface WorkforceEngineInput {
  staff: StaffInput[];
  training: TrainingInput[];
  supervisions: SupervisionInput[];
  shifts: ShiftInput[];
  leave: LeaveInput[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

function monthStart(today: string): string {
  return today.slice(0, 7) + "-01";
}

function lastMonthStart(today: string): string {
  const d = new Date(today + "T00:00:00Z");
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7) + "-01";
}

function lastMonthEnd(today: string): string {
  const ms = monthStart(today);
  const d = new Date(ms + "T00:00:00Z");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function weekStart(today: string): string {
  const d = new Date(today + "T00:00:00Z");
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function weekEnd(today: string): string {
  const ws = weekStart(today);
  const d = new Date(ws + "T00:00:00Z");
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

/** DBS is 3 years (1095 days) from issue. Update Service exempts from renewal. */
export function isDBSExpired(issueDate: string | null, updateService: boolean, today: string): boolean {
  if (updateService) return false; // Update Service never expires
  if (!issueDate) return true; // No DBS on record
  return daysBetween(issueDate, today) > 1095; // 3 years
}

/** Bradford Factor = S² × D (S = spells of absence, D = total days) */
export function computeBradfordFactor(instances: number, totalDays: number): number {
  return instances * instances * totalDays;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeWorkforceIntelligence(input: WorkforceEngineInput): WorkforceIntelligenceResult {
  const today = input.today ?? todayStr();
  const { staff, training, supervisions, shifts, leave } = input;

  const activeStaff = staff.filter((s) => s.is_active);

  // ── Profile ────────────────────────────────────────────────────────────
  const fullTime = activeStaff.filter((s) => s.employment_type === "full_time").length;
  const partTime = activeStaff.filter((s) => s.employment_type === "part_time").length;
  const bankAgency = activeStaff.filter((s) =>
    s.employment_type === "bank" || s.employment_type === "agency"
  ).length;
  const onProbation = activeStaff.filter((s) =>
    s.probation_end_date && s.probation_end_date >= today
  ).length;

  // Staff on leave today
  const onLeaveToday = leave.filter((l) =>
    l.status === "approved" && l.start_date <= today && l.end_date >= today
  );
  const staffOnLeaveToday = new Set(onLeaveToday.map((l) => l.staff_id)).size;

  // Staff on shift today
  const todayShifts = shifts.filter((s) =>
    s.date === today && s.status !== "cancelled"
  );
  const staffOnShiftToday = new Set(todayShifts.map((s) => s.staff_id)).size;

  // Average tenure
  const tenures = activeStaff.map((s) => daysBetween(s.start_date, today));
  const avgTenureMonths = tenures.length > 0
    ? Math.round((tenures.reduce((a, b) => a + b, 0) / tenures.length) / 30.44)
    : 0;

  // ── Training Compliance ────────────────────────────────────────────────
  const mandatoryTraining = training.filter((t) => t.is_mandatory);
  const trainingByCategory = new Map<string, TrainingInput[]>();
  for (const t of mandatoryTraining) {
    const cat = t.category;
    if (!trainingByCategory.has(cat)) trainingByCategory.set(cat, []);
    trainingByCategory.get(cat)!.push(t);
  }

  const trainingCompliance: TrainingCompliance[] = [];
  let totalTrainingCompliant = 0;
  let totalTrainingRequired = 0;

  for (const [category, records] of trainingByCategory) {
    const compliant = records.filter((r) => r.status === "compliant").length;
    const expiringSoon = records.filter((r) => r.status === "expiring_soon").length;
    const expired = records.filter((r) => r.status === "expired").length;
    const notStarted = records.filter((r) => r.status === "not_started").length;
    const total = records.length;

    trainingCompliance.push({
      category,
      total_required: total,
      compliant,
      expiring_soon: expiringSoon,
      expired,
      not_started: notStarted,
      compliance_rate: total > 0 ? Math.round(((compliant + expiringSoon) / total) * 100) : 100,
    });

    totalTrainingCompliant += compliant + expiringSoon;
    totalTrainingRequired += total;
  }

  // Sort by compliance rate (worst first)
  trainingCompliance.sort((a, b) => a.compliance_rate - b.compliance_rate);

  const overallTrainingRate = totalTrainingRequired > 0
    ? Math.round((totalTrainingCompliant / totalTrainingRequired) * 100)
    : 100;

  // ── Supervision Compliance ─────────────────────────────────────────────
  const staffRequiringSupervision = activeStaff.filter(
    (s) => s.employment_type !== "bank" && s.employment_type !== "agency"
  );

  const upToDate: string[] = [];
  const overdue: { staff_id: string; staff_name: string; days_overdue: number }[] = [];
  const dueWithin7: string[] = [];

  for (const s of staffRequiringSupervision) {
    const nextDue = s.next_supervision_due;
    if (!nextDue) {
      overdue.push({ staff_id: s.id, staff_name: s.full_name, days_overdue: 30 }); // Assume overdue
      continue;
    }
    const daysUntil = daysBetween(today, nextDue);
    if (daysUntil < 0) {
      overdue.push({ staff_id: s.id, staff_name: s.full_name, days_overdue: Math.abs(daysUntil) });
    } else if (daysUntil <= 7) {
      dueWithin7.push(s.id);
      upToDate.push(s.id);
    } else {
      upToDate.push(s.id);
    }
  }

  // Average supervision frequency (from completed supervisions)
  const completedSupervisions = supervisions.filter((s) => s.status === "completed" && s.actual_date);
  const staffSupDates = new Map<string, string[]>();
  for (const sup of completedSupervisions) {
    if (!staffSupDates.has(sup.staff_id)) staffSupDates.set(sup.staff_id, []);
    staffSupDates.get(sup.staff_id)!.push(sup.actual_date!);
  }

  let totalGaps = 0;
  let gapCount = 0;
  for (const [, dates] of staffSupDates) {
    const sorted = [...dates].sort();
    for (let i = 1; i < sorted.length; i++) {
      totalGaps += daysBetween(sorted[i - 1], sorted[i]);
      gapCount++;
    }
  }
  const avgFrequencyDays = gapCount > 0 ? Math.round(totalGaps / gapCount) : 0;

  // Average wellbeing score
  const wellbeingScores = completedSupervisions
    .filter((s) => s.wellbeing_score != null)
    .map((s) => s.wellbeing_score!);
  const avgWellbeing = wellbeingScores.length > 0
    ? Math.round((wellbeingScores.reduce((a, b) => a + b, 0) / wellbeingScores.length) * 10) / 10
    : null;

  const supervisionComplianceRate = staffRequiringSupervision.length > 0
    ? Math.round((upToDate.length / staffRequiringSupervision.length) * 100)
    : 100;

  const supervisionResult: SupervisionCompliance = {
    total_staff_requiring: staffRequiringSupervision.length,
    up_to_date: upToDate.length,
    overdue: overdue.length,
    due_within_7_days: dueWithin7.length,
    avg_frequency_days: avgFrequencyDays,
    avg_wellbeing_score: avgWellbeing,
    staff_overdue: overdue.sort((a, b) => b.days_overdue - a.days_overdue),
  };

  // ── Staffing Coverage ──────────────────────────────────────────────────
  const ws = weekStart(today);
  const we = weekEnd(today);
  const thisWeekShifts = shifts.filter((s) => s.date >= ws && s.date <= we);
  const filledShifts = thisWeekShifts.filter((s) =>
    s.status !== "cancelled" && s.status !== "no_show"
  ).length;
  const unfilledShifts = thisWeekShifts.filter((s) =>
    s.status === "cancelled" || s.status === "no_show"
  ).length;
  const totalWeekShifts = thisWeekShifts.length;
  const coverageRate = totalWeekShifts > 0
    ? Math.round((filledShifts / totalWeekShifts) * 100)
    : 100;

  // Overtime this month
  const ms = monthStart(today);
  const monthShifts = shifts.filter((s) => s.date >= ms);
  const overtimeMinutes = monthShifts.reduce((sum, s) => sum + s.overtime_minutes, 0);
  const overtimeHours = Math.round(overtimeMinutes / 60);

  // No-shows this month
  const noShows = monthShifts.filter((s) => s.status === "no_show").length;

  // Avg shifts per staff per week
  const uniqueStaffThisWeek = new Set(thisWeekShifts.filter((s) => s.status !== "cancelled").map((s) => s.staff_id)).size;
  const avgShiftsPerStaff = uniqueStaffThisWeek > 0
    ? Math.round((filledShifts / uniqueStaffThisWeek) * 10) / 10
    : 0;

  const staffingResult: StaffingCoverage = {
    shifts_this_week: totalWeekShifts,
    shifts_filled: filledShifts,
    shifts_unfilled: unfilledShifts,
    coverage_rate: coverageRate,
    overtime_hours_this_month: overtimeHours,
    no_shows_this_month: noShows,
    avg_shifts_per_staff_per_week: avgShiftsPerStaff,
  };

  // ── DBS Compliance ─────────────────────────────────────────────────────
  let validDBS = 0;
  let updateServiceCount = 0;
  let expiredOrMissing = 0;
  const needingRenewal: DBSCompliance["staff_needing_renewal"] = [];

  for (const s of activeStaff) {
    if (s.dbs_update_service) {
      updateServiceCount++;
      validDBS++;
    } else if (s.dbs_issue_date && !isDBSExpired(s.dbs_issue_date, false, today)) {
      validDBS++;
    } else {
      expiredOrMissing++;
      needingRenewal.push({
        staff_id: s.id,
        staff_name: s.full_name,
        issue_date: s.dbs_issue_date,
        days_since_issue: s.dbs_issue_date ? daysBetween(s.dbs_issue_date, today) : 9999,
      });
    }
  }

  const dbsComplianceRate = activeStaff.length > 0
    ? Math.round((validDBS / activeStaff.length) * 100)
    : 100;

  const dbsResult: DBSCompliance = {
    total_staff: activeStaff.length,
    valid_dbs: validDBS,
    update_service_enrolled: updateServiceCount,
    expired_or_missing: expiredOrMissing,
    compliance_rate: dbsComplianceRate,
    staff_needing_renewal: needingRenewal.sort((a, b) => b.days_since_issue - a.days_since_issue),
  };

  // ── Sickness Patterns ──────────────────────────────────────────────────
  const sickLeave = leave.filter((l) => l.leave_type === "sick" && l.status === "approved");

  const thisMonthSick = sickLeave.filter((l) => l.start_date >= ms || l.end_date >= ms);
  const sickDaysThisMonth = thisMonthSick.reduce((sum, l) => {
    const start = l.start_date >= ms ? l.start_date : ms;
    const end = l.end_date <= today ? l.end_date : today;
    return sum + Math.max(0, daysBetween(start, end) + 1);
  }, 0);

  const lms = lastMonthStart(today);
  const lme = lastMonthEnd(today);
  const lastMonthSick = sickLeave.filter((l) =>
    (l.start_date >= lms && l.start_date <= lme) || (l.end_date >= lms && l.end_date <= lme)
  );
  const sickDaysLastMonth = lastMonthSick.reduce((sum, l) => {
    const start = l.start_date >= lms ? l.start_date : lms;
    const end = l.end_date <= lme ? l.end_date : lme;
    return sum + Math.max(0, daysBetween(start, end) + 1);
  }, 0);

  const staffWithSickness = new Set(thisMonthSick.map((l) => l.staff_id)).size;

  // Bradford Factor (last 90 days)
  const ninetyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  })();

  const recentSick = sickLeave.filter((l) => l.start_date >= ninetyDaysAgo);
  const staffSickInstances = new Map<string, { instances: number; days: number }>();
  for (const l of recentSick) {
    const current = staffSickInstances.get(l.staff_id) ?? { instances: 0, days: 0 };
    current.instances++;
    current.days += l.total_days;
    staffSickInstances.set(l.staff_id, current);
  }

  const bradfordAlerts: SicknessPattern["bradford_factor_alerts"] = [];
  for (const [staffId, data] of staffSickInstances) {
    const factor = computeBradfordFactor(data.instances, data.days);
    if (factor >= 50) { // Alert threshold
      const staffMember = staff.find((s) => s.id === staffId);
      bradfordAlerts.push({
        staff_id: staffId,
        staff_name: staffMember?.full_name ?? staffId,
        factor,
        instances: data.instances,
        days: data.days,
      });
    }
  }
  bradfordAlerts.sort((a, b) => b.factor - a.factor);

  const sicknessTrend: SicknessPattern["trend"] =
    sickDaysThisMonth > sickDaysLastMonth * 1.2 ? "increasing" :
    sickDaysThisMonth < sickDaysLastMonth * 0.8 ? "decreasing" : "stable";

  const sicknessResult: SicknessPattern = {
    total_sick_days_this_month: sickDaysThisMonth,
    total_sick_days_last_month: sickDaysLastMonth,
    staff_with_sickness: staffWithSickness,
    bradford_factor_alerts: bradfordAlerts,
    trend: sicknessTrend,
  };

  // ── Profile Assembly ───────────────────────────────────────────────────
  const profile: WorkforceProfile = {
    total_staff: staff.length,
    active_staff: activeStaff.length,
    full_time: fullTime,
    part_time: partTime,
    bank_agency: bankAgency,
    on_probation: onProbation,
    training_compliance_rate: overallTrainingRate,
    supervision_compliance_rate: supervisionComplianceRate,
    dbs_compliance_rate: dbsComplianceRate,
    staff_on_leave_today: staffOnLeaveToday,
    staff_on_shift_today: staffOnShiftToday,
    average_tenure_months: avgTenureMonths,
  };

  // ── Cara Intelligence Insights (deterministic) ─────────────────────────
  const insights: CaraInsight[] = [];

  // Training compliance
  const expiredTraining = training.filter((t) => t.is_mandatory && t.status === "expired");
  if (expiredTraining.length > 0) {
    const categories = [...new Set(expiredTraining.map((t) => t.category))];
    insights.push({
      severity: "critical",
      text: `${expiredTraining.length} mandatory training record(s) expired across ${categories.length} category/categories (${categories.slice(0, 3).join(", ")}). Reg 32 requires all staff to maintain competency. Address immediately — staff with expired mandatory training may need supervision adjustment.`,
    });
  } else if (overallTrainingRate === 100) {
    insights.push({
      severity: "positive",
      text: "100% mandatory training compliance. All staff current on required certifications. Reg 32 workforce competency well evidenced.",
    });
  }

  // Supervision compliance
  if (overdue.length > 0) {
    const names = overdue.slice(0, 3).map((o) => o.staff_name).join(", ");
    insights.push({
      severity: overdue.length >= 3 ? "critical" : "warning",
      text: `${overdue.length} staff member(s) overdue for supervision (${names}${overdue.length > 3 ? "..." : ""}). Reg 30 requires regular supervision — overdue sessions must be prioritised within the next 7 days.`,
    });
  } else if (staffRequiringSupervision.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${staffRequiringSupervision.length} staff up to date with supervision. ${avgWellbeing ? `Average wellbeing score ${avgWellbeing}/5.` : ""} Reg 30 compliance well maintained.`,
    });
  }

  // DBS compliance
  if (expiredOrMissing > 0) {
    insights.push({
      severity: "critical",
      text: `${expiredOrMissing} staff member(s) with expired or missing DBS. This is a Reg 32/Sch 2 requirement — no staff should work unsupervised without valid DBS. Immediate action required.`,
    });
  }

  // Staffing coverage
  if (coverageRate < 90 && totalWeekShifts > 0) {
    insights.push({
      severity: "warning",
      text: `Staffing coverage this week at ${coverageRate}% (${unfilledShifts} shift(s) unfilled). Consider bank/agency cover or rota adjustments. Understaffing impacts quality of care and Reg 23 compliance.`,
    });
  }

  // Overtime concern
  if (overtimeHours > 20) {
    insights.push({
      severity: "warning",
      text: `${overtimeHours} hours overtime logged this month. High overtime can indicate understaffing or burnout risk. Review rota distribution and consider if recruitment is needed.`,
    });
  }

  // Sickness trend
  if (sicknessTrend === "increasing" && sickDaysThisMonth > 5) {
    insights.push({
      severity: "warning",
      text: `Sickness absence increasing — ${sickDaysThisMonth} days this month vs ${sickDaysLastMonth} last month. ${bradfordAlerts.length > 0 ? `Bradford Factor alerts for ${bradfordAlerts.length} staff.` : ""} Monitor for patterns and ensure return-to-work interviews are conducted.`,
    });
  }

  // Probation oversight
  if (onProbation > 0) {
    const probStaff = activeStaff
      .filter((s) => s.probation_end_date && s.probation_end_date >= today)
      .filter((s) => {
        const daysUntil = daysBetween(today, s.probation_end_date!);
        return daysUntil <= 14;
      });
    if (probStaff.length > 0) {
      insights.push({
        severity: "warning",
        text: `${probStaff.length} staff member(s) with probation ending within 14 days. Ensure probation review meetings are scheduled and evidence of competency is documented.`,
      });
    }
  }

  // Positive workforce insight
  if (
    overallTrainingRate >= 90 &&
    supervisionComplianceRate >= 90 &&
    dbsComplianceRate === 100 &&
    coverageRate >= 95
  ) {
    insights.push({
      severity: "positive",
      text: `Workforce compliance strong: training ${overallTrainingRate}%, supervision ${supervisionComplianceRate}%, DBS 100%, coverage ${coverageRate}%. Reg 32/33 safer recruitment standards well maintained.`,
    });
  }

  // Ensure at least one insight
  if (insights.length === 0) {
    insights.push({
      severity: "positive",
      text: `${activeStaff.length} active staff members. Workforce data available for monitoring. Continue recording training, supervision, and absence to build intelligence.`,
    });
  }

  return {
    profile,
    training: trainingCompliance,
    supervision: supervisionResult,
    staffing: staffingResult,
    dbs: dbsResult,
    sickness: sicknessResult,
    insights,
  };
}
