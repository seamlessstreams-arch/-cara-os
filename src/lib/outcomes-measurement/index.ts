// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Outcomes Measurement — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  evaluateProgressFromBaseline,
  evaluateTargetAchievement,
  evaluateOutcomePlanning,
  evaluateMeasurementQuality,
  buildChildOutcomeProfiles,
  generateOutcomesMeasurementIntelligence,
  getDomainLabel,
  getAllDomains,
} from "./outcomes-measurement-engine";

export type {
  OutcomeDomain,
  MeasurementMethod,
  ProgressStatus,
  OutcomeBaseline,
  OutcomeMeasurement,
  OutcomeTarget,
  ChildOutcomePlan,
  DomainProgress,
  ProgressFromBaselineResult,
  TargetAchievementResult,
  OutcomePlanningResult,
  MeasurementQualityResult,
  ChildOutcomeProfile,
  OutcomesMeasurementResult,
} from "./outcomes-measurement-engine";
