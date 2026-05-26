// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME RESTRICTIVE PRACTICE INTELLIGENCE ENGINE
// Home-level: synthesises restraint data to assess frequency, proportionality,
// de-escalation quality, debrief completion, review compliance, and training.
// CHR 2015 Reg 19, 20. SCCIF: "Safe", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RestraintInput {
  id: string;
  date: string;                              // YYYY-MM-DD
  child_id: string;
  duration_minutes: number;
  staff_count: number;
  all_team_teach_trained: boolean;
  reason: string;                            // imminent_harm_to_others | imminent_harm_to_self | etc.
  de_escalation_count: number;               // number of attempts before restraint
  has_justification: boolean;
  child_debriefed: boolean;
  staff_debriefed: boolean;
  review_status: string;                     // reviewed | pending
  has_injuries: boolean;
  body_map_completed: boolean;
  medical_check_required: boolean;
  medical_check_completed: boolean;
}

export interface HomeRestrictivePracticeInput {
  today: string;
  total_children: number;
  child_ids: string[];
  restraints: RestraintInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RestrictivePracticeRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RestraintProfile {
  total_restraints_90d: number;
  avg_duration: number;
  max_duration: number;
  child_debrief_rate: number;
  staff_debrief_rate: number;
  review_completion_rate: number;            // % reviewed (not pending)
  pending_reviews: number;
  body_map_rate: number;
  de_escalation_rate: number;                // % with 2+ attempts
  training_compliance_rate: number;          // % with all staff trained
  injury_count: number;
  children_restrained: string[];
  repeat_children: string[];
}

export interface RestrictiveInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface RestrictiveRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeRestrictivePracticeResult {
  restrictive_rating: RestrictivePracticeRating;
  restrictive_score: number;
  headline: string;
  restraint_profile: RestraintProfile;
  strengths: string[];
  concerns: string[];
  recommendations: RestrictiveRecommendation[];
  insights: RestrictiveInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): RestrictivePracticeRating {
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

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeRestrictivePractice(
  input: HomeRestrictivePracticeInput,
): HomeRestrictivePracticeResult {
  const { today, child_ids, restraints } = input;

  const r90d = restraints.filter(r => daysBetween(r.date, today) <= 90);

  // Zero restraints = outstanding
  if (r90d.length === 0) {
    return {
      restrictive_rating: "outstanding",
      restrictive_score: 90,
      headline: "No restraints in 90 days — excellent de-escalation practice.",
      restraint_profile: emptyProfile(),
      strengths: ["No restraints in the past 90 days — evidence of effective de-escalation and proactive behaviour support."],
      concerns: [],
      recommendations: [],
      insights: [{ text: "Zero restraints is an outstanding indicator. This suggests the home's behaviour management strategies and de-escalation approaches are highly effective.", severity: "positive" }],
    };
  }

  // ── Restraint Profile ─────────────────────────────────────────────────
  const durations = r90d.map(r => r.duration_minutes);
  const avgDuration = Math.round(durations.reduce((s, d) => s + d, 0) / durations.length);
  const maxDuration = Math.max(...durations);

  const childDebriefed = r90d.filter(r => r.child_debriefed).length;
  const childDebriefRate = Math.round((childDebriefed / r90d.length) * 100);

  const staffDebriefed = r90d.filter(r => r.staff_debriefed).length;
  const staffDebriefRate = Math.round((staffDebriefed / r90d.length) * 100);

  const reviewed = r90d.filter(r => r.review_status === "reviewed").length;
  const reviewRate = Math.round((reviewed / r90d.length) * 100);
  const pendingReviews = r90d.filter(r => r.review_status === "pending").length;

  const bodyMapDone = r90d.filter(r => r.body_map_completed).length;
  const bodyMapRate = Math.round((bodyMapDone / r90d.length) * 100);

  const withDeEscalation = r90d.filter(r => r.de_escalation_count >= 2).length;
  const deEscRate = Math.round((withDeEscalation / r90d.length) * 100);

  const allTrained = r90d.filter(r => r.all_team_teach_trained).length;
  const trainingRate = Math.round((allTrained / r90d.length) * 100);

  const injuryCount = r90d.filter(r => r.has_injuries).length;

  const childrenRestrained = [...new Set(r90d.map(r => r.child_id))];
  const childCounts: Record<string, number> = {};
  for (const r of r90d) childCounts[r.child_id] = (childCounts[r.child_id] || 0) + 1;
  const repeatChildren = Object.entries(childCounts).filter(([, c]) => c >= 2).map(([id]) => id);

  const profile: RestraintProfile = {
    total_restraints_90d: r90d.length,
    avg_duration: avgDuration,
    max_duration: maxDuration,
    child_debrief_rate: childDebriefRate,
    staff_debrief_rate: staffDebriefRate,
    review_completion_rate: reviewRate,
    pending_reviews: pendingReviews,
    body_map_rate: bodyMapRate,
    de_escalation_rate: deEscRate,
    training_compliance_rate: trainingRate,
    injury_count: injuryCount,
    children_restrained: childrenRestrained,
    repeat_children: repeatChildren,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 55;

  // Volume (±10) — fewer is better
  if (r90d.length <= 2) score += 5;
  else if (r90d.length <= 5) score += 0;
  else score -= 5;

  // De-escalation (±8)
  if (deEscRate === 100) score += 5;
  else if (deEscRate >= 80) score += 2;
  else score -= 5;

  // Child debrief (±6)
  if (childDebriefRate === 100) score += 4;
  else if (childDebriefRate >= 80) score += 2;
  else score -= 4;

  // Staff debrief (±4)
  if (staffDebriefRate === 100) score += 3;
  else if (staffDebriefRate >= 80) score += 1;
  else score -= 2;

  // Review (±6)
  if (reviewRate === 100) score += 4;
  else if (pendingReviews > 0) score -= 4;

  // Body map (±4)
  if (bodyMapRate === 100) score += 3;
  else score -= 2;

  // Training (±4)
  if (trainingRate === 100) score += 3;
  else score -= 3;

  // Duration (±4) — shorter is better
  if (avgDuration <= 3) score += 2;
  else if (avgDuration > 10) score -= 3;

  // Injuries (±4)
  if (injuryCount === 0) score += 2;
  else score -= 3;

  // Repeat (±3)
  if (repeatChildren.length > 0) score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (r90d.length <= 2) strengths.push(`Only ${r90d.length} restraint${r90d.length === 1 ? "" : "s"} in 90 days — low use of restrictive practice.`);
  if (deEscRate === 100) strengths.push("De-escalation attempted before every restraint — evidence of least restrictive practice.");
  if (childDebriefRate === 100) strengths.push("All children debriefed after restraint — therapeutic aftercare in place.");
  if (trainingRate === 100) strengths.push("All restraints conducted by Team Teach trained staff — safe practice assured.");
  if (bodyMapRate === 100) strengths.push("Body maps completed for every restraint — comprehensive documentation.");
  if (injuryCount === 0) strengths.push("No injuries during any restraint — techniques applied safely.");
  if (avgDuration <= 3) strengths.push(`Average duration ${avgDuration} minutes — restraints are brief and proportionate.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (pendingReviews > 0) concerns.push(`${pendingReviews} restraint${pendingReviews > 1 ? "s" : ""} pending review — all restraints must be reviewed promptly.`);
  if (childDebriefRate < 80) concerns.push(`Child debrief rate is ${childDebriefRate}% — every child should be debriefed after a restraint.`);
  if (deEscRate < 80) concerns.push(`De-escalation attempted in only ${deEscRate}% of restraints — less restrictive options must always be tried first.`);
  if (injuryCount > 0) concerns.push(`${injuryCount} restraint${injuryCount > 1 ? "s" : ""} involved injuries — techniques and proportionality need reviewing.`);
  if (repeatChildren.length > 0) concerns.push(`${repeatChildren.length} child${repeatChildren.length > 1 ? "ren" : ""} restrained multiple times — BSP effectiveness needs assessment.`);
  if (maxDuration > 10) concerns.push(`Longest restraint was ${maxDuration} minutes — extended restraints require particularly robust justification.`);
  if (trainingRate < 100) concerns.push(`Only ${trainingRate}% of restraints by fully trained staff — all staff involved must be trained.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: RestrictiveRecommendation[] = [];
  let rank = 1;

  if (pendingReviews > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${pendingReviews} pending restraint review${pendingReviews > 1 ? "s" : ""} — all restraints must be reviewed by the RM within 24 hours.`, urgency: "immediate", regulatory_ref: "Reg 20" });
  }
  if (childDebriefRate < 100) {
    recs.push({ rank: rank++, recommendation: "Ensure every child is debriefed after a restraint — this is essential for therapeutic recovery.", urgency: "immediate", regulatory_ref: "Reg 19" });
  }
  if (deEscRate < 100) {
    recs.push({ rank: rank++, recommendation: "Document all de-escalation attempts before any restraint — evidence of least restrictive approach is required.", urgency: "soon", regulatory_ref: "Reg 19" });
  }
  if (repeatChildren.length > 0) {
    recs.push({ rank: rank++, recommendation: `Review BSPs for ${repeatChildren.length} child${repeatChildren.length > 1 ? "ren" : ""} restrained multiple times — strategies may need updating.`, urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (trainingRate < 100) {
    recs.push({ rank: rank++, recommendation: "Ensure all staff involved in restraints are Team Teach (or equivalent) trained.", urgency: "soon", regulatory_ref: "Reg 20" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: RestrictiveInsight[] = [];

  if (injuryCount > 0) {
    insights.push({ text: `${injuryCount} restraint${injuryCount > 1 ? "s" : ""} involved injuries. Ofsted will examine whether techniques were proportionate and whether staff training is adequate.`, severity: "critical" });
  }
  if (pendingReviews > 0) {
    insights.push({ text: `${pendingReviews} restraint${pendingReviews > 1 ? "s" : ""} not yet reviewed. Ofsted expects every restraint to be reviewed promptly by the Registered Manager.`, severity: "critical" });
  }
  if (repeatChildren.length > 0) {
    insights.push({ text: `${repeatChildren.length} child${repeatChildren.length > 1 ? "ren" : ""} restrained multiple times. Ofsted will assess whether the home is learning from incidents and adapting care plans.`, severity: "warning" });
  }
  if (deEscRate === 100 && r90d.length > 0) {
    insights.push({ text: "De-escalation documented before every restraint. This evidences a least restrictive practice approach — Ofsted's key expectation.", severity: "positive" });
  }
  if (childDebriefRate === 100 && r90d.length > 0) {
    insights.push({ text: "All children debriefed after restraint. This demonstrates therapeutically informed aftercare and respect for children's wellbeing.", severity: "positive" });
  }
  if (trainingRate === 100 && r90d.length > 0) {
    insights.push({ text: "All restraints by trained staff. This demonstrates safe practice and investment in staff competence.", severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding restrictive practice management — ${r90d.length} restraint${r90d.length === 1 ? "" : "s"} with full de-escalation, debrief, and review compliance.`;
  } else if (rating === "good") {
    headline = `Good restrictive practice management — ${r90d.length} restraint${r90d.length === 1 ? "" : "s"} in 90 days with ${deEscRate}% de-escalation compliance.`;
  } else if (rating === "adequate") {
    headline = "Adequate restrictive practice — improvements needed in reviews, debriefs, or de-escalation documentation.";
  } else {
    headline = "Restrictive practice is inadequate — significant gaps in reviews, debriefs, or staff training.";
  }

  return {
    restrictive_rating: rating,
    restrictive_score: score,
    headline,
    restraint_profile: profile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profile ───────────────────────────────────────────────────────────

function emptyProfile(): RestraintProfile {
  return {
    total_restraints_90d: 0, avg_duration: 0, max_duration: 0,
    child_debrief_rate: 100, staff_debrief_rate: 100,
    review_completion_rate: 100, pending_reviews: 0,
    body_map_rate: 100, de_escalation_rate: 100,
    training_compliance_rate: 100, injury_count: 0,
    children_restrained: [], repeat_children: [],
  };
}
