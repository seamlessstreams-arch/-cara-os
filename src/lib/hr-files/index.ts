// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone HR Files — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateHrFilesIntelligence,
  evaluateHrFilesQuality,
  evaluateHrFilesCompliance,
  evaluateHrFilesPolicy,
  evaluateStaffHrFilesReadiness,
  buildChildHrFilesProfiles,
  pct,
  getRating,
  getHrFilesCategoryLabel,
  getHrFilesOutcomeLabel,
  getRatingLabel,
} from "./hr-files-intelligence-engine";

export type {
  HrFilesCategory,
  HrFilesOutcome,
  Rating,
  HrFilesRecord,
  HrFilesPolicy,
  StaffHrFilesTraining,
  HrFilesQualityResult,
  HrFilesComplianceResult,
  HrFilesPolicyResult,
  StaffHrFilesReadinessResult,
  ChildHrFilesProfile,
  HrFilesIntelligence,
  GenerateHrFilesIntelligenceInput,
} from "./hr-files-intelligence-engine";

// Legacy re-exports from workforce-engine
export {
  evaluateTrainingCompliance,
  evaluateSupervisionCompliance,
  calculateWorkforceMetrics,
  identifyTrainingGaps,
  getMandatoryTraining,
  getTrainingRenewalYears,
  formatTrainingName,
} from "./workforce-engine";

export type {
  TrainingCategory,
  TrainingStatus,
  SupervisionType,
  AbsenceType,
  ProbationStatus,
  StaffMember,
  TrainingRecord,
  SupervisionRecord,
  AbsenceRecord,
  ProbationRecord,
  TrainingComplianceResult,
  SupervisionComplianceResult,
  WorkforceMetrics,
  TrainingGap,
} from "./workforce-engine";
