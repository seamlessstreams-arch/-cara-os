// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME COMPLAINTS INTELLIGENCE ENGINE
// Home-level: analyses complaint records to assess response timeliness,
// resolution quality, child voice, learning culture, and Ofsted notification.
// CHR 2015 Reg 39. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ComplaintInput {
  id: string;
  complaint_date: string;
  source: string;              // child | parent_carer | social_worker | professional | staff | anonymous
  theme: string;
  outcome: string;             // upheld | partially_upheld | not_upheld | inconclusive | withdrawn | ongoing
  response_time_days: number;
  has_findings: boolean;
  has_lessons_learned: boolean;
  practice_changes_count: number;
  complainant_satisfied: boolean | null;
  escalated: boolean;
  ofsted_notified: boolean;
  child_id: string | null;
}

export interface HomeComplaintsInput {
  today: string;
  total_children: number;
  complaints: ComplaintInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ComplaintsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ResponseProfile {
  total_complaints: number;
  resolved_count: number;
  ongoing_count: number;
  avg_response_time_days: number | null;
  within_10_days_rate: number | null;
}

export interface OutcomeProfile {
  upheld_count: number;
  partially_upheld_count: number;
  not_upheld_count: number;
  satisfaction_rate: number | null;
  escalation_count: number;
}

export interface LearningProfile {
  findings_documented_rate: number | null;
  lessons_learned_rate: number | null;
  practice_change_rate: number | null;
  total_practice_changes: number;
}

export interface SourceBreakdown {
  child: number;
  parent_carer: number;
  social_worker: number;
  professional: number;
  staff: number;
  anonymous: number;
}

export interface ComplaintsInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ComplaintsRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeComplaintsResult {
  complaints_rating: ComplaintsRating;
  complaints_score: number | null;
  headline: string;
  response_profile: ResponseProfile;
  outcome_profile: OutcomeProfile;
  learning_profile: LearningProfile;
  source_breakdown: SourceBreakdown;
  strengths: string[];
  concerns: string[];
  recommendations: ComplaintsRecommendation[];
  insights: ComplaintsInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ComplaintsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeComplaints(
  input: HomeComplaintsInput,
): HomeComplaintsResult {
  const { complaints } = input;

  // Insufficient data: 0 complaints
  if (complaints.length === 0) {
    return {
      complaints_rating: "insufficient_data",
      complaints_score: 0,
      headline: "No complaint records available.",
      response_profile: emptyResponseProfile(),
      outcome_profile: emptyOutcomeProfile(),
      learning_profile: emptyLearningProfile(),
      source_breakdown: emptySourceBreakdown(),
      strengths: [],
      concerns: ["No complaint records found — absence of complaints may indicate children don't feel empowered to raise concerns."],
      recommendations: [{ rank: 1, recommendation: "Actively promote the complaints procedure with children — ensure they know how, who, and when to complain.", urgency: "soon", regulatory_ref: "Reg 39" }],
      insights: [{ text: "No complaints on record. While this could reflect excellent care, Ofsted is more likely to question whether children feel empowered to complain. A healthy complaints culture is a sign of transparency, not failure.", severity: "warning" }],
    };
  }

  // ── Response Profile ───────────────────────────────────────────────
  const resolved = complaints.filter(c => c.outcome !== "ongoing");
  const ongoing = complaints.filter(c => c.outcome === "ongoing");

  const responseTimes = resolved.filter(c => c.response_time_days > 0);
  const avgResponse = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, c) => a + c.response_time_days, 0) / responseTimes.length)
    : null;

  const within10 = resolved.filter(c => c.response_time_days > 0 && c.response_time_days <= 10).length;
  const within10Rate = rate(within10, responseTimes.length);

  const responseProfile: ResponseProfile = {
    total_complaints: complaints.length,
    resolved_count: resolved.length,
    ongoing_count: ongoing.length,
    avg_response_time_days: avgResponse,
    within_10_days_rate: within10Rate,
  };

  // ── Outcome Profile ────────────────────────────────────────────────
  const upheld = complaints.filter(c => c.outcome === "upheld").length;
  const partiallyUpheld = complaints.filter(c => c.outcome === "partially_upheld").length;
  const notUpheld = complaints.filter(c => c.outcome === "not_upheld").length;

  const withSatisfaction = resolved.filter(c => c.complainant_satisfied !== null);
  const satisfied = withSatisfaction.filter(c => c.complainant_satisfied === true).length;
  const satisfactionRate = rate(satisfied, withSatisfaction.length);

  const escalated = complaints.filter(c => c.escalated).length;

  const outcomeProfile: OutcomeProfile = {
    upheld_count: upheld,
    partially_upheld_count: partiallyUpheld,
    not_upheld_count: notUpheld,
    satisfaction_rate: satisfactionRate,
    escalation_count: escalated,
  };

  // ── Learning Profile ───────────────────────────────────────────────
  const withFindings = resolved.filter(c => c.has_findings).length;
  const findingsRate = rate(withFindings, resolved.length);

  const withLessons = resolved.filter(c => c.has_lessons_learned).length;
  const lessonsRate = rate(withLessons, resolved.length);

  const withPracticeChanges = resolved.filter(c => c.practice_changes_count > 0).length;
  const practiceChangeRate = rate(withPracticeChanges, resolved.length);

  const totalPracticeChanges = complaints.reduce((a, c) => a + c.practice_changes_count, 0);

  const learningProfile: LearningProfile = {
    findings_documented_rate: findingsRate,
    lessons_learned_rate: lessonsRate,
    practice_change_rate: practiceChangeRate,
    total_practice_changes: totalPracticeChanges,
  };

  // ── Source Breakdown ───────────────────────────────────────────────
  const child = complaints.filter(c => c.source === "child").length;
  const parentCarer = complaints.filter(c => c.source === "parent_carer").length;
  const socialWorker = complaints.filter(c => c.source === "social_worker").length;
  const professional = complaints.filter(c => c.source === "professional").length;
  const staff = complaints.filter(c => c.source === "staff").length;
  const anonymous = complaints.filter(c => c.source === "anonymous").length;

  const sourceBreakdown: SourceBreakdown = {
    child, parent_carer: parentCarer, social_worker: socialWorker,
    professional, staff, anonymous,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80 (outstanding reachable)
  let score = 52;

  // 1. Response timeliness (±5)
  if (responseTimes.length > 0) {
    if (meets(within10Rate, 80)) score += 5;
    else if (meets(within10Rate, 60)) score += 2;
    else score -= 3;
  }

  // 2. Satisfaction rate (±4)
  if (withSatisfaction.length > 0) {
    if (meets(satisfactionRate, 80)) score += 4;
    else if (meets(satisfactionRate, 60)) score += 2;
    else score -= 3;
  } else {
    score += 1; // no satisfaction data available
  }

  // 3. Findings documented (±4)
  if (resolved.length > 0) {
    if (meets(findingsRate, 80)) score += 4;
    else if (meets(findingsRate, 60)) score += 2;
    else score -= 3;
  }

  // 4. Lessons learned (±3)
  if (resolved.length > 0) {
    if (meets(lessonsRate, 80)) score += 3;
    else if (meets(lessonsRate, 60)) score += 1;
    else score -= 2;
  }

  // 5. Practice changes (±3)
  if (resolved.length > 0) {
    if (meets(practiceChangeRate, 60)) score += 3;
    else if (meets(practiceChangeRate, 40)) score += 1;
    else score -= 2;
  }

  // 6. Child complaints present (±3) — positive indicator of empowerment
  if (child >= 2) score += 3;
  else if (child >= 1) score += 2;
  else score -= 1;

  // 7. Multi-source complaints (±3) — diverse sources = transparent culture
  const sources = [child, parentCarer, socialWorker, professional, staff, anonymous].filter(n => n > 0).length;
  if (sources >= 3) score += 3;
  else if (sources >= 2) score += 1;
  else score += 0;

  // 8. Low escalation rate (±3)
  const escalationRate = rate(escalated, complaints.length);
  if ((escalationRate !== null && escalationRate <= 10)) score += 3;
  else if ((escalationRate !== null && escalationRate <= 25)) score += 1;
  else score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(within10Rate, 80) && responseTimes.length > 0) strengths.push(`${formatRate(within10Rate)} of complaints resolved within 10 days — demonstrates responsive governance.`);
  if (meets(satisfactionRate, 80) && withSatisfaction.length > 0) strengths.push(`${formatRate(satisfactionRate)} complainant satisfaction — concerns are taken seriously and resolved effectively.`);
  if (meets(findingsRate, 80) && resolved.length > 0) strengths.push(`Findings documented in ${formatRate(findingsRate)} of complaints — thorough investigation culture.`);
  if (meets(lessonsRate, 80) && resolved.length > 0) strengths.push(`Lessons learned recorded in ${formatRate(lessonsRate)} of complaints — reflective practice embedded.`);
  if (meets(practiceChangeRate, 60) && resolved.length > 0) strengths.push(`${formatRate(practiceChangeRate)} of complaints led to practice changes — complaints drive improvement.`);
  if (child >= 2) strengths.push(`${child} complaints from children — children feel empowered to raise concerns.`);
  if (sources >= 3) strengths.push(`Complaints from ${sources} different source types — the home is transparent and accessible.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (below(within10Rate, 60) && responseTimes.length > 0) concerns.push(`Only ${formatRate(within10Rate)} of complaints resolved within 10 days — Reg 39 expects timely resolution.`);
  if (below(satisfactionRate, 60) && withSatisfaction.length > 0) concerns.push(`Only ${formatRate(satisfactionRate)} complainant satisfaction — complainants feel their concerns are not adequately addressed.`);
  if (below(findingsRate, 60) && resolved.length > 0) concerns.push(`Findings documented in only ${formatRate(findingsRate)} of complaints — investigations must be thorough and recorded.`);
  if (below(lessonsRate, 60) && resolved.length > 0) concerns.push(`Lessons learned recorded in only ${formatRate(lessonsRate)} of complaints — learning from complaints is essential.`);
  if (child === 0 && complaints.length > 0) concerns.push("No complaints from children — this may indicate children don't feel empowered to complain.");
  if (escalated > 1) concerns.push(`${escalated} complaints escalated — recurring escalation suggests the internal process needs strengthening.`);
  if (ongoing.length > 2) concerns.push(`${ongoing.length} complaints still ongoing — outstanding complaints need timely resolution.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: ComplaintsRecommendation[] = [];
  let rank = 1;

  if (below(within10Rate, 60) && responseTimes.length > 0) {
    recs.push({ rank: rank++, recommendation: "Implement a 10-day target for complaint resolution — track in the complaints log.", urgency: "immediate", regulatory_ref: "Reg 39" });
  }
  if (below(findingsRate, 60) && resolved.length > 0) {
    recs.push({ rank: rank++, recommendation: "Ensure all complaints have documented findings — even when not upheld.", urgency: "soon", regulatory_ref: "Reg 39" });
  }
  if (child === 0 && complaints.length > 0) {
    recs.push({ rank: rank++, recommendation: "Actively promote the complaints procedure with children — use key work sessions, house meetings, and children's guides.", urgency: "soon", regulatory_ref: "Reg 39" });
  }
  if (ongoing.length > 2) {
    recs.push({ rank: rank++, recommendation: `Resolve ${ongoing.length} outstanding complaints — set deadlines and assign investigators.`, urgency: "immediate", regulatory_ref: "Reg 39" });
  }
  if (below(lessonsRate, 60) && resolved.length > 0) {
    recs.push({ rank: rank++, recommendation: "Record lessons learned for every completed complaint — this evidences a learning culture.", urgency: "planned", regulatory_ref: "Reg 39" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: ComplaintsInsight[] = [];

  if (child === 0 && complaints.length > 0) {
    insights.push({ text: "No complaints received from children. Ofsted expects children to feel safe and empowered to complain — the absence of child complaints is more likely to be seen as a concern than a strength. Promote the procedure actively.", severity: "warning" });
  }
  if (meets(within10Rate, 80) && meets(findingsRate, 80) && meets(lessonsRate, 80)) {
    insights.push({ text: `${formatRate(within10Rate)} resolved within 10 days, ${formatRate(findingsRate)} documented findings, and ${formatRate(lessonsRate)} with lessons learned — this demonstrates an outstanding complaints culture that Ofsted will recognise as evidence of reflective, responsive leadership.`, severity: "positive" });
  }
  if (child >= 2 && meets(satisfactionRate, 80)) {
    insights.push({ text: `Children are actively using the complaints procedure (${child} complaints) with ${formatRate(satisfactionRate)} satisfaction — this is powerful evidence that children's voices are heard and acted upon.`, severity: "positive" });
  }
  if (escalated > 1) {
    insights.push({ text: `${escalated} complaints required escalation. Ofsted will examine whether the internal process is robust enough to resolve concerns before they escalate — consider whether investigation timelines and communication are adequate.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding complaints management — ${formatRate(within10Rate)} resolved within 10 days, ${formatRate(satisfactionRate)} satisfaction.`;
  } else if (rating === "good") {
    headline = `Good complaints management — responsive resolution with ${formatRate(findingsRate)} documented findings.`;
  } else if (rating === "adequate") {
    headline = "Adequate complaints management — gaps in response timeliness, documentation, or learning need addressing.";
  } else {
    headline = "Complaints management is inadequate — significant gaps in response, documentation, or learning culture.";
  }

  return {
    complaints_rating: rating,
    complaints_score: score,
    headline,
    response_profile: responseProfile,
    outcome_profile: outcomeProfile,
    learning_profile: learningProfile,
    source_breakdown: sourceBreakdown,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ────────────────────────────────────────────────────────

function emptyResponseProfile(): ResponseProfile {
  return {
    total_complaints: 0, resolved_count: 0, ongoing_count: 0,
    avg_response_time_days: 0, within_10_days_rate: 0,
  };
}

function emptyOutcomeProfile(): OutcomeProfile {
  return {
    upheld_count: 0, partially_upheld_count: 0, not_upheld_count: 0,
    satisfaction_rate: 0, escalation_count: 0,
  };
}

function emptyLearningProfile(): LearningProfile {
  return {
    findings_documented_rate: 0, lessons_learned_rate: 0,
    practice_change_rate: 0, total_practice_changes: 0,
  };
}

function emptySourceBreakdown(): SourceBreakdown {
  return { child: 0, parent_carer: 0, social_worker: 0, professional: 0, staff: 0, anonymous: 0 };
}
