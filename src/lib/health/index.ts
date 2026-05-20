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
