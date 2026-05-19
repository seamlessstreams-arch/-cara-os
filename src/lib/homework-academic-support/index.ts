// ==============================================================================
// Cornerstone Homework & Academic Support Intelligence -- Public API
// ==============================================================================

export {
  evaluateHomeworkCompletion,
  evaluateAcademicInterventions,
  evaluateResourceProvision,
  evaluateStaffEducationReadiness,
  buildChildAcademicProfiles,
  generateHomeworkAcademicSupportIntelligence,
  getRating,
  getSubjectLabel,
  getCompletionLabel,
  getSupportLabel,
  getProgressLabel,
  getRatingLabel,
  getResourceLabel,
  getInterventionTypeLabel,
} from "./homework-academic-support-engine";

export type {
  SubjectArea,
  CompletionStatus,
  SupportType,
  AcademicProgress,
  Rating,
  HomeworkRecord,
  AcademicIntervention,
  EducationalResource,
  StaffEducationTraining,
  HomeworkCompletionResult,
  AcademicInterventionResult,
  ResourceProvisionResult,
  StaffEducationReadinessResult,
  ChildAcademicProfile,
  HomeworkAcademicSupportIntelligence,
} from "./homework-academic-support-engine";
