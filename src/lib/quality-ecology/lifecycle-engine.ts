// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Quality Ecology — Lifecycle Engine
//
// Pure deterministic state machine for task/form lifecycle management.
// Determines valid transitions, checks permission for transitions,
// and produces the next state with full audit trail.
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  LifecycleStatus,
  ScheduledOccurrence,
  StatusTransition,
  EscalationEvent,
  EscalationSeverity,
  TaskTemplate,
} from "./types";
import type { UserContext, Role } from "../permissions/types";
import { isAtLeast, MAX_APPROVAL_LEVEL, SELF_APPROVAL_BLOCKED_ROLES } from "../permissions/role-rules";

// ── Valid Transitions ───────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<LifecycleStatus, LifecycleStatus[]> = {
  scheduled: ["assigned", "cancelled", "overdue"],
  assigned: ["in_progress", "cancelled", "overdue"],
  in_progress: ["submitted", "cancelled"],
  submitted: ["checked", "approved", "returned_for_improvement"], // checked or directly approved for Level 0
  checked: ["approved", "returned_for_improvement"],
  returned_for_improvement: ["in_progress", "resubmitted"],
  resubmitted: ["checked", "approved", "returned_for_improvement"],
  approved: ["locked"],
  locked: ["filed"],
  filed: [], // terminal
  overdue: ["assigned", "in_progress", "submitted", "escalated", "missed"],
  missed: ["escalated"], // can still be escalated
  escalated: ["assigned", "in_progress", "submitted"], // can be recovered
  cancelled: [], // terminal
};

// ── Minimum Role for Each Transition ────────────────────────────────────────

interface TransitionRequirement {
  minRole: Role;
  allowCompletionUser?: boolean;  // can the person who completed it do this?
  requiresDifferentUser?: boolean; // must be someone else
  requiresReason?: boolean;
}

const TRANSITION_REQUIREMENTS: Record<string, TransitionRequirement> = {
  "scheduled→assigned": { minRole: "team_leader" },
  "assigned→in_progress": { minRole: "rsw", allowCompletionUser: true },
  "in_progress→submitted": { minRole: "rsw", allowCompletionUser: true },
  "submitted→checked": { minRole: "team_leader", requiresDifferentUser: true },
  "submitted→approved": { minRole: "deputy_manager", requiresDifferentUser: true }, // Level 0 skip
  "submitted→returned_for_improvement": { minRole: "team_leader", requiresDifferentUser: true, requiresReason: true },
  "checked→approved": { minRole: "deputy_manager", requiresDifferentUser: true },
  "checked→returned_for_improvement": { minRole: "team_leader", requiresDifferentUser: true, requiresReason: true },
  "returned_for_improvement→in_progress": { minRole: "rsw", allowCompletionUser: true },
  "returned_for_improvement→resubmitted": { minRole: "rsw", allowCompletionUser: true },
  "resubmitted→checked": { minRole: "team_leader", requiresDifferentUser: true },
  "resubmitted→approved": { minRole: "deputy_manager", requiresDifferentUser: true },
  "resubmitted→returned_for_improvement": { minRole: "team_leader", requiresDifferentUser: true, requiresReason: true },
  "approved→locked": { minRole: "deputy_manager" },
  "locked→filed": { minRole: "team_leader" },
  "overdue→assigned": { minRole: "team_leader" },
  "overdue→in_progress": { minRole: "rsw", allowCompletionUser: true },
  "overdue→submitted": { minRole: "rsw", allowCompletionUser: true },
  "overdue→escalated": { minRole: "team_leader" },
  "overdue→missed": { minRole: "team_leader" },
  "missed→escalated": { minRole: "deputy_manager" },
  "escalated→assigned": { minRole: "deputy_manager" },
  "escalated→in_progress": { minRole: "rsw", allowCompletionUser: true },
  "escalated→submitted": { minRole: "rsw", allowCompletionUser: true },
};

// ── Transition Result ───────────────────────────────────────────────────────

