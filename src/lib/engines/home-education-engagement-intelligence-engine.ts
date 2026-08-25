import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME EDUCATION ENGAGEMENT INTELLIGENCE ENGINE
// Home-level: aggregates attendance, PEP compliance, EHCP reviews,
// school engagement, tutoring support, and homework tracking.
// CHR 2015 Reg 8: "The education standard."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface EduAttendanceInput {
  id: string;
  child_id: string;
  date: string;
  attendance_code: string; // "/" | "\\" | "L" | "U" | "N" | "O" | "I" | "M" | "E"
  session: string;         // "am" | "pm" | "full_day"
  authorised_absence: boolean;
}

export interface PepInput {
  id: string;
  child_id: string;
  pep_date: string;
  next_review_date: string;
  status: string;          // "current" | "review_due" | "overdue" | "draft"
  attendance: number;
  exclusions: number;
  exclusion_days: number;
  child_views_provided: boolean;
  carer_views_provided: boolean;
  targets_count: number;
  targets_met_count: number;
  pupil_premium_amount: number;
}

export interface EhcpInput {
  id: string;
  child_id: string;
  plan_status: string;     // "pre_assessment" | "needs_assessment_in_progress" | "final_plan_in_place" | "annual_review_due" | "refused"
  next_annual_review_due: string;
  child_contribution_provided: boolean;
  outstanding_actions_count: number;
  provisions_count: number;
}

export interface SchoolEngagementInput {
  id: string;
  child_id: string;
  event_date: string;
  social_worker_attended: boolean;
  child_achievements_count: number;
  follow_up_actions_count: number;
}

export interface TutoringInput {
  id: string;
  child_id: string;
  ongoing: boolean;
  hours_per_week: number;
  child_motivation: string; // "high" | "building" | "mixed" | "low"
  dbs_current: boolean;
}

export interface HomeworkInput {
  id: string;
  child_id: string;
  date: string;
  work_completed: boolean;
  child_initiation: string; // "self_started" | "reminded" | "resisted_then_engaged" | "refused"
  quality_of_work: string;  // "strong_effort" | "adequate" | "hurried" | "stuck"
}

