// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Escalation & Threshold Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateEscalationThresholdIntelligence,
  evaluateEscalationThresholdQuality,
  evaluateEscalationThresholdCompliance,
  evaluateEscalationThresholdPolicy,
  evaluateStaffEscalationThresholdReadiness,
  buildChildEscalationThresholdProfiles,
  pct,
  getRating,
  getEscalationThresholdCategoryLabel,
  getEscalationThresholdOutcomeLabel,
  getRatingLabel,
} from "./escalation-threshold-intelligence-engine";

export type {
  EscalationThresholdCategory,
  EscalationThresholdOutcome,
  Rating,
  EscalationThresholdRecord,
  EscalationThresholdPolicy,
  StaffEscalationThresholdTraining,
  EscalationThresholdQualityResult,
  EscalationThresholdComplianceResult,
  EscalationThresholdPolicyResult,
  StaffEscalationThresholdReadinessResult,
  ChildEscalationThresholdProfile,
  EscalationThresholdIntelligence,
  GenerateEscalationThresholdIntelligenceInput,
} from "./escalation-threshold-intelligence-engine";

// Legacy re-exports from escalation-intelligence-engine
export {
  generateEscalationMetrics,
  assessConcern,
  getRequiredEscalations,
  determineThresholdLevel,
  getConcernCategoryLabel,
  getThresholdLevelLabel,
  getEscalationTargetLabel,
  getTimeframeLabel,
  getOutcomeLabel,
} from "./escalation-intelligence-engine";

export type {
  ConcernCategory,
  ThresholdLevel,
  EscalationTarget,
  NotificationTimeframe,
  EscalationOutcome,
  ConcernRecord,
  EscalationRecord,
  ThresholdRule,
  ThresholdAssessment,
  HomeEscalationMetrics,
} from "./escalation-intelligence-engine";
