// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME AGENCY STAFF MANAGEMENT INTELLIGENCE ENGINE
// Pure deterministic engine: agency shift vetting, induction quality,
// feedback oversight, safeguarding briefing compliance, concern management.
// CHR 2015 Reg 32: "Fitness of workers." SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AgencyShiftInput {
  id: string;
  worker_name: string;
  worker_ref: string;
  booking_reason: string;
  vetting_status: string; // "fully_vetted"|"partially_vetted"|"pending"|"expired"
  dbs_enhanced: boolean;
  induction_completed: boolean;
  safeguarding_briefing: boolean;
  young_people_briefing: boolean;
  feedback_score: number | null;
  has_concerns: boolean;
}

export interface AgencyInductionInput {
  id: string;
  agency_staff_name: string;
  dbs_verified: boolean;
  training_verified: boolean;
  references_verified: boolean;
  children_informed: boolean;
  behaviour_plans_briefed: boolean;
  induction_pack_signed: boolean;
  topics_covered_count: number;
  topics_total_count: number;
  repeat_booking_approved: boolean;
}

export interface AgencyFeedbackInput {
  id: string;
  agency_staff_name: string;
  follows_routines: boolean;
  follows_behaviour_plans: boolean;
  follows_sensory_protocols: boolean;
  recording_quality: string; // "excellent"|"good"|"adequate"|"poor"
  professionalism_rating: number;
  relational_skills_rating: number;
  overall_verdict: string; // "excellent"|"good"|"adequate"|"unsuitable"
}

