import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { STAFF } from "@/lib/seed-data";

// Inductions are keyed by staff_id: `db.inductionRecords.findByStaff(staffId)`
// and the development engine's `inductionByStaff` map both look them up that
// way. The form minted `crypto.randomUUID()` for every induction, so one
// recorded for a person already on the roster could never be found against
// them — the record existed and was unattributable.

const PAGE = fs.readFileSync("src/app/(platform)/staff-induction/page.tsx", "utf8");

describe("an induction links to the staff member it is about", () => {
  it("uses an existing staff id when the typed name matches one", () => {
    expect(PAGE).toMatch(/existing\?\.id \?\? crypto\.randomUUID\(\)/);
    expect(PAGE).toMatch(/full_name[\s\S]*toLowerCase\(\) === typedName/);
  });

  it("still generates an id for someone not on the roster", () => {
    // A new starter legitimately has no staff record yet; that path is kept.
    expect(PAGE).toMatch(/crypto\.randomUUID\(\)/);
  });

  it("the roster it matches against carries full names to match on", () => {
    expect(STAFF.length).toBeGreaterThan(0);
    expect(STAFF.filter((s) => (s.full_name ?? "").trim().length > 0).length).toBeGreaterThan(0);
  });
});
