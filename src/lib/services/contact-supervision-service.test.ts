import { describe, it, expect } from "vitest";
import {
  computeContactSupervisionMetrics,
  identifyContactSupervisionAlerts,
  type ContactSupervisionRecord,
} from "./contact-supervision-service";

function makeRecord(overrides: Partial<ContactSupervisionRecord> = {}): ContactSupervisionRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    contact_type: "face_to_face",
    supervision_level: "full_supervision",
    child_response: "positive",
    contact_outcome: "completed_as_planned",
    contact_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    supervised_by: "Staff A",
    risk_assessment_current: true,
    child_prepared: true,
    child_debriefed: true,
    court_order_complied: true,
    safeguarding_concerns: false,
    transport_arranged: true,
    venue_appropriate: true,
    social_worker_informed: true,
    care_plan_linked: true,
    child_views_sought: true,
    recorded_within_24h: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    contact_duration_minutes: 60,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("contact-supervision-service", () => {
  // ── computeContactSupervisionMetrics ───────────────────────────────────

  describe("computeContactSupervisionMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeContactSupervisionMetrics([]);
      expect(m.total_contacts).toBe(0);
      expect(m.distressed_count).toBe(0);
      expect(m.refused_count).toBe(0);
      expect(m.cancelled_count).toBe(0);
      expect(m.risk_assessment_rate).toBeNull();;
      expect(m.average_duration).toBeNull();;
      expect(m.unique_children).toBe(0);
    });

    it("computes populated metrics correctly", () => {
      const records = [
        makeRecord({ id: "r1", child_name: "A", child_response: "positive", contact_outcome: "completed_as_planned", contact_duration_minutes: 60 }),
        makeRecord({ id: "r2", child_name: "B", child_response: "distressed", contact_outcome: "shortened", contact_duration_minutes: 30 }),
        makeRecord({ id: "r3", child_name: "A", child_response: "refused", contact_outcome: "cancelled_by_family", contact_duration_minutes: 0, safeguarding_concerns: true }),
      ];
      const m = computeContactSupervisionMetrics(records);
      expect(m.total_contacts).toBe(3);
      expect(m.distressed_count).toBe(1);
      expect(m.refused_count).toBe(1);
      expect(m.cancelled_count).toBe(1);
      expect(m.safeguarding_concerns_count).toBe(1);
      expect(m.unique_children).toBe(2);
      expect(m.average_duration).toBe(30);
      expect(m.by_child_response["positive"]).toBe(1);
      expect(m.by_child_response["distressed"]).toBe(1);
      expect(m.by_contact_outcome["completed_as_planned"]).toBe(1);
    });

    it("computes boolean rates correctly", () => {
      const records = [
        makeRecord({ id: "r1", risk_assessment_current: true, child_prepared: true, child_debriefed: true }),
        makeRecord({ id: "r2", risk_assessment_current: false, child_prepared: false, child_debriefed: false }),
      ];
      const m = computeContactSupervisionMetrics(records);
      expect(m.risk_assessment_rate).toBe(50);
      expect(m.child_prepared_rate).toBe(50);
      expect(m.child_debriefed_rate).toBe(50);
    });
  });

  // ── identifyContactSupervisionAlerts ───────────────────────────────────

  describe("identifyContactSupervisionAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyContactSupervisionAlerts([])).toEqual([]);
    });

    it("flags safeguarding_during_contact (critical)", () => {
      const records = [makeRecord({ safeguarding_concerns: true })];
      const alerts = identifyContactSupervisionAlerts(records);
      expect(alerts.some((a) => a.type === "safeguarding_during_contact" && a.severity === "critical")).toBe(true);
    });

    it("flags child_not_debriefed when >= 1 record has child not debriefed (high)", () => {
      const records = [makeRecord({ child_debriefed: false })];
      const alerts = identifyContactSupervisionAlerts(records);
      expect(alerts.some((a) => a.type === "child_not_debriefed" && a.severity === "high")).toBe(true);
    });

    it("flags risk_assessment_outdated when >= 1 record has outdated risk assessment (high)", () => {
      const records = [makeRecord({ risk_assessment_current: false })];
      const alerts = identifyContactSupervisionAlerts(records);
      expect(alerts.some((a) => a.type === "risk_assessment_outdated" && a.severity === "high")).toBe(true);
    });

    it("flags child_not_prepared when >= 2 records not prepared (medium)", () => {
      const records = [
        makeRecord({ id: "r1", child_prepared: false }),
        makeRecord({ id: "r2", child_prepared: false }),
      ];
      const alerts = identifyContactSupervisionAlerts(records);
      expect(alerts.some((a) => a.type === "child_not_prepared" && a.severity === "medium")).toBe(true);
    });

    it("does NOT flag child_not_prepared when only 1 record not prepared", () => {
      const records = [
        makeRecord({ id: "r1", child_prepared: false }),
      ];
      const alerts = identifyContactSupervisionAlerts(records);
      expect(alerts.some((a) => a.type === "child_not_prepared")).toBe(false);
    });

    it("flags venue_not_appropriate when >= 2 records with venue not appropriate (medium)", () => {
      const records = [
        makeRecord({ id: "r1", venue_appropriate: false }),
        makeRecord({ id: "r2", venue_appropriate: false }),
      ];
      const alerts = identifyContactSupervisionAlerts(records);
      expect(alerts.some((a) => a.type === "venue_not_appropriate" && a.severity === "medium")).toBe(true);
    });
  });
});
