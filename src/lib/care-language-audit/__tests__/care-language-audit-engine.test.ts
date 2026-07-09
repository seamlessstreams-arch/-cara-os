// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE LANGUAGE AUDIT ENGINE TESTS
//
// Pins the pure builder's contract: it reads the store and returns a whole-home
// summary (numeric totalHits / hitRate) alongside a per-child profile array —
// the exact shape the /api/v1/care-language-audit route wraps under `data`.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildCareLanguageAudit } from "../care-language-audit-engine";

describe("buildCareLanguageAudit", () => {
  it("returns a whole-home summary with numeric totals and a child profile array", () => {
    const result = buildCareLanguageAudit(getStore());

    expect(result.summary).toBeDefined();
    expect(typeof result.summary.totalHits).toBe("number");
    expect(typeof result.summary.hitRate).toBe("number");

    expect(Array.isArray(result.childProfiles)).toBe(true);
    expect(Array.isArray(result.staffProfiles)).toBe(true);
    expect(Array.isArray(result.categorySummary)).toBe(true);
  });
});
