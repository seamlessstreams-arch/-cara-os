// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Delegated Authority Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  pct,
  getRating,
  getAuthorityCategoryLabel,
  getDecisionOutcomeLabel,
  getRatingLabel,
  evaluateAuthorityQuality,
  evaluateAuthorityCompliance,
  evaluateAuthorityPolicy,
  evaluateStaffAuthorityReadiness,
  buildChildAuthorityProfiles,
  generateDelegatedAuthorityIntelligence,
} from "./delegated-authority-engine";

export type {
  AuthorityCategory,
  DecisionOutcome,
  Rating,
  AuthorityDecision,
  AuthorityPolicy,
  StaffAuthorityTraining,
  AuthorityQualityResult,
  AuthorityComplianceResult,
  AuthorityPolicyResult,
  StaffAuthorityReadinessResult,
  ChildAuthorityProfile,
  DelegatedAuthorityIntelligence,
} from "./delegated-authority-engine";