export interface TransitionResult {
  success: boolean;
  newStatus?: LifecycleStatus;
  transition?: StatusTransition;
  error?: string;
  userExplanation?: string;
  escalationCreated?: EscalationEvent;
}

// ── Core: Attempt Transition ────────────────────────────────────────────────

export function attemptTransition(
  occurrence: ScheduledOccurrence,
  targetStatus: LifecycleStatus,
  user: UserContext,
  reason?: string,
  now?: string,
): TransitionResult {
  const currentStatus = occurrence.status;
  const timestamp = now ?? new Date().toISOString();

  // 1. Check valid transition
  const validTargets = VALID_TRANSITIONS[currentStatus];
  if (!validTargets || !validTargets.includes(targetStatus)) {
    return {
      success: false,
      error: `Cannot transition from '${currentStatus}' to '${targetStatus}'.`,
      userExplanation: "This action is not available for the current status of this item.",
    };
  }

  // 2. Check requirements
  const key = `${currentStatus}→${targetStatus}`;
  const req = TRANSITION_REQUIREMENTS[key];

  if (req) {
    // Role check
    if (!isAtLeast(user.role, req.minRole)) {
      return {
        success: false,
        error: `Role '${user.role}' insufficient. Requires at least '${req.minRole}'.`,
        userExplanation: "You do not have permission to perform this action.",
      };
    }

    // Different user check (anti self-approval)
    if (req.requiresDifferentUser && occurrence.completedBy === user.userId) {
      return {
        success: false,
        error: "Cannot check/approve own work.",
        userExplanation: "You cannot check or approve your own submission.",
      };
    }

    // Reason required
    if (req.requiresReason && !reason) {
      return {
        success: false,
        error: "Reason required for this transition.",
        userExplanation: "Please provide a reason for returning this item.",
      };
    }
  }

  // 3. Approval level check
  if (targetStatus === "approved") {
    const maxLevel = MAX_APPROVAL_LEVEL[user.role];
    if (occurrence.approvalLevel > maxLevel) {
      return {
        success: false,
        error: `Approval level ${occurrence.approvalLevel} exceeds your maximum (${maxLevel}).`,
        userExplanation: "This item requires a higher approval level than your role permits.",
      };
    }

    // Self-approval block for high-risk
    if (occurrence.approvalLevel > 0 && occurrence.completedBy === user.userId) {
      if (SELF_APPROVAL_BLOCKED_ROLES.includes(user.role)) {
        return {
          success: false,
          error: "Self-approval blocked for high-risk items.",
          userExplanation: "You cannot approve your own work for this type of record.",
        };
      }
    }
  }

  // 4. Build transition
  const transition: StatusTransition = {
    from: currentStatus,
    to: targetStatus,
    at: timestamp,
    by: user.userId,
    reason,
  };

  return {
    success: true,
    newStatus: targetStatus,
    transition,
  };
}

// ── Check if Overdue ────────────────────────────────────────────────────────

export interface OverdueCheckResult {
  isOverdue: boolean;
  isEscalatable: boolean;
  isMissed: boolean;
  minutesOverdue: number;
  escalationLevel: number;
  escalationSeverity?: EscalationSeverity;
  escalationTarget?: Role;
}

