// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Children's Outcomes — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateChildProgress,
  analyzeCohort,
  analyzeDomainTrends,
  getDomainLabel,
  getAllDomains,
  ratingToLabel,
} from "./progress-engine";

export type {
  OutcomeDomain,
  ProgressRating,
  Trend,
  ReviewFrequency,
  ChildProfile,
  OutcomeAssessment,
  ChildGoal,
  ProgressReview,
  ChildProgressResult,
  DomainSummary,
  CohortAnalysis,
  DomainTrendAnalysis,
} from "./progress-engine";
