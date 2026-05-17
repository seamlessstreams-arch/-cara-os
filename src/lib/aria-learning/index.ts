// ══════════════════════════════════════════════════════════════════════════════
// ARIA Agent Learning & Cost Reduction Layer — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateAgentReadiness,
  calculateOrganisationLearningMetrics,
  getReplacementStatusLabel,
  getAgentTypeLabel,
  getResolutionTierLabel,
  getRiskLevelLabel,
} from "./aria-learning-engine";

export type {
  ReplacementStatus,
  AgentType,
  RiskLevel,
  ResolutionTier,
  AgentCapabilityProfile,
  ReplacementRequirement,
  AgentReadinessResult,
  OrganisationLearningMetrics,
} from "./aria-learning-engine";
