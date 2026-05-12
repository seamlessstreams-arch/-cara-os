// ══════════════════════════════════════════════════════════════════════════════
// Tests: AriaNotificationPrefs _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/aria/aria-notification-prefs";

const { NOTIFICATION_CATEGORIES, getDefaultPrefs, countEnabled } = _testing;

describe("AriaNotificationPrefs", () => {
  describe("NOTIFICATION_CATEGORIES", () => {
    it("has at least 6 categories", () => {
      expect(NOTIFICATION_CATEGORIES.length).toBeGreaterThanOrEqual(6);
    });

    it("each category has required fields", () => {
      for (const cat of NOTIFICATION_CATEGORIES) {
        expect(cat.id).toBeTruthy();
        expect(cat.label).toBeTruthy();
        expect(cat.description).toBeTruthy();
        expect(cat.icon).toBeTruthy();
        expect(typeof cat.defaultEnabled).toBe("boolean");
      }
    });

    it("has unique ids", () => {
      const ids = NOTIFICATION_CATEGORIES.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("includes critical safeguarding (mandatory)", () => {
      const safeguarding = NOTIFICATION_CATEGORIES.find((c) => c.id === "critical_safeguarding");
      expect(safeguarding).toBeDefined();
      expect(safeguarding?.defaultEnabled).toBe(true);
    });

    it("includes management oversight (mandatory)", () => {
      const oversight = NOTIFICATION_CATEGORIES.find((c) => c.id === "management_oversight");
      expect(oversight).toBeDefined();
      expect(oversight?.defaultEnabled).toBe(true);
    });

    it("includes optional categories with default disabled", () => {
      const optional = NOTIFICATION_CATEGORIES.filter((c) => !c.defaultEnabled);
      expect(optional.length).toBeGreaterThan(0);
    });
  });

  describe("getDefaultPrefs", () => {
    it("returns preferences for all categories", () => {
      const prefs = getDefaultPrefs();
      for (const cat of NOTIFICATION_CATEGORIES) {
        expect(prefs[cat.id]).toBe(cat.defaultEnabled);
      }
    });

    it("has correct number of keys", () => {
      const prefs = getDefaultPrefs();
      expect(Object.keys(prefs)).toHaveLength(NOTIFICATION_CATEGORIES.length);
    });
  });

  describe("countEnabled", () => {
    it("counts enabled categories", () => {
      const prefs = { a: true, b: false, c: true, d: true };
      expect(countEnabled(prefs)).toBe(3);
    });

    it("returns 0 for all disabled", () => {
      const prefs = { a: false, b: false };
      expect(countEnabled(prefs)).toBe(0);
    });

    it("returns total for all enabled", () => {
      const prefs = { a: true, b: true, c: true };
      expect(countEnabled(prefs)).toBe(3);
    });

    it("handles empty object", () => {
      expect(countEnabled({})).toBe(0);
    });

    it("counts defaults correctly", () => {
      const defaults = getDefaultPrefs();
      const defaultEnabledCount = NOTIFICATION_CATEGORIES.filter((c) => c.defaultEnabled).length;
      expect(countEnabled(defaults)).toBe(defaultEnabledCount);
    });
  });
});
