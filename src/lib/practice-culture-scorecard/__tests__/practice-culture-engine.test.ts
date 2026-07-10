// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE CULTURE SCORECARD ENGINE TESTS
//
// Pins the pure builder's contract: it reads the store and returns the exact
// payload the /api/v1/practice-culture-scorecard route wraps under `data` —
// a numeric overall score, a RAG status, five dimensions, and a summary.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildPracticeCultureScorecard } from "../practice-culture-engine";

describe("buildPracticeCultureScorecard", () => {
  it("returns a numeric overall score, a dimensions array, and a summary", () => {
    const result = buildPracticeCultureScorecard(getStore());

    expect(typeof result.overallScore).toBe("number");
    expect(["progressing", "developing", "needs_support"]).toContain(result.overallStatus);

    expect(Array.isArray(result.dimensions)).toBe(true);
    expect(result.dimensions).toHaveLength(5);
    for (const d of result.dimensions) {
      expect(typeof d.score).toBe("number");
      expect(typeof d.improvementPrompt).toBe("string");
    }

    expect(result.summary).toBeDefined();
    expect(typeof result.summary.priorityDimension).toBe("string");
    expect(typeof result.summary.totalRecordsAnalysed).toBe("number");
    expect(result.summary.totalFrameworks).toBe(6);
  });
});
