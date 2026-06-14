import { describe, it, expect, vi } from "vitest";

// Mock dependencies loaded at module level by the route
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => null,
  isSupabaseEnabled: () => false,
}));

import {
  computeApprovalRate,
  computeAvgConfidence,
  computeTopEntries,
  getDemoStats,
} from "@/app/api/cara/activity/route";

// ── getDemoStats ────────────────────────────────────────────────────────────

describe("getDemoStats", () => {
  it("returns all required fields", () => {
    const stats = getDemoStats();
    expect(stats).toHaveProperty("totalRequests");
    expect(stats).toHaveProperty("totalOutputs");
    expect(stats).toHaveProperty("approvedOutputs");
    expect(stats).toHaveProperty("rejectedOutputs");
    expect(stats).toHaveProperty("committedOutputs");
    expect(stats).toHaveProperty("pendingOutputs");
    expect(stats).toHaveProperty("transcriptions");
    expect(stats).toHaveProperty("tasksCreated");
    expect(stats).toHaveProperty("topCommands");
    expect(stats).toHaveProperty("topUsers");
    expect(stats).toHaveProperty("approvalRate");
    expect(stats).toHaveProperty("avgConfidence");
  });

  it("returns numeric values for numeric fields", () => {
    const stats = getDemoStats();
    expect(typeof stats.totalRequests).toBe("number");
    expect(typeof stats.approvalRate).toBe("number");
    expect(typeof stats.tasksCreated).toBe("number");
  });

  it("has topCommands sorted descending", () => {
    const stats = getDemoStats();
    for (let i = 1; i < stats.topCommands.length; i++) {
      expect(stats.topCommands[i - 1].count).toBeGreaterThanOrEqual(
        stats.topCommands[i].count,
      );
    }
  });

  it("has topUsers sorted descending", () => {
    const stats = getDemoStats();
    for (let i = 1; i < stats.topUsers.length; i++) {
      expect(stats.topUsers[i - 1].count).toBeGreaterThanOrEqual(
        stats.topUsers[i].count,
      );
    }
  });

  it("approvalRate is between 0 and 100", () => {
    const stats = getDemoStats();
    expect(stats.approvalRate).toBeGreaterThanOrEqual(0);
    expect(stats.approvalRate).toBeLessThanOrEqual(100);
  });

  it("avgConfidence is a valid label", () => {
    const stats = getDemoStats();
    expect(["low", "medium", "high"]).toContain(stats.avgConfidence);
  });
});

// ── computeApprovalRate ─────────────────────────────────────────────────────

describe("computeApprovalRate", () => {
  it("returns 0 when no decisions", () => {
    expect(computeApprovalRate(0, 0)).toBe(0);
  });

  it("returns 100 when all approved", () => {
    expect(computeApprovalRate(10, 0)).toBe(100);
  });

  it("returns 0 when all rejected", () => {
    expect(computeApprovalRate(0, 10)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    // 2 approved, 1 rejected = 66.666...% → 67
    expect(computeApprovalRate(2, 1)).toBe(67);
  });

  it("handles a realistic mix", () => {
    // 28 approved, 5 rejected = 28/33 ≈ 84.8% → 85
    expect(computeApprovalRate(28, 5)).toBe(85);
  });
});

// ── computeAvgConfidence ────────────────────────────────────────────────────

describe("computeAvgConfidence", () => {
  const wrap = (vals: string[]) => vals.map((confidence) => ({ confidence }));

  it("returns 'low' for empty array", () => {
    expect(computeAvgConfidence([])).toBe("low");
  });

  it("returns 'high' for all high", () => {
    expect(computeAvgConfidence(wrap(["high", "high", "high"]))).toBe("high");
  });

  it("returns 'low' for all low", () => {
    expect(computeAvgConfidence(wrap(["low", "low"]))).toBe("low");
  });

  it("returns 'medium' for all medium", () => {
    expect(computeAvgConfidence(wrap(["medium", "medium"]))).toBe("medium");
  });

  it("returns 'medium' for mixed low and high", () => {
    // (1 + 3) / 2 = 2.0 → medium (>= 1.5)
    expect(computeAvgConfidence(wrap(["low", "high"]))).toBe("medium");
  });

  it("returns 'high' for mostly high", () => {
    // (3 + 3 + 2) / 3 = 2.666 → high (>= 2.5)
    expect(computeAvgConfidence(wrap(["high", "high", "medium"]))).toBe("high");
  });

  it("skips unknown confidence values", () => {
    expect(computeAvgConfidence(wrap(["high", "unknown", "high"]))).toBe(
      "high",
    );
  });
});

// ── computeTopEntries ───────────────────────────────────────────────────────

describe("computeTopEntries", () => {
  it("counts and sorts correctly", () => {
    const items = [
      { command_id: "a" },
      { command_id: "b" },
      { command_id: "a" },
      { command_id: "c" },
      { command_id: "a" },
      { command_id: "b" },
    ];
    const result = computeTopEntries(items, "command_id", 10);
    expect(result[0]).toEqual({ id: "a", count: 3 });
    expect(result[1]).toEqual({ id: "b", count: 2 });
    expect(result[2]).toEqual({ id: "c", count: 1 });
  });

  it("limits results to max", () => {
    const items = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
    ];
    const result = computeTopEntries(items, "id", 2);
    expect(result).toHaveLength(2);
  });

  it("returns empty for empty input", () => {
    const result = computeTopEntries([], "id", 10);
    expect(result).toEqual([]);
  });
});
