// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Placement Stability Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluatePlacementDuration,
  evaluateDisruptionManagement,
  evaluateMatchingQuality,
  evaluateOutcomesDuringPlacement,
  generatePlacementStabilityIntelligence,
  getPlacementStatusLabel,
  getEndingReasonLabel,
  getDisruptionFactorLabel,
  getSupportTypeLabel,
  getOutcomeAreaLabel,
  getProgressRatingLabel,
  getMatchingFactorLabel,
} from "./placement-stability-engine";

export type {
  PlacementStatus,
  EndingReason,
  DisruptionFactor,
  SupportType,
  OutcomeArea,
  MatchingFactor,
  ProgressRating,
  Placement,
  DisruptionEvent,
  StabilitySupport,
  MatchingRecord,
  MatchingFactorScore,
  PlacementOutcome,
  OutcomeAssessment,
  PlacementDurationResult,
  DisruptionManagementResult,
  MatchingQualityResult,
  OutcomesDuringPlacementResult,
  ChildStabilityProfile,
  PlacementStabilityIntelligence,
} from "./placement-stability-engine";
