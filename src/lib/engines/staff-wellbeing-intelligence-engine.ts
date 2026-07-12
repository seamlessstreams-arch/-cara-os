// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF WELLBEING INTELLIGENCE ENGINE
// Per-staff burnout risk, wellbeing trends, and home-level workforce resilience.
// Pure deterministic. No LLM calls, no DB access.
// CHR 2015 Reg 33 (employment of staff), Reg 34 (leadership qualities).
// SCCIF: Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import { mentionsAny } from "@/lib/text/keyword-match";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StaffWellbeingInput {
  today: string;
  home_name: string;
  staff: StaffMemberInput[];
  shifts: ShiftInput[];
  leave_requests: LeaveRequestInput[];
  supervisions: SupervisionInput[];
  sickness_records: SicknessInput[];
  wellbeing_checks: WellbeingCheckInput[];
  debrief_records: DebriefInput[];
  recognition_records: RecognitionInput[];
  grievance_records: GrievanceInput[];
  incidents: IncidentInvolvementInput[];
}

export interface StaffMemberInput {
  id: string;
  name: string;
  role: string;
  start_date: string;
  contracted_hours: number;
  is_active: boolean;
}

export interface ShiftInput {
  staff_id: string;
  date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  overtime_minutes: number;
  status: string;
}

export interface LeaveRequestInput {
  staff_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
}

export interface SupervisionInput {
  staff_id: string;
  scheduled_date: string;
  actual_date: string | null;
  status: string;
  wellbeing_score: number | null;
  duration_minutes: number | null;
}

export interface SicknessInput {
  staff_id: string;
  date_started: string;
  date_ended: string | null;
  total_days: number;
  category: string;
  reason: string;
  rtw_status: string;
  occupational_health_referral: boolean;
  trigger_points: string[];
}

export interface WellbeingCheckInput {
  staff_id: string;
  date: string;
  overall_score: number;
  workload_score: number;
  support_score: number;
  moral_score: number;
  stressors: string[];
  action_agreed: string;
  follow_up_date: string | null;
}

export interface DebriefInput {
  date: string;
  staff_involved: string[];
  emotional_impact: string;
  key_themes: string[];
  support_offered: string[];
  follow_up_needed: boolean;
}

export interface RecognitionInput {
  staff_id: string;
  date: string;
  type: string;
}

export interface GrievanceInput {
  staff_id: string;
  date: string;
  status: string;
  category: string;
}

export interface IncidentInvolvementInput {
  staff_id: string;
  date: string;
  severity: string;
  type: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type BurnoutRisk = "critical" | "high" | "moderate" | "low";
export type ResilienceLevel = "strong" | "adequate" | "fragile" | "at_risk";

export interface StaffWellbeingResult {
  generated_at: string;
  home_name: string;

  home_resilience: HomeResilience;
  staff_profiles: StaffWellbeingProfile[];
  workforce_pulse: WorkforcePulse;
  sickness_analysis: SicknessAnalysis;
  early_warnings: EarlyWarning[];
  priority_actions: WellbeingAction[];
  insights: WellbeingInsight[];
}

export interface HomeResilience {
  level: ResilienceLevel;
  score: number;
  headline: string;
  staff_at_risk_count: number;
  average_wellbeing_score: number | null;
  recognition_to_grievance_ratio: string;
}

export interface StaffWellbeingProfile {
  staff_id: string;
  staff_name: string;
  role: string;
  tenure_months: number;
  burnout_risk: BurnoutRisk;
  burnout_score: number;

  overtime_hours_30d: number;
  shifts_worked_30d: number;
  sickness_days_90d: number;
  incidents_involved_30d: number;
  last_supervision_date: string | null;
  supervision_overdue: boolean;
  wellbeing_trend: "improving" | "stable" | "declining" | "no_data";
  latest_wellbeing_score: number | null;
  recognition_count_90d: number;
  debrief_count_90d: number;

