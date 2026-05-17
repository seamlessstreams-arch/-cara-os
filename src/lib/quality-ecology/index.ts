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

export {
  checkLockStatus,
  createAmendment,
  approveAmendment,
  rejectAmendment,
  validateRecordIntegrity,
  getAmendmentTimeline,
  canModifyRecord,
  AMENDMENT_TYPE_LABELS,
} from "./record-locking";

export type {
  LockedRecord,
  Amendment,
  AmendmentRequest,
  AmendmentType,
  AmendmentStatus,
  LockCheckResult,
  AmendmentResult,
  AmendmentApprovalResult,
  IntegrityCheckResult,
  AmendmentTimelineEntry,
} from "./record-locking";

export {
  buildAuditEvent,
  filterAuditEvents,
  summarizeAuditEvents,
  getEscalationEvents,
  getAccessDenials,
  getBreakGlassEvents,
  getAmendmentEvents,
  AUDIT_EVENT_LABELS,
} from "./audit-trail";

export type {
  AuditEvent,
  AuditEventType,
  AuditSeverity,
  AuditEventDetails,
  AuditEventInput,
  AuditFilter,
  AuditSummary,
} from "./audit-trail";

export {
  selectSamples,
  submitQAReview,
  calculateQAMetrics,
} from "./qa-sampling";

export type {
  QASampleSelection,
  SampleReason,
  QAReviewInput,
  QAReviewResult,
  QAReview,
  QualityBand,
  QAOutcome,
  StaffQAProfile,
  QAMetrics,
} from "./qa-sampling";
