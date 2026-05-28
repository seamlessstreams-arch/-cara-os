// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF WELLBEING & RETENTION INTELLIGENCE ENGINE
// Tracks staff wellbeing, morale, sickness absence patterns, turnover rates,
// wellbeing support provision, and retention effectiveness across the home.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 16 (Workforce — sufficient, competent, skilled staff).
// CHR 2015 Reg 32 (Fitness of workers — ongoing suitability and support).
// SCCIF: "Leadership and management — staff feel supported and valued."
// Store keys: staffSicknessRecords, staffWellbeingSurveyRecords,
//             staffRetentionRecords, wellbeingSupportRecords,
//             exitInterviewRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StaffSicknessRecordInput {
  id: string;
  staff_id: string;
  date_from: string;                    // YYYY-MM-DD
  date_to: string;                      // YYYY-MM-DD
  reason: string;                       // short_term | long_term | stress_related | musculoskeletal | mental_health | physical_illness | injury | other
  days_lost: number;
  return_to_work_interview_completed: boolean;
  occupational_health_referral: boolean;
  phased_return: boolean;
  fit_note_received: boolean;
  manager_notified_promptly: boolean;
  notes: string | null;
  created_at: string;
}

export interface StaffWellbeingSurveyRecordInput {
  id: string;
  staff_id: string;
  date: string;                         // YYYY-MM-DD
  overall_wellbeing_score: number;      // 1-10
  workload_score: number;               // 1-10
  team_support_score: number;           // 1-10
  management_support_score: number;     // 1-10
  work_life_balance_score: number;      // 1-10
  job_satisfaction_score: number;       // 1-10
  morale_score: number;                 // 1-10
  feels_valued: boolean;
  would_recommend_employer: boolean;
  stress_factors: string[];
  positive_factors: string[];
  improvement_suggestions: string | null;
  anonymous: boolean;
  created_at: string;
}