  risk_factors: string[];
  protective_factors: string[];
}

export interface WorkforcePulse {
  total_active_staff: number;
  average_tenure_months: number;
  staff_in_first_year: number;
  average_overtime_30d: number;
  staff_with_no_supervision_60d: number;
  wellbeing_check_coverage: number;
  recognition_rate_90d: number;
  grievance_rate_90d: number;
}

export interface SicknessAnalysis {
  total_days_lost_90d: number;
  average_per_staff_90d: number;
  staff_with_patterns: number;
  stress_related_pct: number;
  occupational_health_referrals: number;
  top_categories: { category: string; days: number; count: number }[];
}

export interface EarlyWarning {
  staff_id: string;
  staff_name: string;
  warning: string;
  severity: "critical" | "high" | "medium";
  domain: string;
}

export interface WellbeingAction {
  rank: number;
  action: string;
  severity: "critical" | "high" | "medium" | "low";
  regulatory_ref: string | null;
}

export interface WellbeingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function withinDays(date: string, today: string, days: number): boolean {
  const d = daysBetween(date, today);
  return d >= 0 && d <= days;
}

function monthsBetween(a: string, b: string): number {
  return Math.round(daysBetween(a, b) / 30.44);
}

// ── Core Compute ────────────────────────────────────────────────────────────

export function computeStaffWellbeing(input: StaffWellbeingInput): StaffWellbeingResult {
  const activeStaff = input.staff.filter((s) => s.is_active);

  const profiles = activeStaff.map((s) => buildStaffProfile(s, input));
  const pulse = computeWorkforcePulse(activeStaff, input);
  const sickness = computeSicknessAnalysis(input);
  const earlyWarnings = identifyEarlyWarnings(profiles, input);
  const actions = buildPriorityActions(profiles, pulse, sickness, input);
  const insights = generateInsights(profiles, pulse, sickness, input);
  const resilience = computeHomeResilience(profiles, pulse, sickness, input);

  profiles.sort((a, b) => b.burnout_score - a.burnout_score);

  return {
    generated_at: input.today,
    home_name: input.home_name,
    home_resilience: resilience,
    staff_profiles: profiles,
    workforce_pulse: pulse,
    sickness_analysis: sickness,
    early_warnings: earlyWarnings,
    priority_actions: actions,
    insights,
  };
}

// ── Staff Profile ───────────────────────────────────────────────────────────

function buildStaffProfile(staff: StaffMemberInput, input: StaffWellbeingInput): StaffWellbeingProfile {
  const { today, shifts, leave_requests, supervisions, sickness_records, wellbeing_checks, debrief_records, recognition_records, incidents } = input;

  const tenure = monthsBetween(staff.start_date, today);

  const shifts30d = shifts.filter((s) => s.staff_id === staff.id && withinDays(s.date, today, 30) && s.status !== "cancelled");
  const overtime30d = Math.round(shifts30d.reduce((sum, s) => sum + s.overtime_minutes, 0) / 60 * 10) / 10;

  const sick90d = sickness_records
    .filter((s) => s.staff_id === staff.id && withinDays(s.date_started, today, 90))
    .reduce((sum, s) => sum + s.total_days, 0);

  const incidents30d = incidents.filter((i) => i.staff_id === staff.id && withinDays(i.date, today, 30)).length;

  const staffSups = supervisions
    .filter((sv) => sv.staff_id === staff.id && sv.status === "completed" && sv.actual_date)
    .sort((a, b) => b.actual_date!.localeCompare(a.actual_date!));
  const lastSupDate = staffSups.length > 0 ? staffSups[0].actual_date!.slice(0, 10) : null;
  const supOverdue = !lastSupDate || daysBetween(lastSupDate, today) > 42;

  const staffWb = wellbeing_checks
    .filter((w) => w.staff_id === staff.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latestWb = staffWb.length > 0 ? staffWb[0].overall_score : null;

  let wbTrend: "improving" | "stable" | "declining" | "no_data" = "no_data";
  if (staffWb.length >= 2) {
    const recent = staffWb.slice(0, 3).reduce((s, w) => s + w.overall_score, 0) / Math.min(3, staffWb.length);
    const older = staffWb.slice(3, 6);
    if (older.length > 0) {
      const olderAvg = older.reduce((s, w) => s + w.overall_score, 0) / older.length;
      if (recent > olderAvg + 0.5) wbTrend = "improving";
      else if (recent < olderAvg - 0.5) wbTrend = "declining";
      else wbTrend = "stable";
    } else {
      wbTrend = "stable";
    }
  }

  const recognition90d = recognition_records.filter((r) => r.staff_id === staff.id && withinDays(r.date, today, 90)).length;
  const debriefs90d = debrief_records.filter((d) => d.staff_involved.includes(staff.id) && withinDays(d.date, today, 90)).length;

  // Burnout score: 0 (no risk) to 100 (critical risk)
  let burnoutScore = 0;
  if (overtime30d > 10) burnoutScore += 15;
  else if (overtime30d > 5) burnoutScore += 8;
  if (sick90d > 10) burnoutScore += 20;
  else if (sick90d > 5) burnoutScore += 10;
  else if (sick90d > 0) burnoutScore += 5;
  if (incidents30d > 3) burnoutScore += 15;
  else if (incidents30d > 1) burnoutScore += 8;
  if (supOverdue) burnoutScore += 10;
  if (latestWb !== null && latestWb < 4) burnoutScore += 20;
  else if (latestWb !== null && latestWb < 6) burnoutScore += 10;
  if (wbTrend === "declining") burnoutScore += 10;
  if (tenure < 6) burnoutScore += 5;
  if (shifts30d.length > 22) burnoutScore += 10;
  if (recognition90d === 0 && tenure > 3) burnoutScore += 5;

  // Protective factors reduce score
  if (recognition90d >= 2) burnoutScore -= 5;
  if (wbTrend === "improving") burnoutScore -= 5;
  if (latestWb !== null && latestWb >= 8) burnoutScore -= 5;
  if (!supOverdue && staffSups.length >= 2) burnoutScore -= 5;
  burnoutScore = Math.max(0, Math.min(100, burnoutScore));

  const burnoutRisk: BurnoutRisk = burnoutScore >= 60 ? "critical" : burnoutScore >= 40 ? "high" : burnoutScore >= 20 ? "moderate" : "low";

  const riskFactors: string[] = [];
  if (overtime30d > 10) riskFactors.push(`High overtime: ${overtime30d}h in 30 days`);
  if (sick90d > 5) riskFactors.push(`${sick90d} sick days in 90 days`);
  if (incidents30d > 2) riskFactors.push(`Involved in ${incidents30d} incidents in 30 days`);
  if (supOverdue) riskFactors.push("Supervision overdue");
  if (latestWb !== null && latestWb < 5) riskFactors.push(`Low wellbeing score: ${latestWb}/10`);
  if (wbTrend === "declining") riskFactors.push("Wellbeing trend declining");
  if (shifts30d.length > 22) riskFactors.push(`Working ${shifts30d.length} shifts in 30 days`);

  const protectiveFactors: string[] = [];
  if (recognition90d >= 2) protectiveFactors.push(`${recognition90d} recognition(s) in 90 days`);
  if (wbTrend === "improving") protectiveFactors.push("Wellbeing improving");
  if (latestWb !== null && latestWb >= 8) protectiveFactors.push("High wellbeing score");
  if (!supOverdue) protectiveFactors.push("Supervision up to date");
  if (tenure > 24) protectiveFactors.push("Established team member");

  return {
    staff_id: staff.id,
    staff_name: staff.name,
    role: staff.role,
    tenure_months: tenure,
    burnout_risk: burnoutRisk,
    burnout_score: burnoutScore,
    overtime_hours_30d: overtime30d,
    shifts_worked_30d: shifts30d.length,
    sickness_days_90d: sick90d,
    incidents_involved_30d: incidents30d,
    last_supervision_date: lastSupDate,
    supervision_overdue: supOverdue,
    wellbeing_trend: wbTrend,
    latest_wellbeing_score: latestWb,
    recognition_count_90d: recognition90d,
    debrief_count_90d: debriefs90d,
    risk_factors: riskFactors,
    protective_factors: protectiveFactors,
  };
}

// ── Workforce Pulse ─────────────────────────────────────────────────────────

function computeWorkforcePulse(activeStaff: StaffMemberInput[], input: StaffWellbeingInput): WorkforcePulse {
  const { today, supervisions, wellbeing_checks, recognition_records, grievance_records } = input;

  const tenures = activeStaff.map((s) => monthsBetween(s.start_date, today));
  const avgTenure = tenures.length > 0 ? Math.round(tenures.reduce((s, t) => s + t, 0) / tenures.length) : 0;
  const firstYear = tenures.filter((t) => t < 12).length;

  const shifts30d = input.shifts.filter((s) => withinDays(s.date, today, 30) && s.status !== "cancelled");
  const totalOvertime = shifts30d.reduce((s, sh) => s + sh.overtime_minutes, 0);
  const avgOvertime = activeStaff.length > 0 ? Math.round(totalOvertime / activeStaff.length / 60 * 10) / 10 : 0;

  const noSup60d = activeStaff.filter((s) => {
    const sups = supervisions.filter((sv) => sv.staff_id === s.id && sv.status === "completed" && sv.actual_date);
    if (sups.length === 0) return true;
    const latest = sups.sort((a, b) => b.actual_date!.localeCompare(a.actual_date!))[0];
    return daysBetween(latest.actual_date!, today) > 60;
  }).length;

  const staffWithWb = new Set(wellbeing_checks.map((w) => w.staff_id));
  const wbCoverage = activeStaff.length > 0 ? Math.round((staffWithWb.size / activeStaff.length) * 100) : 0;

  const rec90 = recognition_records.filter((r) => withinDays(r.date, today, 90)).length;
  const recRate = activeStaff.length > 0 ? Math.round((rec90 / activeStaff.length) * 100) / 100 : 0;

  const grv90 = grievance_records.filter((g) => withinDays(g.date, today, 90)).length;
  const grvRate = activeStaff.length > 0 ? Math.round((grv90 / activeStaff.length) * 100) / 100 : 0;

  return {
    total_active_staff: activeStaff.length,
    average_tenure_months: avgTenure,
    staff_in_first_year: firstYear,
    average_overtime_30d: avgOvertime,
    staff_with_no_supervision_60d: noSup60d,
    wellbeing_check_coverage: wbCoverage,
    recognition_rate_90d: recRate,
    grievance_rate_90d: grvRate,
  };
}

// ── Sickness Analysis ───────────────────────────────────────────────────────

function computeSicknessAnalysis(input: StaffWellbeingInput): SicknessAnalysis {
  const { today, sickness_records, staff } = input;
  const active = staff.filter((s) => s.is_active);
  const sick90d = sickness_records.filter((s) => withinDays(s.date_started, today, 90));

  const totalDays = sick90d.reduce((sum, s) => sum + s.total_days, 0);
  const avgPerStaff = active.length > 0 ? Math.round((totalDays / active.length) * 10) / 10 : 0;

  const staffWithPatterns = new Set(
    sick90d.filter((s) => s.trigger_points.length > 0 || s.total_days > 5).map((s) => s.staff_id),
  ).size;

  // Word-boundaried (never substring): "distressed" must NOT count as a
  // stress-related absence — a real false-signal we were producing.
  const stressRelated = sick90d.filter(
    (s) =>
      s.category === "stress" ||
      s.category === "mental_health" ||
      mentionsAny(s.reason, ["stress", "stressed", "stress-related", "anxiety", "anxious"]),
  );
  const stressPct = sick90d.length > 0 ? Math.round((stressRelated.length / sick90d.length) * 100) : 0;

  const ohReferrals = sick90d.filter((s) => s.occupational_health_referral).length;

  const catMap = new Map<string, { days: number; count: number }>();
  for (const s of sick90d) {
    const cat = s.category || "unspecified";
    const existing = catMap.get(cat) ?? { days: 0, count: 0 };
    catMap.set(cat, { days: existing.days + s.total_days, count: existing.count + 1 });
  }
  const topCategories = [...catMap.entries()]
    .map(([category, { days, count }]) => ({ category, days, count }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 5);

  return {
    total_days_lost_90d: totalDays,
    average_per_staff_90d: avgPerStaff,
    staff_with_patterns: staffWithPatterns,
    stress_related_pct: stressPct,
    occupational_health_referrals: ohReferrals,
    top_categories: topCategories,
  };
}

// ── Early Warnings ──────────────────────────────────────────────────────────

function identifyEarlyWarnings(profiles: StaffWellbeingProfile[], input: StaffWellbeingInput): EarlyWarning[] {
  const warnings: EarlyWarning[] = [];

  for (const p of profiles) {
    if (p.burnout_risk === "critical") {
      warnings.push({
        staff_id: p.staff_id,
        staff_name: p.staff_name,
        warning: `Critical burnout risk — ${p.risk_factors.slice(0, 2).join("; ")}`,
        severity: "critical",
        domain: "burnout",
      });
    }

    if (p.sickness_days_90d > 10) {
      warnings.push({
        staff_id: p.staff_id,
        staff_name: p.staff_name,
        warning: `${p.sickness_days_90d} sick days in 90 days — potential pattern`,
        severity: "high",
        domain: "sickness",
      });
    }

    if (p.wellbeing_trend === "declining" && p.latest_wellbeing_score !== null && p.latest_wellbeing_score < 5) {
      warnings.push({
        staff_id: p.staff_id,
        staff_name: p.staff_name,
        warning: `Declining wellbeing with low score (${p.latest_wellbeing_score}/10)`,
        severity: "high",
        domain: "wellbeing",
      });
    }

    if (p.overtime_hours_30d > 15 && p.incidents_involved_30d > 2) {
      warnings.push({
        staff_id: p.staff_id,
        staff_name: p.staff_name,
        warning: `High overtime (${p.overtime_hours_30d}h) combined with multiple incident involvement`,
        severity: "high",
        domain: "workload",
      });
    }

    if (p.supervision_overdue && p.tenure_months < 6) {
      warnings.push({
        staff_id: p.staff_id,
        staff_name: p.staff_name,
        warning: "New staff member with overdue supervision — probationary support gap",
        severity: "medium",
        domain: "supervision",
      });
    }
  }

  return warnings
    .sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2 };
      return (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2);
    })
    .slice(0, 10);
}

