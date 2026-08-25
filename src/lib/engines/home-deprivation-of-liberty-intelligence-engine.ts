// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DEPRIVATION OF LIBERTY INTELLIGENCE ENGINE
// Home-level: synthesises DoL restriction data across all children to assess
// proportionality, consultation quality, professional oversight, review
// timeliness, alternatives documentation, and legal framework compliance.
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
// Regulatory: CHR 2015 Reg 12 (duty of care), Reg 13 (child's views),
// Reg 20 (restraint). ECHR Article 5 (right to liberty).
// Children Act 1989 s25 (secure accommodation).
// SCCIF: "Helped and protected", "Children's rights".
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface DeprivationOfLibertyRecordInput {
  id: string;
  child_id: string;
  restriction_type: string;
  date_imposed: string;
  review_date: string;
  status: string;                  // "current" | "ended" | "under_review"
  proportionate: boolean;
  has_justification: boolean;      // necessary_justification non-empty
  child_consulted: boolean;
  child_views_recorded: boolean;   // child_views non-empty
  sw_consulted: boolean;
  ilo_consulted: boolean;
  court_authorised: boolean;
  alternatives_count: number;      // alternatives_considered.length
  has_impact_assessment: boolean;   // impact_on_child non-empty
  review_count: number;            // review_history.length
  is_overdue_review: boolean;      // review_date < today AND status === "current"
}

