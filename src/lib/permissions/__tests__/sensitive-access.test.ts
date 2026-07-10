import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { requireSensitiveAccess, isEmploymentBlocked } from "../sensitive-access";
import { db } from "@/lib/db/store";

// Phase 1 · Module 1 — sensitive-record server-side guard.
const SENSITIVE = [
  PERMISSIONS.VIEW_ALLEGATIONS, PERMISSIONS.MANAGE_ALLEGATIONS,
  PERMISSIONS.VIEW_WHISTLEBLOWING, PERMISSIONS.MANAGE_WHISTLEBLOWING,
  PERMISSIONS.VIEW_DISCIPLINARY, PERMISSIONS.MANAGE_DISCIPLINARY,
  PERMISSIONS.VIEW_STAFF_HR_CONFIDENTIAL, PERMISSIONS.MANAGE_STAFF_HR_CONFIDENTIAL,
] as const;

describe("Phase 1 — sensitive-record permission grants", () => {
  it("leadership + super roles hold every sensitive permission", () => {
    for (const p of SENSITIVE) {
      expect(hasPermission("registered_manager", p)).toBe(true);
      expect(hasPermission("responsible_individual", p)).toBe(true);
      expect(hasPermission("organisation_director", p)).toBe(true);
      expect(hasPermission("super_admin", p)).toBe(true);
    }
  });

  it("general care staff hold NONE of them (default-restricted)", () => {
    for (const p of SENSITIVE) {
      expect(hasPermission("residential_care_worker", p)).toBe(false);
      expect(hasPermission("bank_staff", p)).toBe(false);
      expect(hasPermission("team_leader", p)).toBe(false);
    }
  });

  it("HR sees whistleblowing + disciplinary + HR-confidential, NOT allegations", () => {
    expect(hasPermission("hr_recruitment", PERMISSIONS.VIEW_WHISTLEBLOWING)).toBe(true);
    expect(hasPermission("hr_recruitment", PERMISSIONS.VIEW_DISCIPLINARY)).toBe(true);
    expect(hasPermission("hr_recruitment", PERMISSIONS.VIEW_STAFF_HR_CONFIDENTIAL)).toBe(true);
    expect(hasPermission("hr_recruitment", PERMISSIONS.VIEW_ALLEGATIONS)).toBe(false);
  });

  it("deputy (acting DSL) sees allegations, NOT HR-confidential", () => {
    expect(hasPermission("deputy_manager", PERMISSIONS.VIEW_ALLEGATIONS)).toBe(true);
    expect(hasPermission("deputy_manager", PERMISSIONS.VIEW_DISCIPLINARY)).toBe(false);
    expect(hasPermission("deputy_manager", PERMISSIONS.VIEW_WHISTLEBLOWING)).toBe(false);
    expect(hasPermission("deputy_manager", PERMISSIONS.VIEW_STAFF_HR_CONFIDENTIAL)).toBe(false);
  });
});

describe("Phase 1 — requireSensitiveAccess guard (demo-safe)", () => {
  const req = (userId?: string) =>
    new NextRequest("http://localhost/api/operations/allegation-management", userId ? { headers: { "x-user-id": userId } } : undefined);

  it("allows the demo default identity (a Registered Manager) — demo unchanged", async () => {
    const r = await requireSensitiveAccess(req(), PERMISSIONS.VIEW_ALLEGATIONS, { entityType: "allegation" });
    expect(r).not.toBeInstanceOf(NextResponse);
    if (!(r instanceof NextResponse)) expect(r.role).toBe("registered_manager");
  });

  it("denies a general care worker with 403", async () => {
    const r = await requireSensitiveAccess(req("staff_nobody"), PERMISSIONS.VIEW_ALLEGATIONS, { entityType: "allegation" });
    expect(r).toBeInstanceOf(NextResponse);
    if (r instanceof NextResponse) expect(r.status).toBe(403);
  });
});

// Phase 1 · Module 6 — employment-status lockout (advisory ABAC's one enforced gate).
describe("Phase 1 · Module 6 — isEmploymentBlocked", () => {
  it("blocks suspended / departed states (case-insensitive)", () => {
    for (const s of ["suspended", "left", "leaver", "archived", "dismissed", "terminated", "SUSPENDED", " Left "]) {
      expect(isEmploymentBlocked(s)).toBe(true);
    }
  });
  it("allows active / in-post states and unknown/empty", () => {
    for (const s of ["active", "probation", "notice_period", "", undefined, null]) {
      expect(isEmploymentBlocked(s)).toBe(false);
    }
  });
});

describe("Phase 1 · Module 6 — employment lockout in requireSensitiveAccess", () => {
  const req = (userId: string) =>
    new NextRequest("http://localhost/api/operations/allegation-management", { headers: { "x-user-id": userId } });

  it("denies a SUSPENDED manager (holds the role permission, but employment-blocked) with 403", async () => {
    const suspended = { id: "staff_suspended_test", role: "registered_manager", employment_status: "suspended", is_active: false };
    // The flat check passes (registered_manager holds VIEW_ALLEGATIONS); only the
    // employment lockout should stop them — proving it enforces, not the role gate.
    expect(hasPermission("registered_manager", PERMISSIONS.VIEW_ALLEGATIONS)).toBe(true);
    (db.staff.findAll() as unknown as Array<Record<string, unknown>>).push(suspended);
    try {
      const r = await requireSensitiveAccess(req("staff_suspended_test"), PERMISSIONS.VIEW_ALLEGATIONS, { entityType: "allegation" });
      expect(r).toBeInstanceOf(NextResponse);
      if (r instanceof NextResponse) expect(r.status).toBe(403);
    } finally {
      const arr = db.staff.findAll() as unknown as Array<{ id: string }>;
      const i = arr.findIndex((s) => s.id === "staff_suspended_test");
      if (i >= 0) arr.splice(i, 1);
    }
  });

  it("still allows the demo default identity (active Registered Manager) — demo unaffected", async () => {
    const r = await requireSensitiveAccess(
      new NextRequest("http://localhost/api/operations/allegation-management"),
      PERMISSIONS.VIEW_ALLEGATIONS,
      { entityType: "allegation" },
    );
    expect(r).not.toBeInstanceOf(NextResponse);
  });
});