// ── Priority Actions ────────────────────────────────────────────────────────

function buildPriorityActions(
  profiles: StaffWellbeingProfile[],
  pulse: WorkforcePulse,
  sickness: SicknessAnalysis,
  input: StaffWellbeingInput,
): WellbeingAction[] {
  const actions: WellbeingAction[] = [];
  let rank = 0;

  const critical = profiles.filter((p) => p.burnout_risk === "critical");
  if (critical.length > 0) {
    actions.push({
      rank: ++rank,
      action: `Urgent wellbeing check for ${critical.length} staff at critical burnout risk`,
      severity: "critical",
      regulatory_ref: "Reg 33",
    });
  }

  const overdueCount = profiles.filter((p) => p.supervision_overdue).length;
  if (overdueCount > 0) {
    actions.push({
      rank: ++rank,
      action: `Schedule supervision for ${overdueCount} staff member(s) with overdue sessions`,
      severity: "high",
      regulatory_ref: "Reg 33",
    });
  }

  if (sickness.stress_related_pct > 30) {
    actions.push({
      rank: ++rank,
      action: `${sickness.stress_related_pct}% of sickness is stress-related — review workload and support arrangements`,
      severity: "high",
      regulatory_ref: "Reg 33",
    });
  }

  if (pulse.average_overtime_30d > 8) {
    actions.push({
      rank: ++rank,
      action: `Average overtime at ${pulse.average_overtime_30d}h/month — review staffing levels and rota planning`,
      severity: "medium",
      regulatory_ref: "Reg 33",
    });
  }

  if (pulse.wellbeing_check_coverage < 50) {
    actions.push({
      rank: ++rank,
      action: `Only ${pulse.wellbeing_check_coverage}% staff have wellbeing checks — implement regular wellbeing check programme`,
      severity: "medium",
      regulatory_ref: "Reg 33",
    });
  }

  const highBurnout = profiles.filter((p) => p.burnout_risk === "high");
  if (highBurnout.length > 0) {
    actions.push({
      rank: ++rank,
      action: `Monitor ${highBurnout.length} staff at high burnout risk — consider workload rebalancing`,
      severity: "medium",
      regulatory_ref: "Reg 33",
    });
  }

  if (pulse.recognition_rate_90d < 0.5 && pulse.total_active_staff > 5) {
    actions.push({
      rank: ++rank,
      action: "Low staff recognition rate — implement structured recognition programme",
      severity: "low",
      regulatory_ref: null,
    });
  }

  const openGrievances = input.grievance_records.filter((g) => g.status === "open" || g.status === "pending");
  if (openGrievances.length > 0) {
    actions.push({
      rank: ++rank,
      action: `Resolve ${openGrievances.length} open staff grievance(s)`,
      severity: "high",
      regulatory_ref: "Reg 33",
    });
  }

  return actions.slice(0, 10);
}

