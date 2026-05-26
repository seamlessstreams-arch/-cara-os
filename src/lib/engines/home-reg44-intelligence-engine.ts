// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME REG 44 VISITS INTELLIGENCE ENGINE
// Home-level: analyses Regulation 44 independent visitor reports to assess
// visit frequency, recommendation completion, action plan compliance, child
// voice capture, Ofsted notification timeliness, and quality trends.
// CHR 2015 Reg 44. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface Reg44RecInput {
  id: string;
  recommendation: string;
  priority: string;                            // low | medium | high
  status: string;                              // completed | in_progress | outstanding
}

export interface Reg44VisitInput {
  id: string;
  visit_date: string;
  visitor: string;
  duration_hours: number;
  children_spoken_count: number;
  total_children: number;
  staff_spoken: number;
  records_reviewed_count: number;
  overall_judgement: string;
  strengths_count: number;
  areas_for_development_count: number;
  recommendations: Reg44RecInput[];
  previous_actions_completed: boolean;
  report_sent_to_ofsted: boolean;
  report_sent_date: string;
}

export interface Reg44ActionInput {
  id: string;
  visit_ref: string;
  priority: string;                            // low | medium | high | critical
  status: string;                              // completed | in_progress | outstanding | overdue | carried_forward
  due_date: string;
  carried_forward_count: number;
}

