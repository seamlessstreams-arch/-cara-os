// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Ofsted Readiness Intelligence Engine
//
// Meta-intelligence module that evaluates inspection readiness across the
// 3 SCCIF judgment areas. Takes high-level summary scores from operational
// areas and produces an overall inspection readiness assessment with gap
// analysis.
//
// Aligned to:
//   - SCCIF — Social Care Common Inspection Framework
//   - CHR 2015 Reg 45 — Review of quality of care
//   - CHR 2015 Reg 40 — Standards of care
//   - Ofsted Compliance Handbook
//   - DfE Guide to the Children's Homes Regulations 2015
//
// Scoring model (judgment_area_readiness 30 + evidence_portfolio 25 +
//   action_plan_progress 25 + inspection_preparedness 20 = 100)
//
// Readiness: ready >=80, mostly_ready >=60, partially_ready >=40,
//            not_ready <40
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type JudgmentArea =
  | "overall_experiences"
  | "help_and_protection"
  | "leadership_and_management";

export type EvidenceStrength = "strong" | "adequate" | "weak" | "absent";

export type InspectionReadiness =
  | "ready"
  | "mostly_ready"
  | "partially_ready"
  | "not_ready";

export type SCCIFRequirement =
  | "children_make_progress"
  | "children_are_safe"
  | "staff_are_skilled"
  | "leaders_are_ambitious"
  | "matching_is_effective"
  | "care_is_individualised"
  | "records_are_thorough"
  | "partnership_working"
  | "children_participate"
  | "complaints_are_resolved"
  | "health_needs_met"
  | "education_supported"
  | "independence_promoted"
  | "contact_is_purposeful"
  | "behaviour_is_understood";

export type AreaStatus =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface AreaScore {
  id: string;
  area: string;
  score: number; // 0-100
  rating: AreaStatus;
  lastAssessedDate: string;
  assessedBy: string;
}

export interface SCCIFEvidenceItem {
  id: string;
  requirement: SCCIFRequirement;
  judgmentArea: JudgmentArea;
  evidenceStrength: EvidenceStrength;
  description: string;
  lastUpdated: string;
  linkedDocuments: number;
}

export interface InspectionHistory {
  id: string;
  inspectionDate: string;
  overallJudgment: AreaStatus;
  experiencesJudgment: AreaStatus;
  helpProtectionJudgment: AreaStatus;
  leadershipJudgment: AreaStatus;
  requirementsIssued: number;
  recommendationsIssued: number;
  requirementsCompleted: number;
  recommendationsCompleted: number;
}

