// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — THERAPEUTIC PROGRESS INTELLIGENCE ENGINE
// Per-child therapeutic trajectory analysis aggregating therapy sessions,
// keywork interactions, behaviour patterns, mood trends, CAMHS engagement,
// and outcome progress into a coherent therapeutic narrative.
// Pure deterministic. No LLM calls, no DB access.
// CHR 2015 Reg 6 (quality of care), Reg 9 (care plans), Reg 10 (health).
// SCCIF: Overall experiences and progress of children.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TherapeuticProgressInput {
  today: string;
  child_id: string;
  child_name: string;
  placement_start_date: string;

  therapy_sessions: TherapySessionInput[];
  keywork_sessions: KeyworkSessionInput[];
  behaviour_entries: BehaviourEntryInput[];
  outcome_targets: OutcomeTargetInput[];
  outcome_reviews: OutcomeReviewInput[];
  camhs_referrals: CamhsReferralInput[];
  mental_health_check_ins: MentalHealthCheckInInput[];
  incidents: ChildIncidentInput[];
  restraint_records: RestraintRecordInput[];
}

export interface TherapySessionInput {
  id: string;
  session_date: string;
  modality: string;
  therapist_name: string;
  attended: boolean;
  reason_if_missed?: string;
  child_presentation: string;
  pre_session_mood: number;
  post_session_mood: number;
  escalation_flags: string[];
  general_theme: string;
}

export interface KeyworkSessionInput {
  id: string;
  date: string;
  type: string;
  duration: number;
  mood_before: number;
  mood_after: number;
  topics: string[];
  child_voice: string;
  actions_agreed: string[];
  follow_up_completed: boolean;
}

export interface BehaviourEntryInput {
  date: string;
  type: string;
  severity: string;
  trigger?: string;
  de_escalation_used: boolean;
  response_effective: boolean;
}

export interface OutcomeTargetInput {
  id: string;
  domain: string;
  target: string;
  status: string;
  direction: string;
  baseline_score: number | null;
  current_score: number | null;
  created_at: string;
}

export interface OutcomeReviewInput {
  target_id: string;
  date: string;
  score: number;
  reviewer_notes: string;
}

export interface CamhsReferralInput {
  id: string;
  referral_date: string;
  referral_status: string;
  current_therapeutic_approach: string;
  sessions_held: number;
  sessions_scheduled: number;
  engagement_level: string;
  waiting_time_weeks: number;
}

export interface MentalHealthCheckInInput {
  date: string;
  overall_mood: number;
  anxiety_level: number;
  sleep_quality: number;
  self_harm_risk: string;
  stressors: string[];
}

export interface ChildIncidentInput {
  date: string;
  type: string;
  severity: string;
}

export interface RestraintRecordInput {
  date: string;
  duration_minutes: number;
  type: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type TrajectoryDirection = "improving" | "stable" | "declining" | "insufficient_data";
export type EngagementLevel = "excellent" | "good" | "inconsistent" | "poor" | "disengaged";
export type TherapeuticConcernLevel = "none" | "low" | "moderate" | "significant" | "critical";

export interface TherapeuticProgressResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  placement_duration_days: number;

  overall_trajectory: TrajectoryDirection;
  overall_progress_score: number;
  headline: string;

  therapy_engagement: TherapyEngagement;
  mood_trajectory: MoodTrajectory;
  behaviour_trajectory: BehaviourTrajectory;
  keywork_effectiveness: KeyworkEffectiveness;
  outcome_progress: OutcomeProgressSummary;
  camhs_status: CamhsStatusSummary;
  concern_level: TherapeuticConcernLevel;

  strengths: string[];
  concerns: string[];
  recommendations: TherapeuticRecommendation[];
  insights: TherapeuticInsight[];
}

export interface TherapyEngagement {
  total_sessions: number;
  attended: number;
  missed: number;
  attendance_rate: number;
  engagement_level: EngagementLevel;
  sessions_last_30d: number;
  modalities_used: string[];
  average_mood_improvement: number;
  escalation_flags_count: number;
  common_themes: string[];
}

