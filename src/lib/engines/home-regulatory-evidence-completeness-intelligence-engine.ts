// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME REGULATORY EVIDENCE COMPLETENESS INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Cross-domain composite assessing whether the home has sufficient documented
// evidence across all regulatory domains to survive an Ofsted inspection.
// Combines filing cabinet, documents, risk assessments, and incidents to
// identify evidence gaps.
//
// Regulatory: CHR 2015 Reg 36 (Records), Reg 13 (Leadership & Management),
// SCCIF framework (evidence and record-keeping expectations).
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FilingItemInput {
  id: string;
  category: string;
  child_id: string | null;
  is_verified: boolean;
  has_description: boolean;
  source_type: string;
  filed_at: string;
}

export interface DocumentInput {
  id: string;
  category: string;
  status: string;
  has_review_date: boolean;
  review_date: string | null;
  is_signed: boolean;
  child_id: string | null;
  created_at: string;
}

export interface RiskAssessmentInput {
  id: string;
  child_id: string | null;
  category: string;
  status: string;
  last_reviewed: string | null;
  has_mitigations: boolean;
  mitigations_count: number;
  risk_level: string;
  created_at: string;
}

export interface IncidentEvidenceInput {
  id: string;
  child_id: string | null;
  date: string;
  severity: string;
  has_report: boolean;
  has_follow_up: boolean;
  has_notification: boolean;
  has_debrief: boolean;
}

