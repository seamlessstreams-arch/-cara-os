// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraPlacementTimeline _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-placement-timeline";

const { EVENT_TYPE_CONFIG, SIGNIFICANCE_CONFIG, getDemoPlacementTimeline } = _testing;

describe("CaraPlacementTimeline", () => {
  describe("EVENT_TYPE_CONFIG", () => {
    it("has all 11 event types", () => {
      const types = [
        "placement_start", "lac_review", "incident", "achievement",
        "risk_change", "care_plan_update", "key_work", "health_update",
        "education_update", "family_contact", "milestone",
      ];
      for (const t of types) {
        expect(EVENT_TYPE_CONFIG[t as keyof typeof EVENT_TYPE_CONFIG]).toBeDefined();
      }
    });

    it("each type has label, icon, colour, and dotColour", () => {
      for (const [, cfg] of Object.entries(EVENT_TYPE_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.dotColour).toBeTruthy();
      }
    });
  });

  describe("SIGNIFICANCE_CONFIG", () => {
    it("has high, medium, and low", () => {
      expect(SIGNIFICANCE_CONFIG.high).toBeDefined();
      expect(SIGNIFICANCE_CONFIG.medium).toBeDefined();
      expect(SIGNIFICANCE_CONFIG.low).toBeDefined();
    });
  });

  describe("getDemoPlacementTimeline", () => {
    const data = getDemoPlacementTimeline();

    it("has child name and ID", () => {
      expect(data.childName).toBeTruthy();
      expect(data.childId).toBeTruthy();
    });

    it("has placement start date and days", () => {
      expect(data.placementStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(data.placementDays).toBeGreaterThan(0);
    });

    it("has Cara overview text", () => {
      expect(data.caraOverview.length).toBeGreaterThan(20);
    });

    it("has multiple events", () => {
      expect(data.events.length).toBeGreaterThan(5);
    });

    it("each event has required fields", () => {
      for (const e of data.events) {
        expect(e.id).toBeTruthy();
        expect(e.type).toBeTruthy();
        expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(e.title).toBeTruthy();
        expect(e.detail).toBeTruthy();
        expect(["high", "medium", "low"]).toContain(e.significance);
      }
    });

    it("events are in chronological order", () => {
      for (let i = 0; i < data.events.length - 1; i++) {
        expect(data.events[i].date <= data.events[i + 1].date).toBe(true);
      }
    });

    it("first event is placement start", () => {
      expect(data.events[0].type).toBe("placement_start");
    });

    it("includes events with Cara narratives", () => {
      const withNarrative = data.events.filter((e) => e.caraNarrative);
      expect(withNarrative.length).toBeGreaterThan(0);
    });

    it("covers multiple event types", () => {
      const types = new Set(data.events.map((e) => e.type));
      expect(types.size).toBeGreaterThanOrEqual(5);
    });
  });
});
