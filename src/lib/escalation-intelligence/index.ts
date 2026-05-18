// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Escalation & Threshold Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

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
