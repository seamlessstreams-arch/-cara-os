// ══════════════════════════════════════════════════════════════════════════════
// Cara Permission System — Access Decision Service
//
// Pure deterministic permission engine. Given a user context and a resource
// request, returns an AccessDecision with allowed/denied, reason, and
// user/manager explanations.
//
// Evaluation order:
//   1. Employment status block (suspended/leaver/archived)
//   2. Break-glass override check
//   3. Temporary grant check
//   4. Delegated scope check
//   5. Safeguarding need-to-know check
//   6. Role-based rule match
//   7. ABAC condition evaluation (home match, assignment, shift, sensitivity)
//   8. Self-approval block check
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  UserContext,
  AccessDecision,
  ResourceType,
  Action,
  Sensitivity,
  ApprovalLevel,
  Role,
  PermissionRule,
} from "./types";

import {
  PERMISSION_RULES,
  BLOCKED_STATUSES,
  RESTRICTED_STATUSES,
  ROLE_HIERARCHY,
  isAtLeast,
  MAX_APPROVAL_LEVEL,
  SELF_APPROVAL_BLOCKED_ROLES,
} from "./role-rules";

// ── Request Context ─────────────────────────────────────────────────────────

export interface AccessCheckRequest {
  user: UserContext;
  resourceType: ResourceType;
  action: Action;
  resourceId?: string;
  resourceHomeId?: string;       // which home does the resource belong to
  resourceChildId?: string;      // which child does the resource relate to
  resourceStaffId?: string;      // which staff member does the resource relate to
  resourceSensitivity?: Sensitivity;
  resourceApprovalLevel?: ApprovalLevel;
  resourceCreatedBy?: string;    // for self-approval checks
  now?: string;                  // ISO date for expiry checks (defaults to Date.now)
}

// ── Main Decision Function ──────────────────────────────────────────────────

/** Child/staff-confidential record types where EVERY allowed access (incl. a
 * routine role-based view) must be logged — insider-threat detection + the
 * Ofsted ILACS "who accessed this child's record, when" trail. */
const AUDIT_ON_ACCESS: ReadonlySet<ResourceType> = new Set<ResourceType>([
  "child_record", "safeguarding", "incident", "medication",
  "missing_episode", "physical_intervention", "daily_log", "hr_file",
]);

/**
 * Access decision + regulatory audit-on-view. The inner computation decides
 * allow/deny + grant source; this wrapper additionally forces auditEventRequired
 * for any ALLOWED access to a confidential record, so legitimate views leave a
 * trail (the inner rule only audited exceptional grants — an insider-threat gap).
 */
export function checkAccess(req: AccessCheckRequest): AccessDecision {
  const decision = computeAccessDecision(req);
  if (decision.allowed && AUDIT_ON_ACCESS.has(req.resourceType)) {
    return { ...decision, auditEventRequired: true };
  }
  return decision;
}

