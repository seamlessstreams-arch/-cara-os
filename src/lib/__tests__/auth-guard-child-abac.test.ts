import { describe, it, expect, beforeEach } from "vitest";
import { assertChildHomeAccess } from "@/lib/auth-guard";
import { summariseAbacDivergence } from "@/lib/permissions/abac-divergence";
import { __resetRecordAuditTrail } from "@/lib/audit/audit-recorder";
import { getStore } from "@/lib/db/store";
import type { AppRole } from "@/lib/permissions";

// assertChildHomeAccess guards 50 child-data routes. It now also gives the ABAC
// engine its first sight of child-record access — ADVISORY.
//
// The property that matters most is NOT what ABAC decides; it is that ABAC
// deciding CANNOT change what the guard returns. A safety experiment that
// alters the thing it observes is not an experiment.

beforeEach(() => __resetRecordAuditTrail());

const identity = (over: Partial<{ userId: string; role: AppRole; homeId: string | null }> = {}) => ({
  userId: over.userId ?? "staff_darren",
  role: (over.role ?? "registered_manager") as AppRole,
  homeId: over.homeId === undefined ? null : over.homeId,
});

describe("assertChildHomeAccess — enforced behaviour is unchanged", () => {
  it("still allows in demo mode (no session home ⇒ no tenancy check)", () => {
    const child = getStore().youngPeople[0];
    expect(assertChildHomeAccess(identity({ homeId: null }), child.id)).toBeNull();
  });

  it("still allows when the child is in the caller's home", () => {
    const child = getStore().youngPeople[0];
    expect(assertChildHomeAccess(identity({ homeId: child.home_id }), child.id)).toBeNull();
  });

  it("still denies a child in another home", () => {
    const child = getStore().youngPeople[0];
    const denied = assertChildHomeAccess(identity({ homeId: "home_somewhere_else" }), child.id);
    expect(denied).not.toBeNull();
    expect(denied!.status).toBe(403);
  });

  it("still no-ops without a childId", () => {
    expect(assertChildHomeAccess(identity({ homeId: "home_oak" }), null)).toBeNull();
    expect(assertChildHomeAccess(identity({ homeId: "home_oak" }), undefined)).toBeNull();
  });

  it("never throws — an unknown child must not break the route", () => {
    expect(() => assertChildHomeAccess(identity(), "yp_does_not_exist")).not.toThrow();
  });
});

describe("the advisory shadow observes without interfering", () => {
  it("records divergence for a care worker who doesn't key-work this child", () => {
    const store = getStore();
    // An RSW's child_record rule requires assignment (key worker) — a care
    // worker reading a child they don't key-work is the divergence that poses
    // the real practice question.
    //
    // NB the role is taken from the STAFF RECORD, not from the request identity
    // — a client's role claim is never trusted — so the stranger must actually
    // BE a care worker in the store, not merely be called one here.
    const child = store.youngPeople.find((yp) => yp.key_worker_id) ?? store.youngPeople[0];
    const stranger = store.staff.find(
      (s) =>
        s.role === "residential_care_worker" &&
        s.id !== child.key_worker_id &&
        s.id !== child.secondary_worker_id,
    );
    expect(stranger, "seed needs a care worker who doesn't key-work this child").toBeTruthy();

    const res = assertChildHomeAccess(
      { userId: stranger!.id, role: "residential_care_worker" as AppRole, homeId: null },
      child.id,
    );
    // Advisory: the guard's answer is unchanged (demo mode ⇒ null).
    expect(res).toBeNull();

    const s = summariseAbacDivergence();
    expect(s.total).toBeGreaterThan(0);
    expect(s.rows[0].resource).toBe("child_record");
    expect(s.rows[0].contextReal).toBe(true); // real staff ⇒ real attributes
  });

  it("a manager reading a child in their own home does not diverge", () => {
    const store = getStore();
    const child = store.youngPeople[0];
    const rm = store.staff.find((s) => s.role === "registered_manager");
    if (!rm) return; // seed-dependent; the assertion below is the point
    assertChildHomeAccess(
      { userId: rm.id, role: "registered_manager" as AppRole, homeId: child.home_id },
      child.id,
    );
    const s = summariseAbacDivergence();
    // RM child_record rules carry no assignment/shift requirement.
    expect(s.rows.filter((r) => r.userId === rm.id)).toHaveLength(0);
  });
});
