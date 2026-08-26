export {
  generatePremisesIntelligenceReport,
  evaluatePremisesQuality,
  evaluatePremisesCompliance,
  evaluatePremisesPolicy,
  evaluateStaffPremisesReadiness,
  buildAreaProfiles,
  getRating,
  getPremisesIntelligenceCategoryLabel,
  getPremisesIntelligenceOutcomeLabel,
  getRatingLabel,
} from "./premises-intelligence-engine";

export type {
  PremisesIntelligenceCategory,
  PremisesIntelligenceOutcome,
  PremisesIntelligenceRating,
  PremisesIntelligenceRecord,
  PremisesIntelligencePolicy,
  StaffPremisesTraining,
  PremisesIntelligenceQualityResult,
  PremisesIntelligenceComplianceResult,
  PremisesIntelligencePolicyResult,
  StaffPremisesReadinessResult,
  AreaProfile,
  PremisesIntelligenceResult,
  GeneratePremisesIntelligenceInput,
} from "./premises-intelligence-engine";

// Legacy re-exports from premises-engine
export {
  evaluateComplianceChecks,
  evaluateMaintenance,
  evaluateFireDrills,
  evaluateEnvironmentalRisks,
  generatePremisesIntelligence,
  getCategoryLabel,
} from "./premises-engine";

export type {
  CheckCategory,
  CheckStatus,
  Urgency,
  MaintenanceStatus,
  PremisesCheck,
  MaintenanceRequest,
  FireDrillRecord,
  EnvironmentalRisk,
  ComplianceResult,
  MaintenanceResult,
  FireDrillResult,
  EnvironmentalRiskResult,
  PremisesRating,
  PremisesIntelligenceResult as LegacyPremisesIntelligenceResult,
} from "./premises-engine";
