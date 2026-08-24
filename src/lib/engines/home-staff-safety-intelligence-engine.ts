import { above, below, formatRate, meets } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF SAFETY INTELLIGENCE ENGINE
// Pure deterministic engine: lone working, debriefs, grievances, risk assessments.
// HSW Act 1974, CHR 2015 Reg 33/34: "Employment of staff and fitness requirements."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LoneWorkingInput {
  id: string;
  staff_id: string;
  scenario: string;
  risk_level: "low" | "medium" | "high";
  status: "current" | "due_review" | "expired";
  assessment_date: string;
  review_date: string;
  assessed_by: string;
  hazards: string[];
  control_measures: string[];
  check_in_protocol: string;
  personal_alarm_issued: boolean;
  emergency_procedure: string;
  notes: string;
}

export interface LWRAInput {
  id: string;
  staff_member: string;
  role: string;
  scenarios: { scenario: string; risk: string; controls: string[] }[];
  overall_risk_level: "low" | "medium" | "high";
  approved_to_work_alone: boolean;
  reviewed_date: string;
  next_review_date: string;
  training_completed: { course: string; date: string; provider: string }[];
  emergency_protocols: string[];
}

export interface DebriefInput {
  id: string;
  date: string;
  type: "post_incident" | "post_restraint" | "post_missing" | "critical_event" | "emotional_support" | "tci_reflection";
  trigger_event: string;
  trigger_date: string;
  staff_involved: string[];
  facilitated_by: string;
  status: "completed" | "scheduled" | "overdue" | "declined";
  emotional_impact: "low" | "moderate" | "high" | "significant";
  key_themes: string[];
  support_offered: string[];
  follow_up_needed: boolean;
  follow_up_details: string | null;
  learning_points: string[];
}

export interface GrievanceInput {
  id: string;
  raised_by: string;
  raised_date: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "informal_raised" | "formal_submitted" | "under_investigation" | "hearing_scheduled" | "resolved" | "appealed" | "withdrawn";
  outcome: string;
  support_offered: string[];
}

