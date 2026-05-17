// ══════════════════════════════════════════════════════════════════════════════
// Tests — Cornerstone Access Decision Service
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkAccess, canAccess, getAllowedActions } from "../access-decision-service";
import type { UserContext, Role, AccessCheckRequest } from "../types";

const FIXED_NOW = "2026-05-16T12:00:00Z";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(FIXED_NOW)); });
afterEach(() => { vi.useRealTimers(); });

// ── Helpers ────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<UserContext> = {}): UserContext {
  return {
    userId: "user_1",
    role: "rsw",
    organisationId: "org_1",
    homeIds: ["home_1"],
    assignedChildIds: ["child_1", "child_2"],
    assignedStaffIds: [],
    employmentStatus: "active",
    shiftActive: true,
    isAgencyStaff: false,
    isSuspended: false,
    isLeaver: false,
    isUnderInvestigation: false,
    delegatedScopes: [],
    temporaryGrants: [],
    safeguardingNeedToKnow: [],
    ...overrides,
  };
}

function makeManager(overrides: Partial<UserContext> = {}): UserContext {
  return makeUser({
    userId: "manager_1",
    role: "registered_manager",
    assignedChildIds: [],
    assignedStaffIds: ["user_1", "user_2"],
    ...overrides,
  });
}

function makeDeputy(overrides: Partial<UserContext> = {}): UserContext {
  return makeUser({
    userId: "deputy_1",
    role: "deputy_manager",
    ...overrides,
  });
}

