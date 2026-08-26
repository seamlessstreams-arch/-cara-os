// ══════════════════════════════════════════════════════════════════════════════
// Cara Fire Safety Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  getRating,
  getFireSafetyCategoryLabel,
  getFireSafetyOutcomeLabel,
  getRatingLabel,
  evaluateFireSafetyQuality,
  evaluateFireSafetyCompliance,
  evaluateFireSafetyPolicy,
  evaluateFireSafetyStaffReadiness,
  buildChildFireSafetyProfiles,
  generateFireSafetyIntelligence,
} from "./fire-safety-engine";

export type {
  FireSafetyCategory,
  FireSafetyOutcome,
  Rating,
  FireSafetyRecord,
  FireSafetyPolicy,
  FireSafetyStaffTraining,
  FireSafetyQualityResult,
  FireSafetyComplianceResult,
  FireSafetyPolicyResult,
  FireSafetyStaffReadinessResult,
  ChildFireSafetyProfile,
  FireSafetyIntelligence,
} from "./fire-safety-engine";
