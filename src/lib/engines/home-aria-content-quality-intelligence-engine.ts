// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ARIA CONTENT QUALITY INTELLIGENCE ENGINE
// Home-level: aggregates ARIA artifacts (AI-assisted content drafts for care
// records) to assess quality, governance, and effectiveness of AI-assisted
// content generation. Tracks review turnaround, approval rates, quality scores,
// safeguarding awareness, and framework diversity.
// CHR 2015 Reg 36 (Record Keeping), Reg 12 (Duty of Care).
// SCCIF: "Well-Led", "Quality of Care."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AriaArtifactInput {
  id: string;
  artifact_type: string; // "keywork_session" | "care_plan" | "risk_assessment" | "daily_summary" | "incident_report" | "review_report" | "direct_work" | "formulation"
  status: string; // "draft" | "submitted" | "reviewed" | "approved" | "rejected" | "committed"
  child_id: string | null;
  staff_id: string | null;
  framework: string | null; // "pace" | "dsdp" | "tbri" | "theraplay" | "none" | null
  quality_score: number; // 0-100
  evidence_confidence_score: number; // 0-100
  safeguarding_level: string; // "none" | "low" | "medium" | "high" | "critical"
  created_at: string; // ISO
  submitted_for_review_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  has_structured_content: boolean;
  has_plain_text: boolean;
  source_ids_count: number; // how many evidence sources were used
}

