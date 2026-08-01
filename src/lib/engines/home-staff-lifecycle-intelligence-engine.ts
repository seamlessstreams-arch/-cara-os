// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF LIFECYCLE INTELLIGENCE ENGINE
// Pure deterministic engine: staff inductions, sickness/absence patterns,
// exit interviews, return-to-work processes, and staff recognition.
// CHR 2015 Reg 32/33 — Fitness of workers, employment of staff.
// SCCIF: "How well does the home manage the full staff lifecycle?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StaffInductionInput {
  id: string;
  staff_id: string;
  start_date: string;
  overall_status: string;
  tasks_total: number;
  tasks_completed: number;
}

export interface StaffSicknessInput {
  id: string;
  staff_id: string;
  date_started: string;
  date_ended: string | null;
  total_days: number;
  rtw_status: string;
  occupational_health_referral: boolean;
  trigger_points_count: number;
}

export interface StaffExitInput {
  id: string;
  interview_date: string;
  status: string;
  overall_rating: number | null;
  would_recommend: boolean | null;
  improvements_count: number;
}

export interface StaffRecognitionInput {
  id: string;
  date: string;
  child_contributed_nomination: boolean;
  public_celebration: boolean;
}

export interface HomeStaffLifecycleInput {
  today: string;
  induction_records: StaffInductionInput[];
  sickness_records: StaffSicknessInput[];
  exit_interview_records: StaffExitInput[];
  recognition_records: StaffRecognitionInput[];
  total_staff: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffLifecycleRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface InductionProfile {
  total_records: number;
  completed_count: number;
  overdue_count: number;
  avg_task_completion: number | null;
}

export interface SicknessProfile {
  total_episodes_90d: number;
  total_days_90d: number;
  absence_rate: number | null;
  active_episodes: number;
}

export interface ExitInterviewProfile {
  total_exits: number;
  completed_count: number;
  avg_rating: number | null;
  would_recommend_rate: number | null;
}

export interface RecognitionProfile {
  total_events_90d: number;
  events_per_staff: number | null;
  child_nomination_rate: number | null;
  public_celebration_rate: number | null;
}

export interface LifecycleInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface LifecycleRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string | null;
}

