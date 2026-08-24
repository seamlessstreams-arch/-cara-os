// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME HOLISTIC CHILD PROGRESS COMPOSITE INTELLIGENCE ENGINE
// Cross-domain composite that aggregates outcome reviews, education records,
// key working sessions, and independence skills records to give a single
// holistic view of each child's progress trajectory across all life domains.
// Critical for Ofsted assessment of children's outcomes.
// Pure deterministic engine. CHR 2015 Reg 5/7/8/10/33/34.
// ══════════════════════════════════════════════════════════════════════════════

/* ── Input types ──────────────────────────────────────────────────────────── */

export interface OutcomeReviewInput {
  id: string;
  child_id: string;
  review_date: string;
  domain: string; // "health" | "education" | "emotional" | "social" | "independence" | "identity" | "family"
  score: number; // 0-10 or 0-100 depending on scale
  previous_score: number | null;
  has_evidence: boolean;
  has_child_voice: boolean;
  reviewer: string;
}

export interface EducationRecordInput {
  id: string;
  child_id: string;
  date: string;
  attendance_rate: number; // 0-100
  has_pep: boolean; // personal education plan
  is_engaged: boolean;
  has_exclusions: boolean;
  achievement_count: number;
}

export interface KeyWorkSessionInput {
  id: string;
  child_id: string;
  date: string;
  completed: boolean;
  has_child_voice: boolean;
  has_goals: boolean;
  goals_progressed: number;
  goals_total: number;
  duration_minutes: number;
}

export interface IndependenceRecordBasicInput {
  id: string;
  child_id: string;
  review_date: string;
  overall_readiness: number; // 0-100
  skills_count: number;
  skills_progressing: number; // developing or above
  has_child_view: boolean;
}

export interface HolisticChildProgressInput {
  today: string;
  total_children: number;
  outcome_reviews: OutcomeReviewInput[];
  education_records: EducationRecordInput[];
  key_work_sessions: KeyWorkSessionInput[];
  independence_records: IndependenceRecordBasicInput[];
}

/* ── Result types ─────────────────────────────────────────────────────────── */

export type HolisticProgressRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface HolisticChildProgressResult {
  progress_rating: HolisticProgressRating;
  progress_score: number; // 0-100
  headline: string;
  children_with_data: number; // unique children across all inputs
  /** null when the population is empty — nothing measured, not 0%. */
  outcome_improvement_rate: number | null; // % of reviews where score > previous_score
  /** null when the population is empty — nothing measured, not 0%. */
  outcome_child_voice_rate: number | null; // % of outcome reviews with child voice
  /** null when the population is empty — nothing measured, not 0%. */
  education_engagement_rate: number | null; // % of education records where engaged
  average_attendance: number; // avg attendance across education records
  /** null when the population is empty — nothing measured, not 0%. */
  key_work_completion_rate: number | null; // % of key work sessions completed
  /** null when the population is empty — nothing measured, not 0%. */
  key_work_goal_progress_rate: number | null; // % of goals progressed out of total goals
  independence_readiness_average: number; // avg overall_readiness
  domain_coverage: number; // distinct domains covered across all inputs
  /** null when the population is empty — nothing measured, not 0%. */
  child_voice_composite_rate: number | null; // avg child voice across all data types
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref?: string }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function ratingFromScore(score: number): HolisticProgressRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function headline(rating: HolisticProgressRating, score: number, childrenWithData: number): string {
  switch (rating) {
    case "outstanding":
      return `Outstanding holistic progress across ${childrenWithData} children — multi-domain outcomes consistently strong (score ${score}/100).`;
    case "good":
      return `Good holistic progress across ${childrenWithData} children — most domains showing positive trajectories (score ${score}/100).`;
    case "adequate":
      return `Adequate holistic progress across ${childrenWithData} children — some domains require improvement (score ${score}/100).`;
    case "inadequate":
      return `Inadequate holistic progress across ${childrenWithData} children — significant gaps across multiple domains (score ${score}/100).`;
    case "insufficient_data":
      return "Insufficient data to assess holistic child progress — no records available across any domain.";
  }
}

/* ── Main compute ─────────────────────────────────────────────────────────── */

