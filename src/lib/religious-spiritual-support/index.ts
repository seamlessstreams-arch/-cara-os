// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Religious & Spiritual Support Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateNeedsAssessment,
  evaluateSupportProvision,
  evaluateFestivalInclusion,
  evaluateStaffCompetence,
  buildChildFaithProfiles,
  generateReligiousSpiritualSupportIntelligence,
  getRating,
  getFaithBackgroundLabel,
  getSupportTypeLabel,
  getSupportQualityLabel,
  getChildPreferenceLabel,
  getRatingLabel,
} from "./religious-spiritual-support-engine";

export type {
  FaithBackground,
  SupportType,
  SupportQuality,
  ChildPreference,
  Rating,
  ChildFaithProfile,
  ReligiousSupportActivity,
  FestivalObservance,
  StaffDiversityTraining,
  NeedsAssessmentResult,
  SupportProvisionResult,
  FestivalInclusionResult,
  StaffCompetenceResult,
  ChildFaithProfileResult,
  ReligiousSpiritualSupportIntelligence,
} from "./religious-spiritual-support-engine";
