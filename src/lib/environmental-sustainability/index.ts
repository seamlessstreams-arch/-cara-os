// ==============================================================================
// Cornerstone Environmental Sustainability Intelligence — Public API
// ==============================================================================

export {
  evaluateActivityEngagement,
  evaluateEnvironmentalPractice,
  evaluateSustainabilityPolicy,
  evaluateStaffSustainabilityReadiness,
  buildChildSustainabilityProfiles,
  generateEnvironmentalSustainabilityIntelligence,
  pct,
  getRating,
  getActivityTypeLabel,
  getEngagementLevelLabel,
  getRatingLabel,
} from "./environmental-sustainability-engine";

export type {
  ActivityType,
  EngagementLevel,
  Rating,
  SustainabilityActivity,
  SustainabilityPolicy,
  StaffSustainabilityTraining,
  ActivityEngagementResult,
  EnvironmentalPracticeResult,
  SustainabilityPolicyResult,
  StaffReadinessResult,
  ChildSustainabilityProfile,
  EnvironmentalSustainabilityIntelligence,
} from "./environmental-sustainability-engine";