export interface HomeEducationEngagementInput {
  today: string;
  attendance_records: EduAttendanceInput[];
  pep_records: PepInput[];
  ehcp_records: EhcpInput[];
  school_engagement_events: SchoolEngagementInput[];
  tutoring_records: TutoringInput[];
  homework_sessions: HomeworkInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type EducationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AttendanceProfile {
  total_sessions_30d: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_rate: number | null;
  unauthorised_absences: number;
}

export interface PepComplianceProfile {
  total_peps: number;
  current_count: number;
  overdue_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  child_coverage: number | null;
  avg_attendance_from_pep: number | null;
}

export interface EhcpProfile {
  total_ehcps: number;
  on_time_reviews: number;
  overdue_reviews: number;
  child_contribution_rate: number | null;
}

export interface SchoolEngagementProfile {
  total_events_90d: number;
  unique_children_engaged: number;
  sw_attendance_rate: number | null;
  achievements_count: number;
}

export interface TutoringProfile {
  active_tutors: number;
  children_with_tutor: number;
  high_motivation_rate: number | null;
  dbs_compliance_rate: number | null;
}

export interface HomeworkProfile {
  total_sessions_30d: number;
  completion_rate: number | null;
  self_started_rate: number | null;
  strong_effort_rate: number | null;
}

export interface HomeEducationEngagementResult {
  education_rating: EducationRating;
  education_score: number | null;
  headline: string;
  attendance: AttendanceProfile;
  pep_compliance: PepComplianceProfile;
  ehcp: EhcpProfile;
  school_engagement: SchoolEngagementProfile;
  tutoring: TutoringProfile;
  homework: HomeworkProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeEducationEngagement(
  input: HomeEducationEngagementInput,
): HomeEducationEngagementResult {
  const {
    today, attendance_records, pep_records, ehcp_records,
    school_engagement_events, tutoring_records, homework_sessions, total_children,
  } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (
    total_children === 0 &&
    attendance_records.length === 0 &&
    pep_records.length === 0 &&
    ehcp_records.length === 0 &&
    school_engagement_events.length === 0 &&
    tutoring_records.length === 0 &&
    homework_sessions.length === 0
  ) {
    return {
      education_rating: "insufficient_data",
      education_score: 0,
      headline: "No education engagement data available for analysis.",
      attendance: { total_sessions_30d: 0, present_count: 0, late_count: 0, absent_count: 0, attendance_rate: null, unauthorised_absences: 0 },
      pep_compliance: { total_peps: 0, current_count: 0, overdue_count: 0, child_coverage: null, avg_attendance_from_pep: 0 },
      ehcp: { total_ehcps: 0, on_time_reviews: 0, overdue_reviews: 0, child_contribution_rate: null },
      school_engagement: { total_events_90d: 0, unique_children_engaged: 0, sw_attendance_rate: null, achievements_count: 0 },
      tutoring: { active_tutors: 0, children_with_tutor: 0, high_motivation_rate: null, dbs_compliance_rate: null },
      homework: { total_sessions_30d: 0, completion_rate: null, self_started_rate: null, strong_effort_rate: null },
      strengths: [],
      concerns: ["No education engagement data — educational support and compliance cannot be assessed."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Attendance (30d) ──────────────────────────────────────────────────
  const attendance30d = attendance_records.filter(r => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 30;
  });

  const PRESENT_CODES = ["/", "\\", "L"];
  const presentCount = attendance30d.filter(r => PRESENT_CODES.includes(r.attendance_code)).length;
  const lateCount = attendance30d.filter(r => r.attendance_code === "L").length;
  const absentCount = attendance30d.length - presentCount;
  const attendanceRate = rate(presentCount, attendance30d.length);
  const unauthorisedAbsences = attendance30d.filter(r =>
    !PRESENT_CODES.includes(r.attendance_code) && !r.authorised_absence,
  ).length;

  const attendanceProfile: AttendanceProfile = {
    total_sessions_30d: attendance30d.length,
    present_count: presentCount,
    late_count: lateCount,
    absent_count: absentCount,
    attendance_rate: attendanceRate,
    unauthorised_absences: unauthorisedAbsences,
  };

  // ── PEP Compliance ────────────────────────────────────────────────────
  const currentPeps = pep_records.filter(p => p.status === "current").length;
  // "review_due" (review date reached, not yet done) must surface alongside
  // "overdue" — otherwise a PEP that is due now is counted as neither current
  // nor overdue and silently vanishes from the overdue concern/recommendation.
  const overduePeps = pep_records.filter(p => p.status === "overdue" || p.status === "review_due").length;
  const uniquePepChildren = new Set(pep_records.map(p => p.child_id));
  const pepCoverage = rate(uniquePepChildren.size, total_children);
  const avgPepAttendance = pep_records.length > 0
    ? Math.round(pep_records.reduce((s, p) => s + p.attendance, 0) / pep_records.length)
    : null;

  const pepComplianceProfile: PepComplianceProfile = {
    total_peps: pep_records.length,
    current_count: currentPeps,
    overdue_count: overduePeps,
    child_coverage: pepCoverage,
    avg_attendance_from_pep: avgPepAttendance,
  };

  // ── EHCP ──────────────────────────────────────────────────────────────
  // An EHCP annual review is overdue once its due date has passed, whatever the
  // plan_status. Previously this required plan_status === "annual_review_due",
  // so a plan still tagged "final_plan_in_place" whose review date had lapsed
  // was counted on-time — masking a statutory SEND annual-review breach.
  const ehcpOverdue = ehcp_records.filter(e =>
    !!e.next_annual_review_due && daysBetween(e.next_annual_review_due, today) > 0,
  ).length;
  const ehcpOnTime = ehcp_records.length - ehcpOverdue;
  const ehcpContributionRate = rate(
    ehcp_records.filter(e => e.child_contribution_provided).length,
    ehcp_records.length,
  );

  const ehcpProfile: EhcpProfile = {
    total_ehcps: ehcp_records.length,
    on_time_reviews: ehcpOnTime,
    overdue_reviews: ehcpOverdue,
    child_contribution_rate: ehcpContributionRate,
  };

  // ── School Engagement (90d) ───────────────────────────────────────────
  const events90d = school_engagement_events.filter(e => {
    const d = daysBetween(e.event_date, today);
    return d >= 0 && d <= 90;
  });

  const uniqueEngagedChildren = new Set(events90d.map(e => e.child_id));
  const swAttendanceRate = rate(
    events90d.filter(e => e.social_worker_attended).length,
    events90d.length,
  );
  const achievementsCount = events90d.reduce((s, e) => s + e.child_achievements_count, 0);

  const schoolEngagementProfile: SchoolEngagementProfile = {
    total_events_90d: events90d.length,
    unique_children_engaged: uniqueEngagedChildren.size,
    sw_attendance_rate: swAttendanceRate,
    achievements_count: achievementsCount,
  };

  // ── Tutoring ──────────────────────────────────────────────────────────
  const activeTutors = tutoring_records.filter(t => t.ongoing);
  const uniqueTutoredChildren = new Set(activeTutors.map(t => t.child_id));
  const highMotivationRate = rate(
    activeTutors.filter(t => t.child_motivation === "high").length,
    activeTutors.length,
  );
  const dbsComplianceRate = rate(
    activeTutors.filter(t => t.dbs_current).length,
    activeTutors.length,
  );

  const tutoringProfile: TutoringProfile = {
    active_tutors: activeTutors.length,
    children_with_tutor: uniqueTutoredChildren.size,
    high_motivation_rate: highMotivationRate,
    dbs_compliance_rate: dbsComplianceRate,
  };

  // ── Homework (30d) ────────────────────────────────────────────────────
  const homework30d = homework_sessions.filter(h => {
    const d = daysBetween(h.date, today);
    return d >= 0 && d <= 30;
  });

  const completionRate = rate(
    homework30d.filter(h => h.work_completed).length,
    homework30d.length,
  );
  const selfStartedRate = rate(
    homework30d.filter(h => h.child_initiation === "self_started").length,
    homework30d.length,
  );
  const strongEffortRate = rate(
    homework30d.filter(h => h.quality_of_work === "strong_effort").length,
    homework30d.length,
  );

  const homeworkProfile: HomeworkProfile = {
    total_sessions_30d: homework30d.length,
    completion_rate: completionRate,
    self_started_rate: selfStartedRate,
    strong_effort_rate: strongEffortRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80
  let score = 52;

  // mod1: Attendance rate (±5) — 30d attendance
  if (attendance30d.length === 0) {
    score += 0;
  } else {
    if (meets(attendanceRate, 95)) score += 5;
    else if (meets(attendanceRate, 90)) score += 3;
    else if (meets(attendanceRate, 80)) score += 0;
    else score -= 5;
  }

  // mod2: PEP compliance (±4) — current PEPs / total_children
  if (total_children === 0) {
    score += 0;
  } else {
    const pepCurrentRate = rate(currentPeps, total_children);
    if (meets(pepCurrentRate, 90)) score += 4;
    else if (meets(pepCurrentRate, 70)) score += 2;
    else if (meets(pepCurrentRate, 50)) score += 0;
    else score -= 4;
  }

  // mod3: EHCP annual review timeliness (±3)
  if (ehcp_records.length === 0) {
    score += 1; // neutral bonus
  } else {
    const ehcpOnTimeRate = rate(ehcpOnTime, ehcp_records.length);
    if (meets(ehcpOnTimeRate, 100)) score += 3;
    else if (meets(ehcpOnTimeRate, 80)) score += 1;
    else if (meets(ehcpOnTimeRate, 60)) score += 0;
    else score -= 3;
  }

  // mod4: School engagement (±3) — events per child in 90d
  if (total_children === 0) {
    score += 0;
  } else if (events90d.length === 0) {
    score -= 3;
  } else {
    const eventsPerChild = events90d.length / total_children;
    if (eventsPerChild >= 1) score += 3;
    else if (eventsPerChild >= 0.5) score += 1;
    else score += 0;
  }

  // mod5: Tutoring & extra support (±3) — active tutoring coverage
  if (total_children === 0) {
    score += 0;
  } else if (activeTutors.length === 0) {
    score -= 3;
  } else {
    const tutoringCoverage = rate(uniqueTutoredChildren.size, total_children);
    if (meets(tutoringCoverage, 50)) score += 3;
    else if (meets(tutoringCoverage, 25)) score += 1;
    else score += 0;
  }

  // mod6: Homework completion rate (±4) — 30d
  if (homework30d.length === 0) {
    score += 0;
  } else {
    if (meets(completionRate, 90)) score += 4;
    else if (meets(completionRate, 75)) score += 2;
    else if (meets(completionRate, 50)) score += 0;
    else score -= 4;
  }

  // mod7: PEP target achievement (±3)
  const totalTargets = pep_records.reduce((s, p) => s + p.targets_count, 0);
  const totalMet = pep_records.reduce((s, p) => s + p.targets_met_count, 0);
  if (totalTargets === 0) {
    score += 0;
  } else {
    const targetAchievementRate = rate(totalMet, totalTargets);
    if (meets(targetAchievementRate, 80)) score += 3;
    else if (meets(targetAchievementRate, 60)) score += 1;
    else if (meets(targetAchievementRate, 40)) score += 0;
    else score -= 3;
  }

  // mod8: Exclusion incidents (±3) — from PEP records
  const totalExclusionDays = pep_records.reduce((s, p) => s + p.exclusion_days, 0);
  if (pep_records.length === 0) {
    score += 0;
  } else {
    if (totalExclusionDays === 0) score += 3;
    else if (totalExclusionDays <= 3) score += 1;
    else if (totalExclusionDays <= 10) score += 0;
    else score -= 3;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let education_rating: EducationRating;
  if (score >= 80) education_rating = "outstanding";
  else if (score >= 65) education_rating = "good";
  else if (score >= 45) education_rating = "adequate";
  else education_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (meets(attendanceRate, 95) && attendance30d.length > 0) strengths.push(`Excellent attendance rate of ${attendanceRate}% across all sessions.`);
  if (total_children > 0 && currentPeps > 0 && meets(rate(currentPeps, total_children), 90)) strengths.push(`${rate(currentPeps, total_children)}% PEP compliance — all children have current education plans.`);
  if (ehcp_records.length > 0 && ehcpOverdue === 0) strengths.push("All EHCP annual reviews are on time — strong SEND governance.");
  if (events90d.length > 0 && total_children > 0 && events90d.length / total_children >= 1) strengths.push(`${events90d.length} school engagement events in 90 days — active educational participation.`);
  if (activeTutors.length > 0 && total_children > 0 && meets(rate(uniqueTutoredChildren.size, total_children), 50)) strengths.push(`${rate(uniqueTutoredChildren.size, total_children)}% of children have active tutoring support.`);
  if (meets(completionRate, 90) && homework30d.length > 0) strengths.push(`${completionRate}% homework completion rate — children are engaging well with learning.`);
  if (totalTargets > 0 && meets(rate(totalMet, totalTargets), 80)) strengths.push(`${rate(totalMet, totalTargets)}% of PEP targets achieved — strong educational progress.`);
  if (totalExclusionDays === 0 && pep_records.length > 0) strengths.push("Zero exclusion days — excellent behavioural engagement at school.");

  // Concerns
  if (below(attendanceRate, 80) && attendance30d.length > 0) concerns.push(`Attendance rate is only ${attendanceRate}% — persistent absence may impact educational outcomes.`);
  if (unauthorisedAbsences >= 3) concerns.push(`${unauthorisedAbsences} unauthorised absences in 30 days — requires investigation.`);
  if (overduePeps > 0) concerns.push(`${overduePeps} PEP${overduePeps > 1 ? "s are" : " is"} overdue for review.`);
  if (ehcpOverdue > 0) concerns.push(`${ehcpOverdue} EHCP annual review${ehcpOverdue > 1 ? "s are" : " is"} overdue.`);
  if (events90d.length === 0 && total_children > 0) concerns.push("No school engagement events in 90 days — home involvement with schools needs attention.");
  if (above(total_children, 0) && activeTutors.length === 0) concerns.push("No children have active tutoring support — consider whether additional learning support is needed.");
  if (below(completionRate, 50) && homework30d.length > 0) concerns.push(`Only ${completionRate}% homework completion — children may need more support with learning at home.`);
  if (totalExclusionDays > 10) concerns.push(`${totalExclusionDays} total exclusion days — significant disruption to educational continuity.`);

  // Recommendations
  if (overduePeps > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Review overdue PEPs urgently — Reg 8 requires current education plans for all looked-after children.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 8" });
  }
  if (ehcpOverdue > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Schedule overdue EHCP annual reviews — statutory deadlines must be met for SEND compliance.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 8" });
  }
  if (below(attendanceRate, 80) && attendance30d.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Investigate low attendance — persistent absence below 80% requires an attendance improvement plan.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 8" });
  }
  if (unauthorisedAbsences >= 3) {
    recommendations.push({ rank: ++rank, recommendation: "Address unauthorised absences — every absence needs documented authorisation or follow-up action.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 8" });
  }
  if (events90d.length === 0 && total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Increase school engagement — attend parents' evenings, school events, and build relationships with educational settings.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 8" });
  }
  if (below(completionRate, 50) && homework30d.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Develop homework support strategies — consider dedicated quiet time, additional resources, or tutor support.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 8" });
  }
  if (total_children > 0 && activeTutors.length === 0) {
    recommendations.push({ rank: ++rank, recommendation: "Consider tutoring provision — Pupil Premium Plus funding may be available for additional learning support.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 8" });
  }

  // Cara Insights
  if (meets(attendanceRate, 95) && meets(completionRate, 90) && total_children > 0 && currentPeps > 0 && meets(rate(currentPeps, total_children), 90) && ehcpOverdue === 0) {
    insights.push({ text: "Educational engagement is exemplary. Attendance, homework completion, PEP compliance, and EHCP governance all exceed thresholds. Ofsted will recognise this as outstanding educational support.", severity: "positive" });
  }
  if (below(attendanceRate, 80) && below(completionRate, 50) && attendance30d.length > 0 && homework30d.length > 0) {
    insights.push({ text: `Attendance at ${attendanceRate}% combined with ${completionRate}% homework completion suggests systemic educational disengagement. This would be a serious concern during inspection.`, severity: "critical" });
  }
  if (totalExclusionDays > 10 && overduePeps > 0) {
    insights.push({ text: `${totalExclusionDays} exclusion days alongside ${overduePeps} overdue PEPs indicates educational support may not be keeping pace with children's needs.`, severity: "critical" });
  }
  if (meets(selfStartedRate, 70) && homework30d.length > 0) {
    insights.push({ text: `${selfStartedRate}% of homework sessions are self-initiated — children are developing positive independent learning habits.`, severity: "positive" });
  }
  if (meets(highMotivationRate, 80) && activeTutors.length > 0) {
    insights.push({ text: `${highMotivationRate}% high motivation rate among tutored children — tutoring arrangements are well-matched and effective.`, severity: "positive" });
  }
  if (activeTutors.length > 0 && below(dbsComplianceRate, 100)) {
    insights.push({ text: `Cara detects DBS compliance gap — ${100 - dbsComplianceRate!}% of active tutors may have lapsed DBS checks. This is a safeguarding priority.`, severity: "critical" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (education_rating === "outstanding") {
    headline = "Exceptional educational engagement — attendance, PEPs and enrichment all excelling.";
  } else if (education_rating === "good") {
    headline = "Strong educational engagement — most children well-supported in learning.";
  } else if (education_rating === "adequate") {
    headline = "Educational engagement meets basic requirements but has room for improvement.";
  } else {
    headline = "Significant educational engagement concerns — urgent attention required.";
  }

  return {
    education_rating,
    education_score: score,
    headline,
    attendance: attendanceProfile,
    pep_compliance: pepComplianceProfile,
    ehcp: ehcpProfile,
    school_engagement: schoolEngagementProfile,
    tutoring: tutoringProfile,
    homework: homeworkProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