export interface ActionPlanItem {
  id: string;
  source: string; // "ofsted_requirement" | "ofsted_recommendation" | "internal_audit" | "reg44"
  description: string;
  status: "not_started" | "in_progress" | "completed" | "overdue";
  targetDate: string;
  completedDate?: string;
  priority: "critical" | "high" | "medium" | "low";
  assignedTo: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface JudgmentAreaSummary {
  area: JudgmentArea;
  label: string;
  averageScore: number;
  areaCount: number;
  evidenceCount: number;
  absentEvidenceCount: number;
  weakEvidenceCount: number;
  strongEvidenceCount: number;
  readinessContribution: number;
}

export interface GapAnalysisItem {
  requirement: SCCIFRequirement;
  label: string;
  judgmentArea: JudgmentArea;
  currentStrength: EvidenceStrength | "missing";
  recommendation: string;
  priority: "critical" | "high" | "medium" | "low";
}

export interface RegulatoryLink {
  reference: string;
  title: string;
  relevance: string;
}

export interface OfstedReadinessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  readiness: InspectionReadiness;
  judgmentAreaReadinessScore: number;
  evidencePortfolioScore: number;
  actionPlanProgressScore: number;
  inspectionPreparednessScore: number;
  judgmentAreaSummaries: JudgmentAreaSummary[];
  gapAnalysis: GapAnalysisItem[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: RegulatoryLink[];
}

// ── Constants ──────────────────────────────────────────────────────────────

export const ALL_SCCIF_REQUIREMENTS: SCCIFRequirement[] = [
  "children_make_progress",
  "children_are_safe",
  "staff_are_skilled",
  "leaders_are_ambitious",
  "matching_is_effective",
  "care_is_individualised",
  "records_are_thorough",
  "partnership_working",
  "children_participate",
  "complaints_are_resolved",
  "health_needs_met",
  "education_supported",
  "independence_promoted",
  "contact_is_purposeful",
  "behaviour_is_understood",
];

export const ALL_JUDGMENT_AREAS: JudgmentArea[] = [
  "overall_experiences",
  "help_and_protection",
  "leadership_and_management",
];

// Mapping of operational areas to their primary SCCIF judgment area
const AREA_TO_JUDGMENT: Record<string, JudgmentArea> = {
  safeguarding: "help_and_protection",
  education: "overall_experiences",
  health: "overall_experiences",
  behaviour: "help_and_protection",
  care_planning: "overall_experiences",
  staff_training: "leadership_and_management",
  leadership: "leadership_and_management",
  participation: "overall_experiences",
  contact: "overall_experiences",
  independence: "overall_experiences",
  complaints: "help_and_protection",
  records: "leadership_and_management",
  premises: "leadership_and_management",
  matching: "overall_experiences",
  nutrition: "overall_experiences",
  medication: "help_and_protection",
  restraint: "help_and_protection",
  missing_from_care: "help_and_protection",
};

const JUDGMENT_AREA_LABELS: Record<JudgmentArea, string> = {
  overall_experiences: "The Overall Experiences and Progress of Children and Young People",
  help_and_protection: "How Well Children and Young People Are Helped and Protected",
  leadership_and_management: "The Effectiveness of Leaders and Managers",
};

const EVIDENCE_STRENGTH_LABELS: Record<EvidenceStrength, string> = {
  strong: "Strong",
  adequate: "Adequate",
  weak: "Weak",
  absent: "Absent",
};

const INSPECTION_READINESS_LABELS: Record<InspectionReadiness, string> = {
  ready: "Ready",
  mostly_ready: "Mostly Ready",
  partially_ready: "Partially Ready",
  not_ready: "Not Ready",
};

const SCCIF_REQUIREMENT_LABELS: Record<SCCIFRequirement, string> = {
  children_make_progress: "Children Make Progress",
  children_are_safe: "Children Are Safe",
  staff_are_skilled: "Staff Are Skilled",
  leaders_are_ambitious: "Leaders Are Ambitious",
  matching_is_effective: "Matching Is Effective",
  care_is_individualised: "Care Is Individualised",
  records_are_thorough: "Records Are Thorough",
  partnership_working: "Partnership Working",
  children_participate: "Children Participate",
  complaints_are_resolved: "Complaints Are Resolved",
  health_needs_met: "Health Needs Met",
  education_supported: "Education Supported",
  independence_promoted: "Independence Promoted",
  contact_is_purposeful: "Contact Is Purposeful",
  behaviour_is_understood: "Behaviour Is Understood",
};

const AREA_STATUS_LABELS: Record<AreaStatus, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

const ACTION_SOURCE_LABELS: Record<string, string> = {
  ofsted_requirement: "Ofsted Requirement",
  ofsted_recommendation: "Ofsted Recommendation",
  internal_audit: "Internal Audit",
  reg44: "Reg 44 Visit",
};

const ACTION_PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const REGULATORY_LINKS: RegulatoryLink[] = [
  {
    reference: "SCCIF",
    title: "Social Care Common Inspection Framework",
    relevance: "Framework used by Ofsted to inspect and evaluate children's homes against the 3 judgment areas",
  },
  {
    reference: "CHR 2015 Reg 45",
    title: "Review of Quality of Care",
    relevance: "Registered individual must review quality of care at least every 6 months and produce an improvement plan",
  },
  {
    reference: "CHR 2015 Reg 40",
    title: "Standards of Care",
    relevance: "Standards that children's homes must meet to provide good quality care",
  },
  {
    reference: "Ofsted Compliance Handbook",
    title: "Ofsted Social Care Compliance Handbook",
    relevance: "Ofsted's handbook on compliance and enforcement activities for children's social care",
  },
  {
    reference: "DfE Guide to CHR 2015",
    title: "Guide to the Children's Homes Regulations 2015",
    relevance: "DfE statutory guidance on interpreting and complying with the regulations including quality standards",
  },
];

// ── Label Helpers ──────────────────────────────────────────────────────────

export function getJudgmentAreaLabel(area: JudgmentArea): string {
  return JUDGMENT_AREA_LABELS[area];
}

export function getEvidenceStrengthLabel(strength: EvidenceStrength): string {
  return EVIDENCE_STRENGTH_LABELS[strength];
}

export function getInspectionReadinessLabel(readiness: InspectionReadiness): string {
  return INSPECTION_READINESS_LABELS[readiness];
}

export function getSCCIFRequirementLabel(req: SCCIFRequirement): string {
  return SCCIF_REQUIREMENT_LABELS[req];
}

export function getAreaStatusLabel(status: AreaStatus): string {
  return AREA_STATUS_LABELS[status];
}

export function getActionSourceLabel(source: string): string {
  return ACTION_SOURCE_LABELS[source] ?? source;
}

export function getActionPriorityLabel(priority: string): string {
  return ACTION_PRIORITY_LABELS[priority] ?? priority;
}

// ── Utility ────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.abs(a - b) / (1000 * 60 * 60 * 24);
}

