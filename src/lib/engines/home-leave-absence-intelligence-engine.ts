// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LEAVE & ABSENCE INTELLIGENCE ENGINE
// Workforce availability: leave patterns, sickness, approval governance.
// CHR 2015 Reg 33. SCCIF: "Staffing arrangements — availability and adequacy."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LeaveInput {
  id: string;
  staff_id: string;
  leave_type: string;               // sick | annual_leave | compassionate | unpaid | training
  start_date: string;                // YYYY-MM-DD
  end_date: string;                  // YYYY-MM-DD
  total_days: number;
  status: string;                    // pending | approved | rejected | cancelled
  approved_by: string | null;
  return_to_work_required: boolean;
  return_to_work_completed: boolean;
}

export interface HomeLeaveAbsenceInput {
  today: string;
  leave_requests: LeaveInput[];
  total_staff: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type LeaveAbsenceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface VolumeProfile {
  total_requests: number;
  total_days_requested: number;
  avg_days_per_request: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  cancelled_count: number;
}

export interface SicknessProfile {
  sick_requests: number;
  sick_days: number;
  sick_rate: number;
  active_sick_count: number;
  rtw_required: number;
  rtw_completed: number;
  rtw_compliance_rate: number;
}

export interface PlanningProfile {
  annual_leave_requests: number;
  annual_leave_days: number;
  future_leave_count: number;
  future_leave_days: number;
  current_absent_count: number;
  current_absent_rate: number;
}

export interface TypeDistribution {
  leave_type: string;
  count: number;
  total_days: number;
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

export interface HomeLeaveAbsenceResult {
  leave_score: number;
  leave_rating: LeaveAbsenceRating;
  headline: string;
  volume: VolumeProfile;
  sickness: SicknessProfile;
  planning: PlanningProfile;
  distribution: TypeDistribution[];
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

// ── Core Engine ─────────────────────────────────────────────────────────────

export function computeHomeLeaveAbsence(
  input: HomeLeaveAbsenceInput,
): HomeLeaveAbsenceResult {
  const { today, leave_requests, total_staff } = input;

  // ── Insufficient data ─────────────────────────────────────────────────
  if (total_staff === 0) {
    return {
      leave_score: 0,
      leave_rating: "insufficient_data",
      headline: "No staff data available for leave analysis.",
      volume: {
        total_requests: 0, total_days_requested: 0, avg_days_per_request: 0,
        pending_count: 0, approved_count: 0, rejected_count: 0, cancelled_count: 0,
      },
      sickness: {
        sick_requests: 0, sick_days: 0, sick_rate: 0, active_sick_count: 0,
        rtw_required: 0, rtw_completed: 0, rtw_compliance_rate: 0,
      },
      planning: {
        annual_leave_requests: 0, annual_leave_days: 0,
        future_leave_count: 0, future_leave_days: 0,
        current_absent_count: 0, current_absent_rate: 0,
      },
      distribution: [],
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // Handle 0 leave requests — this is valid data (no absences = good)
  const nonCancelled = leave_requests.filter((l) => l.status !== "cancelled");
  const cancelled = leave_requests.filter((l) => l.status === "cancelled");

  // ── Volume Profile ────────────────────────────────────────────────────
  const totalDays = leave_requests.reduce((s, l) => s + l.total_days, 0);
  const pending = leave_requests.filter((l) => l.status === "pending");
  const approved = leave_requests.filter((l) => l.status === "approved");
  const rejected = leave_requests.filter((l) => l.status === "rejected");

  const volume: VolumeProfile = {
    total_requests: leave_requests.length,
    total_days_requested: totalDays,
    avg_days_per_request:
      leave_requests.length > 0
        ? Math.round((totalDays / leave_requests.length) * 10) / 10
        : 0,
    pending_count: pending.length,
    approved_count: approved.length,
    rejected_count: rejected.length,
    cancelled_count: cancelled.length,
  };

  // ── Sickness Profile ──────────────────────────────────────────────────
  const sickRequests = nonCancelled.filter((l) => l.leave_type === "sick");
  const sickDays = sickRequests.reduce((s, l) => s + l.total_days, 0);
  const activeSick = sickRequests.filter(
    (l) =>
      l.start_date <= today &&
      l.end_date >= today &&
      (l.status === "approved" || l.status === "pending"),
  );
  const rtwRequired = sickRequests.filter((l) => l.return_to_work_required);
  const rtwCompleted = rtwRequired.filter((l) => l.return_to_work_completed);

  const sickness: SicknessProfile = {
    sick_requests: sickRequests.length,
    sick_days: sickDays,
    sick_rate: pct(sickDays, totalDays > 0 ? totalDays : 1),
    active_sick_count: activeSick.length,
    rtw_required: rtwRequired.length,
    rtw_completed: rtwCompleted.length,
    rtw_compliance_rate: pct(rtwCompleted.length, rtwRequired.length),
  };

  // ── Planning Profile ──────────────────────────────────────────────────
  const annualLeave = nonCancelled.filter((l) => l.leave_type === "annual_leave");
  const annualLeaveDays = annualLeave.reduce((s, l) => s + l.total_days, 0);

  const futureLeave = nonCancelled.filter(
    (l) => l.start_date > today && (l.status === "approved" || l.status === "pending"),
  );
  const futureLeaveDays = futureLeave.reduce((s, l) => s + l.total_days, 0);

  const currentAbsent = nonCancelled.filter(
    (l) =>
      l.start_date <= today &&
      l.end_date >= today &&
      (l.status === "approved" || l.status === "pending"),
  );
  const currentAbsentRate = pct(currentAbsent.length, total_staff);

  const planning: PlanningProfile = {
    annual_leave_requests: annualLeave.length,
    annual_leave_days: annualLeaveDays,
    future_leave_count: futureLeave.length,
    future_leave_days: futureLeaveDays,
    current_absent_count: currentAbsent.length,
    current_absent_rate: currentAbsentRate,
  };

  // ── Type Distribution ─────────────────────────────────────────────────
  const typeMap = new Map<string, { count: number; days: number }>();
  for (const l of nonCancelled) {
    const existing = typeMap.get(l.leave_type) ?? { count: 0, days: 0 };
    existing.count += 1;
    existing.days += l.total_days;
    typeMap.set(l.leave_type, existing);
  }
  const distribution: TypeDistribution[] = [...typeMap.entries()]
    .map(([leave_type, v]) => ({
      leave_type,
      count: v.count,
      total_days: v.days,
    }))
    .sort((a, b) => b.total_days - a.total_days);

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Sickness rate (±5)
  const sickRateOfTotal = pct(sickDays, total_staff * 5); // relative to team capacity (5 days/staff baseline)
  if (sickDays === 0) score += 5;
  else if (sickRateOfTotal <= 10) score += 3;
  else if (sickRateOfTotal <= 25) score += 0;
  else score -= 4;

  // Modifier 2: Pending approval (±3)
  const pendingRate = pct(pending.length, leave_requests.length > 0 ? leave_requests.length : 1);
  if (leave_requests.length === 0 || pendingRate === 0) score += 3;
  else if (pendingRate <= 20) score += 1;
  else if (pendingRate <= 40) score += 0;
  else score -= 3;

  // Modifier 3: Current absence rate (±4)
  if (currentAbsentRate === 0) score += 4;
  else if (currentAbsentRate <= 15) score += 2;
  else if (currentAbsentRate <= 25) score += 0;
  else score -= 3;

  // Modifier 4: RTW compliance (±4)
  if (rtwRequired.length === 0) score += 4; // No RTW needed = excellent
  else if (sickness.rtw_compliance_rate >= 80) score += 4;
  else if (sickness.rtw_compliance_rate >= 50) score += 1;
  else score -= 3;

  // Modifier 5: Future planning (±3)
  // Having approved future leave = good planning
  const approvedFuture = futureLeave.filter((l) => l.status === "approved");
  if (approvedFuture.length > 0 && futureLeave.length === approvedFuture.length) score += 3;
  else if (approvedFuture.length > 0) score += 1;
  else if (futureLeave.length === 0 && leave_requests.length === 0) score += 3; // No leave at all
  else score += 0;

  // Modifier 6: Leave type diversity (±3)
  // Mostly annual leave = good (planned). Mostly sick = concerning
  if (nonCancelled.length > 0) {
    const plannedRate = pct(annualLeave.length, nonCancelled.length);
    if (plannedRate >= 60) score += 3;
    else if (plannedRate >= 30) score += 1;
    else if (sickRequests.length > annualLeave.length) score -= 2;
    else score += 0;
  } else {
    score += 3; // No leave = no concerns
  }

  // Modifier 7: Approval governance (±3)
  const approvedWithApprover = approved.filter((l) => l.approved_by !== null);
  if (approved.length === 0 && pending.length === 0 && leave_requests.length === 0) score += 3;
  else if (approved.length > 0 && approvedWithApprover.length === approved.length) score += 3;
  else if (approvedWithApprover.length > 0) score += 1;
  else score -= 2;

  // Modifier 8: Team coverage impact (±3)
  // Multiple staff absent simultaneously = risk
  const uniqueCurrentAbsent = new Set(currentAbsent.map((l) => l.staff_id)).size;
  if (uniqueCurrentAbsent === 0) score += 3;
  else if (uniqueCurrentAbsent === 1) score += 1;
  else if (pct(uniqueCurrentAbsent, total_staff) <= 25) score += 0;
  else score -= 3;

  score = clamp(score, 0, 100);

  // ── Rating ────────────────────────────────────────────────────────────
  let leave_rating: LeaveAbsenceRating;
  if (score >= 80) leave_rating = "outstanding";
  else if (score >= 65) leave_rating = "good";
  else if (score >= 45) leave_rating = "adequate";
  else leave_rating = "inadequate";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (sickDays === 0)
    strengths.push("No sickness absence recorded — excellent staff health and attendance.");
  if (currentAbsent.length === 0)
    strengths.push("No staff currently absent — full team availability.");
  if (pending.length === 0 && leave_requests.length > 0)
    strengths.push("All leave requests processed — no pending approvals.");
  if (rtwRequired.length > 0 && sickness.rtw_compliance_rate >= 80)
    strengths.push(`${sickness.rtw_compliance_rate}% return-to-work compliance — good governance.`);
  if (rtwRequired.length === 0 && sickRequests.length === 0)
    strengths.push("No return-to-work processes required — clean absence record.");
  if (approvedFuture.length > 0)
    strengths.push(`${approvedFuture.length} future leave period(s) pre-approved — good forward planning.`);
  if (approved.length > 0 && approvedWithApprover.length === approved.length)
    strengths.push("All approved leave has named authoriser — proper governance trail.");
  if (leave_requests.length === 0)
    strengths.push("No leave requests in the current period — full staffing availability.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (activeSick.length > 0)
    concerns.push(`${activeSick.length} staff member(s) currently on sick leave — monitor coverage impact.`);
  if (pending.length > 0)
    concerns.push(`${pending.length} leave request(s) awaiting approval — delays affect staff planning.`);
  if (rtwRequired.length > 0 && sickness.rtw_compliance_rate < 50)
    concerns.push(`Return-to-work compliance at ${sickness.rtw_compliance_rate}% — non-compliance creates governance risk.`);
  if (currentAbsentRate > 25)
    concerns.push(`${currentAbsentRate}% of staff currently absent — staffing adequacy may be compromised.`);
  if (sickDays > total_staff * 2)
    concerns.push(`${sickDays} sick days recorded — high sickness absence warrants review.`);
  if (uniqueCurrentAbsent >= 2)
    concerns.push(`${uniqueCurrentAbsent} staff members simultaneously absent — coverage pressure.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 1;
  if (pending.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Process ${pending.length} pending leave request(s) to confirm staffing coverage and support staff wellbeing.`,
      urgency: pending.length > 2 ? "immediate" : "soon",
      regulatory_ref: "Reg 33",
    });
  if (rtwRequired.length > 0 && sickness.rtw_compliance_rate < 80)
    recommendations.push({
      rank: rank++,
      recommendation: "Complete outstanding return-to-work meetings — these are essential for staff welfare and identifying support needs.",
      urgency: sickness.rtw_compliance_rate === 0 ? "immediate" : "soon",
      regulatory_ref: null,
    });
  if (activeSick.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: "Review shift rota to ensure adequate coverage during current sickness absence.",
      urgency: currentAbsentRate > 25 ? "immediate" : "planned",
      regulatory_ref: "Reg 33",
    });
  if (sickDays > total_staff)
    recommendations.push({
      rank: rank++,
      recommendation: "Conduct a sickness absence review — identify patterns, support needs, and whether occupational health referral is appropriate.",
      urgency: "planned",
      regulatory_ref: null,
    });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];
  if (currentAbsentRate > 25)
    insights.push({
      text: `${currentAbsentRate}% of the team is currently absent. Ofsted will expect evidence that the home maintains sufficient staffing at all times (Reg 33). Review contingency arrangements.`,
      severity: "critical",
    });
  if (sickDays === 0 && leave_requests.length > 0)
    insights.push({
      text: "No sickness absence across the team — this indicates a healthy workplace culture and effective wellbeing support.",
      severity: "positive",
    });
  if (rtwRequired.length > 0 && !rtwCompleted.length)
    insights.push({
      text: `${rtwRequired.length} return-to-work meeting(s) required but incomplete. RTW conversations are a key welfare governance mechanism and absence without them may mask underlying issues.`,
      severity: "warning",
    });
  if (approvedFuture.length > 0)
    insights.push({
      text: `${approvedFuture.length} pre-approved future leave period(s) totalling ${futureLeaveDays} days. Forward planning allows proactive rota management.`,
      severity: "positive",
    });
  if (activeSick.length >= 2)
    insights.push({
      text: `${activeSick.length} staff simultaneously on sick leave. This creates a compounding coverage pressure that may require agency staffing or overtime authorisation.`,
      severity: "critical",
    });

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (leave_rating === "outstanding")
    headline = leave_requests.length === 0
      ? "Excellent workforce availability: no absences recorded in the current period."
      : `Strong leave management: ${leave_requests.length} requests tracked, ${sickDays === 0 ? "zero sickness" : sickDays + " sick days"}, ${pending.length === 0 ? "all processed" : pending.length + " pending"}.`;
  else if (leave_rating === "good")
    headline = `Good absence management: ${leave_requests.length} leave requests with ${currentAbsent.length} currently absent.`;
  else if (leave_rating === "adequate")
    headline = `Adequate leave management: ${leave_requests.length} requests tracked but ${concerns.length} area(s) need attention.`;
  else
    headline = `Leave management requires improvement: ${concerns.length} concerns affecting staffing adequacy.`;

  return {
    leave_score: score,
    leave_rating,
    headline,
    volume,
    sickness,
    planning,
    distribution,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
