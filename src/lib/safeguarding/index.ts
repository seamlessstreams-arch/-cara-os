export {
  determineEscalation,
  evaluateConcernCompliance,
  calculateSafeguardingMetrics,
  buildSafeguardingTimeline,
  getOverdueConcerns,
  formatCategory,
  formatSeverity,
  formatStatus,
  requiresOfstedNotification,
  isHighRiskCategory,
} from "./safeguarding-engine";

export type {
  ConcernCategory,
  ConcernSeverity,
  ConcernStatus,
  ReferralDestination,
  EscalationLevel,
  SafeguardingConcern,
  SafeguardingReferral,
  ChronologyEntry,
  ConcernComplianceResult,
  SafeguardingMetrics,
  EscalationDecision,
  SafeguardingTimeline,
} from "./safeguarding-engine";