export interface HomeReg44Input {
  today: string;
  total_children: number;
  visits: Reg44VisitInput[];
  action_records: Reg44ActionInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type Reg44Rating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface VisitFrequencyProfile {
  total_visits_12m: number;
  visits_90d: number;
  expected_visits_12m: number;
  gap_days_largest: number;
  monthly_compliance: boolean;
}

export interface RecommendationProfile {
  total_recommendations: number;
  completed: number;
  in_progress: number;
  outstanding: number;
  completion_rate: number;
  high_priority_outstanding: number;
}

export interface ActionPlanProfile {
  total_actions: number;
  completed: number;
  overdue: number;
  carried_forward: number;
  completion_rate: number;
  overdue_high_critical: number;
}

export interface QualityProfile {
  avg_duration_hours: number;
  avg_children_spoken_pct: number;
  avg_records_reviewed: number;
  ofsted_notification_rate: number;
  child_voice_every_visit: boolean;
  judgement_trend: string;                      // improving | stable | declining
}

export interface Reg44Insight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface Reg44Recommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeReg44Result {
  reg44_rating: Reg44Rating;
  reg44_score: number;
  headline: string;
  visit_frequency_profile: VisitFrequencyProfile;
  recommendation_profile: RecommendationProfile;
  action_plan_profile: ActionPlanProfile;
  quality_profile: QualityProfile;
  strengths: string[];
  concerns: string[];
  recommendations: Reg44Recommendation[];
  insights: Reg44Insight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): Reg44Rating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000,
  );
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeReg44(
  input: HomeReg44Input,
): HomeReg44Result {
  const { today, total_children, visits, action_records } = input;

  // Insufficient data
  if (visits.length === 0) {
    return {
      reg44_rating: "insufficient_data",
      reg44_score: 0,
      headline: "No Regulation 44 visit reports available.",
      visit_frequency_profile: emptyVisitProfile(),
      recommendation_profile: emptyRecProfile(),
      action_plan_profile: emptyActionProfile(),
      quality_profile: emptyQualityProfile(),
      strengths: [],
      concerns: ["No Reg 44 visit data found. Independent person visits must occur monthly."],
      recommendations: [{ rank: 1, recommendation: "Schedule and complete a Reg 44 independent person visit immediately — monthly visits are a statutory requirement.", urgency: "immediate", regulatory_ref: "Reg 44" }],
      insights: [{ text: "No Reg 44 visit data exists. Ofsted will view absence of independent monitoring as a significant leadership failure. Monthly visits are a non-negotiable statutory requirement.", severity: "critical" }],
    };
  }

  // Sort visits by date descending
  const sorted = [...visits].sort((a, b) => b.visit_date.localeCompare(a.visit_date));

  // ── Visit Frequency Profile ─────────────────────────────────────────
  const visits12m = sorted.filter(v => daysBetween(v.visit_date, today) <= 365);
  const visits90d = sorted.filter(v => daysBetween(v.visit_date, today) <= 90);

  // Largest gap between consecutive visits (or from today to most recent)
  let largestGap = daysBetween(today, sorted[0].visit_date);
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = daysBetween(sorted[i].visit_date, sorted[i + 1].visit_date);
    if (gap > largestGap) largestGap = gap;
  }
  largestGap = Math.round(largestGap);

  // Monthly compliance: should be at least 1 visit per calendar month in last 12m
  // Simplified: 12 visits in 12m = compliant
  const monthlyCompliance = visits12m.length >= 12;

  const freqProfile: VisitFrequencyProfile = {
    total_visits_12m: visits12m.length,
    visits_90d: visits90d.length,
    expected_visits_12m: 12,
    gap_days_largest: largestGap,
    monthly_compliance: monthlyCompliance,
  };

  // ── Recommendation Profile ──────────────────────────────────────────
  // Aggregate all recommendations from all visits
  const allRecs = sorted.flatMap(v => v.recommendations);
  const completedRecs = allRecs.filter(r => r.status === "completed").length;
  const inProgressRecs = allRecs.filter(r => r.status === "in_progress").length;
  const outstandingRecs = allRecs.filter(r => r.status === "outstanding").length;
  const highPriorityOutstanding = allRecs.filter(r => r.priority === "high" && r.status === "outstanding").length;
  const recCompletionRate = pct(completedRecs, allRecs.length);

  const recProfile: RecommendationProfile = {
    total_recommendations: allRecs.length,
    completed: completedRecs,
    in_progress: inProgressRecs,
    outstanding: outstandingRecs,
    completion_rate: recCompletionRate,
    high_priority_outstanding: highPriorityOutstanding,
  };

  // ── Action Plan Profile ─────────────────────────────────────────────
  const completedActions = action_records.filter(a => a.status === "completed").length;
  const overdueActions = action_records.filter(a => a.status === "overdue" || (a.status !== "completed" && a.due_date < today)).length;
  const carriedForward = action_records.filter(a => a.carried_forward_count > 0).length;
  const overdueHighCritical = action_records.filter(a =>
    (a.priority === "high" || a.priority === "critical") &&
    (a.status === "overdue" || (a.status !== "completed" && a.due_date < today))
  ).length;
  const actionCompletionRate = pct(completedActions, action_records.length);

  const actionProfile: ActionPlanProfile = {
    total_actions: action_records.length,
    completed: completedActions,
    overdue: overdueActions,
    carried_forward: carriedForward,
    completion_rate: actionCompletionRate,
    overdue_high_critical: overdueHighCritical,
  };

  // ── Quality Profile ─────────────────────────────────────────────────
  const avgDuration = visits.length > 0
    ? Math.round((visits.reduce((a, v) => a + v.duration_hours, 0) / visits.length) * 10) / 10
    : 0;

  const childSpokenPcts = visits.map(v =>
    v.total_children > 0 ? pct(v.children_spoken_count, v.total_children) : 0,
  );
  const avgChildSpoken = childSpokenPcts.length > 0
    ? Math.round(childSpokenPcts.reduce((a, b) => a + b, 0) / childSpokenPcts.length)
    : 0;

  const avgRecordsReviewed = visits.length > 0
    ? Math.round((visits.reduce((a, v) => a + v.records_reviewed_count, 0) / visits.length) * 10) / 10
    : 0;

  const sentToOfsted = visits.filter(v => v.report_sent_to_ofsted).length;
  const ofstedRate = pct(sentToOfsted, visits.length);

  const childVoiceEvery = visits.every(v => v.children_spoken_count > 0);

  // Judgement trend: compare last 2 visits' overall_judgement
  let judgementTrend: string = "stable";
  if (sorted.length >= 2) {
    const j0 = judgeScore(sorted[0].overall_judgement);
    const j1 = judgeScore(sorted[1].overall_judgement);
    if (j0 > j1) judgementTrend = "improving";
    else if (j0 < j1) judgementTrend = "declining";
  }

  const qualProfile: QualityProfile = {
    avg_duration_hours: avgDuration,
    avg_children_spoken_pct: avgChildSpoken,
    avg_records_reviewed: avgRecordsReviewed,
    ofsted_notification_rate: ofstedRate,
    child_voice_every_visit: childVoiceEvery,
    judgement_trend: judgementTrend,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 50;

  // 1. Visit frequency (±6)
  if (visits12m.length >= 12) score += 6;
  else if (visits12m.length >= 10) score += 3;
  else if (visits12m.length >= 6) score -= 2;
  else score -= 5;

  // 2. Largest gap (±4)
  if (largestGap <= 35) score += 4;
  else if (largestGap <= 45) score += 2;
  else score -= 4;

  // 3. Recommendation completion (±5)
  if (allRecs.length > 0) {
    if (recCompletionRate >= 80) score += 5;
    else if (recCompletionRate >= 60) score += 2;
    else score -= 3;
  }

  // 4. High priority outstanding (±3)
  if (highPriorityOutstanding === 0) score += 3;
  else score -= 3;

  // 5. Action plan overdue (±4)
  if (action_records.length > 0) {
    if (overdueActions === 0) score += 4;
    else if (overdueActions <= 2) score += 1;
    else score -= 4;
  }

  // 6. Ofsted notification rate (±3)
  if (ofstedRate === 100) score += 3;
  else if (ofstedRate >= 80) score += 1;
  else score -= 3;

  // 7. Child voice capture (±3)
  if (childVoiceEvery) score += 3;
  else if (avgChildSpoken >= 80) score += 1;
  else score -= 2;

  // 8. Visit quality — duration (±2)
  if (avgDuration >= 3) score += 2;
  else if (avgDuration >= 2) score += 1;
  else score -= 1;

  // 9. Judgement trend (±2)
  if (judgementTrend === "improving") score += 2;
  else if (judgementTrend === "declining") score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (monthlyCompliance) strengths.push("Monthly Reg 44 visits achieved — statutory requirement met consistently.");
  if (largestGap <= 35) strengths.push(`No gap exceeds ${largestGap} days — visit schedule is well-maintained.`);
  if (recCompletionRate >= 80 && allRecs.length > 0) strengths.push(`${recCompletionRate}% of visitor recommendations completed — demonstrates responsive management.`);
  if (ofstedRate === 100) strengths.push("All visit reports sent to Ofsted — notification compliance is exemplary.");
  if (childVoiceEvery) strengths.push("Children spoken to at every visit — their voice is central to independent monitoring.");
  if (overdueActions === 0 && action_records.length > 0) strengths.push("No overdue actions from Reg 44 visits — action plan management is thorough.");
  if (judgementTrend === "improving") strengths.push("Visitor judgements show an improving trend — quality of care is progressing positively.");
  if (avgDuration >= 3) strengths.push(`Average visit duration ${avgDuration} hours — visits are thorough and comprehensive.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (visits12m.length < 12) concerns.push(`Only ${visits12m.length} visits in 12 months — Reg 44 requires monthly visits (12 per year).`);
  if (largestGap > 45) concerns.push(`Largest gap between visits is ${largestGap} days — visits should occur at least monthly.`);
  if (highPriorityOutstanding > 0) concerns.push(`${highPriorityOutstanding} high-priority recommendation${highPriorityOutstanding > 1 ? "s" : ""} outstanding — these require urgent attention.`);
  if (overdueHighCritical > 0) concerns.push(`${overdueHighCritical} high/critical action${overdueHighCritical > 1 ? "s" : ""} overdue — management must respond promptly to visitor findings.`);
  if (ofstedRate < 100) concerns.push(`Ofsted notification rate is ${ofstedRate}% — all Reg 44 reports must be sent to Ofsted.`);
  if (!childVoiceEvery) concerns.push("Children not spoken to at every visit — the child's voice must be central to independent monitoring.");
  if (carriedForward > 0) concerns.push(`${carriedForward} action${carriedForward > 1 ? "s" : ""} carried forward from previous visits — recurring issues indicate insufficient management response.`);
  if (judgementTrend === "declining") concerns.push("Visitor judgements show a declining trend — quality of care requires attention.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: Reg44Recommendation[] = [];
  let rank = 1;

  if (visits12m.length < 12) {
    recs.push({ rank: rank++, recommendation: `Schedule visits to achieve monthly frequency — ${12 - visits12m.length} additional visit${(12 - visits12m.length) > 1 ? "s" : ""} needed this year.`, urgency: visits12m.length < 6 ? "immediate" : "soon", regulatory_ref: "Reg 44" });
  }
  if (highPriorityOutstanding > 0) {
    recs.push({ rank: rank++, recommendation: `Address ${highPriorityOutstanding} outstanding high-priority recommendation${highPriorityOutstanding > 1 ? "s" : ""} from visitor reports.`, urgency: "immediate", regulatory_ref: "Reg 44" });
  }
  if (overdueHighCritical > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdueHighCritical} overdue high/critical action${overdueHighCritical > 1 ? "s" : ""} from Reg 44 action plans.`, urgency: "immediate", regulatory_ref: "Reg 44" });
  }
  if (ofstedRate < 100) {
    recs.push({ rank: rank++, recommendation: "Ensure all Reg 44 reports are sent to Ofsted within the required timeframe.", urgency: "soon", regulatory_ref: "Reg 44" });
  }
  if (!childVoiceEvery) {
    recs.push({ rank: rank++, recommendation: "Ensure the independent visitor speaks to all children at every visit — consider scheduling visits when all children are present.", urgency: "soon", regulatory_ref: "Reg 44" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Reg44Insight[] = [];

  if (visits12m.length < 10) {
    insights.push({ text: `Only ${visits12m.length} Reg 44 visit${visits12m.length !== 1 ? "s" : ""} in 12 months. Ofsted expects monthly independent monitoring — gaps signal weak governance and will be scrutinised at inspection.`, severity: "critical" });
  }
  if (overdueHighCritical > 0) {
    insights.push({ text: `${overdueHighCritical} high/critical Reg 44 action${overdueHighCritical > 1 ? "s" : ""} overdue. Ofsted expects the Registered Manager to respond promptly to all independent visitor findings. Overdue actions indicate poor management oversight.`, severity: "critical" });
  }
  if (judgementTrend === "declining") {
    insights.push({ text: "Visitor judgements are declining. Ofsted will view worsening independent assessments as evidence that management is not addressing identified issues.", severity: "warning" });
  }
  if (monthlyCompliance && recCompletionRate >= 80 && ofstedRate === 100) {
    insights.push({ text: `Monthly visits achieved with ${recCompletionRate}% recommendation completion and full Ofsted notification. This demonstrates strong governance and responsiveness to independent monitoring — a hallmark of outstanding leadership.`, severity: "positive" });
  }
  if (childVoiceEvery && avgChildSpoken >= 80) {
    insights.push({ text: `Children spoken to at every visit with ${avgChildSpoken}% average engagement. The child's voice is embedded in the independent monitoring process — Ofsted's key expectation.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding Reg 44 compliance — ${visits12m.length} visits in 12 months with ${recCompletionRate}% recommendation completion.`;
  } else if (rating === "good") {
    headline = `Good Reg 44 compliance — consistent visiting with ${recCompletionRate}% recommendation completion.`;
  } else if (rating === "adequate") {
    headline = "Adequate Reg 44 compliance — gaps in visit frequency, recommendation follow-up, or Ofsted notification need addressing.";
  } else {
    headline = "Reg 44 compliance is inadequate — significant gaps in visit frequency, action completion, or independent monitoring quality.";
  }

  return {
    reg44_rating: rating,
    reg44_score: score,
    headline,
    visit_frequency_profile: freqProfile,
    recommendation_profile: recProfile,
    action_plan_profile: actionProfile,
    quality_profile: qualProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Judge Score Helper ────────────────────────────────────────────────────

function judgeScore(judgement: string): number {
  const lower = judgement.toLowerCase();
  if (lower.includes("outstanding") || lower.includes("notable practice")) return 4;
  if (lower.includes("good")) return 3;
  if (lower.includes("requires improvement") || lower.includes("adequate")) return 2;
  if (lower.includes("inadequate") || lower.includes("serious concern")) return 1;
  return 3; // default to "good" if unrecognised
}

// ── Empty Profiles ────────────────────────────────────────────────────────

function emptyVisitProfile(): VisitFrequencyProfile {
  return {
    total_visits_12m: 0, visits_90d: 0, expected_visits_12m: 12,
    gap_days_largest: 0, monthly_compliance: false,
  };
}

function emptyRecProfile(): RecommendationProfile {
  return {
    total_recommendations: 0, completed: 0, in_progress: 0,
    outstanding: 0, completion_rate: 0, high_priority_outstanding: 0,
  };
}

function emptyActionProfile(): ActionPlanProfile {
  return {
    total_actions: 0, completed: 0, overdue: 0,
    carried_forward: 0, completion_rate: 0, overdue_high_critical: 0,
  };
}

function emptyQualityProfile(): QualityProfile {
  return {
    avg_duration_hours: 0, avg_children_spoken_pct: 0,
    avg_records_reviewed: 0, ofsted_notification_rate: 0,
    child_voice_every_visit: false, judgement_trend: "stable",
  };
}