export interface AgencyStaffManagementInput {
  today: string;
  total_staff: number;
  shifts: AgencyShiftInput[];
  inductions: AgencyInductionInput[];
  feedback: AgencyFeedbackInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AgencyManagementRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AgencyStaffManagementResult {
  agency_rating: AgencyManagementRating;
  agency_score: number;
  headline: string;
  total_agency_shifts: number;
  vetting_compliance_rate: number;
  induction_completion_rate: number;
  positive_feedback_rate: number;
  safeguarding_briefing_rate: number;
  concerns_flagged: number;
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

function toRating(score: number): AgencyManagementRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeAgencyStaffManagement(
  input: AgencyStaffManagementInput,
): AgencyStaffManagementResult {
  const { shifts, inductions, feedback } = input;

  // Insufficient data guard
  if (shifts.length === 0) {
    return {
      agency_rating: "insufficient_data",
      agency_score: 0,
      headline: "No agency shift data available for analysis",
      total_agency_shifts: 0,
      vetting_compliance_rate: 0,
      induction_completion_rate: 0,
      positive_feedback_rate: 0,
      safeguarding_briefing_rate: 0,
      concerns_flagged: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const totalShifts = shifts.length;
  const fullyVetted = shifts.filter(s => s.vetting_status === "fully_vetted").length;
  const vettingRate = pct(fullyVetted, totalShifts);

  const inducted = shifts.filter(s => s.induction_completed).length;
  const inductionCompletionRate = pct(inducted, totalShifts);

  const withSafeguarding = shifts.filter(s => s.safeguarding_briefing).length;
  const safeguardingRate = pct(withSafeguarding, totalShifts);

  const dbsEnhanced = shifts.filter(s => s.dbs_enhanced).length;
  const dbsRate = pct(dbsEnhanced, totalShifts);

  const concernsCount = shifts.filter(s => s.has_concerns).length;
  const concernRate = pct(concernsCount, totalShifts);

  // Feedback metrics
  const positiveFeedback = feedback.filter(f =>
    f.overall_verdict === "excellent" || f.overall_verdict === "good"
  ).length;
  const positiveFeedbackRate = pct(positiveFeedback, feedback.length);

  // Induction topic coverage
  const totalTopicsCovered = inductions.reduce((sum, ind) => sum + ind.topics_covered_count, 0);
  const totalTopicsTotal = inductions.reduce((sum, ind) => sum + ind.topics_total_count, 0);
  const topicCoverageRate = pct(totalTopicsCovered, totalTopicsTotal);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Vetting compliance
  if (vettingRate >= 95) score += 5;
  else if (vettingRate >= 80) score += 2;
  else score -= 5;

  // Modifier 2: Induction topic coverage
  if (inductions.length === 0) {
    score -= 1;
  } else {
    if (topicCoverageRate >= 90) score += 6;
    else if (topicCoverageRate >= 70) score += 2;
    else if (topicCoverageRate < 50) score -= 5;
  }

  // Modifier 3: Feedback quality
  if (feedback.length === 0) {
    // no adjustment
  } else {
    if (positiveFeedbackRate >= 90) score += 5;
    else if (positiveFeedbackRate >= 70) score += 2;
    else if (positiveFeedbackRate < 50) score -= 4;
  }

  // Modifier 4: Safeguarding briefing rate
  if (safeguardingRate >= 95) score += 5;
  else if (safeguardingRate >= 80) score += 2;
  else if (safeguardingRate < 60) score -= 5;

  // Modifier 5: DBS enhanced compliance
  if (dbsRate === 100) score += 4;
  else if (dbsRate >= 90) score += 1;
  else if (dbsRate < 80) score -= 4;

  // Modifier 6: Concern management
  if (concernsCount === 0) score += 5;
  else if (concernRate <= 10) score += 2;
  else if (concernRate > 20) score -= 5;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Agency staff management is exemplary — robust vetting, induction and oversight";
      break;
    case "good":
      headline = "Good agency staff management with effective safeguarding oversight";
      break;
    case "adequate":
      headline = "Agency management is adequate but has areas for improvement";
      break;
    case "inadequate":
      headline = "Significant concerns with agency staff management practices";
      break;
    default:
      headline = "No agency shift data available for analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (vettingRate >= 95) strengths.push("Excellent vetting compliance — all agency workers are fully vetted before shifts");
  if (safeguardingRate >= 95) strengths.push("All agency staff receive safeguarding briefings before working with children");
  if (dbsRate === 100) strengths.push("100% enhanced DBS compliance across all agency shifts");
  if (positiveFeedbackRate >= 90 && feedback.length > 0) strengths.push("Agency staff consistently receive positive feedback from permanent staff");
  if (topicCoverageRate >= 90 && inductions.length > 0) strengths.push("Comprehensive induction programme covers all key topics for agency staff");
  if (concernsCount === 0) strengths.push("No concerns flagged about agency staff conduct or practice");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (vettingRate < 80) concerns.push(`Only ${vettingRate}% of agency shifts have fully vetted workers — significant safeguarding risk`);
  if (safeguardingRate < 60) concerns.push(`Safeguarding briefing rate is critically low at ${safeguardingRate}%`);
  if (dbsRate < 80) concerns.push(`DBS enhanced compliance is below 80% at ${dbsRate}% — children may be at risk`);
  if (positiveFeedbackRate < 50 && feedback.length > 0) concerns.push("Majority of agency staff feedback is negative — quality of care may be affected");
  if (concernRate > 20) concerns.push(`High rate of concerns flagged (${concernRate}%) about agency staff`);
  if (topicCoverageRate < 50 && inductions.length > 0) concerns.push("Agency induction topic coverage is critically low");
  if (inductions.length === 0 && shifts.length > 0) concerns.push("No formal inductions recorded for agency staff");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: AgencyStaffManagementResult["recommendations"] = [];

  if (vettingRate < 80) {
    recs.push({ rank: 1, recommendation: "Implement mandatory pre-shift vetting verification for all agency workers", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (safeguardingRate < 80) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure all agency staff receive safeguarding briefing before each shift", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (dbsRate < 90) {
    recs.push({ rank: recs.length + 1, recommendation: "Verify enhanced DBS status for all agency staff before shift commencement", urgency: "soon", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (positiveFeedbackRate < 70 && feedback.length > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Review agency provider quality and consider alternative agencies for improved standards", urgency: "soon", regulatory_ref: "SCCIF Leadership" });
  }
  if (inductions.length === 0 && shifts.length > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Develop and implement a structured induction process for all agency staff", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 32" });
  }
  if (topicCoverageRate < 70 && inductions.length > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Expand induction content to cover all required safeguarding and practice topics", urgency: "soon", regulatory_ref: "SCCIF Leadership" });
  }
  if (concernRate > 10) {
    recs.push({ rank: recs.length + 1, recommendation: "Investigate recurring concerns with agency staff and address root causes with provider", urgency: "soon", regulatory_ref: "SCCIF Leadership" });
  }

  // Cap at 5
  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: AgencyStaffManagementResult["insights"] = [];

  if (vettingRate === 100 && dbsRate === 100 && safeguardingRate >= 95) {
    insights.push({ text: "Agency safeguarding framework is robust — vetting, DBS and briefing compliance all at highest level", severity: "positive" });
  }
  if (vettingRate < 80 || dbsRate < 80) {
    insights.push({ text: "Agency worker safeguarding checks have critical gaps — immediate action required to protect children", severity: "critical" });
  }
  if (concernRate > 20) {
    insights.push({ text: "Pattern of concerns with agency staff suggests systemic issues with provider quality or matching", severity: "critical" });
  }
  if (positiveFeedbackRate >= 90 && feedback.length > 0) {
    insights.push({ text: "Consistently positive feedback indicates effective agency relationships and quality oversight", severity: "positive" });
  }
  if (topicCoverageRate < 50 && inductions.length > 0) {
    insights.push({ text: "Incomplete induction coverage means agency staff may lack essential knowledge about children's needs", severity: "warning" });
  }
  if (shifts.length > 0 && inductions.length === 0) {
    insights.push({ text: "Agency staff working without recorded induction — children's safety plans may not be communicated", severity: "critical" });
  }
  if (feedback.length === 0 && shifts.length > 0) {
    insights.push({ text: "No feedback recorded for agency staff — oversight of practice quality cannot be evidenced", severity: "warning" });
  }

  // Cap at 3
  const cappedInsights = insights.slice(0, 3);

  return {
    agency_rating: rating,
    agency_score: score,
    headline,
    total_agency_shifts: totalShifts,
    vetting_compliance_rate: vettingRate,
    induction_completion_rate: inductionCompletionRate,
    positive_feedback_rate: positiveFeedbackRate,
    safeguarding_briefing_rate: safeguardingRate,
    concerns_flagged: concernsCount,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
