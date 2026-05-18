// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Equality & Diversity Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateEqualityDiversityIntelligence,
  evaluateIndividualSupport,
  evaluateStaffCompetency,
  evaluateIncidentResponse,
  evaluateAccessibilityInclusion,
  getProtectedCharacteristicLabel,
  getSupportStatusLabel,
  getTrainingStatusLabel,
  getIncidentCategoryLabel,
  getIncidentSeverityLabel,
  getIncidentOutcomeLabel,
  getCulturalPlanStatusLabel,
  getDemoProfiles,
  getDemoTrainingRecords,
  getDemoIncidents,
  getDemoAudits,
} from "./equality-diversity-engine";

export type {
  ProtectedCharacteristic,
  SupportStatus,
  TrainingStatus,
  IncidentCategory,
  IncidentSeverity,
  IncidentOutcome,
  CulturalPlanStatus,
  Rating,
  ChildDiversityProfile,
  EDITrainingRecord,
  EDIIncident,
  AccessibilityAudit,
  IndividualSupportResult,
  StaffCompetencyResult,
  IncidentResponseResult,
  AccessibilityInclusionResult,
  ChildEDISummary,
  EqualityDiversityIntelligenceResult,
} from "./equality-diversity-engine";
