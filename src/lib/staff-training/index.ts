export {
  evaluateMandatoryCompliance,
  evaluateCertifications,
  evaluateCpd,
  evaluateQualifications,
  evaluateSpecialistTraining,
  buildStaffProfiles,
  generateStaffTrainingIntelligence,
  getCategoryLabel,
  getRoleLabel,
  getMandatoryCategories,
} from "./staff-training-engine";

export type {
  TrainingCategory,
  QualificationLevel,
  StaffRole,
  TrainingRecord,
  StaffMember,
  ChildNeed,
  MandatoryComplianceResult,
  CertificationResult,
  CpdResult,
  QualificationResult,
  SpecialistTrainingResult,
  StaffTrainingProfile,
  StaffTrainingResult,
} from "./staff-training-engine";
