export {
  evaluateBehaviourSupportPlans,
  evaluateDeEscalation,
  evaluateRewardSanctionBalance,
  evaluateIncidentPatterns,
  buildChildBehaviourProfiles,
  generatePositiveBehaviourIntelligence,
} from "./positive-behaviour-engine";

export type {
  BehaviourSupportPlanStatus,
  StrategyType,
  DeEscalationOutcome,
  RecognitionType,
  SanctionType,
  BehaviourSupportPlan,
  DeEscalationRecord,
  RecognitionRecord,
  SanctionRecord,
  BehaviourIncident,
  BSPEvaluationResult,
  DeEscalationResult,
  RewardSanctionResult,
  IncidentPatternResult,
  ChildBehaviourProfile,
  PositiveBehaviourResult,
} from "./positive-behaviour-engine";
