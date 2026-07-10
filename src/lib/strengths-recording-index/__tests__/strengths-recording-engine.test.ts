// ══════════════════════════════════════════════════════════════════════════════
// CARA — STRENGTHS RECORDING INDEX ENGINE TESTS
//
// Pins the pure builder's contract: it reads the store and returns a whole-home
// summary (numeric overallRate) alongside a per-child profile array — the exact
// shape the /api/v1/strengths-recording-index route wraps under `data`.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildStrengthsRecordingIndex } from "../strengths-recording-engine";

describe("buildStrengthsRecordingIndex", () => {
  it("returns a whole-home summary with a numeric overall rate and a child profile array", () => {
    const result = buildStrengthsRecordingIndex(getStore());

    expect(result.summary).toBeDefined();
    expect(typeof result.summary.overallRate).toBe("number");

    expect(Array.isArray(result.childProfiles)).toBe(true);
    expect(Array.isArray(result.staffProfiles)).toBe(true);
    expect(Array.isArray(result.categoryResults)).toBe(true);
  });
});
