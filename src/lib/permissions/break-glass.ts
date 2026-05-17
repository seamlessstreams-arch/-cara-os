// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Permission System — Break-Glass Emergency Access
//
// Emergency override mechanism for situations where normal access controls
// must be bypassed for child safety or regulatory requirements.
//
// Break-glass events:
//   1. Are ALWAYS logged with critical severity
//   2. Require mandatory justification at time of use
//   3. Generate immediate notifications to managers
//   4. Require post-event review within 24 hours
//   5. Are included in Reg 44 reports
//   6. Cannot be used by roles below team_leader
//   7. Are time-limited (auto-expire after configured duration)
//
// This is the "fire alarm" of the system — necessary but never routine.
// ══════════════════════════════════════════════════════════════════════════════

import type { Role, ResourceType, Action } from "./types";
import { isAtLeast } from "./role-rules";

// ── Types ──────────────────────────────────────────────────────────────────

export type BreakGlassReason =
  | "child_safety_immediate"       // immediate risk to a child
  | "safeguarding_disclosure"      // child has made disclosure, need to access records
  | "missing_child"                // child missing, need all relevant info
  | "medical_emergency"            // medical situation requiring health records
  | "police_request"               // police require immediate access
  | "ofsted_inspection"            // inspector needs access during live inspection
  | "manager_unavailable"          // normal approver unavailable in emergency
  | "system_recovery";             // IT issue requiring data access

export type BreakGlassStatus = "active" | "expired" | "reviewed" | "flagged";

export interface BreakGlassRequest {
  userId: string;
  userRole: Role;
  reason: BreakGlassReason;
  justification: string;           // free text explanation
  resourceType: ResourceType;
  resourceId?: string;
  childId?: string;
  durationMinutes?: number;        // default: 60
}

export interface BreakGlassEvent {
  id: string;
  userId: string;
  userRole: Role;
  reason: BreakGlassReason;
  justification: string;
  resourceType: ResourceType;
  resourceId?: string;
  childId?: string;
  grantedAt: string;
  expiresAt: string;
  status: BreakGlassStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewOutcome?: "justified" | "unjustified" | "escalated";
  reviewNotes?: string;
  actionsPerformed: string[];      // what the user did during break-glass
}

export interface BreakGlassResult {
  success: boolean;
  event?: BreakGlassEvent;
  error?: string;
  userExplanation?: string;
  notificationsRequired: string[]; // roles/users to notify
}

export interface BreakGlassReviewResult {
  success: boolean;
  event?: BreakGlassEvent;
  error?: string;
}

// ── Configuration ──────────────────────────────────────────────────────────

const BREAK_GLASS_MIN_ROLE: Role = "team_leader";
const DEFAULT_DURATION_MINUTES = 60;
const MAX_DURATION_MINUTES = 240;

const NOTIFICATION_TARGETS: Record<Role, Role[]> = {
  team_leader: ["deputy_manager", "registered_manager"],
  senior_rsw: ["team_leader", "deputy_manager"],
  deputy_manager: ["registered_manager"],
  registered_manager: ["responsible_individual", "operations_manager"],
  operations_manager: ["responsible_individual"],
  responsible_individual: ["provider_owner"],
  provider_owner: ["super_admin"],
  super_admin: [],
  rsw: [],
  waking_night: [],
  agency_staff: [],
  hr_admin: [],
  finance_admin: [],
  reg44_visitor: [],
  external_auditor: [],
  ofsted_readonly_export: [],
};

// ── Core: Request Break-Glass Access ───────────────────────────────────────

