export {
  generateAdmissionsIntelligence,
  evaluateAdmissionQuality,
  evaluateAdmissionCompliance,
  evaluateAdmissionPolicy,
  evaluateStaffAdmissionReadiness,
  buildChildAdmissionProfiles,
  pct,
  getRating,
  getAdmissionCategoryLabel,
  getAdmissionOutcomeLabel,
  getRatingLabel,
} from "./admissions-engine";

export type {
  AdmissionCategory,
  AdmissionOutcome,
  Rating,
  AdmissionRecord,
  AdmissionPolicy,
  StaffAdmissionTraining,
  AdmissionQualityResult,
  AdmissionComplianceResult,
  AdmissionPolicyResult,
  StaffAdmissionReadinessResult,
  ChildAdmissionProfile,
  AdmissionsIntelligence,
} from "./admissions-engine";
