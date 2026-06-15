// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraIncidentAnalytics — computeIncidentAnalytics pure engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-incident-analytics";

const { TREND_CONFIG, computeIncidentAnalytics } = _testing;

const TODAY = "2026-06-15";

function daysBack(n: number): string {
  const d = new Date(Date.parse(TODAY + "T00:00:00Z") - n * 864e5);
  return d.toISOString().slice(0, 10);
}

function makeInc(id: string, overrides: Record<string, unknown>) {
  return {
    id,
    home_id: "home_oak",
    type: "behaviour_incident",
    severity: "medium",
    child_id: "yp_alex",
    date: daysBack(5),
    time: "18:00",
    description: "Test incident",
    location: null,
    witnessed_by: [],
    reported_by: "staff_darren",
    immediate_action: "",
    injuries: null,
    police_involved: false,
    ambulance_called: false,
    requires_oversight: true,
    oversight_note: null,
    oversight_by: null,
    oversight_at: null,
    status: "open",
    notified_to: [],
    linked_placement_id: null,
    linked_risk_assessment_id: null,
    created_at: "",
    updated_at: "",
    created_by: "staff_darren",
    updated_by: "staff_darren",
    version: 1,
    change_history: [],
    ...overrides,
  };
}

// Spread across 30-day and 90-day windows, multiple children, types, times
const INCIDENTS = [
  makeInc("i1", { type: "behaviour_incident", severity: "high",   child_id: "yp_alex",   date: daysBack(3),  time: "19:00", oversight_by: "staff_darren" }),
  makeInc("i2", { type: "physical_intervention", severity: "high", child_id: "yp_alex",   date: daysBack(7),  time: "20:00" }),
  makeInc("i3", { type: "self_harm",  severity: "critical", child_id: "yp_jordan", date: daysBack(10), time: "09:00" }),
  makeInc("i4", { type: "behaviour_incident", severity: "medium", child_id: "yp_casey",  date: daysBack(15), time: "14:00", oversight_by: "staff_darren" }),
  makeInc("i5", { type: "safeguarding_concern", severity: "high", child_id: "yp_riley",  date: daysBack(50), time: "16:00" }),
  makeInc("i6", { type: "behaviour_incident", severity: "low",   child_id: "yp_casey",  date: daysBack(70), time: "11:00" }),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
] as any[];

describe("CaraIncidentAnalytics", () => {
  describe("TREND_CONFIG", () => {
    it("has increasing, stable, and decreasing", () => {
      expect(TREND_CONFIG.increasing).toBeDefined();
      expect(TREND_CONFIG.stable).toBeDefined();
      expect(TREND_CONFIG.decreasing).toBeDefined();
    });

    it("each trend has icon, label, and colour", () => {
      for (const [, cfg] of Object.entries(TREND_CONFIG)) {
        expect((cfg as { icon: unknown }).icon).toBeTruthy();
        expect((cfg as { label: string }).label).toBeTruthy();
        expect((cfg as { colour: string }).colour).toBeTruthy();
      }
    });
  });

  describe("computeIncidentAnalytics", () => {
    const data = computeIncidentAnalytics(INCIDENTS, TODAY);

    it("has period label", () => {
      expect(data.period).toBeTruthy();
    });

    it("has valid incident counts — 4 in 30d, 6 in 90d", () => {
      expect(data.totalIncidents30d).toBe(4);
      expect(data.totalIncidents90d).toBe(6);
    });

    it("totalIncidents90d >= totalIncidents30d", () => {
      expect(data.totalIncidents90d).toBeGreaterThanOrEqual(data.totalIncidents30d);
    });

    it("has valid trend", () => {
      expect(["increasing", "stable", "decreasing"]).toContain(data.trend);
    });

    it("has 4 time slots", () => {
      expect(data.timeSlots).toHaveLength(4);
    });

    it("each time slot has required fields", () => {
      for (const slot of data.timeSlots) {
        expect(slot.label).toBeTruthy();
        expect(typeof slot.count).toBe("number");
        expect(typeof slot.percentage).toBe("number");
      }
    });

    it("time slot percentages round to ~100", () => {
      const total = data.timeSlots.reduce((sum, s) => sum + s.percentage, 0);
      expect(total).toBeGreaterThanOrEqual(98);
      expect(total).toBeLessThanOrEqual(102);
    });

    it("has trigger patterns with valid fields", () => {
      expect(data.triggers.length).toBeGreaterThan(0);
      for (const t of data.triggers) {
        expect(t.trigger).toBeTruthy();
        expect(typeof t.count).toBe("number");
        expect(typeof t.percentage).toBe("number");
        expect(["increasing", "stable", "decreasing"]).toContain(t.trend);
      }
    });

    it("has child patterns from 30d incidents", () => {
      expect(data.childPatterns.length).toBeGreaterThan(0);
      for (const cp of data.childPatterns) {
        expect(cp.childName).toBeTruthy();
        expect(typeof cp.count30d).toBe("number");
        expect(typeof cp.count90d).toBe("number");
        expect(["increasing", "stable", "decreasing"]).toContain(cp.trend);
        expect(cp.primaryTrigger).toBeTruthy();
        expect(cp.peakTime).toBeTruthy();
      }
    });

    it("has Cara insights", () => {
      expect(data.caraInsights.length).toBeGreaterThan(0);
      for (const insight of data.caraInsights) {
        expect(insight.length).toBeGreaterThan(10);
      }
    });

    it("physical intervention rate is between 0 and 100", () => {
      expect(data.physicalInterventionRate).toBeGreaterThanOrEqual(0);
      expect(data.physicalInterventionRate).toBeLessThanOrEqual(100);
    });

    it("management oversight rate is between 0 and 100", () => {
      expect(data.managementOversightRate).toBeGreaterThanOrEqual(0);
      expect(data.managementOversightRate).toBeLessThanOrEqual(100);
    });

    it("returns zero counts gracefully when no incidents", () => {
      const empty = computeIncidentAnalytics([], TODAY);
      expect(empty.totalIncidents30d).toBe(0);
      expect(empty.totalIncidents90d).toBe(0);
      expect(empty.triggers).toHaveLength(0);
      expect(empty.childPatterns).toHaveLength(0);
    });
  });
});
