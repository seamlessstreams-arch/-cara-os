// ══════════════════════════════════════════════════════════════════════════════
// Therapeutic Support & Emotional Wellbeing — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateTherapeuticIntelligence,
  evaluateTherapeuticQuality,
  evaluateTherapeuticCompliance,
  evaluateTherapeuticPolicy,
  evaluateStaffTherapeuticReadiness,
  buildChildTherapeuticProfiles,
  pct,
  getRating,
  getTherapeuticCategoryLabel,
  getTherapeuticOutcomeLabel,
  getRatingLabel,
} from "./therapeutic-intelligence-engine";

export type {
  TherapeuticCategory,
  TherapeuticOutcome,
  Rating,
  TherapeuticRecord,
  TherapeuticPolicy,
  StaffTherapeuticTraining,
  TherapeuticQualityResult,
  TherapeuticComplianceResult,
  TherapeuticPolicyResult,
  StaffTherapeuticReadinessResult,
  ChildTherapeuticProfile,
  TherapeuticIntelligence,
  GenerateTherapeuticIntelligenceInput,
} from "./therapeutic-intelligence-engine";

// Legacy re-exports from therapeutic-engine
export {
  evaluateTherapeuticCompliance as evaluateTherapeuticComplianceLegacy,
  calculateHomeTherapeuticMetrics,
  getModelLabel,
  getWellbeingDomainLabel,
  getRegulationLevelLabel,
} from "./therapeutic-engine";

export type {
  TherapeuticModel,
  EmotionalRegulationLevel,
  MentalHealthStatus,
  ReferralStatus,
  InterventionType,
  WellbeingDomain,
  WellbeingScore,
  TherapeuticIntervention,
  CAMHSReferral,
  CrisisEvent,
  ChildTherapeuticProfile as ChildTherapeuticProfileLegacy,
  HomeTherapeuticConfig,
  TherapeuticComplianceResult as TherapeuticComplianceResultLegacy,
  HomeTherapeuticMetrics,
  ChildWellbeingSummary,
} from "./therapeutic-engine";
