// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SUBSTANCE MISUSE SCREENING INTELLIGENCE ENGINE
// Pure deterministic engine: screening coverage, risk identification, harm
// reduction, professional support, child voice/insight, and information sharing.
// CHR 2015 Reg 12: "The protection of children standard." SCCIF: Safeguarding.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SubstanceScreeningRecordInput {
  id: string;
  child_id: string;
  screening_tool: string; // "crafft"|"internal_brief_screen"|"conversation_based"|"audit_c_older"
  risk_level: string; // "no_identified_risk"|"awareness_only"|"low_risk"|"medium_risk"|"high_risk"|"active_concern"
  substances_identified_count: number;
  has_harm_reduction: boolean;
  professional_support_count: number;
  has_child_insight: boolean;
  has_child_motivation: boolean;
  warning_signs_count: number;
  shared_with_social_worker: boolean;
  shared_with_camhs: boolean;
  child_authored: boolean;
}

export interface SubstanceMisuseScreeningInput {
  today: string;
  total_children: number;
  screenings: SubstanceScreeningRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SubstanceMisuseRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SubstanceMisuseResult {
  screening_rating: SubstanceMisuseRating;
  screening_score: number;
  headline: string;
  total_screenings: number;
  children_screened_rate: number;
  high_risk_rate: number;
  harm_reduction_rate: number;
  professional_support_rate: number;
  child_insight_rate: number;
  information_sharing_rate: number;
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

function toRating(score: number): SubstanceMisuseRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeSubstanceMisuseScreening(
  input: SubstanceMisuseScreeningInput,
): SubstanceMisuseResult {
  const { screenings, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      screening_rating: "insufficient_data",
      screening_score: 0,
      headline: "No data available for substance misuse screening analysis",
      total_screenings: 0,
      children_screened_rate: 0,
      high_risk_rate: 0,
      harm_reduction_rate: 0,
      professional_support_rate: 0,
      child_insight_rate: 0,
      information_sharing_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = screenings.length;

  const uniqueChildren = new Set(screenings.map(s => s.child_id)).size;
  const childrenScreenedRate = pct(uniqueChildren, total_children);

  const highRisk = screenings.filter(s => s.risk_level === "high_risk" || s.risk_level === "active_concern").length;
  const highRiskRate = pct(highRisk, total);

  const withHarmReduction = screenings.filter(s => s.has_harm_reduction).length;
  const harmReductionRate = pct(withHarmReduction, total);

  const withProfessionalSupport = screenings.filter(s => s.professional_support_count > 0).length;
  const professionalSupportRate = pct(withProfessionalSupport, total);

  const withChildInsight = screenings.filter(s => s.has_child_insight).length;
  const childInsightRate = pct(withChildInsight, total);

  const sharedWithSW = screenings.filter(s => s.shared_with_social_worker).length;
  const sharedWithCamhs = screenings.filter(s => s.shared_with_camhs).length;
  const sharedEither = screenings.filter(s => s.shared_with_social_worker || s.shared_with_camhs).length;
  const informationSharingRate = pct(sharedEither, total);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Children screened (coverage)
  if (total === 0) {
    score -= 3;
  } else {
    if (childrenScreenedRate >= 80) score += 5;
    else if (childrenScreenedRate >= 50) score += 2;
    else if (childrenScreenedRate < 30) score -= 5;
  }

  // Modifier 2: Harm reduction documented
  if (total === 0) {
    // no adjustment
  } else {
    if (harmReductionRate >= 80) score += 6;
    else if (harmReductionRate >= 50) score += 2;
    else if (harmReductionRate < 30) score -= 5;
  }

  // Modifier 3: Professional support in place
  if (total === 0) {
    score -= 1;
  } else {
    if (professionalSupportRate >= 70) score += 5;
    else if (professionalSupportRate >= 40) score += 2;
    else if (professionalSupportRate < 20) score -= 4;
  }

  // Modifier 4: Child insight/voice captured
  if (total === 0) {
    // no adjustment
  } else {
    if (childInsightRate >= 90) score += 5;
    else if (childInsightRate >= 60) score += 2;
    else if (childInsightRate < 30) score -= 4;
  }

  // Modifier 5: Information sharing (SW/CAMHS)
  if (total === 0) {
    score -= 1;
  } else {
    if (informationSharingRate >= 80) score += 4;
    else if (informationSharingRate >= 50) score += 1;
    else if (informationSharingRate < 30) score -= 4;
  }

  // Modifier 6: Risk identification quality (high risk managed)
  if (total === 0) {
    score -= 2;
  } else {
    if (highRisk === 0) {
      // No high risk identified — screening is comprehensive, reward
      score += 5;
    } else {
      // High risk exists — check if support/sharing is in place for those
      const highRiskWithSupport = screenings.filter(s =>
        (s.risk_level === "high_risk" || s.risk_level === "active_concern") && s.professional_support_count > 0
      ).length;
      const highRiskSupportRate = pct(highRiskWithSupport, highRisk);
      if (highRiskSupportRate >= 80) score += 5;
      else if (highRiskSupportRate >= 50) score += 2;
      else if (highRiskSupportRate < 30) score -= 3;
    }
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Substance misuse screening is proactive, thorough and child-centred with strong multi-agency support";
      break;
    case "good":
      headline = "Good screening coverage with effective risk identification and professional support";
      break;
    case "adequate":
      headline = "Screening exists but coverage, harm reduction and information sharing need improvement";
      break;
    case "inadequate":
      headline = "Substance misuse screening is inadequate — risks are not being identified or managed safely";
      break;
    default:
      headline = "No data available for substance misuse screening analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (childrenScreenedRate >= 80 && total > 0) strengths.push("Most children have been screened — proactive approach to substance misuse awareness");
  if (harmReductionRate >= 80 && total > 0) strengths.push("Harm reduction approaches are consistently documented and applied");
  if (professionalSupportRate >= 70 && total > 0) strengths.push("Professional support is well-coordinated for children identified with substance concerns");
  if (childInsightRate >= 90 && total > 0) strengths.push("Children's own insights and motivation are captured in screening records");
  if (informationSharingRate >= 80 && total > 0) strengths.push("Information is shared effectively with social workers and CAMHS when appropriate");
  if (highRisk === 0 && total > 0) strengths.push("No high-risk substance concerns identified — preventative screening is working effectively");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No substance misuse screenings recorded — risks may be going unidentified");
  if (childrenScreenedRate < 30 && total > 0) concerns.push("Very few children have been screened — substance misuse risks may be undetected");
  if (harmReductionRate < 30 && total > 0) concerns.push("Harm reduction approaches are rarely documented despite identified risks");
  if (professionalSupportRate < 20 && total > 0) concerns.push("Professional support is lacking — children with substance concerns are not being connected to services");
  if (childInsightRate < 30 && total > 0) concerns.push("Children's own perspectives are missing from screening records");
  if (informationSharingRate < 30 && total > 0) concerns.push("Information is not being shared with social workers or CAMHS — safeguarding oversight is weak");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: SubstanceMisuseResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Implement routine substance misuse screening for all children using validated tools", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (childrenScreenedRate < 50 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Extend screening to all children as part of routine health and safeguarding assessments", urgency: "soon", regulatory_ref: "SCCIF Safeguarding" });
  }
  if (harmReductionRate < 50 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure harm reduction strategies are documented for every child with identified substance concerns", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (informationSharingRate < 50 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Share screening outcomes with social workers and CAMHS as standard practice", urgency: "immediate", regulatory_ref: "SCCIF Safeguarding" });
  }
  if (childInsightRate < 60 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Record each child's own understanding, views and motivation alongside screening results", urgency: "planned", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (professionalSupportRate < 40 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Connect children with substance concerns to specialist professional support services", urgency: "soon", regulatory_ref: "SCCIF Health" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: SubstanceMisuseResult["insights"] = [];

  if (childrenScreenedRate >= 80 && harmReductionRate >= 80 && informationSharingRate >= 80 && total >= 10) {
    insights.push({ text: "Substance misuse screening is exemplary — proactive identification, child-centred support and strong multi-agency coordination", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No screening records means Ofsted cannot verify how substance misuse risks are identified and managed", severity: "critical" });
  }
  if (highRiskRate >= 30 && total > 0) {
    insights.push({ text: "High proportion of children flagged as high risk or active concern — intensive monitoring and support required", severity: "warning" });
  }
  if (childrenScreenedRate >= 80 && total > 0) {
    insights.push({ text: "Comprehensive screening coverage shows the home takes substance misuse awareness seriously", severity: "positive" });
  }
  if (highRisk === 0 && total > 0) {
    insights.push({ text: "No high-risk concerns identified — preventative awareness work appears effective", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    screening_rating: rating,
    screening_score: score,
    headline,
    total_screenings: total,
    children_screened_rate: childrenScreenedRate,
    high_risk_rate: highRiskRate,
    harm_reduction_rate: harmReductionRate,
    professional_support_rate: professionalSupportRate,
    child_insight_rate: childInsightRate,
    information_sharing_rate: informationSharingRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
