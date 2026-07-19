import { describe, it, expect } from "vitest";
import { intelligenceDb } from "@/lib/intelligence/store";
import { getStaffById } from "@/lib/seed-data";

// The seeded intelligence store references staff only by id — the roster lives
// in seed-data. A staff id with no roster row renders as "Unknown" or the raw
// id on every surface that resolves it (relational timeline, family-time
// supervision, chronology). This class has bitten twice (staff_naomi, PR #767;
// staff_jasmine, the seed this test was written against), and the main store's
// dailyLog subset is already guarded by staff-recording-practice — this covers
// the parallel intelligence store's contact logs.
//
// Seeded rows all carry home_id "home_oak", and findAll(homeId) filters by it;
// querying any other id would return [] and pass vacuously.
const SEEDED_HOME = "home_oak";

describe("intelligence contact logs reference only rostered staff", () => {
  const logs = intelligenceDb.contactLogs.findAll(SEEDED_HOME);

  it("has seeded contact logs to check — guards against a vacuous pass", () => {
    expect(logs.length).toBeGreaterThan(0);
  });

  it("resolves every supervised_by and created_by to a rostered staff member", () => {
    const phantoms: string[] = [];
    for (const log of logs) {
      for (const field of ["supervised_by", "created_by"] as const) {
        const id = log[field];
        if (id && !getStaffById(id)) phantoms.push(`${log.id}.${field} → "${id}"`);
      }
    }
    expect(phantoms, `phantom staff ids in seeded contact logs: ${phantoms.join(", ")}`).toEqual([]);
  });
});
