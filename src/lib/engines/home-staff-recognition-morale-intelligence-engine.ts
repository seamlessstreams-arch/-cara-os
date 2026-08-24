// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF RECOGNITION & MORALE INTELLIGENCE ENGINE
// Pure deterministic engine: staff recognition frequency, variety, child
// involvement, public celebration, impact documentation, and morale indicators.
// CHR 2015 Reg 33: "Fitness of workers." SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StaffRecognitionInput {
  id: string;
  staff_member: string;
  recognition_type: string; // "above_and_beyond"|"quiet_excellence"|"team_contribution"|"child_recognised"|"anniversary_milestone"|"qualification_achieved"|"wellbeing_leadership"|"innovation"|"cultural_awareness"
  recognised_by: string; // "registered_manager"|"deputy"|"peer"|"child"|"parent"|"external_professional"|"whole_team"
  has_impact_description: boolean;
  has_child_impact: boolean;
  public_celebration: boolean;
  child_contributed_nomination: boolean;
  has_staff_response: boolean;
  ways_marked_count: number;
}

export interface StaffRecognitionMoraleInput {
  today: string;
  total_staff: number;
  recognitions: StaffRecognitionInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffRecognitionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StaffRecognitionMoraleResult {
  recognition_rating: StaffRecognitionRating;
  recognition_score: number;
  headline: string;
  total_recognitions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  staff_recognised_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_involvement_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  public_celebration_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  impact_documented_rate: number | null;
  recognition_type_variety: number;
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

function toRating(score: number): StaffRecognitionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeStaffRecognitionMorale(
  input: StaffRecognitionMoraleInput,
): StaffRecognitionMoraleResult {
  const { recognitions, total_staff } = input;

  // Insufficient data guard
  if (total_staff === 0) {
    return {
      recognition_rating: "insufficient_data",
      recognition_score: 0,
      headline: "No data available for staff recognition analysis",
      total_recognitions: 0,
      staff_recognised_rate: 0,
      child_involvement_rate: 0,
      public_celebration_rate: 0,
      impact_documented_rate: 0,
      recognition_type_variety: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = recognitions.length;

  const uniqueStaff = new Set(recognitions.map(r => r.staff_member)).size;
  const staffRecognisedRate = rate(uniqueStaff, total_staff);

  const childInvolved = recognitions.filter(r => r.child_contributed_nomination).length;
  const childInvolvementRate = rate(childInvolved, total);

  const publicCelebrations = recognitions.filter(r => r.public_celebration).length;
  const publicCelebrationRate = rate(publicCelebrations, total);

  const impactDocumented = recognitions.filter(r => r.has_impact_description).length;
  const impactDocumentedRate = rate(impactDocumented, total);

  const uniqueTypes = new Set(recognitions.map(r => r.recognition_type)).size;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Recognition frequency (per staff)
  const recsPerStaff = total_staff > 0 ? total / total_staff : 0;
  if (recsPerStaff >= 2) score += 5;
  else if (recsPerStaff >= 1) score += 2;
  else if (total === 0) score -= 5;
  else score -= 2;

  // Modifier 2: Staff coverage (what % of team recognised)
  if (total === 0) {
    // already penalised
  } else {
    if (meets(staffRecognisedRate, 80)) score += 6;
    else if (meets(staffRecognisedRate, 50)) score += 2;
    else if (below(staffRecognisedRate, 30)) score -= 5;
  }

  // Modifier 3: Child involvement in nominations
  if (total === 0) {
    score -= 1;
  } else {
    if (meets(childInvolvementRate, 30)) score += 5;
    else if (meets(childInvolvementRate, 15)) score += 2;
    else if (childInvolvementRate === 0) score -= 4;
  }

  // Modifier 4: Public celebration rate
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(publicCelebrationRate, 50)) score += 5;
    else if (meets(publicCelebrationRate, 25)) score += 2;
    else if (publicCelebrationRate === 0) score -= 5;
  }

  // Modifier 5: Impact documentation
  if (total === 0) {
    // no adjustment
  } else {
    if (meets(impactDocumentedRate, 80)) score += 4;
    else if (meets(impactDocumentedRate, 50)) score += 1;
    else if (below(impactDocumentedRate, 30)) score -= 4;
  }

  // Modifier 6: Recognition type variety
  if (total === 0) {
    score -= 2;
  } else {
    if (uniqueTypes >= 5) score += 5;
    else if (uniqueTypes >= 3) score += 2;
    else if (uniqueTypes <= 1) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Staff recognition is embedded, varied and contributes to a positive, motivated workforce";
      break;
    case "good":
      headline = "Good staff recognition culture with effective acknowledgement of practice and contribution";
      break;
    case "adequate":
      headline = "Staff recognition exists but needs to be more consistent, varied and visible";
      break;
    case "inadequate":
      headline = "Staff recognition is inadequate — morale and retention are likely to be negatively impacted";
      break;
    default:
      headline = "No data available for staff recognition analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (recsPerStaff >= 2 && total > 0) strengths.push("High frequency of recognition indicates a culture that values and celebrates staff contributions");
  if (meets(staffRecognisedRate, 80) && total > 0) strengths.push("Recognition is distributed across the team — all staff feel seen and valued");
  if (meets(childInvolvementRate, 30) && total > 0) strengths.push("Children actively contribute to recognising staff — a powerful indicator of positive relationships");
  if (meets(publicCelebrationRate, 50) && total > 0) strengths.push("Recognition is publicly celebrated — reinforcing positive practice across the team");
  if (meets(impactDocumentedRate, 80) && total > 0) strengths.push("Impact of recognised practice is well documented — linking recognition to outcomes");
  if (uniqueTypes >= 5 && total > 0) strengths.push("Wide variety of recognition types shows appreciation for diverse contributions");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No staff recognition recorded — this risks disengagement and poor retention");
  if (below(staffRecognisedRate, 30) && total > 0) concerns.push("Recognition is concentrated on a few staff — most of the team feel unrecognised");
  if (childInvolvementRate === 0 && total > 0) concerns.push("Children are not involved in recognising staff — a missed opportunity for relationship building");
  if (publicCelebrationRate === 0 && total > 0) concerns.push("Recognition is never publicly celebrated — good practice is invisible to the wider team");
  if (below(impactDocumentedRate, 30) && total > 0) concerns.push("Impact of recognised practice is poorly documented — recognition lacks substance");
  if (uniqueTypes <= 1 && total > 0) concerns.push("Recognition is limited to a single type — it does not reflect the breadth of staff contributions");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: StaffRecognitionMoraleResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Implement a structured staff recognition programme to boost morale and retention", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 33" });
  }
  if (below(staffRecognisedRate, 50) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure recognition is equitably distributed across all team members", urgency: "soon", regulatory_ref: "SCCIF Well-led" });
  }
  if (childInvolvementRate === 0 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Invite children to nominate staff for recognition — strengthening voice and relationships", urgency: "soon", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (below(publicCelebrationRate, 25) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Increase visibility of recognition through team meetings, noticeboards or newsletters", urgency: "planned", regulatory_ref: "SCCIF Well-led" });
  }
  if (uniqueTypes < 3 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Diversify recognition categories to celebrate different types of contribution", urgency: "planned", regulatory_ref: "SCCIF Staff Development" });
  }
  if (below(impactDocumentedRate, 50) && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Document the impact of recognised practice to build evidence of care quality", urgency: "planned", regulatory_ref: "CHR 2015 Reg 33" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: StaffRecognitionMoraleResult["insights"] = [];

  if (recsPerStaff >= 2 && meets(staffRecognisedRate, 80) && meets(childInvolvementRate, 30)) {
    insights.push({ text: "A vibrant recognition culture — staff are frequently celebrated with children's voices central to the process", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No recognition programme risks staff burnout and turnover — homes that celebrate their teams retain them", severity: "critical" });
  }
  if (below(staffRecognisedRate, 30) && total > 0) {
    insights.push({ text: "Recognition clustering around a few staff can breed resentment — ensure all contributions are valued equally", severity: "warning" });
  }
  if (meets(childInvolvementRate, 30) && total > 0) {
    insights.push({ text: "Children recognising staff builds trust and shows inspectors that relationships are genuinely reciprocal", severity: "positive" });
  }
  if (meets(publicCelebrationRate, 50) && total > 0) {
    insights.push({ text: "Public celebration normalises excellence — it raises the bar for the whole team", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    recognition_rating: rating,
    recognition_score: score,
    headline,
    total_recognitions: total,
    staff_recognised_rate: staffRecognisedRate,
    child_involvement_rate: childInvolvementRate,
    public_celebration_rate: publicCelebrationRate,
    impact_documented_rate: impactDocumentedRate,
    recognition_type_variety: uniqueTypes,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
