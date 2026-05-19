// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Education Attainment & Progress Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateEducationQuality,
  evaluateEducationCompliance,
  evaluateEducationPolicy,
  evaluateStaffEducationReadiness,
  buildChildEducationProfiles,
  generateEducationAttainmentProgressIntelligence,
  getEducationAreaLabel,
  getProgressLevelLabel,
  getRatingLabel,
} from "./education-attainment-progress-engine";

export type {
  EducationArea,
  ProgressLevel,
  Rating,
  EducationRecord,
  EducationPolicy,
  StaffEducationTraining,
  EducationQualityResult,
  EducationComplianceResult,
  EducationPolicyResult,
  StaffEducationReadinessResult,
  ChildEducationProfile,
  EducationAttainmentProgressIntelligence,
} from "./education-attainment-progress-engine";
