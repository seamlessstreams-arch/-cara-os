// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Cultural Identity Support Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateIdentityRecognition,
  evaluateCulturalProvision,
  evaluateDietaryRespect,
  evaluateStaffCompetence,
  buildChildCulturalProfiles,
  generateCulturalIdentitySupportIntelligence,
  getRating,
  getIdentityDimensionLabel,
  getSupportLevelLabel,
  getDietaryProvisionLabel,
  getCulturalActivityTypeLabel,
  getStaffCompetenceLevelLabel,
  getRatingLabel,
} from "./cultural-identity-support-engine";

export type {
  IdentityDimension,
  SupportLevel,
  DietaryProvision,
  CulturalActivityType,
  StaffCompetenceLevel,
  Rating,
  IdentityAssessment,
  CulturalActivity,
  DietaryNeedRecord,
  StaffCulturalCompetence,
  IdentityRecognitionResult,
  CulturalProvisionResult,
  DietaryRespectResult,
  StaffCompetenceResult,
  ChildCulturalProfile,
  CulturalIdentitySupportIntelligence,
} from "./cultural-identity-support-engine";
