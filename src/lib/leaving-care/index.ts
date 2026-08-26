// ══════════════════════════════════════════════════════════════════════════════
// Cara Leaving Care Preparation Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluatePathwayPlanning,
  evaluateIndependenceSkills,
  evaluateAccommodationPlanning,
  evaluateSupportNetwork,
  buildChildLeavingProfiles,
  generateLeavingCareIntelligence,
  getRating,
  getReadinessLabel,
  getSkillCategoryLabel,
  getSkillLevelLabel,
  getPathwayPlanStatusLabel,
  getAccommodationTypeLabel,
  getAccommodationStatusLabel,
  getSupportTypeLabel,
  getSupportStatusLabel,
} from "./leaving-care-engine";

export type {
  PathwayPlanStatus,
  SkillLevel,
  SkillCategory,
  AccommodationType,
  AccommodationStatus,
  SupportType,
  SupportStatus,
  Rating,
  LeavingCareChild,
  PathwayPlan,
  IndependenceSkillAssessment,
  AccommodationPlan,
  SupportArrangement,
  PathwayPlanningResult,
  IndependenceSkillsResult,
  SkillCategoryBreakdown,
  AccommodationPlanningResult,
  SupportNetworkResult,
  ChildLeavingProfile,
  LeavingCareIntelligenceResult,
} from "./leaving-care-engine";

// Intelligence engine exports
export {
  generateLeavingCareIntelligence as generateLeavingCareIntelligenceReport,
  evaluateLeavingCareQuality,
  evaluateLeavingCareCompliance,
  evaluateLeavingCarePolicy,
  evaluateStaffLeavingCareReadiness,
  buildChildLeavingCareProfiles,
  getRatingIntel,
  getLeavingCareCategoryLabel,
  getLeavingCareOutcomeLabel,
  getLeavingCareRatingLabel,
} from "./leaving-care-intelligence-engine";

export type {
  LeavingCareCategory,
  LeavingCareOutcome,
  LeavingCareRecord,
  LeavingCarePolicy as LeavingCarePolicyInput,
  StaffLeavingCareTraining,
  LeavingCareQualityResult,
  LeavingCareComplianceResult,
  LeavingCarePolicyResult,
  StaffLeavingCareReadinessResult,
  ChildLeavingCareProfile,
  LeavingCareIntelligence,
  GenerateLeavingCareIntelligenceInput,
} from "./leaving-care-intelligence-engine";
