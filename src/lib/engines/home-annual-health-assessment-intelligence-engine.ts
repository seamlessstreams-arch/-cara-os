// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ANNUAL HEALTH ASSESSMENT INTELLIGENCE ENGINE
// Pure deterministic engine: assessment completion timeliness, health domain
// coverage, immunisation/dental/optical checks, child contribution, and
// report sharing with professionals.
// CHR 2015 Reg 10: "The health and wellbeing standard." SCCIF: Health.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AnnualHealthAssessmentRecordInput {
  id: string;
  child_id: string;
  completed_within_deadline: boolean;
  domain_count: number;
  immunisations_up_to_date: boolean;
  dental_check_up_to_date: boolean;
  optical_check_up_to_date: boolean;
  has_child_contribution: boolean;
  report_shared: boolean;
  report_shared_with_count: number;
  recommendation_count: number;
  signed_off_by_la: boolean;
  growth_on_track: boolean;
}

export interface AnnualHealthAssessmentInput {
  today: string;
  total_children: number;
  assessments: AnnualHealthAssessmentRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AnnualHealthAssessmentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AnnualHealthAssessmentResult {
  assessment_rating: AnnualHealthAssessmentRating;
  assessment_score: number;
  headline: string;
  total_assessments: number;
  children_assessed_rate: number;
  deadline_compliance_rate: number;
  immunisation_rate: number;
  dental_optical_rate: number;
  child_contribution_rate: number;
  report_sharing_rate: number;
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

function toRating(score: number): AnnualHealthAssessmentRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeAnnualHealthAssessment(
  input: AnnualHealthAssessmentInput,
): AnnualHealthAssessmentResult {
  const { assessments, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      assessment_rating: "insufficient_data",
      assessment_score: 0,
      headline: "No data available for annual health assessment analysis",
      total_assessments: 0,
      children_assessed_rate: 0,
      deadline_compliance_rate: 0,
      immunisation_rate: 0,
      dental_optical_rate: 0,
      child_contribution_rate: 0,
      report_sharing_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = assessments.length;

  const uniqueChildren = new Set(assessments.map(a => a.child_id)).size;
  const childrenAssessedRate = pct(uniqueChildren, total_children);

  const onTime = assessments.filter(a => a.completed_within_deadline).length;
  const deadlineComplianceRate = pct(onTime, total);

  const immunisationsOk = assessments.filter(a => a.immunisations_up_to_date).length;
  const immunisationRate = pct(immunisationsOk, total);

  const dentalOptical = assessments.filter(a => a.dental_check_up_to_date && a.optical_check_up_to_date).length;
  const dentalOpticalRate = pct(dentalOptical, total);

  const withChildContribution = assessments.filter(a => a.has_child_contribution).length;
  const childContributionRate = pct(withChildContribution, total);

  const withSharing = assessments.filter(a => a.report_shared).length;
  const reportSharingRate = pct(withSharing, total);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Children assessed (coverage)
  if (total === 0) {
    score -= 3;
  } else {
    if (childrenAssessedRate >= 90) score += 6;
    else if (childrenAssessedRate >= 60) score += 2;
    else if (childrenAssessedRate < 40) score -= 5;
  }

  // Modifier 2: Deadline compliance
  if (total === 0) {
    // no adjustment
  } else {
    if (deadlineComplianceRate >= 90) score += 5;
    else if (deadlineComplianceRate >= 70) score += 2;
    else if (deadlineComplianceRate < 50) score -= 5;
  }

  // Modifier 3: Immunisation up-to-date rate
  if (total === 0) {
    score -= 1;
  } else {
    if (immunisationRate >= 90) score += 5;
    else if (immunisationRate >= 70) score += 2;
    else if (immunisationRate < 50) score -= 4;
  }

  // Modifier 4: Dental & optical checks
  if (total === 0) {
    // no adjustment
  } else {
    if (dentalOpticalRate >= 85) score += 5;
    else if (dentalOpticalRate >= 60) score += 2;
    else if (dentalOpticalRate < 40) score -= 4;
  }

  // Modifier 5: Child contribution
  if (total === 0) {
    score -= 1;
  } else {
    if (childContributionRate >= 80) score += 4;
    else if (childContributionRate >= 50) score += 1;
    else if (childContributionRate < 30) score -= 4;
  }

  // Modifier 6: Report sharing with professionals
  if (total === 0) {
    score -= 2;
  } else {
    if (reportSharingRate >= 85) score += 5;
    else if (reportSharingRate >= 60) score += 2;
    else if (reportSharingRate < 40) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Annual health assessments are thorough, timely and child-centred with excellent professional coordination";
      break;
    case "good":
      headline = "Good health assessment practice with strong compliance and information sharing";
      break;
    case "adequate":
      headline = "Health assessments are completed but timeliness, coverage and child contribution need improvement";
      break;
    case "inadequate":
      headline = "Annual health assessments are inadequate — children's health needs are not being properly monitored";
      break;
    default:
      headline = "No data available for annual health assessment analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (childrenAssessedRate >= 90 && total > 0) strengths.push("All children have completed annual health assessments — comprehensive health monitoring");
  if (deadlineComplianceRate >= 90 && total > 0) strengths.push("Assessments are consistently completed within statutory deadlines");
  if (immunisationRate >= 90 && total > 0) strengths.push("Immunisations are up to date for nearly all children");
  if (dentalOpticalRate >= 85 && total > 0) strengths.push("Dental and optical checks are well-maintained across all children");
  if (childContributionRate >= 80 && total > 0) strengths.push("Children actively contribute to their own health assessments");
  if (reportSharingRate >= 85 && total > 0) strengths.push("Health assessment reports are consistently shared with relevant professionals");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No annual health assessments recorded — statutory health monitoring is absent");
  if (childrenAssessedRate < 40 && total > 0) concerns.push("Most children have not had an annual health assessment — coverage is critically low");
  if (deadlineComplianceRate < 50 && total > 0) concerns.push("Most assessments are completed late — children's health needs are not being met promptly");
  if (immunisationRate < 50 && total > 0) concerns.push("Many children have out-of-date immunisations — this is a significant health risk");
  if (childContributionRate < 30 && total > 0) concerns.push("Children rarely contribute to their health assessments — their views are missing");
  if (reportSharingRate < 40 && total > 0) concerns.push("Assessment reports are not being shared with professionals — coordination is poor");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: AnnualHealthAssessmentResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Schedule annual health assessments for every child and establish tracking to ensure none are missed", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 10" });
  }
  if (childrenAssessedRate < 60 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Prioritise scheduling assessments for children who have not yet been assessed this year", urgency: "immediate", regulatory_ref: "SCCIF Health" });
  }
  if (deadlineComplianceRate < 70 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Implement a health assessment tracking system with advance reminders to improve deadline compliance", urgency: "soon", regulatory_ref: "CHR 2015 Reg 10" });
  }
  if (immunisationRate < 70 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Work with health professionals to bring immunisation records up to date for all children", urgency: "soon", regulatory_ref: "SCCIF Health" });
  }
  if (childContributionRate < 50 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure each child has opportunity to express their views and contribute to their health assessment", urgency: "planned", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (reportSharingRate < 60 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Share all health assessment reports with social workers, GPs and relevant professionals as standard", urgency: "planned", regulatory_ref: "SCCIF Health" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: AnnualHealthAssessmentResult["insights"] = [];

  if (childrenAssessedRate >= 90 && deadlineComplianceRate >= 90 && immunisationRate >= 90 && total >= 10) {
    insights.push({ text: "Health assessment practice is exemplary — all children receive timely, comprehensive health reviews", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No health assessment records means Ofsted cannot verify that children's health needs are being monitored", severity: "critical" });
  }
  if (immunisationRate < 50 && total > 0) {
    insights.push({ text: "Low immunisation compliance puts children at risk of preventable diseases — urgent action needed", severity: "warning" });
  }
  if (childrenAssessedRate >= 90 && total > 0) {
    insights.push({ text: "Comprehensive assessment coverage demonstrates the home takes children's health seriously", severity: "positive" });
  }
  if (deadlineComplianceRate >= 90 && total > 0) {
    insights.push({ text: "Excellent deadline compliance means no child waits too long for health review", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    assessment_rating: rating,
    assessment_score: score,
    headline,
    total_assessments: total,
    children_assessed_rate: childrenAssessedRate,
    deadline_compliance_rate: deadlineComplianceRate,
    immunisation_rate: immunisationRate,
    dental_optical_rate: dentalOpticalRate,
    child_contribution_rate: childContributionRate,
    report_sharing_rate: reportSharingRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
