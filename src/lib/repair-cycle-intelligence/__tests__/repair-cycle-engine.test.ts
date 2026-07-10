// ══════════════════════════════════════════════════════════════════════════════
// CARA — REPAIR CYCLE INTELLIGENCE ENGINE TESTS
//
// Pins the pure builder's contract: it reads the store and returns a whole-home
// summary (numeric overallCompletionRate) alongside per-child and per-incident
// arrays — the exact shape the /api/v1/repair-cycle-intelligence route wraps
// under `data`.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildRepairCycleIntelligence } from "../repair-cycle-engine";

describe("buildRepairCycleIntelligence", () => {
  it("returns a whole-home summary with a numeric completion rate and a child summary array", () => {
    const result = buildRepairCycleIntelligence(getStore());

    expect(result.summary).toBeDefined();
    expect(typeof result.summary.overallCompletionRate).toBe("number");

    expect(Array.isArray(result.childSummaries)).toBe(true);
    expect(Array.isArray(result.incidentProfiles)).toBe(true);
  });
});
