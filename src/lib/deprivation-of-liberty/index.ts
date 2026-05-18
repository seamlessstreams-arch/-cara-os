// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Deprivation of Liberty Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateAuthorisationCompliance,
  evaluateProportionality,
  evaluateReviewSafeguards,
  evaluateRightsProtection,
  buildChildDoLSProfiles,
  generateDeprivationOfLibertyIntelligence,
  getRating,
  getRestrictionTypeLabel,
  getAuthorisationStatusLabel,
  getReviewOutcomeLabel,
  getProportionalityLabel,
  getChildViewStatusLabel,
  getSafeguardTypeLabel,
} from "./deprivation-of-liberty-engine";

export type {
  RestrictionType,
  AuthorisationStatus,
  ReviewOutcome,
  ProportionalityAssessment,
  ChildViewStatus,
  SafeguardType,
  Rating,
  RestrictionRecord,
  DoLSReview,
  ChildRightsSafeguard,
  LegalCompliance,
  AuthorisationComplianceResult,
  ProportionalityResult,
  ReviewSafeguardsResult,
  RightsProtectionResult,
  ChildDoLSProfile,
  DeprivationOfLibertyIntelligence,
} from "./deprivation-of-liberty-engine";
