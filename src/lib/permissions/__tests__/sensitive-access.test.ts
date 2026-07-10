import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { requireSensitiveAccess } from "../sensitive-access";

// Phase 1 · Module 1 — sensitive-record server-side guard.
const SENSITIVE = [
  PERMISSIONS.VIEW_ALLEGATIONS, PERMISSIONS.MANAGE_ALLEGATIONS,
  PERMISSIONS.VIEW_WHISTLEBLOWING, PERMISSIONS.MANAGE_WHISTLEBLOWING,
  PERMISSIONS.VIEW_DISCIPLINARY, PERMISSIONS.MANAGE_DISCIPLINARY,
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

  it("HR sees whistleblowing + disciplinary, NOT allegations", () => {
    expect(hasPermission("hr_recruitment", PERMISSIONS.VIEW_WHISTLEBLOWING)).toBe(true);
    expect(hasPermission("hr_recruitment", PERMISSIONS.VIEW_DISCIPLINARY)).toBe(true);
    expect(hasPermission("hr_recruitment", PERMISSIONS.VIEW_ALLEGATIONS)).toBe(false);
  });

  it("deputy (acting DSL) sees allegations, NOT HR-confidential", () => {
    expect(hasPermission("deputy_manager", PERMISSIONS.VIEW_ALLEGATIONS)).toBe(true);
    expect(hasPermission("deputy_manager", PERMISSIONS.VIEW_DISCIPLINARY)).toBe(false);
    expect(hasPermission("deputy_manager", PERMISSIONS.VIEW_WHISTLEBLOWING)).toBe(false);
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
