// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF PERFORMANCE APPRAISAL INTELLIGENCE ENGINE
// Home-level: assesses appraisal completion rates, performance target tracking,
// competency assessment coverage, development goal progress, feedback quality,
// and staff satisfaction to produce an overall performance appraisal score.
// CHR 2015 Reg 16 (workforce), Reg 33 (employment of staff).
// SCCIF: "Leadership and management" — Ofsted checks staff are appraised,
// targets are set and tracked, competencies are assessed, development goals
// are progressed, and feedback is meaningful and timely.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AppraisalRecordInput {
  id: string;
  staff_id: string;
  appraisal_date: string;                 // YYYY-MM-DD
  status: string;                          // "completed"|"scheduled"|"overdue"|"cancelled"
  appraiser_id: string;
  overall_rating: string;                  // "exceptional"|"effective"|"developing"|"underperforming"|"not_rated"
  review_period_start: string;             // YYYY-MM-DD
  review_period_end: string;               // YYYY-MM-DD
  objectives_set: boolean;
  development_plan_agreed: boolean;
  staff_signed: boolean;
  manager_signed: boolean;
  quality_score: number | null;            // 1-10 quality rating of the appraisal itself
}

export interface PerformanceTargetInput {
  id: string;
  staff_id: string;
  target_description: string;
  category: string;                        // "care_quality"|"professional_development"|"teamwork"|"compliance"|"leadership"|"other"
  status: string;                          // "achieved"|"on_track"|"at_risk"|"not_met"|"not_started"
  target_date: string;                     // YYYY-MM-DD
  set_date: string;                        // YYYY-MM-DD
  progress_percentage: number;             // 0-100
  reviewed: boolean;
  evidence_attached: boolean;
}

export interface CompetencyAssessmentInput {
  id: string;
  staff_id: string;
  competency_area: string;                 // "safeguarding"|"medication"|"care_planning"|"communication"|"record_keeping"|"other"
  current_level: string;                   // "not_assessed"|"developing"|"competent"|"proficient"|"expert"
  required_level: string;                  // same set
  assessed_date: string | null;            // YYYY-MM-DD
  assessor_id: string;
  gap_identified: boolean;
  action_plan_in_place: boolean;
}

export interface DevelopmentGoalInput {
  id: string;
  staff_id: string;
  goal_description: string;
  category: string;                        // "qualification"|"skill"|"knowledge"|"behaviour"|"career"|"other"
  status: string;                          // "completed"|"in_progress"|"not_started"|"overdue"|"cancelled"
  target_date: string;                     // YYYY-MM-DD
  set_date: string;                        // YYYY-MM-DD
  progress_percentage: number;             // 0-100
  support_provided: boolean;
  resource_allocated: boolean;
}

export interface FeedbackRecordInput {
  id: string;
  staff_id: string;
  feedback_date: string;                   // YYYY-MM-DD
  feedback_type: string;                   // "formal"|"informal"|"360"|"peer"|"manager"|"self"
  sentiment: string;                       // "positive"|"constructive"|"negative"|"mixed"
  quality_rating: number | null;           // 1-10
  actionable: boolean;
  follow_up_completed: boolean;
  source: string;                          // "appraisal"|"supervision"|"observation"|"ad_hoc"|"other"
}

export interface StaffPerformanceInput {
  today: string;                           // YYYY-MM-DD injectable
  total_staff: number;
  appraisal_records: AppraisalRecordInput[];
  performance_target_records: PerformanceTargetInput[];
  competency_assessment_records: CompetencyAssessmentInput[];
  development_goal_records: DevelopmentGoalInput[];
  feedback_records: FeedbackRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffPerformanceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StaffPerformanceResult {
  appraisal_rating: StaffPerformanceRating;
  appraisal_score: number;
  headline: string;
  appraisal_completion_rate: number;
  target_achievement_rate: number;
  competency_rate: number;
  development_progress_rate: number;
  feedback_quality_rate: number;
  // fab-0: null when no satisfaction components observable.
  staff_satisfaction_rate: number | null;
  appraisal_profile: AppraisalProfile;
  target_profile: TargetProfile;
  competency_profile: CompetencyProfile;
  development_profile: DevelopmentProfile;
  feedback_profile: FeedbackProfile;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: string;
    regulatory_ref: string | null;
  }[];
  insights: { text: string; severity: string }[];
}

export interface AppraisalProfile {
  total_appraisals: number;
  completed_count: number;
  scheduled_count: number;
  overdue_count: number;
  cancelled_count: number;
  completion_rate: number;
  dual_signature_rate: number;
  objectives_set_rate: number;
  development_plan_rate: number;
  avg_quality_score: number | null;
  rating_distribution: { exceptional: number; effective: number; developing: number; underperforming: number; not_rated: number };
  staff_with_no_appraisal: number;
}

export interface TargetProfile {
  total_targets: number;
  achieved_count: number;
  on_track_count: number;
  at_risk_count: number;
  not_met_count: number;
  not_started_count: number;
  achievement_rate: number;
  // fab-0: null when no records to average.
  avg_progress: number | null;
  reviewed_rate: number;
  evidence_rate: number;
  category_breakdown: { category: string; total: number; achieved: number }[];
  overdue_targets: number;
}

export interface CompetencyProfile {
  total_assessments: number;
  assessed_count: number;
  not_assessed_count: number;
  competent_or_above_count: number;
  competency_rate: number;
  gap_count: number;
  gap_with_action_plan_count: number;
  area_breakdown: { area: string; total: number; competent_or_above: number }[];
}

export interface DevelopmentProfile {
  total_goals: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  overdue_count: number;
  cancelled_count: number;
  completion_rate: number;
  // fab-0: null when no goals to average.
  avg_progress: number | null;
  support_provided_rate: number;
  resource_allocated_rate: number;
  category_breakdown: { category: string; total: number; completed: number }[];
}

export interface FeedbackProfile {
  total_feedback: number;
  formal_count: number;
  informal_count: number;
  three_sixty_count: number;
  peer_count: number;
  avg_quality_rating: number | null;
  actionable_rate: number;
  follow_up_rate: number;
  sentiment_distribution: { positive: number; constructive: number; negative: number; mixed: number };
  // fab-0: null when total_staff is 0.
  feedback_per_staff: number | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function toRating(score: number): StaffPerformanceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
}

