// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Pocket Money & Savings — Public API
// ══════════════════════════════════════════════════════════════════════════════

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
