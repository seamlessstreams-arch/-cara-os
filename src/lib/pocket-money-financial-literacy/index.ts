// ==============================================================================
// Cornerstone Pocket Money & Financial Literacy Intelligence -- Public API
// ==============================================================================

export {
  evaluatePocketMoneyManagement,
  evaluateSavingsEngagement,
  evaluateFinancialEducation,
  evaluateStaffFinancialReadiness,
  buildChildFinancialSummaries,
  generatePocketMoneyFinancialLiteracyIntelligence,
  pct,
  getRating,
  getPaymentFrequencyLabel,
  getSpendingCategoryLabel,
  getEducationTopicLabel,
  getSessionEngagementLabel,
  getRatingLabel,
} from "./pocket-money-financial-literacy-engine";

export type {
  PaymentFrequency,
  SpendingCategory,
  EducationTopic,
  SessionEngagement,
  Rating,
  PocketMoneyRecord,
  SavingsAccount,
  FinancialEducationSession,
  StaffFinancialTraining,
  PocketMoneyManagementResult,
  SavingsEngagementResult,
  FinancialEducationResult,
  StaffFinancialReadinessResult,
  ChildFinancialSummary,
  PocketMoneyFinancialLiteracyIntelligence,
} from "./pocket-money-financial-literacy-engine";
