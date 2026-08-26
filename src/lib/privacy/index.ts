// ══════════════════════════════════════════════════════════════════════════════
// Cara Children's Privacy Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  getRating,
  getPrivacyCategoryLabel,
  getPrivacyOutcomeLabel,
  getRatingLabel,
  evaluatePrivacyQuality,
  evaluatePrivacyCompliance,
  evaluatePrivacyPolicy,
  evaluateStaffPrivacyReadiness,
  buildChildPrivacyProfiles,
  generatePrivacyIntelligence,
} from "./privacy-engine";

export type {
  PrivacyCategory,
  PrivacyOutcome,
  Rating,
  PrivacyRecord,
  PrivacyPolicy,
  StaffPrivacyTraining,
  PrivacyQualityResult,
  PrivacyComplianceResult,
  PrivacyPolicyResult,
  StaffPrivacyReadinessResult,
  ChildPrivacyProfile,
  PrivacyIntelligence,
} from "./privacy-engine";