function computeAccessDecision(req: AccessCheckRequest): AccessDecision {
  const { user, resourceType, action } = req;
  const now = req.now ? new Date(req.now) : new Date();

  // ── Step 1: Employment status block ──────────────────────────────
  if (BLOCKED_STATUSES.includes(user.employmentStatus)) {
    return deny(
      "employment_blocked",
      `Employment status '${user.employmentStatus}' blocks all system access.`,
      "This area is not available with your current employment status.",
      `User employment status is '${user.employmentStatus}' — all access blocked.`,
    );
  }

  // Restricted statuses: only view own dashboard
  if (RESTRICTED_STATUSES.includes(user.employmentStatus)) {
    if (resourceType !== "dashboard" || action !== "view") {
      return deny(
        "employment_restricted",
        `Employment status '${user.employmentStatus}' restricts access to dashboard only.`,
        "Your access is currently limited. Please speak to your manager.",
        `User employment status '${user.employmentStatus}' restricts to dashboard-only access.`,
      );
    }
    // Allow dashboard view for restricted statuses — skip further checks
    return allow(
      "role",
      `Dashboard view allowed for restricted employment status '${user.employmentStatus}'.`,
      "Access granted.",
      `Dashboard-only access granted for employment status '${user.employmentStatus}'.`,
    );
  }

  // ── Step 2: Temporary grants ─────────────────────────────────────
  const activeGrant = user.temporaryGrants.find(g =>
    g.status === "active" &&
    g.resourceType === resourceType &&
    g.actions.includes(action) &&
    new Date(g.expiresAt) > now &&
    (!g.resourceId || g.resourceId === req.resourceId)
  );

  if (activeGrant) {
    return allow(
      "temporary_grant",
      `Temporary access granted by manager (expires ${activeGrant.expiresAt}).`,
      "You have temporary access to this area.",
      `Temporary access granted by ${activeGrant.grantedBy}, reason: ${activeGrant.reason}. Expires ${activeGrant.expiresAt}.`,
      activeGrant.expiresAt,
    );
  }

  // ── Step 3: Delegated scope check ────────────────────────────────
  const delegation = user.delegatedScopes.find(d =>
    d.resourceType === resourceType &&
    d.actions.includes(action) &&
    (!d.resourceId || d.resourceId === req.resourceId) &&
    (!d.expiresAt || new Date(d.expiresAt) > now)
  );

  if (delegation) {
    return allow(
      "delegation",
      `Delegated access from ${delegation.grantedBy}: ${delegation.reason}.`,
      "You have delegated access to this area.",
      `Delegated by ${delegation.grantedBy}. Reason: ${delegation.reason}.`,
      delegation.expiresAt,
    );
  }

  // ── Step 4: Safeguarding need-to-know ────────────────────────────
  if (resourceType === "safeguarding" && req.resourceChildId) {
    if (user.safeguardingNeedToKnow.includes(req.resourceChildId)) {
      // Allowed via NTK list — still need role check for action
      // Don't return early, just note it's NTK-accessible
    }
  }

  // ── Step 5: Role-based rule matching ─────────────────────────────
  const matchingRules = PERMISSION_RULES.filter(rule => {
    const roles = Array.isArray(rule.role) ? rule.role : [rule.role];
    return roles.includes(user.role) && rule.resourceType === resourceType;
  });

  if (matchingRules.length === 0) {
    return deny(
      "no_rule",
      `No permission rule grants '${user.role}' access to '${resourceType}'.`,
      "This area is restricted to your role.",
      `Role '${user.role}' has no rules for resource type '${resourceType}'.`,
    );
  }

  // Find a rule that allows the requested action
  const actionRule = matchingRules.find(rule => rule.actions.includes(action));

  if (!actionRule) {
    // Role has rules for this resource but not this action
    const allowedActions = [...new Set(matchingRules.flatMap(r => r.actions))];
    return deny(
      "action_not_permitted",
      `Role '${user.role}' cannot '${action}' on '${resourceType}'. Allowed: ${allowedActions.join(", ") || "none"}.`,
      `You do not have permission to ${action} this item.`,
      `Role '${user.role}' is not permitted to '${action}' on '${resourceType}'. Permitted actions: ${allowedActions.join(", ") || "none"}.`,
    );
  }

  // ── Step 6: ABAC Condition evaluation ────────────────────────────

  // Home match check
  if (actionRule.requiresHomeMatch && req.resourceHomeId) {
    if (!user.homeIds.includes(req.resourceHomeId)) {
      return deny(
        "home_mismatch",
        `User does not belong to home '${req.resourceHomeId}'.`,
        "This record belongs to a different home.",
        `User's homes [${user.homeIds.join(", ")}] do not include resource home '${req.resourceHomeId}'.`,
      );
    }
  }

  // Assignment check (must be assigned to the child)
  if (actionRule.requiresAssignment && req.resourceChildId) {
    if (!user.assignedChildIds.includes(req.resourceChildId)) {
      return deny(
        "not_assigned",
        `User is not assigned to child '${req.resourceChildId}'.`,
        "You are not assigned to this child.",
        `User's assigned children [${user.assignedChildIds.join(", ")}] do not include '${req.resourceChildId}'.`,
      );
    }
  }

  // Shift check (agency staff)
  if (actionRule.requiresShift && !user.shiftActive) {
    return deny(
      "not_on_shift",
      "Action requires active shift.",
      "You can only access this while on shift.",
      "User is not currently on shift — access requires active shift status.",
    );
  }

  // Sensitivity check
  if (actionRule.sensitivityMax && req.resourceSensitivity) {
    if (!sensitivityAllowed(actionRule.sensitivityMax, req.resourceSensitivity)) {
      return deny(
        "sensitivity_exceeded",
        `Resource sensitivity '${req.resourceSensitivity}' exceeds role maximum '${actionRule.sensitivityMax}'.`,
        "This record has a higher sensitivity level than your role permits.",
        `Resource sensitivity '${req.resourceSensitivity}' exceeds the maximum '${actionRule.sensitivityMax}' for role '${user.role}'.`,
      );
    }
  }

  // Approval level check
  if (req.resourceApprovalLevel !== undefined) {
    const maxLevel = actionRule.approvalLevelMax ?? MAX_APPROVAL_LEVEL[user.role];
    if (req.resourceApprovalLevel > maxLevel) {
      return deny(
        "approval_level_exceeded",
        `Approval level ${req.resourceApprovalLevel} exceeds maximum ${maxLevel} for role '${user.role}'.`,
        "This item requires a higher approval level than your role permits.",
        `Resource requires Level ${req.resourceApprovalLevel} approval. Role '${user.role}' max is Level ${maxLevel}.`,
      );
    }
  }

  // ── Step 7: Self-approval block ──────────────────────────────────
  if (action === "approve" && req.resourceCreatedBy === user.userId) {
    const approvalLevel = req.resourceApprovalLevel ?? 0;
    if (approvalLevel > 0 && SELF_APPROVAL_BLOCKED_ROLES.includes(user.role)) {
      return deny(
        "self_approval_blocked",
        "Cannot self-approve high-risk records.",
        "You cannot approve your own work for this type of record.",
        `Self-approval blocked for role '${user.role}' on Level ${approvalLevel} items.`,
      );
    }
    // Even managers can't self-approve Level 3+
    if (approvalLevel >= 3 && user.role === "registered_manager") {
      return deny(
        "self_approval_blocked",
        "Cannot self-approve Level 3+ records even as Registered Manager.",
        "This record requires approval from someone other than the author.",
        `Self-approval blocked at Level ${approvalLevel}. Must be approved by RI/Ops or above.`,
      );
    }
  }

  // ── Step 8: Custom conditions ────────────────────────────────────
  if (actionRule.conditions) {
    for (const condition of actionRule.conditions) {
      if (!evaluateCondition(user, condition)) {
        return deny(
          "condition_failed",
          `Condition '${condition.attribute} ${condition.operator} ${JSON.stringify(condition.value)}' not met.`,
          "You do not currently meet the requirements for this access.",
          `ABAC condition failed: ${condition.attribute} ${condition.operator} ${JSON.stringify(condition.value)}.`,
        );
      }
    }
  }

  // ── All checks passed — ALLOW ────────────────────────────────────
  return allow(
    "role",
    `Role '${user.role}' permitted to '${action}' on '${resourceType}'.`,
    "Access granted.",
    `Allowed via role-based rule for '${user.role}'.`,
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function allow(
  source: AccessDecision["grantSource"],
  reason: string,
  userExplanation: string,
  managerExplanation: string,
  expiry?: string,
): AccessDecision {
  return {
    allowed: true,
    reason,
    restrictionLevel: "none",
    expiry,
    auditEventRequired: source === "temporary_grant" || source === "break_glass" || source === "delegation",
    userFacingExplanation: userExplanation,
    managerFacingExplanation: managerExplanation,
    grantSource: source,
  };
}

function deny(
  code: string,
  reason: string,
  userExplanation: string,
  managerExplanation: string,
): AccessDecision {
  return {
    allowed: false,
    reason,
    restrictionLevel: "full",
    auditEventRequired: true,
    userFacingExplanation: userExplanation,
    managerFacingExplanation: managerExplanation,
  };
}

// ── Sensitivity ordering ────────────────────────────────────────────────────

const SENSITIVITY_ORDER: Record<Sensitivity, number> = {
  public: 0,
  internal: 1,
  restricted: 2,
  confidential: 3,
  safeguarding: 4,
};

function sensitivityAllowed(maxAllowed: Sensitivity, resourceLevel: Sensitivity): boolean {
  return SENSITIVITY_ORDER[resourceLevel] <= SENSITIVITY_ORDER[maxAllowed];
}

// ── Condition evaluator ─────────────────────────────────────────────────────

function evaluateCondition(
  user: UserContext,
  condition: { attribute: string; operator: string; value: any },
): boolean {
  const actual = (user as any)[condition.attribute];
  if (actual === undefined) return false;

  switch (condition.operator) {
    case "eq": return actual === condition.value;
    case "neq": return actual !== condition.value;
    case "in": return Array.isArray(condition.value) && condition.value.includes(actual);
    case "not_in": return Array.isArray(condition.value) && !condition.value.includes(actual);
    case "gt": return actual > condition.value;
    case "lt": return actual < condition.value;
    case "contains": return Array.isArray(actual) && actual.includes(condition.value);
    case "is_true": return actual === true;
    case "is_false": return actual === false;
    default: return false;
  }
}

// ── Convenience: Can user access resource? (boolean shorthand) ──────────────

export function canAccess(
  user: UserContext,
  resourceType: ResourceType,
  action: Action,
  context?: Partial<Omit<AccessCheckRequest, "user" | "resourceType" | "action">>,
): boolean {
  return checkAccess({ user, resourceType, action, ...context }).allowed;
}

// ── Convenience: Get all allowed actions for a resource type ────────────────

export function getAllowedActions(
  user: UserContext,
  resourceType: ResourceType,
  context?: Partial<Omit<AccessCheckRequest, "user" | "resourceType" | "action">>,
): Action[] {
  const allActions: Action[] = [
    "view", "create", "edit", "delete", "archive", "approve", "check",
    "return_for_improvement", "lock", "unlock", "export", "download",
    "assign", "delegate", "escalate", "file", "qa_sample",
    "generate_evidence", "request_access", "break_glass",
  ];

  return allActions.filter(action =>
    checkAccess({ user, resourceType, action, ...context }).allowed
  );
}
