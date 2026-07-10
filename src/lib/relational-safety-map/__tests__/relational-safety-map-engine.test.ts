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
});
