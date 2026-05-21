// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Placement Stability Intelligence — Public API
// ══════════════════════════════════════════════════════════════════════════════

// ── Legacy Placement Stability Engine ─────────────────────────────────────

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

// ── New Intelligence Engine ───────────────────────────────────────────────

export {
  pct,
  getRating,
  getPlacementStabilityIntelligenceCategoryLabel,
  getPlacementStabilityIntelligenceOutcomeLabel,
  getRatingLabel,
  evaluatePlacementStabilityQuality,
  evaluatePlacementStabilityCompliance,
  evaluatePlacementStabilityPolicyEval,
  evaluateStaffPlacementStabilityReadiness,
  buildChildPlacementStabilityProfiles,
  generatePlacementStabilityIntelligenceReport,
} from "./placement-stability-intelligence-engine";

export type {
  PlacementStabilityIntelligenceCategory,
  PlacementStabilityIntelligenceOutcome,
  Rating as PlacementStabilityRating,
  PlacementStabilityRecord,
  PlacementStabilityPolicy,
  StaffPlacementStabilityTraining,
  PlacementStabilityQualityResult,
  PlacementStabilityComplianceResult,
  PlacementStabilityPolicyResult,
  StaffPlacementStabilityReadinessResult,
  ChildPlacementStabilityProfile,
  PlacementStabilityIntelligence as PlacementStabilityIntelligenceResult,
  GeneratePlacementStabilityIntelligenceInput,
} from "./placement-stability-intelligence-engine";