// ── Home Resilience ─────────────────────────────────────────────────────────

function computeHomeResilience(
  profiles: StaffWellbeingProfile[],
  pulse: WorkforcePulse,
  sickness: SicknessAnalysis,
  input: StaffWellbeingInput,
): HomeResilience {
  const atRisk = profiles.filter((p) => p.burnout_risk === "critical" || p.burnout_risk === "high").length;

  let score = 70;
  if (atRisk > 0) score -= atRisk * 8;
  if (pulse.staff_with_no_supervision_60d > 2) score -= 10;
  if (sickness.average_per_staff_90d > 3) score -= 10;
  if (sickness.stress_related_pct > 30) score -= 10;
  if (pulse.average_overtime_30d > 10) score -= 10;
  if (pulse.wellbeing_check_coverage > 70) score += 10;
  if (pulse.recognition_rate_90d >= 1) score += 5;
  if (pulse.staff_in_first_year > pulse.total_active_staff * 0.4) score -= 10;
  score = Math.max(0, Math.min(100, score));

  const level: ResilienceLevel = score >= 75 ? "strong" : score >= 55 ? "adequate" : score >= 35 ? "fragile" : "at_risk";

  const wbScores = profiles.filter((p) => p.latest_wellbeing_score !== null).map((p) => p.latest_wellbeing_score!);
  const avgWb = wbScores.length > 0 ? Math.round((wbScores.reduce((s, w) => s + w, 0) / wbScores.length) * 10) / 10 : null;

  const rec90 = input.recognition_records.filter((r) => withinDays(r.date, input.today, 90)).length;
  const grv90 = input.grievance_records.filter((g) => withinDays(g.date, input.today, 90)).length;
  const ratio = grv90 === 0 ? (rec90 > 0 ? `${rec90}:0` : "0:0") : `${rec90}:${grv90}`;

  const headline = level === "strong" ? `${input.home_name} workforce is resilient — strong wellbeing indicators` :
    level === "adequate" ? `${input.home_name} workforce is broadly stable — some areas to monitor` :
    level === "fragile" ? `${input.home_name} workforce showing strain — ${atRisk} staff at elevated burnout risk` :
    `${input.home_name} workforce at risk — urgent intervention needed for staff wellbeing`;

  return {
    level,
    score,
    headline,
    staff_at_risk_count: atRisk,
    average_wellbeing_score: avgWb,
    recognition_to_grievance_ratio: ratio,
  };
}

