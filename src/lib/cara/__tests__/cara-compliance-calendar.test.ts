// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraComplianceCalendar _testing exports
//
// The widget no longer ships hardcoded demo deadlines (fictional children must
// never render on a live care-record system), so there is no demo generator to
// assert on. These tests cover the pure config maps that drive the real render.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-compliance-calendar";

const { STATUS_CONFIG, TYPE_ICONS } = _testing;

describe("CaraComplianceCalendar", () => {
  describe("STATUS_CONFIG", () => {
    it("has all five deadline statuses", () => {
      expect(STATUS_CONFIG.overdue).toBeDefined();
      expect(STATUS_CONFIG.due_today).toBeDefined();
      expect(STATUS_CONFIG.due_soon).toBeDefined();
      expect(STATUS_CONFIG.upcoming).toBeDefined();
      expect(STATUS_CONFIG.complete).toBeDefined();
    });

    it("each status has label, colour, bg, and dot", () => {
      for (const [, cfg] of Object.entries(STATUS_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
        expect(cfg.dot).toBeTruthy();
      }
    });
  });

  describe("TYPE_ICONS", () => {
    it("has icons for all deadline types", () => {
      const types = [
        "reg45_report", "supervision", "training_renewal",
        "risk_assessment_review", "care_plan_review", "fire_drill",
        "medication_audit", "lac_review", "annual_review",
      ];
      for (const t of types) {
        expect(TYPE_ICONS[t as keyof typeof TYPE_ICONS]).toBeDefined();
      }
    });
  });
});