function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

function getReadiness(score: number): InspectionReadiness {
  if (score >= 80) return "ready";
  if (score >= 60) return "mostly_ready";
  if (score >= 40) return "partially_ready";
  return "not_ready";
}

// ── Scoring: Judgment Area Readiness (30 pts) ──────────────────────────────

export function evaluateJudgmentAreaReadiness(
  areaScores: AreaScore[],
  evidenceItems: SCCIFEvidenceItem[],
): number {
  let score = 0;

  // Group area scores by judgment area
  const judgmentGroups: Record<JudgmentArea, number[]> = {
    overall_experiences: [],
    help_and_protection: [],
    leadership_and_management: [],
  };

  for (const as of areaScores) {
    const judgment = AREA_TO_JUDGMENT[as.area];
    if (judgment) {
      judgmentGroups[judgment].push(as.score);
    }
  }

  // +6/+4/+2 per judgment area based on average score
  for (const area of ALL_JUDGMENT_AREAS) {
    const scores = judgmentGroups[area];
    if (scores.length === 0) continue;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 80) {
      score += 6;
    } else if (avg >= 60) {
      score += 4;
    } else if (avg >= 40) {
      score += 2;
    }
  }

  // +3 if evidence covers >= 90% of the 15 SCCIF requirements
  const coveredRequirements = new Set(evidenceItems.map((e) => e.requirement));
  const coverageRate = coveredRequirements.size / ALL_SCCIF_REQUIREMENTS.length;
  if (coverageRate >= 0.9) {
    score += 3;
  }

  // +3 if no "absent" evidence
  const hasAbsent = evidenceItems.some((e) => e.evidenceStrength === "absent");
  if (!hasAbsent && evidenceItems.length > 0) {
    score += 3;
  }

  // +6 bonus if all 3 areas avg >= 80
  const allAreasStrong = ALL_JUDGMENT_AREAS.every((area) => {
    const scores = judgmentGroups[area];
    if (scores.length === 0) return false;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg >= 80;
  });
  if (allAreasStrong) {
    score += 6;
  }

  return clamp(Math.round(score * 100) / 100, 0, 30);
}

// ── Scoring: Evidence Portfolio (25 pts) ───────────────────────────────────

export function evaluateEvidencePortfolio(
  evidenceItems: SCCIFEvidenceItem[],
  periodEnd?: string,
): number {
  if (evidenceItems.length === 0) return 0;

  let score = 0;

  // Coverage: distinct requirements with evidence / 15 * 12
  const coveredRequirements = new Set(evidenceItems.map((e) => e.requirement));
  const coverage = coveredRequirements.size / ALL_SCCIF_REQUIREMENTS.length;
  score += coverage * 12;

  // +4 if >= 80% "strong"
  const strongCount = evidenceItems.filter((e) => e.evidenceStrength === "strong").length;
  const strongRate = strongCount / evidenceItems.length;
  if (strongRate >= 0.8) {
    score += 4;
  }

  // +3 if all updated within 90 days of period end
  if (periodEnd) {
    const allRecent = evidenceItems.every((e) => {
      return daysBetween(e.lastUpdated, periodEnd) <= 90;
    });
    if (allRecent) {
      score += 3;
    }
  }

  // +3 if avg linked documents >= 3
  const avgLinkedDocs =
    evidenceItems.reduce((sum, e) => sum + e.linkedDocuments, 0) /
    evidenceItems.length;
  if (avgLinkedDocs >= 3) {
    score += 3;
  }

  // +3 bonus if zero "weak" or "absent"
  const hasWeakOrAbsent = evidenceItems.some(
    (e) => e.evidenceStrength === "weak" || e.evidenceStrength === "absent",
  );
  if (!hasWeakOrAbsent) {
    score += 3;
  }

  return clamp(Math.round(score * 100) / 100, 0, 25);
}