export interface DeprivationOfLibertyInput {
  today: string;
  total_children: number;
  restrictions: DeprivationOfLibertyRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type DeprivationOfLibertyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DOLInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface DOLRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface DeprivationOfLibertyResult {
  dol_rating: DeprivationOfLibertyRating;
  dol_score: number;
  headline: string;
  total_restrictions: number;
  active_restrictions: number;
  unique_children_restricted: number;
  /** null when the population is empty — nothing measured, not 0%. */
  proportionality_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_consultation_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  sw_consultation_rate: number | null;
  overdue_review_count: number;
  court_authorised_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  alternatives_documented_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  impact_assessment_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: DOLRecommendation[];
  insights: DOLInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): DeprivationOfLibertyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeDeprivationOfLiberty(
  input: DeprivationOfLibertyInput,
): DeprivationOfLibertyResult {
  const { total_children, restrictions } = input;

  // ── Special case: no children ─────────────────────────────────────────
  if (total_children === 0) {
    return emptyResult("insufficient_data", 0, "No children — insufficient data for deprivation of liberty analysis.");
  }

  // ── Special case: no restrictions with children present ───────────────
  if (restrictions.length === 0) {
    return {
      ...emptyResult("outstanding", 85, "No deprivation of liberty measures in place — children's freedom fully preserved."),
      strengths: ["No deprivation of liberty measures in place — children's freedom and rights are fully preserved."],
      insights: [{ text: "No restrictions on children's liberty is an outstanding indicator of rights-based practice and proportionate care.", severity: "positive" }],
    };
  }

  // ── Filter active restrictions ────────────────────────────────────────
  const active = restrictions.filter(r => r.status === "current" || r.status === "under_review");
  const totalRestrictions = restrictions.length;
  const activeCount = active.length;

  // Unique children with active restrictions
  const uniqueChildrenRestricted = new Set(active.map(r => r.child_id)).size;

  // ── Compute rates from active restrictions ────────────────────────────

  // Proportionality & justification
  const proportionalAndJustified = active.filter(r => r.proportionate && r.has_justification).length;
  const proportionalityRate = rate(proportionalAndJustified, activeCount);

  // Child consultation
  const childConsulted = active.filter(r => r.child_consulted && r.child_views_recorded).length;
  const childConsultationRate = rate(childConsulted, activeCount);

  // SW consultation
  const swConsulted = active.filter(r => r.sw_consulted).length;
  const swConsultationRate = rate(swConsulted, activeCount);

  // Review timeliness
  const overdueCount = active.filter(r => r.is_overdue_review).length;

  // Alternatives & impact
  const alternativesAndImpact = active.filter(r => r.alternatives_count >= 2 && r.has_impact_assessment).length;
  const alternativesDocumentedRate = rate(active.filter(r => r.alternatives_count >= 2).length, activeCount);
  const impactAssessmentRate = rate(active.filter(r => r.has_impact_assessment).length, activeCount);
  const alternativesImpactRate = rate(alternativesAndImpact, activeCount);

  // Legal framework
  const courtAuthorised = active.filter(r => r.court_authorised).length;
  const iloConsulted = active.filter(r => r.ilo_consulted).length;
  const iloRate = rate(iloConsulted, activeCount);

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 52;

  // Mod 1: Proportionality & justification (±6/+3/-5/-3)
  if (activeCount === 0) {
    score += 0;
  } else if (meets(proportionalityRate, 98)) {
    score += 6;
  } else if (meets(proportionalityRate, 85)) {
    score += 3;
  } else if (below(proportionalityRate, 50)) {
    score -= 8; // -5 and -3 on top
  } else if (below(proportionalityRate, 70)) {
    score -= 5;
  }

  // Mod 2: Child consultation (+5/+2/-5/-1)
  if (activeCount === 0) {
    score -= 1;
  } else if (meets(childConsultationRate, 95)) {
    score += 5;
  } else if (meets(childConsultationRate, 80)) {
    score += 2;
  } else if (below(childConsultationRate, 60)) {
    score -= 5;
  }

  // Mod 3: Professional oversight — SW consultation (+5/+2/-4/-1)
  if (activeCount === 0) {
    score -= 1;
  } else if (meets(swConsultationRate, 95)) {
    score += 5;
  } else if (meets(swConsultationRate, 80)) {
    score += 2;
  } else if (below(swConsultationRate, 60)) {
    score -= 4;
  }

  // Mod 4: Review timeliness (+5/+2/-4/-1)
  if (activeCount === 0) {
    score -= 1;
  } else if (overdueCount === 0) {
    score += 5;
  } else if (overdueCount <= 1) {
    score += 2;
  } else if (activeCount > 0 && above(rate(overdueCount, activeCount), 50)) {
    score -= 4;
  }

  // Mod 5: Alternatives & impact (+4/+2/-4/-1)
  if (activeCount === 0) {
    score -= 1;
  } else if (meets(alternativesImpactRate, 90)) {
    score += 4;
  } else if (meets(alternativesImpactRate, 70)) {
    score += 2;
  } else if (below(alternativesImpactRate, 50)) {
    score -= 4;
  }

  // Mod 6: Legal framework & court authorization (+5/+2/-3/-2)
  if (activeCount === 0) {
    score -= 2;
  } else if (meets(iloRate, 80)) {
    score += 5;
  } else if (meets(iloRate, 60)) {
    score += 2;
  } else if (below(iloRate, 40)) {
    score -= 3;
  }

  // ── Additional penalties ──────────────────────────────────────────────
  // High restriction count: >total_children restrictions → -3
  if (activeCount > total_children) {
    score -= 3;
  }

  // Multiple restriction types on same child (>2 per child) → -2
  const childRestrictionCounts: Record<string, number> = {};
  for (const r of active) {
    childRestrictionCounts[r.child_id] = (childRestrictionCounts[r.child_id] ?? 0) + 1;
  }
  const overRestrictedChildren = Object.values(childRestrictionCounts).filter(c => c > 2).length;
  if (overRestrictedChildren > 0) {
    score -= 2;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (activeCount > 0 && meets(proportionalityRate, 98)) {
    strengths.push("All active restrictions are proportionate with documented justification — evidence of rights-based practice.");
  }
  if (activeCount > 0 && meets(childConsultationRate, 95)) {
    strengths.push("Children consulted on all restrictions with views recorded — exemplary participation practice.");
  }
  if (activeCount > 0 && meets(swConsultationRate, 95)) {
    strengths.push("Social workers consulted on all restrictions — strong multi-agency oversight.");
  }
  if (activeCount > 0 && overdueCount === 0) {
    strengths.push("All restriction reviews are up to date — timely oversight of liberty measures.");
  }
  if (activeCount > 0 && meets(alternativesImpactRate, 90)) {
    strengths.push("Alternatives and impact assessments thoroughly documented for all restrictions.");
  }
  if (activeCount > 0 && meets(iloRate, 80)) {
    strengths.push("Independent reviewing officers consulted on restrictions — robust independent oversight.");
  }
  if (activeCount > 0 && courtAuthorised === activeCount) {
    strengths.push("All restrictions court authorised — full legal framework compliance.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (activeCount > 0 && below(proportionalityRate, 70)) {
    concerns.push(`Proportionality rate is ${proportionalityRate}% — restrictions must be proportionate with documented justification.`);
  }
  if (activeCount > 0 && below(childConsultationRate, 60)) {
    concerns.push(`Child consultation rate is ${childConsultationRate}% — children must be consulted about restrictions on their liberty.`);
  }
  if (activeCount > 0 && below(swConsultationRate, 60)) {
    concerns.push(`Social worker consultation rate is ${swConsultationRate}% — professional oversight is insufficient.`);
  }
  if (overdueCount > 0) {
    concerns.push(`${overdueCount} restriction${overdueCount > 1 ? "s have" : " has"} overdue reviews — timely review is essential for liberty safeguards.`);
  }
  if (activeCount > 0 && below(alternativesImpactRate, 50)) {
    concerns.push(`Alternatives and impact documentation rate is ${alternativesImpactRate}% — less restrictive options must be explored and recorded.`);
  }
  if (activeCount > 0 && below(iloRate, 40)) {
    concerns.push(`Independent reviewing officer consultation rate is ${iloRate}% — independent oversight of liberty restrictions is inadequate.`);
  }
  if (activeCount > total_children) {
    concerns.push(`${activeCount} active restrictions for ${total_children} children — potentially over-restrictive environment.`);
  }
  if (overRestrictedChildren > 0) {
    concerns.push(`${overRestrictedChildren} child${overRestrictedChildren > 1 ? "ren have" : " has"} more than 2 restrictions — cumulative impact on liberty must be assessed.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: DOLRecommendation[] = [];
  let rank = 1;

  if (overdueCount > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdueCount} overdue restriction review${overdueCount > 1 ? "s" : ""} — all liberty restrictions must be reviewed on schedule.`, urgency: "immediate", regulatory_ref: "ECHR Article 5" });
  }
  if (activeCount > 0 && below(proportionalityRate, 70)) {
    recs.push({ rank: rank++, recommendation: "Review all restrictions lacking proportionality justification — each must demonstrate necessity and proportionality.", urgency: "immediate", regulatory_ref: "Reg 20" });
  }
  if (activeCount > 0 && below(childConsultationRate, 80)) {
    recs.push({ rank: rank++, recommendation: "Ensure all children are consulted about restrictions on their liberty and their views are recorded.", urgency: "immediate", regulatory_ref: "Reg 13" });
  }
  if (activeCount > 0 && below(swConsultationRate, 80)) {
    recs.push({ rank: rank++, recommendation: "Consult social workers on all deprivation of liberty measures — multi-agency oversight is essential.", urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (activeCount > 0 && below(iloRate, 60)) {
    recs.push({ rank: rank++, recommendation: "Increase independent reviewing officer involvement in restriction oversight.", urgency: "soon", regulatory_ref: "Children Act 1989 s25" });
  }
  if (activeCount > 0 && below(alternativesImpactRate, 70)) {
    recs.push({ rank: rank++, recommendation: "Document at least two alternatives considered and impact assessment for every restriction.", urgency: "soon", regulatory_ref: "ECHR Article 5" });
  }
  if (overRestrictedChildren > 0) {
    recs.push({ rank: rank++, recommendation: `Review cumulative impact of multiple restrictions on ${overRestrictedChildren} child${overRestrictedChildren > 1 ? "ren" : ""} — consider whether all are necessary.`, urgency: "planned", regulatory_ref: "Reg 20" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: DOLInsight[] = [];

  if (activeCount > 0 && below(proportionalityRate, 50)) {
    insights.push({ text: "Less than half of active restrictions have documented proportionality. Ofsted will view this as a significant failing in children's rights protection.", severity: "critical" });
  }
  if (activeCount > 0 && below(childConsultationRate, 60)) {
    insights.push({ text: "Children are not being adequately consulted about restrictions on their liberty. This is a fundamental rights concern under ECHR Article 5.", severity: "critical" });
  }
  if (overdueCount > 0 && activeCount > 0 && above(rate(overdueCount, activeCount), 50)) {
    insights.push({ text: "Over half of restriction reviews are overdue. Ofsted expects timely review of all liberty-restricting measures.", severity: "critical" });
  }
  if (activeCount > 0 && below(iloRate, 40)) {
    insights.push({ text: "Independent reviewing officer oversight is critically low. Liberty restrictions require independent scrutiny.", severity: "critical" });
  }
  if (overRestrictedChildren > 0) {
    insights.push({ text: `${overRestrictedChildren} child${overRestrictedChildren > 1 ? "ren" : ""} subject to more than 2 restrictions. The cumulative effect may amount to a deprivation of liberty requiring court authorisation.`, severity: "warning" });
  }
  if (activeCount > total_children) {
    insights.push({ text: "More restrictions than children in placement suggests a potentially over-restrictive care environment.", severity: "warning" });
  }
  if (activeCount > 0 && meets(proportionalityRate, 98) && meets(childConsultationRate, 95)) {
    insights.push({ text: "Restrictions are proportionate with strong child consultation — evidence of rights-respecting practice that Ofsted expects.", severity: "positive" });
  }
  if (activeCount > 0 && overdueCount === 0 && meets(iloRate, 80)) {
    insights.push({ text: "All reviews on schedule with strong independent oversight — robust governance of liberty measures.", severity: "positive" });
  }
  if (activeCount > 0 && meets(alternativesImpactRate, 90)) {
    insights.push({ text: "Excellent documentation of alternatives and impact — demonstrates commitment to least restrictive practice.", severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding deprivation of liberty governance — ${activeCount} active restriction${activeCount !== 1 ? "s" : ""} with full proportionality, consultation, and review compliance.`;
  } else if (rating === "good") {
    headline = `Good deprivation of liberty management — ${activeCount} active restriction${activeCount !== 1 ? "s" : ""} with ${proportionalityRate}% proportionality rate.`;
  } else if (rating === "adequate") {
    headline = `Adequate deprivation of liberty practice — improvements needed in ${concerns.length} area${concerns.length !== 1 ? "s" : ""}.`;
  } else {
    headline = `Deprivation of liberty practice is inadequate — significant gaps in proportionality, consultation, or review compliance.`;
  }

  return {
    dol_rating: rating,
    dol_score: score,
    headline,
    total_restrictions: totalRestrictions,
    active_restrictions: activeCount,
    unique_children_restricted: uniqueChildrenRestricted,
    proportionality_rate: proportionalityRate,
    child_consultation_rate: childConsultationRate,
    sw_consultation_rate: swConsultationRate,
    overdue_review_count: overdueCount,
    court_authorised_count: courtAuthorised,
    alternatives_documented_rate: alternativesDocumentedRate,
    impact_assessment_rate: impactAssessmentRate,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Result ────────────────────────────────────────────────────────────

function emptyResult(
  rating: DeprivationOfLibertyRating,
  score: number,
  headline: string,
): DeprivationOfLibertyResult {
  return {
    dol_rating: rating,
    dol_score: score,
    headline,
    total_restrictions: 0,
    active_restrictions: 0,
    unique_children_restricted: 0,
    proportionality_rate: 0,
    child_consultation_rate: 0,
    sw_consultation_rate: 0,
    overdue_review_count: 0,
    court_authorised_count: 0,
    alternatives_documented_rate: 0,
    impact_assessment_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}
