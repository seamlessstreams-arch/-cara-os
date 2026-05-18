// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Incident Pattern Analysis Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateIncidentResponse,
  evaluateNotificationCompliance,
  evaluatePatternAnalysis,
  evaluatePostIncident,
  buildChildIncidentProfiles,
  generateIncidentPatternAnalysisIntelligence,
  getRating,
  pct,
  getIncidentCategoryLabel,
  getIncidentSeverityLabel,
  getResponseQualityLabel,
  getNotificationStatusLabel,
  getDeEscalationOutcomeLabel,
  getPostIncidentActionLabel,
  getRatingLabel,
} from "./incident-pattern-analysis-engine";

export type {
  IncidentCategory,
  IncidentSeverity,
  ResponseQuality,
  NotificationStatus,
  DeEscalationOutcome,
  PostIncidentAction,
  Rating,
  IncidentRecord,
  IncidentTrend,
  StaffResponse,
  PatternIndicator,
  IncidentResponseResult,
  NotificationComplianceResult,
  PatternAnalysisResult,
  PostIncidentResult,
  ChildIncidentProfile,
  IncidentPatternAnalysisIntelligence,
} from "./incident-pattern-analysis-engine";
