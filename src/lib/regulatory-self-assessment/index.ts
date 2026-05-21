// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Regulatory Self-Assessment Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateRegSelfAssessmentIntelligence,
  evaluateRegSelfAssessmentQuality,
  evaluateRegSelfAssessmentCompliance,
  evaluateRegSelfAssessmentPolicy,
  evaluateStaffRegSelfAssessmentReadiness,
  buildChildRegSelfAssessmentProfiles,
  pct,
  getRating,
  getRegSelfAssessmentCategoryLabel,
  getRegSelfAssessmentOutcomeLabel,
  getRatingLabel,
} from "./regulatory-self-assessment-intelligence-engine";

export type {
  RegSelfAssessmentCategory,
  RegSelfAssessmentOutcome,
  Rating,
  RegSelfAssessmentRecord,
  RegSelfAssessmentPolicy,
  StaffRegSelfAssessmentTraining,
  RegSelfAssessmentQualityResult,
  RegSelfAssessmentComplianceResult,
  RegSelfAssessmentPolicyResult,
  StaffRegSelfAssessmentReadinessResult,
  ChildRegSelfAssessmentProfile,
  RegSelfAssessmentIntelligence,
  GenerateRegSelfAssessmentIntelligenceInput,
} from "./regulatory-self-assessment-intelligence-engine";

// Legacy re-exports from regulatory-self-assessment-engine
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
