// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PEP EDUCATION QUALITY INTELLIGENCE ENGINE
// Pure deterministic engine: Personal Education Plan (PEP) timeliness, attendance,
// exclusion rates, target progress, pupil premium usage, child/carer voice,
// and action completion tracking.
// CHR 2015 Reg 8: "The education standard." SCCIF: Education.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PepRecordInput {
  id: string;
  child_id: string;
  status: string; // "current"|"review_due"|"overdue"|"draft"
  attendance: number; // percentage 0-100
  exclusions: number;
  exclusion_days: number;
  target_count: number;
  targets_on_track_count: number;
  targets_exceeded_count: number;
  has_child_views: boolean;
  has_carer_views: boolean;
  actions_total: number;
  actions_completed: number;
  pupil_premium_allocated: number;
  pupil_premium_spent: number;
  has_sen: boolean;
}

export interface PepEducationQualityInput {
  today: string;
  total_children: number;
  peps: PepRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PepEducationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PepEducationResult {
  pep_rating: PepEducationRating;
  pep_score: number;
  headline: string;
  total_peps: number;
  children_with_pep_rate: number;
  current_rate: number;
  average_attendance: number;
  exclusion_rate: number;
  target_progress_rate: number;
  action_completion_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PepEducationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computePepEducationQuality(
  input: PepEducationQualityInput,
): PepEducationResult {
  const { peps, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      pep_rating: "insufficient_data",
      pep_score: 0,
      headline: "No data available for PEP education quality analysis",
      total_peps: 0,
      children_with_pep_rate: 0,
      current_rate: 0,
      average_attendance: 0,
      exclusion_rate: 0,
      target_progress_rate: 0,
      action_completion_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = peps.length;

  const uniqueChildren = new Set(peps.map(p => p.child_id)).size;
  const childrenWithPepRate = pct(uniqueChildren, total_children);

  const current = peps.filter(p => p.status === "current").length;
  const currentRate = pct(current, total);

  const totalAttendance = peps.reduce((sum, p) => sum + p.attendance, 0);
  const averageAttendance = total === 0 ? 0 : Math.round(totalAttendance / total);

  const withExclusions = peps.filter(p => p.exclusions > 0).length;
  const exclusionRate = pct(withExclusions, total);

  const totalTargets = peps.reduce((sum, p) => sum + p.target_count, 0);
  const onTrackOrExceeded = peps.reduce((sum, p) => sum + p.targets_on_track_count + p.targets_exceeded_count, 0);
  const targetProgressRate = pct(onTrackOrExceeded, totalTargets);

  const totalActions = peps.reduce((sum, p) => sum + p.actions_total, 0);
  const completedActions = peps.reduce((sum, p) => sum + p.actions_completed, 0);
  const actionCompletionRate = pct(completedActions, totalActions);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Children with PEP (coverage)
  if (total === 0) {
    score -= 3;
  } else {
    if (childrenWithPepRate >= 90) score += 6;
    else if (childrenWithPepRate >= 60) score += 2;
    else if (childrenWithPepRate < 40) score -= 5;
  }

  // Modifier 2: PEP currency (current status)
  if (total === 0) {
    // no adjustment
  } else {
    if (currentRate >= 80) score += 5;
    else if (currentRate >= 50) score += 2;
    else if (currentRate < 30) score -= 5;
  }

  // Modifier 3: Average attendance
  if (total === 0) {
    score -= 1;
  } else {
    if (averageAttendance >= 95) score += 5;
    else if (averageAttendance >= 85) score += 2;
    else if (averageAttendance < 75) score -= 4;
  }

  // Modifier 4: Target progress
  if (total === 0) {
    // no adjustment
  } else if (totalTargets === 0 && total > 0) {
    score += 2; // No targets set but PEPs exist — neutral
  } else {
    if (targetProgressRate >= 75) score += 5;
    else if (targetProgressRate >= 50) score += 2;
    else if (targetProgressRate < 30) score -= 4;
  }

  // Modifier 5: Action completion
  if (total === 0) {
    score -= 1;
  } else if (totalActions === 0 && total > 0) {
    score += 2; // No actions recorded but PEPs exist — neutral
  } else {
    if (actionCompletionRate >= 80) score += 4;
    else if (actionCompletionRate >= 50) score += 1;
    else if (actionCompletionRate < 30) score -= 4;
  }

  // Modifier 6: Child voice in PEPs
  if (total === 0) {
    score -= 2;
  } else {
    const withChildViews = peps.filter(p => p.has_child_views).length;
    const childViewRate = pct(withChildViews, total);
    if (childViewRate >= 80) score += 5;
    else if (childViewRate >= 50) score += 2;
    else if (childViewRate < 30) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "PEP quality is outstanding — education targets are ambitious, progress is strong and children's voices are central";
      break;
    case "good":
      headline = "Good PEP practice with up-to-date plans, strong attendance and effective target tracking";
      break;
    case "adequate":
      headline = "PEPs exist but currency, target progress and action follow-through need strengthening";
      break;
    case "inadequate":
      headline = "PEP education quality is inadequate — children's education plans are not being effectively managed";
      break;
    default:
      headline = "No data available for PEP education quality analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (childrenWithPepRate >= 90 && total > 0) strengths.push("All children have Personal Education Plans — comprehensive education oversight");
  if (currentRate >= 80 && total > 0) strengths.push("PEPs are overwhelmingly current and up to date");
  if (averageAttendance >= 95 && total > 0) strengths.push("School attendance across the home is excellent — above 95%");
  if (targetProgressRate >= 75 && totalTargets > 0) strengths.push("Education targets are on track or exceeded for most children");
  if (actionCompletionRate >= 80 && totalActions > 0) strengths.push("PEP actions are consistently completed — strong follow-through");
  const childViewPct = total > 0 ? pct(peps.filter(p => p.has_child_views).length, total) : 0;
  if (childViewPct >= 80 && total > 0) strengths.push("Children's own educational aspirations and views are captured in their PEPs");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No PEP records — children's education plans are not being documented");
  if (childrenWithPepRate < 40 && total > 0) concerns.push("Most children do not have a PEP — education planning is critically incomplete");
  if (currentRate < 30 && total > 0) concerns.push("Most PEPs are overdue or in draft — plans are not current");
  if (averageAttendance < 75 && total > 0) concerns.push("Average attendance is below 75% — persistent absence is a significant concern");
  if (targetProgressRate < 30 && totalTargets > 0) concerns.push("Very few education targets are on track — children are not making expected progress");
  if (actionCompletionRate < 30 && totalActions > 0) concerns.push("PEP actions are rarely completed — accountability is poor");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: PepEducationResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Ensure every child has a Personal Education Plan and establish termly review cycles", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 8" });
  }
  if (childrenWithPepRate < 60 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Prioritise creating PEPs for children who currently lack one", urgency: "immediate", regulatory_ref: "SCCIF Education" });
  }
  if (currentRate < 50 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Schedule PEP reviews to bring overdue and draft plans up to date", urgency: "soon", regulatory_ref: "CHR 2015 Reg 8" });
  }
  if (averageAttendance < 85 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Implement attendance improvement strategies with designated teachers and virtual school", urgency: "soon", regulatory_ref: "SCCIF Education" });
  }
  if (targetProgressRate < 50 && totalTargets > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Review education targets with schools to ensure they are realistic and adequately supported", urgency: "planned", regulatory_ref: "CHR 2015 Reg 8" });
  }
  if (exclusionRate >= 30 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Work with schools to reduce exclusions through managed moves, restorative practice and early intervention", urgency: "soon", regulatory_ref: "SCCIF Education" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: PepEducationResult["insights"] = [];

  if (childrenWithPepRate >= 90 && currentRate >= 80 && averageAttendance >= 95 && total >= 10) {
    insights.push({ text: "Education quality is exemplary — every child has a current PEP, attendance is excellent and targets are being met", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No PEP records means Ofsted cannot verify how children's educational attainment is being supported", severity: "critical" });
  }
  if (averageAttendance < 75 && total > 0) {
    insights.push({ text: "Persistent absence is a major concern — without regular attendance, children cannot make educational progress", severity: "warning" });
  }
  if (averageAttendance >= 95 && total > 0) {
    insights.push({ text: "Excellent attendance rates demonstrate the home prioritises education and supports children to attend school", severity: "positive" });
  }
  if (exclusionRate >= 30 && total > 0) {
    insights.push({ text: "High exclusion rates suggest children may need additional behaviour support and school advocacy", severity: "warning" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    pep_rating: rating,
    pep_score: score,
    headline,
    total_peps: total,
    children_with_pep_rate: childrenWithPepRate,
    current_rate: currentRate,
    average_attendance: averageAttendance,
    exclusion_rate: exclusionRate,
    target_progress_rate: targetProgressRate,
    action_completion_rate: actionCompletionRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
