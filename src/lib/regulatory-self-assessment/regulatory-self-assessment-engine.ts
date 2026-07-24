// ══════════════════════════════════════════════════════════════════════════════
// Cara Regulatory Self-Assessment Intelligence Engine
//
// Deterministic engine for analysing how effectively a children's home
// self-assesses compliance against the Children's Homes (England)
// Regulations 2015 and the SCCIF.
//
// Aligned to:
//   - CHR 2015 Reg 45 — Review of quality of care
//   - SCCIF — Social Care Common Inspection Framework
//   - Guide to the Children's Homes Regulations 2015
//   - CHR 2015 Reg 44 — Independent person: visiting
//
// Scoring model (assessment_coverage 25 + compliance_quality 25 +
//   evidence_quality 25 + action_management 25 = 100)
//
// Rating: outstanding >=80, good >=60, requires_improvement >=40,
//         inadequate <40
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

import { rate, meets, below } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type RegulationArea =
  | "quality_of_care"
  | "children_views"
  | "education"
  | "health"
  | "positive_relationships"
  | "protection"
  | "behaviour_management"
  | "leadership"
  | "staffing"
  | "premises"
  | "notifiable_events"
  | "complaints"
  | "review_monitoring"
  | "records"
  | "statement_of_purpose";

export type ComplianceLevel =
  | "fully_compliant"
  | "mostly_compliant"
  | "partially_compliant"
  | "non_compliant"
  | "not_assessed";

export type EvidenceType =
  | "policy"
  | "procedure"
  | "audit_report"
  | "inspection_report"
  | "staff_feedback"
  | "child_feedback"
  | "external_review"
  | "training_record"
  | "incident_data"
  | "meeting_minutes"
  | "other";

export type ActionPriority = "critical" | "high" | "medium" | "low";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface SelfAssessmentEntry {
  id: string;
  homeId: string;
  regulationArea: RegulationArea;
  assessmentDate: string;
  assessedBy: string;
  complianceLevel: ComplianceLevel;
  evidenceSources: EvidenceType[];
  evidenceNotes: string;
  strengthsIdentified: string[];
  gapsIdentified: string[];
  actionsPlan: string[];
}

export interface ImprovementAction {
  id: string;
  homeId: string;
  regulationArea: RegulationArea;
  action: string;
  responsible: string;
  priority: ActionPriority;
  dueDate: string;
  status: "completed" | "in_progress" | "not_started" | "overdue";
  completedDate: string;
}

