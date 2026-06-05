import { describe, it, expect, afterEach } from "vitest";
import {
  computeShiftActive, keepsOffShiftAccess, isShiftEnforcementEnabled,
  buildShiftAccessOverview, SHIFT_GATED_ROLES,
} from "../shift-enforcement";
import { checkAccess } from "../access-decision-service";
import type { Role, UserContext } from "../types";
import { db } from "@/lib/db/store";

function ctx(role: Role, shiftActive: boolean): UserContext {
  return {
    userId: "u", role, organisationId: "o", homeIds: ["home_oak"], assignedChildIds: [],
    assignedStaffIds: [], employmentStatus: "active", shiftActive, isAgencyStaff: role === "agency_staff",
    isSuspended: false, isLeaver: false, isUnderInvestigation: false, delegatedScopes: [],
    temporaryGrants: [], safeguardingNeedToKnow: [],
  };
}

afterEach(() => {
  delete process.env.SHIFT_BASED_ACCESS_ENFORCED;
});

describe("keepsOffShiftAccess / SHIFT_GATED_ROLES", () => {
  it("gates only general care staff", () => {
    expect(SHIFT_GATED_ROLES.has("rsw")).toBe(true);
    expect(SHIFT_GATED_ROLES.has("senior_rsw")).toBe(true);
    expect(SHIFT_GATED_ROLES.has("waking_night")).toBe(true);
    expect(SHIFT_GATED_ROLES.has("agency_staff")).toBe(true);
    expect(keepsOffShiftAccess("rsw")).toBe(false);
    expect(keepsOffShiftAccess("registered_manager")).toBe(true);
    expect(keepsOffShiftAccess("team_leader")).toBe(true);
    expect(keepsOffShiftAccess("responsible_individual")).toBe(true);
  });
});

describe("computeShiftActive (enforcement ON by default; =false disables)", () => {
  it("is enabled by default; the kill-switch makes everyone active again", () => {
    expect(isShiftEnforcementEnabled()).toBe(true); // default ON
    expect(computeShiftActive("rsw", "nobody")).toBe(false); // gated role off shift → blocked
    process.env.SHIFT_BASED_ACCESS_ENFORCED = "false";
    expect(isShiftEnforcementEnabled()).toBe(false);
    expect(computeShiftActive("rsw", "nobody")).toBe(true);
    expect(computeShiftActive("agency_staff", "nobody")).toBe(true);
  });

  it("preview forces enforcement logic even when disabled", () => {
    process.env.SHIFT_BASED_ACCESS_ENFORCED = "false";
    expect(computeShiftActive("rsw", "ghost_staff_x", { preview: true })).toBe(false);
    expect(computeShiftActive("registered_manager", "ghost_staff_x", { preview: true })).toBe(true);
  });

  it("managers/senior leaders keep access even when enforced", () => {
    expect(computeShiftActive("rsw", "ghost_staff_x")).toBe(false); // default ON, off shift
    expect(computeShiftActive("deputy_manager", "ghost_staff_x")).toBe(true); // senior leader
  });

  it("a gated role that is clocked in is on shift (true) even when enforced", () => {
    const staffId = "staff_test_p4_onshift";
    db.shifts.create({
      staff_id: staffId, date: "2026-09-20", shift_type: "day", start_time: "08:00", end_time: "16:00",
      break_minutes: 0, actual_start: "2026-09-20T08:00:00.000Z", actual_end: null,
      clock_in_at: "2026-09-20T08:00:00.000Z", clock_out_at: null, overtime_minutes: 0, notes: null,
      status: "in_progress", is_open_shift: false, home_id: "home_oak", created_by: staffId, updated_by: staffId,
    });
    expect(computeShiftActive("rsw", staffId, { preview: true, now: "2026-09-20T10:00:00.000Z" })).toBe(true);
  });
});

describe("the real engine gate (checkAccess + requiresShift rules)", () => {
  it("flips child_record access for general staff purely on shift state", () => {
    const off = checkAccess({ user: ctx("rsw", false), resourceType: "child_record", action: "view", resourceHomeId: "home_oak" });
    const on = checkAccess({ user: ctx("rsw", true), resourceType: "child_record", action: "view", resourceHomeId: "home_oak" });
    expect(off.allowed).toBe(false); // not on shift
    expect(on.allowed).toBe(true);
  });

  it("flips safeguarding access for general staff on shift state", () => {
    expect(checkAccess({ user: ctx("waking_night", false), resourceType: "safeguarding", action: "view", resourceHomeId: "home_oak" }).allowed).toBe(false);
    expect(checkAccess({ user: ctx("waking_night", true), resourceType: "safeguarding", action: "view", resourceHomeId: "home_oak" }).allowed).toBe(true);
  });

  it("managers keep child_record access even with shiftActive false", () => {
    const d = checkAccess({ user: ctx("registered_manager", false), resourceType: "child_record", action: "view", resourceHomeId: "home_oak" });
    expect(d.allowed).toBe(true);
  });

  it("deputy managers keep safeguarding access off shift", () => {
    expect(checkAccess({ user: ctx("deputy_manager", false), resourceType: "safeguarding", action: "view", resourceHomeId: "home_oak" }).allowed).toBe(true);
  });
});

describe("buildShiftAccessOverview", () => {
  it("off-shift general staff (preview) shows blocked operational resources", () => {
    const o = buildShiftAccessOverview("ghost_staff_offshift", { preview: true, now: "2026-09-21T10:00:00.000Z" });
    expect(o.role).toBe("rsw"); // unknown staff defaults to a gated role
    expect(o.keeps_off_shift_access).toBe(false);
    expect(o.on_shift).toBe(false);
    expect(o.preview).toBe(true);
    expect(o.blocked_count).toBeGreaterThan(0);
    expect(o.resources.some((r) => r.resourceType === "child_record" && !r.allowed)).toBe(true);
  });

  it("default ON: off-shift general staff are blocked without preview", () => {
    const o = buildShiftAccessOverview("ghost_staff_offshift", { now: "2026-09-21T10:00:00.000Z" });
    expect(o.enforcement_enabled).toBe(true);
    expect(o.blocked_count).toBeGreaterThan(0);
  });

  it("kill-switch (=false): nothing is blocked", () => {
    process.env.SHIFT_BASED_ACCESS_ENFORCED = "false";
    const o = buildShiftAccessOverview("ghost_staff_offshift", { now: "2026-09-21T10:00:00.000Z" });
    expect(o.enforcement_enabled).toBe(false);
    expect(o.blocked_count).toBe(0);
  });
});
