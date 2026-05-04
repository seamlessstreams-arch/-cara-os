// ══════════════════════════════════════════════════════════════════════════════
// HR INTELLIGENCE — ROLE-BASED ACCESS CONTROL
//
// HR records sit alongside safeguarding records in sensitivity. We default to
// least-privilege: a user sees only what their role explicitly grants. The
// matrix here is the source of truth for what each HR role can do.
//
// Roles align with how the home actually staffs HR work. Where production
// auth claims differ, map them onto these roles in middleware.
//
// HrRole          | Typical user
// ─────────────── | ──────────────────────────────────────────────────────────
// ri              | Responsible Individual
// rm              | Registered Manager
// deputy          | Deputy Manager
// hr_admin        | Provider HR / People team
// hr_caseworker   | HR caseworker working on a specific case
// safeguarding    | Designated Safeguarding Lead
// auditor         | Read-only inspection / quality auditor
// staff_self      | A staff member viewing their own record
// none            | Default for unrecognised users
// ══════════════════════════════════════════════════════════════════════════════

export type HrRole =
  | "ri"
  | "rm"
  | "deputy"
  | "hr_admin"
  | "hr_caseworker"
  | "safeguarding"
  | "auditor"
  | "staff_self"
  | "none";

export type HrAction =
  | "case.create"
  | "case.read"
  | "case.read_safeguarding"
  | "case.update"
  | "case.close"
  | "case.delete"
  | "case.export"
  | "guardian.run"
  | "guardian.approve"
  | "guardian.reject"
  | "guardian.read"
  | "letter.draft"
  | "letter.approve"
  | "letter.send"
  | "safer_recruitment.read"
  | "safer_recruitment.update"
  | "safer_recruitment.sign_off"
  | "safer_recruitment.senior_risk_acceptance"
  | "probation.read"
  | "probation.update"
  | "probation.decide_outcome"
  | "sickness.read"
  | "sickness.update"
  | "supervision_themes.read"
  | "agency.read"
  | "agency.update"
  | "agency.block"
  | "exit_interview.read"
  | "exit_interview.update"
  | "audit.read"
  | "audit.export"
  | "ri_oversight.write"
  | "tasks.read"
  | "tasks.write";

type Matrix = Record<HrRole, ReadonlySet<HrAction>>;

const ALL: HrAction[] = [
  "case.create", "case.read", "case.read_safeguarding", "case.update", "case.close",
  "case.delete", "case.export",
  "guardian.run", "guardian.approve", "guardian.reject", "guardian.read",
  "letter.draft", "letter.approve", "letter.send",
  "safer_recruitment.read", "safer_recruitment.update", "safer_recruitment.sign_off",
  "safer_recruitment.senior_risk_acceptance",
  "probation.read", "probation.update", "probation.decide_outcome",
  "sickness.read", "sickness.update",
  "supervision_themes.read",
  "agency.read", "agency.update", "agency.block",
  "exit_interview.read", "exit_interview.update",
  "audit.read", "audit.export",
  "ri_oversight.write",
  "tasks.read", "tasks.write",
];

function set(...actions: HrAction[]): ReadonlySet<HrAction> {
  return new Set(actions);
}

