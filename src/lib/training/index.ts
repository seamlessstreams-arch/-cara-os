// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Training & Development — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateStaffTrainingCompliance,
  calculateHomeTrainingMetrics,
  getTrainingCategoryLabel,
  getTrainingStatusLabel,
  getQualificationStatusLabel,
  MANDATORY_TRAINING,
} from "./training-engine";

export type {
  TrainingCategory,
  TrainingStatus,
  QualificationLevel,
  QualificationStatus,
  StaffTrainingRecord,
  TrainingCompletion,
  Qualification,
  MandatoryTrainingItem,
  StaffTrainingComplianceResult,
  HomeTrainingMetrics,
} from "./training-engine";