export interface MoodTrajectory {
  direction: TrajectoryDirection;
  current_avg_mood: number | null;
  previous_avg_mood: number | null;
  mood_variance: number;
  lowest_recent_mood: number | null;
  highest_recent_mood: number | null;
  data_points: number;
}

export interface BehaviourTrajectory {
  direction: TrajectoryDirection;
  incidents_last_30d: number;
  incidents_previous_30d: number;
  restraints_last_30d: number;
  restraints_previous_30d: number;
  de_escalation_success_rate: number;
  severity_trend: TrajectoryDirection;
  common_triggers: string[];
}

export interface KeyworkEffectiveness {
  total_sessions: number;
  sessions_last_30d: number;
  average_mood_lift: number;
  action_completion_rate: number;
  therapeutic_session_pct: number;
  topics_coverage: string[];
}

export interface OutcomeProgressSummary {
  total_targets: number;
  improving: number;
  stable: number;
  declining: number;
  achieved: number;
  average_progress_pct: number;
}

export interface CamhsStatusSummary {
  active_referrals: number;
  total_sessions_held: number;
  engagement_level: string;
  approaches_used: string[];
  waiting: boolean;
  waiting_weeks: number | null;
}

export interface TherapeuticRecommendation {
  rank: number;
  recommendation: string;
  domain: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string | null;
}

