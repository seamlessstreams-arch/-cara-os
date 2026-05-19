// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Sexual Health & Relationships Education Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  pct,
  getRating,
  getTopicAreaLabel,
  getDeliveryMethodLabel,
  getAgeAppropriatenessLabel,
  getEngagementLevelLabel,
  getRatingLabel,
  getTopicAreaLabels,
  getDeliveryMethodLabels,
  getAgeAppropriatenessLabels,
  getEngagementLevelLabels,
  getRatingLabels,
  evaluateRSEDelivery,
  evaluateSexualHealthAccess,
  evaluateRSEPolicyQuality,
  evaluateStaffRSEReadiness,
  buildChildRSESummaries,
  generateSexualHealthRelationshipsEducationIntelligence,
} from "./sexual-health-relationships-education-engine";

export type {
  TopicArea,
  DeliveryMethod,
  AgeAppropriateness,
  EngagementLevel,
  Rating,
  RSESession,
  SexualHealthReferral,
  RSEPolicy,
  StaffRSETraining,
  ChildRSESummary,
  SexualHealthRelationshipsEducationIntelligence,
} from "./sexual-health-relationships-education-engine";
