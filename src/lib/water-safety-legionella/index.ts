// ==============================================================================
// Cara Water Safety & Legionella Intelligence — Public API
// ==============================================================================

export {
  evaluateTemperatureCompliance,
  evaluateLegionellaManagement,
  evaluateWaterSafetyPolicy,
  evaluateStaffWaterReadiness,
  buildWaterSafetyLocationProfiles,
  generateWaterSafetyLegionellaIntelligence,
  getRating,
  getWaterSourceTypeLabel,
  getCheckOutcomeLabel,
  getRiskLevelLabel,
  getComplianceStatusLabel,
  getRatingLabel,
} from "./water-safety-legionella-engine";

export type {
  WaterSourceType,
  CheckOutcome,
  RiskLevel,
  ComplianceStatus,
  Rating,
  TemperatureCheck,
  LegionellaAssessment,
  WaterSafetyPolicy,
  StaffWaterSafetyTraining,
  TemperatureComplianceResult,
  LegionellaManagementResult,
  WaterSafetyPolicyResult,
  StaffWaterReadinessResult,
  WaterSafetyLocationProfile,
  WaterSafetyLegionellaIntelligence,
} from "./water-safety-legionella-engine";
