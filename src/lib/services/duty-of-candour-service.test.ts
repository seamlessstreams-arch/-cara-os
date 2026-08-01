import { describe, it, expect } from "vitest";
import {
  computeCandourMetrics,
  identifyCandourAlerts,
  type CandourRecord,
} from "./duty-of-candour-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeRecord(overrides: Partial<CandourRecord> = {}): CandourRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    trigger: "serious_injury",
    incident_date: "2026-05-01",
    identified_date: "2026-05-01",
    status: "identified",
    description: "Test incident",
    verbal_apology_date: null,
    written_apology_date: null,
    family_informed: true,
    social_worker_informed: true,
    ofsted_notified: true,
    ofsted_notification_date: "2026-05-02",
    investigation_lead: null,
    investigation_outcome: null,
    investigation_completed_date: null,
    lessons_learned: [],
    actions_taken: [],
    final_response_date: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("duty-of-candour-service", () => {
  // ── computeCandourMetrics ─────────────────────────────────────────

  describe("computeCandourMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeCandourMetrics([], NOW);
      expect(m.total_records).toBe(0);
      expect(m.open_cases).toBe(0);
      expect(m.closed_cases).toBe(0);
      expect(m.verbal_apology_given).toBe(0);
      expect(m.written_apology_sent).toBe(0);
      expect(m.family_informed_rate).toBeNull();;
      expect(m.ofsted_notified_rate).toBeNull();;
      expect(m.avg_days_to_verbal).toBe(0);
      expect(m.avg_days_to_written).toBe(0);
      expect(m.lessons_captured).toBe(0);
    });

    it("counts open and closed cases correctly", () => {
      const records = [
        makeRecord({ id: "1", status: "identified" }),
        makeRecord({ id: "2", status: "investigation_underway" }),
        makeRecord({ id: "3", status: "closed" }),
        makeRecord({ id: "4", status: "final_response_sent" }),
      ];
      const m = computeCandourMetrics(records, NOW);
      expect(m.total_records).toBe(4);
      expect(m.open_cases).toBe(2);
      expect(m.closed_cases).toBe(2);
    });

    it("computes verbal/written apology counts and averages", () => {
      const records = [
        makeRecord({
          id: "1",
          incident_date: "2026-05-01",
          verbal_apology_date: "2026-05-03",
          written_apology_date: "2026-05-07",
        }),
        makeRecord({
          id: "2",
          incident_date: "2026-05-01",
          verbal_apology_date: "2026-05-05",
          written_apology_date: null,
        }),
      ];
      const m = computeCandourMetrics(records, NOW);
      expect(m.verbal_apology_given).toBe(2);
      expect(m.written_apology_sent).toBe(1);
      // avg verbal: (2 + 4) / 2 = 3.0
      expect(m.avg_days_to_verbal).toBe(3);
      // avg written: 6 / 1 = 6.0
      expect(m.avg_days_to_written).toBe(6);
    });

    it("computes family_informed_rate and ofsted_notified_rate", () => {
      const records = [
        makeRecord({ id: "1", family_informed: true, ofsted_notified: true }),
        makeRecord({ id: "2", family_informed: false, ofsted_notified: false }),
      ];
      const m = computeCandourMetrics(records, NOW);
      expect(m.family_informed_rate).toBe(50);
      expect(m.ofsted_notified_rate).toBe(50);
    });

    it("builds by_trigger, by_status, by_outcome breakdowns", () => {
      const records = [
        makeRecord({ id: "1", trigger: "death", status: "closed", investigation_outcome: "upheld" }),
        makeRecord({ id: "2", trigger: "death", status: "identified", investigation_outcome: "not_upheld" }),
        makeRecord({ id: "3", trigger: "medication_error", status: "closed", investigation_outcome: null }),
      ];
      const m = computeCandourMetrics(records, NOW);
      expect(m.by_trigger["death"]).toBe(2);
      expect(m.by_trigger["medication_error"]).toBe(1);
      expect(m.by_status["closed"]).toBe(2);
      expect(m.by_status["identified"]).toBe(1);
      expect(m.by_outcome["upheld"]).toBe(1);
      expect(m.by_outcome["not_upheld"]).toBe(1);
      expect(m.investigation_upheld).toBe(1);
    });

    it("counts lessons_captured and investigation_complete", () => {
      const records = [
        makeRecord({ id: "1", lessons_learned: ["Lesson 1"], investigation_completed_date: "2026-05-10" }),
        makeRecord({ id: "2", lessons_learned: [], investigation_completed_date: null }),
      ];
      const m = computeCandourMetrics(records, NOW);
      expect(m.lessons_captured).toBe(1);
      expect(m.investigation_complete).toBe(1);
    });
  });

  // ── identifyCandourAlerts ─────────────────────────────────────────

  describe("identifyCandourAlerts", () => {
    it("returns empty alerts for empty data", () => {
      const alerts = identifyCandourAlerts([], NOW);
      expect(alerts).toHaveLength(0);
    });

    it("fires no_verbal_apology when >10 days since incident with status identified and no verbal apology", () => {
      // incident 15 days ago from NOW
      const rec = makeRecord({
        id: "a1",
        incident_date: "2026-05-06",
        verbal_apology_date: null,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([rec], NOW);
      const found = alerts.filter((a) => a.type === "no_verbal_apology");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
    });

    it("fires no_written_apology when verbal given but >14 days with no written", () => {
      const rec = makeRecord({
        id: "a2",
        incident_date: "2026-05-01",
        verbal_apology_date: "2026-05-03",
        written_apology_date: null,
        status: "investigation_underway",
      });
      const alerts = identifyCandourAlerts([rec], NOW);
      const found = alerts.filter((a) => a.type === "no_written_apology");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires family_not_informed when family not informed and status not closed", () => {
      const rec = makeRecord({
        id: "a3",
        family_informed: false,
        status: "investigation_underway",
      });
      const alerts = identifyCandourAlerts([rec], NOW);
      const found = alerts.filter((a) => a.type === "family_not_informed");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires ofsted_not_notified for notifiable triggers when ofsted not notified", () => {
      const triggers = ["death", "serious_injury", "hospitalisation", "abuse_allegation", "police_involvement"] as const;
      for (const trigger of triggers) {
        const rec = makeRecord({
          id: `ofs-${trigger}`,
          trigger,
          ofsted_notified: false,
          status: "identified",
        });
        const alerts = identifyCandourAlerts([rec], NOW);
        const found = alerts.filter((a) => a.type === "ofsted_not_notified");
        expect(found.length).toBeGreaterThanOrEqual(1);
        expect(found[0].severity).toBe("critical");
      }
    });

    it("fires investigation_prolonged when investigation_underway >28 days", () => {
      const rec = makeRecord({
        id: "a5",
        incident_date: "2026-04-01",
        status: "investigation_underway",
        investigation_completed_date: null,
      });
      const alerts = identifyCandourAlerts([rec], NOW);
      const found = alerts.filter((a) => a.type === "investigation_prolonged");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("does not fire ofsted_not_notified for non-notifiable triggers", () => {
      const rec = makeRecord({
        id: "a6",
        trigger: "medication_error",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([rec], NOW);
      const found = alerts.filter((a) => a.type === "ofsted_not_notified");
      expect(found).toHaveLength(0);
    });
  });
});
