// ==============================================================================
// Cara Outdoor Activity & Enrichment Intelligence — Public API
// ==============================================================================

export {
  evaluateActivityParticipation,
  evaluateEnrichmentQuality,
  evaluateRiskManagement,
  evaluateStaffReadiness,
  buildChildEnrichmentProfiles,
  generateOutdoorActivityEnrichmentIntelligence,
  getRating,
  getActivityCategoryLabel,
  getRiskBenefitOutcomeLabel,
  getChildEngagementLabel,
  getActivityFrequencyLabel,
  getWeatherConditionLabel,
  getRatingLabel,
} from "./outdoor-activity-enrichment-engine";

export type {
  ActivityCategory,
  RiskBenefitOutcome,
  ChildEngagement,
  ActivityFrequency,
  WeatherCondition,
  Rating,
  ActivityRecord,
  EnrichmentPlan,
  RiskBenefitAssessment,
  StaffActivityTraining,
  ActivityParticipationResult,
  EnrichmentQualityResult,
  RiskManagementResult,
  StaffReadinessResult,
  ChildEnrichmentProfile,
  OutdoorActivityEnrichmentIntelligence,
} from "./outdoor-activity-enrichment-engine";
