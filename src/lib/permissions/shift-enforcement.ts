// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Permission System — Shift-Based Access (Phase 4)
//
// Makes the permission engine's `shiftActive` reflect REAL on-shift state (the
// signal Phase 3's Smart Sign-In now keeps current), so general care staff lose
// access to operational child-facing records when they are NOT on shift — while
// managers and senior leaders keep full access off shift (per the brief).
//
// FEATURE-FLAGGED, DEFAULT OFF. With the flag off, computeShiftActive() always
// returns true → the engine's existing `requiresShift` gate never fires → ZERO
// behaviour change. Flip SHIFT_BASED_ACCESS_ENFORCED=true (server env) to enforce.
// A non-mutating `preview` mode lets the UI show what WOULD change before enabling.
//
// This REUSES the existing engine (checkAccess + role rules) — it does not create a
// parallel permission system. It only (a) computes shiftActive honestly and (b) adds
// requiresShift to the operational general-staff rules (in role-rules.ts).
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { isStaffOnShift } from "@/lib/attendance/sign-in-service";
import { checkAccess } from "./access-decision-service";
import type { Role, ResourceType, Action, UserContext, EmploymentStatus } from "./types";

/** Roles whose OPERATIONAL access is shift-gated. Everyone else keeps off-shift access. */
export const SHIFT_GATED_ROLES: ReadonlySet<Role> = new Set<Role>([
  "rsw",
  "senior_rsw",
  "waking_night",
  "agency_staff",
]);

/** Whether a role keeps full access while off shift (managers + senior leaders + admin). */
export function keepsOffShiftAccess(role: Role): boolean {
  return !SHIFT_GATED_ROLES.has(role);
}

/**
 * Server-side master switch. Now ENABLED by default (the pilot is over) — general
 * staff lose operational access off shift, managers/senior leaders keep it. Set
 * `SHIFT_BASED_ACCESS_ENFORCED=false` to disable (kill-switch for incident response).
 */
export function isShiftEnforcementEnabled(): boolean {
  return process.env.SHIFT_BASED_ACCESS_ENFORCED !== "false";
}

/**
 * The app's staff records use `SystemRole` strings (e.g. "residential_care_worker")
 * while the permission engine uses `Role` (e.g. "rsw"). Map between them so
 * checkAccess matches a rule — without this, care workers get a "no_rule" denial.
 */
const SYSTEM_TO_PERMISSION_ROLE: Record<string, Role> = {
  // management / senior leaders (keep off-shift access)
  registered_manager: "registered_manager",
  deputy_manager: "deputy_manager",
  team_leader: "team_leader",
  responsible_individual: "responsible_individual",
  operations_manager: "operations_manager",
  provider_owner: "provider_owner",
  super_admin: "super_admin",
  // operational care staff (shift-gated)
  residential_care_worker: "rsw",
  bank_staff: "agency_staff",
  agency_staff: "agency_staff",
  therapist: "senior_rsw",
  // non-care admin / professional (not shift-gated)
  admin: "hr_admin",
  hr_recruitment: "hr_admin",
  hr_admin: "hr_admin",
  finance_operations: "finance_admin",
  finance_admin: "finance_admin",
  external_partner: "external_auditor",
  auditor: "external_auditor",
  external_auditor: "external_auditor",
  reg44_visitor: "reg44_visitor",
  ofsted_readonly_export: "ofsted_readonly_export",
  // already-permission-Role care values pass through
  rsw: "rsw",
  senior_rsw: "senior_rsw",
  waking_night: "waking_night",
};

/** Map a staff SystemRole (or already-a-Role string) to the permission `Role`. */
export function toPermissionRole(role: string | null | undefined): Role {
  return (role && SYSTEM_TO_PERMISSION_ROLE[role]) || "rsw";
}

export interface ShiftComputeOpts {
  /** ISO now (for deterministic tests). */
  now?: string;
  /** Force enforcement logic for DISPLAY ONLY (does not change real access). */
  preview?: boolean;
}

/**
 * The honest `shiftActive` value for a user:
 *   • enforcement off (and not previewing) → true (preserve current behaviour)
 *   • role keeps off-shift access (manager/senior leader/admin) → true
 *   • otherwise → are they actually clocked in right now?
 */
export function computeShiftActive(role: Role, staffId: string, opts: ShiftComputeOpts = {}): boolean {
  const enforced = opts.preview || isShiftEnforcementEnabled();
  if (!enforced) return true;
  if (keepsOffShiftAccess(role)) return true;
  return isStaffOnShift(staffId, opts.now);
}

