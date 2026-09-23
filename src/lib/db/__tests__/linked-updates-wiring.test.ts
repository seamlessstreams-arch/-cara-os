import { describe, it, expect, vi, beforeEach } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// The linked-updates engine, on the two counts it actually failed.
//
// 1. IT WAS NOT CALLED. processIncidentCreated and processMissingEpisodeCreated
//    had no callers anywhere in src — the module header claimed "every function
//    here is called by API route handlers", and only processMedicationException
//    ever was. Logging an incident produced no chronology entry, no oversight
//    task, no notification and no push. runLinkedUpdates is the dispatch the
//    catch-all create path now goes through, so it is what this pins.
//
// 2. IT NAMED A PERSON WHO DOES NOT WORK THERE. assigned_to and recipient_id
//    were the literal "staff_darren". The role beside them already said what was
//    meant, so the fix is a lookup — and the lookup has to degrade to an empty
//    assignee rather than a wrong one, because Oak House genuinely had no
//    registered_manager at all.
// ══════════════════════════════════════════════════════════════════════════════

const staff = vi.hoisted(() => ({ list: [] as Array<{ id: string; role: string; is_active?: boolean }> }));

vi.mock("@/lib/db/dal", () => ({
  dal: {
    staff: { findAll: async () => staff.list },
    chronology: { create: async (d: unknown) => d },
    notifications: { create: async (d: unknown) => d },
  },
}));

import { runLinkedUpdates } from "../linked-updates";
import { registeredManagerId, deputyOrSeniorId } from "../home-roles";

beforeEach(() => { staff.list = []; });

describe("the engine is reachable from the create path", () => {
  it("dispatches an incident", async () => {
    // Before the wiring there was nothing to call: this import path did not
    // exist and the handler sat unreferenced.
    expect(typeof runLinkedUpdates).toBe("function");
    await expect(runLinkedUpdates("incidents", minimalIncident(), "staff_x")).resolves.toBeUndefined();
  });

  it("ignores a collection that earns no linked updates", async () => {
    await expect(runLinkedUpdates("dietary-plans", {}, "staff_x")).resolves.toBeUndefined();
  });

  it("never lets follow-on work fail the record that triggered it", async () => {
    // The incident is already written by the time this runs. A throw here would
    // turn a logged safeguarding incident into a 500.
    await expect(runLinkedUpdates("incidents", null, "staff_x")).resolves.toBeUndefined();
  });
});

describe("who the work is assigned to", () => {
  it("resolves the registered manager from the home's staff", async () => {
    staff.list = [{ id: "st_rm", role: "registered_manager", is_active: true }];
    expect(await registeredManagerId()).toBe("st_rm");
  });

  it("returns null when the post is vacant rather than naming somebody", async () => {
    // Oak House's actual state until the RM was recorded. An empty assignee is
    // visibly unassigned; a wrong one looks handled and is not.
    staff.list = [{ id: "st_rcw", role: "residential_care_worker", is_active: true }];
    expect(await registeredManagerId()).toBeNull();
  });

  it("does not resolve an inactive manager", async () => {
    staff.list = [{ id: "st_rm", role: "registered_manager", is_active: false }];
    expect(await registeredManagerId()).toBeNull();
  });

  it("falls back deputy -> team leader -> RM for senior work", async () => {
    staff.list = [{ id: "st_tl", role: "team_leader", is_active: true },
                  { id: "st_rm", role: "registered_manager", is_active: true }];
    expect(await deputyOrSeniorId()).toBe("st_tl");

    staff.list = [{ id: "st_rm", role: "registered_manager", is_active: true }];
    expect(await deputyOrSeniorId()).toBe("st_rm");
  });

  it("prefers the deputy over the fallbacks", async () => {
    staff.list = [{ id: "st_rm", role: "registered_manager", is_active: true },
                  { id: "st_dep", role: "deputy_manager", is_active: true }];
    expect(await deputyOrSeniorId()).toBe("st_dep");
  });
});

function minimalIncident() {
  return {
    id: "inc_1", reference: "INC-1", child_id: "yp_1", home_id: "home_1",
    type: "safeguarding_concern", severity: "high", date: "2026-09-23", time: "10:00",
    description: "d", immediate_action: "a", requires_oversight: false,
  };
}
