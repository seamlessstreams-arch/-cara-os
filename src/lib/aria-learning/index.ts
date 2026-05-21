// ══════════════════════════════════════════════════════════════════════════════
// ARIA Agent Learning & Cost Reduction Layer — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateAriaLearningIntelligence,
  evaluateAriaLearningQuality,
  evaluateAriaLearningCompliance,
  evaluateAriaLearningPolicy,
  evaluateStaffAriaLearningReadiness,
  buildChildAriaLearningProfiles,
  pct,
  getRating,
  getAriaLearningCategoryLabel,
  getAriaLearningOutcomeLabel,
  getRatingLabel,
} from "./aria-learning-intelligence-engine";

export type {
  AriaLearningCategory,
  AriaLearningOutcome,
  Rating,
  AriaLearningRecord,
  AriaLearningPolicy,
  StaffAriaLearningTraining,
  AriaLearningQualityResult,
  AriaLearningComplianceResult,
  AriaLearningPolicyResult,
  StaffAriaLearningReadinessResult,
  ChildAriaLearningProfile,
  AriaLearningIntelligence,
  GenerateAriaLearningIntelligenceInput,
} from "./aria-learning-intelligence-engine";

// Legacy re-exports from aria-learning-engine
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