export function requestBreakGlass(
  request: BreakGlassRequest,
  now?: string,
): BreakGlassResult {
  const timestamp = now ?? new Date().toISOString();

  // 1. Role check
  if (!isAtLeast(request.userRole, BREAK_GLASS_MIN_ROLE)) {
    return {
      success: false,
      error: `Role '${request.userRole}' cannot use break-glass. Requires '${BREAK_GLASS_MIN_ROLE}' or above.`,
      userExplanation: "You do not have permission to use emergency access. Please contact your manager immediately.",
      notificationsRequired: [],
    };
  }

  // 2. Justification required
  if (!request.justification || request.justification.trim().length < 10) {
    return {
      success: false,
      error: "Break-glass justification must be at least 10 characters.",
      userExplanation: "Please provide a detailed justification for emergency access.",
      notificationsRequired: [],
    };
  }

  // 3. Calculate duration
  const durationMinutes = Math.min(
    request.durationMinutes ?? DEFAULT_DURATION_MINUTES,
    MAX_DURATION_MINUTES,
  );
  const expiresAt = new Date(
    new Date(timestamp).getTime() + durationMinutes * 60000,
  ).toISOString();

  // 4. Build event
  const event: BreakGlassEvent = {
    id: `bg-${timestamp.replace(/[^0-9]/g, "")}-${Math.random().toString(36).slice(2, 6)}`,
    userId: request.userId,
    userRole: request.userRole,
    reason: request.reason,
    justification: request.justification.trim(),
    resourceType: request.resourceType,
    resourceId: request.resourceId,
    childId: request.childId,
    grantedAt: timestamp,
    expiresAt,
    status: "active",
    actionsPerformed: [],
  };

  // 5. Determine who to notify
  const notificationRoles = NOTIFICATION_TARGETS[request.userRole] ?? [];
  const notificationsRequired = notificationRoles.length > 0
    ? notificationRoles
    : ["registered_manager"];

  return {
    success: true,
    event,
    notificationsRequired,
  };
}

// ── Core: Check Active Break-Glass ─────────────────────────────────────────

export function isBreakGlassActive(
  event: BreakGlassEvent,
  now?: string,
): boolean {
  if (event.status !== "active") return false;
  const currentTime = now ? new Date(now) : new Date();
  return currentTime < new Date(event.expiresAt);
}

// ── Core: Expire Break-Glass ───────────────────────────────────────────────

export function expireBreakGlass(
  event: BreakGlassEvent,
  now?: string,
): BreakGlassEvent {
  return {
    ...event,
    status: "expired",
  };
}

// ── Core: Review Break-Glass Event ─────────────────────────────────────────

export function reviewBreakGlass(
  event: BreakGlassEvent,
  reviewerId: string,
  reviewerRole: Role,
  outcome: "justified" | "unjustified" | "escalated",
  notes: string,
  now?: string,
): BreakGlassReviewResult {
  const timestamp = now ?? new Date().toISOString();

  // Must be deputy_manager+ to review
  if (!isAtLeast(reviewerRole, "deputy_manager")) {
    return {
      success: false,
      error: `Role '${reviewerRole}' cannot review break-glass events.`,
    };
  }

  // Cannot review own break-glass
  if (event.userId === reviewerId) {
    return {
      success: false,
      error: "Cannot review your own break-glass event.",
    };
  }

  // Must be expired or active (not already reviewed)
  if (event.status === "reviewed" || event.status === "flagged") {
    return {
      success: false,
      error: "This event has already been reviewed.",
    };
  }

  // Notes required
  if (!notes || notes.trim().length === 0) {
    return {
      success: false,
      error: "Review notes are required.",
    };
  }

  const reviewed: BreakGlassEvent = {
    ...event,
    status: outcome === "unjustified" ? "flagged" : "reviewed",
    reviewedBy: reviewerId,
    reviewedAt: timestamp,
    reviewOutcome: outcome,
    reviewNotes: notes.trim(),
  };

  return {
    success: true,
    event: reviewed,
  };
}

// ── Core: Log Action During Break-Glass ────────────────────────────────────

export function logBreakGlassAction(
  event: BreakGlassEvent,
  action: string,
): BreakGlassEvent {
  return {
    ...event,
    actionsPerformed: [...event.actionsPerformed, action],
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getBreakGlassReasonLabel(reason: BreakGlassReason): string {
  const labels: Record<BreakGlassReason, string> = {
    child_safety_immediate: "Immediate Child Safety Risk",
    safeguarding_disclosure: "Safeguarding Disclosure",
    missing_child: "Missing Child",
    medical_emergency: "Medical Emergency",
    police_request: "Police Request",
    ofsted_inspection: "Ofsted Inspection",
    manager_unavailable: "Manager Unavailable",
    system_recovery: "System Recovery",
  };
  return labels[reason];
}

export function getUnreviewedEvents(events: BreakGlassEvent[]): BreakGlassEvent[] {
  return events.filter(e =>
    (e.status === "active" || e.status === "expired") &&
    !e.reviewedBy,
  );
}

export function getOverdueReviews(
  events: BreakGlassEvent[],
  now?: string,
): BreakGlassEvent[] {
  const currentTime = now ? new Date(now) : new Date();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;

  return events.filter(e => {
    if (e.reviewedBy) return false; // already reviewed
    const grantedTime = new Date(e.grantedAt);
    return (currentTime.getTime() - grantedTime.getTime()) > twentyFourHoursMs;
  });
}