export interface HomeStaffSafetyInput {
  today: string;                         // YYYY-MM-DD
  lone_working_records: LoneWorkingInput[];
  risk_assessments: LWRAInput[];
  debriefs: DebriefInput[];
  grievances: GrievanceInput[];
  total_staff: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HomeStaffSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface LoneWorkingProfile {
  total_records: number;
  current: number;
  due_review: number;
  expired: number;
  unique_staff_covered: number;
  /** null when the population is empty — nothing measured, not 0%. */
  coverage_rate: number | null;                 // % of total_staff with lone working record
  high_risk_count: number;
  alarms_issued: number;
  /** null when the population is empty — nothing measured, not 0%. */
  alarm_rate: number | null;                    // % with personal_alarm_issued
}

export interface DebriefProfile {
  total: number;
  completed: number;
  scheduled: number;
  overdue: number;
  declined: number;
  /** null when the population is empty — nothing measured, not 0%. */
  completion_rate: number | null;               // % completed / (completed + overdue)
  high_impact_count: number;             // emotional_impact high or significant
  follow_up_needed_count: number;
  with_learning_points: number;
  /** null when the population is empty — nothing measured, not 0%. */
  learning_rate: number | null;                 // % with learning_points
}

export interface GrievanceProfile {
  total: number;
  resolved: number;
  withdrawn: number;
  open: number;                          // not resolved/withdrawn
  critical_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  resolution_rate: number | null;               // % resolved / total
}

export interface LWRAProfile {
  total: number;
  approved: number;
  not_approved: number;
  /** null when the population is empty — nothing measured, not 0%. */
  approval_rate: number | null;
  overdue_review: number;
  high_risk_count: number;
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

export interface HomeStaffSafetyResult {
  safety_rating: HomeStaffSafetyRating;
  safety_score: number;
  headline: string;
  lone_working: LoneWorkingProfile;
  debriefs: DebriefProfile;
  grievance_profile: GrievanceProfile;
  lwra: LWRAProfile;
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

function ratingFromScore(score: number): HomeStaffSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeStaffSafety(
  input: HomeStaffSafetyInput,
): HomeStaffSafetyResult {
  const { today, lone_working_records, risk_assessments, debriefs: debriefRecords, grievances, total_staff } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_staff === 0) {
    return {
      safety_rating: "insufficient_data",
      safety_score: 0,
      headline: "No active staff registered.",
      lone_working: {
        total_records: 0, current: 0, due_review: 0, expired: 0,
        unique_staff_covered: 0, coverage_rate: null, high_risk_count: 0,
        alarms_issued: 0, alarm_rate: null,
      },
      debriefs: {
        total: 0, completed: 0, scheduled: 0, overdue: 0, declined: 0,
        completion_rate: null, high_impact_count: 0, follow_up_needed_count: 0,
        with_learning_points: 0, learning_rate: null,
      },
      grievance_profile: {
        total: 0, resolved: 0, withdrawn: 0, open: 0,
        critical_count: 0, resolution_rate: null,
      },
      lwra: {
        total: 0, approved: 0, not_approved: 0, approval_rate: null,
        overdue_review: 0, high_risk_count: 0,
      },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Lone Working Profile ──────────────────────────────────────────────
  const lwCurrent = lone_working_records.filter((r) => r.status === "current");
  const lwDueReview = lone_working_records.filter((r) => r.status === "due_review");
  const lwExpired = lone_working_records.filter((r) => r.status === "expired");
  const uniqueLWStaff = new Set(lone_working_records.map((r) => r.staff_id));
  const alarmsIssued = lone_working_records.filter((r) => r.personal_alarm_issued);

  const lone_working: LoneWorkingProfile = {
    total_records: lone_working_records.length,
    current: lwCurrent.length,
    due_review: lwDueReview.length,
    expired: lwExpired.length,
    unique_staff_covered: uniqueLWStaff.size,
    coverage_rate: pct(uniqueLWStaff.size, total_staff),
    high_risk_count: lone_working_records.filter((r) => r.risk_level === "high").length,
    alarms_issued: alarmsIssued.length,
    alarm_rate: pct(alarmsIssued.length, lone_working_records.length),
  };

  // ── Debrief Profile ───────────────────────────────────────────────────
  const dbCompleted = debriefRecords.filter((d) => d.status === "completed");
  const dbScheduled = debriefRecords.filter((d) => d.status === "scheduled");
  const dbOverdue = debriefRecords.filter((d) => d.status === "overdue");
  const dbDeclined = debriefRecords.filter((d) => d.status === "declined");
  const dbHighImpact = debriefRecords.filter(
    (d) => d.emotional_impact === "high" || d.emotional_impact === "significant",
  );
  const dbFollowUp = debriefRecords.filter((d) => d.follow_up_needed);
  const dbWithLearning = debriefRecords.filter((d) => d.learning_points.length > 0);
  const completionDenom = dbCompleted.length + dbOverdue.length;

  const debriefProfile: DebriefProfile = {
    total: debriefRecords.length,
    completed: dbCompleted.length,
    scheduled: dbScheduled.length,
    overdue: dbOverdue.length,
    declined: dbDeclined.length,
    completion_rate: pct(dbCompleted.length, completionDenom),
    high_impact_count: dbHighImpact.length,
    follow_up_needed_count: dbFollowUp.length,
    with_learning_points: dbWithLearning.length,
    learning_rate: pct(dbWithLearning.length, debriefRecords.length),
  };

  // ── Grievance Profile ─────────────────────────────────────────────────
  const gResolved = grievances.filter((g) => g.status === "resolved");
  const gWithdrawn = grievances.filter((g) => g.status === "withdrawn");
  const gOpen = grievances.filter(
    (g) => g.status !== "resolved" && g.status !== "withdrawn",
  );
  const gCritical = grievances.filter((g) => g.severity === "critical");

  const grievance_profile: GrievanceProfile = {
    total: grievances.length,
    resolved: gResolved.length,
    withdrawn: gWithdrawn.length,
    open: gOpen.length,
    critical_count: gCritical.length,
    resolution_rate: pct(gResolved.length, grievances.length),
  };

  // ── LWRA Profile ──────────────────────────────────────────────────────
  const lwraApproved = risk_assessments.filter((r) => r.approved_to_work_alone);
  const lwraNotApproved = risk_assessments.filter((r) => !r.approved_to_work_alone);
  const lwraOverdue = risk_assessments.filter(
    (r) => r.next_review_date && daysBetween(r.next_review_date, today) > 0,
  );
  const lwraHighRisk = risk_assessments.filter((r) => r.overall_risk_level === "high");

  const lwra: LWRAProfile = {
    total: risk_assessments.length,
    approved: lwraApproved.length,
    not_approved: lwraNotApproved.length,
    approval_rate: pct(lwraApproved.length, risk_assessments.length),
    overdue_review: lwraOverdue.length,
    high_risk_count: lwraHighRisk.length,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // mod1: Lone working coverage (±5)
  // Staff with lone working records vs total_staff
  const mod1 =
    meets(lone_working.coverage_rate, 80) ? 5 :
    meets(lone_working.coverage_rate, 60) ? 3 :
    meets(lone_working.coverage_rate, 40) ? 0 :
    above(lone_working.coverage_rate, 0) ? -3 : -5;
  score += mod1;

  // mod2: Assessment currency (±4)
  // Expired/due_review assessments
  const expiredRate = pct(lwExpired.length + lwDueReview.length, lone_working_records.length);
  const mod2 =
    lone_working_records.length === 0 ? -2 :
    expiredRate === 0 ? 4 :
    expiredRate <= 20 ? 2 :
    expiredRate <= 40 ? 0 : -4;
  score += mod2;

  // mod3: Personal alarm provision (±3)
  // personal_alarm_issued rate
  const mod3 =
    lone_working_records.length === 0 ? -1 :
    meets(lone_working.alarm_rate, 80) ? 3 :
    meets(lone_working.alarm_rate, 60) ? 1 :
    meets(lone_working.alarm_rate, 40) ? 0 : -3;
  score += mod3;

  // mod4: Debrief completion (±4)
  // completed vs overdue debriefs
  const mod4 =
    debriefRecords.length === 0 ? 0 :
    meets(debriefProfile.completion_rate, 90) ? 4 :
    meets(debriefProfile.completion_rate, 70) ? 2 :
    meets(debriefProfile.completion_rate, 50) ? 0 : -4;
  score += mod4;

  // mod5: Emotional support (±3)
  // follow_up rate on high/significant impact debriefs
  const highImpactWithFollowUp = debriefRecords.filter(
    (d) =>
      (d.emotional_impact === "high" || d.emotional_impact === "significant") &&
      d.follow_up_needed,
  ).length;
  const followUpRate = pct(highImpactWithFollowUp, dbHighImpact.length);
  const mod5 =
    dbHighImpact.length === 0 ? 0 :
    followUpRate >= 80 ? 3 :
    followUpRate >= 60 ? 1 :
    followUpRate >= 40 ? 0 : -3;
  score += mod5;

  // mod6: Grievance resolution (±3)
  // resolved vs open
  const mod6 =
    grievances.length === 0 ? 0 :
    meets(grievance_profile.resolution_rate, 70) ? 3 :
    meets(grievance_profile.resolution_rate, 50) ? 1 :
    meets(grievance_profile.resolution_rate, 30) ? 0 : -3;
  score += mod6;

  // mod7: LWRA approval rate (±3)
  // approved_to_work_alone rate
  const mod7 =
    risk_assessments.length === 0 ? 0 :
    meets(lwra.approval_rate, 80) ? 3 :
    meets(lwra.approval_rate, 60) ? 1 :
    meets(lwra.approval_rate, 40) ? 0 : -3;
  score += mod7;

  // mod8: Learning culture (±3)
  // debriefs with learning_points
  const mod8 =
    debriefRecords.length === 0 ? 0 :
    meets(debriefProfile.learning_rate, 80) ? 3 :
    meets(debriefProfile.learning_rate, 50) ? 1 :
    meets(debriefProfile.learning_rate, 30) ? 0 : -3;
  score += mod8;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const safety_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(lone_working.coverage_rate, 80)) strengths.push(`${formatRate(lone_working.coverage_rate)} of staff have lone working records — excellent coverage.`);
  if (lone_working_records.length > 0 && expiredRate === 0) strengths.push("All lone working assessments are current — none expired or due for review.");
  if (meets(lone_working.alarm_rate, 80) && lone_working_records.length > 0) strengths.push(`${formatRate(lone_working.alarm_rate)} of lone workers have been issued personal alarms.`);
  if (meets(debriefProfile.completion_rate, 90) && debriefRecords.length > 0) strengths.push(`${formatRate(debriefProfile.completion_rate)} debrief completion rate — staff are well-supported after incidents.`);
  if (followUpRate >= 80 && dbHighImpact.length > 0) strengths.push("High/significant emotional impact debriefs consistently receive follow-up support.");
  if (meets(grievance_profile.resolution_rate, 70) && grievances.length > 0) strengths.push(`${formatRate(grievance_profile.resolution_rate)} of grievances resolved — effective dispute resolution.`);
  if (meets(lwra.approval_rate, 80) && risk_assessments.length > 0) strengths.push(`${formatRate(lwra.approval_rate)} of staff risk-assessed and approved for lone working.`);
  if (meets(debriefProfile.learning_rate, 80) && debriefRecords.length > 0) strengths.push(`${formatRate(debriefProfile.learning_rate)} of debriefs capture learning points — strong reflective culture.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (below(lone_working.coverage_rate, 40) && total_staff > 0) concerns.push(`Only ${formatRate(lone_working.coverage_rate)} of staff have lone working records — significant safety gaps.`);
  if (lwExpired.length > 0) concerns.push(`${lwExpired.length} lone working assessment(s) have expired — staff may be working without valid risk controls.`);
  if (below(lone_working.alarm_rate, 40) && lone_working_records.length > 0) concerns.push(`Only ${formatRate(lone_working.alarm_rate)} of lone workers have personal alarms — inadequate safety provision.`);
  if (debriefProfile.overdue > 0) concerns.push(`${debriefProfile.overdue} debrief(s) are overdue — staff not receiving timely post-incident support.`);
  if (dbHighImpact.length > 0 && followUpRate < 40) concerns.push("High-impact debriefs are not being followed up — staff welfare at risk.");
  if (gCritical.length > 0) concerns.push(`${gCritical.length} critical grievance(s) outstanding — requires immediate management attention.`);
  if (gOpen.length > 0 && below(grievance_profile.resolution_rate, 50)) concerns.push(`Only ${formatRate(grievance_profile.resolution_rate)} of grievances resolved — poor dispute resolution.`);
  if (lwra.overdue_review > 0) concerns.push(`${lwra.overdue_review} lone working risk assessment(s) overdue for review.`);
  if (lone_working.high_risk_count > 0) concerns.push(`${lone_working.high_risk_count} high-risk lone working scenario(s) identified.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 0;

  if (lwExpired.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Renew ${lwExpired.length} expired lone working assessment(s) immediately to ensure staff safety.`,
      urgency: "immediate",
      regulatory_ref: "Reg 33/34",
    });
  }
  if (debriefProfile.overdue > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete ${debriefProfile.overdue} overdue debrief(s) to provide staff with post-incident support.`,
      urgency: "immediate",
      regulatory_ref: "Reg 34(1)",
    });
  }
  if (gCritical.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Investigate and resolve ${gCritical.length} critical grievance(s) as a priority.`,
      urgency: "immediate",
      regulatory_ref: "Reg 33(4)",
    });
  }
  if (below(lone_working.coverage_rate, 60)) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Extend lone working assessments to all staff who may work alone — aim for 100% coverage.",
      urgency: "soon",
      regulatory_ref: "HSW Act 1974 s2",
    });
  }
  if (below(lone_working.alarm_rate, 60) && lone_working_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Issue personal alarms to all lone workers to meet health and safety obligations.",
      urgency: "soon",
      regulatory_ref: "HSW Act 1974 s2",
    });
  }
  if (lwra.overdue_review > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Schedule reviews for ${lwra.overdue_review} overdue lone working risk assessment(s).`,
      urgency: "soon",
      regulatory_ref: "Reg 34",
    });
  }
  if (below(debriefProfile.learning_rate, 50) && debriefRecords.length >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Embed learning points in all debrief processes to build a reflective learning culture.",
      urgency: "planned",
      regulatory_ref: null,
    });
  }
  if (grievances.length > 0 && below(grievance_profile.resolution_rate, 50)) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review grievance handling procedures to improve resolution rates and staff confidence.",
      urgency: "planned",
      regulatory_ref: "Reg 33",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];

  if (lwExpired.length >= 3) {
    insights.push({
      text: `${lwExpired.length} expired lone working assessments — systemic failure in assessment renewal processes.`,
      severity: "critical",
    });
  }
  if (gCritical.length >= 2) {
    insights.push({
      text: `${gCritical.length} critical grievances outstanding — potential for regulatory scrutiny if unresolved.`,
      severity: "critical",
    });
  }
  if (debriefProfile.overdue >= 3) {
    insights.push({
      text: `${debriefProfile.overdue} overdue debriefs indicate a breakdown in post-incident staff support.`,
      severity: "critical",
    });
  }
  if (lone_working.high_risk_count > 0 && below(lone_working.alarm_rate, 50)) {
    insights.push({
      text: `High-risk lone working scenarios identified but alarm provision below 50% — safety gap requires attention.`,
      severity: "warning",
    });
  }
  if (dbHighImpact.length > 0 && followUpRate >= 80) {
    insights.push({
      text: `All high-impact debriefs have follow-up in place — demonstrates genuine duty of care to staff.`,
      severity: "positive",
    });
  }
  if (meets(debriefProfile.learning_rate, 80) && debriefRecords.length >= 3) {
    insights.push({
      text: `${formatRate(debriefProfile.learning_rate)} of debriefs include learning points — strong evidence of reflective practice.`,
      severity: "positive",
    });
  }
  if (meets(lone_working.coverage_rate, 80) && meets(lwra.approval_rate, 80)) {
    insights.push({
      text: "Comprehensive lone working coverage with high approval rates — robust safety framework in place.",
      severity: "positive",
    });
  }
  if (grievances.length === 0 && meets(debriefProfile.completion_rate, 90) && debriefRecords.length > 0) {
    insights.push({
      text: "No grievances and high debrief completion suggest a positive, supportive staff culture.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    safety_rating === "outstanding"
      ? "Exceptional staff safety practices — comprehensive lone working coverage, timely debriefs, and effective grievance resolution."
      : safety_rating === "good"
      ? "Good staff safety framework in place with minor areas for improvement."
      : safety_rating === "adequate"
      ? "Staff safety measures are adequate but gaps in coverage, debriefs, or grievance handling need attention."
      : "Significant staff safety concerns — expired assessments, overdue debriefs, or unresolved grievances require urgent action.";

  return {
    safety_rating,
    safety_score: score,
    headline,
    lone_working,
    debriefs: debriefProfile,
    grievance_profile,
    lwra,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