export function checkOverdue(
  occurrence: ScheduledOccurrence,
  template: TaskTemplate,
  now?: string,
): OverdueCheckResult {
  const currentTime = now ? new Date(now) : new Date();
  const dueDateTime = parseDueDateTime(occurrence.dueDate, occurrence.dueTime);
  const graceExpires = occurrence.graceExpiresAt
    ? new Date(occurrence.graceExpiresAt)
    : new Date(dueDateTime.getTime() + template.gracePeriodMinutes * 60000);

  // Not yet due
  if (currentTime <= graceExpires) {
    return {
      isOverdue: false,
      isEscalatable: false,
      isMissed: false,
      minutesOverdue: 0,
      escalationLevel: 0,
    };
  }

  const minutesOverdue = Math.floor((currentTime.getTime() - graceExpires.getTime()) / 60000);

  // Determine escalation level
  let escalationLevel = 0;
  let escalationSeverity: EscalationSeverity | undefined;
  let escalationTarget: Role | undefined;

  if (template.secondEscalationMinutes && minutesOverdue >= template.secondEscalationMinutes) {
    escalationLevel = 2;
    escalationSeverity = "red";
    escalationTarget = template.secondEscalationTo;
  } else if (minutesOverdue >= template.firstEscalationMinutes) {
    escalationLevel = 1;
    escalationSeverity = "amber";
    escalationTarget = template.firstEscalationTo;
  }

  // Check critical (repeated misses)
  const isMissed = minutesOverdue > (template.firstEscalationMinutes * 3); // rough heuristic

  return {
    isOverdue: true,
    isEscalatable: escalationLevel > 0,
    isMissed,
    minutesOverdue,
    escalationLevel,
    escalationSeverity,
    escalationTarget,
  };
}

// ── Generate Next Occurrences ───────────────────────────────────────────────

export interface NextOccurrence {
  templateId: string;
  templateName: string;
  homeId: string;
  childId?: string;
  dueDate: string;
  dueTime?: string;
  graceExpiresAt: string;
  approvalLevel: ApprovalLevel;
  qaRequired: boolean;
  evidenceTags: string[];
}

export function generateNextOccurrences(
  template: TaskTemplate,
  fromDate: string,
  count: number = 1,
): NextOccurrence[] {
  const occurrences: NextOccurrence[] = [];
  let currentDate = new Date(fromDate);

  for (let i = 0; i < count; i++) {
    const nextDate = getNextScheduleDate(template, currentDate);
    if (!nextDate) break;

    const dueDate = nextDate.toISOString().slice(0, 10);
    const dueDateTime = template.scheduleTime
      ? new Date(`${dueDate}T${template.scheduleTime}:00Z`)
      : nextDate;
    const graceTime = new Date(dueDateTime.getTime() + template.gracePeriodMinutes * 60000);

    for (const homeId of template.homeIds) {
      occurrences.push({
        templateId: template.id,
        templateName: template.name,
        homeId,
        dueDate,
        dueTime: template.scheduleTime,
        graceExpiresAt: graceTime.toISOString(),
        approvalLevel: template.approvalLevel,
        qaRequired: template.qaRequired,
        evidenceTags: template.evidenceTags,
      });
    }

    // Move past this date for next iteration
    currentDate = new Date(nextDate.getTime() + 86400000);
  }

  return occurrences;
}

// ── Get Valid Transitions ───────────────────────────────────────────────────

export function getValidTransitions(
  occurrence: ScheduledOccurrence,
  user: UserContext,
): LifecycleStatus[] {
  const current = occurrence.status;
  const validTargets = VALID_TRANSITIONS[current] ?? [];

  return validTargets.filter(target => {
    const key = `${current}→${target}`;
    const req = TRANSITION_REQUIREMENTS[key];
    if (!req) return true; // no specific requirements

    // Role check
    if (!isAtLeast(user.role, req.minRole)) return false;

    // Different user check
    if (req.requiresDifferentUser && occurrence.completedBy === user.userId) return false;

    // Approval level check
    if (target === "approved") {
      if (occurrence.approvalLevel > MAX_APPROVAL_LEVEL[user.role]) return false;
      if (occurrence.approvalLevel > 0 && occurrence.completedBy === user.userId) {
        if (SELF_APPROVAL_BLOCKED_ROLES.includes(user.role)) return false;
      }
    }

    return true;
  });
}

// ── Compliance Summary ──────────────────────────────────────────────────────

export interface ComplianceSummary {
  totalScheduled: number;
  completedOnTime: number;
  completedLate: number;
  missed: number;
  overdue: number;
  escalated: number;
  complianceRate: number;         // 0-100
  avgCompletionMinutes: number;
  returnedCount: number;
  qaPassRate: number;             // 0-100
}