function uniqueStaffIds(records: { staff_id: string }[]): Set<string> {
  return new Set(records.map(r => r.staff_id).filter(Boolean));
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPUTE
// ══════════════════════════════════════════════════════════════════════════════

export function computeStaffPerformanceAppraisal(
  input: StaffPerformanceInput,
): StaffPerformanceResult {
  const {
    today,
    total_staff,
    appraisal_records,
    performance_target_records,
    competency_assessment_records,
    development_goal_records,
    feedback_records,
  } = input;

  // ── Check for all-empty arrays ──────────────────────────────────────────
  const allEmpty =
    appraisal_records.length === 0 &&
    performance_target_records.length === 0 &&
    competency_assessment_records.length === 0 &&
    development_goal_records.length === 0 &&
    feedback_records.length === 0;

  // ── Insufficient data: no staff OR allEmpty + no staff ────────────────
  if (allEmpty && total_staff === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "Insufficient data — no staff recorded and no appraisal records to assess.",
      [
        { rank: 1, recommendation: "Record staff and appraisal data to enable performance analysis.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 16" },
      ],
      [{ text: "No staff or appraisal data available. Cannot assess performance appraisal quality.", severity: "warning" }],
    );
  }

  // ── All arrays empty but staff exist → inadequate / 15 ───────────────
  if (allEmpty && total_staff > 0) {
    return emptyResult(
      "inadequate",
      15,
      `${total_staff} staff recorded but no appraisal, target, competency, development, or feedback data found — performance management is inadequate.`,
      [
        { rank: 1, recommendation: "Implement a formal performance appraisal programme for all staff. Reg 16 requires workforce development and Reg 33 requires staff to be suitably managed.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 16" },
        { rank: 2, recommendation: "Set performance targets for each staff member linked to care quality outcomes.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 33" },
        { rank: 3, recommendation: "Establish competency assessment frameworks to evidence staff capability.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 16" },
      ],
      [
        { text: `${total_staff} staff have no appraisal or performance management records whatsoever. This represents a fundamental gap in workforce governance.`, severity: "critical" },
      ],
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 1: Appraisal Completion Rate
  // ════════════════════════════════════════════════════════════════════════

  const totalAppraisals = appraisal_records.length;
  const completedAppraisals = appraisal_records.filter(a => a.status === "completed").length;
  const scheduledAppraisals = appraisal_records.filter(a => a.status === "scheduled").length;
  const overdueAppraisals = appraisal_records.filter(a => a.status === "overdue").length;
  const cancelledAppraisals = appraisal_records.filter(a => a.status === "cancelled").length;

  const appraisalCompletionRate = totalAppraisals > 0
    ? pct(completedAppraisals, totalAppraisals)
    : 0;

  // Completed appraisals deeper metrics
  const completedRecords = appraisal_records.filter(a => a.status === "completed");
  const dualSignedCount = completedRecords.filter(a => a.staff_signed && a.manager_signed).length;
  const dualSignatureRate = pct(dualSignedCount, completedRecords.length);

  const objectivesSetCount = completedRecords.filter(a => a.objectives_set).length;
  const objectivesSetRate = pct(objectivesSetCount, completedRecords.length);

  const devPlanAgreedCount = completedRecords.filter(a => a.development_plan_agreed).length;
  const developmentPlanRate = pct(devPlanAgreedCount, completedRecords.length);

  const qualityScores = completedRecords
    .map(a => a.quality_score)
    .filter((s): s is number => s !== null && s !== undefined && s > 0);
  const avgAppraisalQuality = avg(qualityScores);

  // Rating distribution
  const ratingDistribution = {
    exceptional: appraisal_records.filter(a => a.overall_rating === "exceptional").length,
    effective: appraisal_records.filter(a => a.overall_rating === "effective").length,
    developing: appraisal_records.filter(a => a.overall_rating === "developing").length,
    underperforming: appraisal_records.filter(a => a.overall_rating === "underperforming").length,
    not_rated: appraisal_records.filter(a => a.overall_rating === "not_rated" || !a.overall_rating).length,
  };

  // Staff without any appraisal
  const staffWithAppraisals = uniqueStaffIds(appraisal_records);
  const staffWithNoAppraisal = Math.max(0, total_staff - staffWithAppraisals.size);

  const appraisalProfile: AppraisalProfile = {
    total_appraisals: totalAppraisals,
    completed_count: completedAppraisals,
    scheduled_count: scheduledAppraisals,
    overdue_count: overdueAppraisals,
    cancelled_count: cancelledAppraisals,
    completion_rate: appraisalCompletionRate,
    dual_signature_rate: dualSignatureRate,
    objectives_set_rate: objectivesSetRate,
    development_plan_rate: developmentPlanRate,
    avg_quality_score: avgAppraisalQuality,
    rating_distribution: ratingDistribution,
    staff_with_no_appraisal: staffWithNoAppraisal,
  };

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 2: Target Achievement Rate
  // ════════════════════════════════════════════════════════════════════════

  const totalTargets = performance_target_records.length;
  const achievedTargets = performance_target_records.filter(t => t.status === "achieved").length;
  const onTrackTargets = performance_target_records.filter(t => t.status === "on_track").length;
  const atRiskTargets = performance_target_records.filter(t => t.status === "at_risk").length;
  const notMetTargets = performance_target_records.filter(t => t.status === "not_met").length;
  const notStartedTargets = performance_target_records.filter(t => t.status === "not_started").length;

  // Achievement rate: achieved out of total non-not_started
  const activeTargets = totalTargets - notStartedTargets;
  const targetAchievementRate = activeTargets > 0
    ? pct(achievedTargets, activeTargets)
    : 0;

  const targetProgressValues = performance_target_records.map(t => t.progress_percentage);
  // fab-0: null when no target records.
  const avgTargetProgress: number | null = targetProgressValues.length > 0
    ? Math.round(targetProgressValues.reduce((s, v) => s + v, 0) / targetProgressValues.length)
    : null;

  const reviewedTargets = performance_target_records.filter(t => t.reviewed).length;
  const reviewedRate = pct(reviewedTargets, totalTargets);

  const evidenceTargets = performance_target_records.filter(t => t.evidence_attached).length;
  const evidenceRate = pct(evidenceTargets, totalTargets);

  // Overdue targets: past target_date and not achieved
  const overdueTargets = performance_target_records.filter(t => {
    if (t.status === "achieved") return false;
    return daysBetween(t.target_date, today) > 0;
  }).length;

  // Category breakdown
  const targetCategories = new Map<string, { total: number; achieved: number }>();
  for (const t of performance_target_records) {
    const cat = t.category || "other";
    const entry = targetCategories.get(cat) ?? { total: 0, achieved: 0 };
    entry.total++;
    if (t.status === "achieved") entry.achieved++;
    targetCategories.set(cat, entry);
  }
  const categoryBreakdown = Array.from(targetCategories.entries()).map(([category, data]) => ({
    category,
    total: data.total,
    achieved: data.achieved,
  }));

  const targetProfile: TargetProfile = {
    total_targets: totalTargets,
    achieved_count: achievedTargets,
    on_track_count: onTrackTargets,
    at_risk_count: atRiskTargets,
    not_met_count: notMetTargets,
    not_started_count: notStartedTargets,
    achievement_rate: targetAchievementRate,
    avg_progress: avgTargetProgress,
    reviewed_rate: reviewedRate,
    evidence_rate: evidenceRate,
    category_breakdown: categoryBreakdown,
    overdue_targets: overdueTargets,
  };

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 3: Competency Assessment Rate
  // ════════════════════════════════════════════════════════════════════════

  const totalCompetencyAssessments = competency_assessment_records.length;
  const assessedCompetencies = competency_assessment_records.filter(c =>
    c.current_level !== "not_assessed" && c.assessed_date !== null
  ).length;
  const notAssessedCompetencies = totalCompetencyAssessments - assessedCompetencies;

  const COMPETENT_LEVELS = ["competent", "proficient", "expert"];
  const competentOrAboveCount = competency_assessment_records.filter(c =>
    COMPETENT_LEVELS.includes(c.current_level)
  ).length;
  const competencyRate = totalCompetencyAssessments > 0
    ? pct(competentOrAboveCount, totalCompetencyAssessments)
    : 0;

  // Gap analysis
  const gapRecords = competency_assessment_records.filter(c => c.gap_identified);
  const gapCount = gapRecords.length;
  const gapWithActionPlanCount = gapRecords.filter(c => c.action_plan_in_place).length;

  // Area breakdown
  const competencyAreas = new Map<string, { total: number; competent_or_above: number }>();
  for (const c of competency_assessment_records) {
    const area = c.competency_area || "other";
    const entry = competencyAreas.get(area) ?? { total: 0, competent_or_above: 0 };
    entry.total++;
    if (COMPETENT_LEVELS.includes(c.current_level)) entry.competent_or_above++;
    competencyAreas.set(area, entry);
  }
  const areaBreakdown = Array.from(competencyAreas.entries()).map(([area, data]) => ({
    area,
    total: data.total,
    competent_or_above: data.competent_or_above,
  }));

  const competencyProfile: CompetencyProfile = {
    total_assessments: totalCompetencyAssessments,
    assessed_count: assessedCompetencies,
    not_assessed_count: notAssessedCompetencies,
    competent_or_above_count: competentOrAboveCount,
    competency_rate: competencyRate,
    gap_count: gapCount,
    gap_with_action_plan_count: gapWithActionPlanCount,
    area_breakdown: areaBreakdown,
  };

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 4: Development Goal Progress Rate
  // ════════════════════════════════════════════════════════════════════════

  const totalGoals = development_goal_records.length;
  const completedGoals = development_goal_records.filter(g => g.status === "completed").length;
  const inProgressGoals = development_goal_records.filter(g => g.status === "in_progress").length;
  const notStartedGoals = development_goal_records.filter(g => g.status === "not_started").length;
  const overdueGoals = development_goal_records.filter(g => g.status === "overdue").length;
  const cancelledGoals = development_goal_records.filter(g => g.status === "cancelled").length;

  const activeGoals = totalGoals - cancelledGoals;
  const developmentProgressRate = activeGoals > 0
    ? pct(completedGoals, activeGoals)
    : 0;

  const goalProgressValues = development_goal_records
    .filter(g => g.status !== "cancelled")
    .map(g => g.progress_percentage);
  // fab-0: null when no goal records eligible.
  const avgGoalProgress: number | null = goalProgressValues.length > 0
    ? Math.round(goalProgressValues.reduce((s, v) => s + v, 0) / goalProgressValues.length)
    : null;

  const supportProvidedCount = development_goal_records.filter(g => g.support_provided).length;
  const supportProvidedRate = pct(supportProvidedCount, totalGoals);

  const resourceAllocatedCount = development_goal_records.filter(g => g.resource_allocated).length;
  const resourceAllocatedRate = pct(resourceAllocatedCount, totalGoals);

  // Category breakdown for goals
  const goalCategories = new Map<string, { total: number; completed: number }>();
  for (const g of development_goal_records) {
    const cat = g.category || "other";
    const entry = goalCategories.get(cat) ?? { total: 0, completed: 0 };
    entry.total++;
    if (g.status === "completed") entry.completed++;
    goalCategories.set(cat, entry);
  }
  const goalCategoryBreakdown = Array.from(goalCategories.entries()).map(([category, data]) => ({
    category,
    total: data.total,
    completed: data.completed,
  }));

  const developmentProfile: DevelopmentProfile = {
    total_goals: totalGoals,
    completed_count: completedGoals,
    in_progress_count: inProgressGoals,
    not_started_count: notStartedGoals,
    overdue_count: overdueGoals,
    cancelled_count: cancelledGoals,
    completion_rate: developmentProgressRate,
    avg_progress: avgGoalProgress,
    support_provided_rate: supportProvidedRate,
    resource_allocated_rate: resourceAllocatedRate,
    category_breakdown: goalCategoryBreakdown,
  };

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 5: Feedback Quality Rate
  // ════════════════════════════════════════════════════════════════════════

  const totalFeedback = feedback_records.length;
  const formalFeedback = feedback_records.filter(f => f.feedback_type === "formal").length;
  const informalFeedback = feedback_records.filter(f => f.feedback_type === "informal").length;
  const threeSixtyFeedback = feedback_records.filter(f => f.feedback_type === "360").length;
  const peerFeedback = feedback_records.filter(f => f.feedback_type === "peer").length;

  const feedbackQualityScores = feedback_records
    .map(f => f.quality_rating)
    .filter((s): s is number => s !== null && s !== undefined && s > 0);
  const avgFeedbackQuality = avg(feedbackQualityScores);

  const actionableFeedback = feedback_records.filter(f => f.actionable).length;
  const actionableRate = pct(actionableFeedback, totalFeedback);

  const followUpCompleted = feedback_records.filter(f => f.follow_up_completed).length;
  const followUpRate = pct(followUpCompleted, totalFeedback);

  // Feedback quality rate: combines actionability and quality score
  // Use actionable rate as primary measure, weighted by quality
  let feedbackQualityRate: number;
  if (totalFeedback === 0) {
    feedbackQualityRate = 0;
  } else if (avgFeedbackQuality !== null) {
    // Quality rating is 1-10, convert to 0-100 scale and blend with actionable rate
    const qualityPct = Math.round(avgFeedbackQuality * 10);
    feedbackQualityRate = Math.round((actionableRate * 0.6 + qualityPct * 0.4));
  } else {
    feedbackQualityRate = actionableRate;
  }

  const sentimentDistribution = {
    positive: feedback_records.filter(f => f.sentiment === "positive").length,
    constructive: feedback_records.filter(f => f.sentiment === "constructive").length,
    negative: feedback_records.filter(f => f.sentiment === "negative").length,
    mixed: feedback_records.filter(f => f.sentiment === "mixed").length,
  };

  // fab-0: null when no staff on establishment.
  const feedbackPerStaff: number | null = total_staff > 0
    ? Math.round((totalFeedback / total_staff) * 10) / 10
    : null;

  const feedbackProfile: FeedbackProfile = {
    total_feedback: totalFeedback,
    formal_count: formalFeedback,
    informal_count: informalFeedback,
    three_sixty_count: threeSixtyFeedback,
    peer_count: peerFeedback,
    avg_quality_rating: avgFeedbackQuality,
    actionable_rate: actionableRate,
    follow_up_rate: followUpRate,
    sentiment_distribution: sentimentDistribution,
    feedback_per_staff: feedbackPerStaff,
  };

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 6: Staff Satisfaction Rate (derived composite)
  // ════════════════════════════════════════════════════════════════════════
  // Synthesised from: dual signatures (staff engagement), quality scores,
  // positive sentiment, follow-up completion, and support provision.

  const satisfactionComponents: number[] = [];

  if (completedRecords.length > 0) {
    satisfactionComponents.push(dualSignatureRate);
  }
  if (avgAppraisalQuality !== null) {
    satisfactionComponents.push(Math.round(avgAppraisalQuality * 10));
  }
  if (totalFeedback > 0) {
    const positivePct = pct(sentimentDistribution.positive, totalFeedback);
    satisfactionComponents.push(positivePct);
    satisfactionComponents.push(followUpRate);
  }
  if (totalGoals > 0) {
    satisfactionComponents.push(supportProvidedRate);
  }

  // fab-0: null when no satisfaction components observable.
  const staffSatisfactionRate: number | null = satisfactionComponents.length > 0
    ? Math.round(satisfactionComponents.reduce((s, v) => s + v, 0) / satisfactionComponents.length)
    : null;

  // ════════════════════════════════════════════════════════════════════════
  // SCORING — base 52, max bonuses +28, 4 penalties guarded by length>0
  // ════════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Bonus 1: Appraisal completion (max +7) ────────────────────────────
  if (appraisal_records.length > 0) {
    if (appraisalCompletionRate >= 95) score += 7;
    else if (appraisalCompletionRate >= 85) score += 5;
    else if (appraisalCompletionRate >= 70) score += 3;
    else if (appraisalCompletionRate >= 50) score += 1;
    else score += 0;
  }

  // ── Bonus 2: Target achievement (max +6) ──────────────────────────────
  if (performance_target_records.length > 0) {
    if (targetAchievementRate >= 85) score += 6;
    else if (targetAchievementRate >= 70) score += 4;
    else if (targetAchievementRate >= 50) score += 2;
    else if (targetAchievementRate >= 30) score += 1;
    else score += 0;
  }

  // ── Bonus 3: Competency coverage (max +5) ─────────────────────────────
  if (competency_assessment_records.length > 0) {
    if (competencyRate >= 85) score += 5;
    else if (competencyRate >= 70) score += 3;
    else if (competencyRate >= 50) score += 1;
    else score += 0;
  }

  // ── Bonus 4: Development progress (max +5) ────────────────────────────
  if (development_goal_records.length > 0) {
    if (developmentProgressRate >= 80) score += 5;
    else if (developmentProgressRate >= 60) score += 3;
    else if (developmentProgressRate >= 40) score += 1;
    else score += 0;
  }

  // ── Bonus 5: Feedback quality (max +5) ────────────────────────────────
  if (feedback_records.length > 0) {
    if (feedbackQualityRate >= 85) score += 5;
    else if (feedbackQualityRate >= 70) score += 3;
    else if (feedbackQualityRate >= 50) score += 1;
    else score += 0;
  }

  // ── Penalty 1: Overdue appraisals (guarded by length>0) ──────────────
  if (appraisal_records.length > 0 && overdueAppraisals > 0) {
    const overduePct = pct(overdueAppraisals, totalAppraisals);
    if (overduePct >= 40) score -= 8;
    else if (overduePct >= 25) score -= 5;
    else if (overduePct >= 10) score -= 3;
    else score -= 1;
  }

  // ── Penalty 2: At-risk/not-met targets (guarded by length>0) ─────────
  if (performance_target_records.length > 0) {
    const problemTargets = atRiskTargets + notMetTargets;
    const problemPct = pct(problemTargets, totalTargets);
    if (problemPct >= 50) score -= 7;
    else if (problemPct >= 30) score -= 4;
    else if (problemPct >= 15) score -= 2;
    else if (problemPct > 0) score -= 1;
  }

  // ── Penalty 3: Competency gaps without action plans (guarded by length>0)
  if (competency_assessment_records.length > 0 && gapCount > 0) {
    const gapsWithoutPlan = gapCount - gapWithActionPlanCount;
    if (gapsWithoutPlan >= 5) score -= 6;
    else if (gapsWithoutPlan >= 3) score -= 4;
    else if (gapsWithoutPlan >= 1) score -= 2;
  }

  // ── Penalty 4: Overdue development goals (guarded by length>0) ───────
  if (development_goal_records.length > 0 && overdueGoals > 0) {
    const overdueGoalPct = pct(overdueGoals, activeGoals);
    if (overdueGoalPct >= 40) score -= 6;
    else if (overdueGoalPct >= 25) score -= 4;
    else if (overdueGoalPct >= 10) score -= 2;
    else score -= 1;
  }

  // ── Staff without any appraisal penalty ──────────────────────────────
  if (total_staff > 0 && staffWithNoAppraisal > 0) {
    const noAppraisalPct = pct(staffWithNoAppraisal, total_staff);
    if (noAppraisalPct >= 50) score -= 5;
    else if (noAppraisalPct >= 25) score -= 3;
    else if (noAppraisalPct >= 10) score -= 1;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  if (appraisalCompletionRate >= 90 && totalAppraisals > 0) {
    strengths.push(
      `Appraisal completion rate is ${appraisalCompletionRate}% — staff are regularly appraised and performance is formally reviewed.`,
    );
  }
  if (dualSignatureRate >= 90 && completedRecords.length > 0) {
    strengths.push(
      `${dualSignatureRate}% of completed appraisals have dual signatures — strong evidence of staff engagement and agreement.`,
    );
  }
  if (objectivesSetRate >= 90 && completedRecords.length > 0) {
    strengths.push(
      `Objectives set in ${objectivesSetRate}% of appraisals — staff have clear direction and measurable goals.`,
    );
  }
  if (developmentPlanRate >= 90 && completedRecords.length > 0) {
    strengths.push(
      `Development plans agreed in ${developmentPlanRate}% of appraisals — commitment to continuous staff improvement.`,
    );
  }
  if (targetAchievementRate >= 80 && activeTargets > 0) {
    strengths.push(
      `${targetAchievementRate}% of performance targets achieved — staff are meeting their objectives consistently.`,
    );
  }
  if (competencyRate >= 85 && totalCompetencyAssessments > 0) {
    strengths.push(
      `${competencyRate}% of staff assessed as competent or above — strong workforce capability across assessed areas.`,
    );
  }
  if (gapCount > 0 && gapWithActionPlanCount === gapCount) {
    strengths.push(
      `All ${gapCount} identified competency gaps have action plans in place — proactive approach to skills development.`,
    );
  }
  if (developmentProgressRate >= 75 && activeGoals > 0) {
    strengths.push(
      `${developmentProgressRate}% of development goals completed — staff are progressing well in their professional growth.`,
    );
  }
  if (supportProvidedRate >= 85 && totalGoals > 0) {
    strengths.push(
      `Support provided for ${supportProvidedRate}% of development goals — home is investing in staff success.`,
    );
  }
  if (feedbackQualityRate >= 80 && totalFeedback > 0) {
    strengths.push(
      `Feedback quality rate is ${feedbackQualityRate}% — feedback is meaningful, actionable, and well-documented.`,
    );
  }
  if (followUpRate >= 85 && totalFeedback > 0) {
    strengths.push(
      `Follow-up completed on ${followUpRate}% of feedback — demonstrates commitment to acting on insights.`,
    );
  }
  if (avgAppraisalQuality !== null && avgAppraisalQuality >= 8.0) {
    strengths.push(
      `Average appraisal quality score is ${avgAppraisalQuality}/10 — appraisals are thorough and well-conducted.`,
    );
  }
  if (staffWithNoAppraisal === 0 && total_staff > 0 && totalAppraisals > 0) {
    strengths.push(
      `All ${total_staff} staff have at least one appraisal on record — full workforce coverage.`,
    );
  }
  if (feedbackPerStaff !== null && feedbackPerStaff >= 3) {
    strengths.push(
      `Average of ${feedbackPerStaff} feedback entries per staff member — rich feedback culture supports continuous improvement.`,
    );
  }
  if (ratingDistribution.exceptional > 0) {
    const exceptionalPct = pct(ratingDistribution.exceptional, totalAppraisals);
    if (exceptionalPct >= 30) {
      strengths.push(
        `${exceptionalPct}% of appraisals rated exceptional — evidence of high-performing staff.`,
      );
    }
  }
  if (reviewedRate >= 90 && totalTargets > 0) {
    strengths.push(
      `${reviewedRate}% of performance targets have been reviewed — active monitoring of staff progress.`,
    );
  }
  if (evidenceRate >= 80 && totalTargets > 0) {
    strengths.push(
      `Evidence attached to ${evidenceRate}% of targets — strong documentation of achievement.`,
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  if (appraisalCompletionRate < 50 && totalAppraisals > 0) {
    concerns.push(
      `Only ${appraisalCompletionRate}% of appraisals completed — Reg 16 requires a robust workforce development system.`,
    );
  }
  if (overdueAppraisals > 0) {
    concerns.push(
      `${overdueAppraisals} appraisal${overdueAppraisals > 1 ? "s are" : " is"} overdue — timely performance review is essential under Reg 33.`,
    );
  }
  if (staffWithNoAppraisal > 0 && total_staff > 0) {
    concerns.push(
      `${staffWithNoAppraisal} of ${total_staff} staff have no appraisal on record — workforce performance management has gaps.`,
    );
  }
  if (dualSignatureRate < 50 && completedRecords.length > 0) {
    concerns.push(
      `Only ${dualSignatureRate}% of completed appraisals have dual signatures — staff engagement with the appraisal process is low.`,
    );
  }
  if (objectivesSetRate < 60 && completedRecords.length > 0) {
    concerns.push(
      `Objectives set in only ${objectivesSetRate}% of appraisals — staff lack clear performance direction.`,
    );
  }
  if (notMetTargets > 0) {
    concerns.push(
      `${notMetTargets} performance target${notMetTargets > 1 ? "s" : ""} not met — review whether targets are realistic and support is adequate.`,
    );
  }
  if (atRiskTargets > 0) {
    concerns.push(
      `${atRiskTargets} performance target${atRiskTargets > 1 ? "s are" : " is"} at risk — intervention needed to prevent failure.`,
    );
  }
  if (overdueTargets > 0) {
    concerns.push(
      `${overdueTargets} performance target${overdueTargets > 1 ? "s are" : " is"} past their target date — timely review and adjustment needed.`,
    );
  }
  if (competencyRate < 50 && totalCompetencyAssessments > 0) {
    concerns.push(
      `Only ${competencyRate}% of competency assessments at competent level or above — significant skills gap across the workforce.`,
    );
  }
  if (gapCount > 0 && gapWithActionPlanCount < gapCount) {
    const gapsWithoutPlan = gapCount - gapWithActionPlanCount;
    concerns.push(
      `${gapsWithoutPlan} identified competency gap${gapsWithoutPlan > 1 ? "s have" : " has"} no action plan — gaps must be addressed with targeted development.`,
    );
  }
  if (notAssessedCompetencies > 0 && totalCompetencyAssessments > 0) {
    const notAssessedPct = pct(notAssessedCompetencies, totalCompetencyAssessments);
    if (notAssessedPct >= 30) {
      concerns.push(
        `${notAssessedPct}% of competency areas remain unassessed — assessment coverage needs improvement.`,
      );
    }
  }
  if (overdueGoals > 0) {
    concerns.push(
      `${overdueGoals} development goal${overdueGoals > 1 ? "s are" : " is"} overdue — staff professional growth is falling behind.`,
    );
  }
  if (developmentProgressRate < 40 && activeGoals > 0) {
    concerns.push(
      `Only ${developmentProgressRate}% of development goals completed — staff development programme needs strengthening.`,
    );
  }
  if (supportProvidedRate < 50 && totalGoals > 0) {
    concerns.push(
      `Support provided for only ${supportProvidedRate}% of development goals — staff may lack resources to achieve their goals.`,
    );
  }
  if (feedbackQualityRate < 50 && totalFeedback > 0) {
    concerns.push(
      `Feedback quality rate is only ${feedbackQualityRate}% — feedback may lack substance or actionability.`,
    );
  }
  if (followUpRate < 40 && totalFeedback > 0) {
    concerns.push(
      `Only ${followUpRate}% of feedback has been followed up — feedback loop is not closing effectively.`,
    );
  }
  if (total_staff > 0 && feedbackPerStaff !== null && feedbackPerStaff < 1 && totalFeedback > 0) {
    concerns.push(
      `Average of only ${feedbackPerStaff} feedback entries per staff member — feedback frequency is insufficient.`,
    );
  }
  if (ratingDistribution.underperforming > 0) {
    const upPct = pct(ratingDistribution.underperforming, totalAppraisals);
    concerns.push(
      `${ratingDistribution.underperforming} staff rated as underperforming (${upPct}%) — capability or performance management plans required.`,
    );
  }
  if (cancelledAppraisals > 0) {
    const cancelPct = pct(cancelledAppraisals, totalAppraisals);
    if (cancelPct >= 15) {
      concerns.push(
        `${cancelPct}% of appraisals cancelled — investigate reasons and ensure rescheduling.`,
      );
    }
  }
  if (avgAppraisalQuality !== null && avgAppraisalQuality < 5.0) {
    concerns.push(
      `Average appraisal quality score is only ${avgAppraisalQuality}/10 — appraisals may be superficial or poorly conducted.`,
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  const recs: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 1;

  if (overdueAppraisals > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Complete ${overdueAppraisals} overdue appraisal${overdueAppraisals > 1 ? "s" : ""} immediately. Reg 16 requires systematic workforce development and Reg 33 requires competent staff management.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }
  if (staffWithNoAppraisal > 0 && total_staff > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Schedule appraisals for ${staffWithNoAppraisal} staff member${staffWithNoAppraisal > 1 ? "s" : ""} who have no appraisal on record — all staff must be formally appraised.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (gapCount > 0 && gapWithActionPlanCount < gapCount) {
    const gapsWithoutPlan = gapCount - gapWithActionPlanCount;
    recs.push({
      rank: rank++,
      recommendation: `Create action plans for ${gapsWithoutPlan} unaddressed competency gap${gapsWithoutPlan > 1 ? "s" : ""} to ensure all staff meet required competency levels.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }
  if (notMetTargets > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Review ${notMetTargets} unmet performance target${notMetTargets > 1 ? "s" : ""} — assess whether targets need adjusting, additional support is needed, or capability management is required.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (overdueGoals > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Address ${overdueGoals} overdue development goal${overdueGoals > 1 ? "s" : ""} — reset timelines, provide additional resources, or revise goals as appropriate.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }
  if (atRiskTargets >= 3) {
    recs.push({
      rank: rank++,
      recommendation: `${atRiskTargets} targets are at risk — implement targeted support plans before they become not-met.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (dualSignatureRate < 70 && completedRecords.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve dual signature rate from ${dualSignatureRate}% — ensure both staff and managers sign appraisals to evidence engagement and agreement.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (objectivesSetRate < 70 && completedRecords.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase objectives-setting rate from ${objectivesSetRate}% — every appraisal should result in clear, measurable objectives.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }
  if (followUpRate < 60 && totalFeedback > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve feedback follow-up rate from ${followUpRate}% — feedback without follow-through undermines the performance management cycle.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (total_staff > 0 && feedbackPerStaff !== null && feedbackPerStaff < 2) {
    recs.push({
      rank: rank++,
      recommendation: `Increase feedback frequency — currently averaging ${feedbackPerStaff} per staff member. Aim for regular formal and informal feedback throughout the appraisal cycle.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }
  if (supportProvidedRate < 60 && totalGoals > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Provide support for more development goals — currently only ${supportProvidedRate}%. Staff need resources and guidance to achieve their development objectives.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }
  if (competencyRate < 65 && totalCompetencyAssessments > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Implement targeted training to improve competency rate from ${competencyRate}% — ensure staff meet required levels in key competency areas.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }
  if (reviewedRate < 70 && totalTargets > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve target review rate from ${reviewedRate}% — regular progress reviews keep staff on track and allow early intervention.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (ratingDistribution.underperforming > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Develop performance improvement plans for ${ratingDistribution.underperforming} underperforming staff member${ratingDistribution.underperforming > 1 ? "s" : ""} — Reg 33 requires staff to be managed to deliver good outcomes.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }
  if (developmentPlanRate < 70 && completedRecords.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase development plan agreement rate from ${developmentPlanRate}% — every appraisal should include an agreed development plan.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  const insights: { text: string; severity: string }[] = [];

  // Critical: Major overdue appraisal issues
  if (overdueAppraisals >= 3) {
    insights.push({
      text: `${overdueAppraisals} appraisals are overdue. This is a systemic failure in the appraisal cycle that Ofsted will identify as a leadership and management concern.`,
      severity: "critical",
    });
  } else if (overdueAppraisals > 0) {
    insights.push({
      text: `${overdueAppraisals} appraisal${overdueAppraisals > 1 ? "s" : ""} overdue — prioritise completion to maintain Reg 16 compliance.`,
      severity: "warning",
    });
  }

  // Critical: Staff without appraisals
  if (staffWithNoAppraisal > 0 && total_staff > 0) {
    const noAppraisalPct = pct(staffWithNoAppraisal, total_staff);
    if (noAppraisalPct >= 40) {
      insights.push({
        text: `${noAppraisalPct}% of staff (${staffWithNoAppraisal} of ${total_staff}) have never been appraised. This is a fundamental gap in workforce governance under Reg 16 and Reg 33.`,
        severity: "critical",
      });
    } else if (noAppraisalPct >= 15) {
      insights.push({
        text: `${staffWithNoAppraisal} staff member${staffWithNoAppraisal > 1 ? "s have" : " has"} no appraisal record — ensure all staff are included in the performance cycle.`,
        severity: "warning",
      });
    }
  }

  // Critical: Competency gaps without plans
  if (gapCount > 0 && gapWithActionPlanCount < gapCount) {
    const gapsWithoutPlan = gapCount - gapWithActionPlanCount;
    if (gapsWithoutPlan >= 3) {
      insights.push({
        text: `${gapsWithoutPlan} competency gaps have no action plan. Unaddressed gaps pose a risk to care quality — Ofsted expects evidence that identified weaknesses are being managed.`,
        severity: "critical",
      });
    } else {
      insights.push({
        text: `${gapsWithoutPlan} competency gap${gapsWithoutPlan > 1 ? "s require" : " requires"} an action plan — ensure development support is in place.`,
        severity: "warning",
      });
    }
  }

  // Warning: Target achievement patterns
  if (notMetTargets >= 3 && totalTargets > 0) {
    insights.push({
      text: `${notMetTargets} performance targets not met across the team. This pattern may indicate targets are unrealistic, support is insufficient, or capability issues need addressing.`,
      severity: "critical",
    });
  } else if (notMetTargets > 0) {
    insights.push({
      text: `${notMetTargets} target${notMetTargets > 1 ? "s" : ""} not met — review and adjust as needed.`,
      severity: "warning",
    });
  }

  // Warning: Overdue development goals
  if (overdueGoals >= 3) {
    insights.push({
      text: `${overdueGoals} development goals are overdue — staff development programme governance requires review. Ofsted assesses whether the home invests in its workforce.`,
      severity: "critical",
    });
  } else if (overdueGoals > 0) {
    insights.push({
      text: `${overdueGoals} development goal${overdueGoals > 1 ? "s are" : " is"} overdue — follow up to maintain momentum.`,
      severity: "warning",
    });
  }

  // Positive: Outstanding performance management
  if (appraisalCompletionRate >= 90 && targetAchievementRate >= 80 && competencyRate >= 85 && developmentProgressRate >= 75) {
    insights.push({
      text: `Performance management is strong: ${appraisalCompletionRate}% appraisal completion, ${targetAchievementRate}% target achievement, ${competencyRate}% competency rate, ${developmentProgressRate}% development progress. Well-placed for Ofsted inspection.`,
      severity: "positive",
    });
  }

  // Positive: Rich feedback culture
  if (feedbackPerStaff !== null && feedbackPerStaff >= 3 && feedbackQualityRate >= 75) {
    insights.push({
      text: `Rich feedback culture with ${feedbackPerStaff} entries per staff member and ${feedbackQualityRate}% quality rate. Evidence of reflective, learning-oriented workforce management.`,
      severity: "positive",
    });
  }

  // Warning: Low feedback quality
  if (feedbackQualityRate < 40 && totalFeedback > 0) {
    insights.push({
      text: `Feedback quality rate is only ${feedbackQualityRate}%. Low-quality feedback undermines the performance management cycle and fails to drive improvement.`,
      severity: "warning",
    });
  }

  // Warning: Underperforming staff pattern
  if (ratingDistribution.underperforming >= 2) {
    const upPct = pct(ratingDistribution.underperforming, totalAppraisals);
    insights.push({
      text: `${ratingDistribution.underperforming} staff members (${upPct}%) rated underperforming. Ensure performance improvement plans are in place and being actively managed.`,
      severity: "critical",
    });
  }

  // Positive: All gaps have action plans
  if (gapCount > 0 && gapWithActionPlanCount === gapCount) {
    insights.push({
      text: `All ${gapCount} identified competency gaps have action plans in place — proactive approach to closing skills gaps will be viewed favourably by Ofsted.`,
      severity: "positive",
    });
  }

  // Warning: Low dual signature rate
  if (dualSignatureRate < 50 && completedRecords.length > 0) {
    insights.push({
      text: `Only ${dualSignatureRate}% of appraisals have dual signatures. This may indicate staff are not fully engaged with the appraisal process or feel it lacks value.`,
      severity: "warning",
    });
  }

  // Positive: Comprehensive support
  if (supportProvidedRate >= 85 && resourceAllocatedRate >= 80 && totalGoals > 0) {
    insights.push({
      text: `Strong development support: ${supportProvidedRate}% of goals have support provided and ${resourceAllocatedRate}% have resources allocated. Evidence of investment in staff growth.`,
      severity: "positive",
    });
  }

  // Warning: Assessment coverage gaps
  if (totalCompetencyAssessments > 0) {
    const assessedPct = pct(assessedCompetencies, totalCompetencyAssessments);
    if (assessedPct < 60) {
      insights.push({
        text: `Only ${assessedPct}% of competency assessments have been completed. Incomplete assessment limits the home's understanding of workforce capability.`,
        severity: "warning",
      });
    }
  }

  // Positive: Diverse feedback sources
  if (threeSixtyFeedback > 0 && peerFeedback > 0 && formalFeedback > 0) {
    insights.push({
      text: `Diverse feedback sources including formal, 360-degree, and peer feedback. Multi-source feedback provides richer insight into staff performance.`,
      severity: "positive",
    });
  }

  // Warning: Cancelled appraisals pattern
  if (cancelledAppraisals >= 3) {
    insights.push({
      text: `${cancelledAppraisals} appraisals cancelled — investigate whether this reflects scheduling issues, staff resistance, or management capacity constraints.`,
      severity: "warning",
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ════════════════════════════════════════════════════════════════════════

  let headline: string;
  if (rating === "outstanding") {
    headline = "Staff performance appraisal quality is outstanding — appraisal completion, target achievement, competency assessment, development progress, and feedback quality all performing strongly.";
  } else if (rating === "good") {
    const issues: string[] = [];
    if (overdueAppraisals > 0) issues.push(`${overdueAppraisals} overdue appraisals`);
    if (notMetTargets > 0) issues.push(`${notMetTargets} unmet targets`);
    if (overdueGoals > 0) issues.push(`${overdueGoals} overdue goals`);
    if (gapCount > gapWithActionPlanCount) issues.push(`${gapCount - gapWithActionPlanCount} unaddressed competency gaps`);
    headline = issues.length > 0
      ? `Good overall performance appraisal quality — attention needed on ${issues.join(", ")}.`
      : "Good staff performance appraisal quality — performance management is maintained across key areas.";
  } else if (rating === "adequate") {
    headline = "Adequate performance appraisal quality — gaps in completion rates, target tracking, competency assessment, or development progress require focused attention.";
  } else {
    headline = "Staff performance appraisal quality is inadequate — multiple workforce governance requirements under Reg 16 and Reg 33 are unmet.";
  }

  // ════════════════════════════════════════════════════════════════════════
  // RETURN
  // ════════════════════════════════════════════════════════════════════════

  return {
    appraisal_rating: rating,
    appraisal_score: score,
    headline,
    appraisal_completion_rate: appraisalCompletionRate,
    target_achievement_rate: targetAchievementRate,
    competency_rate: competencyRate,
    development_progress_rate: developmentProgressRate,
    feedback_quality_rate: feedbackQualityRate,
    staff_satisfaction_rate: staffSatisfactionRate,
    appraisal_profile: appraisalProfile,
    target_profile: targetProfile,
    competency_profile: competencyProfile,
    development_profile: developmentProfile,
    feedback_profile: feedbackProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// EMPTY RESULT FACTORY
// ══════════════════════════════════════════════════════════════════════════════

function emptyResult(
  rating: StaffPerformanceRating,
  score: number,
  headline: string,
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[],
  insights: { text: string; severity: string }[],
): StaffPerformanceResult {
  const emptyAppraisalProfile: AppraisalProfile = {
    total_appraisals: 0,
    completed_count: 0,
    scheduled_count: 0,
    overdue_count: 0,
    cancelled_count: 0,
    completion_rate: 0,
    dual_signature_rate: 0,
    objectives_set_rate: 0,
    development_plan_rate: 0,
    avg_quality_score: null,
    rating_distribution: { exceptional: 0, effective: 0, developing: 0, underperforming: 0, not_rated: 0 },
    staff_with_no_appraisal: 0,
  };
  const emptyTargetProfile: TargetProfile = {
    total_targets: 0,
    achieved_count: 0,
    on_track_count: 0,
    at_risk_count: 0,
    not_met_count: 0,
    not_started_count: 0,
    achievement_rate: 0,
    avg_progress: 0,
    reviewed_rate: 0,
    evidence_rate: 0,
    category_breakdown: [],
    overdue_targets: 0,
  };
  const emptyCompetencyProfile: CompetencyProfile = {
    total_assessments: 0,
    assessed_count: 0,
    not_assessed_count: 0,
    competent_or_above_count: 0,
    competency_rate: 0,
    gap_count: 0,
    gap_with_action_plan_count: 0,
    area_breakdown: [],
  };
  const emptyDevelopmentProfile: DevelopmentProfile = {
    total_goals: 0,
    completed_count: 0,
    in_progress_count: 0,
    not_started_count: 0,
    overdue_count: 0,
    cancelled_count: 0,
    completion_rate: 0,
    avg_progress: 0,
    support_provided_rate: 0,
    resource_allocated_rate: 0,
    category_breakdown: [],
  };
  const emptyFeedbackProfile: FeedbackProfile = {
    total_feedback: 0,
    formal_count: 0,
    informal_count: 0,
    three_sixty_count: 0,
    peer_count: 0,
    avg_quality_rating: null,
    actionable_rate: 0,
    follow_up_rate: 0,
    sentiment_distribution: { positive: 0, constructive: 0, negative: 0, mixed: 0 },
    feedback_per_staff: null,
  };

  return {
    appraisal_rating: rating,
    appraisal_score: score,
    headline,
    appraisal_completion_rate: 0,
    target_achievement_rate: 0,
    competency_rate: 0,
    development_progress_rate: 0,
    feedback_quality_rate: 0,
    staff_satisfaction_rate: null,
    appraisal_profile: emptyAppraisalProfile,
    target_profile: emptyTargetProfile,
    competency_profile: emptyCompetencyProfile,
    development_profile: emptyDevelopmentProfile,
    feedback_profile: emptyFeedbackProfile,
    strengths: [],
    concerns: [],
    recommendations,
    insights,
  };
}
