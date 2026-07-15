// ══════════════════════════════════════════════════════════════════════════════
// CARA — REAL ABAC UserContext (the enforcing prerequisite)
//
// The ABAC engine decides on attributes: is this person on shift, still
// employed, suspended, under investigation, this child's key worker? Until now
// the only context builder (abac-shadow's minimalContext) HARDCODED every one
// of those to the permissive value — shiftActive: true, employmentStatus:
// "active", isSuspended/isLeaver/isUnderInvestigation: false, assignedChildIds:
// []. Deliberately, so the advisory check could never deny a legitimate caller.
//
// The consequence is worth stating plainly: with a fictional context the engine
// CANNOT deny on the attributes it exists to check, so "flipping ABAC to
// enforcing" would have enforced almost nothing while announcing that it did —
// the most dangerous kind of security control.
//
// This builds the context from what the home actually records. Every signal is
// read from a real collection; anything the platform does not record is left
// empty rather than invented (see NOT MODELLED below).
//
// PURE apart from the store read; deterministic given (store, now). Advisory
// still — this changes what the shadow KNOWS, not what it enforces.
// ══════════════════════════════════════════════════════════════════════════════

import { db, getStore } from "@/lib/db/store";
import { toAbacRole } from "./role-reconciliation";
import type { EmploymentStatus as AbacEmploymentStatus, UserContext } from "./types";

/**
 * Reconcile the app's employment vocabulary with the ABAC engine's — the two
 * were written apart and never agreed a shared list:
 *
 *   app  : active | probation | suspended | notice_period | left
 *   ABAC : candidate | active | bank | agency | suspended | long_term_absent
 *          | under_investigation | leaver | archived
 *
 * probation/notice_period are still *employed and working* → active.
 * left → leaver (same meaning, different word — the mismatch that would have
 * silently mapped a departed staff member onto no known status).
 */
export function toAbacEmploymentStatus(
  status: string | null | undefined,
  employmentType?: string | null,
): AbacEmploymentStatus {
  switch ((status ?? "").toLowerCase().trim()) {
    case "suspended": return "suspended";
    case "left": return "leaver";
    case "active":
    case "probation":
    case "notice_period":
      // Agency/bank workers are a distinct ABAC status (tighter ceilings).
      if (employmentType === "agency") return "agency";
      if (employmentType === "bank") return "bank";
      return "active";
    default:
      // Unknown vocabulary must never read as "active" — that is the
      // fail-open direction. Treat as archived (most restrictive).
      return "archived";
  }
}

/** True when the staff member has a shift covering `now`. */
export function isOnShiftNow(staffId: string, now: Date): boolean {
  const store = getStore();
  const date = now.toISOString().slice(0, 10);
  const hhmm = now.toISOString().slice(11, 16);
  return (store.shifts ?? []).some((s) => {
    if (s.staff_id !== staffId) return false;
    if (s.date !== date) return false;
    // Only shifts that are actually being worked — not cancelled/no-show, and
    // not merely "scheduled" weeks out.
    if (s.status !== "in_progress" && s.status !== "confirmed") return false;
    if (!s.start_time || !s.end_time) return false;
    // Overnight shifts wrap past midnight (e.g. 20:00 → 08:00).
    return s.start_time <= s.end_time
      ? hhmm >= s.start_time && hhmm <= s.end_time
      : hhmm >= s.start_time || hhmm <= s.end_time;
  });
}

/** Children this staff member key-works (primary or secondary). */
export function assignedChildIdsFor(staffId: string): string[] {
  const store = getStore();
  return (store.youngPeople ?? [])
    .filter((yp) => yp.key_worker_id === staffId || yp.secondary_worker_id === staffId)
    .map((yp) => yp.id);
}

/** True when an open disciplinary investigation names this staff member. */
export function isUnderInvestigationNow(staffId: string): boolean {
  const store = getStore();
  return (store.staffDisciplinaryRecords ?? []).some(
    (d) => d.staff_member === staffId && (d.stage === "investigation" || d.stage === "dismissal_hearing"),
  );
}

/**
 * Build the ABAC context for a staff member from real records.
 * Returns null when the id resolves to no staff member — the caller decides
 * what an unknown actor means; this never invents one.
 *
 * NOT MODELLED (left empty rather than faked — the platform records no such
 * thing today): delegatedScopes, temporaryGrants, safeguardingNeedToKnow.
 * They stay [] so the engine simply finds no grant from those sources.
 */
export function buildUserContext(staffId: string, now: Date = new Date()): UserContext | null {
  const staff = db.staff.findById(staffId);
  if (!staff) return null;

  const employmentStatus = toAbacEmploymentStatus(staff.employment_status, staff.employment_type);

  return {
    userId: staff.id,
    role: toAbacRole(staff.role),
    organisationId: "org",
    homeIds: staff.home_id ? [staff.home_id] : [],
    assignedChildIds: assignedChildIdsFor(staff.id),
    assignedStaffIds: [],
    employmentStatus,
    shiftActive: isOnShiftNow(staff.id, now),
    isAgencyStaff: staff.employment_type === "agency",
    isSuspended: employmentStatus === "suspended",
    isLeaver: employmentStatus === "leaver" || staff.is_active === false,
    isUnderInvestigation: isUnderInvestigationNow(staff.id),
    delegatedScopes: [],
    temporaryGrants: [],
    safeguardingNeedToKnow: [],
  };
}