function makeTeamLeader(overrides: Partial<UserContext> = {}): UserContext {
  return makeUser({
    userId: "tl_1",
    role: "team_leader",
    ...overrides,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// EMPLOYMENT STATUS BLOCKS
// ══════════════════════════════════════════════════════════════════════════════

describe("Employment status blocks", () => {
  it("blocks suspended users from all access", () => {
    const user = makeUser({ employmentStatus: "suspended", isSuspended: true });
    const result = checkAccess({ user, resourceType: "dashboard", action: "view" });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("suspended");
  });

  it("blocks leavers from all access", () => {
    const user = makeUser({ employmentStatus: "leaver", isLeaver: true });
    const result = checkAccess({ user, resourceType: "child_record", action: "view" });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("leaver");
  });

  it("blocks archived users from all access", () => {
    const user = makeUser({ employmentStatus: "archived" });
    const result = checkAccess({ user, resourceType: "dashboard", action: "view" });
    expect(result.allowed).toBe(false);
  });

  it("restricts under_investigation to dashboard only", () => {
    const user = makeUser({ employmentStatus: "under_investigation", isUnderInvestigation: true });
    const dashResult = checkAccess({ user, resourceType: "dashboard", action: "view" });
    expect(dashResult.allowed).toBe(true);

    const childResult = checkAccess({ user, resourceType: "child_record", action: "view" });
    expect(childResult.allowed).toBe(false);
  });

  it("restricts candidates to dashboard only", () => {
    const user = makeUser({ employmentStatus: "candidate" });
    const dashResult = checkAccess({ user, resourceType: "dashboard", action: "view" });
    expect(dashResult.allowed).toBe(true);

    const childResult = checkAccess({ user, resourceType: "child_record", action: "view" });
    expect(childResult.allowed).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// RSW CANNOT ACCESS RESTRICTED AREAS
// ══════════════════════════════════════════════════════════════════════════════

describe("RSW access restrictions", () => {
  const rsw = makeUser({ role: "rsw" });

  it("RSW cannot view manager dashboard (control centre)", () => {
    const result = checkAccess({ user: rsw, resourceType: "control_centre", action: "view" });
    expect(result.allowed).toBe(false);
  });

  it("RSW cannot view HR files", () => {
    const result = checkAccess({ user: rsw, resourceType: "hr_file", action: "view" });
    expect(result.allowed).toBe(false);
  });

  it("RSW cannot view safer recruitment", () => {
    const result = checkAccess({ user: rsw, resourceType: "safer_recruitment", action: "view" });
    expect(result.allowed).toBe(false);
  });

  it("RSW cannot access inspection mode", () => {
    const result = checkAccess({ user: rsw, resourceType: "inspection_mode", action: "view" });
    expect(result.allowed).toBe(false);
  });

  it("RSW cannot view audit logs", () => {
    const result = checkAccess({ user: rsw, resourceType: "audit_log", action: "view" });
    expect(result.allowed).toBe(false);
  });

  it("RSW cannot access permission settings", () => {
    const result = checkAccess({ user: rsw, resourceType: "permission_settings", action: "view" });
    expect(result.allowed).toBe(false);
  });

  it("RSW cannot approve tasks", () => {
    const result = checkAccess({ user: rsw, resourceType: "approval_queue", action: "approve" });
    expect(result.allowed).toBe(false);
  });

  it("RSW CAN view their dashboard", () => {
    const result = checkAccess({ user: rsw, resourceType: "dashboard", action: "view" });
    expect(result.allowed).toBe(true);
  });

  it("RSW CAN view assigned child records in their home", () => {
    const result = checkAccess({
      user: rsw,
      resourceType: "child_record",
      action: "view",
      resourceHomeId: "home_1",
      resourceChildId: "child_1",
    });
    expect(result.allowed).toBe(true);
  });

  it("RSW CANNOT view child records in other homes", () => {
    const result = checkAccess({
      user: rsw,
      resourceType: "child_record",
      action: "view",
      resourceHomeId: "home_2",
      resourceChildId: "child_1",
    });
    expect(result.allowed).toBe(false);
  });

  it("RSW CANNOT view unassigned child records", () => {
    const result = checkAccess({
      user: rsw,
      resourceType: "child_record",
      action: "view",
      resourceHomeId: "home_1",
      resourceChildId: "child_99", // not assigned
    });
    expect(result.allowed).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TEAM LEADER ACCESS
// ══════════════════════════════════════════════════════════════════════════════

describe("Team Leader access", () => {
  const tl = makeTeamLeader();

  it("Team Leader can check Level 1 tasks", () => {
    const result = checkAccess({
      user: tl,
      resourceType: "approval_queue",
      action: "check",
      resourceApprovalLevel: 1,
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(true);
  });

  it("Team Leader cannot approve Level 2 tasks", () => {
    const result = checkAccess({
      user: tl,
      resourceType: "approval_queue",
      action: "approve",
      resourceApprovalLevel: 2,
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(false);
  });

  it("Team Leader cannot view HR files", () => {
    const result = checkAccess({ user: tl, resourceType: "hr_file", action: "view" });
    expect(result.allowed).toBe(false);
  });

  it("Team Leader cannot view safer recruitment", () => {
    const result = checkAccess({ user: tl, resourceType: "safer_recruitment", action: "view" });
    expect(result.allowed).toBe(false);
  });

  it("Team Leader can check child records in their home", () => {
    const result = checkAccess({
      user: tl,
      resourceType: "child_record",
      action: "check",
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(true);
  });

  it("Team Leader can view QA in their home", () => {
    const result = checkAccess({
      user: tl,
      resourceType: "quality_assurance",
      action: "view",
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DEPUTY MANAGER ACCESS
// ══════════════════════════════════════════════════════════════════════════════

describe("Deputy Manager access", () => {
  const deputy = makeDeputy();

  it("Deputy can approve Level 2 tasks", () => {
    const result = checkAccess({
      user: deputy,
      resourceType: "approval_queue",
      action: "approve",
      resourceApprovalLevel: 2,
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(true);
  });

  it("Deputy cannot approve Level 3 tasks", () => {
    const result = checkAccess({
      user: deputy,
      resourceType: "approval_queue",
      action: "approve",
      resourceApprovalLevel: 3,
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(false);
  });

  it("Deputy can view safer recruitment (restricted)", () => {
    const result = checkAccess({
      user: deputy,
      resourceType: "safer_recruitment",
      action: "view",
      resourceSensitivity: "restricted",
    });
    expect(result.allowed).toBe(true);
  });

  it("Deputy cannot create safer recruitment", () => {
    const result = checkAccess({
      user: deputy,
      resourceType: "safer_recruitment",
      action: "create",
    });
    expect(result.allowed).toBe(false);
  });

  it("Deputy can QA sample", () => {
    const result = checkAccess({
      user: deputy,
      resourceType: "quality_assurance",
      action: "qa_sample",
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// REGISTERED MANAGER ACCESS
// ══════════════════════════════════════════════════════════════════════════════

describe("Registered Manager access", () => {
  const manager = makeManager();

  it("Manager can approve Level 3 tasks", () => {
    const result = checkAccess({
      user: manager,
      resourceType: "approval_queue",
      action: "approve",
      resourceApprovalLevel: 3,
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(true);
  });

  it("Manager cannot approve Level 4 tasks", () => {
    const result = checkAccess({
      user: manager,
      resourceType: "approval_queue",
      action: "approve",
      resourceApprovalLevel: 4,
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(false);
  });

  it("Manager can access Control Centre", () => {
    const result = checkAccess({ user: manager, resourceType: "control_centre", action: "view" });
    expect(result.allowed).toBe(true);
  });

  it("Manager can access HR files", () => {
    const result = checkAccess({ user: manager, resourceType: "hr_file", action: "view" });
    expect(result.allowed).toBe(true);
  });

  it("Manager can access safer recruitment", () => {
    const result = checkAccess({ user: manager, resourceType: "safer_recruitment", action: "approve" });
    expect(result.allowed).toBe(true);
  });

  it("Manager can access inspection mode", () => {
    const result = checkAccess({ user: manager, resourceType: "inspection_mode", action: "view" });
    expect(result.allowed).toBe(true);
  });

  it("Manager can view audit logs for their home", () => {
    const result = checkAccess({
      user: manager,
      resourceType: "audit_log",
      action: "view",
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(true);
  });

  it("Manager cannot view audit logs for other homes", () => {
    const result = checkAccess({
      user: manager,
      resourceType: "audit_log",
      action: "view",
      resourceHomeId: "home_2",
    });
    expect(result.allowed).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// RI / OPS ACCESS
// ══════════════════════════════════════════════════════════════════════════════

describe("RI/Ops access", () => {
  const ri = makeUser({ userId: "ri_1", role: "responsible_individual", homeIds: ["home_1", "home_2", "home_3"] });

  it("RI can approve Level 4 tasks", () => {
    const result = checkAccess({
      user: ri,
      resourceType: "approval_queue",
      action: "approve",
      resourceApprovalLevel: 4,
    });
    expect(result.allowed).toBe(true);
  });

  it("RI can access all homes' audit logs", () => {
    const result = checkAccess({ user: ri, resourceType: "audit_log", action: "view" });
    expect(result.allowed).toBe(true);
  });

  it("RI can export evidence packs", () => {
    const result = checkAccess({ user: ri, resourceType: "inspection_mode", action: "export" });
    expect(result.allowed).toBe(true);
  });

  it("RI can view HR files", () => {
    const result = checkAccess({ user: ri, resourceType: "hr_file", action: "view" });
    expect(result.allowed).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SELF-APPROVAL BLOCKING
// ══════════════════════════════════════════════════════════════════════════════

describe("Self-approval blocking", () => {
  it("RSW cannot self-approve", () => {
    const rsw = makeUser();
    const result = checkAccess({
      user: rsw,
      resourceType: "approval_queue",
      action: "approve",
      resourceCreatedBy: rsw.userId,
      resourceApprovalLevel: 1,
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(false);
  });

  it("Deputy cannot self-approve Level 2", () => {
    const deputy = makeDeputy();
    const result = checkAccess({
      user: deputy,
      resourceType: "approval_queue",
      action: "approve",
      resourceCreatedBy: deputy.userId,
      resourceApprovalLevel: 2,
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(false);
  });

  it("Manager cannot self-approve Level 3", () => {
    const manager = makeManager();
    const result = checkAccess({
      user: manager,
      resourceType: "approval_queue",
      action: "approve",
      resourceCreatedBy: manager.userId,
      resourceApprovalLevel: 3,
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("self-approve");
  });

  it("Manager CAN approve another person's Level 3 work", () => {
    const manager = makeManager();
    const result = checkAccess({
      user: manager,
      resourceType: "approval_queue",
      action: "approve",
      resourceCreatedBy: "other_user",
      resourceApprovalLevel: 3,
      resourceHomeId: "home_1",
    });
    expect(result.allowed).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AGENCY STAFF
// ══════════════════════════════════════════════════════════════════════════════

describe("Agency staff access", () => {
  const agency = makeUser({
    role: "agency_staff",
    isAgencyStaff: true,
    employmentStatus: "agency",
    shiftActive: true,
  });

  it("Agency staff can view child records when on shift", () => {
    const result = checkAccess({
      user: agency,
      resourceType: "child_record",
      action: "view",
      resourceHomeId: "home_1",
      resourceChildId: "child_1",
    });
    expect(result.allowed).toBe(true);
  });

  it("Agency staff CANNOT view child records off shift", () => {
    const offShift = { ...agency, shiftActive: false };
    const result = checkAccess({
      user: offShift,
      resourceType: "child_record",
      action: "view",
      resourceHomeId: "home_1",
      resourceChildId: "child_1",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("shift");
  });

  it("Agency staff cannot access HR files", () => {
    const result = checkAccess({ user: agency, resourceType: "hr_file", action: "view" });
    expect(result.allowed).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TEMPORARY GRANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Temporary grants", () => {
  it("allows access via active temporary grant", () => {
    const user = makeUser({
      temporaryGrants: [{
        id: "grant_1",
        resourceType: "hr_file",
        actions: ["view"],
        grantedBy: "manager_1",
        grantedAt: "2026-05-16T10:00:00Z",
        expiresAt: "2026-05-16T18:00:00Z",
        reason: "supervision preparation",
        status: "active",
      }],
    });
    const result = checkAccess({ user, resourceType: "hr_file", action: "view" });
    expect(result.allowed).toBe(true);
    expect(result.grantSource).toBe("temporary_grant");
    expect(result.auditEventRequired).toBe(true);
  });

  it("denies access via expired temporary grant", () => {
    const user = makeUser({
      temporaryGrants: [{
        id: "grant_1",
        resourceType: "hr_file",
        actions: ["view"],
        grantedBy: "manager_1",
        grantedAt: "2026-05-15T10:00:00Z",
        expiresAt: "2026-05-15T18:00:00Z", // expired yesterday
        reason: "supervision preparation",
        status: "active",
      }],
    });
    const result = checkAccess({ user, resourceType: "hr_file", action: "view" });
    expect(result.allowed).toBe(false);
  });

  it("denies access via revoked temporary grant", () => {
    const user = makeUser({
      temporaryGrants: [{
        id: "grant_1",
        resourceType: "hr_file",
        actions: ["view"],
        grantedBy: "manager_1",
        grantedAt: "2026-05-16T10:00:00Z",
        expiresAt: "2026-05-16T18:00:00Z",
        reason: "supervision preparation",
        status: "revoked",
      }],
    });
    const result = checkAccess({ user, resourceType: "hr_file", action: "view" });
    expect(result.allowed).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELEGATED SCOPES
// ══════════════════════════════════════════════════════════════════════════════

describe("Delegated scopes", () => {
  it("allows access via delegation", () => {
    const user = makeUser({
      role: "team_leader",
      delegatedScopes: [{
        resourceType: "hr_file",
        actions: ["view"],
        grantedBy: "manager_1",
        grantedAt: "2026-05-01T10:00:00Z",
        reason: "Supervision lead delegation",
      }],
    });
    const result = checkAccess({ user, resourceType: "hr_file", action: "view" });
    expect(result.allowed).toBe(true);
    expect(result.grantSource).toBe("delegation");
  });

  it("delegation does not grant unspecified actions", () => {
    const user = makeUser({
      role: "team_leader",
      delegatedScopes: [{
        resourceType: "hr_file",
        actions: ["view"],
        grantedBy: "manager_1",
        grantedAt: "2026-05-01T10:00:00Z",
        reason: "Supervision lead delegation",
      }],
    });
    const result = checkAccess({ user, resourceType: "hr_file", action: "edit" });
    expect(result.allowed).toBe(false);
  });

  it("expired delegation does not grant access", () => {
    const user = makeUser({
      role: "team_leader",
      delegatedScopes: [{
        resourceType: "hr_file",
        actions: ["view"],
        grantedBy: "manager_1",
        grantedAt: "2026-05-01T10:00:00Z",
        expiresAt: "2026-05-10T10:00:00Z", // expired
        reason: "Temp delegation",
      }],
    });
    const result = checkAccess({ user, resourceType: "hr_file", action: "view" });
    expect(result.allowed).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SENSITIVITY LEVELS
// ══════════════════════════════════════════════════════════════════════════════

describe("Sensitivity enforcement", () => {
  it("RSW can view internal sensitivity child records", () => {
    const rsw = makeUser();
    const result = checkAccess({
      user: rsw,
      resourceType: "child_record",
      action: "view",
      resourceHomeId: "home_1",
      resourceChildId: "child_1",
      resourceSensitivity: "internal",
    });
    expect(result.allowed).toBe(true);
  });

  it("RSW cannot view confidential child records", () => {
    const rsw = makeUser();
    const result = checkAccess({
      user: rsw,
      resourceType: "child_record",
      action: "view",
      resourceHomeId: "home_1",
      resourceChildId: "child_1",
      resourceSensitivity: "confidential",
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("sensitivity");
  });

  it("Deputy can view confidential child records", () => {
    const deputy = makeDeputy();
    const result = checkAccess({
      user: deputy,
      resourceType: "child_record",
      action: "view",
      resourceHomeId: "home_1",
      resourceChildId: "child_1",
      resourceSensitivity: "confidential",
    });
    expect(result.allowed).toBe(true);
  });

  it("RSW Aria access limited to internal sensitivity", () => {
    const rsw = makeUser();
    const result = checkAccess({
      user: rsw,
      resourceType: "aria_intelligence",
      action: "view",
      resourceHomeId: "home_1",
      resourceSensitivity: "restricted",
    });
    expect(result.allowed).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("canAccess shorthand", () => {
  it("returns boolean", () => {
    const rsw = makeUser();
    expect(canAccess(rsw, "dashboard", "view")).toBe(true);
    expect(canAccess(rsw, "hr_file", "view")).toBe(false);
  });
});

describe("getAllowedActions", () => {
  it("returns all actions a user can perform on a resource", () => {
    const manager = makeManager();
    const actions = getAllowedActions(manager, "child_record", { resourceHomeId: "home_1" });
    expect(actions).toContain("view");
    expect(actions).toContain("create");
    expect(actions).toContain("approve");
    expect(actions).toContain("export");
    expect(actions).not.toContain("break_glass");
  });

  it("returns empty for completely restricted resource", () => {
    const rsw = makeUser();
    const actions = getAllowedActions(rsw, "hr_file");
    expect(actions).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DECISION METADATA
// ══════════════════════════════════════════════════════════════════════════════

describe("AccessDecision metadata", () => {
  it("includes user-facing explanation on deny", () => {
    const rsw = makeUser();
    const result = checkAccess({ user: rsw, resourceType: "hr_file", action: "view" });
    expect(result.userFacingExplanation).toBeTruthy();
    expect(result.userFacingExplanation.length).toBeGreaterThan(5);
  });

  it("includes manager-facing explanation on deny", () => {
    const rsw = makeUser();
    const result = checkAccess({ user: rsw, resourceType: "hr_file", action: "view" });
    expect(result.managerFacingExplanation).toBeTruthy();
    expect(result.managerFacingExplanation).toContain("rsw");
  });

  it("marks audit event required on deny", () => {
    const rsw = makeUser();
    const result = checkAccess({ user: rsw, resourceType: "hr_file", action: "view" });
    expect(result.auditEventRequired).toBe(true);
  });

  it("marks audit event required for temporary grant access", () => {
    const user = makeUser({
      temporaryGrants: [{
        id: "g1",
        resourceType: "hr_file",
        actions: ["view"],
        grantedBy: "m1",
        grantedAt: "2026-05-16T10:00:00Z",
        expiresAt: "2026-05-16T18:00:00Z",
        reason: "test",
        status: "active",
      }],
    });
    const result = checkAccess({ user, resourceType: "hr_file", action: "view" });
    expect(result.auditEventRequired).toBe(true);
  });

  it("does not require audit for normal role-based allow", () => {
    const rsw = makeUser();
    const result = checkAccess({ user: rsw, resourceType: "dashboard", action: "view" });
    expect(result.auditEventRequired).toBe(false);
  });
});