export function computeHolisticChildProgress(input: HolisticChildProgressInput): HolisticChildProgressResult {
  const { outcome_reviews, education_records, key_work_sessions, independence_records } = input;

  const totalRecords = outcome_reviews.length + education_records.length + key_work_sessions.length + independence_records.length;

  // Insufficient data: nothing at all and no children
  if (totalRecords === 0 && input.total_children === 0) {
    return {
      progress_rating: "insufficient_data",
      progress_score: 0,
      headline: headline("insufficient_data", 0, 0),
      children_with_data: 0,
      outcome_improvement_rate: null,
      outcome_child_voice_rate: null,
      education_engagement_rate: null,
      average_attendance: 0,
      key_work_completion_rate: null,
      key_work_goal_progress_rate: null,
      independence_readiness_average: 0,
      domain_coverage: 0,
      child_voice_composite_rate: null,
      strengths: [],
      concerns: ["No data available across any progress domain — cannot assess children's holistic outcomes."],
      recommendations: [{ rank: 1, recommendation: "Begin capturing outcome reviews, education records, key working sessions, and independence assessments for all children.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" }],
      insights: [{ text: "No holistic progress data exists — Ofsted will require evidence of children's outcomes across all domains.", severity: "critical" }],
    };
  }

  // Special case: no records but children exist
  if (totalRecords === 0 && input.total_children > 0) {
    return {
      progress_rating: "inadequate",
      progress_score: 18,
      headline: headline("inadequate", 18, 0),
      children_with_data: 0,
      outcome_improvement_rate: null,
      outcome_child_voice_rate: null,
      education_engagement_rate: null,
      average_attendance: 0,
      key_work_completion_rate: null,
      key_work_goal_progress_rate: null,
      independence_readiness_average: 0,
      domain_coverage: 0,
      child_voice_composite_rate: null,
      strengths: [],
      concerns: [
        `${input.total_children} children in placement but no holistic progress data recorded across any domain.`,
        "Ofsted cannot assess outcomes without evidence of progress tracking.",
      ],
      recommendations: [
        { rank: 1, recommendation: "Urgently implement outcome reviews for all children across all seven domains.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" },
        { rank: 2, recommendation: "Ensure each child has current education records including attendance and engagement data.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 8" },
        { rank: 3, recommendation: "Establish regular key working sessions with documented goals for every child.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 10" },
      ],
      insights: [
        { text: `${input.total_children} children without any holistic progress tracking — critical gap for inspection.`, severity: "critical" },
      ],
    };
  }

  // ── Compute metrics ──────────────────────────────────────────────────────

  // Unique children across all inputs
  const childIds = new Set<string>();
  for (const r of outcome_reviews) childIds.add(r.child_id);
  for (const r of education_records) childIds.add(r.child_id);
  for (const r of key_work_sessions) childIds.add(r.child_id);
  for (const r of independence_records) childIds.add(r.child_id);
  const childrenWithData = childIds.size;

  // Outcome improvement rate: % of reviews where score > previous_score (only where previous exists)
  const reviewsWithPrevious = outcome_reviews.filter(r => r.previous_score !== null);
  const improved = reviewsWithPrevious.filter(r => r.score > r.previous_score!);
  const outcomeImprovementRate = pct(improved.length, reviewsWithPrevious.length);

  // Outcome child voice rate
  const outcomeChildVoiceRate = pct(
    outcome_reviews.filter(r => r.has_child_voice).length,
    outcome_reviews.length,
  );

  // Education engagement rate
  const educationEngagementRate = pct(
    education_records.filter(r => r.is_engaged).length,
    education_records.length,
  );

  // Average attendance
  const averageAttendance = education_records.length === 0
    ? 0
    : Math.round(education_records.reduce((sum, r) => sum + r.attendance_rate, 0) / education_records.length);

  // Key work completion rate
  const keyWorkCompletionRate = pct(
    key_work_sessions.filter(s => s.completed).length,
    key_work_sessions.length,
  );

  // Key work goal progress rate
  const totalGoals = key_work_sessions.reduce((sum, s) => sum + s.goals_total, 0);
  const goalsProgressed = key_work_sessions.reduce((sum, s) => sum + s.goals_progressed, 0);
  const keyWorkGoalProgressRate = pct(goalsProgressed, totalGoals);

  // Independence readiness average
  const independenceReadinessAverage = independence_records.length === 0
    ? 0
    : Math.round(independence_records.reduce((sum, r) => sum + r.overall_readiness, 0) / independence_records.length);

  // Domain coverage: distinct domains from outcome reviews
  const domains = new Set<string>();
  for (const r of outcome_reviews) domains.add(r.domain);
  const domainCoverage = domains.size;

  // Child voice composite rate: average child voice across data types that have it
  // Sources: outcome reviews (has_child_voice), key work sessions (has_child_voice), independence records (has_child_view)
  const voiceSources: number[] = [];
  if (outcome_reviews.length > 0) {
    voiceSources.push(pct(outcome_reviews.filter(r => r.has_child_voice).length, outcome_reviews.length));
  }
  if (key_work_sessions.length > 0) {
    voiceSources.push(pct(key_work_sessions.filter(s => s.has_child_voice).length, key_work_sessions.length));
  }
  if (independence_records.length > 0) {
    voiceSources.push(pct(independence_records.filter(r => r.has_child_view).length, independence_records.length));
  }
  const childVoiceCompositeRate = voiceSources.length === 0
    ? 0
    : Math.round(voiceSources.reduce((a, b) => a + b, 0) / voiceSources.length);

  // ── Scoring ──────────────────────────────────────────────────────────────

  let score = 52;

  // Outcome improvement bonuses
  if (outcomeImprovementRate >= 70) score += 4;
  else if (outcomeImprovementRate >= 50) score += 2;

  // Outcome child voice bonuses
  if (outcomeChildVoiceRate >= 90) score += 3;
  else if (outcomeChildVoiceRate >= 70) score += 1;

  // Education engagement bonuses
  if (educationEngagementRate >= 90) score += 4;
  else if (educationEngagementRate >= 75) score += 2;

  // Average attendance bonuses
  if (averageAttendance >= 95) score += 3;
  else if (averageAttendance >= 85) score += 1;

  // Key work completion bonuses
  if (keyWorkCompletionRate >= 90) score += 4;
  else if (keyWorkCompletionRate >= 75) score += 2;

  // Key work goal progress bonuses
  if (keyWorkGoalProgressRate >= 80) score += 3;
  else if (keyWorkGoalProgressRate >= 60) score += 1;

  // Independence readiness bonuses
  if (independenceReadinessAverage >= 70) score += 3;
  else if (independenceReadinessAverage >= 50) score += 1;

  // Domain coverage bonuses
  if (domainCoverage >= 5) score += 2;
  else if (domainCoverage >= 3) score += 1;

  // Child voice composite bonuses
  if (childVoiceCompositeRate >= 90) score += 2;
  else if (childVoiceCompositeRate >= 70) score += 1;

  // Penalties
  if (educationEngagementRate < 50) score -= 5;
  if (averageAttendance < 70) score -= 5;
  if (keyWorkCompletionRate < 50) score -= 5;
  if (outcomeImprovementRate === 0 && outcome_reviews.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const rating = ratingFromScore(score);

  // ── Strengths ────────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (outcomeImprovementRate >= 70) {
    strengths.push(`Strong outcome improvement — ${outcomeImprovementRate}% of reviews show positive progress.`);
  } else if (outcomeImprovementRate >= 50) {
    strengths.push(`Majority of outcome reviews show improvement (${outcomeImprovementRate}%).`);
  }

  if (outcomeChildVoiceRate >= 90) {
    strengths.push(`Excellent child voice capture in outcome reviews (${outcomeChildVoiceRate}%).`);
  } else if (outcomeChildVoiceRate >= 70) {
    strengths.push(`Good child voice capture in outcome reviews (${outcomeChildVoiceRate}%).`);
  }

  if (educationEngagementRate >= 90) {
    strengths.push(`Excellent education engagement across records (${educationEngagementRate}%).`);
  } else if (educationEngagementRate >= 75) {
    strengths.push(`Good education engagement rate (${educationEngagementRate}%).`);
  }

  if (averageAttendance >= 95) {
    strengths.push(`Outstanding average attendance at ${averageAttendance}%.`);
  } else if (averageAttendance >= 85) {
    strengths.push(`Good average attendance at ${averageAttendance}%.`);
  }

  if (keyWorkCompletionRate >= 90) {
    strengths.push(`Excellent key work session completion (${keyWorkCompletionRate}%).`);
  } else if (keyWorkCompletionRate >= 75) {
    strengths.push(`Good key work session completion (${keyWorkCompletionRate}%).`);
  }

  if (keyWorkGoalProgressRate >= 80) {
    strengths.push(`Strong goal progress in key working — ${keyWorkGoalProgressRate}% of goals progressing.`);
  } else if (keyWorkGoalProgressRate >= 60) {
    strengths.push(`Majority of key working goals progressing (${keyWorkGoalProgressRate}%).`);
  }

  if (independenceReadinessAverage >= 70) {
    strengths.push(`Good independence readiness average (${independenceReadinessAverage}/100).`);
  } else if (independenceReadinessAverage >= 50) {
    strengths.push(`Adequate independence readiness (${independenceReadinessAverage}/100).`);
  }

  if (domainCoverage >= 5) {
    strengths.push(`Broad domain coverage with ${domainCoverage} domains assessed in outcome reviews.`);
  }

  if (childVoiceCompositeRate >= 90) {
    strengths.push(`Outstanding composite child voice rate (${childVoiceCompositeRate}%) across all data types.`);
  } else if (childVoiceCompositeRate >= 70) {
    strengths.push(`Good composite child voice rate (${childVoiceCompositeRate}%) across data types.`);
  }

  // ── Concerns ─────────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (outcome_reviews.length > 0 && outcomeImprovementRate === 0) {
    concerns.push("No outcome reviews show improvement — children's progress is stagnant or declining.");
  } else if (outcomeImprovementRate > 0 && outcomeImprovementRate < 50) {
    concerns.push(`Low outcome improvement rate (${outcomeImprovementRate}%) — most reviews do not show progress.`);
  }

  if (educationEngagementRate < 50) {
    concerns.push(`Critical: education engagement below 50% (${educationEngagementRate}%) — children are not engaging with learning.`);
  } else if (educationEngagementRate < 75) {
    concerns.push(`Education engagement needs improvement (${educationEngagementRate}%).`);
  }

  if (averageAttendance < 70) {
    concerns.push(`Critical: average attendance below 70% (${averageAttendance}%) — persistent absence is a safeguarding concern.`);
  } else if (averageAttendance < 85) {
    concerns.push(`Average attendance below target (${averageAttendance}%) — risk of educational disengagement.`);
  }

  if (keyWorkCompletionRate < 50) {
    concerns.push(`Critical: key work session completion below 50% (${keyWorkCompletionRate}%) — children lack consistent keyworker support.`);
  } else if (keyWorkCompletionRate < 75) {
    concerns.push(`Key work completion needs improvement (${keyWorkCompletionRate}%).`);
  }

  if (keyWorkGoalProgressRate < 60 && totalGoals > 0) {
    concerns.push(`Low goal progress rate (${keyWorkGoalProgressRate}%) — key working goals are not translating into outcomes.`);
  }

  if (independenceReadinessAverage < 50 && independence_records.length > 0) {
    concerns.push(`Independence readiness below adequate threshold (${independenceReadinessAverage}/100).`);
  }

  if (outcome_reviews.length === 0 && input.total_children > 0) {
    concerns.push("No outcome reviews recorded — cannot evidence children's progress across life domains.");
  }

  if (education_records.length === 0 && input.total_children > 0) {
    concerns.push("No education records — cannot evidence children's educational progress.");
  }

  if (key_work_sessions.length === 0 && input.total_children > 0) {
    concerns.push("No key working sessions recorded — children lack structured keyworker support.");
  }

  if (independence_records.length === 0 && input.total_children > 0) {
    concerns.push("No independence records — cannot assess children's readiness for adulthood.");
  }

  if (childVoiceCompositeRate < 50 && totalRecords > 0) {
    concerns.push(`Low composite child voice rate (${childVoiceCompositeRate}%) — children's views are insufficiently captured.`);
  }

  if (domainCoverage < 3 && outcome_reviews.length > 0) {
    concerns.push(`Limited domain coverage (${domainCoverage} domains) — holistic assessment requires broader scope.`);
  }

  // Evidence gaps
  if (outcome_reviews.length > 0) {
    const withoutEvidence = outcome_reviews.filter(r => !r.has_evidence).length;
    const evidenceRate = pct(outcome_reviews.length - withoutEvidence, outcome_reviews.length);
    if (evidenceRate < 70) {
      concerns.push(`Only ${evidenceRate}% of outcome reviews have supporting evidence — weakens regulatory evidence base.`);
    }
  }

  // ── Recommendations ──────────────────────────────────────────────────────

  const recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref?: string }[] = [];
  let rank = 0;

  if (educationEngagementRate < 50) {
    recommendations.push({ rank: ++rank, recommendation: "Urgently review education engagement strategy — liaise with Virtual School Head to develop individual support plans.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 8" });
  }

  if (averageAttendance < 70) {
    recommendations.push({ rank: ++rank, recommendation: "Implement attendance improvement plan — consider barriers to attendance and coordinate with school and social worker.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 8" });
  }

  if (keyWorkCompletionRate < 50) {
    recommendations.push({ rank: ++rank, recommendation: "Review key working capacity and scheduling — ensure each child receives consistent weekly keyworker time.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 10" });
  }

  if (outcome_reviews.length === 0 && input.total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Establish outcome review framework covering all seven domains for each child.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" });
  }

  if (outcomeImprovementRate === 0 && outcome_reviews.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Analyse why outcomes are not improving — review targets, interventions, and support plans.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5" });
  }

  if (education_records.length === 0 && input.total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Begin recording education data including attendance, engagement, and PEP status for all children.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 8" });
  }

  if (key_work_sessions.length === 0 && input.total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Implement structured key working sessions with documented goals for all children.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 10" });
  }

  if (independence_records.length === 0 && input.total_children > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Begin independence skills assessments for all children, particularly those approaching transition age.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 7" });
  }

  if (childVoiceCompositeRate < 50 && totalRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Strengthen child voice capture across all recording types — ensure children's views are routinely sought and documented.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 7" });
  }

  if (domainCoverage < 3 && outcome_reviews.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Expand outcome reviews to cover all seven life domains (health, education, emotional, social, independence, identity, family).", urgency: "soon", regulatory_ref: "CHR 2015 Reg 5" });
  }

  if (outcomeImprovementRate > 0 && outcomeImprovementRate < 50) {
    recommendations.push({ rank: ++rank, recommendation: "Review and refresh outcome targets — ensure they are realistic, measurable, and aligned to each child's care plan.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 5" });
  }

  if (educationEngagementRate >= 50 && educationEngagementRate < 75) {
    recommendations.push({ rank: ++rank, recommendation: "Develop targeted education engagement strategies for disengaged children in partnership with schools.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 8" });
  }

  if (averageAttendance >= 70 && averageAttendance < 85) {
    recommendations.push({ rank: ++rank, recommendation: "Review attendance patterns and address barriers for children below 90% attendance.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 8" });
  }

  if (keyWorkCompletionRate >= 50 && keyWorkCompletionRate < 75) {
    recommendations.push({ rank: ++rank, recommendation: "Improve key work session completion through better scheduling and protected staff time.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 10" });
  }

  if (keyWorkGoalProgressRate < 60 && totalGoals > 0 && keyWorkGoalProgressRate > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Review key working goals — ensure they are SMART and linked to care plan objectives.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 10" });
  }

  if (independenceReadinessAverage < 50 && independence_records.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Increase focus on independence skill development — embed practical life skills into daily routines.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 7" });
  }

  if (outcome_reviews.length > 0) {
    const evidenceRate = pct(outcome_reviews.filter(r => r.has_evidence).length, outcome_reviews.length);
    if (evidenceRate < 70) {
      recommendations.push({ rank: ++rank, recommendation: "Improve evidence attachment to outcome reviews — each review should include supporting documentation.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 33" });
    }
  }

  if (rating === "outstanding" || rating === "good") {
    recommendations.push({ rank: ++rank, recommendation: "Continue current holistic approach — consider sharing good practice across the organisation.", urgency: "planned" });
  }

  // ── Insights ─────────────────────────────────────────────────────────────

  const insights: { text: string; severity: "critical" | "warning" | "positive" }[] = [];

  if (educationEngagementRate < 50) {
    insights.push({ text: `Education engagement critically low at ${educationEngagementRate}% — immediate intervention required.`, severity: "critical" });
  }
  if (averageAttendance < 70) {
    insights.push({ text: `Average attendance critically low at ${averageAttendance}% — persistent absence puts children at risk.`, severity: "critical" });
  }
  if (keyWorkCompletionRate < 50) {
    insights.push({ text: `Key work completion critically low at ${keyWorkCompletionRate}% — children lack consistent keyworker support.`, severity: "critical" });
  }
  if (outcomeImprovementRate === 0 && outcome_reviews.length > 0) {
    insights.push({ text: "No children showing improvement in outcome reviews — fundamental concern for Ofsted.", severity: "critical" });
  }
  if (childVoiceCompositeRate < 50 && totalRecords > 0) {
    insights.push({ text: `Child voice composite rate only ${childVoiceCompositeRate}% — Ofsted expects children's views to inform practice.`, severity: "critical" });
  }

  // Missing data type warnings
  if (outcome_reviews.length === 0 && input.total_children > 0) {
    insights.push({ text: "No outcome reviews — cannot evidence holistic progress.", severity: "critical" });
  }
  if (education_records.length === 0 && input.total_children > 0) {
    insights.push({ text: "No education records — educational outcomes untracked.", severity: "critical" });
  }
  if (key_work_sessions.length === 0 && input.total_children > 0) {
    insights.push({ text: "No key working sessions — therapeutic relationships unstructured.", severity: "critical" });
  }
  if (independence_records.length === 0 && input.total_children > 0) {
    insights.push({ text: "No independence records — transition readiness unassessed.", severity: "critical" });
  }

  // Warning-level
  if (educationEngagementRate >= 50 && educationEngagementRate < 75) {
    insights.push({ text: `Education engagement at ${educationEngagementRate}% — below target for good outcomes.`, severity: "warning" });
  }
  if (averageAttendance >= 70 && averageAttendance < 85) {
    insights.push({ text: `Average attendance at ${averageAttendance}% — below expected threshold.`, severity: "warning" });
  }
  if (keyWorkCompletionRate >= 50 && keyWorkCompletionRate < 75) {
    insights.push({ text: `Key work completion at ${keyWorkCompletionRate}% — improvement needed for consistent support.`, severity: "warning" });
  }
  if (outcomeImprovementRate > 0 && outcomeImprovementRate < 50) {
    insights.push({ text: `Outcome improvement rate at ${outcomeImprovementRate}% — majority of reviews not showing progress.`, severity: "warning" });
  }
  if (childVoiceCompositeRate >= 50 && childVoiceCompositeRate < 70) {
    insights.push({ text: `Child voice composite at ${childVoiceCompositeRate}% — needs strengthening across all data types.`, severity: "warning" });
  }
  if (domainCoverage < 3 && outcome_reviews.length > 0) {
    insights.push({ text: `Only ${domainCoverage} outcome domain(s) covered — holistic view requires broader assessment.`, severity: "warning" });
  }
  if (independenceReadinessAverage > 0 && independenceReadinessAverage < 50) {
    insights.push({ text: `Independence readiness average at ${independenceReadinessAverage}/100 — below adequate threshold.`, severity: "warning" });
  }

  // Positive insights
  if (rating === "outstanding") {
    insights.push({ text: "Holistic progress rated outstanding — multi-domain outcomes are consistently strong.", severity: "positive" });
  }
  if (outcomeImprovementRate >= 70) {
    insights.push({ text: `${outcomeImprovementRate}% of outcome reviews show improvement — strong evidence of children making progress.`, severity: "positive" });
  }
  if (childVoiceCompositeRate >= 90) {
    insights.push({ text: `Composite child voice rate at ${childVoiceCompositeRate}% — children's views are central to practice.`, severity: "positive" });
  }
  if (keyWorkCompletionRate >= 90 && keyWorkGoalProgressRate >= 80) {
    insights.push({ text: "Key working is highly effective — both completion and goal progress are strong.", severity: "positive" });
  }
  if (averageAttendance >= 95) {
    insights.push({ text: `Attendance outstanding at ${averageAttendance}% — above national average for looked after children.`, severity: "positive" });
  }
  if (domainCoverage >= 5) {
    insights.push({ text: `${domainCoverage} outcome domains covered — comprehensive holistic assessment in place.`, severity: "positive" });
  }
  if (educationEngagementRate >= 90) {
    insights.push({ text: `Education engagement excellent at ${educationEngagementRate}% — children are actively learning.`, severity: "positive" });
  }

  return {
    progress_rating: rating,
    progress_score: score,
    headline: headline(rating, score, childrenWithData),
    children_with_data: childrenWithData,
    outcome_improvement_rate: outcomeImprovementRate,
    outcome_child_voice_rate: outcomeChildVoiceRate,
    education_engagement_rate: educationEngagementRate,
    average_attendance: averageAttendance,
    key_work_completion_rate: keyWorkCompletionRate,
    key_work_goal_progress_rate: keyWorkGoalProgressRate,
    independence_readiness_average: independenceReadinessAverage,
    domain_coverage: domainCoverage,
    child_voice_composite_rate: childVoiceCompositeRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
