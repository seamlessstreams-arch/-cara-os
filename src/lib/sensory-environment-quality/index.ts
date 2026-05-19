// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Sensory Environment Quality Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateSensoryQuality,
  evaluateSensoryCompliance,
  evaluateSensoryPolicy,
  evaluateStaffSensoryReadiness,
  buildChildSensoryProfiles,
  generateSensoryEnvironmentQualityIntelligence,
  getSensoryAreaLabel,
  getEffectivenessLevelLabel,
  getRatingLabel,
  pct,
  getRating,
} from "./sensory-environment-quality-engine";

export type {
  SensoryArea,
  EffectivenessLevel,
  Rating,
  SensoryAssessment,
  SensoryPolicy,
  StaffSensoryTraining,
  SensoryQualityResult,
  SensoryComplianceResult,
  SensoryPolicyResult,
  StaffSensoryReadinessResult,
  ChildSensoryProfile,
  SensoryEnvironmentQualityIntelligence,
} from "./sensory-environment-quality-engine";
