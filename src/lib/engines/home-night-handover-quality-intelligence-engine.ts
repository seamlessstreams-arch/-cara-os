// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME NIGHT STAFF HANDOVER QUALITY INTELLIGENCE ENGINE
// Pure deterministic engine: handover completeness, risk briefing quality,
// medication recording, morning continuity, and night event documentation.
// CHR 2015 Reg 34: "Night care." SCCIF: Safety and continuity.
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface NightHandoverInput {
  id: string;
  children_at_home_count: number;
  risk_briefing_count: number;
  specific_concerns_count: number;
  medication_given: boolean;
  has_medication_notes: boolean;
  night_events_count: number;
  morning_handover_complete: boolean;
  has_children_sleeping_notes: boolean;
  has_expected_returns: boolean;
}

export interface NightHandoverQualityInput {
  today: string;
  total_children: number;
  handovers: NightHandoverInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type NightHandoverRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface NightHandoverQualityResult {
  handover_rating: NightHandoverRating;
  handover_score: number;
  headline: string;
  total_handovers: number;
  /** null when the population is empty — nothing measured, not 0%. */
  risk_briefing_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  medication_compliance_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  morning_completion_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  night_events_documented_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  children_notes_rate: number | null;
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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): NightHandoverRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeNightHandoverQuality(
  input: NightHandoverQualityInput,
): NightHandoverQualityResult {
  const { handovers, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      handover_rating: "insufficient_data",
      handover_score: 0,
      headline: "No data available for night handover analysis",
      total_handovers: 0,
      risk_briefing_rate: null,
      medication_compliance_rate: null,
      morning_completion_rate: null,
      night_events_documented_rate: null,
      children_notes_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = handovers.length;

  const withRiskBriefing = handovers.filter(h => h.risk_briefing_count > 0).length;
  const riskBriefingRate = rate(withRiskBriefing, total);

  // Medication compliance: of handovers where medication was given, was it noted?
  const medGiven = handovers.filter(h => h.medication_given);
  const medWithNotes = medGiven.filter(h => h.has_medication_notes).length;
  const medicationComplianceRate = rate(medWithNotes, medGiven.length);

  const morningComplete = handovers.filter(h => h.morning_handover_complete).length;
  const morningCompletionRate = rate(morningComplete, total);

  const withEvents = handovers.filter(h => h.night_events_count > 0).length;
  const nightEventsRate = rate(withEvents, total);

  const withChildNotes = handovers.filter(h => h.has_children_sleeping_notes).length;
  const childrenNotesRate = rate(withChildNotes, total);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Handover frequency
  if (total >= 14) score += 5;
  else if (total >= 7) score += 2;
  else if (total === 0) score -= 5;

  // Modifier 2: Risk briefing rate
  if (total === 0) {
    // already penalised
  } else {
    if (meets(riskBriefingRate, 90)) score += 6;
    else if (meets(riskBriefingRate, 70)) score += 2;
    else if (below(riskBriefingRate, 50)) score -= 5;
  }

  // Modifier 3: Medication compliance
  if (medGiven.length === 0 && total > 0) {
    score += 2;
  } else if (medGiven.length === 0) {
    // no handovers
  } else {
    if (meets(medicationComplianceRate, 95)) score += 5;
    else if (meets(medicationComplianceRate, 80)) score += 2;
    else if (below(medicationComplianceRate, 60)) score -= 5;
  }

  // Modifier 4: Morning handover completion
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(morningCompletionRate, 95)) score += 5;
    else if (meets(morningCompletionRate, 80)) score += 2;
    else if (below(morningCompletionRate, 60)) score -= 4;
  }

