// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Missing From Care — Public API
// ══════════════════════════════════════════════════════════════════════════════

// ── Legacy episode engine (unchanged) ──
export {
  evaluateEpisodeCompliance,
  analyzePattern,
  calculateHomeMetrics,
  getRiskGradingLabel,
  getEpisodeStatusLabel,
} from "./episode-engine";

export type {
  EpisodeStatus,
  RiskGrading,
  ReturnInterviewStatus,
  PushFactor,
  PullFactor,
  MissingEpisode,
  ReturnInterview,
  EpisodeComplianceResult,
  PatternAnalysis,
  HomeMetrics,
} from "./episode-engine";

// ── New 4-evaluator intelligence engine ──
export {
  evaluateQuality,
  evaluateCompliance,
  evaluatePolicy,
  evaluateStaffReadiness,
  buildChildProfiles,
  generateMissingFromCareIntelligence,
  getRating,
  getRatingLabel,
  getMissingFromCareCategoryLabel,
  getMissingFromCareOutcomeLabel,
  pct,
} from "./missing-from-care-engine";

export type {
  MissingFromCareCategory,
  MissingFromCareOutcome,
  Rating,
  MissingFromCareRecord,
  MissingFromCarePolicy,
  StaffMissingFromCareTraining,
  QualityResult,
  ComplianceResult,
  PolicyResult,
  StaffReadinessResult,
  ChildProfile,
  MissingFromCareIntelligence,
} from "./missing-from-care-engine";

// ── Intelligence engine (new 4-evaluator pattern) ──
export {
  evaluateMissingFromCareIntelligenceQuality,
  evaluateMissingFromCareIntelligenceCompliance,
  evaluateMissingFromCareIntelligencePolicy,
  evaluateStaffMissingFromCareIntelligenceReadiness,
  buildChildMissingFromCareIntelligenceProfiles,
  generateMissingFromCareIntelligenceResult,
  getRatingIntel,
  getMissingFromCareIntelligenceRatingLabel,
  getMissingFromCareIntelligenceCategoryLabel,
  getMissingFromCareIntelligenceOutcomeLabel,
  pctIntel,
} from "./missing-from-care-intelligence-engine";

export type {
  MissingFromCareIntelligenceCategory,
  MissingFromCareIntelligenceOutcome,
  MissingFromCareIntelligenceRating,
  MissingFromCareIntelligenceRecord,
  MissingFromCareIntelligencePolicy,
  StaffMissingFromCareIntelligenceTraining,
  MissingFromCareIntelligenceQualityResult,
  MissingFromCareIntelligenceComplianceResult,
  MissingFromCareIntelligencePolicyResult,
  StaffMissingFromCareIntelligenceReadinessResult,
  ChildMissingFromCareIntelligenceProfile,
  MissingFromCareIntelligenceResult,
  GenerateMissingFromCareIntelligenceInput,
} from "./missing-from-care-intelligence-engine";
