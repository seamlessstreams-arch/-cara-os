import { describe, it, expect } from "vitest";
import {
  computeInfectionControlMetrics,
  identifyInfectionControlAlerts,
  type InfectionControlRecord,
} from "./infection-control-service";

function makeRecord(overrides: Partial<InfectionControlRecord> = {}): InfectionControlRecord {
  return {
    id: "ic-1",
    home_id: "home-1",
    event_type: "hand_hygiene_audit",
    event_date: "2026-05-10",
    hygiene_standard: "good",
    outbreak_status: "no_outbreak",
    ppe_compliance: "fully_compliant",
    hand_washing_observed: true,
    sanitiser_available: true,
    cleaning_schedule_followed: true,
    laundry_procedures_followed: true,
    food_hygiene_maintained: true,
    children_symptomatic: 0,
    staff_symptomatic: 0,
    gp_contacted: false,
    public_health_notified: false,
    isolation_measures_in_place: false,
    issues_found: [],
    actions_taken: [],
    assessed_by: "Jane Doe",
    next_review_date: "2026-06-10",
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

describe("infection-control-service", () => {
  // -- computeInfectionControlMetrics -------------------------------------------

  describe("computeInfectionControlMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeInfectionControlMetrics([]);
      expect(m.total_records).toBe(0);
      expect(m.hand_hygiene_audit_count).toBe(0);
      expect(m.excellent_hygiene_rate).toBeNull();;
      expect(m.hand_washing_observed_rate).toBeNull();;
      expect(m.ppe_fully_compliant_rate).toBeNull();;
      expect(m.total_children_symptomatic).toBe(0);
      expect(m.active_outbreak_count).toBe(0);
    });

    it("counts event types correctly", () => {
      const records = [
        makeRecord({ event_type: "hand_hygiene_audit" }),
        makeRecord({ id: "r2", event_type: "cleaning_schedule_check" }),
        makeRecord({ id: "r3", event_type: "outbreak_management" }),
        makeRecord({ id: "r4", event_type: "infection_incident" }),
      ];
      const m = computeInfectionControlMetrics(records);
      expect(m.hand_hygiene_audit_count).toBe(1);
      expect(m.cleaning_check_count).toBe(1);
      expect(m.outbreak_count).toBe(1);
      expect(m.infection_incident_count).toBe(1);
    });

    it("computes hygiene and compliance rates", () => {
      const records = [
        makeRecord({ hygiene_standard: "excellent", ppe_compliance: "fully_compliant" }),
        makeRecord({ id: "r2", hygiene_standard: "poor", ppe_compliance: "non_compliant" }),
      ];
      const m = computeInfectionControlMetrics(records);
      expect(m.excellent_hygiene_rate).toBe(50);
      expect(m.poor_hygiene_count).toBe(1);
      expect(m.ppe_fully_compliant_rate).toBe(50);
      expect(m.ppe_non_compliant_count).toBe(1);
    });

    it("sums symptomatic counts", () => {
      const records = [
        makeRecord({ children_symptomatic: 2, staff_symptomatic: 1 }),
        makeRecord({ id: "r2", children_symptomatic: 3, staff_symptomatic: 0 }),
      ];
      const m = computeInfectionControlMetrics(records);
      expect(m.total_children_symptomatic).toBe(5);
      expect(m.total_staff_symptomatic).toBe(1);
    });

    it("counts active outbreaks (suspected + confirmed)", () => {
      const records = [
        makeRecord({ outbreak_status: "suspected" }),
        makeRecord({ id: "r2", outbreak_status: "confirmed" }),
        makeRecord({ id: "r3", outbreak_status: "resolved" }),
      ];
      const m = computeInfectionControlMetrics(records);
      expect(m.active_outbreak_count).toBe(2);
    });

    it("computes boolean rates for hygiene practices", () => {
      const records = [
        makeRecord({
          hand_washing_observed: true,
          sanitiser_available: true,
          cleaning_schedule_followed: false,
          laundry_procedures_followed: true,
          food_hygiene_maintained: false,
        }),
      ];
      const m = computeInfectionControlMetrics(records);
      expect(m.hand_washing_observed_rate).toBe(100);
      expect(m.sanitiser_available_rate).toBe(100);
      expect(m.cleaning_schedule_followed_rate).toBe(0);
      expect(m.laundry_procedures_rate).toBe(100);
      expect(m.food_hygiene_rate).toBe(0);
    });
  });

  // -- identifyInfectionControlAlerts -------------------------------------------

  describe("identifyInfectionControlAlerts", () => {
    it("returns no alerts for empty data", () => {
      expect(identifyInfectionControlAlerts([])).toHaveLength(0);
    });

    it("fires critical confirmed_outbreak", () => {
      const records = [makeRecord({ outbreak_status: "confirmed", children_symptomatic: 3, staff_symptomatic: 1 })];
      const alerts = identifyInfectionControlAlerts(records);
      const outbreak = alerts.find((a) => a.type === "confirmed_outbreak");
      expect(outbreak).toBeDefined();
      expect(outbreak!.severity).toBe("critical");
    });

    it("fires high poor_hygiene", () => {
      const records = [makeRecord({ hygiene_standard: "poor" })];
      const alerts = identifyInfectionControlAlerts(records);
      expect(alerts.find((a) => a.type === "poor_hygiene")).toBeDefined();
    });

    it("fires high ppe_non_compliant when >= 1 non-compliant", () => {
      const records = [makeRecord({ ppe_compliance: "non_compliant" })];
      const alerts = identifyInfectionControlAlerts(records);
      const ppe = alerts.find((a) => a.type === "ppe_non_compliant");
      expect(ppe).toBeDefined();
      expect(ppe!.severity).toBe("high");
    });

    it("fires medium cleaning_not_followed when >= 3 not followed", () => {
      const records = Array.from({ length: 3 }, (_, i) =>
        makeRecord({ id: `r${i}`, cleaning_schedule_followed: false }),
      );
      const alerts = identifyInfectionControlAlerts(records);
      expect(alerts.find((a) => a.type === "cleaning_not_followed")).toBeDefined();
    });

    it("does NOT fire cleaning_not_followed when only 2 not followed", () => {
      const records = [
        makeRecord({ cleaning_schedule_followed: false }),
        makeRecord({ id: "r2", cleaning_schedule_followed: false }),
      ];
      const alerts = identifyInfectionControlAlerts(records);
      expect(alerts.find((a) => a.type === "cleaning_not_followed")).toBeUndefined();
    });
  });
});