// ── Scoring: Action Plan Progress (25 pts) ─────────────────────────────────

export function evaluateActionPlanProgress(
  actionItems: ActionPlanItem[],
  inspectionHistory: InspectionHistory[],
): number {
  if (actionItems.length === 0) return 0;

  let score = 0;

  // Overall completion rate >= 80% → +8
  const completedCount = actionItems.filter((a) => a.status === "completed").length;
  const completionRate = completedCount / actionItems.length;
  if (completionRate >= 0.8) {
    score += 8;
  }

  // Critical/high completion >= 90% → +5
  const critHighItems = actionItems.filter(
    (a) => a.priority === "critical" || a.priority === "high",
  );
  if (critHighItems.length > 0) {
    const critHighCompleted = critHighItems.filter(
      (a) => a.status === "completed",
    ).length;
    const critHighRate = critHighCompleted / critHighItems.length;
    if (critHighRate >= 0.9) {
      score += 5;
    }
  }

  // No overdue → +4
  const hasOverdue = actionItems.some((a) => a.status === "overdue");
  if (!hasOverdue) {
    score += 4;
  }

  // All Ofsted requirements completed → +4
  const ofstedReqs = actionItems.filter(
    (a) => a.source === "ofsted_requirement",
  );
  if (ofstedReqs.length > 0) {
    const allReqsCompleted = ofstedReqs.every(
      (a) => a.status === "completed",
    );
    if (allReqsCompleted) {
      score += 4;
    }
  } else {
    // No Ofsted requirements — award points (no outstanding requirements is positive)
    score += 4;
  }

  // All Ofsted recommendations completed or in progress → +4
  const ofstedRecs = actionItems.filter(
    (a) => a.source === "ofsted_recommendation",
  );
  if (ofstedRecs.length > 0) {
    const allRecsAddressed = ofstedRecs.every(
      (a) => a.status === "completed" || a.status === "in_progress",
    );
    if (allRecsAddressed) {
      score += 4;
    }
  } else {
    // No Ofsted recommendations — award points
    score += 4;
  }

  return clamp(Math.round(score * 100) / 100, 0, 25);
}

// ── Scoring: Inspection Preparedness (20 pts) ──────────────────────────────

export function evaluateInspectionPreparedness(
  inspectionHistory: InspectionHistory[],
  areaScores: AreaScore[],
  actionItems: ActionPlanItem[],
  periodEnd: string,
): number {
  let score = 0;

  // +5 for previous judgment quality (most recent inspection)
  const sorted = [...inspectionHistory].sort(
    (a, b) =>
      new Date(b.inspectionDate).getTime() -
      new Date(a.inspectionDate).getTime(),
  );
  const mostRecent = sorted[0];
  if (mostRecent) {
    switch (mostRecent.overallJudgment) {
      case "outstanding":
        score += 5;
        break;
      case "good":
        score += 4;
        break;
      case "requires_improvement":
        score += 2;
        break;
      case "inadequate":
        score += 0;
        break;
    }
  }

  // +5 if improvement trend (comparing last two inspections)
  if (sorted.length >= 2) {
    const judgmentOrder: Record<AreaStatus, number> = {
      outstanding: 4,
      good: 3,
      requires_improvement: 2,
      inadequate: 1,
    };
    const current = judgmentOrder[sorted[0].overallJudgment];
    const previous = judgmentOrder[sorted[1].overallJudgment];
    if (current > previous) {
      score += 5;
    }
  }

  // +4 for on-time action completion rate
  if (actionItems.length > 0) {
    const completedItems = actionItems.filter(
      (a) => a.status === "completed" && a.completedDate,
    );
    if (completedItems.length > 0) {
      const onTimeCount = completedItems.filter((a) => {
        return new Date(a.completedDate!).getTime() <= new Date(a.targetDate).getTime();
      }).length;
      const onTimeRate = onTimeCount / completedItems.length;
      score += Math.round(onTimeRate * 4 * 100) / 100;
    }
  }

  // +3 if >= 80% areas assessed within 30 days of period end
  if (areaScores.length > 0) {
    const recentlyAssessed = areaScores.filter((as) => {
      return daysBetween(as.lastAssessedDate, periodEnd) <= 30;
    });
    const recentRate = recentlyAssessed.length / areaScores.length;
    if (recentRate >= 0.8) {
      score += 3;
    }
  }

  // +3 bonus if maintained good+
  if (sorted.length >= 2) {
    const judgmentOrder: Record<AreaStatus, number> = {
      outstanding: 4,
      good: 3,
      requires_improvement: 2,
      inadequate: 1,
    };
    const allGoodPlus = sorted.every(
      (h) => judgmentOrder[h.overallJudgment] >= 3,
    );
    if (allGoodPlus) {
      score += 3;
    }
  }

  return clamp(Math.round(score * 100) / 100, 0, 20);
}