export interface AriaContentQualityInput {
  today: string;
  total_staff: number;
  total_children: number;
  artifacts: AriaArtifactInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AriaContentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AriaContentQualityResult {
  content_rating: AriaContentRating;
  content_score: number; // 0-100
  headline: string;
  total_artifacts: number;
  approval_rate: number; // % of submitted artifacts that got approved
  rejection_rate: number; // % of submitted artifacts that got rejected
  average_quality_score: number; // avg quality_score across all artifacts
  average_evidence_confidence: number; // avg evidence_confidence_score
  review_turnaround_hours: number; // avg hours from submitted to reviewed
  safeguarding_flagged_rate: number; // % of artifacts with safeguarding_level != "none"
  framework_usage_rate: number; // % of artifacts with a framework set (not null/none)
  framework_diversity: number; // distinct frameworks used
  artifact_type_diversity: number; // distinct artifact types
  evidence_sourced_rate: number; // % of artifacts with source_ids_count > 0
  child_coverage_rate: number; // % of children with at least one artifact
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref?: string }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function toRating(score: number): AriaContentRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function hoursBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, diff / (1000 * 60 * 60));
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeAriaContentQuality(
  input: AriaContentQualityInput,
): AriaContentQualityResult {
  const { total_staff, total_children, artifacts } = input;

  // ── Special case: 0 artifacts AND no staff AND no children → insufficient_data
  if (artifacts.length === 0 && total_staff === 0 && total_children === 0) {
    return {
      content_rating: "insufficient_data",
      content_score: 0,
      headline: "No home data available — ARIA content quality cannot be assessed.",
      total_artifacts: 0,
      approval_rate: 0,
      rejection_rate: 0,
      average_quality_score: 0,
      average_evidence_confidence: 0,
      review_turnaround_hours: 0,
      safeguarding_flagged_rate: 0,
      framework_usage_rate: 0,
      framework_diversity: 0,
      artifact_type_diversity: 0,
      evidence_sourced_rate: 0,
      child_coverage_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [{ text: "No staff or children registered and no ARIA artifacts exist. Content quality assessment requires an active home.", severity: "warning" }],
    };
  }

  // ── Special case: 0 artifacts but home is active
  if (artifacts.length === 0) {
    return {
      content_rating: "good",
      content_score: 72,
      headline: "ARIA not yet adopted — no AI-assisted content generated",
      total_artifacts: 0,
      approval_rate: 0,
      rejection_rate: 0,
      average_quality_score: 0,
      average_evidence_confidence: 0,
      review_turnaround_hours: 0,
      safeguarding_flagged_rate: 0,
      framework_usage_rate: 0,
      framework_diversity: 0,
      artifact_type_diversity: 0,
      evidence_sourced_rate: 0,
      child_coverage_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [
        {
          rank: 1,
          recommendation: "Consider adopting ARIA for AI-assisted content generation to support recording quality and reduce administrative burden on staff.",
          urgency: "planned",
          regulatory_ref: "CHR 2015 Reg 36",
        },
      ],
      insights: [{ text: "ARIA has not yet been used in this home. AI-assisted content generation can improve recording quality and free staff time for direct care.", severity: "warning" }],
    };
  }

  // ── Compute Metrics ─────────────────────────────────────────────────────

  const totalArtifacts = artifacts.length;

  // Submitted artifacts: those that have progressed past draft (submitted, reviewed, approved, rejected, committed)
  const submittedArtifacts = artifacts.filter(a => a.status !== "draft");
  const approvedArtifacts = artifacts.filter(a => a.status === "approved" || a.status === "committed");
  const rejectedArtifacts = artifacts.filter(a => a.status === "rejected");

  const approvalRate = pct(approvedArtifacts.length, submittedArtifacts.length);
  const rejectionRate = pct(rejectedArtifacts.length, submittedArtifacts.length);

  // Average quality score across all artifacts
  const avgQuality = totalArtifacts === 0
    ? 0
    : Math.round(artifacts.reduce((sum, a) => sum + a.quality_score, 0) / totalArtifacts);

  // Average evidence confidence across all artifacts
  const avgEvidence = totalArtifacts === 0
    ? 0
    : Math.round(artifacts.reduce((sum, a) => sum + a.evidence_confidence_score, 0) / totalArtifacts);

  // Review turnaround hours
  const turnaroundPairs = artifacts.filter(
    a => a.submitted_for_review_at !== null && a.reviewed_at !== null,
  );
  const reviewTurnaroundHours =
    turnaroundPairs.length === 0
      ? 0
      : Math.round(
          (turnaroundPairs.reduce(
            (sum, a) => sum + hoursBetween(a.submitted_for_review_at!, a.reviewed_at!),
            0,
          ) /
            turnaroundPairs.length) *
            10,
        ) / 10;

  // Safeguarding flagged rate
  const safeguardingFlagged = artifacts.filter(a => a.safeguarding_level !== "none");
  const safeguardingFlaggedRate = pct(safeguardingFlagged.length, totalArtifacts);

  // Framework usage rate
  const withFramework = artifacts.filter(a => a.framework !== null && a.framework !== "none");
  const frameworkUsageRate = pct(withFramework.length, totalArtifacts);

  // Framework diversity (distinct frameworks, excluding null/"none")
  const uniqueFrameworks = new Set(
    artifacts
      .map(a => a.framework)
      .filter((f): f is string => f !== null && f !== "none"),
  );
  const frameworkDiversity = uniqueFrameworks.size;

  // Artifact type diversity
  const uniqueTypes = new Set(artifacts.map(a => a.artifact_type));
  const artifactTypeDiversity = uniqueTypes.size;

  // Evidence sourced rate
  const evidenceSourced = artifacts.filter(a => a.source_ids_count > 0);
  const evidenceSourcedRate = pct(evidenceSourced.length, totalArtifacts);

  // Child coverage rate
  const childrenWithArtifact = new Set(
    artifacts.map(a => a.child_id).filter((id): id is string => id !== null),
  );
  const childCoverageRate = pct(childrenWithArtifact.size, total_children);

  // ── Scoring: Base 52 + modifiers ──────────────────────────────────────

  let score = 52;

  // Bonus: average_quality_score
  if (avgQuality >= 80) score += 5;
  else if (avgQuality >= 65) score += 3;

  // Bonus: approval_rate
  if (approvalRate >= 90) score += 5;
  else if (approvalRate >= 75) score += 3;

  // Bonus: average_evidence_confidence
  if (avgEvidence >= 75) score += 4;
  else if (avgEvidence >= 60) score += 2;

  // Bonus: framework_usage_rate
  if (frameworkUsageRate >= 80) score += 3;
  else if (frameworkUsageRate >= 50) score += 1;

  // Bonus: evidence_sourced_rate
  if (evidenceSourcedRate >= 90) score += 3;
  else if (evidenceSourcedRate >= 70) score += 1;

  // Bonus: child_coverage_rate
  if (childCoverageRate >= 80) score += 3;
  else if (childCoverageRate >= 50) score += 1;

  // Bonus: framework_diversity
  if (frameworkDiversity >= 3) score += 3;
  else if (frameworkDiversity >= 2) score += 1;

  // Bonus: artifact_type_diversity
  if (artifactTypeDiversity >= 4) score += 2;
  else if (artifactTypeDiversity >= 2) score += 1;

  // Penalty: rejection_rate
  if (rejectionRate > 30) score -= 5;

  // Penalty: average_quality_score
  if (avgQuality < 40) score -= 5;

  // Penalty: average_evidence_confidence
  if (avgEvidence < 30) score -= 3;

  // Penalty: safeguarding concern (high flagged rate + low approval)
  if (safeguardingFlaggedRate > 50 && approvalRate < 60) score -= 5;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;
  if (rating === "outstanding") {
    headline = "ARIA content quality is outstanding — AI-assisted drafts are high quality and well-governed.";
  } else if (rating === "good") {
    headline = "ARIA content quality is good — AI-assisted content generation is effective with minor areas for improvement.";
  } else if (rating === "adequate") {
    headline = "ARIA content quality is adequate — AI-assisted content meets minimum standards but needs strengthening.";
  } else {
    headline = "ARIA content quality is inadequate — significant concerns with AI-assisted content quality and governance.";
  }

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (avgQuality >= 80) {
    strengths.push(`Average quality score of ${avgQuality}% — ARIA-generated content is consistently high quality.`);
  } else if (avgQuality >= 65) {
    strengths.push(`Average quality score of ${avgQuality}% — ARIA-generated content meets good quality standards.`);
  }

  if (approvalRate >= 90 && submittedArtifacts.length > 0) {
    strengths.push(`${approvalRate}% approval rate — AI-assisted drafts are being approved at an excellent rate.`);
  } else if (approvalRate >= 75 && submittedArtifacts.length > 0) {
    strengths.push(`${approvalRate}% approval rate — most AI-assisted drafts are being approved after review.`);
  }

  if (avgEvidence >= 75) {
    strengths.push(`Evidence confidence averaging ${avgEvidence}% — ARIA content is well-grounded in source evidence.`);
  } else if (avgEvidence >= 60) {
    strengths.push(`Evidence confidence averaging ${avgEvidence}% — ARIA content has reasonable evidence backing.`);
  }

  if (frameworkUsageRate >= 80) {
    strengths.push(`${frameworkUsageRate}% of artifacts use a therapeutic framework — strong alignment with therapeutic care models.`);
  } else if (frameworkUsageRate >= 50) {
    strengths.push(`${frameworkUsageRate}% of artifacts use a therapeutic framework — good integration of care models.`);
  }

  if (evidenceSourcedRate >= 90) {
    strengths.push(`${evidenceSourcedRate}% of artifacts are evidence-sourced — excellent traceability to source records.`);
  } else if (evidenceSourcedRate >= 70) {
    strengths.push(`${evidenceSourcedRate}% of artifacts are evidence-sourced — good traceability to source records.`);
  }

  if (childCoverageRate >= 80) {
    strengths.push(`${childCoverageRate}% child coverage — ARIA is being used for most children in the home.`);
  }

  if (frameworkDiversity >= 3) {
    strengths.push(`${frameworkDiversity} distinct therapeutic frameworks in use — rich diversity of approaches.`);
  }

  if (artifactTypeDiversity >= 4) {
    strengths.push(`${artifactTypeDiversity} distinct artifact types — ARIA is being used across a broad range of record types.`);
  }

  if (reviewTurnaroundHours > 0 && reviewTurnaroundHours <= 24) {
    strengths.push(`Average review turnaround of ${reviewTurnaroundHours} hours — prompt governance of AI-assisted content.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (avgQuality < 40) {
    concerns.push(`Average quality score of ${avgQuality}% is below acceptable standards — AI-generated content requires significant improvement before it supports care governance.`);
  } else if (avgQuality < 65) {
    concerns.push(`Average quality score of ${avgQuality}% — AI-generated content quality is below the expected good standard.`);
  }

  if (rejectionRate > 30 && submittedArtifacts.length > 0) {
    concerns.push(`${rejectionRate}% rejection rate — a significant proportion of AI-assisted drafts are not meeting review standards.`);
  }

  if (avgEvidence < 30) {
    concerns.push(`Evidence confidence averaging only ${avgEvidence}% — ARIA content is not well-supported by source evidence, raising reliability concerns.`);
  } else if (avgEvidence < 60) {
    concerns.push(`Evidence confidence averaging ${avgEvidence}% — ARIA content evidence backing needs strengthening.`);
  }

  if (safeguardingFlaggedRate > 50 && approvalRate < 60) {
    concerns.push(`${safeguardingFlaggedRate}% of artifacts flagged for safeguarding but only ${approvalRate}% approved — safeguarding-related AI content is not being adequately validated.`);
  }

  if (frameworkUsageRate < 30) {
    concerns.push(`Only ${frameworkUsageRate}% of artifacts use a therapeutic framework — AI-generated content is not consistently aligned with the home's therapeutic approach.`);
  }

  if (evidenceSourcedRate < 50) {
    concerns.push(`Only ${evidenceSourcedRate}% of artifacts are evidence-sourced — a majority of AI-generated content lacks traceable evidence links.`);
  }

  if (childCoverageRate < 50 && total_children > 0) {
    concerns.push(`Only ${childCoverageRate}% child coverage — ARIA is not being used for most children, creating inconsistent recording quality.`);
  }

  if (reviewTurnaroundHours > 72) {
    concerns.push(`Average review turnaround of ${reviewTurnaroundHours} hours — AI-assisted content is not being reviewed promptly, risking governance gaps.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref?: string }[] = [];
  let rank = 0;

  if (avgQuality < 40) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Urgently review ARIA prompt configuration and quality thresholds — current AI-generated content does not meet minimum quality standards for care records.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  } else if (avgQuality < 65) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review ARIA content generation settings to improve output quality — current drafts are below good standard.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  }

  if (rejectionRate > 30 && submittedArtifacts.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Investigate high rejection rate of AI-assisted drafts — review common rejection reasons and refine ARIA generation to reduce rework.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  }

  if (avgEvidence < 30) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Increase evidence source linking in ARIA configurations — AI-generated content must be grounded in recorded evidence to support inspection readiness.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  } else if (avgEvidence < 60) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Strengthen evidence confidence in ARIA-generated content by increasing source linking requirements.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  }

  if (safeguardingFlaggedRate > 50 && approvalRate < 60) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Prioritise review and approval of safeguarding-flagged ARIA content — safeguarding records require timely governance to protect children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (frameworkUsageRate < 30) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Configure ARIA to align with the home's therapeutic frameworks — AI-generated content should consistently reference the care model.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (evidenceSourcedRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure ARIA draws from evidence sources when generating content — unsourced AI content undermines recording integrity.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  }

  if (childCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Expand ARIA usage to cover all children in the home — inconsistent AI-assisted recording creates uneven care documentation.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  }

  if (reviewTurnaroundHours > 72) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Reduce review turnaround time for ARIA-generated content — delays in governance of AI-assisted records risk information becoming stale.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  }

  if (recommendations.length === 0 && rating !== "outstanding") {
    recommendations.push({
      rank: 1,
      recommendation: "Continue monitoring ARIA content quality metrics and refine generation settings as the home's needs evolve.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: { text: string; severity: "critical" | "warning" | "positive" }[] = [];

  if (avgQuality < 40) {
    insights.push({
      text: `Average quality score is ${avgQuality}% — AI-generated content is below acceptable standards and should not be relied upon for care governance without significant manual revision.`,
      severity: "critical",
    });
  }

  if (rejectionRate > 30 && submittedArtifacts.length > 0) {
    insights.push({
      text: `${rejectionRate}% of submitted AI drafts are being rejected — this suggests ARIA configuration needs attention to reduce staff rework burden.`,
      severity: "critical",
    });
  }

  if (avgEvidence < 30) {
    insights.push({
      text: `Evidence confidence is critically low at ${avgEvidence}% — ARIA content lacks adequate source evidence, undermining the reliability of AI-assisted records.`,
      severity: "critical",
    });
  }

  if (safeguardingFlaggedRate > 50 && approvalRate < 60) {
    insights.push({
      text: `High safeguarding flagging (${safeguardingFlaggedRate}%) combined with low approval (${approvalRate}%) indicates safeguarding-related AI content is not being adequately governed.`,
      severity: "critical",
    });
  }

  if (reviewTurnaroundHours > 72) {
    insights.push({
      text: `Review turnaround averages ${reviewTurnaroundHours} hours — AI-assisted content is not being governed promptly.`,
      severity: "warning",
    });
  } else if (reviewTurnaroundHours > 48) {
    insights.push({
      text: `Review turnaround averages ${reviewTurnaroundHours} hours — consider streamlining the review process for AI-assisted drafts.`,
      severity: "warning",
    });
  }

  if (frameworkUsageRate < 30) {
    insights.push({
      text: `Only ${frameworkUsageRate}% of AI-generated content references a therapeutic framework. Ofsted expects care to be informed by the home's stated model.`,
      severity: "warning",
    });
  }

  if (childCoverageRate < 50 && total_children > 0) {
    insights.push({
      text: `ARIA is only being used for ${childCoverageRate}% of children — recording quality may be inconsistent across the home.`,
      severity: "warning",
    });
  }

  if (avgQuality >= 80 && approvalRate >= 90 && submittedArtifacts.length > 0) {
    insights.push({
      text: `Excellent combination of high quality (${avgQuality}%) and high approval (${approvalRate}%) — ARIA is delivering reliable, governance-ready content.`,
      severity: "positive",
    });
  } else if (avgQuality >= 65 && approvalRate >= 75 && submittedArtifacts.length > 0) {
    insights.push({
      text: `Good quality (${avgQuality}%) and approval rate (${approvalRate}%) — ARIA is performing well as a content generation tool.`,
      severity: "positive",
    });
  }

  if (frameworkDiversity >= 3) {
    insights.push({
      text: `${frameworkDiversity} therapeutic frameworks are being used across ARIA content — demonstrating a rich, multi-model approach to care.`,
      severity: "positive",
    });
  }

  if (evidenceSourcedRate >= 90) {
    insights.push({
      text: `${evidenceSourcedRate}% of artifacts are grounded in source evidence — excellent traceability supports inspection readiness.`,
      severity: "positive",
    });
  }

  if (childCoverageRate >= 80 && total_children > 0) {
    insights.push({
      text: `${childCoverageRate}% child coverage — ARIA is being used consistently across the home for most children.`,
      severity: "positive",
    });
  }

  return {
    content_rating: rating,
    content_score: score,
    headline,
    total_artifacts: totalArtifacts,
    approval_rate: approvalRate,
    rejection_rate: rejectionRate,
    average_quality_score: avgQuality,
    average_evidence_confidence: avgEvidence,
    review_turnaround_hours: reviewTurnaroundHours,
    safeguarding_flagged_rate: safeguardingFlaggedRate,
    framework_usage_rate: frameworkUsageRate,
    framework_diversity: frameworkDiversity,
    artifact_type_diversity: artifactTypeDiversity,
    evidence_sourced_rate: evidenceSourcedRate,
    child_coverage_rate: childCoverageRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
