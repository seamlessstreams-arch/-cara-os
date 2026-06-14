// ══════════════════════════════════════════════════════════════════════════════
// Tests: Permissions Engine — RBAC, hierarchy, form/task action guards
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  hasOpsPermission,
  isRoleAtLeast,
  getPermissionSet,
  hasAllPermissions,
  hasAnyPermission,
  canPerformFormAction,
  getAvailableFormActions,
  canPerformTaskAction,
  getAvailableTaskActions,
  PERM,
  _testing,
} from "@/lib/permissions-engine";

const { ROLE_HIERARCHY, ROLE_PERMISSIONS, CARE_WORKER_PERMS, ALL_PERMS } = _testing;

describe("Permissions Engine", () => {
  // ── Role hierarchy ──────────────────────────────────────────────────────
  describe("ROLE_HIERARCHY", () => {
    it("has all system roles", () => {
      expect(Object.keys(ROLE_HIERARCHY).length).toBeGreaterThanOrEqual(12);
    });

    it("super_admin is highest", () => {
      expect(ROLE_HIERARCHY.super_admin).toBe(100);
    });

    it("bank_staff is lowest operational role", () => {
      expect(ROLE_HIERARCHY.bank_staff).toBe(10);
    });

    it("manager outranks deputy", () => {
      expect(ROLE_HIERARCHY.registered_manager).toBeGreaterThan(ROLE_HIERARCHY.deputy_manager);
    });

    it("deputy outranks team leader", () => {
      expect(ROLE_HIERARCHY.deputy_manager).toBeGreaterThan(ROLE_HIERARCHY.team_leader);
    });
  });

  // ── isRoleAtLeast ───────────────────────────────────────────────────────
  describe("isRoleAtLeast", () => {
    it("manager is at least team_leader", () => {
      expect(isRoleAtLeast("registered_manager", "team_leader")).toBe(true);
    });

    it("care worker is not at least deputy", () => {
      expect(isRoleAtLeast("residential_care_worker", "deputy_manager")).toBe(false);
    });

    it("role is at least itself", () => {
      expect(isRoleAtLeast("team_leader", "team_leader")).toBe(true);
    });

    it("super_admin is at least everything", () => {
      for (const role of Object.keys(ROLE_HIERARCHY)) {
        expect(isRoleAtLeast("super_admin", role as keyof typeof ROLE_HIERARCHY)).toBe(true);
      }
    });
  });

  // ── hasOpsPermission ────────────────────────────────────────────────────
  describe("hasOpsPermission", () => {
    it("super_admin has all permissions", () => {
      for (const perm of ALL_PERMS) {
        expect(hasOpsPermission("super_admin", perm)).toBe(true);
      }
    });

    it("care worker can view young people", () => {
      expect(hasOpsPermission("residential_care_worker", PERM.YP_VIEW)).toBe(true);
    });

    it("care worker cannot design forms", () => {
      expect(hasOpsPermission("residential_care_worker", PERM.FORM_DESIGN)).toBe(false);
    });

    it("care worker cannot manage roles", () => {
      expect(hasOpsPermission("residential_care_worker", PERM.ADMIN_ROLES)).toBe(false);
    });

    it("team leader can assign tasks", () => {
      expect(hasOpsPermission("team_leader", PERM.TASK_ASSIGN)).toBe(true);
    });

    it("deputy can approve forms", () => {
      expect(hasOpsPermission("deputy_manager", PERM.FORM_APPROVE)).toBe(true);
    });

    it("bank staff has minimal permissions", () => {
      expect(hasOpsPermission("bank_staff", PERM.YP_VIEW)).toBe(true);
      expect(hasOpsPermission("bank_staff", PERM.YP_EDIT)).toBe(false);
      expect(hasOpsPermission("bank_staff", PERM.ADMIN_ROLES)).toBe(false);
    });

    it("auditor can view audit trail", () => {
      expect(hasOpsPermission("auditor", PERM.ADMIN_AUDIT)).toBe(true);
    });

    it("auditor cannot create incidents", () => {
      expect(hasOpsPermission("auditor", PERM.INCIDENT_CREATE)).toBe(false);
    });
  });

  // ── getPermissionSet / hasAll / hasAny ─────────────────────────────────
  describe("getPermissionSet", () => {
    it("returns a Set", () => {
      const set = getPermissionSet("registered_manager");
      expect(set).toBeInstanceOf(Set);
      expect(set.size).toBeGreaterThan(0);
    });
  });

  describe("hasAllPermissions", () => {
    it("manager has all incident permissions", () => {
      expect(hasAllPermissions("registered_manager", [
        PERM.INCIDENT_VIEW, PERM.INCIDENT_CREATE, PERM.INCIDENT_EDIT,
        PERM.INCIDENT_OVERSIGHT, PERM.INCIDENT_CLOSE,
      ])).toBe(true);
    });

    it("care worker does not have all incident permissions", () => {
      expect(hasAllPermissions("residential_care_worker", [
        PERM.INCIDENT_VIEW, PERM.INCIDENT_OVERSIGHT,
      ])).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("care worker has at least one log permission", () => {
      expect(hasAnyPermission("residential_care_worker", [
        PERM.LOG_VIEW, PERM.LOG_CREATE, PERM.LOG_EDIT,
      ])).toBe(true);
    });

    it("external partner has no admin permissions", () => {
      expect(hasAnyPermission("external_partner", [
        PERM.ADMIN_ROLES, PERM.ADMIN_SETTINGS, PERM.ADMIN_EXPORT,
      ])).toBe(false);
    });
  });

  // ── Form action guards ────────────────────────────────────────────────
  describe("canPerformFormAction", () => {
    it("care worker can view and submit forms", () => {
      expect(canPerformFormAction("residential_care_worker", "view")).toBe(true);
      expect(canPerformFormAction("residential_care_worker", "submit")).toBe(true);
    });

    it("care worker cannot approve forms", () => {
      expect(canPerformFormAction("residential_care_worker", "approve")).toBe(false);
    });

    it("deputy can approve and design forms", () => {
      expect(canPerformFormAction("deputy_manager", "approve")).toBe(true);
      expect(canPerformFormAction("deputy_manager", "design")).toBe(true);
    });
  });

  describe("getAvailableFormActions", () => {
    it("draft form: care worker can edit and submit", () => {
      const actions = getAvailableFormActions("residential_care_worker", "draft");
      expect(actions).toContain("view");
      expect(actions).toContain("edit");
      expect(actions).toContain("submit");
    });

    it("submitted form: team leader can review", () => {
      const actions = getAvailableFormActions("team_leader", "submitted");
      expect(actions).toContain("review");
    });

    it("submitted form: deputy can approve", () => {
      const actions = getAvailableFormActions("deputy_manager", "submitted");
      expect(actions).toContain("approve");
    });

    it("approved form: only view", () => {
      const actions = getAvailableFormActions("registered_manager", "approved");
      expect(actions).toEqual(["view"]);
    });

    it("changes_requested: can re-edit and re-submit", () => {
      const actions = getAvailableFormActions("residential_care_worker", "changes_requested");
      expect(actions).toContain("edit");
      expect(actions).toContain("submit");
    });
  });

  // ── Task action guards ────────────────────────────────────────────────
  describe("canPerformTaskAction", () => {
    it("care worker can view and create tasks", () => {
      expect(canPerformTaskAction("residential_care_worker", "view")).toBe(true);
      expect(canPerformTaskAction("residential_care_worker", "create")).toBe(true);
    });

    it("care worker cannot sign off tasks", () => {
      expect(canPerformTaskAction("residential_care_worker", "sign_off")).toBe(false);
    });

    it("deputy can sign off tasks", () => {
      expect(canPerformTaskAction("deputy_manager", "sign_off")).toBe(true);
    });
  });

  describe("getAvailableTaskActions", () => {
    it("not_started task: can edit, assign, start", () => {
      const actions = getAvailableTaskActions("team_leader", "not_started");
      expect(actions).toContain("view");
      expect(actions).toContain("edit");
      expect(actions).toContain("assign");
    });

    it("in_progress: assigned user can complete", () => {
      const actions = getAvailableTaskActions("residential_care_worker", "in_progress", true);
      expect(actions).toContain("complete");
    });

    it("awaiting_sign_off: deputy can sign off", () => {
      const actions = getAvailableTaskActions("deputy_manager", "awaiting_sign_off");
      expect(actions).toContain("sign_off");
    });

    it("completed: read-only", () => {
      const actions = getAvailableTaskActions("registered_manager", "completed");
      expect(actions).toContain("view");
      expect(actions).not.toContain("edit");
      expect(actions).not.toContain("assign");
    });
  });

  // ── Permission coverage ───────────────────────────────────────────────
  describe("permission coverage", () => {
    it("PERM has 50+ permission codes", () => {
      expect(Object.keys(PERM).length).toBeGreaterThanOrEqual(50);
    });

    it("all PERM values are unique", () => {
      const values = Object.values(PERM);
      expect(new Set(values).size).toBe(values.length);
    });

    it("all roles have at least some permissions", () => {
      for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
        expect(perms.length).toBeGreaterThan(0);
      }
    });

    it("higher roles have more permissions than lower roles", () => {
      expect(ROLE_PERMISSIONS.registered_manager.length).toBeGreaterThan(ROLE_PERMISSIONS.team_leader.length);
      expect(ROLE_PERMISSIONS.team_leader.length).toBeGreaterThan(ROLE_PERMISSIONS.residential_care_worker.length);
      expect(ROLE_PERMISSIONS.residential_care_worker.length).toBeGreaterThan(ROLE_PERMISSIONS.bank_staff.length);
    });
  });
});
