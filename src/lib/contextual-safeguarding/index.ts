// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Contextual Safeguarding Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

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