export interface RegulatoryEvidenceCompletenessInput {
  today: string;
  total_children: number;
  total_staff: number;
  filing_items: FilingItemInput[];
  documents: DocumentInput[];
  risk_assessments: RiskAssessmentInput[];
  incidents: IncidentEvidenceInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RegulatoryEvidenceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RegulatoryEvidenceCompletenessResult {
  evidence_rating: RegulatoryEvidenceRating;
  evidence_score: number;
  headline: string;
  total_evidence_items: number;
  filing_verified_rate: number;
  filing_described_rate: number;
  document_currency_rate: number;
  document_signed_rate: number;
  risk_assessment_currency_rate: number;
  risk_mitigation_rate: number;
  incident_report_rate: number;
  incident_follow_up_rate: number;
  high_severity_notification_rate: number;
  evidence_category_coverage: number;
  child_evidence_coverage_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref?: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function ratingFromScore(score: number): RegulatoryEvidenceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function headlineFor(rating: RegulatoryEvidenceRating): string {
  switch (rating) {
    case "outstanding":
      return "Regulatory evidence is comprehensive and well-organised across all domains";
    case "good":
      return "Regulatory evidence is largely in place with minor gaps to address";
    case "adequate":
      return "Regulatory evidence has notable gaps that require attention before inspection";
    case "inadequate":
      return "Significant regulatory evidence gaps that would likely attract regulatory criticism";
    case "insufficient_data":
      return "No evidence data available to assess regulatory compliance";
  }
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeRegulatoryEvidenceCompleteness(
  input: RegulatoryEvidenceCompletenessInput,
): RegulatoryEvidenceCompletenessResult {
  const {
    total_children,
    total_staff,
    filing_items,
    documents,
    risk_assessments,
    incidents,
  } = input;

  const allEmpty =
    filing_items.length === 0 &&
    documents.length === 0 &&
    risk_assessments.length === 0 &&
    incidents.length === 0;

  // ── Special case: all inputs empty ────────────────────────────────────
  if (allEmpty && (total_children > 0 || total_staff > 0)) {
    return {
      evidence_rating: "inadequate",
      evidence_score: 15,
      headline: headlineFor("inadequate"),
      total_evidence_items: 0,
      filing_verified_rate: 0,
      filing_described_rate: 0,
      document_currency_rate: 0,
      document_signed_rate: 0,
      risk_assessment_currency_rate: 0,
      risk_mitigation_rate: 0,
      incident_report_rate: 0,
      incident_follow_up_rate: 0,
      high_severity_notification_rate: 0,
      evidence_category_coverage: 0,
      child_evidence_coverage_rate: 0,
      strengths: [],
      concerns: [
        "No regulatory evidence recorded despite active home with children/staff",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Urgently establish a filing and documentation system to capture regulatory evidence",
          urgency: "immediate",
          regulatory_ref: "Reg 36",
        },
      ],
      insights: [
        {
          text: "Home has no documented evidence — this would result in immediate regulatory action",
          severity: "critical",
        },
      ],
    };
  }

  if (allEmpty && total_children === 0 && total_staff === 0) {
    return {
      evidence_rating: "insufficient_data",
      evidence_score: 0,
      headline: headlineFor("insufficient_data"),
      total_evidence_items: 0,
      filing_verified_rate: 0,
      filing_described_rate: 0,
      document_currency_rate: 0,
      document_signed_rate: 0,
      risk_assessment_currency_rate: 0,
      risk_mitigation_rate: 0,
      incident_report_rate: 0,
      incident_follow_up_rate: 0,
      high_severity_notification_rate: 0,
      evidence_category_coverage: 0,
      child_evidence_coverage_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [
        {
          text: "No data available to assess regulatory evidence completeness",
          severity: "warning",
        },
      ],
    };
  }

  // ── Filing rates ──────────────────────────────────────────────────────
  const filingVerifiedCount = filing_items.filter((f) => f.is_verified).length;
  const filingDescribedCount = filing_items.filter(
    (f) => f.has_description,
  ).length;
  const filingVerifiedRate = pct(filingVerifiedCount, filing_items.length);
  const filingDescribedRate = pct(filingDescribedCount, filing_items.length);

  // ── Document rates ────────────────────────────────────────────────────
  const currentDocs = documents.filter((d) => d.status === "current");
  const signedDocs = documents.filter((d) => d.is_signed);
  const documentCurrencyRate = pct(currentDocs.length, documents.length);
  const documentSignedRate = pct(signedDocs.length, documents.length);

  // ── Risk assessment rates ─────────────────────────────────────────────
  const currentRAs = risk_assessments.filter((r) => r.status === "current");
  const rasWithMitigations = risk_assessments.filter(
    (r) => r.has_mitigations,
  );
  const raCurrencyRate = pct(currentRAs.length, risk_assessments.length);
  const raMitigationRate = pct(
    rasWithMitigations.length,
    risk_assessments.length,
  );

  // ── Incident rates ────────────────────────────────────────────────────
  const incidentsWithReport = incidents.filter((i) => i.has_report);
  const incidentsWithFollowUp = incidents.filter((i) => i.has_follow_up);
  const highSeverityIncidents = incidents.filter(
    (i) => i.severity === "high" || i.severity === "critical",
  );
  const highSevWithNotification = highSeverityIncidents.filter(
    (i) => i.has_notification,
  );
  const incidentReportRate = pct(incidentsWithReport.length, incidents.length);
  const incidentFollowUpRate = pct(
    incidentsWithFollowUp.length,
    incidents.length,
  );
  const highSevNotificationRate = pct(
    highSevWithNotification.length,
    highSeverityIncidents.length,
  );

  // ── Category coverage ─────────────────────────────────────────────────
  const categorySet = new Set<string>();
  for (const f of filing_items) categorySet.add(`filing:${f.category}`);
  for (const d of documents) categorySet.add(`doc:${d.category}`);
  const evidenceCategoryCoverage = categorySet.size;

  // ── Child evidence coverage ───────────────────────────────────────────
  const childrenWithEvidence = new Set<string>();
  for (const f of filing_items) {
    if (f.child_id) childrenWithEvidence.add(f.child_id);
  }
  for (const d of documents) {
    if (d.child_id) childrenWithEvidence.add(d.child_id);
  }
  for (const r of risk_assessments) {
    if (r.child_id) childrenWithEvidence.add(r.child_id);
  }
  for (const i of incidents) {
    if (i.child_id) childrenWithEvidence.add(i.child_id);
  }
  const childEvidenceCoverageRate = pct(
    childrenWithEvidence.size,
    total_children,
  );

  // ── Total evidence items ──────────────────────────────────────────────
  const totalEvidenceItems = filing_items.length + documents.length;

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 52;

  // Bonuses
  if (filingVerifiedRate >= 90) score += 4;
  else if (filingVerifiedRate >= 75) score += 2;

  if (filingDescribedRate >= 95) score += 3;
  else if (filingDescribedRate >= 80) score += 1;

  if (documentCurrencyRate >= 95) score += 4;
  else if (documentCurrencyRate >= 80) score += 2;

  if (documentSignedRate >= 90) score += 3;
  else if (documentSignedRate >= 75) score += 1;

  if (raCurrencyRate >= 90) score += 4;
  else if (raCurrencyRate >= 75) score += 2;

  if (raMitigationRate >= 100) score += 3;
  else if (raMitigationRate >= 80) score += 1;

  if (incidentReportRate >= 100) score += 3;
  else if (incidentReportRate >= 85) score += 1;

  if (incidentFollowUpRate >= 90) score += 2;
  else if (incidentFollowUpRate >= 75) score += 1;

  if (highSevNotificationRate >= 100) score += 2;

  if (childEvidenceCoverageRate >= 100) score += 2;
  else if (childEvidenceCoverageRate >= 80) score += 1;

  // Penalties
  if (filingVerifiedRate < 40) score -= 5;
  if (raCurrencyRate < 50) score -= 5;
  if (incidentReportRate < 50) score -= 5;
  if (highSevNotificationRate < 50) score -= 8;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  const rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (filingVerifiedRate >= 90)
    strengths.push("Filing verification rate is excellent");
  if (filingDescribedRate >= 95)
    strengths.push("Filing descriptions are thorough and comprehensive");
  if (documentCurrencyRate >= 95)
    strengths.push("Document currency is outstanding — nearly all are current");
  if (documentSignedRate >= 90)
    strengths.push("Document signing rate demonstrates strong governance");
  if (raCurrencyRate >= 90)
    strengths.push("Risk assessments are well-maintained and current");
  if (raMitigationRate >= 100)
    strengths.push(
      "All risk assessments have documented mitigations in place",
    );
  if (incidentReportRate >= 100)
    strengths.push("Every incident has a completed report");
  if (incidentFollowUpRate >= 90)
    strengths.push("Incident follow-up rate is excellent");
  if (highSevNotificationRate >= 100)
    strengths.push(
      "All high-severity incidents have appropriate notifications recorded",
    );
  if (childEvidenceCoverageRate >= 100)
    strengths.push("Every child has at least one piece of evidence on file");
  if (evidenceCategoryCoverage >= 10)
    strengths.push(
      "Evidence spans a wide range of categories, demonstrating breadth of recording",
    );

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (filingVerifiedRate < 40)
    concerns.push(
      "Filing verification rate is critically low — most items are unverified",
    );
  else if (filingVerifiedRate < 75)
    concerns.push(
      "Filing verification rate is below expectations — many items are unverified",
    );

  if (filingDescribedRate < 50)
    concerns.push(
      "Majority of filing items lack descriptions, reducing evidence value",
    );

  if (documentCurrencyRate < 50)
    concerns.push(
      "Over half of documents are not current — significant currency gap",
    );
  else if (documentCurrencyRate < 80)
    concerns.push("Document currency rate is below the expected standard");

  if (documentSignedRate < 50)
    concerns.push(
      "Most documents are unsigned, undermining accountability and governance",
    );

  if (raCurrencyRate < 50)
    concerns.push(
      "Risk assessment currency is critically low — most are overdue or archived",
    );
  else if (raCurrencyRate < 75)
    concerns.push("Too many risk assessments are not current");

  if (raMitigationRate < 50)
    concerns.push(
      "Most risk assessments lack documented mitigations — significant safeguarding gap",
    );

  if (incidentReportRate < 50)
    concerns.push(
      "Over half of incidents lack written reports — critical evidence gap",
    );
  else if (incidentReportRate < 85)
    concerns.push(
      "Some incidents are missing completed reports",
    );

  if (incidentFollowUpRate < 50)
    concerns.push(
      "Most incidents lack follow-up actions, suggesting poor learning from events",
    );

  if (highSevNotificationRate < 50)
    concerns.push(
      "High-severity incidents are not being notified to regulators — serious compliance failure",
    );

  if (childEvidenceCoverageRate < 50 && total_children > 0)
    concerns.push(
      "Less than half of children have any evidence on file",
    );

  if (evidenceCategoryCoverage < 3 && totalEvidenceItems > 0)
    concerns.push(
      "Evidence covers very few categories, suggesting significant recording gaps",
    );

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref?: string;
  }[] = [];
  let rank = 0;

  if (highSevNotificationRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately review notification procedures for high-severity incidents to ensure Ofsted/LA are informed",
      urgency: "immediate",
      regulatory_ref: "Reg 40",
    });
  }

  if (incidentReportRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address the incident reporting gap — all incidents must have completed written reports",
      urgency: "immediate",
      regulatory_ref: "Reg 36",
    });
  }

  if (raCurrencyRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and update all risk assessments as a priority — most are overdue or archived",
      urgency: "immediate",
      regulatory_ref: "Reg 12",
    });
  }

  if (filingVerifiedRate < 40) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a verification process for filing items to ensure accuracy and completeness",
      urgency: "immediate",
      regulatory_ref: "Reg 36",
    });
  }

  if (documentCurrencyRate < 80 && documentCurrencyRate >= 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review expired and draft documents to bring them to current status",
      urgency: "soon",
      regulatory_ref: "Reg 36",
    });
  }

  if (documentSignedRate < 75) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all key documents are signed to demonstrate accountability",
      urgency: "soon",
      regulatory_ref: "Reg 13",
    });
  }

  if (incidentFollowUpRate < 75) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen incident follow-up processes to ensure learning from every event",
      urgency: "soon",
      regulatory_ref: "Reg 13",
    });
  }

  if (raMitigationRate < 80 && raMitigationRate >= 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Add documented mitigations to risk assessments that currently lack them",
      urgency: "soon",
      regulatory_ref: "Reg 12",
    });
  }

  if (
    childEvidenceCoverageRate < 80 &&
    childEvidenceCoverageRate >= 50 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child has at least one piece of evidence on file",
      urgency: "soon",
      regulatory_ref: "Reg 36",
    });
  }

  if (filingDescribedRate < 80 && filingDescribedRate >= 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve filing descriptions so evidence is meaningful and searchable",
      urgency: "planned",
      regulatory_ref: "Reg 36",
    });
  }

  if (evidenceCategoryCoverage < 5 && totalEvidenceItems > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Broaden evidence coverage to include more regulatory categories",
      urgency: "planned",
      regulatory_ref: "Reg 36",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: { text: string; severity: "critical" | "warning" | "positive" }[] = [];

  // Critical insights
  if (highSevNotificationRate < 50 && highSeverityIncidents.length > 0) {
    insights.push({
      text: `Only ${highSevNotificationRate}% of high-severity incidents have regulatory notifications — this is a serious compliance breach`,
      severity: "critical",
    });
  }

  if (incidentReportRate < 50 && incidents.length > 0) {
    insights.push({
      text: `Only ${incidentReportRate}% of incidents have written reports — inspectors would view this as a significant failing`,
      severity: "critical",
    });
  }

  if (raCurrencyRate < 50 && risk_assessments.length > 0) {
    insights.push({
      text: `Only ${raCurrencyRate}% of risk assessments are current — this undermines safeguarding assurance`,
      severity: "critical",
    });
  }

  if (filingVerifiedRate < 40 && filing_items.length > 0) {
    insights.push({
      text: `Filing verification rate of ${filingVerifiedRate}% means most evidence is unconfirmed`,
      severity: "critical",
    });
  }

  // Warning insights
  if (
    documentCurrencyRate < 80 &&
    documentCurrencyRate >= 50 &&
    documents.length > 0
  ) {
    insights.push({
      text: `Document currency rate of ${documentCurrencyRate}% indicates a backlog of reviews needed`,
      severity: "warning",
    });
  }

  if (
    incidentFollowUpRate < 75 &&
    incidentFollowUpRate >= 50 &&
    incidents.length > 0
  ) {
    insights.push({
      text: `Incident follow-up rate of ${incidentFollowUpRate}% suggests learning from events could be stronger`,
      severity: "warning",
    });
  }

  if (
    childEvidenceCoverageRate < 80 &&
    childEvidenceCoverageRate >= 50 &&
    total_children > 0
  ) {
    insights.push({
      text: `${childEvidenceCoverageRate}% of children have evidence on file — aim for full coverage`,
      severity: "warning",
    });
  }

  if (
    filingDescribedRate < 80 &&
    filingDescribedRate >= 50 &&
    filing_items.length > 0
  ) {
    insights.push({
      text: `${filingDescribedRate}% of filing items have descriptions — this weakens the quality of evidence`,
      severity: "warning",
    });
  }

  if (
    raMitigationRate < 80 &&
    raMitigationRate >= 50 &&
    risk_assessments.length > 0
  ) {
    insights.push({
      text: `Only ${raMitigationRate}% of risk assessments have mitigations documented`,
      severity: "warning",
    });
  }

  // Positive insights
  if (score >= 80) {
    insights.push({
      text: "Evidence base is comprehensive and well-organised — the home is well-prepared for inspection",
      severity: "positive",
    });
  }

  if (
    filingVerifiedRate >= 90 &&
    documentCurrencyRate >= 95 &&
    raCurrencyRate >= 90
  ) {
    insights.push({
      text: "Core evidence pillars (filing, documents, risk assessments) are all in excellent shape",
      severity: "positive",
    });
  }

  if (
    incidentReportRate >= 100 &&
    incidentFollowUpRate >= 90 &&
    incidents.length > 0
  ) {
    insights.push({
      text: "Incident management is thorough with strong reporting and follow-up practices",
      severity: "positive",
    });
  }

  if (childEvidenceCoverageRate >= 100 && total_children > 0) {
    insights.push({
      text: "Every child has evidence on record, demonstrating individualised care recording",
      severity: "positive",
    });
  }

  if (evidenceCategoryCoverage >= 10) {
    insights.push({
      text: `Evidence spans ${evidenceCategoryCoverage} categories, showing breadth of regulatory compliance recording`,
      severity: "positive",
    });
  }

  return {
    evidence_rating: rating,
    evidence_score: score,
    headline: headlineFor(rating),
    total_evidence_items: totalEvidenceItems,
    filing_verified_rate: filingVerifiedRate,
    filing_described_rate: filingDescribedRate,
    document_currency_rate: documentCurrencyRate,
    document_signed_rate: documentSignedRate,
    risk_assessment_currency_rate: raCurrencyRate,
    risk_mitigation_rate: raMitigationRate,
    incident_report_rate: incidentReportRate,
    incident_follow_up_rate: incidentFollowUpRate,
    high_severity_notification_rate: highSevNotificationRate,
    evidence_category_coverage: evidenceCategoryCoverage,
    child_evidence_coverage_rate: childEvidenceCoverageRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
