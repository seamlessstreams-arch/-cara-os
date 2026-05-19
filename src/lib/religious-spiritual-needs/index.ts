// ==============================================================================
// Cornerstone Religious & Spiritual Needs Intelligence — Public API
// ==============================================================================

export {
  evaluateAssessmentQuality,
  evaluateSupportDelivery,
  evaluateReligiousPolicy,
  evaluateStaffReligiousReadiness,
  buildChildReligiousProfiles,
  generateReligiousSpiritualNeedsIntelligence,
  getRating,
  getFaithBackgroundLabel,
  getSupportTypeLabel,
  getFrequencyLabel,
  getRatingLabel,
} from "./religious-spiritual-needs-engine";

export type {
  FaithBackground,
  SupportType,
  Frequency,
  Rating,
  ReligiousSpiritualAssessment,
  ReligiousSupportRecord,
  ReligiousPolicy,
  StaffReligiousTraining,
  AssessmentQualityResult,
  SupportDeliveryResult,
  ReligiousPolicyResult,
  StaffReligiousReadinessResult,
  ChildReligiousProfile,
  ReligiousSpiritualNeedsIntelligence,
} from "./religious-spiritual-needs-engine";
