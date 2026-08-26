export {
  generateSafeguardingReferralQualityIntelligence,
  evaluateReferralQuality,
  evaluateReferralCompliance,
  evaluateSafeguardingPolicy,
  evaluateStaffSafeguardingReadiness,
  buildChildSafeguardingProfiles,
  getRating,
  getReferralTypeLabel,
  getReferralOutcomeLabel,
  getRatingLabel,
} from "./safeguarding-referral-quality-engine";

export type {
  ReferralType,
  ReferralOutcome,
  Rating,
  SafeguardingReferral,
  SafeguardingPolicy,
  StaffSafeguardingTraining,
  ReferralQualityResult,
  ReferralComplianceResult,
  SafeguardingPolicyResult,
  StaffSafeguardingReadinessResult,
  ChildSafeguardingProfile,
  SafeguardingReferralQualityIntelligence,
} from "./safeguarding-referral-quality-engine";
