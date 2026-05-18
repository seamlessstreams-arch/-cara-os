// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Regulatory Self-Assessment Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  analyseSelfAssessment,
  calculateRating,
  getAreaCompliance,
  countAreasByCompliance,
  getCriticalActions,
  getOverdueActions,
  getUnaddressedFeedback,
  getAreaLabel,
  getComplianceLabel,
  getPriorityLabel,
  getEvidenceTypeLabel,
  ALL_REGULATION_AREAS,
} from "./regulatory-self-assessment-engine";

export type {
  RegulationArea,
  ComplianceLevel,
  EvidenceType,
  ActionPriority,
  SelfAssessmentEntry,
  ImprovementAction,
  ExternalFeedback,
  OverallRating,
  SelfAssessmentAnalysis,
  AreaBreakdownEntry,
  RegulatoryLink,
} from "./regulatory-self-assessment-engine";
