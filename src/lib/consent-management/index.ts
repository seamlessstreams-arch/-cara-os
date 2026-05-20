export {
  pct,
  getRating,
  getConsentCategoryLabel,
  getConsentStatusLabel,
  getRatingLabel,
  evaluateConsentQuality,
  evaluateConsentCompliance,
  evaluateConsentPolicy,
  evaluateStaffConsentReadiness,
  buildChildConsentProfiles,
  generateConsentManagementIntelligence,
} from "./consent-management-engine";

export type {
  ConsentCategory,
  ConsentStatus,
  Rating,
  ConsentRecord,
  ConsentPolicy,
  StaffConsentTraining,
  ConsentQualityResult,
  ConsentComplianceResult,
  ConsentPolicyResult,
  StaffConsentReadinessResult,
  ChildConsentProfile,
  ConsentManagementIntelligence,
} from "./consent-management-engine";
