// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Placement Stability — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluatePlacementStability,
  calculateHomeStabilityMetrics,
  getMatchingRecommendations,
  getPlacementStatusLabel,
  getEndReasonLabel,
  getMatchingDomainLabel,
} from "./stability-engine";

export type {
  PlacementStatus,
  EndReason,
  MatchingDomain,
  RiskIndicator,
  Placement,
  MatchingAssessmentItem,
  StabilityMilestone,
  DisruptionEvent,
  PlacementStabilityResult,
  HomeStabilityMetrics,
  MatchingRecommendation,
} from "./stability-engine";
