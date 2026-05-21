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

// ── Intelligence Engine ────────────────────────────────────────────────────

export {
  generateBehaviourIntelligenceReport,
  evaluateBehaviourIntelligenceQuality,
  evaluateBehaviourIntelligenceCompliance,
  evaluateBehaviourIntelligencePolicy,
  evaluateStaffBehaviourIntelligenceReadiness,
  buildChildBehaviourIntelligenceProfiles,
  pct as behaviourIntelligencePct,
  getRating as getBehaviourIntelligenceRating,
  getBehaviourIntelligenceCategoryLabel,
  getBehaviourIntelligenceOutcomeLabel,
  getBehaviourIntelligenceRatingLabel,
} from "./behaviour-intelligence-engine";

export type {
  BehaviourIntelligenceCategory,
  BehaviourIntelligenceOutcome,
  BehaviourIntelligenceRating,
  BehaviourIntelligenceRecord,
  BehaviourIntelligencePolicy as BehaviourIntelligencePolicyInput,
  StaffBehaviourIntelligenceTraining,
  BehaviourIntelligenceQualityResult,
  BehaviourIntelligenceComplianceResult,
  BehaviourIntelligencePolicyResult,
  StaffBehaviourIntelligenceReadinessResult,
  ChildBehaviourIntelligenceProfile,
  BehaviourIntelligenceResult,
  GenerateBehaviourIntelligenceInput,
} from "./behaviour-intelligence-engine";
