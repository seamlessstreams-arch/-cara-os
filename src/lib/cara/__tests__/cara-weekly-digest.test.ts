// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraWeeklyDigest _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-weekly-digest";

const { PRIORITY_CONFIG, getDemoDigest } = _testing;

describe("CaraWeeklyDigest", () => {
  describe("PRIORITY_CONFIG", () => {
    it("has all priority levels", () => {
      expect(PRIORITY_CONFIG.high).toBeDefined();
      expect(PRIORITY_CONFIG.medium).toBeDefined();
      expect(PRIORITY_CONFIG.low).toBeDefined();
    });

    it("each has dot and colour", () => {
      for (const [, config] of Object.entries(PRIORITY_CONFIG)) {
        expect(config.dot).toBeTruthy();
        expect(config.colour).toBeTruthy();
      }
    });
  });

  describe("getDemoDigest", () => {
    const digest = getDemoDigest();

    it("has week label", () => {
      expect(digest.weekLabel).toBeTruthy();
      expect(digest.weekLabel).toContain("—");
    });

    it("has stats with all required fields", () => {
      expect(typeof digest.stats.incidentsThisWeek).toBe("number");
      expect(typeof digest.stats.pendingOversight).toBe("number");
      expect(typeof digest.stats.supervisionsDue).toBe("number");
      expect(typeof digest.stats.caraOutputsGenerated).toBe("number");
      expect(typeof digest.stats.caraOutputsApproved).toBe("number");
    });

    it("approved is less than or equal to generated", () => {
      expect(digest.stats.caraOutputsApproved).toBeLessThanOrEqual(digest.stats.caraOutputsGenerated);
    });

    it("has at least 3 top actions", () => {
      expect(digest.topActions.length).toBeGreaterThanOrEqual(3);
    });

    it("each action has required fields", () => {
      for (const action of digest.topActions) {
        expect(action.id).toBeTruthy();
        expect(action.label).toBeTruthy();
        expect(action.description).toBeTruthy();
        expect(["high", "medium", "low"]).toContain(action.priority);
        expect(action.icon).toBeTruthy();
      }
    });

    it("has at least one high-priority action", () => {
      const highPriority = digest.topActions.filter((a) => a.priority === "high");
      expect(highPriority.length).toBeGreaterThan(0);
    });

    it("has achievements", () => {
      expect(digest.achievements.length).toBeGreaterThan(0);
      for (const a of digest.achievements) {
        expect(typeof a).toBe("string");
        expect(a.length).toBeGreaterThan(0);
      }
    });
  });
});
