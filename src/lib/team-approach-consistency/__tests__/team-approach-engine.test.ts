// ══════════════════════════════════════════════════════════════════════════════
// CARA — TEAM APPROACH CONSISTENCY ENGINE TESTS
//
// Pins the pure builder's contract: it reads the store and returns per-child
// consistency profiles (each with a valid consistencyLevel) alongside a
// whole-home summary (numeric overallTherapeuticRate) — the exact shape the
// /api/v1/team-approach-consistency route wraps under `data`.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildTeamApproachConsistency } from "../team-approach-engine";

describe("buildTeamApproachConsistency", () => {
  it("returns a summary with a numeric overallTherapeuticRate and a child profile array", () => {
    const result = buildTeamApproachConsistency(getStore());

    expect(result.summary).toBeDefined();
    expect(typeof result.summary.overallTherapeuticRate).toBe("number");
    expect(typeof result.summary.consistentCount).toBe("number");
    expect(typeof result.summary.mixedCount).toBe("number");
    expect(typeof result.summary.divergentCount).toBe("number");

    expect(Array.isArray(result.childProfiles)).toBe(true);
  });

  it("assigns every child profile a valid consistency level", () => {
    const result = buildTeamApproachConsistency(getStore());

    for (const profile of result.childProfiles) {
      expect(["consistent", "mixed", "divergent"]).toContain(profile.consistencyLevel);
    }
  });
});