// ── Gap Analysis ───────────────────────────────────────────────────────────

function buildGapAnalysis(evidenceItems: SCCIFEvidenceItem[]): GapAnalysisItem[] {
  const gaps: GapAnalysisItem[] = [];
  const evidenceByReq = new Map<SCCIFRequirement, SCCIFEvidenceItem>();

  for (const item of evidenceItems) {
    // Keep the weakest evidence per requirement for gap analysis
    const existing = evidenceByReq.get(item.requirement);
    if (!existing) {
      evidenceByReq.set(item.requirement, item);
    } else {
      const strengthOrder: Record<EvidenceStrength, number> = {
        absent: 0,
        weak: 1,
        adequate: 2,
        strong: 3,
      };
      if (strengthOrder[item.evidenceStrength] < strengthOrder[existing.evidenceStrength]) {
        evidenceByReq.set(item.requirement, item);
      }
    }
  }

  for (const req of ALL_SCCIF_REQUIREMENTS) {
    const evidence = evidenceByReq.get(req);

    if (!evidence) {
      gaps.push({
        requirement: req,
        label: SCCIF_REQUIREMENT_LABELS[req],
        judgmentArea: getDefaultJudgmentArea(req),
        currentStrength: "missing",
        recommendation: `Collect and document evidence for ${SCCIF_REQUIREMENT_LABELS[req]}`,
        priority: "critical",
      });
    } else if (evidence.evidenceStrength === "absent") {
      gaps.push({
        requirement: req,
        label: SCCIF_REQUIREMENT_LABELS[req],
        judgmentArea: evidence.judgmentArea,
        currentStrength: "absent",
        recommendation: `Urgently source evidence for ${SCCIF_REQUIREMENT_LABELS[req]}`,
        priority: "critical",
      });
    } else if (evidence.evidenceStrength === "weak") {
      gaps.push({
        requirement: req,
        label: SCCIF_REQUIREMENT_LABELS[req],
        judgmentArea: evidence.judgmentArea,
        currentStrength: "weak",
        recommendation: `Strengthen evidence for ${SCCIF_REQUIREMENT_LABELS[req]}`,
        priority: "high",
      });
    }
  }

  return gaps;
}

function getDefaultJudgmentArea(req: SCCIFRequirement): JudgmentArea {
  const mapping: Record<SCCIFRequirement, JudgmentArea> = {
    children_make_progress: "overall_experiences",
    children_are_safe: "help_and_protection",
    staff_are_skilled: "leadership_and_management",
    leaders_are_ambitious: "leadership_and_management",
    matching_is_effective: "overall_experiences",
    care_is_individualised: "overall_experiences",
    records_are_thorough: "leadership_and_management",
    partnership_working: "help_and_protection",
    children_participate: "overall_experiences",
    complaints_are_resolved: "help_and_protection",
    health_needs_met: "overall_experiences",
    education_supported: "overall_experiences",
    independence_promoted: "overall_experiences",
    contact_is_purposeful: "overall_experiences",
    behaviour_is_understood: "help_and_protection",
  };
  return mapping[req];
}

