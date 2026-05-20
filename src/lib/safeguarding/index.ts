export {
  generateSafeguardingIntelligence,
  evaluateSafeguardingQuality,
  evaluateSafeguardingCompliance,
  evaluateSafeguardingPolicy,
  evaluateStaffSafeguardingReadiness,
  buildChildSafeguardingProfiles,
  pct,
  getRating,
  getSafeguardingCategoryLabel,
  getSafeguardingOutcomeLabel,
  getRatingLabel,
} from "./safeguarding-engine";

export type {
  SafeguardingCategory,
  SafeguardingOutcome,
  Rating,
  SafeguardingRecord,
  SafeguardingPolicy,
  StaffSafeguardingTraining,
  SafeguardingQualityResult,
  SafeguardingComplianceResult,
  SafeguardingPolicyResult,
  StaffSafeguardingReadinessResult,
  ChildSafeguardingProfile,
  SafeguardingIntelligence,
} from "./safeguarding-engine";
