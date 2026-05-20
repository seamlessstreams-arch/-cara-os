// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Pocket Money — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generatePocketMoneyIntelligence,
  evaluatePocketMoneyQuality,
  evaluatePocketMoneyCompliance,
  evaluatePocketMoneyPolicy,
  evaluateStaffPocketMoneyReadiness,
  buildChildPocketMoneyProfiles,
  pct,
  getRating,
  getPocketMoneyCategoryLabel,
  getPocketMoneyOutcomeLabel,
  getRatingLabel,
} from "./pocket-money-intelligence-engine";

export type {
  PocketMoneyCategory,
  PocketMoneyOutcome,
  Rating,
  PocketMoneyRecord,
  PocketMoneyPolicy,
  StaffPocketMoneyTraining,
  PocketMoneyQualityResult,
  PocketMoneyComplianceResult,
  PocketMoneyPolicyResult,
  StaffPocketMoneyReadinessResult,
  ChildPocketMoneyProfile,
  PocketMoneyIntelligence,
  GeneratePocketMoneyIntelligenceInput,
} from "./pocket-money-intelligence-engine";

// Legacy re-exports from pocket-money-engine
export {
  evaluateChildFinancialCompliance,
  calculateHomeFinancialMetrics,
  getTransactionTypeLabel,
  getLiteracyTopicLabel,
} from "./pocket-money-engine";

export type {
  TransactionType,
  PaymentMethod,
  FinancialLiteracyTopic,
  ChildFinancialProfile,
  FinancialTransaction,
  LiteracySession,
  ChildFinancialResult,
  HomeFinancialMetrics,
} from "./pocket-money-engine";
