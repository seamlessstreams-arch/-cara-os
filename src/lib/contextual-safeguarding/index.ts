export {
  generateContextualSafeguardingIntelligence,
  evaluateContextualSafeguardingQuality,
  evaluateContextualSafeguardingCompliance,
  evaluateContextualSafeguardingPolicy,
  evaluateStaffContextualSafeguardingReadiness,
  buildChildContextualSafeguardingProfiles,
  pct,
  getRating,
  getContextualSafeguardingCategoryLabel,
  getContextualSafeguardingOutcomeLabel,
  getRatingLabel,
} from "./contextual-safeguarding-intelligence-engine";

export type {
  ContextualSafeguardingCategory,
  ContextualSafeguardingOutcome,
  Rating,
  ContextualSafeguardingRecord,
  ContextualSafeguardingPolicy,
  StaffContextualSafeguardingTraining,
  ContextualSafeguardingQualityResult,
  ContextualSafeguardingComplianceResult,
  ContextualSafeguardingPolicyResult,
  StaffContextualSafeguardingReadinessResult,
  ChildContextualSafeguardingProfile,
  ContextualSafeguardingIntelligence,
  GenerateContextualSafeguardingIntelligenceInput,
} from "./contextual-safeguarding-intelligence-engine";

// Legacy re-exports from contextual-safeguarding-engine
export {
  generateContextualAssessment,
  buildChildProfile,
  calculateChildRiskScore,
  calculateProtectiveScore,
  determineRiskLevel,
  identifyProtectiveGaps,
  getHarmDomainLabel,
  getEnvironmentTypeLabel,
  getRiskLevelLabel,
  getProtectiveFactorLabel,
} from "./contextual-safeguarding-engine";

export type {
  HarmDomain,
  EnvironmentType,
  RiskLevel,
  ProtectiveFactorType,
  InterventionStatus,
  EnvironmentalRisk,
  PeerAssociation,
  OnlineRisk,
  ProtectiveFactor,
  Intervention,
  MappingEvent,
  ChildContextualProfile,
  ContextualSafeguardingResult,
} from "./contextual-safeguarding-engine";
