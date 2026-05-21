// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Filing Cabinet — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateFilingCabinetIntelligence,
  evaluateFilingCabinetQuality,
  evaluateFilingCabinetCompliance,
  evaluateFilingCabinetPolicy,
  evaluateStaffFilingCabinetReadiness,
  buildChildFilingCabinetProfiles,
  pct,
  getRating,
  getFilingCabinetCategoryLabel,
  getFilingCabinetOutcomeLabel,
  getRatingLabel,
} from "./filing-cabinet-intelligence-engine";

export type {
  FilingCabinetCategory,
  FilingCabinetOutcome,
  Rating,
  FilingCabinetRecord,
  FilingCabinetPolicy,
  StaffFilingCabinetTraining,
  FilingCabinetQualityResult,
  FilingCabinetComplianceResult,
  FilingCabinetPolicyResult,
  StaffFilingCabinetReadinessResult,
  ChildFilingCabinetProfile,
  FilingCabinetIntelligence,
  GenerateFilingCabinetIntelligenceInput,
} from "./filing-cabinet-intelligence-engine";

// Legacy re-exports from retention-engine
export {
  getRetentionPolicy,
  calculateRetentionExpiry,
  checkRetentionStatus,
  approveDestruction,
  executeDestruction,
  placeHold,
  removeHold,
  canAccessDocument,
  calculateFilingStats,
  fileDocument,
  getCategoryLabel,
  getSensitivityLabel,
  getRetentionBasisLabel,
  getDocumentsApproachingExpiry,
  getExpiredDocuments,
  RETENTION_POLICIES,
} from "./retention-engine";

export type {
  FilingCategory,
  RetentionBasis,
  DocumentStatus,
  Sensitivity,
  FiledDocument,
  RetentionPolicy,
  RetentionCheckResult,
  DestructionRequest,
  DestructionResult,
  FilingStats,
  FileDocumentRequest,
} from "./retention-engine";
