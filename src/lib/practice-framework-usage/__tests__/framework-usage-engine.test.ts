// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE FRAMEWORK USAGE ENGINE TESTS
//
// Pins the pure builder's contract: it reads the store and returns a frameworks
// array (one entry per KB framework, each with a valid engagement signal) plus
// a numeric team summary — the exact shape the
// /api/v1/practice-framework-usage route wraps under `data`.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildPracticeFrameworkUsage } from "../framework-usage-engine";

describe("buildPracticeFrameworkUsage", () => {
  it("returns a frameworks array with valid signals and a numeric team summary", () => {
    const result = buildPracticeFrameworkUsage(getStore());

    expect(Array.isArray(result.frameworks)).toBe(true);
    expect(result.frameworks.length).toBeGreaterThan(0);
    for (const fw of result.frameworks) {
      expect(["active", "emerging", "dormant"]).toContain(fw.signal);
    }

    expect(result.summary).toBeDefined();
    expect(typeof result.summary.totalEngagements).toBe("number");
  });
});
