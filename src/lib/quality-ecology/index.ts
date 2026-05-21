// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Quality Ecology Engine — Public API
// ══════════════════════════════════════════════════════════════════════════════

export {
  generateQualityEcologyIntelligence,
  evaluateQualityEcologyQuality,
  evaluateQualityEcologyCompliance,
  evaluateQualityEcologyPolicy,
  evaluateStaffQualityEcologyReadiness,
  buildChildQualityEcologyProfiles,
  pct,
  getRating,
  getQualityEcologyCategoryLabel,
  getQualityEcologyOutcomeLabel,
  getRatingLabel,
} from "./quality-ecology-intelligence-engine";

export type {
  QualityEcologyCategory, QualityEcologyOutcome, Rating,
  QualityEcologyRecord, QualityEcologyPolicy, StaffQualityEcologyTraining,
  QualityEcologyQualityResult, QualityEcologyComplianceResult, QualityEcologyPolicyResult,
  StaffQualityEcologyReadinessResult, ChildQualityEcologyProfile,
  QualityEcologyIntelligence, GenerateQualityEcologyIntelligenceInput,
} from "./quality-ecology-intelligence-engine";

// Legacy re-exports from lifecycle-engine
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