// ── Strengths / Improvements / Actions ─────────────────────────────────────

function buildStrengths(
  areaScores: AreaScore[],
  evidenceItems: SCCIFEvidenceItem[],
  actionItems: ActionPlanItem[],
  inspectionHistory: InspectionHistory[],
): string[] {
  const strengths: string[] = [];

  // High-scoring areas
  const highAreas = areaScores.filter((a) => a.score >= 80);
  if (highAreas.length > 0) {
    strengths.push(
      `${highAreas.length} operational area${highAreas.length > 1 ? "s" : ""} rated 80+ demonstrating strong practice`,
    );
  }

  // Strong evidence coverage
  const strongEvidence = evidenceItems.filter(
    (e) => e.evidenceStrength === "strong",
  );
  if (strongEvidence.length > 0 && evidenceItems.length > 0) {
    const rate = Math.round(
      (strongEvidence.length / evidenceItems.length) * 100,
    );
    if (rate >= 60) {
      strengths.push(
        `${rate}% of SCCIF evidence items rated as strong`,
      );
    }
  }

  // Good action completion
  if (actionItems.length > 0) {
    const completed = actionItems.filter(
      (a) => a.status === "completed",
    ).length;
    const rate = Math.round((completed / actionItems.length) * 100);
    if (rate >= 70) {
      strengths.push(
        `Action plan completion rate at ${rate}%`,
      );
    }
  }

  // Good or outstanding previous inspection
  const sorted = [...inspectionHistory].sort(
    (a, b) =>
      new Date(b.inspectionDate).getTime() -
      new Date(a.inspectionDate).getTime(),
  );
  if (sorted.length > 0) {
    const recent = sorted[0];
    if (
      recent.overallJudgment === "outstanding" ||
      recent.overallJudgment === "good"
    ) {
      strengths.push(
        `Previous inspection outcome was ${AREA_STATUS_LABELS[recent.overallJudgment]}`,
      );
    }
  }

  // Evidence coverage
  const coveredReqs = new Set(evidenceItems.map((e) => e.requirement));
  const coverageRate = Math.round(
    (coveredReqs.size / ALL_SCCIF_REQUIREMENTS.length) * 100,
  );
  if (coverageRate >= 80) {
    strengths.push(
      `SCCIF evidence coverage at ${coverageRate}% across the 15 requirements`,
    );
  }

  return strengths;
}

function buildAreasForImprovement(
  areaScores: AreaScore[],
  evidenceItems: SCCIFEvidenceItem[],
  actionItems: ActionPlanItem[],
  gapAnalysis: GapAnalysisItem[],
): string[] {
  const improvements: string[] = [];

  // Low-scoring areas
  const lowAreas = areaScores.filter((a) => a.score < 60);
  if (lowAreas.length > 0) {
    for (const a of lowAreas) {
      improvements.push(
        `${a.area} area scored ${a.score} — needs focused improvement`,
      );
    }
  }

  // Missing evidence
  const missingGaps = gapAnalysis.filter((g) => g.currentStrength === "missing");
  if (missingGaps.length > 0) {
    improvements.push(
      `${missingGaps.length} SCCIF requirement${missingGaps.length > 1 ? "s" : ""} with no evidence collected`,
    );
  }

  // Weak evidence
  const weakGaps = gapAnalysis.filter(
    (g) => g.currentStrength === "weak" || g.currentStrength === "absent",
  );
  if (weakGaps.length > 0) {
    improvements.push(
      `${weakGaps.length} evidence area${weakGaps.length > 1 ? "s" : ""} rated weak or absent`,
    );
  }

  // Overdue actions
  const overdue = actionItems.filter((a) => a.status === "overdue");
  if (overdue.length > 0) {
    improvements.push(
      `${overdue.length} action${overdue.length > 1 ? "s" : ""} overdue — requires immediate attention`,
    );
  }

  return improvements;
}

