// ══════════════════════════════════════════════════════════════════════════════
// Cara Agent Learning & Cost Reduction Layer — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateCaraLearningIntelligence,
  evaluateCaraLearningQuality,
  evaluateCaraLearningCompliance,
  evaluateCaraLearningPolicy,
  evaluateStaffCaraLearningReadiness,
  buildChildCaraLearningProfiles,
  pct,
  getRating,
  getCaraLearningCategoryLabel,
  getCaraLearningOutcomeLabel,
  getRatingLabel,
} from "./cara-learning-intelligence-engine";

export type {
  CaraLearningCategory,
  CaraLearningOutcome,
  Rating,
  CaraLearningRecord,
  CaraLearningPolicy,
  StaffCaraLearningTraining,
  CaraLearningQualityResult,
  CaraLearningComplianceResult,
  CaraLearningPolicyResult,
  StaffCaraLearningReadinessResult,
  ChildCaraLearningProfile,
  CaraLearningIntelligence,
  GenerateCaraLearningIntelligenceInput,
} from "./cara-learning-intelligence-engine";

// Legacy re-exports from cara-learning-engine
export {
  evaluateAgentReadiness,
  calculateOrganisationLearningMetrics,
  getReplacementStatusLabel,
  getAgentTypeLabel,
  getResolutionTierLabel,
  getRiskLevelLabel,
} from "./cara-learning-engine";

export type {
  ReplacementStatus,
  AgentType,
  RiskLevel,
  ResolutionTier,
  AgentCapabilityProfile,
  ReplacementRequirement,
  AgentReadinessResult,
  OrganisationLearningMetrics,
} from "./cara-learning-engine";
