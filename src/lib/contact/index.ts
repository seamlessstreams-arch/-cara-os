// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Contact Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  pct,
  getRating,
  getCategoryLabel,
  getOutcomeLabel,
  getRatingLabel,
  evaluateContactQuality,
  evaluateContactCompliance,
  evaluateContactPolicy,
  evaluateStaffContactReadiness,
  buildChildContactProfiles,
  generateContactIntelligence,
} from "./contact-engine";

export type {
  ContactCategory,
  ContactOutcome,
  Rating,
  ContactRecord,
  ContactPolicy,
  StaffContactTraining,
  ContactQualityResult,
  ContactComplianceResult,
  ContactPolicyResult,
  StaffContactReadinessResult,
  ChildContactProfile,
  ContactIntelligence,
} from "./contact-engine";