export function calculateCompliance(
  occurrences: ScheduledOccurrence[],
): ComplianceSummary {
  const total = occurrences.length;
  if (total === 0) {
    return {
      totalScheduled: 0,
      completedOnTime: 0,
      completedLate: 0,
      missed: 0,
      overdue: 0,
      escalated: 0,
      complianceRate: 100,
      avgCompletionMinutes: 0,
      returnedCount: 0,
      qaPassRate: 100,
    };
  }

  const completedStatuses: LifecycleStatus[] = ["submitted", "checked", "approved", "locked", "filed"];
  const completed = occurrences.filter(o => completedStatuses.includes(o.status) || o.completedAt);

  const onTime = completed.filter(o => {
    if (!o.completedAt || !o.graceExpiresAt) return true;
    return new Date(o.completedAt) <= new Date(o.graceExpiresAt);
  });

  const late = completed.filter(o => {
    if (!o.completedAt || !o.graceExpiresAt) return false;
    return new Date(o.completedAt) > new Date(o.graceExpiresAt);
  });

  const missed = occurrences.filter(o => o.status === "missed").length;
  const overdue = occurrences.filter(o => o.status === "overdue").length;
  const escalated = occurrences.filter(o => o.status === "escalated" || o.escalationLevel > 0).length;
  const returned = occurrences.filter(o => o.resubmissionCount > 0).length;

  const qaSampled = occurrences.filter(o => o.qaSampledAt);
  const qaPassed = qaSampled.filter(o => (o.qaScore ?? 0) >= 3);

  const complianceRate = Math.round(((onTime.length) / total) * 100);
  const qaPassRate = qaSampled.length > 0
    ? Math.round((qaPassed.length / qaSampled.length) * 100)
    : 100;

  return {
    totalScheduled: total,
    completedOnTime: onTime.length,
    completedLate: late.length,
    missed,
    overdue,
    escalated,
    complianceRate,
    avgCompletionMinutes: 0, // would need timestamps to calculate
    returnedCount: returned,
    qaPassRate,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseDueDateTime(date: string, time?: string): Date {
  if (time) {
    return new Date(`${date}T${time}:00Z`);
  }
  return new Date(`${date}T23:59:00Z`);
}

function getNextScheduleDate(template: TaskTemplate, from: Date): Date | null {
  switch (template.scheduleFrequency) {
    case "daily":
      return from;

    case "weekly": {
      const next = new Date(from);
      next.setUTCDate(next.getUTCDate() + 7);
      return next;
    }

    case "monthly": {
      const next = new Date(from);
      next.setUTCMonth(next.getUTCMonth() + 1);
      return next;
    }

    case "quarterly": {
      const next = new Date(from);
      next.setUTCMonth(next.getUTCMonth() + 3);
      return next;
    }

    case "annually": {
      const next = new Date(from);
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      return next;
    }

    case "first_of_month": {
      const next = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
      return next;
    }

    case "last_of_month": {
      const next = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 2, 0));
      return next;
    }

    case "specific_weekdays": {
      if (!template.scheduleDays || template.scheduleDays.length === 0) return null;
      // Find next matching weekday
      const next = new Date(from);
      for (let i = 0; i < 7; i++) {
        if (template.scheduleDays.includes(next.getUTCDay())) return next;
        next.setUTCDate(next.getUTCDate() + 1);
      }
      return null;
    }

    case "specific_dates": {
      if (!template.scheduleDates || template.scheduleDates.length === 0) return null;
      // Find next matching date
      const currentDay = from.getUTCDate();
      const nextDate = template.scheduleDates.find(d => d >= currentDay);
      if (nextDate) {
        return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), nextDate));
      }
      // Next month's first matching date
      return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, template.scheduleDates[0]));
    }

    case "one_off":
      return from;

    case "every_shift":
      return from; // triggered per shift, not calendar-based

    default:
      return from;
  }
}
