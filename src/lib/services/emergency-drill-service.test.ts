import { describe, it, expect } from "vitest";
import {
  computeDrillMetrics,
  identifyDrillAlerts,
  type EmergencyDrillRecord,
} from "./emergency-drill-service";

function makeRecord(overrides: Partial<EmergencyDrillRecord> = {}): EmergencyDrillRecord {
  return {
    id: "drill-1",
    home_id: "home-1",
    drill_type: "fire_evacuation",
    drill_date: "2026-05-01",
    drill_outcome: "successful",
    time_of_day: "day_shift",
    staff_readiness: "fully_prepared",
    evacuation_time_seconds: 120,
    all_children_accounted: true,
    all_staff_participated: true,
    assembly_point_used: true,
    equipment_working: true,
    children_informed_beforehand: false,
    children_distressed: false,
    learning_points: [],
    actions_required: [],
    staff_present: 4,
    children_present: 3,
    conducted_by: "Manager",
    next_drill_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("emergency-drill-service", () => {
  // ── computeDrillMetrics ───────────────────────────────────────────

  describe("computeDrillMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeDrillMetrics([]);
      expect(m.total_drills).toBe(0);
      expect(m.fire_evacuation_count).toBe(0);
      expect(m.successful_rate).toBeNull();;
      expect(m.average_evacuation_time).toBeNull();;
      expect(m.unprepared_count).toBe(0);
    });

    it("counts drill types correctly", () => {
      const records = [
        makeRecord({ id: "1", drill_type: "fire_evacuation" }),
        makeRecord({ id: "2", drill_type: "fire_evacuation" }),
        makeRecord({ id: "3", drill_type: "lockdown" }),
        makeRecord({ id: "4", drill_type: "missing_child" }),
      ];
      const m = computeDrillMetrics(records);
      expect(m.total_drills).toBe(4);
      expect(m.fire_evacuation_count).toBe(2);
      expect(m.lockdown_count).toBe(1);
      expect(m.missing_child_count).toBe(1);
    });

    it("computes rates and averages correctly", () => {
      const records = [
        makeRecord({ id: "1", drill_outcome: "successful", all_children_accounted: true, staff_readiness: "fully_prepared", evacuation_time_seconds: 100 }),
        makeRecord({ id: "2", drill_outcome: "failed", all_children_accounted: false, staff_readiness: "unprepared", evacuation_time_seconds: 200 }),
      ];
      const m = computeDrillMetrics(records);
      expect(m.successful_rate).toBe(50);
      expect(m.failed_count).toBe(1);
      expect(m.all_children_accounted_rate).toBe(50);
      expect(m.fully_prepared_rate).toBe(50);
      expect(m.unprepared_count).toBe(1);
      expect(m.average_evacuation_time).toBe(150);
    });

    it("counts children_distressed and cancelled", () => {
      const records = [
        makeRecord({ id: "1", children_distressed: true, drill_outcome: "cancelled" }),
        makeRecord({ id: "2", children_distressed: false, drill_outcome: "successful" }),
      ];
      const m = computeDrillMetrics(records);
      expect(m.children_distressed_count).toBe(1);
      expect(m.cancelled_count).toBe(1);
    });

    it("handles null evacuation_time_seconds gracefully", () => {
      const records = [
        makeRecord({ id: "1", evacuation_time_seconds: null }),
        makeRecord({ id: "2", evacuation_time_seconds: 90 }),
      ];
      const m = computeDrillMetrics(records);
      expect(m.average_evacuation_time).toBe(90);
    });
  });

  // ── identifyDrillAlerts ───────────────────────────────────────────

  describe("identifyDrillAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyDrillAlerts([])).toHaveLength(0);
    });

    it("fires children_not_accounted (critical) when children not accounted and not cancelled", () => {
      const rec = makeRecord({
        id: "ca-1",
        all_children_accounted: false,
        drill_outcome: "partial_success",
      });
      const alerts = identifyDrillAlerts([rec]);
      const found = alerts.filter((a) => a.type === "children_not_accounted");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
    });

    it("does not fire children_not_accounted when drill is cancelled", () => {
      const rec = makeRecord({
        id: "ca-2",
        all_children_accounted: false,
        drill_outcome: "cancelled",
      });
      const alerts = identifyDrillAlerts([rec]);
      const found = alerts.filter((a) => a.type === "children_not_accounted");
      expect(found).toHaveLength(0);
    });

    it("fires drill_failed (high) for failed drills", () => {
      const rec = makeRecord({ id: "df-1", drill_outcome: "failed" });
      const alerts = identifyDrillAlerts([rec]);
      const found = alerts.filter((a) => a.type === "drill_failed");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires staff_unprepared (high) when >= 1 drill shows staff unprepared", () => {
      const rec = makeRecord({ id: "su-1", staff_readiness: "unprepared" });
      const alerts = identifyDrillAlerts([rec]);
      const found = alerts.filter((a) => a.type === "staff_unprepared");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires equipment_fault (high) when >= 1 drill has equipment not working (non-cancelled)", () => {
      const rec = makeRecord({
        id: "ef-1",
        equipment_working: false,
        drill_outcome: "partial_success",
      });
      const alerts = identifyDrillAlerts([rec]);
      const found = alerts.filter((a) => a.type === "equipment_fault");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires drill_overdue (medium) when next_drill_date is in the past", () => {
      const rec = makeRecord({
        id: "do-1",
        next_drill_date: "2026-01-01",
      });
      const alerts = identifyDrillAlerts([rec]);
      const found = alerts.filter((a) => a.type === "drill_overdue");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });
  });
});