export interface TherapeuticInsight {
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

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

function variance(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
  const v = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
  return Math.round(v * 10) / 10;
}

function topN(items: string[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item) counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

// ── Core Compute ────────────────────────────────────────────────────────────

export function computeTherapeuticProgress(input: TherapeuticProgressInput): TherapeuticProgressResult {
  const placementDays = daysBetween(input.placement_start_date, input.today);

  const therapy = computeTherapyEngagement(input);
  const mood = computeMoodTrajectory(input);
  const behaviour = computeBehaviourTrajectory(input);
  const keywork = computeKeyworkEffectiveness(input);
  const outcomes = computeOutcomeProgress(input);
  const camhs = computeCamhsStatus(input);

  const overallScore = computeOverallScore(therapy, mood, behaviour, keywork, outcomes);
  const trajectory = computeOverallTrajectory(mood, behaviour, outcomes);
  const concernLevel = computeConcernLevel(therapy, mood, behaviour, input);

  const strengths = identifyStrengths(therapy, mood, behaviour, keywork, outcomes, camhs);
  const concerns = identifyConcerns(therapy, mood, behaviour, keywork, outcomes, camhs, input);
  const recommendations = buildRecommendations(therapy, mood, behaviour, keywork, outcomes, camhs, concernLevel, input);
  const insights = generateInsights(therapy, mood, behaviour, keywork, outcomes, camhs, concernLevel, input);

  const headline = buildHeadline(input.child_name, trajectory, overallScore, concernLevel);

  return {
    generated_at: input.today,
    child_id: input.child_id,
    child_name: input.child_name,
    placement_duration_days: placementDays,
    overall_trajectory: trajectory,
    overall_progress_score: overallScore,
    headline,
    therapy_engagement: therapy,
    mood_trajectory: mood,
    behaviour_trajectory: behaviour,
    keywork_effectiveness: keywork,
    outcome_progress: outcomes,
    camhs_status: camhs,
    concern_level: concernLevel,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

// ── Therapy Engagement ──────────────────────────────────────────────────────

function computeTherapyEngagement(input: TherapeuticProgressInput): TherapyEngagement {
  const sessions = input.therapy_sessions;
  const total = sessions.length;
  const attended = sessions.filter((s) => s.attended).length;
  const missed = total - attended;
  const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

  const sessions30d = sessions.filter((s) => withinDays(s.session_date, input.today, 30));

  const modalities = [...new Set(sessions.map((s) => s.modality).filter(Boolean))];

  const moodImprovements = sessions
    .filter((s) => s.attended && s.post_session_mood > 0 && s.pre_session_mood > 0)
    .map((s) => s.post_session_mood - s.pre_session_mood);
  const avgMoodImprovement = average(moodImprovements);

  const escalationFlags = sessions.reduce((sum, s) => sum + s.escalation_flags.length, 0);
  const themes = topN(sessions.map((s) => s.general_theme), 5);

  let engagement: EngagementLevel;
  if (rate >= 90 && total >= 3) engagement = "excellent";
  else if (rate >= 75) engagement = "good";
  else if (rate >= 50) engagement = "inconsistent";
  else if (total > 0) engagement = "poor";
  else engagement = "disengaged";

  return {
    total_sessions: total,
    attended,
    missed,
    attendance_rate: rate,
    engagement_level: engagement,
    sessions_last_30d: sessions30d.filter((s) => s.attended).length,
    modalities_used: modalities,
    average_mood_improvement: avgMoodImprovement,
    escalation_flags_count: escalationFlags,
    common_themes: themes,
  };
}

// ── Mood Trajectory ─────────────────────────────────────────────────────────

function computeMoodTrajectory(input: TherapeuticProgressInput): MoodTrajectory {
  // Collect mood data from therapy, keywork, and mental health check-ins
  const moodPoints: { date: string; score: number }[] = [];

  for (const ts of input.therapy_sessions) {
    if (ts.attended && ts.post_session_mood > 0) {
      moodPoints.push({ date: ts.session_date, score: ts.post_session_mood });
    }
  }
  for (const ks of input.keywork_sessions) {
    if (ks.mood_after > 0) {
      moodPoints.push({ date: ks.date, score: ks.mood_after });
    }
  }
  for (const mh of input.mental_health_check_ins) {
    if (mh.overall_mood > 0) {
      moodPoints.push({ date: mh.date, score: mh.overall_mood });
    }
  }

  if (moodPoints.length < 2) {
    return {
      direction: "insufficient_data",
      current_avg_mood: moodPoints.length === 1 ? moodPoints[0].score : null,
      previous_avg_mood: null,
      mood_variance: 0,
      lowest_recent_mood: moodPoints.length > 0 ? Math.min(...moodPoints.map((m) => m.score)) : null,
      highest_recent_mood: moodPoints.length > 0 ? Math.max(...moodPoints.map((m) => m.score)) : null,
      data_points: moodPoints.length,
    };
  }

  moodPoints.sort((a, b) => a.date.localeCompare(b.date));

  // Recent = last 30 days, previous = 30-60 days
  const recent = moodPoints.filter((m) => withinDays(m.date, input.today, 30));
  const previous = moodPoints.filter((m) => {
    const d = daysBetween(m.date, input.today);
    return d > 30 && d <= 60;
  });

  const recentAvg = recent.length > 0 ? average(recent.map((m) => m.score)) : null;
  const prevAvg = previous.length > 0 ? average(previous.map((m) => m.score)) : null;

  let direction: TrajectoryDirection = "stable";
  if (recentAvg !== null && prevAvg !== null) {
    if (recentAvg > prevAvg + 0.3) direction = "improving";
    else if (recentAvg < prevAvg - 0.3) direction = "declining";
  } else if (moodPoints.length >= 3) {
    const half = Math.floor(moodPoints.length / 2);
    const firstHalf = average(moodPoints.slice(0, half).map((m) => m.score));
    const secondHalf = average(moodPoints.slice(half).map((m) => m.score));
    if (secondHalf > firstHalf + 0.3) direction = "improving";
    else if (secondHalf < firstHalf - 0.3) direction = "declining";
  }

  const allScores = moodPoints.map((m) => m.score);

  return {
    direction,
    current_avg_mood: recentAvg ?? average(moodPoints.slice(-3).map((m) => m.score)),
    previous_avg_mood: prevAvg,
    mood_variance: variance(allScores),
    lowest_recent_mood: recent.length > 0 ? Math.min(...recent.map((m) => m.score)) : Math.min(...allScores),
    highest_recent_mood: recent.length > 0 ? Math.max(...recent.map((m) => m.score)) : Math.max(...allScores),
    data_points: moodPoints.length,
  };
}

// ── Behaviour Trajectory ────────────────────────────────────────────────────

function computeBehaviourTrajectory(input: TherapeuticProgressInput): BehaviourTrajectory {
  const entries = input.behaviour_entries;
  const incidents = input.incidents;
  const restraints = input.restraint_records;

  const inc30d = incidents.filter((i) => withinDays(i.date, input.today, 30)).length;
  const inc60d = incidents.filter((i) => {
    const d = daysBetween(i.date, input.today);
    return d > 30 && d <= 60;
  }).length;

  const res30d = restraints.filter((r) => withinDays(r.date, input.today, 30)).length;
  const res60d = restraints.filter((r) => {
    const d = daysBetween(r.date, input.today);
    return d > 30 && d <= 60;
  }).length;

  const deEscEntries = entries.filter((e) => e.de_escalation_used);
  const deEscSuccess = deEscEntries.filter((e) => e.response_effective).length;
  const deEscRate = deEscEntries.length > 0 ? Math.round((deEscSuccess / deEscEntries.length) * 100) : 0;

  let direction: TrajectoryDirection = "stable";
  if (inc30d + res30d < inc60d + res60d - 1) direction = "improving";
  else if (inc30d + res30d > inc60d + res60d + 1) direction = "declining";
  if (entries.length === 0 && incidents.length === 0) direction = "insufficient_data";

  // Severity trend
  const recent30 = entries.filter((e) => withinDays(e.date, input.today, 30));
  const prev30 = entries.filter((e) => {
    const d = daysBetween(e.date, input.today);
    return d > 30 && d <= 60;
  });
  const sevScore = (s: string) => s === "critical" ? 4 : s === "high" ? 3 : s === "medium" ? 2 : 1;
  const recentSev = recent30.length > 0 ? average(recent30.map((e) => sevScore(e.severity))) : 0;
  const prevSev = prev30.length > 0 ? average(prev30.map((e) => sevScore(e.severity))) : 0;
  let sevTrend: TrajectoryDirection = "stable";
  if (recent30.length > 0 && prev30.length > 0) {
    if (recentSev < prevSev - 0.3) sevTrend = "improving";
    else if (recentSev > prevSev + 0.3) sevTrend = "declining";
  } else {
    sevTrend = "insufficient_data";
  }

  const triggers = topN(entries.map((e) => e.trigger ?? "").filter(Boolean), 5);

  return {
    direction,
    incidents_last_30d: inc30d,
    incidents_previous_30d: inc60d,
    restraints_last_30d: res30d,
    restraints_previous_30d: res60d,
    de_escalation_success_rate: deEscRate,
    severity_trend: sevTrend,
    common_triggers: triggers,
  };
}

// ── Keywork Effectiveness ───────────────────────────────────────────────────

function computeKeyworkEffectiveness(input: TherapeuticProgressInput): KeyworkEffectiveness {
  const sessions = input.keywork_sessions;
  const total = sessions.length;
  const sessions30d = sessions.filter((s) => withinDays(s.date, input.today, 30)).length;

  const moodLifts = sessions
    .filter((s) => s.mood_before > 0 && s.mood_after > 0)
    .map((s) => s.mood_after - s.mood_before);
  const avgLift = average(moodLifts);

  const withActions = sessions.filter((s) => s.actions_agreed.length > 0);
  const completed = withActions.filter((s) => s.follow_up_completed).length;
  const actionRate = withActions.length > 0 ? Math.round((completed / withActions.length) * 100) : 0;

  const therapeutic = sessions.filter((s) => s.type === "therapeutic" || s.type === "wellbeing_check").length;
  const therapeuticPct = total > 0 ? Math.round((therapeutic / total) * 100) : 0;

  const allTopics = sessions.flatMap((s) => s.topics);
  const coverage = topN(allTopics, 8);

  return {
    total_sessions: total,
    sessions_last_30d: sessions30d,
    average_mood_lift: avgLift,
    action_completion_rate: actionRate,
    therapeutic_session_pct: therapeuticPct,
    topics_coverage: coverage,
  };
}

// ── Outcome Progress ────────────────────────────────────────────────────────

function computeOutcomeProgress(input: TherapeuticProgressInput): OutcomeProgressSummary {
  const targets = input.outcome_targets;
  const total = targets.length;
  if (total === 0) {
    return { total_targets: 0, improving: 0, stable: 0, declining: 0, achieved: 0, average_progress_pct: 0 };
  }

  const improving = targets.filter((t) => t.direction === "improving").length;
  const stable = targets.filter((t) => t.direction === "stable" || t.direction === "maintaining").length;
  const declining = targets.filter((t) => t.direction === "declining").length;
  const achieved = targets.filter((t) => t.status === "achieved" || t.status === "completed").length;

  const progressScores = targets
    .filter((t) => t.baseline_score !== null && t.current_score !== null && t.baseline_score !== 0)
    .map((t) => Math.round(((t.current_score! - t.baseline_score!) / Math.max(1, 10 - t.baseline_score!)) * 100));
  const avgProgress = progressScores.length > 0 ? Math.round(average(progressScores)) : 0;

  return { total_targets: total, improving, stable, declining, achieved, average_progress_pct: avgProgress };
}

// ── CAMHS Status ────────────────────────────────────────────────────────────

function computeCamhsStatus(input: TherapeuticProgressInput): CamhsStatusSummary {
  const refs = input.camhs_referrals;
  const active = refs.filter((r) => r.referral_status === "active" || r.referral_status === "in_progress" || r.referral_status === "accepted");
  const totalSessions = refs.reduce((s, r) => s + r.sessions_held, 0);
  const approaches = [...new Set(refs.map((r) => r.current_therapeutic_approach).filter(Boolean))];
  const waiting = refs.some((r) => r.referral_status === "waiting" || r.referral_status === "pending");
  const waitWeeks = waiting
    ? Math.max(...refs.filter((r) => r.referral_status === "waiting" || r.referral_status === "pending").map((r) => r.waiting_time_weeks))
    : null;

  const engLevels = refs.map((r) => r.engagement_level).filter(Boolean);
  const engagement = engLevels.length > 0 ? engLevels[engLevels.length - 1] : "none";

  return {
    active_referrals: active.length,
    total_sessions_held: totalSessions,
    engagement_level: engagement,
    approaches_used: approaches,
    waiting,
    waiting_weeks: waitWeeks,
  };
}

// ── Overall Score & Trajectory ──────────────────────────────────────────────

function computeOverallScore(
  therapy: TherapyEngagement,
  mood: MoodTrajectory,
  behaviour: BehaviourTrajectory,
  keywork: KeyworkEffectiveness,
  outcomes: OutcomeProgressSummary,
): number {
  let score = 50;

  // Therapy engagement (+/- 15)
  if (therapy.engagement_level === "excellent") score += 15;
  else if (therapy.engagement_level === "good") score += 10;
  else if (therapy.engagement_level === "inconsistent") score += 0;
  else if (therapy.engagement_level === "poor") score -= 10;
  else score -= 5; // disengaged but neutral if no therapy required

  // Mood trajectory (+/- 10)
  if (mood.direction === "improving") score += 10;
  else if (mood.direction === "declining") score -= 10;

  // Behaviour trajectory (+/- 15)
  if (behaviour.direction === "improving") score += 15;
  else if (behaviour.direction === "declining") score -= 15;
  if (behaviour.de_escalation_success_rate > 70) score += 5;

  // Keywork (+/- 5)
  if (keywork.action_completion_rate > 75) score += 5;
  else if (keywork.action_completion_rate < 30 && keywork.total_sessions > 3) score -= 5;

  // Outcomes (+/- 10)
  if (outcomes.total_targets > 0) {
    if (outcomes.improving > outcomes.declining) score += 10;
    else if (outcomes.declining > outcomes.improving) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function computeOverallTrajectory(
  mood: MoodTrajectory,
  behaviour: BehaviourTrajectory,
  outcomes: OutcomeProgressSummary,
): TrajectoryDirection {
  let improvingSignals = 0;
  let decliningSignals = 0;

  if (mood.direction === "improving") improvingSignals++;
  if (mood.direction === "declining") decliningSignals++;
  if (behaviour.direction === "improving") improvingSignals++;
  if (behaviour.direction === "declining") decliningSignals++;
  if (outcomes.improving > outcomes.declining) improvingSignals++;
  if (outcomes.declining > outcomes.improving) decliningSignals++;

  if (improvingSignals >= 2 && decliningSignals === 0) return "improving";
  if (decliningSignals >= 2 && improvingSignals === 0) return "declining";
  if (improvingSignals > decliningSignals) return "improving";
  if (decliningSignals > improvingSignals) return "declining";
  if (mood.direction === "insufficient_data" && behaviour.direction === "insufficient_data") return "insufficient_data";
  return "stable";
}

function computeConcernLevel(
  therapy: TherapyEngagement,
  mood: MoodTrajectory,
  behaviour: BehaviourTrajectory,
  input: TherapeuticProgressInput,
): TherapeuticConcernLevel {
  let score = 0;

  if (therapy.escalation_flags_count > 3) score += 3;
  else if (therapy.escalation_flags_count > 0) score += 1;

  if (mood.direction === "declining" && mood.current_avg_mood !== null && mood.current_avg_mood < 3) score += 3;
  else if (mood.direction === "declining") score += 2;

  if (behaviour.direction === "declining") score += 2;
  if (behaviour.restraints_last_30d > 2) score += 2;
  else if (behaviour.restraints_last_30d > 0) score += 1;

  const selfHarm = input.mental_health_check_ins.filter((m) => m.self_harm_risk === "high" || m.self_harm_risk === "active");
  if (selfHarm.length > 0) score += 3;

  const highSevIncidents = input.incidents.filter((i) => withinDays(i.date, input.today, 30) && (i.severity === "critical" || i.severity === "high")).length;
  if (highSevIncidents > 2) score += 2;
  else if (highSevIncidents > 0) score += 1;

  if (therapy.engagement_level === "poor" || therapy.engagement_level === "disengaged") score += 1;

  if (score >= 8) return "critical";
  if (score >= 5) return "significant";
  if (score >= 3) return "moderate";
  if (score >= 1) return "low";
  return "none";
}

// ── Strengths & Concerns ────────────────────────────────────────────────────

function identifyStrengths(
  therapy: TherapyEngagement,
  mood: MoodTrajectory,
  behaviour: BehaviourTrajectory,
  keywork: KeyworkEffectiveness,
  outcomes: OutcomeProgressSummary,
  camhs: CamhsStatusSummary,
): string[] {
  const strengths: string[] = [];

  if (therapy.engagement_level === "excellent" || therapy.engagement_level === "good") {
    strengths.push(`Strong therapy engagement (${therapy.attendance_rate}% attendance)`);
  }
  if (therapy.average_mood_improvement > 0.5) {
    strengths.push(`Positive mood shift after therapy sessions (+${therapy.average_mood_improvement})`);
  }
  if (mood.direction === "improving") {
    strengths.push("Overall mood trajectory improving");
  }
  if (behaviour.direction === "improving") {
    strengths.push("Behaviour incidents reducing over time");
  }
  if (behaviour.de_escalation_success_rate > 70) {
    strengths.push(`Effective de-escalation (${behaviour.de_escalation_success_rate}% success)`);
  }
  if (keywork.average_mood_lift > 0.3) {
    strengths.push("Keywork sessions lifting mood consistently");
  }
  if (keywork.action_completion_rate > 75) {
    strengths.push(`Strong follow-through on keywork actions (${keywork.action_completion_rate}%)`);
  }
  if (outcomes.improving > 0 && outcomes.declining === 0) {
    strengths.push(`All ${outcomes.improving} active outcomes progressing well`);
  }
  if (camhs.active_referrals > 0 && camhs.engagement_level === "good" || camhs.engagement_level === "excellent") {
    strengths.push("Actively engaged with CAMHS support");
  }

  return strengths.slice(0, 8);
}

function identifyConcerns(
  therapy: TherapyEngagement,
  mood: MoodTrajectory,
  behaviour: BehaviourTrajectory,
  keywork: KeyworkEffectiveness,
  outcomes: OutcomeProgressSummary,
  camhs: CamhsStatusSummary,
  input: TherapeuticProgressInput,
): string[] {
  const concerns: string[] = [];

  if (therapy.missed > 2 && therapy.attendance_rate < 60) {
    concerns.push(`Low therapy attendance — ${therapy.missed} sessions missed (${therapy.attendance_rate}%)`);
  }
  if (mood.direction === "declining") {
    concerns.push(`Mood declining — current avg ${mood.current_avg_mood ?? "?"}`);
  }
  if (mood.mood_variance > 2) {
    concerns.push("High mood variability — emotional regulation may need support");
  }
  if (behaviour.direction === "declining") {
    concerns.push(`Behaviour escalating — ${behaviour.incidents_last_30d} incidents in last 30 days`);
  }
  if (behaviour.restraints_last_30d > 0) {
    concerns.push(`${behaviour.restraints_last_30d} restraint(s) in last 30 days`);
  }
  if (outcomes.declining > 0) {
    concerns.push(`${outcomes.declining} outcome target(s) declining`);
  }
  if (camhs.waiting && camhs.waiting_weeks !== null && camhs.waiting_weeks > 12) {
    concerns.push(`CAMHS waiting list — ${camhs.waiting_weeks} weeks and counting`);
  }
  if (therapy.escalation_flags_count > 2) {
    concerns.push(`${therapy.escalation_flags_count} therapy escalation flags raised`);
  }
  const selfHarm = input.mental_health_check_ins.filter((m) => m.self_harm_risk === "high" || m.self_harm_risk === "active");
  if (selfHarm.length > 0) {
    concerns.push("Self-harm risk flagged in mental health check-ins");
  }

  return concerns.slice(0, 8);
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  therapy: TherapyEngagement,
  mood: MoodTrajectory,
  behaviour: BehaviourTrajectory,
  keywork: KeyworkEffectiveness,
  outcomes: OutcomeProgressSummary,
  camhs: CamhsStatusSummary,
  concernLevel: TherapeuticConcernLevel,
  input: TherapeuticProgressInput,
): TherapeuticRecommendation[] {
  const recs: TherapeuticRecommendation[] = [];
  let rank = 0;

  if (concernLevel === "critical" || concernLevel === "significant") {
    recs.push({
      rank: ++rank,
      recommendation: "Convene multi-disciplinary review of therapeutic progress and wellbeing plan",
      domain: "care_planning",
      urgency: "immediate",
      regulatory_ref: "Reg 9",
    });
  }

  if (therapy.attendance_rate < 60 && therapy.total_sessions > 2) {
    recs.push({
      rank: ++rank,
      recommendation: "Address therapy non-attendance — explore barriers and adapt approach",
      domain: "therapy",
      urgency: "soon",
      regulatory_ref: "Reg 10",
    });
  }

  if (behaviour.direction === "declining" && behaviour.restraints_last_30d > behaviour.restraints_previous_30d) {
    recs.push({
      rank: ++rank,
      recommendation: "Review behaviour support plan — restraint use increasing",
      domain: "behaviour",
      urgency: "immediate",
      regulatory_ref: "Reg 19",
    });
  }

  if (mood.direction === "declining" && mood.current_avg_mood !== null && mood.current_avg_mood < 3) {
    recs.push({
      rank: ++rank,
      recommendation: "Increase wellbeing monitoring — low and declining mood requires heightened support",
      domain: "wellbeing",
      urgency: "immediate",
      regulatory_ref: "Reg 10",
    });
  }

  if (camhs.waiting && camhs.waiting_weeks !== null && camhs.waiting_weeks > 12) {
    recs.push({
      rank: ++rank,
      recommendation: "Escalate CAMHS referral — excessive wait may require alternative therapeutic provision",
      domain: "camhs",
      urgency: "soon",
      regulatory_ref: "Reg 10",
    });
  }

  if (keywork.action_completion_rate < 40 && keywork.total_sessions > 3) {
    recs.push({
      rank: ++rank,
      recommendation: "Improve keywork action follow-through — only " + keywork.action_completion_rate + "% completed",
      domain: "keywork",
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  if (outcomes.declining > outcomes.improving && outcomes.total_targets > 0) {
    recs.push({
      rank: ++rank,
      recommendation: "Review outcome targets — more declining than improving, targets may need adjustment",
      domain: "outcomes",
      urgency: "soon",
      regulatory_ref: "Reg 6",
    });
  }

  if (therapy.total_sessions === 0 && input.camhs_referrals.length === 0 && concernLevel !== "none") {
    recs.push({
      rank: ++rank,
      recommendation: "Consider therapeutic assessment — concern indicators present with no current provision",
      domain: "therapy",
      urgency: "soon",
      regulatory_ref: "Reg 10",
    });
  }

  if (keywork.sessions_last_30d < 2) {
    recs.push({
      rank: ++rank,
      recommendation: "Increase keywork frequency — fewer than 2 sessions in last 30 days",
      domain: "keywork",
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  return recs.slice(0, 10);
}

// ── Insights ────────────────────────────────────────────────────────────────

function generateInsights(
  therapy: TherapyEngagement,
  mood: MoodTrajectory,
  behaviour: BehaviourTrajectory,
  keywork: KeyworkEffectiveness,
  outcomes: OutcomeProgressSummary,
  camhs: CamhsStatusSummary,
  concernLevel: TherapeuticConcernLevel,
  input: TherapeuticProgressInput,
): TherapeuticInsight[] {
  const insights: TherapeuticInsight[] = [];

  if (concernLevel === "none" && mood.direction !== "declining" && behaviour.direction !== "declining") {
    insights.push({
      text: `${input.child_name} is showing positive therapeutic stability — no concerning indicators across therapy, mood, or behaviour domains.`,
      severity: "positive",
    });
  }

  if (concernLevel === "critical") {
    insights.push({
      text: `Critical therapeutic concern level for ${input.child_name} — multiple risk indicators active across behaviour, mood, and/or safety domains.`,
      severity: "critical",
    });
  }

  if (therapy.average_mood_improvement > 0.5 && therapy.attendance_rate > 80) {
    insights.push({
      text: `Therapy is demonstrably effective — ${input.child_name} shows consistent mood improvement post-session (avg +${therapy.average_mood_improvement}).`,
      severity: "positive",
    });
  }

  if (behaviour.direction === "improving" && behaviour.restraints_last_30d < behaviour.restraints_previous_30d) {
    insights.push({
      text: "Reducing behaviour incidents and restraint use indicates developing emotional regulation and de-escalation responsiveness.",
      severity: "positive",
    });
  }

  if (behaviour.direction === "declining" && therapy.engagement_level === "poor") {
    insights.push({
      text: "Escalating behaviour combined with poor therapy engagement suggests unmet therapeutic need — consider alternative modalities.",
      severity: "critical",
    });
  }

  if (mood.mood_variance > 2.5) {
    insights.push({
      text: `High mood variability (variance ${mood.mood_variance}) may indicate emotional dysregulation — consider trauma-informed stabilisation approaches.`,
      severity: "warning",
    });
  }

  if (outcomes.achieved > 0) {
    insights.push({
      text: `${outcomes.achieved} outcome target(s) achieved — evidence of measurable progress suitable for LAC review and Ofsted evidence.`,
      severity: "positive",
    });
  }

  if (keywork.therapeutic_session_pct > 40) {
    insights.push({
      text: `${keywork.therapeutic_session_pct}% of keywork sessions are therapeutic in nature — good therapeutic content integration.`,
      severity: "positive",
    });
  }

  if (camhs.waiting && camhs.waiting_weeks !== null && camhs.waiting_weeks > 16) {
    insights.push({
      text: `CAMHS wait of ${camhs.waiting_weeks} weeks exceeds reasonable timeframe — may constitute a health service gap under Reg 10.`,
      severity: "warning",
    });
  }

  return insights.slice(0, 8);
}

// ── Headline ────────────────────────────────────────────────────────────────

function buildHeadline(
  name: string,
  trajectory: TrajectoryDirection,
  score: number,
  concern: TherapeuticConcernLevel,
): string {
  if (concern === "critical") {
    return `${name} — critical therapeutic concerns requiring immediate multi-disciplinary review`;
  }
  if (concern === "significant") {
    return `${name} — significant concerns across therapeutic domains, heightened monitoring recommended`;
  }
  if (trajectory === "improving" && score >= 65) {
    return `${name} — positive therapeutic trajectory with demonstrable progress across key domains`;
  }
  if (trajectory === "improving") {
    return `${name} — improving therapeutic indicators, continued support strengthening outcomes`;
  }
  if (trajectory === "declining") {
    return `${name} — declining therapeutic indicators, intervention review recommended`;
  }
  if (trajectory === "insufficient_data") {
    return `${name} — insufficient therapeutic data to assess trajectory, more structured monitoring needed`;
  }
  return `${name} — stable therapeutic trajectory, maintaining progress across monitored domains`;
}