// ── Build a UserContext for the (demo) current user, reusing the real engine ───

interface StaffRow {
  id: string;
  role?: string;
  home_id?: string;
  employment_status?: string;
}

/**
 * Build a UserContext for a staff member from the in-memory store, with a real
 * shiftActive. Used by the shift-status endpoint so checkAccess() runs against the
 * actual current user (the engine's own getDemoContext is a hard-coded manager).
 */
export function buildShiftAwareUserContext(staffId: string, opts: ShiftComputeOpts = {}): UserContext {
  const staff = (db.staff?.findAll?.() ?? []).find((s: { id: string }) => s.id === staffId) as StaffRow | undefined;
  const role = toPermissionRole(staff?.role);
  const homeId = staff?.home_id ?? "home_oak";
  const assignedChildIds = (db.youngPeople?.findAll?.() ?? [])
    .filter((yp: { key_worker_id?: string | null }) => yp.key_worker_id === staffId)
    .map((yp: { id: string }) => yp.id);

  return {
    userId: staffId,
    role,
    organisationId: "org_default",
    homeIds: [homeId],
    assignedChildIds,
    assignedStaffIds: [],
    employmentStatus: (staff?.employment_status ?? "active") as EmploymentStatus,
    shiftActive: computeShiftActive(role, staffId, opts),
    isAgencyStaff: role === "agency_staff",
    isSuspended: false,
    isLeaver: false,
    isUnderInvestigation: false,
    delegatedScopes: [],
    temporaryGrants: [],
    safeguardingNeedToKnow: assignedChildIds,
  };
}

// ── Shift-sensitive access overview (for the off-shift portal) ────────────────

export interface ShiftSensitiveCheck {
  label: string;
  resourceType: ResourceType;
  action: Action;
}

/**
 * The operational, child-facing capabilities that are shift-gated for general staff.
 * Kept to resources whose rules carry requiresShift, so the overview shows the real
 * on/off-shift difference (not unrelated role denials).
 */
export const SHIFT_SENSITIVE_CHECKS: ShiftSensitiveCheck[] = [
  { label: "View a child's record", resourceType: "child_record", action: "view" },
  { label: "Add to a child's record", resourceType: "child_record", action: "create" },
  { label: "View safeguarding records", resourceType: "safeguarding", action: "view" },
  { label: "Raise a safeguarding concern", resourceType: "safeguarding", action: "create" },
  { label: "Record medication", resourceType: "medication", action: "create" },
  { label: "View incident records", resourceType: "incident", action: "view" },
  { label: "View missing-from-care records", resourceType: "missing_episode", action: "view" },
];

export interface ShiftAccessResourceResult extends ShiftSensitiveCheck {
  allowed: boolean;
  reason: string;
}

export interface ShiftAccessOverview {
  staff_id: string;
  role: Role;
  /** Keeps full access off shift (manager / senior leader / admin). */
  keeps_off_shift_access: boolean;
  on_shift: boolean;
  /** Whether enforcement is actually live (the env flag). */
  enforcement_enabled: boolean;
  /** Whether this overview was computed in preview mode (display-only). */
  preview: boolean;
  resources: ShiftAccessResourceResult[];
  /** Count of the above currently blocked. */
  blocked_count: number;
}

/**
 * Run the REAL permission engine for the shift-sensitive capabilities and report
 * what the user can/can't do. Home is matched and no specific child is passed, so
 * the only gate that varies is the shift check — isolating the shift effect.
 */
export function buildShiftAccessOverview(staffId: string, opts: ShiftComputeOpts = {}): ShiftAccessOverview {
  const ctx = buildShiftAwareUserContext(staffId, opts);
  const homeId = ctx.homeIds[0];

  const resources: ShiftAccessResourceResult[] = SHIFT_SENSITIVE_CHECKS.map((c) => {
    const decision = checkAccess({
      user: ctx,
      resourceType: c.resourceType,
      action: c.action,
      resourceHomeId: homeId,
      now: opts.now,
    });
    return { ...c, allowed: decision.allowed, reason: decision.reason };
  });

  return {
    staff_id: staffId,
    role: ctx.role,
    keeps_off_shift_access: keepsOffShiftAccess(ctx.role),
    on_shift: isStaffOnShift(staffId, opts.now),
    enforcement_enabled: isShiftEnforcementEnabled(),
    preview: !!opts.preview,
    resources,
    blocked_count: resources.filter((r) => !r.allowed).length,
  };
}
