// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Quality Ecology Engine — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  attemptTransition,
  checkOverdue,
  generateNextOccurrences,
  getValidTransitions,
  calculateCompliance,
} from "./lifecycle-engine";

export type {
  TransitionResult,
  OverdueCheckResult,
  NextOccurrence,
  ComplianceSummary,
} from "./lifecycle-engine";

export type {
  LifecycleStatus,
  ScheduleFrequency,
  EventTrigger,
  EscalationSeverity,
  TaskTemplate,
  ScheduledOccurrence,
  StatusTransition,
  EscalationEvent,
  QASample,
  TransitionRule,
} from "./types";
