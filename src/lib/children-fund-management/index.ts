// ==============================================================================
// Cara Children's Fund Management Intelligence -- Public API
// ==============================================================================

export {
  evaluateAccountManagement,
  evaluateTransactionIntegrity,
  evaluateFinancialLiteracy,
  evaluateAuditCompliance,
  buildChildFinancialProfiles,
  generateChildrenFundManagementIntelligence,
  getRating,
  getTransactionTypeLabel,
  getAccountStatusLabel,
  getReconciliationFrequencyLabel,
  getFinancialLiteracyTopicLabel,
  getChildConsentLabel,
  getRatingLabel,
} from "./children-fund-management-engine";

export type {
  TransactionType,
  AccountStatus,
  ReconciliationFrequency,
  FinancialLiteracyTopic,
  ChildConsent,
  Rating,
  ChildAccount,
  FinancialTransaction,
  FinancialLiteracySession,
  FinancialAudit,
  AccountManagementResult,
  TransactionIntegrityResult,
  FinancialLiteracyResult,
  AuditComplianceResult,
  ChildFinancialProfile,
  ChildrenFundManagementIntelligence,
} from "./children-fund-management-engine";
