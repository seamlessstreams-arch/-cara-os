// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME WHISTLEBLOWING TRANSPARENCY INTELLIGENCE ENGINE
// Home-level: analyses whistleblowing records, staff confidence, policy
// awareness, and protection measures to assess transparency culture.
// CHR 2015 Reg 40. PIDA 1998. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface WhistleblowingRecordInput {
  id: string;
  date_raised: string;
  anonymous: boolean;
  category: string; // "safeguarding"|"malpractice"|"health_safety"|"financial"|"bullying"|"data_breach"|"discrimination"|"neglect"|"policy_breach"|"other"
  severity: string; // "low"|"medium"|"high"|"critical"
  status: string; // "received"|"investigating"|"escalated"|"resolved"|"closed_no_action"
  has_external_referral: boolean;
  has_outcome: boolean;
  has_lessons_learned: boolean;
  protection_measures_count: number;
  timeline_actions_count: number;
}

export interface TransparencyCultureInput {
  id: string;
  staff_id: string;
  whistleblowing_policy_read: boolean;
  feels_confident_to_report: boolean;
  knows_how_to_report: boolean;
}

export interface WhistleblowingInput {
  today: string;
  total_staff: number;
  records: WhistleblowingRecordInput[];
  culture: TransparencyCultureInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type WhistleblowingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface WhistleblowingResult {
  whistleblowing_rating: WhistleblowingRating;
  whistleblowing_score: number;
  headline: string;
  total_concerns: number;
  open_concerns: number;
  resolution_rate: number;
  lessons_learned_rate: number;
  staff_confidence_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: {
    text: string;
    severity: "critical" | "warning" | "positive";
  }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): WhistleblowingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeWhistleblowingTransparency(
  input: WhistleblowingInput,
): WhistleblowingResult {
  const { records, culture, total_staff } = input;

  // ── Insufficient data: no staff ─────────────────────────────────────
  if (total_staff === 0) {
    return {
      whistleblowing_rating: "insufficient_data",
      whistleblowing_score: 0,
      headline: "No staff data available to assess whistleblowing transparency.",
      total_concerns: 0,
      open_concerns: 0,
      resolution_rate: 0,
      lessons_learned_rate: 0,
      staff_confidence_rate: 0,
      strengths: [],
      concerns: [
        "No staff data available — whistleblowing culture cannot be assessed.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Ensure staff data is recorded so whistleblowing transparency can be monitored.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 40",
        },
      ],
      insights: [
        {
          text: "No staff on record. Whistleblowing transparency requires an active workforce to assess culture, confidence, and policy awareness.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Metrics ─────────────────────────────────────────────────────────
  const totalConcerns = records.length;

  const openStatuses = ["received", "investigating", "escalated"];
  const openConcerns = records.filter((r) =>
    openStatuses.includes(r.status),
  ).length;

  const resolvedOrClosed = records.filter(
    (r) => r.status === "resolved" || r.status === "closed_no_action",
  ).length;
  const resolutionRate = pct(resolvedOrClosed, totalConcerns);

  const withLessons = records.filter((r) => r.has_lessons_learned).length;
  const lessonsLearnedRate = pct(withLessons, totalConcerns);

  const confidentStaff = culture.filter(
    (c) => c.feels_confident_to_report,
  ).length;
  const staffConfidenceRate = pct(confidentStaff, culture.length);

  const policyRead = culture.filter(
    (c) => c.whistleblowing_policy_read,
  ).length;
  const policyAwarenessRate = pct(policyRead, culture.length);

  const knowsHow = culture.filter((c) => c.knows_how_to_report).length;
  const reportingKnowledgeRate = pct(knowsHow, culture.length);

  const withProtection = records.filter(
    (r) => r.protection_measures_count > 0,
  ).length;
  const protectionRate = pct(withProtection, totalConcerns);

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52, 6 modifiers (max ~30 bonus)
  let score = 52;

  // 1. Resolution rate (±5)
  if (totalConcerns === 0) {
    score += 3;
  } else if (resolutionRate >= 90) {
    score += 5;
  } else if (resolutionRate >= 70) {
    score += 2;
  } else if (resolutionRate >= 40) {
    score += 0;
  } else {
    score -= 5;
  }

  // 2. Lessons learned (±6/-5)
  if (totalConcerns === 0) {
    score += 3;
  } else if (lessonsLearnedRate >= 90) {
    score += 6;
  } else if (lessonsLearnedRate >= 70) {
    score += 3;
  } else if (lessonsLearnedRate >= 40) {
    score += 0;
  } else {
    score -= 5;
  }

  // 3. Staff confidence (±5/-4)
  if (staffConfidenceRate >= 90) {
    score += 5;
  } else if (staffConfidenceRate >= 70) {
    score += 2;
  } else if (staffConfidenceRate >= 40) {
    score += 0;
  } else {
    score -= 4;
  }

  // 4. Policy awareness (±5/-5)
  if (policyAwarenessRate >= 95) {
    score += 5;
  } else if (policyAwarenessRate >= 80) {
    score += 2;
  } else if (policyAwarenessRate >= 50) {
    score += 0;
  } else {
    score -= 5;
  }

  // 5. Protection measures (±4/-4)
  if (totalConcerns === 0) {
    score += 2;
  } else if (protectionRate >= 90) {
    score += 4;
  } else if (protectionRate >= 60) {
    score += 1;
  } else if (protectionRate >= 30) {
    score += 0;
  } else {
    score -= 4;
  }

  // 6. Reporting knowledge (±5/-5)
  if (reportingKnowledgeRate >= 95) {
    score += 5;
  } else if (reportingKnowledgeRate >= 80) {
    score += 2;
  } else if (reportingKnowledgeRate >= 50) {
    score += 0;
  } else {
    score -= 5;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (resolutionRate >= 90 && totalConcerns > 0) {
    strengths.push(
      `${resolutionRate}% of whistleblowing concerns resolved — demonstrates robust follow-through.`,
    );
  }
  if (lessonsLearnedRate >= 90 && totalConcerns > 0) {
    strengths.push(
      `Lessons learned documented in ${lessonsLearnedRate}% of concerns — reflective practice embedded.`,
    );
  }
  if (staffConfidenceRate >= 90) {
    strengths.push(
      `${staffConfidenceRate}% of staff feel confident to raise whistleblowing concerns — strong transparency culture.`,
    );
  }
  if (policyAwarenessRate >= 95) {
    strengths.push(
      `${policyAwarenessRate}% of staff have read the whistleblowing policy — excellent awareness.`,
    );
  }
  if (protectionRate >= 90 && totalConcerns > 0) {
    strengths.push(
      `Protection measures in place for ${protectionRate}% of concerns — whistleblowers are safeguarded.`,
    );
  }
  if (reportingKnowledgeRate >= 95) {
    strengths.push(
      `${reportingKnowledgeRate}% of staff know how to report — reporting pathways are well understood.`,
    );
  }
  if (totalConcerns === 0 && staffConfidenceRate >= 90) {
    strengths.push(
      "No whistleblowing concerns raised and staff confidence is high — this suggests a well-managed, transparent environment.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (resolutionRate < 70 && totalConcerns > 0) {
    concerns.push(
      `Only ${resolutionRate}% of whistleblowing concerns have been resolved — unresolved concerns undermine trust.`,
    );
  }
  if (lessonsLearnedRate < 70 && totalConcerns > 0) {
    concerns.push(
      `Lessons learned documented in only ${lessonsLearnedRate}% of concerns — the home is not learning from disclosures.`,
    );
  }
  if (staffConfidenceRate < 70) {
    concerns.push(
      `Only ${staffConfidenceRate}% of staff feel confident to raise concerns — this suggests a culture that does not support transparency.`,
    );
  }
  if (policyAwarenessRate < 80) {
    concerns.push(
      `Only ${policyAwarenessRate}% of staff have read the whistleblowing policy — significant awareness gap.`,
    );
  }
  if (protectionRate < 60 && totalConcerns > 0) {
    concerns.push(
      `Protection measures in place for only ${protectionRate}% of concerns — whistleblowers may feel exposed.`,
    );
  }
  if (reportingKnowledgeRate < 80) {
    concerns.push(
      `Only ${reportingKnowledgeRate}% of staff know how to report — reporting pathways are unclear.`,
    );
  }
  if (openConcerns > 0) {
    concerns.push(
      `${openConcerns} whistleblowing concern${openConcerns > 1 ? "s" : ""} remain open — timely resolution is essential.`,
    );
  }

  const criticalRecords = records.filter((r) => r.severity === "critical");
  const unresolvedCritical = criticalRecords.filter(
    (r) => r.status !== "resolved" && r.status !== "closed_no_action",
  );
  if (unresolvedCritical.length > 0) {
    concerns.push(
      `${unresolvedCritical.length} critical-severity concern${unresolvedCritical.length > 1 ? "s" : ""} unresolved — these require immediate attention.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: WhistleblowingResult["recommendations"] = [];
  let rank = 1;

  if (staffConfidenceRate < 70 && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation:
        "Deliver targeted training to build staff confidence in raising whistleblowing concerns — use case studies and role-play scenarios.",
      urgency: "immediate",
      regulatory_ref: "PIDA 1998",
    });
  }
  if (policyAwarenessRate < 80 && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation:
        "Ensure all staff read and sign the whistleblowing policy — include in induction and annual refresher training.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if (resolutionRate < 70 && totalConcerns > 0 && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation:
        "Establish clear timelines for investigating and resolving whistleblowing concerns — assign a named lead for each case.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if (lessonsLearnedRate < 70 && totalConcerns > 0 && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation:
        "Record lessons learned for every whistleblowing concern — embed findings in team meetings and supervision.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }
  if (reportingKnowledgeRate < 80 && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation:
        "Clarify and promote reporting pathways — display flowcharts in staff areas and include in supervision agendas.",
      urgency: "planned",
      regulatory_ref: "PIDA 1998",
    });
  }
  if (protectionRate < 60 && totalConcerns > 0 && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation:
        "Implement documented protection measures for every whistleblower — ensure confidentiality and non-retaliation protocols are followed.",
      urgency: "immediate",
      regulatory_ref: "PIDA 1998",
    });
  }
  if (unresolvedCritical.length > 0 && rank <= 5) {
    recs.push({
      rank: rank++,
      recommendation:
        `Resolve ${unresolvedCritical.length} critical-severity concern${unresolvedCritical.length > 1 ? "s" : ""} as a matter of urgency — escalate to the responsible individual and Ofsted if appropriate.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40",
    });
  }

  // Cap at 5
  const finalRecs = recs.slice(0, 5);

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: WhistleblowingResult["insights"] = [];

  if (
    staffConfidenceRate >= 90 &&
    policyAwarenessRate >= 95 &&
    reportingKnowledgeRate >= 95
  ) {
    insights.push({
      text: `Staff confidence at ${staffConfidenceRate}%, policy awareness at ${policyAwarenessRate}%, and reporting knowledge at ${reportingKnowledgeRate}% — this home has built an exemplary transparency culture that Ofsted will recognise as a significant strength.`,
      severity: "positive",
    });
  }

  if (staffConfidenceRate < 50) {
    insights.push({
      text: `Only ${staffConfidenceRate}% of staff feel confident to raise concerns. This is a serious cultural issue — Ofsted will view low confidence as evidence that the home may not be safe for whistleblowers.`,
      severity: "critical",
    });
  }

  if (totalConcerns > 0 && resolutionRate >= 90 && lessonsLearnedRate >= 90) {
    insights.push({
      text: `${resolutionRate}% resolution rate with ${lessonsLearnedRate}% lessons learned — whistleblowing concerns are being handled with rigour and are driving organisational improvement.`,
      severity: "positive",
    });
  }

  if (
    totalConcerns === 0 &&
    staffConfidenceRate < 70
  ) {
    insights.push({
      text: "No whistleblowing concerns on record combined with low staff confidence suggests staff may be reluctant to report — this is a red flag for Ofsted.",
      severity: "critical",
    });
  }

  if (unresolvedCritical.length > 0) {
    insights.push({
      text: `${unresolvedCritical.length} critical-severity concern${unresolvedCritical.length > 1 ? "s remain" : " remains"} unresolved. Ofsted will view this as a serious governance failure requiring immediate leadership attention.`,
      severity: "critical",
    });
  }

  // Cap at 3
  const finalInsights = insights.slice(0, 3);

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding whistleblowing transparency — ${staffConfidenceRate}% staff confidence, ${policyAwarenessRate}% policy awareness.`;
  } else if (rating === "good") {
    headline = `Good whistleblowing transparency — staff are generally confident and aware, with minor gaps to address.`;
  } else if (rating === "adequate") {
    headline =
      "Adequate whistleblowing transparency — gaps in confidence, awareness, or resolution need attention.";
  } else {
    headline =
      "Whistleblowing transparency is inadequate — significant weaknesses in staff confidence, policy awareness, or concern resolution.";
  }

  return {
    whistleblowing_rating: rating,
    whistleblowing_score: score,
    headline,
    total_concerns: totalConcerns,
    open_concerns: openConcerns,
    resolution_rate: resolutionRate,
    lessons_learned_rate: lessonsLearnedRate,
    staff_confidence_rate: staffConfidenceRate,
    strengths,
    concerns,
    recommendations: finalRecs,
    insights: finalInsights,
  };
}
