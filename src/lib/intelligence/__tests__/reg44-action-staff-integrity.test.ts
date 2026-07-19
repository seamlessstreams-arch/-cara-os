import { describe, it, expect } from "vitest";
import { reg44Actions } from "@/lib/intelligence/fallback-store";
import { getStaffById } from "@/lib/seed-data";

// The fallback store's seeded Reg 44 actions are served verbatim by
// /api/intelligence/reg44-actions when Supabase is disabled and rendered on
// the quality/reg-44 page. Sibling seeds reference staff by roster id — the
// intelligence store's complaints (assigned_to: "staff_darren") and the
// db-store Reg 44 action tracker, whose page resolves assigned_to through
// getStaffName() and renders anything unrostered as "Unknown". This seed
// instead shipped display-name strings ("Darren Laville (RM)") naming people
// who are on no roster at all — the phantom-staff class from PRs #767/#770/
// #771, surfacing as a phantom *name* on screen instead of "Unknown".
//
// created_by is guarded too, allowing the "system" sentinel seed-data uses
// for machine-authored rows. The external Reg 44 visitor is deliberately not
// covered: visitor_name lives on visits and is free text, not a staff id.
//
// Seeded rows all carry home_id "home_oak"; filtering by any other id would
// return [] and pass vacuously — the first assertion guards against that.
const SEEDED_HOME = "home_oak";

describe("seeded fallback Reg 44 actions reference only rostered staff", () => {
  const actions = reg44Actions.filter((a) => a.home_id === SEEDED_HOME);

  it("has seeded Reg 44 actions to check — guards against a vacuous pass", () => {
    expect(actions.length).toBeGreaterThan(0);
  });

  it("resolves every assigned_to to a rostered staff id", () => {
    const phantoms: string[] = [];
    for (const action of actions) {
      if (action.assigned_to && !getStaffById(action.assigned_to)) {
        phantoms.push(`${action.id}.assigned_to → "${action.assigned_to}"`);
      }
    }
    expect(phantoms, `phantom staff in seeded Reg 44 actions: ${phantoms.join(", ")}`).toEqual([]);
  });

  it("resolves every created_by to a rostered staff id or the system sentinel", () => {
    const phantoms: string[] = [];
    for (const action of actions) {
      const id = action.created_by;
      if (id && id !== "system" && !getStaffById(id)) {
        phantoms.push(`${action.id}.created_by → "${id}"`);
      }
    }
    expect(phantoms, `phantom staff in seeded Reg 44 actions: ${phantoms.join(", ")}`).toEqual([]);
  });
});
