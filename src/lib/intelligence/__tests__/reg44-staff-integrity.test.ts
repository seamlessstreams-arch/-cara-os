import { describe, it, expect } from "vitest";
import { intelligenceDb } from "@/lib/intelligence/store";
import { getStaffById } from "@/lib/seed-data";

// The seeded intelligence store references staff only by id — the roster lives
// in seed-data. A staff id with no roster row renders as "Unknown" or the raw
// id on every surface that resolves it (Reg 44 review trail, action tracker,
// oversight dashboards). This class has bitten repeatedly (staff_naomi,
// PR #767; staff_jasmine, PR #770; staff_ri, the seed this test was written
// against) — this guards the Reg 44 visits' staff-referencing fields, as a
// sibling of the contact-log guard.
//
// The external Reg 44 visitor is deliberately NOT covered: visitor_name is
// free text, not a staff id — independent visitors are not on the roster.
//
// Seeded rows all carry home_id "home_oak", and findAll(homeId) filters by it;
// querying any other id would return [] and pass vacuously.
const SEEDED_HOME = "home_oak";

describe("seeded Reg 44 visits reference only rostered staff", () => {
  const visits = intelligenceDb.reg44Visits.findAll(SEEDED_HOME);

  it("has seeded Reg 44 visits to check — guards against a vacuous pass", () => {
    expect(visits.length).toBeGreaterThan(0);
  });

  it("resolves manager_response_by, ri_review_by and created_by to rostered staff", () => {
    const phantoms: string[] = [];
    for (const visit of visits) {
      for (const field of ["manager_response_by", "ri_review_by", "created_by"] as const) {
        const id = visit[field];
        if (id && !getStaffById(id)) phantoms.push(`${visit.id}.${field} → "${id}"`);
      }
    }
    expect(phantoms, `phantom staff ids in seeded Reg 44 visits: ${phantoms.join(", ")}`).toEqual([]);
  });

  it("resolves every finding's action_completed_by to rostered staff", () => {
    const phantoms: string[] = [];
    for (const visit of visits) {
      for (const finding of visit.findings) {
        const id = finding.action_completed_by;
        if (id && !getStaffById(id)) phantoms.push(`${finding.id}.action_completed_by → "${id}"`);
      }
    }
    expect(phantoms, `phantom staff ids in seeded Reg 44 findings: ${phantoms.join(", ")}`).toEqual([]);
  });
});
