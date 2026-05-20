// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Environment Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  pct,
  getRating,
  getEnvironmentCategoryLabel,
  getEnvironmentOutcomeLabel,
  getRatingLabel,
  evaluateEnvironmentQuality,
  evaluateEnvironmentCompliance,
  evaluateEnvironmentPolicy,
  evaluateStaffEnvironmentReadiness,
  buildChildEnvironmentProfiles,
  generateEnvironmentIntelligence,
} from "./environment-engine";

export type {
  EnvironmentCategory,
  EnvironmentOutcome,
  Rating,
  EnvironmentRecord,
  EnvironmentPolicy,
  StaffEnvironmentTraining,
  EnvironmentQualityResult,
  EnvironmentComplianceResult,
  EnvironmentPolicyResult,
  StaffEnvironmentReadinessResult,
  ChildEnvironmentProfile,
  EnvironmentIntelligence,
} from "./environment-engine";
