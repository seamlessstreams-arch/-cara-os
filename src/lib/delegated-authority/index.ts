// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Delegated Authority & Consent — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateDelegatedAuthorityCompliance,
  calculateHomeDelegatedAuthorityMetrics,
  getDecisionCategoryLabel,
  getAuthorityLevelLabel,
} from "./delegated-authority-engine";

export type {
  DecisionCategory,
  AuthorityLevel,
  ConsentStatus,
  DelegatedAuthorityEntry,
  ConsentRecord,
  ChildDelegatedAuthorityProfile,
  EmergencyDecision,
  DelegatedAuthorityComplianceResult,
  HomeDelegatedAuthorityMetrics,
} from "./delegated-authority-engine";