export interface StaffRetentionRecordInput {
  id: string;
  staff_id: string;
  date: string;                         // YYYY-MM-DD
  event_type: "joined" | "left" | "internal_transfer" | "promotion" | "contract_extension" | "probation_passed" | "probation_failed";
  reason_for_leaving: string | null;    // resignation | dismissal | redundancy | retirement | end_of_contract | career_change | dissatisfaction | personal | relocation | other
  notice_period_served: boolean;
  length_of_service_months: number;
  role: string;
  replacement_recruited: boolean;
  handover_completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface WellbeingSupportRecordInput {
  id: string;
  staff_id: string;
  date: string;                         // YYYY-MM-DD
  support_type: string;                 // counselling | eap | peer_support | management_1to1 | occupational_health | stress_risk_assessment | flexible_working | supervision_wellbeing | external_referral | other
  support_offered: boolean;
  support_accepted: boolean;
  support_completed: boolean;
  outcome_rating: number;               // 1-5
  follow_up_needed: boolean;
  follow_up_completed: boolean;
  referred_by: string;
  notes: string | null;
  created_at: string;
}

export interface ExitInterviewRecordInput {
  id: string;
  staff_id: string;
  date: string;                         // YYYY-MM-DD
  conducted: boolean;
  conducted_by: string;
  overall_experience_rating: number;    // 1-10
  management_rating: number;            // 1-10
  team_rating: number;                  // 1-10
  development_rating: number;           // 1-10
  workload_rating: number;              // 1-10
  reasons_for_leaving: string[];
  what_could_improve: string[];
  would_return: boolean;
  would_recommend: boolean;
  themes_identified: string[];
  notes: string | null;
  created_at: string;
}

export interface StaffWellbeingRetentionInput {
  today: string;                        // YYYY-MM-DD
  total_staff: number;
  staff_sickness_records: StaffSicknessRecordInput[];
  staff_wellbeing_survey_records: StaffWellbeingSurveyRecordInput[];
  staff_retention_records: StaffRetentionRecordInput[];
  wellbeing_support_records: WellbeingSupportRecordInput[];
  exit_interview_records: ExitInterviewRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffWellbeingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StaffWellbeingRetentionInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface StaffWellbeingRetentionRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface StaffWellbeingRetentionResult {
  wellbeing_rating: StaffWellbeingRating;
  wellbeing_score: number;
  headline: string;
  total_sickness_records: number;
  total_survey_records: number;
  total_retention_events: number;
  total_support_records: number;
  total_exit_interviews: number;
  sickness_absence_rate: number;
  wellbeing_survey_completion_rate: number;
  retention_rate: number;
  wellbeing_support_uptake_rate: number;
  exit_interview_completion_rate: number;
  staff_satisfaction_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: StaffWellbeingRetentionRecommendation[];
  insights: StaffWellbeingRetentionInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): StaffWellbeingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: StaffWellbeingRating,
  score: number,
  headline: string,
): StaffWellbeingRetentionResult {
  return {
    wellbeing_rating: rating,
    wellbeing_score: score,
    headline,
    total_sickness_records: 0,
    total_survey_records: 0,
    total_retention_events: 0,
    total_support_records: 0,
    total_exit_interviews: 0,
    sickness_absence_rate: 0,
    wellbeing_survey_completion_rate: 0,
    retention_rate: 0,
    wellbeing_support_uptake_rate: 0,
    exit_interview_completion_rate: 0,
    staff_satisfaction_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeStaffWellbeingRetention(
  input: StaffWellbeingRetentionInput,
): StaffWellbeingRetentionResult {
  const {
    today,
    total_staff,
    staff_sickness_records,
    staff_wellbeing_survey_records,
    staff_retention_records,
    wellbeing_support_records,
    exit_interview_records,
  } = input;

  // ── Special case: all empty + 0 staff → insufficient_data ────────────
  const allEmpty =
    staff_sickness_records.length === 0 &&
    staff_wellbeing_survey_records.length === 0 &&
    staff_retention_records.length === 0 &&
    wellbeing_support_records.length === 0 &&
    exit_interview_records.length === 0;

  if (allEmpty && total_staff === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No staff registered — insufficient data to assess staff wellbeing and retention.",
    );
  }

  // ── Special case: all empty + staff > 0 → inadequate ─────────────────
  if (allEmpty && total_staff > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No staff wellbeing or retention data recorded despite active staff — wellbeing and retention monitoring requires urgent attention.",
      ),
      concerns: [
        "No sickness absence records, wellbeing surveys, retention events, wellbeing support records, or exit interviews exist despite staff being employed — the home cannot evidence adequate workforce wellbeing management or retention oversight.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of staff sickness absence, wellbeing surveys, retention events, wellbeing support provision, and exit interviews to evidence the home's management of workforce wellbeing and retention.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 16 — Workforce",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every staff member has access to regular wellbeing check-ins, that sickness absence is tracked systematically, and that leavers receive exit interviews to identify and address retention issues.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
        },
      ],
      insights: [
        {
          text: "The complete absence of staff wellbeing and retention records means Ofsted cannot verify that the home supports staff wellbeing, manages sickness effectively, or monitors turnover. This represents a fundamental gap in Reg 16 and Reg 32 compliance and undermines the home's ability to evidence strong leadership and management under the SCCIF framework.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Sickness absence metrics ---
  const totalSicknessRecords = staff_sickness_records.length;

  const totalDaysLost = staff_sickness_records.reduce(
    (sum, r) => sum + r.days_lost,
    0,
  );

  // Sickness absence rate: total days lost as % of available working days
  // Approximation: total_staff * 260 working days per year, but we use a
  // 90-day rolling window to keep the metric current.
  // We use the simpler: unique staff with sickness / total_staff
  const uniqueStaffWithSickness = new Set(
    staff_sickness_records.map((r) => r.staff_id),
  ).size;
  const sicknessAbsenceRate = pct(uniqueStaffWithSickness, total_staff);

  const returnToWorkCompleted = staff_sickness_records.filter(
    (r) => r.return_to_work_interview_completed,
  ).length;
  const returnToWorkRate = pct(returnToWorkCompleted, totalSicknessRecords);

  const ohReferrals = staff_sickness_records.filter(
    (r) => r.occupational_health_referral,
  ).length;

  const stressRelatedAbsence = staff_sickness_records.filter(
    (r) => r.reason === "stress_related" || r.reason === "mental_health",
  ).length;
  const stressRelatedRate = pct(stressRelatedAbsence, totalSicknessRecords);

  const managerNotifiedPromptly = staff_sickness_records.filter(
    (r) => r.manager_notified_promptly,
  ).length;
  const promptNotificationRate = pct(managerNotifiedPromptly, totalSicknessRecords);

  const longTermAbsence = staff_sickness_records.filter(
    (r) => r.reason === "long_term" || r.days_lost > 28,
  ).length;
  const longTermAbsenceRate = pct(longTermAbsence, totalSicknessRecords);

  const fitNoteReceived = staff_sickness_records.filter(
    (r) => r.fit_note_received,
  ).length;
  const fitNoteComplianceRate = pct(fitNoteReceived, totalSicknessRecords);

  const phasedReturns = staff_sickness_records.filter(
    (r) => r.phased_return,
  ).length;

  // --- Wellbeing survey metrics ---
  const totalSurveyRecords = staff_wellbeing_survey_records.length;

  const uniqueStaffSurveyed = new Set(
    staff_wellbeing_survey_records.map((r) => r.staff_id),
  ).size;
  const wellbeingSurveyCompletionRate = pct(uniqueStaffSurveyed, total_staff);

  const overallWellbeingScores = staff_wellbeing_survey_records.map(
    (r) => r.overall_wellbeing_score,
  );
  const avgOverallWellbeing = avg(overallWellbeingScores);

  const workloadScores = staff_wellbeing_survey_records.map(
    (r) => r.workload_score,
  );
  const avgWorkload = avg(workloadScores);

  const teamSupportScores = staff_wellbeing_survey_records.map(
    (r) => r.team_support_score,
  );
  const avgTeamSupport = avg(teamSupportScores);

  const managementSupportScores = staff_wellbeing_survey_records.map(
    (r) => r.management_support_score,
  );
  const avgManagementSupport = avg(managementSupportScores);

  const workLifeBalanceScores = staff_wellbeing_survey_records.map(
    (r) => r.work_life_balance_score,
  );
  const avgWorkLifeBalance = avg(workLifeBalanceScores);

  const jobSatisfactionScores = staff_wellbeing_survey_records.map(
    (r) => r.job_satisfaction_score,
  );
  const avgJobSatisfaction = avg(jobSatisfactionScores);

  const moraleScores = staff_wellbeing_survey_records.map(
    (r) => r.morale_score,
  );
  const avgMorale = avg(moraleScores);

  const feelsValued = staff_wellbeing_survey_records.filter(
    (r) => r.feels_valued,
  ).length;
  const feelsValuedRate = pct(feelsValued, totalSurveyRecords);

  const wouldRecommend = staff_wellbeing_survey_records.filter(
    (r) => r.would_recommend_employer,
  ).length;
  const wouldRecommendRate = pct(wouldRecommend, totalSurveyRecords);

  // Staff satisfaction: composite of feels_valued + would_recommend + job_satisfaction >= 7
  const highJobSatisfaction = staff_wellbeing_survey_records.filter(
    (r) => r.job_satisfaction_score >= 7,
  ).length;
  const satisfiedCount = feelsValued + wouldRecommend + highJobSatisfaction;
  const satisfiedDenominator = totalSurveyRecords * 3;
  const staffSatisfactionRate = pct(satisfiedCount, satisfiedDenominator);

  const lowMoraleStaff = staff_wellbeing_survey_records.filter(
    (r) => r.overall_wellbeing_score <= 4,
  ).length;
  const lowMoraleRate = pct(lowMoraleStaff, totalSurveyRecords);

  const highMoraleStaff = staff_wellbeing_survey_records.filter(
    (r) => r.overall_wellbeing_score >= 7,
  ).length;
  const highMoraleRate = pct(highMoraleStaff, totalSurveyRecords);

  // --- Retention metrics ---
  const totalRetentionEvents = staff_retention_records.length;

  const joinedEvents = staff_retention_records.filter(
    (r) => r.event_type === "joined",
  ).length;
  const leftEvents = staff_retention_records.filter(
    (r) => r.event_type === "left",
  ).length;

  // Retention rate: staff who have NOT left as % of total_staff
  // If no "left" events, retention = 100%
  const retentionRate = total_staff > 0
    ? pct(Math.max(0, total_staff - leftEvents), total_staff)
    : 0;

  const promotions = staff_retention_records.filter(
    (r) => r.event_type === "promotion",
  ).length;
  const probationPassed = staff_retention_records.filter(
    (r) => r.event_type === "probation_passed",
  ).length;
  const probationFailed = staff_retention_records.filter(
    (r) => r.event_type === "probation_failed",
  ).length;

  const handoversCompleted = staff_retention_records.filter(
    (r) => r.event_type === "left" && r.handover_completed,
  ).length;
  const handoverCompletionRate = pct(handoversCompleted, leftEvents);

  const replacementsRecruited = staff_retention_records.filter(
    (r) => r.event_type === "left" && r.replacement_recruited,
  ).length;
  const replacementRecruitedRate = pct(replacementsRecruited, leftEvents);

  const resignations = staff_retention_records.filter(
    (r) => r.event_type === "left" &&
      (r.reason_for_leaving === "resignation" || r.reason_for_leaving === "dissatisfaction"),
  ).length;
  const voluntaryTurnoverRate = pct(resignations, total_staff);

  const leaversServiceMonths = staff_retention_records
    .filter((r) => r.event_type === "left")
    .map((r) => r.length_of_service_months);
  const avgServiceLength = avg(leaversServiceMonths);

  const earlyLeavers = staff_retention_records.filter(
    (r) => r.event_type === "left" && r.length_of_service_months < 12,
  ).length;
  const earlyLeaverRate = pct(earlyLeavers, leftEvents);

  const noticeServed = staff_retention_records.filter(
    (r) => r.event_type === "left" && r.notice_period_served,
  ).length;
  const noticeServedRate = pct(noticeServed, leftEvents);

  // --- Wellbeing support metrics ---
  const totalSupportRecords = wellbeing_support_records.length;

  const supportOffered = wellbeing_support_records.filter(
    (r) => r.support_offered,
  ).length;
  const supportOfferedRate = pct(supportOffered, totalSupportRecords);

  const supportAccepted = wellbeing_support_records.filter(
    (r) => r.support_offered && r.support_accepted,
  ).length;
  const wellbeingSupportUptakeRate = pct(supportAccepted, supportOffered);

  const supportCompleted = wellbeing_support_records.filter(
    (r) => r.support_completed,
  ).length;
  const supportCompletionRate = pct(supportCompleted, totalSupportRecords);

  const highOutcomeSupport = wellbeing_support_records.filter(
    (r) => r.outcome_rating >= 4,
  ).length;
  const supportEffectivenessRate = pct(highOutcomeSupport, totalSupportRecords);

  const followUpNeeded = wellbeing_support_records.filter(
    (r) => r.follow_up_needed,
  ).length;
  const followUpCompleted = wellbeing_support_records.filter(
    (r) => r.follow_up_needed && r.follow_up_completed,
  ).length;
  const supportFollowUpRate = pct(followUpCompleted, followUpNeeded);

  const uniqueStaffSupported = new Set(
    wellbeing_support_records.filter((r) => r.support_accepted).map((r) => r.staff_id),
  ).size;
  const supportCoverageRate = pct(uniqueStaffSupported, total_staff);

  // --- Exit interview metrics ---
  const totalExitInterviews = exit_interview_records.length;

  const exitInterviewsConducted = exit_interview_records.filter(
    (r) => r.conducted,
  ).length;
  const exitInterviewCompletionRate = pct(exitInterviewsConducted, leftEvents > 0 ? leftEvents : totalExitInterviews > 0 ? totalExitInterviews : 1);

  const exitOverallScores = exit_interview_records
    .filter((r) => r.conducted)
    .map((r) => r.overall_experience_rating);
  const avgExitExperienceRating = avg(exitOverallScores);

  const exitManagementScores = exit_interview_records
    .filter((r) => r.conducted)
    .map((r) => r.management_rating);
  const avgExitManagementRating = avg(exitManagementScores);

  const wouldReturnCount = exit_interview_records.filter(
    (r) => r.conducted && r.would_return,
  ).length;
  const wouldReturnRate = pct(wouldReturnCount, exitInterviewsConducted);

  const wouldRecommendExit = exit_interview_records.filter(
    (r) => r.conducted && r.would_recommend,
  ).length;
  const wouldRecommendExitRate = pct(wouldRecommendExit, exitInterviewsConducted);

  // Aggregate exit themes
  const exitThemes: Record<string, number> = {};
  for (const ei of exit_interview_records) {
    if (!ei.conducted) continue;
    for (const theme of ei.themes_identified) {
      exitThemes[theme] = (exitThemes[theme] ?? 0) + 1;
    }
  }
  const topExitThemes = Object.entries(exitThemes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Aggregate leaving reasons
  const leavingReasons: Record<string, number> = {};
  for (const ei of exit_interview_records) {
    if (!ei.conducted) continue;
    for (const reason of ei.reasons_for_leaving) {
      leavingReasons[reason] = (leavingReasons[reason] ?? 0) + 1;
    }
  }
  const topLeavingReasons = Object.entries(leavingReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Aggregate stress factors from surveys
  const stressFactors: Record<string, number> = {};
  for (const s of staff_wellbeing_survey_records) {
    for (const factor of s.stress_factors) {
      stressFactors[factor] = (stressFactors[factor] ?? 0) + 1;
    }
  }
  const topStressFactors = Object.entries(stressFactors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // ── Scoring: base 52, max bonuses +28 ─────────────────────────────────

  let score = 52;

  // --- Bonus 1: Low sickness absence (inverted — lower is better) ---
  // sicknessAbsenceRate <= 10% → +4, <= 25% → +2
  if (sicknessAbsenceRate <= 10 && totalSicknessRecords >= 0) score += 4;
  else if (sicknessAbsenceRate <= 25) score += 2;

  // --- Bonus 2: High wellbeing survey completion (>=80: +3, >=60: +1) ---
  if (wellbeingSurveyCompletionRate >= 80) score += 3;
  else if (wellbeingSurveyCompletionRate >= 60) score += 1;

  // --- Bonus 3: Strong retention rate (>=90: +5, >=75: +2) ---
  if (retentionRate >= 90) score += 5;
  else if (retentionRate >= 75) score += 2;

  // --- Bonus 4: High wellbeing support uptake (>=80: +3, >=60: +1) ---
  if (wellbeingSupportUptakeRate >= 80) score += 3;
  else if (wellbeingSupportUptakeRate >= 60) score += 1;

  // --- Bonus 5: Exit interview completion (>=90: +3, >=70: +1) ---
  if (exitInterviewCompletionRate >= 90 && (leftEvents > 0 || totalExitInterviews > 0)) score += 3;
  else if (exitInterviewCompletionRate >= 70 && (leftEvents > 0 || totalExitInterviews > 0)) score += 1;

  // --- Bonus 6: High staff satisfaction (>=80: +3, >=60: +1) ---
  if (staffSatisfactionRate >= 80 && totalSurveyRecords > 0) score += 3;
  else if (staffSatisfactionRate >= 60 && totalSurveyRecords > 0) score += 1;

  // --- Bonus 7: Return to work interviews completed (>=90: +3, >=70: +1) ---
  if (returnToWorkRate >= 90 && totalSicknessRecords > 0) score += 3;
  else if (returnToWorkRate >= 70 && totalSicknessRecords > 0) score += 1;

  // --- Bonus 8: Support follow-up completion (>=90: +2, >=70: +1) ---
  if (supportFollowUpRate >= 90 && followUpNeeded > 0) score += 2;
  else if (supportFollowUpRate >= 70 && followUpNeeded > 0) score += 1;

  // --- Bonus 9: Feels valued rate (>=90: +2, >=70: +1) ---
  if (feelsValuedRate >= 90 && totalSurveyRecords > 0) score += 2;
  else if (feelsValuedRate >= 70 && totalSurveyRecords > 0) score += 1;

  // ── Penalties (guarded by array length > 0) ───────────────────────────

  // High sickness absence rate → -6
  if (sicknessAbsenceRate > 50 && totalSicknessRecords > 0) score -= 6;

  // Poor retention rate → -5
  if (retentionRate < 60 && totalRetentionEvents > 0) score -= 5;

  // Low staff satisfaction → -4
  if (staffSatisfactionRate < 30 && totalSurveyRecords > 0) score -= 4;

  // High stress-related absence → -3
  if (stressRelatedRate > 40 && totalSicknessRecords > 0) score -= 3;

  score = clamp(score, 0, 100);

  const wellbeing_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  // Sickness absence strengths (inverted — low is good)
  if (sicknessAbsenceRate <= 10 && total_staff > 0) {
    strengths.push(
      `Only ${sicknessAbsenceRate}% sickness absence rate — staff sickness levels are very low, indicating a healthy, well-supported workforce and effective absence management practices.`,
    );
  } else if (sicknessAbsenceRate <= 25 && sicknessAbsenceRate > 10 && total_staff > 0) {
    strengths.push(
      `${sicknessAbsenceRate}% sickness absence rate — sickness levels are within acceptable parameters for a residential children's home setting.`,
    );
  }

  if (returnToWorkRate >= 90 && totalSicknessRecords > 0) {
    strengths.push(
      `${returnToWorkRate}% return-to-work interview completion — the home consistently conducts return-to-work conversations, demonstrating proactive management of staff returning from absence.`,
    );
  } else if (returnToWorkRate >= 70 && totalSicknessRecords > 0) {
    strengths.push(
      `${returnToWorkRate}% return-to-work interviews completed — the home generally ensures staff receive a supported return-to-work process.`,
    );
  }

  // Survey / wellbeing strengths
  if (wellbeingSurveyCompletionRate >= 80 && totalSurveyRecords > 0) {
    strengths.push(
      `${wellbeingSurveyCompletionRate}% wellbeing survey completion — the home achieves high participation in wellbeing surveys, providing a comprehensive picture of staff wellbeing and enabling data-driven improvements.`,
    );
  } else if (wellbeingSurveyCompletionRate >= 60 && totalSurveyRecords > 0) {
    strengths.push(
      `${wellbeingSurveyCompletionRate}% wellbeing survey participation — the majority of staff engage with wellbeing surveys, providing useful insight into workforce health.`,
    );
  }

  if (staffSatisfactionRate >= 80 && totalSurveyRecords > 0) {
    strengths.push(
      `${staffSatisfactionRate}% staff satisfaction rate — staff feel valued, would recommend the home as an employer, and report high job satisfaction, reflecting strong leadership and a positive workplace culture.`,
    );
  } else if (staffSatisfactionRate >= 60 && totalSurveyRecords > 0) {
    strengths.push(
      `${staffSatisfactionRate}% staff satisfaction — the majority of staff report positive experiences and feel supported in their roles.`,
    );
  }

  if (feelsValuedRate >= 90 && totalSurveyRecords > 0) {
    strengths.push(
      `${feelsValuedRate}% of staff feel valued — an overwhelming majority of staff feel recognised and appreciated for their contribution, which is a key driver of retention and quality care.`,
    );
  } else if (feelsValuedRate >= 70 && totalSurveyRecords > 0) {
    strengths.push(
      `${feelsValuedRate}% of staff feel valued — most staff feel appreciated for their contribution to the home.`,
    );
  }

  if (highMoraleRate >= 70 && totalSurveyRecords > 0) {
    strengths.push(
      `${highMoraleRate}% of staff report high morale (score 7+/10) — staff morale is strong across the team, supporting consistent quality of care delivery.`,
    );
  }

  if (avgOverallWellbeing >= 7.5 && totalSurveyRecords > 0) {
    strengths.push(
      `Average overall wellbeing score of ${avgOverallWellbeing}/10 — staff wellbeing is excellent, reflecting a supportive workplace that prioritises workforce health.`,
    );
  } else if (avgOverallWellbeing >= 6.5 && totalSurveyRecords > 0) {
    strengths.push(
      `Average overall wellbeing score of ${avgOverallWellbeing}/10 — staff wellbeing is generally positive across the team.`,
    );
  }

  // Retention strengths
  if (retentionRate >= 90 && total_staff > 0) {
    strengths.push(
      `${retentionRate}% staff retention rate — the home retains the vast majority of its workforce, ensuring continuity of care for children and stability within the staff team.`,
    );
  } else if (retentionRate >= 75 && total_staff > 0) {
    strengths.push(
      `${retentionRate}% retention rate — staff turnover is within acceptable levels, supporting workforce stability.`,
    );
  }

  if (promotions > 0 && totalRetentionEvents > 0) {
    strengths.push(
      `${promotions} staff promotion${promotions !== 1 ? "s" : ""} recorded — the home invests in internal career development, supporting staff progression and retention.`,
    );
  }

  // Support strengths
  if (wellbeingSupportUptakeRate >= 80 && supportOffered > 0) {
    strengths.push(
      `${wellbeingSupportUptakeRate}% wellbeing support uptake — when support is offered, the vast majority of staff accept it, indicating trust in the home's support provision and a culture that normalises help-seeking.`,
    );
  } else if (wellbeingSupportUptakeRate >= 60 && supportOffered > 0) {
    strengths.push(
      `${wellbeingSupportUptakeRate}% wellbeing support uptake — the majority of staff accept offered wellbeing support, reflecting a positive help-seeking culture.`,
    );
  }

  if (supportEffectivenessRate >= 80 && totalSupportRecords > 0) {
    strengths.push(
      `${supportEffectivenessRate}% of wellbeing support rated as effective (4+/5) — the support provided to staff achieves positive outcomes, demonstrating that the home's wellbeing interventions are well-targeted and meaningful.`,
    );
  } else if (supportEffectivenessRate >= 60 && totalSupportRecords > 0) {
    strengths.push(
      `${supportEffectivenessRate}% wellbeing support effectiveness — the majority of support interventions achieve positive outcomes for staff.`,
    );
  }

  if (supportFollowUpRate >= 90 && followUpNeeded > 0) {
    strengths.push(
      `${supportFollowUpRate}% of support follow-ups completed — the home consistently follows through on wellbeing support actions, ensuring staff receive ongoing care and attention.`,
    );
  } else if (supportFollowUpRate >= 70 && followUpNeeded > 0) {
    strengths.push(
      `${supportFollowUpRate}% of support follow-ups completed — the home generally follows through on wellbeing actions identified during support interactions.`,
    );
  }

  // Exit interview strengths
  if (exitInterviewCompletionRate >= 90 && (leftEvents > 0 || totalExitInterviews > 0)) {
    strengths.push(
      `${exitInterviewCompletionRate}% exit interview completion — the home consistently conducts exit interviews with departing staff, gathering valuable intelligence to inform retention strategies and improve the working environment.`,
    );
  } else if (exitInterviewCompletionRate >= 70 && (leftEvents > 0 || totalExitInterviews > 0)) {
    strengths.push(
      `${exitInterviewCompletionRate}% exit interview completion — the home generally conducts exit interviews with leavers, supporting organisational learning.`,
    );
  }

  if (wouldReturnRate >= 80 && exitInterviewsConducted > 0) {
    strengths.push(
      `${wouldReturnRate}% of leavers would return — departing staff speak positively about their experience and would consider returning, indicating a healthy workplace culture despite the decision to leave.`,
    );
  }

  if (wouldRecommendExitRate >= 80 && exitInterviewsConducted > 0) {
    strengths.push(
      `${wouldRecommendExitRate}% of leavers would recommend the home as an employer — even departing staff endorse the home as a good place to work, reflecting well on the overall working environment.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  // Sickness concerns (inverted — high is bad)
  if (sicknessAbsenceRate > 50 && totalSicknessRecords > 0) {
    concerns.push(
      `${sicknessAbsenceRate}% sickness absence rate — more than half of staff have sickness records, indicating a serious workforce health issue that directly impacts staffing levels, care continuity, and the wellbeing of remaining staff who must cover absences.`,
    );
  } else if (sicknessAbsenceRate > 30 && sicknessAbsenceRate <= 50 && totalSicknessRecords > 0) {
    concerns.push(
      `${sicknessAbsenceRate}% sickness absence rate — sickness levels are elevated and may be indicating systemic issues with staff wellbeing, workload, or working conditions that require management attention.`,
    );
  }

  if (stressRelatedRate > 40 && totalSicknessRecords > 0) {
    concerns.push(
      `${stressRelatedRate}% of sickness absence is stress or mental health related — a high proportion of absence is attributable to workplace stress or mental health, suggesting the home must urgently review workload, support provision, and working conditions.`,
    );
  } else if (stressRelatedRate > 25 && stressRelatedRate <= 40 && totalSicknessRecords > 0) {
    concerns.push(
      `${stressRelatedRate}% of absence is stress or mental health related — stress-related absence is notable and should be addressed through proactive wellbeing initiatives.`,
    );
  }

  if (returnToWorkRate < 50 && totalSicknessRecords > 0) {
    concerns.push(
      `Only ${returnToWorkRate}% return-to-work interviews completed — the majority of staff returning from absence are not receiving a structured return-to-work conversation, undermining the home's duty of care and absence management processes.`,
    );
  } else if (returnToWorkRate < 70 && returnToWorkRate >= 50 && totalSicknessRecords > 0) {
    concerns.push(
      `Return-to-work interview completion at ${returnToWorkRate}% — not all staff are receiving appropriate support when returning from sickness absence.`,
    );
  }

  // Survey / satisfaction concerns
  if (wellbeingSurveyCompletionRate < 40 && total_staff > 0 && totalSurveyRecords > 0) {
    concerns.push(
      `Only ${wellbeingSurveyCompletionRate}% wellbeing survey completion — the home cannot claim to understand staff wellbeing when the majority of staff have not participated in surveys.`,
    );
  } else if (wellbeingSurveyCompletionRate < 60 && wellbeingSurveyCompletionRate >= 40 && total_staff > 0 && totalSurveyRecords > 0) {
    concerns.push(
      `Wellbeing survey completion at ${wellbeingSurveyCompletionRate}% — survey participation needs improvement to provide a representative picture of staff wellbeing.`,
    );
  }

  if (staffSatisfactionRate < 30 && totalSurveyRecords > 0) {
    concerns.push(
      `Only ${staffSatisfactionRate}% staff satisfaction — the majority of staff do not feel valued, would not recommend the home, or report low job satisfaction. This has direct implications for care quality, as dissatisfied staff cannot consistently provide nurturing, therapeutic care.`,
    );
  } else if (staffSatisfactionRate < 50 && staffSatisfactionRate >= 30 && totalSurveyRecords > 0) {
    concerns.push(
      `Staff satisfaction at ${staffSatisfactionRate}% — a significant proportion of staff report dissatisfaction, which undermines workforce stability and care quality.`,
    );
  }

  if (lowMoraleRate > 40 && totalSurveyRecords > 0) {
    concerns.push(
      `${lowMoraleRate}% of staff report low morale (score 4 or below) — widespread low morale is a serious concern that requires immediate leadership attention, as it affects team cohesion, care quality, and retention.`,
    );
  } else if (lowMoraleRate > 25 && lowMoraleRate <= 40 && totalSurveyRecords > 0) {
    concerns.push(
      `${lowMoraleRate}% of staff report low morale — a notable proportion of the workforce has poor morale, which may be impacting care delivery and team dynamics.`,
    );
  }

  if (feelsValuedRate < 50 && totalSurveyRecords > 0) {
    concerns.push(
      `Only ${feelsValuedRate}% of staff feel valued — the majority of staff do not feel recognised for their contribution. This is a critical leadership and management failing that drives turnover and disengagement.`,
    );
  } else if (feelsValuedRate < 70 && feelsValuedRate >= 50 && totalSurveyRecords > 0) {
    concerns.push(
      `Only ${feelsValuedRate}% of staff feel valued — a significant proportion of staff do not feel appreciated, which may contribute to retention challenges.`,
    );
  }

  // Retention concerns
  if (retentionRate < 60 && totalRetentionEvents > 0) {
    concerns.push(
      `Staff retention rate at only ${retentionRate}% — high turnover destabilises the home, disrupts children's attachments, increases agency staff reliance, and places unsustainable pressure on remaining staff. This is a critical workforce sustainability issue.`,
    );
  } else if (retentionRate < 75 && retentionRate >= 60 && totalRetentionEvents > 0) {
    concerns.push(
      `Retention rate at ${retentionRate}% — turnover is higher than expected and may be affecting continuity of care and team stability.`,
    );
  }

  if (earlyLeaverRate > 40 && leftEvents > 0) {
    concerns.push(
      `${earlyLeaverRate}% of leavers left within 12 months — early attrition suggests issues with induction, onboarding, or mismatch between expectations and reality. This wastes recruitment investment and disrupts team development.`,
    );
  } else if (earlyLeaverRate > 25 && earlyLeaverRate <= 40 && leftEvents > 0) {
    concerns.push(
      `${earlyLeaverRate}% of leavers departed within 12 months — early attrition is notable and may indicate issues with induction or role expectations.`,
    );
  }

  // Support concerns
  if (wellbeingSupportUptakeRate < 40 && supportOffered > 0) {
    concerns.push(
      `Only ${wellbeingSupportUptakeRate}% wellbeing support uptake — the majority of staff decline offered support, which may indicate a culture where seeking help is stigmatised, or that the support offered does not meet staff needs.`,
    );
  } else if (wellbeingSupportUptakeRate < 60 && wellbeingSupportUptakeRate >= 40 && supportOffered > 0) {
    concerns.push(
      `Wellbeing support uptake at ${wellbeingSupportUptakeRate}% — a notable proportion of staff decline offered support, suggesting barriers to engagement.`,
    );
  }

  if (supportFollowUpRate < 50 && followUpNeeded > 0) {
    concerns.push(
      `Only ${supportFollowUpRate}% of wellbeing support follow-ups completed — identified support needs are not being followed through, meaning staff who sought help may feel abandoned or unsupported.`,
    );
  } else if (supportFollowUpRate < 70 && supportFollowUpRate >= 50 && followUpNeeded > 0) {
    concerns.push(
      `Support follow-up completion at ${supportFollowUpRate}% — some wellbeing actions are not being followed through, which undermines trust in the support process.`,
    );
  }

  // Exit interview concerns
  if (exitInterviewCompletionRate < 50 && leftEvents > 0) {
    concerns.push(
      `Only ${exitInterviewCompletionRate}% exit interview completion — the home is missing critical intelligence from departing staff about why they leave and what could be improved. Without this data, retention strategies are flying blind.`,
    );
  } else if (exitInterviewCompletionRate < 70 && exitInterviewCompletionRate >= 50 && leftEvents > 0) {
    concerns.push(
      `Exit interview completion at ${exitInterviewCompletionRate}% — not all departing staff are being interviewed, meaning some retention intelligence is being lost.`,
    );
  }

  // Missing data concerns
  if (totalSicknessRecords === 0 && total_staff > 0 && !allEmpty) {
    concerns.push(
      "No sickness absence records exist despite active staff — the home cannot evidence effective absence management or monitor patterns that may indicate workforce wellbeing issues.",
    );
  }

  if (totalSurveyRecords === 0 && total_staff > 0 && !allEmpty) {
    concerns.push(
      "No wellbeing survey data recorded — without staff wellbeing surveys, the home cannot evidence that it understands or monitors workforce wellbeing.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: StaffWellbeingRetentionRecommendation[] = [];
  let rank = 0;

  if (sicknessAbsenceRate > 50 && totalSicknessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an urgent review of sickness absence patterns — identify whether systemic factors such as workload, staffing levels, workplace culture, or health and safety concerns are driving high absence rates. Implement targeted interventions and monitor monthly.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (retentionRate < 60 && totalRetentionEvents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop and implement an urgent staff retention strategy — analyse exit interview data, conduct stay interviews with current staff, and address the root causes of high turnover to stabilise the workforce and protect continuity of care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (staffSatisfactionRate < 30 && totalSurveyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address staff satisfaction — convene staff forums, conduct confidential one-to-ones, and develop an action plan to address the specific factors driving dissatisfaction. Staff who do not feel valued cannot consistently deliver high-quality care.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (stressRelatedRate > 40 && totalSicknessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement stress risk assessments for all staff and review workload distribution — the high proportion of stress-related absence indicates systemic workplace stressors that must be identified and mitigated to protect staff health and sustain workforce capacity.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (returnToWorkRate < 50 && totalSicknessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Mandate return-to-work interviews for every sickness absence — these conversations identify ongoing support needs, assess fitness for duty, and demonstrate the home's duty of care towards staff returning from illness.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (exitInterviewCompletionRate < 50 && leftEvents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every departing staff member receives an exit interview — this is the home's primary source of intelligence on retention challenges and must be conducted systematically to inform improvement strategies.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (wellbeingSurveyCompletionRate < 40 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase wellbeing survey participation through anonymity guarantees, protected time for completion, and visible action on previous survey findings — without representative data, the home cannot claim to monitor staff wellbeing effectively.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (wellbeingSupportUptakeRate < 40 && supportOffered > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and diversify wellbeing support provision — low uptake suggests current offerings do not meet staff needs or that there are cultural barriers to accepting support. Consult staff on preferred support methods and normalise help-seeking.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (feelsValuedRate < 50 && totalSurveyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a staff recognition and appreciation programme — regular acknowledgement of staff contribution through team meetings, written commendations, and development opportunities is essential to rebuild a culture where staff feel valued.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (earlyLeaverRate > 40 && leftEvents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review the induction and onboarding process — high early attrition suggests new staff are not being adequately supported, prepared, or integrated into the team. Implement structured mentoring and regular check-ins during the first 12 months.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (supportFollowUpRate < 50 && followUpNeeded > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a tracking system for wellbeing support follow-ups — ensure all identified actions are completed and documented. Incomplete follow-ups undermine staff trust in the support process.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (
    retentionRate >= 60 &&
    retentionRate < 75 &&
    totalRetentionEvents > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a retention improvement plan targeting the specific factors identified through exit interviews and stay conversations — aim to raise retention above 75% to ensure workforce stability.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (
    sicknessAbsenceRate > 25 &&
    sicknessAbsenceRate <= 50 &&
    totalSicknessRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Monitor sickness absence trends monthly and implement early intervention for staff with emerging attendance concerns — use occupational health referrals proactively to support staff before absence becomes entrenched.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (
    staffSatisfactionRate >= 30 &&
    staffSatisfactionRate < 60 &&
    totalSurveyRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct targeted engagement activities to address specific satisfaction drivers — use survey data to identify the most impactful areas for improvement and communicate actions taken to close the feedback loop.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (
    wellbeingSurveyCompletionRate >= 40 &&
    wellbeingSurveyCompletionRate < 60 &&
    totalSurveyRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Continue encouraging wellbeing survey participation — demonstrate that feedback leads to meaningful change by publishing 'you said, we did' summaries and protecting dedicated time for survey completion.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (
    wellbeingSupportUptakeRate >= 40 &&
    wellbeingSupportUptakeRate < 60 &&
    supportOffered > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance the range and accessibility of wellbeing support options — consider peer support networks, flexible access to EAP services, and management wellbeing check-ins to increase uptake above 60%.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (totalSicknessRecords === 0 && total_staff > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording all sickness absence episodes systematically — without absence data, the home cannot identify patterns, manage absence effectively, or evidence compliance with workforce management requirements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (totalSurveyRecords === 0 && total_staff > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement regular staff wellbeing surveys — quarterly anonymous surveys provide essential data on staff morale, satisfaction, and wellbeing that Ofsted expects to see evidenced under Reg 16 and the SCCIF leadership framework.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: StaffWellbeingRetentionInsight[] = [];

  // -- Critical insights --

  if (sicknessAbsenceRate > 50 && totalSicknessRecords > 0) {
    insights.push({
      text: `${sicknessAbsenceRate}% sickness absence rate. High absence levels compromise the home's ability to maintain consistent staffing, forcing reliance on agency workers who lack relationship continuity with children. Ofsted expects homes to demonstrate effective workforce management under Reg 16, and this level of absence suggests a systemic wellbeing or working conditions issue requiring urgent intervention.`,
      severity: "critical",
    });
  }

  if (retentionRate < 60 && totalRetentionEvents > 0) {
    insights.push({
      text: `Staff retention at only ${retentionRate}%. High turnover is one of the most damaging factors in residential childcare — children experience repeated loss of trusted adults, staff knowledge is continually lost, and remaining team members face increased workload and burnout. Ofsted under the SCCIF specifically assesses whether staff turnover undermines care quality.`,
      severity: "critical",
    });
  }

  if (staffSatisfactionRate < 30 && totalSurveyRecords > 0) {
    insights.push({
      text: `Only ${staffSatisfactionRate}% staff satisfaction. Profoundly low satisfaction is a leading indicator of imminent turnover, reduced care quality, and potential safeguarding risks. Dissatisfied staff are more likely to make errors, disengage from children, and leave without notice. Leadership must treat this as an urgent organisational risk.`,
      severity: "critical",
    });
  }

  if (stressRelatedRate > 40 && totalSicknessRecords > 0) {
    insights.push({
      text: `${stressRelatedRate}% of absence is stress or mental health related. Working in children's residential care is inherently demanding, but when stress-related absence exceeds 40%, it indicates that the home's support systems, workload management, or culture are failing to protect staff. Reg 32 requires that the home ensures workers remain fit for their role.`,
      severity: "critical",
    });
  }

  if (lowMoraleRate > 40 && totalSurveyRecords > 0) {
    insights.push({
      text: `${lowMoraleRate}% of staff report low morale. Widespread poor morale creates a negative cycle — remaining staff absorb additional pressure, quality of interactions with children deteriorates, and the home's therapeutic culture is undermined. This requires immediate leadership intervention to understand and address root causes.`,
      severity: "critical",
    });
  }

  if (totalSicknessRecords === 0 && total_staff > 0 && !allEmpty) {
    insights.push({
      text: "No sickness absence records exist despite active staff. Without absence monitoring, the home cannot identify patterns (such as stress-related absence clustering around certain shifts or events), cannot evidence effective return-to-work processes, and cannot demonstrate compliance with Reg 16 workforce requirements.",
      severity: "critical",
    });
  }

  if (totalSurveyRecords === 0 && total_staff > 0 && !allEmpty) {
    insights.push({
      text: "No wellbeing survey data recorded. Ofsted expects homes to demonstrate how they monitor and support staff wellbeing. Without survey data, the home is relying on anecdotal evidence and cannot claim a data-informed approach to workforce wellbeing under the SCCIF leadership and management framework.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    sicknessAbsenceRate > 25 &&
    sicknessAbsenceRate <= 50 &&
    totalSicknessRecords > 0
  ) {
    insights.push({
      text: `Sickness absence rate at ${sicknessAbsenceRate}% — above sector norms for residential childcare. Early intervention through occupational health referrals, workload reviews, and manager conversations can prevent absence from escalating.`,
      severity: "warning",
    });
  }

  if (
    retentionRate >= 60 &&
    retentionRate < 75 &&
    totalRetentionEvents > 0
  ) {
    insights.push({
      text: `Retention rate at ${retentionRate}% — turnover is above optimal levels. Research consistently shows that staff stability is one of the strongest predictors of positive outcomes for children in residential care. Targeted retention initiatives could improve both workforce stability and children's experiences.`,
      severity: "warning",
    });
  }

  if (
    staffSatisfactionRate >= 30 &&
    staffSatisfactionRate < 60 &&
    totalSurveyRecords > 0
  ) {
    insights.push({
      text: `Staff satisfaction at ${staffSatisfactionRate}% — a significant minority of staff are dissatisfied with their experience. Targeted engagement and visible leadership action on identified concerns can prevent dissatisfaction from driving turnover.`,
      severity: "warning",
    });
  }

  if (
    wellbeingSurveyCompletionRate >= 40 &&
    wellbeingSurveyCompletionRate < 60 &&
    totalSurveyRecords > 0
  ) {
    insights.push({
      text: `Wellbeing survey completion at ${wellbeingSurveyCompletionRate}% — the home has partial data but cannot claim comprehensive insight into workforce wellbeing. Non-respondents may include those most in need of support but least confident to speak up.`,
      severity: "warning",
    });
  }

  if (
    wellbeingSupportUptakeRate >= 40 &&
    wellbeingSupportUptakeRate < 60 &&
    supportOffered > 0
  ) {
    insights.push({
      text: `Wellbeing support uptake at ${wellbeingSupportUptakeRate}% — a notable proportion of staff decline offered support. Consider whether the support types offered match staff preferences, whether there are confidentiality concerns, or whether the culture supports help-seeking.`,
      severity: "warning",
    });
  }

  if (
    stressRelatedRate > 25 &&
    stressRelatedRate <= 40 &&
    totalSicknessRecords > 0
  ) {
    insights.push({
      text: `${stressRelatedRate}% of absence is stress or mental health related — elevated levels that warrant proactive intervention through stress risk assessments, supervision quality reviews, and workload analysis.`,
      severity: "warning",
    });
  }

  if (
    earlyLeaverRate > 25 &&
    earlyLeaverRate <= 40 &&
    leftEvents > 0
  ) {
    insights.push({
      text: `${earlyLeaverRate}% of leavers departed within their first 12 months — early attrition suggests potential issues with recruitment, induction, or realistic job previews that could be addressed to improve new starter retention.`,
      severity: "warning",
    });
  }

  if (
    returnToWorkRate >= 50 &&
    returnToWorkRate < 70 &&
    totalSicknessRecords > 0
  ) {
    insights.push({
      text: `Return-to-work interview completion at ${returnToWorkRate}% — some staff are returning from absence without a structured conversation about their wellbeing and any support needed, which may lead to premature returns or recurrent absence.`,
      severity: "warning",
    });
  }

  if (
    exitInterviewCompletionRate >= 50 &&
    exitInterviewCompletionRate < 70 &&
    leftEvents > 0
  ) {
    insights.push({
      text: `Exit interview completion at ${exitInterviewCompletionRate}% — some valuable intelligence about why staff leave is being lost. Consistent exit interviews are the home's primary tool for understanding and addressing turnover drivers.`,
      severity: "warning",
    });
  }

  // Stress factors analysis
  if (topStressFactors.length > 0) {
    const formatted = topStressFactors
      .map(([factor, count]) => `${factor.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most reported stress factors from wellbeing surveys: ${formatted}. Understanding the primary sources of staff stress enables targeted interventions rather than generic wellness initiatives.`,
      severity: "warning",
    });
  }

  // Exit themes analysis
  if (topExitThemes.length > 0) {
    const formatted = topExitThemes
      .map(([theme, count]) => `${theme.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Recurring exit interview themes: ${formatted}. These themes represent systemic factors driving staff departure and should be the primary focus of the home's retention strategy.`,
      severity: "warning",
    });
  }

  // Leaving reasons analysis
  if (topLeavingReasons.length > 0) {
    const formatted = topLeavingReasons
      .map(([reason, count]) => `${reason.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common reasons for leaving: ${formatted}. Analysing departure reasons enables the home to distinguish between controllable factors (management, workload, culture) and uncontrollable ones (relocation, retirement).`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (wellbeing_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding staff wellbeing and retention — sickness absence is well managed, staff satisfaction is high, retention is strong, wellbeing support is effective, and exit processes are thorough. This is strong evidence for Reg 16, Reg 32, and SCCIF leadership and management compliance.",
      severity: "positive",
    });
  }

  if (
    sicknessAbsenceRate <= 10 &&
    returnToWorkRate >= 90 &&
    total_staff > 0 &&
    totalSicknessRecords > 0
  ) {
    insights.push({
      text: `${sicknessAbsenceRate}% sickness absence with ${returnToWorkRate}% return-to-work completion — the combination of low absence and thorough return-to-work processes demonstrates excellent absence management that protects both staff wellbeing and operational continuity.`,
      severity: "positive",
    });
  }

  if (
    retentionRate >= 90 &&
    staffSatisfactionRate >= 80 &&
    total_staff > 0 &&
    totalSurveyRecords > 0
  ) {
    insights.push({
      text: `${retentionRate}% retention with ${staffSatisfactionRate}% satisfaction — high retention combined with high satisfaction demonstrates that staff remain because they genuinely value working at the home. This creates the workforce stability that children in care need for consistent, relationship-based practice.`,
      severity: "positive",
    });
  }

  if (
    wellbeingSupportUptakeRate >= 80 &&
    supportEffectivenessRate >= 80 &&
    supportOffered > 0 &&
    totalSupportRecords > 0
  ) {
    insights.push({
      text: `${wellbeingSupportUptakeRate}% support uptake with ${supportEffectivenessRate}% effectiveness — staff trust the home's wellbeing support and it delivers positive outcomes. This is evidence of a genuinely supportive workplace culture aligned with Reg 32 requirements.`,
      severity: "positive",
    });
  }

  if (
    feelsValuedRate >= 90 &&
    highMoraleRate >= 70 &&
    totalSurveyRecords > 0
  ) {
    insights.push({
      text: `${feelsValuedRate}% feel valued with ${highMoraleRate}% reporting high morale — an engaged, valued workforce with strong morale is the foundation of outstanding residential childcare. Staff who feel appreciated bring their best selves to their work with children.`,
      severity: "positive",
    });
  }

  if (
    exitInterviewCompletionRate >= 90 &&
    wouldReturnRate >= 80 &&
    exitInterviewsConducted > 0
  ) {
    insights.push({
      text: `${exitInterviewCompletionRate}% exit interview completion with ${wouldReturnRate}% of leavers willing to return — the home conducts thorough exit processes and departing staff speak positively about their experience. This intelligence actively informs retention strategies.`,
      severity: "positive",
    });
  }

  if (
    wellbeingSurveyCompletionRate >= 80 &&
    avgOverallWellbeing >= 7.5 &&
    totalSurveyRecords > 0
  ) {
    insights.push({
      text: `${wellbeingSurveyCompletionRate}% survey participation with ${avgOverallWellbeing}/10 average wellbeing — the home has comprehensive wellbeing data showing staff are genuinely thriving. This represents best practice in workforce monitoring and management.`,
      severity: "positive",
    });
  }

  if (
    supportFollowUpRate >= 90 &&
    followUpNeeded > 0
  ) {
    insights.push({
      text: `${supportFollowUpRate}% of wellbeing support follow-ups completed — the home consistently follows through on identified actions, demonstrating a genuine commitment to staff wellbeing that goes beyond initial intervention to sustained support.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (wellbeing_rating === "outstanding") {
    headline =
      "Outstanding staff wellbeing and retention — sickness absence is low, staff satisfaction is high, retention is strong, and wellbeing support is effective and well-utilised.";
  } else if (wellbeing_rating === "good") {
    headline = `Good staff wellbeing and retention — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (wellbeing_rating === "adequate") {
    headline = `Adequate staff wellbeing and retention — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure staff are effectively supported and retained.`;
  } else {
    headline = `Staff wellbeing and retention is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to support staff wellbeing and stabilise the workforce.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    wellbeing_rating,
    wellbeing_score: score,
    headline,
    total_sickness_records: totalSicknessRecords,
    total_survey_records: totalSurveyRecords,
    total_retention_events: totalRetentionEvents,
    total_support_records: totalSupportRecords,
    total_exit_interviews: totalExitInterviews,
    sickness_absence_rate: sicknessAbsenceRate,
    wellbeing_survey_completion_rate: wellbeingSurveyCompletionRate,
    retention_rate: retentionRate,
    wellbeing_support_uptake_rate: wellbeingSupportUptakeRate,
    exit_interview_completion_rate: exitInterviewCompletionRate,
    staff_satisfaction_rate: staffSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