function buildActions(
  gapAnalysis: GapAnalysisItem[],
  actionItems: ActionPlanItem[],
  areaScores: AreaScore[],
): string[] {
  const actions: string[] = [];

  // Critical gaps first
  const criticalGaps = gapAnalysis.filter((g) => g.priority === "critical");
  for (const gap of criticalGaps) {
    actions.push(gap.recommendation);
  }

  // High priority gaps
  const highGaps = gapAnalysis.filter((g) => g.priority === "high");
  for (const gap of highGaps) {
    actions.push(gap.recommendation);
  }

  // Overdue actions
  const overdue = actionItems.filter((a) => a.status === "overdue");
  for (const a of overdue) {
    actions.push(`Complete overdue action: ${a.description}`);
  }

  // Low-scoring areas
  const lowAreas = areaScores.filter((a) => a.score < 60);
  for (const area of lowAreas) {
    actions.push(`Develop improvement plan for ${area.area} (currently ${area.score}/100)`);
  }

  return actions;
}

// ── Judgment Area Summaries ────────────────────────────────────────────────

function buildJudgmentAreaSummaries(
  areaScores: AreaScore[],
  evidenceItems: SCCIFEvidenceItem[],
): JudgmentAreaSummary[] {
  return ALL_JUDGMENT_AREAS.map((area) => {
    // Get area scores mapped to this judgment area
    const mappedScores = areaScores.filter(
      (as) => AREA_TO_JUDGMENT[as.area] === area,
    );
    const avgScore =
      mappedScores.length > 0
        ? Math.round(
            (mappedScores.reduce((sum, a) => sum + a.score, 0) /
              mappedScores.length) *
              100,
          ) / 100
        : 0;

    // Get evidence for this judgment area
    const areaEvidence = evidenceItems.filter(
      (e) => e.judgmentArea === area,
    );

    return {
      area,
      label: JUDGMENT_AREA_LABELS[area],
      averageScore: avgScore,
      areaCount: mappedScores.length,
      evidenceCount: areaEvidence.length,
      absentEvidenceCount: areaEvidence.filter(
        (e) => e.evidenceStrength === "absent",
      ).length,
      weakEvidenceCount: areaEvidence.filter(
        (e) => e.evidenceStrength === "weak",
      ).length,
      strongEvidenceCount: areaEvidence.filter(
        (e) => e.evidenceStrength === "strong",
      ).length,
      readinessContribution: avgScore >= 80 ? 6 : avgScore >= 60 ? 4 : avgScore >= 40 ? 2 : 0,
    };
  });
}

// ── Main Function ──────────────────────────────────────────────────────────

export function generateOfstedReadinessIntelligence(
  areaScores: AreaScore[],
  evidenceItems: SCCIFEvidenceItem[],
  inspectionHistory: InspectionHistory[],
  actionItems: ActionPlanItem[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): OfstedReadinessIntelligence {
  const judgmentAreaReadinessScore = evaluateJudgmentAreaReadiness(
    areaScores,
    evidenceItems,
  );
  const evidencePortfolioScore = evaluateEvidencePortfolio(
    evidenceItems,
    periodEnd,
  );
  const actionPlanProgressScore = evaluateActionPlanProgress(
    actionItems,
    inspectionHistory,
  );
  const inspectionPreparednessScore = evaluateInspectionPreparedness(
    inspectionHistory,
    areaScores,
    actionItems,
    periodEnd,
  );

  const overallScore = clamp(
    Math.round(
      (judgmentAreaReadinessScore +
        evidencePortfolioScore +
        actionPlanProgressScore +
        inspectionPreparednessScore) *
        100,
    ) / 100,
    0,
    100,
  );

  const gapAnalysis = buildGapAnalysis(evidenceItems);
  const judgmentAreaSummaries = buildJudgmentAreaSummaries(
    areaScores,
    evidenceItems,
  );

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating: getRating(overallScore),
    readiness: getReadiness(overallScore),
    judgmentAreaReadinessScore,
    evidencePortfolioScore,
    actionPlanProgressScore,
    inspectionPreparednessScore,
    judgmentAreaSummaries,
    gapAnalysis,
    strengths: buildStrengths(
      areaScores,
      evidenceItems,
      actionItems,
      inspectionHistory,
    ),
    areasForImprovement: buildAreasForImprovement(
      areaScores,
      evidenceItems,
      actionItems,
      gapAnalysis,
    ),
    actions: buildActions(gapAnalysis, actionItems, areaScores),
    regulatoryLinks: REGULATORY_LINKS,
  };
}