export interface HomeStaffLifecycleResult {
  lifecycle_rating: StaffLifecycleRating;
  lifecycle_score: number | null;
  headline: string;
  induction: InductionProfile;
  sickness: SicknessProfile;
  exit_interviews: ExitInterviewProfile;
  recognition: RecognitionProfile;
  strengths: string[];
  concerns: string[];
  recommendations: LifecycleRecommendation[];
  insights: LifecycleInsight[];
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

function ratingFromScore(score: number): StaffLifecycleRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeStaffLifecycle(
  input: HomeStaffLifecycleInput,
): HomeStaffLifecycleResult {
  const {
    today,
    induction_records,
    sickness_records,
    exit_interview_records,
    recognition_records,
    total_staff,
  } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  const totalData =
    induction_records.length +
    sickness_records.length +
    exit_interview_records.length +
    recognition_records.length;

  if (totalData === 0) {
    return {
      lifecycle_rating: "insufficient_data",
      lifecycle_score: 0,
      headline:
        "No staff lifecycle data available for analysis.",
      induction: { total_records: 0, completed_count: 0, overdue_count: 0, avg_task_completion: 0 },
      sickness: { total_episodes_90d: 0, total_days_90d: 0, absence_rate: 0, active_episodes: 0 },
      exit_interviews: { total_exits: 0, completed_count: 0, avg_rating: 0, would_recommend_rate: 0 },
      recognition: { total_events_90d: 0, events_per_staff: 0, child_nomination_rate: 0, public_celebration_rate: 0 },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Induction Profile ─────────────────────────────────────────────────
  const completedInductions = induction_records.filter(
    (r) => r.overall_status === "completed",
  );
  const overdueInductions = induction_records.filter(
    (r) => r.overall_status === "overdue",
  );

  const taskRatios = induction_records
    .filter((r) => r.tasks_total > 0)
    .map((r) => r.tasks_completed / r.tasks_total);
  const avgTaskCompletion =
    taskRatios.length > 0
      ? Math.round(
          (taskRatios.reduce((s, v) => s + v, 0) / taskRatios.length) * 100,
        )
      : null;

  const induction: InductionProfile = {
    total_records: induction_records.length,
    completed_count: completedInductions.length,
    overdue_count: overdueInductions.length,
    avg_task_completion: avgTaskCompletion,
  };

  // ── Sickness Profile (90-day window) ──────────────────────────────────
  const sickness90d = sickness_records.filter((r) => {
    const d = daysBetween(r.date_started, today);
    return d >= 0 && d <= 90;
  });
  const totalDays90d = sickness90d.reduce((s, r) => s + r.total_days, 0);
  const absenceRate =
    total_staff > 0
      ? Math.round((totalDays90d / (total_staff * 90)) * 10000) / 100
      : null;
  const activeEpisodes = sickness_records.filter(
    (r) => r.date_ended === null,
  ).length;

  const sickness: SicknessProfile = {
    total_episodes_90d: sickness90d.length,
    total_days_90d: totalDays90d,
    absence_rate: Math.round((absenceRate ?? 0) * 100) / 100,
    active_episodes: activeEpisodes,
  };

  // ── Exit Interview Profile ────────────────────────────────────────────
  const completedExits = exit_interview_records.filter(
    (r) => r.status === "completed",
  );
  const ratingsFromCompleted = completedExits
    .filter((r) => r.overall_rating !== null)
    .map((r) => r.overall_rating!);
  const avgRating =
    ratingsFromCompleted.length > 0
      ? Math.round(
          (ratingsFromCompleted.reduce((s, v) => s + v, 0) /
            ratingsFromCompleted.length) *
            10,
        ) / 10
      : null;
  const wouldRecommendCount = completedExits.filter(
    (r) => r.would_recommend === true,
  ).length;
  const wouldRecommendRate = pct(wouldRecommendCount, completedExits.length);

  const exit_interviews: ExitInterviewProfile = {
    total_exits: exit_interview_records.length,
    completed_count: completedExits.length,
    avg_rating: avgRating,
    would_recommend_rate: wouldRecommendRate,
  };

  // ── Recognition Profile (90-day window) ───────────────────────────────
  const recognition90d = recognition_records.filter((r) => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 90;
  });
  const eventsPerStaff =
    total_staff > 0
      ? Math.round((recognition90d.length / total_staff) * 100) / 100
      : null;
  const childNominations = recognition90d.filter(
    (r) => r.child_contributed_nomination,
  ).length;
  const publicCelebrations = recognition90d.filter(
    (r) => r.public_celebration,
  ).length;

  const recognition: RecognitionProfile = {
    total_events_90d: recognition90d.length,
    events_per_staff: eventsPerStaff,
    child_nomination_rate: pct(childNominations, recognition90d.length),
    public_celebration_rate: pct(publicCelebrations, recognition90d.length),
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // mod1: Induction completion rate (±5)
  if (induction_records.length > 0) {
    const inductionCompletionRate = pct(
      completedInductions.length,
      induction_records.length,
    );
    if (inductionCompletionRate >= 95) score += 5;
    else if (inductionCompletionRate >= 80) score += 3;
    else if (inductionCompletionRate >= 60) score += 0;
    else score -= 5;
  }
  // No inductions → +0

  // mod2: Sickness absence rate (±4)
  if (total_staff > 0) {
    if ((absenceRate ?? 0) <= 2) score += 4;
    else if ((absenceRate ?? 0) <= 4) score += 2;
    else if ((absenceRate ?? 0) <= 6) score += 0;
    else score -= 4;
  }
  // No staff → +0

  // mod3: Return to work compliance (±4)
  const needingRTW = sickness_records.filter((r) => r.total_days >= 3);
  if (needingRTW.length > 0) {
    const rtwCompleted = needingRTW.filter(
      (r) => r.rtw_status === "completed",
    );
    const rtwRate = pct(rtwCompleted.length, needingRTW.length);
    if (rtwRate >= 90) score += 4;
    else if (rtwRate >= 70) score += 2;
    else if (rtwRate >= 50) score += 0;
    else score -= 4;
  } else {
    // None needed → +2
    score += 2;
  }

  // mod4: Exit interview completion (±3)
  if (exit_interview_records.length > 0) {
    const exitCompletionRate = pct(
      completedExits.length,
      exit_interview_records.length,
    );
    if (exitCompletionRate >= 90) score += 3;
    else if (exitCompletionRate >= 70) score += 1;
    else if (exitCompletionRate >= 50) score += 0;
    else score -= 3;
  } else {
    // No exits → +1
    score += 1;
  }

  // mod5: Staff satisfaction from exits (±3)
  if (ratingsFromCompleted.length > 0) {
    if ((avgRating ?? 0) >= 4) score += 3;
    else if ((avgRating ?? 0) >= 3) score += 1;
    else if ((avgRating ?? 0) >= 2) score += 0;
    else score -= 3;
  }
  // No ratings → +0

  // mod6: Recognition culture (±3)
  if (total_staff > 0) {
    if ((eventsPerStaff ?? 0) >= 0.5) score += 3;
    else if ((eventsPerStaff ?? 0) >= 0.2) score += 1;
    else if ((eventsPerStaff ?? 0) > 0) score += 0;
    else score -= 3;
  }
  // No staff → +0

  // mod7: Induction task completion depth (±3)
  if (induction_records.length > 0) {
    const avgTaskPct = avgTaskCompletion;
    if ((avgTaskPct ?? 0) >= 90) score += 3;
    else if ((avgTaskPct ?? 0) >= 70) score += 1;
    else if ((avgTaskPct ?? 0) >= 50) score += 0;
    else score -= 3;
  }
  // No inductions → +0

  // mod8: Occupational health referral rate (±3)
  const withTriggers = sickness_records.filter(
    (r) => r.trigger_points_count > 0,
  );
  if (withTriggers.length > 0) {
    const ohReferred = withTriggers.filter(
      (r) => r.occupational_health_referral,
    );
    const ohRate = pct(ohReferred.length, withTriggers.length);
    if (ohRate >= 80) score += 3;
    else if (ohRate >= 60) score += 1;
    else if (ohRate >= 40) score += 0;
    else score -= 3;
  } else {
    // None with triggers → +1
    score += 1;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const lifecycle_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (
    induction_records.length > 0 &&
    pct(completedInductions.length, induction_records.length) >= 95
  ) {
    strengths.push(
      `${pct(completedInductions.length, induction_records.length)}% induction completion rate — new staff are being onboarded effectively.`,
    );
  }
  if (total_staff > 0 && (absenceRate ?? 0) <= 2) {
    strengths.push(
      `Sickness absence rate is ${sickness.absence_rate}% — well below the sector average.`,
    );
  }
  if (needingRTW.length > 0) {
    const rtwRate = pct(
      needingRTW.filter((r) => r.rtw_status === "completed").length,
      needingRTW.length,
    );
    if (rtwRate >= 90) {
      strengths.push(
        `${rtwRate}% return-to-work interview compliance — strong absence management.`,
      );
    }
  }
  if (
    exit_interview_records.length > 0 &&
    pct(completedExits.length, exit_interview_records.length) >= 90
  ) {
    strengths.push(
      "Exit interview completion rate exceeds 90% — the home captures departing staff feedback consistently.",
    );
  }
  if (ratingsFromCompleted.length > 0 && (avgRating ?? 0) >= 4) {
    strengths.push(
      `Average exit interview satisfaction is ${avgRating}/5 — departing staff rate the home highly.`,
    );
  }
  if (total_staff > 0 && (eventsPerStaff ?? 0) >= 0.5) {
    strengths.push(
      `${eventsPerStaff} recognition events per staff member in 90 days — strong recognition culture.`,
    );
  }
  if (induction_records.length > 0 && (avgTaskCompletion ?? 0) >= 90) {
    strengths.push(
      `Average induction task completion is ${avgTaskCompletion}% — thorough onboarding processes.`,
    );
  }
  if (
    withTriggers.length > 0 &&
    pct(
      withTriggers.filter((r) => r.occupational_health_referral).length,
      withTriggers.length,
    ) >= 80
  ) {
    strengths.push(
      "Occupational health referrals are made consistently when trigger points are reached.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (
    induction_records.length > 0 &&
    pct(completedInductions.length, induction_records.length) < 60
  ) {
    concerns.push(
      `Induction completion rate is only ${pct(completedInductions.length, induction_records.length)}% — new staff may not be adequately prepared.`,
    );
  }
  if (overdueInductions.length > 0) {
    concerns.push(
      `${overdueInductions.length} induction${overdueInductions.length > 1 ? "s" : ""} overdue — immediate attention needed.`,
    );
  }
  if (total_staff > 0 && (absenceRate ?? 0) > 6) {
    concerns.push(
      `Sickness absence rate is ${sickness.absence_rate}% — significantly above acceptable levels.`,
    );
  }
  if (activeEpisodes > 0) {
    concerns.push(
      `${activeEpisodes} active sickness episode${activeEpisodes > 1 ? "s" : ""} — ongoing staffing impact.`,
    );
  }
  if (needingRTW.length > 0) {
    const rtwRate = pct(
      needingRTW.filter((r) => r.rtw_status === "completed").length,
      needingRTW.length,
    );
    if (rtwRate < 50) {
      concerns.push(
        `Return-to-work compliance is only ${rtwRate}% — absence management processes need urgent improvement.`,
      );
    }
  }
  if (
    exit_interview_records.length > 0 &&
    pct(completedExits.length, exit_interview_records.length) < 50
  ) {
    concerns.push(
      "Fewer than half of exit interviews are completed — valuable feedback from departing staff is being lost.",
    );
  }
  if (ratingsFromCompleted.length > 0 && (avgRating ?? 0) < 2) {
    concerns.push(
      `Average exit satisfaction is only ${avgRating}/5 — departing staff report poor experiences.`,
    );
  }
  if (total_staff > 0 && eventsPerStaff === 0 && recognition_records.length === 0) {
    concerns.push(
      "No staff recognition events recorded — lack of recognition may impact morale and retention.",
    );
  }
  if (
    withTriggers.length > 0 &&
    pct(
      withTriggers.filter((r) => r.occupational_health_referral).length,
      withTriggers.length,
    ) < 40
  ) {
    concerns.push(
      "Occupational health referrals are not being made when trigger points are reached.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: LifecycleRecommendation[] = [];
  let rank = 0;

  if (overdueInductions.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete ${overdueInductions.length} overdue induction${overdueInductions.length > 1 ? "s" : ""} to ensure all new staff are fully prepared.`,
      urgency: "immediate",
      regulatory_ref: "Reg 32(3)",
    });
  }
  if (needingRTW.length > 0) {
    const rtwOverdue = needingRTW.filter(
      (r) => r.rtw_status === "overdue" || r.rtw_status === "scheduled",
    );
    if (rtwOverdue.length > 0) {
      recommendations.push({
        rank: ++rank,
        recommendation: `Complete ${rtwOverdue.length} outstanding return-to-work interview${rtwOverdue.length > 1 ? "s" : ""}.`,
        urgency: "immediate",
        regulatory_ref: "Reg 33",
      });
    }
  }
  if (total_staff > 0 && (absenceRate ?? 0) > 6) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review sickness absence patterns and implement targeted wellbeing interventions.",
      urgency: "soon",
      regulatory_ref: "Reg 33",
    });
  }
  if (
    exit_interview_records.length > 0 &&
    pct(completedExits.length, exit_interview_records.length) < 70
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve exit interview completion rate — aim for 90%+ to capture all departing staff feedback.",
      urgency: "soon",
      regulatory_ref: "Reg 32",
    });
  }
  if (total_staff > 0 && (eventsPerStaff ?? 0) < 0.2) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a formal staff recognition programme to boost morale and retention.",
      urgency: "planned",
      regulatory_ref: null,
    });
  }
  if (
    induction_records.length > 0 &&
    (avgTaskCompletion ?? 0) < 70
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review induction task completion — ensure all onboarding items are being systematically completed.",
      urgency: "planned",
      regulatory_ref: "Reg 32(3)",
    });
  }
  if (
    withTriggers.length > 0 &&
    pct(
      withTriggers.filter((r) => r.occupational_health_referral).length,
      withTriggers.length,
    ) < 60
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure occupational health referrals are made consistently when sickness trigger points are reached.",
      urgency: "soon",
      regulatory_ref: "Reg 33",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: LifecycleInsight[] = [];

  if (activeEpisodes >= 3) {
    insights.push({
      text: `${activeEpisodes} sickness episodes are currently active — staffing levels may be under significant pressure.`,
      severity: "critical",
    });
  } else if (activeEpisodes > 0) {
    insights.push({
      text: `${activeEpisodes} active sickness episode${activeEpisodes > 1 ? "s" : ""} — monitor staffing cover arrangements.`,
      severity: "warning",
    });
  }

  if (
    induction_records.length > 0 &&
    overdueInductions.length === 0 &&
    completedInductions.length === induction_records.length
  ) {
    insights.push({
      text: "All staff inductions are completed with no overdue items — evidence of well-managed onboarding.",
      severity: "positive",
    });
  }

  if (
    completedExits.length >= 3 &&
    (avgRating ?? 0) >= 4 &&
    wouldRecommendRate >= 80
  ) {
    insights.push({
      text: `Departing staff rate the home ${avgRating}/5 and ${wouldRecommendRate}% would recommend — strong employer reputation.`,
      severity: "positive",
    });
  }

  if (ratingsFromCompleted.length > 0 && (avgRating ?? 0) < 2) {
    insights.push({
      text: `Exit interview satisfaction is critically low (${avgRating}/5) — systemic issues may be driving staff away.`,
      severity: "critical",
    });
  }

  if (total_staff > 0 && (eventsPerStaff ?? 0) >= 0.5) {
    insights.push({
      text: `Recognition rate of ${eventsPerStaff} events per staff member in 90 days indicates a culture that values and celebrates staff contributions.`,
      severity: "positive",
    });
  }

  if (
    recognition90d.length > 0 &&
    pct(childNominations, recognition90d.length) >= 30
  ) {
    insights.push({
      text: `${pct(childNominations, recognition90d.length)}% of recognition events involved child nominations — children's voices are shaping staff feedback.`,
      severity: "positive",
    });
  }

  if (total_staff > 0 && (absenceRate ?? 0) > 6 && activeEpisodes >= 2) {
    insights.push({
      text: "High absence rate combined with multiple active episodes suggests systemic wellbeing concerns requiring management review.",
      severity: "critical",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    lifecycle_rating === "outstanding"
      ? "Exemplary staff lifecycle management — induction, retention and recognition all excelling."
      : lifecycle_rating === "good"
        ? "Strong staff lifecycle management — most systems working well."
        : lifecycle_rating === "adequate"
          ? "Staff lifecycle management meets basic requirements but needs improvement."
          : "Significant staff lifecycle concerns — immediate management attention required.";

  return {
    lifecycle_rating,
    lifecycle_score: score,
    headline,
    induction,
    sickness,
    exit_interviews,
    recognition,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