  // Modifier 5: Children sleeping/status notes
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(childrenNotesRate, 90)) score += 4;
    else if (meets(childrenNotesRate, 70)) score += 1;
    else if (below(childrenNotesRate, 50)) score -= 4;
  }

  // Modifier 6: Expected returns noted
  const withExpectedReturns = handovers.filter(h => h.has_expected_returns).length;
  const expectedReturnsRate = rate(withExpectedReturns, total);
  if (total === 0) {
    score -= 2;
  } else {
    if (meets(expectedReturnsRate, 80)) score += 5;
    else if (meets(expectedReturnsRate, 50)) score += 2;
    else if (below(expectedReturnsRate, 30)) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Night handovers are thorough, consistent and ensure safe continuity of care overnight";
      break;
    case "good":
      headline = "Good night handover practice with effective risk communication and morning continuity";
      break;
    case "adequate":
      headline = "Night handovers are adequate but gaps in risk briefing and documentation need addressing";
      break;
    case "inadequate":
      headline = "Night handover practice is inadequate — children may be at risk during overnight periods";
      break;
    default:
      headline = "No data available for night handover analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (total >= 14) strengths.push("Consistent nightly handovers demonstrate robust overnight care governance");
  if (meets(riskBriefingRate, 90) && total > 0) strengths.push("Risk briefings are included in virtually all handovers — night staff are well-informed");
  if (meets(medicationComplianceRate, 95) && medGiven.length > 0) strengths.push("Medication administration is consistently documented during night transitions");
  if (meets(morningCompletionRate, 95) && total > 0) strengths.push("Morning handovers are completed reliably — ensuring seamless continuity into the day");
  if (meets(childrenNotesRate, 90) && total > 0) strengths.push("Children's sleep and wellbeing status is documented at every handover");
  if (meets(expectedReturnsRate, 80) && total > 0) strengths.push("Expected returns are consistently noted — ensuring night staff know who to expect");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No night handovers recorded — overnight care lacks documented governance");
  if (below(riskBriefingRate, 50) && total > 0) concerns.push("Risk briefings are missing from most handovers — night staff may be unaware of key risks");
  if (below(medicationComplianceRate, 60) && medGiven.length > 0) concerns.push("Medication compliance is poorly documented during night transitions — a significant safety concern");
  if (below(morningCompletionRate, 60) && total > 0) concerns.push("Morning handovers are frequently incomplete — day staff miss critical overnight information");
  if (below(childrenNotesRate, 50) && total > 0) concerns.push("Children's overnight status is not consistently documented");
  if (below(expectedReturnsRate, 30) && total > 0) concerns.push("Expected returns are rarely noted — night staff may not know which children to expect home");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: NightHandoverQualityResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Implement structured night handover documentation for every shift transition", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 34" });
  }
  if (below(riskBriefingRate, 70) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure risk briefings are a mandatory element of every night handover", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 34" });
  }
  if (below(medicationComplianceRate, 80) && medGiven.length > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Strengthen medication documentation during night transitions to ensure no gaps", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 23" });
  }
  if (below(morningCompletionRate, 80) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure morning handovers are completed for every night shift to maintain care continuity", urgency: "soon", regulatory_ref: "CHR 2015 Reg 34" });
  }
  if (below(childrenNotesRate, 70) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Document children's sleep patterns and overnight wellbeing at every handover", urgency: "planned", regulatory_ref: "SCCIF Safety" });
  }
  if (below(expectedReturnsRate, 50) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Record expected returns information in all handovers so night staff have full awareness", urgency: "soon", regulatory_ref: "CHR 2015 Reg 34" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: NightHandoverQualityResult["insights"] = [];

  if (meets(riskBriefingRate, 90) && meets(morningCompletionRate, 95) && total >= 14) {
    insights.push({ text: "Night handover governance is exemplary — overnight care is safe, informed and well-documented", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No night handover records means Ofsted cannot verify overnight safety — a critical regulatory gap", severity: "critical" });
  }
  if (below(medicationComplianceRate, 60) && medGiven.length > 0) {
    insights.push({ text: "Medication gaps during night transitions present a direct risk to children's health", severity: "critical" });
  }
  if (meets(morningCompletionRate, 95) && total > 0) {
    insights.push({ text: "Reliable morning handovers ensure the day team starts fully informed — strong continuity of care", severity: "positive" });
  }
  if (below(riskBriefingRate, 50) && total > 0) {
    insights.push({ text: "Night staff arriving without risk briefings may not know about self-harm protocols or missing risks", severity: "warning" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    handover_rating: rating,
    handover_score: score,
    headline,
    total_handovers: total,
    risk_briefing_rate: riskBriefingRate,
    medication_compliance_rate: medicationComplianceRate,
    morning_completion_rate: morningCompletionRate,
    night_events_documented_rate: nightEventsRate,
    children_notes_rate: childrenNotesRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
