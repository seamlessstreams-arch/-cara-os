// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraDailyIntelligence _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-daily-intelligence";

const {
  EVENT_CATEGORY_CONFIG,
  PRIORITY_CONFIG,
  SHIFT_CONFIG,
  RAG_CONFIG,
  generateDemoBrief,
} = _testing;

describe("CaraDailyIntelligence", () => {
  // ── Config ────────────────────────────────────────────────────────────────
  describe("EVENT_CATEGORY_CONFIG", () => {
    it("has all 11 event categories", () => {
      const cats = [
        "incident", "mood", "medication", "behaviour", "health",
        "safeguarding", "missing", "positive", "contact", "education", "activity",
      ];
      for (const c of cats) {
        expect(EVENT_CATEGORY_CONFIG[c as keyof typeof EVENT_CATEGORY_CONFIG]).toBeDefined();
      }
    });

    it("each category has label, icon, colour, bg", () => {
      for (const [, cfg] of Object.entries(EVENT_CATEGORY_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
      }
    });
  });

  describe("PRIORITY_CONFIG", () => {
    it("has all 4 priorities", () => {
      expect(PRIORITY_CONFIG.critical).toBeDefined();
      expect(PRIORITY_CONFIG.high).toBeDefined();
      expect(PRIORITY_CONFIG.routine).toBeDefined();
      expect(PRIORITY_CONFIG.positive).toBeDefined();
    });
  });

  describe("SHIFT_CONFIG", () => {
    it("has all 4 shift periods", () => {
      expect(SHIFT_CONFIG.day).toBeDefined();
      expect(SHIFT_CONFIG.evening).toBeDefined();
      expect(SHIFT_CONFIG.night).toBeDefined();
      expect(SHIFT_CONFIG.waking_night).toBeDefined();
    });

    it("each shift has label, icon, hours", () => {
      for (const [, cfg] of Object.entries(SHIFT_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
        expect(cfg.hours).toBeTruthy();
      }
    });
  });

  describe("RAG_CONFIG", () => {
    it("has red, amber, green", () => {
      expect(RAG_CONFIG.red).toBeDefined();
      expect(RAG_CONFIG.amber).toBeDefined();
      expect(RAG_CONFIG.green).toBeDefined();
    });
  });

  // ── generateDemoBrief ─────────────────────────────────────────────────────
  describe("generateDemoBrief", () => {
    it("returns a complete brief structure", () => {
      const brief = generateDemoBrief("2026-05-12");
      expect(brief.date).toBe("2026-05-12");
      expect(brief.shiftPeriod).toBeTruthy();
      expect(brief.events.length).toBeGreaterThan(0);
      expect(brief.moodSnapshots.length).toBeGreaterThan(0);
      expect(brief.staffing.length).toBeGreaterThan(0);
      expect(brief.headline).toBeTruthy();
      expect(["red", "amber", "green"]).toContain(brief.overallRag);
    });

    it("events have required fields", () => {
      const brief = generateDemoBrief("2026-05-12");
      for (const evt of brief.events) {
        expect(evt.id).toBeTruthy();
        expect(evt.time).toBeTruthy();
        expect(evt.category).toBeTruthy();
        expect(evt.priority).toBeTruthy();
        expect(evt.summary).toBeTruthy();
        expect(typeof evt.requiresFollowUp).toBe("boolean");
      }
    });

    it("mood snapshots have child name and trend", () => {
      const brief = generateDemoBrief("2026-05-12");
      for (const ms of brief.moodSnapshots) {
        expect(ms.childName).toBeTruthy();
        expect(["improving", "declining", "stable", "unknown"]).toContain(ms.trend);
      }
    });

    it("staffing notes have shift and counts", () => {
      const brief = generateDemoBrief("2026-05-12");
      for (const s of brief.staffing) {
        expect(["day", "evening", "night", "waking_night"]).toContain(s.shift);
        expect(typeof s.planned).toBe("number");
        expect(typeof s.actual).toBe("number");
      }
    });

    it("includes events with follow-up flags", () => {
      const brief = generateDemoBrief("2026-05-12");
      const followUps = brief.events.filter((e) => e.requiresFollowUp);
      expect(followUps.length).toBeGreaterThan(0);
    });

    it("includes positive events", () => {
      const brief = generateDemoBrief("2026-05-12");
      const positives = brief.events.filter((e) => e.priority === "positive");
      expect(positives.length).toBeGreaterThan(0);
    });

    it("RAG status reflects event priorities", () => {
      const brief = generateDemoBrief("2026-05-12");
      const hasHigh = brief.events.some((e) => e.priority === "high");
      if (hasHigh) {
        expect(["red", "amber"]).toContain(brief.overallRag);
      }
    });

    it("compliance gaps have area and detail", () => {
      const brief = generateDemoBrief("2026-05-12");
      for (const gap of brief.complianceGaps) {
        expect(gap.area).toBeTruthy();
        expect(gap.detail).toBeTruthy();
        expect(["critical", "warning"]).toContain(gap.severity);
      }
    });
  });
});
