import { describe, it, expect } from "vitest";
import { buildAskSnapshot } from "../build-snapshot";
import { getStore } from "@/lib/db/store";

// Validates build-practice.ts END-TO-END against the real seeded store: if any
// field name were wrong vs the extracted engine types, these values would be
// undefined (each engine is try/catch-isolated, so a throw would leave the block
// absent) — so this fails loudly on a mismatch, unlike a filtered tsc grep.
describe("Ask CARA practice digest — real seeded data", () => {
  const snap = buildAskSnapshot(getStore());

  it("populates the leg-four practice digest", () => {
    expect(snap.practice).toBeDefined();
  });

  it("Care Language Audit block has real numeric summary + perChild", () => {
    const cl = snap.practice?.careLanguage;
    expect(cl).toBeDefined();
    expect(typeof cl?.hitRate).toBe("number");
    expect(typeof cl?.totalHits).toBe("number");
    expect(typeof cl?.childrenAffected).toBe("number");
    expect(Array.isArray(cl?.perChild)).toBe(true);
  });

  it("Child Voice Presence block present with typed perChild", () => {
    const cv = snap.practice?.childVoice;
    expect(cv).toBeDefined();
    expect(Array.isArray(cv?.perChild)).toBe(true);
    // overallPresenceRate is number | null — must be one of those, not undefined
    expect(["number", "object"]).toContain(typeof cv?.overallPresenceRate); // null is "object"
  });

  it("Recording Gap + Cumulative Risk blocks present with numeric summaries", () => {
    expect(snap.practice?.recordingGaps).toBeDefined();
    expect(typeof snap.practice?.recordingGaps?.childrenWithAnyGap).toBe("number");
    expect(typeof snap.practice?.recordingGaps?.totalCriticalGaps).toBe("number");
    expect(snap.practice?.cumulativeRisk).toBeDefined();
    expect(typeof snap.practice?.cumulativeRisk?.escalatingCount).toBe("number");
    expect(typeof snap.practice?.cumulativeRisk?.mostCommonWorseningSignal).toBe("string");
  });
});
