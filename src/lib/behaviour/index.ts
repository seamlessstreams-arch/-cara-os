export {
  generateBehaviourIntelligence,
  evaluateBehaviourQuality,
  evaluateBehaviourCompliance,
  evaluateBehaviourPolicy,
  evaluateStaffBehaviourReadiness,
  buildChildBehaviourProfiles,
  pct,
  getRating,
  getBehaviourCategoryLabel,
  getBehaviourOutcomeLabel,
  getRatingLabel,
} from "./behaviour-engine";

export type {
  BehaviourCategory,
  BehaviourOutcome,
  Rating,
  BehaviourRecord,
  BehaviourPolicy,
  StaffBehaviourTraining,
  BehaviourQualityResult,
  BehaviourComplianceResult,
  BehaviourPolicyResult,
  StaffBehaviourReadinessResult,
  ChildBehaviourProfile,
  BehaviourIntelligence,
} from "./behaviour-engine";
