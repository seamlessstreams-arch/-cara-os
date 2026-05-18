// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Ofsted Readiness Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateOfstedReadinessIntelligence,
  evaluateJudgmentAreaReadiness,
  evaluateEvidencePortfolio,
  evaluateActionPlanProgress,
  evaluateInspectionPreparedness,
  getJudgmentAreaLabel,
  getEvidenceStrengthLabel,
  getInspectionReadinessLabel,
  getSCCIFRequirementLabel,
  getAreaStatusLabel,
  getActionSourceLabel,
  getActionPriorityLabel,
  ALL_SCCIF_REQUIREMENTS,
  ALL_JUDGMENT_AREAS,
} from "./ofsted-readiness-engine";

export type {
  JudgmentArea,
  EvidenceStrength,
  InspectionReadiness,
  SCCIFRequirement,
  AreaStatus,
  Rating,
  AreaScore,
  SCCIFEvidenceItem,
  InspectionHistory,
  ActionPlanItem,
  JudgmentAreaSummary,
  GapAnalysisItem,
  RegulatoryLink,
  OfstedReadinessIntelligence,
} from "./ofsted-readiness-engine";
