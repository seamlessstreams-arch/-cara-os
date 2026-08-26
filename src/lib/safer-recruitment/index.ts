export {
  generateSaferRecruitmentIntelligence,
  evaluateSaferRecruitmentQuality,
  evaluateSaferRecruitmentCompliance,
  evaluateSaferRecruitmentPolicy,
  evaluateStaffSaferRecruitmentReadiness,
  buildStaffRecruitmentProfiles,
  getRating,
  getSaferRecruitmentCategoryLabel,
  getSaferRecruitmentOutcomeLabel,
  getRatingLabel,
} from "./safer-recruitment-engine";

export type {
  SaferRecruitmentCategory,
  SaferRecruitmentOutcome,
  Rating,
  SaferRecruitmentRecord,
  SaferRecruitmentPolicy,
  StaffSaferRecruitmentTraining,
  SaferRecruitmentQualityResult,
  SaferRecruitmentComplianceResult,
  SaferRecruitmentPolicyResult,
  StaffSaferRecruitmentReadinessResult,
  StaffRecruitmentProfile,
  SaferRecruitmentIntelligence,
  GenerateSaferRecruitmentIntelligenceInput,
} from "./safer-recruitment-engine";

// Legacy re-exports from compliance-engine
export {
  evaluateCompliance,
  checkStartReadiness,
  calculatePipelineMetrics,
  checkDBSRenewals,
  formatCheckName,
  getRequiredChecks,
} from "./compliance-engine";

export type {
  RecruitmentStage,
  CheckType,
  CheckStatus,
  ComplianceSeverity,
  CandidateChecklist,
  RecruitmentCheck,
  ComplianceIssue,
  ComplianceResult,
  PipelineMetrics,
  DBSRenewalItem,
} from "./compliance-engine";
