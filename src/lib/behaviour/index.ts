// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Behaviour & Positive Relationships — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  analyseChildBehaviour,
  calculateHomeBehaviourMetrics,
  getSeverityLabel,
  getBehaviourTypeLabel,
  getInterventionLabel,
} from "./behaviour-engine";

export type {
  BehaviourSeverity,
  BehaviourType,
  InterventionType,
  RestraintType,
  PositiveEventType,
  BehaviourIncident,
  PositiveEvent,
  BehaviourSupportPlan,
  ChildBehaviourAnalysis,
  HomeBehaviourMetrics,
} from "./behaviour-engine";
