// ══════════════════════════════════════════════════════════════════════════════
// HR INTELLIGENCE — TYPED MODELS
//
// Mirrors the schema in supabase/migrations/012_hr_intelligence_schema.sql.
// Kept deliberately close to the SQL to make audit / migration review easy.
// ══════════════════════════════════════════════════════════════════════════════

export type HrCaseType =
  | "disciplinary"
  | "grievance"
  | "capability"
  | "sickness_absence"
  | "probation"
  | "conduct"
  | "gross_misconduct"
  | "bullying_harassment"
  | "whistleblowing"
  | "suspension"
  | "safeguarding_allegation"
  | "professional_boundaries"
  | "medication_error"
  | "poor_recording"
  | "staff_conflict"
  | "union_involvement"
  | "appeal"
  | "informal_concern"
  | "restorative";

export type HrRiskLevel = "green" | "amber" | "red" | "black";

export type HrCaseStatus =
  | "open"
  | "investigation"
  | "suspended"
  | "meeting_scheduled"
  | "outcome_pending"
  | "awaiting_appeal"
  | "closed"
  | "withdrawn";

export type HrSafeguardingStatus =
  | "not_safeguarding"
  | "possible_safeguarding"
  | "safeguarding_open"
  | "lado_consulted"
  | "lado_substantiated"
  | "lado_unsubstantiated"
  | "lado_unfounded"
  | "lado_malicious";

export type HrChildImpactStatus =
  | "no_impact"
  | "possible_impact"
  | "direct_impact"
  | "unknown";

export interface HrCase {
  id: string;
  staffId: string;
  homeId?: string;
  caseType: HrCaseType;
  caseOwner?: string;
  concernSummary: string;
  riskLevel: HrRiskLevel;
  safeguardingStatus: HrSafeguardingStatus;
  childImpactStatus: HrChildImpactStatus;
  status: HrCaseStatus;
  openedAt: string;
  closedAt?: string;
  closureSummary?: string;
  learningActions: string[];
  policyLinks: string[];
  regulationLinks: string[];
  rationaleForClosure?: string;
  riOversightRequired: boolean;
  riOversightCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type HrCaseActionType =
  | "note"
  | "meeting"
  | "letter_drafted"
  | "letter_sent"
  | "evidence_added"
  | "witness_statement"
  | "investigation_step"
  | "suspension_decision"
  | "lado_referral"
  | "ofsted_notification"
  | "la_notification"
  | "union_communication"
  | "outcome_decision"
  | "appeal_lodged"
  | "appeal_outcome"
  | "risk_assessment_update"
  | "restriction_imposed"
  | "restriction_lifted";

export interface HrCaseAction {
  id: string;
  caseId: string;
  actionType: HrCaseActionType;
  title: string;
  detail?: string;
  performedBy: string;
  performedAt: string;
  attachments: unknown[];
}

export type HrChronologyEntryType =
  | "concern_raised"
  | "immediate_action"
  | "child_safeguarded"
  | "manager_informed"
  | "ri_informed"
  | "lado_considered"
  | "lado_referred"
  | "staff_informed"
  | "evidence_gathered"
  | "meeting_held"
  | "letter_issued"
  | "decision_made"
  | "appeal_received"
  | "appeal_outcome"
  | "learning_action"
  | "closure";

export interface HrChronologyEntry {
  id: string;
  caseId: string;
  occurredAt: string;
  entryType: HrChronologyEntryType;
  summary: string;
  significance: "routine" | "significant" | "critical";
  recordedBy: string;
  sourceActionId?: string;
  createdAt: string;
}

export type HrLetterType =
  | "investigation_invite"
  | "witness_invite"
  | "disciplinary_invite"
  | "grievance_invite"
  | "suspension"
  | "suspension_review"
  | "no_further_action"
  | "informal_concern"
  | "written_warning"
  | "final_written_warning"
  | "dismissal"
  | "appeal_invite"
  | "appeal_outcome"
  | "probation_review"
  | "probation_extension"
  | "probation_confirmation"
  | "failed_probation"
  | "sickness_meeting"
  | "welfare_meeting"
  | "occupational_health_referral"
  | "return_to_work_outcome"
  | "capability_meeting"
  | "performance_improvement_plan"
  | "mediation_invite"
  | "whistleblowing_acknowledgement"
  | "safeguarding_allegation_holding";

export type HrLetterStatus =
  | "aria_draft"
  | "manager_review"
  | "approved"
  | "sent"
  | "withdrawn";

export interface HrLetter {
  id: string;
  caseId?: string;
  staffId: string;
  letterType: HrLetterType;
  status: HrLetterStatus;
  draftBody: string;
  approvedBody?: string;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  guardianReviewId?: string;
  createdAt: string;
  updatedAt: string;
}

export type HrAuditEventType =
  | "created"
  | "viewed"
  | "edited"
  | "exported"
  | "deleted"
  | "approved"
  | "rejected"
  | "sent"
  | "signed_off"
  | "escalated"
  | "restricted_access"
  | "rights_assertion";

export interface HrAuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  actorUserId: string;
  actorRole?: string;
  eventType: HrAuditEventType;
  eventDetail: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface HrTask {
  id: string;
  caseId?: string;
  staffId?: string;
  taskType:
    | "probation_review"
    | "supervision"
    | "appraisal"
    | "dbs_renewal"
    | "training_renewal"
    | "investigation_deadline"
    | "suspension_review"
    | "sickness_review"
    | "lado_follow_up"
    | "appeal_deadline"
    | "letter_approval"
    | "evidence_upload"
    | "ri_review"
    | "other";
  title: string;
  detail?: string;
  dueDate?: string;
  assignedTo?: string;
  status: "open" | "in_progress" | "complete" | "cancelled";
  completedAt?: string;
  completedBy?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
