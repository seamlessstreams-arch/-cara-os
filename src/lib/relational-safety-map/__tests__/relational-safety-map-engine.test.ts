// ══════════════════════════════════════════════════════════════════════════════
// CARA — RELATIONAL SAFETY MAP ENGINE TESTS
//
// Pins the pure builder's contract: it reads the store and returns a whole-home
// summary (numeric secureCount / fragileCount) alongside a per-child profile
// array whose statuses are always in the known secure/developing/fragile set —
// the exact shape the /api/v1/relational-safety-map route wraps under `data`.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildRelationalSafetyMap } from "../relational-safety-map-engine";

describe("buildRelationalSafetyMap", () => {
  it("returns a summary with numeric counts and per-child statuses in the known set", () => {
    const result = buildRelationalSafetyMap(getStore());

    expect(result.summary).toBeDefined();
    expect(typeof result.summary.secureCount).toBe("number");
    expect(typeof result.summary.fragileCount).toBe("number");

    expect(Array.isArray(result.childProfiles)).toBe(true);
    for (const profile of result.childProfiles) {
      expect(["secure", "developing", "fragile"]).toContain(profile.status);
    }
  });

  it("does not read a brand-new admission as fragile purely from not-yet-set-up supports", () => {
    const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);
    // Two children with the IDENTICAL support-less state (no key worker, no
    // sessions, no documented trusted adult). Only the placement age differs.
    const store = {
      childPaceProfiles: [],
      incidents: [],
      keyWorkingSessions: [],
      staff: [],
      youngPeople: [
        { id: "new", first_name: "New", last_name: "Arrival", key_worker_id: null, secondary_worker_id: null, status: "current", placement_start: iso(5) },
        { id: "estab", first_name: "Established", last_name: "Child", key_worker_id: null, secondary_worker_id: null, status: "current", placement_start: iso(200) },
      ],
    } as never as Parameters<typeof buildRelationalSafetyMap>[0];

    const byId = Object.fromEntries(buildRelationalSafetyMap(store).childProfiles.map((p) => [p.childId, p.status]));
    expect(byId["new"]).toBe("developing"); // within the 28-day settling window → not a false-red
    expect(byId["estab"]).toBe("fragile"); // established with no supports → a genuine concern
  });
});
