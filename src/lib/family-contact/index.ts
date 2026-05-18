// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Family Contact & Communication Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateFamilyContactIntelligence,
  evaluateContactCompliance,
  evaluateContactQuality,
  evaluateContactImpact,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getFamilyMemberLabel,
  getImpactIndicatorLabel,
} from "./family-contact-engine";

export type {
  ContactType,
  ContactOutcome,
  ContactFrequency,
  FamilyMember,
  ImpactIndicator,
  ContactArrangement,
  ContactSession,
  ContactReview,
  ContactComplianceResult,
  ContactQualityResult,
  ContactImpactResult,
  FamilyContactIntelligenceResult,
} from "./family-contact-engine";
