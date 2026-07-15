import { describe, it, expect } from "vitest";
import {
  toAbacEmploymentStatus,
  isOnShiftNow,
  assignedChildIdsFor,
  buildUserContext,
} from "@/lib/permissions/build-user-context";
import { getStore } from "@/lib/db/store";

// These attributes ARE the access decision. Until now every one of them was
// hardcoded permissive in the shadow's minimalContext, so ABAC could not deny
// on the grounds it exists to check.

describe("toAbacEmploymentStatus — the vocabularies never agreed", () => {
  it("maps the app's 'left' onto ABAC's 'leaver'", () => {
    // Different words for the same thing — the mismatch that mattered.
    expect(toAbacEmploymentStatus("left")).toBe("leaver");
  });

  it("treats probation and notice_period as active — still employed, still working", () => {
    expect(toAbacEmploymentStatus("probation")).toBe("active");
    expect(toAbacEmploymentStatus("notice_period")).toBe("active");
  });

  it("keeps suspended suspended", () => {
    expect(toAbacEmploymentStatus("suspended")).toBe("suspended");
  });

  it("distinguishes agency and bank workers by employment type", () => {
    expect(toAbacEmploymentStatus("active", "agency")).toBe("agency");
    expect(toAbacEmploymentStatus("active", "bank")).toBe("bank");
    expect(toAbacEmploymentStatus("active", "permanent")).toBe("active");
  });

  it("NEVER reads an unknown status as active — unknown must fail closed", () => {
    for (const junk of ["", null, undefined, "wat", "ACTIVE_ISH"]) {
      expect(toAbacEmploymentStatus(junk as string)).toBe("archived");
    }
  });
});

describe("real signals from the store", () => {
  it("resolves key-worked children for a real staff member", () => {
    const store = getStore();
    const kw = store.youngPeople.find((yp) => yp.key_worker_id);
    expect(kw, "seed must have a key worker to test against").toBeTruthy();
    const ids = assignedChildIdsFor(kw!.key_worker_id!);
    expect(ids).toContain(kw!.id);
  });

  it("returns no children for someone who key-works nobody", () => {
    expect(assignedChildIdsFor("staff_does_not_exist")).toEqual([]);
  });

  it("is not on shift when no shift covers now", () => {
    expect(isOnShiftNow("staff_does_not_exist", new Date("2026-07-15T03:00:00Z"))).toBe(false);
  });
});

describe("buildUserContext", () => {
  it("never invents an actor — unknown id yields null", () => {
    expect(buildUserContext("staff_nobody")).toBeNull();
  });

  it("describes a real staff member from real records", () => {
    const store = getStore();
    const staff = store.staff[0];
    const ctx = buildUserContext(staff.id, new Date("2026-07-15T10:00:00Z"));
    expect(ctx).not.toBeNull();
    expect(ctx!.userId).toBe(staff.id);
    expect(ctx!.homeIds).toEqual(staff.home_id ? [staff.home_id] : []);
    // The point of the exercise: these are now DERIVED, not asserted.
    expect(typeof ctx!.shiftActive).toBe("boolean");
    expect(ctx!.assignedChildIds).toEqual(assignedChildIdsFor(staff.id));
    expect(ctx!.isSuspended).toBe(ctx!.employmentStatus === "suspended");
  });

  it("does not fake what the platform doesn't record", () => {
    const ctx = buildUserContext(getStore().staff[0].id);
    expect(ctx!.delegatedScopes).toEqual([]);
    expect(ctx!.temporaryGrants).toEqual([]);
    expect(ctx!.safeguardingNeedToKnow).toEqual([]);
  });

  it("locks out a suspended staff member (the old context said 'active' for everyone)", () => {
    const store = getStore();
    const staff = store.staff[0];
    const original = staff.employment_status;
    try {
      (staff as { employment_status: string }).employment_status = "suspended";
      const ctx = buildUserContext(staff.id);
      expect(ctx!.employmentStatus).toBe("suspended");
      expect(ctx!.isSuspended).toBe(true);
    } finally {
      (staff as { employment_status: string }).employment_status = original;
    }
  });

  it("marks a leaver (the old context said isLeaver: false for everyone)", () => {
    const store = getStore();
    const staff = store.staff[0];
    const original = staff.employment_status;
    try {
      (staff as { employment_status: string }).employment_status = "left";
      const ctx = buildUserContext(staff.id);
      expect(ctx!.employmentStatus).toBe("leaver");
      expect(ctx!.isLeaver).toBe(true);
    } finally {
      (staff as { employment_status: string }).employment_status = original;
    }
  });
});
