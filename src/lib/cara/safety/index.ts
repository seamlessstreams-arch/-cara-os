// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Safety & Data Protection Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  classifyInputSensitivity,
  redactSensitiveData,
  createRedactionMap,
  validateProviderAllowedForSensitivity,
  blockUnsafeRouting,
  requireHumanApproval,
  detectNames,
  detectDOBs,
  detectAddresses,
  detectPlacementNames,
  detectLocalAuthorityNames,
  detectSchoolNames,
  detectNHSInfo,
  detectChildIdentifiers,
  detectStaffIdentifiers,
  detectSafeguardingLanguage,
  detectLegalLanguage,
  detectHealthInformation,
  detectSelfHarmLanguage,
  detectExploitationIndicators,
  detectMissingFromCare,
  detectRestraintReferences,
} from "./data-protection";

export type { RedactionResult } from "./data-protection";