export interface ExternalFeedback {
  id: string;
  homeId: string;
  source: "ofsted" | "reg44" | "local_authority" | "irp" | "parent" | "child" | "staff" | "other";
  date: string;
  regulationArea: RegulationArea;
  feedback: string;
  actionRequired: boolean;
  addressed: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export type OverallRating = "outstanding" | "good" | "requires_improvement" | "inadequate";

export interface SelfAssessmentAnalysis {
  homeId: string;
  overallScore: number;
  overallRating: OverallRating;
  assessmentCoverageScore: number;
  complianceQualityScore: number;
  evidenceQualityScore: number;
  actionManagementScore: number;
  regulationsAssessedCount: number;
  regulationsAssessedRate: number;
  averageComplianceLevel: number;
  averageEvidenceSourcesPerAssessment: number;
  actionCompletionRate: number;
  externalFeedbackIntegrationRate: number | null; // null when there is no actionable external feedback
  areaBreakdown: AreaBreakdownEntry[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: RegulatoryLink[];
}

export interface AreaBreakdownEntry {
  area: RegulationArea;
  complianceLevel: ComplianceLevel;
  evidenceCount: number;
  hasActions: boolean;
  actionCompletionRate: number;
  feedbackCount: number;
  feedbackAddressedRate: number;
}

export interface RegulatoryLink {
  reference: string;
  title: string;
  relevance: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const ALL_REGULATION_AREAS: RegulationArea[] = [
  "quality_of_care",
  "children_views",
  "education",
  "health",
  "positive_relationships",
  "protection",
  "behaviour_management",
  "leadership",
  "staffing",
  "premises",
  "notifiable_events",
  "complaints",
  "review_monitoring",
  "records",
  "statement_of_purpose",
];

const COMPLIANCE_SCORES: Record<ComplianceLevel, number> = {
  fully_compliant: 100,
  mostly_compliant: 75,
  partially_compliant: 50,
  non_compliant: 25,
  not_assessed: 0,
};

const AREA_LABELS: Record<RegulationArea, string> = {
  quality_of_care: "Quality of Care",
  children_views: "Children's Views",
  education: "Education",
  health: "Health",
  positive_relationships: "Positive Relationships",
  protection: "Protection of Children",
  behaviour_management: "Behaviour Management",
  leadership: "Leadership & Management",
  staffing: "Staffing",
  premises: "Premises & Safety",
  notifiable_events: "Notifiable Events",
  complaints: "Complaints",
  review_monitoring: "Review & Monitoring",
  records: "Records",
  statement_of_purpose: "Statement of Purpose",
};

const COMPLIANCE_LABELS: Record<ComplianceLevel, string> = {
  fully_compliant: "Fully Compliant",
  mostly_compliant: "Mostly Compliant",
  partially_compliant: "Partially Compliant",
  non_compliant: "Non-Compliant",
  not_assessed: "Not Assessed",
};

const PRIORITY_LABELS: Record<ActionPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  policy: "Policy",
  procedure: "Procedure",
  audit_report: "Audit Report",
  inspection_report: "Inspection Report",
  staff_feedback: "Staff Feedback",
  child_feedback: "Child Feedback",
  external_review: "External Review",
  training_record: "Training Record",
  incident_data: "Incident Data",
  meeting_minutes: "Meeting Minutes",
  other: "Other",
};

const REGULATORY_LINKS: RegulatoryLink[] = [
  {
    reference: "CHR 2015 Reg 45",
    title: "Review of Quality of Care",
    relevance: "Registered individual must review quality of care at least every 6 months",
  },
  {
    reference: "SCCIF",
    title: "Social Care Common Inspection Framework",
    relevance: "Framework used by Ofsted to inspect and evaluate children's homes",
  },
  {
    reference: "Guide to CHR 2015",
    title: "Guide to the Children's Homes Regulations 2015",
    relevance: "DfE statutory guidance on interpreting and complying with the regulations",
  },
  {
    reference: "CHR 2015 Reg 44",
    title: "Independent Person: Visiting",
    relevance: "Monthly visits by an independent person to report on the home's operation",
  },
];

// ── Label Helpers ──────────────────────────────────────────────────────────

export function getAreaLabel(area: RegulationArea): string {
  return AREA_LABELS[area];
}

export function getComplianceLabel(level: ComplianceLevel): string {
  return COMPLIANCE_LABELS[level];
}

export function getPriorityLabel(priority: ActionPriority): string {
  return PRIORITY_LABELS[priority];
}

export function getEvidenceTypeLabel(type: EvidenceType): string {
  return EVIDENCE_TYPE_LABELS[type];
}

// ── Scoring: Assessment Coverage (25 pts) ──────────────────────────────────

function calculateAssessmentCoverageScore(
  entries: SelfAssessmentEntry[],
  homeId: string,
): number {
  const homeEntries = entries.filter((e) => e.homeId === homeId);
  const assessedAreas = new Set(
    homeEntries
      .filter((e) => e.complianceLevel !== "not_assessed")
      .map((e) => e.regulationArea),
  );
  const totalAreas = ALL_REGULATION_AREAS.length;
  const rate = assessedAreas.size / totalAreas;
  return Math.round(rate * 25 * 100) / 100;
}

// ── Scoring: Compliance Quality (25 pts) ────────────────────────────────────

function calculateComplianceQualityScore(
  entries: SelfAssessmentEntry[],
  homeId: string,
): number {
  const homeEntries = entries.filter(
    (e) => e.homeId === homeId && e.complianceLevel !== "not_assessed",
  );
  if (homeEntries.length === 0) return 0;

  const totalScore = homeEntries.reduce(
    (sum, e) => sum + COMPLIANCE_SCORES[e.complianceLevel],
    0,
  );
  const avgCompliance = totalScore / homeEntries.length;
  return Math.round((avgCompliance / 100) * 25 * 100) / 100;
}

// ── Scoring: Evidence Quality (25 pts) ──────────────────────────────────────

function calculateEvidenceQualityScore(
  entries: SelfAssessmentEntry[],
  homeId: string,
): number {
  const homeEntries = entries.filter(
    (e) => e.homeId === homeId && e.complianceLevel !== "not_assessed",
  );
  if (homeEntries.length === 0) return 0;

  // Evidence diversity: average unique evidence types per assessment (max 5 = full marks)
  const avgEvidence =
    homeEntries.reduce((sum, e) => {
      const uniqueTypes = new Set(e.evidenceSources);
      return sum + uniqueTypes.size;
    }, 0) / homeEntries.length;

  // Cap at 5 evidence types for maximum score
  const evidenceRate = Math.min(avgEvidence / 5, 1);

  // Evidence notes completeness: proportion that have non-empty notes
  const withNotes = homeEntries.filter((e) => e.evidenceNotes.trim().length > 0).length;
  const notesRate = withNotes / homeEntries.length;

  // 60% weight on diversity, 40% on notes
  const combined = evidenceRate * 0.6 + notesRate * 0.4;
  return Math.round(combined * 25 * 100) / 100;
}

// ── Scoring: Action Management (25 pts) ─────────────────────────────────────

function calculateActionManagementScore(
  actions: ImprovementAction[],
  feedback: ExternalFeedback[],
  homeId: string,
): number {
  const homeActions = actions.filter((a) => a.homeId === homeId);
  const homeFeedback = feedback.filter((f) => f.homeId === homeId);

  if (homeActions.length === 0 && homeFeedback.length === 0) return 0;

  // Action completion rate (60% of action management)
  let actionScore = 0;
  if (homeActions.length > 0) {
    const completed = homeActions.filter((a) => a.status === "completed").length;
    actionScore = (completed / homeActions.length) * 0.6;
  }

  // External feedback integration rate (40% of action management)
  let feedbackScore = 0;
  if (homeFeedback.length > 0) {
    const requiringAction = homeFeedback.filter((f) => f.actionRequired);
    if (requiringAction.length > 0) {
      const addressed = requiringAction.filter((f) => f.addressed).length;
      feedbackScore = (addressed / requiringAction.length) * 0.4;
    } else {
      // All feedback reviewed, none requiring action = full marks for this component
      feedbackScore = 0.4;
    }
  }

  // If only actions exist (no feedback), scale action score to full 25
  if (homeActions.length > 0 && homeFeedback.length === 0) {
    const completed = homeActions.filter((a) => a.status === "completed").length;
    const rate = completed / homeActions.length;
    return Math.round(rate * 25 * 100) / 100;
  }

  // If only feedback exists (no actions), scale feedback score to full 25
  if (homeActions.length === 0 && homeFeedback.length > 0) {
    const requiringAction = homeFeedback.filter((f) => f.actionRequired);
    if (requiringAction.length === 0) return 25;
    const addressed = requiringAction.filter((f) => f.addressed).length;
    const rate = addressed / requiringAction.length;
    return Math.round(rate * 25 * 100) / 100;
  }

  return Math.round((actionScore + feedbackScore) * 25 * 100) / 100;
}

// ── Rating ──────────────────────────────────────────────────────────────────

export function calculateRating(score: number): OverallRating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Metric Helpers ──────────────────────────────────────────────────────────

function computeRegulationsAssessedCount(
  entries: SelfAssessmentEntry[],
  homeId: string,
): number {
  const homeEntries = entries.filter((e) => e.homeId === homeId);
  const assessed = new Set(
    homeEntries
      .filter((e) => e.complianceLevel !== "not_assessed")
      .map((e) => e.regulationArea),
  );
  return assessed.size;
}

function computeRegulationsAssessedRate(
  entries: SelfAssessmentEntry[],
  homeId: string,
): number {
  const count = computeRegulationsAssessedCount(entries, homeId);
  return Math.round((count / ALL_REGULATION_AREAS.length) * 100);
}

function computeAverageComplianceLevel(
  entries: SelfAssessmentEntry[],
  homeId: string,
): number {
  const homeEntries = entries.filter(
    (e) => e.homeId === homeId && e.complianceLevel !== "not_assessed",
  );
  if (homeEntries.length === 0) return 0;
  const total = homeEntries.reduce(
    (sum, e) => sum + COMPLIANCE_SCORES[e.complianceLevel],
    0,
  );
  return Math.round((total / homeEntries.length) * 100) / 100;
}

function computeAverageEvidenceSourcesPerAssessment(
  entries: SelfAssessmentEntry[],
  homeId: string,
): number {
  const homeEntries = entries.filter(
    (e) => e.homeId === homeId && e.complianceLevel !== "not_assessed",
  );
  if (homeEntries.length === 0) return 0;
  const total = homeEntries.reduce((sum, e) => sum + e.evidenceSources.length, 0);
  return Math.round((total / homeEntries.length) * 100) / 100;
}

function computeActionCompletionRate(
  actions: ImprovementAction[],
  homeId: string,
): number {
  const homeActions = actions.filter((a) => a.homeId === homeId);
  if (homeActions.length === 0) return 0;
  const completed = homeActions.filter((a) => a.status === "completed").length;
  return Math.round((completed / homeActions.length) * 100);
}

function computeExternalFeedbackIntegrationRate(
  feedback: ExternalFeedback[],
  homeId: string,
): number | null {
  const homeFeedback = feedback.filter((f) => f.homeId === homeId && f.actionRequired);
  if (homeFeedback.length === 0) return null; // no actionable feedback — integration is unmeasured, not perfect
  const addressed = homeFeedback.filter((f) => f.addressed).length;
  return rate(addressed, homeFeedback.length);
}

// ── Area Breakdown ──────────────────────────────────────────────────────────

function buildAreaBreakdown(
  entries: SelfAssessmentEntry[],
  actions: ImprovementAction[],
  feedback: ExternalFeedback[],
  homeId: string,
): AreaBreakdownEntry[] {
  return ALL_REGULATION_AREAS.map((area) => {
    // Most recent entry for this area
    const areaEntries = entries
      .filter((e) => e.homeId === homeId && e.regulationArea === area)
      .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());
    const latestEntry = areaEntries[0];

    const complianceLevel: ComplianceLevel = latestEntry
      ? latestEntry.complianceLevel
      : "not_assessed";

    const evidenceCount = latestEntry ? latestEntry.evidenceSources.length : 0;

    const areaActions = actions.filter(
      (a) => a.homeId === homeId && a.regulationArea === area,
    );
    const hasActions = areaActions.length > 0;
    const actionCompletionRate =
      areaActions.length > 0
        ? Math.round(
            (areaActions.filter((a) => a.status === "completed").length /
              areaActions.length) *
              100,
          )
        : 0;

    const areaFeedback = feedback.filter(
      (f) => f.homeId === homeId && f.regulationArea === area,
    );
    const feedbackCount = areaFeedback.length;
    const actionRequiredFeedback = areaFeedback.filter((f) => f.actionRequired);
    const feedbackAddressedRate =
      actionRequiredFeedback.length > 0
        ? Math.round(
            (actionRequiredFeedback.filter((f) => f.addressed).length /
              actionRequiredFeedback.length) *
              100,
          )
        : feedbackCount > 0
          ? 100
          : 0;

    return {
      area,
      complianceLevel,
      evidenceCount,
      hasActions,
      actionCompletionRate,
      feedbackCount,
      feedbackAddressedRate,
    };
  });
}

// ── Strengths Generation ────────────────────────────────────────────────────

function generateStrengths(
  entries: SelfAssessmentEntry[],
  actions: ImprovementAction[],
  feedback: ExternalFeedback[],
  homeId: string,
  breakdown: AreaBreakdownEntry[],
): string[] {
  const strengths: string[] = [];

  // High coverage
  const assessedCount = computeRegulationsAssessedCount(entries, homeId);
  const assessedRate = computeRegulationsAssessedRate(entries, homeId);
  if (assessedRate >= 80) {
    strengths.push(
      `Strong assessment coverage: ${assessedCount} of ${ALL_REGULATION_AREAS.length} regulation areas assessed (${assessedRate}%)`,
    );
  }

  // Fully compliant areas
  const fullyCompliant = breakdown.filter((b) => b.complianceLevel === "fully_compliant");
  if (fullyCompliant.length > 0) {
    const areaNames = fullyCompliant.map((b) => AREA_LABELS[b.area]).join(", ");
    strengths.push(
      `Full compliance achieved in: ${areaNames}`,
    );
  }

  // High action completion
  const actionRate = computeActionCompletionRate(actions, homeId);
  if (actionRate >= 75) {
    strengths.push(
      `Strong action completion rate at ${actionRate}% — improvement actions are being followed through`,
    );
  }

  // Good evidence base
  const avgEvidence = computeAverageEvidenceSourcesPerAssessment(entries, homeId);
  if (avgEvidence >= 3) {
    strengths.push(
      `Robust evidence base with an average of ${avgEvidence} evidence sources per assessment`,
    );
  }

  // External feedback integration
  const feedbackRate = computeExternalFeedbackIntegrationRate(feedback, homeId);
  if (meets(feedbackRate, 80)) {
    strengths.push(
      `External feedback is well-integrated: ${feedbackRate}% of actionable feedback addressed`,
    );
  }

  // Children's views included
  const childrenEntry = entries.find(
    (e) => e.homeId === homeId && e.regulationArea === "children_views" && e.complianceLevel !== "not_assessed",
  );
  if (childrenEntry) {
    const childEvidence = childrenEntry.evidenceSources.includes("child_feedback");
    if (childEvidence) {
      strengths.push(
        "Children's views assessment includes direct child feedback as evidence",
      );
    }
  }

  // Identified strengths from entries
  const homeEntries = entries.filter((e) => e.homeId === homeId);
  for (const entry of homeEntries) {
    for (const s of entry.strengthsIdentified) {
      if (!strengths.includes(s)) {
        strengths.push(s);
      }
    }
  }

  return strengths;
}

// ── Areas for Improvement Generation ────────────────────────────────────────

function generateAreasForImprovement(
  entries: SelfAssessmentEntry[],
  actions: ImprovementAction[],
  feedback: ExternalFeedback[],
  homeId: string,
  breakdown: AreaBreakdownEntry[],
): string[] {
  const improvements: string[] = [];

  // Low coverage
  const assessedRate = computeRegulationsAssessedRate(entries, homeId);
  if (assessedRate < 80) {
    const unassessed = breakdown
      .filter((b) => b.complianceLevel === "not_assessed")
      .map((b) => AREA_LABELS[b.area]);
    improvements.push(
      `Assessment coverage is ${assessedRate}% — the following areas remain unassessed: ${unassessed.join(", ")}`,
    );
  }

  // Non-compliant areas
  const nonCompliant = breakdown.filter((b) => b.complianceLevel === "non_compliant");
  if (nonCompliant.length > 0) {
    for (const nc of nonCompliant) {
      improvements.push(
        `${AREA_LABELS[nc.area]} is rated non-compliant — immediate action required`,
      );
    }
  }

  // Partially compliant areas
  const partial = breakdown.filter((b) => b.complianceLevel === "partially_compliant");
  if (partial.length > 0) {
    const areaNames = partial.map((b) => AREA_LABELS[b.area]).join(", ");
    improvements.push(
      `Partial compliance in: ${areaNames} — targeted improvement plans needed`,
    );
  }

  // Low action completion
  const actionRate = computeActionCompletionRate(actions, homeId);
  if (actionRate < 50) {
    improvements.push(
      `Action completion rate is only ${actionRate}% — improvement actions are not being followed through effectively`,
    );
  }

  // Overdue actions
  const overdueActions = actions.filter(
    (a) => a.homeId === homeId && a.status === "overdue",
  );
  if (overdueActions.length > 0) {
    improvements.push(
      `${overdueActions.length} improvement action${overdueActions.length > 1 ? "s" : ""} overdue — review deadlines and responsibilities`,
    );
  }

  // Weak evidence
  const avgEvidence = computeAverageEvidenceSourcesPerAssessment(entries, homeId);
  if (avgEvidence < 2) {
    improvements.push(
      `Evidence base is thin — average of ${avgEvidence} sources per assessment. Diversify evidence to include audits, feedback, and records`,
    );
  }

  // Unaddressed external feedback
  const feedbackRate = computeExternalFeedbackIntegrationRate(feedback, homeId);
  if (below(feedbackRate, 80)) {
    improvements.push(
      `Only ${feedbackRate}% of external feedback requiring action has been addressed`,
    );
  }

  // Gaps from entries
  const homeEntries = entries.filter((e) => e.homeId === homeId);
  for (const entry of homeEntries) {
    for (const g of entry.gapsIdentified) {
      if (!improvements.includes(g)) {
        improvements.push(g);
      }
    }
  }

  return improvements;
}

// ── Actions Generation ──────────────────────────────────────────────────────

function generateActions(
  entries: SelfAssessmentEntry[],
  actions: ImprovementAction[],
  feedback: ExternalFeedback[],
  homeId: string,
  breakdown: AreaBreakdownEntry[],
): string[] {
  const generated: string[] = [];

  // Assess uncovered areas
  const unassessed = breakdown.filter((b) => b.complianceLevel === "not_assessed");
  if (unassessed.length > 0) {
    generated.push(
      `Complete self-assessment for remaining ${unassessed.length} regulation area${unassessed.length > 1 ? "s" : ""}: ${unassessed.map((b) => AREA_LABELS[b.area]).join(", ")}`,
    );
  }

  // Address non-compliant areas urgently
  const nonCompliant = breakdown.filter((b) => b.complianceLevel === "non_compliant");
  for (const nc of nonCompliant) {
    generated.push(
      `Develop urgent remediation plan for ${AREA_LABELS[nc.area]} — currently non-compliant`,
    );
  }

  // Improve partially compliant areas
  const partial = breakdown.filter((b) => b.complianceLevel === "partially_compliant");
  for (const p of partial) {
    generated.push(
      `Create improvement action plan for ${AREA_LABELS[p.area]} to move from partially compliant to fully compliant`,
    );
  }

  // Follow through on overdue actions
  const overdueActions = actions.filter(
    (a) => a.homeId === homeId && a.status === "overdue",
  );
  if (overdueActions.length > 0) {
    generated.push(
      `Review and progress ${overdueActions.length} overdue improvement action${overdueActions.length > 1 ? "s" : ""}`,
    );
  }

  // Address unaddressed feedback
  const unaddressedFeedback = feedback.filter(
    (f) => f.homeId === homeId && f.actionRequired && !f.addressed,
  );
  if (unaddressedFeedback.length > 0) {
    generated.push(
      `Address ${unaddressedFeedback.length} outstanding external feedback item${unaddressedFeedback.length > 1 ? "s" : ""} requiring action`,
    );
  }

  // Strengthen evidence base where weak
  const weakEvidence = breakdown.filter(
    (b) => b.complianceLevel !== "not_assessed" && b.evidenceCount < 2,
  );
  if (weakEvidence.length > 0) {
    generated.push(
      `Strengthen evidence base for: ${weakEvidence.map((b) => AREA_LABELS[b.area]).join(", ")} — currently fewer than 2 evidence sources`,
    );
  }

  // Action plans from entries
  const homeEntries = entries.filter((e) => e.homeId === homeId);
  for (const entry of homeEntries) {
    for (const a of entry.actionsPlan) {
      if (!generated.includes(a)) {
        generated.push(a);
      }
    }
  }

  return generated;
}

// ── Core: Analyse Self-Assessment ───────────────────────────────────────────

export function analyseSelfAssessment(
  entries: SelfAssessmentEntry[],
  actions: ImprovementAction[],
  feedback: ExternalFeedback[],
  homeId: string,
): SelfAssessmentAnalysis {
  const assessmentCoverageScore = calculateAssessmentCoverageScore(entries, homeId);
  const complianceQualityScore = calculateComplianceQualityScore(entries, homeId);
  const evidenceQualityScore = calculateEvidenceQualityScore(entries, homeId);
  const actionManagementScore = calculateActionManagementScore(actions, feedback, homeId);

  const overallScore = Math.round(
    (assessmentCoverageScore + complianceQualityScore + evidenceQualityScore + actionManagementScore) * 100,
  ) / 100;
  const overallRating = calculateRating(overallScore);

  const breakdown = buildAreaBreakdown(entries, actions, feedback, homeId);

  return {
    homeId,
    overallScore,
    overallRating,
    assessmentCoverageScore,
    complianceQualityScore,
    evidenceQualityScore,
    actionManagementScore,
    regulationsAssessedCount: computeRegulationsAssessedCount(entries, homeId),
    regulationsAssessedRate: computeRegulationsAssessedRate(entries, homeId),
    averageComplianceLevel: computeAverageComplianceLevel(entries, homeId),
    averageEvidenceSourcesPerAssessment: computeAverageEvidenceSourcesPerAssessment(entries, homeId),
    actionCompletionRate: computeActionCompletionRate(actions, homeId),
    externalFeedbackIntegrationRate: computeExternalFeedbackIntegrationRate(feedback, homeId),
    areaBreakdown: breakdown,
    strengths: generateStrengths(entries, actions, feedback, homeId, breakdown),
    areasForImprovement: generateAreasForImprovement(entries, actions, feedback, homeId, breakdown),
    actions: generateActions(entries, actions, feedback, homeId, breakdown),
    regulatoryLinks: REGULATORY_LINKS,
  };
}

// ── Utility: Get area compliance from breakdown ─────────────────────────────

export function getAreaCompliance(
  analysis: SelfAssessmentAnalysis,
  area: RegulationArea,
): AreaBreakdownEntry | undefined {
  return analysis.areaBreakdown.find((b) => b.area === area);
}

// ── Utility: Count areas by compliance level ────────────────────────────────

export function countAreasByCompliance(
  analysis: SelfAssessmentAnalysis,
): Record<ComplianceLevel, number> {
  const counts: Record<ComplianceLevel, number> = {
    fully_compliant: 0,
    mostly_compliant: 0,
    partially_compliant: 0,
    non_compliant: 0,
    not_assessed: 0,
  };
  for (const entry of analysis.areaBreakdown) {
    counts[entry.complianceLevel]++;
  }
  return counts;
}

// ── Utility: Get critical actions ───────────────────────────────────────────

export function getCriticalActions(
  actions: ImprovementAction[],
  homeId: string,
): ImprovementAction[] {
  return actions.filter(
    (a) => a.homeId === homeId && a.priority === "critical" && a.status !== "completed",
  );
}

// ── Utility: Get overdue actions ────────────────────────────────────────────

export function getOverdueActions(
  actions: ImprovementAction[],
  homeId: string,
): ImprovementAction[] {
  return actions.filter(
    (a) => a.homeId === homeId && a.status === "overdue",
  );
}

// ── Utility: Get unaddressed feedback ───────────────────────────────────────

export function getUnaddressedFeedback(
  feedback: ExternalFeedback[],
  homeId: string,
): ExternalFeedback[] {
  return feedback.filter(
    (f) => f.homeId === homeId && f.actionRequired && !f.addressed,
  );
}
