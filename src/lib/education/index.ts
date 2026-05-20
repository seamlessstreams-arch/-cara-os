// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Education Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  pct,
  getRating,
  getPlacementLabel,
  getAttainmentLabel,
  getRatingLabel,
  evaluateEducationQuality,
  evaluateEducationCompliance,
  evaluateEducationPolicy,
  evaluateStaffEducationReadiness,
  buildChildEducationProfiles,
  generateEducationIntelligence,
} from "./education-engine";

export type {
  EducationPlacement,
  AttainmentLevel,
  Rating,
  EducationRecord,
  EducationPolicy,
  StaffEducationTraining,
  EducationQualityResult,
  EducationComplianceResult,
  EducationPolicyResult,
  StaffEducationReadinessResult,
  ChildEducationProfile,
  EducationIntelligence,
} from "./education-engine";
