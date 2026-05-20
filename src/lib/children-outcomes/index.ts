export {
  generateChildrenOutcomesIntelligence,
  evaluateChildrenOutcomesQuality,
  evaluateChildrenOutcomesCompliance,
  evaluateChildrenOutcomesPolicy,
  evaluateStaffChildrenOutcomesReadiness,
  buildChildOutcomesProfiles,
  pct,
  getRating,
  getChildrenOutcomesCategoryLabel,
  getChildrenOutcomesOutcomeLabel,
  getRatingLabel,
} from "./children-outcomes-intelligence-engine";

export type {
  ChildrenOutcomesCategory,
  ChildrenOutcomesOutcome,
  Rating,
  ChildrenOutcomesRecord,
  ChildrenOutcomesPolicy,
  StaffChildrenOutcomesTraining,
  ChildrenOutcomesQualityResult,
  ChildrenOutcomesComplianceResult,
  ChildrenOutcomesPolicyResult,
  StaffChildrenOutcomesReadinessResult,
  ChildOutcomesProfile,
  ChildrenOutcomesIntelligence,
  GenerateChildrenOutcomesIntelligenceInput,
} from "./children-outcomes-intelligence-engine";

// Legacy re-exports from progress-engine
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
