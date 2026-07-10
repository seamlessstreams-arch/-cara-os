// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF RECORDING QUALITY PATHWAY ENGINE TESTS
//
// Pins the pure builder's contract: it reads the store and returns a per-staff
// profile array alongside a team summary (numeric totalStaff / avgAcceptanceRate)
// — the exact shape the /api/v1/staff-recording-quality-pathway route wraps
// under `data`.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildStaffRecordingPathway } from "../staff-recording-pathway-engine";

describe("buildStaffRecordingPathway", () => {
  it("returns a staff profile array and a team summary with numeric totals", () => {
    const result = buildStaffRecordingPathway(getStore());

    expect(Array.isArray(result.profiles)).toBe(true);

    expect(result.summary).toBeDefined();
    expect(typeof result.summary.totalStaff).toBe("number");
    expect(typeof result.summary.avgAcceptanceRate).toBe("number");
  });
});
