/* ──────────────────────────────────────────────────────────────
   Health Intelligence — Public API
   ────────────────────────────────────────────────────────────── */

export {
  pct,
  getRating,
  getAssessmentTypeLabel,
  getOutcomeLabel,
  getRatingLabel,
  evaluateHealthQuality,
  evaluateHealthCompliance,
  evaluateHealthPolicy,
  evaluateStaffHealthReadiness,
  buildChildHealthProfiles,
  generateHealthIntelligence,
} from "./health-engine";

export type {
  HealthAssessmentType,
  AssessmentOutcome,
  Rating,
  HealthRecord,
  HealthPolicy,
  StaffHealthTraining,
  HealthQualityResult,
  HealthComplianceResult,
  HealthPolicyResult,
  StaffHealthReadinessResult,
  ChildHealthProfile,
  HealthIntelligence,
} from "./health-engine";

/* ── Health Intelligence Engine (v2) ────────────────────────── */

export {
  healthIntelligencePct,
  getHealthIntelligenceRating,
  getHealthIntelligenceCategoryLabel,
  getHealthIntelligenceOutcomeLabel,
  getHealthIntelligenceRatingLabel,
  evaluateHealthIntelligenceQuality,
  evaluateHealthIntelligenceCompliance,
  evaluateHealthIntelligencePolicy,
  evaluateStaffHealthIntelligenceReadiness,
  buildChildHealthIntelligenceProfiles,
  generateHealthIntelligenceResult,
} from "./health-intelligence-engine";

export type {
  HealthIntelligenceCategory,
  HealthIntelligenceOutcome,
  HealthIntelligenceRating,
  HealthIntelligenceRecord,
  HealthIntelligencePolicy,
  StaffHealthIntelligenceTraining,
  HealthIntelligenceQualityResult,
  HealthIntelligenceComplianceResult,
  HealthIntelligencePolicyResult,
  StaffHealthIntelligenceReadinessResult,
  ChildHealthIntelligenceProfile,
  HealthIntelligenceResult,
  GenerateHealthIntelligenceInput,
} from "./health-intelligence-engine";
