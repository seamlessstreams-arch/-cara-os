export {
  generateComplaintsIntelligence,
  evaluateComplaintQuality,
  evaluateComplaintCompliance,
  evaluateComplaintPolicy,
  evaluateStaffComplaintReadiness,
  buildChildComplaintProfiles,
  pct,
  getRating,
  getComplaintCategoryLabel,
  getComplaintOutcomeLabel,
  getRatingLabel,
} from "./complaints-engine";

export type {
  ComplaintCategory,
  ComplaintOutcome,
  Rating,
  ComplaintRecord,
  ComplaintPolicy,
  StaffComplaintTraining,
  ComplaintQualityResult,
  ComplaintComplianceResult,
  ComplaintPolicyResult,
  StaffComplaintReadinessResult,
  ChildComplaintProfile,
  ComplaintsIntelligence,
} from "./complaints-engine";