// Each role's grants. Designed conservatively. Edit deliberately.
export const HR_PERMISSIONS: Matrix = {
  ri: set(
    // Strategic oversight. Can see everything, decide on senior risk
    // acceptances and oversight reviews. Cannot delete records.
    ...ALL.filter((a) => a !== "case.delete"),
  ),
  rm: set(
    "case.create", "case.read", "case.read_safeguarding", "case.update", "case.close",
    "case.export",
    "guardian.run", "guardian.approve", "guardian.reject", "guardian.read",
    "letter.draft", "letter.approve", "letter.send",
    "safer_recruitment.read", "safer_recruitment.update", "safer_recruitment.sign_off",
    "probation.read", "probation.update", "probation.decide_outcome",
    "sickness.read", "sickness.update",
    "supervision_themes.read",
    "agency.read", "agency.update", "agency.block",
    "exit_interview.read", "exit_interview.update",
    "audit.read",
    "ri_oversight.write",
    "tasks.read", "tasks.write",
  ),
  deputy: set(
    "case.read", "case.update",
    "guardian.run", "guardian.read",
    "letter.draft",
    "safer_recruitment.read", "safer_recruitment.update",
    "probation.read", "probation.update",
    "sickness.read", "sickness.update",
    "supervision_themes.read",
    "agency.read", "agency.update",
    "tasks.read", "tasks.write",
  ),
  hr_admin: set(
    "case.create", "case.read", "case.read_safeguarding", "case.update", "case.close",
    "case.export",
    "guardian.run", "guardian.read",
    "letter.draft",
    "safer_recruitment.read", "safer_recruitment.update", "safer_recruitment.sign_off",
    "probation.read", "probation.update",
    "sickness.read", "sickness.update",
    "supervision_themes.read",
    "agency.read", "agency.update",
    "exit_interview.read", "exit_interview.update",
    "audit.read", "audit.export",
    "tasks.read", "tasks.write",
  ),
  hr_caseworker: set(
    // Scoped at the case level by the application layer. The set here is the
    // ceiling; the case_owner check narrows it to the cases they are assigned.
    "case.read", "case.update",
    "guardian.run", "guardian.read",
    "letter.draft",
    "tasks.read", "tasks.write",
  ),
  safeguarding: set(
    // DSL-style role. Can see safeguarding-status cases everywhere, and run
    // the Guardian against safeguarding-allegation drafts.
    "case.read", "case.read_safeguarding", "case.update",
    "guardian.run", "guardian.read",
    "letter.draft",
    "audit.read",
    "tasks.read", "tasks.write",
  ),
  auditor: set(
    // Read-only inspector. No write paths. Can export.
    "case.read", "case.read_safeguarding",
    "guardian.read",
    "safer_recruitment.read",
    "probation.read",
    "sickness.read",
    "supervision_themes.read",
    "agency.read",
    "exit_interview.read",
    "audit.read", "audit.export",
    "tasks.read",
  ),
  staff_self: set(
    // A staff member can read records about themselves. Application layer
    // must filter by staff_id matching the authenticated subject.
    // Some safeguarding-status cases may be excluded by the application
    // until disclosure is appropriate.
    "case.read",
    "probation.read",
    "sickness.read",
    "tasks.read",
  ),
  none: set(),
};

export function can(role: HrRole, action: HrAction): boolean {
  return HR_PERMISSIONS[role]?.has(action) ?? false;
}

export interface HrPermissionContext {
  role: HrRole;
  userId: string;
  homeId?: string;
  staffSelfId?: string;
}

export interface HrAccessRequest {
  action: HrAction;
  homeId?: string;
  staffId?: string;
  caseSafeguardingStatus?: string;
  caseOwner?: string;
}

/**
 * Application-layer access check. Combines the role matrix with per-record
 * scoping (home, subject staff, case ownership for caseworkers, safeguarding
 * confidentiality). Always returns a clear reason string when access is
 * denied so the audit log captures it.
 */
export function checkHrAccess(
  context: HrPermissionContext,
  request: HrAccessRequest,
): { allowed: boolean; reason?: string } {
  if (!can(context.role, request.action)) {
    return { allowed: false, reason: `Role ${context.role} does not grant ${request.action}` };
  }

  if (context.role === "staff_self") {
    if (!context.staffSelfId) {
      return { allowed: false, reason: "staff_self has no resolved subject id" };
    }
    if (request.staffId && request.staffId !== context.staffSelfId) {
      return { allowed: false, reason: "staff_self may only access their own records" };
    }
    if (
      request.caseSafeguardingStatus &&
      request.caseSafeguardingStatus !== "not_safeguarding"
    ) {
      return {
        allowed: false,
        reason: "Safeguarding-status cases are not visible to the subject staff member at this stage",
      };
    }
  }

  if (context.role === "hr_caseworker" && request.action.startsWith("case.")) {
    if (!request.caseOwner) {
      return {
        allowed: false,
        reason: "hr_caseworker requires a case_owner to be set on the case",
      };
    }
    if (request.caseOwner !== context.userId) {
      return {
        allowed: false,
        reason: "hr_caseworker may only access cases they own",
      };
    }
  }

  // Safeguarding-status cases are gated by case.read_safeguarding regardless
  // of the role's case.read grant.
  if (
    request.caseSafeguardingStatus &&
    request.caseSafeguardingStatus !== "not_safeguarding" &&
    request.action === "case.read" &&
    !can(context.role, "case.read_safeguarding")
  ) {
    return {
      allowed: false,
      reason: "Safeguarding-status cases require case.read_safeguarding permission",
    };
  }

  // Per-home scoping: if both context and request name a home, they must match.
  if (context.homeId && request.homeId && context.homeId !== request.homeId) {
    if (context.role !== "ri" && context.role !== "hr_admin") {
      return { allowed: false, reason: "User home does not match record home" };
    }
  }

  return { allowed: true };
}