// ── Insights ────────────────────────────────────────────────────────────────

function generateInsights(
  profiles: StaffWellbeingProfile[],
  pulse: WorkforcePulse,
  sickness: SicknessAnalysis,
  input: StaffWellbeingInput,
): WellbeingInsight[] {
  const insights: WellbeingInsight[] = [];

  const atRisk = profiles.filter((p) => p.burnout_risk === "critical" || p.burnout_risk === "high").length;
  if (atRisk === 0) {
    insights.push({ text: "No staff at critical or high burnout risk — evidence of effective workforce management.", severity: "positive" });
  }

  if (atRisk >= 3) {
    insights.push({ text: `${atRisk} staff at high or critical burnout risk — this is a workforce stability concern that may impact care quality.`, severity: "critical" });
  }

  if (sickness.stress_related_pct > 40) {
    insights.push({ text: `${sickness.stress_related_pct}% of sickness is stress-related — indicates systemic wellbeing issues requiring organisational response.`, severity: "critical" });
  }

  if (pulse.staff_in_first_year > pulse.total_active_staff * 0.3) {
    insights.push({ text: `${pulse.staff_in_first_year} staff in first year of service — high proportion of newer staff impacts institutional knowledge and continuity.`, severity: "warning" });
  }

  const decliningWb = profiles.filter((p) => p.wellbeing_trend === "declining").length;
  if (decliningWb >= 2) {
    insights.push({ text: `${decliningWb} staff members have declining wellbeing trends — consider team wellbeing review.`, severity: "warning" });
  }

  if (pulse.recognition_rate_90d >= 1.5) {
    insights.push({ text: "Strong staff recognition culture — positive for morale and retention.", severity: "positive" });
  }

  const debriefsNeeded = input.debrief_records.filter(
    (d) => d.follow_up_needed && d.emotional_impact === "severe",
  ).length;
  if (debriefsNeeded > 0) {
    insights.push({ text: `${debriefsNeeded} post-incident debrief(s) flagged severe emotional impact requiring follow-up.`, severity: "warning" });
  }

  if (pulse.average_overtime_30d < 3 && sickness.average_per_staff_90d < 2) {
    insights.push({ text: "Low overtime and sickness levels indicate healthy workload balance.", severity: "positive" });
  }

  return insights.slice(0, 8);
}
