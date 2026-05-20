// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Multi-Agency Working — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateMultiAgencyIntelligence,
  evaluateMultiAgencyQuality,
  evaluateMultiAgencyCompliance as evaluateMultiAgencyComplianceIntel,
  evaluateMultiAgencyPolicy,
  evaluateStaffMultiAgencyReadiness,
  buildChildMultiAgencyProfiles,
  pct,
  getRating,
  getMultiAgencyCategoryLabel,
  getMultiAgencyOutcomeLabel,
  getRatingLabel,
} from "./multi-agency-intelligence-engine";

export type {
  MultiAgencyCategory,
  MultiAgencyOutcome,
  Rating,
  MultiAgencyRecord,
  MultiAgencyPolicy,
  StaffMultiAgencyTraining,
  MultiAgencyQualityResult,
  MultiAgencyComplianceResult,
  MultiAgencyPolicyResult,
  StaffMultiAgencyReadinessResult,
  ChildMultiAgencyProfile,
  MultiAgencyIntelligence,
  GenerateMultiAgencyIntelligenceInput,
} from "./multi-agency-intelligence-engine";

// Legacy re-exports from multi-agency-engine
export {
  evaluateMultiAgencyCompliance,
  calculateHomeMultiAgencyMetrics,
  getAgencyTypeLabel,
  getMeetingTypeLabel,
} from "./multi-agency-engine";

export type {
  AgencyType,
  CommunicationStatus,
  MeetingType,
  ReferralStatus,
  ProfessionalContact,
  MultiAgencyMeeting,
  Referral,
  ChildMultiAgencyProfile as ChildMultiAgencyProfileLegacy,
  MultiAgencyComplianceResult as MultiAgencyComplianceResultLegacy,
  HomeMultiAgencyMetrics,
} from "./multi-agency-engine";
