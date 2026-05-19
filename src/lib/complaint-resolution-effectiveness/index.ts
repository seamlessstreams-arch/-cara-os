// ==============================================================================
// Cornerstone Complaint Resolution Effectiveness Intelligence -- Public API
// ==============================================================================

export {
  evaluateResolutionQuality,
  evaluateComplaintCompliance,
  evaluateComplaintPolicy,
  evaluateStaffComplaintReadiness,
  buildChildComplaintProfiles,
  generateComplaintResolutionEffectivenessIntelligence,
  getComplaintSourceLabel,
  getResolutionOutcomeLabel,
  getRatingLabel,
  getRating,
  pct,
} from "./complaint-resolution-effectiveness-engine";

export type {
  ComplaintSource,
  ResolutionOutcome,
  Rating,
  ComplaintRecord,
  ComplaintPolicy,
  StaffComplaintTraining,
  ResolutionQualityResult,
  ComplaintComplianceResult,
  ComplaintPolicyResult,
  StaffComplaintReadinessResult,
  ChildComplaintProfile,
  ComplaintResolutionEffectivenessIntelligence,
} from "./complaint-resolution-effectiveness-engine";
