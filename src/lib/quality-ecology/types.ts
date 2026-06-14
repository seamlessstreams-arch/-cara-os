// ══════════════════════════════════════════════════════════════════════════════
// Cara Quality Ecology Engine — Core Types
//
// The Quality Ecology manages the lifecycle of every form, task, check and
// review in the home. Items move through a deterministic lifecycle:
//
//   Scheduled → Assigned → In Progress → Submitted → Checked →
//   [Returned for Improvement → Resubmitted →] Approved → Locked → Filed
//
// This is not just a task system — it's a live quality assurance engine.
// ══════════════════════════════════════════════════════════════════════════════

import type { ApprovalLevel, Role, Sensitivity } from "../permissions/types";

// ── Lifecycle Status ────────────────────────────────────────────────────────

export type LifecycleStatus =
  | "scheduled"
  | "assigned"
  | "in_progress"
  | "submitted"
  | "checked"
  | "returned_for_improvement"
  | "resubmitted"
  | "approved"
  | "locked"
  | "filed"
  | "overdue"
  | "missed"
  | "escalated"
  | "cancelled";

// ── Schedule Frequency ──────────────────────────────────────────────────────

export type ScheduleFrequency =
  | "daily"
  | "every_shift"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annually"
  | "specific_weekdays"
  | "specific_dates"
  | "first_of_month"
  | "last_of_month"
  | "one_off";

// ── Event Triggers ──────────────────────────────────────────────────────────

export type EventTrigger =
  | "child_admission"
  | "staff_start_date"
  | "incident"
  | "missing_from_care"
  | "physical_intervention"
  | "complaint"
  | "medication_error"
  | "safeguarding_concern"
  | "placement_plan_review"
  | "risk_assessment_review"
  | "exclusion"
  | "restraint"
  | "allegation"
  | "notification_to_ofsted";

// ── Escalation Severity ─────────────────────────────────────────────────────

export type EscalationSeverity = "amber" | "red" | "critical";

// ── Form/Task Template ──────────────────────────────────────────────────────

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: number;

  // Schedule
  scheduleFrequency: ScheduleFrequency;
  scheduleDays?: number[];          // 0=Sun, 1=Mon ... for specific_weekdays
  scheduleDates?: number[];         // 1-31 for specific_dates
  scheduleTime?: string;            // "09:00" HH:mm
  eventTriggers?: EventTrigger[];

  // Roles
  completionRoles: Role[];          // who can complete
  checkRole?: Role;                 // who checks (Level 1)
  approvalRole?: Role;              // who approves
  approvalLevel: ApprovalLevel;

  // Timing
  dueTimeMinutes?: number;          // minutes after trigger/schedule
  gracePeriodMinutes: number;
  reminderMinutesBefore: number;

  // Escalation
  firstEscalationMinutes: number;   // after due
  firstEscalationTo: Role;
  secondEscalationMinutes?: number;
  secondEscalationTo?: Role;
  criticalEscalationAfterMissed?: number; // after N misses

  // Quality
  requiresEvidence: boolean;
  requiresChildVoice: boolean;
  requiresManagerReview: boolean;
  qaRequired: boolean;
  qaSamplePercentage?: number;      // 0-100
  caraReviewRequired: boolean;

  // Filing
  filingLocation: string;           // e.g. "Home Compliance > Fire Safety > Daily Checks"
  evidenceTags: string[];
  regulationLinks: string[];
  qualityStandardLinks: string[];
  feedsAnnexA: boolean;
  feedsReg44: boolean;
  feedsReg45: boolean;
  ofstedCategory?: string;

  // Configuration
  sensitivity: Sensitivity;
  selfApprovalAllowed: boolean;
  locksAfterApproval: boolean;
  retentionCategory: string;

  // Status
  active: boolean;
  homeIds: string[];                // which homes this applies to
  childSpecific: boolean;           // one per child vs one for the home
}

// ── Scheduled Occurrence ────────────────────────────────────────────────────

export interface ScheduledOccurrence {
  id: string;
  templateId: string;
  templateName: string;

  // Assignment
  assignedTo?: string;              // userId
  assignedAt?: string;
  homeId: string;
  childId?: string;                 // if child-specific

  // Timing
  dueDate: string;                  // ISO date
  dueTime?: string;                 // HH:mm
  graceExpiresAt?: string;          // ISO datetime
  scheduledAt: string;              // when this occurrence was created

  // Status
  status: LifecycleStatus;
  statusHistory: StatusTransition[];

  // Completion
  completedBy?: string;
  completedAt?: string;
  submittedAt?: string;

  // Checking
  checkedBy?: string;
  checkedAt?: string;
  checkOutcome?: "passed" | "returned";
  checkNotes?: string;

  // Return
  returnedAt?: string;
  returnReason?: string;
  returnedBy?: string;
  resubmittedAt?: string;
  resubmissionCount: number;

  // Approval
  approvedBy?: string;
  approvedAt?: string;
  approvalLevel: ApprovalLevel;

  // QA
  qaRequired: boolean;
  qaSampledBy?: string;
  qaSampledAt?: string;
  qaScore?: number;
  qaFindings?: string;

  // Filing
  lockedAt?: string;
  filedAt?: string;
  filingLocation?: string;
  evidenceTags: string[];

  // Escalation
  escalationLevel: number;          // 0 = none, 1 = first, 2 = second, 3 = critical
  escalatedAt?: string;
  escalatedTo?: string;
  escalationReason?: string;

  // Cara
  caraReviewed: boolean;
  caraQualityScore?: number;
  caraSuggestions?: string[];
}

// ── Status Transition ───────────────────────────────────────────────────────

export interface StatusTransition {
  from: LifecycleStatus;
  to: LifecycleStatus;
  at: string;                       // ISO datetime
  by?: string;                      // userId
  reason?: string;
}

// ── Escalation Event ────────────────────────────────────────────────────────

export interface EscalationEvent {
  id: string;
  occurrenceId: string;
  templateId: string;
  level: number;
  severity: EscalationSeverity;
  reason: string;
  escalatedTo: string;              // role or userId
  escalatedAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
}

// ── QA Sample ───────────────────────────────────────────────────────────────

export interface QASample {
  id: string;
  occurrenceId: string;
  templateId: string;
  sampledBy: string;
  sampleDate: string;
  qualityScore: number;             // 1-5
  findings: string;
  actionsRequired: string[];
  learningIdentified: string[];
  followUpDue?: string;
  filedLocation: string;
}

// ── Lifecycle Transition Rules ──────────────────────────────────────────────

export interface TransitionRule {
  from: LifecycleStatus;
  to: LifecycleStatus;
  allowedRoles: Role[];
  requiresReason?: boolean;
  validatesFields?: string[];
}
